"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiReader = void 0;
const common_1 = require("./common");
/**
 * Binary reader, includes bitfields and strings.
 *
 * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiReader.data``
 * @param {BiOptions?} options - Any options to set at start
 * @param {number?} options.byteOffset - Byte offset to start reader (default ``0``)
 * @param {number?} options.bitOffset - Bit offset 0-7 to start reader (default ``0``)
 * @param {string?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {boolean?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``true``)
 * @param {number?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 *
 * @since 2.0
 */
class BiReader extends common_1.ReaderBase {
    /**
     * Binary reader, includes bitfields and strings.
     *
     * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiReader.data``
     * @param {BiOptions?} options - Any options to set at start
     * @param {number?} options.byteOffset - Byte offset to start reader (default ``0``)
     * @param {number?} options.bitOffset - Bit offset 0-7 to start reader (default ``0``)
     * @param {string?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {boolean?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``true``)
     * @param {number?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     */
    constructor(data, options = {}) {
        super();
        this.strict = true;
        if (data == undefined) {
            throw new Error("Data required");
        }
        else {
            if (!this.isBufferOrUint8Array(data)) {
                throw new Error("Write data must be Uint8Array or Buffer");
            }
            this.data = data;
        }
        if (options.extendBufferSize != undefined && options.extendBufferSize != 0) {
            this.extendBufferSize = options.extendBufferSize;
        }
        this.size = this.data.length;
        this.sizeB = this.data.length * 8;
        if (options.endianness != undefined && typeof options.endianness != "string") {
            throw new Error("Endian must be big or little");
        }
        if (options.endianness != undefined && !(options.endianness == "big" || options.endianness == "little")) {
            throw new Error("Byte order must be big or little");
        }
        this.endian = options.endianness || "little";
        if (typeof options.strict == "boolean") {
            this.strict = options.strict;
        }
        else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true of false");
            }
        }
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
    // Bit Aliases
    //
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    bit(bits, unsigned, endian) {
        return this.readBit(bits, unsigned, endian);
    }
    /**
     * Bit field reader. Unsigned read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(bits, endian) {
        return this.readBit(bits, true, endian);
    }
    /**
     * Bit field reader. Unsigned big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitbe(bits) {
        return this.bit(bits, true, "big");
    }
    /**
     * Bit field reader. Big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitbe(bits, unsigned) {
        return this.bit(bits, unsigned, "big");
    }
    /**
     * Bit field reader. Unsigned little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitle(bits) {
        return this.bit(bits, true, "little");
    }
    /**
     * Bit field reader. Little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitle(bits, unsigned) {
        return this.bit(bits, unsigned, "little");
    }
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1() {
        return this.bit(1);
    }
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1le() {
        return this.bit(1, undefined, "little");
    }
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1be() {
        return this.bit(1, undefined, "big");
    }
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1() {
        return this.bit(1, true);
    }
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1le() {
        return this.bit(1, true, "little");
    }
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1be() {
        return this.bit(1, true, "big");
    }
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2() {
        return this.bit(2);
    }
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2le() {
        return this.bit(2, undefined, "little");
    }
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2be() {
        return this.bit(2, undefined, "big");
    }
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2() {
        return this.bit(2, true);
    }
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2le() {
        return this.bit(2, true, "little");
    }
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2be() {
        return this.bit(2, true, "big");
    }
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3() {
        return this.bit(3);
    }
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3le() {
        return this.bit(3, undefined, "little");
    }
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3be() {
        return this.bit(3, undefined, "big");
    }
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3() {
        return this.bit(3, true);
    }
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3le() {
        return this.bit(3, true, "little");
    }
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3be() {
        return this.bit(3, true, "big");
    }
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4() {
        return this.bit(4);
    }
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4le() {
        return this.bit(4, undefined, "little");
    }
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4be() {
        return this.bit(4, undefined, "big");
    }
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4() {
        return this.bit(4, true);
    }
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4le() {
        return this.bit(4, true, "little");
    }
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4be() {
        return this.bit(4, true, "big");
    }
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5() {
        return this.bit(5);
    }
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5le() {
        return this.bit(5, undefined, "little");
    }
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5be() {
        return this.bit(5, undefined, "big");
    }
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5() {
        return this.bit(5, true);
    }
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5le() {
        return this.bit(5, true, "little");
    }
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5be() {
        return this.bit(5, true, "big");
    }
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6() {
        return this.bit(6);
    }
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6le() {
        return this.bit(6, undefined, "little");
    }
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6be() {
        return this.bit(6, undefined, "big");
    }
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6() {
        return this.bit(6, true);
    }
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6le() {
        return this.bit(6, true, "little");
    }
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6be() {
        return this.bit(6, true, "big");
    }
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7() {
        return this.bit(7);
    }
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7le() {
        return this.bit(7, undefined, "little");
    }
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7be() {
        return this.bit(7, undefined, "big");
    }
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7() {
        return this.bit(7, true);
    }
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7le() {
        return this.bit(7, true, "little");
    }
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7be() {
        return this.bit(7, true, "big");
    }
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8() {
        return this.bit(8);
    }
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8le() {
        return this.bit(8, undefined, "little");
    }
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8be() {
        return this.bit(8, undefined, "big");
    }
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8() {
        return this.bit(8, true);
    }
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8le() {
        return this.bit(8, true, "little");
    }
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8be() {
        return this.bit(8, true, "big");
    }
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9() {
        return this.bit(9);
    }
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9le() {
        return this.bit(9, undefined, "little");
    }
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9be() {
        return this.bit(9, undefined, "big");
    }
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9() {
        return this.bit(9, true);
    }
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9le() {
        return this.bit(9, true, "little");
    }
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9be() {
        return this.bit(9, true, "big");
    }
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10() {
        return this.bit(10);
    }
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10le() {
        return this.bit(10, undefined, "little");
    }
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10be() {
        return this.bit(10, undefined, "big");
    }
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10() {
        return this.bit(10, true);
    }
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10le() {
        return this.bit(10, true, "little");
    }
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10be() {
        return this.bit(10, true, "big");
    }
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11() {
        return this.bit(11);
    }
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11le() {
        return this.bit(11, undefined, "little");
    }
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11be() {
        return this.bit(11, undefined, "big");
    }
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11() {
        return this.bit(11, true);
    }
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11le() {
        return this.bit(11, true, "little");
    }
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11be() {
        return this.bit(11, true, "big");
    }
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12() {
        return this.bit(12);
    }
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12le() {
        return this.bit(12, undefined, "little");
    }
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12be() {
        return this.bit(12, undefined, "big");
    }
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12() {
        return this.bit(12, true);
    }
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12le() {
        return this.bit(12, true, "little");
    }
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12be() {
        return this.bit(12, true, "big");
    }
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13() {
        return this.bit(13);
    }
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13le() {
        return this.bit(13, undefined, "little");
    }
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13be() {
        return this.bit(13, undefined, "big");
    }
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13() {
        return this.bit(13, true);
    }
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13le() {
        return this.bit(13, true, "little");
    }
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13be() {
        return this.bit(13, true, "big");
    }
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14() {
        return this.bit(14);
    }
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14le() {
        return this.bit(14, undefined, "little");
    }
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14be() {
        return this.bit(14, undefined, "big");
    }
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14() {
        return this.bit(14, true);
    }
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14le() {
        return this.bit(14, true, "little");
    }
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14be() {
        return this.bit(14, true, "big");
    }
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15() {
        return this.bit(15);
    }
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15le() {
        return this.bit(15, undefined, "little");
    }
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15be() {
        return this.bit(15, undefined, "big");
    }
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15() {
        return this.bit(15, true);
    }
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15le() {
        return this.bit(15, true, "little");
    }
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15be() {
        return this.bit(15, true, "big");
    }
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16() {
        return this.bit(16);
    }
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16le() {
        return this.bit(16, undefined, "little");
    }
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16be() {
        return this.bit(16, undefined, "big");
    }
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16() {
        return this.bit(16, true);
    }
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16le() {
        return this.bit(16, true, "little");
    }
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16be() {
        return this.bit(16, true, "big");
    }
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17() {
        return this.bit(17);
    }
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17le() {
        return this.bit(17, undefined, "little");
    }
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17be() {
        return this.bit(17, undefined, "big");
    }
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17() {
        return this.bit(17, true);
    }
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17le() {
        return this.bit(17, true, "little");
    }
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17be() {
        return this.bit(17, true, "big");
    }
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18() {
        return this.bit(18);
    }
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18le() {
        return this.bit(18, undefined, "little");
    }
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18be() {
        return this.bit(18, undefined, "big");
    }
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18() {
        return this.bit(18, true);
    }
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18le() {
        return this.bit(18, true, "little");
    }
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18be() {
        return this.bit(18, true, "big");
    }
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19() {
        return this.bit(19);
    }
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19le() {
        return this.bit(19, undefined, "little");
    }
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19be() {
        return this.bit(19, undefined, "big");
    }
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19() {
        return this.bit(19, true);
    }
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19le() {
        return this.bit(19, true, "little");
    }
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19be() {
        return this.bit(19, true, "big");
    }
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20() {
        return this.bit(20);
    }
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20le() {
        return this.bit(20, undefined, "little");
    }
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20be() {
        return this.bit(20, undefined, "big");
    }
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20() {
        return this.bit(20, true);
    }
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20le() {
        return this.bit(20, true, "little");
    }
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20be() {
        return this.bit(20, true, "big");
    }
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21() {
        return this.bit(21);
    }
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21le() {
        return this.bit(21, undefined, "little");
    }
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21be() {
        return this.bit(21, undefined, "big");
    }
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21() {
        return this.bit(21, true);
    }
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21le() {
        return this.bit(21, true, "little");
    }
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21be() {
        return this.bit(21, true, "big");
    }
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22() {
        return this.bit(22);
    }
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22le() {
        return this.bit(22, undefined, "little");
    }
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22be() {
        return this.bit(22, undefined, "big");
    }
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22() {
        return this.bit(22, true);
    }
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22le() {
        return this.bit(22, true, "little");
    }
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22be() {
        return this.bit(22, true, "big");
    }
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23() {
        return this.bit(23);
    }
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23le() {
        return this.bit(23, undefined, "little");
    }
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23be() {
        return this.bit(23, undefined, "big");
    }
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23() {
        return this.bit(23, true);
    }
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23le() {
        return this.bit(23, true, "little");
    }
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23be() {
        return this.bit(23, true, "big");
    }
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24() {
        return this.bit(24);
    }
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24le() {
        return this.bit(24, undefined, "little");
    }
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24be() {
        return this.bit(24, undefined, "big");
    }
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24() {
        return this.bit(24, true);
    }
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24le() {
        return this.bit(24, true, "little");
    }
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24be() {
        return this.bit(24, true, "big");
    }
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25() {
        return this.bit(25);
    }
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25le() {
        return this.bit(25, undefined, "little");
    }
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25be() {
        return this.bit(25, undefined, "big");
    }
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25() {
        return this.bit(25, true);
    }
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25le() {
        return this.bit(25, true, "little");
    }
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25be() {
        return this.bit(25, true, "big");
    }
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26() {
        return this.bit(26);
    }
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26le() {
        return this.bit(26, undefined, "little");
    }
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26be() {
        return this.bit(26, undefined, "big");
    }
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26() {
        return this.bit(26, true);
    }
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26le() {
        return this.bit(26, true, "little");
    }
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26be() {
        return this.bit(26, true, "big");
    }
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27() {
        return this.bit(27);
    }
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27le() {
        return this.bit(27, undefined, "little");
    }
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27be() {
        return this.bit(27, undefined, "big");
    }
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27() {
        return this.bit(27, true);
    }
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27le() {
        return this.bit(27, true, "little");
    }
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27be() {
        return this.bit(27, true, "big");
    }
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28() {
        return this.bit(28);
    }
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28le() {
        return this.bit(28, undefined, "little");
    }
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28be() {
        return this.bit(28, undefined, "big");
    }
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28() {
        return this.bit(28, true);
    }
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28le() {
        return this.bit(28, true, "little");
    }
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28be() {
        return this.bit(28, true, "big");
    }
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29() {
        return this.bit(29);
    }
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29le() {
        return this.bit(29, undefined, "little");
    }
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29be() {
        return this.bit(29, undefined, "big");
    }
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29() {
        return this.bit(29, true);
    }
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29le() {
        return this.bit(29, true, "little");
    }
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29be() {
        return this.bit(29, true, "big");
    }
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30() {
        return this.bit(30);
    }
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30le() {
        return this.bit(30, undefined, "little");
    }
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30be() {
        return this.bit(30, undefined, "big");
    }
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30() {
        return this.bit(30, true);
    }
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30le() {
        return this.bit(30, true, "little");
    }
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30be() {
        return this.bit(30, true, "big");
    }
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31() {
        return this.bit(31);
    }
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31le() {
        return this.bit(31, undefined, "little");
    }
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31be() {
        return this.bit(31, undefined, "big");
    }
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31() {
        return this.bit(31, true);
    }
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31le() {
        return this.bit(31, true, "little");
    }
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31be() {
        return this.bit(31, true, "big");
    }
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32() {
        return this.bit(32);
    }
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32le() {
        return this.bit(32, undefined, "little");
    }
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32be() {
        return this.bit(32, undefined, "big");
    }
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32() {
        return this.bit(32, true);
    }
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32le() {
        return this.bit(32, true, "little");
    }
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32be() {
        return this.bit(32, true, "big");
    }
    //
    // byte read
    //
    /**
     * Read byte.
     *
     * @returns {number}
     */
    get byte() {
        return this.readByte();
    }
    /**
     * Read byte.
     *
     * @returns {number}
     */
    get int8() {
        return this.readByte();
    }
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    get uint8() {
        return this.readByte(true);
    }
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    get ubyte() {
        return this.readByte(true);
    }
    //
    //short16 read
    //
    /**
     * Read short.
     *
     * @returns {number}
     */
    get int16() {
        return this.readInt16();
    }
    /**
     * Read short.
     *
     * @returns {number}
     */
    get short() {
        return this.readInt16();
    }
    /**
     * Read short.
     *
     * @returns {number}
     */
    get word() {
        return this.readInt16();
    }
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get uint16() {
        return this.readInt16(true);
    }
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get ushort() {
        return this.readInt16(true);
    }
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get uword() {
        return this.readInt16(true);
    }
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get uint16le() {
        return this.readInt16(true, "little");
    }
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get ushortle() {
        return this.readInt16(true, "little");
    }
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get uwordle() {
        return this.readInt16(true, "little");
    }
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get int16le() {
        return this.readInt16(false, "little");
    }
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get shortle() {
        return this.readInt16(false, "little");
    }
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get wordle() {
        return this.readInt16(false, "little");
    }
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get uint16be() {
        return this.readInt16(true, "big");
    }
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get ushortbe() {
        return this.readInt16(true, "big");
    }
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get uwordbe() {
        return this.readInt16(true, "big");
    }
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get int16be() {
        return this.readInt16(false, "big");
    }
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get shortbe() {
        return this.readInt16(false, "big");
    }
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get wordbe() {
        return this.readInt16(false, "big");
    }
    //
    //half float read
    //
    /**
     * Read half float.
     *
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    get halffloat() {
        return this.readHalfFloat();
    }
    /**
     * Read half float
     *
     * @returns {number}
     */
    get half() {
        return this.readHalfFloat();
    }
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloatbe() {
        return this.readHalfFloat("big");
    }
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halfbe() {
        return this.readHalfFloat("big");
    }
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloatle() {
        return this.readHalfFloat("little");
    }
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halfle() {
        return this.readHalfFloat("little");
    }
    //
    //int read
    //
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get int() {
        return this.readInt32();
    }
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get double() {
        return this.readInt32();
    }
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get int32() {
        return this.readInt32();
    }
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get long() {
        return this.readInt32();
    }
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint() {
        return this.readInt32(true);
    }
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get udouble() {
        return this.readInt32(true);
    }
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint32() {
        return this.readInt32(true);
    }
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get ulong() {
        return this.readInt32(true);
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get intbe() {
        return this.readInt32(false, "big");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get doublebe() {
        return this.readInt32(false, "big");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get int32be() {
        return this.readInt32(false, "big");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get longbe() {
        return this.readInt32(false, "big");
    }
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uintbe() {
        return this.readInt32(true, "big");
    }
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get udoublebe() {
        return this.readInt32(true, "big");
    }
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint32be() {
        return this.readInt32(true, "big");
    }
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get ulongbe() {
        return this.readInt32(true, "big");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get intle() {
        return this.readInt32(false, "little");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get doublele() {
        return this.readInt32(false, "little");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get int32le() {
        return this.readInt32(false, "little");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get longle() {
        return this.readInt32(false, "little");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get uintle() {
        return this.readInt32(true, "little");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get udoublele() {
        return this.readInt32(true, "little");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get uint32le() {
        return this.readInt32(true, "little");
    }
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get ulongle() {
        return this.readInt32(true, "little");
    }
    //
    //float read
    //
    /**
     * Read float.
     *
     * @returns {number}
     */
    get float() {
        return this.readFloat();
    }
    /**
     * Read float.
     *
     * @returns {number}
     */
    get floatbe() {
        return this.readFloat("big");
    }
    /**
     * Read float.
     *
     * @returns {number}
     */
    get floatle() {
        return this.readFloat("little");
    }
    //
    //int64 reader
    //
    /**
     * Read signed 64 bit integer
     *
     * @returns {number}
     */
    get int64() {
        return this.readInt64();
    }
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    get bigint() {
        return this.readInt64();
    }
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    get quad() {
        return this.readInt64();
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get uint64() {
        return this.readInt64(true);
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get ubigint() {
        return this.readInt64(true);
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get uquad() {
        return this.readInt64(true);
    }
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    get int64be() {
        return this.readInt64(false, "big");
    }
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    get bigintbe() {
        return this.readInt64(false, "big");
    }
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    get quadbe() {
        return this.readInt64(false, "big");
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get uint64be() {
        return this.readInt64(true, "big");
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get ubigintbe() {
        return this.readInt64(true, "big");
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get uquadbe() {
        return this.readInt64(true, "big");
    }
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    get int64le() {
        return this.readInt64(false, "little");
    }
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    get bigintle() {
        return this.readInt64(false, "little");
    }
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    get quadle() {
        return this.readInt64(false, "little");
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get uint64le() {
        return this.readInt64(true, "little");
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get ubigintle() {
        return this.readInt64(true, "little");
    }
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    get uquadle() {
        return this.readInt64(true, "little");
    }
    //
    //doublefloat reader
    //
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloat() {
        return this.readDoubleFloat();
    }
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloat() {
        return this.readDoubleFloat();
    }
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloatebe() {
        return this.readDoubleFloat("big");
    }
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloatbe() {
        return this.readDoubleFloat("big");
    }
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloatle() {
        return this.readDoubleFloat("little");
    }
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloatle() {
        return this.readDoubleFloat("little");
    }
    //
    //string reader
    //
    /**
    * Reads string, use options object for different types.
    *
    * @param {object} options
    * ```javascript
    * {
    *  length: number, //for fixed length, non-terminate value utf strings
    *  stringType: "utf-8", //utf-8, utf-16, pascal or wide-pascal
    *  terminateValue: 0x00, // only for non-fixed length utf strings
    *  lengthReadSize: 1, //for pascal strings. 1, 2 or 4 byte length read size
    *  stripNull: true, // removes 0x00 characters
    *  encoding: "utf-8", //TextEncoder accepted types
    *  endian: "little", //for wide-pascal and utf-16
    * }
    * ```
    * @return string
    */
    string(options) {
        return this.readString(options);
    }
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf8string(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    cstring(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    /**
    * Reads ANSI string.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    ansistring(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    utf16string(length, terminateValue, stripNull, endian) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    unistring(length, terminateValue, stripNull, endian) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf16stringle(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    unistringle(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf16stringbe(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    unistringbe(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads Pascal string.
    *
    * @param {number} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring(lengthReadSize, stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    }
    /**
    * Reads Pascal string 1 byte length read.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring1(stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: endian });
    }
    /**
    * Reads Pascal string 1 byte length read in little endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 1 byte length read in big endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Pascal string 2 byte length read.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring2(stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: endian });
    }
    /**
    * Reads Pascal string 2 byte length read in little endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 2 byte length read in big endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Pascal string 4 byte length read.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring4(stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: endian });
    }
    /**
    * Reads Pascal string 4 byte length read in little endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 4 byte length read in big endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Wide-Pascal string.
    *
    * @param {number} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring(lengthReadSize, stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 1 byte length read.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring1(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 2 byte length read.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring2(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 4 byte length read.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring4(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull });
    }
}
exports.BiReader = BiReader;
//# sourceMappingURL=bireader.js.map