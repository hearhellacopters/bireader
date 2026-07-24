/**
 * @file Phase-2 engine: BiEngine.
 *
 * The integration brick - reads, writes, seeks and positional access built on
 * {@link Cursor} + {@link Source} + the pure {@link codecs}. Every cursor operation
 * runs through a built-in op-queue, so overlapping async calls on one instance are
 * serialized rather than corrupting the shared cursor (this generalizes v5's
 * `runExclusive` from an opt-in tool to the default for all ops).
 *
 * This is the live async engine: `BiReaderAsync` / `BiWriterAsync` extend it. It covers
 * the full data surface - numeric (8/16/32/64), float (16/32/64), bit fields, raw bytes,
 * strings, math ops, find, structural edits, positioning, and cursor-free `*At` access -
 * plus file mode via an injected `fs` (see `BiEngine.fs`).
 *
 * Its behaviour is pinned by test/engine.engine.spec.ts and the full facade suite.
 */
import { Cursor } from './cursor.js';
import type { Source } from './source.js';
import { MemorySource } from './memory-source.js';
import { ChunkedFileSource } from './chunked-file-source.js';
import {
    readInt, writeInt, readBig, writeBig,
    readFloat16, writeFloat16, readFloat32, writeFloat32, readFloat64, writeFloat64,
    readBits, writeBits, numberSafe,
} from './codecs.js';
// Pure string/math helpers from the shared foundational module (common.ts). These are
// dependency-free transforms; common.ts is the layer both engines build on.
import {
    _rstring, _wstring, _XOR, _OR, _AND, _ADD, _NOT, _LSHIFT, _RSHIFT, textEncode,
    isBufferOrUint8Array, _hexDump,
    type stringOptions, type hexdumpOptions, type ReturnBigValueMapping, type BigValue,
} from '../../common.js';

export type Endian = 'little' | 'big';

export interface BiEngineOptions {
    endianness?: Endian;
    enforceBigInt?: boolean;
    strict?: boolean;
    readOnly?: boolean;
    growthIncrement?: number;
    windowSize?: number;
    byteOffset?: number;
    bitOffset?: number;
}

const hasBigInt = typeof BigInt === 'function';

const MIN_SAFE = hasBigInt ? BigInt(Number.MIN_SAFE_INTEGER) : 0n;

const MAX_SAFE = hasBigInt ? BigInt(Number.MAX_SAFE_INTEGER) : 0n;

function isSafeInt64(v: bigint): boolean {
    return hasBigInt ? (v >= MIN_SAFE && v <= MAX_SAFE) : false;
}

export class BiEngine<alwaysBigInt extends boolean = false> {
    /** File system (fs/promises), injected by the entry point for file mode. */
    static fs: typeof import('fs/promises');

    #source: Source | null = null;
    #cursor: Cursor;
    #pendingPath: string | null = null;

    endian: Endian;
    enforceBigInt: boolean;
    strict: boolean;
    readOnly: boolean;
    growthIncrement: number;
    windowSize: number;
    filePath: string | null = null;
    errorDump: boolean = false;
    strDefaults: stringOptions = { stringType: 'utf-8', terminateValue: 0x0 };

    #lock: Promise<void> = Promise.resolve();
    #inOp: boolean = false;
    #wasExpanded: boolean = false;

    constructor(input: string | Uint8Array, options: BiEngineOptions = {}) {
        this.endian = options.endianness ?? 'little';

        this.enforceBigInt = (options.enforceBigInt ?? false) && hasBigInt;

        this.readOnly = !!options.readOnly;

        this.strict = this.readOnly ? true : (options.strict ?? false);

        this.growthIncrement = options.growthIncrement ?? 0x100000;

        this.windowSize = options.windowSize ?? 0x1000;

        this.#cursor = new Cursor(options.byteOffset ?? 0, options.bitOffset ?? 0);

        if (typeof input === 'string') {
            this.filePath = input;

            this.#pendingPath = input;
        } else if (isBufferOrUint8Array(input)) {
            this.#source = new MemorySource(input, this.readOnly);

            this.windowSize = 0;
        } else {
            throw new TypeError('Source must be a file path (string) or Uint8Array/Buffer');
        }
    }

    // #region lifecycle / source

    get isMemoryMode(): boolean {
        return this.#source instanceof MemorySource;
    }

    /** The live Source (throws if not yet opened). */
    get source(): Source {
        if (!this.#source) throw new Error('Source not open; call open() first');

        return this.#source;
    }

    /** Non-null source accessor for op bodies (they run after #ensureOpen). */
    get #src(): Source {
        if (!this.#source) throw new Error('Source not open; call open() first');

        return this.#source;
    }

    /** Ensures the backing source exists (opens the file lazily in file mode). */
    async #ensureOpen(): Promise<Source> {
        if (this.#source) return this.#source;

        if (this.#pendingPath) {
            if (!BiEngine.fs) throw new Error("Can't load file outside of Node.");

            try {
                await BiEngine.fs.access(this.#pendingPath, BiEngine.fs.constants.F_OK);
            } catch {
                await BiEngine.fs.writeFile(this.#pendingPath, '');
            }

            const fd = await BiEngine.fs.open(this.#pendingPath, this.readOnly ? 'r' : 'r+');

            const { size } = await fd.stat();

            this.#source = new ChunkedFileSource(fd, size, this.windowSize, this.readOnly);
        }

        if (!this.#source) throw new Error('No data source');

        return this.#source;
    }

    /** Open the source. Optionally swap to a new in-memory buffer. */
    async open(data?: Uint8Array): Promise<void> {
        if (data && isBufferOrUint8Array(data)) {
            this.#source = new MemorySource(data, this.readOnly);

            this.#pendingPath = null;

            return;
        }

        await this.#ensureOpen();
    }

    // #region position / size

    get size(): number {
        return this.#source ? this.#src.size : 0;
    }

    get offset(): number {
        return this.#cursor.byte;
    }

    get insetBit(): number {
        return this.#cursor.bit;
    }

    get bitOffset(): number {
        return this.#cursor.bitPosition;
    }

    get remaining(): number {
        return this.size - this.#cursor.byte;
    }

    // #region concurrency

    /** Run `fn` with exclusive access to the cursor. Reentrant. Opens the source first. */
    async runExclusive<T>(fn: () => Promise<T> | T): Promise<T> {
        if (this.#inOp) {
            return await fn();
        }

        const gate = this.#lock;

        let release: () => void;

        this.#lock = new Promise<void>(resolve => { release = resolve; });

        await gate;

        this.#inOp = true;

        try {
            await this.#ensureOpen();

            return await fn();
        } finally {
            this.#inOp = false;

            release!();
        }
    }

    // #region internals

    /** Advance past a partial bit within the current byte (byte-aligned ops). */
    #alignByte(): void {
        this.#cursor.alignByte();
    }

    /** Ensure [offset, offset+length) exists for reading. */
    #requireReadable(offset: number, length: number): void {
        if (offset + length > this.#src.size) {
            throw new RangeError(`Read of ${length} at ${offset} exceeds size ${this.#src.size}`);
        }
    }

    /** Ensure [0, endByte) exists for writing, growing the source if allowed. */
    async #ensureWritable(endByte: number): Promise<void> {
        if (endByte <= this.#src.size) {
            return;
        }

        if (this.strict || this.#src.readOnly) {
            throw new Error(`Reached end of data: need ${endByte}, have ${this.#src.size} (strict/readOnly)`);
        }

        this.#wasExpanded = true;

        await this.#src.resize(endByte);
    }

    async #readAligned(width: number): Promise<{ view: DataView; at: number }> {
        this.#alignByte();

        const at = this.#cursor.byte;

        this.#requireReadable(at, width);

        const bytes = await this.#src.read(at, width);

        return { view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), at };
    }

    async #writeAligned(width: number, encode: (view: DataView) => void, consume: boolean): Promise<void> {
        this.#alignByte();

        const at = this.#cursor.byte;

        await this.#ensureWritable(at + width);

        const buf = new Uint8Array(width);

        encode(new DataView(buf.buffer));

        await this.#src.write(at, buf);

        if (consume) {
            this.#cursor.set(at + width);
        }
    }

    // #region numeric reads

    readByte(unsigned = false, consume = true): Promise<number> {
        return this.runExclusive(async () => {
            const { view, at } = await this.#readAligned(1);

            const v = readInt(view, 0, 8, !unsigned, false);

            if (consume) this.#cursor.set(at + 1);

            return v;
        });
    }

    #readIntN(width: 16 | 32, unsigned: boolean, endian: Endian, consume: boolean): Promise<number> {
        return this.runExclusive(async () => {
            const { view, at } = await this.#readAligned(width / 8);

            const v = readInt(view, 0, width, !unsigned, endian === 'little');

            if (consume) this.#cursor.set(at + width / 8);

            return v;
        });
    }

    readInt16(unsigned = false, endian = this.endian, consume = true): Promise<number> {
        return this.#readIntN(16, unsigned, endian, consume);
    }

    readInt32(unsigned = false, endian = this.endian, consume = true): Promise<number> {
        return this.#readIntN(32, unsigned, endian, consume);
    }

    readInt64(unsigned = false, endian = this.endian, consume = true): Promise<ReturnBigValueMapping<alwaysBigInt>> {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }

        return this.runExclusive(async () => {
            const { view, at } = await this.#readAligned(8);

            const v = readBig(view, 0, !unsigned, endian === 'little');

            if (consume) this.#cursor.set(at + 8);

            // Match the shipping engine: force bigint when enforceBigInt is set OR when the
            // value can't be represented safely as a number; otherwise return a number.
            if (this.enforceBigInt || !isSafeInt64(v)) {
                return v as ReturnBigValueMapping<alwaysBigInt>;
            }

            return Number(v) as ReturnBigValueMapping<alwaysBigInt>;
        }) as Promise<ReturnBigValueMapping<alwaysBigInt>>;
    }

    // #region float reads

    #readFloatN(width: 16 | 32 | 64, endian: Endian, consume: boolean): Promise<number> {
        return this.runExclusive(async () => {
            const { view, at } = await this.#readAligned(width / 8);

            const little = endian === 'little';

            const v = width === 16 ? readFloat16(view, 0, little)
                : width === 32 ? readFloat32(view, 0, little)
                    : readFloat64(view, 0, little);

            if (consume) this.#cursor.set(at + width / 8);

            return v;
        });
    }

    readHalfFloat(endian = this.endian, consume = true): Promise<number> {
        return this.#readFloatN(16, endian, consume);
    }

    readFloat(endian = this.endian, consume = true): Promise<number> {
        return this.#readFloatN(32, endian, consume);
    }

    readDoubleFloat(endian = this.endian, consume = true): Promise<number> {
        return this.#readFloatN(64, endian, consume);
    }

    // #region numeric writes

    writeByte(value: number, unsigned = false, consume = true): Promise<void> {
        return this.runExclusive(() =>
            this.#writeAligned(1, view => writeInt(view, 0, numberSafe(value, 8, unsigned), 8, !unsigned, false), consume));
    }

    writeInt16(value: number, unsigned = false, endian = this.endian, consume = true): Promise<void> {
        return this.runExclusive(() =>
            this.#writeAligned(2, view => writeInt(view, 0, numberSafe(value, 16, unsigned), 16, !unsigned, endian === 'little'), consume));
    }

    writeInt32(value: number, unsigned = false, endian = this.endian, consume = true): Promise<void> {
        return this.runExclusive(() =>
            this.#writeAligned(4, view => writeInt(view, 0, numberSafe(value, 32, unsigned), 32, !unsigned, endian === 'little'), consume));
    }

    writeInt64(value: number | bigint, unsigned = false, endian = this.endian, consume = true): Promise<void> {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }

        return this.runExclusive(() =>
            this.#writeAligned(8, view => writeBig(view, 0, numberSafe(value, 64, unsigned), !unsigned, endian === 'little'), consume));
    }

    // #region float writes

    writeHalfFloat(value: number, endian = this.endian, consume = true): Promise<void> {
        return this.runExclusive(() =>
            this.#writeAligned(2, view => writeFloat16(view, 0, value, endian === 'little'), consume));
    }

    writeFloat(value: number, endian = this.endian, consume = true): Promise<void> {
        return this.runExclusive(() =>
            this.#writeAligned(4, view => writeFloat32(view, 0, value, endian === 'little'), consume));
    }

    writeDoubleFloat(value: number, endian = this.endian, consume = true): Promise<void> {
        return this.runExclusive(() =>
            this.#writeAligned(8, view => writeFloat64(view, 0, value, endian === 'little'), consume));
    }

    // #region bit fields

    readBit(bits: number, unsigned = false, endian = this.endian, consume = true): Promise<number> {
        return this.runExclusive(async () => {
            if (bits === 0) return 0;

            if (bits < 0 || bits > 32) throw new Error('Bit length must be between 1 and 32. Got ' + bits);

            const endByte = this.#cursor.endByteForBits(bits);

            this.#requireReadable(this.#cursor.byte, endByte - this.#cursor.byte);

            const bytes = await this.#src.read(this.#cursor.byte, endByte - this.#cursor.byte);

            const v = readBits(bytes, this.#cursor.bit, bits, endian === 'little', !unsigned);

            if (consume) this.#cursor.skip(0, bits);

            return v;
        });
    }

    writeBit(value: number, bits: number, unsigned = false, endian = this.endian, consume = true): Promise<void> {
        return this.runExclusive(async () => {
            if (bits === 0) return;

            if (bits < 0 || bits > 32) throw new Error('Bit length must be between 1 and 32. Got ' + bits);

            value = numberSafe(value, bits, unsigned);

            const endByte = this.#cursor.endByteForBits(bits);

            await this.#ensureWritable(endByte);

            const span = endByte - this.#cursor.byte;

            // read-modify-write the touched bytes
            const bytes = new Uint8Array(await this.#src.read(this.#cursor.byte, span));

            writeBits(bytes, value, bits, this.#cursor.bit, endian === 'little', !unsigned);

            await this.#src.write(this.#cursor.byte, bytes);

            if (consume) this.#cursor.skip(0, bits);
        });
    }

    // #region positioning

    /** Move to an absolute byte/bit, enforcing bounds (strict throws, else grows). */
    async goto(byte: number = 0, bit: number = 0): Promise<void> {
        await this.#reach(byte + Math.ceil(bit / 8));

        this.#cursor.set(byte, bit);
    }

    /** Relative move by bytes/bits, enforcing bounds. */
    async skip(bytes: number = 0, bits: number = 0): Promise<void> {
        const targetBits = this.#cursor.bitPosition + bytes * 8 + bits;

        await this.#reach(Math.ceil(Math.max(targetBits, 0) / 8));

        this.#cursor.skip(bytes, bits);
    }

    /** Ensure position `targetByte` is reachable: throw in strict/readOnly, else grow. */
    async #reach(targetByte: number): Promise<void> {
        if (targetByte <= this.size) return;

        if (this.strict || this.readOnly) {
            throw new Error(`Reached end of data: ${targetByte} of ${this.size}`);
        }

        await this.#ensureOpen();

        await this.#ensureWritable(targetByte);
    }

    rewind(): void {
        this.#cursor.set(0, 0);
    }

    last(): void {
        this.#cursor.set(this.size, 0);
    }

    async align(n: number): Promise<void> {
        const a = this.#cursor.byte % n;

        if (a) await this.skip(n - a, 0);
    }

    // #region positional (cursor-free, concurrency-safe)

    async readInt16At(offset: number, unsigned = false, endian = this.endian): Promise<number> {
        await this.#ensureOpen();

        const bytes = await this.#src.read(offset, 2);

        return readInt(new DataView(bytes.buffer, bytes.byteOffset, 2), 0, 16, !unsigned, endian === 'little');
    }

    async readUInt16At(offset: number, endian = this.endian): Promise<number> {
        return this.readInt16At(offset, true, endian);
    }

    async readInt32At(offset: number, unsigned = false, endian = this.endian): Promise<number> {
        await this.#ensureOpen();

        const bytes = await this.#src.read(offset, 4);

        return readInt(new DataView(bytes.buffer, bytes.byteOffset, 4), 0, 32, !unsigned, endian === 'little');
    }

    async readUInt32At(offset: number, endian = this.endian): Promise<number> {
        return this.readInt32At(offset, true, endian);
    }

    async readUInt8At(offset: number): Promise<number> {
        await this.#ensureOpen();

        const bytes = await this.#src.read(offset, 1);

        return bytes[0];
    }

    async writeInt16At(offset: number, value: number, unsigned = false, endian = this.endian): Promise<void> {
        await this.#ensureOpen();

        if (this.#src.readOnly) throw new Error("Can't write in readOnly mode!");

        await this.#ensureWritable(offset + 2);

        const buf = new Uint8Array(2);

        writeInt(new DataView(buf.buffer), 0, numberSafe(value, 16, unsigned), 16, !unsigned, endian === 'little');

        await this.#src.write(offset, buf);
    }

    async writeInt32At(offset: number, value: number, unsigned = false, endian = this.endian): Promise<void> {
        await this.#ensureOpen();

        if (this.#src.readOnly) throw new Error("Can't write in readOnly mode!");

        await this.#ensureWritable(offset + 4);

        const buf = new Uint8Array(4);

        writeInt(new DataView(buf.buffer), 0, numberSafe(value, 32, unsigned), 32, !unsigned, endian === 'little');

        await this.#src.write(offset, buf);
    }

    // #region structural edits

    #assertMutable(): void {
        if (this.#src.readOnly) throw new Error("Can't modify data in readOnly mode!");

        if (this.strict) throw new Error('\x1b[33m[Strict mode]\x1b[0m: Can not resize data in strict mode. Use unrestrict() first.');
    }

    /** Move [offset, oldEnd) forward by `len` bytes (back-to-front, copy-safe). */
    async #shiftForward(offset: number, len: number, oldEnd: number): Promise<void> {
        const step = 65536;

        let readEnd = oldEnd;

        while (readEnd > offset) {
            const n = Math.min(step, readEnd - offset);

            const chunk = (await this.#src.read(readEnd - n, n)).slice();

            await this.#src.write(readEnd - n + len, chunk);

            readEnd -= n;
        }
    }

    /** Move [start+removeLen, oldSize) back to `start` (front-to-back, copy-safe). */
    async #shiftBackward(start: number, removeLen: number, oldSize: number): Promise<void> {
        const step = 65536;

        let readPos = start + removeLen;

        let writePos = start;

        while (readPos < oldSize) {
            const n = Math.min(step, oldSize - readPos);

            const chunk = (await this.#src.read(readPos, n)).slice();

            await this.#src.write(writePos, chunk);

            readPos += n;

            writePos += n;
        }
    }

    /** Insert bytes at `offset`, growing the source. */
    insert(data: Uint8Array, offset = this.offset, consume = true): Promise<void> {
        return this.runExclusive(async () => {
            this.#assertMutable();

            if (offset < 0 || offset > this.#src.size) throw new RangeError('Insert offset out of bounds');

            if (data.length === 0) return;

            const oldSize = this.#src.size;

            await this.#src.resize(oldSize + data.length);

            await this.#shiftForward(offset, data.length, oldSize);

            await this.#src.write(offset, data);

            if (consume) this.#cursor.set(offset + data.length);
        });
    }

    unshift(data: Uint8Array, consume = false): Promise<void> {
        return this.insert(data, 0, consume);
    }

    prepend(data: Uint8Array, consume = false): Promise<void> {
        return this.insert(data, 0, consume);
    }

    push(data: Uint8Array, consume = false): Promise<void> {
        return this.insert(data, this.size, consume);
    }

    append(data: Uint8Array, consume = false): Promise<void> {
        return this.insert(data, this.size, consume);
    }

    /** Delete [startOffset, endOffset), returning the removed bytes. */
    delete(startOffset = 0, endOffset = this.offset, consume = false): Promise<Uint8Array> {
        return this.runExclusive(async () => {
            this.#assertMutable();

            startOffset = Math.abs(startOffset);

            if (startOffset < 0 || endOffset > this.#src.size) throw new RangeError('Remove range out of bounds');

            const removeLen = endOffset - startOffset;

            if (removeLen <= 0) return new Uint8Array(0);

            const removed = (await this.#src.read(startOffset, removeLen)).slice();

            const oldSize = this.#src.size;

            await this.#shiftBackward(startOffset, removeLen, oldSize);

            await this.#src.resize(oldSize - removeLen);

            if (consume) this.#cursor.set(startOffset);

            return removed;
        });
    }

    clip(): Promise<Uint8Array> {
        return this.delete(this.offset, this.size, false);
    }

    trim(): Promise<Uint8Array> {
        return this.delete(this.offset, this.size, false);
    }

    crop(length = 0, consume = false): Promise<Uint8Array> {
        return this.delete(this.offset, this.offset + length, consume);
    }

    drop(length = 0, consume = false): Promise<Uint8Array> {
        return this.delete(this.offset, this.offset + length, consume);
    }

    /** Overwrite bytes at `offset` (grows if needed; does not shift the tail). */
    replace(data: Uint8Array, offset = this.offset, consume = false): Promise<void> {
        return this.runExclusive(async () => {
            if (this.#src.readOnly) throw new Error("Can't replace data in readOnly mode!");

            if (data.length === 0) return;

            await this.#ensureWritable(offset + data.length);

            await this.#src.write(offset, data);

            if (consume) this.#cursor.set(offset + data.length);
        });
    }

    overwrite(data: Uint8Array, offset = this.offset, consume = false): Promise<void> {
        return this.replace(data, offset, consume);
    }

    /** Copy out [startOffset, endOffset); if `fillValue` given, overwrite that range with it. */
    fill(startOffset = this.offset, endOffset = this.size, consume = false, fillValue?: number): Promise<Uint8Array> {
        return this.runExclusive(async () => {
            if (this.#src.readOnly && fillValue != undefined) throw new Error("Can't fill data in readOnly mode!");

            if (startOffset < 0 || endOffset > this.#src.size) throw new RangeError('Range out of bounds');

            const len = endOffset - startOffset;

            if (len <= 0) return new Uint8Array(0);

            const slice = (await this.#src.read(startOffset, len)).slice();

            if (fillValue != undefined) {
                await this.#src.write(startOffset, new Uint8Array(len).fill(fillValue & 0xff));
            }

            if (consume) this.#cursor.set(endOffset);

            return slice;
        });
    }

    lift(startOffset = this.offset, endOffset = this.size, consume = false, fillValue?: number): Promise<Uint8Array> {
        return this.fill(startOffset, endOffset, consume, fillValue);
    }

    subarray(startOffset = this.offset, endOffset = this.size, consume = false): Promise<Uint8Array> {
        return this.fill(startOffset, endOffset, consume);
    }

    extract(length = 0, consume = false): Promise<Uint8Array> {
        return this.fill(this.offset, this.offset + length, consume);
    }

    slice(length = 0, consume = false): Promise<Uint8Array> {
        return this.fill(this.offset, this.offset + length, consume);
    }

    wrap(length = 0, consume = false): Promise<Uint8Array> {
        return this.fill(this.offset, this.offset + length, consume);
    }

    // #region strings

    /** Reads a string; batched - a single source read + synchronous decode. */
    readString(options: stringOptions = {}, consume = true): Promise<string> {
        return this.runExclusive(async () => {
            this.#alignByte();

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

            const at = this.#cursor.byte;

            this.#requireReadable(at, readLengthinBytes);

            const bytes = await this.#src.read(at, readLengthinBytes);

            const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

            let pos = 0;

            const rU8 = () => bytes[pos++];

            const rU16 = (e: Endian) => { const v = readInt(dv, pos, 16, false, e === 'little'); pos += 2; return v; };

            const rU32 = (e: Endian) => { const v = readInt(dv, pos, 32, false, e === 'little') >>> 0; pos += 4; return v; };

            const str = _rstring(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, rU8, rU16, rU32);

            if (consume) this.#cursor.set(at + pos);

            return str;
        });
    }

    /** Writes a string; batched - assembled in memory then one source write. */
    writeString(str: string, options: stringOptions = {}, consume = true): Promise<void> {
        return this.runExclusive(async () => {
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
                if (stringType === 'ascii' || stringType === 'utf-8' || stringType === 'utf-16' || stringType === 'utf-32') {
                    terminateValue = 0;
                }
                if (length != undefined) terminateValue = undefined;
            }

            const maxBytes = Math.min(strUnits, maxLengthValue);

            str = str.substring(0, maxBytes);

            let encodedString: Uint8Array;

            switch (stringType) {
                case 'utf-16':
                case 'wide-pascal': {
                    const u16 = new Uint16Array(str.length);
                    for (let i = 0; i < str.length; i++) u16[i] = str.charCodeAt(i);
                    encodedString = new Uint8Array(u16.buffer);
                    break;
                }
                case 'utf-32':
                case 'double-wide-pascal': {
                    const u32 = new Uint32Array(str.length);
                    for (let i = 0; i < str.length; i++) u32[i] = str.codePointAt(i) ?? 0;
                    encodedString = new Uint8Array(u32.buffer);
                    break;
                }
                default:
                    encodedString = new TextEncoder().encode(str);
            }

            const out: number[] = [];

            const wU8 = (n: number) => { out.push(n & 0xFF); };

            const wU16 = (n: number, e: Endian) => { const b = new Uint8Array(2); writeInt(new DataView(b.buffer), 0, n, 16, false, e === 'little'); out.push(b[0], b[1]); };

            const wU32 = (n: number, e: Endian) => { const b = new Uint8Array(4); writeInt(new DataView(b.buffer), 0, n, 32, false, e === 'little'); out.push(b[0], b[1], b[2], b[3]); };

            _wstring(encodedString, stringType, endian, terminateValue, lengthWriteSize, wU8, wU16, wU32);

            const buf = new Uint8Array(out);

            this.#alignByte();

            const at = this.#cursor.byte;

            await this.#ensureWritable(at + buf.length);

            await this.#src.write(at, buf);

            if (consume) this.#cursor.set(at + buf.length);
        });
    }

    // #region math (read-modify-write over a range)

    #normalizeKey(key: number | string | Uint8Array): number | Uint8Array {
        return typeof key === 'string' ? new TextEncoder().encode(key) : key;
    }

    async #applyRange(startOffset: number, endOffset: number, apply: (b: Uint8Array) => void, consume: boolean): Promise<void> {
        if (this.#src.readOnly) throw new Error("Can't write data in readOnly mode!");

        const end = Math.min(endOffset, this.#src.size);

        const len = end - startOffset;

        if (len <= 0) return;

        const bytes = new Uint8Array(await this.#src.read(startOffset, len));

        apply(bytes);

        await this.#src.write(startOffset, bytes);

        if (consume) this.#cursor.set(end);
    }

    xor(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): Promise<void> {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _XOR(b, 0, b.length, k), consume));
    }

    or(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): Promise<void> {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _OR(b, 0, b.length, k), consume));
    }

    and(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): Promise<void> {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _AND(b, 0, b.length, k), consume));
    }

    add(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): Promise<void> {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _ADD(b, 0, b.length, k), consume));
    }

    not(start = this.offset, end = this.size, consume = false): Promise<void> {
        return this.runExclusive(() => this.#applyRange(start, end, b => _NOT(b, 0, b.length), consume));
    }

    lShift(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): Promise<void> {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _LSHIFT(b, 0, b.length, k), consume));
    }

    rShift(key: number | string | Uint8Array, start = this.offset, end = this.size, consume = false): Promise<void> {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _RSHIFT(b, 0, b.length, k), consume));
    }

    // length-relative variants (operate on `length` bytes from the current position)

    #keyLen(key: number | string | Uint8Array, length?: number): { k: number | Uint8Array; len: number } {
        if (typeof key === 'number') return { k: key, len: length ?? 1 };
        const k = typeof key === 'string' ? new TextEncoder().encode(key) : key;
        return { k, len: length ?? k.length };
    }

    xorThis(key: number | string | Uint8Array, length?: number, consume = false): Promise<void> {
        const { k, len } = this.#keyLen(key, length);
        return this.xor(k, this.offset, this.offset + len, consume);
    }
    orThis(key: number | string | Uint8Array, length?: number, consume = false): Promise<void> {
        const { k, len } = this.#keyLen(key, length);
        return this.or(k, this.offset, this.offset + len, consume);
    }
    andThis(key: number | string | Uint8Array, length?: number, consume = false): Promise<void> {
        const { k, len } = this.#keyLen(key, length);
        return this.and(k, this.offset, this.offset + len, consume);
    }
    addThis(key: number | string | Uint8Array, length?: number, consume = false): Promise<void> {
        const { k, len } = this.#keyLen(key, length);
        return this.add(k, this.offset, this.offset + len, consume);
    }
    notThis(length = 1, consume = false): Promise<void> {
        return this.not(this.offset, this.offset + length, consume);
    }
    lShiftThis(key: number | string | Uint8Array, length?: number, consume = false): Promise<void> {
        const { k, len } = this.#keyLen(key, length);
        return this.lShift(k, this.offset, this.offset + len, consume);
    }
    rShiftThis(key: number | string | Uint8Array, length?: number, consume = false): Promise<void> {
        const { k, len } = this.#keyLen(key, length);
        return this.rShift(k, this.offset, this.offset + len, consume);
    }

    // #region find (absolute offset, or -1; does not move the cursor)

    findBytes(bytesToFind: Uint8Array | number[]): Promise<number> {
        const needle = Array.isArray(bytesToFind) ? new Uint8Array(bytesToFind) : bytesToFind;
        return this.runExclusive(async () => {
            const data = await this.#src.read(0, this.#src.size);
            for (let i = this.#cursor.byte; i <= this.#src.size - needle.length; i++) {
                let match = true;
                for (let j = 0; j < needle.length; j++) {
                    if (data[i + j] !== needle[j]) { match = false; break; }
                }
                if (match) return i;
            }
            return -1;
        });
    }

    findString(str: string, bytesPerChar: 1 | 2 | 4 = 1): Promise<number> {
        return this.findBytes(textEncode(str, bytesPerChar));
    }

    async #findNumber(value: number, bits: number, unsigned: boolean, endian: Endian): Promise<number> {
        return this.runExclusive(async () => {
            const data = await this.#src.read(0, this.#src.size);
            for (let z = this.#cursor.byte; z <= this.#src.size - (bits / 8); z++) {
                const dv = new DataView(data.buffer, data.byteOffset + z, bits / 8);
                const v = bits <= 32 ? readInt(dv, 0, bits as 8 | 16 | 32, !unsigned, endian === 'little') : Number(readBig(dv, 0, !unsigned, endian === 'little'));
                if (v === value) return z;
            }
            return -1;
        });
    }

    findByte(value: number, unsigned = true, endian = this.endian): Promise<number> {
        return this.#findNumber(value, 8, unsigned, endian);
    }

    findShort(value: number, unsigned = true, endian = this.endian): Promise<number> {
        return this.#findNumber(value, 16, unsigned, endian);
    }

    findInt(value: number, unsigned = true, endian = this.endian): Promise<number> {
        return this.#findNumber(value, 32, unsigned, endian);
    }

    // #region read aliases

    readUByte(consume = true): Promise<number> { return this.readByte(true, consume); }
    readUInt16(endian = this.endian): Promise<number> { return this.readInt16(true, endian); }
    readUInt16LE(): Promise<number> { return this.readInt16(true, 'little'); }
    readUInt16BE(): Promise<number> { return this.readInt16(true, 'big'); }
    readInt16LE(): Promise<number> { return this.readInt16(false, 'little'); }
    readInt16BE(): Promise<number> { return this.readInt16(false, 'big'); }
    readInt(endian = this.endian): Promise<number> { return this.readInt32(false, endian); }
    readUInt(endian = this.endian): Promise<number> { return this.readInt32(true, endian); }
    readUInt32(endian = this.endian): Promise<number> { return this.readInt32(true, endian); }
    readInt32LE(): Promise<number> { return this.readInt32(false, 'little'); }
    readInt32BE(): Promise<number> { return this.readInt32(false, 'big'); }
    readUInt32LE(): Promise<number> { return this.readInt32(true, 'little'); }
    readUInt32BE(): Promise<number> { return this.readInt32(true, 'big'); }
    readFloat32(endian = this.endian, consume = true): Promise<number> { return this.readFloat(endian, consume); }
    readFloatLE(): Promise<number> { return this.readFloat('little'); }
    readFloatBE(): Promise<number> { return this.readFloat('big'); }
    readFloat32LE(): Promise<number> { return this.readFloat('little'); }
    readFloat32BE(): Promise<number> { return this.readFloat('big'); }
    readFloat16(endian = this.endian, consume = true): Promise<number> { return this.readHalfFloat(endian, consume); }
    readHalfFloatLE(): Promise<number> { return this.readHalfFloat('little'); }
    readHalfFloatBE(): Promise<number> { return this.readHalfFloat('big'); }
    readFloat16LE(): Promise<number> { return this.readHalfFloat('little'); }
    readFloat16BE(): Promise<number> { return this.readHalfFloat('big'); }
    readFloat64(endian = this.endian, consume = true): Promise<number> { return this.readDoubleFloat(endian, consume); }
    readDoubleFloatLE(): Promise<number> { return this.readDoubleFloat('little'); }
    readDoubleFloatBE(): Promise<number> { return this.readDoubleFloat('big'); }
    readFloat64LE(): Promise<number> { return this.readDoubleFloat('little'); }
    readFloat64BE(): Promise<number> { return this.readDoubleFloat('big'); }
    readUInt64(): Promise<ReturnBigValueMapping<alwaysBigInt>> { return this.readInt64(true); }
    readInt64LE(): Promise<ReturnBigValueMapping<alwaysBigInt>> { return this.readInt64(false, 'little'); }
    readInt64BE(): Promise<ReturnBigValueMapping<alwaysBigInt>> { return this.readInt64(false, 'big'); }
    readUInt64LE(): Promise<ReturnBigValueMapping<alwaysBigInt>> { return this.readInt64(true, 'little'); }
    readUInt64BE(): Promise<ReturnBigValueMapping<alwaysBigInt>> { return this.readInt64(true, 'big'); }

    readUBitBE(bits: number): Promise<number> { return this.readBit(bits, true, 'big'); }
    readUBitLE(bits: number): Promise<number> { return this.readBit(bits, true, 'little'); }
    readBitBE(bits: number, unsigned?: boolean): Promise<number> { return this.readBit(bits, unsigned, 'big'); }
    readBitLE(bits: number, unsigned?: boolean): Promise<number> { return this.readBit(bits, unsigned, 'little'); }

    async readBytes(amount: number, unsigned?: boolean, consume = true): Promise<number[]> {
        const data = await this.readUBytes(amount, consume);

        const out: number[] = [];

        for (let i = 0; i < data.length; i++) {
            const v = data[i];

            out.push(unsigned ? (v & 0xFF) : (v > 127 ? v - 256 : v));
        }

        return out;
    }

    readUBytes(amount: number, consume = true): Promise<Uint8Array> {
        return this.runExclusive(async () => {
            this.#alignByte();
            const at = this.#cursor.byte;
            this.#requireReadable(at, amount);
            const bytes = (await this.#src.read(at, amount)).slice();
            if (consume) this.#cursor.set(at + amount);
            return bytes;
        });
    }

    // #region write aliases

    writeUInt16(value: number, endian = this.endian): Promise<void> { return this.writeInt16(value, true, endian); }
    writeUInt16LE(value: number): Promise<void> { return this.writeInt16(value, true, 'little'); }
    writeUInt16BE(value: number): Promise<void> { return this.writeInt16(value, true, 'big'); }
    writeInt16LE(value: number): Promise<void> { return this.writeInt16(value, false, 'little'); }
    writeInt16BE(value: number): Promise<void> { return this.writeInt16(value, false, 'big'); }
    writeInt(value: number, endian = this.endian): Promise<void> { return this.writeInt32(value, false, endian); }
    writeUInt(value: number, endian = this.endian): Promise<void> { return this.writeInt32(value, true, endian); }
    writeUInt32(value: number, endian = this.endian): Promise<void> { return this.writeInt32(value, true, endian); }
    writeInt32LE(value: number): Promise<void> { return this.writeInt32(value, false, 'little'); }
    writeInt32BE(value: number): Promise<void> { return this.writeInt32(value, false, 'big'); }
    writeUInt32LE(value: number): Promise<void> { return this.writeInt32(value, true, 'little'); }
    writeUInt32BE(value: number): Promise<void> { return this.writeInt32(value, true, 'big'); }
    writeFloat32(value: number, endian = this.endian, consume = true): Promise<void> { return this.writeFloat(value, endian, consume); }
    writeFloatLE(value: number): Promise<void> { return this.writeFloat(value, 'little'); }
    writeFloatBE(value: number): Promise<void> { return this.writeFloat(value, 'big'); }
    writeFloat32LE(value: number): Promise<void> { return this.writeFloat(value, 'little'); }
    writeFloat32BE(value: number): Promise<void> { return this.writeFloat(value, 'big'); }
    writeFloat16(value: number, endian = this.endian, consume = true): Promise<void> { return this.writeHalfFloat(value, endian, consume); }
    writeHalfFloatLE(value: number): Promise<void> { return this.writeHalfFloat(value, 'little'); }
    writeHalfFloatBE(value: number): Promise<void> { return this.writeHalfFloat(value, 'big'); }
    writeFloat16LE(value: number): Promise<void> { return this.writeHalfFloat(value, 'little'); }
    writeFloat16BE(value: number): Promise<void> { return this.writeHalfFloat(value, 'big'); }
    writeFloat64(value: number, endian = this.endian, consume = true): Promise<void> { return this.writeDoubleFloat(value, endian, consume); }
    writeDoubleFloatLE(value: number): Promise<void> { return this.writeDoubleFloat(value, 'little'); }
    writeDoubleFloatBE(value: number): Promise<void> { return this.writeDoubleFloat(value, 'big'); }
    writeFloat64LE(value: number): Promise<void> { return this.writeDoubleFloat(value, 'little'); }
    writeFloat64BE(value: number): Promise<void> { return this.writeDoubleFloat(value, 'big'); }
    writeUInt64(value: number | bigint, endian = this.endian): Promise<void> { return this.writeInt64(value, true, endian); }
    writeInt64LE(value: number | bigint): Promise<void> { return this.writeInt64(value, false, 'little'); }
    writeInt64BE(value: number | bigint): Promise<void> { return this.writeInt64(value, false, 'big'); }
    writeUInt64LE(value: number | bigint): Promise<void> { return this.writeInt64(value, true, 'little'); }
    writeUInt64BE(value: number | bigint): Promise<void> { return this.writeInt64(value, true, 'big'); }

    writeUByte(value: number, consume = true): Promise<void> { return this.writeByte(value, true, consume); }
    writeUBitBE(value: number, bits: number): Promise<void> { return this.writeBit(value, bits, true, 'big'); }
    writeUBitLE(value: number, bits: number): Promise<void> { return this.writeBit(value, bits, true, 'little'); }
    writeBitBE(value: number, bits: number, unsigned?: boolean): Promise<void> { return this.writeBit(value, bits, unsigned, 'big'); }
    writeBitLE(value: number, bits: number, unsigned?: boolean): Promise<void> { return this.writeBit(value, bits, unsigned, 'little'); }

    writeBytes(values: number[] | Uint8Array, unsigned?: boolean, consume = true): Promise<void> {
        const data = isBufferOrUint8Array(values) ? values : new Uint8Array(values);
        return this.overwrite(data, this.offset, consume);
    }

    writeUBytes(values: number[] | Uint8Array, consume = true): Promise<void> {
        return this.writeBytes(values, true, consume);
    }

    // #region endianness

    endianness(endian: Endian): void {
        if (endian !== 'big' && endian !== 'little') throw new TypeError('Endian must be big or little');
        this.endian = endian;
    }
    bigEndian(): void { this.endian = 'big'; }
    big(): void { this.endian = 'big'; }
    be(): void { this.endian = 'big'; }
    littleEndian(): void { this.endian = 'little'; }
    little(): void { this.endian = 'little'; }
    le(): void { this.endian = 'little'; }

    // #region size / position aliases

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
    async setOffset(value: number) { await this.goto(value); }
    async setByteOffset(value: number) { await this.goto(value); }

    get offsetBits(): number { return this.#cursor.bitPosition; }
    get getBitOffset(): number { return this.#cursor.bitPosition; }
    get saveBitOffset(): number { return this.#cursor.bitPosition; }
    get FTellBits(): number { return this.#cursor.bitPosition; }
    get tellBits(): number { return this.#cursor.bit; }
    get offBits(): number { return this.#cursor.bitPosition; }
    async setOffsetBits(value: number) { await this.goto(value - (value % 8), value % 8); }
    async setBitOffset(value: number) { await this.setOffsetBits(value); }

    get getInsetBit(): number { return this.#cursor.bit; }
    get saveInsetBit(): number { return this.#cursor.bit; }
    get inBit(): number { return this.#cursor.bit; }
    get bitTell(): number { return this.#cursor.bit; }
    async setInsetBit(value: number) { await this.goto(this.#cursor.byte, value % 8); }

    get remain(): number { return this.size - this.#cursor.byte; }
    get remainBytes(): number { return this.size - this.#cursor.byte; }
    get FEoF(): number { return this.size - this.#cursor.byte; }
    get remainBits(): number { return (this.size * 8) - this.#cursor.bitPosition; }
    get FEoFBits(): number { return (this.size * 8) - this.#cursor.bitPosition; }
    get getLine(): number { return Math.abs(Math.floor((this.#cursor.byte - 1) / 16)); }
    get row(): number { return this.getLine; }

    // #region move aliases

    async jump(bytes: number, bits?: number): Promise<void> { await this.skip(bytes, bits ?? 0); }
    async seek(bytes: number, bits?: number): Promise<void> { await this.skip(bytes, bits ?? 0); }
    async FSeek(byte: number, bit?: number): Promise<void> { await this.goto(byte, bit ?? 0); }
    async pointer(byte: number, bit?: number): Promise<void> { await this.goto(byte, bit ?? 0); }
    async warp(byte: number, bit?: number): Promise<void> { await this.goto(byte, bit ?? 0); }
    gotoStart(): void { this.rewind(); }
    gotoEnd(): void { this.last(); }
    EoF(): void { this.last(); }
    async alignRev(number: number): Promise<void> {
        const a = this.#cursor.byte % number;
        if (a) await this.skip(-a, 0);
    }

    // #region type checks

    isBufferOrUint8Array(obj: any): obj is Uint8Array { return isBufferOrUint8Array(obj); }
    isBuffer(obj: any): obj is Uint8Array { return typeof Buffer !== 'undefined' && Buffer.isBuffer(obj); }
    isUint8Array(obj: any): boolean { return obj instanceof Uint8Array && !this.isBuffer(obj); }

    // #region strict / dump

    restrict(): void { this.strict = true; }
    unrestrict(): void { this.strict = false; }
    errorDumpOff(): void { this.errorDump = false; }
    errorDumpOn(): void { this.errorDump = true; }

    set strSettings(settings: stringOptions) {
        this.strDefaults = { ...this.strDefaults, ...settings };
    }

    async hexdump(options: hexdumpOptions = {}): Promise<void | string> {
        await this.#ensureOpen();
        const length = options.length ?? 192;
        const startByte = options.startByte ?? this.#cursor.byte;
        const endByte = Math.min(startByte + length, this.size);
        if (startByte > this.size || endByte > this.size) {
            throw new RangeError('Hexdump amount is outside of data size');
        }
        const data = await this.#src.read(startByte, Math.min(endByte, this.size) - startByte);
        return _hexDump(data, options, startByte, endByte);
    }

    // #region positional (additional)

    async readByteAt(offset: number, unsigned = true): Promise<number> {
        await this.#ensureOpen();
        const v = (await this.#src.read(offset, 1))[0];
        return unsigned ? (v & 0xFF) : (v > 127 ? v - 256 : v);
    }
    async readBytesAt(offset: number, length: number): Promise<Uint8Array> {
        await this.#ensureOpen();
        return (await this.#src.read(offset, length)).slice();
    }
    async readFloat32At(offset: number, endian = this.endian): Promise<number> {
        await this.#ensureOpen();
        const b = await this.#src.read(offset, 4);
        return readFloat32(new DataView(b.buffer, b.byteOffset, 4), 0, endian === 'little');
    }
    async readFloat64At(offset: number, endian = this.endian): Promise<number> {
        await this.#ensureOpen();
        const b = await this.#src.read(offset, 8);
        return readFloat64(new DataView(b.buffer, b.byteOffset, 8), 0, endian === 'little');
    }
    async readBigInt64At(offset: number, endian = this.endian): Promise<bigint> {
        await this.#ensureOpen();
        const b = await this.#src.read(offset, 8);
        return readBig(new DataView(b.buffer, b.byteOffset, 8), 0, true, endian === 'little');
    }
    async readBigUInt64At(offset: number, endian = this.endian): Promise<bigint> {
        await this.#ensureOpen();
        const b = await this.#src.read(offset, 8);
        return readBig(new DataView(b.buffer, b.byteOffset, 8), 0, false, endian === 'little');
    }
    async writeByteAt(offset: number, value: number, unsigned = true): Promise<void> {
        await this.#ensureOpen();
        if (this.#src.readOnly) throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 1);
        await this.#src.write(offset, new Uint8Array([numberSafe(value, 8, unsigned) & 0xFF]));
    }
    async writeBytesAt(offset: number, data: Uint8Array): Promise<void> {
        await this.#ensureOpen();
        if (this.#src.readOnly) throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + data.length);
        await this.#src.write(offset, data);
    }
    async writeUInt16At(offset: number, value: number, endian = this.endian): Promise<void> { return this.writeInt16At(offset, value, true, endian); }
    async writeUInt32At(offset: number, value: number, endian = this.endian): Promise<void> { return this.writeInt32At(offset, value, true, endian); }
    async writeFloat32At(offset: number, value: number, endian = this.endian): Promise<void> {
        await this.#ensureOpen();
        if (this.#src.readOnly) throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 4);
        const buf = new Uint8Array(4);
        writeFloat32(new DataView(buf.buffer), 0, value, endian === 'little');
        await this.#src.write(offset, buf);
    }
    async writeFloat64At(offset: number, value: number, endian = this.endian): Promise<void> {
        await this.#ensureOpen();
        if (this.#src.readOnly) throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 8);
        const buf = new Uint8Array(8);
        writeFloat64(new DataView(buf.buffer), 0, value, endian === 'little');
        await this.#src.write(offset, buf);
    }
    async writeBigInt64At(offset: number, value: number | bigint, unsigned = false, endian = this.endian): Promise<void> {
        await this.#ensureOpen();
        if (this.#src.readOnly) throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 8);
        const buf = new Uint8Array(8);
        writeBig(new DataView(buf.buffer), 0, numberSafe(value, 64, unsigned), !unsigned, endian === 'little');
        await this.#src.write(offset, buf);
    }
    async writeBigUInt64At(offset: number, value: number | bigint, endian = this.endian): Promise<void> { return this.writeBigInt64At(offset, value, true, endian); }

    // #region data / lifecycle

    /** In-memory buffer (memory mode); null in file mode - use get()/getData(). */
    get data(): Uint8Array | null {
        return this.#source instanceof MemorySource ? this.#source.data : null;
    }

    /** DataView over the in-memory buffer (memory mode only). */
    get view(): DataView | null {
        const d = this.data;
        return d ? new DataView(d.buffer, d.byteOffset, d.byteLength) : null;
    }

    async commit(): Promise<void> {
        await this.flush();
    }

    async flush(): Promise<void> {
        if (this.#source) await this.#source.flush();
    }

    /** Returns the current data (trimmed to the write position if the buffer was expanded). */
    async get(): Promise<Uint8Array> {
        await this.#ensureOpen();
        await this.flush();
        const full = this.#src instanceof MemorySource
            ? this.#src.data
            : new Uint8Array(await this.#src.read(0, this.size));
        if (this.growthIncrement !== 0 && this.#wasExpanded) {
            return full.subarray(0, this.#cursor.byte);
        }
        return full;
    }

    async getData(): Promise<Uint8Array> { return this.get(); }
    async getFullBuffer(): Promise<Uint8Array> { return this.get(); }
    async return(): Promise<Uint8Array> { return this.get(); }

    async end(): Promise<Uint8Array | void> { return this.close(); }
    async done(): Promise<Uint8Array | void> { return this.close(); }
    async finished(): Promise<Uint8Array | void> { return this.close(); }

    async close(): Promise<Uint8Array | void> {
        await this.#ensureOpen();
        await this.flush();
        if (this.#src instanceof MemorySource) {
            return this.#src.data;
        }
        await this.#src.close();
        this.#source = null;
        this.#pendingPath = this.filePath;
    }

    /** Enable/disable writing + expanding (changes strict AND readOnly). */
    async writeMode(mode = true): Promise<void> {
        this.strict = !mode;
        this.readOnly = !mode;
        if (this.#pendingPath || (this.#source && !(this.#source instanceof MemorySource))) {
            await this.close();
        }
    }

    async renameFile(newFilePath: string): Promise<void> {
        if (this.isMemoryMode) return;
        await this.close();
        if (!BiEngine.fs) throw new Error("Can't rename file outside of Node.");
        await BiEngine.fs.rename(this.filePath as string, newFilePath);
        this.filePath = newFilePath;
        this.#pendingPath = newFilePath;
        await this.open();
    }

    async deleteFile(): Promise<void> {
        if (this.isMemoryMode) return;
        if (this.readOnly) throw new Error("Can't delete file in readOnly mode!");
        await this.close();
        if (!BiEngine.fs) throw new Error("Can't delete file outside of Node.");
        await BiEngine.fs.unlink(this.filePath as string);
        this.filePath = null;
        this.#pendingPath = null;
    }
}
