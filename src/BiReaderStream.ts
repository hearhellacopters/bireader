import { BiOptions } from "./common.js";
import { BiBaseStreamer } from './core/BiBaseStream.js';
import { applyBinaryAliasReader, BinaryAliasReaderStreamer } from "./aliases/BinaryAliasReader.js";

const BiReaderStreamer = applyBinaryAliasReader(BiBaseStreamer);

/**
 * Binary reader, includes bitfields and strings.
 *
 * @param {string} filePath - Path to file
 * @param {BiOptions?} options - Any options to set at start
 * @param {number?} options.byteOffset - Byte offset to start reader (default ``0``)
 * @param {number?} options.bitOffset - Bit offset 0-7 to start reader (default ``0``)
 * @param {string?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
 * @param {boolean?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``true``)
 * @param {number?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
 * 
 * @since 3.1
 */
export class BiReaderStream extends BiReaderStreamer implements BinaryAliasReaderStreamer {
    /**
     * Binary reader, includes bitfields and strings.
     * 
     * Note: Must start with .open() before reading.
     *
     * @param {string} filePath - Path to file
     * @param {BiOptions?} options - Any options to set at start
     * @param {number?} options.byteOffset - Byte offset to start reader (default ``0``)
     * @param {number?} options.bitOffset - Bit offset 0-7 to start reader (default ``0``)
     * @param {string?} options.endianness - Endianness ``big`` or ``little`` (default ``little``)
     * @param {boolean?} options.strict - Strict mode: if ``true`` does not extend supplied array on outside write (default ``true``)
     * @param {number?} options.extendBufferSize - Amount of data to add when extending the buffer array when strict mode is false. Note: Changes logic in ``.get`` and ``.return``.
     */
    constructor(filePath: string, options: BiOptions = {}) {
        super(filePath, false);
        this.strict = true;

        if(options.extendBufferSize != undefined && options.extendBufferSize != 0)
        {
            this.extendBufferSize = options.extendBufferSize;
        }

        if (options.endianness != undefined && typeof options.endianness != "string") {
            throw new Error("Endian must be big or little");
        }
        if (options.endianness != undefined && !(options.endianness == "big" || options.endianness == "little")) {
            throw new Error("Byte order must be big or little");
        }

        this.endian = options.endianness || "little";

        if (typeof options.strict == "boolean") {
            this.strict = options.strict;
        } else {
            if (options.strict != undefined) {
                throw new Error("Strict mode must be true of false");
            }
        }

        this.offset = options.byteOffset ?? 0;
        this.bitoffset = options.bitOffset ?? 0;
    }
};