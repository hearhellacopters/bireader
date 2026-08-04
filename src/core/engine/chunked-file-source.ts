/**
 * @file Phase-2 engine brick: windowed file Source.
 *
 * A {@link Source} over an open file handle with a fixed-size chunk (window) cache -
 * the async file-mode machinery lifted out of the engine god-class into one unit that
 * can be tested in isolation. It carries the v5 correctness fixes that were the hard
 * part of that machinery:
 *   - `windowSize === 0` loads the whole file as a single chunk (length = size,
 *     chunk-relative offset computed as `pos - chunkIndex*windowSize`, never `% 0`).
 *   - growing / shrinking invalidates the partial boundary chunk so a later flush
 *     cannot write a stale short/long buffer back over the file.
 *
 * The `fs/promises`-like handle is injected, so this brick is testable without the
 * rest of the library. Not yet wired into the shipping facades.
 */
import type { Source } from './source.js';

/** The subset of fs/promises FileHandle this source needs. */
export interface FileHandleLike {
    read(buffer: Uint8Array, offset: number, length: number, position: number): Promise<{ bytesRead: number }>;
    write(buffer: Uint8Array, offset: number, length: number, position: number): Promise<{ bytesWritten: number }>;
    truncate(len: number): Promise<void>;
    stat(): Promise<{ size: number }>;
    close(): Promise<void>;
}

export class ChunkedFileSource implements Source {
    #fd: FileHandleLike | null;
    #size: number;
    #window: number;
    #readOnly: boolean;

    #chunks: (Uint8Array | null)[] = [];
    #chunkPromises: (Promise<Uint8Array> | null)[] = [];
    #dirty: Set<number> = new Set();

    constructor(fd: FileHandleLike, size: number, windowSize: number, readOnly: boolean) {
        this.#fd = fd;

        this.#size = size;

        this.#window = windowSize;

        this.#readOnly = readOnly;

        const n = this.#numChunks();

        this.#chunks = new Array(n).fill(null);

        this.#chunkPromises = new Array(n).fill(null);
    }

    get size(): number {
        return this.#size;
    }

    get readOnly(): boolean {
        return this.#readOnly;
    }

    /** File contents are read as Buffers, so sub-array results are Buffers. */
    get isBuffer(): boolean {
        return typeof Buffer !== 'undefined';
    }

    #numChunks(): number {
        return this.#window === 0 ? 1 : Math.ceil(this.#size / this.#window);
    }

    #chunkIndex(offset: number): number {
        return this.#window === 0 ? 0 : Math.floor(offset / this.#window);
    }

    async #loadChunk(index: number): Promise<Uint8Array> {
        if (this.#window !== 0 && index >= this.#chunks.length) {
            throw new RangeError(`Chunk ${index} out of range`);
        }

        const cached = this.#chunks[index];

        if (cached !== null && cached !== undefined) {
            return cached;
        }

        const pending = this.#chunkPromises[index];

        if (pending) {
            return await pending;
        }

        const start = index * this.#window;

        const length = this.#window === 0 ? this.#size : Math.min(this.#window, this.#size - start);

        const promise = (async () => {
            const buffer = new Uint8Array(length);

            if (length > 0 && this.#fd) {
                await this.#fd.read(buffer, 0, length, start);
            }

            this.#chunks[index] = buffer;

            return buffer;
        })();

        this.#chunkPromises[index] = promise;

        return await promise;
    }

    async #ensureRange(offset: number, length: number): Promise<void> {
        if (length <= 0) {
            return;
        }

        const first = this.#chunkIndex(offset);

        const last = this.#chunkIndex(offset + length - 1);

        const promises: Promise<Uint8Array>[] = [];

        for (let i = first; i <= last && i < this.#chunks.length; i++) {
            if (this.#chunks[i] === null) {
                promises.push(this.#loadChunk(i));
            }
        }

        await Promise.all(promises);
    }

    async read(offset: number, length: number): Promise<Uint8Array> {
        if (offset < 0 || offset + length > this.#size) {
            throw new RangeError(`Read ${offset}..${offset + length} out of range (size ${this.#size})`);
        }

        const result = new Uint8Array(length);

        if (length === 0) {
            return result;
        }

        await this.#ensureRange(offset, length);

        let pos = offset;

        let written = 0;

        while (written < length) {
            const index = this.#chunkIndex(pos);

            const chunk = this.#chunks[index]!;

            const chunkOffset = pos - index * this.#window;

            const toCopy = Math.min(length - written, chunk.length - chunkOffset);

            if (toCopy <= 0) {
                throw new Error(`Chunk cache out of sync reading at ${pos} (chunk ${index}, len ${chunk.length})`);
            }

            result.set(chunk.subarray(chunkOffset, chunkOffset + toCopy), written);

            written += toCopy;

            pos += toCopy;
        }

        return result;
    }

    async write(offset: number, data: Uint8Array): Promise<void> {
        if (this.#readOnly) {
            throw new Error('Cannot write to a read-only source');
        }

        if (offset < 0 || offset + data.length > this.#size) {
            throw new RangeError(`Write ${offset}..${offset + data.length} out of range (size ${this.#size}); resize first`);
        }

        if (data.length === 0) {
            return;
        }

        await this.#ensureRange(offset, data.length);

        let pos = offset;

        let read = 0;

        while (read < data.length) {
            const index = this.#chunkIndex(pos);

            const chunk = this.#chunks[index]!;

            const chunkOffset = pos - index * this.#window;

            const toCopy = Math.min(data.length - read, chunk.length - chunkOffset);

            if (toCopy <= 0) {
                throw new Error(`Chunk cache out of sync writing at ${pos} (chunk ${index}, len ${chunk.length})`);
            }

            chunk.set(data.subarray(read, read + toCopy), chunkOffset);

            this.#dirty.add(index);

            read += toCopy;

            pos += toCopy;
        }
    }

    async resize(size: number): Promise<void> {
        if (this.#readOnly) {
            throw new Error('Cannot resize a read-only source');
        }

        if (size === this.#size) {
            return;
        }

        await this.flush();

        const oldSize = this.#size;

        if (this.#fd) {
            await this.#fd.truncate(size);
        }

        this.#size = size;

        const oldNum = this.#chunks.length;

        const newNum = this.#numChunks();

        this.#chunks.length = newNum;

        this.#chunkPromises.length = newNum;

        for (let i = oldNum; i < newNum; i++) {
            this.#chunks[i] = null;

            this.#chunkPromises[i] = null;
        }

        if (newNum < oldNum) {
            this.#dirty = new Set([...this.#dirty].filter(i => i < newNum));
        }

        // The chunk that straddled the OLD end (grow) or the NEW end (shrink) may be
        // cached with a length that no longer matches the file. Drop it so it reloads
        // at its correct extent and a stale buffer can't be flushed back.
        for (const boundary of [oldSize - 1, size - 1]) {
            if (boundary < 0) {
                continue;
            }

            const idx = this.#chunkIndex(boundary);

            if (idx < this.#chunks.length) {
                this.#chunks[idx] = null;

                this.#chunkPromises[idx] = null;

                this.#dirty.delete(idx);
            }
        }
    }

    async flush(): Promise<void> {
        if (this.#readOnly || this.#dirty.size === 0 || !this.#fd) {
            return;
        }

        const writes: Promise<{ bytesWritten: number }>[] = [];

        for (const i of this.#dirty) {
            const chunk = this.#chunks[i];

            if (!chunk) {
                continue;
            }

            writes.push(this.#fd.write(chunk, 0, chunk.length, i * this.#window));
        }

        await Promise.all(writes);

        this.#dirty.clear();
    }

    async close(): Promise<void> {
        await this.flush();

        if (this.#fd) {
            await this.#fd.close();

            this.#fd = null;
        }

        this.#chunks = [];

        this.#chunkPromises = [];

        this.#dirty.clear();
    }
}
