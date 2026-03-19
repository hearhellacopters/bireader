import fs$1 from 'fs';
import { constants } from 'buffer';
import fs$2 from 'fs/promises';

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
const bufferConstants$2 = { MAX_LENGTH: 2147483647 }; // 2 gigs
var fs;
(async function () {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // We are in Node.js
        try {
            if (typeof require !== 'undefined') {
                fs = require('fs');
                const buffer = require("buffer");
                bufferConstants$2.MAX_LENGTH = buffer.constants.MAX_LENGTH;
            }
            else {
                fs = await import('fs');
                const buffer = await import('buffer');
                bufferConstants$2.MAX_LENGTH = buffer.constants.MAX_LENGTH;
            }
        }
        catch (error) {
            console.error('Failed to load fs and buffer module:', error);
        }
    }
})();
function MAX_LENGTH$2() {
    return bufferConstants$2.MAX_LENGTH;
}
function hexDumpBase$2(ctx, options = {}) {
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
function skip$2(ctx, bytes, bits) {
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
function align$2(ctx, n) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(n - a);
    }
}
function alignRev$2(ctx, n) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(a * -1);
    }
}
function goto$2(ctx, bytes, bits) {
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
function check_size$2(ctx, write_bytes, write_bit, offset) {
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
function extendarray$2(ctx, to_padd) {
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
function remove$2(ctx, startOffset, endOffset, consume, remove, fillValue) {
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
function addData$2(ctx, data, consume, offset, replace) {
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
function AND$2(ctx, and_key, start, end, consume) {
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
function OR$2(ctx, or_key, start, end, consume) {
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
function XOR$2(ctx, xor_key, start, end, consume) {
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
function NOT$2(ctx, start, end, consume) {
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
function LSHIFT$2(ctx, shift_key, start, end, consume) {
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
function RSHIFT$2(ctx, shift_key, start, end, consume) {
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
function ADD$2(ctx, add_key, start, end, consume) {
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
function fString$2(ctx, searchString) {
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
function fNumber$2(ctx, targetNumber, bits, unsigned, endian) {
    ctx.open();
    check_size$2(ctx, Math.floor(bits / 8), 0);
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
function fHalfFloat$2(ctx, targetNumber, endian) {
    ctx.open();
    check_size$2(ctx, 2, 0);
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
function fFloat$2(ctx, targetNumber, endian) {
    ctx.open();
    check_size$2(ctx, 4, 0);
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
function fBigInt$2(ctx, targetNumber, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size$2(ctx, 8, 0);
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
function fDoubleFloat$2(ctx, targetNumber, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size$2(ctx, 8, 0);
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
function wbit$2(ctx, value, bits, unsigned, endian) {
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
function rbit$2(ctx, bits, unsigned, endian) {
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
function wbyte$2(ctx, value, unsigned) {
    ctx.open();
    check_size$2(ctx, 1, 0);
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
function rbyte$2(ctx, unsigned) {
    ctx.open();
    check_size$2(ctx, 1);
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
function wint16$2(ctx, value, unsigned, endian) {
    ctx.open();
    check_size$2(ctx, 2, 0);
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
function rint16$2(ctx, unsigned, endian) {
    ctx.open();
    check_size$2(ctx, 2);
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
function rhalffloat$2(ctx, endian) {
    if (canFloat16) {
        ctx.open();
        check_size$2(ctx, 2);
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
function whalffloat$2(ctx, value, endian) {
    ctx.open();
    check_size$2(ctx, 2, 0);
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
function wint32$2(ctx, value, unsigned, endian) {
    ctx.open();
    check_size$2(ctx, 4, 0);
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
function rint32$2(ctx, unsigned, endian) {
    ctx.open();
    check_size$2(ctx, 4);
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
function rfloat$2(ctx, endian) {
    if (canFloat32) {
        ctx.open();
        check_size$2(ctx, 4);
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
function wfloat$2(ctx, value, endian) {
    ctx.open();
    check_size$2(ctx, 4, 0);
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
function rint64$2(ctx, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size$2(ctx, 8);
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
function wint64$2(ctx, value, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size$2(ctx, 8, 0);
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
function wdfloat$2(ctx, value, endian) {
    ctx.open();
    check_size$2(ctx, 8, 0);
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
function rdfloat$2(ctx, endian) {
    if (canFloat64) {
        ctx.open();
        check_size$2(ctx, 8, 0);
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
function rstring$2(ctx, options) {
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
        check_size$2(ctx, length);
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
function wstring$2(ctx, string, options) {
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
        check_size$2(ctx, totalLength, 0);
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
        check_size$2(ctx, totalLength, 0);
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
            this.maxFileSize = MAX_LENGTH$2() || 0x80000000;
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
            this.maxFileSize = MAX_LENGTH$2();
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
        return extendarray$2(this, to_padd);
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
        return hexDumpBase$2(this, options);
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
        return fString$2(this, string);
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
        return fNumber$2(this, value, 8, unsigned == undefined ? true : unsigned, endian);
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
        return fNumber$2(this, value, 16, unsigned == undefined ? true : unsigned, endian);
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
        return fNumber$2(this, value, 32, unsigned == undefined ? true : unsigned, endian);
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
        return fBigInt$2(this, value, unsigned == undefined ? true : unsigned, endian);
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
        return fHalfFloat$2(this, value, endian);
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
        return fFloat$2(this, value, endian);
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
        return fDoubleFloat$2(this, value, endian);
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
        return align$2(this, number);
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
        return alignRev$2(this, number);
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
        return skip$2(this, bytes, bits);
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
        return goto$2(this, byte, bit);
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
        return goto$2(this, byte, bit);
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
        return remove$2(this, startOffset || 0, endOffset || this.offset, consume || false, true);
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
        return remove$2(this, this.offset, this.size, false, true);
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
        return remove$2(this, this.offset, this.size, false, true);
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
        return remove$2(this, this.offset, this.offset + (length || 0), consume || false, true);
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
        return remove$2(this, this.offset, this.offset + (length || 0), consume || false, true);
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
        return addData$2(this, data, consume || false, offset || this.offset, true);
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
        return addData$2(this, data, consume || false, offset || this.offset, true);
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
        return remove$2(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
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
        return remove$2(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
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
        return remove$2(this, this.offset, this.offset + (length || 0), consume || false, false);
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
        return remove$2(this, this.offset, this.offset + (length || 0), consume || false, false);
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
        return remove$2(this, this.offset, this.offset + (length || 0), consume || false, false);
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
        return addData$2(this, data, consume || false, offset || this.offset, false);
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
        return addData$2(this, data, consume || false, offset || this.offset, false);
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
        return addData$2(this, data, consume || false, 0, false);
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
        return addData$2(this, data, consume || false, 0, false);
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
        return addData$2(this, data, consume || false, this.size, false);
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
        return addData$2(this, data, consume || false, this.size, false);
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
        return XOR$2(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return XOR$2(this, XORKey, this.offset, this.offset + Length, consume || false);
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
        return OR$2(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return OR$2(this, ORKey, this.offset, this.offset + Length, consume || false);
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
        return AND$2(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return AND$2(this, ANDKey, this.offset, this.offset + Length, consume || false);
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
        return ADD$2(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return ADD$2(this, AddedKey, this.offset, this.offset + Length, consume || false);
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
        return NOT$2(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length, consume) {
        return NOT$2(this, this.offset, this.offset + (length || 1), consume || false);
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
        return LSHIFT$2(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return LSHIFT$2(this, shiftKey, this.offset, this.offset + Length, consume || false);
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
        return RSHIFT$2(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return RSHIFT$2(this, lShiftKey, this.offset, this.offset + Length, consume || false);
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
        return wbit$2(this, value, bits, unsigned, endian);
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
        return wbit$2(this, value, bits, true, "big");
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
        return wbit$2(this, value, bits, unsigned, "big");
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
        return wbit$2(this, value, bits, true, "little");
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
        return wbit$2(this, value, bits, unsigned, "little");
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
        return rbit$2(this, bits, unsigned, endian);
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
        return rbyte$2(this, unsigned);
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
        return Array.from({ length: amount }, () => rbyte$2(this, unsigned));
    }
    ;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeByte(value, unsigned) {
        return wbyte$2(this, value, unsigned);
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
            wbyte$2(this, values[i], unsigned);
        }
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    writeUByte(value) {
        return wbyte$2(this, value, true);
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
        return rint16$2(this, unsigned, endian);
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
        return wint16$2(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value, endian) {
        return wint16$2(this, value, true, endian);
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
        return rhalffloat$2(this, endian);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeHalfFloat(value, endian) {
        return whalffloat$2(this, value, endian);
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
        return rint32$2(this, unsigned, endian);
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
        return wint32$2(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value, endian) {
        return wint32$2(this, value, true, endian);
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
        return rfloat$2(this, endian);
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat(value, endian) {
        return wfloat$2(this, value, endian);
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
        return rint64$2(this, unsigned, endian);
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
        return wint64$2(this, value, unsigned, endian);
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
        return rdfloat$2(this, endian);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value, endian) {
        return wdfloat$2(this, value, endian);
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
        return rstring$2(this, options);
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
        return wstring$2(this, string, options);
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

var _BiBaseLegacy_data;
var bufferConstants$1 = constants;
function MAX_LENGTH$1() {
    return bufferConstants$1.MAX_LENGTH;
}
function hexDumpBase$1(ctx, options = {}) {
    var length = options && options.length;
    var startByte = options && options.startByte;
    if ((startByte || 0) > ctx.size) {
        ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
        throw new Error("Hexdump start is outside of data size: " + startByte + " of " + ctx.size);
    }
    const start = startByte || ctx.offset;
    const end = Math.min(start + (length || 192), ctx.size);
    if (start + (length || 0) > ctx.size) {
        throw new Error("Hexdump amount is outside of data size: " + (start + (length || 0)) + " of " + end);
    }
    const data = ctx.read(start, end - start, false);
    return _hexDump(data, options, start, end);
}
function skip$1(ctx, bytes, bits) {
    var new_size = (((bytes || 0) + ctx.offset) + Math.ceil((ctx.bitoffset + (bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0) + ctx.offset) * 8) + ctx.bitoffset + (bits || 0)) / 8);
    }
    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray(new_size - ctx.size);
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
function align$1(ctx, n) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(n - a);
    }
}
function alignRev$1(ctx, n) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(a * -1);
    }
}
function goto$1(ctx, bytes, bits) {
    var new_size = (((bytes || 0)) + Math.ceil(((bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0)) * 8) + (bits || 0)) / 8);
    }
    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray(new_size - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump() : "";
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
function check_size$1(ctx, write_bytes, write_bit, offset) {
    const bits = (write_bit || 0) + ctx.bitoffset;
    var new_off = (ctx.offset);
    var writesize = write_bytes || 0;
    if (bits != 0) {
        //add bits
        writesize += Math.ceil(bits / 8);
    }
    // if bigger extend
    const needed_size = new_off + writesize;
    if (needed_size > ctx.size) {
        const dif = needed_size - ctx.size;
        if (ctx.strict == false) {
            ctx.extendArray(dif);
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: ` + needed_size + " at " + ctx.offset + " of " + ctx.size);
        }
    }
    //start read location
    return new_off;
}
function extendarray$1(ctx, to_padd) {
    ctx.open();
    if (fs$1 == undefined) {
        throw new Error("Can't use BitFile without Node.");
    }
    if (ctx.fd === null) {
        throw new Error('File is not open yet.');
    }
    if (ctx.strict) {
        throw new Error('File position is outside of file size while in strict mode.');
    }
    if (ctx.extendBufferSize != 0) {
        if (ctx.extendBufferSize > to_padd) {
            to_padd = ctx.extendBufferSize;
        }
    }
    try {
        fs$1.ftruncateSync(ctx.fd, ctx.size + to_padd);
    }
    catch (error) {
        throw new Error(error);
    }
    ctx.updateSize();
}
function remove$1(ctx, startOffset, endOffset, consume, remove, fillValue) {
    ctx.open();
    const new_start = Math.abs(startOffset || 0);
    const new_offset = (endOffset || ctx.offset);
    if (fs$1 == undefined) {
        throw new Error("Can only use BiStream in Node.");
    }
    if (ctx.fd == null) {
        throw new Error("File is not open.");
    }
    if (new_offset > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray(new_offset - ctx.size);
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
    const removedLength = new_offset - new_start;
    if (ctx.maxFileSize && removedLength > ctx.maxFileSize) {
        // can not return buffer, cant extract, must write new file of removed data
        // if not removed, only fill, just creat a new file with filled data 
        if (fillValue != undefined && remove == false) {
            // fills current file, no need to dupe 
            console.warn(`File size for return Buffer is larger than the max Buffer Node can handle.`);
            var readStart = new_start;
            var amount = removedLength;
            const chunkSize = 64 * 1024; // 64 KB
            const chunk = new Uint8Array(chunkSize).fill(fillValue & 0xff);
            while (amount) {
                const toWrite = Math.min(chunkSize, amount);
                var bytesWritten;
                try {
                    bytesWritten = fs$1.readSync(ctx.fd, chunk, 0, toWrite, readStart);
                }
                catch (error) {
                    throw new Error(error);
                }
                amount -= bytesWritten;
                readStart += bytesWritten;
            }
        }
        else if (remove) {
            // dupe file for extract, remove data
            const removeData = ctx.filePath + NaN + startOffset + "_" + removedLength + ".removed";
            console.warn(`File size for removal is larger than the max Buffer Node can handle, creating new file ${removeData}`);
            const CHUNK_SIZE = 64 * 1024;
            // Copy removed to new file
            var readOffset = new_start;
            var writeOffset = 0;
            var amount = removedLength;
            const chunk = new Uint8Array(CHUNK_SIZE);
            try {
                const tempFd = fs$1.openSync(removeData, 'w+');
                while (amount) {
                    const toRead = Math.min(CHUNK_SIZE, amount);
                    const bytesRead = fs$1.readSync(ctx.fd, chunk, 0, toRead, readOffset);
                    fs$1.writeSync(tempFd, chunk, 0, bytesRead, writeOffset);
                    amount -= bytesRead;
                    readOffset += bytesRead;
                    writeOffset += bytesRead;
                }
                fs$1.closeSync(tempFd);
            }
            catch (error) {
                throw new Error(error);
            }
            // reorder data and trim
            readOffset = new_start + removedLength;
            writeOffset = new_start;
            amount = removedLength;
            try {
                while (amount) {
                    const toRead = Math.min(CHUNK_SIZE, amount);
                    const bytesRead = fs$1.readSync(ctx.fd, chunk, 0, toRead, readOffset);
                    fs$1.writeSync(ctx.fd, chunk, 0, bytesRead, writeOffset);
                    amount -= bytesRead;
                    readOffset += bytesRead;
                    writeOffset += bytesRead;
                }
                fs$1.ftruncateSync(ctx.fd, ctx.size - removedLength);
            }
            catch (error) {
                throw new Error(error);
            }
            ctx.updateSize();
        }
        else {
            // no remove, can't extract
            const removeData = ctx.filePath + NaN + startOffset + "_" + removedLength + ".removed";
            console.warn(`File size for extract is larger than the max Buffer Node can handle, creating new file ${removeData}`);
            const CHUNK_SIZE = 64 * 1024;
            const chunk = new Uint8Array(CHUNK_SIZE);
            // Copy removed to new file
            var readOffset = new_start;
            var writeOffset = 0;
            var amount = removedLength;
            try {
                const tempFd = fs$1.openSync(removeData, 'w+');
                while (amount) {
                    const toRead = Math.min(CHUNK_SIZE, amount);
                    const bytesRead = fs$1.readSync(ctx.fd, chunk, 0, toRead, readOffset);
                    fs$1.writeSync(tempFd, chunk, 0, bytesRead, writeOffset);
                    amount -= bytesRead;
                    readOffset += bytesRead;
                    writeOffset += bytesRead;
                }
                fs$1.closeSync(tempFd);
            }
            catch (error) {
                throw new Error(error);
            }
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
        return Buffer.alloc(0);
    }
    else {
        if (remove) {
            const removedBuffer = ctx.read(new_start, removedLength, false);
            const end = new_start + removedLength;
            const chunkSize = 64 * 1024;
            const buffer = new Uint8Array(chunkSize);
            var remaining = ctx.size - end;
            var readPos = end;
            try {
                while (remaining > 0) {
                    const actualRead = Math.min(chunkSize, remaining);
                    fs$1.readSync(ctx.fd, buffer, 0, actualRead, readPos);
                    fs$1.writeSync(ctx.fd, buffer, 0, actualRead, readPos - removedLength);
                    readPos += actualRead;
                    remaining -= actualRead;
                }
                fs$1.ftruncateSync(ctx.fd, ctx.size - removedLength);
            }
            catch (error) {
                throw new Error(error);
            }
            ctx.updateSize();
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
            return removedBuffer;
        }
        else {
            if (fillValue != undefined) {
                const removedBuffer = new Uint8Array(removedLength);
                removedBuffer.fill(fillValue & 0xff);
                try {
                    fs$1.writeSync(ctx.fd, removedBuffer, 0, removedBuffer.length, new_start);
                }
                catch (error) {
                    throw new Error(error);
                }
                if (consume == true) {
                    ctx.offset = new_offset;
                    ctx.bitoffset = 0;
                }
                ctx.data = Buffer.from(removedBuffer);
                ctx.updateView();
                return ctx.data;
            }
            else {
                // just copying and returning data
                const removedBuffer = ctx.read(new_start, removedLength, false);
                if (consume == true) {
                    ctx.offset = new_offset;
                    ctx.bitoffset = 0;
                }
                ctx.data = removedBuffer;
                ctx.updateView();
                return removedBuffer;
            }
        }
    }
}
function addData$1(ctx, data, consume, offset, replace) {
    if (ctx.strict == true) {
        ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
        throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Can not insert data in strict mode. Use unrestrict() to enable.`);
    }
    ctx.open();
    if (fs$1 == undefined) {
        throw new Error("Can only use BiStream in Node.");
    }
    if (ctx.fd == null) {
        throw new Error("File is not open.");
    }
    offset = (offset || ctx.offset);
    var newSize = offset + data.length;
    const originalSize = ctx.size;
    const insertLength = data.length;
    if (data.length === 0) {
        return;
    }
    if (newSize > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray(newSize - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + newSize + " of " + ctx.size);
        }
    }
    if (!arrayBufferCheck(data)) {
        throw new Error('Data must be a Uint8Array or Buffer');
    }
    if (Buffer.isBuffer(data)) {
        data = new Uint8Array(data);
    }
    if (replace) {
        // overwrite
        try {
            fs$1.writeSync(ctx.fd, data, 0, data.length, offset);
        }
        catch (error) {
            throw new Error(error);
        }
        ctx.updateSize();
    }
    else {
        // insert
        const chunkSize = 64 * 1024; // 64KB
        const buffer = new Uint8Array(chunkSize);
        var remaining = originalSize - offset;
        var readPos = originalSize - chunkSize;
        try {
            while (remaining > 0) {
                const actualRead = Math.min(chunkSize, remaining);
                readPos = offset + remaining - actualRead;
                const writePos = readPos + insertLength;
                fs$1.readSync(ctx.fd, buffer, 0, actualRead, readPos);
                fs$1.writeSync(ctx.fd, buffer, 0, actualRead, writePos);
                remaining -= actualRead;
            }
            // Write the insert data at offset
            fs$1.writeSync(ctx.fd, data, 0, insertLength, offset);
        }
        catch (error) {
            throw new Error(error);
        }
        ctx.size = newSize;
    }
    if (consume == true) {
        ctx.offset = newSize;
        ctx.bitoffset = 0;
    }
    return;
}
function AND$1(ctx, and_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray((end || 0) - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    var new_start = (start || 0);
    const new_end = Math.min(end || ctx.size, ctx.size);
    const previousStart = ctx.offset;
    if (typeof and_key == "number") {
        while (new_start <= new_end) {
            const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
            if (input.length == 0) {
                break;
            }
            for (let i = 0; i < input.length; i++) {
                input[i] = input[i] & (and_key & 0xff);
            }
            ctx.commit(true);
            new_start += input.length;
        }
        return;
    }
    else {
        if (typeof and_key == "string") {
            and_key = Uint8Array.from(Array.from(and_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(and_key)) {
            var keyIndex = -1;
            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    if (keyIndex != and_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    }
                    else {
                        keyIndex = 0;
                    }
                    input[i] = input[i] & and_key[keyIndex];
                }
                ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
        }
    }
    if (!consume) {
        ctx.offset = previousStart;
    }
    return;
}
function OR$1(ctx, or_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray((end || 0) - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    var new_start = (start || 0);
    const new_end = Math.min(end || ctx.size, ctx.size);
    const previousStart = ctx.offset;
    if (typeof or_key == "number") {
        while (new_start <= new_end) {
            const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
            if (input.length == 0) {
                break;
            }
            for (let i = 0; i < input.length; i++) {
                input[i] = input[i] | (or_key & 0xff);
            }
            ctx.commit(true);
            new_start += input.length;
        }
    }
    else {
        if (typeof or_key == "string") {
            or_key = Uint8Array.from(Array.from(or_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(or_key)) {
            var number = -1;
            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    if (number != or_key.length - 1) {
                        number = number + 1;
                    }
                    else {
                        number = 0;
                    }
                    input[i] = input[i] | or_key[number];
                }
                ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
    if (!consume) {
        ctx.offset = previousStart;
    }
    return;
}
function XOR$1(ctx, xor_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray((end || 0) - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    var new_start = (start || 0);
    const new_end = Math.min(end || ctx.size, ctx.size);
    const previousStart = ctx.offset;
    if (typeof xor_key == "number") {
        while (new_start <= new_end) {
            const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
            if (input.length == 0) {
                break;
            }
            for (let i = 0; i < input.length; i++) {
                input[i] = input[i] ^ (xor_key & 0xff);
            }
            ctx.commit(true);
            new_start += input.length;
        }
    }
    else {
        if (typeof xor_key == "string") {
            xor_key = Uint8Array.from(Array.from(xor_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(xor_key)) {
            var keyIndex = -1;
            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    if (keyIndex != xor_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    }
                    else {
                        keyIndex = 0;
                    }
                    input[i] = input[i] ^ xor_key[keyIndex];
                }
                ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
    if (!consume) {
        ctx.offset = previousStart;
    }
    return;
}
function NOT$1(ctx, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray((end || 0) - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    var new_start = (start || 0);
    const new_end = Math.min(end || ctx.size, ctx.size);
    const previousStart = ctx.offset;
    while (new_start <= new_end) {
        const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
        if (input.length == 0) {
            break;
        }
        for (let i = 0; i < input.length; i++) {
            input[i] = ~input[i];
        }
        ctx.commit(true);
        new_start += input.length;
    }
    if (!consume) {
        ctx.offset = previousStart;
    }
    return;
}
function LSHIFT$1(ctx, shift_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray((end || 0) - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    var new_start = (start || 0);
    const new_end = Math.min(end || ctx.size, ctx.size);
    const previousStart = ctx.offset;
    if (typeof shift_key == "number") {
        while (new_start <= new_end) {
            const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
            if (input.length == 0) {
                break;
            }
            for (let i = 0; i < input.length; i++) {
                input[i] = input[i] << shift_key;
            }
            ctx.commit(true);
            new_start += input.length;
        }
    }
    else {
        if (typeof shift_key == "string") {
            shift_key = Uint8Array.from(Array.from(shift_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(shift_key)) {
            let keyIndex = -1;
            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                    if (keyIndex != shift_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    }
                    else {
                        keyIndex = 0;
                    }
                    input[i] = input[i] << shift_key[keyIndex];
                }
                ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
    if (!consume) {
        ctx.offset = previousStart;
    }
    return;
}
function RSHIFT$1(ctx, shift_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray((end || 0) - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    var new_start = (start || 0);
    const new_end = Math.min(end || ctx.size, ctx.size);
    const previousStart = ctx.offset;
    if (typeof shift_key == "number") {
        while (new_start <= new_end) {
            const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
            if (input.length == 0) {
                break;
            }
            for (let i = 0; i < input.length; i++) {
                input[i] = input[i] >> shift_key;
            }
            ctx.commit(true);
            new_start += input.length;
        }
        return;
    }
    else {
        if (typeof shift_key == "string") {
            shift_key = Uint8Array.from(Array.from(shift_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(shift_key)) {
            var keyIndex = -1;
            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    if (keyIndex != shift_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    }
                    else {
                        keyIndex = 0;
                    }
                    input[i] = input[i] >> shift_key[keyIndex];
                }
                ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
    if (!consume) {
        ctx.offset = previousStart;
    }
    return;
}
function ADD$1(ctx, add_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            ctx.extendArray((end || 0) - ctx.size);
        }
        else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    var new_start = (start || 0);
    const new_end = Math.min(end || ctx.size, ctx.size);
    const previousStart = ctx.offset;
    if (typeof add_key == "number") {
        while (new_start <= new_end) {
            const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
            if (input.length == 0) {
                break;
            }
            for (let i = 0; i < input.length; i++) {
                input[i] = input[i] + add_key;
            }
            ctx.commit(true);
            new_start += input.length;
        }
    }
    else {
        if (typeof add_key == "string") {
            add_key = Uint8Array.from(Array.from(add_key).map(letter => letter.charCodeAt(0)));
        }
        if (arrayBufferCheck(add_key)) {
            var keyIndex = -1;
            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    if (keyIndex != add_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    }
                    else {
                        keyIndex = 0;
                    }
                    input[i] = input[i] + add_key[keyIndex];
                }
                ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
    if (!consume) {
        ctx.offset = previousStart;
    }
    return;
}
function fString$1(ctx, searchString) {
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    var lastChunk = new Uint8Array(0);
    const searchStringBuffer = new TextEncoder().encode(searchString);
    var start = ctx.offset;
    const strict_saver = ctx.strict;
    ctx.strict = true;
    while (start < ctx.size) {
        const currentChunk = ctx.read(start, Math.min(chunkSize, ctx.size - start), false);
        if (currentChunk.length === 0) { // No more data to read
            break;
        }
        // Concatenate the last part of the previous chunk with the current chunk
        const combinedBuffer = Buffer.concat([lastChunk, new Uint8Array(currentChunk)]);
        // Search for the string in the combined buffer
        var offset = 0;
        while (offset <= combinedBuffer.length - searchStringBuffer.length) {
            const index = combinedBuffer.indexOf(searchStringBuffer, offset);
            if (index === -1) {
                break;
            }
            // Found the search string
            ctx.strict = strict_saver;
            return start + index - lastChunk.length;
        }
        // Update the last chunk for the next iteration
        lastChunk = new Uint8Array(currentChunk.subarray(-searchStringBuffer.length + 1));
        start += currentChunk.length;
    }
    ctx.strict = strict_saver;
    return -1;
}
function fNumber$1(ctx, targetNumber, bits, unsigned, endian) {
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    let lastChunk = new Uint8Array(0);
    const totalBits = Math.floor(bits / 8);
    var start = ctx.offset;
    while (start < ctx.size) {
        const currentChunk = ctx.read(start, Math.min(chunkSize, ctx.size - start), false);
        if (currentChunk.length === 0) { // No more data to read
            break;
        }
        // Concatenate the last part of the previous chunk with the current chunk
        const combinedBuffer = Buffer.concat([lastChunk, new Uint8Array(currentChunk)]);
        // Process the combined buffer to find the target number
        for (let z = 0; z <= combinedBuffer.length - totalBits; z++) {
            var value = 0;
            var off_in_bits = 0;
            for (let i = 0; i < bits;) {
                const remaining = bits - i;
                const bitOffset = off_in_bits & 7;
                const currentByte = combinedBuffer[z + (off_in_bits >> 3)];
                const read = Math.min(remaining, 8 - bitOffset);
                if ((endian !== undefined ? endian : ctx.endian) === "big") {
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
            if (unsigned === true || bits <= 7) {
                value = value >>> 0;
            }
            else {
                if (bits !== 32 && (value & (1 << (bits - 1)))) {
                    value |= -1 ^ ((1 << bits) - 1);
                }
            }
            if (value === targetNumber) {
                return start + z - lastChunk.length; // Found the byte, return the index from current
            }
        }
        // Update the last chunk for the next iteration
        lastChunk = new Uint8Array(combinedBuffer.subarray(-totalBits + 1));
        start += currentChunk.length;
    }
    return -1; // number not found
}
function fHalfFloat$1(ctx, targetNumber, endian) {
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    let size = 2;
    for (let position = 0; position <= ctx.size - size;) {
        const buffer = ctx.read(position, Math.min(chunkSize, ctx.size - position), false);
        if (buffer.length == 0) {
            break;
        }
        const data = new Uint8Array(buffer);
        for (let z = 0; z <= data.length - size; z++) {
            var value = 0;
            if ((endian !== undefined ? endian : ctx.endian) === "little") {
                value = (data[z + 1] << 8) | data[z];
            }
            else {
                value = (data[z] << 8) | data[z + 1];
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
                return position + z; // Found the number, return the index
            }
        }
        position += buffer.length;
    }
    return -1; // number not found
}
function fFloat$1(ctx, targetNumber, endian) {
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    const size = 4; // Size of float in bytes
    for (let position = 0; position <= ctx.size - size;) {
        const buffer = ctx.read(position, Math.min(chunkSize, ctx.size - position));
        if (buffer.length == 0) {
            break;
        }
        const data = new Uint8Array(buffer);
        for (let z = 0; z <= data.length - size; z++) {
            var value = 0;
            if ((endian !== undefined ? endian : ctx.endian) === "little") {
                value = (data[z + 3] << 24) | (data[z + 2] << 16) | (data[z + 1] << 8) | data[z];
            }
            else {
                value = (data[z] << 24) | (data[z + 1] << 16) | (data[z + 2] << 8) | data[z + 3];
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
                return position + z; // Found the number, return the index
            }
        }
        position += buffer.length;
    }
    return -1; // number not found
}
function fBigInt$1(ctx, targetNumber, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    let lastChunk = new Uint8Array(0);
    const targetBigInt = BigInt(targetNumber);
    while (ctx.offset < ctx.size) {
        const currentChunk = ctx.read(ctx.offset, Math.min(chunkSize, ctx.size - ctx.offset), false);
        // No more data to read
        if (currentChunk.length === 0) {
            break;
        }
        // Concatenate the last part of the previous chunk with the current chunk
        const combinedBuffer = Buffer.concat([lastChunk, new Uint8Array(currentChunk)]);
        // Process the combined buffer to find the target BigInt
        for (let z = 0; z <= combinedBuffer.length - 8; z++) {
            var value = BigInt(0);
            if ((endian !== undefined ? endian : ctx.endian) === "little") {
                for (let i = 0; i < 8; i++) {
                    value = value | (BigInt(combinedBuffer[z + i] & 0xFF)) << BigInt(8 * i);
                }
            }
            else {
                for (let i = 0; i < 8; i++) {
                    value = (value << BigInt(8)) | BigInt(combinedBuffer[z + i] & 0xFF);
                }
            }
            if (unsigned === undefined || unsigned === false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
            }
            if (value === targetBigInt) {
                return ctx.offset + z - lastChunk.length; // Found the byte, return the index from current
            }
        }
        // Update the last chunk for the next iteration
        lastChunk = new Uint8Array(combinedBuffer.subarray(-8 + 1));
        ctx.offset += currentChunk.length;
    }
    return -1; // number not found
}
function fDoubleFloat$1(ctx, targetNumber, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    const chunkSize = 0x2000; // 8192 bytes
    const size = 8; // Size of double float in bytes
    for (let position = 0; position <= ctx.size - size;) {
        const buffer = ctx.read(position, Math.min(chunkSize, ctx.size - position));
        if (buffer.length == 0) {
            break;
        }
        const data = new Uint8Array(buffer);
        for (let z = 0; z <= data.length - size; z++) {
            var value = BigInt(0);
            if ((endian !== undefined ? endian : ctx.endian) === "little") {
                for (let i = 0; i < size; i++) {
                    value = value | BigInt(data[z + i] & 0xFF) << BigInt(8 * i);
                }
            }
            else {
                for (let i = 0; i < size; i++) {
                    value = (value << BigInt(8)) | BigInt(data[z + i] & 0xFF);
                }
            }
            const sign = (value & BigInt("9223372036854775808")) >> BigInt(63);
            const exponent = Number((value & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;
            const fraction = Number(value & BigInt("4503599627370495")) / Math.pow(2, 52);
            let floatValue;
            if (exponent === -1023) {
                if (fraction === 0) {
                    floatValue = (sign === BigInt(0)) ? 0 : -0; // +/-0
                }
                else {
                    // Denormalized number
                    floatValue = (sign === BigInt(0) ? 1 : -1) * Math.pow(2, -1022) * fraction;
                }
            }
            else if (exponent === 1024) {
                if (fraction === 0) {
                    floatValue = (sign === BigInt(0)) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                }
                else {
                    floatValue = Number.NaN;
                }
            }
            else {
                // Normalized number
                floatValue = (sign === BigInt(0) ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
            }
            if (floatValue === targetNumber) {
                return position + z; // Found the number, return the index
            }
        }
        position += buffer.length;
    }
    return -1; // number not found
}
function wbit$1(ctx, value, bits, unsigned, endian) {
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
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + 0 + " max: " + Math.pow(2, bits) + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, bits - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
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
        ctx.extendArray(size_needed - ctx.size);
    }
    var off_in_bits = (ctx.offset * 8) + ctx.bitoffset;
    for (var i = 0; i < bits;) {
        const remaining = bits - i;
        const bitOffset = off_in_bits & 7;
        const byteOffset = off_in_bits >> 3;
        const written = Math.min(remaining, 8 - bitOffset);
        const input = ctx.read(byteOffset, Math.min(1, ctx.size - ctx.offset), false);
        if (input.length == 0) {
            break;
        }
        if ((endian != undefined ? endian : ctx.endian) == "big") {
            let mask = ~(-1 << written);
            let writeBits = (value >> (bits - i - written)) & mask;
            var destShift = 8 - bitOffset - written;
            let destMask = ~(mask << destShift);
            input[0] = (input[0] & destMask) | (writeBits << destShift);
        }
        else {
            let mask = ~(0xFF << written);
            let writeBits = value & mask;
            value >>= written;
            let destMask = ~(mask << bitOffset);
            input[0] = (input[0] & destMask) | (writeBits << bitOffset);
        }
        off_in_bits += written;
        i += written;
        ctx.commit(false);
    }
    ctx.offset = ctx.offset + Math.floor(((bits) + ctx.bitoffset) / 8); //end byte
    ctx.bitoffset = ((bits) + ctx.bitoffset) % 8;
}
function rbit$1(ctx, bits, unsigned, endian) {
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
        ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
        throw new Error("Invalid number of bits to read: " + size_needed + " of " + ctx.size);
    }
    var off_in_bits = (ctx.offset * 8) + ctx.bitoffset;
    var value = 0;
    for (var i = 0; i < bits;) {
        var remaining = bits - i;
        var bitOffset = off_in_bits & 7;
        const currentByte = ctx.read(off_in_bits >> 3, Math.min(1, ctx.size - off_in_bits >> 3), false);
        if (currentByte.length == 0) {
            break;
        }
        var read = Math.min(remaining, 8 - bitOffset);
        if ((endian != undefined ? endian : ctx.endian) == "big") {
            let mask = ~(0xFF << read);
            let readBits = (currentByte[0] >> (8 - read - bitOffset)) & mask;
            value <<= read;
            value |= readBits;
        }
        else {
            let mask = ~(0xFF << read);
            let readBits = (currentByte[0] >> bitOffset) & mask;
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
function wbyte$1(ctx, value, unsigned) {
    ctx.open();
    check_size$1(ctx, 1, 0);
    if (unsigned == true) {
        if (value < 0 || value > 255) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + 0 + " max: " + 255 + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 8 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    const data = ctx.read(ctx.offset, 1, false);
    const view = new DataView(data.buffer, data.byteOffset);
    if (canInt8) {
        if ((unsigned == undefined || unsigned == false)) {
            view.setInt8(0, value);
        }
        else {
            view.setUint8(0, value);
        }
    }
    else {
        data[0] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
    }
    ctx.commit(false);
    ctx.offset += 1;
    ctx.bitoffset = 0;
    return;
}
function rbyte$1(ctx, unsigned) {
    ctx.open();
    check_size$1(ctx, 1);
    const data = ctx.read(ctx.offset, 1, false);
    const view = new DataView(data.buffer, data.byteOffset);
    if (canInt8) {
        var read;
        if ((unsigned == undefined || unsigned == false)) {
            read = view.getInt8(0);
        }
        else {
            read = view.getUint8(0);
        }
        ctx.offset += 1;
        ctx.bitoffset = 0;
        return read;
    }
    ctx.offset += 1;
    ctx.bitoffset = 0;
    if (unsigned == true) {
        return data[0] & 0xFF;
    }
    else {
        return data[0] > 127 ? data[0] - 256 : data[0];
    }
}
function wint16$1(ctx, value, unsigned, endian) {
    ctx.open();
    check_size$1(ctx, 2, 0);
    if (unsigned == true) {
        if (value < 0 || value > 65535) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + 0 + " max: " + 65535 + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 16 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    const data = ctx.read(ctx.offset, 2, false);
    const view = new DataView(data.buffer, data.byteOffset);
    if (canInt16) {
        if ((unsigned == undefined || unsigned == false)) {
            view.setInt16(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            view.setUint16(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    }
    else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            data[0] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
            data[1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
        }
        else {
            data[0] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
            data[1] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
        }
    }
    ctx.commit(false);
    ctx.offset += 2;
    ctx.bitoffset = 0;
    return;
}
function rint16$1(ctx, unsigned, endian) {
    ctx.open();
    check_size$1(ctx, 2);
    const data = ctx.read(ctx.offset, 2, false);
    const view = new DataView(data.buffer, data.byteOffset);
    var read;
    if (canInt16) {
        if (unsigned == undefined || unsigned == false) {
            read = view.getInt16(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            read = view.getUint16(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 2;
        ctx.bitoffset = 0;
        return read;
    }
    else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            read = ((data[1] & 0xFFFF) << 8) | (data[0] & 0xFFFF);
        }
        else {
            read = ((data[0] & 0xFFFF) << 8) | (data[1] & 0xFFFF);
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
function rhalffloat$1(ctx, endian) {
    if (canFloat16) {
        ctx.open();
        check_size$1(ctx, 2);
        const data = ctx.read(ctx.offset, 2, false);
        const view = new DataView(data.buffer, data.byteOffset);
        const float16Value = view.getFloat16(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 2;
        ctx.bitoffset = 0;
        return float16Value;
    }
    const uint16Value = ctx.readInt16(true, (endian != undefined ? endian : ctx.endian));
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
function whalffloat$1(ctx, value, endian) {
    ctx.open();
    check_size$1(ctx, 2, 0);
    const maxValue = 65504;
    const minValue = 5.96e-08;
    if (value < minValue || value > maxValue) {
        ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
        throw new Error('Value is out of range for the specified half float length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
    }
    if (canFloat16) {
        const data = ctx.read(ctx.offset, 2, false);
        const view = new DataView(data.buffer, data.byteOffset);
        view.setFloat16(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.commit(false);
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
    const data = ctx.read(ctx.offset, 2, false);
    // Write bytes based on endianness
    if ((endian == undefined ? ctx.endian : endian) == "little") {
        data[0] = halfFloatBits & 0xFF;
        data[1] = (halfFloatBits >> 8) & 0xFF;
    }
    else {
        data[0] = (halfFloatBits >> 8) & 0xFF;
        data[1] = halfFloatBits & 0xFF;
    }
    ctx.commit(false);
    ctx.offset += 2;
    ctx.bitoffset = 0;
}
function wint32$1(ctx, value, unsigned, endian) {
    ctx.open();
    check_size$1(ctx, 4, 0);
    if (unsigned == true) {
        if (value < 0 || value > 4294967295) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + 0 + " max: " + 4294967295 + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 32 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    const data = ctx.read(ctx.offset, 4, false);
    const view = new DataView(data.buffer, data.byteOffset);
    if (canInt32) {
        if ((unsigned == undefined || unsigned == false)) {
            view.setInt32(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            view.setUint32(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    }
    else {
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            data[0] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
            data[1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            data[2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            data[3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        }
        else {
            data[0] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
            data[1] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            data[2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            data[3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        }
    }
    ctx.commit(false);
    ctx.offset += 4;
    ctx.bitoffset = 0;
}
function rint32$1(ctx, unsigned, endian) {
    ctx.open();
    check_size$1(ctx, 4);
    const data = ctx.read(ctx.offset, 4, false);
    const view = new DataView(data.buffer, data.byteOffset);
    var read;
    if (canInt32) {
        if ((unsigned == undefined || unsigned == false)) {
            read = view.getInt32(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            read = view.getUint32(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 4;
        ctx.bitoffset = 0;
        return read;
    }
    if ((endian != undefined ? endian : ctx.endian) == "little") {
        read = (((data[3] & 0xFF) << 24) | ((data[2] & 0xFF) << 16) | ((data[1] & 0xFF) << 8) | (data[0] & 0xFF));
    }
    else {
        read = ((data[0] & 0xFF) << 24) | ((data[1] & 0xFF) << 16) | ((data[2] & 0xFF) << 8) | (data[3] & 0xFF);
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
function rfloat$1(ctx, endian) {
    if (canFloat32) {
        ctx.open();
        check_size$1(ctx, 4);
        const data = ctx.read(ctx.offset, 4, false);
        const view = new DataView(data.buffer, data.byteOffset);
        var float32Value = view.getFloat32(0, endian != undefined ? endian == "little" : ctx.endian == "little");
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
function wfloat$1(ctx, value, endian) {
    ctx.open();
    check_size$1(ctx, 4, 0);
    const MIN_POSITIVE_FLOAT32 = Number.MIN_VALUE;
    const MAX_POSITIVE_FLOAT32 = 3.4028235e+38;
    const MIN_NEGATIVE_FLOAT32 = -34028235e31;
    const MAX_NEGATIVE_FLOAT32 = -Number.MIN_VALUE;
    if (!((value === 0) ||
        (value >= MIN_POSITIVE_FLOAT32 && value <= MAX_POSITIVE_FLOAT32) ||
        (value >= MIN_NEGATIVE_FLOAT32 && value <= MAX_NEGATIVE_FLOAT32))) {
        ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
        throw new Error('Value is out of range for the specified float length.' + " min: " + MIN_NEGATIVE_FLOAT32 + " max: " + MAX_POSITIVE_FLOAT32 + " value: " + value);
    }
    const data = ctx.read(ctx.offset, 4, false);
    const view = new DataView(data.buffer, data.byteOffset);
    if (canFloat32) {
        view.setFloat32(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
    }
    else {
        const arrayFloat = new Float32Array(1);
        arrayFloat[0] = value;
        if (endian != undefined ? endian == "little" : ctx.endian == "little") {
            data[0] = arrayFloat.buffer[0];
            data[1] = arrayFloat.buffer[1];
            data[2] = arrayFloat.buffer[2];
            data[3] = arrayFloat.buffer[3];
        }
        else {
            data[0] = arrayFloat.buffer[3];
            data[1] = arrayFloat.buffer[2];
            data[2] = arrayFloat.buffer[1];
            data[3] = arrayFloat.buffer[0];
        }
    }
    ctx.commit(false);
    ctx.offset += 4;
    ctx.bitoffset = 0;
}
function rint64$1(ctx, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size$1(ctx, 8);
    const data = ctx.read(ctx.offset, 8, false);
    const view = new DataView(data.buffer, data.byteOffset);
    var value = BigInt(0);
    if (canBigInt64) {
        if (unsigned == undefined || unsigned == false) {
            value = view.getBigInt64(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            value = view.getBigUint64(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 8;
    }
    else {
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((data[i] & 0xFF)) << BigInt(8 * i);
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
                value = (value << BigInt(8)) | BigInt((data[i] & 0xFF));
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
    if (ctx.enforceBigInt) {
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
function wint64$1(ctx, value, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    ctx.open();
    check_size$1(ctx, 8, 0);
    if (unsigned == true) {
        if (value < 0 || value > Math.pow(2, 64) - 1) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + 0 + " max: " + (Math.pow(2, 64) - 1) + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 63) - 1;
        const minValue = -Math.pow(2, 63);
        if (value < minValue || value > maxValue) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    const data = ctx.read(ctx.offset, 8, false);
    const view = new DataView(data.buffer, data.byteOffset);
    if (canBigInt64) {
        if (unsigned == undefined || unsigned == false) {
            view.setBigInt64(0, BigInt(value), endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            view.setBigUint64(0, BigInt(value), endian != undefined ? endian == "little" : ctx.endian == "little");
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
                    data[i * 4 + 0] = int32Array[i];
                    data[i * 4 + 1] = (int32Array[i] >> 8);
                    data[i * 4 + 2] = (int32Array[i] >> 16);
                    data[i * 4 + 3] = (int32Array[i] >> 24);
                }
                else {
                    data[i * 4 + 0] = int32Array[i] & 0xFF;
                    data[i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                    data[i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                    data[i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            }
            else {
                if (unsigned == undefined || unsigned == false) {
                    data[(1 - i) * 4 + 3] = int32Array[i];
                    data[(1 - i) * 4 + 2] = (int32Array[i] >> 8);
                    data[(1 - i) * 4 + 1] = (int32Array[i] >> 16);
                    data[(1 - i) * 4 + 0] = (int32Array[i] >> 24);
                }
                else {
                    data[(1 - i) * 4 + 3] = int32Array[i] & 0xFF;
                    data[(1 - i) * 4 + 2] = (int32Array[i] >> 8) & 0xFF;
                    data[(1 - i) * 4 + 1] = (int32Array[i] >> 16) & 0xFF;
                    data[(1 - i) * 4 + 0] = (int32Array[i] >> 24) & 0xFF;
                }
            }
        }
    }
    ctx.commit(false);
    ctx.offset += 8;
    ctx.bitoffset = 0;
}
function wdfloat$1(ctx, value, endian) {
    ctx.open();
    check_size$1(ctx, 8, 0);
    const MIN_POSITIVE_FLOAT64 = 2.2250738585072014e-308;
    const MAX_POSITIVE_FLOAT64 = Number.MAX_VALUE;
    const MIN_NEGATIVE_FLOAT64 = -Number.MAX_VALUE;
    const MAX_NEGATIVE_FLOAT64 = -22250738585072014e-324;
    if (!((value === 0) ||
        (value >= MIN_POSITIVE_FLOAT64 && value <= MAX_POSITIVE_FLOAT64) ||
        (value >= MIN_NEGATIVE_FLOAT64 && value <= MAX_NEGATIVE_FLOAT64))) {
        ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
        throw new Error('Value is out of range for the specified 64bit length.' + " min: " + MIN_NEGATIVE_FLOAT64 + " max: " + MAX_POSITIVE_FLOAT64 + " value: " + value);
    }
    const data = ctx.read(ctx.offset, 8, false);
    const view = new DataView(data.buffer, data.byteOffset);
    if (canFloat64) {
        view.setFloat64(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
    }
    else {
        const intArray = new Int32Array(2);
        const floatArray = new Float64Array(intArray.buffer);
        floatArray[0] = value;
        const bytes = new Uint8Array(intArray.buffer);
        for (let i = 0; i < 8; i++) {
            if ((endian == undefined ? ctx.endian : endian) == "little") {
                data[i] = bytes[i];
            }
            else {
                data[(7 - i)] = bytes[i];
            }
        }
    }
    ctx.commit(false);
    ctx.offset += 8;
    ctx.bitoffset = 0;
}
function rdfloat$1(ctx, endian) {
    if (canFloat64) {
        ctx.open();
        check_size$1(ctx, 8);
        const data = ctx.read(ctx.offset, 8, false);
        const view = new DataView(data.buffer, data.byteOffset);
        const floatValue = view.getFloat64(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 8;
        ctx.bitoffset = 0;
        return floatValue;
    }
    endian = (endian == undefined ? ctx.endian : endian);
    var uint64Value = ctx.readInt64(true /*unsigned*/, endian);
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
function rstring$1(ctx, options) {
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
        check_size$1(ctx, length);
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
            read_length = ctx.size - ctx.offset;
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
                const read = ctx.readInt16(true, endian);
                const read1 = read & 0xFF;
                const read2 = (read >> 8) & 0xFF;
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
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
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
function wstring$1(ctx, string, options) {
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
        check_size$1(ctx, totalLength, 0);
        const data = ctx.read(ctx.offset, totalLength, false);
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < encodedString.length; i++) {
            if (stringType === 'utf-16') {
                const charCode = encodedString[i];
                if (endian == "little") {
                    data[i * 2] = charCode & 0xFF;
                    data[i * 2 + 1] = (charCode >> 8) & 0xFF;
                }
                else {
                    data[i * 2 + 1] = charCode & 0xFF;
                    data[i * 2] = (charCode >> 8) & 0xFF;
                }
            }
            else {
                data[i] = encodedString[i];
            }
        }
        if (terminateValue != undefined) {
            if (stringType === 'utf-16') {
                data[totalLength - 1] = terminateValue & 0xFF;
                data[totalLength] = (terminateValue >> 8) & 0xFF;
            }
            else {
                data[totalLength] = terminateValue;
            }
        }
        ctx.commit(false);
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
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
            throw new Error("Invalid length write size: " + lengthWriteSize);
        }
        if (string.length > maxLength || (length || 0) > maxLength) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";
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
        check_size$1(ctx, totalLength, 0);
        const data = ctx.read(ctx.offset, totalLength, false);
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < totalLength; i++) {
            if (stringType == 'wide-pascal') {
                if (endian == "little") {
                    data[i] = encodedString[i];
                    data[i + 1] = encodedString[i + 1];
                }
                else {
                    data[i + 1] = encodedString[i];
                    data[i] = encodedString[i + 1];
                }
                i++;
            }
            else {
                data[i] = encodedString[i];
            }
        }
        ctx.commit(false);
        ctx.offset += totalLength;
        ctx.bitoffset = 0;
    }
    else {
        throw new Error('Unsupported string type: ' + stringType);
    }
}
/**
 * Base class for BiReaderLegacy and BiWriterLegacy
 */
class BiBaseLegacy {
    /**
     * Get the current buffer data.
     *
     * @type {Buffer}
     */
    get data() {
        return __classPrivateFieldGet(this, _BiBaseLegacy_data, "f");
    }
    ;
    /**
     * Set the current buffer data.
     *
     * @param {Buffer} data
     */
    set data(data) {
        if (Buffer.isBuffer(data)) {
            __classPrivateFieldSet(this, _BiBaseLegacy_data, data, "f");
            this.updateView();
        }
    }
    ;
    constructor(filePath, readwrite) {
        /**
         * Endianness of default read.
         *
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
         * Size in bytes of the current file.
         */
        this.size = 0;
        /**
         * Size in bits of the current file.
         */
        this.sizeB = 0;
        /**
         * Allows the file to extend reading or writing outside of current size
         */
        this.strict = false;
        /**
         * Console log a hexdump on error.
         */
        this.errorDump = false;
        /**
         * Current buffer chunk.
         *
         * @type {Buffer|null}
         */
        _BiBaseLegacy_data.set(this, null);
        /**
         * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
         *
         * Otherwise it extends just the amount of the next written value.
         *
         * This can greatly speed up data writes when large files are being written.
         *
         * NOTE: Using ``BiWriterLegacy.get`` or ``BiWriterLegacy.return`` will now remove all data after the current write position. Use ``BiWriterLegacy.data`` to get the full buffer instead.
         */
        this.extendBufferSize = 0;
        this.fd = null;
        this.filePath = null;
        this.fsMode = "r";
        /**
         * The settings that used when using the .str getter / setter
         */
        this.strDefaults = { stringType: "utf-8", terminateValue: 0x0 };
        this.maxFileSize = null;
        this.enforceBigInt = null;
        this.view = null;
        this.mode = 'file';
        if (typeof Buffer === 'undefined' || typeof fs$1 == "undefined") {
            throw new Error("Need node to read or write files.");
        }
        this.filePath = filePath;
        this.mode = "file";
        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH$1();
        }
        if (readwrite) {
            this.fsMode = "w+";
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
     * Enabling write mode in reader.
     *
     * @param {boolean} writeMode - Enabling write mode in reader.
     */
    writeMode(writeMode) {
        if (writeMode) {
            this.fsMode = "w+";
            this.close();
            this.open();
            return;
        }
        else {
            this.fsMode = "r";
            this.close();
            this.open();
            return;
        }
    }
    ;
    /**
     * Opens the file. Must be run before reading or writing.
     *
     * @returns {number} file size
     */
    open() {
        if (this.fd != null) {
            return this.size;
        }
        if (bufferConstants$1 == undefined || fs$1 == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }
        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH$1();
        }
        try {
            this.fd = fs$1.openSync(this.filePath, this.fsMode);
        }
        catch (error) {
            throw new Error(error);
        }
        this.updateSize();
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
                    this.extendArray(this.offset - this.size);
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
        if (fs$1 == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }
        if (this.fd !== null) {
            try {
                const stat = fs$1.fstatSync(this.fd);
                this.size = stat.size;
                this.sizeB = this.size * 8;
            }
            catch (error) {
                throw new Error(error);
            }
        }
    }
    ;
    /**
     * Closes the file.
     *
     * @returns {void}
     */
    close() {
        if (this.fd === null) {
            return; // Already closed / or not open
        }
        if (fs$1 == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }
        try {
            fs$1.closeSync(this.fd);
        }
        catch (error) {
            throw new Error(error);
        }
        this.fd = null;
        return;
    }
    ;
    /**
     * Internal reader
     *
     * @param start this.offset
     * @param length
     * @param consume
     * @returns
     */
    read(start, length, consume = false) {
        this.open();
        if (fs$1 == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }
        if (this.fd === null) {
            throw new Error('File is not open yet.');
        }
        if (length < 1) {
            return Buffer.alloc(0);
        }
        const end = start + length;
        if (length > this.maxFileSize) {
            throw new Error("File read is greater than Node's max buffer size: " + this.maxFileSize);
        }
        if (end > this.size) {
            if (this.strict == false) {
                this.extendArray(length);
            }
            else {
                throw new Error('File read is outside data size while in strict mode.');
            }
        }
        const data = Buffer.alloc(length);
        try {
            const bytesRead = fs$1.readSync(this.fd, data, 0, data.length, start);
            if (bytesRead != length) {
                throw new Error("Didn't read the amount needed for value: " + bytesRead + " of " + length);
            }
        }
        catch (error) {
            throw new Error(error);
        }
        this.data = data;
        if (consume) {
            this.offset = start + data.length;
            this.bitoffset = 0;
        }
        return this.data;
    }
    ;
    /**
     * Internal writer
     *
     * @param start - likely this.offset
     * @param data
     * @param consume
     * @returns {number}
     */
    write(start, data, consume = false) {
        this.open();
        if (fs$1 == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }
        if (this.fd === null) {
            throw new Error('File is not open yet.');
        }
        if (data.length < 1) {
            return 0;
        }
        const end = start + data.length;
        if (end > this.size) {
            if (this.strict == false) {
                this.extendArray(data.length);
            }
            else {
                throw new Error('File write is outside of data size while in strict mode.');
            }
        }
        var bytesWritten;
        try {
            bytesWritten = fs$1.writeSync(this.fd, new Uint8Array(data), 0, data.length, start);
        }
        catch (error) {
            throw new Error(error);
        }
        this.updateSize();
        if (consume) {
            this.offset = start + bytesWritten;
        }
        return bytesWritten;
    }
    ;
    /**
     * internal write commit
     *
     * @param consume
     * @returns {number}
     */
    commit(consume = true) {
        this.open();
        if (!Buffer.isBuffer(this.data)) {
            var data = Buffer.from(this.data);
            return this.write(this.offset, data, consume);
        }
        else if (this.data === null) {
            throw new Error("No data to write.");
        }
        return this.write(this.offset, this.data, consume);
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
        try {
            fs$1.closeSync(this.fd);
            this.fd = null;
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
     * Note: This is permanentand can't be undone.
     *
     * It doesn't send the file to the recycling bin for recovery.
     */
    deleteFile() {
        try {
            fs$1.closeSync(this.fd);
            this.fd = null;
            fs$1.unlinkSync(this.filePath);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    ;
    /**
     * internal extend
     *
     * @param length amount needed
     * @returns {void}
     */
    extendArray(length) {
        return extendarray$1(this, length);
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
        if (this.data) {
            this.view = new DataView(this.data.buffer, this.data.byteOffset ?? 0, this.data.byteLength);
        }
    }
    ;
    ///////////////////////////////
    //         ENDIANNESS        //
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
    //            SIZE           //
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
    //         POSITION          //
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
    //        FINISHING          //
    ///////////////////////////////
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {Buffer} ``Buffer``
     */
    get() {
        if (this.extendBufferSize != 0) {
            this.trim();
        }
        return this.data || Buffer.alloc(0);
    }
    ;
    /**
     * Returns current data.
     *
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     *
     * Use ``.data`` instead if you want the full buffer data.
     *
     * @returns {Buffer} ``Buffer``
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
        return hexDumpBase$1(this, options);
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
    //       STRICTMODE          //
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
     */
    end() {
        this.data = null;
        this.view = undefined;
    }
    ;
    /**
     * removes data.
     */
    done() {
        this.end();
    }
    ;
    /**
     * removes data.
     */
    finished() {
        this.end();
    }
    ;
    ///////////////////////////////
    //          FIND             //
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
        return fString$1(this, string);
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
        return fNumber$1(this, value, 8, unsigned == undefined ? true : unsigned, endian);
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
        return fNumber$1(this, value, 16, unsigned == undefined ? true : unsigned, endian);
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
        return fNumber$1(this, value, 32, unsigned == undefined ? true : unsigned, endian);
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
        return fBigInt$1(this, value, unsigned == undefined ? true : unsigned, endian);
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
        return fHalfFloat$1(this, value, endian);
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
        return fFloat$1(this, value, endian);
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
        return fDoubleFloat$1(this, value, endian);
    }
    ;
    ///////////////////////////////
    //        MOVE TO            //
    ///////////////////////////////
    /**
     * Aligns current byte position.
     *
     * Note: Will extend array if strict mode is off and outside of max size.
     *
     * @param {number} number - Byte to align
     */
    align(number) {
        return align$1(this, number);
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
        return alignRev$1(this, number);
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
        return skip$1(this, bytes, bits);
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
        return goto$1(this, byte, bit);
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
        return goto$1(this, byte, bit);
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
    //         REMOVE            //
    ///////////////////////////////
    /**
     * Deletes part of data from start to current byte position unless supplied, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} startOffset - Start location (default 0)
     * @param {number} endOffset - End location (default current position)
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer} Removed data as ``Buffer``
     */
    delete(startOffset, endOffset, consume) {
        return remove$1(this, startOffset || 0, endOffset || this.offset, consume || false, true);
    }
    ;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {Buffer} Removed data as ``Buffer``
     */
    clip() {
        return remove$1(this, this.offset, this.size, false, true);
    }
    ;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {Buffer} Removed data as ``Buffer``
     */
    trim() {
        return remove$1(this, this.offset, this.size, false, true);
    }
    ;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer} Removed data as ``Buffer``
     */
    crop(length, consume) {
        return remove$1(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    ;
    /**
     * Deletes part of data from current position to supplied length, returns removed.
     *
     * Note: Only works in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer} Removed data as ``Buffer``
     */
    drop(length, consume) {
        return remove$1(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    ;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    replace(data, consume, offset) {
        return addData$1(this, data, consume || false, offset || this.offset, true);
    }
    ;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    overwrite(data, consume, offset) {
        return addData$1(this, data, consume || false, offset || this.offset, true);
    }
    ;
    ///////////////////////////////
    //        COPY OUT           //
    ///////////////////////////////
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer} Selected data as ``Buffer``
     */
    lift(startOffset, endOffset, consume, fillValue) {
        return remove$1(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    ;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer} Selected data as ``Buffer``
     */
    fill(startOffset, endOffset, consume, fillValue) {
        return remove$1(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer} Selected data as ``Buffer``
     */
    extract(length, consume) {
        return remove$1(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer} Selected data as ``Buffer``
     */
    slice(length, consume) {
        return remove$1(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data or ``Buffer``
     */
    wrap(length, consume) {
        return remove$1(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    ;
    ///////////////////////////////
    //          INSERT           //
    ///////////////////////////////
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    insert(data, consume, offset) {
        return addData$1(this, data, consume || false, offset || this.offset, false);
    }
    ;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    place(data, consume, offset) {
        return addData$1(this, data, consume || false, offset || this.offset, false);
    }
    ;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data, consume) {
        return addData$1(this, data, consume || false, 0, false);
    }
    ;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data, consume) {
        return addData$1(this, data, consume || false, 0, false);
    }
    ;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data, consume) {
        return addData$1(this, data, consume || false, this.size, false);
    }
    ;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data, consume) {
        return addData$1(this, data, consume || false, this.size, false);
    }
    ;
    ///////////////////////////////
    //          MATH             //
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
        return XOR$1(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return XOR$1(this, XORKey, this.offset, this.offset + Length, consume || false);
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
        return OR$1(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return OR$1(this, ORKey, this.offset, this.offset + Length, consume || false);
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
        return AND$1(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return AND$1(this, ANDKey, this.offset, this.offset + Length, consume || false);
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
        return ADD$1(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return ADD$1(this, AddedKey, this.offset, this.offset + Length, consume || false);
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
        return NOT$1(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length, consume) {
        return NOT$1(this, this.offset, this.offset + (length || 1), consume || false);
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
        return LSHIFT$1(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return LSHIFT$1(this, shiftKey, this.offset, this.offset + Length, consume || false);
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
        return RSHIFT$1(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return RSHIFT$1(this, lShiftKey, this.offset, this.offset + Length, consume || false);
    }
    ;
    ///////////////////////////////
    //        BIT READER         //
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
        return wbit$1(this, value, bits, unsigned, endian);
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
        return wbit$1(this, value, bits, true, "big");
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
        return wbit$1(this, value, bits, unsigned, "big");
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
        return wbit$1(this, value, bits, true, "little");
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
        return wbit$1(this, value, bits, unsigned, "little");
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
        return rbit$1(this, bits, unsigned, endian);
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
    /**
     * Read byte.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number}
     */
    readByte(unsigned) {
        return rbyte$1(this, unsigned);
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
        return Array.from({ length: amount }, () => rbyte$1(this, unsigned));
    }
    ;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeByte(value, unsigned) {
        return wbyte$1(this, value, unsigned);
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
            wbyte$1(this, values[i], unsigned);
        }
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    writeUByte(value) {
        return wbyte$1(this, value, true);
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
     * Read short.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt16(unsigned, endian) {
        return rint16$1(this, unsigned, endian);
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
        return wint16$1(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value, endian) {
        return wint16$1(this, value, true, endian);
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
    /**
     * Read half float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readHalfFloat(endian) {
        return rhalffloat$1(this, endian);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeHalfFloat(value, endian) {
        return whalffloat$1(this, value, endian);
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
    /**
     * Read 32 bit integer.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt32(unsigned, endian) {
        return rint32$1(this, unsigned, endian);
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
        return wint32$1(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value, endian) {
        return wint32$1(this, value, true, endian);
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
    /**
     * Read float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat(endian) {
        return rfloat$1(this, endian);
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat(value, endian) {
        return wfloat$1(this, value, endian);
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
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian?} endian - ``big`` or ``little``
     */
    readInt64(unsigned, endian) {
        return rint64$1(this, unsigned, endian);
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
        return wint64$1(this, value, unsigned, endian);
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
     */
    readUInt64() {
        return this.readInt64(true);
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readInt64BE() {
        return this.readInt64(false, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readUInt64BE() {
        return this.readInt64(true, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readInt64LE() {
        return this.readInt64(false, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readUInt64LE() {
        return this.readInt64(true, "little");
    }
    ;
    /**
     * Read double float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian) {
        return rdfloat$1(this, endian);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value, endian) {
        return wdfloat$1(this, value, endian);
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
    * @returns {Promise<string>}
    */
    readString(options) {
        return rstring$1(this, options);
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
        return wstring$1(this, string, options);
    }
    ;
}
_BiBaseLegacy_data = new WeakMap();

/**
 * Read large files in older version of Node.js
 *
 * Binary reader, includes bitfields and strings.
 *
 * @param {string} filePath - Path to file
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 * @param {BiOptions["writeable"]} options.writeable - Allow data writes when reading a file (default false in reader)
 *
 * @since 4.0
 */
class BiReaderLegacy extends BiBaseLegacy {
    /**
     * Read large files in older version of Node.js
     *
     * Binary reader, includes bitfields and strings.
     *
     * @param {string} filePath - Path to file
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     * @param {BiOptions["writeable"]} options.writeable - Allow data writes when reading a file (default false in reader)
     */
    constructor(filePath, options = {}) {
        super(filePath, options.writeable ?? false);
        if (filePath == undefined) {
            throw new Error("Can not start BiReaderLegacy without file path.");
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
        this.offset = options.byteOffset ?? 0;
        this.bitoffset = options.bitOffset ?? 0;
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
        this.open();
    }
    ;
    //
    // Bit Aliases
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
    // byte read
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
    //short16 read
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
    //half float read
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
    //int read
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
    //float read
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
    //int64 reader
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
    //doublefloat reader
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
    //string reader
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
 * Write large files in older version of Node.js
 *
 * Binary writer, includes bitfields and strings.
 *
 * Note: Must start with .open() before writing.
 *
 * @param {string} filePath - Path to file
 * @param {BiOptions?} options - Any options to set at start
 * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
 * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
 * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
 * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
 * @param {BiOptions["writeable"]} options.writeable - Allow data writes when reading a file (default true in writer)
 *
 * @since 4.0
 */
class BiWriterLegacy extends BiBaseLegacy {
    /**
     * Write large files in older version of Node.js
     *
     * Binary writer, includes bitfields and strings.
     *
     * Note: Must start with .open() before writing.
     *
     * @param {string} filePath - Path to file
     * @param {BiOptions?} options - Any options to set at start
     * @param {BiOptions["byteOffset"]?} options.byteOffset - Byte offset to start writer (default ``0``)
     * @param {BiOptions["bitOffset"]?} options.bitOffset - Bit offset 0-7 to start writer (default ``0``)
     * @param {BiOptions["endianness"]?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {BiOptions["strict"]?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     * @param {BiOptions["extendBufferSize"]?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     * @param {BiOptions["enforceBigInt"]?} options.enforceBigInt - 64 bit value reads will always stay ``BigInt``.
     * @param {BiOptions["writeable"]} options.writeable - Allow data writes when reading a file (default true in writer)
     */
    constructor(filePath, options = {}) {
        super(filePath, options.writeable ?? true);
        this.strict = false;
        if (filePath == undefined) {
            throw new Error("Can not start BiWriterLegacy without file path.");
        }
        if (options.extendBufferSize != undefined &&
            options.extendBufferSize != 0) {
            this.extendBufferSize = options.extendBufferSize;
        }
        this.enforceBigInt = (options?.enforceBigInt) ?? hasBigInt;
        if (typeof options.strict == "boolean") {
            this.strict = options.strict;
        }
        else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true or false.");
            }
        }
        this.endian = options.endianness || "little";
        if (options.endianness != undefined && typeof options.endianness != "string") {
            throw new Error("endianness must be big or little.");
        }
        if (options.endianness != undefined &&
            !(options.endianness == "big" || options.endianness == "little")) {
            throw new Error("Endianness must be big or little.");
        }
        this.offset = options.byteOffset ?? 0;
        this.bitoffset = options.bitOffset ?? 0;
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
        this.open();
    }
    ;
    //
    // Bit Aliases
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
    // byte write
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
    // short writes
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
    // half float
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
    // int32 write
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
    // float write
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
    // int64 write
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
    // doublefloat
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
    // string
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

var _BiBaseAsync_data;
var bufferConstants = constants;
function MAX_LENGTH() {
    return bufferConstants.MAX_LENGTH;
}
async function hexDumpBase(ctx, options = {}) {
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
        data = await ctx.read(start, end - start, false);
    }
    return _hexDump(data, options, start, end);
}
// #region Movement
async function skip(ctx, bytes, bits) {
    var new_size = (((bytes || 0) + ctx.offset) + Math.ceil((ctx.bitoffset + (bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0) + ctx.offset) * 8) + ctx.bitoffset + (bits || 0)) / 8);
    }
    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray(new_size - ctx.size);
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
async function goto(ctx, bytes, bits) {
    var new_size = (((bytes || 0)) + Math.ceil(((bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0)) * 8) + (bits || 0)) / 8);
    }
    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray(new_size - ctx.size);
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
async function check_size(ctx, write_bytes, write_bit, offset) {
    const bits = (write_bit || 0) + ctx.bitoffset;
    var new_off = (offset || ctx.offset);
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
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray(dif);
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
async function extendarray(ctx, to_padd) {
    await ctx.open();
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
            await ctx.fh.truncate(ctx.size + to_padd);
        }
        catch (error) {
            throw new Error(error);
        }
        await ctx.updateSize();
        return;
    }
    var paddbuffer = Buffer.alloc(to_padd);
    ctx.data = Buffer.concat([ctx.data, paddbuffer]);
    ctx.size = ctx.data.length;
    ctx.sizeB = ctx.data.length * 8;
    return;
}
async function remove(ctx, startOffset, endOffset, consume, remove, fillValue) {
    await ctx.open();
    const new_start = Math.abs(startOffset || 0);
    const new_offset = (endOffset || ctx.offset);
    if (new_offset > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray(new_offset - ctx.size);
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
    const removedLength = new_offset - new_start;
    if (ctx.mode == "file") {
        if (ctx.maxFileSize && removedLength > ctx.maxFileSize) {
            // can not return buffer, cant extract, must write new file of removed data
            // if not removed, only fill, just creat a new file with filled data 
            if (fillValue != undefined && remove == false) {
                // fills current file, no need to dupe 
                console.warn(`File size for return Buffer is larger than the max Buffer Node can handle.`);
                var readStart = new_start;
                var amount = removedLength;
                const chunkSize = 64 * 1024; // 64 KB
                const chunk = new Uint8Array(chunkSize).fill(fillValue & 0xff);
                while (amount) {
                    const toWrite = Math.min(chunkSize, amount);
                    var bytesWritten;
                    try {
                        await ctx.fh.read(chunk, 0, toWrite, readStart);
                    }
                    catch (error) {
                        throw new Error(error);
                    }
                    amount -= bytesWritten;
                    readStart += bytesWritten;
                }
            }
            else if (remove) {
                // dupe file for extract, remove data
                const removeData = ctx.filePath + NaN + startOffset + "_" + removedLength + ".removed";
                console.warn(`File size for removal is larger than the max Buffer Node can handle, creating new file ${removeData}`);
                const CHUNK_SIZE = 64 * 1024;
                // Copy removed to new file
                var readOffset = new_start;
                var writeOffset = 0;
                var amount = removedLength;
                const chunk = new Uint8Array(CHUNK_SIZE);
                try {
                    const tempFd = await fs$2.open(removeData, 'w+');
                    while (amount) {
                        const toRead = Math.min(CHUNK_SIZE, amount);
                        const { bytesRead } = await ctx.fh.read(chunk, 0, toRead, readOffset);
                        await tempFd.write(chunk, 0, bytesRead, writeOffset);
                        amount -= bytesRead;
                        readOffset += bytesRead;
                        writeOffset += bytesRead;
                    }
                    await tempFd.close();
                }
                catch (error) {
                    throw new Error(error);
                }
                // reorder data and trim
                readOffset = new_start + removedLength;
                writeOffset = new_start;
                amount = removedLength;
                try {
                    while (amount) {
                        const toRead = Math.min(CHUNK_SIZE, amount);
                        const { bytesRead } = await ctx.fh.read(chunk, 0, toRead, readOffset);
                        await ctx.fh.write(chunk, 0, bytesRead, writeOffset);
                        amount -= bytesRead;
                        readOffset += bytesRead;
                        writeOffset += bytesRead;
                    }
                    await ctx.fh.truncate(ctx.size - removedLength);
                }
                catch (error) {
                    throw new Error(error);
                }
                await ctx.updateSize();
            }
            else {
                // no remove, can't extract
                const removeData = ctx.filePath + NaN + startOffset + "_" + removedLength + ".removed";
                console.warn(`File size for extract is larger than the max Buffer Node can handle, creating new file ${removeData}`);
                const CHUNK_SIZE = 64 * 1024;
                const chunk = new Uint8Array(CHUNK_SIZE);
                // Copy removed to new file
                var readOffset = new_start;
                var writeOffset = 0;
                var amount = removedLength;
                try {
                    const tempFd = await fs$2.open(removeData, 'w+');
                    while (amount) {
                        const toRead = Math.min(CHUNK_SIZE, amount);
                        const { bytesRead } = await ctx.fh.read(chunk, 0, toRead, readOffset);
                        await tempFd.write(chunk, 0, bytesRead, writeOffset);
                        amount -= bytesRead;
                        readOffset += bytesRead;
                        writeOffset += bytesRead;
                    }
                    await tempFd.close();
                }
                catch (error) {
                    throw new Error(error);
                }
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
            return Buffer.alloc(0);
        }
        else {
            if (remove) {
                const removedBuffer = await ctx.read(new_start, removedLength, false);
                const end = new_start + removedLength;
                const chunkSize = 64 * 1024;
                const buffer = new Uint8Array(chunkSize);
                var remaining = ctx.size - end;
                var readPos = end;
                try {
                    while (remaining > 0) {
                        const actualRead = Math.min(chunkSize, remaining);
                        const { bytesRead } = await ctx.fh.read(buffer, 0, actualRead, readPos);
                        await ctx.fh.write(buffer, 0, bytesRead, readPos - removedLength);
                        readPos += bytesRead;
                        remaining -= bytesRead;
                    }
                    await ctx.fh.truncate(ctx.size - removedLength);
                }
                catch (error) {
                    throw new Error(error);
                }
                await ctx.updateSize();
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
                return removedBuffer;
            }
            else {
                if (fillValue != undefined) {
                    const removedBuffer = new Uint8Array(removedLength);
                    removedBuffer.fill(fillValue & 0xff);
                    try {
                        await ctx.fh.write(removedBuffer, 0, removedBuffer.length, new_start);
                    }
                    catch (error) {
                        throw new Error(error);
                    }
                    if (consume == true) {
                        ctx.offset = new_offset;
                        ctx.bitoffset = 0;
                    }
                    ctx.data = Buffer.from(removedBuffer);
                    ctx.updateView();
                    return ctx.data;
                }
                else {
                    // just copying and returning data
                    const removedBuffer = await ctx.read(new_start, removedLength, false);
                    if (consume == true) {
                        ctx.offset = new_offset;
                        ctx.bitoffset = 0;
                    }
                    ctx.data = removedBuffer;
                    ctx.updateView();
                    return removedBuffer;
                }
            }
        }
    }
    const data_removed = ctx.data.subarray(new_start, new_offset);
    if (remove) {
        const part1 = ctx.data.subarray(0, new_start);
        const part2 = ctx.data.subarray(new_offset, ctx.size);
        ctx.data = Buffer.concat([part1, part2]);
        ctx.size = ctx.data.length;
        ctx.sizeB = ctx.data.length * 8;
    }
    if (fillValue != undefined && remove == false) {
        const part1 = ctx.data.subarray(0, new_start);
        const part2 = ctx.data.subarray(new_offset, ctx.size);
        const replacement = new Array(data_removed.length).fill(fillValue & 0xff);
        const buff_placement = Buffer.from(replacement);
        ctx.data = Buffer.concat([part1, buff_placement, part2]);
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
async function addData(ctx, data, consume, offset, replace) {
    if (ctx.strict == true) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Can not insert data in strict mode. Use unrestrict() to enable.`);
    }
    await ctx.open();
    if (ctx.mode == "file") {
        offset = (offset || ctx.offset);
        var newSize = offset + data.length;
        const originalSize = ctx.size;
        const insertLength = data.length;
        if (data.length === 0) {
            return;
        }
        if (newSize > ctx.size) {
            if (ctx.strict == false) {
                if (ctx.extendBufferSize != 0) {
                    await ctx.extendArray(ctx.extendBufferSize);
                }
                else {
                    await ctx.extendArray(newSize - ctx.size);
                }
            }
            else {
                ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";
                throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + newSize + " of " + ctx.size);
            }
        }
        if (!arrayBufferCheck(data)) {
            throw new Error('Data must be a Uint8Array or Buffer');
        }
        if (Buffer.isBuffer(data)) {
            data = new Uint8Array(data);
        }
        if (replace) {
            // overwrite
            try {
                await ctx.fh.write(data, 0, data.length, offset);
            }
            catch (error) {
                throw new Error(error);
            }
            await ctx.updateSize();
        }
        else {
            // insert
            const chunkSize = 64 * 1024; // 64KB
            const buffer = new Uint8Array(chunkSize);
            var remaining = originalSize - offset;
            var readPos = originalSize - chunkSize;
            try {
                while (remaining > 0) {
                    const actualRead = Math.min(chunkSize, remaining);
                    readPos = offset + remaining - actualRead;
                    const writePos = readPos + insertLength;
                    const { bytesRead } = await ctx.fh.read(buffer, 0, actualRead, readPos);
                    await ctx.fh.write(buffer, 0, bytesRead, writePos);
                    remaining -= actualRead;
                }
                // Write the insert data at offset
                await ctx.fh.write(data, 0, insertLength, offset);
            }
            catch (error) {
                throw new Error(error);
            }
            ctx.size = newSize;
        }
        if (consume == true) {
            ctx.offset = newSize;
            ctx.bitoffset = 0;
        }
        return;
    }
    if (isBuffer(data) && !isBuffer(ctx.data)) {
        data = Buffer.from(data);
    }
    var needed_size = offset || ctx.offset;
    if (replace) {
        needed_size = (offset || ctx.offset) + data.length;
        const part1 = ctx.data.subarray(0, needed_size - data.length);
        const part2 = ctx.data.subarray(needed_size, ctx.size);
        ctx.data = Buffer.concat([part1, data, part2]);
        ctx.size = ctx.data.length;
        ctx.sizeB = ctx.data.length * 8;
    }
    else {
        const part1 = ctx.data.subarray(0, needed_size);
        const part2 = ctx.data.subarray(needed_size, ctx.size);
        ctx.data = Buffer.concat([part1, data, part2]);
        ctx.size = ctx.data.length;
        ctx.sizeB = ctx.data.length * 8;
    }
    if (consume) {
        ctx.offset = (offset || ctx.offset) + data.length;
        ctx.bitoffset = 0;
    }
    return;
}
// #region Math
async function AND(ctx, and_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        var new_start = (start || 0);
        const new_end = Math.min(end || ctx.size, ctx.size);
        const previousStart = ctx.offset;
        if (typeof and_key == "number") {
            while (new_start <= new_end) {
                const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    input[i] = input[i] & (and_key & 0xff);
                }
                await ctx.commit(true);
                new_start += input.length;
            }
            return;
        }
        else {
            if (typeof and_key == "string") {
                and_key = Uint8Array.from(Array.from(and_key).map(letter => letter.charCodeAt(0)));
            }
            if (arrayBufferCheck(and_key)) {
                var keyIndex = -1;
                while (new_start <= new_end) {
                    const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                    if (input.length == 0) {
                        break;
                    }
                    for (let i = 0; i < input.length; i++) {
                        if (keyIndex != and_key.length - 1) {
                            keyIndex = keyIndex + 1;
                        }
                        else {
                            keyIndex = 0;
                        }
                        input[i] = input[i] & and_key[keyIndex];
                    }
                    await ctx.commit(true);
                    new_start += input.length;
                }
            }
            else {
                throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
            }
        }
        if (!consume) {
            ctx.offset = previousStart;
        }
        return;
    }
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
async function OR(ctx, or_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        var new_start = (start || 0);
        const new_end = Math.min(end || ctx.size, ctx.size);
        const previousStart = ctx.offset;
        if (typeof or_key == "number") {
            while (new_start <= new_end) {
                const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    input[i] = input[i] | (or_key & 0xff);
                }
                await ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            if (typeof or_key == "string") {
                or_key = Uint8Array.from(Array.from(or_key).map(letter => letter.charCodeAt(0)));
            }
            if (arrayBufferCheck(or_key)) {
                var number = -1;
                while (new_start <= new_end) {
                    const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                    if (input.length == 0) {
                        break;
                    }
                    for (let i = 0; i < input.length; i++) {
                        if (number != or_key.length - 1) {
                            number = number + 1;
                        }
                        else {
                            number = 0;
                        }
                        input[i] = input[i] | or_key[number];
                    }
                    await ctx.commit(true);
                    new_start += input.length;
                }
            }
            else {
                throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
            }
        }
        if (!consume) {
            ctx.offset = previousStart;
        }
        return;
    }
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
async function XOR(ctx, xor_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        var new_start = (start || 0);
        const new_end = Math.min(end || ctx.size, ctx.size);
        const previousStart = ctx.offset;
        if (typeof xor_key == "number") {
            while (new_start <= new_end) {
                const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    input[i] = input[i] ^ (xor_key & 0xff);
                }
                await ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            if (typeof xor_key == "string") {
                xor_key = Uint8Array.from(Array.from(xor_key).map(letter => letter.charCodeAt(0)));
            }
            if (arrayBufferCheck(xor_key)) {
                var keyIndex = -1;
                while (new_start <= new_end) {
                    const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                    if (input.length == 0) {
                        break;
                    }
                    for (let i = 0; i < input.length; i++) {
                        if (keyIndex != xor_key.length - 1) {
                            keyIndex = keyIndex + 1;
                        }
                        else {
                            keyIndex = 0;
                        }
                        input[i] = input[i] ^ xor_key[keyIndex];
                    }
                    await ctx.commit(true);
                    new_start += input.length;
                }
            }
            else {
                throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
            }
        }
        if (!consume) {
            ctx.offset = previousStart;
        }
        return;
    }
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
async function NOT(ctx, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        var new_start = (start || 0);
        const new_end = Math.min(end || ctx.size, ctx.size);
        const previousStart = ctx.offset;
        while (new_start <= new_end) {
            const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
            if (input.length == 0) {
                break;
            }
            for (let i = 0; i < input.length; i++) {
                input[i] = ~input[i];
            }
            await ctx.commit(true);
            new_start += input.length;
        }
        if (!consume) {
            ctx.offset = previousStart;
        }
        return;
    }
    for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
        ctx.data[i] = ~ctx.data[i];
        if (consume) {
            ctx.offset = i;
            ctx.bitoffset = 0;
        }
    }
    return;
}
async function LSHIFT(ctx, shift_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        var new_start = (start || 0);
        const new_end = Math.min(end || ctx.size, ctx.size);
        const previousStart = ctx.offset;
        if (typeof shift_key == "number") {
            while (new_start <= new_end) {
                const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    input[i] = input[i] << shift_key;
                }
                await ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            if (typeof shift_key == "string") {
                shift_key = Uint8Array.from(Array.from(shift_key).map(letter => letter.charCodeAt(0)));
            }
            if (arrayBufferCheck(shift_key)) {
                let keyIndex = -1;
                while (new_start <= new_end) {
                    const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                    if (input.length == 0) {
                        break;
                    }
                    for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                        if (keyIndex != shift_key.length - 1) {
                            keyIndex = keyIndex + 1;
                        }
                        else {
                            keyIndex = 0;
                        }
                        input[i] = input[i] << shift_key[keyIndex];
                    }
                    await ctx.commit(true);
                    new_start += input.length;
                }
            }
            else {
                throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
            }
        }
        if (!consume) {
            ctx.offset = previousStart;
        }
        return;
    }
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
    return;
}
async function RSHIFT(ctx, shift_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        var new_start = (start || 0);
        const new_end = Math.min(end || ctx.size, ctx.size);
        const previousStart = ctx.offset;
        if (typeof shift_key == "number") {
            while (new_start <= new_end) {
                const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    input[i] = input[i] >> shift_key;
                }
                await ctx.commit(true);
                new_start += input.length;
            }
            return;
        }
        else {
            if (typeof shift_key == "string") {
                shift_key = Uint8Array.from(Array.from(shift_key).map(letter => letter.charCodeAt(0)));
            }
            if (arrayBufferCheck(shift_key)) {
                var keyIndex = -1;
                while (new_start <= new_end) {
                    const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                    if (input.length == 0) {
                        break;
                    }
                    for (let i = 0; i < input.length; i++) {
                        if (keyIndex != shift_key.length - 1) {
                            keyIndex = keyIndex + 1;
                        }
                        else {
                            keyIndex = 0;
                        }
                        input[i] = input[i] >> shift_key[keyIndex];
                    }
                    await ctx.commit(true);
                    new_start += input.length;
                }
            }
            else {
                throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
            }
        }
        if (!consume) {
            ctx.offset = previousStart;
        }
        return;
    }
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
    return;
}
async function ADD(ctx, add_key, start, end, consume) {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + (end || 0) + " of " + ctx.size);
        }
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        var new_start = (start || 0);
        const new_end = Math.min(end || ctx.size, ctx.size);
        const previousStart = ctx.offset;
        if (typeof add_key == "number") {
            while (new_start <= new_end) {
                const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    input[i] = input[i] + add_key;
                }
                await ctx.commit(true);
                new_start += input.length;
            }
        }
        else {
            if (typeof add_key == "string") {
                add_key = Uint8Array.from(Array.from(add_key).map(letter => letter.charCodeAt(0)));
            }
            if (arrayBufferCheck(add_key)) {
                var keyIndex = -1;
                while (new_start <= new_end) {
                    const input = await ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);
                    if (input.length == 0) {
                        break;
                    }
                    for (let i = 0; i < input.length; i++) {
                        if (keyIndex != add_key.length - 1) {
                            keyIndex = keyIndex + 1;
                        }
                        else {
                            keyIndex = 0;
                        }
                        input[i] = input[i] + add_key[keyIndex];
                    }
                    await ctx.commit(true);
                    new_start += input.length;
                }
            }
            else {
                throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
            }
        }
        if (!consume) {
            ctx.offset = previousStart;
        }
        return;
    }
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
    return;
}
// #region Search
async function fString(ctx, searchString) {
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        var lastChunk = new Uint8Array(0);
        const searchStringBuffer = new TextEncoder().encode(searchString);
        var start = ctx.offset;
        const strict_saver = ctx.strict;
        ctx.strict = true;
        while (start < ctx.size) {
            const currentChunk = await ctx.read(start, Math.min(chunkSize, ctx.size - start), false);
            if (currentChunk.length === 0) { // No more data to read
                break;
            }
            // Concatenate the last part of the previous chunk with the current chunk
            const combinedBuffer = Buffer.concat([lastChunk, new Uint8Array(currentChunk)]);
            // Search for the string in the combined buffer
            var offset = 0;
            while (offset <= combinedBuffer.length - searchStringBuffer.length) {
                const index = combinedBuffer.indexOf(searchStringBuffer, offset);
                if (index === -1) {
                    break;
                }
                // Found the search string
                ctx.strict = strict_saver;
                return start + index - lastChunk.length;
            }
            // Update the last chunk for the next iteration
            lastChunk = new Uint8Array(currentChunk.subarray(-searchStringBuffer.length + 1));
            start += currentChunk.length;
        }
        ctx.strict = strict_saver;
        return -1;
    }
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
async function fNumber(ctx, targetNumber, bits, unsigned, endian) {
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        let lastChunk = new Uint8Array(0);
        const totalBits = Math.floor(bits / 8);
        var start = ctx.offset;
        while (start < ctx.size) {
            const currentChunk = await ctx.read(start, Math.min(chunkSize, ctx.size - start), false);
            if (currentChunk.length === 0) { // No more data to read
                break;
            }
            // Concatenate the last part of the previous chunk with the current chunk
            const combinedBuffer = Buffer.concat([lastChunk, new Uint8Array(currentChunk)]);
            // Process the combined buffer to find the target number
            for (let z = 0; z <= combinedBuffer.length - totalBits; z++) {
                var value = 0;
                var off_in_bits = 0;
                for (let i = 0; i < bits;) {
                    const remaining = bits - i;
                    const bitOffset = off_in_bits & 7;
                    const currentByte = combinedBuffer[z + (off_in_bits >> 3)];
                    const read = Math.min(remaining, 8 - bitOffset);
                    if ((endian !== undefined ? endian : ctx.endian) === "big") {
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
                if (unsigned === true || bits <= 7) {
                    value = value >>> 0;
                }
                else {
                    if (bits !== 32 && (value & (1 << (bits - 1)))) {
                        value |= -1 ^ ((1 << bits) - 1);
                    }
                }
                if (value === targetNumber) {
                    return start + z - lastChunk.length; // Found the byte, return the index from current
                }
            }
            // Update the last chunk for the next iteration
            lastChunk = new Uint8Array(combinedBuffer.subarray(-totalBits + 1));
            start += currentChunk.length;
        }
        return -1; // number not found
    }
    await check_size(ctx, Math.floor(bits / 8), 0);
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
async function fHalfFloat(ctx, targetNumber, endian) {
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        let size = 2;
        for (let position = 0; position <= ctx.size - size;) {
            const buffer = await ctx.read(position, Math.min(chunkSize, ctx.size - position), false);
            if (buffer.length == 0) {
                break;
            }
            const data = new Uint8Array(buffer);
            for (let z = 0; z <= data.length - size; z++) {
                var value = 0;
                if ((endian !== undefined ? endian : ctx.endian) === "little") {
                    value = (data[z + 1] << 8) | data[z];
                }
                else {
                    value = (data[z] << 8) | data[z + 1];
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
                    return position + z; // Found the number, return the index
                }
            }
            position += buffer.length;
        }
        return -1; // number not found
    }
    await check_size(ctx, 2, 0);
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
async function fFloat(ctx, targetNumber, endian) {
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        const size = 4; // Size of float in bytes
        for (let position = 0; position <= ctx.size - size;) {
            const buffer = await ctx.read(position, Math.min(chunkSize, ctx.size - position));
            if (buffer.length == 0) {
                break;
            }
            const data = new Uint8Array(buffer);
            for (let z = 0; z <= data.length - size; z++) {
                var value = 0;
                if ((endian !== undefined ? endian : ctx.endian) === "little") {
                    value = (data[z + 3] << 24) | (data[z + 2] << 16) | (data[z + 1] << 8) | data[z];
                }
                else {
                    value = (data[z] << 24) | (data[z + 1] << 16) | (data[z + 2] << 8) | data[z + 3];
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
                    return position + z; // Found the number, return the index
                }
            }
            position += buffer.length;
        }
        return -1; // number not found
    }
    await check_size(ctx, 4, 0);
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
async function fBigInt(ctx, targetNumber, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        let lastChunk = new Uint8Array(0);
        const targetBigInt = BigInt(targetNumber);
        while (ctx.offset < ctx.size) {
            const currentChunk = await ctx.read(ctx.offset, Math.min(chunkSize, ctx.size - ctx.offset), false);
            // No more data to read
            if (currentChunk.length === 0) {
                break;
            }
            // Concatenate the last part of the previous chunk with the current chunk
            const combinedBuffer = Buffer.concat([lastChunk, new Uint8Array(currentChunk)]);
            // Process the combined buffer to find the target BigInt
            for (let z = 0; z <= combinedBuffer.length - 8; z++) {
                var value = BigInt(0);
                if ((endian !== undefined ? endian : ctx.endian) === "little") {
                    for (let i = 0; i < 8; i++) {
                        value = value | (BigInt(combinedBuffer[z + i] & 0xFF)) << BigInt(8 * i);
                    }
                }
                else {
                    for (let i = 0; i < 8; i++) {
                        value = (value << BigInt(8)) | BigInt(combinedBuffer[z + i] & 0xFF);
                    }
                }
                if (unsigned === undefined || unsigned === false) {
                    if (value & (BigInt(1) << BigInt(63))) {
                        value -= BigInt(1) << BigInt(64);
                    }
                }
                if (value === targetBigInt) {
                    return ctx.offset + z - lastChunk.length; // Found the byte, return the index from current
                }
            }
            // Update the last chunk for the next iteration
            lastChunk = new Uint8Array(combinedBuffer.subarray(-8 + 1));
            ctx.offset += currentChunk.length;
        }
        return -1; // number not found
    }
    await check_size(ctx, 8, 0);
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
async function fDoubleFloat(ctx, targetNumber, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    await ctx.open();
    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes
        const size = 8; // Size of double float in bytes
        for (let position = 0; position <= ctx.size - size;) {
            const buffer = await ctx.read(position, Math.min(chunkSize, ctx.size - position));
            if (buffer.length == 0) {
                break;
            }
            const data = new Uint8Array(buffer);
            for (let z = 0; z <= data.length - size; z++) {
                var value = BigInt(0);
                if ((endian !== undefined ? endian : ctx.endian) === "little") {
                    for (let i = 0; i < size; i++) {
                        value = value | BigInt(data[z + i] & 0xFF) << BigInt(8 * i);
                    }
                }
                else {
                    for (let i = 0; i < size; i++) {
                        value = (value << BigInt(8)) | BigInt(data[z + i] & 0xFF);
                    }
                }
                const sign = (value & BigInt("9223372036854775808")) >> BigInt(63);
                const exponent = Number((value & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;
                const fraction = Number(value & BigInt("4503599627370495")) / Math.pow(2, 52);
                let floatValue;
                if (exponent === -1023) {
                    if (fraction === 0) {
                        floatValue = (sign === BigInt(0)) ? 0 : -0; // +/-0
                    }
                    else {
                        // Denormalized number
                        floatValue = (sign === BigInt(0) ? 1 : -1) * Math.pow(2, -1022) * fraction;
                    }
                }
                else if (exponent === 1024) {
                    if (fraction === 0) {
                        floatValue = (sign === BigInt(0)) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                    }
                    else {
                        floatValue = Number.NaN;
                    }
                }
                else {
                    // Normalized number
                    floatValue = (sign === BigInt(0) ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
                }
                if (floatValue === targetNumber) {
                    return position + z; // Found the number, return the index
                }
            }
            position += buffer.length;
        }
        return -1; // number not found
    }
    await check_size(ctx, 8, 0);
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
async function wbit(ctx, value, bits, unsigned, endian) {
    await ctx.open();
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
            await ctx.extendArray(ctx.extendBufferSize);
        }
        else {
            await ctx.extendArray(size_needed - ctx.size);
        }
    }
    var off_in_bits = (ctx.offset * 8) + ctx.bitoffset;
    for (var i = 0; i < bits;) {
        const remaining = bits - i;
        const bitOffset = off_in_bits & 7;
        const byteOffset = off_in_bits >> 3;
        const written = Math.min(remaining, 8 - bitOffset);
        var input = ctx.data;
        var bOff = byteOffset;
        if (ctx.mode == "file") {
            input = await ctx.read(byteOffset, Math.min(1, ctx.size - ctx.offset), false);
            bOff = 0;
        }
        if ((endian != undefined ? endian : ctx.endian) == "big") {
            let mask = ~(-1 << written);
            let writeBits = (value >> (bits - i - written)) & mask;
            var destShift = 8 - bitOffset - written;
            let destMask = ~(mask << destShift);
            input[bOff] = (input[bOff] & destMask) | (writeBits << destShift);
        }
        else {
            let mask = ~(0xFF << written);
            let writeBits = value & mask;
            value >>= written;
            let destMask = ~(mask << bitOffset);
            input[bOff] = (input[bOff] & destMask) | (writeBits << bitOffset);
        }
        off_in_bits += written;
        i += written;
        await ctx.commit(false);
    }
    ctx.offset = ctx.offset + Math.floor(((bits) + ctx.bitoffset) / 8); //end byte
    ctx.bitoffset = ((bits) + ctx.bitoffset) % 8;
}
async function rbit(ctx, bits, unsigned, endian) {
    await ctx.open();
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
        var currentByte = ctx.data[off_in_bits >> 3];
        if (ctx.mode == "file") {
            currentByte = await ctx.read(off_in_bits >> 3, Math.min(1, ctx.size - off_in_bits >> 3), false)[0];
        }
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
async function wbyte(ctx, value, unsigned) {
    await ctx.open();
    await check_size(ctx, 1, 0);
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
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 1, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canInt8) {
        if ((unsigned == undefined || unsigned == false)) {
            view.setInt8(offset, value);
        }
        else {
            view.setUint8(offset, value);
        }
    }
    else {
        data[offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
    }
    await ctx.commit(false);
    ctx.offset += 1;
    ctx.bitoffset = 0;
    return;
}
async function rbyte(ctx, unsigned) {
    await ctx.open();
    await check_size(ctx, 1);
    var read;
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 1, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canInt8) {
        if ((unsigned == undefined || unsigned == false)) {
            read = view.getInt8(offset);
        }
        else {
            read = view.getUint8(offset);
        }
        ctx.offset += 1;
        ctx.bitoffset = 0;
        return read;
    }
    read = data[offset];
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
async function wint16(ctx, value, unsigned, endian) {
    await ctx.open();
    await check_size(ctx, 2, 0);
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
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 2, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canInt16) {
        if ((unsigned == undefined || unsigned == false)) {
            view.setInt16(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            view.setUint16(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    }
    else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            data[offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
            data[offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
        }
        else {
            data[offset] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
            data[offset + 1] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
        }
    }
    await ctx.commit(false);
    ctx.offset += 2;
    ctx.bitoffset = 0;
}
async function rint16(ctx, unsigned, endian) {
    await ctx.open();
    await check_size(ctx, 2);
    var read;
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 2, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canInt16) {
        if (unsigned == undefined || unsigned == false) {
            read = view.getInt16(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            read = view.getUint16(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 2;
        ctx.bitoffset = 0;
        return read;
    }
    else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            read = ((data[offset + 1] & 0xFFFF) << 8) | (data[offset] & 0xFFFF);
        }
        else {
            read = ((data[offset] & 0xFFFF) << 8) | (data[offset + 1] & 0xFFFF);
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
async function rhalffloat(ctx, endian) {
    if (canFloat16) {
        await ctx.open();
        await check_size(ctx, 2);
        var data = ctx.data;
        var view = ctx.view;
        var offset = ctx.offset;
        if (ctx.mode == "file") {
            data = await ctx.read(ctx.offset, 2, false);
            view = new DataView(data.buffer, data.byteOffset);
            offset = 0;
        }
        const float16Value = view.getFloat16(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 2;
        ctx.bitoffset = 0;
        return float16Value;
    }
    var uint16Value = await ctx.readInt16(true, (endian != undefined ? endian : ctx.endian));
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
async function whalffloat(ctx, value, endian) {
    await ctx.open();
    await check_size(ctx, 2, 0);
    const maxValue = 65504;
    const minValue = 5.96e-08;
    if (value < minValue || value > maxValue) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
        throw new Error('Value is out of range for the specified half float length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
    }
    if (canFloat16) {
        var data = ctx.data;
        var view = ctx.view;
        var offset = ctx.offset;
        if (ctx.mode == "file") {
            data = await ctx.read(ctx.offset, 2, false);
            view = new DataView(data.buffer, data.byteOffset);
            offset = 0;
        }
        view.setFloat16(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        await ctx.commit(false);
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
    var data = ctx.data;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 2, false);
        offset = 0;
    }
    // Write bytes based on endianness
    if ((endian == undefined ? ctx.endian : endian) == "little") {
        data[offset] = halfFloatBits & 0xFF;
        data[offset + 1] = (halfFloatBits >> 8) & 0xFF;
    }
    else {
        data[offset] = (halfFloatBits >> 8) & 0xFF;
        data[offset + 1] = halfFloatBits & 0xFF;
    }
    await ctx.commit(false);
    ctx.offset += 2;
    ctx.bitoffset = 0;
}
// #region Write / Read Int32
async function wint32(ctx, value, unsigned, endian) {
    await ctx.open();
    await check_size(ctx, 4, 0);
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
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 4, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canInt32) {
        if ((unsigned == undefined || unsigned == false)) {
            view.setInt32(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            view.setUint32(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    }
    else {
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            data[offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
            data[offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            data[offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            data[offset + 3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        }
        else {
            data[offset] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
            data[offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
            data[offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
            data[offset + 3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        }
    }
    await ctx.commit(false);
    ctx.offset += 4;
    ctx.bitoffset = 0;
}
async function rint32(ctx, unsigned, endian) {
    await ctx.open();
    await check_size(ctx, 4);
    var read;
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 4, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canInt32) {
        if ((unsigned == undefined || unsigned == false)) {
            read = view.getInt32(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            read = view.getUint32(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 4;
        ctx.bitoffset = 0;
        return read;
    }
    if ((endian != undefined ? endian : ctx.endian) == "little") {
        read = ((data[offset + 3] & 0xFF) << 24) |
            ((data[offset + 2] & 0xFF) << 16) |
            ((data[offset + 1] & 0xFF) << 8) |
            (data[offset] & 0xFF);
    }
    else {
        read = ((data[offset] & 0xFF) << 24) |
            ((data[offset + 1] & 0xFF) << 16) |
            ((data[offset + 2] & 0xFF) << 8) |
            (data[offset + 3] & 0xFF);
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
async function rfloat(ctx, endian) {
    if (canFloat32) {
        await ctx.open();
        await check_size(ctx, 4);
        var data = ctx.data;
        var view = ctx.view;
        var offset = ctx.offset;
        if (ctx.mode == "file") {
            data = await ctx.read(ctx.offset, 4, false);
            view = new DataView(data.buffer, data.byteOffset);
            offset = 0;
        }
        const float32Value = view.getFloat32(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 4;
        ctx.bitoffset = 0;
        return float32Value;
    }
    const uint32Value = await ctx.readInt32(true, (endian == undefined ? ctx.endian : endian));
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
async function wfloat(ctx, value, endian) {
    await ctx.open();
    await check_size(ctx, 4, 0);
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
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 4, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canFloat32) {
        view.setFloat32(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
    }
    else {
        const arrayFloat = new Float32Array(1);
        arrayFloat[0] = value;
        if (endian != undefined ? endian == "little" : ctx.endian == "little") {
            data[offset] = arrayFloat.buffer[0];
            data[offset + 1] = arrayFloat.buffer[1];
            data[offset + 2] = arrayFloat.buffer[2];
            data[offset + 3] = arrayFloat.buffer[3];
        }
        else {
            data[offset] = arrayFloat.buffer[3];
            data[offset + 1] = arrayFloat.buffer[2];
            data[offset + 2] = arrayFloat.buffer[1];
            data[offset + 3] = arrayFloat.buffer[0];
        }
    }
    await ctx.commit(false);
    ctx.offset += 4;
    ctx.bitoffset = 0;
}
// #region Write / Read Int64
async function rint64(ctx, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    await ctx.open();
    await check_size(ctx, 8);
    var value = BigInt(0);
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 8, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canBigInt64) {
        if (unsigned == undefined || unsigned == false) {
            value = view.getBigInt64(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            value = view.getBigUint64(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        ctx.offset += 8;
    }
    else {
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((data[offset] & 0xFF)) << BigInt(8 * i);
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
                value = (value << BigInt(8)) | BigInt((data[offset] & 0xFF));
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
    if (ctx.enforceBigInt) {
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
async function wint64(ctx, value, unsigned, endian) {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }
    await ctx.open();
    await check_size(ctx, 8, 0);
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
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 8, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canBigInt64) {
        if (unsigned == undefined || unsigned == false) {
            view.setBigInt64(offset, BigInt(value), endian != undefined ? endian == "little" : ctx.endian == "little");
        }
        else {
            view.setBigUint64(offset, BigInt(value), endian != undefined ? endian == "little" : ctx.endian == "little");
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
                    data[offset + i * 4 + 0] = int32Array[i];
                    data[offset + i * 4 + 1] = (int32Array[i] >> 8);
                    data[offset + i * 4 + 2] = (int32Array[i] >> 16);
                    data[offset + i * 4 + 3] = (int32Array[i] >> 24);
                }
                else {
                    data[offset + i * 4 + 0] = int32Array[i] & 0xFF;
                    data[offset + i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                    data[offset + i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                    data[offset + i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            }
            else {
                if (unsigned == undefined || unsigned == false) {
                    data[offset + (1 - i) * 4 + 3] = int32Array[i];
                    data[offset + (1 - i) * 4 + 2] = (int32Array[i] >> 8);
                    data[offset + (1 - i) * 4 + 1] = (int32Array[i] >> 16);
                    data[offset + (1 - i) * 4 + 0] = (int32Array[i] >> 24);
                }
                else {
                    data[offset + (1 - i) * 4 + 3] = int32Array[i] & 0xFF;
                    data[offset + (1 - i) * 4 + 2] = (int32Array[i] >> 8) & 0xFF;
                    data[offset + (1 - i) * 4 + 1] = (int32Array[i] >> 16) & 0xFF;
                    data[offset + (1 - i) * 4 + 0] = (int32Array[i] >> 24) & 0xFF;
                }
            }
        }
    }
    await ctx.commit(false);
    ctx.offset += 8;
    ctx.bitoffset = 0;
}
// #region Write / Read Float64
async function wdfloat(ctx, value, endian) {
    await ctx.open();
    await check_size(ctx, 8, 0);
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
    var data = ctx.data;
    var view = ctx.view;
    var offset = ctx.offset;
    if (ctx.mode == "file") {
        data = await ctx.read(ctx.offset, 8, false);
        view = new DataView(data.buffer, data.byteOffset);
        offset = 0;
    }
    if (canFloat64) {
        view.setFloat64(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
    }
    else {
        const intArray = new Int32Array(2);
        const floatArray = new Float64Array(intArray.buffer);
        floatArray[0] = value;
        const bytes = new Uint8Array(intArray.buffer);
        for (let i = 0; i < 8; i++) {
            if ((endian == undefined ? ctx.endian : endian) == "little") {
                data[offset + i] = bytes[i];
            }
            else {
                data[offset + (7 - i)] = bytes[i];
            }
        }
    }
    await ctx.commit(false);
    ctx.offset += 8;
    ctx.bitoffset = 0;
}
async function rdfloat(ctx, endian) {
    if (canFloat64) {
        await ctx.open();
        await check_size(ctx, 8, 0);
        const floatValue = ctx.view.getFloat64(ctx.offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        ctx.offset += 8;
        ctx.bitoffset = 0;
        return floatValue;
    }
    endian = (endian == undefined ? ctx.endian : endian);
    var uint64Value = await ctx.readInt64(true, endian);
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
async function rstring(ctx, options) {
    await ctx.open();
    var length = options && options.length;
    var stringType = options && options.stringType || 'utf-8';
    var terminateValue = options && options.terminateValue;
    var lengthReadSize = options && options.lengthReadSize || 1;
    var stripNull = options && options.stripNull || true;
    var encoding = options && options.encoding || 'utf-8';
    var endian = options && options.endian || ctx.endian;
    var terminate = terminateValue;
    if (length != undefined) {
        await check_size(ctx, length);
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
                var read = await ctx.readUByte();
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
                var read = await ctx.readInt16(true, endian);
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
            maxBytes = await ctx.readUByte();
        }
        else if (lengthReadSize == 2) {
            maxBytes = await ctx.readInt16(true, endian);
        }
        else if (lengthReadSize == 4) {
            maxBytes = await ctx.readInt32(true, endian);
        }
        else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";
            throw new Error("Invalid length read size: " + lengthReadSize);
        }
        // Read the string as Pascal or Delphi encoded
        const encodedBytes = [];
        for (let i = 0; i < maxBytes; i++) {
            if (stringType == 'wide-pascal') {
                const read = await ctx.readInt16(true, endian);
                i++;
                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read);
                }
            }
            else {
                const read = await ctx.readUByte();
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
async function wstring(ctx, string, options) {
    await ctx.open();
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
        await check_size(ctx, totalLength, 0);
        var data = ctx.data;
        var offset = ctx.offset;
        if (ctx.mode == "file") {
            data = await ctx.read(ctx.offset, 8, false);
            offset = 0;
        }
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < encodedString.length; i++) {
            if (stringType === 'utf-16') {
                const charCode = encodedString[i];
                if (endian == "little") {
                    data[offset + i * 2] = charCode & 0xFF;
                    data[offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                }
                else {
                    data[offset + i * 2 + 1] = charCode & 0xFF;
                    data[offset + i * 2] = (charCode >> 8) & 0xFF;
                }
            }
            else {
                data[offset + i] = encodedString[i];
            }
        }
        if (terminateValue != undefined) {
            if (stringType === 'utf-16') {
                data[offset + totalLength - 1] = terminateValue & 0xFF;
                data[offset + totalLength] = (terminateValue >> 8) & 0xFF;
            }
            else {
                data[offset + totalLength] = terminateValue;
            }
        }
        await ctx.commit(false);
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
            await ctx.writeUByte(totalLength);
        }
        else if (lengthWriteSize == 2) {
            await ctx.writeUInt16(totalLength, endian);
        }
        else if (lengthWriteSize == 4) {
            await ctx.writeUInt32(totalLength, endian);
        }
        await check_size(ctx, totalLength, 0);
        var data = ctx.data;
        var offset = ctx.offset;
        if (ctx.mode == "file") {
            data = await ctx.read(ctx.offset, 8, false);
            offset = 0;
        }
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < totalLength; i++) {
            if (stringType == 'wide-pascal') {
                if (endian == "little") {
                    data[offset + i] = encodedString[i];
                    data[offset + i + 1] = encodedString[i + 1];
                }
                else {
                    data[offset + i + 1] = encodedString[i];
                    data[offset + i] = encodedString[i + 1];
                }
                i++;
            }
            else {
                data[offset + i] = encodedString[i];
            }
        }
        await ctx.commit(false);
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
class BiBaseAsync {
    /**
     * Get the current buffer data.
     *
     * @type {DataType}
     */
    get data() {
        return __classPrivateFieldGet(this, _BiBaseAsync_data, "f");
    }
    ;
    /**
     * Set the current buffer data.
     *
     * @param {DataType} data
     */
    set data(data) {
        if (this.isBufferOrUint8Array(data)) {
            __classPrivateFieldSet(this, _BiBaseAsync_data, data, "f");
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
        _BiBaseAsync_data.set(this, null);
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
        this.fh = null;
        this.filePath = null;
        this.fsMode = "r";
        this.isWriter = false;
        this.directWrite = false;
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
            if (typeof Buffer === 'undefined' || typeof fs$2 == "undefined") {
                throw new Error("Need node to read or write files.");
            }
            this.filePath = input;
            this.mode = "file";
        }
        else {
            this.mode = "memory";
        }
        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH();
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
    async writeMode(mode) {
        if (mode) {
            this.strict = false;
            if (this.mode == "file") {
                this.fsMode = "w+";
                await this.close();
                await this.open();
            }
            return;
        }
        else {
            this.strict = true;
            if (this.mode == "file") {
                this.fsMode = "r";
                await this.close();
                await this.open();
            }
            return;
        }
    }
    ;
    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     *
     * @returns {Promise<number>} file size
     */
    async open() {
        if (this.mode == "memory") {
            return this.size;
        }
        if (this.fh != null) {
            return this.size;
        }
        if (fs$2 == undefined) {
            throw new Error("Can't load file without Node.");
        }
        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH();
        }
        try {
            this.fh = await fs$2.open(this.filePath, this.fsMode);
        }
        catch (error) {
            throw new Error(error);
        }
        await this.updateSize();
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
                        await this.extendArray(this.extendBufferSize);
                    }
                    else {
                        await this.extendArray(this.offset - this.size);
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
    async updateSize() {
        if (this.mode == "memory") {
            return;
        }
        if (fs$2 == undefined) {
            throw new Error("Can't read file without Node.");
        }
        if (this.fh !== null) {
            try {
                const stat = await this.fh.stat();
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
     * Closes the file.
     *
     * @returns {Promise<void>}
     */
    async close() {
        if (this.mode == "memory") {
            __classPrivateFieldSet(this, _BiBaseAsync_data, undefined, "f");
            this.view = undefined;
            return;
        }
        await this.open();
        if (this.fh === null) {
            return; // Already closed / or not open
        }
        if (fs$2 == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }
        try {
            await this.fh.close();
        }
        catch (error) {
            throw new Error(error);
        }
        this.fh = null;
        return;
    }
    ;
    /**
     * Internal reader
     *
     * @param start this.offset
     * @param length
     * @param consume
     * @returns {Promise<DataType>}
     */
    async read(start, length, consume = false) {
        if (this.mode == "memory") {
            return this.lift(start, start + length, consume);
        }
        await this.open();
        if (this.fh === null) {
            throw new Error('File is not open yet.');
        }
        if (length < 1) {
            return Buffer.alloc(0);
        }
        const end = start + length;
        if (length > this.maxFileSize) {
            throw new Error("File read is greater than Node's max buffer size: " + this.maxFileSize);
        }
        if (end > this.size) {
            if (this.strict == false) {
                if (this.extendBufferSize != 0) {
                    await this.extendArray(this.extendBufferSize);
                }
                else {
                    await this.extendArray(length);
                }
            }
            else {
                throw new Error('File read is outside data size while in strict mode.');
            }
        }
        const data = Buffer.alloc(length);
        try {
            const { bytesRead } = await this.fh.read(data, 0, data.length, start);
            if (bytesRead != length) {
                throw new Error("Didn't read the amount needed for value: " + bytesRead + " of " + length);
            }
        }
        catch (error) {
            throw new Error(error);
        }
        this.data = data;
        if (consume) {
            this.offset = start + data.length;
            this.bitoffset = 0;
        }
        return this.data;
    }
    ;
    /**
     * Write buffer to data
     *
     * @param {DataType} data
     * @param {boolean} consume
     * @param {number} start - likely this.offset
     * @returns {Promise<number>}
     */
    async write(data, consume = false, start = this.offset) {
        if (this.mode == "memory") {
            await this.insert(data, consume, start);
            return data.length;
        }
        await this.open();
        if (fs$2 == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }
        if (this.fh === null) {
            throw new Error('File is not open yet.');
        }
        if (data.length < 1) {
            return 0;
        }
        const end = start + data.length;
        if (end > this.size) {
            if (this.strict == false) {
                if (this.extendBufferSize != 0) {
                    await this.extendArray(this.extendBufferSize);
                }
                else {
                    await this.extendArray(data.length);
                }
            }
            else {
                throw new Error('File write is outside of data size while in strict mode.');
            }
        }
        var bytesWritten;
        try {
            const written = await this.fh.write(data, 0, data.length, start);
            bytesWritten = written.bytesWritten;
        }
        catch (error) {
            throw new Error(error);
        }
        await this.updateSize();
        if (consume) {
            this.offset = start + bytesWritten;
        }
        return bytesWritten;
    }
    ;
    /**
     * Write data buffer back to file
     *
     * @returns {Promise<Buffer>}
     */
    async commit(consume = true) {
        if (this.mode == "memory") {
            return this.data.length;
        }
        await this.open();
        if (this.data === null) {
            throw new Error("No data to write.");
        }
        return await this.write(this.data, consume, this.offset);
    }
    ;
    /**
     * syncs the data to file
     */
    async flush() {
        if (this.fh) {
            await this.fh.sync();
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
        if (this.mode == "memory") {
            return;
        }
        try {
            await this.fh.close();
            this.fh = null;
            await fs$2.rename(this.filePath, newFilePath);
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
     * Note: This is permanentand can't be undone.
     *
     * It doesn't send the file to the recycling bin for recovery.
     */
    async deleteFile() {
        if (this.mode == "memory") {
            return;
        }
        try {
            await this.fh.close();
            this.fh = null;
            await fs$2.unlink(this.filePath);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    ;
    async extendArray(to_padd) {
        return await extendarray(this, to_padd);
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
        if (__classPrivateFieldGet(this, _BiBaseAsync_data, "f")) {
            this.view = new DataView(__classPrivateFieldGet(this, _BiBaseAsync_data, "f").buffer, __classPrivateFieldGet(this, _BiBaseAsync_data, "f").byteOffset ?? 0, __classPrivateFieldGet(this, _BiBaseAsync_data, "f").byteLength);
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
     * @returns {DataType} ``Buffer``
     */
    async get() {
        if (this.extendBufferSize != 0) {
            await this.trim();
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
     * @returns {Promise<DataType>} ``Buffer``
     */
    async return() {
        return await this.get();
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
    async hexdump(options = {}) {
        return await hexDumpBase(this, options);
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
    async end() {
        if (this.mode == "memory") {
            __classPrivateFieldSet(this, _BiBaseAsync_data, undefined, "f");
            this.view = undefined;
            return;
        }
        await this.commit();
        return;
    }
    ;
    /**
     * removes data.
     *
     * Commits any changes to file when editing a file.
     */
    async done() {
        return await this.end();
    }
    ;
    /**
     * removes data.
     *
     * Commits any changes to file when editing a file.
     */
    async finished() {
        return await this.end();
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
    async findString(string) {
        return await fString(this, string);
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
    async findByte(value, unsigned, endian) {
        return await fNumber(this, value, 8, unsigned == undefined ? true : unsigned, endian);
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
    async findShort(value, unsigned, endian) {
        return await fNumber(this, value, 16, unsigned == undefined ? true : unsigned, endian);
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
    async findInt(value, unsigned, endian) {
        return await fNumber(this, value, 32, unsigned == undefined ? true : unsigned, endian);
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
    async findInt64(value, unsigned, endian) {
        return await fBigInt(this, value, unsigned == undefined ? true : unsigned, endian);
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
    async findHalfFloat(value, endian) {
        return await fHalfFloat(this, value, endian);
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
    async findFloat(value, endian) {
        return await fFloat(this, value, endian);
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
    async findDoubleFloat(value, endian) {
        return await fDoubleFloat(this, value, endian);
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
    async skip(bytes, bits) {
        return await skip(this, bytes, bits);
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
        return await goto(this, byte, bit);
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
        return await this.skip(bytes, bits);
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
    async goto(byte, bit) {
        return await goto(this, byte, bit);
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
        return await this.goto(byte, bit);
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
        return await this.goto(byte, bit);
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
     * @returns {Promise<DataType>} Removed data as ``Buffer``
     */
    async delete(startOffset, endOffset, consume) {
        return await remove(this, startOffset || 0, endOffset || this.offset, consume || false, true);
    }
    ;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {Promise<DataType>} Removed data as ``Buffer``
     */
    async clip() {
        return await remove(this, this.offset, this.size, false, true);
    }
    ;
    /**
     * Deletes part of data from current byte position to end, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @returns {Promise<DataType>} Removed data as ``Buffer``
     */
    async trim() {
        return await remove(this, this.offset, this.size, false, true);
    }
    ;
    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     *
     * Note: Errors in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Promise<DataType>} Removed data as ``Buffer```
     */
    async crop(length, consume) {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    ;
    /**
     * Deletes part of data from current position to supplied length, returns removed.
     *
     * Note: Only works in strict mode.
     *
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Promise<DataType>} Removed data as ``Buffer``
     */
    async drop(length, consume) {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    ;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    async replace(data, consume, offset) {
        return await addData(this, data, consume || false, offset || this.offset, true);
    }
    ;
    /**
     * Replaces data in data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    async overwrite(data, consume, offset) {
        return await addData(this, data, consume || false, offset || this.offset, true);
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
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async lift(startOffset, endOffset, consume, fillValue) {
        return await remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    ;
    /**
     * Returns part of data from current byte position to end of data unless supplied.
     *
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async fill(startOffset, endOffset, consume, fillValue) {
        return await remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async extract(length, consume) {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async slice(length, consume) {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    ;
    /**
     * Extract data from current position to length supplied.
     *
     * Note: Does not affect supplied data.
     *
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async wrap(length, consume) {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, false);
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
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    async insert(data, consume, offset) {
        return await addData(this, data, consume || false, offset || this.offset, false);
    }
    ;
    /**
     * Inserts data into data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    async place(data, consume, offset) {
        return await addData(this, data, consume || false, offset || this.offset, false);
    }
    ;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async unshift(data, consume) {
        return await addData(this, data, consume || false, 0, false);
    }
    ;
    /**
     * Adds data to start of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async prepend(data, consume) {
        return await addData(this, data, consume || false, 0, false);
    }
    ;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async push(data, consume) {
        return await addData(this, data, consume || false, this.size, false);
    }
    ;
    /**
     * Adds data to end of supplied data.
     *
     * Note: Errors on strict mode.
     *
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async append(data, consume) {
        return await addData(this, data, consume || false, this.size, false);
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
    async xor(xorKey, startOffset, endOffset, consume) {
        var XORKey = xorKey;
        if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        }
        else if (!(this.isBufferOrUint8Array(XORKey) || typeof xorKey == "number")) {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return await XOR(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * XOR data.
     *
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async xorThis(xorKey, length, consume) {
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
        return await XOR(this, XORKey, this.offset, this.offset + Length, consume || false);
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
    async or(orKey, startOffset, endOffset, consume) {
        var ORKey = orKey;
        if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        }
        else if (!(this.isBufferOrUint8Array(ORKey) || typeof orKey == "number")) {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return await OR(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
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
        return await OR(this, ORKey, this.offset, this.offset + Length, consume || false);
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
    async and(andKey, startOffset, endOffset, consume) {
        var ANDKey = andKey;
        if (typeof ANDKey == "string") {
            ANDKey = new TextEncoder().encode(ANDKey);
        }
        else if (!(typeof ANDKey == "object" || typeof ANDKey == "number")) {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return await AND(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * AND data.
     *
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async andThis(andKey, length, consume) {
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
        return await AND(this, ANDKey, this.offset, this.offset + Length, consume || false);
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
    async add(addKey, startOffset, endOffset, consume) {
        var addedKey = addKey;
        if (typeof addedKey == "string") {
            addedKey = new TextEncoder().encode(addedKey);
        }
        else if (!(typeof addedKey == "object" || typeof addedKey == "number")) {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return await ADD(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Add value to data.
     *
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async addThis(addKey, length, consume) {
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
        return await ADD(this, AddedKey, this.offset, this.offset + Length, consume || false);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async not(startOffset, endOffset, consume) {
        return await NOT(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Not data.
     *
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async notThis(length, consume) {
        return await NOT(this, this.offset, this.offset + (length || 1), consume || false);
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
    async lShift(shiftKey, startOffset, endOffset, consume) {
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "string") {
            lShiftKey = new TextEncoder().encode(lShiftKey);
        }
        else if (!(typeof lShiftKey == "object" || typeof lShiftKey == "number")) {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return await LSHIFT(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Left shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async lShiftThis(shiftKey, length, consume) {
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
        return await LSHIFT(this, shiftKey, this.offset, this.offset + Length, consume || false);
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
    async rShift(shiftKey, startOffset, endOffset, consume) {
        var rShiftKey = shiftKey;
        if (typeof rShiftKey == "string") {
            rShiftKey = new TextEncoder().encode(rShiftKey);
        }
        else if (!(typeof rShiftKey == "object" || typeof rShiftKey == "number")) {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return await RSHIFT(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    ;
    /**
     * Right shift data.
     *
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async rShiftThis(shiftKey, length, consume) {
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
        return await RSHIFT(this, lShiftKey, this.offset, this.offset + Length, consume || false);
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
    async writeBit(value, bits, unsigned, endian) {
        return await wbit(this, value, bits, unsigned, endian);
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {Promise<number>}
     */
    async writeUBitBE(value, bits) {
        return await wbit(this, value, bits, true, "big");
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
     * @returns {Promise<void>}
     */
    async writeBitBE(value, bits, unsigned) {
        return await wbit(this, value, bits, unsigned, "big");
    }
    ;
    /**
     * Bit field writer.
     *
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {Promise<void>}
     */
    async writeUBitLE(value, bits) {
        return await wbit(this, value, bits, true, "little");
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
     * @returns {Promise<void>}
     */
    async writeBitLE(value, bits, unsigned) {
        return await wbit(this, value, bits, unsigned, "little");
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
     * @returns {Promise<number>}
     */
    async readBit(bits, unsigned, endian) {
        return await rbit(this, bits, unsigned, endian);
    }
    ;
    /**
     * Bit field reader.
     *
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
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
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
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
     * @returns {Promise<number>}
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
     * @returns {number}
     */
    async readBitLE(bits, unsigned) {
        return await this.readBit(bits, unsigned, "little");
    }
    ;
    ///////////////////////////////
    // #region BYTE READER
    ///////////////////////////////
    /**
     * Read byte.
     *
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {Promise<number>}
     */
    async readByte(unsigned) {
        return await rbyte(this, unsigned);
    }
    ;
    /**
     * Read multiple bytes.
     *
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {Promise<number[]>}
     */
    async readBytes(amount, unsigned) {
        const array = [];
        for (let i = 0; i < amount; i++) {
            const num = await rbyte(this, unsigned);
            array.push(num);
        }
        return array;
    }
    ;
    /**
     * Write byte.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    async writeByte(value, unsigned) {
        return await wbyte(this, value, unsigned);
    }
    ;
    /**
     * Write multiple bytes.
     *
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    async writeBytes(values, unsigned) {
        for (let i = 0; i < values.length; i++) {
            await wbyte(this, values[i], unsigned);
        }
    }
    ;
    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int
     */
    async writeUByte(value) {
        return await wbyte(this, value, true);
    }
    ;
    /**
     * Read unsigned byte.
     *
     * @returns {Promise<number>}
     */
    async readUByte() {
        return await this.readByte(true);
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
     * @returns {Promise<number>}
     */
    async readInt16(unsigned, endian) {
        return await rint16(this, unsigned, endian);
    }
    ;
    /**
     * Write int16.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeInt16(value, unsigned, endian) {
        return await wint16(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt16(value, endian) {
        return await wint16(this, value, true, endian);
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async writeUInt16BE(value) {
        return await this.writeInt16(value, true, "big");
    }
    ;
    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int
     */
    async writeUInt16LE(value) {
        return await this.writeInt16(value, true, "little");
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
     * Read unsigned short.
     *
     * @param {endian} endian - ``big`` or ``little``
     *
     * @returns {Promise<number>}
     */
    async readUInt16(endian) {
        return await this.readInt16(true, endian);
    }
    ;
    /**
     * Read unsigned short in little endian.
     *
     * @returns {number}
     */
    async readUInt16LE() {
        return await this.readInt16(true, "little");
    }
    ;
    /**
     * Read signed short in little endian.
     *
     * @returns {number}
     */
    async readInt16LE() {
        return await this.readInt16(false, "little");
    }
    ;
    /**
     * Read unsigned short in big endian.
     *
     * @returns {Promise<number>}
     */
    async readUInt16BE() {
        return await this.readInt16(true, "big");
    }
    ;
    /**
    * Read signed short in big endian.
    *
    * @returns {Promise<number>}
    */
    async readInt16BE() {
        return await this.readInt16(false, "big");
    }
    ;
    ///////////////////////////////
    // #region HALF FLOAT
    ///////////////////////////////
    /**
     * Read half float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async readHalfFloat(endian) {
        return await rhalffloat(this, endian);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeHalfFloat(value, endian) {
        return await whalffloat(this, value, endian);
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    async writeHalfFloatBE(value) {
        return await this.writeHalfFloat(value, "big");
    }
    ;
    /**
     * Writes half float.
     *
     * @param {number} value - value as int
     */
    async writeHalfFloatLE(value) {
        return await this.writeHalfFloat(value, "little");
    }
    ;
    /**
    * Read half float.
    *
    * @returns {Promise<number>}
    */
    async readHalfFloatBE() {
        return await this.readHalfFloat("big");
    }
    ;
    /**
     * Read half float.
     *
     * @returns {Promise<number>}
     */
    async readHalfFloatLE() {
        return await this.readHalfFloat("little");
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
     * @returns {Promise<number>}
     */
    async readInt32(unsigned, endian) {
        return await rint32(this, unsigned, endian);
    }
    ;
    /**
     * Write int32.
     *
     * @param {number} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeInt32(value, unsigned, endian) {
        return await wint32(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt32(value, endian) {
        return await wint32(this, value, true, endian);
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async writeInt32LE(value) {
        return await this.writeInt32(value, false, "little");
    }
    ;
    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async writeUInt32LE(value) {
        return await this.writeInt32(value, true, "little");
    }
    ;
    /**
     * Write signed int32.
     *
     * @param {number} value - value as int
     */
    async writeInt32BE(value) {
        return await this.writeInt32(value, false, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async readInt32BE() {
        return await this.readInt32(false, "big");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async readUInt32BE() {
        return await this.readInt32(true, "big");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async readInt32LE() {
        return await this.readInt32(false, "little");
    }
    ;
    /**
     * Read signed 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async readUInt32LE() {
        return await this.readInt32(true, "little");
    }
    ;
    /**
     * Read unsigned 32 bit integer.
     *
     * @returns {Promise<number>}
     */
    async readUInt() {
        return await this.readInt32(true);
    }
    ;
    ///////////////////////////////
    // #region FLOAT32 READER
    ///////////////////////////////
    /**
     * Read float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async readFloat(endian) {
        return await rfloat(this, endian);
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeFloat(value, endian) {
        return await wfloat(this, value, endian);
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    async writeFloatLE(value) {
        return await this.writeFloat(value, "little");
    }
    ;
    /**
     * Write float.
     *
     * @param {number} value - value as int
     */
    async writeFloatBE(value) {
        return await this.writeFloat(value, "big");
    }
    ;
    /**
     * Read float.
     *
     * @returns {Promise<number>}
     */
    async readFloatBE() {
        return await this.readFloat("big");
    }
    ;
    /**
     * Read float.
     *
     * @returns {number}
     */
    async readFloatLE() {
        return await this.readFloat("little");
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
     * @returns {Promise<hasBigInt extends true ? bigint : number>}
     */
    async readInt64(unsigned, endian) {
        return await rint64(this, unsigned, endian);
    }
    ;
    /**
     * Write 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeInt64(value, unsigned, endian) {
        return await wint64(this, value, unsigned, endian);
    }
    ;
    /**
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt64(value, endian) {
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
     * Write unsigned 64 bit integer.
     *
     * @param {BigValue} value - value as int
     */
    async writeUInt64LE(value) {
        return await this.writeInt64(value, true, "little");
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
    async writeUInt64BE(value) {
        return await this.writeInt64(value, true, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {Promise<BigValue>}
     */
    async readUInt64() {
        return await this.readInt64(true);
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {Promise<BigValue>}
     */
    async readInt64BE() {
        return await this.readInt64(false, "big");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {Promise<BigValue>}
     */
    async readUInt64BE() {
        return await this.readInt64(true, "big");
    }
    ;
    /**
     * Read signed 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {Promise<BigValue>}
     */
    async readInt64LE() {
        return await this.readInt64(false, "little");
    }
    ;
    /**
     * Read unsigned 64 bit integer.
     *
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     *
     * @returns {Promise<BigValue>}
     */
    async readUInt64LE() {
        return await this.readInt64(true, "little");
    }
    ;
    ///////////////////////////////
    // #region FLOAT64 READER
    ///////////////////////////////
    /**
     * Read double float.
     *
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async readDoubleFloat(endian) {
        return await rdfloat(this, endian);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeDoubleFloat(value, endian) {
        return await wdfloat(this, value, endian);
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    async writeDoubleFloatBE(value) {
        return await this.writeDoubleFloat(value, "big");
    }
    ;
    /**
     * Writes double float.
     *
     * @param {number} value - value as int
     */
    async writeDoubleFloatLE(value) {
        return await this.writeDoubleFloat(value, "little");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    async readDoubleFloatBE() {
        return await this.readDoubleFloat("big");
    }
    ;
    /**
     * Read double float.
     *
     * @returns {Promise<number>}
     */
    async readDoubleFloatLE() {
        return await this.readDoubleFloat("little");
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
    * @returns {Promise<string>}
    */
    async readString(options) {
        return await rstring(this, options);
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
    async writeString(string, options) {
        return await wstring(this, string, options);
    }
    ;
}
_BiBaseAsync_data = new WeakMap();

/**
 * Async Binary reader, includes bitfields and strings.
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
 * @since 4.0
 */
class BiReaderAsync extends BiBaseAsync {
    /**
     * Async Binary reader, includes bitfields and strings.
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
    }
    ;
    /**
     * Creates and opens a new `BiReaderAsync`
     *
     * Includes bitfields and strings.
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
     * @returns {Promise<BiReaderAsync<DataType, hasBigInt>>}
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
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthReadSize"]?} options.lengthReadSize - for pascal strings. 1, 2 or 4 byte length read size
    * @param {stringOptions["stripNull"]?} options.stripNull - removes 0x00 characters
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    * @returns {string}
    */
    async string(options) {
        return await this.readString(options);
    }
    ;
    /**
    * Reads string using setting from .strSettings
    *
    * Default is ``utf-8``
    *
    * @returns {Promise<string>}
    */
    async str() {
        return await this.readString(this.strSettings);
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
        return await this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
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
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
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
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
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
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
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
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
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
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: endian });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little" });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "big" });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: endian });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little" });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "big" });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: endian });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little" });
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
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "big" });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: endian, stripNull: stripNull });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: "little", stripNull: stripNull });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: "big", stripNull: stripNull });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: endian, stripNull: stripNull });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "big", stripNull: stripNull });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: endian, stripNull: stripNull });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull });
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
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull });
    }
    ;
}

/**
 * Async Binary writer, includes bitfields and strings.
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
 * @since 4.0
 */
class BiWriterAsync extends BiBaseAsync {
    /**
     * Async Binary writer, includes bitfields and strings.
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
    }
    ;
    /**
     *
     * Creates and opens a new `BiWriterAsync`
     *
     * includes bitfields and strings.
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
     *
     * @returns {Promise<BiWriterAsync<DataType, hasBigInt>>}
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
    * @param {stringOptions["stringType"]?} options.stringType - utf-8, utf-16, pascal or wide-pascal
    * @param {stringOptions["terminateValue"]?} options.terminateValue - only with stringType: "utf"
    * @param {stringOptions["lengthWriteSize"]?} options.lengthWriteSize - for pascal strings. 1, 2 or 4 byte length write size
    * @param {stringOptions["encoding"]?} options.encoding - TextEncoder accepted types
    * @param {stringOptions["endian"]?} options.endian - for wide-pascal and utf-16
    */
    async string(string, options) {
        return await this.writeString(string, options);
    }
    ;
    /**
    * Writes string using setting from .strSettings
    *
    * Default is ``utf-8``
    *
    * @param {string} string - text string
    */
    async str(string) {
        await this.writeString(string, this.strSettings);
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
        return await this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
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
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
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
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
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
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
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
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
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
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
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
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian });
    }
    ;
    /**
    * Writes Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async pstring1le(string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little" });
    }
    ;
    /**
    * Writes Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async pstring1be(string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big" });
    }
    ;
    /**
    * Writes Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async pstring2(string, endian) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: endian });
    }
    ;
    /**
    * Writes Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async pstring2le(string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little" });
    }
    ;
    /**
    * Writes Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async pstring2be(string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big" });
    }
    ;
    /**
    * Writes Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async pstring4(string, endian) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian });
    }
    ;
    /**
    * Writes Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async pstring4be(string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big" });
    }
    ;
    /**
    * Writes Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async pstring4le(string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string.
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
    * Writes Wide-Pascal string in big endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async wpstringbe(string, lengthWriteSize) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big" });
    }
    ;
    /**
    * Writes Wide-Pascal string in little endian order.
    *
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async wpstringle(string, lengthWriteSize) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring1(string, endian) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian });
    }
    ;
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async wpstring1be(string) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big" });
    }
    ;
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async wpstring1le(string) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string 2 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring2(string, endian) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian });
    }
    ;
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async wpstring2le(string) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async wpstring2be(string) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big" });
    }
    ;
    /**
    * Writes Wide-Pascal string 4 byte length read.
    *
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring4(string, endian) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian });
    }
    ;
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order.
    *
    * @param {string} string - text string
    */
    async wpstring4le(string) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little" });
    }
    ;
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order.
    *
    * @param {string} string - text string
    */
    async wpstring4be(string) {
        return await this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big" });
    }
    ;
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
 * @since 4.0
 * @deprecated Use ``BiReaderLegacy`` instead.
 */
class BiReaderStream {
    constructor() {
        throw new Error("BiReaderStream is deprecated. Use BiReaderLegacy instead.");
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
 * @deprecated Use ``BiWriterLegacy`` instead.
 */
class BiWriterStream {
    constructor() {
        throw new Error("BiWriterStream is deprecated. Use BiWriterLegacy instead.");
    }
}

export { BiBase, BiReader, BiReaderAsync, BiReaderLegacy, BiReaderStream, BiWriter, BiWriterAsync, BiWriterLegacy, BiWriterStream, bireader, biwriter, hexdump };
//# sourceMappingURL=index.esm.js.map
