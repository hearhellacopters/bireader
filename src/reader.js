/**
*
* byte reader, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
* @param {number} byteOffset - byte offset to start reader, default is 0 
* @param {number} bitOffset - bit offset to start reader, 0-7 
* @param {string} endianness - endianness ```big``` or ```little``` (default ```little```)
*/
class bireader {
    endian = "little";
    offset = 0;
    bitoffset = 0;
    size = 0
    data;

    #check_size = function(read_size, read_bits){
        const new_off = this.offset + (read_size||0) + Math.ceil((this.bitoffset + (read_bits||0) )/ 8)
        if(new_off > this.size){
            throw new Error(`Reader reached end of data.`);
        }
    }

    #flip = function(unsignedValue){
        return unsignedValue > 127 ? unsignedValue - 256 : unsignedValue;
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
        if(endianness != undefined && typeof endianness != "string"){
            throw new Error("Endian must be big or little")
        }
        if(endianness != undefined && !(endianness == "big" || endianness == "little")){
            throw new Error("Byte order must be big or little")
        }
        this.endian = endianness || "little"
        
        if(byteOffset != undefined ){
            if(typeof byteOffset == "number"){
                this.offset = Math.round(byteOffset) || 0
            } else {
                throw new Error("Byte offset must be number")
            }
        }
        if(bitOffset!= undefined){
            this.bitoffset = (bitOffset % 8)
        }
        if(data == undefined){
            throw new Error("Data required")
        } else {
            this.size = data.length + ((bitOffset || 0) % 8)
            this.data = data
        }
    }

    /**
    *
    * Change endian, defaults to little
    * 
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - endianness ```big``` or ```little```
    */
    endianness = function(endian){
        if(endian == undefined || typeof endian != "string"){
            throw new Error("Endian must be big or little")
        }
        if(endian != undefined && !(endian == "big" || endian == "little")){
            throw new Error("Endian must be big or little")
        }
        this.endian = endian
    }

    /**
    *Sets endian to big
    */
    bigEndian = this.big = this.be = function(){
        this.endianness("big")
    }

    /**
    * Sets endian to little
    */
    littleEndian = this.little = this.le = function(){
        this.endianness("little")
    }

    /**
    * Move current read byte or bit position
    *
    * @param {number} offset - bytes to skip
    * @param {number} bits - bits to skip
    */
    skip = this.fskip = function(bytes, bits){
        this.#check_size(bytes || 0)
        if((((bytes || 0) + this.offset) + Math.ceil((this.bitoffset + (bits||0)) /8) ) > this.size){
            throw new Error("Seek outside of size of data: "+ this.size)
        }
        this.bitoffset += (bits || 0) % 8
        this.offset += (bytes || 0)
    }

    /**
    * Change current byte or bit read position
    * 
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    goto = this.seek = this.fseek = this.jump = this.pointer = this.warp = this.fsetpos = function(byte, bit){
        if((byte + Math.ceil((bit||0)/8) ) > this.size){
            throw new Error("Goto outside of size of data: " + this.size)
        }
        this.offset = byte
        this.bitoffset = (bit || 0) % 8
    }

    /**
    * Set offset to start of file
    */
    rewind = this.gotostart = this.tostart = function(){
        this.offset = 0
        this.bitoffset = 0
    }
    
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    ftell = this.tell = this.fgetpos =  function(){
        return this.offset
    }

    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    */
    clip = this.crop = this.truncate = this.slice = function(startOffset, endOffset){
        return this.data.slice(startOffset || 0, endOffset || this.offset)
    }

     /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * @param {number} length - length of data to copy from current offset
    */
    extract = this.wrap = this.lift = function(length){
        if(this.offset + (length ||0) > this.size){
            throw new Error("End offset outside of data: " + this.size)
        }
        return this.data.slice(this.offset, this.offset + (length ||0))
    }
    
    /**
    * Returns current data
    */
    get = this.return = function(){
        return this.data
    }
    
    /**
    * removes reading data
    */
    end = this.close = this.done = this.finished = function(){
        return this.data
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
    readBit = this.bit = function(bits, unsigned, endian){
        if(bits == undefined || typeof bits != "number"){
            throw new Error("Enter number of bits to read")
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32.');
        }
        const size_needed = ((((bits-1) + this.bitoffset) / 8) + this.offset)
        if (bits <= 0 || size_needed > this.size) {
            throw new Error("Invalid number of bits to read: " + size_needed + " of " + this.size);
        }

        var off_in_bits = (this.offset * 8) + this.bitoffset

        var value = 0;

        for (var i = 0; i < bits;) {
            var remaining = bits - i;
            var bitOffset = off_in_bits & 7;
            var currentByte = this.data[off_in_bits >> 3];

            var read = Math.min(remaining, 8 - bitOffset);

            var mask, readBits;
            if ((endian != undefined ? endian : this.endian)  == "big") {

                mask = ~(0xFF << read);
                readBits = (currentByte >> (8 - read - bitOffset)) & mask;
                value <<= read;
                value |= readBits;

            } else {

                mask = ~(0xFF << read);
                readBits = (currentByte >> bitOffset) & mask;
                value |= readBits << i;

            }

            off_in_bits += read;
            i += read;
        }

        this.offset = this.offset + Math.floor(((bits) + this.bitoffset) / 8) //end byte
        this.bitoffset = ((bits) + this.bitoffset) % 8

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
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1 = function(unsigned){
        return this.bit(1, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1le = function(unsigned){
        return this.bit(1, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1be = function(unsigned){
        return this.bit(1, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit1 = function(){
        return this.bit(1, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit1le = function(){
        return this.bit(1, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit1be = function(){
        return this.bit(1, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2 = function(unsigned){
        return this.bit(2, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2le = function(unsigned){
        return this.bit(2, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2be = function(unsigned){
        return this.bit(2, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit2 = function(){
        return this.bit(2, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit2le = function(){
        return this.bit(2, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit2be = function(){
        return this.bit(2, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3 = function(unsigned){
        return this.bit(3, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3le = function(unsigned){
        return this.bit(3, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3be = function(unsigned){
        return this.bit(3, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit3 = function(){
        return this.bit(3, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit3le = function(){
        return this.bit(3, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit3be = function(){
        return this.bit(3, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4 = function(unsigned){
        return this.bit(4, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4le = function(unsigned){
        return this.bit(4, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4be = function(unsigned){
        return this.bit(4, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit4 = function(){
        return this.bit(4, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit4le = function(){
        return this.bit(4, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit4be = function(){
        return this.bit(4, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5 = function(unsigned){
        return this.bit(5, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5le = function(unsigned){
        return this.bit(5, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5be = function(unsigned){
        return this.bit(5, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit5 = function(){
        return this.bit(5, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit5le = function(){
        return this.bit(5, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit5be = function(){
        return this.bit(5, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6 = function(unsigned){
        return this.bit(6, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6le = function(unsigned){
        return this.bit(6, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6be = function(unsigned){
        return this.bit(6, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit6 = function(){
        return this.bit(6, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit6le = function(){
        return this.bit(6, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit6be = function(){
        return this.bit(6, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7 = function(unsigned){
        return this.bit(7, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7le = function(unsigned){
        return this.bit(7, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7be = function(unsigned){
        return this.bit(7, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit7 = function(){
        return this.bit(7, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit7le = function(){
        return this.bit(7, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit7be = function(){
        return this.bit(7, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8 = function(unsigned){
        return this.bit(8, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8le = function(unsigned){
        return this.bit(8, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8be = function(unsigned){
        return this.bit(8, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit8 = function(){
        return this.bit(8, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit8le = function(){
        return this.bit(8, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit8be = function(){
        return this.bit(8, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9 = function(unsigned){
        return this.bit(9, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9le = function(unsigned){
        return this.bit(9, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9be = function(unsigned){
        return this.bit(9, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit9 = function(){
        return this.bit(9, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit9le = function(){
        return this.bit(9, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit9be = function(){
        return this.bit(9, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10 = function(unsigned){
        return this.bit(10, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10le = function(unsigned){
        return this.bit(10, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10be = function(unsigned){
        return this.bit(10, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit10 = function(){
        return this.bit(10, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit10le = function(){
        return this.bit(10, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit10be = function(){
        return this.bit(10, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11 = function(unsigned){
        return this.bit(11, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11le = function(unsigned){
        return this.bit(11, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11be = function(unsigned){
        return this.bit(11, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit11 = function(){
        return this.bit(11, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit11le = function(){
        return this.bit(11, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit11be = function(){
        return this.bit(11, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12 = function(unsigned){
        return this.bit(12, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12le = function(unsigned){
        return this.bit(12, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12be = function(unsigned){
        return this.bit(12, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit12 = function(){
        return this.bit(12, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit12le = function(){
        return this.bit(12, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit12be = function(){
        return this.bit(12, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13 = function(unsigned){
        return this.bit(13, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13le = function(unsigned){
        return this.bit(13, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13be = function(unsigned){
        return this.bit(13, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit13 = function(){
        return this.bit(13, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit13le = function(){
        return this.bit(13, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit13be = function(){
        return this.bit(13, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14 = function(unsigned){
        return this.bit(14, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14le = function(unsigned){
        return this.bit(14, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14be = function(unsigned){
        return this.bit(14, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit14 = function(){
        return this.bit(14, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit14le = function(){
        return this.bit(14, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit14be = function(){
        return this.bit(14, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15 = function(unsigned){
        return this.bit(15, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15le = function(unsigned){
        return this.bit(15, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15be = function(unsigned){
        return this.bit(15, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit15 = function(){
        return this.bit(15, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit15le = function(){
        return this.bit(15, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit15be = function(){
        return this.bit(15, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16 = function(unsigned){
        return this.bit(16, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16le = function(unsigned){
        return this.bit(16, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16be = function(unsigned){
        return this.bit(16, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit16 = function(){
        return this.bit(16, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit16le = function(){
        return this.bit(16, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit16be = function(){
        return this.bit(16, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17 = function(unsigned){
        return this.bit(17, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17le = function(unsigned){
        return this.bit(17, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17be = function(unsigned){
        return this.bit(17, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit17 = function(){
        return this.bit(17, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit17le = function(){
        return this.bit(17, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit17be = function(){
        return this.bit(17, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18 = function(unsigned){
        return this.bit(18, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18le = function(unsigned){
        return this.bit(18, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18be = function(unsigned){
        return this.bit(18, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit18 = function(){
        return this.bit(18, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit18le = function(){
        return this.bit(18, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit18be = function(){
        return this.bit(18, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19 = function(unsigned){
        return this.bit(19, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19le = function(unsigned){
        return this.bit(19, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19be = function(unsigned){
        return this.bit(19, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit19 = function(){
        return this.bit(19, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit19le = function(){
        return this.bit(19, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit19be = function(){
        return this.bit(19, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20 = function(unsigned){
        return this.bit(20, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20le = function(unsigned){
        return this.bit(20, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20be = function(unsigned){
        return this.bit(20, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit20 = function(){
        return this.bit(20, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit20le = function(){
        return this.bit(20, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit20be = function(){
        return this.bit(20, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21 = function(unsigned){
        return this.bit(21, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21le = function(unsigned){
        return this.bit(21, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21be = function(unsigned){
        return this.bit(21, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit21 = function(){
        return this.bit(21, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit21le = function(){
        return this.bit(21, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit21be = function(){
        return this.bit(21, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22 = function(unsigned){
        return this.bit(22, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22le = function(unsigned){
        return this.bit(22, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22be = function(unsigned){
        return this.bit(22, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit22 = function(){
        return this.bit(22, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit22le = function(){
        return this.bit(22, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit22be = function(){
        return this.bit(22, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23 = function(unsigned){
        return this.bit(23, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23le = function(unsigned){
        return this.bit(23, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23be = function(unsigned){
        return this.bit(23, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit23 = function(){
        return this.bit(23, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit23le = function(){
        return this.bit(23, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit23be = function(){
        return this.bit(23, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24 = function(unsigned){
        return this.bit(24, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24le = function(unsigned){
        return this.bit(24, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24be = function(unsigned){
        return this.bit(24, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit24 = function(){
        return this.bit(24, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit24le = function(){
        return this.bit(24, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit24be = function(){
        return this.bit(24, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25 = function(unsigned){
        return this.bit(25, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25le = function(unsigned){
        return this.bit(25, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25be = function(unsigned){
        return this.bit(25, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit25 = function(){
        return this.bit(25, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit25le = function(){
        return this.bit(25, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit25be = function(){
        return this.bit(25, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26 = function(unsigned){
        return this.bit(26, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26le = function(unsigned){
        return this.bit(26, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26be = function(unsigned){
        return this.bit(26, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit26 = function(){
        return this.bit(26, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit26le = function(){
        return this.bit(26, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit26be = function(){
        return this.bit(26, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27 = function(unsigned){
        return this.bit(27, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27le = function(unsigned){
        return this.bit(27, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27be = function(unsigned){
        return this.bit(27, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit27 = function(){
        return this.bit(27, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit27le = function(){
        return this.bit(27, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit27be = function(){
        return this.bit(27, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28 = function(unsigned){
        return this.bit(28, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28le = function(unsigned){
        return this.bit(28, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28be = function(unsigned){
        return this.bit(28, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit28 = function(){
        return this.bit(28, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit28le = function(){
        return this.bit(28, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit28be = function(){
        return this.bit(28, true, "big")
    }
	
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29 = function(unsigned){
        return this.bit(29, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29le = function(unsigned){
        return this.bit(29, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29be = function(unsigned){
        return this.bit(29, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit29 = function(){
        return this.bit(29, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit29le = function(){
        return this.bit(29, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit29be = function(){
        return this.bit(29, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30 = function(unsigned){
        return this.bit(30, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30le = function(unsigned){
        return this.bit(30, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30be = function(unsigned){
        return this.bit(30, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit30 = function(){
        return this.bit(30, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit30le = function(){
        return this.bit(30, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit30be = function(){
        return this.bit(30, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31 = function(unsigned){
        return this.bit(31, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31le = function(unsigned){
        return this.bit(31, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31be = function(unsigned){
        return this.bit(31, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit31 = function(){
        return this.bit(31, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit31le = function(){
        return this.bit(31, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit31be = function(){
        return this.bit(31, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32 = function(unsigned){
        return this.bit(32, unsigned)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32le = function(unsigned){
        return this.bit(32, unsigned, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32be = function(unsigned){
        return this.bit(32, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit32 = function(){
        return this.bit(32, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit32le = function(){
        return this.bit(32, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit32be = function(){
        return this.bit(32, true, "big")
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
    readUBitBE = this.ubitbe = function(bits){
        return this.readBit(bits, true, "big")
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
    readBitBE = this.bitbe = function(bits, unsigned){
        return this.readBit(bits, unsigned, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} signed - if the value is unsigned
    * @returns number
    */
    readUBitLE = this.ubitle = function(bits){
        return this.readBit(bits, true, "little")
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
    readBitLE = this.bitle = function(bits, signed){
        return this.readBit(bits, signed, "little")
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
    readByte = this.byte = this.int8 = function(unsigned){
        this.#check_size(1)
        const read = this.#flip(this.data[this.offset])
        this.offset += 1
        if(unsigned == true){
            return read & 0xFF
        } else {
            return read 
        }
    }

    /**
    * Read unsigned byte
    * 
    * @returns number
    */
    readUByte = this.uint8 = this.ubyte = function(){
        return this.readByte(true)
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
    readInt16 = this.short = this.int16 = this.word = function(unsigned, endian){
        this.#check_size(2)
        var read
        if((endian != undefined ? endian : this.endian)  == "little"){
            read = (this.#flip(this.data[this.offset + 1]) << 8) | this.#flip(this.data[this.offset]);
        } else {
            read = (this.#flip(this.data[this.offset]) << 8) | this.#flip(this.data[this.offset + 1]);
        }
        this.offset += 2
        if(unsigned == undefined || unsigned == false){
            return read
        } else {
            return read & 0xFFFF
        }
    }

    /**
    * Read unsigned short
    * 
    * @param {string} endian - ```big``` or ```little```
    * 
    * @returns number
    */
    readUInt16 = this.uint16 = this.ushort = this.uword = function(endian){
        return this.readInt16(true, endian)
    }

    /**
    * Read unsigned short in little endian
    * 
    * @returns number
    */
    readUInt16LE = this.uint16le = this.ushortle = this.uwordle = function(){
        return this.readInt16(true, "little")
    }

    /**
    * Read signed short in little endian
    * 
    * @returns number
    */
    readInt16LE = this.int16le = this.shortle = this.wordle = function(){
        return this.readInt16(false, "little")
    }

    /**
    * Read unsigned short in big endian
    * 
    * @returns number
    */
    readUInt16BE = this.uint16be = this.ushortbe = this.uwordbe = function(){
        return this.readInt16(true, "big")
    }

    /**
    * Read signed short in big endian
    * 
    * @returns number
    */
    readInt16BE = this.int16be = this.shortbe = this.wordbe = function(){
        return this.readInt16(false, "big")
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
    readHalfFloat = this.halffloat = this.half = function(endian){
        this.#check_size(2)
        var uint16Value;
        if((endian != undefined ? endian : this.endian) == "little"){
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
    * Read half float
    * 
    * @returns number
    */
    readHalfFloatBE = this.halffloatbe = this.halfbe = function(){
        return this.readHalfFloat("big")
    }

    /**
    * Read half float
    * 
    * @returns number
    */
    readHalfFloatLE = this.halffloatle = this.halfle = function(){
        return this.readHalfFloat("little")
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
    readInt32 = this.int = this.double = this.int32 = this.long  = function(unsigned, endian){
        this.#check_size(4)
        var read;
        if((endian != undefined ? endian : this.endian) == "little"){
            read = (((this.data[this.offset + 3] & 0xFF)<< 24) | ((this.data[this.offset + 2] & 0xFF) << 16) | ((this.data[this.offset + 1] & 0xFF) << 8) | (this.data[this.offset] & 0xFF))
        } else {
            read = ((this.data[this.offset] & 0xFF) << 24) | ((this.data[this.offset + 1] & 0xFF) << 16) | ((this.data[this.offset + 2] & 0xFF) << 8) | (this.data[this.offset + 3] & 0xFF)
        }
        this.offset += 4
        if(unsigned == undefined || unsigned == false){
            return read
        } else {
            return read >>> 0
        }
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    readUInt = this.uint = this.udouble = this.uint32 = this.ulong = function(){
        return this.readInt32(true)
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    readInt32BE = this.intbe = this.doublebe = this.int32be = this.longbe = function(){
        return this.readInt32(false, "big")
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    readUInt32BE = this.uintbe = this.udoublebe = this.uint32be = this.ulongbe = function(){
        return this.readInt32(true, "big")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    readInt32LE = this.intle = this.doublele = this.int32le = this.longle = function(){
        return this.readInt32(false, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    readUInt32LE = this.uintle = this.udoublele = this.uint32le = this.ulongle = function(){
        return this.readInt32(true, "little")
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
    readFloat = this.float = function(endian){
        this.#check_size(4)
        var uint32Value;
        if((endian == undefined ? this.endian : endian) == "little"){
            uint32Value = this.readUInt32LE()
        } else {
            uint32Value = this.readUInt32BE()
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
    * Read float
    * 
    * @returns number
    */
    readFloatBE = this.floatbe = function(){
        return this.readFloat("big")
    }

    /**
    * Read float
    * 
    * @returns number
    */
     readFloatLE = this.floatle = function(){
        return this.readFloat("little")
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
    readInt64 = this.int64 = this.bigint = this.quad = function(unsigned, endian) {
        this.#check_size(8)
        
        // Convert the byte array to a BigInt
        let value = BigInt(0);
        if((endian == undefined ? this.endian : endian) == "little"){
            for (let i = 0; i < 8; i++) {
                value |= BigInt(this.#flip(this.data[this.offset])) << BigInt(8 * i);
                this.offset += 1
            }
            if(unsigned == undefined || unsigned == false){
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
                return value;
            } else {
                return value;
            }
        } else {
            for (let i = 0; i < 8; i++) {
                value = (value << BigInt(8)) | BigInt(this.#flip(this.data[this.offset]));
                this.offset += 1
                }
            if(unsigned == undefined || unsigned == false){
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
                return value;
            } else {
                return value;
            }
        }
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    readUInt64 = this.uint64 = this.ubigint = this.uquad = function() {
        return this.readInt64(true)
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    readInt64BE = this.int64be = this.bigintbe = this.quadbe = function() {
        return this.readInt64(false, "big")
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    readUInt64BE = this.uint64be = this.ubigintbe = this.uquadbe =  function() {
        return this.readInt64(true, "big");
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    readInt64LE = this.int64le = this.bigintle = this.quadle = function() {
        return this.readInt64(false, "little")
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    readUInt64LE = this.uint64le = this.ubigintle = this.uquadle = function() {
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
    readDoubleFloat = this.doublefloat = this.dfloat = function(endian){
        this.#check_size(8)
        var uint64Value;
        if((endian == undefined ? this.endian : endian) == "little"){
            uint64Value = this.readUInt64LE()
        } else {
            uint64Value = this.readUInt64BE()
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
    * Read double float
    * 
    * @returns number
    */
    readDoubleFloatBE = this.dfloatebe = this.doublefloatbe = function(){
        return this.readDoubleFloat("big")
    }

    /**
    * Read double float
    * 
    * @returns number
    */
    readDoubleFloatLE = this.dfloatle = this.doublefloatle = function(){
        return this.readDoubleFloat("little")
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
    readString = this.string = function(options = {}){

        var {
            length = undefined,
            stringType = 'utf-8',
            terminateValue = undefined,
            lengthReadSize = 1,
            stripNull = true,
            encoding = undefined,
            endian = this.endian,  
        } = options;
        
        var terminate = terminateValue

        if(length != undefined){
            this.#check_size(length)
        }
        
        if(typeof terminateValue == "number"){
            terminate = terminateValue & 0xFF
        } else {
            if(terminateValue != undefined){
                throw new Error("terminateValue must be a number")
            }
        }

        if (stringType == 'utf-8' || stringType == 'utf-16') {

            if(encoding == undefined){
                if(stringType == 'utf-8'){
                    encoding = 'utf-8'
                }
                if(stringType == 'utf-16'){
                    encoding = 'utf-16'
                }
            }

            // Read the string as UTF-8 encoded untill 0 or terminateValue
            const encodedBytes = [];

            if(length == undefined && terminateValue == undefined){
                terminate = 0
            }

            var read_length = 0;

            if(length != undefined){
                read_length = length
            } else {
                read_length = this.data.length - this.offset
            }

            for (let i = 0; i < read_length; i++) {
                if (stringType === 'utf-8') {
                    var read = this.readUByte();
                    if(read == terminate){
                        break;
                    } else {
                        if(!(stripNull == true && read == 0)){
                            encodedBytes.push(read);
                        }
                    }
                } else {
                    var read = this.readInt16(true, endian);
                    var read1 = read & 0xFF
                    var read2 = (read >> 8) & 0xFF
                    if(read == terminate){
                        break;
                    } else {
                        if(!(stripNull == true && read == 0)){
                            encodedBytes.push(read1);
                            encodedBytes.push(read2);
                        }
                    }
                }
            }

            return new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));

        } else if (stringType == 'pascal' || stringType == 'wide-pascal') {

            if(encoding == undefined){
                if(stringType == 'pascal'){
                    encoding = 'utf-8'
                }
                if(stringType == 'wide-pascal'){
                    encoding = 'utf-16'
                }
            }

            var maxBytes;
            if(lengthReadSize == 1){
                maxBytes = this.readUByte();
            } else if(lengthReadSize == 2){
                maxBytes = this.readInt16(true, endian);
            } else if(lengthReadSize == 4){
                maxBytes = this.readInt32(true, endian);
            } else {
                throw new Error("Invalid length read size: " + lengthReadSize)
            }
            
            // Read the string as Pascal or Delphi encoded
            const encodedBytes = [];
            for (let i = 0; i < maxBytes; i++) {
              if (stringType == 'wide-pascal') {
                const read = this.readInt16(true, endian)
                if(!(stripNull == true && read == 0)){
                    encodedBytes.push(read)
                }
              } else {
                const read = this.readUByte()
                if(!(stripNull == true && read == 0)){
                    encodedBytes.push(read)
                }
              }
            }
            var str_return
            if(stringType == 'wide-pascal'){
                str_return = new TextDecoder(encoding).decode(new Uint16Array(encodedBytes));
            } else {
                str_return = new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
            }
        
            return str_return
        } else {
            throw new Error('Unsupported string type: '+ stringType);
        }
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
    utf8string = this.cstring = function(length, terminateValue, stripNull){
        return this.string({stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull})
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
    ansistring = function(length, terminateValue, stripNull){
        return this.string({stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull})
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
    utf16string = this.unistring = function(length, terminateValue, stripNull, endian){
        return this.string({stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull})
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
    utf16stringle = this.unistringle = function(length, terminateValue, stripNull){
        return this.string({stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull})
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
    utf16stringbe = this.unistringbe = function(length, terminateValue, stripNull){
        return this.string({stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull})
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
    pstring = function(lengthReadSize, stripNull, endian){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian})
    }

    /**
    * Reads Pascal string 1 byte length read
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    * 
    * @return string
    */
    pstring1 = function(stripNull, endian){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: endian})
    }

    /**
    * Reads Pascal string 1 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring1le = function(stripNull){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little"})
    }

    /**
    * Reads Pascal string 1 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring1be = function(stripNull){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "big"})
    }

    /**
    * Reads Pascal string 2 byte length read
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    * 
    * @return string
    */
    pstring2 = function(stripNull, endian){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: endian})
    }

    /**
    * Reads Pascal string 2 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring2le = function(stripNull){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little"})
    }

    /**
    * Reads Pascal string 2 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring2be = function(stripNull){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "big"})
    }

    /**
    * Reads Pascal string 4 byte length read
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    * 
    * @return string
    */
    pstring4 = function(stripNull, endian){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: endian})
    }

    /**
    * Reads Pascal string 4 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring4le = function(stripNull){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little"})
    }

    /**
    * Reads Pascal string 4 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring4be = function(stripNull){
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "big"})
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
    wpstring = function(lengthReadSize, stripNull, endian){
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 1 byte length read
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    * 
    * @return string
    */
    wpstring1 = function(stripNull, endian){
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: endian, stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 2 byte length read
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    * 
    * @return string
    */
    wpstring2 = function(stripNull, endian){
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: endian, stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    wpstring2le = function(stripNull){
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    wpstring2be = function(stripNull){
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "big", stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 4 byte length read
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    * 
    * @return string
    */
    wpstring4 = function(stripNull, endian){
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: endian, stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    wpstring4be = function(stripNull){
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    wpstring4le = function(stripNull){
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull})
    }

}

module.exports = bireader