/**
 * Declarative source-of-truth for bireader's mechanical alias families.
 *
 * The ~1,300 numeric / bit / endian aliases exposed by the four facades are NOT
 * meant to be hand-written - a single mistyped endian or sign literal (see the
 * historical `wpstring1le`/`wpstring1be` swap) is invisible without exhaustive
 * tests. Instead every mechanical alias is DERIVED from the compact family
 * descriptors below.
 *
 * Two consumers share this file:
 *   - scripts/alias-render.mjs      → renders the alias source; `npm run apply:aliases`
 *                                      rewrites the generated block in the four facades.
 *   - test/aliases.parity.test.ts   → asserts the live classes match this spec
 *                                      behaviourally (drift fails CI).
 *
 * Each expanded entry:
 *   { name, family, width, signed, endian, kind }
 *     endian: 'little' | 'big' | 'default'   ('default' = no endian arg → base default)
 *     kind:   'int' | 'float' | 'bit'
 */

// Numeric integer families: signed roots + unsigned roots, all with le/be variants.
const INT_FAMILIES = [
    { family: 'byte',  width: 8,  read: 'readByte',        write: 'writeByte',        signed: ['byte', 'int8'],            unsigned: ['uint8', 'ubyte'],        endian: false },
    { family: 'int16', width: 16, read: 'readInt16',       write: 'writeInt16',       signed: ['int16', 'short', 'word'],  unsigned: ['uint16', 'ushort', 'uword'], endian: true },
    { family: 'int32', width: 32, read: 'readInt32',       write: 'writeInt32',       signed: ['int', 'dword', 'int32', 'long'], unsigned: ['uint', 'udword', 'uint32', 'ulong'], endian: true },
    { family: 'int64', width: 64, read: 'readInt64',       write: 'writeInt64',       signed: ['int64', 'bigint', 'quad'], unsigned: ['uint64', 'ubigint', 'uquad'], endian: true },
];

// Float families: no sign, le/be variants.
const FLOAT_FAMILIES = [
    { family: 'float',       width: 32, read: 'readFloat',       write: 'writeFloat',       roots: ['float'],                endian: true },
    { family: 'halffloat',   width: 16, read: 'readHalfFloat',   write: 'writeHalfFloat',   roots: ['halffloat', 'half'],    endian: true },
    { family: 'doublefloat', width: 64, read: 'readDoubleFloat', write: 'writeDoubleFloat', roots: ['doublefloat', 'dfloat'], endian: true },
];

/** Expand all mechanical numeric + float aliases. */
export function expandNumeric() {
    const out = [];

    for (const f of INT_FAMILIES) {
        const variants = f.endian ? ['default', 'little', 'big'] : ['default'];

        for (const endian of variants) {
            const suffix = endian === 'little' ? 'le' : endian === 'big' ? 'be' : '';

            for (const root of f.signed) {
                out.push({ name: root + suffix, family: f.family, width: f.width, signed: false, endian, kind: 'int', read: f.read, write: f.write });
            }

            for (const root of f.unsigned) {
                out.push({ name: root + suffix, family: f.family, width: f.width, signed: true, endian, kind: 'int', read: f.read, write: f.write });
            }
        }
    }

    for (const f of FLOAT_FAMILIES) {
        for (const endian of ['default', 'little', 'big']) {
            const suffix = endian === 'little' ? 'le' : endian === 'big' ? 'be' : '';

            for (const root of f.roots) {
                out.push({ name: root + suffix, family: f.family, width: f.width, signed: null, endian, kind: 'float', read: f.read, write: f.write });
            }
        }
    }

    return out;
}

/** Expand the numbered bit aliases bit1..bit32 (+u, +le/be). */
export function expandBits() {
    const out = [];

    for (let w = 1; w <= 32; w++) {
        for (const endian of ['default', 'little', 'big']) {
            const suffix = endian === 'little' ? 'le' : endian === 'big' ? 'be' : '';

            out.push({ name: `bit${w}${suffix}`, width: w, signed: false, endian, kind: 'bit' });

            out.push({ name: `ubit${w}${suffix}`, width: w, signed: true, endian, kind: 'bit' });
        }
    }

    return out;
}

/** Full mechanical alias set. */
export function expandAll() {
    return [...expandNumeric(), ...expandBits()];
}
