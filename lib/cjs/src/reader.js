"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bireader = void 0;
const common_js_1 = require("./common.js");
/**
* Binary reader, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```. Always found in ``biwriter.data``
* @param {number} byteOffset - Byte offset to start reader (default 0)
* @param {number} bitOffset - Bit offset 0-7 to start reader (default 0)
* @param {string} endianness - Endianness ```big``` or ```little``` (default ```little```)
* @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default true)
*/
class bireader {
    isBuffer(obj) {
        return (0, common_js_1.buffcheck)(obj);
    }
    isBufferOrUint8Array(obj) {
        return (0, common_js_1.arraybuffcheck)(this, obj);
    }
    extendArray(to_padd) {
        return (0, common_js_1.extendarray)(this, to_padd);
    }
    check_size(write_bytes, write_bit, offset) {
        return (0, common_js_1.checkSize)(this, write_bytes || 0, write_bit || 0, offset || this.offset);
    }
    /**
    * Binary reader, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```. Always found in ``biwriter.data``
    * @param {number} byteOffset - Byte offset to start reader (default 0)
    * @param {number} bitOffset - Bit offset 0-7 to start reader (default 0)
    * @param {string} endianness - Endianness ```big``` or ```little``` (default ```little```)
    * @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default true)
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
        return (0, common_js_1.skip)(this, bytes, bits);
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
        return (0, common_js_1.goto)(this, byte, bit);
    }
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    seek(bytes, bits) {
        return this.skip(bytes, bits);
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
        return (0, common_js_1.XOR)(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return (0, common_js_1.XOR)(this, XORKey, this.offset, this.offset + Length, consume || false);
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
        return (0, common_js_1.OR)(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return (0, common_js_1.OR)(this, ORKey, this.offset, this.offset + Length, consume || false);
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
        return (0, common_js_1.AND)(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return (0, common_js_1.AND)(this, ANDKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Not data
    *
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    not(startOffset, endOffset, consume) {
        return (0, common_js_1.NOT)(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Not data
    *
    * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    notThis(length, consume) {
        return (0, common_js_1.NOT)(this, this.offset, this.offset + (length || 1), consume || false);
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
        return (0, common_js_1.LSHIFT)(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return (0, common_js_1.LSHIFT)(this, shiftKey, this.offset, this.offset + Length, consume || false);
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
        return (0, common_js_1.RSHIFT)(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return (0, common_js_1.RSHIFT)(this, lShiftKey, this.offset, this.offset + Length, consume || false);
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
        return (0, common_js_1.ADD)(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return (0, common_js_1.ADD)(this, AddedKey, this.offset, this.offset + Length, consume || false);
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
        return (0, common_js_1.remove)(this, startOffset || 0, endOffset || this.offset, consume || false, true);
    }
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    clip() {
        return (0, common_js_1.remove)(this, this.offset, this.size, false, true);
    }
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    trim() {
        return (0, common_js_1.remove)(this, this.offset, this.size, false, true);
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
        return (0, common_js_1.remove)(this, this.offset, this.offset + (length || 0), consume || false, true);
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
        return (0, common_js_1.remove)(this, this.offset, this.offset + (length || 0), consume || false, true);
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
        return (0, common_js_1.remove)(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
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
        return (0, common_js_1.remove)(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
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
        return (0, common_js_1.remove)(this, this.offset, this.offset + (length || 0), consume || false, false);
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
        return (0, common_js_1.remove)(this, this.offset, this.offset + (length || 0), consume || false, false);
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
        return (0, common_js_1.remove)(this, this.offset, this.offset + (length || 0), consume || false, false);
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
        return (0, common_js_1.addData)(this, data, consume || false, offset || this.offset);
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
        return (0, common_js_1.addData)(this, data, consume || false, offset || this.offset);
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
        return (0, common_js_1.addData)(this, data, consume || false, offset || this.offset, true);
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
        return (0, common_js_1.addData)(this, data, consume || false, offset || this.offset, true);
    }
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    unshift(data, consume) {
        return (0, common_js_1.addData)(this, data, consume || false, 0);
    }
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    prepend(data, consume) {
        return (0, common_js_1.addData)(this, data, consume || false, 0);
    }
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    push(data, consume) {
        return (0, common_js_1.addData)(this, data, consume || false, this.size);
    }
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    append(data, consume) {
        return (0, common_js_1.addData)(this, data, consume || false, this.size);
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
        return (0, common_js_1.hexDump)(this, options);
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
    //bit reader
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
        return (0, common_js_1.wbit)(this, value, bits, unsigned, endian);
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
        return (0, common_js_1.rbit)(this, bits, unsigned, endian);
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
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit1(unsigned, endian) {
        return this.bit(1, unsigned, endian);
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
        return this.bit(bits, true, "big");
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
        return this.bit(bits, true, "big");
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
        return this.bit(bits, unsigned, "big");
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
        return this.bit(bits, unsigned, "big");
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
        return this.bit(bits, true, "little");
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
        return this.bit(bits, true, "little");
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
        return this.bit(bits, unsigned, "little");
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
        return this.bit(bits, unsigned, "little");
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
        return (0, common_js_1.rbyte)(this, unsigned);
    }
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    writeByte(value, unsigned) {
        return (0, common_js_1.wbyte)(this, value, unsigned);
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
        return (0, common_js_1.rint16)(this, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt16(value, unsigned, endian) {
        return (0, common_js_1.wint16)(this, value, unsigned, endian);
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
        return (0, common_js_1.rhalffloat)(this, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little`
    */
    writeHalfFloat(value, endian) {
        return (0, common_js_1.whalffloat)(this, value, endian);
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
        return (0, common_js_1.rint32)(this, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt32(value, unsigned, endian) {
        return (0, common_js_1.wint32)(this, value, unsigned, endian);
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
        return (0, common_js_1.rfloat)(this, endian);
    }
    /**
   * Write float
   *
   * @param {number} value - value as int
   * @param {string} endian - ``big`` or ``little`
   */
    writeFloat(value, endian) {
        return (0, common_js_1.wfloat)(this, value, endian);
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
        return (0, common_js_1.rint64)(this, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt64(value, unsigned, endian) {
        return (0, common_js_1.wint64)(this, value, unsigned, endian);
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
        return (0, common_js_1.rdfloat)(this, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeDoubleFloat(value, endian) {
        return (0, common_js_1.wdfloat)(this, value, endian);
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
        return (0, common_js_1.rstring)(this, options);
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
    writeString(string, options) {
        return (0, common_js_1.wstring)(this, string, options);
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
exports.bireader = bireader;
//# sourceMappingURL=reader.js.map