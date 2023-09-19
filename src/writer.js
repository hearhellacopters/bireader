/**
* Binary writer, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
* @param {number} byteoffset - byte offset to start writer, default is 0 
* @param {number} bitoffset - bit offset to start writer, 0-7 
* @param {string} endianness - endianness ``big`` or ``little`` (default little)
* @param {boolean} strict - strict mode true does not extend supplied array on outside write (default false)
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
    * @param {number} byteoffset - byte offset to start writer, default is 0 
    * @param {number} bitoffset - bit offset to start writer, 0-7 
    * @param {string} endianness - endianness ``big`` or ``little`` (default little)
    * @param {boolean} strict - strict mode true does not extend supplied array on outside write (default false)
    */
    constructor(data, byteoffset, bitoffset, endianness, strict) {
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
        if(typeof strict == "boolean"){
            this.strict = strict
        } else {
            throw Error("Strict mode must be true of false")
        }
        this.data = data
        if(this.data == undefined){
            this.data = new Uint8Array(4)
        } else {
            if(!this.#isBufferOrUint8Array(this.data)){
                throw Error("Write data must be UIntArray or Buffer")
            }           
        }
        this.size = this.data.length + ((bitoffset || 0) % 8)
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
            throw Error("Endian must be big or little")
        }
        if(endian != undefined && !(endian == "big" || endian == "little")){
            throw Error("Endian must be big or little")
        }
        this.endian = endian
    }

    /**
    *
    * Sets endian to big
    */
    bigEndian = this.big = this.bigendian = function(){
        this.endianness("big")
    }

    /**
    *
    * Sets endian to little
    */
    littleEndian = this.little = this.littleendian = function(){
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
            throw Error("Outside of range of data: "+ this.size)
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
            throw Error('Must supply value.');
        }
        if(bits == undefined){
            throw Error('Must supply bits.');
        }
        if (bits <= 0 || bits > 32) {
            throw Error('Bit length must be between 1 and 32.');
        }
        if (unsigned == true) {
            if (value >= Math.pow(2, bits)) {
                throw Error('Value is out of range for the specified bit length.');
            }
        } else {
            const maxValue = Math.pow(2, bits - 1) - 1;
            const minValue = -maxValue - 1;
            if(value < minValue || value > maxValue){
                throw Error('Value is out of range for the specified bit length.');
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
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
    * @param {boolean} unsigned - is value is signed or not
    */
    writeBitLE = this.bitle = function(value, offsetBits, offsetBytes, unsigned){
        return this.bit(value, 32, offsetBits, offsetBytes, unsigned, "little")
    }

    //
    //byte write
    //

    /**
    * Write signed byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeByte = this.byte = this.int8 = function(value, offset, signed){
        this.#check_size(1,0,offset)
        this.data[this.offset] = (signed == undefined || signed == true) ? value : value & 0xFF;
        this.offset += 1
    }

    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUByte = this.uint8 = this.ubyte = this.char = function(value, offset){
        return this.writeByte(value, offset, false)
    }

    //
    //short writes
    //
    
    /**
    * Write signed int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt16 = this.int16 = this.short = this.word = function(value, offset, signed, endian) {
        this.#check_size(2,0,offset)
        if((endian != undefined ? endian : this.endian) == "little"){
            this.data[this.offset] = (signed == undefined || signed == true) ? value : value & 0xff;
            this.data[this.offset + 1] = (signed == undefined || signed == true) ? (value >> 8) : (value >> 8) & 0xff; 
        } else {
            this.data[this.offset] = (signed == undefined || signed == true) ? (value >> 8) : (value >> 8) & 0xff;
            this.data[this.offset + 1] = (signed == undefined || signed == true) ? value : value& 0xff;
        }
        this.offset += 2
    }

    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt16 = this.uint16 = this.ushort = this.uword =  function(value, offset) {
        return this.writeInt16(value, offset, true)
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
    * Write signed int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} signed - if the vlaue is signed
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt32 = this.int = this.int32 = this.double = function(value, offset, signed, endian) {
        this.#check_size(4,0,offset)
        if ((endian = undefined ? endian : this.endian ) == "little") {
            this.data[this.offset] = (signed == undefined || signed == true) ? value : value & 0xFF;
            this.data[this.offset + 1] = (signed == undefined || signed == true) ? (value >> 8) : (value >> 8) & 0xFF;
            this.data[this.offset + 2] = (signed == undefined || signed == true) ? (value >> 16) : (value >> 16) & 0xFF;
            this.data[this.offset + 3] = (signed == undefined || signed == true) ? (value >> 24) : (value >> 24) & 0xFF;
        } else {
            this.data[this.offset] = (signed == undefined || signed == true) ? (value >> 24) : (value >> 24) & 0xFF;
            this.data[this.offset + 1] = (signed == undefined || signed == true) ? (value >> 16): (value >> 16) & 0xFF;
            this.data[this.offset + 2] = (signed == undefined || signed == true) ? (value >> 8) : (value >> 8) & 0xFF;
            this.data[this.offset + 3] = (signed == undefined || signed == true) ? value : value & 0xFF;
        }
        this.offset += 4
    }

    /**
    * Write signed int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
     writeUInt32 = this.uint32 = this.uint = this.udouble= function(value, offset) {
        return this.writeInt32(value, offset, false)
    }

    /**
    * Write signed int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt32LE = this.int32le = this.intle = this.doublele = function(value, offset) {
        return this.writeInt32(value, offset, true, "little")
    }

    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt32LE = this.uint32le = this.uintle = this.udoublele = function(value, offset) {
        return this.writeInt32(value, offset, false, "little")
    }

    /**
    * Write signed int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt32BE = this.int32be = this.int32be = this.doublebe = function(value, offset) {
        return this.writeInt32(value, offset, true, "big")
    }

    /**
    * Write signed int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt32BE = this.uint32be = this.uint32be = this.udoublebe = function(value, offset) {
        return this.writeInt32(value, offset, false, "big")
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
    * Write signed 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} signed - if the vlaue is signed
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt64 = this.int64 = this.quad = this.bigint = function(value, offset, signed, endian) {
        this.#check_size(8,0,offset)
      
        // Convert the BigInt to a 64-bit signed integer
        const bigIntArray = new BigInt64Array(1);
        bigIntArray[0] = value;
      
        // Use two 32-bit views to write the Int64
        const int32Array = new Int32Array(bigIntArray.buffer);
      
        for (let i = 0; i < 2; i++) {
            if ((endian = undefined ? endian : this.endian ) == "little") {
                if(signed == undefined || signed == true){
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
                if(signed == undefined || signed == true){
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
    * Write signed 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt64 = this.uint64 = this.ubigint = this.uquad = function(value, offset, endian) {
        return this.writeInt64(value, offset, false, endian)
    }

    /**
    * Write signed 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt64LE = this.int64le = this.bigintle = this.quadle = function(value, offset) {
        return this.writeInt64(value, offset, true, "little")
    }

    /**
    * Write unsigned 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt64LE = this.uint64le = this.ubigintle = this.uquadle = function(value, offset) {
        return this.writeInt64(value, offset, false, "little")
    }

    /**
    * Write signed 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt64BE = this.int64be = this.bigintbe = this.quadbe =  function(value, offset) {
        return this.writeInt64(value, offset, true, "big")
    }

    /**
    * Write unsigned 64 bit integer
    * 
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt64BE = this.uint64be = this.ubigintbe = this.uquadbe =  function(value, offset) {
        return this.writeInt64(value, offset, false, "big")
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
    * Writes string, use options object for different type
    * 
    * encoding: Any accepted to TextEncoder
    * stringType: utf, delphi, pascal, wide-pascal
    * 
    * @param {string} string - text string
    * @param {object} options - options: 
    * ```
    * {
    *  offset: number, 
    *  length: number, 
    *  encoding: "utf-8", 
    *  stringType: "utf", 
    *  endian: "little", //for wide-pascal, uses set endian that defaults to "little"
    *  terminateValue: number, // only with stringType: "utf"
    *  maxLength: number
    * }
    * ```
    */
    writeString = this.string = function(str, options = {}) {

        const {
            offset = undefined,
            length = undefined,
            encoding = 'utf-8',
            stringType = 'utf',
            endian = this.endian,
            terminateValue = undefined,
            maxLength = 255
        } = options;
      
        const encoder = new TextEncoder(encoding);
      
        if (stringType === 'utf') {
            // Encode the string in the specified encoding
            const encodedString = encoder.encode(str);

            var totalLength = (length || encodedString.length) 

            this.#check_size(totalLength, 0, offset)     
        
            // Write the string bytes to the Uint8Array
            for (let i = 0; i < encodedString.length; i++) {
                this.data[this.offset + i] = encodedString[i];
            }

            if(terminateValue != undefined){
                this.data[this.offset + totalLength] = terminateValue
            }

            this.offset += totalLength + (terminateValue != undefined ? 1 : 0)
      
        } else if (stringType === 'pascal' || stringType === 'wide-pascal' || stringType === 'delphi') {
            // Calculate the length of the string based on the specified max length
         
            // Encode the string in the specified encoding
            const maxBytes = Math.min(str.length, maxLength);
            const encodedString = encoder.encode(str.substring(0, maxBytes));

            totalLength = (length || encodedString.length) + 1

            if(stringType === 'wide-pascal'){
                totalLength = (length || (encodedString.length*2)) + 1
            }

            this.#check_size(totalLength, 0, offset)  

            this.data[this.offset] = maxBytes;
        
            // Write the string bytes to the Uint8Array
            for (let i = 0; i < encodedString.length; i++) {
                if (stringType === 'wide-pascal') {
                    const charCode = encodedString[i];
                    if(endian == "little"){
                        this.data[this.offset + i * 2 + 1] = charCode & 0xFF;
                        this.data[this.offset + i * 2 + 2] = (charCode >> 8) & 0xFF;
                    } else {
                        this.data[this.offset + i * 2 + 2] = charCode & 0xFF;
                        this.data[this.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                    }
                } else {
                    this.data[this.offset + i + 1] = encodedString[i];
                }
            }

            this.offset += totalLength    
        } else {
            throw new Error('Unsupported string type.');
        }
    }

    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * Note: Will extend array if strict mode is off
    * @param {number} startoffset - Start location, default 0
    * @param {number} endoffset - end location, default current write position
    */
    clip = this.crop = this.truncate = this.slice = function(startoffset, endoffset){
        if(endoffset > this.size){
            if(this.strict == false){
                this.extendArray(endoffset - this.size)
            } else {
                throw Error("End offset outside of data: " + this.size)
            }
        }
        return this.data.slice(startoffset || 0, endoffset || this.offset)
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

}

module.exports = biwriter