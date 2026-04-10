type endian = "little" | "big";
type BigValue = number | bigint;
type ReturnMapping<DataType> = DataType extends string | Buffer ? Buffer : Uint8Array;
type ReturnBigValueMapping<alwaysBigInt> = alwaysBigInt extends true ? bigint : BigValue;
type BiOptions<alwaysBigInt> = {
    /**
     * Byte offset to start, default is 0
     */
    byteOffset?: number;
    /**
     *  Bit offset within the byte to start (0 - 7), default is 0
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
     * Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     */
    growthIncrement?: number;
    /**
     * When reading a 64 bit value, the reader checks if the value is safe for a ``number`` type and convert it.
     *
     * Set this to ``true`` if you wish for it to always stay a ``BigInt``.
     */
    enforceBigInt?: alwaysBigInt;
    /**
     * If you want to prevent write operations
     */
    readOnly?: boolean;
    /**
     * For Async classes. Sets the chunk size to read on each wait cycle. Set to 0 for full file on first read.
     */
    windowSize?: number;
};
type stringOptions = {
    /**
     * for fixed length (in units NOT btyes), non-terminate value utf strings
     */
    length?: number;
    /**
     * ascii, utf-8, utf-16, utf-32, pascal or wide-pascal
     *
     * - `ascii` & `utf-8` are single byte strings with a null terminator
     * - `utf-16` is a 2 byte string with a null terminator
     * - `utf-32` is a 4 byte string with a null terminator
     * - `pascal` is a single byte fixed length string with the first value being its length. Size of the length value is set in `lengthReadSize`
     * - `wide-pascal` is a 2 byte fixed length string with the first value being its length. Size of the length value is set in `lengthReadSize`
     * - `double-wide-pascal` is a 4 byte fixed length string with the first value being its length. Size of the length value is set in `lengthReadSize`
     */
    stringType?: "ascii" | "utf-8" | "utf-16" | "utf-32" | "pascal" | "wide-pascal" | "double-wide-pascal";
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
     * for wide-pascal, utf-16, utf-32
     */
    endian?: "big" | "little";
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

/**
 * @file BiReader / Writer base for working in sync Buffers or full file reads. Node and Browser.
 */

/**
 * Base class for BiReader and BiWriter
 */
declare class BiBase<DataType, alwaysBigInt> {
    #private;
    /**
     * Endianness of default read.
     * @type {endian}
     */
    endian: endian;
    /**
     * Size in bytes of the current buffer.
     */
    size: number;
    /**
     * Size in bits of the current buffer.
     */
    bitSize: number;
    /**
     * Stops the buffer extending on reading or writing outside of current size
     */
    strict: boolean;
    /**
     * Console log a hexdump on error.
     */
    errorDump: boolean;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     *
     * Otherwise it extends just the amount of the next written value.
     *
     * This can greatly speed up data writes when large files are being written.
     *
     * NOTE: Using ``BiWriter.get`` or ``BiWriter.return`` will now remove all data after the current write position. Use ``BiWriter.data`` to get the full buffer instead.
     */
    growthIncrement: number;
    /**
     * Open file description
     */
    fd: number;
    /**
     * Current file path
     */
    filePath: string;
    /**
     * File write mode
     */
    fsMode: "r+" | "r";
    /**
     * The settings that used when using the .str getter / setter
     */
    strDefaults: stringOptions;
    /**
     * All int64 reads will return as bigint type
     */
    enforceBigInt: alwaysBigInt;
    /**
     * Not using a file reader.
     */
    isMemoryMode: boolean;
    /**
     * If data can not be written to the buffer.
     */
    readOnly: boolean;
    /**
     * Get the current buffer data.
     *
     * @type {ReturnMapping<DataType>}
     */
    get data(): ReturnMapping<DataType>;
    /**
     * Set the current buffer data.
     *
     * @param {DataType} data
     */
    set data(data: DataType);
    wasExpanded: boolean;
    /**
     * Get the DataView of current buffer data.
     */
    get view(): DataView<ArrayBufferLike>;
    constructor(input?: DataType, options?: BiOptions<alwaysBigInt>);
    /**
     * Settings for when using .str
     *
     * @param {stringOptions} settings options to use with .str
     */
    set strSettings(settings: stringOptions);
    /**
     * Checks if obj is an Uint8Array or a Buffer
     */
    isBufferOrUint8Array(obj: any): obj is Buffer | Uint8Array;
    /**
     * Checks if obj is a Buffer
     */
    isBuffer(obj: any): obj is Buffer;
    /**
     * Checks if obj is an Uint8Array
     */
    isUint8Array(obj: any): obj is Uint8Array;
    /**
     * Enables writing and expanding (changes strict AND readonly)
     *
     * @param {boolean} mode - True to enable writing and expanding (changes strict AND readonly)
     */
    writeMode(mode?: boolean): void;
    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     *
     * Can be used to pass new data to a loaded class, shifting to memory mode.
     */
    open(data?: ReturnMapping<DataType>): void;
    /**
     * commit data and removes it.
     */
    close(): ReturnMapping<DataType>;
    /**
     * Write data buffer back to file
     */
    commit(): ReturnMapping<DataType>;
    /**
     * syncs the data to file
     */
    flush(): void;
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
     * Note: This is permanent and can't be undone.
     *
     * It doesn't send the file to the recycling bin for recovery.
     */
    deleteFile(): void;
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
     *  @returns {number} size
     */
    get fileSize(): number;
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
    get lengthBits(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get sizeBits(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get fileBitSize(): number;
    /**
     * Size in bytes of the current buffer.
     *
     *  @returns {number} size
     */
    get fileSizeBits(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lenBits(): number;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get offset(): number;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get off(): number;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get getOffset(): number;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get tell(): number;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get FTell(): number;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get saveOffset(): number;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get byteOffset(): number;
    /**
     * Set the current byte position.
     *
     * Same as {@link goto}
     */
    set offset(value: number);
    /**
     * Set the current byte position.
     *
     * Same as {@link goto}
     */
    set setOffset(value: number);
    /**
     * Set the current byte position.
     *
     * Same as {@link goto}
     */
    set setByteOffset(value: number);
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get bitOffset(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offsetBits(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get getBitOffset(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get saveBitOffset(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get FTellBits(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get tellBits(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offBits(): number;
    /**
     * Set the current bit position.
     *
     * Same as {@link goto}
     */
    set bitOffset(value: number);
    /**
     * Set the current bit position.
     */
    set setOffsetBits(value: number);
    /**
     * Set the current bit position.
     */
    set setBitOffset(value: number);
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get insetBit(): number;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get getInsetBit(): number;
    /**
     * Set the current bit position with in the current byte (0-7).
     */
    set insetBit(value: number);
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get saveInsetBit(): number;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get inBit(): number;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get bitTell(): number;
    /**
     * Set the current bit position with in the byte (0-7).
     */
    set setInsetBit(value: number);
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remain(): number;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remainBytes(): number;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get FEoF(): number;
    /**
     * Size in bits of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remainBits(): number;
    /**
     * Size in bits of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get FEoFBits(): number;
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
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    get(): ReturnMapping<DataType>;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    getFullBuffer(): ReturnMapping<DataType>;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    return(): ReturnMapping<DataType>;
    /**
     * Returns and remove data.
     *
     * Commits any changes to file when editing a file.
     */
    end(): ReturnMapping<DataType>;
    /**
     * removes data.
     *
     * Commits any changes to file when editing a file.
     */
    done(): ReturnMapping<DataType>;
    /**
     * removes data.
     *
     * Commits any changes to file when editing a file.
     */
    finished(): ReturnMapping<DataType>;
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
     * Searches for position of array of byte values from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {Uint8Array | Buffer | Array<number>} bytesToFind
     */
    findBytes(bytesToFind: Uint8Array | Buffer | Array<number>): number;
    /**
     * Searches for byte position of string from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {string} string - String to search for.
     * @param {1|2|4} bytesPerChar - how many bytes each character should take up
     */
    findString(string: string, bytesPerChar?: number): number;
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
    goto(byte?: number, bit?: number): void;
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
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): DataType;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    clip(): DataType;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    trim(): DataType;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    crop(length?: number, consume?: boolean): DataType;
    /**
     * Deletes part of data from current position to supplied length, returns removed.
     *
     * Note: Only works in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    drop(length?: number, consume?: boolean): DataType;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode if past end of data.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {number} offset - Offset to add it at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default false)
     */
    replace(data: ReturnMapping<DataType>, offset?: number, consume?: boolean): void;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {number} offset - Offset to add it at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default false)
     */
    overwrite(data: ReturnMapping<DataType>, offset?: number, consume?: boolean): void;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): DataType;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): DataType;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    extract(length?: number, consume?: boolean): DataType;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    slice(length?: number, consume?: boolean): DataType;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    wrap(length?: number, consume?: boolean): DataType;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    insert(data: ReturnMapping<DataType>, offset?: number, consume?: boolean): void;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    place(data: ReturnMapping<DataType>, offset?: number, consume?: boolean): void;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data: ReturnMapping<DataType>, consume?: boolean): void;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data: ReturnMapping<DataType>, consume?: boolean): void;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data: ReturnMapping<DataType>, consume?: boolean): void;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data: ReturnMapping<DataType>, consume?: boolean): void;
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
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    and(andKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    add(addKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
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
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShift(shiftKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShift(shiftKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readBit(bits?: number, unsigned?: boolean, endian?: endian, consume?: boolean): number;
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
    readBitBE(bits: number, unsigned?: boolean): number;
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
     *
     * Write bits, must have at least value and number of bits.
     *
     * ``Note``: When returning to a byte write, remaining bits are skipped.
     *
     * @param {number} value - value as int
     * @param {number} bits - number of bits to write
     * @param {boolean} unsigned - if value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: endian, consume?: boolean): void;
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
    writeBitBE(value: number, bits: number, unsigned?: boolean): void;
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
     * Read byte.
     *
     * @param {boolean} unsigned - if the value is unsigned or not
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readByte(unsigned?: boolean, consume?: boolean): number;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    readUByte(): number;
    /**
     * Read multiple bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {boolean} consume - move offset after read
     * @returns {number[]}
     */
    readBytes(amount: number, unsigned?: boolean, consume?: boolean): number[];
    /**
     * Read multiple unsigned bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} consume - move offset after read
     * @returns {number[]}
     */
    readUBytes(amount: number, consume?: boolean): number[];
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    writeByte(value: number, unsigned?: boolean, consume?: boolean): void;
    /**
     * Write multiple bytes.
     *
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    writeBytes(values: number[], unsigned?: boolean, consume?: boolean): void;
    /**
     * Write multiple unsigned bytes.
     *
     * @param {number[]} values - array of values as int
     * @param {boolean} consume - move offset after write
     */
    writeUBytes(values: number[], consume?: boolean): void;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    writeUByte(value: number): void;
    /**
     * Read short.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readInt16(unsigned?: boolean, endian?: endian, consume?: boolean): number;
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
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    readUInt16BE(): number;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    readInt16LE(): number;
    /**
    * Read signed short in big endian.
    *
    * @returns {number}
    */
    readInt16BE(): number;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt16(value: number, unsigned?: boolean, endian?: endian, consume?: boolean): void;
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
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    writeInt16BE(value: number): void;
    /**
     * Read 16 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readHalfFloat(endian?: endian, consume?: boolean): number;
    /**
     * Read 16 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readFloat16(endian?: endian, consume?: boolean): number;
    /**
    * Read 16 bit float.
    *
    * @returns {number}
    */
    readHalfFloatBE(): number;
    /**
    * Read 16 bit float.
    *
    * @returns {number}
    */
    readFloat16BE(): number;
    /**
     * Read 16 bit float.
     *
     * @returns {number}
     */
    readHalfFloatLE(): number;
    /**
     * Read 16 bit float.
     *
     * @returns {number}
     */
    readFloat16LE(): number;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeHalfFloat(value: number, endian?: endian, consume?: boolean): void;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeFloat16(value: number, endian?: endian, consume?: boolean): void;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatBE(value: number): void;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat16BE(value: number): void;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatLE(value: number): void;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat16LE(value: number): void;
    /**
     * Read 32 bit integer.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readInt32(unsigned?: boolean, endian?: endian, consume?: boolean): number;
    /**
     * Read signed 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt(endian?: endian): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32BE(): number;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32LE(): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readUInt32(endian?: endian): number;
    /**
     * Read unsigned 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readUInt(endian?: endian): number;
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
    readUInt32LE(): number;
    /**
     * Write 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt32(value: number, unsigned?: boolean, endian?: endian, consume?: boolean): void;
    /**
     * Write signed 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt(value: number, endian?: endian): void;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32LE(value: number): void;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32BE(value: number): void;
    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt(value: number, endian?: endian): void;
    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value: number, endian?: endian): void;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32BE(value: number): void;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32LE(value: number): void;
    /**
     * Read 32 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readFloat(endian?: endian, consume?: boolean): number;
    /**
     * Read 32 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readFloat32(endian?: endian, consume?: boolean): number;
    /**
     * Read 32 bit float.
     *
     * @returns {number}
     */
    readFloatBE(): number;
    /**
     * Read 32 bit float.
     *
     * @returns {number}
     */
    readFloat32BE(): number;
    /**
     * Read 32 bit float.
     *
     * @returns {number}
     */
    readFloatLE(): number;
    /**
     * Read 32 bit float.
     *
     * @returns {number}
     */
    readFloat32LE(): number;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeFloat(value: number, endian?: endian, consume?: boolean): void;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloatLE(value: number): void;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat32LE(value: number): void;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat32BE(value: number): void;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloatBE(value: number): void;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readInt64(unsigned?: boolean, endian?: endian, consume?: boolean): ReturnBigValueMapping<alwaysBigInt>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64(): ReturnBigValueMapping<alwaysBigInt>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readInt64BE(): ReturnBigValueMapping<alwaysBigInt>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readInt64LE(): ReturnBigValueMapping<alwaysBigInt>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64BE(): ReturnBigValueMapping<alwaysBigInt>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64LE(): ReturnBigValueMapping<alwaysBigInt>;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt64(value: BigValue, unsigned?: boolean, endian?: endian, consume?: boolean): void;
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
    writeUInt64LE(value: BigValue): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64BE(value: BigValue): void;
    /**
     * Read 64 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian?: endian, consume?: boolean): number;
    /**
     * Read 64 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat64(endian?: endian): number;
    /**
     * Read 64 bit float.
     *
     * @returns {number}
     */
    readDoubleFloatBE(): number;
    /**
     * Read 64 bit float.
     *
     * @returns {number}
     */
    readFloat64BE(): number;
    /**
     * Read 64 bit float.
     *
     * @returns {number}
     */
    readDoubleFloatLE(): number;
    /**
     * Read 64 bit float.
     *
     * @returns {number}
     */
    readFloat64LE(): number;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value: number, endian?: endian, consume?: boolean): void;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat64(value: number, endian?: endian): void;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatBE(value: number): void;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat64BE(value: number): void;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatLE(value: number): void;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat64LE(value: number): void;
    /**
    * Reads string, use options object for different types.
    *
    * @param {stringOptions} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings (in units NOT bytes)
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal, double-wide-pascal and utf-16, utf-32
    * @param {boolean} consume - move offset after read
    * @returns {string}
    */
    readString(options?: stringOptions, consume?: boolean): string;
    /**
    * Writes string, use options object for different types.
    *
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal, double-wide-pascal and utf-16, utf-32
    * @param {boolean} consume - move offset after write
    */
    writeString(string: string, options?: stringOptions, consume?: boolean): void;
}

/**
 * Binary reader, includes bitfields and strings.
 *
 * @param {DataType} input - File path or a `Buffer` or `Uint8Array`. Always found in .{@link data}
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
 * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
 * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
 * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
 * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
 * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
 * @param {BiOptions["readOnly"]?} [options.readOnly = true] - Allow data writes when reading a file (default `true` in reader)
 *
 * @since 2.0
 */
declare class BiReader<DataType, alwaysBigInt> extends BiBase<DataType, alwaysBigInt> {
    constructor(input: DataType, options?: BiOptions<alwaysBigInt>);
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
     */
    get int64(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get bigint(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get quad(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uint64(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get ubigint(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uquad(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get int64be(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get bigintbe(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get quadbe(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uint64be(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get ubigintbe(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uquadbe(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get int64le(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get bigintle(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get quadle(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uint64le(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get ubigintle(): alwaysBigInt extends true ? bigint : BigValue;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uquadle(): alwaysBigInt extends true ? bigint : BigValue;
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
    * @param {stringOptions["stringType"]?} options.stringType - ascii, utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["stripNull"]?} options.stripNull - removes 0x00 characters
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for utf-16, utf-32, wide-pascal or double-wide-pascal
    * @returns {string}
    */
    string(options?: stringOptions): string;
    /**
    * Reads string using setting from .strDefaults
    *
    * Default is ``utf-8``
    *
    * @returns {string}
    */
    get str(): string;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf8string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads ANSI string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads latin1 string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    latin1tring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
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
    * @returns {string}
    */
    unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-32 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    utf32string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads UTF-32 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf32stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads UTF-32 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf32stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring1le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring1be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring2le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring2be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring4le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring4be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring1le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring1be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring2le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring2be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring4le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring4be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Double Wide Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    dwpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Double Wide Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    dwpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Double Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring1le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Double WidePascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring1be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Double Wide Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    dwpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Double Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring2le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Double Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring2be(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Double Wide Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    dwpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string;
    /**
    * Reads Double Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring4le(stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Double Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring4be(stripNull?: stringOptions["stripNull"]): string;
}

/**
 * Binary writer, includes bitfields and strings.
 *
 * @param {DataType} input - File path or a `Buffer` or `Uint8Array`. Always found in .{@link data}
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
 * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
 * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
 * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
 * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
 * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
 *
 * @since 2.0
 */
declare class BiWriter<DataType, alwaysBigInt> extends BiBase<DataType, alwaysBigInt> {
    constructor(input?: DataType, options?: BiOptions<alwaysBigInt>);
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
    * @param {stringOptions["stringType"]?} options.stringType - ascii, utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for utf-16, utf-32, wide-pascal or double-wide-pascal
    */
    string(string: string, options?: stringOptions): void;
    /**
    * Writes string using setting from .strDefaults
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
    * Writes latin1 string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    latin1string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
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
    * Writes UTF-32 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf32string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void;
    /**
    * Writes UTF-32 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf32stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
    /**
    * Writes UTF-32 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf32stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void;
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
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring4le(string: string): void;
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring4be(string: string): void;
    /**
    * Writes Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void;
    /**
    * Writes Wide Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void;
    /**
    * Writes Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring1(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring1le(string: string): void;
    /**
    * Writes Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring1be(string: string): void;
    /**
    * Writes Wide Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring2(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring2le(string: string): void;
    /**
    * Writes Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring2be(string: string): void;
    /**
    * Writes Wide Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring4(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring4le(string: string): void;
    /**
    * Writes Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring4be(string: string): void;
    /**
    * Writes Double Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void;
    /**
    * Writes Double Wide Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    dwpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void;
    /**
    * Writes Double Wide Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    dwpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void;
    /**
    * Writes Double Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring1(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Double Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring1le(string: string): void;
    /**
    * Writes Double Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring1be(string: string): void;
    /**
    * Writes Double Wide Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring2(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Double Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring2le(string: string): void;
    /**
    * Writes Double Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring2be(string: string): void;
    /**
    * Writes Double Wide Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring4(string: string, endian?: stringOptions["endian"]): void;
    /**
    * Writes Double Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring4le(string: string): void;
    /**
    * Writes Double Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring4be(string: string): void;
}

/**
 * @file BiReaderAsync / Writer base for working in sync Buffers or full file reads. Node and Browser.
 */

/**
 * Base class for BiReader and BiWriter
 */
declare class BiBaseAsync<DataType, alwaysBigInt> {
    #private;
    /**
     * Endianness of default read.
     * @type {endian}
     */
    endian: endian;
    /**
     * Size in bytes of the current buffer.
     */
    size: number;
    /**
     * Size in bits of the current buffer.
     */
    bitSize: number;
    /**
     * Allows the buffer to extend reading or writing outside of current size
     */
    strict: boolean;
    /**
     * Console log a hexdump on error.
     */
    errorDump: boolean;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     *
     * Otherwise it extends just the amount of the next written value.
     *
     * This can greatly speed up data writes when large files are being written.
     *
     * NOTE: Using ``BiWriterAsync.get`` or ``BiWriterAsync.return`` will now remove all data after the current write position. Use ``BiWriterAsync.data`` to get the full buffer instead.
     */
    growthIncrement: number;
    /**
     * Open file handle
     */
    fd: any;
    /**
     * Current file path
     */
    filePath: string;
    /**
     * File write mode
     */
    fsMode: "r+" | "r";
    /**
     * The settings that used when using the .str getter / setter
     */
    strDefaults: stringOptions;
    /**
     * All int64 reads will return as bigint type
     */
    enforceBigInt: alwaysBigInt;
    /**
     * Not using a file reader.
     */
    isMemoryMode: boolean;
    /**
     * If data can not be written to the buffer.
     */
    readOnly: boolean;
    /**
     * Get the current buffer data.
     *
     * Use async {@link getData} while in file mode!
     */
    get data(): ReturnMapping<DataType>;
    /**
     * Get the current buffer data.
     *
     * For use in file mode!
     */
    getData(): Promise<ReturnMapping<DataType> | Buffer<ArrayBuffer>>;
    /**
     * Set the current buffer data.
     */
    set data(data: DataType);
    /**
     * If the buffer was extended and needs to be trimmed
     */
    wasExpanded: boolean;
    /**
     * Get the DataView of current buffer data.
     */
    get view(): DataView<ArrayBufferLike>;
    /**
     * array of loaded data chunks
     */
    chunks: ReturnMapping<DataType>[];
    /**
     * Promises for data chunks
     */
    chunkPromises: Promise<ReturnMapping<DataType>>[];
    /**
     * Edited data chunks
     */
    dirtyChunks: Set<number>;
    /**
     * The amount of data to "chunk" and read a time from the file
     *
     * When set to 0, reads whole file at once.
     */
    windowSize: number;
    /**
     * Data is finished loading
     */
    isFullyLoaded: boolean;
    /**
     * Array of all chunks to quickly load all parts
     */
    loadAllPromise: Promise<void>;
    constructor(input: DataType, options?: BiOptions<alwaysBigInt>);
    /**
     * Settings for when using .str
     *
     * @param {stringOptions} settings options to use with .str
     */
    set strSettings(settings: stringOptions);
    /**
     * Checks if obj is an Uint8Array or a Buffer
     */
    isBufferOrUint8Array(obj: any): obj is Buffer | Uint8Array;
    /**
     * Checks if obj is a Buffer
     */
    isBuffer(obj: any): obj is Buffer;
    /**
     * Checks if obj is an Uint8Array
     */
    isUint8Array(obj: any): obj is Uint8Array;
    /**
     * Enables writing and expanding (changes strict AND readOnly)
     *
     * @param {boolean} mode - True to enable writing and expanding (changes strict AND readOnly)
     */
    writeMode(mode?: boolean): Promise<void>;
    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     *
     * Can be used to pass new data to a loaded class, shifting to memory mode.
     */
    open(data?: DataType): Promise<void>;
    /**
     * commit data and removes it.
     */
    close(): Promise<ReturnMapping<DataType>>;
    /**
     * Write data buffer back to file
     */
    commit(): Promise<void>;
    /**
     * Write data buffer back to file
     */
    flush(): Promise<void>;
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
    renameFile(newFilePath: string): Promise<void>;
    /**
     * Deletes the working file.
     *
     * Note: This is permanent and can't be undone.
     *
     * It doesn't send the file to the recycling bin for recovery.
     */
    deleteFile(): Promise<void>;
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
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get sizeBits(): number;
    /**
     * Size in bytes of the current buffer.
     *
     *  @returns {number} size
     */
    get fileSize(): number;
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
    get lengthBits(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get fileBitSize(): number;
    /**
     * Size in bytes of the current buffer.
     *
     *  @returns {number} size
     */
    get fileSizeBits(): number;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lenBits(): number;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get offset(): number;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get getOffset(): number;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get tell(): number;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get FTell(): number;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get saveOffset(): number;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get off(): number;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get byteOffset(): number;
    /**
     * Set the current byte position.
     *
     * same as {@link goto}
     */
    setOffset(value: number): Promise<void>;
    /**
     * Set the current byte position.
     *
     * same as {@link goto}
     */
    setByteOffset(value: number): Promise<void>;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get bitOffset(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offsetBits(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get getBitOffset(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get saveBitOffset(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get FTellBits(): number;
    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get tellBits(): number;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offBits(): number;
    /**
     * Set the current bit position.
     */
    setOffsetBits(value: number): Promise<void>;
    /**
     * Set the current bit position.
     */
    setBitOffset(value: number): Promise<void>;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get insetBit(): number;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get saveInsetBit(): number;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get inBit(): number;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get bitTell(): number;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get getInsetBit(): number;
    /**
     * Set the current bit position with in the current byte (0-7).
     */
    setInsetBit(value: number): Promise<void>;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remain(): number;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remainBytes(): number;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get FEoF(): number;
    /**
     * Size in bits of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remainBits(): number;
    /**
     * Size in bits of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get FEoFBits(): number;
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
     * Note: Will remove all data after current position if ``growthIncrement`` was set.
     */
    get(): Promise<ReturnMapping<DataType> | Buffer<ArrayBuffer>>;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     *
     * Use ``.data`` instead if you want the full buffer data.
     */
    getFullBuffer(): Promise<ReturnMapping<DataType> | Buffer<ArrayBuffer>>;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set.
     */
    return(): Promise<ReturnMapping<DataType> | Buffer<ArrayBuffer>>;
    /**
     * Removes data.
     *
     * Commits any changes to file when editing a file.
     */
    end(): Promise<void>;
    /**
     * Removes data.
     *
     * Commits any changes to file when editing a file.
     */
    done(): Promise<void>;
    /**
     * Removes data.
     *
     * Commits any changes to file when editing a file.
     */
    finished(): Promise<void>;
    /**
    * Creates hex dump string. Will console log or return string if set in options.
    *
    * @param {object} options
    * @param {hexdumpOptions?} options - hex dump options
    * @param {hexdumpOptions["length"]} options.length - number of bytes to log, default ``192`` or end of data
    * @param {hexdumpOptions["startByte"]} options.startByte - byte to start dump (default ``0``)
    * @param {hexdumpOptions["suppressUnicode"]} options.suppressUnicode - Suppress unicode character preview for even columns.
    * @param {hexdumpOptions["returnString"]} options.returnString - Returns the hex dump string instead of logging it.
    */
    hexdump(options?: hexdumpOptions): Promise<string>;
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
     * Searches for position of array of byte values from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {Uint8Array | Buffer | Array<number>} bytesToFind
     */
    findBytes(bytesToFind: Uint8Array | Buffer | Array<number>): Promise<number>;
    /**
     * Searches for byte position of string from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {string} string - String to search for.
     * @param {1|2|4} bytesPerChar - how many bytes each character should take up
     */
    findString(string: string, bytesPerChar?: number): Promise<number>;
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
    findByte(value: number, unsigned?: boolean, endian?: endian): Promise<number>;
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
    findShort(value: number, unsigned?: boolean, endian?: endian): Promise<number>;
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
    findInt(value: number, unsigned?: boolean, endian?: endian): Promise<number>;
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
    findInt64(value: BigValue, unsigned?: boolean, endian?: endian): Promise<number>;
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
    findHalfFloat(value: number, endian?: endian): Promise<number>;
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
    findFloat(value: number, endian?: endian): Promise<number>;
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
    findDoubleFloat(value: number, endian?: endian): Promise<number>;
    /**
     * Aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    align(number: number): Promise<void>;
    /**
     * Reverse aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    alignRev(number: number): Promise<void>;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    skip(bytes?: number, bits?: number): Promise<void>;
    /**
    * Offset current byte or bit position.
    *
    * Note: Will extend array if strict mode is off and outside of max size.
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    jump(bytes: number, bits?: number): Promise<void>;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    FSeek(byte: number, bit?: number): Promise<void>;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    seek(bytes: number, bits?: number): Promise<void>;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    goto(byte?: number, bit?: number): Promise<void>;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    pointer(byte: number, bit?: number): Promise<void>;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    warp(byte: number, bit?: number): Promise<void>;
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
     */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Promise<DataType>;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     */
    clip(): Promise<DataType>;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     */
    trim(): Promise<DataType>;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     */
    crop(length?: number, consume?: boolean): Promise<DataType>;
    /**
     * Deletes part of data from current position to supplied length, returns removed.
     *
     * Note: Only works in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     */
    drop(length?: number, consume?: boolean): Promise<DataType>;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {number} offset - Offset to add it at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default false)
     */
    replace(data: DataType, offset?: number, consume?: boolean): Promise<ReturnMapping<DataType>>;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    overwrite(data: DataType, consume?: boolean, offset?: number): Promise<ReturnMapping<DataType>>;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Promise<DataType>;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Promise<DataType>;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    extract(length?: number, consume?: boolean): Promise<DataType>;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    slice(length?: number, consume?: boolean): Promise<DataType>;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    wrap(length?: number, consume?: boolean): Promise<DataType>;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    insert(data: DataType, offset?: number, consume?: boolean): Promise<void>;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    place(data: DataType, offset?: number, consume?: boolean): Promise<void>;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data: DataType, consume?: boolean): Promise<void>;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data: DataType, consume?: boolean): Promise<void>;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data: DataType, consume?: boolean): Promise<void>;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data: DataType, consume?: boolean): Promise<void>;
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xor(xorKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void>;
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xorThis(xorKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void>;
    /**
     * OR data
     *
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    or(orKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void>;
    /**
     * OR data.
     *
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void>;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    and(andKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void>;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void>;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    add(addKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void>;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void>;
    /**
     * Not data.
     *
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    not(startOffset?: number, endOffset?: number, consume?: boolean): Promise<void>;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length?: number, consume?: boolean): Promise<void>;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShift(shiftKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void>;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void>;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShift(shiftKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void>;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void>;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readBit(bits?: number, unsigned?: boolean, endian?: endian, consume?: boolean): Promise<number>;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     */
    readUBitBE(bits: number): Promise<number>;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     */
    readUBitLE(bits: number): Promise<number>;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     */
    readBitBE(bits: number, unsigned?: boolean): Promise<number>;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     */
    readBitLE(bits: number, unsigned?: boolean): Promise<number>;
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
     * @param {boolean} consume - move offset after write
     */
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: endian, consume?: boolean): Promise<void>;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitBE(value: number, bits: number): Promise<void>;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitLE(value: number, bits: number): Promise<void>;
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
    writeBitBE(value: number, bits: number, unsigned?: boolean): Promise<void>;
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
    writeBitLE(value: number, bits: number, unsigned?: boolean): Promise<void>;
    /**
     * Read byte.
     *
     * @param {boolean} unsigned - if the value is unsigned or not
     * @param {boolean} consume - move offset after read
     */
    readByte(unsigned?: boolean, consume?: boolean): Promise<number>;
    /**
     * Read unsigned byte.
     */
    readUByte(): Promise<number>;
    /**
     * Read multiple bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {boolean} consume - move offset after read
     */
    readBytes(amount: number, unsigned?: boolean, consume?: boolean): Promise<number[]>;
    /**
     * Read multiple unsigned bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} consume - move offset after read
     */
    readUBytes(amount: number, consume?: boolean): Promise<number[]>;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    writeByte(value: number, unsigned?: boolean, consume?: boolean): Promise<void>;
    /**
     * Write multiple unsigned bytes.
     *
     * @param {number[]} values - array of values as int
     */
    writeUBytes(values: number[]): Promise<void>;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    writeUByte(value: number): Promise<void>;
    /**
     * Read short.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readInt16(unsigned?: boolean, endian?: endian, consume?: boolean): Promise<number>;
    /**
     * Read unsigned short.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    readUInt16(endian?: endian): Promise<number>;
    /**
     * Read unsigned short in little endian.
     */
    readUInt16LE(): Promise<number>;
    /**
     * Read unsigned short in big endian.
     */
    readUInt16BE(): Promise<number>;
    /**
     * Read signed short in little endian.
     */
    readInt16LE(): Promise<number>;
    /**
    * Read signed short in big endian.
    */
    readInt16BE(): Promise<number>;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt16(value: number, unsigned?: boolean, endian?: endian, consume?: boolean): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value: number, endian?: endian): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16BE(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16LE(value: number): Promise<void>;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    writeInt16LE(value: number): Promise<void>;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    writeInt16BE(value: number): Promise<void>;
    /**
     * Read 16 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readHalfFloat(endian?: endian, consume?: boolean): Promise<number>;
    /**
     * Read 16 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readFloat16(endian?: endian, consume?: boolean): Promise<number>;
    /**
    * Read 16 bit float.
    */
    readHalfFloatBE(): Promise<number>;
    /**
    * Read 16 bit float.
    */
    readFloat16BE(): Promise<number>;
    /**
     * Read 16 bit float.
     */
    readHalfFloatLE(): Promise<number>;
    /**
     * Read 16 bit float.
     */
    readFloat16LE(): Promise<number>;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeHalfFloat(value: number, endian?: endian, consume?: boolean): Promise<void>;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeFloat16(value: number, endian?: endian, consume?: boolean): Promise<void>;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatBE(value: number): Promise<void>;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat16BE(value: number): Promise<void>;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatLE(value: number): Promise<void>;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat16LE(value: number): Promise<void>;
    /**
     * Read signed 32 bit integer.
     */
    readInt32(unsigned?: boolean, endian?: endian, consume?: boolean): Promise<number>;
    /**
     * Read signed 32 bit integer.
     */
    readInt(endian?: endian): Promise<number>;
    /**
     * Read signed 32 bit integer.
     */
    readInt32BE(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     */
    readInt32LE(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    readUInt32(endian?: endian): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    readUInt(endian?: endian): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     */
    readUInt32BE(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     */
    readUInt32LE(): Promise<number>;
    /**
     * Write 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt32(value: number, unsigned?: boolean, endian?: endian, consume?: boolean): Promise<void>;
    /**
     * Write signed 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt(value: number, endian?: endian): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32LE(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32BE(value: number): Promise<void>;
    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt(value: number, endian?: endian): Promise<void>;
    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value: number, endian?: endian): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32BE(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32LE(value: number): Promise<void>;
    /**
     * Read 32 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readFloat(endian?: endian, consume?: boolean): Promise<number>;
    /**
     * Read 32 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readFloat32(endian?: endian, consume?: boolean): Promise<number>;
    /**
     * Read 32 bit float.
     */
    readFloatBE(): Promise<number>;
    /**
     * Read 32 bit float.
     */
    readFloat32BE(): Promise<number>;
    /**
     * Read 32 bit float.
     */
    readFloatLE(): Promise<number>;
    /**
     * Read 32 bit float.
     */
    readFloat32LE(): Promise<number>;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeFloat(value: number, endian?: endian, consume?: boolean): Promise<void>;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloatLE(value: number): Promise<void>;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat32LE(value: number): Promise<void>;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat32BE(value: number): Promise<void>;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloatBE(value: number): Promise<void>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian?} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readInt64(unsigned?: boolean, endian?: endian, consume?: boolean): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readUInt64(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readInt64BE(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readInt64LE(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readUInt64BE(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readUInt64LE(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt64(value: BigValue, unsigned?: boolean, endian?: endian, consume?: boolean): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt64(value: BigValue, endian?: endian): Promise<void>;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeInt64LE(value: BigValue): Promise<void>;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeInt64BE(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64LE(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64BE(value: BigValue): Promise<void>;
    /**
     * Read 64 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    readDoubleFloat(endian?: endian, consume?: boolean): Promise<number>;
    /**
     * Read 64 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    readFloat64(endian?: endian): Promise<number>;
    /**
     * Read 64 bit float.
     */
    readDoubleFloatBE(): Promise<number>;
    /**
     * Read 64 bit float.
     */
    readFloat64BE(): Promise<number>;
    /**
     * Read 64 bit float.
     */
    readDoubleFloatLE(): Promise<number>;
    /**
     * Read 64 bit float.
     */
    readFloat64LE(): Promise<number>;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value: number, endian?: endian, consume?: boolean): Promise<void>;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat64(value: number, endian?: endian): Promise<void>;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatBE(value: number): Promise<void>;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat64BE(value: number): Promise<void>;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatLE(value: number): Promise<void>;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat64LE(value: number): Promise<void>;
    /**
    * Reads string, use options object for different types.
    *
    * @param {stringOptions} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal, double-wide-pascal and utf-16, utf-32
    * @param {boolean} consume - move offset after read
    */
    readString(options?: stringOptions, consume?: boolean): Promise<string>;
    /**
    * Writes string, use options object for different types.
    *
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal, double-wide-pascal and utf-16, utf-32
    * @param {boolean} consume - move offset after write
    */
    writeString(string: string, options?: stringOptions, consume?: boolean): Promise<void>;
}

/**
 * Async Binary reader, includes bitfields and strings.
 *
 * @param {DataType} input - File path or a `Buffer` or `Uint8Array`.
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
 * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
 * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
 * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
 * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
 * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
 * @param {BiOptions["readOnly"]?} [options.readOnly = true] - Allow data writes when reading a file (default `true` in reader)
 * @param {BiOptions["windowSize"]?} [options.windowSize = 4096] - Size of the chunk of a file to load per read. Set to `0` to load the whole file in one async read (default `4 KiB`)
 *
 * @since 4.0
 */
declare class BiReaderAsync<DataType, alwaysBigInt> extends BiBaseAsync<DataType, alwaysBigInt> {
    constructor(input: DataType, options?: BiOptions<alwaysBigInt>);
    /**
     * Creates and opens a new `BiReaderAsync`.
     *
     * @param {DataType} input - File path or a `Buffer` or `Uint8Array`.
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
     * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
     * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
     * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
     * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
     * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
     * @param {BiOptions["readOnly"]?} [options.readOnly = true] - Allow data writes when reading a file (default `true` in reader)
     * @param {BiOptions["windowSize"]?} [options.windowSize = 4096] - Size of the chunk of a file to load per read. Set to `0` to load the whole file in one async read (default `4 KiB`)
     *
     * @since 4.0
     */
    static create<DataType, alwaysBigInt>(input: DataType, options?: BiOptions<alwaysBigInt>): Promise<BiReaderAsync<DataType, alwaysBigInt>>;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    bit(bits: number, unsigned?: boolean, endian?: endian): Promise<number>;
    /**
     * Bit field reader. Unsigned read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    ubit(bits: number, endian?: endian): Promise<number>;
    /**
     * Bit field reader. Unsigned big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    ubitbe(bits: number): Promise<number>;
    /**
     * Bit field reader. Big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {Promise<number>}
     */
    bitbe(bits: number, unsigned?: boolean): Promise<number>;
    /**
     * Bit field reader. Unsigned little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    ubitle(bits: number): Promise<number>;
    /**
     * Bit field reader. Little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {Promise<number>}
     */
    bitle(bits: number, unsigned?: boolean): Promise<number>;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit1(): Promise<number>;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit1le(): Promise<number>;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit1be(): Promise<number>;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit1(): Promise<number>;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit1le(): Promise<number>;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit1be(): Promise<number>;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit2(): Promise<number>;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit2le(): Promise<number>;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit2be(): Promise<number>;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit2(): Promise<number>;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit2le(): Promise<number>;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit2be(): Promise<number>;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit3(): Promise<number>;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit3le(): Promise<number>;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit3be(): Promise<number>;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit3(): Promise<number>;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit3le(): Promise<number>;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit3be(): Promise<number>;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit4(): Promise<number>;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit4le(): Promise<number>;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit4be(): Promise<number>;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit4(): Promise<number>;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit4le(): Promise<number>;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit4be(): Promise<number>;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit5(): Promise<number>;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit5le(): Promise<number>;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit5be(): Promise<number>;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit5(): Promise<number>;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit5le(): Promise<number>;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit5be(): Promise<number>;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit6(): Promise<number>;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit6le(): Promise<number>;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit6be(): Promise<number>;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit6(): Promise<number>;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit6le(): Promise<number>;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit6be(): Promise<number>;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit7(): Promise<number>;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit7le(): Promise<number>;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit7be(): Promise<number>;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit7(): Promise<number>;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit7le(): Promise<number>;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit7be(): Promise<number>;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit8(): Promise<number>;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit8le(): Promise<number>;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit8be(): Promise<number>;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit8(): Promise<number>;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit8le(): Promise<number>;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit8be(): Promise<number>;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit9(): Promise<number>;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit9le(): Promise<number>;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit9be(): Promise<number>;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit9(): Promise<number>;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit9le(): Promise<number>;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit9be(): Promise<number>;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit10(): Promise<number>;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit10le(): Promise<number>;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit10be(): Promise<number>;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit10(): Promise<number>;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit10le(): Promise<number>;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit10be(): Promise<number>;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit11(): Promise<number>;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit11le(): Promise<number>;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit11be(): Promise<number>;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit11(): Promise<number>;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit11le(): Promise<number>;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit11be(): Promise<number>;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit12(): Promise<number>;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit12le(): Promise<number>;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit12be(): Promise<number>;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit12(): Promise<number>;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit12le(): Promise<number>;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit12be(): Promise<number>;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit13(): Promise<number>;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit13le(): Promise<number>;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit13be(): Promise<number>;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit13(): Promise<number>;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit13le(): Promise<number>;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit13be(): Promise<number>;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit14(): Promise<number>;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit14le(): Promise<number>;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit14be(): Promise<number>;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit14(): Promise<number>;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit14le(): Promise<number>;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit14be(): Promise<number>;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit15(): Promise<number>;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {promise<number>}
     */
    bit15le(): Promise<number>;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {promise<number>}
     */
    bit15be(): Promise<number>;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit15(): Promise<number>;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit15le(): Promise<number>;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit15be(): Promise<number>;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit16(): Promise<number>;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit16le(): Promise<number>;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit16be(): Promise<number>;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit16(): Promise<number>;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit16le(): Promise<number>;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit16be(): Promise<number>;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit17(): Promise<number>;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit17le(): Promise<number>;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit17be(): Promise<number>;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit17(): Promise<number>;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit17le(): Promise<number>;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit17be(): Promise<number>;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit18(): Promise<number>;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit18le(): Promise<number>;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit18be(): Promise<number>;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit18(): Promise<number>;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit18le(): Promise<number>;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit18be(): Promise<number>;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit19(): Promise<number>;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit19le(): Promise<number>;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit19be(): Promise<number>;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit19(): Promise<number>;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit19le(): Promise<number>;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit19be(): Promise<number>;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit20(): Promise<number>;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit20le(): Promise<number>;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit20be(): Promise<number>;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit20(): Promise<number>;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit20le(): Promise<number>;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit20be(): Promise<number>;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit21(): Promise<number>;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit21le(): Promise<number>;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit21be(): Promise<number>;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit21(): Promise<number>;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit21le(): Promise<number>;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit21be(): Promise<number>;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit22(): Promise<number>;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit22le(): Promise<number>;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit22be(): Promise<number>;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit22(): Promise<number>;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit22le(): Promise<number>;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit22be(): Promise<number>;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit23(): Promise<number>;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit23le(): Promise<number>;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit23be(): Promise<number>;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit23(): Promise<number>;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit23le(): Promise<number>;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit23be(): Promise<number>;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit24(): Promise<number>;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit24le(): Promise<number>;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit24be(): Promise<number>;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit24(): Promise<number>;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit24le(): Promise<number>;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit24be(): Promise<number>;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit25(): Promise<number>;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit25le(): Promise<number>;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit25be(): Promise<number>;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit25(): Promise<number>;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit25le(): Promise<number>;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit25be(): Promise<number>;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit26(): Promise<number>;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit26le(): Promise<number>;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit26be(): Promise<number>;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit26(): Promise<number>;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit26le(): Promise<number>;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit26be(): Promise<number>;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit27(): Promise<number>;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit27le(): Promise<number>;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit27be(): Promise<number>;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit27(): Promise<number>;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit27le(): Promise<number>;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit27be(): Promise<number>;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit28(): Promise<number>;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit28le(): Promise<number>;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit28be(): Promise<number>;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit28(): Promise<number>;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit28le(): Promise<number>;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit28be(): Promise<number>;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit29(): Promise<number>;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit29le(): Promise<number>;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit29be(): Promise<number>;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit29(): Promise<number>;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit29le(): Promise<number>;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit29be(): Promise<number>;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit30(): Promise<number>;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit30le(): Promise<number>;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit30be(): Promise<number>;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit30(): Promise<number>;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit30le(): Promise<number>;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit30be(): Promise<number>;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit31(): Promise<number>;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit31le(): Promise<number>;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit31be(): Promise<number>;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit31(): Promise<number>;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit31le(): Promise<number>;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit31be(): Promise<number>;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit32(): Promise<number>;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit32le(): Promise<number>;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    bit32be(): Promise<number>;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit32(): Promise<number>;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit32le(): Promise<number>;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    ubit32be(): Promise<number>;
    /**
     * Read byte.
     *
     * @returns {Promise<number>}
     */
    byte(): Promise<number>;
    /**
     * Read byte.
     *
     * @returns {Promise<number>}
     */
    int8(): Promise<number>;
    /**
     * Read unsigned byte.
     *
     * @returns {Promise<number>}
     */
    uint8(): Promise<number>;
    /**
     * Read unsigned byte.
     *
     * @returns {Promise<number>}
     */
    ubyte(): Promise<number>;
    /**
     * Read short.
     *
     * @returns {Promise<number>}
     */
    int16(): Promise<number>;
    /**
     * Read short.
     *
     * @returns {Promise<number>}
     */
    short(): Promise<number>;
    /**
     * Read short.
     *
     * @returns {Promise<number>}
     */
    word(): Promise<number>;
    /**
     * Read unsigned short.
     *
     * @returns {Promise<number>}
     */
    uint16(): Promise<number>;
    /**
     * Read unsigned short.
     *
     * @returns {Promise<number>}
     */
    ushort(): Promise<number>;
    /**
     * Read unsigned short.
     *
     * @returns {Promise<number>}
     */
    uword(): Promise<number>;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {Promise<number>}
     */
    uint16le(): Promise<number>;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {Promise<number>}
     */
    ushortle(): Promise<number>;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {Promise<number>}
     */
    uwordle(): Promise<number>;
    /**
     * Read signed short in little endian.
     *
     * @returns {Promise<number>}
     */
    int16le(): Promise<number>;
    /**
     * Read signed short in little endian.
     *
     * @returns {Promise<number>}
     */
    shortle(): Promise<number>;
    /**
     * Read signed short in little endian.
     *
     * @returns {Promise<number>}
     */
    wordle(): Promise<number>;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {Promise<number>}
     */
    uint16be(): Promise<number>;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {Promise<number>}
     */
    ushortbe(): Promise<number>;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {Promise<number>}
     */
    uwordbe(): Promise<number>;
    /**
     * Read signed short in big endian.
     *
     * @returns {Promise<number>}
     */
    int16be(): Promise<number>;
    /**
     * Read signed short in big endian.
     *
     * @returns {Promise<number>}
     */
    shortbe(): Promise<number>;
    /**
     * Read signed short in big endian.
     *
     * @returns {Promise<number>}
     */
    wordbe(): Promise<number>;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    halffloat(): Promise<number>;
    /**
     * Read half float
     *
     * @returns {Promise<number>}
     */
    half(): Promise<number>;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    halffloatbe(): Promise<number>;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    halfbe(): Promise<number>;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    halffloatle(): Promise<number>;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    halfle(): Promise<number>;
    /**
     * Read 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    int(): Promise<number>;
    /**
     * Read 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    double(): Promise<number>;
    /**
     * Read 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    int32(): Promise<number>;
    /**
     * Read 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    long(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    uint(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    udouble(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    uint32(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    ulong(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    intbe(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    doublebe(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    int32be(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    longbe(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    uintbe(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    udoublebe(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    uint32be(): Promise<number>;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    ulongbe(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    intle(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    doublele(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    int32le(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    longle(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    uintle(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    udoublele(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    uint32le(): Promise<number>;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    ulongle(): Promise<number>;
    /**
     * Read float.
     *
     * @returns {Promise<number>}
     */
    float(): Promise<number>;
    /**
     * Read float.
     *
     * @returns {Promise<number>}
     */
    floatbe(): Promise<number>;
    /**
     * Read float.
     *
     * @returns {Promise<number>}
     */
    floatle(): Promise<number>;
    /**
     * Read signed 64 bit integer
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    int64(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    bigint(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    quad(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    uint64(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    ubigint(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    uquad(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    int64be(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    bigintbe(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    quadbe(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    uint64be(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    ubigintbe(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    uquadbe(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    int64le(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    bigintle(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    quadle(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    uint64le(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    ubigintle(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    uquadle(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    doublefloat(): Promise<number>;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    dfloat(): Promise<number>;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    dfloatbe(): Promise<number>;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    doublefloatbe(): Promise<number>;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    dfloatle(): Promise<number>;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    doublefloatle(): Promise<number>;
    /**
    * Reads string, use options object for different types.
    *
    * @param {stringOptions} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - ascii, utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["stripNull"]?} options.stripNull - removes 0x00 characters
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for utf-16, utf-32, wide-pascal or double-wide-pascal
    * @returns {string}
    */
    string(options?: stringOptions): Promise<string>;
    /**
    * Reads string using setting from .strDefaults
    *
    * Default is ``utf-8``
    *
    * @returns {Promise<string>}
    */
    str(): Promise<string>;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    utf8string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads ANSI string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads latin1 string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    latin1string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    utf16string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads UTF-16 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads UTF-32 (Unicode) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    utf32string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads UTF-32 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    utf32stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads UTF-32 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    utf32stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    pstring1le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    pstring1be(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    pstring2le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    pstring2be(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    pstring4le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    pstring4be(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Wide-Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    wpstring1le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    wpstring1be(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    wpstring2le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    wpstring2be(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    wpstring4le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    wpstring4be(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    dwpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    dwpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    dwpstring1le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Double WidePascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    dwpstring1be(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    dwpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    dwpstring2le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    dwpstring2be(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    dwpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    dwpstring4le(stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    dwpstring4be(stripNull?: stringOptions["stripNull"]): Promise<string>;
}

/**
 * Async Binary writer, includes bitfields and strings.
 *
 * @param {DataType} input - File path or a `Buffer` or ``Uint8Array`.
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
 * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
 * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
 * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
 * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
 * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
 * @param {BiOptions["windowSize"]?} [options.windowSize = 4096] - Size of the chunk of a file to load per read. Set to `0` to load the whole file in one async read (default `4 KiB`)
 *
 * @since 4.0
 */
declare class BiWriterAsync<DataType, alwaysBigInt> extends BiBaseAsync<DataType, alwaysBigInt> {
    constructor(input?: DataType, options?: BiOptions<alwaysBigInt>);
    /**
     *
     * Creates and opens a new `BiWriterAsync`.
     *
     * @param {DataType} input - File path or a `Buffer` or ``Uint8Array`.
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} [options.byteOffset = 0] - Byte offset to start reader (default `0`)
     * @param {BiOptions["bitOffset"]?} [options.bitOffset = 0] - Bit offset (overrides {@link byteOffset}) (default `0`)
     * @param {BiOptions["endianness"]?} [options.endianness = "little"] - Endianness `big` or `little` (default `little`)
     * @param {BiOptions["strict"]?} [options.strict = true] - Strict mode: if `true` does not extend supplied array on outside read or write (default `true`)
     * @param {BiOptions["growthIncrement"]?} [options.growthIncrement = 1048576] - Amount of data to add when extending the buffer array when strict mode is false (default `1 MiB`)
     * @param {BiOptions["enforceBigInt"]?} [options.enforceBigInt = false] - 64 bit value reads will always return `bigint`. (default `false`)
     * @param {BiOptions["windowSize"]?} [options.windowSize = 4096] - Size of the chunk of a file to load per read. Set to `0` to load the whole file in one async read (default `4 KiB`)
     *
     * @returns {Promise<BiWriterAsync<DataType, alwaysBigInt>>}
     */
    static create<DataType, alwaysBigInt>(input: DataType, options?: BiOptions<alwaysBigInt>): Promise<BiWriterAsync<DataType, alwaysBigInt>>;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    bit(value: number, bits: number, unsigned?: boolean, endian?: endian): Promise<void>;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {endian} endian - ``big`` or ``little``
     */
    ubit(value: number, bits: number, endian?: endian): Promise<void>;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     */
    bitbe(value: number, bits: number, unsigned?: boolean): Promise<void>;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     */
    ubitbe(value: number, bits: number): Promise<void>;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     */
    ubitle(value: number, bits: number): Promise<void>;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     */
    bitle(value: number, bits: number, unsigned?: boolean): Promise<void>;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit1(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit1le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit1be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit1(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit1le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit1be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit2(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit2le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit2be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit2(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit2le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit2be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit3(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit3le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit3be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit3(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit3le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit3be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit4(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit4le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit4be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit4(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit4le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit4be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit5(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit5le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit5be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit5(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit5le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit5be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit6(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit6le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit6be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit6(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit6le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit6be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit7(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit7le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit7be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit7(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit7le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit7be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit8(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit8le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit8be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit8(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit8le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit8be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit9(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit9le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit9be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit9(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit9le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit9be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit10(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit10le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit10be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit10(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit10le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit10be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit11(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit11le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit11be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit11(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit11le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit11be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit12(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit12le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit12be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit12(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit12le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit12be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit13(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit13le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit13be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit13(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit13le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit13be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit14(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit14le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit14be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit14(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit14le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit14be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit15(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit15le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit15be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit15(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit15le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit15be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit16(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit16le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit16be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit16(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit16le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit16be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit17(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit17le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit17be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit17(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit17le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit17be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit18(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit18le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit18be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit18(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit18le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit18be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit19(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit19le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit19be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit19(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit19le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit19be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit20(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit20le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit20be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit20(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit20le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit20be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit21(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit21le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit21be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit21(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit21le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit21be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit22(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit22le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit22be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit22(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit22le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit22be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit23(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit23le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit23be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit23(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit23le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit23be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit24(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit24le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit24be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit24(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit24le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit24be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit25(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit25le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit25be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit25(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit25le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit25be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit26(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit26le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit26be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit26(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit26le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit26be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit27(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit27le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit27be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit27(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit27le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit27be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit28(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit28le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit28be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit28(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit28le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit28be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit29(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit29le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit29be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit29(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit29le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit29be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit30(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit30le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit30be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit30(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit30le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit30be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit31(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit31le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit31be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit31(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit31le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit31be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit32(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit32le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    bit32be(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit32(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit32le(value: number): Promise<void>;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    ubit32be(value: number): Promise<void>;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    byte(value: number): Promise<void>;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    int8(value: number): Promise<void>;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    uint8(value: number): Promise<void>;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    ubyte(value: number): Promise<void>;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    int16(value: number): Promise<void>;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    short(value: number): Promise<void>;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    word(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    uint16(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    ushort(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    uword(value: number): Promise<void>;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    int16be(value: number): Promise<void>;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    shortbe(value: number): Promise<void>;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    wordbe(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    uint16be(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    ushortbe(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    uwordbe(value: number): Promise<void>;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    int16le(value: number): Promise<void>;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    shortle(value: number): Promise<void>;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    wordle(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    uint16le(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    ushortle(value: number): Promise<void>;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    uwordle(value: number): Promise<void>;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    half(value: number): Promise<void>;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    halffloat(value: number): Promise<void>;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    halffloatbe(value: number): Promise<void>;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    halfbe(value: number): Promise<void>;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    halffloatle(value: number): Promise<void>;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    halfle(value: number): Promise<void>;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    int(value: number): Promise<void>;
    /**
    * Write int32.
    *
    * @param {number} value - value as int
    */
    int32(value: number): Promise<void>;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    double(value: number): Promise<void>;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    long(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    uint32(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    uint(value: number): Promise<void>;
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    udouble(value: number): Promise<void>;
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    ulong(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    int32le(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    intle(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    doublele(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    longle(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    uint32le(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    uintle(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    udoublele(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    ulongle(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    intbe(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    int32be(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    doublebe(value: number): Promise<void>;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    longbe(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32BE(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    uint32be(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    uintbe(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    udoublebe(value: number): Promise<void>;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    ulongbe(value: number): Promise<void>;
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    float(value: number): Promise<void>;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    floatle(value: number): Promise<void>;
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    floatbe(value: number): Promise<void>;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    int64(value: BigValue): Promise<void>;
    /**
    * Write 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    quad(value: BigValue): Promise<void>;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    bigint(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    uint64(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    ubigint(value: BigValue): Promise<void>;
    /**
    * Write unsigned 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    uquad(value: BigValue): Promise<void>;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    int64le(value: BigValue): Promise<void>;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    bigintle(value: BigValue): Promise<void>;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    quadle(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    uint64le(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    ubigintle(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    uquadle(value: BigValue): Promise<void>;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    int64be(value: BigValue): Promise<void>;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    bigintbe(value: BigValue): Promise<void>;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    quadbe(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    uint64be(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    ubigintbe(value: BigValue): Promise<void>;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    uquadbe(value: BigValue): Promise<void>;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    doublefloat(value: number): Promise<void>;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    dfloat(value: number): Promise<void>;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    dfloatbe(value: number): Promise<void>;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    doublefloatbe(value: number): Promise<void>;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    dfloatle(value: number): Promise<void>;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    doublefloatle(value: number): Promise<void>;
    /**
    * Writes string, use options object for different types.
    *
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - ascii, utf-8, utf-16, utf-32, pascal, wide-pascal or double-wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for utf-16, utf-32, wide-pascal or double-wide-pascal
    */
    string(string: string, options?: stringOptions): Promise<void>;
    /**
    * Writes string using setting from .strDefaults
    *
    * Default is ``utf-8``
    *
    * @param {string} string - text string
    */
    str(string: string): Promise<void>;
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf8string(string: string, length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    cstring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes ANSI string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    ansistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes latin1 string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    latin1tring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf16string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    unistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes UTF-32 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf32string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes UTF-32 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf32stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes UTF-32 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf32stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
    /**
    * Writes Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Pascal string 1 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring1le(string: string): Promise<void>;
    /**
    * Writes Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring1be(string: string): Promise<void>;
    /**
    * Writes Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring2(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring2le(string: string): Promise<void>;
    /**
    * Writes Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring2be(string: string): Promise<void>;
    /**
    * Writes Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring4(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring4le(string: string): Promise<void>;
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring4be(string: string): Promise<void>;
    /**
    * Writes Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Wide Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): Promise<void>;
    /**
    * Writes Wide Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): Promise<void>;
    /**
    * Writes Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring1(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring1be(string: string): Promise<void>;
    /**
    * Writes Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring1le(string: string): Promise<void>;
    /**
    * Writes Wide Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring2(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring2le(string: string): Promise<void>;
    /**
    * Writes Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring2be(string: string): Promise<void>;
    /**
    * Writes Wide Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring4(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring4le(string: string): Promise<void>;
    /**
    * Writes Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring4be(string: string): Promise<void>;
    /**
    * Writes Double Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Double Wide Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    dwpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): Promise<void>;
    /**
    * Writes Double Wide Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    dwpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): Promise<void>;
    /**
    * Writes Double Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring1(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Double Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring1le(string: string): Promise<void>;
    /**
    * Writes Double Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring1be(string: string): Promise<void>;
    /**
    * Writes Double Wide Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring2(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Double Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring2le(string: string): Promise<void>;
    /**
    * Writes Double Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring2be(string: string): Promise<void>;
    /**
    * Writes Double Wide Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring4(string: string, endian?: stringOptions["endian"]): Promise<void>;
    /**
    * Writes Double Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring4le(string: string): Promise<void>;
    /**
    * Writes Double Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring4be(string: string): Promise<void>;
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
 * Isn't usable in browser.
 * @since 3.0
 * @deprecated Use ``BiReader`` instead.
 */
declare class BiReaderStream {
    constructor();
}
/**
 * Isn't usable in browser.
 * @since 4.0
 * @deprecated Use ``BiReader`` instead.
 */
declare class BiFileReader {
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
/**
 * Isn't usable in browser.
 * @since 3.0
 * @deprecated Use ``BiWriter`` instead.
 */
declare class BiWriterStream {
    constructor();
}
/**
 * Isn't usable in browser.
 * @since 4.0
 * @deprecated Use ``BiWriter`` instead.
 */
declare class BiFileWriter {
    constructor();
}

export { BiBase, BiFileReader, BiFileWriter, BiReader, BiReaderAsync, BiReaderStream, BiWriter, BiWriterAsync, BiWriterStream, bireader, biwriter, hexdump };
