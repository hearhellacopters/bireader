import {
    BigValue,
    BiOptions,
    BytesOutput,
    endian,
    stringOptions,
} from "./common.js";
import { BiEngine } from './core/engine/engine.js';

/**
 * Async Binary writer, includes bitfields and strings.
 *
 * @param {DataType} input - File path or a `Buffer` or ``Uint8Array`.
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
 * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
 * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
 * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
 * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
 * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
 * @param {BiOptions["windowSize"]?} [options.windowSize = 4096] - Size of the chunk of a file to load per read. Set to `0` to load the whole file in one async read (default `4 KiB`)
 * 
 * @since 4.0
 */
export class BiWriterAsync<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false> extends BiEngine<alwaysBigInt, BytesOutput<DataType>> {
    constructor(input?: DataType, options: BiOptions<alwaysBigInt> = {}) {
        const growthIncrement = options.growthIncrement ?? 0x100000;

        if (input == undefined) {
            input = new Uint8Array(growthIncrement) as DataType;

            console.warn(`BiWriterAsync started without data. Creating Uint8Array with growthIncrement.`);
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
            windowSize: options.windowSize ?? 0x1000,
        });
    };

    /**
     * 
     * Creates and opens a new `BiWriterAsync`.
     *
     * @param {DataType} input - File path or a `Buffer` or ``Uint8Array`.
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
     * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
     * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
     * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
     * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
     * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
     * @param {BiOptions["windowSize"]?} [options.windowSize = 4096] - Size of the chunk of a file to load per read. Set to `0` to load the whole file in one async read (default `4 KiB`)
     * 
     * @returns {Promise<BiWriterAsync<DataType, alwaysBigInt>>}
     */
    static async create<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false>(input: DataType, options: BiOptions<alwaysBigInt> = {}): Promise<BiWriterAsync<DataType, alwaysBigInt>>{
        const instance = new BiWriterAsync<DataType, alwaysBigInt>(input, options);

        await instance.open();

        return instance;
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
     */
    async bit(value: number, bits: number, unsigned?: boolean, endian?: endian) {
        return await this.writeBit(value, bits, unsigned, endian);
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @param {endian} endian - ``big`` or ``little``
     */
    async ubit(value: number, bits: number, endian?: endian) {
        return await this.writeBit(value, bits, true, endian);
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     */
    async bitbe(value: number, bits: number, unsigned?: boolean) {
        return await this.bit(value, bits, unsigned, "big");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     */
    async ubitbe(value: number, bits: number) {
        return await this.bit(value, bits, true, "big");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     */
    async ubitle(value: number, bits: number) {
        return await this.bit(value, bits, true, "little");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     */
    async bitle(value: number, bits: number, unsigned?: boolean) {
        return await this.bit(value, bits, unsigned, "little");
    };
    //
    // #region Generated mechanical aliases
    //

    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====
    // Behaviour is verified by test/aliases.parity.test.ts.

    /** Write a signed 8-bit integer. */
    async byte(value: number) { await this.writeByte(value); }

    /** Write a signed 8-bit integer. */
    async int8(value: number) { await this.writeByte(value); }

    /** Write an unsigned 8-bit integer. */
    async uint8(value: number) { await this.writeByte(value, true); }

    /** Write an unsigned 8-bit integer. */
    async ubyte(value: number) { await this.writeByte(value, true); }

    /** Write a signed 16-bit integer. */
    async int16(value: number) { await this.writeInt16(value); }

    /** Write a signed 16-bit integer. */
    async short(value: number) { await this.writeInt16(value); }

    /** Write a signed 16-bit integer. */
    async word(value: number) { await this.writeInt16(value); }

    /** Write an unsigned 16-bit integer. */
    async uint16(value: number) { await this.writeInt16(value, true); }

    /** Write an unsigned 16-bit integer. */
    async ushort(value: number) { await this.writeInt16(value, true); }

    /** Write an unsigned 16-bit integer. */
    async uword(value: number) { await this.writeInt16(value, true); }

    /** Write a signed 16-bit integer (little-endian). */
    async int16le(value: number) { await this.writeInt16(value, false, "little"); }

    /** Write a signed 16-bit integer (little-endian). */
    async shortle(value: number) { await this.writeInt16(value, false, "little"); }

    /** Write a signed 16-bit integer (little-endian). */
    async wordle(value: number) { await this.writeInt16(value, false, "little"); }

    /** Write an unsigned 16-bit integer (little-endian). */
    async uint16le(value: number) { await this.writeInt16(value, true, "little"); }

    /** Write an unsigned 16-bit integer (little-endian). */
    async ushortle(value: number) { await this.writeInt16(value, true, "little"); }

    /** Write an unsigned 16-bit integer (little-endian). */
    async uwordle(value: number) { await this.writeInt16(value, true, "little"); }

    /** Write a signed 16-bit integer (big-endian). */
    async int16be(value: number) { await this.writeInt16(value, false, "big"); }

    /** Write a signed 16-bit integer (big-endian). */
    async shortbe(value: number) { await this.writeInt16(value, false, "big"); }

    /** Write a signed 16-bit integer (big-endian). */
    async wordbe(value: number) { await this.writeInt16(value, false, "big"); }

    /** Write an unsigned 16-bit integer (big-endian). */
    async uint16be(value: number) { await this.writeInt16(value, true, "big"); }

    /** Write an unsigned 16-bit integer (big-endian). */
    async ushortbe(value: number) { await this.writeInt16(value, true, "big"); }

    /** Write an unsigned 16-bit integer (big-endian). */
    async uwordbe(value: number) { await this.writeInt16(value, true, "big"); }

    /** Write a signed 32-bit integer. */
    async int(value: number) { await this.writeInt32(value); }

    /** Write a signed 32-bit integer. */
    async dword(value: number) { await this.writeInt32(value); }

    /** Write a signed 32-bit integer. */
    async int32(value: number) { await this.writeInt32(value); }

    /** Write a signed 32-bit integer. */
    async long(value: number) { await this.writeInt32(value); }

    /** Write an unsigned 32-bit integer. */
    async uint(value: number) { await this.writeInt32(value, true); }

    /** Write an unsigned 32-bit integer. */
    async udword(value: number) { await this.writeInt32(value, true); }

    /** Write an unsigned 32-bit integer. */
    async uint32(value: number) { await this.writeInt32(value, true); }

    /** Write an unsigned 32-bit integer. */
    async ulong(value: number) { await this.writeInt32(value, true); }

    /** Write a signed 32-bit integer (little-endian). */
    async intle(value: number) { await this.writeInt32(value, false, "little"); }

    /** Write a signed 32-bit integer (little-endian). */
    async dwordle(value: number) { await this.writeInt32(value, false, "little"); }

    /** Write a signed 32-bit integer (little-endian). */
    async int32le(value: number) { await this.writeInt32(value, false, "little"); }

    /** Write a signed 32-bit integer (little-endian). */
    async longle(value: number) { await this.writeInt32(value, false, "little"); }

    /** Write an unsigned 32-bit integer (little-endian). */
    async uintle(value: number) { await this.writeInt32(value, true, "little"); }

    /** Write an unsigned 32-bit integer (little-endian). */
    async udwordle(value: number) { await this.writeInt32(value, true, "little"); }

    /** Write an unsigned 32-bit integer (little-endian). */
    async uint32le(value: number) { await this.writeInt32(value, true, "little"); }

    /** Write an unsigned 32-bit integer (little-endian). */
    async ulongle(value: number) { await this.writeInt32(value, true, "little"); }

    /** Write a signed 32-bit integer (big-endian). */
    async intbe(value: number) { await this.writeInt32(value, false, "big"); }

    /** Write a signed 32-bit integer (big-endian). */
    async dwordbe(value: number) { await this.writeInt32(value, false, "big"); }

    /** Write a signed 32-bit integer (big-endian). */
    async int32be(value: number) { await this.writeInt32(value, false, "big"); }

    /** Write a signed 32-bit integer (big-endian). */
    async longbe(value: number) { await this.writeInt32(value, false, "big"); }

    /** Write an unsigned 32-bit integer (big-endian). */
    async uintbe(value: number) { await this.writeInt32(value, true, "big"); }

    /** Write an unsigned 32-bit integer (big-endian). */
    async udwordbe(value: number) { await this.writeInt32(value, true, "big"); }

    /** Write an unsigned 32-bit integer (big-endian). */
    async uint32be(value: number) { await this.writeInt32(value, true, "big"); }

    /** Write an unsigned 32-bit integer (big-endian). */
    async ulongbe(value: number) { await this.writeInt32(value, true, "big"); }

    /** Write a signed 64-bit integer. */
    async int64(value: BigValue) { await this.writeInt64(value); }

    /** Write a signed 64-bit integer. */
    async bigint(value: BigValue) { await this.writeInt64(value); }

    /** Write a signed 64-bit integer. */
    async quad(value: BigValue) { await this.writeInt64(value); }

    /** Write an unsigned 64-bit integer. */
    async uint64(value: BigValue) { await this.writeInt64(value, true); }

    /** Write an unsigned 64-bit integer. */
    async ubigint(value: BigValue) { await this.writeInt64(value, true); }

    /** Write an unsigned 64-bit integer. */
    async uquad(value: BigValue) { await this.writeInt64(value, true); }

    /** Write a signed 64-bit integer (little-endian). */
    async int64le(value: BigValue) { await this.writeInt64(value, false, "little"); }

    /** Write a signed 64-bit integer (little-endian). */
    async bigintle(value: BigValue) { await this.writeInt64(value, false, "little"); }

    /** Write a signed 64-bit integer (little-endian). */
    async quadle(value: BigValue) { await this.writeInt64(value, false, "little"); }

    /** Write an unsigned 64-bit integer (little-endian). */
    async uint64le(value: BigValue) { await this.writeInt64(value, true, "little"); }

    /** Write an unsigned 64-bit integer (little-endian). */
    async ubigintle(value: BigValue) { await this.writeInt64(value, true, "little"); }

    /** Write an unsigned 64-bit integer (little-endian). */
    async uquadle(value: BigValue) { await this.writeInt64(value, true, "little"); }

    /** Write a signed 64-bit integer (big-endian). */
    async int64be(value: BigValue) { await this.writeInt64(value, false, "big"); }

    /** Write a signed 64-bit integer (big-endian). */
    async bigintbe(value: BigValue) { await this.writeInt64(value, false, "big"); }

    /** Write a signed 64-bit integer (big-endian). */
    async quadbe(value: BigValue) { await this.writeInt64(value, false, "big"); }

    /** Write an unsigned 64-bit integer (big-endian). */
    async uint64be(value: BigValue) { await this.writeInt64(value, true, "big"); }

    /** Write an unsigned 64-bit integer (big-endian). */
    async ubigintbe(value: BigValue) { await this.writeInt64(value, true, "big"); }

    /** Write an unsigned 64-bit integer (big-endian). */
    async uquadbe(value: BigValue) { await this.writeInt64(value, true, "big"); }

    /** Write a 32-bit float. */
    async float(value: number) { await this.writeFloat(value); }

    /** Write a 32-bit float (little-endian). */
    async floatle(value: number) { await this.writeFloat(value, "little"); }

    /** Write a 32-bit float (big-endian). */
    async floatbe(value: number) { await this.writeFloat(value, "big"); }

    /** Write a 16-bit float. */
    async halffloat(value: number) { await this.writeHalfFloat(value); }

    /** Write a 16-bit float. */
    async half(value: number) { await this.writeHalfFloat(value); }

    /** Write a 16-bit float (little-endian). */
    async halffloatle(value: number) { await this.writeHalfFloat(value, "little"); }

    /** Write a 16-bit float (little-endian). */
    async halfle(value: number) { await this.writeHalfFloat(value, "little"); }

    /** Write a 16-bit float (big-endian). */
    async halffloatbe(value: number) { await this.writeHalfFloat(value, "big"); }

    /** Write a 16-bit float (big-endian). */
    async halfbe(value: number) { await this.writeHalfFloat(value, "big"); }

    /** Write a 64-bit float. */
    async doublefloat(value: number) { await this.writeDoubleFloat(value); }

    /** Write a 64-bit float. */
    async dfloat(value: number) { await this.writeDoubleFloat(value); }

    /** Write a 64-bit float (little-endian). */
    async doublefloatle(value: number) { await this.writeDoubleFloat(value, "little"); }

    /** Write a 64-bit float (little-endian). */
    async dfloatle(value: number) { await this.writeDoubleFloat(value, "little"); }

    /** Write a 64-bit float (big-endian). */
    async doublefloatbe(value: number) { await this.writeDoubleFloat(value, "big"); }

    /** Write a 64-bit float (big-endian). */
    async dfloatbe(value: number) { await this.writeDoubleFloat(value, "big"); }

    /** Write 1 signed bit. */
    async bit1(value: number) { await this.bit(value, 1); }

    /** Write 1 unsigned bit. */
    async ubit1(value: number) { await this.bit(value, 1, true); }

    /** Write 1 signed bit (little-endian). */
    async bit1le(value: number) { await this.bit(value, 1, undefined, "little"); }

    /** Write 1 unsigned bit (little-endian). */
    async ubit1le(value: number) { await this.bit(value, 1, true, "little"); }

    /** Write 1 signed bit (big-endian). */
    async bit1be(value: number) { await this.bit(value, 1, undefined, "big"); }

    /** Write 1 unsigned bit (big-endian). */
    async ubit1be(value: number) { await this.bit(value, 1, true, "big"); }

    /** Write 2 signed bits. */
    async bit2(value: number) { await this.bit(value, 2); }

    /** Write 2 unsigned bits. */
    async ubit2(value: number) { await this.bit(value, 2, true); }

    /** Write 2 signed bits (little-endian). */
    async bit2le(value: number) { await this.bit(value, 2, undefined, "little"); }

    /** Write 2 unsigned bits (little-endian). */
    async ubit2le(value: number) { await this.bit(value, 2, true, "little"); }

    /** Write 2 signed bits (big-endian). */
    async bit2be(value: number) { await this.bit(value, 2, undefined, "big"); }

    /** Write 2 unsigned bits (big-endian). */
    async ubit2be(value: number) { await this.bit(value, 2, true, "big"); }

    /** Write 3 signed bits. */
    async bit3(value: number) { await this.bit(value, 3); }

    /** Write 3 unsigned bits. */
    async ubit3(value: number) { await this.bit(value, 3, true); }

    /** Write 3 signed bits (little-endian). */
    async bit3le(value: number) { await this.bit(value, 3, undefined, "little"); }

    /** Write 3 unsigned bits (little-endian). */
    async ubit3le(value: number) { await this.bit(value, 3, true, "little"); }

    /** Write 3 signed bits (big-endian). */
    async bit3be(value: number) { await this.bit(value, 3, undefined, "big"); }

    /** Write 3 unsigned bits (big-endian). */
    async ubit3be(value: number) { await this.bit(value, 3, true, "big"); }

    /** Write 4 signed bits. */
    async bit4(value: number) { await this.bit(value, 4); }

    /** Write 4 unsigned bits. */
    async ubit4(value: number) { await this.bit(value, 4, true); }

    /** Write 4 signed bits (little-endian). */
    async bit4le(value: number) { await this.bit(value, 4, undefined, "little"); }

    /** Write 4 unsigned bits (little-endian). */
    async ubit4le(value: number) { await this.bit(value, 4, true, "little"); }

    /** Write 4 signed bits (big-endian). */
    async bit4be(value: number) { await this.bit(value, 4, undefined, "big"); }

    /** Write 4 unsigned bits (big-endian). */
    async ubit4be(value: number) { await this.bit(value, 4, true, "big"); }

    /** Write 5 signed bits. */
    async bit5(value: number) { await this.bit(value, 5); }

    /** Write 5 unsigned bits. */
    async ubit5(value: number) { await this.bit(value, 5, true); }

    /** Write 5 signed bits (little-endian). */
    async bit5le(value: number) { await this.bit(value, 5, undefined, "little"); }

    /** Write 5 unsigned bits (little-endian). */
    async ubit5le(value: number) { await this.bit(value, 5, true, "little"); }

    /** Write 5 signed bits (big-endian). */
    async bit5be(value: number) { await this.bit(value, 5, undefined, "big"); }

    /** Write 5 unsigned bits (big-endian). */
    async ubit5be(value: number) { await this.bit(value, 5, true, "big"); }

    /** Write 6 signed bits. */
    async bit6(value: number) { await this.bit(value, 6); }

    /** Write 6 unsigned bits. */
    async ubit6(value: number) { await this.bit(value, 6, true); }

    /** Write 6 signed bits (little-endian). */
    async bit6le(value: number) { await this.bit(value, 6, undefined, "little"); }

    /** Write 6 unsigned bits (little-endian). */
    async ubit6le(value: number) { await this.bit(value, 6, true, "little"); }

    /** Write 6 signed bits (big-endian). */
    async bit6be(value: number) { await this.bit(value, 6, undefined, "big"); }

    /** Write 6 unsigned bits (big-endian). */
    async ubit6be(value: number) { await this.bit(value, 6, true, "big"); }

    /** Write 7 signed bits. */
    async bit7(value: number) { await this.bit(value, 7); }

    /** Write 7 unsigned bits. */
    async ubit7(value: number) { await this.bit(value, 7, true); }

    /** Write 7 signed bits (little-endian). */
    async bit7le(value: number) { await this.bit(value, 7, undefined, "little"); }

    /** Write 7 unsigned bits (little-endian). */
    async ubit7le(value: number) { await this.bit(value, 7, true, "little"); }

    /** Write 7 signed bits (big-endian). */
    async bit7be(value: number) { await this.bit(value, 7, undefined, "big"); }

    /** Write 7 unsigned bits (big-endian). */
    async ubit7be(value: number) { await this.bit(value, 7, true, "big"); }

    /** Write 8 signed bits. */
    async bit8(value: number) { await this.bit(value, 8); }

    /** Write 8 unsigned bits. */
    async ubit8(value: number) { await this.bit(value, 8, true); }

    /** Write 8 signed bits (little-endian). */
    async bit8le(value: number) { await this.bit(value, 8, undefined, "little"); }

    /** Write 8 unsigned bits (little-endian). */
    async ubit8le(value: number) { await this.bit(value, 8, true, "little"); }

    /** Write 8 signed bits (big-endian). */
    async bit8be(value: number) { await this.bit(value, 8, undefined, "big"); }

    /** Write 8 unsigned bits (big-endian). */
    async ubit8be(value: number) { await this.bit(value, 8, true, "big"); }

    /** Write 9 signed bits. */
    async bit9(value: number) { await this.bit(value, 9); }

    /** Write 9 unsigned bits. */
    async ubit9(value: number) { await this.bit(value, 9, true); }

    /** Write 9 signed bits (little-endian). */
    async bit9le(value: number) { await this.bit(value, 9, undefined, "little"); }

    /** Write 9 unsigned bits (little-endian). */
    async ubit9le(value: number) { await this.bit(value, 9, true, "little"); }

    /** Write 9 signed bits (big-endian). */
    async bit9be(value: number) { await this.bit(value, 9, undefined, "big"); }

    /** Write 9 unsigned bits (big-endian). */
    async ubit9be(value: number) { await this.bit(value, 9, true, "big"); }

    /** Write 10 signed bits. */
    async bit10(value: number) { await this.bit(value, 10); }

    /** Write 10 unsigned bits. */
    async ubit10(value: number) { await this.bit(value, 10, true); }

    /** Write 10 signed bits (little-endian). */
    async bit10le(value: number) { await this.bit(value, 10, undefined, "little"); }

    /** Write 10 unsigned bits (little-endian). */
    async ubit10le(value: number) { await this.bit(value, 10, true, "little"); }

    /** Write 10 signed bits (big-endian). */
    async bit10be(value: number) { await this.bit(value, 10, undefined, "big"); }

    /** Write 10 unsigned bits (big-endian). */
    async ubit10be(value: number) { await this.bit(value, 10, true, "big"); }

    /** Write 11 signed bits. */
    async bit11(value: number) { await this.bit(value, 11); }

    /** Write 11 unsigned bits. */
    async ubit11(value: number) { await this.bit(value, 11, true); }

    /** Write 11 signed bits (little-endian). */
    async bit11le(value: number) { await this.bit(value, 11, undefined, "little"); }

    /** Write 11 unsigned bits (little-endian). */
    async ubit11le(value: number) { await this.bit(value, 11, true, "little"); }

    /** Write 11 signed bits (big-endian). */
    async bit11be(value: number) { await this.bit(value, 11, undefined, "big"); }

    /** Write 11 unsigned bits (big-endian). */
    async ubit11be(value: number) { await this.bit(value, 11, true, "big"); }

    /** Write 12 signed bits. */
    async bit12(value: number) { await this.bit(value, 12); }

    /** Write 12 unsigned bits. */
    async ubit12(value: number) { await this.bit(value, 12, true); }

    /** Write 12 signed bits (little-endian). */
    async bit12le(value: number) { await this.bit(value, 12, undefined, "little"); }

    /** Write 12 unsigned bits (little-endian). */
    async ubit12le(value: number) { await this.bit(value, 12, true, "little"); }

    /** Write 12 signed bits (big-endian). */
    async bit12be(value: number) { await this.bit(value, 12, undefined, "big"); }

    /** Write 12 unsigned bits (big-endian). */
    async ubit12be(value: number) { await this.bit(value, 12, true, "big"); }

    /** Write 13 signed bits. */
    async bit13(value: number) { await this.bit(value, 13); }

    /** Write 13 unsigned bits. */
    async ubit13(value: number) { await this.bit(value, 13, true); }

    /** Write 13 signed bits (little-endian). */
    async bit13le(value: number) { await this.bit(value, 13, undefined, "little"); }

    /** Write 13 unsigned bits (little-endian). */
    async ubit13le(value: number) { await this.bit(value, 13, true, "little"); }

    /** Write 13 signed bits (big-endian). */
    async bit13be(value: number) { await this.bit(value, 13, undefined, "big"); }

    /** Write 13 unsigned bits (big-endian). */
    async ubit13be(value: number) { await this.bit(value, 13, true, "big"); }

    /** Write 14 signed bits. */
    async bit14(value: number) { await this.bit(value, 14); }

    /** Write 14 unsigned bits. */
    async ubit14(value: number) { await this.bit(value, 14, true); }

    /** Write 14 signed bits (little-endian). */
    async bit14le(value: number) { await this.bit(value, 14, undefined, "little"); }

    /** Write 14 unsigned bits (little-endian). */
    async ubit14le(value: number) { await this.bit(value, 14, true, "little"); }

    /** Write 14 signed bits (big-endian). */
    async bit14be(value: number) { await this.bit(value, 14, undefined, "big"); }

    /** Write 14 unsigned bits (big-endian). */
    async ubit14be(value: number) { await this.bit(value, 14, true, "big"); }

    /** Write 15 signed bits. */
    async bit15(value: number) { await this.bit(value, 15); }

    /** Write 15 unsigned bits. */
    async ubit15(value: number) { await this.bit(value, 15, true); }

    /** Write 15 signed bits (little-endian). */
    async bit15le(value: number) { await this.bit(value, 15, undefined, "little"); }

    /** Write 15 unsigned bits (little-endian). */
    async ubit15le(value: number) { await this.bit(value, 15, true, "little"); }

    /** Write 15 signed bits (big-endian). */
    async bit15be(value: number) { await this.bit(value, 15, undefined, "big"); }

    /** Write 15 unsigned bits (big-endian). */
    async ubit15be(value: number) { await this.bit(value, 15, true, "big"); }

    /** Write 16 signed bits. */
    async bit16(value: number) { await this.bit(value, 16); }

    /** Write 16 unsigned bits. */
    async ubit16(value: number) { await this.bit(value, 16, true); }

    /** Write 16 signed bits (little-endian). */
    async bit16le(value: number) { await this.bit(value, 16, undefined, "little"); }

    /** Write 16 unsigned bits (little-endian). */
    async ubit16le(value: number) { await this.bit(value, 16, true, "little"); }

    /** Write 16 signed bits (big-endian). */
    async bit16be(value: number) { await this.bit(value, 16, undefined, "big"); }

    /** Write 16 unsigned bits (big-endian). */
    async ubit16be(value: number) { await this.bit(value, 16, true, "big"); }

    /** Write 17 signed bits. */
    async bit17(value: number) { await this.bit(value, 17); }

    /** Write 17 unsigned bits. */
    async ubit17(value: number) { await this.bit(value, 17, true); }

    /** Write 17 signed bits (little-endian). */
    async bit17le(value: number) { await this.bit(value, 17, undefined, "little"); }

    /** Write 17 unsigned bits (little-endian). */
    async ubit17le(value: number) { await this.bit(value, 17, true, "little"); }

    /** Write 17 signed bits (big-endian). */
    async bit17be(value: number) { await this.bit(value, 17, undefined, "big"); }

    /** Write 17 unsigned bits (big-endian). */
    async ubit17be(value: number) { await this.bit(value, 17, true, "big"); }

    /** Write 18 signed bits. */
    async bit18(value: number) { await this.bit(value, 18); }

    /** Write 18 unsigned bits. */
    async ubit18(value: number) { await this.bit(value, 18, true); }

    /** Write 18 signed bits (little-endian). */
    async bit18le(value: number) { await this.bit(value, 18, undefined, "little"); }

    /** Write 18 unsigned bits (little-endian). */
    async ubit18le(value: number) { await this.bit(value, 18, true, "little"); }

    /** Write 18 signed bits (big-endian). */
    async bit18be(value: number) { await this.bit(value, 18, undefined, "big"); }

    /** Write 18 unsigned bits (big-endian). */
    async ubit18be(value: number) { await this.bit(value, 18, true, "big"); }

    /** Write 19 signed bits. */
    async bit19(value: number) { await this.bit(value, 19); }

    /** Write 19 unsigned bits. */
    async ubit19(value: number) { await this.bit(value, 19, true); }

    /** Write 19 signed bits (little-endian). */
    async bit19le(value: number) { await this.bit(value, 19, undefined, "little"); }

    /** Write 19 unsigned bits (little-endian). */
    async ubit19le(value: number) { await this.bit(value, 19, true, "little"); }

    /** Write 19 signed bits (big-endian). */
    async bit19be(value: number) { await this.bit(value, 19, undefined, "big"); }

    /** Write 19 unsigned bits (big-endian). */
    async ubit19be(value: number) { await this.bit(value, 19, true, "big"); }

    /** Write 20 signed bits. */
    async bit20(value: number) { await this.bit(value, 20); }

    /** Write 20 unsigned bits. */
    async ubit20(value: number) { await this.bit(value, 20, true); }

    /** Write 20 signed bits (little-endian). */
    async bit20le(value: number) { await this.bit(value, 20, undefined, "little"); }

    /** Write 20 unsigned bits (little-endian). */
    async ubit20le(value: number) { await this.bit(value, 20, true, "little"); }

    /** Write 20 signed bits (big-endian). */
    async bit20be(value: number) { await this.bit(value, 20, undefined, "big"); }

    /** Write 20 unsigned bits (big-endian). */
    async ubit20be(value: number) { await this.bit(value, 20, true, "big"); }

    /** Write 21 signed bits. */
    async bit21(value: number) { await this.bit(value, 21); }

    /** Write 21 unsigned bits. */
    async ubit21(value: number) { await this.bit(value, 21, true); }

    /** Write 21 signed bits (little-endian). */
    async bit21le(value: number) { await this.bit(value, 21, undefined, "little"); }

    /** Write 21 unsigned bits (little-endian). */
    async ubit21le(value: number) { await this.bit(value, 21, true, "little"); }

    /** Write 21 signed bits (big-endian). */
    async bit21be(value: number) { await this.bit(value, 21, undefined, "big"); }

    /** Write 21 unsigned bits (big-endian). */
    async ubit21be(value: number) { await this.bit(value, 21, true, "big"); }

    /** Write 22 signed bits. */
    async bit22(value: number) { await this.bit(value, 22); }

    /** Write 22 unsigned bits. */
    async ubit22(value: number) { await this.bit(value, 22, true); }

    /** Write 22 signed bits (little-endian). */
    async bit22le(value: number) { await this.bit(value, 22, undefined, "little"); }

    /** Write 22 unsigned bits (little-endian). */
    async ubit22le(value: number) { await this.bit(value, 22, true, "little"); }

    /** Write 22 signed bits (big-endian). */
    async bit22be(value: number) { await this.bit(value, 22, undefined, "big"); }

    /** Write 22 unsigned bits (big-endian). */
    async ubit22be(value: number) { await this.bit(value, 22, true, "big"); }

    /** Write 23 signed bits. */
    async bit23(value: number) { await this.bit(value, 23); }

    /** Write 23 unsigned bits. */
    async ubit23(value: number) { await this.bit(value, 23, true); }

    /** Write 23 signed bits (little-endian). */
    async bit23le(value: number) { await this.bit(value, 23, undefined, "little"); }

    /** Write 23 unsigned bits (little-endian). */
    async ubit23le(value: number) { await this.bit(value, 23, true, "little"); }

    /** Write 23 signed bits (big-endian). */
    async bit23be(value: number) { await this.bit(value, 23, undefined, "big"); }

    /** Write 23 unsigned bits (big-endian). */
    async ubit23be(value: number) { await this.bit(value, 23, true, "big"); }

    /** Write 24 signed bits. */
    async bit24(value: number) { await this.bit(value, 24); }

    /** Write 24 unsigned bits. */
    async ubit24(value: number) { await this.bit(value, 24, true); }

    /** Write 24 signed bits (little-endian). */
    async bit24le(value: number) { await this.bit(value, 24, undefined, "little"); }

    /** Write 24 unsigned bits (little-endian). */
    async ubit24le(value: number) { await this.bit(value, 24, true, "little"); }

    /** Write 24 signed bits (big-endian). */
    async bit24be(value: number) { await this.bit(value, 24, undefined, "big"); }

    /** Write 24 unsigned bits (big-endian). */
    async ubit24be(value: number) { await this.bit(value, 24, true, "big"); }

    /** Write 25 signed bits. */
    async bit25(value: number) { await this.bit(value, 25); }

    /** Write 25 unsigned bits. */
    async ubit25(value: number) { await this.bit(value, 25, true); }

    /** Write 25 signed bits (little-endian). */
    async bit25le(value: number) { await this.bit(value, 25, undefined, "little"); }

    /** Write 25 unsigned bits (little-endian). */
    async ubit25le(value: number) { await this.bit(value, 25, true, "little"); }

    /** Write 25 signed bits (big-endian). */
    async bit25be(value: number) { await this.bit(value, 25, undefined, "big"); }

    /** Write 25 unsigned bits (big-endian). */
    async ubit25be(value: number) { await this.bit(value, 25, true, "big"); }

    /** Write 26 signed bits. */
    async bit26(value: number) { await this.bit(value, 26); }

    /** Write 26 unsigned bits. */
    async ubit26(value: number) { await this.bit(value, 26, true); }

    /** Write 26 signed bits (little-endian). */
    async bit26le(value: number) { await this.bit(value, 26, undefined, "little"); }

    /** Write 26 unsigned bits (little-endian). */
    async ubit26le(value: number) { await this.bit(value, 26, true, "little"); }

    /** Write 26 signed bits (big-endian). */
    async bit26be(value: number) { await this.bit(value, 26, undefined, "big"); }

    /** Write 26 unsigned bits (big-endian). */
    async ubit26be(value: number) { await this.bit(value, 26, true, "big"); }

    /** Write 27 signed bits. */
    async bit27(value: number) { await this.bit(value, 27); }

    /** Write 27 unsigned bits. */
    async ubit27(value: number) { await this.bit(value, 27, true); }

    /** Write 27 signed bits (little-endian). */
    async bit27le(value: number) { await this.bit(value, 27, undefined, "little"); }

    /** Write 27 unsigned bits (little-endian). */
    async ubit27le(value: number) { await this.bit(value, 27, true, "little"); }

    /** Write 27 signed bits (big-endian). */
    async bit27be(value: number) { await this.bit(value, 27, undefined, "big"); }

    /** Write 27 unsigned bits (big-endian). */
    async ubit27be(value: number) { await this.bit(value, 27, true, "big"); }

    /** Write 28 signed bits. */
    async bit28(value: number) { await this.bit(value, 28); }

    /** Write 28 unsigned bits. */
    async ubit28(value: number) { await this.bit(value, 28, true); }

    /** Write 28 signed bits (little-endian). */
    async bit28le(value: number) { await this.bit(value, 28, undefined, "little"); }

    /** Write 28 unsigned bits (little-endian). */
    async ubit28le(value: number) { await this.bit(value, 28, true, "little"); }

    /** Write 28 signed bits (big-endian). */
    async bit28be(value: number) { await this.bit(value, 28, undefined, "big"); }

    /** Write 28 unsigned bits (big-endian). */
    async ubit28be(value: number) { await this.bit(value, 28, true, "big"); }

    /** Write 29 signed bits. */
    async bit29(value: number) { await this.bit(value, 29); }

    /** Write 29 unsigned bits. */
    async ubit29(value: number) { await this.bit(value, 29, true); }

    /** Write 29 signed bits (little-endian). */
    async bit29le(value: number) { await this.bit(value, 29, undefined, "little"); }

    /** Write 29 unsigned bits (little-endian). */
    async ubit29le(value: number) { await this.bit(value, 29, true, "little"); }

    /** Write 29 signed bits (big-endian). */
    async bit29be(value: number) { await this.bit(value, 29, undefined, "big"); }

    /** Write 29 unsigned bits (big-endian). */
    async ubit29be(value: number) { await this.bit(value, 29, true, "big"); }

    /** Write 30 signed bits. */
    async bit30(value: number) { await this.bit(value, 30); }

    /** Write 30 unsigned bits. */
    async ubit30(value: number) { await this.bit(value, 30, true); }

    /** Write 30 signed bits (little-endian). */
    async bit30le(value: number) { await this.bit(value, 30, undefined, "little"); }

    /** Write 30 unsigned bits (little-endian). */
    async ubit30le(value: number) { await this.bit(value, 30, true, "little"); }

    /** Write 30 signed bits (big-endian). */
    async bit30be(value: number) { await this.bit(value, 30, undefined, "big"); }

    /** Write 30 unsigned bits (big-endian). */
    async ubit30be(value: number) { await this.bit(value, 30, true, "big"); }

    /** Write 31 signed bits. */
    async bit31(value: number) { await this.bit(value, 31); }

    /** Write 31 unsigned bits. */
    async ubit31(value: number) { await this.bit(value, 31, true); }

    /** Write 31 signed bits (little-endian). */
    async bit31le(value: number) { await this.bit(value, 31, undefined, "little"); }

    /** Write 31 unsigned bits (little-endian). */
    async ubit31le(value: number) { await this.bit(value, 31, true, "little"); }

    /** Write 31 signed bits (big-endian). */
    async bit31be(value: number) { await this.bit(value, 31, undefined, "big"); }

    /** Write 31 unsigned bits (big-endian). */
    async ubit31be(value: number) { await this.bit(value, 31, true, "big"); }

    /** Write 32 signed bits. */
    async bit32(value: number) { await this.bit(value, 32); }

    /** Write 32 unsigned bits. */
    async ubit32(value: number) { await this.bit(value, 32, true); }

    /** Write 32 signed bits (little-endian). */
    async bit32le(value: number) { await this.bit(value, 32, undefined, "little"); }

    /** Write 32 unsigned bits (little-endian). */
    async ubit32le(value: number) { await this.bit(value, 32, true, "little"); }

    /** Write 32 signed bits (big-endian). */
    async bit32be(value: number) { await this.bit(value, 32, undefined, "big"); }

    /** Write 32 unsigned bits (big-endian). */
    async ubit32be(value: number) { await this.bit(value, 32, true, "big"); }

    // #endregion Generated mechanical aliases
;

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
    async string(string: string, options?: stringOptions) {
        return await this.writeString(string, options);
    };

    /**
    * Writes string using setting from .strDefaults
    * 
    * Default is ``utf-8``
    * 
    * @param {string} string - text string
    */
    async str(string: string) {
        await this.writeString(string, this.strDefaults);
    };

    /**
    * Writes UTF-8 (C) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf8string(string: string, length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes UTF-8 (C) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async cstring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.utf8string(string, length, terminateValue);
    };

    /**
    * Writes ANSI string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
   async ansistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes latin1 string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
   async latin1string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-8", encoding: "iso-8859-1", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes UTF-16 (Unicode) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    async utf16string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    };

    /**
    * Writes UTF-16 (Unicode) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    async unistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]) {
        return await this.utf16string(string, length, terminateValue, endian);
    };

    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf16stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.unistring(string, length, terminateValue, "little");
    };

    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async unistringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.utf16stringle(string, length, terminateValue);
    };

    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf16stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.unistring(string, length, terminateValue, "big");
    };

    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async unistringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.utf16stringbe(string, length, terminateValue);
    };

    /**
    * Writes UTF-32 (Unicode) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    async utf32string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "utf-32", encoding: "utf-32", length: length, terminateValue: terminateValue, endian: endian });
    };

    /**
    * Writes UTF-32 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf32stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.utf32string(string, length, terminateValue, "little");
    };

    /**
    * Writes UTF-32 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf32stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.utf32string(string, length, terminateValue, "big");
    };

    /**
    * Writes Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    async pstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Pascal string 1 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    async pstring1(string: string, endian?: stringOptions["endian"]) {
        return await this.pstring(string, 1, endian);
    };

    /**
    * Writes Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async pstring1le(string: string) {
        return await this.pstring1(string, "little");
    };

    /**
    * Writes Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async pstring1be(string: string) {
        return await this.pstring1(string, "big");
    };

    /**
    * Writes Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async pstring2(string: string, endian?: stringOptions["endian"]) {
        return await this.pstring(string, 2, endian);
    };

    /**
    * Writes Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async pstring2le(string: string) {
        return await this.pstring2(string, "little");
    };

    /**
    * Writes Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async pstring2be(string: string) {
        return await this.pstring2(string, "big");
    };

    /**
    * Writes Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async pstring4(string: string, endian?: stringOptions["endian"]) {
        return await this.pstring(string, 4, endian);
    };

    /**
    * Writes Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async pstring4le(string: string) {
        return await this.pstring4(string, "little");
    };

    /**
    * Writes Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async pstring4be(string: string) {
        return await this.pstring4(string, "big");
    };    

    /**
    * Writes Wide Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Wide Pascal string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]) {
        return await this.wpstring(string, lengthWriteSize, "little");
    };

    /**
    * Writes Wide Pascal string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]) {
        return await this.wpstring(string, lengthWriteSize, "big");
    };

    /**
    * Writes Wide Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring1(string: string, endian?: stringOptions["endian"]) {
        return await this.wpstring(string, 1, endian);
    };

    /**
    * Writes Wide Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring1be(string: string) {
        return await this.wpstring1(string, "big");
    };

    /**
    * Writes Wide Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring1le(string: string) {
        return await this.wpstring1(string, "little");
    };

    /**
    * Writes Wide Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring2(string: string, endian?: stringOptions["endian"]) {
        return await this.wpstring(string, 2, endian);
    };

    /**
    * Writes Wide Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring2le(string: string) {
        return await this.wpstring2(string, "little");
    };

    /**
    * Writes Wide Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring2be(string: string) {
        return await this.wpstring2(string, "big");
    };

    /**
    * Writes Wide Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring4(string: string, endian?: stringOptions["endian"]) {
        return await this.wpstring(string, 4, endian);
    };

    /**
    * Writes Wide Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring4le(string: string) {
        return await this.wpstring4(string, "little");
    };

    /**
    * Writes Wide Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring4be(string: string) {
        return await this.wpstring4(string, "big");
    };

    /**
    * Writes Double Wide Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async dwpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "double-wide-pascal", encoding: "utf-32", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Double Wide Pascal string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async dwpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]) {
        return await this.dwpstring(string, lengthWriteSize, "little");
    };

    /**
    * Writes Double Wide Pascal string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async dwpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]) {
        return await this.dwpstring(string, lengthWriteSize, "big");
    };

    /**
    * Writes Double Wide Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async dwpstring1(string: string, endian?: stringOptions["endian"]) {
        return await this.dwpstring(string, 1, endian);
    };

    /**
    * Writes Double Wide Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async dwpstring1le(string: string) {
        return await this.dwpstring1(string, "little");
    };

    /**
    * Writes Double Wide Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async dwpstring1be(string: string) {
        return await this.dwpstring1(string, "big");
    };

    /**
    * Writes Double Wide Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async dwpstring2(string: string, endian?: stringOptions["endian"]) {
        return await this.dwpstring(string, 2, endian);
    };

    /**
    * Writes Double Wide Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async dwpstring2le(string: string) {
        return await this.dwpstring2(string, "little");
    };

    /**
    * Writes Double Wide Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async dwpstring2be(string: string) {
        return await this.dwpstring2(string, "big");
    };

    /**
    * Writes Double Wide Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async dwpstring4(string: string, endian?: stringOptions["endian"]) {
        return await this.dwpstring(string, 4, endian);
    };

    /**
    * Writes Double Wide Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async dwpstring4le(string: string) {
        return await this.dwpstring4(string, "little");
    };

    /**
    * Writes Double Wide Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async dwpstring4be(string: string) {
        return await this.dwpstring4(string, "big");
    };
};