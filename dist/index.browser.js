const canInt8 = "getUint8" in DataView.prototype && "getInt8" in DataView.prototype && "setUint8" in DataView.prototype && "setInt8" in DataView.prototype;
const canInt16 = "getUint16" in DataView.prototype && "getInt16" in DataView.prototype && "setUint16" in DataView.prototype && "setInt16" in DataView.prototype;
const canFloat16 = 'getFloat16' in DataView.prototype && 'setFloat16' in DataView.prototype;
const canInt32 = 'getInt32' in DataView.prototype && 'getUint32' in DataView.prototype && 'setInt32' in DataView.prototype && 'setUint32' in DataView.prototype;
const canFloat32 = "getFloat32" in DataView.prototype && "setFloat32" in DataView.prototype;
const canBigInt64 = "getBigUint64" in DataView.prototype && "getBigInt64" in DataView.prototype && "setBigUint64" in DataView.prototype && "setBigInt64" in DataView.prototype;
const canFloat64 = "getFloat64" in DataView.prototype && "setFloat64" in DataView.prototype;
const hasBigInt = typeof BigInt === 'function';
const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
function isSafeInt64(big) {
    return big >= MIN_SAFE && big <= MAX_SAFE;
}
function isBuffer(obj) {
    return (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj));
}
function arrayBufferCheck(obj) {
    return obj instanceof Uint8Array || isBuffer(obj);
}
function normalizeBitOffset(bit) {
    return ((bit % 8) + 8) % 8;
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
    function hex_check(byte, bits) {
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
    let make_wide = false;
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
        else if (hex_check(byte, 1) == 0) {
            //Byte 1
            result += String.fromCharCode(byte);
        }
        else if (hex_check(byte, 3) == 6) {
            //Byte 2
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1];
                if (hex_check(byte2, 2) == 2) {
                    const charCode = ((byte & 0x1f) << 6) | (byte2 & 0x3f);
                    i++;
                    make_wide = true;
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
        else if (hex_check(byte, 4) == 14) {
            //Byte 3
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1];
                if (hex_check(byte2, 2) == 2) {
                    if (i + 2 <= end) {
                        //check third byte
                        const byte3 = data[i + 2];
                        if (hex_check(byte3, 2) == 2) {
                            const charCode = ((byte & 0x0f) << 12) |
                                ((byte2 & 0x3f) << 6) |
                                (byte3 & 0x3f);
                            i += 2;
                            make_wide = true;
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
        else if (hex_check(byte, 5) == 28) {
            //Byte 4
            if (i + 1 <= end) {
                //check second byte
                const byte2 = data[i + 1];
                if (hex_check(byte2, 2) == 2) {
                    if (i + 2 <= end) {
                        //check third byte
                        const byte3 = data[i + 2];
                        if (hex_check(byte3, 2) == 2) {
                            if (i + 3 <= end) {
                                //check fourth byte
                                const byte4 = data[i + 2];
                                if (hex_check(byte4, 2) == 2) {
                                    const charCode = (((byte4 & 0xFF) << 24) | ((byte3 & 0xFF) << 16) | ((byte2 & 0xFF) << 8) | (byte & 0xFF));
                                    i += 3;
                                    make_wide = true;
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
        rows[i] = rows[i] + (make_wide ? "|" + self + "|" : self);
    });
    header = "".padStart(addr.length) + header + (make_wide ? "" : ending);
    rows.unshift(header);
    if (make_wide) {
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

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var _BiBase_data;
const bufferConstants = { MAX_LENGTH: 2147483647 }; // 2 gigs
var fs;
(async function () {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // We are in Node.js
        try {
            if (typeof require !== 'undefined') {
                fs = require('fs');
                const buffer = require("buffer");
                bufferConstants.MAX_LENGTH = buffer.constants.MAX_LENGTH;
            }
            else {
                fs = await import('fs');
                const buffer = await import('buffer');
                bufferConstants.MAX_LENGTH = buffer.constants.MAX_LENGTH;
            }
        }
        catch (error) {
            console.error('Failed to load fs and buffer module:', error);
        }
    }
})();
function MAX_LENGTH() {
    return bufferConstants.MAX_LENGTH;
}
function hexDumpBase(ctx, options = {}) {
    var length = options && options.length;
    var startByte = options && options.startByte;
    if ((startByte || 0) > ctx.size) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error("Hexdump start is outside of data size: " + startByte + " of " + ctx.size);
    }
    const start = startByte || ctx.offset;
    const end = Math.min(start + (length || 192), ctx.size);
    if (start + (length || 0) > ctx.size) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error("Hexdump amount is outside of data size: " + (start + (length || 0)) + " of " + end);
    }
    var data = ctx.data;
    if (ctx.mode == "file") {
        data = ctx.lift(start, start + length, false);
    }
    return _hexDump(data, options, start, end);
}
// #region Movement
function skip(ctx, bytes, bits) {
    var new_size = (((bytes || 0) + ctx.offset) + Math.ceil((ctx.bitoffset + (bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0) + ctx.offset) * 8) + ctx.bitoffset + (bits || 0)) / 8);
    }
    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray(new_size - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: Seek of range of data: seek " + new_size + " of " + ctx.size);
        }
    }
    // Adjust byte offset based on bit overflow
    ctx.offset += Math.floor((ctx.bitoffset + (bits || 0)) / 8);
    // Adjust bit offset
    ctx.bitoffset = (ctx.bitoffset + normalizeBitOffset(bits)) % 8;
    // Adjust byte offset based on byte overflow
    ctx.offset += bytes;
    // Ensure bit offset stays between 0-7
    ctx.bitoffset = Math.min(Math.max(ctx.bitoffset, 0), 7);
    // Ensure offset doesn't go negative
    ctx.offset = Math.max(ctx.offset, 0);
    return;
}
function align(ctx, n) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(n - a);
    }
}
function alignRev(ctx, n) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(a * -1);
    }
}
function goto(ctx, bytes, bits) {
    var new_size = (((bytes || 0)) + Math.ceil(((bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0)) * 8) + (bits || 0)) / 8);
    }
    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray(new_size - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: Goto outside of range of data: goto " + new_size + " of " + ctx.size);
        }
    }
    ctx.offset = bytes;
    // Adjust byte offset based on bit overflow
    ctx.offset += Math.floor(((bits || 0)) / 8);
    // Adjust bit offset
    ctx.bitoffset = normalizeBitOffset(bits) % 8;
    // Ensure bit offset stays between 0-7
    ctx.bitoffset = Math.min(Math.max(ctx.bitoffset, 0), 7);
    // Ensure offset doesn't go negative
    ctx.offset = Math.max(ctx.offset, 0);
    return;
}
// #region Manipulation
function check_size(ctx, write_bytes, write_bit, offset) {
    const bits = (write_bit || 0) + ctx.bitoffset;
    var new_off = (ctx.offset);
    var writesize = write_bytes || 0;
    if (bits != 0) {
        //add bits
        writesize += Math.ceil(bits / 8);
    }
    //if bigger extend
    const needed_size = new_off + writesize;
    if (needed_size > ctx.size) {
        const dif = needed_size - ctx.size;
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray(dif);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: ` + needed_size + " at " + ctx.offset + " of " + ctx.size);
        }
    }
    //start read location
    return new_off;
}
function extendarray(ctx, to_padd) {
    ctx.open();
    if (ctx.strict) {
        throw new Error('File position is outside of file size while in strict mode.');
    }
    if (ctx.size + to_padd > ctx.maxFileSize) {
        throw new Error("buffer extend outside of max: " + (ctx.size + to_padd) + " to " + ctx.maxFileSize);
    }
    if (ctx.mode == "file") {
        if (ctx.extendBufferSize != 0) {
            if (ctx.extendBufferSize > to_padd) {
                to_padd = ctx.extendBufferSize;
            }
        }
        try {
            fs.ftruncateSync(ctx.fd, ctx.size + to_padd);
        }
        catch (error) {
            throw new Error(error);
        }
        ctx.updateSize();
        return;
    }
    if (isBuffer(ctx.data)) {
        var paddbuffer = Buffer.alloc(to_padd);
        ctx.data = Buffer.concat([ctx.data, paddbuffer]);
    }
    else {
        const newBuf = new Uint8Array(ctx.size + to_padd);
        newBuf.set(ctx.data);
        ctx.data = newBuf;
    }
    ctx.size = ctx.data.length;
    ctx.sizeB = ctx.data.length * 8;
    return;
}
function remove(ctx, startOffset, endOffset, consume, remove, fillValue) {
    ctx.open();
    const new_start = Math.abs(startOffset || 0);
    const new_offset = (endOffset || ctx.offset);
    if (new_offset > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray(new_offset - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + endOffset + " of " + ctx.size);
        }
    }
    if (ctx.strict == true && remove == true) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error("\x1b[33m[Strict mode]\x1b[0m: Can not remove data in strict mode: endOffset " + endOffset + " of " + ctx.size);
    }
    const data_removed = ctx.data.subarray(new_start, new_offset);
    if (remove) {
        const part1 = ctx.data.subarray(0, new_start);
        const part2 = ctx.data.subarray(new_offset, ctx.size);
        if (isBuffer(ctx.data)) {
            ctx.data = Buffer.concat([part1, part2]);
        }
        else {
            const newBuf = new Uint8Array(part1.byteLength + part2.byteLength);
            newBuf.set(part1, 0);
            newBuf.set(part2, part1.byteLength);
            ctx.data = newBuf;
        }
        ctx.size = ctx.data.length;
        ctx.sizeB = ctx.data.length * 8;
    }
    if (fillValue != undefined && remove == false) {
        const part1 = ctx.data.subarray(0, new_start);
        const part2 = ctx.data.subarray(new_offset, ctx.size);
        const replacement = new Array(data_removed.length).fill(fillValue & 0xff);
        if (isBuffer(ctx.data)) {
            const buff_placement = Buffer.from(replacement);
            ctx.data = Buffer.concat([part1, buff_placement, part2]);
        }
        else {
            const newBuf = new Uint8Array(part1.byteLength + replacement.length + part2.byteLength);
            newBuf.set(part1, 0);
            newBuf.set(replacement, part1.byteLength);
            newBuf.set(part2, part1.byteLength + replacement.length);
            ctx.data = newBuf;
        }
        ctx.size = ctx.data.length;
        ctx.sizeB = ctx.data.length * 8;
    }
    if (consume == true) {
        if (remove != true) {
            ctx.offset = new_offset;
            ctx.bitoffset = 0;
        }
        else {
            ctx.offset = new_start;
            ctx.bitoffset = 0;
        }
    }
    return data_removed;
}
function addData(ctx, data, consume, offset, replace) {
    if (ctx.strict == true) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Can not insert data in strict mode. Use unrestrict() to enable.`);
    }
    ctx.open();
    if (isBuffer(data) && !isBuffer(ctx.data)) {
        data = Buffer.from(data);
    }
    if (data instanceof Uint8Array && !(ctx.data instanceof Uint8Array)) {
        data = new Uint8Array(data);
    }
    var needed_size = offset || ctx.offset;
    if (replace) {
        needed_size = (offset || ctx.offset) + data.length;
        const part1 = ctx.data.subarray(0, needed_size - data.length);
        const part2 = ctx.data.subarray(needed_size, ctx.size);
        if (isBuffer(ctx.data)) {
            ctx.data = Buffer.concat([part1, data, part2]);
        }
        else {
            const newBuf = new Uint8Array(part1.byteLength + data.byteLength + part2.byteLength);
            newBuf.set(part1, 0);
            newBuf.set(data, part1.byteLength);
            newBuf.set(part2, part1.byteLength + data.byteLength);
            ctx.data = newBuf;
        }
        ctx.size = ctx.data.length;
        ctx.sizeB = ctx.data.length * 8;
    }
    else {
        const part1 = ctx.data.subarray(0, needed_size);
        const part2 = ctx.data.subarray(needed_size, ctx.size);
        if (isBuffer(ctx.data)) {
            ctx.data = Buffer.concat([part1, data, part2]);
        }
        else {
            const newBuf = new Uint8Array(part1.byteLength + data.byteLength + part2.byteLength);
            newBuf.set(part1, 0);
            newBuf.set(data, part1.byteLength);
            newBuf.set(part2, part1.byteLength + data.byteLength);
            ctx.data = newBuf;
        }
        ctx.size = ctx.data.length;
        ctx.sizeB = ctx.data.length * 8;
    }
    if (consume) {
        ctx.offset = (offset || ctx.offset) + data.length;
        ctx.bitoffset = 0;
    }
}
// #region Math
function AND(ctx, and_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    if (typeof and_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] & (and_key & 0xff);
            if (consume) {
                ctx.offset = i;
                ctx.bitoffset = 0;
            }
        }
    }
    else {
        if (typeof and_key == "string") {
            and_key = Uint8Array.from(Array.from(and_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(and_key)) {
            var number = -1;
            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != and_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                ctx.data[i] = ctx.data[i] & and_key[number];
                if (consume) {
                    ctx.offset = i;
                    ctx.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function OR(ctx, or_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    if (typeof or_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] | (or_key & 0xff);
            if (consume) {
                ctx.offset = i;
                ctx.bitoffset = 0;
            }
        }
    }
    else {
        if (typeof or_key == "string") {
            or_key = Uint8Array.from(Array.from(or_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(or_key)) {
            var number = -1;
            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != or_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                ctx.data[i] = ctx.data[i] | or_key[number];
                if (consume) {
                    ctx.offset = i;
                    ctx.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function XOR(ctx, xor_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    if (typeof xor_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] ^ (xor_key & 0xff);
            if (consume) {
                ctx.offset = i;
                ctx.bitoffset = 0;
            }
        }
    }
    else {
        if (typeof xor_key == "string") {
            xor_key = Uint8Array.from(Array.from(xor_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(xor_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != xor_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                ctx.data[i] = ctx.data[i] ^ xor_key[number];
                if (consume) {
                    ctx.offset = i;
                    ctx.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function NOT(ctx, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
        ctx.data[i] = ~ctx.data[i];
        if (consume) {
            ctx.offset = i;
            ctx.bitoffset = 0;
        }
    }
}
function LSHIFT(ctx, shift_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    if (typeof shift_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] << shift_key;
            if (consume) {
                ctx.offset = i;
                ctx.bitoffset = 0;
            }
        }
    }
    else {
        if (typeof shift_key == "string") {
            shift_key = Uint8Array.from(Array.from(shift_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(shift_key)) {
            var number = -1;
            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != shift_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                ctx.data[i] = ctx.data[i] << shift_key[number];
                if (consume) {
                    ctx.offset = i;
                    ctx.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function RSHIFT(ctx, shift_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    if (typeof shift_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] >> shift_key;
            if (consume) {
                ctx.offset = i;
                ctx.bitoffset = 0;
            }
        }
    }
    else {
        if (typeof shift_key == "string") {
            shift_key = Uint8Array.from(Array.from(shift_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(shift_key)) {
            var number = -1;
            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != shift_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                ctx.data[i] = ctx.data[i] >> shift_key[number];
                if (consume) {
                    ctx.offset = i;
                    ctx.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function ADD(ctx, add_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    if (typeof add_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] + add_key;
            if (consume) {
                ctx.offset = i;
                ctx.bitoffset = 0;
            }
        }
    }
    else {
        if (typeof add_key == "string") {
            add_key = Uint8Array.from(Array.from(add_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(add_key)) {
            var number = -1;
            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != add_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                ctx.data[i] = ctx.data[i] + add_key[number];
                if (consume) {
                    ctx.offset = i;
                    ctx.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
// #region Search
function fString(ctx, searchString) {
    ctx.open();
    // Convert the searchString to Uint8Array
    const searchArray = new TextEncoder().encode(searchString);
    for (let i = ctx.offset; i <= ctx.size - searchArray.length; i++) {
        var match = true;
        for (let j = 0; j < searchArray.length; j++) {
            if (ctx.data[i + j] !== searchArray[j]) {
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
function fNumber(ctx, targetNumber, bits, unsigned, endian) {
    ctx.open();
    check_size(ctx, Math.floor(bits / 8), 0);
    for (let z = ctx.offset; z <= (ctx.size - (bits / 8)); z++) {
        var off_in_bits = 0;
        var value = 0;
        for (var i = 0; i < bits;) {
            const remaining = bits - i;
            const bitOffset = off_in_bits & 7;
            const currentByte = ctx.data[z + (off_in_bits >> 3)];
            const read = Math.min(remaining, 8 - bitOffset);
            if ((endian != undefined ? endian : ctx.endian) == "big") {
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
            off_in_bits += read;
            i += read;
        }
        if (unsigned == true || bits <= 7) {
            value = value >>> 0;
        }
        else {
            if (bits !== 32 && value & (1 << (bits - 1))) {
                value |= -1 ^ ((1 << bits) - 1);
            }
        }
        if (value === targetNumber) {
            return z - ctx.offset; // Found the byte, return the index from current
        }
    }
    return -1; // number not found
}
function fHalfFloat(ctx, targetNumber, endian) {
    ctx.open();
    check_size(ctx, 2, 0);
    for (let z = ctx.offset; z <= (ctx.size - 2); z++) {
        var value = 0;
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            value = ((ctx.data[z + 1] & 0xFFFF) << 8) | (ctx.data[z] & 0xFFFF);
        }
        else {
            value = ((ctx.data[z] & 0xFFFF) << 8) | (ctx.data[z + 1] & 0xFFFF);
        }
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
        if (floatValue === targetNumber) {
            return z; // Found the number, return the index
        }
    }
    return -1; // number not found
}
function fFloat(ctx, targetNumber, endian) {
    ctx.open();
    check_size(ctx, 4, 0);
    for (let z = ctx.offset; z <= (ctx.size - 4); z++) {
        var value = 0;
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            value = ((ctx.data[z + 3] & 0xFF) << 24) |
                ((ctx.data[z + 2] & 0xFF) << 16) |
                ((ctx.data[z + 1] & 0xFF) << 8) |
                (ctx.data[z] & 0xFF);
        }
        else {
            value = ((ctx.data[z] & 0xFF) << 24) |
                ((ctx.data[z + 1] & 0xFF) << 16) |
                ((ctx.data[z + 2] & 0xFF) << 8) |
                (ctx.data[z + 3] & 0xFF);
        }
        const isNegative = (value & 0x80000000) !== 0 ? 1 : 0;
        // Extract the exponent and fraction parts
        const exponent = (value >> 23) & 0xFF;
        const fraction = value & 0x7FFFFF;
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
        if (floatValue === targetNumber) {
            return z; // Found the number, return the index
        }
    }
    return -1; // number not found
}
function fBigInt(ctx, targetNumber, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size(ctx, 8, 0);
    for (let z = ctx.offset; z <= (ctx.size - 8); z++) {
        var value = BigInt(0);
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((ctx.data[z + i] & 0xFF)) << BigInt(8 * i);
            }
            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
            }
        }
        else {
            for (let i = 0; i < 8; i++) {
                value = (value << BigInt(8)) | BigInt((ctx.data[z + i] & 0xFF));
            }
            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
            }
        }
        if (value == BigInt(targetNumber)) {
            return z;
        }
    }
    return -1; // number not found
}
function fDoubleFloat(ctx, targetNumber, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size(ctx, 8, 0);
    for (let z = ctx.offset; z <= (ctx.size - 8); z++) {
        var value = BigInt(0);
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((ctx.data[z + i] & 0xFF)) << BigInt(8 * i);
            }
        }
        else {
            for (let i = 0; i < 8; i++) {
                value = (value << BigInt(8)) | BigInt((ctx.data[z + i] & 0xFF));
            }
        }
        const sign = (value & BigInt("9223372036854775808")) >> BigInt(63);
        const exponent = Number((value & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;
        const fraction = Number(value & BigInt("4503599627370495")) / Math.pow(2, 52);
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
        if (floatValue == targetNumber) {
            return z;
        }
    }
    return -1; // number not found
}
// #region Write / Read Bits
function wbit(ctx, value, bits, unsigned, endian) {
    ctx.open();
    if (value == undefined) {
        throw new Error('Must supply value.');
    }
    if (bits == undefined) {
        throw new Error("Enter number of bits to write");
    }
    if (bits == 0) {
        return;
    }
    if (bits <= 0 || bits > 32) {
        throw new Error('Bit length must be between 1 and 32. Got ' + bits);
    }
    if (unsigned == true || bits == 1) {
        if (value < 0 || value > Math.pow(2, bits)) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + 0 + " max: " + Math.pow(2, bits) + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, bits - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if (unsigned == true || bits == 1) {
        const maxValue = Math.pow(2, bits) - 1;
        value = value & maxValue;
    }
    const size_needed = ((((bits - 1) + ctx.bitoffset) / 8) + ctx.offset);
    if (size_needed > ctx.size) {
        //add size
        if (ctx.extendBufferSize != 0) {
            ctx.extendArray(ctx.extendBufferSize);
        }
        else {
            ctx.extendArray(size_needed - ctx.size);
        }
    }
    var off_in_bits = (ctx.offset * 8) + ctx.bitoffset;
    for (var i = 0; i < bits;) {
        const remaining = bits - i;
        const bitOffset = off_in_bits & 7;
        const byteOffset = off_in_bits >> 3;
        const written = Math.min(remaining, 8 - bitOffset);
        if ((endian != undefined ? endian : ctx.endian) == "big") {
            let mask = ~(-1 << written);
            let writeBits = (value >> (bits - i - written)) & mask;
            var destShift = 8 - bitOffset - written;
            let destMask = ~(mask << destShift);
            ctx.data[byteOffset] = (ctx.data[byteOffset] & destMask) | (writeBits << destShift);
        }
        else {
            let mask = ~(0xFF << written);
            let writeBits = value & mask;
            value >>= written;
            let destMask = ~(mask << bitOffset);
            ctx.data[byteOffset] = (ctx.data[byteOffset] & destMask) | (writeBits << bitOffset);
        }
        off_in_bits += written;
        i += written;
    }
    ctx.offset = ctx.offset + Math.floor(((bits) + ctx.bitoffset) / 8); //end byte
    ctx.bitoffset = ((bits) + ctx.bitoffset) % 8;
}
function rbit(ctx, bits, unsigned, endian) {
    ctx.open();
    if (bits == undefined || typeof bits != "number") {
        throw new Error("Enter number of bits to read");
    }
    if (bits == 0) {
        return 0;
    }
    if (bits <= 0 || bits > 32) {
        throw new Error('Bit length must be between 1 and 32. Got ' + bits);
    }
    const size_needed = ((((bits - 1) + ctx.bitoffset) / 8) + ctx.offset);
    if (bits <= 0 || size_needed > ctx.size) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error("Invalid number of bits to read: " + size_needed + " of " + ctx.size);
    }
    var off_in_bits = (ctx.offset * 8) + ctx.bitoffset;
    var value = 0;
    for (var i = 0; i < bits;) {
        const remaining = bits - i;
        const bitOffset = off_in_bits & 7;
        const currentByte = ctx.data[off_in_bits >> 3];
        const read = Math.min(remaining, 8 - bitOffset);
        if ((endian != undefined ? endian : ctx.endian) == "big") {
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
        off_in_bits += read;
        i += read;
    }
    ctx.offset = ctx.offset + Math.floor(((bits) + ctx.bitoffset) / 8); //end byte
    ctx.bitoffset = ((bits) + ctx.bitoffset) % 8;
    if (unsigned == true || bits <= 7) {
        return value >>> 0;
    }
    if (bits !== 32 && value & (1 << (bits - 1))) {
        value |= -1 ^ ((1 << bits) - 1);
    }
    return value;
}
// #region Write / Read Bytes
function wbyte(ctx, value, unsigned) {
    ctx.open();
    check_size(ctx, 1, 0);
    if (unsigned == true) {
        if (value < 0 || value > 255) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + 0 + " max: " + 255 + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 8 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if (canInt8) {
        if ((unsigned == undefined || unsigned == false)) {
            ctx.view.setInt8(ctx.offset, value);
        }
        else {
            ctx.view.setUint8(ctx.offset, value);
        }
    }
    else {
        ctx.data[ctx.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
    }
    ctx.offset += 1;
    ctx.bitoffset = 0;
}
function rbyte(ctx, unsigned) {
    ctx.open();
    check_size(ctx, 1);
    var read;
    if (canInt8) {
        if ((unsigned == undefined || unsigned == false)) {
            read = ctx.view.getInt8(ctx.offset);
        }
        else {
            read = ctx.view.getUint8(ctx.offset);
        }
        ctx.offset += 1;
        ctx.bitoffset = 0;
        return read;
    }
    read = ctx.data[ctx.offset];
    ctx.offset += 1;
    ctx.bitoffset = 0;
    if (unsigned == true) {
        return read & 0xFF;
    }
    else {
        return read > 127 ? read - 256 : read;
    }
}
// #region Write / Read Int16
function wint16(ctx, value, unsigned, endian) {
    ctx.open();
    check_size(ctx, 2, 0);
    if (unsigned == true) {
        if (value < 0 || value > 65535) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + 0 + " max: " + 65535 + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 16 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if (canInt16) {
        if ((unsigned == undefined || unsigned == false)) {
            ctx.view.setInt16(ctx.offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            ctx.view.setUint16(ctx.offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    }
    else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            ctx.data[ctx.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
            ctx.data[ctx.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
        }
        else {
            ctx.data[ctx.offset] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
            ctx.data[ctx.offset + 1] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
        }
    }
    ctx.offset += 2;
    ctx.bitoffset = 0;
}
function rint16(ctx, unsigned, endian) {
    ctx.open();
    check_size(ctx, 2);
    var read;
    if (canInt16) {
        if (unsigned == undefined || unsigned == false) {
            read = ctx.view.getInt16(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            read = ctx.view.getUint16(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 2;
        ctx.bitoffset = 0;
        return read;
    }
    else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            read = ((ctx.data[ctx.offset + 1] & 0xFFFF) << 8) | (ctx.data[ctx.offset] & 0xFFFF);
        }
        else {
            read = ((ctx.data[ctx.offset] & 0xFFFF) << 8) | (ctx.data[ctx.offset + 1] & 0xFFFF);
        }
    }
    ctx.offset += 2;
    ctx.bitoffset = 0;
    if (unsigned == undefined || unsigned == false) {
        return read & 0x8000 ? -(0x10000 - read) : read;
    }
    else {
        return read & 0xFFFF;
    }
}
// #region Write / Read Float16
function rhalffloat(ctx, endian) {
    if (canFloat16) {
        ctx.open();
        check_size(ctx, 2);
        const float16Value = ctx.view.getFloat16(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 2;
        ctx.bitoffset = 0;
        return float16Value;
    }
    var uint16Value = ctx.readInt16(true, (endian != undefined ? endian : ctx.endian));
    const sign = (uint16Value & 0x8000) >> 15;
    const exponent = (uint16Value & 0x7C00) >> 10;
    const fraction = uint16Value & 0x03FF;
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
function whalffloat(ctx, value, endian) {
    ctx.open();
    check_size(ctx, 2, 0);
    const maxValue = 65504;
    const minValue = 5.96e-08;
    if (value < minValue || value > maxValue) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error('Value is out of range for the specified half float length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
    }
    if (canFloat16) {
        ctx.view.setFloat16(ctx.offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 2;
        ctx.bitoffset = 0;
        return;
    }
    const floatView = new Float32Array(1);
    const intView = new Uint32Array(floatView.buffer);
    floatView[0] = value;
    const x = intView[0];
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
    // Write bytes based on endianness
    if ((endian == undefined ? ctx.endian : endian) == "little") {
        ctx.data[ctx.offset] = halfFloatBits & 0xFF;
        ctx.data[ctx.offset + 1] = (halfFloatBits >> 8) & 0xFF;
    }
    else {
        ctx.data[ctx.offset] = (halfFloatBits >> 8) & 0xFF;
        ctx.data[ctx.offset + 1] = halfFloatBits & 0xFF;
    }
    ctx.offset += 2;
    ctx.bitoffset = 0;
}
// #region Write / Read Int32
function wint32(ctx, value, unsigned, endian) {
    ctx.open();
    check_size(ctx, 4, 0);
    if (unsigned == true) {
        if (value < 0 || value > 4294967295) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + 0 + " max: " + 4294967295 + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 32 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if (canInt32) {
        if ((unsigned == undefined || unsigned == false)) {
            ctx.view.setInt32(ctx.offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            ctx.view.setUint32(ctx.offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    }
    else {
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            ctx.data[ctx.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
            ctx.data[ctx.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            ctx.data[ctx.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            ctx.data[ctx.offset + 3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        }
        else {
            ctx.data[ctx.offset] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
            ctx.data[ctx.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            ctx.data[ctx.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            ctx.data[ctx.offset + 3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        }
    }
    ctx.offset += 4;
    ctx.bitoffset = 0;
}
function rint32(ctx, unsigned, endian) {
    ctx.open();
    check_size(ctx, 4);
    var read;
    if (canInt32) {
        if ((unsigned == undefined || unsigned == false)) {
            read = ctx.view.getInt32(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            read = ctx.view.getUint32(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 4;
        ctx.bitoffset = 0;
        return read;
    }
    if ((endian != undefined ? endian : ctx.endian) == "little") {
        read = ((ctx.data[ctx.offset + 3] & 0xFF) << 24) |
            ((ctx.data[ctx.offset + 2] & 0xFF) << 16) |
            ((ctx.data[ctx.offset + 1] & 0xFF) << 8) |
            (ctx.data[ctx.offset] & 0xFF);
    }
    else {
        read = ((ctx.data[ctx.offset] & 0xFF) << 24) |
            ((ctx.data[ctx.offset + 1] & 0xFF) << 16) |
            ((ctx.data[ctx.offset + 2] & 0xFF) << 8) |
            (ctx.data[ctx.offset + 3] & 0xFF);
    }
    ctx.offset += 4;
    ctx.bitoffset = 0;
    if (unsigned == undefined || unsigned == false) {
        return read;
    }
    else {
        return read >>> 0;
    }
}
// #region Write / Read Float32
function rfloat(ctx, endian) {
    if (canFloat32) {
        ctx.open();
        check_size(ctx, 4);
        const float32Value = ctx.view.getFloat32(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 4;
        ctx.bitoffset = 0;
        return float32Value;
    }
    const uint32Value = ctx.readInt32(true, (endian == undefined ? ctx.endian : endian));
    // Check if the value is negative (i.e., the most significant bit is set)
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
function wfloat(ctx, value, endian) {
    ctx.open();
    check_size(ctx, 4, 0);
    const MIN_POSITIVE_FLOAT32 = Number.MIN_VALUE;
    const MAX_POSITIVE_FLOAT32 = 3.4028235e+38;
    const MIN_NEGATIVE_FLOAT32 = -34028235e31;
    const MAX_NEGATIVE_FLOAT32 = -Number.MIN_VALUE;
    if (!((value === 0) ||
        (value >= MIN_POSITIVE_FLOAT32 && value <= MAX_POSITIVE_FLOAT32) ||
        (value >= MIN_NEGATIVE_FLOAT32 && value <= MAX_NEGATIVE_FLOAT32))) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error('Value is out of range for the specified float length.' + " min: " + MIN_NEGATIVE_FLOAT32 + " max: " + MAX_POSITIVE_FLOAT32 + " value: " + value);
    }
    if (canFloat32) {
        ctx.view.setFloat32(ctx.offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
    }
    else {
        const arrayFloat = new Float32Array(1);
        arrayFloat[0] = value;
        if (endian != undefined ? endian == "little" : ctx.endian == "little") {
            ctx.data[ctx.offset] = arrayFloat.buffer[0];
            ctx.data[ctx.offset + 1] = arrayFloat.buffer[1];
            ctx.data[ctx.offset + 2] = arrayFloat.buffer[2];
            ctx.data[ctx.offset + 3] = arrayFloat.buffer[3];
        }
        else {
            ctx.data[ctx.offset] = arrayFloat.buffer[3];
            ctx.data[ctx.offset + 1] = arrayFloat.buffer[2];
            ctx.data[ctx.offset + 2] = arrayFloat.buffer[1];
            ctx.data[ctx.offset + 3] = arrayFloat.buffer[0];
        }
    }
    ctx.offset += 4;
    ctx.bitoffset = 0;
}
// #region Write / Read Int64
function rint64(ctx, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size(ctx, 8);
    var value = BigInt(0);
    if (canBigInt64) {
        if (unsigned == undefined || unsigned == false) {
            value = ctx.view.getBigInt64(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            value = ctx.view.getBigUint64(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 8;
    }
    else {
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((ctx.data[ctx.offset] & 0xFF)) << BigInt(8 * i);
                ctx.offset += 1;
            }
            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
            }
        }
        else {
            for (let i = 0; i < 8; i++) {
                value = (value << BigInt(8)) | BigInt((ctx.data[ctx.offset] & 0xFF));
                ctx.offset += 1;
            }
            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
            }
        }
    }
    ctx.bitoffset = 0;
    if (ctx.enforceBigInt == true) {
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
function wint64(ctx, value, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size(ctx, 8, 0);
    if (unsigned == true) {
        if (value < 0 || value > Math.pow(2, 64) - 1) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + 0 + " max: " + (Math.pow(2, 64) - 1) + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 63) - 1;
        const minValue = -Math.pow(2, 63);
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if (canBigInt64) {
        if (unsigned == undefined || unsigned == false) {
            ctx.view.setBigInt64(ctx.offset, BigInt(value), endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            ctx.view.setBigUint64(ctx.offset, BigInt(value), endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    }
    else {
        // Convert the BigInt to a 64-bit signed integer
        const bigIntArray = new BigInt64Array(1);
        bigIntArray[0] = BigInt(value);
        // Use two 32-bit views to write the Int64
        const int32Array = new Int32Array(bigIntArray.buffer);
        for (let i = 0; i < 2; i++) {
            if ((endian == undefined ? ctx.endian : endian) == "little") {
                if (unsigned == undefined || unsigned == false) {
                    ctx.data[ctx.offset + i * 4 + 0] = int32Array[i];
                    ctx.data[ctx.offset + i * 4 + 1] = (int32Array[i] >> 8);
                    ctx.data[ctx.offset + i * 4 + 2] = (int32Array[i] >> 16);
                    ctx.data[ctx.offset + i * 4 + 3] = (int32Array[i] >> 24);
                }
                else {
                    ctx.data[ctx.offset + i * 4 + 0] = int32Array[i] & 0xFF;
                    ctx.data[ctx.offset + i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                    ctx.data[ctx.offset + i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                    ctx.data[ctx.offset + i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            }
            else {
                if (unsigned == undefined || unsigned == false) {
                    ctx.data[ctx.offset + (1 - i) * 4 + 3] = int32Array[i];
                    ctx.data[ctx.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 8);
                    ctx.data[ctx.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 16);
                    ctx.data[ctx.offset + (1 - i) * 4 + 0] = (int32Array[i] >> 24);
                }
                else {
                    ctx.data[ctx.offset + (1 - i) * 4 + 3] = int32Array[i] & 0xFF;
                    ctx.data[ctx.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 8) & 0xFF;
                    ctx.data[ctx.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 16) & 0xFF;
                    ctx.data[ctx.offset + (1 - i) * 4 + 0] = (int32Array[i] >> 24) & 0xFF;
                }
            }
        }
    }
    ctx.offset += 8;
    ctx.bitoffset = 0;
}
// #region Write / Read Float64
function wdfloat(ctx, value, endian) {
    ctx.open();
    check_size(ctx, 8, 0);
    const MIN_POSITIVE_FLOAT64 = 2.2250738585072014e-308;
    const MAX_POSITIVE_FLOAT64 = Number.MAX_VALUE;
    const MIN_NEGATIVE_FLOAT64 = -Number.MAX_VALUE;
    const MAX_NEGATIVE_FLOAT64 = -22250738585072014e-324;
    if (!((value === 0) ||
        (value >= MIN_POSITIVE_FLOAT64 && value <= MAX_POSITIVE_FLOAT64) ||
        (value >= MIN_NEGATIVE_FLOAT64 && value <= MAX_NEGATIVE_FLOAT64))) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error('Value is out of range for the specified 64bit length.' + " min: " + MIN_NEGATIVE_FLOAT64 + " max: " + MAX_POSITIVE_FLOAT64 + " value: " + value);
    }
    if (canFloat64) {
        ctx.view.setFloat64(ctx.offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
    }
    else {
        const intArray = new Int32Array(2);
        const floatArray = new Float64Array(intArray.buffer);
        floatArray[0] = value;
        const bytes = new Uint8Array(intArray.buffer);
        for (let i = 0; i < 8; i++) {
            if ((endian == undefined ? ctx.endian : endian) == "little") {
                ctx.data[ctx.offset + i] = bytes[i];
            }
            else {
                ctx.data[ctx.offset + (7 - i)] = bytes[i];
            }
        }
    }
    ctx.offset += 8;
    ctx.bitoffset = 0;
}
function rdfloat(ctx, endian) {
    if (canFloat64) {
        ctx.open();
        check_size(ctx, 8, 0);
        const floatValue = ctx.view.getFloat64(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 8;
        ctx.bitoffset = 0;
        return floatValue;
    }
    endian = (endian == undefined ? ctx.endian : endian);
    var uint64Value = ctx.readInt64(true, endian);
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
// #region Write / Read Strings
function rstring(ctx, options) {
    ctx.open();
    var length = options && options.length;
    var stringType = options && options.stringType || 'utf-8';
    var terminateValue = options && options.terminateValue;
    var lengthReadSize = options && options.lengthReadSize || 1;
    var stripNull = options && options.stripNull || true;
    var encoding = options && options.encoding || 'utf-8';
    var endian = options && options.endian || ctx.endian;
    var terminate = terminateValue;
    if (length != undefined) {
        check_size(ctx, length);
    }
    if (typeof terminateValue == "number") {
        terminate = terminateValue & 0xFF;
    }
    else {
        if (terminateValue != undefined) {
            throw new Error("terminateValue must be a number");
        }
    }
    if (stringType == 'utf-8' || stringType == 'utf-16') {
        if (encoding == undefined) {
            if (stringType == 'utf-8') {
                encoding = 'utf-8';
            }
            if (stringType == 'utf-16') {
                encoding = 'utf-16';
            }
        }
        // Read the string as UTF-8 encoded untill 0 or terminateValue
        const encodedBytes = [];
        if (length == undefined && terminateValue == undefined) {
            terminate = 0;
        }
        var read_length = 0;
        if (length != undefined) {
            read_length = length;
        }
        else {
            read_length = ctx.data.length - ctx.offset;
        }
        for (let i = 0; i < read_length; i++) {
            if (stringType === 'utf-8') {
                var read = ctx.readUByte();
                if (read == terminate) {
                    break;
                }
                else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read);
                    }
                }
            }
            else {
                var read = ctx.readInt16(true, endian);
                var read1 = read & 0xFF;
                var read2 = (read >> 8) & 0xFF;
                if (read == terminate) {
                    break;
                }
                else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read1);
                        encodedBytes.push(read2);
                    }
                }
            }
        }
        return new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
    }
    else if (stringType == 'pascal' || stringType == 'wide-pascal') {
        if (encoding == undefined) {
            if (stringType == 'pascal') {
                encoding = 'utf-8';
            }
            if (stringType == 'wide-pascal') {
                encoding = 'utf-16';
            }
        }
        var maxBytes;
        if (lengthReadSize == 1) {
            maxBytes = ctx.readUByte();
        }
        else if (lengthReadSize == 2) {
            maxBytes = ctx.readInt16(true, endian);
        }
        else if (lengthReadSize == 4) {
            maxBytes = ctx.readInt32(true, endian);
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("Invalid length read size: " + lengthReadSize);
        }
        // Read the string as Pascal or Delphi encoded
        const encodedBytes = [];
        for (let i = 0; i < maxBytes; i++) {
            if (stringType == 'wide-pascal') {
                const read = ctx.readInt16(true, endian);
                i++;
                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read);
                }
            }
            else {
                const read = ctx.readUByte();
                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read);
                }
            }
        }
        var str_return;
        if (stringType == 'wide-pascal') {
            const strBuffer = new Uint16Array(encodedBytes);
            str_return = new TextDecoder().decode(strBuffer.buffer);
        }
        else {
            const strBuffer = new Uint8Array(encodedBytes);
            str_return = new TextDecoder(encoding).decode(strBuffer);
        }
        return str_return;
    }
    else {
        throw new Error('Unsupported string type: ' + stringType);
    }
}
function wstring(ctx, string, options) {
    ctx.open();
    var length = options && options.length;
    var stringType = options && options.stringType || 'utf-8';
    var terminateValue = options && options.terminateValue;
    var lengthWriteSize = options && options.lengthWriteSize || 1;
    options && options.encoding || 'utf-8';
    var endian = options && options.endian || ctx.endian;
    if (stringType === 'utf-8' || stringType === 'utf-16') {
        const encoder = new TextEncoder();
        const encodedString = encoder.encode(string);
        if (length == undefined && terminateValue == undefined) {
            terminateValue = 0;
        }
        var totalLength = (length || encodedString.byteLength) + (terminateValue != undefined ? 1 : 0);
        if (stringType == 'utf-16') {
            totalLength = (length || encodedString.byteLength) + (terminateValue != undefined ? 2 : 0);
        }
        check_size(ctx, totalLength, 0);
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < encodedString.length; i++) {
            if (stringType === 'utf-16') {
                const charCode = encodedString[i];
                if (endian == "little") {
                    ctx.data[ctx.offset + i * 2] = charCode & 0xFF;
                    ctx.data[ctx.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                }
                else {
                    ctx.data[ctx.offset + i * 2 + 1] = charCode & 0xFF;
                    ctx.data[ctx.offset + i * 2] = (charCode >> 8) & 0xFF;
                }
            }
            else {
                ctx.data[ctx.offset + i] = encodedString[i];
            }
        }
        if (terminateValue != undefined) {
            if (stringType === 'utf-16') {
                ctx.data[ctx.offset + totalLength - 1] = terminateValue & 0xFF;
                ctx.data[ctx.offset + totalLength] = (terminateValue >> 8) & 0xFF;
            }
            else {
                ctx.data[ctx.offset + totalLength] = terminateValue;
            }
        }
        ctx.offset += totalLength;
        ctx.bitoffset = 0;
    }
    else if (stringType == 'pascal' || stringType == 'wide-pascal') {
        const encoder = new TextEncoder();
        // Calculate the length of the string based on the specified max length
        var maxLength;
        // Encode the string in the specified encoding
        if (lengthWriteSize == 1) {
            maxLength = 255;
        }
        else if (lengthWriteSize == 2) {
            maxLength = 65535;
        }
        else if (lengthWriteSize == 4) {
            maxLength = 4294967295;
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("Invalid length write size: " + lengthWriteSize);
        }
        if (string.length > maxLength || (length || 0) > maxLength) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("String outsize of max write length: " + maxLength);
        }
        const maxBytes = Math.min(string.length, maxLength);
        const encodedString = encoder.encode(string.substring(0, maxBytes));
        var totalLength = (length || encodedString.byteLength);
        if (lengthWriteSize == 1) {
            ctx.writeUByte(totalLength);
        }
        else if (lengthWriteSize == 2) {
            ctx.writeUInt16(totalLength, endian);
        }
        else if (lengthWriteSize == 4) {
            ctx.writeUInt32(totalLength, endian);
        }
        check_size(ctx, totalLength, 0);
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < totalLength; i++) {
            if (stringType == 'wide-pascal') {
                if (endian == "little") {
                    ctx.data[ctx.offset + i] = encodedString[i];
                    ctx.data[ctx.offset + i + 1] = encodedString[i + 1];
                }
                else {
                    ctx.data[ctx.offset + i + 1] = encodedString[i];
                    ctx.data[ctx.offset + i] = encodedString[i + 1];
                }
                i++;
            }
            else {
                ctx.data[ctx.offset + i] = encodedString[i];
            }
        }
        ctx.offset += totalLength;
        ctx.bitoffset = 0;
    }
    else {
        throw new Error('Unsupported string type: ' + stringType);
    }
}
// #region Class
/**
 * Base class for BiReader and BiWriter
 */
class BiBase {
    /**
     * Get the current buffer data.
     *
     * @type {DataType}
     */
    get data() {
        return __classPrivateFieldGet(this, _BiBase_data, "f");
    }
    ;
    /**
     * Set the current buffer data.
     *
     * @param {DataType} data
     */
    set data(data) {
        if (this.isBufferOrUint8Array(data)) {
            __classPrivateFieldSet(this, _BiBase_data, data, "f");
            this.updateView();
        }
    }
    ;
    constructor(input, writeable) {
        /**
         * Endianness of default read.
         * @type {endian}
         */
        this.endian = "little";
        /**
         * Current read byte location.
         */
        this.offset = 0;
        /**
         * Current read byte's bit location.
         */
        this.bitoffset = 0;
        /**
         * Size in bytes of the current buffer.
         */
        this.size = 0;
        /**
         * Size in bits of the current buffer.
         */
        this.sizeB = 0;
        /**
         * Allows the buffer to extend reading or writing outside of current size
         */
        this.strict = false;
        /**
         * Console log a hexdump on error.
         */
        this.errorDump = false;
        _BiBase_data.set(this, null);
        /**
         * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
         *
         * Otherwise it extends just the amount of the next written value.
         *
         * This can greatly speed up data writes when large files are being written.
         *
         * NOTE: Using ``BiWriter.get`` or ``BiWriter.return`` will now remove all data after the current write position. Use ``BiWriter.data`` to get the full buffer instead.
         */
        this.extendBufferSize = 0;
        this.fd = null;
        this.filePath = null;
        this.fsMode = "r";
        /**
         * The settings that used when using the .str getter / setter
         */
        this.strDefaults = { stringType: "utf-8", terminateValue: 0x0 };
        /**
         * Window size of the file data (largest amount it can read)
         */
        this.maxFileSize = null;
        this.enforceBigInt = null;
        this.mode = 'memory';
        if (typeof input == "string") {
            if (typeof Buffer === 'undefined' || typeof fs == "undefined") {
                throw new Error("Need node to read or write files.");
            }
            this.filePath = input;
            this.mode = "file";
        }
        else {
            this.mode = "memory";
        }
        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH() || 0x80000000;
        }
        if (writeable != undefined) {
            if (writeable == true) {
                this.fsMode = "w+";
            }
            else {
                this.fsMode = "r";
            }
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
    /**
     * Enables expanding in reader (changes strict)
     *
     * @param {boolean} mode - Enable expanding in reader (changes strict)
     */
    writeMode(mode) {
        if (mode) {
            this.strict = false;
            if (this.mode == "file") {
                this.fsMode = "w+";
                this.close();
                this.open();
            }
            return;
        }
        else {
            this.strict = true;
            if (this.mode == "file") {
                this.fsMode = "r";
                this.close();
                this.open();
            }
            return;
        }
    }
    ;
    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     *
     * @returns {number} file size
     */
    open() {
        if (this.mode == "memory") {
            return this.size;
        }
        if (this.fd != null) {
            return this.size;
        }
        if (fs == undefined) {
            throw new Error("Can't load file without Node.");
        }
        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH();
        }
        try {
            this.fd = fs.openSync(this.filePath, this.fsMode);
        }
        catch (error) {
            throw new Error(error);
        }
        this.updateSize();
        this.data = Buffer.alloc(this.size);
        try {
            fs.readSync(this.fd, this.data, 0, this.data.length, null);
        }
        catch (error) {
            throw new Error(error);
        }
        if (this.offset != undefined || this.bitoffset != undefined) {
            this.offset = ((Math.abs(this.offset || 0)) + Math.ceil((Math.abs(this.bitoffset || 0)) / 8));
            // Adjust byte offset based on bit overflow
            this.offset += Math.floor((Math.abs(this.bitoffset || 0)) / 8);
            // Adjust bit offset
            this.bitoffset = Math.abs(normalizeBitOffset(this.bitoffset)) % 8;
            // Ensure bit offset stays between 0-7
            this.bitoffset = Math.min(Math.max(this.bitoffset, 0), 7);
            // Ensure offset doesn't go negative
            this.offset = Math.max(this.offset, 0);
            if (this.offset > this.size) {
                if (this.strict == false) {
                    if (this.extendBufferSize != 0) {
                        this.extendArray(this.extendBufferSize);
                    }
                    else {
                        this.extendArray(this.offset - this.size);
                    }
                }
                else {
                    throw new Error(`Starting offset outside of size: ${this.offset} of ${this.size}`);
                }
            }
        }
        return this.size;
    }
    ;
    /**
     * Internal update size
     */
    updateSize() {
        if (this.mode == "memory") {
            return;
        }
        if (fs == undefined) {
            throw new Error("Can't read file without Node.");
        }
        if (this.fd !== null) {
            try {
                const stat = fs.fstatSync(this.fd);
                this.size = stat.size;
                this.sizeB = this.size * 8;
            }
            catch (error) {
                throw new Error(error);
            }
            if (this.size > this.maxFileSize) {
                throw new Error("File too large to load.");
            }
        }
    }
    ;
    /**
     * commit data and removes it.
     */
    close() {
        if (this.mode == "memory") {
            __classPrivateFieldSet(this, _BiBase_data, undefined, "f");
            this.view = undefined;
            return;
        }
        if (this.fd === null) {
            return; // Already closed / or not open
        }
        if (fs == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }
        this.commit();
        try {
            fs.closeSync(this.fd);
        }
        catch (error) {
            throw new Error(error);
        }
        this.fd = null;
        return;
    }
    ;
    /**
     * Write buffer to data
     *
     * @param {DataType} data
     * @param {boolean} consume
     * @param {number} start - likely this.offset
     * @returns {Buffer | Uint8Array}
     */
    write(data, consume = false, start = this.offset) {
        if (this.mode == "memory") {
            this.insert(data, consume, start);
            return data;
        }
        this.open();
        this.insert(data, consume, start);
        return this.commit();
    }
    ;
    /**
     * Write data buffer back to file
     *
     * @returns {DataType}
     */
    commit() {
        if (this.mode == "memory") {
            return this.data;
        }
        this.open();
        try {
            fs.writeSync(this.fd, this.data, 0, this.data.length);
        }
        catch (error) {
            throw new Error(error);
        }
        this.updateSize();
        return this.data;
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
        if (this.mode == "memory") {
            return;
        }
        try {
            fs.closeSync(this.fd);
            this.fd = null;
            fs.renameSync(this.filePath, newFilePath);
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
     * Note: This is permanentand can't be undone.
     *
     * It doesn't send the file to the recycling bin for recovery.
     */
    deleteFile() {
        if (this.mode == "memory") {
            return;
        }
        try {
            fs.closeSync(this.fd);
            this.fd = null;
            fs.unlinkSync(this.filePath);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    ;
    extendArray(to_padd) {
        return extendarray(this, to_padd);
    }
    ;
    isBufferOrUint8Array(obj) {
        return arrayBufferCheck(obj);
    }
    ;
    /**
     * Call this after everytime we set/replace `this.data`
     */
    updateView() {
        if (__classPrivateFieldGet(this, _BiBase_data, "f")) {
            this.view = new DataView(__classPrivateFieldGet(this, _BiBase_data, "f").buffer, __classPrivateFieldGet(this, _BiBase_data, "f").byteOffset ?? 0, __classPrivateFieldGet(this, _BiBase_data, "f").byteLength);
        }
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
            throw new Error("Endian must be big or little");
        }
        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new Error("Endian must be big or little");
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
    get lengthB() {
        return this.sizeB;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get FileSizeB() {
        return this.sizeB;
    }
    ;
    /**
     * Size in bits of the current buffer.
     *
     * @returns {number} size
     */
    get lenb() {
        return this.sizeB;
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
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get getOffset() {
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
    get off() {
        return this.offset;
    }
    ;
    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get getOffsetBit() {
        return this.bitoffset;
    }
    ;
    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get tellB() {
        return this.bitoffset;
    }
    ;
    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get FTellB() {
        return this.bitoffset;
    }
    ;
    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get offb() {
        return this.bitoffset;
    }
    ;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current absolute bit position
     */
    get getOffsetAbsBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    ;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current bit position
     */
    get saveOffsetAbsBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    ;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current absolute bit position
     */
    get tellAbsB() {
        return (this.offset * 8) + this.bitoffset;
    }
    ;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current absolute bit position
     */
    get saveOffsetBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    ;
    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current absolute bit position
     */
    get offab() {
        return (this.offset * 8) + this.bitoffset;
    }
    ;
    /**
     * Size in bytes of current read position to the end
     *
     * @returns {number} size
     */
    get remain() {
        return this.size - this.offset;
    }
    ;
    /**
     * Size in bytes of current read position to the end
     *
     * @returns {number} size
     */
    get FEoF() {
        return this.size - this.offset;
    }
    ;
    /**
     * Size in bits of current read position to the end
     *
     * @returns {number} size
     */
    get remainB() {
        return (this.size * 8) - this.saveOffsetAbsBit;
    }
    ;
    /**
     * Size in bits of current read position to the end
     *
     * @returns {number} size
     */
    get FEoFB() {
        return (this.size * 8) - this.saveOffsetAbsBit;
    }
    ;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get getLine() {
        return Math.abs(Math.floor((this.offset - 1) / 16));
    }
    ;
    /**
     * Row line of the file (16 bytes per row).
     *
     * @returns {number} size
     */
    get row() {
        return Math.abs(Math.floor((this.offset - 1) / 16));
    }
    ;
    ///////////////////////////////
    // #region FINISHING
    ///////////////////////////////
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {DataType} ``Buffer`` or ``Uint8Array``
     */
    get() {
        if (this.extendBufferSize != 0) {
            this.trim();
        }
        return this.data;
    }
    ;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {DataType} ``Buffer`` or ``Uint8Array``
     */
    return() {
        return this.get();
    }
    ;
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
        return hexDumpBase(this, options);
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
    /**
     * removes data.
     *
     * Commits any changes to file when editing a file.
     */
    end() {
        if (this.mode == "memory") {
            __classPrivateFieldSet(this, _BiBase_data, undefined, "f");
            this.view = undefined;
            return;
        }
        this.commit();
        return;
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
    // #region   FIND 
    ///////////////////////////////
    /**
     * Searches for byte position of string from current read position.
     *
     * Returns -1 if not found.
     *
     * Does not change current read position.
     *
     * @param {string} string - String to search for.
     */
    findString(string) {
        return fString(this, string);
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
    findByte(value, unsigned, endian) {
        return fNumber(this, value, 8, unsigned == undefined ? true : unsigned, endian);
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
    findShort(value, unsigned, endian) {
        return fNumber(this, value, 16, unsigned == undefined ? true : unsigned, endian);
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
    findInt(value, unsigned, endian) {
        return fNumber(this, value, 32, unsigned == undefined ? true : unsigned, endian);
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
    findInt64(value, unsigned, endian) {
        return fBigInt(this, value, unsigned == undefined ? true : unsigned, endian);
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
    findHalfFloat(value, endian) {
        return fHalfFloat(this, value, endian);
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
    findFloat(value, endian) {
        return fFloat(this, value, endian);
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
    findDoubleFloat(value, endian) {
        return fDoubleFloat(this, value, endian);
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
        return align(this, number);
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
        return alignRev(this, number);
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
        return skip(this, bytes, bits);
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
     * Change position directly to address.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    FSeek(byte, bit) {
        return goto(this, byte, bit);
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
    goto(byte, bit) {
        return goto(this, byte, bit);
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
        this.offset = 0;
        this.bitoffset = 0;
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
        this.offset = this.size;
        this.bitoffset = 0;
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
    delete(startOffset, endOffset, consume) {
        return remove(this, startOffset || 0, endOffset || this.offset, consume || false, true);
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
        return remove(this, this.offset, this.size, false, true);
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
        return remove(this, this.offset, this.size, false, true);
    }
    ;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {TemplateStringsArray} Removed data as ``Buffer`` or ``Uint8Array``
     */
    crop(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
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
    drop(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
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
    replace(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, true);
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
    overwrite(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, true);
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
    lift(startOffset, endOffset, consume, fillValue) {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
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
    fill(startOffset, endOffset, consume, fillValue) {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    extract(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    slice(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    wrap(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
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
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    insert(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, false);
    }
    ;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    place(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, false);
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
    unshift(data, consume) {
        return addData(this, data, consume || false, 0, false);
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
    prepend(data, consume) {
        return addData(this, data, consume || false, 0, false);
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
    push(data, consume) {
        return addData(this, data, consume || false, this.size, false);
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
    append(data, consume) {
        return addData(this, data, consume || false, this.size, false);
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
    xor(xorKey, startOffset, endOffset, consume) {
        var XORKey = xorKey;
        if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        }
        else if (!(this.isBufferOrUint8Array(XORKey) || typeof xorKey == "number")) {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return XOR(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xorThis(xorKey, length, consume) {
        var Length = length || 1;
        var XORKey = xorKey;
        if (typeof xorKey == "number") {
            Length = length || 1;
        }
        else if (typeof xorKey == "string") {
            const encoder = new TextEncoder().encode(xorKey);
            XORKey = encoder;
            Length = length || encoder.length;
        }
        else if (this.isBufferOrUint8Array(XORKey)) {
            Length = length || xorKey.length;
        }
        else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return XOR(this, XORKey, this.offset, this.offset + Length, consume || false);
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
    or(orKey, startOffset, endOffset, consume) {
        var ORKey = orKey;
        if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        }
        else if (!(this.isBufferOrUint8Array(ORKey) || typeof orKey == "number")) {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return OR(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        var Length = length || 1;
        var ORKey = orKey;
        if (typeof orKey == "number") {
            Length = length || 1;
        }
        else if (typeof orKey == "string") {
            const encoder = new TextEncoder().encode(orKey);
            ORKey = encoder;
            Length = length || encoder.length;
        }
        else if (this.isBufferOrUint8Array(ORKey)) {
            Length = length || orKey.length;
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return OR(this, ORKey, this.offset, this.offset + Length, consume || false);
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
    and(andKey, startOffset, endOffset, consume) {
        var ANDKey = andKey;
        if (typeof ANDKey == "string") {
            ANDKey = new TextEncoder().encode(ANDKey);
        }
        else if (!(typeof ANDKey == "object" || typeof ANDKey == "number")) {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return AND(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey, length, consume) {
        var Length = length || 1;
        var ANDKey = andKey;
        if (typeof andKey == "number") {
            Length = length || 1;
        }
        else if (typeof andKey == "string") {
            const encoder = new TextEncoder().encode(andKey);
            ANDKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof andKey == "object") {
            Length = length || andKey.length;
        }
        else {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return AND(this, ANDKey, this.offset, this.offset + Length, consume || false);
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
    add(addKey, startOffset, endOffset, consume) {
        var addedKey = addKey;
        if (typeof addedKey == "string") {
            addedKey = new TextEncoder().encode(addedKey);
        }
        else if (!(typeof addedKey == "object" || typeof addedKey == "number")) {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return ADD(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey, length, consume) {
        var Length = length || 1;
        var AddedKey = addKey;
        if (typeof AddedKey == "number") {
            Length = length || 1;
        }
        else if (typeof AddedKey == "string") {
            const encoder = new TextEncoder().encode(AddedKey);
            AddedKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof AddedKey == "object") {
            Length = length || AddedKey.length;
        }
        else {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return ADD(this, AddedKey, this.offset, this.offset + Length, consume || false);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    not(startOffset, endOffset, consume) {
        return NOT(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length, consume) {
        return NOT(this, this.offset, this.offset + (length || 1), consume || false);
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
    lShift(shiftKey, startOffset, endOffset, consume) {
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "string") {
            lShiftKey = new TextEncoder().encode(lShiftKey);
        }
        else if (!(typeof lShiftKey == "object" || typeof lShiftKey == "number")) {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return LSHIFT(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey, length, consume) {
        var Length = length || 1;
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        }
        else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        }
        else {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return LSHIFT(this, shiftKey, this.offset, this.offset + Length, consume || false);
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
    rShift(shiftKey, startOffset, endOffset, consume) {
        var rShiftKey = shiftKey;
        if (typeof rShiftKey == "string") {
            rShiftKey = new TextEncoder().encode(rShiftKey);
        }
        else if (!(typeof rShiftKey == "object" || typeof rShiftKey == "number")) {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return RSHIFT(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey, length, consume) {
        var Length = length || 1;
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        }
        else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        }
        else {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return RSHIFT(this, lShiftKey, this.offset, this.offset + Length, consume || false);
    }
    ;
    ///////////////////////////////
    // #region BIT READER
    ///////////////////////////////
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
     */
    writeBit(value, bits, unsigned, endian) {
        return wbit(this, value, bits, unsigned, endian);
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
        return wbit(this, value, bits, true, "big");
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
        return wbit(this, value, bits, unsigned, "big");
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
        return wbit(this, value, bits, true, "little");
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
        return wbit(this, value, bits, unsigned, "little");
    }
    ;
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
    readBit(bits, unsigned, endian) {
        return rbit(this, bits, unsigned, endian);
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
    readBitLE(bits, unsigned) {
        return this.readBit(bits, unsigned, "little");
    }
    ;
    ///////////////////////////////
    // #region BYTE READER
    ///////////////////////////////
    /**
     * Read byte.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number}
     */
    readByte(unsigned) {
        return rbyte(this, unsigned);
    }
    ;
    /**
     * Read multiple bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number[]}
     */
    readBytes(amount, unsigned) {
        return Array.from({ length: amount }, () => rbyte(this, unsigned));
    }
    ;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeByte(value, unsigned) {
        return wbyte(this, value, unsigned);
    }
    ;
    /**
     * Write multiple bytes.
     *
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeBytes(values, unsigned) {
        for (let i = 0; i < values.length; i++) {
            wbyte(this, values[i], unsigned);
        }
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    writeUByte(value) {
        return wbyte(this, value, true);
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
    ///////////////////////////////
    // #region INT16 READER
    ///////////////////////////////
    /**
     * Read short.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt16(unsigned, endian) {
        return rint16(this, unsigned, endian);
    }
    ;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt16(value, unsigned, endian) {
        return wint16(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value, endian) {
        return wint16(this, value, true, endian);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16BE(value) {
        return this.writeInt16(value, true, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    writeUInt16LE(value) {
        return this.writeInt16(value, true, "little");
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
     * Read unsigned short.
     *
     * @param {endian} endian - ``big`` or ``little``
     *
     * @returns {number}
     */
    readUInt16(endian) {
        return this.readInt16(true, endian);
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    readUInt16LE() {
        return this.readInt16(true, "little");
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
     * Read unsigned short in big endian.
     *
     * @returns {number}
     */
    readUInt16BE() {
        return this.readInt16(true, "big");
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
    ///////////////////////////////
    // #region HALF FLOAT
    ///////////////////////////////
    /**
     * Read half float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readHalfFloat(endian) {
        return rhalffloat(this, endian);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeHalfFloat(value, endian) {
        return whalffloat(this, value, endian);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatBE(value) {
        return this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    writeHalfFloatLE(value) {
        return this.writeHalfFloat(value, "little");
    }
    ;
    /**
    * Read half float.
    *
    * @returns {number}
    */
    readHalfFloatBE() {
        return this.readHalfFloat("big");
    }
    ;
    /**
     * Read half float.
     *
     * @returns {number}
     */
    readHalfFloatLE() {
        return this.readHalfFloat("little");
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
     * @returns {number}
     */
    readInt32(unsigned, endian) {
        return rint32(this, unsigned, endian);
    }
    ;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt32(value, unsigned, endian) {
        return wint32(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value, endian) {
        return wint32(this, value, true, endian);
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32LE(value) {
        return this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    writeUInt32LE(value) {
        return this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    writeInt32BE(value) {
        return this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32BE() {
        return this.readInt32(false, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    readUInt32BE() {
        return this.readInt32(true, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readInt32LE() {
        return this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {number}
     */
    readUInt32LE() {
        return this.readInt32(true, "little");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {number}
     */
    readUInt() {
        return this.readInt32(true);
    }
    ;
    ///////////////////////////////
    // #region FLOAT32 READER
    ///////////////////////////////
    /**
     * Read float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat(endian) {
        return rfloat(this, endian);
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat(value, endian) {
        return wfloat(this, value, endian);
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    writeFloatLE(value) {
        return this.writeFloat(value, "little");
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    writeFloatBE(value) {
        return this.writeFloat(value, "big");
    }
    ;
    /**
     * Read float.
     *
     * @returns {number}
     */
    readFloatBE() {
        return this.readFloat("big");
    }
    ;
    /**
     * Read float.
     *
     * @returns {number}
     */
    readFloatLE() {
        return this.readFloat("little");
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
     */
    readInt64(unsigned, endian) {
        return rint64(this, unsigned, endian);
    }
    ;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt64(value, unsigned, endian) {
        return wint64(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt64(value, endian) {
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
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    writeUInt64LE(value) {
        return this.writeInt64(value, true, "little");
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
    writeUInt64BE(value) {
        return this.writeInt64(value, true, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
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
     * @returns {BigValue}
     */
    readInt64BE() {
        return this.readInt64(false, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
     */
    readUInt64BE() {
        return this.readInt64(true, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {BigValue}
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
     * @returns {BigValue}
     */
    readUInt64LE() {
        return this.readInt64(true, "little");
    }
    ;
    ///////////////////////////////
    // #region FLOAT64 READER
    ///////////////////////////////
    /**
     * Read double float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian) {
        return rdfloat(this, endian);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value, endian) {
        return wdfloat(this, value, endian);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatBE(value) {
        return this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    writeDoubleFloatLE(value) {
        return this.writeDoubleFloat(value, "little");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    readDoubleFloatBE() {
        return this.readDoubleFloat("big");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {number}
     */
    readDoubleFloatLE() {
        return this.readDoubleFloat("little");
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
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    * @returns {string}
    */
    readString(options) {
        return rstring(this, options);
    }
    ;
    /**
    * Writes string, use options object for different types.
    *
    * @param {string} string - text string
    * @param {stringOptions?} options
    * @param {stringOptions["length"]?} options.length - for fixed length, non-terminate value utf strings
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    */
    writeString(string, options) {
        return wstring(this, string, options);
    }
    ;
}
_BiBase_data = new WeakMap();

/**
 * Binary reader, includes bitfields and strings.
 *
 * @param {string|Buffer|Uint8Array} input - File path or a ``Buffer`` or ``Uint8Array``. Always found in ``BiReader.data``
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 * @param {BiOptions["writeable"]} options.writeable - Allow data writes when reading a file (default false in reader)
 *
 * @since 2.0
 */
class BiReader extends BiBase {
    /**
     * Binary reader, includes bitfields and strings.
     *
     * @param {string|Buffer|Uint8Array} input - File path or a ``Buffer`` or ``Uint8Array``. Always found in ``BiReader.data``
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     * @param {BiOptions["writeable"]} options.writeable - Allow data writes when reading a file (default false in reader)
     */
    constructor(input, options = {}) {
        super(input, options.writeable ?? false);
        if (input == undefined) {
            throw new Error("Can not start BiReader without data.");
        }
        this.strict = true;
        this.enforceBigInt = (options?.enforceBigInt) ?? hasBigInt;
        if (options.extendBufferSize != undefined &&
            options.extendBufferSize != 0) {
            this.extendBufferSize = options.extendBufferSize;
        }
        if (options.endianness != undefined &&
            typeof options.endianness != "string") {
            throw new Error("Endian must be big or little");
        }
        if (options.endianness != undefined &&
            !(options.endianness == "big" || options.endianness == "little")) {
            throw new Error("Byte order must be big or little");
        }
        this.endian = options.endianness || "little";
        if (typeof options.strict == "boolean") {
            this.strict = options.strict;
        }
        else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true or false");
            }
        }
        if (input == undefined) {
            throw new Error("Data or file path required");
        }
        else {
            if (typeof input == "string") {
                this.filePath = input;
                this.mode = "file";
                this.offset = options.byteOffset ?? 0;
                this.bitoffset = options.bitOffset ?? 0;
            }
            else if (this.isBufferOrUint8Array(input)) {
                this.data = input;
                this.mode = "memory";
                this.size = this.data.length;
                this.sizeB = this.data.length * 8;
            }
            else {
                throw new Error("Write data must be Uint8Array or Buffer");
            }
        }
        if (options.byteOffset != undefined || options.bitOffset != undefined) {
            this.offset = ((Math.abs(options.byteOffset || 0)) + Math.ceil((Math.abs(options.bitOffset || 0)) / 8));
            // Adjust byte offset based on bit overflow
            this.offset += Math.floor((Math.abs(options.bitOffset || 0)) / 8);
            // Adjust bit offset
            this.bitoffset = Math.abs(normalizeBitOffset(options.bitOffset)) % 8;
            // Ensure bit offset stays between 0-7
            this.bitoffset = Math.min(Math.max(this.bitoffset, 0), 7);
            // Ensure offset doesn't go negative
            this.offset = Math.max(this.offset, 0);
            if (this.offset > this.size) {
                if (this.strict == false) {
                    if (this.extendBufferSize != 0) {
                        this.extendArray(this.extendBufferSize);
                    }
                    else {
                        this.extendArray(this.offset - this.size);
                    }
                }
                else {
                    throw new Error(`Starting offset outside of size: ${this.offset} of ${this.size}`);
                }
            }
        }
        if (this.mode == "file") {
            this.open();
        }
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
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["stripNull"]?} options.stripNull - removes 0x00 characters
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    * @returns {string}
    */
    string(options) {
        return this.readString(options);
    }
    ;
    /**
    * Reads string using setting from .strSettings
    *
    * Default is ``utf-8``
    *
    * @returns {string}
    */
    get str() {
        return this.readString(this.strSettings);
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
        return this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
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
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
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
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
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
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
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
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
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
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: endian });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little" });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "big" });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: endian });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little" });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "big" });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: endian });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little" });
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
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "big" });
    }
    ;
    /**
    * Reads Wide-Pascal string.
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
    * Reads Wide-Pascal string 1 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring1(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: endian, stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string 1 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring1le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: "little", stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string 1 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring1be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: "big", stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string 2 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring2(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: endian, stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring2le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring2be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "big", stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string 4 byte length read.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    *
    * @returns {string}
    */
    wpstring4(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: endian, stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring4be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull });
    }
    ;
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    *
    * @returns {string}
    */
    wpstring4le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull });
    }
    ;
}

/**
 * Binary writer, includes bitfields and strings.
 *
 * @param {string|Buffer|Uint8Array} input - File path or a ``Buffer`` or ``Uint8Array``. Always found in ``BiWriter.data``
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 * @param {BiOptions["writeable"]} options.writeable - Allow data writes when reading a file (default true in writer)
 *
 * @since 2.0
 */
class BiWriter extends BiBase {
    /**
     * Binary writer, includes bitfields and strings.
     *
     * @param {string|Buffer|Uint8Array} input - ``Buffer`` or ``Uint8Array``. Always found in ``BiWriter.data``
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     * @param {BiOptions["writeable"]} options.writeable - Allow data writes when reading a file (default true in writer)
     */
    constructor(input, options = {}) {
        super(input, options.writeable ?? true);
        this.strict = false;
        this.enforceBigInt = (options?.enforceBigInt) ?? hasBigInt;
        if (options.extendBufferSize != undefined &&
            options.extendBufferSize != 0) {
            this.extendBufferSize = options.extendBufferSize;
        }
        if (input == undefined) {
            input = new Uint8Array(this.extendBufferSize);
            console.warn(`BiWriter started without data. Creating Uint8Array with extendBufferSize.`);
        }
        if (options.endianness != undefined &&
            typeof options.endianness != "string") {
            throw new Error("endianness must be big or little.");
        }
        if (options.endianness != undefined &&
            !(options.endianness == "big" || options.endianness == "little")) {
            throw new Error("Endianness must be big or little.");
        }
        this.endian = options.endianness || "little";
        if (typeof options.strict == "boolean") {
            this.strict = options.strict;
        }
        else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true or false.");
            }
        }
        if (input == undefined) {
            throw new Error("Data or file path required");
        }
        else {
            if (typeof input == "string") {
                this.filePath = input;
                this.mode = "file";
                this.offset = options.byteOffset ?? 0;
                this.bitoffset = options.bitOffset ?? 0;
            }
            else if (this.isBufferOrUint8Array(input)) {
                this.data = input;
                this.mode = "memory";
                this.size = this.data.length;
                this.sizeB = this.data.length * 8;
            }
            else {
                throw new Error("Write data must be Uint8Array or Buffer");
            }
        }
        if (options.byteOffset != undefined || options.bitOffset != undefined) {
            this.offset = ((Math.abs(options.byteOffset || 0)) + Math.ceil((Math.abs(options.bitOffset || 0)) / 8));
            // Adjust byte offset based on bit overflow
            this.offset += Math.floor((Math.abs(options.bitOffset || 0)) / 8);
            // Adjust bit offset
            this.bitoffset = Math.abs(normalizeBitOffset(options.bitOffset)) % 8;
            // Ensure bit offset stays between 0-7
            this.bitoffset = Math.min(Math.max(this.bitoffset, 0), 7);
            // Ensure offset doesn't go negative
            this.offset = Math.max(this.offset, 0);
            if (this.offset > this.size) {
                if (this.strict == false) {
                    if (this.extendBufferSize != 0) {
                        this.extendArray(this.extendBufferSize);
                    }
                    else {
                        this.extendArray(this.offset - this.size);
                    }
                }
                else {
                    throw new Error(`Starting offset outside of size: ${this.offset} of ${this.size}`);
                }
            }
        }
        if (this.mode == "file") {
            this.open();
        }
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
    set writeUInt32BE(value) {
        this.writeInt32(value, true, "big");
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
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    */
    string(string, options) {
        return this.writeString(string, options);
    }
    ;
    /**
    * Writes string using setting from .strSettings
    *
    * Default is ``utf-8``
    *
    * @param {string} string - text string
    */
    set str(string) {
        this.writeString(string, this.strSettings);
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
        return this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
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
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
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
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
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
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
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
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
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
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
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
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian });
    }
    ;
    /**
    * Writes Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring1le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little" });
    }
    ;
    /**
    * Writes Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring1be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big" });
    }
    ;
    /**
    * Writes Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring2(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: endian });
    }
    ;
    /**
    * Writes Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring2le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little" });
    }
    ;
    /**
    * Writes Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring2be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big" });
    }
    ;
    /**
    * Writes Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    pstring4(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian });
    }
    ;
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    pstring4be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big" });
    }
    ;
    /**
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    pstring4le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string.
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
    * Writes Wide-Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string, lengthWriteSize) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big" });
    }
    ;
    /**
    * Writes Wide-Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string, lengthWriteSize) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring1(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian });
    }
    ;
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring1be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big" });
    }
    ;
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring1le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring2(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian });
    }
    ;
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring2le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring2be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big" });
    }
    ;
    /**
    * Writes Wide-Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    wpstring4(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian });
    }
    ;
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    wpstring4le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    wpstring4be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big" });
    }
    ;
}

/**
 * Isn't usable in browser.
 * @since 3.0
 * @deprecated Use ``BiReader`` instead.
 */
class BiReaderStream {
    constructor() {
        throw new Error("BiReaderStream isn't usable in browser. Use BiReader instead.");
    }
}
/**
 * Isn't usable in browser.
 * @since 4.0
 * @deprecated Use ``BiReader`` instead.
 */
class BiFileReader {
    constructor() {
        throw new Error("BiFileReader isn't usable in browser. Use BiReader instead.");
    }
}
/**
 * Isn't usable in browser.
 * @since 3.0
 * @deprecated Use ``BiWriter`` instead.
 */
class BiWriterStream {
    constructor() {
        throw new Error("BiReaderStream isn't usable in browser. Use BiReader instead.");
    }
}
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
 * @since 3.0
 * @deprecated Use ``BiWriter`` instead.
 */
class biwriter {
    constructor() {
        throw new Error("biwriter is deprecated. Use BiWriter instead.");
    }
}
/**
 * Isn't usable in browser.
 * @since 4.0
 * @deprecated Use ``BiWriter`` instead.
 */
class BiFileWriter {
    constructor() {
        throw new Error("BiWriterStream isn't usable in browser. Use BiWriter instead.");
    }
}

export { BiBase, BiFileReader, BiFileWriter, BiReader, BiReaderStream, BiWriter, BiWriterStream, bireader, biwriter, hexdump };
//# sourceMappingURL=index.browser.js.map
