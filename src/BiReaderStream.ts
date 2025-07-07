import { BigValue, BiOptions, endian, stringOptions } from "./common.js";
import { BiBaseStreamer } from './core/BiBaseStream.js';

/**
 * Binary reader, includes bitfields and strings.
 *
 * @param {string} filePath - Path to file
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 * 
 * @since 3.1
 */
export class BiReaderStream extends BiBaseStreamer {

    /**
     * Binary reader, includes bitfields and strings.
     * 
     * Note: Must start with .open() before reading.
     *
     * @param {string} filePath - Path to file
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     */
    constructor(filePath: string, options: BiOptions = {}) {
        super(filePath, false);
        this.strict = true;

        if (options.extendBufferSize != undefined && options.extendBufferSize != 0) {
            this.extendBufferSize = options.extendBufferSize;
        }

        if (options.endianness != undefined && typeof options.endianness != "string") {
            throw new Error("Endian must be big or little");
        }
        if (options.endianness != undefined && !(options.endianness == "big" || options.endianness == "little")) {
            throw new Error("Byte order must be big or little");
        }

        this.enforceBigInt = options?.enforceBigInt ?? false;

        this.endian = options.endianness || "little";

        if (typeof options.strict == "boolean") {
            this.strict = options.strict;
        } else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true of false");
            }
        }

        this.offset = options.byteOffset ?? 0;
        this.bitoffset = options.bitOffset ?? 0;
    };

    //
    // Bit Aliases
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

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit1(): number {
        return this.bit(1);
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit1le(): number {
        return this.bit(1, undefined, "little");
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit1be(): number {
        return this.bit(1, undefined, "big");
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit1(): number {
        return this.bit(1, true);
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit1le(): number {
        return this.bit(1, true, "little");
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit1be(): number {
        return this.bit(1, true, "big");
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit2(): number {
        return this.bit(2);
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit2le(): number {
        return this.bit(2, undefined, "little");
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit2be(): number {
        return this.bit(2, undefined, "big");
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit2(): number {
        return this.bit(2, true);
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit2le(): number {
        return this.bit(2, true, "little");
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit2be(): number {
        return this.bit(2, true, "big");
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit3(): number {
        return this.bit(3);
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit3le(): number {
        return this.bit(3, undefined, "little");
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit3be(): number {
        return this.bit(3, undefined, "big");
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit3(): number {
        return this.bit(3, true);
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit3le(): number {
        return this.bit(3, true, "little");
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit3be(): number {
        return this.bit(3, true, "big");
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit4(): number {
        return this.bit(4);
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit4le(): number {
        return this.bit(4, undefined, "little");
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit4be(): number {
        return this.bit(4, undefined, "big");
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit4(): number {
        return this.bit(4, true);
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit4le(): number {
        return this.bit(4, true, "little");
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit4be(): number {
        return this.bit(4, true, "big");
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit5(): number {
        return this.bit(5);
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit5le(): number {
        return this.bit(5, undefined, "little");
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit5be(): number {
        return this.bit(5, undefined, "big");
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit5(): number {
        return this.bit(5, true);
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit5le(): number {
        return this.bit(5, true, "little");
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit5be(): number {
        return this.bit(5, true, "big");
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit6(): number {
        return this.bit(6);
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit6le(): number {
        return this.bit(6, undefined, "little");
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit6be(): number {
        return this.bit(6, undefined, "big");
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit6(): number {
        return this.bit(6, true);
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit6le(): number {
        return this.bit(6, true, "little");
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit6be(): number {
        return this.bit(6, true, "big");
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit7(): number {
        return this.bit(7);
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit7le(): number {
        return this.bit(7, undefined, "little");
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit7be(): number {
        return this.bit(7, undefined, "big");
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit7(): number {
        return this.bit(7, true);
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit7le(): number {
        return this.bit(7, true, "little");
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit7be(): number {
        return this.bit(7, true, "big");
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit8(): number {
        return this.bit(8);
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit8le(): number {
        return this.bit(8, undefined, "little");
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit8be(): number {
        return this.bit(8, undefined, "big");
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit8(): number {
        return this.bit(8, true);
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit8le(): number {
        return this.bit(8, true, "little");
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit8be(): number {
        return this.bit(8, true, "big");
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit9(): number {
        return this.bit(9);
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit9le(): number {
        return this.bit(9, undefined, "little");
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit9be(): number {
        return this.bit(9, undefined, "big");
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit9(): number {
        return this.bit(9, true);
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit9le(): number {
        return this.bit(9, true, "little");
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit9be(): number {
        return this.bit(9, true, "big");
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit10(): number {
        return this.bit(10);
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit10le(): number {
        return this.bit(10, undefined, "little");
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit10be(): number {
        return this.bit(10, undefined, "big");
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit10(): number {
        return this.bit(10, true);
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit10le(): number {
        return this.bit(10, true, "little");
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit10be(): number {
        return this.bit(10, true, "big");
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit11(): number {
        return this.bit(11);
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit11le(): number {
        return this.bit(11, undefined, "little");
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit11be(): number {
        return this.bit(11, undefined, "big");
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit11(): number {
        return this.bit(11, true);
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit11le(): number {
        return this.bit(11, true, "little");
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit11be(): number {
        return this.bit(11, true, "big");
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit12(): number {
        return this.bit(12);
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit12le(): number {
        return this.bit(12, undefined, "little");
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit12be(): number {
        return this.bit(12, undefined, "big");
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit12(): number {
        return this.bit(12, true);
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit12le(): number {
        return this.bit(12, true, "little");
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit12be(): number {
        return this.bit(12, true, "big");
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit13(): number {
        return this.bit(13);
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit13le(): number {
        return this.bit(13, undefined, "little");
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit13be(): number {
        return this.bit(13, undefined, "big");
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit13(): number {
        return this.bit(13, true);
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit13le(): number {
        return this.bit(13, true, "little");
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit13be(): number {
        return this.bit(13, true, "big");
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit14(): number {
        return this.bit(14);
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit14le(): number {
        return this.bit(14, undefined, "little");
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit14be(): number {
        return this.bit(14, undefined, "big");
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit14(): number {
        return this.bit(14, true);
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit14le(): number {
        return this.bit(14, true, "little");
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit14be(): number {
        return this.bit(14, true, "big");
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit15(): number {
        return this.bit(15);
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit15le(): number {
        return this.bit(15, undefined, "little");
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit15be(): number {
        return this.bit(15, undefined, "big");
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit15(): number {
        return this.bit(15, true);
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit15le(): number {
        return this.bit(15, true, "little");
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit15be(): number {
        return this.bit(15, true, "big");
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit16(): number {
        return this.bit(16);
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit16le(): number {
        return this.bit(16, undefined, "little");
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit16be(): number {
        return this.bit(16, undefined, "big");
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit16(): number {
        return this.bit(16, true);
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit16le(): number {
        return this.bit(16, true, "little");
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit16be(): number {
        return this.bit(16, true, "big");
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit17(): number {
        return this.bit(17);
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit17le(): number {
        return this.bit(17, undefined, "little");
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit17be(): number {
        return this.bit(17, undefined, "big");
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit17(): number {
        return this.bit(17, true);
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit17le(): number {
        return this.bit(17, true, "little");
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit17be(): number {
        return this.bit(17, true, "big");
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit18(): number {
        return this.bit(18);
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit18le(): number {
        return this.bit(18, undefined, "little");
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit18be(): number {
        return this.bit(18, undefined, "big");
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit18(): number {
        return this.bit(18, true);
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit18le(): number {
        return this.bit(18, true, "little");
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit18be(): number {
        return this.bit(18, true, "big");
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit19(): number {
        return this.bit(19);
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit19le(): number {
        return this.bit(19, undefined, "little");
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit19be(): number {
        return this.bit(19, undefined, "big");
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit19(): number {
        return this.bit(19, true);
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit19le(): number {
        return this.bit(19, true, "little");
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit19be(): number {
        return this.bit(19, true, "big");
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit20(): number {
        return this.bit(20);
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit20le(): number {
        return this.bit(20, undefined, "little");
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit20be(): number {
        return this.bit(20, undefined, "big");
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit20(): number {
        return this.bit(20, true);
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit20le(): number {
        return this.bit(20, true, "little");
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit20be(): number {
        return this.bit(20, true, "big");
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit21(): number {
        return this.bit(21);
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit21le(): number {
        return this.bit(21, undefined, "little");
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit21be(): number {
        return this.bit(21, undefined, "big");
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit21(): number {
        return this.bit(21, true);
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit21le(): number {
        return this.bit(21, true, "little");
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit21be(): number {
        return this.bit(21, true, "big");
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit22(): number {
        return this.bit(22);
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit22le(): number {
        return this.bit(22, undefined, "little");
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit22be(): number {
        return this.bit(22, undefined, "big");
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit22(): number {
        return this.bit(22, true);
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit22le(): number {
        return this.bit(22, true, "little");
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit22be(): number {
        return this.bit(22, true, "big");
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit23(): number {
        return this.bit(23);
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit23le(): number {
        return this.bit(23, undefined, "little");
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit23be(): number {
        return this.bit(23, undefined, "big");
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit23(): number {
        return this.bit(23, true);
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit23le(): number {
        return this.bit(23, true, "little");
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit23be(): number {
        return this.bit(23, true, "big");
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit24(): number {
        return this.bit(24);
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit24le(): number {
        return this.bit(24, undefined, "little");
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit24be(): number {
        return this.bit(24, undefined, "big");
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit24(): number {
        return this.bit(24, true);
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit24le(): number {
        return this.bit(24, true, "little");
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit24be(): number {
        return this.bit(24, true, "big");
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit25(): number {
        return this.bit(25);
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit25le(): number {
        return this.bit(25, undefined, "little");
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit25be(): number {
        return this.bit(25, undefined, "big");
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit25(): number {
        return this.bit(25, true);
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit25le(): number {
        return this.bit(25, true, "little");
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit25be(): number {
        return this.bit(25, true, "big");
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit26(): number {
        return this.bit(26);
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit26le(): number {
        return this.bit(26, undefined, "little");
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit26be(): number {
        return this.bit(26, undefined, "big");
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit26(): number {
        return this.bit(26, true);
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit26le(): number {
        return this.bit(26, true, "little");
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit26be(): number {
        return this.bit(26, true, "big");
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit27(): number {
        return this.bit(27);
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit27le(): number {
        return this.bit(27, undefined, "little");
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit27be(): number {
        return this.bit(27, undefined, "big");
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit27(): number {
        return this.bit(27, true);
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit27le(): number {
        return this.bit(27, true, "little");
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit27be(): number {
        return this.bit(27, true, "big");
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit28(): number {
        return this.bit(28);
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit28le(): number {
        return this.bit(28, undefined, "little");
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit28be(): number {
        return this.bit(28, undefined, "big");
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit28(): number {
        return this.bit(28, true);
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit28le(): number {
        return this.bit(28, true, "little");
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit28be(): number {
        return this.bit(28, true, "big");
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit29(): number {
        return this.bit(29);
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit29le(): number {
        return this.bit(29, undefined, "little");
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit29be(): number {
        return this.bit(29, undefined, "big");
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit29(): number {
        return this.bit(29, true);
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit29le(): number {
        return this.bit(29, true, "little");
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit29be(): number {
        return this.bit(29, true, "big");
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit30(): number {
        return this.bit(30);
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit30le(): number {
        return this.bit(30, undefined, "little");
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit30be(): number {
        return this.bit(30, undefined, "big");
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit30(): number {
        return this.bit(30, true);
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit30le(): number {
        return this.bit(30, true, "little");
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit30be(): number {
        return this.bit(30, true, "big");
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit31(): number {
        return this.bit(31);
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit31le(): number {
        return this.bit(31, undefined, "little");
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit31be(): number {
        return this.bit(31, undefined, "big");
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit31(): number {
        return this.bit(31, true);
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit31le(): number {
        return this.bit(31, true, "little");
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit31be(): number {
        return this.bit(31, true, "big");
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit32(): number {
        return this.bit(32);
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit32le(): number {
        return this.bit(32, undefined, "little");
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get bit32be(): number {
        return this.bit(32, undefined, "big");
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit32(): number {
        return this.bit(32, true);
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit32le(): number {
        return this.bit(32, true, "little");
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {number}
     */
    get ubit32be(): number {
        return this.bit(32, true, "big");
    };

    //
    // byte read
    //

    /**
     * Read byte.
     * 
     * @returns {number}
     */
    get byte(): number {
        return this.readByte();
    };

    /**
     * Read byte.
     * 
     * @returns {number}
     */
    get int8(): number {
        return this.readByte();
    };

    /**
     * Read unsigned byte.
     * 
     * @returns {number}
     */
    get uint8(): number {
        return this.readByte(true);
    };

    /**
     * Read unsigned byte.
     * 
     * @returns {number}
     */
    get ubyte(): number {
        return this.readByte(true);
    };

    //
    //short16 read
    //

    /**
     * Read short.
     * 
     * @returns {number}
     */
    get int16(): number {
        return this.readInt16();
    };

    /**
     * Read short.
     * 
     * @returns {number}
     */
    get short(): number {
        return this.readInt16();
    };

    /**
     * Read short.
     * 
     * @returns {number}
     */
    get word(): number {
        return this.readInt16();
    };

    /**
     * Read unsigned short.
     * 
     * @returns {number}
     */
    get uint16(): number {
        return this.readInt16(true);
    };

    /**
     * Read unsigned short.
     * 
     * @returns {number}
     */
    get ushort(): number {
        return this.readInt16(true);
    };

    /**
     * Read unsigned short.
     * 
     * @returns {number}
     */
    get uword(): number {
        return this.readInt16(true);
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {number}
     */
    get uint16le(): number {
        return this.readInt16(true, "little");
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {number}
     */
    get ushortle(): number {
        return this.readInt16(true, "little");
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {number}
     */
    get uwordle(): number {
        return this.readInt16(true, "little");
    };

    /**
     * Read signed short in little endian.
     * 
     * @returns {number}
     */
    get int16le(): number {
        return this.readInt16(false, "little");
    };

    /**
     * Read signed short in little endian.
     * 
     * @returns {number}
     */
    get shortle(): number {
        return this.readInt16(false, "little");
    };

    /**
     * Read signed short in little endian.
     * 
     * @returns {number}
     */
    get wordle(): number {
        return this.readInt16(false, "little");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {number}
     */
    get uint16be(): number {
        return this.readInt16(true, "big");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {number}
     */
    get ushortbe(): number {
        return this.readInt16(true, "big");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {number}
     */
    get uwordbe(): number {
        return this.readInt16(true, "big");
    };

    /**
     * Read signed short in big endian.
     * 
     * @returns {number}
     */
    get int16be(): number {
        return this.readInt16(false, "big");
    };

    /**
     * Read signed short in big endian.
     * 
     * @returns {number}
     */
    get shortbe(): number {
        return this.readInt16(false, "big");
    };

    /**
     * Read signed short in big endian.
     * 
     * @returns {number}
     */
    get wordbe(): number {
        return this.readInt16(false, "big");
    };

    //
    //half float read
    //

    /**
     * Read half float.
     * 
     * @returns {number}
     */
    get halffloat(): number {
        return this.readHalfFloat();
    };

    /**
     * Read half float
     * 
     * @returns {number}
     */
    get half(): number {
        return this.readHalfFloat();
    };

    /**
     * Read half float.
     * 
     * @returns {number}
     */
    get halffloatbe(): number {
        return this.readHalfFloat("big");
    };

    /**
     * Read half float.
     * 
     * @returns {number}
     */
    get halfbe(): number {
        return this.readHalfFloat("big");
    };

    /**
     * Read half float.
     * 
     * @returns {number}
     */
    get halffloatle(): number {
        return this.readHalfFloat("little");
    };

    /**
     * Read half float.
     * 
     * @returns {number}
     */
    get halfle(): number {
        return this.readHalfFloat("little");
    };

    //
    //int read
    //

    /**
     * Read 32 bit integer.
     * 
     * @returns {number}
     */
    get int(): number {
        return this.readInt32();
    };

    /**
     * Read 32 bit integer.
     * 
     * @returns {number}
     */
    get double(): number {
        return this.readInt32();
    };

    /**
     * Read 32 bit integer.
     * 
     * @returns {number}
     */
    get int32(): number {
        return this.readInt32();
    };

    /**
     * Read 32 bit integer.
     * 
     * @returns {number}
     */
    get long(): number {
        return this.readInt32();
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    get uint(): number {
        return this.readInt32(true);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    get udouble(): number {
        return this.readInt32(true);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    get uint32(): number {
        return this.readInt32(true);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    get ulong(): number {
        return this.readInt32(true);
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get intbe(): number {
        return this.readInt32(false, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get doublebe(): number {
        return this.readInt32(false, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get int32be(): number {
        return this.readInt32(false, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get longbe(): number {
        return this.readInt32(false, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    get uintbe(): number {
        return this.readInt32(true, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    get udoublebe(): number {
        return this.readInt32(true, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    get uint32be(): number {
        return this.readInt32(true, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    get ulongbe(): number {
        return this.readInt32(true, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get intle(): number {
        return this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get doublele(): number {
        return this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get int32le(): number {
        return this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get longle(): number {
        return this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get uintle(): number {
        return this.readInt32(true, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get udoublele(): number {
        return this.readInt32(true, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get uint32le(): number {
        return this.readInt32(true, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    get ulongle(): number {
        return this.readInt32(true, "little");
    };

    //
    //float read
    //

    /**
     * Read float.
     * 
     * @returns {number}
     */
    get float(): number {
        return this.readFloat();
    };

    /**
     * Read float.
     * 
     * @returns {number}
     */
    get floatbe(): number {
        return this.readFloat("big");
    };

    /**
     * Read float.
     * 
     * @returns {number}
     */
    get floatle(): number {
        return this.readFloat("little");
    };

    //
    //int64 reader
    //

    /**
     * Read signed 64 bit integer
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get int64(): BigValue {
        return this.readInt64();
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get bigint(): BigValue {
        return this.readInt64();
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get quad(): BigValue {
        return this.readInt64();
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get uint64(): BigValue {
        return this.readInt64(true);
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get ubigint(): BigValue {
        return this.readInt64(true);
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get uquad(): BigValue {
        return this.readInt64(true);
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get int64be(): BigValue {
        return this.readInt64(false, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get bigintbe(): BigValue {
        return this.readInt64(false, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get quadbe(): BigValue {
        return this.readInt64(false, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get uint64be(): BigValue {
        return this.readInt64(true, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get ubigintbe(): BigValue {
        return this.readInt64(true, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get uquadbe(): BigValue {
        return this.readInt64(true, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get int64le(): BigValue {
        return this.readInt64(false, "little");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get bigintle(): BigValue {
        return this.readInt64(false, "little");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get quadle(): BigValue {
        return this.readInt64(false, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get uint64le(): BigValue {
        return this.readInt64(true, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get ubigintle(): BigValue {
        return this.readInt64(true, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {BigValue}
     */
    get uquadle(): BigValue {
        return this.readInt64(true, "little");
    };

    //
    //doublefloat reader
    //

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    get doublefloat(): number {
        return this.readDoubleFloat();
    };

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    get dfloat(): number {
        return this.readDoubleFloat();
    };

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    get dfloatbe(): number {
        return this.readDoubleFloat("big");
    };

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    get doublefloatbe(): number {
        return this.readDoubleFloat("big");
    };

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    get dfloatle(): number {
        return this.readDoubleFloat("little");
    };

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    get doublefloatle(): number {
        return this.readDoubleFloat("little");
    };

    //
    //string reader
    //

    /**
    * Reads string, use options object for different types.
    * 
    * @param {stringOptions} options 
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["stripNull"]?} options.stripNull - removes 0x00 characters
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types 
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    * @return {string}
    */
    string(options?: stringOptions): string {
        return this.readString(options);
    };

    /**
    * Reads string using setting from .strSettings
    * 
    * Default is ``utf-8``
    * 
    * @return {string}
    */
    get str(): string {
        return this.readString(this.strSettings);
    };

    /**
    * Reads UTF-8 (C) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
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
    * @return {string}
    */
    cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads ANSI string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
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
    * @return {string}
    */
    unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
    */
    pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
    */
    pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    pstring1le(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little" });
    };

    /**
    * Reads Pascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    pstring1be(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "big" });
    };

    /**
    * Reads Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
    */
    pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    pstring2le(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little" });
    };

    /**
    * Reads Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    pstring2be(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "big" });
    };

    /**
    * Reads Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
    */
    pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    pstring4le(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little" });
    };

    /**
    * Reads Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    pstring4be(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "big" });
    };

    /**
    * Reads Wide-Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
    */
    wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
    */
    wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
    */
    wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    wpstring2le(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    wpstring2be(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @return {string}
    */
    wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    wpstring4be(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @return {string}
    */
    wpstring4le(stripNull?: stringOptions["stripNull"]): string {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull });
    };
};