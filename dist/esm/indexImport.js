// #region Types
// #region Checks
const testFallback = process && process.argv && process.argv.indexOf("FALLBACK=true") != -1;
const canInt8 = testFallback ? false : "getUint8" in DataView.prototype && "getInt8" in DataView.prototype && "setUint8" in DataView.prototype && "setInt8" in DataView.prototype;
const canInt16 = testFallback ? false : "getUint16" in DataView.prototype && "getInt16" in DataView.prototype && "setUint16" in DataView.prototype && "setInt16" in DataView.prototype;
const canFloat16 = testFallback ? false : 'getFloat16' in DataView.prototype && 'setFloat16' in DataView.prototype;
const canInt32 = testFallback ? false : 'getInt32' in DataView.prototype && 'getUint32' in DataView.prototype && 'setInt32' in DataView.prototype && 'setUint32' in DataView.prototype;
const canFloat32 = testFallback ? false : "getFloat32" in DataView.prototype && "setFloat32" in DataView.prototype;
const canBigInt64 = testFallback ? false : "getBigUint64" in DataView.prototype && "getBigInt64" in DataView.prototype && "setBigUint64" in DataView.prototype && "setBigInt64" in DataView.prototype;
const canFloat64 = testFallback ? false : "getFloat64" in DataView.prototype && "setFloat64" in DataView.prototype;
const hasBigInt = typeof BigInt === 'function';
const MIN_SAFE_BIGINT = hasBigInt ? BigInt(Number.MIN_SAFE_INTEGER) : 0;
const MAX_SAFE_BIGINT = hasBigInt ? BigInt(Number.MAX_SAFE_INTEGER) : 0;
// #region Helpers
/**
 * If value can be convert to number
 */
function isSafeInt64(big) {
    return hasBigInt ? (big >= MIN_SAFE_BIGINT && big <= MAX_SAFE_BIGINT) : false;
}
function isBuffer(obj) {
    return (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj));
}
function isUint8Array(obj) {
    if (typeof Buffer === 'undefined') {
        return true;
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj)) {
        return false;
    }
    return true;
}
function isBufferOrUint8Array(obj) {
    return obj instanceof Uint8Array || isBuffer(obj);
}
function normalizeBitOffset(bit) {
    return ((bit % 8) + 8) % 8;
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
                    utf32Buffer[i] = string.codePointAt(i);
                }
                return new Uint8Array(utf32Buffer.buffer);
            }
        default:
            return new Uint8Array(0);
    }
}
/**
 * Converts the number to a safe value
 */
function numberSafe(value, bits, unsigned) {
    var min, max;
    if (!!unsigned == true || bits == 1) {
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
                {
                    if (bits <= 54) {
                        max = Math.pow(2, bits) - 1;
                    }
                    else if (bits > 54 && hasBigInt) {
                        max = Math.pow(2, bits) - 1;
                    }
                    else {
                        throw new RangeError("System can't have BigInt support to handle large numbers.");
                    }
                }
                break;
        }
        min = 0;
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
                {
                    if (bits <= 55) {
                        max = Math.pow(2, bits - 1) - 1;
                    }
                    else if (bits > 55 && hasBigInt) {
                        max = Math.pow(2, bits - 1) - 1;
                    }
                    else {
                        throw new RangeError("System can't have BigInt support to handle large numbers.");
                    }
                }
                break;
        }
        min = -max - 1;
    }
    if (value < min) {
        if (typeof value == "bigint") {
            return BigInt(min);
        }
        else {
            return min;
        }
    }
    else if (value > max) {
        if (typeof value == "bigint") {
            return BigInt(max);
        }
        else {
            return max;
        }
    }
    else {
        return value;
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
                                const byte4 = data[i + 2];
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
// #region Read / Writes
/**
 * bit read function
 */
function _rbit(data, bits, offset, endian, unsigned) {
    var value = 0;
    for (var i = 0; i < bits;) {
        const remaining = bits - i;
        const bitOffset = offset & 7;
        const currentByte = data[offset >> 3];
        const read = Math.min(remaining, 8 - bitOffset);
        if (endian == "big") {
            let mask = ~(0xFF << read);
            let readBits = (currentByte >> (8 - read - bitOffset)) & mask;
            value <<= read;
            value |= readBits;
        }
        else {
            let mask = ~(0xFF << read);
            let readBits = (currentByte >> bitOffset) & mask;
            value |= readBits << i;
        }
        offset += read;
        i += read;
    }
    if (!unsigned) {
        const signBit = 1 << (bits - 1);
        if (value & signBit) {
            value -= (1 << bits);
        }
    }
    return value;
}
/**
 * Write bits
 */
function _wbit(data, value, bits, offsetBit, endian, unsigned) {
    // fits the value as unsigned
    if (unsigned == true || bits == 1) {
        const maxValue = Math.pow(2, bits) - 1;
        value = value & maxValue;
    }
    for (var i = 0; i < bits;) {
        const remaining = bits - i;
        const bitOffset = offsetBit & 7;
        const byteOffset = offsetBit >> 3;
        const written = Math.min(remaining, 8 - bitOffset);
        if (endian == "big") {
            let mask = ~(-1 << written);
            let writeBits = (value >> (bits - i - written)) & mask;
            var destShift = 8 - bitOffset - written;
            let destMask = ~(mask << destShift);
            data[byteOffset] = (data[byteOffset] & destMask) | (writeBits << destShift);
        }
        else {
            let mask = ~(0xFF << written);
            let writeBits = value & mask;
            value >>= written;
            let destMask = ~(mask << bitOffset);
            data[byteOffset] = (data[byteOffset] & destMask) | (writeBits << bitOffset);
        }
        offsetBit += written;
        i += written;
    }
    return;
}
function _rbyte(data, offset, unsigned) {
    const value = data[offset];
    if (unsigned == true) {
        return value & 0xFF;
    }
    else {
        return value > 127 ? value - 256 : value;
    }
}
function _wbyte(data, value, offset, unsigned) {
    data[offset] = unsigned ? value & 0xFF : value;
    return;
}
function _rint16(data, offset, endian, unsigned) {
    var value;
    if (endian == "little") {
        value = ((data[offset + 1] & 0xFFFF) << 8) | (data[offset] & 0xFFFF);
    }
    else {
        value = ((data[offset] & 0xFFFF) << 8) | (data[offset + 1] & 0xFFFF);
    }
    if (!!unsigned == false) {
        const signBit = 1 << (16 - 1);
        if (value & signBit) {
            value -= (1 << 16);
        }
    }
    return value;
}
function _wint16(data, value, offset, endian, unsigned = false) {
    if (endian == "little") {
        data[offset] = unsigned == false ? value : value & 0xff;
        data[offset + 1] = unsigned == false ? (value >> 8) : (value >> 8) & 0xff;
    }
    else {
        data[offset] = unsigned == false ? (value >> 8) : (value >> 8) & 0xff;
        data[offset + 1] = unsigned == false ? value : value & 0xff;
    }
    return;
}
function _rhalffloat(data, offset, endian) {
    const value = _rint16(data, offset, endian, true);
    const sign = (value & 0x8000) >> 15;
    const exponent = (value & 0x7C00) >> 10;
    const fraction = value & 0x03FF;
    var floatValue;
    if (exponent === 0) {
        if (fraction === 0) {
            floatValue = (sign === 0) ? 0 : -0; // +/-0
        }
        else {
            // Denormalized number
            floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
        }
    }
    else if (exponent === 0x1F) {
        if (fraction === 0) {
            floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        }
        else {
            floatValue = Number.NaN;
        }
    }
    else {
        // Normalized number
        floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
    }
    return floatValue;
}
const float32Array = new Float32Array(1);
const float32AsInts = new Uint32Array(float32Array.buffer);
function _whalffloat(data, value, offset, endian) {
    float32Array[0] = value;
    const x = float32AsInts[0];
    const sign = (x >> 31) & 0x1;
    var exponent = (x >> 23) & 0xff;
    var mantissa = x & 0x7fffff;
    var halfFloatBits;
    if (exponent === 0xff) {
        // NaN or Infinity
        halfFloatBits = (sign << 15) | (0x1f << 10) | (mantissa ? 0x200 : 0);
    }
    else if (exponent > 142) {
        // Overflow → Infinity
        halfFloatBits = (sign << 15) | (0x1f << 10);
    }
    else if (exponent < 113) {
        // Subnormal or zero
        if (exponent < 103) {
            halfFloatBits = sign << 15;
        }
        else {
            mantissa |= 0x800000;
            const shift = 125 - exponent;
            mantissa = mantissa >> shift;
            halfFloatBits = (sign << 15) | (mantissa >> 13);
        }
    }
    else {
        // Normalized
        exponent = exponent - 112;
        mantissa = mantissa >> 13;
        halfFloatBits = (sign << 15) | (exponent << 10) | mantissa;
    }
    if (endian == "little") {
        data[offset] = halfFloatBits & 0xFF;
        data[offset + 1] = (halfFloatBits >> 8) & 0xFF;
    }
    else {
        data[offset] = (halfFloatBits >> 8) & 0xFF;
        data[offset + 1] = halfFloatBits & 0xFF;
    }
    return;
}
function _rint32(data, offset, endian, unsigned) {
    var value;
    if (endian == "little") {
        value = ((data[offset + 3] & 0xFF) << 24) |
            ((data[offset + 2] & 0xFF) << 16) |
            ((data[offset + 1] & 0xFF) << 8) |
            (data[offset] & 0xFF);
    }
    else {
        value = ((data[offset] & 0xFF) << 24) |
            ((data[offset + 1] & 0xFF) << 16) |
            ((data[offset + 2] & 0xFF) << 8) |
            (data[offset + 3] & 0xFF);
    }
    if (unsigned) {
        return value >>> 0;
    }
    return value;
}
function _wint32(data, value, offset, endian, unsigned = false) {
    if (endian == "little") {
        data[offset] = unsigned == false ? value : value & 0xFF;
        data[offset + 1] = unsigned == false ? (value >> 8) : (value >> 8) & 0xFF;
        data[offset + 2] = unsigned == false ? (value >> 16) : (value >> 16) & 0xFF;
        data[offset + 3] = unsigned == false ? (value >> 24) : (value >> 24) & 0xFF;
    }
    else {
        data[offset] = unsigned == false ? (value >> 24) : (value >> 24) & 0xFF;
        data[offset + 1] = unsigned == false ? (value >> 16) : (value >> 16) & 0xFF;
        data[offset + 2] = unsigned == false ? (value >> 8) : (value >> 8) & 0xFF;
        data[offset + 3] = unsigned == false ? value : value & 0xFF;
    }
    return;
}
function _rfloat(data, offset, endian) {
    const uint32Value = _rint32(data, offset, endian, true);
    const isNegative = (uint32Value & 0x80000000) !== 0 ? 1 : 0;
    // Extract the exponent and fraction parts
    const exponent = (uint32Value >> 23) & 0xFF;
    const fraction = uint32Value & 0x7FFFFF;
    // Calculate the float value
    var floatValue;
    if (exponent === 0) {
        // Denormalized number (exponent is 0)
        floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
    }
    else if (exponent === 0xFF) {
        // Infinity or NaN (exponent is 255)
        floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
    }
    else {
        // Normalized number
        floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
    }
    return floatValue;
}
function _wfloat(data, value, offset, endian) {
    float32Array[0] = value;
    _wint32(data, float32AsInts[0], offset, endian, true);
    return;
}
function _rint64(data, offset, endian, unsigned) {
    var value = BigInt(0);
    for (let i = 0; i < 8; i++) {
        if (endian == "little") {
            value = value | BigInt((data[offset + i] & 0xFF)) << BigInt(8 * i);
        }
        else {
            value = (value << BigInt(8)) | BigInt((data[offset + i] & 0xFF));
        }
    }
    if (unsigned == false) {
        if (value & (BigInt(1) << BigInt(63))) {
            value -= BigInt(1) << BigInt(64);
        }
    }
    return value;
}
function _wint64(data, value, offset, endian, unsigned) {
    const bigIntArray = unsigned ? new BigUint64Array(1) : new BigInt64Array(1);
    bigIntArray[0] = BigInt(value);
    // Use two 32-bit views to write the Int64
    const int32Array = unsigned ? new Uint32Array(bigIntArray.buffer) : new Int32Array(bigIntArray.buffer);
    for (let i = 0; i < 2; i++) {
        _wint32(data, int32Array[i], offset + (i * 4), endian, unsigned);
    }
    return;
}
function _rdfloat(data, offset, endian) {
    var uint64Value = _rint64(data, offset, endian, true);
    const sign = (BigInt(uint64Value) & BigInt("9223372036854775808")) >> BigInt(63);
    const exponent = Number((BigInt(uint64Value) & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;
    const fraction = Number(BigInt(uint64Value) & BigInt("4503599627370495")) / Math.pow(2, 52);
    var floatValue;
    if (exponent == -1023) {
        if (fraction == 0) {
            floatValue = (sign == BigInt(0)) ? 0 : -0; // +/-0
        }
        else {
            // Denormalized number
            floatValue = (sign == BigInt(0) ? 1 : -1) * Math.pow(2, -1022) * fraction;
        }
    }
    else if (exponent == 1024) {
        if (fraction == 0) {
            floatValue = (sign == BigInt(0)) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        }
        else {
            floatValue = Number.NaN;
        }
    }
    else {
        // Normalized number
        floatValue = (sign == BigInt(0) ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
    }
    return floatValue;
}
function _wdfloat(data, value, offset, endian) {
    const intArray = new Int32Array(2);
    const floatArray = new Float64Array(intArray.buffer);
    floatArray[0] = value;
    const bytes = new Uint8Array(intArray.buffer);
    for (let i = 0; i < 8; i++) {
        if (endian == "little") {
            data[offset + i] = bytes[i];
        }
        else {
            data[offset + (7 - i)] = bytes[i];
        }
    }
    return;
}
function _rstring(stringType, lengthReadSize, readLengthinBytes, terminateValue, stripNull, encoding, endian, readUByte, readUInt16, readUInt32) {
    const encodedBytes = [];
    if (stringType === 'pascal' || stringType === 'wide-pascal' || stringType === "double-wide-pascal") {
        terminateValue = undefined;
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
async function _rstringAsync(stringType, lengthReadSize, readLengthinBytes, terminateValue, stripNull, encoding, endian, readUByte, readUInt16, readUInt32) {
    const encodedBytes = [];
    if (stringType === 'pascal' || stringType === 'wide-pascal' || stringType === "double-wide-pascal") {
        terminateValue = undefined;
        if (lengthReadSize == 1) {
            readLengthinBytes = await readUByte();
        }
        else if (lengthReadSize == 2) {
            readLengthinBytes = await readUInt16(endian);
        }
        else if (lengthReadSize == 4) {
            readLengthinBytes = await readUInt32(endian);
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
                read = await readUByte();
                break;
            case 2:
                read = await readUInt16(endian);
                i++;
                break;
            case 4:
                read = await readUInt32(endian);
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
async function _wstringAsync(encodedString, stringType, endian, terminateValue, lengthWriteSize, writeUByte, writeUInt16, writeUInt32) {
    if (stringType == "pascal" ||
        stringType == 'wide-pascal' ||
        stringType == 'double-wide-pascal') {
        if (lengthWriteSize == 1) {
            await writeUByte(encodedString.byteLength);
        }
        else if (lengthWriteSize == 2) {
            await writeUInt16(encodedString.byteLength, endian);
        }
        else if (lengthWriteSize == 4) {
            await writeUInt32(encodedString.byteLength, endian);
        }
    }
    const view = new DataView(encodedString.buffer, encodedString.byteOffset, encodedString.byteLength);
    for (let i = 0; i < view.byteLength; i++) {
        switch (stringType) {
            case 'ascii':
            case 'utf-8':
            case 'pascal':
                await writeUByte(view.getUint8(i));
                break;
            case 'utf-16':
            case 'wide-pascal':
                await writeUInt16(view.getUint16(i, true), endian);
                i++;
                break;
            case 'utf-32':
            case 'double-wide-pascal':
                await writeUInt32(view.getUint32(i, true), endian);
                i++;
                i++;
                i++;
                break;
        }
    }
    if (stringType == "ascii" || stringType == 'utf-8') {
        await writeUByte(terminateValue);
    }
    else if (stringType == 'utf-16') {
        await writeUInt16(terminateValue, endian);
    }
    else if (stringType == 'utf-32') {
        await writeUInt32(terminateValue, endian);
    }
}

/**
 * @file BiReader / Writer base for working in sync Buffers or full file reads. Node and Browser.
 */
// #region Imports
var fs$1;
(async function () {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // We are in Node.js
        try {
            if (typeof require !== 'undefined') {
                if (typeof fs$1 === "undefined") {
                    fs$1 = require('fs');
                }
            }
            else {
                if (typeof fs$1 === "undefined") {
                    fs$1 = await import('fs');
                }
            }
        }
        catch (error) {
            console.error('Failed to load fs module:', error);
        }
    }
})();
function _fileExists$1(filePath) {
    try {
        fs$1.accessSync(filePath, fs$1.constants.F_OK);
        return true; // File exists
    }
    catch (error) {
        // @ts-ignore
        return false;
    }
}
// #region Class
/**
 * Base class for BiReader and BiWriter
 */
class BiBase {
    /**
     * Endianness of default read.
     * @type {endian}
     */
    endian = "little";
    /**
     * Current read byte location.
     */
    #offset = 0;
    /**
     * Current read byte's bit location. 0 - 7
     */
    #insetBit = 0;
    /**
     * Size in bytes of the current buffer.
     */
    size = 0;
    /**
     * Size in bits of the current buffer.
     */
    bitSize = 0;
    /**
     * Stops the buffer extending on reading or writing outside of current size
     */
    strict = false;
    /**
     * Console log a hexdump on error.
     */
    errorDump = false;
    /**
     * Master Buffer
     */
    #data = null;
    /**
     * DataView of master Buffer
     */
    #view;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     *
     * Otherwise it extends just the amount of the next written value.
     *
     * This can greatly speed up data writes when large files are being written.
     *
     * NOTE: Using ``BiWriter.get`` or ``BiWriter.return`` will now remove all data after the current write position. Use ``BiWriter.data`` to get the full buffer instead.
     */
    growthIncrement = 1048576;
    /**
     * Open file description
     */
    fd = null;
    /**
     * Current file path
     */
    filePath = null;
    /**
     * File write mode
     */
    fsMode = "r";
    /**
     * The settings that used when using the .str getter / setter
     */
    strDefaults = { stringType: "utf-8", terminateValue: 0x0 };
    /**
     * All int64 reads will return as bigint type
     */
    enforceBigInt;
    /**
     * Not using a file reader.
     */
    isMemoryMode;
    /**
     * If data can not be written to the buffer.
     */
    readOnly;
    /**
     * Get the current buffer data.
     *
     * @type {ReturnMapping<DataType>}
     */
    get data() {
        return this.#data;
    }
    ;
    /**
     * Set the current buffer data.
     *
     * @param {DataType} data
     */
    set data(data) {
        if (this.isBufferOrUint8Array(data)) {
            this.#data = data;
            this.#updateView();
            this.size = this.#data.length;
            this.bitSize = this.size * 8;
        }
    }
    ;
    wasExpanded = false;
    /**
     * Get the DataView of current buffer data.
     */
    get view() {
        return this.#view;
    }
    ;
    constructor(input, options = {}) {
        const { byteOffset, bitOffset, endianness, strict, growthIncrement, enforceBigInt, readOnly } = options;
        if (typeof strict != "boolean") {
            throw new Error("Strict mode must be true or false");
        }
        this.readOnly = !!readOnly;
        this.strict = readOnly ? true : strict;
        this.fsMode = this.readOnly ? 'r' : 'r+';
        this.enforceBigInt = !!enforceBigInt;
        if (!hasBigInt) {
            this.enforceBigInt = false;
        }
        this.growthIncrement = growthIncrement;
        if (typeof endianness != "string" || !(endianness == "big" || endianness == "little")) {
            throw new TypeError("Endian must be big or little");
        }
        this.endian = endianness;
        if (typeof input == "string") {
            if (typeof Buffer === 'undefined' || typeof fs$1 === "undefined") {
                throw new Error("Can't load file outside of Node.");
            }
            this.filePath = input;
            this.isMemoryMode = false;
        }
        else if (this.isBufferOrUint8Array(input)) {
            this.data = input;
            this.isMemoryMode = true;
            this.size = this.#data.length;
            this.bitSize = this.#data.length * 8;
        }
        else {
            throw new Error("Write data must be Uint8Array or Buffer");
        }
        this.#offset = byteOffset ?? 0;
        if ((bitOffset ?? 0) != 0) {
            this.#offset = Math.floor(byteOffset / 8);
            this.#insetBit = byteOffset % 8;
        }
        this.#offset = ((Math.abs(this.#offset)) + Math.ceil((Math.abs(this.#insetBit)) / 8));
        // Adjust byte offset based on bit overflow
        this.#offset += Math.floor((Math.abs(this.#insetBit)) / 8);
        // Adjust bit offset
        this.#insetBit = Math.abs(normalizeBitOffset(this.#insetBit)) % 8;
        // Ensure bit offset stays between 0-7
        this.#insetBit = Math.min(Math.max(this.#insetBit, 0), 7);
        // Ensure offset doesn't go negative
        this.#offset = Math.max(this.#offset, 0);
        this.#confrimSize(this.#offset);
    }
    ;
    /**
     * Settings for when using .str
     *
     * @param {stringOptions} settings options to use with .str
     */
    set strSettings(settings) {
        this.strDefaults.encoding = settings.encoding;
        this.strDefaults.endian = settings.endian;
        this.strDefaults.length = settings.length;
        this.strDefaults.lengthReadSize = settings.lengthReadSize;
        this.strDefaults.lengthWriteSize = settings.lengthWriteSize;
        this.strDefaults.stringType = settings.stringType;
        this.strDefaults.stripNull = settings.stripNull;
        this.strDefaults.terminateValue = settings.terminateValue;
    }
    ;
    ///////////////////////////////
    // #region INTERNALS
    ///////////////////////////////
    /**
     * Checks if obj is an Uint8Array or a Buffer
     */
    isBufferOrUint8Array(obj) {
        return isBufferOrUint8Array(obj);
    }
    ;
    /**
     * Checks if obj is a Buffer
     */
    isBuffer(obj) {
        return isBuffer(obj);
    }
    ;
    /**
     * Checks if obj is an Uint8Array
     */
    isUint8Array(obj) {
        return isUint8Array(obj);
    }
    /**
     * Internal update size
     *
     * run after setting data
     */
    #updateSize() {
        if (this.isMemoryMode) {
            this.size = this.#data.length;
            this.bitSize = this.size * 8;
            return;
        }
        if (typeof fs$1 === "undefined") {
            throw new Error("Can't load file outside of Node.");
        }
        if (this.fd != null) {
            try {
                const stat = fs$1.fstatSync(this.fd);
                this.size = stat.size;
                this.bitSize = this.size * 8;
            }
            catch (error) {
                throw new Error(error);
            }
        }
    }
    ;
    /**
     * Internal update buffer.
     *
     * Should come after updateSize
     */
    #updateBuffer() {
        if (!this.isMemoryMode) {
            if (this.fd == null) {
                try {
                    this.fd = fs$1.openSync(this.filePath, this.fsMode);
                }
                catch (error) {
                    throw new Error(error);
                }
            }
            const data = Buffer.alloc(this.size);
            try {
                const bytesRead = fs$1.readSync(this.fd, data, 0, data.length, 0);
                if (bytesRead != this.size) {
                    throw new Error("Didn't update file buffer size. Expecting " + this.size + " but got " + bytesRead);
                }
            }
            catch (error) {
                throw new Error(error);
            }
            this.data = data;
            this.#updateSize();
        }
        this.#offset = this.#offset ?? 0;
        this.#insetBit = this.#insetBit ?? 0;
        this.#offset = ((Math.abs(this.#offset)) + Math.ceil((Math.abs(this.#insetBit)) / 8));
        // Adjust byte offset based on bit overflow
        this.#offset += Math.floor((Math.abs(this.#insetBit)) / 8);
        // Adjust bit offset
        this.#insetBit = Math.abs(normalizeBitOffset(this.#insetBit)) % 8;
        // Ensure bit offset stays between 0-7
        this.#insetBit = Math.min(Math.max(this.#insetBit, 0), 7);
        // Ensure offset doesn't go negative
        this.#offset = Math.max(this.#offset, 0);
        this.#confrimSize(this.#offset);
    }
    ;
    /**
     * Call this after everytime we set/replace `this.data`
     */
    #updateView() {
        if (this.#data) {
            this.#view = new DataView(this.#data.buffer, this.#data.byteOffset ?? 0, this.#data.byteLength);
        }
    }
    ;
    /**
     * Calls to check if expanding the buffer needs to happen
     */
    #checkSize(writeBytes = 0, writeBit = 0, offset = this.#offset) {
        this.open();
        const bits = writeBit + this.#insetBit;
        if (bits != 0) {
            //add bits
            writeBytes += Math.ceil(bits / 8);
        }
        //if bigger extend
        this.#confrimSize(offset + writeBytes);
        //start read location
        return offset;
    }
    ;
    /**
     * Checks if input requires expanding the buffer
     */
    #confrimSize(neededSize) {
        if (neededSize <= this.size) {
            return;
        }
        var targetSize = neededSize;
        if (targetSize > this.size) {
            if (this.strict || this.readOnly) {
                this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
                throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: ` + neededSize + " at " + this.#offset + " of " + this.size);
            }
            if (this.growthIncrement != 0) {
                this.wasExpanded = true;
                targetSize = Math.ceil(neededSize / this.growthIncrement) * this.growthIncrement;
            }
            this.#extendArray(targetSize);
        }
    }
    ;
    /**
     * Expends the buffer
     */
    #extendArray(targetSize) {
        this.open();
        if (targetSize <= this.size) {
            return;
        }
        const toPadd = targetSize - this.size;
        if (this.isBuffer(this.#data)) {
            var paddbuffer = Buffer.alloc(toPadd);
            this.data = Buffer.concat([this.#data, paddbuffer]);
        }
        else {
            const newBuf = new Uint8Array(this.size + toPadd);
            newBuf.set(this.#data);
            this.data = newBuf;
        }
        this.size = this.#data.length;
        this.bitSize = this.#data.length * 8;
        return;
    }
    ;
    ///////////////////////////////
    // #region FILE MODE
    ///////////////////////////////
    /**
     * Enables writing and expanding (changes strict AND readonly)
     *
     * @param {boolean} mode - True to enable writing and expanding (changes strict AND readonly)
     */
    writeMode(mode = true) {
        if (mode) {
            this.strict = false;
            this.readOnly = false;
            this.fsMode = "r+";
        }
        else {
            this.strict = true;
            this.readOnly = true;
            this.fsMode = "r";
        }
        if (!this.isMemoryMode) {
            this.close();
            this.open();
        }
    }
    ;
    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     *
     * Can be used to pass new data to a loaded class, shifting to memory mode.
     */
    open(data) {
        if (this.isBufferOrUint8Array(data)) {
            this.close();
            this.filePath = null;
            this.fd == null;
            this.isMemoryMode = true;
            this.data = data;
            this.#updateSize();
            this.#updateBuffer();
            return;
        }
        if (this.isMemoryMode) {
            return;
        }
        if (this.fd != null) {
            return;
        }
        if (typeof fs$1 === "undefined") {
            throw new Error("Can't load file outside of Node.");
        }
        if (!_fileExists$1(this.filePath)) {
            fs$1.writeFileSync(this.filePath, "");
        }
        try {
            this.fd = fs$1.openSync(this.filePath, this.fsMode);
        }
        catch (error) {
            throw new Error(error);
        }
        this.#updateSize();
        this.#updateBuffer();
    }
    ;
    /**
     * commit data and removes it.
     */
    close() {
        if (this.isMemoryMode) {
            const data = this.#data;
            this.#data = null;
            this.#view = null;
            return data;
        }
        if (this.fd === null) {
            return; // Already closed / or not open
        }
        if (typeof fs$1 === "undefined") {
            throw new Error("Can't load file outside of Node.");
        }
        this.commit();
        try {
            fs$1.closeSync(this.fd);
        }
        catch (error) {
            throw new Error(error);
        }
        this.fd = null;
        const data = this.#data;
        this.#data = null;
        this.#view = null;
        return data;
    }
    ;
    /**
     * Write data buffer back to file
     */
    commit() {
        if (this.isMemoryMode || this.readOnly) {
            return this.#data;
        }
        // this.mode == "file"
        this.open();
        try {
            fs$1.writeSync(this.fd, this.#data, 0, this.#data.length);
        }
        catch (error) {
            throw new Error(error);
        }
        this.#updateSize();
    }
    ;
    /**
     * syncs the data to file
     */
    flush() {
        if (this.fd) {
            this.commit();
        }
    }
    ;
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
    renameFile(newFilePath) {
        if (this.isMemoryMode) {
            return;
        }
        try {
            this.close();
            fs$1.renameSync(this.filePath, newFilePath);
        }
        catch (error) {
            throw new Error(error);
        }
        this.filePath = newFilePath;
        this.open();
    }
    ;
    /**
     * Deletes the working file.
     *
     * Note: This is permanent and can't be undone.
     *
     * It doesn't send the file to the recycling bin for recovery.
     */
    deleteFile() {
        if (this.isMemoryMode) {
            return;
        }
        if (this.readOnly) {
            throw new Error("Can't delete file in readonly mode!");
        }
        try {
            this.close();
            fs$1.unlinkSync(this.filePath);
        }
        catch (error) {
            throw new Error(error);
        }
        this.filePath = null;
    }
    ;
    ///////////////////////////////
    // #region ENDIANNESS
    ///////////////////////////////
    /**
     *
     * Change endian, defaults to little.
     *
     * Can be changed at any time, doesn't loose position.
     *
     * @param {endian} endian - endianness ``big`` or ``little``
     */
    endianness(endian) {
        if (endian == undefined || typeof endian != "string") {
            throw new TypeError("Endian must be big or little");
        }
        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new TypeError("Endian must be big or little");
        }
        this.endian = endian;
    }
    ;
    /**
     * Sets endian to big.
     */
    bigEndian() {
        this.endianness("big");
    }
    ;
    /**
     * Sets endian to big.
     */
    big() {
        this.endianness("big");
    }
    ;
    /**
     * Sets endian to big.
     */
    be() {
        this.endianness("big");
    }
    ;
    /**
     * Sets endian to little.
     */
    littleEndian() {
        this.endianness("little");
    }
    ;
    /**
     * Sets endian to little.
     */
    little() {
        this.endianness("little");
    }
    ;
    /**
     * Sets endian to little.
     */
    le() {
        this.endianness("little");
    }
    ;
    ///////////////////////////////
    // #region SIZE
    ///////////////////////////////
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get length() {
        return this.size;
    }
    ;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get len() {
        return this.size;
    }
    ;
    /**
     * Size in bytes of the current buffer.
     *
     *  @returns {number} size
     */
    get fileSize() {
        return this.size;
    }
    ;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get FileSize() {
        return this.size;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lengthBits() {
        return this.bitSize;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get sizeBits() {
        return this.bitSize;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get fileBitSize() {
        return this.bitSize;
    }
    ;
    /**
     * Size in bytes of the current buffer.
     *
     *  @returns {number} size
     */
    get fileSizeBits() {
        return this.bitSize;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lenBits() {
        return this.bitSize;
    }
    ;
    ///////////////////////////////
    // #region POSITION
    ///////////////////////////////
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get offset() {
        return this.#offset;
    }
    ;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get off() {
        return this.offset;
    }
    ;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get getOffset() {
        return this.offset;
    }
    ;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get tell() {
        return this.offset;
    }
    ;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get FTell() {
        return this.offset;
    }
    ;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get saveOffset() {
        return this.offset;
    }
    ;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get byteOffset() {
        return this.offset;
    }
    ;
    /**
     * Set the current byte position.
     *
     * Same as {@link goto}
     */
    set offset(value) {
        this.goto(value);
    }
    ;
    /**
     * Set the current byte position.
     *
     * Same as {@link goto}
     */
    set setOffset(value) {
        this.offset = value;
    }
    ;
    /**
     * Set the current byte position.
     *
     * Same as {@link goto}
     */
    set setByteOffset(value) {
        this.offset = value;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get bitOffset() {
        return (this.#offset * 8) + this.#insetBit;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offsetBits() {
        return this.bitOffset;
    }
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get getBitOffset() {
        return this.bitOffset;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get saveBitOffset() {
        return this.bitOffset;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get FTellBits() {
        return this.bitOffset;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get tellBits() {
        return this.bitOffset;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offBits() {
        return this.bitOffset;
    }
    ;
    /**
     * Set the current bit position.
     *
     * Same as {@link goto}
     */
    set bitOffset(value) {
        this.goto(value - (value % 8), value % 8);
    }
    ;
    /**
     * Set the current bit position.
     */
    set setOffsetBits(value) {
        this.bitOffset = value;
    }
    ;
    /**
     * Set the current bit position.
     */
    set setBitOffset(value) {
        this.setOffsetBits = value;
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get insetBit() {
        return this.#insetBit;
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get getInsetBit() {
        return this.insetBit;
    }
    ;
    /**
     * Set the current bit position with in the current byte (0-7).
     */
    set insetBit(value) {
        this.goto(this.offset, value % 8);
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get saveInsetBit() {
        return this.insetBit;
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get inBit() {
        return this.insetBit;
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get bitTell() {
        return this.insetBit;
    }
    ;
    /**
     * Set the current bit position with in the byte (0-7).
     */
    set setInsetBit(value) {
        this.insetBit = value;
    }
    ;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remain() {
        return this.size - this.#offset;
    }
    ;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remainBytes() {
        return this.remain;
    }
    ;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get FEoF() {
        return this.remainBytes;
    }
    ;
    /**
     * Size in bits of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remainBits() {
        return (this.size * 8) - this.bitOffset;
    }
    ;
    /**
     * Size in bits of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get FEoFBits() {
        return this.remainBits;
    }
    ;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get getLine() {
        return Math.abs(Math.floor((this.#offset - 1) / 16));
    }
    ;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get row() {
        return this.getLine;
    }
    ;
    ///////////////////////////////
    // #region FINISHING
    ///////////////////////////////
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    get() {
        if (this.growthIncrement != 0 && this.wasExpanded) {
            this.trim();
        }
        return this.#data;
    }
    ;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    getFullBuffer() {
        return this.get();
    }
    ;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    return() {
        return this.get();
    }
    ;
    /**
     * Returns and remove data.
     *
     * Commits any changes to file when editing a file.
     */
    end() {
        return this.close();
    }
    ;
    /**
     * removes data.
     *
     * Commits any changes to file when editing a file.
     */
    done() {
        return this.end();
    }
    ;
    /**
     * removes data.
     *
     * Commits any changes to file when editing a file.
     */
    finished() {
        return this.end();
    }
    ;
    ///////////////////////////////
    // #region HEX DUMP
    ///////////////////////////////
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
    hexdump(options = {}) {
        const length = options?.length ?? 192;
        const startByte = options?.startByte ?? this.#offset;
        const endByte = Math.min(startByte + length, this.size);
        const newSize = endByte - startByte;
        if (startByte > this.size || endByte > this.size) {
            throw new RangeError("Hexdump amount is outside of data size: " + newSize + " of " + endByte);
        }
        return _hexDump(this.data, options, startByte, endByte);
    }
    ;
    /**
     * Turn hexdump on error off (default on).
     */
    errorDumpOff() {
        this.errorDump = false;
    }
    ;
    /**
     * Turn hexdump on error on (default on).
     */
    errorDumpOn() {
        this.errorDump = true;
    }
    ;
    ///////////////////////////////
    // #region STRICT MODE
    ///////////////////////////////
    /**
     * Disallows extending data if position is outside of max size.
     */
    restrict() {
        this.strict = true;
    }
    ;
    /**
     * Allows extending data if position is outside of max size.
     */
    unrestrict() {
        this.strict = false;
    }
    ;
    ///////////////////////////////
    // #region   FIND 
    ///////////////////////////////
    /**
     * Searches for position of array of byte values from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {Uint8Array | Buffer | Array<number>} bytesToFind
     */
    findBytes(bytesToFind) {
        if (Array.isArray(bytesToFind)) {
            bytesToFind = new Uint8Array(bytesToFind);
        }
        this.open();
        if (this.isBuffer(this.data)) {
            var offset = this.data.subarray(this.#offset, this.size).indexOf(bytesToFind);
            if (offset == -1) {
                return -1;
            }
            return offset + this.#offset;
        }
        // this.data == Uint8Array
        for (let i = this.#offset; i <= this.size - bytesToFind.length; i++) {
            var match = true;
            for (let j = 0; j < bytesToFind.length; j++) {
                if (this.data[i + j] !== bytesToFind[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i; // Found the string, return the index
            }
        }
        return -1;
    }
    ;
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
    findString(string, bytesPerChar = 1) {
        const encoded = textEncode(string, bytesPerChar);
        return this.findBytes(encoded);
    }
    ;
    #findNumber(value, bits, unsigned, endian = this.endian) {
        this.#checkSize(Math.floor(bits / 8), 0, this.#offset);
        for (let z = this.#offset; z <= (this.size - (bits / 8)); z++) {
            var offsetInBits = 0;
            var value = 0;
            for (var i = 0; i < bits;) {
                const remaining = bits - i;
                const bitOffset = offsetInBits & 7;
                const currentByte = this.data[z + (offsetInBits >> 3)];
                const read = Math.min(remaining, 8 - bitOffset);
                if (endian == "big") {
                    let mask = ~(0xFF << read);
                    let readBits = (currentByte >> (8 - read - bitOffset)) & mask;
                    value <<= read;
                    value |= readBits;
                }
                else {
                    let mask = ~(0xFF << read);
                    let readBits = (currentByte >> bitOffset) & mask;
                    value |= readBits << i;
                }
                offsetInBits += read;
                i += read;
            }
            if (unsigned || bits <= 7) {
                value = value >>> 0;
            }
            else {
                if (bits !== 32 && value & (1 << (bits - 1))) {
                    value |= -1 ^ ((1 << bits) - 1);
                }
            }
            if (value === value) {
                return z - this.#offset; // Found the byte, return the index from current
            }
        }
        return -1; // number not found
    }
    ;
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
    findByte(value, unsigned = true, endian = this.endian) {
        return this.#findNumber(value, 8, unsigned, endian);
    }
    ;
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
    findShort(value, unsigned = true, endian = this.endian) {
        return this.#findNumber(value, 16, unsigned, endian);
    }
    ;
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
    findInt(value, unsigned = true, endian = this.endian) {
        return this.#findNumber(value, 32, unsigned, endian);
    }
    ;
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
    findInt64(value, unsigned = true, endian = this.endian) {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        this.#checkSize(8, 0, this.#offset);
        for (let z = this.#offset; z <= (this.size - 8); z++) {
            var startingValue = BigInt(0);
            if (endian == "little") {
                for (let i = 0; i < 8; i++) {
                    startingValue = startingValue | BigInt((this.data[z + i] & 0xFF)) << BigInt(8 * i);
                }
                if (!unsigned) {
                    if (startingValue & (BigInt(1) << BigInt(63))) {
                        startingValue -= BigInt(1) << BigInt(64);
                    }
                }
            }
            else {
                for (let i = 0; i < 8; i++) {
                    startingValue = (startingValue << BigInt(8)) | BigInt((this.data[z + i] & 0xFF));
                }
                if (!unsigned) {
                    if (startingValue & (BigInt(1) << BigInt(63))) {
                        startingValue -= BigInt(1) << BigInt(64);
                    }
                }
            }
            if (startingValue == BigInt(value)) {
                return z;
            }
        }
        return -1; // number not found
    }
    ;
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
    findHalfFloat(value, endian = this.endian) {
        this.#checkSize(2, 0, this.#offset);
        for (let z = this.#offset; z <= (this.size - 2); z++) {
            var startingValue = 0;
            if (endian == "little") {
                startingValue = ((this.data[z + 1] & 0xFFFF) << 8) | (this.data[z] & 0xFFFF);
            }
            else {
                startingValue = ((this.data[z] & 0xFFFF) << 8) | (this.data[z + 1] & 0xFFFF);
            }
            const sign = (startingValue & 0x8000) >> 15;
            const exponent = (startingValue & 0x7C00) >> 10;
            const fraction = startingValue & 0x03FF;
            var floatValue;
            if (exponent === 0) {
                if (fraction === 0) {
                    floatValue = (sign === 0) ? 0 : -0; // +/-0
                }
                else {
                    // Denormalized number
                    floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
                }
            }
            else if (exponent === 0x1F) {
                if (fraction === 0) {
                    floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                }
                else {
                    floatValue = Number.NaN;
                }
            }
            else {
                // Normalized number
                floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
            }
            if (floatValue === value) {
                return z; // Found the number, return the index
            }
        }
        return -1; // number not found
    }
    ;
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
    findFloat(value, endian = this.endian) {
        this.#checkSize(4, 0, this.#offset);
        for (let z = this.#offset; z <= (this.size - 4); z++) {
            var startingValue = 0;
            if (endian == "little") {
                startingValue = ((this.data[z + 3] & 0xFF) << 24) |
                    ((this.data[z + 2] & 0xFF) << 16) |
                    ((this.data[z + 1] & 0xFF) << 8) |
                    (this.data[z] & 0xFF);
            }
            else {
                startingValue = ((this.data[z] & 0xFF) << 24) |
                    ((this.data[z + 1] & 0xFF) << 16) |
                    ((this.data[z + 2] & 0xFF) << 8) |
                    (this.data[z + 3] & 0xFF);
            }
            const isNegative = (startingValue & 0x80000000) !== 0 ? 1 : 0;
            // Extract the exponent and fraction parts
            const exponent = (startingValue >> 23) & 0xFF;
            const fraction = startingValue & 0x7FFFFF;
            // Calculate the float value
            var floatValue;
            if (exponent === 0) {
                // Denormalized number (exponent is 0)
                floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
            }
            else if (exponent === 0xFF) {
                // Infinity or NaN (exponent is 255)
                floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
            }
            else {
                // Normalized number
                floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
            }
            if (floatValue === value) {
                return z; // Found the number, return the index
            }
        }
        return -1; // number not found
    }
    ;
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
    findDoubleFloat(value, endian = this.endian) {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        this.#checkSize(8, 0, this.#offset);
        for (let z = this.#offset; z <= (this.size - 8); z++) {
            var startingValue = BigInt(0);
            if (endian == "little") {
                for (let i = 0; i < 8; i++) {
                    startingValue = startingValue | BigInt((this.data[z + i] & 0xFF)) << BigInt(8 * i);
                }
            }
            else {
                for (let i = 0; i < 8; i++) {
                    startingValue = (startingValue << BigInt(8)) | BigInt((this.data[z + i] & 0xFF));
                }
            }
            const sign = (startingValue & BigInt("9223372036854775808")) >> BigInt(63);
            const exponent = Number((startingValue & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;
            const fraction = Number(startingValue & BigInt("4503599627370495")) / Math.pow(2, 52);
            var floatValue;
            if (exponent == -1023) {
                if (fraction == 0) {
                    floatValue = (sign == BigInt(0)) ? 0 : -0; // +/-0
                }
                else {
                    // Denormalized number
                    floatValue = (sign == BigInt(0) ? 1 : -1) * Math.pow(2, -1022) * fraction;
                }
            }
            else if (exponent == 1024) {
                if (fraction == 0) {
                    floatValue = (sign == BigInt(0)) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                }
                else {
                    floatValue = Number.NaN;
                }
            }
            else {
                // Normalized number
                floatValue = (sign == BigInt(0) ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
            }
            if (floatValue == value) {
                return z;
            }
        }
        return -1; // number not found
    }
    ;
    ///////////////////////////////
    // #region MOVE TO
    ///////////////////////////////
    /**
     * Aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    align(number) {
        const a = this.#offset % number;
        if (a) {
            this.skip(number - a);
        }
    }
    ;
    /**
     * Reverse aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    alignRev(number) {
        const a = this.#offset % number;
        if (a) {
            this.skip(a * -1);
        }
    }
    ;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    skip(bytes, bits) {
        var newOffset = ((bytes + this.#offset) + Math.ceil((this.#insetBit + bits) / 8));
        if (bits && bits < 0) {
            newOffset = Math.floor((((bytes + this.#offset) * 8) + this.#insetBit + bits) / 8);
        }
        this.#confrimSize(newOffset);
        // Adjust byte offset based on bit overflow
        this.#offset += Math.floor((this.#insetBit + bits) / 8);
        // Adjust bit offset
        this.#insetBit = (this.#insetBit + normalizeBitOffset(bits)) % 8;
        // Adjust byte offset based on byte overflow
        this.#offset += bytes;
        // Ensure bit offset stays between 0-7
        this.#insetBit = Math.min(Math.max(this.#insetBit, 0), 7);
        // Ensure offset doesn't go negative
        this.#offset = Math.max(this.#offset, 0);
        return;
    }
    ;
    /**
    * Offset current byte or bit position.
    *
    * Note: Will extend array if strict mode is off and outside of max size.
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    jump(bytes, bits) {
        this.skip(bytes, bits);
    }
    ;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    seek(bytes, bits) {
        return this.skip(bytes, bits);
    }
    ;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    goto(byte = 0, bit = 0) {
        var newOffset = byte + Math.ceil(bit / 8);
        if (bit && bit < 0) {
            newOffset = Math.floor(((byte * 8) + bit) / 8);
        }
        this.#confrimSize(newOffset);
        this.#offset = byte;
        // Adjust byte offset based on bit overflow
        this.#offset += Math.floor(bit / 8);
        // Adjust bit offset
        this.#insetBit = normalizeBitOffset(bit) % 8;
        // Ensure bit offset stays between 0-7
        this.#insetBit = Math.min(Math.max(this.#insetBit, 0), 7);
        // Ensure offset doesn't go negative
        this.#offset = Math.max(this.#offset, 0);
        return;
    }
    ;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    FSeek(byte, bit) {
        return this.goto(byte, bit);
    }
    ;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    pointer(byte, bit) {
        return this.goto(byte, bit);
    }
    ;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    warp(byte, bit) {
        return this.goto(byte, bit);
    }
    ;
    /**
     * Set byte and bit position to start of data.
     */
    rewind() {
        this.#offset = 0;
        this.#insetBit = 0;
    }
    ;
    /**
     * Set byte and bit position to start of data.
     */
    gotoStart() {
        return this.rewind();
    }
    ;
    /**
     * Set current byte and bit position to end of data.
     */
    last() {
        this.#offset = this.size;
        this.#insetBit = 0;
    }
    ;
    /**
     * Set current byte and bit position to end of data.
     */
    gotoEnd() {
        this.last();
    }
    ;
    /**
     * Set byte and bit position to start of data.
     */
    EoF() {
        this.last();
    }
    ;
    ///////////////////////////////
    // #region REMOVE
    ///////////////////////////////
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
    delete(startOffset = 0, endOffset = this.#offset, consume = false) {
        if (this.readOnly || this.strict) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: Can not remove data in strict mode: endOffset " + endOffset + " of " + this.size);
        }
        this.open();
        startOffset = Math.abs(startOffset);
        this.#confrimSize(endOffset);
        const dataRemoved = this.data.subarray(startOffset, endOffset);
        const part1 = this.data.subarray(0, startOffset);
        const part2 = this.data.subarray(endOffset, this.size);
        if (this.isBuffer(this.data)) {
            this.data = Buffer.concat([part1, part2]);
        }
        else {
            const newBuf = new Uint8Array(part1.byteLength + part2.byteLength);
            newBuf.set(part1, 0);
            newBuf.set(part2, part1.byteLength);
            this.data = newBuf;
        }
        this.size = this.data.length;
        this.bitSize = this.data.length * 8;
        if (consume) {
            this.#offset = startOffset;
            this.#insetBit = 0;
        }
        return dataRemoved;
    }
    ;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    clip() {
        return this.delete(this.#offset, this.size, false);
    }
    ;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    trim() {
        return this.delete(this.#offset, this.size, false);
    }
    ;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    crop(length = 0, consume = false) {
        return this.delete(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Deletes part of data from current position to supplied length, returns removed.
     *
     * Note: Only works in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    drop(length = 0, consume = false) {
        return this.delete(this.#offset, this.#offset + length, consume);
    }
    ;
    ///////////////////////////////
    // #region REPLACE
    ///////////////////////////////
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode if past end of data.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {number} offset - Offset to add it at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default false)
     */
    replace(data, offset = this.#offset, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't replace data in readOnly mode!");
        }
        this.open();
        // input is Buffer
        if (this.isBuffer(data)) {
            if (this.isUint8Array(this.data)) {
                // source is Uint8Array
                data = new Uint8Array(data);
            }
        }
        else {
            // input is Uint8Array
            if (this.isBuffer(this.data)) {
                // source is Buffer
                data = Buffer.from(data);
            }
        }
        const neededSize = offset + data.length;
        this.#confrimSize(neededSize);
        const part1 = this.data.subarray(0, neededSize - data.length);
        const part2 = this.data.subarray(neededSize, this.size);
        if (this.isBuffer(this.data)) {
            this.data = Buffer.concat([part1, data, part2]);
        }
        else {
            const newBuf = new Uint8Array(part1.byteLength + data.byteLength + part2.byteLength);
            newBuf.set(part1, 0);
            newBuf.set(data, part1.byteLength);
            newBuf.set(part2, part1.byteLength + data.byteLength);
            this.data = newBuf;
        }
        this.size = this.data.length;
        this.bitSize = this.data.length * 8;
        if (consume) {
            this.#offset = offset + data.length;
            this.#insetBit = 0;
        }
    }
    ;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {number} offset - Offset to add it at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default false)
     */
    overwrite(data, offset = this.#offset, consume = false) {
        return this.replace(data, offset, consume);
    }
    ;
    ///////////////////////////////
    // #region  COPY OUT
    ///////////////////////////////
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    fill(startOffset = this.#offset, endOffset = this.size, consume = false, fillValue) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't remove data in readonly mode!");
        }
        this.open();
        if (startOffset < 0 || endOffset > this.size) {
            throw new RangeError('Remove range out of bounds');
        }
        const removeLen = endOffset - startOffset;
        if (removeLen <= 0) {
            if (this.isMemoryMode) {
                if (this.isBuffer(this.data)) {
                    return Buffer.alloc(0);
                }
                else {
                    return new Uint8Array(0);
                }
            }
            else {
                return Buffer.alloc(0);
            }
        }
        if (endOffset > this.size && this.strict) {
            throw new Error('Cannot extend data while in strict mode. Use unrestrict() to enable.');
        }
        this.#confrimSize(endOffset);
        const dataRemoved = this.data.subarray(startOffset, endOffset);
        // without a fill value it's a basic lift
        if (fillValue != undefined) {
            const part1 = this.data.subarray(0, startOffset);
            const part2 = this.data.subarray(endOffset, this.size);
            const replacement = new Array(dataRemoved.length).fill(fillValue & 0xff);
            if (isBuffer(this.data)) {
                const buffReplacement = Buffer.from(replacement);
                this.data = Buffer.concat([part1, buffReplacement, part2]);
            }
            else {
                const newBuf = new Uint8Array(part1.byteLength + replacement.length + part2.byteLength);
                newBuf.set(part1, 0);
                newBuf.set(replacement, part1.byteLength);
                newBuf.set(part2, part1.byteLength + replacement.length);
                this.data = newBuf;
            }
            this.size = this.data.length;
            this.bitSize = this.data.length * 8;
        }
        if (consume) {
            this.#offset = endOffset;
            this.#insetBit = 0;
        }
        return dataRemoved;
    }
    ;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    lift(startOffset = this.#offset, endOffset = this.size, consume = false, fillValue) {
        return this.fill(startOffset, endOffset, consume, fillValue);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    extract(length = 0, consume = false) {
        return this.fill(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    slice(length = 0, consume = false) {
        return this.fill(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    wrap(length = 0, consume = false) {
        return this.fill(this.#offset, this.#offset + length, consume);
    }
    ;
    ///////////////////////////////
    // #region   INSERT
    ///////////////////////////////
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    insert(data, offset = this.#offset, consume = true) {
        if (this.strict == true || this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Can not insert data in strict mode. Use unrestrict() to enable.`);
        }
        if (!this.strict) {
            if (offset < 0 || offset > this.size) {
                throw new RangeError('Insert offset out of bounds');
            }
        }
        this.open();
        // input is Buffer
        if (this.isBuffer(data)) {
            if (this.isUint8Array(this.data)) {
                // source is Uint8Array
                data = new Uint8Array(data);
            }
        }
        else {
            // input is Uint8Array
            if (this.isBuffer(this.data)) {
                // source is Buffer
                data = Buffer.from(data);
            }
        }
        const insertLen = data?.length ?? 0;
        if (insertLen === 0) {
            return;
        }
        const part1 = this.data.subarray(0, offset);
        const part2 = this.data.subarray(offset, this.size);
        if (this.isBuffer(this.data)) {
            this.data = Buffer.concat([part1, data, part2]);
        }
        else {
            const newBuf = new Uint8Array(part1.byteLength + data.byteLength + part2.byteLength);
            newBuf.set(part1, 0);
            newBuf.set(data, part1.byteLength);
            newBuf.set(part2, part1.byteLength + data.byteLength);
            this.data = newBuf;
        }
        this.size = this.data.length;
        this.bitSize = this.data.length * 8;
        if (consume) {
            this.#offset = offset + data.length;
            this.#insetBit = 0;
        }
    }
    ;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    place(data, offset = this.#offset, consume = true) {
        return this.insert(data, offset, consume);
    }
    ;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data, consume = false) {
        return this.insert(data, 0, consume);
    }
    ;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data, consume = false) {
        return this.insert(data, 0, consume);
    }
    ;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data, consume = false) {
        return this.insert(data, this.size, consume);
    }
    ;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data, consume = false) {
        return this.push(data, consume);
    }
    ;
    ///////////////////////////////
    // #region  MATH 
    ///////////////////////////////
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xor(xorKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        }
        else if (!(this.isBufferOrUint8Array(xorKey) || typeof xorKey == "number")) {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        this.open();
        this.#confrimSize(endOffset);
        const returnData = _XOR(this.data, startOffset, Math.min(endOffset, this.size), xorKey);
        if (consume) {
            this.#offset = returnData.offset;
            this.#insetBit = returnData.bitoffset;
        }
    }
    ;
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xorThis(xorKey, length, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof xorKey == "number") {
            length = length ?? 1;
        }
        else if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
            length = length ?? xorKey.length;
        }
        else if (this.isBufferOrUint8Array(xorKey)) {
            length = length ?? xorKey.length;
        }
        else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return this.xor(xorKey, this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * OR data
     *
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    or(orKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        }
        else if (!(this.isBufferOrUint8Array(orKey) || typeof orKey == "number")) {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        this.open();
        this.#confrimSize(endOffset);
        const returnData = _OR(this.data, startOffset, Math.min(endOffset, this.size), orKey);
        if (consume) {
            this.#offset = returnData.offset;
            this.#insetBit = returnData.bitoffset;
        }
    }
    ;
    /**
     * OR data.
     *
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    orThis(orKey, length, consume) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof orKey == "number") {
            length = length ?? 1;
        }
        else if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
            length = length ?? orKey.length;
        }
        else if (this.isBufferOrUint8Array(orKey)) {
            length = length ?? orKey.length;
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return this.or(orKey, this.#offset, this.#offset + length, consume || false);
    }
    ;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    and(andKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof andKey == "string") {
            andKey = new TextEncoder().encode(andKey);
        }
        else if (!(typeof andKey == "object" || typeof andKey == "number")) {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        this.open();
        this.#confrimSize(endOffset);
        const returnData = _AND(this.data, startOffset, Math.min(endOffset, this.size), andKey);
        if (consume) {
            this.#offset = returnData.offset;
            this.#insetBit = returnData.bitoffset;
        }
    }
    ;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey, length, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof andKey == "number") {
            length = length ?? 1;
        }
        else if (typeof andKey == "string") {
            andKey = new TextEncoder().encode(andKey);
            length = length ?? andKey.length;
        }
        else if (this.isBufferOrUint8Array(andKey)) {
            length = length ?? andKey.length;
        }
        else {
            throw new Error("AND must be a number, string, Uint8Array or Buffer");
        }
        return this.and(andKey, this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    add(addKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof addKey == "string") {
            addKey = new TextEncoder().encode(addKey);
        }
        else if (!(typeof addKey == "object" || typeof addKey == "number")) {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        this.open();
        this.#confrimSize(endOffset);
        const returnData = _ADD(this.data, startOffset, Math.min(endOffset, this.size), addKey);
        if (consume) {
            this.#offset = returnData.offset;
            this.#insetBit = returnData.bitoffset;
        }
    }
    ;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey, length, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof addKey == "number") {
            length = length ?? 1;
        }
        else if (typeof addKey == "string") {
            addKey = new TextEncoder().encode(addKey);
            length = length ?? addKey.length;
        }
        else if (this.isBufferOrUint8Array(addKey)) {
            length = length ?? addKey.length;
        }
        else {
            throw new Error("ADD must be a number, string, Uint8Array or Buffer");
        }
        return this.add(addKey, this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    not(startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        this.open();
        this.#confrimSize(endOffset);
        const returnData = _NOT(this.data, startOffset, Math.min(endOffset, this.size));
        if (consume) {
            this.#offset = returnData.offset;
            this.#insetBit = returnData.bitoffset;
        }
    }
    ;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length = 1, consume = false) {
        return this.not(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShift(shiftKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
        }
        else if (!(typeof shiftKey == "object" || typeof shiftKey == "number")) {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        this.open();
        this.#confrimSize(endOffset);
        const returnData = _LSHIFT(this.data, startOffset, Math.min(endOffset, this.size), shiftKey);
        if (consume) {
            this.#offset = returnData.offset;
            this.#insetBit = returnData.bitoffset;
        }
    }
    ;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey, length, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof shiftKey == "number") {
            length = length ?? 1;
        }
        else if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
            length = length ?? shiftKey.length;
        }
        else if (this.isBufferOrUint8Array(shiftKey)) {
            length = length ?? shiftKey.length;
        }
        else {
            throw new Error("Left shift must be a number, string, Uint8Array or Buffer");
        }
        return this.lShift(shiftKey, this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShift(shiftKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
        }
        else if (!(typeof shiftKey == "object" || typeof shiftKey == "number")) {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        this.open();
        this.#confrimSize(endOffset);
        const returnData = _RSHIFT(this.data, startOffset, Math.min(endOffset, this.size), shiftKey);
        if (consume) {
            this.#offset = returnData.offset;
            this.#insetBit = returnData.bitoffset;
        }
    }
    ;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey, length, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (typeof shiftKey == "number") {
            length = length ?? 1;
        }
        else if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
            length = length ?? shiftKey.length;
        }
        else if (this.isBufferOrUint8Array(shiftKey)) {
            length = length ?? shiftKey.length;
        }
        else {
            throw new Error("right shift must be a number, string, Uint8Array or Buffer");
        }
        return this.rShift(shiftKey, this.#offset, this.#offset + length, consume);
    }
    ;
    ///////////////////////////////
    // #region BIT READER
    ///////////////////////////////
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
    readBit(bits, unsigned = false, endian = this.endian, consume = true) {
        this.open();
        if (typeof bits != "number") {
            throw new TypeError("Enter number of bits to read");
        }
        if (bits == 0) {
            return 0;
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32. Got ' + bits);
        }
        const sizeNeeded = Math.floor(((bits - 1) + this.#insetBit) / 8) + this.#offset;
        this.#confrimSize(sizeNeeded);
        const bitStart = (this.#offset * 8) + this.#insetBit;
        const value = _rbit(this.data, bits, bitStart, endian, unsigned);
        if (consume) {
            this.#offset += Math.floor((bits + this.#insetBit) / 8);
            this.#insetBit = (bits + this.#insetBit) % 8;
        }
        return value;
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitBE(bits) {
        return this.readBit(bits, true, "big");
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitLE(bits) {
        return this.readBit(bits, true, "little");
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitBE(bits, unsigned) {
        return this.readBit(bits, unsigned, "big");
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitLE(bits, unsigned) {
        return this.readBit(bits, unsigned, "little");
    }
    ;
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
    writeBit(value, bits, unsigned = false, endian = this.endian, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readOnly mode!");
        }
        this.open();
        if (bits == 0) {
            return;
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32. Got ' + bits);
        }
        value = numberSafe(value, bits, unsigned);
        const endOffset = Math.ceil(((bits - 1) + this.#insetBit) / 8) + this.#offset;
        this.#confrimSize(endOffset);
        const offset = (this.#offset * 8) + this.#insetBit;
        _wbit(this.data, value, bits, offset, endian, unsigned);
        if (consume) {
            this.#offset += Math.floor((bits + this.#insetBit) / 8);
            this.#insetBit = (bits + this.#insetBit) % 8;
        }
        return;
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitBE(value, bits) {
        return this.writeBit(value, bits, true, "big");
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitLE(value, bits) {
        return this.writeBit(value, bits, true, "little");
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
     * @returns number
     */
    writeBitBE(value, bits, unsigned) {
        return this.writeBit(value, bits, unsigned, "big");
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
     * @returns number
     */
    writeBitLE(value, bits, unsigned) {
        return this.writeBit(value, bits, unsigned, "little");
    }
    ;
    ///////////////////////////////
    // #region BYTE READER
    ///////////////////////////////
    /**
     * Read byte.
     *
     * @param {boolean} unsigned - if the value is unsigned or not
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readByte(unsigned = false, consume = true) {
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(1, 0, trueByte);
        var value;
        if (canInt8) {
            value = unsigned ? this.view.getUint8(trueByte) : this.view.getInt8(trueByte);
        }
        else {
            value = _rbyte(this.data, trueByte, unsigned);
        }
        if (consume) {
            this.#offset += 1;
            this.#insetBit = 0;
        }
        return value;
    }
    ;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    readUByte() {
        return this.readByte(true);
    }
    ;
    /**
     * Read multiple bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {boolean} consume - move offset after read
     * @returns {number[]}
     */
    readBytes(amount, unsigned, consume = true) {
        return Array.from({ length: amount }, () => this.readByte(unsigned, consume));
    }
    ;
    /**
     * Read multiple unsigned bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} consume - move offset after read
     * @returns {number[]}
     */
    readUBytes(amount, consume = true) {
        return this.readBytes(amount, true, consume);
    }
    ;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    writeByte(value, unsigned = false, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readonly mode!");
        }
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(1, 0, trueByte);
        if (canInt8) {
            if (unsigned) {
                this.view.setUint8(trueByte, value);
            }
            else {
                this.view.setInt8(trueByte, value);
            }
        }
        else {
            _wbyte(this.data, numberSafe(value, 8, unsigned), trueByte, unsigned);
        }
        if (consume) {
            this.#offset += 1;
            this.#insetBit = 0;
        }
        return;
    }
    ;
    /**
     * Write multiple bytes.
     *
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    writeBytes(values, unsigned, consume = true) {
        for (let i = 0; i < values.length; i++) {
            this.writeByte(values[i], unsigned, consume);
        }
    }
    ;
    /**
     * Write multiple unsigned bytes.
     *
     * @param {number[]} values - array of values as int
     * @param {boolean} consume - move offset after write
     */
    writeUBytes(values, consume = true) {
        return this.writeBytes(values, true, consume);
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    writeUByte(value) {
        return this.writeByte(value, true);
    }
    ;
    ///////////////////////////////
    // #region INT16 READER
    ///////////////////////////////
    /**
     * Read short.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readInt16(unsigned = false, endian = this.endian, consume = true) {
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(2, 0, trueByte);
        var value;
        if (canInt16) {
            if (unsigned) {
                value = this.view.getUint16(trueByte, endian == "little");
            }
            else {
                value = this.view.getInt16(trueByte, endian == "little");
            }
        }
        else {
            value = _rint16(this.data, trueByte, endian, unsigned);
        }
        if (consume) {
            this.#offset += 2;
            this.#insetBit = 0;
        }
        return value;
    }
    ;
    /**
     * Read unsigned short.
     *
     * @param {endian} endian - ``big`` or ``little``
     *
     * @returns {number}
     */
    readUInt16(endian = this.endian) {
        return this.readInt16(true, endian);
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    readUInt16LE() {
        return this.readUInt16("little");
    }
    ;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    readUInt16BE() {
        return this.readUInt16("big");
    }
    ;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    readInt16LE() {
        return this.readInt16(false, "little");
    }
    ;
    /**
    * Read signed short in big endian.
    *
    * @returns {number}
    */
    readInt16BE() {
        return this.readInt16(false, "big");
    }
    ;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt16(value, unsigned = false, endian = this.endian, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(2, 0, trueByte);
        if (canInt16) {
            if (unsigned) {
                this.view.setUint16(trueByte, value, endian == "little");
            }
            else {
                this.view.setInt16(trueByte, value, endian == "little");
            }
        }
        else {
            _wint16(this.data, numberSafe(value, 16, unsigned), trueByte, endian, unsigned);
        }
        if (consume) {
            this.#offset += 2;
            this.#insetBit = 0;
        }
        return;
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value, endian = this.endian) {
        return this.writeInt16(value, true, endian);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16BE(value) {
        return this.writeUInt16(value, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16LE(value) {
        return this.writeUInt16(value, "little");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    writeInt16LE(value) {
        return this.writeInt16(value, false, "little");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    writeInt16BE(value) {
        return this.writeInt16(value, false, "big");
    }
    ;
    ///////////////////////////////
    // #region HALF FLOAT
    ///////////////////////////////
    /**
     * Read 16 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readHalfFloat(endian = this.endian, consume = true) {
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(2, 0, trueByte);
        var value;
        if (canFloat16) {
            value = this.view.getFloat16(trueByte, endian == "little");
        }
        else {
            value = _rhalffloat(this.data, trueByte, endian);
        }
        if (consume) {
            this.#offset += 2;
            this.#insetBit = 0;
        }
        return value;
    }
    ;
    /**
     * Read 16 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readFloat16(endian = this.endian, consume = true) {
        return this.readHalfFloat(endian, consume);
    }
    ;
    /**
    * Read 16 bit float.
    *
    * @returns {number}
    */
    readHalfFloatBE() {
        return this.readHalfFloat("big");
    }
    ;
    /**
    * Read 16 bit float.
    *
    * @returns {number}
    */
    readFloat16BE() {
        return this.readHalfFloat("big");
    }
    ;
    /**
     * Read 16 bit float.
     *
     * @returns {number}
     */
    readHalfFloatLE() {
        return this.readHalfFloat("little");
    }
    ;
    /**
     * Read 16 bit float.
     *
     * @returns {number}
     */
    readFloat16LE() {
        return this.readHalfFloat("little");
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeHalfFloat(value, endian = this.endian, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(2, 0, trueByte);
        if (canFloat16) {
            this.view.setFloat16(trueByte, value, endian == "little");
        }
        else {
            _whalffloat(this.data, value, trueByte, endian);
        }
        if (consume) {
            this.#offset += 2;
            this.#insetBit = 0;
        }
        return;
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeFloat16(value, endian = this.endian, consume = true) {
        return this.writeHalfFloat(value, endian, consume);
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatBE(value) {
        return this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat16BE(value) {
        return this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatLE(value) {
        return this.writeHalfFloat(value, "little");
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat16LE(value) {
        return this.writeHalfFloat(value, "little");
    }
    ;
    ///////////////////////////////
    // #region INT32 READER
    ///////////////////////////////
    /**
     * Read 32 bit integer.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readInt32(unsigned = false, endian = this.endian, consume = true) {
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(4, 0, trueByte);
        var value;
        if (canInt32) {
            if (unsigned) {
                value = this.view.getUint32(trueByte, endian == "little");
            }
            else {
                value = this.view.getInt32(trueByte, endian == "little");
            }
        }
        else {
            value = _rint32(this.data, trueByte, endian, unsigned);
        }
        if (consume) {
            this.#offset += 4;
            this.#insetBit = 0;
        }
        return value;
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt(endian = this.endian) {
        return this.readInt32(false, endian);
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32BE() {
        return this.readInt("big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32LE() {
        return this.readInt("little");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readUInt32(endian = this.endian) {
        return this.readInt32(true, endian);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readUInt(endian = this.endian) {
        return this.readInt32(true, endian);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    readUInt32BE() {
        return this.readUInt("big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readUInt32LE() {
        return this.readUInt("little");
    }
    ;
    /**
     * Write 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt32(value, unsigned = false, endian = this.endian, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(4, 0, trueByte);
        if (canInt32) {
            if (unsigned) {
                this.view.setUint32(trueByte, value, endian == "little");
            }
            else {
                this.view.setInt32(trueByte, value, endian == "little");
            }
        }
        else {
            _wint32(this.data, numberSafe(value, 32, unsigned), trueByte, endian, unsigned);
        }
        if (consume) {
            this.#offset += 4;
            this.#insetBit = 0;
        }
        return;
    }
    ;
    /**
     * Write signed 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt(value, endian = this.endian) {
        return this.writeInt32(value, false, endian);
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32LE(value) {
        return this.writeInt(value, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32BE(value) {
        return this.writeInt(value, "big");
    }
    ;
    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt(value, endian = this.endian) {
        return this.writeInt32(value, true, endian);
    }
    ;
    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value, endian = this.endian) {
        return this.writeUInt(value, endian);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32BE(value) {
        return this.writeUInt32(value, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32LE(value) {
        return this.writeUInt32(value, "little");
    }
    ;
    ///////////////////////////////
    // #region FLOAT32 READER
    ///////////////////////////////
    /**
     * Read 32 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readFloat(endian = this.endian, consume = true) {
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(4, 0, trueByte);
        var value;
        if (canFloat32) {
            value = this.view.getFloat32(trueByte, endian == "little");
        }
        else {
            value = _rfloat(this.data, trueByte, endian);
        }
        if (consume) {
            this.#offset += 4;
            this.#insetBit = 0;
        }
        return value;
    }
    ;
    /**
     * Read 32 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readFloat32(endian = this.endian, consume = true) {
        return this.readFloat(endian, consume);
    }
    ;
    /**
     * Read 32 bit float.
     *
     * @returns {number}
     */
    readFloatBE() {
        return this.readFloat("big");
    }
    ;
    /**
     * Read 32 bit float.
     *
     * @returns {number}
     */
    readFloat32BE() {
        return this.readFloat("big");
    }
    ;
    /**
     * Read 32 bit float.
     *
     * @returns {number}
     */
    readFloatLE() {
        return this.readFloat("little");
    }
    ;
    /**
     * Read 32 bit float.
     *
     * @returns {number}
     */
    readFloat32LE() {
        return this.readFloat("little");
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeFloat(value, endian = this.endian, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(4, 0, trueByte);
        if (canFloat32) {
            this.view.setFloat32(trueByte, value, endian == "little");
        }
        else {
            _wfloat(this.data, value, trueByte, endian);
        }
        if (consume) {
            this.#offset += 4;
            this.#insetBit = 0;
        }
        return;
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloatLE(value) {
        return this.writeFloat(value, "little");
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat32LE(value) {
        return this.writeFloat(value, "little");
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat32BE(value) {
        return this.writeFloat(value, "big");
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloatBE(value) {
        return this.writeFloat(value, "big");
    }
    ;
    ///////////////////////////////
    // #region INT64 READER
    ///////////////////////////////
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readInt64(unsigned = false, endian = this.endian, consume = true) {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(8, 0, trueByte);
        var value;
        if (canBigInt64) {
            if (unsigned) {
                value = this.view.getBigUint64(trueByte, endian == "little");
            }
            else {
                value = this.view.getBigInt64(trueByte, endian == "little");
            }
        }
        else {
            value = _rint64(this.data, trueByte, endian, unsigned);
        }
        if (consume) {
            this.#offset += 8;
            this.#insetBit = 0;
        }
        if (this.enforceBigInt == true || (typeof value == "bigint" && !isSafeInt64(value))) {
            return value;
        }
        else {
            if (isSafeInt64(value)) {
                return Number(value);
            }
            else {
                throw new Error("Value is outside of number range and enforceBigInt is set to false. " + value);
            }
        }
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64() {
        return this.readInt64(true);
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readInt64BE() {
        return this.readInt64(false, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readInt64LE() {
        return this.readInt64(false, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64BE() {
        return this.readInt64(true, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64LE() {
        return this.readInt64(true, "little");
    }
    ;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt64(value, unsigned = false, endian = this.endian, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(8, 0, trueByte);
        if (canBigInt64) {
            if (unsigned) {
                this.view.setBigInt64(trueByte, BigInt(value), endian == "little");
            }
            else {
                this.view.setBigUint64(trueByte, BigInt(value), endian == "little");
            }
        }
        else {
            _wint64(this.data, numberSafe(value, 64, unsigned), trueByte, endian, unsigned);
        }
        if (consume) {
            this.#offset += 8;
            this.#insetBit = 0;
        }
        return;
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt64(value, endian = this.endian) {
        return this.writeInt64(value, true, endian);
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeInt64LE(value) {
        return this.writeInt64(value, false, "little");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeInt64BE(value) {
        return this.writeInt64(value, false, "big");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64LE(value) {
        return this.writeInt64(value, true, "little");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64BE(value) {
        return this.writeInt64(value, true, "big");
    }
    ;
    ///////////////////////////////
    // #region FLOAT64 READER
    ///////////////////////////////
    /**
     * Read 64 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian = this.endian, consume = true) {
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(8, 0, trueByte);
        var value;
        if (canFloat64) {
            value = this.view.getFloat64(trueByte, endian == "little");
        }
        else {
            if (!hasBigInt) {
                throw new Error("System doesn't support BigInt values.");
            }
            value = _rdfloat(this.data, trueByte, endian);
        }
        if (consume) {
            this.#offset += 8;
            this.#insetBit = 0;
        }
        return value;
    }
    ;
    /**
     * Read 64 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat64(endian = this.endian) {
        return this.readDoubleFloat(endian);
    }
    ;
    /**
     * Read 64 bit float.
     *
     * @returns {number}
     */
    readDoubleFloatBE() {
        return this.readDoubleFloat("big");
    }
    ;
    /**
     * Read 64 bit float.
     *
     * @returns {number}
     */
    readFloat64BE() {
        return this.readDoubleFloat("big");
    }
    ;
    /**
     * Read 64 bit float.
     *
     * @returns {number}
     */
    readDoubleFloatLE() {
        return this.readDoubleFloat("little");
    }
    ;
    /**
     * Read 64 bit float.
     *
     * @returns {number}
     */
    readFloat64LE() {
        return this.readDoubleFloat("little");
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value, endian = this.endian, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        this.open();
        var trueByte = this.#offset;
        var trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#checkSize(8, 0, trueByte);
        if (canFloat64) {
            this.view.setFloat64(trueByte, value, endian == "little");
        }
        else {
            _wdfloat(this.data, value, trueByte, endian);
        }
        if (consume) {
            this.#offset += 8;
            this.#insetBit = 0;
        }
        return;
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat64(value, endian = this.endian) {
        return this.writeDoubleFloat(value, endian);
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatBE(value) {
        return this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat64BE(value) {
        return this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatLE(value) {
        return this.writeDoubleFloat(value, "little");
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    writeFloat64LE(value) {
        return this.writeDoubleFloat(value, "little");
    }
    ;
    ///////////////////////////////
    // #region STRING READER
    ///////////////////////////////
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
    readString(options = this.strDefaults, consume = true) {
        this.open();
        var length = options.length;
        var stringType = options.stringType ?? 'utf-8';
        var terminateValue = options.terminateValue;
        var lengthReadSize = options.lengthReadSize ?? 1;
        var stripNull = options.stripNull ?? true;
        var endian = options.endian ?? this.endian;
        var encoding = options.encoding ?? 'utf-8';
        var terminate = terminateValue;
        var readLengthinBytes = 0;
        if (length != undefined) {
            switch (stringType) {
                case "utf-8":
                    readLengthinBytes = length;
                    break;
                case "utf-16":
                    readLengthinBytes = length * 2;
                    break;
                case "utf-32":
                    readLengthinBytes = length * 4;
                    break;
                default:
                    readLengthinBytes = length;
                    break;
            }
            this.#checkSize(readLengthinBytes);
        }
        else {
            readLengthinBytes = this.data.length - this.#offset;
        }
        if (terminateValue != undefined && typeof terminateValue == "number") {
            terminate = terminateValue & 0xFF;
        }
        else {
            terminate = 0;
        }
        const saved_offset = this.#offset;
        const saved_bitoffset = this.#insetBit;
        const str = _rstring(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, this.readUByte.bind(this), this.readUInt16.bind(this), this.readUInt32.bind(this));
        if (!consume) {
            this.#offset = saved_offset;
            this.#insetBit = saved_bitoffset;
        }
        return str;
    }
    ;
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
    writeString(string, options = this.strDefaults, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readonly mode!");
        }
        this.open();
        var length = options.length;
        var stringType = options.stringType ?? 'utf-8';
        var terminateValue = options.terminateValue;
        var lengthWriteSize = options.lengthWriteSize ?? 1;
        var endian = options.endian ?? this.endian;
        var maxLengthValue = length ?? string.length;
        var strUnits = string.length;
        var maxBytes;
        switch (stringType) {
            case 'pascal':
                maxLengthValue = 255;
                if (length != undefined) {
                    maxLengthValue = length;
                }
                break;
            case 'wide-pascal':
                strUnits *= 2;
                maxLengthValue = 65535;
                if (length != undefined) {
                    maxLengthValue = length / 2;
                }
                break;
            case 'double-wide-pascal':
                strUnits *= 4;
                maxLengthValue = 4294967295;
                if (length != undefined) {
                    maxLengthValue = length / 4;
                }
                break;
        }
        if (terminateValue == undefined) {
            if (stringType == "ascii" || stringType == 'utf-8' ||
                stringType == 'utf-16' ||
                stringType == 'utf-32') {
                terminateValue = 0;
            }
        }
        var maxBytes = Math.min(strUnits, maxLengthValue);
        string = string.substring(0, maxBytes);
        var encodedString;
        var totalLength = string.length;
        switch (stringType) {
            case 'ascii':
            case 'utf-8':
            case 'pascal':
                {
                    encodedString = new TextEncoder().encode(string);
                    totalLength = encodedString.byteLength + 1;
                }
                break;
            case 'utf-16':
            case 'wide-pascal':
                {
                    const utf16Buffer = new Uint16Array(string.length);
                    for (let i = 0; i < string.length; i++) {
                        utf16Buffer[i] = string.charCodeAt(i);
                    }
                    encodedString = new Uint8Array(utf16Buffer.buffer);
                    totalLength = encodedString.byteLength + 2;
                }
                break;
            case 'utf-32':
            case 'double-wide-pascal':
                {
                    const utf32Buffer = new Uint32Array(string.length);
                    for (let i = 0; i < string.length; i++) {
                        utf32Buffer[i] = string.codePointAt(i);
                    }
                    encodedString = new Uint8Array(utf32Buffer.buffer);
                    totalLength = encodedString.byteLength + 4;
                }
                break;
        }
        this.#checkSize(totalLength, 0, this.#offset);
        const savedOffset = this.#offset;
        const savedBitOffset = this.#insetBit;
        _wstring(encodedString, stringType, endian, terminateValue, lengthWriteSize, this.writeUByte.bind(this), this.writeUInt16.bind(this), this.writeUInt32.bind(this));
        if (!consume) {
            this.#offset = savedOffset;
            this.#insetBit = savedBitOffset;
        }
        return;
    }
    ;
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
class BiReader extends BiBase {
    constructor(input, options = {}) {
        options.byteOffset = options.byteOffset ?? 0;
        options.bitOffset = options.bitOffset ?? 0;
        options.endianness = options.endianness ?? "little";
        options.strict = options.strict ?? true;
        options.growthIncrement = options.growthIncrement ?? 1048576;
        options.enforceBigInt = options.enforceBigInt ?? false;
        options.readOnly = options.readOnly ?? true;
        if (input == undefined) {
            throw new Error("Can not start BiReader without data.");
        }
        super(input, options);
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
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1() {
        return this.bit(1);
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1le() {
        return this.bit(1, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit1be() {
        return this.bit(1, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1() {
        return this.bit(1, true);
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1le() {
        return this.bit(1, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit1be() {
        return this.bit(1, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2() {
        return this.bit(2);
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2le() {
        return this.bit(2, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit2be() {
        return this.bit(2, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2() {
        return this.bit(2, true);
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2le() {
        return this.bit(2, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit2be() {
        return this.bit(2, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3() {
        return this.bit(3);
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3le() {
        return this.bit(3, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit3be() {
        return this.bit(3, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3() {
        return this.bit(3, true);
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3le() {
        return this.bit(3, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit3be() {
        return this.bit(3, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4() {
        return this.bit(4);
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4le() {
        return this.bit(4, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit4be() {
        return this.bit(4, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4() {
        return this.bit(4, true);
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4le() {
        return this.bit(4, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit4be() {
        return this.bit(4, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5() {
        return this.bit(5);
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5le() {
        return this.bit(5, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit5be() {
        return this.bit(5, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5() {
        return this.bit(5, true);
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5le() {
        return this.bit(5, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit5be() {
        return this.bit(5, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6() {
        return this.bit(6);
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6le() {
        return this.bit(6, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit6be() {
        return this.bit(6, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6() {
        return this.bit(6, true);
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6le() {
        return this.bit(6, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit6be() {
        return this.bit(6, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7() {
        return this.bit(7);
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7le() {
        return this.bit(7, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit7be() {
        return this.bit(7, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7() {
        return this.bit(7, true);
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7le() {
        return this.bit(7, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit7be() {
        return this.bit(7, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8() {
        return this.bit(8);
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8le() {
        return this.bit(8, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit8be() {
        return this.bit(8, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8() {
        return this.bit(8, true);
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8le() {
        return this.bit(8, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit8be() {
        return this.bit(8, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9() {
        return this.bit(9);
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9le() {
        return this.bit(9, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit9be() {
        return this.bit(9, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9() {
        return this.bit(9, true);
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9le() {
        return this.bit(9, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit9be() {
        return this.bit(9, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10() {
        return this.bit(10);
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10le() {
        return this.bit(10, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit10be() {
        return this.bit(10, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10() {
        return this.bit(10, true);
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10le() {
        return this.bit(10, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit10be() {
        return this.bit(10, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11() {
        return this.bit(11);
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11le() {
        return this.bit(11, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit11be() {
        return this.bit(11, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11() {
        return this.bit(11, true);
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11le() {
        return this.bit(11, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit11be() {
        return this.bit(11, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12() {
        return this.bit(12);
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12le() {
        return this.bit(12, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit12be() {
        return this.bit(12, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12() {
        return this.bit(12, true);
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12le() {
        return this.bit(12, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit12be() {
        return this.bit(12, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13() {
        return this.bit(13);
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13le() {
        return this.bit(13, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit13be() {
        return this.bit(13, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13() {
        return this.bit(13, true);
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13le() {
        return this.bit(13, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit13be() {
        return this.bit(13, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14() {
        return this.bit(14);
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14le() {
        return this.bit(14, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit14be() {
        return this.bit(14, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14() {
        return this.bit(14, true);
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14le() {
        return this.bit(14, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit14be() {
        return this.bit(14, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15() {
        return this.bit(15);
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15le() {
        return this.bit(15, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit15be() {
        return this.bit(15, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15() {
        return this.bit(15, true);
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15le() {
        return this.bit(15, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit15be() {
        return this.bit(15, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16() {
        return this.bit(16);
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16le() {
        return this.bit(16, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit16be() {
        return this.bit(16, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16() {
        return this.bit(16, true);
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16le() {
        return this.bit(16, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit16be() {
        return this.bit(16, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17() {
        return this.bit(17);
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17le() {
        return this.bit(17, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit17be() {
        return this.bit(17, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17() {
        return this.bit(17, true);
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17le() {
        return this.bit(17, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit17be() {
        return this.bit(17, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18() {
        return this.bit(18);
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18le() {
        return this.bit(18, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit18be() {
        return this.bit(18, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18() {
        return this.bit(18, true);
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18le() {
        return this.bit(18, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit18be() {
        return this.bit(18, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19() {
        return this.bit(19);
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19le() {
        return this.bit(19, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit19be() {
        return this.bit(19, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19() {
        return this.bit(19, true);
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19le() {
        return this.bit(19, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit19be() {
        return this.bit(19, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20() {
        return this.bit(20);
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20le() {
        return this.bit(20, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit20be() {
        return this.bit(20, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20() {
        return this.bit(20, true);
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20le() {
        return this.bit(20, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit20be() {
        return this.bit(20, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21() {
        return this.bit(21);
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21le() {
        return this.bit(21, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit21be() {
        return this.bit(21, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21() {
        return this.bit(21, true);
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21le() {
        return this.bit(21, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit21be() {
        return this.bit(21, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22() {
        return this.bit(22);
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22le() {
        return this.bit(22, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit22be() {
        return this.bit(22, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22() {
        return this.bit(22, true);
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22le() {
        return this.bit(22, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit22be() {
        return this.bit(22, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23() {
        return this.bit(23);
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23le() {
        return this.bit(23, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit23be() {
        return this.bit(23, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23() {
        return this.bit(23, true);
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23le() {
        return this.bit(23, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit23be() {
        return this.bit(23, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24() {
        return this.bit(24);
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24le() {
        return this.bit(24, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit24be() {
        return this.bit(24, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24() {
        return this.bit(24, true);
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24le() {
        return this.bit(24, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit24be() {
        return this.bit(24, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25() {
        return this.bit(25);
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25le() {
        return this.bit(25, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit25be() {
        return this.bit(25, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25() {
        return this.bit(25, true);
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25le() {
        return this.bit(25, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit25be() {
        return this.bit(25, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26() {
        return this.bit(26);
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26le() {
        return this.bit(26, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit26be() {
        return this.bit(26, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26() {
        return this.bit(26, true);
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26le() {
        return this.bit(26, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit26be() {
        return this.bit(26, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27() {
        return this.bit(27);
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27le() {
        return this.bit(27, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit27be() {
        return this.bit(27, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27() {
        return this.bit(27, true);
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27le() {
        return this.bit(27, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit27be() {
        return this.bit(27, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28() {
        return this.bit(28);
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28le() {
        return this.bit(28, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit28be() {
        return this.bit(28, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28() {
        return this.bit(28, true);
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28le() {
        return this.bit(28, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit28be() {
        return this.bit(28, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29() {
        return this.bit(29);
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29le() {
        return this.bit(29, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit29be() {
        return this.bit(29, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29() {
        return this.bit(29, true);
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29le() {
        return this.bit(29, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit29be() {
        return this.bit(29, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30() {
        return this.bit(30);
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30le() {
        return this.bit(30, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit30be() {
        return this.bit(30, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30() {
        return this.bit(30, true);
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30le() {
        return this.bit(30, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit30be() {
        return this.bit(30, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31() {
        return this.bit(31);
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31le() {
        return this.bit(31, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit31be() {
        return this.bit(31, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31() {
        return this.bit(31, true);
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31le() {
        return this.bit(31, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit31be() {
        return this.bit(31, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32() {
        return this.bit(32);
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32le() {
        return this.bit(32, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get bit32be() {
        return this.bit(32, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32() {
        return this.bit(32, true);
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32le() {
        return this.bit(32, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {number}
     */
    get ubit32be() {
        return this.bit(32, true, "big");
    }
    ;
    //
    // #region byte read
    //
    /**
     * Read byte.
     *
     * @returns {number}
     */
    get byte() {
        return this.readByte();
    }
    ;
    /**
     * Read byte.
     *
     * @returns {number}
     */
    get int8() {
        return this.readByte();
    }
    ;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    get uint8() {
        return this.readByte(true);
    }
    ;
    /**
     * Read unsigned byte.
     *
     * @returns {number}
     */
    get ubyte() {
        return this.readByte(true);
    }
    ;
    //
    // #region short16 read
    //
    /**
     * Read short.
     *
     * @returns {number}
     */
    get int16() {
        return this.readInt16();
    }
    ;
    /**
     * Read short.
     *
     * @returns {number}
     */
    get short() {
        return this.readInt16();
    }
    ;
    /**
     * Read short.
     *
     * @returns {number}
     */
    get word() {
        return this.readInt16();
    }
    ;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get uint16() {
        return this.readInt16(true);
    }
    ;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get ushort() {
        return this.readInt16(true);
    }
    ;
    /**
     * Read unsigned short.
     *
     * @returns {number}
     */
    get uword() {
        return this.readInt16(true);
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get uint16le() {
        return this.readInt16(true, "little");
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get ushortle() {
        return this.readInt16(true, "little");
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    get uwordle() {
        return this.readInt16(true, "little");
    }
    ;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get int16le() {
        return this.readInt16(false, "little");
    }
    ;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get shortle() {
        return this.readInt16(false, "little");
    }
    ;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    get wordle() {
        return this.readInt16(false, "little");
    }
    ;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get uint16be() {
        return this.readInt16(true, "big");
    }
    ;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get ushortbe() {
        return this.readInt16(true, "big");
    }
    ;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    get uwordbe() {
        return this.readInt16(true, "big");
    }
    ;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get int16be() {
        return this.readInt16(false, "big");
    }
    ;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get shortbe() {
        return this.readInt16(false, "big");
    }
    ;
    /**
     * Read signed short in big endian.
     *
     * @returns {number}
     */
    get wordbe() {
        return this.readInt16(false, "big");
    }
    ;
    //
    // #region half float read
    //
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloat() {
        return this.readHalfFloat();
    }
    ;
    /**
     * Read half float
     *
     * @returns {number}
     */
    get half() {
        return this.readHalfFloat();
    }
    ;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloatbe() {
        return this.readHalfFloat("big");
    }
    ;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halfbe() {
        return this.readHalfFloat("big");
    }
    ;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halffloatle() {
        return this.readHalfFloat("little");
    }
    ;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    get halfle() {
        return this.readHalfFloat("little");
    }
    ;
    //
    // #region int read
    //
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get int() {
        return this.readInt32();
    }
    ;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get double() {
        return this.readInt32();
    }
    ;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get int32() {
        return this.readInt32();
    }
    ;
    /**
     * Read 32 bit integer.
     *
     * @returns {number}
     */
    get long() {
        return this.readInt32();
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint() {
        return this.readInt32(true);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get udouble() {
        return this.readInt32(true);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint32() {
        return this.readInt32(true);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get ulong() {
        return this.readInt32(true);
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get intbe() {
        return this.readInt32(false, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get doublebe() {
        return this.readInt32(false, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get int32be() {
        return this.readInt32(false, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get longbe() {
        return this.readInt32(false, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uintbe() {
        return this.readInt32(true, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get udoublebe() {
        return this.readInt32(true, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get uint32be() {
        return this.readInt32(true, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    get ulongbe() {
        return this.readInt32(true, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get intle() {
        return this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get doublele() {
        return this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get int32le() {
        return this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get longle() {
        return this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get uintle() {
        return this.readInt32(true, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get udoublele() {
        return this.readInt32(true, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get uint32le() {
        return this.readInt32(true, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    get ulongle() {
        return this.readInt32(true, "little");
    }
    ;
    //
    // #region float read
    //
    /**
     * Read float.
     *
     * @returns {number}
     */
    get float() {
        return this.readFloat();
    }
    ;
    /**
     * Read float.
     *
     * @returns {number}
     */
    get floatbe() {
        return this.readFloat("big");
    }
    ;
    /**
     * Read float.
     *
     * @returns {number}
     */
    get floatle() {
        return this.readFloat("little");
    }
    ;
    //
    // #region int64 reader
    //
    /**
     * Read signed 64 bit integer
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get int64() {
        return this.readInt64();
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get bigint() {
        return this.readInt64();
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get quad() {
        return this.readInt64();
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uint64() {
        return this.readInt64(true);
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get ubigint() {
        return this.readInt64(true);
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uquad() {
        return this.readInt64(true);
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get int64be() {
        return this.readInt64(false, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get bigintbe() {
        return this.readInt64(false, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get quadbe() {
        return this.readInt64(false, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uint64be() {
        return this.readInt64(true, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get ubigintbe() {
        return this.readInt64(true, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uquadbe() {
        return this.readInt64(true, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get int64le() {
        return this.readInt64(false, "little");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get bigintle() {
        return this.readInt64(false, "little");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get quadle() {
        return this.readInt64(false, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uint64le() {
        return this.readInt64(true, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get ubigintle() {
        return this.readInt64(true, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    get uquadle() {
        return this.readInt64(true, "little");
    }
    ;
    //
    // #region doublefloat reader
    //
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloat() {
        return this.readDoubleFloat();
    }
    ;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloat() {
        return this.readDoubleFloat();
    }
    ;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloatbe() {
        return this.readDoubleFloat("big");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloatbe() {
        return this.readDoubleFloat("big");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get dfloatle() {
        return this.readDoubleFloat("little");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    get doublefloatle() {
        return this.readDoubleFloat("little");
    }
    ;
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
    latin1tring(length, terminateValue, stripNull) {
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
class BiWriter extends BiBase {
    constructor(input, options = {}) {
        options.byteOffset = options.byteOffset ?? 0;
        options.bitOffset = options.bitOffset ?? 0;
        options.endianness = options.endianness ?? "little";
        options.strict = options.strict ?? false;
        options.growthIncrement = options.growthIncrement ?? 1048576;
        options.enforceBigInt = options.enforceBigInt ?? false;
        options.readOnly = options.readOnly ?? false;
        const { growthIncrement, } = options;
        if (input == undefined) {
            input = new Uint8Array(growthIncrement);
            console.warn(`BiWriter started without data. Creating Uint8Array with growthIncrement.`);
        }
        super(input, options);
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
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1(value) {
        this.bit(value, 1);
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1le(value) {
        this.bit(value, 1, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit1be(value) {
        this.bit(value, 1, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1(value) {
        this.bit(value, 1, true);
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1le(value) {
        this.bit(value, 1, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit1be(value) {
        this.bit(value, 1, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2(value) {
        this.bit(value, 2);
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2le(value) {
        this.bit(value, 2, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit2be(value) {
        this.bit(value, 2, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2(value) {
        this.bit(value, 2, true);
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2le(value) {
        this.bit(value, 2, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit2be(value) {
        this.bit(value, 2, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3(value) {
        this.bit(value, 3);
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3le(value) {
        this.bit(value, 3, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit3be(value) {
        this.bit(value, 3, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3(value) {
        this.bit(value, 3, true);
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3le(value) {
        this.bit(value, 3, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit3be(value) {
        this.bit(value, 3, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4(value) {
        this.bit(value, 4);
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4le(value) {
        this.bit(value, 4, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit4be(value) {
        this.bit(value, 4, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4(value) {
        this.bit(value, 4, true);
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4le(value) {
        this.bit(value, 4, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit4be(value) {
        this.bit(value, 4, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5(value) {
        this.bit(value, 5);
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5le(value) {
        this.bit(value, 5, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit5be(value) {
        this.bit(value, 5, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5(value) {
        this.bit(value, 5, true);
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5le(value) {
        this.bit(value, 5, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit5be(value) {
        this.bit(value, 5, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6(value) {
        this.bit(value, 6);
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6le(value) {
        this.bit(value, 6, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit6be(value) {
        this.bit(value, 6, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6(value) {
        this.bit(value, 6, true);
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6le(value) {
        this.bit(value, 6, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit6be(value) {
        this.bit(value, 6, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7(value) {
        this.bit(value, 7);
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7le(value) {
        this.bit(value, 7, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit7be(value) {
        this.bit(value, 7, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7(value) {
        this.bit(value, 7, true);
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7le(value) {
        this.bit(value, 7, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit7be(value) {
        this.bit(value, 7, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8(value) {
        this.bit(value, 8);
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8le(value) {
        this.bit(value, 8, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit8be(value) {
        this.bit(value, 8, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8(value) {
        this.bit(value, 8, true);
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8le(value) {
        this.bit(value, 8, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit8be(value) {
        this.bit(value, 8, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9(value) {
        this.bit(value, 9);
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9le(value) {
        this.bit(value, 9, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit9be(value) {
        this.bit(value, 9, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9(value) {
        this.bit(value, 9, true);
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9le(value) {
        this.bit(value, 9, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit9be(value) {
        this.bit(value, 9, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10(value) {
        this.bit(value, 10);
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10le(value) {
        this.bit(value, 10, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit10be(value) {
        this.bit(value, 10, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10(value) {
        this.bit(value, 10, true);
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10le(value) {
        this.bit(value, 10, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit10be(value) {
        this.bit(value, 10, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11(value) {
        this.bit(value, 11);
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11le(value) {
        this.bit(value, 11, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit11be(value) {
        this.bit(value, 11, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11(value) {
        this.bit(value, 11, true);
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11le(value) {
        this.bit(value, 11, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit11be(value) {
        this.bit(value, 11, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12(value) {
        this.bit(value, 12);
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12le(value) {
        this.bit(value, 12, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit12be(value) {
        this.bit(value, 12, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12(value) {
        this.bit(value, 12, true);
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12le(value) {
        this.bit(value, 12, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit12be(value) {
        this.bit(value, 12, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13(value) {
        this.bit(value, 13);
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13le(value) {
        this.bit(value, 13, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit13be(value) {
        this.bit(value, 13, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13(value) {
        this.bit(value, 13, true);
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13le(value) {
        this.bit(value, 13, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit13be(value) {
        this.bit(value, 13, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14(value) {
        this.bit(value, 14);
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14le(value) {
        this.bit(value, 14, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit14be(value) {
        this.bit(value, 14, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14(value) {
        this.bit(value, 14, true);
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14le(value) {
        this.bit(value, 14, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit14be(value) {
        this.bit(value, 14, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15(value) {
        this.bit(value, 15);
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15le(value) {
        this.bit(value, 15, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit15be(value) {
        this.bit(value, 15, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15(value) {
        this.bit(value, 15, true);
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15le(value) {
        this.bit(value, 15, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit15be(value) {
        this.bit(value, 15, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16(value) {
        this.bit(value, 16);
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16le(value) {
        this.bit(value, 16, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit16be(value) {
        this.bit(value, 16, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16(value) {
        this.bit(value, 16, true);
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16le(value) {
        this.bit(value, 16, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit16be(value) {
        this.bit(value, 16, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17(value) {
        this.bit(value, 17);
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17le(value) {
        this.bit(value, 17, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit17be(value) {
        this.bit(value, 17, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17(value) {
        this.bit(value, 17, true);
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17le(value) {
        this.bit(value, 17, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit17be(value) {
        this.bit(value, 17, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18(value) {
        this.bit(value, 18);
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18le(value) {
        this.bit(value, 18, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit18be(value) {
        this.bit(value, 18, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18(value) {
        this.bit(value, 18, true);
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18le(value) {
        this.bit(value, 18, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit18be(value) {
        this.bit(value, 18, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19(value) {
        this.bit(value, 19);
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19le(value) {
        this.bit(value, 19, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit19be(value) {
        this.bit(value, 19, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19(value) {
        this.bit(value, 19, true);
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19le(value) {
        this.bit(value, 19, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit19be(value) {
        this.bit(value, 19, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20(value) {
        this.bit(value, 20);
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20le(value) {
        this.bit(value, 20, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit20be(value) {
        this.bit(value, 20, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20(value) {
        this.bit(value, 20, true);
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20le(value) {
        this.bit(value, 20, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit20be(value) {
        this.bit(value, 20, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21(value) {
        this.bit(value, 21);
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21le(value) {
        this.bit(value, 21, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit21be(value) {
        this.bit(value, 21, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21(value) {
        this.bit(value, 21, true);
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21le(value) {
        this.bit(value, 21, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit21be(value) {
        this.bit(value, 21, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22(value) {
        this.bit(value, 22);
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22le(value) {
        this.bit(value, 22, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit22be(value) {
        this.bit(value, 22, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22(value) {
        this.bit(value, 22, true);
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22le(value) {
        this.bit(value, 22, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit22be(value) {
        this.bit(value, 22, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23(value) {
        this.bit(value, 23);
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23le(value) {
        this.bit(value, 23, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit23be(value) {
        this.bit(value, 23, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23(value) {
        this.bit(value, 23, true);
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23le(value) {
        this.bit(value, 23, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit23be(value) {
        this.bit(value, 23, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24(value) {
        this.bit(value, 24);
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24le(value) {
        this.bit(value, 24, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit24be(value) {
        this.bit(value, 24, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24(value) {
        this.bit(value, 24, true);
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24le(value) {
        this.bit(value, 24, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit24be(value) {
        this.bit(value, 24, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25(value) {
        this.bit(value, 25);
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25le(value) {
        this.bit(value, 25, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit25be(value) {
        this.bit(value, 25, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25(value) {
        this.bit(value, 25, true);
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25le(value) {
        this.bit(value, 25, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit25be(value) {
        this.bit(value, 25, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26(value) {
        this.bit(value, 26);
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26le(value) {
        this.bit(value, 26, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit26be(value) {
        this.bit(value, 26, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26(value) {
        this.bit(value, 26, true);
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26le(value) {
        this.bit(value, 26, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit26be(value) {
        this.bit(value, 26, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27(value) {
        this.bit(value, 27);
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27le(value) {
        this.bit(value, 27, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit27be(value) {
        this.bit(value, 27, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27(value) {
        this.bit(value, 27, true);
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27le(value) {
        this.bit(value, 27, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit27be(value) {
        this.bit(value, 27, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28(value) {
        this.bit(value, 28);
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28le(value) {
        this.bit(value, 28, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit28be(value) {
        this.bit(value, 28, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28(value) {
        this.bit(value, 28, true);
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28le(value) {
        this.bit(value, 28, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit28be(value) {
        this.bit(value, 28, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29(value) {
        this.bit(value, 29);
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29le(value) {
        this.bit(value, 29, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit29be(value) {
        this.bit(value, 29, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29(value) {
        this.bit(value, 29, true);
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29le(value) {
        this.bit(value, 29, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit29be(value) {
        this.bit(value, 29, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30(value) {
        this.bit(value, 30);
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30le(value) {
        this.bit(value, 30, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit30be(value) {
        this.bit(value, 30, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30(value) {
        this.bit(value, 30, true);
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30le(value) {
        this.bit(value, 30, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit30be(value) {
        this.bit(value, 30, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31(value) {
        this.bit(value, 31);
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31le(value) {
        this.bit(value, 31, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit31be(value) {
        this.bit(value, 31, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31(value) {
        this.bit(value, 31, true);
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31le(value) {
        this.bit(value, 31, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit31be(value) {
        this.bit(value, 31, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32(value) {
        this.bit(value, 32);
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32le(value) {
        this.bit(value, 32, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set bit32be(value) {
        this.bit(value, 32, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32(value) {
        this.bit(value, 32, true);
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32le(value) {
        this.bit(value, 32, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    set ubit32be(value) {
        this.bit(value, 32, true, "big");
    }
    ;
    //
    // #region byte write
    //
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    set byte(value) {
        this.writeByte(value);
    }
    ;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    set int8(value) {
        this.writeByte(value);
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    set uint8(value) {
        this.writeByte(value, true);
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    set ubyte(value) {
        this.writeByte(value, true);
    }
    ;
    //
    // #region short writes
    //
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set int16(value) {
        this.writeInt16(value);
    }
    ;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set short(value) {
        this.writeInt16(value);
    }
    ;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    set word(value) {
        this.writeInt16(value);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16(value) {
        this.writeInt16(value, true);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushort(value) {
        this.writeInt16(value, true);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uword(value) {
        this.writeInt16(value, true);
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set int16be(value) {
        this.writeInt16(value, false, "big");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set shortbe(value) {
        this.writeInt16(value, false, "big");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set wordbe(value) {
        this.writeInt16(value, false, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16be(value) {
        this.writeInt16(value, true, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushortbe(value) {
        this.writeInt16(value, true, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uwordbe(value) {
        this.writeInt16(value, true, "big");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set int16le(value) {
        this.writeInt16(value, false, "little");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set shortle(value) {
        this.writeInt16(value, false, "little");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    set wordle(value) {
        this.writeInt16(value, false, "little");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uint16le(value) {
        this.writeInt16(value, true, "little");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set ushortle(value) {
        this.writeInt16(value, true, "little");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    set uwordle(value) {
        this.writeInt16(value, true, "little");
    }
    ;
    //
    // #region half float
    //
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set half(value) {
        this.writeHalfFloat(value);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloat(value) {
        this.writeHalfFloat(value);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloatbe(value) {
        this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halfbe(value) {
        this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halffloatle(value) {
        this.writeHalfFloat(value, "little");
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    set halfle(value) {
        this.writeHalfFloat(value, "little");
    }
    ;
    //
    // #region int32 write
    //
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set int(value) {
        this.writeInt32(value);
    }
    ;
    /**
    * Write int32.
    *
    * @param {number} value - value as int
    */
    set int32(value) {
        this.writeInt32(value);
    }
    ;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set double(value) {
        this.writeInt32(value);
    }
    ;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    set long(value) {
        this.writeInt32(value);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32(value) {
        this.writeInt32(value, true);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint(value) {
        this.writeInt32(value, true);
    }
    ;
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    set udouble(value) {
        this.writeInt32(value, true);
    }
    ;
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    set ulong(value) {
        this.writeInt32(value, true);
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set int32le(value) {
        this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set intle(value) {
        this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set doublele(value) {
        this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set longle(value) {
        this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32le(value) {
        this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uintle(value) {
        this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set udoublele(value) {
        this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongle(value) {
        this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set intbe(value) {
        this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set int32be(value) {
        this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set doublebe(value) {
        this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    set longbe(value) {
        this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uint32be(value) {
        this.writeInt32(value, true, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set uintbe(value) {
        this.writeInt32(value, true, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set udoublebe(value) {
        this.writeInt32(value, true, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    set ulongbe(value) {
        this.writeInt32(value, true, "big");
    }
    ;
    //
    // #region float write
    //
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    set float(value) {
        this.writeFloat(value);
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    set floatle(value) {
        this.writeFloat(value, "little");
    }
    ;
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    set floatbe(value) {
        this.writeFloat(value, "big");
    }
    ;
    //
    // #region int64 write
    //
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64(value) {
        this.writeInt64(value);
    }
    ;
    /**
    * Write 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    set quad(value) {
        this.writeInt64(value);
    }
    ;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigint(value) {
        this.writeInt64(value);
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64(value) {
        this.writeInt64(value, true);
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigint(value) {
        this.writeInt64(value, true);
    }
    ;
    /**
    * Write unsigned 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    set uquad(value) {
        this.writeInt64(value, true);
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64le(value) {
        this.writeInt64(value, false, "little");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigintle(value) {
        this.writeInt64(value, false, "little");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set quadle(value) {
        this.writeInt64(value, false, "little");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64le(value) {
        this.writeInt64(value, true, "little");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigintle(value) {
        this.writeInt64(value, true, "little");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uquadle(value) {
        this.writeInt64(value, true, "little");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set int64be(value) {
        this.writeInt64(value, false, "big");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set bigintbe(value) {
        this.writeInt64(value, false, "big");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set quadbe(value) {
        this.writeInt64(value, false, "big");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uint64be(value) {
        this.writeInt64(value, true, "big");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set ubigintbe(value) {
        this.writeInt64(value, true, "big");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    set uquadbe(value) {
        this.writeInt64(value, true, "big");
    }
    ;
    //
    // #region doublefloat
    //
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloat(value) {
        this.writeDoubleFloat(value);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloat(value) {
        this.writeDoubleFloat(value);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloatbe(value) {
        this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloatbe(value) {
        this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set dfloatle(value) {
        this.writeDoubleFloat(value, "little");
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    set doublefloatle(value) {
        this.writeDoubleFloat(value, "little");
    }
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

/**
 * @file BiReaderAsync / Writer base for working in sync Buffers or full file reads. Node and Browser.
 */
// #region Imports
var fs;
(async function () {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // We are in Node.js
        try {
            if (typeof require !== 'undefined') {
                if (typeof fs === "undefined") {
                    const _fs = require('fs');
                    fs = _fs.promises;
                }
            }
            else {
                if (typeof fs === "undefined") {
                    const _fs = await import('fs');
                    fs = _fs.promises;
                }
            }
        }
        catch (error) {
            console.error('Failed to load fs module:', error);
        }
    }
})();
async function _fileExists(filePath) {
    try {
        await fs.access(filePath, fs.constants.F_OK);
        return true; // File exists
    }
    catch (error) {
        return false;
    }
}
// #region Buffer Dummies
const buff2ByteDummy = new Uint8Array(2);
const view2ByteDummy = new DataView(buff2ByteDummy.buffer, buff2ByteDummy.byteOffset, buff2ByteDummy.byteLength);
const buff4ByteDummy = new Uint8Array(4);
const view4ByteDummy = new DataView(buff4ByteDummy.buffer, buff4ByteDummy.byteOffset, buff4ByteDummy.byteLength);
const buff8ByteDummy = new Uint8Array(8);
const view8ByteDummy = new DataView(buff8ByteDummy.buffer, buff8ByteDummy.byteOffset, buff8ByteDummy.byteLength);
/**
 * Base class for BiReader and BiWriter
 */
class BiBaseAsync {
    /**
     * Endianness of default read.
     * @type {endian}
     */
    endian = "little";
    /**
     * Current read byte location.
     */
    #offset = 0;
    /**
     * Current read byte's bit location. 0 - 7
     */
    #insetBit = 0;
    /**
     * Size in bytes of the current buffer.
     */
    size = 0;
    /**
     * Size in bits of the current buffer.
     */
    bitSize = 0;
    /**
     * Allows the buffer to extend reading or writing outside of current size
     */
    strict = false;
    /**
     * Console log a hexdump on error.
     */
    errorDump = false;
    /**
     * Master Buffer
     */
    #data = null;
    /**
     * DataView of master Buffer
     */
    #view = null;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     *
     * Otherwise it extends just the amount of the next written value.
     *
     * This can greatly speed up data writes when large files are being written.
     *
     * NOTE: Using ``BiWriterAsync.get`` or ``BiWriterAsync.return`` will now remove all data after the current write position. Use ``BiWriterAsync.data`` to get the full buffer instead.
     */
    growthIncrement = 1048576;
    /**
     * Open file handle
     */
    fd = null;
    /**
     * Current file path
     */
    filePath;
    /**
     * File write mode
     */
    fsMode = "r";
    /**
     * The settings that used when using the .str getter / setter
     */
    strDefaults = { stringType: "utf-8", terminateValue: 0x0 };
    /**
     * All int64 reads will return as bigint type
     */
    enforceBigInt = null;
    /**
     * Not using a file reader.
     */
    isMemoryMode = false;
    /**
     * If data can not be written to the buffer.
     */
    readOnly;
    /**
     * Get the current buffer data.
     *
     * Use async {@link getData} while in file mode!
     */
    get data() {
        return this.#data;
    }
    ;
    /**
     * Get the current buffer data.
     *
     * For use in file mode!
     */
    async getData() {
        return await this.get();
    }
    ;
    /**
     * Set the current buffer data.
     */
    set data(data) {
        if (this.isBufferOrUint8Array(data)) {
            this.#data = data;
            this.#updateView();
            this.size = this.#data.length;
            this.bitSize = this.size * 8;
        }
    }
    ;
    /**
     * If the buffer was extended and needs to be trimmed
     */
    wasExpanded = false;
    /**
     * Get the DataView of current buffer data.
     */
    get view() {
        return this.#view;
    }
    ;
    // ASYNC ONLY
    /**
     * array of loaded data chunks
     */
    chunks = [];
    /**
     * Promises for data chunks
     */
    chunkPromises = [];
    /**
     * Edited data chunks
     */
    dirtyChunks = new Set();
    /**
     * The amount of data to "chunk" and read a time from the file
     *
     * When set to 0, reads whole file at once.
     */
    windowSize = 4096;
    /**
     * Data is finished loading
     */
    isFullyLoaded = false;
    /**
     * Array of all chunks to quickly load all parts
     */
    loadAllPromise = null;
    constructor(input, options = {}) {
        const { byteOffset, bitOffset, endianness, strict, growthIncrement, enforceBigInt, readOnly, windowSize, } = options;
        if (typeof strict != "boolean") {
            throw new TypeError("Strict mode must be true or false");
        }
        this.#offset = byteOffset;
        if ((bitOffset ?? 0) != 0) {
            this.#offset = Math.floor(byteOffset / 8);
            this.#insetBit = byteOffset % 8;
        }
        this.windowSize = windowSize;
        this.readOnly = !!readOnly;
        this.strict = this.readOnly ? true : strict;
        this.fsMode = this.readOnly ? 'r' : 'r+';
        this.enforceBigInt = !!enforceBigInt;
        if (!hasBigInt) {
            this.enforceBigInt = false;
        }
        this.growthIncrement = growthIncrement;
        if (typeof endianness != "string" || !(endianness == "big" || endianness == "little")) {
            throw new TypeError("Endian must be big or little");
        }
        this.endian = endianness;
        if (typeof input === 'string') {
            if (typeof Buffer === 'undefined' || typeof fs === "undefined") {
                throw new Error("Can't load file outside of Node.");
            }
            this.filePath = input;
            this.isMemoryMode = false;
        }
        else if (this.isBufferOrUint8Array(input)) {
            this.data = input;
            this.isMemoryMode = true;
            this.filePath = null;
            this.windowSize = 0;
            this.#initMemory();
        }
        else {
            throw new TypeError('Source must be a file path (string) or Uint8Array/Buffer');
        }
    }
    ;
    /**
     * Settings for when using .str
     *
     * @param {stringOptions} settings options to use with .str
     */
    set strSettings(settings) {
        this.strDefaults.encoding = settings.encoding;
        this.strDefaults.endian = settings.endian;
        this.strDefaults.length = settings.length;
        this.strDefaults.lengthReadSize = settings.lengthReadSize;
        this.strDefaults.lengthWriteSize = settings.lengthWriteSize;
        this.strDefaults.stringType = settings.stringType;
        this.strDefaults.stripNull = settings.stripNull;
        this.strDefaults.terminateValue = settings.terminateValue;
    }
    ;
    ///////////////////////////////
    // #region INTERNALS
    ///////////////////////////////
    /**
     * Checks if obj is an Uint8Array or a Buffer
     */
    isBufferOrUint8Array(obj) {
        return isBufferOrUint8Array(obj);
    }
    ;
    /**
     * Checks if obj is a Buffer
     */
    isBuffer(obj) {
        return isBuffer(obj);
    }
    ;
    /**
     * Checks if obj is an Uint8Array
     */
    isUint8Array(obj) {
        return isUint8Array(obj);
    }
    ;
    /**
     * Internal update size
     *
     * run after setting data
     */
    async #updateSize() {
        if (this.isMemoryMode) {
            this.size = this.data.length;
            this.bitSize = this.size * 8;
            return;
        }
        if (typeof fs === "undefined") {
            throw new Error("Can't load file outside Node.");
        }
        if (this.fd != null) {
            try {
                const stat = await this.fd.stat();
                this.size = stat.size;
                this.bitSize = this.size * 8;
            }
            catch (error) {
                throw new Error(error);
            }
        }
    }
    ;
    /**
     * Call this after everytime we set/replace `this.data`
     */
    #updateView() {
        if (this.#data) {
            this.#view = new DataView(this.#data.buffer, this.#data.byteOffset ?? 0, this.#data.byteLength);
        }
    }
    ;
    /**
     * `this.fd` must be null and not in memory mode
     */
    async #initFile() {
        if (this.isMemoryMode || this.fd != null) {
            return;
        }
        if (!(await _fileExists(this.filePath))) {
            await fs.writeFile(this.filePath, "");
        }
        try {
            this.fd = await fs.open(this.filePath, this.fsMode);
        }
        catch (error) {
            throw new Error(error);
        }
        await this.#updateSize();
        const numChunks = this.#getNumChunks();
        this.chunks = new Array(numChunks).fill(null);
        this.chunkPromises = new Array(numChunks).fill(null);
        if (this.windowSize == 0) {
            this.loadAllPromise = this.#preloadAllChunks();
        }
        else {
            this.loadAllPromise = Promise.resolve();
        }
    }
    ;
    /**
     * Not for file mode
     */
    #initMemory() {
        if (!this.isMemoryMode) {
            return;
        }
        if (this.isFullyLoaded) {
            return;
        }
        this.size = this.data.length;
        this.bitSize = this.size * 8;
        const numChunks = this.#getNumChunks();
        this.chunks = new Array(numChunks).fill(null);
        this.chunkPromises = new Array(numChunks).fill(null);
        this.isFullyLoaded = true;
        this.loadAllPromise = null;
    }
    ;
    /**
     * For when there is a full file read
     */
    #getChunkIndex(offset) {
        return this.windowSize === 0 ? 0 : Math.floor(offset / this.windowSize);
    }
    ;
    /**
     * For when there is a full file read
     */
    #getNumChunks() {
        return this.windowSize === 0 ? 1 : Math.ceil(this.size / this.windowSize);
    }
    ;
    /**
     * When the whole file is loaded at once
     */
    async #preloadAllChunks() {
        const promises = [];
        for (let i = 0; i < this.chunks.length; i++) {
            promises.push(this.#ensureChunkLoaded(i));
        }
        await Promise.all(promises);
        this.isFullyLoaded = true;
    }
    ;
    /**
     * Checks the chunk is loaded
     *
     * @param {number} chunkIndex
     */
    async #ensureChunkLoaded(chunkIndex) {
        if (this.windowSize === 0) {
            chunkIndex = 0;
        }
        if (chunkIndex >= this.chunks.length) {
            return null;
        }
        if (this.chunks[chunkIndex] !== null) {
            return this.chunks[chunkIndex];
        }
        if (this.isMemoryMode) {
            const start = chunkIndex * this.windowSize;
            const end = Math.min(start + this.windowSize, this.size);
            this.chunks[chunkIndex] = this.data.subarray(start, end);
            return this.chunks[chunkIndex];
        }
        if (this.chunkPromises[chunkIndex]) {
            return await this.chunkPromises[chunkIndex];
        }
        const promise = this.#performChunkLoad(chunkIndex);
        this.chunkPromises[chunkIndex] = promise;
        return await promise;
    }
    ;
    /**
     * Gets needed chunk
     *
     * @param {number} chunkIndex
     */
    async #performChunkLoad(chunkIndex) {
        const start = chunkIndex * this.windowSize;
        const length = Math.min(this.windowSize, this.size - start);
        const buffer = Buffer.alloc(length);
        await this.fd.read(buffer, 0, length, start);
        this.chunks[chunkIndex] = buffer;
        return buffer;
    }
    ;
    /**
     * Makes sure the needed size is loaded
     *
     * @param {number} offset
     * @param {number} length
     */
    async #ensureRangeLoaded(offset, length) {
        const needed = offset + length;
        if (needed > this.size) {
            if (this.strict || this.readOnly) {
                throw new Error(`Operation exceeds file size (${needed} > ${this.size})`);
            }
            await this.#confrimSize(needed);
        }
        const startChunk = this.#getChunkIndex(offset);
        const endChunk = this.#getChunkIndex(offset + length - 1);
        const promises = [];
        for (let i = startChunk; i <= endChunk && i < this.chunks.length; i++) {
            if (this.chunks[i] === null) {
                promises.push(this.#ensureChunkLoaded(i));
            }
        }
        await Promise.all(promises);
    }
    ;
    /**
     * Get bytes without changing offset
     *
     * @param {number} offset
     * @param {number} length
     */
    async #peekBytes(offset, length) {
        await this.open();
        if (length <= 0) {
            if (this.isMemoryMode) {
                if (this.isBuffer(this.data)) {
                    return Buffer.alloc(0);
                }
                else {
                    return new Uint8Array(0);
                }
            }
            else {
                return Buffer.alloc(0);
            }
        }
        await this.#ensureRangeLoaded(offset, length);
        var result;
        if (this.isMemoryMode) {
            return this.data.subarray(offset, offset + length);
        }
        else {
            result = Buffer.alloc(length);
        }
        let pos = offset;
        let writePos = 0;
        while (writePos < length) {
            const chunkIndex = this.#getChunkIndex(pos);
            const chunk = this.chunks[chunkIndex];
            const chunkOffset = pos % this.windowSize;
            const toCopy = Math.min(length - writePos, chunk.length - chunkOffset);
            result.set(chunk.subarray(chunkOffset, chunkOffset + toCopy), writePos);
            writePos += toCopy;
            pos += toCopy;
        }
        return result;
    }
    ;
    /**
     * write bytes internal
     *
     * @param {number} offset
     * @param {Uint8Array | Buffer | number[]} data
     */
    async #writeBytesAt(offset, data) {
        await this.open();
        if (data.length === 0) {
            return;
        }
        await this.#ensureRangeLoaded(offset, data.length);
        let pos = offset;
        let readPos = 0;
        if (this.isMemoryMode) {
            for (let i = 0, n = offset; i < data.length; i++, n++) {
                this.#data[n] = data[i];
            }
            return;
        }
        while (readPos < data.length) {
            const chunkIndex = this.#getChunkIndex(pos);
            const chunk = this.chunks[chunkIndex];
            const chunkOffset = pos % this.windowSize;
            const toCopy = Math.min(data.length - readPos, chunk.length - chunkOffset);
            var sub;
            if (this.isBufferOrUint8Array(data)) {
                sub = data.subarray(readPos, readPos + toCopy);
            }
            else {
                sub = data.slice(readPos, readPos + toCopy);
            }
            chunk.set(sub, chunkOffset);
            this.dirtyChunks.add(chunkIndex);
            readPos += toCopy;
            pos += toCopy;
        }
    }
    ;
    /**
     * Checks loaded size
     *
     * Will set `wasExpanded` if expanded
     *
     * @param {number} neededSize
     */
    async #confrimSize(neededSize) {
        // check if the current request fits in range
        if (neededSize <= this.size) {
            return;
        }
        var targetSize = neededSize;
        // now adjust the size if less to `growthIncrement` factor
        if (targetSize > this.size) {
            if (this.strict || this.readOnly) {
                this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
                throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: ` + neededSize + " at " + this.#offset + " of " + this.size);
            }
            if (this.growthIncrement != 0) {
                this.wasExpanded = true;
                targetSize = Math.ceil(neededSize / this.growthIncrement) * this.growthIncrement;
            }
            await this.#extendArray(targetSize);
        }
    }
    ;
    /**
    * extends the data
    *
    * @param {number} targetSize
    */
    async #extendArray(targetSize) {
        await this.flush();
        if (this.isMemoryMode) {
            const toPadd = targetSize - this.size;
            if (isBuffer(this.#data)) {
                const paddbuffer = Buffer.alloc(toPadd);
                this.data = Buffer.concat([this.#data, paddbuffer]);
            }
            else {
                const newBuf = new Uint8Array(this.size + toPadd);
                newBuf.set(this.#data);
                this.data = newBuf;
            }
            this.size = targetSize;
            this.bitSize = this.size * 8;
            this.chunks = new Array(this.#getNumChunks()).fill(null);
            this.chunkPromises = new Array(this.#getNumChunks()).fill(null);
            this.dirtyChunks.clear();
        }
        else {
            await this.fd.truncate(targetSize);
            this.size = targetSize;
            this.bitSize = this.size * 8;
            const oldNum = this.chunks.length;
            const newNum = this.#getNumChunks();
            this.chunks.length = newNum;
            this.chunkPromises.length = newNum;
            for (let i = oldNum; i < newNum; i++) {
                this.chunks[i] = null;
                this.chunkPromises[i] = null;
            }
        }
    }
    ;
    /**
     * For updating file size
     *
     * @param {number} exactSize
     * @returns
     */
    async #setFileSize(exactSize) {
        if (exactSize === this.size) {
            return;
        }
        await this.flush();
        if (this.isMemoryMode) {
            const newData = this.data.subarray(0, exactSize);
            this.data = newData;
            this.size = exactSize;
            this.bitSize = this.size * 8;
            const newNum = Math.ceil(exactSize / this.windowSize);
            this.chunks = new Array(newNum).fill(null);
            this.chunkPromises = new Array(newNum).fill(null);
            this.dirtyChunks.clear();
        }
        else {
            await this.fd.truncate(exactSize);
            this.size = exactSize;
            this.bitSize = this.size * 8;
            const oldNum = this.chunks.length;
            const newNum = Math.ceil(exactSize / this.windowSize);
            this.chunks.length = newNum;
            this.chunkPromises.length = newNum;
            if (newNum < oldNum) {
                this.dirtyChunks = new Set([...this.dirtyChunks].filter(i => i < newNum));
            }
            else {
                for (let i = oldNum; i < newNum; i++) {
                    this.chunks[i] = null;
                    this.chunkPromises[i] = null;
                }
            }
        }
    }
    ;
    /**
     * removes a chunk
     *
     * @param {number} startChunk
     */
    #invalidateFromChunk(startChunk) {
        for (let i = Math.max(0, startChunk); i < this.chunks.length; i++) {
            this.chunks[i] = null;
            this.chunkPromises[i] = null;
            this.dirtyChunks.delete(i);
        }
    }
    ;
    /**
     * Pulls data back
     *
     * @param {number} insertOffset
     * @param {number} insertLen
     * @param {number} oldEnd
     * @param {boolean} consume
     */
    async #shiftTailForward(insertOffset, insertLen, oldEnd, consume = false) {
        if (insertLen <= 0) {
            return;
        }
        if (this.isMemoryMode) {
            const tailCopy = this.data.subarray(insertOffset, oldEnd);
            this.data.set(tailCopy, insertOffset + insertLen);
        }
        else {
            let readEnd = oldEnd;
            let writeEnd = oldEnd + insertLen;
            const buf = Buffer.alloc(Math.min(this.windowSize, this.size));
            while (readEnd > insertOffset) {
                const len = Math.min(this.windowSize, readEnd - insertOffset);
                const readStart = readEnd - len;
                const { bytesRead } = await this.fd.read(buf, 0, len, readStart);
                const writeStart = writeEnd - len;
                await this.fd.write(buf, 0, bytesRead, writeStart);
                readEnd = readStart;
                writeEnd = writeStart;
            }
        }
        if (consume) {
            this.#offset = insertOffset + insertLen;
            this.#insetBit = 0;
        }
    }
    ;
    /**
     *
     * @param {number} removeOffset
     * @param {number} removeLen
     * @param {boolean} consume
     */
    async #shiftTailBackward(removeOffset, removeLen, consume = false) {
        if (removeLen <= 0) {
            return;
        }
        if (this.isMemoryMode) {
            const tailStart = removeOffset + removeLen;
            const tailCopy = this.data.subarray(tailStart, this.size);
            this.data.set(tailCopy, removeOffset);
        }
        else {
            const oldEnd = this.size;
            let readPos = removeOffset + removeLen;
            let writePos = removeOffset;
            const buf = Buffer.alloc(Math.min(this.windowSize, this.size));
            while (readPos < oldEnd) {
                const len = Math.min(this.windowSize, oldEnd - readPos);
                const { bytesRead } = await this.fd.read(buf, 0, len, readPos);
                await this.fd.write(buf, 0, bytesRead, writePos);
                readPos += bytesRead;
                writePos += bytesRead;
            }
        }
        if (consume) {
            this.#offset = removeOffset;
            this.#insetBit = 0;
        }
    }
    ;
    async #updateOffsets(newOffset, trueBytes, trueBits) {
        if (newOffset < 0) {
            throw new RangeError('Offset cannot be negative');
        }
        if (newOffset > this.size) {
            if (this.strict || this.readOnly) {
                this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
                throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: ` + newOffset + " at " + this.#offset + " of " + this.size);
            }
            await this.#confrimSize(newOffset);
        }
        this.#offset = trueBytes;
        // Adjust byte offset based on bit overflow
        this.#offset += Math.floor(trueBits / 8);
        // Adjust bit offset
        this.#insetBit = normalizeBitOffset(trueBits) % 8;
        // Ensure bit offset stays between 0-7
        this.#insetBit = Math.min(Math.max(this.#insetBit, 0), 7);
        // Ensure offset doesn't go negative
        this.#offset = Math.max(this.#offset, 0);
    }
    ;
    async #readBytes(length, consume = true) {
        await this.open();
        if (length <= 0) {
            return new Uint8Array(0);
        }
        const offSave = this.#offset;
        var trueByte = this.#offset;
        const trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#offset = trueByte;
        const data = await this.#peekBytes(trueByte, length);
        if (consume) {
            this.#offset += length;
            this.#insetBit = 0;
        }
        else {
            this.#offset = offSave;
        }
        return data;
    }
    ;
    async #writeBytes(data, consume = true) {
        if (this.readOnly) {
            throw new Error('Cannot write to read-only file');
        }
        await this.open();
        if (data.length === 0) {
            return;
        }
        const offSave = this.#offset;
        var trueByte = this.#offset;
        const trueBit = this.#insetBit;
        if (trueBit != 0) {
            trueByte += 1;
        }
        this.#offset = trueByte;
        await this.#writeBytesAt(trueByte, data);
        if (consume) {
            this.#offset += data.length;
            this.#insetBit = 0;
        }
        else {
            this.#offset = offSave;
        }
    }
    ;
    ///////////////////////////////
    // #region FILE MODE
    ///////////////////////////////
    /**
     * Enables writing and expanding (changes strict AND readOnly)
     *
     * @param {boolean} mode - True to enable writing and expanding (changes strict AND readOnly)
     */
    async writeMode(mode = true) {
        if (mode) {
            this.strict = false;
            this.readOnly = false;
            this.fsMode = "r+";
        }
        else {
            this.strict = true;
            this.readOnly = true;
            this.fsMode = "r";
        }
        if (!this.isMemoryMode) {
            await this.close();
            await this.open();
        }
    }
    ;
    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     *
     * Can be used to pass new data to a loaded class, shifting to memory mode.
     */
    async open(data) {
        if (!this.isMemoryMode) {
            await this.#initFile();
        }
        else {
            if (this.isBufferOrUint8Array(data)) {
                this.data = data;
            }
            this.#initMemory();
        }
    }
    ;
    /**
     * commit data and removes it.
     */
    async close() {
        await this.open();
        if (!this.readOnly && this.dirtyChunks.size > 0) {
            await this.flush();
        }
        if (this.loadAllPromise && !this.isFullyLoaded) {
            await this.loadAllPromise;
        }
        if (!this.isMemoryMode && this.fd) {
            const data = await this.getData();
            await this.fd.close();
            this.fd = null;
            return data;
        }
        if (this.isMemoryMode) {
            return this.data;
        }
    }
    ;
    /**
     * Write data buffer back to file
     */
    async commit() {
        if (this.readOnly || this.dirtyChunks.size === 0 || this.isMemoryMode || !this.fd) {
            return;
        }
        const promises = [...this.dirtyChunks].map(i => {
            const chunk = this.chunks[i];
            if (!chunk) {
                return null;
            }
            return this.fd.write(chunk, 0, chunk.length, Math.min(i * this.windowSize, this.size));
        }).filter(Boolean);
        await Promise.all(promises);
        this.dirtyChunks.clear();
    }
    ;
    /**
     * Write data buffer back to file
     */
    async flush() {
        if (this.fd) {
            await this.commit();
        }
    }
    ;
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
    async renameFile(newFilePath) {
        if (this.isMemoryMode) {
            return;
        }
        try {
            await this.close();
            this.fd = null;
            this.#data = null;
            this.#view = null;
            await fs.rename(this.filePath, newFilePath);
        }
        catch (error) {
            throw new Error(error);
        }
        this.filePath = newFilePath;
        await this.open();
    }
    ;
    /**
     * Deletes the working file.
     *
     * Note: This is permanent and can't be undone.
     *
     * It doesn't send the file to the recycling bin for recovery.
     */
    async deleteFile() {
        if (this.isMemoryMode) {
            return;
        }
        if (this.readOnly) {
            throw new Error("Can't delete file in readOnly mode!");
        }
        // this.mode == "file"
        try {
            this.close();
            await fs.unlink(this.filePath);
        }
        catch (error) {
            throw new Error(error);
        }
        this.filePath = null;
    }
    ;
    ///////////////////////////////
    // #region ENDIANNESS
    ///////////////////////////////
    /**
     *
     * Change endian, defaults to little.
     *
     * Can be changed at any time, doesn't loose position.
     *
     * @param {endian} endian - endianness ``big`` or ``little``
     */
    endianness(endian) {
        if (endian == undefined || typeof endian != "string") {
            throw new TypeError("Endian must be big or little");
        }
        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new TypeError("Endian must be big or little");
        }
        this.endian = endian;
    }
    ;
    /**
     * Sets endian to big.
     */
    bigEndian() {
        this.endianness("big");
    }
    ;
    /**
     * Sets endian to big.
     */
    big() {
        this.endianness("big");
    }
    ;
    /**
     * Sets endian to big.
     */
    be() {
        this.endianness("big");
    }
    ;
    /**
     * Sets endian to little.
     */
    littleEndian() {
        this.endianness("little");
    }
    ;
    /**
     * Sets endian to little.
     */
    little() {
        this.endianness("little");
    }
    ;
    /**
     * Sets endian to little.
     */
    le() {
        this.endianness("little");
    }
    ;
    ///////////////////////////////
    // #region SIZE
    ///////////////////////////////
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get length() {
        return this.size;
    }
    ;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get len() {
        return this.size;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get sizeBits() {
        return this.bitSize;
    }
    ;
    /**
     * Size in bytes of the current buffer.
     *
     *  @returns {number} size
     */
    get fileSize() {
        return this.size;
    }
    ;
    /**
     * Size in bytes of the current buffer.
     *
     * @returns {number} size
     */
    get FileSize() {
        return this.size;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lengthBits() {
        return this.bitSize;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get fileBitSize() {
        return this.bitSize;
    }
    ;
    /**
     * Size in bytes of the current buffer.
     *
     *  @returns {number} size
     */
    get fileSizeBits() {
        return this.bitSize;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lenBits() {
        return this.bitSize;
    }
    ;
    ///////////////////////////////
    // #region POSITION
    ///////////////////////////////
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get offset() {
        return this.#offset;
    }
    ;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get getOffset() {
        return this.offset;
    }
    ;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get tell() {
        return this.#offset;
    }
    ;
    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get FTell() {
        return this.#offset;
    }
    ;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get saveOffset() {
        return this.#offset;
    }
    ;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get off() {
        return this.#offset;
    }
    ;
    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get byteOffset() {
        return this.offset;
    }
    ;
    /**
     * Set the current byte position.
     *
     * same as {@link goto}
     */
    async setOffset(value) {
        await this.goto(value);
    }
    ;
    /**
     * Set the current byte position.
     *
     * same as {@link goto}
     */
    async setByteOffset(value) {
        await this.setOffset(value);
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get bitOffset() {
        return (this.#offset * 8) + this.#insetBit;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offsetBits() {
        return this.bitOffset;
    }
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get getBitOffset() {
        return this.bitOffset;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get saveBitOffset() {
        return this.bitOffset;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get FTellBits() {
        return this.bitOffset;
    }
    ;
    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get tellBits() {
        return this.#insetBit;
    }
    ;
    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offBits() {
        return this.bitOffset;
    }
    ;
    /**
     * Set the current bit position.
     */
    async setOffsetBits(value) {
        await this.goto(value - (value % 8), value % 8);
    }
    ;
    /**
     * Set the current bit position.
     */
    async setBitOffset(value) {
        await this.setOffsetBits(value);
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get insetBit() {
        return this.#insetBit;
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get saveInsetBit() {
        return this.insetBit;
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get inBit() {
        return this.insetBit;
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get bitTell() {
        return this.insetBit;
    }
    ;
    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get getInsetBit() {
        return this.insetBit;
    }
    ;
    /**
     * Set the current bit position with in the current byte (0-7).
     */
    async setInsetBit(value) {
        await this.goto(this.offset, value % 8);
    }
    ;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remain() {
        return this.size - this.#offset;
    }
    ;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remainBytes() {
        return this.remain;
    }
    ;
    /**
     * Size in bytes of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get FEoF() {
        return this.remainBytes;
    }
    ;
    /**
     * Size in bits of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get remainBits() {
        return (this.size * 8) - this.bitOffset;
    }
    ;
    /**
     * Size in bits of current read position to the end of the data.
     *
     * @returns {number} size
     */
    get FEoFBits() {
        return this.remainBits;
    }
    ;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get getLine() {
        return Math.abs(Math.floor((this.#offset - 1) / 16));
    }
    ;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get row() {
        return this.getLine;
    }
    ;
    ///////////////////////////////
    // #region FINISHING
    ///////////////////////////////
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set.
     */
    async get() {
        await this.open();
        // Commit every pending change
        if (!this.readOnly && this.dirtyChunks.size > 0) {
            await this.flush();
        }
        // Make sure everything is loaded (works with windowSize=0 too)
        if (this.loadAllPromise && !this.isFullyLoaded) {
            await this.loadAllPromise;
        }
        if (this.growthIncrement != 0 && this.wasExpanded) {
            await this.trim();
        }
        if (this.isMemoryMode) {
            return this.#data;
        }
        const chunks = [];
        for (let i = 0; i < this.#getNumChunks(); i++) {
            const chunk = await this.#ensureChunkLoaded(i);
            chunks.push(chunk);
        }
        if (this.growthIncrement != 0) {
            return Buffer.concat(chunks).subarray(0, this.#offset);
        }
        return Buffer.concat(chunks);
    }
    ;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     *
     * Use ``.data`` instead if you want the full buffer data.
     */
    async getFullBuffer() {
        return await this.get();
    }
    ;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``growthIncrement`` was set.
     */
    async return() {
        return await this.get();
    }
    ;
    /**
     * Removes data.
     *
     * Commits any changes to file when editing a file.
     */
    async end() {
        if (this.isMemoryMode) {
            this.#data = null;
            this.#view = null;
            return;
        }
        await this.commit();
        return;
    }
    ;
    /**
     * Removes data.
     *
     * Commits any changes to file when editing a file.
     */
    async done() {
        return await this.end();
    }
    ;
    /**
     * Removes data.
     *
     * Commits any changes to file when editing a file.
     */
    async finished() {
        return await this.end();
    }
    ;
    ///////////////////////////////
    // #region HEX DUMP
    ///////////////////////////////
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
    async hexdump(options = {}) {
        await this.open();
        const length = options?.length ?? 192;
        const startByte = options?.startByte ?? this.#offset;
        const endByte = Math.min(startByte + length, this.size);
        const newSize = endByte - startByte;
        if (startByte > this.size || endByte > this.size) {
            throw new RangeError("Hexdump amount is outside of data size: " + newSize + " of " + endByte);
        }
        const data = await this.#peekBytes(startByte, Math.min(endByte, this.size) - startByte);
        return _hexDump(data, options, startByte, endByte);
    }
    ;
    /**
     * Turn hexdump on error off (default on).
     */
    errorDumpOff() {
        this.errorDump = false;
    }
    ;
    /**
     * Turn hexdump on error on (default on).
     */
    errorDumpOn() {
        this.errorDump = true;
    }
    ;
    ///////////////////////////////
    // #region STRICT MODE
    ///////////////////////////////
    /**
     * Disallows extending data if position is outside of max size.
     */
    restrict() {
        this.strict = true;
    }
    ;
    /**
     * Allows extending data if position is outside of max size.
     */
    unrestrict() {
        this.strict = false;
    }
    ;
    ///////////////////////////////
    // #region   FIND 
    ///////////////////////////////
    /**
     * Searches for position of array of byte values from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {Uint8Array | Buffer | Array<number>} bytesToFind
     */
    async findBytes(bytesToFind) {
        if (Array.isArray(bytesToFind)) {
            bytesToFind = new Uint8Array(bytesToFind);
        }
        const data = await this.#peekBytes(0, this.size);
        if (this.isBuffer(data)) {
            var offset = data.subarray(this.#offset, this.size).indexOf(bytesToFind);
            if (offset == -1) {
                return -1;
            }
            return offset + this.#offset;
        }
        // data = Uint8Array
        for (let i = this.#offset; i <= this.size - bytesToFind.length; i++) {
            var match = true;
            for (let j = 0; j < bytesToFind.length; j++) {
                if (data[i + j] !== bytesToFind[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i; // Found the string, return the index
            }
        }
        return -1; // String not found
    }
    ;
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
    async findString(string, bytesPerChar = 1) {
        const encoded = textEncode(string, bytesPerChar);
        return await this.findBytes(encoded);
    }
    ;
    #findNumber(data, value, bits, unsigned, endian = this.endian) {
        for (let z = this.#offset; z <= (this.size - (bits / 8)); z++) {
            var offsetInBits = 0;
            var currentValue = 0;
            for (var i = 0; i < bits;) {
                const remaining = bits - i;
                const bitOffset = offsetInBits & 7;
                const currentByte = data[z + (offsetInBits >> 3)];
                const read = Math.min(remaining, 8 - bitOffset);
                if (endian == "big") {
                    let mask = ~(0xFF << read);
                    let readBits = (currentByte >> (8 - read - bitOffset)) & mask;
                    currentValue <<= read;
                    currentValue |= readBits;
                }
                else {
                    let mask = ~(0xFF << read);
                    let readBits = (currentByte >> bitOffset) & mask;
                    currentValue |= readBits << i;
                }
                offsetInBits += read;
                i += read;
            }
            if (unsigned == true || bits <= 7) {
                currentValue = currentValue >>> 0;
            }
            else {
                if (currentValue & (1 << (bits - 1))) {
                    currentValue |= -1 ^ ((1 << bits) - 1);
                }
            }
            if (currentValue === value) {
                return z - this.#offset; // Found the byte, return the index from current
            }
        }
        return -1; // number not found
    }
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
    async findByte(value, unsigned = true, endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);
        return this.#findNumber(data, value, 8, unsigned, endian);
    }
    ;
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
    async findShort(value, unsigned = true, endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);
        return this.#findNumber(data, value, 16, unsigned, endian);
    }
    ;
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
    async findInt(value, unsigned = true, endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);
        return this.#findNumber(data, value, 32, unsigned, endian);
    }
    ;
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
    async findInt64(value, unsigned = true, endian = this.endian) {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        const data = await this.#peekBytes(0, this.size);
        for (let z = this.#offset; z <= (this.size - 8); z++) {
            var currentValue = BigInt(0);
            if (endian == "little") {
                for (let i = 0; i < 8; i++) {
                    currentValue = currentValue | BigInt((data[z + i] & 0xFF)) << BigInt(8 * i);
                }
                if (unsigned == undefined || unsigned == false) {
                    if (currentValue & (BigInt(1) << BigInt(63))) {
                        currentValue -= BigInt(1) << BigInt(64);
                    }
                }
            }
            else {
                for (let i = 0; i < 8; i++) {
                    currentValue = (currentValue << BigInt(8)) | BigInt((data[z + i] & 0xFF));
                }
                if (unsigned == undefined || unsigned == false) {
                    if (currentValue & (BigInt(1) << BigInt(63))) {
                        currentValue -= BigInt(1) << BigInt(64);
                    }
                }
            }
            if (currentValue == BigInt(value)) {
                return z;
            }
        }
        return -1; // number not found
    }
    ;
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
    async findHalfFloat(value, endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);
        for (let z = this.#offset; z <= (this.size - 2); z++) {
            var currentValue = 0;
            if (endian == "little") {
                currentValue = ((data[z + 1] & 0xFFFF) << 8) | (data[z] & 0xFFFF);
            }
            else {
                currentValue = ((data[z] & 0xFFFF) << 8) | (data[z + 1] & 0xFFFF);
            }
            const sign = (currentValue & 0x8000) >> 15;
            const exponent = (currentValue & 0x7C00) >> 10;
            const fraction = currentValue & 0x03FF;
            var floatValue;
            if (exponent === 0) {
                if (fraction === 0) {
                    floatValue = (sign === 0) ? 0 : -0; // +/-0
                }
                else {
                    // Denormalized number
                    floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
                }
            }
            else if (exponent === 0x1F) {
                if (fraction === 0) {
                    floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                }
                else {
                    floatValue = Number.NaN;
                }
            }
            else {
                // Normalized number
                floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
            }
            if (floatValue === value) {
                return z; // Found the number, return the index
            }
        }
        return -1; // number not found
    }
    ;
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
    async findFloat(value, endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);
        for (let z = this.#offset; z <= (this.size - 4); z++) {
            var currentValue = 0;
            if (endian == "little") {
                currentValue = ((data[z + 3] & 0xFF) << 24) |
                    ((data[z + 2] & 0xFF) << 16) |
                    ((data[z + 1] & 0xFF) << 8) |
                    (data[z] & 0xFF);
            }
            else {
                currentValue = ((data[z] & 0xFF) << 24) |
                    ((data[z + 1] & 0xFF) << 16) |
                    ((data[z + 2] & 0xFF) << 8) |
                    (data[z + 3] & 0xFF);
            }
            const isNegative = (currentValue & 0x80000000) !== 0 ? 1 : 0;
            // Extract the exponent and fraction parts
            const exponent = (currentValue >> 23) & 0xFF;
            const fraction = currentValue & 0x7FFFFF;
            // Calculate the float value
            var floatValue;
            if (exponent === 0) {
                // Denormalized number (exponent is 0)
                floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
            }
            else if (exponent === 0xFF) {
                // Infinity or NaN (exponent is 255)
                floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
            }
            else {
                // Normalized number
                floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
            }
            if (floatValue === value) {
                return z; // Found the number, return the index
            }
        }
        return -1; // number not found
    }
    ;
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
    async findDoubleFloat(value, endian = this.endian) {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        const data = await this.#peekBytes(0, this.size);
        for (let z = this.#offset; z <= (this.size - 8); z++) {
            var currentValue = BigInt(0);
            if (endian == "little") {
                for (let i = 0; i < 8; i++) {
                    currentValue = currentValue | BigInt((data[z + i] & 0xFF)) << BigInt(8 * i);
                }
            }
            else {
                for (let i = 0; i < 8; i++) {
                    currentValue = (currentValue << BigInt(8)) | BigInt((data[z + i] & 0xFF));
                }
            }
            const sign = (currentValue & BigInt("9223372036854775808")) >> BigInt(63);
            const exponent = Number((currentValue & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;
            const fraction = Number(currentValue & BigInt("4503599627370495")) / Math.pow(2, 52);
            var floatValue;
            if (exponent == -1023) {
                if (fraction == 0) {
                    floatValue = (sign == BigInt(0)) ? 0 : -0; // +/-0
                }
                else {
                    // Denormalized number
                    floatValue = (sign == BigInt(0) ? 1 : -1) * Math.pow(2, -1022) * fraction;
                }
            }
            else if (exponent == 1024) {
                if (fraction == 0) {
                    floatValue = (sign == BigInt(0)) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                }
                else {
                    floatValue = Number.NaN;
                }
            }
            else {
                // Normalized number
                floatValue = (sign == BigInt(0) ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
            }
            if (floatValue == value) {
                return z;
            }
        }
        return -1; // number not found
    }
    ;
    ///////////////////////////////
    // #region MOVE TO
    ///////////////////////////////
    /**
     * Aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    async align(number) {
        const a = this.#offset % number;
        if (a) {
            await this.skip(number - a);
        }
    }
    ;
    /**
     * Reverse aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    async alignRev(number) {
        const a = this.#offset % number;
        if (a) {
            await this.skip(a * -1);
        }
    }
    ;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    async skip(bytes = 0, bits = 0) {
        await this.open();
        var newOffset = ((bytes + this.#offset) + Math.ceil((this.#insetBit + bits) / 8));
        if (bits && bits < 0) {
            newOffset = Math.floor((((bytes + this.#offset) * 8) + this.#insetBit + bits) / 8);
        }
        await this.#updateOffsets(newOffset, bytes, bits);
    }
    ;
    /**
    * Offset current byte or bit position.
    *
    * Note: Will extend array if strict mode is off and outside of max size.
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    async jump(bytes, bits) {
        await this.skip(bytes, bits);
    }
    ;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async FSeek(byte, bit) {
        await this.goto(byte, bit);
    }
    ;
    /**
     * Offset current byte or bit position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    async seek(bytes, bits) {
        await this.skip(bytes, bits);
    }
    ;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async goto(byte = 0, bit = 0) {
        await this.open();
        var newOffset = byte + Math.ceil(bit / 8);
        await this.#updateOffsets(newOffset, byte, bit);
    }
    ;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async pointer(byte, bit) {
        await this.goto(byte, bit);
    }
    ;
    /**
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async warp(byte, bit) {
        await this.goto(byte, bit);
    }
    ;
    /**
     * Set byte and bit position to start of data.
     */
    rewind() {
        this.#offset = 0;
        this.#insetBit = 0;
    }
    ;
    /**
     * Set byte and bit position to start of data.
     */
    gotoStart() {
        this.rewind();
    }
    ;
    /**
     * Set current byte and bit position to end of data.
     */
    last() {
        this.#offset = this.size;
        this.#insetBit = 0;
    }
    ;
    /**
     * Set current byte and bit position to end of data.
     */
    gotoEnd() {
        this.last();
    }
    ;
    /**
     * Set byte and bit position to start of data.
     */
    EoF() {
        this.last();
    }
    ;
    ///////////////////////////////
    // #region REMOVE
    ///////////////////////////////
    /**
     * Deletes part of data from start to current byte position unless supplied, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} startOffset - Start location (default 0)
     * @param {number} endOffset - End location (default current position)
     * @param {boolean} consume - Move position to end of removed data (default false)
     */
    async delete(startOffset = 0, endOffset = this.#offset, consume = false) {
        if (this.readOnly || this.strict) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: Can not remove data in strict mode: endOffset " + endOffset + " of " + this.size);
        }
        await this.open();
        const removeLen = endOffset - startOffset;
        if (startOffset < 0 || endOffset > this.size) {
            throw new RangeError('Remove range out of bounds');
        }
        if (removeLen <= 0) {
            if (this.isMemoryMode) {
                if (this.isBuffer(this.data)) {
                    return Buffer.alloc(0);
                }
                else {
                    return new Uint8Array(0);
                }
            }
            else {
                return Buffer.alloc(0);
            }
        }
        if (this.readOnly || this.strict) {
            throw new Error('Cannot modify readOnly data');
        }
        const removed = await this.#peekBytes(startOffset, removeLen);
        await this.#shiftTailBackward(startOffset, removeLen, consume);
        const newSize = this.size - removeLen;
        await this.#setFileSize(newSize);
        const startChunk = this.#getChunkIndex(startOffset);
        this.#invalidateFromChunk(startChunk);
        return removed;
    }
    ;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     */
    async clip() {
        return await this.delete(this.#offset, this.size, false);
    }
    ;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     */
    async trim() {
        return await this.delete(this.#offset, this.size, false);
    }
    ;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     */
    async crop(length = 0, consume = false) {
        return await this.delete(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Deletes part of data from current position to supplied length, returns removed.
     *
     * Note: Only works in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     */
    async drop(length = 0, consume = false) {
        return await this.delete(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {number} offset - Offset to add it at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default false)
     */
    async replace(data, offset = this.#offset, consume = false) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't replace data in readOnly mode!");
        }
        await this.open();
        if (this.isMemoryMode) {
            if (this.isBuffer(data)) {
                if (this.isUint8Array(this.data)) {
                    // source is Uint8Array
                    data = new Uint8Array(data);
                }
            }
            else {
                // input is Uint8Array
                if (this.isBuffer(this.data)) {
                    // source is Buffer
                    data = Buffer.from(data);
                }
            }
        }
        else {
            if (!this.isBuffer(data)) {
                data = Buffer.from(data);
            }
        }
        const insertLen = data.length ?? 0;
        if (insertLen === 0) {
            return;
        }
        if (offset + insertLen > this.size) {
            if (this.strict || this.readOnly) {
                throw new Error('Growing requires strict: false');
            }
            await this.#confrimSize(offset + insertLen);
        }
        const savedOffset = this.#offset;
        const savedBitOffset = this.#insetBit;
        this.#offset = offset;
        this.#insetBit = 0;
        await this.#writeBytes(data, consume);
        const tailStartChunk = Math.floor((offset + insertLen) / this.windowSize);
        this.#invalidateFromChunk(tailStartChunk);
        if (!consume) {
            this.#offset = savedOffset;
            this.#insetBit = savedBitOffset;
        }
    }
    ;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    async overwrite(data, consume = false, offset = this.#offset) {
        return await this.replace(data, offset, consume);
    }
    ;
    ///////////////////////////////
    // #region  COPY OUT
    ///////////////////////////////
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     */
    async fill(startOffset = this.#offset, endOffset = this.size, consume = false, fillValue) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't remove data in readOnly mode!");
        }
        await this.open();
        if (startOffset < 0 || endOffset > this.size) {
            throw new RangeError('Remove range out of bounds');
        }
        const removeLen = endOffset - startOffset;
        if (removeLen <= 0) {
            if (this.isMemoryMode) {
                if (this.isBuffer(this.data)) {
                    return Buffer.alloc(0);
                }
                else {
                    return new Uint8Array(0);
                }
            }
            else {
                return Buffer.alloc(0);
            }
        }
        if (endOffset > this.size && this.strict) {
            throw new Error('Cannot extend data while in strict mode. Use unrestrict() to enable.');
        }
        const dataRemoved = await this.#peekBytes(startOffset, removeLen);
        if (fillValue != undefined) {
            var replacement;
            if (this.isMemoryMode) {
                if (this.isBuffer(this.data)) {
                    replacement = Buffer.alloc(removeLen, fillValue);
                }
                else {
                    replacement = new Uint8Array(removeLen).fill(fillValue & 0xff);
                }
            }
            else {
                replacement = Buffer.alloc(removeLen, fillValue);
            }
            const offsetSaver = this.#offset;
            const offsetBitSaver = this.#insetBit;
            await this.#writeBytes(replacement, consume);
            if (!consume) {
                this.#offset = offsetSaver;
                this.#insetBit = offsetBitSaver;
            }
            return replacement;
        }
        else {
            await this.#shiftTailBackward(startOffset, removeLen, consume);
            const newSize = this.size - removeLen;
            await this.#setFileSize(newSize);
            const startChunk = this.#getChunkIndex(startOffset);
            this.#invalidateFromChunk(startChunk);
        }
        return dataRemoved;
    }
    ;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     */
    async lift(startOffset = this.#offset, endOffset = this.size, consume = false, fillValue) {
        return await this.fill(startOffset, endOffset, consume, fillValue);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    async extract(length = 0, consume = false) {
        return await this.fill(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    async slice(length = 0, consume = false) {
        return await this.fill(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    async wrap(length = 0, consume = false) {
        return await this.fill(this.#offset, this.#offset + length, consume);
    }
    ;
    ///////////////////////////////
    // #region   INSERT
    ///////////////////////////////
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    async insert(data, offset = this.#offset, consume = true) {
        if (this.readOnly || this.strict) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Can not insert data in strict mode. Use unrestrict() to enable.`);
        }
        if (!this.strict) {
            if (offset < 0 || offset > this.size) {
                throw new RangeError('Insert offset out of bounds');
            }
        }
        await this.open();
        if (this.isMemoryMode) {
            if (this.isBuffer(data)) {
                if (this.isUint8Array(this.data)) {
                    // source is Uint8Array
                    data = new Uint8Array(data);
                }
            }
            else {
                // input is Uint8Array
                if (this.isBuffer(this.data)) {
                    // source is Buffer
                    data = Buffer.from(data);
                }
            }
        }
        else {
            if (!this.isBuffer(data)) {
                data = Buffer.from(data);
            }
        }
        const insertLen = data.length ?? 0;
        if (insertLen === 0) {
            return;
        }
        const oldSize = this.size;
        if (offset + insertLen > this.size) {
            if (this.strict || this.readOnly) {
                throw new Error('Growing requires strict: false');
            }
            await this.#confrimSize(offset + insertLen);
        }
        await this.#shiftTailForward(offset, insertLen, oldSize, false);
        const savedOffset = this.#offset;
        const savedBitOffset = this.#insetBit;
        this.#offset = offset;
        this.#insetBit = 0;
        await this.#writeBytes(data, consume);
        const tailStartChunk = Math.floor((offset + insertLen) / this.windowSize);
        this.#invalidateFromChunk(tailStartChunk);
        if (!consume) {
            this.#offset = savedOffset;
            this.#insetBit = savedBitOffset;
        }
    }
    ;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    async place(data, offset = this.#offset, consume = true) {
        return await this.insert(data, offset, consume);
    }
    ;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async unshift(data, consume = false) {
        return await this.insert(data, 0, consume);
    }
    ;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async prepend(data, consume = false) {
        return await this.unshift(data, consume);
    }
    ;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async push(data, consume = false) {
        return await this.insert(data, this.size, consume);
    }
    ;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async append(data, consume = false) {
        return await this.push(data, consume);
    }
    ;
    ///////////////////////////////
    // #region  MATH 
    ///////////////////////////////
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async xor(xorKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        }
        else if (!(this.isBufferOrUint8Array(xorKey) || typeof xorKey == "number")) {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);
        _XOR(bytes, 0, bytes.length, xorKey);
        return await this.#writeBytesAt(startOffset, bytes);
    }
    ;
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async xorThis(xorKey, length, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof xorKey == "number") {
            length = length ?? 1;
        }
        else if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
            length = length ?? xorKey.length;
        }
        else if (this.isBufferOrUint8Array(xorKey)) {
            length = length ?? xorKey.length;
        }
        else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return await this.xor(xorKey, this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * OR data
     *
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async or(orKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        }
        else if (!(this.isBufferOrUint8Array(orKey) || typeof orKey == "number")) {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);
        _OR(bytes, 0, bytes.length, orKey);
        return await this.#writeBytesAt(startOffset, bytes);
    }
    ;
    /**
     * OR data.
     *
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async orThis(orKey, length, consume) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof orKey == "number") {
            length = length ?? 1;
        }
        else if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
            length = length ?? orKey.length;
        }
        else if (this.isBufferOrUint8Array(orKey)) {
            length = length ?? orKey.length;
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return await this.or(orKey, this.#offset, this.#offset + length, consume || false);
    }
    ;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async and(andKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof andKey == "string") {
            andKey = new TextEncoder().encode(andKey);
        }
        else if (!(typeof andKey == "object" || typeof andKey == "number")) {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);
        _AND(bytes, 0, bytes.length, andKey);
        return await this.#writeBytesAt(startOffset, bytes);
    }
    ;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async andThis(andKey, length, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof andKey == "number") {
            length = length ?? 1;
        }
        else if (typeof andKey == "string") {
            andKey = new TextEncoder().encode(andKey);
            length = length ?? andKey.length;
        }
        else if (this.isBufferOrUint8Array(andKey)) {
            length = length ?? andKey.length;
        }
        else {
            throw new Error("AND must be a number, string, Uint8Array or Buffer");
        }
        return await this.and(andKey, this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async add(addKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof addKey == "string") {
            addKey = new TextEncoder().encode(addKey);
        }
        else if (!(typeof addKey == "object" || typeof addKey == "number")) {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);
        _ADD(bytes, 0, bytes.length, addKey);
        return await this.#writeBytesAt(startOffset, bytes);
    }
    ;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async addThis(addKey, length, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof addKey == "number") {
            length = length ?? 1;
        }
        else if (typeof addKey == "string") {
            addKey = new TextEncoder().encode(addKey);
            length = length ?? addKey.length;
        }
        else if (this.isBufferOrUint8Array(addKey)) {
            length = length ?? addKey.length;
        }
        else {
            throw new Error("ADD must be a number, string, Uint8Array or Buffer");
        }
        return await this.add(addKey, this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async not(startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);
        _NOT(bytes, 0, bytes.length);
        return await this.#writeBytesAt(startOffset, bytes);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async notThis(length = 1, consume = false) {
        return await this.not(this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async lShift(shiftKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
        }
        else if (!(typeof shiftKey == "object" || typeof shiftKey == "number")) {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);
        _LSHIFT(bytes, 0, bytes.length, shiftKey);
        return await this.#writeBytesAt(startOffset, bytes);
    }
    ;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async lShiftThis(shiftKey, length, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof shiftKey == "number") {
            length = length ?? 1;
        }
        else if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
            length = length ?? shiftKey.length;
        }
        else if (this.isBufferOrUint8Array(shiftKey)) {
            length = length ?? shiftKey.length;
        }
        else {
            throw new Error("Left shift must be a number, string, Uint8Array or Buffer");
        }
        return await this.lShift(shiftKey, this.#offset, this.#offset + length, consume);
    }
    ;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async rShift(shiftKey, startOffset = this.#offset, endOffset = this.size, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
        }
        else if (!(typeof shiftKey == "object" || typeof shiftKey == "number")) {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);
        _RSHIFT(bytes, 0, bytes.length, shiftKey);
        return await this.#writeBytesAt(startOffset, bytes);
    }
    ;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async rShiftThis(shiftKey, length, consume = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (typeof shiftKey == "number") {
            length = length ?? 1;
        }
        else if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
            length = length ?? shiftKey.length;
        }
        else if (this.isBufferOrUint8Array(shiftKey)) {
            length = length ?? shiftKey.length;
        }
        else {
            throw new Error("right shift must be a number, string, Uint8Array or Buffer");
        }
        return await this.rShift(shiftKey, this.#offset, this.#offset + length, consume);
    }
    ;
    ///////////////////////////////
    // #region BIT READER
    ///////////////////////////////
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
    async readBit(bits, unsigned = false, endian = this.endian, consume = true) {
        await this.open();
        if (typeof bits != "number") {
            throw new TypeError("Enter number of bits to read");
        }
        if (bits == 0) {
            return 0;
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32. Got ' + bits);
        }
        const byteEnd = Math.ceil((((bits - 1) + this.#insetBit) / 8) + this.#offset);
        if (byteEnd > this.size) {
            throw new Error(`Not enough bytes in file (need ${byteEnd}, have ${this.size})`);
        }
        const bitStart = (this.#offset * 8) + this.#insetBit;
        const byteStart = Math.floor(((this.#offset * 8) + this.#insetBit) / 8);
        const temp = await this.#peekBytes(byteStart, byteEnd - byteStart);
        const value = _rbit(temp, bits, bitStart % 8, endian, unsigned);
        if (consume) {
            this.#offset += Math.floor((bits + this.#insetBit) / 8); //end byte
            this.#insetBit = (bits + this.#insetBit) % 8;
        }
        return value;
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     */
    async readUBitBE(bits) {
        return await this.readBit(bits, true, "big");
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     */
    async readUBitLE(bits) {
        return await this.readBit(bits, true, "little");
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     */
    async readBitBE(bits, unsigned) {
        return await this.readBit(bits, unsigned, "big");
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     */
    async readBitLE(bits, unsigned) {
        return await this.readBit(bits, unsigned, "little");
    }
    ;
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
    async writeBit(value, bits, unsigned = false, endian = this.endian, consume = true) {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";
            throw new Error("Can't write data in readOnly mode!");
        }
        await this.open();
        if (bits <= 0) {
            return;
        }
        if (bits <= 0 || bits > 32) {
            throw new Error('Bit length must be between 1 and 32. Got ' + bits);
        }
        value = numberSafe(value, bits, unsigned);
        const endOffset = Math.ceil((((bits - 1) + this.#insetBit) / 8) + this.#offset);
        const temp = await this.#peekBytes(this.#offset, Math.ceil(endOffset - this.#offset));
        _wbit(temp, value, bits, this.#insetBit, endian, unsigned);
        await this.#writeBytesAt(this.#offset, temp);
        if (consume) {
            this.#offset += Math.floor((bits + this.#insetBit) / 8);
            this.#insetBit = (bits + this.#insetBit) % 8;
        }
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    async writeUBitBE(value, bits) {
        return await this.writeBit(value, bits, true, "big");
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    async writeUBitLE(value, bits) {
        return await this.writeBit(value, bits, true, "little");
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
     * @returns number
     */
    async writeBitBE(value, bits, unsigned) {
        return await this.writeBit(value, bits, unsigned, "big");
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
     * @returns number
     */
    async writeBitLE(value, bits, unsigned) {
        return await this.writeBit(value, bits, unsigned, "little");
    }
    ;
    ///////////////////////////////
    // #region BYTE READER
    ///////////////////////////////
    /**
     * Read byte.
     *
     * @param {boolean} unsigned - if the value is unsigned or not
     * @param {boolean} consume - move offset after read
     */
    async readByte(unsigned = false, consume = true) {
        await this.open();
        const data = await this.#readBytes(1, consume);
        var value = data[0];
        if (unsigned) {
            value = value & 0xFF;
        }
        else {
            value = value > 127 ? value - 256 : value;
        }
        return value;
    }
    /**
     * Read unsigned byte.
     */
    async readUByte() {
        return await this.readByte(true);
    }
    ;
    /**
     * Read multiple bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {boolean} consume - move offset after read
     */
    async readBytes(amount, unsigned, consume = true) {
        const array = [];
        for (let i = 0; i < amount; i++) {
            const value = await this.readByte(unsigned, consume);
            array.push(value);
        }
        return array;
    }
    ;
    /**
     * Read multiple unsigned bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} consume - move offset after read
     */
    async readUBytes(amount, consume = true) {
        return await this.readBytes(amount, true, consume);
    }
    ;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    async writeByte(value, unsigned, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        this.open();
        await this.#writeBytes([numberSafe(value, 8, unsigned)], consume);
    }
    ;
    /**
     * Write multiple unsigned bytes.
     *
     * @param {number[]} values - array of values as int
     */
    async writeUBytes(values) {
        for (let i = 0; i < values.length; i++) {
            await this.writeUByte(values[i]);
        }
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    async writeUByte(value) {
        return await this.writeByte(value, true);
    }
    ;
    ///////////////////////////////
    // #region INT16 READER
    ///////////////////////////////
    /**
     * Read short.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readInt16(unsigned = false, endian = this.endian, consume = true) {
        await this.open();
        const buf = await this.#readBytes(2, consume);
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        if (canInt16) {
            if (unsigned) {
                return view.getUint16(0, endian == "little");
            }
            else {
                return view.getInt16(0, endian == "little");
            }
        }
        else {
            return _rint16(buf, 0, endian, unsigned);
        }
    }
    ;
    /**
     * Read unsigned short.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    async readUInt16(endian = this.endian) {
        return await this.readInt16(true, endian);
    }
    ;
    /**
     * Read unsigned short in little endian.
     */
    async readUInt16LE() {
        return await this.readUInt16("little");
    }
    ;
    /**
     * Read unsigned short in big endian.
     */
    async readUInt16BE() {
        return await this.readUInt16("big");
    }
    ;
    /**
     * Read signed short in little endian.
     */
    async readInt16LE() {
        return await this.readInt16(false, "little");
    }
    ;
    /**
    * Read signed short in big endian.
    */
    async readInt16BE() {
        return await this.readInt16(false, "big");
    }
    ;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeInt16(value, unsigned = false, endian = this.endian, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (canInt16) {
            if (unsigned) {
                view2ByteDummy.setUint16(0, value, endian == "little");
            }
            else {
                view2ByteDummy.setInt16(0, value, endian == "little");
            }
        }
        else {
            _wint16(buff2ByteDummy, numberSafe(value, 16, unsigned), 0, endian, unsigned);
        }
        return await this.#writeBytes(buff2ByteDummy, consume);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt16(value, endian = this.endian) {
        return await this.writeInt16(value, true, endian);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async writeUInt16BE(value) {
        return await this.writeUInt16(value, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async writeUInt16LE(value) {
        return await this.writeUInt16(value, "little");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    async writeInt16LE(value) {
        return await this.writeInt16(value, false, "little");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    async writeInt16BE(value) {
        return await this.writeInt16(value, false, "big");
    }
    ;
    ///////////////////////////////
    // #region HALF FLOAT
    ///////////////////////////////
    /**
     * Read 16 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readHalfFloat(endian = this.endian, consume = true) {
        const buf = await this.#readBytes(2, consume);
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        if (canFloat16) {
            return view.getFloat16(0, endian == "little");
        }
        else {
            return _rhalffloat(buf, 0, endian);
        }
    }
    ;
    /**
     * Read 16 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readFloat16(endian = this.endian, consume = true) {
        return await this.readHalfFloat(endian, consume);
    }
    ;
    /**
    * Read 16 bit float.
    */
    async readHalfFloatBE() {
        return await this.readHalfFloat("big");
    }
    ;
    /**
    * Read 16 bit float.
    */
    async readFloat16BE() {
        return await this.readHalfFloat("big");
    }
    ;
    /**
     * Read 16 bit float.
     */
    async readHalfFloatLE() {
        return await this.readHalfFloat("little");
    }
    ;
    /**
     * Read 16 bit float.
     */
    async readFloat16LE() {
        return await this.readHalfFloat("little");
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeHalfFloat(value, endian = this.endian, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (canFloat16) {
            view2ByteDummy.setFloat16(0, value, endian == "little");
        }
        else {
            _whalffloat(buff2ByteDummy, value, 0, endian);
        }
        return await this.#writeBytes(buff2ByteDummy, consume);
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeFloat16(value, endian = this.endian, consume = true) {
        return await this.writeHalfFloat(value, endian, consume);
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    async writeHalfFloatBE(value) {
        return await this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    async writeFloat16BE(value) {
        return await this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    async writeHalfFloatLE(value) {
        return await this.writeHalfFloat(value, "little");
    }
    ;
    /**
     * Writes 16 bit float.
     *
     * @param {number} value - value as int
     */
    async writeFloat16LE(value) {
        return await this.writeHalfFloat(value, "little");
    }
    ;
    ///////////////////////////////
    // #region INT32 READER
    ///////////////////////////////
    /**
     * Read signed 32 bit integer.
     */
    async readInt32(unsigned = false, endian = this.endian, consume = true) {
        const buf = await this.#readBytes(4, consume);
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        if (canInt32) {
            if (unsigned) {
                return view.getUint32(0, endian == "little");
            }
            else {
                return view.getInt32(0, endian == "little");
            }
        }
        else {
            return _rint32(buf, 0, endian, unsigned);
        }
    }
    ;
    /**
     * Read signed 32 bit integer.
     */
    async readInt(endian) {
        return await this.readInt32(false, endian);
    }
    /**
     * Read signed 32 bit integer.
     */
    async readInt32BE() {
        return await this.readInt("big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     */
    async readInt32LE() {
        return await this.readInt("little");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    async readUInt32(endian) {
        return await this.readInt32(true, endian);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    async readUInt(endian) {
        return await this.readInt32(true, endian);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     */
    async readUInt32BE() {
        return await this.readUInt("big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     */
    async readUInt32LE() {
        return await this.readUInt("little");
    }
    ;
    /**
     * Write 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeInt32(value, unsigned = false, endian = this.endian, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (canInt32) {
            if (unsigned) {
                view4ByteDummy.setUint32(0, value, endian == "little");
            }
            else {
                view4ByteDummy.setInt32(0, value, endian == "little");
            }
        }
        else {
            _wint32(buff4ByteDummy, numberSafe(value, 32, unsigned), 0, endian, unsigned);
        }
        return await this.#writeBytes(buff4ByteDummy, consume);
    }
    /**
     * Write signed 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeInt(value, endian) {
        return await this.writeInt32(value, false, endian);
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async writeInt32LE(value) {
        return await this.writeInt(value, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async writeInt32BE(value) {
        return await this.writeInt(value, "big");
    }
    ;
    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt(value, endian) {
        return await this.writeInt32(value, true, endian);
    }
    ;
    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt32(value, endian) {
        return await this.writeUInt(value, endian);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async writeUInt32BE(value) {
        return await this.writeUInt32(value, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async writeUInt32LE(value) {
        return await this.writeUInt32(value, "little");
    }
    ;
    ///////////////////////////////
    // #region FLOAT32 READER
    ///////////////////////////////
    /**
     * Read 32 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readFloat(endian = this.endian, consume = true) {
        const buf = await this.#readBytes(4, consume);
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        if (canFloat32) {
            return view.getFloat32(0, endian == "little");
        }
        else {
            return _rfloat(buf, 0, endian);
        }
    }
    ;
    /**
     * Read 32 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readFloat32(endian = this.endian, consume = true) {
        return await this.readFloat(endian, consume);
    }
    ;
    /**
     * Read 32 bit float.
     */
    async readFloatBE() {
        return await this.readFloat("big");
    }
    ;
    /**
     * Read 32 bit float.
     */
    async readFloat32BE() {
        return await this.readFloat("big");
    }
    ;
    /**
     * Read 32 bit float.
     */
    async readFloatLE() {
        return await this.readFloat("little");
    }
    ;
    /**
     * Read 32 bit float.
     */
    async readFloat32LE() {
        return await this.readFloat("little");
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeFloat(value, endian = this.endian, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (canFloat32) {
            view4ByteDummy.setFloat32(0, value, endian == "little");
        }
        else {
            _wfloat(buff4ByteDummy, value, 0, endian);
        }
        return await this.#writeBytes(buff4ByteDummy, consume);
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    async writeFloatLE(value) {
        return await this.writeFloat(value, "little");
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    async writeFloat32LE(value) {
        return await this.writeFloat(value, "little");
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    async writeFloat32BE(value) {
        return await this.writeFloat(value, "big");
    }
    ;
    /**
     * Write 32 bit float.
     *
     * @param {number} value - value as int
     */
    async writeFloatBE(value) {
        return await this.writeFloat(value, "big");
    }
    ;
    ///////////////////////////////
    // #region INT64 READER
    ///////////////////////////////
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian?} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readInt64(unsigned = false, endian = this.endian, consume = true) {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        const buf = await this.#readBytes(8, consume);
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        var value;
        if (canBigInt64) {
            if (unsigned) {
                value = view.getBigUint64(0, endian == "little");
            }
            else {
                value = view.getBigInt64(0, endian == "little");
            }
        }
        else {
            value = _rint64(buf, 0, endian, unsigned);
        }
        if (this.enforceBigInt == true || (typeof value == "bigint" && !isSafeInt64(value))) {
            return value;
        }
        else {
            if (isSafeInt64(value)) {
                return Number(value);
            }
            else {
                throw new Error("Value is outside of number range and enforceBigInt is set to false. " + value);
            }
        }
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readUInt64() {
        return await this.readInt64(true);
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readInt64BE() {
        return await this.readInt64(false, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readInt64LE() {
        return await this.readInt64(false, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readUInt64BE() {
        return await this.readInt64(true, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readUInt64LE() {
        return await this.readInt64(true, "little");
    }
    ;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeInt64(value, unsigned = false, endian = this.endian, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }
        if (canBigInt64) {
            if (unsigned) {
                view8ByteDummy.setBigUint64(0, BigInt(value), endian == "little");
            }
            else {
                view8ByteDummy.setBigInt64(0, BigInt(value), endian == "little");
            }
        }
        else {
            _wint64(buff8ByteDummy, numberSafe(value, 64, unsigned), 0, endian, unsigned);
        }
        return await this.#writeBytes(buff8ByteDummy, consume);
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt64(value, endian = this.endian) {
        return await this.writeInt64(value, true, endian);
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async writeInt64LE(value) {
        return await this.writeInt64(value, false, "little");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async writeInt64BE(value) {
        return await this.writeInt64(value, false, "big");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async writeUInt64LE(value) {
        return await this.writeInt64(value, true, "little");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async writeUInt64BE(value) {
        return await this.writeInt64(value, true, "big");
    }
    ;
    ///////////////////////////////
    // #region FLOAT64 READER
    ///////////////////////////////
    /**
     * Read 64 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    async readDoubleFloat(endian = this.endian, consume = true) {
        const buf = await this.#readBytes(8, consume);
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        if (canFloat64) {
            return view.getFloat64(0, endian == "little");
        }
        else {
            if (!hasBigInt) {
                throw new Error("System doesn't support BigInt values.");
            }
            return _rdfloat(buf, 0, endian);
        }
    }
    ;
    /**
     * Read 64 bit float.
     *
     * @param {endian} endian - ``big`` or ``little``
     */
    async readFloat64(endian = this.endian) {
        return await this.readDoubleFloat(endian);
    }
    ;
    /**
     * Read 64 bit float.
     */
    async readDoubleFloatBE() {
        return await this.readDoubleFloat("big");
    }
    ;
    /**
     * Read 64 bit float.
     */
    async readFloat64BE() {
        return await this.readDoubleFloat("big");
    }
    ;
    /**
     * Read 64 bit float.
     */
    async readDoubleFloatLE() {
        return await this.readDoubleFloat("little");
    }
    ;
    /**
     * Read 64 bit float.
     */
    async readFloat64LE() {
        return await this.readDoubleFloat("little");
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeDoubleFloat(value, endian = this.endian, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        if (canFloat64) {
            view8ByteDummy.setFloat64(0, value, endian == "little");
        }
        else {
            _wdfloat(buff8ByteDummy, value, 0, endian);
        }
        return await this.#writeBytes(buff8ByteDummy, consume);
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeFloat64(value, endian = this.endian) {
        return await this.writeDoubleFloat(value, endian);
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    async writeDoubleFloatBE(value) {
        return await this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    async writeFloat64BE(value) {
        return await this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    async writeDoubleFloatLE(value) {
        return await this.writeDoubleFloat(value, "little");
    }
    ;
    /**
     * Writes 64 bit float.
     *
     * @param {number} value - value as int
     */
    async writeFloat64LE(value) {
        return await this.writeDoubleFloat(value, "little");
    }
    ;
    ///////////////////////////////
    // #region STRING READER
    ///////////////////////////////
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
    async readString(options = this.strDefaults, consume = true) {
        await this.open();
        var length = options.length;
        var stringType = options.stringType ?? 'utf-8';
        var terminateValue = options.terminateValue;
        var lengthReadSize = options.lengthReadSize ?? 1;
        var stripNull = options.stripNull ?? true;
        var endian = options.endian ?? this.endian;
        var encoding = options.encoding ?? 'utf-8';
        var terminate = terminateValue;
        var readLengthinBytes = 0;
        if (length != undefined) {
            switch (stringType) {
                case "utf-8":
                    readLengthinBytes = length;
                    break;
                case "utf-16":
                    readLengthinBytes = length * 2;
                    break;
                case "utf-32":
                    readLengthinBytes = length * 4;
                    break;
                default:
                    readLengthinBytes = length;
                    break;
            }
        }
        else {
            readLengthinBytes = this.data.length - this.#offset;
        }
        if (this.#offset + readLengthinBytes > this.size) {
            if (this.strict || this.readOnly) {
                throw new Error('Growing requires strict: false');
            }
            await this.#confrimSize(this.#offset + readLengthinBytes);
        }
        if (terminateValue != undefined && typeof terminateValue == "number") {
            terminate = terminateValue & 0xFF;
        }
        else {
            terminate = 0;
        }
        const saved_offset = this.#offset;
        const saved_bitoffset = this.#insetBit;
        const str = await _rstringAsync(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, this.readUByte.bind(this), this.readUInt16.bind(this), this.readUInt32.bind(this));
        if (!consume) {
            this.#offset = saved_offset;
            this.#insetBit = saved_bitoffset;
        }
        return str;
    }
    ;
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
    async writeString(string, options = this.strDefaults, consume = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        await this.open();
        var length = options.length;
        var stringType = options.stringType ?? 'utf-8';
        var terminateValue = options.terminateValue;
        var lengthWriteSize = options.lengthWriteSize ?? 1;
        var endian = options.endian ?? this.endian;
        var maxLengthValue = length ?? string.length;
        var strUnits = string.length;
        var maxBytes;
        switch (stringType) {
            case 'pascal':
                maxLengthValue = 255;
                if (length != undefined) {
                    maxLengthValue = length;
                }
                break;
            case 'wide-pascal':
                strUnits *= 2;
                maxLengthValue = 65535;
                if (length != undefined) {
                    maxLengthValue = length / 2;
                }
                break;
            case 'double-wide-pascal':
                strUnits *= 4;
                maxLengthValue = 4294967295;
                if (length != undefined) {
                    maxLengthValue = length / 4;
                }
                break;
        }
        if (terminateValue == undefined) {
            if (stringType == "ascii" || stringType == 'utf-8' ||
                stringType == 'utf-16' ||
                stringType == 'utf-32') {
                terminateValue = 0;
            }
        }
        var maxBytes = Math.min(strUnits, maxLengthValue);
        string = string.substring(0, maxBytes);
        var encodedString;
        var totalLength = string.length;
        switch (stringType) {
            case 'ascii':
            case 'utf-8':
            case 'pascal':
                {
                    encodedString = new TextEncoder().encode(string);
                    totalLength = encodedString.byteLength + 1;
                }
                break;
            case 'utf-16':
            case 'wide-pascal':
                {
                    const utf16Buffer = new Uint16Array(string.length);
                    for (let i = 0; i < string.length; i++) {
                        utf16Buffer[i] = string.charCodeAt(i);
                    }
                    encodedString = new Uint8Array(utf16Buffer.buffer);
                    totalLength = encodedString.byteLength + 2;
                }
                break;
            case 'utf-32':
            case 'double-wide-pascal':
                {
                    const utf32Buffer = new Uint32Array(string.length);
                    for (let i = 0; i < string.length; i++) {
                        utf32Buffer[i] = string.codePointAt(i);
                    }
                    encodedString = new Uint8Array(utf32Buffer.buffer);
                    totalLength = encodedString.byteLength + 4;
                }
                break;
        }
        await this.#confrimSize(this.#offset + totalLength);
        const savedOffset = this.#offset;
        const savedBitOffset = this.#insetBit;
        await _wstringAsync(encodedString, stringType, endian, terminateValue, lengthWriteSize, this.writeUByte.bind(this), this.writeUInt16.bind(this), this.writeUInt32.bind(this));
        if (!consume) {
            this.#offset = savedOffset;
            this.#insetBit = savedBitOffset;
        }
    }
    ;
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
class BiReaderAsync extends BiBaseAsync {
    constructor(input, options = {}) {
        options.byteOffset = options.byteOffset ?? 0;
        options.bitOffset = options.bitOffset ?? 0;
        options.endianness = options.endianness ?? "little";
        options.strict = options.strict ?? true;
        options.growthIncrement = options.growthIncrement ?? 1048576;
        options.enforceBigInt = options.enforceBigInt ?? false;
        options.readOnly = options.readOnly ?? true;
        options.windowSize = options.windowSize = 4096;
        if (input == undefined) {
            throw new Error("Can not start BiReader without data.");
        }
        super(input, options);
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
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit1() {
        return await this.bit(1);
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit1le() {
        return await this.bit(1, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit1be() {
        return await this.bit(1, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit1() {
        return await this.bit(1, true);
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit1le() {
        return await this.bit(1, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 1 bit.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit1be() {
        return await this.bit(1, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit2() {
        return await this.bit(2);
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit2le() {
        return await this.bit(2, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit2be() {
        return await this.bit(2, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit2() {
        return await this.bit(2, true);
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit2le() {
        return await this.bit(2, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 2 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit2be() {
        return await this.bit(2, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit3() {
        return await this.bit(3);
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit3le() {
        return await this.bit(3, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit3be() {
        return await this.bit(3, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit3() {
        return await this.bit(3, true);
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit3le() {
        return await this.bit(3, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 3 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit3be() {
        return await this.bit(3, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit4() {
        return await this.bit(4);
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit4le() {
        return await this.bit(4, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit4be() {
        return await this.bit(4, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit4() {
        return await this.bit(4, true);
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit4le() {
        return await this.bit(4, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 4 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit4be() {
        return await this.bit(4, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit5() {
        return await this.bit(5);
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit5le() {
        return await this.bit(5, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit5be() {
        return await this.bit(5, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit5() {
        return await this.bit(5, true);
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit5le() {
        return await this.bit(5, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 5 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit5be() {
        return await this.bit(5, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit6() {
        return await this.bit(6);
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit6le() {
        return await this.bit(6, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit6be() {
        return await this.bit(6, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit6() {
        return await this.bit(6, true);
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit6le() {
        return await this.bit(6, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 6 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit6be() {
        return await this.bit(6, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit7() {
        return await this.bit(7);
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit7le() {
        return await this.bit(7, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit7be() {
        return await this.bit(7, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit7() {
        return await this.bit(7, true);
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit7le() {
        return await this.bit(7, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 7 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit7be() {
        return await this.bit(7, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit8() {
        return await this.bit(8);
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit8le() {
        return await this.bit(8, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit8be() {
        return await this.bit(8, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit8() {
        return await this.bit(8, true);
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit8le() {
        return await this.bit(8, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 8 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit8be() {
        return await this.bit(8, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit9() {
        return await this.bit(9);
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit9le() {
        return await this.bit(9, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit9be() {
        return await this.bit(9, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit9() {
        return await this.bit(9, true);
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit9le() {
        return await this.bit(9, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 9 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit9be() {
        return await this.bit(9, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit10() {
        return await this.bit(10);
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit10le() {
        return await this.bit(10, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit10be() {
        return await this.bit(10, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit10() {
        return await this.bit(10, true);
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit10le() {
        return await this.bit(10, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 10 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit10be() {
        return await this.bit(10, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit11() {
        return await this.bit(11);
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit11le() {
        return await this.bit(11, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit11be() {
        return await this.bit(11, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit11() {
        return await this.bit(11, true);
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit11le() {
        return await this.bit(11, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 11 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit11be() {
        return await this.bit(11, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit12() {
        return await this.bit(12);
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit12le() {
        return await this.bit(12, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit12be() {
        return await this.bit(12, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit12() {
        return await this.bit(12, true);
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit12le() {
        return await this.bit(12, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 12 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit12be() {
        return await this.bit(12, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit13() {
        return await this.bit(13);
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit13le() {
        return await this.bit(13, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit13be() {
        return await this.bit(13, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit13() {
        return await this.bit(13, true);
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit13le() {
        return await this.bit(13, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 13 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit13be() {
        return await this.bit(13, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit14() {
        return await this.bit(14);
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit14le() {
        return await this.bit(14, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit14be() {
        return await this.bit(14, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit14() {
        return await this.bit(14, true);
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit14le() {
        return await this.bit(14, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 14 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit14be() {
        return await this.bit(14, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit15() {
        return await this.bit(15);
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {promise<number>}
     */
    async bit15le() {
        return await this.bit(15, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {promise<number>}
     */
    async bit15be() {
        return await this.bit(15, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit15() {
        return await this.bit(15, true);
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit15le() {
        return await this.bit(15, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 15 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit15be() {
        return await this.bit(15, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit16() {
        return await this.bit(16);
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit16le() {
        return await this.bit(16, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit16be() {
        return await this.bit(16, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit16() {
        return await this.bit(16, true);
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit16le() {
        return await this.bit(16, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 16 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit16be() {
        return await this.bit(16, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit17() {
        return await this.bit(17);
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit17le() {
        return await this.bit(17, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit17be() {
        return await this.bit(17, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit17() {
        return await this.bit(17, true);
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit17le() {
        return await this.bit(17, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 17 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit17be() {
        return await this.bit(17, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit18() {
        return await this.bit(18);
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit18le() {
        return await this.bit(18, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit18be() {
        return await this.bit(18, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit18() {
        return await this.bit(18, true);
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit18le() {
        return await this.bit(18, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 18 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit18be() {
        return await this.bit(18, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit19() {
        return await this.bit(19);
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit19le() {
        return await this.bit(19, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit19be() {
        return await this.bit(19, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit19() {
        return await this.bit(19, true);
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit19le() {
        return await this.bit(19, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 19 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit19be() {
        return await this.bit(19, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit20() {
        return await this.bit(20);
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit20le() {
        return await this.bit(20, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit20be() {
        return await this.bit(20, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit20() {
        return await this.bit(20, true);
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit20le() {
        return await this.bit(20, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 20 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit20be() {
        return await this.bit(20, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit21() {
        return await this.bit(21);
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit21le() {
        return await this.bit(21, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit21be() {
        return await this.bit(21, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit21() {
        return await this.bit(21, true);
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit21le() {
        return await this.bit(21, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 21 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit21be() {
        return await this.bit(21, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit22() {
        return await this.bit(22);
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit22le() {
        return await this.bit(22, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit22be() {
        return await this.bit(22, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit22() {
        return await this.bit(22, true);
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit22le() {
        return await this.bit(22, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 22 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit22be() {
        return await this.bit(22, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit23() {
        return await this.bit(23);
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit23le() {
        return await this.bit(23, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit23be() {
        return await this.bit(23, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit23() {
        return await this.bit(23, true);
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit23le() {
        return await this.bit(23, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 23 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit23be() {
        return await this.bit(23, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit24() {
        return await this.bit(24);
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit24le() {
        return await this.bit(24, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit24be() {
        return await this.bit(24, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit24() {
        return await this.bit(24, true);
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit24le() {
        return await this.bit(24, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 24 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit24be() {
        return await this.bit(24, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit25() {
        return await this.bit(25);
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit25le() {
        return await this.bit(25, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit25be() {
        return await this.bit(25, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit25() {
        return await this.bit(25, true);
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit25le() {
        return await this.bit(25, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 25 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit25be() {
        return await this.bit(25, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit26() {
        return await this.bit(26);
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit26le() {
        return await this.bit(26, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit26be() {
        return await this.bit(26, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit26() {
        return await this.bit(26, true);
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit26le() {
        return await this.bit(26, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 26 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit26be() {
        return await this.bit(26, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit27() {
        return await this.bit(27);
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit27le() {
        return await this.bit(27, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit27be() {
        return await this.bit(27, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit27() {
        return await this.bit(27, true);
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit27le() {
        return await this.bit(27, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 27 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit27be() {
        return await this.bit(27, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit28() {
        return await this.bit(28);
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit28le() {
        return await this.bit(28, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit28be() {
        return await this.bit(28, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit28() {
        return await this.bit(28, true);
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit28le() {
        return await this.bit(28, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 28 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit28be() {
        return await this.bit(28, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit29() {
        return await this.bit(29);
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit29le() {
        return await this.bit(29, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit29be() {
        return await this.bit(29, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit29() {
        return await this.bit(29, true);
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit29le() {
        return await this.bit(29, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 29 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit29be() {
        return await this.bit(29, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit30() {
        return await this.bit(30);
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit30le() {
        return await this.bit(30, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit30be() {
        return await this.bit(30, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit30() {
        return await this.bit(30, true);
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit30le() {
        return await this.bit(30, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 30 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit30be() {
        return await this.bit(30, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit31() {
        return await this.bit(31);
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit31le() {
        return await this.bit(31, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit31be() {
        return await this.bit(31, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit31() {
        return await this.bit(31, true);
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit31le() {
        return await this.bit(31, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 31 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit31be() {
        return await this.bit(31, true, "big");
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit32() {
        return await this.bit(32);
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit32le() {
        return await this.bit(32, undefined, "little");
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async bit32be() {
        return await this.bit(32, undefined, "big");
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit32() {
        return await this.bit(32, true);
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit32le() {
        return await this.bit(32, true, "little");
    }
    ;
    /**
     * Bit field reader. Reads 32 bits.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @returns {Promise<number>}
     */
    async ubit32be() {
        return await this.bit(32, true, "big");
    }
    ;
    //
    // #region byte read
    //
    /**
     * Read byte.
     *
     * @returns {Promise<number>}
     */
    async byte() {
        return await this.readByte();
    }
    ;
    /**
     * Read byte.
     *
     * @returns {Promise<number>}
     */
    async int8() {
        return await this.readByte();
    }
    ;
    /**
     * Read unsigned byte.
     *
     * @returns {Promise<number>}
     */
    async uint8() {
        return await this.readByte(true);
    }
    ;
    /**
     * Read unsigned byte.
     *
     * @returns {Promise<number>}
     */
    async ubyte() {
        return await this.readByte(true);
    }
    ;
    //
    // #region short16 read
    //
    /**
     * Read short.
     *
     * @returns {Promise<number>}
     */
    async int16() {
        return await this.readInt16();
    }
    ;
    /**
     * Read short.
     *
     * @returns {Promise<number>}
     */
    async short() {
        return await this.readInt16();
    }
    ;
    /**
     * Read short.
     *
     * @returns {Promise<number>}
     */
    async word() {
        return await this.readInt16();
    }
    ;
    /**
     * Read unsigned short.
     *
     * @returns {Promise<number>}
     */
    async uint16() {
        return await this.readInt16(true);
    }
    ;
    /**
     * Read unsigned short.
     *
     * @returns {Promise<number>}
     */
    async ushort() {
        return this.readInt16(true);
    }
    ;
    /**
     * Read unsigned short.
     *
     * @returns {Promise<number>}
     */
    async uword() {
        return await this.readInt16(true);
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {Promise<number>}
     */
    async uint16le() {
        return await this.readInt16(true, "little");
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {Promise<number>}
     */
    async ushortle() {
        return await this.readInt16(true, "little");
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {Promise<number>}
     */
    async uwordle() {
        return await this.readInt16(true, "little");
    }
    ;
    /**
     * Read signed short in little endian.
     *
     * @returns {Promise<number>}
     */
    async int16le() {
        return await this.readInt16(false, "little");
    }
    ;
    /**
     * Read signed short in little endian.
     *
     * @returns {Promise<number>}
     */
    async shortle() {
        return await this.readInt16(false, "little");
    }
    ;
    /**
     * Read signed short in little endian.
     *
     * @returns {Promise<number>}
     */
    async wordle() {
        return await this.readInt16(false, "little");
    }
    ;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {Promise<number>}
     */
    async uint16be() {
        return await this.readInt16(true, "big");
    }
    ;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {Promise<number>}
     */
    async ushortbe() {
        return await this.readInt16(true, "big");
    }
    ;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {Promise<number>}
     */
    async uwordbe() {
        return await this.readInt16(true, "big");
    }
    ;
    /**
     * Read signed short in big endian.
     *
     * @returns {Promise<number>}
     */
    async int16be() {
        return await this.readInt16(false, "big");
    }
    ;
    /**
     * Read signed short in big endian.
     *
     * @returns {Promise<number>}
     */
    async shortbe() {
        return await this.readInt16(false, "big");
    }
    ;
    /**
     * Read signed short in big endian.
     *
     * @returns {Promise<number>}
     */
    async wordbe() {
        return await this.readInt16(false, "big");
    }
    ;
    //
    // #region half float read
    //
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    async halffloat() {
        return await this.readHalfFloat();
    }
    ;
    /**
     * Read half float
     *
     * @returns {Promise<number>}
     */
    async half() {
        return await this.readHalfFloat();
    }
    ;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    async halffloatbe() {
        return await this.readHalfFloat("big");
    }
    ;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    async halfbe() {
        return await this.readHalfFloat("big");
    }
    ;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    async halffloatle() {
        return await this.readHalfFloat("little");
    }
    ;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    async halfle() {
        return await this.readHalfFloat("little");
    }
    ;
    //
    // #region int read
    //
    /**
     * Read 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async int() {
        return await this.readInt32();
    }
    ;
    /**
     * Read 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async double() {
        return await this.readInt32();
    }
    ;
    /**
     * Read 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async int32() {
        return await this.readInt32();
    }
    ;
    /**
     * Read 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async long() {
        return await this.readInt32();
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async uint() {
        return await this.readInt32(true);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async udouble() {
        return await this.readInt32(true);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async uint32() {
        return await this.readInt32(true);
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async ulong() {
        return await this.readInt32(true);
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async intbe() {
        return await this.readInt32(false, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async doublebe() {
        return await this.readInt32(false, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async int32be() {
        return await this.readInt32(false, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async longbe() {
        return await this.readInt32(false, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async uintbe() {
        return await this.readInt32(true, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async udoublebe() {
        return await this.readInt32(true, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async uint32be() {
        return await this.readInt32(true, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async ulongbe() {
        return await this.readInt32(true, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async intle() {
        return await this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async doublele() {
        return await this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async int32le() {
        return await this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async longle() {
        return await this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async uintle() {
        return await this.readInt32(true, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async udoublele() {
        return await this.readInt32(true, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async uint32le() {
        return await this.readInt32(true, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async ulongle() {
        return await this.readInt32(true, "little");
    }
    ;
    //
    // #region float read
    //
    /**
     * Read float.
     *
     * @returns {Promise<number>}
     */
    async float() {
        return await this.readFloat();
    }
    ;
    /**
     * Read float.
     *
     * @returns {Promise<number>}
     */
    async floatbe() {
        return await this.readFloat("big");
    }
    ;
    /**
     * Read float.
     *
     * @returns {Promise<number>}
     */
    async floatle() {
        return await this.readFloat("little");
    }
    ;
    //
    // #region int64 reader
    //
    /**
     * Read signed 64 bit integer
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async int64() {
        return await this.readInt64();
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async bigint() {
        return await this.readInt64();
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async quad() {
        return await this.readInt64();
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uint64() {
        return await this.readInt64(true);
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async ubigint() {
        return await this.readInt64(true);
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uquad() {
        return await this.readInt64(true);
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async int64be() {
        return await this.readInt64(false, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async bigintbe() {
        return await this.readInt64(false, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async quadbe() {
        return await this.readInt64(false, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uint64be() {
        return await this.readInt64(true, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async ubigintbe() {
        return await this.readInt64(true, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uquadbe() {
        return await this.readInt64(true, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async int64le() {
        return await this.readInt64(false, "little");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async bigintle() {
        return await this.readInt64(false, "little");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async quadle() {
        return await this.readInt64(false, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uint64le() {
        return await this.readInt64(true, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async ubigintle() {
        return await this.readInt64(true, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uquadle() {
        return await this.readInt64(true, "little");
    }
    ;
    //
    // #region doublefloat reader
    //
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    async doublefloat() {
        return await this.readDoubleFloat();
    }
    ;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    async dfloat() {
        return await this.readDoubleFloat();
    }
    ;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    async dfloatbe() {
        return await this.readDoubleFloat("big");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    async doublefloatbe() {
        return await this.readDoubleFloat("big");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    async dfloatle() {
        return await this.readDoubleFloat("little");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    async doublefloatle() {
        return await this.readDoubleFloat("little");
    }
    ;
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
class BiWriterAsync extends BiBaseAsync {
    constructor(input, options = {}) {
        options.byteOffset = options.byteOffset ?? 0;
        options.bitOffset = options.bitOffset ?? 0;
        options.endianness = options.endianness ?? "little";
        options.strict = options.strict ?? false;
        options.growthIncrement = options.growthIncrement ?? 1048576;
        options.enforceBigInt = options.enforceBigInt ?? false;
        options.readOnly = options.readOnly ?? false;
        options.windowSize = options.windowSize = 4096;
        const { growthIncrement, } = options;
        if (input == undefined) {
            input = new Uint8Array(growthIncrement);
            console.warn(`BiWriter started without data. Creating Uint8Array with growthIncrement.`);
        }
        super(input, options);
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
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit1(value) {
        await this.bit(value, 1);
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit1le(value) {
        await this.bit(value, 1, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit1be(value) {
        await this.bit(value, 1, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit1(value) {
        await this.bit(value, 1, true);
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit1le(value) {
        await this.bit(value, 1, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 1 bit.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit1be(value) {
        await this.bit(value, 1, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit2(value) {
        await this.bit(value, 2);
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit2le(value) {
        await this.bit(value, 2, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit2be(value) {
        await this.bit(value, 2, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit2(value) {
        await this.bit(value, 2, true);
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit2le(value) {
        await this.bit(value, 2, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 2 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit2be(value) {
        await this.bit(value, 2, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit3(value) {
        await this.bit(value, 3);
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit3le(value) {
        await this.bit(value, 3, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit3be(value) {
        await this.bit(value, 3, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit3(value) {
        await this.bit(value, 3, true);
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit3le(value) {
        await this.bit(value, 3, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 3 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit3be(value) {
        await this.bit(value, 3, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit4(value) {
        await this.bit(value, 4);
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit4le(value) {
        await this.bit(value, 4, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit4be(value) {
        await this.bit(value, 4, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit4(value) {
        await this.bit(value, 4, true);
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit4le(value) {
        await this.bit(value, 4, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 4 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit4be(value) {
        await this.bit(value, 4, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit5(value) {
        await this.bit(value, 5);
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit5le(value) {
        await this.bit(value, 5, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit5be(value) {
        await this.bit(value, 5, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit5(value) {
        await this.bit(value, 5, true);
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit5le(value) {
        await this.bit(value, 5, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 5 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit5be(value) {
        await this.bit(value, 5, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit6(value) {
        await this.bit(value, 6);
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit6le(value) {
        await this.bit(value, 6, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit6be(value) {
        await this.bit(value, 6, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit6(value) {
        await this.bit(value, 6, true);
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit6le(value) {
        await this.bit(value, 6, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 6 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit6be(value) {
        await this.bit(value, 6, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit7(value) {
        await this.bit(value, 7);
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit7le(value) {
        await this.bit(value, 7, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit7be(value) {
        await this.bit(value, 7, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit7(value) {
        await this.bit(value, 7, true);
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit7le(value) {
        await this.bit(value, 7, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 7 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit7be(value) {
        await this.bit(value, 7, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit8(value) {
        await this.bit(value, 8);
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit8le(value) {
        await this.bit(value, 8, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit8be(value) {
        await this.bit(value, 8, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit8(value) {
        await this.bit(value, 8, true);
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit8le(value) {
        await this.bit(value, 8, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 8 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit8be(value) {
        await this.bit(value, 8, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit9(value) {
        await this.bit(value, 9);
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit9le(value) {
        await this.bit(value, 9, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit9be(value) {
        await this.bit(value, 9, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit9(value) {
        await this.bit(value, 9, true);
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit9le(value) {
        await this.bit(value, 9, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 9 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit9be(value) {
        await this.bit(value, 9, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit10(value) {
        await this.bit(value, 10);
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit10le(value) {
        await this.bit(value, 10, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit10be(value) {
        await this.bit(value, 10, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit10(value) {
        await this.bit(value, 10, true);
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit10le(value) {
        await this.bit(value, 10, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 10 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit10be(value) {
        await this.bit(value, 10, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit11(value) {
        await this.bit(value, 11);
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit11le(value) {
        await this.bit(value, 11, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit11be(value) {
        await this.bit(value, 11, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit11(value) {
        await this.bit(value, 11, true);
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit11le(value) {
        await this.bit(value, 11, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 11 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit11be(value) {
        await this.bit(value, 11, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit12(value) {
        await this.bit(value, 12);
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit12le(value) {
        await this.bit(value, 12, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit12be(value) {
        await this.bit(value, 12, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit12(value) {
        await this.bit(value, 12, true);
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit12le(value) {
        await this.bit(value, 12, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 12 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit12be(value) {
        await this.bit(value, 12, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit13(value) {
        await this.bit(value, 13);
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit13le(value) {
        await this.bit(value, 13, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit13be(value) {
        await this.bit(value, 13, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit13(value) {
        await this.bit(value, 13, true);
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit13le(value) {
        await this.bit(value, 13, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 13 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit13be(value) {
        await this.bit(value, 13, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit14(value) {
        await this.bit(value, 14);
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit14le(value) {
        await this.bit(value, 14, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit14be(value) {
        await this.bit(value, 14, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit14(value) {
        await this.bit(value, 14, true);
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit14le(value) {
        await this.bit(value, 14, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 14 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit14be(value) {
        await this.bit(value, 14, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit15(value) {
        await this.bit(value, 15);
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit15le(value) {
        await this.bit(value, 15, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit15be(value) {
        await this.bit(value, 15, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit15(value) {
        await this.bit(value, 15, true);
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit15le(value) {
        await this.bit(value, 15, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 15 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit15be(value) {
        await this.bit(value, 15, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit16(value) {
        await this.bit(value, 16);
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit16le(value) {
        await this.bit(value, 16, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit16be(value) {
        await this.bit(value, 16, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit16(value) {
        await this.bit(value, 16, true);
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit16le(value) {
        await this.bit(value, 16, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 16 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit16be(value) {
        await this.bit(value, 16, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit17(value) {
        await this.bit(value, 17);
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit17le(value) {
        await this.bit(value, 17, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit17be(value) {
        await this.bit(value, 17, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit17(value) {
        await this.bit(value, 17, true);
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit17le(value) {
        await this.bit(value, 17, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 17 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit17be(value) {
        await this.bit(value, 17, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit18(value) {
        await this.bit(value, 18);
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit18le(value) {
        await this.bit(value, 18, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit18be(value) {
        await this.bit(value, 18, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit18(value) {
        await this.bit(value, 18, true);
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit18le(value) {
        await this.bit(value, 18, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 18 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit18be(value) {
        await this.bit(value, 18, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit19(value) {
        await this.bit(value, 19);
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit19le(value) {
        await this.bit(value, 19, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit19be(value) {
        await this.bit(value, 19, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit19(value) {
        await this.bit(value, 19, true);
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit19le(value) {
        await this.bit(value, 19, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 19 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit19be(value) {
        await this.bit(value, 19, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit20(value) {
        await this.bit(value, 20);
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit20le(value) {
        await this.bit(value, 20, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit20be(value) {
        await this.bit(value, 20, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit20(value) {
        await this.bit(value, 20, true);
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit20le(value) {
        await this.bit(value, 20, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 20 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit20be(value) {
        await this.bit(value, 20, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit21(value) {
        await this.bit(value, 21);
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit21le(value) {
        await this.bit(value, 21, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit21be(value) {
        await this.bit(value, 21, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit21(value) {
        await this.bit(value, 21, true);
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit21le(value) {
        await this.bit(value, 21, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 21 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit21be(value) {
        await this.bit(value, 21, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit22(value) {
        await this.bit(value, 22);
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit22le(value) {
        await this.bit(value, 22, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit22be(value) {
        await this.bit(value, 22, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit22(value) {
        await this.bit(value, 22, true);
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit22le(value) {
        await this.bit(value, 22, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 22 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit22be(value) {
        await this.bit(value, 22, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit23(value) {
        await this.bit(value, 23);
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit23le(value) {
        await this.bit(value, 23, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit23be(value) {
        await this.bit(value, 23, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit23(value) {
        await this.bit(value, 23, true);
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit23le(value) {
        await this.bit(value, 23, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 23 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit23be(value) {
        await this.bit(value, 23, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit24(value) {
        await this.bit(value, 24);
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit24le(value) {
        await this.bit(value, 24, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit24be(value) {
        await this.bit(value, 24, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit24(value) {
        await this.bit(value, 24, true);
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit24le(value) {
        await this.bit(value, 24, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 24 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit24be(value) {
        await this.bit(value, 24, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit25(value) {
        await this.bit(value, 25);
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit25le(value) {
        await this.bit(value, 25, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit25be(value) {
        await this.bit(value, 25, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit25(value) {
        await this.bit(value, 25, true);
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit25le(value) {
        await this.bit(value, 25, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 25 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit25be(value) {
        await this.bit(value, 25, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit26(value) {
        await this.bit(value, 26);
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit26le(value) {
        await this.bit(value, 26, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit26be(value) {
        await this.bit(value, 26, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit26(value) {
        await this.bit(value, 26, true);
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit26le(value) {
        await this.bit(value, 26, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 26 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit26be(value) {
        await this.bit(value, 26, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit27(value) {
        await this.bit(value, 27);
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit27le(value) {
        await this.bit(value, 27, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit27be(value) {
        await this.bit(value, 27, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit27(value) {
        await this.bit(value, 27, true);
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit27le(value) {
        await this.bit(value, 27, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 27 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit27be(value) {
        await this.bit(value, 27, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit28(value) {
        await this.bit(value, 28);
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit28le(value) {
        await this.bit(value, 28, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit28be(value) {
        await this.bit(value, 28, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit28(value) {
        await this.bit(value, 28, true);
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit28le(value) {
        await this.bit(value, 28, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 28 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit28be(value) {
        await this.bit(value, 28, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit29(value) {
        await this.bit(value, 29);
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit29le(value) {
        await this.bit(value, 29, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit29be(value) {
        await this.bit(value, 29, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit29(value) {
        await this.bit(value, 29, true);
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit29le(value) {
        await this.bit(value, 29, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 29 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit29be(value) {
        await this.bit(value, 29, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit30(value) {
        await this.bit(value, 30);
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit30le(value) {
        await this.bit(value, 30, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit30be(value) {
        await this.bit(value, 30, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit30(value) {
        await this.bit(value, 30, true);
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit30le(value) {
        await this.bit(value, 30, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 30 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit30be(value) {
        await this.bit(value, 30, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit31(value) {
        await this.bit(value, 31);
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit31le(value) {
        await this.bit(value, 31, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit31be(value) {
        await this.bit(value, 31, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit31(value) {
        await this.bit(value, 31, true);
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit31le(value) {
        await this.bit(value, 31, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 31 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit31be(value) {
        await this.bit(value, 31, true, "big");
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit32(value) {
        await this.bit(value, 32);
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit32le(value) {
        await this.bit(value, 32, undefined, "little");
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async bit32be(value) {
        await this.bit(value, 32, undefined, "big");
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit32(value) {
        await this.bit(value, 32, true);
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit32le(value) {
        await this.bit(value, 32, true, "little");
    }
    ;
    /**
     * Bit field writer. Writes 32 bits.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     */
    async ubit32be(value) {
        await this.bit(value, 32, true, "big");
    }
    ;
    //
    // #region byte write
    //
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    async byte(value) {
        await this.writeByte(value);
    }
    ;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     */
    async int8(value) {
        await this.writeByte(value);
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    async uint8(value) {
        await this.writeByte(value, true);
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    async ubyte(value) {
        await this.writeByte(value, true);
    }
    ;
    //
    // #region short writes
    //
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    async int16(value) {
        await this.writeInt16(value);
    }
    ;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    async short(value) {
        await this.writeInt16(value);
    }
    ;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     */
    async word(value) {
        await this.writeInt16(value);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async uint16(value) {
        await this.writeInt16(value, true);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async ushort(value) {
        await this.writeInt16(value, true);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async uword(value) {
        await this.writeInt16(value, true);
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    async int16be(value) {
        await this.writeInt16(value, false, "big");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    async shortbe(value) {
        await this.writeInt16(value, false, "big");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    async wordbe(value) {
        await this.writeInt16(value, false, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async uint16be(value) {
        await this.writeInt16(value, true, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async ushortbe(value) {
        await this.writeInt16(value, true, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async uwordbe(value) {
        await this.writeInt16(value, true, "big");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    async int16le(value) {
        await this.writeInt16(value, false, "little");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    async shortle(value) {
        await this.writeInt16(value, false, "little");
    }
    ;
    /**
     * Write signed int16.
     *
     * @param {number} value - value as int
     */
    async wordle(value) {
        await this.writeInt16(value, false, "little");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async uint16le(value) {
        await this.writeInt16(value, true, "little");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async ushortle(value) {
        await this.writeInt16(value, true, "little");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async uwordle(value) {
        await this.writeInt16(value, true, "little");
    }
    ;
    //
    // #region half float
    //
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    async half(value) {
        await this.writeHalfFloat(value);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    async halffloat(value) {
        await this.writeHalfFloat(value);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    async halffloatbe(value) {
        await this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    async halfbe(value) {
        await this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    async halffloatle(value) {
        await this.writeHalfFloat(value, "little");
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    async halfle(value) {
        await this.writeHalfFloat(value, "little");
    }
    ;
    //
    // #region int32 write
    //
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    async int(value) {
        await this.writeInt32(value);
    }
    ;
    /**
    * Write int32.
    *
    * @param {number} value - value as int
    */
    async int32(value) {
        await this.writeInt32(value);
    }
    ;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    async double(value) {
        await this.writeInt32(value);
    }
    ;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     */
    async long(value) {
        await this.writeInt32(value);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async uint32(value) {
        await this.writeInt32(value, true);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async uint(value) {
        await this.writeInt32(value, true);
    }
    ;
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    async udouble(value) {
        await this.writeInt32(value, true);
    }
    ;
    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int
    */
    async ulong(value) {
        await this.writeInt32(value, true);
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async int32le(value) {
        await this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async intle(value) {
        await this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async doublele(value) {
        await this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async longle(value) {
        await this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async uint32le(value) {
        await this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async uintle(value) {
        await this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async udoublele(value) {
        await this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async ulongle(value) {
        await this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async intbe(value) {
        await this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async int32be(value) {
        await this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async doublebe(value) {
        await this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async longbe(value) {
        await this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async writeUInt32BE(value) {
        await this.writeInt32(value, true, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async uint32be(value) {
        await this.writeInt32(value, true, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async uintbe(value) {
        await this.writeInt32(value, true, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async udoublebe(value) {
        await this.writeInt32(value, true, "big");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async ulongbe(value) {
        await this.writeInt32(value, true, "big");
    }
    ;
    //
    // #region float write
    //
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    async float(value) {
        await this.writeFloat(value);
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    async floatle(value) {
        await this.writeFloat(value, "little");
    }
    ;
    /**
    * Write float.
    *
    * @param {number} value - value as int
    */
    async floatbe(value) {
        await this.writeFloat(value, "big");
    }
    ;
    //
    // #region int64 write
    //
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async int64(value) {
        await this.writeInt64(value);
    }
    ;
    /**
    * Write 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    async quad(value) {
        await this.writeInt64(value);
    }
    ;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async bigint(value) {
        await this.writeInt64(value);
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async uint64(value) {
        await this.writeInt64(value, true);
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async ubigint(value) {
        await this.writeInt64(value, true);
    }
    ;
    /**
    * Write unsigned 64 bit integer.
    *
    * @param {BigValue} value - value as int
    */
    async uquad(value) {
        await this.writeInt64(value, true);
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async int64le(value) {
        await this.writeInt64(value, false, "little");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async bigintle(value) {
        await this.writeInt64(value, false, "little");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async quadle(value) {
        await this.writeInt64(value, false, "little");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async uint64le(value) {
        await this.writeInt64(value, true, "little");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async ubigintle(value) {
        await this.writeInt64(value, true, "little");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async uquadle(value) {
        await this.writeInt64(value, true, "little");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async int64be(value) {
        await this.writeInt64(value, false, "big");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async bigintbe(value) {
        await this.writeInt64(value, false, "big");
    }
    ;
    /**
     * Write signed 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async quadbe(value) {
        await this.writeInt64(value, false, "big");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async uint64be(value) {
        await this.writeInt64(value, true, "big");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async ubigintbe(value) {
        await this.writeInt64(value, true, "big");
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async uquadbe(value) {
        await this.writeInt64(value, true, "big");
    }
    ;
    //
    // #region doublefloat
    //
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    async doublefloat(value) {
        await this.writeDoubleFloat(value);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    async dfloat(value) {
        await this.writeDoubleFloat(value);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    async dfloatbe(value) {
        await this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    async doublefloatbe(value) {
        await this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    async dfloatle(value) {
        await this.writeDoubleFloat(value, "little");
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    async doublefloatle(value) {
        await this.writeDoubleFloat(value, "little");
    }
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
    async latin1tring(string, length, terminateValue) {
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
        return await this.wpstring1(string, "little");
    }
    ;
    /**
    * Writes Wide Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async wpstring1le(string) {
        return await this.wpstring1(string, "big");
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

export { BiBase, BiReader, BiReaderAsync, BiReaderStream, BiWriter, BiWriterAsync, BiWriterStream, bireader, biwriter, hexdump };
//# sourceMappingURL=indexImport.js.map
