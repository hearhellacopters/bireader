/**
* Binary writer, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
* @param {number} byteOffset - byte offset to start writer, default is 0
* @param {number} bitOffset - bit offset to start writer, 0-7
* @param {string} endianness - endianness ``big`` or ``little`` (default little)
* @param {boolean} strict - strict mode: if true does not extend supplied array on outside write (default false)
*/
export default class biwriter {
    isBuffer(obj) {
        return (typeof Buffer !== 'undefined' && obj instanceof Buffer);
    }
    isBufferOrUint8Array(obj) {
        return obj instanceof Uint8Array || this.isBuffer(obj);
    }
    extendArray(to_padd) {
        if ((typeof Buffer !== 'undefined' && this.data instanceof Buffer)) {
            var paddbuffer = Buffer.alloc(to_padd);
            this.data = Buffer.concat([this.data, paddbuffer]);
        }
        else {
            const addArray = new Array(to_padd);
            this.data = new Uint8Array([...this.data, ...addArray]);
        }
    }
    check_size(write_bytes, write_bit, offset) {
        const bits = (write_bit || 0) + this.bitoffset;
        var new_off = (offset || this.offset);
        var writesize = write_bytes || 0;
        if (bits != 0) {
            //add bits
            writesize += Math.ceil(bits / 8);
        }
        //if biger extend
        const needed_size = new_off + writesize;
        if (needed_size > this.size) {
            const dif = needed_size - this.size;
            if (this.strict == false) {
                this.extendArray(dif);
            }
            else {
                throw new Error("Location outside of size of data: " + this.size);
            }
            this.size = this.data.length;
        }
        //start read location
        this.offset = new_off;
    }
    /**
    * Binary writer, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
    * @param {number} byteOffset - byte offset to start writer, default is 0
    * @param {number} bitOffset - bit offset to start writer, 0-7
    * @param {string} endianness - endianness ``big`` or ``little`` (default little)
    * @param {boolean} strict - strict mode: if true does not extend supplied array on outside write (default false)
    */
    constructor(data, byteOffset, bitOffset, endianness, strict) {
        this.endian = "little";
        this.offset = 0;
        this.bitoffset = 0;
        this.size = 0;
        this.strict = false;
        this.data = [];
        if (endianness != undefined && typeof endianness != "string") {
            throw new Error("endianness must be big or little");
        }
        if (endianness != undefined && !(endianness == "big" || endianness == "little")) {
            throw new Error("Endianness must be big or little");
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
            this.bitoffset = (bitOffset % 8);
        }
        if (typeof strict == "boolean") {
            this.strict = strict;
        }
        else {
            if (strict != undefined) {
                throw new Error("Strict mode must be true of false");
            }
        }
        if (data == undefined) {
            throw new Error("Data required");
        }
        else {
            if (!this.isBufferOrUint8Array(this.data)) {
                throw new Error("Write data must be Uint8Array or Buffer");
            }
        }
        this.data = data;
        this.size = this.data.length + ((bitOffset || 0) % 8);
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
    *
    * Sets endian to big
    */
    bigEndian() {
        this.endianness("big");
    }
    /**
    *
    * Sets endian to big
    */
    big() {
        this.endianness("big");
    }
    /**
    *
    * Sets endian to big
    */
    be() {
        this.endianness("big");
    }
    /**
    *
    * Sets endian to little
    */
    littleEndian() {
        this.endianness("little");
    }
    /**
    *
    * Sets endian to little
    */
    little() {
        this.endianness("little");
    }
    /**
    *
    * Sets endian to little
    */
    le() {
        this.endianness("little");
    }
    /**
    * Move current write byte or bit position, will extend data if outside of current size
    *
    * @param {number} bytes - bytes to skip
    * @param {number} bits - bits to skip (0-7)
    */
    skip(bytes, bits) {
        this.check_size(bytes, bits);
        this.offset += (bytes || 0);
        this.bitoffset += (bits || 0) % 8;
    }
    /**
    * Move current write byte or bit position, will extend data if outside of current size
    *
    * @param {number} bytes - bytes to skip
    * @param {number} bits - bits to skip (0-7)
    */
    fskip(bytes, bits) {
        this.check_size(bytes, bits);
        this.offset += (bytes || 0);
        this.bitoffset += (bits || 0) % 8;
    }
    /**
    * Change current byte or bit write position, will extend data if outside of current size
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    goto(byte, bit) {
        const new_size = (byte + Math.ceil((bit || 0) / 8));
        if (new_size > this.size && this.strict == false) {
            this.extendArray(new_size - this.size);
        }
        else {
            throw new Error("Outside of range of data: " + this.size);
        }
        this.offset = byte;
        this.bitoffset = (bit || 0) % 8;
    }
    /**
    * Change current byte or bit write position, will extend data if outside of current size
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    seek(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change current byte or bit write position, will extend data if outside of current size
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    fseek(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change current byte or bit write position, will extend data if outside of current size
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    jump(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change current byte or bit write position, will extend data if outside of current size
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    pointer(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change current byte or bit write position, will extend data if outside of current size
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    warp(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change current byte or bit write position, will extend data if outside of current size
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    fsetpos(byte, bit) {
        return this.goto(byte, bit);
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
    * Disallows extending array if writing outside of max size
    */
    restrict() {
        this.strict = true;
    }
    /**
    * Allows extending array if writing outside of max size
    */
    unrestrict() {
        this.strict = false;
    }
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    */
    clip(startOffset, endOffset) {
        if ((endOffset || this.offset) > this.size) {
            if (this.strict == false) {
                this.extendArray((endOffset || this.offset) - this.size);
            }
            else {
                throw new Error("End offset outside of data: " + this.size);
            }
        }
        return this.data.slice(Math.abs(startOffset || 0), endOffset || this.offset);
    }
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    */
    crop(startOffset, endOffset) {
        if ((endOffset || this.offset) > this.size) {
            if (this.strict == false) {
                this.extendArray((endOffset || this.offset) - this.size);
            }
            else {
                throw new Error("End offset outside of data: " + this.size);
            }
        }
        return this.data.slice(Math.abs(startOffset || 0), endOffset || this.offset);
    }
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    */
    truncate(startOffset, endOffset) {
        if ((endOffset || this.offset) > this.size) {
            if (this.strict == false) {
                this.extendArray((endOffset || this.offset) - this.size);
            }
            else {
                throw new Error("End offset outside of data: " + this.size);
            }
        }
        return this.data.slice(Math.abs(startOffset || 0), endOffset || this.offset);
    }
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    slice(startOffset, endOffset) {
        if ((endOffset || this.offset) > this.size) {
            if (this.strict == false) {
                this.extendArray((endOffset || this.offset) - this.size);
            }
            else {
                throw new Error("End offset outside of data: " + this.size);
            }
        }
        return this.data.slice(Math.abs(startOffset || 0), endOffset || this.offset);
    }
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    extract(length) {
        if (this.offset + (length || 0) > this.size) {
            if (this.strict == false) {
                this.extendArray(this.offset + (length || 0) - this.size);
            }
            else {
                throw new Error("End offset outside of data: " + this.size);
            }
        }
        return this.data.slice(this.offset, this.offset + (length || 0));
    }
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    wrap(length) {
        return this.extract(length);
    }
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    lift(length) {
        return this.extract(length);
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
    * removes writing data
    */
    end() {
        this.data = undefined;
    }
    /**
    * removes writing data
    */
    close() {
        this.data = undefined;
    }
    /**
    * removes writing data
    */
    done() {
        this.data = undefined;
    }
    /**
    * removes writing data
    */
    finished() {
        this.data = undefined;
    }
    //
    //bit writer
    //
    /**
    *
    * Write bits, must have at least value and number of bits
    *
    * ``Note``: When returning to a byte write, remaining bits are skipped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeBit(value, bits, offsetBits, offsetBytes, unsigned, endian) {
        if (value == undefined) {
            throw new Error('Must supply value.');
        }
        if (bits == undefined) {
            throw new Error('Must supply bits.');
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32.');
        }
        if (unsigned == true) {
            if (value < 0 || value > Math.pow(2, bits)) {
                throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + 0 + " max: " + Math.pow(2, bits) + " value: " + value);
            }
        }
        else {
            const maxValue = Math.pow(2, bits - 1) - 1;
            const minValue = -maxValue - 1;
            if (value < minValue || value > maxValue) {
                throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + minValue + " max: " + maxValue + " value: " + value);
            }
        }
        if (unsigned == true) {
            const maxValue = Math.pow(2, bits) - 1;
            value = value & maxValue;
        }
        const size_needed = (((((offsetBits || 0) + (bits - 1)) + this.bitoffset) / 8) + (offsetBytes || this.offset));
        if (size_needed > this.size) {
            //add size
            this.extendArray(size_needed - this.size);
        }
        var off_in_bits = (this.offset * 8) + this.bitoffset;
        for (var i = 0; i < bits;) {
            var remaining = bits - i;
            var bitOffset = off_in_bits & 7;
            var byteOffset = off_in_bits >> 3;
            var written = Math.min(remaining, 8 - bitOffset);
            var mask, writeBits, destMask;
            if ((endian != undefined ? endian : this.endian) == "big") {
                mask = ~(~0 << written);
                writeBits = (value >> (bits - i - written)) & mask;
                var destShift = 8 - bitOffset - written;
                destMask = ~(mask << destShift);
                this.data[byteOffset] = (this.data[byteOffset] & destMask) | (writeBits << destShift);
            }
            else {
                mask = ~(0xFF << written);
                writeBits = value & mask;
                value >>= written;
                destMask = ~(mask << bitOffset);
                this.data[byteOffset] = (this.data[byteOffset] & destMask) | (writeBits << bitOffset);
            }
            off_in_bits += written;
            i += written;
        }
        this.offset = this.offset + Math.floor(((bits) + this.bitoffset) / 8); //end byte
        this.bitoffset = ((bits) + this.bitoffset) % 8;
    }
    /**
    *
    * Write bits, must have at least value and number of bits
    *
    * ``Note``: When returning to a byte write, remaining bits are skipped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    bit(value, bits, offsetBits, offsetBytes, unsigned, endian) {
        return this.writeBit(value, bits, offsetBits, offsetBytes, unsigned, endian);
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit1(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 1, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit1(value, offsetBits, offsetBytes) {
        return this.bit(value, 1, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit1le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 1, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit1le(value, offsetBits, offsetBytes) {
        return this.bit(value, 1, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit1be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 1, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit1be(value, offsetBits, offsetBytes) {
        return this.bit(value, 1, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit2(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 2, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit2(value, offsetBits, offsetBytes) {
        return this.bit(value, 2, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit2le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 2, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit2le(value, offsetBits, offsetBytes) {
        return this.bit(value, 2, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit2be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 2, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit2be(value, offsetBits, offsetBytes) {
        return this.bit(value, 2, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit3(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 3, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit3(value, offsetBits, offsetBytes) {
        return this.bit(value, 3, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit3le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 3, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit3le(value, offsetBits, offsetBytes) {
        return this.bit(value, 3, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit3be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 3, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit3be(value, offsetBits, offsetBytes) {
        return this.bit(value, 3, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit4(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 4, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit4(value, offsetBits, offsetBytes) {
        return this.bit(value, 4, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit4le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 4, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit4le(value, offsetBits, offsetBytes) {
        return this.bit(value, 4, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit4be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 4, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit4be(value, offsetBits, offsetBytes) {
        return this.bit(value, 4, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit5(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 5, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit5(value, offsetBits, offsetBytes) {
        return this.bit(value, 5, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit5le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 5, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit5le(value, offsetBits, offsetBytes) {
        return this.bit(value, 5, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit5be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 5, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit5be(value, offsetBits, offsetBytes) {
        return this.bit(value, 5, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit6(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 6, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit6(value, offsetBits, offsetBytes) {
        return this.bit(value, 6, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit6le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 6, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit6le(value, offsetBits, offsetBytes) {
        return this.bit(value, 6, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit6be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 6, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit6be(value, offsetBits, offsetBytes) {
        return this.bit(value, 6, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit7(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 7, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit7(value, offsetBits, offsetBytes) {
        return this.bit(value, 7, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit7le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 7, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit7le(value, offsetBits, offsetBytes) {
        return this.bit(value, 7, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit7be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 7, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit7be(value, offsetBits, offsetBytes) {
        return this.bit(value, 7, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit8(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 8, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit8(value, offsetBits, offsetBytes) {
        return this.bit(value, 8, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit8le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 8, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit8le(value, offsetBits, offsetBytes) {
        return this.bit(value, 8, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit8be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 8, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit8be(value, offsetBits, offsetBytes) {
        return this.bit(value, 8, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit9(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 9, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit9(value, offsetBits, offsetBytes) {
        return this.bit(value, 9, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit9le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 9, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit9le(value, offsetBits, offsetBytes) {
        return this.bit(value, 9, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit9be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 9, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit9be(value, offsetBits, offsetBytes) {
        return this.bit(value, 9, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit10(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 10, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit10(value, offsetBits, offsetBytes) {
        return this.bit(value, 10, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit10le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 10, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit10le(value, offsetBits, offsetBytes) {
        return this.bit(value, 10, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit10be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 10, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit10be(value, offsetBits, offsetBytes) {
        return this.bit(value, 10, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit11(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 11, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit11(value, offsetBits, offsetBytes) {
        return this.bit(value, 11, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit11le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 11, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit11le(value, offsetBits, offsetBytes) {
        return this.bit(value, 11, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit11be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 11, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit11be(value, offsetBits, offsetBytes) {
        return this.bit(value, 11, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit12(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 12, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit12(value, offsetBits, offsetBytes) {
        return this.bit(value, 12, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit12le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 12, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit12le(value, offsetBits, offsetBytes) {
        return this.bit(value, 12, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit12be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 12, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit12be(value, offsetBits, offsetBytes) {
        return this.bit(value, 12, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit13(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 13, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit13(value, offsetBits, offsetBytes) {
        return this.bit(value, 13, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit13le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 13, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit13le(value, offsetBits, offsetBytes) {
        return this.bit(value, 13, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit13be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 13, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit13be(value, offsetBits, offsetBytes) {
        return this.bit(value, 13, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit14(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 14, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit14(value, offsetBits, offsetBytes) {
        return this.bit(value, 14, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit14le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 14, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit14le(value, offsetBits, offsetBytes) {
        return this.bit(value, 14, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit14be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 14, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit14be(value, offsetBits, offsetBytes) {
        return this.bit(value, 14, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit15(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 15, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit15(value, offsetBits, offsetBytes) {
        return this.bit(value, 15, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit15le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 15, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit15le(value, offsetBits, offsetBytes) {
        return this.bit(value, 15, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit15be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 15, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit15be(value, offsetBits, offsetBytes) {
        return this.bit(value, 15, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit16(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 16, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit16(value, offsetBits, offsetBytes) {
        return this.bit(value, 16, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit16le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 16, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit16le(value, offsetBits, offsetBytes) {
        return this.bit(value, 16, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit16be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 16, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit16be(value, offsetBits, offsetBytes) {
        return this.bit(value, 16, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit17(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 17, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit17(value, offsetBits, offsetBytes) {
        return this.bit(value, 17, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit17le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 17, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit17le(value, offsetBits, offsetBytes) {
        return this.bit(value, 17, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit17be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 17, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit17be(value, offsetBits, offsetBytes) {
        return this.bit(value, 17, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit18(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 18, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit18(value, offsetBits, offsetBytes) {
        return this.bit(value, 18, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit18le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 18, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit18le(value, offsetBits, offsetBytes) {
        return this.bit(value, 18, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit18be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 18, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit18be(value, offsetBits, offsetBytes) {
        return this.bit(value, 18, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit19(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 19, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit19(value, offsetBits, offsetBytes) {
        return this.bit(value, 19, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit19le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 19, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit19le(value, offsetBits, offsetBytes) {
        return this.bit(value, 19, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit19be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 19, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit19be(value, offsetBits, offsetBytes) {
        return this.bit(value, 19, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit20(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 20, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit20(value, offsetBits, offsetBytes) {
        return this.bit(value, 20, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit20le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 20, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit20le(value, offsetBits, offsetBytes) {
        return this.bit(value, 20, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit20be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 20, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit20be(value, offsetBits, offsetBytes) {
        return this.bit(value, 20, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit21(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit21(value, offsetBits, offsetBytes) {
        return this.bit(value, 21, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit21le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit21le(value, offsetBits, offsetBytes) {
        return this.bit(value, 21, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit21be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit21be(value, offsetBits, offsetBytes) {
        return this.bit(value, 21, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit22(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit22(value, offsetBits, offsetBytes) {
        return this.bit(value, 22, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit22le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit22le(value, offsetBits, offsetBytes) {
        return this.bit(value, 22, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit22be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit22be(value, offsetBits, offsetBytes) {
        return this.bit(value, 22, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit23(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 23, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit23(value, offsetBits, offsetBytes) {
        return this.bit(value, 23, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit23le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 23, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit23le(value, offsetBits, offsetBytes) {
        return this.bit(value, 23, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit23be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 23, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit23be(value, offsetBits, offsetBytes) {
        return this.bit(value, 23, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit24(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 24, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit24(value, offsetBits, offsetBytes) {
        return this.bit(value, 24, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit24le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 24, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit24le(value, offsetBits, offsetBytes) {
        return this.bit(value, 24, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit24be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 24, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit24be(value, offsetBits, offsetBytes) {
        return this.bit(value, 24, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit25(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 25, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit25(value, offsetBits, offsetBytes) {
        return this.bit(value, 25, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit25le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 25, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit25le(value, offsetBits, offsetBytes) {
        return this.bit(value, 25, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit25be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 25, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit25be(value, offsetBits, offsetBytes) {
        return this.bit(value, 25, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit26(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 26, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit26(value, offsetBits, offsetBytes) {
        return this.bit(value, 26, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit26le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 26, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit26le(value, offsetBits, offsetBytes) {
        return this.bit(value, 26, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit26be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 26, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit26be(value, offsetBits, offsetBytes) {
        return this.bit(value, 26, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit27(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 27, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit27(value, offsetBits, offsetBytes) {
        return this.bit(value, 27, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit27le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 27, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit27le(value, offsetBits, offsetBytes) {
        return this.bit(value, 27, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit27be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 27, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit27be(value, offsetBits, offsetBytes) {
        return this.bit(value, 27, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit28(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 28, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit28(value, offsetBits, offsetBytes) {
        return this.bit(value, 28, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit28le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 28, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit28le(value, offsetBits, offsetBytes) {
        return this.bit(value, 28, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit28be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 28, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit28be(value, offsetBits, offsetBytes) {
        return this.bit(value, 28, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit29(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 29, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit29(value, offsetBits, offsetBytes) {
        return this.bit(value, 29, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit29le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 29, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit29le(value, offsetBits, offsetBytes) {
        return this.bit(value, 29, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit29be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 29, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit29be(value, offsetBits, offsetBytes) {
        return this.bit(value, 29, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit30(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 30, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit30(value, offsetBits, offsetBytes) {
        return this.bit(value, 30, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit30le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 30, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit30le(value, offsetBits, offsetBytes) {
        return this.bit(value, 30, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit30be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 30, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit30be(value, offsetBits, offsetBytes) {
        return this.bit(value, 30, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit31(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 31, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit31(value, offsetBits, offsetBytes) {
        return this.bit(value, 31, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit31le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 31, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit31le(value, offsetBits, offsetBytes) {
        return this.bit(value, 31, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit31be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 31, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit31be(value, offsetBits, offsetBytes) {
        return this.bit(value, 31, offsetBits, offsetBytes, true, "big");
    }
    /**
* Bit field writer
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit32(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit32(value, offsetBits, offsetBytes) {
        return this.bit(value, 32, offsetBits, offsetBytes, true);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit32le(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit32le(value, offsetBits, offsetBytes) {
        return this.bit(value, 32, offsetBits, offsetBytes, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit32be(value, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit32be(value, offsetBits, offsetBytes) {
        return this.bit(value, 32, offsetBits, offsetBytes, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    writeBitBE(value, bits, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, bits, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bitbe(value, bits, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, bits, offsetBits, offsetBytes, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    writeBitLE(value, bits, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, bits, offsetBits, offsetBytes, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bitle(value, bits, offsetBits, offsetBytes, unsigned) {
        return this.bit(value, bits, offsetBits, offsetBytes, unsigned, "little");
    }
    //
    //byte write
    //
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    */
    writeByte(value, offset, unsigned) {
        this.check_size(1, 0, offset);
        if (unsigned == true) {
            if (value < 0 || value > 255) {
                throw new Error('Value is out of range for the specified 8bit length.' + " min: " + 0 + " max: " + 255 + " value: " + value);
            }
        }
        else {
            const maxValue = Math.pow(2, 8 - 1) - 1;
            const minValue = -maxValue - 1;
            if (value < minValue || value > maxValue) {
                throw new Error('Value is out of range for the specified 8bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
            }
        }
        this.data[this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        this.offset += 1;
    }
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    */
    byte(value, offset, unsigned) {
        return this.writeByte(value, offset, unsigned);
    }
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    */
    int8(value, offset, unsigned) {
        return this.writeByte(value, offset, unsigned);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUByte(value, offset) {
        return this.writeByte(value, offset, true);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint8(value, offset) {
        return this.writeByte(value, offset, true);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ubyte(value, offset) {
        return this.writeByte(value, offset, true);
    }
    //
    //short writes
    //
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt16(value, offset, unsigned, endian) {
        this.check_size(2, 0, offset);
        if (unsigned == true) {
            if (value < 0 || value > 65535) {
                throw new Error('Value is out of range for the specified 16bit length.' + " min: " + 0 + " max: " + 65535 + " value: " + value);
            }
        }
        else {
            const maxValue = Math.pow(2, 16 - 1) - 1;
            const minValue = -maxValue - 1;
            if (value < minValue || value > maxValue) {
                throw new Error('Value is out of range for the specified 16bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
            }
        }
        if ((endian != undefined ? endian : this.endian) == "little") {
            this.data[this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
            this.data[this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
        }
        else {
            this.data[this.offset] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
            this.data[this.offset + 1] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
        }
        this.offset += 2;
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int16(value, offset, unsigned, endian) {
        return this.writeInt16(value, offset, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    short(value, offset, unsigned, endian) {
        return this.writeInt16(value, offset, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    word(value, offset, unsigned, endian) {
        return this.writeInt16(value, offset, unsigned, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt16(value, offset, endian) {
        return this.writeInt16(value, offset, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    uint16(value, offset, endian) {
        return this.writeInt16(value, offset, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    ushort(value, offset, endian) {
        return this.writeInt16(value, offset, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    uword(value, offset, endian) {
        return this.writeInt16(value, offset, true, endian);
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt16BE(value, offset) {
        return this.writeInt16(value, offset, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int16be(value, offset) {
        return this.writeInt16(value, offset, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    shortbe(value, offset) {
        return this.writeInt16(value, offset, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    wordbe(value, offset) {
        return this.writeInt16(value, offset, false, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt16BE(value, offset) {
        return this.writeInt16(value, offset, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint16be(value, offset) {
        return this.writeInt16(value, offset, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ushortbe(value, offset) {
        return this.writeInt16(value, offset, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uwordbe(value, offset) {
        return this.writeInt16(value, offset, true, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt16LE(value, offset) {
        return this.writeInt16(value, offset, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int16le(value, offset) {
        return this.writeInt16(value, offset, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    shortle(value, offset) {
        return this.writeInt16(value, offset, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    wordle(value, offset) {
        return this.writeInt16(value, offset, false, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt16LE(value, offset) {
        return this.writeInt16(value, offset, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint16le(value, offset) {
        return this.writeInt16(value, offset, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ushortle(value, offset) {
        return this.writeInt16(value, offset, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uwordle(value, offset) {
        return this.writeInt16(value, offset, true, "little");
    }
    //
    //half float
    //
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeHalfFloat(value, offset, endian) {
        this.check_size(2, 0, offset);
        const maxValue = 65504;
        const minValue = 5.96e-08;
        if (value < minValue || value > maxValue) {
            throw new Error('Value is out of range for the specified half float length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
        const signMask = 0x8000;
        const exponentMask = 0x7C00;
        const fractionMask = 0x03FF;
        // Determine sign, exponent, and fraction bits
        let signBit = (value & signMask) >> 15;
        let exponentBits = (value & exponentMask) >> 10;
        let fractionBits = value & fractionMask;
        // Special cases for NaN and Infinity
        if (exponentBits === 0x1F) {
            // NaN or Infinity, copy exponent and fraction
            exponentBits = 0xFF;
        }
        else if (exponentBits === 0x00) {
            // Denormalized numbers, exponent is 0, adjust exponent bits
            exponentBits = 0x00;
            fractionBits = 0x00; // Clear fraction for denormals
        }
        else {
            // Normalized number, subtract exponent bias
            exponentBits -= 15;
        }
        // Combine sign, exponent, and fraction bits into half float format
        let halfFloatBits = (signBit << 15) | (exponentBits << 10) | fractionBits;
        // Write bytes based on endianness
        if ((endian = undefined ? endian : this.endian) == "little") {
            this.data[this.offset] = halfFloatBits & 0xFF;
            this.data[this.offset + 1] = (halfFloatBits >> 8) & 0xFF;
        }
        else {
            this.data[this.offset] = (halfFloatBits >> 8) & 0xFF;
            this.data[this.offset + 1] = halfFloatBits & 0xFF;
        }
        this.offset += 2;
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    half(value, offset, endian) {
        return this.writeHalfFloat(value, offset, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    halffloat(value, offset, endian) {
        return this.writeHalfFloat(value, offset, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeHalfFloatBE(value, offset) {
        return this.writeHalfFloat(value, offset, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    halffloatbe(value, offset) {
        return this.writeHalfFloat(value, offset, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    halfbe(value, offset) {
        return this.writeHalfFloat(value, offset, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeHalfFloatLE(value, offset) {
        return this.writeHalfFloat(value, offset, "little");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    halffloatle(value, offset) {
        return this.writeHalfFloat(value, offset, "little");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    halfle(value, offset) {
        return this.writeHalfFloat(value, offset, "little");
    }
    //
    //int32 write
    //
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt32(value, offset, unsigned, endian) {
        this.check_size(4, 0, offset);
        if (unsigned == true) {
            if (value < 0 || value > 4294967295) {
                throw new Error('Value is out of range for the specified 32bit length.' + " min: " + 0 + " max: " + 4294967295 + " value: " + value);
            }
        }
        else {
            const maxValue = Math.pow(2, 32 - 1) - 1;
            const minValue = -maxValue - 1;
            if (value < minValue || value > maxValue) {
                throw new Error('Value is out of range for the specified 32bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
            }
        }
        if ((endian = undefined ? endian : this.endian) == "little") {
            this.data[this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
            this.data[this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            this.data[this.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            this.data[this.offset + 3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        }
        else {
            this.data[this.offset] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
            this.data[this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            this.data[this.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            this.data[this.offset + 3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        }
        this.offset += 4;
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int(value, offset, unsigned, endian) {
        return this.writeInt32(value, offset, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int32(value, offset, unsigned, endian) {
        return this.writeInt32(value, offset, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    double(value, offset, unsigned, endian) {
        return this.writeInt32(value, offset, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    long(value, offset, unsigned, endian) {
        return this.writeInt32(value, offset, unsigned, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt32(value, offset, endian) {
        return this.writeInt32(value, offset, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    uint32(value, offset, endian) {
        return this.writeInt32(value, offset, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    uint(value, offset, endian) {
        return this.writeInt32(value, offset, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    udouble(value, offset, endian) {
        return this.writeInt32(value, offset, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    ulong(value, offset, endian) {
        return this.writeInt32(value, offset, true, endian);
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt32LE(value, offset) {
        return this.writeInt32(value, offset, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int32le(value, offset) {
        return this.writeInt32(value, offset, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    intle(value, offset) {
        return this.writeInt32(value, offset, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    doublele(value, offset) {
        return this.writeInt32(value, offset, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    longle(value, offset) {
        return this.writeInt32(value, offset, false, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt32LE(value, offset) {
        return this.writeInt32(value, offset, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint32le(value, offset) {
        return this.writeInt32(value, offset, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uintle(value, offset) {
        return this.writeInt32(value, offset, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    udoublele(value, offset) {
        return this.writeInt32(value, offset, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ulongle(value, offset) {
        return this.writeInt32(value, offset, true, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt32BE(value, offset) {
        return this.writeInt32(value, offset, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    intbe(value, offset) {
        return this.writeInt32(value, offset, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int32be(value, offset) {
        return this.writeInt32(value, offset, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    doublebe(value, offset) {
        return this.writeInt32(value, offset, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    longbe(value, offset) {
        return this.writeInt32(value, offset, false, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt32BE(value, offset) {
        return this.writeInt32(value, offset, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint32be(value, offset) {
        return this.writeInt32(value, offset, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uintbe(value, offset) {
        return this.writeInt32(value, offset, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    udoublebe(value, offset) {
        return this.writeInt32(value, offset, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ulongbe(value, offset) {
        return this.writeInt32(value, offset, true, "big");
    }
    //
    //float write
    //
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeFloat(value, offset, endian) {
        this.check_size(4, 0, offset);
        const maxValue = 3.402823466e+38;
        const minValue = 1.175494351e-38;
        if (value < minValue || value > maxValue) {
            throw new Error('Value is out of range for the specified float length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
        let intValue = Float32Array.from([value])[0]; // Convert float to 32-bit integer representation
        let shift = 0;
        for (let i = 0; i < 4; i++) {
            if ((endian = undefined ? endian : this.endian) == "little") {
                this.data[this.offset + i] = (intValue >> shift) & 0xFF;
            }
            else {
                this.data[this.offset + (3 - i)] = (intValue >> shift) & 0xFF;
            }
            shift += 8;
        }
        this.offset += 4;
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    float(value, offset, endian) {
        return this.writeFloat(value, offset, endian);
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeFloatLE(value, offset) {
        return this.writeFloat(value, offset, "little");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    floatle(value, offset) {
        return this.writeFloat(value, offset, "little");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeFloatBE(value, offset) {
        return this.writeFloat(value, offset, "big");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    floatbe(value, offset) {
        return this.writeFloat(value, offset, "big");
    }
    //
    //int64 write
    //
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt64(value, offset, unsigned, endian) {
        this.check_size(8, 0, offset);
        if (unsigned == true) {
            if (value < 0 || value > Math.pow(2, 64) - 1) {
                throw new Error('Value is out of range for the specified 64bit length.' + " min: " + 0 + " max: " + (Math.pow(2, 64) - 1) + " value: " + value);
            }
        }
        else {
            const maxValue = Math.pow(2, 63) - 1;
            const minValue = -Math.pow(2, 63);
            if (value < minValue || value > maxValue) {
                throw new Error('Value is out of range for the specified 64bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
            }
        }
        // Convert the BigInt to a 64-bit signed integer
        const bigIntArray = new BigInt64Array(1);
        bigIntArray[0] = BigInt(value);
        // Use two 32-bit views to write the Int64
        const int32Array = new Int32Array(bigIntArray.buffer);
        for (let i = 0; i < 2; i++) {
            if ((endian = undefined ? endian : this.endian) == "little") {
                if (unsigned == undefined || unsigned == false) {
                    this.data[this.offset + i * 4 + 0] = int32Array[i];
                    this.data[this.offset + i * 4 + 1] = (int32Array[i] >> 8);
                    this.data[this.offset + i * 4 + 2] = (int32Array[i] >> 16);
                    this.data[this.offset + i * 4 + 3] = (int32Array[i] >> 24);
                }
                else {
                    this.data[this.offset + i * 4 + 0] = int32Array[i] & 0xFF;
                    this.data[this.offset + i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                    this.data[this.offset + i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                    this.data[this.offset + i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            }
            else {
                if (unsigned == undefined || unsigned == false) {
                    this.data[this.offset + (1 - i) * 4 + 0] = int32Array[i];
                    this.data[this.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 8);
                    this.data[this.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 16);
                    this.data[this.offset + (1 - i) * 4 + 3] = (int32Array[i] >> 24);
                }
                else {
                    this.data[this.offset + (1 - i) * 4 + 0] = int32Array[i] & 0xFF;
                    this.data[this.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                    this.data[this.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                    this.data[this.offset + (1 - i) * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            }
        }
        this.offset += 8;
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int64(value, offset, unsigned, endian) {
        return this.writeInt64(value, offset, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    quad(value, offset, unsigned, endian) {
        return this.writeInt64(value, offset, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    bigint(value, offset, unsigned, endian) {
        return this.writeInt64(value, offset, unsigned, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt64(value, offset, endian) {
        return this.writeInt64(value, offset, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    uint64(value, offset, endian) {
        return this.writeInt64(value, offset, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    ubigint(value, offset, endian) {
        return this.writeInt64(value, offset, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    uquad(value, offset, endian) {
        return this.writeInt64(value, offset, true, endian);
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt64LE(value, offset) {
        return this.writeInt64(value, offset, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int64le(value, offset) {
        return this.writeInt64(value, offset, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    bigintle(value, offset) {
        return this.writeInt64(value, offset, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    quadle(value, offset) {
        return this.writeInt64(value, offset, false, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt64LE(value, offset) {
        return this.writeInt64(value, offset, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint64le(value, offset) {
        return this.writeInt64(value, offset, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ubigintle(value, offset) {
        return this.writeInt64(value, offset, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uquadle(value, offset) {
        return this.writeInt64(value, offset, true, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt64BE(value, offset) {
        return this.writeInt64(value, offset, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int64be(value, offset) {
        return this.writeInt64(value, offset, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    bigintbe(value, offset) {
        return this.writeInt64(value, offset, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    quadbe(value, offset) {
        return this.writeInt64(value, offset, false, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt64BE(value, offset) {
        return this.writeInt64(value, offset, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint64be(value, offset) {
        return this.writeInt64(value, offset, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ubigintbe(value, offset) {
        return this.writeInt64(value, offset, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uquadbe(value, offset) {
        return this.writeInt64(value, offset, true, "big");
    }
    //
    //doublefloat reader
    //
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeDoubleFloat(value, offset, endian) {
        this.check_size(8, 0, offset);
        const maxValue = 1.7976931348623158e308;
        const minValue = 2.2250738585072014e-308;
        if (value < minValue || value > maxValue) {
            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
        const intArray = new Int32Array(2);
        const floatArray = new Float64Array(intArray.buffer);
        floatArray[0] = value;
        const bytes = new Uint8Array(intArray.buffer);
        for (let i = 0; i < 8; i++) {
            if ((endian = undefined ? endian : this.endian) == "little") {
                this.data[this.offset + i] = bytes[i];
            }
            else {
                this.data[this.offset + (7 - i)] = bytes[i];
            }
        }
        this.offset += 8;
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    doublefloat(value, offset, endian) {
        return this.writeDoubleFloat(value, offset, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    dfloat(value, offset, endian) {
        return this.writeDoubleFloat(value, offset, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeDoubleFloatBE(value, offset) {
        return this.writeDoubleFloat(value, offset, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    dfloatbe(value, offset) {
        return this.writeDoubleFloat(value, offset, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    doublefloatbe(value, offset) {
        return this.writeDoubleFloat(value, offset, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeDoubleFloatLE(value, offset) {
        return this.writeDoubleFloat(value, offset, "little");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    dfloatle(value, offset) {
        return this.writeDoubleFloat(value, offset, "little");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    doublefloatle(value, offset) {
        return this.writeDoubleFloat(value, offset, "little");
    }
    //
    //string
    //
    /**
    * Writes string, use options object for different types
    *
    *
    * @param {string} string - text string
    * @param {object} options - options:
    * ```javascript
    * {
    *  offset: 0, //byte offset from current position
    *  length: string.length,  //for fixed length, non-terminate value utf strings
    *  stringType: "utf-8", //utf-8, utf-16, pascal or wide-pascal
    *  terminateValue: 0x00, // only with stringType: "utf"
    *  lengthWriteSize: 1, //for pascal strings. 1, 2 or 4 byte length write size
    *  encoding: "utf-8", //TextEncoder accepted types
    *  endian: "little", //for wide-pascal and utf-16
    * }
    * ```
    */
    writeString(string, options) {
        var offset = options && options.offset;
        var length = options && options.length;
        var stringType = options && options.stringType || 'utf-8';
        var terminateValue = options && options.terminateValue;
        var lengthWriteSize = options && options.lengthWriteSize || 1;
        var encoding = options && options.encoding || 'utf-8';
        var endian = options && options.endian || this.endian;
        if (stringType === 'utf-8' || stringType === 'utf-16') {
            // Encode the string in the specified encoding
            if (encoding == undefined) {
                if (stringType == 'utf-8') {
                    encoding = 'utf-8';
                }
                if (stringType == 'utf-16') {
                    encoding = 'utf-16';
                }
            }
            const encoder = new TextEncoder();
            const encodedString = encoder.encode(string);
            if (length == undefined && terminateValue == undefined) {
                terminateValue = 0;
            }
            var totalLength = (length || encodedString.length) + (terminateValue != undefined ? 1 : 0);
            if (stringType == 'utf-16') {
                totalLength = (length || (encodedString.length * 2)) + (terminateValue != undefined ? 2 : 0);
            }
            this.check_size(totalLength, 0, offset);
            // Write the string bytes to the Uint8Array
            for (let i = 0; i < encodedString.length; i++) {
                if (stringType === 'utf-16') {
                    const charCode = encodedString[i];
                    if (endian == "little") {
                        this.data[this.offset + i * 2] = charCode & 0xFF;
                        this.data[this.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                    }
                    else {
                        this.data[this.offset + i * 2 + 1] = charCode & 0xFF;
                        this.data[this.offset + i * 2] = (charCode >> 8) & 0xFF;
                    }
                }
                else {
                    this.data[this.offset + i] = encodedString[i];
                }
            }
            if (terminateValue != undefined) {
                if (stringType === 'utf-16') {
                    this.data[this.offset + totalLength - 1] = terminateValue & 0xFF;
                    this.data[this.offset + totalLength] = (terminateValue >> 8) & 0xFF;
                }
                else {
                    this.data[this.offset + totalLength] = terminateValue;
                }
            }
            this.offset += totalLength;
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
            const encoder = new TextEncoder();
            // Calculate the length of the string based on the specified max length
            var maxLength;
            // Encode the string in the specified encoding
            if (lengthWriteSize == 1) {
                maxLength = 255;
            }
            else if (lengthWriteSize == 2) {
                maxLength = 65535;
            }
            else if (lengthWriteSize == 4) {
                maxLength = 4294967295;
            }
            else {
                throw new Error("Invalid length read size: " + lengthWriteSize);
            }
            if (string.length > maxLength || (length || 0) > maxLength) {
                throw new Error("String outsize of max write length: " + maxLength);
            }
            var maxBytes = Math.min(string.length, maxLength);
            const encodedString = encoder.encode(string.substring(0, maxBytes));
            var totalLength = (length || encodedString.length) + lengthWriteSize;
            if (stringType == 'wide-pascal') {
                totalLength = (length || (encodedString.length * 2)) + lengthWriteSize;
            }
            this.check_size(totalLength, 0, offset);
            if (lengthWriteSize == 1) {
                this.writeUByte(maxBytes, 0);
            }
            else if (lengthWriteSize == 2) {
                this.writeUInt16(maxBytes, 0, endian);
            }
            else if (lengthWriteSize == 4) {
                this.writeUInt32(maxBytes, 0, endian);
            }
            // Write the string bytes to the Uint8Array
            for (let i = 0; i < encodedString.length; i++) {
                if (stringType == 'wide-pascal') {
                    const charCode = encodedString[i];
                    if (endian == "little") {
                        this.data[this.offset + i * 2] = charCode & 0xFF;
                        this.data[this.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                    }
                    else {
                        this.data[this.offset + i * 2 + 1] = charCode & 0xFF;
                        this.data[this.offset + i * 2] = (charCode >> 8) & 0xFF;
                    }
                }
                else {
                    this.data[this.offset + i] = encodedString[i];
                }
            }
            this.offset += totalLength;
        }
        else {
            throw new Error('Unsupported string type.');
        }
    }
    /**
    * Writes string, use options object for different types
    *
    *
    * @param {string} string - text string
    * @param {object} options - options:
    * ```javascript
    * {
    *  offset: 0, //byte offset from current position
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
    * Writes UTF-8 (C) string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    *
    * @return string
    */
    utf8string(string, offset, length, terminateValue) {
        return this.string(string, { offset: offset, stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes UTF-8 (C) string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    *
    * @return string
    */
    cstring(string, offset, length, terminateValue) {
        return this.string(string, { offset: offset, stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes ANSI string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    ansistring(string, offset, length, terminateValue) {
        return this.string(string, { offset: offset, stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes UTF-16 (Unicode) string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    utf16string(string, offset, length, terminateValue, endian) {
        return this.string(string, { offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    }
    /**
    * Writes UTF-16 (Unicode) string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    unistring(string, offset, length, terminateValue, endian) {
        return this.string(string, { offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    }
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string, offset, length, terminateValue) {
        return this.string(string, { offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    }
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringle(string, offset, length, terminateValue) {
        return this.string(string, { offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    }
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string, offset, length, terminateValue) {
        return this.string(string, { offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    }
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string, offset, length, terminateValue) {
        return this.string(string, { offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    }
    /**
    * Writes Pascal string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string, offset, lengthWriteSize, endian) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    /**
    * Writes Pascal string 1 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string, offset, endian) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian });
    }
    /**
    * Writes Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring1le(string, offset) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little" });
    }
    /**
    * Writes Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring1be(string, offset) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big" });
    }
    /**
    * Writes Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    pstring2(string, offset, endian) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: endian });
    }
    /**
    * Writes Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring2le(string, offset) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little" });
    }
    /**
    * Writes Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring2be(string, offset) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big" });
    }
    /**
    * Writes Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    pstring4(string, offset, endian) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian });
    }
    /**
    * Writes Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring4be(string, offset) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big" });
    }
    /**
    * Writes Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring4le(string, offset) {
        return this.string(string, { offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring(string, offset, lengthWriteSize, endian) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    /**
    * Writes Wide-Pascal string in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string, offset, lengthWriteSize) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string, offset, lengthWriteSize) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring1(string, offset, endian) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring1be(string, offset) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring1le(string, offset) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring2(string, offset, endian) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring2le(string, offset) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring2be(string, offset) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring4(string, offset, endian) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring4le(string, offset) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring4be(string, offset) {
        return this.string(string, { offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big" });
    }
}
//# sourceMappingURL=writer.js.map