import {
    BigValue,
    BiOptions,
    endian,
    stringOptions,
} from "./common.js";
import { BiSyncEngine } from './core/engine/sync-engine.js';

/**
 * Binary writer, includes bitfields and strings.
 *
 * @param {DataType} input - File path or a `Buffer` or `Uint8Array`. Always found in .{@link data}
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
 * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
 * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
 * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
 * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
 * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
 * 
 * @since 2.0
 */
export class BiWriter<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false> extends BiSyncEngine<alwaysBigInt> {
    constructor(input?: DataType, options: BiOptions<alwaysBigInt> = {}) {
        const growthIncrement = options.growthIncrement ?? 0x100000;

        if (input == undefined) {
            input = new Uint8Array(growthIncrement) as DataType;

            console.warn(`BiWriter started without data. Creating Uint8Array with growthIncrement.`);
        }
        // Merge over defaults into a fresh object; never mutate the caller's options.
        super(input, {
            byteOffset: options.byteOffset ?? 0,
            bitOffset: options.bitOffset ?? 0,
            endianness: options.endianness ?? "little",
            strict: options.strict ?? false,
            growthIncrement: growthIncrement,
            enforceBigInt: options.enforceBigInt ?? false as alwaysBigInt,
            readOnly: options.readOnly ?? false,
        });
    };

    //
    // #region Bit Aliases
    //

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    bit(value: number, bits: number, unsigned?: boolean, endian?: endian): void {
        return this.writeBit(value, bits, unsigned, endian);
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(value: number, bits: number, endian?: endian): void {
        return this.writeBit(value, bits, true, endian);
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitbe(value: number, bits: number, unsigned?: boolean): void {
        return this.bit(value, bits, unsigned, "big");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitbe(value: number, bits: number): void {
        return this.bit(value, bits, true, "big");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitle(value: number, bits: number): void {
        return this.bit(value, bits, true, "little");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitle(value: number, bits: number, unsigned?: boolean): void {
        return this.bit(value, bits, unsigned, "little");
    };
    //
    // #region Generated mechanical aliases
    //

    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====
    // Behaviour is verified by test/aliases.parity.test.ts.

    /** Write a signed 8-bit integer. */
    set byte(value: number) { this.writeByte(value); }

    /** Write a signed 8-bit integer. */
    set int8(value: number) { this.writeByte(value); }

    /** Write an unsigned 8-bit integer. */
    set uint8(value: number) { this.writeByte(value, true); }

    /** Write an unsigned 8-bit integer. */
    set ubyte(value: number) { this.writeByte(value, true); }

    /** Write a signed 16-bit integer. */
    set int16(value: number) { this.writeInt16(value); }

    /** Write a signed 16-bit integer. */
    set short(value: number) { this.writeInt16(value); }

    /** Write a signed 16-bit integer. */
    set word(value: number) { this.writeInt16(value); }

    /** Write an unsigned 16-bit integer. */
    set uint16(value: number) { this.writeInt16(value, true); }

    /** Write an unsigned 16-bit integer. */
    set ushort(value: number) { this.writeInt16(value, true); }

    /** Write an unsigned 16-bit integer. */
    set uword(value: number) { this.writeInt16(value, true); }

    /** Write a signed 16-bit integer (little-endian). */
    set int16le(value: number) { this.writeInt16(value, false, "little"); }

    /** Write a signed 16-bit integer (little-endian). */
    set shortle(value: number) { this.writeInt16(value, false, "little"); }

    /** Write a signed 16-bit integer (little-endian). */
    set wordle(value: number) { this.writeInt16(value, false, "little"); }

    /** Write an unsigned 16-bit integer (little-endian). */
    set uint16le(value: number) { this.writeInt16(value, true, "little"); }

    /** Write an unsigned 16-bit integer (little-endian). */
    set ushortle(value: number) { this.writeInt16(value, true, "little"); }

    /** Write an unsigned 16-bit integer (little-endian). */
    set uwordle(value: number) { this.writeInt16(value, true, "little"); }

    /** Write a signed 16-bit integer (big-endian). */
    set int16be(value: number) { this.writeInt16(value, false, "big"); }

    /** Write a signed 16-bit integer (big-endian). */
    set shortbe(value: number) { this.writeInt16(value, false, "big"); }

    /** Write a signed 16-bit integer (big-endian). */
    set wordbe(value: number) { this.writeInt16(value, false, "big"); }

    /** Write an unsigned 16-bit integer (big-endian). */
    set uint16be(value: number) { this.writeInt16(value, true, "big"); }

    /** Write an unsigned 16-bit integer (big-endian). */
    set ushortbe(value: number) { this.writeInt16(value, true, "big"); }

    /** Write an unsigned 16-bit integer (big-endian). */
    set uwordbe(value: number) { this.writeInt16(value, true, "big"); }

    /** Write a signed 32-bit integer. */
    set int(value: number) { this.writeInt32(value); }

    /** Write a signed 32-bit integer. */
    set dword(value: number) { this.writeInt32(value); }

    /** Write a signed 32-bit integer. */
    set int32(value: number) { this.writeInt32(value); }

    /** Write a signed 32-bit integer. */
    set long(value: number) { this.writeInt32(value); }

    /** Write an unsigned 32-bit integer. */
    set uint(value: number) { this.writeInt32(value, true); }

    /** Write an unsigned 32-bit integer. */
    set udword(value: number) { this.writeInt32(value, true); }

    /** Write an unsigned 32-bit integer. */
    set uint32(value: number) { this.writeInt32(value, true); }

    /** Write an unsigned 32-bit integer. */
    set ulong(value: number) { this.writeInt32(value, true); }

    /** Write a signed 32-bit integer (little-endian). */
    set intle(value: number) { this.writeInt32(value, false, "little"); }

    /** Write a signed 32-bit integer (little-endian). */
    set dwordle(value: number) { this.writeInt32(value, false, "little"); }

    /** Write a signed 32-bit integer (little-endian). */
    set int32le(value: number) { this.writeInt32(value, false, "little"); }

    /** Write a signed 32-bit integer (little-endian). */
    set longle(value: number) { this.writeInt32(value, false, "little"); }

    /** Write an unsigned 32-bit integer (little-endian). */
    set uintle(value: number) { this.writeInt32(value, true, "little"); }

    /** Write an unsigned 32-bit integer (little-endian). */
    set udwordle(value: number) { this.writeInt32(value, true, "little"); }

    /** Write an unsigned 32-bit integer (little-endian). */
    set uint32le(value: number) { this.writeInt32(value, true, "little"); }

    /** Write an unsigned 32-bit integer (little-endian). */
    set ulongle(value: number) { this.writeInt32(value, true, "little"); }

    /** Write a signed 32-bit integer (big-endian). */
    set intbe(value: number) { this.writeInt32(value, false, "big"); }

    /** Write a signed 32-bit integer (big-endian). */
    set dwordbe(value: number) { this.writeInt32(value, false, "big"); }

    /** Write a signed 32-bit integer (big-endian). */
    set int32be(value: number) { this.writeInt32(value, false, "big"); }

    /** Write a signed 32-bit integer (big-endian). */
    set longbe(value: number) { this.writeInt32(value, false, "big"); }

    /** Write an unsigned 32-bit integer (big-endian). */
    set uintbe(value: number) { this.writeInt32(value, true, "big"); }

    /** Write an unsigned 32-bit integer (big-endian). */
    set udwordbe(value: number) { this.writeInt32(value, true, "big"); }

    /** Write an unsigned 32-bit integer (big-endian). */
    set uint32be(value: number) { this.writeInt32(value, true, "big"); }

    /** Write an unsigned 32-bit integer (big-endian). */
    set ulongbe(value: number) { this.writeInt32(value, true, "big"); }

    /** Write a signed 64-bit integer. */
    set int64(value: BigValue) { this.writeInt64(value); }

    /** Write a signed 64-bit integer. */
    set bigint(value: BigValue) { this.writeInt64(value); }

    /** Write a signed 64-bit integer. */
    set quad(value: BigValue) { this.writeInt64(value); }

    /** Write an unsigned 64-bit integer. */
    set uint64(value: BigValue) { this.writeInt64(value, true); }

    /** Write an unsigned 64-bit integer. */
    set ubigint(value: BigValue) { this.writeInt64(value, true); }

    /** Write an unsigned 64-bit integer. */
    set uquad(value: BigValue) { this.writeInt64(value, true); }

    /** Write a signed 64-bit integer (little-endian). */
    set int64le(value: BigValue) { this.writeInt64(value, false, "little"); }

    /** Write a signed 64-bit integer (little-endian). */
    set bigintle(value: BigValue) { this.writeInt64(value, false, "little"); }

    /** Write a signed 64-bit integer (little-endian). */
    set quadle(value: BigValue) { this.writeInt64(value, false, "little"); }

    /** Write an unsigned 64-bit integer (little-endian). */
    set uint64le(value: BigValue) { this.writeInt64(value, true, "little"); }

    /** Write an unsigned 64-bit integer (little-endian). */
    set ubigintle(value: BigValue) { this.writeInt64(value, true, "little"); }

    /** Write an unsigned 64-bit integer (little-endian). */
    set uquadle(value: BigValue) { this.writeInt64(value, true, "little"); }

    /** Write a signed 64-bit integer (big-endian). */
    set int64be(value: BigValue) { this.writeInt64(value, false, "big"); }

    /** Write a signed 64-bit integer (big-endian). */
    set bigintbe(value: BigValue) { this.writeInt64(value, false, "big"); }

    /** Write a signed 64-bit integer (big-endian). */
    set quadbe(value: BigValue) { this.writeInt64(value, false, "big"); }

    /** Write an unsigned 64-bit integer (big-endian). */
    set uint64be(value: BigValue) { this.writeInt64(value, true, "big"); }

    /** Write an unsigned 64-bit integer (big-endian). */
    set ubigintbe(value: BigValue) { this.writeInt64(value, true, "big"); }

    /** Write an unsigned 64-bit integer (big-endian). */
    set uquadbe(value: BigValue) { this.writeInt64(value, true, "big"); }

    /** Write a 32-bit float. */
    set float(value: number) { this.writeFloat(value); }

    /** Write a 32-bit float (little-endian). */
    set floatle(value: number) { this.writeFloat(value, "little"); }

    /** Write a 32-bit float (big-endian). */
    set floatbe(value: number) { this.writeFloat(value, "big"); }

    /** Write a 16-bit float. */
    set halffloat(value: number) { this.writeHalfFloat(value); }

    /** Write a 16-bit float. */
    set half(value: number) { this.writeHalfFloat(value); }

    /** Write a 16-bit float (little-endian). */
    set halffloatle(value: number) { this.writeHalfFloat(value, "little"); }

    /** Write a 16-bit float (little-endian). */
    set halfle(value: number) { this.writeHalfFloat(value, "little"); }

    /** Write a 16-bit float (big-endian). */
    set halffloatbe(value: number) { this.writeHalfFloat(value, "big"); }

    /** Write a 16-bit float (big-endian). */
    set halfbe(value: number) { this.writeHalfFloat(value, "big"); }

    /** Write a 64-bit float. */
    set doublefloat(value: number) { this.writeDoubleFloat(value); }

    /** Write a 64-bit float. */
    set dfloat(value: number) { this.writeDoubleFloat(value); }

    /** Write a 64-bit float (little-endian). */
    set doublefloatle(value: number) { this.writeDoubleFloat(value, "little"); }

    /** Write a 64-bit float (little-endian). */
    set dfloatle(value: number) { this.writeDoubleFloat(value, "little"); }

    /** Write a 64-bit float (big-endian). */
    set doublefloatbe(value: number) { this.writeDoubleFloat(value, "big"); }

    /** Write a 64-bit float (big-endian). */
    set dfloatbe(value: number) { this.writeDoubleFloat(value, "big"); }

    /** Write 1 signed bit. */
    set bit1(value: number) { this.bit(value, 1); }

    /** Write 1 unsigned bit. */
    set ubit1(value: number) { this.bit(value, 1, true); }

    /** Write 1 signed bit (little-endian). */
    set bit1le(value: number) { this.bit(value, 1, undefined, "little"); }

    /** Write 1 unsigned bit (little-endian). */
    set ubit1le(value: number) { this.bit(value, 1, true, "little"); }

    /** Write 1 signed bit (big-endian). */
    set bit1be(value: number) { this.bit(value, 1, undefined, "big"); }

    /** Write 1 unsigned bit (big-endian). */
    set ubit1be(value: number) { this.bit(value, 1, true, "big"); }

    /** Write 2 signed bits. */
    set bit2(value: number) { this.bit(value, 2); }

    /** Write 2 unsigned bits. */
    set ubit2(value: number) { this.bit(value, 2, true); }

    /** Write 2 signed bits (little-endian). */
    set bit2le(value: number) { this.bit(value, 2, undefined, "little"); }

    /** Write 2 unsigned bits (little-endian). */
    set ubit2le(value: number) { this.bit(value, 2, true, "little"); }

    /** Write 2 signed bits (big-endian). */
    set bit2be(value: number) { this.bit(value, 2, undefined, "big"); }

    /** Write 2 unsigned bits (big-endian). */
    set ubit2be(value: number) { this.bit(value, 2, true, "big"); }

    /** Write 3 signed bits. */
    set bit3(value: number) { this.bit(value, 3); }

    /** Write 3 unsigned bits. */
    set ubit3(value: number) { this.bit(value, 3, true); }

    /** Write 3 signed bits (little-endian). */
    set bit3le(value: number) { this.bit(value, 3, undefined, "little"); }

    /** Write 3 unsigned bits (little-endian). */
    set ubit3le(value: number) { this.bit(value, 3, true, "little"); }

    /** Write 3 signed bits (big-endian). */
    set bit3be(value: number) { this.bit(value, 3, undefined, "big"); }

    /** Write 3 unsigned bits (big-endian). */
    set ubit3be(value: number) { this.bit(value, 3, true, "big"); }

    /** Write 4 signed bits. */
    set bit4(value: number) { this.bit(value, 4); }

    /** Write 4 unsigned bits. */
    set ubit4(value: number) { this.bit(value, 4, true); }

    /** Write 4 signed bits (little-endian). */
    set bit4le(value: number) { this.bit(value, 4, undefined, "little"); }

    /** Write 4 unsigned bits (little-endian). */
    set ubit4le(value: number) { this.bit(value, 4, true, "little"); }

    /** Write 4 signed bits (big-endian). */
    set bit4be(value: number) { this.bit(value, 4, undefined, "big"); }

    /** Write 4 unsigned bits (big-endian). */
    set ubit4be(value: number) { this.bit(value, 4, true, "big"); }

    /** Write 5 signed bits. */
    set bit5(value: number) { this.bit(value, 5); }

    /** Write 5 unsigned bits. */
    set ubit5(value: number) { this.bit(value, 5, true); }

    /** Write 5 signed bits (little-endian). */
    set bit5le(value: number) { this.bit(value, 5, undefined, "little"); }

    /** Write 5 unsigned bits (little-endian). */
    set ubit5le(value: number) { this.bit(value, 5, true, "little"); }

    /** Write 5 signed bits (big-endian). */
    set bit5be(value: number) { this.bit(value, 5, undefined, "big"); }

    /** Write 5 unsigned bits (big-endian). */
    set ubit5be(value: number) { this.bit(value, 5, true, "big"); }

    /** Write 6 signed bits. */
    set bit6(value: number) { this.bit(value, 6); }

    /** Write 6 unsigned bits. */
    set ubit6(value: number) { this.bit(value, 6, true); }

    /** Write 6 signed bits (little-endian). */
    set bit6le(value: number) { this.bit(value, 6, undefined, "little"); }

    /** Write 6 unsigned bits (little-endian). */
    set ubit6le(value: number) { this.bit(value, 6, true, "little"); }

    /** Write 6 signed bits (big-endian). */
    set bit6be(value: number) { this.bit(value, 6, undefined, "big"); }

    /** Write 6 unsigned bits (big-endian). */
    set ubit6be(value: number) { this.bit(value, 6, true, "big"); }

    /** Write 7 signed bits. */
    set bit7(value: number) { this.bit(value, 7); }

    /** Write 7 unsigned bits. */
    set ubit7(value: number) { this.bit(value, 7, true); }

    /** Write 7 signed bits (little-endian). */
    set bit7le(value: number) { this.bit(value, 7, undefined, "little"); }

    /** Write 7 unsigned bits (little-endian). */
    set ubit7le(value: number) { this.bit(value, 7, true, "little"); }

    /** Write 7 signed bits (big-endian). */
    set bit7be(value: number) { this.bit(value, 7, undefined, "big"); }

    /** Write 7 unsigned bits (big-endian). */
    set ubit7be(value: number) { this.bit(value, 7, true, "big"); }

    /** Write 8 signed bits. */
    set bit8(value: number) { this.bit(value, 8); }

    /** Write 8 unsigned bits. */
    set ubit8(value: number) { this.bit(value, 8, true); }

    /** Write 8 signed bits (little-endian). */
    set bit8le(value: number) { this.bit(value, 8, undefined, "little"); }

    /** Write 8 unsigned bits (little-endian). */
    set ubit8le(value: number) { this.bit(value, 8, true, "little"); }

    /** Write 8 signed bits (big-endian). */
    set bit8be(value: number) { this.bit(value, 8, undefined, "big"); }

    /** Write 8 unsigned bits (big-endian). */
    set ubit8be(value: number) { this.bit(value, 8, true, "big"); }

    /** Write 9 signed bits. */
    set bit9(value: number) { this.bit(value, 9); }

    /** Write 9 unsigned bits. */
    set ubit9(value: number) { this.bit(value, 9, true); }

    /** Write 9 signed bits (little-endian). */
    set bit9le(value: number) { this.bit(value, 9, undefined, "little"); }

    /** Write 9 unsigned bits (little-endian). */
    set ubit9le(value: number) { this.bit(value, 9, true, "little"); }

    /** Write 9 signed bits (big-endian). */
    set bit9be(value: number) { this.bit(value, 9, undefined, "big"); }

    /** Write 9 unsigned bits (big-endian). */
    set ubit9be(value: number) { this.bit(value, 9, true, "big"); }

    /** Write 10 signed bits. */
    set bit10(value: number) { this.bit(value, 10); }

    /** Write 10 unsigned bits. */
    set ubit10(value: number) { this.bit(value, 10, true); }

    /** Write 10 signed bits (little-endian). */
    set bit10le(value: number) { this.bit(value, 10, undefined, "little"); }

    /** Write 10 unsigned bits (little-endian). */
    set ubit10le(value: number) { this.bit(value, 10, true, "little"); }

    /** Write 10 signed bits (big-endian). */
    set bit10be(value: number) { this.bit(value, 10, undefined, "big"); }

    /** Write 10 unsigned bits (big-endian). */
    set ubit10be(value: number) { this.bit(value, 10, true, "big"); }

    /** Write 11 signed bits. */
    set bit11(value: number) { this.bit(value, 11); }

    /** Write 11 unsigned bits. */
    set ubit11(value: number) { this.bit(value, 11, true); }

    /** Write 11 signed bits (little-endian). */
    set bit11le(value: number) { this.bit(value, 11, undefined, "little"); }

    /** Write 11 unsigned bits (little-endian). */
    set ubit11le(value: number) { this.bit(value, 11, true, "little"); }

    /** Write 11 signed bits (big-endian). */
    set bit11be(value: number) { this.bit(value, 11, undefined, "big"); }

    /** Write 11 unsigned bits (big-endian). */
    set ubit11be(value: number) { this.bit(value, 11, true, "big"); }

    /** Write 12 signed bits. */
    set bit12(value: number) { this.bit(value, 12); }

    /** Write 12 unsigned bits. */
    set ubit12(value: number) { this.bit(value, 12, true); }

    /** Write 12 signed bits (little-endian). */
    set bit12le(value: number) { this.bit(value, 12, undefined, "little"); }

    /** Write 12 unsigned bits (little-endian). */
    set ubit12le(value: number) { this.bit(value, 12, true, "little"); }

    /** Write 12 signed bits (big-endian). */
    set bit12be(value: number) { this.bit(value, 12, undefined, "big"); }

    /** Write 12 unsigned bits (big-endian). */
    set ubit12be(value: number) { this.bit(value, 12, true, "big"); }

    /** Write 13 signed bits. */
    set bit13(value: number) { this.bit(value, 13); }

    /** Write 13 unsigned bits. */
    set ubit13(value: number) { this.bit(value, 13, true); }

    /** Write 13 signed bits (little-endian). */
    set bit13le(value: number) { this.bit(value, 13, undefined, "little"); }

    /** Write 13 unsigned bits (little-endian). */
    set ubit13le(value: number) { this.bit(value, 13, true, "little"); }

    /** Write 13 signed bits (big-endian). */
    set bit13be(value: number) { this.bit(value, 13, undefined, "big"); }

    /** Write 13 unsigned bits (big-endian). */
    set ubit13be(value: number) { this.bit(value, 13, true, "big"); }

    /** Write 14 signed bits. */
    set bit14(value: number) { this.bit(value, 14); }

    /** Write 14 unsigned bits. */
    set ubit14(value: number) { this.bit(value, 14, true); }

    /** Write 14 signed bits (little-endian). */
    set bit14le(value: number) { this.bit(value, 14, undefined, "little"); }

    /** Write 14 unsigned bits (little-endian). */
    set ubit14le(value: number) { this.bit(value, 14, true, "little"); }

    /** Write 14 signed bits (big-endian). */
    set bit14be(value: number) { this.bit(value, 14, undefined, "big"); }

    /** Write 14 unsigned bits (big-endian). */
    set ubit14be(value: number) { this.bit(value, 14, true, "big"); }

    /** Write 15 signed bits. */
    set bit15(value: number) { this.bit(value, 15); }

    /** Write 15 unsigned bits. */
    set ubit15(value: number) { this.bit(value, 15, true); }

    /** Write 15 signed bits (little-endian). */
    set bit15le(value: number) { this.bit(value, 15, undefined, "little"); }

    /** Write 15 unsigned bits (little-endian). */
    set ubit15le(value: number) { this.bit(value, 15, true, "little"); }

    /** Write 15 signed bits (big-endian). */
    set bit15be(value: number) { this.bit(value, 15, undefined, "big"); }

    /** Write 15 unsigned bits (big-endian). */
    set ubit15be(value: number) { this.bit(value, 15, true, "big"); }

    /** Write 16 signed bits. */
    set bit16(value: number) { this.bit(value, 16); }

    /** Write 16 unsigned bits. */
    set ubit16(value: number) { this.bit(value, 16, true); }

    /** Write 16 signed bits (little-endian). */
    set bit16le(value: number) { this.bit(value, 16, undefined, "little"); }

    /** Write 16 unsigned bits (little-endian). */
    set ubit16le(value: number) { this.bit(value, 16, true, "little"); }

    /** Write 16 signed bits (big-endian). */
    set bit16be(value: number) { this.bit(value, 16, undefined, "big"); }

    /** Write 16 unsigned bits (big-endian). */
    set ubit16be(value: number) { this.bit(value, 16, true, "big"); }

    /** Write 17 signed bits. */
    set bit17(value: number) { this.bit(value, 17); }

    /** Write 17 unsigned bits. */
    set ubit17(value: number) { this.bit(value, 17, true); }

    /** Write 17 signed bits (little-endian). */
    set bit17le(value: number) { this.bit(value, 17, undefined, "little"); }

    /** Write 17 unsigned bits (little-endian). */
    set ubit17le(value: number) { this.bit(value, 17, true, "little"); }

    /** Write 17 signed bits (big-endian). */
    set bit17be(value: number) { this.bit(value, 17, undefined, "big"); }

    /** Write 17 unsigned bits (big-endian). */
    set ubit17be(value: number) { this.bit(value, 17, true, "big"); }

    /** Write 18 signed bits. */
    set bit18(value: number) { this.bit(value, 18); }

    /** Write 18 unsigned bits. */
    set ubit18(value: number) { this.bit(value, 18, true); }

    /** Write 18 signed bits (little-endian). */
    set bit18le(value: number) { this.bit(value, 18, undefined, "little"); }

    /** Write 18 unsigned bits (little-endian). */
    set ubit18le(value: number) { this.bit(value, 18, true, "little"); }

    /** Write 18 signed bits (big-endian). */
    set bit18be(value: number) { this.bit(value, 18, undefined, "big"); }

    /** Write 18 unsigned bits (big-endian). */
    set ubit18be(value: number) { this.bit(value, 18, true, "big"); }

    /** Write 19 signed bits. */
    set bit19(value: number) { this.bit(value, 19); }

    /** Write 19 unsigned bits. */
    set ubit19(value: number) { this.bit(value, 19, true); }

    /** Write 19 signed bits (little-endian). */
    set bit19le(value: number) { this.bit(value, 19, undefined, "little"); }

    /** Write 19 unsigned bits (little-endian). */
    set ubit19le(value: number) { this.bit(value, 19, true, "little"); }

    /** Write 19 signed bits (big-endian). */
    set bit19be(value: number) { this.bit(value, 19, undefined, "big"); }

    /** Write 19 unsigned bits (big-endian). */
    set ubit19be(value: number) { this.bit(value, 19, true, "big"); }

    /** Write 20 signed bits. */
    set bit20(value: number) { this.bit(value, 20); }

    /** Write 20 unsigned bits. */
    set ubit20(value: number) { this.bit(value, 20, true); }

    /** Write 20 signed bits (little-endian). */
    set bit20le(value: number) { this.bit(value, 20, undefined, "little"); }

    /** Write 20 unsigned bits (little-endian). */
    set ubit20le(value: number) { this.bit(value, 20, true, "little"); }

    /** Write 20 signed bits (big-endian). */
    set bit20be(value: number) { this.bit(value, 20, undefined, "big"); }

    /** Write 20 unsigned bits (big-endian). */
    set ubit20be(value: number) { this.bit(value, 20, true, "big"); }

    /** Write 21 signed bits. */
    set bit21(value: number) { this.bit(value, 21); }

    /** Write 21 unsigned bits. */
    set ubit21(value: number) { this.bit(value, 21, true); }

    /** Write 21 signed bits (little-endian). */
    set bit21le(value: number) { this.bit(value, 21, undefined, "little"); }

    /** Write 21 unsigned bits (little-endian). */
    set ubit21le(value: number) { this.bit(value, 21, true, "little"); }

    /** Write 21 signed bits (big-endian). */
    set bit21be(value: number) { this.bit(value, 21, undefined, "big"); }

    /** Write 21 unsigned bits (big-endian). */
    set ubit21be(value: number) { this.bit(value, 21, true, "big"); }

    /** Write 22 signed bits. */
    set bit22(value: number) { this.bit(value, 22); }

    /** Write 22 unsigned bits. */
    set ubit22(value: number) { this.bit(value, 22, true); }

    /** Write 22 signed bits (little-endian). */
    set bit22le(value: number) { this.bit(value, 22, undefined, "little"); }

    /** Write 22 unsigned bits (little-endian). */
    set ubit22le(value: number) { this.bit(value, 22, true, "little"); }

    /** Write 22 signed bits (big-endian). */
    set bit22be(value: number) { this.bit(value, 22, undefined, "big"); }

    /** Write 22 unsigned bits (big-endian). */
    set ubit22be(value: number) { this.bit(value, 22, true, "big"); }

    /** Write 23 signed bits. */
    set bit23(value: number) { this.bit(value, 23); }

    /** Write 23 unsigned bits. */
    set ubit23(value: number) { this.bit(value, 23, true); }

    /** Write 23 signed bits (little-endian). */
    set bit23le(value: number) { this.bit(value, 23, undefined, "little"); }

    /** Write 23 unsigned bits (little-endian). */
    set ubit23le(value: number) { this.bit(value, 23, true, "little"); }

    /** Write 23 signed bits (big-endian). */
    set bit23be(value: number) { this.bit(value, 23, undefined, "big"); }

    /** Write 23 unsigned bits (big-endian). */
    set ubit23be(value: number) { this.bit(value, 23, true, "big"); }

    /** Write 24 signed bits. */
    set bit24(value: number) { this.bit(value, 24); }

    /** Write 24 unsigned bits. */
    set ubit24(value: number) { this.bit(value, 24, true); }

    /** Write 24 signed bits (little-endian). */
    set bit24le(value: number) { this.bit(value, 24, undefined, "little"); }

    /** Write 24 unsigned bits (little-endian). */
    set ubit24le(value: number) { this.bit(value, 24, true, "little"); }

    /** Write 24 signed bits (big-endian). */
    set bit24be(value: number) { this.bit(value, 24, undefined, "big"); }

    /** Write 24 unsigned bits (big-endian). */
    set ubit24be(value: number) { this.bit(value, 24, true, "big"); }

    /** Write 25 signed bits. */
    set bit25(value: number) { this.bit(value, 25); }

    /** Write 25 unsigned bits. */
    set ubit25(value: number) { this.bit(value, 25, true); }

    /** Write 25 signed bits (little-endian). */
    set bit25le(value: number) { this.bit(value, 25, undefined, "little"); }

    /** Write 25 unsigned bits (little-endian). */
    set ubit25le(value: number) { this.bit(value, 25, true, "little"); }

    /** Write 25 signed bits (big-endian). */
    set bit25be(value: number) { this.bit(value, 25, undefined, "big"); }

    /** Write 25 unsigned bits (big-endian). */
    set ubit25be(value: number) { this.bit(value, 25, true, "big"); }

    /** Write 26 signed bits. */
    set bit26(value: number) { this.bit(value, 26); }

    /** Write 26 unsigned bits. */
    set ubit26(value: number) { this.bit(value, 26, true); }

    /** Write 26 signed bits (little-endian). */
    set bit26le(value: number) { this.bit(value, 26, undefined, "little"); }

    /** Write 26 unsigned bits (little-endian). */
    set ubit26le(value: number) { this.bit(value, 26, true, "little"); }

    /** Write 26 signed bits (big-endian). */
    set bit26be(value: number) { this.bit(value, 26, undefined, "big"); }

    /** Write 26 unsigned bits (big-endian). */
    set ubit26be(value: number) { this.bit(value, 26, true, "big"); }

    /** Write 27 signed bits. */
    set bit27(value: number) { this.bit(value, 27); }

    /** Write 27 unsigned bits. */
    set ubit27(value: number) { this.bit(value, 27, true); }

    /** Write 27 signed bits (little-endian). */
    set bit27le(value: number) { this.bit(value, 27, undefined, "little"); }

    /** Write 27 unsigned bits (little-endian). */
    set ubit27le(value: number) { this.bit(value, 27, true, "little"); }

    /** Write 27 signed bits (big-endian). */
    set bit27be(value: number) { this.bit(value, 27, undefined, "big"); }

    /** Write 27 unsigned bits (big-endian). */
    set ubit27be(value: number) { this.bit(value, 27, true, "big"); }

    /** Write 28 signed bits. */
    set bit28(value: number) { this.bit(value, 28); }

    /** Write 28 unsigned bits. */
    set ubit28(value: number) { this.bit(value, 28, true); }

    /** Write 28 signed bits (little-endian). */
    set bit28le(value: number) { this.bit(value, 28, undefined, "little"); }

    /** Write 28 unsigned bits (little-endian). */
    set ubit28le(value: number) { this.bit(value, 28, true, "little"); }

    /** Write 28 signed bits (big-endian). */
    set bit28be(value: number) { this.bit(value, 28, undefined, "big"); }

    /** Write 28 unsigned bits (big-endian). */
    set ubit28be(value: number) { this.bit(value, 28, true, "big"); }

    /** Write 29 signed bits. */
    set bit29(value: number) { this.bit(value, 29); }

    /** Write 29 unsigned bits. */
    set ubit29(value: number) { this.bit(value, 29, true); }

    /** Write 29 signed bits (little-endian). */
    set bit29le(value: number) { this.bit(value, 29, undefined, "little"); }

    /** Write 29 unsigned bits (little-endian). */
    set ubit29le(value: number) { this.bit(value, 29, true, "little"); }

    /** Write 29 signed bits (big-endian). */
    set bit29be(value: number) { this.bit(value, 29, undefined, "big"); }

    /** Write 29 unsigned bits (big-endian). */
    set ubit29be(value: number) { this.bit(value, 29, true, "big"); }

    /** Write 30 signed bits. */
    set bit30(value: number) { this.bit(value, 30); }

    /** Write 30 unsigned bits. */
    set ubit30(value: number) { this.bit(value, 30, true); }

    /** Write 30 signed bits (little-endian). */
    set bit30le(value: number) { this.bit(value, 30, undefined, "little"); }

    /** Write 30 unsigned bits (little-endian). */
    set ubit30le(value: number) { this.bit(value, 30, true, "little"); }

    /** Write 30 signed bits (big-endian). */
    set bit30be(value: number) { this.bit(value, 30, undefined, "big"); }

    /** Write 30 unsigned bits (big-endian). */
    set ubit30be(value: number) { this.bit(value, 30, true, "big"); }

    /** Write 31 signed bits. */
    set bit31(value: number) { this.bit(value, 31); }

    /** Write 31 unsigned bits. */
    set ubit31(value: number) { this.bit(value, 31, true); }

    /** Write 31 signed bits (little-endian). */
    set bit31le(value: number) { this.bit(value, 31, undefined, "little"); }

    /** Write 31 unsigned bits (little-endian). */
    set ubit31le(value: number) { this.bit(value, 31, true, "little"); }

    /** Write 31 signed bits (big-endian). */
    set bit31be(value: number) { this.bit(value, 31, undefined, "big"); }

    /** Write 31 unsigned bits (big-endian). */
    set ubit31be(value: number) { this.bit(value, 31, true, "big"); }

    /** Write 32 signed bits. */
    set bit32(value: number) { this.bit(value, 32); }

    /** Write 32 unsigned bits. */
    set ubit32(value: number) { this.bit(value, 32, true); }

    /** Write 32 signed bits (little-endian). */
    set bit32le(value: number) { this.bit(value, 32, undefined, "little"); }

    /** Write 32 unsigned bits (little-endian). */
    set ubit32le(value: number) { this.bit(value, 32, true, "little"); }

    /** Write 32 signed bits (big-endian). */
    set bit32be(value: number) { this.bit(value, 32, undefined, "big"); }

    /** Write 32 unsigned bits (big-endian). */
    set ubit32be(value: number) { this.bit(value, 32, true, "big"); }

    // #endregion Generated mechanical aliases

    //
    // #region string
    //

    /**
    * Writes string, use options object for different types.
    * 
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - ascii, utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types 
    * @param {stringOptions["endian"]?} options.endian - for utf-16, utf-32, wide-pascal or double-wide-pascal
    */
    string(string: string, options: stringOptions = this.strDefaults): void {
        return this.writeString(string, options);
    };

    /**
    * Writes string using setting from .strDefaults
    * 
    * Default is ``utf-8``
    * 
    * @param {string} string - text string
    */
    set str(string: string) {
        this.writeString(string, this.strDefaults);
    };

    /**
    * Writes UTF-8 (C) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf8string(string: string, length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"]): void {
        return this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes UTF-8 (C) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    cstring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.utf8string(string, length, terminateValue);
    };

    /**
    * Writes ANSI string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    ansistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.string(string, { stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes latin1 string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    latin1string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.string(string, { stringType: "utf-8", encoding: "iso-8859-1", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes UTF-16 (Unicode) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf16string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    };

    /**
    * Writes UTF-16 (Unicode) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    unistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void {
        return this.utf16string(string, length, terminateValue, endian);
    };

    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.unistring(string, length, terminateValue, "little");
    };

    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.utf16stringle(string, length, terminateValue);
    };

    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.unistring(string, length, terminateValue, "big");
    };

    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.utf16stringbe(string, length, terminateValue);
    };

    /**
    * Writes UTF-32 (Unicode) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf32string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "utf-32", encoding: "utf-32", length: length, terminateValue: terminateValue, endian: endian });
    };

    /**
    * Writes UTF-32 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf32stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.utf32string(string, length, terminateValue, "little");
    };

    /**
    * Writes UTF-32 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf32stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.utf32string(string, length, terminateValue, "big");
    };

    /**
    * Writes Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Pascal string 1 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string: string, endian?: stringOptions["endian"]): void {
        return this.pstring(string, 1, endian);
    };

    /**
    * Writes Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    pstring1le(string: string): void {
        return this.pstring1(string, "little");
    };

    /**
    * Writes Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    pstring1be(string: string): void {
        return this.pstring1(string, "big");
    };

    /**
    * Writes Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring2(string: string, endian?: stringOptions["endian"]): void {
        return this.pstring(string, 2, endian);
    };

    /**
    * Writes Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    pstring2le(string: string): void {
        return this.pstring2(string, "little");
    };

    /**
    * Writes Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    pstring2be(string: string): void {
        return this.pstring2(string, "big");
    };

    /**
    * Writes Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring4(string: string, endian?: stringOptions["endian"]): void {
        return this.pstring(string, 4, endian);
    };

    /**
    * Writes Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    pstring4le(string: string): void {
        return this.pstring4(string, "little");
    };

    /**
    * Writes Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    pstring4be(string: string): void {
        return this.pstring4(string, "big");
    };

    /**
    * Writes Wide Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Wide Pascal string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void {
        return this.wpstring(string, lengthWriteSize, "little");
    };

    /**
    * Writes Wide Pascal string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void {
        return this.wpstring(string, lengthWriteSize, "big");
    };

    /**
    * Writes Wide Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring1(string: string, endian?: stringOptions["endian"]): void {
        return this.wpstring(string, 1, endian);
    };

    /**
    * Writes Wide Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    wpstring1le(string: string): void {
        return this.wpstring1(string, "little");
    };

    /**
    * Writes Wide Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    wpstring1be(string: string): void {
        return this.wpstring1(string, "big");
    };

    /**
    * Writes Wide Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring2(string: string, endian?: stringOptions["endian"]): void {
        return this.wpstring(string, 2, endian);
    };

    /**
    * Writes Wide Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    wpstring2le(string: string): void {
        return this.wpstring2(string, "little");
    };

    /**
    * Writes Wide Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    wpstring2be(string: string): void {
        return this.wpstring2(string, "big");
    };

    /**
    * Writes Wide Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring4(string: string, endian?: stringOptions["endian"]): void {
        return this.wpstring(string, 4, endian);
    };

    /**
    * Writes Wide Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    wpstring4le(string: string): void {
        return this.wpstring4(string, "little");
    };

    /**
    * Writes Wide Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    wpstring4be(string: string): void {
        return this.wpstring4(string, "big");
    };

    /**
    * Writes Double Wide Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "double-wide-pascal", encoding: "utf-32", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Double Wide Pascal string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    dwpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void {
        return this.dwpstring(string, lengthWriteSize, "little");
    };

    /**
    * Writes Double Wide Pascal string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    dwpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void {
        return this.dwpstring(string, lengthWriteSize, "big");
    };

    /**
    * Writes Double Wide Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring1(string: string, endian?: stringOptions["endian"]): void {
        return this.dwpstring(string, 1, endian);
    };

    /**
    * Writes Double Wide Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    dwpstring1le(string: string): void {
        return this.dwpstring1(string, "little");
    };

    /**
    * Writes Double Wide Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    dwpstring1be(string: string): void {
        return this.dwpstring1(string, "big");
    };

    /**
    * Writes Double Wide Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring2(string: string, endian?: stringOptions["endian"]): void {
        return this.dwpstring(string, 2, endian);
    };

    /**
    * Writes Double Wide Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    dwpstring2le(string: string): void {
        return this.dwpstring2(string, "little");
    };

    /**
    * Writes Double Wide Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    dwpstring2be(string: string): void {
        return this.dwpstring2(string, "big");
    };

    /**
    * Writes Double Wide Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring4(string: string, endian?: stringOptions["endian"]): void {
        return this.dwpstring(string, 4, endian);
    };

    /**
    * Writes Double Wide Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    dwpstring4le(string: string): void {
        return this.dwpstring4(string, "little");
    };

    /**
    * Writes Double Wide Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    dwpstring4be(string: string): void {
        return this.dwpstring4(string, "big");
    };
};