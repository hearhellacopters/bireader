// #region Types

export type endian = "little" | "big";

export type BigValue = number | bigint;

export type ReturnBigValueMapping<alwaysBigInt> = alwaysBigInt extends true ? bigint : BigValue;

/**
 * Maps a reader/writer's input source type to the type its sub-array methods
 * ({@link extract}, `subarray`, `fill`, `delete`, `readUBytes`, `get`, ...) return,
 * so the output echoes the input: a `Buffer` in - or a file path, read as a `Buffer` -
 * yields `Buffer`s; a `Uint8Array` yields plain `Uint8Array`s. Wrapped in tuples so a
 * union input type does not distribute (it falls back to `Uint8Array`).
 */
export type BytesOutput<DataType> =
    [DataType] extends [string] ? Buffer :
    [DataType] extends [Buffer] ? Buffer :
    Uint8Array;

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

// #region Helpers

export function isBuffer(obj: any): obj is Buffer {
    return (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj));
};

export function isBufferOrUint8Array(obj: any): obj is Buffer | Uint8Array {
    return obj instanceof Uint8Array || isBuffer(obj);
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
                    utf32Buffer[i] = string.codePointAt(i) ?? 0;
                }

                return new Uint8Array(utf32Buffer.buffer);
            }
        default:
            return new Uint8Array(0);
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

        var row = <unknown>data.subarray(i, i + 16) as Array<number> || [];

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
                                const byte4 = data[i + 3] as number;

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
    readUInt32: (endian: "little" | "big") => number,
    // Fixed-length reads consume the full `readLengthinBytes` even when a terminator
    // appears early: the terminator ends the string *content*, not the field. Terminated
    // reads (no fixed length) stop consuming at the terminator, as before.
    fixedLength: boolean = false) {
    const encodedBytes: Array<number> = [];

    if (stringType === 'pascal' || stringType === 'wide-pascal' || stringType === "double-wide-pascal") {
        // NaN disables the terminator check (read == NaN is always false); pascal is length-based.
        terminateValue = NaN;

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

    // `terminated` freezes the string content at the first terminator; the loop keeps
    // running for fixed-length reads so the caller's cursor advances the full field.
    let terminated = false;

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
            terminated = true;

            // Terminated (non-fixed) reads stop here; fixed-length reads keep
            // consuming the remaining bytes of the field without appending them.
            if (!fixedLength) {
                break;
            }

            continue;
        }

        if (!terminated && !(stripNull == true && read == 0)) {
            encodedBytes.push(read);
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
    terminateValue: number | undefined,
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

    if(terminateValue != undefined){
        if (stringType == "ascii" || stringType == 'utf-8') {
            writeUByte(terminateValue);
        } else if (stringType == 'utf-16') {
            writeUInt16(terminateValue, endian);
        } else if (stringType == 'utf-32') {
            writeUInt32(terminateValue, endian);
        }
    }
};
