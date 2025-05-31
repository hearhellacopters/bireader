/// <reference types="node" />
type BiReader = import('./bireader.ts').BiReader;
type BiWriter = import('./biwriter.ts').BiWriter;
export type BiOptions = {
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
    endianness?: "little" | "big";
    /**
     * Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     */
    strict?: boolean;
    /**
     * Amount of data to add when extending the buffer array when strict mode is false. Note: Changes login in ``.get`` and ``.return``.
     */
    extendBufferSize?: number;
};
export declare function isBuffer(obj: Buffer | Uint8Array): boolean;
export declare function check_size(_this: BiReader | BiWriter | ReaderBase, write_bytes: number, write_bit?: number, offset?: number): number;
export declare function buffcheck(obj: Buffer | Uint8Array | ReaderBase): boolean;
export declare function arraybuffcheck(_this: BiReader | BiWriter | ReaderBase, obj: Buffer | Uint8Array): boolean;
export declare function extendarray(_this: BiReader | BiWriter | ReaderBase, to_padd: number): void;
export declare function checkSize(_this: BiReader | BiWriter | ReaderBase, write_bytes: number, write_bit?: number, offset?: number): number;
export declare function skip(_this: BiReader | BiWriter | ReaderBase, bytes: number, bits?: number): void;
export declare function align(_this: BiReader | BiWriter | ReaderBase, n: number): void;
export declare function alignRev(_this: BiReader | BiWriter | ReaderBase, n: number): void;
export declare function goto(_this: BiReader | BiWriter | ReaderBase, bytes: number, bits?: number): void;
export declare function remove(_this: BiReader | BiWriter | ReaderBase, startOffset?: number, endOffset?: number, consume?: boolean, remove?: boolean, fillValue?: number): any;
export declare function addData(_this: BiReader | BiWriter | ReaderBase, data: Buffer | Uint8Array, consume?: boolean, offset?: number, replace?: boolean): void;
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
     * Supress unicode character preview for even columns.
     */
    supressUnicode?: boolean;
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
 * @param {boolean?} options.supressUnicode - Supress unicode character preview for even columns.
 * @param {boolean?} options.returnString - Returns the hex dump string instead of logging it.
 */
export declare function hexdump(src: Uint8Array | Buffer, options?: hexdumpOptions): void | string;
export declare function hexDump(_this: BiReader | BiWriter | ReaderBase, options?: hexdumpOptions): void | string;
export declare function AND(_this: BiReader | BiWriter | ReaderBase, and_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function OR(_this: BiReader | BiWriter | ReaderBase, or_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function XOR(_this: BiReader | BiWriter | ReaderBase, xor_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function NOT(_this: BiReader | BiWriter | ReaderBase, start?: number, end?: number, consume?: boolean): any;
export declare function LSHIFT(_this: BiReader | BiWriter | ReaderBase, shift_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function RSHIFT(_this: BiReader | BiWriter | ReaderBase, shift_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function ADD(_this: BiReader | BiWriter | ReaderBase, add_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function fString(_this: BiReader | BiWriter | ReaderBase, searchString: string): number;
export declare function fNumber(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, bits: number, unsigned: boolean, endian?: string): number;
export declare function fHalfFloat(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, endian?: string): number;
export declare function fFloat(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, endian?: string): number;
export declare function fBigInt(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, unsigned: boolean, endian?: string): number;
export declare function fDoubleFloat(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, endian?: string): number;
export declare function wbit(_this: BiReader | BiWriter | ReaderBase, value: number, bits: number, unsigned?: boolean, endian?: string): void;
export declare function rbit(_this: BiReader | BiWriter | ReaderBase, bits?: number, unsigned?: boolean, endian?: string): number;
export declare function wbyte(_this: BiReader | BiWriter | ReaderBase, value: number, unsigned?: boolean): void;
export declare function rbyte(_this: BiReader | BiWriter | ReaderBase, unsigned?: boolean): number;
export declare function wint16(_this: BiReader | BiWriter | ReaderBase, value: number, unsigned?: boolean, endian?: string): void;
export declare function rint16(_this: BiReader | BiWriter | ReaderBase, unsigned?: boolean, endian?: string): number;
export declare function rhalffloat(_this: BiReader | BiWriter | ReaderBase, endian?: string): number;
export declare function whalffloat(_this: BiReader | BiWriter | ReaderBase, value: number, endian?: string): void;
export declare function wint32(_this: BiReader | BiWriter | ReaderBase, value: number, unsigned?: boolean, endian?: string): void;
export declare function rint32(_this: BiReader | BiWriter | ReaderBase, unsigned?: boolean, endian?: string): number;
export declare function rfloat(_this: BiReader | BiWriter | ReaderBase, endian?: string): number;
export declare function wfloat(_this: BiReader | BiWriter | ReaderBase, value: number, endian?: string): void;
export declare function rint64(_this: BiReader | BiWriter | ReaderBase, unsigned?: boolean, endian?: string): bigint;
export declare function wint64(_this: BiReader | BiWriter | ReaderBase, value: number, unsigned?: boolean, endian?: string): void;
export declare function wdfloat(_this: BiReader | BiWriter | ReaderBase, value: number, endian?: string): void;
export declare function rdfloat(_this: BiReader | BiWriter | ReaderBase, endian?: string): number;
export declare function rstring(_this: BiReader | BiWriter | ReaderBase, options?: {
    length?: number;
    stringType?: string;
    terminateValue?: number;
    lengthReadSize?: number;
    stripNull?: boolean;
    encoding?: string;
    endian?: string;
}): string;
export declare function wstring(_this: BiReader | BiWriter | ReaderBase, string: string, options?: {
    length?: number;
    stringType?: string;
    terminateValue?: number;
    lengthWriteSize?: number;
    stripNull?: boolean;
    encoding?: string;
    endian?: string;
}): void;
export declare class ReaderBase {
    /**
     * Endianness of default read.
     * @type {'little'|'big'}
     */
    endian: string;
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
     * @type {Buffer|Uint8Array}
     */
    data: any;
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
    isBufferOrUint8Array(obj: Buffer | Uint8Array): boolean;
    extendArray(to_padd: number): void;
    /**
     *
     * Change endian, defaults to little.
     *
     * Can be changed at any time, doesn't loose position.
     *
     * @param {string} endian - endianness ``big`` or ``little``
     */
    endianness(endian: string): void;
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
    * @param {boolean?} options.supressUnicode - Supress unicode character preview for even columns.
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
    close(): void;
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
     * Note: Must be same data type as supplied data. Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    replace(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Replaces data in data.
     *
     * Note: Must be same data type as supplied data. Errors on strict mode.
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
     * Note: Must be same data type as supplied data. Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    insert(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Inserts data into data.
     *
     * Note: Must be same data type as supplied data. Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    place(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Must be same data type as supplied data. Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Must be same data type as supplied data. Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Must be same data type as supplied data. Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data: Buffer | Uint8Array, consume?: boolean): void;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Must be same data type as supplied data. Errors on strict mode.
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
     * @param {string} endian - ``big`` or ``little``
     */
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: string): void;
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
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readBit(bits?: number, unsigned?: boolean, endian?: string): number;
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
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt16(unsigned?: boolean, endian?: string): number;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     */
    writeInt16(value: number, unsigned?: boolean, endian?: string): void;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {string} endian - ``big`` or ``little``
     */
    writeUInt16(value: number, endian?: string): void;
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
     * @param {string} endian - ``big`` or ``little``
     *
     * @returns {number}
     */
    readUInt16(endian?: string): number;
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
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readHalfFloat(endian?: string): number;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     * @param {string} endian - ``big`` or ``little``
     */
    writeHalfFloat(value: number, endian?: string): void;
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
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt32(unsigned?: boolean, endian?: string): number;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     */
    writeInt32(value: number, unsigned?: boolean, endian?: string): void;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     * @param {string} endian - ``big`` or ``little``
     */
    writeUInt32(value: number, endian?: string): void;
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
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat(endian?: string): number;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     * @param {string} endian - ``big`` or ``little``
     */
    writeFloat(value: number, endian?: string): void;
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
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt64(unsigned?: boolean, endian?: string): bigint;
    /**
     * Write 64 bit integer.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     */
    writeInt64(value: number, unsigned?: boolean, endian?: string): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     * @param {string} endian - ``big`` or ``little``
     */
    writeUInt64(value: number, endian?: string): void;
    /**
     * Write signed 64 bit integer.
     *
     * @param {number} value - value as int
     */
    writeInt64LE(value: number): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    writeUInt64LE(value: number): void;
    /**
     * Write signed 64 bit integer.
     *
     * @param {number} value - value as int
     */
    writeInt64BE(value: number): void;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {number} value - value as int
     */
    writeUInt64BE(value: number): void;
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    readUInt64(): bigint;
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    readInt64BE(): bigint;
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    readUInt64BE(): bigint;
    /**
     * Read signed 64 bit integer.
     *
     * @returns {number}
     */
    readInt64LE(): bigint;
    /**
     * Read unsigned 64 bit integer.
     *
     * @returns {number}
     */
    readUInt64LE(): bigint;
    /**
     * Read double float.
     *
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian?: string): number;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     * @param {string} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value: number, endian?: string): void;
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
    * Writes string, use options object for different types.
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
}
export {};
//# sourceMappingURL=common.d.ts.map