import { expect } from 'chai';
// Phase-2 engine brick. Imported from the tsc build output (dist) because the repo's
// `--require ts-node/register` harness only loads compiled JS. Run via `npm run test:engine`
// (which builds first); excluded from the default `*.test.ts` suite by filename.
import { Cursor, normalizeBitOffset } from '../dist-test/core/engine/cursor.js';

describe('engine/Cursor', () => {
    it('normalizeBitOffset wraps into 0-7', () => {
        expect(normalizeBitOffset(0)).to.equal(0);
        expect(normalizeBitOffset(7)).to.equal(7);
        expect(normalizeBitOffset(8)).to.equal(0);
        expect(normalizeBitOffset(-1)).to.equal(7);
        expect(normalizeBitOffset(-8)).to.equal(0);
        expect(normalizeBitOffset(19)).to.equal(3);
    });

    it('bitOffset adds to (does not replace) byteOffset - the v4 bug', () => {
        const c = new Cursor(10, 4);
        expect(c.byte).to.equal(10);
        expect(c.bit).to.equal(4);
        expect(c.bitPosition).to.equal(84);
    });

    it('rolls whole bytes out of a large bitOffset', () => {
        const c = new Cursor(2, 20); // 20 bits = 2 bytes + 4 bits
        expect(c.byte).to.equal(4);
        expect(c.bit).to.equal(4);
    });

    it('skip moves by bytes and bits, including negative bits across a byte', () => {
        const c = new Cursor(3, 2); // bit position 26
        c.skip(1, 0); // +8 bits -> 34 = byte 4 bit 2
        expect(c.byte).to.equal(4);
        expect(c.bit).to.equal(2);
        c.skip(0, -4); // 34 - 4 = 30 = byte 3 bit 6
        expect(c.bitPosition).to.equal(30);
        expect(c.byte).to.equal(3);
        expect(c.bit).to.equal(6);
    });

    it('never goes negative', () => {
        const c = new Cursor(0, 0);
        c.skip(-100, -100);
        expect(c.byte).to.equal(0);
        expect(c.bit).to.equal(0);
    });

    it('alignByte advances to the next boundary only when misaligned', () => {
        const a = new Cursor(5, 0);
        a.alignByte();
        expect(a.byte).to.equal(5);

        const b = new Cursor(5, 3);
        b.alignByte();
        expect(b.byte).to.equal(6);
        expect(b.bit).to.equal(0);
    });

    it('endByteForBits matches the corrected v5 formula', () => {
        expect(new Cursor(0, 0).endByteForBits(9)).to.equal(2);
        expect(new Cursor(0, 0).endByteForBits(8)).to.equal(1);
        expect(new Cursor(0, 1).endByteForBits(8)).to.equal(2);
        expect(new Cursor(4, 0).endByteForBits(32)).to.equal(8);
    });

    it('setBitPosition round-trips', () => {
        const c = new Cursor().setBitPosition(84);
        expect(c.byte).to.equal(10);
        expect(c.bit).to.equal(4);
    });

    it('clone is independent', () => {
        const a = new Cursor(1, 1);
        const b = a.clone();
        b.skip(5, 0);
        expect(a.byte).to.equal(1);
        expect(b.byte).to.equal(6);
    });
});
