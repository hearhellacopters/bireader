import {
    BiOptions,
    BigValue,
    BytesOutput,
    endian,
    stringOptions,
} from "./common.js";
import { BiEngine } from './core/engine/engine.js';

/**
 * Async Binary reader, includes bitfields and strings.
 *
 * @param {DataType} input - File path or a `Buffer` or `Uint8Array`.
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
 * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
 * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
 * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
 * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
 * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
 * @param {BiOptions["readOnly"]?} [options.readOnly = true] - Allow data writes when reading a file (default `true` in reader)
 * @param {BiOptions["windowSize"]?} [options.windowSize = 4096] - Size of the chunk of a file to load per read. Set to `0` to load the whole file in one async read (default `4 KiB`)
 * 
 * @since 4.0
 */
export class BiReaderAsync<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false> extends BiEngine<alwaysBigInt, BytesOutput<DataType>> {
    constructor(input: DataType, options: BiOptions<alwaysBigInt> = {}) {
        if (input == undefined) {
            throw new Error("Can not start BiReaderAsync without data.");
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
            windowSize: options.windowSize ?? 0x1000,
        });
    };

    /**
     * Creates and opens a new `BiReaderAsync`.
     *
     * @param {DataType} input - File path or a `Buffer` or `Uint8Array`.
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
     * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
     * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
     * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
     * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
     * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
     * @param {BiOptions["readOnly"]?} [options.readOnly = true] - Allow data writes when reading a file (default `true` in reader)
     * @param {BiOptions["windowSize"]?} [options.windowSize = 4096] - Size of the chunk of a file to load per read. Set to `0` to load the whole file in one async read (default `4 KiB`)
     * 
     * @since 4.0
     */
    static async create<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false>(input: DataType, options: BiOptions<alwaysBigInt> = {}): Promise<BiReaderAsync<DataType, alwaysBigInt>> {
        const instance = new BiReaderAsync<DataType, alwaysBigInt>(input, options);

        await instance.open();

        return instance;
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
     * @returns {Promise<number>}
     */
    async bit(bits: number, unsigned?: boolean, endian?: endian): Promise<number> {
        return await this.readBit(bits, unsigned, endian);
    };

    /**
     * Bit field reader. Unsigned read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async ubit(bits: number, endian?: endian): Promise<number> {
        return await this.readBit(bits, true, endian);
    };

    /**
     * Bit field reader. Unsigned big endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    async ubitbe(bits: number): Promise<number> {
        return await this.bit(bits, true, "big");
    };

    /**
     * Bit field reader. Big endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {Promise<number>}
     */
    async bitbe(bits: number, unsigned?: boolean): Promise<number> {
        return await this.bit(bits, unsigned, "big");
    };

    /**
     * Bit field reader. Unsigned little endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    async ubitle(bits: number): Promise<number> {
        return await this.bit(bits, true, "little");
    };

    /**
     * Bit field reader. Little endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {Promise<number>}
     */
    async bitle(bits: number, unsigned?: boolean): Promise<number> {
        return await this.bit(bits, unsigned, "little");
    };
    //
    // #region Generated mechanical aliases
    //

    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====
    // Behaviour is verified by test/aliases.parity.test.ts.

    /** Read a signed 8-bit integer. */
    async byte(): Promise<number> { return await this.readByte(); }

    /** Read a signed 8-bit integer. */
    async int8(): Promise<number> { return await this.readByte(); }

    /** Read an unsigned 8-bit integer. */
    async uint8(): Promise<number> { return await this.readByte(true); }

    /** Read an unsigned 8-bit integer. */
    async ubyte(): Promise<number> { return await this.readByte(true); }

    /** Read a signed 16-bit integer. */
    async int16(): Promise<number> { return await this.readInt16(); }

    /** Read a signed 16-bit integer. */
    async short(): Promise<number> { return await this.readInt16(); }

    /** Read a signed 16-bit integer. */
    async word(): Promise<number> { return await this.readInt16(); }

    /** Read an unsigned 16-bit integer. */
    async uint16(): Promise<number> { return await this.readInt16(true); }

    /** Read an unsigned 16-bit integer. */
    async ushort(): Promise<number> { return await this.readInt16(true); }

    /** Read an unsigned 16-bit integer. */
    async uword(): Promise<number> { return await this.readInt16(true); }

    /** Read a signed 16-bit integer (little-endian). */
    async int16le(): Promise<number> { return await this.readInt16(false, "little"); }

    /** Read a signed 16-bit integer (little-endian). */
    async shortle(): Promise<number> { return await this.readInt16(false, "little"); }

    /** Read a signed 16-bit integer (little-endian). */
    async wordle(): Promise<number> { return await this.readInt16(false, "little"); }

    /** Read an unsigned 16-bit integer (little-endian). */
    async uint16le(): Promise<number> { return await this.readInt16(true, "little"); }

    /** Read an unsigned 16-bit integer (little-endian). */
    async ushortle(): Promise<number> { return await this.readInt16(true, "little"); }

    /** Read an unsigned 16-bit integer (little-endian). */
    async uwordle(): Promise<number> { return await this.readInt16(true, "little"); }

    /** Read a signed 16-bit integer (big-endian). */
    async int16be(): Promise<number> { return await this.readInt16(false, "big"); }

    /** Read a signed 16-bit integer (big-endian). */
    async shortbe(): Promise<number> { return await this.readInt16(false, "big"); }

    /** Read a signed 16-bit integer (big-endian). */
    async wordbe(): Promise<number> { return await this.readInt16(false, "big"); }

    /** Read an unsigned 16-bit integer (big-endian). */
    async uint16be(): Promise<number> { return await this.readInt16(true, "big"); }

    /** Read an unsigned 16-bit integer (big-endian). */
    async ushortbe(): Promise<number> { return await this.readInt16(true, "big"); }

    /** Read an unsigned 16-bit integer (big-endian). */
    async uwordbe(): Promise<number> { return await this.readInt16(true, "big"); }

    /** Read a signed 32-bit integer. */
    async int(): Promise<number> { return await this.readInt32(); }

    /** Read a signed 32-bit integer. */
    async dword(): Promise<number> { return await this.readInt32(); }

    /** Read a signed 32-bit integer. */
    async int32(): Promise<number> { return await this.readInt32(); }

    /** Read a signed 32-bit integer. */
    async long(): Promise<number> { return await this.readInt32(); }

    /** Read an unsigned 32-bit integer. */
    async uint(): Promise<number> { return await this.readInt32(true); }

    /** Read an unsigned 32-bit integer. */
    async udword(): Promise<number> { return await this.readInt32(true); }

    /** Read an unsigned 32-bit integer. */
    async uint32(): Promise<number> { return await this.readInt32(true); }

    /** Read an unsigned 32-bit integer. */
    async ulong(): Promise<number> { return await this.readInt32(true); }

    /** Read a signed 32-bit integer (little-endian). */
    async intle(): Promise<number> { return await this.readInt32(false, "little"); }

    /** Read a signed 32-bit integer (little-endian). */
    async dwordle(): Promise<number> { return await this.readInt32(false, "little"); }

    /** Read a signed 32-bit integer (little-endian). */
    async int32le(): Promise<number> { return await this.readInt32(false, "little"); }

    /** Read a signed 32-bit integer (little-endian). */
    async longle(): Promise<number> { return await this.readInt32(false, "little"); }

    /** Read an unsigned 32-bit integer (little-endian). */
    async uintle(): Promise<number> { return await this.readInt32(true, "little"); }

    /** Read an unsigned 32-bit integer (little-endian). */
    async udwordle(): Promise<number> { return await this.readInt32(true, "little"); }

    /** Read an unsigned 32-bit integer (little-endian). */
    async uint32le(): Promise<number> { return await this.readInt32(true, "little"); }

    /** Read an unsigned 32-bit integer (little-endian). */
    async ulongle(): Promise<number> { return await this.readInt32(true, "little"); }

    /** Read a signed 32-bit integer (big-endian). */
    async intbe(): Promise<number> { return await this.readInt32(false, "big"); }

    /** Read a signed 32-bit integer (big-endian). */
    async dwordbe(): Promise<number> { return await this.readInt32(false, "big"); }

    /** Read a signed 32-bit integer (big-endian). */
    async int32be(): Promise<number> { return await this.readInt32(false, "big"); }

    /** Read a signed 32-bit integer (big-endian). */
    async longbe(): Promise<number> { return await this.readInt32(false, "big"); }

    /** Read an unsigned 32-bit integer (big-endian). */
    async uintbe(): Promise<number> { return await this.readInt32(true, "big"); }

    /** Read an unsigned 32-bit integer (big-endian). */
    async udwordbe(): Promise<number> { return await this.readInt32(true, "big"); }

    /** Read an unsigned 32-bit integer (big-endian). */
    async uint32be(): Promise<number> { return await this.readInt32(true, "big"); }

    /** Read an unsigned 32-bit integer (big-endian). */
    async ulongbe(): Promise<number> { return await this.readInt32(true, "big"); }

    /** Read a signed 64-bit integer. */
    async int64(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(); }

    /** Read a signed 64-bit integer. */
    async bigint(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(); }

    /** Read a signed 64-bit integer. */
    async quad(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(); }

    /** Read an unsigned 64-bit integer. */
    async uint64(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true); }

    /** Read an unsigned 64-bit integer. */
    async ubigint(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true); }

    /** Read an unsigned 64-bit integer. */
    async uquad(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true); }

    /** Read a signed 64-bit integer (little-endian). */
    async int64le(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(false, "little"); }

    /** Read a signed 64-bit integer (little-endian). */
    async bigintle(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(false, "little"); }

    /** Read a signed 64-bit integer (little-endian). */
    async quadle(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(false, "little"); }

    /** Read an unsigned 64-bit integer (little-endian). */
    async uint64le(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true, "little"); }

    /** Read an unsigned 64-bit integer (little-endian). */
    async ubigintle(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true, "little"); }

    /** Read an unsigned 64-bit integer (little-endian). */
    async uquadle(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true, "little"); }

    /** Read a signed 64-bit integer (big-endian). */
    async int64be(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(false, "big"); }

    /** Read a signed 64-bit integer (big-endian). */
    async bigintbe(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(false, "big"); }

    /** Read a signed 64-bit integer (big-endian). */
    async quadbe(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(false, "big"); }

    /** Read an unsigned 64-bit integer (big-endian). */
    async uint64be(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true, "big"); }

    /** Read an unsigned 64-bit integer (big-endian). */
    async ubigintbe(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true, "big"); }

    /** Read an unsigned 64-bit integer (big-endian). */
    async uquadbe(): Promise<alwaysBigInt extends true ? bigint : BigValue> { return await this.readInt64(true, "big"); }

    /** Read a 32-bit float. */
    async float(): Promise<number> { return await this.readFloat(); }

    /** Read a 32-bit float (little-endian). */
    async floatle(): Promise<number> { return await this.readFloat("little"); }

    /** Read a 32-bit float (big-endian). */
    async floatbe(): Promise<number> { return await this.readFloat("big"); }

    /** Read a 16-bit float. */
    async halffloat(): Promise<number> { return await this.readHalfFloat(); }

    /** Read a 16-bit float. */
    async half(): Promise<number> { return await this.readHalfFloat(); }

    /** Read a 16-bit float (little-endian). */
    async halffloatle(): Promise<number> { return await this.readHalfFloat("little"); }

    /** Read a 16-bit float (little-endian). */
    async halfle(): Promise<number> { return await this.readHalfFloat("little"); }

    /** Read a 16-bit float (big-endian). */
    async halffloatbe(): Promise<number> { return await this.readHalfFloat("big"); }

    /** Read a 16-bit float (big-endian). */
    async halfbe(): Promise<number> { return await this.readHalfFloat("big"); }

    /** Read a 64-bit float. */
    async doublefloat(): Promise<number> { return await this.readDoubleFloat(); }

    /** Read a 64-bit float. */
    async dfloat(): Promise<number> { return await this.readDoubleFloat(); }

    /** Read a 64-bit float (little-endian). */
    async doublefloatle(): Promise<number> { return await this.readDoubleFloat("little"); }

    /** Read a 64-bit float (little-endian). */
    async dfloatle(): Promise<number> { return await this.readDoubleFloat("little"); }

    /** Read a 64-bit float (big-endian). */
    async doublefloatbe(): Promise<number> { return await this.readDoubleFloat("big"); }

    /** Read a 64-bit float (big-endian). */
    async dfloatbe(): Promise<number> { return await this.readDoubleFloat("big"); }

    /** Read 1 signed bit. */
    async bit1(): Promise<number> { return await this.bit(1); }

    /** Read 1 unsigned bit. */
    async ubit1(): Promise<number> { return await this.bit(1, true); }

    /** Read 1 signed bit (little-endian). */
    async bit1le(): Promise<number> { return await this.bit(1, undefined, "little"); }

    /** Read 1 unsigned bit (little-endian). */
    async ubit1le(): Promise<number> { return await this.bit(1, true, "little"); }

    /** Read 1 signed bit (big-endian). */
    async bit1be(): Promise<number> { return await this.bit(1, undefined, "big"); }

    /** Read 1 unsigned bit (big-endian). */
    async ubit1be(): Promise<number> { return await this.bit(1, true, "big"); }

    /** Read 2 signed bits. */
    async bit2(): Promise<number> { return await this.bit(2); }

    /** Read 2 unsigned bits. */
    async ubit2(): Promise<number> { return await this.bit(2, true); }

    /** Read 2 signed bits (little-endian). */
    async bit2le(): Promise<number> { return await this.bit(2, undefined, "little"); }

    /** Read 2 unsigned bits (little-endian). */
    async ubit2le(): Promise<number> { return await this.bit(2, true, "little"); }

    /** Read 2 signed bits (big-endian). */
    async bit2be(): Promise<number> { return await this.bit(2, undefined, "big"); }

    /** Read 2 unsigned bits (big-endian). */
    async ubit2be(): Promise<number> { return await this.bit(2, true, "big"); }

    /** Read 3 signed bits. */
    async bit3(): Promise<number> { return await this.bit(3); }

    /** Read 3 unsigned bits. */
    async ubit3(): Promise<number> { return await this.bit(3, true); }

    /** Read 3 signed bits (little-endian). */
    async bit3le(): Promise<number> { return await this.bit(3, undefined, "little"); }

    /** Read 3 unsigned bits (little-endian). */
    async ubit3le(): Promise<number> { return await this.bit(3, true, "little"); }

    /** Read 3 signed bits (big-endian). */
    async bit3be(): Promise<number> { return await this.bit(3, undefined, "big"); }

    /** Read 3 unsigned bits (big-endian). */
    async ubit3be(): Promise<number> { return await this.bit(3, true, "big"); }

    /** Read 4 signed bits. */
    async bit4(): Promise<number> { return await this.bit(4); }

    /** Read 4 unsigned bits. */
    async ubit4(): Promise<number> { return await this.bit(4, true); }

    /** Read 4 signed bits (little-endian). */
    async bit4le(): Promise<number> { return await this.bit(4, undefined, "little"); }

    /** Read 4 unsigned bits (little-endian). */
    async ubit4le(): Promise<number> { return await this.bit(4, true, "little"); }

    /** Read 4 signed bits (big-endian). */
    async bit4be(): Promise<number> { return await this.bit(4, undefined, "big"); }

    /** Read 4 unsigned bits (big-endian). */
    async ubit4be(): Promise<number> { return await this.bit(4, true, "big"); }

    /** Read 5 signed bits. */
    async bit5(): Promise<number> { return await this.bit(5); }

    /** Read 5 unsigned bits. */
    async ubit5(): Promise<number> { return await this.bit(5, true); }

    /** Read 5 signed bits (little-endian). */
    async bit5le(): Promise<number> { return await this.bit(5, undefined, "little"); }

    /** Read 5 unsigned bits (little-endian). */
    async ubit5le(): Promise<number> { return await this.bit(5, true, "little"); }

    /** Read 5 signed bits (big-endian). */
    async bit5be(): Promise<number> { return await this.bit(5, undefined, "big"); }

    /** Read 5 unsigned bits (big-endian). */
    async ubit5be(): Promise<number> { return await this.bit(5, true, "big"); }

    /** Read 6 signed bits. */
    async bit6(): Promise<number> { return await this.bit(6); }

    /** Read 6 unsigned bits. */
    async ubit6(): Promise<number> { return await this.bit(6, true); }

    /** Read 6 signed bits (little-endian). */
    async bit6le(): Promise<number> { return await this.bit(6, undefined, "little"); }

    /** Read 6 unsigned bits (little-endian). */
    async ubit6le(): Promise<number> { return await this.bit(6, true, "little"); }

    /** Read 6 signed bits (big-endian). */
    async bit6be(): Promise<number> { return await this.bit(6, undefined, "big"); }

    /** Read 6 unsigned bits (big-endian). */
    async ubit6be(): Promise<number> { return await this.bit(6, true, "big"); }

    /** Read 7 signed bits. */
    async bit7(): Promise<number> { return await this.bit(7); }

    /** Read 7 unsigned bits. */
    async ubit7(): Promise<number> { return await this.bit(7, true); }

    /** Read 7 signed bits (little-endian). */
    async bit7le(): Promise<number> { return await this.bit(7, undefined, "little"); }

    /** Read 7 unsigned bits (little-endian). */
    async ubit7le(): Promise<number> { return await this.bit(7, true, "little"); }

    /** Read 7 signed bits (big-endian). */
    async bit7be(): Promise<number> { return await this.bit(7, undefined, "big"); }

    /** Read 7 unsigned bits (big-endian). */
    async ubit7be(): Promise<number> { return await this.bit(7, true, "big"); }

    /** Read 8 signed bits. */
    async bit8(): Promise<number> { return await this.bit(8); }

    /** Read 8 unsigned bits. */
    async ubit8(): Promise<number> { return await this.bit(8, true); }

    /** Read 8 signed bits (little-endian). */
    async bit8le(): Promise<number> { return await this.bit(8, undefined, "little"); }

    /** Read 8 unsigned bits (little-endian). */
    async ubit8le(): Promise<number> { return await this.bit(8, true, "little"); }

    /** Read 8 signed bits (big-endian). */
    async bit8be(): Promise<number> { return await this.bit(8, undefined, "big"); }

    /** Read 8 unsigned bits (big-endian). */
    async ubit8be(): Promise<number> { return await this.bit(8, true, "big"); }

    /** Read 9 signed bits. */
    async bit9(): Promise<number> { return await this.bit(9); }

    /** Read 9 unsigned bits. */
    async ubit9(): Promise<number> { return await this.bit(9, true); }

    /** Read 9 signed bits (little-endian). */
    async bit9le(): Promise<number> { return await this.bit(9, undefined, "little"); }

    /** Read 9 unsigned bits (little-endian). */
    async ubit9le(): Promise<number> { return await this.bit(9, true, "little"); }

    /** Read 9 signed bits (big-endian). */
    async bit9be(): Promise<number> { return await this.bit(9, undefined, "big"); }

    /** Read 9 unsigned bits (big-endian). */
    async ubit9be(): Promise<number> { return await this.bit(9, true, "big"); }

    /** Read 10 signed bits. */
    async bit10(): Promise<number> { return await this.bit(10); }

    /** Read 10 unsigned bits. */
    async ubit10(): Promise<number> { return await this.bit(10, true); }

    /** Read 10 signed bits (little-endian). */
    async bit10le(): Promise<number> { return await this.bit(10, undefined, "little"); }

    /** Read 10 unsigned bits (little-endian). */
    async ubit10le(): Promise<number> { return await this.bit(10, true, "little"); }

    /** Read 10 signed bits (big-endian). */
    async bit10be(): Promise<number> { return await this.bit(10, undefined, "big"); }

    /** Read 10 unsigned bits (big-endian). */
    async ubit10be(): Promise<number> { return await this.bit(10, true, "big"); }

    /** Read 11 signed bits. */
    async bit11(): Promise<number> { return await this.bit(11); }

    /** Read 11 unsigned bits. */
    async ubit11(): Promise<number> { return await this.bit(11, true); }

    /** Read 11 signed bits (little-endian). */
    async bit11le(): Promise<number> { return await this.bit(11, undefined, "little"); }

    /** Read 11 unsigned bits (little-endian). */
    async ubit11le(): Promise<number> { return await this.bit(11, true, "little"); }

    /** Read 11 signed bits (big-endian). */
    async bit11be(): Promise<number> { return await this.bit(11, undefined, "big"); }

    /** Read 11 unsigned bits (big-endian). */
    async ubit11be(): Promise<number> { return await this.bit(11, true, "big"); }

    /** Read 12 signed bits. */
    async bit12(): Promise<number> { return await this.bit(12); }

    /** Read 12 unsigned bits. */
    async ubit12(): Promise<number> { return await this.bit(12, true); }

    /** Read 12 signed bits (little-endian). */
    async bit12le(): Promise<number> { return await this.bit(12, undefined, "little"); }

    /** Read 12 unsigned bits (little-endian). */
    async ubit12le(): Promise<number> { return await this.bit(12, true, "little"); }

    /** Read 12 signed bits (big-endian). */
    async bit12be(): Promise<number> { return await this.bit(12, undefined, "big"); }

    /** Read 12 unsigned bits (big-endian). */
    async ubit12be(): Promise<number> { return await this.bit(12, true, "big"); }

    /** Read 13 signed bits. */
    async bit13(): Promise<number> { return await this.bit(13); }

    /** Read 13 unsigned bits. */
    async ubit13(): Promise<number> { return await this.bit(13, true); }

    /** Read 13 signed bits (little-endian). */
    async bit13le(): Promise<number> { return await this.bit(13, undefined, "little"); }

    /** Read 13 unsigned bits (little-endian). */
    async ubit13le(): Promise<number> { return await this.bit(13, true, "little"); }

    /** Read 13 signed bits (big-endian). */
    async bit13be(): Promise<number> { return await this.bit(13, undefined, "big"); }

    /** Read 13 unsigned bits (big-endian). */
    async ubit13be(): Promise<number> { return await this.bit(13, true, "big"); }

    /** Read 14 signed bits. */
    async bit14(): Promise<number> { return await this.bit(14); }

    /** Read 14 unsigned bits. */
    async ubit14(): Promise<number> { return await this.bit(14, true); }

    /** Read 14 signed bits (little-endian). */
    async bit14le(): Promise<number> { return await this.bit(14, undefined, "little"); }

    /** Read 14 unsigned bits (little-endian). */
    async ubit14le(): Promise<number> { return await this.bit(14, true, "little"); }

    /** Read 14 signed bits (big-endian). */
    async bit14be(): Promise<number> { return await this.bit(14, undefined, "big"); }

    /** Read 14 unsigned bits (big-endian). */
    async ubit14be(): Promise<number> { return await this.bit(14, true, "big"); }

    /** Read 15 signed bits. */
    async bit15(): Promise<number> { return await this.bit(15); }

    /** Read 15 unsigned bits. */
    async ubit15(): Promise<number> { return await this.bit(15, true); }

    /** Read 15 signed bits (little-endian). */
    async bit15le(): Promise<number> { return await this.bit(15, undefined, "little"); }

    /** Read 15 unsigned bits (little-endian). */
    async ubit15le(): Promise<number> { return await this.bit(15, true, "little"); }

    /** Read 15 signed bits (big-endian). */
    async bit15be(): Promise<number> { return await this.bit(15, undefined, "big"); }

    /** Read 15 unsigned bits (big-endian). */
    async ubit15be(): Promise<number> { return await this.bit(15, true, "big"); }

    /** Read 16 signed bits. */
    async bit16(): Promise<number> { return await this.bit(16); }

    /** Read 16 unsigned bits. */
    async ubit16(): Promise<number> { return await this.bit(16, true); }

    /** Read 16 signed bits (little-endian). */
    async bit16le(): Promise<number> { return await this.bit(16, undefined, "little"); }

    /** Read 16 unsigned bits (little-endian). */
    async ubit16le(): Promise<number> { return await this.bit(16, true, "little"); }

    /** Read 16 signed bits (big-endian). */
    async bit16be(): Promise<number> { return await this.bit(16, undefined, "big"); }

    /** Read 16 unsigned bits (big-endian). */
    async ubit16be(): Promise<number> { return await this.bit(16, true, "big"); }

    /** Read 17 signed bits. */
    async bit17(): Promise<number> { return await this.bit(17); }

    /** Read 17 unsigned bits. */
    async ubit17(): Promise<number> { return await this.bit(17, true); }

    /** Read 17 signed bits (little-endian). */
    async bit17le(): Promise<number> { return await this.bit(17, undefined, "little"); }

    /** Read 17 unsigned bits (little-endian). */
    async ubit17le(): Promise<number> { return await this.bit(17, true, "little"); }

    /** Read 17 signed bits (big-endian). */
    async bit17be(): Promise<number> { return await this.bit(17, undefined, "big"); }

    /** Read 17 unsigned bits (big-endian). */
    async ubit17be(): Promise<number> { return await this.bit(17, true, "big"); }

    /** Read 18 signed bits. */
    async bit18(): Promise<number> { return await this.bit(18); }

    /** Read 18 unsigned bits. */
    async ubit18(): Promise<number> { return await this.bit(18, true); }

    /** Read 18 signed bits (little-endian). */
    async bit18le(): Promise<number> { return await this.bit(18, undefined, "little"); }

    /** Read 18 unsigned bits (little-endian). */
    async ubit18le(): Promise<number> { return await this.bit(18, true, "little"); }

    /** Read 18 signed bits (big-endian). */
    async bit18be(): Promise<number> { return await this.bit(18, undefined, "big"); }

    /** Read 18 unsigned bits (big-endian). */
    async ubit18be(): Promise<number> { return await this.bit(18, true, "big"); }

    /** Read 19 signed bits. */
    async bit19(): Promise<number> { return await this.bit(19); }

    /** Read 19 unsigned bits. */
    async ubit19(): Promise<number> { return await this.bit(19, true); }

    /** Read 19 signed bits (little-endian). */
    async bit19le(): Promise<number> { return await this.bit(19, undefined, "little"); }

    /** Read 19 unsigned bits (little-endian). */
    async ubit19le(): Promise<number> { return await this.bit(19, true, "little"); }

    /** Read 19 signed bits (big-endian). */
    async bit19be(): Promise<number> { return await this.bit(19, undefined, "big"); }

    /** Read 19 unsigned bits (big-endian). */
    async ubit19be(): Promise<number> { return await this.bit(19, true, "big"); }

    /** Read 20 signed bits. */
    async bit20(): Promise<number> { return await this.bit(20); }

    /** Read 20 unsigned bits. */
    async ubit20(): Promise<number> { return await this.bit(20, true); }

    /** Read 20 signed bits (little-endian). */
    async bit20le(): Promise<number> { return await this.bit(20, undefined, "little"); }

    /** Read 20 unsigned bits (little-endian). */
    async ubit20le(): Promise<number> { return await this.bit(20, true, "little"); }

    /** Read 20 signed bits (big-endian). */
    async bit20be(): Promise<number> { return await this.bit(20, undefined, "big"); }

    /** Read 20 unsigned bits (big-endian). */
    async ubit20be(): Promise<number> { return await this.bit(20, true, "big"); }

    /** Read 21 signed bits. */
    async bit21(): Promise<number> { return await this.bit(21); }

    /** Read 21 unsigned bits. */
    async ubit21(): Promise<number> { return await this.bit(21, true); }

    /** Read 21 signed bits (little-endian). */
    async bit21le(): Promise<number> { return await this.bit(21, undefined, "little"); }

    /** Read 21 unsigned bits (little-endian). */
    async ubit21le(): Promise<number> { return await this.bit(21, true, "little"); }

    /** Read 21 signed bits (big-endian). */
    async bit21be(): Promise<number> { return await this.bit(21, undefined, "big"); }

    /** Read 21 unsigned bits (big-endian). */
    async ubit21be(): Promise<number> { return await this.bit(21, true, "big"); }

    /** Read 22 signed bits. */
    async bit22(): Promise<number> { return await this.bit(22); }

    /** Read 22 unsigned bits. */
    async ubit22(): Promise<number> { return await this.bit(22, true); }

    /** Read 22 signed bits (little-endian). */
    async bit22le(): Promise<number> { return await this.bit(22, undefined, "little"); }

    /** Read 22 unsigned bits (little-endian). */
    async ubit22le(): Promise<number> { return await this.bit(22, true, "little"); }

    /** Read 22 signed bits (big-endian). */
    async bit22be(): Promise<number> { return await this.bit(22, undefined, "big"); }

    /** Read 22 unsigned bits (big-endian). */
    async ubit22be(): Promise<number> { return await this.bit(22, true, "big"); }

    /** Read 23 signed bits. */
    async bit23(): Promise<number> { return await this.bit(23); }

    /** Read 23 unsigned bits. */
    async ubit23(): Promise<number> { return await this.bit(23, true); }

    /** Read 23 signed bits (little-endian). */
    async bit23le(): Promise<number> { return await this.bit(23, undefined, "little"); }

    /** Read 23 unsigned bits (little-endian). */
    async ubit23le(): Promise<number> { return await this.bit(23, true, "little"); }

    /** Read 23 signed bits (big-endian). */
    async bit23be(): Promise<number> { return await this.bit(23, undefined, "big"); }

    /** Read 23 unsigned bits (big-endian). */
    async ubit23be(): Promise<number> { return await this.bit(23, true, "big"); }

    /** Read 24 signed bits. */
    async bit24(): Promise<number> { return await this.bit(24); }

    /** Read 24 unsigned bits. */
    async ubit24(): Promise<number> { return await this.bit(24, true); }

    /** Read 24 signed bits (little-endian). */
    async bit24le(): Promise<number> { return await this.bit(24, undefined, "little"); }

    /** Read 24 unsigned bits (little-endian). */
    async ubit24le(): Promise<number> { return await this.bit(24, true, "little"); }

    /** Read 24 signed bits (big-endian). */
    async bit24be(): Promise<number> { return await this.bit(24, undefined, "big"); }

    /** Read 24 unsigned bits (big-endian). */
    async ubit24be(): Promise<number> { return await this.bit(24, true, "big"); }

    /** Read 25 signed bits. */
    async bit25(): Promise<number> { return await this.bit(25); }

    /** Read 25 unsigned bits. */
    async ubit25(): Promise<number> { return await this.bit(25, true); }

    /** Read 25 signed bits (little-endian). */
    async bit25le(): Promise<number> { return await this.bit(25, undefined, "little"); }

    /** Read 25 unsigned bits (little-endian). */
    async ubit25le(): Promise<number> { return await this.bit(25, true, "little"); }

    /** Read 25 signed bits (big-endian). */
    async bit25be(): Promise<number> { return await this.bit(25, undefined, "big"); }

    /** Read 25 unsigned bits (big-endian). */
    async ubit25be(): Promise<number> { return await this.bit(25, true, "big"); }

    /** Read 26 signed bits. */
    async bit26(): Promise<number> { return await this.bit(26); }

    /** Read 26 unsigned bits. */
    async ubit26(): Promise<number> { return await this.bit(26, true); }

    /** Read 26 signed bits (little-endian). */
    async bit26le(): Promise<number> { return await this.bit(26, undefined, "little"); }

    /** Read 26 unsigned bits (little-endian). */
    async ubit26le(): Promise<number> { return await this.bit(26, true, "little"); }

    /** Read 26 signed bits (big-endian). */
    async bit26be(): Promise<number> { return await this.bit(26, undefined, "big"); }

    /** Read 26 unsigned bits (big-endian). */
    async ubit26be(): Promise<number> { return await this.bit(26, true, "big"); }

    /** Read 27 signed bits. */
    async bit27(): Promise<number> { return await this.bit(27); }

    /** Read 27 unsigned bits. */
    async ubit27(): Promise<number> { return await this.bit(27, true); }

    /** Read 27 signed bits (little-endian). */
    async bit27le(): Promise<number> { return await this.bit(27, undefined, "little"); }

    /** Read 27 unsigned bits (little-endian). */
    async ubit27le(): Promise<number> { return await this.bit(27, true, "little"); }

    /** Read 27 signed bits (big-endian). */
    async bit27be(): Promise<number> { return await this.bit(27, undefined, "big"); }

    /** Read 27 unsigned bits (big-endian). */
    async ubit27be(): Promise<number> { return await this.bit(27, true, "big"); }

    /** Read 28 signed bits. */
    async bit28(): Promise<number> { return await this.bit(28); }

    /** Read 28 unsigned bits. */
    async ubit28(): Promise<number> { return await this.bit(28, true); }

    /** Read 28 signed bits (little-endian). */
    async bit28le(): Promise<number> { return await this.bit(28, undefined, "little"); }

    /** Read 28 unsigned bits (little-endian). */
    async ubit28le(): Promise<number> { return await this.bit(28, true, "little"); }

    /** Read 28 signed bits (big-endian). */
    async bit28be(): Promise<number> { return await this.bit(28, undefined, "big"); }

    /** Read 28 unsigned bits (big-endian). */
    async ubit28be(): Promise<number> { return await this.bit(28, true, "big"); }

    /** Read 29 signed bits. */
    async bit29(): Promise<number> { return await this.bit(29); }

    /** Read 29 unsigned bits. */
    async ubit29(): Promise<number> { return await this.bit(29, true); }

    /** Read 29 signed bits (little-endian). */
    async bit29le(): Promise<number> { return await this.bit(29, undefined, "little"); }

    /** Read 29 unsigned bits (little-endian). */
    async ubit29le(): Promise<number> { return await this.bit(29, true, "little"); }

    /** Read 29 signed bits (big-endian). */
    async bit29be(): Promise<number> { return await this.bit(29, undefined, "big"); }

    /** Read 29 unsigned bits (big-endian). */
    async ubit29be(): Promise<number> { return await this.bit(29, true, "big"); }

    /** Read 30 signed bits. */
    async bit30(): Promise<number> { return await this.bit(30); }

    /** Read 30 unsigned bits. */
    async ubit30(): Promise<number> { return await this.bit(30, true); }

    /** Read 30 signed bits (little-endian). */
    async bit30le(): Promise<number> { return await this.bit(30, undefined, "little"); }

    /** Read 30 unsigned bits (little-endian). */
    async ubit30le(): Promise<number> { return await this.bit(30, true, "little"); }

    /** Read 30 signed bits (big-endian). */
    async bit30be(): Promise<number> { return await this.bit(30, undefined, "big"); }

    /** Read 30 unsigned bits (big-endian). */
    async ubit30be(): Promise<number> { return await this.bit(30, true, "big"); }

    /** Read 31 signed bits. */
    async bit31(): Promise<number> { return await this.bit(31); }

    /** Read 31 unsigned bits. */
    async ubit31(): Promise<number> { return await this.bit(31, true); }

    /** Read 31 signed bits (little-endian). */
    async bit31le(): Promise<number> { return await this.bit(31, undefined, "little"); }

    /** Read 31 unsigned bits (little-endian). */
    async ubit31le(): Promise<number> { return await this.bit(31, true, "little"); }

    /** Read 31 signed bits (big-endian). */
    async bit31be(): Promise<number> { return await this.bit(31, undefined, "big"); }

    /** Read 31 unsigned bits (big-endian). */
    async ubit31be(): Promise<number> { return await this.bit(31, true, "big"); }

    /** Read 32 signed bits. */
    async bit32(): Promise<number> { return await this.bit(32); }

    /** Read 32 unsigned bits. */
    async ubit32(): Promise<number> { return await this.bit(32, true); }

    /** Read 32 signed bits (little-endian). */
    async bit32le(): Promise<number> { return await this.bit(32, undefined, "little"); }

    /** Read 32 unsigned bits (little-endian). */
    async ubit32le(): Promise<number> { return await this.bit(32, true, "little"); }

    /** Read 32 signed bits (big-endian). */
    async bit32be(): Promise<number> { return await this.bit(32, undefined, "big"); }

    /** Read 32 unsigned bits (big-endian). */
    async ubit32be(): Promise<number> { return await this.bit(32, true, "big"); }

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
    * @param {boolean} [consume=true] - advance the read position past the string (default `true`)
    * @returns {string}
    */
    async string(options?: stringOptions, consume: boolean = true): Promise<string> {
        return await this.readString(options, consume);
    };

    /**
    * Reads string using setting from .strDefaults
    * 
    * Default is ``utf-8``
    * 
    * @returns {Promise<string>}
    */
    async str(): Promise<string> {
        return await this.readString(this.strDefaults);
    };

    /**
    * Reads UTF-8 (C) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async utf8string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads UTF-8 (C) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.utf8string(length, terminateValue, stripNull);
    };

    /**
    * Reads ANSI string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads latin1 string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async latin1string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-8", encoding: "iso-8859-1", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async utf16string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.utf16string(length, terminateValue, stripNull, endian);
    };

    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.utf16string(length, terminateValue, stripNull, "little");
    };

    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.utf16stringle(length, terminateValue, stripNull);
    };

    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.utf16string(length, terminateValue, stripNull, "big");
    };

    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.utf16stringbe(length, terminateValue, stripNull);
    };

    /**
    * Reads UTF-32 (Unicode) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async utf32string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "utf-32", encoding: "utf-32", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads UTF-32 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async utf32stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.utf32string(length, terminateValue, stripNull, "little");
    };

    /**
    * Reads UTF-32 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async utf32stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.utf32string(length, terminateValue, stripNull, "big");
    };

    /**
    * Reads Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.pstring(lengthReadSize, stripNull, "little");
    };

    /**
    * Reads Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.pstring(lengthReadSize, stripNull, "big");
    };

    /**
    * Reads Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.pstring(1, stripNull, endian);
    };

    /**
    * Reads Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring1le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.pstring1(stripNull, "little");
    };

    /**
    * Reads Pascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring1be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.pstring1(stripNull, "big");
    };

    /**
    * Reads Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.pstring(2, stripNull, endian);
    };

    /**
    * Reads Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring2le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.pstring2(stripNull, "little");
    };

    /**
    * Reads Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring2be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.pstring2(stripNull, "big");
    };

    /**
    * Reads Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.pstring(4, stripNull, endian);
    };

    /**
    * Reads Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring4le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.pstring4(stripNull, "little");
    };

    /**
    * Reads Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring4be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.pstring4(stripNull, "big");
    };

    /**
    * Reads Wide-Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string in little endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>{
        return await this.wpstring(lengthReadSize, stripNull, "little");
    };

    /**
    * Reads Wide-Pascal string in big endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>{
        return await this.wpstring(lengthReadSize, stripNull, "big");
    };

    /**
    * Reads Wide-Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.wpstring(1, stripNull, endian);
    };

    /**
    * Reads Wide-Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring1le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.wpstring1(stripNull, "little");
    };

    /**
    * Reads Wide-Pascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring1be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.wpstring1(stripNull, "big");
    };

    /**
    * Reads Wide-Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.wpstring(2, stripNull, endian);
    };

    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring2le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.wpstring2(stripNull, "little");
    };

    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring2be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.wpstring2(stripNull, "big");
    };

    /**
    * Reads Wide-Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.wpstring(4, stripNull, endian);
    };

    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring4le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.wpstring4(stripNull, "little");
    };

    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring4be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.wpstring4(stripNull, "big");
    };

    /**
    * Reads Double Wide Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async dwpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "double-wide-pascal", encoding: "utf-32", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Double Wide Pascal string in little endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async dwpstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>{
        return await this.dwpstring(lengthReadSize, stripNull, "little");
    };

    /**
    * Reads Double Wide Pascal string in big endian.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async dwpstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>{
        return await this.dwpstring(lengthReadSize, stripNull, "big");
    };

    /**
    * Reads Double Wide Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async dwpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.dwpstring(1, stripNull, endian);
    };

    /**
    * Reads Double Wide Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async dwpstring1le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.dwpstring1(stripNull, "little");
    };

    /**
    * Reads Double WidePascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async dwpstring1be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.dwpstring1(stripNull, "big");
    };

    /**
    * Reads Double Wide Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async dwpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.dwpstring(2, stripNull, endian);
    };

    /**
    * Reads Double Wide Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async dwpstring2le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.dwpstring2(stripNull, "little");
    };

    /**
    * Reads Double Wide Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async dwpstring2be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.dwpstring2(stripNull, "big");
    };

    /**
    * Reads Double Wide Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async dwpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.dwpstring(4, stripNull, endian);
    };

    /**
    * Reads Double Wide Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async dwpstring4le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.dwpstring4(stripNull, "little");
    };

    /**
    * Reads Double Wide Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async dwpstring4be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.dwpstring4(stripNull, "big");
    };
};