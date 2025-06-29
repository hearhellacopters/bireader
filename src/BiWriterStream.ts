import { BigValue, BiOptions, endian, stringOptions } from "./common.js";
import { BiBaseStreamer } from './core/BiBaseStream.js';
import { applyBinaryAliasWriter, BinaryAliasWriterStreamer } from "./aliases/BinaryAliasWriter.js";

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
class BiWriterStreamer extends BiBaseStreamer implements BinaryAliasWriterStreamer {
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
    bit(value: number, bits: number, unsigned?: boolean, endian?: endian): void {
        throw new Error("Method not implemented.");
    }
    ubit(value: number, bits: number, endian?: endian): void {
        throw new Error("Method not implemented.");
    }
    bitbe(value: number, bits: number, unsigned?: boolean): void {
        throw new Error("Method not implemented.");
    }
    ubitbe(value: number, bits: number): void {
        throw new Error("Method not implemented.");
    }
    ubitle(value: number, bits: number): void {
        throw new Error("Method not implemented.");
    }
    bitle(value: number, bits: number, unsigned?: boolean): void {
        throw new Error("Method not implemented.");
    }
    set bit1(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit1le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit1be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit1(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit1le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit1be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit2(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit2le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit2be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit2(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit2le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit2be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit3(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit3le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit3be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit3(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit3le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit3be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit4(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit4le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit4be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit4(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit4le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit4be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit5(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit5le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit5be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit5(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit5le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit5be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit6(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit6le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit6be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit6(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit6le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit6be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit7(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit7le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit7be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit7(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit7le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit7be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit8(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit8le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit8be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit8(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit8le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit8be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit9(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit9le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit9be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit9(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit9le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit9be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit10(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit10le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit10be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit10(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit10le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit10be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit11(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit11le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit11be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit11(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit11le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit11be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit12(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit12le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit12be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit12(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit12le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit12be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit13(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit13le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit13be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit13(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit13le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit13be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit14(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit14le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit14be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit14(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit14le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit14be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit15(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit15le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit15be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit15(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit15le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit15be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit16(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit16le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit16be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit16(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit16le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit16be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit17(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit17le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit17be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit17(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit17le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit17be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit18(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit18le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit18be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit18(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit18le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit18be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit19(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit19le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit19be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit19(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit19le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit19be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit20(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit20le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit20be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit20(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit20le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit20be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit21(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit21le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit21be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit21(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit21le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit21be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit22(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit22le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit22be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit22(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit22le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit22be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit23(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit23le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit23be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit23(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit23le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit23be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit24(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit24le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit24be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit24(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit24le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit24be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit25(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit25le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit25be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit25(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit25le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit25be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit26(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit26le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit26be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit26(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit26le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit26be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit27(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit27le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit27be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit27(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit27le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit27be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit28(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit28le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit28be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit28(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit28le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit28be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit29(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit29le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit29be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit29(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit29le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit29be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit30(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit30le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit30be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit30(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit30le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit30be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit31(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit31le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit31be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit31(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit31le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit31be(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit32(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit32le(value: number) {
        throw new Error("Method not implemented.");
    }
    set bit32be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit32(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit32le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubit32be(value: number) {
        throw new Error("Method not implemented.");
    }
    set byte(value: number) {
        throw new Error("Method not implemented.");
    }
    set int8(value: number) {
        throw new Error("Method not implemented.");
    }
    set uint8(value: number) {
        throw new Error("Method not implemented.");
    }
    set ubyte(value: number) {
        throw new Error("Method not implemented.");
    }
    set int16(value: number) {
        throw new Error("Method not implemented.");
    }
    set short(value: number) {
        throw new Error("Method not implemented.");
    }
    set word(value: number) {
        throw new Error("Method not implemented.");
    }
    set uint16(value: number) {
        throw new Error("Method not implemented.");
    }
    set ushort(value: number) {
        throw new Error("Method not implemented.");
    }
    set uword(value: number) {
        throw new Error("Method not implemented.");
    }
    set int16be(value: number) {
        throw new Error("Method not implemented.");
    }
    set shortbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set wordbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set uint16be(value: number) {
        throw new Error("Method not implemented.");
    }
    set ushortbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set uwordbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set int16le(value: number) {
        throw new Error("Method not implemented.");
    }
    set shortle(value: number) {
        throw new Error("Method not implemented.");
    }
    set wordle(value: number) {
        throw new Error("Method not implemented.");
    }
    set uint16le(value: number) {
        throw new Error("Method not implemented.");
    }
    set ushortle(value: number) {
        throw new Error("Method not implemented.");
    }
    set uwordle(value: number) {
        throw new Error("Method not implemented.");
    }
    set half(value: number) {
        throw new Error("Method not implemented.");
    }
    set halffloat(value: number) {
        throw new Error("Method not implemented.");
    }
    set halffloatbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set halfbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set halffloatle(value: number) {
        throw new Error("Method not implemented.");
    }
    set halfle(value: number) {
        throw new Error("Method not implemented.");
    }
    set int(value: number) {
        throw new Error("Method not implemented.");
    }
    set int32(value: number) {
        throw new Error("Method not implemented.");
    }
    set double(value: number) {
        throw new Error("Method not implemented.");
    }
    set long(value: number) {
        throw new Error("Method not implemented.");
    }
    set uint32(value: number) {
        throw new Error("Method not implemented.");
    }
    set uint(value: number) {
        throw new Error("Method not implemented.");
    }
    set udouble(value: number) {
        throw new Error("Method not implemented.");
    }
    set ulong(value: number) {
        throw new Error("Method not implemented.");
    }
    set int32le(value: number) {
        throw new Error("Method not implemented.");
    }
    set intle(value: number) {
        throw new Error("Method not implemented.");
    }
    set doublele(value: number) {
        throw new Error("Method not implemented.");
    }
    set longle(value: number) {
        throw new Error("Method not implemented.");
    }
    set uint32le(value: number) {
        throw new Error("Method not implemented.");
    }
    set uintle(value: number) {
        throw new Error("Method not implemented.");
    }
    set udoublele(value: number) {
        throw new Error("Method not implemented.");
    }
    set ulongle(value: number) {
        throw new Error("Method not implemented.");
    }
    set intbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set int32be(value: number) {
        throw new Error("Method not implemented.");
    }
    set doublebe(value: number) {
        throw new Error("Method not implemented.");
    }
    set longbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set writeUInt32BE(value: number) {
        throw new Error("Method not implemented.");
    }
    set uint32be(value: number) {
        throw new Error("Method not implemented.");
    }
    set uintbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set udoublebe(value: number) {
        throw new Error("Method not implemented.");
    }
    set ulongbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set float(value: number) {
        throw new Error("Method not implemented.");
    }
    set floatle(value: number) {
        throw new Error("Method not implemented.");
    }
    set floatbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set int64(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set quad(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set bigint(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set uint64(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set ubigint(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set uquad(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set int64le(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set bigintle(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set quadle(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set uint64le(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set ubigintle(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set uquadle(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set int64be(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set bigintbe(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set quadbe(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set uint64be(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set ubigintbe(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set uquadbe(value: BigValue) {
        throw new Error("Method not implemented.");
    }
    set doublefloat(value: number) {
        throw new Error("Method not implemented.");
    }
    set dfloat(value: number) {
        throw new Error("Method not implemented.");
    }
    set dfloatbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set doublefloatbe(value: number) {
        throw new Error("Method not implemented.");
    }
    set dfloatle(value: number) {
        throw new Error("Method not implemented.");
    }
    set doublefloatle(value: number) {
        throw new Error("Method not implemented.");
    }
    string(string: string, options?: stringOptions): void {
        throw new Error("Method not implemented.");
    }
    set str(string: string) {
        throw new Error("Method not implemented.");
    }
    utf8string(string: string, length?: stringOptions["length"], terminateValue?: stringOptions["terminateValue"]): void {
        throw new Error("Method not implemented.");
    }
    cstring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        throw new Error("Method not implemented.");
    }
    ansistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        throw new Error("Method not implemented.");
    }
    utf16string(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    unistring(string: string, length?: number, terminateValue?: stringOptions["terminateValue"], endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    utf16stringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        throw new Error("Method not implemented.");
    }
    unistringle(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        throw new Error("Method not implemented.");
    }
    utf16stringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        throw new Error("Method not implemented.");
    }
    unistringbe(string: string, length?: number, terminateValue?: stringOptions["terminateValue"]): void {
        throw new Error("Method not implemented.");
    }
    pstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    pstring1(string: string, endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    pstring1le(string: string): void {
        throw new Error("Method not implemented.");
    }
    pstring1be(string: string): void {
        throw new Error("Method not implemented.");
    }
    pstring2(string: string, endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    pstring2le(string: string): void {
        throw new Error("Method not implemented.");
    }
    pstring2be(string: string): void {
        throw new Error("Method not implemented.");
    }
    pstring4(string: string, endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    pstring4be(string: string): void {
        throw new Error("Method not implemented.");
    }
    pstring4le(string: string): void {
        throw new Error("Method not implemented.");
    }
    wpstring(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"], endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    wpstringbe(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void {
        throw new Error("Method not implemented.");
    }
    wpstringle(string: string, lengthWriteSize?: stringOptions["lengthWriteSize"]): void {
        throw new Error("Method not implemented.");
    }
    wpstring1(string: string, endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    wpstring1be(string: string): void {
        throw new Error("Method not implemented.");
    }
    wpstring1le(string: string): void {
        throw new Error("Method not implemented.");
    }
    wpstring2(string: string, endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    wpstring2le(string: string): void {
        throw new Error("Method not implemented.");
    }
    wpstring2be(string: string): void {
        throw new Error("Method not implemented.");
    }
    wpstring4(string: string, endian?: stringOptions["endian"]): void {
        throw new Error("Method not implemented.");
    }
    wpstring4le(string: string): void {
        throw new Error("Method not implemented.");
    }
    wpstring4be(string: string): void {
        throw new Error("Method not implemented.");
    }
};

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
const BiWriterStream = applyBinaryAliasWriter(BiWriterStreamer);

export { BiWriterStream };