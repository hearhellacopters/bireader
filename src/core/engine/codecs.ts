/**
 * @file Phase-2 engine brick: pure value codecs.
 *
 * Lifts the numeric / float / bit encode-decode logic out of `common.ts` into one
 * dependency-free, strict-null-safe module (see ./README.md). Every function is a
 * pure transform over a `DataView` / `Uint8Array` at an absolute offset - no cursor,
 * no capability branching sprinkled through the read/write methods.
 */

// #region clamping

const hasBigInt = typeof BigInt === 'function';

/**
 * Clamp `value` into the representable range of a `bits`-wide signed/unsigned integer,
 * matching the legacy engine's `numberSafe` so out-of-range writes behave identically.
 * (For `bits === 1` the range is treated as unsigned, a legacy quirk preserved on purpose.)
 */
export function numberSafe<T extends number | bigint>(value: T, bits: number, unsigned: boolean): T {
    let min: number;
    let max: number;

    if (unsigned || bits === 1) {
        min = 0;

        switch (bits) {
            case 8: max = 255; break;
            case 16: max = 65535; break;
            case 32: max = 4294967295; break;
            default:
                if (bits <= 54 || hasBigInt) {
                    max = Math.pow(2, bits) - 1;
                } else {
                    throw new RangeError("System can't handle large numbers without BigInt support.");
                }
        }
    } else {
        switch (bits) {
            case 8: max = 127; break;
            case 16: max = 32767; break;
            case 32: max = 2147483647; break;
            default:
                if (bits <= 55 || hasBigInt) {
                    max = Math.pow(2, bits - 1) - 1;
                } else {
                    throw new RangeError("System can't handle large numbers without BigInt support.");
                }
        }

        min = -max - 1;
    }

    if (value < min) {
        return (typeof value === 'bigint' ? BigInt(min) : min) as T;
    }

    if (value > max) {
        return (typeof value === 'bigint' ? BigInt(max) : max) as T;
    }

    return value;
}

// #region integers (8/16/32 → number)

/** Read an 8/16/32-bit integer. */
export function readInt(view: DataView, offset: number, width: 8 | 16 | 32, signed: boolean, little: boolean): number {
    switch (width) {
        case 8: return signed ? view.getInt8(offset) : view.getUint8(offset);
        case 16: return signed ? view.getInt16(offset, little) : view.getUint16(offset, little);
        case 32: return signed ? view.getInt32(offset, little) : view.getUint32(offset, little);
    }
}

/** Write an 8/16/32-bit integer. */
export function writeInt(view: DataView, offset: number, value: number, width: 8 | 16 | 32, signed: boolean, little: boolean): void {
    switch (width) {
        case 8: signed ? view.setInt8(offset, value) : view.setUint8(offset, value); return;
        case 16: signed ? view.setInt16(offset, value, little) : view.setUint16(offset, value, little); return;
        case 32: signed ? view.setInt32(offset, value, little) : view.setUint32(offset, value, little); return;
    }
}

// #region 64-bit integers (→ bigint)

/** Read a 64-bit integer as bigint. */
export function readBig(view: DataView, offset: number, signed: boolean, little: boolean): bigint {
    return signed ? view.getBigInt64(offset, little) : view.getBigUint64(offset, little);
}

/** Write a 64-bit integer from number|bigint. */
export function writeBig(view: DataView, offset: number, value: number | bigint, signed: boolean, little: boolean): void {
    const v = BigInt(value);

    if (signed) {
        view.setBigInt64(offset, v, little);
    } else {
        view.setBigUint64(offset, v, little);
    }
}

// #region 32/64-bit floats

export function readFloat32(view: DataView, offset: number, little: boolean): number {
    return view.getFloat32(offset, little);
}

export function writeFloat32(view: DataView, offset: number, value: number, little: boolean): void {
    view.setFloat32(offset, value, little);
}

export function readFloat64(view: DataView, offset: number, little: boolean): number {
    return view.getFloat64(offset, little);
}

export function writeFloat64(view: DataView, offset: number, value: number, little: boolean): void {
    view.setFloat64(offset, value, little);
}

// #region 16-bit float (manual - getFloat16 is not universal)

const f32 = new Float32Array(1);

const f32AsU32 = new Uint32Array(f32.buffer);

/** Read an IEEE-754 half (16-bit) float. */
export function readFloat16(view: DataView, offset: number, little: boolean): number {
    const bits = view.getUint16(offset, little);

    const sign = (bits & 0x8000) >> 15;

    const exponent = (bits & 0x7C00) >> 10;

    const fraction = bits & 0x03FF;

    if (exponent === 0) {
        return fraction === 0
            ? (sign === 0 ? 0 : -0)
            : (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
    }

    if (exponent === 0x1F) {
        return fraction === 0
            ? (sign === 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY)
            : Number.NaN;
    }

    return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
}

/** Write an IEEE-754 half (16-bit) float. */
export function writeFloat16(view: DataView, offset: number, value: number, little: boolean): void {
    f32[0] = value;

    const x = f32AsU32[0];

    const sign = (x >> 31) & 0x1;

    let exponent = (x >> 23) & 0xff;

    let mantissa = x & 0x7fffff;

    let half: number;

    if (exponent === 0xff) {
        half = (sign << 15) | (0x1f << 10) | (mantissa ? 0x200 : 0);
    } else if (exponent > 142) {
        half = (sign << 15) | (0x1f << 10);
    } else if (exponent < 113) {
        if (exponent < 103) {
            half = sign << 15;
        } else {
            mantissa |= 0x800000;

            const shift = 125 - exponent;

            mantissa = mantissa >> shift;

            half = (sign << 15) | (mantissa >> 13);
        }
    } else {
        exponent = exponent - 112;

        mantissa = mantissa >> 13;

        half = (sign << 15) | (exponent << 10) | mantissa;
    }

    view.setUint16(offset, half, little);
}

// #region bit fields

/**
 * Read `bits` (1-32) starting at absolute bit position `bitOffset` within `data`.
 */
export function readBits(data: Uint8Array, bitOffset: number, bits: number, little: boolean, signed: boolean): number {
    let value = 0;

    let offset = bitOffset;

    for (let i = 0; i < bits;) {
        const remaining = bits - i;

        const bitPos = offset & 7;

        const currentByte = data[offset >> 3];

        const read = Math.min(remaining, 8 - bitPos);

        const mask = ~(0xFF << read);

        if (little) {
            const readBits = (currentByte >> bitPos) & mask;

            value |= readBits << i;
        } else {
            const readBits = (currentByte >> (8 - read - bitPos)) & mask;

            value <<= read;

            value |= readBits;
        }

        offset += read;

        i += read;
    }

    if (signed) {
        const signBit = 1 << (bits - 1);

        if (value & signBit) {
            value -= (1 << bits);
        }
    }

    return value;
}

/**
 * Write `bits` (1-32) of `value` starting at absolute bit position `bitOffset`.
 */
export function writeBits(data: Uint8Array, value: number, bits: number, bitOffset: number, little: boolean, signed: boolean): void {
    if (!signed) {
        value = value & (Math.pow(2, bits) - 1);
    }

    let offset = bitOffset;

    for (let i = 0; i < bits;) {
        const remaining = bits - i;

        const bitPos = offset & 7;

        const byteOffset = offset >> 3;

        const written = Math.min(remaining, 8 - bitPos);

        if (little) {
            const mask = ~(0xFF << written);

            const writeBits = value & mask;

            value >>= written;

            const destMask = ~(mask << bitPos);

            data[byteOffset] = (data[byteOffset] & destMask) | (writeBits << bitPos);
        } else {
            const mask = ~(~0 << written);

            const writeBits = (value >> (bits - i - written)) & mask;

            const destShift = 8 - bitPos - written;

            const destMask = ~(mask << destShift);

            data[byteOffset] = (data[byteOffset] & destMask) | (writeBits << destShift);
        }

        offset += written;

        i += written;
    }
}
