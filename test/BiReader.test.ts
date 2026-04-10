import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';
import { BiReader, BiWriter } from '../dist/esm/indexImport.js';

/**
 * Base path where server is running.
 * 
 * @returns {string} directory name
 */
function _init_dir_name() {
    // @ts-ignore
    if (process.pkg) {
        return path.dirname(process.execPath);
    } else {
        return process.cwd();
    }
};

function _fileExists(filePath: string) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);

        return true;  // File exists
    } catch (error) {
        // @ts-ignore
        return false;
    }
};

const __dirname = _init_dir_name();

const tmp = path.join(__dirname, 'test.bin');

describe('BiReader / BiWriter – Comprehensive Test Suite', () => {
    let reader: BiReader<Uint8Array, boolean>;
    let writer: BiWriter<Uint8Array, boolean>;
    let readerFile: BiReader<string, boolean>;
    let writerFile: BiWriter<string, boolean>;

    beforeEach(() => {
        readerFile = new BiReader<string, boolean>(tmp);
        writerFile = new BiWriter<string, boolean>(tmp);
        writer = new BiWriter(new Uint8Array([
            0x01, 0x02, 0x03, 0x04,             // bytes for int16/32 tests
            0x78, 0x56, 0x34, 0x12,             // LE 0x12345678
            0x00, 0x00, 0x80, 0x3F,             // LE float 1.0
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x3F, // LE double 1.0
            0x00, 0x3C,                         // half-float 1.0 (IEEE 754)
            0xAB, 0xCD, 0xEF, 0x01,             // for bitfields & strings
            0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x00  // "Hello\0"
        ]));
        reader = new BiReader(writer.data);
        reader.enforceBigInt = false;   // default for tests
        reader.strict = false;
        reader.endianness('little');
    });

    afterEach(() => {
        readerFile.close();
        writerFile.close();
        if(_fileExists(tmp)){
            fs.unlinkSync(tmp);
        }
    });

    it('bitOffset read tests', () => {
        const r = new BiReader(new Uint8Array([0x78, 0x56, 0x34, 0x12, 0xBA, 0xDC, 0xEF, 0x3F]));
        // unsigned 64 bits read in little
        r.goto(0); r.le();

        expect(r.ubit1).to.equal(0);

        expect(r.ubit2).to.equal(0);

        expect(r.ubit3).to.equal(7);

        expect(r.ubit4).to.equal(9);

        expect(r.ubit5).to.equal(21);

        expect(r.ubit6).to.equal(40);

        expect(r.ubit7).to.equal(17);

        expect(r.ubit8).to.equal(161);

        expect(r.ubit9).to.equal(459);

        expect(r.ubit10).to.equal(894);

        expect(r.ubit9).to.equal(127);
        // unsigned 64 bits read in big
        r.goto(0); r.be();

        expect(r.ubit1).to.equal(0);

        expect(r.ubit2).to.equal(3);

        expect(r.ubit3).to.equal(6);

        expect(r.ubit4).to.equal(1);

        expect(r.ubit5).to.equal(11);

        expect(r.ubit6).to.equal(6);

        expect(r.ubit7).to.equal(65);

        expect(r.ubit8).to.equal(43);

        expect(r.ubit9).to.equal(347);

        expect(r.ubit10).to.equal(631);

        expect(r.ubit9).to.equal(319);
        // signed 64 bits read in little
        r.goto(0); r.le();

        expect(r.bit1).to.equal(0);

        expect(r.bit2).to.equal(0);

        expect(r.bit3).to.equal(-1);

        expect(r.bit4).to.equal(-7);

        expect(r.bit5).to.equal(-11);

        expect(r.bit6).to.equal(-24);

        expect(r.bit7).to.equal(17);

        expect(r.bit8).to.equal(-95);

        expect(r.bit9).to.equal(-53);

        expect(r.bit10).to.equal(-130);

        expect(r.bit9).to.equal(127);
        // signed 64 bits read in big
        r.goto(0); r.be();

        expect(r.bit1).to.equal(0);

        expect(r.bit2).to.equal(-1);

        expect(r.bit3).to.equal(-2);

        expect(r.bit4).to.equal(1);

        expect(r.bit5).to.equal(11);

        expect(r.bit6).to.equal(6);

        expect(r.bit7).to.equal(-63);

        expect(r.bit8).to.equal(43);

        expect(r.bit9).to.equal(-165);

        expect(r.bit10).to.equal(-393);

        expect(r.bit9).to.equal(-193);
    });

    // ==================== BYTE (8-bit) ====================
    it('reads and writes all byte variants (ubyte, byte, uint8, int8)', () => {
        expect(reader.ubyte).to.equal(0x01); reader.goto(0);
        expect(reader.byte).to.equal(1); reader.goto(0);
        expect(reader.uint8).to.equal(0x01); reader.goto(0);
        expect(reader.int8).to.equal(1); reader.goto(0);

        writer.ubyte = 0xFF;
        expect(writer.data[0]).to.equal(0xFF);

        writer.int8 = -1;
        expect(new BiReader(writer.data).int8).to.equal(-1);
    });

    // ==================== INT16 / UINT16 ====================
    it('reads and writes int16/uint16 (all LE/BE presets + master)', () => {
        reader.goto(0);
        expect(reader.int16le).to.equal(0x0201); reader.goto(0);
        expect(reader.uint16be).to.equal(0x0102);

        writer.goto(0);
        writer.int16le = 0x1234;
        const r = new BiReader(writer.data);
        expect(r.int16le).to.equal(4660); r.goto(0);
        expect(r.uint16be).to.equal(13330);
    });

    // ==================== FLOAT16 (HALF-FLOAT) ====================
    it('reads and writes half-float (halffloatle / halffloatbe) – tests DataView fast path', () => {
        reader.goto(20); // position of the 0x00, 0x3C half-float 1.0
        expect(reader.halffloatle).to.be.closeTo(1.0, 0.001); reader.goto(20);
        expect(reader.halffloatbe).to.be.closeTo(3.576279e-06, 0.00001); // swapped bytes

        writer.goto(20);
        writer.halffloatle = 3.1416;
        const roundtrip = new BiReader(writer.data);
        roundtrip.goto(20);
        expect(roundtrip.halffloatle).to.be.closeTo(3.1416, 0.001);
    });

    // ==================== INT32 / UINT32 ====================
    it('reads and writes int32/uint32 (LE/BE + aligned DataView path)', () => {
        reader.goto(4);
        expect(reader.int32le).to.equal(0x12345678); reader.goto(4);
        expect(reader.uint32be).to.equal(0x78563412);

        writer.goto(0);
        writer.uint32le = 0xDEADBEEF; // -559038737
        expect(new BiReader(writer.data).int32le).to.equal(-559038737);
    });

    // ==================== FLOAT32 ====================
    it('reads and writes float32 (floatle / floatbe)', () => {
        reader.goto(8);
        expect(reader.floatle).to.equal(1.0);

        writer.goto(0);
        writer.floatle = 2.5;
        expect(new BiReader(writer.data).floatle).to.equal(2.5);
    });

    // ==================== INT64 / UINT64 + enforceBigInt ====================
    it('reads and writes int64/uint64 with enforceBigInt toggle', () => {
        reader.goto(12);
        reader.enforceBigInt = true;
        expect(reader.int64le).to.equal(0x3FF0000000000000n); reader.goto(12);
        expect(reader.uint64be).to.equal(0x000000000000F03Fn); // swapped

        reader.enforceBigInt = false; reader.goto(8);
        expect(reader.int64le).to.equal(1065353216); // number when safe

        writer.goto(16);
        writer.int64le = 0x123456789ABCDEF0n;
        const r = new BiReader(writer.data);
        r.enforceBigInt = true;
        r.goto(16);
        expect(r.int64le).to.equal(0x123456789ABCDEF0n);
    });

    // ==================== FLOAT64 (DOUBLE) ====================
    it('reads and writes doublefloat / dfloat', () => {
        reader.goto(12);
        expect(reader.doublefloatle).to.equal(1.0); reader.goto(12);
        expect(reader.dfloatle).to.equal(1.0);

        writer.goto(0);
        writer.doublefloatle = Math.PI;
        expect(new BiReader(writer.data).doublefloatle).to.be.closeTo(Math.PI, 0.000001);
    });

    // ==================== BITFIELDS (1–32 bits, signed/unsigned, aligned + non-aligned) ====================
    describe('Bitfield operations (rbit / wbit + presets)', () => {
        it('reads bit presets (ubit4, bit4, ubit8, etc.)', () => {
            reader.goto(22); // 0xAB = 10101011
            expect(reader.bit4).to.equal(-5);     // signed? first nibble
            expect(reader.ubit4).to.equal(10);
            expect(reader.bit4).to.equal(-3);     // next nibble after auto-advance
            expect(reader.ubyte).to.equal(0xEF);      // next byte
        });

        it('writes bit presets and verifies', () => {
            writer.goto(20);
            writer.ubit4be = 0b1101;
            writer.ubit4be = 0b1010;
            const r = new BiReader(writer.data);
            r.goto(20);
            expect(r.ubit8).to.equal(0b11011010);
        });

        it('non-aligned bit reads/writes (fallback path)', () => {
            reader.goto(22);
            reader.insetBit = 3;                    // force non-aligned
            expect(reader.ubit5).to.equal(21);  // bits starting at offset 3 in 0xAB
        });

        it('generic readBit / writeBit (any bit count)', () => {
            reader.goto(22);
            expect(reader.readBit(3)).to.equal(3); // first 3 bits of 0xAB
            writer.goto(0);
            writer.writeBit(3, 3);
            expect(new BiReader(writer.data).ubit3).to.equal(3);
        });
    });

    it('BiReader / BiWriter file operations (Node only)', () => {
        writerFile.strict = false;

        writerFile.open();

        writerFile.errorDump = false;

        writerFile.uint32le = 0xCAFEBABE;

        writerFile.close();

        const r = new BiReader(tmp);

        r.errorDump = false;

        r.open();

        expect(r.uint32le).to.equal(0xCAFEBABE);
    });

    // ==================== STRINGS (all presets + master readString/writeString) ====================
    describe('String operations', () => {
        it('reads null-terminated / cstring / utf8string', () => {
            reader.goto(26);
            expect(reader.cstring()).to.equal('Hello'); reader.goto(26);
            expect(reader.utf8string(5)).to.equal('Hello');
        });

        it('reads/writes Pascal strings (pstring1le, pstring2be, etc.)', () => {
            writer.goto(0);
            writer.pstring1le('Hi');
            const r = new BiReader(writer.data);
            r.goto(0);
            expect(r.pstring1le()).to.equal('Hi');
            writer.goto(0);
            writer.pstring2be('Test');
            expect(new BiReader(writer.data).pstring2be()).to.equal('Test');
        });

        it('reads/writes wide / UTF-16 strings', () => {
            writer.wpstring2le('世界');
            const r = new BiReader(writer.data);
            expect(r.wpstring2le()).to.equal('世界');
        });

        it('master readString / writeString with custom options', () => {
            writer.writeString('Hello World', { stringType: 'utf-8', terminateValue: 0, length: 11 });
            reader.goto(0);
            expect(reader.readString({ stringType: 'utf-8', length: 11 })).to.equal('Hello World');
        });
    });

    // ==================== MATH HELPERS (XOR, LSHIFT, etc.) ====================
    describe('Math helpers (xor, lShift, rShift, etc.)', () => {
        it('xor and xorThis roundtrip', () => {
            const original = writer.data.slice(0, 8);
            writer.xor(0xAA, 0, 8);                    // XOR entire range with 0xAA
            expect(writer.data[0]).to.equal(original[0] ^ 0xAA);

            writer.xorThis(0xAA, 8);                   // revert
            expect(writer.data.slice(0, 8)).to.deep.equal(original);
        });

        it('lShift and rShift (left/right shift)', () => {
            writer.goto(0);
            const origByte = writer.data[0];
            writer.lShift(1, 0, 1);                    // shift first byte left by 1
            expect(writer.data[0]).to.equal((origByte << 1) & 0xFF);
            writer.goto(0);
            writer.rShift(1, 0, 1);                    // shift back
            expect(writer.data[0]).to.equal(origByte);
        });

        it('and / or / add / not helpers', () => {
            const original = writer.data.slice(0, 8);
            writer.goto(0);
            writer.and(0x0F, 0, 1);                    // AND first byte with 0x0F
            expect(writer.data[0] & 0xF0).to.equal(0); // high nibble cleared

            writer.not(0, 1);                          // NOT first byte
            expect(writer.data[0]).to.equal(~(original[0] & 0x0F) & 0xFF);
        });
    });

    // ==================== EDGE CASES & INTEGRATION ====================
    it('strict mode throws on out-of-bounds', () => {
        reader.strict = true;
        expect(() => reader.goto(9999)).to.throw(/Reached end of data/);
    });

    it('endianness switch mid-read', () => {
        reader.endianness('big');
        reader.goto(0);
        expect(reader.int32).to.equal(16909060);
        reader.endianness('little');
        expect(reader.int32).to.equal(305419896);
    });

    it('bitoffset persists across multi-byte reads (fallback path)', () => {
        reader.goto(22, 2);
        reader.insetBit = 2;
        expect(reader.ubit6).to.equal(42); // 101011 bits 2-7 of 0xAB
        expect(reader.insetBit).to.equal(0);
    });

    it('roundtrip full buffer (write everything then read back)', () => {
        const w = new BiWriter(new Uint8Array(48));
        w.int32le = 0x12345678;
        w.halffloatle = 1.5;
        w.floatle = Math.PI;
        w.doublefloatle = Math.E;
        w.pstring2le('TestString');
        w.ubit8 = 0xFF;

        const r = new BiReader(w.data);
        expect(r.int32le).to.equal(0x12345678);
        expect(r.halffloatle).to.be.closeTo(1.5, 0.001);
        expect(r.floatle).to.be.closeTo(Math.PI, 0.000001);
        expect(r.doublefloatle).to.be.closeTo(Math.E, 0.000001);
        expect(r.pstring2le()).to.equal('TestString');
        expect(r.ubit8).to.equal(0xFF);
    });
});