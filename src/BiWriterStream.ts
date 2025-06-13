import { BiOptions } from "./common.js";
import { BiBaseStreamer } from './core/BiBaseStream.js';
import { applyBinaryAliasWriter, BinaryAliasWriterStreamer } from "./aliases/BinaryAliasWriter.js";

const BiWriterStreamer = applyBinaryAliasWriter(BiBaseStreamer);

/**
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
 * 
 * @since 3.1
 */
export class BiWriterStream extends BiWriterStreamer implements BinaryAliasWriterStreamer {
    /**
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
     */
    constructor(filePath: string, options: BiOptions  = {}) {
        super(filePath, true);
        this.strict = false;

        if(options.extendBufferSize != undefined && options.extendBufferSize != 0)
        {
            this.extendBufferSize = options.extendBufferSize;
        }

        if(typeof options.strict == "boolean"){
            this.strict = options.strict;
        } else {
            if(options.strict != undefined){
                throw new Error("Strict mode must be true of false.");
            }
        }

        this.endian = options.endianness || "little";

        if(options.endianness != undefined && typeof options.endianness != "string"){
            throw new Error("endianness must be big or little.");
        }
        if(options.endianness != undefined && !(options.endianness == "big" || options.endianness == "little")){
            throw new Error("Endianness must be big or little.");
        }

        this.offset = options.byteOffset ?? 0;
        this.bitoffset = options.bitOffset ?? 0;
    }
}