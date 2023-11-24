/// <reference types="node" />
/**
* Binary reader, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
* @param {number} byteOffset - Byte offset to start reader (default 0)
* @param {number} bitOffset - Bit offset 0-7 to start reader (default 0)
* @param {string} endianness - Endianness ``big`` or ``little`` (default ``little``)
* @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default true)
*/
export declare class bireader {
    endian: string;
    offset: number;
    bitoffset: number;
    size: number;
    strict: boolean;
    errorDump: boolean;
    data: any;
    private isBufferOrUint8Array;
    extendArray(to_padd: number): void;
    /**
    * Binary reader, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
    * @param {number} byteOffset - Byte offset to start reader (default 0)
    * @param {number} bitOffset - Bit offset 0-7 to start reader (default 0)
    * @param {string} endianness - Endianness ``big`` or ``little`` (default ``little``)
    * @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default true)
    */
    constructor(data: Buffer | Uint8Array, byteOffset?: number, bitOffset?: number, endianness?: string, strict?: boolean);
    /**
    *
    * Change endian, defaults to little
    *
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - endianness ``big`` or ``little``
    */
    endianness(endian: string): void;
    /**
    *Sets endian to big
    */
    bigEndian(): void;
    /**
    *Sets endian to big
    */
    big(): void;
    /**
    *Sets endian to big
    */
    be(): void;
    /**
    * Sets endian to little
    */
    littleEndian(): void;
    /**
    * Sets endian to little
    */
    little(): void;
    /**
    * Sets endian to little
    */
    le(): void;
    /**
    * Aligns current byte position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} number - Byte to align
    */
    align(number: number): void;
    /**
    * Reverse aligns current byte position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} number - Byte to align
    */
    alignRev(number: number): void;
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    skip(bytes: number, bits?: number): void;
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    jump(bytes: number, bits?: number): void;
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to
    */
    goto(byte: number, bit?: number): void;
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    seek(bytes: number, bits?: number): void;
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to
    */
    pointer(byte: number, bit?: number): void;
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to
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
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    tellB(): number;
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    getOffsetBit(): number;
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    saveOffsetAbsBit(): number;
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    tellAbsB(): number;
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    getOffsetAbsBit(): number;
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    saveOffsetBit(): number;
    /**
    * Disallows extending data if position is outside of max size
    */
    restrict(): void;
    /**
    * Allows extending data if position is outside of max size
    */
    unrestrict(): void;
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xor(xorKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xorThis(xorKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
    * OR data
    *
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    or(orKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * OR data
    *
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    and(andKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    andThis(andKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
    * Not data
    *
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    not(startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * Not data
    *
    * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    notThis(length?: number, consume?: boolean): void;
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    add(addKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    addThis(addKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
    * Deletes part of data from start to current byte position unless supplied, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} startOffset - Start location (default 0)
    * @param {number} endOffset - End location (default current position)
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    clip(): Buffer | Uint8Array;
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    trim(): Buffer | Uint8Array;
    /**
    * Deletes part of data from current byte position to supplied length, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    crop(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Deletes part of data from current position to supplied length, returns removed
    * Note: Only works in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    drop(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer | Uint8Array;
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer | Uint8Array;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    extract(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    slice(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    wrap(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    insert(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    place(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    replace(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    overwrite(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    unshift(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    prepend(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    push(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    append(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get(): Buffer | Uint8Array;
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return(): Buffer | Uint8Array;
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
    * @param {object} options
    * ```javascript
    *   {
    *       length: 192, // number of bytes to log, default 192 or end of data
    *       startByte: 0, // byte to start dump (default current byte position)
    *       supressUnicode: false // Supress unicode character preview for even columns
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
    * Searches for byte position of string from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {string} string - String to search for.
    */
    findString(string: string): number;
    /**
    * Searches for byte value (can be signed or unsigned) position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {boolean} unsigned - If the number is unsigned (default true)
    * @param {string} endian - endianness of value (default set endian).
    */
    findByte(value: number, unsigned?: boolean, endian?: string): number;
    /**
    * Searches for short value (can be signed or unsigned) position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {boolean} unsigned - If the number is unsigned (default true)
    * @param {string} endian - endianness of value (default set endian).
    */
    findShort(value: number, unsigned?: boolean, endian?: string): number;
    /**
    * Searches for integer value (can be signed or unsigned) position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {boolean} unsigned - If the number is unsigned (default true)
    * @param {string} endian - endianness of value (default set endian).
    */
    findInt(value: number, unsigned?: boolean, endian?: string): number;
    /**
    * Searches for half float value position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {string} endian - endianness of value (default set endian).
    */
    findHalfFloat(value: number, endian?: string): number;
    /**
    * Searches for float value position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {string} endian - endianness of value (default set endian).
    */
    findFloat(value: number, endian?: string): number;
    /**
    * Searches for 64 bit value (can be signed or unsigned) position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {boolean} unsigned - If the number is unsigned (default true)
    * @param {string} endian - endianness of value (default set endian).
    */
    findInt64(value: number, unsigned?: boolean, endian?: string): number;
    /**
    * Searches for double float value position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {string} endian - endianness of value (default set endian).
    */
    findDoubleFloat(value: number, endian?: string): number;
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
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readBit(bits?: number, unsigned?: boolean, endian?: string): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit(bits: number, unsigned?: boolean, endian?: string): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit(bits: number, endian?: string): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit1(unsigned?: boolean, endian?: string): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitBE(bits: number): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitbe(bits: number): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    readBitBE(bits: number, unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitbe(bits: number, unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitLE(bits: number): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitle(bits: number): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    readBitLE(bits: number, unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitle(bits: number, unsigned?: boolean): number;
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    readByte(unsigned?: boolean): number;
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    writeByte(value: number, unsigned?: boolean): void;
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    writeUByte(value: number): void;
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    byte(unsigned?: boolean): number;
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    int8(unsigned?: boolean): number;
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    readUByte(): number;
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    uint8(): number;
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    ubyte(): number;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt16(unsigned?: boolean, endian?: string): number;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt16(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt16(value: number, endian?: string): void;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    int16(unsigned?: boolean, endian?: string): number;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    short(unsigned?: boolean, endian?: string): number;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    word(unsigned?: boolean, endian?: string): number;
    /**
    * Read unsigned short
    *
    * @param {string} endian - ``big`` or ``little``
    *
    * @returns number
    */
    readUInt16(endian?: string): number;
    /**
    * Read unsigned short
    *
    * @param {string} endian - ``big`` or ``little``
    *
    * @returns number
    */
    uint16(endian?: string): number;
    /**
    * Read unsigned short
    *
    * @param {string} endian - ``big`` or ``little``
    *
    * @returns number
    */
    ushort(endian?: string): number;
    /**
    * Read unsigned short
    *
    * @param {string} endian - ``big`` or ``little``
    *
    * @returns number
    */
    uword(endian?: string): number;
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    readUInt16LE(): number;
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    uint16le(): number;
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    ushortle(): number;
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    uwordle(): number;
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    readInt16LE(): number;
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    int16le(): number;
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    shortle(): number;
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    wordle(): number;
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    readUInt16BE(): number;
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    uint16be(): number;
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    ushortbe(): number;
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    uwordbe(): number;
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    readInt16BE(): number;
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    int16be(): number;
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    shortbe(): number;
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    wordbe(): number;
    /**
    * Read half float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readHalfFloat(endian?: string): number;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeHalfFloat(value: number, endian?: string): void;
    /**
    * Read half float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    halffloat(endian?: string): number;
    /**
    * Read half float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    half(endian?: string): number;
    /**
    * Read half float
    *
    * @returns number
    */
    readHalfFloatBE(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    halffloatbe(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    halfbe(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    readHalfFloatLE(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    halffloatle(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    halfle(): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt32(unsigned?: boolean, endian?: string): number;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt32(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt32(value: number, endian?: string): void;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    int(unsigned?: boolean, endian?: string): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    double(unsigned?: boolean, endian?: string): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    int32(unsigned?: boolean, endian?: string): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    long(unsigned?: boolean, endian?: string): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    readUInt(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    udouble(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint32(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    ulong(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readInt32BE(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    intbe(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    doublebe(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    int32be(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    longbe(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    readUInt32BE(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uintbe(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    udoublebe(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint32be(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    ulongbe(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readInt32LE(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    intle(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    doublele(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    int32le(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    longle(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readUInt32LE(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    uintle(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    udoublele(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    uint32le(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    ulongle(): number;
    /**
    * Read float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readFloat(endian?: string): number;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeFloat(value: number, endian?: string): void;
    /**
    * Read float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    float(endian?: string): number;
    /**
    * Read float
    *
    * @returns number
    */
    readFloatBE(): number;
    /**
    * Read float
    *
    * @returns number
    */
    floatbe(): number;
    /**
    * Read float
    *
    * @returns number
    */
    readFloatLE(): number;
    /**
    * Read float
    *
    * @returns number
    */
    floatle(): number;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt64(unsigned?: boolean, endian?: string): bigint;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt64(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    int64(unsigned?: boolean, endian?: string): bigint;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bigint(unsigned?: boolean, endian?: string): bigint;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    quad(unsigned?: boolean, endian?: string): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigint(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquad(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    readInt64BE(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    int64be(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    bigintbe(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    quadbe(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64BE(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64be(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigintbe(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquadbe(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    readInt64LE(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    int64le(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    bigintle(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    quadle(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64LE(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64le(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigintle(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquadle(): bigint;
    /**
    * Read double float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readDoubleFloat(endian?: string): number;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    writeDoubleFloat(value: number, endian?: string): void;
    /**
    * Read double float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    doublefloat(endian?: string): number;
    /**
    * Read double float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    dfloat(endian?: string): number;
    /**
    * Read double float
    *
    * @returns number
    */
    readDoubleFloatBE(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    dfloatebe(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    doublefloatbe(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    readDoubleFloatLE(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    dfloatle(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    doublefloatle(): number;
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
    readString(options?: {
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthReadSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): string;
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
    writeString(string: string, options?: {
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthWriteSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): void;
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
    string(options?: {
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthReadSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): string;
    /**
    * Reads UTF-8 (C) string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf8string(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-8 (C) string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    cstring(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads ANSI string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    ansistring(length?: number, terminateValue?: number, stripNull?: boolean): string;
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
    utf16string(length?: number, terminateValue?: number, stripNull?: boolean, endian?: string): string;
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
    unistring(length?: number, terminateValue?: number, stripNull?: boolean, endian?: string): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf16stringle(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    unistringle(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf16stringbe(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    unistringbe(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads Pascal string
    *
    * @param {number} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring(lengthReadSize?: number, stripNull?: boolean, endian?: string): string;
    /**
    * Reads Pascal string 1 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring1(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Pascal string 1 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1le(stripNull?: boolean): string;
    /**
    * Reads Pascal string 1 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1be(stripNull?: boolean): string;
    /**
    * Reads Pascal string 2 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring2(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Pascal string 2 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2le(stripNull?: boolean): string;
    /**
    * Reads Pascal string 2 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2be(stripNull?: boolean): string;
    /**
    * Reads Pascal string 4 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring4(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Pascal string 4 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4le(stripNull?: boolean): string;
    /**
    * Reads Pascal string 4 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4be(stripNull?: boolean): string;
    /**
    * Reads Wide-Pascal string
    *
    * @param {number} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring(lengthReadSize?: number, stripNull?: boolean, endian?: string): string;
    /**
    * Reads Wide-Pascal string 1 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring1(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Wide-Pascal string 2 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring2(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2le(stripNull?: boolean): string;
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2be(stripNull?: boolean): string;
    /**
    * Reads Wide-Pascal string 4 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring4(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4be(stripNull?: boolean): string;
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4le(stripNull?: boolean): string;
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
export declare class biwriter {
    endian: string;
    offset: number;
    bitoffset: number;
    size: number;
    strict: boolean;
    errorDump: boolean;
    data: any;
    private isBufferOrUint8Array;
    extendArray(to_padd: number): void;
    /**
    * Binary writer, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
    * @param {number} byteOffset - Byte offset to start writer, default is 0
    * @param {number} bitOffset - Bit offset to start writer, 0-7
    * @param {string} endianness - Endianness ``big`` or ``little`` (default little)
    * @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default false)
    */
    constructor(data: Buffer | Uint8Array, byteOffset?: number, bitOffset?: number, endianness?: string, strict?: boolean);
    /**
    * Change Endian (default little)
    *
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - Endianness ``big`` or ``little``
    */
    endianness(endian: string): void;
    /**
    * Sets Endian to big
    *
    */
    bigEndian(): void;
    /**
    * Sets Endian to big
    *
    */
    big(): void;
    /**
    * Sets Endian to big
    *
    */
    be(): void;
    /**
    * Sets Endian to little
    *
    */
    littleEndian(): void;
    /**
    * Sets Endian to little
    *
    */
    little(): void;
    /**
    * Sets Endian to little
    *
    */
    le(): void;
    /**
    * Aligns current byte position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} number - Byte to align
    */
    align(number: number): void;
    /**
    * Reverse aligns current byte position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} number - Byte to align
    */
    alignRev(number: number): void;
    /**
    * Offset current byte or bit position
    *
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
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    seek(bytes: number, bits?: number): void;
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
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    tellB(): number;
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    getOffsetBit(): number;
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    saveOffsetAbsBit(): number;
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    tellAbsB(): number;
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    getOffsetAbsBit(): number;
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    saveOffsetBit(): number;
    /**
    * Disallows extending data if position is outside of max size
    */
    restrict(): void;
    /**
    * Allows extending data if position is outside of max size
    */
    unrestrict(): void;
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xor(xorKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xorThis(xorKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
    * OR data
    *
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    or(orKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * OR data
    *
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    and(andKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    andThis(andKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
    * Not data
    *
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    not(startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * Not data
    *
    * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    notThis(length?: number, consume?: boolean): void;
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    add(addKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    addThis(addKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
    * Deletes part of data from start to current byte position unless supplied, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} startOffset - Start location (default 0)
    * @param {number} endOffset - End location (default current position)
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    clip(): Buffer | Uint8Array;
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    trim(): Buffer | Uint8Array;
    /**
    * Deletes part of data from current byte position to supplied length, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    crop(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Deletes part of data from current position to supplied length, returns removed
    * Note: Only works in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    drop(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer | Uint8Array;
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer | Uint8Array;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    extract(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    slice(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    wrap(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    insert(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    place(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    replace(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    overwrite(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    unshift(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    prepend(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    push(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    append(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get(): Buffer | Uint8Array;
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return(): Buffer | Uint8Array;
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
    * @param {object} options
    * ```javascript
    *   {
    *       length: 192, // number of bytes to log, default 192 or end of data
    *       startByte: 0, // byte to start dump (default current byte position)
    *       supressUnicode: false // Supress unicode character preview for even columns
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
    * Searches for byte position of string from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {string} string - String to search for.
    */
    findString(string: string): number;
    /**
    * Searches for byte value (can be signed or unsigned) position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {boolean} unsigned - If the number is unsigned (default true)
    * @param {string} endian - endianness of value (default set endian).
    */
    findByte(value: number, unsigned?: boolean, endian?: string): number;
    /**
    * Searches for short value (can be signed or unsigned) position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {boolean} unsigned - If the number is unsigned (default true)
    * @param {string} endian - endianness of value (default set endian).
    */
    findShort(value: number, unsigned?: boolean, endian?: string): number;
    /**
    * Searches for integer value (can be signed or unsigned) position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {boolean} unsigned - If the number is unsigned (default true)
    * @param {string} endian - endianness of value (default set endian).
    */
    findInt(value: number, unsigned?: boolean, endian?: string): number;
    /**
    * Searches for half float value position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {string} endian - endianness of value (default set endian).
    */
    findHalfFloat(value: number, endian?: string): number;
    /**
    * Searches for float value position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {string} endian - endianness of value (default set endian).
    */
    findFloat(value: number, endian?: string): number;
    /**
    * Searches for 64 bit value (can be signed or unsigned) position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {boolean} unsigned - If the number is unsigned (default true)
    * @param {string} endian - endianness of value (default set endian).
    */
    findInt64(value: number, unsigned?: boolean, endian?: string): number;
    /**
    * Searches for double float value position from current read position.
    *
    * Returns -1 if not found.
    *
    * Does not change current read position.
    *
    * @param {number} value - Number to search for.
    * @param {string} endian - endianness of value (default set endian).
    */
    findDoubleFloat(value: number, endian?: string): number;
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
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readBit(bits?: number, unsigned?: boolean, endian?: string): number;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit(value: number, bits: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit(value: number, bits: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    writeUBitBE(value: number, bits: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    ubitbe(value: number, bits: number): void;
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
    writeBitBE(value: number, bits: number, unsigned?: boolean): void;
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
    bitbe(value: number, bits: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    writeUBitLE(value: number, bits: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    ubitle(value: number, bits: number): void;
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
    writeBitLE(value: number, bits: number, unsigned?: boolean): void;
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
    bitle(value: number, bits: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit1(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit1(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit1le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit1be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit2(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit2(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit2le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit2be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit3(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit3(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit3le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit3be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit4(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit4(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit4le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit4be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit5(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit5(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit5le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit5be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit6(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit6(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit6le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit6be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit7(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit7(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit7le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit7be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit8(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit8(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit8le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit8be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit9(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit9(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit9le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit9be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit10(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit10(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit10le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit10be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit11(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit11(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit11le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit11be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit12(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit12(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit12le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit12be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit13(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit13(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit13le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit13be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit14(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit14(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit14le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit14be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit15(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit15(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit15le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit15be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit16(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit16(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit16le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit16be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit17(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit17(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit17le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit17be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit18(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit18(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit18le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit18be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit19(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit19(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit19le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit19be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit20(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit20(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit20le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit20be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit21(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit21(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit21le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit21be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit22(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit22(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit22le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit22be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit23(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit23(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit23le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit23be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit24(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit24(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit24le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit24be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit25(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit25(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit25le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit25be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit26(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit26(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit26le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit26be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit27(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit27(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit27le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit27be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit28(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit28(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit28le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit28be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit29(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit29(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit29le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit29be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit30(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit30(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit30le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit30be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit31(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit31(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit31le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit31be(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit32(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32le(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32be(value: number, unsigned?: boolean): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit32(value: number, endian?: string): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit32le(value: number): void;
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit32be(value: number): void;
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    writeByte(value: number, unsigned?: boolean): void;
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    readByte(unsigned?: boolean): number;
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    readUByte(): number;
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    byte(value: number, unsigned?: boolean): void;
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    int8(value: number, unsigned?: boolean): void;
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    writeUByte(value: number): void;
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    uint8(value: number): void;
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    ubyte(value: number): void;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt16(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt16(unsigned?: boolean, endian?: string): number;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    int16(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    short(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    word(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt16(value: number, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint16(value: number, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    ushort(value: number, endian?: string): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uword(value: number, endian?: string): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    writeInt16BE(value: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    int16be(value: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    shortbe(value: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    wordbe(value: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    writeUInt16BE(value: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uint16be(value: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    ushortbe(value: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uwordbe(value: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    writeInt16LE(value: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    int16le(value: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    shortle(value: number): void;
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    wordle(value: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    writeUInt16LE(value: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uint16le(value: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    ushortle(value: number): void;
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uwordle(value: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeHalfFloat(value: number, endian?: string): void;
    /**
    * Read half float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readHalfFloat(endian?: string): number;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    half(value: number, endian?: string): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    halffloat(value: number, endian?: string): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    writeHalfFloatBE(value: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halffloatbe(value: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halfbe(value: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    writeHalfFloatLE(value: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halffloatle(value: number): void;
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halfle(value: number): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt32(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt32(unsigned?: boolean, endian?: string): number;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    int(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    int32(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    double(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    long(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt32(value: number, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint32(value: number, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint(value: number, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    udouble(value: number, endian?: string): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    ulong(value: number, endian?: string): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    writeInt32LE(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    int32le(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    intle(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    doublele(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    longle(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    writeUInt32LE(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uint32le(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uintle(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    udoublele(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    ulongle(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    writeInt32BE(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    intbe(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    int32be(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    doublebe(value: number): void;
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    longbe(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    writeUInt32BE(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uint32be(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uintbe(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    udoublebe(value: number): void;
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    ulongbe(value: number): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeFloat(value: number, endian?: string): void;
    /**
    * Read float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readFloat(endian?: string): number;
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    float(value: number, endian?: string): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    writeFloatLE(value: number): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    floatle(value: number): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    writeFloatBE(value: number): void;
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    floatbe(value: number): void;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt64(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt64(unsigned?: boolean, endian?: string): bigint;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    int64(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    quad(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    bigint(value: number, unsigned?: boolean, endian?: string): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt64(value: number, endian?: string): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint64(value: number, endian?: string): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    ubigint(value: number, endian?: string): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uquad(value: number, endian?: string): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeInt64LE(value: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    int64le(value: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    bigintle(value: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    quadle(value: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeUInt64LE(value: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uint64le(value: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    ubigintle(value: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uquadle(value: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeInt64BE(value: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    int64be(value: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    bigintbe(value: number): void;
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    quadbe(value: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeUInt64BE(value: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uint64be(value: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    ubigintbe(value: number): void;
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uquadbe(value: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeDoubleFloat(value: number, endian?: string): void;
    /**
    * Read double float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readDoubleFloat(endian?: string): number;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    doublefloat(value: number, endian?: string): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    dfloat(value: number, endian?: string): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    writeDoubleFloatBE(value: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    dfloatbe(value: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    doublefloatbe(value: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    writeDoubleFloatLE(value: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    dfloatle(value: number): void;
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    doublefloatle(value: number): void;
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
    writeString(string: string, options?: {
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthWriteSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): void;
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
    readString(options?: {
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthReadSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): string;
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
    string(string: string, options?: {
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
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    *
    * @return string
    */
    utf8string(string: string, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-8 (C) string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    *
    * @return string
    */
    cstring(string: string, length?: number, terminateValue?: number): void;
    /**
    * Writes ANSI string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    ansistring(string: string, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-16 (Unicode) string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    utf16string(string: string, length?: number, terminateValue?: number, endian?: string): void;
    /**
    * Writes UTF-16 (Unicode) string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    unistring(string: string, length?: number, terminateValue?: number, endian?: string): void;
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string: string, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringle(string: string, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string: string, length?: number, terminateValue?: number): void;
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string: string, length?: number, terminateValue?: number): void;
    /**
    * Writes Pascal string
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string: string, lengthWriteSize?: number, endian?: string): void;
    /**
    * Writes Pascal string 1 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string: string, endian?: string): void;
    /**
    * Writes Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring1le(string: string): void;
    /**
    * Writes Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring1be(string: string): void;
    /**
    * Writes Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    pstring2(string: string, endian?: string): void;
    /**
    * Writes Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring2le(string: string): void;
    /**
    * Writes Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring2be(string: string): void;
    /**
    * Writes Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    pstring4(string: string, endian?: string): void;
    /**
    * Writes Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring4be(string: string): void;
    /**
    * Writes Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring4le(string: string): void;
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring(string: string, lengthWriteSize?: number, endian?: string): void;
    /**
    * Writes Wide-Pascal string in big endian order
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string: string, lengthWriteSize?: number): void;
    /**
    * Writes Wide-Pascal string in little endian order
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string: string, lengthWriteSize?: number): void;
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring1(string: string, endian?: string): void;
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring1be(string: string): void;
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring1le(string: string): void;
    /**
    * Writes Wide-Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring2(string: string, endian?: string): void;
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring2le(string: string): void;
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring2be(string: string): void;
    /**
    * Writes Wide-Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring4(string: string, endian?: string): void;
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring4le(string: string): void;
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring4be(string: string): void;
}
//# sourceMappingURL=index.d.ts.map