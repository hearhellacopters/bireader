/**
 * @file BiReaderLegacy / WriterLegacy for working in sync chunked file reads. Node only.
 */

// #region Imports

import {
    BigValue,
    canInt8,
    canInt16,
    canFloat16,
    canInt32,
    canFloat32,
    canBigInt64,
    canFloat64,
    hasBigInt,
    isSafeInt64,
    endian,
    isBuffer,
    isBufferOrUint8Array,
    hexdumpOptions,
    _hexDump,
    _ADD,
    stringOptions,
    normalizeBitOffset
} from '../common.js';
import fs from 'fs';
import { constants } from "buffer";

/**
 * For file system in Node
 */
type FileDescriptor = number;

/**
 * file system read modes
 */
type fsMode = "w+" | "r";

function MAX_LENGTH() {
    return constants.MAX_LENGTH;
};

function hexDumpBase(ctx: BiBaseLegacy<true | false>, options: hexdumpOptions = {}): string {
    var length: any = options && options.length;

    var startByte: any = options && options.startByte;

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
};

function skip(ctx: BiBaseLegacy<true | false>, bytes: number, bits?: number): void {
    var new_size = (((bytes || 0) + ctx.offset) + Math.ceil((ctx.bitoffset + (bits || 0)) / 8));

    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0) + ctx.offset) * 8) + ctx.bitoffset + (bits || 0)) / 8);
    }

    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray(new_size - ctx.size);
            }
        } else {
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
};

function align(ctx: BiBaseLegacy<true | false>, n: number) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(n - a);
    }
};

function alignRev(ctx: BiBaseLegacy<true | false>, n: number) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(a * -1);
    }
};

function goto(ctx: BiBaseLegacy<true | false>, bytes: number, bits?: number): void {
    var new_size = (((bytes || 0)) + Math.ceil(((bits || 0)) / 8));

    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0)) * 8) + (bits || 0)) / 8);
    }

    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray(new_size - ctx.size);
            }
        } else {
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
};

function check_size(ctx: BiBaseLegacy<true | false>, write_bytes: number, write_bit?: number, offset?: number): number {
    const bits: number = (write_bit || 0) + ctx.bitoffset;

    var new_off = (offset || ctx.offset);

    var writesize = write_bytes || 0;

    if (bits != 0) {
        //add bits
        writesize += Math.ceil(bits / 8);
    }
    // if bigger extend
    const needed_size: number = new_off + writesize;

    if (needed_size > ctx.size) {
        const dif = needed_size - ctx.size;

        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray(dif);
            }
        } else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: ` + needed_size + " at " + ctx.offset + " of " + ctx.size);
        }
    }
    //start read location
    return new_off;
};

function extendarray(ctx: BiBaseLegacy<true | false>, to_padd: number): void {
    ctx.open();

    if (fs == undefined) {
        throw new Error("Can't use BitFile without Node.");
    }

    if (ctx.fd === null) {
        throw new Error('File is not open yet.');
    }

    if (ctx.strict) {
        throw new Error('File position is outside of file size while in strict mode.');
    }

    if (ctx.growthIncrement != 0) {
        if (ctx.growthIncrement > to_padd) {
            to_padd = ctx.growthIncrement;
        }
    }

    try {
        fs.ftruncateSync(ctx.fd, ctx.size + to_padd);
    } catch (error) {
        throw new Error(error);
    }

    ctx.updateSize();
};

function remove(ctx: BiBaseLegacy<true | false>, startOffset?: number, endOffset?: number, consume?: boolean, remove?: boolean, fillValue?: number): Buffer {
    ctx.open();

    const new_start = Math.abs(startOffset || 0);

    const new_offset = (endOffset || ctx.offset);

    if (fs == undefined) {
        throw new Error("Can only use BiLegacy in Node.");
    }

    if (ctx.fd == null) {
        throw new Error("File is not open.");
    }

    if (new_offset > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray(new_offset - ctx.size);
            }
        } else {
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

                var bytesWritten: number;

                try {
                    bytesWritten = fs.readSync(ctx.fd, chunk, 0, toWrite, readStart);
                } catch (error) {
                    throw new Error(error);
                }

                amount -= bytesWritten;

                readStart += bytesWritten;
            }
        } else if (remove) {
            // dupe file for extract, remove data
            const removeData = ctx.filePath + +"_" + startOffset + "_" + removedLength + ".removed";

            console.warn(`File size for removal is larger than the max Buffer Node can handle, creating new file ${removeData}`);

            const CHUNK_SIZE = 64 * 1024;
            // Copy removed to new file
            var readOffset = new_start;

            var writeOffset = 0;

            var amount = removedLength;

            const chunk = new Uint8Array(CHUNK_SIZE);

            try {
                const tempFd = fs.openSync(removeData, 'w+');

                while (amount) {
                    const toRead = Math.min(CHUNK_SIZE, amount);

                    const bytesRead = fs.readSync(ctx.fd, chunk, 0, toRead, readOffset);

                    fs.writeSync(tempFd, chunk, 0, bytesRead, writeOffset);

                    amount -= bytesRead;

                    readOffset += bytesRead;

                    writeOffset += bytesRead;
                }

                fs.closeSync(tempFd);
            } catch (error) {
                throw new Error(error);
            }
            // reorder data and trim
            readOffset = new_start + removedLength;

            writeOffset = new_start;

            amount = removedLength;

            try {
                while (amount) {
                    const toRead = Math.min(CHUNK_SIZE, amount);

                    const bytesRead = fs.readSync(ctx.fd, chunk, 0, toRead, readOffset);

                    fs.writeSync(ctx.fd, chunk, 0, bytesRead, writeOffset);

                    amount -= bytesRead;

                    readOffset += bytesRead;

                    writeOffset += bytesRead;
                }

                fs.ftruncateSync(ctx.fd, ctx.size - removedLength);
            } catch (error) {
                throw new Error(error);
            }

            ctx.updateSize();
        } else {
            // no remove, can't extract
            const removeData = ctx.filePath + +"_" + startOffset + "_" + removedLength + ".removed";

            console.warn(`File size for extract is larger than the max Buffer Node can handle, creating new file ${removeData}`);

            const CHUNK_SIZE = 64 * 1024;

            const chunk = new Uint8Array(CHUNK_SIZE);
            // Copy removed to new file
            var readOffset = new_start;

            var writeOffset = 0;

            var amount = removedLength;

            try {
                const tempFd = fs.openSync(removeData, 'w+');

                while (amount) {
                    const toRead = Math.min(CHUNK_SIZE, amount);

                    const bytesRead = fs.readSync(ctx.fd, chunk, 0, toRead, readOffset);

                    fs.writeSync(tempFd, chunk, 0, bytesRead, writeOffset);

                    amount -= bytesRead;

                    readOffset += bytesRead;

                    writeOffset += bytesRead;
                }

                fs.closeSync(tempFd);
            } catch (error) {
                throw new Error(error);
            }
        }

        if (consume == true) {
            if (remove != true) {
                ctx.offset = new_offset;

                ctx.bitoffset = 0;
            } else {
                ctx.offset = new_start;

                ctx.bitoffset = 0;
            }
        }

        return Buffer.alloc(0);
    } else {
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

                    fs.readSync(ctx.fd, buffer, 0, actualRead, readPos);

                    fs.writeSync(ctx.fd, buffer, 0, actualRead, readPos - removedLength);

                    readPos += actualRead;

                    remaining -= actualRead;
                }

                fs.ftruncateSync(ctx.fd, ctx.size - removedLength);
            } catch (error) {
                throw new Error(error);
            }

            ctx.updateSize();

            if (consume == true) {
                if (remove != true) {
                    ctx.offset = new_offset;

                    ctx.bitoffset = 0;
                } else {
                    ctx.offset = new_start;

                    ctx.bitoffset = 0;
                }
            }

            return removedBuffer;
        } else {
            if (fillValue != undefined) {
                const removedBuffer = new Uint8Array(removedLength);

                removedBuffer.fill(fillValue & 0xff);
                try {
                    fs.writeSync(ctx.fd, removedBuffer, 0, removedBuffer.length, new_start);
                } catch (error) {
                    throw new Error(error);
                }

                if (consume == true) {
                    ctx.offset = new_offset;

                    ctx.bitoffset = 0;
                }

                ctx.data = Buffer.from(removedBuffer);

                ctx.updateView();

                return ctx.data;
            } else {
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
};

function addData(ctx: BiBaseLegacy<true | false>, data: Buffer | Uint8Array, consume?: boolean, offset?: number, replace?: boolean): void {
    if (ctx.strict == true) {
        ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";

        throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Can not insert data in strict mode. Use unrestrict() to enable.`);
    }

    ctx.open();

    if (fs == undefined) {
        throw new Error("Can only use BiLegacy in Node.");
    }

    if (ctx.fd == null) {
        throw new Error("File is not open.");
    }

    offset = (offset || ctx.offset);

    var newSize: number = offset + data.length;

    const originalSize = ctx.size;

    const insertLength = data.length;

    if (data.length === 0) {
        return;
    }

    if (newSize > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray(newSize - ctx.size);
            }
        } else {
            ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";

            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + newSize + " of " + ctx.size);
        }
    }

    if (!isBufferOrUint8Array(data)) {
        throw new Error('Data must be a Uint8Array or Buffer');
    }

    if (isBuffer(data)) {
        data = new Uint8Array(data);
    }

    if (replace) {
        // overwrite
        try {
            fs.writeSync(ctx.fd, data, 0, data.length, offset);
        } catch (error) {
            throw new Error(error);
        }

        ctx.updateSize();
    } else {
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

                fs.readSync(ctx.fd, buffer, 0, actualRead, readPos);

                fs.writeSync(ctx.fd, buffer, 0, actualRead, writePos);

                remaining -= actualRead;
            }
            // Write the insert data at offset
            fs.writeSync(ctx.fd, data, 0, insertLength, offset);
        } catch (error) {
            throw new Error(error);
        }

        ctx.size = newSize;
    }

    if (consume == true) {
        ctx.offset = newSize;

        ctx.bitoffset = 0;
    }

    return;
};

function AND(ctx: BiBaseLegacy<true | false>, and_key: any, start?: number, end?: number, consume?: boolean): void {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
    } else {
        if (typeof and_key == "string") {
            and_key = Uint8Array.from(Array.from(and_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (isBufferOrUint8Array(and_key)) {
            var keyIndex = -1;

            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);

                if (input.length == 0) {
                    break;
                }
                for (let i = 0; i < input.length; i++) {
                    if (keyIndex != and_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    } else {
                        keyIndex = 0;
                    }

                    input[i] = input[i] & and_key[keyIndex];
                }

                ctx.commit(true);

                new_start += input.length;
            }
        } else {
            throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    if (!consume) {
        ctx.offset = previousStart;
    }

    return;
};

function OR(ctx: BiBaseLegacy<true | false>, or_key: any, start?: number, end?: number, consume?: boolean): void {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
    } else {
        if (typeof or_key == "string") {
            or_key = Uint8Array.from(Array.from(or_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (isBufferOrUint8Array(or_key)) {
            var number = -1;

            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);

                if (input.length == 0) {
                    break;
                }

                for (let i = 0; i < input.length; i++) {
                    if (number != or_key.length - 1) {
                        number = number + 1;
                    } else {
                        number = 0;
                    }

                    input[i] = input[i] | or_key[number];
                }

                ctx.commit(true);

                new_start += input.length;
            }
        } else {
            throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    if (!consume) {
        ctx.offset = previousStart;
    }

    return;
};

function XOR(ctx: BiBaseLegacy<true | false>, xor_key: any, start?: number, end?: number, consume?: boolean): void {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
    } else {
        if (typeof xor_key == "string") {
            xor_key = Uint8Array.from(Array.from(xor_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (isBufferOrUint8Array(xor_key)) {
            var keyIndex = -1;

            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);

                if (input.length == 0) {
                    break;
                }

                for (let i = 0; i < input.length; i++) {
                    if (keyIndex != xor_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    } else {
                        keyIndex = 0;
                    }

                    input[i] = input[i] ^ xor_key[keyIndex];
                }

                ctx.commit(true);

                new_start += input.length;
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    if (!consume) {
        ctx.offset = previousStart;
    }

    return;
};

function NOT(ctx: BiBaseLegacy<true | false>, start?: number, end?: number, consume?: boolean): void {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
};

function LSHIFT(ctx: BiBaseLegacy<true | false>, shift_key: any, start?: number, end?: number, consume?: boolean): void {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
    } else {
        if (typeof shift_key == "string") {
            shift_key = Uint8Array.from(Array.from(shift_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (isBufferOrUint8Array(shift_key)) {
            let keyIndex = -1;

            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);

                if (input.length == 0) {
                    break;
                }

                for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                    if (keyIndex != shift_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    } else {
                        keyIndex = 0;
                    }

                    input[i] = input[i] << shift_key[keyIndex];
                }

                ctx.commit(true);

                new_start += input.length;
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    if (!consume) {
        ctx.offset = previousStart;
    }

    return;
};

function RSHIFT(ctx: BiBaseLegacy<true | false>, shift_key: any, start?: number, end?: number, consume?: boolean): void {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
    } else {
        if (typeof shift_key == "string") {
            shift_key = Uint8Array.from(Array.from(shift_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (isBufferOrUint8Array(shift_key)) {
            var keyIndex = -1;

            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);

                if (input.length == 0) {
                    break;
                }

                for (let i = 0; i < input.length; i++) {
                    if (keyIndex != shift_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    } else {
                        keyIndex = 0;
                    }

                    input[i] = input[i] >> shift_key[keyIndex];
                }

                ctx.commit(true);

                new_start += input.length;
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    if (!consume) {
        ctx.offset = previousStart;
    }

    return;
};

function ADD(ctx: BiBaseLegacy<true | false>, add_key: any, start?: number, end?: number, consume?: boolean): void {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.growthIncrement != 0) {
                ctx.extendArray(ctx.growthIncrement);
            } else {
                ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
    } else {
        if (typeof add_key == "string") {
            add_key = Uint8Array.from(Array.from(add_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (isBufferOrUint8Array(add_key)) {
            var keyIndex = -1;

            while (new_start <= new_end) {
                const input = ctx.read(new_start, Math.min(chunkSize, new_end - new_start), false);

                if (input.length == 0) {
                    break;
                }

                for (let i = 0; i < input.length; i++) {
                    if (keyIndex != add_key.length - 1) {
                        keyIndex = keyIndex + 1;
                    } else {
                        keyIndex = 0;
                    }

                    input[i] = input[i] + add_key[keyIndex];
                }

                ctx.commit(true);

                new_start += input.length;
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    if (!consume) {
        ctx.offset = previousStart;
    }

    return;
};

function fString(ctx: BiBaseLegacy<true | false>, searchString: string): number {
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
};

function fNumber(ctx: BiBaseLegacy<true | false>, targetNumber: number, bits: number, unsigned: boolean, endian?: string): number {
    ctx.open();

    const chunkSize = 0x2000; // 8192 bytes

    let lastChunk = new Uint8Array(0);

    const totalBits = Math.floor(bits / 8);

    var start = ctx.offset;

    while (start < ctx.size) {
        const currentChunk = ctx.read(start, Math.min(chunkSize, ctx.size - start), false);

        if (currentChunk.length === 0) {// No more data to read
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
                } else {
                    let mask = ~(0xFF << read);

                    let readBits = (currentByte >> bitOffset) & mask;

                    value |= readBits << i;
                }

                off_in_bits += read;

                i += read;
            }

            if (unsigned === true || bits <= 7) {
                value = value >>> 0;
            } else {
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
};

function fHalfFloat(ctx: BiBaseLegacy<true | false>, targetNumber: number, endian?: string): number {
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
            } else {
                value = (data[z] << 8) | data[z + 1];
            }

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

            if (floatValue === targetNumber) {
                return position + z; // Found the number, return the index
            }
        }

        position += buffer.length;
    }

    return -1; // number not found
};

function fFloat(ctx: BiBaseLegacy<true | false>, targetNumber: number, endian?: string): number {
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
            } else {
                value = (data[z] << 24) | (data[z + 1] << 16) | (data[z + 2] << 8) | data[z + 3];
            }

            const isNegative = (value & 0x80000000) !== 0 ? 1 : 0;
            // Extract the exponent and fraction parts
            const exponent = (value >> 23) & 0xFF;

            const fraction = value & 0x7FFFFF;
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

            if (floatValue === targetNumber) {
                return position + z; // Found the number, return the index
            }
        }

        position += buffer.length;
    }

    return -1; // number not found
};

function fBigInt(ctx: BiBaseLegacy<true | false>, targetNumber: BigValue, unsigned: boolean, endian?: string): number {
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
            } else {
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
};

function fDoubleFloat(ctx: BiBaseLegacy<true | false>, targetNumber: number, endian?: string): number {
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
            } else {
                for (let i = 0; i < size; i++) {
                    value = (value << BigInt(8)) | BigInt(data[z + i] & 0xFF);
                }
            }

            const sign = (value & BigInt("9223372036854775808")) >> BigInt(63);

            const exponent = Number((value & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;

            const fraction = Number(value & BigInt("4503599627370495")) / Math.pow(2, 52);

            let floatValue: number;

            if (exponent === -1023) {
                if (fraction === 0) {
                    floatValue = (sign === BigInt(0)) ? 0 : -0; // +/-0
                } else {
                    // Denormalized number
                    floatValue = (sign === BigInt(0) ? 1 : -1) * Math.pow(2, -1022) * fraction;
                }
            } else if (exponent === 1024) {
                if (fraction === 0) {
                    floatValue = (sign === BigInt(0)) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                } else {
                    floatValue = Number.NaN;
                }
            } else {
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
};

function wbit(ctx: BiBaseLegacy<true | false>, value: number, bits: number, unsigned?: boolean, endian?: string): void {
    ctx.open();

    if (value == undefined) {
        throw new Error('Must supply value.');
    }

    if (bits == undefined) {
        throw new Error("Enter number of bits to write")
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
    } else {
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
        if (ctx.growthIncrement != 0) {
            ctx.extendArray(ctx.growthIncrement);
        } else {
            ctx.extendArray(size_needed - ctx.size);
        }
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
            let mask = ~(~0 << written);

            let writeBits = (value >> (bits - i - written)) & mask;

            var destShift = 8 - bitOffset - written;

            let destMask = ~(mask << destShift);

            input[0] = (input[0] & destMask) | (writeBits << destShift);
        } else {
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
};

function rbit(ctx: BiBaseLegacy<true | false>, bits?: number, unsigned?: boolean, endian?: string): number {
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
        } else {
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
};

function wbyte(ctx: BiBaseLegacy<true | false>, value: number, unsigned?: boolean): void {
    ctx.open();

    check_size(ctx, 1, 0);

    if (unsigned == true) {
        if (value < 0 || value > 255) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";

            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + 0 + " max: " + 255 + " value: " + value);
        }
    } else {
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
        } else {
            view.setUint8(0, value);
        }
    } else {
        data[0] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
    }

    ctx.commit(false);

    ctx.offset += 1;

    ctx.bitoffset = 0;

    return;
};

function rbyte(ctx: BiBaseLegacy<true | false>, unsigned?: boolean): number {
    ctx.open();

    check_size(ctx, 1);

    const data = ctx.read(ctx.offset, 1, false);

    const view = new DataView(data.buffer, data.byteOffset);

    if (canInt8) {
        var read: number;

        if ((unsigned == undefined || unsigned == false)) {
            read = view.getInt8(0);
        } else {
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
    } else {
        return data[0] > 127 ? data[0] - 256 : data[0];
    }
};

function wint16(ctx: BiBaseLegacy<true | false>, value: number, unsigned?: boolean, endian?: string): void {
    ctx.open();

    check_size(ctx, 2, 0);

    if (unsigned == true) {
        if (value < 0 || value > 65535) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";

            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + 0 + " max: " + 65535 + " value: " + value);
        }
    } else {
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
        } else {
            view.setUint16(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    } else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            data[0] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;

            data[1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
        } else {
            data[0] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;

            data[1] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
        }
    }

    ctx.commit(false);

    ctx.offset += 2;

    ctx.bitoffset = 0;

    return;
};

function rint16(ctx: BiBaseLegacy<true | false>, unsigned?: boolean, endian?: string): number {
    ctx.open();

    check_size(ctx, 2);

    const data = ctx.read(ctx.offset, 2, false);

    const view = new DataView(data.buffer, data.byteOffset);

    var read: number;

    if (canInt16) {
        if (unsigned == undefined || unsigned == false) {
            read = view.getInt16(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        } else {
            read = view.getUint16(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }

        ctx.offset += 2;

        ctx.bitoffset = 0;

        return read;
    } else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            read = ((data[1] & 0xFFFF) << 8) | (data[0] & 0xFFFF);
        } else {
            read = ((data[0] & 0xFFFF) << 8) | (data[1] & 0xFFFF);
        }
    }

    ctx.offset += 2;

    ctx.bitoffset = 0;

    if (unsigned == undefined || unsigned == false) {
        return read & 0x8000 ? -(0x10000 - read) : read;
    } else {
        return read & 0xFFFF;
    }
};

function rhalffloat(ctx: BiBaseLegacy<true | false>, endian?: endian): number {
    if (canFloat16) {
        ctx.open();

        check_size(ctx, 2);

        const data = ctx.read(ctx.offset, 2, false);

        const view = new DataView(data.buffer, data.byteOffset);

        const float16Value = (view as any).getFloat16(0, endian != undefined ? endian == "little" : ctx.endian == "little");

        ctx.offset += 2;

        ctx.bitoffset = 0;

        return float16Value;
    }

    const uint16Value = ctx.readInt16(true, (endian != undefined ? endian : ctx.endian));

    const sign = (uint16Value & 0x8000) >> 15;

    const exponent = (uint16Value & 0x7C00) >> 10;

    const fraction = uint16Value & 0x03FF;

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

function whalffloat(ctx: BiBaseLegacy<true | false>, value: number, endian?: string): void {
    ctx.open();

    check_size(ctx, 2, 0);

    const maxValue = 65504;

    const minValue = 5.96e-08;

    if (value < minValue || value > maxValue) {
        ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";

        throw new Error('Value is out of range for the specified half float length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
    }

    if (canFloat16) {
        const data = ctx.read(ctx.offset, 2, false);

        const view = new DataView(data.buffer, data.byteOffset);

        (view as any).setFloat16(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");

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

    const data = ctx.read(ctx.offset, 2, false);
    // Write bytes based on endianness
    if ((endian == undefined ? ctx.endian : endian) == "little") {
        data[0] = halfFloatBits & 0xFF;

        data[1] = (halfFloatBits >> 8) & 0xFF;
    } else {
        data[0] = (halfFloatBits >> 8) & 0xFF;

        data[1] = halfFloatBits & 0xFF;
    }

    ctx.commit(false);

    ctx.offset += 2;

    ctx.bitoffset = 0;
};

function wint32(ctx: BiBaseLegacy<true | false>, value: number, unsigned?: boolean, endian?: string): void {
    ctx.open();

    check_size(ctx, 4, 0);

    if (unsigned == true) {
        if (value < 0 || value > 4294967295) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";

            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + 0 + " max: " + 4294967295 + " value: " + value);
        }
    } else {
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
        } else {
            view.setUint32(0, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    } else {
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            data[0] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;

            data[1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;

            data[2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;

            data[3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        } else {
            data[0] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;

            data[1] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;

            data[2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;

            data[3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        }
    }

    ctx.commit(false);

    ctx.offset += 4;

    ctx.bitoffset = 0;
};

function rint32(ctx: BiBaseLegacy<true | false>, unsigned?: boolean, endian?: string): number {
    ctx.open();

    check_size(ctx, 4);

    const data = ctx.read(ctx.offset, 4, false);

    const view = new DataView(data.buffer, data.byteOffset);

    var read: number;

    if (canInt32) {
        if ((unsigned == undefined || unsigned == false)) {
            read = view.getInt32(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        } else {
            read = view.getUint32(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }

        ctx.offset += 4;

        ctx.bitoffset = 0;

        return read;
    }

    if ((endian != undefined ? endian : ctx.endian) == "little") {
        read = (((data[3] & 0xFF) << 24) | ((data[2] & 0xFF) << 16) | ((data[1] & 0xFF) << 8) | (data[0] & 0xFF));
    } else {
        read = ((data[0] & 0xFF) << 24) | ((data[1] & 0xFF) << 16) | ((data[2] & 0xFF) << 8) | (data[3] & 0xFF);
    }

    ctx.offset += 4;

    ctx.bitoffset = 0;

    if (unsigned == undefined || unsigned == false) {
        return read;
    } else {
        return read >>> 0;
    }
};

function rfloat(ctx: BiBaseLegacy<true | false>, endian?: endian): number {
    if (canFloat32) {
        ctx.open();

        check_size(ctx, 4);

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

function wfloat(ctx: BiBaseLegacy<true | false>, value: number, endian?: string): void {
    ctx.open();

    check_size(ctx, 4, 0);

    const MIN_POSITIVE_FLOAT32 = Number.MIN_VALUE;

    const MAX_POSITIVE_FLOAT32 = 3.4028235e+38;

    const MIN_NEGATIVE_FLOAT32 = -3.4028235e+38;

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
    } else {
        const arrayFloat = new Float32Array(1);

        arrayFloat[0] = value;

        if (endian != undefined ? endian == "little" : ctx.endian == "little") {
            data[0] = arrayFloat.buffer[0];

            data[1] = arrayFloat.buffer[1];

            data[2] = arrayFloat.buffer[2];

            data[3] = arrayFloat.buffer[3];
        } else {
            data[0] = arrayFloat.buffer[3];

            data[1] = arrayFloat.buffer[2];

            data[2] = arrayFloat.buffer[1];

            data[3] = arrayFloat.buffer[0];
        }
    }

    ctx.commit(false);

    ctx.offset += 4;

    ctx.bitoffset = 0;
};

function rint64<hasBigInt extends boolean>(ctx: BiBaseLegacy<hasBigInt>, unsigned?: boolean, endian?: string): hasBigInt extends true ? bigint : number {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }

    ctx.open();

    check_size(ctx, 8);

    const data = ctx.read(ctx.offset, 8, false);

    const view = new DataView(data.buffer, data.byteOffset);

    var value: bigint = BigInt(0);

    if (canBigInt64) {
        if (unsigned == undefined || unsigned == false) {
            value = view.getBigInt64(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        } else {
            value = view.getBigUint64(0, endian != undefined ? endian == "little" : ctx.endian == "little");
        }

        ctx.offset += 8;
    } else {
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
        } else {
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
        return value as hasBigInt extends true ? bigint : number;
    } else {
        if (isSafeInt64(value)) {
            return Number(value) as hasBigInt extends true ? bigint : number;
        } else {
            throw new Error("Value is outside of number range and enforceBigInt is set to false. " + value);
        }
    }
};

function wint64(ctx: BiBaseLegacy<true | false>, value: BigValue, unsigned?: boolean, endian?: string): void {
    if (!hasBigInt) {
        throw new Error("System doesn't support BigInt values.");
    }

    ctx.open();

    check_size(ctx, 8, 0);

    if (unsigned == true) {
        if (value < 0 || value > Math.pow(2, 64) - 1) {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";

            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + 0 + " max: " + (Math.pow(2, 64) - 1) + " value: " + value);
        }
    } else {
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
        } else {
            view.setBigUint64(0, BigInt(value), endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    } else {
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
                } else {
                    data[i * 4 + 0] = int32Array[i] & 0xFF;

                    data[i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;

                    data[i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;

                    data[i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            } else {
                if (unsigned == undefined || unsigned == false) {
                    data[(1 - i) * 4 + 3] = int32Array[i];

                    data[(1 - i) * 4 + 2] = (int32Array[i] >> 8);

                    data[(1 - i) * 4 + 1] = (int32Array[i] >> 16);

                    data[(1 - i) * 4 + 0] = (int32Array[i] >> 24);
                } else {
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
};

function wdfloat(ctx: BiBaseLegacy<true | false>, value: number, endian?: string): void {
    ctx.open();

    check_size(ctx, 8, 0);

    const MIN_POSITIVE_FLOAT64 = 2.2250738585072014e-308;

    const MAX_POSITIVE_FLOAT64 = Number.MAX_VALUE;

    const MIN_NEGATIVE_FLOAT64 = -Number.MAX_VALUE;

    const MAX_NEGATIVE_FLOAT64 = -2.2250738585072014e-308;

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
    } else {
        const intArray = new Int32Array(2);

        const floatArray = new Float64Array(intArray.buffer);

        floatArray[0] = value;

        const bytes = new Uint8Array(intArray.buffer);

        for (let i = 0; i < 8; i++) {
            if ((endian == undefined ? ctx.endian : endian) == "little") {
                data[i] = bytes[i];
            } else {
                data[(7 - i)] = bytes[i];
            }
        }
    }

    ctx.commit(false);

    ctx.offset += 8;

    ctx.bitoffset = 0;
};

function rdfloat(ctx: BiBaseLegacy<true | false>, endian?: endian): number {
    if (canFloat64) {
        ctx.open();

        check_size(ctx, 8);

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

function rstring(ctx: BiBaseLegacy<true | false>, options?: stringOptions): string {
    ctx.open();

    var length: any = options && options.length;

    var stringType: any = options && options.stringType || 'utf-8';

    var terminateValue: any = options && options.terminateValue;

    var lengthReadSize: any = options && options.lengthReadSize || 1;

    var stripNull: any = options && options.stripNull || true;

    var encoding: any = options && options.encoding || 'utf-8';

    var endian: any = options && options.endian || ctx.endian;

    var terminate = terminateValue;

    if (length != undefined) {
        check_size(ctx, length);
    }

    if (typeof terminateValue == "number") {
        terminate = terminateValue & 0xFF;
    } else {
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
        const encodedBytes: Array<number> = [];

        if (length == undefined && terminateValue == undefined) {
            terminate = 0;
        }

        var read_length = 0;

        if (length != undefined) {
            read_length = length;
        } else {
            read_length = ctx.size - ctx.offset;
        }

        for (let i = 0; i < read_length; i++) {
            if (stringType === 'utf-8') {
                var read = ctx.readUByte();

                if (read == terminate) {
                    break;
                } else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read);
                    }
                }
            } else {
                const read = ctx.readInt16(true, endian);

                const read1 = read & 0xFF;

                const read2 = (read >> 8) & 0xFF;

                if (read == terminate) {
                    break;
                } else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read1);
                        encodedBytes.push(read2);
                    }
                }
            }
        }

        return new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
    } else if (stringType == 'pascal' || stringType == 'wide-pascal') {
        if (encoding == undefined) {
            if (stringType == 'pascal') {
                encoding = 'utf-8';
            }
            if (stringType == 'wide-pascal') {
                encoding = 'utf-16';
            }
        }

        var maxBytes: number;

        if (lengthReadSize == 1) {
            maxBytes = ctx.readUByte();
        } else if (lengthReadSize == 2) {
            maxBytes = ctx.readInt16(true, endian);
        } else if (lengthReadSize == 4) {
            maxBytes = ctx.readInt32(true, endian);
        } else {
            ctx.errorDump ? "[Error], hexdump:\n" + ctx.hexdump() : "";

            throw new Error("Invalid length read size: " + lengthReadSize);
        }
        // Read the string as Pascal or Delphi encoded
        const encodedBytes: Array<number> = [];

        for (let i = 0; i < maxBytes; i++) {
            if (stringType == 'wide-pascal') {
                const read = ctx.readInt16(true, endian);

                i++;

                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read);
                }
            } else {
                const read = ctx.readUByte();

                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read);
                }
            }
        }

        var str_return: string;

        if (stringType == 'wide-pascal') {
            const strBuffer = new Uint16Array(encodedBytes);

            str_return = new TextDecoder().decode(strBuffer.buffer);
        } else {
            const strBuffer = new Uint8Array(encodedBytes);

            str_return = new TextDecoder(encoding).decode(strBuffer);
        }

        return str_return;
    } else {
        throw new Error('Unsupported string type: ' + stringType);
    }
};

function wstring(ctx: BiBaseLegacy<true | false>, string: string, options?: stringOptions): void {
    ctx.open();

    var length: any = options && options.length;

    var stringType: any = options && options.stringType || 'utf-8';

    var terminateValue: any = options && options.terminateValue;

    var lengthWriteSize: any = options && options.lengthWriteSize || 1;

    var encoding: any = options && options.encoding || 'utf-8';

    var endian: any = options && options.endian || ctx.endian;

    if (stringType === 'utf-8' || stringType === 'utf-16') {
        // Encode the string in the specified encoding
        if (encoding == undefined) {
            if (stringType == 'utf-8') {
                encoding = 'utf-8';
            }
            if (stringType == 'utf-16') {
                encoding = 'utf-16';
            }
        }

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

        const data = ctx.read(ctx.offset, totalLength, false);
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < encodedString.length; i++) {
            if (stringType === 'utf-16') {
                const charCode = encodedString[i];

                if (endian == "little") {
                    data[i * 2] = charCode & 0xFF;

                    data[i * 2 + 1] = (charCode >> 8) & 0xFF;
                } else {
                    data[i * 2 + 1] = charCode & 0xFF;

                    data[i * 2] = (charCode >> 8) & 0xFF;
                }
            } else {
                data[i] = encodedString[i];
            }
        }

        if (terminateValue != undefined) {
            if (stringType === 'utf-16') {
                data[totalLength - 1] = terminateValue & 0xFF;

                data[totalLength] = (terminateValue >> 8) & 0xFF;
            } else {
                data[totalLength] = terminateValue;
            }
        }

        ctx.commit(false);

        ctx.offset += totalLength;

        ctx.bitoffset = 0;
    } else if (stringType == 'pascal' || stringType == 'wide-pascal') {
        if (encoding == undefined) {
            if (stringType == 'pascal') {
                encoding = 'utf-8';
            }
            if (stringType == 'wide-pascal') {
                encoding = 'utf-16';
            }
        }

        const encoder = new TextEncoder();
        // Calculate the length of the string based on the specified max length
        var maxLength: number;
        // Encode the string in the specified encoding
        if (lengthWriteSize == 1) {
            maxLength = 255;
        } else if (lengthWriteSize == 2) {
            maxLength = 65535;
        } else if (lengthWriteSize == 4) {
            maxLength = 4294967295;
        } else {
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
        } else if (lengthWriteSize == 2) {
            ctx.writeUInt16(totalLength, endian);
        } else if (lengthWriteSize == 4) {
            ctx.writeUInt32(totalLength, endian);
        }

        check_size(ctx, totalLength, 0);

        const data = ctx.read(ctx.offset, totalLength, false);
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < totalLength; i++) {
            if (stringType == 'wide-pascal') {
                if (endian == "little") {
                    data[i] = encodedString[i];

                    data[i + 1] = encodedString[i + 1];
                } else {
                    data[i + 1] = encodedString[i];

                    data[i] = encodedString[i + 1];
                }

                i++;
            } else {
                data[i] = encodedString[i];
            }
        }

        ctx.commit(false);

        ctx.offset += totalLength;

        ctx.bitoffset = 0;
    } else {
        throw new Error('Unsupported string type: ' + stringType);
    }
};

/**
 * Base class for BiReaderLegacy and BiWriterLegacy
 */
export class BiBaseLegacy<hasBigInt extends boolean> {
    /**
     * Endianness of default read. 
     * 
     * @type {endian}
     */
    public endian: endian = "little";
    /**
     * Current read byte location.
     */
    public offset: number = 0;
    /**
     * Current read byte's bit location.
     */
    public bitoffset: number = 0;
    /**
     * Size in bytes of the current file.
     */
    public size: number = 0;
    /**
     * Size in bits of the current file.
     */
    public sizeB: number = 0;
    /**
     * Allows the file to extend reading or writing outside of current size
     */
    public strict: boolean = false;
    /**
     * Console log a hexdump on error.
     */
    public errorDump: boolean = false;
    /**
     * Current buffer chunk.
     * 
     * @type {Buffer|null}
     */
    #data: Buffer | null = null;
    /**
     * Get the current buffer data.
     * 
     * @type {Buffer}
     */
    get data(): Buffer {
        return this.#data;
    };
    /**
     * Set the current buffer data.
     * 
     * @param {Buffer} data
     */
    set data(data: Buffer) {
        if (Buffer.isBuffer(data)) {
            this.#data = data;

            this.updateView();
        }
    };
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     * 
     * Otherwise it extends just the amount of the next written value.
     * 
     * This can greatly speed up data writes when large files are being written.
     * 
     * NOTE: Using ``BiWriterLegacy.get`` or ``BiWriterLegacy.return`` will now remove all data after the current write position. Use ``BiWriterLegacy.data`` to get the full buffer instead.
     */
    public growthIncrement: number = 0;

    public fd: FileDescriptor | null = null;

    public filePath: string | null = null;

    public fsMode: fsMode = "r";
    /**
     * The settings that used when using the .str getter / setter
     */
    private strDefaults: stringOptions = { stringType: "utf-8", terminateValue: 0x0 };

    public maxFileSize: number | null = null;

    public enforceBigInt: hasBigInt = null;

    public view: DataView | null = null;

    public mode: 'memory' | 'file' = 'file';

    constructor(filePath?: string, readwrite?: boolean) {
        if (typeof Buffer === 'undefined' || typeof fs == "undefined") {
            throw new Error("Need node to read or write files.");
        }

        this.filePath = filePath;

        this.mode = "file";

        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH();
        }

        if (readwrite) {
            this.fsMode = "w+";
        }
    };

    /**
     * Settings for when using .str
     * 
     * @param {stringOptions} settings options to use with .str
     */
    set strSettings(settings: stringOptions) {
        this.strDefaults.encoding = settings.encoding;

        this.strDefaults.endian = settings.endian;

        this.strDefaults.length = settings.length;

        this.strDefaults.lengthReadSize = settings.lengthReadSize;

        this.strDefaults.lengthWriteSize = settings.lengthWriteSize;

        this.strDefaults.stringType = settings.stringType;

        this.strDefaults.stripNull = settings.stripNull;

        this.strDefaults.terminateValue = settings.terminateValue;
    };

    /**
     * Enabling write mode in reader.
     * 
     * @param {boolean} writeMode - Enabling write mode in reader.
     */
    writeMode(writeMode: boolean) {
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
    };

    /**
     * Opens the file. Must be run before reading or writing.
     * 
     * @returns {number} file size
     */
    open(): number {
        if (this.fd != null) {
            return this.size;
        }

        if (typeof Buffer === "undefined" || typeof fs === "undefined") {
            throw new Error("Can't use files without Node.");
        }

        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH();
        }

        try {
            this.fd = fs.openSync(this.filePath, this.fsMode);
        } catch (error) {
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
                    if (this.growthIncrement != 0) {
                        this.extendArray(this.growthIncrement);
                    } else {
                        this.extendArray(this.offset - this.size);
                    }
                } else {
                    throw new Error(`Starting offset outside of size: ${this.offset} of ${this.size}`);
                }
            }
        }

        return this.size;
    };

    /**
     * Internal update size
     */
    updateSize(): void {
        if (fs == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }

        if (this.fd !== null) {
            try {
                const stat = fs.fstatSync(this.fd);

                this.size = stat.size;

                this.sizeB = this.size * 8;
            } catch (error) {
                throw new Error(error);
            }

            if (this.size > this.maxFileSize) {
                throw new Error("File too large to load.");
            }
        }
    };

    /**
     * Closes the file.
     * 
     * @returns {void}
     */
    close(): void {
        if (this.fd === null) {
            return; // Already closed / or not open
        }

        if (fs == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }

        try {
            fs.closeSync(this.fd);
        } catch (error) {
            throw new Error(error);
        }

        this.fd = null;

        return;
    };

    /**
     * Internal reader
     * 
     * @param start this.offset
     * @param length 
     * @param consume
     * @returns 
     */
    read(start: number, length: number, consume: boolean = false): Buffer {
        this.open();

        if (fs == undefined) {
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
                if (this.growthIncrement != 0) {
                    this.extendArray(this.growthIncrement);
                } else {
                    this.extendArray(length);
                }
            } else {
                throw new Error('File read is outside data size while in strict mode.');
            }
        }

        const data = Buffer.alloc(length);

        try {
            const bytesRead = fs.readSync(this.fd, data, 0, data.length, start);

            if (bytesRead != length) {
                throw new Error("Didn't read the amount needed for value: " + bytesRead + " of " + length);
            }
        } catch (error) {
            throw new Error(error);
        }

        this.data = data;

        if (consume) {
            this.offset = start + data.length;

            this.bitoffset = 0;
        }

        return this.data;
    };

    /**
     * Internal writer
     * 
     * @param start - likely this.offset
     * @param data 
     * @param consume
     * @returns {number}
     */
    write(start: number, data: Buffer, consume: boolean = false): number {
        this.open();

        if (fs == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }

        if (this.fd === null) {
            throw new Error('File is not open yet.');
        }

        if (data.length < 1) {
            return 0;
        }

        const end = start + data.length

        if (end > this.size) {
            if (this.strict == false) {
                if (this.growthIncrement != 0) {
                    this.extendArray(this.growthIncrement);
                } else {
                    this.extendArray(data.length);
                }
            } else {
                throw new Error('File write is outside of data size while in strict mode.');
            }
        }

        var bytesWritten: number;

        try {
            bytesWritten = fs.writeSync(this.fd, new Uint8Array(data), 0, data.length, start);
        } catch (error) {
            throw new Error(error);
        }

        this.updateSize();

        if (consume) {
            this.offset = start + bytesWritten;
        }

        return bytesWritten;
    };

    /**
     * internal write commit
     * 
     * @param consume 
     * @returns {number}
     */
    commit(consume: boolean = true): number {
        this.open();

        if (!isBuffer(this.data)) {
            const data = Buffer.from(this.data);

            return this.write(this.offset, data, consume);
        } else if (this.data === null) {
            throw new Error("No data to write.");
        }

        return this.write(this.offset, this.data, consume);
    };

    /**
     * syncs the data to file
     */
    flush(): void {
        if (this.fd) {
            this.commit();
        }
    };

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
    renameFile(newFilePath: string) {
        try {
            fs.closeSync(this.fd);

            this.fd = null;

            fs.renameSync(this.filePath, newFilePath);
        } catch (error) {
            throw new Error(error);
        }

        this.filePath = newFilePath;

        this.open();
    };

    /**
     * Deletes the working file.
     * 
     * Note: This is permanentand can't be undone. 
     * 
     * It doesn't send the file to the recycling bin for recovery.
     */
    deleteFile() {
        try {
            fs.closeSync(this.fd);

            this.fd = null;

            fs.unlinkSync(this.filePath);
        } catch (error) {
            throw new Error(error);
        }
    };

    /**
     * internal extend
     * 
     * @param length amount needed
     * @returns {void}
     */
    extendArray(length: number): void {
        return extendarray(this, length);
    };

    isBufferOrUint8Array(obj: Buffer | Uint8Array): boolean {
        return isBufferOrUint8Array(obj);
    };

    /**
     * Call this after everytime we set/replace `this.data`
     */
    updateView(): void {
        if (this.data) {
            this.view = new DataView(
                this.data.buffer,
                this.data.byteOffset ?? 0,
                this.data.byteLength
            );
        }
    };

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
    endianness(endian: endian): void {
        if (endian == undefined || typeof endian != "string") {
            throw new Error("Endian must be big or little");
        }

        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new Error("Endian must be big or little");
        }

        this.endian = endian;
    };

    /**
     * Sets endian to big.
     */
    bigEndian(): void {
        this.endianness("big");
    };

    /**
     * Sets endian to big.
     */
    big(): void {
        this.endianness("big");
    };

    /**
     * Sets endian to big.
     */
    be(): void {
        this.endianness("big");
    };

    /**
     * Sets endian to little.
     */
    littleEndian(): void {
        this.endianness("little");
    };

    /**
     * Sets endian to little.
     */
    little(): void {
        this.endianness("little");
    };

    /**
     * Sets endian to little.
     */
    le(): void {
        this.endianness("little");
    };

    ///////////////////////////////
    //            SIZE           //
    ///////////////////////////////

    /**
     * Size in bytes of the current buffer.
     * 
     * @returns {number} size
     */
    get length(): number {
        return this.size;
    };

    /**
     * Size in bytes of the current buffer.
     * 
     * @returns {number} size
     */
    get len(): number {
        return this.size;
    };

    /**
     * Size in bytes of the current buffer.
     * 
     * @returns {number} size
     */
    get FileSize(): number {
        return this.size;
    };

    /**
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get lengthB(): number {
        return this.sizeB;
    };

    /**
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get FileSizeB(): number {
        return this.sizeB;
    };

    /**
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get lenb(): number {
        return this.sizeB;
    };

    ///////////////////////////////
    //         POSITION          //
    ///////////////////////////////

    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get tell(): number {
        return this.offset;
    };

    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get FTell(): number {
        return this.offset;
    };

    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get getOffset(): number {
        return this.offset;
    };

    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get saveOffset(): number {
        return this.offset;
    };

    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get off(): number {
        return this.offset;
    };

    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get getOffsetBit(): number {
        return this.bitoffset;
    };

    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get tellB(): number {
        return this.bitoffset;
    };

    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get FTellB(): number {
        return this.bitoffset;
    };

    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get offb(): number {
        return this.bitoffset;
    };

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current absolute bit position
     */
    get getOffsetAbsBit(): number {
        return (this.offset * 8) + this.bitoffset;
    };

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current bit position
     */
    get saveOffsetAbsBit(): number {
        return (this.offset * 8) + this.bitoffset;
    };

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current absolute bit position
     */
    get tellAbsB(): number {
        return (this.offset * 8) + this.bitoffset;
    };

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current absolute bit position
     */
    get saveOffsetBit(): number {
        return (this.offset * 8) + this.bitoffset;
    };

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @returns {number} current absolute bit position
     */
    get offab(): number {
        return (this.offset * 8) + this.bitoffset;
    };

    /**
     * Size in bytes of current read position to the end
     * 
     * @returns {number} size
     */
    get remain(): number {
        return this.size - this.offset;
    };

    /**
     * Size in bytes of current read position to the end
     * 
     * @returns {number} size
     */
    get FEoF(): number {
        return this.size - this.offset;
    };

    /**
     * Size in bits of current read position to the end
     * 
     * @returns {number} size
     */
    get remainB(): number {
        return (this.size * 8) - this.saveOffsetAbsBit;
    };

    /**
     * Size in bits of current read position to the end
     * 
     * @returns {number} size
     */
    get FEoFB(): number {
        return (this.size * 8) - this.saveOffsetAbsBit;
    };

    /**
     * Row line of the file (16 bytes per row).
     * 
     * @returns {number} size
     */
    get getLine(): number {
        return Math.abs(Math.floor((this.offset - 1) / 16));
    };

    /**
     * Row line of the file (16 bytes per row).
     * 
     * @returns {number} size
     */
    get row(): number {
        return Math.abs(Math.floor((this.offset - 1) / 16));
    };

    ///////////////////////////////
    //        FINISHING          //
    ///////////////////////////////

    /**
     * Returns current data.
     * 
     * Note: Will remove all data after current position if ``growthIncrement`` was set.
     * 
     * Use ``.data`` instead if you want the full buffer data.
     * 
     * @returns {Buffer} ``Buffer``
     */
    get(): Buffer {
        if (this.growthIncrement != 0) {
            this.trim();
        }

        return this.data || Buffer.alloc(0);
    };

    /**
     * Returns current data.
     * 
     * Note: Will remove all data after current position if ``growthIncrement`` was set.
     * 
     * Use ``.data`` instead if you want the full buffer data.
     * 
     * @returns {Buffer} ``Buffer``
     */
    return(): Buffer {
        return this.get();
    };

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
    hexdump(options: hexdumpOptions = {}): void | string {
        return hexDumpBase(this, options);
    };

    /**
     * Turn hexdump on error off (default on).
     */
    errorDumpOff(): void {
        this.errorDump = false;
    };

    /**
     * Turn hexdump on error on (default on).
     */
    errorDumpOn(): void {
        this.errorDump = true;
    };

    ///////////////////////////////
    //       STRICTMODE          //
    ///////////////////////////////

    /**
     * Disallows extending data if position is outside of max size.
     */
    restrict(): void {
        this.strict = true;
    };

    /**
     * Allows extending data if position is outside of max size.
     */
    unrestrict(): void {
        this.strict = false;
    };

    /**
     * removes data.
     */
    end(): void {
        this.data = null;

        this.view = undefined;
    };

    /**
     * removes data.
     */
    done(): void {
        this.end();
    };

    /**
     * removes data.
     */
    finished(): void {
        this.end();
    };

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
    findString(string: string): number {
        return fString(this, string);
    };

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
    findByte(value: number, unsigned?: boolean, endian?: endian): number {
        return fNumber(this, value, 8, unsigned == undefined ? true : unsigned, endian);
    };

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
    findShort(value: number, unsigned?: boolean, endian?: endian): number {
        return fNumber(this, value, 16, unsigned == undefined ? true : unsigned, endian);
    };

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
    findInt(value: number, unsigned?: boolean, endian?: endian): number {
        return fNumber(this, value, 32, unsigned == undefined ? true : unsigned, endian);
    };

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
    findInt64(value: BigValue, unsigned?: boolean, endian?: endian): number {
        return fBigInt(this, value, unsigned == undefined ? true : unsigned, endian);
    };

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
    findHalfFloat(value: number, endian?: endian): number {
        return fHalfFloat(this, value, endian);
    };

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
    findFloat(value: number, endian?: endian): number {
        return fFloat(this, value, endian);
    };

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
    findDoubleFloat(value: number, endian?: endian): number {
        return fDoubleFloat(this, value, endian);
    };

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
    align(number: number): void {
        return align(this, number);
    };

    /**
     * Reverse aligns current byte position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} number - Byte to align
     */
    alignRev(number: number): void {
        return alignRev(this, number);
    };

    /**
     * Offset current byte or bit position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    skip(bytes: number, bits?: number): void {
        return skip(this, bytes, bits);
    };

    /**
    * Offset current byte or bit position.
    * 
    * Note: Will extend array if strict mode is off and outside of max size.
    * 
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    jump(bytes: number, bits?: number): void {
        this.skip(bytes, bits);
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    FSeek(byte: number, bit?: number): void {
        return goto(this, byte, bit)
    };

    /**
     * Offset current byte or bit position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    seek(bytes: number, bits?: number): void {
        return this.skip(bytes, bits)
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    goto(byte: number, bit?: number): void {
        return goto(this, byte, bit);
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    pointer(byte: number, bit?: number): void {
        return this.goto(byte, bit)
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    warp(byte: number, bit?: number): void {
        return this.goto(byte, bit)
    };

    /**
     * Set byte and bit position to start of data.
     */
    rewind(): void {
        this.offset = 0;
        this.bitoffset = 0;
    };

    /**
     * Set byte and bit position to start of data.
     */
    gotoStart(): void {
        return this.rewind();
    };

    /**
     * Set current byte and bit position to end of data.
     */
    last(): void {
        this.offset = this.size;
        this.bitoffset = 0;
    };

    /**
     * Set current byte and bit position to end of data.
     */
    gotoEnd(): void {
        this.last();
    };

    /**
     * Set byte and bit position to start of data.
     */
    EoF(): void {
        this.last();
    };

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
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Buffer {
        return remove(this, startOffset || 0, endOffset || this.offset, consume || false, true);
    };

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @returns {Buffer} Removed data as ``Buffer``
     */
    clip(): Buffer {
        return remove(this, this.offset, this.size, false, true);
    };

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @returns {Buffer} Removed data as ``Buffer``
     */
    trim(): Buffer {
        return remove(this, this.offset, this.size, false, true);
    };

    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer} Removed data as ``Buffer`` 
     */
    crop(length: number, consume?: boolean): Buffer {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    };

    /**
     * Deletes part of data from current position to supplied length, returns removed.
     * 
     * Note: Only works in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer} Removed data as ``Buffer``
     */
    drop(length: number, consume?: boolean): Buffer {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    };

    /**
     * Replaces data in data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    replace(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void {
        return addData(this, data, consume || false, offset || this.offset, true);
    };

    /**
     * Replaces data in data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    overwrite(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void {
        return addData(this, data, consume || false, offset || this.offset, true);
    };

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
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    };

    /**
     * Returns part of data from current byte position to end of data unless supplied.
     * 
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer} Selected data as ``Buffer``
     */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer} Selected data as ``Buffer``
     */
    extract(length: number, consume?: boolean): Buffer {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer} Selected data as ``Buffer``
     */
    slice(length: number, consume?: boolean): Buffer {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data or ``Buffer``
     */
    wrap(length: number, consume?: boolean): Buffer {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    };

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
    insert(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void {
        return addData(this, data, consume || false, offset || this.offset, false);
    };

    /**
     * Inserts data into data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    place(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void {
        return addData(this, data, consume || false, offset || this.offset, false);
    };

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data: Buffer | Uint8Array, consume?: boolean): void {
        return addData(this, data, consume || false, 0, false);
    };

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data: Buffer | Uint8Array, consume?: boolean): void {
        return addData(this, data, consume || false, 0, false);
    };

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data: Buffer | Uint8Array, consume?: boolean): void {
        return addData(this, data, consume || false, this.size, false);
    };

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data: Buffer | Uint8Array, consume?: boolean): void {
        return addData(this, data, consume || false, this.size, false);
    };

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
    xor(xorKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var XORKey: any = xorKey;

        if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        } else if (!(this.isBufferOrUint8Array(XORKey) || typeof xorKey == "number")) {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }

        return XOR(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * XOR data.
     * 
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xorThis(xorKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;

        var XORKey: any = xorKey;

        if (typeof xorKey == "number") {
            Length = length || 1;
        } else if (typeof xorKey == "string") {
            const encoder = new TextEncoder().encode(xorKey);

            XORKey = encoder;

            Length = length || encoder.length;
        } else if (this.isBufferOrUint8Array(XORKey)) {
            Length = length || xorKey.length;
        } else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }

        return XOR(this, XORKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * OR data
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    or(orKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var ORKey: any = orKey;

        if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        } else if (!(this.isBufferOrUint8Array(ORKey) || typeof orKey == "number")) {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }

        return OR(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * OR data.
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;

        var ORKey: any = orKey;

        if (typeof orKey == "number") {
            Length = length || 1;
        } else if (typeof orKey == "string") {
            const encoder = new TextEncoder().encode(orKey);

            ORKey = encoder;

            Length = length || encoder.length;
        } else if (this.isBufferOrUint8Array(ORKey)) {
            Length = length || orKey.length
        } else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }

        return OR(this, ORKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * AND data.
     * 
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    and(andKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var ANDKey: any = andKey;

        if (typeof ANDKey == "string") {
            ANDKey = new TextEncoder().encode(ANDKey);
        } else if (!(typeof ANDKey == "object" || typeof ANDKey == "number")) {
            throw new Error("AND must be a number, string, number array or Buffer");
        }

        return AND(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * AND data.
     * 
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;

        var ANDKey: any = andKey;

        if (typeof andKey == "number") {
            Length = length || 1;
        } else if (typeof andKey == "string") {
            const encoder = new TextEncoder().encode(andKey);

            ANDKey = encoder;

            Length = length || encoder.length;
        } else if (typeof andKey == "object") {
            Length = length || andKey.length;
        } else {
            throw new Error("AND must be a number, string, number array or Buffer");
        }

        return AND(this, ANDKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * Add value to data.
     * 
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    add(addKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var addedKey: any = addKey;

        if (typeof addedKey == "string") {
            addedKey = new TextEncoder().encode(addedKey);
        } else if (!(typeof addedKey == "object" || typeof addedKey == "number")) {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }

        return ADD(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * Add value to data.
     * 
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;

        var AddedKey: any = addKey;

        if (typeof AddedKey == "number") {
            Length = length || 1;
        } else if (typeof AddedKey == "string") {
            const encoder = new TextEncoder().encode(AddedKey);

            AddedKey = encoder;

            Length = length || encoder.length;
        } else if (typeof AddedKey == "object") {
            Length = length || AddedKey.length;
        } else {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }

        return ADD(this, AddedKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * Not data.
     * 
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    not(startOffset?: number, endOffset?: number, consume?: boolean): void {
        return NOT(this, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * Not data.
     * 
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length?: number, consume?: boolean): void {
        return NOT(this, this.offset, this.offset + (length || 1), consume || false);
    };

    /**
     * Left shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShift(shiftKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var lShiftKey: any = shiftKey;

        if (typeof lShiftKey == "string") {
            lShiftKey = new TextEncoder().encode(lShiftKey);
        } else if (!(typeof lShiftKey == "object" || typeof lShiftKey == "number")) {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }

        return LSHIFT(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * Left shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;

        var lShiftKey: any = shiftKey;

        if (typeof lShiftKey == "number") {
            Length = length || 1;
        } else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        } else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        } else {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }

        return LSHIFT(this, shiftKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * Right shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShift(shiftKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var rShiftKey: any = shiftKey;

        if (typeof rShiftKey == "string") {
            rShiftKey = new TextEncoder().encode(rShiftKey);
        } else if (!(typeof rShiftKey == "object" || typeof rShiftKey == "number")) {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }

        return RSHIFT(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * Right shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;

        var lShiftKey: any = shiftKey;

        if (typeof lShiftKey == "number") {
            Length = length || 1;
        } else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);

            lShiftKey = encoder;

            Length = length || encoder.length;
        } else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        } else {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }

        return RSHIFT(this, lShiftKey, this.offset, this.offset + Length, consume || false);
    };

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
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: endian): void {
        return wbit(this, value, bits, unsigned, endian);
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitBE(value: number, bits: number): void {
        return wbit(this, value, bits, true, "big");
    };

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
    writeBitBE(value: number, bits: number, unsigned?: boolean): void {
        return wbit(this, value, bits, unsigned, "big");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitLE(value: number, bits: number): void {
        return wbit(this, value, bits, true, "little");
    };

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
    writeBitLE(value: number, bits: number, unsigned?: boolean): void {
        return wbit(this, value, bits, unsigned, "little");
    };

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
    readBit(bits?: number, unsigned?: boolean, endian?: endian): number {
        return rbit(this, bits, unsigned, endian);
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitBE(bits: number): number {
        return this.readBit(bits, true, "big");
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitBE(bits: number, unsigned?: boolean): number {
        return this.readBit(bits, unsigned, "big");
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitLE(bits: number): number {
        return this.readBit(bits, true, "little");
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitLE(bits: number, unsigned?: boolean): number {
        return this.readBit(bits, unsigned, "little");
    };

    /**
     * Read byte.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number}
     */
    readByte(unsigned?: boolean): number {
        return rbyte(this, unsigned);
    };

    /**
     * Read multiple bytes.
     * 
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number[]}
     */
    readBytes(amount: number, unsigned?: boolean): number[] {
        return Array.from({ length: amount }, () => rbyte(this, unsigned));
    };

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeByte(value: number, unsigned?: boolean): void {
        return wbyte(this, value, unsigned);
    };

    /**
     * Write multiple bytes.
     * 
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeBytes(values: number[], unsigned?: boolean): void {
        for (let i = 0; i < values.length; i++) {
            wbyte(this, values[i], unsigned);
        }
    };

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    writeUByte(value: number): void {
        return wbyte(this, value, true);
    };

    /**
     * Read unsigned byte.
     * 
     * @returns {number}
     */
    readUByte(): number {
        return this.readByte(true);
    };

    /**
     * Read short.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt16(unsigned?: boolean, endian?: endian): number {
        return rint16(this, unsigned, endian);
    };

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt16(value: number, unsigned?: boolean, endian?: endian): void {
        return wint16(this, value, unsigned, endian);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value: number, endian?: endian): void {
        return wint16(this, value, true, endian);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    writeUInt16BE(value: number): void {
        return this.writeInt16(value, true, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    writeUInt16LE(value: number): void {
        return this.writeInt16(value, true, "little");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    writeInt16LE(value: number): void {
        return this.writeInt16(value, false, "little");
    };

    /**
     * Read unsigned short.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * 
     * @returns {number}
     */
    readUInt16(endian?: endian): number {
        return this.readInt16(true, endian);
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {number}
     */
    readUInt16LE(): number {
        return this.readInt16(true, "little");
    };

    /**
     * Read signed short in little endian.
     * 
     * @returns {number}
     */
    readInt16LE(): number {
        return this.readInt16(false, "little");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {number}
     */
    readUInt16BE(): number {
        return this.readInt16(true, "big");
    };

    /**
    * Read signed short in big endian.
    * 
    * @returns {number}
    */
    readInt16BE(): number {
        return this.readInt16(false, "big");
    };

    /**
     * Read half float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readHalfFloat(endian?: endian): number {
        return rhalffloat(this, endian);
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeHalfFloat(value: number, endian?: endian): void {
        return whalffloat(this, value, endian);
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    writeHalfFloatBE(value: number): void {
        return this.writeHalfFloat(value, "big");
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    writeHalfFloatLE(value: number): void {
        return this.writeHalfFloat(value, "little");
    };

    /**
    * Read half float.
    * 
    * @returns {number}
    */
    readHalfFloatBE(): number {
        return this.readHalfFloat("big");
    };

    /**
     * Read half float.
     * 
     * @returns {number}
     */
    readHalfFloatLE(): number {
        return this.readHalfFloat("little");
    };

    /**
     * Read 32 bit integer.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt32(unsigned?: boolean, endian?: endian): number {
        return rint32(this, unsigned, endian);
    };

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt32(value: number, unsigned?: boolean, endian?: endian): void {
        return wint32(this, value, unsigned, endian);
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value: number, endian?: endian): void {
        return wint32(this, value, true, endian);
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    writeInt32LE(value: number): void {
        return this.writeInt32(value, false, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    writeUInt32LE(value: number): void {
        return this.writeInt32(value, true, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    writeInt32BE(value: number): void {
        return this.writeInt32(value, false, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readInt32BE(): number {
        return this.readInt32(false, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    readUInt32BE(): number {
        return this.readInt32(true, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readInt32LE(): number {
        return this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readUInt32LE(): number {
        return this.readInt32(true, "little");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    readUInt(): number {
        return this.readInt32(true);
    };

    /**
     * Read float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat(endian?: endian): number {
        return rfloat(this, endian);
    };

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat(value: number, endian?: endian): void {
        return wfloat(this, value, endian);
    };

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     */
    writeFloatLE(value: number): void {
        return this.writeFloat(value, "little");
    };

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     */
    writeFloatBE(value: number): void {
        return this.writeFloat(value, "big");
    };

    /**
     * Read float.
     * 
     * @returns {number}
     */
    readFloatBE(): number {
        return this.readFloat("big");
    };

    /**
     * Read float.
     * 
     * @returns {number}
     */
    readFloatLE(): number {
        return this.readFloat("little");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {endian?} endian - ``big`` or ``little``
     */
    readInt64(unsigned?: boolean, endian?: endian): hasBigInt extends true ? bigint : number {
        return rint64(this, unsigned, endian);
    };

    /**
     * Write 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt64(value: BigValue, unsigned?: boolean, endian?: endian): void {
        return wint64(this, value, unsigned, endian);
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt64(value: BigValue, endian?: endian) {
        return this.writeInt64(value, true, endian);
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    writeInt64LE(value: BigValue): void {
        return this.writeInt64(value, false, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    writeUInt64LE(value: BigValue): void {
        return this.writeInt64(value, true, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    writeInt64BE(value: BigValue): void {
        return this.writeInt64(value, false, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    writeUInt64BE(value: BigValue): void {
        return this.writeInt64(value, true, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readUInt64(): hasBigInt extends true ? bigint : number {
        return this.readInt64(true);
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readInt64BE(): hasBigInt extends true ? bigint : number {
        return this.readInt64(false, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readUInt64BE(): hasBigInt extends true ? bigint : number {
        return this.readInt64(true, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readInt64LE(): hasBigInt extends true ? bigint : number {
        return this.readInt64(false, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    readUInt64LE(): hasBigInt extends true ? bigint : number {
        return this.readInt64(true, "little");
    };

    /**
     * Read double float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian?: endian): number {
        return rdfloat(this, endian);
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value: number, endian?: endian): void {
        return wdfloat(this, value, endian);
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    writeDoubleFloatBE(value: number): void {
        return this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    writeDoubleFloatLE(value: number): void {
        return this.writeDoubleFloat(value, "little");
    };

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    readDoubleFloatBE(): number {
        return this.readDoubleFloat("big");
    };

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    readDoubleFloatLE(): number {
        return this.readDoubleFloat("little");
    };

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
    readString(options?: stringOptions): string {
        return rstring(this, options);
    };

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
    writeString(string: string, options?: stringOptions): void {
        return wstring(this, string, options);
    };
};