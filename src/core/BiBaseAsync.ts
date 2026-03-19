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
    isBuffer,
    endian,
    arrayBufferCheck,
    hexdumpOptions,
    _hexDump,
    stringOptions,
    normalizeBitOffset
} from '../common.js';
import fs, { FileHandle } from "fs/promises";
import { constants } from "buffer";

var bufferConstants = constants;

/**
 * file system read modes
 */
type fsMode = "w+" | "r";

function MAX_LENGTH() {
    return bufferConstants.MAX_LENGTH;
};

async function hexDumpBase(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, options: hexdumpOptions = {}): Promise<string> {
    var length: any = options && options.length;

    var startByte: any = options && options.startByte;

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
};

// #region Movement

async function skip(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, bytes: number, bits?: number): Promise<void> {
    var new_size = (((bytes || 0) + ctx.offset) + Math.ceil((ctx.bitoffset + (bits || 0)) / 8));

    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0) + ctx.offset) * 8) + ctx.bitoffset + (bits || 0)) / 8);
    }

    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray(new_size - ctx.size);
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

function align(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, n: number) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(n - a);
    }
};

function alignRev(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, n: number) {
    const a = ctx.offset % n;
    if (a) {
        ctx.skip(a * -1);
    }
};

async function goto(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, bytes: number, bits?: number): Promise<void> {
    var new_size = (((bytes || 0)) + Math.ceil(((bits || 0)) / 8));

    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0)) * 8) + (bits || 0)) / 8);
    }

    if (new_size > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray(new_size - ctx.size);
            }
        } else {
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
};

// #region Manipulation

async function check_size(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, write_bytes: number, write_bit?: number, offset?: number): Promise<number> {
    const bits: number = (write_bit || 0) + ctx.bitoffset;

    var new_off = (offset || ctx.offset);

    var writesize = write_bytes || 0;

    if (bits != 0) {
        //add bits
        writesize += Math.ceil(bits / 8);
    }
    //if bigger extend
    const needed_size: number = new_off + writesize;

    if (needed_size > ctx.size) {
        const dif = needed_size - ctx.size;

        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray(dif);
            }
        } else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: ` + needed_size + " at " + ctx.offset + " of " + ctx.size);
        }
    }
    //start read location
    return new_off;
};

async function extendarray(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, to_padd: number): Promise<void> {
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
            await ctx.fh.truncate(ctx.size + to_padd)
        } catch (error) {
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
};

async function remove(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, startOffset?: number, endOffset?: number, consume?: boolean, remove?: boolean, fillValue?: number): Promise<Buffer | Uint8Array> {
    await ctx.open();

    const new_start = Math.abs(startOffset || 0);

    const new_offset = (endOffset || ctx.offset);

    if (new_offset > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray(new_offset - ctx.size);
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

                    var bytesWritten: number;

                    try {
                        await ctx.fh.read(chunk, 0, toWrite, readStart);
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
                    const tempFd = await fs.open(removeData, 'w+');

                    while (amount) {
                        const toRead = Math.min(CHUNK_SIZE, amount);

                        const { bytesRead } = await ctx.fh.read(chunk, 0, toRead, readOffset);

                        await tempFd.write(chunk, 0, bytesRead, writeOffset);

                        amount -= bytesRead;

                        readOffset += bytesRead;

                        writeOffset += bytesRead;
                    }

                    await tempFd.close();
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

                        const { bytesRead } = await ctx.fh.read(chunk, 0, toRead, readOffset);

                        await ctx.fh.write(chunk, 0, bytesRead, writeOffset);

                        amount -= bytesRead;

                        readOffset += bytesRead;

                        writeOffset += bytesRead;
                    }

                    await ctx.fh.truncate(ctx.size - removedLength)
                } catch (error) {
                    throw new Error(error);
                }

                await ctx.updateSize();
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
                    const tempFd = await fs.open(removeData, 'w+');

                    while (amount) {
                        const toRead = Math.min(CHUNK_SIZE, amount);

                        const { bytesRead } = await ctx.fh.read(chunk, 0, toRead, readOffset);

                        await tempFd.write(chunk, 0, bytesRead, writeOffset);

                        amount -= bytesRead;

                        readOffset += bytesRead;

                        writeOffset += bytesRead;
                    }

                    await tempFd.close();
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
                } catch (error) {
                    throw new Error(error);
                }

                await ctx.updateSize();

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
                        await ctx.fh.write(removedBuffer, 0, removedBuffer.length, new_start);
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
        } else {
            ctx.offset = new_start;

            ctx.bitoffset = 0;
        }
    }

    return data_removed;
};

async function addData<DataType extends Buffer | Uint8Array>(ctx: BiBaseAsync<DataType, true | false>, data: DataType, consume?: boolean, offset?: number, replace?: boolean): Promise<void> {
    if (ctx.strict == true) {
        ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

        throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Can not insert data in strict mode. Use unrestrict() to enable.`);
    }

    await ctx.open();

    if (ctx.mode == "file") {
        offset = (offset || ctx.offset);

        var newSize: number = offset + data.length;

        const originalSize = ctx.size;

        const insertLength = data.length;

        if (data.length === 0) {
            return;
        }

        if (newSize > ctx.size) {
            if (ctx.strict == false) {
                if (ctx.extendBufferSize != 0) {
                    await ctx.extendArray(ctx.extendBufferSize);
                } else {
                    await ctx.extendArray(newSize - ctx.size);
                }
            } else {
                ctx.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + ctx.hexdump() : "";

                throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset " + newSize + " of " + ctx.size);
            }
        }

        if (!arrayBufferCheck(data)) {
            throw new Error('Data must be a Uint8Array or Buffer');
        }

        if (Buffer.isBuffer(data)) {
            data = new Uint8Array(data) as DataType;
        }

        if (replace) {
            // overwrite
            try {
                await ctx.fh.write(data, 0, data.length, offset);
            } catch (error) {
                throw new Error(error);
            }

            await ctx.updateSize();
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

                    const { bytesRead } = await ctx.fh.read(buffer, 0, actualRead, readPos);

                    await ctx.fh.write(buffer, 0, bytesRead, writePos);

                    remaining -= actualRead;
                }
                // Write the insert data at offset
                await ctx.fh.write(data, 0, insertLength, offset);
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
    }

    if (isBuffer(data) && !isBuffer(ctx.data)) {
        data = Buffer.from(data) as DataType;
    }

    var needed_size: number = offset || ctx.offset;

    if (replace) {
        needed_size = (offset || ctx.offset) + data.length;

        const part1 = ctx.data.subarray(0, needed_size - data.length);

        const part2 = ctx.data.subarray(needed_size, ctx.size);

        ctx.data = Buffer.concat([part1, data, part2]) as DataType;

        ctx.size = ctx.data.length;

        ctx.sizeB = ctx.data.length * 8;
    } else {
        const part1 = ctx.data.subarray(0, needed_size);

        const part2 = ctx.data.subarray(needed_size, ctx.size);

        ctx.data = Buffer.concat([part1, data, part2]) as DataType;

        ctx.size = ctx.data.length;

        ctx.sizeB = ctx.data.length * 8;
    }

    if (consume) {
        ctx.offset = (offset || ctx.offset) + data.length;

        ctx.bitoffset = 0;
    }

    return;
};

// #region Math

async function AND(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, and_key: number | string | Uint8Array | Buffer, start?: number, end?: number, consume?: boolean): Promise<void> {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
        } else {
            if (typeof and_key == "string") {
                and_key = Uint8Array.from(Array.from(and_key as string).map(letter => letter.charCodeAt(0)));
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
                        } else {
                            keyIndex = 0;
                        }

                        input[i] = input[i] & and_key[keyIndex];
                    }

                    await ctx.commit(true);

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
    }

    if (typeof and_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] & (and_key & 0xff);

            if (consume) {
                ctx.offset = i;

                ctx.bitoffset = 0;
            }
        }
    } else {
        if (typeof and_key == "string") {
            and_key = Uint8Array.from(Array.from(and_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (arrayBufferCheck(and_key)) {
            var number = -1;

            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != and_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }

                ctx.data[i] = ctx.data[i] & and_key[number];

                if (consume) {
                    ctx.offset = i;

                    ctx.bitoffset = 0;
                }
            }
        } else {
            throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
        }
    }
};

async function OR(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, or_key: number | string | Uint8Array | Buffer, start?: number, end?: number, consume?: boolean): Promise<void> {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
        } else {
            if (typeof or_key == "string") {
                or_key = Uint8Array.from(Array.from(or_key as string).map(letter => letter.charCodeAt(0)));
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
                        } else {
                            number = 0;
                        }

                        input[i] = input[i] | or_key[number];
                    }

                    await ctx.commit(true);

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
    }

    if (typeof or_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] | (or_key & 0xff);

            if (consume) {
                ctx.offset = i;

                ctx.bitoffset = 0;
            }
        }
    } else {
        if (typeof or_key == "string") {
            or_key = Uint8Array.from(Array.from(or_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (arrayBufferCheck(or_key)) {
            var number = -1;

            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != or_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }

                ctx.data[i] = ctx.data[i] | or_key[number];

                if (consume) {
                    ctx.offset = i;

                    ctx.bitoffset = 0;
                }
            }
        } else {
            throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
};

async function XOR(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, xor_key: number | string | Uint8Array | Buffer, start?: number, end?: number, consume?: boolean): Promise<void> {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
        } else {
            if (typeof xor_key == "string") {
                xor_key = Uint8Array.from(Array.from(xor_key as string).map(letter => letter.charCodeAt(0)));
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
                        } else {
                            keyIndex = 0;
                        }

                        input[i] = input[i] ^ xor_key[keyIndex];
                    }

                    await ctx.commit(true);

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
    }

    if (typeof xor_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] ^ (xor_key & 0xff);

            if (consume) {
                ctx.offset = i;

                ctx.bitoffset = 0;
            }
        }
    } else {
        if (typeof xor_key == "string") {
            xor_key = Uint8Array.from(Array.from(xor_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (arrayBufferCheck(xor_key)) {
            let number = -1;

            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != xor_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }

                ctx.data[i] = ctx.data[i] ^ xor_key[number];

                if (consume) {
                    ctx.offset = i;

                    ctx.bitoffset = 0;
                }
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
};

async function NOT(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, start?: number, end?: number, consume?: boolean): Promise<void> {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            }
            else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
};

async function LSHIFT(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, shift_key: number | string | Uint8Array | Buffer, start?: number, end?: number, consume?: boolean): Promise<void> {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
        } else {
            if (typeof shift_key == "string") {
                shift_key = Uint8Array.from(Array.from(shift_key as string).map(letter => letter.charCodeAt(0)));
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
                        } else {
                            keyIndex = 0;
                        }

                        input[i] = input[i] << shift_key[keyIndex];
                    }

                    await ctx.commit(true);

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
    }

    if (typeof shift_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] << shift_key;

            if (consume) {
                ctx.offset = i;

                ctx.bitoffset = 0;
            }
        }
    } else {
        if (typeof shift_key == "string") {
            shift_key = Uint8Array.from(Array.from(shift_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (arrayBufferCheck(shift_key)) {
            var number = -1;

            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != shift_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }

                ctx.data[i] = ctx.data[i] << shift_key[number];

                if (consume) {
                    ctx.offset = i;

                    ctx.bitoffset = 0;
                }
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    return;
};

async function RSHIFT(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, shift_key: number | string | Uint8Array | Buffer, start?: number, end?: number, consume?: boolean): Promise<void> {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
        } else {
            if (typeof shift_key == "string") {
                shift_key = Uint8Array.from(Array.from(shift_key as string).map(letter => letter.charCodeAt(0)));
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
                        } else {
                            keyIndex = 0;
                        }

                        input[i] = input[i] >> shift_key[keyIndex];
                    }

                    await ctx.commit(true);

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
    }

    if (typeof shift_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] >> shift_key;

            if (consume) {
                ctx.offset = i;

                ctx.bitoffset = 0;
            }
        }
    } else {
        if (typeof shift_key == "string") {
            shift_key = Uint8Array.from(Array.from(shift_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (arrayBufferCheck(shift_key)) {
            var number = -1;

            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != shift_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }

                ctx.data[i] = ctx.data[i] >> shift_key[number];

                if (consume) {
                    ctx.offset = i;

                    ctx.bitoffset = 0;
                }
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    return;
};

async function ADD(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, add_key: number | string | Uint8Array | Buffer, start?: number, end?: number, consume?: boolean): Promise<void> {
    if ((end || 0) > ctx.size) {
        if (ctx.strict == false) {
            if (ctx.extendBufferSize != 0) {
                await ctx.extendArray(ctx.extendBufferSize);
            } else {
                await ctx.extendArray((end || 0) - ctx.size);
            }
        } else {
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
        } else {
            if (typeof add_key == "string") {
                add_key = Uint8Array.from(Array.from(add_key as string).map(letter => letter.charCodeAt(0)));
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
                        } else {
                            keyIndex = 0;
                        }

                        input[i] = input[i] + add_key[keyIndex];
                    }

                    await ctx.commit(true);

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
    }

    if (typeof add_key == "number") {
        for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
            ctx.data[i] = ctx.data[i] + add_key;

            if (consume) {
                ctx.offset = i;

                ctx.bitoffset = 0;
            }
        }
    } else {
        if (typeof add_key == "string") {
            add_key = Uint8Array.from(Array.from(add_key as string).map(letter => letter.charCodeAt(0)));
        }

        if (arrayBufferCheck(add_key)) {
            var number = -1;

            for (let i = (start || 0); i < Math.min(end || ctx.size, ctx.size); i++) {
                if (number != add_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }
                ctx.data[i] = ctx.data[i] + add_key[number];
                if (consume) {
                    ctx.offset = i;
                    ctx.bitoffset = 0;
                }
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }

    return;
};

// #region Search

async function fString(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, searchString: string): Promise<number> {
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
};

async function fNumber(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, targetNumber: number, bits: number, unsigned: boolean, endian?: string): Promise<number> {
    await ctx.open();

    if (ctx.mode == "file") {
        const chunkSize = 0x2000; // 8192 bytes

        let lastChunk = new Uint8Array(0);

        const totalBits = Math.floor(bits / 8);

        var start = ctx.offset;

        while (start < ctx.size) {
            const currentChunk = await ctx.read(start, Math.min(chunkSize, ctx.size - start), false);

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
            } else {
                let mask = ~(0xFF << read);

                let readBits = (currentByte >> bitOffset) & mask;

                value |= readBits << i;
            }

            off_in_bits += read;

            i += read;
        }

        if (unsigned == true || bits <= 7) {
            value = value >>> 0;
        } else {
            if (bits !== 32 && value & (1 << (bits - 1))) {
                value |= -1 ^ ((1 << bits) - 1);
            }
        }

        if (value === targetNumber) {
            return z - ctx.offset; // Found the byte, return the index from current
        }
    }

    return -1; // number not found
};

async function fHalfFloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, targetNumber: number, endian?: string): Promise<number> {
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
    }

    await check_size(ctx, 2, 0);

    for (let z = ctx.offset; z <= (ctx.size - 2); z++) {
        var value = 0;

        if ((endian != undefined ? endian : ctx.endian) == "little") {
            value = ((ctx.data[z + 1] & 0xFFFF) << 8) | (ctx.data[z] & 0xFFFF);
        } else {
            value = ((ctx.data[z] & 0xFFFF) << 8) | (ctx.data[z + 1] & 0xFFFF);
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
            return z; // Found the number, return the index
        }
    }

    return -1; // number not found
};

async function fFloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, targetNumber: number, endian?: string): Promise<number> {
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
    }

    await check_size(ctx, 4, 0);

    for (let z = ctx.offset; z <= (ctx.size - 4); z++) {
        var value = 0;

        if ((endian != undefined ? endian : ctx.endian) == "little") {
            value = ((ctx.data[z + 3] & 0xFF) << 24) |
                ((ctx.data[z + 2] & 0xFF) << 16) |
                ((ctx.data[z + 1] & 0xFF) << 8) |
                (ctx.data[z] & 0xFF);
        } else {
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
            return z; // Found the number, return the index
        }
    }

    return -1; // number not found
};

async function fBigInt(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, targetNumber: BigValue, unsigned: boolean, endian?: string): Promise<number> {
    if(!hasBigInt){
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
    }

    await check_size(ctx, 8, 0);

    for (let z = ctx.offset; z <= (ctx.size - 8); z++) {
        var value: bigint = BigInt(0);

        if ((endian == undefined ? ctx.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((ctx.data[z + i] & 0xFF)) << BigInt(8 * i);
            }

            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
            }
        } else {
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

    return -1;// number not found
};

async function fDoubleFloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, targetNumber: number, endian?: string): Promise<number> {
    if(!hasBigInt){
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
    }

    await check_size(ctx, 8, 0);

    for (let z = ctx.offset; z <= (ctx.size - 8); z++) {
        var value = BigInt(0);

        if ((endian == undefined ? ctx.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((ctx.data[z + i] & 0xFF)) << BigInt(8 * i);
            }
        } else {
            for (let i = 0; i < 8; i++) {
                value = (value << BigInt(8)) | BigInt((ctx.data[z + i] & 0xFF));
            }
        }

        const sign = (value & BigInt("9223372036854775808")) >> BigInt(63);

        const exponent = Number((value & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;

        const fraction = Number(value & BigInt("4503599627370495")) / Math.pow(2, 52);

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

        if (floatValue == targetNumber) {
            return z;
        }
    }

    return -1; // number not found
};

// #region Write / Read Bits

async function wbit(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, value: number, bits: number, unsigned?: boolean, endian?: string): Promise<void> {
    await ctx.open();

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
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

            throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + 0 + " max: " + Math.pow(2, bits) + " value: " + value);
        }
    } else {
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
        } else {
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
            let mask = ~(~0 << written);

            let writeBits = (value >> (bits - i - written)) & mask;

            var destShift = 8 - bitOffset - written;

            let destMask = ~(mask << destShift);

            input[bOff] = (input[bOff] & destMask) | (writeBits << destShift);
        } else {
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
};

async function rbit(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, bits?: number, unsigned?: boolean, endian?: string): Promise<number> {
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
        } else {
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
};

// #region Write / Read Bytes

async function wbyte(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, value: number, unsigned?: boolean): Promise<void> {
    await ctx.open();

    await check_size(ctx, 1, 0);

    if (unsigned == true) {
        if (value < 0 || value > 255) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + 0 + " max: " + 255 + " value: " + value);
        }
    } else {
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
        } else {
            view.setUint8(offset, value);
        }
    } else {
        data[offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
    }

    await ctx.commit(false);

    ctx.offset += 1;

    ctx.bitoffset = 0;

    return;
};

async function rbyte(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, unsigned?: boolean): Promise<number> {
    await ctx.open();

    await check_size(ctx, 1);

    var read: number;

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
        } else {
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
    } else {
        return read > 127 ? read - 256 : read;
    }
};

// #region Write / Read Int16

async function wint16(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, value: number, unsigned?: boolean, endian?: string): Promise<void> {
    await ctx.open();

    await check_size(ctx, 2, 0);

    if (unsigned == true) {
        if (value < 0 || value > 65535) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + 0 + " max: " + 65535 + " value: " + value);
        }
    } else {
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
        } else {
            view.setUint16(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    } else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            data[offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;

            data[offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
        } else {
            data[offset] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;

            data[offset + 1] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
        }
    }

    await ctx.commit(false);

    ctx.offset += 2;

    ctx.bitoffset = 0;
};

async function rint16(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, unsigned?: boolean, endian?: string): Promise<number> {
    await ctx.open();

    await check_size(ctx, 2);

    var read: number;

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
        } else {
            read = view.getUint16(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }

        ctx.offset += 2;

        ctx.bitoffset = 0;

        return read;
    } else {
        if ((endian != undefined ? endian : ctx.endian) == "little") {
            read = ((data[offset + 1] & 0xFFFF) << 8) | (data[offset] & 0xFFFF);
        } else {
            read = ((data[offset] & 0xFFFF) << 8) | (data[offset + 1] & 0xFFFF);
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

// #region Write / Read Float16

async function rhalffloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, endian?: endian): Promise<number> {
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

        const float16Value = (view as any).getFloat16(offset, endian != undefined ? endian == "little" : ctx.endian == "little");

        ctx.offset += 2;

        ctx.bitoffset = 0;

        return float16Value;
    }

    var uint16Value = await ctx.readInt16(true, (endian != undefined ? endian : ctx.endian));

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

async function whalffloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, value: number, endian?: string): Promise<void> {
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

        (view as any).setFloat16(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");

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
    } else {
        data[offset] = (halfFloatBits >> 8) & 0xFF;

        data[offset + 1] = halfFloatBits & 0xFF;
    }

    await ctx.commit(false);

    ctx.offset += 2;

    ctx.bitoffset = 0;
};

// #region Write / Read Int32

async function wint32(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, value: number, unsigned?: boolean, endian?: string): Promise<void> {
    await ctx.open();

    await check_size(ctx, 4, 0);

    if (unsigned == true) {
        if (value < 0 || value > 4294967295) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + 0 + " max: " + 4294967295 + " value: " + value);
        }
    } else {
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
        } else {
            view.setUint32(offset, value, endian != undefined ? endian == "little" : ctx.endian == "little");
        }
    } else {
        if ((endian == undefined ? ctx.endian : endian) == "little") {
            data[offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;

            data[offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;

            data[offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;

            data[offset + 3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        } else {
            data[offset] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;

            data[offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;

            data[offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;

            data[offset + 3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        }
    }

    await ctx.commit(false);

    ctx.offset += 4;

    ctx.bitoffset = 0;
};

async function rint32(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, unsigned?: boolean, endian?: string): Promise<number> {
    await ctx.open();

    await check_size(ctx, 4);

    var read: number;

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
        } else {
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
    } else {
        read = ((data[offset] & 0xFF) << 24) |
            ((data[offset + 1] & 0xFF) << 16) |
            ((data[offset + 2] & 0xFF) << 8) |
            (data[offset + 3] & 0xFF);
    }

    ctx.offset += 4;

    ctx.bitoffset = 0;

    if (unsigned == undefined || unsigned == false) {
        return read;
    } else {
        return read >>> 0;
    }
};

// #region Write / Read Float32

async function rfloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, endian?: endian): Promise<number> {
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

async function wfloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, value: number, endian?: string): Promise<void> {
    await ctx.open();

    await check_size(ctx, 4, 0);

    const MIN_POSITIVE_FLOAT32 = Number.MIN_VALUE;

    const MAX_POSITIVE_FLOAT32 = 3.4028235e+38;

    const MIN_NEGATIVE_FLOAT32 = -3.4028235e+38;

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
    } else {
        const arrayFloat = new Float32Array(1);

        arrayFloat[0] = value;

        if (endian != undefined ? endian == "little" : ctx.endian == "little") {
            data[offset] = arrayFloat.buffer[0];

            data[offset + 1] = arrayFloat.buffer[1];

            data[offset + 2] = arrayFloat.buffer[2];

            data[offset + 3] = arrayFloat.buffer[3];
        } else {
            data[offset] = arrayFloat.buffer[3];

            data[offset + 1] = arrayFloat.buffer[2];

            data[offset + 2] = arrayFloat.buffer[1];

            data[offset + 3] = arrayFloat.buffer[0];
        }
    }

    await ctx.commit(false);

    ctx.offset += 4;

    ctx.bitoffset = 0;
};

// #region Write / Read Int64

async function rint64<hasBigInt extends boolean>(ctx: BiBaseAsync<Buffer | Uint8Array, hasBigInt>, unsigned?: boolean, endian?: string): Promise<hasBigInt extends true ? bigint : number> {
    if(!hasBigInt){
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
        } else {
            value = view.getBigUint64(offset, endian != undefined ? endian == "little" : ctx.endian == "little");
        }

        ctx.offset += 8;
    } else {
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
        } else {
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
        return value as hasBigInt extends true ? bigint : number;
    } else {
        if (isSafeInt64(value)) {
            return Number(value) as hasBigInt extends true ? bigint : number;
        } else {
            throw new Error("Value is outside of number range and enforceBigInt is set to false. " + value);
        }
    }
};

async function wint64(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, value: BigValue, unsigned?: boolean, endian?: string): Promise<void> {
    if(!hasBigInt){
        throw new Error("System doesn't support BigInt values.");
    }

    await ctx.open();

    await check_size(ctx, 8, 0);


    if (unsigned == true) {
        if (value < 0 || value > Math.pow(2, 64) - 1) {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + 0 + " max: " + (Math.pow(2, 64) - 1) + " value: " + value);
        }
    } else {
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
        } else {
            view.setBigUint64(offset, BigInt(value), endian != undefined ? endian == "little" : ctx.endian == "little");
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
                    data[offset + i * 4 + 0] = int32Array[i];

                    data[offset + i * 4 + 1] = (int32Array[i] >> 8);

                    data[offset + i * 4 + 2] = (int32Array[i] >> 16);

                    data[offset + i * 4 + 3] = (int32Array[i] >> 24);
                } else {
                    data[offset + i * 4 + 0] = int32Array[i] & 0xFF;

                    data[offset + i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;

                    data[offset + i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;

                    data[offset + i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
                }
            } else {
                if (unsigned == undefined || unsigned == false) {
                    data[offset + (1 - i) * 4 + 3] = int32Array[i];

                    data[offset + (1 - i) * 4 + 2] = (int32Array[i] >> 8);

                    data[offset + (1 - i) * 4 + 1] = (int32Array[i] >> 16);

                    data[offset + (1 - i) * 4 + 0] = (int32Array[i] >> 24);
                } else {
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
};

// #region Write / Read Float64

async function wdfloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, value: number, endian?: string): Promise<void> {
    await ctx.open();

    await check_size(ctx, 8, 0);

    const MIN_POSITIVE_FLOAT64 = 2.2250738585072014e-308;

    const MAX_POSITIVE_FLOAT64 = Number.MAX_VALUE;

    const MIN_NEGATIVE_FLOAT64 = -Number.MAX_VALUE;

    const MAX_NEGATIVE_FLOAT64 = -2.2250738585072014e-308;

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
    } else {
        const intArray = new Int32Array(2);

        const floatArray = new Float64Array(intArray.buffer);

        floatArray[0] = value;

        const bytes = new Uint8Array(intArray.buffer);

        for (let i = 0; i < 8; i++) {
            if ((endian == undefined ? ctx.endian : endian) == "little") {
                data[offset + i] = bytes[i];
            } else {
                data[offset + (7 - i)] = bytes[i];
            }
        }
    }

    await ctx.commit(false);

    ctx.offset += 8;

    ctx.bitoffset = 0;
};

async function rdfloat(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, endian?: endian): Promise<number> {
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

// #region Write / Read Strings

async function rstring(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, options?: stringOptions): Promise<string> {
    await ctx.open();

    var length: any = options && options.length;

    var stringType: any = options && options.stringType || 'utf-8';

    var terminateValue: any = options && options.terminateValue;

    var lengthReadSize: any = options && options.lengthReadSize || 1;

    var stripNull: any = options && options.stripNull || true;

    var encoding: any = options && options.encoding || 'utf-8';

    var endian: any = options && options.endian || ctx.endian;

    var terminate = terminateValue;

    if (length != undefined) {
        await check_size(ctx, length);
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
            read_length = ctx.data.length - ctx.offset;
        }

        for (let i = 0; i < read_length; i++) {
            if (stringType === 'utf-8') {
                var read = await ctx.readUByte();

                if (read == terminate) {
                    break;
                } else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read);
                    }
                }
            } else {
                var read = await ctx.readInt16(true, endian);

                var read1 = read & 0xFF;

                var read2 = (read >> 8) & 0xFF;

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
            maxBytes = await ctx.readUByte();
        } else if (lengthReadSize == 2) {
            maxBytes = await ctx.readInt16(true, endian);
        } else if (lengthReadSize == 4) {
            maxBytes = await ctx.readInt32(true, endian);
        } else {
            ctx.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + ctx.hexdump({ returnString: true })) : "";

            throw new Error("Invalid length read size: " + lengthReadSize);
        }
        // Read the string as Pascal or Delphi encoded
        const encodedBytes: Array<number> = [];

        for (let i = 0; i < maxBytes; i++) {
            if (stringType == 'wide-pascal') {
                const read = await ctx.readInt16(true, endian);

                i++;

                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read);
                }
            } else {
                const read = await ctx.readUByte();

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

async function wstring(ctx: BiBaseAsync<Buffer | Uint8Array, true | false>, string: string, options?: stringOptions): Promise<void> {
    await ctx.open();

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
                } else {
                    data[offset + i * 2 + 1] = charCode & 0xFF;

                    data[offset + i * 2] = (charCode >> 8) & 0xFF;
                }
            } else {
                data[offset + i] = encodedString[i];
            }
        }

        if (terminateValue != undefined) {
            if (stringType === 'utf-16') {
                data[offset + totalLength - 1] = terminateValue & 0xFF;

                data[offset + totalLength] = (terminateValue >> 8) & 0xFF;
            } else {
                data[offset + totalLength] = terminateValue;
            }
        }

        await ctx.commit(false);

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
        } else if (lengthWriteSize == 2) {
            await ctx.writeUInt16(totalLength, endian);
        } else if (lengthWriteSize == 4) {
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
                } else {
                    data[offset + i + 1] = encodedString[i];

                    data[offset + i] = encodedString[i + 1];
                }

                i++;
            } else {
                data[offset + i] = encodedString[i];
            }
        }

        await ctx.commit(false);

        ctx.offset += totalLength;

        ctx.bitoffset = 0;
    } else {
        throw new Error('Unsupported string type: ' + stringType);
    }
};

// #region Class

/**
 * Base class for BiReader and BiWriter
 */
export class BiBaseAsync<DataType extends Buffer | Uint8Array, hasBigInt extends boolean> {
    /**
     * Endianness of default read. 
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
     * Size in bytes of the current buffer.
     */
    public size: number = 0;
    /**
     * Size in bits of the current buffer.
     */
    public sizeB: number = 0;
    /**
     * Allows the buffer to extend reading or writing outside of current size
     */
    public strict: boolean = false;
    /**
     * Console log a hexdump on error.
     */
    public errorDump: boolean = false;

    #data: DataType | null = null;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     * 
     * Otherwise it extends just the amount of the next written value.
     * 
     * This can greatly speed up data writes when large files are being written.
     * 
     * NOTE: Using ``BiWriter.get`` or ``BiWriter.return`` will now remove all data after the current write position. Use ``BiWriter.data`` to get the full buffer instead.
     */
    public extendBufferSize: number = 0;

    public fh: FileHandle | null = null;

    public filePath: string | null = null;

    public fsMode: fsMode = "r";

    protected isWriter = false;

    protected directWrite = false;
    /**
     * The settings that used when using the .str getter / setter
     */
    private strDefaults: stringOptions = { stringType: "utf-8", terminateValue: 0x0 };
    /**
     * Window size of the file data (largest amount it can read)
     */
    public maxFileSize: number | null = null;

    public enforceBigInt: hasBigInt = null;

    public view: DataView;

    public mode: 'memory' | 'file' = 'memory';

    /**
     * Get the current buffer data.
     * 
     * @type {DataType}
     */
    get data(): DataType {
        return this.#data;
    };

    /**
     * Set the current buffer data.
     * 
     * @param {DataType} data
     */
    set data(data: DataType) {
        if (this.isBufferOrUint8Array(data)) {
            this.#data = data;

            this.updateView();
        }
    };

    constructor(input?: string | DataType, writeable?: boolean) {
        if (typeof input == "string") {
            if(typeof Buffer === 'undefined' || typeof fs == "undefined"){
                throw new Error("Need node to read or write files.");
            }

            this.filePath = input;

            this.mode = "file";
        } else {
            this.mode = "memory";
        }

        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH();
        }

        if (writeable != undefined) {
            if (writeable == true) {
                this.fsMode = "w+";
            } else {
                this.fsMode = "r";
            }
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
     * Enables expanding in reader (changes strict)
     * 
     * @param {boolean} mode - Enable expanding in reader (changes strict)
     */
    async writeMode(mode: boolean) {
        if (mode) {
            this.strict = false;

            if (this.mode == "file") {
                this.fsMode = "w+";

                await this.close();

                await this.open();
            }

            return;
        } else {
            this.strict = true;

            if (this.mode == "file") {
                this.fsMode = "r";

                await this.close();

                await this.open();
            }

            return;
        }
    };

    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     * 
     * @returns {Promise<number>} file size
     */
    async open(): Promise<number> {
        if (this.mode == "memory") {
            return this.size;
        }

        if (this.fh != null) {
            return this.size;
        }

        if (fs == undefined) {
            throw new Error("Can't load file without Node.");
        }

        if (this.maxFileSize == null) {
            this.maxFileSize = MAX_LENGTH();
        }

        try {
            this.fh = await fs.open(this.filePath, this.fsMode);
        } catch (error) {
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
                    } else {
                        await this.extendArray(this.offset - this.size);
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
    async updateSize(): Promise<void> {
        if (this.mode == "memory") {
            return;
        }

        if (fs == undefined) {
            throw new Error("Can't read file without Node.");
        }

        if (this.fh !== null) {
            try {
                const stat = await this.fh.stat();

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
     * @returns {Promise<void>}
     */
    async close(): Promise<void> {
        if (this.mode == "memory") {
            this.#data = undefined;

            this.view = undefined;

            return;
        }

        await this.open();

        if (this.fh === null) {
            return; // Already closed / or not open
        }

        if (fs == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }

        try {
            await this.fh.close();
        } catch (error) {
            throw new Error(error);
        }

        this.fh = null;

        return;
    };

    /**
     * Internal reader
     * 
     * @param start this.offset
     * @param length 
     * @param consume
     * @returns {Promise<DataType>}
     */
    async read(start: number, length: number, consume: boolean = false): Promise<DataType> {
        if (this.mode == "memory") {
            return this.lift(start, start + length, consume);
        }

        await this.open();

        if (this.fh === null) {
            throw new Error('File is not open yet.');
        }

        if (length < 1) {
            return Buffer.alloc(0) as DataType;
        }

        const end = start + length;

        if (length > this.maxFileSize) {
            throw new Error("File read is greater than Node's max buffer size: " + this.maxFileSize);
        }

        if (end > this.size) {
            if (this.strict == false) {
                if (this.extendBufferSize != 0) {
                    await this.extendArray(this.extendBufferSize);
                } else {
                    await this.extendArray(length);
                }
            } else {
                throw new Error('File read is outside data size while in strict mode.');
            }
        }

        const data = Buffer.alloc(length);

        try {
            const {bytesRead} = await this.fh.read(data, 0, data.length, start);

            if(bytesRead != length){
                throw new Error("Didn't read the amount needed for value: " + bytesRead + " of " + length);
            }
        } catch (error) {
            throw new Error(error);
        }

        this.data = data as DataType;

        if (consume) {
            this.offset = start + data.length;

            this.bitoffset = 0;
        }

        return this.data;
    };

    /**
     * Write buffer to data
     * 
     * @param {DataType} data 
     * @param {boolean} consume
     * @param {number} start - likely this.offset
     * @returns {Promise<number>}
     */
    async write(data: DataType, consume: boolean = false, start: number = this.offset): Promise<number> {
        if (this.mode == "memory") {
            await this.insert(data, consume, start);

            return data.length;
        }

        await this.open();

        if (fs == undefined) {
            throw new Error("Can't use BitFile without Node.");
        }

        if (this.fh === null) {
            throw new Error('File is not open yet.');
        }

        if (data.length < 1) {
            return 0;
        }

        const end = start + data.length

        if (end > this.size) {
            if (this.strict == false) {
                if (this.extendBufferSize != 0) {
                    await this.extendArray(this.extendBufferSize);
                } else {
                    await this.extendArray(data.length);
                }
            } else {
                throw new Error('File write is outside of data size while in strict mode.');
            }
        }

        var bytesWritten: number;

        try {
            const written = await this.fh.write(data, 0, data.length, start);

            bytesWritten = written.bytesWritten;
        } catch (error) {
            throw new Error(error);
        }

        await this.updateSize();

        if (consume) {
            this.offset = start + bytesWritten;
        }

        return bytesWritten;
    };

    /**
     * Write data buffer back to file
     * 
     * @returns {Promise<Buffer>}
     */
    async commit(consume: boolean = true): Promise<number> {
        if (this.mode == "memory") {
            return this.data.length;
        }

        await this.open();

        if (this.data === null) {
            throw new Error("No data to write.");
        }

        return await this.write(this.data as DataType, consume, this.offset);
    };

    /**
     * syncs the data to file
     */
    async flush(): Promise<void> {
        if (this.fh) {
            await this.fh.sync();
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
    async renameFile(newFilePath: string): Promise<void> {
        if (this.mode == "memory") {
            return;
        }

        try {
            await this.fh.close();

            this.fh = null;

            await fs.rename(this.filePath, newFilePath);
        } catch (error) {
            throw new Error(error);
        }

        this.filePath = newFilePath;

        await this.open();
    };

    /**
     * Deletes the working file.
     * 
     * Note: This is permanentand can't be undone. 
     * 
     * It doesn't send the file to the recycling bin for recovery.
     */
    async deleteFile(): Promise<void> {
        if (this.mode == "memory") {
            return;
        }

        try {
            await this.fh.close();

            this.fh = null;

            await fs.unlink(this.filePath);
        } catch (error) {
            throw new Error(error);
        }
    };

    async extendArray(to_padd: number): Promise<void> {
        return await extendarray(this, to_padd);
    };

    isBufferOrUint8Array(obj: any): boolean {
        return arrayBufferCheck(obj);
    };

    /**
     * Call this after everytime we set/replace `this.data`
     */
    updateView(): void {
        if (this.#data) {
            this.view = new DataView(
                this.#data.buffer,
                this.#data.byteOffset ?? 0,
                this.#data.byteLength
            );
        }
    };

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
    // #region SIZE
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
    // #region POSITION
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
    async get(): Promise<DataType> {
        if (this.extendBufferSize != 0) {
            await this.trim();
        }

        return this.data;
    };

    /**
     * Returns current data.
     * 
     * Note: Will remove all data after current position if ``extendBufferSize`` was set.
     * 
     * Use ``.data`` instead if you want the full buffer data.
     * 
     * @returns {Promise<DataType>} ``Buffer``
     */
    async return(): Promise<DataType> {
        return await this.get();
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
    async hexdump(options: hexdumpOptions = {}): Promise<void | string> {
        return await hexDumpBase(this, options);
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
    // #region STRICT MODE
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
     * 
     * Commits any changes to file when editing a file.
     */
    async end(): Promise<void> {
        if (this.mode == "memory") {
            this.#data = undefined;

            this.view = undefined;

            return;
        }

        await this.commit();

        return;
    };

    /**
     * removes data.
     * 
     * Commits any changes to file when editing a file.
     */
    async done(): Promise<void> {
        return await this.end();
    };

    /**
     * removes data.
     * 
     * Commits any changes to file when editing a file.
     */
    async finished(): Promise<void> {
        return await this.end();
    };

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
    async findString(string: string): Promise<number> {
        return await fString(this, string);
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
    async findByte(value: number, unsigned?: boolean, endian?: endian): Promise<number> {
        return await fNumber(this, value, 8, unsigned == undefined ? true : unsigned, endian);
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
    async findShort(value: number, unsigned?: boolean, endian?: endian): Promise<number> {
        return await fNumber(this, value, 16, unsigned == undefined ? true : unsigned, endian);
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
    async findInt(value: number, unsigned?: boolean, endian?: endian): Promise<number> {
        return await fNumber(this, value, 32, unsigned == undefined ? true : unsigned, endian);
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
    async findInt64(value: BigValue, unsigned?: boolean, endian?: endian): Promise<number> {
        return await fBigInt(this, value, unsigned == undefined ? true : unsigned, endian);
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
    async findHalfFloat(value: number, endian?: endian): Promise<number> {
        return await fHalfFloat(this, value, endian);
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
    async findFloat(value: number, endian?: endian): Promise<number> {
        return await fFloat(this, value, endian);
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
    async findDoubleFloat(value: number, endian?: endian): Promise<number> {
        return await fDoubleFloat(this, value, endian);
    };

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
    async skip(bytes: number, bits?: number): Promise<void> {
        return await skip(this, bytes, bits);
    };

    /**
    * Offset current byte or bit position.
    * 
    * Note: Will extend array if strict mode is off and outside of max size.
    * 
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    async jump(bytes: number, bits?: number): Promise<void> {
        await this.skip(bytes, bits);
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async FSeek(byte: number, bit?: number): Promise<void> {
        return await goto(this, byte, bit)
    };

    /**
     * Offset current byte or bit position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    async seek(bytes: number, bits?: number): Promise<void> {
        return await this.skip(bytes, bits)
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async goto(byte: number, bit?: number): Promise<void> {
        return await goto(this, byte, bit);
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async pointer(byte: number, bit?: number): Promise<void> {
        return await this.goto(byte, bit)
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async warp(byte: number, bit?: number): Promise<void> {
        return await this.goto(byte, bit)
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
    async delete(startOffset?: number, endOffset?: number, consume?: boolean): Promise<DataType> {
        return await remove(this, startOffset || 0, endOffset || this.offset, consume || false, true) as DataType;
    };

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @returns {Promise<DataType>} Removed data as ``Buffer``
     */
    async clip(): Promise<DataType> {
        return await remove(this, this.offset, this.size, false, true) as DataType;
    };

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @returns {Promise<DataType>} Removed data as ``Buffer``
     */
    async trim(): Promise<DataType> {
        return await remove(this, this.offset, this.size, false, true) as DataType;
    };

    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Promise<DataType>} Removed data as ``Buffer```
     */
    async crop(length: number, consume?: boolean): Promise<DataType> {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, true) as DataType;
    };

    /**
     * Deletes part of data from current position to supplied length, returns removed.
     * 
     * Note: Only works in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Promise<DataType>} Removed data as ``Buffer``
     */
    async drop(length: number, consume?: boolean): Promise<DataType> {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, true) as DataType;
    };

    /**
     * Replaces data in data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    async replace(data: DataType, consume?: boolean, offset?: number): Promise<void> {
        return await addData(this, data, consume || false, offset || this.offset, true);
    };

    /**
     * Replaces data in data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    async overwrite(data: DataType, consume?: boolean, offset?: number): Promise<void> {
        return await addData(this, data, consume || false, offset || this.offset, true);
    };

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
    async lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Promise<DataType> {
        return await remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue) as DataType;
    };

    /**
     * Returns part of data from current byte position to end of data unless supplied.
     * 
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Promise<DataType> {
        return await remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue) as DataType;
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async extract(length: number, consume?: boolean): Promise<DataType> {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, false) as DataType;
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async slice(length: number, consume?: boolean): Promise<DataType> {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, false) as DataType;
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Promise<DataType>} Selected data as ``Buffer``
     */
    async wrap(length: number, consume?: boolean): Promise<DataType> {
        return await remove(this, this.offset, this.offset + (length || 0), consume || false, false) as DataType;
    };

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
    async insert(data: DataType, consume?: boolean, offset?: number): Promise<void> {
        return await addData(this, data, consume || false, offset || this.offset, false);
    };

    /**
     * Inserts data into data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    async place(data: DataType, consume?: boolean, offset?: number): Promise<void> {
        return await addData(this, data, consume || false, offset || this.offset, false);
    };

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async unshift(data: DataType, consume?: boolean): Promise<void> {
        return await addData(this, data, consume || false, 0, false);
    };

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async prepend(data: DataType, consume?: boolean): Promise<void> {
        return await addData(this, data, consume || false, 0, false);
    };

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async push(data: DataType, consume?: boolean): Promise<void> {
        return await addData(this, data, consume || false, this.size, false);
    };

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async append(data: DataType, consume?: boolean): Promise<void> {
        return await addData(this, data, consume || false, this.size, false);
    };

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
    async xor(xorKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void> {
        var XORKey: any = xorKey;

        if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        } else if (!(this.isBufferOrUint8Array(XORKey) || typeof xorKey == "number")) {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }

        return await XOR(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * XOR data.
     * 
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async xorThis(xorKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void> {
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

        return await XOR(this, XORKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * OR data
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async or(orKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void> {
        var ORKey: any = orKey;

        if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        } else if (!(this.isBufferOrUint8Array(ORKey) || typeof orKey == "number")) {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }

        return await OR(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * OR data.
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void> {
        var Length: number = length || 1;

        var ORKey: any = orKey;

        if (typeof orKey == "number") {
            Length = length || 1;
        } else if (typeof orKey == "string") {
            const encoder = new TextEncoder().encode(orKey);

            ORKey = encoder;

            Length = length || encoder.length;
        } else if (this.isBufferOrUint8Array(ORKey)) {
            Length = length || orKey.length;
        } else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }

        return await OR(this, ORKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * AND data.
     * 
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async and(andKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void> {
        var ANDKey: any = andKey;

        if (typeof ANDKey == "string") {
            ANDKey = new TextEncoder().encode(ANDKey);
        } else if (!(typeof ANDKey == "object" || typeof ANDKey == "number")) {
            throw new Error("AND must be a number, string, number array or Buffer");
        }

        return await AND(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * AND data.
     * 
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async andThis(andKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void> {
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

        return await AND(this, ANDKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * Add value to data.
     * 
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async add(addKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void> {
        var addedKey: any = addKey;

        if (typeof addedKey == "string") {
            addedKey = new TextEncoder().encode(addedKey);
        } else if (!(typeof addedKey == "object" || typeof addedKey == "number")) {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }

        return await ADD(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * Add value to data.
     * 
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async addThis(addKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void> {
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

        return await ADD(this, AddedKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * Not data.
     * 
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async not(startOffset?: number, endOffset?: number, consume?: boolean): Promise<void> {
        return await NOT(this, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * Not data.
     * 
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async notThis(length?: number, consume?: boolean): Promise<void> {
        return await NOT(this, this.offset, this.offset + (length || 1), consume || false);
    };

    /**
     * Left shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async lShift(shiftKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void> {
        var lShiftKey: any = shiftKey;

        if (typeof lShiftKey == "string") {
            lShiftKey = new TextEncoder().encode(lShiftKey);
        } else if (!(typeof lShiftKey == "object" || typeof lShiftKey == "number")) {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }

        return await LSHIFT(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * Left shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async lShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void> {
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

        return await LSHIFT(this, shiftKey, this.offset, this.offset + Length, consume || false);
    };

    /**
     * Right shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async rShift(shiftKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): Promise<void> {
        var rShiftKey: any = shiftKey;

        if (typeof rShiftKey == "string") {
            rShiftKey = new TextEncoder().encode(rShiftKey);
        } else if (!(typeof rShiftKey == "object" || typeof rShiftKey == "number")) {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }

        return await RSHIFT(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    };

    /**
     * Right shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async rShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): Promise<void> {
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

        return await RSHIFT(this, lShiftKey, this.offset, this.offset + Length, consume || false);
    };

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
    async writeBit(value: number, bits: number, unsigned?: boolean, endian?: endian): Promise<void> {
        return await wbit(this, value, bits, unsigned, endian);
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @returns {Promise<number>}
     */
    async writeUBitBE(value: number, bits: number): Promise<void> {
        return await wbit(this, value, bits, true, "big");
    };

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
    async writeBitBE(value: number, bits: number, unsigned?: boolean): Promise<void> {
        return await wbit(this, value, bits, unsigned, "big");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns {Promise<void>}
     */
    async writeUBitLE(value: number, bits: number): Promise<void> {
        return await wbit(this, value, bits, true, "little");
    };

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
    async writeBitLE(value: number, bits: number, unsigned?: boolean): Promise<void> {
        return await wbit(this, value, bits, unsigned, "little");
    };

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
    async readBit(bits?: number, unsigned?: boolean, endian?: endian): Promise<number> {
        return await rbit(this, bits, unsigned, endian);
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    async readUBitBE(bits: number): Promise<number> {
        return await this.readBit(bits, true, "big");
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
    async readBitBE(bits: number, unsigned?: boolean): Promise<number> {
        return await this.readBit(bits, unsigned, "big");
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    async readUBitLE(bits: number): Promise<number> {
        return await this.readBit(bits, true, "little");
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
    async readBitLE(bits: number, unsigned?: boolean): Promise<number> {
        return await this.readBit(bits, unsigned, "little");
    };

    ///////////////////////////////
    // #region BYTE READER
    ///////////////////////////////

    /**
     * Read byte.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {Promise<number>}
     */
    async readByte(unsigned?: boolean): Promise<number> {
        return await rbyte(this, unsigned);
    };

    /**
     * Read multiple bytes.
     * 
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {Promise<number[]>}
     */
    async readBytes(amount: number, unsigned?: boolean): Promise<number[]> {
        const array: number[] = [];

        for (let i = 0; i < amount; i++) {
            const num = await rbyte(this, unsigned);

            array.push(num);
        }

        return array;
    };

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     */
    async writeByte(value: number, unsigned?: boolean): Promise<void> {
        return await wbyte(this, value, unsigned);
    };

    /**
     * Write multiple bytes.
     * 
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    async writeBytes(values: number[], unsigned?: boolean): Promise<void> {
        for (let i = 0; i < values.length; i++) {
            await wbyte(this, values[i], unsigned);
        }
    };

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    async writeUByte(value: number): Promise<void> {
        return await wbyte(this, value, true);
    };

    /**
     * Read unsigned byte.
     * 
     * @returns {Promise<number>}
     */
    async readUByte(): Promise<number> {
        return await this.readByte(true);
    };

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
    async readInt16(unsigned?: boolean, endian?: endian): Promise<number> {
        return await rint16(this, unsigned, endian);
    };

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeInt16(value: number, unsigned?: boolean, endian?: endian): Promise<void> {
        return await wint16(this, value, unsigned, endian);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt16(value: number, endian?: endian): Promise<void> {
        return await wint16(this, value, true, endian);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async writeUInt16BE(value: number): Promise<void> {
        return await this.writeInt16(value, true, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async writeUInt16LE(value: number): Promise<void> {
        return await this.writeInt16(value, true, "little");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async writeInt16LE(value: number): Promise<void> {
        return await this.writeInt16(value, false, "little");
    };

    /**
     * Read unsigned short.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * 
     * @returns {Promise<number>}
     */
    async readUInt16(endian?: endian): Promise<number> {
        return await this.readInt16(true, endian);
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {number}
     */
    async readUInt16LE(): Promise<number> {
        return await this.readInt16(true, "little");
    };

    /**
     * Read signed short in little endian.
     * 
     * @returns {number}
     */
    async readInt16LE(): Promise<number> {
        return await this.readInt16(false, "little");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {Promise<number>}
     */
    async readUInt16BE(): Promise<number> {
        return await this.readInt16(true, "big");
    };

    /**
    * Read signed short in big endian.
    * 
    * @returns {Promise<number>}
    */
    async readInt16BE(): Promise<number> {
        return await this.readInt16(false, "big");
    };

    ///////////////////////////////
    // #region HALF FLOAT
    ///////////////////////////////

    /**
     * Read half float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async readHalfFloat(endian?: endian): Promise<number> {
        return await rhalffloat(this, endian);
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeHalfFloat(value: number, endian?: endian): Promise<void> {
        return await whalffloat(this, value, endian);
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    async writeHalfFloatBE(value: number): Promise<void> {
        return await this.writeHalfFloat(value, "big");
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    async writeHalfFloatLE(value: number): Promise<void> {
        return await this.writeHalfFloat(value, "little");
    };

    /**
    * Read half float.
    * 
    * @returns {Promise<number>}
    */
    async readHalfFloatBE(): Promise<number> {
        return await this.readHalfFloat("big");
    };

    /**
     * Read half float.
     * 
     * @returns {Promise<number>}
     */
    async readHalfFloatLE(): Promise<number> {
        return await this.readHalfFloat("little");
    };

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
    async readInt32(unsigned?: boolean, endian?: endian): Promise<number> {
        return await rint32(this, unsigned, endian);
    };

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeInt32(value: number, unsigned?: boolean, endian?: endian): Promise<void> {
        return await wint32(this, value, unsigned, endian);
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt32(value: number, endian?: endian): Promise<void> {
        return await wint32(this, value, true, endian);
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async writeInt32LE(value: number): Promise<void> {
        return await this.writeInt32(value, false, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async writeUInt32LE(value: number): Promise<void> {
        return await this.writeInt32(value, true, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async writeInt32BE(value: number): Promise<void> {
        return await this.writeInt32(value, false, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async readInt32BE(): Promise<number> {
        return await this.readInt32(false, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async readUInt32BE(): Promise<number> {
        return await this.readInt32(true, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async readInt32LE(): Promise<number> {
        return await this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async readUInt32LE(): Promise<number> {
        return await this.readInt32(true, "little");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async readUInt(): Promise<number> {
        return await this.readInt32(true);
    };

    ///////////////////////////////
    // #region FLOAT32 READER
    ///////////////////////////////

    /**
     * Read float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async readFloat(endian?: endian): Promise<number> {
        return await rfloat(this, endian);
    };

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeFloat(value: number, endian?: endian): Promise<void> {
        return await wfloat(this, value, endian);
    };

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloatLE(value: number): Promise<void> {
        return await this.writeFloat(value, "little");
    };

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloatBE(value: number): Promise<void> {
        return await this.writeFloat(value, "big");
    };

    /**
     * Read float.
     * 
     * @returns {Promise<number>}
     */
    async readFloatBE(): Promise<number> {
        return await this.readFloat("big");
    };

    /**
     * Read float.
     * 
     * @returns {number}
     */
    async readFloatLE(): Promise<number> {
        return await this.readFloat("little");
    };

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
    async readInt64(unsigned?: boolean, endian?: endian): Promise<hasBigInt extends true ? bigint : number> {
        return await rint64(this, unsigned, endian);
    };

    /**
     * Write 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeInt64(value: BigValue, unsigned?: boolean, endian?: endian): Promise<void> {
        return await wint64(this, value, unsigned, endian);
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt64(value: BigValue, endian?: endian): Promise<void> {
        return await this.writeInt64(value, true, endian);
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async writeInt64LE(value: BigValue): Promise<void> {
        return await this.writeInt64(value, false, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async writeUInt64LE(value: BigValue): Promise<void> {
        return await this.writeInt64(value, true, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async writeInt64BE(value: BigValue): Promise<void> {
        return await this.writeInt64(value, false, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async writeUInt64BE(value: BigValue): Promise<void> {
        return await this.writeInt64(value, true, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {Promise<BigValue>}
     */
    async readUInt64(): Promise<BigValue> {
        return await this.readInt64(true);
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {Promise<BigValue>}
     */
    async readInt64BE(): Promise<BigValue> {
        return await this.readInt64(false, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {Promise<BigValue>}
     */
    async readUInt64BE(): Promise<BigValue> {
        return await this.readInt64(true, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {Promise<BigValue>}
     */
    async readInt64LE(): Promise<BigValue> {
        return await this.readInt64(false, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {Promise<BigValue>}
     */
    async readUInt64LE(): Promise<BigValue> {
        return await this.readInt64(true, "little");
    };

    ///////////////////////////////
    // #region FLOAT64 READER
    ///////////////////////////////

    /**
     * Read double float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async readDoubleFloat(endian?: endian): Promise<number> {
        return await rdfloat(this, endian);
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeDoubleFloat(value: number, endian?: endian): Promise<void> {
        return await wdfloat(this, value, endian);
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    async writeDoubleFloatBE(value: number): Promise<void> {
        return await this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    async writeDoubleFloatLE(value: number): Promise<void> {
        return await this.writeDoubleFloat(value, "little");
    };

    /**
     * Read double float.
     * 
     * @returns {Promise<number>}
     */
    async readDoubleFloatBE(): Promise<number> {
        return await this.readDoubleFloat("big");
    };

    /**
     * Read double float.
     * 
     * @returns {Promise<number>}
     */
    async readDoubleFloatLE(): Promise<number> {
        return await this.readDoubleFloat("little");
    };

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
    async readString(options?: stringOptions): Promise<string> {
        return await rstring(this, options);
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
    async writeString(string: string, options?: stringOptions): Promise<void> {
        return await wstring(this, string, options);
    };
};