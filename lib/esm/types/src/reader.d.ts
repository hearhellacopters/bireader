/// <reference types="node" />
/**
*
* byte reader, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
* @param {number} byteOffset - byte offset to start reader, default is 0
* @param {number} bitOffset - bit offset to start reader, 0-7
* @param {string} endianness - endianness ```big``` or ```little``` (default ```little```)
*/
export default class bireader {
    endian: string;
    offset: number;
    bitoffset: number;
    size: number;
    data: Array<Buffer | Uint8Array>;
    private check_size;
    private isBuffer;
    private isBufferOrUint8Array;
    /**
    *
    * byte reader, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ```Buffer``` or ```Uint8Array```
    * @param {number} byteOffset - byte offset to start reader, default is 0
    * @param {number} bitOffset - bit offset to start reader, 0-7
    * @param {string} endianness - endianness ```big``` or ```little``` (default ```little```)
    */
    constructor(data: Array<Buffer | Uint8Array>, byteOffset?: number, bitOffset?: number, endianness?: string);
    /**
    *
    * Change endian, defaults to little
    *
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - endianness ```big``` or ```little```
    */
    endianness(endian: string): void;
    /**
    *Sets endian to big
    */
    bigEndian(): void;
    /**
    *Sets endian to big
    */
    big(): void;
    /**
    *Sets endian to big
    */
    be(): void;
    /**
    * Sets endian to little
    */
    littleEndian(): void;
    /**
    * Sets endian to little
    */
    little(): void;
    /**
    * Sets endian to little
    */
    le(): void;
    /**
    * Move current read byte or bit position
    *
    * @param {number} bytes - bytes to skip
    * @param {number} bits - bits to skip
    */
    skip(bytes: number, bits?: number): void;
    /**
    * Move current read byte or bit position
    *
    * @param {number} bytes - bytes to skip
    * @param {number} bits - bits to skip
    */
    fskip(bytes: number, bits?: number): void;
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    goto(byte: number, bit?: number): void;
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    seek(byte: number, bit?: number): void;
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    fseek(byte: number, bit?: number): void;
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    jump(byte: number, bit?: number): void;
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    pointer(byte: number, bit?: number): void;
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    warp(byte: number, bit?: number): void;
    /**
    * Change current byte or bit read position
    *
    * @param {number} byte - byte to jump to
    * @param {number} bit - bit to jump to (0-7)
    */
    fsetpos(byte: number, bit?: number): void;
    /**
    * Set offset to start of file
    */
    rewind(): void;
    /**
    * Set offset to start of file
    */
    gotostart(): void;
    /**
    * Set offset to start of file
    */
    tostart(): void;
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    ftell(): number;
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    tell(): number;
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    fgetpos(): number;
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    clip(startOffset?: number, endOffset?: number): Array<Buffer | Uint8Array>;
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    crop(startOffset?: number, endOffset?: number): Array<Buffer | Uint8Array>;
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    truncate(startOffset?: number, endOffset?: number): Array<Buffer | Uint8Array>;
    /**
    * Truncates array from start to current position unless supplied
    * Note: Does not affect supplied data
    * @param {number} startOffset - Start location, default 0
    * @param {number} endOffset - end location, default current write position
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    slice(startOffset?: number, endOffset?: number): Array<Buffer | Uint8Array>;
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    extract(length: number): Array<Buffer | Uint8Array>;
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    wrap(length: number): Array<Buffer | Uint8Array>;
    /**
    * Extract array from current position to length supplied
    * Note: Does not affect supplied data
    * @param {number} length - length of data to copy from current offset
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    lift(length: number): Array<Buffer | Uint8Array>;
    /**
    * Returns current data
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get(): Array<Buffer | Uint8Array>;
    /**
    * Returns current data
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return(): Array<Buffer | Uint8Array>;
    /**
    * removes reading data
    */
    end(): void;
    /**
    * removes reading data
    */
    close(): void;
    /**
    * removes reading data
    */
    done(): void;
    /**
    * removes reading data
    */
    finished(): void;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    readBit(bits?: number, unsigned?: boolean, endian?: string): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little`
    * @returns number
    */
    bit(bits: number, unsigned?: boolean, endian?: string): number;
    /**
* Bit field reader
*
* Note: When returning to a byte read, remaining bits are dropped
*
* @param {boolean} unsigned - if the value is unsigned
* @returns number
*/
    bit1(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32le(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32be(unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32le(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32be(): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitBE(bits: number): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitbe(bits: number): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    readBitBE(bits: number, unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitbe(bits: number, unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitLE(bits: number): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitle(bits: number): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    readBitLE(bits: number, unsigned?: boolean): number;
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitle(bits: number, unsigned?: boolean): number;
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    readByte(unsigned?: boolean): number;
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    byte(unsigned?: boolean): number;
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    int8(unsigned?: boolean): number;
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    readUByte(): number;
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    uint8(): number;
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    ubyte(): number;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt16(unsigned?: boolean, endian?: string): number;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int16(unsigned?: boolean, endian?: string): number;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    short(unsigned?: boolean, endian?: string): number;
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    word(unsigned?: boolean, endian?: string): number;
    /**
    * Read unsigned short
    *
    * @param {string} endian - ```big``` or ```little```
    *
    * @returns number
    */
    readUInt16(endian?: string): number;
    /**
    * Read unsigned short
    *
    * @param {string} endian - ```big``` or ```little```
    *
    * @returns number
    */
    uint16(endian?: string): number;
    /**
    * Read unsigned short
    *
    * @param {string} endian - ```big``` or ```little```
    *
    * @returns number
    */
    ushort(endian?: string): number;
    /**
    * Read unsigned short
    *
    * @param {string} endian - ```big``` or ```little```
    *
    * @returns number
    */
    uword(endian?: string): number;
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    readUInt16LE(): number;
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    uint16le(): number;
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    ushortle(): number;
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    uwordle(): number;
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    readInt16LE(): number;
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    int16le(): number;
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    shortle(): number;
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    wordle(): number;
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    readUInt16BE(): number;
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    uint16be(): number;
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    ushortbe(): number;
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    uwordbe(): number;
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    readInt16BE(): number;
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    int16be(): number;
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    shortbe(): number;
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    wordbe(): number;
    /**
    * Read half float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readHalfFloat(endian?: string): number;
    /**
    * Read half float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    halffloat(endian?: string): number;
    /**
    * Read half float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    half(endian?: string): number;
    /**
    * Read half float
    *
    * @returns number
    */
    readHalfFloatBE(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    halffloatbe(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    halfbe(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    readHalfFloatLE(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    halffloatle(): number;
    /**
    * Read half float
    *
    * @returns number
    */
    halfle(): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt32(unsigned?: boolean, endian?: string): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int(unsigned?: boolean, endian?: string): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    double(unsigned?: boolean, endian?: string): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int32(unsigned?: boolean, endian?: string): number;
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    long(unsigned?: boolean, endian?: string): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    readUInt(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    udouble(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint32(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    ulong(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readInt32BE(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    intbe(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    doublebe(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    int32be(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    longbe(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    readUInt32BE(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uintbe(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    udoublebe(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint32be(): number;
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    ulongbe(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readInt32LE(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    intle(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    doublele(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    int32le(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    longle(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readUInt32LE(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    uintle(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    udoublele(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    uint32le(): number;
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    ulongle(): number;
    /**
    * Read float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readFloat(endian?: string): number;
    /**
    * Read float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    float(endian?: string): number;
    /**
    * Read float
    *
    * @returns number
    */
    readFloatBE(): number;
    /**
    * Read float
    *
    * @returns number
    */
    floatbe(): number;
    /**
    * Read float
    *
    * @returns number
    */
    readFloatLE(): number;
    /**
    * Read float
    *
    * @returns number
    */
    floatle(): number;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readInt64(unsigned?: boolean, endian?: string): bigint;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    int64(unsigned?: boolean, endian?: string): bigint;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    bigint(unsigned?: boolean, endian?: string): bigint;
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    quad(unsigned?: boolean, endian?: string): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigint(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquad(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    readInt64BE(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    int64be(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    bigintbe(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    quadbe(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64BE(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64be(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigintbe(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquadbe(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    readInt64LE(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    int64le(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    bigintle(): bigint;
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    quadle(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64LE(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64le(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigintle(): bigint;
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquadle(): bigint;
    /**
    * Read double float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    readDoubleFloat(endian?: string): number;
    /**
    * Read double float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    doublefloat(endian?: string): number;
    /**
    * Read double float
    *
    * @param {string} endian - ```big``` or ```little```
    * @returns number
    */
    dfloat(endian?: string): number;
    /**
    * Read double float
    *
    * @returns number
    */
    readDoubleFloatBE(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    dfloatebe(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    doublefloatbe(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    readDoubleFloatLE(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    dfloatle(): number;
    /**
    * Read double float
    *
    * @returns number
    */
    doublefloatle(): number;
    /**
    * Reads string, use options object for different types
    *
    * @param {object} options
    * ```javascript
    * {
    *  length: number, //for fixed length, non-terminate value utf strings
    *  stringType: "utf-8", //utf-8, utf-16, pascal or wide-pascal
    *  terminateValue: 0x00, // only for non-fixed length utf strings
    *  lengthReadSize: 1, //for pascal strings. 1, 2 or 4 byte length read size
    *  stripNull: true, // removes 0x00 characters
    *  encoding: "utf-8", //TextEncoder accepted types
    *  endian: "little", //for wide-pascal and utf-16
    * }
    * ```
    * @return string
    */
    readString(options?: {
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthReadSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): string;
    string(options?: {
        length?: number;
        stringType?: string;
        terminateValue?: number;
        lengthReadSize?: number;
        stripNull?: boolean;
        encoding?: string;
        endian?: string;
    }): string;
    /**
    * Reads UTF-8 (C) string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf8string(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-8 (C) string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    cstring(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads ANSI string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    ansistring(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-16 (Unicode) string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    utf16string(length?: number, terminateValue?: number, stripNull?: boolean, endian?: string): string;
    /**
    * Reads UTF-16 (Unicode) string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    unistring(length?: number, terminateValue?: number, stripNull?: boolean, endian?: string): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf16stringle(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-16 (Unicode) string in little endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    unistringle(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf16stringbe(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads UTF-16 (Unicode) string in big endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    unistringbe(length?: number, terminateValue?: number, stripNull?: boolean): string;
    /**
    * Reads Pascal string
    *
    * @param {number} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring(lengthReadSize?: number, stripNull?: boolean, endian?: string): string;
    /**
    * Reads Pascal string 1 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring1(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Pascal string 1 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1le(stripNull?: boolean): string;
    /**
    * Reads Pascal string 1 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1be(stripNull?: boolean): string;
    /**
    * Reads Pascal string 2 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring2(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Pascal string 2 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2le(stripNull?: boolean): string;
    /**
    * Reads Pascal string 2 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2be(stripNull?: boolean): string;
    /**
    * Reads Pascal string 4 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring4(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Pascal string 4 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4le(stripNull?: boolean): string;
    /**
    * Reads Pascal string 4 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4be(stripNull?: boolean): string;
    /**
    * Reads Wide-Pascal string
    *
    * @param {number} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring(lengthReadSize?: number, stripNull?: boolean, endian?: string): string;
    /**
    * Reads Wide-Pascal string 1 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring1(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Wide-Pascal string 2 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring2(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2le(stripNull?: boolean): string;
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2be(stripNull?: boolean): string;
    /**
    * Reads Wide-Pascal string 4 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring4(stripNull?: boolean, endian?: string): string;
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4be(stripNull?: boolean): string;
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4le(stripNull?: boolean): string;
}
//# sourceMappingURL=reader.d.ts.map