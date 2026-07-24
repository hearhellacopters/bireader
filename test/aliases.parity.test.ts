import { expect } from 'chai';
import { BiReader, BiWriter } from '../dist/esm/indexImport.js';
import { BiReaderAsync, BiWriterAsync } from '../dist/esm/indexImport.js';
import { expandNumeric, expandBits } from '../scripts/alias-spec.mjs';

/**
 * Behavioural parity gate for the mechanical alias families.
 *
 * Every numeric / float / bit alias is DERIVED from scripts/alias-spec.mjs. This
 * suite asserts that each live alias on all four facades delegates with exactly the
 * spec's (width, sign, endian): it round-trips a discriminating value through the
 * alias and through the base method configured per spec and requires them to agree.
 *
 * A single mistyped endian or sign literal in a hand-written alias (the class of bug
 * behind the historical `wpstring1le`/`wpstring1be` swap) makes the two disagree and
 * fails here. Regenerating the aliases from the spec keeps this green by construction.
 */

// Discriminating source bytes: high bit set (sign) and ascending (endian) so a wrong
// sign or endian yields a different decoded value.
const SRC = new Uint8Array([0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87]);

function resolveEndian(endian: string): 'little' | 'big' {
    return endian === 'big' ? 'big' : 'little';
}

function same(a: any, b: any): boolean {
    if (typeof a === 'bigint' || typeof b === 'bigint') {
        return String(a) === String(b);
    }
    if (Number.isNaN(a) && Number.isNaN(b)) {
        return true;
    }
    return a === b;
}

const numeric = expandNumeric();
const bits = expandBits();

describe('Alias parity - numeric families (sync)', () => {
    for (const s of numeric) {
        it(`BiReader.${s.name} == ${s.read}(${s.kind === 'float' ? '' : s.signed + ', '}${resolveEndian(s.endian)})`, () => {
            const src = SRC.subarray(0, s.width / 8);

            const viaAlias = (new BiReader(src) as any)[s.name];

            const base = new BiReader(src) as any;

            const viaBase = s.kind === 'float'
                ? base[s.read](resolveEndian(s.endian))
                : base[s.read](s.signed, resolveEndian(s.endian));

            expect(same(viaAlias, viaBase), `${s.name} -> ${String(viaAlias)} vs base ${String(viaBase)}`).to.equal(true);
        });

        it(`BiWriter.${s.name} writes like ${s.write}`, () => {
            const value = s.kind === 'float' ? 1.5 : (s.width === 64 ? 5n : 5);

            const wa = new BiWriter(new Uint8Array(s.width / 8)) as any;

            wa[s.name] = value;

            const wb = new BiWriter(new Uint8Array(s.width / 8)) as any;

            if (s.kind === 'float') {
                wb[s.write](value, resolveEndian(s.endian));
            } else {
                wb[s.write](value, s.signed, resolveEndian(s.endian));
            }

            expect(Array.from(wa.data)).to.deep.equal(Array.from(wb.data), `${s.name} bytes`);
        });
    }
});

describe('Alias parity - numeric families (async)', () => {
    for (const s of numeric) {
        it(`BiReaderAsync.${s.name} matches base`, async () => {
            const src = SRC.subarray(0, s.width / 8);

            const ra = new BiReaderAsync(src) as any;

            const viaAlias = await ra[s.name]();

            const rb = new BiReaderAsync(src) as any;

            const viaBase = s.kind === 'float'
                ? await rb[s.read](resolveEndian(s.endian))
                : await rb[s.read](s.signed, resolveEndian(s.endian));

            expect(same(viaAlias, viaBase)).to.equal(true);
        });

        it(`BiWriterAsync.${s.name} writes like base`, async () => {
            const value = s.kind === 'float' ? 1.5 : (s.width === 64 ? 5n : 5);

            const wa = new BiWriterAsync(new Uint8Array(s.width / 8)) as any;

            await wa[s.name](value);

            const wb = new BiWriterAsync(new Uint8Array(s.width / 8)) as any;

            if (s.kind === 'float') {
                await wb[s.write](value, resolveEndian(s.endian));
            } else {
                await wb[s.write](value, s.signed, resolveEndian(s.endian));
            }

            expect(Array.from(wa.data)).to.deep.equal(Array.from(wb.data));
        });
    }
});

describe('Alias parity - bit families', () => {
    for (const s of bits) {
        it(`BiReader.${s.name} == readBit(${s.width}, ${s.signed}, ${resolveEndian(s.endian)})`, () => {
            const src = SRC.subarray(0, Math.ceil(s.width / 8));

            const viaAlias = (new BiReader(src) as any)[s.name];

            const viaBase = (new BiReader(src) as any).readBit(s.width, s.signed, resolveEndian(s.endian));

            expect(same(viaAlias, viaBase), `${s.name}`).to.equal(true);
        });

        it(`BiWriter.${s.name} writes like writeBit`, () => {
            const value = 1;

            const wa = new BiWriter(new Uint8Array(Math.ceil(s.width / 8))) as any;

            wa[s.name] = value;

            const wb = new BiWriter(new Uint8Array(Math.ceil(s.width / 8))) as any;

            wb.writeBit(value, s.width, s.signed, resolveEndian(s.endian));

            expect(Array.from(wa.data)).to.deep.equal(Array.from(wb.data));
        });

        it(`BiReaderAsync.${s.name} matches base`, async () => {
            const src = SRC.subarray(0, Math.ceil(s.width / 8));

            const viaAlias = await (new BiReaderAsync(src) as any)[s.name]();

            const viaBase = await (new BiReaderAsync(src) as any).readBit(s.width, s.signed, resolveEndian(s.endian));

            expect(same(viaAlias, viaBase)).to.equal(true);
        });

        it(`BiWriterAsync.${s.name} writes like base`, async () => {
            const value = 1;

            const wa = new BiWriterAsync(new Uint8Array(Math.ceil(s.width / 8))) as any;

            await wa[s.name](value);

            const wb = new BiWriterAsync(new Uint8Array(Math.ceil(s.width / 8))) as any;

            await wb.writeBit(value, s.width, s.signed, resolveEndian(s.endian));

            expect(Array.from(wa.data)).to.deep.equal(Array.from(wb.data));
        });
    }
});
