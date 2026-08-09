/**
 * @file Phase-2 engine: BiSyncEngine.
 *
 * The synchronous engine - `BiReader` / `BiWriter` extend it. Built on {@link Cursor} +
 * {@link SyncSource} + the pure {@link codecs}, mirroring {@link BiEngine} but without
 * async/Promises/op-queue (sync calls can't interleave). Position is exposed via property
 * setters (`reader.offset = 10`), matching the sync facade style.
 *
 * File mode is simple: the whole file is loaded into memory (FileSyncSource) and written
 * back on flush - the chunked/windowed strategy is async-only.
 */
import { Cursor } from './cursor.js';
import { MemorySyncSource, FileSyncSource } from './sync-source.js';
import type { SyncSource } from './sync-source.js';
import {
    readInt, writeInt, readBig, writeBig,
    readFloat16, writeFloat16, readFloat32, writeFloat32, readFloat64, writeFloat64,
    readBits, writeBits, numberSafe,
} from './codecs.js';
import {
    _rstring, _wstring, _XOR, _OR, _AND, _ADD, _NOT, _LSHIFT, _RSHIFT, textEncode,
    isBufferOrUint8Array, _hexDump,
    type stringOptions, type hexdumpOptions, type ReturnBigValueMapping,
} from '../../common.js';

export type Endian = 'little' | 'big';

export interface BiSyncEngineOptions {
    endianness?: Endian;
    enforceBigInt?: boolean;
    strict?: boolean;
    readOnly?: boolean;
    growthIncrement?: number;
    byteOffset?: number;
    bitOffset?: number;
}

const hasBigInt = typeof BigInt === 'function';
const MIN_SAFE = hasBigInt ? BigInt(Number.MIN_SAFE_INTEGER) : 0n;
const MAX_SAFE = hasBigInt ? BigInt(Number.MAX_SAFE_INTEGER) : 0n;
function isSafeInt64(v: bigint): boolean { return hasBigInt ? (v >= MIN_SAFE && v <= MAX_SAFE) : false; }

export class BiSyncEngine<alwaysBigInt extends boolean = false, BytesOut extends Uint8Array = Uint8Array> {
    /** File system (node:fs), injected by the entry point for file mode. */
    static fs: typeof import('fs');

    #source: SyncSource | null = null;
    #cursor: Cursor;
    #pendingPath: string | null = null;
    #wasExpanded: boolean = false;

    endian: Endian;
    enforceBigInt: boolean;
    strict: boolean;
    readOnly: boolean;
    growthIncrement: number;
    filePath: string | null = null;
    errorDump: boolean = false;
    strDefaults: stringOptions = { stringType: 'utf-8', terminateValue: 0x0 };

    constructor(input: string | Uint8Array, options: BiSyncEngineOptions = {}) {
        this.endian = options.endianness ?? 'little';
        this.enforceBigInt = (options.enforceBigInt ?? false) && hasBigInt;
        this.readOnly = !!options.readOnly;
        this.strict = this.readOnly ? true : (options.strict ?? false);
        this.growthIncrement = options.growthIncrement ?? 0x100000;
        this.#cursor = new Cursor(options.byteOffset ?? 0, options.bitOffset ?? 0);

        if (typeof input === 'string') {
            this.filePath = input;
            this.#pendingPath = input;
        } else if (isBufferOrUint8Array(input)) {
            this.#source = new MemorySyncSource(input, this.readOnly);
        } else {
            throw new TypeError('Source must be a file path (string) or Uint8Array/Buffer');
        }
    }

    // #region lifecycle / source

    /** True when backed by an in-memory buffer rather than a file. */
    get isMemoryMode(): boolean { return this.#source instanceof MemorySyncSource; }

    /** The live {@link SyncSource} (opens the file lazily in file mode). */
    get source(): SyncSource { return this.#src; }

    get #src(): SyncSource {
        if (!this.#source) return this.#ensureOpen();
        return this.#source;
    }

    #ensureOpen(): SyncSource {
        if (this.#source) return this.#source;
        if (this.#pendingPath) {
            if (!BiSyncEngine.fs) throw new Error("Can't load file outside of Node.");
            try {
                BiSyncEngine.fs.accessSync(this.#pendingPath, BiSyncEngine.fs.constants.F_OK);
            } catch {
                BiSyncEngine.fs.writeFileSync(this.#pendingPath, '');
            }
            const fd = BiSyncEngine.fs.openSync(this.#pendingPath, this.readOnly ? 'r' : 'r+');
            this.#source = new FileSyncSource(fd, BiSyncEngine.fs, this.readOnly);
        }
        if (!this.#source) throw new Error('No data source');
        return this.#source;
    }

    /** Opens the file for reading / writing. Optionally swaps in a new in-memory buffer. */
    open(data?: Uint8Array): void {
        if (data && isBufferOrUint8Array(data)) {
            this.#source = new MemorySyncSource(data, this.readOnly);
            this.#pendingPath = null;
            return;
        }
        this.#ensureOpen();
    }

    // #region position / size

    /** Current buffer / file size in bytes. */
    get size(): number { return this.#source ? this.#source.size : 0; }
    /** Current byte position. */
    get offset(): number { return this.#cursor.byte; }
    /** Moves the current byte position. */
    set offset(value: number) { this.goto(value); }
    /** Current bit position within the current byte (0-7). */
    get insetBit(): number { return this.#cursor.bit; }
    /** Moves the bit position within the current byte (0-7). */
    set insetBit(value: number) { this.goto(this.#cursor.byte, value % 8); }
    /** Current absolute bit position (byte * 8 + inset bit). */
    get bitOffset(): number { return this.#cursor.bitPosition; }
    /** Moves to an absolute bit position (byte * 8 + inset bit). */
    set bitOffset(value: number) { this.goto(value - (value % 8), value % 8); }

    // #region internals

    #alignByte(): void { this.#cursor.alignByte(); }

    #requireReadable(offset: number, length: number): void {
        if (offset + length > this.#src.size) {
            throw new RangeError(`Read of ${length} at ${offset} exceeds size ${this.#src.size}`);
        }
    }

    #ensureWritable(endByte: number): void {
        if (endByte <= this.#src.size) return;
        if (this.strict || this.#src.readOnly) {
            throw new Error(`Reached end of data: need ${endByte}, have ${this.#src.size} (strict/readOnly)`);
        }
        this.#wasExpanded = true;
        this.#src.resize(endByte);
    }

    #reach(targetByte: number): void {
        if (targetByte <= this.size) return;
        if (this.strict || this.readOnly) throw new Error(`Reached end of data: ${targetByte} of ${this.size}`);
        this.#ensureWritable(targetByte);
    }

    /**
     * Returns a fresh copy of `bytes` in the source's native type - a `Buffer` when the
     * source was created from a Buffer or a file path, otherwise a `Uint8Array`. Every
     * sub-array-returning method (extract/subarray/fill/delete/readUBytes/...) routes
     * through here so the output type echoes the input type. Always copies (never a view)
     * - `Buffer.prototype.slice` returns a shared view, so `Buffer.from` is used instead.
     */
    #copyOut(bytes: Uint8Array): BytesOut {
        return (this.#src.isBuffer && typeof Buffer !== 'undefined' ? Buffer.from(bytes) : bytes.slice()) as BytesOut;
    }

    #readAlignedView(width: number): { view: DataView; at: number } {
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#requireReadable(at, width);
        const bytes = this.#src.read(at, width);
        return { view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), at };
    }

    #writeAlignedView(width: number, encode: (v: DataView) => void, consume: boolean): void {
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#ensureWritable(at + width);
        const buf = new Uint8Array(width);
        encode(new DataView(buf.buffer));
        this.#src.write(at, buf);
        if (consume) this.#cursor.set(at + width);
    }

    // #region numeric reads

    /** Reads an 8 bit value (signed unless `unsigned`) at the current byte position. */
    readByte(unsigned = false, consume = true): number {
        const { view, at } = this.#readAlignedView(1);
        const v = readInt(view, 0, 8, !unsigned, false);
        if (consume) this.#cursor.set(at + 1);
        return v;
    }
    /** Reads a 16 bit value (short / word) in the given endian order. */
    readInt16(unsigned = false, endian = this.endian, consume = true): number {
        const { view, at } = this.#readAlignedView(2);
        const v = readInt(view, 0, 16, !unsigned, endian === 'little');
        if (consume) this.#cursor.set(at + 2);
        return v;
    }
    /** Reads a 32 bit value (int / long / dword) in the given endian order. */
    readInt32(unsigned = false, endian = this.endian, consume = true): number {
        const { view, at } = this.#readAlignedView(4);
        const v = readInt(view, 0, 32, !unsigned, endian === 'little');
        if (consume) this.#cursor.set(at + 4);
        return v;
    }
    /**
     * Reads a 64 bit value (quad / bigint) in the given endian order. Returns a `number` when the
     * value is integer safe, otherwise a `bigint` (always `bigint` when `enforceBigInt` is set).
     */
    readInt64(unsigned = false, endian = this.endian, consume = true): ReturnBigValueMapping<alwaysBigInt> {
        if (!hasBigInt) throw new Error("System doesn't support BigInt values.");
        const { view, at } = this.#readAlignedView(8);
        const v = readBig(view, 0, !unsigned, endian === 'little');
        if (consume) this.#cursor.set(at + 8);
        if (this.enforceBigInt || !isSafeInt64(v)) return v as ReturnBigValueMapping<alwaysBigInt>;
        return Number(v) as ReturnBigValueMapping<alwaysBigInt>;
    }
    #readFloatN(width: 16 | 32 | 64, endian: Endian, consume: boolean): number {
        const { view, at } = this.#readAlignedView(width / 8);
        const little = endian === 'little';
        const v = width === 16 ? readFloat16(view, 0, little) : width === 32 ? readFloat32(view, 0, little) : readFloat64(view, 0, little);
        if (consume) this.#cursor.set(at + width / 8);
        return v;
    }
    /** Reads a 16 bit half float in the given endian order. */
    readHalfFloat(endian = this.endian, consume = true): number { return this.#readFloatN(16, endian, consume); }
    /** Reads a 32 bit float in the given endian order. */
    readFloat(endian = this.endian, consume = true): number { return this.#readFloatN(32, endian, consume); }
    /** Reads a 64 bit double float in the given endian order. */
    readDoubleFloat(endian = this.endian, consume = true): number { return this.#readFloatN(64, endian, consume); }

    // #region numeric writes

    /** Writes an 8 bit value at the current byte position. Value is clamped to the type's range. */
    writeByte(value: number, unsigned = false, consume = true): void {
        this.#writeAlignedView(1, v => writeInt(v, 0, numberSafe(value, 8, unsigned), 8, !unsigned, false), consume);
    }
    /** Writes a 16 bit value (short / word) in the given endian order. Value is clamped to the type's range. */
    writeInt16(value: number, unsigned = false, endian = this.endian, consume = true): void {
        this.#writeAlignedView(2, v => writeInt(v, 0, numberSafe(value, 16, unsigned), 16, !unsigned, endian === 'little'), consume);
    }
    /** Writes a 32 bit value (int / long / dword) in the given endian order. Value is clamped to the type's range. */
    writeInt32(value: number, unsigned = false, endian = this.endian, consume = true): void {
        this.#writeAlignedView(4, v => writeInt(v, 0, numberSafe(value, 32, unsigned), 32, !unsigned, endian === 'little'), consume);
    }
    /** Writes a 64 bit value (quad / bigint) in the given endian order. Value is clamped to the type's range. */
    writeInt64(value: number | bigint, unsigned = false, endian = this.endian, consume = true): void {
        if (!hasBigInt) throw new Error("System doesn't support BigInt values.");
        this.#writeAlignedView(8, v => writeBig(v, 0, numberSafe(value, 64, unsigned), !unsigned, endian === 'little'), consume);
    }
    /** Writes a 16 bit half float in the given endian order. */
    writeHalfFloat(value: number, endian = this.endian, consume = true): void {
        this.#writeAlignedView(2, v => writeFloat16(v, 0, value, endian === 'little'), consume);
    }
    /** Writes a 32 bit float in the given endian order. */
    writeFloat(value: number, endian = this.endian, consume = true): void {
        this.#writeAlignedView(4, v => writeFloat32(v, 0, value, endian === 'little'), consume);
    }
    /** Writes a 64 bit double float in the given endian order. */
    writeDoubleFloat(value: number, endian = this.endian, consume = true): void {
        this.#writeAlignedView(8, v => writeFloat64(v, 0, value, endian === 'little'), consume);
    }

    // #region bit fields

    /** Reads a bit field of 1-32 bits from the current bit position, signed or unsigned, in either endian order. */
    readBit(bits: number, unsigned = false, endian = this.endian, consume = true): number {
        if (bits === 0) return 0;
        if (bits < 0 || bits > 32) throw new Error('Bit length must be between 1 and 32. Got ' + bits);
        const endByte = this.#cursor.endByteForBits(bits);
        this.#ensureWritable(endByte);
        const bytes = this.#src.read(this.#cursor.byte, endByte - this.#cursor.byte);
        const v = readBits(bytes, this.#cursor.bit, bits, endian === 'little', !unsigned);
        if (consume) this.#cursor.skip(0, bits);
        return v;
    }
    /** Writes a bit field of 1-32 bits at the current bit position. Value is clamped to the bit width. */
    writeBit(value: number, bits: number, unsigned = false, endian = this.endian, consume = true): void {
        if (bits === 0) return;
        if (bits < 0 || bits > 32) throw new Error('Bit length must be between 1 and 32. Got ' + bits);
        value = numberSafe(value, bits, unsigned);
        const endByte = this.#cursor.endByteForBits(bits);
        this.#ensureWritable(endByte);
        const bytes = new Uint8Array(this.#src.read(this.#cursor.byte, endByte - this.#cursor.byte));
        writeBits(bytes, value, bits, this.#cursor.bit, endian === 'little', !unsigned);
        this.#src.write(this.#cursor.byte, bytes);
        if (consume) this.#cursor.skip(0, bits);
    }

    // #region raw bytes

    /** Reads `amount` bytes from the current byte position as a number array (signed unless `unsigned`). */
    readBytes(amount: number, unsigned?: boolean, consume = true): number[] {
        const data = this.readUBytes(amount, consume);
        const out: number[] = [];
        for (let i = 0; i < data.length; i++) { const v = data[i]; out.push(unsigned ? (v & 0xFF) : (v > 127 ? v - 256 : v)); }
        return out;
    }
    /** Reads `amount` unsigned bytes from the current byte position as a copy in the source's native type. */
    readUBytes(amount: number, consume = true): BytesOut {
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#requireReadable(at, amount);
        const bytes = this.#copyOut(this.#src.read(at, amount));
        if (consume) this.#cursor.set(at + amount);
        return bytes;
    }
    /** Writes raw bytes at the current byte position, overwriting existing data. */
    writeBytes(values: number[] | Uint8Array, unsigned?: boolean, consume = true): void {
        const data = isBufferOrUint8Array(values) ? values : new Uint8Array(values);
        this.overwrite(data, this.offset, consume);
    }
    /** Writes raw unsigned bytes at the current byte position, overwriting existing data. */
    writeUBytes(values: number[] | Uint8Array, consume = true): void { this.writeBytes(values, true, consume); }

    // #region positioning

    /** Moves to an absolute byte / bit position. Throws in strict mode when outside the data size. */
    goto(byte = 0, bit = 0): void {
        this.#reach(byte + Math.ceil(bit / 8));
        this.#cursor.set(byte, bit);
    }
    /** Moves the position by a relative number of bytes / bits. Use negative values to go back. */
    skip(bytes = 0, bits = 0): void {
        const target = this.#cursor.bitPosition + bytes * 8 + bits;
        this.#reach(Math.ceil(Math.max(target, 0) / 8));
        this.#cursor.skip(bytes, bits);
    }
    /** Moves the current byte position to the start of the data. */
    rewind(): void { this.#cursor.set(0, 0); }
    /** Moves the current byte position to the end of the data. */
    last(): void { this.#cursor.set(this.size, 0); }
    /** Aligns the current byte position forward to the next multiple of `n`. */
    align(n: number): void { const a = this.#cursor.byte % n; if (a) this.skip(n - a, 0); }
    /** Aligns the current byte position backward to the previous multiple of `n`. */
    alignRev(n: number): void { const a = this.#cursor.byte % n; if (a) this.skip(-a, 0); }

    // #region structural edits

    #assertMutable(): void {
        if (this.#src.readOnly) throw new Error("Can't modify data in readOnly mode!");
        if (this.strict) throw new Error('\x1b[33m[Strict mode]\x1b[0m: Can not resize data in strict mode. Use unrestrict() first.');
    }
    #shiftForward(offset: number, len: number, oldEnd: number): void {
        const step = 65536; let readEnd = oldEnd;
        while (readEnd > offset) {
            const n = Math.min(step, readEnd - offset);
            const chunk = this.#src.read(readEnd - n, n).slice();
            this.#src.write(readEnd - n + len, chunk);
            readEnd -= n;
        }
    }
    #shiftBackward(start: number, removeLen: number, oldSize: number): void {
        const step = 65536; let readPos = start + removeLen; let writePos = start;
        while (readPos < oldSize) {
            const n = Math.min(step, oldSize - readPos);
            const chunk = this.#src.read(readPos, n).slice();
            this.#src.write(writePos, chunk);
            readPos += n; writePos += n;
        }
    }
    /** Inserts new data at `offset`, growing the buffer and shifting the tail forward. Errors in strict mode. */
    insert(data: Uint8Array, offset = this.offset, consume = true): void {
        this.#assertMutable();
        if (offset < 0 || offset > this.#src.size) throw new RangeError('Insert offset out of bounds');
        if (data.length === 0) return;
        const oldSize = this.#src.size;
        this.#src.resize(oldSize + data.length);
        this.#shiftForward(offset, data.length, oldSize);
        this.#src.write(offset, data);
        if (consume) this.#cursor.set(offset + data.length);
    }
    /** Alias of {@link insert} - inserts new data at `offset`. */
    place(data: Uint8Array, offset = this.offset, consume = true): void { this.insert(data, offset, consume); }
    /** Adds new data to the start of the supplied data. Errors in strict mode. */
    unshift(data: Uint8Array, consume = false): void { this.insert(data, 0, consume); }
    /** Alias of {@link unshift} - adds new data to the start of the supplied data. */
    prepend(data: Uint8Array, consume = false): void { this.insert(data, 0, consume); }
    /** Adds new data to the end of the supplied data. Errors in strict mode. */
    push(data: Uint8Array, consume = false): void { this.insert(data, this.size, consume); }
    /** Alias of {@link push} - adds new data to the end of the supplied data. */
    append(data: Uint8Array, consume = false): void { this.insert(data, this.size, consume); }
    /** Removes `[startOffset, endOffset)` and returns the removed bytes (as the source's native type). Errors in strict mode. */
    delete(startOffset = 0, endOffset = this.offset, consume = false): BytesOut {
        this.#assertMutable();
        startOffset = Math.abs(startOffset);
        if (startOffset < 0 || endOffset > this.#src.size) throw new RangeError('Remove range out of bounds');
        const removeLen = endOffset - startOffset;
        if (removeLen <= 0) return this.#copyOut(new Uint8Array(0));
        const removed = this.#copyOut(this.#src.read(startOffset, removeLen));
        const oldSize = this.#src.size;
        this.#shiftBackward(startOffset, removeLen, oldSize);
        this.#src.resize(oldSize - removeLen);
        if (consume) this.#cursor.set(startOffset);
        return removed;
    }
    /** Removes and returns all data after the current byte position. Errors in strict mode. */
    clip(): BytesOut { return this.delete(this.offset, this.size, false); }
    /** Alias of {@link clip} - removes and returns all data after the current byte position. */
    trim(): BytesOut { return this.delete(this.offset, this.size, false); }
    /** Removes and returns `length` bytes from the current byte position. Errors in strict mode. */
    crop(length = 0, consume = false): BytesOut { return this.delete(this.offset, this.offset + length, consume); }
    /** Alias of {@link crop} - removes and returns `length` bytes from the current byte position. */
    drop(length = 0, consume = false): BytesOut { return this.delete(this.offset, this.offset + length, consume); }
    /** Overwrites data at `offset` (grows if needed, does not shift the tail). */
    replace(data: Uint8Array, offset = this.offset, consume = false): void {
        if (this.#src.readOnly) throw new Error("Can't replace data in readOnly mode!");
        if (data.length === 0) return;
        this.#ensureWritable(offset + data.length);
        this.#src.write(offset, data);
        if (consume) this.#cursor.set(offset + data.length);
    }
    /** Alias of {@link replace} - overwrites data at `offset`. */
    overwrite(data: Uint8Array, offset = this.offset, consume = false): void { this.replace(data, offset, consume); }
    /** Returns a copy of `[startOffset, endOffset)` (as the source's native type); when `fillValue` is supplied, that range is filled with it. */
    fill(startOffset = this.offset, endOffset = this.size, consume = false, fillValue?: number): BytesOut {
        if (this.#src.readOnly && fillValue != undefined) throw new Error("Can't fill data in readOnly mode!");
        if (startOffset < 0 || endOffset > this.#src.size) throw new RangeError('Range out of bounds');
        const len = endOffset - startOffset;
        if (len <= 0) return this.#copyOut(new Uint8Array(0));
        const slice = this.#copyOut(this.#src.read(startOffset, len));
        if (fillValue != undefined) this.#src.write(startOffset, new Uint8Array(len).fill(fillValue & 0xff));
        if (consume) this.#cursor.set(endOffset);
        return slice;
    }
    /** Alias of {@link fill} - returns data between two byte positions, optionally filling that range. */
    lift(startOffset = this.offset, endOffset = this.size, consume = false, fillValue?: number): BytesOut { return this.fill(startOffset, endOffset, consume, fillValue); }
    /** Returns a copy of the data between two byte positions without modifying it. */
    subarray(startOffset = this.offset, endOffset = this.size, consume = false): BytesOut { return this.fill(startOffset, endOffset, consume); }
    /** Returns a copy of `length` bytes from the current byte position without modifying the data. */
    extract(length = 0, consume = false): BytesOut { return this.fill(this.offset, this.offset + length, consume); }
    /** Alias of {@link extract} - returns a copy of `length` bytes from the current byte position. */
    slice(length = 0, consume = false): BytesOut { return this.fill(this.offset, this.offset + length, consume); }
    /** Alias of {@link extract} - returns a copy of `length` bytes from the current byte position. */
    wrap(length = 0, consume = false): BytesOut { return this.fill(this.offset, this.offset + length, consume); }

    // #region strings

    /**
     * Reads a string in any supported format - fixed length or terminated UTF, or Pascal
     * (`stringType`, `length`, `terminateValue`, `lengthReadSize`, `stripNull`, `encoding`, `endian`).
     */
    readString(options: stringOptions = this.strDefaults, consume = true): string {
        const length = options.length;
        const stringType = options.stringType ?? 'utf-8';
        const lengthReadSize = options.lengthReadSize ?? 1;
        const stripNull = options.stripNull ?? true;
        const endian: Endian = (options.endian as Endian) ?? this.endian;
        const encoding = options.encoding ?? 'utf-8';
        const terminate = (options.terminateValue != undefined) ? (options.terminateValue & 0xFF) : 0;
        let readLengthinBytes: number;
        if (length != undefined) {
            readLengthinBytes = stringType === 'utf-16' ? length * 2 : stringType === 'utf-32' ? length * 4 : length;
        } else {
            readLengthinBytes = this.#src.size - this.#cursor.byte;
        }
        this.#requireReadable(this.#cursor.byte, readLengthinBytes);
        const at = this.#cursor.byte;
        const bytes = this.#src.read(at, readLengthinBytes);
        const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        let pos = 0;
        const rU8 = () => bytes[pos++];
        const rU16 = (e: Endian) => { const v = readInt(dv, pos, 16, false, e === 'little'); pos += 2; return v; };
        const rU32 = (e: Endian) => { const v = readInt(dv, pos, 32, false, e === 'little') >>> 0; pos += 4; return v; };
        const str = _rstring(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, rU8, rU16, rU32, length != undefined);
        if (consume) this.#cursor.set(at + pos);
        return str;
    }
    /**
     * Writes a string in any supported format - fixed length or terminated UTF, or Pascal
     * (`stringType`, `length`, `terminateValue`, `lengthWriteSize`, `encoding`, `endian`).
     */
    writeString(str: string, options: stringOptions = this.strDefaults, consume = true): void {
        const length = options.length;
        const stringType = options.stringType ?? 'utf-8';
        let terminateValue = options.terminateValue;
        const lengthWriteSize = options.lengthWriteSize ?? 1;
        const endian: Endian = (options.endian as Endian) ?? this.endian;
        let maxLengthValue = length ?? str.length;
        let strUnits = str.length;
        switch (stringType) {
            case 'pascal': maxLengthValue = length != undefined ? length : 255; break;
            case 'wide-pascal': strUnits *= 2; maxLengthValue = length != undefined ? length / 2 : 65535; break;
            case 'double-wide-pascal': strUnits *= 4; maxLengthValue = length != undefined ? length / 4 : 4294967295; break;
        }
        if (terminateValue == undefined) {
            if (stringType === 'ascii' || stringType === 'utf-8' || stringType === 'utf-16' || stringType === 'utf-32') terminateValue = 0;
            if (length != undefined) terminateValue = undefined;
        }
        const maxBytes = Math.min(strUnits, maxLengthValue);
        str = str.substring(0, maxBytes);
        let encodedString: Uint8Array;
        switch (stringType) {
            case 'utf-16': case 'wide-pascal': {
                const u16 = new Uint16Array(str.length);
                for (let i = 0; i < str.length; i++) u16[i] = str.charCodeAt(i);
                encodedString = new Uint8Array(u16.buffer); break;
            }
            case 'utf-32': case 'double-wide-pascal': {
                const u32 = new Uint32Array(str.length);
                for (let i = 0; i < str.length; i++) u32[i] = str.codePointAt(i) ?? 0;
                encodedString = new Uint8Array(u32.buffer); break;
            }
            default: encodedString = new TextEncoder().encode(str);
        }
        const out: number[] = [];
        const wU8 = (n: number) => { out.push(n & 0xFF); };
        const wU16 = (n: number, e: Endian) => { const b = new Uint8Array(2); writeInt(new DataView(b.buffer), 0, n, 16, false, e === 'little'); out.push(b[0], b[1]); };
        const wU32 = (n: number, e: Endian) => { const b = new Uint8Array(4); writeInt(new DataView(b.buffer), 0, n, 32, false, e === 'little'); out.push(b[0], b[1], b[2], b[3]); };
        _wstring(encodedString, stringType, endian, terminateValue, lengthWriteSize, wU8, wU16, wU32);
        const buf = new Uint8Array(out);
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#ensureWritable(at + buf.length);
        this.#src.write(at, buf);
        if (consume) this.#cursor.set(at + buf.length);
    }

    // #region math

    #normalizeKey(key: number | string | Uint8Array): number | Uint8Array {
        return typeof key === 'string' ? new TextEncoder().encode(key) : key;
    }
    #applyRange(startOffset: number, endOffset: number, apply: (b: Uint8Array) => void, consume: boolean): void {
        if (this.#src.readOnly) throw new Error("Can't write data in readOnly mode!");
        const end = Math.min(endOffset, this.#src.size);
        const len = end - startOffset;
        if (len <= 0) return;
        const bytes = new Uint8Array(this.#src.read(startOffset, len));
        apply(bytes);
        this.#src.write(startOffset, bytes);
        if (consume) this.#cursor.set(end);
    }
    #keyLen(key: number | string | Uint8Array, length?: number): { k: number | Uint8Array; len: number } {
        if (typeof key === 'number') return { k: key, len: length ?? 1 };
        const k = typeof key === 'string' ? new TextEncoder().encode(key) : key;
        return { k, len: length ?? k.length };
    }
    /** XORs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    xor(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _XOR(b, 0, b.length, k), consume); }
    /** ORs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    or(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _OR(b, 0, b.length, k), consume); }
    /** ANDs the byte range `[start, end)` with the key. The key repeats when shorter than the range. */
    and(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _AND(b, 0, b.length, k), consume); }
    /** Adds the key to each byte in `[start, end)`. The key repeats when shorter than the range. */
    add(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _ADD(b, 0, b.length, k), consume); }
    /** NOTs (bitwise inverts) every byte in the range `[start, end)`. */
    not(start = this.offset, end = this.size, consume = false): void { this.#applyRange(start, end, b => _NOT(b, 0, b.length), consume); }
    /** Left shifts each byte in `[start, end)` by the key. The key repeats when shorter than the range. */
    lShift(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _LSHIFT(b, 0, b.length, k), consume); }
    /** Right shifts each byte in `[start, end)` by the key. The key repeats when shorter than the range. */
    rShift(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _RSHIFT(b, 0, b.length, k), consume); }
    /** XORs `length` bytes from the current byte position with the key (length defaults to the key size). */
    xorThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.xor(k, this.offset, this.offset + len, consume); }
    /** ORs `length` bytes from the current byte position with the key (length defaults to the key size). */
    orThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.or(k, this.offset, this.offset + len, consume); }
    /** ANDs `length` bytes from the current byte position with the key (length defaults to the key size). */
    andThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.and(k, this.offset, this.offset + len, consume); }
    /** Adds the key to `length` bytes from the current byte position (length defaults to the key size). */
    addThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.add(k, this.offset, this.offset + len, consume); }
    /** NOTs `length` bytes from the current byte position. */
    notThis(length = 1, consume = false): void { this.not(this.offset, this.offset + length, consume); }
    /** Left shifts `length` bytes from the current byte position by the key (length defaults to the key size). */
    lShiftThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.lShift(k, this.offset, this.offset + len, consume); }
    /** Right shifts `length` bytes from the current byte position by the key (length defaults to the key size). */
    rShiftThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.rShift(k, this.offset, this.offset + len, consume); }

    // #region find

    /** Searches from the current byte position for a byte sequence. Returns its offset or -1. Does not move the position. */
    findBytes(bytesToFind: Uint8Array | number[]): number {
        const needle = Array.isArray(bytesToFind) ? new Uint8Array(bytesToFind) : bytesToFind;
        const data = this.#src.read(0, this.#src.size);
        for (let i = this.#cursor.byte; i <= this.#src.size - needle.length; i++) {
            let match = true;
            for (let j = 0; j < needle.length; j++) { if (data[i + j] !== needle[j]) { match = false; break; } }
            if (match) return i;
        }
        return -1;
    }
    /** Searches from the current byte position for a string. Returns its offset or -1. Does not move the position. */
    findString(str: string, bytesPerChar: 1 | 2 | 4 = 1): number { return this.findBytes(textEncode(str, bytesPerChar)); }
    #findNumber(value: number, bits: number, unsigned: boolean, endian: Endian): number {
        const data = this.#src.read(0, this.#src.size);
        for (let z = this.#cursor.byte; z <= this.#src.size - (bits / 8); z++) {
            const dv = new DataView(data.buffer, data.byteOffset + z, bits / 8);
            const v = bits <= 32 ? readInt(dv, 0, bits as 8 | 16 | 32, !unsigned, endian === 'little') : Number(readBig(dv, 0, !unsigned, endian === 'little'));
            if (v === value) return z;
        }
        return -1;
    }
    /** Searches from the current byte position for an 8 bit value. Returns its offset or -1. Does not move the position. */
    findByte(value: number, unsigned = true, endian = this.endian): number { return this.#findNumber(value, 8, unsigned, endian); }
    /** Searches from the current byte position for a 16 bit value. Returns its offset or -1. Does not move the position. */
    findShort(value: number, unsigned = true, endian = this.endian): number { return this.#findNumber(value, 16, unsigned, endian); }
    /** Searches from the current byte position for a 32 bit value. Returns its offset or -1. Does not move the position. */
    findInt(value: number, unsigned = true, endian = this.endian): number { return this.#findNumber(value, 32, unsigned, endian); }

    // #region endianness

    /** Sets the default endian order. Can be changed at any time. */
    endianness(endian: Endian): void { if (endian !== 'big' && endian !== 'little') throw new TypeError('Endian must be big or little'); this.endian = endian; }
    /** Switches the default endian order to big endian. */
    bigEndian(): void { this.endian = 'big'; }
    /** Alias of {@link bigEndian} - switches to big endian. */
    big(): void { this.endian = 'big'; }
    /** Alias of {@link bigEndian} - switches to big endian. */
    be(): void { this.endian = 'big'; }
    /** Switches the default endian order to little endian. */
    littleEndian(): void { this.endian = 'little'; }
    /** Alias of {@link littleEndian} - switches to little endian. */
    little(): void { this.endian = 'little'; }
    /** Alias of {@link littleEndian} - switches to little endian. */
    le(): void { this.endian = 'little'; }

    // #region read/write aliases

    /** Reads an unsigned 8 bit value. */
    readUByte(consume = true): number { return this.readByte(true, consume); }
    /** Reads an unsigned 16 bit value in the given endian order. */
    readUInt16(endian = this.endian): number { return this.readInt16(true, endian); }
    /** Reads an unsigned 16 bit little endian value. */
    readUInt16LE(): number { return this.readInt16(true, 'little'); }
    /** Reads an unsigned 16 bit big endian value. */
    readUInt16BE(): number { return this.readInt16(true, 'big'); }
    /** Reads a signed 16 bit little endian value. */
    readInt16LE(): number { return this.readInt16(false, 'little'); }
    /** Reads a signed 16 bit big endian value. */
    readInt16BE(): number { return this.readInt16(false, 'big'); }
    /** Reads a signed 32 bit value in the given endian order. */
    readInt(endian = this.endian): number { return this.readInt32(false, endian); }
    /** Reads an unsigned 32 bit value in the given endian order. */
    readUInt(endian = this.endian): number { return this.readInt32(true, endian); }
    /** Reads an unsigned 32 bit value in the given endian order. */
    readUInt32(endian = this.endian): number { return this.readInt32(true, endian); }
    /** Reads a signed 32 bit little endian value. */
    readInt32LE(): number { return this.readInt32(false, 'little'); }
    /** Reads a signed 32 bit big endian value. */
    readInt32BE(): number { return this.readInt32(false, 'big'); }
    /** Reads an unsigned 32 bit little endian value. */
    readUInt32LE(): number { return this.readInt32(true, 'little'); }
    /** Reads an unsigned 32 bit big endian value. */
    readUInt32BE(): number { return this.readInt32(true, 'big'); }
    /** Reads a 32 bit float in the given endian order. */
    readFloat32(endian = this.endian, consume = true): number { return this.readFloat(endian, consume); }
    /** Reads a 32 bit little endian float. */
    readFloatLE(): number { return this.readFloat('little'); }
    /** Reads a 32 bit big endian float. */
    readFloatBE(): number { return this.readFloat('big'); }
    /** Reads a 32 bit little endian float. */
    readFloat32LE(): number { return this.readFloat('little'); }
    /** Reads a 32 bit big endian float. */
    readFloat32BE(): number { return this.readFloat('big'); }
    /** Reads a 16 bit half float in the given endian order. */
    readFloat16(endian = this.endian, consume = true): number { return this.readHalfFloat(endian, consume); }
    /** Reads a 16 bit little endian half float. */
    readHalfFloatLE(): number { return this.readHalfFloat('little'); }
    /** Reads a 16 bit big endian half float. */
    readHalfFloatBE(): number { return this.readHalfFloat('big'); }
    /** Reads a 16 bit little endian half float. */
    readFloat16LE(): number { return this.readHalfFloat('little'); }
    /** Reads a 16 bit big endian half float. */
    readFloat16BE(): number { return this.readHalfFloat('big'); }
    /** Reads a 64 bit double float in the given endian order. */
    readFloat64(endian = this.endian, consume = true): number { return this.readDoubleFloat(endian, consume); }
    /** Reads a 64 bit little endian double float. */
    readDoubleFloatLE(): number { return this.readDoubleFloat('little'); }
    /** Reads a 64 bit big endian double float. */
    readDoubleFloatBE(): number { return this.readDoubleFloat('big'); }
    /** Reads a 64 bit little endian double float. */
    readFloat64LE(): number { return this.readDoubleFloat('little'); }
    /** Reads a 64 bit big endian double float. */
    readFloat64BE(): number { return this.readDoubleFloat('big'); }
    /** Reads an unsigned 64 bit value in the current endian order. */
    readUInt64(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(true); }
    /** Reads a signed 64 bit little endian value. */
    readInt64LE(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(false, 'little'); }
    /** Reads a signed 64 bit big endian value. */
    readInt64BE(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(false, 'big'); }
    /** Reads an unsigned 64 bit little endian value. */
    readUInt64LE(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(true, 'little'); }
    /** Reads an unsigned 64 bit big endian value. */
    readUInt64BE(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(true, 'big'); }
    /** Reads an unsigned bit field of 1-32 bits in big endian order. */
    readUBitBE(bits: number): number { return this.readBit(bits, true, 'big'); }
    /** Reads an unsigned bit field of 1-32 bits in little endian order. */
    readUBitLE(bits: number): number { return this.readBit(bits, true, 'little'); }
    /** Reads a bit field of 1-32 bits in big endian order. */
    readBitBE(bits: number, unsigned?: boolean): number { return this.readBit(bits, unsigned, 'big'); }
    /** Reads a bit field of 1-32 bits in little endian order. */
    readBitLE(bits: number, unsigned?: boolean): number { return this.readBit(bits, unsigned, 'little'); }

    /** Writes an unsigned 8 bit value. */
    writeUByte(value: number, consume = true): void { this.writeByte(value, true, consume); }
    /** Writes an unsigned 16 bit value in the given endian order. */
    writeUInt16(value: number, endian = this.endian): void { this.writeInt16(value, true, endian); }
    /** Writes an unsigned 16 bit little endian value. */
    writeUInt16LE(value: number): void { this.writeInt16(value, true, 'little'); }
    /** Writes an unsigned 16 bit big endian value. */
    writeUInt16BE(value: number): void { this.writeInt16(value, true, 'big'); }
    /** Writes a signed 16 bit little endian value. */
    writeInt16LE(value: number): void { this.writeInt16(value, false, 'little'); }
    /** Writes a signed 16 bit big endian value. */
    writeInt16BE(value: number): void { this.writeInt16(value, false, 'big'); }
    /** Writes a signed 32 bit value in the given endian order. */
    writeInt(value: number, endian = this.endian): void { this.writeInt32(value, false, endian); }
    /** Writes an unsigned 32 bit value in the given endian order. */
    writeUInt(value: number, endian = this.endian): void { this.writeInt32(value, true, endian); }
    /** Writes an unsigned 32 bit value in the given endian order. */
    writeUInt32(value: number, endian = this.endian): void { this.writeInt32(value, true, endian); }
    /** Writes a signed 32 bit little endian value. */
    writeInt32LE(value: number): void { this.writeInt32(value, false, 'little'); }
    /** Writes a signed 32 bit big endian value. */
    writeInt32BE(value: number): void { this.writeInt32(value, false, 'big'); }
    /** Writes an unsigned 32 bit little endian value. */
    writeUInt32LE(value: number): void { this.writeInt32(value, true, 'little'); }
    /** Writes an unsigned 32 bit big endian value. */
    writeUInt32BE(value: number): void { this.writeInt32(value, true, 'big'); }
    /** Writes a 32 bit float in the given endian order. */
    writeFloat32(value: number, endian = this.endian, consume = true): void { this.writeFloat(value, endian, consume); }
    /** Writes a 32 bit little endian float. */
    writeFloatLE(value: number): void { this.writeFloat(value, 'little'); }
    /** Writes a 32 bit big endian float. */
    writeFloatBE(value: number): void { this.writeFloat(value, 'big'); }
    /** Writes a 32 bit little endian float. */
    writeFloat32LE(value: number): void { this.writeFloat(value, 'little'); }
    /** Writes a 32 bit big endian float. */
    writeFloat32BE(value: number): void { this.writeFloat(value, 'big'); }
    /** Writes a 16 bit half float in the given endian order. */
    writeFloat16(value: number, endian = this.endian, consume = true): void { this.writeHalfFloat(value, endian, consume); }
    /** Writes a 16 bit little endian half float. */
    writeHalfFloatLE(value: number): void { this.writeHalfFloat(value, 'little'); }
    /** Writes a 16 bit big endian half float. */
    writeHalfFloatBE(value: number): void { this.writeHalfFloat(value, 'big'); }
    /** Writes a 16 bit little endian half float. */
    writeFloat16LE(value: number): void { this.writeHalfFloat(value, 'little'); }
    /** Writes a 16 bit big endian half float. */
    writeFloat16BE(value: number): void { this.writeHalfFloat(value, 'big'); }
    /** Writes a 64 bit double float in the given endian order. */
    writeFloat64(value: number, endian = this.endian, consume = true): void { this.writeDoubleFloat(value, endian, consume); }
    /** Writes a 64 bit little endian double float. */
    writeDoubleFloatLE(value: number): void { this.writeDoubleFloat(value, 'little'); }
    /** Writes a 64 bit big endian double float. */
    writeDoubleFloatBE(value: number): void { this.writeDoubleFloat(value, 'big'); }
    /** Writes a 64 bit little endian double float. */
    writeFloat64LE(value: number): void { this.writeDoubleFloat(value, 'little'); }
    /** Writes a 64 bit big endian double float. */
    writeFloat64BE(value: number): void { this.writeDoubleFloat(value, 'big'); }
    /** Writes an unsigned 64 bit value in the given endian order. */
    writeUInt64(value: number | bigint, endian = this.endian): void { this.writeInt64(value, true, endian); }
    /** Writes a signed 64 bit little endian value. */
    writeInt64LE(value: number | bigint): void { this.writeInt64(value, false, 'little'); }
    /** Writes a signed 64 bit big endian value. */
    writeInt64BE(value: number | bigint): void { this.writeInt64(value, false, 'big'); }
    /** Writes an unsigned 64 bit little endian value. */
    writeUInt64LE(value: number | bigint): void { this.writeInt64(value, true, 'little'); }
    /** Writes an unsigned 64 bit big endian value. */
    writeUInt64BE(value: number | bigint): void { this.writeInt64(value, true, 'big'); }
    /** Writes an unsigned bit field of 1-32 bits in big endian order. */
    writeUBitBE(value: number, bits: number): void { this.writeBit(value, bits, true, 'big'); }
    /** Writes an unsigned bit field of 1-32 bits in little endian order. */
    writeUBitLE(value: number, bits: number): void { this.writeBit(value, bits, true, 'little'); }
    /** Writes a bit field of 1-32 bits in big endian order. */
    writeBitBE(value: number, bits: number, unsigned?: boolean): void { this.writeBit(value, bits, unsigned, 'big'); }
    /** Writes a bit field of 1-32 bits in little endian order. */
    writeBitLE(value: number, bits: number, unsigned?: boolean): void { this.writeBit(value, bits, unsigned, 'little'); }

    // #region size / position alias getters + setters

    /** Current buffer size in bits. */
    get bitSize(): number { return this.size * 8; }
    /** Current buffer size in bytes. */
    get length(): number { return this.size; }
    /** Current buffer size in bytes. */
    get len(): number { return this.size; }
    /** Current buffer / file size in bytes. */
    get fileSize(): number { return this.size; }
    /** Current buffer / file size in bytes. */
    get FileSize(): number { return this.size; }
    /** Current buffer size in bits. */
    get lengthBits(): number { return this.size * 8; }
    /** Current buffer size in bits. */
    get sizeBits(): number { return this.size * 8; }
    /** Current buffer / file size in bits. */
    get fileBitSize(): number { return this.size * 8; }
    /** Current buffer / file size in bits. */
    get fileSizeBits(): number { return this.size * 8; }
    /** Current buffer size in bits. */
    get lenBits(): number { return this.size * 8; }
    /** Current byte position. */
    get off(): number { return this.#cursor.byte; }
    /** Current byte position. */
    get getOffset(): number { return this.#cursor.byte; }
    /** Current byte position. */
    get tell(): number { return this.#cursor.byte; }
    /** Current byte position. */
    get FTell(): number { return this.#cursor.byte; }
    /** Current byte position. */
    get saveOffset(): number { return this.#cursor.byte; }
    /** Current byte position. */
    get byteOffset(): number { return this.#cursor.byte; }
    /** Moves the current byte position. */
    set setOffset(value: number) { this.offset = value; }
    /** Moves the current byte position. */
    set setByteOffset(value: number) { this.offset = value; }
    /** Current absolute bit position. */
    get offsetBits(): number { return this.#cursor.bitPosition; }
    /** Current absolute bit position. */
    get getBitOffset(): number { return this.#cursor.bitPosition; }
    /** Current absolute bit position. */
    get saveBitOffset(): number { return this.#cursor.bitPosition; }
    /** Current absolute bit position. */
    get FTellBits(): number { return this.#cursor.bitPosition; }
    /** Current bit position within the current byte (0-7). */
    get tellBits(): number { return this.#cursor.bit; }
    /** Current absolute bit position. */
    get offBits(): number { return this.#cursor.bitPosition; }
    /** Moves to an absolute bit position. */
    set setOffsetBits(value: number) { this.bitOffset = value; }
    /** Moves to an absolute bit position. */
    set setBitOffset(value: number) { this.bitOffset = value; }
    /** Current bit position within the current byte (0-7). */
    get getInsetBit(): number { return this.#cursor.bit; }
    /** Current bit position within the current byte (0-7). */
    get saveInsetBit(): number { return this.#cursor.bit; }
    /** Current bit position within the current byte (0-7). */
    get inBit(): number { return this.#cursor.bit; }
    /** Current bit position within the current byte (0-7). */
    get bitTell(): number { return this.#cursor.bit; }
    /** Moves the bit position within the current byte (0-7). */
    set setInsetBit(value: number) { this.insetBit = value; }
    /** Bytes remaining between the current byte position and the end of the data. */
    get remain(): number { return this.size - this.#cursor.byte; }
    /** Bytes remaining between the current byte position and the end of the data. */
    get remainBytes(): number { return this.size - this.#cursor.byte; }
    /** Bytes remaining between the current byte position and the end of the data. */
    get FEoF(): number { return this.size - this.#cursor.byte; }
    /** Bits remaining between the current bit position and the end of the data. */
    get remainBits(): number { return (this.size * 8) - this.#cursor.bitPosition; }
    /** Bits remaining between the current bit position and the end of the data. */
    get FEoFBits(): number { return (this.size * 8) - this.#cursor.bitPosition; }
    /** Row line of the current byte position (16 bytes per row). */
    get getLine(): number { return Math.abs(Math.floor((this.#cursor.byte - 1) / 16)); }
    /** Row line of the current byte position (16 bytes per row). */
    get row(): number { return this.getLine; }

    // #region move aliases

    /** Alias of {@link skip} - moves the position by a relative number of bytes / bits. */
    jump(bytes: number, bits?: number): void { this.skip(bytes, bits ?? 0); }
    /** Alias of {@link skip} - moves the position by a relative number of bytes / bits. */
    seek(bytes: number, bits?: number): void { this.skip(bytes, bits ?? 0); }
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    FSeek(byte: number, bit?: number): void { this.goto(byte, bit ?? 0); }
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    pointer(byte: number, bit?: number): void { this.goto(byte, bit ?? 0); }
    /** Alias of {@link goto} - moves to an absolute byte / bit position. */
    warp(byte: number, bit?: number): void { this.goto(byte, bit ?? 0); }
    /** Alias of {@link rewind} - moves the current byte position to the start of the data. */
    gotoStart(): void { this.rewind(); }
    /** Alias of {@link last} - moves the current byte position to the end of the data. */
    gotoEnd(): void { this.last(); }
    /** Alias of {@link last} - moves the current byte position to the end of the data. */
    EoF(): void { this.last(); }

    // #region type checks / dump / strict

    /** True when the value is a `Buffer` or `Uint8Array`. */
    isBufferOrUint8Array(obj: any): obj is Uint8Array { return isBufferOrUint8Array(obj); }
    /** True when the value is a Node `Buffer`. */
    isBuffer(obj: any): obj is Uint8Array { return typeof Buffer !== 'undefined' && Buffer.isBuffer(obj); }
    /** True when the value is a plain `Uint8Array` (not a `Buffer`). */
    isUint8Array(obj: any): boolean { return obj instanceof Uint8Array && !this.isBuffer(obj); }
    /** Turns strict mode on - the data won't be extended past its max size. */
    restrict(): void { this.strict = true; }
    /** Turns strict mode off - the data is extended when writing past its max size. */
    unrestrict(): void { this.strict = false; }
    /** Turns off the hexdump on error (default). */
    errorDumpOff(): void { this.errorDump = false; }
    /** Turns on the hexdump on error. */
    errorDumpOn(): void { this.errorDump = true; }
    /** Merges default string options used by the `str` get / set and the string presets. */
    set strSettings(settings: stringOptions) { this.strDefaults = { ...this.strDefaults, ...settings }; }

    /** Console logs the data as a hex dump, or returns it as a string with `returnString`. */
    hexdump(options: hexdumpOptions = {}): void | string {
        const length = options.length ?? 192;
        const startByte = options.startByte ?? this.#cursor.byte;
        const endByte = Math.min(startByte + length, this.size);
        if (startByte > this.size || endByte > this.size) throw new RangeError('Hexdump amount is outside of data size');
        const data = this.#src.read(startByte, Math.min(endByte, this.size) - startByte);
        return _hexDump(data, options, startByte, endByte);
    }

    // #region data / lifecycle

    /** The full current buffer data (as the source's native type), or null when no source is open. */
    get data(): BytesOut | null {
        if (this.#source instanceof MemorySyncSource) return this.#source.data as BytesOut;
        if (this.#source instanceof FileSyncSource) return this.#source.data as BytesOut;
        return null;
    }
    /** A `DataView` over the current buffer data, or null when no source is open. */
    get view(): DataView | null {
        const d = this.data;
        return d ? new DataView(d.buffer, d.byteOffset, d.byteLength) : null;
    }
    /** Commits any pending edits to the file. */
    commit(): void { this.flush(); }
    /** Flushes any pending edits through to the underlying source. */
    flush(): void { if (this.#source) this.#source.flush(); }
    /**
     * Returns the supplied data, trimmed to the current write position when `growthIncrement`
     * expanded the buffer. Use `.data` for the full padded buffer.
     */
    get(): BytesOut {
        const src = this.#src;
        src.flush();
        const full = src instanceof MemorySyncSource ? src.data : src instanceof FileSyncSource ? src.data : new Uint8Array(src.read(0, this.size));
        if (this.growthIncrement !== 0 && this.#wasExpanded) return full.subarray(0, this.#cursor.byte) as BytesOut;
        return full as BytesOut;
    }
    /** Alias of {@link get} - returns the supplied data. */
    getData(): BytesOut { return this.get(); }
    /** Alias of {@link get} - returns the supplied data. */
    getFullBuffer(): BytesOut { return this.get(); }
    /** Alias of {@link get} - returns the supplied data. */
    return(): BytesOut { return this.get(); }
    /** Alias of {@link close} - flushes and releases the supplied data. */
    end(): BytesOut | void { return this.close(); }
    /** Alias of {@link close} - flushes and releases the supplied data. */
    done(): BytesOut | void { return this.close(); }
    /** Alias of {@link close} - flushes and releases the supplied data. */
    finished(): BytesOut | void { return this.close(); }
    /** Commits any edits and closes the file. In memory mode returns the buffer instead. */
    close(): BytesOut | void {
        const src = this.#src;
        src.flush();
        if (src instanceof MemorySyncSource) return src.data as BytesOut;
        src.close();
        this.#source = null;
        this.#pendingPath = this.filePath;
    }
    /** Enables or disables writing and expanding (sets `strict` and `readOnly`). Reopens the file in file mode. */
    writeMode(mode = true): void {
        this.strict = !mode;
        this.readOnly = !mode;
        if (this.#pendingPath || (this.#source && !(this.#source instanceof MemorySyncSource))) this.close();
    }
    /** Renames the file on the file system, keeping the read / write position. This is permanent. */
    renameFile(newFilePath: string): void {
        if (this.isMemoryMode) return;
        this.close();
        if (!BiSyncEngine.fs) throw new Error("Can't rename file outside of Node.");
        BiSyncEngine.fs.renameSync(this.filePath as string, newFilePath);
        this.filePath = newFilePath;
        this.#pendingPath = newFilePath;
        this.open();
    }
    /** Unlinks the file from the file system. This is permanent - it does not go to the recycling bin. */
    deleteFile(): void {
        if (this.isMemoryMode) return;
        if (this.readOnly) throw new Error("Can't delete file in readOnly mode!");
        this.close();
        if (!BiSyncEngine.fs) throw new Error("Can't delete file outside of Node.");
        BiSyncEngine.fs.unlinkSync(this.filePath as string);
        this.filePath = null;
        this.#pendingPath = null;
    }
}
