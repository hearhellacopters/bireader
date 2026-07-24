import { expect } from 'chai';
import { MemorySource } from '../dist-test/core/engine/memory-source.js';
import { ChunkedFileSource } from '../dist-test/core/engine/chunked-file-source.js';

/** A FileHandleLike backed by a growable Uint8Array - lets the chunk cache be tested
 *  across window boundaries and grow/shrink without touching the filesystem. */
class FakeFile {
    buf: Uint8Array;
    closed = false;
    constructor(buf: Uint8Array) { this.buf = buf; }
    async read(buffer: Uint8Array, offset: number, length: number, position: number) {
        const n = Math.max(0, Math.min(length, this.buf.length - position));
        buffer.set(this.buf.subarray(position, position + n), offset);
        return { bytesRead: n };
    }
    async write(buffer: Uint8Array, offset: number, length: number, position: number) {
        if (position + length > this.buf.length) {
            const next = new Uint8Array(position + length);
            next.set(this.buf);
            this.buf = next;
        }
        this.buf.set(buffer.subarray(offset, offset + length), position);
        return { bytesWritten: length };
    }
    async truncate(len: number) {
        const next = new Uint8Array(len);
        next.set(this.buf.subarray(0, Math.min(len, this.buf.length)));
        this.buf = next;
    }
    async stat() { return { size: this.buf.length }; }
    async close() { this.closed = true; }
}

const range = (n: number, start = 0) => Uint8Array.from({ length: n }, (_, i) => (start + i) & 0xff);

describe('engine/MemorySource', () => {
    it('reads and writes within bounds', async () => {
        const s = new MemorySource(range(8));
        expect(Array.from(await s.read(2, 3))).to.deep.equal([2, 3, 4]);
        await s.write(2, Uint8Array.from([0xAA, 0xBB]));
        expect(Array.from(await s.read(0, 8))).to.deep.equal([0, 1, 0xAA, 0xBB, 4, 5, 6, 7]);
    });

    it('grows and shrinks preserving overlap', async () => {
        const s = new MemorySource(range(4));
        await s.resize(6);
        expect(s.size).to.equal(6);
        expect(Array.from(await s.read(0, 6))).to.deep.equal([0, 1, 2, 3, 0, 0]);
        await s.resize(2);
        expect(Array.from(await s.read(0, 2))).to.deep.equal([0, 1]);
    });

    it('rejects out-of-range and read-only writes', async () => {
        const s = new MemorySource(range(4));
        let threw = false;
        try { await s.read(2, 5); } catch { threw = true; }
        expect(threw).to.equal(true);
        const ro = new MemorySource(range(4), true);
        threw = false;
        try { await ro.write(0, Uint8Array.from([1])); } catch { threw = true; }
        expect(threw).to.equal(true);
    });
});

describe('engine/ChunkedFileSource', () => {
    it('reads across window boundaries', async () => {
        const file = new FakeFile(range(20));
        const s = new ChunkedFileSource(file as any, 20, 4, false);
        expect(Array.from(await s.read(2, 10))).to.deep.equal([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    it('writes across boundaries then flushes to the file', async () => {
        const file = new FakeFile(range(20));
        const s = new ChunkedFileSource(file as any, 20, 4, false);
        await s.write(3, Uint8Array.from([0xF0, 0xF1, 0xF2, 0xF3])); // spans chunks 0 and 1
        await s.flush();
        expect(Array.from(file.buf.subarray(3, 7))).to.deep.equal([0xF0, 0xF1, 0xF2, 0xF3]);
    });

    it('windowSize 0 loads the whole file as one chunk', async () => {
        const file = new FakeFile(range(10));
        const s = new ChunkedFileSource(file as any, 10, 0, false);
        expect(Array.from(await s.read(0, 10))).to.deep.equal(Array.from(range(10)));
        await s.write(5, Uint8Array.from([0x99]));
        await s.flush();
        expect(file.buf[5]).to.equal(0x99);
    });

    it('grows, writes into the new region, and keeps the old boundary intact', async () => {
        const file = new FakeFile(range(6)); // window 4 -> chunk0 [0..4), chunk1 [4..6) partial
        const s = new ChunkedFileSource(file as any, 6, 4, false);
        await s.read(4, 2); // cache the partial boundary chunk
        await s.resize(12);
        expect(s.size).to.equal(12);
        await s.write(6, Uint8Array.from([0xAA, 0xBB, 0xCC])); // into grown region
        await s.flush();
        expect(Array.from(await s.read(4, 2))).to.deep.equal([4, 5]); // old boundary bytes preserved
        expect(Array.from(file.buf.subarray(6, 9))).to.deep.equal([0xAA, 0xBB, 0xCC]);
    });

    it('shrinks without a stale chunk re-growing the file on flush', async () => {
        const file = new FakeFile(range(20));
        const s = new ChunkedFileSource(file as any, 20, 4, false);
        await s.write(18, Uint8Array.from([0x11, 0x22])); // dirty the last chunk
        await s.resize(8);
        await s.flush();
        expect(file.buf.length).to.equal(8);
        expect(Array.from(await s.read(0, 8))).to.deep.equal(Array.from(range(8)));
    });

    it('serves concurrent reads correctly', async () => {
        const file = new FakeFile(range(20));
        const s = new ChunkedFileSource(file as any, 20, 4, false);
        const [a, b, c] = await Promise.all([s.read(0, 4), s.read(6, 4), s.read(12, 8)]);
        expect(Array.from(a)).to.deep.equal([0, 1, 2, 3]);
        expect(Array.from(b)).to.deep.equal([6, 7, 8, 9]);
        expect(Array.from(c)).to.deep.equal([12, 13, 14, 15, 16, 17, 18, 19]);
    });

    it('close flushes and releases the handle', async () => {
        const file = new FakeFile(range(8));
        const s = new ChunkedFileSource(file as any, 8, 4, false);
        await s.write(0, Uint8Array.from([0x55]));
        await s.close();
        expect(file.closed).to.equal(true);
        expect(file.buf[0]).to.equal(0x55);
    });
});
