/**
 * @file BiReaderAsync / Writer base for working in sync Buffers or full file reads. Node and Browser.
 */


// #region Imports

var fs: typeof import('fs/promises');

import {
    // types
    BiOptions,
    BigValue,
    endian,
    ReturnMapping,
    ReturnBigValueMapping,
    // options
    hexdumpOptions,
    stringOptions,
    // checks
    hasBigInt,
    canInt16,
    canFloat16,
    canInt32,
    canFloat32,
    canBigInt64,
    canFloat64,
    isSafeInt64,
    isBuffer,
    isUint8Array,
    isBufferOrUint8Array,
    // helpers
    numberSafe,
    normalizeBitOffset,
    textEncode,
    _hexDump,
    _AND,
    _OR,
    _XOR,
    _NOT,
    _RSHIFT,
    _LSHIFT,
    _ADD,
    _rbit,
    _wbit,
    _rint16,
    _wint16,
    _rhalffloat,
    _whalffloat,
    _wint32,
    _rint32,
    _rfloat,
    _wfloat,
    _rint64,
    _wint64,
    _rdfloat,
    _wdfloat,
    _rstringAsync,
    _wstringAsync
} from '../common.js';

(async function () {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // We are in Node.js
        try {
            if (typeof require !== 'undefined') {
                if (typeof fs === "undefined") {
                    const _fs = require('fs');

                    fs = _fs.promises;
                }
            } else {
                if (typeof fs === "undefined") {
                    const _fs = await import('fs');

                    fs = _fs.promises;
                }
            }
        } catch (error) {
            console.error('Failed to load fs module:', error);
        }
    }
})();

async function _fileExists(filePath: string) {
    try {
        await fs.access(filePath, fs.constants.F_OK);

        return true;  // File exists
    } catch (error) {
        return false;
    }
};

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
export class BiBaseAsync<DataType, alwaysBigInt> {
    /**
     * Endianness of default read. 
     * @type {endian}
     */
    endian: endian = "little";
    /**
     * Current read byte location.
     */
    #offset: number = 0;
    /**
     * Current read byte's bit location. 0 - 7
     */
    #insetBit: number = 0;
    /**
     * Size in bytes of the current buffer.
     */
    size: number = 0;
    /**
     * Size in bits of the current buffer.
     */
    bitSize: number = 0;
    /**
     * Allows the buffer to extend reading or writing outside of current size
     */
    strict: boolean = false;
    /**
     * Console log a hexdump on error.
     */
    errorDump: boolean = false;
    /**
     * Master Buffer
     */
    #data: ReturnMapping<DataType> = null;
    /**
     * DataView of master Buffer
     */
    #view: DataView = null;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     * 
     * Otherwise it extends just the amount of the next written value.
     * 
     * This can greatly speed up data writes when large files are being written.
     * 
     * NOTE: Using ``BiWriterAsync.get`` or ``BiWriterAsync.return`` will now remove all data after the current write position. Use ``BiWriterAsync.data`` to get the full buffer instead.
     */
    growthIncrement: number = 1048576;
    /**
     * Open file handle
     */
    fd: any = null;
    /**
     * Current file path
     */
    filePath: string;
    /**
     * File write mode
     */
    fsMode: "r+" | "r" = "r";
    /**
     * The settings that used when using the .str getter / setter
     */
    strDefaults: stringOptions = { stringType: "utf-8", terminateValue: 0x0 };
    /**
     * All int64 reads will return as bigint type
     */
    enforceBigInt: alwaysBigInt = null;
    /**
     * Not using a file reader.
     */
    isMemoryMode: boolean = false;
    /**
     * If data can not be written to the buffer.
     */
    readOnly: boolean;

    /**
     * Get the current buffer data.
     * 
     * Use async {@link getData} while in file mode!
     */
    get data(): ReturnMapping<DataType> {
        return this.#data;
    };

    /**
     * Get the current buffer data.
     * 
     * For use in file mode!
     */
    async getData(){
        return await this.get();
    };

    /**
     * Set the current buffer data.
     */
    set data(data: DataType) {
        if (this.isBufferOrUint8Array(data)) {
            this.#data = data as ReturnMapping<DataType>;

            this.#updateView();

            this.size = this.#data.length;

            this.bitSize = this.size * 8;
        }
    };

    /**
     * If the buffer was extended and needs to be trimmed
     */
    wasExpanded: boolean = false;

    /**
     * Get the DataView of current buffer data.
     */
    get view() {
        return this.#view;
    };    

    // ASYNC ONLY

    /**
     * array of loaded data chunks
     */
    chunks: ReturnMapping<DataType>[] = [];
    /**
     * Promises for data chunks
     */
    chunkPromises: Promise<ReturnMapping<DataType>>[] = [];
    /**
     * Edited data chunks
     */
    dirtyChunks: Set<number> = new Set();
    /**
     * The amount of data to "chunk" and read a time from the file
     * 
     * When set to 0, reads whole file at once.
     */
    windowSize: number = 4096;
    /**
     * Data is finished loading
     */
    isFullyLoaded: boolean = false;
    /**
     * Array of all chunks to quickly load all parts
     */
    loadAllPromise: Promise<void> = null;

    constructor(input: DataType, options: BiOptions<alwaysBigInt> = {}) {
        const {
            byteOffset,
            bitOffset,
            endianness,
            strict,
            growthIncrement,
            enforceBigInt,
            readOnly,
            windowSize,
        } = options;

        if (typeof strict != "boolean") {
            throw new TypeError("Strict mode must be true or false");
        }

        this.#offset = byteOffset;

        if((bitOffset ?? 0) != 0){
            this.#offset = Math.floor(byteOffset / 8);

            this.#insetBit = byteOffset % 8;
        }

        this.windowSize = windowSize;

        this.readOnly = !!readOnly;

        this.strict = this.readOnly ? true : strict;

        this.fsMode = this.readOnly ? 'r' : 'r+';

        this.enforceBigInt = !!enforceBigInt as alwaysBigInt;

        if (!hasBigInt) {
            this.enforceBigInt = false as alwaysBigInt;
        }

        this.growthIncrement = growthIncrement;

        if (typeof endianness != "string" || !(endianness == "big" || endianness == "little")) {
            throw new TypeError("Endian must be big or little");
        }

        this.endian = endianness as endian;

        if (typeof input === 'string') {
            if (typeof Buffer === 'undefined' || typeof fs === "undefined") {
                throw new Error("Can't load file outside of Node.");
            }

            this.filePath = input;

            this.isMemoryMode = false;
        } else if (this.isBufferOrUint8Array(input)) {
            this.data = input;

            this.isMemoryMode = true;

            this.filePath = null;

            this.windowSize = 0;

            this.#initMemory();
        } else {
            throw new TypeError('Source must be a file path (string) or Uint8Array/Buffer');
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

    ///////////////////////////////
    // #region INTERNALS
    ///////////////////////////////

    /**
     * Checks if obj is an Uint8Array or a Buffer
     */
    isBufferOrUint8Array(obj: any): obj is Buffer | Uint8Array {
        return isBufferOrUint8Array(obj);
    };

    /**
     * Checks if obj is a Buffer
     */
    isBuffer(obj: any): obj is Buffer {
        return isBuffer(obj);
    };

    /**
     * Checks if obj is an Uint8Array
     */
    isUint8Array(obj: any): obj is Uint8Array {
        return isUint8Array(obj);
    };

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
            } catch (error) {
                throw new Error(error as string);
            }
        }
    };

    /**
     * Call this after everytime we set/replace `this.data`
     */
    #updateView(): void {
        if (this.#data) {
            this.#view = new DataView(
                this.#data.buffer,
                this.#data.byteOffset ?? 0,
                this.#data.byteLength
            );
        }
    };

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
        } catch (error) {
            throw new Error(error as string);
        }

        await this.#updateSize();

        const numChunks = this.#getNumChunks();

        this.chunks = new Array(numChunks).fill(null);

        this.chunkPromises = new Array(numChunks).fill(null);

        if (this.windowSize == 0) {
            this.loadAllPromise = this.#preloadAllChunks();
        } else {
            this.loadAllPromise = Promise.resolve();
        }
    };

    /**
     * Not for file mode
     */
    #initMemory() {
        if (!this.isMemoryMode) {
            return;
        }

        if(this.isFullyLoaded){
            return;
        }

        this.size = this.data.length;

        this.bitSize = this.size * 8;

        const numChunks = this.#getNumChunks();

        this.chunks = new Array(numChunks).fill(null);

        this.chunkPromises = new Array(numChunks).fill(null);

        this.isFullyLoaded = true;

        this.loadAllPromise = null;
    };

    /**
     * For when there is a full file read
     */
    #getChunkIndex(offset: number) {
        return this.windowSize === 0 ? 0 : Math.floor(offset / this.windowSize);
    };

    /**
     * For when there is a full file read
     */
    #getNumChunks() {
        return this.windowSize === 0 ? 1 : Math.ceil(this.size / this.windowSize);
    };

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
    };

    /**
     * Checks the chunk is loaded
     * 
     * @param {number} chunkIndex 
     */
    async #ensureChunkLoaded(chunkIndex: number): Promise<ReturnMapping<DataType>> {
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

            this.chunks[chunkIndex] = this.data.subarray(start, end) as ReturnMapping<DataType>;

            return this.chunks[chunkIndex];
        }

        if (this.chunkPromises[chunkIndex]) {
            return await this.chunkPromises[chunkIndex];
        }

        const promise = this.#performChunkLoad(chunkIndex);

        this.chunkPromises[chunkIndex] = promise as Promise<ReturnMapping<DataType>>;

        return await promise as ReturnMapping<DataType>;
    };

    /**
     * Gets needed chunk
     * 
     * @param {number} chunkIndex 
     */
    async #performChunkLoad(chunkIndex: number) {
        const start = chunkIndex * this.windowSize;

        const length = Math.min(this.windowSize, this.size - start);

        const buffer = Buffer.alloc(length);

        await this.fd.read(buffer, 0, length, start);

        this.chunks[chunkIndex] = buffer as ReturnMapping<DataType>;

        return buffer;
    };

    /**
     * Makes sure the needed size is loaded 
     * 
     * @param {number} offset 
     * @param {number} length 
     */
    async #ensureRangeLoaded(offset: number, length: number) {
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
    };

    /**
     * Get bytes without changing offset
     * 
     * @param {number} offset 
     * @param {number} length 
     */
    async #peekBytes(offset: number, length: number): Promise<ReturnMapping<DataType>> {
        await this.open();

        if (length <= 0) {
            if (this.isMemoryMode) {
                if (this.isBuffer(this.data)) {
                    return Buffer.alloc(0);
                } else {
                    return new Uint8Array(0) as ReturnMapping<DataType>;
                }
            } else {
                return Buffer.alloc(0);
            }
        }

        await this.#ensureRangeLoaded(offset, length);

        var result: ReturnMapping<DataType>;

        if (this.isMemoryMode) {
            return this.data.subarray(offset, offset + length) as ReturnMapping<DataType>;
        } else {
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
    };

    /**
     * write bytes internal
     * 
     * @param {number} offset 
     * @param {Uint8Array | Buffer | number[]} data 
     */
    async #writeBytesAt(offset: number, data: Uint8Array | Buffer | number[]) {
        await this.open();

        if (data.length === 0) {
            return;
        }

        await this.#ensureRangeLoaded(offset, data.length);

        let pos = offset;

        let readPos = 0;

        if(this.isMemoryMode){
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

            var sub: ArrayLike<number>;

            if (this.isBufferOrUint8Array(data)) {
                sub = data.subarray(readPos, readPos + toCopy);
            } else {
                sub = data.slice(readPos, readPos + toCopy);
            }

            chunk.set(sub, chunkOffset);

            this.dirtyChunks.add(chunkIndex);

            readPos += toCopy;

            pos += toCopy;
        }
    };

    /**
     * Checks loaded size
     * 
     * Will set `wasExpanded` if expanded
     * 
     * @param {number} neededSize 
     */
    async #confrimSize(neededSize: number) {
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
    };

     /**
     * extends the data
     * 
     * @param {number} targetSize 
     */
    async #extendArray(targetSize: number) {
        await this.flush();

        if (this.isMemoryMode) {
            const toPadd = targetSize - this.size;
            if (isBuffer(this.#data)) {
                const paddbuffer = Buffer.alloc(toPadd);

                this.data = Buffer.concat([this.#data, paddbuffer]) as DataType;
            } else {
                const newBuf = new Uint8Array(this.size + toPadd);

                newBuf.set(this.#data);

                this.data = newBuf as DataType;
            }

            this.size = targetSize;

            this.bitSize = this.size * 8;

            this.chunks = new Array(this.#getNumChunks()).fill(null);

            this.chunkPromises = new Array(this.#getNumChunks()).fill(null);

            this.dirtyChunks.clear();
        } else {
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
    };

    /**
     * For updating file size
     * 
     * @param {number} exactSize 
     * @returns 
     */
    async #setFileSize(exactSize: number) {
        if (exactSize === this.size) {
            return;
        }

        await this.flush();

        if (this.isMemoryMode) {
            const newData = this.data.subarray(0, exactSize);

            this.data = newData as DataType;

            this.size = exactSize;

            this.bitSize = this.size * 8;

            const newNum = Math.ceil(exactSize / this.windowSize);

            this.chunks = new Array(newNum).fill(null);

            this.chunkPromises = new Array(newNum).fill(null);

            this.dirtyChunks.clear();
        } else {
            await this.fd.truncate(exactSize);

            this.size = exactSize;

            this.bitSize = this.size * 8;

            const oldNum = this.chunks.length;

            const newNum = Math.ceil(exactSize / this.windowSize);

            this.chunks.length = newNum;

            this.chunkPromises.length = newNum;

            if (newNum < oldNum) {
                this.dirtyChunks = new Set([...this.dirtyChunks].filter(i => i < newNum));
            } else {
                for (let i = oldNum; i < newNum; i++) {
                    this.chunks[i] = null;

                    this.chunkPromises[i] = null;
                }
            }
        }
    };

    /**
     * removes a chunk
     * 
     * @param {number} startChunk 
     */
    #invalidateFromChunk(startChunk: number) {
        for (let i = Math.max(0, startChunk); i < this.chunks.length; i++) {
            this.chunks[i] = null;

            this.chunkPromises[i] = null;

            this.dirtyChunks.delete(i);
        }
    };

    /**
     * Pulls data back
     * 
     * @param {number} insertOffset 
     * @param {number} insertLen 
     * @param {number} oldEnd 
     * @param {boolean} consume
     */
    async #shiftTailForward(insertOffset: number, insertLen: number, oldEnd: number, consume: boolean = false) {
        if (insertLen <= 0) {
            return;
        }

        if (this.isMemoryMode) {
            const tailCopy = this.data.subarray(insertOffset, oldEnd);

            this.data.set(tailCopy, insertOffset + insertLen);
        } else {
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
    };

    /**
     * 
     * @param {number} removeOffset 
     * @param {number} removeLen 
     * @param {boolean} consume 
     */
    async #shiftTailBackward(removeOffset: number, removeLen: number, consume: boolean = false) {
        if (removeLen <= 0) {
            return;
        }

        if (this.isMemoryMode) {
            const tailStart = removeOffset + removeLen;

            const tailCopy = this.data.subarray(tailStart, this.size);

            this.data.set(tailCopy, removeOffset);
        } else {
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
    };

    async #updateOffsets(newOffset: number, trueBytes: number, trueBits: number) {
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
    };

    async #readBytes(length: number, consume: boolean = true) {
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
        } else {
            this.#offset = offSave;
        }

        return data;
    };

    async #writeBytes(data: Buffer | Uint8Array | number[], consume: boolean = true) {
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
        } else {
            this.#offset = offSave;
        }
    };

    ///////////////////////////////
    // #region FILE MODE
    ///////////////////////////////

    /**
     * Enables writing and expanding (changes strict AND readOnly)
     * 
     * @param {boolean} mode - True to enable writing and expanding (changes strict AND readOnly)
     */
    async writeMode(mode: boolean = true) {
        if (mode) {
            this.strict = false;

            this.readOnly = false;

            this.fsMode = "r+";
        } else {
            this.strict = true;

            this.readOnly = true;

            this.fsMode = "r";
        }

        if (!this.isMemoryMode) {
            await this.close();

            await this.open();
        }
    };

    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     * 
     * Can be used to pass new data to a loaded class, shifting to memory mode.
     */
    async open(data?: DataType) {
        if (!this.isMemoryMode) {
            await this.#initFile();
        } else {
            if (this.isBufferOrUint8Array(data)) {
                this.data = data;
            }

            this.#initMemory();
        }
    };

    /**
     * commit data and removes it.
     */
    async close(): Promise<ReturnMapping<DataType>> {
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

            return data as ReturnMapping<DataType>;
        }

        if (this.isMemoryMode) {
            return this.data;
        }
    };

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
    };

    /**
     * Write data buffer back to file
     */
    async flush() {
        if (this.fd) {
            await this.commit();
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
    async renameFile(newFilePath: string) {
        if (this.isMemoryMode) {
            return;
        }

        try {
            await this.close();

            this.fd = null;

            this.#data = null;

            this.#view = null;

            await fs.rename(this.filePath, newFilePath);
        } catch (error) {
            throw new Error(error as string);
        }

        this.filePath = newFilePath;

        await this.open();
    };

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
        } catch (error) {
            throw new Error(error as string);
        }

        this.filePath = null;
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
            throw new TypeError("Endian must be big or little");
        }

        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new TypeError("Endian must be big or little");
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
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get sizeBits(): number {
        return this.bitSize;
    };

    /**
     * Size in bytes of the current buffer.
     * 
     *  @returns {number} size
     */
    get fileSize(): number {
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
    get lengthBits(): number {
        return this.bitSize;
    };

    /**
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get fileBitSize(): number {
        return this.bitSize;
    };

    /**
     * Size in bytes of the current buffer.
     * 
     *  @returns {number} size
     */
    get fileSizeBits(): number {
        return this.bitSize;
    };

    /**
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get lenBits(): number {
        return this.bitSize;
    };

    ///////////////////////////////
    // #region POSITION
    ///////////////////////////////

    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get offset(): number{
        return this.#offset;
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
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get tell(): number {
        return this.#offset;
    };

    /**
     * Get the current byte position.
     *
     * @returns {number} current byte position
     */
    get FTell(): number {
        return this.#offset;
    };

    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get saveOffset(): number {
        return this.#offset;
    };

    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get off(): number {
        return this.#offset;
    };

    /**
     * Get the current byte position;
     *
     * @returns {number} current byte position
     */
    get byteOffset(): number {
        return this.offset;
    };

    /**
     * Set the current byte position.
     * 
     * same as {@link goto}
     */
    async setOffset(value: number){
        await this.goto(value);
    };

    /**
     * Set the current byte position.
     * 
     * same as {@link goto}
     */
    async setByteOffset(value: number){
        await this.setOffset(value);
    };

    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get bitOffset(): number{
        return (this.#offset * 8) + this.#insetBit;
    };

    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offsetBits(): number {
        return this.bitOffset;
    }

    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get getBitOffset(): number {
        return this.bitOffset;
    };

    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get saveBitOffset(): number {
        return this.bitOffset;
    };

    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get FTellBits(): number {
        return this.bitOffset;
    };

    /**
     * Get the current bit position (0-7).
     *
     * @returns {number} current bit position
     */
    get tellBits(): number {
        return this.#insetBit;
    };

    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get offBits(): number {
        return this.bitOffset;
    };

    /**
     * Set the current bit position.
     */
    async setOffsetBits(value: number) {
        await this.goto(value - (value % 8), value % 8);
    };

    /**
     * Set the current bit position.
     */
    async setBitOffset(value: number) {
        await this.setOffsetBits(value);
    };

    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get insetBit(): number {
        return this.#insetBit;
    };

    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get saveInsetBit(): number {
        return this.insetBit;
    };

    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get inBit(): number {
        return this.insetBit;
    };

    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get bitTell(): number {
        return this.insetBit;
    };

    /**
     * Get the current bit position with in the current byte (0-7).
     *
     * @returns {number} current bit position
     */
    get getInsetBit(): number {
        return this.insetBit;
    };

    /**
     * Set the current bit position with in the current byte (0-7).
     */
    async setInsetBit(value: number){
        await this.goto(this.offset, value % 8);
    };

    /**
     * Size in bytes of current read position to the end of the data.
     * 
     * @returns {number} size
     */
    get remain(): number {
        return this.size - this.#offset;
    };

    /**
     * Size in bytes of current read position to the end of the data.
     * 
     * @returns {number} size
     */
    get remainBytes(): number {
        return this.remain; 
    };

    /**
     * Size in bytes of current read position to the end of the data.
     * 
     * @returns {number} size
     */
    get FEoF(): number {
        return this.remainBytes;
    };

    /**
     * Size in bits of current read position to the end of the data.
     * 
     * @returns {number} size
     */
    get remainBits(): number {
        return (this.size * 8) - this.bitOffset;
    };

    /**
     * Size in bits of current read position to the end of the data.
     * 
     * @returns {number} size
     */
    get FEoFBits(): number {
        return this.remainBits;
    };

    /**
     * Row line of the file (16 bytes per row).
     * 
     * @returns {number} size
     */
    get getLine(): number {
        return Math.abs(Math.floor((this.#offset - 1) / 16));
    };

    /**
     * Row line of the file (16 bytes per row).
     * 
     * @returns {number} size
     */
    get row(): number {
        return this.getLine;
    };

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

        const chunks: Buffer[] = [];

        for (let i = 0; i < this.#getNumChunks(); i++) {
            const chunk = await this.#ensureChunkLoaded(i) as Buffer;

            chunks.push(chunk);
        }

        if (this.growthIncrement != 0) {
            return Buffer.concat(chunks).subarray(0, this.#offset);
        }

        return Buffer.concat(chunks);
    };

    /**
     * Returns current data.
     * 
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     * 
     * Use ``.data`` instead if you want the full buffer data.
     */
    async getFullBuffer() {
        return await this.get();
    };

    /**
     * Returns current data.
     * 
     * Note: Will remove all data after current position if ``growthIncrement`` was set.
     */
    async return() {
        return await this.get();
    };

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
    };

    /**
     * Removes data.
     * 
     * Commits any changes to file when editing a file.
     */
    async done() {
        return await this.end();
    };

    /**
     * Removes data.
     * 
     * Commits any changes to file when editing a file.
     */
    async finished() {
        return await this.end();
    };

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
    async hexdump(options: hexdumpOptions = {}) {
        await this.open();

        const length: any = options?.length ?? 192;

        const startByte: any = options?.startByte ?? this.#offset;

        const endByte = Math.min(startByte + length, this.size);

        const newSize = endByte - startByte;

        if (startByte > this.size || endByte > this.size) {
            throw new RangeError("Hexdump amount is outside of data size: " + newSize + " of " + endByte);
        }

        const data = await this.#peekBytes(startByte, Math.min(endByte, this.size) - startByte);

        return _hexDump(data, options, startByte, endByte);
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
    async findBytes(bytesToFind: Uint8Array | Buffer | Array<number>) {
        if ( Array.isArray(bytesToFind)) {
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
    };

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
    async findString(string: string, bytesPerChar: number = 1) {
        const encoded = textEncode(string, bytesPerChar);

        return await this.findBytes(encoded);
    };

    #findNumber(data: ReturnMapping<DataType>, value: number, bits: number, unsigned: boolean, endian: endian = this.endian): number {
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
                } else {
                    let mask = ~(0xFF << read);

                    let readBits = (currentByte >> bitOffset) & mask;

                    currentValue |= readBits << i;
                }

                offsetInBits += read;

                i += read;
            }

            if (unsigned == true || bits <= 7) {
                currentValue = currentValue >>> 0;
            } else {
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
    async findByte(value: number, unsigned: boolean = true, endian: endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);

        return this.#findNumber(data, value, 8, unsigned, endian);
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
    async findShort(value: number, unsigned: boolean = true, endian: endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);

        return this.#findNumber(data, value, 16, unsigned, endian);
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
    async findInt(value: number, unsigned: boolean = true, endian: endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);

        return this.#findNumber(data, value, 32, unsigned, endian);
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
    async findInt64(value: BigValue, unsigned: boolean = true, endian: endian = this.endian) {
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
            } else {
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

        return -1;// number not found
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
    async findHalfFloat(value: number, endian: endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);

        for (let z = this.#offset; z <= (this.size - 2); z++) {
            var currentValue = 0;

            if (endian == "little") {
                currentValue = ((data[z + 1] & 0xFFFF) << 8) | (data[z] & 0xFFFF);
            } else {
                currentValue = ((data[z] & 0xFFFF) << 8) | (data[z + 1] & 0xFFFF);
            }

            const sign = (currentValue & 0x8000) >> 15;

            const exponent = (currentValue & 0x7C00) >> 10;

            const fraction = currentValue & 0x03FF;

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

            if (floatValue === value) {
                return z; // Found the number, return the index
            }
        }

        return -1; // number not found
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
    async findFloat(value: number, endian: endian = this.endian) {
        const data = await this.#peekBytes(0, this.size);

        for (let z = this.#offset; z <= (this.size - 4); z++) {
            var currentValue = 0;

            if (endian == "little") {
                currentValue = ((data[z + 3] & 0xFF) << 24) |
                    ((data[z + 2] & 0xFF) << 16) |
                    ((data[z + 1] & 0xFF) << 8) |
                    (data[z] & 0xFF);
            } else {
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

            if (floatValue === value) {
                return z; // Found the number, return the index
            }
        }

        return -1; // number not found
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
    async findDoubleFloat(value: number, endian: endian = this.endian) {
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
            } else {
                for (let i = 0; i < 8; i++) {
                    currentValue = (currentValue << BigInt(8)) | BigInt((data[z + i] & 0xFF));
                }
            }

            const sign = (currentValue & BigInt("9223372036854775808")) >> BigInt(63);

            const exponent = Number((currentValue & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;

            const fraction = Number(currentValue & BigInt("4503599627370495")) / Math.pow(2, 52);

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

            if (floatValue == value) {
                return z;
            }
        }

        return -1; // number not found
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
    async align(number: number) {
        const a = this.#offset % number;

        if (a) {
            await this.skip(number - a);
        }
    };

    /**
     * Reverse aligns current byte position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} number - Byte to align
     */
    async alignRev(number: number) {
        const a = this.#offset % number;

        if (a) {
            await this.skip(a * -1);
        }
    };

    /**
     * Offset current byte or bit position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    async skip(bytes: number = 0, bits: number = 0) {
        await this.open();

        var newOffset = ((bytes + this.#offset) + Math.ceil((this.#insetBit + bits) / 8));

        if (bits && bits < 0) {
            newOffset = Math.floor((((bytes + this.#offset) * 8) + this.#insetBit + bits) / 8);
        }

        await this.#updateOffsets(newOffset, bytes, bits);
    };

    /**
    * Offset current byte or bit position.
    * 
    * Note: Will extend array if strict mode is off and outside of max size.
    * 
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    async jump(bytes: number, bits?: number) {
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
    async FSeek(byte: number, bit?: number) {
        await this.goto(byte, bit)
    };

    /**
     * Offset current byte or bit position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    async seek(bytes: number, bits?: number) {
        await this.skip(bytes, bits)
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async goto(byte: number = 0, bit: number = 0) {
        await this.open();

        var newOffset = byte + Math.ceil(bit / 8);

        await this.#updateOffsets(newOffset, byte, bit);
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async pointer(byte: number, bit?: number) {
        await this.goto(byte, bit)
    };

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    async warp(byte: number, bit?: number) {
        await this.goto(byte, bit)
    };

    /**
     * Set byte and bit position to start of data.
     */
    rewind(): void {
        this.#offset = 0;

        this.#insetBit = 0;
    };

    /**
     * Set byte and bit position to start of data.
     */
    gotoStart() {
        this.rewind();
    };

    /**
     * Set current byte and bit position to end of data.
     */
    last() {
        this.#offset = this.size;

        this.#insetBit = 0;
    };

    /**
     * Set current byte and bit position to end of data.
     */
    gotoEnd() {
        this.last();
    };

    /**
     * Set byte and bit position to start of data.
     */
    EoF() {
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
     */
    async delete(startOffset: number = 0, endOffset: number = this.#offset, consume: boolean = false) {
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
                    return Buffer.alloc(0) as DataType;
                } else {
                    return new Uint8Array(0) as DataType;
                }
            } else {
                return Buffer.alloc(0) as DataType;
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

        return removed as DataType;
    };

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     */
    async clip() {
        return await this.delete(this.#offset, this.size, false);
    };

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     */
    async trim() {
        return await this.delete(this.#offset, this.size, false);
    };

    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     */
    async crop(length: number = 0, consume: boolean = false) {
        return await this.delete(this.#offset, this.#offset + length, consume);
    };

    /**
     * Deletes part of data from current position to supplied length, returns removed.
     * 
     * Note: Only works in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     */
    async drop(length: number = 0, consume: boolean = false) {
        return await this.delete(this.#offset, this.#offset + length, consume);
    };

    /**
     * Replaces data in data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {number} offset - Offset to add it at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default false)
     */
    async replace(data: DataType, offset: number = this.#offset, consume: boolean = false): Promise<ReturnMapping<DataType>> {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't replace data in readOnly mode!");
        }

        await this.open();

        if (this.isMemoryMode) {
            if (this.isBuffer(data)) {
                if (this.isUint8Array(this.data)) {
                    // source is Uint8Array
                    data = new Uint8Array(data) as DataType;
                }
            } else {
                // input is Uint8Array
                if (this.isBuffer(this.data)) {
                    // source is Buffer
                    data = Buffer.from(data as Uint8Array) as DataType;
                }
            }
        } else {
            if (!this.isBuffer(data)) {
                data = Buffer.from(data as Uint8Array) as  DataType;
            }
        }

        const insertLen = (data as Uint8Array | Buffer).length ?? 0;

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

        await this.#writeBytes(data as Uint8Array | Buffer, consume);

        const tailStartChunk = Math.floor((offset + insertLen) / this.windowSize);

        this.#invalidateFromChunk(tailStartChunk);

        if (!consume) {
            this.#offset = savedOffset;

            this.#insetBit = savedBitOffset;
        }
    };

    /**
     * Replaces data in data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    async overwrite(data: DataType, consume: boolean = false, offset: number = this.#offset) {
        return await this.replace(data, offset, consume);
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
     */
    async fill(startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false, fillValue?: number) {
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
                    return Buffer.alloc(0) as DataType;
                } else {
                    return new Uint8Array(0) as DataType;
                }
            } else {
                return Buffer.alloc(0) as DataType;
            }
        }

        if(endOffset > this.size && this.strict){
            throw new Error('Cannot extend data while in strict mode. Use unrestrict() to enable.');
        }

        const dataRemoved = await this.#peekBytes(startOffset, removeLen);

        if (fillValue != undefined) {
            var replacement: DataType;

            if (this.isMemoryMode) {
                if (this.isBuffer(this.data)) {
                    replacement = Buffer.alloc(removeLen, fillValue) as DataType;
                } else {
                    replacement = new Uint8Array(removeLen).fill(fillValue & 0xff) as DataType;
                }
            } else {
                replacement = Buffer.alloc(removeLen, fillValue) as DataType;
            }

            const offsetSaver = this.#offset;

            const offsetBitSaver = this.#insetBit;

            await this.#writeBytes(replacement as Uint8Array | Buffer, consume);

            if (!consume) {
                this.#offset = offsetSaver;

                this.#insetBit = offsetBitSaver;
            }

            return replacement;
        } else {
            await this.#shiftTailBackward(startOffset, removeLen, consume);

            const newSize = this.size - removeLen;

            await this.#setFileSize(newSize);

            const startChunk = this.#getChunkIndex(startOffset);

            this.#invalidateFromChunk(startChunk);
        }

        return dataRemoved as DataType;
    };

    /**
     * Returns part of data from current byte position to end of data unless supplied.
     * 
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     */
    async lift(startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false, fillValue?: number) {
        return await this.fill(startOffset, endOffset, consume, fillValue) as DataType;
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    async extract(length: number = 0, consume: boolean = false) {
        return await this.fill(this.#offset, this.#offset + length, consume);
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    async slice(length: number = 0, consume: boolean = false) {
        return await this.fill(this.#offset, this.#offset + length, consume);
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     */
    async wrap(length: number = 0, consume: boolean = false) {
        return await this.fill(this.#offset, this.#offset + length, consume);
    };

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
    async insert(data: DataType, offset: number = this.#offset, consume: boolean = true) {
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
                    data = new Uint8Array(data) as DataType;
                }
            } else {
                // input is Uint8Array
                if (this.isBuffer(this.data)) {
                    // source is Buffer
                    data = Buffer.from(data as Uint8Array) as DataType;
                }
            }
        } else {
            if (!this.isBuffer(data)) {
                data = Buffer.from(data as Uint8Array) as DataType;
            }
        }

        const insertLen = (data as Buffer | Uint8Array).length ?? 0;

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

        await this.#writeBytes(data as Buffer |Uint8Array, consume);

        const tailStartChunk = Math.floor((offset + insertLen) / this.windowSize);

        this.#invalidateFromChunk(tailStartChunk);

        if (!consume) {
            this.#offset = savedOffset;

            this.#insetBit = savedBitOffset;
        }
    };

    /**
     * Inserts data into data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    async place(data: DataType, offset: number = this.#offset, consume: boolean = true) {
        return await this.insert(data, offset, consume);
    };

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async unshift(data: DataType, consume: boolean = false) {
        return await this.insert(data, 0, consume);
    };

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async prepend(data: DataType, consume: boolean = false) {
        return await this.unshift(data, consume);
    };

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async push(data: DataType, consume: boolean = false) {
        return await this.insert(data, this.size, consume);
    };

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {DataType} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    async append(data: DataType, consume: boolean = false) {
        return await this.push(data, consume);
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
    async xor(xorKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        } else if (!(this.isBufferOrUint8Array(xorKey) || typeof xorKey == "number")) {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }

        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);

        _XOR(bytes, 0, bytes.length, xorKey);

        return await this.#writeBytesAt(startOffset, bytes);
    };

    /**
     * XOR data.
     * 
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async xorThis(xorKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof xorKey == "number") {
            length = length ?? 1;
        } else if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey)

            length = length ?? xorKey.length;
        } else if (this.isBufferOrUint8Array(xorKey)) {
            length = length ?? xorKey.length;
        } else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }

        return await this.xor(xorKey, this.#offset, this.#offset + length, consume);
    };

    /**
     * OR data
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async or(orKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        } else if (!(this.isBufferOrUint8Array(orKey) || typeof orKey == "number")) {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }

        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);

        _OR(bytes, 0, bytes.length, orKey);

        return await this.#writeBytesAt(startOffset, bytes);
    };

    /**
     * OR data.
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof orKey == "number") {
            length = length ?? 1;
        } else if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);

            length = length ?? orKey.length;
        } else if (this.isBufferOrUint8Array(orKey)) {
            length = length ?? orKey.length;
        } else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }

        return await this.or(orKey, this.#offset, this.#offset + length, consume || false);
    };

    /**
     * AND data.
     * 
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async and(andKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof andKey == "string") {
            andKey = new TextEncoder().encode(andKey);
        } else if (!(typeof andKey == "object" || typeof andKey == "number")) {
            throw new Error("AND must be a number, string, number array or Buffer");
        }

        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);

        _AND(bytes, 0, bytes.length, andKey);

        return await this.#writeBytesAt(startOffset, bytes);
    };

    /**
     * AND data.
     * 
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async andThis(andKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof andKey == "number") {
            length = length ?? 1;
        } else if (typeof andKey == "string") {
            andKey = new TextEncoder().encode(andKey);

            length = length ?? andKey.length;
        } else if (this.isBufferOrUint8Array(andKey)) {
            length = length ?? andKey.length;
        } else {
            throw new Error("AND must be a number, string, Uint8Array or Buffer");
        }

        return await this.and(andKey, this.#offset, this.#offset + length, consume);
    };

    /**
     * Add value to data.
     * 
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async add(addKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof addKey == "string") {
            addKey = new TextEncoder().encode(addKey);
        } else if (!(typeof addKey == "object" || typeof addKey == "number")) {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }

        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);

        _ADD(bytes, 0, bytes.length, addKey);

        return await this.#writeBytesAt(startOffset, bytes);
    };

    /**
     * Add value to data.
     * 
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async addThis(addKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof addKey == "number") {
            length = length ?? 1;
        } else if (typeof addKey == "string") {
            addKey = new TextEncoder().encode(addKey);

            length = length ?? addKey.length;
        } else if (this.isBufferOrUint8Array(addKey)) {
            length = length ?? addKey.length;
        } else {
            throw new Error("ADD must be a number, string, Uint8Array or Buffer");
        }

        return await this.add(addKey, this.#offset, this.#offset + length, consume);
    };

    /**
     * Not data.
     * 
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async not(startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);

        _NOT(bytes, 0, bytes.length);

        return await this.#writeBytesAt(startOffset, bytes);
    };

    /**
     * Not data.
     * 
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async notThis(length: number = 1, consume: boolean = false) {
        return await this.not(this.#offset, this.#offset + length, consume);
    };

    /**
     * Left shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async lShift(shiftKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
        } else if (!(typeof shiftKey == "object" || typeof shiftKey == "number")) {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }

        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);

        _LSHIFT(bytes, 0, bytes.length, shiftKey);

        return await this.#writeBytesAt(startOffset, bytes);
    };

    /**
     * Left shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async lShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof shiftKey == "number") {
            length = length ?? 1;
        } else if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);

            length = length ?? shiftKey.length;
        } else if (this.isBufferOrUint8Array(shiftKey)) {
            length = length ?? shiftKey.length;
        } else {
            throw new Error("Left shift must be a number, string, Uint8Array or Buffer");
        }

        return await this.lShift(shiftKey, this.#offset, this.#offset + length, consume);
    };

    /**
     * Right shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async rShift(shiftKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
        } else if (!(typeof shiftKey == "object" || typeof shiftKey == "number")) {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }

        const bytes = await this.#readBytes(Math.min(endOffset - startOffset, this.size - startOffset), consume);

        _RSHIFT(bytes, 0, bytes.length, shiftKey);

        return await this.#writeBytesAt(startOffset, bytes);
    };

    /**
     * Right shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    async rShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (typeof shiftKey == "number") {
            length = length ?? 1;
        } else if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);

            length = length ?? shiftKey.length;
        } else if (this.isBufferOrUint8Array(shiftKey)) {
            length = length ?? shiftKey.length;
        } else {
            throw new Error("right shift must be a number, string, Uint8Array or Buffer");
        }

        return await this.rShift(shiftKey, this.#offset, this.#offset + length, consume);
    };

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
    async readBit(bits?: number, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true) {
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
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     */
    async readUBitBE(bits: number) {
        return await this.readBit(bits, true, "big");
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     */
    async readUBitLE(bits: number) {
        return await this.readBit(bits, true, "little");
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     */
    async readBitBE(bits: number, unsigned?: boolean) {
        return await this.readBit(bits, unsigned, "big");
    };

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     */
    async readBitLE(bits: number, unsigned?: boolean) {
        return await this.readBit(bits, unsigned, "little");
    };

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
    async writeBit(value: number, bits: number, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true) {
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

        const temp = await this.#peekBytes(this.#offset, Math.ceil(endOffset - this.#offset)) as Buffer | Uint8Array;

        _wbit(temp, value, bits, this.#insetBit, endian, unsigned);

        await this.#writeBytesAt(this.#offset, temp);

        if (consume) {
            this.#offset += Math.floor((bits + this.#insetBit) / 8);

            this.#insetBit = (bits + this.#insetBit) % 8;
        }
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
    async writeUBitBE(value: number, bits: number) {
        return await this.writeBit(value, bits, true, "big");
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
    async writeUBitLE(value: number, bits: number) {
        return await this.writeBit(value, bits, true, "little");
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
    async writeBitBE(value: number, bits: number, unsigned?: boolean) {
        return await this.writeBit(value, bits, unsigned, "big");
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
    async writeBitLE(value: number, bits: number, unsigned?: boolean) {
        return await this.writeBit(value, bits, unsigned, "little");
    };

    ///////////////////////////////
    // #region BYTE READER
    ///////////////////////////////

    /**
     * Read byte.
     * 
     * @param {boolean} unsigned - if the value is unsigned or not
     * @param {boolean} consume - move offset after read
     */
    async readByte(unsigned: boolean = false, consume: boolean = true) {
        await this.open();

        const data = await this.#readBytes(1, consume);

        var value = data[0];

        if (unsigned) {
            value = value & 0xFF;
        } else {
            value = value > 127 ? value - 256 : value;
        }
        return value;
    }

    /**
     * Read unsigned byte.
     */
    async readUByte() {
        return await this.readByte(true);
    };

    /**
     * Read multiple bytes.
     * 
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {boolean} consume - move offset after read
     */
    async readBytes(amount: number, unsigned?: boolean, consume: boolean = true) {
        const array: number[] = [];

        for (let i = 0; i < amount; i++) {
            const value = await this.readByte(unsigned, consume);

            array.push(value);
        }

        return array;
    };

    /**
     * Read multiple unsigned bytes.
     * 
     * @param {number} amount - amount of bytes to read
     * @param {boolean} consume - move offset after read
     */
    async readUBytes(amount: number, consume: boolean = true) {
        return await this.readBytes(amount, true, consume);
    };

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    async writeByte(value: number, unsigned?: boolean, consume: boolean = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        this.open();

        await this.#writeBytes([numberSafe(value, 8, unsigned)], consume);
    };

    /**
     * Write multiple unsigned bytes.
     * 
     * @param {number[]} values - array of values as int
     */
    async writeUBytes(values: number[]) {
        for (let i = 0; i < values.length; i++) {
            await this.writeUByte(values[i]);
        }
    };

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    async writeUByte(value: number) {
        return await this.writeByte(value, true);
    };

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
    async readInt16(unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true) {
        await this.open();

        const buf = await this.#readBytes(2, consume);

        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

        var value: number;

        if (canInt16) {
            if (unsigned) {
                return view.getUint16(0, endian == "little");
            } else {
                return view.getInt16(0, endian == "little");
            }
        } else {
            return _rint16(buf, 0, endian, unsigned);
        }
    };

    /**
     * Read unsigned short.
     * 
     * @param {endian} endian - ``big`` or ``little``
     */
    async readUInt16(endian: endian = this.endian) {
        return await this.readInt16(true, endian);
    };

    /**
     * Read unsigned short in little endian.
     */
    async readUInt16LE() {
        return await this.readUInt16("little");
    };

    /**
     * Read unsigned short in big endian.
     */
    async readUInt16BE() {
        return await this.readUInt16("big");
    };

    /**
     * Read signed short in little endian.
     */
    async readInt16LE() {
        return await this.readInt16(false, "little");
    };

    /**
    * Read signed short in big endian.
    */
    async readInt16BE() {
        return await this.readInt16(false, "big");
    };

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeInt16(value: number, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (canInt16) {
            if (unsigned) {
                view2ByteDummy.setUint16(0, value, endian == "little");
            } else {
                view2ByteDummy.setInt16(0, value, endian == "little");
            }
        } else {
            _wint16(buff2ByteDummy, numberSafe(value, 16, unsigned), 0, endian, unsigned);
        }

        return await this.#writeBytes(buff2ByteDummy, consume);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt16(value: number, endian: endian = this.endian) {
        return await this.writeInt16(value, true, endian);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async writeUInt16BE(value: number) {
        return await this.writeUInt16(value, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async writeUInt16LE(value: number) {
        return await this.writeUInt16(value, "little");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async writeInt16LE(value: number) {
        return await this.writeInt16(value, false, "little");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async writeInt16BE(value: number) {
        return await this.writeInt16(value, false, "big");
    };

    ///////////////////////////////
    // #region HALF FLOAT
    ///////////////////////////////

    /**
     * Read 16 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readHalfFloat(endian: endian = this.endian, consume: boolean = true) {
        const buf = await this.#readBytes(2, consume);

        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

        if (canFloat16) {
            return view.getFloat16(0, endian == "little");
        } else {
            return _rhalffloat(buf, 0, endian);
        }
    };

    /**
     * Read 16 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readFloat16(endian: endian = this.endian, consume: boolean = true) {
        return await this.readHalfFloat(endian, consume);
    };

    /**
    * Read 16 bit float.
    */
    async readHalfFloatBE() {
        return await this.readHalfFloat("big");
    };

    /**
    * Read 16 bit float.
    */
    async readFloat16BE() {
        return await this.readHalfFloat("big");
    };

    /**
     * Read 16 bit float.
     */
    async readHalfFloatLE() {
        return await this.readHalfFloat("little");
    };

    /**
     * Read 16 bit float.
     */
    async readFloat16LE() {
        return await this.readHalfFloat("little");
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeHalfFloat(value: number, endian: endian = this.endian, consume: boolean = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (canFloat16) {
            view2ByteDummy.setFloat16(0, value, endian == "little");
        } else {
            _whalffloat(buff2ByteDummy, value, 0, endian);
        }

        return await this.#writeBytes(buff2ByteDummy, consume);
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeFloat16(value: number, endian: endian = this.endian, consume: boolean = true) {
        return await this.writeHalfFloat(value, endian, consume);
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeHalfFloatBE(value: number) {
        return await this.writeHalfFloat(value, "big");
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloat16BE(value: number) {
        return await this.writeHalfFloat(value, "big");
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeHalfFloatLE(value: number) {
        return await this.writeHalfFloat(value, "little");
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloat16LE(value: number) {
        return await this.writeHalfFloat(value, "little");
    };

    ///////////////////////////////
    // #region INT32 READER
    ///////////////////////////////

    /**
     * Read signed 32 bit integer.
     */
    async readInt32(unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true) {
        const buf = await this.#readBytes(4, consume);

        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

        if (canInt32) {
            if (unsigned) {
                return view.getUint32(0, endian == "little");
            } else {
                return view.getInt32(0, endian == "little");
            }
        } else {
            return _rint32(buf, 0, endian, unsigned);
        }
    };

    /**
     * Read signed 32 bit integer.
     */
    async readInt(endian?: endian) {
        return await this.readInt32(false, endian);
    }

    /**
     * Read signed 32 bit integer.
     */
    async readInt32BE() {
        return await this.readInt("big");
    };

    /**
     * Read signed 32 bit integer.
     */
    async readInt32LE() {
        return await this.readInt("little");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @param {endian} endian - ``big`` or ``little``
     */
    async readUInt32(endian?: endian) {
        return await this.readInt32(true, endian);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @param {endian} endian - ``big`` or ``little``
     */
    async readUInt(endian?: endian) {
        return await this.readInt32(true, endian);
    };

    /**
     * Read unsigned 32 bit integer.
     */
    async readUInt32BE() {
        return await this.readUInt("big");
    };

    /**
     * Read signed 32 bit integer.
     */
    async readUInt32LE() {
        return await this.readUInt("little");
    };

    /**
     * Write 32 bit integer.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeInt32(value: number, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (canInt32) {
            if (unsigned) {
                view4ByteDummy.setUint32(0, value, endian == "little");
            } else {
                view4ByteDummy.setInt32(0, value, endian == "little");
            }
        } else {
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
    async writeInt(value: number, endian?: endian) {
        return await this.writeInt32(value, false, endian);
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async writeInt32LE(value: number) {
        return await this.writeInt(value, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async writeInt32BE(value: number) {
        return await this.writeInt(value, "big");
    };

    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt(value: number, endian?: endian) {
        return await this.writeInt32(value, true, endian);
    };

    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt32(value: number, endian?: endian) {
        return await this.writeUInt(value, endian);
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async writeUInt32BE(value: number) {
        return await this.writeUInt32(value, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async writeUInt32LE(value: number) {
        return await this.writeUInt32(value, "little");
    };

    ///////////////////////////////
    // #region FLOAT32 READER
    ///////////////////////////////

    /**
     * Read 32 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readFloat(endian: endian = this.endian, consume: boolean = true) {
        const buf = await this.#readBytes(4, consume);

        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

        if (canFloat32) {
            return view.getFloat32(0, endian == "little");
        } else {
            return _rfloat(buf, 0, endian);
        }
    };

    /**
     * Read 32 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    async readFloat32(endian: endian = this.endian, consume: boolean = true) {
        return await this.readFloat(endian, consume);
    };

    /**
     * Read 32 bit float.
     */
    async readFloatBE() {
        return await this.readFloat("big");
    };

    /**
     * Read 32 bit float.
     */
    async readFloat32BE() {
        return await this.readFloat("big");
    };

    /**
     * Read 32 bit float.
     */
    async readFloatLE() {
        return await this.readFloat("little");
    };

    /**
     * Read 32 bit float.
     */
    async readFloat32LE() {
        return await this.readFloat("little");
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeFloat(value: number, endian: endian = this.endian, consume: boolean = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (canFloat32) {
            view4ByteDummy.setFloat32(0, value, endian == "little");
        } else {
            _wfloat(buff4ByteDummy, value, 0, endian);
        }

        return await this.#writeBytes(buff4ByteDummy, consume);
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloatLE(value: number) {
        return await this.writeFloat(value, "little");
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloat32LE(value: number) {
        return await this.writeFloat(value, "little");
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloat32BE(value: number) {
        return await this.writeFloat(value, "big");
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloatBE(value: number) {
        return await this.writeFloat(value, "big");
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
     * @param {boolean} consume - move offset after read
     */
    async readInt64(unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): Promise<ReturnBigValueMapping<alwaysBigInt>> {
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }

        const buf = await this.#readBytes(8, consume);

        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

        var value: bigint;

        if (canBigInt64) {
            if (unsigned) {
                value = view.getBigUint64(0, endian == "little");
            } else {
                value = view.getBigInt64(0, endian == "little");
            }
        } else {
            value = _rint64(buf, 0, endian, unsigned);
        }

        if (this.enforceBigInt == true || (typeof value == "bigint" && !isSafeInt64(value))) {
            return value as ReturnBigValueMapping<alwaysBigInt>;
        } else {
            if (isSafeInt64(value)) {
                return Number(value) as ReturnBigValueMapping<alwaysBigInt>;
            } else {
                throw new Error("Value is outside of number range and enforceBigInt is set to false. " + value);
            }
        }
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readUInt64(): Promise<ReturnBigValueMapping<alwaysBigInt>> {
        return await this.readInt64(true);
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readInt64BE(): Promise<ReturnBigValueMapping<alwaysBigInt>> {
        return await this.readInt64(false, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readInt64LE(): Promise<ReturnBigValueMapping<alwaysBigInt>> {
        return await this.readInt64(false, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readUInt64BE(): Promise<ReturnBigValueMapping<alwaysBigInt>> {
        return await this.readInt64(true, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async readUInt64LE(): Promise<ReturnBigValueMapping<alwaysBigInt>> {
        return await this.readInt64(true, "little");
    };

    /**
     * Write 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    async writeInt64(value: BigValue, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }
        
        if (!hasBigInt) {
            throw new Error("System doesn't support BigInt values.");
        }

        if (canBigInt64) {
            if (unsigned) {
                view8ByteDummy.setBigUint64(0, BigInt(value), endian == "little");
            } else {
                view8ByteDummy.setBigInt64(0, BigInt(value), endian == "little");
            }
        } else {
            _wint64(buff8ByteDummy, numberSafe(value, 64, unsigned), 0, endian, unsigned);
        }

        return await this.#writeBytes(buff8ByteDummy, consume);
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeUInt64(value: BigValue, endian: endian = this.endian) {
        return await this.writeInt64(value, true, endian);
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async writeInt64LE(value: BigValue) {
        return await this.writeInt64(value, false, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async writeInt64BE(value: BigValue) {
        return await this.writeInt64(value, false, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async writeUInt64LE(value: BigValue) {
        return await this.writeInt64(value, true, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async writeUInt64BE(value: BigValue) {
        return await this.writeInt64(value, true, "big");
    };

    ///////////////////////////////
    // #region FLOAT64 READER
    ///////////////////////////////

    /**
     * Read 64 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     */
    async readDoubleFloat(endian: endian = this.endian, consume: boolean = true) {
        const buf = await this.#readBytes(8, consume);

        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

        if (canFloat64) {
            return view.getFloat64(0, endian == "little");
        } else {
            if (!hasBigInt) {
                throw new Error("System doesn't support BigInt values.");
            }
            
            return _rdfloat(buf, 0, endian);
        }
    };

    /**
     * Read 64 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     */
    async readFloat64(endian: endian = this.endian) {
        return await this.readDoubleFloat(endian);
    };

    /**
     * Read 64 bit float.
     */
    async readDoubleFloatBE() {
        return await this.readDoubleFloat("big");
    };

    /**
     * Read 64 bit float.
     */
    async readFloat64BE() {
        return await this.readDoubleFloat("big");
    };

    /**
     * Read 64 bit float.
     */
    async readDoubleFloatLE() {
        return await this.readDoubleFloat("little");
    };

    /**
     * Read 64 bit float.
     */
    async readFloat64LE() {
        return await this.readDoubleFloat("little");
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeDoubleFloat(value: number, endian: endian = this.endian, consume: boolean = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        if (canFloat64) {
            view8ByteDummy.setFloat64(0, value, endian == "little");
        } else {
            _wdfloat(buff8ByteDummy, value, 0, endian);
        }

        return await this.#writeBytes(buff8ByteDummy, consume);
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    async writeFloat64(value: number, endian: endian = this.endian) {
        return await this.writeDoubleFloat(value, endian);
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeDoubleFloatBE(value: number) {
        return await this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloat64BE(value: number) {
        return await this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeDoubleFloatLE(value: number) {
        return await this.writeDoubleFloat(value, "little");
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     */
    async writeFloat64LE(value: number) {
        return await this.writeDoubleFloat(value, "little");
    };

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
    async readString(options: stringOptions = this.strDefaults, consume: boolean = true) {
        await this.open();

        var length: number = options.length;

        var stringType: stringOptions["stringType"] = options.stringType ?? 'utf-8';

        var terminateValue: number = options.terminateValue;

        var lengthReadSize: number = options.lengthReadSize ?? 1;

        var stripNull: boolean = options.stripNull ?? true;

        var endian: "little" | "big" = options.endian ?? this.endian;

        var encoding: stringOptions["encoding"] = options.encoding ?? 'utf-8';

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
        } else {
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
        } else {
            terminate = 0;
        }

        const saved_offset = this.#offset;

        const saved_bitoffset = this.#insetBit;

        const str = await _rstringAsync(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, this.readUByte.bind(this), this.readUInt16.bind(this), this.readUInt32.bind(this));

        if (!consume) {
            this.#offset = saved_offset;

            this.#insetBit = saved_bitoffset
        }

        return str;
    };

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
    async writeString(string: string, options: stringOptions = this.strDefaults, consume: boolean = true) {
        if (this.readOnly) {
            throw new Error("Can't write data in readOnly mode!");
        }

        await this.open();

        var length: number = options.length;

        var stringType: stringOptions["stringType"] = options.stringType ?? 'utf-8';

        var terminateValue: number = options.terminateValue;

        var lengthWriteSize: number = options.lengthWriteSize ?? 1;

        var endian: "little" | "big" = options.endian ?? this.endian;

        var maxLengthValue = length ?? string.length;

        var strUnits = string.length;

        var maxBytes: number;

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
                stringType == 'utf-32'
            ) {
                terminateValue = 0;
            }
        }

        var maxBytes = Math.min(strUnits, maxLengthValue);

        string = string.substring(0, maxBytes);

        var encodedString: Uint8Array<ArrayBufferLike>;

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
            default:
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
    };
};