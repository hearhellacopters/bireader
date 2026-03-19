import {
    BiOptions,
    hasBigInt,
    endian,
    stringOptions,
    normalizeBitOffset
} from "./common.js";
import { BiBaseAsync } from './core/BiBaseAsync.js';

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
export class BiReaderAsync<DataType extends Buffer | Uint8Array, hasBigInt extends boolean> extends BiBaseAsync<DataType, hasBigInt> {

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
    constructor(input: string | DataType, options: BiOptions = {}) {
        super(input, options.writeable ?? false);

        if (input == undefined) {
            throw new Error("Can not start BiReader without data.");
        }

        this.strict = true;

        this.enforceBigInt = (options?.enforceBigInt) as hasBigInt ?? hasBigInt as hasBigInt;

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
        } else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true or false");
            }
        }

        if (input == undefined) {
            throw new Error("Data or file path required");
        } else {
            if (typeof input == "string") {
                this.filePath = input;

                this.mode = "file";

                this.offset = options.byteOffset ?? 0;

                this.bitoffset = options.bitOffset ?? 0;
            } else if (this.isBufferOrUint8Array(input)) {
                this.data = input as DataType;

                this.mode = "memory";

                this.size = this.data.length;

                this.sizeB = this.data.length * 8;
            } else {
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
                    } else {
                        this.extendArray(this.offset - this.size);
                    }
                } else {
                    throw new Error(`Starting offset outside of size: ${this.offset} of ${this.size}`);
                }
            }
        }
    };

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
    static async create<DataType extends Buffer | Uint8Array, hasBigInt extends boolean>(input: string | DataType, options: BiOptions = {}): Promise<BiReaderAsync<DataType, hasBigInt>>{
        const instance = new BiReaderAsync<DataType, hasBigInt>(input, options);

        await instance.open();

        return instance;
    };

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
    async bit(bits: number, unsigned?: boolean, endian?: endian): Promise<number> {
        return await this.readBit(bits, unsigned, endian);
    };

    /**
     * Bit field reader. Unsigned read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {endian} endian - ``big`` or ``little``
     * @returns {Promise<number>}
     */
    async ubit(bits: number, endian?: endian): Promise<number> {
        return await this.readBit(bits, true, endian);
    };

    /**
     * Bit field reader. Unsigned big endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    async ubitbe(bits: number): Promise<number> {
        return await this.bit(bits, true, "big");
    };

    /**
     * Bit field reader. Big endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {Promise<number>}
     */
    async bitbe(bits: number, unsigned?: boolean): Promise<number> {
        return await this.bit(bits, unsigned, "big");
    };

    /**
     * Bit field reader. Unsigned little endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {Promise<number>}
     */
    async ubitle(bits: number): Promise<number> {
        return await this.bit(bits, true, "little");
    };

    /**
     * Bit field reader. Little endian read.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {Promise<number>}
     */
    async bitle(bits: number, unsigned?: boolean): Promise<number> {
        return await this.bit(bits, unsigned, "little");
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit1(): Promise<number> {
        return await this.bit(1);
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit1le(): Promise<number> {
        return await this.bit(1, undefined, "little");
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit1be(): Promise<number> {
        return await this.bit(1, undefined, "big");
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit1(): Promise<number> {
        return await this.bit(1, true);
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit1le(): Promise<number> {
        return await this.bit(1, true, "little");
    };

    /**
     * Bit field reader. Reads 1 bit.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit1be(): Promise<number> {
        return await this.bit(1, true, "big");
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit2(): Promise<number> {
        return await this.bit(2);
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit2le(): Promise<number> {
        return await this.bit(2, undefined, "little");
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit2be(): Promise<number> {
        return await this.bit(2, undefined, "big");
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit2(): Promise<number> {
        return await this.bit(2, true);
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit2le(): Promise<number> {
        return await this.bit(2, true, "little");
    };

    /**
     * Bit field reader. Reads 2 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit2be(): Promise<number> {
        return await this.bit(2, true, "big");
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit3(): Promise<number> {
        return await this.bit(3);
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit3le(): Promise<number> {
        return await this.bit(3, undefined, "little");
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit3be(): Promise<number> {
        return await this.bit(3, undefined, "big");
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit3(): Promise<number> {
        return await this.bit(3, true);
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit3le(): Promise<number> {
        return await this.bit(3, true, "little");
    };

    /**
     * Bit field reader. Reads 3 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit3be(): Promise<number> {
        return await this.bit(3, true, "big");
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit4(): Promise<number> {
        return await this.bit(4);
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit4le(): Promise<number> {
        return await this.bit(4, undefined, "little");
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit4be(): Promise<number> {
        return await this.bit(4, undefined, "big");
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit4(): Promise<number> {
        return await this.bit(4, true);
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit4le(): Promise<number> {
        return await this.bit(4, true, "little");
    };

    /**
     * Bit field reader. Reads 4 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit4be(): Promise<number> {
        return await this.bit(4, true, "big");
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit5(): Promise<number> {
        return await this.bit(5);
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit5le(): Promise<number> {
        return await this.bit(5, undefined, "little");
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit5be(): Promise<number> {
        return await this.bit(5, undefined, "big");
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit5(): Promise<number> {
        return await this.bit(5, true);
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit5le(): Promise<number> {
        return await this.bit(5, true, "little");
    };

    /**
     * Bit field reader. Reads 5 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit5be(): Promise<number> {
        return await this.bit(5, true, "big");
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit6(): Promise<number> {
        return await this.bit(6);
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit6le(): Promise<number> {
        return await this.bit(6, undefined, "little");
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit6be(): Promise<number> {
        return await this.bit(6, undefined, "big");
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit6(): Promise<number> {
        return await this.bit(6, true);
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit6le(): Promise<number> {
        return await this.bit(6, true, "little");
    };

    /**
     * Bit field reader. Reads 6 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit6be(): Promise<number> {
        return await this.bit(6, true, "big");
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit7(): Promise<number> {
        return await this.bit(7);
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit7le(): Promise<number> {
        return await this.bit(7, undefined, "little");
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit7be(): Promise<number> {
        return await this.bit(7, undefined, "big");
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit7(): Promise<number> {
        return await this.bit(7, true);
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit7le(): Promise<number> {
        return await this.bit(7, true, "little");
    };

    /**
     * Bit field reader. Reads 7 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit7be(): Promise<number> {
        return await this.bit(7, true, "big");
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit8(): Promise<number> {
        return await this.bit(8);
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit8le(): Promise<number> {
        return await this.bit(8, undefined, "little");
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit8be(): Promise<number> {
        return await this.bit(8, undefined, "big");
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit8(): Promise<number> {
        return await this.bit(8, true);
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit8le(): Promise<number> {
        return await this.bit(8, true, "little");
    };

    /**
     * Bit field reader. Reads 8 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit8be(): Promise<number> {
        return await this.bit(8, true, "big");
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit9(): Promise<number> {
        return await this.bit(9);
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit9le(): Promise<number> {
        return await this.bit(9, undefined, "little");
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit9be(): Promise<number> {
        return await this.bit(9, undefined, "big");
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit9(): Promise<number> {
        return await this.bit(9, true);
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit9le(): Promise<number> {
        return await this.bit(9, true, "little");
    };

    /**
     * Bit field reader. Reads 9 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit9be(): Promise<number> {
        return await this.bit(9, true, "big");
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit10(): Promise<number> {
        return await this.bit(10);
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit10le(): Promise<number> {
        return await this.bit(10, undefined, "little");
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit10be(): Promise<number> {
        return await this.bit(10, undefined, "big");
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit10(): Promise<number> {
        return await this.bit(10, true);
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit10le(): Promise<number> {
        return await this.bit(10, true, "little");
    };

    /**
     * Bit field reader. Reads 10 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit10be(): Promise<number> {
        return await this.bit(10, true, "big");
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit11(): Promise<number> {
        return await this.bit(11);
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit11le(): Promise<number> {
        return await this.bit(11, undefined, "little");
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit11be(): Promise<number> {
        return await this.bit(11, undefined, "big");
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit11(): Promise<number> {
        return await this.bit(11, true);
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit11le(): Promise<number> {
        return await this.bit(11, true, "little");
    };

    /**
     * Bit field reader. Reads 11 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit11be(): Promise<number> {
        return await this.bit(11, true, "big");
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit12(): Promise<number> {
        return await this.bit(12);
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit12le(): Promise<number> {
        return await this.bit(12, undefined, "little");
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit12be(): Promise<number> {
        return await this.bit(12, undefined, "big");
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit12(): Promise<number> {
        return await this.bit(12, true);
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit12le(): Promise<number> {
        return await this.bit(12, true, "little");
    };

    /**
     * Bit field reader. Reads 12 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit12be(): Promise<number> {
        return await this.bit(12, true, "big");
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit13(): Promise<number> {
        return await this.bit(13);
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit13le(): Promise<number> {
        return await this.bit(13, undefined, "little");
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit13be(): Promise<number> {
        return await this.bit(13, undefined, "big");
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit13(): Promise<number> {
        return await this.bit(13, true);
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit13le(): Promise<number> {
        return await this.bit(13, true, "little");
    };

    /**
     * Bit field reader. Reads 13 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit13be(): Promise<number> {
        return await this.bit(13, true, "big");
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit14(): Promise<number> {
        return await this.bit(14);
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit14le(): Promise<number> {
        return await this.bit(14, undefined, "little");
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit14be(): Promise<number> {
        return await this.bit(14, undefined, "big");
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit14(): Promise<number> {
        return await this.bit(14, true);
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit14le(): Promise<number> {
        return await this.bit(14, true, "little");
    };

    /**
     * Bit field reader. Reads 14 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit14be(): Promise<number> {
        return await this.bit(14, true, "big");
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit15(): Promise<number> {
        return await this.bit(15);
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {promise<number>}
     */
    async bit15le(): Promise<number> {
        return await this.bit(15, undefined, "little");
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {promise<number>}
     */
    async bit15be(): Promise<number> {
        return await this.bit(15, undefined, "big");
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit15(): Promise<number> {
        return await this.bit(15, true);
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit15le(): Promise<number> {
        return await this.bit(15, true, "little");
    };

    /**
     * Bit field reader. Reads 15 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit15be(): Promise<number> {
        return await this.bit(15, true, "big");
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit16(): Promise<number> {
        return await this.bit(16);
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit16le(): Promise<number> {
        return await this.bit(16, undefined, "little");
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit16be(): Promise<number> {
        return await this.bit(16, undefined, "big");
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit16(): Promise<number> {
        return await this.bit(16, true);
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit16le(): Promise<number> {
        return await this.bit(16, true, "little");
    };

    /**
     * Bit field reader. Reads 16 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit16be(): Promise<number> {
        return await this.bit(16, true, "big");
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit17(): Promise<number> {
        return await this.bit(17);
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit17le(): Promise<number> {
        return await this.bit(17, undefined, "little");
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit17be(): Promise<number> {
        return await this.bit(17, undefined, "big");
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit17(): Promise<number> {
        return await this.bit(17, true);
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit17le(): Promise<number> {
        return await this.bit(17, true, "little");
    };

    /**
     * Bit field reader. Reads 17 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit17be(): Promise<number> {
        return await this.bit(17, true, "big");
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit18(): Promise<number> {
        return await this.bit(18);
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit18le(): Promise<number> {
        return await this.bit(18, undefined, "little");
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit18be(): Promise<number> {
        return await this.bit(18, undefined, "big");
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit18(): Promise<number> {
        return await this.bit(18, true);
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit18le(): Promise<number> {
        return await this.bit(18, true, "little");
    };

    /**
     * Bit field reader. Reads 18 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit18be(): Promise<number> {
        return await this.bit(18, true, "big");
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit19(): Promise<number> {
        return await this.bit(19);
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit19le(): Promise<number> {
        return await this.bit(19, undefined, "little");
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit19be(): Promise<number> {
        return await this.bit(19, undefined, "big");
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit19(): Promise<number> {
        return await this.bit(19, true);
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit19le(): Promise<number> {
        return await this.bit(19, true, "little");
    };

    /**
     * Bit field reader. Reads 19 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit19be(): Promise<number> {
        return await this.bit(19, true, "big");
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit20(): Promise<number> {
        return await this.bit(20);
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit20le(): Promise<number> {
        return await this.bit(20, undefined, "little");
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit20be(): Promise<number> {
        return await this.bit(20, undefined, "big");
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit20(): Promise<number> {
        return await this.bit(20, true);
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit20le(): Promise<number> {
        return await this.bit(20, true, "little");
    };

    /**
     * Bit field reader. Reads 20 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit20be(): Promise<number> {
        return await this.bit(20, true, "big");
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit21(): Promise<number> {
        return await this.bit(21);
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit21le(): Promise<number> {
        return await this.bit(21, undefined, "little");
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit21be(): Promise<number> {
        return await this.bit(21, undefined, "big");
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit21(): Promise<number> {
        return await this.bit(21, true);
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit21le(): Promise<number> {
        return await this.bit(21, true, "little");
    };

    /**
     * Bit field reader. Reads 21 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit21be(): Promise<number> {
        return await this.bit(21, true, "big");
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit22(): Promise<number> {
        return await this.bit(22);
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit22le(): Promise<number> {
        return await this.bit(22, undefined, "little");
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit22be(): Promise<number> {
        return await this.bit(22, undefined, "big");
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit22(): Promise<number> {
        return await this.bit(22, true);
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit22le(): Promise<number> {
        return await this.bit(22, true, "little");
    };

    /**
     * Bit field reader. Reads 22 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit22be(): Promise<number> {
        return await this.bit(22, true, "big");
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit23(): Promise<number> {
        return await this.bit(23);
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit23le(): Promise<number> {
        return await this.bit(23, undefined, "little");
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit23be(): Promise<number> {
        return await this.bit(23, undefined, "big");
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit23(): Promise<number> {
        return await this.bit(23, true);
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit23le(): Promise<number> {
        return await this.bit(23, true, "little");
    };

    /**
     * Bit field reader. Reads 23 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit23be(): Promise<number> {
        return await this.bit(23, true, "big");
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit24(): Promise<number> {
        return await this.bit(24);
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit24le(): Promise<number> {
        return await this.bit(24, undefined, "little");
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit24be(): Promise<number> {
        return await this.bit(24, undefined, "big");
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit24(): Promise<number> {
        return await this.bit(24, true);
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit24le(): Promise<number> {
        return await this.bit(24, true, "little");
    };

    /**
     * Bit field reader. Reads 24 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit24be(): Promise<number> {
        return await this.bit(24, true, "big");
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit25(): Promise<number> {
        return await this.bit(25);
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit25le(): Promise<number> {
        return await this.bit(25, undefined, "little");
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit25be(): Promise<number> {
        return await this.bit(25, undefined, "big");
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit25(): Promise<number> {
        return await this.bit(25, true);
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit25le(): Promise<number> {
        return await this.bit(25, true, "little");
    };

    /**
     * Bit field reader. Reads 25 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit25be(): Promise<number> {
        return await this.bit(25, true, "big");
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit26(): Promise<number> {
        return await this.bit(26);
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit26le(): Promise<number> {
        return await this.bit(26, undefined, "little");
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit26be(): Promise<number> {
        return await this.bit(26, undefined, "big");
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit26(): Promise<number> {
        return await this.bit(26, true);
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit26le(): Promise<number> {
        return await this.bit(26, true, "little");
    };

    /**
     * Bit field reader. Reads 26 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit26be(): Promise<number> {
        return await this.bit(26, true, "big");
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit27(): Promise<number> {
        return await this.bit(27);
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit27le(): Promise<number> {
        return await this.bit(27, undefined, "little");
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit27be(): Promise<number> {
        return await this.bit(27, undefined, "big");
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit27(): Promise<number> {
        return await this.bit(27, true);
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit27le(): Promise<number> {
        return await this.bit(27, true, "little");
    };

    /**
     * Bit field reader. Reads 27 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit27be(): Promise<number> {
        return await this.bit(27, true, "big");
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit28(): Promise<number> {
        return await this.bit(28);
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit28le(): Promise<number> {
        return await this.bit(28, undefined, "little");
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit28be(): Promise<number> {
        return await this.bit(28, undefined, "big");
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit28(): Promise<number> {
        return await this.bit(28, true);
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit28le(): Promise<number> {
        return await this.bit(28, true, "little");
    };

    /**
     * Bit field reader. Reads 28 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit28be(): Promise<number> {
        return await this.bit(28, true, "big");
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit29(): Promise<number> {
        return await this.bit(29);
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit29le(): Promise<number> {
        return await this.bit(29, undefined, "little");
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit29be(): Promise<number> {
        return await this.bit(29, undefined, "big");
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit29(): Promise<number> {
        return await this.bit(29, true);
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit29le(): Promise<number> {
        return await this.bit(29, true, "little");
    };

    /**
     * Bit field reader. Reads 29 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit29be(): Promise<number> {
        return await this.bit(29, true, "big");
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit30(): Promise<number> {
        return await this.bit(30);
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit30le(): Promise<number> {
        return await this.bit(30, undefined, "little");
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit30be(): Promise<number> {
        return await this.bit(30, undefined, "big");
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit30(): Promise<number> {
        return await this.bit(30, true);
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit30le(): Promise<number> {
        return await this.bit(30, true, "little");
    };

    /**
     * Bit field reader. Reads 30 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit30be(): Promise<number> {
        return await this.bit(30, true, "big");
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit31(): Promise<number> {
        return await this.bit(31);
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit31le(): Promise<number> {
        return await this.bit(31, undefined, "little");
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit31be(): Promise<number> {
        return await this.bit(31, undefined, "big");
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit31(): Promise<number> {
        return await this.bit(31, true);
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit31le(): Promise<number> {
        return await this.bit(31, true, "little");
    };

    /**
     * Bit field reader. Reads 31 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit31be(): Promise<number> {
        return await this.bit(31, true, "big");
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit32(): Promise<number> {
        return await this.bit(32);
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit32le(): Promise<number> {
        return await this.bit(32, undefined, "little");
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async bit32be(): Promise<number> {
        return await this.bit(32, undefined, "big");
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit32(): Promise<number> {
        return await this.bit(32, true);
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit32le(): Promise<number> {
        return await this.bit(32, true, "little");
    };

    /**
     * Bit field reader. Reads 32 bits.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     * 
     * @returns {Promise<number>}
     */
    async ubit32be(): Promise<number> {
        return await this.bit(32, true, "big");
    };

    //
    // #region byte read
    //

    /**
     * Read byte.
     * 
     * @returns {Promise<number>}
     */
    async byte(): Promise<number> {
        return await this.readByte();
    };

    /**
     * Read byte.
     * 
     * @returns {Promise<number>}
     */
    async int8(): Promise<number> {
        return await this.readByte();
    };

    /**
     * Read unsigned byte.
     * 
     * @returns {Promise<number>}
     */
    async uint8(): Promise<number> {
        return await this.readByte(true);
    };

    /**
     * Read unsigned byte.
     * 
     * @returns {Promise<number>}
     */
    async ubyte(): Promise<number> {
        return await this.readByte(true);
    };

    //
    // #region short16 read
    //

    /**
     * Read short.
     * 
     * @returns {Promise<number>}
     */
    async int16(): Promise<number> {
        return await this.readInt16();
    };

    /**
     * Read short.
     * 
     * @returns {Promise<number>}
     */
    async short(): Promise<number> {
        return await this.readInt16();
    };

    /**
     * Read short.
     * 
     * @returns {Promise<number>}
     */
    async word(): Promise<number> {
        return await this.readInt16();
    };

    /**
     * Read unsigned short.
     * 
     * @returns {Promise<number>}
     */
    async uint16(): Promise<number> {
        return await this.readInt16(true);
    };

    /**
     * Read unsigned short.
     * 
     * @returns {Promise<number>}
     */
    async ushort(): Promise<number> {
        return this.readInt16(true);
    };

    /**
     * Read unsigned short.
     * 
     * @returns {Promise<number>}
     */
    async uword(): Promise<number> {
        return await this.readInt16(true);
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {Promise<number>}
     */
    async uint16le(): Promise<number> {
        return await this.readInt16(true, "little");
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {Promise<number>}
     */
    async ushortle(): Promise<number> {
        return await this.readInt16(true, "little");
    };

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {Promise<number>}
     */
    async uwordle(): Promise<number> {
        return await this.readInt16(true, "little");
    };

    /**
     * Read signed short in little endian.
     * 
     * @returns {Promise<number>}
     */
    async int16le(): Promise<number> {
        return await this.readInt16(false, "little");
    };

    /**
     * Read signed short in little endian.
     * 
     * @returns {Promise<number>}
     */
    async shortle(): Promise<number> {
        return await this.readInt16(false, "little");
    };

    /**
     * Read signed short in little endian.
     * 
     * @returns {Promise<number>}
     */
    async wordle(): Promise<number> {
        return await this.readInt16(false, "little");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {Promise<number>}
     */
    async uint16be(): Promise<number> {
        return await this.readInt16(true, "big");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {Promise<number>}
     */
    async ushortbe(): Promise<number> {
        return await this.readInt16(true, "big");
    };

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {Promise<number>}
     */
    async uwordbe(): Promise<number> {
        return await this.readInt16(true, "big");
    };

    /**
     * Read signed short in big endian.
     * 
     * @returns {Promise<number>}
     */
    async int16be(): Promise<number> {
        return await this.readInt16(false, "big");
    };

    /**
     * Read signed short in big endian.
     * 
     * @returns {Promise<number>}
     */
    async shortbe(): Promise<number> {
        return await this.readInt16(false, "big");
    };

    /**
     * Read signed short in big endian.
     * 
     * @returns {Promise<number>}
     */
    async wordbe(): Promise<number> {
        return await this.readInt16(false, "big");
    };

    //
    // #region half float read
    //

    /**
     * Read half float.
     * 
     * @returns {Promise<number>}
     */
    async halffloat(): Promise<number> {
        return await this.readHalfFloat();
    };

    /**
     * Read half float
     * 
     * @returns {Promise<number>}
     */
    async half(): Promise<number> {
        return await this.readHalfFloat();
    };

    /**
     * Read half float.
     * 
     * @returns {Promise<number>}
     */
    async halffloatbe(): Promise<number> {
        return await this.readHalfFloat("big");
    };

    /**
     * Read half float.
     * 
     * @returns {Promise<number>}
     */
    async halfbe(): Promise<number> {
        return await this.readHalfFloat("big");
    };

    /**
     * Read half float.
     * 
     * @returns {Promise<number>}
     */
    async halffloatle(): Promise<number> {
        return await this.readHalfFloat("little");
    };

    /**
     * Read half float.
     * 
     * @returns {Promise<number>}
     */
    async halfle(): Promise<number> {
        return await this.readHalfFloat("little");
    };

    //
    // #region int read
    //

    /**
     * Read 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async int(): Promise<number> {
        return await this.readInt32();
    };

    /**
     * Read 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async double(): Promise<number> {
        return await this.readInt32();
    };

    /**
     * Read 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async int32(): Promise<number> {
        return await this.readInt32();
    };

    /**
     * Read 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async long(): Promise<number> {
        return await this.readInt32();
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async uint(): Promise<number> {
        return await this.readInt32(true);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async udouble(): Promise<number> {
        return await this.readInt32(true);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async uint32(): Promise<number> {
        return await this.readInt32(true);
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async ulong(): Promise<number> {
        return await this.readInt32(true);
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async intbe(): Promise<number> {
        return await this.readInt32(false, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async doublebe(): Promise<number> {
        return await this.readInt32(false, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async int32be(): Promise<number> {
        return await this.readInt32(false, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async longbe(): Promise<number> {
        return await this.readInt32(false, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async uintbe(): Promise<number> {
        return await this.readInt32(true, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async udoublebe(): Promise<number> {
        return await this.readInt32(true, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async uint32be(): Promise<number> {
        return await this.readInt32(true, "big");
    };

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async ulongbe(): Promise<number> {
        return await this.readInt32(true, "big");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async intle(): Promise<number> {
        return await this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async doublele(): Promise<number> {
        return await this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async int32le(): Promise<number> {
        return await this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async longle(): Promise<number> {
        return await this.readInt32(false, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async uintle(): Promise<number> {
        return await this.readInt32(true, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async udoublele(): Promise<number> {
        return await this.readInt32(true, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async uint32le(): Promise<number> {
        return await this.readInt32(true, "little");
    };

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {Promise<number>}
     */
    async ulongle(): Promise<number> {
        return await this.readInt32(true, "little");
    };

    //
    // #region float read
    //

    /**
     * Read float.
     * 
     * @returns {Promise<number>}
     */
    async float(): Promise<number> {
        return await this.readFloat();
    };

    /**
     * Read float.
     * 
     * @returns {Promise<number>}
     */
    async floatbe(): Promise<number> {
        return await this.readFloat("big");
    };

    /**
     * Read float.
     * 
     * @returns {Promise<number>}
     */
    async floatle(): Promise<number> {
        return await this.readFloat("little");
    };

    //
    // #region int64 reader
    //

    /**
     * Read signed 64 bit integer
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async int64(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64();
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async bigint(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64();
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async quad(): Promise<hasBigInt extends true ? bigint : number>{
        return await this.readInt64();
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uint64(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true);
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async ubigint(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true);
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uquad(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true);
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async int64be(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(false, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async bigintbe(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(false, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async quadbe(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(false, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uint64be(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async ubigintbe(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true, "big");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uquadbe(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true, "big");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async int64le(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(false, "little");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async bigintle(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(false, "little");
    };

    /**
     * Read signed 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async quadle(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(false, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uint64le(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async ubigintle(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true, "little");
    };

    /**
     * Read unsigned 64 bit integer.
     * 
     * Note: If ``enforceBigInt`` was set to ``true``, this always returns a ``BigInt`` otherwise it will return a ``number`` if integer safe.
     */
    async uquadle(): Promise<hasBigInt extends true ? bigint : number> {
        return await this.readInt64(true, "little");
    };

    //
    // #region doublefloat reader
    //

    /**
     * Read double float.
     * 
     * @returns {Promise<number>}
     */
    async doublefloat(): Promise<number> {
        return await this.readDoubleFloat();
    };

    /**
     * Read double float.
     * 
     * @returns {Promise<number>}
     */
    async dfloat(): Promise<number> {
        return await this.readDoubleFloat();
    };

    /**
     * Read double float.
     * 
     * @returns {Promise<number>}
     */
    async dfloatbe(): Promise<number> {
        return await this.readDoubleFloat("big");
    };

    /**
     * Read double float.
     * 
     * @returns {Promise<number>}
     */
    async doublefloatbe(): Promise<number> {
        return await this.readDoubleFloat("big");
    };

    /**
     * Read double float.
     * 
     * @returns {Promise<number>}
     */
    async dfloatle(): Promise<number> {
        return await this.readDoubleFloat("little");
    };

    /**
     * Read double float.
     * 
     * @returns {Promise<number>}
     */
    async doublefloatle(): Promise<number> {
        return await this.readDoubleFloat("little");
    };

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
    async string(options?: stringOptions): Promise<string> {
        return await this.readString(options);
    };

    /**
    * Reads string using setting from .strSettings
    * 
    * Default is ``utf-8``
    * 
    * @returns {Promise<string>}
    */
    async str(): Promise<string> {
        return await this.readString(this.strSettings);
    };

    /**
    * Reads UTF-8 (C) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async utf8string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads UTF-8 (C) string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

    /**
    * Reads ANSI string.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull });
    };

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
    async utf16string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    };

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
    async unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string in little endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads UTF-16 (Unicode) string in big endian order.
    * 
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring1le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little" });
    };

    /**
    * Reads Pascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring1be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "big" });
    };

    /**
    * Reads Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring2le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little" });
    };

    /**
    * Reads Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring2be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "big" });
    };

    /**
    * Reads Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: endian });
    };

    /**
    * Reads Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring4le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little" });
    };

    /**
    * Reads Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async pstring4be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "big" });
    };

    /**
    * Reads Wide-Pascal string.
    * 
    * @param {stringOptions["lengthReadSize"]} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 1 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 1 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring1le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: "little", stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 1 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring1be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 2 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring2le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring2be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 4 byte length read.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    * 
    * @returns {Promise<string>}
    */
    async wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: endian, stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring4be(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull });
    };

    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order.
    * 
    * @param {stringOptions["stripNull"]} stripNull - removes 0x00 characters
    * 
    * @returns {Promise<string>}
    */
    async wpstring4le(stripNull?: stringOptions["stripNull"]): Promise<string> {
        return await this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull });
    };
};