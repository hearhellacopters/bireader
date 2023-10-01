/// <reference types="node" />
/**
* Binary writer, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
* @param {number} byteOffset - Byte offset to start writer, default is 0
* @param {number} bitOffset - Bit offset to start writer, 0-7
* @param {string} endianness - Endianness ``big`` or ``little`` (default little)
* @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default false)
*/
export declare class biwriter {
    endian: string;
    offset: number;
    bitoffset: number;
    size: number;
    strict: boolean;
    errorDump: boolean;
    data: any;
    private isBuffer;
    private isBufferOrUint8Array;
    extendArray(to_padd: number): void;
    private check_size;
    /**
    * Binary writer, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
    * @param {number} byteOffset - Byte offset to start writer, default is 0
    * @param {number} bitOffset - Bit offset to start writer, 0-7
    * @param {string} endianness - Endianness ``big`` or ``little`` (default little)
    * @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default false)
    */
    constructor(data: Array<Uint8Array>, byteOffset?: number, bitOffset?: number, endianness?: string, strict?: boolean);
    /**
    * Change endian (default little)
    *
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - endianness ```big``` or ```little```
    */
    endianness(endian: string): void;
    /**
    * Sets endian to big
    *
    */
    bigEndian(): void;
    /**
    * Sets endian to big
    *
    */
    big(): void;
    /**
    * Sets endian to big
    *
    */
    be(): void;
    /**
    * Sets endian to little
    *
    */
    littleEndian(): void;
    /**
    * Sets endian to little
    *
    */
    little(): void;
    /**
    * Sets endian to little
    *
    */
    le(): void;
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    skip(bytes: number, bits?: number): void;
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    jump(bytes: number, bits?: number): void;
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    goto(byte: number, bit?: number): void;
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    seek(byte: number, bit?: number): void;
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    pointer(byte: number, bit?: number): void;
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    warp(byte: number, bit?: number): void;
    /**
    * Set byte and bit position to start of data
    */
    rewind(): void;
    /**
    * Set byte and bit position to start of data
    */
    gotostart(): void;
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    tell(): number;
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    getOffset(): number;
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    saveOffset(): number;
    /**
    * Disallows extending data if position is outside of max size
    */
    restrict(): void;
    /**
    * Allows extending data if position is outside of max size
    */
    unrestrict(): void;
    /**
    * Deletes part of data from start to current byte position unless supplied, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} startOffset - Start location (default 0)
    * @param {number} endOffset - End location (default current position)
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Array<Buffer | Uint8Array>;
    /**
    * Deletes part of data from start to current byte position unless supplied, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} startOffset - Start location (default 0)
    * @param {number} endOffset - End location (default current position)
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    clip(startOffset?: number, endOffset?: number, consume?: boolean): Array<Buffer | Uint8Array>;
    /**
    * Deletes part of data from current byte position to supplied length, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    crop(length: number, consume?: boolean): Array<Buffer | Uint8Array>;
    /**
    * Deletes part of data from current position to supplied length, returns removed
    * Note: Only works in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    drop(length: number, consume?: boolean): Array<Buffer | Uint8Array>;
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Array<Buffer | Uint8Array>;
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Array<Buffer | Uint8Array>;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    extract(length: number, consume?: boolean): Array<Buffer | Uint8Array>;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    slice(length: number, consume?: boolean): Array<Buffer | Uint8Array>;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ```Uint8Array``` or ```Buffer```
    */
    wrap(length: number, consume?: boolean): Array<Buffer | Uint8Array>;
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    insert(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    place(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    unshift(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    prepend(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    push(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ```Uint8Array``` or ```Buffer``` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    append(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get(): Array<Buffer | Uint8Array>;
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return(): Array<Buffer | Uint8Array>;
    /**
    * removes data
    */
    end(): void;
    /**
    * removes data
    */
    close(): void;
    /**
    * removes data
    */
    done(): void;
    /**
    * removes data
    */
    finished(): void;
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
    hexdump(options?: {
        length?: number;
        startByte?: number;
        supressUnicode?: boolean;
    }): void;
    /**
    * Turn hexdump on error off (default on)
    */
    errorDumpOff(): void;
    /**
    * Turn hexdump on error on (default on)
    */
    errorDumpOn(): void;
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
    writeBit(value: number, bits: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean, endian?: string): void;
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
    bit(value: number, bits: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit1(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit1(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit1le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit1le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit1be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit1be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit2(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit2(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit2le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit2le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit2be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit2be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit3(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit3(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit3le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit3le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit3be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit3be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit4(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit4(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit4le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit4le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit4be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit4be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit5(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit5(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit5le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit5le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit5be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit5be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit6(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit6(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit6le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit6le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit6be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit6be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit7(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit7(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit7le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit7le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit7be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit7be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit8(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit8(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit8le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit8le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit8be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit8be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit9(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit9(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit9le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit9le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit9be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit9be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit10(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit10(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit10le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit10le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit10be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit10be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit11(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit11(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit11le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit11le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit11be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit11be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit12(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit12(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit12le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit12le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit12be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit12be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit13(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit13(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit13le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit13le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit13be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit13be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit14(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit14(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit14le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit14le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit14be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit14be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit15(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit15(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit15le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit15le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit15be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit15be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit16(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit16(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit16le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit16le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit16be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit16be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit17(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit17(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit17le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit17le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit17be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit17be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit18(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit18(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit18le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit18le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit18be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit18be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit19(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit19(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit19le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit19le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit19be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit19be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit20(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit20(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit20le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit20le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit20be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit20be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit21(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit21(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit21le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit21le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit21be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit21be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit22(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit22(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit22le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit22le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit22be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit22be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit23(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit23(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit23le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit23le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit23be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit23be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit24(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit24(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit24le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit24le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit24be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit24be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit25(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit25(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit25le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit25le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit25be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit25be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit26(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit26(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit26le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit26le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit26be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit26be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit27(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit27(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit27le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit27le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit27be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit27be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit28(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit28(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit28le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit28le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit28be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit28be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit29(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit29(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit29le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit29le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit29be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit29be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit30(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit30(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit30le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit30le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit30be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit30be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit31(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit31(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit31le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit31le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit31be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit31be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
* Bit field writer
*
* Note: When returning to a byte write, remaining bits are dropped
*
* @param {number} value - value as int
* @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
* @param {number} offsetBytes - byte offset to start the write (default last write position)
* @param {boolean} unsigned - if value is unsigned or not
*/
    bit32(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit32(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit32le(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit32le(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bit32be(value: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    */
    ubit32be(value: number, offsetBits?: number, offsetBytes?: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    writeBitBE(value: number, bits: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bitbe(value: number, bits: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    writeBitLE(value: number, bits: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {number} offsetBits - bit offset from current byte position to start the write (defaults last bit position)
    * @param {number} offsetBytes - byte offset to start the write (default last write position)
    * @param {boolean} unsigned - if value is unsigned or not
    */
    bitle(value: number, bits: number, offsetBits?: number, offsetBytes?: number, unsigned?: boolean): void;
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    */
    writeByte(value: number, offset?: number, unsigned?: boolean): void;
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    */
    byte(value: number, offset?: number, unsigned?: boolean): void;
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    */
    int8(value: number, offset?: number, unsigned?: boolean): void;
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUByte(value: number, offset?: number): void;
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint8(value: number, offset?: number): void;
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ubyte(value: number, offset?: number): void;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt16(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int16(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    short(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    word(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt16(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    uint16(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    ushort(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    uword(value: number, offset?: number, endian?: string): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt16BE(value: number, offset?: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int16be(value: number, offset?: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    shortbe(value: number, offset?: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    wordbe(value: number, offset?: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt16BE(value: number, offset?: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint16be(value: number, offset?: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ushortbe(value: number, offset?: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uwordbe(value: number, offset?: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt16LE(value: number, offset?: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int16le(value: number, offset?: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    shortle(value: number, offset?: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    wordle(value: number, offset?: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt16LE(value: number, offset?: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint16le(value: number, offset?: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ushortle(value: number, offset?: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uwordle(value: number, offset?: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeHalfFloat(value: number, offset?: number, endian?: string): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    half(value: number, offset?: number, endian?: string): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    halffloat(value: number, offset?: number, endian?: string): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeHalfFloatBE(value: number, offset?: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    halffloatbe(value: number, offset?: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    halfbe(value: number, offset?: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeHalfFloatLE(value: number, offset?: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    halffloatle(value: number, offset?: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    halfle(value: number, offset?: number): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt32(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int32(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    double(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    long(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt32(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    uint32(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    uint(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    udouble(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    ulong(value: number, offset?: number, endian?: string): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt32LE(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int32le(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    intle(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    doublele(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    longle(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt32LE(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint32le(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uintle(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    udoublele(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ulongle(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt32BE(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    intbe(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int32be(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    doublebe(value: number, offset?: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    longbe(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt32BE(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint32be(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uintbe(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    udoublebe(value: number, offset?: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ulongbe(value: number, offset?: number): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeFloat(value: number, offset?: number, endian?: string): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    float(value: number, offset?: number, endian?: string): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeFloatLE(value: number, offset?: number): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    floatle(value: number, offset?: number): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeFloatBE(value: number, offset?: number): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    floatbe(value: number, offset?: number): void;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    writeInt64(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    int64(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    quad(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    */
    bigint(value: number, offset?: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeUInt64(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    uint64(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    ubigint(value: number, offset?: number, endian?: string): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    uquad(value: number, offset?: number, endian?: string): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt64LE(value: number, offset?: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int64le(value: number, offset?: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    bigintle(value: number, offset?: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    quadle(value: number, offset?: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt64LE(value: number, offset?: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint64le(value: number, offset?: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ubigintle(value: number, offset?: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uquadle(value: number, offset?: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeInt64BE(value: number, offset?: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    int64be(value: number, offset?: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    bigintbe(value: number, offset?: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    quadbe(value: number, offset?: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeUInt64BE(value: number, offset?: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uint64be(value: number, offset?: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    ubigintbe(value: number, offset?: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    uquadbe(value: number, offset?: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    writeDoubleFloat(value: number, offset?: number, endian?: string): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    doublefloat(value: number, offset?: number, endian?: string): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`
    */
    dfloat(value: number, offset?: number, endian?: string): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeDoubleFloatBE(value: number, offset?: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    dfloatbe(value: number, offset?: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    doublefloatbe(value: number, offset?: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    writeDoubleFloatLE(value: number, offset?: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    dfloatle(value: number, offset?: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    */
    doublefloatle(value: number, offset?: number): void;
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
    writeString(string: string, options?: {
        offset?: number;
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthWriteSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): void;
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
    string(string: string, options?: {
        offset?: number;
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthWriteSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): void;
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
    utf8string(string: string, offset?: number, length?: number, terminateValue?: number): void;
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
    cstring(string: string, offset?: number, length?: number, terminateValue?: number): void;
    /**
    * Writes ANSI string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    ansistring(string: string, offset?: number, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-16 (Unicode) string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    utf16string(string: string, offset?: number, length?: number, terminateValue?: number, endian?: string): void;
    /**
    * Writes UTF-16 (Unicode) string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    unistring(string: string, offset?: number, length?: number, terminateValue?: number, endian?: string): void;
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string: string, offset?: number, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringle(string: string, offset?: number, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string: string, offset?: number, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string: string, offset?: number, length?: number, terminateValue?: number): void;
    /**
    * Writes Pascal string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string: string, offset?: number, lengthWriteSize?: number, endian?: string): void;
    /**
    * Writes Pascal string 1 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string: string, offset?: number, endian?: string): void;
    /**
    * Writes Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring1le(string: string, offset?: number): void;
    /**
    * Writes Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring1be(string: string, offset?: number): void;
    /**
    * Writes Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    pstring2(string: string, offset?: number, endian?: string): void;
    /**
    * Writes Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring2le(string: string, offset?: number): void;
    /**
    * Writes Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring2be(string: string, offset?: number): void;
    /**
    * Writes Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    pstring4(string: string, offset?: number, endian?: string): void;
    /**
    * Writes Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring4be(string: string, offset?: number): void;
    /**
    * Writes Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    pstring4le(string: string, offset?: number): void;
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring(string: string, offset?: number, lengthWriteSize?: number, endian?: string): void;
    /**
    * Writes Wide-Pascal string in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string: string, offset?: number, lengthWriteSize?: number): void;
    /**
    * Writes Wide-Pascal string in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string: string, offset?: number, lengthWriteSize?: number): void;
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring1(string: string, offset?: number, endian?: string): void;
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring1be(string: string, offset?: number): void;
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring1le(string: string, offset?: number): void;
    /**
    * Writes Wide-Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring2(string: string, offset?: number, endian?: string): void;
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring2le(string: string, offset?: number): void;
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring2be(string: string, offset?: number): void;
    /**
    * Writes Wide-Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring4(string: string, offset?: number, endian?: string): void;
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring4le(string: string, offset?: number): void;
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    * @param {number} offset - byte offset (default last write position)
    */
    wpstring4be(string: string, offset?: number): void;
}
//# sourceMappingURL=writer.d.ts.map