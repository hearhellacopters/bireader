/**
* Binary writer, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
* @param {number} byteOffset - byte offset to start writer, default is 0 
* @param {number} bitOffset - bit offset to start writer, 0-7 
* @param {string} endianness - endianness ``big`` or ``little`` (default little)
* @param {boolean} strict - strict mode: if true does not extend supplied array on outside write (default false)
*/
class biwriter {
    endian = "little";
    offset = 0;
    bitoffset = 0;
    size = 0;
    strict = false;
    data;

    #isBuffer = function(obj) {
        return (typeof Buffer !== 'undefined' && obj instanceof Buffer);
    }

    #isBufferOrUint8Array = function(obj) {
        return obj instanceof Uint8Array || this.#isBuffer(obj);
    }

    extendArray = function(to_padd) {
        if((typeof Buffer !== 'undefined' && this.data instanceof Buffer)){
            var paddbuffer = Buffer.alloc(to_padd);
            this.data = Buffer.concat([this.data, paddbuffer]);
        } else {
            const addArray = new Array(to_padd);
            this.data = new Uint8Array([...this.data, ...addArray]);
        }
    }

    #check_size = function(write_bytes, write_bit, offset){
        const bits = (write_bit || 0) + this.bitoffset
        var new_off = (offset || this.offset)
        var writesize = write_bytes || 0
        if(bits != 0){
            //add bits
            writesize += Math.ceil(bits / 8)
        }
        //if biger extend
        const needed_size = new_off + writesize
        if(needed_size > this.size){
            const dif = needed_size - this.size
            if(this.strict == false){
                this.extendArray(dif)
            } else {
                throw new Error("Location outside of size of data: "+ this.size)
            }
            this.size = this.data.length
        }
        //start read location
        this.offset = new_off
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
        if(endianness != undefined && typeof endianness != "string"){
            throw new Error("endianness must be big or little")
        }
        if(endianness != undefined && !(endianness == "big" || endianness == "little")){
            throw new Error("Endianness must be big or little")
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
        if(typeof strict == "boolean"){
            this.strict = strict
        } else {
            if(strict != undefined){
                throw new Error("Strict mode must be true of false")
            }
        }
        this.data = data
        if(this.data == undefined){
            this.data = new Uint8Array(4)
        } else {
            if(!this.#isBufferOrUint8Array(this.data)){
                throw new Error("Write data must be UIntArray or Buffer")
            }           
        }
        this.size = this.data.length + ((bitOffset || 0) % 8)
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
    *
    * Sets endian to big
    */
    bigEndian = this.big = this.be = function(){
        this.endianness("big")
    }

    /**
    *
    * Sets endian to little
    */
    littleEndian = this.little = this.le = function(){
        this.endianness("little")
    }

    /**
    * Move current write byte or bit position, will extend data if outside of current size
    *
    * @param {number} bytes - bytes to skip
    * @param {number} bits - bits to skip (0-7)
    */
    skip = this.fskip = function(bytes, bits){
        this.#check_size(bytes, bits)
        this.offset += (bytes || 0)
        this.bitoffset += (bits || 0) % 8
    }

    /**
    * Change current byte or bit write position, will extend data if outside of current size
    * 
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    goto = this.seek = this.fseek = this.jump = this.pointer = this.warp = this.fsetpos = function(byte, bit){
        const new_size = (byte + Math.ceil((bit||0)/8) )
        if(new_size > this.size && this.strict == false){
            this.extendArray(new_size - this.size)
        } else {
            throw new Error("Outside of range of data: "+ this.size)
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
    ftell = this.tell = this.fgetpos = function(){
        return this.offset
    }

    /**
    * Disallows extending array if writing outside of max size
    */
    restrict = function(){
        this.strict = true
    }

    /**
    * Allows extending array if writing outside of max size
    */
    unrestrict = function(){
        this.strict = false
    }

    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    */
    clip = this.crop = this.truncate = this.slice = function(startOffset, endOffset){
        if(endOffset > this.size){
            if(this.strict == false){
                this.extendArray(endOffset - this.size)
            } else {
                throw new Error("End offset outside of data: " + this.size)
            }
        }
        return this.data.slice(Math.abs(startOffset || 0), endOffset || this.offset)
    }

    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} length - length of data to copy from current offset
    */
    extract = this.wrap = this.lift = function(length){
        if(this.offset + (length ||0) > this.size){
            if(this.strict == false){
                this.extendArray(this.offset + (length ||0) - this.size)
            } else {
                throw new Error("End offset outside of data: " + this.size)
            }
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
    * removes writing data
    */
    end = this.close = this.done = this.finished = function(){
        this.data = []
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
    writeBit = this.bit = function(value, bits, offsetBits, offsetBytes, unsigned, endian) {
        if(value == undefined){
            throw new Error('Must supply value.');
        }
        if(bits == undefined){
            throw new Error('Must supply bits.');
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32.');
        }
        if (unsigned == true) {
            if (value < 0 || value > Math.pow(2, bits)) {
                throw new Error(`Value is out of range for the specified ${bits}bit length.` +" min: " + 0 + " max: " + Math.pow(2, bits) + " value: "+ value);
            }
        } else {
            const maxValue = Math.pow(2, bits - 1) - 1;
            const minValue = -maxValue - 1;
            if(value < minValue || value > maxValue){
                throw new Error(`Value is out of range for the specified ${bits}bit length.` +" min: " + minValue + " max: " + maxValue + " value: "+ value);
            }
        }
        if(unsigned == true){
            const maxValue = Math.pow(2, bits) - 1;
            value = value & maxValue
        }

        const size_needed = (((((offsetBits || 0) + (bits-1)) + this.bitoffset) / 8) + (offsetBytes || this.offset))
        if (size_needed > this.size) {
            //add size
            this.extendArray(size_needed-this.size)
        }

        var off_in_bits = (this.offset * 8) + this.bitoffset

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
    
            } else {
                
                mask = ~(0xFF << written);
                writeBits = value & mask;
                value >>= written;
                destMask = ~(mask << bitOffset);
                this.data[byteOffset] = (this.data[byteOffset] & destMask) | (writeBits << bitOffset);
            
            }
    
            off_in_bits += written;
            i += written;
        }

        this.offset = this.offset + Math.floor(((bits) + this.bitoffset) / 8) //end byte
        this.bitoffset = ((bits) + this.bitoffset) % 8    
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
    bit1 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 1, offsetBits, offsetBytes, unsigned)
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
    ubit1 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 1, offsetBits, offsetBytes, true)
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
    bit1le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 1, offsetBits, offsetBytes, unsigned, "little")
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
    ubit1le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 1, offsetBits, offsetBytes, true, "little")
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
    bit1be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 1, offsetBits, offsetBytes, unsigned, "big")
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
    ubit1be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 1, offsetBits, offsetBytes, true, "big")
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
    bit2 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 2, offsetBits, offsetBytes, unsigned)
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
    ubit2 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 2, offsetBits, offsetBytes, true)
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
    bit2le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 2, offsetBits, offsetBytes, unsigned, "little")
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
    ubit2le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 2, offsetBits, offsetBytes, true, "little")
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
    bit2be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 2, offsetBits, offsetBytes, unsigned, "big")
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
    ubit2be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 2, offsetBits, offsetBytes, true, "big")
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
    bit3 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 3, offsetBits, offsetBytes, unsigned)
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
    ubit3 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 3, offsetBits, offsetBytes, true)
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
    bit3le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 3, offsetBits, offsetBytes, unsigned, "little")
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
    ubit3le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 3, offsetBits, offsetBytes, true, "little")
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
    bit3be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 3, offsetBits, offsetBytes, unsigned, "big")
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
    ubit3be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 3, offsetBits, offsetBytes, true, "big")
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
    bit4 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 4, offsetBits, offsetBytes, unsigned)
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
    ubit4 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 4, offsetBits, offsetBytes, true)
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
    bit4le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 4, offsetBits, offsetBytes, unsigned, "little")
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
    ubit4le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 4, offsetBits, offsetBytes, true, "little")
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
    bit4be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 4, offsetBits, offsetBytes, unsigned, "big")
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
    ubit4be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 4, offsetBits, offsetBytes, true, "big")
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
    bit5 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 5, offsetBits, offsetBytes, unsigned)
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
    ubit5 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 5, offsetBits, offsetBytes, true)
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
    bit5le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 5, offsetBits, offsetBytes, unsigned, "little")
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
    ubit5le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 5, offsetBits, offsetBytes, true, "little")
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
    bit5be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 5, offsetBits, offsetBytes, unsigned, "big")
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
    ubit5be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 5, offsetBits, offsetBytes, true, "big")
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
    bit6 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 6, offsetBits, offsetBytes, unsigned)
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
    ubit6 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 6, offsetBits, offsetBytes, true)
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
    bit6le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 6, offsetBits, offsetBytes, unsigned, "little")
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
    ubit6le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 6, offsetBits, offsetBytes, true, "little")
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
    bit6be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 6, offsetBits, offsetBytes, unsigned, "big")
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
    ubit6be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 6, offsetBits, offsetBytes, true, "big")
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
    bit7 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 7, offsetBits, offsetBytes, unsigned)
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
    ubit7 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 7, offsetBits, offsetBytes, true)
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
    bit7le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 7, offsetBits, offsetBytes, unsigned, "little")
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
    ubit7le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 7, offsetBits, offsetBytes, true, "little")
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
    bit7be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 7, offsetBits, offsetBytes, unsigned, "big")
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
    ubit7be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 7, offsetBits, offsetBytes, true, "big")
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
    bit8 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 8, offsetBits, offsetBytes, unsigned)
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
    ubit8 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 8, offsetBits, offsetBytes, true)
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
    bit8le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 8, offsetBits, offsetBytes, unsigned, "little")
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
    ubit8le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 8, offsetBits, offsetBytes, true, "little")
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
    bit8be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 8, offsetBits, offsetBytes, unsigned, "big")
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
    ubit8be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 8, offsetBits, offsetBytes, true, "big")
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
    bit9 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 9, offsetBits, offsetBytes, unsigned)
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
    ubit9 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 9, offsetBits, offsetBytes, true)
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
    bit9le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 9, offsetBits, offsetBytes, unsigned, "little")
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
    ubit9le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 9, offsetBits, offsetBytes, true, "little")
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
    bit9be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 9, offsetBits, offsetBytes, unsigned, "big")
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
    ubit9be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 9, offsetBits, offsetBytes, true, "big")
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
    bit10 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 10, offsetBits, offsetBytes, unsigned)
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
    ubit10 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 10, offsetBits, offsetBytes, true)
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
    bit10le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 10, offsetBits, offsetBytes, unsigned, "little")
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
    ubit10le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 10, offsetBits, offsetBytes, true, "little")
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
    bit10be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 10, offsetBits, offsetBytes, unsigned, "big")
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
    ubit10be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 10, offsetBits, offsetBytes, true, "big")
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
    bit11 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 11, offsetBits, offsetBytes, unsigned)
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
    ubit11 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 11, offsetBits, offsetBytes, true)
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
    bit11le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 11, offsetBits, offsetBytes, unsigned, "little")
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
    ubit11le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 11, offsetBits, offsetBytes, true, "little")
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
    bit11be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 11, offsetBits, offsetBytes, unsigned, "big")
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
    ubit11be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 11, offsetBits, offsetBytes, true, "big")
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
    bit12 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 12, offsetBits, offsetBytes, unsigned)
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
    ubit12 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 12, offsetBits, offsetBytes, true)
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
    bit12le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 12, offsetBits, offsetBytes, unsigned, "little")
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
    ubit12le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 12, offsetBits, offsetBytes, true, "little")
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
    bit12be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 12, offsetBits, offsetBytes, unsigned, "big")
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
    ubit12be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 12, offsetBits, offsetBytes, true, "big")
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
    bit13 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 13, offsetBits, offsetBytes, unsigned)
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
    ubit13 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 13, offsetBits, offsetBytes, true)
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
    bit13le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 13, offsetBits, offsetBytes, unsigned, "little")
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
    ubit13le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 13, offsetBits, offsetBytes, true, "little")
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
    bit13be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 13, offsetBits, offsetBytes, unsigned, "big")
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
    ubit13be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 13, offsetBits, offsetBytes, true, "big")
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
    bit14 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 14, offsetBits, offsetBytes, unsigned)
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
    ubit14 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 14, offsetBits, offsetBytes, true)
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
    bit14le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 14, offsetBits, offsetBytes, unsigned, "little")
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
    ubit14le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 14, offsetBits, offsetBytes, true, "little")
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
    bit14be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 14, offsetBits, offsetBytes, unsigned, "big")
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
    ubit14be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 14, offsetBits, offsetBytes, true, "big")
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
    bit15 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 15, offsetBits, offsetBytes, unsigned)
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
    ubit15 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 15, offsetBits, offsetBytes, true)
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
    bit15le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 15, offsetBits, offsetBytes, unsigned, "little")
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
    ubit15le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 15, offsetBits, offsetBytes, true, "little")
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
    bit15be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 15, offsetBits, offsetBytes, unsigned, "big")
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
    ubit15be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 15, offsetBits, offsetBytes, true, "big")
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
    bit16 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 16, offsetBits, offsetBytes, unsigned)
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
    ubit16 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 16, offsetBits, offsetBytes, true)
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
    bit16le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 16, offsetBits, offsetBytes, unsigned, "little")
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
    ubit16le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 16, offsetBits, offsetBytes, true, "little")
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
    bit16be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 16, offsetBits, offsetBytes, unsigned, "big")
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
    ubit16be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 16, offsetBits, offsetBytes, true, "big")
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
    bit17 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 17, offsetBits, offsetBytes, unsigned)
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
    ubit17 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 17, offsetBits, offsetBytes, true)
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
    bit17le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 17, offsetBits, offsetBytes, unsigned, "little")
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
    ubit17le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 17, offsetBits, offsetBytes, true, "little")
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
    bit17be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 17, offsetBits, offsetBytes, unsigned, "big")
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
    ubit17be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 17, offsetBits, offsetBytes, true, "big")
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
    bit18 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 18, offsetBits, offsetBytes, unsigned)
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
    ubit18 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 18, offsetBits, offsetBytes, true)
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
    bit18le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 18, offsetBits, offsetBytes, unsigned, "little")
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
    ubit18le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 18, offsetBits, offsetBytes, true, "little")
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
    bit18be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 18, offsetBits, offsetBytes, unsigned, "big")
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
    ubit18be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 18, offsetBits, offsetBytes, true, "big")
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
    bit19 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 19, offsetBits, offsetBytes, unsigned)
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
    ubit19 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 19, offsetBits, offsetBytes, true)
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
    bit19le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 19, offsetBits, offsetBytes, unsigned, "little")
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
    ubit19le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 19, offsetBits, offsetBytes, true, "little")
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
    bit19be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 19, offsetBits, offsetBytes, unsigned, "big")
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
    ubit19be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 19, offsetBits, offsetBytes, true, "big")
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
    bit20 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 20, offsetBits, offsetBytes, unsigned)
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
    ubit20 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 20, offsetBits, offsetBytes, true)
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
    bit20le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 20, offsetBits, offsetBytes, unsigned, "little")
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
    ubit20le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 20, offsetBits, offsetBytes, true, "little")
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
    bit20be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 20, offsetBits, offsetBytes, unsigned, "big")
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
    ubit20be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 20, offsetBits, offsetBytes, true, "big")
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
    bit21 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned)
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
    ubit21 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 21, offsetBits, offsetBytes, true)
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
    bit21le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned, "little")
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
    ubit21le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 21, offsetBits, offsetBytes, true, "little")
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
    bit21be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned, "big")
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
    ubit21be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 21, offsetBits, offsetBytes, true, "big")
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
    bit22 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned)
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
    ubit22 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 22, offsetBits, offsetBytes, true)
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
    bit22le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned, "little")
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
    ubit22le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 22, offsetBits, offsetBytes, true, "little")
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
    bit22be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned, "big")
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
    ubit22be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 22, offsetBits, offsetBytes, true, "big")
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
    bit21 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned)
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
    ubit21 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 21, offsetBits, offsetBytes, true)
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
    bit21le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned, "little")
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
    ubit21le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 21, offsetBits, offsetBytes, true, "little")
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
    bit21be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 21, offsetBits, offsetBytes, unsigned, "big")
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
    ubit21be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 21, offsetBits, offsetBytes, true, "big")
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
    bit22 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned)
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
    ubit22 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 22, offsetBits, offsetBytes, true)
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
    bit22le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned, "little")
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
    ubit22le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 22, offsetBits, offsetBytes, true, "little")
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
    bit22be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 22, offsetBits, offsetBytes, unsigned, "big")
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
    ubit22be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 22, offsetBits, offsetBytes, true, "big")
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
    bit23 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 23, offsetBits, offsetBytes, unsigned)
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
    ubit23 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 23, offsetBits, offsetBytes, true)
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
    bit23le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 23, offsetBits, offsetBytes, unsigned, "little")
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
    ubit23le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 23, offsetBits, offsetBytes, true, "little")
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
    bit23be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 23, offsetBits, offsetBytes, unsigned, "big")
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
    ubit23be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 23, offsetBits, offsetBytes, true, "big")
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
    bit24 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 24, offsetBits, offsetBytes, unsigned)
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
    ubit24 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 24, offsetBits, offsetBytes, true)
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
    bit24le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 24, offsetBits, offsetBytes, unsigned, "little")
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
    ubit24le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 24, offsetBits, offsetBytes, true, "little")
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
    bit24be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 24, offsetBits, offsetBytes, unsigned, "big")
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
    ubit24be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 24, offsetBits, offsetBytes, true, "big")
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
    bit25 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 25, offsetBits, offsetBytes, unsigned)
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
    ubit25 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 25, offsetBits, offsetBytes, true)
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
    bit25le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 25, offsetBits, offsetBytes, unsigned, "little")
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
    ubit25le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 25, offsetBits, offsetBytes, true, "little")
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
    bit25be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 25, offsetBits, offsetBytes, unsigned, "big")
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
    ubit25be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 25, offsetBits, offsetBytes, true, "big")
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
    bit26 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 26, offsetBits, offsetBytes, unsigned)
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
    ubit26 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 26, offsetBits, offsetBytes, true)
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
    bit26le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 26, offsetBits, offsetBytes, unsigned, "little")
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
    ubit26le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 26, offsetBits, offsetBytes, true, "little")
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
    bit26be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 26, offsetBits, offsetBytes, unsigned, "big")
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
    ubit26be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 26, offsetBits, offsetBytes, true, "big")
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
    bit27 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 27, offsetBits, offsetBytes, unsigned)
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
    ubit27 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 27, offsetBits, offsetBytes, true)
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
    bit27le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 27, offsetBits, offsetBytes, unsigned, "little")
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
    ubit27le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 27, offsetBits, offsetBytes, true, "little")
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
    bit27be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 27, offsetBits, offsetBytes, unsigned, "big")
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
    ubit27be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 27, offsetBits, offsetBytes, true, "big")
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
    bit28 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 28, offsetBits, offsetBytes, unsigned)
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
    ubit28 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 28, offsetBits, offsetBytes, true)
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
    bit28le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 28, offsetBits, offsetBytes, unsigned, "little")
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
    ubit28le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 28, offsetBits, offsetBytes, true, "little")
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
    bit28be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 28, offsetBits, offsetBytes, unsigned, "big")
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
    ubit28be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 28, offsetBits, offsetBytes, true, "big")
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
    bit29 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 29, offsetBits, offsetBytes, unsigned)
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
    ubit29 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 29, offsetBits, offsetBytes, true)
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
    bit29le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 29, offsetBits, offsetBytes, unsigned, "little")
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
    ubit29le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 29, offsetBits, offsetBytes, true, "little")
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
    bit29be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 29, offsetBits, offsetBytes, unsigned, "big")
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
    ubit29be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 29, offsetBits, offsetBytes, true, "big")
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
    bit30 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 30, offsetBits, offsetBytes, unsigned)
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
    ubit30 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 30, offsetBits, offsetBytes, true)
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
    bit30le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 30, offsetBits, offsetBytes, unsigned, "little")
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
    ubit30le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 30, offsetBits, offsetBytes, true, "little")
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
    bit30be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 30, offsetBits, offsetBytes, unsigned, "big")
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
    ubit30be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 30, offsetBits, offsetBytes, true, "big")
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
    bit31 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 31, offsetBits, offsetBytes, unsigned)
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
    ubit31 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 31, offsetBits, offsetBytes, true)
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
    bit31le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 31, offsetBits, offsetBytes, unsigned, "little")
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
    ubit31le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 31, offsetBits, offsetBytes, true, "little")
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
    bit31be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 31, offsetBits, offsetBytes, unsigned, "big")
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
    ubit31be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 31, offsetBits, offsetBytes, true, "big")
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
    bit32 = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned)
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
    ubit32 = function(value, offsetBits, offsetBytes){
        return this.bit(value, 32, offsetBits, offsetBytes, true)
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
    bit32le = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned, "little")
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
    ubit32le = function(value, offsetBits, offsetBytes){
        return this.bit(value, 32, offsetBits, offsetBytes, true, "little")
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
    bit32be = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned, "big")
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
    ubit32be = function(value, offsetBits, offsetBytes){
        return this.bit(value, 32, offsetBits, offsetBytes, true, "big")
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
    writeBitBE = this.bitbe = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned, "big")
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
    writeBitLE = this.bitle = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned, "little")
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
    writeByte = this.byte = this.int8 = function(value, offset, unsigned){
        this.#check_size(1,0,offset)
        if (unsigned == true) {
            if (value< 0 || value > 255) {
                throw new Error('Value is out of range for the specified 8bit length.' +" min: " + 0 + " max: " + 255 + " value: "+ value);
            }
        } else {
            const maxValue = Math.pow(2, 8 - 1) - 1;
            const minValue = -maxValue - 1;
            if(value < minValue || value > maxValue){
                throw new Error('Value is out of range for the specified 8bit length.' +" min: " + minValue + " max: " + maxValue + " value: "+ value);
            }
        }
        this.data[this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        this.offset += 1
    }

    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUByte = this.uint8 = this.ubyte = function(value, offset){
        return this.writeByte(value, offset, true)
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
    writeInt16 = this.int16 = this.short = this.word = function(value, offset, unsigned, endian) {
        this.#check_size(2,0,offset)
        if (unsigned == true) {
            if (value< 0 || value > 65535) {
                throw new Error('Value is out of range for the specified 16bit length.' +" min: " + 0 + " max: " + 65535 + " value: "+ value);
            }
        } else {
            const maxValue = Math.pow(2, 16 - 1) - 1;
            const minValue = -maxValue - 1;
            if(value < minValue || value > maxValue){
                throw new Error('Value is out of range for the specified 16bit length.' +" min: " + minValue + " max: " + maxValue + " value: "+ value);
            }
        }
        if((endian != undefined ? endian : this.endian) == "little"){
            this.data[this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
            this.data[this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff; 
        } else {
            this.data[this.offset] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
            this.data[this.offset + 1] = (unsigned == undefined || unsigned == false) ? value : value& 0xff;
        }
        this.offset += 2
    }

    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt16 = this.uint16 = this.ushort = this.uword =  function(value, offset, endian) {
        return this.writeInt16(value, offset, true, endian)
    }

    /**
    * Write signed int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt16BE = this.int16be = this.shortbe = this.wordbe =  function(value, offset) {
        return this.writeInt16(value, offset, false, "big")
    }

    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt16BE = this.uint16be = this.ushortbe = this.uwordbe =  function(value, offset) {
        return this.writeInt16(value, offset, true, "big")
    }

    /**
    * Write signed int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt16LE = this.int16le = this.shortle = this.wordle =  function(value, offset) {
        return this.writeInt16(value, offset, false, "little")
    }

    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt16LE = this.uint16le = this.ushortle = this.uwordle =  function(value, offset) {
        return this.writeInt16(value, offset, true, "little")
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
    writeHalfFloat = this.half = this.halffloat = function(value, offset, endian) {
        this.#check_size(2,0,offset)
        const maxValue = 65504;
        const minValue = 5.96e-08;
        if(value < minValue || value > maxValue){
            throw new Error('Value is out of range for the specified half float length.' +" min: " + minValue + " max: " + maxValue + " value: "+ value);
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
        } else if (exponentBits === 0x00) {
          // Denormalized numbers, exponent is 0, adjust exponent bits
          exponentBits = 0x00;
          fractionBits = 0x00; // Clear fraction for denormals
        } else {
          // Normalized number, subtract exponent bias
          exponentBits -= 15;
        }
      
        // Combine sign, exponent, and fraction bits into half float format
        let halfFloatBits = (signBit << 15) | (exponentBits << 10) | fractionBits;
      
        // Write bytes based on endianness
        if ((endian = undefined ? endian : this.endian ) == "little") {
          this.data[this.offset] = halfFloatBits & 0xFF;
          this.data[this.offset + 1] = (halfFloatBits >> 8) & 0xFF;
        } else {
          this.data[this.offset] = (halfFloatBits >> 8) & 0xFF;
          this.data[this.offset + 1] = halfFloatBits & 0xFF;
        }

        this.offset += 2
    }

    /**
    * Writes half float
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeHalfFloatBE = this.halffloatbe = this.halfbe = function(value, offset){
        return this.writeHalfFloat(value, offset, "big")
    }

    /**
    * Writes half float
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeHalfFloatLE = this.halffloatle = this.halfle = function(value, offset){
        return this.writeHalfFloat(value, offset, "little")
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
    writeInt32 = this.int = this.int32 = this.double = this.long = function(value, offset, unsigned, endian) {
        this.#check_size(4,0,offset)
        if (unsigned == true) {
            if (value < 0 || value > 4294967295) {
                throw new Error('Value is out of range for the specified 32bit length.' +" min: " + 0 + " max: " + 4294967295 + " value: "+ value);
            }
        } else {
            const maxValue = Math.pow(2, 32 - 1) - 1;
            const minValue = -maxValue - 1;
            if(value < minValue || value > maxValue){
                throw new Error('Value is out of range for the specified 32bit length.' +" min: " + minValue + " max: " + maxValue + " value: "+ value);
            }
        }
        if ((endian = undefined ? endian : this.endian ) == "little") {
            this.data[this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
            this.data[this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            this.data[this.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            this.data[this.offset + 3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        } else {
            this.data[this.offset] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
            this.data[this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 16): (value >> 16) & 0xFF;
            this.data[this.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            this.data[this.offset + 3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        }
        this.offset += 4
    }

    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
     writeUInt32 = this.uint32 = this.uint = this.udouble = this.ulong = function(value, offset, endian) {
        return this.writeInt32(value, offset, true, endian)
    }

    /**
    * Write signed int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt32LE = this.int32le = this.intle = this.doublele = this.longle = function(value, offset) {
        return this.writeInt32(value, offset, false, "little")
    }

    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt32LE = this.uint32le = this.uintle = this.udoublele = this.ulongle = function(value, offset) {
        return this.writeInt32(value, offset, true, "little")
    }

    /**
    * Write signed int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt32BE = this.int32be = this.int32be = this.doublebe = this.longbe = function(value, offset) {
        return this.writeInt32(value, offset, false, "big")
    }

    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt32BE = this.uint32be = this.uint32be = this.udoublebe = this.ulongbe = function(value, offset) {
        return this.writeInt32(value, offset, true, "big")
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
    writeFloat = this.float = function(value, offset, endian){
        this.#check_size(4,0,offset)
        const maxValue = 3.402823466e+38
        const minValue = 1.175494351e-38
        if(value < minValue || value > maxValue){
            throw new Error('Value is out of range for the specified float length.' +" min: " + minValue + " max: " + maxValue + " value: "+ value);
        }
        let intValue = Float32Array.from([value])[0]; // Convert float to 32-bit integer representation
        let shift = 0;
    
        for (let i = 0; i < 4; i++) {
            if ((endian = undefined ? endian : this.endian ) == "little") {
                this.data[this.offset + i] = (intValue >> shift) & 0xFF;
            } else {
                this.data[this.offset + (3 - i)] = (intValue >> shift) & 0xFF;
            }
            shift += 8;
        }

        this.offset += 4
    }

    /**
    * Write float
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeFloatLE = this.floatle = function(value, offset){
        return this.writeFloat(value, offset, "little")
    }

    /**
    * Write float
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
     writeFloatBE = this.floatbe = function(value, offset){
        return this.writeFloat(value, offset, "big")
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
    writeInt64 = this.int64 = this.quad = this.bigint = function(value, offset, unsigned, endian) {
        this.#check_size(8,0,offset)
        if (unsigned == true) {
            if (value < 0 || value > Math.pow(2, 64) - 1) {
                throw new Error('Value is out of range for the specified 64bit length.' +" min: " + 0 + " max: " + (Math.pow(2, 64) - 1) + " value: "+ value);
            }
        } else {
            const maxValue = Math.pow(2, 63) - 1;
            const minValue = -Math.pow(2, 63);
            if(value < minValue || value > maxValue){
                throw new Error('Value is out of range for the specified 64bit length.' +" min: " + minValue + " max: " + maxValue + " value: "+ value);
            }
        }
        // Convert the BigInt to a 64-bit signed integer
        const bigIntArray = new BigInt64Array(1);
        bigIntArray[0] = value;
      
        // Use two 32-bit views to write the Int64
        const int32Array = new Int32Array(bigIntArray.buffer);
      
        for (let i = 0; i < 2; i++) {
            if ((endian = undefined ? endian : this.endian ) == "little") {
                if(unsigned == undefined || unsigned == false){
                    this.data[this.offset + i * 4 + 0] = int32Array[i];
                    this.data[this.offset + i * 4 + 1] = (int32Array[i] >> 8);
                    this.data[this.offset + i * 4 + 2] = (int32Array[i] >> 16);
                    this.data[this.offset + i * 4 + 3] = (int32Array[i] >> 24);
                } else {
                    this.data[this.offset + i * 4 + 0] = int32Array[i] & 0xFF;
                    this.data[this.offset + i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                    this.data[this.offset + i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                    this.data[this.offset + i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            } else {
                if(unsigned == undefined || unsigned == false){
                    this.data[this.offset + (1 - i) * 4 + 0] = int32Array[i];
                    this.data[this.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 8);
                    this.data[this.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 16);
                    this.data[this.offset + (1 - i) * 4 + 3] = (int32Array[i] >> 24);
                } else {
                    this.data[this.offset + (1 - i) * 4 + 0] = int32Array[i] & 0xFF;
                    this.data[this.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                    this.data[this.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                    this.data[this.offset + (1 - i) * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            }
        }

        this.offset += 8
    }

    /**
    * Write unsigned 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt64 = this.uint64 = this.ubigint = this.uquad = function(value, offset, endian) {
        return this.writeInt64(value, offset, true, endian)
    }

    /**
    * Write signed 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt64LE = this.int64le = this.bigintle = this.quadle = function(value, offset) {
        return this.writeInt64(value, offset, false, "little")
    }

    /**
    * Write unsigned 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt64LE = this.uint64le = this.ubigintle = this.uquadle = function(value, offset) {
        return this.writeInt64(value, offset, true, "little")
    }

    /**
    * Write signed 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt64BE = this.int64be = this.bigintbe = this.quadbe =  function(value, offset) {
        return this.writeInt64(value, offset, false, "big")
    }

    /**
    * Write unsigned 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt64BE = this.uint64be = this.ubigintbe = this.uquadbe =  function(value, offset) {
        return this.writeInt64(value, offset, true, "big")
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
    writeDoubleFloat = this.doublefloat = this.dfloat =  function(value, offset, endian) {
        this.#check_size(8,0,offset)
        const maxValue = 1.7976931348623158e308;
        const minValue = 2.2250738585072014e-308;
        if(value < minValue || value > maxValue){
            throw new Error('Value is out of range for the specified 64bit length.' +" min: " + minValue + " max: " + maxValue + " value: "+ value);
        }
        const intArray = new Int32Array(2);
        const floatArray = new Float64Array(intArray.buffer);

        floatArray[0] = value;

        const bytes = new Uint8Array(intArray.buffer);

        for (let i = 0; i < 8; i++) {
            if ((endian = undefined ? endian : this.endian ) == "little") {
                this.data[this.offset + i] = bytes[i];
            } else {
                this.data[this.offset + (7 - i)] = bytes[i];
            }
        }

        this.offset += 8
    }

    /**
    * Writes double float
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeDoubleFloatBE = this.dfloatbe = this.doublefloatbe = function(value, offset){
        return this.writeDoubleFloat(value, offset, "big")
    }

    /**
    * Writes double float
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeDoubleFloatLE = this.dfloatle = this.doublefloatle = function(value, offset){
        return this.writeDoubleFloat(value, offset, "little")
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
    writeString = this.string = function(string, options = {}) {

        var {
            offset = undefined,
            length = undefined,
            stringType = 'utf-8',
            terminateValue = undefined,
            lengthWriteSize = 1,
            encoding = 'utf-8',
            endian = this.endian,
        } = options;
      
        if (stringType === 'utf-8' || stringType === 'utf-16') {
            // Encode the string in the specified encoding

            if(encoding == undefined){
                if(stringType == 'utf-8'){
                    encoding = 'utf-8'
                }
                if(stringType == 'utf-16'){
                    encoding = 'utf-16'
                }
            }

            const encoder = new TextEncoder(encoding);

            const encodedString = encoder.encode(string);

            if(length == undefined && terminateValue == undefined){
                terminateValue = 0
            }

            var totalLength = (length || encodedString.length) + (terminateValue != undefined ? 1 : 0)

            if(stringType == 'utf-16'){
                totalLength = (length || (encodedString.length*2)) + (terminateValue != undefined ? 2 : 0)
            }

            this.#check_size(totalLength, 0, offset) 
        
            // Write the string bytes to the Uint8Array
            for (let i = 0; i < encodedString.length; i++) {
                if (stringType === 'utf-16') {
                    const charCode = encodedString[i];
                    if(endian == "little"){
                        this.data[this.offset + i * 2 ] = charCode & 0xFF;
                        this.data[this.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                    } else {
                        this.data[this.offset + i * 2 + 1] = charCode & 0xFF;
                        this.data[this.offset + i * 2] = (charCode >> 8) & 0xFF;
                    }
                } else {
                    this.data[this.offset + i] = encodedString[i];
                }
            }

            if(terminateValue != undefined){
                if (stringType === 'utf-16') {
                    this.data[this.offset + totalLength - 1] = terminateValue & 0xFF;
                    this.data[this.offset + totalLength] = (terminateValue >> 8) & 0xFF;
                } else {
                    this.data[this.offset + totalLength] = terminateValue
                }
            }

            this.offset += totalLength
      
        } else if (stringType == 'pascal' || stringType == 'wide-pascal') {

            if(encoding == undefined){
                if(stringType == 'pascal'){
                    encoding = 'utf-8'
                }
                if(stringType == 'wide-pascal'){
                    encoding = 'utf-16'
                }
            }

            const encoder = new TextEncoder(encoding);

            // Calculate the length of the string based on the specified max length
            var maxLength;
         
            // Encode the string in the specified encoding
            if(lengthWriteSize == 1){
                maxLength = 255;
            } else if(lengthWriteSize == 2){
                maxLength = 65535;
            } else if(lengthWriteSize == 4){
                maxLength = 4294967295;
            } else {
                throw new Error("Invalid length read size: " + lengthWriteSize)
            }
            if(str.length > maxLength || (length || 0) > maxLength ){
                throw new Error("String outsize of max write length: " + maxLength)
            }
            maxBytes = Math.min(string.length, maxLength);
            const encodedString = encoder.encode(string.substring(0, maxBytes));

            var totalLength = (length || encodedString.length) + lengthWriteSize

            if(stringType == 'wide-pascal'){
                totalLength = (length || (encodedString.length*2)) + lengthWriteSize
            }

            this.#check_size(totalLength, 0, offset)  

            if(lengthWriteSize == 1){
                this.writeUByte(maxBytes, 0);
            } else if(lengthWriteSize == 2){
                this.writeUInt16(maxBytes, 0, );
            } else if(lengthWriteSize == 4){
                this.writeUInt32(maxBytes, 0, );
            }
        
            // Write the string bytes to the Uint8Array
            for (let i = 0; i < encodedString.length; i++) {
                if (stringType == 'wide-pascal') {
                    const charCode = encodedString[i];
                    if(endian == "little"){
                        this.data[this.offset + i * 2 ] = charCode & 0xFF;
                        this.data[this.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                    } else {
                        this.data[this.offset + i * 2 + 1] = charCode & 0xFF;
                        this.data[this.offset + i * 2] = (charCode >> 8) & 0xFF;
                    }
                } else {
                    this.data[this.offset + i] = encodedString[i];
                }
            }

            this.offset += totalLength    
        } else {
            throw new Error('Unsupported string type.');
        }
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
    utf8string = this.cstring = function(string, offset, length, terminateValue){
        return this.string(string, {offset: offset, stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue})
    }

    /**
    * Writes ANSI string
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    ansistring = function(string, offset, length, terminateValue){
        return this.string(string, {offset: offset, stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue})
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
    utf16string = this.unistring = function(string, offset, length, terminateValue, endian){
        return this.string(string, {offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian})
    }

    /**
    * Writes UTF-16 (Unicode) string in little endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringle = this.unistringle = function(string, offset, length, terminateValue){
        return this.string(string, {offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little"})
    }

    /**
    * Writes UTF-16 (Unicode) string in big endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe = this.unistringbe = function(string, offset, length, terminateValue){
        return this.string(string, {offset: offset, stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big"})
    }

    /**
    * Writes Pascal string
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring = function(string, offset, lengthWriteSize, endian){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian})
    }

    /**
    * Writes Pascal string 1 byte length read
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1 = function(string, offset, endian){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian})
    }

    /**
    * Writes Pascal string 1 byte length read in little endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring1le = function(string, offset){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little"})
    }

    /**
    * Writes Pascal string 1 byte length read in big endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring1be = function(string, offset){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big"})
    }

    /**
    * Writes Pascal string 2 byte length read
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    pstring2 = function(string, offset, endian){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2,endian: endian})
    }

    /**
    * Writes Pascal string 2 byte length read in little endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring2le = function(string, offset){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little"})
    }

    /**
    * Writes Pascal string 2 byte length read in big endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring2be = function(string, offset){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big"})
    }

    /**
    * Writes Pascal string 4 byte length read
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    pstring4 = function(string, offset, endian){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian})
    }

    /**
    * Writes Pascal string 4 byte length read in big endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring4be = function(string, offset){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big"})
    }

    /**
    * Writes Pascal string 4 byte length read in little endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring4le = function(string, offset){
        return this.string(string, {offset: offset, stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little"})
    }

    /**
    * Writes Wide-Pascal string
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring = function(string, offset, lengthWriteSize, endian){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian})
    }

    /**
    * Writes Wide-Pascal string in big endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe = function(string, offset, lengthWriteSize){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big"})
    }

    /**
    * Writes Wide-Pascal string in little endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle = function(string, offset, lengthWriteSize){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little"})
    }

    /**
    * Writes Wide-Pascal string
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring1 = function(string, offset, endian){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian})
    }

    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring1be = function(string, offset){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big"})
    }

    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring1le = function(string, offset){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little"})
    }

    /**
    * Writes Wide-Pascal string 2 byte length read
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring2 = function(string, offset, endian){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian})
    }

    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring2le = function(string, offset){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little"})
    }

    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring2be = function(string, offset){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big"})
    }

    /**
    * Writes Wide-Pascal string 4 byte length read
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring4 = function(string, offset, endian){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian})
    }

    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring4le = function(string, offset){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little"})
    }

    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order
    * 
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring4be = function(string, offset){
        return this.string(string, {offset: offset, stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big"})
    }

}

module.exports = biwriter