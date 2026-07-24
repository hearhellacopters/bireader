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

export class BiSyncEngine<alwaysBigInt extends boolean = false> {
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

    get isMemoryMode(): boolean { return this.#source instanceof MemorySyncSource; }

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

    open(data?: Uint8Array): void {
        if (data && isBufferOrUint8Array(data)) {
            this.#source = new MemorySyncSource(data, this.readOnly);
            this.#pendingPath = null;
            return;
        }
        this.#ensureOpen();
    }

    // #region position / size

    get size(): number { return this.#source ? this.#source.size : 0; }
    get offset(): number { return this.#cursor.byte; }
    set offset(value: number) { this.goto(value); }
    get insetBit(): number { return this.#cursor.bit; }
    set insetBit(value: number) { this.goto(this.#cursor.byte, value % 8); }
    get bitOffset(): number { return this.#cursor.bitPosition; }
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

    readByte(unsigned = false, consume = true): number {
        const { view, at } = this.#readAlignedView(1);
        const v = readInt(view, 0, 8, !unsigned, false);
        if (consume) this.#cursor.set(at + 1);
        return v;
    }
    readInt16(unsigned = false, endian = this.endian, consume = true): number {
        const { view, at } = this.#readAlignedView(2);
        const v = readInt(view, 0, 16, !unsigned, endian === 'little');
        if (consume) this.#cursor.set(at + 2);
        return v;
    }
    readInt32(unsigned = false, endian = this.endian, consume = true): number {
        const { view, at } = this.#readAlignedView(4);
        const v = readInt(view, 0, 32, !unsigned, endian === 'little');
        if (consume) this.#cursor.set(at + 4);
        return v;
    }
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
    readHalfFloat(endian = this.endian, consume = true): number { return this.#readFloatN(16, endian, consume); }
    readFloat(endian = this.endian, consume = true): number { return this.#readFloatN(32, endian, consume); }
    readDoubleFloat(endian = this.endian, consume = true): number { return this.#readFloatN(64, endian, consume); }

    // #region numeric writes

    writeByte(value: number, unsigned = false, consume = true): void {
        this.#writeAlignedView(1, v => writeInt(v, 0, numberSafe(value, 8, unsigned), 8, !unsigned, false), consume);
    }
    writeInt16(value: number, unsigned = false, endian = this.endian, consume = true): void {
        this.#writeAlignedView(2, v => writeInt(v, 0, numberSafe(value, 16, unsigned), 16, !unsigned, endian === 'little'), consume);
    }
    writeInt32(value: number, unsigned = false, endian = this.endian, consume = true): void {
        this.#writeAlignedView(4, v => writeInt(v, 0, numberSafe(value, 32, unsigned), 32, !unsigned, endian === 'little'), consume);
    }
    writeInt64(value: number | bigint, unsigned = false, endian = this.endian, consume = true): void {
        if (!hasBigInt) throw new Error("System doesn't support BigInt values.");
        this.#writeAlignedView(8, v => writeBig(v, 0, numberSafe(value, 64, unsigned), !unsigned, endian === 'little'), consume);
    }
    writeHalfFloat(value: number, endian = this.endian, consume = true): void {
        this.#writeAlignedView(2, v => writeFloat16(v, 0, value, endian === 'little'), consume);
    }
    writeFloat(value: number, endian = this.endian, consume = true): void {
        this.#writeAlignedView(4, v => writeFloat32(v, 0, value, endian === 'little'), consume);
    }
    writeDoubleFloat(value: number, endian = this.endian, consume = true): void {
        this.#writeAlignedView(8, v => writeFloat64(v, 0, value, endian === 'little'), consume);
    }

    // #region bit fields

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

    readBytes(amount: number, unsigned?: boolean, consume = true): number[] {
        const data = this.readUBytes(amount, consume);
        const out: number[] = [];
        for (let i = 0; i < data.length; i++) { const v = data[i]; out.push(unsigned ? (v & 0xFF) : (v > 127 ? v - 256 : v)); }
        return out;
    }
    readUBytes(amount: number, consume = true): Uint8Array {
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#requireReadable(at, amount);
        const bytes = this.#src.read(at, amount).slice();
        if (consume) this.#cursor.set(at + amount);
        return bytes;
    }
    writeBytes(values: number[] | Uint8Array, unsigned?: boolean, consume = true): void {
        const data = isBufferOrUint8Array(values) ? values : new Uint8Array(values);
        this.overwrite(data, this.offset, consume);
    }
    writeUBytes(values: number[] | Uint8Array, consume = true): void { this.writeBytes(values, true, consume); }

    // #region positioning

    goto(byte = 0, bit = 0): void {
        this.#reach(byte + Math.ceil(bit / 8));
        this.#cursor.set(byte, bit);
    }
    skip(bytes = 0, bits = 0): void {
        const target = this.#cursor.bitPosition + bytes * 8 + bits;
        this.#reach(Math.ceil(Math.max(target, 0) / 8));
        this.#cursor.skip(bytes, bits);
    }
    rewind(): void { this.#cursor.set(0, 0); }
    last(): void { this.#cursor.set(this.size, 0); }
    align(n: number): void { const a = this.#cursor.byte % n; if (a) this.skip(n - a, 0); }
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
    place(data: Uint8Array, offset = this.offset, consume = true): void { this.insert(data, offset, consume); }
    unshift(data: Uint8Array, consume = false): void { this.insert(data, 0, consume); }
    prepend(data: Uint8Array, consume = false): void { this.insert(data, 0, consume); }
    push(data: Uint8Array, consume = false): void { this.insert(data, this.size, consume); }
    append(data: Uint8Array, consume = false): void { this.insert(data, this.size, consume); }
    delete(startOffset = 0, endOffset = this.offset, consume = false): Uint8Array {
        this.#assertMutable();
        startOffset = Math.abs(startOffset);
        if (startOffset < 0 || endOffset > this.#src.size) throw new RangeError('Remove range out of bounds');
        const removeLen = endOffset - startOffset;
        if (removeLen <= 0) return new Uint8Array(0);
        const removed = this.#src.read(startOffset, removeLen).slice();
        const oldSize = this.#src.size;
        this.#shiftBackward(startOffset, removeLen, oldSize);
        this.#src.resize(oldSize - removeLen);
        if (consume) this.#cursor.set(startOffset);
        return removed;
    }
    clip(): Uint8Array { return this.delete(this.offset, this.size, false); }
    trim(): Uint8Array { return this.delete(this.offset, this.size, false); }
    crop(length = 0, consume = false): Uint8Array { return this.delete(this.offset, this.offset + length, consume); }
    drop(length = 0, consume = false): Uint8Array { return this.delete(this.offset, this.offset + length, consume); }
    replace(data: Uint8Array, offset = this.offset, consume = false): void {
        if (this.#src.readOnly) throw new Error("Can't replace data in readOnly mode!");
        if (data.length === 0) return;
        this.#ensureWritable(offset + data.length);
        this.#src.write(offset, data);
        if (consume) this.#cursor.set(offset + data.length);
    }
    overwrite(data: Uint8Array, offset = this.offset, consume = false): void { this.replace(data, offset, consume); }
    fill(startOffset = this.offset, endOffset = this.size, consume = false, fillValue?: number): Uint8Array {
        if (this.#src.readOnly && fillValue != undefined) throw new Error("Can't fill data in readOnly mode!");
        if (startOffset < 0 || endOffset > this.#src.size) throw new RangeError('Range out of bounds');
        const len = endOffset - startOffset;
        if (len <= 0) return new Uint8Array(0);
        const slice = this.#src.read(startOffset, len).slice();
        if (fillValue != undefined) this.#src.write(startOffset, new Uint8Array(len).fill(fillValue & 0xff));
        if (consume) this.#cursor.set(endOffset);
        return slice;
    }
    lift(startOffset = this.offset, endOffset = this.size, consume = false, fillValue?: number): Uint8Array { return this.fill(startOffset, endOffset, consume, fillValue); }
    subarray(startOffset = this.offset, endOffset = this.size, consume = false): Uint8Array { return this.fill(startOffset, endOffset, consume); }
    extract(length = 0, consume = false): Uint8Array { return this.fill(this.offset, this.offset + length, consume); }
    slice(length = 0, consume = false): Uint8Array { return this.fill(this.offset, this.offset + length, consume); }
    wrap(length = 0, consume = false): Uint8Array { return this.fill(this.offset, this.offset + length, consume); }

    // #region strings

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
        const str = _rstring(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, rU8, rU16, rU32);
        if (consume) this.#cursor.set(at + pos);
        return str;
    }
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
    xor(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _XOR(b, 0, b.length, k), consume); }
    or(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _OR(b, 0, b.length, k), consume); }
    and(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _AND(b, 0, b.length, k), consume); }
    add(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _ADD(b, 0, b.length, k), consume); }
    not(start = this.offset, end = this.size, consume = false): void { this.#applyRange(start, end, b => _NOT(b, 0, b.length), consume); }
    lShift(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _LSHIFT(b, 0, b.length, k), consume); }
    rShift(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): void { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _RSHIFT(b, 0, b.length, k), consume); }
    xorThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.xor(k, this.offset, this.offset + len, consume); }
    orThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.or(k, this.offset, this.offset + len, consume); }
    andThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.and(k, this.offset, this.offset + len, consume); }
    addThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.add(k, this.offset, this.offset + len, consume); }
    notThis(length = 1, consume = false): void { this.not(this.offset, this.offset + length, consume); }
    lShiftThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.lShift(k, this.offset, this.offset + len, consume); }
    rShiftThis(key: number | string | Uint8Array, length?: number, consume = false): void { const { k, len } = this.#keyLen(key, length); this.rShift(k, this.offset, this.offset + len, consume); }

    // #region find

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
    findByte(value: number, unsigned = true, endian = this.endian): number { return this.#findNumber(value, 8, unsigned, endian); }
    findShort(value: number, unsigned = true, endian = this.endian): number { return this.#findNumber(value, 16, unsigned, endian); }
    findInt(value: number, unsigned = true, endian = this.endian): number { return this.#findNumber(value, 32, unsigned, endian); }

    // #region endianness

    endianness(endian: Endian): void { if (endian !== 'big' && endian !== 'little') throw new TypeError('Endian must be big or little'); this.endian = endian; }
    bigEndian(): void { this.endian = 'big'; }
    big(): void { this.endian = 'big'; }
    be(): void { this.endian = 'big'; }
    littleEndian(): void { this.endian = 'little'; }
    little(): void { this.endian = 'little'; }
    le(): void { this.endian = 'little'; }

    // #region read/write aliases

    readUByte(consume = true): number { return this.readByte(true, consume); }
    readUInt16(endian = this.endian): number { return this.readInt16(true, endian); }
    readUInt16LE(): number { return this.readInt16(true, 'little'); }
    readUInt16BE(): number { return this.readInt16(true, 'big'); }
    readInt16LE(): number { return this.readInt16(false, 'little'); }
    readInt16BE(): number { return this.readInt16(false, 'big'); }
    readInt(endian = this.endian): number { return this.readInt32(false, endian); }
    readUInt(endian = this.endian): number { return this.readInt32(true, endian); }
    readUInt32(endian = this.endian): number { return this.readInt32(true, endian); }
    readInt32LE(): number { return this.readInt32(false, 'little'); }
    readInt32BE(): number { return this.readInt32(false, 'big'); }
    readUInt32LE(): number { return this.readInt32(true, 'little'); }
    readUInt32BE(): number { return this.readInt32(true, 'big'); }
    readFloat32(endian = this.endian, consume = true): number { return this.readFloat(endian, consume); }
    readFloatLE(): number { return this.readFloat('little'); }
    readFloatBE(): number { return this.readFloat('big'); }
    readFloat32LE(): number { return this.readFloat('little'); }
    readFloat32BE(): number { return this.readFloat('big'); }
    readFloat16(endian = this.endian, consume = true): number { return this.readHalfFloat(endian, consume); }
    readHalfFloatLE(): number { return this.readHalfFloat('little'); }
    readHalfFloatBE(): number { return this.readHalfFloat('big'); }
    readFloat16LE(): number { return this.readHalfFloat('little'); }
    readFloat16BE(): number { return this.readHalfFloat('big'); }
    readFloat64(endian = this.endian, consume = true): number { return this.readDoubleFloat(endian, consume); }
    readDoubleFloatLE(): number { return this.readDoubleFloat('little'); }
    readDoubleFloatBE(): number { return this.readDoubleFloat('big'); }
    readFloat64LE(): number { return this.readDoubleFloat('little'); }
    readFloat64BE(): number { return this.readDoubleFloat('big'); }
    readUInt64(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(true); }
    readInt64LE(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(false, 'little'); }
    readInt64BE(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(false, 'big'); }
    readUInt64LE(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(true, 'little'); }
    readUInt64BE(): ReturnBigValueMapping<alwaysBigInt> { return this.readInt64(true, 'big'); }
    readUBitBE(bits: number): number { return this.readBit(bits, true, 'big'); }
    readUBitLE(bits: number): number { return this.readBit(bits, true, 'little'); }
    readBitBE(bits: number, unsigned?: boolean): number { return this.readBit(bits, unsigned, 'big'); }
    readBitLE(bits: number, unsigned?: boolean): number { return this.readBit(bits, unsigned, 'little'); }

    writeUByte(value: number, consume = true): void { this.writeByte(value, true, consume); }
    writeUInt16(value: number, endian = this.endian): void { this.writeInt16(value, true, endian); }
    writeUInt16LE(value: number): void { this.writeInt16(value, true, 'little'); }
    writeUInt16BE(value: number): void { this.writeInt16(value, true, 'big'); }
    writeInt16LE(value: number): void { this.writeInt16(value, false, 'little'); }
    writeInt16BE(value: number): void { this.writeInt16(value, false, 'big'); }
    writeInt(value: number, endian = this.endian): void { this.writeInt32(value, false, endian); }
    writeUInt(value: number, endian = this.endian): void { this.writeInt32(value, true, endian); }
    writeUInt32(value: number, endian = this.endian): void { this.writeInt32(value, true, endian); }
    writeInt32LE(value: number): void { this.writeInt32(value, false, 'little'); }
    writeInt32BE(value: number): void { this.writeInt32(value, false, 'big'); }
    writeUInt32LE(value: number): void { this.writeInt32(value, true, 'little'); }
    writeUInt32BE(value: number): void { this.writeInt32(value, true, 'big'); }
    writeFloat32(value: number, endian = this.endian, consume = true): void { this.writeFloat(value, endian, consume); }
    writeFloatLE(value: number): void { this.writeFloat(value, 'little'); }
    writeFloatBE(value: number): void { this.writeFloat(value, 'big'); }
    writeFloat32LE(value: number): void { this.writeFloat(value, 'little'); }
    writeFloat32BE(value: number): void { this.writeFloat(value, 'big'); }
    writeFloat16(value: number, endian = this.endian, consume = true): void { this.writeHalfFloat(value, endian, consume); }
    writeHalfFloatLE(value: number): void { this.writeHalfFloat(value, 'little'); }
    writeHalfFloatBE(value: number): void { this.writeHalfFloat(value, 'big'); }
    writeFloat16LE(value: number): void { this.writeHalfFloat(value, 'little'); }
    writeFloat16BE(value: number): void { this.writeHalfFloat(value, 'big'); }
    writeFloat64(value: number, endian = this.endian, consume = true): void { this.writeDoubleFloat(value, endian, consume); }
    writeDoubleFloatLE(value: number): void { this.writeDoubleFloat(value, 'little'); }
    writeDoubleFloatBE(value: number): void { this.writeDoubleFloat(value, 'big'); }
    writeFloat64LE(value: number): void { this.writeDoubleFloat(value, 'little'); }
    writeFloat64BE(value: number): void { this.writeDoubleFloat(value, 'big'); }
    writeUInt64(value: number | bigint, endian = this.endian): void { this.writeInt64(value, true, endian); }
    writeInt64LE(value: number | bigint): void { this.writeInt64(value, false, 'little'); }
    writeInt64BE(value: number | bigint): void { this.writeInt64(value, false, 'big'); }
    writeUInt64LE(value: number | bigint): void { this.writeInt64(value, true, 'little'); }
    writeUInt64BE(value: number | bigint): void { this.writeInt64(value, true, 'big'); }
    writeUBitBE(value: number, bits: number): void { this.writeBit(value, bits, true, 'big'); }
    writeUBitLE(value: number, bits: number): void { this.writeBit(value, bits, true, 'little'); }
    writeBitBE(value: number, bits: number, unsigned?: boolean): void { this.writeBit(value, bits, unsigned, 'big'); }
    writeBitLE(value: number, bits: number, unsigned?: boolean): void { this.writeBit(value, bits, unsigned, 'little'); }

    // #region size / position alias getters + setters

    get bitSize(): number { return this.size * 8; }
    get length(): number { return this.size; }
    get len(): number { return this.size; }
    get fileSize(): number { return this.size; }
    get FileSize(): number { return this.size; }
    get lengthBits(): number { return this.size * 8; }
    get sizeBits(): number { return this.size * 8; }
    get fileBitSize(): number { return this.size * 8; }
    get fileSizeBits(): number { return this.size * 8; }
    get lenBits(): number { return this.size * 8; }
    get off(): number { return this.#cursor.byte; }
    get getOffset(): number { return this.#cursor.byte; }
    get tell(): number { return this.#cursor.byte; }
    get FTell(): number { return this.#cursor.byte; }
    get saveOffset(): number { return this.#cursor.byte; }
    get byteOffset(): number { return this.#cursor.byte; }
    set setOffset(value: number) { this.offset = value; }
    set setByteOffset(value: number) { this.offset = value; }
    get offsetBits(): number { return this.#cursor.bitPosition; }
    get getBitOffset(): number { return this.#cursor.bitPosition; }
    get saveBitOffset(): number { return this.#cursor.bitPosition; }
    get FTellBits(): number { return this.#cursor.bitPosition; }
    get tellBits(): number { return this.#cursor.bit; }
    get offBits(): number { return this.#cursor.bitPosition; }
    set setOffsetBits(value: number) { this.bitOffset = value; }
    set setBitOffset(value: number) { this.bitOffset = value; }
    get getInsetBit(): number { return this.#cursor.bit; }
    get saveInsetBit(): number { return this.#cursor.bit; }
    get inBit(): number { return this.#cursor.bit; }
    get bitTell(): number { return this.#cursor.bit; }
    set setInsetBit(value: number) { this.insetBit = value; }
    get remain(): number { return this.size - this.#cursor.byte; }
    get remainBytes(): number { return this.size - this.#cursor.byte; }
    get FEoF(): number { return this.size - this.#cursor.byte; }
    get remainBits(): number { return (this.size * 8) - this.#cursor.bitPosition; }
    get FEoFBits(): number { return (this.size * 8) - this.#cursor.bitPosition; }
    get getLine(): number { return Math.abs(Math.floor((this.#cursor.byte - 1) / 16)); }
    get row(): number { return this.getLine; }

    // #region move aliases

    jump(bytes: number, bits?: number): void { this.skip(bytes, bits ?? 0); }
    seek(bytes: number, bits?: number): void { this.skip(bytes, bits ?? 0); }
    FSeek(byte: number, bit?: number): void { this.goto(byte, bit ?? 0); }
    pointer(byte: number, bit?: number): void { this.goto(byte, bit ?? 0); }
    warp(byte: number, bit?: number): void { this.goto(byte, bit ?? 0); }
    gotoStart(): void { this.rewind(); }
    gotoEnd(): void { this.last(); }
    EoF(): void { this.last(); }

    // #region type checks / dump / strict

    isBufferOrUint8Array(obj: any): obj is Uint8Array { return isBufferOrUint8Array(obj); }
    isBuffer(obj: any): obj is Uint8Array { return typeof Buffer !== 'undefined' && Buffer.isBuffer(obj); }
    isUint8Array(obj: any): boolean { return obj instanceof Uint8Array && !this.isBuffer(obj); }
    restrict(): void { this.strict = true; }
    unrestrict(): void { this.strict = false; }
    errorDumpOff(): void { this.errorDump = false; }
    errorDumpOn(): void { this.errorDump = true; }
    set strSettings(settings: stringOptions) { this.strDefaults = { ...this.strDefaults, ...settings }; }

    hexdump(options: hexdumpOptions = {}): void | string {
        const length = options.length ?? 192;
        const startByte = options.startByte ?? this.#cursor.byte;
        const endByte = Math.min(startByte + length, this.size);
        if (startByte > this.size || endByte > this.size) throw new RangeError('Hexdump amount is outside of data size');
        const data = this.#src.read(startByte, Math.min(endByte, this.size) - startByte);
        return _hexDump(data, options, startByte, endByte);
    }

    // #region data / lifecycle

    get data(): Uint8Array | null {
        if (this.#source instanceof MemorySyncSource) return this.#source.data;
        if (this.#source instanceof FileSyncSource) return this.#source.data;
        return null;
    }
    get view(): DataView | null {
        const d = this.data;
        return d ? new DataView(d.buffer, d.byteOffset, d.byteLength) : null;
    }
    commit(): void { this.flush(); }
    flush(): void { if (this.#source) this.#source.flush(); }
    get(): Uint8Array {
        const src = this.#src;
        src.flush();
        const full = src instanceof MemorySyncSource ? src.data : src instanceof FileSyncSource ? src.data : new Uint8Array(src.read(0, this.size));
        if (this.growthIncrement !== 0 && this.#wasExpanded) return full.subarray(0, this.#cursor.byte);
        return full;
    }
    getData(): Uint8Array { return this.get(); }
    getFullBuffer(): Uint8Array { return this.get(); }
    return(): Uint8Array { return this.get(); }
    end(): Uint8Array | void { return this.close(); }
    done(): Uint8Array | void { return this.close(); }
    finished(): Uint8Array | void { return this.close(); }
    close(): Uint8Array | void {
        const src = this.#src;
        src.flush();
        if (src instanceof MemorySyncSource) return src.data;
        src.close();
        this.#source = null;
        this.#pendingPath = this.filePath;
    }
    writeMode(mode = true): void {
        this.strict = !mode;
        this.readOnly = !mode;
        if (this.#pendingPath || (this.#source && !(this.#source instanceof MemorySyncSource))) this.close();
    }
    renameFile(newFilePath: string): void {
        if (this.isMemoryMode) return;
        this.close();
        if (!BiSyncEngine.fs) throw new Error("Can't rename file outside of Node.");
        BiSyncEngine.fs.renameSync(this.filePath as string, newFilePath);
        this.filePath = newFilePath;
        this.#pendingPath = newFilePath;
        this.open();
    }
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
