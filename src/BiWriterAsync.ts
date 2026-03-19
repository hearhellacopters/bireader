import {
    BigValue,
    hasBigInt,
    BiOptions,
    endian,
    stringOptions,
    normalizeBitOffset
} from "./common.js";
import { BiBaseAsync } from './core/BiBaseAsync.js';

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
export class BiWriterAsync<DataType extends Buffer | Uint8Array, hasBigInt extends boolean> extends BiBaseAsync<DataType, hasBigInt> {

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
    constructor(input?: string | DataType, options: BiOptions = {}) {
        super(input, options.writeable ?? true);

        this.strict = false;

        this.enforceBigInt = (options?.enforceBigInt) as hasBigInt ?? hasBigInt as hasBigInt;

        if (options.extendBufferSize != undefined &&
            options.extendBufferSize != 0) {
            this.extendBufferSize = options.extendBufferSize;
        }

        if (input == undefined) {
            input = new Uint8Array(this.extendBufferSize) as DataType;

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
        } else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true or false.");
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
            this.offset = ((Math.abs(options.byteOffset || 0)) + Math.ceil((Math.abs(options.bitOffset || 0)) / 8))
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
    static async create<DataType extends Buffer | Uint8Array, hasBigInt extends boolean>(input: string | DataType, options: BiOptions = {}): Promise<BiWriterAsync<DataType, hasBigInt>>{
        const instance = new BiWriterAsync<DataType, hasBigInt>(input, options);

        await instance.open();

        return instance;
    };

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
    async bit(value: number, bits: number, unsigned?: boolean, endian?: endian) {
        return await this.writeBit(value, bits, unsigned, endian);
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @param {endian} endian - ``big`` or ``little``
     */
    async ubit(value: number, bits: number, endian?: endian) {
        return await this.writeBit(value, bits, true, endian);
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     */
    async bitbe(value: number, bits: number, unsigned?: boolean) {
        return await this.bit(value, bits, unsigned, "big");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     */
    async ubitbe(value: number, bits: number) {
        return await this.bit(value, bits, true, "big");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     */
    async ubitle(value: number, bits: number) {
        return await this.bit(value, bits, true, "little");
    };

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     */
    async bitle(value: number, bits: number, unsigned?: boolean) {
        return await this.bit(value, bits, unsigned, "little");
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit1(value: number) {
        await this.bit(value, 1);
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit1le(value: number) {
        await this.bit(value, 1, undefined, "little");
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit1be(value: number) {
        await this.bit(value, 1, undefined, "big");
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit1(value: number) {
        await this.bit(value, 1, true);
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit1le(value: number) {
        await this.bit(value, 1, true, "little");;
    };

    /**
     * Bit field writer. Writes 1 bit.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit1be(value: number) {
        await this.bit(value, 1, true, "big");
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit2(value: number) {
        await this.bit(value, 2);
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit2le(value: number) {
        await this.bit(value, 2, undefined, "little");
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit2be(value: number) {
        await this.bit(value, 2, undefined, "big");
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit2(value: number) {
        await this.bit(value, 2, true);
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit2le(value: number) {
        await this.bit(value, 2, true, "little");;
    };

    /**
     * Bit field writer. Writes 2 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit2be(value: number) {
        await this.bit(value, 2, true, "big");
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit3(value: number) {
        await this.bit(value, 3);
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit3le(value: number) {
        await this.bit(value, 3, undefined, "little");
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit3be(value: number) {
        await this.bit(value, 3, undefined, "big");
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit3(value: number) {
        await this.bit(value, 3, true);
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit3le(value: number) {
        await this.bit(value, 3, true, "little");;
    };

    /**
     * Bit field writer. Writes 3 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit3be(value: number) {
        await this.bit(value, 3, true, "big");
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit4(value: number) {
        await this.bit(value, 4);
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit4le(value: number) {
        await this.bit(value, 4, undefined, "little");
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit4be(value: number) {
        await this.bit(value, 4, undefined, "big");
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit4(value: number) {
        await this.bit(value, 4, true);
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit4le(value: number) {
        await this.bit(value, 4, true, "little");;
    };

    /**
     * Bit field writer. Writes 4 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit4be(value: number) {
        await this.bit(value, 4, true, "big");
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit5(value: number) {
        await this.bit(value, 5);
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit5le(value: number) {
        await this.bit(value, 5, undefined, "little");
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit5be(value: number) {
        await this.bit(value, 5, undefined, "big");
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit5(value: number) {
        await this.bit(value, 5, true);
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit5le(value: number) {
        await this.bit(value, 5, true, "little");
    };

    /**
     * Bit field writer. Writes 5 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit5be(value: number) {
        await this.bit(value, 5, true, "big");
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit6(value: number) {
        await this.bit(value, 6);
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit6le(value: number) {
        await this.bit(value, 6, undefined, "little");
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit6be(value: number) {
        await this.bit(value, 6, undefined, "big");
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit6(value: number) {
        await this.bit(value, 6, true);
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit6le(value: number) {
        await this.bit(value, 6, true, "little");
    };

    /**
     * Bit field writer. Writes 6 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit6be(value: number) {
        await this.bit(value, 6, true, "big");
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit7(value: number) {
        await this.bit(value, 7);
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit7le(value: number) {
        await this.bit(value, 7, undefined, "little");
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit7be(value: number) {
        await this.bit(value, 7, undefined, "big");
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit7(value: number) {
        await this.bit(value, 7, true);
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit7le(value: number) {
        await this.bit(value, 7, true, "little");
    };

    /**
     * Bit field writer. Writes 7 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit7be(value: number) {
        await this.bit(value, 7, true, "big");
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit8(value: number) {
        await this.bit(value, 8);
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit8le(value: number) {
        await this.bit(value, 8, undefined, "little");
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit8be(value: number) {
        await this.bit(value, 8, undefined, "big");
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit8(value: number) {
        await this.bit(value, 8, true);
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit8le(value: number) {
        await this.bit(value, 8, true, "little");;
    };

    /**
     * Bit field writer. Writes 8 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit8be(value: number) {
        await this.bit(value, 8, true, "big");
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit9(value: number) {
        await this.bit(value, 9);
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit9le(value: number) {
        await this.bit(value, 9, undefined, "little");
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit9be(value: number) {
        await this.bit(value, 9, undefined, "big");
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit9(value: number) {
        await this.bit(value, 9, true);
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit9le(value: number) {
        await this.bit(value, 9, true, "little");;
    };

    /**
     * Bit field writer. Writes 9 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit9be(value: number) {
        await this.bit(value, 9, true, "big");
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit10(value: number) {
        await this.bit(value, 10);
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit10le(value: number) {
        await this.bit(value, 10, undefined, "little");
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit10be(value: number) {
        await this.bit(value, 10, undefined, "big");
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit10(value: number) {
        await this.bit(value, 10, true);
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit10le(value: number) {
        await this.bit(value, 10, true, "little");;
    };

    /**
     * Bit field writer. Writes 10 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit10be(value: number) {
        await this.bit(value, 10, true, "big");
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit11(value: number) {
        await this.bit(value, 11);
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit11le(value: number) {
        await this.bit(value, 11, undefined, "little");
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit11be(value: number) {
        await this.bit(value, 11, undefined, "big");
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit11(value: number) {
        await this.bit(value, 11, true);
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit11le(value: number) {
        await this.bit(value, 11, true, "little");;
    };

    /**
     * Bit field writer. Writes 11 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit11be(value: number) {
        await this.bit(value, 11, true, "big");
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit12(value: number) {
        await this.bit(value, 12);
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit12le(value: number) {
        await this.bit(value, 12, undefined, "little");
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit12be(value: number) {
        await this.bit(value, 12, undefined, "big");
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit12(value: number) {
        await this.bit(value, 12, true);
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit12le(value: number) {
        await this.bit(value, 12, true, "little");;
    };

    /**
     * Bit field writer. Writes 12 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit12be(value: number) {
        await this.bit(value, 12, true, "big");
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit13(value: number) {
        await this.bit(value, 13);
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit13le(value: number) {
        await this.bit(value, 13, undefined, "little");
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit13be(value: number) {
        await this.bit(value, 13, undefined, "big");
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit13(value: number) {
        await this.bit(value, 13, true);
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit13le(value: number) {
        await this.bit(value, 13, true, "little");;
    };

    /**
     * Bit field writer. Writes 13 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit13be(value: number) {
        await this.bit(value, 13, true, "big");
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit14(value: number) {
        await this.bit(value, 14);
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit14le(value: number) {
        await this.bit(value, 14, undefined, "little");
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit14be(value: number) {
        await this.bit(value, 14, undefined, "big");
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit14(value: number) {
        await this.bit(value, 14, true);
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit14le(value: number) {
        await this.bit(value, 14, true, "little");;
    };

    /**
     * Bit field writer. Writes 14 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit14be(value: number) {
        await this.bit(value, 14, true, "big");
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit15(value: number) {
        await this.bit(value, 15);
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit15le(value: number) {
        await this.bit(value, 15, undefined, "little");
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit15be(value: number) {
        await this.bit(value, 15, undefined, "big");
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit15(value: number) {
        await this.bit(value, 15, true);
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit15le(value: number) {
        await this.bit(value, 15, true, "little");;
    };

    /**
     * Bit field writer. Writes 15 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit15be(value: number) {
        await this.bit(value, 15, true, "big");
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit16(value: number) {
        await this.bit(value, 16);
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit16le(value: number) {
        await this.bit(value, 16, undefined, "little");
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit16be(value: number) {
        await this.bit(value, 16, undefined, "big");
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit16(value: number) {
        await this.bit(value, 16, true);
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit16le(value: number) {
        await this.bit(value, 16, true, "little");;
    };

    /**
     * Bit field writer. Writes 16 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit16be(value: number) {
        await this.bit(value, 16, true, "big");
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit17(value: number) {
        await this.bit(value, 17);
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit17le(value: number) {
        await this.bit(value, 17, undefined, "little");
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit17be(value: number) {
        await this.bit(value, 17, undefined, "big");
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit17(value: number) {
        await this.bit(value, 17, true);
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit17le(value: number) {
        await this.bit(value, 17, true, "little");;
    };

    /**
     * Bit field writer. Writes 17 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit17be(value: number) {
        await this.bit(value, 17, true, "big");
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit18(value: number) {
        await this.bit(value, 18);
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit18le(value: number) {
        await this.bit(value, 18, undefined, "little");
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit18be(value: number) {
        await this.bit(value, 18, undefined, "big");
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit18(value: number) {
        await this.bit(value, 18, true);
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit18le(value: number) {
        await this.bit(value, 18, true, "little");;
    };

    /**
     * Bit field writer. Writes 18 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit18be(value: number) {
        await this.bit(value, 18, true, "big");
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit19(value: number) {
        await this.bit(value, 19);
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit19le(value: number) {
        await this.bit(value, 19, undefined, "little");
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit19be(value: number) {
        await this.bit(value, 19, undefined, "big");
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit19(value: number) {
        await this.bit(value, 19, true);
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit19le(value: number) {
        await this.bit(value, 19, true, "little");;
    };

    /**
     * Bit field writer. Writes 19 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit19be(value: number) {
        await this.bit(value, 19, true, "big");
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit20(value: number) {
        await this.bit(value, 20);
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit20le(value: number) {
        await this.bit(value, 20, undefined, "little");
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit20be(value: number) {
        await this.bit(value, 20, undefined, "big");
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit20(value: number) {
        await this.bit(value, 20, true);
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit20le(value: number) {
        await this.bit(value, 20, true, "little");;
    };

    /**
     * Bit field writer. Writes 20 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit20be(value: number) {
        await this.bit(value, 20, true, "big");
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit21(value: number) {
        await this.bit(value, 21);
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit21le(value: number) {
        await this.bit(value, 21, undefined, "little");
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit21be(value: number) {
        await this.bit(value, 21, undefined, "big");
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit21(value: number) {
        await this.bit(value, 21, true);
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit21le(value: number) {
        await this.bit(value, 21, true, "little");;
    };

    /**
     * Bit field writer. Writes 21 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit21be(value: number) {
        await this.bit(value, 21, true, "big");
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit22(value: number) {
        await this.bit(value, 22);
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit22le(value: number) {
        await this.bit(value, 22, undefined, "little");
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit22be(value: number) {
        await this.bit(value, 22, undefined, "big");
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit22(value: number) {
        await this.bit(value, 22, true);
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit22le(value: number) {
        await this.bit(value, 22, true, "little");;
    };

    /**
     * Bit field writer. Writes 22 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit22be(value: number) {
        await this.bit(value, 22, true, "big");
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit23(value: number) {
        await this.bit(value, 23);
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit23le(value: number) {
        await this.bit(value, 23, undefined, "little");
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit23be(value: number) {
        await this.bit(value, 23, undefined, "big");
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit23(value: number) {
        await this.bit(value, 23, true);
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit23le(value: number) {
        await this.bit(value, 23, true, "little");;
    };

    /**
     * Bit field writer. Writes 23 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit23be(value: number) {
        await this.bit(value, 23, true, "big");
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit24(value: number) {
        await this.bit(value, 24);
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit24le(value: number) {
        await this.bit(value, 24, undefined, "little");
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit24be(value: number) {
        await this.bit(value, 24, undefined, "big");
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit24(value: number) {
        await this.bit(value, 24, true);
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit24le(value: number) {
        await this.bit(value, 24, true, "little");;
    };

    /**
     * Bit field writer. Writes 24 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit24be(value: number) {
        await this.bit(value, 24, true, "big");
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit25(value: number) {
        await this.bit(value, 25);
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit25le(value: number) {
        await this.bit(value, 25, undefined, "little");
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit25be(value: number) {
        await this.bit(value, 25, undefined, "big");
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit25(value: number) {
        await this.bit(value, 25, true);
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit25le(value: number) {
        await this.bit(value, 25, true, "little");;
    };

    /**
     * Bit field writer. Writes 25 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit25be(value: number) {
        await this.bit(value, 25, true, "big");
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit26(value: number) {
        await this.bit(value, 26);
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit26le(value: number) {
        await this.bit(value, 26, undefined, "little");
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit26be(value: number) {
        await this.bit(value, 26, undefined, "big");
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit26(value: number) {
        await this.bit(value, 26, true);
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit26le(value: number) {
        await this.bit(value, 26, true, "little");;
    };

    /**
     * Bit field writer. Writes 26 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit26be(value: number) {
        await this.bit(value, 26, true, "big");
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit27(value: number) {
        await this.bit(value, 27);
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit27le(value: number) {
        await this.bit(value, 27, undefined, "little");
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit27be(value: number) {
        await this.bit(value, 27, undefined, "big");
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit27(value: number) {
        await this.bit(value, 27, true);
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit27le(value: number) {
        await this.bit(value, 27, true, "little");;
    };

    /**
     * Bit field writer. Writes 27 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit27be(value: number) {
        await this.bit(value, 27, true, "big");
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit28(value: number) {
        await this.bit(value, 28);
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit28le(value: number) {
        await this.bit(value, 28, undefined, "little");
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit28be(value: number) {
        await this.bit(value, 28, undefined, "big");
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit28(value: number) {
        await this.bit(value, 28, true);
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit28le(value: number) {
        await this.bit(value, 28, true, "little");;
    };

    /**
     * Bit field writer. Writes 28 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit28be(value: number) {
        await this.bit(value, 28, true, "big");
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit29(value: number) {
        await this.bit(value, 29);
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit29le(value: number) {
        await this.bit(value, 29, undefined, "little");
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit29be(value: number) {
        await this.bit(value, 29, undefined, "big");
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit29(value: number) {
        await this.bit(value, 29, true);
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit29le(value: number) {
        await this.bit(value, 29, true, "little");;
    };

    /**
     * Bit field writer. Writes 29 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit29be(value: number) {
        await this.bit(value, 29, true, "big");
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit30(value: number) {
        await this.bit(value, 30);
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit30le(value: number) {
        await this.bit(value, 30, undefined, "little");
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit30be(value: number) {
        await this.bit(value, 30, undefined, "big");
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit30(value: number) {
        await this.bit(value, 30, true);
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit30le(value: number) {
        await this.bit(value, 30, true, "little");;
    };

    /**
     * Bit field writer. Writes 30 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit30be(value: number) {
        await this.bit(value, 30, true, "big");
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit31(value: number) {
        await this.bit(value, 31);
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit31le(value: number) {
        await this.bit(value, 31, undefined, "little");
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit31be(value: number) {
        await this.bit(value, 31, undefined, "big");
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit31(value: number) {
        await this.bit(value, 31, true);
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit31le(value: number) {
        await this.bit(value, 31, true, "little");;
    };

    /**
     * Bit field writer. Writes 31 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit31be(value: number) {
        await this.bit(value, 31, true, "big");
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit32(value: number) {
        await this.bit(value, 32);
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit32le(value: number) {
        await this.bit(value, 32, undefined, "little");
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async bit32be(value: number) {
        await this.bit(value, 32, undefined, "big");
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit32(value: number) {
        await this.bit(value, 32, true);
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit32le(value: number) {
        await this.bit(value, 32, true, "little");;
    };

    /**
     * Bit field writer. Writes 32 bits.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     * 
     * @param {number} value - value as int 
     */
    async ubit32be(value: number) {
        await this.bit(value, 32, true, "big");
    };

    //
    // #region byte write
    //

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     */
    async byte(value: number) {
        await this.writeByte(value);
    };

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     */
    async int8(value: number) {
        await this.writeByte(value);
    };

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    async uint8(value: number) {
        await this.writeByte(value, true);
    };

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    async ubyte(value: number) {
        await this.writeByte(value, true);
    };

    //
    // #region short writes
    //

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     */
    async int16(value: number) {
        await this.writeInt16(value);
    };

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     */
    async short(value: number) {
        await this.writeInt16(value);
    };

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     */
    async word(value: number) {
        await this.writeInt16(value);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async uint16(value: number) {
        await this.writeInt16(value, true);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async ushort(value: number) {
        await this.writeInt16(value, true);
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async uword(value: number) {
        await this.writeInt16(value, true);
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async int16be(value: number) {
        await this.writeInt16(value, false, "big");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async shortbe(value: number) {
        await this.writeInt16(value, false, "big");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async wordbe(value: number) {
        await this.writeInt16(value, false, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async uint16be(value: number) {
        await this.writeInt16(value, true, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async ushortbe(value: number) {
        await this.writeInt16(value, true, "big");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async uwordbe(value: number) {
        await this.writeInt16(value, true, "big");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async int16le(value: number) {
        await this.writeInt16(value, false, "little");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async shortle(value: number) {
        await this.writeInt16(value, false, "little");
    };

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    async wordle(value: number) {
        await this.writeInt16(value, false, "little");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async uint16le(value: number) {
        await this.writeInt16(value, true, "little");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async ushortle(value: number) {
        await this.writeInt16(value, true, "little");
    };

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    async uwordle(value: number) {
        await this.writeInt16(value, true, "little");
    };

    //
    // #region half float
    //

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    async half(value: number) {
        await this.writeHalfFloat(value);
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    async halffloat(value: number) {
        await this.writeHalfFloat(value);
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    async halffloatbe(value: number) {
        await this.writeHalfFloat(value, "big");
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    async halfbe(value: number) {
        await this.writeHalfFloat(value, "big");
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    async halffloatle(value: number) {
        await this.writeHalfFloat(value, "little");
    };

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    async halfle(value: number) {
        await this.writeHalfFloat(value, "little");
    };

    //
    // #region int32 write
    //

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     */
    async int(value: number) {
        await this.writeInt32(value);
    };

    /**
    * Write int32.
    *
    * @param {number} value - value as int 
    */
    async int32(value: number) {
        await this.writeInt32(value);
    };

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     */
    async double(value: number) {
        await this.writeInt32(value);
    };

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     */
    async long(value: number) {
        await this.writeInt32(value);
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async uint32(value: number) {
        await this.writeInt32(value, true);
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async uint(value: number) {
        await this.writeInt32(value, true);
    };

    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int 
    */
    async udouble(value: number) {
        await this.writeInt32(value, true);
    };

    /**
    * Write unsigned int32.
    *
    * @param {number} value - value as int 
    */
    async ulong(value: number) {
        await this.writeInt32(value, true);
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async int32le(value: number) {
        await this.writeInt32(value, false, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async intle(value: number) {
        await this.writeInt32(value, false, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async doublele(value: number) {
        await this.writeInt32(value, false, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async longle(value: number) {
        await this.writeInt32(value, false, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async uint32le(value: number) {
        await this.writeInt32(value, true, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async uintle(value: number) {
        await this.writeInt32(value, true, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async udoublele(value: number) {
        await this.writeInt32(value, true, "little");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async ulongle(value: number) {
        await this.writeInt32(value, true, "little");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async intbe(value: number) {
        await this.writeInt32(value, false, "big");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async int32be(value: number) {
        await this.writeInt32(value, false, "big");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async doublebe(value: number) {
        await this.writeInt32(value, false, "big");
    };

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    async longbe(value: number) {
        await this.writeInt32(value, false, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async writeUInt32BE(value: number) {
        await this.writeInt32(value, true, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async uint32be(value: number) {
        await this.writeInt32(value, true, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async uintbe(value: number) {
        await this.writeInt32(value, true, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    async udoublebe(value: number) {
        await this.writeInt32(value, true, "big");
    };

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int
     */
    async ulongbe(value: number) {
        await this.writeInt32(value, true, "big");
    };

    //
    // #region float write
    //

    /**
    * Write float.
    * 
    * @param {number} value - value as int 
    */
    async float(value: number) {
        await this.writeFloat(value);
    };

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     */
    async floatle(value: number) {
        await this.writeFloat(value, "little");
    };

    /**
    * Write float.
    * 
    * @param {number} value - value as int 
    */
    async floatbe(value: number) {
        await this.writeFloat(value, "big");
    };

    //
    // #region int64 write
    //

    /**
     * Write 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async int64(value: BigValue) {
        await this.writeInt64(value);
    };

    /**
    * Write 64 bit integer.
    * 
    * @param {BigValue} value - value as int 
    */
    async quad(value: BigValue) {
        await this.writeInt64(value);
    };

    /**
     * Write 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async bigint(value: BigValue) {
        await this.writeInt64(value);
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async uint64(value: BigValue) {
        await this.writeInt64(value, true);
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async ubigint(value: BigValue) {
        await this.writeInt64(value, true);
    };

    /**
    * Write unsigned 64 bit integer.
    * 
    * @param {BigValue} value - value as int 
    */
    async uquad(value: BigValue) {
        await this.writeInt64(value, true,);
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async int64le(value: BigValue) {
        await this.writeInt64(value, false, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async bigintle(value: BigValue) {
        await this.writeInt64(value, false, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async quadle(value: BigValue) {
        await this.writeInt64(value, false, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async uint64le(value: BigValue) {
        await this.writeInt64(value, true, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async ubigintle(value: BigValue) {
        await this.writeInt64(value, true, "little");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async uquadle(value: BigValue) {
        await this.writeInt64(value, true, "little");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async int64be(value: BigValue) {
        await this.writeInt64(value, false, "big");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async bigintbe(value: BigValue) {
        await this.writeInt64(value, false, "big");
    };

    /**
     * Write signed 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async quadbe(value: BigValue) {
        await this.writeInt64(value, false, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async uint64be(value: BigValue) {
        await this.writeInt64(value, true, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async ubigintbe(value: BigValue) {
        await this.writeInt64(value, true, "big");
    };

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {BigValue} value - value as int 
     */
    async uquadbe(value: BigValue) {
        await this.writeInt64(value, true, "big");
    };

    //
    // #region doublefloat
    //

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    async doublefloat(value: number) {
        await this.writeDoubleFloat(value);
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    async dfloat(value: number) {
        await this.writeDoubleFloat(value);
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    async dfloatbe(value: number) {
        await this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    async doublefloatbe(value: number) {
        await this.writeDoubleFloat(value, "big");
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    async dfloatle(value: number) {
        await this.writeDoubleFloat(value, "little");
    };

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    async doublefloatle(value: number) {
        await this.writeDoubleFloat(value, "little");
    };

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
    async string(string: string, options?: stringOptions) {
        return await this.writeString(string, options);
    };

    /**
    * Writes string using setting from .strSettings
    * 
    * Default is ``utf-8``
    * 
    * @param {string} string - text string
    */
    async str(string: string) {
        await this.writeString(string, this.strSettings);
    };

    /**
    * Writes UTF-8 (C) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf8string(string: string, length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes UTF-8 (C) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async cstring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes ANSI string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
   async ansistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    };

    /**
    * Writes UTF-16 (Unicode) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    async utf16string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    };

    /**
    * Writes UTF-16 (Unicode) string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    * @param {stringOptions["endian"]} endian - for wide-pascal and utf-16
    */
    async unistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    };

    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf16stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    };

    /**
    * Writes UTF-16 (Unicode) string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async unistringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    };

    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async utf16stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    };

    /**
    * Writes UTF-16 (Unicode) string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["length"]} length - for fixed length utf strings
    * @param {stringOptions["terminateValue"]} terminateValue - for non-fixed length utf strings
    */
    async unistringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]) {
        return await this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    };

    /**
    * Writes Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    async pstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Pascal string 1 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    async pstring1(string: string, endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian });
    };

    /**
    * Writes Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async pstring1le(string: string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little" });
    };

    /**
    * Writes Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async pstring1be(string: string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big" });
    };

    /**
    * Writes Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async pstring2(string: string, endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: endian });
    };

    /**
    * Writes Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async pstring2le(string: string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little" });
    };

    /**
    * Writes Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async pstring2be(string: string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big" });
    };

    /**
    * Writes Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async pstring4(string: string, endian?: stringOptions["endian"]) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian });
    };

    /**
    * Writes Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async pstring4be(string: string) {
        return await this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big" });
    };

    /**
    * Writes Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async pstring4le(string: string) {
        return await this .string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    };

    /**
    * Writes Wide-Pascal string in big endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big" });
    };

    /**
    * Writes Wide-Pascal string in little endian order.
    * 
    * @param {string} string - text string
    * @param {stringOptions["lengthWriteSize"]} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    async wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring1(string: string, endian?: stringOptions["endian"]) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian });
    };

    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring1be(string: string) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big" });
    };

    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring1le(string: string) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string 2 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring2(string: string, endian?: stringOptions["endian"]) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian });
    };

    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring2le(string: string) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring2be(string: string) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big" });
    };

    /**
    * Writes Wide-Pascal string 4 byte length read.
    * 
    * @param {string} string - text string
    * @param {stringOptions["endian"]} endian - ``big`` or ``little``
    */
    async wpstring4(string: string, endian?: stringOptions["endian"]) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian });
    };

    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring4le(string: string) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little" });
    };

    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order.
    * 
    * @param {string} string - text string
    */
    async wpstring4be(string: string) {
        return await this .string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big" });
    };
};