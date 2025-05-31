"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiWriter = void 0;
const common_1 = require("./common");
/**
 * Binary writer, includes bitfields and strings.
 *
 * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiWriter.data``
 * @param {BiOptions?} options - Any options to set at start
 * @param {number?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {number?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {string?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {boolean?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {number?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 *
 * @since 2.0
 */
class BiWriter extends common_1.ReaderBase {
    /**
     * Binary writer, includes bitfields and strings.
     *
     * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiWriter.data``
     * @param {BiOptions?} options - Any options to set at start
     * @param {number?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {number?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {string?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {boolean?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {number?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     */
    constructor(data, options = {}) {
        super();
        this.strict = false;
        if (data == undefined) {
            if (typeof Buffer !== 'undefined') {
                this.data = Buffer.alloc(this.offset || 1 + (this.bitoffset != 0 ? 1 : 0));
            }
            else {
                this.data = new Uint8Array(this.offset || 1 + (this.bitoffset != 0 ? 1 : 0));
            }
        }
        else {
            if (!this.isBufferOrUint8Array(data)) {
                throw new Error("Write data must be Uint8Array or Buffer.");
            }
            this.data = data;
        }
        if (options.extendBufferSize != undefined && options.extendBufferSize != 0) {
            this.extendBufferSize = options.extendBufferSize;
        }
        this.size = this.data.length;
        this.sizeB = this.data.length * 8;
        if (typeof options.strict == "boolean") {
            this.strict = options.strict;
        }
        else {
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
            this.offset = ((Math.abs(options.byteOffset || 0)) + Math.ceil((Math.abs(options.bitOffset || 0)) / 8));
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
                }
                else {
                    throw new Error(`Starting offset outside of size: ${this.offset} of ${this.size}`);
                }
            }
        }
    }
    //
    //bit writer
    //
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    bit(value, bits, unsigned, endian) {
        return this.writeBit(value, bits, unsigned, endian);
    }
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(value, bits, endian) {
        return this.writeBit(value, bits, true, endian);
    }
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
    bitbe(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "big");
    }
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitbe(value, bits) {
        return this.bit(value, bits, true, "big");
    }
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitle(value, bits) {
        return this.bit(value, bits, true, "little");
    }
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
    bitle(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "little");
    }
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1(value) {
        this.bit(value, 1);
    }
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1le(value) {
        this.bit(value, 1, undefined, "little");
    }
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1be(value) {
        this.bit(value, 1, undefined, "big");
    }
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1(value) {
        this.bit(value, 1, true);
    }
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1le(value) {
        this.bit(value, 1, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1be(value) {
        this.bit(value, 1, true, "big");
    }
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2(value) {
        this.bit(value, 2);
    }
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2le(value) {
        this.bit(value, 2, undefined, "little");
    }
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2be(value) {
        this.bit(value, 2, undefined, "big");
    }
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2(value) {
        this.bit(value, 2, true);
    }
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2le(value) {
        this.bit(value, 2, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2be(value) {
        this.bit(value, 2, true, "big");
    }
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3(value) {
        this.bit(value, 3);
    }
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3le(value) {
        this.bit(value, 3, undefined, "little");
    }
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3be(value) {
        this.bit(value, 3, undefined, "big");
    }
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3(value) {
        this.bit(value, 3, true);
    }
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3le(value) {
        this.bit(value, 3, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3be(value) {
        this.bit(value, 3, true, "big");
    }
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4(value) {
        this.bit(value, 4);
    }
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4le(value) {
        this.bit(value, 4, undefined, "little");
    }
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4be(value) {
        this.bit(value, 4, undefined, "big");
    }
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4(value) {
        this.bit(value, 4, true);
    }
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4le(value) {
        this.bit(value, 4, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4be(value) {
        this.bit(value, 4, true, "big");
    }
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5(value) {
        this.bit(value, 5);
    }
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5le(value) {
        this.bit(value, 5, undefined, "little");
    }
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5be(value) {
        this.bit(value, 5, undefined, "big");
    }
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5(value) {
        this.bit(value, 5, true);
    }
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5le(value) {
        this.bit(value, 5, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5be(value) {
        this.bit(value, 5, true, "big");
    }
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6(value) {
        this.bit(value, 6);
    }
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6le(value) {
        this.bit(value, 6, undefined, "little");
    }
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6be(value) {
        this.bit(value, 6, undefined, "big");
    }
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6(value) {
        this.bit(value, 6, true);
    }
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6le(value) {
        this.bit(value, 6, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6be(value) {
        this.bit(value, 6, true, "big");
    }
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7(value) {
        this.bit(value, 7);
    }
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7le(value) {
        this.bit(value, 7, undefined, "little");
    }
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7be(value) {
        this.bit(value, 7, undefined, "big");
    }
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7(value) {
        this.bit(value, 7, true);
    }
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7le(value) {
        this.bit(value, 7, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7be(value) {
        this.bit(value, 7, true, "big");
    }
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8(value) {
        this.bit(value, 8);
    }
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8le(value) {
        this.bit(value, 8, undefined, "little");
    }
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8be(value) {
        this.bit(value, 8, undefined, "big");
    }
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8(value) {
        this.bit(value, 8, true);
    }
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8le(value) {
        this.bit(value, 8, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8be(value) {
        this.bit(value, 8, true, "big");
    }
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9(value) {
        this.bit(value, 9);
    }
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9le(value) {
        this.bit(value, 9, undefined, "little");
    }
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9be(value) {
        this.bit(value, 9, undefined, "big");
    }
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9(value) {
        this.bit(value, 9, true);
    }
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9le(value) {
        this.bit(value, 9, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9be(value) {
        this.bit(value, 9, true, "big");
    }
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10(value) {
        this.bit(value, 10);
    }
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10le(value) {
        this.bit(value, 10, undefined, "little");
    }
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10be(value) {
        this.bit(value, 10, undefined, "big");
    }
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10(value) {
        this.bit(value, 10, true);
    }
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10le(value) {
        this.bit(value, 10, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10be(value) {
        this.bit(value, 10, true, "big");
    }
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11(value) {
        this.bit(value, 11);
    }
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11le(value) {
        this.bit(value, 11, undefined, "little");
    }
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11be(value) {
        this.bit(value, 11, undefined, "big");
    }
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11(value) {
        this.bit(value, 11, true);
    }
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11le(value) {
        this.bit(value, 11, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11be(value) {
        this.bit(value, 11, true, "big");
    }
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12(value) {
        this.bit(value, 12);
    }
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12le(value) {
        this.bit(value, 12, undefined, "little");
    }
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12be(value) {
        this.bit(value, 12, undefined, "big");
    }
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12(value) {
        this.bit(value, 12, true);
    }
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12le(value) {
        this.bit(value, 12, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12be(value) {
        this.bit(value, 12, true, "big");
    }
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13(value) {
        this.bit(value, 13);
    }
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13le(value) {
        this.bit(value, 13, undefined, "little");
    }
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13be(value) {
        this.bit(value, 13, undefined, "big");
    }
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13(value) {
        this.bit(value, 13, true);
    }
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13le(value) {
        this.bit(value, 13, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13be(value) {
        this.bit(value, 13, true, "big");
    }
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14(value) {
        this.bit(value, 14);
    }
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14le(value) {
        this.bit(value, 14, undefined, "little");
    }
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14be(value) {
        this.bit(value, 14, undefined, "big");
    }
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14(value) {
        this.bit(value, 14, true);
    }
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14le(value) {
        this.bit(value, 14, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14be(value) {
        this.bit(value, 14, true, "big");
    }
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15(value) {
        this.bit(value, 15);
    }
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15le(value) {
        this.bit(value, 15, undefined, "little");
    }
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15be(value) {
        this.bit(value, 15, undefined, "big");
    }
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15(value) {
        this.bit(value, 15, true);
    }
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15le(value) {
        this.bit(value, 15, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15be(value) {
        this.bit(value, 15, true, "big");
    }
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16(value) {
        this.bit(value, 16);
    }
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16le(value) {
        this.bit(value, 16, undefined, "little");
    }
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16be(value) {
        this.bit(value, 16, undefined, "big");
    }
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16(value) {
        this.bit(value, 16, true);
    }
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16le(value) {
        this.bit(value, 16, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16be(value) {
        this.bit(value, 16, true, "big");
    }
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17(value) {
        this.bit(value, 17);
    }
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17le(value) {
        this.bit(value, 17, undefined, "little");
    }
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17be(value) {
        this.bit(value, 17, undefined, "big");
    }
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17(value) {
        this.bit(value, 17, true);
    }
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17le(value) {
        this.bit(value, 17, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17be(value) {
        this.bit(value, 17, true, "big");
    }
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18(value) {
        this.bit(value, 18);
    }
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18le(value) {
        this.bit(value, 18, undefined, "little");
    }
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18be(value) {
        this.bit(value, 18, undefined, "big");
    }
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18(value) {
        this.bit(value, 18, true);
    }
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18le(value) {
        this.bit(value, 18, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18be(value) {
        this.bit(value, 18, true, "big");
    }
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19(value) {
        this.bit(value, 19);
    }
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19le(value) {
        this.bit(value, 19, undefined, "little");
    }
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19be(value) {
        this.bit(value, 19, undefined, "big");
    }
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19(value) {
        this.bit(value, 19, true);
    }
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19le(value) {
        this.bit(value, 19, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19be(value) {
        this.bit(value, 19, true, "big");
    }
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20(value) {
        this.bit(value, 20);
    }
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20le(value) {
        this.bit(value, 20, undefined, "little");
    }
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20be(value) {
        this.bit(value, 20, undefined, "big");
    }
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20(value) {
        this.bit(value, 20, true);
    }
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20le(value) {
        this.bit(value, 20, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20be(value) {
        this.bit(value, 20, true, "big");
    }
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21(value) {
        this.bit(value, 21);
    }
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21le(value) {
        this.bit(value, 21, undefined, "little");
    }
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21be(value) {
        this.bit(value, 21, undefined, "big");
    }
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21(value) {
        this.bit(value, 21, true);
    }
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21le(value) {
        this.bit(value, 21, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21be(value) {
        this.bit(value, 21, true, "big");
    }
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22(value) {
        this.bit(value, 22);
    }
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22le(value) {
        this.bit(value, 22, undefined, "little");
    }
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22be(value) {
        this.bit(value, 22, undefined, "big");
    }
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22(value) {
        this.bit(value, 22, true);
    }
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22le(value) {
        this.bit(value, 22, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22be(value) {
        this.bit(value, 22, true, "big");
    }
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23(value) {
        this.bit(value, 23);
    }
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23le(value) {
        this.bit(value, 23, undefined, "little");
    }
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23be(value) {
        this.bit(value, 23, undefined, "big");
    }
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23(value) {
        this.bit(value, 23, true);
    }
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23le(value) {
        this.bit(value, 23, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23be(value) {
        this.bit(value, 23, true, "big");
    }
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24(value) {
        this.bit(value, 24);
    }
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24le(value) {
        this.bit(value, 24, undefined, "little");
    }
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24be(value) {
        this.bit(value, 24, undefined, "big");
    }
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24(value) {
        this.bit(value, 24, true);
    }
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24le(value) {
        this.bit(value, 24, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24be(value) {
        this.bit(value, 24, true, "big");
    }
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25(value) {
        this.bit(value, 25);
    }
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25le(value) {
        this.bit(value, 25, undefined, "little");
    }
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25be(value) {
        this.bit(value, 25, undefined, "big");
    }
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25(value) {
        this.bit(value, 25, true);
    }
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25le(value) {
        this.bit(value, 25, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25be(value) {
        this.bit(value, 25, true, "big");
    }
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26(value) {
        this.bit(value, 26);
    }
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26le(value) {
        this.bit(value, 26, undefined, "little");
    }
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26be(value) {
        this.bit(value, 26, undefined, "big");
    }
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26(value) {
        this.bit(value, 26, true);
    }
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26le(value) {
        this.bit(value, 26, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26be(value) {
        this.bit(value, 26, true, "big");
    }
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27(value) {
        this.bit(value, 27);
    }
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27le(value) {
        this.bit(value, 27, undefined, "little");
    }
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27be(value) {
        this.bit(value, 27, undefined, "big");
    }
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27(value) {
        this.bit(value, 27, true);
    }
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27le(value) {
        this.bit(value, 27, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27be(value) {
        this.bit(value, 27, true, "big");
    }
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28(value) {
        this.bit(value, 28);
    }
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28le(value) {
        this.bit(value, 28, undefined, "little");
    }
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28be(value) {
        this.bit(value, 28, undefined, "big");
    }
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28(value) {
        this.bit(value, 28, true);
    }
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28le(value) {
        this.bit(value, 28, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28be(value) {
        this.bit(value, 28, true, "big");
    }
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29(value) {
        this.bit(value, 29);
    }
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29le(value) {
        this.bit(value, 29, undefined, "little");
    }
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29be(value) {
        this.bit(value, 29, undefined, "big");
    }
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29(value) {
        this.bit(value, 29, true);
    }
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29le(value) {
        this.bit(value, 29, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29be(value) {
        this.bit(value, 29, true, "big");
    }
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30(value) {
        this.bit(value, 30);
    }
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30le(value) {
        this.bit(value, 30, undefined, "little");
    }
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30be(value) {
        this.bit(value, 30, undefined, "big");
    }
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30(value) {
        this.bit(value, 30, true);
    }
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30le(value) {
        this.bit(value, 30, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30be(value) {
        this.bit(value, 30, true, "big");
    }
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31(value) {
        this.bit(value, 31);
    }
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31le(value) {
        this.bit(value, 31, undefined, "little");
    }
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31be(value) {
        this.bit(value, 31, undefined, "big");
    }
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31(value) {
        this.bit(value, 31, true);
    }
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31le(value) {
        this.bit(value, 31, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31be(value) {
        this.bit(value, 31, true, "big");
    }
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32(value) {
        this.bit(value, 32);
    }
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32le(value) {
        this.bit(value, 32, undefined, "little");
    }
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32be(value) {
        this.bit(value, 32, undefined, "big");
    }
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32(value) {
        this.bit(value, 32, true);
    }
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32le(value) {
        this.bit(value, 32, true, "little");
        ;
    }
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32be(value) {
        this.bit(value, 32, true, "big");
    }
    //
    // byte write
    //
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    set byte(value) {
        this.writeByte(value);
    }
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    set int8(value) {
        this.writeByte(value);
    }
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    set uint8(value) {
        this.writeByte(value, true);
    }
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    set ubyte(value) {
        this.writeByte(value, true);
    }
    //
    // short writes
    //
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set int16(value) {
        this.writeInt16(value);
    }
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set short(value) {
        this.writeInt16(value);
    }
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set word(value) {
        this.writeInt16(value);
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16(value) {
        this.writeInt16(value, true);
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushort(value) {
        this.writeInt16(value, true);
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uword(value) {
        this.writeInt16(value, true);
    }
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set int16be(value) {
        this.writeInt16(value, false, "big");
    }
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set shortbe(value) {
        this.writeInt16(value, false, "big");
    }
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set wordbe(value) {
        this.writeInt16(value, false, "big");
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16be(value) {
        this.writeInt16(value, true, "big");
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushortbe(value) {
        this.writeInt16(value, true, "big");
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uwordbe(value) {
        this.writeInt16(value, true, "big");
    }
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set int16le(value) {
        this.writeInt16(value, false, "little");
    }
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set shortle(value) {
        this.writeInt16(value, false, "little");
    }
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set wordle(value) {
        this.writeInt16(value, false, "little");
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16le(value) {
        this.writeInt16(value, true, "little");
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushortle(value) {
        this.writeInt16(value, true, "little");
    }
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uwordle(value) {
        this.writeInt16(value, true, "little");
    }
    //
    // half float
    //
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set half(value) {
        this.writeHalfFloat(value);
    }
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloat(value) {
        this.writeHalfFloat(value);
    }
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloatbe(value) {
        this.writeHalfFloat(value, "big");
    }
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halfbe(value) {
        this.writeHalfFloat(value, "big");
    }
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloatle(value) {
        this.writeHalfFloat(value, "little");
    }
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halfle(value) {
        this.writeHalfFloat(value, "little");
    }
    //
    // int32 write
    //
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set int(value) {
        this.writeInt32(value);
    }
    /**
    * Write int32.
    *
    * @param {number} value - value as int
    */
    set int32(value) {
        this.writeInt32(value);
    }
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set double(value) {
        this.writeInt32(value);
    }
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set long(value) {
        this.writeInt32(value);
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32(value) {
        this.writeInt32(value, true);
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint(value) {
        this.writeInt32(value, true);
    }
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    set udouble(value) {
        this.writeInt32(value, true);
    }
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    set ulong(value) {
        this.writeInt32(value, true);
    }
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set int32le(value) {
        this.writeInt32(value, false, "little");
    }
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set intle(value) {
        this.writeInt32(value, false, "little");
    }
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set doublele(value) {
        this.writeInt32(value, false, "little");
    }
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set longle(value) {
        this.writeInt32(value, false, "little");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32le(value) {
        this.writeInt32(value, true, "little");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uintle(value) {
        this.writeInt32(value, true, "little");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set udoublele(value) {
        this.writeInt32(value, true, "little");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongle(value) {
        this.writeInt32(value, true, "little");
    }
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set intbe(value) {
        this.writeInt32(value, false, "big");
    }
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set int32be(value) {
        this.writeInt32(value, false, "big");
    }
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set doublebe(value) {
        this.writeInt32(value, false, "big");
    }
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set longbe(value) {
        this.writeInt32(value, false, "big");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set writeUInt32BE(value) {
        this.writeInt32(value, true, "big");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32be(value) {
        this.writeInt32(value, true, "big");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uintbe(value) {
        this.writeInt32(value, true, "big");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set udoublebe(value) {
        this.writeInt32(value, true, "big");
    }
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongbe(value) {
        this.writeInt32(value, true, "big");
    }
    //
    // float write
    //
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    set float(value) {
        this.writeFloat(value);
    }
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    set floatle(value) {
        this.writeFloat(value, "little");
    }
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    set floatbe(value) {
        this.writeFloat(value, "big");
    }
    //
    // int64 write
    //
    /**
     * Write 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set int64(value) {
        this.writeInt64(value);
    }
    /**
    * Write 64 bit integer.
    *
    * @param {number} value - value as int
    */
    set quad(value) {
        this.writeInt64(value);
    }
    /**
     * Write 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set bigint(value) {
        this.writeInt64(value);
    }
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set uint64(value) {
        this.writeInt64(value, true);
    }
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set ubigint(value) {
        this.writeInt64(value, true);
    }
    /**
    * Write unsigned 64 bit integer.
    *
    * @param {number} value - value as int
    */
    set uquad(value) {
        this.writeInt64(value, true);
    }
    /**
     * Write signed 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set int64le(value) {
        this.writeInt64(value, false, "little");
    }
    /**
     * Write signed 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set bigintle(value) {
        this.writeInt64(value, false, "little");
    }
    /**
     * Write signed 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set quadle(value) {
        this.writeInt64(value, false, "little");
    }
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set uint64le(value) {
        this.writeInt64(value, true, "little");
    }
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set ubigintle(value) {
        this.writeInt64(value, true, "little");
    }
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set uquadle(value) {
        this.writeInt64(value, true, "little");
    }
    /**
     * Write signed 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set int64be(value) {
        this.writeInt64(value, false, "big");
    }
    /**
     * Write signed 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set bigintbe(value) {
        this.writeInt64(value, false, "big");
    }
    /**
     * Write signed 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set quadbe(value) {
        this.writeInt64(value, false, "big");
    }
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set uint64be(value) {
        this.writeInt64(value, true, "big");
    }
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set ubigintbe(value) {
        this.writeInt64(value, true, "big");
    }
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    set uquadbe(value) {
        this.writeInt64(value, true, "big");
    }
    //
    // doublefloat
    //
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloat(value) {
        this.writeDoubleFloat(value);
    }
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloat(value) {
        this.writeDoubleFloat(value);
    }
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloatbe(value) {
        this.writeDoubleFloat(value, "big");
    }
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloatbe(value) {
        this.writeDoubleFloat(value, "big");
    }
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloatle(value) {
        this.writeDoubleFloat(value, "little");
    }
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloatle(value) {
        this.writeDoubleFloat(value, "little");
    }
    //
    // string
    //
    /**
    * Writes string, use options object for different types.
    *
    *
    * @param {string} string - text string
    * @param {object} options - options:
    * ```javascript
    * {
    *  length: string.length,  //for fixed length, non-terminate value utf strings
    *  stringType: "utf-8", //utf-8, utf-16, pascal or wide-pascal
    *  terminateValue: 0x00, // only with stringType: "utf"
    *  lengthWriteSize: 1, //for pascal strings. 1, 2 or 4 byte length write size
    *  encoding: "utf-8", //TextEncoder accepted types
    *  endian: "little", //for wide-pascal and utf-16
    * }
    * ```
    */
    string(string, options) {
        return this.writeString(string, options);
    }
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    *
    * @return string
    */
    utf8string(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    *
    * @return string
    */
    cstring(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes ANSI string.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    ansistring(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    utf16string(string, length, terminateValue, endian) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    }
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    unistring(string, length, terminateValue, endian) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    }
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    }
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringle(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    }
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    }
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    }
    /**
    * Writes Pascal string.
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    /**
    * Writes Pascal string 1 byte length read.
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian });
    }
    /**
    * Writes Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring1le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little" });
    }
    /**
    * Writes Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring1be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big" });
    }
    /**
    * Writes Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    pstring2(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: endian });
    }
    /**
    * Writes Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring2le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little" });
    }
    /**
    * Writes Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring2be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big" });
    }
    /**
    * Writes Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    pstring4(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian });
    }
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring4be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big" });
    }
    /**
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring4le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string.
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    /**
    * Writes Wide-Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string, lengthWriteSize) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string, lengthWriteSize) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string.
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring1(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring1be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring1le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring2(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring2le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring2be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring4(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring4le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring4be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big" });
    }
}
exports.BiWriter = BiWriter;
//# sourceMappingURL=biwriter.js.map