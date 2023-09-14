 /**
 *
 * byte reader, includes bitfields and strings
 *
 * @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
 * @param {number} byteoffset - byte offset to start reader, default is 0 
 * @param {number} bitoffset - bit offset to start reader, 0-7 
 * @param endianness - endianness ```big``` or ```little``` (default ```little```)
 * @returns ```number``` or ```string```
 */
class bireader {
    endian = "little";
    offset = 0;
    bitoffset = 0;
    size = 0
    data;

    #check_size = function(read_size){
        if(this.bitoffset != 0){
            //droped bits
            const new_off = Math.ceil(this.bitoffset / 8)
            this.offset = this.offset + new_off
        }
        if((this.offset + read_size) > this.size){
            throw new Error(`Reader reached end of data.`);
        }
    }

    /**
     *
     * byte reader, includes bitfields and strings
     *
     * @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
     * @param {number} byteoffset - byte offset to start reader, default is 0 
     * @param {number} bitoffset - bit offset to start reader, 0-7 
     * @param endianness - endianness ```big``` or ```little``` (default ```little```)
     * @returns ```number``` or ```string```
     */
    constructor(data, byteoffset, bitoffset, endianness) {
        if(endianness != undefined && typeof endianness != "string"){
            throw Error("endianness must be big or little")
        }
        if(endianness != undefined && !(endianness == "big" || endianness == "little")){
            throw Error("byteorder must be big or little")
        }
        this.endian = endianness || "little"
        
        if(byteoffset != undefined ){
            if(typeof byteoffset == "number"){
                this.offset = Math.round(byteoffset) || 0
            } else {
                throw Error("Byteoffset must be number")
            }
        }
        if(bitoffset!= undefined){
            this.bitoffset = (bitoffset % 8)
        }
        if(data == undefined){
            throw Error("Data required")
        } else {
            this.size = data.length + ((bitoffset || 0) % 8)
            this.data = data
        }
    }

    endianness = function(order){
        if(order == undefined || typeof order != "string"){
            throw Error("endianness must be big or little")
        }
        if(order != undefined && !(order == "big" || order == "little")){
            throw Error("byteorder must be big or little")
        }
        this.endian = order
    }

     /**
     *
     * @param {number} offset - bytes to skip
     */
     seek = function(offset){
        this.#check_size(offset)
        this.offset += offset
    }

    /**
     *
     * @param {number} offset - byte to jump to
     */
    goto = function(loc){
        if(loc > this.size){
            throw Error("goto outside of size of data")
        }
        this.offset = loc
    }

    /**
     *
     * bit field reader
     * 
     * Note: When returning to a byte read, remaining bits are dropped
     *
     * @param {number} numBitsToRead - bits to read
     * @returns number
     */
    readBit = function(numBitsToRead, endian){
        if(numBitsToRead == undefined || typeof numBitsToRead != "number"){
            throw Error("Enter number of bits to read")
        }
        const size_needed = ((((numBitsToRead-1) + this.bitoffset) / 8) + this.offset)
        if (numBitsToRead <= 0 || size_needed > this.size) {
            throw new Error("Invalid number of bits to read: " + size_needed + " of " + this.size);
        }

        let result = "0b";
        let startByteIndex = this.offset //cur byte
        let endByteIndex = this.offset + Math.floor(((numBitsToRead-1) + this.bitoffset) / 8) //end byte
        let bytesToRead = (endByteIndex - startByteIndex) + 1 //at least 1
        let startBitIndex = this.bitoffset
        let endBitIndex = ((numBitsToRead-1) + this.bitoffset)+1
        let bitArray = []

        let startByteIndexI = endByteIndex

        //big backwards read
        do {
            var element = this.data[startByteIndexI];
            element = element.toString(2).padStart(8, '0').split('')
            if(endian == "little"){
                element = element.reverse()
            }
            bitArray.push(element)
            startByteIndexI--
            bytesToRead--
        } while (bytesToRead != 0);
        if(endian == "big"){
            bitArray = bitArray.reverse()
        }
        bitArray = bitArray.flat()
        // console.log(bitArray)
        bitArray = bitArray.slice(startBitIndex,endBitIndex)

        this.offset = this.offset + Math.floor(((numBitsToRead) + this.bitoffset) / 8) //end byte
        this.bitoffset = ((numBitsToRead) + this.bitoffset) % 8
            
        result = result + bitArray.join("")
        
        return Number(result);
    }

    /**
     *
     * bit field reader
     * 
     * Note: When returning to a byte read, remaining bits are dropped
     *
     * @param {number} bits - bits to read
     * @returns number
     */
    bit = function(bits){
        return this.readBit(bits, this.endian)
    }

    /**
     *
     * bit field reader
     * 
     * Note: When returning to a byte read, remaining bits are dropped
     *
     * @param {number} bits - bits to read
     * @returns number
     */
    readBitBE = function(bits){
        return this.readBit(bits, "big")
    }

    /**
     *
     * bit field reader
     * 
     * Note: When returning to a byte read, remaining bits are dropped
     *
     * @param {number} bits - bits to read
     * @returns number
     */
    bitbe = function(bits){
        return this.readBit(bits, "big")
    }

    /**
     *
     * bit field reader
     * 
     * Note: When returning to a byte read, remaining bits are dropped
     *
     * @param {number} bits - bits to read
     * @returns number
     */
    bitle = function(bits){
        return this.readBit(bits, "little")
    }

    /**
     *
     * bit field reader
     * 
     * Note: When returning to a byte read, remaining bits are dropped
     *
     * @param {number} bits - bits to read
     * @returns number
     */
    readBitLE = function(bits){
        return this.readBit(bits, "little")
    }

    //byte read

    /**
    * @returns number
    */
    readByte = function(signed){
        this.#check_size(1)
        const read = (this.data[this.offset])
        this.offset += 1
        if(signed){
            return read 
        } else {
            return read & 0xFF
        }
    }

    /**
    * @returns number
    */
    readUByte = function(){
        return this.readByte(true)
    }

    /**
    * @returns number
    */
    ubyte = function(){
        return this.readByte(true)
    }
    /**
    * @returns number
    */
    byte = function(){
        return this.readByte(false)
    }

    /**
    * @returns number
    */
    uint8 = function(){
        return this.readByte(true)
    }
    /**
    * @returns number
    */
    int8 = function(){
        return this.readByte(false)
    }

    //short16 read

    /**
    * @returns number
    */
    readInt16LE = function(signed){
        this.#check_size(2)
        const read = (this.data[this.offset + 1] << 8) | this.data[this.offset];
        this.offset += 2
        if(signed){
            return read
        } else {
            return read & 0xFFFF
        }
    }

    /**
    * @returns number
    */
    readInt16BE = function(signed){
        this.#check_size(2)
        const read = (this.data[this.offset] << 8) | this.data[this.offset + 1];
        this.offset += 2
        if(signed){
            return read
        } else {
            return read & 0xFFFF
        }
    }

    /**
    * @returns number
    */
    readUInt16 = function(){
        if(this.endian == "little"){
            return this.readInt16LE(true)
        } else {
            return this.readInt16BE(true)
        }
    }

    /**
    * @returns number
    */
    readInt16 = function(){
        if(this.endian == "little"){
            return this.readInt16LE(false)
        } else {
            return this.readInt16BE(false)
        }
    }        

    /**
    * @returns number
    */
    readUShort = function(){
        return this.readUInt16()
    }

    /**
    * @returns number
    */
    readShort = function(){
        return this.readInt16()
    }

    /**
    * @returns number
    */
    ushort = function(){
        return this.readUInt16()
    }

    /**
    * @returns number
    */
    short = function (){
        return this.readInt16()
    }

    /**
    * @returns number
    */
    uint16 = function(){
        return this.readUInt16()
    }

    /**
    * @returns number
    */
    int16 = function (){
        return this.readInt16()
    }

    //int read

    /**
    * @returns number
    */
    readInt32LE = function(signed){
        this.#check_size(4)
        const read = ((this.data[this.offset + 3] << 24) | (this.data[this.offset + 2] << 16) | (this.data[this.offset + 1] << 8) | this.data[this.offset])
        this.offset += 4
        if(signed){
            return read
        } else {
            return read >>> 0
        }
    }

    /**
    * @returns number
    */
    readInt32BE = function(signed){
        this.#check_size(4)
        const read = (this.data[this.offset] << 24) | (this.data[this.offset + 1] << 16) | (this.data[this.offset + 2] << 8) | this.data[this.offset + 3]
        this.offset += 4
        if(signed){
            return read
        } else {
            return read >>> 0
        }
    }

    /**
    * @returns number
    */
    readUInt32 = function(){
        if(this.endian == "little"){
            return this.readInt32LE(true)
        } else {
            return this.readInt32BE(true)
        }
    }

    /**
    * @returns number
    */
    readInt32 = function(){
        if(this.endian == "little"){
            return this.readInt32LE(false)
        } else {
            return this.readInt32BE(false)
        }
    }

    /**
    * @returns number
    */
    readUInt = function(){
        return this.readUInt32()
    }

    /**
    * @returns number
    */
    readInt = function(){
        return this.readInt32()
    }

    /**
    * @returns number
    */
    int = function(){
        return this.readInt32()
    }

    /**
    * @returns number
    */
    uint = function(){
        return this.readUInt32()
    }

    //string reader

    /**
    * inculde length or reads until 0 byte
    * can include terminate character (as number), defaults to 0
    * @param {number} length - number
    * @param {any} terminateValue - number
    * @returns string
    */
    string = function(length,terminateValue){
        var terminate = 0
        if(length != undefined){
            this.#check_size(length)
        }
        if(typeof terminateValue == "number"){
            terminate = terminateValue & 0xFF
        }
        if (length === undefined) {
            let currentString = '';
        
            for (let i = this.offset; i < this.size; i++) {
                const byte = this.readUByte();
                if (byte != terminate) {
                    currentString += String.fromCharCode(byte);
                } else {
                    break;
                }
            }
            return currentString;
        } else {
            // If a length is specified, read that many bytes
            const string = String.fromCharCode.apply(null, this.data.slice(this.offset, this.offset+length))
            this.offset += length
            return string;
        }
    }

    /**
    * inculde length or reads until 0 byte
    * can include terminate character (as number), defaults to 0
    * @param {number} length - number
    * @param {any} terminateValue - number
    * @returns string
    */
    readString = function(length,terminateValue){
        return this.string(length,terminateValue)
    }

    /**
    * can switch byte order on demand, default to set endianness
    * inculde length in bytes or reads until 0 short
    * can include terminate character (as number), defaults to 0
    * @param {number} byteorder - number
    * @param {number} length - number
    * @param {any} terminateValue - number
    * @returns string
    */
    string16 = function(byteorder,length,terminateValue){
        var terminate = 0x0000
        if(length != undefined){
            this.#check_size(length)
        }
        if(typeof terminateValue == "number"){
            terminate = terminateValue & 0xFFFF
        }
        if(byteorder != undefined && !(byteorder == "big" || byteorder == "little")){
            throw Error("byteorder must be big or little")
        }
        if (length == undefined) {
            let currentString = '';
        
            for (let i = this.offset; i < this.size; i += 2) {
                var short = terminateValue;
                var endian = byteorder || this.endian
                if(endian == "big"){
                    short = this.readInt16BE(true)
                }
                if(endian == "little"){
                    short = this.readInt16LE(true)
                }
                
                if (short != terminate) {
                    currentString += String.fromCharCode(short);
                } else {
                    break;
                }
            }
            return currentString;
        } else {
            let currentString = '';
        
            for (let i = 0; i < (length/2); i++) {
                var short = terminateValue;
                var endian = byteorder || this.endian
                if(endian == "big"){
                    short = this.readInt16BE(true)
                }
                if(endian == "little"){
                    short = this.readInt16LE(true)
                }
                currentString += String.fromCharCode(short);
            }
            return currentString;
        }
    }

    /**
    * can switch byte order on demand, default to set endianness
    * inculde length in bytes or reads until 0 short
    * can include terminate character (as number), defaults to 0
    * @param {string} byteorder - ```big``` or ```little```
    * @param {number} length - number
    * @param {any} terminateValue - number
    * @returns string
    */
    read16String = function(byteorder,length,terminateValue){
        return this.string16(byteorder,length,terminateValue)
    }

    /**
    * can switch byte order on demand, default to set endianness
    * inculde length in bytes or reads until 0 short
    * can include terminate character (as number), defaults to 0
    * @param {string} byteorder - ```big``` or ```little```
    * @param {number} length - number
    * @param {any} terminateValue - number
    * @returns string
    */
    readCString = function(byteorder,length,terminateValue){
        return this.string16(byteorder,length,terminateValue)
    }

    /**
    * can switch byte order on demand, default to set endianness
    * inculde length in bytes or reads until 0 short
    * can include terminate character (as number), defaults to 0
    * @param {string} byteorder - ```big``` or ```little```
    * @param {number} length - number
    * @param {any} terminateValue - number
    * @returns string
    */
    cstring = function(byteorder,length,terminateValue){
        return this.string16(byteorder,length,terminateValue)
    }

    //int64 reader

    /**
    * @returns number
    */
    readInt64LE = function(signed) {
        this.#check_size(8)
        
        // Convert the byte array to a BigInt
        let value = BigInt(0);
        for (let i = 0; i < 8; i++) {
            value |= BigInt(this.data[this.offset]) << BigInt(8 * i);
            this.offset += 1
        }
        if(signed){
            if (value & (BigInt(1) << BigInt(63))) {
                value -= BigInt(1) << BigInt(64);
            }
            return value;
        } else {
            return value;
        }
    }

    /**
    * @returns number
    */
    readInt64BE = function(signed) {
        this.#check_size(8)
        
        // Convert the byte array to a BigInt
        let value = BigInt(0);
        for (let i = 0; i < 8; i++) {
            value = (value << BigInt(8)) | BigInt(this.data[this.offset]);
            this.offset += 1
            }
        if(signed){
            if (value & (BigInt(1) << BigInt(63))) {
                value -= BigInt(1) << BigInt(64);
            }
            return value;
        } else {
            return value;
        }
    }

    /**
    * @returns number
    */
    readUInt64 = function(){
        if(this.endian == "little"){
            return this.readInt64LE(true)
        } else {
            return this.readInt64BE(true)
        }
    }

    /**
    * @returns number
    */
    readInt64 = function(){
        if(this.endian == "little"){
            return this.readInt32LE(false)
        } else {
            return this.readInt32BE(false)
        }
    }

    /**
    * @returns number
    */
    uint64 = function(){
        if(this.endian == "little"){
            return this.readInt64LE(true)
        } else {
            return this.readInt64BE(true)
        }
    }

    /**
    * @returns number
    */
    int64 = function(){
        if(this.endian == "little"){
            return this.readInt32LE(false)
        } else {
            return this.readInt32BE(false)
        }
    }

    //float read

    /**
    * @returns number
    */
    readFloat = function(order){
        this.#check_size(4)
        var uint32Value;
        var endian = order == undefined ? this.endian : order
        if(endian == "little"){
            uint32Value = this.readInt32LE(true)
        } else {
            uint32Value = this.readInt32BE(true)
        }
        // Check if the value is negative (i.e., the most significant bit is set)
        const isNegative = (uint32Value & 0x80000000) !== 0;

        // Extract the exponent and fraction parts
        const exponent = (uint32Value >> 23) & 0xFF;
        const fraction = uint32Value & 0x7FFFFF;

        // Calculate the float value
        let floatValue;

        if (exponent === 0) {
            // Denormalized number (exponent is 0)
            floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
        } else if (exponent === 0xFF) {
            // Infinity or NaN (exponent is 255)
            floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
        } else {
            // Normalized number
            floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
        }

        return floatValue;
    }

    /**
    * @returns number
    */
    float = function(){
        return this.readFloat()
    }

    /**
    * @returns number
    */
    floatbe = function(){
        return this.readFloat(true)
    }

     /**
    * @returns number
    */
    floatle = function(){
        return this.readFloat(false)
    }

    /**
    * @returns number
    */
    readFloatBE = function(){
        return this.readFloat(true)
    }

    /**
    * @returns number
    */
    readFloatLE = function(){
        return this.readFloat(false)
    }

    //half float read

    /**
    * @returns number
    */
    readHalfFloat = function(order){
        this.#check_size(2)
        var uint16Value;
        var endian = order == undefined ? this.endian : order
        if(endian == "little"){
            uint16Value = this.readInt16LE(true)
        } else {
            uint16Value = this.readInt16BE(true)
        }
        const sign = (uint16Value & 0x8000) >> 15;
        const exponent = (uint16Value & 0x7C00) >> 10;
        const fraction = uint16Value & 0x03FF;

        let floatValue;

        if (exponent === 0) {
            if (fraction === 0) {
            floatValue = (sign === 0) ? 0 : -0; // +/-0
            } else {
            // Denormalized number
            floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
            }
        } else if (exponent === 0x1F) {
            if (fraction === 0) {
            floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
            } else {
            floatValue = Number.NaN;
            }
        } else {
            // Normalized number
            floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
        }

        return floatValue;
    }

    /**
    * @returns number
    */
    halffloat = function(){
        return this.readHalfFloat()
    }

    /**
    * @returns number
    */
    halffloatbe = function(){
        return this.readHalfFloat(true)
    }

     /**
    * @returns number
    */
    halffloatle = function(){
        return this.readHalfFloat(false)
    }

    /**
    * @returns number
    */
    readHalfFloatBE = function(){
        return this.readHalfFloat(true)
    }

    /**
    * @returns number
    */
    readHalfFloatLE = function(){
        return this.readHalfFloat(false)
    }

    //doublefloat reader

    /**
    * @returns number
    */
    readDoubleFloat = function(order){
        this.#check_size(8)
        var uint64Value ;
        var endian = order == undefined ? this.endian : order
        if(endian == "little"){
            uint64Value = this.readInt64LE(true)
        } else {
            uint64Value = this.readInt64BE(true)
        }
        const sign = (uint64Value & 0x8000000000000000n) >> 63n;
        const exponent = Number((uint64Value & 0x7FF0000000000000n) >> 52n) - 1023;
        const fraction = Number(uint64Value & 0x000FFFFFFFFFFFFFn) / Math.pow(2, 52);

        let floatValue;

        if (exponent == -1023) {
            if (fraction == 0) {
            floatValue = (sign == 0) ? 0 : -0; // +/-0
            } else {
            // Denormalized number
            floatValue = (sign == 0 ? 1 : -1) * Math.pow(2, -1022) * fraction;
            }
        } else if (exponent == 1024) {
            if (fraction == 0) {
            floatValue = (sign == 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
            } else {
            floatValue = Number.NaN;
            }
        } else {
            // Normalized number
            floatValue = (sign == 0 ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
        }

        return floatValue;
    }

    /**
    * @returns number
    */
    doublefloat = function(){
        return this.readDoubleFloat()
    }

    /**
    * @returns number
    */
    doublefloatbe = function(){
        return this.readDoubleFloat(true)
    }

     /**
    * @returns number
    */
     doublefloatle = function(){
        return this.readDoubleFloat(false)
    }

    /**
    * @returns number
    */
    readDoubleFloatBE = function(){
        return this.readDoubleFloat(true)
    }

    /**
    * @returns number
    */
    readDoubleFloatLE = function(){
        return this.readDoubleFloat(false)
    }
    
    /**
    * removes reading data
    */
    end = function(){
        this.data = []
    }

    /**
    * removes reading data
    */
    close = function(){
        this.data = []
    }
}

module.exports = bireader