 /**
 *
 * byte reader, includes bitfields and strings
 *
 * @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
 * @param {number} byteoffset - byte offset to start writing, default is 0 
 * @param {number} bitoffset - bit offset to start writing, 0-7 
 * @param endianness - endianness ```big``` or ```little``` (default ```little```)
 * @returns ```Buffer``` or ```Uint8Array```
 */
 class biwriter {
    endian = "little";
    offset = 0;
    bitoffset = 0;
    size = 0
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
        var readsize = write_bytes
        if(bits != 0){
            //add bits
            readsize = readsize + Math.ceil(bits / 8)
        }
        //if biger extend
        const needed_size = new_off + readsize
        if(needed_size > this.size){
            const dif = needed_size - this.size
            this.extendArray(dif)
            this.size = this.data.length
        }
        //start read location
        this.offset = new_off
    }

    /**
     *
     * byte reader, includes bitfields and strings
     *
     * @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
     * @param {number} byteoffset - byte offset to start reader, default is 0 
     * @param {number} bitoffset - bit offset to start reader, 0-7 
     * @param endianness - endianness ```big``` or ```little``` (default ```little```)
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
    * write bits
    *
    * @param {number} value - value as int 
    * @param {number} numBits - number of bits to write
    * @param {number} offsetBits - bit offset to start the write (default last write position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeBits = function(value, numBits, offsetBits, offsetBytes) {
        if (numBits <= 0 || numBits > 32) {
            throw Error('Bit length must be between 1 and 32.');
        }
    
        if (value < 0 || value >= Math.pow(2, numBits)) {
            throw Error('Value is out of range for the specified bit length.');
        }
        // Ensure the offset is within bounds

        const size_needed = (((((offsetBits || 0) + (numBits-1)) + this.bitoffset) / 8) + (offsetBytes || this.offset))
        if (size_needed > this.size) {
            //add size
            this.extendArray(size_needed-this.size)
        }

        var bits_to_write = value.toString(2).padStart(numBits, '0').split('')

        let startByteIndex = this.offset //cur byte
        let endByteIndex = this.offset + Math.floor(((numBits-1) + this.bitoffset) / 8) //end byte
        let bytesToRead = (endByteIndex - startByteIndex) + 1 //at least 1
        let startBitIndex = (offsetBits || 0) + this.bitoffset
        let endBitIndex = (((offsetBits || 0) + (numBits-1)) + this.bitoffset)+1
        let bitArray = []

        let startByteIndexI = endByteIndex
        let bytesToReadI = bytesToRead
        do {
            var element = this.data[startByteIndexI];
            element = element.toString(2).padStart(8, '0').split('')
            if(this.endian == "little"){
                element = element.reverse()
            }
            bitArray.push(element)
            startByteIndexI--
            bytesToReadI--
        } while (bytesToReadI != 0);

        if(this.endian == "big"){
            bitArray = bitArray.reverse()
        }

        bitArray = bitArray.flat()

        let startBitIndexI = startBitIndex
        let i = 0
        do {
            bitArray[startBitIndexI] = bits_to_write[i]
            i++
            startBitIndexI++
        } while (startBitIndexI != endBitIndex);

        bytesToReadI = bytesToRead
        startByteIndexI = startByteIndex
        i = 0
        do {
            var byte_data = bitArray.slice(i,i+8)   
            if(this.endian == "little"){
                byte_data.reverse()
            }
            byte_data = Number("0b"+byte_data.join(""))
            this.data[startByteIndexI] = byte_data
            i = i+8
            bytesToReadI--
            startByteIndexI = startByteIndexI + 1            
        } while (bytesToReadI != 0);
        this.offset = this.offset + Math.floor(((numBits) + this.bitoffset) / 8) //end byte
        this.bitoffset = ((numBits) + this.bitoffset) % 8    
    }

    //byte write

    /**
    *
    * write byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param signed - if the values are write with sign
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeByte = function(value, offset, signed){
        this.#check_size(1,0,offset)
        this.data[this.offset] = (signed == undefined || signed == true)? value : value & 0xFF;
        this.offset += 1
    }

    /**
    *
    * write byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeUByte = function(value, offset){
        return this.writeByte(value, offset, false)
    }

    /**
    *
    * write byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    byte = function(value, offset){
        return this.writeByte(value, offset, true)
    }

    /**
    *
    * write byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    ubyte = function(value, offset){
        return this.writeByte(value, offset, false)
    }

    /**
    *
    * write byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    int8 = function(value, offset){
        return this.writeByte(value, offset, true)
    }

    /**
    *
    * write byte
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    uint8 = function(value, offset){
        return this.writeByte(value, offset, false)
    }

    //int32 write

    /**
    *
    * write int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param signed - if the values are write with sign
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeInt32LE = function(value, offset, signed) {
        this.#check_size(4,0,offset)
        this.data[this.offset] = signed ? value : value & 0xFF;
        this.data[this.offset + 1] = signed ? (value >> 8) : (value >> 8) & 0xFF;
        this.data[this.offset + 2] = signed ? (value >> 16) : (value >> 16) & 0xFF;
        this.data[this.offset + 3] = signed ? (value >> 24) : (value >> 24) & 0xFF;
        this.offset += 4
    }

    /**
    *
    * write int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param signed - if the values are write with sign
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeInt32BE = function(value, offset, signed) {
        this.#check_size(4,0,offset)
        this.data[this.offset] = signed ? (value >> 24) : (value >> 24) & 0xFF;
        this.data[this.offset + 1] = signed ? (value >> 16): (value >> 16) & 0xFF;
        this.data[this.offset + 2] = signed ? (value >> 8) : (value >> 8) & 0xFF;
        this.data[this.offset + 3] = signed ? value : value & 0xFF;
        this.offset += 4
    }

    /**
    *
    * write int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeInt32 = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt32LE(value, offset, true)
        } else {
            return this.writeInt32BE(value, offset, true)
        }
    }

    /**
    *
    * write int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeUInt32 = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt32LE(value, offset, false)
        } else {
            return this.writeInt32BE(value, offset, false)
        }
    }

    /**
    *
    * write int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    int = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt32LE(value, offset, true)
        } else {
            return this.writeInt32BE(value, offset, true)
        }
    }

    /**
    *
    * write int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    uint = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt32LE(value, offset, false)
        } else {
            return this.writeInt32BE(value, offset, false)
        }
    }

    /**
    *
    * write int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    int32 = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt32LE(value, offset, true)
        } else {
            return this.writeInt32BE(value, offset, true)
        }
    }

    /**
    *
    * write int32
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    uint32 = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt32LE(value, offset, false)
        } else {
            return this.writeInt32BE(value, offset, false)
        }
    }
    
    /**
    *
    * write int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param signed - if the values are write with sign
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeInt16LE = function(value, offset, signed) {
        this.#check_size(2,0,offset)
        this.data[this.offset] = signed ? value : value & 0xff;
        this.data[this.offset + 1] = signed ? (value >> 8) : (value >> 8) & 0xff; 
    }

    /**
    *
    * write int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @param signed - if the values are write with sign
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeInt16BE = function(value, offset, signed) {
        this.#check_size(2,0,offset)
        this.data[this.offset] = signed ? (value >> 8) : (value >> 8) & 0xff;
        this.data[this.offset + 1] = signed ? value : value& 0xff;
    }

    /**
    *
    * write int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeInt16 = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt16LE(value, offset, false)
        } else {
            return this.writeInt16BE(value, offset, false)
        }
    }

    /**
    *
    * write int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    writeUInt16 = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt16LE(value, offset, true)
        } else {
            return this.writeInt16BE(value, offset, true)
        }
    }

    /**
    *
    * write int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    short = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt16LE(value, offset, false)
        } else {
            return this.writeInt16BE(value, offset, false)
        }
    }

    /**
    *
    * write int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    ushort = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt16LE(value, offset, true)
        } else {
            return this.writeInt16BE(value, offset, true)
        }
    }

    /**
    *
    * write int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    int16 = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt16LE(value, offset, false)
        } else {
            return this.writeInt16BE(value, offset, false)
        }
    }

    /**
    *
    * write int16
    *
    * @param {number} value - value as int 
    * @param {number} offset - byte offset (default last write position)
    * @returns ```Buffer``` or ```Uint8Array```
    */
    uint16 = function(value, offset){
        if(this.endian == "little"){
            return this.writeInt16LE(value, offset, true)
        } else {
            return this.writeInt16BE(value, offset, true)
        }
    }

}

module.exports = biwriter