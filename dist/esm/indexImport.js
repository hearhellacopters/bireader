import fs from 'fs';
import fsp from 'fs/promises';

/**
 * @file Phase-2 engine brick: the read/write cursor.
 *
 * This module is part of the planned decomposition of the two ~4,500-line
 * `BiBase` / `BiBaseAsync` god-classes into small, independently testable units
 * (see ./README.md). It is written strict-null-safe from the start so the eventual
 * `strictNullChecks` flip lands for free on the code that will actually persist.
 *
 * The cursor owns ALL byte/bit position arithmetic - historically the single most
 * bug-prone area of the library (the v4 constructor mis-applied `bitOffset`, the
 * skip/goto normalization double-counted bytes, and bit-read end-offset was off by
 * one). Centralizing it here means that logic is written and tested exactly once.
 */
/** Wrap any integer bit index into the 0-7 range. */
function normalizeBitOffset(bit) {
    return ((bit % 8) + 8) % 8;
}
/**
 * A byte + intra-byte-bit position over a buffer of `size` bytes.
 *
 * Invariants held at all times:
 *   - `byte >= 0`
 *   - `0 <= bit <= 7`
 */
class Cursor {
    #byte = 0;
    #bit = 0;
    constructor(byteOffset = 0, bitOffset = 0) {
        this.set(byteOffset, bitOffset);
    }
    /** Current byte position. */
    get byte() {
        return this.#byte;
    }
    /** Current intra-byte bit position (0-7). */
    get bit() {
        return this.#bit;
    }
    /** Absolute position in bits. */
    get bitPosition() {
        return this.#byte * 8 + this.#bit;
    }
    /**
     * Set an absolute position. A non-zero `bitOffset` rolls whole bytes into `byte`
     * and keeps the remainder in `bit` - it does NOT replace `byteOffset` (the v4 bug).
     */
    set(byteOffset, bitOffset = 0) {
        let byte = Math.trunc(byteOffset) + Math.floor(bitOffset / 8);
        this.#bit = normalizeBitOffset(bitOffset);
        this.#byte = Math.max(byte, 0);
        return this;
    }
    /** Set from an absolute bit position. */
    setBitPosition(bits) {
        return this.set(Math.floor(bits / 8), bits % 8);
    }
    /** Relative move by whole bytes and/or bits (bits may be negative). */
    skip(bytes = 0, bits = 0) {
        const total = this.bitPosition + bytes * 8 + bits;
        return this.setBitPosition(Math.max(total, 0));
    }
    /** Move to the next byte boundary if not already aligned. */
    alignByte() {
        if (this.#bit !== 0) {
            this.#byte += 1;
            this.#bit = 0;
        }
        return this;
    }
    /**
     * The exclusive end byte required to read/write `bits` starting here, i.e. the
     * number of bytes that must exist. (`ceil((bit + bits) / 8) + byte`.)
     */
    endByteForBits(bits) {
        return Math.ceil((this.#bit + bits) / 8) + this.#byte;
    }
    clone() {
        const c = new Cursor();
        c.#byte = this.#byte;
        c.#bit = this.#bit;
        return c;
    }
}

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
class MemorySyncSource {
    #data;
    #readOnly;
    #isBuffer;
    constructor(data, readOnly = false) {
        this.#data = data;
        this.#readOnly = readOnly;
        this.#isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(data);
    }
    get size() { return this.#data.length; }
    get readOnly() { return this.#readOnly; }
    get data() { return this.#data; }
    read(offset, length) {
        if (offset < 0 || offset + length > this.#data.length) {
            throw new RangeError(`Read ${offset}..${offset + length} out of range (size ${this.#data.length})`);
        }
        return this.#data.subarray(offset, offset + length);
    }
    write(offset, data) {
        if (this.#readOnly)
            throw new Error('Cannot write to a read-only source');
        if (offset < 0 || offset + data.length > this.#data.length) {
            throw new RangeError(`Write ${offset}..${offset + data.length} out of range (size ${this.#data.length}); resize first`);
        }
        this.#data.set(data, offset);
    }
    resize(size) {
        if (this.#readOnly)
            throw new Error('Cannot resize a read-only source');
        if (size === this.#data.length)
            return;
        if (this.#isBuffer) {
            const next = Buffer.alloc(size);
            this.#data.copy(next, 0, 0, Math.min(size, this.#data.length));
            this.#data = next;
        }
        else {
            const next = new Uint8Array(size);
            next.set(this.#data.subarray(0, Math.min(size, this.#data.length)));
            this.#data = next;
        }
    }
    flush() { }
    close() { }
}
class FileSyncSource {
    #fd;
    #fs;
    #data;
    #readOnly;
    #dirty = false;
    constructor(fd, fs, readOnly) {
        this.#fd = fd;
        this.#fs = fs;
        this.#readOnly = readOnly;
        const { size } = fs.fstatSync(fd);
        this.#data = Buffer.alloc(size);
        if (size > 0) {
            fs.readSync(fd, this.#data, 0, size, 0);
        }
    }
    get size() { return this.#data.length; }
    get readOnly() { return this.#readOnly; }
    read(offset, length) {
        if (offset < 0 || offset + length > this.#data.length) {
            throw new RangeError(`Read ${offset}..${offset + length} out of range (size ${this.#data.length})`);
        }
        return this.#data.subarray(offset, offset + length);
    }
    write(offset, data) {
        if (this.#readOnly)
            throw new Error('Cannot write to a read-only source');
        if (offset < 0 || offset + data.length > this.#data.length) {
            throw new RangeError(`Write ${offset}..${offset + data.length} out of range (size ${this.#data.length}); resize first`);
        }
        this.#data.set(data, offset);
        this.#dirty = true;
    }
    resize(size) {
        if (this.#readOnly)
            throw new Error('Cannot resize a read-only source');
        if (size === this.#data.length)
            return;
        const next = Buffer.alloc(size);
        next.set(this.#data.subarray(0, Math.min(size, this.#data.length)));
        this.#data = next;
        this.#dirty = true;
    }
    flush() {
        if (this.#readOnly || !this.#dirty || this.#fd === null)
            return;
        this.#fs.writeSync(this.#fd, this.#data, 0, this.#data.length, 0);
        this.#fs.ftruncateSync(this.#fd, this.#data.length);
        this.#dirty = false;
    }
    close() {
        this.flush();
        if (this.#fd !== null) {
            this.#fs.closeSync(this.#fd);
            this.#fd = null;
        }
    }
    /** Full in-memory buffer (sync file mode keeps the whole file resident). */
    get data() { return this.#data; }
}

/**
 * @file Phase-2 engine brick: pure value codecs.
 *
 * Lifts the numeric / float / bit encode-decode logic out of `common.ts` into one
 * dependency-free, strict-null-safe module (see ./README.md). Every function is a
 * pure transform over a `DataView` / `Uint8Array` at an absolute offset - no cursor,
 * no capability branching sprinkled through the read/write methods.
 */
// #region clamping
const hasBigInt$2 = typeof BigInt === 'function';
/**
 * Clamp `value` into the representable range of a `bits`-wide signed/unsigned integer,
 * matching the legacy engine's `numberSafe` so out-of-range writes behave identically.
 * (For `bits === 1` the range is treated as unsigned, a legacy quirk preserved on purpose.)
 */
function numberSafe(value, bits, unsigned) {
    let min;
    let max;
    if (unsigned || bits === 1) {
        min = 0;
        switch (bits) {
            case 8:
                max = 255;
                break;
            case 16:
                max = 65535;
                break;
            case 32:
                max = 4294967295;
                break;
            default:
                if (bits <= 54 || hasBigInt$2) {
                    max = Math.pow(2, bits) - 1;
                }
                else {
                    throw new RangeError("System can't handle large numbers without BigInt support.");
                }
        }
    }
    else {
        switch (bits) {
            case 8:
                max = 127;
                break;
            case 16:
                max = 32767;
                break;
            case 32:
                max = 2147483647;
                break;
            default:
                if (bits <= 55 || hasBigInt$2) {
                    max = Math.pow(2, bits - 1) - 1;
                }
                else {
                    throw new RangeError("System can't handle large numbers without BigInt support.");
                }
        }
        min = -max - 1;
    }
    if (value < min) {
        return (typeof value === 'bigint' ? BigInt(min) : min);
    }
    if (value > max) {
        return (typeof value === 'bigint' ? BigInt(max) : max);
    }
    return value;
}
// #region integers (8/16/32 → number)
/** Read an 8/16/32-bit integer. */
function readInt(view, offset, width, signed, little) {
    switch (width) {
        case 8: return signed ? view.getInt8(offset) : view.getUint8(offset);
        case 16: return signed ? view.getInt16(offset, little) : view.getUint16(offset, little);
        case 32: return signed ? view.getInt32(offset, little) : view.getUint32(offset, little);
    }
}
/** Write an 8/16/32-bit integer. */
function writeInt(view, offset, value, width, signed, little) {
    switch (width) {
        case 8:
            signed ? view.setInt8(offset, value) : view.setUint8(offset, value);
            return;
        case 16:
            signed ? view.setInt16(offset, value, little) : view.setUint16(offset, value, little);
            return;
        case 32:
            signed ? view.setInt32(offset, value, little) : view.setUint32(offset, value, little);
            return;
    }
}
// #region 64-bit integers (→ bigint)
/** Read a 64-bit integer as bigint. */
function readBig(view, offset, signed, little) {
    return signed ? view.getBigInt64(offset, little) : view.getBigUint64(offset, little);
}
/** Write a 64-bit integer from number|bigint. */
function writeBig(view, offset, value, signed, little) {
    const v = BigInt(value);
    if (signed) {
        view.setBigInt64(offset, v, little);
    }
    else {
        view.setBigUint64(offset, v, little);
    }
}
// #region 32/64-bit floats
function readFloat32(view, offset, little) {
    return view.getFloat32(offset, little);
}
function writeFloat32(view, offset, value, little) {
    view.setFloat32(offset, value, little);
}
function readFloat64(view, offset, little) {
    return view.getFloat64(offset, little);
}
function writeFloat64(view, offset, value, little) {
    view.setFloat64(offset, value, little);
}
// #region 16-bit float (manual - getFloat16 is not universal)
const f32 = new Float32Array(1);
const f32AsU32 = new Uint32Array(f32.buffer);
/** Read an IEEE-754 half (16-bit) float. */
function readFloat16(view, offset, little) {
    const bits = view.getUint16(offset, little);
    const sign = (bits & 0x8000) >> 15;
    const exponent = (bits & 0x7C00) >> 10;
    const fraction = bits & 0x03FF;
    if (exponent === 0) {
        return fraction === 0
            ? (sign === 0 ? 0 : -0)
            : (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
    }
    if (exponent === 0x1F) {
        return fraction === 0
            ? (sign === 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY)
            : Number.NaN;
    }
    return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
}
/** Write an IEEE-754 half (16-bit) float. */
function writeFloat16(view, offset, value, little) {
    f32[0] = value;
    const x = f32AsU32[0];
    const sign = (x >> 31) & 0x1;
    let exponent = (x >> 23) & 0xff;
    let mantissa = x & 0x7fffff;
    let half;
    if (exponent === 0xff) {
        half = (sign << 15) | (0x1f << 10) | (mantissa ? 0x200 : 0);
    }
    else if (exponent > 142) {
        half = (sign << 15) | (0x1f << 10);
    }
    else if (exponent < 113) {
        if (exponent < 103) {
            half = sign << 15;
        }
        else {
            mantissa |= 0x800000;
            const shift = 125 - exponent;
            mantissa = mantissa >> shift;
            half = (sign << 15) | (mantissa >> 13);
        }
    }
    else {
        exponent = exponent - 112;
        mantissa = mantissa >> 13;
        half = (sign << 15) | (exponent << 10) | mantissa;
    }
    view.setUint16(offset, half, little);
}
// #region bit fields
/**
 * Read `bits` (1-32) starting at absolute bit position `bitOffset` within `data`.
 */
function readBits(data, bitOffset, bits, little, signed) {
    let value = 0;
    let offset = bitOffset;
    for (let i = 0; i < bits;) {
        const remaining = bits - i;
        const bitPos = offset & 7;
        const currentByte = data[offset >> 3];
        const read = Math.min(remaining, 8 - bitPos);
        const mask = ~(0xFF << read);
        if (little) {
            const readBits = (currentByte >> bitPos) & mask;
            value |= readBits << i;
        }
        else {
            const readBits = (currentByte >> (8 - read - bitPos)) & mask;
            value <<= read;
            value |= readBits;
        }
        offset += read;
        i += read;
    }
    if (signed) {
        const signBit = 1 << (bits - 1);
        if (value & signBit) {
            value -= (1 << bits);
        }
    }
    return value;
}
/**
 * Write `bits` (1-32) of `value` starting at absolute bit position `bitOffset`.
 */
function writeBits(data, value, bits, bitOffset, little, signed) {
    if (!signed) {
        value = value & (Math.pow(2, bits) - 1);
    }
    let offset = bitOffset;
    for (let i = 0; i < bits;) {
        const remaining = bits - i;
        const bitPos = offset & 7;
        const byteOffset = offset >> 3;
        const written = Math.min(remaining, 8 - bitPos);
        if (little) {
            const mask = ~(0xFF << written);
            const writeBits = value & mask;
            value >>= written;
            const destMask = ~(mask << bitPos);
            data[byteOffset] = (data[byteOffset] & destMask) | (writeBits << bitPos);
        }
        else {
            const mask = ~(-1 << written);
            const writeBits = (value >> (bits - i - written)) & mask;
            const destShift = 8 - bitPos - written;
            const destMask = ~(mask << destShift);
            data[byteOffset] = (data[byteOffset] & destMask) | (writeBits << destShift);
        }
        offset += written;
        i += written;
    }
}

// #region Types
// #region Helpers
function isBuffer(obj) {
    return (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj));
}
function isBufferOrUint8Array(obj) {
    return obj instanceof Uint8Array || isBuffer(obj);
}
function safeFromCharCode(arr) {
    const chunk = 0x8000;
    let result = "";
    for (let i = 0; i < arr.length; i += chunk) {
        result += String.fromCharCode(...arr.slice(i, i + chunk));
    }
    return result;
}
function safeFromCodePoint(arr) {
    const chunk = 0x8000;
    let result = "";
    for (let i = 0; i < arr.length; i += chunk) {
        result += String.fromCodePoint(...arr.slice(i, i + chunk));
    }
    return result;
}
function textEncode(string, bytesPerChar = 1) {
    switch (bytesPerChar) {
        case 1:
            return new TextEncoder().encode(string);
        case 2:
            {
                const utf16Buffer = new Uint16Array(string.length);
                for (let i = 0; i < string.length; i++) {
                    utf16Buffer[i] = string.charCodeAt(i);
                }
                return new Uint8Array(utf16Buffer.buffer);
            }
        case 4:
            {
                const utf32Buffer = new Uint32Array(string.length);
                for (let i = 0; i < string.length; i++) {
                    utf32Buffer[i] = string.codePointAt(i) ?? 0;
                }
                return new Uint8Array(utf32Buffer.buffer);
            }
        default:
            return new Uint8Array(0);
    }
}
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
function hexdump(src, options = {}) {
    if (!(src instanceof Uint8Array || isBuffer(src))) {
        throw new Error("Write data must be Uint8Array or Buffer.");
    }
    const ctx = {
        data: src,
        size: src.length,
        offset: options && options.startByte || 0};
    var length = options && options.length;
    var startByte = options && options.startByte;
    if ((startByte || 0) > ctx.size) {
        throw new Error("Hexdump start is outside of data size: " + startByte + " of " + ctx.size);
    }
    const start = startByte || ctx.offset;
    const end = Math.min(start + (length || 192), ctx.size);
    if (start + (length || 0) > ctx.size) {
        throw new Error("Hexdump amount is outside of data size: " + (start + (length || 0)) + " of " + end);
    }
    const data = ctx.data;
    return _hexDump(data, options, start, end);
}
function _hexDump(data, options = {}, start, end) {
    function _hexCheck(byte, bits) {
        var value = 0;
        for (var i = 0; i < bits;) {
            const remaining = bits - i;
            const bitOffset = 0;
            const currentByte = byte;
            const read = Math.min(remaining, 8 - bitOffset);
            const mask = ~(0xFF << read);
            const readBits = (currentByte >> (8 - read - bitOffset)) & mask;
            value <<= read;
            value |= readBits;
            i += read;
        }
        value = value >>> 0;
        return value;
    }
    const suppressUnicode = options && options.suppressUnicode || false;
    const rows = [];
    var header = "   0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  ";
    const ending = "0123456789ABCDEF";
    var addr = "";
    for (let i = start; i < end; i += 16) {
        addr = i.toString(16).padStart(5, '0');
        var row = data.subarray(i, i + 16) || [];
        var hex = Array.from(row, (byte) => byte.toString(16).padStart(2, '0')).join(' ');
        rows.push(`${addr}  ${hex.padEnd(47)}  `);
    }
    let result = '';
    let makeWide = false;
    let i = start;
    while (i < end) {
        const byte = data[i];
        if (byte < 32 || byte == 127) {
            result += '.';
        }
        else if (byte < 127) {
            // Valid UTF-8 start byte or single-byte character
            // Convert the byte to a character and add it to the result
            result += String.fromCharCode(byte);
        }
        else if (suppressUnicode) {
            result += '.';
        }
        else if (_hexCheck(byte, 1) == 0) {
            //Byte 1
            result += String.fromCharCode(byte);
        }
        else if (_hexCheck(byte, 3) == 6) {
            //Byte 2
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1];
                if (_hexCheck(byte2, 2) == 2) {
                    const charCode = ((byte & 0x1f) << 6) | (byte2 & 0x3f);
                    i++;
                    makeWide = true;
                    const read = " " + String.fromCharCode(charCode);
                    result += read;
                }
                else {
                    result += ".";
                }
            }
            else {
                result += ".";
            }
        }
        else if (_hexCheck(byte, 4) == 14) {
            //Byte 3
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1];
                if (_hexCheck(byte2, 2) == 2) {
                    if (i + 2 <= end) {
                        //check third byte
                        const byte3 = data[i + 2];
                        if (_hexCheck(byte3, 2) == 2) {
                            const charCode = ((byte & 0x0f) << 12) |
                                ((byte2 & 0x3f) << 6) |
                                (byte3 & 0x3f);
                            i += 2;
                            makeWide = true;
                            const read = "  " + String.fromCharCode(charCode);
                            result += read;
                        }
                        else {
                            i++;
                            result += " .";
                        }
                    }
                    else {
                        i++;
                        result += " .";
                    }
                }
                else {
                    result += ".";
                }
            }
            else {
                result += ".";
            }
        }
        else if (_hexCheck(byte, 5) == 28) {
            //Byte 4
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1];
                if (_hexCheck(byte2, 2) == 2) {
                    if (i + 2 <= end) {
                        //check third byte
                        const byte3 = data[i + 2];
                        if (_hexCheck(byte3, 2) == 2) {
                            if (i + 3 <= end) {
                                //check fourth byte
                                const byte4 = data[i + 3];
                                if (_hexCheck(byte4, 2) == 2) {
                                    const charCode = (((byte4 & 0xFF) << 24) | ((byte3 & 0xFF) << 16) | ((byte2 & 0xFF) << 8) | (byte & 0xFF));
                                    i += 3;
                                    makeWide = true;
                                    const read = "   " + String.fromCharCode(charCode);
                                    result += read;
                                }
                                else {
                                    i += 2;
                                    result += "  .";
                                }
                            }
                            else {
                                i += 2;
                                result += "  .";
                            }
                        }
                        else {
                            i++;
                            result += " .";
                        }
                    }
                    else {
                        i++;
                        result += " .";
                    }
                }
                else {
                    result += ".";
                }
            }
            else {
                result += ".";
            }
        }
        else {
            // Invalid UTF-8 byte, add a period to the result
            result += '.';
        }
        i++;
    }
    const chunks = result.match(new RegExp(`.{1,${16}}`, 'g'));
    chunks?.forEach((self, i) => {
        rows[i] = rows[i] + (makeWide ? "|" + self + "|" : self);
    });
    header = "".padStart(addr.length) + header + (makeWide ? "" : ending);
    rows.unshift(header);
    if (makeWide) {
        rows.push("*Removed character byte header on unicode detection");
    }
    if (options && options.returnString) {
        return rows.join("\n");
    }
    else {
        const retVal = rows.join("\n");
        console.log(retVal);
        return retVal;
    }
}
// #region Math
function _AND(data, start, end, andKey) {
    if (typeof andKey == "string") {
        andKey = Uint8Array.from(Array.from(andKey).map(letter => letter.charCodeAt(0)));
    }
    if (isBufferOrUint8Array(andKey) || typeof andKey == "number") {
        var index = -1;
        for (let i = start; i < end; i++) {
            if (typeof andKey == "number") {
                data[i] = data[i] & (andKey & 0xff);
            }
            else {
                if (index != andKey.length - 1) {
                    index++;
                }
                else {
                    index = 0;
                }
                data[i] = data[i] & andKey[index];
            }
        }
        return { offset: end, bitoffset: 0 };
    }
    else {
        throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
    }
}
function _OR(data, start, end, orKey) {
    if (typeof orKey == "string") {
        orKey = Uint8Array.from(Array.from(orKey).map(letter => letter.charCodeAt(0)));
    }
    if (isBufferOrUint8Array(orKey) || typeof orKey == "number") {
        var index = -1;
        for (let i = start; i < end; i++) {
            if (typeof orKey == "number") {
                data[i] = data[i] | (orKey & 0xff);
            }
            else {
                if (index != orKey.length - 1) {
                    index++;
                }
                else {
                    index = 0;
                }
                data[i] = data[i] | orKey[index];
            }
        }
        return { offset: end, bitoffset: 0 };
    }
    else {
        throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
    }
}
function _XOR(data, start, end, xorKey) {
    if (typeof xorKey == "string") {
        xorKey = Uint8Array.from(Array.from(xorKey).map(letter => letter.charCodeAt(0)));
    }
    if (isBufferOrUint8Array(xorKey) || typeof xorKey == "number") {
        let index = -1;
        for (let i = start; i < end; i++) {
            if (typeof xorKey == "number") {
                data[i] = data[i] ^ (xorKey & 0xff);
            }
            else {
                if (index != xorKey.length - 1) {
                    index++;
                }
                else {
                    index = 0;
                }
                data[i] = data[i] ^ xorKey[index];
            }
        }
        return { offset: end, bitoffset: 0 };
    }
    else {
        throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
    }
}
function _LSHIFT(data, start, end, shiftKey) {
    if (typeof shiftKey == "string") {
        shiftKey = Uint8Array.from(Array.from(shiftKey).map(letter => letter.charCodeAt(0)));
    }
    if (isBufferOrUint8Array(shiftKey) || typeof shiftKey == "number") {
        var index = -1;
        for (let i = start; i < end; i++) {
            if (typeof shiftKey == "number") {
                data[i] = data[i] << shiftKey;
            }
            else {
                if (index != shiftKey.length - 1) {
                    index++;
                }
                else {
                    index = 0;
                }
                data[i] = data[i] << shiftKey[index];
            }
        }
        return { offset: end, bitoffset: 0 };
    }
    else {
        throw new Error("Left Shift key must be a byte value, string, Uint8Array or Buffer");
    }
}
function _RSHIFT(data, start, end, shiftKey) {
    if (typeof shiftKey == "string") {
        shiftKey = Uint8Array.from(Array.from(shiftKey).map(letter => letter.charCodeAt(0)));
    }
    if (isBufferOrUint8Array(shiftKey) || typeof shiftKey == "number") {
        var index = -1;
        for (let i = start; i < end; i++) {
            if (typeof shiftKey == "number") {
                data[i] = data[i] >> shiftKey;
            }
            else {
                if (index != shiftKey.length - 1) {
                    index++;
                }
                else {
                    index = 0;
                }
                data[i] = data[i] >> shiftKey[index];
            }
        }
        return { offset: end, bitoffset: 0 };
    }
    else {
        throw new Error("Right Shift key must be a byte value, string, Uint8Array or Buffer");
    }
}
function _ADD(data, start, end, addKey) {
    if (typeof addKey == "string") {
        addKey = Uint8Array.from(Array.from(addKey).map(letter => letter.charCodeAt(0)));
    }
    if (isBufferOrUint8Array(addKey) || typeof addKey == "number") {
        var index = -1;
        for (let i = start; i < end; i++) {
            if (typeof addKey == "number") {
                data[i] = data[i] + addKey;
            }
            else {
                if (index != addKey.length - 1) {
                    index = index + 1;
                }
                else {
                    index = 0;
                }
                data[i] = data[i] + addKey[index];
            }
        }
        return { offset: end, bitoffset: 0 };
    }
    else {
        throw new Error("ADD key must be a byte value, string, Uint8Array or Buffer");
    }
}
function _NOT(data, start, end) {
    for (let i = start; i < end; i++) {
        data[i] = ~data[i];
    }
    return { offset: end, bitoffset: 0 };
}
function _rstring(stringType, lengthReadSize, readLengthinBytes, terminateValue, stripNull, encoding, endian, readUByte, readUInt16, readUInt32) {
    const encodedBytes = [];
    if (stringType === 'pascal' || stringType === 'wide-pascal' || stringType === "double-wide-pascal") {
        // NaN disables the terminator check (read == NaN is always false); pascal is length-based.
        terminateValue = NaN;
        if (lengthReadSize == 1) {
            readLengthinBytes = readUByte();
        }
        else if (lengthReadSize == 2) {
            readLengthinBytes = readUInt16(endian);
        }
        else if (lengthReadSize == 4) {
            readLengthinBytes = readUInt32(endian);
        }
    }
    var readSize = 1;
    switch (stringType) {
        case 'utf-8':
        case 'ascii':
        case 'pascal':
            readSize = 1;
            break;
        case 'utf-16':
        case 'wide-pascal':
            readSize = 2;
            break;
        case 'utf-32':
        case 'double-wide-pascal':
            readSize = 4;
            break;
    }
    for (let i = 0; i < readLengthinBytes; i++) {
        var read = terminateValue;
        switch (readSize) {
            case 1:
                read = readUByte();
                break;
            case 2:
                read = readUInt16(endian);
                i++;
                break;
            case 4:
                read = readUInt32(endian);
                i++;
                i++;
                i++;
                if (stringType == 'utf-32' && read > 0x10FFFF) {
                    read = terminateValue;
                }
                break;
        }
        if (read == terminateValue) {
            break;
        }
        else {
            if (!(stripNull == true && read == 0)) {
                encodedBytes.push(read);
            }
        }
    }
    switch (stringType) {
        case "pascal":
        case "ascii":
        case "utf-16":
        case "wide-pascal":
            return safeFromCharCode(encodedBytes);
        case "double-wide-pascal":
        case "utf-32":
            return safeFromCodePoint(encodedBytes);
        default:
            try {
                return new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
            }
            catch (err) {
                throw new Error(`Unsupported encoding: ${encoding}`);
            }
    }
}
function _wstring(encodedString, stringType, endian, terminateValue, lengthWriteSize, writeUByte, writeUInt16, writeUInt32) {
    if (stringType == "pascal" ||
        stringType == 'wide-pascal' ||
        stringType == 'double-wide-pascal') {
        if (lengthWriteSize == 1) {
            writeUByte(encodedString.byteLength);
        }
        else if (lengthWriteSize == 2) {
            writeUInt16(encodedString.byteLength, endian);
        }
        else if (lengthWriteSize == 4) {
            writeUInt32(encodedString.byteLength, endian);
        }
    }
    const view = new DataView(encodedString.buffer, encodedString.byteOffset, encodedString.byteLength);
    for (let i = 0; i < view.byteLength; i++) {
        switch (stringType) {
            case 'ascii':
            case 'utf-8':
            case 'pascal':
                writeUByte(view.getUint8(i));
                break;
            case 'utf-16':
            case 'wide-pascal':
                writeUInt16(view.getUint16(i, true), endian);
                i++;
                break;
            case 'utf-32':
            case 'double-wide-pascal':
                writeUInt32(view.getUint32(i, true), endian);
                i++;
                i++;
                i++;
                break;
        }
    }
    if (terminateValue != undefined) {
        if (stringType == "ascii" || stringType == 'utf-8') {
            writeUByte(terminateValue);
        }
        else if (stringType == 'utf-16') {
            writeUInt16(terminateValue, endian);
        }
        else if (stringType == 'utf-32') {
            writeUInt32(terminateValue, endian);
        }
    }
}

var _a$1;
const hasBigInt$1 = typeof BigInt === 'function';
const MIN_SAFE$1 = hasBigInt$1 ? BigInt(Number.MIN_SAFE_INTEGER) : 0n;
const MAX_SAFE$1 = hasBigInt$1 ? BigInt(Number.MAX_SAFE_INTEGER) : 0n;
function isSafeInt64$1(v) { return hasBigInt$1 ? (v >= MIN_SAFE$1 && v <= MAX_SAFE$1) : false; }
class BiSyncEngine {
    /** File system (node:fs), injected by the entry point for file mode. */
    static fs;
    #source = null;
    #cursor;
    #pendingPath = null;
    #wasExpanded = false;
    endian;
    enforceBigInt;
    strict;
    readOnly;
    growthIncrement;
    filePath = null;
    errorDump = false;
    strDefaults = { stringType: 'utf-8', terminateValue: 0x0 };
    constructor(input, options = {}) {
        this.endian = options.endianness ?? 'little';
        this.enforceBigInt = (options.enforceBigInt ?? false) && hasBigInt$1;
        this.readOnly = !!options.readOnly;
        this.strict = this.readOnly ? true : (options.strict ?? false);
        this.growthIncrement = options.growthIncrement ?? 0x100000;
        this.#cursor = new Cursor(options.byteOffset ?? 0, options.bitOffset ?? 0);
        if (typeof input === 'string') {
            this.filePath = input;
            this.#pendingPath = input;
        }
        else if (isBufferOrUint8Array(input)) {
            this.#source = new MemorySyncSource(input, this.readOnly);
        }
        else {
            throw new TypeError('Source must be a file path (string) or Uint8Array/Buffer');
        }
    }
    // #region lifecycle / source
    get isMemoryMode() { return this.#source instanceof MemorySyncSource; }
    get source() { return this.#src; }
    get #src() {
        if (!this.#source)
            return this.#ensureOpen();
        return this.#source;
    }
    #ensureOpen() {
        if (this.#source)
            return this.#source;
        if (this.#pendingPath) {
            if (!_a$1.fs)
                throw new Error("Can't load file outside of Node.");
            try {
                _a$1.fs.accessSync(this.#pendingPath, _a$1.fs.constants.F_OK);
            }
            catch {
                _a$1.fs.writeFileSync(this.#pendingPath, '');
            }
            const fd = _a$1.fs.openSync(this.#pendingPath, this.readOnly ? 'r' : 'r+');
            this.#source = new FileSyncSource(fd, _a$1.fs, this.readOnly);
        }
        if (!this.#source)
            throw new Error('No data source');
        return this.#source;
    }
    open(data) {
        if (data && isBufferOrUint8Array(data)) {
            this.#source = new MemorySyncSource(data, this.readOnly);
            this.#pendingPath = null;
            return;
        }
        this.#ensureOpen();
    }
    // #region position / size
    get size() { return this.#source ? this.#source.size : 0; }
    get offset() { return this.#cursor.byte; }
    set offset(value) { this.goto(value); }
    get insetBit() { return this.#cursor.bit; }
    set insetBit(value) { this.goto(this.#cursor.byte, value % 8); }
    get bitOffset() { return this.#cursor.bitPosition; }
    set bitOffset(value) { this.goto(value - (value % 8), value % 8); }
    // #region internals
    #alignByte() { this.#cursor.alignByte(); }
    #requireReadable(offset, length) {
        if (offset + length > this.#src.size) {
            throw new RangeError(`Read of ${length} at ${offset} exceeds size ${this.#src.size}`);
        }
    }
    #ensureWritable(endByte) {
        if (endByte <= this.#src.size)
            return;
        if (this.strict || this.#src.readOnly) {
            throw new Error(`Reached end of data: need ${endByte}, have ${this.#src.size} (strict/readOnly)`);
        }
        this.#wasExpanded = true;
        this.#src.resize(endByte);
    }
    #reach(targetByte) {
        if (targetByte <= this.size)
            return;
        if (this.strict || this.readOnly)
            throw new Error(`Reached end of data: ${targetByte} of ${this.size}`);
        this.#ensureWritable(targetByte);
    }
    #readAlignedView(width) {
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#requireReadable(at, width);
        const bytes = this.#src.read(at, width);
        return { view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), at };
    }
    #writeAlignedView(width, encode, consume) {
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#ensureWritable(at + width);
        const buf = new Uint8Array(width);
        encode(new DataView(buf.buffer));
        this.#src.write(at, buf);
        if (consume)
            this.#cursor.set(at + width);
    }
    // #region numeric reads
    readByte(unsigned = false, consume = true) {
        const { view, at } = this.#readAlignedView(1);
        const v = readInt(view, 0, 8, !unsigned, false);
        if (consume)
            this.#cursor.set(at + 1);
        return v;
    }
    readInt16(unsigned = false, endian = this.endian, consume = true) {
        const { view, at } = this.#readAlignedView(2);
        const v = readInt(view, 0, 16, !unsigned, endian === 'little');
        if (consume)
            this.#cursor.set(at + 2);
        return v;
    }
    readInt32(unsigned = false, endian = this.endian, consume = true) {
        const { view, at } = this.#readAlignedView(4);
        const v = readInt(view, 0, 32, !unsigned, endian === 'little');
        if (consume)
            this.#cursor.set(at + 4);
        return v;
    }
    readInt64(unsigned = false, endian = this.endian, consume = true) {
        if (!hasBigInt$1)
            throw new Error("System doesn't support BigInt values.");
        const { view, at } = this.#readAlignedView(8);
        const v = readBig(view, 0, !unsigned, endian === 'little');
        if (consume)
            this.#cursor.set(at + 8);
        if (this.enforceBigInt || !isSafeInt64$1(v))
            return v;
        return Number(v);
    }
    #readFloatN(width, endian, consume) {
        const { view, at } = this.#readAlignedView(width / 8);
        const little = endian === 'little';
        const v = width === 16 ? readFloat16(view, 0, little) : width === 32 ? readFloat32(view, 0, little) : readFloat64(view, 0, little);
        if (consume)
            this.#cursor.set(at + width / 8);
        return v;
    }
    readHalfFloat(endian = this.endian, consume = true) { return this.#readFloatN(16, endian, consume); }
    readFloat(endian = this.endian, consume = true) { return this.#readFloatN(32, endian, consume); }
    readDoubleFloat(endian = this.endian, consume = true) { return this.#readFloatN(64, endian, consume); }
    // #region numeric writes
    writeByte(value, unsigned = false, consume = true) {
        this.#writeAlignedView(1, v => writeInt(v, 0, numberSafe(value, 8, unsigned), 8, !unsigned, false), consume);
    }
    writeInt16(value, unsigned = false, endian = this.endian, consume = true) {
        this.#writeAlignedView(2, v => writeInt(v, 0, numberSafe(value, 16, unsigned), 16, !unsigned, endian === 'little'), consume);
    }
    writeInt32(value, unsigned = false, endian = this.endian, consume = true) {
        this.#writeAlignedView(4, v => writeInt(v, 0, numberSafe(value, 32, unsigned), 32, !unsigned, endian === 'little'), consume);
    }
    writeInt64(value, unsigned = false, endian = this.endian, consume = true) {
        if (!hasBigInt$1)
            throw new Error("System doesn't support BigInt values.");
        this.#writeAlignedView(8, v => writeBig(v, 0, numberSafe(value, 64, unsigned), !unsigned, endian === 'little'), consume);
    }
    writeHalfFloat(value, endian = this.endian, consume = true) {
        this.#writeAlignedView(2, v => writeFloat16(v, 0, value, endian === 'little'), consume);
    }
    writeFloat(value, endian = this.endian, consume = true) {
        this.#writeAlignedView(4, v => writeFloat32(v, 0, value, endian === 'little'), consume);
    }
    writeDoubleFloat(value, endian = this.endian, consume = true) {
        this.#writeAlignedView(8, v => writeFloat64(v, 0, value, endian === 'little'), consume);
    }
    // #region bit fields
    readBit(bits, unsigned = false, endian = this.endian, consume = true) {
        if (bits === 0)
            return 0;
        if (bits < 0 || bits > 32)
            throw new Error('Bit length must be between 1 and 32. Got ' + bits);
        const endByte = this.#cursor.endByteForBits(bits);
        this.#ensureWritable(endByte);
        const bytes = this.#src.read(this.#cursor.byte, endByte - this.#cursor.byte);
        const v = readBits(bytes, this.#cursor.bit, bits, endian === 'little', !unsigned);
        if (consume)
            this.#cursor.skip(0, bits);
        return v;
    }
    writeBit(value, bits, unsigned = false, endian = this.endian, consume = true) {
        if (bits === 0)
            return;
        if (bits < 0 || bits > 32)
            throw new Error('Bit length must be between 1 and 32. Got ' + bits);
        value = numberSafe(value, bits, unsigned);
        const endByte = this.#cursor.endByteForBits(bits);
        this.#ensureWritable(endByte);
        const bytes = new Uint8Array(this.#src.read(this.#cursor.byte, endByte - this.#cursor.byte));
        writeBits(bytes, value, bits, this.#cursor.bit, endian === 'little', !unsigned);
        this.#src.write(this.#cursor.byte, bytes);
        if (consume)
            this.#cursor.skip(0, bits);
    }
    // #region raw bytes
    readBytes(amount, unsigned, consume = true) {
        const data = this.readUBytes(amount, consume);
        const out = [];
        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            out.push(unsigned ? (v & 0xFF) : (v > 127 ? v - 256 : v));
        }
        return out;
    }
    readUBytes(amount, consume = true) {
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#requireReadable(at, amount);
        const bytes = this.#src.read(at, amount).slice();
        if (consume)
            this.#cursor.set(at + amount);
        return bytes;
    }
    writeBytes(values, unsigned, consume = true) {
        const data = isBufferOrUint8Array(values) ? values : new Uint8Array(values);
        this.overwrite(data, this.offset, consume);
    }
    writeUBytes(values, consume = true) { this.writeBytes(values, true, consume); }
    // #region positioning
    goto(byte = 0, bit = 0) {
        this.#reach(byte + Math.ceil(bit / 8));
        this.#cursor.set(byte, bit);
    }
    skip(bytes = 0, bits = 0) {
        const target = this.#cursor.bitPosition + bytes * 8 + bits;
        this.#reach(Math.ceil(Math.max(target, 0) / 8));
        this.#cursor.skip(bytes, bits);
    }
    rewind() { this.#cursor.set(0, 0); }
    last() { this.#cursor.set(this.size, 0); }
    align(n) { const a = this.#cursor.byte % n; if (a)
        this.skip(n - a, 0); }
    alignRev(n) { const a = this.#cursor.byte % n; if (a)
        this.skip(-a, 0); }
    // #region structural edits
    #assertMutable() {
        if (this.#src.readOnly)
            throw new Error("Can't modify data in readOnly mode!");
        if (this.strict)
            throw new Error('\x1b[33m[Strict mode]\x1b[0m: Can not resize data in strict mode. Use unrestrict() first.');
    }
    #shiftForward(offset, len, oldEnd) {
        const step = 65536;
        let readEnd = oldEnd;
        while (readEnd > offset) {
            const n = Math.min(step, readEnd - offset);
            const chunk = this.#src.read(readEnd - n, n).slice();
            this.#src.write(readEnd - n + len, chunk);
            readEnd -= n;
        }
    }
    #shiftBackward(start, removeLen, oldSize) {
        const step = 65536;
        let readPos = start + removeLen;
        let writePos = start;
        while (readPos < oldSize) {
            const n = Math.min(step, oldSize - readPos);
            const chunk = this.#src.read(readPos, n).slice();
            this.#src.write(writePos, chunk);
            readPos += n;
            writePos += n;
        }
    }
    insert(data, offset = this.offset, consume = true) {
        this.#assertMutable();
        if (offset < 0 || offset > this.#src.size)
            throw new RangeError('Insert offset out of bounds');
        if (data.length === 0)
            return;
        const oldSize = this.#src.size;
        this.#src.resize(oldSize + data.length);
        this.#shiftForward(offset, data.length, oldSize);
        this.#src.write(offset, data);
        if (consume)
            this.#cursor.set(offset + data.length);
    }
    place(data, offset = this.offset, consume = true) { this.insert(data, offset, consume); }
    unshift(data, consume = false) { this.insert(data, 0, consume); }
    prepend(data, consume = false) { this.insert(data, 0, consume); }
    push(data, consume = false) { this.insert(data, this.size, consume); }
    append(data, consume = false) { this.insert(data, this.size, consume); }
    delete(startOffset = 0, endOffset = this.offset, consume = false) {
        this.#assertMutable();
        startOffset = Math.abs(startOffset);
        if (startOffset < 0 || endOffset > this.#src.size)
            throw new RangeError('Remove range out of bounds');
        const removeLen = endOffset - startOffset;
        if (removeLen <= 0)
            return new Uint8Array(0);
        const removed = this.#src.read(startOffset, removeLen).slice();
        const oldSize = this.#src.size;
        this.#shiftBackward(startOffset, removeLen, oldSize);
        this.#src.resize(oldSize - removeLen);
        if (consume)
            this.#cursor.set(startOffset);
        return removed;
    }
    clip() { return this.delete(this.offset, this.size, false); }
    trim() { return this.delete(this.offset, this.size, false); }
    crop(length = 0, consume = false) { return this.delete(this.offset, this.offset + length, consume); }
    drop(length = 0, consume = false) { return this.delete(this.offset, this.offset + length, consume); }
    replace(data, offset = this.offset, consume = false) {
        if (this.#src.readOnly)
            throw new Error("Can't replace data in readOnly mode!");
        if (data.length === 0)
            return;
        this.#ensureWritable(offset + data.length);
        this.#src.write(offset, data);
        if (consume)
            this.#cursor.set(offset + data.length);
    }
    overwrite(data, offset = this.offset, consume = false) { this.replace(data, offset, consume); }
    fill(startOffset = this.offset, endOffset = this.size, consume = false, fillValue) {
        if (this.#src.readOnly && fillValue != undefined)
            throw new Error("Can't fill data in readOnly mode!");
        if (startOffset < 0 || endOffset > this.#src.size)
            throw new RangeError('Range out of bounds');
        const len = endOffset - startOffset;
        if (len <= 0)
            return new Uint8Array(0);
        const slice = this.#src.read(startOffset, len).slice();
        if (fillValue != undefined)
            this.#src.write(startOffset, new Uint8Array(len).fill(fillValue & 0xff));
        if (consume)
            this.#cursor.set(endOffset);
        return slice;
    }
    lift(startOffset = this.offset, endOffset = this.size, consume = false, fillValue) { return this.fill(startOffset, endOffset, consume, fillValue); }
    subarray(startOffset = this.offset, endOffset = this.size, consume = false) { return this.fill(startOffset, endOffset, consume); }
    extract(length = 0, consume = false) { return this.fill(this.offset, this.offset + length, consume); }
    slice(length = 0, consume = false) { return this.fill(this.offset, this.offset + length, consume); }
    wrap(length = 0, consume = false) { return this.fill(this.offset, this.offset + length, consume); }
    // #region strings
    readString(options = this.strDefaults, consume = true) {
        const length = options.length;
        const stringType = options.stringType ?? 'utf-8';
        const lengthReadSize = options.lengthReadSize ?? 1;
        const stripNull = options.stripNull ?? true;
        const endian = options.endian ?? this.endian;
        const encoding = options.encoding ?? 'utf-8';
        const terminate = (options.terminateValue != undefined) ? (options.terminateValue & 0xFF) : 0;
        let readLengthinBytes;
        if (length != undefined) {
            readLengthinBytes = stringType === 'utf-16' ? length * 2 : stringType === 'utf-32' ? length * 4 : length;
        }
        else {
            readLengthinBytes = this.#src.size - this.#cursor.byte;
        }
        this.#requireReadable(this.#cursor.byte, readLengthinBytes);
        const at = this.#cursor.byte;
        const bytes = this.#src.read(at, readLengthinBytes);
        const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        let pos = 0;
        const rU8 = () => bytes[pos++];
        const rU16 = (e) => { const v = readInt(dv, pos, 16, false, e === 'little'); pos += 2; return v; };
        const rU32 = (e) => { const v = readInt(dv, pos, 32, false, e === 'little') >>> 0; pos += 4; return v; };
        const str = _rstring(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, rU8, rU16, rU32);
        if (consume)
            this.#cursor.set(at + pos);
        return str;
    }
    writeString(str, options = this.strDefaults, consume = true) {
        const length = options.length;
        const stringType = options.stringType ?? 'utf-8';
        let terminateValue = options.terminateValue;
        const lengthWriteSize = options.lengthWriteSize ?? 1;
        const endian = options.endian ?? this.endian;
        let maxLengthValue = length ?? str.length;
        let strUnits = str.length;
        switch (stringType) {
            case 'pascal':
                maxLengthValue = length != undefined ? length : 255;
                break;
            case 'wide-pascal':
                strUnits *= 2;
                maxLengthValue = length != undefined ? length / 2 : 65535;
                break;
            case 'double-wide-pascal':
                strUnits *= 4;
                maxLengthValue = length != undefined ? length / 4 : 4294967295;
                break;
        }
        if (terminateValue == undefined) {
            if (stringType === 'ascii' || stringType === 'utf-8' || stringType === 'utf-16' || stringType === 'utf-32')
                terminateValue = 0;
            if (length != undefined)
                terminateValue = undefined;
        }
        const maxBytes = Math.min(strUnits, maxLengthValue);
        str = str.substring(0, maxBytes);
        let encodedString;
        switch (stringType) {
            case 'utf-16':
            case 'wide-pascal': {
                const u16 = new Uint16Array(str.length);
                for (let i = 0; i < str.length; i++)
                    u16[i] = str.charCodeAt(i);
                encodedString = new Uint8Array(u16.buffer);
                break;
            }
            case 'utf-32':
            case 'double-wide-pascal': {
                const u32 = new Uint32Array(str.length);
                for (let i = 0; i < str.length; i++)
                    u32[i] = str.codePointAt(i) ?? 0;
                encodedString = new Uint8Array(u32.buffer);
                break;
            }
            default: encodedString = new TextEncoder().encode(str);
        }
        const out = [];
        const wU8 = (n) => { out.push(n & 0xFF); };
        const wU16 = (n, e) => { const b = new Uint8Array(2); writeInt(new DataView(b.buffer), 0, n, 16, false, e === 'little'); out.push(b[0], b[1]); };
        const wU32 = (n, e) => { const b = new Uint8Array(4); writeInt(new DataView(b.buffer), 0, n, 32, false, e === 'little'); out.push(b[0], b[1], b[2], b[3]); };
        _wstring(encodedString, stringType, endian, terminateValue, lengthWriteSize, wU8, wU16, wU32);
        const buf = new Uint8Array(out);
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#ensureWritable(at + buf.length);
        this.#src.write(at, buf);
        if (consume)
            this.#cursor.set(at + buf.length);
    }
    // #region math
    #normalizeKey(key) {
        return typeof key === 'string' ? new TextEncoder().encode(key) : key;
    }
    #applyRange(startOffset, endOffset, apply, consume) {
        if (this.#src.readOnly)
            throw new Error("Can't write data in readOnly mode!");
        const end = Math.min(endOffset, this.#src.size);
        const len = end - startOffset;
        if (len <= 0)
            return;
        const bytes = new Uint8Array(this.#src.read(startOffset, len));
        apply(bytes);
        this.#src.write(startOffset, bytes);
        if (consume)
            this.#cursor.set(end);
    }
    #keyLen(key, length) {
        if (typeof key === 'number')
            return { k: key, len: length ?? 1 };
        const k = typeof key === 'string' ? new TextEncoder().encode(key) : key;
        return { k, len: length ?? k.length };
    }
    xor(key, start = this.offset, end = this.size, consume = false) { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _XOR(b, 0, b.length, k), consume); }
    or(key, start = this.offset, end = this.size, consume = false) { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _OR(b, 0, b.length, k), consume); }
    and(key, start = this.offset, end = this.size, consume = false) { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _AND(b, 0, b.length, k), consume); }
    add(key, start = this.offset, end = this.size, consume = false) { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _ADD(b, 0, b.length, k), consume); }
    not(start = this.offset, end = this.size, consume = false) { this.#applyRange(start, end, b => _NOT(b, 0, b.length), consume); }
    lShift(key, start = this.offset, end = this.size, consume = false) { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _LSHIFT(b, 0, b.length, k), consume); }
    rShift(key, start = this.offset, end = this.size, consume = false) { const k = this.#normalizeKey(key); this.#applyRange(start, end, b => _RSHIFT(b, 0, b.length, k), consume); }
    xorThis(key, length, consume = false) { const { k, len } = this.#keyLen(key, length); this.xor(k, this.offset, this.offset + len, consume); }
    orThis(key, length, consume = false) { const { k, len } = this.#keyLen(key, length); this.or(k, this.offset, this.offset + len, consume); }
    andThis(key, length, consume = false) { const { k, len } = this.#keyLen(key, length); this.and(k, this.offset, this.offset + len, consume); }
    addThis(key, length, consume = false) { const { k, len } = this.#keyLen(key, length); this.add(k, this.offset, this.offset + len, consume); }
    notThis(length = 1, consume = false) { this.not(this.offset, this.offset + length, consume); }
    lShiftThis(key, length, consume = false) { const { k, len } = this.#keyLen(key, length); this.lShift(k, this.offset, this.offset + len, consume); }
    rShiftThis(key, length, consume = false) { const { k, len } = this.#keyLen(key, length); this.rShift(k, this.offset, this.offset + len, consume); }
    // #region find
    findBytes(bytesToFind) {
        const needle = Array.isArray(bytesToFind) ? new Uint8Array(bytesToFind) : bytesToFind;
        const data = this.#src.read(0, this.#src.size);
        for (let i = this.#cursor.byte; i <= this.#src.size - needle.length; i++) {
            let match = true;
            for (let j = 0; j < needle.length; j++) {
                if (data[i + j] !== needle[j]) {
                    match = false;
                    break;
                }
            }
            if (match)
                return i;
        }
        return -1;
    }
    findString(str, bytesPerChar = 1) { return this.findBytes(textEncode(str, bytesPerChar)); }
    #findNumber(value, bits, unsigned, endian) {
        const data = this.#src.read(0, this.#src.size);
        for (let z = this.#cursor.byte; z <= this.#src.size - (bits / 8); z++) {
            const dv = new DataView(data.buffer, data.byteOffset + z, bits / 8);
            const v = bits <= 32 ? readInt(dv, 0, bits, !unsigned, endian === 'little') : Number(readBig(dv, 0, !unsigned, endian === 'little'));
            if (v === value)
                return z;
        }
        return -1;
    }
    findByte(value, unsigned = true, endian = this.endian) { return this.#findNumber(value, 8, unsigned, endian); }
    findShort(value, unsigned = true, endian = this.endian) { return this.#findNumber(value, 16, unsigned, endian); }
    findInt(value, unsigned = true, endian = this.endian) { return this.#findNumber(value, 32, unsigned, endian); }
    // #region endianness
    endianness(endian) { if (endian !== 'big' && endian !== 'little')
        throw new TypeError('Endian must be big or little'); this.endian = endian; }
    bigEndian() { this.endian = 'big'; }
    big() { this.endian = 'big'; }
    be() { this.endian = 'big'; }
    littleEndian() { this.endian = 'little'; }
    little() { this.endian = 'little'; }
    le() { this.endian = 'little'; }
    // #region read/write aliases
    readUByte(consume = true) { return this.readByte(true, consume); }
    readUInt16(endian = this.endian) { return this.readInt16(true, endian); }
    readUInt16LE() { return this.readInt16(true, 'little'); }
    readUInt16BE() { return this.readInt16(true, 'big'); }
    readInt16LE() { return this.readInt16(false, 'little'); }
    readInt16BE() { return this.readInt16(false, 'big'); }
    readInt(endian = this.endian) { return this.readInt32(false, endian); }
    readUInt(endian = this.endian) { return this.readInt32(true, endian); }
    readUInt32(endian = this.endian) { return this.readInt32(true, endian); }
    readInt32LE() { return this.readInt32(false, 'little'); }
    readInt32BE() { return this.readInt32(false, 'big'); }
    readUInt32LE() { return this.readInt32(true, 'little'); }
    readUInt32BE() { return this.readInt32(true, 'big'); }
    readFloat32(endian = this.endian, consume = true) { return this.readFloat(endian, consume); }
    readFloatLE() { return this.readFloat('little'); }
    readFloatBE() { return this.readFloat('big'); }
    readFloat32LE() { return this.readFloat('little'); }
    readFloat32BE() { return this.readFloat('big'); }
    readFloat16(endian = this.endian, consume = true) { return this.readHalfFloat(endian, consume); }
    readHalfFloatLE() { return this.readHalfFloat('little'); }
    readHalfFloatBE() { return this.readHalfFloat('big'); }
    readFloat16LE() { return this.readHalfFloat('little'); }
    readFloat16BE() { return this.readHalfFloat('big'); }
    readFloat64(endian = this.endian, consume = true) { return this.readDoubleFloat(endian, consume); }
    readDoubleFloatLE() { return this.readDoubleFloat('little'); }
    readDoubleFloatBE() { return this.readDoubleFloat('big'); }
    readFloat64LE() { return this.readDoubleFloat('little'); }
    readFloat64BE() { return this.readDoubleFloat('big'); }
    readUInt64() { return this.readInt64(true); }
    readInt64LE() { return this.readInt64(false, 'little'); }
    readInt64BE() { return this.readInt64(false, 'big'); }
    readUInt64LE() { return this.readInt64(true, 'little'); }
    readUInt64BE() { return this.readInt64(true, 'big'); }
    readUBitBE(bits) { return this.readBit(bits, true, 'big'); }
    readUBitLE(bits) { return this.readBit(bits, true, 'little'); }
    readBitBE(bits, unsigned) { return this.readBit(bits, unsigned, 'big'); }
    readBitLE(bits, unsigned) { return this.readBit(bits, unsigned, 'little'); }
    writeUByte(value, consume = true) { this.writeByte(value, true, consume); }
    writeUInt16(value, endian = this.endian) { this.writeInt16(value, true, endian); }
    writeUInt16LE(value) { this.writeInt16(value, true, 'little'); }
    writeUInt16BE(value) { this.writeInt16(value, true, 'big'); }
    writeInt16LE(value) { this.writeInt16(value, false, 'little'); }
    writeInt16BE(value) { this.writeInt16(value, false, 'big'); }
    writeInt(value, endian = this.endian) { this.writeInt32(value, false, endian); }
    writeUInt(value, endian = this.endian) { this.writeInt32(value, true, endian); }
    writeUInt32(value, endian = this.endian) { this.writeInt32(value, true, endian); }
    writeInt32LE(value) { this.writeInt32(value, false, 'little'); }
    writeInt32BE(value) { this.writeInt32(value, false, 'big'); }
    writeUInt32LE(value) { this.writeInt32(value, true, 'little'); }
    writeUInt32BE(value) { this.writeInt32(value, true, 'big'); }
    writeFloat32(value, endian = this.endian, consume = true) { this.writeFloat(value, endian, consume); }
    writeFloatLE(value) { this.writeFloat(value, 'little'); }
    writeFloatBE(value) { this.writeFloat(value, 'big'); }
    writeFloat32LE(value) { this.writeFloat(value, 'little'); }
    writeFloat32BE(value) { this.writeFloat(value, 'big'); }
    writeFloat16(value, endian = this.endian, consume = true) { this.writeHalfFloat(value, endian, consume); }
    writeHalfFloatLE(value) { this.writeHalfFloat(value, 'little'); }
    writeHalfFloatBE(value) { this.writeHalfFloat(value, 'big'); }
    writeFloat16LE(value) { this.writeHalfFloat(value, 'little'); }
    writeFloat16BE(value) { this.writeHalfFloat(value, 'big'); }
    writeFloat64(value, endian = this.endian, consume = true) { this.writeDoubleFloat(value, endian, consume); }
    writeDoubleFloatLE(value) { this.writeDoubleFloat(value, 'little'); }
    writeDoubleFloatBE(value) { this.writeDoubleFloat(value, 'big'); }
    writeFloat64LE(value) { this.writeDoubleFloat(value, 'little'); }
    writeFloat64BE(value) { this.writeDoubleFloat(value, 'big'); }
    writeUInt64(value, endian = this.endian) { this.writeInt64(value, true, endian); }
    writeInt64LE(value) { this.writeInt64(value, false, 'little'); }
    writeInt64BE(value) { this.writeInt64(value, false, 'big'); }
    writeUInt64LE(value) { this.writeInt64(value, true, 'little'); }
    writeUInt64BE(value) { this.writeInt64(value, true, 'big'); }
    writeUBitBE(value, bits) { this.writeBit(value, bits, true, 'big'); }
    writeUBitLE(value, bits) { this.writeBit(value, bits, true, 'little'); }
    writeBitBE(value, bits, unsigned) { this.writeBit(value, bits, unsigned, 'big'); }
    writeBitLE(value, bits, unsigned) { this.writeBit(value, bits, unsigned, 'little'); }
    // #region size / position alias getters + setters
    get bitSize() { return this.size * 8; }
    get length() { return this.size; }
    get len() { return this.size; }
    get fileSize() { return this.size; }
    get FileSize() { return this.size; }
    get lengthBits() { return this.size * 8; }
    get sizeBits() { return this.size * 8; }
    get fileBitSize() { return this.size * 8; }
    get fileSizeBits() { return this.size * 8; }
    get lenBits() { return this.size * 8; }
    get off() { return this.#cursor.byte; }
    get getOffset() { return this.#cursor.byte; }
    get tell() { return this.#cursor.byte; }
    get FTell() { return this.#cursor.byte; }
    get saveOffset() { return this.#cursor.byte; }
    get byteOffset() { return this.#cursor.byte; }
    set setOffset(value) { this.offset = value; }
    set setByteOffset(value) { this.offset = value; }
    get offsetBits() { return this.#cursor.bitPosition; }
    get getBitOffset() { return this.#cursor.bitPosition; }
    get saveBitOffset() { return this.#cursor.bitPosition; }
    get FTellBits() { return this.#cursor.bitPosition; }
    get tellBits() { return this.#cursor.bit; }
    get offBits() { return this.#cursor.bitPosition; }
    set setOffsetBits(value) { this.bitOffset = value; }
    set setBitOffset(value) { this.bitOffset = value; }
    get getInsetBit() { return this.#cursor.bit; }
    get saveInsetBit() { return this.#cursor.bit; }
    get inBit() { return this.#cursor.bit; }
    get bitTell() { return this.#cursor.bit; }
    set setInsetBit(value) { this.insetBit = value; }
    get remain() { return this.size - this.#cursor.byte; }
    get remainBytes() { return this.size - this.#cursor.byte; }
    get FEoF() { return this.size - this.#cursor.byte; }
    get remainBits() { return (this.size * 8) - this.#cursor.bitPosition; }
    get FEoFBits() { return (this.size * 8) - this.#cursor.bitPosition; }
    get getLine() { return Math.abs(Math.floor((this.#cursor.byte - 1) / 16)); }
    get row() { return this.getLine; }
    // #region move aliases
    jump(bytes, bits) { this.skip(bytes, bits ?? 0); }
    seek(bytes, bits) { this.skip(bytes, bits ?? 0); }
    FSeek(byte, bit) { this.goto(byte, bit ?? 0); }
    pointer(byte, bit) { this.goto(byte, bit ?? 0); }
    warp(byte, bit) { this.goto(byte, bit ?? 0); }
    gotoStart() { this.rewind(); }
    gotoEnd() { this.last(); }
    EoF() { this.last(); }
    // #region type checks / dump / strict
    isBufferOrUint8Array(obj) { return isBufferOrUint8Array(obj); }
    isBuffer(obj) { return typeof Buffer !== 'undefined' && Buffer.isBuffer(obj); }
    isUint8Array(obj) { return obj instanceof Uint8Array && !this.isBuffer(obj); }
    restrict() { this.strict = true; }
    unrestrict() { this.strict = false; }
    errorDumpOff() { this.errorDump = false; }
    errorDumpOn() { this.errorDump = true; }
    set strSettings(settings) { this.strDefaults = { ...this.strDefaults, ...settings }; }
    hexdump(options = {}) {
        const length = options.length ?? 192;
        const startByte = options.startByte ?? this.#cursor.byte;
        const endByte = Math.min(startByte + length, this.size);
        if (startByte > this.size || endByte > this.size)
            throw new RangeError('Hexdump amount is outside of data size');
        const data = this.#src.read(startByte, Math.min(endByte, this.size) - startByte);
        return _hexDump(data, options, startByte, endByte);
    }
    // #region data / lifecycle
    get data() {
        if (this.#source instanceof MemorySyncSource)
            return this.#source.data;
        if (this.#source instanceof FileSyncSource)
            return this.#source.data;
        return null;
    }
    get view() {
        const d = this.data;
        return d ? new DataView(d.buffer, d.byteOffset, d.byteLength) : null;
    }
    commit() { this.flush(); }
    flush() { if (this.#source)
        this.#source.flush(); }
    get() {
        const src = this.#src;
        src.flush();
        const full = src instanceof MemorySyncSource ? src.data : src instanceof FileSyncSource ? src.data : new Uint8Array(src.read(0, this.size));
        if (this.growthIncrement !== 0 && this.#wasExpanded)
            return full.subarray(0, this.#cursor.byte);
        return full;
    }
    getData() { return this.get(); }
    getFullBuffer() { return this.get(); }
    return() { return this.get(); }
    end() { return this.close(); }
    done() { return this.close(); }
    finished() { return this.close(); }
    close() {
        const src = this.#src;
        src.flush();
        if (src instanceof MemorySyncSource)
            return src.data;
        src.close();
        this.#source = null;
        this.#pendingPath = this.filePath;
    }
    writeMode(mode = true) {
        this.strict = !mode;
        this.readOnly = !mode;
        if (this.#pendingPath || (this.#source && !(this.#source instanceof MemorySyncSource)))
            this.close();
    }
    renameFile(newFilePath) {
        if (this.isMemoryMode)
            return;
        this.close();
        if (!_a$1.fs)
            throw new Error("Can't rename file outside of Node.");
        _a$1.fs.renameSync(this.filePath, newFilePath);
        this.filePath = newFilePath;
        this.#pendingPath = newFilePath;
        this.open();
    }
    deleteFile() {
        if (this.isMemoryMode)
            return;
        if (this.readOnly)
            throw new Error("Can't delete file in readOnly mode!");
        this.close();
        if (!_a$1.fs)
            throw new Error("Can't delete file outside of Node.");
        _a$1.fs.unlinkSync(this.filePath);
        this.filePath = null;
        this.#pendingPath = null;
    }
}
_a$1 = BiSyncEngine;

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
class BiReader extends BiSyncEngine {
    constructor(input, options = {}) {
        if (input == undefined) {
            throw new Error("Can not start BiReader without data.");
        }
        // Merge over defaults into a fresh object; never mutate the caller's options.
        super(input, {
            byteOffset: options.byteOffset ?? 0,
            bitOffset: options.bitOffset ?? 0,
            endianness: options.endianness ?? "little",
            strict: options.strict ?? true,
            growthIncrement: options.growthIncrement ?? 0x100000,
            enforceBigInt: options.enforceBigInt ?? false,
            readOnly: options.readOnly ?? true,
        });
    }
    ;
    //
    // #region Bit Aliases
    //
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
    bit(bits, unsigned, endian) {
        return this.readBit(bits, unsigned, endian);
    }
    ;
    /**
     * Bit field reader. Unsigned read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    ubit(bits, endian) {
        return this.readBit(bits, true, endian);
    }
    ;
    /**
     * Bit field reader. Unsigned big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitbe(bits) {
        return this.bit(bits, true, "big");
    }
    ;
    /**
     * Bit field reader. Big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitbe(bits, unsigned) {
        return this.bit(bits, unsigned, "big");
    }
    ;
    /**
     * Bit field reader. Unsigned little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    ubitle(bits) {
        return this.bit(bits, true, "little");
    }
    ;
    /**
     * Bit field reader. Little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    bitle(bits, unsigned) {
        return this.bit(bits, unsigned, "little");
    }
    ;
    //
    // #region Generated mechanical aliases
    //
    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====
    // Behaviour is verified by test/aliases.parity.test.ts.
    /** Read a signed 8-bit integer. */
    get byte() { return this.readByte(); }
    /** Read a signed 8-bit integer. */
    get int8() { return this.readByte(); }
    /** Read an unsigned 8-bit integer. */
    get uint8() { return this.readByte(true); }
    /** Read an unsigned 8-bit integer. */
    get ubyte() { return this.readByte(true); }
    /** Read a signed 16-bit integer. */
    get int16() { return this.readInt16(); }
    /** Read a signed 16-bit integer. */
    get short() { return this.readInt16(); }
    /** Read a signed 16-bit integer. */
    get word() { return this.readInt16(); }
    /** Read an unsigned 16-bit integer. */
    get uint16() { return this.readInt16(true); }
    /** Read an unsigned 16-bit integer. */
    get ushort() { return this.readInt16(true); }
    /** Read an unsigned 16-bit integer. */
    get uword() { return this.readInt16(true); }
    /** Read a signed 16-bit integer (little-endian). */
    get int16le() { return this.readInt16(false, "little"); }
    /** Read a signed 16-bit integer (little-endian). */
    get shortle() { return this.readInt16(false, "little"); }
    /** Read a signed 16-bit integer (little-endian). */
    get wordle() { return this.readInt16(false, "little"); }
    /** Read an unsigned 16-bit integer (little-endian). */
    get uint16le() { return this.readInt16(true, "little"); }
    /** Read an unsigned 16-bit integer (little-endian). */
    get ushortle() { return this.readInt16(true, "little"); }
    /** Read an unsigned 16-bit integer (little-endian). */
    get uwordle() { return this.readInt16(true, "little"); }
    /** Read a signed 16-bit integer (big-endian). */
    get int16be() { return this.readInt16(false, "big"); }
    /** Read a signed 16-bit integer (big-endian). */
    get shortbe() { return this.readInt16(false, "big"); }
    /** Read a signed 16-bit integer (big-endian). */
    get wordbe() { return this.readInt16(false, "big"); }
    /** Read an unsigned 16-bit integer (big-endian). */
    get uint16be() { return this.readInt16(true, "big"); }
    /** Read an unsigned 16-bit integer (big-endian). */
    get ushortbe() { return this.readInt16(true, "big"); }
    /** Read an unsigned 16-bit integer (big-endian). */
    get uwordbe() { return this.readInt16(true, "big"); }
    /** Read a signed 32-bit integer. */
    get int() { return this.readInt32(); }
    /** Read a signed 32-bit integer. */
    get dword() { return this.readInt32(); }
    /** Read a signed 32-bit integer. */
    get int32() { return this.readInt32(); }
    /** Read a signed 32-bit integer. */
    get long() { return this.readInt32(); }
    /** Read an unsigned 32-bit integer. */
    get uint() { return this.readInt32(true); }
    /** Read an unsigned 32-bit integer. */
    get udword() { return this.readInt32(true); }
    /** Read an unsigned 32-bit integer. */
    get uint32() { return this.readInt32(true); }
    /** Read an unsigned 32-bit integer. */
    get ulong() { return this.readInt32(true); }
    /** Read a signed 32-bit integer (little-endian). */
    get intle() { return this.readInt32(false, "little"); }
    /** Read a signed 32-bit integer (little-endian). */
    get dwordle() { return this.readInt32(false, "little"); }
    /** Read a signed 32-bit integer (little-endian). */
    get int32le() { return this.readInt32(false, "little"); }
    /** Read a signed 32-bit integer (little-endian). */
    get longle() { return this.readInt32(false, "little"); }
    /** Read an unsigned 32-bit integer (little-endian). */
    get uintle() { return this.readInt32(true, "little"); }
    /** Read an unsigned 32-bit integer (little-endian). */
    get udwordle() { return this.readInt32(true, "little"); }
    /** Read an unsigned 32-bit integer (little-endian). */
    get uint32le() { return this.readInt32(true, "little"); }
    /** Read an unsigned 32-bit integer (little-endian). */
    get ulongle() { return this.readInt32(true, "little"); }
    /** Read a signed 32-bit integer (big-endian). */
    get intbe() { return this.readInt32(false, "big"); }
    /** Read a signed 32-bit integer (big-endian). */
    get dwordbe() { return this.readInt32(false, "big"); }
    /** Read a signed 32-bit integer (big-endian). */
    get int32be() { return this.readInt32(false, "big"); }
    /** Read a signed 32-bit integer (big-endian). */
    get longbe() { return this.readInt32(false, "big"); }
    /** Read an unsigned 32-bit integer (big-endian). */
    get uintbe() { return this.readInt32(true, "big"); }
    /** Read an unsigned 32-bit integer (big-endian). */
    get udwordbe() { return this.readInt32(true, "big"); }
    /** Read an unsigned 32-bit integer (big-endian). */
    get uint32be() { return this.readInt32(true, "big"); }
    /** Read an unsigned 32-bit integer (big-endian). */
    get ulongbe() { return this.readInt32(true, "big"); }
    /** Read a signed 64-bit integer. */
    get int64() { return this.readInt64(); }
    /** Read a signed 64-bit integer. */
    get bigint() { return this.readInt64(); }
    /** Read a signed 64-bit integer. */
    get quad() { return this.readInt64(); }
    /** Read an unsigned 64-bit integer. */
    get uint64() { return this.readInt64(true); }
    /** Read an unsigned 64-bit integer. */
    get ubigint() { return this.readInt64(true); }
    /** Read an unsigned 64-bit integer. */
    get uquad() { return this.readInt64(true); }
    /** Read a signed 64-bit integer (little-endian). */
    get int64le() { return this.readInt64(false, "little"); }
    /** Read a signed 64-bit integer (little-endian). */
    get bigintle() { return this.readInt64(false, "little"); }
    /** Read a signed 64-bit integer (little-endian). */
    get quadle() { return this.readInt64(false, "little"); }
    /** Read an unsigned 64-bit integer (little-endian). */
    get uint64le() { return this.readInt64(true, "little"); }
    /** Read an unsigned 64-bit integer (little-endian). */
    get ubigintle() { return this.readInt64(true, "little"); }
    /** Read an unsigned 64-bit integer (little-endian). */
    get uquadle() { return this.readInt64(true, "little"); }
    /** Read a signed 64-bit integer (big-endian). */
    get int64be() { return this.readInt64(false, "big"); }
    /** Read a signed 64-bit integer (big-endian). */
    get bigintbe() { return this.readInt64(false, "big"); }
    /** Read a signed 64-bit integer (big-endian). */
    get quadbe() { return this.readInt64(false, "big"); }
    /** Read an unsigned 64-bit integer (big-endian). */
    get uint64be() { return this.readInt64(true, "big"); }
    /** Read an unsigned 64-bit integer (big-endian). */
    get ubigintbe() { return this.readInt64(true, "big"); }
    /** Read an unsigned 64-bit integer (big-endian). */
    get uquadbe() { return this.readInt64(true, "big"); }
    /** Read a 32-bit float. */
    get float() { return this.readFloat(); }
    /** Read a 32-bit float (little-endian). */
    get floatle() { return this.readFloat("little"); }
    /** Read a 32-bit float (big-endian). */
    get floatbe() { return this.readFloat("big"); }
    /** Read a 16-bit float. */
    get halffloat() { return this.readHalfFloat(); }
    /** Read a 16-bit float. */
    get half() { return this.readHalfFloat(); }
    /** Read a 16-bit float (little-endian). */
    get halffloatle() { return this.readHalfFloat("little"); }
    /** Read a 16-bit float (little-endian). */
    get halfle() { return this.readHalfFloat("little"); }
    /** Read a 16-bit float (big-endian). */
    get halffloatbe() { return this.readHalfFloat("big"); }
    /** Read a 16-bit float (big-endian). */
    get halfbe() { return this.readHalfFloat("big"); }
    /** Read a 64-bit float. */
    get doublefloat() { return this.readDoubleFloat(); }
    /** Read a 64-bit float. */
    get dfloat() { return this.readDoubleFloat(); }
    /** Read a 64-bit float (little-endian). */
    get doublefloatle() { return this.readDoubleFloat("little"); }
    /** Read a 64-bit float (little-endian). */
    get dfloatle() { return this.readDoubleFloat("little"); }
    /** Read a 64-bit float (big-endian). */
    get doublefloatbe() { return this.readDoubleFloat("big"); }
    /** Read a 64-bit float (big-endian). */
    get dfloatbe() { return this.readDoubleFloat("big"); }
    /** Read 1 signed bit. */
    get bit1() { return this.bit(1); }
    /** Read 1 unsigned bit. */
    get ubit1() { return this.bit(1, true); }
    /** Read 1 signed bit (little-endian). */
    get bit1le() { return this.bit(1, undefined, "little"); }
    /** Read 1 unsigned bit (little-endian). */
    get ubit1le() { return this.bit(1, true, "little"); }
    /** Read 1 signed bit (big-endian). */
    get bit1be() { return this.bit(1, undefined, "big"); }
    /** Read 1 unsigned bit (big-endian). */
    get ubit1be() { return this.bit(1, true, "big"); }
    /** Read 2 signed bits. */
    get bit2() { return this.bit(2); }
    /** Read 2 unsigned bits. */
    get ubit2() { return this.bit(2, true); }
    /** Read 2 signed bits (little-endian). */
    get bit2le() { return this.bit(2, undefined, "little"); }
    /** Read 2 unsigned bits (little-endian). */
    get ubit2le() { return this.bit(2, true, "little"); }
    /** Read 2 signed bits (big-endian). */
    get bit2be() { return this.bit(2, undefined, "big"); }
    /** Read 2 unsigned bits (big-endian). */
    get ubit2be() { return this.bit(2, true, "big"); }
    /** Read 3 signed bits. */
    get bit3() { return this.bit(3); }
    /** Read 3 unsigned bits. */
    get ubit3() { return this.bit(3, true); }
    /** Read 3 signed bits (little-endian). */
    get bit3le() { return this.bit(3, undefined, "little"); }
    /** Read 3 unsigned bits (little-endian). */
    get ubit3le() { return this.bit(3, true, "little"); }
    /** Read 3 signed bits (big-endian). */
    get bit3be() { return this.bit(3, undefined, "big"); }
    /** Read 3 unsigned bits (big-endian). */
    get ubit3be() { return this.bit(3, true, "big"); }
    /** Read 4 signed bits. */
    get bit4() { return this.bit(4); }
    /** Read 4 unsigned bits. */
    get ubit4() { return this.bit(4, true); }
    /** Read 4 signed bits (little-endian). */
    get bit4le() { return this.bit(4, undefined, "little"); }
    /** Read 4 unsigned bits (little-endian). */
    get ubit4le() { return this.bit(4, true, "little"); }
    /** Read 4 signed bits (big-endian). */
    get bit4be() { return this.bit(4, undefined, "big"); }
    /** Read 4 unsigned bits (big-endian). */
    get ubit4be() { return this.bit(4, true, "big"); }
    /** Read 5 signed bits. */
    get bit5() { return this.bit(5); }
    /** Read 5 unsigned bits. */
    get ubit5() { return this.bit(5, true); }
    /** Read 5 signed bits (little-endian). */
    get bit5le() { return this.bit(5, undefined, "little"); }
    /** Read 5 unsigned bits (little-endian). */
    get ubit5le() { return this.bit(5, true, "little"); }
    /** Read 5 signed bits (big-endian). */
    get bit5be() { return this.bit(5, undefined, "big"); }
    /** Read 5 unsigned bits (big-endian). */
    get ubit5be() { return this.bit(5, true, "big"); }
    /** Read 6 signed bits. */
    get bit6() { return this.bit(6); }
    /** Read 6 unsigned bits. */
    get ubit6() { return this.bit(6, true); }
    /** Read 6 signed bits (little-endian). */
    get bit6le() { return this.bit(6, undefined, "little"); }
    /** Read 6 unsigned bits (little-endian). */
    get ubit6le() { return this.bit(6, true, "little"); }
    /** Read 6 signed bits (big-endian). */
    get bit6be() { return this.bit(6, undefined, "big"); }
    /** Read 6 unsigned bits (big-endian). */
    get ubit6be() { return this.bit(6, true, "big"); }
    /** Read 7 signed bits. */
    get bit7() { return this.bit(7); }
    /** Read 7 unsigned bits. */
    get ubit7() { return this.bit(7, true); }
    /** Read 7 signed bits (little-endian). */
    get bit7le() { return this.bit(7, undefined, "little"); }
    /** Read 7 unsigned bits (little-endian). */
    get ubit7le() { return this.bit(7, true, "little"); }
    /** Read 7 signed bits (big-endian). */
    get bit7be() { return this.bit(7, undefined, "big"); }
    /** Read 7 unsigned bits (big-endian). */
    get ubit7be() { return this.bit(7, true, "big"); }
    /** Read 8 signed bits. */
    get bit8() { return this.bit(8); }
    /** Read 8 unsigned bits. */
    get ubit8() { return this.bit(8, true); }
    /** Read 8 signed bits (little-endian). */
    get bit8le() { return this.bit(8, undefined, "little"); }
    /** Read 8 unsigned bits (little-endian). */
    get ubit8le() { return this.bit(8, true, "little"); }
    /** Read 8 signed bits (big-endian). */
    get bit8be() { return this.bit(8, undefined, "big"); }
    /** Read 8 unsigned bits (big-endian). */
    get ubit8be() { return this.bit(8, true, "big"); }
    /** Read 9 signed bits. */
    get bit9() { return this.bit(9); }
    /** Read 9 unsigned bits. */
    get ubit9() { return this.bit(9, true); }
    /** Read 9 signed bits (little-endian). */
    get bit9le() { return this.bit(9, undefined, "little"); }
    /** Read 9 unsigned bits (little-endian). */
    get ubit9le() { return this.bit(9, true, "little"); }
    /** Read 9 signed bits (big-endian). */
    get bit9be() { return this.bit(9, undefined, "big"); }
    /** Read 9 unsigned bits (big-endian). */
    get ubit9be() { return this.bit(9, true, "big"); }
    /** Read 10 signed bits. */
    get bit10() { return this.bit(10); }
    /** Read 10 unsigned bits. */
    get ubit10() { return this.bit(10, true); }
    /** Read 10 signed bits (little-endian). */
    get bit10le() { return this.bit(10, undefined, "little"); }
    /** Read 10 unsigned bits (little-endian). */
    get ubit10le() { return this.bit(10, true, "little"); }
    /** Read 10 signed bits (big-endian). */
    get bit10be() { return this.bit(10, undefined, "big"); }
    /** Read 10 unsigned bits (big-endian). */
    get ubit10be() { return this.bit(10, true, "big"); }
    /** Read 11 signed bits. */
    get bit11() { return this.bit(11); }
    /** Read 11 unsigned bits. */
    get ubit11() { return this.bit(11, true); }
    /** Read 11 signed bits (little-endian). */
    get bit11le() { return this.bit(11, undefined, "little"); }
    /** Read 11 unsigned bits (little-endian). */
    get ubit11le() { return this.bit(11, true, "little"); }
    /** Read 11 signed bits (big-endian). */
    get bit11be() { return this.bit(11, undefined, "big"); }
    /** Read 11 unsigned bits (big-endian). */
    get ubit11be() { return this.bit(11, true, "big"); }
    /** Read 12 signed bits. */
    get bit12() { return this.bit(12); }
    /** Read 12 unsigned bits. */
    get ubit12() { return this.bit(12, true); }
    /** Read 12 signed bits (little-endian). */
    get bit12le() { return this.bit(12, undefined, "little"); }
    /** Read 12 unsigned bits (little-endian). */
    get ubit12le() { return this.bit(12, true, "little"); }
    /** Read 12 signed bits (big-endian). */
    get bit12be() { return this.bit(12, undefined, "big"); }
    /** Read 12 unsigned bits (big-endian). */
    get ubit12be() { return this.bit(12, true, "big"); }
    /** Read 13 signed bits. */
    get bit13() { return this.bit(13); }
    /** Read 13 unsigned bits. */
    get ubit13() { return this.bit(13, true); }
    /** Read 13 signed bits (little-endian). */
    get bit13le() { return this.bit(13, undefined, "little"); }
    /** Read 13 unsigned bits (little-endian). */
    get ubit13le() { return this.bit(13, true, "little"); }
    /** Read 13 signed bits (big-endian). */
    get bit13be() { return this.bit(13, undefined, "big"); }
    /** Read 13 unsigned bits (big-endian). */
    get ubit13be() { return this.bit(13, true, "big"); }
    /** Read 14 signed bits. */
    get bit14() { return this.bit(14); }
    /** Read 14 unsigned bits. */
    get ubit14() { return this.bit(14, true); }
    /** Read 14 signed bits (little-endian). */
    get bit14le() { return this.bit(14, undefined, "little"); }
    /** Read 14 unsigned bits (little-endian). */
    get ubit14le() { return this.bit(14, true, "little"); }
    /** Read 14 signed bits (big-endian). */
    get bit14be() { return this.bit(14, undefined, "big"); }
    /** Read 14 unsigned bits (big-endian). */
    get ubit14be() { return this.bit(14, true, "big"); }
    /** Read 15 signed bits. */
    get bit15() { return this.bit(15); }
    /** Read 15 unsigned bits. */
    get ubit15() { return this.bit(15, true); }
    /** Read 15 signed bits (little-endian). */
    get bit15le() { return this.bit(15, undefined, "little"); }
    /** Read 15 unsigned bits (little-endian). */
    get ubit15le() { return this.bit(15, true, "little"); }
    /** Read 15 signed bits (big-endian). */
    get bit15be() { return this.bit(15, undefined, "big"); }
    /** Read 15 unsigned bits (big-endian). */
    get ubit15be() { return this.bit(15, true, "big"); }
    /** Read 16 signed bits. */
    get bit16() { return this.bit(16); }
    /** Read 16 unsigned bits. */
    get ubit16() { return this.bit(16, true); }
    /** Read 16 signed bits (little-endian). */
    get bit16le() { return this.bit(16, undefined, "little"); }
    /** Read 16 unsigned bits (little-endian). */
    get ubit16le() { return this.bit(16, true, "little"); }
    /** Read 16 signed bits (big-endian). */
    get bit16be() { return this.bit(16, undefined, "big"); }
    /** Read 16 unsigned bits (big-endian). */
    get ubit16be() { return this.bit(16, true, "big"); }
    /** Read 17 signed bits. */
    get bit17() { return this.bit(17); }
    /** Read 17 unsigned bits. */
    get ubit17() { return this.bit(17, true); }
    /** Read 17 signed bits (little-endian). */
    get bit17le() { return this.bit(17, undefined, "little"); }
    /** Read 17 unsigned bits (little-endian). */
    get ubit17le() { return this.bit(17, true, "little"); }
    /** Read 17 signed bits (big-endian). */
    get bit17be() { return this.bit(17, undefined, "big"); }
    /** Read 17 unsigned bits (big-endian). */
    get ubit17be() { return this.bit(17, true, "big"); }
    /** Read 18 signed bits. */
    get bit18() { return this.bit(18); }
    /** Read 18 unsigned bits. */
    get ubit18() { return this.bit(18, true); }
    /** Read 18 signed bits (little-endian). */
    get bit18le() { return this.bit(18, undefined, "little"); }
    /** Read 18 unsigned bits (little-endian). */
    get ubit18le() { return this.bit(18, true, "little"); }
    /** Read 18 signed bits (big-endian). */
    get bit18be() { return this.bit(18, undefined, "big"); }
    /** Read 18 unsigned bits (big-endian). */
    get ubit18be() { return this.bit(18, true, "big"); }
    /** Read 19 signed bits. */
    get bit19() { return this.bit(19); }
    /** Read 19 unsigned bits. */
    get ubit19() { return this.bit(19, true); }
    /** Read 19 signed bits (little-endian). */
    get bit19le() { return this.bit(19, undefined, "little"); }
    /** Read 19 unsigned bits (little-endian). */
    get ubit19le() { return this.bit(19, true, "little"); }
    /** Read 19 signed bits (big-endian). */
    get bit19be() { return this.bit(19, undefined, "big"); }
    /** Read 19 unsigned bits (big-endian). */
    get ubit19be() { return this.bit(19, true, "big"); }
    /** Read 20 signed bits. */
    get bit20() { return this.bit(20); }
    /** Read 20 unsigned bits. */
    get ubit20() { return this.bit(20, true); }
    /** Read 20 signed bits (little-endian). */
    get bit20le() { return this.bit(20, undefined, "little"); }
    /** Read 20 unsigned bits (little-endian). */
    get ubit20le() { return this.bit(20, true, "little"); }
    /** Read 20 signed bits (big-endian). */
    get bit20be() { return this.bit(20, undefined, "big"); }
    /** Read 20 unsigned bits (big-endian). */
    get ubit20be() { return this.bit(20, true, "big"); }
    /** Read 21 signed bits. */
    get bit21() { return this.bit(21); }
    /** Read 21 unsigned bits. */
    get ubit21() { return this.bit(21, true); }
    /** Read 21 signed bits (little-endian). */
    get bit21le() { return this.bit(21, undefined, "little"); }
    /** Read 21 unsigned bits (little-endian). */
    get ubit21le() { return this.bit(21, true, "little"); }
    /** Read 21 signed bits (big-endian). */
    get bit21be() { return this.bit(21, undefined, "big"); }
    /** Read 21 unsigned bits (big-endian). */
    get ubit21be() { return this.bit(21, true, "big"); }
    /** Read 22 signed bits. */
    get bit22() { return this.bit(22); }
    /** Read 22 unsigned bits. */
    get ubit22() { return this.bit(22, true); }
    /** Read 22 signed bits (little-endian). */
    get bit22le() { return this.bit(22, undefined, "little"); }
    /** Read 22 unsigned bits (little-endian). */
    get ubit22le() { return this.bit(22, true, "little"); }
    /** Read 22 signed bits (big-endian). */
    get bit22be() { return this.bit(22, undefined, "big"); }
    /** Read 22 unsigned bits (big-endian). */
    get ubit22be() { return this.bit(22, true, "big"); }
    /** Read 23 signed bits. */
    get bit23() { return this.bit(23); }
    /** Read 23 unsigned bits. */
    get ubit23() { return this.bit(23, true); }
    /** Read 23 signed bits (little-endian). */
    get bit23le() { return this.bit(23, undefined, "little"); }
    /** Read 23 unsigned bits (little-endian). */
    get ubit23le() { return this.bit(23, true, "little"); }
    /** Read 23 signed bits (big-endian). */
    get bit23be() { return this.bit(23, undefined, "big"); }
    /** Read 23 unsigned bits (big-endian). */
    get ubit23be() { return this.bit(23, true, "big"); }
    /** Read 24 signed bits. */
    get bit24() { return this.bit(24); }
    /** Read 24 unsigned bits. */
    get ubit24() { return this.bit(24, true); }
    /** Read 24 signed bits (little-endian). */
    get bit24le() { return this.bit(24, undefined, "little"); }
    /** Read 24 unsigned bits (little-endian). */
    get ubit24le() { return this.bit(24, true, "little"); }
    /** Read 24 signed bits (big-endian). */
    get bit24be() { return this.bit(24, undefined, "big"); }
    /** Read 24 unsigned bits (big-endian). */
    get ubit24be() { return this.bit(24, true, "big"); }
    /** Read 25 signed bits. */
    get bit25() { return this.bit(25); }
    /** Read 25 unsigned bits. */
    get ubit25() { return this.bit(25, true); }
    /** Read 25 signed bits (little-endian). */
    get bit25le() { return this.bit(25, undefined, "little"); }
    /** Read 25 unsigned bits (little-endian). */
    get ubit25le() { return this.bit(25, true, "little"); }
    /** Read 25 signed bits (big-endian). */
    get bit25be() { return this.bit(25, undefined, "big"); }
    /** Read 25 unsigned bits (big-endian). */
    get ubit25be() { return this.bit(25, true, "big"); }
    /** Read 26 signed bits. */
    get bit26() { return this.bit(26); }
    /** Read 26 unsigned bits. */
    get ubit26() { return this.bit(26, true); }
    /** Read 26 signed bits (little-endian). */
    get bit26le() { return this.bit(26, undefined, "little"); }
    /** Read 26 unsigned bits (little-endian). */
    get ubit26le() { return this.bit(26, true, "little"); }
    /** Read 26 signed bits (big-endian). */
    get bit26be() { return this.bit(26, undefined, "big"); }
    /** Read 26 unsigned bits (big-endian). */
    get ubit26be() { return this.bit(26, true, "big"); }
    /** Read 27 signed bits. */
    get bit27() { return this.bit(27); }
    /** Read 27 unsigned bits. */
    get ubit27() { return this.bit(27, true); }
    /** Read 27 signed bits (little-endian). */
    get bit27le() { return this.bit(27, undefined, "little"); }
    /** Read 27 unsigned bits (little-endian). */
    get ubit27le() { return this.bit(27, true, "little"); }
    /** Read 27 signed bits (big-endian). */
    get bit27be() { return this.bit(27, undefined, "big"); }
    /** Read 27 unsigned bits (big-endian). */
    get ubit27be() { return this.bit(27, true, "big"); }
    /** Read 28 signed bits. */
    get bit28() { return this.bit(28); }
    /** Read 28 unsigned bits. */
    get ubit28() { return this.bit(28, true); }
    /** Read 28 signed bits (little-endian). */
    get bit28le() { return this.bit(28, undefined, "little"); }
    /** Read 28 unsigned bits (little-endian). */
    get ubit28le() { return this.bit(28, true, "little"); }
    /** Read 28 signed bits (big-endian). */
    get bit28be() { return this.bit(28, undefined, "big"); }
    /** Read 28 unsigned bits (big-endian). */
    get ubit28be() { return this.bit(28, true, "big"); }
    /** Read 29 signed bits. */
    get bit29() { return this.bit(29); }
    /** Read 29 unsigned bits. */
    get ubit29() { return this.bit(29, true); }
    /** Read 29 signed bits (little-endian). */
    get bit29le() { return this.bit(29, undefined, "little"); }
    /** Read 29 unsigned bits (little-endian). */
    get ubit29le() { return this.bit(29, true, "little"); }
    /** Read 29 signed bits (big-endian). */
    get bit29be() { return this.bit(29, undefined, "big"); }
    /** Read 29 unsigned bits (big-endian). */
    get ubit29be() { return this.bit(29, true, "big"); }
    /** Read 30 signed bits. */
    get bit30() { return this.bit(30); }
    /** Read 30 unsigned bits. */
    get ubit30() { return this.bit(30, true); }
    /** Read 30 signed bits (little-endian). */
    get bit30le() { return this.bit(30, undefined, "little"); }
    /** Read 30 unsigned bits (little-endian). */
    get ubit30le() { return this.bit(30, true, "little"); }
    /** Read 30 signed bits (big-endian). */
    get bit30be() { return this.bit(30, undefined, "big"); }
    /** Read 30 unsigned bits (big-endian). */
    get ubit30be() { return this.bit(30, true, "big"); }
    /** Read 31 signed bits. */
    get bit31() { return this.bit(31); }
    /** Read 31 unsigned bits. */
    get ubit31() { return this.bit(31, true); }
    /** Read 31 signed bits (little-endian). */
    get bit31le() { return this.bit(31, undefined, "little"); }
    /** Read 31 unsigned bits (little-endian). */
    get ubit31le() { return this.bit(31, true, "little"); }
    /** Read 31 signed bits (big-endian). */
    get bit31be() { return this.bit(31, undefined, "big"); }
    /** Read 31 unsigned bits (big-endian). */
    get ubit31be() { return this.bit(31, true, "big"); }
    /** Read 32 signed bits. */
    get bit32() { return this.bit(32); }
    /** Read 32 unsigned bits. */
    get ubit32() { return this.bit(32, true); }
    /** Read 32 signed bits (little-endian). */
    get bit32le() { return this.bit(32, undefined, "little"); }
    /** Read 32 unsigned bits (little-endian). */
    get ubit32le() { return this.bit(32, true, "little"); }
    /** Read 32 signed bits (big-endian). */
    get bit32be() { return this.bit(32, undefined, "big"); }
    /** Read 32 unsigned bits (big-endian). */
    get ubit32be() { return this.bit(32, true, "big"); }
    // #endregion Generated mechanical aliases
    //
    // #region string reader
    //
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
    string(options = this.strDefaults) {
        return this.readString(options);
    }
    ;
    /**
    * Reads string using setting from .strDefaults
    *
    * Default is ``utf-8``
    *
    * @returns {string}
    */
    get str() {
        return this.readString(this.strDefaults);
    }
    ;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf8string(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    ;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    cstring(length, terminateValue, stripNull) {
        return this.utf8string(length, terminateValue, stripNull);
    }
    ;
    /**
    * Reads ANSI string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    ansistring(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    ;
    /**
    * Reads latin1 string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    latin1string(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "iso-8859-1", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    ;
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
    utf16string(length, terminateValue, stripNull, endian) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    }
    ;
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
    unistring(length, terminateValue, stripNull, endian) {
        return this.utf16string(length, terminateValue, stripNull, endian);
    }
    ;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf16stringle(length, terminateValue, stripNull) {
        return this.utf16string(length, terminateValue, stripNull, "little");
    }
    ;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    unistringle(length, terminateValue, stripNull) {
        return this.utf16stringle(length, terminateValue, stripNull);
    }
    ;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf16stringbe(length, terminateValue, stripNull) {
        return this.utf16string(length, terminateValue, stripNull, "big");
    }
    ;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    unistringbe(length, terminateValue, stripNull) {
        return this.utf16stringbe(length, terminateValue, stripNull);
    }
    ;
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
    utf32string(length, terminateValue, stripNull, endian) {
        return this.string({ stringType: "utf-32", encoding: "utf-32", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    }
    ;
    /**
    * Reads UTF-32 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf32stringle(length, terminateValue, stripNull) {
        return this.utf32string(length, terminateValue, stripNull, "little");
    }
    ;
    /**
    * Reads UTF-32 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    utf32stringbe(length, terminateValue, stripNull) {
        return this.utf32string(length, terminateValue, stripNull, "big");
    }
    ;
    /**
    * Reads Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    pstring(lengthReadSize, stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    }
    ;
    /**
    * Reads Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstringle(lengthReadSize, stripNull) {
        return this.pstring(lengthReadSize, stripNull, "little");
    }
    ;
    /**
    * Reads Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstringbe(lengthReadSize, stripNull) {
        return this.pstring(lengthReadSize, stripNull, "big");
    }
    ;
    /**
    * Reads Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    pstring1(stripNull, endian) {
        return this.pstring(1, stripNull, endian);
    }
    ;
    /**
    * Reads Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring1le(stripNull) {
        return this.pstring1(stripNull, "little");
    }
    ;
    /**
    * Reads Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring1be(stripNull) {
        return this.pstring1(stripNull, "big");
    }
    ;
    /**
    * Reads Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    pstring2(stripNull, endian) {
        return this.pstring(2, stripNull, endian);
    }
    ;
    /**
    * Reads Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring2le(stripNull) {
        return this.pstring2(stripNull, "little");
    }
    ;
    /**
    * Reads Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring2be(stripNull) {
        return this.pstring2(stripNull, "big");
    }
    ;
    /**
    * Reads Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    pstring4(stripNull, endian) {
        return this.pstring(4, stripNull, endian);
    }
    ;
    /**
    * Reads Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring4le(stripNull) {
        return this.pstring4(stripNull, "little");
    }
    ;
    /**
    * Reads Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    pstring4be(stripNull) {
        return this.pstring4(stripNull, "big");
    }
    ;
    /**
    * Reads Wide Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring(lengthReadSize, stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide Pascal string 1 byte length read in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstringle(lengthReadSize, stripNull) {
        return this.wpstring(lengthReadSize, stripNull, "little");
    }
    ;
    /**
    * Reads Wide Pascal string 1 byte length read in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstringbe(lengthReadSize, stripNull) {
        return this.wpstring(lengthReadSize, stripNull, "big");
    }
    ;
    /**
    * Reads Wide Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring1(stripNull, endian) {
        return this.wpstring(1, stripNull, endian);
    }
    ;
    /**
    * Reads Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring1le(stripNull) {
        return this.wpstring1(stripNull, "little");
    }
    ;
    /**
    * Reads Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring1be(stripNull) {
        return this.wpstring1(stripNull, "big");
    }
    ;
    /**
    * Reads Wide Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring2(stripNull, endian) {
        return this.wpstring(2, stripNull, endian);
    }
    ;
    /**
    * Reads Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring2le(stripNull) {
        return this.wpstring2(stripNull, "little");
    }
    ;
    /**
    * Reads Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring2be(stripNull) {
        return this.wpstring2(stripNull, "big");
    }
    ;
    /**
    * Reads Wide Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring4(stripNull, endian) {
        return this.wpstring(4, stripNull, endian);
    }
    ;
    /**
    * Reads Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring4le(stripNull) {
        return this.wpstring4(stripNull, "little");
    }
    ;
    /**
    * Reads Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring4be(stripNull) {
        return this.wpstring4(stripNull, "big");
    }
    ;
    /**
    * Reads Double Wide Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    dwpstring(lengthReadSize, stripNull, endian) {
        return this.string({ stringType: "double-wide-pascal", encoding: "utf-32", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    }
    ;
    /**
    * Reads Double Wide Pascal string 1 byte length read in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstringle(lengthReadSize, stripNull) {
        return this.dwpstring(lengthReadSize, stripNull, "little");
    }
    ;
    /**
    * Reads Double Wide Pascal string 1 byte length read in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstringbe(lengthReadSize, stripNull) {
        return this.dwpstring(lengthReadSize, stripNull, "big");
    }
    ;
    /**
    * Reads Double Wide Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    dwpstring1(stripNull, endian) {
        return this.dwpstring(1, stripNull, endian);
    }
    ;
    /**
    * Reads Double Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring1le(stripNull) {
        return this.dwpstring1(stripNull, "little");
    }
    ;
    /**
    * Reads Double WidePascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring1be(stripNull) {
        return this.dwpstring1(stripNull, "big");
    }
    ;
    /**
    * Reads Double Wide Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    dwpstring2(stripNull, endian) {
        return this.dwpstring(2, stripNull, endian);
    }
    ;
    /**
    * Reads Double Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring2le(stripNull) {
        return this.dwpstring2(stripNull, "little");
    }
    ;
    /**
    * Reads Double Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring2be(stripNull) {
        return this.dwpstring2(stripNull, "big");
    }
    ;
    /**
    * Reads Double Wide Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    dwpstring4(stripNull, endian) {
        return this.dwpstring(4, stripNull, endian);
    }
    ;
    /**
    * Reads Double Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring4le(stripNull) {
        return this.dwpstring4(stripNull, "little");
    }
    ;
    /**
    * Reads Double Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    dwpstring4be(stripNull) {
        return this.dwpstring4(stripNull, "big");
    }
    ;
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
class BiWriter extends BiSyncEngine {
    constructor(input, options = {}) {
        const growthIncrement = options.growthIncrement ?? 0x100000;
        if (input == undefined) {
            input = new Uint8Array(growthIncrement);
            console.warn(`BiWriter started without data. Creating Uint8Array with growthIncrement.`);
        }
        // Merge over defaults into a fresh object; never mutate the caller's options.
        super(input, {
            byteOffset: options.byteOffset ?? 0,
            bitOffset: options.bitOffset ?? 0,
            endianness: options.endianness ?? "little",
            strict: options.strict ?? false,
            growthIncrement: growthIncrement,
            enforceBigInt: options.enforceBigInt ?? false,
            readOnly: options.readOnly ?? false,
        });
    }
    ;
    //
    // #region Bit Aliases
    //
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
    bit(value, bits, unsigned, endian) {
        return this.writeBit(value, bits, unsigned, endian);
    }
    ;
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
    ubit(value, bits, endian) {
        return this.writeBit(value, bits, true, endian);
    }
    ;
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
    bitbe(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "big");
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitbe(value, bits) {
        return this.bit(value, bits, true, "big");
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {number}
     */
    ubitle(value, bits) {
        return this.bit(value, bits, true, "little");
    }
    ;
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
    bitle(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "little");
    }
    ;
    //
    // #region Generated mechanical aliases
    //
    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====
    // Behaviour is verified by test/aliases.parity.test.ts.
    /** Write a signed 8-bit integer. */
    set byte(value) { this.writeByte(value); }
    /** Write a signed 8-bit integer. */
    set int8(value) { this.writeByte(value); }
    /** Write an unsigned 8-bit integer. */
    set uint8(value) { this.writeByte(value, true); }
    /** Write an unsigned 8-bit integer. */
    set ubyte(value) { this.writeByte(value, true); }
    /** Write a signed 16-bit integer. */
    set int16(value) { this.writeInt16(value); }
    /** Write a signed 16-bit integer. */
    set short(value) { this.writeInt16(value); }
    /** Write a signed 16-bit integer. */
    set word(value) { this.writeInt16(value); }
    /** Write an unsigned 16-bit integer. */
    set uint16(value) { this.writeInt16(value, true); }
    /** Write an unsigned 16-bit integer. */
    set ushort(value) { this.writeInt16(value, true); }
    /** Write an unsigned 16-bit integer. */
    set uword(value) { this.writeInt16(value, true); }
    /** Write a signed 16-bit integer (little-endian). */
    set int16le(value) { this.writeInt16(value, false, "little"); }
    /** Write a signed 16-bit integer (little-endian). */
    set shortle(value) { this.writeInt16(value, false, "little"); }
    /** Write a signed 16-bit integer (little-endian). */
    set wordle(value) { this.writeInt16(value, false, "little"); }
    /** Write an unsigned 16-bit integer (little-endian). */
    set uint16le(value) { this.writeInt16(value, true, "little"); }
    /** Write an unsigned 16-bit integer (little-endian). */
    set ushortle(value) { this.writeInt16(value, true, "little"); }
    /** Write an unsigned 16-bit integer (little-endian). */
    set uwordle(value) { this.writeInt16(value, true, "little"); }
    /** Write a signed 16-bit integer (big-endian). */
    set int16be(value) { this.writeInt16(value, false, "big"); }
    /** Write a signed 16-bit integer (big-endian). */
    set shortbe(value) { this.writeInt16(value, false, "big"); }
    /** Write a signed 16-bit integer (big-endian). */
    set wordbe(value) { this.writeInt16(value, false, "big"); }
    /** Write an unsigned 16-bit integer (big-endian). */
    set uint16be(value) { this.writeInt16(value, true, "big"); }
    /** Write an unsigned 16-bit integer (big-endian). */
    set ushortbe(value) { this.writeInt16(value, true, "big"); }
    /** Write an unsigned 16-bit integer (big-endian). */
    set uwordbe(value) { this.writeInt16(value, true, "big"); }
    /** Write a signed 32-bit integer. */
    set int(value) { this.writeInt32(value); }
    /** Write a signed 32-bit integer. */
    set dword(value) { this.writeInt32(value); }
    /** Write a signed 32-bit integer. */
    set int32(value) { this.writeInt32(value); }
    /** Write a signed 32-bit integer. */
    set long(value) { this.writeInt32(value); }
    /** Write an unsigned 32-bit integer. */
    set uint(value) { this.writeInt32(value, true); }
    /** Write an unsigned 32-bit integer. */
    set udword(value) { this.writeInt32(value, true); }
    /** Write an unsigned 32-bit integer. */
    set uint32(value) { this.writeInt32(value, true); }
    /** Write an unsigned 32-bit integer. */
    set ulong(value) { this.writeInt32(value, true); }
    /** Write a signed 32-bit integer (little-endian). */
    set intle(value) { this.writeInt32(value, false, "little"); }
    /** Write a signed 32-bit integer (little-endian). */
    set dwordle(value) { this.writeInt32(value, false, "little"); }
    /** Write a signed 32-bit integer (little-endian). */
    set int32le(value) { this.writeInt32(value, false, "little"); }
    /** Write a signed 32-bit integer (little-endian). */
    set longle(value) { this.writeInt32(value, false, "little"); }
    /** Write an unsigned 32-bit integer (little-endian). */
    set uintle(value) { this.writeInt32(value, true, "little"); }
    /** Write an unsigned 32-bit integer (little-endian). */
    set udwordle(value) { this.writeInt32(value, true, "little"); }
    /** Write an unsigned 32-bit integer (little-endian). */
    set uint32le(value) { this.writeInt32(value, true, "little"); }
    /** Write an unsigned 32-bit integer (little-endian). */
    set ulongle(value) { this.writeInt32(value, true, "little"); }
    /** Write a signed 32-bit integer (big-endian). */
    set intbe(value) { this.writeInt32(value, false, "big"); }
    /** Write a signed 32-bit integer (big-endian). */
    set dwordbe(value) { this.writeInt32(value, false, "big"); }
    /** Write a signed 32-bit integer (big-endian). */
    set int32be(value) { this.writeInt32(value, false, "big"); }
    /** Write a signed 32-bit integer (big-endian). */
    set longbe(value) { this.writeInt32(value, false, "big"); }
    /** Write an unsigned 32-bit integer (big-endian). */
    set uintbe(value) { this.writeInt32(value, true, "big"); }
    /** Write an unsigned 32-bit integer (big-endian). */
    set udwordbe(value) { this.writeInt32(value, true, "big"); }
    /** Write an unsigned 32-bit integer (big-endian). */
    set uint32be(value) { this.writeInt32(value, true, "big"); }
    /** Write an unsigned 32-bit integer (big-endian). */
    set ulongbe(value) { this.writeInt32(value, true, "big"); }
    /** Write a signed 64-bit integer. */
    set int64(value) { this.writeInt64(value); }
    /** Write a signed 64-bit integer. */
    set bigint(value) { this.writeInt64(value); }
    /** Write a signed 64-bit integer. */
    set quad(value) { this.writeInt64(value); }
    /** Write an unsigned 64-bit integer. */
    set uint64(value) { this.writeInt64(value, true); }
    /** Write an unsigned 64-bit integer. */
    set ubigint(value) { this.writeInt64(value, true); }
    /** Write an unsigned 64-bit integer. */
    set uquad(value) { this.writeInt64(value, true); }
    /** Write a signed 64-bit integer (little-endian). */
    set int64le(value) { this.writeInt64(value, false, "little"); }
    /** Write a signed 64-bit integer (little-endian). */
    set bigintle(value) { this.writeInt64(value, false, "little"); }
    /** Write a signed 64-bit integer (little-endian). */
    set quadle(value) { this.writeInt64(value, false, "little"); }
    /** Write an unsigned 64-bit integer (little-endian). */
    set uint64le(value) { this.writeInt64(value, true, "little"); }
    /** Write an unsigned 64-bit integer (little-endian). */
    set ubigintle(value) { this.writeInt64(value, true, "little"); }
    /** Write an unsigned 64-bit integer (little-endian). */
    set uquadle(value) { this.writeInt64(value, true, "little"); }
    /** Write a signed 64-bit integer (big-endian). */
    set int64be(value) { this.writeInt64(value, false, "big"); }
    /** Write a signed 64-bit integer (big-endian). */
    set bigintbe(value) { this.writeInt64(value, false, "big"); }
    /** Write a signed 64-bit integer (big-endian). */
    set quadbe(value) { this.writeInt64(value, false, "big"); }
    /** Write an unsigned 64-bit integer (big-endian). */
    set uint64be(value) { this.writeInt64(value, true, "big"); }
    /** Write an unsigned 64-bit integer (big-endian). */
    set ubigintbe(value) { this.writeInt64(value, true, "big"); }
    /** Write an unsigned 64-bit integer (big-endian). */
    set uquadbe(value) { this.writeInt64(value, true, "big"); }
    /** Write a 32-bit float. */
    set float(value) { this.writeFloat(value); }
    /** Write a 32-bit float (little-endian). */
    set floatle(value) { this.writeFloat(value, "little"); }
    /** Write a 32-bit float (big-endian). */
    set floatbe(value) { this.writeFloat(value, "big"); }
    /** Write a 16-bit float. */
    set halffloat(value) { this.writeHalfFloat(value); }
    /** Write a 16-bit float. */
    set half(value) { this.writeHalfFloat(value); }
    /** Write a 16-bit float (little-endian). */
    set halffloatle(value) { this.writeHalfFloat(value, "little"); }
    /** Write a 16-bit float (little-endian). */
    set halfle(value) { this.writeHalfFloat(value, "little"); }
    /** Write a 16-bit float (big-endian). */
    set halffloatbe(value) { this.writeHalfFloat(value, "big"); }
    /** Write a 16-bit float (big-endian). */
    set halfbe(value) { this.writeHalfFloat(value, "big"); }
    /** Write a 64-bit float. */
    set doublefloat(value) { this.writeDoubleFloat(value); }
    /** Write a 64-bit float. */
    set dfloat(value) { this.writeDoubleFloat(value); }
    /** Write a 64-bit float (little-endian). */
    set doublefloatle(value) { this.writeDoubleFloat(value, "little"); }
    /** Write a 64-bit float (little-endian). */
    set dfloatle(value) { this.writeDoubleFloat(value, "little"); }
    /** Write a 64-bit float (big-endian). */
    set doublefloatbe(value) { this.writeDoubleFloat(value, "big"); }
    /** Write a 64-bit float (big-endian). */
    set dfloatbe(value) { this.writeDoubleFloat(value, "big"); }
    /** Write 1 signed bit. */
    set bit1(value) { this.bit(value, 1); }
    /** Write 1 unsigned bit. */
    set ubit1(value) { this.bit(value, 1, true); }
    /** Write 1 signed bit (little-endian). */
    set bit1le(value) { this.bit(value, 1, undefined, "little"); }
    /** Write 1 unsigned bit (little-endian). */
    set ubit1le(value) { this.bit(value, 1, true, "little"); }
    /** Write 1 signed bit (big-endian). */
    set bit1be(value) { this.bit(value, 1, undefined, "big"); }
    /** Write 1 unsigned bit (big-endian). */
    set ubit1be(value) { this.bit(value, 1, true, "big"); }
    /** Write 2 signed bits. */
    set bit2(value) { this.bit(value, 2); }
    /** Write 2 unsigned bits. */
    set ubit2(value) { this.bit(value, 2, true); }
    /** Write 2 signed bits (little-endian). */
    set bit2le(value) { this.bit(value, 2, undefined, "little"); }
    /** Write 2 unsigned bits (little-endian). */
    set ubit2le(value) { this.bit(value, 2, true, "little"); }
    /** Write 2 signed bits (big-endian). */
    set bit2be(value) { this.bit(value, 2, undefined, "big"); }
    /** Write 2 unsigned bits (big-endian). */
    set ubit2be(value) { this.bit(value, 2, true, "big"); }
    /** Write 3 signed bits. */
    set bit3(value) { this.bit(value, 3); }
    /** Write 3 unsigned bits. */
    set ubit3(value) { this.bit(value, 3, true); }
    /** Write 3 signed bits (little-endian). */
    set bit3le(value) { this.bit(value, 3, undefined, "little"); }
    /** Write 3 unsigned bits (little-endian). */
    set ubit3le(value) { this.bit(value, 3, true, "little"); }
    /** Write 3 signed bits (big-endian). */
    set bit3be(value) { this.bit(value, 3, undefined, "big"); }
    /** Write 3 unsigned bits (big-endian). */
    set ubit3be(value) { this.bit(value, 3, true, "big"); }
    /** Write 4 signed bits. */
    set bit4(value) { this.bit(value, 4); }
    /** Write 4 unsigned bits. */
    set ubit4(value) { this.bit(value, 4, true); }
    /** Write 4 signed bits (little-endian). */
    set bit4le(value) { this.bit(value, 4, undefined, "little"); }
    /** Write 4 unsigned bits (little-endian). */
    set ubit4le(value) { this.bit(value, 4, true, "little"); }
    /** Write 4 signed bits (big-endian). */
    set bit4be(value) { this.bit(value, 4, undefined, "big"); }
    /** Write 4 unsigned bits (big-endian). */
    set ubit4be(value) { this.bit(value, 4, true, "big"); }
    /** Write 5 signed bits. */
    set bit5(value) { this.bit(value, 5); }
    /** Write 5 unsigned bits. */
    set ubit5(value) { this.bit(value, 5, true); }
    /** Write 5 signed bits (little-endian). */
    set bit5le(value) { this.bit(value, 5, undefined, "little"); }
    /** Write 5 unsigned bits (little-endian). */
    set ubit5le(value) { this.bit(value, 5, true, "little"); }
    /** Write 5 signed bits (big-endian). */
    set bit5be(value) { this.bit(value, 5, undefined, "big"); }
    /** Write 5 unsigned bits (big-endian). */
    set ubit5be(value) { this.bit(value, 5, true, "big"); }
    /** Write 6 signed bits. */
    set bit6(value) { this.bit(value, 6); }
    /** Write 6 unsigned bits. */
    set ubit6(value) { this.bit(value, 6, true); }
    /** Write 6 signed bits (little-endian). */
    set bit6le(value) { this.bit(value, 6, undefined, "little"); }
    /** Write 6 unsigned bits (little-endian). */
    set ubit6le(value) { this.bit(value, 6, true, "little"); }
    /** Write 6 signed bits (big-endian). */
    set bit6be(value) { this.bit(value, 6, undefined, "big"); }
    /** Write 6 unsigned bits (big-endian). */
    set ubit6be(value) { this.bit(value, 6, true, "big"); }
    /** Write 7 signed bits. */
    set bit7(value) { this.bit(value, 7); }
    /** Write 7 unsigned bits. */
    set ubit7(value) { this.bit(value, 7, true); }
    /** Write 7 signed bits (little-endian). */
    set bit7le(value) { this.bit(value, 7, undefined, "little"); }
    /** Write 7 unsigned bits (little-endian). */
    set ubit7le(value) { this.bit(value, 7, true, "little"); }
    /** Write 7 signed bits (big-endian). */
    set bit7be(value) { this.bit(value, 7, undefined, "big"); }
    /** Write 7 unsigned bits (big-endian). */
    set ubit7be(value) { this.bit(value, 7, true, "big"); }
    /** Write 8 signed bits. */
    set bit8(value) { this.bit(value, 8); }
    /** Write 8 unsigned bits. */
    set ubit8(value) { this.bit(value, 8, true); }
    /** Write 8 signed bits (little-endian). */
    set bit8le(value) { this.bit(value, 8, undefined, "little"); }
    /** Write 8 unsigned bits (little-endian). */
    set ubit8le(value) { this.bit(value, 8, true, "little"); }
    /** Write 8 signed bits (big-endian). */
    set bit8be(value) { this.bit(value, 8, undefined, "big"); }
    /** Write 8 unsigned bits (big-endian). */
    set ubit8be(value) { this.bit(value, 8, true, "big"); }
    /** Write 9 signed bits. */
    set bit9(value) { this.bit(value, 9); }
    /** Write 9 unsigned bits. */
    set ubit9(value) { this.bit(value, 9, true); }
    /** Write 9 signed bits (little-endian). */
    set bit9le(value) { this.bit(value, 9, undefined, "little"); }
    /** Write 9 unsigned bits (little-endian). */
    set ubit9le(value) { this.bit(value, 9, true, "little"); }
    /** Write 9 signed bits (big-endian). */
    set bit9be(value) { this.bit(value, 9, undefined, "big"); }
    /** Write 9 unsigned bits (big-endian). */
    set ubit9be(value) { this.bit(value, 9, true, "big"); }
    /** Write 10 signed bits. */
    set bit10(value) { this.bit(value, 10); }
    /** Write 10 unsigned bits. */
    set ubit10(value) { this.bit(value, 10, true); }
    /** Write 10 signed bits (little-endian). */
    set bit10le(value) { this.bit(value, 10, undefined, "little"); }
    /** Write 10 unsigned bits (little-endian). */
    set ubit10le(value) { this.bit(value, 10, true, "little"); }
    /** Write 10 signed bits (big-endian). */
    set bit10be(value) { this.bit(value, 10, undefined, "big"); }
    /** Write 10 unsigned bits (big-endian). */
    set ubit10be(value) { this.bit(value, 10, true, "big"); }
    /** Write 11 signed bits. */
    set bit11(value) { this.bit(value, 11); }
    /** Write 11 unsigned bits. */
    set ubit11(value) { this.bit(value, 11, true); }
    /** Write 11 signed bits (little-endian). */
    set bit11le(value) { this.bit(value, 11, undefined, "little"); }
    /** Write 11 unsigned bits (little-endian). */
    set ubit11le(value) { this.bit(value, 11, true, "little"); }
    /** Write 11 signed bits (big-endian). */
    set bit11be(value) { this.bit(value, 11, undefined, "big"); }
    /** Write 11 unsigned bits (big-endian). */
    set ubit11be(value) { this.bit(value, 11, true, "big"); }
    /** Write 12 signed bits. */
    set bit12(value) { this.bit(value, 12); }
    /** Write 12 unsigned bits. */
    set ubit12(value) { this.bit(value, 12, true); }
    /** Write 12 signed bits (little-endian). */
    set bit12le(value) { this.bit(value, 12, undefined, "little"); }
    /** Write 12 unsigned bits (little-endian). */
    set ubit12le(value) { this.bit(value, 12, true, "little"); }
    /** Write 12 signed bits (big-endian). */
    set bit12be(value) { this.bit(value, 12, undefined, "big"); }
    /** Write 12 unsigned bits (big-endian). */
    set ubit12be(value) { this.bit(value, 12, true, "big"); }
    /** Write 13 signed bits. */
    set bit13(value) { this.bit(value, 13); }
    /** Write 13 unsigned bits. */
    set ubit13(value) { this.bit(value, 13, true); }
    /** Write 13 signed bits (little-endian). */
    set bit13le(value) { this.bit(value, 13, undefined, "little"); }
    /** Write 13 unsigned bits (little-endian). */
    set ubit13le(value) { this.bit(value, 13, true, "little"); }
    /** Write 13 signed bits (big-endian). */
    set bit13be(value) { this.bit(value, 13, undefined, "big"); }
    /** Write 13 unsigned bits (big-endian). */
    set ubit13be(value) { this.bit(value, 13, true, "big"); }
    /** Write 14 signed bits. */
    set bit14(value) { this.bit(value, 14); }
    /** Write 14 unsigned bits. */
    set ubit14(value) { this.bit(value, 14, true); }
    /** Write 14 signed bits (little-endian). */
    set bit14le(value) { this.bit(value, 14, undefined, "little"); }
    /** Write 14 unsigned bits (little-endian). */
    set ubit14le(value) { this.bit(value, 14, true, "little"); }
    /** Write 14 signed bits (big-endian). */
    set bit14be(value) { this.bit(value, 14, undefined, "big"); }
    /** Write 14 unsigned bits (big-endian). */
    set ubit14be(value) { this.bit(value, 14, true, "big"); }
    /** Write 15 signed bits. */
    set bit15(value) { this.bit(value, 15); }
    /** Write 15 unsigned bits. */
    set ubit15(value) { this.bit(value, 15, true); }
    /** Write 15 signed bits (little-endian). */
    set bit15le(value) { this.bit(value, 15, undefined, "little"); }
    /** Write 15 unsigned bits (little-endian). */
    set ubit15le(value) { this.bit(value, 15, true, "little"); }
    /** Write 15 signed bits (big-endian). */
    set bit15be(value) { this.bit(value, 15, undefined, "big"); }
    /** Write 15 unsigned bits (big-endian). */
    set ubit15be(value) { this.bit(value, 15, true, "big"); }
    /** Write 16 signed bits. */
    set bit16(value) { this.bit(value, 16); }
    /** Write 16 unsigned bits. */
    set ubit16(value) { this.bit(value, 16, true); }
    /** Write 16 signed bits (little-endian). */
    set bit16le(value) { this.bit(value, 16, undefined, "little"); }
    /** Write 16 unsigned bits (little-endian). */
    set ubit16le(value) { this.bit(value, 16, true, "little"); }
    /** Write 16 signed bits (big-endian). */
    set bit16be(value) { this.bit(value, 16, undefined, "big"); }
    /** Write 16 unsigned bits (big-endian). */
    set ubit16be(value) { this.bit(value, 16, true, "big"); }
    /** Write 17 signed bits. */
    set bit17(value) { this.bit(value, 17); }
    /** Write 17 unsigned bits. */
    set ubit17(value) { this.bit(value, 17, true); }
    /** Write 17 signed bits (little-endian). */
    set bit17le(value) { this.bit(value, 17, undefined, "little"); }
    /** Write 17 unsigned bits (little-endian). */
    set ubit17le(value) { this.bit(value, 17, true, "little"); }
    /** Write 17 signed bits (big-endian). */
    set bit17be(value) { this.bit(value, 17, undefined, "big"); }
    /** Write 17 unsigned bits (big-endian). */
    set ubit17be(value) { this.bit(value, 17, true, "big"); }
    /** Write 18 signed bits. */
    set bit18(value) { this.bit(value, 18); }
    /** Write 18 unsigned bits. */
    set ubit18(value) { this.bit(value, 18, true); }
    /** Write 18 signed bits (little-endian). */
    set bit18le(value) { this.bit(value, 18, undefined, "little"); }
    /** Write 18 unsigned bits (little-endian). */
    set ubit18le(value) { this.bit(value, 18, true, "little"); }
    /** Write 18 signed bits (big-endian). */
    set bit18be(value) { this.bit(value, 18, undefined, "big"); }
    /** Write 18 unsigned bits (big-endian). */
    set ubit18be(value) { this.bit(value, 18, true, "big"); }
    /** Write 19 signed bits. */
    set bit19(value) { this.bit(value, 19); }
    /** Write 19 unsigned bits. */
    set ubit19(value) { this.bit(value, 19, true); }
    /** Write 19 signed bits (little-endian). */
    set bit19le(value) { this.bit(value, 19, undefined, "little"); }
    /** Write 19 unsigned bits (little-endian). */
    set ubit19le(value) { this.bit(value, 19, true, "little"); }
    /** Write 19 signed bits (big-endian). */
    set bit19be(value) { this.bit(value, 19, undefined, "big"); }
    /** Write 19 unsigned bits (big-endian). */
    set ubit19be(value) { this.bit(value, 19, true, "big"); }
    /** Write 20 signed bits. */
    set bit20(value) { this.bit(value, 20); }
    /** Write 20 unsigned bits. */
    set ubit20(value) { this.bit(value, 20, true); }
    /** Write 20 signed bits (little-endian). */
    set bit20le(value) { this.bit(value, 20, undefined, "little"); }
    /** Write 20 unsigned bits (little-endian). */
    set ubit20le(value) { this.bit(value, 20, true, "little"); }
    /** Write 20 signed bits (big-endian). */
    set bit20be(value) { this.bit(value, 20, undefined, "big"); }
    /** Write 20 unsigned bits (big-endian). */
    set ubit20be(value) { this.bit(value, 20, true, "big"); }
    /** Write 21 signed bits. */
    set bit21(value) { this.bit(value, 21); }
    /** Write 21 unsigned bits. */
    set ubit21(value) { this.bit(value, 21, true); }
    /** Write 21 signed bits (little-endian). */
    set bit21le(value) { this.bit(value, 21, undefined, "little"); }
    /** Write 21 unsigned bits (little-endian). */
    set ubit21le(value) { this.bit(value, 21, true, "little"); }
    /** Write 21 signed bits (big-endian). */
    set bit21be(value) { this.bit(value, 21, undefined, "big"); }
    /** Write 21 unsigned bits (big-endian). */
    set ubit21be(value) { this.bit(value, 21, true, "big"); }
    /** Write 22 signed bits. */
    set bit22(value) { this.bit(value, 22); }
    /** Write 22 unsigned bits. */
    set ubit22(value) { this.bit(value, 22, true); }
    /** Write 22 signed bits (little-endian). */
    set bit22le(value) { this.bit(value, 22, undefined, "little"); }
    /** Write 22 unsigned bits (little-endian). */
    set ubit22le(value) { this.bit(value, 22, true, "little"); }
    /** Write 22 signed bits (big-endian). */
    set bit22be(value) { this.bit(value, 22, undefined, "big"); }
    /** Write 22 unsigned bits (big-endian). */
    set ubit22be(value) { this.bit(value, 22, true, "big"); }
    /** Write 23 signed bits. */
    set bit23(value) { this.bit(value, 23); }
    /** Write 23 unsigned bits. */
    set ubit23(value) { this.bit(value, 23, true); }
    /** Write 23 signed bits (little-endian). */
    set bit23le(value) { this.bit(value, 23, undefined, "little"); }
    /** Write 23 unsigned bits (little-endian). */
    set ubit23le(value) { this.bit(value, 23, true, "little"); }
    /** Write 23 signed bits (big-endian). */
    set bit23be(value) { this.bit(value, 23, undefined, "big"); }
    /** Write 23 unsigned bits (big-endian). */
    set ubit23be(value) { this.bit(value, 23, true, "big"); }
    /** Write 24 signed bits. */
    set bit24(value) { this.bit(value, 24); }
    /** Write 24 unsigned bits. */
    set ubit24(value) { this.bit(value, 24, true); }
    /** Write 24 signed bits (little-endian). */
    set bit24le(value) { this.bit(value, 24, undefined, "little"); }
    /** Write 24 unsigned bits (little-endian). */
    set ubit24le(value) { this.bit(value, 24, true, "little"); }
    /** Write 24 signed bits (big-endian). */
    set bit24be(value) { this.bit(value, 24, undefined, "big"); }
    /** Write 24 unsigned bits (big-endian). */
    set ubit24be(value) { this.bit(value, 24, true, "big"); }
    /** Write 25 signed bits. */
    set bit25(value) { this.bit(value, 25); }
    /** Write 25 unsigned bits. */
    set ubit25(value) { this.bit(value, 25, true); }
    /** Write 25 signed bits (little-endian). */
    set bit25le(value) { this.bit(value, 25, undefined, "little"); }
    /** Write 25 unsigned bits (little-endian). */
    set ubit25le(value) { this.bit(value, 25, true, "little"); }
    /** Write 25 signed bits (big-endian). */
    set bit25be(value) { this.bit(value, 25, undefined, "big"); }
    /** Write 25 unsigned bits (big-endian). */
    set ubit25be(value) { this.bit(value, 25, true, "big"); }
    /** Write 26 signed bits. */
    set bit26(value) { this.bit(value, 26); }
    /** Write 26 unsigned bits. */
    set ubit26(value) { this.bit(value, 26, true); }
    /** Write 26 signed bits (little-endian). */
    set bit26le(value) { this.bit(value, 26, undefined, "little"); }
    /** Write 26 unsigned bits (little-endian). */
    set ubit26le(value) { this.bit(value, 26, true, "little"); }
    /** Write 26 signed bits (big-endian). */
    set bit26be(value) { this.bit(value, 26, undefined, "big"); }
    /** Write 26 unsigned bits (big-endian). */
    set ubit26be(value) { this.bit(value, 26, true, "big"); }
    /** Write 27 signed bits. */
    set bit27(value) { this.bit(value, 27); }
    /** Write 27 unsigned bits. */
    set ubit27(value) { this.bit(value, 27, true); }
    /** Write 27 signed bits (little-endian). */
    set bit27le(value) { this.bit(value, 27, undefined, "little"); }
    /** Write 27 unsigned bits (little-endian). */
    set ubit27le(value) { this.bit(value, 27, true, "little"); }
    /** Write 27 signed bits (big-endian). */
    set bit27be(value) { this.bit(value, 27, undefined, "big"); }
    /** Write 27 unsigned bits (big-endian). */
    set ubit27be(value) { this.bit(value, 27, true, "big"); }
    /** Write 28 signed bits. */
    set bit28(value) { this.bit(value, 28); }
    /** Write 28 unsigned bits. */
    set ubit28(value) { this.bit(value, 28, true); }
    /** Write 28 signed bits (little-endian). */
    set bit28le(value) { this.bit(value, 28, undefined, "little"); }
    /** Write 28 unsigned bits (little-endian). */
    set ubit28le(value) { this.bit(value, 28, true, "little"); }
    /** Write 28 signed bits (big-endian). */
    set bit28be(value) { this.bit(value, 28, undefined, "big"); }
    /** Write 28 unsigned bits (big-endian). */
    set ubit28be(value) { this.bit(value, 28, true, "big"); }
    /** Write 29 signed bits. */
    set bit29(value) { this.bit(value, 29); }
    /** Write 29 unsigned bits. */
    set ubit29(value) { this.bit(value, 29, true); }
    /** Write 29 signed bits (little-endian). */
    set bit29le(value) { this.bit(value, 29, undefined, "little"); }
    /** Write 29 unsigned bits (little-endian). */
    set ubit29le(value) { this.bit(value, 29, true, "little"); }
    /** Write 29 signed bits (big-endian). */
    set bit29be(value) { this.bit(value, 29, undefined, "big"); }
    /** Write 29 unsigned bits (big-endian). */
    set ubit29be(value) { this.bit(value, 29, true, "big"); }
    /** Write 30 signed bits. */
    set bit30(value) { this.bit(value, 30); }
    /** Write 30 unsigned bits. */
    set ubit30(value) { this.bit(value, 30, true); }
    /** Write 30 signed bits (little-endian). */
    set bit30le(value) { this.bit(value, 30, undefined, "little"); }
    /** Write 30 unsigned bits (little-endian). */
    set ubit30le(value) { this.bit(value, 30, true, "little"); }
    /** Write 30 signed bits (big-endian). */
    set bit30be(value) { this.bit(value, 30, undefined, "big"); }
    /** Write 30 unsigned bits (big-endian). */
    set ubit30be(value) { this.bit(value, 30, true, "big"); }
    /** Write 31 signed bits. */
    set bit31(value) { this.bit(value, 31); }
    /** Write 31 unsigned bits. */
    set ubit31(value) { this.bit(value, 31, true); }
    /** Write 31 signed bits (little-endian). */
    set bit31le(value) { this.bit(value, 31, undefined, "little"); }
    /** Write 31 unsigned bits (little-endian). */
    set ubit31le(value) { this.bit(value, 31, true, "little"); }
    /** Write 31 signed bits (big-endian). */
    set bit31be(value) { this.bit(value, 31, undefined, "big"); }
    /** Write 31 unsigned bits (big-endian). */
    set ubit31be(value) { this.bit(value, 31, true, "big"); }
    /** Write 32 signed bits. */
    set bit32(value) { this.bit(value, 32); }
    /** Write 32 unsigned bits. */
    set ubit32(value) { this.bit(value, 32, true); }
    /** Write 32 signed bits (little-endian). */
    set bit32le(value) { this.bit(value, 32, undefined, "little"); }
    /** Write 32 unsigned bits (little-endian). */
    set ubit32le(value) { this.bit(value, 32, true, "little"); }
    /** Write 32 signed bits (big-endian). */
    set bit32be(value) { this.bit(value, 32, undefined, "big"); }
    /** Write 32 unsigned bits (big-endian). */
    set ubit32be(value) { this.bit(value, 32, true, "big"); }
    // #endregion Generated mechanical aliases
    //
    // #region string
    //
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
    string(string, options = this.strDefaults) {
        return this.writeString(string, options);
    }
    ;
    /**
    * Writes string using setting from .strDefaults
    *
    * Default is ``utf-8``
    *
    * @param {string} string - text string
    */
    set str(string) {
        this.writeString(string, this.strDefaults);
    }
    ;
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf8string(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    }
    ;
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    cstring(string, length, terminateValue) {
        return this.utf8string(string, length, terminateValue);
    }
    ;
    /**
    * Writes ANSI string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    ansistring(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    }
    ;
    /**
    * Writes latin1 string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    latin1string(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "iso-8859-1", length: length, terminateValue: terminateValue });
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf16string(string, length, terminateValue, endian) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    unistring(string, length, terminateValue, endian) {
        return this.utf16string(string, length, terminateValue, endian);
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string, length, terminateValue) {
        return this.unistring(string, length, terminateValue, "little");
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringle(string, length, terminateValue) {
        return this.utf16stringle(string, length, terminateValue);
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string, length, terminateValue) {
        return this.unistring(string, length, terminateValue, "big");
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string, length, terminateValue) {
        return this.utf16stringbe(string, length, terminateValue);
    }
    ;
    /**
    * Writes UTF-32 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    utf32string(string, length, terminateValue, endian) {
        return this.string(string, { stringType: "utf-32", encoding: "utf-32", length: length, terminateValue: terminateValue, endian: endian });
    }
    ;
    /**
    * Writes UTF-32 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf32stringle(string, length, terminateValue) {
        return this.utf32string(string, length, terminateValue, "little");
    }
    ;
    /**
    * Writes UTF-32 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    utf32stringbe(string, length, terminateValue) {
        return this.utf32string(string, length, terminateValue, "big");
    }
    ;
    /**
    * Writes Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    ;
    /**
    * Writes Pascal string 1 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string, endian) {
        return this.pstring(string, 1, endian);
    }
    ;
    /**
    * Writes Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring1le(string) {
        return this.pstring1(string, "little");
    }
    ;
    /**
    * Writes Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring1be(string) {
        return this.pstring1(string, "big");
    }
    ;
    /**
    * Writes Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring2(string, endian) {
        return this.pstring(string, 2, endian);
    }
    ;
    /**
    * Writes Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring2le(string) {
        return this.pstring2(string, "little");
    }
    ;
    /**
    * Writes Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring2be(string) {
        return this.pstring2(string, "big");
    }
    ;
    /**
    * Writes Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring4(string, endian) {
        return this.pstring(string, 4, endian);
    }
    ;
    /**
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring4le(string) {
        return this.pstring4(string, "little");
    }
    ;
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring4be(string) {
        return this.pstring4(string, "big");
    }
    ;
    /**
    * Writes Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    ;
    /**
    * Writes Wide Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string, lengthWriteSize) {
        return this.wpstring(string, lengthWriteSize, "little");
    }
    ;
    /**
    * Writes Wide Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string, lengthWriteSize) {
        return this.wpstring(string, lengthWriteSize, "big");
    }
    ;
    /**
    * Writes Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring1(string, endian) {
        return this.wpstring(string, 1, endian);
    }
    ;
    /**
    * Writes Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring1le(string) {
        return this.wpstring1(string, "little");
    }
    ;
    /**
    * Writes Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring1be(string) {
        return this.wpstring1(string, "big");
    }
    ;
    /**
    * Writes Wide Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring2(string, endian) {
        return this.wpstring(string, 2, endian);
    }
    ;
    /**
    * Writes Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring2le(string) {
        return this.wpstring2(string, "little");
    }
    ;
    /**
    * Writes Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring2be(string) {
        return this.wpstring2(string, "big");
    }
    ;
    /**
    * Writes Wide Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring4(string, endian) {
        return this.wpstring(string, 4, endian);
    }
    ;
    /**
    * Writes Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring4le(string) {
        return this.wpstring4(string, "little");
    }
    ;
    /**
    * Writes Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring4be(string) {
        return this.wpstring4(string, "big");
    }
    ;
    /**
    * Writes Double Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "double-wide-pascal", encoding: "utf-32", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    ;
    /**
    * Writes Double Wide Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    dwpstringle(string, lengthWriteSize) {
        return this.dwpstring(string, lengthWriteSize, "little");
    }
    ;
    /**
    * Writes Double Wide Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    dwpstringbe(string, lengthWriteSize) {
        return this.dwpstring(string, lengthWriteSize, "big");
    }
    ;
    /**
    * Writes Double Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring1(string, endian) {
        return this.dwpstring(string, 1, endian);
    }
    ;
    /**
    * Writes Double Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring1le(string) {
        return this.dwpstring1(string, "little");
    }
    ;
    /**
    * Writes Double Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring1be(string) {
        return this.dwpstring1(string, "big");
    }
    ;
    /**
    * Writes Double Wide Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring2(string, endian) {
        return this.dwpstring(string, 2, endian);
    }
    ;
    /**
    * Writes Double Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring2le(string) {
        return this.dwpstring2(string, "little");
    }
    ;
    /**
    * Writes Double Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring2be(string) {
        return this.dwpstring2(string, "big");
    }
    ;
    /**
    * Writes Double Wide Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    dwpstring4(string, endian) {
        return this.dwpstring(string, 4, endian);
    }
    ;
    /**
    * Writes Double Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    dwpstring4le(string) {
        return this.dwpstring4(string, "little");
    }
    ;
    /**
    * Writes Double Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    dwpstring4be(string) {
        return this.dwpstring4(string, "big");
    }
    ;
}

class MemorySource {
    #data;
    #readOnly;
    #isBuffer;
    constructor(data, readOnly = false) {
        this.#data = data;
        this.#readOnly = readOnly;
        this.#isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(data);
    }
    get size() {
        return this.#data.length;
    }
    get readOnly() {
        return this.#readOnly;
    }
    /** The live backing buffer (no copy). */
    get data() {
        return this.#data;
    }
    async read(offset, length) {
        if (offset < 0 || offset + length > this.#data.length) {
            throw new RangeError(`Read ${offset}..${offset + length} out of range (size ${this.#data.length})`);
        }
        return this.#data.subarray(offset, offset + length);
    }
    async write(offset, data) {
        if (this.#readOnly) {
            throw new Error('Cannot write to a read-only source');
        }
        if (offset < 0 || offset + data.length > this.#data.length) {
            throw new RangeError(`Write ${offset}..${offset + data.length} out of range (size ${this.#data.length}); resize first`);
        }
        this.#data.set(data, offset);
    }
    async resize(size) {
        if (this.#readOnly) {
            throw new Error('Cannot resize a read-only source');
        }
        if (size === this.#data.length) {
            return;
        }
        if (this.#isBuffer) {
            const next = Buffer.alloc(size);
            this.#data.copy(next, 0, 0, Math.min(size, this.#data.length));
            this.#data = next;
        }
        else {
            const next = new Uint8Array(size);
            next.set(this.#data.subarray(0, Math.min(size, this.#data.length)));
            this.#data = next;
        }
    }
    async flush() {
        // in-memory: nothing to flush
    }
    async close() {
        // in-memory: nothing to release
    }
}

class ChunkedFileSource {
    #fd;
    #size;
    #window;
    #readOnly;
    #chunks = [];
    #chunkPromises = [];
    #dirty = new Set();
    constructor(fd, size, windowSize, readOnly) {
        this.#fd = fd;
        this.#size = size;
        this.#window = windowSize;
        this.#readOnly = readOnly;
        const n = this.#numChunks();
        this.#chunks = new Array(n).fill(null);
        this.#chunkPromises = new Array(n).fill(null);
    }
    get size() {
        return this.#size;
    }
    get readOnly() {
        return this.#readOnly;
    }
    #numChunks() {
        return this.#window === 0 ? 1 : Math.ceil(this.#size / this.#window);
    }
    #chunkIndex(offset) {
        return this.#window === 0 ? 0 : Math.floor(offset / this.#window);
    }
    async #loadChunk(index) {
        if (this.#window !== 0 && index >= this.#chunks.length) {
            throw new RangeError(`Chunk ${index} out of range`);
        }
        const cached = this.#chunks[index];
        if (cached !== null && cached !== undefined) {
            return cached;
        }
        const pending = this.#chunkPromises[index];
        if (pending) {
            return await pending;
        }
        const start = index * this.#window;
        const length = this.#window === 0 ? this.#size : Math.min(this.#window, this.#size - start);
        const promise = (async () => {
            const buffer = new Uint8Array(length);
            if (length > 0 && this.#fd) {
                await this.#fd.read(buffer, 0, length, start);
            }
            this.#chunks[index] = buffer;
            return buffer;
        })();
        this.#chunkPromises[index] = promise;
        return await promise;
    }
    async #ensureRange(offset, length) {
        if (length <= 0) {
            return;
        }
        const first = this.#chunkIndex(offset);
        const last = this.#chunkIndex(offset + length - 1);
        const promises = [];
        for (let i = first; i <= last && i < this.#chunks.length; i++) {
            if (this.#chunks[i] === null) {
                promises.push(this.#loadChunk(i));
            }
        }
        await Promise.all(promises);
    }
    async read(offset, length) {
        if (offset < 0 || offset + length > this.#size) {
            throw new RangeError(`Read ${offset}..${offset + length} out of range (size ${this.#size})`);
        }
        const result = new Uint8Array(length);
        if (length === 0) {
            return result;
        }
        await this.#ensureRange(offset, length);
        let pos = offset;
        let written = 0;
        while (written < length) {
            const index = this.#chunkIndex(pos);
            const chunk = this.#chunks[index];
            const chunkOffset = pos - index * this.#window;
            const toCopy = Math.min(length - written, chunk.length - chunkOffset);
            if (toCopy <= 0) {
                throw new Error(`Chunk cache out of sync reading at ${pos} (chunk ${index}, len ${chunk.length})`);
            }
            result.set(chunk.subarray(chunkOffset, chunkOffset + toCopy), written);
            written += toCopy;
            pos += toCopy;
        }
        return result;
    }
    async write(offset, data) {
        if (this.#readOnly) {
            throw new Error('Cannot write to a read-only source');
        }
        if (offset < 0 || offset + data.length > this.#size) {
            throw new RangeError(`Write ${offset}..${offset + data.length} out of range (size ${this.#size}); resize first`);
        }
        if (data.length === 0) {
            return;
        }
        await this.#ensureRange(offset, data.length);
        let pos = offset;
        let read = 0;
        while (read < data.length) {
            const index = this.#chunkIndex(pos);
            const chunk = this.#chunks[index];
            const chunkOffset = pos - index * this.#window;
            const toCopy = Math.min(data.length - read, chunk.length - chunkOffset);
            if (toCopy <= 0) {
                throw new Error(`Chunk cache out of sync writing at ${pos} (chunk ${index}, len ${chunk.length})`);
            }
            chunk.set(data.subarray(read, read + toCopy), chunkOffset);
            this.#dirty.add(index);
            read += toCopy;
            pos += toCopy;
        }
    }
    async resize(size) {
        if (this.#readOnly) {
            throw new Error('Cannot resize a read-only source');
        }
        if (size === this.#size) {
            return;
        }
        await this.flush();
        const oldSize = this.#size;
        if (this.#fd) {
            await this.#fd.truncate(size);
        }
        this.#size = size;
        const oldNum = this.#chunks.length;
        const newNum = this.#numChunks();
        this.#chunks.length = newNum;
        this.#chunkPromises.length = newNum;
        for (let i = oldNum; i < newNum; i++) {
            this.#chunks[i] = null;
            this.#chunkPromises[i] = null;
        }
        if (newNum < oldNum) {
            this.#dirty = new Set([...this.#dirty].filter(i => i < newNum));
        }
        // The chunk that straddled the OLD end (grow) or the NEW end (shrink) may be
        // cached with a length that no longer matches the file. Drop it so it reloads
        // at its correct extent and a stale buffer can't be flushed back.
        for (const boundary of [oldSize - 1, size - 1]) {
            if (boundary < 0) {
                continue;
            }
            const idx = this.#chunkIndex(boundary);
            if (idx < this.#chunks.length) {
                this.#chunks[idx] = null;
                this.#chunkPromises[idx] = null;
                this.#dirty.delete(idx);
            }
        }
    }
    async flush() {
        if (this.#readOnly || this.#dirty.size === 0 || !this.#fd) {
            return;
        }
        const writes = [];
        for (const i of this.#dirty) {
            const chunk = this.#chunks[i];
            if (!chunk) {
                continue;
            }
            writes.push(this.#fd.write(chunk, 0, chunk.length, i * this.#window));
        }
        await Promise.all(writes);
        this.#dirty.clear();
    }
    async close() {
        await this.flush();
        if (this.#fd) {
            await this.#fd.close();
            this.#fd = null;
        }
        this.#chunks = [];
        this.#chunkPromises = [];
        this.#dirty.clear();
    }
}

var _a;
const hasBigInt = typeof BigInt === 'function';
const MIN_SAFE = hasBigInt ? BigInt(Number.MIN_SAFE_INTEGER) : 0n;
const MAX_SAFE = hasBigInt ? BigInt(Number.MAX_SAFE_INTEGER) : 0n;
function isSafeInt64(v) {
    return hasBigInt ? (v >= MIN_SAFE && v <= MAX_SAFE) : false;
}
class BiEngine {
    /** File system (fs/promises), injected by the entry point for file mode. */
    static fs;
    #source = null;
    #cursor;
    #pendingPath = null;
    endian;
    enforceBigInt;
    strict;
    readOnly;
    growthIncrement;
    windowSize;
    filePath = null;
    errorDump = false;
    strDefaults = { stringType: 'utf-8', terminateValue: 0x0 };
    #lock = Promise.resolve();
    #inOp = false;
    #wasExpanded = false;
    constructor(input, options = {}) {
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
        }
        else if (isBufferOrUint8Array(input)) {
            this.#source = new MemorySource(input, this.readOnly);
            this.windowSize = 0;
        }
        else {
            throw new TypeError('Source must be a file path (string) or Uint8Array/Buffer');
        }
    }
    // #region lifecycle / source
    get isMemoryMode() {
        return this.#source instanceof MemorySource;
    }
    /** The live Source (throws if not yet opened). */
    get source() {
        if (!this.#source)
            throw new Error('Source not open; call open() first');
        return this.#source;
    }
    /** Non-null source accessor for op bodies (they run after #ensureOpen). */
    get #src() {
        if (!this.#source)
            throw new Error('Source not open; call open() first');
        return this.#source;
    }
    /** Ensures the backing source exists (opens the file lazily in file mode). */
    async #ensureOpen() {
        if (this.#source)
            return this.#source;
        if (this.#pendingPath) {
            if (!_a.fs)
                throw new Error("Can't load file outside of Node.");
            try {
                await _a.fs.access(this.#pendingPath, _a.fs.constants.F_OK);
            }
            catch {
                await _a.fs.writeFile(this.#pendingPath, '');
            }
            const fd = await _a.fs.open(this.#pendingPath, this.readOnly ? 'r' : 'r+');
            const { size } = await fd.stat();
            this.#source = new ChunkedFileSource(fd, size, this.windowSize, this.readOnly);
        }
        if (!this.#source)
            throw new Error('No data source');
        return this.#source;
    }
    /** Open the source. Optionally swap to a new in-memory buffer. */
    async open(data) {
        if (data && isBufferOrUint8Array(data)) {
            this.#source = new MemorySource(data, this.readOnly);
            this.#pendingPath = null;
            return;
        }
        await this.#ensureOpen();
    }
    // #region position / size
    get size() {
        return this.#source ? this.#src.size : 0;
    }
    get offset() {
        return this.#cursor.byte;
    }
    get insetBit() {
        return this.#cursor.bit;
    }
    get bitOffset() {
        return this.#cursor.bitPosition;
    }
    get remaining() {
        return this.size - this.#cursor.byte;
    }
    // #region concurrency
    /** Run `fn` with exclusive access to the cursor. Reentrant. Opens the source first. */
    async runExclusive(fn) {
        if (this.#inOp) {
            return await fn();
        }
        const gate = this.#lock;
        let release;
        this.#lock = new Promise(resolve => { release = resolve; });
        await gate;
        this.#inOp = true;
        try {
            await this.#ensureOpen();
            return await fn();
        }
        finally {
            this.#inOp = false;
            release();
        }
    }
    // #region internals
    /** Advance past a partial bit within the current byte (byte-aligned ops). */
    #alignByte() {
        this.#cursor.alignByte();
    }
    /** Ensure [offset, offset+length) exists for reading. */
    #requireReadable(offset, length) {
        if (offset + length > this.#src.size) {
            throw new RangeError(`Read of ${length} at ${offset} exceeds size ${this.#src.size}`);
        }
    }
    /** Ensure [0, endByte) exists for writing, growing the source if allowed. */
    async #ensureWritable(endByte) {
        if (endByte <= this.#src.size) {
            return;
        }
        if (this.strict || this.#src.readOnly) {
            throw new Error(`Reached end of data: need ${endByte}, have ${this.#src.size} (strict/readOnly)`);
        }
        this.#wasExpanded = true;
        await this.#src.resize(endByte);
    }
    async #readAligned(width) {
        this.#alignByte();
        const at = this.#cursor.byte;
        this.#requireReadable(at, width);
        const bytes = await this.#src.read(at, width);
        return { view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), at };
    }
    async #writeAligned(width, encode, consume) {
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
    readByte(unsigned = false, consume = true) {
        return this.runExclusive(async () => {
            const { view, at } = await this.#readAligned(1);
            const v = readInt(view, 0, 8, !unsigned, false);
            if (consume)
                this.#cursor.set(at + 1);
            return v;
        });
    }
    #readIntN(width, unsigned, endian, consume) {
        return this.runExclusive(async () => {
            const { view, at } = await this.#readAligned(width / 8);
            const v = readInt(view, 0, width, !unsigned, endian === 'little');
            if (consume)
                this.#cursor.set(at + width / 8);
            return v;
        });
    }
    readInt16(unsigned = false, endian = this.endian, consume = true) {
        return this.#readIntN(16, unsigned, endian, consume);
    }
    readInt32(unsigned = false, endian = this.endian, consume = true) {
        return this.#readIntN(32, unsigned, endian, consume);
    }
    readInt64(unsigned = false, endian = this.endian, consume = true) {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        return this.runExclusive(async () => {
            const { view, at } = await this.#readAligned(8);
            const v = readBig(view, 0, !unsigned, endian === 'little');
            if (consume)
                this.#cursor.set(at + 8);
            // Match the shipping engine: force bigint when enforceBigInt is set OR when the
            // value can't be represented safely as a number; otherwise return a number.
            if (this.enforceBigInt || !isSafeInt64(v)) {
                return v;
            }
            return Number(v);
        });
    }
    // #region float reads
    #readFloatN(width, endian, consume) {
        return this.runExclusive(async () => {
            const { view, at } = await this.#readAligned(width / 8);
            const little = endian === 'little';
            const v = width === 16 ? readFloat16(view, 0, little)
                : width === 32 ? readFloat32(view, 0, little)
                    : readFloat64(view, 0, little);
            if (consume)
                this.#cursor.set(at + width / 8);
            return v;
        });
    }
    readHalfFloat(endian = this.endian, consume = true) {
        return this.#readFloatN(16, endian, consume);
    }
    readFloat(endian = this.endian, consume = true) {
        return this.#readFloatN(32, endian, consume);
    }
    readDoubleFloat(endian = this.endian, consume = true) {
        return this.#readFloatN(64, endian, consume);
    }
    // #region numeric writes
    writeByte(value, unsigned = false, consume = true) {
        return this.runExclusive(() => this.#writeAligned(1, view => writeInt(view, 0, numberSafe(value, 8, unsigned), 8, !unsigned, false), consume));
    }
    writeInt16(value, unsigned = false, endian = this.endian, consume = true) {
        return this.runExclusive(() => this.#writeAligned(2, view => writeInt(view, 0, numberSafe(value, 16, unsigned), 16, !unsigned, endian === 'little'), consume));
    }
    writeInt32(value, unsigned = false, endian = this.endian, consume = true) {
        return this.runExclusive(() => this.#writeAligned(4, view => writeInt(view, 0, numberSafe(value, 32, unsigned), 32, !unsigned, endian === 'little'), consume));
    }
    writeInt64(value, unsigned = false, endian = this.endian, consume = true) {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        return this.runExclusive(() => this.#writeAligned(8, view => writeBig(view, 0, numberSafe(value, 64, unsigned), !unsigned, endian === 'little'), consume));
    }
    // #region float writes
    writeHalfFloat(value, endian = this.endian, consume = true) {
        return this.runExclusive(() => this.#writeAligned(2, view => writeFloat16(view, 0, value, endian === 'little'), consume));
    }
    writeFloat(value, endian = this.endian, consume = true) {
        return this.runExclusive(() => this.#writeAligned(4, view => writeFloat32(view, 0, value, endian === 'little'), consume));
    }
    writeDoubleFloat(value, endian = this.endian, consume = true) {
        return this.runExclusive(() => this.#writeAligned(8, view => writeFloat64(view, 0, value, endian === 'little'), consume));
    }
    // #region bit fields
    readBit(bits, unsigned = false, endian = this.endian, consume = true) {
        return this.runExclusive(async () => {
            if (bits === 0)
                return 0;
            if (bits < 0 || bits > 32)
                throw new Error('Bit length must be between 1 and 32. Got ' + bits);
            const endByte = this.#cursor.endByteForBits(bits);
            this.#requireReadable(this.#cursor.byte, endByte - this.#cursor.byte);
            const bytes = await this.#src.read(this.#cursor.byte, endByte - this.#cursor.byte);
            const v = readBits(bytes, this.#cursor.bit, bits, endian === 'little', !unsigned);
            if (consume)
                this.#cursor.skip(0, bits);
            return v;
        });
    }
    writeBit(value, bits, unsigned = false, endian = this.endian, consume = true) {
        return this.runExclusive(async () => {
            if (bits === 0)
                return;
            if (bits < 0 || bits > 32)
                throw new Error('Bit length must be between 1 and 32. Got ' + bits);
            value = numberSafe(value, bits, unsigned);
            const endByte = this.#cursor.endByteForBits(bits);
            await this.#ensureWritable(endByte);
            const span = endByte - this.#cursor.byte;
            // read-modify-write the touched bytes
            const bytes = new Uint8Array(await this.#src.read(this.#cursor.byte, span));
            writeBits(bytes, value, bits, this.#cursor.bit, endian === 'little', !unsigned);
            await this.#src.write(this.#cursor.byte, bytes);
            if (consume)
                this.#cursor.skip(0, bits);
        });
    }
    // #region positioning
    /** Move to an absolute byte/bit, enforcing bounds (strict throws, else grows). */
    async goto(byte = 0, bit = 0) {
        await this.#reach(byte + Math.ceil(bit / 8));
        this.#cursor.set(byte, bit);
    }
    /** Relative move by bytes/bits, enforcing bounds. */
    async skip(bytes = 0, bits = 0) {
        const targetBits = this.#cursor.bitPosition + bytes * 8 + bits;
        await this.#reach(Math.ceil(Math.max(targetBits, 0) / 8));
        this.#cursor.skip(bytes, bits);
    }
    /** Ensure position `targetByte` is reachable: throw in strict/readOnly, else grow. */
    async #reach(targetByte) {
        if (targetByte <= this.size)
            return;
        if (this.strict || this.readOnly) {
            throw new Error(`Reached end of data: ${targetByte} of ${this.size}`);
        }
        await this.#ensureOpen();
        await this.#ensureWritable(targetByte);
    }
    rewind() {
        this.#cursor.set(0, 0);
    }
    last() {
        this.#cursor.set(this.size, 0);
    }
    async align(n) {
        const a = this.#cursor.byte % n;
        if (a)
            await this.skip(n - a, 0);
    }
    // #region positional (cursor-free, concurrency-safe)
    async readInt16At(offset, unsigned = false, endian = this.endian) {
        await this.#ensureOpen();
        const bytes = await this.#src.read(offset, 2);
        return readInt(new DataView(bytes.buffer, bytes.byteOffset, 2), 0, 16, !unsigned, endian === 'little');
    }
    async readUInt16At(offset, endian = this.endian) {
        return this.readInt16At(offset, true, endian);
    }
    async readInt32At(offset, unsigned = false, endian = this.endian) {
        await this.#ensureOpen();
        const bytes = await this.#src.read(offset, 4);
        return readInt(new DataView(bytes.buffer, bytes.byteOffset, 4), 0, 32, !unsigned, endian === 'little');
    }
    async readUInt32At(offset, endian = this.endian) {
        return this.readInt32At(offset, true, endian);
    }
    async readUInt8At(offset) {
        await this.#ensureOpen();
        const bytes = await this.#src.read(offset, 1);
        return bytes[0];
    }
    async writeInt16At(offset, value, unsigned = false, endian = this.endian) {
        await this.#ensureOpen();
        if (this.#src.readOnly)
            throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 2);
        const buf = new Uint8Array(2);
        writeInt(new DataView(buf.buffer), 0, numberSafe(value, 16, unsigned), 16, !unsigned, endian === 'little');
        await this.#src.write(offset, buf);
    }
    async writeInt32At(offset, value, unsigned = false, endian = this.endian) {
        await this.#ensureOpen();
        if (this.#src.readOnly)
            throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 4);
        const buf = new Uint8Array(4);
        writeInt(new DataView(buf.buffer), 0, numberSafe(value, 32, unsigned), 32, !unsigned, endian === 'little');
        await this.#src.write(offset, buf);
    }
    // #region structural edits
    #assertMutable() {
        if (this.#src.readOnly)
            throw new Error("Can't modify data in readOnly mode!");
        if (this.strict)
            throw new Error('\x1b[33m[Strict mode]\x1b[0m: Can not resize data in strict mode. Use unrestrict() first.');
    }
    /** Move [offset, oldEnd) forward by `len` bytes (back-to-front, copy-safe). */
    async #shiftForward(offset, len, oldEnd) {
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
    async #shiftBackward(start, removeLen, oldSize) {
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
    insert(data, offset = this.offset, consume = true) {
        return this.runExclusive(async () => {
            this.#assertMutable();
            if (offset < 0 || offset > this.#src.size)
                throw new RangeError('Insert offset out of bounds');
            if (data.length === 0)
                return;
            const oldSize = this.#src.size;
            await this.#src.resize(oldSize + data.length);
            await this.#shiftForward(offset, data.length, oldSize);
            await this.#src.write(offset, data);
            if (consume)
                this.#cursor.set(offset + data.length);
        });
    }
    unshift(data, consume = false) {
        return this.insert(data, 0, consume);
    }
    prepend(data, consume = false) {
        return this.insert(data, 0, consume);
    }
    push(data, consume = false) {
        return this.insert(data, this.size, consume);
    }
    append(data, consume = false) {
        return this.insert(data, this.size, consume);
    }
    /** Delete [startOffset, endOffset), returning the removed bytes. */
    delete(startOffset = 0, endOffset = this.offset, consume = false) {
        return this.runExclusive(async () => {
            this.#assertMutable();
            startOffset = Math.abs(startOffset);
            if (startOffset < 0 || endOffset > this.#src.size)
                throw new RangeError('Remove range out of bounds');
            const removeLen = endOffset - startOffset;
            if (removeLen <= 0)
                return new Uint8Array(0);
            const removed = (await this.#src.read(startOffset, removeLen)).slice();
            const oldSize = this.#src.size;
            await this.#shiftBackward(startOffset, removeLen, oldSize);
            await this.#src.resize(oldSize - removeLen);
            if (consume)
                this.#cursor.set(startOffset);
            return removed;
        });
    }
    clip() {
        return this.delete(this.offset, this.size, false);
    }
    trim() {
        return this.delete(this.offset, this.size, false);
    }
    crop(length = 0, consume = false) {
        return this.delete(this.offset, this.offset + length, consume);
    }
    drop(length = 0, consume = false) {
        return this.delete(this.offset, this.offset + length, consume);
    }
    /** Overwrite bytes at `offset` (grows if needed; does not shift the tail). */
    replace(data, offset = this.offset, consume = false) {
        return this.runExclusive(async () => {
            if (this.#src.readOnly)
                throw new Error("Can't replace data in readOnly mode!");
            if (data.length === 0)
                return;
            await this.#ensureWritable(offset + data.length);
            await this.#src.write(offset, data);
            if (consume)
                this.#cursor.set(offset + data.length);
        });
    }
    overwrite(data, offset = this.offset, consume = false) {
        return this.replace(data, offset, consume);
    }
    /** Copy out [startOffset, endOffset); if `fillValue` given, overwrite that range with it. */
    fill(startOffset = this.offset, endOffset = this.size, consume = false, fillValue) {
        return this.runExclusive(async () => {
            if (this.#src.readOnly && fillValue != undefined)
                throw new Error("Can't fill data in readOnly mode!");
            if (startOffset < 0 || endOffset > this.#src.size)
                throw new RangeError('Range out of bounds');
            const len = endOffset - startOffset;
            if (len <= 0)
                return new Uint8Array(0);
            const slice = (await this.#src.read(startOffset, len)).slice();
            if (fillValue != undefined) {
                await this.#src.write(startOffset, new Uint8Array(len).fill(fillValue & 0xff));
            }
            if (consume)
                this.#cursor.set(endOffset);
            return slice;
        });
    }
    lift(startOffset = this.offset, endOffset = this.size, consume = false, fillValue) {
        return this.fill(startOffset, endOffset, consume, fillValue);
    }
    subarray(startOffset = this.offset, endOffset = this.size, consume = false) {
        return this.fill(startOffset, endOffset, consume);
    }
    extract(length = 0, consume = false) {
        return this.fill(this.offset, this.offset + length, consume);
    }
    slice(length = 0, consume = false) {
        return this.fill(this.offset, this.offset + length, consume);
    }
    wrap(length = 0, consume = false) {
        return this.fill(this.offset, this.offset + length, consume);
    }
    // #region strings
    /** Reads a string; batched - a single source read + synchronous decode. */
    readString(options = {}, consume = true) {
        return this.runExclusive(async () => {
            this.#alignByte();
            const length = options.length;
            const stringType = options.stringType ?? 'utf-8';
            const lengthReadSize = options.lengthReadSize ?? 1;
            const stripNull = options.stripNull ?? true;
            const endian = options.endian ?? this.endian;
            const encoding = options.encoding ?? 'utf-8';
            const terminate = (options.terminateValue != undefined) ? (options.terminateValue & 0xFF) : 0;
            let readLengthinBytes;
            if (length != undefined) {
                readLengthinBytes = stringType === 'utf-16' ? length * 2 : stringType === 'utf-32' ? length * 4 : length;
            }
            else {
                readLengthinBytes = this.#src.size - this.#cursor.byte;
            }
            const at = this.#cursor.byte;
            this.#requireReadable(at, readLengthinBytes);
            const bytes = await this.#src.read(at, readLengthinBytes);
            const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            let pos = 0;
            const rU8 = () => bytes[pos++];
            const rU16 = (e) => { const v = readInt(dv, pos, 16, false, e === 'little'); pos += 2; return v; };
            const rU32 = (e) => { const v = readInt(dv, pos, 32, false, e === 'little') >>> 0; pos += 4; return v; };
            const str = _rstring(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, rU8, rU16, rU32);
            if (consume)
                this.#cursor.set(at + pos);
            return str;
        });
    }
    /** Writes a string; batched - assembled in memory then one source write. */
    writeString(str, options = {}, consume = true) {
        return this.runExclusive(async () => {
            const length = options.length;
            const stringType = options.stringType ?? 'utf-8';
            let terminateValue = options.terminateValue;
            const lengthWriteSize = options.lengthWriteSize ?? 1;
            const endian = options.endian ?? this.endian;
            let maxLengthValue = length ?? str.length;
            let strUnits = str.length;
            switch (stringType) {
                case 'pascal':
                    maxLengthValue = length != undefined ? length : 255;
                    break;
                case 'wide-pascal':
                    strUnits *= 2;
                    maxLengthValue = length != undefined ? length / 2 : 65535;
                    break;
                case 'double-wide-pascal':
                    strUnits *= 4;
                    maxLengthValue = length != undefined ? length / 4 : 4294967295;
                    break;
            }
            if (terminateValue == undefined) {
                if (stringType === 'ascii' || stringType === 'utf-8' || stringType === 'utf-16' || stringType === 'utf-32') {
                    terminateValue = 0;
                }
                if (length != undefined)
                    terminateValue = undefined;
            }
            const maxBytes = Math.min(strUnits, maxLengthValue);
            str = str.substring(0, maxBytes);
            let encodedString;
            switch (stringType) {
                case 'utf-16':
                case 'wide-pascal': {
                    const u16 = new Uint16Array(str.length);
                    for (let i = 0; i < str.length; i++)
                        u16[i] = str.charCodeAt(i);
                    encodedString = new Uint8Array(u16.buffer);
                    break;
                }
                case 'utf-32':
                case 'double-wide-pascal': {
                    const u32 = new Uint32Array(str.length);
                    for (let i = 0; i < str.length; i++)
                        u32[i] = str.codePointAt(i) ?? 0;
                    encodedString = new Uint8Array(u32.buffer);
                    break;
                }
                default:
                    encodedString = new TextEncoder().encode(str);
            }
            const out = [];
            const wU8 = (n) => { out.push(n & 0xFF); };
            const wU16 = (n, e) => { const b = new Uint8Array(2); writeInt(new DataView(b.buffer), 0, n, 16, false, e === 'little'); out.push(b[0], b[1]); };
            const wU32 = (n, e) => { const b = new Uint8Array(4); writeInt(new DataView(b.buffer), 0, n, 32, false, e === 'little'); out.push(b[0], b[1], b[2], b[3]); };
            _wstring(encodedString, stringType, endian, terminateValue, lengthWriteSize, wU8, wU16, wU32);
            const buf = new Uint8Array(out);
            this.#alignByte();
            const at = this.#cursor.byte;
            await this.#ensureWritable(at + buf.length);
            await this.#src.write(at, buf);
            if (consume)
                this.#cursor.set(at + buf.length);
        });
    }
    // #region math (read-modify-write over a range)
    #normalizeKey(key) {
        return typeof key === 'string' ? new TextEncoder().encode(key) : key;
    }
    async #applyRange(startOffset, endOffset, apply, consume) {
        if (this.#src.readOnly)
            throw new Error("Can't write data in readOnly mode!");
        const end = Math.min(endOffset, this.#src.size);
        const len = end - startOffset;
        if (len <= 0)
            return;
        const bytes = new Uint8Array(await this.#src.read(startOffset, len));
        apply(bytes);
        await this.#src.write(startOffset, bytes);
        if (consume)
            this.#cursor.set(end);
    }
    xor(key, start = this.offset, end = this.size, consume = false) {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _XOR(b, 0, b.length, k), consume));
    }
    or(key, start = this.offset, end = this.size, consume = false) {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _OR(b, 0, b.length, k), consume));
    }
    and(key, start = this.offset, end = this.size, consume = false) {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _AND(b, 0, b.length, k), consume));
    }
    add(key, start = this.offset, end = this.size, consume = false) {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _ADD(b, 0, b.length, k), consume));
    }
    not(start = this.offset, end = this.size, consume = false) {
        return this.runExclusive(() => this.#applyRange(start, end, b => _NOT(b, 0, b.length), consume));
    }
    lShift(key, start = this.offset, end = this.size, consume = false) {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _LSHIFT(b, 0, b.length, k), consume));
    }
    rShift(key, start = this.offset, end = this.size, consume = false) {
        const k = this.#normalizeKey(key);
        return this.runExclusive(() => this.#applyRange(start, end, b => _RSHIFT(b, 0, b.length, k), consume));
    }
    // length-relative variants (operate on `length` bytes from the current position)
    #keyLen(key, length) {
        if (typeof key === 'number')
            return { k: key, len: length ?? 1 };
        const k = typeof key === 'string' ? new TextEncoder().encode(key) : key;
        return { k, len: length ?? k.length };
    }
    xorThis(key, length, consume = false) {
        const { k, len } = this.#keyLen(key, length);
        return this.xor(k, this.offset, this.offset + len, consume);
    }
    orThis(key, length, consume = false) {
        const { k, len } = this.#keyLen(key, length);
        return this.or(k, this.offset, this.offset + len, consume);
    }
    andThis(key, length, consume = false) {
        const { k, len } = this.#keyLen(key, length);
        return this.and(k, this.offset, this.offset + len, consume);
    }
    addThis(key, length, consume = false) {
        const { k, len } = this.#keyLen(key, length);
        return this.add(k, this.offset, this.offset + len, consume);
    }
    notThis(length = 1, consume = false) {
        return this.not(this.offset, this.offset + length, consume);
    }
    lShiftThis(key, length, consume = false) {
        const { k, len } = this.#keyLen(key, length);
        return this.lShift(k, this.offset, this.offset + len, consume);
    }
    rShiftThis(key, length, consume = false) {
        const { k, len } = this.#keyLen(key, length);
        return this.rShift(k, this.offset, this.offset + len, consume);
    }
    // #region find (absolute offset, or -1; does not move the cursor)
    findBytes(bytesToFind) {
        const needle = Array.isArray(bytesToFind) ? new Uint8Array(bytesToFind) : bytesToFind;
        return this.runExclusive(async () => {
            const data = await this.#src.read(0, this.#src.size);
            for (let i = this.#cursor.byte; i <= this.#src.size - needle.length; i++) {
                let match = true;
                for (let j = 0; j < needle.length; j++) {
                    if (data[i + j] !== needle[j]) {
                        match = false;
                        break;
                    }
                }
                if (match)
                    return i;
            }
            return -1;
        });
    }
    findString(str, bytesPerChar = 1) {
        return this.findBytes(textEncode(str, bytesPerChar));
    }
    async #findNumber(value, bits, unsigned, endian) {
        return this.runExclusive(async () => {
            const data = await this.#src.read(0, this.#src.size);
            for (let z = this.#cursor.byte; z <= this.#src.size - (bits / 8); z++) {
                const dv = new DataView(data.buffer, data.byteOffset + z, bits / 8);
                const v = bits <= 32 ? readInt(dv, 0, bits, !unsigned, endian === 'little') : Number(readBig(dv, 0, !unsigned, endian === 'little'));
                if (v === value)
                    return z;
            }
            return -1;
        });
    }
    findByte(value, unsigned = true, endian = this.endian) {
        return this.#findNumber(value, 8, unsigned, endian);
    }
    findShort(value, unsigned = true, endian = this.endian) {
        return this.#findNumber(value, 16, unsigned, endian);
    }
    findInt(value, unsigned = true, endian = this.endian) {
        return this.#findNumber(value, 32, unsigned, endian);
    }
    // #region read aliases
    readUByte(consume = true) { return this.readByte(true, consume); }
    readUInt16(endian = this.endian) { return this.readInt16(true, endian); }
    readUInt16LE() { return this.readInt16(true, 'little'); }
    readUInt16BE() { return this.readInt16(true, 'big'); }
    readInt16LE() { return this.readInt16(false, 'little'); }
    readInt16BE() { return this.readInt16(false, 'big'); }
    readInt(endian = this.endian) { return this.readInt32(false, endian); }
    readUInt(endian = this.endian) { return this.readInt32(true, endian); }
    readUInt32(endian = this.endian) { return this.readInt32(true, endian); }
    readInt32LE() { return this.readInt32(false, 'little'); }
    readInt32BE() { return this.readInt32(false, 'big'); }
    readUInt32LE() { return this.readInt32(true, 'little'); }
    readUInt32BE() { return this.readInt32(true, 'big'); }
    readFloat32(endian = this.endian, consume = true) { return this.readFloat(endian, consume); }
    readFloatLE() { return this.readFloat('little'); }
    readFloatBE() { return this.readFloat('big'); }
    readFloat32LE() { return this.readFloat('little'); }
    readFloat32BE() { return this.readFloat('big'); }
    readFloat16(endian = this.endian, consume = true) { return this.readHalfFloat(endian, consume); }
    readHalfFloatLE() { return this.readHalfFloat('little'); }
    readHalfFloatBE() { return this.readHalfFloat('big'); }
    readFloat16LE() { return this.readHalfFloat('little'); }
    readFloat16BE() { return this.readHalfFloat('big'); }
    readFloat64(endian = this.endian, consume = true) { return this.readDoubleFloat(endian, consume); }
    readDoubleFloatLE() { return this.readDoubleFloat('little'); }
    readDoubleFloatBE() { return this.readDoubleFloat('big'); }
    readFloat64LE() { return this.readDoubleFloat('little'); }
    readFloat64BE() { return this.readDoubleFloat('big'); }
    readUInt64() { return this.readInt64(true); }
    readInt64LE() { return this.readInt64(false, 'little'); }
    readInt64BE() { return this.readInt64(false, 'big'); }
    readUInt64LE() { return this.readInt64(true, 'little'); }
    readUInt64BE() { return this.readInt64(true, 'big'); }
    readUBitBE(bits) { return this.readBit(bits, true, 'big'); }
    readUBitLE(bits) { return this.readBit(bits, true, 'little'); }
    readBitBE(bits, unsigned) { return this.readBit(bits, unsigned, 'big'); }
    readBitLE(bits, unsigned) { return this.readBit(bits, unsigned, 'little'); }
    async readBytes(amount, unsigned, consume = true) {
        const data = await this.readUBytes(amount, consume);
        const out = [];
        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            out.push(unsigned ? (v & 0xFF) : (v > 127 ? v - 256 : v));
        }
        return out;
    }
    readUBytes(amount, consume = true) {
        return this.runExclusive(async () => {
            this.#alignByte();
            const at = this.#cursor.byte;
            this.#requireReadable(at, amount);
            const bytes = (await this.#src.read(at, amount)).slice();
            if (consume)
                this.#cursor.set(at + amount);
            return bytes;
        });
    }
    // #region write aliases
    writeUInt16(value, endian = this.endian) { return this.writeInt16(value, true, endian); }
    writeUInt16LE(value) { return this.writeInt16(value, true, 'little'); }
    writeUInt16BE(value) { return this.writeInt16(value, true, 'big'); }
    writeInt16LE(value) { return this.writeInt16(value, false, 'little'); }
    writeInt16BE(value) { return this.writeInt16(value, false, 'big'); }
    writeInt(value, endian = this.endian) { return this.writeInt32(value, false, endian); }
    writeUInt(value, endian = this.endian) { return this.writeInt32(value, true, endian); }
    writeUInt32(value, endian = this.endian) { return this.writeInt32(value, true, endian); }
    writeInt32LE(value) { return this.writeInt32(value, false, 'little'); }
    writeInt32BE(value) { return this.writeInt32(value, false, 'big'); }
    writeUInt32LE(value) { return this.writeInt32(value, true, 'little'); }
    writeUInt32BE(value) { return this.writeInt32(value, true, 'big'); }
    writeFloat32(value, endian = this.endian, consume = true) { return this.writeFloat(value, endian, consume); }
    writeFloatLE(value) { return this.writeFloat(value, 'little'); }
    writeFloatBE(value) { return this.writeFloat(value, 'big'); }
    writeFloat32LE(value) { return this.writeFloat(value, 'little'); }
    writeFloat32BE(value) { return this.writeFloat(value, 'big'); }
    writeFloat16(value, endian = this.endian, consume = true) { return this.writeHalfFloat(value, endian, consume); }
    writeHalfFloatLE(value) { return this.writeHalfFloat(value, 'little'); }
    writeHalfFloatBE(value) { return this.writeHalfFloat(value, 'big'); }
    writeFloat16LE(value) { return this.writeHalfFloat(value, 'little'); }
    writeFloat16BE(value) { return this.writeHalfFloat(value, 'big'); }
    writeFloat64(value, endian = this.endian, consume = true) { return this.writeDoubleFloat(value, endian, consume); }
    writeDoubleFloatLE(value) { return this.writeDoubleFloat(value, 'little'); }
    writeDoubleFloatBE(value) { return this.writeDoubleFloat(value, 'big'); }
    writeFloat64LE(value) { return this.writeDoubleFloat(value, 'little'); }
    writeFloat64BE(value) { return this.writeDoubleFloat(value, 'big'); }
    writeUInt64(value, endian = this.endian) { return this.writeInt64(value, true, endian); }
    writeInt64LE(value) { return this.writeInt64(value, false, 'little'); }
    writeInt64BE(value) { return this.writeInt64(value, false, 'big'); }
    writeUInt64LE(value) { return this.writeInt64(value, true, 'little'); }
    writeUInt64BE(value) { return this.writeInt64(value, true, 'big'); }
    writeUByte(value, consume = true) { return this.writeByte(value, true, consume); }
    writeUBitBE(value, bits) { return this.writeBit(value, bits, true, 'big'); }
    writeUBitLE(value, bits) { return this.writeBit(value, bits, true, 'little'); }
    writeBitBE(value, bits, unsigned) { return this.writeBit(value, bits, unsigned, 'big'); }
    writeBitLE(value, bits, unsigned) { return this.writeBit(value, bits, unsigned, 'little'); }
    writeBytes(values, unsigned, consume = true) {
        const data = isBufferOrUint8Array(values) ? values : new Uint8Array(values);
        return this.overwrite(data, this.offset, consume);
    }
    writeUBytes(values, consume = true) {
        return this.writeBytes(values, true, consume);
    }
    // #region endianness
    endianness(endian) {
        if (endian !== 'big' && endian !== 'little')
            throw new TypeError('Endian must be big or little');
        this.endian = endian;
    }
    bigEndian() { this.endian = 'big'; }
    big() { this.endian = 'big'; }
    be() { this.endian = 'big'; }
    littleEndian() { this.endian = 'little'; }
    little() { this.endian = 'little'; }
    le() { this.endian = 'little'; }
    // #region size / position aliases
    get bitSize() { return this.size * 8; }
    get length() { return this.size; }
    get len() { return this.size; }
    get fileSize() { return this.size; }
    get FileSize() { return this.size; }
    get lengthBits() { return this.size * 8; }
    get sizeBits() { return this.size * 8; }
    get fileBitSize() { return this.size * 8; }
    get fileSizeBits() { return this.size * 8; }
    get lenBits() { return this.size * 8; }
    get off() { return this.#cursor.byte; }
    get getOffset() { return this.#cursor.byte; }
    get tell() { return this.#cursor.byte; }
    get FTell() { return this.#cursor.byte; }
    get saveOffset() { return this.#cursor.byte; }
    get byteOffset() { return this.#cursor.byte; }
    async setOffset(value) { await this.goto(value); }
    async setByteOffset(value) { await this.goto(value); }
    get offsetBits() { return this.#cursor.bitPosition; }
    get getBitOffset() { return this.#cursor.bitPosition; }
    get saveBitOffset() { return this.#cursor.bitPosition; }
    get FTellBits() { return this.#cursor.bitPosition; }
    get tellBits() { return this.#cursor.bit; }
    get offBits() { return this.#cursor.bitPosition; }
    async setOffsetBits(value) { await this.goto(value - (value % 8), value % 8); }
    async setBitOffset(value) { await this.setOffsetBits(value); }
    get getInsetBit() { return this.#cursor.bit; }
    get saveInsetBit() { return this.#cursor.bit; }
    get inBit() { return this.#cursor.bit; }
    get bitTell() { return this.#cursor.bit; }
    async setInsetBit(value) { await this.goto(this.#cursor.byte, value % 8); }
    get remain() { return this.size - this.#cursor.byte; }
    get remainBytes() { return this.size - this.#cursor.byte; }
    get FEoF() { return this.size - this.#cursor.byte; }
    get remainBits() { return (this.size * 8) - this.#cursor.bitPosition; }
    get FEoFBits() { return (this.size * 8) - this.#cursor.bitPosition; }
    get getLine() { return Math.abs(Math.floor((this.#cursor.byte - 1) / 16)); }
    get row() { return this.getLine; }
    // #region move aliases
    async jump(bytes, bits) { await this.skip(bytes, bits ?? 0); }
    async seek(bytes, bits) { await this.skip(bytes, bits ?? 0); }
    async FSeek(byte, bit) { await this.goto(byte, bit ?? 0); }
    async pointer(byte, bit) { await this.goto(byte, bit ?? 0); }
    async warp(byte, bit) { await this.goto(byte, bit ?? 0); }
    gotoStart() { this.rewind(); }
    gotoEnd() { this.last(); }
    EoF() { this.last(); }
    async alignRev(number) {
        const a = this.#cursor.byte % number;
        if (a)
            await this.skip(-a, 0);
    }
    // #region type checks
    isBufferOrUint8Array(obj) { return isBufferOrUint8Array(obj); }
    isBuffer(obj) { return typeof Buffer !== 'undefined' && Buffer.isBuffer(obj); }
    isUint8Array(obj) { return obj instanceof Uint8Array && !this.isBuffer(obj); }
    // #region strict / dump
    restrict() { this.strict = true; }
    unrestrict() { this.strict = false; }
    errorDumpOff() { this.errorDump = false; }
    errorDumpOn() { this.errorDump = true; }
    set strSettings(settings) {
        this.strDefaults = { ...this.strDefaults, ...settings };
    }
    async hexdump(options = {}) {
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
    async readByteAt(offset, unsigned = true) {
        await this.#ensureOpen();
        const v = (await this.#src.read(offset, 1))[0];
        return unsigned ? (v & 0xFF) : (v > 127 ? v - 256 : v);
    }
    async readBytesAt(offset, length) {
        await this.#ensureOpen();
        return (await this.#src.read(offset, length)).slice();
    }
    async readFloat32At(offset, endian = this.endian) {
        await this.#ensureOpen();
        const b = await this.#src.read(offset, 4);
        return readFloat32(new DataView(b.buffer, b.byteOffset, 4), 0, endian === 'little');
    }
    async readFloat64At(offset, endian = this.endian) {
        await this.#ensureOpen();
        const b = await this.#src.read(offset, 8);
        return readFloat64(new DataView(b.buffer, b.byteOffset, 8), 0, endian === 'little');
    }
    async readBigInt64At(offset, endian = this.endian) {
        await this.#ensureOpen();
        const b = await this.#src.read(offset, 8);
        return readBig(new DataView(b.buffer, b.byteOffset, 8), 0, true, endian === 'little');
    }
    async readBigUInt64At(offset, endian = this.endian) {
        await this.#ensureOpen();
        const b = await this.#src.read(offset, 8);
        return readBig(new DataView(b.buffer, b.byteOffset, 8), 0, false, endian === 'little');
    }
    async writeByteAt(offset, value, unsigned = true) {
        await this.#ensureOpen();
        if (this.#src.readOnly)
            throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 1);
        await this.#src.write(offset, new Uint8Array([numberSafe(value, 8, unsigned) & 0xFF]));
    }
    async writeBytesAt(offset, data) {
        await this.#ensureOpen();
        if (this.#src.readOnly)
            throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + data.length);
        await this.#src.write(offset, data);
    }
    async writeUInt16At(offset, value, endian = this.endian) { return this.writeInt16At(offset, value, true, endian); }
    async writeUInt32At(offset, value, endian = this.endian) { return this.writeInt32At(offset, value, true, endian); }
    async writeFloat32At(offset, value, endian = this.endian) {
        await this.#ensureOpen();
        if (this.#src.readOnly)
            throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 4);
        const buf = new Uint8Array(4);
        writeFloat32(new DataView(buf.buffer), 0, value, endian === 'little');
        await this.#src.write(offset, buf);
    }
    async writeFloat64At(offset, value, endian = this.endian) {
        await this.#ensureOpen();
        if (this.#src.readOnly)
            throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 8);
        const buf = new Uint8Array(8);
        writeFloat64(new DataView(buf.buffer), 0, value, endian === 'little');
        await this.#src.write(offset, buf);
    }
    async writeBigInt64At(offset, value, unsigned = false, endian = this.endian) {
        await this.#ensureOpen();
        if (this.#src.readOnly)
            throw new Error("Can't write in readOnly mode!");
        await this.#ensureWritable(offset + 8);
        const buf = new Uint8Array(8);
        writeBig(new DataView(buf.buffer), 0, numberSafe(value, 64, unsigned), !unsigned, endian === 'little');
        await this.#src.write(offset, buf);
    }
    async writeBigUInt64At(offset, value, endian = this.endian) { return this.writeBigInt64At(offset, value, true, endian); }
    // #region data / lifecycle
    /** In-memory buffer (memory mode); null in file mode - use get()/getData(). */
    get data() {
        return this.#source instanceof MemorySource ? this.#source.data : null;
    }
    /** DataView over the in-memory buffer (memory mode only). */
    get view() {
        const d = this.data;
        return d ? new DataView(d.buffer, d.byteOffset, d.byteLength) : null;
    }
    async commit() {
        await this.flush();
    }
    async flush() {
        if (this.#source)
            await this.#source.flush();
    }
    /** Returns the current data (trimmed to the write position if the buffer was expanded). */
    async get() {
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
    async getData() { return this.get(); }
    async getFullBuffer() { return this.get(); }
    async return() { return this.get(); }
    async end() { return this.close(); }
    async done() { return this.close(); }
    async finished() { return this.close(); }
    async close() {
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
    async writeMode(mode = true) {
        this.strict = !mode;
        this.readOnly = !mode;
        if (this.#pendingPath || (this.#source && !(this.#source instanceof MemorySource))) {
            await this.close();
        }
    }
    async renameFile(newFilePath) {
        if (this.isMemoryMode)
            return;
        await this.close();
        if (!_a.fs)
            throw new Error("Can't rename file outside of Node.");
        await _a.fs.rename(this.filePath, newFilePath);
        this.filePath = newFilePath;
        this.#pendingPath = newFilePath;
        await this.open();
    }
    async deleteFile() {
        if (this.isMemoryMode)
            return;
        if (this.readOnly)
            throw new Error("Can't delete file in readOnly mode!");
        await this.close();
        if (!_a.fs)
            throw new Error("Can't delete file outside of Node.");
        await _a.fs.unlink(this.filePath);
        this.filePath = null;
        this.#pendingPath = null;
    }
}
_a = BiEngine;

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
class BiReaderAsync extends BiEngine {
    constructor(input, options = {}) {
        if (input == undefined) {
            throw new Error("Can not start BiReaderAsync without data.");
        }
        // Merge over defaults into a fresh object; never mutate the caller's options.
        super(input, {
            byteOffset: options.byteOffset ?? 0,
            bitOffset: options.bitOffset ?? 0,
            endianness: options.endianness ?? "little",
            strict: options.strict ?? true,
            growthIncrement: options.growthIncrement ?? 0x100000,
            enforceBigInt: options.enforceBigInt ?? false,
            readOnly: options.readOnly ?? true,
            windowSize: options.windowSize ?? 0x1000,
        });
    }
    ;
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
    static async create(input, options = {}) {
        const instance = new BiReaderAsync(input, options);
        await instance.open();
        return instance;
    }
    ;
    //
    // #region Bit Aliases
    //
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
    async bit(bits, unsigned, endian) {
        return await this.readBit(bits, unsigned, endian);
    }
    ;
    /**
     * Bit field reader. Unsigned read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async ubit(bits, endian) {
        return await this.readBit(bits, true, endian);
    }
    ;
    /**
     * Bit field reader. Unsigned big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    async ubitbe(bits) {
        return await this.bit(bits, true, "big");
    }
    ;
    /**
     * Bit field reader. Big endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {Promise<number>}
     */
    async bitbe(bits, unsigned) {
        return await this.bit(bits, unsigned, "big");
    }
    ;
    /**
     * Bit field reader. Unsigned little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    async ubitle(bits) {
        return await this.bit(bits, true, "little");
    }
    ;
    /**
     * Bit field reader. Little endian read.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {Promise<number>}
     */
    async bitle(bits, unsigned) {
        return await this.bit(bits, unsigned, "little");
    }
    ;
    //
    // #region Generated mechanical aliases
    //
    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====
    // Behaviour is verified by test/aliases.parity.test.ts.
    /** Read a signed 8-bit integer. */
    async byte() { return await this.readByte(); }
    /** Read a signed 8-bit integer. */
    async int8() { return await this.readByte(); }
    /** Read an unsigned 8-bit integer. */
    async uint8() { return await this.readByte(true); }
    /** Read an unsigned 8-bit integer. */
    async ubyte() { return await this.readByte(true); }
    /** Read a signed 16-bit integer. */
    async int16() { return await this.readInt16(); }
    /** Read a signed 16-bit integer. */
    async short() { return await this.readInt16(); }
    /** Read a signed 16-bit integer. */
    async word() { return await this.readInt16(); }
    /** Read an unsigned 16-bit integer. */
    async uint16() { return await this.readInt16(true); }
    /** Read an unsigned 16-bit integer. */
    async ushort() { return await this.readInt16(true); }
    /** Read an unsigned 16-bit integer. */
    async uword() { return await this.readInt16(true); }
    /** Read a signed 16-bit integer (little-endian). */
    async int16le() { return await this.readInt16(false, "little"); }
    /** Read a signed 16-bit integer (little-endian). */
    async shortle() { return await this.readInt16(false, "little"); }
    /** Read a signed 16-bit integer (little-endian). */
    async wordle() { return await this.readInt16(false, "little"); }
    /** Read an unsigned 16-bit integer (little-endian). */
    async uint16le() { return await this.readInt16(true, "little"); }
    /** Read an unsigned 16-bit integer (little-endian). */
    async ushortle() { return await this.readInt16(true, "little"); }
    /** Read an unsigned 16-bit integer (little-endian). */
    async uwordle() { return await this.readInt16(true, "little"); }
    /** Read a signed 16-bit integer (big-endian). */
    async int16be() { return await this.readInt16(false, "big"); }
    /** Read a signed 16-bit integer (big-endian). */
    async shortbe() { return await this.readInt16(false, "big"); }
    /** Read a signed 16-bit integer (big-endian). */
    async wordbe() { return await this.readInt16(false, "big"); }
    /** Read an unsigned 16-bit integer (big-endian). */
    async uint16be() { return await this.readInt16(true, "big"); }
    /** Read an unsigned 16-bit integer (big-endian). */
    async ushortbe() { return await this.readInt16(true, "big"); }
    /** Read an unsigned 16-bit integer (big-endian). */
    async uwordbe() { return await this.readInt16(true, "big"); }
    /** Read a signed 32-bit integer. */
    async int() { return await this.readInt32(); }
    /** Read a signed 32-bit integer. */
    async dword() { return await this.readInt32(); }
    /** Read a signed 32-bit integer. */
    async int32() { return await this.readInt32(); }
    /** Read a signed 32-bit integer. */
    async long() { return await this.readInt32(); }
    /** Read an unsigned 32-bit integer. */
    async uint() { return await this.readInt32(true); }
    /** Read an unsigned 32-bit integer. */
    async udword() { return await this.readInt32(true); }
    /** Read an unsigned 32-bit integer. */
    async uint32() { return await this.readInt32(true); }
    /** Read an unsigned 32-bit integer. */
    async ulong() { return await this.readInt32(true); }
    /** Read a signed 32-bit integer (little-endian). */
    async intle() { return await this.readInt32(false, "little"); }
    /** Read a signed 32-bit integer (little-endian). */
    async dwordle() { return await this.readInt32(false, "little"); }
    /** Read a signed 32-bit integer (little-endian). */
    async int32le() { return await this.readInt32(false, "little"); }
    /** Read a signed 32-bit integer (little-endian). */
    async longle() { return await this.readInt32(false, "little"); }
    /** Read an unsigned 32-bit integer (little-endian). */
    async uintle() { return await this.readInt32(true, "little"); }
    /** Read an unsigned 32-bit integer (little-endian). */
    async udwordle() { return await this.readInt32(true, "little"); }
    /** Read an unsigned 32-bit integer (little-endian). */
    async uint32le() { return await this.readInt32(true, "little"); }
    /** Read an unsigned 32-bit integer (little-endian). */
    async ulongle() { return await this.readInt32(true, "little"); }
    /** Read a signed 32-bit integer (big-endian). */
    async intbe() { return await this.readInt32(false, "big"); }
    /** Read a signed 32-bit integer (big-endian). */
    async dwordbe() { return await this.readInt32(false, "big"); }
    /** Read a signed 32-bit integer (big-endian). */
    async int32be() { return await this.readInt32(false, "big"); }
    /** Read a signed 32-bit integer (big-endian). */
    async longbe() { return await this.readInt32(false, "big"); }
    /** Read an unsigned 32-bit integer (big-endian). */
    async uintbe() { return await this.readInt32(true, "big"); }
    /** Read an unsigned 32-bit integer (big-endian). */
    async udwordbe() { return await this.readInt32(true, "big"); }
    /** Read an unsigned 32-bit integer (big-endian). */
    async uint32be() { return await this.readInt32(true, "big"); }
    /** Read an unsigned 32-bit integer (big-endian). */
    async ulongbe() { return await this.readInt32(true, "big"); }
    /** Read a signed 64-bit integer. */
    async int64() { return await this.readInt64(); }
    /** Read a signed 64-bit integer. */
    async bigint() { return await this.readInt64(); }
    /** Read a signed 64-bit integer. */
    async quad() { return await this.readInt64(); }
    /** Read an unsigned 64-bit integer. */
    async uint64() { return await this.readInt64(true); }
    /** Read an unsigned 64-bit integer. */
    async ubigint() { return await this.readInt64(true); }
    /** Read an unsigned 64-bit integer. */
    async uquad() { return await this.readInt64(true); }
    /** Read a signed 64-bit integer (little-endian). */
    async int64le() { return await this.readInt64(false, "little"); }
    /** Read a signed 64-bit integer (little-endian). */
    async bigintle() { return await this.readInt64(false, "little"); }
    /** Read a signed 64-bit integer (little-endian). */
    async quadle() { return await this.readInt64(false, "little"); }
    /** Read an unsigned 64-bit integer (little-endian). */
    async uint64le() { return await this.readInt64(true, "little"); }
    /** Read an unsigned 64-bit integer (little-endian). */
    async ubigintle() { return await this.readInt64(true, "little"); }
    /** Read an unsigned 64-bit integer (little-endian). */
    async uquadle() { return await this.readInt64(true, "little"); }
    /** Read a signed 64-bit integer (big-endian). */
    async int64be() { return await this.readInt64(false, "big"); }
    /** Read a signed 64-bit integer (big-endian). */
    async bigintbe() { return await this.readInt64(false, "big"); }
    /** Read a signed 64-bit integer (big-endian). */
    async quadbe() { return await this.readInt64(false, "big"); }
    /** Read an unsigned 64-bit integer (big-endian). */
    async uint64be() { return await this.readInt64(true, "big"); }
    /** Read an unsigned 64-bit integer (big-endian). */
    async ubigintbe() { return await this.readInt64(true, "big"); }
    /** Read an unsigned 64-bit integer (big-endian). */
    async uquadbe() { return await this.readInt64(true, "big"); }
    /** Read a 32-bit float. */
    async float() { return await this.readFloat(); }
    /** Read a 32-bit float (little-endian). */
    async floatle() { return await this.readFloat("little"); }
    /** Read a 32-bit float (big-endian). */
    async floatbe() { return await this.readFloat("big"); }
    /** Read a 16-bit float. */
    async halffloat() { return await this.readHalfFloat(); }
    /** Read a 16-bit float. */
    async half() { return await this.readHalfFloat(); }
    /** Read a 16-bit float (little-endian). */
    async halffloatle() { return await this.readHalfFloat("little"); }
    /** Read a 16-bit float (little-endian). */
    async halfle() { return await this.readHalfFloat("little"); }
    /** Read a 16-bit float (big-endian). */
    async halffloatbe() { return await this.readHalfFloat("big"); }
    /** Read a 16-bit float (big-endian). */
    async halfbe() { return await this.readHalfFloat("big"); }
    /** Read a 64-bit float. */
    async doublefloat() { return await this.readDoubleFloat(); }
    /** Read a 64-bit float. */
    async dfloat() { return await this.readDoubleFloat(); }
    /** Read a 64-bit float (little-endian). */
    async doublefloatle() { return await this.readDoubleFloat("little"); }
    /** Read a 64-bit float (little-endian). */
    async dfloatle() { return await this.readDoubleFloat("little"); }
    /** Read a 64-bit float (big-endian). */
    async doublefloatbe() { return await this.readDoubleFloat("big"); }
    /** Read a 64-bit float (big-endian). */
    async dfloatbe() { return await this.readDoubleFloat("big"); }
    /** Read 1 signed bit. */
    async bit1() { return await this.bit(1); }
    /** Read 1 unsigned bit. */
    async ubit1() { return await this.bit(1, true); }
    /** Read 1 signed bit (little-endian). */
    async bit1le() { return await this.bit(1, undefined, "little"); }
    /** Read 1 unsigned bit (little-endian). */
    async ubit1le() { return await this.bit(1, true, "little"); }
    /** Read 1 signed bit (big-endian). */
    async bit1be() { return await this.bit(1, undefined, "big"); }
    /** Read 1 unsigned bit (big-endian). */
    async ubit1be() { return await this.bit(1, true, "big"); }
    /** Read 2 signed bits. */
    async bit2() { return await this.bit(2); }
    /** Read 2 unsigned bits. */
    async ubit2() { return await this.bit(2, true); }
    /** Read 2 signed bits (little-endian). */
    async bit2le() { return await this.bit(2, undefined, "little"); }
    /** Read 2 unsigned bits (little-endian). */
    async ubit2le() { return await this.bit(2, true, "little"); }
    /** Read 2 signed bits (big-endian). */
    async bit2be() { return await this.bit(2, undefined, "big"); }
    /** Read 2 unsigned bits (big-endian). */
    async ubit2be() { return await this.bit(2, true, "big"); }
    /** Read 3 signed bits. */
    async bit3() { return await this.bit(3); }
    /** Read 3 unsigned bits. */
    async ubit3() { return await this.bit(3, true); }
    /** Read 3 signed bits (little-endian). */
    async bit3le() { return await this.bit(3, undefined, "little"); }
    /** Read 3 unsigned bits (little-endian). */
    async ubit3le() { return await this.bit(3, true, "little"); }
    /** Read 3 signed bits (big-endian). */
    async bit3be() { return await this.bit(3, undefined, "big"); }
    /** Read 3 unsigned bits (big-endian). */
    async ubit3be() { return await this.bit(3, true, "big"); }
    /** Read 4 signed bits. */
    async bit4() { return await this.bit(4); }
    /** Read 4 unsigned bits. */
    async ubit4() { return await this.bit(4, true); }
    /** Read 4 signed bits (little-endian). */
    async bit4le() { return await this.bit(4, undefined, "little"); }
    /** Read 4 unsigned bits (little-endian). */
    async ubit4le() { return await this.bit(4, true, "little"); }
    /** Read 4 signed bits (big-endian). */
    async bit4be() { return await this.bit(4, undefined, "big"); }
    /** Read 4 unsigned bits (big-endian). */
    async ubit4be() { return await this.bit(4, true, "big"); }
    /** Read 5 signed bits. */
    async bit5() { return await this.bit(5); }
    /** Read 5 unsigned bits. */
    async ubit5() { return await this.bit(5, true); }
    /** Read 5 signed bits (little-endian). */
    async bit5le() { return await this.bit(5, undefined, "little"); }
    /** Read 5 unsigned bits (little-endian). */
    async ubit5le() { return await this.bit(5, true, "little"); }
    /** Read 5 signed bits (big-endian). */
    async bit5be() { return await this.bit(5, undefined, "big"); }
    /** Read 5 unsigned bits (big-endian). */
    async ubit5be() { return await this.bit(5, true, "big"); }
    /** Read 6 signed bits. */
    async bit6() { return await this.bit(6); }
    /** Read 6 unsigned bits. */
    async ubit6() { return await this.bit(6, true); }
    /** Read 6 signed bits (little-endian). */
    async bit6le() { return await this.bit(6, undefined, "little"); }
    /** Read 6 unsigned bits (little-endian). */
    async ubit6le() { return await this.bit(6, true, "little"); }
    /** Read 6 signed bits (big-endian). */
    async bit6be() { return await this.bit(6, undefined, "big"); }
    /** Read 6 unsigned bits (big-endian). */
    async ubit6be() { return await this.bit(6, true, "big"); }
    /** Read 7 signed bits. */
    async bit7() { return await this.bit(7); }
    /** Read 7 unsigned bits. */
    async ubit7() { return await this.bit(7, true); }
    /** Read 7 signed bits (little-endian). */
    async bit7le() { return await this.bit(7, undefined, "little"); }
    /** Read 7 unsigned bits (little-endian). */
    async ubit7le() { return await this.bit(7, true, "little"); }
    /** Read 7 signed bits (big-endian). */
    async bit7be() { return await this.bit(7, undefined, "big"); }
    /** Read 7 unsigned bits (big-endian). */
    async ubit7be() { return await this.bit(7, true, "big"); }
    /** Read 8 signed bits. */
    async bit8() { return await this.bit(8); }
    /** Read 8 unsigned bits. */
    async ubit8() { return await this.bit(8, true); }
    /** Read 8 signed bits (little-endian). */
    async bit8le() { return await this.bit(8, undefined, "little"); }
    /** Read 8 unsigned bits (little-endian). */
    async ubit8le() { return await this.bit(8, true, "little"); }
    /** Read 8 signed bits (big-endian). */
    async bit8be() { return await this.bit(8, undefined, "big"); }
    /** Read 8 unsigned bits (big-endian). */
    async ubit8be() { return await this.bit(8, true, "big"); }
    /** Read 9 signed bits. */
    async bit9() { return await this.bit(9); }
    /** Read 9 unsigned bits. */
    async ubit9() { return await this.bit(9, true); }
    /** Read 9 signed bits (little-endian). */
    async bit9le() { return await this.bit(9, undefined, "little"); }
    /** Read 9 unsigned bits (little-endian). */
    async ubit9le() { return await this.bit(9, true, "little"); }
    /** Read 9 signed bits (big-endian). */
    async bit9be() { return await this.bit(9, undefined, "big"); }
    /** Read 9 unsigned bits (big-endian). */
    async ubit9be() { return await this.bit(9, true, "big"); }
    /** Read 10 signed bits. */
    async bit10() { return await this.bit(10); }
    /** Read 10 unsigned bits. */
    async ubit10() { return await this.bit(10, true); }
    /** Read 10 signed bits (little-endian). */
    async bit10le() { return await this.bit(10, undefined, "little"); }
    /** Read 10 unsigned bits (little-endian). */
    async ubit10le() { return await this.bit(10, true, "little"); }
    /** Read 10 signed bits (big-endian). */
    async bit10be() { return await this.bit(10, undefined, "big"); }
    /** Read 10 unsigned bits (big-endian). */
    async ubit10be() { return await this.bit(10, true, "big"); }
    /** Read 11 signed bits. */
    async bit11() { return await this.bit(11); }
    /** Read 11 unsigned bits. */
    async ubit11() { return await this.bit(11, true); }
    /** Read 11 signed bits (little-endian). */
    async bit11le() { return await this.bit(11, undefined, "little"); }
    /** Read 11 unsigned bits (little-endian). */
    async ubit11le() { return await this.bit(11, true, "little"); }
    /** Read 11 signed bits (big-endian). */
    async bit11be() { return await this.bit(11, undefined, "big"); }
    /** Read 11 unsigned bits (big-endian). */
    async ubit11be() { return await this.bit(11, true, "big"); }
    /** Read 12 signed bits. */
    async bit12() { return await this.bit(12); }
    /** Read 12 unsigned bits. */
    async ubit12() { return await this.bit(12, true); }
    /** Read 12 signed bits (little-endian). */
    async bit12le() { return await this.bit(12, undefined, "little"); }
    /** Read 12 unsigned bits (little-endian). */
    async ubit12le() { return await this.bit(12, true, "little"); }
    /** Read 12 signed bits (big-endian). */
    async bit12be() { return await this.bit(12, undefined, "big"); }
    /** Read 12 unsigned bits (big-endian). */
    async ubit12be() { return await this.bit(12, true, "big"); }
    /** Read 13 signed bits. */
    async bit13() { return await this.bit(13); }
    /** Read 13 unsigned bits. */
    async ubit13() { return await this.bit(13, true); }
    /** Read 13 signed bits (little-endian). */
    async bit13le() { return await this.bit(13, undefined, "little"); }
    /** Read 13 unsigned bits (little-endian). */
    async ubit13le() { return await this.bit(13, true, "little"); }
    /** Read 13 signed bits (big-endian). */
    async bit13be() { return await this.bit(13, undefined, "big"); }
    /** Read 13 unsigned bits (big-endian). */
    async ubit13be() { return await this.bit(13, true, "big"); }
    /** Read 14 signed bits. */
    async bit14() { return await this.bit(14); }
    /** Read 14 unsigned bits. */
    async ubit14() { return await this.bit(14, true); }
    /** Read 14 signed bits (little-endian). */
    async bit14le() { return await this.bit(14, undefined, "little"); }
    /** Read 14 unsigned bits (little-endian). */
    async ubit14le() { return await this.bit(14, true, "little"); }
    /** Read 14 signed bits (big-endian). */
    async bit14be() { return await this.bit(14, undefined, "big"); }
    /** Read 14 unsigned bits (big-endian). */
    async ubit14be() { return await this.bit(14, true, "big"); }
    /** Read 15 signed bits. */
    async bit15() { return await this.bit(15); }
    /** Read 15 unsigned bits. */
    async ubit15() { return await this.bit(15, true); }
    /** Read 15 signed bits (little-endian). */
    async bit15le() { return await this.bit(15, undefined, "little"); }
    /** Read 15 unsigned bits (little-endian). */
    async ubit15le() { return await this.bit(15, true, "little"); }
    /** Read 15 signed bits (big-endian). */
    async bit15be() { return await this.bit(15, undefined, "big"); }
    /** Read 15 unsigned bits (big-endian). */
    async ubit15be() { return await this.bit(15, true, "big"); }
    /** Read 16 signed bits. */
    async bit16() { return await this.bit(16); }
    /** Read 16 unsigned bits. */
    async ubit16() { return await this.bit(16, true); }
    /** Read 16 signed bits (little-endian). */
    async bit16le() { return await this.bit(16, undefined, "little"); }
    /** Read 16 unsigned bits (little-endian). */
    async ubit16le() { return await this.bit(16, true, "little"); }
    /** Read 16 signed bits (big-endian). */
    async bit16be() { return await this.bit(16, undefined, "big"); }
    /** Read 16 unsigned bits (big-endian). */
    async ubit16be() { return await this.bit(16, true, "big"); }
    /** Read 17 signed bits. */
    async bit17() { return await this.bit(17); }
    /** Read 17 unsigned bits. */
    async ubit17() { return await this.bit(17, true); }
    /** Read 17 signed bits (little-endian). */
    async bit17le() { return await this.bit(17, undefined, "little"); }
    /** Read 17 unsigned bits (little-endian). */
    async ubit17le() { return await this.bit(17, true, "little"); }
    /** Read 17 signed bits (big-endian). */
    async bit17be() { return await this.bit(17, undefined, "big"); }
    /** Read 17 unsigned bits (big-endian). */
    async ubit17be() { return await this.bit(17, true, "big"); }
    /** Read 18 signed bits. */
    async bit18() { return await this.bit(18); }
    /** Read 18 unsigned bits. */
    async ubit18() { return await this.bit(18, true); }
    /** Read 18 signed bits (little-endian). */
    async bit18le() { return await this.bit(18, undefined, "little"); }
    /** Read 18 unsigned bits (little-endian). */
    async ubit18le() { return await this.bit(18, true, "little"); }
    /** Read 18 signed bits (big-endian). */
    async bit18be() { return await this.bit(18, undefined, "big"); }
    /** Read 18 unsigned bits (big-endian). */
    async ubit18be() { return await this.bit(18, true, "big"); }
    /** Read 19 signed bits. */
    async bit19() { return await this.bit(19); }
    /** Read 19 unsigned bits. */
    async ubit19() { return await this.bit(19, true); }
    /** Read 19 signed bits (little-endian). */
    async bit19le() { return await this.bit(19, undefined, "little"); }
    /** Read 19 unsigned bits (little-endian). */
    async ubit19le() { return await this.bit(19, true, "little"); }
    /** Read 19 signed bits (big-endian). */
    async bit19be() { return await this.bit(19, undefined, "big"); }
    /** Read 19 unsigned bits (big-endian). */
    async ubit19be() { return await this.bit(19, true, "big"); }
    /** Read 20 signed bits. */
    async bit20() { return await this.bit(20); }
    /** Read 20 unsigned bits. */
    async ubit20() { return await this.bit(20, true); }
    /** Read 20 signed bits (little-endian). */
    async bit20le() { return await this.bit(20, undefined, "little"); }
    /** Read 20 unsigned bits (little-endian). */
    async ubit20le() { return await this.bit(20, true, "little"); }
    /** Read 20 signed bits (big-endian). */
    async bit20be() { return await this.bit(20, undefined, "big"); }
    /** Read 20 unsigned bits (big-endian). */
    async ubit20be() { return await this.bit(20, true, "big"); }
    /** Read 21 signed bits. */
    async bit21() { return await this.bit(21); }
    /** Read 21 unsigned bits. */
    async ubit21() { return await this.bit(21, true); }
    /** Read 21 signed bits (little-endian). */
    async bit21le() { return await this.bit(21, undefined, "little"); }
    /** Read 21 unsigned bits (little-endian). */
    async ubit21le() { return await this.bit(21, true, "little"); }
    /** Read 21 signed bits (big-endian). */
    async bit21be() { return await this.bit(21, undefined, "big"); }
    /** Read 21 unsigned bits (big-endian). */
    async ubit21be() { return await this.bit(21, true, "big"); }
    /** Read 22 signed bits. */
    async bit22() { return await this.bit(22); }
    /** Read 22 unsigned bits. */
    async ubit22() { return await this.bit(22, true); }
    /** Read 22 signed bits (little-endian). */
    async bit22le() { return await this.bit(22, undefined, "little"); }
    /** Read 22 unsigned bits (little-endian). */
    async ubit22le() { return await this.bit(22, true, "little"); }
    /** Read 22 signed bits (big-endian). */
    async bit22be() { return await this.bit(22, undefined, "big"); }
    /** Read 22 unsigned bits (big-endian). */
    async ubit22be() { return await this.bit(22, true, "big"); }
    /** Read 23 signed bits. */
    async bit23() { return await this.bit(23); }
    /** Read 23 unsigned bits. */
    async ubit23() { return await this.bit(23, true); }
    /** Read 23 signed bits (little-endian). */
    async bit23le() { return await this.bit(23, undefined, "little"); }
    /** Read 23 unsigned bits (little-endian). */
    async ubit23le() { return await this.bit(23, true, "little"); }
    /** Read 23 signed bits (big-endian). */
    async bit23be() { return await this.bit(23, undefined, "big"); }
    /** Read 23 unsigned bits (big-endian). */
    async ubit23be() { return await this.bit(23, true, "big"); }
    /** Read 24 signed bits. */
    async bit24() { return await this.bit(24); }
    /** Read 24 unsigned bits. */
    async ubit24() { return await this.bit(24, true); }
    /** Read 24 signed bits (little-endian). */
    async bit24le() { return await this.bit(24, undefined, "little"); }
    /** Read 24 unsigned bits (little-endian). */
    async ubit24le() { return await this.bit(24, true, "little"); }
    /** Read 24 signed bits (big-endian). */
    async bit24be() { return await this.bit(24, undefined, "big"); }
    /** Read 24 unsigned bits (big-endian). */
    async ubit24be() { return await this.bit(24, true, "big"); }
    /** Read 25 signed bits. */
    async bit25() { return await this.bit(25); }
    /** Read 25 unsigned bits. */
    async ubit25() { return await this.bit(25, true); }
    /** Read 25 signed bits (little-endian). */
    async bit25le() { return await this.bit(25, undefined, "little"); }
    /** Read 25 unsigned bits (little-endian). */
    async ubit25le() { return await this.bit(25, true, "little"); }
    /** Read 25 signed bits (big-endian). */
    async bit25be() { return await this.bit(25, undefined, "big"); }
    /** Read 25 unsigned bits (big-endian). */
    async ubit25be() { return await this.bit(25, true, "big"); }
    /** Read 26 signed bits. */
    async bit26() { return await this.bit(26); }
    /** Read 26 unsigned bits. */
    async ubit26() { return await this.bit(26, true); }
    /** Read 26 signed bits (little-endian). */
    async bit26le() { return await this.bit(26, undefined, "little"); }
    /** Read 26 unsigned bits (little-endian). */
    async ubit26le() { return await this.bit(26, true, "little"); }
    /** Read 26 signed bits (big-endian). */
    async bit26be() { return await this.bit(26, undefined, "big"); }
    /** Read 26 unsigned bits (big-endian). */
    async ubit26be() { return await this.bit(26, true, "big"); }
    /** Read 27 signed bits. */
    async bit27() { return await this.bit(27); }
    /** Read 27 unsigned bits. */
    async ubit27() { return await this.bit(27, true); }
    /** Read 27 signed bits (little-endian). */
    async bit27le() { return await this.bit(27, undefined, "little"); }
    /** Read 27 unsigned bits (little-endian). */
    async ubit27le() { return await this.bit(27, true, "little"); }
    /** Read 27 signed bits (big-endian). */
    async bit27be() { return await this.bit(27, undefined, "big"); }
    /** Read 27 unsigned bits (big-endian). */
    async ubit27be() { return await this.bit(27, true, "big"); }
    /** Read 28 signed bits. */
    async bit28() { return await this.bit(28); }
    /** Read 28 unsigned bits. */
    async ubit28() { return await this.bit(28, true); }
    /** Read 28 signed bits (little-endian). */
    async bit28le() { return await this.bit(28, undefined, "little"); }
    /** Read 28 unsigned bits (little-endian). */
    async ubit28le() { return await this.bit(28, true, "little"); }
    /** Read 28 signed bits (big-endian). */
    async bit28be() { return await this.bit(28, undefined, "big"); }
    /** Read 28 unsigned bits (big-endian). */
    async ubit28be() { return await this.bit(28, true, "big"); }
    /** Read 29 signed bits. */
    async bit29() { return await this.bit(29); }
    /** Read 29 unsigned bits. */
    async ubit29() { return await this.bit(29, true); }
    /** Read 29 signed bits (little-endian). */
    async bit29le() { return await this.bit(29, undefined, "little"); }
    /** Read 29 unsigned bits (little-endian). */
    async ubit29le() { return await this.bit(29, true, "little"); }
    /** Read 29 signed bits (big-endian). */
    async bit29be() { return await this.bit(29, undefined, "big"); }
    /** Read 29 unsigned bits (big-endian). */
    async ubit29be() { return await this.bit(29, true, "big"); }
    /** Read 30 signed bits. */
    async bit30() { return await this.bit(30); }
    /** Read 30 unsigned bits. */
    async ubit30() { return await this.bit(30, true); }
    /** Read 30 signed bits (little-endian). */
    async bit30le() { return await this.bit(30, undefined, "little"); }
    /** Read 30 unsigned bits (little-endian). */
    async ubit30le() { return await this.bit(30, true, "little"); }
    /** Read 30 signed bits (big-endian). */
    async bit30be() { return await this.bit(30, undefined, "big"); }
    /** Read 30 unsigned bits (big-endian). */
    async ubit30be() { return await this.bit(30, true, "big"); }
    /** Read 31 signed bits. */
    async bit31() { return await this.bit(31); }
    /** Read 31 unsigned bits. */
    async ubit31() { return await this.bit(31, true); }
    /** Read 31 signed bits (little-endian). */
    async bit31le() { return await this.bit(31, undefined, "little"); }
    /** Read 31 unsigned bits (little-endian). */
    async ubit31le() { return await this.bit(31, true, "little"); }
    /** Read 31 signed bits (big-endian). */
    async bit31be() { return await this.bit(31, undefined, "big"); }
    /** Read 31 unsigned bits (big-endian). */
    async ubit31be() { return await this.bit(31, true, "big"); }
    /** Read 32 signed bits. */
    async bit32() { return await this.bit(32); }
    /** Read 32 unsigned bits. */
    async ubit32() { return await this.bit(32, true); }
    /** Read 32 signed bits (little-endian). */
    async bit32le() { return await this.bit(32, undefined, "little"); }
    /** Read 32 unsigned bits (little-endian). */
    async ubit32le() { return await this.bit(32, true, "little"); }
    /** Read 32 signed bits (big-endian). */
    async bit32be() { return await this.bit(32, undefined, "big"); }
    /** Read 32 unsigned bits (big-endian). */
    async ubit32be() { return await this.bit(32, true, "big"); }
    // #endregion Generated mechanical aliases
    //
    // #region string reader
    //
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
    async string(options) {
        return await this.readString(options);
    }
    ;
    /**
    * Reads string using setting from .strDefaults
    *
    * Default is ``utf-8``
    *
    * @returns {Promise<string>}
    */
    async str() {
        return await this.readString(this.strDefaults);
    }
    ;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async utf8string(length, terminateValue, stripNull) {
        return await this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    ;
    /**
    * Reads UTF-8 (C) string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async cstring(length, terminateValue, stripNull) {
        return await this.utf8string(length, terminateValue, stripNull);
    }
    ;
    /**
    * Reads ANSI string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async ansistring(length, terminateValue, stripNull) {
        return await this.string({ stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    ;
    /**
    * Reads latin1 string.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async latin1string(length, terminateValue, stripNull) {
        return await this.string({ stringType: "utf-8", encoding: "iso-8859-1", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    ;
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
    async utf16string(length, terminateValue, stripNull, endian) {
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    }
    ;
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
    async unistring(length, terminateValue, stripNull, endian) {
        return await this.utf16string(length, terminateValue, stripNull, endian);
    }
    ;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async utf16stringle(length, terminateValue, stripNull) {
        return await this.utf16string(length, terminateValue, stripNull, "little");
    }
    ;
    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async unistringle(length, terminateValue, stripNull) {
        return await this.utf16stringle(length, terminateValue, stripNull);
    }
    ;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async utf16stringbe(length, terminateValue, stripNull) {
        return await this.utf16string(length, terminateValue, stripNull, "big");
    }
    ;
    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async unistringbe(length, terminateValue, stripNull) {
        return await this.utf16stringbe(length, terminateValue, stripNull);
    }
    ;
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
    async utf32string(length, terminateValue, stripNull, endian) {
        return await this.string({ stringType: "utf-32", encoding: "utf-32", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    }
    ;
    /**
    * Reads UTF-32 (Unicode) string in little endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async utf32stringle(length, terminateValue, stripNull) {
        return await this.utf32string(length, terminateValue, stripNull, "little");
    }
    ;
    /**
    * Reads UTF-32 (Unicode) string in big endian order.
    *
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async utf32stringbe(length, terminateValue, stripNull) {
        return await this.utf32string(length, terminateValue, stripNull, "big");
    }
    ;
    /**
    * Reads Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async pstring(lengthReadSize, stripNull, endian) {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    }
    ;
    /**
    * Reads Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstringle(lengthReadSize, stripNull) {
        return await this.pstring(lengthReadSize, stripNull, "little");
    }
    ;
    /**
    * Reads Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstringbe(lengthReadSize, stripNull) {
        return await this.pstring(lengthReadSize, stripNull, "big");
    }
    ;
    /**
    * Reads Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async pstring1(stripNull, endian) {
        return await this.pstring(1, stripNull, endian);
    }
    ;
    /**
    * Reads Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstring1le(stripNull) {
        return await this.pstring1(stripNull, "little");
    }
    ;
    /**
    * Reads Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstring1be(stripNull) {
        return await this.pstring1(stripNull, "big");
    }
    ;
    /**
    * Reads Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async pstring2(stripNull, endian) {
        return await this.pstring(2, stripNull, endian);
    }
    ;
    /**
    * Reads Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstring2le(stripNull) {
        return await this.pstring2(stripNull, "little");
    }
    ;
    /**
    * Reads Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstring2be(stripNull) {
        return await this.pstring2(stripNull, "big");
    }
    ;
    /**
    * Reads Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async pstring4(stripNull, endian) {
        return await this.pstring(4, stripNull, endian);
    }
    ;
    /**
    * Reads Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstring4le(stripNull) {
        return await this.pstring4(stripNull, "little");
    }
    ;
    /**
    * Reads Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async pstring4be(stripNull) {
        return await this.pstring4(stripNull, "big");
    }
    ;
    /**
    * Reads Wide-Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async wpstring(lengthReadSize, stripNull, endian) {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async wpstringle(lengthReadSize, stripNull) {
        return await this.wpstring(lengthReadSize, stripNull, "little");
    }
    ;
    /**
    * Reads Wide-Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async wpstringbe(lengthReadSize, stripNull) {
        return await this.wpstring(lengthReadSize, stripNull, "big");
    }
    ;
    /**
    * Reads Wide-Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async wpstring1(stripNull, endian) {
        return await this.wpstring(1, stripNull, endian);
    }
    ;
    /**
    * Reads Wide-Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async wpstring1le(stripNull) {
        return await this.wpstring1(stripNull, "little");
    }
    ;
    /**
    * Reads Wide-Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async wpstring1be(stripNull) {
        return await this.wpstring1(stripNull, "big");
    }
    ;
    /**
    * Reads Wide-Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async wpstring2(stripNull, endian) {
        return await this.wpstring(2, stripNull, endian);
    }
    ;
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async wpstring2le(stripNull) {
        return await this.wpstring2(stripNull, "little");
    }
    ;
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async wpstring2be(stripNull) {
        return await this.wpstring2(stripNull, "big");
    }
    ;
    /**
    * Reads Wide-Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async wpstring4(stripNull, endian) {
        return await this.wpstring(4, stripNull, endian);
    }
    ;
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async wpstring4le(stripNull) {
        return await this.wpstring4(stripNull, "little");
    }
    ;
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async wpstring4be(stripNull) {
        return await this.wpstring4(stripNull, "big");
    }
    ;
    /**
    * Reads Double Wide Pascal string.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async dwpstring(lengthReadSize, stripNull, endian) {
        return await this.string({ stringType: "double-wide-pascal", encoding: "utf-32", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    }
    ;
    /**
    * Reads Double Wide Pascal string in little endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async dwpstringle(lengthReadSize, stripNull) {
        return await this.dwpstring(lengthReadSize, stripNull, "little");
    }
    ;
    /**
    * Reads Double Wide Pascal string in big endian.
    *
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async dwpstringbe(lengthReadSize, stripNull) {
        return await this.dwpstring(lengthReadSize, stripNull, "big");
    }
    ;
    /**
    * Reads Double Wide Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async dwpstring1(stripNull, endian) {
        return await this.dwpstring(1, stripNull, endian);
    }
    ;
    /**
    * Reads Double Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async dwpstring1le(stripNull) {
        return await this.dwpstring1(stripNull, "little");
    }
    ;
    /**
    * Reads Double WidePascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async dwpstring1be(stripNull) {
        return await this.dwpstring1(stripNull, "big");
    }
    ;
    /**
    * Reads Double Wide Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async dwpstring2(stripNull, endian) {
        return await this.dwpstring(2, stripNull, endian);
    }
    ;
    /**
    * Reads Double Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async dwpstring2le(stripNull) {
        return await this.dwpstring2(stripNull, "little");
    }
    ;
    /**
    * Reads Double Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async dwpstring2be(stripNull) {
        return await this.dwpstring2(stripNull, "big");
    }
    ;
    /**
    * Reads Double Wide Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {Promise<string>}
    */
    async dwpstring4(stripNull, endian) {
        return await this.dwpstring(4, stripNull, endian);
    }
    ;
    /**
    * Reads Double Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async dwpstring4le(stripNull) {
        return await this.dwpstring4(stripNull, "little");
    }
    ;
    /**
    * Reads Double Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {Promise<string>}
    */
    async dwpstring4be(stripNull) {
        return await this.dwpstring4(stripNull, "big");
    }
    ;
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
class BiWriterAsync extends BiEngine {
    constructor(input, options = {}) {
        const growthIncrement = options.growthIncrement ?? 0x100000;
        if (input == undefined) {
            input = new Uint8Array(growthIncrement);
            console.warn(`BiWriterAsync started without data. Creating Uint8Array with growthIncrement.`);
        }
        // Merge over defaults into a fresh object; never mutate the caller's options.
        super(input, {
            byteOffset: options.byteOffset ?? 0,
            bitOffset: options.bitOffset ?? 0,
            endianness: options.endianness ?? "little",
            strict: options.strict ?? false,
            growthIncrement: growthIncrement,
            enforceBigInt: options.enforceBigInt ?? false,
            readOnly: options.readOnly ?? false,
            windowSize: options.windowSize ?? 0x1000,
        });
    }
    ;
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
    static async create(input, options = {}) {
        const instance = new BiWriterAsync(input, options);
        await instance.open();
        return instance;
    }
    ;
    //
    // #region Bit Aliases
    //
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
    async bit(value, bits, unsigned, endian) {
        return await this.writeBit(value, bits, unsigned, endian);
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {endian} endian - ``big`` or ``little``
     */
    async ubit(value, bits, endian) {
        return await this.writeBit(value, bits, true, endian);
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     */
    async bitbe(value, bits, unsigned) {
        return await this.bit(value, bits, unsigned, "big");
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     */
    async ubitbe(value, bits) {
        return await this.bit(value, bits, true, "big");
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     */
    async ubitle(value, bits) {
        return await this.bit(value, bits, true, "little");
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     */
    async bitle(value, bits, unsigned) {
        return await this.bit(value, bits, unsigned, "little");
    }
    ;
    //
    // #region Generated mechanical aliases
    //
    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====
    // Behaviour is verified by test/aliases.parity.test.ts.
    /** Write a signed 8-bit integer. */
    async byte(value) { await this.writeByte(value); }
    /** Write a signed 8-bit integer. */
    async int8(value) { await this.writeByte(value); }
    /** Write an unsigned 8-bit integer. */
    async uint8(value) { await this.writeByte(value, true); }
    /** Write an unsigned 8-bit integer. */
    async ubyte(value) { await this.writeByte(value, true); }
    /** Write a signed 16-bit integer. */
    async int16(value) { await this.writeInt16(value); }
    /** Write a signed 16-bit integer. */
    async short(value) { await this.writeInt16(value); }
    /** Write a signed 16-bit integer. */
    async word(value) { await this.writeInt16(value); }
    /** Write an unsigned 16-bit integer. */
    async uint16(value) { await this.writeInt16(value, true); }
    /** Write an unsigned 16-bit integer. */
    async ushort(value) { await this.writeInt16(value, true); }
    /** Write an unsigned 16-bit integer. */
    async uword(value) { await this.writeInt16(value, true); }
    /** Write a signed 16-bit integer (little-endian). */
    async int16le(value) { await this.writeInt16(value, false, "little"); }
    /** Write a signed 16-bit integer (little-endian). */
    async shortle(value) { await this.writeInt16(value, false, "little"); }
    /** Write a signed 16-bit integer (little-endian). */
    async wordle(value) { await this.writeInt16(value, false, "little"); }
    /** Write an unsigned 16-bit integer (little-endian). */
    async uint16le(value) { await this.writeInt16(value, true, "little"); }
    /** Write an unsigned 16-bit integer (little-endian). */
    async ushortle(value) { await this.writeInt16(value, true, "little"); }
    /** Write an unsigned 16-bit integer (little-endian). */
    async uwordle(value) { await this.writeInt16(value, true, "little"); }
    /** Write a signed 16-bit integer (big-endian). */
    async int16be(value) { await this.writeInt16(value, false, "big"); }
    /** Write a signed 16-bit integer (big-endian). */
    async shortbe(value) { await this.writeInt16(value, false, "big"); }
    /** Write a signed 16-bit integer (big-endian). */
    async wordbe(value) { await this.writeInt16(value, false, "big"); }
    /** Write an unsigned 16-bit integer (big-endian). */
    async uint16be(value) { await this.writeInt16(value, true, "big"); }
    /** Write an unsigned 16-bit integer (big-endian). */
    async ushortbe(value) { await this.writeInt16(value, true, "big"); }
    /** Write an unsigned 16-bit integer (big-endian). */
    async uwordbe(value) { await this.writeInt16(value, true, "big"); }
    /** Write a signed 32-bit integer. */
    async int(value) { await this.writeInt32(value); }
    /** Write a signed 32-bit integer. */
    async dword(value) { await this.writeInt32(value); }
    /** Write a signed 32-bit integer. */
    async int32(value) { await this.writeInt32(value); }
    /** Write a signed 32-bit integer. */
    async long(value) { await this.writeInt32(value); }
    /** Write an unsigned 32-bit integer. */
    async uint(value) { await this.writeInt32(value, true); }
    /** Write an unsigned 32-bit integer. */
    async udword(value) { await this.writeInt32(value, true); }
    /** Write an unsigned 32-bit integer. */
    async uint32(value) { await this.writeInt32(value, true); }
    /** Write an unsigned 32-bit integer. */
    async ulong(value) { await this.writeInt32(value, true); }
    /** Write a signed 32-bit integer (little-endian). */
    async intle(value) { await this.writeInt32(value, false, "little"); }
    /** Write a signed 32-bit integer (little-endian). */
    async dwordle(value) { await this.writeInt32(value, false, "little"); }
    /** Write a signed 32-bit integer (little-endian). */
    async int32le(value) { await this.writeInt32(value, false, "little"); }
    /** Write a signed 32-bit integer (little-endian). */
    async longle(value) { await this.writeInt32(value, false, "little"); }
    /** Write an unsigned 32-bit integer (little-endian). */
    async uintle(value) { await this.writeInt32(value, true, "little"); }
    /** Write an unsigned 32-bit integer (little-endian). */
    async udwordle(value) { await this.writeInt32(value, true, "little"); }
    /** Write an unsigned 32-bit integer (little-endian). */
    async uint32le(value) { await this.writeInt32(value, true, "little"); }
    /** Write an unsigned 32-bit integer (little-endian). */
    async ulongle(value) { await this.writeInt32(value, true, "little"); }
    /** Write a signed 32-bit integer (big-endian). */
    async intbe(value) { await this.writeInt32(value, false, "big"); }
    /** Write a signed 32-bit integer (big-endian). */
    async dwordbe(value) { await this.writeInt32(value, false, "big"); }
    /** Write a signed 32-bit integer (big-endian). */
    async int32be(value) { await this.writeInt32(value, false, "big"); }
    /** Write a signed 32-bit integer (big-endian). */
    async longbe(value) { await this.writeInt32(value, false, "big"); }
    /** Write an unsigned 32-bit integer (big-endian). */
    async uintbe(value) { await this.writeInt32(value, true, "big"); }
    /** Write an unsigned 32-bit integer (big-endian). */
    async udwordbe(value) { await this.writeInt32(value, true, "big"); }
    /** Write an unsigned 32-bit integer (big-endian). */
    async uint32be(value) { await this.writeInt32(value, true, "big"); }
    /** Write an unsigned 32-bit integer (big-endian). */
    async ulongbe(value) { await this.writeInt32(value, true, "big"); }
    /** Write a signed 64-bit integer. */
    async int64(value) { await this.writeInt64(value); }
    /** Write a signed 64-bit integer. */
    async bigint(value) { await this.writeInt64(value); }
    /** Write a signed 64-bit integer. */
    async quad(value) { await this.writeInt64(value); }
    /** Write an unsigned 64-bit integer. */
    async uint64(value) { await this.writeInt64(value, true); }
    /** Write an unsigned 64-bit integer. */
    async ubigint(value) { await this.writeInt64(value, true); }
    /** Write an unsigned 64-bit integer. */
    async uquad(value) { await this.writeInt64(value, true); }
    /** Write a signed 64-bit integer (little-endian). */
    async int64le(value) { await this.writeInt64(value, false, "little"); }
    /** Write a signed 64-bit integer (little-endian). */
    async bigintle(value) { await this.writeInt64(value, false, "little"); }
    /** Write a signed 64-bit integer (little-endian). */
    async quadle(value) { await this.writeInt64(value, false, "little"); }
    /** Write an unsigned 64-bit integer (little-endian). */
    async uint64le(value) { await this.writeInt64(value, true, "little"); }
    /** Write an unsigned 64-bit integer (little-endian). */
    async ubigintle(value) { await this.writeInt64(value, true, "little"); }
    /** Write an unsigned 64-bit integer (little-endian). */
    async uquadle(value) { await this.writeInt64(value, true, "little"); }
    /** Write a signed 64-bit integer (big-endian). */
    async int64be(value) { await this.writeInt64(value, false, "big"); }
    /** Write a signed 64-bit integer (big-endian). */
    async bigintbe(value) { await this.writeInt64(value, false, "big"); }
    /** Write a signed 64-bit integer (big-endian). */
    async quadbe(value) { await this.writeInt64(value, false, "big"); }
    /** Write an unsigned 64-bit integer (big-endian). */
    async uint64be(value) { await this.writeInt64(value, true, "big"); }
    /** Write an unsigned 64-bit integer (big-endian). */
    async ubigintbe(value) { await this.writeInt64(value, true, "big"); }
    /** Write an unsigned 64-bit integer (big-endian). */
    async uquadbe(value) { await this.writeInt64(value, true, "big"); }
    /** Write a 32-bit float. */
    async float(value) { await this.writeFloat(value); }
    /** Write a 32-bit float (little-endian). */
    async floatle(value) { await this.writeFloat(value, "little"); }
    /** Write a 32-bit float (big-endian). */
    async floatbe(value) { await this.writeFloat(value, "big"); }
    /** Write a 16-bit float. */
    async halffloat(value) { await this.writeHalfFloat(value); }
    /** Write a 16-bit float. */
    async half(value) { await this.writeHalfFloat(value); }
    /** Write a 16-bit float (little-endian). */
    async halffloatle(value) { await this.writeHalfFloat(value, "little"); }
    /** Write a 16-bit float (little-endian). */
    async halfle(value) { await this.writeHalfFloat(value, "little"); }
    /** Write a 16-bit float (big-endian). */
    async halffloatbe(value) { await this.writeHalfFloat(value, "big"); }
    /** Write a 16-bit float (big-endian). */
    async halfbe(value) { await this.writeHalfFloat(value, "big"); }
    /** Write a 64-bit float. */
    async doublefloat(value) { await this.writeDoubleFloat(value); }
    /** Write a 64-bit float. */
    async dfloat(value) { await this.writeDoubleFloat(value); }
    /** Write a 64-bit float (little-endian). */
    async doublefloatle(value) { await this.writeDoubleFloat(value, "little"); }
    /** Write a 64-bit float (little-endian). */
    async dfloatle(value) { await this.writeDoubleFloat(value, "little"); }
    /** Write a 64-bit float (big-endian). */
    async doublefloatbe(value) { await this.writeDoubleFloat(value, "big"); }
    /** Write a 64-bit float (big-endian). */
    async dfloatbe(value) { await this.writeDoubleFloat(value, "big"); }
    /** Write 1 signed bit. */
    async bit1(value) { await this.bit(value, 1); }
    /** Write 1 unsigned bit. */
    async ubit1(value) { await this.bit(value, 1, true); }
    /** Write 1 signed bit (little-endian). */
    async bit1le(value) { await this.bit(value, 1, undefined, "little"); }
    /** Write 1 unsigned bit (little-endian). */
    async ubit1le(value) { await this.bit(value, 1, true, "little"); }
    /** Write 1 signed bit (big-endian). */
    async bit1be(value) { await this.bit(value, 1, undefined, "big"); }
    /** Write 1 unsigned bit (big-endian). */
    async ubit1be(value) { await this.bit(value, 1, true, "big"); }
    /** Write 2 signed bits. */
    async bit2(value) { await this.bit(value, 2); }
    /** Write 2 unsigned bits. */
    async ubit2(value) { await this.bit(value, 2, true); }
    /** Write 2 signed bits (little-endian). */
    async bit2le(value) { await this.bit(value, 2, undefined, "little"); }
    /** Write 2 unsigned bits (little-endian). */
    async ubit2le(value) { await this.bit(value, 2, true, "little"); }
    /** Write 2 signed bits (big-endian). */
    async bit2be(value) { await this.bit(value, 2, undefined, "big"); }
    /** Write 2 unsigned bits (big-endian). */
    async ubit2be(value) { await this.bit(value, 2, true, "big"); }
    /** Write 3 signed bits. */
    async bit3(value) { await this.bit(value, 3); }
    /** Write 3 unsigned bits. */
    async ubit3(value) { await this.bit(value, 3, true); }
    /** Write 3 signed bits (little-endian). */
    async bit3le(value) { await this.bit(value, 3, undefined, "little"); }
    /** Write 3 unsigned bits (little-endian). */
    async ubit3le(value) { await this.bit(value, 3, true, "little"); }
    /** Write 3 signed bits (big-endian). */
    async bit3be(value) { await this.bit(value, 3, undefined, "big"); }
    /** Write 3 unsigned bits (big-endian). */
    async ubit3be(value) { await this.bit(value, 3, true, "big"); }
    /** Write 4 signed bits. */
    async bit4(value) { await this.bit(value, 4); }
    /** Write 4 unsigned bits. */
    async ubit4(value) { await this.bit(value, 4, true); }
    /** Write 4 signed bits (little-endian). */
    async bit4le(value) { await this.bit(value, 4, undefined, "little"); }
    /** Write 4 unsigned bits (little-endian). */
    async ubit4le(value) { await this.bit(value, 4, true, "little"); }
    /** Write 4 signed bits (big-endian). */
    async bit4be(value) { await this.bit(value, 4, undefined, "big"); }
    /** Write 4 unsigned bits (big-endian). */
    async ubit4be(value) { await this.bit(value, 4, true, "big"); }
    /** Write 5 signed bits. */
    async bit5(value) { await this.bit(value, 5); }
    /** Write 5 unsigned bits. */
    async ubit5(value) { await this.bit(value, 5, true); }
    /** Write 5 signed bits (little-endian). */
    async bit5le(value) { await this.bit(value, 5, undefined, "little"); }
    /** Write 5 unsigned bits (little-endian). */
    async ubit5le(value) { await this.bit(value, 5, true, "little"); }
    /** Write 5 signed bits (big-endian). */
    async bit5be(value) { await this.bit(value, 5, undefined, "big"); }
    /** Write 5 unsigned bits (big-endian). */
    async ubit5be(value) { await this.bit(value, 5, true, "big"); }
    /** Write 6 signed bits. */
    async bit6(value) { await this.bit(value, 6); }
    /** Write 6 unsigned bits. */
    async ubit6(value) { await this.bit(value, 6, true); }
    /** Write 6 signed bits (little-endian). */
    async bit6le(value) { await this.bit(value, 6, undefined, "little"); }
    /** Write 6 unsigned bits (little-endian). */
    async ubit6le(value) { await this.bit(value, 6, true, "little"); }
    /** Write 6 signed bits (big-endian). */
    async bit6be(value) { await this.bit(value, 6, undefined, "big"); }
    /** Write 6 unsigned bits (big-endian). */
    async ubit6be(value) { await this.bit(value, 6, true, "big"); }
    /** Write 7 signed bits. */
    async bit7(value) { await this.bit(value, 7); }
    /** Write 7 unsigned bits. */
    async ubit7(value) { await this.bit(value, 7, true); }
    /** Write 7 signed bits (little-endian). */
    async bit7le(value) { await this.bit(value, 7, undefined, "little"); }
    /** Write 7 unsigned bits (little-endian). */
    async ubit7le(value) { await this.bit(value, 7, true, "little"); }
    /** Write 7 signed bits (big-endian). */
    async bit7be(value) { await this.bit(value, 7, undefined, "big"); }
    /** Write 7 unsigned bits (big-endian). */
    async ubit7be(value) { await this.bit(value, 7, true, "big"); }
    /** Write 8 signed bits. */
    async bit8(value) { await this.bit(value, 8); }
    /** Write 8 unsigned bits. */
    async ubit8(value) { await this.bit(value, 8, true); }
    /** Write 8 signed bits (little-endian). */
    async bit8le(value) { await this.bit(value, 8, undefined, "little"); }
    /** Write 8 unsigned bits (little-endian). */
    async ubit8le(value) { await this.bit(value, 8, true, "little"); }
    /** Write 8 signed bits (big-endian). */
    async bit8be(value) { await this.bit(value, 8, undefined, "big"); }
    /** Write 8 unsigned bits (big-endian). */
    async ubit8be(value) { await this.bit(value, 8, true, "big"); }
    /** Write 9 signed bits. */
    async bit9(value) { await this.bit(value, 9); }
    /** Write 9 unsigned bits. */
    async ubit9(value) { await this.bit(value, 9, true); }
    /** Write 9 signed bits (little-endian). */
    async bit9le(value) { await this.bit(value, 9, undefined, "little"); }
    /** Write 9 unsigned bits (little-endian). */
    async ubit9le(value) { await this.bit(value, 9, true, "little"); }
    /** Write 9 signed bits (big-endian). */
    async bit9be(value) { await this.bit(value, 9, undefined, "big"); }
    /** Write 9 unsigned bits (big-endian). */
    async ubit9be(value) { await this.bit(value, 9, true, "big"); }
    /** Write 10 signed bits. */
    async bit10(value) { await this.bit(value, 10); }
    /** Write 10 unsigned bits. */
    async ubit10(value) { await this.bit(value, 10, true); }
    /** Write 10 signed bits (little-endian). */
    async bit10le(value) { await this.bit(value, 10, undefined, "little"); }
    /** Write 10 unsigned bits (little-endian). */
    async ubit10le(value) { await this.bit(value, 10, true, "little"); }
    /** Write 10 signed bits (big-endian). */
    async bit10be(value) { await this.bit(value, 10, undefined, "big"); }
    /** Write 10 unsigned bits (big-endian). */
    async ubit10be(value) { await this.bit(value, 10, true, "big"); }
    /** Write 11 signed bits. */
    async bit11(value) { await this.bit(value, 11); }
    /** Write 11 unsigned bits. */
    async ubit11(value) { await this.bit(value, 11, true); }
    /** Write 11 signed bits (little-endian). */
    async bit11le(value) { await this.bit(value, 11, undefined, "little"); }
    /** Write 11 unsigned bits (little-endian). */
    async ubit11le(value) { await this.bit(value, 11, true, "little"); }
    /** Write 11 signed bits (big-endian). */
    async bit11be(value) { await this.bit(value, 11, undefined, "big"); }
    /** Write 11 unsigned bits (big-endian). */
    async ubit11be(value) { await this.bit(value, 11, true, "big"); }
    /** Write 12 signed bits. */
    async bit12(value) { await this.bit(value, 12); }
    /** Write 12 unsigned bits. */
    async ubit12(value) { await this.bit(value, 12, true); }
    /** Write 12 signed bits (little-endian). */
    async bit12le(value) { await this.bit(value, 12, undefined, "little"); }
    /** Write 12 unsigned bits (little-endian). */
    async ubit12le(value) { await this.bit(value, 12, true, "little"); }
    /** Write 12 signed bits (big-endian). */
    async bit12be(value) { await this.bit(value, 12, undefined, "big"); }
    /** Write 12 unsigned bits (big-endian). */
    async ubit12be(value) { await this.bit(value, 12, true, "big"); }
    /** Write 13 signed bits. */
    async bit13(value) { await this.bit(value, 13); }
    /** Write 13 unsigned bits. */
    async ubit13(value) { await this.bit(value, 13, true); }
    /** Write 13 signed bits (little-endian). */
    async bit13le(value) { await this.bit(value, 13, undefined, "little"); }
    /** Write 13 unsigned bits (little-endian). */
    async ubit13le(value) { await this.bit(value, 13, true, "little"); }
    /** Write 13 signed bits (big-endian). */
    async bit13be(value) { await this.bit(value, 13, undefined, "big"); }
    /** Write 13 unsigned bits (big-endian). */
    async ubit13be(value) { await this.bit(value, 13, true, "big"); }
    /** Write 14 signed bits. */
    async bit14(value) { await this.bit(value, 14); }
    /** Write 14 unsigned bits. */
    async ubit14(value) { await this.bit(value, 14, true); }
    /** Write 14 signed bits (little-endian). */
    async bit14le(value) { await this.bit(value, 14, undefined, "little"); }
    /** Write 14 unsigned bits (little-endian). */
    async ubit14le(value) { await this.bit(value, 14, true, "little"); }
    /** Write 14 signed bits (big-endian). */
    async bit14be(value) { await this.bit(value, 14, undefined, "big"); }
    /** Write 14 unsigned bits (big-endian). */
    async ubit14be(value) { await this.bit(value, 14, true, "big"); }
    /** Write 15 signed bits. */
    async bit15(value) { await this.bit(value, 15); }
    /** Write 15 unsigned bits. */
    async ubit15(value) { await this.bit(value, 15, true); }
    /** Write 15 signed bits (little-endian). */
    async bit15le(value) { await this.bit(value, 15, undefined, "little"); }
    /** Write 15 unsigned bits (little-endian). */
    async ubit15le(value) { await this.bit(value, 15, true, "little"); }
    /** Write 15 signed bits (big-endian). */
    async bit15be(value) { await this.bit(value, 15, undefined, "big"); }
    /** Write 15 unsigned bits (big-endian). */
    async ubit15be(value) { await this.bit(value, 15, true, "big"); }
    /** Write 16 signed bits. */
    async bit16(value) { await this.bit(value, 16); }
    /** Write 16 unsigned bits. */
    async ubit16(value) { await this.bit(value, 16, true); }
    /** Write 16 signed bits (little-endian). */
    async bit16le(value) { await this.bit(value, 16, undefined, "little"); }
    /** Write 16 unsigned bits (little-endian). */
    async ubit16le(value) { await this.bit(value, 16, true, "little"); }
    /** Write 16 signed bits (big-endian). */
    async bit16be(value) { await this.bit(value, 16, undefined, "big"); }
    /** Write 16 unsigned bits (big-endian). */
    async ubit16be(value) { await this.bit(value, 16, true, "big"); }
    /** Write 17 signed bits. */
    async bit17(value) { await this.bit(value, 17); }
    /** Write 17 unsigned bits. */
    async ubit17(value) { await this.bit(value, 17, true); }
    /** Write 17 signed bits (little-endian). */
    async bit17le(value) { await this.bit(value, 17, undefined, "little"); }
    /** Write 17 unsigned bits (little-endian). */
    async ubit17le(value) { await this.bit(value, 17, true, "little"); }
    /** Write 17 signed bits (big-endian). */
    async bit17be(value) { await this.bit(value, 17, undefined, "big"); }
    /** Write 17 unsigned bits (big-endian). */
    async ubit17be(value) { await this.bit(value, 17, true, "big"); }
    /** Write 18 signed bits. */
    async bit18(value) { await this.bit(value, 18); }
    /** Write 18 unsigned bits. */
    async ubit18(value) { await this.bit(value, 18, true); }
    /** Write 18 signed bits (little-endian). */
    async bit18le(value) { await this.bit(value, 18, undefined, "little"); }
    /** Write 18 unsigned bits (little-endian). */
    async ubit18le(value) { await this.bit(value, 18, true, "little"); }
    /** Write 18 signed bits (big-endian). */
    async bit18be(value) { await this.bit(value, 18, undefined, "big"); }
    /** Write 18 unsigned bits (big-endian). */
    async ubit18be(value) { await this.bit(value, 18, true, "big"); }
    /** Write 19 signed bits. */
    async bit19(value) { await this.bit(value, 19); }
    /** Write 19 unsigned bits. */
    async ubit19(value) { await this.bit(value, 19, true); }
    /** Write 19 signed bits (little-endian). */
    async bit19le(value) { await this.bit(value, 19, undefined, "little"); }
    /** Write 19 unsigned bits (little-endian). */
    async ubit19le(value) { await this.bit(value, 19, true, "little"); }
    /** Write 19 signed bits (big-endian). */
    async bit19be(value) { await this.bit(value, 19, undefined, "big"); }
    /** Write 19 unsigned bits (big-endian). */
    async ubit19be(value) { await this.bit(value, 19, true, "big"); }
    /** Write 20 signed bits. */
    async bit20(value) { await this.bit(value, 20); }
    /** Write 20 unsigned bits. */
    async ubit20(value) { await this.bit(value, 20, true); }
    /** Write 20 signed bits (little-endian). */
    async bit20le(value) { await this.bit(value, 20, undefined, "little"); }
    /** Write 20 unsigned bits (little-endian). */
    async ubit20le(value) { await this.bit(value, 20, true, "little"); }
    /** Write 20 signed bits (big-endian). */
    async bit20be(value) { await this.bit(value, 20, undefined, "big"); }
    /** Write 20 unsigned bits (big-endian). */
    async ubit20be(value) { await this.bit(value, 20, true, "big"); }
    /** Write 21 signed bits. */
    async bit21(value) { await this.bit(value, 21); }
    /** Write 21 unsigned bits. */
    async ubit21(value) { await this.bit(value, 21, true); }
    /** Write 21 signed bits (little-endian). */
    async bit21le(value) { await this.bit(value, 21, undefined, "little"); }
    /** Write 21 unsigned bits (little-endian). */
    async ubit21le(value) { await this.bit(value, 21, true, "little"); }
    /** Write 21 signed bits (big-endian). */
    async bit21be(value) { await this.bit(value, 21, undefined, "big"); }
    /** Write 21 unsigned bits (big-endian). */
    async ubit21be(value) { await this.bit(value, 21, true, "big"); }
    /** Write 22 signed bits. */
    async bit22(value) { await this.bit(value, 22); }
    /** Write 22 unsigned bits. */
    async ubit22(value) { await this.bit(value, 22, true); }
    /** Write 22 signed bits (little-endian). */
    async bit22le(value) { await this.bit(value, 22, undefined, "little"); }
    /** Write 22 unsigned bits (little-endian). */
    async ubit22le(value) { await this.bit(value, 22, true, "little"); }
    /** Write 22 signed bits (big-endian). */
    async bit22be(value) { await this.bit(value, 22, undefined, "big"); }
    /** Write 22 unsigned bits (big-endian). */
    async ubit22be(value) { await this.bit(value, 22, true, "big"); }
    /** Write 23 signed bits. */
    async bit23(value) { await this.bit(value, 23); }
    /** Write 23 unsigned bits. */
    async ubit23(value) { await this.bit(value, 23, true); }
    /** Write 23 signed bits (little-endian). */
    async bit23le(value) { await this.bit(value, 23, undefined, "little"); }
    /** Write 23 unsigned bits (little-endian). */
    async ubit23le(value) { await this.bit(value, 23, true, "little"); }
    /** Write 23 signed bits (big-endian). */
    async bit23be(value) { await this.bit(value, 23, undefined, "big"); }
    /** Write 23 unsigned bits (big-endian). */
    async ubit23be(value) { await this.bit(value, 23, true, "big"); }
    /** Write 24 signed bits. */
    async bit24(value) { await this.bit(value, 24); }
    /** Write 24 unsigned bits. */
    async ubit24(value) { await this.bit(value, 24, true); }
    /** Write 24 signed bits (little-endian). */
    async bit24le(value) { await this.bit(value, 24, undefined, "little"); }
    /** Write 24 unsigned bits (little-endian). */
    async ubit24le(value) { await this.bit(value, 24, true, "little"); }
    /** Write 24 signed bits (big-endian). */
    async bit24be(value) { await this.bit(value, 24, undefined, "big"); }
    /** Write 24 unsigned bits (big-endian). */
    async ubit24be(value) { await this.bit(value, 24, true, "big"); }
    /** Write 25 signed bits. */
    async bit25(value) { await this.bit(value, 25); }
    /** Write 25 unsigned bits. */
    async ubit25(value) { await this.bit(value, 25, true); }
    /** Write 25 signed bits (little-endian). */
    async bit25le(value) { await this.bit(value, 25, undefined, "little"); }
    /** Write 25 unsigned bits (little-endian). */
    async ubit25le(value) { await this.bit(value, 25, true, "little"); }
    /** Write 25 signed bits (big-endian). */
    async bit25be(value) { await this.bit(value, 25, undefined, "big"); }
    /** Write 25 unsigned bits (big-endian). */
    async ubit25be(value) { await this.bit(value, 25, true, "big"); }
    /** Write 26 signed bits. */
    async bit26(value) { await this.bit(value, 26); }
    /** Write 26 unsigned bits. */
    async ubit26(value) { await this.bit(value, 26, true); }
    /** Write 26 signed bits (little-endian). */
    async bit26le(value) { await this.bit(value, 26, undefined, "little"); }
    /** Write 26 unsigned bits (little-endian). */
    async ubit26le(value) { await this.bit(value, 26, true, "little"); }
    /** Write 26 signed bits (big-endian). */
    async bit26be(value) { await this.bit(value, 26, undefined, "big"); }
    /** Write 26 unsigned bits (big-endian). */
    async ubit26be(value) { await this.bit(value, 26, true, "big"); }
    /** Write 27 signed bits. */
    async bit27(value) { await this.bit(value, 27); }
    /** Write 27 unsigned bits. */
    async ubit27(value) { await this.bit(value, 27, true); }
    /** Write 27 signed bits (little-endian). */
    async bit27le(value) { await this.bit(value, 27, undefined, "little"); }
    /** Write 27 unsigned bits (little-endian). */
    async ubit27le(value) { await this.bit(value, 27, true, "little"); }
    /** Write 27 signed bits (big-endian). */
    async bit27be(value) { await this.bit(value, 27, undefined, "big"); }
    /** Write 27 unsigned bits (big-endian). */
    async ubit27be(value) { await this.bit(value, 27, true, "big"); }
    /** Write 28 signed bits. */
    async bit28(value) { await this.bit(value, 28); }
    /** Write 28 unsigned bits. */
    async ubit28(value) { await this.bit(value, 28, true); }
    /** Write 28 signed bits (little-endian). */
    async bit28le(value) { await this.bit(value, 28, undefined, "little"); }
    /** Write 28 unsigned bits (little-endian). */
    async ubit28le(value) { await this.bit(value, 28, true, "little"); }
    /** Write 28 signed bits (big-endian). */
    async bit28be(value) { await this.bit(value, 28, undefined, "big"); }
    /** Write 28 unsigned bits (big-endian). */
    async ubit28be(value) { await this.bit(value, 28, true, "big"); }
    /** Write 29 signed bits. */
    async bit29(value) { await this.bit(value, 29); }
    /** Write 29 unsigned bits. */
    async ubit29(value) { await this.bit(value, 29, true); }
    /** Write 29 signed bits (little-endian). */
    async bit29le(value) { await this.bit(value, 29, undefined, "little"); }
    /** Write 29 unsigned bits (little-endian). */
    async ubit29le(value) { await this.bit(value, 29, true, "little"); }
    /** Write 29 signed bits (big-endian). */
    async bit29be(value) { await this.bit(value, 29, undefined, "big"); }
    /** Write 29 unsigned bits (big-endian). */
    async ubit29be(value) { await this.bit(value, 29, true, "big"); }
    /** Write 30 signed bits. */
    async bit30(value) { await this.bit(value, 30); }
    /** Write 30 unsigned bits. */
    async ubit30(value) { await this.bit(value, 30, true); }
    /** Write 30 signed bits (little-endian). */
    async bit30le(value) { await this.bit(value, 30, undefined, "little"); }
    /** Write 30 unsigned bits (little-endian). */
    async ubit30le(value) { await this.bit(value, 30, true, "little"); }
    /** Write 30 signed bits (big-endian). */
    async bit30be(value) { await this.bit(value, 30, undefined, "big"); }
    /** Write 30 unsigned bits (big-endian). */
    async ubit30be(value) { await this.bit(value, 30, true, "big"); }
    /** Write 31 signed bits. */
    async bit31(value) { await this.bit(value, 31); }
    /** Write 31 unsigned bits. */
    async ubit31(value) { await this.bit(value, 31, true); }
    /** Write 31 signed bits (little-endian). */
    async bit31le(value) { await this.bit(value, 31, undefined, "little"); }
    /** Write 31 unsigned bits (little-endian). */
    async ubit31le(value) { await this.bit(value, 31, true, "little"); }
    /** Write 31 signed bits (big-endian). */
    async bit31be(value) { await this.bit(value, 31, undefined, "big"); }
    /** Write 31 unsigned bits (big-endian). */
    async ubit31be(value) { await this.bit(value, 31, true, "big"); }
    /** Write 32 signed bits. */
    async bit32(value) { await this.bit(value, 32); }
    /** Write 32 unsigned bits. */
    async ubit32(value) { await this.bit(value, 32, true); }
    /** Write 32 signed bits (little-endian). */
    async bit32le(value) { await this.bit(value, 32, undefined, "little"); }
    /** Write 32 unsigned bits (little-endian). */
    async ubit32le(value) { await this.bit(value, 32, true, "little"); }
    /** Write 32 signed bits (big-endian). */
    async bit32be(value) { await this.bit(value, 32, undefined, "big"); }
    /** Write 32 unsigned bits (big-endian). */
    async ubit32be(value) { await this.bit(value, 32, true, "big"); }
    // #endregion Generated mechanical aliases
    ;
    //
    // #region string
    //
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
    async string(string, options) {
        return await this.writeString(string, options);
    }
    ;
    /**
    * Writes string using setting from .strDefaults
    *
    * Default is ``utf-8``
    *
    * @param {string} string - text string
    */
    async str(string) {
        await this.writeString(string, this.strDefaults);
    }
    ;
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf8string(string, length, terminateValue) {
        return await this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    }
    ;
    /**
    * Writes UTF-8 (C) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async cstring(string, length, terminateValue) {
        return await this.utf8string(string, length, terminateValue);
    }
    ;
    /**
    * Writes ANSI string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async ansistring(string, length, terminateValue) {
        return await this.string(string, { stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    }
    ;
    /**
    * Writes latin1 string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async latin1string(string, length, terminateValue) {
        return await this.string(string, { stringType: "utf-8", encoding: "iso-8859-1", length: length, terminateValue: terminateValue });
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    async utf16string(string, length, terminateValue, endian) {
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    async unistring(string, length, terminateValue, endian) {
        return await this.utf16string(string, length, terminateValue, endian);
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf16stringle(string, length, terminateValue) {
        return await this.unistring(string, length, terminateValue, "little");
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async unistringle(string, length, terminateValue) {
        return await this.utf16stringle(string, length, terminateValue);
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf16stringbe(string, length, terminateValue) {
        return await this.unistring(string, length, terminateValue, "big");
    }
    ;
    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async unistringbe(string, length, terminateValue) {
        return await this.utf16stringbe(string, length, terminateValue);
    }
    ;
    /**
    * Writes UTF-32 (Unicode) string.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    async utf32string(string, length, terminateValue, endian) {
        return await this.string(string, { stringType: "utf-32", encoding: "utf-32", length: length, terminateValue: terminateValue, endian: endian });
    }
    ;
    /**
    * Writes UTF-32 (Unicode) string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf32stringle(string, length, terminateValue) {
        return await this.utf32string(string, length, terminateValue, "little");
    }
    ;
    /**
    * Writes UTF-32 (Unicode) string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf32stringbe(string, length, terminateValue) {
        return await this.utf32string(string, length, terminateValue, "big");
    }
    ;
    /**
    * Writes Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    async pstring(string, lengthWriteSize, endian) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    ;
    /**
    * Writes Pascal string 1 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    async pstring1(string, endian) {
        return await this.pstring(string, 1, endian);
    }
    ;
    /**
    * Writes Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async pstring1le(string) {
        return await this.pstring1(string, "little");
    }
    ;
    /**
    * Writes Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async pstring1be(string) {
        return await this.pstring1(string, "big");
    }
    ;
    /**
    * Writes Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async pstring2(string, endian) {
        return await this.pstring(string, 2, endian);
    }
    ;
    /**
    * Writes Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async pstring2le(string) {
        return await this.pstring2(string, "little");
    }
    ;
    /**
    * Writes Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async pstring2be(string) {
        return await this.pstring2(string, "big");
    }
    ;
    /**
    * Writes Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async pstring4(string, endian) {
        return await this.pstring(string, 4, endian);
    }
    ;
    /**
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async pstring4le(string) {
        return await this.pstring4(string, "little");
    }
    ;
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async pstring4be(string) {
        return await this.pstring4(string, "big");
    }
    ;
    /**
    * Writes Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring(string, lengthWriteSize, endian) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    ;
    /**
    * Writes Wide Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async wpstringle(string, lengthWriteSize) {
        return await this.wpstring(string, lengthWriteSize, "little");
    }
    ;
    /**
    * Writes Wide Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async wpstringbe(string, lengthWriteSize) {
        return await this.wpstring(string, lengthWriteSize, "big");
    }
    ;
    /**
    * Writes Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring1(string, endian) {
        return await this.wpstring(string, 1, endian);
    }
    ;
    /**
    * Writes Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async wpstring1be(string) {
        return await this.wpstring1(string, "big");
    }
    ;
    /**
    * Writes Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async wpstring1le(string) {
        return await this.wpstring1(string, "little");
    }
    ;
    /**
    * Writes Wide Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring2(string, endian) {
        return await this.wpstring(string, 2, endian);
    }
    ;
    /**
    * Writes Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async wpstring2le(string) {
        return await this.wpstring2(string, "little");
    }
    ;
    /**
    * Writes Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async wpstring2be(string) {
        return await this.wpstring2(string, "big");
    }
    ;
    /**
    * Writes Wide Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring4(string, endian) {
        return await this.wpstring(string, 4, endian);
    }
    ;
    /**
    * Writes Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async wpstring4le(string) {
        return await this.wpstring4(string, "little");
    }
    ;
    /**
    * Writes Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async wpstring4be(string) {
        return await this.wpstring4(string, "big");
    }
    ;
    /**
    * Writes Double Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async dwpstring(string, lengthWriteSize, endian) {
        return await this.string(string, { stringType: "double-wide-pascal", encoding: "utf-32", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    ;
    /**
    * Writes Double Wide Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async dwpstringle(string, lengthWriteSize) {
        return await this.dwpstring(string, lengthWriteSize, "little");
    }
    ;
    /**
    * Writes Double Wide Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async dwpstringbe(string, lengthWriteSize) {
        return await this.dwpstring(string, lengthWriteSize, "big");
    }
    ;
    /**
    * Writes Double Wide Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async dwpstring1(string, endian) {
        return await this.dwpstring(string, 1, endian);
    }
    ;
    /**
    * Writes Double Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async dwpstring1le(string) {
        return await this.dwpstring1(string, "little");
    }
    ;
    /**
    * Writes Double Wide Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async dwpstring1be(string) {
        return await this.dwpstring1(string, "big");
    }
    ;
    /**
    * Writes Double Wide Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async dwpstring2(string, endian) {
        return await this.dwpstring(string, 2, endian);
    }
    ;
    /**
    * Writes Double Wide Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async dwpstring2le(string) {
        return await this.dwpstring2(string, "little");
    }
    ;
    /**
    * Writes Double Wide Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async dwpstring2be(string) {
        return await this.dwpstring2(string, "big");
    }
    ;
    /**
    * Writes Double Wide Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async dwpstring4(string, endian) {
        return await this.dwpstring(string, 4, endian);
    }
    ;
    /**
    * Writes Double Wide Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async dwpstring4le(string) {
        return await this.dwpstring4(string, "little");
    }
    ;
    /**
    * Writes Double Wide Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async dwpstring4be(string) {
        return await this.dwpstring4(string, "big");
    }
    ;
}

// node import
BiSyncEngine.fs = fs;
BiEngine.fs = fsp;
/**
 * Not in use anymore.
 * @since 3.0
 * @deprecated Use ``BiReader`` instead.
 */
class bireader {
    constructor() {
        throw new Error("bireader is deprecated. Use BiReader instead.");
    }
}
/**
 * Not in use anymore.
 * @since 4.0
 * @deprecated Use ``BiReader`` instead.
 */
class BiReaderStream {
    constructor() {
        throw new Error("BiReaderStream is deprecated. Use BiReader instead.");
    }
}
/**
 * Not in use anymore.
 * @since 3.0
 * @deprecated Use ``BiWriter`` instead.
 */
class biwriter {
    constructor() {
        throw new Error("biwriter is deprecated. Use BiWriter instead.");
    }
}
/**
 * Not in use anymore.
 * @since 4.0
 * @deprecated Use ``BiWriter`` instead.
 */
class BiWriterStream {
    constructor() {
        throw new Error("BiWriterStream is deprecated. Use BiWriter instead.");
    }
}

export { BiReader, BiReaderAsync, BiReaderStream, BiWriter, BiWriterAsync, BiWriterStream, bireader, biwriter, hexdump };
//# sourceMappingURL=indexImport.js.map
