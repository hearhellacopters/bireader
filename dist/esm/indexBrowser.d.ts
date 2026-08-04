import * as fs from 'fs';
import * as fs_promises from 'fs/promises';

type endian = "little" | "big";
type BigValue = number | bigint;
type ReturnBigValueMapping<alwaysBigInt> = alwaysBigInt extends true ? bigint : BigValue;
/**
 * Maps a reader/writer's input source type to the type its sub-array methods
 * ({@link extract}, `subarray`, `fill`, `delete`, `readUBytes`, `get`, ...) return,
 * so the output echoes the input: a `Buffer` in - or a file path, read as a `Buffer` -
 * yields `Buffer`s; a `Uint8Array` yields plain `Uint8Array`s. Wrapped in tuples so a
 * union input type does not distribute (it falls back to `Uint8Array`).
 */
type BytesOutput<DataType> = [
    DataType
] extends [string] ? Buffer : [
    DataType
] extends [Buffer] ? Buffer : Uint8Array;
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
 * @file Phase-2 engine brick: synchronous byte sources.
 *
 * The sync counterpart of `source.ts` - a uniform surface for `BiSyncEngine`
 * (`BiReader` / `BiWriter`). Sync file mode is deliberately simple: like the legacy
 * `BiBase`, `FileSyncSource` loads the whole file into a buffer, operates in memory,
 * and writes it back on flush. (The chunked/windowed approach is async-only.)
 *
 * Written strict-null-safe from the start.
 */
interface SyncSource {
    readonly size: number;
    readonly readOnly: boolean;
    /**
     * Whether sub-array results should be returned as Node `Buffer`s rather than
     * plain `Uint8Array`s - true for file-backed sources and for memory sources
     * created from a `Buffer`, so `extract`/`subarray`/etc. echo the input type.
     */
    readonly isBuffer: boolean;
    read(offset: number, length: number): Uint8Array;
    write(offset: number, data: Uint8Array): void;
    resize(size: number): void;
    flush(): void;
    close(): void;
}

type Endian$1 = 'little' | 'big';
interface BiSyncEngineOptions {
    endianness?: Endian$1;
    enforceBigInt?: boolean;
    strict?: boolean;
    readOnly?: boolean;
    growthIncrement?: number;
    byteOffset?: number;
    bitOffset?: number;
}
declare class BiSyncEngine<alwaysBigInt extends boolean = false, BytesOut extends Uint8Array = Uint8Array> {
    #private;
    /** File system (node:fs), injected by the entry point for file mode. */
    static fs: typeof fs;
    endian: Endian$1;
    enforceBigInt: boolean;
    strict: boolean;
    readOnly: boolean;
    growthIncrement: number;
    filePath: string | null;
    errorDump: boolean;
    strDefaults: stringOptions;
    constructor(input: string | Uint8Array, options?: BiSyncEngineOptions);
    /** True when backed by an in-memory buffer rather than a file. */
    get isMemoryMode(): boolean;
    /** The live {@link SyncSource} (opens the file lazily in file mode). */
    get source(): SyncSource;
    /** Opens the file for reading / writing. Optionally swaps in a new in-memory buffer. */
    open(data?: Uint8Array): void;
    /** Current buffer / file size in bytes. */
    get size(): number;
    /** Current byte position. */
    get offset(): number;
    /** Moves the current byte position. */
    set offset(value: number);
    /** Current bit position within the current byte (0-7). */
    get insetBit(): number;
    /** Moves the bit position within the current byte (0-7). */
    set insetBit(value: number);
    /** Current absolute bit position (byte * 8 + inset bit). */
    get bitOffset(): number;
    /** Moves to an absolute bit position (byte * 8 + inset bit). */
    set bitOffset(value: number);
    /** Reads an 8 bit value (signed unless `unsigned`) at the current byte position. */
    readByte(unsigned?: boolean, consume?: boolean): number;
    /** Reads a 16 bit value (short / word) in the given endian order. */
    readInt16(unsigned?: boolean, endian?: Endian$1, consume?: boolean): number;
    /** Reads a 32 bit value (int / long / dword) in the given endian order. */
    readInt32(unsigned?: boolean, endian?: Endian$1, consume?: boolean): number;
    /**
     * Reads a 64 bit value (quad / bigint) in the given endian order. Returns a `number` when the
     * value is integer safe, otherwise a `bigint` (always `bigint` when `enforceBigInt` is set).
     */
    readInt64(unsigned?: boolean, endian?: Endian$1, consume?: boolean): ReturnBigValueMapping<alwaysBigInt>;
    /** Reads a 16 bit half float in the given endian order. */
    readHalfFloat(endian?: Endian$1, consume?: boolean): number;
    /** Reads a 32 bit float in the given endian order. */
    readFloat(endian?: Endian$1, consume?: boolean): number;
    /** Reads a 64 bit double float in the given endian order. */
    readDoubleFloat(endian?: Endian$1, consume?: boolean): number;
    /** Writes an 8 bit value at the current byte position. Value is clamped to the type's range. */
    writeByte(value: number, unsigned?: boolean, consume?: boolean): void;
    /** Writes a 16 bit value (short / word) in the given endian order. Value is clamped to the type's range. */
    writeInt16(value: number, unsigned?: boolean, endian?: Endian$1, consume?: boolean): void;
    /** Writes a 32 bit value (int / long / dword) in the given endian order. Value is clamped to the type's range. */
    writeInt32(value: number, unsigned?: boolean, endian?: Endian$1, consume?: boolean): void;
    /** Writes a 64 bit value (quad / bigint) in the given endian order. Value is clamped to the type's range. */
    writeInt64(value: number | bigint, unsigned?: boolean, endian?: Endian$1, consume?: boolean): void;
    /** Writes a 16 bit half float in the given endian order. */
    writeHalfFloat(value: number, endian?: Endian$1, consume?: boolean): void;
    /** Writes a 32 bit float in the given endian order. */
    writeFloat(value: number, endian?: Endian$1, consume?: boolean): void;
    /** Writes a 64 bit double float in the given endian order. */
    writeDoubleFloat(value: number, endian?: Endian$1, consume?: boolean): void;
    /** Reads a bit field of 1-32 bits from the current bit position, signed or unsigned, in either endian order. */
    readBit(bits: number, unsigned?: boolean, endian?: Endian$1, consume?: boolean): number;
    /** Writes a bit field of 1-32 bits at the current bit position. Value is clamped to the bit width. */
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: Endian$1, consume?: boolean): void;
    /** Reads `amount` bytes from the current byte position as a number array (signed unless `unsigned`). */
    readBytes(amount: number, unsigned?: boolean, consume?: boolean): number[];
    /** Reads `amount` unsigned bytes from the current byte position as a copy in the source's native type. */
    readUBytes(amount: number, consume?: boolean): BytesOut;
    /** Writes raw bytes at the current byte position, overwriting existing data. */
    writeBytes(values: number[] | Uint8Array, unsigned?: boolean, consume?: boolean): void;
    /** Writes raw unsigned bytes at the current byte position, overwriting existing data. */
    writeUBytes(values: number[] | Uint8Array, consume?: boolean): void;
    /** Moves to an absolute byte / bit position. Throws in strict mode when outside the data size. */
    goto(byte?: number, bit?: number): void;
    /** Moves the position by a relative number of bytes / bits. Use negative values to go back. */
    skip(bytes?: number, bits?: number): void;
    /** Moves the current byte position to the start of the data. */
    rewind(): void;
    /** Moves the current byte position to the end of the data. */
    last(): void;
    /** Aligns the current byte position forward to the next multiple of `n`. */
    align(n: number): void;
    /** Aligns the current byte position backward to the previous multiple of `n`. */
    alignRev(n: number): void;
    /** Inserts new data at `offset`, growing the buffer and shifting the tail forward. Errors in strict mode. */
    insert(data: Uint8Array, offset?: number, consume?: boolean): void;
    /** Alias of {@link insert} - inserts new data at `offset`. */
    place(data: Uint8Array, offset?: number, consume?: boolean): void;
    /** Adds new data to the start of the supplied data. Errors in strict mode. */
    unshift(data: Uint8Array, consume?: boolean): void;
    /** Alias of {@link unshift} - adds new data to the start of the supplied data. */
    prepend(data: Uint8Array, consume?: boolean): void;
    /** Adds new data to the end of the supplied data. Errors in strict mode. */
    push(data: Uint8Array, consume?: boolean): void;
    /** Alias of {@link push} - adds new data to the end of the supplied data. */
    append(data: Uint8Array, consume?: boolean): void;
    /** Removes `[startOffset, endOffset)` and returns the removed bytes (as the source's native type). Errors in strict mode. */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): BytesOut;
    /** Removes and returns all data after the current byte position. Errors in strict mode. */
    clip(): BytesOut;
    /** Alias of {@link clip} - removes and returns all data after the current byte position. */
    trim(): BytesOut;
    /** Removes and returns `length` bytes from the current byte position. Errors in strict mode. */
    crop(length?: number, consume?: boolean): BytesOut;
    /** Alias of {@link crop} - removes and returns `length` bytes from the current byte position. */
    drop(length?: number, consume?: boolean): BytesOut;
    /** Overwrites data at `offset` (grows if needed, does not shift the tail). */
    replace(data: Uint8Array, offset?: number, consume?: boolean): void;
    /** Alias of {@link replace} - overwrites data at `offset`. */
    overwrite(data: Uint8Array, offset?: number, consume?: boolean): void;
    /** Returns a copy of `[startOffset, endOffset)` (as the source's native type); when `fillValue` is supplied, that range is filled with it. */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): BytesOut;
    /** Alias of {@link fill} - returns data between two byte positions, optionally filling that range. */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): BytesOut;
    /** Returns a copy of the data between two byte positions without modifying it. */
    subarray(startOffset?: number, endOffset?: number, consume?: boolean): BytesOut;
    /** Returns a copy of `length` bytes from the current byte position without modifying the data. */
    extract(length?: number, consume?: boolean): BytesOut;
    /** Alias of {@link extract} - returns a copy of `length` bytes from the current byte position. */
    slice(length?: number, consume?: boolean): BytesOut;
    /** Alias of {@link extract} - returns a copy of `length` bytes from the current byte position. */
    wrap(length?: number, consume?: boolean): BytesOut;
    /**
     * Reads a string in any supported format - fixed length or terminated UTF, or Pascal
     * (`stringType`, `length`, `terminateValue`, `lengthReadSize`, `stripNull`, `encoding`, `endian`).
     */
    readString(options?: stringOptions, consume?: boolean): string;
    /**
     * Writes a string in any supported format - fixed length or terminated UTF, or Pascal
     * (`stringType`, `length`, `terminateValue`, `lengthWriteSize`, `encoding`, `endian`).
     */
    writeString(str: string, options?: stringOptions, consume?: boolean): void;
    /** XORs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    xor(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): void;
    /** ORs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    or(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): void;
    /** ANDs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    and(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): void;
    /** Adds the key to each byte in `[start, end)`. The key repeats when shorter than the range. */
    add(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): void;
    /** NOTs (bitwise inverts) every byte in the range `[start, end)`. */
    not(start?: number, end?: number, consume?: boolean): void;
    /** Left shifts each byte in `[start, end)` by the key. The key repeats when shorter than the range. */
    lShift(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): void;
    /** Right shifts each byte in `[start, end)` by the key. The key repeats when shorter than the range. */
    rShift(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): void;
    /** XORs `length` bytes from the current byte position with the key (length defaults to the key size). */
    xorThis(key: number | string | Uint8Array, length?: number, consume?: boolean): void;
    /** ORs `length` bytes from the current byte position with the key (length defaults to the key size). */
    orThis(key: number | string | Uint8Array, length?: number, consume?: boolean): void;
    /** ANDs `length` bytes from the current byte position with the key (length defaults to the key size). */
    andThis(key: number | string | Uint8Array, length?: number, consume?: boolean): void;
    /** Adds the key to `length` bytes from the current byte position (length defaults to the key size). */
    addThis(key: number | string | Uint8Array, length?: number, consume?: boolean): void;
    /** NOTs `length` bytes from the current byte position. */
    notThis(length?: number, consume?: boolean): void;
    /** Left shifts `length` bytes from the current byte position by the key (length defaults to the key size). */
    lShiftThis(key: number | string | Uint8Array, length?: number, consume?: boolean): void;
    /** Right shifts `length` bytes from the current byte position by the key (length defaults to the key size). */
    rShiftThis(key: number | string | Uint8Array, length?: number, consume?: boolean): void;
    /** Searches from the current byte position for a byte sequence. Returns its offset or -1. Does not move the position. */
    findBytes(bytesToFind: Uint8Array | number[]): number;
    /** Searches from the current byte position for a string. Returns its offset or -1. Does not move the position. */
    findString(str: string, bytesPerChar?: 1 | 2 | 4): number;
    /** Searches from the current byte position for an 8 bit value. Returns its offset or -1. Does not move the position. */
    findByte(value: number, unsigned?: boolean, endian?: Endian$1): number;
    /** Searches from the current byte position for a 16 bit value. Returns its offset or -1. Does not move the position. */
    findShort(value: number, unsigned?: boolean, endian?: Endian$1): number;
    /** Searches from the current byte position for a 32 bit value. Returns its offset or -1. Does not move the position. */
    findInt(value: number, unsigned?: boolean, endian?: Endian$1): number;
    /** Sets the default endian order. Can be changed at any time. */
    endianness(endian: Endian$1): void;
    /** Switches the default endian order to big endian. */
    bigEndian(): void;
    /** Alias of {@link bigEndian} - switches to big endian. */
    big(): void;
    /** Alias of {@link bigEndian} - switches to big endian. */
    be(): void;
    /** Switches the default endian order to little endian. */
    littleEndian(): void;
    /** Alias of {@link littleEndian} - switches to little endian. */
    little(): void;
    /** Alias of {@link littleEndian} - switches to little endian. */
    le(): void;
    /** Reads an unsigned 8 bit value. */
    readUByte(consume?: boolean): number;
    /** Reads an unsigned 16 bit value in the given endian order. */
    readUInt16(endian?: Endian$1): number;
    /** Reads an unsigned 16 bit little endian value. */
    readUInt16LE(): number;
    /** Reads an unsigned 16 bit big endian value. */
    readUInt16BE(): number;
    /** Reads a signed 16 bit little endian value. */
    readInt16LE(): number;
    /** Reads a signed 16 bit big endian value. */
    readInt16BE(): number;
    /** Reads a signed 32 bit value in the given endian order. */
    readInt(endian?: Endian$1): number;
    /** Reads an unsigned 32 bit value in the given endian order. */
    readUInt(endian?: Endian$1): number;
    /** Reads an unsigned 32 bit value in the given endian order. */
    readUInt32(endian?: Endian$1): number;
    /** Reads a signed 32 bit little endian value. */
    readInt32LE(): number;
    /** Reads a signed 32 bit big endian value. */
    readInt32BE(): number;
    /** Reads an unsigned 32 bit little endian value. */
    readUInt32LE(): number;
    /** Reads an unsigned 32 bit big endian value. */
    readUInt32BE(): number;
    /** Reads a 32 bit float in the given endian order. */
    readFloat32(endian?: Endian$1, consume?: boolean): number;
    /** Reads a 32 bit little endian float. */
    readFloatLE(): number;
    /** Reads a 32 bit big endian float. */
    readFloatBE(): number;
    /** Reads a 32 bit little endian float. */
    readFloat32LE(): number;
    /** Reads a 32 bit big endian float. */
    readFloat32BE(): number;
    /** Reads a 16 bit half float in the given endian order. */
    readFloat16(endian?: Endian$1, consume?: boolean): number;
    /** Reads a 16 bit little endian half float. */
    readHalfFloatLE(): number;
    /** Reads a 16 bit big endian half float. */
    readHalfFloatBE(): number;
    /** Reads a 16 bit little endian half float. */
    readFloat16LE(): number;
    /** Reads a 16 bit big endian half float. */
    readFloat16BE(): number;
    /** Reads a 64 bit double float in the given endian order. */
    readFloat64(endian?: Endian$1, consume?: boolean): number;
    /** Reads a 64 bit little endian double float. */
    readDoubleFloatLE(): number;
    /** Reads a 64 bit big endian double float. */
    readDoubleFloatBE(): number;
    /** Reads a 64 bit little endian double float. */
    readFloat64LE(): number;
    /** Reads a 64 bit big endian double float. */
    readFloat64BE(): number;
    /** Reads an unsigned 64 bit value in the current endian order. */
    readUInt64(): ReturnBigValueMapping<alwaysBigInt>;
    /** Reads a signed 64 bit little endian value. */
    readInt64LE(): ReturnBigValueMapping<alwaysBigInt>;
    /** Reads a signed 64 bit big endian value. */
    readInt64BE(): ReturnBigValueMapping<alwaysBigInt>;
    /** Reads an unsigned 64 bit little endian value. */
    readUInt64LE(): ReturnBigValueMapping<alwaysBigInt>;
    /** Reads an unsigned 64 bit big endian value. */
    readUInt64BE(): ReturnBigValueMapping<alwaysBigInt>;
    /** Reads an unsigned bit field of 1-32 bits in big endian order. */
    readUBitBE(bits: number): number;
    /** Reads an unsigned bit field of 1-32 bits in little endian order. */
    readUBitLE(bits: number): number;
    /** Reads a bit field of 1-32 bits in big endian order. */
    readBitBE(bits: number, unsigned?: boolean): number;
    /** Reads a bit field of 1-32 bits in little endian order. */
    readBitLE(bits: number, unsigned?: boolean): number;
    /** Writes an unsigned 8 bit value. */
    writeUByte(value: number, consume?: boolean): void;
    /** Writes an unsigned 16 bit value in the given endian order. */
    writeUInt16(value: number, endian?: Endian$1): void;
    /** Writes an unsigned 16 bit little endian value. */
    writeUInt16LE(value: number): void;
    /** Writes an unsigned 16 bit big endian value. */
    writeUInt16BE(value: number): void;
    /** Writes a signed 16 bit little endian value. */
    writeInt16LE(value: number): void;
    /** Writes a signed 16 bit big endian value. */
    writeInt16BE(value: number): void;
    /** Writes a signed 32 bit value in the given endian order. */
    writeInt(value: number, endian?: Endian$1): void;
    /** Writes an unsigned 32 bit value in the given endian order. */
    writeUInt(value: number, endian?: Endian$1): void;
    /** Writes an unsigned 32 bit value in the given endian order. */
    writeUInt32(value: number, endian?: Endian$1): void;
    /** Writes a signed 32 bit little endian value. */
    writeInt32LE(value: number): void;
    /** Writes a signed 32 bit big endian value. */
    writeInt32BE(value: number): void;
    /** Writes an unsigned 32 bit little endian value. */
    writeUInt32LE(value: number): void;
    /** Writes an unsigned 32 bit big endian value. */
    writeUInt32BE(value: number): void;
    /** Writes a 32 bit float in the given endian order. */
    writeFloat32(value: number, endian?: Endian$1, consume?: boolean): void;
    /** Writes a 32 bit little endian float. */
    writeFloatLE(value: number): void;
    /** Writes a 32 bit big endian float. */
    writeFloatBE(value: number): void;
    /** Writes a 32 bit little endian float. */
    writeFloat32LE(value: number): void;
    /** Writes a 32 bit big endian float. */
    writeFloat32BE(value: number): void;
    /** Writes a 16 bit half float in the given endian order. */
    writeFloat16(value: number, endian?: Endian$1, consume?: boolean): void;
    /** Writes a 16 bit little endian half float. */
    writeHalfFloatLE(value: number): void;
    /** Writes a 16 bit big endian half float. */
    writeHalfFloatBE(value: number): void;
    /** Writes a 16 bit little endian half float. */
    writeFloat16LE(value: number): void;
    /** Writes a 16 bit big endian half float. */
    writeFloat16BE(value: number): void;
    /** Writes a 64 bit double float in the given endian order. */
    writeFloat64(value: number, endian?: Endian$1, consume?: boolean): void;
    /** Writes a 64 bit little endian double float. */
    writeDoubleFloatLE(value: number): void;
    /** Writes a 64 bit big endian double float. */
    writeDoubleFloatBE(value: number): void;
    /** Writes a 64 bit little endian double float. */
    writeFloat64LE(value: number): void;
    /** Writes a 64 bit big endian double float. */
    writeFloat64BE(value: number): void;
    /** Writes an unsigned 64 bit value in the given endian order. */
    writeUInt64(value: number | bigint, endian?: Endian$1): void;
    /** Writes a signed 64 bit little endian value. */
    writeInt64LE(value: number | bigint): void;
    /** Writes a signed 64 bit big endian value. */
    writeInt64BE(value: number | bigint): void;
    /** Writes an unsigned 64 bit little endian value. */
    writeUInt64LE(value: number | bigint): void;
    /** Writes an unsigned 64 bit big endian value. */
    writeUInt64BE(value: number | bigint): void;
    /** Writes an unsigned bit field of 1-32 bits in big endian order. */
    writeUBitBE(value: number, bits: number): void;
    /** Writes an unsigned bit field of 1-32 bits in little endian order. */
    writeUBitLE(value: number, bits: number): void;
    /** Writes a bit field of 1-32 bits in big endian order. */
    writeBitBE(value: number, bits: number, unsigned?: boolean): void;
    /** Writes a bit field of 1-32 bits in little endian order. */
    writeBitLE(value: number, bits: number, unsigned?: boolean): void;
    /** Current buffer size in bits. */
    get bitSize(): number;
    /** Current buffer size in bytes. */
    get length(): number;
    /** Current buffer size in bytes. */
    get len(): number;
    /** Current buffer / file size in bytes. */
    get fileSize(): number;
    /** Current buffer / file size in bytes. */
    get FileSize(): number;
    /** Current buffer size in bits. */
    get lengthBits(): number;
    /** Current buffer size in bits. */
    get sizeBits(): number;
    /** Current buffer / file size in bits. */
    get fileBitSize(): number;
    /** Current buffer / file size in bits. */
    get fileSizeBits(): number;
    /** Current buffer size in bits. */
    get lenBits(): number;
    /** Current byte position. */
    get off(): number;
    /** Current byte position. */
    get getOffset(): number;
    /** Current byte position. */
    get tell(): number;
    /** Current byte position. */
    get FTell(): number;
    /** Current byte position. */
    get saveOffset(): number;
    /** Current byte position. */
    get byteOffset(): number;
    /** Moves the current byte position. */
    set setOffset(value: number);
    /** Moves the current byte position. */
    set setByteOffset(value: number);
    /** Current absolute bit position. */
    get offsetBits(): number;
    /** Current absolute bit position. */
    get getBitOffset(): number;
    /** Current absolute bit position. */
    get saveBitOffset(): number;
    /** Current absolute bit position. */
    get FTellBits(): number;
    /** Current bit position within the current byte (0-7). */
    get tellBits(): number;
    /** Current absolute bit position. */
    get offBits(): number;
    /** Moves to an absolute bit position. */
    set setOffsetBits(value: number);
    /** Moves to an absolute bit position. */
    set setBitOffset(value: number);
    /** Current bit position within the current byte (0-7). */
    get getInsetBit(): number;
    /** Current bit position within the current byte (0-7). */
    get saveInsetBit(): number;
    /** Current bit position within the current byte (0-7). */
    get inBit(): number;
    /** Current bit position within the current byte (0-7). */
    get bitTell(): number;
    /** Moves the bit position within the current byte (0-7). */
    set setInsetBit(value: number);
    /** Bytes remaining between the current byte position and the end of the data. */
    get remain(): number;
    /** Bytes remaining between the current byte position and the end of the data. */
    get remainBytes(): number;
    /** Bytes remaining between the current byte position and the end of the data. */
    get FEoF(): number;
    /** Bits remaining between the current bit position and the end of the data. */
    get remainBits(): number;
    /** Bits remaining between the current bit position and the end of the data. */
    get FEoFBits(): number;
    /** Row line of the current byte position (16 bytes per row). */
    get getLine(): number;
    /** Row line of the current byte position (16 bytes per row). */
    get row(): number;
    /** Alias of {@link skip} - moves the position by a relative number of bytes / bits. */
    jump(bytes: number, bits?: number): void;
    /** Alias of {@link skip} - moves the position by a relative number of bytes / bits. */
    seek(bytes: number, bits?: number): void;
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    FSeek(byte: number, bit?: number): void;
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    pointer(byte: number, bit?: number): void;
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    warp(byte: number, bit?: number): void;
    /** Alias of {@link rewind} - moves the current byte position to the start of the data. */
    gotoStart(): void;
    /** Alias of {@link last} - moves the current byte position to the end of the data. */
    gotoEnd(): void;
    /** Alias of {@link last} - moves the current byte position to the end of the data. */
    EoF(): void;
    /** True when the value is a `Buffer` or `Uint8Array`. */
    isBufferOrUint8Array(obj: any): obj is Uint8Array;
    /** True when the value is a Node `Buffer`. */
    isBuffer(obj: any): obj is Uint8Array;
    /** True when the value is a plain `Uint8Array` (not a `Buffer`). */
    isUint8Array(obj: any): boolean;
    /** Turns strict mode on - the data won't be extended past its max size. */
    restrict(): void;
    /** Turns strict mode off - the data is extended when writing past its max size. */
    unrestrict(): void;
    /** Turns off the hexdump on error (default). */
    errorDumpOff(): void;
    /** Turns on the hexdump on error. */
    errorDumpOn(): void;
    /** Merges default string options used by the `str` get / set and the string presets. */
    set strSettings(settings: stringOptions);
    /** Console logs the data as a hex dump, or returns it as a string with `returnString`. */
    hexdump(options?: hexdumpOptions): void | string;
    /** The full current buffer data (as the source's native type), or null when no source is open. */
    get data(): BytesOut | null;
    /** A `DataView` over the current buffer data, or null when no source is open. */
    get view(): DataView | null;
    /** Commits any pending edits to the file. */
    commit(): void;
    /** Flushes any pending edits through to the underlying source. */
    flush(): void;
    /**
     * Returns the supplied data, trimmed to the current write position when `growthIncrement`
     * expanded the buffer. Use `.data` for the full padded buffer.
     */
    get(): BytesOut;
    /** Alias of {@link get} - returns the supplied data. */
    getData(): BytesOut;
    /** Alias of {@link get} - returns the supplied data. */
    getFullBuffer(): BytesOut;
    /** Alias of {@link get} - returns the supplied data. */
    return(): BytesOut;
    /** Alias of {@link close} - flushes and releases the supplied data. */
    end(): BytesOut | void;
    /** Alias of {@link close} - flushes and releases the supplied data. */
    done(): BytesOut | void;
    /** Alias of {@link close} - flushes and releases the supplied data. */
    finished(): BytesOut | void;
    /** Commits any edits and closes the file. In memory mode returns the buffer instead. */
    close(): BytesOut | void;
    /** Enables or disables writing and expanding (sets `strict` and `readOnly`). Reopens the file in file mode. */
    writeMode(mode?: boolean): void;
    /** Renames the file on the file system, keeping the read / write position. This is permanent. */
    renameFile(newFilePath: string): void;
    /** Unlinks the file from the file system. This is permanent - it does not go to the recycling bin. */
    deleteFile(): void;
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
declare class BiReader<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false> extends BiSyncEngine<alwaysBigInt, BytesOutput<DataType>> {
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
    /** Read a signed 8-bit integer. */
    get byte(): number;
    /** Read a signed 8-bit integer. */
    get int8(): number;
    /** Read an unsigned 8-bit integer. */
    get uint8(): number;
    /** Read an unsigned 8-bit integer. */
    get ubyte(): number;
    /** Read a signed 16-bit integer. */
    get int16(): number;
    /** Read a signed 16-bit integer. */
    get short(): number;
    /** Read a signed 16-bit integer. */
    get word(): number;
    /** Read an unsigned 16-bit integer. */
    get uint16(): number;
    /** Read an unsigned 16-bit integer. */
    get ushort(): number;
    /** Read an unsigned 16-bit integer. */
    get uword(): number;
    /** Read a signed 16-bit integer (little-endian). */
    get int16le(): number;
    /** Read a signed 16-bit integer (little-endian). */
    get shortle(): number;
    /** Read a signed 16-bit integer (little-endian). */
    get wordle(): number;
    /** Read an unsigned 16-bit integer (little-endian). */
    get uint16le(): number;
    /** Read an unsigned 16-bit integer (little-endian). */
    get ushortle(): number;
    /** Read an unsigned 16-bit integer (little-endian). */
    get uwordle(): number;
    /** Read a signed 16-bit integer (big-endian). */
    get int16be(): number;
    /** Read a signed 16-bit integer (big-endian). */
    get shortbe(): number;
    /** Read a signed 16-bit integer (big-endian). */
    get wordbe(): number;
    /** Read an unsigned 16-bit integer (big-endian). */
    get uint16be(): number;
    /** Read an unsigned 16-bit integer (big-endian). */
    get ushortbe(): number;
    /** Read an unsigned 16-bit integer (big-endian). */
    get uwordbe(): number;
    /** Read a signed 32-bit integer. */
    get int(): number;
    /** Read a signed 32-bit integer. */
    get dword(): number;
    /** Read a signed 32-bit integer. */
    get int32(): number;
    /** Read a signed 32-bit integer. */
    get long(): number;
    /** Read an unsigned 32-bit integer. */
    get uint(): number;
    /** Read an unsigned 32-bit integer. */
    get udword(): number;
    /** Read an unsigned 32-bit integer. */
    get uint32(): number;
    /** Read an unsigned 32-bit integer. */
    get ulong(): number;
    /** Read a signed 32-bit integer (little-endian). */
    get intle(): number;
    /** Read a signed 32-bit integer (little-endian). */
    get dwordle(): number;
    /** Read a signed 32-bit integer (little-endian). */
    get int32le(): number;
    /** Read a signed 32-bit integer (little-endian). */
    get longle(): number;
    /** Read an unsigned 32-bit integer (little-endian). */
    get uintle(): number;
    /** Read an unsigned 32-bit integer (little-endian). */
    get udwordle(): number;
    /** Read an unsigned 32-bit integer (little-endian). */
    get uint32le(): number;
    /** Read an unsigned 32-bit integer (little-endian). */
    get ulongle(): number;
    /** Read a signed 32-bit integer (big-endian). */
    get intbe(): number;
    /** Read a signed 32-bit integer (big-endian). */
    get dwordbe(): number;
    /** Read a signed 32-bit integer (big-endian). */
    get int32be(): number;
    /** Read a signed 32-bit integer (big-endian). */
    get longbe(): number;
    /** Read an unsigned 32-bit integer (big-endian). */
    get uintbe(): number;
    /** Read an unsigned 32-bit integer (big-endian). */
    get udwordbe(): number;
    /** Read an unsigned 32-bit integer (big-endian). */
    get uint32be(): number;
    /** Read an unsigned 32-bit integer (big-endian). */
    get ulongbe(): number;
    /** Read a signed 64-bit integer. */
    get int64(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a signed 64-bit integer. */
    get bigint(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a signed 64-bit integer. */
    get quad(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer. */
    get uint64(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer. */
    get ubigint(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer. */
    get uquad(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a signed 64-bit integer (little-endian). */
    get int64le(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a signed 64-bit integer (little-endian). */
    get bigintle(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a signed 64-bit integer (little-endian). */
    get quadle(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer (little-endian). */
    get uint64le(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer (little-endian). */
    get ubigintle(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer (little-endian). */
    get uquadle(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a signed 64-bit integer (big-endian). */
    get int64be(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a signed 64-bit integer (big-endian). */
    get bigintbe(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a signed 64-bit integer (big-endian). */
    get quadbe(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer (big-endian). */
    get uint64be(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer (big-endian). */
    get ubigintbe(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read an unsigned 64-bit integer (big-endian). */
    get uquadbe(): alwaysBigInt extends true ? bigint : BigValue;
    /** Read a 32-bit float. */
    get float(): number;
    /** Read a 32-bit float (little-endian). */
    get floatle(): number;
    /** Read a 32-bit float (big-endian). */
    get floatbe(): number;
    /** Read a 16-bit float. */
    get halffloat(): number;
    /** Read a 16-bit float. */
    get half(): number;
    /** Read a 16-bit float (little-endian). */
    get halffloatle(): number;
    /** Read a 16-bit float (little-endian). */
    get halfle(): number;
    /** Read a 16-bit float (big-endian). */
    get halffloatbe(): number;
    /** Read a 16-bit float (big-endian). */
    get halfbe(): number;
    /** Read a 64-bit float. */
    get doublefloat(): number;
    /** Read a 64-bit float. */
    get dfloat(): number;
    /** Read a 64-bit float (little-endian). */
    get doublefloatle(): number;
    /** Read a 64-bit float (little-endian). */
    get dfloatle(): number;
    /** Read a 64-bit float (big-endian). */
    get doublefloatbe(): number;
    /** Read a 64-bit float (big-endian). */
    get dfloatbe(): number;
    /** Read 1 signed bit. */
    get bit1(): number;
    /** Read 1 unsigned bit. */
    get ubit1(): number;
    /** Read 1 signed bit (little-endian). */
    get bit1le(): number;
    /** Read 1 unsigned bit (little-endian). */
    get ubit1le(): number;
    /** Read 1 signed bit (big-endian). */
    get bit1be(): number;
    /** Read 1 unsigned bit (big-endian). */
    get ubit1be(): number;
    /** Read 2 signed bits. */
    get bit2(): number;
    /** Read 2 unsigned bits. */
    get ubit2(): number;
    /** Read 2 signed bits (little-endian). */
    get bit2le(): number;
    /** Read 2 unsigned bits (little-endian). */
    get ubit2le(): number;
    /** Read 2 signed bits (big-endian). */
    get bit2be(): number;
    /** Read 2 unsigned bits (big-endian). */
    get ubit2be(): number;
    /** Read 3 signed bits. */
    get bit3(): number;
    /** Read 3 unsigned bits. */
    get ubit3(): number;
    /** Read 3 signed bits (little-endian). */
    get bit3le(): number;
    /** Read 3 unsigned bits (little-endian). */
    get ubit3le(): number;
    /** Read 3 signed bits (big-endian). */
    get bit3be(): number;
    /** Read 3 unsigned bits (big-endian). */
    get ubit3be(): number;
    /** Read 4 signed bits. */
    get bit4(): number;
    /** Read 4 unsigned bits. */
    get ubit4(): number;
    /** Read 4 signed bits (little-endian). */
    get bit4le(): number;
    /** Read 4 unsigned bits (little-endian). */
    get ubit4le(): number;
    /** Read 4 signed bits (big-endian). */
    get bit4be(): number;
    /** Read 4 unsigned bits (big-endian). */
    get ubit4be(): number;
    /** Read 5 signed bits. */
    get bit5(): number;
    /** Read 5 unsigned bits. */
    get ubit5(): number;
    /** Read 5 signed bits (little-endian). */
    get bit5le(): number;
    /** Read 5 unsigned bits (little-endian). */
    get ubit5le(): number;
    /** Read 5 signed bits (big-endian). */
    get bit5be(): number;
    /** Read 5 unsigned bits (big-endian). */
    get ubit5be(): number;
    /** Read 6 signed bits. */
    get bit6(): number;
    /** Read 6 unsigned bits. */
    get ubit6(): number;
    /** Read 6 signed bits (little-endian). */
    get bit6le(): number;
    /** Read 6 unsigned bits (little-endian). */
    get ubit6le(): number;
    /** Read 6 signed bits (big-endian). */
    get bit6be(): number;
    /** Read 6 unsigned bits (big-endian). */
    get ubit6be(): number;
    /** Read 7 signed bits. */
    get bit7(): number;
    /** Read 7 unsigned bits. */
    get ubit7(): number;
    /** Read 7 signed bits (little-endian). */
    get bit7le(): number;
    /** Read 7 unsigned bits (little-endian). */
    get ubit7le(): number;
    /** Read 7 signed bits (big-endian). */
    get bit7be(): number;
    /** Read 7 unsigned bits (big-endian). */
    get ubit7be(): number;
    /** Read 8 signed bits. */
    get bit8(): number;
    /** Read 8 unsigned bits. */
    get ubit8(): number;
    /** Read 8 signed bits (little-endian). */
    get bit8le(): number;
    /** Read 8 unsigned bits (little-endian). */
    get ubit8le(): number;
    /** Read 8 signed bits (big-endian). */
    get bit8be(): number;
    /** Read 8 unsigned bits (big-endian). */
    get ubit8be(): number;
    /** Read 9 signed bits. */
    get bit9(): number;
    /** Read 9 unsigned bits. */
    get ubit9(): number;
    /** Read 9 signed bits (little-endian). */
    get bit9le(): number;
    /** Read 9 unsigned bits (little-endian). */
    get ubit9le(): number;
    /** Read 9 signed bits (big-endian). */
    get bit9be(): number;
    /** Read 9 unsigned bits (big-endian). */
    get ubit9be(): number;
    /** Read 10 signed bits. */
    get bit10(): number;
    /** Read 10 unsigned bits. */
    get ubit10(): number;
    /** Read 10 signed bits (little-endian). */
    get bit10le(): number;
    /** Read 10 unsigned bits (little-endian). */
    get ubit10le(): number;
    /** Read 10 signed bits (big-endian). */
    get bit10be(): number;
    /** Read 10 unsigned bits (big-endian). */
    get ubit10be(): number;
    /** Read 11 signed bits. */
    get bit11(): number;
    /** Read 11 unsigned bits. */
    get ubit11(): number;
    /** Read 11 signed bits (little-endian). */
    get bit11le(): number;
    /** Read 11 unsigned bits (little-endian). */
    get ubit11le(): number;
    /** Read 11 signed bits (big-endian). */
    get bit11be(): number;
    /** Read 11 unsigned bits (big-endian). */
    get ubit11be(): number;
    /** Read 12 signed bits. */
    get bit12(): number;
    /** Read 12 unsigned bits. */
    get ubit12(): number;
    /** Read 12 signed bits (little-endian). */
    get bit12le(): number;
    /** Read 12 unsigned bits (little-endian). */
    get ubit12le(): number;
    /** Read 12 signed bits (big-endian). */
    get bit12be(): number;
    /** Read 12 unsigned bits (big-endian). */
    get ubit12be(): number;
    /** Read 13 signed bits. */
    get bit13(): number;
    /** Read 13 unsigned bits. */
    get ubit13(): number;
    /** Read 13 signed bits (little-endian). */
    get bit13le(): number;
    /** Read 13 unsigned bits (little-endian). */
    get ubit13le(): number;
    /** Read 13 signed bits (big-endian). */
    get bit13be(): number;
    /** Read 13 unsigned bits (big-endian). */
    get ubit13be(): number;
    /** Read 14 signed bits. */
    get bit14(): number;
    /** Read 14 unsigned bits. */
    get ubit14(): number;
    /** Read 14 signed bits (little-endian). */
    get bit14le(): number;
    /** Read 14 unsigned bits (little-endian). */
    get ubit14le(): number;
    /** Read 14 signed bits (big-endian). */
    get bit14be(): number;
    /** Read 14 unsigned bits (big-endian). */
    get ubit14be(): number;
    /** Read 15 signed bits. */
    get bit15(): number;
    /** Read 15 unsigned bits. */
    get ubit15(): number;
    /** Read 15 signed bits (little-endian). */
    get bit15le(): number;
    /** Read 15 unsigned bits (little-endian). */
    get ubit15le(): number;
    /** Read 15 signed bits (big-endian). */
    get bit15be(): number;
    /** Read 15 unsigned bits (big-endian). */
    get ubit15be(): number;
    /** Read 16 signed bits. */
    get bit16(): number;
    /** Read 16 unsigned bits. */
    get ubit16(): number;
    /** Read 16 signed bits (little-endian). */
    get bit16le(): number;
    /** Read 16 unsigned bits (little-endian). */
    get ubit16le(): number;
    /** Read 16 signed bits (big-endian). */
    get bit16be(): number;
    /** Read 16 unsigned bits (big-endian). */
    get ubit16be(): number;
    /** Read 17 signed bits. */
    get bit17(): number;
    /** Read 17 unsigned bits. */
    get ubit17(): number;
    /** Read 17 signed bits (little-endian). */
    get bit17le(): number;
    /** Read 17 unsigned bits (little-endian). */
    get ubit17le(): number;
    /** Read 17 signed bits (big-endian). */
    get bit17be(): number;
    /** Read 17 unsigned bits (big-endian). */
    get ubit17be(): number;
    /** Read 18 signed bits. */
    get bit18(): number;
    /** Read 18 unsigned bits. */
    get ubit18(): number;
    /** Read 18 signed bits (little-endian). */
    get bit18le(): number;
    /** Read 18 unsigned bits (little-endian). */
    get ubit18le(): number;
    /** Read 18 signed bits (big-endian). */
    get bit18be(): number;
    /** Read 18 unsigned bits (big-endian). */
    get ubit18be(): number;
    /** Read 19 signed bits. */
    get bit19(): number;
    /** Read 19 unsigned bits. */
    get ubit19(): number;
    /** Read 19 signed bits (little-endian). */
    get bit19le(): number;
    /** Read 19 unsigned bits (little-endian). */
    get ubit19le(): number;
    /** Read 19 signed bits (big-endian). */
    get bit19be(): number;
    /** Read 19 unsigned bits (big-endian). */
    get ubit19be(): number;
    /** Read 20 signed bits. */
    get bit20(): number;
    /** Read 20 unsigned bits. */
    get ubit20(): number;
    /** Read 20 signed bits (little-endian). */
    get bit20le(): number;
    /** Read 20 unsigned bits (little-endian). */
    get ubit20le(): number;
    /** Read 20 signed bits (big-endian). */
    get bit20be(): number;
    /** Read 20 unsigned bits (big-endian). */
    get ubit20be(): number;
    /** Read 21 signed bits. */
    get bit21(): number;
    /** Read 21 unsigned bits. */
    get ubit21(): number;
    /** Read 21 signed bits (little-endian). */
    get bit21le(): number;
    /** Read 21 unsigned bits (little-endian). */
    get ubit21le(): number;
    /** Read 21 signed bits (big-endian). */
    get bit21be(): number;
    /** Read 21 unsigned bits (big-endian). */
    get ubit21be(): number;
    /** Read 22 signed bits. */
    get bit22(): number;
    /** Read 22 unsigned bits. */
    get ubit22(): number;
    /** Read 22 signed bits (little-endian). */
    get bit22le(): number;
    /** Read 22 unsigned bits (little-endian). */
    get ubit22le(): number;
    /** Read 22 signed bits (big-endian). */
    get bit22be(): number;
    /** Read 22 unsigned bits (big-endian). */
    get ubit22be(): number;
    /** Read 23 signed bits. */
    get bit23(): number;
    /** Read 23 unsigned bits. */
    get ubit23(): number;
    /** Read 23 signed bits (little-endian). */
    get bit23le(): number;
    /** Read 23 unsigned bits (little-endian). */
    get ubit23le(): number;
    /** Read 23 signed bits (big-endian). */
    get bit23be(): number;
    /** Read 23 unsigned bits (big-endian). */
    get ubit23be(): number;
    /** Read 24 signed bits. */
    get bit24(): number;
    /** Read 24 unsigned bits. */
    get ubit24(): number;
    /** Read 24 signed bits (little-endian). */
    get bit24le(): number;
    /** Read 24 unsigned bits (little-endian). */
    get ubit24le(): number;
    /** Read 24 signed bits (big-endian). */
    get bit24be(): number;
    /** Read 24 unsigned bits (big-endian). */
    get ubit24be(): number;
    /** Read 25 signed bits. */
    get bit25(): number;
    /** Read 25 unsigned bits. */
    get ubit25(): number;
    /** Read 25 signed bits (little-endian). */
    get bit25le(): number;
    /** Read 25 unsigned bits (little-endian). */
    get ubit25le(): number;
    /** Read 25 signed bits (big-endian). */
    get bit25be(): number;
    /** Read 25 unsigned bits (big-endian). */
    get ubit25be(): number;
    /** Read 26 signed bits. */
    get bit26(): number;
    /** Read 26 unsigned bits. */
    get ubit26(): number;
    /** Read 26 signed bits (little-endian). */
    get bit26le(): number;
    /** Read 26 unsigned bits (little-endian). */
    get ubit26le(): number;
    /** Read 26 signed bits (big-endian). */
    get bit26be(): number;
    /** Read 26 unsigned bits (big-endian). */
    get ubit26be(): number;
    /** Read 27 signed bits. */
    get bit27(): number;
    /** Read 27 unsigned bits. */
    get ubit27(): number;
    /** Read 27 signed bits (little-endian). */
    get bit27le(): number;
    /** Read 27 unsigned bits (little-endian). */
    get ubit27le(): number;
    /** Read 27 signed bits (big-endian). */
    get bit27be(): number;
    /** Read 27 unsigned bits (big-endian). */
    get ubit27be(): number;
    /** Read 28 signed bits. */
    get bit28(): number;
    /** Read 28 unsigned bits. */
    get ubit28(): number;
    /** Read 28 signed bits (little-endian). */
    get bit28le(): number;
    /** Read 28 unsigned bits (little-endian). */
    get ubit28le(): number;
    /** Read 28 signed bits (big-endian). */
    get bit28be(): number;
    /** Read 28 unsigned bits (big-endian). */
    get ubit28be(): number;
    /** Read 29 signed bits. */
    get bit29(): number;
    /** Read 29 unsigned bits. */
    get ubit29(): number;
    /** Read 29 signed bits (little-endian). */
    get bit29le(): number;
    /** Read 29 unsigned bits (little-endian). */
    get ubit29le(): number;
    /** Read 29 signed bits (big-endian). */
    get bit29be(): number;
    /** Read 29 unsigned bits (big-endian). */
    get ubit29be(): number;
    /** Read 30 signed bits. */
    get bit30(): number;
    /** Read 30 unsigned bits. */
    get ubit30(): number;
    /** Read 30 signed bits (little-endian). */
    get bit30le(): number;
    /** Read 30 unsigned bits (little-endian). */
    get ubit30le(): number;
    /** Read 30 signed bits (big-endian). */
    get bit30be(): number;
    /** Read 30 unsigned bits (big-endian). */
    get ubit30be(): number;
    /** Read 31 signed bits. */
    get bit31(): number;
    /** Read 31 unsigned bits. */
    get ubit31(): number;
    /** Read 31 signed bits (little-endian). */
    get bit31le(): number;
    /** Read 31 unsigned bits (little-endian). */
    get ubit31le(): number;
    /** Read 31 signed bits (big-endian). */
    get bit31be(): number;
    /** Read 31 unsigned bits (big-endian). */
    get ubit31be(): number;
    /** Read 32 signed bits. */
    get bit32(): number;
    /** Read 32 unsigned bits. */
    get ubit32(): number;
    /** Read 32 signed bits (little-endian). */
    get bit32le(): number;
    /** Read 32 unsigned bits (little-endian). */
    get ubit32le(): number;
    /** Read 32 signed bits (big-endian). */
    get bit32be(): number;
    /** Read 32 unsigned bits (big-endian). */
    get ubit32be(): number;
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
    latin1string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string;
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
    * Reads Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string;
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
    * Reads Wide Pascal string 1 byte length read in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Wide Pascal string 1 byte length read in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string;
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
    * Reads Double Wide Pascal string 1 byte length read in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string;
    /**
    * Reads Double Wide Pascal string 1 byte length read in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): string;
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
declare class BiWriter<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false> extends BiSyncEngine<alwaysBigInt, BytesOutput<DataType>> {
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
    /** Write a signed 8-bit integer. */
    set byte(value: number);
    /** Write a signed 8-bit integer. */
    set int8(value: number);
    /** Write an unsigned 8-bit integer. */
    set uint8(value: number);
    /** Write an unsigned 8-bit integer. */
    set ubyte(value: number);
    /** Write a signed 16-bit integer. */
    set int16(value: number);
    /** Write a signed 16-bit integer. */
    set short(value: number);
    /** Write a signed 16-bit integer. */
    set word(value: number);
    /** Write an unsigned 16-bit integer. */
    set uint16(value: number);
    /** Write an unsigned 16-bit integer. */
    set ushort(value: number);
    /** Write an unsigned 16-bit integer. */
    set uword(value: number);
    /** Write a signed 16-bit integer (little-endian). */
    set int16le(value: number);
    /** Write a signed 16-bit integer (little-endian). */
    set shortle(value: number);
    /** Write a signed 16-bit integer (little-endian). */
    set wordle(value: number);
    /** Write an unsigned 16-bit integer (little-endian). */
    set uint16le(value: number);
    /** Write an unsigned 16-bit integer (little-endian). */
    set ushortle(value: number);
    /** Write an unsigned 16-bit integer (little-endian). */
    set uwordle(value: number);
    /** Write a signed 16-bit integer (big-endian). */
    set int16be(value: number);
    /** Write a signed 16-bit integer (big-endian). */
    set shortbe(value: number);
    /** Write a signed 16-bit integer (big-endian). */
    set wordbe(value: number);
    /** Write an unsigned 16-bit integer (big-endian). */
    set uint16be(value: number);
    /** Write an unsigned 16-bit integer (big-endian). */
    set ushortbe(value: number);
    /** Write an unsigned 16-bit integer (big-endian). */
    set uwordbe(value: number);
    /** Write a signed 32-bit integer. */
    set int(value: number);
    /** Write a signed 32-bit integer. */
    set dword(value: number);
    /** Write a signed 32-bit integer. */
    set int32(value: number);
    /** Write a signed 32-bit integer. */
    set long(value: number);
    /** Write an unsigned 32-bit integer. */
    set uint(value: number);
    /** Write an unsigned 32-bit integer. */
    set udword(value: number);
    /** Write an unsigned 32-bit integer. */
    set uint32(value: number);
    /** Write an unsigned 32-bit integer. */
    set ulong(value: number);
    /** Write a signed 32-bit integer (little-endian). */
    set intle(value: number);
    /** Write a signed 32-bit integer (little-endian). */
    set dwordle(value: number);
    /** Write a signed 32-bit integer (little-endian). */
    set int32le(value: number);
    /** Write a signed 32-bit integer (little-endian). */
    set longle(value: number);
    /** Write an unsigned 32-bit integer (little-endian). */
    set uintle(value: number);
    /** Write an unsigned 32-bit integer (little-endian). */
    set udwordle(value: number);
    /** Write an unsigned 32-bit integer (little-endian). */
    set uint32le(value: number);
    /** Write an unsigned 32-bit integer (little-endian). */
    set ulongle(value: number);
    /** Write a signed 32-bit integer (big-endian). */
    set intbe(value: number);
    /** Write a signed 32-bit integer (big-endian). */
    set dwordbe(value: number);
    /** Write a signed 32-bit integer (big-endian). */
    set int32be(value: number);
    /** Write a signed 32-bit integer (big-endian). */
    set longbe(value: number);
    /** Write an unsigned 32-bit integer (big-endian). */
    set uintbe(value: number);
    /** Write an unsigned 32-bit integer (big-endian). */
    set udwordbe(value: number);
    /** Write an unsigned 32-bit integer (big-endian). */
    set uint32be(value: number);
    /** Write an unsigned 32-bit integer (big-endian). */
    set ulongbe(value: number);
    /** Write a signed 64-bit integer. */
    set int64(value: BigValue);
    /** Write a signed 64-bit integer. */
    set bigint(value: BigValue);
    /** Write a signed 64-bit integer. */
    set quad(value: BigValue);
    /** Write an unsigned 64-bit integer. */
    set uint64(value: BigValue);
    /** Write an unsigned 64-bit integer. */
    set ubigint(value: BigValue);
    /** Write an unsigned 64-bit integer. */
    set uquad(value: BigValue);
    /** Write a signed 64-bit integer (little-endian). */
    set int64le(value: BigValue);
    /** Write a signed 64-bit integer (little-endian). */
    set bigintle(value: BigValue);
    /** Write a signed 64-bit integer (little-endian). */
    set quadle(value: BigValue);
    /** Write an unsigned 64-bit integer (little-endian). */
    set uint64le(value: BigValue);
    /** Write an unsigned 64-bit integer (little-endian). */
    set ubigintle(value: BigValue);
    /** Write an unsigned 64-bit integer (little-endian). */
    set uquadle(value: BigValue);
    /** Write a signed 64-bit integer (big-endian). */
    set int64be(value: BigValue);
    /** Write a signed 64-bit integer (big-endian). */
    set bigintbe(value: BigValue);
    /** Write a signed 64-bit integer (big-endian). */
    set quadbe(value: BigValue);
    /** Write an unsigned 64-bit integer (big-endian). */
    set uint64be(value: BigValue);
    /** Write an unsigned 64-bit integer (big-endian). */
    set ubigintbe(value: BigValue);
    /** Write an unsigned 64-bit integer (big-endian). */
    set uquadbe(value: BigValue);
    /** Write a 32-bit float. */
    set float(value: number);
    /** Write a 32-bit float (little-endian). */
    set floatle(value: number);
    /** Write a 32-bit float (big-endian). */
    set floatbe(value: number);
    /** Write a 16-bit float. */
    set halffloat(value: number);
    /** Write a 16-bit float. */
    set half(value: number);
    /** Write a 16-bit float (little-endian). */
    set halffloatle(value: number);
    /** Write a 16-bit float (little-endian). */
    set halfle(value: number);
    /** Write a 16-bit float (big-endian). */
    set halffloatbe(value: number);
    /** Write a 16-bit float (big-endian). */
    set halfbe(value: number);
    /** Write a 64-bit float. */
    set doublefloat(value: number);
    /** Write a 64-bit float. */
    set dfloat(value: number);
    /** Write a 64-bit float (little-endian). */
    set doublefloatle(value: number);
    /** Write a 64-bit float (little-endian). */
    set dfloatle(value: number);
    /** Write a 64-bit float (big-endian). */
    set doublefloatbe(value: number);
    /** Write a 64-bit float (big-endian). */
    set dfloatbe(value: number);
    /** Write 1 signed bit. */
    set bit1(value: number);
    /** Write 1 unsigned bit. */
    set ubit1(value: number);
    /** Write 1 signed bit (little-endian). */
    set bit1le(value: number);
    /** Write 1 unsigned bit (little-endian). */
    set ubit1le(value: number);
    /** Write 1 signed bit (big-endian). */
    set bit1be(value: number);
    /** Write 1 unsigned bit (big-endian). */
    set ubit1be(value: number);
    /** Write 2 signed bits. */
    set bit2(value: number);
    /** Write 2 unsigned bits. */
    set ubit2(value: number);
    /** Write 2 signed bits (little-endian). */
    set bit2le(value: number);
    /** Write 2 unsigned bits (little-endian). */
    set ubit2le(value: number);
    /** Write 2 signed bits (big-endian). */
    set bit2be(value: number);
    /** Write 2 unsigned bits (big-endian). */
    set ubit2be(value: number);
    /** Write 3 signed bits. */
    set bit3(value: number);
    /** Write 3 unsigned bits. */
    set ubit3(value: number);
    /** Write 3 signed bits (little-endian). */
    set bit3le(value: number);
    /** Write 3 unsigned bits (little-endian). */
    set ubit3le(value: number);
    /** Write 3 signed bits (big-endian). */
    set bit3be(value: number);
    /** Write 3 unsigned bits (big-endian). */
    set ubit3be(value: number);
    /** Write 4 signed bits. */
    set bit4(value: number);
    /** Write 4 unsigned bits. */
    set ubit4(value: number);
    /** Write 4 signed bits (little-endian). */
    set bit4le(value: number);
    /** Write 4 unsigned bits (little-endian). */
    set ubit4le(value: number);
    /** Write 4 signed bits (big-endian). */
    set bit4be(value: number);
    /** Write 4 unsigned bits (big-endian). */
    set ubit4be(value: number);
    /** Write 5 signed bits. */
    set bit5(value: number);
    /** Write 5 unsigned bits. */
    set ubit5(value: number);
    /** Write 5 signed bits (little-endian). */
    set bit5le(value: number);
    /** Write 5 unsigned bits (little-endian). */
    set ubit5le(value: number);
    /** Write 5 signed bits (big-endian). */
    set bit5be(value: number);
    /** Write 5 unsigned bits (big-endian). */
    set ubit5be(value: number);
    /** Write 6 signed bits. */
    set bit6(value: number);
    /** Write 6 unsigned bits. */
    set ubit6(value: number);
    /** Write 6 signed bits (little-endian). */
    set bit6le(value: number);
    /** Write 6 unsigned bits (little-endian). */
    set ubit6le(value: number);
    /** Write 6 signed bits (big-endian). */
    set bit6be(value: number);
    /** Write 6 unsigned bits (big-endian). */
    set ubit6be(value: number);
    /** Write 7 signed bits. */
    set bit7(value: number);
    /** Write 7 unsigned bits. */
    set ubit7(value: number);
    /** Write 7 signed bits (little-endian). */
    set bit7le(value: number);
    /** Write 7 unsigned bits (little-endian). */
    set ubit7le(value: number);
    /** Write 7 signed bits (big-endian). */
    set bit7be(value: number);
    /** Write 7 unsigned bits (big-endian). */
    set ubit7be(value: number);
    /** Write 8 signed bits. */
    set bit8(value: number);
    /** Write 8 unsigned bits. */
    set ubit8(value: number);
    /** Write 8 signed bits (little-endian). */
    set bit8le(value: number);
    /** Write 8 unsigned bits (little-endian). */
    set ubit8le(value: number);
    /** Write 8 signed bits (big-endian). */
    set bit8be(value: number);
    /** Write 8 unsigned bits (big-endian). */
    set ubit8be(value: number);
    /** Write 9 signed bits. */
    set bit9(value: number);
    /** Write 9 unsigned bits. */
    set ubit9(value: number);
    /** Write 9 signed bits (little-endian). */
    set bit9le(value: number);
    /** Write 9 unsigned bits (little-endian). */
    set ubit9le(value: number);
    /** Write 9 signed bits (big-endian). */
    set bit9be(value: number);
    /** Write 9 unsigned bits (big-endian). */
    set ubit9be(value: number);
    /** Write 10 signed bits. */
    set bit10(value: number);
    /** Write 10 unsigned bits. */
    set ubit10(value: number);
    /** Write 10 signed bits (little-endian). */
    set bit10le(value: number);
    /** Write 10 unsigned bits (little-endian). */
    set ubit10le(value: number);
    /** Write 10 signed bits (big-endian). */
    set bit10be(value: number);
    /** Write 10 unsigned bits (big-endian). */
    set ubit10be(value: number);
    /** Write 11 signed bits. */
    set bit11(value: number);
    /** Write 11 unsigned bits. */
    set ubit11(value: number);
    /** Write 11 signed bits (little-endian). */
    set bit11le(value: number);
    /** Write 11 unsigned bits (little-endian). */
    set ubit11le(value: number);
    /** Write 11 signed bits (big-endian). */
    set bit11be(value: number);
    /** Write 11 unsigned bits (big-endian). */
    set ubit11be(value: number);
    /** Write 12 signed bits. */
    set bit12(value: number);
    /** Write 12 unsigned bits. */
    set ubit12(value: number);
    /** Write 12 signed bits (little-endian). */
    set bit12le(value: number);
    /** Write 12 unsigned bits (little-endian). */
    set ubit12le(value: number);
    /** Write 12 signed bits (big-endian). */
    set bit12be(value: number);
    /** Write 12 unsigned bits (big-endian). */
    set ubit12be(value: number);
    /** Write 13 signed bits. */
    set bit13(value: number);
    /** Write 13 unsigned bits. */
    set ubit13(value: number);
    /** Write 13 signed bits (little-endian). */
    set bit13le(value: number);
    /** Write 13 unsigned bits (little-endian). */
    set ubit13le(value: number);
    /** Write 13 signed bits (big-endian). */
    set bit13be(value: number);
    /** Write 13 unsigned bits (big-endian). */
    set ubit13be(value: number);
    /** Write 14 signed bits. */
    set bit14(value: number);
    /** Write 14 unsigned bits. */
    set ubit14(value: number);
    /** Write 14 signed bits (little-endian). */
    set bit14le(value: number);
    /** Write 14 unsigned bits (little-endian). */
    set ubit14le(value: number);
    /** Write 14 signed bits (big-endian). */
    set bit14be(value: number);
    /** Write 14 unsigned bits (big-endian). */
    set ubit14be(value: number);
    /** Write 15 signed bits. */
    set bit15(value: number);
    /** Write 15 unsigned bits. */
    set ubit15(value: number);
    /** Write 15 signed bits (little-endian). */
    set bit15le(value: number);
    /** Write 15 unsigned bits (little-endian). */
    set ubit15le(value: number);
    /** Write 15 signed bits (big-endian). */
    set bit15be(value: number);
    /** Write 15 unsigned bits (big-endian). */
    set ubit15be(value: number);
    /** Write 16 signed bits. */
    set bit16(value: number);
    /** Write 16 unsigned bits. */
    set ubit16(value: number);
    /** Write 16 signed bits (little-endian). */
    set bit16le(value: number);
    /** Write 16 unsigned bits (little-endian). */
    set ubit16le(value: number);
    /** Write 16 signed bits (big-endian). */
    set bit16be(value: number);
    /** Write 16 unsigned bits (big-endian). */
    set ubit16be(value: number);
    /** Write 17 signed bits. */
    set bit17(value: number);
    /** Write 17 unsigned bits. */
    set ubit17(value: number);
    /** Write 17 signed bits (little-endian). */
    set bit17le(value: number);
    /** Write 17 unsigned bits (little-endian). */
    set ubit17le(value: number);
    /** Write 17 signed bits (big-endian). */
    set bit17be(value: number);
    /** Write 17 unsigned bits (big-endian). */
    set ubit17be(value: number);
    /** Write 18 signed bits. */
    set bit18(value: number);
    /** Write 18 unsigned bits. */
    set ubit18(value: number);
    /** Write 18 signed bits (little-endian). */
    set bit18le(value: number);
    /** Write 18 unsigned bits (little-endian). */
    set ubit18le(value: number);
    /** Write 18 signed bits (big-endian). */
    set bit18be(value: number);
    /** Write 18 unsigned bits (big-endian). */
    set ubit18be(value: number);
    /** Write 19 signed bits. */
    set bit19(value: number);
    /** Write 19 unsigned bits. */
    set ubit19(value: number);
    /** Write 19 signed bits (little-endian). */
    set bit19le(value: number);
    /** Write 19 unsigned bits (little-endian). */
    set ubit19le(value: number);
    /** Write 19 signed bits (big-endian). */
    set bit19be(value: number);
    /** Write 19 unsigned bits (big-endian). */
    set ubit19be(value: number);
    /** Write 20 signed bits. */
    set bit20(value: number);
    /** Write 20 unsigned bits. */
    set ubit20(value: number);
    /** Write 20 signed bits (little-endian). */
    set bit20le(value: number);
    /** Write 20 unsigned bits (little-endian). */
    set ubit20le(value: number);
    /** Write 20 signed bits (big-endian). */
    set bit20be(value: number);
    /** Write 20 unsigned bits (big-endian). */
    set ubit20be(value: number);
    /** Write 21 signed bits. */
    set bit21(value: number);
    /** Write 21 unsigned bits. */
    set ubit21(value: number);
    /** Write 21 signed bits (little-endian). */
    set bit21le(value: number);
    /** Write 21 unsigned bits (little-endian). */
    set ubit21le(value: number);
    /** Write 21 signed bits (big-endian). */
    set bit21be(value: number);
    /** Write 21 unsigned bits (big-endian). */
    set ubit21be(value: number);
    /** Write 22 signed bits. */
    set bit22(value: number);
    /** Write 22 unsigned bits. */
    set ubit22(value: number);
    /** Write 22 signed bits (little-endian). */
    set bit22le(value: number);
    /** Write 22 unsigned bits (little-endian). */
    set ubit22le(value: number);
    /** Write 22 signed bits (big-endian). */
    set bit22be(value: number);
    /** Write 22 unsigned bits (big-endian). */
    set ubit22be(value: number);
    /** Write 23 signed bits. */
    set bit23(value: number);
    /** Write 23 unsigned bits. */
    set ubit23(value: number);
    /** Write 23 signed bits (little-endian). */
    set bit23le(value: number);
    /** Write 23 unsigned bits (little-endian). */
    set ubit23le(value: number);
    /** Write 23 signed bits (big-endian). */
    set bit23be(value: number);
    /** Write 23 unsigned bits (big-endian). */
    set ubit23be(value: number);
    /** Write 24 signed bits. */
    set bit24(value: number);
    /** Write 24 unsigned bits. */
    set ubit24(value: number);
    /** Write 24 signed bits (little-endian). */
    set bit24le(value: number);
    /** Write 24 unsigned bits (little-endian). */
    set ubit24le(value: number);
    /** Write 24 signed bits (big-endian). */
    set bit24be(value: number);
    /** Write 24 unsigned bits (big-endian). */
    set ubit24be(value: number);
    /** Write 25 signed bits. */
    set bit25(value: number);
    /** Write 25 unsigned bits. */
    set ubit25(value: number);
    /** Write 25 signed bits (little-endian). */
    set bit25le(value: number);
    /** Write 25 unsigned bits (little-endian). */
    set ubit25le(value: number);
    /** Write 25 signed bits (big-endian). */
    set bit25be(value: number);
    /** Write 25 unsigned bits (big-endian). */
    set ubit25be(value: number);
    /** Write 26 signed bits. */
    set bit26(value: number);
    /** Write 26 unsigned bits. */
    set ubit26(value: number);
    /** Write 26 signed bits (little-endian). */
    set bit26le(value: number);
    /** Write 26 unsigned bits (little-endian). */
    set ubit26le(value: number);
    /** Write 26 signed bits (big-endian). */
    set bit26be(value: number);
    /** Write 26 unsigned bits (big-endian). */
    set ubit26be(value: number);
    /** Write 27 signed bits. */
    set bit27(value: number);
    /** Write 27 unsigned bits. */
    set ubit27(value: number);
    /** Write 27 signed bits (little-endian). */
    set bit27le(value: number);
    /** Write 27 unsigned bits (little-endian). */
    set ubit27le(value: number);
    /** Write 27 signed bits (big-endian). */
    set bit27be(value: number);
    /** Write 27 unsigned bits (big-endian). */
    set ubit27be(value: number);
    /** Write 28 signed bits. */
    set bit28(value: number);
    /** Write 28 unsigned bits. */
    set ubit28(value: number);
    /** Write 28 signed bits (little-endian). */
    set bit28le(value: number);
    /** Write 28 unsigned bits (little-endian). */
    set ubit28le(value: number);
    /** Write 28 signed bits (big-endian). */
    set bit28be(value: number);
    /** Write 28 unsigned bits (big-endian). */
    set ubit28be(value: number);
    /** Write 29 signed bits. */
    set bit29(value: number);
    /** Write 29 unsigned bits. */
    set ubit29(value: number);
    /** Write 29 signed bits (little-endian). */
    set bit29le(value: number);
    /** Write 29 unsigned bits (little-endian). */
    set ubit29le(value: number);
    /** Write 29 signed bits (big-endian). */
    set bit29be(value: number);
    /** Write 29 unsigned bits (big-endian). */
    set ubit29be(value: number);
    /** Write 30 signed bits. */
    set bit30(value: number);
    /** Write 30 unsigned bits. */
    set ubit30(value: number);
    /** Write 30 signed bits (little-endian). */
    set bit30le(value: number);
    /** Write 30 unsigned bits (little-endian). */
    set ubit30le(value: number);
    /** Write 30 signed bits (big-endian). */
    set bit30be(value: number);
    /** Write 30 unsigned bits (big-endian). */
    set ubit30be(value: number);
    /** Write 31 signed bits. */
    set bit31(value: number);
    /** Write 31 unsigned bits. */
    set ubit31(value: number);
    /** Write 31 signed bits (little-endian). */
    set bit31le(value: number);
    /** Write 31 unsigned bits (little-endian). */
    set ubit31le(value: number);
    /** Write 31 signed bits (big-endian). */
    set bit31be(value: number);
    /** Write 31 unsigned bits (big-endian). */
    set ubit31be(value: number);
    /** Write 32 signed bits. */
    set bit32(value: number);
    /** Write 32 unsigned bits. */
    set ubit32(value: number);
    /** Write 32 signed bits (little-endian). */
    set bit32le(value: number);
    /** Write 32 unsigned bits (little-endian). */
    set ubit32le(value: number);
    /** Write 32 signed bits (big-endian). */
    set bit32be(value: number);
    /** Write 32 unsigned bits (big-endian). */
    set ubit32be(value: number);
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
 * @file Phase-2 engine brick: the byte-source abstraction.
 *
 * Part of the planned decomposition (see ./README.md). The two engine god-classes
 * currently interleave three concerns: WHERE bytes live (memory vs. file), HOW the
 * cursor moves, and HOW values are coded. `Source` isolates the first: a uniform
 * async surface for reading/writing/growing a backing store, so `BiEngine` can be
 * written once against this interface instead of branching on `isMemoryMode`
 * everywhere (the pattern behind several v4 file-mode bugs).
 */
interface Source {
    /** Current size in bytes. */
    readonly size: number;
    /** Whether writes are permitted. */
    readonly readOnly: boolean;
    /**
     * Whether sub-array results should be returned as Node `Buffer`s rather than
     * plain `Uint8Array`s - true for file-backed sources and for memory sources
     * created from a `Buffer`, so `extract`/`subarray`/etc. echo the input type.
     */
    readonly isBuffer: boolean;
    /** Read exactly `length` bytes at absolute `offset` (no cursor involved). */
    read(offset: number, length: number): Promise<Uint8Array>;
    /** Write `data` at absolute `offset` (no cursor involved). */
    write(offset: number, data: Uint8Array): Promise<void>;
    /** Grow or shrink the backing store to exactly `size` bytes. */
    resize(size: number): Promise<void>;
    /** Flush any buffered writes to the backing store. */
    flush(): Promise<void>;
    /** Release resources (close file handle, drop caches). Idempotent. */
    close(): Promise<void>;
}

type Endian = 'little' | 'big';
interface BiEngineOptions {
    endianness?: Endian;
    enforceBigInt?: boolean;
    strict?: boolean;
    readOnly?: boolean;
    growthIncrement?: number;
    windowSize?: number;
    byteOffset?: number;
    bitOffset?: number;
}
declare class BiEngine<alwaysBigInt extends boolean = false, BytesOut extends Uint8Array = Uint8Array> {
    #private;
    /** File system (fs/promises), injected by the entry point for file mode. */
    static fs: typeof fs_promises;
    endian: Endian;
    enforceBigInt: boolean;
    strict: boolean;
    readOnly: boolean;
    growthIncrement: number;
    windowSize: number;
    filePath: string | null;
    errorDump: boolean;
    strDefaults: stringOptions;
    constructor(input: string | Uint8Array, options?: BiEngineOptions);
    /** True when backed by an in-memory buffer rather than a file. */
    get isMemoryMode(): boolean;
    /** The live Source (throws if not yet opened). */
    get source(): Source;
    /** Open the source. Optionally swap to a new in-memory buffer. */
    open(data?: Uint8Array): Promise<void>;
    /** Current buffer / file size in bytes. */
    get size(): number;
    /** Current byte position. */
    get offset(): number;
    /** Current bit position within the current byte (0-7). */
    get insetBit(): number;
    /** Current absolute bit position (byte * 8 + inset bit). */
    get bitOffset(): number;
    /** Bytes remaining between the current byte position and the end of the data. */
    get remaining(): number;
    /** Run `fn` with exclusive access to the cursor. Reentrant. Opens the source first. */
    runExclusive<T>(fn: () => Promise<T> | T): Promise<T>;
    /** Reads an 8 bit value (signed unless `unsigned`) at the current byte position. */
    readByte(unsigned?: boolean, consume?: boolean): Promise<number>;
    /** Reads a 16 bit value (short / word) in the given endian order. */
    readInt16(unsigned?: boolean, endian?: Endian, consume?: boolean): Promise<number>;
    /** Reads a 32 bit value (int / long / dword) in the given endian order. */
    readInt32(unsigned?: boolean, endian?: Endian, consume?: boolean): Promise<number>;
    /**
     * Reads a 64 bit value (quad / bigint) in the given endian order. Returns a `number` when the
     * value is integer safe, otherwise a `bigint` (always `bigint` when `enforceBigInt` is set).
     */
    readInt64(unsigned?: boolean, endian?: Endian, consume?: boolean): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /** Reads a 16 bit half float in the given endian order. */
    readHalfFloat(endian?: Endian, consume?: boolean): Promise<number>;
    /** Reads a 32 bit float in the given endian order. */
    readFloat(endian?: Endian, consume?: boolean): Promise<number>;
    /** Reads a 64 bit double float in the given endian order. */
    readDoubleFloat(endian?: Endian, consume?: boolean): Promise<number>;
    /** Writes an 8 bit value at the current byte position. Value is clamped to the type's range. */
    writeByte(value: number, unsigned?: boolean, consume?: boolean): Promise<void>;
    /** Writes a 16 bit value (short / word) in the given endian order. Value is clamped to the type's range. */
    writeInt16(value: number, unsigned?: boolean, endian?: Endian, consume?: boolean): Promise<void>;
    /** Writes a 32 bit value (int / long / dword) in the given endian order. Value is clamped to the type's range. */
    writeInt32(value: number, unsigned?: boolean, endian?: Endian, consume?: boolean): Promise<void>;
    /** Writes a 64 bit value (quad / bigint) in the given endian order. Value is clamped to the type's range. */
    writeInt64(value: number | bigint, unsigned?: boolean, endian?: Endian, consume?: boolean): Promise<void>;
    /** Writes a 16 bit half float in the given endian order. */
    writeHalfFloat(value: number, endian?: Endian, consume?: boolean): Promise<void>;
    /** Writes a 32 bit float in the given endian order. */
    writeFloat(value: number, endian?: Endian, consume?: boolean): Promise<void>;
    /** Writes a 64 bit double float in the given endian order. */
    writeDoubleFloat(value: number, endian?: Endian, consume?: boolean): Promise<void>;
    /** Reads a bit field of 1-32 bits from the current bit position, signed or unsigned, in either endian order. */
    readBit(bits: number, unsigned?: boolean, endian?: Endian, consume?: boolean): Promise<number>;
    /** Writes a bit field of 1-32 bits at the current bit position. Value is clamped to the bit width. */
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: Endian, consume?: boolean): Promise<void>;
    /** Move to an absolute byte/bit, enforcing bounds (strict throws, else grows). */
    goto(byte?: number, bit?: number): Promise<void>;
    /** Relative move by bytes/bits, enforcing bounds. */
    skip(bytes?: number, bits?: number): Promise<void>;
    /** Moves the current byte position to the start of the data. */
    rewind(): void;
    /** Moves the current byte position to the end of the data. */
    last(): void;
    /** Aligns the current byte position forward to the next multiple of `n`. */
    align(n: number): Promise<void>;
    /** Reads a 16 bit value at an absolute offset without moving the cursor (safe to call concurrently). */
    readInt16At(offset: number, unsigned?: boolean, endian?: Endian): Promise<number>;
    /** Reads an unsigned 16 bit value at an absolute offset without moving the cursor. */
    readUInt16At(offset: number, endian?: Endian): Promise<number>;
    /** Reads a 32 bit value at an absolute offset without moving the cursor (safe to call concurrently). */
    readInt32At(offset: number, unsigned?: boolean, endian?: Endian): Promise<number>;
    /** Reads an unsigned 32 bit value at an absolute offset without moving the cursor. */
    readUInt32At(offset: number, endian?: Endian): Promise<number>;
    /** Reads an unsigned 8 bit value at an absolute offset without moving the cursor. */
    readUInt8At(offset: number): Promise<number>;
    /** Writes a 16 bit value at an absolute offset without moving the cursor (safe to call concurrently). */
    writeInt16At(offset: number, value: number, unsigned?: boolean, endian?: Endian): Promise<void>;
    /** Writes a 32 bit value at an absolute offset without moving the cursor (safe to call concurrently). */
    writeInt32At(offset: number, value: number, unsigned?: boolean, endian?: Endian): Promise<void>;
    /** Insert bytes at `offset`, growing the source. */
    insert(data: Uint8Array, offset?: number, consume?: boolean): Promise<void>;
    /** Adds new data to the start of the supplied data. Errors in strict mode. */
    unshift(data: Uint8Array, consume?: boolean): Promise<void>;
    /** Alias of {@link unshift} - adds new data to the start of the supplied data. */
    prepend(data: Uint8Array, consume?: boolean): Promise<void>;
    /** Adds new data to the end of the supplied data. Errors in strict mode. */
    push(data: Uint8Array, consume?: boolean): Promise<void>;
    /** Alias of {@link push} - adds new data to the end of the supplied data. */
    append(data: Uint8Array, consume?: boolean): Promise<void>;
    /** Delete [startOffset, endOffset), returning the removed bytes. */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Promise<BytesOut>;
    /** Removes and returns all data after the current byte position. Errors in strict mode. */
    clip(): Promise<BytesOut>;
    /** Alias of {@link clip} - removes and returns all data after the current byte position. */
    trim(): Promise<BytesOut>;
    /** Removes and returns `length` bytes from the current byte position. Errors in strict mode. */
    crop(length?: number, consume?: boolean): Promise<BytesOut>;
    /** Alias of {@link crop} - removes and returns `length` bytes from the current byte position. */
    drop(length?: number, consume?: boolean): Promise<BytesOut>;
    /** Overwrite bytes at `offset` (grows if needed; does not shift the tail). */
    replace(data: Uint8Array, offset?: number, consume?: boolean): Promise<void>;
    /** Alias of {@link replace} - overwrites data at `offset`. */
    overwrite(data: Uint8Array, offset?: number, consume?: boolean): Promise<void>;
    /** Copy out [startOffset, endOffset); if `fillValue` given, overwrite that range with it. */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Promise<BytesOut>;
    /** Alias of {@link fill} - returns data between two byte positions, optionally filling that range. */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Promise<BytesOut>;
    /** Returns a copy of the data between two byte positions without modifying it. */
    subarray(startOffset?: number, endOffset?: number, consume?: boolean): Promise<BytesOut>;
    /** Returns a copy of `length` bytes from the current byte position without modifying the data. */
    extract(length?: number, consume?: boolean): Promise<BytesOut>;
    /** Alias of {@link extract} - returns a copy of `length` bytes from the current byte position. */
    slice(length?: number, consume?: boolean): Promise<BytesOut>;
    /** Alias of {@link extract} - returns a copy of `length` bytes from the current byte position. */
    wrap(length?: number, consume?: boolean): Promise<BytesOut>;
    /** Reads a string; batched - a single source read + synchronous decode. */
    readString(options?: stringOptions, consume?: boolean): Promise<string>;
    /** Writes a string; batched - assembled in memory then one source write. */
    writeString(str: string, options?: stringOptions, consume?: boolean): Promise<void>;
    /** XORs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    xor(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): Promise<void>;
    /** ORs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    or(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): Promise<void>;
    /** ANDs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    and(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): Promise<void>;
    /** Adds the key to each byte in `[start, end)`. The key repeats when shorter than the range. */
    add(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): Promise<void>;
    /** NOTs (bitwise inverts) every byte in the range `[start, end)`. */
    not(start?: number, end?: number, consume?: boolean): Promise<void>;
    /** Left shifts each byte in `[start, end)` by the key. The key repeats when shorter than the range. */
    lShift(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): Promise<void>;
    /** Right shifts each byte in `[start, end)` by the key. The key repeats when shorter than the range. */
    rShift(key: number | string | Uint8Array, start?: number, end?: number, consume?: boolean): Promise<void>;
    /** XORs `length` bytes from the current byte position with the key (length defaults to the key size). */
    xorThis(key: number | string | Uint8Array, length?: number, consume?: boolean): Promise<void>;
    /** ORs `length` bytes from the current byte position with the key (length defaults to the key size). */
    orThis(key: number | string | Uint8Array, length?: number, consume?: boolean): Promise<void>;
    /** ANDs `length` bytes from the current byte position with the key (length defaults to the key size). */
    andThis(key: number | string | Uint8Array, length?: number, consume?: boolean): Promise<void>;
    /** Adds the key to `length` bytes from the current byte position (length defaults to the key size). */
    addThis(key: number | string | Uint8Array, length?: number, consume?: boolean): Promise<void>;
    /** NOTs `length` bytes from the current byte position. */
    notThis(length?: number, consume?: boolean): Promise<void>;
    /** Left shifts `length` bytes from the current byte position by the key (length defaults to the key size). */
    lShiftThis(key: number | string | Uint8Array, length?: number, consume?: boolean): Promise<void>;
    /** Right shifts `length` bytes from the current byte position by the key (length defaults to the key size). */
    rShiftThis(key: number | string | Uint8Array, length?: number, consume?: boolean): Promise<void>;
    /** Searches from the current byte position for a byte sequence. Returns its offset or -1. Does not move the position. */
    findBytes(bytesToFind: Uint8Array | number[]): Promise<number>;
    /** Searches from the current byte position for a string. Returns its offset or -1. Does not move the position. */
    findString(str: string, bytesPerChar?: 1 | 2 | 4): Promise<number>;
    /** Searches from the current byte position for an 8 bit value. Returns its offset or -1. Does not move the position. */
    findByte(value: number, unsigned?: boolean, endian?: Endian): Promise<number>;
    /** Searches from the current byte position for a 16 bit value. Returns its offset or -1. Does not move the position. */
    findShort(value: number, unsigned?: boolean, endian?: Endian): Promise<number>;
    /** Searches from the current byte position for a 32 bit value. Returns its offset or -1. Does not move the position. */
    findInt(value: number, unsigned?: boolean, endian?: Endian): Promise<number>;
    /** Reads an unsigned 8 bit value. */
    readUByte(consume?: boolean): Promise<number>;
    /** Reads an unsigned 16 bit value in the given endian order. */
    readUInt16(endian?: Endian): Promise<number>;
    /** Reads an unsigned 16 bit little endian value. */
    readUInt16LE(): Promise<number>;
    /** Reads an unsigned 16 bit big endian value. */
    readUInt16BE(): Promise<number>;
    /** Reads a signed 16 bit little endian value. */
    readInt16LE(): Promise<number>;
    /** Reads a signed 16 bit big endian value. */
    readInt16BE(): Promise<number>;
    /** Reads a signed 32 bit value in the given endian order. */
    readInt(endian?: Endian): Promise<number>;
    /** Reads an unsigned 32 bit value in the given endian order. */
    readUInt(endian?: Endian): Promise<number>;
    /** Reads an unsigned 32 bit value in the given endian order. */
    readUInt32(endian?: Endian): Promise<number>;
    /** Reads a signed 32 bit little endian value. */
    readInt32LE(): Promise<number>;
    /** Reads a signed 32 bit big endian value. */
    readInt32BE(): Promise<number>;
    /** Reads an unsigned 32 bit little endian value. */
    readUInt32LE(): Promise<number>;
    /** Reads an unsigned 32 bit big endian value. */
    readUInt32BE(): Promise<number>;
    /** Reads a 32 bit float in the given endian order. */
    readFloat32(endian?: Endian, consume?: boolean): Promise<number>;
    /** Reads a 32 bit little endian float. */
    readFloatLE(): Promise<number>;
    /** Reads a 32 bit big endian float. */
    readFloatBE(): Promise<number>;
    /** Reads a 32 bit little endian float. */
    readFloat32LE(): Promise<number>;
    /** Reads a 32 bit big endian float. */
    readFloat32BE(): Promise<number>;
    /** Reads a 16 bit half float in the given endian order. */
    readFloat16(endian?: Endian, consume?: boolean): Promise<number>;
    /** Reads a 16 bit little endian half float. */
    readHalfFloatLE(): Promise<number>;
    /** Reads a 16 bit big endian half float. */
    readHalfFloatBE(): Promise<number>;
    /** Reads a 16 bit little endian half float. */
    readFloat16LE(): Promise<number>;
    /** Reads a 16 bit big endian half float. */
    readFloat16BE(): Promise<number>;
    /** Reads a 64 bit double float in the given endian order. */
    readFloat64(endian?: Endian, consume?: boolean): Promise<number>;
    /** Reads a 64 bit little endian double float. */
    readDoubleFloatLE(): Promise<number>;
    /** Reads a 64 bit big endian double float. */
    readDoubleFloatBE(): Promise<number>;
    /** Reads a 64 bit little endian double float. */
    readFloat64LE(): Promise<number>;
    /** Reads a 64 bit big endian double float. */
    readFloat64BE(): Promise<number>;
    /** Reads an unsigned 64 bit value in the current endian order. */
    readUInt64(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /** Reads a signed 64 bit little endian value. */
    readInt64LE(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /** Reads a signed 64 bit big endian value. */
    readInt64BE(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /** Reads an unsigned 64 bit little endian value. */
    readUInt64LE(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /** Reads an unsigned 64 bit big endian value. */
    readUInt64BE(): Promise<ReturnBigValueMapping<alwaysBigInt>>;
    /** Reads an unsigned bit field of 1-32 bits in big endian order. */
    readUBitBE(bits: number): Promise<number>;
    /** Reads an unsigned bit field of 1-32 bits in little endian order. */
    readUBitLE(bits: number): Promise<number>;
    /** Reads a bit field of 1-32 bits in big endian order. */
    readBitBE(bits: number, unsigned?: boolean): Promise<number>;
    /** Reads a bit field of 1-32 bits in little endian order. */
    readBitLE(bits: number, unsigned?: boolean): Promise<number>;
    /** Reads `amount` bytes from the current byte position as a number array (signed unless `unsigned`). */
    readBytes(amount: number, unsigned?: boolean, consume?: boolean): Promise<number[]>;
    /** Reads `amount` unsigned bytes from the current byte position as a `Uint8Array` copy. */
    readUBytes(amount: number, consume?: boolean): Promise<BytesOut>;
    /** Writes an unsigned 16 bit value in the given endian order. */
    writeUInt16(value: number, endian?: Endian): Promise<void>;
    /** Writes an unsigned 16 bit little endian value. */
    writeUInt16LE(value: number): Promise<void>;
    /** Writes an unsigned 16 bit big endian value. */
    writeUInt16BE(value: number): Promise<void>;
    /** Writes a signed 16 bit little endian value. */
    writeInt16LE(value: number): Promise<void>;
    /** Writes a signed 16 bit big endian value. */
    writeInt16BE(value: number): Promise<void>;
    /** Writes a signed 32 bit value in the given endian order. */
    writeInt(value: number, endian?: Endian): Promise<void>;
    /** Writes an unsigned 32 bit value in the given endian order. */
    writeUInt(value: number, endian?: Endian): Promise<void>;
    /** Writes an unsigned 32 bit value in the given endian order. */
    writeUInt32(value: number, endian?: Endian): Promise<void>;
    /** Writes a signed 32 bit little endian value. */
    writeInt32LE(value: number): Promise<void>;
    /** Writes a signed 32 bit big endian value. */
    writeInt32BE(value: number): Promise<void>;
    /** Writes an unsigned 32 bit little endian value. */
    writeUInt32LE(value: number): Promise<void>;
    /** Writes an unsigned 32 bit big endian value. */
    writeUInt32BE(value: number): Promise<void>;
    /** Writes a 32 bit float in the given endian order. */
    writeFloat32(value: number, endian?: Endian, consume?: boolean): Promise<void>;
    /** Writes a 32 bit little endian float. */
    writeFloatLE(value: number): Promise<void>;
    /** Writes a 32 bit big endian float. */
    writeFloatBE(value: number): Promise<void>;
    /** Writes a 32 bit little endian float. */
    writeFloat32LE(value: number): Promise<void>;
    /** Writes a 32 bit big endian float. */
    writeFloat32BE(value: number): Promise<void>;
    /** Writes a 16 bit half float in the given endian order. */
    writeFloat16(value: number, endian?: Endian, consume?: boolean): Promise<void>;
    /** Writes a 16 bit little endian half float. */
    writeHalfFloatLE(value: number): Promise<void>;
    /** Writes a 16 bit big endian half float. */
    writeHalfFloatBE(value: number): Promise<void>;
    /** Writes a 16 bit little endian half float. */
    writeFloat16LE(value: number): Promise<void>;
    /** Writes a 16 bit big endian half float. */
    writeFloat16BE(value: number): Promise<void>;
    /** Writes a 64 bit double float in the given endian order. */
    writeFloat64(value: number, endian?: Endian, consume?: boolean): Promise<void>;
    /** Writes a 64 bit little endian double float. */
    writeDoubleFloatLE(value: number): Promise<void>;
    /** Writes a 64 bit big endian double float. */
    writeDoubleFloatBE(value: number): Promise<void>;
    /** Writes a 64 bit little endian double float. */
    writeFloat64LE(value: number): Promise<void>;
    /** Writes a 64 bit big endian double float. */
    writeFloat64BE(value: number): Promise<void>;
    /** Writes an unsigned 64 bit value in the given endian order. */
    writeUInt64(value: number | bigint, endian?: Endian): Promise<void>;
    /** Writes a signed 64 bit little endian value. */
    writeInt64LE(value: number | bigint): Promise<void>;
    /** Writes a signed 64 bit big endian value. */
    writeInt64BE(value: number | bigint): Promise<void>;
    /** Writes an unsigned 64 bit little endian value. */
    writeUInt64LE(value: number | bigint): Promise<void>;
    /** Writes an unsigned 64 bit big endian value. */
    writeUInt64BE(value: number | bigint): Promise<void>;
    /** Writes an unsigned 8 bit value. */
    writeUByte(value: number, consume?: boolean): Promise<void>;
    /** Writes an unsigned bit field of 1-32 bits in big endian order. */
    writeUBitBE(value: number, bits: number): Promise<void>;
    /** Writes an unsigned bit field of 1-32 bits in little endian order. */
    writeUBitLE(value: number, bits: number): Promise<void>;
    /** Writes a bit field of 1-32 bits in big endian order. */
    writeBitBE(value: number, bits: number, unsigned?: boolean): Promise<void>;
    /** Writes a bit field of 1-32 bits in little endian order. */
    writeBitLE(value: number, bits: number, unsigned?: boolean): Promise<void>;
    /** Writes raw bytes at the current byte position, overwriting existing data. */
    writeBytes(values: number[] | Uint8Array, unsigned?: boolean, consume?: boolean): Promise<void>;
    /** Writes raw unsigned bytes at the current byte position, overwriting existing data. */
    writeUBytes(values: number[] | Uint8Array, consume?: boolean): Promise<void>;
    /** Sets the default endian order. Can be changed at any time. */
    endianness(endian: Endian): void;
    /** Switches the default endian order to big endian. */
    bigEndian(): void;
    /** Alias of {@link bigEndian} - switches to big endian. */
    big(): void;
    /** Alias of {@link bigEndian} - switches to big endian. */
    be(): void;
    /** Switches the default endian order to little endian. */
    littleEndian(): void;
    /** Alias of {@link littleEndian} - switches to little endian. */
    little(): void;
    /** Alias of {@link littleEndian} - switches to little endian. */
    le(): void;
    /** Current buffer size in bits. */
    get bitSize(): number;
    /** Current buffer size in bytes. */
    get length(): number;
    /** Current buffer size in bytes. */
    get len(): number;
    /** Current buffer / file size in bytes. */
    get fileSize(): number;
    /** Current buffer / file size in bytes. */
    get FileSize(): number;
    /** Current buffer size in bits. */
    get lengthBits(): number;
    /** Current buffer size in bits. */
    get sizeBits(): number;
    /** Current buffer / file size in bits. */
    get fileBitSize(): number;
    /** Current buffer / file size in bits. */
    get fileSizeBits(): number;
    /** Current buffer size in bits. */
    get lenBits(): number;
    /** Current byte position. */
    get off(): number;
    /** Current byte position. */
    get getOffset(): number;
    /** Current byte position. */
    get tell(): number;
    /** Current byte position. */
    get FTell(): number;
    /** Current byte position. */
    get saveOffset(): number;
    /** Current byte position. */
    get byteOffset(): number;
    /** Moves the current byte position. */
    setOffset(value: number): Promise<void>;
    /** Moves the current byte position. */
    setByteOffset(value: number): Promise<void>;
    /** Current absolute bit position. */
    get offsetBits(): number;
    /** Current absolute bit position. */
    get getBitOffset(): number;
    /** Current absolute bit position. */
    get saveBitOffset(): number;
    /** Current absolute bit position. */
    get FTellBits(): number;
    /** Current bit position within the current byte (0-7). */
    get tellBits(): number;
    /** Current absolute bit position. */
    get offBits(): number;
    /** Moves to an absolute bit position. */
    setOffsetBits(value: number): Promise<void>;
    /** Moves to an absolute bit position. */
    setBitOffset(value: number): Promise<void>;
    /** Current bit position within the current byte (0-7). */
    get getInsetBit(): number;
    /** Current bit position within the current byte (0-7). */
    get saveInsetBit(): number;
    /** Current bit position within the current byte (0-7). */
    get inBit(): number;
    /** Current bit position within the current byte (0-7). */
    get bitTell(): number;
    /** Moves the bit position within the current byte (0-7). */
    setInsetBit(value: number): Promise<void>;
    /** Bytes remaining between the current byte position and the end of the data. */
    get remain(): number;
    /** Bytes remaining between the current byte position and the end of the data. */
    get remainBytes(): number;
    /** Bytes remaining between the current byte position and the end of the data. */
    get FEoF(): number;
    /** Bits remaining between the current bit position and the end of the data. */
    get remainBits(): number;
    /** Bits remaining between the current bit position and the end of the data. */
    get FEoFBits(): number;
    /** Row line of the current byte position (16 bytes per row). */
    get getLine(): number;
    /** Row line of the current byte position (16 bytes per row). */
    get row(): number;
    /** Alias of {@link skip} - moves the position by a relative number of bytes / bits. */
    jump(bytes: number, bits?: number): Promise<void>;
    /** Alias of {@link skip} - moves the position by a relative number of bytes / bits. */
    seek(bytes: number, bits?: number): Promise<void>;
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    FSeek(byte: number, bit?: number): Promise<void>;
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    pointer(byte: number, bit?: number): Promise<void>;
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    warp(byte: number, bit?: number): Promise<void>;
    /** Alias of {@link rewind} - moves the current byte position to the start of the data. */
    gotoStart(): void;
    /** Alias of {@link last} - moves the current byte position to the end of the data. */
    gotoEnd(): void;
    /** Alias of {@link last} - moves the current byte position to the end of the data. */
    EoF(): void;
    /** Aligns the current byte position backward to the previous multiple of `number`. */
    alignRev(number: number): Promise<void>;
    /** True when the value is a `Buffer` or `Uint8Array`. */
    isBufferOrUint8Array(obj: any): obj is Uint8Array;
    /** True when the value is a Node `Buffer`. */
    isBuffer(obj: any): obj is Uint8Array;
    /** True when the value is a plain `Uint8Array` (not a `Buffer`). */
    isUint8Array(obj: any): boolean;
    /** Turns strict mode on - the data won't be extended past its max size. */
    restrict(): void;
    /** Turns strict mode off - the data is extended when writing past its max size. */
    unrestrict(): void;
    /** Turns off the hexdump on error (default). */
    errorDumpOff(): void;
    /** Turns on the hexdump on error. */
    errorDumpOn(): void;
    /** Merges default string options used by the `str` read / write and the string presets. */
    set strSettings(settings: stringOptions);
    /** Console logs the data as a hex dump, or returns it as a string with `returnString`. */
    hexdump(options?: hexdumpOptions): Promise<void | string>;
    /** Reads an 8 bit value at an absolute offset without moving the cursor. */
    readByteAt(offset: number, unsigned?: boolean): Promise<number>;
    /** Reads `length` raw bytes at an absolute offset without moving the cursor. */
    readBytesAt(offset: number, length: number): Promise<BytesOut>;
    /** Reads a 32 bit float at an absolute offset without moving the cursor. */
    readFloat32At(offset: number, endian?: Endian): Promise<number>;
    /** Reads a 64 bit double float at an absolute offset without moving the cursor. */
    readFloat64At(offset: number, endian?: Endian): Promise<number>;
    /** Reads a signed 64 bit `bigint` at an absolute offset without moving the cursor. */
    readBigInt64At(offset: number, endian?: Endian): Promise<bigint>;
    /** Reads an unsigned 64 bit `bigint` at an absolute offset without moving the cursor. */
    readBigUInt64At(offset: number, endian?: Endian): Promise<bigint>;
    /** Writes an 8 bit value at an absolute offset without moving the cursor. */
    writeByteAt(offset: number, value: number, unsigned?: boolean): Promise<void>;
    /** Writes raw bytes at an absolute offset without moving the cursor. */
    writeBytesAt(offset: number, data: Uint8Array): Promise<void>;
    /** Writes an unsigned 16 bit value at an absolute offset without moving the cursor. */
    writeUInt16At(offset: number, value: number, endian?: Endian): Promise<void>;
    /** Writes an unsigned 32 bit value at an absolute offset without moving the cursor. */
    writeUInt32At(offset: number, value: number, endian?: Endian): Promise<void>;
    /** Writes a 32 bit float at an absolute offset without moving the cursor. */
    writeFloat32At(offset: number, value: number, endian?: Endian): Promise<void>;
    /** Writes a 64 bit double float at an absolute offset without moving the cursor. */
    writeFloat64At(offset: number, value: number, endian?: Endian): Promise<void>;
    /** Writes a 64 bit value at an absolute offset without moving the cursor. */
    writeBigInt64At(offset: number, value: number | bigint, unsigned?: boolean, endian?: Endian): Promise<void>;
    /** Writes an unsigned 64 bit value at an absolute offset without moving the cursor. */
    writeBigUInt64At(offset: number, value: number | bigint, endian?: Endian): Promise<void>;
    /** In-memory buffer (memory mode, as the source's native type); null in file mode - use get()/getData(). */
    get data(): BytesOut | null;
    /** DataView over the in-memory buffer (memory mode only). */
    get view(): DataView | null;
    /** Commits any pending edits to the file. */
    commit(): Promise<void>;
    /** Flushes any pending edits through to the underlying source. */
    flush(): Promise<void>;
    /** Returns the current data (trimmed to the write position if the buffer was expanded). */
    get(): Promise<BytesOut>;
    /** Alias of {@link get} - returns the current data. */
    getData(): Promise<BytesOut>;
    /** Alias of {@link get} - returns the current data. */
    getFullBuffer(): Promise<BytesOut>;
    /** Alias of {@link get} - returns the current data. */
    return(): Promise<BytesOut>;
    /** Alias of {@link close} - flushes and releases the supplied data. */
    end(): Promise<BytesOut | void>;
    /** Alias of {@link close} - flushes and releases the supplied data. */
    done(): Promise<BytesOut | void>;
    /** Alias of {@link close} - flushes and releases the supplied data. */
    finished(): Promise<BytesOut | void>;
    /** Commits any edits and closes the file. In memory mode returns the buffer instead. */
    close(): Promise<BytesOut | void>;
    /** Enable/disable writing + expanding (changes strict AND readOnly). */
    writeMode(mode?: boolean): Promise<void>;
    /** Renames the file on the file system, keeping the read / write position. This is permanent. */
    renameFile(newFilePath: string): Promise<void>;
    /** Unlinks the file from the file system. This is permanent - it does not go to the recycling bin. */
    deleteFile(): Promise<void>;
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
declare class BiReaderAsync<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false> extends BiEngine<alwaysBigInt, BytesOutput<DataType>> {
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
    static create<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false>(input: DataType, options?: BiOptions<alwaysBigInt>): Promise<BiReaderAsync<DataType, alwaysBigInt>>;
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
    /** Read a signed 8-bit integer. */
    byte(): Promise<number>;
    /** Read a signed 8-bit integer. */
    int8(): Promise<number>;
    /** Read an unsigned 8-bit integer. */
    uint8(): Promise<number>;
    /** Read an unsigned 8-bit integer. */
    ubyte(): Promise<number>;
    /** Read a signed 16-bit integer. */
    int16(): Promise<number>;
    /** Read a signed 16-bit integer. */
    short(): Promise<number>;
    /** Read a signed 16-bit integer. */
    word(): Promise<number>;
    /** Read an unsigned 16-bit integer. */
    uint16(): Promise<number>;
    /** Read an unsigned 16-bit integer. */
    ushort(): Promise<number>;
    /** Read an unsigned 16-bit integer. */
    uword(): Promise<number>;
    /** Read a signed 16-bit integer (little-endian). */
    int16le(): Promise<number>;
    /** Read a signed 16-bit integer (little-endian). */
    shortle(): Promise<number>;
    /** Read a signed 16-bit integer (little-endian). */
    wordle(): Promise<number>;
    /** Read an unsigned 16-bit integer (little-endian). */
    uint16le(): Promise<number>;
    /** Read an unsigned 16-bit integer (little-endian). */
    ushortle(): Promise<number>;
    /** Read an unsigned 16-bit integer (little-endian). */
    uwordle(): Promise<number>;
    /** Read a signed 16-bit integer (big-endian). */
    int16be(): Promise<number>;
    /** Read a signed 16-bit integer (big-endian). */
    shortbe(): Promise<number>;
    /** Read a signed 16-bit integer (big-endian). */
    wordbe(): Promise<number>;
    /** Read an unsigned 16-bit integer (big-endian). */
    uint16be(): Promise<number>;
    /** Read an unsigned 16-bit integer (big-endian). */
    ushortbe(): Promise<number>;
    /** Read an unsigned 16-bit integer (big-endian). */
    uwordbe(): Promise<number>;
    /** Read a signed 32-bit integer. */
    int(): Promise<number>;
    /** Read a signed 32-bit integer. */
    dword(): Promise<number>;
    /** Read a signed 32-bit integer. */
    int32(): Promise<number>;
    /** Read a signed 32-bit integer. */
    long(): Promise<number>;
    /** Read an unsigned 32-bit integer. */
    uint(): Promise<number>;
    /** Read an unsigned 32-bit integer. */
    udword(): Promise<number>;
    /** Read an unsigned 32-bit integer. */
    uint32(): Promise<number>;
    /** Read an unsigned 32-bit integer. */
    ulong(): Promise<number>;
    /** Read a signed 32-bit integer (little-endian). */
    intle(): Promise<number>;
    /** Read a signed 32-bit integer (little-endian). */
    dwordle(): Promise<number>;
    /** Read a signed 32-bit integer (little-endian). */
    int32le(): Promise<number>;
    /** Read a signed 32-bit integer (little-endian). */
    longle(): Promise<number>;
    /** Read an unsigned 32-bit integer (little-endian). */
    uintle(): Promise<number>;
    /** Read an unsigned 32-bit integer (little-endian). */
    udwordle(): Promise<number>;
    /** Read an unsigned 32-bit integer (little-endian). */
    uint32le(): Promise<number>;
    /** Read an unsigned 32-bit integer (little-endian). */
    ulongle(): Promise<number>;
    /** Read a signed 32-bit integer (big-endian). */
    intbe(): Promise<number>;
    /** Read a signed 32-bit integer (big-endian). */
    dwordbe(): Promise<number>;
    /** Read a signed 32-bit integer (big-endian). */
    int32be(): Promise<number>;
    /** Read a signed 32-bit integer (big-endian). */
    longbe(): Promise<number>;
    /** Read an unsigned 32-bit integer (big-endian). */
    uintbe(): Promise<number>;
    /** Read an unsigned 32-bit integer (big-endian). */
    udwordbe(): Promise<number>;
    /** Read an unsigned 32-bit integer (big-endian). */
    uint32be(): Promise<number>;
    /** Read an unsigned 32-bit integer (big-endian). */
    ulongbe(): Promise<number>;
    /** Read a signed 64-bit integer. */
    int64(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a signed 64-bit integer. */
    bigint(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a signed 64-bit integer. */
    quad(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer. */
    uint64(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer. */
    ubigint(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer. */
    uquad(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a signed 64-bit integer (little-endian). */
    int64le(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a signed 64-bit integer (little-endian). */
    bigintle(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a signed 64-bit integer (little-endian). */
    quadle(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer (little-endian). */
    uint64le(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer (little-endian). */
    ubigintle(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer (little-endian). */
    uquadle(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a signed 64-bit integer (big-endian). */
    int64be(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a signed 64-bit integer (big-endian). */
    bigintbe(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a signed 64-bit integer (big-endian). */
    quadbe(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer (big-endian). */
    uint64be(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer (big-endian). */
    ubigintbe(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read an unsigned 64-bit integer (big-endian). */
    uquadbe(): Promise<alwaysBigInt extends true ? bigint : BigValue>;
    /** Read a 32-bit float. */
    float(): Promise<number>;
    /** Read a 32-bit float (little-endian). */
    floatle(): Promise<number>;
    /** Read a 32-bit float (big-endian). */
    floatbe(): Promise<number>;
    /** Read a 16-bit float. */
    halffloat(): Promise<number>;
    /** Read a 16-bit float. */
    half(): Promise<number>;
    /** Read a 16-bit float (little-endian). */
    halffloatle(): Promise<number>;
    /** Read a 16-bit float (little-endian). */
    halfle(): Promise<number>;
    /** Read a 16-bit float (big-endian). */
    halffloatbe(): Promise<number>;
    /** Read a 16-bit float (big-endian). */
    halfbe(): Promise<number>;
    /** Read a 64-bit float. */
    doublefloat(): Promise<number>;
    /** Read a 64-bit float. */
    dfloat(): Promise<number>;
    /** Read a 64-bit float (little-endian). */
    doublefloatle(): Promise<number>;
    /** Read a 64-bit float (little-endian). */
    dfloatle(): Promise<number>;
    /** Read a 64-bit float (big-endian). */
    doublefloatbe(): Promise<number>;
    /** Read a 64-bit float (big-endian). */
    dfloatbe(): Promise<number>;
    /** Read 1 signed bit. */
    bit1(): Promise<number>;
    /** Read 1 unsigned bit. */
    ubit1(): Promise<number>;
    /** Read 1 signed bit (little-endian). */
    bit1le(): Promise<number>;
    /** Read 1 unsigned bit (little-endian). */
    ubit1le(): Promise<number>;
    /** Read 1 signed bit (big-endian). */
    bit1be(): Promise<number>;
    /** Read 1 unsigned bit (big-endian). */
    ubit1be(): Promise<number>;
    /** Read 2 signed bits. */
    bit2(): Promise<number>;
    /** Read 2 unsigned bits. */
    ubit2(): Promise<number>;
    /** Read 2 signed bits (little-endian). */
    bit2le(): Promise<number>;
    /** Read 2 unsigned bits (little-endian). */
    ubit2le(): Promise<number>;
    /** Read 2 signed bits (big-endian). */
    bit2be(): Promise<number>;
    /** Read 2 unsigned bits (big-endian). */
    ubit2be(): Promise<number>;
    /** Read 3 signed bits. */
    bit3(): Promise<number>;
    /** Read 3 unsigned bits. */
    ubit3(): Promise<number>;
    /** Read 3 signed bits (little-endian). */
    bit3le(): Promise<number>;
    /** Read 3 unsigned bits (little-endian). */
    ubit3le(): Promise<number>;
    /** Read 3 signed bits (big-endian). */
    bit3be(): Promise<number>;
    /** Read 3 unsigned bits (big-endian). */
    ubit3be(): Promise<number>;
    /** Read 4 signed bits. */
    bit4(): Promise<number>;
    /** Read 4 unsigned bits. */
    ubit4(): Promise<number>;
    /** Read 4 signed bits (little-endian). */
    bit4le(): Promise<number>;
    /** Read 4 unsigned bits (little-endian). */
    ubit4le(): Promise<number>;
    /** Read 4 signed bits (big-endian). */
    bit4be(): Promise<number>;
    /** Read 4 unsigned bits (big-endian). */
    ubit4be(): Promise<number>;
    /** Read 5 signed bits. */
    bit5(): Promise<number>;
    /** Read 5 unsigned bits. */
    ubit5(): Promise<number>;
    /** Read 5 signed bits (little-endian). */
    bit5le(): Promise<number>;
    /** Read 5 unsigned bits (little-endian). */
    ubit5le(): Promise<number>;
    /** Read 5 signed bits (big-endian). */
    bit5be(): Promise<number>;
    /** Read 5 unsigned bits (big-endian). */
    ubit5be(): Promise<number>;
    /** Read 6 signed bits. */
    bit6(): Promise<number>;
    /** Read 6 unsigned bits. */
    ubit6(): Promise<number>;
    /** Read 6 signed bits (little-endian). */
    bit6le(): Promise<number>;
    /** Read 6 unsigned bits (little-endian). */
    ubit6le(): Promise<number>;
    /** Read 6 signed bits (big-endian). */
    bit6be(): Promise<number>;
    /** Read 6 unsigned bits (big-endian). */
    ubit6be(): Promise<number>;
    /** Read 7 signed bits. */
    bit7(): Promise<number>;
    /** Read 7 unsigned bits. */
    ubit7(): Promise<number>;
    /** Read 7 signed bits (little-endian). */
    bit7le(): Promise<number>;
    /** Read 7 unsigned bits (little-endian). */
    ubit7le(): Promise<number>;
    /** Read 7 signed bits (big-endian). */
    bit7be(): Promise<number>;
    /** Read 7 unsigned bits (big-endian). */
    ubit7be(): Promise<number>;
    /** Read 8 signed bits. */
    bit8(): Promise<number>;
    /** Read 8 unsigned bits. */
    ubit8(): Promise<number>;
    /** Read 8 signed bits (little-endian). */
    bit8le(): Promise<number>;
    /** Read 8 unsigned bits (little-endian). */
    ubit8le(): Promise<number>;
    /** Read 8 signed bits (big-endian). */
    bit8be(): Promise<number>;
    /** Read 8 unsigned bits (big-endian). */
    ubit8be(): Promise<number>;
    /** Read 9 signed bits. */
    bit9(): Promise<number>;
    /** Read 9 unsigned bits. */
    ubit9(): Promise<number>;
    /** Read 9 signed bits (little-endian). */
    bit9le(): Promise<number>;
    /** Read 9 unsigned bits (little-endian). */
    ubit9le(): Promise<number>;
    /** Read 9 signed bits (big-endian). */
    bit9be(): Promise<number>;
    /** Read 9 unsigned bits (big-endian). */
    ubit9be(): Promise<number>;
    /** Read 10 signed bits. */
    bit10(): Promise<number>;
    /** Read 10 unsigned bits. */
    ubit10(): Promise<number>;
    /** Read 10 signed bits (little-endian). */
    bit10le(): Promise<number>;
    /** Read 10 unsigned bits (little-endian). */
    ubit10le(): Promise<number>;
    /** Read 10 signed bits (big-endian). */
    bit10be(): Promise<number>;
    /** Read 10 unsigned bits (big-endian). */
    ubit10be(): Promise<number>;
    /** Read 11 signed bits. */
    bit11(): Promise<number>;
    /** Read 11 unsigned bits. */
    ubit11(): Promise<number>;
    /** Read 11 signed bits (little-endian). */
    bit11le(): Promise<number>;
    /** Read 11 unsigned bits (little-endian). */
    ubit11le(): Promise<number>;
    /** Read 11 signed bits (big-endian). */
    bit11be(): Promise<number>;
    /** Read 11 unsigned bits (big-endian). */
    ubit11be(): Promise<number>;
    /** Read 12 signed bits. */
    bit12(): Promise<number>;
    /** Read 12 unsigned bits. */
    ubit12(): Promise<number>;
    /** Read 12 signed bits (little-endian). */
    bit12le(): Promise<number>;
    /** Read 12 unsigned bits (little-endian). */
    ubit12le(): Promise<number>;
    /** Read 12 signed bits (big-endian). */
    bit12be(): Promise<number>;
    /** Read 12 unsigned bits (big-endian). */
    ubit12be(): Promise<number>;
    /** Read 13 signed bits. */
    bit13(): Promise<number>;
    /** Read 13 unsigned bits. */
    ubit13(): Promise<number>;
    /** Read 13 signed bits (little-endian). */
    bit13le(): Promise<number>;
    /** Read 13 unsigned bits (little-endian). */
    ubit13le(): Promise<number>;
    /** Read 13 signed bits (big-endian). */
    bit13be(): Promise<number>;
    /** Read 13 unsigned bits (big-endian). */
    ubit13be(): Promise<number>;
    /** Read 14 signed bits. */
    bit14(): Promise<number>;
    /** Read 14 unsigned bits. */
    ubit14(): Promise<number>;
    /** Read 14 signed bits (little-endian). */
    bit14le(): Promise<number>;
    /** Read 14 unsigned bits (little-endian). */
    ubit14le(): Promise<number>;
    /** Read 14 signed bits (big-endian). */
    bit14be(): Promise<number>;
    /** Read 14 unsigned bits (big-endian). */
    ubit14be(): Promise<number>;
    /** Read 15 signed bits. */
    bit15(): Promise<number>;
    /** Read 15 unsigned bits. */
    ubit15(): Promise<number>;
    /** Read 15 signed bits (little-endian). */
    bit15le(): Promise<number>;
    /** Read 15 unsigned bits (little-endian). */
    ubit15le(): Promise<number>;
    /** Read 15 signed bits (big-endian). */
    bit15be(): Promise<number>;
    /** Read 15 unsigned bits (big-endian). */
    ubit15be(): Promise<number>;
    /** Read 16 signed bits. */
    bit16(): Promise<number>;
    /** Read 16 unsigned bits. */
    ubit16(): Promise<number>;
    /** Read 16 signed bits (little-endian). */
    bit16le(): Promise<number>;
    /** Read 16 unsigned bits (little-endian). */
    ubit16le(): Promise<number>;
    /** Read 16 signed bits (big-endian). */
    bit16be(): Promise<number>;
    /** Read 16 unsigned bits (big-endian). */
    ubit16be(): Promise<number>;
    /** Read 17 signed bits. */
    bit17(): Promise<number>;
    /** Read 17 unsigned bits. */
    ubit17(): Promise<number>;
    /** Read 17 signed bits (little-endian). */
    bit17le(): Promise<number>;
    /** Read 17 unsigned bits (little-endian). */
    ubit17le(): Promise<number>;
    /** Read 17 signed bits (big-endian). */
    bit17be(): Promise<number>;
    /** Read 17 unsigned bits (big-endian). */
    ubit17be(): Promise<number>;
    /** Read 18 signed bits. */
    bit18(): Promise<number>;
    /** Read 18 unsigned bits. */
    ubit18(): Promise<number>;
    /** Read 18 signed bits (little-endian). */
    bit18le(): Promise<number>;
    /** Read 18 unsigned bits (little-endian). */
    ubit18le(): Promise<number>;
    /** Read 18 signed bits (big-endian). */
    bit18be(): Promise<number>;
    /** Read 18 unsigned bits (big-endian). */
    ubit18be(): Promise<number>;
    /** Read 19 signed bits. */
    bit19(): Promise<number>;
    /** Read 19 unsigned bits. */
    ubit19(): Promise<number>;
    /** Read 19 signed bits (little-endian). */
    bit19le(): Promise<number>;
    /** Read 19 unsigned bits (little-endian). */
    ubit19le(): Promise<number>;
    /** Read 19 signed bits (big-endian). */
    bit19be(): Promise<number>;
    /** Read 19 unsigned bits (big-endian). */
    ubit19be(): Promise<number>;
    /** Read 20 signed bits. */
    bit20(): Promise<number>;
    /** Read 20 unsigned bits. */
    ubit20(): Promise<number>;
    /** Read 20 signed bits (little-endian). */
    bit20le(): Promise<number>;
    /** Read 20 unsigned bits (little-endian). */
    ubit20le(): Promise<number>;
    /** Read 20 signed bits (big-endian). */
    bit20be(): Promise<number>;
    /** Read 20 unsigned bits (big-endian). */
    ubit20be(): Promise<number>;
    /** Read 21 signed bits. */
    bit21(): Promise<number>;
    /** Read 21 unsigned bits. */
    ubit21(): Promise<number>;
    /** Read 21 signed bits (little-endian). */
    bit21le(): Promise<number>;
    /** Read 21 unsigned bits (little-endian). */
    ubit21le(): Promise<number>;
    /** Read 21 signed bits (big-endian). */
    bit21be(): Promise<number>;
    /** Read 21 unsigned bits (big-endian). */
    ubit21be(): Promise<number>;
    /** Read 22 signed bits. */
    bit22(): Promise<number>;
    /** Read 22 unsigned bits. */
    ubit22(): Promise<number>;
    /** Read 22 signed bits (little-endian). */
    bit22le(): Promise<number>;
    /** Read 22 unsigned bits (little-endian). */
    ubit22le(): Promise<number>;
    /** Read 22 signed bits (big-endian). */
    bit22be(): Promise<number>;
    /** Read 22 unsigned bits (big-endian). */
    ubit22be(): Promise<number>;
    /** Read 23 signed bits. */
    bit23(): Promise<number>;
    /** Read 23 unsigned bits. */
    ubit23(): Promise<number>;
    /** Read 23 signed bits (little-endian). */
    bit23le(): Promise<number>;
    /** Read 23 unsigned bits (little-endian). */
    ubit23le(): Promise<number>;
    /** Read 23 signed bits (big-endian). */
    bit23be(): Promise<number>;
    /** Read 23 unsigned bits (big-endian). */
    ubit23be(): Promise<number>;
    /** Read 24 signed bits. */
    bit24(): Promise<number>;
    /** Read 24 unsigned bits. */
    ubit24(): Promise<number>;
    /** Read 24 signed bits (little-endian). */
    bit24le(): Promise<number>;
    /** Read 24 unsigned bits (little-endian). */
    ubit24le(): Promise<number>;
    /** Read 24 signed bits (big-endian). */
    bit24be(): Promise<number>;
    /** Read 24 unsigned bits (big-endian). */
    ubit24be(): Promise<number>;
    /** Read 25 signed bits. */
    bit25(): Promise<number>;
    /** Read 25 unsigned bits. */
    ubit25(): Promise<number>;
    /** Read 25 signed bits (little-endian). */
    bit25le(): Promise<number>;
    /** Read 25 unsigned bits (little-endian). */
    ubit25le(): Promise<number>;
    /** Read 25 signed bits (big-endian). */
    bit25be(): Promise<number>;
    /** Read 25 unsigned bits (big-endian). */
    ubit25be(): Promise<number>;
    /** Read 26 signed bits. */
    bit26(): Promise<number>;
    /** Read 26 unsigned bits. */
    ubit26(): Promise<number>;
    /** Read 26 signed bits (little-endian). */
    bit26le(): Promise<number>;
    /** Read 26 unsigned bits (little-endian). */
    ubit26le(): Promise<number>;
    /** Read 26 signed bits (big-endian). */
    bit26be(): Promise<number>;
    /** Read 26 unsigned bits (big-endian). */
    ubit26be(): Promise<number>;
    /** Read 27 signed bits. */
    bit27(): Promise<number>;
    /** Read 27 unsigned bits. */
    ubit27(): Promise<number>;
    /** Read 27 signed bits (little-endian). */
    bit27le(): Promise<number>;
    /** Read 27 unsigned bits (little-endian). */
    ubit27le(): Promise<number>;
    /** Read 27 signed bits (big-endian). */
    bit27be(): Promise<number>;
    /** Read 27 unsigned bits (big-endian). */
    ubit27be(): Promise<number>;
    /** Read 28 signed bits. */
    bit28(): Promise<number>;
    /** Read 28 unsigned bits. */
    ubit28(): Promise<number>;
    /** Read 28 signed bits (little-endian). */
    bit28le(): Promise<number>;
    /** Read 28 unsigned bits (little-endian). */
    ubit28le(): Promise<number>;
    /** Read 28 signed bits (big-endian). */
    bit28be(): Promise<number>;
    /** Read 28 unsigned bits (big-endian). */
    ubit28be(): Promise<number>;
    /** Read 29 signed bits. */
    bit29(): Promise<number>;
    /** Read 29 unsigned bits. */
    ubit29(): Promise<number>;
    /** Read 29 signed bits (little-endian). */
    bit29le(): Promise<number>;
    /** Read 29 unsigned bits (little-endian). */
    ubit29le(): Promise<number>;
    /** Read 29 signed bits (big-endian). */
    bit29be(): Promise<number>;
    /** Read 29 unsigned bits (big-endian). */
    ubit29be(): Promise<number>;
    /** Read 30 signed bits. */
    bit30(): Promise<number>;
    /** Read 30 unsigned bits. */
    ubit30(): Promise<number>;
    /** Read 30 signed bits (little-endian). */
    bit30le(): Promise<number>;
    /** Read 30 unsigned bits (little-endian). */
    ubit30le(): Promise<number>;
    /** Read 30 signed bits (big-endian). */
    bit30be(): Promise<number>;
    /** Read 30 unsigned bits (big-endian). */
    ubit30be(): Promise<number>;
    /** Read 31 signed bits. */
    bit31(): Promise<number>;
    /** Read 31 unsigned bits. */
    ubit31(): Promise<number>;
    /** Read 31 signed bits (little-endian). */
    bit31le(): Promise<number>;
    /** Read 31 unsigned bits (little-endian). */
    ubit31le(): Promise<number>;
    /** Read 31 signed bits (big-endian). */
    bit31be(): Promise<number>;
    /** Read 31 unsigned bits (big-endian). */
    ubit31be(): Promise<number>;
    /** Read 32 signed bits. */
    bit32(): Promise<number>;
    /** Read 32 unsigned bits. */
    ubit32(): Promise<number>;
    /** Read 32 signed bits (little-endian). */
    bit32le(): Promise<number>;
    /** Read 32 unsigned bits (little-endian). */
    ubit32le(): Promise<number>;
    /** Read 32 signed bits (big-endian). */
    bit32be(): Promise<number>;
    /** Read 32 unsigned bits (big-endian). */
    ubit32be(): Promise<number>;
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
    * Reads Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    pstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    pstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>;
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
    * Reads Wide-Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    wpstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Wide-Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    wpstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>;
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
    * Reads Double Wide Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    dwpstringle(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>;
    /**
    * Reads Double Wide Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    dwpstringbe(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"]): Promise<string>;
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
declare class BiWriterAsync<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false> extends BiEngine<alwaysBigInt, BytesOutput<DataType>> {
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
    static create<DataType extends string | Uint8Array | Buffer = Uint8Array, alwaysBigInt extends boolean = false>(input: DataType, options?: BiOptions<alwaysBigInt>): Promise<BiWriterAsync<DataType, alwaysBigInt>>;
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
    /** Write a signed 8-bit integer. */
    byte(value: number): Promise<void>;
    /** Write a signed 8-bit integer. */
    int8(value: number): Promise<void>;
    /** Write an unsigned 8-bit integer. */
    uint8(value: number): Promise<void>;
    /** Write an unsigned 8-bit integer. */
    ubyte(value: number): Promise<void>;
    /** Write a signed 16-bit integer. */
    int16(value: number): Promise<void>;
    /** Write a signed 16-bit integer. */
    short(value: number): Promise<void>;
    /** Write a signed 16-bit integer. */
    word(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer. */
    uint16(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer. */
    ushort(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer. */
    uword(value: number): Promise<void>;
    /** Write a signed 16-bit integer (little-endian). */
    int16le(value: number): Promise<void>;
    /** Write a signed 16-bit integer (little-endian). */
    shortle(value: number): Promise<void>;
    /** Write a signed 16-bit integer (little-endian). */
    wordle(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer (little-endian). */
    uint16le(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer (little-endian). */
    ushortle(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer (little-endian). */
    uwordle(value: number): Promise<void>;
    /** Write a signed 16-bit integer (big-endian). */
    int16be(value: number): Promise<void>;
    /** Write a signed 16-bit integer (big-endian). */
    shortbe(value: number): Promise<void>;
    /** Write a signed 16-bit integer (big-endian). */
    wordbe(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer (big-endian). */
    uint16be(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer (big-endian). */
    ushortbe(value: number): Promise<void>;
    /** Write an unsigned 16-bit integer (big-endian). */
    uwordbe(value: number): Promise<void>;
    /** Write a signed 32-bit integer. */
    int(value: number): Promise<void>;
    /** Write a signed 32-bit integer. */
    dword(value: number): Promise<void>;
    /** Write a signed 32-bit integer. */
    int32(value: number): Promise<void>;
    /** Write a signed 32-bit integer. */
    long(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer. */
    uint(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer. */
    udword(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer. */
    uint32(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer. */
    ulong(value: number): Promise<void>;
    /** Write a signed 32-bit integer (little-endian). */
    intle(value: number): Promise<void>;
    /** Write a signed 32-bit integer (little-endian). */
    dwordle(value: number): Promise<void>;
    /** Write a signed 32-bit integer (little-endian). */
    int32le(value: number): Promise<void>;
    /** Write a signed 32-bit integer (little-endian). */
    longle(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer (little-endian). */
    uintle(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer (little-endian). */
    udwordle(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer (little-endian). */
    uint32le(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer (little-endian). */
    ulongle(value: number): Promise<void>;
    /** Write a signed 32-bit integer (big-endian). */
    intbe(value: number): Promise<void>;
    /** Write a signed 32-bit integer (big-endian). */
    dwordbe(value: number): Promise<void>;
    /** Write a signed 32-bit integer (big-endian). */
    int32be(value: number): Promise<void>;
    /** Write a signed 32-bit integer (big-endian). */
    longbe(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer (big-endian). */
    uintbe(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer (big-endian). */
    udwordbe(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer (big-endian). */
    uint32be(value: number): Promise<void>;
    /** Write an unsigned 32-bit integer (big-endian). */
    ulongbe(value: number): Promise<void>;
    /** Write a signed 64-bit integer. */
    int64(value: BigValue): Promise<void>;
    /** Write a signed 64-bit integer. */
    bigint(value: BigValue): Promise<void>;
    /** Write a signed 64-bit integer. */
    quad(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer. */
    uint64(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer. */
    ubigint(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer. */
    uquad(value: BigValue): Promise<void>;
    /** Write a signed 64-bit integer (little-endian). */
    int64le(value: BigValue): Promise<void>;
    /** Write a signed 64-bit integer (little-endian). */
    bigintle(value: BigValue): Promise<void>;
    /** Write a signed 64-bit integer (little-endian). */
    quadle(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer (little-endian). */
    uint64le(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer (little-endian). */
    ubigintle(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer (little-endian). */
    uquadle(value: BigValue): Promise<void>;
    /** Write a signed 64-bit integer (big-endian). */
    int64be(value: BigValue): Promise<void>;
    /** Write a signed 64-bit integer (big-endian). */
    bigintbe(value: BigValue): Promise<void>;
    /** Write a signed 64-bit integer (big-endian). */
    quadbe(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer (big-endian). */
    uint64be(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer (big-endian). */
    ubigintbe(value: BigValue): Promise<void>;
    /** Write an unsigned 64-bit integer (big-endian). */
    uquadbe(value: BigValue): Promise<void>;
    /** Write a 32-bit float. */
    float(value: number): Promise<void>;
    /** Write a 32-bit float (little-endian). */
    floatle(value: number): Promise<void>;
    /** Write a 32-bit float (big-endian). */
    floatbe(value: number): Promise<void>;
    /** Write a 16-bit float. */
    halffloat(value: number): Promise<void>;
    /** Write a 16-bit float. */
    half(value: number): Promise<void>;
    /** Write a 16-bit float (little-endian). */
    halffloatle(value: number): Promise<void>;
    /** Write a 16-bit float (little-endian). */
    halfle(value: number): Promise<void>;
    /** Write a 16-bit float (big-endian). */
    halffloatbe(value: number): Promise<void>;
    /** Write a 16-bit float (big-endian). */
    halfbe(value: number): Promise<void>;
    /** Write a 64-bit float. */
    doublefloat(value: number): Promise<void>;
    /** Write a 64-bit float. */
    dfloat(value: number): Promise<void>;
    /** Write a 64-bit float (little-endian). */
    doublefloatle(value: number): Promise<void>;
    /** Write a 64-bit float (little-endian). */
    dfloatle(value: number): Promise<void>;
    /** Write a 64-bit float (big-endian). */
    doublefloatbe(value: number): Promise<void>;
    /** Write a 64-bit float (big-endian). */
    dfloatbe(value: number): Promise<void>;
    /** Write 1 signed bit. */
    bit1(value: number): Promise<void>;
    /** Write 1 unsigned bit. */
    ubit1(value: number): Promise<void>;
    /** Write 1 signed bit (little-endian). */
    bit1le(value: number): Promise<void>;
    /** Write 1 unsigned bit (little-endian). */
    ubit1le(value: number): Promise<void>;
    /** Write 1 signed bit (big-endian). */
    bit1be(value: number): Promise<void>;
    /** Write 1 unsigned bit (big-endian). */
    ubit1be(value: number): Promise<void>;
    /** Write 2 signed bits. */
    bit2(value: number): Promise<void>;
    /** Write 2 unsigned bits. */
    ubit2(value: number): Promise<void>;
    /** Write 2 signed bits (little-endian). */
    bit2le(value: number): Promise<void>;
    /** Write 2 unsigned bits (little-endian). */
    ubit2le(value: number): Promise<void>;
    /** Write 2 signed bits (big-endian). */
    bit2be(value: number): Promise<void>;
    /** Write 2 unsigned bits (big-endian). */
    ubit2be(value: number): Promise<void>;
    /** Write 3 signed bits. */
    bit3(value: number): Promise<void>;
    /** Write 3 unsigned bits. */
    ubit3(value: number): Promise<void>;
    /** Write 3 signed bits (little-endian). */
    bit3le(value: number): Promise<void>;
    /** Write 3 unsigned bits (little-endian). */
    ubit3le(value: number): Promise<void>;
    /** Write 3 signed bits (big-endian). */
    bit3be(value: number): Promise<void>;
    /** Write 3 unsigned bits (big-endian). */
    ubit3be(value: number): Promise<void>;
    /** Write 4 signed bits. */
    bit4(value: number): Promise<void>;
    /** Write 4 unsigned bits. */
    ubit4(value: number): Promise<void>;
    /** Write 4 signed bits (little-endian). */
    bit4le(value: number): Promise<void>;
    /** Write 4 unsigned bits (little-endian). */
    ubit4le(value: number): Promise<void>;
    /** Write 4 signed bits (big-endian). */
    bit4be(value: number): Promise<void>;
    /** Write 4 unsigned bits (big-endian). */
    ubit4be(value: number): Promise<void>;
    /** Write 5 signed bits. */
    bit5(value: number): Promise<void>;
    /** Write 5 unsigned bits. */
    ubit5(value: number): Promise<void>;
    /** Write 5 signed bits (little-endian). */
    bit5le(value: number): Promise<void>;
    /** Write 5 unsigned bits (little-endian). */
    ubit5le(value: number): Promise<void>;
    /** Write 5 signed bits (big-endian). */
    bit5be(value: number): Promise<void>;
    /** Write 5 unsigned bits (big-endian). */
    ubit5be(value: number): Promise<void>;
    /** Write 6 signed bits. */
    bit6(value: number): Promise<void>;
    /** Write 6 unsigned bits. */
    ubit6(value: number): Promise<void>;
    /** Write 6 signed bits (little-endian). */
    bit6le(value: number): Promise<void>;
    /** Write 6 unsigned bits (little-endian). */
    ubit6le(value: number): Promise<void>;
    /** Write 6 signed bits (big-endian). */
    bit6be(value: number): Promise<void>;
    /** Write 6 unsigned bits (big-endian). */
    ubit6be(value: number): Promise<void>;
    /** Write 7 signed bits. */
    bit7(value: number): Promise<void>;
    /** Write 7 unsigned bits. */
    ubit7(value: number): Promise<void>;
    /** Write 7 signed bits (little-endian). */
    bit7le(value: number): Promise<void>;
    /** Write 7 unsigned bits (little-endian). */
    ubit7le(value: number): Promise<void>;
    /** Write 7 signed bits (big-endian). */
    bit7be(value: number): Promise<void>;
    /** Write 7 unsigned bits (big-endian). */
    ubit7be(value: number): Promise<void>;
    /** Write 8 signed bits. */
    bit8(value: number): Promise<void>;
    /** Write 8 unsigned bits. */
    ubit8(value: number): Promise<void>;
    /** Write 8 signed bits (little-endian). */
    bit8le(value: number): Promise<void>;
    /** Write 8 unsigned bits (little-endian). */
    ubit8le(value: number): Promise<void>;
    /** Write 8 signed bits (big-endian). */
    bit8be(value: number): Promise<void>;
    /** Write 8 unsigned bits (big-endian). */
    ubit8be(value: number): Promise<void>;
    /** Write 9 signed bits. */
    bit9(value: number): Promise<void>;
    /** Write 9 unsigned bits. */
    ubit9(value: number): Promise<void>;
    /** Write 9 signed bits (little-endian). */
    bit9le(value: number): Promise<void>;
    /** Write 9 unsigned bits (little-endian). */
    ubit9le(value: number): Promise<void>;
    /** Write 9 signed bits (big-endian). */
    bit9be(value: number): Promise<void>;
    /** Write 9 unsigned bits (big-endian). */
    ubit9be(value: number): Promise<void>;
    /** Write 10 signed bits. */
    bit10(value: number): Promise<void>;
    /** Write 10 unsigned bits. */
    ubit10(value: number): Promise<void>;
    /** Write 10 signed bits (little-endian). */
    bit10le(value: number): Promise<void>;
    /** Write 10 unsigned bits (little-endian). */
    ubit10le(value: number): Promise<void>;
    /** Write 10 signed bits (big-endian). */
    bit10be(value: number): Promise<void>;
    /** Write 10 unsigned bits (big-endian). */
    ubit10be(value: number): Promise<void>;
    /** Write 11 signed bits. */
    bit11(value: number): Promise<void>;
    /** Write 11 unsigned bits. */
    ubit11(value: number): Promise<void>;
    /** Write 11 signed bits (little-endian). */
    bit11le(value: number): Promise<void>;
    /** Write 11 unsigned bits (little-endian). */
    ubit11le(value: number): Promise<void>;
    /** Write 11 signed bits (big-endian). */
    bit11be(value: number): Promise<void>;
    /** Write 11 unsigned bits (big-endian). */
    ubit11be(value: number): Promise<void>;
    /** Write 12 signed bits. */
    bit12(value: number): Promise<void>;
    /** Write 12 unsigned bits. */
    ubit12(value: number): Promise<void>;
    /** Write 12 signed bits (little-endian). */
    bit12le(value: number): Promise<void>;
    /** Write 12 unsigned bits (little-endian). */
    ubit12le(value: number): Promise<void>;
    /** Write 12 signed bits (big-endian). */
    bit12be(value: number): Promise<void>;
    /** Write 12 unsigned bits (big-endian). */
    ubit12be(value: number): Promise<void>;
    /** Write 13 signed bits. */
    bit13(value: number): Promise<void>;
    /** Write 13 unsigned bits. */
    ubit13(value: number): Promise<void>;
    /** Write 13 signed bits (little-endian). */
    bit13le(value: number): Promise<void>;
    /** Write 13 unsigned bits (little-endian). */
    ubit13le(value: number): Promise<void>;
    /** Write 13 signed bits (big-endian). */
    bit13be(value: number): Promise<void>;
    /** Write 13 unsigned bits (big-endian). */
    ubit13be(value: number): Promise<void>;
    /** Write 14 signed bits. */
    bit14(value: number): Promise<void>;
    /** Write 14 unsigned bits. */
    ubit14(value: number): Promise<void>;
    /** Write 14 signed bits (little-endian). */
    bit14le(value: number): Promise<void>;
    /** Write 14 unsigned bits (little-endian). */
    ubit14le(value: number): Promise<void>;
    /** Write 14 signed bits (big-endian). */
    bit14be(value: number): Promise<void>;
    /** Write 14 unsigned bits (big-endian). */
    ubit14be(value: number): Promise<void>;
    /** Write 15 signed bits. */
    bit15(value: number): Promise<void>;
    /** Write 15 unsigned bits. */
    ubit15(value: number): Promise<void>;
    /** Write 15 signed bits (little-endian). */
    bit15le(value: number): Promise<void>;
    /** Write 15 unsigned bits (little-endian). */
    ubit15le(value: number): Promise<void>;
    /** Write 15 signed bits (big-endian). */
    bit15be(value: number): Promise<void>;
    /** Write 15 unsigned bits (big-endian). */
    ubit15be(value: number): Promise<void>;
    /** Write 16 signed bits. */
    bit16(value: number): Promise<void>;
    /** Write 16 unsigned bits. */
    ubit16(value: number): Promise<void>;
    /** Write 16 signed bits (little-endian). */
    bit16le(value: number): Promise<void>;
    /** Write 16 unsigned bits (little-endian). */
    ubit16le(value: number): Promise<void>;
    /** Write 16 signed bits (big-endian). */
    bit16be(value: number): Promise<void>;
    /** Write 16 unsigned bits (big-endian). */
    ubit16be(value: number): Promise<void>;
    /** Write 17 signed bits. */
    bit17(value: number): Promise<void>;
    /** Write 17 unsigned bits. */
    ubit17(value: number): Promise<void>;
    /** Write 17 signed bits (little-endian). */
    bit17le(value: number): Promise<void>;
    /** Write 17 unsigned bits (little-endian). */
    ubit17le(value: number): Promise<void>;
    /** Write 17 signed bits (big-endian). */
    bit17be(value: number): Promise<void>;
    /** Write 17 unsigned bits (big-endian). */
    ubit17be(value: number): Promise<void>;
    /** Write 18 signed bits. */
    bit18(value: number): Promise<void>;
    /** Write 18 unsigned bits. */
    ubit18(value: number): Promise<void>;
    /** Write 18 signed bits (little-endian). */
    bit18le(value: number): Promise<void>;
    /** Write 18 unsigned bits (little-endian). */
    ubit18le(value: number): Promise<void>;
    /** Write 18 signed bits (big-endian). */
    bit18be(value: number): Promise<void>;
    /** Write 18 unsigned bits (big-endian). */
    ubit18be(value: number): Promise<void>;
    /** Write 19 signed bits. */
    bit19(value: number): Promise<void>;
    /** Write 19 unsigned bits. */
    ubit19(value: number): Promise<void>;
    /** Write 19 signed bits (little-endian). */
    bit19le(value: number): Promise<void>;
    /** Write 19 unsigned bits (little-endian). */
    ubit19le(value: number): Promise<void>;
    /** Write 19 signed bits (big-endian). */
    bit19be(value: number): Promise<void>;
    /** Write 19 unsigned bits (big-endian). */
    ubit19be(value: number): Promise<void>;
    /** Write 20 signed bits. */
    bit20(value: number): Promise<void>;
    /** Write 20 unsigned bits. */
    ubit20(value: number): Promise<void>;
    /** Write 20 signed bits (little-endian). */
    bit20le(value: number): Promise<void>;
    /** Write 20 unsigned bits (little-endian). */
    ubit20le(value: number): Promise<void>;
    /** Write 20 signed bits (big-endian). */
    bit20be(value: number): Promise<void>;
    /** Write 20 unsigned bits (big-endian). */
    ubit20be(value: number): Promise<void>;
    /** Write 21 signed bits. */
    bit21(value: number): Promise<void>;
    /** Write 21 unsigned bits. */
    ubit21(value: number): Promise<void>;
    /** Write 21 signed bits (little-endian). */
    bit21le(value: number): Promise<void>;
    /** Write 21 unsigned bits (little-endian). */
    ubit21le(value: number): Promise<void>;
    /** Write 21 signed bits (big-endian). */
    bit21be(value: number): Promise<void>;
    /** Write 21 unsigned bits (big-endian). */
    ubit21be(value: number): Promise<void>;
    /** Write 22 signed bits. */
    bit22(value: number): Promise<void>;
    /** Write 22 unsigned bits. */
    ubit22(value: number): Promise<void>;
    /** Write 22 signed bits (little-endian). */
    bit22le(value: number): Promise<void>;
    /** Write 22 unsigned bits (little-endian). */
    ubit22le(value: number): Promise<void>;
    /** Write 22 signed bits (big-endian). */
    bit22be(value: number): Promise<void>;
    /** Write 22 unsigned bits (big-endian). */
    ubit22be(value: number): Promise<void>;
    /** Write 23 signed bits. */
    bit23(value: number): Promise<void>;
    /** Write 23 unsigned bits. */
    ubit23(value: number): Promise<void>;
    /** Write 23 signed bits (little-endian). */
    bit23le(value: number): Promise<void>;
    /** Write 23 unsigned bits (little-endian). */
    ubit23le(value: number): Promise<void>;
    /** Write 23 signed bits (big-endian). */
    bit23be(value: number): Promise<void>;
    /** Write 23 unsigned bits (big-endian). */
    ubit23be(value: number): Promise<void>;
    /** Write 24 signed bits. */
    bit24(value: number): Promise<void>;
    /** Write 24 unsigned bits. */
    ubit24(value: number): Promise<void>;
    /** Write 24 signed bits (little-endian). */
    bit24le(value: number): Promise<void>;
    /** Write 24 unsigned bits (little-endian). */
    ubit24le(value: number): Promise<void>;
    /** Write 24 signed bits (big-endian). */
    bit24be(value: number): Promise<void>;
    /** Write 24 unsigned bits (big-endian). */
    ubit24be(value: number): Promise<void>;
    /** Write 25 signed bits. */
    bit25(value: number): Promise<void>;
    /** Write 25 unsigned bits. */
    ubit25(value: number): Promise<void>;
    /** Write 25 signed bits (little-endian). */
    bit25le(value: number): Promise<void>;
    /** Write 25 unsigned bits (little-endian). */
    ubit25le(value: number): Promise<void>;
    /** Write 25 signed bits (big-endian). */
    bit25be(value: number): Promise<void>;
    /** Write 25 unsigned bits (big-endian). */
    ubit25be(value: number): Promise<void>;
    /** Write 26 signed bits. */
    bit26(value: number): Promise<void>;
    /** Write 26 unsigned bits. */
    ubit26(value: number): Promise<void>;
    /** Write 26 signed bits (little-endian). */
    bit26le(value: number): Promise<void>;
    /** Write 26 unsigned bits (little-endian). */
    ubit26le(value: number): Promise<void>;
    /** Write 26 signed bits (big-endian). */
    bit26be(value: number): Promise<void>;
    /** Write 26 unsigned bits (big-endian). */
    ubit26be(value: number): Promise<void>;
    /** Write 27 signed bits. */
    bit27(value: number): Promise<void>;
    /** Write 27 unsigned bits. */
    ubit27(value: number): Promise<void>;
    /** Write 27 signed bits (little-endian). */
    bit27le(value: number): Promise<void>;
    /** Write 27 unsigned bits (little-endian). */
    ubit27le(value: number): Promise<void>;
    /** Write 27 signed bits (big-endian). */
    bit27be(value: number): Promise<void>;
    /** Write 27 unsigned bits (big-endian). */
    ubit27be(value: number): Promise<void>;
    /** Write 28 signed bits. */
    bit28(value: number): Promise<void>;
    /** Write 28 unsigned bits. */
    ubit28(value: number): Promise<void>;
    /** Write 28 signed bits (little-endian). */
    bit28le(value: number): Promise<void>;
    /** Write 28 unsigned bits (little-endian). */
    ubit28le(value: number): Promise<void>;
    /** Write 28 signed bits (big-endian). */
    bit28be(value: number): Promise<void>;
    /** Write 28 unsigned bits (big-endian). */
    ubit28be(value: number): Promise<void>;
    /** Write 29 signed bits. */
    bit29(value: number): Promise<void>;
    /** Write 29 unsigned bits. */
    ubit29(value: number): Promise<void>;
    /** Write 29 signed bits (little-endian). */
    bit29le(value: number): Promise<void>;
    /** Write 29 unsigned bits (little-endian). */
    ubit29le(value: number): Promise<void>;
    /** Write 29 signed bits (big-endian). */
    bit29be(value: number): Promise<void>;
    /** Write 29 unsigned bits (big-endian). */
    ubit29be(value: number): Promise<void>;
    /** Write 30 signed bits. */
    bit30(value: number): Promise<void>;
    /** Write 30 unsigned bits. */
    ubit30(value: number): Promise<void>;
    /** Write 30 signed bits (little-endian). */
    bit30le(value: number): Promise<void>;
    /** Write 30 unsigned bits (little-endian). */
    ubit30le(value: number): Promise<void>;
    /** Write 30 signed bits (big-endian). */
    bit30be(value: number): Promise<void>;
    /** Write 30 unsigned bits (big-endian). */
    ubit30be(value: number): Promise<void>;
    /** Write 31 signed bits. */
    bit31(value: number): Promise<void>;
    /** Write 31 unsigned bits. */
    ubit31(value: number): Promise<void>;
    /** Write 31 signed bits (little-endian). */
    bit31le(value: number): Promise<void>;
    /** Write 31 unsigned bits (little-endian). */
    ubit31le(value: number): Promise<void>;
    /** Write 31 signed bits (big-endian). */
    bit31be(value: number): Promise<void>;
    /** Write 31 unsigned bits (big-endian). */
    ubit31be(value: number): Promise<void>;
    /** Write 32 signed bits. */
    bit32(value: number): Promise<void>;
    /** Write 32 unsigned bits. */
    ubit32(value: number): Promise<void>;
    /** Write 32 signed bits (little-endian). */
    bit32le(value: number): Promise<void>;
    /** Write 32 unsigned bits (little-endian). */
    ubit32le(value: number): Promise<void>;
    /** Write 32 signed bits (big-endian). */
    bit32be(value: number): Promise<void>;
    /** Write 32 unsigned bits (big-endian). */
    ubit32be(value: number): Promise<void>;
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
    latin1string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): Promise<void>;
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

export { BiFileReader, BiFileWriter, BiReader, BiReaderAsync, BiReaderStream, BiWriter, BiWriterAsync, BiWriterStream, bireader, biwriter, hexdump };
