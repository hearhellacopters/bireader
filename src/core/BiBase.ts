/**
 * @file BiReader / Writer base for working in sync Buffers or full file reads. Node and Browser.
 */

// #region Imports
var fs: typeof import("fs");

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
    canInt8,
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
    _rbyte,
    _wbyte,
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
    _rstring,
    _wstring,
} from '../common.js';

(async function () {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // We are in Node.js
        try {
            if (typeof require !== 'undefined') {
                if (typeof fs === "undefined") {
                    fs = require('fs');
                }
            } else {
                if (typeof fs === "undefined") {
                    fs = await import('fs');
                }
            }
        } catch (error) {
            console.error('Failed to load fs module:', error);
        }
    }
})();

function _fileExists(filePath: string) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);

        return true;  // File exists
    } catch (error) {
        // @ts-ignore
        return false;
    }
};

// #region Class

/**
 * Base class for BiReader and BiWriter
 */
export class BiBase<DataType, alwaysBigInt> {
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
     * Stops the buffer extending on reading or writing outside of current size
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
    #view: DataView;
    /**
     * When the data buffer needs to be extended while strict mode is ``false``, this will be the amount it extends.
     * 
     * Otherwise it extends just the amount of the next written value.
     * 
     * This can greatly speed up data writes when large files are being written.
     * 
     * NOTE: Using ``BiWriter.get`` or ``BiWriter.return`` will now remove all data after the current write position. Use ``BiWriter.data`` to get the full buffer instead.
     */
    growthIncrement: number = 1048576;
    /**
     * Open file description
     */
    fd: number = null;
    /**
     * Current file path
     */
    filePath: string = null;
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
    enforceBigInt: alwaysBigInt;
    /**
     * Not using a file reader.
     */
    isMemoryMode: boolean;
    /**
     * If data can not be written to the buffer.
     */
    readOnly: boolean;
    /**
     * Get the current buffer data.
     * 
     * @type {ReturnMapping<DataType>}
     */
    get data(): ReturnMapping<DataType> {
        return this.#data;
    };

    /**
     * Set the current buffer data.
     * 
     * @param {DataType} data
     */
    set data(data: DataType) {
        if (this.isBufferOrUint8Array(data)) {
            this.#data = data as ReturnMapping<DataType>;

            this.#updateView();

            this.size = this.#data.length;

            this.bitSize = this.size * 8;
        }
    };

    wasExpanded: boolean = false;

    /**
     * Get the DataView of current buffer data.
     */
    get view() {
        return this.#view;
    };

    constructor(input?: DataType, options: BiOptions<alwaysBigInt> = {}) {
        const {
            byteOffset,
            bitOffset,
            endianness,
            strict,
            growthIncrement,
            enforceBigInt,
            readOnly
        } = options;

        if (typeof strict != "boolean") {
            throw new Error("Strict mode must be true or false");
        }

        this.readOnly = !!readOnly;

        this.strict = readOnly ? true : strict;

        this.fsMode = this.readOnly ? 'r' : 'r+'

        this.enforceBigInt = !!enforceBigInt as alwaysBigInt;

        if (!hasBigInt) {
            this.enforceBigInt = false as alwaysBigInt;
        }

        this.growthIncrement = growthIncrement;

        if (typeof endianness != "string" || !(endianness == "big" || endianness == "little")) {
            throw new TypeError("Endian must be big or little");
        }

        this.endian = endianness;

        if (typeof input == "string") {
            if (typeof Buffer === 'undefined' || typeof fs === "undefined") {
                throw new Error("Can't load file outside of Node.");
            }

            this.filePath = input;

            this.isMemoryMode = false;
        } else if (this.isBufferOrUint8Array(input)) {
            this.data = input as DataType;

            this.isMemoryMode = true;

            this.size = this.#data.length;

            this.bitSize = this.#data.length * 8;
        } else {
            throw new Error("Write data must be Uint8Array or Buffer");
        }

        this.#offset = byteOffset ?? 0;

        if((bitOffset ?? 0) != 0){
            this.#offset = Math.floor(byteOffset / 8);

            this.#insetBit = byteOffset % 8;
        }
        
        this.#offset = ((Math.abs(this.#offset)) + Math.ceil((Math.abs(this.#insetBit)) / 8))
        // Adjust byte offset based on bit overflow
        this.#offset += Math.floor((Math.abs(this.#insetBit)) / 8);
        // Adjust bit offset
        this.#insetBit = Math.abs(normalizeBitOffset(this.#insetBit)) % 8;
        // Ensure bit offset stays between 0-7
        this.#insetBit = Math.min(Math.max(this.#insetBit, 0), 7);
        // Ensure offset doesn't go negative
        this.#offset = Math.max(this.#offset, 0);

        this.#confrimSize(this.#offset);
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
    }

    /**
     * Internal update size
     * 
     * run after setting data
     */
    #updateSize(): void {
        if (this.isMemoryMode) {
            this.size = this.#data.length;

            this.bitSize = this.size * 8;

            return;
        }

        if (typeof fs === "undefined") {
            throw new Error("Can't load file outside of Node.");
        }

        if (this.fd != null) {
            try {
                const stat = fs.fstatSync(this.fd);

                this.size = stat.size;

                this.bitSize = this.size * 8;
            } catch (error) {
                throw new Error(error as string);
            }
        }
    };

    /**
     * Internal update buffer.
     * 
     * Should come after updateSize
     */
    #updateBuffer() {
        if (!this.isMemoryMode) {
            if (this.fd == null) {
                try {
                    this.fd = fs.openSync(this.filePath, this.fsMode);
                } catch (error) {
                    throw new Error(error as string);
                }
            }

            const data = Buffer.alloc(this.size);

            try {
                const bytesRead = fs.readSync(this.fd, data, 0, data.length, 0);

                if (bytesRead != this.size) {
                    throw new Error("Didn't update file buffer size. Expecting " + this.size + " but got " + bytesRead);
                }
            } catch (error) {
                throw new Error(error as string);
            }

            this.data = data as DataType;

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
     * Calls to check if expanding the buffer needs to happen
     */
    #checkSize(writeBytes: number = 0, writeBit: number = 0, offset: number = this.#offset): number {
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
    };

    /**
     * Checks if input requires expanding the buffer
     */
    #confrimSize(neededSize: number) {
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
    };

    /**
     * Expends the buffer
     */
    #extendArray(targetSize: number): void {
        this.open();

        if (targetSize <= this.size) {
            return;
        }

        const toPadd = targetSize - this.size;

        if (this.isBuffer(this.#data)) {
            var paddbuffer = Buffer.alloc(toPadd);

            this.data = Buffer.concat([this.#data, paddbuffer]) as DataType;
        } else {
            const newBuf = new Uint8Array(this.size + toPadd);

            newBuf.set(this.#data);

            this.data = newBuf as DataType;
        }

        this.size = this.#data.length;

        this.bitSize = this.#data.length * 8;

        return;
    };

    ///////////////////////////////
    // #region FILE MODE
    ///////////////////////////////

    /**
     * Enables writing and expanding (changes strict AND readonly)
     * 
     * @param {boolean} mode - True to enable writing and expanding (changes strict AND readonly)
     */
    writeMode(mode: boolean = true) {
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
            this.close();

            this.open();
        }
    };

    /**
     * Opens the file in `file` mode. Must be run before reading or writing.
     * 
     * Can be used to pass new data to a loaded class, shifting to memory mode.
     */
    open(data?: ReturnMapping<DataType>) {
        if (this.isBufferOrUint8Array(data)) {
            this.close();

            this.filePath = null;

            this.fd == null;

            this.isMemoryMode = true;

            this.data = data as DataType;

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

        if (typeof fs === "undefined") {
            throw new Error("Can't load file outside of Node.");
        }

        if (!_fileExists(this.filePath)) {
            fs.writeFileSync(this.filePath, "");
        }

        try {
            this.fd = fs.openSync(this.filePath, this.fsMode);
        } catch (error) {
            throw new Error(error as string);
        }

        this.#updateSize();

        this.#updateBuffer();
    };

    /**
     * commit data and removes it.
     */
    close(): ReturnMapping<DataType> {
        if (this.isMemoryMode) {
            const data = this.#data;

            this.#data = null;

            this.#view = null;

            return data;
        }

        if (this.fd === null) {
            return; // Already closed / or not open
        }

        if (typeof fs === "undefined") {
            throw new Error("Can't load file outside of Node.");
        }

        this.commit();

        try {
            fs.closeSync(this.fd);
        } catch (error) {
            throw new Error(error as string);
        }

        this.fd = null;

        const data = this.#data;

        this.#data = null;

        this.#view = null;

        return data;
    };

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
            fs.writeSync(this.fd, this.#data, 0, this.#data.length);
        } catch (error) {
            throw new Error(error as string);
        }

        this.#updateSize();
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
        if (this.isMemoryMode) {
            return;
        }

        try {
            this.close();

            fs.renameSync(this.filePath, newFilePath);
        } catch (error) {
            throw new Error(error as string);
        }

        this.filePath = newFilePath;

        this.open();
    };

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

            fs.unlinkSync(this.filePath);
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
    get sizeBits(): number {
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
    get offset(): number {
        return this.#offset;
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
    get byteOffset(): number {
        return this.offset;
    };

    /**
     * Set the current byte position.
     * 
     * Same as {@link goto}
     */
    set offset(value: number) {
        this.goto(value);
    };

    /**
     * Set the current byte position.
     * 
     * Same as {@link goto}
     */
    set setOffset(value: number) {
        this.offset = value;
    };

    /**
     * Set the current byte position.
     * 
     * Same as {@link goto}
     */
    set setByteOffset(value: number) {
        this.offset = value;
    };

    /**
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get bitOffset(): number {
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
     * Get the current bit position.
     *
     * @returns {number} current bit position
     */
    get tellBits(): number {
        return this.bitOffset;
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
     * 
     * Same as {@link goto}
     */
    set bitOffset(value: number) {
        this.goto(value - (value % 8), value % 8);
    };

    /**
     * Set the current bit position.
     */
    set setOffsetBits(value: number) {
        this.bitOffset = value;
    };

    /**
     * Set the current bit position.
     */
    set setBitOffset(value: number) {
        this.setOffsetBits = value;
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
    get getInsetBit(): number {
        return this.insetBit;
    };

    /**
     * Set the current bit position with in the current byte (0-7).
     */
    set insetBit(value: number) {
        this.goto(this.offset, value % 8);
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
     * Set the current bit position with in the byte (0-7).
     */
    set setInsetBit(value: number) {
        this.insetBit = value;
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
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     * 
     * Use ``.data`` instead if you want the full buffer data.
     * 
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    get(): ReturnMapping<DataType> {
        if (this.growthIncrement != 0 && this.wasExpanded) {
            this.trim();
        }

        return this.#data;
    };

    /**
     * Returns current data.
     * 
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     * 
     * Use ``.data`` instead if you want the full buffer data.
     * 
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    getFullBuffer(): ReturnMapping<DataType> {
            return this.get();
    };

    /**
     * Returns current data.
     * 
     * Note: Will remove all data after current position if ``growthIncrement`` was set and you expanded data past the end once.
     * 
     * Use ``.data`` instead if you want the full buffer data.
     * 
     * @returns {ReturnMapping<DataType>} ``Buffer`` or ``Uint8Array``
     */
    return(): ReturnMapping<DataType> {
        return this.get();
    };

    /**
     * Returns and remove data.
     * 
     * Commits any changes to file when editing a file.
     */
    end(): ReturnMapping<DataType>  {
        return this.close();
    };

    /**
     * removes data.
     * 
     * Commits any changes to file when editing a file.
     */
    done(): ReturnMapping<DataType> {
        return this.end();
    };

    /**
     * removes data.
     * 
     * Commits any changes to file when editing a file.
     */
    finished(): ReturnMapping<DataType> {
        return this.end();
    };

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
    hexdump(options: hexdumpOptions = {}): void | string {
        const length: any = options?.length ?? 192;

        const startByte: any = options?.startByte ?? this.#offset;

        const endByte = Math.min(startByte + length, this.size);

        const newSize = endByte - startByte;

        if (startByte > this.size || endByte > this.size) {
            throw new RangeError("Hexdump amount is outside of data size: " + newSize + " of " + endByte);
        }

        return _hexDump(this.data, options, startByte, endByte);
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
    findBytes(bytesToFind: Uint8Array | Buffer | Array<number>): number {
        if (Array.isArray(bytesToFind)) {
            bytesToFind = new Uint8Array(bytesToFind);
        }

        this.open();

        if (this.isBuffer(this.data)) {
            var offset = (this.data as Buffer).subarray(this.#offset, this.size).indexOf(bytesToFind as Uint8Array | Buffer);

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
    findString(string: string, bytesPerChar: number = 1): number {
        const encoded = textEncode(string, bytesPerChar);

        return this.findBytes(encoded);
    };

    #findNumber(value: number, bits: number, unsigned: boolean, endian: endian = this.endian): number {
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
                } else {
                    let mask = ~(0xFF << read);

                    let readBits = (currentByte >> bitOffset) & mask;

                    value |= readBits << i;
                }

                offsetInBits += read;

                i += read;
            }

            if (unsigned || bits <= 7) {
                value = value >>> 0;
            } else {
                if (bits !== 32 && value & (1 << (bits - 1))) {
                    value |= -1 ^ ((1 << bits) - 1);
                }
            }

            if (value === value) {
                return z - this.#offset; // Found the byte, return the index from current
            }
        }

        return -1; // number not found
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
    findByte(value: number, unsigned: boolean = true, endian: endian = this.endian): number {
        return this.#findNumber(value, 8, unsigned, endian);
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
    findShort(value: number, unsigned: boolean = true, endian: endian = this.endian): number {
        return this.#findNumber(value, 16, unsigned, endian);
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
    findInt(value: number, unsigned: boolean = true, endian: endian = this.endian): number {
        return this.#findNumber(value, 32, unsigned, endian);
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
    findInt64(value: BigValue, unsigned: boolean = true, endian: endian = this.endian): number {
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
            } else {
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
    findHalfFloat(value: number, endian: endian = this.endian): number {
        this.#checkSize(2, 0, this.#offset);

        for (let z = this.#offset; z <= (this.size - 2); z++) {
            var startingValue = 0;

            if (endian == "little") {
                startingValue = ((this.data[z + 1] & 0xFFFF) << 8) | (this.data[z] & 0xFFFF);
            } else {
                startingValue = ((this.data[z] & 0xFFFF) << 8) | (this.data[z + 1] & 0xFFFF);
            }

            const sign = (startingValue & 0x8000) >> 15;

            const exponent = (startingValue & 0x7C00) >> 10;

            const fraction = startingValue & 0x03FF;

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
    findFloat(value: number, endian: endian = this.endian): number {
        this.#checkSize(4, 0, this.#offset);

        for (let z = this.#offset; z <= (this.size - 4); z++) {
            var startingValue = 0;

            if (endian == "little") {
                startingValue = ((this.data[z + 3] & 0xFF) << 24) |
                    ((this.data[z + 2] & 0xFF) << 16) |
                    ((this.data[z + 1] & 0xFF) << 8) |
                    (this.data[z] & 0xFF);
            } else {
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
    findDoubleFloat(value: number, endian: endian = this.endian): number {
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
            } else {
                for (let i = 0; i < 8; i++) {
                    startingValue = (startingValue << BigInt(8)) | BigInt((this.data[z + i] & 0xFF));
                }
            }

            const sign = (startingValue & BigInt("9223372036854775808")) >> BigInt(63);

            const exponent = Number((startingValue & BigInt("9218868437227405312")) >> BigInt(52)) - 1023;

            const fraction = Number(startingValue & BigInt("4503599627370495")) / Math.pow(2, 52);

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
    align(number: number): void {
        const a = this.#offset % number;

        if (a) {
            this.skip(number - a);
        }
    };

    /**
     * Reverse aligns current byte position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} number - Byte to align
     */
    alignRev(number: number): void {
        const a = this.#offset % number;

        if (a) {
            this.skip(a * -1);
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
    skip(bytes: number, bits?: number): void {
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
    goto(byte: number = 0, bit: number = 0): void {
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
        this.#offset = 0;

        this.#insetBit = 0;
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
        this.#offset = this.size;

        this.#insetBit = 0;
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
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    delete(startOffset: number = 0, endOffset: number = this.#offset, consume: boolean = false): DataType {
        if (this.readOnly || this.strict) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("\x1b[33m[Strict mode]\x1b[0m: Can not remove data in strict mode: endOffset " + endOffset + " of " + this.size);
        }

        this.open();

        startOffset = Math.abs(startOffset);

        this.#confrimSize(endOffset);

        const dataRemoved = this.data.subarray(startOffset, endOffset) as DataType;

        const part1 = this.data.subarray(0, startOffset);

        const part2 = this.data.subarray(endOffset, this.size);

        if (this.isBuffer(this.data)) {
            this.data = Buffer.concat([part1, part2]) as DataType;
        } else {
            const newBuf = new Uint8Array(part1.byteLength + part2.byteLength);

            newBuf.set(part1, 0);

            newBuf.set(part2, part1.byteLength);

            this.data = newBuf as DataType;
        }

        this.size = this.data.length;

        this.bitSize = this.data.length * 8;

        if (consume) {
            this.#offset = startOffset;

            this.#insetBit = 0;
        }

        return dataRemoved;
    };

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    clip(): DataType {
        return this.delete(this.#offset, this.size, false);
    };

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    trim(): DataType {
        return this.delete(this.#offset, this.size, false);
    };

    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    crop(length: number = 0, consume: boolean = false): DataType {
        return this.delete(this.#offset, this.#offset + length, consume);
    };

    /**
     * Deletes part of data from current position to supplied length, returns removed.
     * 
     * Note: Only works in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {DataType} Removed data as ``Buffer`` or ``Uint8Array``
     */
    drop(length: number = 0, consume: boolean = false): DataType {
        return this.delete(this.#offset, this.#offset + length, consume);
    };

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
    replace(data: ReturnMapping<DataType>, offset: number = this.#offset, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't replace data in readOnly mode!");
        }

        this.open();
        // input is Buffer
        if (this.isBuffer(data)) {
            if (this.isUint8Array(this.data)) {
                // source is Uint8Array
                data = new Uint8Array(data) as ReturnMapping<DataType>;
            }
        } else {
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
            this.data = Buffer.concat([part1, data, part2]) as DataType;
        } else {
            const newBuf = new Uint8Array(part1.byteLength + data.byteLength + part2.byteLength);

            newBuf.set(part1, 0);

            newBuf.set(data, part1.byteLength);

            newBuf.set(part2, part1.byteLength + data.byteLength);

            this.data = newBuf as DataType;
        }

        this.size = this.data.length;

        this.bitSize = this.data.length * 8;

        if (consume) {
            this.#offset = offset + data.length;

            this.#insetBit = 0;
        }
    };

    /**
     * Replaces data in data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {number} offset - Offset to add it at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default false)
     */
    overwrite(data: ReturnMapping<DataType>, offset: number = this.#offset, consume: boolean = false): void {
        return this.replace(data, offset, consume);
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
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    fill(startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false, fillValue?: number): DataType {
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
                    return Buffer.alloc(0) as DataType;
                } else {
                    return new Uint8Array(0) as DataType;
                }
            } else {
                return Buffer.alloc(0) as DataType;
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

                this.data = Buffer.concat([part1, buffReplacement, part2]) as DataType;
            } else {
                const newBuf = new Uint8Array(part1.byteLength + replacement.length + part2.byteLength);

                newBuf.set(part1, 0);

                newBuf.set(replacement, part1.byteLength);

                newBuf.set(part2, part1.byteLength + replacement.length);

                this.data = newBuf as DataType;
            }

            this.size = this.data.length;

            this.bitSize = this.data.length * 8;
        }

        if (consume) {
            this.#offset = endOffset;

            this.#insetBit = 0;
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
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    lift(startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false, fillValue?: number): DataType {
        return this.fill(startOffset, endOffset, consume, fillValue) as DataType;
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    extract(length: number = 0, consume: boolean = false): DataType {
        return this.fill(this.#offset, this.#offset + length, consume);
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    slice(length: number = 0, consume: boolean = false): DataType {
        return this.fill(this.#offset, this.#offset + length, consume);
    };

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length (default false)
     * @returns {DataType} Selected data as ``Uint8Array`` or ``Buffer``
     */
    wrap(length: number = 0, consume: boolean = false): DataType {
        return this.fill(this.#offset, this.#offset + length, consume);
    };

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
    insert(data: ReturnMapping<DataType>, offset: number = this.#offset, consume: boolean = true): void {
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
                data = new Uint8Array(data) as ReturnMapping<DataType>;
            }
        } else {
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
            this.data = Buffer.concat([part1, data, part2]) as DataType;
        } else {
            const newBuf = new Uint8Array(part1.byteLength + data.byteLength + part2.byteLength);

            newBuf.set(part1, 0);

            newBuf.set(data, part1.byteLength);

            newBuf.set(part2, part1.byteLength + data.byteLength);

            this.data = newBuf as DataType;
        }

        this.size = this.data.length;

        this.bitSize = this.data.length * 8;

        if (consume) {
            this.#offset = offset + data.length;

            this.#insetBit = 0;
        }
    };

    /**
     * Inserts data into data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {number} offset - Byte position to add at (defaults to current position)
     * @param {boolean} consume - Move current byte position to end of data (default true)
     */
    place(data: ReturnMapping<DataType>, offset: number = this.#offset, consume: boolean = true): void {
        return this.insert(data, offset, consume);
    };

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data: ReturnMapping<DataType>, consume: boolean = false): void {
        return this.insert(data, 0, consume);
    };

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data: ReturnMapping<DataType>, consume: boolean = false): void {
        return this.insert(data, 0, consume);
    };

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data: ReturnMapping<DataType>, consume: boolean = false): void {
        return this.insert(data, this.size, consume);
    };

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Errors on strict mode.
     * 
     * @param {ReturnMapping<DataType>} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data: ReturnMapping<DataType>, consume: boolean = false): void {
        return this.push(data, consume);
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
    xor(xorKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
        }

        if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        } else if (!(this.isBufferOrUint8Array(xorKey) || typeof xorKey == "number")) {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }

        this.open();

        this.#confrimSize(endOffset);

        const returnData = _XOR(this.data, startOffset, Math.min(endOffset, this.size), xorKey);

        if (consume) {
            this.#offset = returnData.offset;

            this.#insetBit = returnData.bitoffset;
        }
    };

    /**
     * XOR data.
     * 
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xorThis(xorKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
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

        return this.xor(xorKey, this.#offset, this.#offset + length, consume);
    };

    /**
     * OR data
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    or(orKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
        }

        if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        } else if (!(this.isBufferOrUint8Array(orKey) || typeof orKey == "number")) {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }

        this.open();

        this.#confrimSize(endOffset);

        const returnData = _OR(this.data, startOffset, Math.min(endOffset, this.size), orKey);

        if (consume) {
            this.#offset = returnData.offset;

            this.#insetBit = returnData.bitoffset;
        }
    };

    /**
     * OR data.
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
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

        return this.or(orKey, this.#offset, this.#offset + length, consume || false);
    };

    /**
     * AND data.
     * 
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    and(andKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
        }

        if (typeof andKey == "string") {
            andKey = new TextEncoder().encode(andKey);
        } else if (!(typeof andKey == "object" || typeof andKey == "number")) {
            throw new Error("AND must be a number, string, number array or Buffer");
        }

        this.open();

        this.#confrimSize(endOffset);

        const returnData = _AND(this.data, startOffset, Math.min(endOffset, this.size), andKey);

        if (consume) {
            this.#offset = returnData.offset;

            this.#insetBit = returnData.bitoffset;
        }
    };

    /**
     * AND data.
     * 
     * @param {number|string|Uint8Array|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
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

        return this.and(andKey, this.#offset, this.#offset + length, consume);
    };

    /**
     * Add value to data.
     * 
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    add(addKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
        }

        if (typeof addKey == "string") {
            addKey = new TextEncoder().encode(addKey);
        } else if (!(typeof addKey == "object" || typeof addKey == "number")) {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }

        this.open();

        this.#confrimSize(endOffset);

        const returnData = _ADD(this.data, startOffset, Math.min(endOffset, this.size), addKey);

        if (consume) {
            this.#offset = returnData.offset;

            this.#insetBit = returnData.bitoffset;
        }
    };

    /**
     * Add value to data.
     * 
     * @param {number|string|Uint8Array|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
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

        return this.add(addKey, this.#offset, this.#offset + length, consume);
    };

    /**
     * Not data.
     * 
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    not(startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false): void {
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
    };

    /**
     * Not data.
     * 
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length: number = 1, consume: boolean = false): void {
        return this.not(this.#offset, this.#offset + length, consume);
    };

    /**
     * Left shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShift(shiftKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
        }

        if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
        } else if (!(typeof shiftKey == "object" || typeof shiftKey == "number")) {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }

        this.open();

        this.#confrimSize(endOffset);

        const returnData = _LSHIFT(this.data, startOffset, Math.min(endOffset, this.size), shiftKey);

        if (consume) {
            this.#offset = returnData.offset;

            this.#insetBit = returnData.bitoffset;
        }
    };

    /**
     * Left shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
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

        return this.lShift(shiftKey, this.#offset, this.#offset + length, consume);
    };

    /**
     * Right shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShift(shiftKey: number | string | Uint8Array | Buffer, startOffset: number = this.#offset, endOffset: number = this.size, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
        }

        if (typeof shiftKey == "string") {
            shiftKey = new TextEncoder().encode(shiftKey);
        } else if (!(typeof shiftKey == "object" || typeof shiftKey == "number")) {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }

        this.open();

        this.#confrimSize(endOffset);

        const returnData = _RSHIFT(this.data, startOffset, Math.min(endOffset, this.size), shiftKey);

        if (consume) {
            this.#offset = returnData.offset;

            this.#insetBit = returnData.bitoffset;
        }
    };

    /**
     * Right shift data.
     * 
     * @param {number|string|Uint8Array|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey: number | string | Uint8Array | Buffer, length?: number, consume: boolean = false): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
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

        return this.rShift(shiftKey, this.#offset, this.#offset + length, consume);
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
     * @returns {number}
     */
    readBit(bits?: number, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): number {
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
    readBitBE(bits: number, unsigned?: boolean): number {
        return this.readBit(bits, unsigned, "big");
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
    writeBit(value: number, bits: number, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): void {
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
        return this.writeBit(value, bits, true, "big");
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
        return this.writeBit(value, bits, true, "little");
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
        return this.writeBit(value, bits, unsigned, "big");
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
        return this.writeBit(value, bits, unsigned, "little");
    };

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
    readByte(unsigned: boolean = false, consume: boolean = true): number {
        this.open();

        var trueByte = this.#offset;

        var trueBit = this.#insetBit;

        if (trueBit != 0) {
            trueByte += 1;
        }

        this.#checkSize(1, 0, trueByte);

        var value: number;

        if (canInt8) {
            value = unsigned ? this.view.getUint8(trueByte) : this.view.getInt8(trueByte);
        } else {
            value = _rbyte(this.data, trueByte, unsigned);
        }

        if (consume) {
            this.#offset += 1;

            this.#insetBit = 0;
        }

        return value;
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
     * Read multiple bytes.
     * 
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {boolean} consume - move offset after read
     * @returns {number[]}
     */
    readBytes(amount: number, unsigned?: boolean, consume: boolean = true): number[] {
        return Array.from({ length: amount }, () => this.readByte(unsigned, consume));
    };

    /**
     * Read multiple unsigned bytes.
     * 
     * @param {number} amount - amount of bytes to read
     * @param {boolean} consume - move offset after read
     * @returns {number[]}
     */
    readUBytes(amount: number, consume: boolean = true): number[] {
        return this.readBytes(amount, true, consume);
    };

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    writeByte(value: number, unsigned: boolean = false, consume: boolean = true): void {
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
            } else {
                this.view.setInt8(trueByte, value);
            }
        } else {
            _wbyte(this.data, numberSafe(value, 8, unsigned), trueByte, unsigned);
        }

        if (consume) {
            this.#offset += 1;

            this.#insetBit = 0;
        }

        return;
    };

    /**
     * Write multiple bytes.
     * 
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     * @param {boolean} consume - move offset after write
     */
    writeBytes(values: number[], unsigned?: boolean, consume: boolean = true): void {
        for (let i = 0; i < values.length; i++) {
            this.writeByte(values[i], unsigned, consume);
        }
    };

    /**
     * Write multiple unsigned bytes.
     * 
     * @param {number[]} values - array of values as int
     * @param {boolean} consume - move offset after write
     */
    writeUBytes(values: number[], consume: boolean = true): void {
        return this.writeBytes(values, true, consume);
    };

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    writeUByte(value: number): void {
        return this.writeByte(value, true);
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
     * @returns {number}
     */
    readInt16(unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): number {
        this.open();

        var trueByte = this.#offset;

        var trueBit = this.#insetBit;

        if (trueBit != 0) {
            trueByte += 1;
        }

        this.#checkSize(2, 0, trueByte);

        var value: number;

        if (canInt16) {
            if (unsigned) {
                value = this.view.getUint16(trueByte, endian == "little");
            } else {
                value = this.view.getInt16(trueByte, endian == "little");
            }
        } else {
            value = _rint16(this.data, trueByte, endian, unsigned);
        }

        if (consume) {
            this.#offset += 2;

            this.#insetBit = 0;
        }

        return value;
    };

    /**
     * Read unsigned short.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * 
     * @returns {number}
     */
    readUInt16(endian: endian = this.endian): number {
        return this.readInt16(true, endian);
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {number}
     */
    readUInt16LE(): number {
        return this.readUInt16("little");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {number}
     */
    readUInt16BE(): number {
        return this.readUInt16("big");
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
    * Read signed short in big endian.
    * 
    * @returns {number}
    */
    readInt16BE(): number {
        return this.readInt16(false, "big");
    };

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt16(value: number, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): void {
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
            } else {
                this.view.setInt16(trueByte, value, endian == "little");
            }
        } else {
            _wint16(this.data, numberSafe(value, 16, unsigned), trueByte, endian, unsigned);
        }

        if (consume) {
            this.#offset += 2;

            this.#insetBit = 0;
        }

        return;
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt16(value: number, endian: endian = this.endian): void {
        return this.writeInt16(value, true, endian);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    writeUInt16BE(value: number): void {
        return this.writeUInt16(value, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    writeUInt16LE(value: number): void {
        return this.writeUInt16(value, "little");
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
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    writeInt16BE(value: number): void {
        return this.writeInt16(value, false, "big");
    };

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
    readHalfFloat(endian: endian = this.endian, consume: boolean = true): number {
        this.open();

        var trueByte = this.#offset;

        var trueBit = this.#insetBit;

        if (trueBit != 0) {
            trueByte += 1;
        }

        this.#checkSize(2, 0, trueByte);

        var value: number;

        if (canFloat16) {
            value = this.view.getFloat16(trueByte, endian == "little");
        } else {
            value = _rhalffloat(this.data, trueByte, endian);
        }

        if (consume) {
            this.#offset += 2;

            this.#insetBit = 0;
        }

        return value;
    };

    /**
     * Read 16 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readFloat16(endian: endian = this.endian, consume: boolean = true): number {
        return this.readHalfFloat(endian, consume);
    };

    /**
    * Read 16 bit float.
    * 
    * @returns {number}
    */
    readHalfFloatBE(): number {
        return this.readHalfFloat("big");
    };

    /**
    * Read 16 bit float.
    * 
    * @returns {number}
    */
    readFloat16BE(): number {
        return this.readHalfFloat("big");
    };

    /**
     * Read 16 bit float.
     * 
     * @returns {number}
     */
    readHalfFloatLE(): number {
        return this.readHalfFloat("little");
    };

    /**
     * Read 16 bit float.
     * 
     * @returns {number}
     */
    readFloat16LE(): number {
        return this.readHalfFloat("little");
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeHalfFloat(value: number, endian: endian = this.endian, consume: boolean = true): void {
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
        } else {
            _whalffloat(this.data, value, trueByte, endian);
        }

        if (consume) {
            this.#offset += 2;

            this.#insetBit = 0;
        }

        return;
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeFloat16(value: number, endian: endian = this.endian, consume: boolean = true): void {
        return this.writeHalfFloat(value, endian, consume);
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeHalfFloatBE(value: number): void {
        return this.writeHalfFloat(value, "big");
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeFloat16BE(value: number): void {
        return this.writeHalfFloat(value, "big");
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeHalfFloatLE(value: number): void {
        return this.writeHalfFloat(value, "little");
    };

    /**
     * Writes 16 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeFloat16LE(value: number): void {
        return this.writeHalfFloat(value, "little");
    };

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
    readInt32(unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): number {
        this.open();

        var trueByte = this.#offset;

        var trueBit = this.#insetBit;

        if (trueBit != 0) {
            trueByte += 1;
        }

        this.#checkSize(4, 0, trueByte);

        var value: number;

        if (canInt32) {
            if (unsigned) {
                value = this.view.getUint32(trueByte, endian == "little");
            } else {
                value = this.view.getInt32(trueByte, endian == "little");
            }
        } else {
            value = _rint32(this.data, trueByte, endian, unsigned);
        }

        if (consume) {
            this.#offset += 4;

            this.#insetBit = 0;
        }

        return value;
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt(endian: endian = this.endian): number {
        return this.readInt32(false, endian);
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readInt32BE(): number {
        return this.readInt("big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readInt32LE(): number {
        return this.readInt("little");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readUInt32(endian: endian = this.endian): number {
        return this.readInt32(true, endian);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readUInt(endian: endian = this.endian): number {
        return this.readInt32(true, endian);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    readUInt32BE(): number {
        return this.readUInt("big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readUInt32LE(): number {
        return this.readUInt("little");
    };

    /**
     * Write 32 bit integer.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt32(value: number, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): void {
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
            } else {
                this.view.setInt32(trueByte, value, endian == "little");
            }
        } else {
            _wint32(this.data, numberSafe(value, 32, unsigned), trueByte, endian, unsigned);
        }

        if (consume) {
            this.#offset += 4;

            this.#insetBit = 0;
        }

        return;
    };

    /**
     * Write signed 32 bit integer.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeInt(value: number, endian: endian = this.endian): void {
        return this.writeInt32(value, false, endian);
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    writeInt32LE(value: number): void {
        return this.writeInt(value, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    writeInt32BE(value: number): void {
        return this.writeInt(value, "big");
    };

    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt(value: number, endian: endian = this.endian): void {
        return this.writeInt32(value, true, endian);
    };

    /**
     * Write unsigned 32 bit integer.
     *
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt32(value: number, endian: endian = this.endian): void {
        return this.writeUInt(value, endian);
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    writeUInt32BE(value: number): void {
        return this.writeUInt32(value, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    writeUInt32LE(value: number): void {
        return this.writeUInt32(value, "little");
    };

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
    readFloat(endian: endian = this.endian, consume: boolean = true): number {
        this.open();

        var trueByte = this.#offset;

        var trueBit = this.#insetBit;

        if (trueBit != 0) {
            trueByte += 1;
        }

        this.#checkSize(4, 0, trueByte);

        var value: number;

        if (canFloat32) {
            value = this.view.getFloat32(trueByte, endian == "little");
        } else {
            value = _rfloat(this.data, trueByte, endian);
        }

        if (consume) {
            this.#offset += 4;

            this.#insetBit = 0;
        }

        return value;
    };

    /**
     * Read 32 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     * @returns {number}
     */
    readFloat32(endian: endian = this.endian, consume: boolean = true): number {
        return this.readFloat(endian, consume);
    };

    /**
     * Read 32 bit float.
     * 
     * @returns {number}
     */
    readFloatBE(): number {
        return this.readFloat("big");
    };

    /**
     * Read 32 bit float.
     * 
     * @returns {number}
     */
    readFloat32BE(): number {
        return this.readFloat("big");
    };

    /**
     * Read 32 bit float.
     * 
     * @returns {number}
     */
    readFloatLE(): number {
        return this.readFloat("little");
    };

    /**
     * Read 32 bit float.
     * 
     * @returns {number}
     */
    readFloat32LE(): number {
        return this.readFloat("little");
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeFloat(value: number, endian: endian = this.endian, consume: boolean = true): void {
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
        } else {
            _wfloat(this.data, value, trueByte, endian);
        }

        if (consume) {
            this.#offset += 4;

            this.#insetBit = 0;
        }

        return;
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeFloatLE(value: number): void {
        return this.writeFloat(value, "little");
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeFloat32LE(value: number): void {
        return this.writeFloat(value, "little");
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeFloat32BE(value: number): void {
        return this.writeFloat(value, "big");
    };

    /**
     * Write 32 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeFloatBE(value: number): void {
        return this.writeFloat(value, "big");
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
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after read
     */
    readInt64(unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): ReturnBigValueMapping<alwaysBigInt> {
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

        var value: bigint;

        if (canBigInt64) {
            if (unsigned) {
                value = this.view.getBigUint64(trueByte, endian == "little");
            } else {
                value = this.view.getBigInt64(trueByte, endian == "little");
            }
        } else {
            value = _rint64(this.data, trueByte, endian, unsigned);
        }

        if (consume) {
            this.#offset += 8;

            this.#insetBit = 0;
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
     * 
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64(): ReturnBigValueMapping<alwaysBigInt> {
        return this.readInt64(true);
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readInt64BE(): ReturnBigValueMapping<alwaysBigInt> {
        return this.readInt64(false, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readInt64LE(): ReturnBigValueMapping<alwaysBigInt> {
        return this.readInt64(false, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64BE(): ReturnBigValueMapping<alwaysBigInt> {
        return this.readInt64(true, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     * 
     * @returns {ReturnBigValueMapping<alwaysBigInt>}
     */
    readUInt64LE(): ReturnBigValueMapping<alwaysBigInt> {
        return this.readInt64(true, "little");
    };

    /**
     * Write 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {endian} endian - ``big`` or ``little``
     * @param {boolean} consume - move offset after write
     */
    writeInt64(value: BigValue, unsigned: boolean = false, endian: endian = this.endian, consume: boolean = true): void {
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
            } else {
                this.view.setBigUint64(trueByte, BigInt(value), endian == "little");
            }
        } else {
            _wint64(this.data, numberSafe(value, 64, unsigned), trueByte, endian, unsigned);
        }

        if (consume) {
            this.#offset += 8;

            this.#insetBit = 0;
        }

        return;
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeUInt64(value: BigValue, endian: endian = this.endian) {
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
    writeUInt64LE(value: BigValue): void {
        return this.writeInt64(value, true, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    writeUInt64BE(value: BigValue): void {
        return this.writeInt64(value, true, "big");
    };

    ///////////////////////////////
    // #region FLOAT64 READER
    ///////////////////////////////

    /**
     * Read 64 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian: endian = this.endian, consume: boolean = true): number {
        this.open();

        var trueByte = this.#offset;

        var trueBit = this.#insetBit;

        if (trueBit != 0) {
            trueByte += 1;
        }

        this.#checkSize(8, 0, trueByte);

        var value: number;

        if (canFloat64) {
            value = this.view.getFloat64(trueByte, endian == "little");
        } else {
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
    };

    /**
     * Read 64 bit float.
     * 
     * @param {endian} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat64(endian: endian = this.endian): number {
        return this.readDoubleFloat(endian);
    };

    /**
     * Read 64 bit float.
     * 
     * @returns {number}
     */
    readDoubleFloatBE(): number {
        return this.readDoubleFloat("big");
    };

    /**
     * Read 64 bit float.
     * 
     * @returns {number}
     */
    readFloat64BE(): number {
        return this.readDoubleFloat("big");
    };

    /**
     * Read 64 bit float.
     * 
     * @returns {number}
     */
    readDoubleFloatLE(): number {
        return this.readDoubleFloat("little");
    };

    /**
     * Read 64 bit float.
     * 
     * @returns {number}
     */
    readFloat64LE(): number {
        return this.readDoubleFloat("little");
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value: number, endian: endian = this.endian, consume: boolean = true): void {
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
        } else {
            _wdfloat(this.data, value, trueByte, endian);
        }

        if (consume) {
            this.#offset += 8;

            this.#insetBit = 0;
        }

        return;
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     * @param {endian} endian - ``big`` or ``little``
     */
    writeFloat64(value: number, endian: endian = this.endian): void {
        return this.writeDoubleFloat(value, endian);
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeDoubleFloatBE(value: number): void {
        return this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeFloat64BE(value: number): void {
        return this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeDoubleFloatLE(value: number): void {
        return this.writeDoubleFloat(value, "little");
    };

    /**
     * Writes 64 bit float.
     * 
     * @param {number} value - value as int 
     */
    writeFloat64LE(value: number): void {
        return this.writeDoubleFloat(value, "little");
    };

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
    readString(options: stringOptions = this.strDefaults, consume: boolean = true): string {
        this.open();

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

            this.#checkSize(readLengthinBytes);
        } else {
            readLengthinBytes = this.data.length - this.#offset;
        }

        if (terminateValue != undefined && typeof terminateValue == "number") {
            terminate = terminateValue & 0xFF;
        } else {
            terminate = 0;
        }

        const saved_offset = this.#offset;

        const saved_bitoffset = this.#insetBit;

        const str = _rstring(stringType, lengthReadSize, readLengthinBytes, terminate, stripNull, encoding, endian, this.readUByte.bind(this), this.readUInt16.bind(this), this.readUInt32.bind(this));

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
    writeString(string: string, options: stringOptions = this.strDefaults, consume: boolean = true): void {
        if (this.readOnly) {
            this.errorDump ? console.log("\x1b[31m[Error]\x1b[0m hexdump:\n" + this.hexdump({ returnString: true })) : "";

            throw new Error("Can't write data in readonly mode!");
        }

        this.open();

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

        this.#checkSize(totalLength, 0, this.#offset);

        const savedOffset = this.#offset;

        const savedBitOffset = this.#insetBit;

        _wstring(encodedString, stringType, endian, terminateValue, lengthWriteSize, this.writeUByte.bind(this), this.writeUInt16.bind(this), this.writeUInt32.bind(this));

        if (!consume) {
            this.#offset = savedOffset;

            this.#insetBit = savedBitOffset;
        }

        return;
    };
};