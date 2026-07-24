import { expect } from 'chai';
import {
    readInt, writeInt, readBig, writeBig,
    readFloat32, writeFloat32, readFloat64, writeFloat64,
    readFloat16, writeFloat16, readBits, writeBits,
} from '../dist-test/core/engine/codecs.js';
import { BiReader, BiWriter } from '../dist-test/indexImport.js';

/**
 * Equivalence gate for the Phase-2 codecs: every codec must produce byte-identical
 * results to the SHIPPING engine (BiReader/BiWriter). Proving this here is what makes
 * the eventual BiEngine swap safe - the value path does not change, only its home.
 */

const view = (bytes: number[] | Uint8Array) => {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return { u8, dv: new DataView(u8.buffer, u8.byteOffset, u8.byteLength) };
};

describe('engine/codecs - numeric equivalence vs shipping engine', () => {
    const widths = [8, 16, 32] as const;
    // in-range unsigned samples per width; signed samples reuse the low half + a negative
    const samplesFor = (w: number, signed: boolean) => {
        const max = w === 32 ? 0xffffffff : (1 << w) - 1;
        if (!signed) return [0, 1, (max >>> 1), max].filter(v => v <= max);
        const smax = w === 32 ? 0x7fffffff : (1 << (w - 1)) - 1;
        return [0, 1, smax, -1, -smax - 1];
    };

    for (const w of widths) {
        for (const signed of [false, true]) {
            for (const little of [false, true]) {
                const endian = little ? 'little' : 'big';
                it(`int${w} ${signed ? 'signed' : 'unsigned'} ${endian}`, () => {
                    for (const value of samplesFor(w, signed)) {
                        // codecs write -> shipping read
                        const { u8, dv } = view(new Uint8Array(w / 8));
                        writeInt(dv, 0, value, w as 8 | 16 | 32, signed, little);
                        const base = new BiReader(u8) as any;
                        // base read/write params are `unsigned`, i.e. the inverse of our `signed`
                        const baseVal = w === 8 ? base.readByte(!signed) : base[`readInt${w}`](!signed, endian);
                        expect(baseVal).to.equal(value, `${w}/${signed}/${endian} value ${value}`);

                        // shipping write -> codecs read
                        const wb = new BiWriter(new Uint8Array(w / 8)) as any;
                        if (w === 8) wb.writeByte(value, !signed); else wb[`writeInt${w}`](value, !signed, endian);
                        const rr = view(wb.data);
                        expect(readInt(rr.dv, 0, w as 8 | 16 | 32, signed, little)).to.equal(value);
                    }
                });
            }
        }
    }
});

describe('engine/codecs - 64-bit equivalence', () => {
    const vals = [0n, 1n, -1n, 255n, 0x7fffffffffffffffn, -0x8000000000000000n, 0x0102030405060708n];
    for (const signed of [false, true]) {
        for (const little of [false, true]) {
            const endian = little ? 'little' : 'big';
            it(`int64 ${signed ? 'signed' : 'unsigned'} ${endian}`, () => {
                for (const v of vals) {
                    if (!signed && v < 0n) continue;
                    const { u8, dv } = view(new Uint8Array(8));
                    writeBig(dv, 0, v, signed, little);
                    const base = new BiReader(u8, { enforceBigInt: true }) as any;
                    const baseVal = base.readInt64(!signed, endian);
                    expect(String(baseVal)).to.equal(String(v));
                    expect(String(readBig(dv, 0, signed, little))).to.equal(String(v));
                }
            });
        }
    }
});

describe('engine/codecs - float equivalence', () => {
    const floats = [0, 1.5, -2.25, 3.14159, 65504, -65504, Infinity, -Infinity];

    for (const little of [false, true]) {
        const endian = little ? 'little' : 'big';

        it(`float32 ${endian}`, () => {
            for (const f of floats) {
                const { u8, dv } = view(new Uint8Array(4));
                writeFloat32(dv, 0, f, little);
                expect((new BiReader(u8) as any).readFloat(endian)).to.equal(Math.fround(f));
                expect(readFloat32(dv, 0, little)).to.equal(Math.fround(f));
            }
        });

        it(`float64 ${endian}`, () => {
            for (const f of floats) {
                const { u8, dv } = view(new Uint8Array(8));
                writeFloat64(dv, 0, f, little);
                expect((new BiReader(u8) as any).readDoubleFloat(endian)).to.equal(f);
                expect(readFloat64(dv, 0, little)).to.equal(f);
            }
        });

        it(`float16 ${endian} matches shipping halffloat`, () => {
            for (const f of [0, 1, -1, 1.5, -2, 0.5, 65504]) {
                const { u8, dv } = view(new Uint8Array(2));
                writeFloat16(dv, 0, f, little);
                const base = (new BiReader(u8) as any).readHalfFloat(endian);
                expect(readFloat16(dv, 0, little)).to.equal(base);

                // and shipping writer produces the same bytes codecs read back
                const wb = new BiWriter(new Uint8Array(2)) as any;
                wb.writeHalfFloat(f, endian);
                const rr = view(wb.data);
                expect(readFloat16(rr.dv, 0, little)).to.equal(base);
            }
        });
    }
});

describe('engine/codecs - bit equivalence vs shipping readBit/writeBit', () => {
    const SRC = new Uint8Array([0b10110010, 0b01011101, 0b11100001, 0b00011110]);

    for (const bits of [1, 3, 5, 7, 8, 12, 16, 24, 32]) {
        for (const little of [false, true]) {
            for (const signed of [false, true]) {
                const endian = little ? 'little' : 'big';
                it(`readBits ${bits} ${signed ? 'signed' : 'unsigned'} ${endian}`, () => {
                    const src = SRC.subarray(0, Math.ceil(bits / 8));
                    const base = (new BiReader(src) as any).readBit(bits, !signed ? true : false, endian);
                    const codec = readBits(src, 0, bits, little, signed);
                    expect(codec).to.equal(base);
                });

                it(`writeBits ${bits} ${endian} matches writeBit`, () => {
                    // codecs.writeBits is the RAW writer; shipping writeBit range-clamps via
                    // numberSafe first. Use in-range values so the clamp is a no-op and the two
                    // are directly comparable (the engine applies numberSafe as a separate step).
                    const value = signed
                        ? (bits <= 1 ? 0 : bits === 2 ? 1 : 2)
                        : Math.min(5, bits >= 31 ? 0x7fffffff : (1 << bits) - 1);
                    const wb = new BiWriter(new Uint8Array(Math.ceil(bits / 8))) as any;
                    wb.writeBit(value, bits, !signed, endian);

                    const codecBuf = new Uint8Array(Math.ceil(bits / 8));
                    writeBits(codecBuf, value, bits, 0, little, signed);

                    expect(Array.from(codecBuf)).to.deep.equal(Array.from(wb.data));
                });
            }
        }
    }
});
