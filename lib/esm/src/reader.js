/**
*
* byte reader, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
* @param {number} byteOffset - byte offset to start reader, default is 0
* @param {number} bitOffset - bit offset to start reader, 0-7
* @param {string} endianness - endianness ```big``` or ```little``` (default ```little```)
*/
export class bireader {
    check_size(read_size, read_bits) {
        const new_off = this.offset + (read_size || 0) + Math.ceil((this.bitoffset + (read_bits || 0)) / 8);
        if (new_off > this.size) {
            throw new Error(`Reader reached end of data.`);
        }
    }
    isBuffer(obj) {
        return (typeof Buffer !== 'undefined' && obj instanceof Buffer);
    }
    isBufferOrUint8Array(obj) {
        return obj instanceof Uint8Array || this.isBuffer(obj);
    }
    /**
    *
    * byte reader, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
    * @param {number} byteOffset - byte offset to start reader, default is 0
    * @param {number} bitOffset - bit offset to start reader, 0-7
    * @param {string} endianness - endianness ```big``` or ```little``` (default ```little```)
    */
    constructor(data, byteOffset, bitOffset, endianness) {
        this.endian = "little";
        this.offset = 0;
        this.bitoffset = 0;
        this.size = 0;
        if (endianness != undefined && typeof endianness != "string") {
            throw new Error("Endian must be big or little");
        }
        if (endianness != undefined && !(endianness == "big" || endianness == "little")) {
            throw new Error("Byte order must be big or little");
        }
        this.endian = endianness || "little";
        if (byteOffset != undefined) {
            if (typeof byteOffset == "number") {
                this.offset = Math.round(byteOffset) || 0;
            }
            else {
                throw new Error("Byte offset must be number");
            }
        }
        if (bitOffset != undefined) {
            this.bitoffset = bitOffset % 8;
        }
        if (data == undefined) {
            throw new Error("Data required");
        }
        else {
            if (!this.isBufferOrUint8Array(data)) {
                throw new Error("Write data must be Uint8Array or Buffer");
            }
        }
        this.size = data.length + ((bitOffset || 0) % 8);
        this.data = data;
    }
    /**
    *
    * Change endian, defaults to little
    *
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - endianness ```big``` or ```little```
    */
    endianness(endian) {
        if (endian == undefined || typeof endian != "string") {
            throw new Error("Endian must be big or little");
        }
        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new Error("Endian must be big or little");
        }
        this.endian = endian;
    }
    /**
    *Sets endian to big
    */
    bigEndian() {
        this.endianness("big");
    }
    /**
    *Sets endian to big
    */
    big() {
        this.endianness("big");
    }
    /**
    *Sets endian to big
    */
    be() {
        this.endianness("big");
    }
    /**
    * Sets endian to little
    */
    littleEndian() {
        this.endianness("little");
    }
    /**
    * Sets endian to little
    */
    little() {
        this.endianness("little");
    }
    /**
    * Sets endian to little
    */
    le() {
        this.endianness("little");
    }
    /**
    * Move current read byte or bit position
    *
    * @param {number} bytes - bytes to skip
    * @param {number} bits - bits to skip
    */
    skip(bytes, bits) {
        this.check_size(bytes || 0);
        if ((((bytes || 0) + this.offset) + Math.ceil((this.bitoffset + (bits || 0)) / 8)) > this.size) {
            throw new Error("Seek outside of size of data: " + this.size);
        }
        this.bitoffset += (bits || 0) % 8;
        this.offset += (bytes || 0);
    }
    /**
    * Move current read byte or bit position
    *
    * @param {number} bytes - bytes to skip
    * @param {number} bits - bits to skip
    */
    fskip(bytes, bits) {
        this.skip(bytes, bits);
    }
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    goto(byte, bit) {
        if ((byte + Math.ceil((bit || 0) / 8)) > this.size) {
            throw new Error("Goto outside of size of data: " + this.size);
        }
        this.offset = byte;
        this.bitoffset = (bit || 0) % 8;
    }
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    seek(byte, bit) {
        this.goto(byte, bit);
    }
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    fseek(byte, bit) {
        this.goto(byte, bit);
    }
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    jump(byte, bit) {
        this.goto(byte, bit);
    }
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    pointer(byte, bit) {
        this.goto(byte, bit);
    }
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    warp(byte, bit) {
        this.goto(byte, bit);
    }
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    fsetpos(byte, bit) {
        this.goto(byte, bit);
    }
    /**
    * Set offset to start of file
    */
    rewind() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    /**
    * Set offset to start of file
    */
    gotostart() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    /**
    * Set offset to start of file
    */
    tostart() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    ftell() {
        return this.offset;
    }
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    tell() {
        return this.offset;
    }
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    fgetpos() {
        return this.offset;
    }
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    clip(startOffset, endOffset) {
        return this.data.slice(startOffset || 0, endOffset || this.offset);
    }
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    crop(startOffset, endOffset) {
        return this.data.slice(startOffset || 0, endOffset || this.offset);
    }
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    truncate(startOffset, endOffset) {
        return this.data.slice(startOffset || 0, endOffset || this.offset);
    }
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    slice(startOffset, endOffset) {
        return this.data.slice(startOffset || 0, endOffset || this.offset);
    }
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    extract(length) {
        if (this.offset + (length || 0) > this.size) {
            throw new Error("End offset outside of data: " + this.size);
        }
        return this.data.slice(this.offset, this.offset + (length || 0));
    }
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    wrap(length) {
        if (this.offset + (length || 0) > this.size) {
            throw new Error("End offset outside of data: " + this.size);
        }
        return this.data.slice(this.offset, this.offset + (length || 0));
    }
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    lift(length) {
        if (this.offset + (length || 0) > this.size) {
            throw new Error("End offset outside of data: " + this.size);
        }
        return this.data.slice(this.offset, this.offset + (length || 0));
    }
    /**
    * Returns current data
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get() {
        return this.data;
    }
    /**
    * Returns current data
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return() {
        return this.data;
    }
    /**
    * removes reading data
    */
    end() {
        this.data = [];
    }
    /**
    * removes reading data
    */
    close() {
        this.data = [];
    }
    /**
    * removes reading data
    */
    done() {
        this.data = [];
    }
    /**
    * removes reading data
    */
    finished() {
        this.data = [];
    }
    //
    //bit reader
    //
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    readBit(bits, unsigned, endian) {
        if (bits == undefined || typeof bits != "number") {
            throw new Error("Enter number of bits to read");
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32.');
        }
        const size_needed = ((((bits - 1) + this.bitoffset) / 8) + this.offset);
        if (bits <= 0 || size_needed > this.size) {
            throw new Error("Invalid number of bits to read: " + size_needed + " of " + this.size);
        }
        var off_in_bits = (this.offset * 8) + this.bitoffset;
        var value = 0;
        for (var i = 0; i < bits;) {
            var remaining = bits - i;
            var bitOffset = off_in_bits & 7;
            var currentByte = this.data[off_in_bits >> 3];
            var read = Math.min(remaining, 8 - bitOffset);
            var mask, readBits;
            if ((endian != undefined ? endian : this.endian) == "big") {
                mask = ~(0xFF << read);
                readBits = (currentByte >> (8 - read - bitOffset)) & mask;
                value <<= read;
                value |= readBits;
            }
            else {
                mask = ~(0xFF << read);
                readBits = (currentByte >> bitOffset) & mask;
                value |= readBits << i;
            }
            off_in_bits += read;
            i += read;
        }
        this.offset = this.offset + Math.floor(((bits) + this.bitoffset) / 8); //end byte
        this.bitoffset = ((bits) + this.bitoffset) % 8;
        if (unsigned == true) {
            return value >>> 0;
        }
        if (bits !== 32 && value & (1 << (bits - 1))) {
            value |= -1 ^ ((1 << bits) - 1);
        }
        return value;
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit(bits, unsigned, endian) {
        return this.readBit(bits, unsigned, endian);
    }
    /**
* Bit field reader
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {boolean} unsigned - if the value is unsigned
* @returns number
*/
    bit1(unsigned) {
        return this.bit(1, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1le(unsigned) {
        return this.bit(1, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1be(unsigned) {
        return this.bit(1, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1() {
        return this.bit(1, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1le() {
        return this.bit(1, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1be() {
        return this.bit(1, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2(unsigned) {
        return this.bit(2, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2le(unsigned) {
        return this.bit(2, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2be(unsigned) {
        return this.bit(2, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2() {
        return this.bit(2, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2le() {
        return this.bit(2, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2be() {
        return this.bit(2, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3(unsigned) {
        return this.bit(3, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3le(unsigned) {
        return this.bit(3, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3be(unsigned) {
        return this.bit(3, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3() {
        return this.bit(3, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3le() {
        return this.bit(3, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3be() {
        return this.bit(3, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4(unsigned) {
        return this.bit(4, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4le(unsigned) {
        return this.bit(4, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4be(unsigned) {
        return this.bit(4, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4() {
        return this.bit(4, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4le() {
        return this.bit(4, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4be() {
        return this.bit(4, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5(unsigned) {
        return this.bit(5, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5le(unsigned) {
        return this.bit(5, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5be(unsigned) {
        return this.bit(5, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5() {
        return this.bit(5, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5le() {
        return this.bit(5, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5be() {
        return this.bit(5, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6(unsigned) {
        return this.bit(6, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6le(unsigned) {
        return this.bit(6, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6be(unsigned) {
        return this.bit(6, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6() {
        return this.bit(6, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6le() {
        return this.bit(6, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6be() {
        return this.bit(6, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7(unsigned) {
        return this.bit(7, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7le(unsigned) {
        return this.bit(7, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7be(unsigned) {
        return this.bit(7, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7() {
        return this.bit(7, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7le() {
        return this.bit(7, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7be() {
        return this.bit(7, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8(unsigned) {
        return this.bit(8, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8le(unsigned) {
        return this.bit(8, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8be(unsigned) {
        return this.bit(8, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8() {
        return this.bit(8, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8le() {
        return this.bit(8, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8be() {
        return this.bit(8, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9(unsigned) {
        return this.bit(9, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9le(unsigned) {
        return this.bit(9, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9be(unsigned) {
        return this.bit(9, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9() {
        return this.bit(9, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9le() {
        return this.bit(9, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9be() {
        return this.bit(9, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10(unsigned) {
        return this.bit(10, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10le(unsigned) {
        return this.bit(10, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10be(unsigned) {
        return this.bit(10, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10() {
        return this.bit(10, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10le() {
        return this.bit(10, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10be() {
        return this.bit(10, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11(unsigned) {
        return this.bit(11, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11le(unsigned) {
        return this.bit(11, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11be(unsigned) {
        return this.bit(11, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11() {
        return this.bit(11, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11le() {
        return this.bit(11, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11be() {
        return this.bit(11, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12(unsigned) {
        return this.bit(12, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12le(unsigned) {
        return this.bit(12, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12be(unsigned) {
        return this.bit(12, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12() {
        return this.bit(12, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12le() {
        return this.bit(12, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12be() {
        return this.bit(12, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13(unsigned) {
        return this.bit(13, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13le(unsigned) {
        return this.bit(13, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13be(unsigned) {
        return this.bit(13, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13() {
        return this.bit(13, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13le() {
        return this.bit(13, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13be() {
        return this.bit(13, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14(unsigned) {
        return this.bit(14, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14le(unsigned) {
        return this.bit(14, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14be(unsigned) {
        return this.bit(14, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14() {
        return this.bit(14, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14le() {
        return this.bit(14, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14be() {
        return this.bit(14, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15(unsigned) {
        return this.bit(15, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15le(unsigned) {
        return this.bit(15, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15be(unsigned) {
        return this.bit(15, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15() {
        return this.bit(15, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15le() {
        return this.bit(15, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15be() {
        return this.bit(15, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16(unsigned) {
        return this.bit(16, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16le(unsigned) {
        return this.bit(16, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16be(unsigned) {
        return this.bit(16, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16() {
        return this.bit(16, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16le() {
        return this.bit(16, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16be() {
        return this.bit(16, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17(unsigned) {
        return this.bit(17, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17le(unsigned) {
        return this.bit(17, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17be(unsigned) {
        return this.bit(17, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17() {
        return this.bit(17, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17le() {
        return this.bit(17, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17be() {
        return this.bit(17, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18(unsigned) {
        return this.bit(18, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18le(unsigned) {
        return this.bit(18, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18be(unsigned) {
        return this.bit(18, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18() {
        return this.bit(18, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18le() {
        return this.bit(18, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18be() {
        return this.bit(18, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19(unsigned) {
        return this.bit(19, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19le(unsigned) {
        return this.bit(19, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19be(unsigned) {
        return this.bit(19, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19() {
        return this.bit(19, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19le() {
        return this.bit(19, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19be() {
        return this.bit(19, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20(unsigned) {
        return this.bit(20, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20le(unsigned) {
        return this.bit(20, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20be(unsigned) {
        return this.bit(20, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20() {
        return this.bit(20, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20le() {
        return this.bit(20, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20be() {
        return this.bit(20, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21(unsigned) {
        return this.bit(21, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21le(unsigned) {
        return this.bit(21, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21be(unsigned) {
        return this.bit(21, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21() {
        return this.bit(21, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21le() {
        return this.bit(21, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21be() {
        return this.bit(21, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22(unsigned) {
        return this.bit(22, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22le(unsigned) {
        return this.bit(22, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22be(unsigned) {
        return this.bit(22, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22() {
        return this.bit(22, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22le() {
        return this.bit(22, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22be() {
        return this.bit(22, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23(unsigned) {
        return this.bit(23, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23le(unsigned) {
        return this.bit(23, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23be(unsigned) {
        return this.bit(23, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23() {
        return this.bit(23, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23le() {
        return this.bit(23, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23be() {
        return this.bit(23, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24(unsigned) {
        return this.bit(24, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24le(unsigned) {
        return this.bit(24, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24be(unsigned) {
        return this.bit(24, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24() {
        return this.bit(24, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24le() {
        return this.bit(24, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24be() {
        return this.bit(24, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25(unsigned) {
        return this.bit(25, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25le(unsigned) {
        return this.bit(25, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25be(unsigned) {
        return this.bit(25, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25() {
        return this.bit(25, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25le() {
        return this.bit(25, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25be() {
        return this.bit(25, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26(unsigned) {
        return this.bit(26, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26le(unsigned) {
        return this.bit(26, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26be(unsigned) {
        return this.bit(26, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26() {
        return this.bit(26, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26le() {
        return this.bit(26, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26be() {
        return this.bit(26, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27(unsigned) {
        return this.bit(27, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27le(unsigned) {
        return this.bit(27, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27be(unsigned) {
        return this.bit(27, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27() {
        return this.bit(27, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27le() {
        return this.bit(27, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27be() {
        return this.bit(27, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28(unsigned) {
        return this.bit(28, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28le(unsigned) {
        return this.bit(28, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28be(unsigned) {
        return this.bit(28, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28() {
        return this.bit(28, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28le() {
        return this.bit(28, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28be() {
        return this.bit(28, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29(unsigned) {
        return this.bit(29, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29le(unsigned) {
        return this.bit(29, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29be(unsigned) {
        return this.bit(29, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29() {
        return this.bit(29, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29le() {
        return this.bit(29, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29be() {
        return this.bit(29, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30(unsigned) {
        return this.bit(30, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30le(unsigned) {
        return this.bit(30, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30be(unsigned) {
        return this.bit(30, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30() {
        return this.bit(30, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30le() {
        return this.bit(30, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30be() {
        return this.bit(30, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31(unsigned) {
        return this.bit(31, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31le(unsigned) {
        return this.bit(31, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31be(unsigned) {
        return this.bit(31, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31() {
        return this.bit(31, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31le() {
        return this.bit(31, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31be() {
        return this.bit(31, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32(unsigned) {
        return this.bit(32, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32le(unsigned) {
        return this.bit(32, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32be(unsigned) {
        return this.bit(32, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32() {
        return this.bit(32, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32le() {
        return this.bit(32, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32be() {
        return this.bit(32, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitBE(bits) {
        return this.readBit(bits, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitbe(bits) {
        return this.readBit(bits, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    readBitBE(bits, unsigned) {
        return this.readBit(bits, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitbe(bits, unsigned) {
        return this.readBit(bits, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitLE(bits) {
        return this.readBit(bits, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitle(bits) {
        return this.readBit(bits, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    readBitLE(bits, unsigned) {
        return this.readBit(bits, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitle(bits, unsigned) {
        return this.readBit(bits, unsigned, "little");
    }
    //
    //byte read
    //
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    readByte(unsigned) {
        this.check_size(1);
        var read = this.data[this.offset];
        this.offset += 1;
        if (unsigned == true) {
            return read & 0xFF;
        }
        else {
            return read > 127 ? read - 256 : read;
        }
    }
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    byte(unsigned) {
        return this.readByte(unsigned);
    }
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    int8(unsigned) {
        return this.readByte(unsigned);
    }
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    readUByte() {
        return this.readByte(true);
    }
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    uint8() {
        return this.readByte(true);
    }
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    ubyte() {
        return this.readByte(true);
    }
    //
    //short16 read
    //
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt16(unsigned, endian) {
        this.check_size(2);
        var read;
        if ((endian != undefined ? endian : this.endian) == "little") {
            read = (this.data[this.offset + 1] << 8) | this.data[this.offset];
        }
        else {
            read = (this.data[this.offset] << 8) | this.data[this.offset + 1];
        }
        this.offset += 2;
        if (unsigned == undefined || unsigned == false) {
            return read & 0x8000 ? -(0x10000 - read) : read;
        }
        else {
            return read & 0xFFFF;
        }
    }
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int16(unsigned, endian) {
        return this.readInt16(unsigned, endian);
    }
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    short(unsigned, endian) {
        return this.readInt16(unsigned, endian);
    }
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    word(unsigned, endian) {
        return this.readInt16(unsigned, endian);
    }
    /**
    * Read unsigned short
    *
    * @param {string} endian - ```big``` or ```little```
    *
    * @returns number
    */
    readUInt16(endian) {
        return this.readInt16(true, endian);
    }
    /**
    * Read unsigned short
    *
    * @param {string} endian - ```big``` or ```little```
    *
    * @returns number
    */
    uint16(endian) {
        return this.readInt16(true, endian);
    }
    /**
    * Read unsigned short
    *
    * @param {string} endian - ```big``` or ```little```
    *
    * @returns number
    */
    ushort(endian) {
        return this.readInt16(true, endian);
    }
    /**
    * Read unsigned short
    *
    * @param {string} endian - ```big``` or ```little```
    *
    * @returns number
    */
    uword(endian) {
        return this.readInt16(true, endian);
    }
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    readUInt16LE() {
        return this.readInt16(true, "little");
    }
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    uint16le() {
        return this.readInt16(true, "little");
    }
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    ushortle() {
        return this.readInt16(true, "little");
    }
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    uwordle() {
        return this.readInt16(true, "little");
    }
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    readInt16LE() {
        return this.readInt16(false, "little");
    }
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    int16le() {
        return this.readInt16(false, "little");
    }
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    shortle() {
        return this.readInt16(false, "little");
    }
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    wordle() {
        return this.readInt16(false, "little");
    }
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    readUInt16BE() {
        return this.readInt16(true, "big");
    }
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    uint16be() {
        return this.readInt16(true, "big");
    }
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    ushortbe() {
        return this.readInt16(true, "big");
    }
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    uwordbe() {
        return this.readInt16(true, "big");
    }
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    readInt16BE() {
        return this.readInt16(false, "big");
    }
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    int16be() {
        return this.readInt16(false, "big");
    }
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    shortbe() {
        return this.readInt16(false, "big");
    }
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    wordbe() {
        return this.readInt16(false, "big");
    }
    //
    //half float read
    //
    /**
    * Read half float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readHalfFloat(endian) {
        this.check_size(2);
        var uint16Value = this.readInt16(true, (endian != undefined ? endian : this.endian));
        const sign = (uint16Value & 0x8000) >> 15;
        const exponent = (uint16Value & 0x7C00) >> 10;
        const fraction = uint16Value & 0x03FF;
        let floatValue;
        if (exponent === 0) {
            if (fraction === 0) {
                floatValue = (sign === 0) ? 0 : -0; // +/-0
            }
            else {
                // Denormalized number
                floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
            }
        }
        else if (exponent === 0x1F) {
            if (fraction === 0) {
                floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
            }
            else {
                floatValue = Number.NaN;
            }
        }
        else {
            // Normalized number
            floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
        }
        return floatValue;
    }
    /**
    * Read half float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    halffloat(endian) {
        return this.readHalfFloat(endian);
    }
    /**
    * Read half float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    half(endian) {
        return this.readHalfFloat(endian);
    }
    /**
    * Read half float
    *
    * @returns number
    */
    readHalfFloatBE() {
        return this.readHalfFloat("big");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    halffloatbe() {
        return this.readHalfFloat("big");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    halfbe() {
        return this.readHalfFloat("big");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    readHalfFloatLE() {
        return this.readHalfFloat("little");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    halffloatle() {
        return this.readHalfFloat("little");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    halfle() {
        return this.readHalfFloat("little");
    }
    //
    //int read
    //
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt32(unsigned, endian) {
        this.check_size(4);
        var read;
        if ((endian != undefined ? endian : this.endian) == "little") {
            read = ((this.data[this.offset + 3] << 24) | (this.data[this.offset + 2] << 16) | (this.data[this.offset + 1] << 8) | this.data[this.offset]);
        }
        else {
            read = (this.data[this.offset] << 24) | (this.data[this.offset + 1] << 16) | (this.data[this.offset + 2] << 8) | this.data[this.offset + 3];
        }
        this.offset += 4;
        if (unsigned == undefined || unsigned == false) {
            return read;
        }
        else {
            return read >>> 0;
        }
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int(unsigned, endian) {
        return this.readInt32(unsigned, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    double(unsigned, endian) {
        return this.readInt32(unsigned, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int32(unsigned, endian) {
        return this.readInt32(unsigned, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    long(unsigned, endian) {
        return this.readInt32(unsigned, endian);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    readUInt() {
        return this.readInt32(true);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint() {
        return this.readInt32(true);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    udouble() {
        return this.readInt32(true);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint32() {
        return this.readInt32(true);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    ulong() {
        return this.readInt32(true);
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readInt32BE() {
        return this.readInt32(false, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    intbe() {
        return this.readInt32(false, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    doublebe() {
        return this.readInt32(false, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    int32be() {
        return this.readInt32(false, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    longbe() {
        return this.readInt32(false, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    readUInt32BE() {
        return this.readInt32(true, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uintbe() {
        return this.readInt32(true, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    udoublebe() {
        return this.readInt32(true, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint32be() {
        return this.readInt32(true, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    ulongbe() {
        return this.readInt32(true, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readInt32LE() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    intle() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    doublele() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    int32le() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    longle() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readUInt32LE() {
        return this.readInt32(true, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    uintle() {
        return this.readInt32(true, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    udoublele() {
        return this.readInt32(true, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    uint32le() {
        return this.readInt32(true, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    ulongle() {
        return this.readInt32(true, "little");
    }
    //
    //float read
    //
    /**
    * Read float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readFloat(endian) {
        this.check_size(4);
        var uint32Value = this.readInt32(true, (endian == undefined ? this.endian : endian));
        // Check if the value is negative (i.e., the most significant bit is set)
        const isNegative = (uint32Value & 0x80000000) !== 0 ? 1 : 0;
        // Extract the exponent and fraction parts
        const exponent = (uint32Value >> 23) & 0xFF;
        const fraction = uint32Value & 0x7FFFFF;
        // Calculate the float value
        let floatValue;
        if (exponent === 0) {
            // Denormalized number (exponent is 0)
            floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
        }
        else if (exponent === 0xFF) {
            // Infinity or NaN (exponent is 255)
            floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
        }
        else {
            // Normalized number
            floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
        }
        return floatValue;
    }
    /**
    * Read float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    float(endian) {
        return this.readFloat(endian);
    }
    /**
    * Read float
    *
    * @returns number
    */
    readFloatBE() {
        return this.readFloat("big");
    }
    /**
    * Read float
    *
    * @returns number
    */
    floatbe() {
        return this.readFloat("big");
    }
    /**
    * Read float
    *
    * @returns number
    */
    readFloatLE() {
        return this.readFloat("little");
    }
    /**
    * Read float
    *
    * @returns number
    */
    floatle() {
        return this.readFloat("little");
    }
    //
    //int64 reader
    //
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt64(unsigned, endian) {
        this.check_size(8);
        // Convert the byte array to a BigInt
        let value = BigInt(0);
        if ((endian == undefined ? this.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt(this.data[this.offset]) << BigInt(8 * i);
                this.offset += 1;
            }
            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
                return value;
            }
            else {
                return value;
            }
        }
        else {
            for (let i = 0; i < 8; i++) {
                value = (value << BigInt(8)) | BigInt(this.data[this.offset]);
                this.offset += 1;
            }
            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
                return value;
            }
            else {
                return value;
            }
        }
    }
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int64(unsigned, endian) {
        return this.readInt64(unsigned, endian);
    }
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    bigint(unsigned, endian) {
        return this.readInt64(unsigned, endian);
    }
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    quad(unsigned, endian) {
        return this.readInt64(unsigned, endian);
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64() {
        return this.readInt64(true);
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64() {
        return this.readInt64(true);
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigint() {
        return this.readInt64(true);
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquad() {
        return this.readInt64(true);
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    readInt64BE() {
        return this.readInt64(false, "big");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    int64be() {
        return this.readInt64(false, "big");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    bigintbe() {
        return this.readInt64(false, "big");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    quadbe() {
        return this.readInt64(false, "big");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64BE() {
        return this.readInt64(true, "big");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64be() {
        return this.readInt64(true, "big");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigintbe() {
        return this.readInt64(true, "big");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquadbe() {
        return this.readInt64(true, "big");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    readInt64LE() {
        return this.readInt64(false, "little");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    int64le() {
        return this.readInt64(false, "little");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    bigintle() {
        return this.readInt64(false, "little");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    quadle() {
        return this.readInt64(false, "little");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64LE() {
        return this.readInt64(true, "little");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64le() {
        return this.readInt64(true, "little");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigintle() {
        return this.readInt64(true, "little");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquadle() {
        return this.readInt64(true, "little");
    }
    //
    //doublefloat reader
    //
    /**
    * Read double float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readDoubleFloat(endian) {
        this.check_size(8);
        var uint64Value = this.readInt64(true, (endian == undefined ? this.endian : endian));
        const sign = (uint64Value & 0x8000000000000000n) >> 63n;
        const exponent = Number((uint64Value & 0x7ff0000000000000n) >> 52n) - 1023;
        const fraction = Number(uint64Value & 0x000fffffffffffffn) / Math.pow(2, 52);
        var floatValue;
        if (exponent == -1023) {
            if (fraction == 0) {
                floatValue = (sign == 0n) ? 0 : -0; // +/-0
            }
            else {
                // Denormalized number
                floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, -1022) * fraction;
            }
        }
        else if (exponent == 1024) {
            if (fraction == 0) {
                floatValue = (sign == 0n) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
            }
            else {
                floatValue = Number.NaN;
            }
        }
        else {
            // Normalized number
            floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
        }
        return floatValue;
    }
    /**
    * Read double float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    doublefloat(endian) {
        return this.readDoubleFloat(endian);
    }
    /**
    * Read double float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    dfloat(endian) {
        return this.readDoubleFloat(endian);
    }
    /**
    * Read double float
    *
    * @returns number
    */
    readDoubleFloatBE() {
        return this.readDoubleFloat("big");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    dfloatebe() {
        return this.readDoubleFloat("big");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    doublefloatbe() {
        return this.readDoubleFloat("big");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    readDoubleFloatLE() {
        return this.readDoubleFloat("little");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    dfloatle() {
        return this.readDoubleFloat("little");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    doublefloatle() {
        return this.readDoubleFloat("little");
    }
    //
    //string reader
    //
    /**
    * Reads string, use options object for different types
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
    readString(options) {
        var length = options && options.length;
        var stringType = options && options.stringType || 'utf-8';
        var terminateValue = options && options.terminateValue;
        var lengthReadSize = options && options.lengthReadSize || 1;
        var stripNull = options && options.stripNull || true;
        var encoding = options && options.encoding || 'utf-8';
        var endian = options && options.endian || this.endian;
        var terminate = terminateValue;
        if (length != undefined) {
            this.check_size(length);
        }
        if (typeof terminateValue == "number") {
            terminate = terminateValue & 0xFF;
        }
        else {
            if (terminateValue != undefined) {
                throw new Error("terminateValue must be a number");
            }
        }
        if (stringType == 'utf-8' || stringType == 'utf-16') {
            if (encoding == undefined) {
                if (stringType == 'utf-8') {
                    encoding = 'utf-8';
                }
                if (stringType == 'utf-16') {
                    encoding = 'utf-16';
                }
            }
            // Read the string as UTF-8 encoded untill 0 or terminateValue
            const encodedBytes = [];
            if (length == undefined && terminateValue == undefined) {
                terminate = 0;
            }
            var read_length = 0;
            if (length != undefined) {
                read_length = length;
            }
            else {
                read_length = this.data.length - this.offset;
            }
            for (let i = 0; i < read_length; i++) {
                if (stringType === 'utf-8') {
                    var read = this.readUByte();
                    if (read == terminate) {
                        break;
                    }
                    else {
                        if (!(stripNull == true && read == 0)) {
                            encodedBytes.push(read);
                        }
                    }
                }
                else {
                    var read = this.readInt16(true, endian);
                    var read1 = read & 0xFF;
                    var read2 = (read >> 8) & 0xFF;
                    if (read == terminate) {
                        break;
                    }
                    else {
                        if (!(stripNull == true && read == 0)) {
                            encodedBytes.push(read1);
                            encodedBytes.push(read2);
                        }
                    }
                }
            }
            return new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
        }
        else if (stringType == 'pascal' || stringType == 'wide-pascal') {
            if (encoding == undefined) {
                if (stringType == 'pascal') {
                    encoding = 'utf-8';
                }
                if (stringType == 'wide-pascal') {
                    encoding = 'utf-16';
                }
            }
            var maxBytes;
            if (lengthReadSize == 1) {
                maxBytes = this.readUByte();
            }
            else if (lengthReadSize == 2) {
                maxBytes = this.readInt16(true, endian);
            }
            else if (lengthReadSize == 4) {
                maxBytes = this.readInt32(true, endian);
            }
            else {
                throw new Error("Invalid length read size: " + lengthReadSize);
            }
            // Read the string as Pascal or Delphi encoded
            const encodedBytes = [];
            for (let i = 0; i < maxBytes; i++) {
                if (stringType == 'wide-pascal') {
                    const read = this.readInt16(true, endian);
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read);
                    }
                }
                else {
                    const read = this.readUByte();
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read);
                    }
                }
            }
            var str_return;
            if (stringType == 'wide-pascal') {
                str_return = new TextDecoder(encoding).decode(new Uint16Array(encodedBytes));
            }
            else {
                str_return = new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
            }
            return str_return;
        }
        else {
            throw new Error('Unsupported string type: ' + stringType);
        }
    }
    string(options) {
        return this.readString(options);
    }
    /**
    * Reads UTF-8 (C) string
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
    * Reads UTF-8 (C) string
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
    * Reads ANSI string
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
    * Reads UTF-16 (Unicode) string
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
    * Reads UTF-16 (Unicode) string
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
    * Reads UTF-16 (Unicode) string in little endian order
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
    * Reads UTF-16 (Unicode) string in little endian order
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
    * Reads UTF-16 (Unicode) string in big endian order
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
    * Reads UTF-16 (Unicode) string in big endian order
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
    * Reads Pascal string
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
    * Reads Pascal string 1 byte length read
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
    * Reads Pascal string 1 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 1 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Pascal string 2 byte length read
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
    * Reads Pascal string 2 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 2 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Pascal string 4 byte length read
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
    * Reads Pascal string 4 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 4 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Wide-Pascal string
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
    * Reads Wide-Pascal string 1 byte length read
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
    * Reads Wide-Pascal string 2 byte length read
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
    * Reads Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 4 byte length read
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
    * Reads Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull });
    }
}
//# sourceMappingURL=reader.js.map