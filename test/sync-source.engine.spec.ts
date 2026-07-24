import { expect } from 'chai';
import { MemorySyncSource, FileSyncSource } from '../dist-test/core/engine/sync-source.js';

/** A SyncFileOps backed by a growable Buffer - exercises FileSyncSource's load/flush/
 *  resize without touching the filesystem. */
class FakeSyncFs {
    buf: Buffer;
    closed = false;
    constructor(buf: Buffer) { this.buf = buf; }
    fstatSync(_fd: number) { return { size: this.buf.length }; }
    readSync(_fd: number, buffer: Uint8Array, off: number, len: number, pos: number) {
        const n = Math.max(0, Math.min(len, this.buf.length - pos));
        Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength).set(this.buf.subarray(pos, pos + n), off);
        return n;
    }
    writeSync(_fd: number, buffer: Uint8Array, off: number, len: number, pos: number) {
        if (pos + len > this.buf.length) { const nb = Buffer.alloc(pos + len); this.buf.copy(nb); this.buf = nb; }
        this.buf.set(buffer.subarray(off, off + len), pos);
        return len;
    }
    ftruncateSync(_fd: number, len: number) { const nb = Buffer.alloc(len); this.buf.copy(nb, 0, 0, Math.min(len, this.buf.length)); this.buf = nb; }
    closeSync(_fd: number) { this.closed = true; }
}

const range = (n: number) => Uint8Array.from({ length: n }, (_, i) => i & 0xff);

describe('engine/MemorySyncSource', () => {
    it('reads/writes/resizes in memory', () => {
        const s = new MemorySyncSource(range(8));
        expect(Array.from(s.read(2, 3))).to.deep.equal([2, 3, 4]);
        s.write(2, Uint8Array.from([0xAA]));
        expect(s.data[2]).to.equal(0xAA);
        s.resize(4);
        expect(s.size).to.equal(4);
        s.resize(6);
        expect(Array.from(s.read(0, 6))).to.deep.equal([0, 1, 0xAA, 3, 0, 0]);
    });
});

describe('engine/FileSyncSource', () => {
    it('loads the file, edits in memory, and flushes back', () => {
        const fs = new FakeSyncFs(Buffer.from(range(10)));
        const s = new FileSyncSource(0 as any, fs as any, false);
        expect(s.size).to.equal(10);
        expect(Array.from(s.read(3, 2))).to.deep.equal([3, 4]);
        s.write(3, Uint8Array.from([0xF0, 0xF1]));
        // not yet flushed
        expect(fs.buf[3]).to.equal(3);
        s.flush();
        expect(Array.from(fs.buf.subarray(3, 5))).to.deep.equal([0xF0, 0xF1]);
    });

    it('grows and shrinks, persisting the exact size on flush', () => {
        const fs = new FakeSyncFs(Buffer.from(range(10)));
        const s = new FileSyncSource(0 as any, fs as any, false);
        s.resize(14);
        s.write(10, Uint8Array.from([0xAA, 0xBB, 0xCC, 0xDD]));
        s.flush();
        expect(fs.buf.length).to.equal(14);
        expect(Array.from(fs.buf.subarray(10, 14))).to.deep.equal([0xAA, 0xBB, 0xCC, 0xDD]);

        s.resize(4);
        s.flush();
        expect(fs.buf.length).to.equal(4);
        expect(Array.from(fs.buf)).to.deep.equal([0, 1, 2, 3]);
    });

    it('close flushes and releases the handle', () => {
        const fs = new FakeSyncFs(Buffer.from(range(4)));
        const s = new FileSyncSource(0 as any, fs as any, false);
        s.write(0, Uint8Array.from([0x55]));
        s.close();
        expect(fs.closed).to.equal(true);
        expect(fs.buf[0]).to.equal(0x55);
    });

    it('read-only source rejects writes', () => {
        const fs = new FakeSyncFs(Buffer.from(range(4)));
        const s = new FileSyncSource(0 as any, fs as any, true);
        let threw = false;
        try { s.write(0, Uint8Array.from([1])); } catch { threw = true; }
        expect(threw).to.equal(true);
    });
});
