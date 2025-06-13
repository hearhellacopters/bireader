import { BiOptions, endian, stringOptions } from "./common.js";
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
    bit(bits: number, unsigned?: boolean, endian?: endian): number {
        throw new Error("Method not implemented.");
    }
    ubit(bits: number, endian?: endian): number {
        throw new Error("Method not implemented.");
    }
    ubitbe(bits: number): number {
        throw new Error("Method not implemented.");
    }
    bitbe(bits: number, unsigned?: boolean): number {
        throw new Error("Method not implemented.");
    }
    ubitle(bits: number): number {
        throw new Error("Method not implemented.");
    }
    bitle(bits: number, unsigned?: boolean): number {
        throw new Error("Method not implemented.");
    }
    get bit1(): number {
        throw new Error("Method not implemented.");
    }
    get bit1le(): number {
        throw new Error("Method not implemented.");
    }
    get bit1be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit1(): number {
        throw new Error("Method not implemented.");
    }
    get ubit1le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit1be(): number {
        throw new Error("Method not implemented.");
    }
    get bit2(): number {
        throw new Error("Method not implemented.");
    }
    get bit2le(): number {
        throw new Error("Method not implemented.");
    }
    get bit2be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit2(): number {
        throw new Error("Method not implemented.");
    }
    get ubit2le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit2be(): number {
        throw new Error("Method not implemented.");
    }
    get bit3(): number {
        throw new Error("Method not implemented.");
    }
    get bit3le(): number {
        throw new Error("Method not implemented.");
    }
    get bit3be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit3(): number {
        throw new Error("Method not implemented.");
    }
    get ubit3le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit3be(): number {
        throw new Error("Method not implemented.");
    }
    get bit4(): number {
        throw new Error("Method not implemented.");
    }
    get bit4le(): number {
        throw new Error("Method not implemented.");
    }
    get bit4be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit4(): number {
        throw new Error("Method not implemented.");
    }
    get ubit4le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit4be(): number {
        throw new Error("Method not implemented.");
    }
    get bit5(): number {
        throw new Error("Method not implemented.");
    }
    get bit5le(): number {
        throw new Error("Method not implemented.");
    }
    get bit5be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit5(): number {
        throw new Error("Method not implemented.");
    }
    get ubit5le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit5be(): number {
        throw new Error("Method not implemented.");
    }
    get bit6(): number {
        throw new Error("Method not implemented.");
    }
    get bit6le(): number {
        throw new Error("Method not implemented.");
    }
    get bit6be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit6(): number {
        throw new Error("Method not implemented.");
    }
    get ubit6le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit6be(): number {
        throw new Error("Method not implemented.");
    }
    get bit7(): number {
        throw new Error("Method not implemented.");
    }
    get bit7le(): number {
        throw new Error("Method not implemented.");
    }
    get bit7be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit7(): number {
        throw new Error("Method not implemented.");
    }
    get ubit7le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit7be(): number {
        throw new Error("Method not implemented.");
    }
    get bit8(): number {
        throw new Error("Method not implemented.");
    }
    get bit8le(): number {
        throw new Error("Method not implemented.");
    }
    get bit8be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit8(): number {
        throw new Error("Method not implemented.");
    }
    get ubit8le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit8be(): number {
        throw new Error("Method not implemented.");
    }
    get bit9(): number {
        throw new Error("Method not implemented.");
    }
    get bit9le(): number {
        throw new Error("Method not implemented.");
    }
    get bit9be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit9(): number {
        throw new Error("Method not implemented.");
    }
    get ubit9le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit9be(): number {
        throw new Error("Method not implemented.");
    }
    get bit10(): number {
        throw new Error("Method not implemented.");
    }
    get bit10le(): number {
        throw new Error("Method not implemented.");
    }
    get bit10be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit10(): number {
        throw new Error("Method not implemented.");
    }
    get ubit10le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit10be(): number {
        throw new Error("Method not implemented.");
    }
    get bit11(): number {
        throw new Error("Method not implemented.");
    }
    get bit11le(): number {
        throw new Error("Method not implemented.");
    }
    get bit11be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit11(): number {
        throw new Error("Method not implemented.");
    }
    get ubit11le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit11be(): number {
        throw new Error("Method not implemented.");
    }
    get bit12(): number {
        throw new Error("Method not implemented.");
    }
    get bit12le(): number {
        throw new Error("Method not implemented.");
    }
    get bit12be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit12(): number {
        throw new Error("Method not implemented.");
    }
    get ubit12le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit12be(): number {
        throw new Error("Method not implemented.");
    }
    get bit13(): number {
        throw new Error("Method not implemented.");
    }
    get bit13le(): number {
        throw new Error("Method not implemented.");
    }
    get bit13be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit13(): number {
        throw new Error("Method not implemented.");
    }
    get ubit13le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit13be(): number {
        throw new Error("Method not implemented.");
    }
    get bit14(): number {
        throw new Error("Method not implemented.");
    }
    get bit14le(): number {
        throw new Error("Method not implemented.");
    }
    get bit14be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit14(): number {
        throw new Error("Method not implemented.");
    }
    get ubit14le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit14be(): number {
        throw new Error("Method not implemented.");
    }
    get bit15(): number {
        throw new Error("Method not implemented.");
    }
    get bit15le(): number {
        throw new Error("Method not implemented.");
    }
    get bit15be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit15(): number {
        throw new Error("Method not implemented.");
    }
    get ubit15le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit15be(): number {
        throw new Error("Method not implemented.");
    }
    get bit16(): number {
        throw new Error("Method not implemented.");
    }
    get bit16le(): number {
        throw new Error("Method not implemented.");
    }
    get bit16be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit16(): number {
        throw new Error("Method not implemented.");
    }
    get ubit16le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit16be(): number {
        throw new Error("Method not implemented.");
    }
    get bit17(): number {
        throw new Error("Method not implemented.");
    }
    get bit17le(): number {
        throw new Error("Method not implemented.");
    }
    get bit17be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit17(): number {
        throw new Error("Method not implemented.");
    }
    get ubit17le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit17be(): number {
        throw new Error("Method not implemented.");
    }
    get bit18(): number {
        throw new Error("Method not implemented.");
    }
    get bit18le(): number {
        throw new Error("Method not implemented.");
    }
    get bit18be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit18(): number {
        throw new Error("Method not implemented.");
    }
    get ubit18le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit18be(): number {
        throw new Error("Method not implemented.");
    }
    get bit19(): number {
        throw new Error("Method not implemented.");
    }
    get bit19le(): number {
        throw new Error("Method not implemented.");
    }
    get bit19be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit19(): number {
        throw new Error("Method not implemented.");
    }
    get ubit19le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit19be(): number {
        throw new Error("Method not implemented.");
    }
    get bit20(): number {
        throw new Error("Method not implemented.");
    }
    get bit20le(): number {
        throw new Error("Method not implemented.");
    }
    get bit20be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit20(): number {
        throw new Error("Method not implemented.");
    }
    get ubit20le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit20be(): number {
        throw new Error("Method not implemented.");
    }
    get bit21(): number {
        throw new Error("Method not implemented.");
    }
    get bit21le(): number {
        throw new Error("Method not implemented.");
    }
    get bit21be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit21(): number {
        throw new Error("Method not implemented.");
    }
    get ubit21le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit21be(): number {
        throw new Error("Method not implemented.");
    }
    get bit22(): number {
        throw new Error("Method not implemented.");
    }
    get bit22le(): number {
        throw new Error("Method not implemented.");
    }
    get bit22be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit22(): number {
        throw new Error("Method not implemented.");
    }
    get ubit22le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit22be(): number {
        throw new Error("Method not implemented.");
    }
    get bit23(): number {
        throw new Error("Method not implemented.");
    }
    get bit23le(): number {
        throw new Error("Method not implemented.");
    }
    get bit23be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit23(): number {
        throw new Error("Method not implemented.");
    }
    get ubit23le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit23be(): number {
        throw new Error("Method not implemented.");
    }
    get bit24(): number {
        throw new Error("Method not implemented.");
    }
    get bit24le(): number {
        throw new Error("Method not implemented.");
    }
    get bit24be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit24(): number {
        throw new Error("Method not implemented.");
    }
    get ubit24le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit24be(): number {
        throw new Error("Method not implemented.");
    }
    get bit25(): number {
        throw new Error("Method not implemented.");
    }
    get bit25le(): number {
        throw new Error("Method not implemented.");
    }
    get bit25be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit25(): number {
        throw new Error("Method not implemented.");
    }
    get ubit25le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit25be(): number {
        throw new Error("Method not implemented.");
    }
    get bit26(): number {
        throw new Error("Method not implemented.");
    }
    get bit26le(): number {
        throw new Error("Method not implemented.");
    }
    get bit26be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit26(): number {
        throw new Error("Method not implemented.");
    }
    get ubit26le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit26be(): number {
        throw new Error("Method not implemented.");
    }
    get bit27(): number {
        throw new Error("Method not implemented.");
    }
    get bit27le(): number {
        throw new Error("Method not implemented.");
    }
    get bit27be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit27(): number {
        throw new Error("Method not implemented.");
    }
    get ubit27le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit27be(): number {
        throw new Error("Method not implemented.");
    }
    get bit28(): number {
        throw new Error("Method not implemented.");
    }
    get bit28le(): number {
        throw new Error("Method not implemented.");
    }
    get bit28be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit28(): number {
        throw new Error("Method not implemented.");
    }
    get ubit28le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit28be(): number {
        throw new Error("Method not implemented.");
    }
    get bit29(): number {
        throw new Error("Method not implemented.");
    }
    get bit29le(): number {
        throw new Error("Method not implemented.");
    }
    get bit29be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit29(): number {
        throw new Error("Method not implemented.");
    }
    get ubit29le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit29be(): number {
        throw new Error("Method not implemented.");
    }
    get bit30(): number {
        throw new Error("Method not implemented.");
    }
    get bit30le(): number {
        throw new Error("Method not implemented.");
    }
    get bit30be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit30(): number {
        throw new Error("Method not implemented.");
    }
    get ubit30le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit30be(): number {
        throw new Error("Method not implemented.");
    }
    get bit31(): number {
        throw new Error("Method not implemented.");
    }
    get bit31le(): number {
        throw new Error("Method not implemented.");
    }
    get bit31be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit31(): number {
        throw new Error("Method not implemented.");
    }
    get ubit31le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit31be(): number {
        throw new Error("Method not implemented.");
    }
    get bit32(): number {
        throw new Error("Method not implemented.");
    }
    get bit32le(): number {
        throw new Error("Method not implemented.");
    }
    get bit32be(): number {
        throw new Error("Method not implemented.");
    }
    get ubit32(): number {
        throw new Error("Method not implemented.");
    }
    get ubit32le(): number {
        throw new Error("Method not implemented.");
    }
    get ubit32be(): number {
        throw new Error("Method not implemented.");
    }
    get byte(): number {
        throw new Error("Method not implemented.");
    }
    get int8(): number {
        throw new Error("Method not implemented.");
    }
    get uint8(): number {
        throw new Error("Method not implemented.");
    }
    get ubyte(): number {
        throw new Error("Method not implemented.");
    }
    get int16(): number {
        throw new Error("Method not implemented.");
    }
    get short(): number {
        throw new Error("Method not implemented.");
    }
    get word(): number {
        throw new Error("Method not implemented.");
    }
    get uint16(): number {
        throw new Error("Method not implemented.");
    }
    get ushort(): number {
        throw new Error("Method not implemented.");
    }
    get uword(): number {
        throw new Error("Method not implemented.");
    }
    get uint16le(): number {
        throw new Error("Method not implemented.");
    }
    get ushortle(): number {
        throw new Error("Method not implemented.");
    }
    get uwordle(): number {
        throw new Error("Method not implemented.");
    }
    get int16le(): number {
        throw new Error("Method not implemented.");
    }
    get shortle(): number {
        throw new Error("Method not implemented.");
    }
    get wordle(): number {
        throw new Error("Method not implemented.");
    }
    get uint16be(): number {
        throw new Error("Method not implemented.");
    }
    get ushortbe(): number {
        throw new Error("Method not implemented.");
    }
    get uwordbe(): number {
        throw new Error("Method not implemented.");
    }
    get int16be(): number {
        throw new Error("Method not implemented.");
    }
    get shortbe(): number {
        throw new Error("Method not implemented.");
    }
    get wordbe(): number {
        throw new Error("Method not implemented.");
    }
    get halffloat(): number {
        throw new Error("Method not implemented.");
    }
    get half(): number {
        throw new Error("Method not implemented.");
    }
    get halffloatbe(): number {
        throw new Error("Method not implemented.");
    }
    get halfbe(): number {
        throw new Error("Method not implemented.");
    }
    get halffloatle(): number {
        throw new Error("Method not implemented.");
    }
    get halfle(): number {
        throw new Error("Method not implemented.");
    }
    get int(): number {
        throw new Error("Method not implemented.");
    }
    get double(): number {
        throw new Error("Method not implemented.");
    }
    get int32(): number {
        throw new Error("Method not implemented.");
    }
    get long(): number {
        throw new Error("Method not implemented.");
    }
    get uint(): number {
        throw new Error("Method not implemented.");
    }
    get udouble(): number {
        throw new Error("Method not implemented.");
    }
    get uint32(): number {
        throw new Error("Method not implemented.");
    }
    get ulong(): number {
        throw new Error("Method not implemented.");
    }
    get intbe(): number {
        throw new Error("Method not implemented.");
    }
    get doublebe(): number {
        throw new Error("Method not implemented.");
    }
    get int32be(): number {
        throw new Error("Method not implemented.");
    }
    get longbe(): number {
        throw new Error("Method not implemented.");
    }
    get uintbe(): number {
        throw new Error("Method not implemented.");
    }
    get udoublebe(): number {
        throw new Error("Method not implemented.");
    }
    get uint32be(): number {
        throw new Error("Method not implemented.");
    }
    get ulongbe(): number {
        throw new Error("Method not implemented.");
    }
    get intle(): number {
        throw new Error("Method not implemented.");
    }
    get doublele(): number {
        throw new Error("Method not implemented.");
    }
    get int32le(): number {
        throw new Error("Method not implemented.");
    }
    get longle(): number {
        throw new Error("Method not implemented.");
    }
    get uintle(): number {
        throw new Error("Method not implemented.");
    }
    get udoublele(): number {
        throw new Error("Method not implemented.");
    }
    get uint32le(): number {
        throw new Error("Method not implemented.");
    }
    get ulongle(): number {
        throw new Error("Method not implemented.");
    }
    get float(): number {
        throw new Error("Method not implemented.");
    }
    get floatbe(): number {
        throw new Error("Method not implemented.");
    }
    get floatle(): number {
        throw new Error("Method not implemented.");
    }
    get int64(): bigint {
        throw new Error("Method not implemented.");
    }
    get bigint(): bigint {
        throw new Error("Method not implemented.");
    }
    get quad(): bigint {
        throw new Error("Method not implemented.");
    }
    get uint64(): bigint {
        throw new Error("Method not implemented.");
    }
    get ubigint(): bigint {
        throw new Error("Method not implemented.");
    }
    get uquad(): bigint {
        throw new Error("Method not implemented.");
    }
    get int64be(): bigint {
        throw new Error("Method not implemented.");
    }
    get bigintbe(): bigint {
        throw new Error("Method not implemented.");
    }
    get quadbe(): bigint {
        throw new Error("Method not implemented.");
    }
    get uint64be(): bigint {
        throw new Error("Method not implemented.");
    }
    get ubigintbe(): bigint {
        throw new Error("Method not implemented.");
    }
    get uquadbe(): bigint {
        throw new Error("Method not implemented.");
    }
    get int64le(): bigint {
        throw new Error("Method not implemented.");
    }
    get bigintle(): bigint {
        throw new Error("Method not implemented.");
    }
    get quadle(): bigint {
        throw new Error("Method not implemented.");
    }
    get uint64le(): bigint {
        throw new Error("Method not implemented.");
    }
    get ubigintle(): bigint {
        throw new Error("Method not implemented.");
    }
    get uquadle(): bigint {
        throw new Error("Method not implemented.");
    }
    get doublefloat(): number {
        throw new Error("Method not implemented.");
    }
    get dfloat(): number {
        throw new Error("Method not implemented.");
    }
    get dfloatebe(): number {
        throw new Error("Method not implemented.");
    }
    get doublefloatbe(): number {
        throw new Error("Method not implemented.");
    }
    get dfloatle(): number {
        throw new Error("Method not implemented.");
    }
    get doublefloatle(): number {
        throw new Error("Method not implemented.");
    }
    string(options?: stringOptions): string {
        throw new Error("Method not implemented.");
    }
    get str(): string {
        throw new Error("Method not implemented.");
    }
    utf8string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    cstring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    ansistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    utf16string(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    unistring(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    utf16stringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    unistringle(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    utf16stringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    unistringbe(length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"], stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    pstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    pstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    pstring1le(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    pstring1be(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    pstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    pstring2le(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    pstring2be(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    pstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    pstring4le(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    pstring4be(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    wpstring(lengthReadSize?: stringOptions["lengthReadSize"], stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    wpstring1(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    wpstring2(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    wpstring2le(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    wpstring2be(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    wpstring4(stripNull?: stringOptions["stripNull"], endian?: stringOptions["endian"]): string {
        throw new Error("Method not implemented.");
    }
    wpstring4be(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
    wpstring4le(stripNull?: stringOptions["stripNull"]): string {
        throw new Error("Method not implemented.");
    }
};