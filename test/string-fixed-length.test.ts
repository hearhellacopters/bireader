import { expect } from 'chai';
import { BiReader, BiReaderAsync } from '../dist/esm/indexImport.js';

/**
 * Fixed-length string reads must consume exactly `length` units every time, even when
 * the field contains an early null terminator (the terminator ends the string *content*,
 * not the field). Terminated reads (no fixed length) still stop at the terminator.
 */

// "Hi\0\0\0\0\0\0" (8) + "World!\0\0" (8) - two 8-byte fixed fields, both null-padded.
const twoFields = () => new Uint8Array([
    0x48, 0x69, 0, 0, 0, 0, 0, 0,
    0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21, 0, 0,
]);

describe('fixed-length string reads', () => {
    describe('sync (BiReader)', () => {
        it('consumes the full length past an early null, and the next field lines up', () => {
            const r = new BiReader(twoFields());
            expect(r.string({ length: 8 })).to.equal('Hi');
            expect(r.offset).to.equal(8);            // full field consumed, not 3
            expect(r.string({ length: 8 })).to.equal('World!');
            expect(r.offset).to.equal(16);
        });

        it('consumes the full length when the field has no terminator', () => {
            const r = new BiReader(new Uint8Array([0x41, 0x42, 0x43, 0x44])); // "ABCD"
            expect(r.string({ length: 4 })).to.equal('ABCD');
            expect(r.offset).to.equal(4);
        });

        it('consume=false leaves the position unchanged', () => {
            const r = new BiReader(twoFields());
            expect(r.string({ length: 8 }, false)).to.equal('Hi');
            expect(r.offset).to.equal(0);
            // A second non-consuming read returns the same field.
            expect(r.string({ length: 8 }, false)).to.equal('Hi');
            expect(r.offset).to.equal(0);
        });

        it('utf-16 fixed length consumes length * 2 bytes', () => {
            // "Hi" utf-16le (4 bytes) + 4 bytes null padding = length 4 units.
            const r = new BiReader(new Uint8Array([0x48, 0, 0x69, 0, 0, 0, 0, 0]));
            expect(r.string({ length: 4, stringType: 'utf-16', endian: 'little' })).to.equal('Hi');
            expect(r.offset).to.equal(8);
        });

        it('utf8string preset (fixed length) consumes the full length', () => {
            const r = new BiReader(twoFields());
            expect(r.utf8string(8)).to.equal('Hi');
            expect(r.offset).to.equal(8);
        });

        it('regression: terminated reads (no length) still stop at the terminator', () => {
            const r = new BiReader(new Uint8Array([0x48, 0x69, 0, 0x41])); // "Hi\0A"
            expect(r.string()).to.equal('Hi');
            expect(r.offset).to.equal(3);            // consumed "Hi" + the terminator only
        });
    });

    describe('async (BiReaderAsync)', () => {
        it('consumes the full length past an early null, and the next field lines up', async () => {
            const r = new BiReaderAsync(twoFields());
            expect(await r.string({ length: 8 })).to.equal('Hi');
            expect(r.offset).to.equal(8);
            expect(await r.string({ length: 8 })).to.equal('World!');
            expect(r.offset).to.equal(16);
        });

        it('consume=false leaves the position unchanged', async () => {
            const r = new BiReaderAsync(twoFields());
            expect(await r.string({ length: 8 }, false)).to.equal('Hi');
            expect(r.offset).to.equal(0);
        });

        it('regression: terminated reads (no length) still stop at the terminator', async () => {
            const r = new BiReaderAsync(new Uint8Array([0x48, 0x69, 0, 0x41]));
            expect(await r.string({ stringType: 'utf-8', terminateValue: 0 })).to.equal('Hi');
            expect(r.offset).to.equal(3);
        });
    });
});
