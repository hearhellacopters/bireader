export type endian = "little"|"big";

export type BigValue = number|bigint;

export type BiOptions = {
    /**
     * Byte offset to start writer, default is 0 
     */
    byteOffset? : number,
    /**
     *  Byte offset to start writer, default is 0 
     */
    bitOffset? :number,
    /**
     * Endianness ``big`` or ``little`` (default little)
     */
    endianness? : endian,
    /**
     * Strict mode: if ``true`` does not extend supplied array on outside write (default ``false``)
     */
    strict?: boolean,
    /**
     * Amount of data to add when extending the buffer array when strict mode is false. Note: Changes login in ``.get`` and ``.return``.
     */
    extendBufferSize?: number
};

export function isBuffer(obj: Buffer | Uint8Array): boolean {
    return buffcheck(obj);
}

function buffcheck(obj: Buffer | Uint8Array): boolean {
    return (typeof Buffer !== 'undefined' && obj instanceof Buffer);
}

export function arraybuffcheck(obj: Buffer | Uint8Array): boolean {
    return obj instanceof Uint8Array || isBuffer(obj);
}

export type hexdumpOptions = {
    /**
     * number of bytes to log, default ``192`` or end of data
     */
    length?: number,
    /**
     * byte to start dump (default ``0``)
     */
    startByte?: number, 
    /**
     * Suppress unicode character preview for even columns.
     */
    suppressUnicode?: boolean,
    /**
     * Returns the hex dump string instead of logging it.
     */
    returnString?: boolean
}

/**
 * Creates hex dump string. Will console log or return string if set in options.
 * 
 * @param {Uint8Array|Buffer} src - Uint8Array or Buffer
 * @param {hexdumpOptions?} options - hex dump options
 * @param {number?} options.length - number of bytes to log, default ``192`` or end of data
 * @param {number?} options.startByte - byte to start dump (default ``0``)
 * @param {boolean?} options.suppressUnicode - Suppress unicode character preview for even columns.
 * @param {boolean?} options.returnString - Returns the hex dump string instead of logging it.
 */
export function hexdump(src: Uint8Array | Buffer, options: hexdumpOptions = {}): void|string {

    if (!(src instanceof Uint8Array || isBuffer(src))) {
        throw new Error("Write data must be Uint8Array or Buffer.");
    }

    const ctx = {
        data: src,
        size: src.length,
        offset: options && options.startByte || 0,
        errorDump: true
    };

    var length: any = options && options.length;
    var startByte: any = options && options.startByte;

    if ((startByte || 0) > ctx.size) {
        throw new Error("Hexdump start is outside of data size: " + startByte + " of " + ctx.size);
    }
    const start = startByte || ctx.offset;
    const end = Math.min(start + (length || 192), ctx.size);
    if (start + (length || 0) > ctx.size) {
        throw new Error("Hexdump amount is outside of data size: " + (start + (length || 0)) + " of " + end);
    }

    const data = ctx.data;

    return _hexDump(data, options, start, end);
}

export function _hexDump(data:Buffer | Uint8Array, options: hexdumpOptions = {}, start:number, end:number): string{
     function hex_check(byte: number, bits: number,): number {
        var value = 0;
        for (var i = 0; i < bits;) {
            var remaining = bits - i;
            var bitOffset = 0;
            var currentByte = byte;
            var read = Math.min(remaining, 8 - bitOffset);
            var mask: number, readBits: number;
            mask = ~(0xFF << read);
            readBits = (currentByte >> (8 - read - bitOffset)) & mask;
            value <<= read;
            value |= readBits;
            i += read;
        }
        value = value >>> 0;
        return value;
    }
    var suppressUnicode: any = options && options.suppressUnicode || false;
    const rows: Array<string> = [];
    var header = "   0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  ";
    var ending = "0123456789ABCDEF";
    var addr: string = "";
    for (let i = start; i < end; i += 16) {
        addr = i.toString(16).padStart(5, '0');
        var row = <unknown>data.subarray(i, i + 16) as number[] || [];
        var hex = Array.from(row, (byte) => byte.toString(16).padStart(2, '0')).join(' ');
        rows.push(`${addr}  ${hex.padEnd(47)}  `);
    }
    let result = '';
    let make_wide: boolean = false;
    let i = start;
    while (i < end) 
    {
        const byte = data[i] as number;
        if (byte < 32 || byte == 127) 
        {
            result += '.';
        } 
        else if (byte < 127) 
        {
            // Valid UTF-8 start byte or single-byte character
            // Convert the byte to a character and add it to the result
            result += String.fromCharCode(byte);
        } 
        else if (suppressUnicode) 
        {
            result += '.';
        } 
        else if (hex_check(byte, 1) == 0) 
        {
            //Byte 1
            result += String.fromCharCode(byte);
        } 
        else if (hex_check(byte, 3) == 6) 
        {
            //Byte 2
            if (i + 1 <= end) 
            {
                //check second byte
                const byte2 = data[i + 1] as number;
                if (hex_check(byte2, 2) == 2) 
                {
                    const charCode = ((byte & 0x1f) << 6) | (byte2 & 0x3f);
                    i++;
                    make_wide = true;
                    const read = " " + String.fromCharCode(charCode);
                    result += read;
                } 
                else 
                {
                    result += ".";
                }
            } 
            else 
            {
                result += ".";
            }
        } 
        else if (hex_check(byte, 4) == 14) 
        {
            //Byte 3
            if (i + 1 <= end) 
            {
                //check second byte
                const byte2 = data[i + 1] as number;
                if (hex_check(byte2, 2) == 2)
                {
                    if (i + 2 <= end) 
                    {
                        //check third byte
                        const byte3 = data[i + 2] as number;
                        if (hex_check(byte3, 2) == 2) 
                        {
                            const charCode =
                                ((byte & 0x0f) << 12) |
                                ((byte2 & 0x3f) << 6) |
                                (byte3 & 0x3f);
                            i += 2;
                            make_wide = true;
                            const read = "  " + String.fromCharCode(charCode);
                            result += read;
                        } 
                        else 
                        {
                            i++;
                            result += " .";
                        }
                    } 
                    else 
                    {
                        i++;
                        result += " .";
                    }
                } 
                else 
                {
                    result += ".";
                }
            } 
            else 
            {
                result += ".";
            }
        }
        else if (hex_check(byte, 5) == 28) 
        {
            //Byte 4
            if (i + 1 <= end) 
            {
                //check second byte
                const byte2 = data[i + 1] as number;
                if (hex_check(byte2, 2) == 2) 
                {
                    if (i + 2 <= end) 
                    {
                        //check third byte
                        const byte3 = data[i + 2] as number;
                        if (hex_check(byte3, 2) == 2) 
                        {
                            if (i + 3 <= end) 
                            {
                                //check fourth byte
                                const byte4 = data[i + 2] as number;
                                if (hex_check(byte4, 2) == 2) 
                                {
                                    const charCode = (((byte4 & 0xFF) << 24) | ((byte3 & 0xFF) << 16) | ((byte2 & 0xFF) << 8) | (byte & 0xFF));
                                    i += 3
                                    make_wide = true;
                                    const read = "   " + String.fromCharCode(charCode);
                                    result += read;
                                } 
                                else 
                                {
                                    i += 2
                                    result += "  .";
                                }
                            } 
                            else 
                            {
                                i += 2
                                result += "  .";
                            }
                        } 
                        else 
                        {
                            i++;
                            result += " .";
                        }
                    } 
                    else 
                    {
                        i++;
                        result += " .";
                    }
                } 
                else 
                {
                    result += ".";
                }
            } 
            else 
            {
                result += ".";
            }
        } 
        else 
        {
            // Invalid UTF-8 byte, add a period to the result
            result += '.';
        }
        i++;
    }
    const chunks = result.match(new RegExp(`.{1,${16}}`, 'g'));
    chunks?.forEach((self, i) => {
        rows[i] = rows[i] + (make_wide ? "|" + self + "|" : self);
    })
    header = "".padStart(addr.length) + header + (make_wide ? "" : ending);
    rows.unshift(header);
    if (make_wide) 
    {
        rows.push("*Removed character byte header on unicode detection");
    }
    if(options && options.returnString)
    {
        return rows.join("\n");
    }
    else
    {
        const retVal = rows.join("\n");
        console.log(retVal);
        return retVal;
    }
}

export type stringOptions = {
    /**
     * for fixed length, non-terminate value utf strings
     */
    length?: number,
    /**
     * utf-8, utf-16, pascal or wide-pascal
     */
    stringType?: "utf-8"|"utf-16"|"pascal"|"wide-pascal"
    /**
     * only with stringType: "utf"
     */
    terminateValue?: number,
    /**
     * for pascal strings. 1, 2 or 4 byte length read size
     */
    lengthReadSize?: 1|2|4,
    /**
     * for pascal strings. 1, 2 or 4 byte length write size
     */
    lengthWriteSize?: 1|2|4,
    /**
     * removes 0x00 characters
     */
    stripNull?: boolean,
    /**
     * TextEncoder accepted types 
     */
    encoding?: string,
    /**
     * for wide-pascal and utf-16
     */
    endian?: "big"|"little",
};