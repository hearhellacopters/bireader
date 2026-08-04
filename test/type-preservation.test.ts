import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';
import { BiReader, BiWriter, BiReaderAsync, BiWriterAsync } from '../dist/esm/indexImport.js';

/**
 * Contract: any method that returns a sub-array echoes the type the reader/writer
 * was created with. Created from a `Uint8Array` -> results are plain `Uint8Array`s;
 * created from a `Buffer` (or a file path, read as a Buffer) -> results are `Buffer`s.
 * Buffer results must be genuine copies, not shared views of the backing store.
 */

const tmp = path.join(process.cwd(), 'type-preservation.bin');
const bytes = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];

const isBuffer = (x: unknown): boolean => typeof Buffer !== 'undefined' && Buffer.isBuffer(x);
const isPlainU8 = (x: unknown): boolean => x instanceof Uint8Array && !isBuffer(x);

/*
 * Compile-time contract. These functions are never called; ts-node type-checks them
 * when the suite loads, so a regression in the static return types fails the run.
 * The `@ts-expect-error` lines self-validate: if the return type were wrong the
 * directive would be "unused" and compilation would fail.
 */
function _syncTypeContract() {
    const fromBuffer: Buffer = new BiReader(Buffer.from(bytes)).extract(4);
    const fromPath: Buffer = new BiReader('some/path').extract(4);
    const fromWriter: Buffer = new BiWriter(Buffer.from(bytes)).fill(0, 4);
    const fromU8: Uint8Array = new BiReader(new Uint8Array(bytes)).extract(4);
    // @ts-expect-error - a Uint8Array-backed reader must NOT type its result as Buffer
    const wrong: Buffer = new BiReader(new Uint8Array(bytes)).extract(4);
    void [fromBuffer, fromPath, fromWriter, fromU8, wrong];
}
async function _asyncTypeContract() {
    const fromBuffer: Buffer = await new BiReaderAsync(Buffer.from(bytes)).extract(4);
    const fromPath: Buffer = await new BiReaderAsync('some/path').readBytesAt(0, 4);
    const fromU8: Uint8Array = await new BiReaderAsync(new Uint8Array(bytes)).extract(4);
    // @ts-expect-error - a Uint8Array-backed reader must NOT type its result as Buffer
    const wrong: Buffer = await new BiReaderAsync(new Uint8Array(bytes)).extract(4);
    void [fromBuffer, fromPath, fromU8, wrong];
}
void [_syncTypeContract, _asyncTypeContract];

describe('sub-array return type echoes the input type', () => {
    before(() => fs.writeFileSync(tmp, Buffer.from(bytes)));
    after(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

    describe('sync (BiReader / BiWriter)', () => {
        it('Uint8Array input -> plain Uint8Array results', () => {
            const r = new BiReader(new Uint8Array(bytes));
            expect(isPlainU8(r.extract(4))).to.equal(true);
            expect(isPlainU8(r.subarray(0, 2))).to.equal(true);
            expect(isPlainU8(r.readUBytes(2))).to.equal(true);
        });

        it('Buffer input -> Buffer results', () => {
            const r = new BiReader(Buffer.from(bytes));
            expect(isBuffer(r.extract(4))).to.equal(true);
            expect(isBuffer(r.subarray(0, 2))).to.equal(true);
            expect(isBuffer(r.readUBytes(2))).to.equal(true);
        });

        it('file path -> Buffer results', () => {
            const r = new BiReader(tmp);
            expect(isBuffer(r.extract(4))).to.equal(true);
            r.close();
        });

        it('delete / fill echo Buffer input (writer)', () => {
            const w = new BiWriter(Buffer.from(bytes));
            expect(isBuffer(w.fill(0, 4))).to.equal(true);
            expect(isBuffer(w.delete(0, 2))).to.equal(true);
        });

        it('extracted Buffer is a copy, not a view of the store', () => {
            const w = new BiWriter(Buffer.from(bytes));
            const copy = w.extract(4, false);   // 01 02 03 04
            w.fill(0, 4, false, 0xFF);          // zero the source range
            expect([...copy]).to.deep.equal([1, 2, 3, 4]);
        });
    });

    describe('async (BiReaderAsync / BiWriterAsync)', () => {
        it('Uint8Array input -> plain Uint8Array results', async () => {
            const r = new BiReaderAsync(new Uint8Array(bytes));
            expect(isPlainU8(await r.extract(4))).to.equal(true);
            expect(isPlainU8(await r.readUBytes(2))).to.equal(true);
        });

        it('Buffer input -> Buffer results', async () => {
            const r = new BiReaderAsync(Buffer.from(bytes));
            expect(isBuffer(await r.extract(4))).to.equal(true);
            expect(isBuffer(await r.subarray(0, 2))).to.equal(true);
        });

        it('file path -> Buffer results', async () => {
            const r = new BiReaderAsync(tmp);
            expect(isBuffer(await r.extract(4))).to.equal(true);
            expect(isBuffer(await r.readBytesAt(0, 3))).to.equal(true);
            await r.close();
        });
    });
});
