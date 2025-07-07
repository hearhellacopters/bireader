import { BigValue, BiOptions, endian, stringOptions } from "./common.js";
import { BiBase } from './core/BiBase.js';

/**
 * Binary writer, includes bitfields and strings.
 *
 * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiWriter.data``
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 * 
 * @since 2.0
 */
export class BiWriter extends BiBase {

    /**
     * Binary writer, includes bitfields and strings.
     *
     * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiWriter.data``
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     */
    constructor(data?: Buffer | Uint8Array, options: BiOptions = {}) {
        super();
        this.strict = false;
        if (data == undefined) {
            if (typeof Buffer !== 'undefined') {
                this.data = Buffer.alloc(this.offset || 1 + (this.bitoffset != 0 ? 1 : 0));
            } else {
                this.data = new Uint8Array(this.offset || 1 + (this.bitoffset != 0 ? 1 : 0));
            }
        } else {
            if (!this.isBufferOrUint8Array(data)) {
                throw new Error("Write data must be Uint8Array or Buffer.");
            }
            this.data = data;
        }

        this.enforceBigInt = options?.enforceBigInt ?? false;

        if (options.extendBufferSize != undefined && options.extendBufferSize != 0) {
            this.extendBufferSize = options.extendBufferSize;
        }

        this.size = this.data.length;
        this.sizeB = this.data.length * 8;

        if (typeof options.strict == "boolean") {
            this.strict = options.strict;
        } else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true of false.");
            }
        }

        if (options.endianness != undefined && typeof options.endianness != "string") {
            throw new Error("endianness must be big or little.");
        }
        if (options.endianness != undefined && !(options.endianness == "big" || options.endianness == "little")) {
            throw new Error("Endianness must be big or little.");
        }

        this.endian = options.endianness || "little";

        if (options.byteOffset != undefined || options.bitOffset != undefined) {
            this.offset = ((Math.abs(options.byteOffset || 0)) + Math.ceil((Math.abs(options.bitOffset || 0)) / 8))
            // Adjust byte offset based on bit overflow
            this.offset += Math.floor((Math.abs(options.bitOffset || 0)) / 8);
            // Adjust bit offset
            this.bitoffset = (Math.abs(options.bitOffset || 0) + 64) % 8;
            // Ensure bit offset stays between 0-7
            this.bitoffset = Math.min(Math.max(this.bitoffset, 0), 7);
            // Ensure offset doesn't go negative
            this.offset = Math.max(this.offset, 0);
            if (this.offset > this.size) {
                if (this.strict == false) {
                    if (this.extendBufferSize != 0) {
                        this.extendArray(this.extendBufferSize);
                    }
                    else {
                        this.extendArray(this.offset - this.size);
                    }
                } else {
                    throw new Error(`Starting offset outside of size: ${this.offset} of ${this.size}`);
                }
            }
        }
    };

    //
    // Bit Aliases
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

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit1(value: number) {
        this.bit(value, 1);
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit1le(value: number) {
        this.bit(value, 1, undefined, "little");
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit1be(value: number) {
        this.bit(value, 1, undefined, "big");
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit1(value: number) {
        this.bit(value, 1, true);
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit1le(value: number) {
        this.bit(value, 1, true, "little");;
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit1be(value: number) {
        this.bit(value, 1, true, "big");
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit2(value: number) {
        this.bit(value, 2);
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit2le(value: number) {
        this.bit(value, 2, undefined, "little");
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit2be(value: number) {
        this.bit(value, 2, undefined, "big");
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit2(value: number) {
        this.bit(value, 2, true);
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit2le(value: number) {
        this.bit(value, 2, true, "little");;
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit2be(value: number) {
        this.bit(value, 2, true, "big");
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit3(value: number) {
        this.bit(value, 3);
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit3le(value: number) {
        this.bit(value, 3, undefined, "little");
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit3be(value: number) {
        this.bit(value, 3, undefined, "big");
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit3(value: number) {
        this.bit(value, 3, true);
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit3le(value: number) {
        this.bit(value, 3, true, "little");;
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit3be(value: number) {
        this.bit(value, 3, true, "big");
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit4(value: number) {
        this.bit(value, 4);
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit4le(value: number) {
        this.bit(value, 4, undefined, "little");
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit4be(value: number) {
        this.bit(value, 4, undefined, "big");
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit4(value: number) {
        this.bit(value, 4, true);
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit4le(value: number) {
        this.bit(value, 4, true, "little");;
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit4be(value: number) {
        this.bit(value, 4, true, "big");
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit5(value: number) {
        this.bit(value, 5);
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit5le(value: number) {
        this.bit(value, 5, undefined, "little");
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit5be(value: number) {
        this.bit(value, 5, undefined, "big");
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit5(value: number) {
        this.bit(value, 5, true);
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit5le(value: number) {
        this.bit(value, 5, true, "little");;
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit5be(value: number) {
        this.bit(value, 5, true, "big");
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit6(value: number) {
        this.bit(value, 6);
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit6le(value: number) {
        this.bit(value, 6, undefined, "little");
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit6be(value: number) {
        this.bit(value, 6, undefined, "big");
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit6(value: number) {
        this.bit(value, 6, true);
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit6le(value: number) {
        this.bit(value, 6, true, "little");;
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit6be(value: number) {
        this.bit(value, 6, true, "big");
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit7(value: number) {
        this.bit(value, 7);
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit7le(value: number) {
        this.bit(value, 7, undefined, "little");
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit7be(value: number) {
        this.bit(value, 7, undefined, "big");
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit7(value: number) {
        this.bit(value, 7, true);
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit7le(value: number) {
        this.bit(value, 7, true, "little");;
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit7be(value: number) {
        this.bit(value, 7, true, "big");
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit8(value: number) {
        this.bit(value, 8);
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit8le(value: number) {
        this.bit(value, 8, undefined, "little");
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit8be(value: number) {
        this.bit(value, 8, undefined, "big");
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit8(value: number) {
        this.bit(value, 8, true);
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit8le(value: number) {
        this.bit(value, 8, true, "little");;
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit8be(value: number) {
        this.bit(value, 8, true, "big");
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit9(value: number) {
        this.bit(value, 9);
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit9le(value: number) {
        this.bit(value, 9, undefined, "little");
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit9be(value: number) {
        this.bit(value, 9, undefined, "big");
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit9(value: number) {
        this.bit(value, 9, true);
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit9le(value: number) {
        this.bit(value, 9, true, "little");;
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit9be(value: number) {
        this.bit(value, 9, true, "big");
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit10(value: number) {
        this.bit(value, 10);
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit10le(value: number) {
        this.bit(value, 10, undefined, "little");
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit10be(value: number) {
        this.bit(value, 10, undefined, "big");
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit10(value: number) {
        this.bit(value, 10, true);
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit10le(value: number) {
        this.bit(value, 10, true, "little");;
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit10be(value: number) {
        this.bit(value, 10, true, "big");
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit11(value: number) {
        this.bit(value, 11);
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit11le(value: number) {
        this.bit(value, 11, undefined, "little");
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit11be(value: number) {
        this.bit(value, 11, undefined, "big");
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit11(value: number) {
        this.bit(value, 11, true);
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit11le(value: number) {
        this.bit(value, 11, true, "little");;
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit11be(value: number) {
        this.bit(value, 11, true, "big");
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit12(value: number) {
        this.bit(value, 12);
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit12le(value: number) {
        this.bit(value, 12, undefined, "little");
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit12be(value: number) {
        this.bit(value, 12, undefined, "big");
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit12(value: number) {
        this.bit(value, 12, true);
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit12le(value: number) {
        this.bit(value, 12, true, "little");;
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit12be(value: number) {
        this.bit(value, 12, true, "big");
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit13(value: number) {
        this.bit(value, 13);
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit13le(value: number) {
        this.bit(value, 13, undefined, "little");
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit13be(value: number) {
        this.bit(value, 13, undefined, "big");
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit13(value: number) {
        this.bit(value, 13, true);
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit13le(value: number) {
        this.bit(value, 13, true, "little");;
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit13be(value: number) {
        this.bit(value, 13, true, "big");
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit14(value: number) {
        this.bit(value, 14);
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit14le(value: number) {
        this.bit(value, 14, undefined, "little");
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit14be(value: number) {
        this.bit(value, 14, undefined, "big");
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit14(value: number) {
        this.bit(value, 14, true);
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit14le(value: number) {
        this.bit(value, 14, true, "little");;
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit14be(value: number) {
        this.bit(value, 14, true, "big");
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit15(value: number) {
        this.bit(value, 15);
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit15le(value: number) {
        this.bit(value, 15, undefined, "little");
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit15be(value: number) {
        this.bit(value, 15, undefined, "big");
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit15(value: number) {
        this.bit(value, 15, true);
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit15le(value: number) {
        this.bit(value, 15, true, "little");;
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit15be(value: number) {
        this.bit(value, 15, true, "big");
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit16(value: number) {
        this.bit(value, 16);
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit16le(value: number) {
        this.bit(value, 16, undefined, "little");
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit16be(value: number) {
        this.bit(value, 16, undefined, "big");
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit16(value: number) {
        this.bit(value, 16, true);
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit16le(value: number) {
        this.bit(value, 16, true, "little");;
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit16be(value: number) {
        this.bit(value, 16, true, "big");
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit17(value: number) {
        this.bit(value, 17);
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit17le(value: number) {
        this.bit(value, 17, undefined, "little");
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit17be(value: number) {
        this.bit(value, 17, undefined, "big");
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit17(value: number) {
        this.bit(value, 17, true);
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit17le(value: number) {
        this.bit(value, 17, true, "little");;
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit17be(value: number) {
        this.bit(value, 17, true, "big");
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit18(value: number) {
        this.bit(value, 18);
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit18le(value: number) {
        this.bit(value, 18, undefined, "little");
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit18be(value: number) {
        this.bit(value, 18, undefined, "big");
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit18(value: number) {
        this.bit(value, 18, true);
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit18le(value: number) {
        this.bit(value, 18, true, "little");;
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit18be(value: number) {
        this.bit(value, 18, true, "big");
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit19(value: number) {
        this.bit(value, 19);
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit19le(value: number) {
        this.bit(value, 19, undefined, "little");
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit19be(value: number) {
        this.bit(value, 19, undefined, "big");
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit19(value: number) {
        this.bit(value, 19, true);
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit19le(value: number) {
        this.bit(value, 19, true, "little");;
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit19be(value: number) {
        this.bit(value, 19, true, "big");
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit20(value: number) {
        this.bit(value, 20);
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit20le(value: number) {
        this.bit(value, 20, undefined, "little");
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit20be(value: number) {
        this.bit(value, 20, undefined, "big");
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit20(value: number) {
        this.bit(value, 20, true);
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit20le(value: number) {
        this.bit(value, 20, true, "little");;
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit20be(value: number) {
        this.bit(value, 20, true, "big");
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit21(value: number) {
        this.bit(value, 21);
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit21le(value: number) {
        this.bit(value, 21, undefined, "little");
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit21be(value: number) {
        this.bit(value, 21, undefined, "big");
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit21(value: number) {
        this.bit(value, 21, true);
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit21le(value: number) {
        this.bit(value, 21, true, "little");;
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit21be(value: number) {
        this.bit(value, 21, true, "big");
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit22(value: number) {
        this.bit(value, 22);
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit22le(value: number) {
        this.bit(value, 22, undefined, "little");
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit22be(value: number) {
        this.bit(value, 22, undefined, "big");
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit22(value: number) {
        this.bit(value, 22, true);
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit22le(value: number) {
        this.bit(value, 22, true, "little");;
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit22be(value: number) {
        this.bit(value, 22, true, "big");
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit23(value: number) {
        this.bit(value, 23);
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit23le(value: number) {
        this.bit(value, 23, undefined, "little");
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit23be(value: number) {
        this.bit(value, 23, undefined, "big");
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit23(value: number) {
        this.bit(value, 23, true);
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit23le(value: number) {
        this.bit(value, 23, true, "little");;
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit23be(value: number) {
        this.bit(value, 23, true, "big");
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit24(value: number) {
        this.bit(value, 24);
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit24le(value: number) {
        this.bit(value, 24, undefined, "little");
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit24be(value: number) {
        this.bit(value, 24, undefined, "big");
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit24(value: number) {
        this.bit(value, 24, true);
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit24le(value: number) {
        this.bit(value, 24, true, "little");;
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit24be(value: number) {
        this.bit(value, 24, true, "big");
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit25(value: number) {
        this.bit(value, 25);
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit25le(value: number) {
        this.bit(value, 25, undefined, "little");
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit25be(value: number) {
        this.bit(value, 25, undefined, "big");
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit25(value: number) {
        this.bit(value, 25, true);
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit25le(value: number) {
        this.bit(value, 25, true, "little");;
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit25be(value: number) {
        this.bit(value, 25, true, "big");
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit26(value: number) {
        this.bit(value, 26);
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit26le(value: number) {
        this.bit(value, 26, undefined, "little");
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit26be(value: number) {
        this.bit(value, 26, undefined, "big");
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit26(value: number) {
        this.bit(value, 26, true);
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit26le(value: number) {
        this.bit(value, 26, true, "little");;
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit26be(value: number) {
        this.bit(value, 26, true, "big");
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit27(value: number) {
        this.bit(value, 27);
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit27le(value: number) {
        this.bit(value, 27, undefined, "little");
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit27be(value: number) {
        this.bit(value, 27, undefined, "big");
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit27(value: number) {
        this.bit(value, 27, true);
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit27le(value: number) {
        this.bit(value, 27, true, "little");;
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit27be(value: number) {
        this.bit(value, 27, true, "big");
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit28(value: number) {
        this.bit(value, 28);
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit28le(value: number) {
        this.bit(value, 28, undefined, "little");
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit28be(value: number) {
        this.bit(value, 28, undefined, "big");
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit28(value: number) {
        this.bit(value, 28, true);
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit28le(value: number) {
        this.bit(value, 28, true, "little");;
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit28be(value: number) {
        this.bit(value, 28, true, "big");
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit29(value: number) {
        this.bit(value, 29);
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit29le(value: number) {
        this.bit(value, 29, undefined, "little");
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit29be(value: number) {
        this.bit(value, 29, undefined, "big");
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit29(value: number) {
        this.bit(value, 29, true);
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit29le(value: number) {
        this.bit(value, 29, true, "little");;
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit29be(value: number) {
        this.bit(value, 29, true, "big");
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit30(value: number) {
        this.bit(value, 30);
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit30le(value: number) {
        this.bit(value, 30, undefined, "little");
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit30be(value: number) {
        this.bit(value, 30, undefined, "big");
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit30(value: number) {
        this.bit(value, 30, true);
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit30le(value: number) {
        this.bit(value, 30, true, "little");;
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit30be(value: number) {
        this.bit(value, 30, true, "big");
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit31(value: number) {
        this.bit(value, 31);
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit31le(value: number) {
        this.bit(value, 31, undefined, "little");
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit31be(value: number) {
        this.bit(value, 31, undefined, "big");
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit31(value: number) {
        this.bit(value, 31, true);
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit31le(value: number) {
        this.bit(value, 31, true, "little");;
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit31be(value: number) {
        this.bit(value, 31, true, "big");
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit32(value: number) {
        this.bit(value, 32);
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit32le(value: number) {
        this.bit(value, 32, undefined, "little");
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set bit32be(value: number) {
        this.bit(value, 32, undefined, "big");
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit32(value: number) {
        this.bit(value, 32, true);
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit32le(value: number) {
        this.bit(value, 32, true, "little");;
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    set ubit32be(value: number) {
        this.bit(value, 32, true, "big");
    };

    //
    // byte write
    //

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     */
    set byte(value: number) {
        this.writeByte(value);
    };

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     */
    set int8(value: number) {
        this.writeByte(value);
    };

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    set uint8(value: number) {
        this.writeByte(value, true);
    };

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    set ubyte(value: number) {
        this.writeByte(value, true);
    };

    //
    // short writes
    //

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     */
    set int16(value: number) {
        this.writeInt16(value);
    };

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     */
    set short(value: number) {
        this.writeInt16(value);
    };

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     */
    set word(value: number) {
        this.writeInt16(value);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set uint16(value: number) {
        this.writeInt16(value, true);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set ushort(value: number) {
        this.writeInt16(value, true);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set uword(value: number) {
        this.writeInt16(value, true);
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    set int16be(value: number) {
        this.writeInt16(value, false, "big");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    set shortbe(value: number) {
        this.writeInt16(value, false, "big");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    set wordbe(value: number) {
        this.writeInt16(value, false, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set uint16be(value: number) {
        this.writeInt16(value, true, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set ushortbe(value: number) {
        this.writeInt16(value, true, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set uwordbe(value: number) {
        this.writeInt16(value, true, "big");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    set int16le(value: number) {
        this.writeInt16(value, false, "little");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    set shortle(value: number) {
        this.writeInt16(value, false, "little");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    set wordle(value: number) {
        this.writeInt16(value, false, "little");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set uint16le(value: number) {
        this.writeInt16(value, true, "little");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set ushortle(value: number) {
        this.writeInt16(value, true, "little");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    set uwordle(value: number) {
        this.writeInt16(value, true, "little");
    };

    //
    // half float
    //

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    set half(value: number) {
        this.writeHalfFloat(value);
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    set halffloat(value: number) {
        this.writeHalfFloat(value);
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    set halffloatbe(value: number) {
        this.writeHalfFloat(value, "big");
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    set halfbe(value: number) {
        this.writeHalfFloat(value, "big");
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    set halffloatle(value: number) {
        this.writeHalfFloat(value, "little");
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    set halfle(value: number) {
        this.writeHalfFloat(value, "little");
    };

    //
    // int32 write
    //

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     */
    set int(value: number) {
        this.writeInt32(value);
    };

    /**
    * Write int32.
    *
    * @param {number} value - value as int 
    */
    set int32(value: number) {
        this.writeInt32(value);
    };

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     */
    set double(value: number) {
        this.writeInt32(value);
    };

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     */
    set long(value: number) {
        this.writeInt32(value);
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set uint32(value: number) {
        this.writeInt32(value, true);
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set uint(value: number) {
        this.writeInt32(value, true);
    };

    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int 
    */
    set udouble(value: number) {
        this.writeInt32(value, true);
    };

    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int 
    */
    set ulong(value: number) {
        this.writeInt32(value, true);
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    set int32le(value: number) {
        this.writeInt32(value, false, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    set intle(value: number) {
        this.writeInt32(value, false, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    set doublele(value: number) {
        this.writeInt32(value, false, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    set longle(value: number) {
        this.writeInt32(value, false, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set uint32le(value: number) {
        this.writeInt32(value, true, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set uintle(value: number) {
        this.writeInt32(value, true, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set udoublele(value: number) {
        this.writeInt32(value, true, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set ulongle(value: number) {
        this.writeInt32(value, true, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    set intbe(value: number) {
        this.writeInt32(value, false, "big");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    set int32be(value: number) {
        this.writeInt32(value, false, "big");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    set doublebe(value: number) {
        this.writeInt32(value, false, "big");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    set longbe(value: number) {
        this.writeInt32(value, false, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set writeUInt32BE(value: number) {
        this.writeInt32(value, true, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set uint32be(value: number) {
        this.writeInt32(value, true, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set uintbe(value: number) {
        this.writeInt32(value, true, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    set udoublebe(value: number) {
        this.writeInt32(value, true, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongbe(value: number) {
        this.writeInt32(value, true, "big");
    };

    //
    // float write
    //

    /**
    * Write float.
    * 
    * @param {number} value - value as int 
    */
    set float(value: number) {
        this.writeFloat(value);
    };

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     */
    set floatle(value: number) {
        this.writeFloat(value, "little");
    };

    /**
    * Write float.
    * 
    * @param {number} value - value as int 
    */
    set floatbe(value: number) {
        this.writeFloat(value, "big");
    };

    //
    // int64 write
    //

    /**
     * Write 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set int64(value: BigValue) {
        this.writeInt64(value);
    };

    /**
    * Write 64 bit integer.
    * 
    * @param {BigValue} value - value as int 
    */
    set quad(value: BigValue) {
        this.writeInt64(value);
    };

    /**
     * Write 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set bigint(value: BigValue) {
        this.writeInt64(value);
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set uint64(value: BigValue) {
        this.writeInt64(value, true);
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set ubigint(value: BigValue) {
        this.writeInt64(value, true);
    };

    /**
    * Write unsigned 64 bit integer.
    * 
    * @param {BigValue} value - value as int 
    */
    set uquad(value: BigValue) {
        this.writeInt64(value, true,);
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set int64le(value: BigValue) {
        this.writeInt64(value, false, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set bigintle(value: BigValue) {
        this.writeInt64(value, false, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set quadle(value: BigValue) {
        this.writeInt64(value, false, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set uint64le(value: BigValue) {
        this.writeInt64(value, true, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set ubigintle(value: BigValue) {
        this.writeInt64(value, true, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set uquadle(value: BigValue) {
        this.writeInt64(value, true, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set int64be(value: BigValue) {
        this.writeInt64(value, false, "big");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set bigintbe(value: BigValue) {
        this.writeInt64(value, false, "big");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set quadbe(value: BigValue) {
        this.writeInt64(value, false, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set uint64be(value: BigValue) {
        this.writeInt64(value, true, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set ubigintbe(value: BigValue) {
        this.writeInt64(value, true, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    set uquadbe(value: BigValue) {
        this.writeInt64(value, true, "big");
    };

    //
    // doublefloat
    //

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    set doublefloat(value: number) {
        this.writeDoubleFloat(value);
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    set dfloat(value: number) {
        this.writeDoubleFloat(value);
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    set dfloatbe(value: number) {
        this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    set doublefloatbe(value: number) {
        this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    set dfloatle(value: number) {
        this.writeDoubleFloat(value, "little");
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    set doublefloatle(value: number) {
        this.writeDoubleFloat(value, "little");
    };

    //
    // string
    //

    /**
    * Writes string, use options object for different types.
    * 
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types 
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    */
    string(string: string, options?: stringOptions): void {
        return this.writeString(string, options);
    };

    /**
    * Writes string using setting from .strSettings
    * 
    * Default is ``utf-8``
    * 
    * @param {string} string - text string
    */
    set str(string: string) {
        this.writeString(string, this.strSettings);
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
        return this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
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
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    };

    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    };

    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    };

    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    };

    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
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
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian });
    };

    /**
    * Writes Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    pstring1le(string: string): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little" });
    };

    /**
    * Writes Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    pstring1be(string: string): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big" });
    };

    /**
    * Writes Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring2(string: string, endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: endian });
    };

    /**
    * Writes Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    pstring2le(string: string): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little" });
    };

    /**
    * Writes Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    pstring2be(string: string): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big" });
    };

    /**
    * Writes Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring4(string: string, endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian });
    };

    /**
    * Writes Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    pstring4be(string: string): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big" });
    };

    /**
    * Writes Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    pstring4le(string: string): void {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Wide-Pascal string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big" });
    };

    /**
    * Writes Wide-Pascal string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring1(string: string, endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian });
    };

    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    wpstring1be(string: string): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big" });
    };

    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    wpstring1le(string: string): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring2(string: string, endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian });
    };

    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    wpstring2le(string: string): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    wpstring2be(string: string): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big" });
    };

    /**
    * Writes Wide-Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring4(string: string, endian?: stringOptions["endian"]): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian });
    };

    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    wpstring4le(string: string): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    wpstring4be(string: string): void {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big" });
    };
};