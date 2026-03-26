// #region Types

export type endian = "little" | "big";

export type BigValue = number | bigint;
// Define the conditional logic once
export type ReturnMapping<DataType> = DataType extends string | Buffer ? Buffer : Uint8Array;

export type ReturnBigValueMapping<alwaysBigInt> = alwaysBigInt extends true ? bigint : BigValue;

export type BiOptions<alwaysBigInt> = {
    /**
     * Byte offset to start, default is 0 
     */
    byteOffset?: number,
    /**
     *  Bit offset within the byte to start (0 - 7), default is 0 
     */
    bitOffset?: number,
    /**
     * Endianness ``big`` or ``little`` (default little)
     */
    endianness?: endian,
    /**
     * Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     */
    strict?: boolean,
    /**
     * Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     */
    growthIncrement?: number,
    /**
     * When reading a 64 bit value, the reader checks if the value is safe for a ``number`` type and convert it.
     * 
     * Set this to ``true`` if you wish for it to always stay a ``BigInt``.
     */
    enforceBigInt?: alwaysBigInt,
    /**
     * If you want to prevent write operations
     */
    readOnly?: boolean
    /**
     * For Async classes. Sets the chunk size to read on each wait cycle. Set to 0 for full file on first read.
     */
    windowSize?: number
};

export type stringOptions = {
    /**
     * for fixed length (in units NOT btyes), non-terminate value utf strings
     */
    length?: number,
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
    stringType?: "ascii" | "utf-8" | "utf-16" | "utf-32" | "pascal" | "wide-pascal" | "double-wide-pascal",
    /**
     * only with stringType: "utf"
     */
    terminateValue?: number,
    /**
     * for pascal strings. 1, 2 or 4 byte length read size
     */
    lengthReadSize?: 1 | 2 | 4,
    /**
     * for pascal strings. 1, 2 or 4 byte length write size
     */
    lengthWriteSize?: 1 | 2 | 4,
    /**
     * removes 0x00 characters
     */
    stripNull?: boolean,
    /**
     * TextEncoder accepted types 
     */
    encoding?: string,
    /**
     * for wide-pascal, utf-16, utf-32
     */
    endian?: "big" | "little",
};

export type hexdumpOptions = {
    /**
     * number of bytes to log, default ``192`` or end of data
     */
    length?: number,
    /**
     * byte to start dump (default ``0``)
     */
    startByte?: number,
    /**
     * Suppress unicode character preview for even columns.
     */
    suppressUnicode?: boolean,
    /**
     * Returns the hex dump string instead of logging it.
     */
    returnString?: boolean
};

// #region Checks

const testFallback = process && process.argv && process.argv.indexOf("FALLBACK=true") != -1;

export const canInt8 = testFallback ? false : "getUint8" in DataView.prototype && "getInt8" in DataView.prototype && "setUint8" in DataView.prototype && "setInt8" in DataView.prototype;

export const canInt16 = testFallback ? false : "getUint16" in DataView.prototype && "getInt16" in DataView.prototype && "setUint16" in DataView.prototype && "setInt16" in DataView.prototype;

export const canFloat16 = testFallback ? false : 'getFloat16' in DataView.prototype && 'setFloat16' in DataView.prototype;

export const canInt32 = testFallback ? false : 'getInt32' in DataView.prototype && 'getUint32' in DataView.prototype && 'setInt32' in DataView.prototype && 'setUint32' in DataView.prototype;

export const canFloat32 = testFallback ? false : "getFloat32" in DataView.prototype && "setFloat32" in DataView.prototype;

export const canBigInt64 = testFallback ? false : "getBigUint64" in DataView.prototype && "getBigInt64" in DataView.prototype && "setBigUint64" in DataView.prototype && "setBigInt64" in DataView.prototype;

export const canFloat64 = testFallback ? false : "getFloat64" in DataView.prototype && "setFloat64" in DataView.prototype;

export const hasBigInt = typeof BigInt === 'function';

const FLOAT32_MAX = 3.4028234663852886e+38;

const FLOAT32_MIN = -FLOAT32_MAX;

const FLOAT64_MAX = Number.MAX_VALUE;

const FLOAT64_MIN = -FLOAT64_MAX;

const MIN_SAFE_BIGINT = hasBigInt ? BigInt(Number.MIN_SAFE_INTEGER) : 0;

const MAX_SAFE_BIGINT = hasBigInt ? BigInt(Number.MAX_SAFE_INTEGER) : 0;

// #region Helpers

/**
 * If value can be convert to number
 */
export function isSafeInt64(big: bigint): boolean {
    return hasBigInt ? (big >= MIN_SAFE_BIGINT && big <= MAX_SAFE_BIGINT) : false;
};

export function isBuffer(obj: any): obj is Buffer {
    return (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj));
};

export function isUint8Array(obj: Uint8Array | Buffer): obj is Uint8Array {
    if (typeof Buffer === 'undefined') {
        return true;
    }

    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj)) {
        return false;
    }

    return true;
};

export function isBufferOrUint8Array(obj: any): obj is Buffer | Uint8Array {
    return obj instanceof Uint8Array || isBuffer(obj);
};

export function normalizeBitOffset(bit: number): number {
    return ((bit % 8) + 8) % 8;
};

/**
 * Convert bigint safely to number
 */
function bigintToNumber(value: bigint) {
    const num = Number(value);

    if (!Number.isFinite(num)) {
        throw new RangeError("BigInt too large to convert safely");
    }

    return num;
};

/**
 * Clamp value to IEEE-754 float32 range
 */
export function clampFloat32(input: BigValue) {
    let value = hasBigInt && typeof input === "bigint" ? bigintToNumber(input) : input as number;

    if (!Number.isFinite(value)) {
        return value;
    }

    if (value > FLOAT32_MAX) {
        return FLOAT32_MAX;
    }

    if (value < FLOAT32_MIN) {
        return FLOAT32_MIN;
    }

    return Math.fround(value);
};

/**
 * Clamp value to IEEE-754 float64 range
 */
export function clampFloat64(input: BigValue) {
    let value = hasBigInt && typeof input === "bigint" ? bigintToNumber(input) : input as number;

    if (!Number.isFinite(value)) {
        return value;
    }

    if (value > FLOAT64_MAX) {
        return FLOAT64_MAX;
    }

    if (value < FLOAT64_MIN) {
        return FLOAT64_MIN;
    }

    return value;
};

export function floatSafe<DataType extends number | bigint>(
    value: DataType,
    bits: number): DataType {
    var min = 0, max = 0;

    switch (bits) {
        case 16:
            min = 5.96e-08;

            max = 65504;

            break;
        case 32:
            return clampFloat32(value) as DataType;
        case 64:
            return clampFloat64(value) as DataType;
        default:
            break;
    }

    if (value < min) {
        if (typeof value == "bigint") {
            return BigInt(min) as DataType;
        } else {
            return min as DataType;
        }
    } else if (value > max) {
        if (typeof value == "bigint") {
            return BigInt(max) as DataType;
        } else {
            return max as DataType;
        }
    } else {
        return value;
    }
};

function safeFromCharCode(arr: Array<number>) {
    const chunk = 0x8000;

    let result = "";

    for (let i = 0; i < arr.length; i += chunk) {
        result += String.fromCharCode(...arr.slice(i, i + chunk));
    }

    return result;
};

function safeFromCodePoint(arr: Array<number>) {
    const chunk = 0x8000;

    let result = "";

    for (let i = 0; i < arr.length; i += chunk) {
        result += String.fromCodePoint(...arr.slice(i, i + chunk));
    }

    return result;
};

export function textEncode(string: string, bytesPerChar = 1) {
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
};

/**
 * Converts the number to a safe value
 */
export function numberSafe<DataType extends number | bigint>(
    value: DataType,
    bits: number,
    unsigned: boolean): DataType {
    var min: number, max: number;

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
                    } else if (bits > 54 && hasBigInt) {
                        max = Math.pow(2, bits) - 1;
                    } else {
                        throw new RangeError("System can't have BigInt support to handle large numbers.");
                    }
                }
                break;
        }

        min = 0;
    } else {
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
                    } else if (bits > 55 && hasBigInt) {
                        max = Math.pow(2, bits - 1) - 1;
                    } else {
                        throw new RangeError("System can't have BigInt support to handle large numbers.");
                    }
                }
                break;
        }

        min = -max - 1;
    }

    if (value < min) {
        if (typeof value == "bigint") {
            return BigInt(min) as DataType;
        } else {
            return min as DataType;
        }
    } else if (value > max) {
        if (typeof value == "bigint") {
            return BigInt(max) as DataType;
        } else {
            return max as DataType;
        }
    } else {
        return value;
    }
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
export function hexdump(
    src: Uint8Array | Buffer,
    options: hexdumpOptions = {}): void | string {
    if (!(src instanceof Uint8Array || isBuffer(src))) {
        throw new Error("Write data must be Uint8Array or Buffer.");
    }

    const ctx = {
        data: src,
        size: src.length,
        offset: options && options.startByte || 0,
        errorDump: true
    };

    var length: any = options && options.length;

    var startByte: any = options && options.startByte;

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
};

export function _hexDump(
    data: Buffer | Uint8Array,
    options: hexdumpOptions = {},
    start: number,
    end: number): string {
    function _hexCheck(byte: number, bits: number,): number {
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

    const suppressUnicode: any = options && options.suppressUnicode || false;

    const rows: Array<string> = [];

    var header = "   0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  ";

    const ending = "0123456789ABCDEF";

    var addr: string = "";

    for (let i = start; i < end; i += 16) {
        addr = i.toString(16).padStart(5, '0');

        var row = <unknown>data.subarray(i, i + 16) as number[] || [];

        var hex = Array.from(row, (byte) => byte.toString(16).padStart(2, '0')).join(' ');

        rows.push(`${addr}  ${hex.padEnd(47)}  `);
    }

    let result = '';

    let makeWide: boolean = false;

    let i = start;

    while (i < end) {
        const byte = data[i] as number;

        if (byte < 32 || byte == 127) {
            result += '.';
        } else if (byte < 127) {
            // Valid UTF-8 start byte or single-byte character
            // Convert the byte to a character and add it to the result
            result += String.fromCharCode(byte);
        } else if (suppressUnicode) {
            result += '.';
        } else if (_hexCheck(byte, 1) == 0) {
            //Byte 1
            result += String.fromCharCode(byte);
        } else if (_hexCheck(byte, 3) == 6) {
            //Byte 2
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1] as number;

                if (_hexCheck(byte2, 2) == 2) {
                    const charCode = ((byte & 0x1f) << 6) | (byte2 & 0x3f);

                    i++;

                    makeWide = true;

                    const read = " " + String.fromCharCode(charCode);

                    result += read;
                } else {
                    result += ".";
                }
            } else {
                result += ".";
            }
        } else if (_hexCheck(byte, 4) == 14) {
            //Byte 3
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1] as number;

                if (_hexCheck(byte2, 2) == 2) {
                    if (i + 2 <= end) {
                        //check third byte
                        const byte3 = data[i + 2] as number;

                        if (_hexCheck(byte3, 2) == 2) {
                            const charCode =
                                ((byte & 0x0f) << 12) |
                                ((byte2 & 0x3f) << 6) |
                                (byte3 & 0x3f);

                            i += 2;

                            makeWide = true;

                            const read = "  " + String.fromCharCode(charCode);

                            result += read;
                        } else {
                            i++;

                            result += " .";
                        }
                    } else {
                        i++;

                        result += " .";
                    }
                } else {
                    result += ".";
                }
            } else {
                result += ".";
            }
        } else if (_hexCheck(byte, 5) == 28) {
            //Byte 4
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1] as number;

                if (_hexCheck(byte2, 2) == 2) {
                    if (i + 2 <= end) {
                        //check third byte
                        const byte3 = data[i + 2] as number;

                        if (_hexCheck(byte3, 2) == 2) {
                            if (i + 3 <= end) {
                                //check fourth byte
                                const byte4 = data[i + 2] as number;

                                if (_hexCheck(byte4, 2) == 2) {
                                    const charCode = (((byte4 & 0xFF) << 24) | ((byte3 & 0xFF) << 16) | ((byte2 & 0xFF) << 8) | (byte & 0xFF));

                                    i += 3;

                                    makeWide = true;

                                    const read = "   " + String.fromCharCode(charCode);

                                    result += read;
                                } else {
                                    i += 2;

                                    result += "  .";
                                }
                            } else {
                                i += 2;

                                result += "  .";
                            }
                        } else {
                            i++;

                            result += " .";
                        }
                    } else {
                        i++;

                        result += " .";
                    }
                } else {
                    result += ".";
                }
            } else {
                result += ".";
            }
        } else {
            // Invalid UTF-8 byte, add a period to the result
            result += '.';
        }

        i++;
    }

    const chunks = result.match(new RegExp(`.{1,${16}}`, 'g'));

    chunks?.forEach((self, i) => {
        rows[i] = rows[i] + (makeWide ? "|" + self + "|" : self);
    })

    header = "".padStart(addr.length) + header + (makeWide ? "" : ending);

    rows.unshift(header);

    if (makeWide) {
        rows.push("*Removed character byte header on unicode detection");
    }

    if (options && options.returnString) {
        return rows.join("\n");
    } else {
        const retVal = rows.join("\n");

        console.log(retVal);

        return retVal;
    }
};

// #region Math

export function _AND(
    data: Uint8Array | Buffer,
    start: number,
    end: number,
    andKey: number | string | Uint8Array | Buffer) {
    if (typeof andKey == "string") {
        andKey = Uint8Array.from(Array.from(andKey).map(letter => letter.charCodeAt(0)));
    }

    if (isBufferOrUint8Array(andKey) || typeof andKey == "number") {
        var index = -1;

        for (let i = start; i < end; i++) {
            if (typeof andKey == "number") {
                data[i] = data[i] & (andKey & 0xff);
            } else {
                if (index != andKey.length - 1) {
                    index++;
                } else {
                    index = 0;
                }

                data[i] = data[i] & andKey[index];
            }
        }

        return { offset: end, bitoffset: 0 };
    } else {
        throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
    }
};

export function _OR(
    data: Uint8Array | Buffer,
    start: number,
    end: number,
    orKey: number | string | Uint8Array | Buffer) {
    if (typeof orKey == "string") {
        orKey = Uint8Array.from(Array.from(orKey).map(letter => letter.charCodeAt(0)));
    }

    if (isBufferOrUint8Array(orKey) || typeof orKey == "number") {
        var index = -1;

        for (let i = start; i < end; i++) {
            if (typeof orKey == "number") {
                data[i] = data[i] | (orKey & 0xff);
            } else {
                if (index != orKey.length - 1) {
                    index++;
                } else {
                    index = 0;
                }

                data[i] = data[i] | orKey[index];
            }
        }

        return { offset: end, bitoffset: 0 };
    } else {
        throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
    }
};

export function _XOR(
    data: Uint8Array | Buffer,
    start: number,
    end: number,
    xorKey: number | string | Uint8Array | Buffer) {
    if (typeof xorKey == "string") {
        xorKey = Uint8Array.from(Array.from(xorKey).map(letter => letter.charCodeAt(0)));
    }

    if (isBufferOrUint8Array(xorKey) || typeof xorKey == "number") {
        let index = -1;

        for (let i = start; i < end; i++) {
            if (typeof xorKey == "number") {
                data[i] = data[i] ^ (xorKey & 0xff);
            } else {
                if (index != xorKey.length - 1) {
                    index++;
                } else {
                    index = 0;
                }

                data[i] = data[i] ^ xorKey[index];
            }
        }

        return { offset: end, bitoffset: 0 };
    } else {
        throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
    }
};

export function _LSHIFT(
    data: Uint8Array | Buffer,
    start: number,
    end: number,
    shiftKey: number | string | Uint8Array | Buffer) {
    if (typeof shiftKey == "string") {
        shiftKey = Uint8Array.from(Array.from(shiftKey).map(letter => letter.charCodeAt(0)));
    }

    if (isBufferOrUint8Array(shiftKey) || typeof shiftKey == "number") {
        var index = -1;

        for (let i = start; i < end; i++) {
            if (typeof shiftKey == "number") {
                data[i] = data[i] << shiftKey;
            } else {
                if (index != shiftKey.length - 1) {
                    index++;
                } else {
                    index = 0;
                }

                data[i] = data[i] << shiftKey[index];
            }
        }

        return { offset: end, bitoffset: 0 };
    } else {
        throw new Error("Left Shift key must be a byte value, string, Uint8Array or Buffer");
    }
};

export function _RSHIFT(
    data: Uint8Array | Buffer,
    start: number,
    end: number,
    shiftKey: number | string | Uint8Array | Buffer) {
    if (typeof shiftKey == "string") {
        shiftKey = Uint8Array.from(Array.from(shiftKey).map(letter => letter.charCodeAt(0)));
    }

    if (isBufferOrUint8Array(shiftKey) || typeof shiftKey == "number") {
        var index = -1;

        for (let i = start; i < end; i++) {
            if (typeof shiftKey == "number") {
                data[i] = data[i] >> shiftKey;
            } else {
                if (index != shiftKey.length - 1) {
                    index++;
                } else {
                    index = 0;
                }

                data[i] = data[i] >> shiftKey[index];
            }
        }

        return { offset: end, bitoffset: 0 };
    } else {
        throw new Error("Right Shift key must be a byte value, string, Uint8Array or Buffer");
    }
};

export function _ADD(
    data: Uint8Array | Buffer,
    start: number,
    end: number,
    addKey: number | string | Uint8Array | Buffer) {
    if (typeof addKey == "string") {
        addKey = Uint8Array.from(Array.from(addKey).map(letter => letter.charCodeAt(0)));
    }

    if (isBufferOrUint8Array(addKey) || typeof addKey == "number") {
        var index = -1;

        for (let i = start; i < end; i++) {
            if (typeof addKey == "number") {
                data[i] = data[i] + addKey;
            } else {
                if (index != addKey.length - 1) {
                    index = index + 1;
                } else {
                    index = 0;
                }

                data[i] = data[i] + addKey[index];
            }
        }

        return { offset: end, bitoffset: 0 };
    } else {
        throw new Error("ADD key must be a byte value, string, Uint8Array or Buffer");
    }
}

export function _NOT(
    data: Uint8Array | Buffer,
    start: number,
    end: number) {
    for (let i = start; i < end; i++) {
        data[i] = ~data[i];
    }

    return { offset: end, bitoffset: 0 };
};

// #region Read / Writes

/**
 * bit read function
 */
export function _rbit(
    data: Uint8Array | Buffer,
    bits: number,
    offset: number,
    endian: "little" | "big",
    unsigned: boolean) {
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
        } else {
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
};

/**
 * Write bits
 */
export function _wbit(
    data: Uint8Array | Buffer,
    value: number,
    bits: number,
    offsetBit: number,
    endian: "little" | "big",
    unsigned: boolean) {
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
            let mask = ~(~0 << written);

            let writeBits = (value >> (bits - i - written)) & mask;

            var destShift = 8 - bitOffset - written;

            let destMask = ~(mask << destShift);

            data[byteOffset] = (data[byteOffset] & destMask) | (writeBits << destShift);
        } else {
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
};

export function _rbyte(
    data: Uint8Array | Buffer,
    offset: number,
    unsigned: boolean) {
    const value = data[offset];

    if (unsigned == true) {
        return value & 0xFF;
    } else {
        return value > 127 ? value - 256 : value;
    }
};

export function _wbyte(
    data: Uint8Array | Buffer,
    value: number,
    offset: number,
    unsigned: boolean) {
    data[offset] = unsigned ? value & 0xFF : value;

    return;
};

export function _rint16(
    data: Uint8Array | Buffer,
    offset: number,
    endian: "little" | "big",
    unsigned: boolean) {
    var value: number;

    if (endian == "little") {
        value = ((data[offset + 1] & 0xFFFF) << 8) | (data[offset] & 0xFFFF);
    } else {
        value = ((data[offset] & 0xFFFF) << 8) | (data[offset + 1] & 0xFFFF);
    }

    if (!!unsigned == false) {
        const signBit = 1 << (16 - 1);

        if (value & signBit) {
            value -= (1 << 16);
        }
    }

    return value;
};

export function _wint16(
    data: Uint8Array | Buffer,
    value: number,
    offset: number,
    endian: "little" | "big",
    unsigned: boolean = false) {

    if (endian == "little") {
        data[offset] = unsigned == false ? value : value & 0xff;

        data[offset + 1] = unsigned == false ? (value >> 8) : (value >> 8) & 0xff;
    } else {
        data[offset] = unsigned == false ? (value >> 8) : (value >> 8) & 0xff;

        data[offset + 1] = unsigned == false ? value : value & 0xff;
    }

    return;
};

export function _rhalffloat(
    data: Uint8Array | Buffer,
    offset: number,
    endian: "little" | "big") {
    const value = _rint16(data, offset, endian, true);

    const sign = (value & 0x8000) >> 15;

    const exponent = (value & 0x7C00) >> 10;

    const fraction = value & 0x03FF;

    var floatValue: number;

    if (exponent === 0) {
        if (fraction === 0) {
            floatValue = (sign === 0) ? 0 : -0; // +/-0
        } else {
            // Denormalized number
            floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
        }
    } else if (exponent === 0x1F) {
        if (fraction === 0) {
            floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        } else {
            floatValue = Number.NaN;
        }
    } else {
        // Normalized number
        floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
    }

    return floatValue;
};

const float32Array = new Float32Array(1);

const float32AsInts = new Uint32Array(float32Array.buffer);

export function _whalffloat(
    data: Uint8Array | Buffer,
    value: number,
    offset: number,
    endian: "little" | "big") {
    float32Array[0] = value;

    const x = float32AsInts[0];

    const sign = (x >> 31) & 0x1;

    var exponent = (x >> 23) & 0xff;

    var mantissa = x & 0x7fffff;

    var halfFloatBits: number;

    if (exponent === 0xff) {
        // NaN or Infinity
        halfFloatBits = (sign << 15) | (0x1f << 10) | (mantissa ? 0x200 : 0);
    } else if (exponent > 142) {
        // Overflow → Infinity
        halfFloatBits = (sign << 15) | (0x1f << 10);
    } else if (exponent < 113) {
        // Subnormal or zero
        if (exponent < 103) {
            halfFloatBits = sign << 15;
        } else {
            mantissa |= 0x800000;

            const shift = 125 - exponent;

            mantissa = mantissa >> shift;

            halfFloatBits = (sign << 15) | (mantissa >> 13);
        }
    } else {
        // Normalized
        exponent = exponent - 112;

        mantissa = mantissa >> 13;

        halfFloatBits = (sign << 15) | (exponent << 10) | mantissa;
    }

    if (endian == "little") {
        data[offset] = halfFloatBits & 0xFF;

        data[offset + 1] = (halfFloatBits >> 8) & 0xFF;
    } else {
        data[offset] = (halfFloatBits >> 8) & 0xFF;

        data[offset + 1] = halfFloatBits & 0xFF;
    }

    return;
};

export function _rint32(
    data: Uint8Array | Buffer,
    offset: number,
    endian: "little" | "big",
    unsigned: boolean) {
    var value: number;

    if (endian == "little") {
        value = ((data[offset + 3] & 0xFF) << 24) |
            ((data[offset + 2] & 0xFF) << 16) |
            ((data[offset + 1] & 0xFF) << 8) |
            (data[offset] & 0xFF);
    } else {
        value = ((data[offset] & 0xFF) << 24) |
            ((data[offset + 1] & 0xFF) << 16) |
            ((data[offset + 2] & 0xFF) << 8) |
            (data[offset + 3] & 0xFF);
    }

    if (unsigned) {
        return value >>> 0;
    }

    return value;
};

export function _wint32(
    data: Uint8Array | Buffer,
    value: number,
    offset: number,
    endian: "little" | "big",
    unsigned: boolean = false) {

    if (endian == "little") {
        data[offset] = unsigned == false ? value : value & 0xFF;

        data[offset + 1] = unsigned == false ? (value >> 8) : (value >> 8) & 0xFF;

        data[offset + 2] = unsigned == false ? (value >> 16) : (value >> 16) & 0xFF;

        data[offset + 3] = unsigned == false ? (value >> 24) : (value >> 24) & 0xFF;
    } else {
        data[offset] = unsigned == false ? (value >> 24) : (value >> 24) & 0xFF;

        data[offset + 1] = unsigned == false ? (value >> 16) : (value >> 16) & 0xFF;

        data[offset + 2] = unsigned == false ? (value >> 8) : (value >> 8) & 0xFF;

        data[offset + 3] = unsigned == false ? value : value & 0xFF;
    }

    return;
};

export function _rfloat(
    data: Uint8Array | Buffer,
    offset: number,
    endian: "little" | "big") {
    const uint32Value = _rint32(data, offset, endian, true);

    const isNegative = (uint32Value & 0x80000000) !== 0 ? 1 : 0;
    // Extract the exponent and fraction parts
    const exponent = (uint32Value >> 23) & 0xFF;

    const fraction = uint32Value & 0x7FFFFF;
    // Calculate the float value
    var floatValue: number;

    if (exponent === 0) {
        // Denormalized number (exponent is 0)
        floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
    } else if (exponent === 0xFF) {
        // Infinity or NaN (exponent is 255)
        floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
    } else {
        // Normalized number
        floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
    }

    return floatValue;
};

export function _wfloat(
    data: Uint8Array | Buffer,
    value: number,
    offset: number,
    endian: "little" | "big") {
    float32Array[0] = value;

    _wint32(data, float32AsInts[0], offset, endian, true);

    return;
};

export function _rint64(
    data: Uint8Array | Buffer,
    offset: number,
    endian: "little" | "big",
    unsigned: boolean) {
    var value = BigInt(0);

    for (let i = 0; i < 8; i++) {
        if (endian == "little") {
            value = value | BigInt((data[offset + i] & 0xFF)) << BigInt(8 * i);
        } else {
            value = (value << BigInt(8)) | BigInt((data[offset + i] & 0xFF));
        }
    }

    if (unsigned == false) {
        if (value & (BigInt(1) << BigInt(63))) {
            value -= BigInt(1) << BigInt(64);
        }
    }

    return value;
};

export function _wint64(
    data: Uint8Array | Buffer,
    value: number | bigint,
    offset: number,
    endian: "little" | "big",
    unsigned: boolean) {
    const bigIntArray = unsigned ? new BigUint64Array(1) : new BigInt64Array(1);

    bigIntArray[0] = BigInt(value);
    // Use two 32-bit views to write the Int64
    const int32Array = unsigned ? new Uint32Array(bigIntArray.buffer)  : new Int32Array(bigIntArray.buffer) ;

    for (let i = 0; i < 2; i++) {
        _wint32(data, int32Array[i], offset + (i * 4), endian, unsigned);
    }

    return;
};

export function _rdfloat(
    data: Uint8Array | Buffer,
    offset: number,
    endian: "little" | "big") {
    var uint64Value = _rint64(data, offset, endian, true);

    const sign = (BigInt(uint64Value) & BigInt("9223372036854775808")) >> BigInt(63);

    const exponent = Number((BigInt(uint64Value) & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;

    const fraction = Number(BigInt(uint64Value) & BigInt("4503599627370495")) / Math.pow(2, 52);

    var floatValue: number;

    if (exponent == -1023) {
        if (fraction == 0) {
            floatValue = (sign == BigInt(0)) ? 0 : -0; // +/-0
        } else {
            // Denormalized number
            floatValue = (sign == BigInt(0) ? 1 : -1) * Math.pow(2, -1022) * fraction;
        }
    } else if (exponent == 1024) {
        if (fraction == 0) {
            floatValue = (sign == BigInt(0)) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        } else {
            floatValue = Number.NaN;
        }
    } else {
        // Normalized number
        floatValue = (sign == BigInt(0) ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
    }

    return floatValue;
};

export function _wdfloat(
    data: Uint8Array | Buffer,
    value: number,
    offset: number,
    endian: "little" | "big") {
    const intArray = new Int32Array(2);

    const floatArray = new Float64Array(intArray.buffer);

    floatArray[0] = value;

    const bytes = new Uint8Array(intArray.buffer);

    for (let i = 0; i < 8; i++) {
        if (endian == "little") {
            data[offset + i] = bytes[i];
        } else {
            data[offset + (7 - i)] = bytes[i];
        }
    }

    return;
};

export function _rstring(
    stringType: 'ascii' | 'utf-8' | 'utf-16' | 'utf-32' | 'pascal' | 'wide-pascal' | "double-wide-pascal",
    lengthReadSize: number,
    readLengthinBytes: number,
    terminateValue: number,
    stripNull: boolean,
    encoding: string,
    endian: "little" | "big",
    readUByte: () => number,
    readUInt16: (endian: "little" | "big") => number,
    readUInt32: (endian: "little" | "big") => number) {
    const encodedBytes: Array<number> = [];

    if (stringType === 'pascal' || stringType === 'wide-pascal' || stringType === "double-wide-pascal") {
        terminateValue = undefined;

        if (lengthReadSize == 1) {
            readLengthinBytes = readUByte();
        } else if (lengthReadSize == 2) {
            readLengthinBytes = readUInt16(endian);
        } else if (lengthReadSize == 4) {
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
        default:
            break;
    }

    for (let i = 0; i < readLengthinBytes; i++) {
        var read = terminateValue;

        switch (readSize) {
            case 1:
                read = readUByte();

                break;
            case 2:
                read = readUInt16(endian); i++;

                break;
            case 4:
                read = readUInt32(endian); i++; i++; i++;

                if (stringType == 'utf-32' && read > 0x10FFFF) {
                    read = terminateValue;
                }

                break;
            default:
                break;
        }

        if (read == terminateValue) {
            break;
        } else {
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
            } catch (err) {
                throw new Error(`Unsupported encoding: ${encoding}`);
            }
    }
};

export async function _rstringAsync(
    stringType: 'ascii' | 'utf-8' | 'utf-16' | 'utf-32' | 'pascal' | 'wide-pascal' | "double-wide-pascal",
    lengthReadSize: number,
    readLengthinBytes: number,
    terminateValue: number,
    stripNull: boolean,
    encoding: string,
    endian: "little" | "big",
    readUByte: () => Promise<number>,
    readUInt16: (endian: "little" | "big") => Promise<number>,
    readUInt32: (endian: "little" | "big") => Promise<number>) {
    const encodedBytes: Array<number> = [];

    if (stringType === 'pascal' || stringType === 'wide-pascal' || stringType === "double-wide-pascal") {
        terminateValue = undefined;

        if (lengthReadSize == 1) {
            readLengthinBytes = await readUByte();
        } else if (lengthReadSize == 2) {
            readLengthinBytes = await readUInt16(endian);
        } else if (lengthReadSize == 4) {
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
        default:
            break;
    }

    for (let i = 0; i < readLengthinBytes; i++) {
        var read = terminateValue;

        switch (readSize) {
            case 1:
                read = await readUByte();

                break;
            case 2:
                read = await readUInt16(endian); i++;

                break;
            case 4:
                read = await readUInt32(endian); i++; i++; i++;

                if (stringType == 'utf-32' && read > 0x10FFFF) {
                    read = terminateValue;
                }

                break;
            default:
                break;
        }

        if (read == terminateValue) {
            break;
        } else {
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
            } catch (err) {
                throw new Error(`Unsupported encoding: ${encoding}`);
            }
    }
};

export function _wstring(
    encodedString: Uint8Array,
    stringType: 'ascii' | 'utf-8' | 'utf-16' | 'utf-32' | 'pascal' | 'wide-pascal' | "double-wide-pascal",
    endian: "little" | "big",
    terminateValue: number,
    lengthWriteSize: number,
    writeUByte: (number: number) => void,
    writeUInt16: (number: number, endian: "little" | "big") => void,
    writeUInt32: (number: number, endian: "little" | "big") => void) {
    if (stringType == "pascal" ||
        stringType == 'wide-pascal' ||
        stringType == 'double-wide-pascal'
    ) {
        if (lengthWriteSize == 1) {
            writeUByte(encodedString.byteLength);
        } else if (lengthWriteSize == 2) {
            writeUInt16(encodedString.byteLength, endian);
        } else if (lengthWriteSize == 4) {
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
                writeUInt16(view.getUint16(i, true), endian); i++;
                break;
            case 'utf-32':
            case 'double-wide-pascal':
                writeUInt32(view.getUint32(i, true), endian); i++; i++; i++;
                break;
            default:
                break;
        }
    }

    if (stringType == "ascii" || stringType == 'utf-8') {
        writeUByte(terminateValue);
    } else if (stringType == 'utf-16') {
        writeUInt16(terminateValue, endian);
    } else if (stringType == 'utf-32') {
        writeUInt32(terminateValue, endian);
    }
};

export async function _wstringAsync(
    encodedString: Uint8Array,
    stringType: 'ascii' | 'utf-8' | 'utf-16' | 'utf-32' | 'pascal' | 'wide-pascal' | "double-wide-pascal",
    endian: "little" | "big",
    terminateValue: number,
    lengthWriteSize: number,
    writeUByte: (number: number) => Promise<void>,
    writeUInt16: (number: number, endian: "little" | "big") => Promise<void>,
    writeUInt32: (number: number, endian: "little" | "big") => Promise<void>) {
    if (stringType == "pascal" ||
        stringType == 'wide-pascal' ||
        stringType == 'double-wide-pascal'
    ) {
        if (lengthWriteSize == 1) {
            await writeUByte(encodedString.byteLength);
        } else if (lengthWriteSize == 2) {
            await writeUInt16(encodedString.byteLength, endian);
        } else if (lengthWriteSize == 4) {
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
                await writeUInt16(view.getUint16(i, true), endian); i++;
                break;
            case 'utf-32':
            case 'double-wide-pascal':
                await writeUInt32(view.getUint32(i, true), endian); i++; i++; i++;
                break;
            default:
                break;
        }
    }

    if (stringType == "ascii" || stringType == 'utf-8') {
        await writeUByte(terminateValue);
    } else if (stringType == 'utf-16') {
        await writeUInt16(terminateValue, endian);
    } else if (stringType == 'utf-32') {
        await writeUInt32(terminateValue, endian);
    }
};