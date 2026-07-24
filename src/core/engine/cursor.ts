/**
 * @file Phase-2 engine brick: the read/write cursor.
 *
 * This module is part of the planned decomposition of the two ~4,500-line
 * `BiBase` / `BiBaseAsync` god-classes into small, independently testable units
 * (see ./README.md). It is written strict-null-safe from the start so the eventual
 * `strictNullChecks` flip lands for free on the code that will actually persist.
 *
 * The cursor owns ALL byte/bit position arithmetic - historically the single most
 * bug-prone area of the library (the v4 constructor mis-applied `bitOffset`, the
 * skip/goto normalization double-counted bytes, and bit-read end-offset was off by
 * one). Centralizing it here means that logic is written and tested exactly once.
 */

/** Wrap any integer bit index into the 0-7 range. */
export function normalizeBitOffset(bit: number): number {
    return ((bit % 8) + 8) % 8;
}

/**
 * A byte + intra-byte-bit position over a buffer of `size` bytes.
 *
 * Invariants held at all times:
 *   - `byte >= 0`
 *   - `0 <= bit <= 7`
 */
export class Cursor {
    #byte: number = 0;
    #bit: number = 0;

    constructor(byteOffset: number = 0, bitOffset: number = 0) {
        this.set(byteOffset, bitOffset);
    }

    /** Current byte position. */
    get byte(): number {
        return this.#byte;
    }

    /** Current intra-byte bit position (0-7). */
    get bit(): number {
        return this.#bit;
    }

    /** Absolute position in bits. */
    get bitPosition(): number {
        return this.#byte * 8 + this.#bit;
    }

    /**
     * Set an absolute position. A non-zero `bitOffset` rolls whole bytes into `byte`
     * and keeps the remainder in `bit` - it does NOT replace `byteOffset` (the v4 bug).
     */
    set(byteOffset: number, bitOffset: number = 0): this {
        let byte = Math.trunc(byteOffset) + Math.floor(bitOffset / 8);

        this.#bit = normalizeBitOffset(bitOffset);

        this.#byte = Math.max(byte, 0);

        return this;
    }

    /** Set from an absolute bit position. */
    setBitPosition(bits: number): this {
        return this.set(Math.floor(bits / 8), bits % 8);
    }

    /** Relative move by whole bytes and/or bits (bits may be negative). */
    skip(bytes: number = 0, bits: number = 0): this {
        const total = this.bitPosition + bytes * 8 + bits;

        return this.setBitPosition(Math.max(total, 0));
    }

    /** Move to the next byte boundary if not already aligned. */
    alignByte(): this {
        if (this.#bit !== 0) {
            this.#byte += 1;

            this.#bit = 0;
        }

        return this;
    }

    /**
     * The exclusive end byte required to read/write `bits` starting here, i.e. the
     * number of bytes that must exist. (`ceil((bit + bits) / 8) + byte`.)
     */
    endByteForBits(bits: number): number {
        return Math.ceil((this.#bit + bits) / 8) + this.#byte;
    }

    clone(): Cursor {
        const c = new Cursor();

        c.#byte = this.#byte;

        c.#bit = this.#bit;

        return c;
    }
}
