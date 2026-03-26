import * as fs from 'fs';
import * as path from 'path';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BiReaderAsync, BiWriterAsync } from '../dist/index.esm.js';

use(chaiAsPromised);

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

describe('BiReaderAsync / BiWriterAsync – Comprehensive Test Suite', async () => {
    let reader: BiReaderAsync<Uint8Array, boolean>;
    let writer: BiWriterAsync<Uint8Array, boolean>;
    let readerFile: BiReaderAsync<Buffer, boolean>;
    let writerFile: BiWriterAsync<Buffer, boolean>;

    beforeEach(() => {
        readerFile = new BiReaderAsync<Buffer, boolean>(tmp);
        writerFile = new BiWriterAsync<Buffer, boolean>(tmp);
        writer = new BiWriterAsync(new Uint8Array([
            0x01, 0x02, 0x03, 0x04,             // bytes for int16/32 tests
            0x78, 0x56, 0x34, 0x12,             // LE 0x12345678
            0x00, 0x00, 0x80, 0x3F,             // LE float 1.0
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x3F, // LE double 1.0
            0x00, 0x3C,                         // half-float 1.0 (IEEE 754)
            0xAB, 0xCD, 0xEF, 0x01,             // for bitfields & strings
            0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x00  // "Hello\0"
        ]));
        reader = new BiReaderAsync(writer.data);
        reader.enforceBigInt = false;   // default for tests
        reader.strict = false;
        reader.endianness('little');
    });

    afterEach(async () => {
        await readerFile.close();
        await writerFile.close();
        if(_fileExists(tmp)){
            fs.unlinkSync(tmp);
        }
    });

    it('bitOffset read tests', async () => {
        const r = new BiReaderAsync(new Uint8Array([0x78, 0x56, 0x34, 0x12, 0xBA, 0xDC, 0xEF, 0x3F]));
        // unsigned 64 bits read in little
        await r.open(); await r.goto(0); r.le();

        expect(await r.ubit1()).to.equal(0);

        expect(await r.ubit2()).to.equal(0);

        expect(await r.ubit3()).to.equal(7);

        expect(await r.ubit4()).to.equal(9);

        expect(await r.ubit5()).to.equal(21);

        expect(await r.ubit6()).to.equal(40);

        expect(await r.ubit7()).to.equal(17);

        expect(await r.ubit8()).to.equal(161);

        expect(await r.ubit9()).to.equal(459);

        expect(await r.ubit10()).to.equal(894);

        expect(await r.ubit9()).to.equal(127);
        // unsigned 64 bits read in big
        await r.goto(0); r.be();

        expect(await r.ubit1()).to.equal(0);

        expect(await r.ubit2()).to.equal(3);

        expect(await r.ubit3()).to.equal(6);

        expect(await r.ubit4()).to.equal(1);

        expect(await r.ubit5()).to.equal(11);

        expect(await r.ubit6()).to.equal(6);

        expect(await r.ubit7()).to.equal(65);

        expect(await r.ubit8()).to.equal(43);

        expect(await r.ubit9()).to.equal(347);

        expect(await r.ubit10()).to.equal(631);

        expect(await r.ubit9()).to.equal(319);
        // signed 64 bits read in little
        await r.goto(0); r.le();

        expect(await r.bit1()).to.equal(0);

        expect(await r.bit2()).to.equal(0);

        expect(await r.bit3()).to.equal(-1);

        expect(await r.bit4()).to.equal(-7);

        expect(await r.bit5()).to.equal(-11);

        expect(await r.bit6()).to.equal(-24);

        expect(await r.bit7()).to.equal(17);

        expect(await r.bit8()).to.equal(-95);

        expect(await r.bit9()).to.equal(-53);

        expect(await r.bit10()).to.equal(-130);

        expect(await r.bit9()).to.equal(127);
        // signed 64 bits read in big
        await r.goto(0); r.be();

        expect(await r.bit1()).to.equal(0);

        expect(await r.bit2()).to.equal(-1);

        expect(await r.bit3()).to.equal(-2);

        expect(await r.bit4()).to.equal(1);

        expect(await r.bit5()).to.equal(11);

        expect(await r.bit6()).to.equal(6);

        expect(await r.bit7()).to.equal(-63);

        expect(await r.bit8()).to.equal(43);

        expect(await r.bit9()).to.equal(-165);

        expect(await r.bit10()).to.equal(-393);

        expect(await r.bit9()).to.equal(-193);
    });

    // ==================== BYTE (8-bit) ====================
    it('reads and writes all byte variants (ubyte, byte, uint8, int8)', async () => {
        await reader.open();
        expect(await reader.ubyte()).to.equal(0x01); await reader.goto(0);
        expect(await reader.byte()).to.equal(1); await reader.goto(0);
        expect(await reader.uint8()).to.equal(0x01); await reader.goto(0);
        expect(await reader.int8()).to.equal(1); await reader.goto(0);

        await writer.open();
        await writer.ubyte(0xFF);
        expect((await writer.get())[0]).to.equal(0xFF);

        await writer.int8(-1);
        expect(await new BiReaderAsync(writer.data).int8()).to.equal(-1);
    });

    // ==================== INT16 / UINT16 ====================
    it('reads and writes int16/uint16 (all LE/BE presets + master)', async () => {
        await reader.open();
        await reader.goto(0);
        expect(await reader.int16le()).to.equal(0x0201); await reader.goto(0);
        expect(await reader.uint16be()).to.equal(0x0102);

        await writer.open();
        await writer.goto(0);
        await writer.int16le(0x1234);
        const r = new BiReaderAsync(writer.data);
        expect(await r.int16le()).to.equal(4660); await r.goto(0);
        expect(await r.uint16be()).to.equal(13330);
    });

    // ==================== FLOAT16 (HALF-FLOAT) ====================
    it('reads and writes half-float (halffloatle / halffloatbe) – tests DataView fast path', async () => {
        await reader.open();
        await reader.goto(20); // position of the 0x00, 0x3C half-float 1.0
        expect(await reader.halffloatle()).to.be.closeTo(1.0, 0.001); await reader.goto(20);
        expect(await reader.halffloatbe()).to.be.closeTo(3.576279e-06, 0.00001); // swapped bytes

        await writer.open();
        await writer.goto(20);
        await writer.halffloatle(3.1416);
        const roundtrip = new BiReaderAsync(writer.data); await roundtrip.open();
        await roundtrip.goto(20);
        expect(await roundtrip.halffloatle()).to.be.closeTo(3.1416, 0.001);
    });

    // ==================== INT32 / UINT32 ====================
    it('reads and writes int32/uint32 (LE/BE + aligned DataView path)', async () => {
        await reader.goto(4);
        expect(await reader.int32le()).to.equal(0x12345678); await reader.goto(4);
        expect(await reader.uint32be()).to.equal(0x78563412);

        await writer.open();
        await writer.goto(0);
        await writer.uint32le(0xDEADBEEF); // -559038737
        expect(await new BiReaderAsync(writer.data).int32le()).to.equal(-559038737);
    });

    // ==================== FLOAT32 ====================
    it('reads and writes float32 (floatle / floatbe)', async() => {
        await reader.open();
        await reader.goto(8);
        expect(await reader.floatle()).to.equal(1.0);

        await writer.open();
        await writer.goto(0);
        await writer.floatle(2.5);
        expect(await new BiReaderAsync(writer.data).floatle()).to.equal(2.5);
    });

    // ==================== INT64 / UINT64 + enforceBigInt ====================
    it('reads and writes int64/uint64 with enforceBigInt toggle', async () => {
        await reader.open();
        await reader.goto(12);
        reader.enforceBigInt = true;
        expect(await reader.int64le()).to.equal(0x3FF0000000000000n); await reader.goto(12);
        expect(await reader.uint64be()).to.equal(0x000000000000F03Fn); // swapped

        reader.enforceBigInt = false; await reader.goto(8);
        expect(await reader.int64le()).to.equal(1065353216); // number when safe

        await writer.open();
        await writer.goto(16);
        await writer.int64le(0x123456789ABCDEF0n);
        const r = new BiReaderAsync(writer.data);
        r.enforceBigInt = true;
        await r.goto(16);
        expect(await r.int64le()).to.equal(0x123456789ABCDEF0n);
    });

    // ==================== FLOAT64 (DOUBLE) ====================
    it('reads and writes doublefloat / dfloat', async () => {
        await reader.open();
        await reader.goto(12);
        expect(await reader.doublefloatle()).to.equal(1.0); await reader.goto(12);
        expect(await reader.dfloatle()).to.equal(1.0);

        await writer.open();
        await writer.goto(0);
        await writer.doublefloatle(Math.PI);
        expect(await new BiReaderAsync(writer.data).doublefloatle()).to.be.closeTo(Math.PI, 0.000001);
    });

    // ==================== BITFIELDS (1–32 bits, signed/unsigned, aligned + non-aligned) ====================
    describe('Bitfield operations (rbit / wbit + presets)', async () => {
        it('reads bit presets (ubit4, bit4, ubit8, etc.)', async () => {
            await reader.open()
            await reader.goto(22); // 0xAB = 10101011
            expect(await reader.bit4()).to.equal(-5);     // signed? first nibble
            expect(await reader.ubit4()).to.equal(10);
            expect(await reader.bit4()).to.equal(-3);     // next nibble after auto-advance
            expect(await reader.ubyte()).to.equal(0xEF);      // next byte
        });

        it('writes bit presets and verifies', async () => {
            await writer.open();
            await writer.goto(20);
            await writer.ubit4be (0b1101);
            await writer.ubit4be (0b1010);
            const r = new BiReaderAsync(writer.data);
            await r.open();
            await r.goto(20);
            expect(await r.ubit8()).to.equal(0b11011010);
        });

        it('non-aligned bit reads/writes (fallback path)', async () => {
            await reader.open()
            await reader.goto(22);
            await reader.setInsetBit(3);                    // force non-aligned
            expect(await reader.ubit5()).to.equal(21);  // bits starting at offset 3 in 0xAB
        });

        it('generic readBit / writeBit (any bit count)', async () => {
            await reader.open();
            await reader.goto(22);
            expect(await reader.readBit(3)).to.equal(3); // first 3 bits of 0xAB
            await writer.open();
            await writer.goto(0);
            await writer.writeBit(3, 3);
            expect(await new BiReaderAsync(writer.data).ubit3()).to.equal(3);
        });
    });

    it('BiReaderAsync / BiWriterAsync file operations (Node only)', async () => {
        writerFile.strict = false;

        await writerFile.open();

        writerFile.errorDump = false;

        await writerFile.uint32le(0xCAFEBABE);

        await writerFile.close();

        const r = new BiReaderAsync(tmp);

        r.errorDump = false;

        await r.open();

        expect(await r.uint32le()).to.equal(0xCAFEBABE);
    });

    // ==================== STRINGS (all presets + master readString/writeString) ====================
    describe('String operations', async () => {
        it('reads null-terminated / cstring / utf8string', async () => {
            await reader.open()
            await reader.goto(26);
            expect(await reader.cstring()).to.equal('Hello'); await reader.goto(26);
            expect(await reader.utf8string(5)).to.equal('Hello');
        });

        it('reads/writes Pascal strings (pstring1le, pstring2be, etc.)', async () => {
            await writer.open();
            await writer.goto(0);
            await writer.pstring1le('Hi');
            const r = new BiReaderAsync(writer.data);
            await r.open();
            await r.goto(0);
            expect(await r.pstring1le()).to.equal('Hi');
            await writer.goto(0);
            await writer.pstring2be('Test');
            expect(await new BiReaderAsync(writer.data).pstring2be()).to.equal('Test');
        });

        it('reads/writes wide / UTF-16 strings', async () => {
            await writer.open();
            await writer.wpstring2le('世界');
            const r = new BiReaderAsync(writer.data);
            await r.open();
            expect(await r.wpstring2le()).to.equal('世界');
        });

        it('master readString / writeString with custom options', async () => {
            await writer.open();
            await writer.writeString('Hello World', { stringType: 'utf-8', terminateValue: 0, length: 11 });
            await reader.goto(0);
            expect(await reader.readString({ stringType: 'utf-8', length: 11 })).to.equal('Hello World');
        });
    });

    // ==================== MATH HELPERS (XOR, LSHIFT, etc.) ====================
    describe('Math helpers (xor, lShift, rShift, etc.)', async () => {
        it('xor and xorThis roundtrip', async () => {
            await writer.open();
            const original = writer.data.slice(0, 8);
            await writer.xor(0xAA, 0, 8);                    // XOR entire range with 0xAA
            expect(writer.data[0]).to.equal(original[0] ^ 0xAA);

            await writer.xorThis(0xAA, 8);                   // revert
            expect(writer.data.slice(0, 8)).to.deep.equal(original);
        });

        it('lShift and rShift (left/right shift)', async () => {
            await writer.open();
            await writer.goto(0);
            const origByte = writer.data[0];
            await writer.lShift(1, 0, 1);                    // shift first byte left by 1
            expect(writer.data[0]).to.equal((origByte << 1) & 0xFF);
            await writer.goto(0);
            await writer.rShift(1, 0, 1);                    // shift back
            expect(writer.data[0]).to.equal(origByte);
        });

        it('and / or / add / not helpers', async () => {
            await writer.open();
            const original = writer.data.slice(0, 8);
            await writer.goto(0);
            await writer.and(0x0F, 0, 1);                    // AND first byte with 0x0F
            expect(writer.data[0] & 0xF0).to.equal(0); // high nibble cleared

            await writer.not(0, 1);                          // NOT first byte
            expect(writer.data[0]).to.equal(~(original[0] & 0x0F) & 0xFF);
        });
    });

    // ==================== EDGE CASES & INTEGRATION ====================
    it('strict mode throws on out-of-bounds', async () => {
        await reader.open();
        reader.strict = true;
        await expect(reader.goto(9999)).to.be.rejectedWith(/Reached end of data/);
    });

    it('endianness switch mid-read', async () => {
        await reader.open();
        reader.endianness('big');
        await reader.goto(0);
        expect(await reader.int32()).to.equal(16909060);
        reader.endianness('little');
        expect(await reader.int32()).to.equal(305419896);
    });

    it('bitoffset persists across multi-byte reads (fallback path)', async () => {
        await reader.open();
        await reader.goto(22, 2);
        await reader.setInsetBit(2);
        expect(await reader.ubit6()).to.equal(42); // 101011 bits 2-7 of 0xAB
        expect(reader.insetBit).to.equal(0);
    });

    it('roundtrip full buffer (write everything then read back)', async() => {
        const w = new BiWriterAsync(new Uint8Array(48));
        await w.open();
        await w.int32le(0x12345678);
        await w.halffloatle(1.5);
        await w.floatle(Math.PI);
        await w.doublefloatle(Math.E);
        await w.pstring2le('TestString');
        await w.ubit8(0xFF);
        const data = await w.get();

        const r = new BiReaderAsync(data);
        await r.open();
        expect(await r.int32le()).to.equal(0x12345678);
        expect(await r.halffloatle()).to.be.closeTo(1.5, 0.001);
        expect(await r.floatle()).to.be.closeTo(Math.PI, 0.000001);
        expect(await r.doublefloatle()).to.be.closeTo(Math.E, 0.000001);
        expect(await r.pstring2le()).to.equal('TestString');
        expect(await r.ubit8()).to.equal(0xFF);
    });
});