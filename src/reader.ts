import {
    skip,
    goto,
    remove,
    checkSize,
    addData,
    hexDump,
    xor,
    and,
    or,
    lshift,
    rshift
    } from './common'
/**
* Binary reader, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```. Always found in ``biwriter.data``
* @param {number} byteOffset - Byte offset to start reader (default 0)
* @param {number} bitOffset - Bit offset 0-7 to start reader (default 0)
* @param {string} endianness - Endianness ```big``` or ```little``` (default ```little```)
* @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default true)
*/
export class bireader {
    public endian: string = "little";
    public offset: number = 0;
    public bitoffset: number = 0;
    public size: number = 0;
    public strict: boolean = false;
    public errorDump: boolean = true;
    public data: any=[];

    private isBuffer(obj: Array<Buffer|Uint8Array>): boolean {
        return (typeof Buffer !== 'undefined' && obj instanceof Buffer);
    }

    private isBufferOrUint8Array(obj:  Array<Buffer|Uint8Array>): boolean {
        return obj instanceof Uint8Array || this.isBuffer(obj);
    }

    extendArray(to_padd: number): void {
        if((typeof Buffer !== 'undefined' && this.data instanceof Buffer)){
            var paddbuffer = Buffer.alloc(to_padd);
            this.data = Buffer.concat([this.data, paddbuffer]);
        } else {
            const addArray = new Array(to_padd);
            this.data = new Uint8Array([...this.data, ...addArray]);
        }
    }

    private check_size(read_size?: number, read_bits?: number): number{
        return checkSize(this,read_size||0,read_bits||0, this.offset)
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
    constructor(data: Array<Buffer|Uint8Array>, byteOffset?: number, bitOffset?: number, endianness?: string, strict?: boolean) {
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
            this.bitoffset = bitOffset % 8
        }
        if(typeof strict == "boolean"){
            this.strict = strict
        } else {
            if(strict != undefined){
                throw new Error("Strict mode must be true of false")
            }
        }
        if(data == undefined){
            throw new Error("Data required")
        } else {
            if(!this.isBufferOrUint8Array(data)){
                throw new Error("Write data must be Uint8Array or Buffer")
            }       
        }
        this.size = data.length + ((bitOffset || 0) % 8)
        this.data = data
    }

    /**
    *
    * Change endian, defaults to little
    * 
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - endianness ```big``` or ```little```
    */
    endianness(endian: string): void{
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
    bigEndian(): void{
        this.endianness("big")
    }

    /**
    *Sets endian to big
    */
    big(): void{
        this.endianness("big")
    }

    /**
    *Sets endian to big
    */
    be(): void{
        this.endianness("big")
    }

    /**
    * Sets endian to little
    */
    littleEndian(): void{
        this.endianness("little")
    }

    /**
    * Sets endian to little
    */
    little(): void{
        this.endianness("little")
    }

    /**
    * Sets endian to little
    */
    le(): void{
        this.endianness("little")
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
    skip(bytes: number, bits?: number): void{
        return skip(this, bytes, bits)
    }

    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    * 
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    jump(bytes: number, bits?: number): void{
        this.skip(bytes, bits)
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
    goto(byte: number, bit?: number): void{
        return goto(this,byte,bit)
    }

    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    * 
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    seek(byte: number, bit?: number): void{
        return this.goto(byte,bit)
    }

    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    * 
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    pointer(byte: number, bit?: number): void{
        return this.goto(byte,bit)
    }

    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    * 
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    warp(byte: number, bit?: number): void{
        return this.goto(byte,bit)
    }

    //
    //go to start
    //

    /**
    * Set byte and bit position to start of data
    */
    rewind(): void{
            this.offset = 0
            this.bitoffset = 0
    }

    /**
    * Set byte and bit position to start of data
    */
    gotostart(): void{
        this.offset = 0
        this.bitoffset = 0
    }

    //
    //get position
    //

    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    tell(): number{
        return this.offset
    }

    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    getOffset(): number{
        return this.offset
    }

    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    saveOffset(): number{
        return this.offset
    }

    //
    //strict mode change
    //

    /**
    * Disallows extending data if position is outside of max size
    */
    restrict(): void{
        this.strict = true
    }

    /**
    * Allows extending data if position is outside of max size
    */
    unrestrict(): void{
        this.strict = false
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
    XOR(xorKey: number|string|Uint8Array|Buffer,startOffset?: number,endOffset?: number,consume?:boolean): void{
        var XORKey:any = xorKey;
        if(typeof xorKey == "number"){
            //pass
        } else
        if(typeof xorKey == "string"){
            //pass
        } else
        if(this.isBufferOrUint8Array(XORKey)){
            //pass
        } else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer")
        }
        return xor(this,xorKey,startOffset||this.offset,endOffset||this.size,consume|| false)
    }

    /**
    * XOR data
    * 
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    XORThis(xorKey: number|string|Uint8Array|Buffer,length?: number,consume?:boolean): void{
        var Length:number = length||1;
        var XORKey:any = xorKey;
        if(typeof xorKey == "number"){
            Length = length||1;
        } else
        if(typeof xorKey == "string"){
            const encoder = new TextEncoder().encode(xorKey);
            XORKey = encoder
            Length = length||encoder.length
        } else
        if(this.isBufferOrUint8Array(XORKey)){
            Length = length||xorKey.length
        } else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer")
        }
        return xor(this,XORKey,this.offset,this.offset + Length,consume|| false)
    }

    /**
    * OR data
    * 
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    OR(orKey: number|string|Uint8Array|Buffer,startOffset?: number,endOffset?: number,consume?:boolean): void{
        var ORKey:any = orKey;
        if(typeof orKey == "number"){
            //pass
        } else
        if(typeof orKey == "string"){
            //pass
        } else
        if(this.isBufferOrUint8Array(ORKey)){
            //pass
        } else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer")
        }
        return xor(this,orKey,startOffset||this.offset,endOffset||this.size,consume|| false)
    }

    /**
    * OR data
    * 
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    ORThis(orKey: number|string|Uint8Array|Buffer,length?: number,consume?:boolean): void{
        var Length:number = length||1;
        var ORKey:any = orKey;
        if(typeof orKey == "number"){
            Length = length||1;
        } else
        if(typeof orKey == "string"){
            const encoder = new TextEncoder().encode(orKey);
            ORKey = encoder
            Length = length||encoder.length
        } else
        if(this.isBufferOrUint8Array(ORKey)){
            Length = length||orKey.length
        } else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer")
        }
        return or(this,ORKey,this.offset,this.offset + Length,consume|| false)
    }

    /**
    * AND data
    * 
    * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    AND(andKey: number|string|Uint8Array|Buffer,startOffset?: number,endOffset?: number,consume?:boolean): void{
        var ANDKey:any = andKey;
        if(typeof andKey == "number"){
            //pass
        } else
        if(typeof andKey == "string"){
            //pass
        } else
        if(this.isBufferOrUint8Array(ANDKey)){
            //pass
        } else {
            throw new Error("AND must be a number, string, Uint8Array or Buffer")
        }
        return and(this,andKey,startOffset||this.offset,endOffset||this.size,consume|| false)
    }

    /**
    * AND data
    * 
    * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
    * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    ANDThis(andKey: number|string|Uint8Array|Buffer,length?: number,consume?:boolean): void{
        var Length:number = length||1;
        var ANDKey:any = andKey;
        if(typeof andKey == "number"){
            Length = length||1;
        } else
        if(typeof andKey == "string"){
            const encoder = new TextEncoder().encode(andKey);
            ANDKey = encoder
            Length = length||encoder.length
        } else
        if(this.isBufferOrUint8Array(ANDKey)){
            Length = length||andKey.length
        } else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer")
        }
        return and(this,ANDKey,this.offset,this.offset + Length,consume|| false)
    }

    /**
    * Left shift data
    * 
    * @param {number} shiftValue - Value to left shift
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    LSHIFT(shiftValue: number,startOffset?: number,endOffset?: number,consume?:boolean): void{
        if(typeof shiftValue != "number"){
            throw new Error("Shift value must be a number")
        }
        return lshift(this,shiftValue,startOffset||this.offset,endOffset||this.size,consume|| false)
    }

    /**
    * Left shift data
    * 
    * @param {number} shiftValue - Value to left shift
    * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    LSHIFTThis(shiftValue: number,length?: number,consume?:boolean): void{
        var Length:number = length||1;
        if(typeof shiftValue != "number"){
            throw new Error("Shift value must be a number")
        }
        return lshift(this,shiftValue,this.offset,this.offset + Length,consume|| false)
    }

    /**
    * Right shift data
    * 
    * @param {number} shiftValue - Value to right shift
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    RSHIFT(shiftValue: number,startOffset?: number,endOffset?: number,consume?:boolean): void{
        if(typeof shiftValue != "number"){
            throw new Error("Shift value must be a number")
        }
        return rshift(this,shiftValue,startOffset||this.offset,endOffset||this.size,consume|| false)
    }

    /**
    * Right shift data
    * 
    * @param {number} shiftValue - Value to right shift
    * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    RSHIFTThis(shiftValue: number,length?: number,consume?:boolean): void{
        var Length:number = length||1;
        if(typeof shiftValue != "number"){
            throw new Error("Shift value must be a number")
        }
        return rshift(this,shiftValue,this.offset,this.offset + Length,consume|| false)
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
    delete(startOffset?: number, endOffset?: number, consume?:boolean): Array<Buffer|Uint8Array>{
        return remove(this,startOffset||0,endOffset||this.offset,consume||false, true)
    }

    /**
    * Deletes part of data from start to current byte position unless supplied, returns removed
    * Note: Errors in strict mode
    * 
    * @param {number} startOffset - Start location (default 0)
    * @param {number} endOffset - End location (default current position)
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    clip(startOffset?: number, endOffset?: number, consume?:boolean): Array<Buffer|Uint8Array>{
        return remove(this,startOffset||0,endOffset||this.offset,consume||false, true)
    }

    /**
    * Deletes part of data from current byte position to supplied length, returns removed
    * Note: Errors in strict mode
    * 
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    crop(length: number, consume?: boolean): Array<Buffer|Uint8Array>{
        return remove(this,this.offset,this.offset + (length||0), consume||false, true)
    }

    /**
    * Deletes part of data from current position to supplied length, returns removed
    * Note: Only works in strict mode
    * 
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    drop(length: number, consume?: boolean): Array<Buffer|Uint8Array>{
        return remove(this,this.offset,this.offset + (length||0), consume||false, true)
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
    lift(startOffset?:number, endOffset?: number, consume?: boolean, fillValue?: number): Array<Buffer|Uint8Array>{
        return remove(this,startOffset||this.offset,endOffset||this.size, consume||false, false, fillValue)
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
    fill(startOffset?:number, endOffset?: number, consume?: boolean, fillValue?: number): Array<Buffer|Uint8Array>{
        return remove(this,startOffset||this.offset,endOffset||this.size, consume||false, false, fillValue)
    }

    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    * 
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    extract(length:number, consume?: boolean): Array<Buffer|Uint8Array>{
        return remove(this,this.offset,length||0, consume||false, false)
    }

    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    * 
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    slice(length:number, consume?: boolean): Array<Buffer|Uint8Array>{
        return remove(this,this.offset,length||0, consume||false, false)
    }

    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    * 
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    wrap(length:number, consume?: boolean): Array<Buffer|Uint8Array>{
        return remove(this,this.offset,length||0, consume||false, false)
    }

    //
    //insert
    //
    
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    * 
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    insert(data: Buffer|Uint8Array,consume?: boolean, offset?: number): void{
        return addData(this,data,consume||false,offset||this.offset)
    }

    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    * 
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    place(data: Buffer|Uint8Array,consume?: boolean, offset?: number): void{
        return addData(this,data,consume||false,offset||this.offset)
    }

    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    * 
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    unshift(data: Buffer|Uint8Array, consume?: boolean){
        return addData(this, data, consume||false, 0)
    }

    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    * 
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    prepend(data: Buffer|Uint8Array, consume?: boolean){
        return addData(this, data, consume||false, 0)
    }

    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    * 
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    push(data: Buffer|Uint8Array, consume?: boolean){
        return addData(this, data, consume||false, this.size)
    }

    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    * 
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    append(data: Buffer|Uint8Array, consume?: boolean){
        return addData(this, data, consume||false, this.size)
    }

    //
    //finishing
    //

    /**
    * Returns current data
    * 
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get(): Array<Buffer|Uint8Array>{
        return this.data
    }

    /**
    * Returns current data
    * 
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return(): Array<Buffer|Uint8Array>{
        return this.data
    }

    /**
    * removes data
    */
    end(): void{
        this.data = undefined
    }

    /**
    * removes data
    */
    close(): void{
        this.data = undefined
    }

    /**
    * removes data
    */
    done(): void{
        this.data = undefined
    }

    /**
    * removes data
    */
    finished(): void{
        this.data = undefined
    }

    /**
    * Console logs data as hex dump
    * 
    * @param {object} options - options object
    * ```javascript
    *   {
    *       length: 192, // number of bytes to log, default 192 or end of data
    *       startByte: 0, // byte to start dump, default current position
    *       supressUnicode: false // Supress unicode character preview for cleaner columns
    *   }
    * ```
    */
    hexdump(options?: {length?: number, startByte?: number, supressUnicode?: boolean}): void{
        return hexDump(this, options)
    }

    /**
    * Turn hexdump on error off (default on)
    */
    errorDumpOff(): void{
        this.errorDump = false;
    }

    /**
    * Turn hexdump on error on (default on)
    */
    errorDumpOn(): void{
        this.errorDump = true;
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
    readBit(bits?: number, unsigned?: boolean, endian?: string): number{
        if(bits == undefined || typeof bits != "number"){
            throw new Error("Enter number of bits to read")
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32.');
        }
        const size_needed = ((((bits-1) + this.bitoffset) / 8) + this.offset)
        if (bits <= 0 || size_needed > this.size) {
            this.errorDump ? "[Error], hexdump:\n" + this.hexdump() : ""
            throw new Error("Invalid number of bits to read: " + size_needed + " of " + this.size)
        }

        var off_in_bits = (this.offset * 8) + this.bitoffset

        var value = 0;

        for (var i = 0; i < bits;) {
            var remaining = bits - i;
            var bitOffset = off_in_bits & 7;
            var currentByte = <unknown> this.data[off_in_bits >> 3] as number

            var read = Math.min(remaining, 8 - bitOffset);

            var mask: number, readBits: number;

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

        if (unsigned == true || bits <= 7) {

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
    bit(bits: number, unsigned?: boolean, endian?: string): number{
        return this.readBit(bits,unsigned,endian)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1(unsigned?: boolean): number{
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
    bit1le(unsigned?: boolean): number{
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
    bit1be(unsigned?: boolean): number{
        return this.bit(1, unsigned, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit1(): number{
        return this.bit(1, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit1le(): number{
        return this.bit(1, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit1be(): number{
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
    bit2(unsigned?: boolean): number{
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
    bit2le(unsigned?: boolean): number{
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
    bit2be(unsigned?: boolean): number{
        return this.bit(2, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit2(): number{
        return this.bit(2, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit2le(): number{
        return this.bit(2, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit2be(): number{
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
    bit3(unsigned?: boolean): number{
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
    bit3le(unsigned?: boolean): number{
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
    bit3be(unsigned?: boolean): number{
        return this.bit(3, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit3(): number{
        return this.bit(3, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit3le(): number{
        return this.bit(3, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit3be(): number{
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
    bit4(unsigned?: boolean): number{
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
    bit4le(unsigned?: boolean): number{
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
    bit4be(unsigned?: boolean): number{
        return this.bit(4, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit4(): number{
        return this.bit(4, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit4le(): number{
        return this.bit(4, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit4be(): number{
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
    bit5(unsigned?: boolean): number{
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
    bit5le(unsigned?: boolean): number{
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
    bit5be(unsigned?: boolean): number{
        return this.bit(5, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit5(): number{
        return this.bit(5, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit5le(): number{
        return this.bit(5, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit5be(): number{
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
    bit6(unsigned?: boolean): number{
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
    bit6le(unsigned?: boolean): number{
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
    bit6be(unsigned?: boolean): number{
        return this.bit(6, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit6(): number{
        return this.bit(6, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit6le(): number{
        return this.bit(6, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit6be(): number{
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
    bit7(unsigned?: boolean): number{
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
    bit7le(unsigned?: boolean): number{
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
    bit7be(unsigned?: boolean): number{
        return this.bit(7, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit7(): number{
        return this.bit(7, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit7le(): number{
        return this.bit(7, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit7be(): number{
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
    bit8(unsigned?: boolean): number{
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
    bit8le(unsigned?: boolean): number{
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
    bit8be(unsigned?: boolean): number{
        return this.bit(8, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit8(): number{
        return this.bit(8, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit8le(): number{
        return this.bit(8, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit8be(): number{
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
    bit9(unsigned?: boolean): number{
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
    bit9le(unsigned?: boolean): number{
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
    bit9be(unsigned?: boolean): number{
        return this.bit(9, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit9(): number{
        return this.bit(9, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit9le(): number{
        return this.bit(9, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit9be(): number{
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
    bit10(unsigned?: boolean): number{
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
    bit10le(unsigned?: boolean): number{
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
    bit10be(unsigned?: boolean): number{
        return this.bit(10, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit10(): number{
        return this.bit(10, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit10le(): number{
        return this.bit(10, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit10be(): number{
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
    bit11(unsigned?: boolean): number{
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
    bit11le(unsigned?: boolean): number{
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
    bit11be(unsigned?: boolean): number{
        return this.bit(11, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit11(): number{
        return this.bit(11, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit11le(): number{
        return this.bit(11, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit11be(): number{
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
    bit12(unsigned?: boolean): number{
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
    bit12le(unsigned?: boolean): number{
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
    bit12be(unsigned?: boolean): number{
        return this.bit(12, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit12(): number{
        return this.bit(12, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit12le(): number{
        return this.bit(12, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit12be(): number{
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
    bit13(unsigned?: boolean): number{
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
    bit13le(unsigned?: boolean): number{
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
    bit13be(unsigned?: boolean): number{
        return this.bit(13, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit13(): number{
        return this.bit(13, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit13le(): number{
        return this.bit(13, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit13be(): number{
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
    bit14(unsigned?: boolean): number{
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
    bit14le(unsigned?: boolean): number{
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
    bit14be(unsigned?: boolean): number{
        return this.bit(14, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit14(): number{
        return this.bit(14, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit14le(): number{
        return this.bit(14, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit14be(): number{
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
    bit15(unsigned?: boolean): number{
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
    bit15le(unsigned?: boolean): number{
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
    bit15be(unsigned?: boolean): number{
        return this.bit(15, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit15(): number{
        return this.bit(15, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit15le(): number{
        return this.bit(15, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit15be(): number{
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
    bit16(unsigned?: boolean): number{
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
    bit16le(unsigned?: boolean): number{
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
    bit16be(unsigned?: boolean): number{
        return this.bit(16, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit16(): number{
        return this.bit(16, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit16le(): number{
        return this.bit(16, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit16be(): number{
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
    bit17(unsigned?: boolean): number{
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
    bit17le(unsigned?: boolean): number{
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
    bit17be(unsigned?: boolean): number{
        return this.bit(17, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit17(): number{
        return this.bit(17, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit17le(): number{
        return this.bit(17, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit17be(): number{
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
    bit18(unsigned?: boolean): number{
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
    bit18le(unsigned?: boolean): number{
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
    bit18be(unsigned?: boolean): number{
        return this.bit(18, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit18(): number{
        return this.bit(18, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit18le(): number{
        return this.bit(18, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit18be(): number{
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
    bit19(unsigned?: boolean): number{
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
    bit19le(unsigned?: boolean): number{
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
    bit19be(unsigned?: boolean): number{
        return this.bit(19, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit19(): number{
        return this.bit(19, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit19le(): number{
        return this.bit(19, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit19be(): number{
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
    bit20(unsigned?: boolean): number{
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
    bit20le(unsigned?: boolean): number{
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
    bit20be(unsigned?: boolean): number{
        return this.bit(20, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit20(): number{
        return this.bit(20, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit20le(): number{
        return this.bit(20, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit20be(): number{
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
    bit21(unsigned?: boolean): number{
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
    bit21le(unsigned?: boolean): number{
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
    bit21be(unsigned?: boolean): number{
        return this.bit(21, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit21(): number{
        return this.bit(21, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit21le(): number{
        return this.bit(21, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit21be(): number{
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
    bit22(unsigned?: boolean): number{
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
    bit22le(unsigned?: boolean): number{
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
    bit22be(unsigned?: boolean): number{
        return this.bit(22, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit22(): number{
        return this.bit(22, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit22le(): number{
        return this.bit(22, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit22be(): number{
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
    bit23(unsigned?: boolean): number{
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
    bit23le(unsigned?: boolean): number{
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
    bit23be(unsigned?: boolean): number{
        return this.bit(23, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit23(): number{
        return this.bit(23, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit23le(): number{
        return this.bit(23, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit23be(): number{
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
    bit24(unsigned?: boolean): number{
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
    bit24le(unsigned?: boolean): number{
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
    bit24be(unsigned?: boolean): number{
        return this.bit(24, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit24(): number{
        return this.bit(24, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit24le(): number{
        return this.bit(24, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit24be(): number{
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
    bit25(unsigned?: boolean): number{
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
    bit25le(unsigned?: boolean): number{
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
    bit25be(unsigned?: boolean): number{
        return this.bit(25, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit25(): number{
        return this.bit(25, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit25le(): number{
        return this.bit(25, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit25be(): number{
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
    bit26(unsigned?: boolean): number{
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
    bit26le(unsigned?: boolean): number{
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
    bit26be(unsigned?: boolean): number{
        return this.bit(26, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit26(): number{
        return this.bit(26, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit26le(): number{
        return this.bit(26, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit26be(): number{
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
    bit27(unsigned?: boolean): number{
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
    bit27le(unsigned?: boolean): number{
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
    bit27be(unsigned?: boolean): number{
        return this.bit(27, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit27(): number{
        return this.bit(27, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit27le(): number{
        return this.bit(27, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit27be(): number{
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
    bit28(unsigned?: boolean): number{
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
    bit28le(unsigned?: boolean): number{
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
    bit28be(unsigned?: boolean): number{
        return this.bit(28, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit28(): number{
        return this.bit(28, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit28le(): number{
        return this.bit(28, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit28be(): number{
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
    bit29(unsigned?: boolean): number{
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
    bit29le(unsigned?: boolean): number{
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
    bit29be(unsigned?: boolean): number{
        return this.bit(29, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit29(): number{
        return this.bit(29, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit29le(): number{
        return this.bit(29, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit29be(): number{
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
    bit30(unsigned?: boolean): number{
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
    bit30le(unsigned?: boolean): number{
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
    bit30be(unsigned?: boolean): number{
        return this.bit(30, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit30(): number{
        return this.bit(30, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit30le(): number{
        return this.bit(30, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit30be(): number{
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
    bit31(unsigned?: boolean): number{
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
    bit31le(unsigned?: boolean): number{
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
    bit31be(unsigned?: boolean): number{
        return this.bit(31, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit31(): number{
        return this.bit(31, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit31le(): number{
        return this.bit(31, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit31be(): number{
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
    bit32(unsigned?: boolean): number{
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
    bit32le(unsigned?: boolean): number{
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
    bit32be(unsigned?: boolean): number{
        return this.bit(32, unsigned, "big")
    }
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit32(): number{
        return this.bit(32, true)
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit32le(): number{
        return this.bit(32, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    * 
    * @returns number
    */
    ubit32be(): number{
        return this.bit(32, true, "big")
    }
        
    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitBE(bits: number): number{
        return this.readBit(bits, true, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitbe(bits: number): number{
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
    readBitBE(bits: number, unsigned?: boolean): number{
        return this.readBit(bits, unsigned, "big")
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
    bitbe(bits: number, unsigned?: boolean): number{
        return this.readBit(bits, unsigned, "big")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitLE(bits: number): number{
        return this.readBit(bits, true, "little")
    }

    /**
    * Bit field reader
    * 
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitle(bits: number): number{
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
    readBitLE(bits: number, unsigned?: boolean): number{
        return this.readBit(bits, unsigned, "little")
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
    bitle(bits: number, unsigned?: boolean): number{
        return this.readBit(bits, unsigned, "little")
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
    readByte(unsigned?: boolean): number{
        this.check_size(1)
        var read = <unknown> this.data[this.offset] as number
        this.offset += 1
        if(unsigned == true){
            return read & 0xFF
        } else {
            return read > 127 ? read - 256 : read; 
        }
    }

    /**
    * Read byte
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    byte(unsigned?: boolean): number{
        return this.readByte(unsigned)
    }

    /**
    * Read byte
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    int8(unsigned?: boolean): number{
        return this.readByte(unsigned)
    }

    /**
    * Read unsigned byte
    * 
    * @returns number
    */
    readUByte(): number {
        return this.readByte(true)
    }

    /**
    * Read unsigned byte
    * 
    * @returns number
    */
    uint8(): number{
        return this.readByte(true)
    }

    /**
    * Read unsigned byte
    * 
    * @returns number
    */
    ubyte(): number{
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
    readInt16(unsigned?: boolean, endian?: string): number{
        this.check_size(2)
        var read: number;
        if((endian != undefined ? endian : this.endian)  == "little"){
            read = ((<unknown>this.data[this.offset + 1] as number & 0xFFFF) << 8) | (<unknown>this.data[this.offset] as number & 0xFFFF);
        } else {
            read = ((<unknown>this.data[this.offset] as number& 0xFFFF) << 8) | (<unknown>this.data[this.offset + 1] as number& 0xFFFF);
        }
        this.offset += 2
        if(unsigned == undefined || unsigned == false){
            return read & 0x8000 ? -(0x10000 - read) : read
        } else {
            return read & 0xFFFF
        }
    }

    /**
    * Read short
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int16(unsigned?: boolean, endian?: string): number{
        return this.readInt16(unsigned, endian)
    }

    /**
    * Read short
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    short(unsigned?: boolean, endian?: string): number{
        return this.readInt16(unsigned, endian)
    }

    /**
    * Read short
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    word(unsigned?: boolean, endian?: string): number{
        return this.readInt16(unsigned, endian)
    }

    /**
    * Read unsigned short
    * 
    * @param {string} endian - ```big``` or ```little```
    * 
    * @returns number
    */
    readUInt16(endian?: string): number{
        return this.readInt16(true, endian)
    }

    /**
    * Read unsigned short
    * 
    * @param {string} endian - ```big``` or ```little```
    * 
    * @returns number
    */
    uint16(endian?: string): number{
        return this.readInt16(true, endian)
    }

    /**
    * Read unsigned short
    * 
    * @param {string} endian - ```big``` or ```little```
    * 
    * @returns number
    */
    ushort(endian?: string): number{
        return this.readInt16(true, endian)
    }

    /**
    * Read unsigned short
    * 
    * @param {string} endian - ```big``` or ```little```
    * 
    * @returns number
    */
    uword(endian?: string): number{
        return this.readInt16(true, endian)
    }

    /**
    * Read unsigned short in little endian
    * 
    * @returns number
    */
    readUInt16LE(): number{
        return this.readInt16(true, "little")
    }

    /**
    * Read unsigned short in little endian
    * 
    * @returns number
    */
    uint16le(): number{
        return this.readInt16(true, "little")
    }

    /**
    * Read unsigned short in little endian
    * 
    * @returns number
    */
    ushortle(): number{
        return this.readInt16(true, "little")
    }

    /**
    * Read unsigned short in little endian
    * 
    * @returns number
    */
    uwordle(): number{
        return this.readInt16(true, "little")
    }

    /**
    * Read signed short in little endian
    * 
    * @returns number
    */
    readInt16LE(): number{
        return this.readInt16(false, "little")
    }

    /**
    * Read signed short in little endian
    * 
    * @returns number
    */
    int16le(): number{
        return this.readInt16(false, "little")
    }

    /**
    * Read signed short in little endian
    * 
    * @returns number
    */
    shortle(): number{
        return this.readInt16(false, "little")
    }

    /**
    * Read signed short in little endian
    * 
    * @returns number
    */
    wordle(): number{
        return this.readInt16(false, "little")
    }

    /**
    * Read unsigned short in big endian
    * 
    * @returns number
    */
    readUInt16BE(): number{
        return this.readInt16(true, "big")
    }

    /**
    * Read unsigned short in big endian
    * 
    * @returns number
    */
    uint16be(): number{
        return this.readInt16(true, "big")
    }

    /**
    * Read unsigned short in big endian
    * 
    * @returns number
    */
    ushortbe(): number{
        return this.readInt16(true, "big")
    }

    /**
    * Read unsigned short in big endian
    * 
    * @returns number
    */
    uwordbe(): number{
        return this.readInt16(true, "big")
    }

    /**
    * Read signed short in big endian
    * 
    * @returns number
    */
    readInt16BE(): number{
        return this.readInt16(false, "big")
    }

    /**
    * Read signed short in big endian
    * 
    * @returns number
    */
    int16be(): number{
        return this.readInt16(false, "big")
    }

    /**
    * Read signed short in big endian
    * 
    * @returns number
    */
    shortbe(): number{
        return this.readInt16(false, "big")
    }

    /**
    * Read signed short in big endian
    * 
    * @returns number
    */
    wordbe(): number{
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
    readHalfFloat(endian?: string): number{
        this.check_size(2)
        var uint16Value = this.readInt16(true, (endian != undefined ? endian : this.endian))
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
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    halffloat(endian?: string): number{
        return this.readHalfFloat(endian);
    }

    /**
    * Read half float
    * 
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    half(endian?: string): number{
        return this.readHalfFloat(endian);
    }

    /**
    * Read half float
    * 
    * @returns number
    */
    readHalfFloatBE(): number{
        return this.readHalfFloat("big")
    }

    /**
    * Read half float
    * 
    * @returns number
    */
    halffloatbe(){
        return this.readHalfFloat("big")
    }

    /**
    * Read half float
    * 
    * @returns number
    */
    halfbe(): number{
        return this.readHalfFloat("big")
    }

    /**
    * Read half float
    * 
    * @returns number
    */
    readHalfFloatLE(): number{
        return this.readHalfFloat("little")
    }

    /**
    * Read half float
    * 
    * @returns number
    */
    halffloatle(): number{
        return this.readHalfFloat("little")
    }

    /**
    * Read half float
    * 
    * @returns number
    */
    halfle(): number{
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
    readInt32(unsigned?: boolean, endian?: string): number{
        this.check_size(4)
        var read: number;
        if((endian != undefined ? endian : this.endian) == "little"){
            read = (((<unknown>this.data[this.offset + 3] as number & 0xFF)<< 24) | ((<unknown>this.data[this.offset + 2] as number & 0xFF) << 16) | ((<unknown>this.data[this.offset + 1] as number & 0xFF) << 8) | (<unknown>this.data[this.offset] as number & 0xFF))
        } else {
            read = ((<unknown>this.data[this.offset] as number & 0xFF) << 24) | ((<unknown>this.data[this.offset + 1] as number & 0xFF) << 16) | ((<unknown>this.data[this.offset + 2] as number & 0xFF) << 8) | (<unknown>this.data[this.offset + 3] as number & 0xFF)
        }
        this.offset += 4
        if(unsigned == undefined || unsigned == false){
            return read
        } else {
            return read >>> 0
        }
    }

    /**
    * Read 32 bit integer
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int(unsigned?: boolean, endian?: string): number{
        return this.readInt32(unsigned,endian)
    }

    /**
    * Read 32 bit integer
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    double(unsigned?: boolean, endian?: string): number{
        return this.readInt32(unsigned,endian)
    }

    /**
    * Read 32 bit integer
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int32(unsigned?: boolean, endian?: string): number{
        return this.readInt32(unsigned,endian)
    }

    /**
    * Read 32 bit integer
    * 
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    long(unsigned?: boolean, endian?: string): number{
        return this.readInt32(unsigned,endian)
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    readUInt(): number{
        return this.readInt32(true)
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    uint(): number{
        return this.readInt32(true)
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    udouble(): number{
        return this.readInt32(true)
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    uint32(): number{
        return this.readInt32(true)
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    ulong(): number{
        return this.readInt32(true)
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    readInt32BE(): number{
        return this.readInt32(false, "big")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    intbe(): number{
        return this.readInt32(false, "big")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    doublebe(): number{
        return this.readInt32(false, "big")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    int32be(): number{
        return this.readInt32(false, "big")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    longbe(): number{
        return this.readInt32(false, "big")
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    readUInt32BE(): number{
        return this.readInt32(true, "big")
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    uintbe(): number{
        return this.readInt32(true, "big")
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    udoublebe(): number{
        return this.readInt32(true, "big")
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    uint32be(): number{
        return this.readInt32(true, "big")
    }

    /**
    * Read unsigned 32 bit integer
    * 
    * @returns number
    */
    ulongbe(): number{
        return this.readInt32(true, "big")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    readInt32LE(): number{
        return this.readInt32(false, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    intle(): number{
        return this.readInt32(false, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    doublele(): number{
        return this.readInt32(false, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    int32le(): number{
        return this.readInt32(false, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    longle(): number{
        return this.readInt32(false, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    readUInt32LE(): number{
        return this.readInt32(true, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    uintle(): number{
        return this.readInt32(true, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    udoublele(): number{
        return this.readInt32(true, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    uint32le(): number{
        return this.readInt32(true, "little")
    }

    /**
    * Read signed 32 bit integer
    * 
    * @returns number
    */
    ulongle(): number{
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
    readFloat(endian?: string): number{
        this.check_size(4)
        var uint32Value = this.readInt32(true, (endian == undefined ? this.endian : endian))
        // Check if the value is negative (i.e., the most significant bit is set)
        const isNegative = (uint32Value & 0x80000000) !== 0 ? 1: 0;

        // Extract the exponent and fraction parts
        const exponent = (uint32Value >> 23) & 0xFF;
        const fraction = uint32Value & 0x7FFFFF;

        // Calculate the float value
        let floatValue: number;

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
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    float(endian?: string): number{
        return this.readFloat(endian);
    }

    /**
    * Read float
    * 
    * @returns number
    */
    readFloatBE(): number{
        return this.readFloat("big")
    }

    /**
    * Read float
    * 
    * @returns number
    */
    floatbe(): number{
        return this.readFloat("big")
    }

    /**
    * Read float
    * 
    * @returns number
    */
    readFloatLE(): number{
        return this.readFloat("little")
    }

    /**
    * Read float
    * 
    * @returns number
    */
    floatle(): number{
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
    readInt64(unsigned?: boolean, endian?: string): bigint {
        this.check_size(8)
        
        // Convert the byte array to a BigInt
        let value: bigint = BigInt(0);
        if((endian == undefined ? this.endian : endian) == "little"){
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((<unknown>this.data[this.offset]  as number & 0xFF)) << BigInt(8 * i);
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
                value = (value << BigInt(8)) | BigInt((<unknown>this.data[this.offset] as number & 0xFF));
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
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int64(unsigned?: boolean, endian?: string): bigint {
        return this.readInt64(unsigned,endian)
    }

    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    bigint(unsigned?: boolean, endian?: string): bigint {
        return this.readInt64(unsigned,endian)
    }

    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    quad(unsigned?: boolean, endian?: string): bigint {
        return this.readInt64(unsigned,endian)
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    readUInt64(): bigint {
        return this.readInt64(true)
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    uint64(): bigint {
        return this.readInt64(true)
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    ubigint(): bigint {
        return this.readInt64(true)
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    uquad(): bigint {
        return this.readInt64(true)
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    readInt64BE(): bigint {
        return this.readInt64(false, "big")
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    int64be(): bigint {
        return this.readInt64(false, "big")
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    bigintbe(): bigint {
        return this.readInt64(false, "big")
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    quadbe(): bigint {
        return this.readInt64(false, "big")
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    readUInt64BE(): bigint {
        return this.readInt64(true, "big");
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    uint64be(): bigint {
        return this.readInt64(true, "big");
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    ubigintbe(): bigint {
        return this.readInt64(true, "big");
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    uquadbe(): bigint {
        return this.readInt64(true, "big");
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    readInt64LE(): bigint {
        return this.readInt64(false, "little")
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    int64le(): bigint {
        return this.readInt64(false, "little")
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    bigintle(): bigint {
        return this.readInt64(false, "little")
    }

    /**
    * Read signed 64 bit integer
    * 
    * @returns number
    */
    quadle(): bigint {
        return this.readInt64(false, "little")
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    readUInt64LE(): bigint {
        return this.readInt64(true, "little");
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    uint64le(): bigint {
        return this.readInt64(true, "little");
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    ubigintle(): bigint {
        return this.readInt64(true, "little");
    }

    /**
    * Read unsigned 64 bit integer
    * 
    * @returns number
    */
    uquadle(): bigint {
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
    readDoubleFloat(endian?: string): number{
        this.check_size(8)
        var uint64Value = this.readInt64(true, (endian == undefined ? this.endian : endian))
        const sign = (uint64Value & 0x8000000000000000n) >> 63n;
        const exponent = Number((uint64Value & 0x7FF0000000000000n) >> 52n) - 1023;
        const fraction = Number(uint64Value & 0x000FFFFFFFFFFFFFn) / Math.pow(2, 52);

        var floatValue: number;

        if (exponent == -1023) {
            if (fraction == 0) {
            floatValue = (sign == 0n) ? 0 : -0; // +/-0
            } else {
            // Denormalized number
            floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, -1022) * fraction;
            }
        } else if (exponent == 1024) {
            if (fraction == 0) {
            floatValue = (sign == 0n) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
            } else {
            floatValue = Number.NaN;
            }
        } else {
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
    doublefloat(endian?: string): number{
        return this.readDoubleFloat(endian)
    }

    /**
    * Read double float
    * 
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    dfloat(endian?: string): number{
        return this.readDoubleFloat(endian)
    }

    /**
    * Read double float
    * 
    * @returns number
    */
    readDoubleFloatBE(): number{
        return this.readDoubleFloat("big")
    }

    /**
    * Read double float
    * 
    * @returns number
    */
    dfloatebe(): number{
        return this.readDoubleFloat("big")
    }

    /**
    * Read double float
    * 
    * @returns number
    */
    doublefloatbe(): number{
        return this.readDoubleFloat("big")
    }

    /**
    * Read double float
    * 
    * @returns number
    */
    readDoubleFloatLE(): number{
        return this.readDoubleFloat("little")
    }

    /**
    * Read double float
    * 
    * @returns number
    */
    dfloatle(): number{
        return this.readDoubleFloat("little")
    }

    /**
    * Read double float
    * 
    * @returns number
    */
    doublefloatle(): number{
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
    readString(
        options?: {   
            length?: number,
            stringType?: string,
            terminateValue?: number,
            lengthReadSize?: number,
            stripNull?: boolean,
            encoding?: string,
            endian?:string,
        } ): string{

        var length:any = options && options.length
        var stringType:any = options && options.stringType || 'utf-8'
        var terminateValue:any = options && options.terminateValue
        var lengthReadSize:any = options && options.lengthReadSize || 1
        var stripNull: any = options && options.stripNull || true
        var encoding: any = options && options.encoding || 'utf-8'
        var endian:any = options && options.endian || this.endian
        
        var terminate = terminateValue

        if(length != undefined){
            this.check_size(length)
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
            const encodedBytes: Array<number> = [];

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
                this.errorDump ? "[Error], hexdump:\n" + this.hexdump() : ""
                throw new Error("Invalid length read size: " + lengthReadSize)
            }
            
            // Read the string as Pascal or Delphi encoded
            const encodedBytes: Array<number> = [];
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
            var str_return: string
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
    string(
        options?: {   
            length?: number,
            stringType?: string,
            terminateValue?: number,
            lengthReadSize?: number,
            stripNull?: boolean,
            encoding?: string,
            endian?: string,
        } ): string{
        return this.readString(options)
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
    utf8string(length?: number, terminateValue?: number, stripNull?: boolean): string{
        return this.string({stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull})
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
    cstring(length?: number, terminateValue?: number, stripNull?: boolean): string{
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
    ansistring(length?: number, terminateValue?: number, stripNull?: boolean): string{
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
    utf16string(length?: number, terminateValue?: number, stripNull?: boolean, endian?: string): string{
        return this.string({stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull})
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
    unistring(length?: number, terminateValue?: number, stripNull?: boolean, endian?: string): string{
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
    utf16stringle(length?: number, terminateValue?: number, stripNull?: boolean): string{
        return this.string({stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull})
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
    unistringle(length?: number, terminateValue?: number, stripNull?: boolean): string{
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
    utf16stringbe(length?: number, terminateValue?: number, stripNull?: boolean): string{
        return this.string({stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull})
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
    unistringbe(length?: number, terminateValue?: number, stripNull?: boolean): string{
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
    pstring(lengthReadSize?: number, stripNull?: boolean, endian?: string): string{
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
    pstring1(stripNull?: boolean, endian?: string): string{
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: endian})
    }

    /**
    * Reads Pascal string 1 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring1le(stripNull?: boolean): string{
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little"})
    }

    /**
    * Reads Pascal string 1 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring1be(stripNull?: boolean): string{
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
    pstring2(stripNull?: boolean, endian?: string): string{
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: endian})
    }

    /**
    * Reads Pascal string 2 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring2le(stripNull?: boolean): string{
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little"})
    }

    /**
    * Reads Pascal string 2 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring2be(stripNull?: boolean): string{
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
    pstring4(stripNull?: boolean, endian?: string): string{
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: endian})
    }

    /**
    * Reads Pascal string 4 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring4le(stripNull?: boolean): string{
        return this.string({stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little"})
    }

    /**
    * Reads Pascal string 4 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    pstring4be(stripNull?: boolean): string{
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
    wpstring(lengthReadSize?: number, stripNull?: boolean, endian?: string): string{
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
    wpstring1(stripNull?: boolean, endian?: string): string{
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
    wpstring2(stripNull?: boolean, endian?: string): string{
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: endian, stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    wpstring2le(stripNull?: boolean): string{
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    wpstring2be(stripNull?: boolean): string{
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
    wpstring4(stripNull?: boolean, endian?: string): string{
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: endian, stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    wpstring4be(stripNull?: boolean): string{
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull})
    }

    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order
    * 
    * @param {boolean} stripNull - removes 0x00 characters
    * 
    * @return string
    */
    wpstring4le(stripNull?: boolean): string{
        return this.string({stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull})
    }

}