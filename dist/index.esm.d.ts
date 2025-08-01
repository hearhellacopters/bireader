/// <reference types="node" />
type endian = "little" | "big";
type BigValue = number | bigint;
type BiOptions = {
    /**
     * Byte offset to start writer, default is 0
     */
    byteOffset?: number;
    /**
     *  Byte offset to start writer, default is 0
     */
    bitOffset?: number;
    /**
     * Endianness ``big`` or ``little`` (default little)
     */
    endianness?: endian;
    /**
     * Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     */
    strict?: boolean;
    /**
     * Amount of data to add when extending the buffer array when strict mode is false. Note: Changes login in ``.get`` and ``.return``.
     */
    extendBufferSize?: number;
    /**
     * When reading a 64 bit value, the reader checks if the value is safe for a ``number`` type and convert it.
     *
     * Set this to ``true`` if you wish for it to always stay a ``BigInt``.
     */
    enforceBigInt?: boolean;
};
type hexdumpOptions = {
    /**
     * number of bytes to log, default ``192`` or end of data
     */
    length?: number;
    /**
     * byte to start dump (default ``0``)
     */
    startByte?: number;
    /**
     * Suppress unicode character preview for even columns.
     */
    suppressUnicode?: boolean;
    /**
     * Returns the hex dump string instead of logging it.
     */
    returnString?: boolean;
};
/**
 * Creates hex dump string. Will console log or return string if set in options.
 *
 * @param {Uint8Array|Buffer} src - Uint8Array or Buffer
 * @param {hexdumpOptions?} options - hex dump options
 * @param {number?} options.length - number of bytes to log, default ``192`` or end of data
 * @param {number?} options.startByte - byte to start dump (default ``0``)
 * @param {boolean?} options.suppressUnicode - Suppress unicode character preview for even columns.
 * @param {boolean?} options.returnString - Returns the hex dump string instead of logging it.
 */
declare function hexdump(src: Uint8Array | Buffer, options?: hexdumpOptions): void | string;
type stringOptions = {
    /**
     * for fixed length, non-terminate value utf strings
     */
    length?: number;
    /**
     * utf-8, utf-16, pascal or wide-pascal
     */
    stringType?: "utf-8" | "utf-16" | "pascal" | "wide-pascal";
    /**
     * only with stringType: "utf"
     */
    terminateValue?: number;
    /**
     * for pascal strings. 1, 2 or 4 byte length read size
     */
    lengthReadSize?: 1 | 2 | 4;
    /**
     * for pascal strings. 1, 2 or 4 byte length write size
     */
    lengthWriteSize?: 1 | 2 | 4;
    /**
     * removes 0x00 characters
     */
    stripNull?: boolean;
    /**
     * TextEncoder accepted types
     */
    encoding?: string;
    /**
     * for wide-pascal and utf-16
     */
    endian?: "big" | "little";
};

declare class BiBase {
    /**
     * Endianness of default read.
     * @type {endian}
     */
    endian: endian;
    /**
     * Current read byte location.
     */
    offset: number;
    /**
     * Current read byte's bit location.
     */
    bitoffset: number;
    /**
     * Size in bytes of the current buffer.
     */
    size: number;
    /**
     * Size in bits of the current buffer.
     */
    sizeB: number;
    /**
     * Allows the buffer to extend reading or writing outside of current size
     */
    strict: boolean;
    /**
     * Console log a hexdump on error.
     */
    errorDump: boolean;
    /**
     * Current buffer data.
     * @type {Buffer|Uint8Array|null}
     */
    data: Buffer | Uint8Array | null;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     *
     * Otherwise it extends just the amount of the next written value.
     *
     * This can greatly speed up data writes when large files are being written.
     *
     * NOTE: Using ``BiWriter.get`` or ``BiWriter.return`` will now remove all data after the current write position. Use ``BiWriter.data`` to get the full buffer instead.
     */
    extendBufferSize: number;
    fd: any;
    filePath: string;
    fsMode: string;
    /**
     * The settings that used when using the .str getter / setter
     */
    private strDefaults;
    maxFileSize: number | null;
    enforceBigInt: boolean;
    constructor();
    /**
     * Settings for when using .str
     *
     * @param {stringOptions} settings options to use with .str
     */
    set strSettings(settings: stringOptions);
    /**
     * Enables expanding in reader (changes strict)
     *
     * @param {boolean} mode - Enable expanding in reader (changes strict)
     */
    writeMode(mode: boolean): void;
    /**
     * Dummy function, not needed on Non-Stream
     */
    open(): number;
    /**
     * Dummy function, not needed on Non-Stream
     */
    updateSize(): void;
    /**
     * removes data.
     */
    close(): void;
    /**
     * Dummy function, not needed on Non-Stream
     */
    read(start: number, length: number, consume?: boolean): Buffer | Uint8Array;
    /**
     * Dummy function, not needed on Non-Stream
     */
    write(start: number, data: Buffer, consume?: boolean): number;
    /**
     * Dummy function, not needed on Non-Stream
     */
    renameFile(): void;
    /**
     * Dummy function, not needed on Non-Stream
     */
    deleteFile(): void;
    /**
     * Dummy function, not needed on Non-Stream
     */
    commit(consume?: boolean): number;
    extendArray(to_padd: number): void;
    isBufferOrUint8Array(obj: Buffer | Uint8Array): boolean;
    /**
     *
     * Change endian, defaults to little.
     *
     * Can be changed at any time, doesn't loose position.
     *
     * @param {endian} endian - endianness ``big`` or ``little``
     */
    endianness(endian: endian): void;
    /**
     * Sets endian to big.
     */
    bigEndian(): void;
    /**
     * Sets endian to big.
     */
    big(): void;
    /**
     * Sets endian to big.
     */
    be(): void;
    /**
     * Sets endian to little.
     */
    littleEndian(): void;
    /**
     * Sets endian to little.
     */
    little(): void;
    /**
     * Sets endian to little.
     */
    le(): void;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get length(): number;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get len(): number;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get FileSize(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lengthB(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get FileSizeB(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lenb(): number;
    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get tell(): number;
    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get FTell(): number;
    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get getOffset(): number;
    /**
     * Get the current byte position;
     *
     * @return {number} current byte position
     */
    get saveOffset(): number;
    /**
     * Get the current byte position;
     *
     * @return {number} current byte position
     */
    get off(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get getOffsetBit(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get tellB(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get FTellB(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get offb(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get getOffsetAbsBit(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current bit position
     */
    get saveOffsetAbsBit(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get tellAbsB(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get saveOffsetBit(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get offab(): number;
    /**
     * Size in bytes of current read position to the end
     *
     * @returns {number} size
     */
    get remain(): number;
    /**
     * Size in bytes of current read position to the end
     *
     * @returns {number} size
     */
    get FEoF(): number;
    /**
     * Size in bits of current read position to the end
     *
     * @returns {number} size
     */
    get remainB(): number;
    /**
     * Size in bits of current read position to the end
     *
     * @returns {number} size
     */
    get FEoFB(): number;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get getLine(): number;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get row(): number;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
     */
    get get(): Buffer | Uint8Array;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
     */
    get return(): Buffer | Uint8Array;
    /**
    * Creates hex dump string. Will console log or return string if set in options.
    *
    * @param {object} options
    * @param {hexdumpOptions?} options - hex dump options
    * @param {number?} options.length - number of bytes to log, default ``192`` or end of data
    * @param {number?} options.startByte - byte to start dump (default ``0``)
    * @param {boolean?} options.suppressUnicode - Suppress unicode character preview for even columns.
    * @param {boolean?} options.returnString - Returns the hex dump string instead of logging it.
    */
    hexdump(options?: hexdumpOptions): void | string;
    /**
     * Turn hexdump on error off (default on).
     */
    errorDumpOff(): void;
    /**
     * Turn hexdump on error on (default on).
     */
    errorDumpOn(): void;
    /**
     * Disallows extending data if position is outside of max size.
     */
    restrict(): void;
    /**
     * Allows extending data if position is outside of max size.
     */
    unrestrict(): void;
    /**
     * removes data.
     */
    end(): void;
    /**
     * removes data.
     */
    done(): void;
    /**
     * removes data.
     */
    finished(): void;
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
     * @param {endian} endian - endianness of value (default set endian).
     */
    findByte(value: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Searches for short value (can be signed or unsigned) position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {endian} endian - endianness of value (default set endian).
     */
    findShort(value: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Searches for integer value (can be signed or unsigned) position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {endian} endian - endianness of value (default set endian).
     */
    findInt(value: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Searches for 64 bit value (can be signed or unsigned) position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {BigValue} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {endian} endian - endianness of value (default set endian).
     */
    findInt64(value: BigValue, unsigned?: boolean, endian?: endian): number;
    /**
     * Searches for half float value position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {endian} endian - endianness of value (default set endian).
     */
    findHalfFloat(value: number, endian?: endian): number;
    /**
     * Searches for float value position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {endian} endian - endianness of value (default set endian).
     */
    findFloat(value: number, endian?: endian): number;
    /**
     * Searches for double float value position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {endian} endian - endianness of value (default set endian).
     */
    findDoubleFloat(value: number, endian?: endian): number;
    /**
     * Aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    align(number: number): void;
    /**
     * Reverse aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    alignRev(number: number): void;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    skip(bytes: number, bits?: number): void;
    /**
    * Offset current byte or bit position.
    *
    * Note: Will extend array if strict mode is off and outside of max size.
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    jump(bytes: number, bits?: number): void;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    FSeek(byte: number, bit?: number): void;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    seek(bytes: number, bits?: number): void;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    goto(byte: number, bit?: number): void;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    pointer(byte: number, bit?: number): void;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    warp(byte: number, bit?: number): void;
    /**
     * Set byte and bit position to start of data.
     */
    rewind(): void;
    /**
     * Set byte and bit position to start of data.
     */
    gotoStart(): void;
    /**
     * Set current byte and bit position to end of data.
     */
    last(): void;
    /**
     * Set current byte and bit position to end of data.
     */
    gotoEnd(): void;
    /**
     * Set byte and bit position to start of data.
     */
    EoF(): void;
    /**
     * Deletes part of data from start to current byte position unless supplied, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} startOffset - Start location (default 0)
     * @param {number} endOffset - End location (default current position)
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Buffer | Uint8Array;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    clip(): Buffer | Uint8Array;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    trim(): Buffer | Uint8Array;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    crop(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
     * Deletes part of data from current position to supplied length, returns removed.
     *
     * Note: Only works in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    drop(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    replace(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    overwrite(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer | Uint8Array;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer | Uint8Array;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    extract(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    slice(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    wrap(length: number, consume?: boolean): Buffer | Uint8Array;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    insert(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    place(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xor(xorKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * XOR data.
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
     * OR data.
     *
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
     * AND data.
     *
     * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    and(andKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * AND data.
     *
     * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
     * Add value to data.
     *
     * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    add(addKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Add value to data.
     *
     * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
     * Not data.
     *
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    not(startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length?: number, consume?: boolean): void;
    /**
     * Left shift data.
     *
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Left shift data.
     *
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
     * Right shift data.
     *
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Right shift data.
     *
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
     *
     * Write bits, must have at least value and number of bits.
     *
     * ``Note``: When returning to a byte write, remaining bits are skipped.
     *
     * @param {number} value - value as int
     * @param {number} bits - number of bits to write
     * @param {boolean} unsigned - if value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: endian): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitBE(value: number, bits: number): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns number
     */
    writeBitBE(value: number, bits: number, unsigned?: boolean): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitLE(value: number, bits: number): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns number
     */
    writeBitLE(value: number, bits: number, unsigned?: boolean): void;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readBit(bits?: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitBE(bits: number): number;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitBE(bits: number, unsigned?: boolean): number;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitLE(bits: number): number;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitLE(bits: number, unsigned?: boolean): number;
    /**
     * Read byte.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number}
     */
    readByte(unsigned?: boolean): number;
    /**
     * Read multiple bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number[]}
     */
    readBytes(amount: number, unsigned?: boolean): number[];
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeByte(value: number, unsigned?: boolean): void;
    /**
     * Write multiple bytes.
     *
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeBytes(values: number[], unsigned?: boolean): void;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    writeUByte(value: number): void;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    readUByte(): number;
    /**
     * Read short.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt16(unsigned?: boolean, endian?: endian): number;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt16(value: number, unsigned?: boolean, endian?: endian): void;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value: number, endian?: endian): void;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16BE(value: number): void;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16LE(value: number): void;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    writeInt16LE(value: number): void;
    /**
     * Read unsigned short.
     *
     * @param {endian} endian - ``big`` or ``little``
     *
     * @returns {number}
     */
    readUInt16(endian?: endian): number;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    readUInt16LE(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    readInt16LE(): number;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    readUInt16BE(): number;
    /**
    * Read signed short in big endian.
    *
    * @returns {number}
    */
    readInt16BE(): number;
    /**
     * Read half float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readHalfFloat(endian?: endian): number;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeHalfFloat(value: number, endian?: endian): void;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatBE(value: number): void;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatLE(value: number): void;
    /**
    * Read half float.
    *
    * @returns {number}
    */
    readHalfFloatBE(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    readHalfFloatLE(): number;
    /**
     * Read 32 bit integer.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt32(unsigned?: boolean, endian?: endian): number;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt32(value: number, unsigned?: boolean, endian?: endian): void;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value: number, endian?: endian): void;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32LE(value: number): void;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32LE(value: number): void;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32BE(value: number): void;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32BE(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    readUInt32BE(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32LE(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readUInt32LE(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    readUInt(): number;
    /**
     * Read float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat(endian?: endian): number;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat(value: number, endian?: endian): void;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    writeFloatLE(value: number): void;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    writeFloatBE(value: number): void;
    /**
     * Read float.
     *
     * @returns {number}
     */
    readFloatBE(): number;
    /**
     * Read float.
     *
     * @returns {number}
     */
    readFloatLE(): number;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian?} endian - ``big`` or ``little``
     * @returns {BigValue}
     */
    readInt64(unsigned?: boolean, endian?: endian): BigValue;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt64(value: BigValue, unsigned?: boolean, endian?: endian): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt64(value: BigValue, endian?: endian): void;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeInt64LE(value: BigValue): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64LE(value: BigValue): void;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeInt64BE(value: BigValue): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64BE(value: BigValue): void;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readUInt64(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readInt64BE(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readUInt64BE(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readInt64LE(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readUInt64LE(): BigValue;
    /**
     * Read double float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian?: endian): number;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value: number, endian?: endian): void;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatBE(value: number): void;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatLE(value: number): void;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    readDoubleFloatBE(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    readDoubleFloatLE(): number;
    /**
    * Reads string, use options object for different types.
    *
    * @param {stringOptions} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    * @return {Promise<string>}
    */
    readString(options?: stringOptions): string;
    /**
    * Writes string, use options object for different types.
    *
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    */
    writeString(string: string, options?: stringOptions): void;
}

/**
 * Binary reader, includes bitfields and strings.
 *
 * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiReader.data``
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 *
 * @since 2.0
 */
declare class BiReader extends BiBase {
    /**
     * Binary reader, includes bitfields and strings.
     *
     * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiReader.data``
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     */
    constructor(data: Buffer | Uint8Array, options?: BiOptions);
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    bit(bits: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Bit field reader. Unsigned read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(bits: number, endian?: endian): number;
    /**
     * Bit field reader. Unsigned big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitbe(bits: number): number;
    /**
     * Bit field reader. Big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitbe(bits: number, unsigned?: boolean): number;
    /**
     * Bit field reader. Unsigned little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitle(bits: number): number;
    /**
     * Bit field reader. Little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitle(bits: number, unsigned?: boolean): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1le(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1be(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1le(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1be(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2le(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2be(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2le(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2be(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3le(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3be(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3le(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3be(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4le(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4be(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4le(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4be(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5le(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5be(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5le(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5be(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6le(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6be(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6le(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6be(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7le(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7be(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7le(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7be(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8le(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8be(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8le(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8be(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9le(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9be(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9le(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9be(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10le(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10be(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10le(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10be(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11le(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11be(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11le(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11be(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12le(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12be(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12le(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12be(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13le(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13be(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13le(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13be(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14le(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14be(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14le(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14be(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15le(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15be(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15le(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15be(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16le(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16be(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16le(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16be(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17le(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17be(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17le(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17be(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18le(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18be(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18le(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18be(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19le(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19be(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19le(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19be(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20le(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20be(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20le(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20be(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21le(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21be(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21le(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21be(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22le(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22be(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22le(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22be(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23le(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23be(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23le(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23be(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24le(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24be(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24le(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24be(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25le(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25be(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25le(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25be(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26le(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26be(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26le(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26be(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27le(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27be(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27le(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27be(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28le(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28be(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28le(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28be(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29le(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29be(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29le(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29be(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30le(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30be(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30le(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30be(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31le(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31be(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31le(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31be(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32le(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32be(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32le(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32be(): number;
    /**
     * Read byte.
     *
     * @returns {number}
     */
    get byte(): number;
    /**
     * Read byte.
     *
     * @returns {number}
     */
    get int8(): number;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    get uint8(): number;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    get ubyte(): number;
    /**
     * Read short.
     *
     * @returns {number}
     */
    get int16(): number;
    /**
     * Read short.
     *
     * @returns {number}
     */
    get short(): number;
    /**
     * Read short.
     *
     * @returns {number}
     */
    get word(): number;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get uint16(): number;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get ushort(): number;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get uword(): number;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get uint16le(): number;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get ushortle(): number;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get uwordle(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get int16le(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get shortle(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get wordle(): number;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get uint16be(): number;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get ushortbe(): number;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get uwordbe(): number;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get int16be(): number;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get shortbe(): number;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get wordbe(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloat(): number;
    /**
     * Read half float
     *
     * @returns {number}
     */
    get half(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloatbe(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halfbe(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloatle(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halfle(): number;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get int(): number;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get double(): number;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get int32(): number;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get long(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get udouble(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint32(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get ulong(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get intbe(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get doublebe(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get int32be(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get longbe(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uintbe(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get udoublebe(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint32be(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get ulongbe(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get intle(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get doublele(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get int32le(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get longle(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get uintle(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get udoublele(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get uint32le(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get ulongle(): number;
    /**
     * Read float.
     *
     * @returns {number}
     */
    get float(): number;
    /**
     * Read float.
     *
     * @returns {number}
     */
    get floatbe(): number;
    /**
     * Read float.
     *
     * @returns {number}
     */
    get floatle(): number;
    /**
     * Read signed 64 bit integer
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get int64(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get bigint(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get quad(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uint64(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get ubigint(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uquad(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get int64be(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get bigintbe(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get quadbe(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uint64be(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get ubigintbe(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uquadbe(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get int64le(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get bigintle(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get quadle(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uint64le(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get ubigintle(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uquadle(): BigValue;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloat(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloat(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloatbe(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloatbe(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloatle(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloatle(): number;
    /**
    * Reads string, use options object for different types.
    *
    * @param {stringOptions} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["stripNull"]?} options.stripNull - removes 0x00 characters
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    * @return {string}
    */
    string(options?: stringOptions): string;
    /**
    * Reads string using setting from .strSettings
    *
    * Default is ``utf-8``
    *
    * @return {string}
    */
    get str(): string;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    utf8string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads ANSI string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    utf16string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring1le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring1be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring2le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring2be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring4le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring4be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide-Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide-Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide-Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    wpstring2le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    wpstring2be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide-Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    wpstring4be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    wpstring4le(stripNull?: stringOptions["stripNull"]): string;
}

/**
 * Binary writer, includes bitfields and strings.
 *
 * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiWriter.data``
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 *
 * @since 2.0
 */
declare class BiWriter extends BiBase {
    /**
     * Binary writer, includes bitfields and strings.
     *
     * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``BiWriter.data``
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     */
    constructor(data?: Buffer | Uint8Array, options?: BiOptions);
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    bit(value: number, bits: number, unsigned?: boolean, endian?: endian): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(value: number, bits: number, endian?: endian): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitbe(value: number, bits: number, unsigned?: boolean): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitbe(value: number, bits: number): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitle(value: number, bits: number): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitle(value: number, bits: number, unsigned?: boolean): void;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1le(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1be(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1le(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1be(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2le(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2be(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2le(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2be(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3le(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3be(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3le(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3be(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4le(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4be(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4le(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4be(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5le(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5be(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5le(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5be(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6le(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6be(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6le(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6be(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7le(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7be(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7le(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7be(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8le(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8be(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8le(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8be(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9le(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9be(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9le(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9be(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10le(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10be(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10le(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10be(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11le(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11be(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11le(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11be(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12le(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12be(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12le(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12be(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13le(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13be(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13le(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13be(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14le(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14be(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14le(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14be(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15le(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15be(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15le(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15be(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16le(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16be(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16le(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16be(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17le(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17be(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17le(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17be(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18le(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18be(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18le(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18be(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19le(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19be(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19le(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19be(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20le(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20be(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20le(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20be(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21le(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21be(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21le(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21be(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22le(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22be(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22le(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22be(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23le(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23be(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23le(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23be(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24le(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24be(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24le(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24be(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25le(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25be(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25le(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25be(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26le(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26be(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26le(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26be(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27le(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27be(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27le(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27be(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28le(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28be(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28le(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28be(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29le(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29be(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29le(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29be(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30le(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30be(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30le(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30be(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31le(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31be(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31le(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31be(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32le(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32be(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32le(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32be(value: number);
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    set byte(value: number);
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    set int8(value: number);
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    set uint8(value: number);
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    set ubyte(value: number);
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set int16(value: number);
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set short(value: number);
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set word(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushort(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uword(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set int16be(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set shortbe(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set wordbe(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16be(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushortbe(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uwordbe(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set int16le(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set shortle(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set wordle(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16le(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushortle(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uwordle(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set half(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloat(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloatbe(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halfbe(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloatle(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halfle(value: number);
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set int(value: number);
    /**
    * Write int32.
    *
    * @param {number} value - value as int
    */
    set int32(value: number);
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set double(value: number);
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set long(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint(value: number);
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    set udouble(value: number);
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    set ulong(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set int32le(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set intle(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set doublele(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set longle(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32le(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uintle(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set udoublele(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongle(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set intbe(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set int32be(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set doublebe(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set longbe(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set writeUInt32BE(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32be(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uintbe(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set udoublebe(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongbe(value: number);
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    set float(value: number);
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    set floatle(value: number);
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    set floatbe(value: number);
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64(value: BigValue);
    /**
    * Write 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    set quad(value: BigValue);
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigint(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigint(value: BigValue);
    /**
    * Write unsigned 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    set uquad(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64le(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigintle(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set quadle(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64le(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigintle(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uquadle(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64be(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigintbe(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set quadbe(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64be(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigintbe(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uquadbe(value: BigValue);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloat(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloat(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloatbe(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloatbe(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloatle(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloatle(value: number);
    /**
    * Writes string, use options object for different types.
    *
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    */
    string(string: string, options?: stringOptions): void;
    /**
    * Writes string using setting from .strSettings
    *
    * Default is ``utf-8``
    *
    * @param {string} string - text string
    */
    set str(string: string);
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf8string(string: string, length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    cstring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes ANSI string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    ansistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf16string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    unistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void;
    /**
    * Writes Pascal string 1 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring1le(string: string): void;
    /**
    * Writes Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring1be(string: string): void;
    /**
    * Writes Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring2(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring2le(string: string): void;
    /**
    * Writes Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring2be(string: string): void;
    /**
    * Writes Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring4(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring4be(string: string): void;
    /**
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring4le(string: string): void;
    /**
    * Writes Wide-Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide-Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void;
    /**
    * Writes Wide-Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void;
    /**
    * Writes Wide-Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring1(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring1be(string: string): void;
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring1le(string: string): void;
    /**
    * Writes Wide-Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring2(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring2le(string: string): void;
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring2be(string: string): void;
    /**
    * Writes Wide-Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring4(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring4le(string: string): void;
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring4be(string: string): void;
}

/**
 * For file system in Node
 */
type FileDescriptor = number;
/**
 * file system read modes
 */
type fsMode = "w+" | "r";
declare class BiBaseStreamer {
    /**
     * Endianness of default read.
     *
     * @type {endian}
     */
    endian: endian;
    /**
     * Current read byte location.
     */
    offset: number;
    /**
     * Current read byte's bit location.
     */
    bitoffset: number;
    /**
     * Size in bytes of the current file.
     */
    size: number;
    /**
     * Size in bits of the current file.
     */
    sizeB: number;
    /**
     * Allows the file to extend reading or writing outside of current size
     */
    strict: boolean;
    /**
     * Console log a hexdump on error.
     */
    errorDump: boolean;
    /**
     * Current buffer chunk.
     *
     * @type {Buffer|null}
     */
    data: Buffer | null;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     *
     * Otherwise it extends just the amount of the next written value.
     *
     * This can greatly speed up data writes when large files are being written.
     *
     * NOTE: Using ``BiWriter.get`` or ``BiWriter.return`` will now remove all data after the current write position. Use ``BiWriter.data`` to get the full buffer instead.
     */
    extendBufferSize: number;
    fd: FileDescriptor | null;
    filePath: string;
    fsMode: fsMode;
    /**
     * The settings that used when using the .str getter / setter
     */
    private strDefaults;
    maxFileSize: number | null;
    enforceBigInt: boolean;
    constructor(filePath: string, readwrite: boolean);
    /**
     * Settings for when using .str
     *
     * @param {stringOptions} settings options to use with .str
     */
    set strSettings(settings: stringOptions);
    /**
     * Enabling write mode in reader.
     *
     * @param {boolean} writeMode - Enabling write mode in reader.
     */
    writeMode(writeMode: boolean): void;
    /**
     * Opens the file. Must be run before reading or writing.
     *
     * @returns {number} file size
     */
    open(): number;
    /**
     * Internal update size
     */
    updateSize(): void;
    /**
     * Closes the file.
     *
     * @returns {void}
     */
    close(): void;
    /**
     * Internal reader
     *
     * @param start - likely this.offset
     * @param length
     * @param consume
     * @returns
     */
    read(start: number, length: number, consume?: boolean): Buffer;
    /**
     * Internal writer
     *
     * @param start - likely this.offset
     * @param data
     * @param consume
     * @returns {number}
     */
    write(start: number, data: Buffer, consume?: boolean): number;
    /**
     * internal write commit
     *
     * @param consume
     * @returns {number}
     */
    commit(consume?: boolean): number;
    /**
     * Renames the file you are working on.
     *
     * Must be full file path and file name.
     *
     * Keeps write / read position.
     *
     * Note: This is permanent and can't be undone.
     *
     * @param {string} newFilePath - New full file path and name.
     */
    renameFile(newFilePath: string): void;
    /**
     * Deletes the working file.
     *
     * Note: This is permanentand can't be undone.
     *
     * It doesn't send the file to the recycling bin for recovery.
     */
    deleteFile(): void;
    /**
     * internal extend
     *
     *
     * @param length amount needed
     * @returns {void}
     */
    extendArray(length: number): void;
    isBufferOrUint8Array(obj: Buffer | Uint8Array): boolean;
    /**
     *
     * Change endian, defaults to little.
     *
     * Can be changed at any time, doesn't loose position.
     *
     * @param {endian} endian - endianness ``big`` or ``little``
     */
    endianness(endian: endian): void;
    /**
     * Sets endian to big.
     */
    bigEndian(): void;
    /**
     * Sets endian to big.
     */
    big(): void;
    /**
     * Sets endian to big.
     */
    be(): void;
    /**
     * Sets endian to little.
     */
    littleEndian(): void;
    /**
     * Sets endian to little.
     */
    little(): void;
    /**
     * Sets endian to little.
     */
    le(): void;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get length(): number;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get len(): number;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get FileSize(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lengthB(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get FileSizeB(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lenb(): number;
    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get tell(): number;
    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get FTell(): number;
    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get getOffset(): number;
    /**
     * Get the current byte position;
     *
     * @return {number} current byte position
     */
    get saveOffset(): number;
    /**
     * Get the current byte position;
     *
     * @return {number} current byte position
     */
    get off(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get getOffsetBit(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get tellB(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get FTellB(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get offb(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get getOffsetAbsBit(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current bit position
     */
    get saveOffsetAbsBit(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get tellAbsB(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get saveOffsetBit(): number;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get offab(): number;
    /**
     * Size in bytes of current read position to the end
     *
     * @returns {number} size
     */
    get remain(): number;
    /**
     * Size in bytes of current read position to the end
     *
     * @returns {number} size
     */
    get FEoF(): number;
    /**
     * Size in bits of current read position to the end
     *
     * @returns {number} size
     */
    get remainB(): number;
    /**
     * Size in bits of current read position to the end
     *
     * @returns {number} size
     */
    get FEoFB(): number;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get getLine(): number;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get row(): number;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {Buffer|Uint8Array} ``Buffer``
     */
    get get(): Buffer;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {Buffer} ``Buffer``
     */
    get return(): Buffer;
    /**
     * Creates hex dump string. Will console log or return string if set in options.
     *
     * @param {object} options
     * @param {hexdumpOptions?} options - hex dump options
     * @param {number?} options.length - number of bytes to log, default ``192`` or end of data
     * @param {number?} options.startByte - byte to start dump (default ``0``)
     * @param {boolean?} options.suppressUnicode - Suppress unicode character preview for even columns.
     * @param {boolean?} options.returnString - Returns the hex dump string instead of logging it.
     */
    hexdump(options?: hexdumpOptions): void | string;
    /**
     * Turn hexdump on error off (default on).
     */
    errorDumpOff(): void;
    /**
     * Turn hexdump on error on (default on).
     */
    errorDumpOn(): void;
    /**
     * Disallows extending data if position is outside of max size.
     */
    restrict(): void;
    /**
     * Allows extending data if position is outside of max size.
     */
    unrestrict(): void;
    /**
     * removes data.
     */
    end(): void;
    /**
     * removes data.
     */
    done(): void;
    /**
     * removes data.
     */
    finished(): void;
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
     * @param {endian} endian - endianness of value (default set endian).
     */
    findByte(value: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Searches for short value (can be signed or unsigned) position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {endian} endian - endianness of value (default set endian).
     */
    findShort(value: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Searches for integer value (can be signed or unsigned) position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {endian} endian - endianness of value (default set endian).
     */
    findInt(value: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Searches for 64 bit value (can be signed or unsigned) position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {BigValue} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {endian} endian - endianness of value (default set endian).
     */
    findInt64(value: BigValue, unsigned?: boolean, endian?: endian): number;
    /**
     * Searches for half float value position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {endian} endian - endianness of value (default set endian).
     */
    findHalfFloat(value: number, endian?: endian): number;
    /**
     * Searches for float value position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {endian} endian - endianness of value (default set endian).
     */
    findFloat(value: number, endian?: endian): number;
    /**
     * Searches for double float value position from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {number} value - Number to search for.
     * @param {endian} endian - endianness of value (default set endian).
     */
    findDoubleFloat(value: number, endian?: endian): number;
    /**
     * Aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    align(number: number): void;
    /**
     * Reverse aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    alignRev(number: number): void;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    skip(bytes: number, bits?: number): void;
    /**
    * Offset current byte or bit position.
    *
    * Note: Will extend array if strict mode is off and outside of max size.
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    jump(bytes: number, bits?: number): void;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    FSeek(byte: number, bit?: number): void;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    seek(bytes: number, bits?: number): void;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    goto(byte: number, bit?: number): void;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    pointer(byte: number, bit?: number): void;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    warp(byte: number, bit?: number): void;
    /**
     * Set byte and bit position to start of data.
     */
    rewind(): void;
    /**
     * Set byte and bit position to start of data.
     */
    gotoStart(): void;
    /**
     * Set current byte and bit position to end of data.
     */
    last(): void;
    /**
     * Set current byte and bit position to end of data.
     */
    gotoEnd(): void;
    /**
     * Set byte and bit position to start of data.
     */
    EoF(): void;
    /**
     * Deletes part of data from start to current byte position unless supplied, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} startOffset - Start location (default 0)
     * @param {number} endOffset - End location (default current position)
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer} Removed data as ``Buffer``
     */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Buffer;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {Buffer} Removed data as ``Buffer``
     */
    clip(): Buffer;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {Buffer} Removed data as ``Buffer``
     */
    trim(): Buffer;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer} Removed data as ``Buffer``
     */
    crop(length: number, consume?: boolean): Buffer;
    /**
     * Deletes part of data from current position to supplied length, returns removed.
     *
     * Note: Only works in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer} Removed data as ``Buffer``
     */
    drop(length: number, consume?: boolean): Buffer;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    replace(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    overwrite(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer} Selected data as ``Buffer``
     */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer} Selected data as ``Buffer``
     */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer} Selected data as ``Buffer``
     */
    extract(length: number, consume?: boolean): Buffer;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer} Selected data as ``Buffer``
     */
    slice(length: number, consume?: boolean): Buffer;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data or ``Buffer``
     */
    wrap(length: number, consume?: boolean): Buffer;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    insert(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    place(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xor(xorKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * XOR data.
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
     * OR data.
     *
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
     * AND data.
     *
     * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    and(andKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * AND data.
     *
     * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
     * Add value to data.
     *
     * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    add(addKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Add value to data.
     *
     * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
     * Not data.
     *
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    not(startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length?: number, consume?: boolean): void;
    /**
     * Left shift data.
     *
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Left shift data.
     *
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
     * Right shift data.
     *
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Right shift data.
     *
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void;
    /**
     *
     * Write bits, must have at least value and number of bits.
     *
     * ``Note``: When returning to a byte write, remaining bits are skipped.
     *
     * @param {number} value - value as int
     * @param {number} bits - number of bits to write
     * @param {boolean} unsigned - if value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: endian): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitBE(value: number, bits: number): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns number
     */
    writeBitBE(value: number, bits: number, unsigned?: boolean): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitLE(value: number, bits: number): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns number
     */
    writeBitLE(value: number, bits: number, unsigned?: boolean): void;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readBit(bits?: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitBE(bits: number): number;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitBE(bits: number, unsigned?: boolean): number;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitLE(bits: number): number;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitLE(bits: number, unsigned?: boolean): number;
    /**
     * Read byte.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number}
     */
    readByte(unsigned?: boolean): number;
    /**
     * Read multiple bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number[]}
     */
    readBytes(amount: number, unsigned?: boolean): number[];
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeByte(value: number, unsigned?: boolean): void;
    /**
     * Write multiple bytes.
     *
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeBytes(values: number[], unsigned?: boolean): void;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    writeUByte(value: number): void;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    readUByte(): number;
    /**
     * Read short.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt16(unsigned?: boolean, endian?: endian): number;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt16(value: number, unsigned?: boolean, endian?: endian): void;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value: number, endian?: endian): void;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16BE(value: number): void;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16LE(value: number): void;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    writeInt16LE(value: number): void;
    /**
     * Read unsigned short.
     *
     * @param {endian} endian - ``big`` or ``little``
     *
     * @returns {number}
     */
    readUInt16(endian?: endian): number;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    readUInt16LE(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    readInt16LE(): number;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    readUInt16BE(): number;
    /**
    * Read signed short in big endian.
    *
    * @returns {number}
    */
    readInt16BE(): number;
    /**
     * Read half float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readHalfFloat(endian?: endian): number;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeHalfFloat(value: number, endian?: endian): void;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatBE(value: number): void;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatLE(value: number): void;
    /**
    * Read half float.
    *
    * @returns {number}
    */
    readHalfFloatBE(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    readHalfFloatLE(): number;
    /**
     * Read 32 bit integer.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt32(unsigned?: boolean, endian?: endian): number;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt32(value: number, unsigned?: boolean, endian?: endian): void;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value: number, endian?: endian): void;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32LE(value: number): void;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32LE(value: number): void;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32BE(value: number): void;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32BE(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    readUInt32BE(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32LE(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readUInt32LE(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    readUInt(): number;
    /**
     * Read float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat(endian?: endian): number;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat(value: number, endian?: endian): void;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    writeFloatLE(value: number): void;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    writeFloatBE(value: number): void;
    /**
     * Read float.
     *
     * @returns {number}
     */
    readFloatBE(): number;
    /**
     * Read float.
     *
     * @returns {number}
     */
    readFloatLE(): number;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian?} endian - ``big`` or ``little``
     * @returns {BigValue}
     */
    readInt64(unsigned?: boolean, endian?: endian): BigValue;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt64(value: BigValue, unsigned?: boolean, endian?: endian): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt64(value: BigValue, endian?: endian): void;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeInt64LE(value: BigValue): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64LE(value: BigValue): void;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeInt64BE(value: BigValue): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64BE(value: BigValue): void;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readUInt64(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readInt64BE(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readUInt64BE(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readInt64LE(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readUInt64LE(): BigValue;
    /**
     * Read double float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian?: endian): number;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value: number, endian?: endian): void;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatBE(value: number): void;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatLE(value: number): void;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    readDoubleFloatBE(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    readDoubleFloatLE(): number;
    /**
    * Reads string, use options object for different types.
    *
    * @param {stringOptions} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    * @return {Promise<string>}
    */
    readString(options?: stringOptions): string;
    /**
    * Writes string, use options object for different types.
    *
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    */
    writeString(string: string, options?: stringOptions): void;
}

/**
 * Binary reader, includes bitfields and strings.
 *
 * @param {string} filePath - Path to file
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 *
 * @since 3.1
 */
declare class BiReaderStream extends BiBaseStreamer {
    /**
     * Binary reader, includes bitfields and strings.
     *
     * Note: Must start with .open() before reading.
     *
     * @param {string} filePath - Path to file
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     */
    constructor(filePath: string, options?: BiOptions);
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    bit(bits: number, unsigned?: boolean, endian?: endian): number;
    /**
     * Bit field reader. Unsigned read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(bits: number, endian?: endian): number;
    /**
     * Bit field reader. Unsigned big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitbe(bits: number): number;
    /**
     * Bit field reader. Big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitbe(bits: number, unsigned?: boolean): number;
    /**
     * Bit field reader. Unsigned little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitle(bits: number): number;
    /**
     * Bit field reader. Little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitle(bits: number, unsigned?: boolean): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1le(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1be(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1le(): number;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1be(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2le(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2be(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2le(): number;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2be(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3le(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3be(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3le(): number;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3be(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4le(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4be(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4le(): number;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4be(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5le(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5be(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5le(): number;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5be(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6le(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6be(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6le(): number;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6be(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7le(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7be(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7le(): number;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7be(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8le(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8be(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8le(): number;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8be(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9le(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9be(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9le(): number;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9be(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10le(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10be(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10le(): number;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10be(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11le(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11be(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11le(): number;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11be(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12le(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12be(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12le(): number;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12be(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13le(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13be(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13le(): number;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13be(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14le(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14be(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14le(): number;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14be(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15le(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15be(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15le(): number;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15be(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16le(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16be(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16le(): number;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16be(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17le(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17be(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17le(): number;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17be(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18le(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18be(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18le(): number;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18be(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19le(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19be(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19le(): number;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19be(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20le(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20be(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20le(): number;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20be(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21le(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21be(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21le(): number;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21be(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22le(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22be(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22le(): number;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22be(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23le(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23be(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23le(): number;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23be(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24le(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24be(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24le(): number;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24be(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25le(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25be(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25le(): number;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25be(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26le(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26be(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26le(): number;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26be(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27le(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27be(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27le(): number;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27be(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28le(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28be(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28le(): number;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28be(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29le(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29be(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29le(): number;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29be(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30le(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30be(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30le(): number;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30be(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31le(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31be(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31le(): number;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31be(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32le(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32be(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32le(): number;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32be(): number;
    /**
     * Read byte.
     *
     * @returns {number}
     */
    get byte(): number;
    /**
     * Read byte.
     *
     * @returns {number}
     */
    get int8(): number;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    get uint8(): number;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    get ubyte(): number;
    /**
     * Read short.
     *
     * @returns {number}
     */
    get int16(): number;
    /**
     * Read short.
     *
     * @returns {number}
     */
    get short(): number;
    /**
     * Read short.
     *
     * @returns {number}
     */
    get word(): number;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get uint16(): number;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get ushort(): number;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get uword(): number;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get uint16le(): number;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get ushortle(): number;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get uwordle(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get int16le(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get shortle(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get wordle(): number;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get uint16be(): number;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get ushortbe(): number;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get uwordbe(): number;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get int16be(): number;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get shortbe(): number;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get wordbe(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloat(): number;
    /**
     * Read half float
     *
     * @returns {number}
     */
    get half(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloatbe(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halfbe(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloatle(): number;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halfle(): number;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get int(): number;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get double(): number;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get int32(): number;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get long(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get udouble(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint32(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get ulong(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get intbe(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get doublebe(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get int32be(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get longbe(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uintbe(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get udoublebe(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint32be(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get ulongbe(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get intle(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get doublele(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get int32le(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get longle(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get uintle(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get udoublele(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get uint32le(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get ulongle(): number;
    /**
     * Read float.
     *
     * @returns {number}
     */
    get float(): number;
    /**
     * Read float.
     *
     * @returns {number}
     */
    get floatbe(): number;
    /**
     * Read float.
     *
     * @returns {number}
     */
    get floatle(): number;
    /**
     * Read signed 64 bit integer
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get int64(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get bigint(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get quad(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uint64(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get ubigint(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uquad(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get int64be(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get bigintbe(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get quadbe(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uint64be(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get ubigintbe(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uquadbe(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get int64le(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get bigintle(): BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get quadle(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uint64le(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get ubigintle(): BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    get uquadle(): BigValue;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloat(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloat(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloatbe(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloatbe(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloatle(): number;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloatle(): number;
    /**
    * Reads string, use options object for different types.
    *
    * @param {stringOptions} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["stripNull"]?} options.stripNull - removes 0x00 characters
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    * @return {string}
    */
    string(options?: stringOptions): string;
    /**
    * Reads string using setting from .strSettings
    *
    * Default is ``utf-8``
    *
    * @return {string}
    */
    get str(): string;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    utf8string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads ANSI string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    utf16string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring1le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring1be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring2le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring2be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring4le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    pstring4be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide-Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide-Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide-Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    wpstring2le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    wpstring2be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide-Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @return {string}
    */
    wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    wpstring4be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @return {string}
    */
    wpstring4le(stripNull?: stringOptions["stripNull"]): string;
}

/**
 * Binary writer, includes bitfields and strings.
 *
 * Note: Must start with .open() before writing.
 *
 * @param {string} filePath - Path to file
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 *
 * @since 3.1
 */
declare class BiWriterStream extends BiBaseStreamer {
    /**
     * Binary writer, includes bitfields and strings.
     *
     * Note: Must start with .open() before writing.
     *
     * @param {string} filePath - Path to file
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     */
    constructor(filePath: string, options?: BiOptions);
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    bit(value: number, bits: number, unsigned?: boolean, endian?: endian): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(value: number, bits: number, endian?: endian): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitbe(value: number, bits: number, unsigned?: boolean): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitbe(value: number, bits: number): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitle(value: number, bits: number): void;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitle(value: number, bits: number, unsigned?: boolean): void;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1le(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1be(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1le(value: number);
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1be(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2le(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2be(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2le(value: number);
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2be(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3le(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3be(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3le(value: number);
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3be(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4le(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4be(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4le(value: number);
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4be(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5le(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5be(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5le(value: number);
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5be(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6le(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6be(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6le(value: number);
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6be(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7le(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7be(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7le(value: number);
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7be(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8le(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8be(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8le(value: number);
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8be(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9le(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9be(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9le(value: number);
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9be(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10le(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10be(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10le(value: number);
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10be(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11le(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11be(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11le(value: number);
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11be(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12le(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12be(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12le(value: number);
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12be(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13le(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13be(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13le(value: number);
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13be(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14le(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14be(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14le(value: number);
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14be(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15le(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15be(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15le(value: number);
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15be(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16le(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16be(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16le(value: number);
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16be(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17le(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17be(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17le(value: number);
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17be(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18le(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18be(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18le(value: number);
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18be(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19le(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19be(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19le(value: number);
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19be(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20le(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20be(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20le(value: number);
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20be(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21le(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21be(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21le(value: number);
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21be(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22le(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22be(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22le(value: number);
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22be(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23le(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23be(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23le(value: number);
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23be(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24le(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24be(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24le(value: number);
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24be(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25le(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25be(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25le(value: number);
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25be(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26le(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26be(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26le(value: number);
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26be(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27le(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27be(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27le(value: number);
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27be(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28le(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28be(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28le(value: number);
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28be(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29le(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29be(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29le(value: number);
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29be(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30le(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30be(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30le(value: number);
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30be(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31le(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31be(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31le(value: number);
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31be(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32le(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32be(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32le(value: number);
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32be(value: number);
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    set byte(value: number);
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    set int8(value: number);
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    set uint8(value: number);
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    set ubyte(value: number);
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set int16(value: number);
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set short(value: number);
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set word(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushort(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uword(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set int16be(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set shortbe(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set wordbe(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16be(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushortbe(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uwordbe(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set int16le(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set shortle(value: number);
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set wordle(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16le(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushortle(value: number);
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uwordle(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set half(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloat(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloatbe(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halfbe(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloatle(value: number);
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halfle(value: number);
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set int(value: number);
    /**
    * Write int32.
    *
    * @param {number} value - value as int
    */
    set int32(value: number);
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set double(value: number);
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set long(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint(value: number);
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    set udouble(value: number);
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    set ulong(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set int32le(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set intle(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set doublele(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set longle(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32le(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uintle(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set udoublele(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongle(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set intbe(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set int32be(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set doublebe(value: number);
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set longbe(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set writeUInt32BE(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32be(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uintbe(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set udoublebe(value: number);
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongbe(value: number);
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    set float(value: number);
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    set floatle(value: number);
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    set floatbe(value: number);
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64(value: BigValue);
    /**
    * Write 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    set quad(value: BigValue);
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigint(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigint(value: BigValue);
    /**
    * Write unsigned 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    set uquad(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64le(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigintle(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set quadle(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64le(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigintle(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uquadle(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64be(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigintbe(value: BigValue);
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set quadbe(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64be(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigintbe(value: BigValue);
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uquadbe(value: BigValue);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloat(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloat(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloatbe(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloatbe(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloatle(value: number);
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloatle(value: number);
    /**
    * Writes string, use options object for different types.
    *
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    */
    string(string: string, options?: stringOptions): void;
    /**
    * Writes string using setting from .strSettings
    *
    * Default is ``utf-8``
    *
    * @param {string} string - text string
    */
    set str(string: string);
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf8string(string: string, length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    cstring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes ANSI string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    ansistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf16string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    unistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void;
    /**
    * Writes Pascal string 1 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring1le(string: string): void;
    /**
    * Writes Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring1be(string: string): void;
    /**
    * Writes Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring2(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring2le(string: string): void;
    /**
    * Writes Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring2be(string: string): void;
    /**
    * Writes Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring4(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring4be(string: string): void;
    /**
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring4le(string: string): void;
    /**
    * Writes Wide-Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide-Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void;
    /**
    * Writes Wide-Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void;
    /**
    * Writes Wide-Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring1(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring1be(string: string): void;
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring1le(string: string): void;
    /**
    * Writes Wide-Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring2(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring2le(string: string): void;
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring2be(string: string): void;
    /**
    * Writes Wide-Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring4(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring4le(string: string): void;
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring4be(string: string): void;
}

/**
 * Not in use anymore.
 * @since 3.0
 * @deprecated Use ``BiReader`` instead.
 */
declare class bireader {
    constructor();
}
/**
 * Not in use anymore.
 * @since 3.0
 * @deprecated Use ``BiWriter`` instead.
 */
declare class biwriter {
    constructor();
}

export { BiReader, BiReaderStream, BiWriter, BiWriterStream, bireader, biwriter, hexdump };
