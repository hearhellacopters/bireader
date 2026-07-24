import { expect } from 'chai';
import { BiWriterAsync } from '../dist/esm/indexImport.js';

/**
 * Regression tests for two async structural-edit bugs found while building the Phase-2
 * engine (both memory mode):
 *   - delete() returned a live view of the removed range that the in-place tail-shift
 *     then overwrote, so the returned bytes were post-shift garbage.
 *   - fill(start, end, false, value) wrote the fill at the cursor instead of `start`.
 */
describe('BiWriterAsync structural-edit regressions', () => {
    const src = () => Uint8Array.from({ length: 16 }, (_, i) => 0x80 + i);

    it('delete returns a copy of the actually-removed bytes', async () => {
        const w = new BiWriterAsync(src(), { strict: false }) as any;
        const removed = await w.delete(3, 7, false);
        expect(Array.from(removed as Uint8Array)).to.deep.equal([0x83, 0x84, 0x85, 0x86]);
    });

    it('fill overwrites the requested range, not the cursor position', async () => {
        const w = new BiWriterAsync(src(), { strict: false }) as any;
        await w.goto(0); // cursor at 0, fill range starts at 2
        await w.fill(2, 6, false, 0x00);
        const data = w.data as Uint8Array;
        expect(Array.from(data.subarray(0, 8))).to.deep.equal([0x80, 0x81, 0, 0, 0, 0, 0x86, 0x87]);
    });
});
