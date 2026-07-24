import { expect } from 'chai';
import { BiEngine } from '../dist-test/core/engine/engine.js';
import { BiSyncEngine } from '../dist-test/core/engine/sync-engine.js';
import { MemorySource } from '../dist-test/core/engine/memory-source.js';
import { BiReaderAsync, BiWriterAsync } from '../dist-test/indexImport.js';

/**
 * Equivalence gate for BiEngine: reading/writing through the new engine (over a
 * MemorySource) must produce the same values and bytes as the shipping async engine.
 * Passing this is the precondition for the Phase-2b cutover.
 */

const SRC = () => Uint8Array.from({ length: 16 }, (_, i) => (0x80 + i) & 0xff);

const engine = (data: Uint8Array, opts: any = {}) => new BiEngine(data, opts);

describe('BiEngine - numeric read equivalence', () => {
    const cases: [string, string, any[]][] = [
        ['readByte', 'readByte', [false]],
        ['readByte', 'readByte', [true]],
        ['readInt16', 'readInt16', [false, 'little']],
        ['readInt16', 'readInt16', [true, 'big']],
        ['readInt32', 'readInt32', [false, 'little']],
        ['readInt32', 'readInt32', [true, 'big']],
        ['readFloat', 'readFloat', ['little']],
        ['readDoubleFloat', 'readDoubleFloat', ['big']],
        ['readHalfFloat', 'readHalfFloat', ['little']],
    ];

    for (const [em, bm, args] of cases) {
        it(`${em}(${args.join(',')})`, async () => {
            const e = engine(SRC());
            const b = new BiReaderAsync(SRC()) as any;
            expect(await (e as any)[em](...args)).to.equal(await b[bm](...args));
        });
    }

    it('readInt64 signed/unsigned with enforceBigInt', async () => {
        for (const [u, en] of [[false, 'little'], [true, 'big']] as const) {
            const e = engine(SRC(), { enforceBigInt: true });
            const b = new BiReaderAsync(SRC(), { enforceBigInt: true }) as any;
            expect(String(await e.readInt64(u, en))).to.equal(String(await b.readInt64(u, en)));
        }
    });

    it('sequential reads advance the cursor identically', async () => {
        const e = engine(SRC());
        const b = new BiReaderAsync(SRC()) as any;
        expect(await e.readUByte()).to.equal(await b.readUByte());
        expect(await e.readInt16(true, 'little')).to.equal(await b.readInt16(true, 'little'));
        expect(await e.readInt32(false, 'big')).to.equal(await b.readInt32(false, 'big'));
        expect(e.offset).to.equal(b.offset);
    });
});

describe('BiEngine - numeric write equivalence', () => {
    async function writtenBytes(width: number, engFn: (e: any) => Promise<void>, baseFn: (w: any) => Promise<void>) {
        const e = engine(new Uint8Array(width));
        await engFn(e);
        const w = new BiWriterAsync(new Uint8Array(width)) as any;
        await baseFn(w);
        return [Array.from((e.source as MemorySource).data.subarray(0, width)), Array.from((w.data as Uint8Array).subarray(0, width))];
    }

    it('writeByte / writeInt16 / writeInt32', async () => {
        let [a, b] = await writtenBytes(1, e => e.writeByte(0x9c, true), w => w.writeByte(0x9c, true));
        expect(a).to.deep.equal(b);
        [a, b] = await writtenBytes(2, e => e.writeInt16(-1234, false, 'big'), w => w.writeInt16(-1234, false, 'big'));
        expect(a).to.deep.equal(b);
        [a, b] = await writtenBytes(4, e => e.writeInt32(0x11223344, true, 'little'), w => w.writeInt32(0x11223344, true, 'little'));
        expect(a).to.deep.equal(b);
    });

    it('writeInt64', async () => {
        const [a, b] = await writtenBytes(8, e => e.writeInt64(0x0102030405060708n, true, 'big'), w => w.writeInt64(0x0102030405060708n, true, 'big'));
        expect(a).to.deep.equal(b);
    });

    it('writeHalfFloat / writeFloat / writeDoubleFloat', async () => {
        let [a, b] = await writtenBytes(2, e => e.writeHalfFloat(1.5, 'little'), w => w.writeHalfFloat(1.5, 'little'));
        expect(a).to.deep.equal(b);
        [a, b] = await writtenBytes(4, e => e.writeFloat(-3.25, 'big'), w => w.writeFloat(-3.25, 'big'));
        expect(a).to.deep.equal(b);
        [a, b] = await writtenBytes(8, e => e.writeDoubleFloat(2.71828, 'little'), w => w.writeDoubleFloat(2.71828, 'little'));
        expect(a).to.deep.equal(b);
    });

    it('grows the source when writing past the end', async () => {
        const e = engine(new Uint8Array(2)); // too small for a uint32
        await e.writeUByte(0xAA); // offset 0
        await e.writeInt32(0xDEADBEEF, true, 'little'); // grows
        const data = (e.source as MemorySource).data;
        expect(data.length).to.be.greaterThanOrEqual(5);
        const b = new BiWriterAsync(new Uint8Array(2), { strict: false }) as any;
        await b.writeUByte(0xAA);
        await b.writeInt32(0xDEADBEEF, true, 'little');
        expect(Array.from(data.subarray(0, 5))).to.deep.equal(Array.from((await b.get() as Uint8Array).subarray(0, 5)));
    });
});

describe('BiEngine - bit equivalence', () => {
    for (const bits of [1, 3, 5, 8, 13, 20, 32]) {
        for (const endian of ['little', 'big'] as const) {
            it(`readBit ${bits} ${endian}`, async () => {
                const e = engine(SRC());
                const b = new BiReaderAsync(SRC()) as any;
                expect(await e.readBit(bits, true, endian)).to.equal(await b.readBit(bits, true, endian));
            });
        }
    }

    it('mixed bit + byte reads stay aligned like the shipping engine', async () => {
        const e = engine(SRC());
        const b = new BiReaderAsync(SRC()) as any;
        expect(await e.readBit(3, true, 'big')).to.equal(await b.readBit(3, true, 'big'));
        expect(await e.readUByte()).to.equal(await b.readUByte()); // both drop remaining bits, align
        expect(e.offset).to.equal(b.offset);
    });

    it('writeBit matches shipping bytes', async () => {
        const e = engine(new Uint8Array(4));
        await e.writeBit(5, 12, true, 'big');
        await e.writeBit(3, 4, true, 'big');
        const w = new BiWriterAsync(new Uint8Array(4)) as any;
        await w.writeBit(5, 12, true, 'big');
        await w.writeBit(3, 4, true, 'big');
        expect(Array.from((e.source as MemorySource).data)).to.deep.equal(Array.from(w.data as Uint8Array));
    });
});

describe('BiEngine - string equivalence', () => {
    const cases: any[] = [
        ['hello', { stringType: 'utf-8' }],
        ['abc', { stringType: 'pascal', lengthWriteSize: 1, lengthReadSize: 1 }],
        ['WX', { stringType: 'utf-16', length: 2 }],
        ['tag', { stringType: 'wide-pascal', lengthWriteSize: 2, lengthReadSize: 2 }],
    ];

    for (const [str, opts] of cases) {
        it(`writeString ${opts.stringType} matches shipping bytes`, async () => {
            const e = engine(new Uint8Array(64));
            await e.writeString(str, opts);
            const w = new BiWriterAsync(new Uint8Array(64)) as any;
            await w.writeString(str, opts);
            expect(Array.from((e.source as MemorySource).data)).to.deep.equal(Array.from(w.data as Uint8Array));
        });

        it(`readString ${opts.stringType} round-trips`, async () => {
            const w = new BiWriterAsync(new Uint8Array(64)) as any;
            await w.writeString(str, opts);
            const e = engine(w.data as Uint8Array);
            expect(await e.readString(opts)).to.equal(str);
        });
    }
});

describe('BiEngine - math equivalence', () => {
    const ops: [string, any[]][] = [
        ['xor', [0x5a]],
        ['or', [0x0f]],
        ['and', [0xf0]],
        ['add', [3]],
        ['not', []],
        ['lShift', [1]],
        ['rShift', [1]],
    ];

    for (const [op, args] of ops) {
        it(`${op} over a range matches shipping`, async () => {
            const e = engine(SRC());
            await (e as any)[op](...args, 2, 10, false);
            const w = new BiWriterAsync(SRC(), { strict: false }) as any;
            await w[op](...args, 2, 10, false);
            expect(Array.from((e.source as MemorySource).data)).to.deep.equal(Array.from(w.data as Uint8Array));
        });
    }
});

describe('BiEngine - find equivalence', () => {
    it('findBytes returns the same absolute offset', async () => {
        const data = new Uint8Array([1, 2, 3, 0xAA, 0xBB, 5, 6, 0xAA, 0xBB]);
        const e = engine(data);
        const b = new BiReaderAsync(data) as any;
        expect(await e.findBytes([0xAA, 0xBB])).to.equal(await b.findBytes([0xAA, 0xBB]));
    });

    it('findString finds ascii', async () => {
        const data = new TextEncoder().encode('..needle..');
        const e = engine(data);
        expect(await e.findString('needle')).to.equal(2);
    });
});

describe('BiEngine - structural edit correctness', () => {
    // SRC() = [0x80..0x8f]. These assert the KNOWN-correct result; two of them (delete's
    // return value and fill-at-range) are cases where the shipping async engine is buggy.
    const base = () => Array.from(SRC());

    it('insert grows and shifts', async () => {
        const e = engine(SRC(), { strict: false });
        await e.insert(Uint8Array.from([0xEE, 0xEF]), 4, false);
        const b = base();
        b.splice(4, 0, 0xEE, 0xEF);
        expect(Array.from((e.source as MemorySource).data)).to.deep.equal(b);
    });

    it('delete removes, shifts, and returns a COPY of the removed bytes', async () => {
        const e = engine(SRC(), { strict: false });
        const removed = await e.delete(3, 7, false);
        expect(Array.from(removed)).to.deep.equal([0x83, 0x84, 0x85, 0x86]); // not corrupted by the shift
        const b = base();
        b.splice(3, 4);
        expect(Array.from((e.source as MemorySource).data)).to.deep.equal(b);
    });

    it('replace overwrites at the offset', async () => {
        const e = engine(SRC(), { strict: false });
        await e.replace(Uint8Array.from([1, 2, 3]), 5, false);
        const b = base();
        b.splice(5, 3, 1, 2, 3);
        expect(Array.from((e.source as MemorySource).data)).to.deep.equal(b);
    });

    it('fill overwrites the requested range (not the cursor) and returns the slice', async () => {
        const e = engine(SRC(), { strict: false });
        const slice = await e.fill(2, 6, false, 0x00);
        expect(Array.from(slice)).to.deep.equal([0x82, 0x83, 0x84, 0x85]);
        const b = base();
        b.splice(2, 4, 0, 0, 0, 0);
        expect(Array.from((e.source as MemorySource).data)).to.deep.equal(b);
    });

    it('push/append and unshift/prepend', async () => {
        const e1 = engine(SRC(), { strict: false });
        await e1.push(Uint8Array.from([0x01, 0x02]), false);
        expect(Array.from((e1.source as MemorySource).data)).to.deep.equal([...base(), 0x01, 0x02]);

        const e2 = engine(SRC(), { strict: false });
        await e2.unshift(Uint8Array.from([0xFC, 0xFD]), false);
        expect(Array.from((e2.source as MemorySource).data)).to.deep.equal([0xFC, 0xFD, ...base()]);
    });

    it('round-trips a big insert that crosses the shift window', async () => {
        const big = new Uint8Array(200000).fill(0xAB);
        const e = engine(new Uint8Array(10).fill(0x11), { strict: false });
        await e.insert(big, 5, false);
        const data = (e.source as MemorySource).data;
        expect(data.length).to.equal(200010);
        expect(Array.from(data.subarray(0, 5))).to.deep.equal([0x11, 0x11, 0x11, 0x11, 0x11]);
        expect(data[5]).to.equal(0xAB);
        expect(data[200004]).to.equal(0xAB);
        expect(data[200005]).to.equal(0x11);
    });
});

describe('BiEngine - concurrency (op-queue)', () => {
    it('serializes overlapping cursor reads deterministically', async () => {
        const data = new Uint8Array(16);
        const dv = new DataView(data.buffer);
        for (let i = 0; i < 4; i++) dv.setUint32(i * 4, i, true);
        const e = engine(data);
        const out = await Promise.all([0, 1, 2, 3].map(() => e.readInt32(true, 'little')));
        expect(out).to.deep.equal([0, 1, 2, 3]);
    });

    it('positional *At reads are cursor-free and concurrent-safe', async () => {
        const e = engine(SRC());
        const before = e.offset;
        const [a, b] = await Promise.all([e.readUInt32At(0, 'big'), e.readUInt16At(8, 'little')]);
        const rb = new BiReaderAsync(SRC()) as any;
        expect(a).to.equal(await rb.readUInt32At(0, 'big'));
        expect(b).to.equal(await rb.readUInt16At(8, 'little'));
        expect(e.offset).to.equal(before); // cursor untouched
    });
});

describe('BiEngine / BiSyncEngine - movement alias semantics', () => {
    // Pins which aliases are ABSOLUTE (goto family) and which are RELATIVE (skip family).
    // FSeek is a goto alias despite the "seek" name - the README used to list it under skip.
    const syncEngine = (data: Uint8Array) => new BiSyncEngine(data, { strict: false });

    it('async: FSeek / pointer / warp are absolute (goto family)', async () => {
        for (const m of ['FSeek', 'pointer', 'warp', 'goto'] as const) {
            const e = engine(SRC(), { strict: false });
            await e.goto(6);
            await (e as any)[m](10);
            expect(e.offset, `${m} should be absolute`).to.equal(10);
        }
    });

    it('async: skip / seek / jump are relative to the current position', async () => {
        for (const m of ['skip', 'seek', 'jump'] as const) {
            const e = engine(SRC(), { strict: false });
            await e.goto(6);
            await (e as any)[m](4);
            expect(e.offset, `${m} should be relative`).to.equal(10);
        }
    });

    it('sync: FSeek / pointer / warp are absolute (goto family)', () => {
        for (const m of ['FSeek', 'pointer', 'warp', 'goto'] as const) {
            const e = syncEngine(SRC());
            e.goto(6);
            (e as any)[m](10);
            expect(e.offset, `${m} should be absolute`).to.equal(10);
        }
    });

    it('sync: skip / seek / jump are relative to the current position', () => {
        for (const m of ['skip', 'seek', 'jump'] as const) {
            const e = syncEngine(SRC());
            e.goto(6);
            (e as any)[m](4);
            expect(e.offset, `${m} should be relative`).to.equal(10);
        }
    });

    it('skip accepts negatives; FSeek does not treat its arg as an offset', async () => {
        const e = engine(SRC(), { strict: false });
        await e.goto(10);
        await e.skip(-4);
        expect(e.offset).to.equal(6);

        await e.FSeek(4);
        expect(e.offset).to.equal(4); // absolute, NOT 6 + 4
    });

    it('the goto family carries the bit argument through', async () => {
        const e = engine(SRC(), { strict: false });
        await e.FSeek(3, 5);
        expect(e.offset).to.equal(3);
        expect(e.insetBit).to.equal(5);

        const s = syncEngine(SRC());
        s.FSeek(3, 5);
        expect(s.offset).to.equal(3);
        expect(s.insetBit).to.equal(5);
    });
});
