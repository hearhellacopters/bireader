/**
 * @file Phase-2 engine brick: synchronous byte sources.
 *
 * The sync counterpart of `source.ts` - a uniform surface for `BiSyncEngine`
 * (`BiReader` / `BiWriter`). Sync file mode is deliberately simple: like the legacy
 * `BiBase`, `FileSyncSource` loads the whole file into a buffer, operates in memory,
 * and writes it back on flush. (The chunked/windowed approach is async-only.)
 *
 * Written strict-null-safe from the start.
 */

export interface SyncSource {
    readonly size: number;
    readonly readOnly: boolean;
    read(offset: number, length: number): Uint8Array;
    write(offset: number, data: Uint8Array): void;
    resize(size: number): void;
    flush(): void;
    close(): void;
}

export class MemorySyncSource implements SyncSource {
    #data: Uint8Array;
    #readOnly: boolean;
    #isBuffer: boolean;

    constructor(data: Uint8Array, readOnly: boolean = false) {
        this.#data = data;

        this.#readOnly = readOnly;

        this.#isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(data);
    }

    get size(): number { return this.#data.length; }
    get readOnly(): boolean { return this.#readOnly; }
    get data(): Uint8Array { return this.#data; }

    read(offset: number, length: number): Uint8Array {
        if (offset < 0 || offset + length > this.#data.length) {
            throw new RangeError(`Read ${offset}..${offset + length} out of range (size ${this.#data.length})`);
        }
        return this.#data.subarray(offset, offset + length);
    }

    write(offset: number, data: Uint8Array): void {
        if (this.#readOnly) throw new Error('Cannot write to a read-only source');
        if (offset < 0 || offset + data.length > this.#data.length) {
            throw new RangeError(`Write ${offset}..${offset + data.length} out of range (size ${this.#data.length}); resize first`);
        }
        this.#data.set(data, offset);
    }

    resize(size: number): void {
        if (this.#readOnly) throw new Error('Cannot resize a read-only source');
        if (size === this.#data.length) return;
        if (this.#isBuffer) {
            const next = Buffer.alloc(size);
            (this.#data as Buffer).copy(next, 0, 0, Math.min(size, this.#data.length));
            this.#data = next;
        } else {
            const next = new Uint8Array(size);
            next.set(this.#data.subarray(0, Math.min(size, this.#data.length)));
            this.#data = next;
        }
    }

    flush(): void { /* in-memory */ }
    close(): void { /* in-memory */ }
}

/** The subset of node:fs (sync) that FileSyncSource needs. */
export interface SyncFileOps {
    fstatSync(fd: number): { size: number };
    readSync(fd: number, buffer: Uint8Array, offset: number, length: number, position: number): number;
    writeSync(fd: number, buffer: Uint8Array, offset: number, length: number, position: number): number;
    ftruncateSync(fd: number, len: number): void;
    closeSync(fd: number): void;
}

export class FileSyncSource implements SyncSource {
    #fd: number | null;
    #fs: SyncFileOps;
    #data: Uint8Array;
    #readOnly: boolean;
    #dirty: boolean = false;

    constructor(fd: number, fs: SyncFileOps, readOnly: boolean) {
        this.#fd = fd;

        this.#fs = fs;

        this.#readOnly = readOnly;

        const { size } = fs.fstatSync(fd);

        this.#data = Buffer.alloc(size);

        if (size > 0) {
            fs.readSync(fd, this.#data, 0, size, 0);
        }
    }

    get size(): number { return this.#data.length; }
    get readOnly(): boolean { return this.#readOnly; }

    read(offset: number, length: number): Uint8Array {
        if (offset < 0 || offset + length > this.#data.length) {
            throw new RangeError(`Read ${offset}..${offset + length} out of range (size ${this.#data.length})`);
        }
        return this.#data.subarray(offset, offset + length);
    }

    write(offset: number, data: Uint8Array): void {
        if (this.#readOnly) throw new Error('Cannot write to a read-only source');
        if (offset < 0 || offset + data.length > this.#data.length) {
            throw new RangeError(`Write ${offset}..${offset + data.length} out of range (size ${this.#data.length}); resize first`);
        }
        this.#data.set(data, offset);
        this.#dirty = true;
    }

    resize(size: number): void {
        if (this.#readOnly) throw new Error('Cannot resize a read-only source');
        if (size === this.#data.length) return;
        const next = Buffer.alloc(size);
        next.set(this.#data.subarray(0, Math.min(size, this.#data.length)));
        this.#data = next;
        this.#dirty = true;
    }

    flush(): void {
        if (this.#readOnly || !this.#dirty || this.#fd === null) return;
        this.#fs.writeSync(this.#fd, this.#data, 0, this.#data.length, 0);
        this.#fs.ftruncateSync(this.#fd, this.#data.length);
        this.#dirty = false;
    }

    close(): void {
        this.flush();
        if (this.#fd !== null) {
            this.#fs.closeSync(this.#fd);
            this.#fd = null;
        }
    }

    /** Full in-memory buffer (sync file mode keeps the whole file resident). */
    get data(): Uint8Array { return this.#data; }
}
