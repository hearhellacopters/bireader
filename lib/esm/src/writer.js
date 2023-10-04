import { buffcheck, arraybuffcheck, extendarray, skip, goto, remove, checkSize, addData, hexDump, XOR, AND, OR, NOT, LSHIFT, RSHIFT, ADD, wbit, rbit, rbyte, wbyte, wint16, rint16, whalffloat, rhalffloat, rint32, wint32, rfloat, wfloat, wint64, rint64, rdfloat, wdfloat, wstring, rstring } from './common';
/**
* Binary writer, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
* @param {number} byteOffset - Byte offset to start writer, default is 0
* @param {number} bitOffset - Bit offset to start writer, 0-7
* @param {string} endianness - Endianness ``big`` or ``little`` (default little)
* @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default false)
*/
export class biwriter {
    isBuffer(obj) {
        return buffcheck(obj);
    }
    isBufferOrUint8Array(obj) {
        return arraybuffcheck(this, obj);
    }
    extendArray(to_padd) {
        return extendarray(this, to_padd);
    }
    check_size(write_bytes, write_bit, offset) {
        return checkSize(this, write_bytes || 0, write_bit || 0, offset || this.offset);
    }
    /**
    * Binary writer, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
    * @param {number} byteOffset - Byte offset to start writer, default is 0
    * @param {number} bitOffset - Bit offset to start writer, 0-7
    * @param {string} endianness - Endianness ``big`` or ``little`` (default little)
    * @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default false)
    */
    constructor(data, byteOffset, bitOffset, endianness, strict) {
        this.endian = "little";
        this.offset = 0;
        this.bitoffset = 0;
        this.size = 0;
        this.strict = false;
        this.errorDump = true;
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
            if (!this.isBufferOrUint8Array(data)) {
                throw new Error("Write data must be Uint8Array or Buffer");
            }
        }
        this.data = data;
        this.size = this.data.length + ((bitOffset || 0) % 8);
    }
    /**
    * Change Endian (default little)
    *
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - Endianness ```big``` or ```little```
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
    * Sets Endian to big
    *
    */
    bigEndian() {
        this.endianness("big");
    }
    /**
    * Sets Endian to big
    *
    */
    big() {
        this.endianness("big");
    }
    /**
    * Sets Endian to big
    *
    */
    be() {
        this.endianness("big");
    }
    /**
    * Sets Endian to little
    *
    */
    littleEndian() {
        this.endianness("little");
    }
    /**
    * Sets Endian to little
    *
    */
    little() {
        this.endianness("little");
    }
    /**
    * Sets Endian to little
    *
    */
    le() {
        this.endianness("little");
    }
    //
    // move from current position
    //
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    skip(bytes, bits) {
        return skip(this, bytes, bits);
    }
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    jump(bytes, bits) {
        this.skip(bytes, bits);
    }
    //
    // directly set current position
    //
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    goto(byte, bit) {
        return goto(this, byte, bit);
    }
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    seek(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    pointer(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    warp(byte, bit) {
        return this.goto(byte, bit);
    }
    //
    //go to start
    //
    /**
    * Set byte and bit position to start of data
    */
    rewind() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    /**
    * Set byte and bit position to start of data
    */
    gotostart() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    //
    //get position
    //
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
    getOffset() {
        return this.offset;
    }
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    saveOffset() {
        return this.offset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    tellB() {
        return this.bitoffset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    getOffsetBit() {
        return this.bitoffset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    saveOffsetAbsBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    tellAbsB() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    getOffsetAbsBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    saveOffsetBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    //
    //strict mode change
    //
    /**
    * Disallows extending data if position is outside of max size
    */
    restrict() {
        this.strict = true;
    }
    /**
    * Allows extending data if position is outside of max size
    */
    unrestrict() {
        this.strict = false;
    }
    //
    //math
    //
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xor(xorKey, startOffset, endOffset, consume) {
        var XORKey = xorKey;
        if (typeof xorKey == "number") {
            //pass
        }
        else if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        }
        else if (this.isBufferOrUint8Array(XORKey)) {
            //pass
        }
        else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return XOR(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xorThis(xorKey, length, consume) {
        var Length = length || 1;
        var XORKey = xorKey;
        if (typeof xorKey == "number") {
            Length = length || 1;
        }
        else if (typeof xorKey == "string") {
            const encoder = new TextEncoder().encode(xorKey);
            XORKey = encoder;
            Length = length || encoder.length;
        }
        else if (this.isBufferOrUint8Array(XORKey)) {
            Length = length || xorKey.length;
        }
        else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return XOR(this, XORKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * OR data
    *
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    or(orKey, startOffset, endOffset, consume) {
        var ORKey = orKey;
        if (typeof orKey == "number") {
            //pass
        }
        else if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        }
        else if (this.isBufferOrUint8Array(ORKey)) {
            //pass
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return OR(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * OR data
    *
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    orThis(orKey, length, consume) {
        var Length = length || 1;
        var ORKey = orKey;
        if (typeof orKey == "number") {
            Length = length || 1;
        }
        else if (typeof orKey == "string") {
            const encoder = new TextEncoder().encode(orKey);
            ORKey = encoder;
            Length = length || encoder.length;
        }
        else if (this.isBufferOrUint8Array(ORKey)) {
            Length = length || orKey.length;
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return OR(this, ORKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    and(andKey, startOffset, endOffset, consume) {
        var ANDKey = andKey;
        if (typeof ANDKey == "number") {
            //pass
        }
        else if (typeof ANDKey == "string") {
            ANDKey = new TextEncoder().encode(ANDKey);
        }
        else if (typeof ANDKey == "object") {
            //pass
        }
        else {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return AND(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    andThis(andKey, length, consume) {
        var Length = length || 1;
        var ANDKey = andKey;
        if (typeof andKey == "number") {
            Length = length || 1;
        }
        else if (typeof andKey == "string") {
            const encoder = new TextEncoder().encode(andKey);
            ANDKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof andKey == "object") {
            Length = length || andKey.length;
        }
        else {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return AND(this, ANDKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Not data
    *
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    not(startOffset, endOffset, consume) {
        return NOT(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Not data
    *
    * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    notThis(length, consume) {
        return NOT(this, this.offset, this.offset + (length || 1), consume || false);
    }
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShift(shiftKey, startOffset, endOffset, consume) {
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            //pass
        }
        else if (typeof lShiftKey == "string") {
            lShiftKey = new TextEncoder().encode(lShiftKey);
        }
        else if (typeof lShiftKey == "object") {
            //pass
        }
        else {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return LSHIFT(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShiftThis(shiftKey, length, consume) {
        var Length = length || 1;
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        }
        else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        }
        else {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return LSHIFT(this, shiftKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShift(shiftKey, startOffset, endOffset, consume) {
        var rShiftKey = shiftKey;
        if (typeof rShiftKey == "number") {
            //pass
        }
        else if (typeof rShiftKey == "string") {
            rShiftKey = new TextEncoder().encode(rShiftKey);
        }
        else if (typeof rShiftKey == "object") {
            //pass
        }
        else {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return RSHIFT(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShiftThis(shiftKey, length, consume) {
        var Length = length || 1;
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        }
        else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        }
        else {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return RSHIFT(this, lShiftKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    add(addKey, startOffset, endOffset, consume) {
        var addedKey = addKey;
        if (typeof addedKey == "number") {
            //pass
        }
        else if (typeof addedKey == "string") {
            addedKey = new TextEncoder().encode(addedKey);
        }
        else if (typeof addedKey == "object") {
            //pass
        }
        else {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return ADD(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    addThis(addKey, length, consume) {
        var Length = length || 1;
        var AddedKey = addKey;
        if (typeof AddedKey == "number") {
            Length = length || 1;
        }
        else if (typeof AddedKey == "string") {
            const encoder = new TextEncoder().encode(AddedKey);
            AddedKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof AddedKey == "object") {
            Length = length || AddedKey.length;
        }
        else {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return ADD(this, AddedKey, this.offset, this.offset + Length, consume || false);
    }
    //
    //remove part of data
    //
    /**
    * Deletes part of data from start to current byte position unless supplied, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} startOffset - Start location (default 0)
    * @param {number} endOffset - End location (default current position)
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    delete(startOffset, endOffset, consume) {
        return remove(this, startOffset || 0, endOffset || this.offset, consume || false, true);
    }
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    clip() {
        return remove(this, this.offset, this.size, false, true);
    }
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    trim() {
        return remove(this, this.offset, this.size, false, true);
    }
    /**
    * Deletes part of data from current byte position to supplied length, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    crop(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    /**
    * Deletes part of data from current position to supplied length, returns removed
    * Note: Only works in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    drop(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    //
    //copy out
    //
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    lift(startOffset, endOffset, consume, fillValue) {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    fill(startOffset, endOffset, consume, fillValue) {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    extract(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    slice(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    wrap(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    //
    //insert
    //
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    insert(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset);
    }
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    place(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset);
    }
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    replace(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, true);
    }
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    overwrite(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, true);
    }
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    unshift(data, consume) {
        return addData(this, data, consume || false, 0);
    }
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    prepend(data, consume) {
        return addData(this, data, consume || false, 0);
    }
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    push(data, consume) {
        return addData(this, data, consume || false, this.size);
    }
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    append(data, consume) {
        return addData(this, data, consume || false, this.size);
    }
    //
    //finishing
    //
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get() {
        return this.data;
    }
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return() {
        return this.data;
    }
    /**
    * removes data
    */
    end() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    close() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    done() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    finished() {
        this.data = undefined;
    }
    /**
    * Console logs data as hex dump
    *
    * @param {object} options
    * ```javascript
    *   {
    *       length: 192, // number of bytes to log, default 192 or end of data
    *       startByte: 0, // byte to start dump (default current byte position)
    *       supressUnicode: false // Supress unicode character preview for even columns
    *   }
    * ```
    */
    hexdump(options) {
        return hexDump(this, options);
    }
    /**
    * Turn hexdump on error off (default on)
    */
    errorDumpOff() {
        this.errorDump = false;
    }
    /**
    * Turn hexdump on error on (default on)
    */
    errorDumpOn() {
        this.errorDump = true;
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
    * @param {boolean} unsigned - if value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeBit(value, bits, unsigned, endian) {
        return wbit(this, value, bits, unsigned, endian);
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
    readBit(bits, unsigned, endian) {
        return rbit(this, bits, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit(value, bits, unsigned, endian) {
        return this.writeBit(value, bits, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    writeUBitBE(value, bits) {
        return this.bit(value, bits, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    ubitbe(value, bits) {
        return this.bit(value, bits, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    writeBitBE(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitbe(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    writeUBitLE(value, bits) {
        return this.bit(value, bits, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    ubitle(value, bits) {
        return this.bit(value, bits, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    writeBitLE(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitle(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit1(value, unsigned, endian) {
        return this.bit(value, 1, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1le(value, unsigned) {
        return this.bit(value, 1, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1be(value, unsigned) {
        return this.bit(value, 1, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit1(value, endian) {
        return this.bit(value, 1, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit1le(value) {
        return this.bit(value, 1, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit1be(value) {
        return this.bit(value, 1, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit2(value, unsigned, endian) {
        return this.bit(value, 2, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2le(value, unsigned) {
        return this.bit(value, 2, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2be(value, unsigned) {
        return this.bit(value, 2, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit2(value, endian) {
        return this.bit(value, 2, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit2le(value) {
        return this.bit(value, 2, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit2be(value) {
        return this.bit(value, 2, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit3(value, unsigned, endian) {
        return this.bit(value, 3, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3le(value, unsigned) {
        return this.bit(value, 3, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3be(value, unsigned) {
        return this.bit(value, 3, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit3(value, endian) {
        return this.bit(value, 3, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit3le(value) {
        return this.bit(value, 3, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit3be(value) {
        return this.bit(value, 3, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit4(value, unsigned, endian) {
        return this.bit(value, 4, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4le(value, unsigned) {
        return this.bit(value, 4, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4be(value, unsigned) {
        return this.bit(value, 4, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit4(value, endian) {
        return this.bit(value, 4, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit4le(value) {
        return this.bit(value, 4, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit4be(value) {
        return this.bit(value, 4, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit5(value, unsigned, endian) {
        return this.bit(value, 5, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5le(value, unsigned) {
        return this.bit(value, 5, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5be(value, unsigned) {
        return this.bit(value, 5, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit5(value, endian) {
        return this.bit(value, 5, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit5le(value) {
        return this.bit(value, 5, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit5be(value) {
        return this.bit(value, 5, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit6(value, unsigned, endian) {
        return this.bit(value, 6, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6le(value, unsigned) {
        return this.bit(value, 6, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6be(value, unsigned) {
        return this.bit(value, 6, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit6(value, endian) {
        return this.bit(value, 6, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit6le(value) {
        return this.bit(value, 6, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit6be(value) {
        return this.bit(value, 6, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit7(value, unsigned, endian) {
        return this.bit(value, 7, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7le(value, unsigned) {
        return this.bit(value, 7, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7be(value, unsigned) {
        return this.bit(value, 7, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit7(value, endian) {
        return this.bit(value, 7, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit7le(value) {
        return this.bit(value, 7, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit7be(value) {
        return this.bit(value, 7, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit8(value, unsigned, endian) {
        return this.bit(value, 8, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8le(value, unsigned) {
        return this.bit(value, 8, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8be(value, unsigned) {
        return this.bit(value, 8, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit8(value, endian) {
        return this.bit(value, 8, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit8le(value) {
        return this.bit(value, 8, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit8be(value) {
        return this.bit(value, 8, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit9(value, unsigned, endian) {
        return this.bit(value, 9, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9le(value, unsigned) {
        return this.bit(value, 9, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9be(value, unsigned) {
        return this.bit(value, 9, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit9(value, endian) {
        return this.bit(value, 9, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit9le(value) {
        return this.bit(value, 9, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit9be(value) {
        return this.bit(value, 9, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit10(value, unsigned, endian) {
        return this.bit(value, 10, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10le(value, unsigned) {
        return this.bit(value, 10, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10be(value, unsigned) {
        return this.bit(value, 10, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit10(value, endian) {
        return this.bit(value, 10, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit10le(value) {
        return this.bit(value, 10, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit10be(value) {
        return this.bit(value, 10, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit11(value, unsigned, endian) {
        return this.bit(value, 11, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11le(value, unsigned) {
        return this.bit(value, 11, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11be(value, unsigned) {
        return this.bit(value, 11, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit11(value, endian) {
        return this.bit(value, 11, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit11le(value) {
        return this.bit(value, 11, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit11be(value) {
        return this.bit(value, 11, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit12(value, unsigned, endian) {
        return this.bit(value, 12, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12le(value, unsigned) {
        return this.bit(value, 12, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12be(value, unsigned) {
        return this.bit(value, 12, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit12(value, endian) {
        return this.bit(value, 12, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit12le(value) {
        return this.bit(value, 12, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit12be(value) {
        return this.bit(value, 12, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit13(value, unsigned, endian) {
        return this.bit(value, 13, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13le(value, unsigned) {
        return this.bit(value, 13, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13be(value, unsigned) {
        return this.bit(value, 13, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit13(value, endian) {
        return this.bit(value, 13, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit13le(value) {
        return this.bit(value, 13, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit13be(value) {
        return this.bit(value, 13, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit14(value, unsigned, endian) {
        return this.bit(value, 14, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14le(value, unsigned) {
        return this.bit(value, 14, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14be(value, unsigned) {
        return this.bit(value, 14, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit14(value, endian) {
        return this.bit(value, 14, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit14le(value) {
        return this.bit(value, 14, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit14be(value) {
        return this.bit(value, 14, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit15(value, unsigned, endian) {
        return this.bit(value, 15, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15le(value, unsigned) {
        return this.bit(value, 15, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15be(value, unsigned) {
        return this.bit(value, 15, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit15(value, endian) {
        return this.bit(value, 15, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit15le(value) {
        return this.bit(value, 15, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit15be(value) {
        return this.bit(value, 15, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit16(value, unsigned, endian) {
        return this.bit(value, 16, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16le(value, unsigned) {
        return this.bit(value, 16, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16be(value, unsigned) {
        return this.bit(value, 16, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit16(value, endian) {
        return this.bit(value, 16, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit16le(value) {
        return this.bit(value, 16, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit16be(value) {
        return this.bit(value, 16, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit17(value, unsigned, endian) {
        return this.bit(value, 17, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17le(value, unsigned) {
        return this.bit(value, 17, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17be(value, unsigned) {
        return this.bit(value, 17, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit17(value, endian) {
        return this.bit(value, 17, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit17le(value) {
        return this.bit(value, 17, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit17be(value) {
        return this.bit(value, 17, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit18(value, unsigned, endian) {
        return this.bit(value, 18, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18le(value, unsigned) {
        return this.bit(value, 18, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18be(value, unsigned) {
        return this.bit(value, 18, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit18(value, endian) {
        return this.bit(value, 18, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit18le(value) {
        return this.bit(value, 18, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit18be(value) {
        return this.bit(value, 18, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit19(value, unsigned, endian) {
        return this.bit(value, 19, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19le(value, unsigned) {
        return this.bit(value, 19, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19be(value, unsigned) {
        return this.bit(value, 19, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit19(value, endian) {
        return this.bit(value, 19, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit19le(value) {
        return this.bit(value, 19, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit19be(value) {
        return this.bit(value, 19, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit20(value, unsigned, endian) {
        return this.bit(value, 20, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20le(value, unsigned) {
        return this.bit(value, 20, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20be(value, unsigned) {
        return this.bit(value, 20, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit20(value, endian) {
        return this.bit(value, 20, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit20le(value) {
        return this.bit(value, 20, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit20be(value) {
        return this.bit(value, 20, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit21(value, unsigned, endian) {
        return this.bit(value, 21, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21le(value, unsigned) {
        return this.bit(value, 21, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21be(value, unsigned) {
        return this.bit(value, 21, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit21(value, endian) {
        return this.bit(value, 21, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit21le(value) {
        return this.bit(value, 21, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit21be(value) {
        return this.bit(value, 21, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit22(value, unsigned, endian) {
        return this.bit(value, 22, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22le(value, unsigned) {
        return this.bit(value, 22, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22be(value, unsigned) {
        return this.bit(value, 22, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit22(value, endian) {
        return this.bit(value, 22, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit22le(value) {
        return this.bit(value, 22, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit22be(value) {
        return this.bit(value, 22, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit23(value, unsigned, endian) {
        return this.bit(value, 23, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23le(value, unsigned) {
        return this.bit(value, 23, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23be(value, unsigned) {
        return this.bit(value, 23, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit23(value, endian) {
        return this.bit(value, 23, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit23le(value) {
        return this.bit(value, 23, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit23be(value) {
        return this.bit(value, 23, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit24(value, unsigned, endian) {
        return this.bit(value, 24, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24le(value, unsigned) {
        return this.bit(value, 24, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24be(value, unsigned) {
        return this.bit(value, 24, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit24(value, endian) {
        return this.bit(value, 24, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit24le(value) {
        return this.bit(value, 24, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit24be(value) {
        return this.bit(value, 24, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit25(value, unsigned, endian) {
        return this.bit(value, 25, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25le(value, unsigned) {
        return this.bit(value, 25, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25be(value, unsigned) {
        return this.bit(value, 25, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit25(value, endian) {
        return this.bit(value, 25, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit25le(value) {
        return this.bit(value, 25, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit25be(value) {
        return this.bit(value, 25, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit26(value, unsigned, endian) {
        return this.bit(value, 26, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26le(value, unsigned) {
        return this.bit(value, 26, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26be(value, unsigned) {
        return this.bit(value, 26, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit26(value, endian) {
        return this.bit(value, 26, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit26le(value) {
        return this.bit(value, 26, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit26be(value) {
        return this.bit(value, 26, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit27(value, unsigned, endian) {
        return this.bit(value, 27, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27le(value, unsigned) {
        return this.bit(value, 27, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27be(value, unsigned) {
        return this.bit(value, 27, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit27(value, endian) {
        return this.bit(value, 27, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit27le(value) {
        return this.bit(value, 27, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit27be(value) {
        return this.bit(value, 27, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit28(value, unsigned, endian) {
        return this.bit(value, 28, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28le(value, unsigned) {
        return this.bit(value, 28, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28be(value, unsigned) {
        return this.bit(value, 28, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit28(value, endian) {
        return this.bit(value, 28, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit28le(value) {
        return this.bit(value, 28, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit28be(value) {
        return this.bit(value, 28, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit29(value, unsigned, endian) {
        return this.bit(value, 29, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29le(value, unsigned) {
        return this.bit(value, 29, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29be(value, unsigned) {
        return this.bit(value, 29, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit29(value, endian) {
        return this.bit(value, 29, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit29le(value) {
        return this.bit(value, 29, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit29be(value) {
        return this.bit(value, 29, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit30(value, unsigned, endian) {
        return this.bit(value, 30, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30le(value, unsigned) {
        return this.bit(value, 30, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30be(value, unsigned) {
        return this.bit(value, 30, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit30(value, endian) {
        return this.bit(value, 30, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit30le(value) {
        return this.bit(value, 30, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit30be(value) {
        return this.bit(value, 30, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit31(value, unsigned, endian) {
        return this.bit(value, 31, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31le(value, unsigned) {
        return this.bit(value, 31, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31be(value, unsigned) {
        return this.bit(value, 31, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit31(value, endian) {
        return this.bit(value, 31, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit31le(value) {
        return this.bit(value, 31, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit31be(value) {
        return this.bit(value, 31, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit32(value, unsigned, endian) {
        return this.bit(value, 32, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32le(value, unsigned) {
        return this.bit(value, 32, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32be(value, unsigned) {
        return this.bit(value, 32, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    ubit32(value, endian) {
        return this.bit(value, 32, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit32le(value) {
        return this.bit(value, 32, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit32be(value) {
        return this.bit(value, 32, true, "big");
    }
    //
    //byte write
    //
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    writeByte(value, unsigned) {
        return wbyte(this, value, unsigned);
    }
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    readByte(unsigned) {
        return rbyte(this, unsigned);
    }
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    byte(value, unsigned) {
        return this.writeByte(value, unsigned);
    }
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    int8(value, unsigned) {
        return this.writeByte(value, unsigned);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    writeUByte(value) {
        return this.writeByte(value, true);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    uint8(value) {
        return this.writeByte(value, true);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    ubyte(value) {
        return this.writeByte(value, true);
    }
    //
    //short writes
    //
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt16(value, unsigned, endian) {
        return wint16(this, value, unsigned, endian);
    }
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt16(unsigned, endian) {
        return rint16(this, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int16(value, unsigned, endian) {
        return this.writeInt16(value, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    short(value, unsigned, endian) {
        return this.writeInt16(value, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    word(value, unsigned, endian) {
        return this.writeInt16(value, unsigned, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt16(value, endian) {
        return this.writeInt16(value, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    uint16(value, endian) {
        return this.writeInt16(value, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    ushort(value, offset, endian) {
        return this.writeInt16(value, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    uword(value, offset, endian) {
        return this.writeInt16(value, true, endian);
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    writeInt16BE(value) {
        return this.writeInt16(value, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    int16be(value) {
        return this.writeInt16(value, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    shortbe(value) {
        return this.writeInt16(value, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    wordbe(value) {
        return this.writeInt16(value, false, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    writeUInt16BE(value) {
        return this.writeInt16(value, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uint16be(value) {
        return this.writeInt16(value, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    ushortbe(value) {
        return this.writeInt16(value, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uwordbe(value) {
        return this.writeInt16(value, true, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    writeInt16LE(value) {
        return this.writeInt16(value, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    int16le(value) {
        return this.writeInt16(value, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    shortle(value) {
        return this.writeInt16(value, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    wordle(value) {
        return this.writeInt16(value, false, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    writeUInt16LE(value) {
        return this.writeInt16(value, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uint16le(value) {
        return this.writeInt16(value, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    ushortle(value) {
        return this.writeInt16(value, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uwordle(value) {
        return this.writeInt16(value, true, "little");
    }
    //
    //half float
    //
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    writeHalfFloat(value, endian) {
        return whalffloat(this, value, endian);
    }
    /**
    * Read half float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readHalfFloat(endian) {
        return rhalffloat(this, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    half(value, endian) {
        return this.writeHalfFloat(value, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    halffloat(value, endian) {
        return this.writeHalfFloat(value, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    writeHalfFloatBE(value, offset) {
        return this.writeHalfFloat(value, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halffloatbe(value, offset) {
        return this.writeHalfFloat(value, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halfbe(value) {
        return this.writeHalfFloat(value, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    writeHalfFloatLE(value) {
        return this.writeHalfFloat(value, "little");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halffloatle(value) {
        return this.writeHalfFloat(value, "little");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halfle(value) {
        return this.writeHalfFloat(value, "little");
    }
    //
    //int32 write
    //
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt32(value, unsigned, endian) {
        return wint32(this, value, unsigned, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt32(unsigned, endian) {
        return rint32(this, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int(value, unsigned, endian) {
        return this.writeInt32(value, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int32(value, unsigned, endian) {
        return this.writeInt32(value, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    double(value, unsigned, endian) {
        return this.writeInt32(value, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    long(value, unsigned, endian) {
        return this.writeInt32(value, unsigned, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt32(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint32(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    udouble(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    ulong(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    writeInt32LE(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    int32le(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    intle(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    doublele(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    longle(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    writeUInt32LE(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uint32le(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uintle(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    udoublele(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    ulongle(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    writeInt32BE(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    intbe(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    int32be(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    doublebe(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    longbe(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    writeUInt32BE(value, offset) {
        return this.writeInt32(value, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uint32be(value, offset) {
        return this.writeInt32(value, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uintbe(value) {
        return this.writeInt32(value, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    udoublebe(value) {
        return this.writeInt32(value, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    ulongbe(value) {
        return this.writeInt32(value, true, "big");
    }
    //
    //float write
    //
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    writeFloat(value, endian) {
        return wfloat(this, value, endian);
    }
    /**
    * Read float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readFloat(endian) {
        return rfloat(this, endian);
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    float(value, endian) {
        return this.writeFloat(value, endian);
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    writeFloatLE(value) {
        return this.writeFloat(value, "little");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    floatle(value) {
        return this.writeFloat(value, "little");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    writeFloatBE(value) {
        return this.writeFloat(value, "big");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    floatbe(value) {
        return this.writeFloat(value, "big");
    }
    //
    //int64 write
    //
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt64(value, unsigned, endian) {
        return wint64(this, value, unsigned, endian);
    }
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt64(unsigned, endian) {
        return rint64(this, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int64(value, unsigned, endian) {
        return this.writeInt64(value, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    quad(value, unsigned, endian) {
        return this.writeInt64(value, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    bigint(value, unsigned, endian) {
        return this.writeInt64(value, unsigned, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt64(value, endian) {
        return this.writeInt64(value, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    uint64(value, endian) {
        return this.writeInt64(value, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    ubigint(value, endian) {
        return this.writeInt64(value, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    uquad(value, endian) {
        return this.writeInt64(value, true, endian);
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeInt64LE(value) {
        return this.writeInt64(value, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    int64le(value) {
        return this.writeInt64(value, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    bigintle(value) {
        return this.writeInt64(value, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    quadle(value) {
        return this.writeInt64(value, false, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeUInt64LE(value) {
        return this.writeInt64(value, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uint64le(value) {
        return this.writeInt64(value, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    ubigintle(value) {
        return this.writeInt64(value, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uquadle(value) {
        return this.writeInt64(value, true, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeInt64BE(value) {
        return this.writeInt64(value, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    int64be(value) {
        return this.writeInt64(value, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    bigintbe(value) {
        return this.writeInt64(value, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    quadbe(value) {
        return this.writeInt64(value, false, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeUInt64BE(value) {
        return this.writeInt64(value, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uint64be(value) {
        return this.writeInt64(value, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    ubigintbe(value) {
        return this.writeInt64(value, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uquadbe(value) {
        return this.writeInt64(value, true, "big");
    }
    //
    //doublefloat
    //
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeDoubleFloat(value, endian) {
        return wdfloat(this, value, endian);
    }
    /**
    * Read double float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readDoubleFloat(endian) {
        return rdfloat(this, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    doublefloat(value, endian) {
        return this.writeDoubleFloat(value, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    dfloat(value, endian) {
        return this.writeDoubleFloat(value, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    writeDoubleFloatBE(value) {
        return this.writeDoubleFloat(value, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    dfloatbe(value) {
        return this.writeDoubleFloat(value, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    doublefloatbe(value) {
        return this.writeDoubleFloat(value, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    writeDoubleFloatLE(value) {
        return this.writeDoubleFloat(value, "little");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    dfloatle(value) {
        return this.writeDoubleFloat(value, "little");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    doublefloatle(value) {
        return this.writeDoubleFloat(value, "little");
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
        return wstring(this, string, options);
    }
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
        return rstring(this, options);
    }
    /**
    * Writes string, use options object for different types
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
    * Writes UTF-8 (C) string
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
    * Writes UTF-8 (C) string
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
    * Writes ANSI string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    ansistring(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes UTF-16 (Unicode) string
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
    * Writes UTF-16 (Unicode) string
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
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    }
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringle(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    }
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    }
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    }
    /**
    * Writes Pascal string
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    /**
    * Writes Pascal string 1 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian });
    }
    /**
    * Writes Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring1le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little" });
    }
    /**
    * Writes Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring1be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big" });
    }
    /**
    * Writes Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    pstring2(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: endian });
    }
    /**
    * Writes Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring2le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little" });
    }
    /**
    * Writes Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring2be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big" });
    }
    /**
    * Writes Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    pstring4(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian });
    }
    /**
    * Writes Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring4be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big" });
    }
    /**
    * Writes Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring4le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    /**
    * Writes Wide-Pascal string in big endian order
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string, lengthWriteSize) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string in little endian order
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string, lengthWriteSize) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring1(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring1be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring1le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring2(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring2le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring2be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring4(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring4le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring4be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big" });
    }
}
//# sourceMappingURL=writer.js.map