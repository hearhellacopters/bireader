import {
    BiOptions,
    BigValue,
    endian,
    stringOptions
} from "./common.js";
import { BiSyncEngine } from './core/engine/sync-engine.js';

/**
 * Binary reader, includes bitfields and strings.
 *
 * @param {DataType} input - File path or a `Buffer` or `Uint8Array`. Always found in .{@link data}
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
 * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
 * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
 * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
 * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
 * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
 * @param {BiOptions["readOnly"]?} [options.readOnly = true] - Allow data writes when reading a file (default `true` in reader)
 * 
 * @since 2.0
 */
export class BiReader<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false> extends BiSyncEngine<alwaysBigInt> {
    constructor(input: DataType, options: BiOptions<alwaysBigInt> = {}) {
        if (input == undefined) {
            throw new Error("Can not start BiReader without data.");
        }
        // Merge over defaults into a fresh object; never mutate the caller's options.
        super(input, {
            byteOffset: options.byteOffset ?? 0,
            bitOffset: options.bitOffset ?? 0,
            endianness: options.endianness ?? "little",
            strict: options.strict ?? true,
            growthIncrement: options.growthIncrement ?? 0x100000,
            enforceBigInt: options.enforceBigInt ?? false as alwaysBigInt,
            readOnly: options.readOnly ?? true,
        });
    };

    //
    // #region Bit Aliases
    //

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    bit(bits: number, unsigned?: boolean, endian?: endian): number {
        return this.readBit(bits, unsigned, endian);
    };

    /**
     * Bit field reader. Unsigned read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(bits: number, endian?: endian): number {
        return this.readBit(bits, true, endian);
    };

    /**
     * Bit field reader. Unsigned big endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitbe(bits: number): number {
        return this.bit(bits, true, "big");
    };

    /**
     * Bit field reader. Big endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitbe(bits: number, unsigned?: boolean): number {
        return this.bit(bits, unsigned, "big");
    };

    /**
     * Bit field reader. Unsigned little endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitle(bits: number): number {
        return this.bit(bits, true, "little");
    };

    /**
     * Bit field reader. Little endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitle(bits: number, unsigned?: boolean): number {
        return this.bit(bits, unsigned, "little");
    };
    //
    // #region Generated mechanical aliases
    //

    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====
    // Behaviour is verified by test/aliases.parity.test.ts.

    /** Read a signed 8-bit integer. */
    get byte(): number { return this.readByte(); }

    /** Read a signed 8-bit integer. */
    get int8(): number { return this.readByte(); }

    /** Read an unsigned 8-bit integer. */
    get uint8(): number { return this.readByte(true); }

    /** Read an unsigned 8-bit integer. */
    get ubyte(): number { return this.readByte(true); }

    /** Read a signed 16-bit integer. */
    get int16(): number { return this.readInt16(); }

    /** Read a signed 16-bit integer. */
    get short(): number { return this.readInt16(); }

    /** Read a signed 16-bit integer. */
    get word(): number { return this.readInt16(); }

    /** Read an unsigned 16-bit integer. */
    get uint16(): number { return this.readInt16(true); }

    /** Read an unsigned 16-bit integer. */
    get ushort(): number { return this.readInt16(true); }

    /** Read an unsigned 16-bit integer. */
    get uword(): number { return this.readInt16(true); }

    /** Read a signed 16-bit integer (little-endian). */
    get int16le(): number { return this.readInt16(false, "little"); }

    /** Read a signed 16-bit integer (little-endian). */
    get shortle(): number { return this.readInt16(false, "little"); }

    /** Read a signed 16-bit integer (little-endian). */
    get wordle(): number { return this.readInt16(false, "little"); }

    /** Read an unsigned 16-bit integer (little-endian). */
    get uint16le(): number { return this.readInt16(true, "little"); }

    /** Read an unsigned 16-bit integer (little-endian). */
    get ushortle(): number { return this.readInt16(true, "little"); }

    /** Read an unsigned 16-bit integer (little-endian). */
    get uwordle(): number { return this.readInt16(true, "little"); }

    /** Read a signed 16-bit integer (big-endian). */
    get int16be(): number { return this.readInt16(false, "big"); }

    /** Read a signed 16-bit integer (big-endian). */
    get shortbe(): number { return this.readInt16(false, "big"); }

    /** Read a signed 16-bit integer (big-endian). */
    get wordbe(): number { return this.readInt16(false, "big"); }

    /** Read an unsigned 16-bit integer (big-endian). */
    get uint16be(): number { return this.readInt16(true, "big"); }

    /** Read an unsigned 16-bit integer (big-endian). */
    get ushortbe(): number { return this.readInt16(true, "big"); }

    /** Read an unsigned 16-bit integer (big-endian). */
    get uwordbe(): number { return this.readInt16(true, "big"); }

    /** Read a signed 32-bit integer. */
    get int(): number { return this.readInt32(); }

    /** Read a signed 32-bit integer. */
    get dword(): number { return this.readInt32(); }

    /** Read a signed 32-bit integer. */
    get int32(): number { return this.readInt32(); }

    /** Read a signed 32-bit integer. */
    get long(): number { return this.readInt32(); }

    /** Read an unsigned 32-bit integer. */
    get uint(): number { return this.readInt32(true); }

    /** Read an unsigned 32-bit integer. */
    get udword(): number { return this.readInt32(true); }

    /** Read an unsigned 32-bit integer. */
    get uint32(): number { return this.readInt32(true); }

    /** Read an unsigned 32-bit integer. */
    get ulong(): number { return this.readInt32(true); }

    /** Read a signed 32-bit integer (little-endian). */
    get intle(): number { return this.readInt32(false, "little"); }

    /** Read a signed 32-bit integer (little-endian). */
    get dwordle(): number { return this.readInt32(false, "little"); }

    /** Read a signed 32-bit integer (little-endian). */
    get int32le(): number { return this.readInt32(false, "little"); }

    /** Read a signed 32-bit integer (little-endian). */
    get longle(): number { return this.readInt32(false, "little"); }

    /** Read an unsigned 32-bit integer (little-endian). */
    get uintle(): number { return this.readInt32(true, "little"); }

    /** Read an unsigned 32-bit integer (little-endian). */
    get udwordle(): number { return this.readInt32(true, "little"); }

    /** Read an unsigned 32-bit integer (little-endian). */
    get uint32le(): number { return this.readInt32(true, "little"); }

    /** Read an unsigned 32-bit integer (little-endian). */
    get ulongle(): number { return this.readInt32(true, "little"); }

    /** Read a signed 32-bit integer (big-endian). */
    get intbe(): number { return this.readInt32(false, "big"); }

    /** Read a signed 32-bit integer (big-endian). */
    get dwordbe(): number { return this.readInt32(false, "big"); }

    /** Read a signed 32-bit integer (big-endian). */
    get int32be(): number { return this.readInt32(false, "big"); }

    /** Read a signed 32-bit integer (big-endian). */
    get longbe(): number { return this.readInt32(false, "big"); }

    /** Read an unsigned 32-bit integer (big-endian). */
    get uintbe(): number { return this.readInt32(true, "big"); }

    /** Read an unsigned 32-bit integer (big-endian). */
    get udwordbe(): number { return this.readInt32(true, "big"); }

    /** Read an unsigned 32-bit integer (big-endian). */
    get uint32be(): number { return this.readInt32(true, "big"); }

    /** Read an unsigned 32-bit integer (big-endian). */
    get ulongbe(): number { return this.readInt32(true, "big"); }

    /** Read a signed 64-bit integer. */
    get int64(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(); }

    /** Read a signed 64-bit integer. */
    get bigint(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(); }

    /** Read a signed 64-bit integer. */
    get quad(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(); }

    /** Read an unsigned 64-bit integer. */
    get uint64(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true); }

    /** Read an unsigned 64-bit integer. */
    get ubigint(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true); }

    /** Read an unsigned 64-bit integer. */
    get uquad(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true); }

    /** Read a signed 64-bit integer (little-endian). */
    get int64le(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(false, "little"); }

    /** Read a signed 64-bit integer (little-endian). */
    get bigintle(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(false, "little"); }

    /** Read a signed 64-bit integer (little-endian). */
    get quadle(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(false, "little"); }

    /** Read an unsigned 64-bit integer (little-endian). */
    get uint64le(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true, "little"); }

    /** Read an unsigned 64-bit integer (little-endian). */
    get ubigintle(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true, "little"); }

    /** Read an unsigned 64-bit integer (little-endian). */
    get uquadle(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true, "little"); }

    /** Read a signed 64-bit integer (big-endian). */
    get int64be(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(false, "big"); }

    /** Read a signed 64-bit integer (big-endian). */
    get bigintbe(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(false, "big"); }

    /** Read a signed 64-bit integer (big-endian). */
    get quadbe(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(false, "big"); }

    /** Read an unsigned 64-bit integer (big-endian). */
    get uint64be(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true, "big"); }

    /** Read an unsigned 64-bit integer (big-endian). */
    get ubigintbe(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true, "big"); }

    /** Read an unsigned 64-bit integer (big-endian). */
    get uquadbe(): alwaysBigInt extends true ? bigint : BigValue { return this.readInt64(true, "big"); }

    /** Read a 32-bit float. */
    get float(): number { return this.readFloat(); }

    /** Read a 32-bit float (little-endian). */
    get floatle(): number { return this.readFloat("little"); }

    /** Read a 32-bit float (big-endian). */
    get floatbe(): number { return this.readFloat("big"); }

    /** Read a 16-bit float. */
    get halffloat(): number { return this.readHalfFloat(); }

    /** Read a 16-bit float. */
    get half(): number { return this.readHalfFloat(); }

    /** Read a 16-bit float (little-endian). */
    get halffloatle(): number { return this.readHalfFloat("little"); }

    /** Read a 16-bit float (little-endian). */
    get halfle(): number { return this.readHalfFloat("little"); }

    /** Read a 16-bit float (big-endian). */
    get halffloatbe(): number { return this.readHalfFloat("big"); }

    /** Read a 16-bit float (big-endian). */
    get halfbe(): number { return this.readHalfFloat("big"); }

    /** Read a 64-bit float. */
    get doublefloat(): number { return this.readDoubleFloat(); }

    /** Read a 64-bit float. */
    get dfloat(): number { return this.readDoubleFloat(); }

    /** Read a 64-bit float (little-endian). */
    get doublefloatle(): number { return this.readDoubleFloat("little"); }

    /** Read a 64-bit float (little-endian). */
    get dfloatle(): number { return this.readDoubleFloat("little"); }

    /** Read a 64-bit float (big-endian). */
    get doublefloatbe(): number { return this.readDoubleFloat("big"); }

    /** Read a 64-bit float (big-endian). */
    get dfloatbe(): number { return this.readDoubleFloat("big"); }

    /** Read 1 signed bit. */
    get bit1(): number { return this.bit(1); }

    /** Read 1 unsigned bit. */
    get ubit1(): number { return this.bit(1, true); }

    /** Read 1 signed bit (little-endian). */
    get bit1le(): number { return this.bit(1, undefined, "little"); }

    /** Read 1 unsigned bit (little-endian). */
    get ubit1le(): number { return this.bit(1, true, "little"); }

    /** Read 1 signed bit (big-endian). */
    get bit1be(): number { return this.bit(1, undefined, "big"); }

    /** Read 1 unsigned bit (big-endian). */
    get ubit1be(): number { return this.bit(1, true, "big"); }

    /** Read 2 signed bits. */
    get bit2(): number { return this.bit(2); }

    /** Read 2 unsigned bits. */
    get ubit2(): number { return this.bit(2, true); }

    /** Read 2 signed bits (little-endian). */
    get bit2le(): number { return this.bit(2, undefined, "little"); }

    /** Read 2 unsigned bits (little-endian). */
    get ubit2le(): number { return this.bit(2, true, "little"); }

    /** Read 2 signed bits (big-endian). */
    get bit2be(): number { return this.bit(2, undefined, "big"); }

    /** Read 2 unsigned bits (big-endian). */
    get ubit2be(): number { return this.bit(2, true, "big"); }

    /** Read 3 signed bits. */
    get bit3(): number { return this.bit(3); }

    /** Read 3 unsigned bits. */
    get ubit3(): number { return this.bit(3, true); }

    /** Read 3 signed bits (little-endian). */
    get bit3le(): number { return this.bit(3, undefined, "little"); }

    /** Read 3 unsigned bits (little-endian). */
    get ubit3le(): number { return this.bit(3, true, "little"); }

    /** Read 3 signed bits (big-endian). */
    get bit3be(): number { return this.bit(3, undefined, "big"); }

    /** Read 3 unsigned bits (big-endian). */
    get ubit3be(): number { return this.bit(3, true, "big"); }

    /** Read 4 signed bits. */
    get bit4(): number { return this.bit(4); }

    /** Read 4 unsigned bits. */
    get ubit4(): number { return this.bit(4, true); }

    /** Read 4 signed bits (little-endian). */
    get bit4le(): number { return this.bit(4, undefined, "little"); }

    /** Read 4 unsigned bits (little-endian). */
    get ubit4le(): number { return this.bit(4, true, "little"); }

    /** Read 4 signed bits (big-endian). */
    get bit4be(): number { return this.bit(4, undefined, "big"); }

    /** Read 4 unsigned bits (big-endian). */
    get ubit4be(): number { return this.bit(4, true, "big"); }

    /** Read 5 signed bits. */
    get bit5(): number { return this.bit(5); }

    /** Read 5 unsigned bits. */
    get ubit5(): number { return this.bit(5, true); }

    /** Read 5 signed bits (little-endian). */
    get bit5le(): number { return this.bit(5, undefined, "little"); }

    /** Read 5 unsigned bits (little-endian). */
    get ubit5le(): number { return this.bit(5, true, "little"); }

    /** Read 5 signed bits (big-endian). */
    get bit5be(): number { return this.bit(5, undefined, "big"); }

    /** Read 5 unsigned bits (big-endian). */
    get ubit5be(): number { return this.bit(5, true, "big"); }

    /** Read 6 signed bits. */
    get bit6(): number { return this.bit(6); }

    /** Read 6 unsigned bits. */
    get ubit6(): number { return this.bit(6, true); }

    /** Read 6 signed bits (little-endian). */
    get bit6le(): number { return this.bit(6, undefined, "little"); }

    /** Read 6 unsigned bits (little-endian). */
    get ubit6le(): number { return this.bit(6, true, "little"); }

    /** Read 6 signed bits (big-endian). */
    get bit6be(): number { return this.bit(6, undefined, "big"); }

    /** Read 6 unsigned bits (big-endian). */
    get ubit6be(): number { return this.bit(6, true, "big"); }

    /** Read 7 signed bits. */
    get bit7(): number { return this.bit(7); }

    /** Read 7 unsigned bits. */
    get ubit7(): number { return this.bit(7, true); }

    /** Read 7 signed bits (little-endian). */
    get bit7le(): number { return this.bit(7, undefined, "little"); }

    /** Read 7 unsigned bits (little-endian). */
    get ubit7le(): number { return this.bit(7, true, "little"); }

    /** Read 7 signed bits (big-endian). */
    get bit7be(): number { return this.bit(7, undefined, "big"); }

    /** Read 7 unsigned bits (big-endian). */
    get ubit7be(): number { return this.bit(7, true, "big"); }

    /** Read 8 signed bits. */
    get bit8(): number { return this.bit(8); }

    /** Read 8 unsigned bits. */
    get ubit8(): number { return this.bit(8, true); }

    /** Read 8 signed bits (little-endian). */
    get bit8le(): number { return this.bit(8, undefined, "little"); }

    /** Read 8 unsigned bits (little-endian). */
    get ubit8le(): number { return this.bit(8, true, "little"); }

    /** Read 8 signed bits (big-endian). */
    get bit8be(): number { return this.bit(8, undefined, "big"); }

    /** Read 8 unsigned bits (big-endian). */
    get ubit8be(): number { return this.bit(8, true, "big"); }

    /** Read 9 signed bits. */
    get bit9(): number { return this.bit(9); }

    /** Read 9 unsigned bits. */
    get ubit9(): number { return this.bit(9, true); }

    /** Read 9 signed bits (little-endian). */
    get bit9le(): number { return this.bit(9, undefined, "little"); }

    /** Read 9 unsigned bits (little-endian). */
    get ubit9le(): number { return this.bit(9, true, "little"); }

    /** Read 9 signed bits (big-endian). */
    get bit9be(): number { return this.bit(9, undefined, "big"); }

    /** Read 9 unsigned bits (big-endian). */
    get ubit9be(): number { return this.bit(9, true, "big"); }

    /** Read 10 signed bits. */
    get bit10(): number { return this.bit(10); }

    /** Read 10 unsigned bits. */
    get ubit10(): number { return this.bit(10, true); }

    /** Read 10 signed bits (little-endian). */
    get bit10le(): number { return this.bit(10, undefined, "little"); }

    /** Read 10 unsigned bits (little-endian). */
    get ubit10le(): number { return this.bit(10, true, "little"); }

    /** Read 10 signed bits (big-endian). */
    get bit10be(): number { return this.bit(10, undefined, "big"); }

    /** Read 10 unsigned bits (big-endian). */
    get ubit10be(): number { return this.bit(10, true, "big"); }

    /** Read 11 signed bits. */
    get bit11(): number { return this.bit(11); }

    /** Read 11 unsigned bits. */
    get ubit11(): number { return this.bit(11, true); }

    /** Read 11 signed bits (little-endian). */
    get bit11le(): number { return this.bit(11, undefined, "little"); }

    /** Read 11 unsigned bits (little-endian). */
    get ubit11le(): number { return this.bit(11, true, "little"); }

    /** Read 11 signed bits (big-endian). */
    get bit11be(): number { return this.bit(11, undefined, "big"); }

    /** Read 11 unsigned bits (big-endian). */
    get ubit11be(): number { return this.bit(11, true, "big"); }

    /** Read 12 signed bits. */
    get bit12(): number { return this.bit(12); }

    /** Read 12 unsigned bits. */
    get ubit12(): number { return this.bit(12, true); }

    /** Read 12 signed bits (little-endian). */
    get bit12le(): number { return this.bit(12, undefined, "little"); }

    /** Read 12 unsigned bits (little-endian). */
    get ubit12le(): number { return this.bit(12, true, "little"); }

    /** Read 12 signed bits (big-endian). */
    get bit12be(): number { return this.bit(12, undefined, "big"); }

    /** Read 12 unsigned bits (big-endian). */
    get ubit12be(): number { return this.bit(12, true, "big"); }

    /** Read 13 signed bits. */
    get bit13(): number { return this.bit(13); }

    /** Read 13 unsigned bits. */
    get ubit13(): number { return this.bit(13, true); }

    /** Read 13 signed bits (little-endian). */
    get bit13le(): number { return this.bit(13, undefined, "little"); }

    /** Read 13 unsigned bits (little-endian). */
    get ubit13le(): number { return this.bit(13, true, "little"); }

    /** Read 13 signed bits (big-endian). */
    get bit13be(): number { return this.bit(13, undefined, "big"); }

    /** Read 13 unsigned bits (big-endian). */
    get ubit13be(): number { return this.bit(13, true, "big"); }

    /** Read 14 signed bits. */
    get bit14(): number { return this.bit(14); }

    /** Read 14 unsigned bits. */
    get ubit14(): number { return this.bit(14, true); }

    /** Read 14 signed bits (little-endian). */
    get bit14le(): number { return this.bit(14, undefined, "little"); }

    /** Read 14 unsigned bits (little-endian). */
    get ubit14le(): number { return this.bit(14, true, "little"); }

    /** Read 14 signed bits (big-endian). */
    get bit14be(): number { return this.bit(14, undefined, "big"); }

    /** Read 14 unsigned bits (big-endian). */
    get ubit14be(): number { return this.bit(14, true, "big"); }

    /** Read 15 signed bits. */
    get bit15(): number { return this.bit(15); }

    /** Read 15 unsigned bits. */
    get ubit15(): number { return this.bit(15, true); }

    /** Read 15 signed bits (little-endian). */
    get bit15le(): number { return this.bit(15, undefined, "little"); }

    /** Read 15 unsigned bits (little-endian). */
    get ubit15le(): number { return this.bit(15, true, "little"); }

    /** Read 15 signed bits (big-endian). */
    get bit15be(): number { return this.bit(15, undefined, "big"); }

    /** Read 15 unsigned bits (big-endian). */
    get ubit15be(): number { return this.bit(15, true, "big"); }

    /** Read 16 signed bits. */
    get bit16(): number { return this.bit(16); }

    /** Read 16 unsigned bits. */
    get ubit16(): number { return this.bit(16, true); }

    /** Read 16 signed bits (little-endian). */
    get bit16le(): number { return this.bit(16, undefined, "little"); }

    /** Read 16 unsigned bits (little-endian). */
    get ubit16le(): number { return this.bit(16, true, "little"); }

    /** Read 16 signed bits (big-endian). */
    get bit16be(): number { return this.bit(16, undefined, "big"); }

    /** Read 16 unsigned bits (big-endian). */
    get ubit16be(): number { return this.bit(16, true, "big"); }

    /** Read 17 signed bits. */
    get bit17(): number { return this.bit(17); }

    /** Read 17 unsigned bits. */
    get ubit17(): number { return this.bit(17, true); }

    /** Read 17 signed bits (little-endian). */
    get bit17le(): number { return this.bit(17, undefined, "little"); }

    /** Read 17 unsigned bits (little-endian). */
    get ubit17le(): number { return this.bit(17, true, "little"); }

    /** Read 17 signed bits (big-endian). */
    get bit17be(): number { return this.bit(17, undefined, "big"); }

    /** Read 17 unsigned bits (big-endian). */
    get ubit17be(): number { return this.bit(17, true, "big"); }

    /** Read 18 signed bits. */
    get bit18(): number { return this.bit(18); }

    /** Read 18 unsigned bits. */
    get ubit18(): number { return this.bit(18, true); }

    /** Read 18 signed bits (little-endian). */
    get bit18le(): number { return this.bit(18, undefined, "little"); }

    /** Read 18 unsigned bits (little-endian). */
    get ubit18le(): number { return this.bit(18, true, "little"); }

    /** Read 18 signed bits (big-endian). */
    get bit18be(): number { return this.bit(18, undefined, "big"); }

    /** Read 18 unsigned bits (big-endian). */
    get ubit18be(): number { return this.bit(18, true, "big"); }

    /** Read 19 signed bits. */
    get bit19(): number { return this.bit(19); }

    /** Read 19 unsigned bits. */
    get ubit19(): number { return this.bit(19, true); }

    /** Read 19 signed bits (little-endian). */
    get bit19le(): number { return this.bit(19, undefined, "little"); }

    /** Read 19 unsigned bits (little-endian). */
    get ubit19le(): number { return this.bit(19, true, "little"); }

    /** Read 19 signed bits (big-endian). */
    get bit19be(): number { return this.bit(19, undefined, "big"); }

    /** Read 19 unsigned bits (big-endian). */
    get ubit19be(): number { return this.bit(19, true, "big"); }

    /** Read 20 signed bits. */
    get bit20(): number { return this.bit(20); }

    /** Read 20 unsigned bits. */
    get ubit20(): number { return this.bit(20, true); }

    /** Read 20 signed bits (little-endian). */
    get bit20le(): number { return this.bit(20, undefined, "little"); }

    /** Read 20 unsigned bits (little-endian). */
    get ubit20le(): number { return this.bit(20, true, "little"); }

    /** Read 20 signed bits (big-endian). */
    get bit20be(): number { return this.bit(20, undefined, "big"); }

    /** Read 20 unsigned bits (big-endian). */
    get ubit20be(): number { return this.bit(20, true, "big"); }

    /** Read 21 signed bits. */
    get bit21(): number { return this.bit(21); }

    /** Read 21 unsigned bits. */
    get ubit21(): number { return this.bit(21, true); }

    /** Read 21 signed bits (little-endian). */
    get bit21le(): number { return this.bit(21, undefined, "little"); }

    /** Read 21 unsigned bits (little-endian). */
    get ubit21le(): number { return this.bit(21, true, "little"); }

    /** Read 21 signed bits (big-endian). */
    get bit21be(): number { return this.bit(21, undefined, "big"); }

    /** Read 21 unsigned bits (big-endian). */
    get ubit21be(): number { return this.bit(21, true, "big"); }

    /** Read 22 signed bits. */
    get bit22(): number { return this.bit(22); }

    /** Read 22 unsigned bits. */
    get ubit22(): number { return this.bit(22, true); }

    /** Read 22 signed bits (little-endian). */
    get bit22le(): number { return this.bit(22, undefined, "little"); }

    /** Read 22 unsigned bits (little-endian). */
    get ubit22le(): number { return this.bit(22, true, "little"); }

    /** Read 22 signed bits (big-endian). */
    get bit22be(): number { return this.bit(22, undefined, "big"); }

    /** Read 22 unsigned bits (big-endian). */
    get ubit22be(): number { return this.bit(22, true, "big"); }

    /** Read 23 signed bits. */
    get bit23(): number { return this.bit(23); }

    /** Read 23 unsigned bits. */
    get ubit23(): number { return this.bit(23, true); }

    /** Read 23 signed bits (little-endian). */
    get bit23le(): number { return this.bit(23, undefined, "little"); }

    /** Read 23 unsigned bits (little-endian). */
    get ubit23le(): number { return this.bit(23, true, "little"); }

    /** Read 23 signed bits (big-endian). */
    get bit23be(): number { return this.bit(23, undefined, "big"); }

    /** Read 23 unsigned bits (big-endian). */
    get ubit23be(): number { return this.bit(23, true, "big"); }

    /** Read 24 signed bits. */
    get bit24(): number { return this.bit(24); }

    /** Read 24 unsigned bits. */
    get ubit24(): number { return this.bit(24, true); }

    /** Read 24 signed bits (little-endian). */
    get bit24le(): number { return this.bit(24, undefined, "little"); }

    /** Read 24 unsigned bits (little-endian). */
    get ubit24le(): number { return this.bit(24, true, "little"); }

    /** Read 24 signed bits (big-endian). */
    get bit24be(): number { return this.bit(24, undefined, "big"); }

    /** Read 24 unsigned bits (big-endian). */
    get ubit24be(): number { return this.bit(24, true, "big"); }

    /** Read 25 signed bits. */
    get bit25(): number { return this.bit(25); }

    /** Read 25 unsigned bits. */
    get ubit25(): number { return this.bit(25, true); }

    /** Read 25 signed bits (little-endian). */
    get bit25le(): number { return this.bit(25, undefined, "little"); }

    /** Read 25 unsigned bits (little-endian). */
    get ubit25le(): number { return this.bit(25, true, "little"); }

    /** Read 25 signed bits (big-endian). */
    get bit25be(): number { return this.bit(25, undefined, "big"); }

    /** Read 25 unsigned bits (big-endian). */
    get ubit25be(): number { return this.bit(25, true, "big"); }

    /** Read 26 signed bits. */
    get bit26(): number { return this.bit(26); }

    /** Read 26 unsigned bits. */
    get ubit26(): number { return this.bit(26, true); }

    /** Read 26 signed bits (little-endian). */
    get bit26le(): number { return this.bit(26, undefined, "little"); }

    /** Read 26 unsigned bits (little-endian). */
    get ubit26le(): number { return this.bit(26, true, "little"); }

    /** Read 26 signed bits (big-endian). */
    get bit26be(): number { return this.bit(26, undefined, "big"); }

    /** Read 26 unsigned bits (big-endian). */
    get ubit26be(): number { return this.bit(26, true, "big"); }

    /** Read 27 signed bits. */
    get bit27(): number { return this.bit(27); }

    /** Read 27 unsigned bits. */
    get ubit27(): number { return this.bit(27, true); }

    /** Read 27 signed bits (little-endian). */
    get bit27le(): number { return this.bit(27, undefined, "little"); }

    /** Read 27 unsigned bits (little-endian). */
    get ubit27le(): number { return this.bit(27, true, "little"); }

    /** Read 27 signed bits (big-endian). */
    get bit27be(): number { return this.bit(27, undefined, "big"); }

    /** Read 27 unsigned bits (big-endian). */
    get ubit27be(): number { return this.bit(27, true, "big"); }

    /** Read 28 signed bits. */
    get bit28(): number { return this.bit(28); }

    /** Read 28 unsigned bits. */
    get ubit28(): number { return this.bit(28, true); }

    /** Read 28 signed bits (little-endian). */
    get bit28le(): number { return this.bit(28, undefined, "little"); }

    /** Read 28 unsigned bits (little-endian). */
    get ubit28le(): number { return this.bit(28, true, "little"); }

    /** Read 28 signed bits (big-endian). */
    get bit28be(): number { return this.bit(28, undefined, "big"); }

    /** Read 28 unsigned bits (big-endian). */
    get ubit28be(): number { return this.bit(28, true, "big"); }

    /** Read 29 signed bits. */
    get bit29(): number { return this.bit(29); }

    /** Read 29 unsigned bits. */
    get ubit29(): number { return this.bit(29, true); }

    /** Read 29 signed bits (little-endian). */
    get bit29le(): number { return this.bit(29, undefined, "little"); }

    /** Read 29 unsigned bits (little-endian). */
    get ubit29le(): number { return this.bit(29, true, "little"); }

    /** Read 29 signed bits (big-endian). */
    get bit29be(): number { return this.bit(29, undefined, "big"); }

    /** Read 29 unsigned bits (big-endian). */
    get ubit29be(): number { return this.bit(29, true, "big"); }

    /** Read 30 signed bits. */
    get bit30(): number { return this.bit(30); }

    /** Read 30 unsigned bits. */
    get ubit30(): number { return this.bit(30, true); }

    /** Read 30 signed bits (little-endian). */
    get bit30le(): number { return this.bit(30, undefined, "little"); }

    /** Read 30 unsigned bits (little-endian). */
    get ubit30le(): number { return this.bit(30, true, "little"); }

    /** Read 30 signed bits (big-endian). */
    get bit30be(): number { return this.bit(30, undefined, "big"); }

    /** Read 30 unsigned bits (big-endian). */
    get ubit30be(): number { return this.bit(30, true, "big"); }

    /** Read 31 signed bits. */
    get bit31(): number { return this.bit(31); }

    /** Read 31 unsigned bits. */
    get ubit31(): number { return this.bit(31, true); }

    /** Read 31 signed bits (little-endian). */
    get bit31le(): number { return this.bit(31, undefined, "little"); }

    /** Read 31 unsigned bits (little-endian). */
    get ubit31le(): number { return this.bit(31, true, "little"); }

    /** Read 31 signed bits (big-endian). */
    get bit31be(): number { return this.bit(31, undefined, "big"); }

    /** Read 31 unsigned bits (big-endian). */
    get ubit31be(): number { return this.bit(31, true, "big"); }

    /** Read 32 signed bits. */
    get bit32(): number { return this.bit(32); }

    /** Read 32 unsigned bits. */
    get ubit32(): number { return this.bit(32, true); }

    /** Read 32 signed bits (little-endian). */
    get bit32le(): number { return this.bit(32, undefined, "little"); }

    /** Read 32 unsigned bits (little-endian). */
    get ubit32le(): number { return this.bit(32, true, "little"); }

    /** Read 32 signed bits (big-endian). */
    get bit32be(): number { return this.bit(32, undefined, "big"); }

    /** Read 32 unsigned bits (big-endian). */
    get ubit32be(): number { return this.bit(32, true, "big"); }

    // #endregion Generated mechanical aliases

    //
    // #region string reader
    //

    /**
    * Reads string, use options object for different types.
    * 
    * @param {stringOptions} options 
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - ascii, utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["stripNull"]?} options.stripNull - removes 0x00 characters
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types 
    * @param {stringOptions["endian"]?} options.endian - for utf-16, utf-32, wide-pascal or double-wide-pascal
    * @returns {string}
    */
    string(options: stringOptions = this.strDefaults): string {
        return this.readString(options);
    };

    /**
    * Reads string using setting from .strDefaults
    * 
    * Default is ``utf-8``
    * 
    * @returns {string}
    */
    get str(): string {
        return this.readString(this.strDefaults);
    };

    /**
    * Reads UTF-8 (C) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    utf8string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads UTF-8 (C) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.utf8string(length, terminateValue, stripNull);
    };

    /**
    * Reads ANSI string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads latin1 string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    latin1string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-8", encoding: "iso-8859-1", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    utf16string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.utf16string(length, terminateValue, stripNull, endian);
    };

    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.utf16string(length, terminateValue, stripNull, "little");
    };

    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.utf16stringle(length, terminateValue, stripNull);
    };

    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.utf16string(length, terminateValue, stripNull, "big");
    };

    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.utf16stringbe(length, terminateValue, stripNull);
    };

    /**
    * Reads UTF-32 (Unicode) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    utf32string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "utf-32", encoding: "utf-32", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads UTF-32 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    utf32stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.utf32string(length, terminateValue, stripNull, "little");
    };

    /**
    * Reads UTF-32 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    utf32stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.utf32string(length, terminateValue, stripNull, "big");
    };

    /**
    * Reads Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string in little endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    pstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string {
        return this.pstring(lengthReadSize, stripNull, "little");
    };

    /**
    * Reads Pascal string in big endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    pstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string {
        return this.pstring(lengthReadSize, stripNull, "big");
    };

    /**
    * Reads Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.pstring(1, stripNull, endian);
    };

    /**
    * Reads Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    pstring1le(stripNull?: stringOptions["stripNull"]): string {
        return this.pstring1(stripNull, "little");
    };

    /**
    * Reads Pascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    pstring1be(stripNull?: stringOptions["stripNull"]): string {
        return this.pstring1(stripNull, "big");
    };

    /**
    * Reads Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.pstring(2, stripNull, endian);
    };

    /**
    * Reads Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    pstring2le(stripNull?: stringOptions["stripNull"]): string {
        return this.pstring2(stripNull, "little");
    };

    /**
    * Reads Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    pstring2be(stripNull?: stringOptions["stripNull"]): string {
        return this.pstring2(stripNull, "big");
    };

    /**
    * Reads Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.pstring(4, stripNull, endian);
    };

    /**
    * Reads Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    pstring4le(stripNull?: stringOptions["stripNull"]): string {
        return this.pstring4(stripNull, "little");
    };

    /**
    * Reads Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    pstring4be(stripNull?: stringOptions["stripNull"]): string {
        return this.pstring4(stripNull, "big");
    };

    /**
    * Reads Wide Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide Pascal string 1 byte length read in little endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    wpstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string {
        return this.wpstring(lengthReadSize, stripNull, "little");
    };

    /**
    * Reads Wide Pascal string 1 byte length read in big endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    wpstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string {
        return this.wpstring(lengthReadSize, stripNull, "big");
    };

    /**
    * Reads Wide Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.wpstring(1, stripNull, endian);
    };

    /**
    * Reads Wide Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    wpstring1le(stripNull?: stringOptions["stripNull"]): string {
        return this.wpstring1(stripNull, "little");
    };

    /**
    * Reads Wide Pascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    wpstring1be(stripNull?: stringOptions["stripNull"]): string {
        return this.wpstring1(stripNull, "big");
    };

    /**
    * Reads Wide Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.wpstring(2, stripNull, endian);
    };

    /**
    * Reads Wide Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    wpstring2le(stripNull?: stringOptions["stripNull"]): string {
        return this.wpstring2(stripNull, "little");
    };

    /**
    * Reads Wide Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    wpstring2be(stripNull?: stringOptions["stripNull"]): string {
        return this.wpstring2(stripNull, "big");
    };

    /**
    * Reads Wide Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.wpstring(4, stripNull, endian);
    };

    /**
    * Reads Wide Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    wpstring4le(stripNull?: stringOptions["stripNull"]): string {
        return this.wpstring4(stripNull, "little");
    };

    /**
    * Reads Wide Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    wpstring4be(stripNull?: stringOptions["stripNull"]): string {
        return this.wpstring4(stripNull, "big");
    };

    /**
    * Reads Double Wide Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    dwpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "double-wide-pascal", encoding: "utf-32", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Double Wide Pascal string 1 byte length read in little endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    dwpstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string {
        return this.dwpstring(lengthReadSize, stripNull, "little");
    };

    /**
    * Reads Double Wide Pascal string 1 byte length read in big endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    dwpstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string {
        return this.dwpstring(lengthReadSize, stripNull, "big");
    };

    /**
    * Reads Double Wide Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    dwpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.dwpstring(1, stripNull, endian);
    };

    /**
    * Reads Double Wide Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    dwpstring1le(stripNull?: stringOptions["stripNull"]): string {
        return this.dwpstring1(stripNull, "little");
    };

    /**
    * Reads Double WidePascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    dwpstring1be(stripNull?: stringOptions["stripNull"]): string {
        return this.dwpstring1(stripNull, "big");
    };

    /**
    * Reads Double Wide Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    dwpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.dwpstring(2, stripNull, endian);
    };

    /**
    * Reads Double Wide Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    dwpstring2le(stripNull?: stringOptions["stripNull"]): string {
        return this.dwpstring2(stripNull, "little");
    };

    /**
    * Reads Double Wide Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    dwpstring2be(stripNull?: stringOptions["stripNull"]): string {
        return this.dwpstring2(stripNull, "big");
    };

    /**
    * Reads Double Wide Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {string}
    */
    dwpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.dwpstring(4, stripNull, endian);
    };

    /**
    * Reads Double Wide Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    dwpstring4le(stripNull?: stringOptions["stripNull"]): string {
        return this.dwpstring4(stripNull, "little");
    };

    /**
    * Reads Double Wide Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {string}
    */
    dwpstring4be(stripNull?: stringOptions["stripNull"]): string {
        return this.dwpstring4(stripNull, "big");
    };
};