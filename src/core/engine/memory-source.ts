/**
 * @file Phase-2 engine brick: in-memory Source.
 *
 * A {@link Source} backed by a single `Uint8Array` / `Buffer`. This is the memory-mode
 * path lifted out of the engine god-classes into one small, testable unit. See
 * ./README.md and ./source.ts.
 *
 * Not yet wired into the shipping facades.
 */
import type { Source } from './source.js';

export class MemorySource implements Source {
    #data: Uint8Array;
    #readOnly: boolean;
    #isBuffer: boolean;

    constructor(data: Uint8Array, readOnly: boolean = false) {
        this.#data = data;

        this.#readOnly = readOnly;

        this.#isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(data);
    }

    get size(): number {
        return this.#data.length;
    }

    get readOnly(): boolean {
        return this.#readOnly;
    }

    get isBuffer(): boolean {
        return this.#isBuffer;
    }

    /** The live backing buffer (no copy). */
    get data(): Uint8Array {
        return this.#data;
    }

    async read(offset: number, length: number): Promise<Uint8Array> {
        if (offset < 0 || offset + length > this.#data.length) {
            throw new RangeError(`Read ${offset}..${offset + length} out of range (size ${this.#data.length})`);
        }

        return this.#data.subarray(offset, offset + length);
    }

    async write(offset: number, data: Uint8Array): Promise<void> {
        if (this.#readOnly) {
            throw new Error('Cannot write to a read-only source');
        }

        if (offset < 0 || offset + data.length > this.#data.length) {
            throw new RangeError(`Write ${offset}..${offset + data.length} out of range (size ${this.#data.length}); resize first`);
        }

        this.#data.set(data, offset);
    }

    async resize(size: number): Promise<void> {
        if (this.#readOnly) {
            throw new Error('Cannot resize a read-only source');
        }

        if (size === this.#data.length) {
            return;
        }

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

    async flush(): Promise<void> {
        // in-memory: nothing to flush
    }

    async close(): Promise<void> {
        // in-memory: nothing to release
    }
}
