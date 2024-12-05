type BiReader = import('./bireader.ts').BiReader;
type BiWriter = import('./biwriter.ts').BiWriter;

export function isBuffer(obj: Buffer | Uint8Array): boolean {
    return buffcheck(obj);
}

export function check_size(_this: BiReader | BiWriter | ReaderBase, write_bytes: number, write_bit?: number, offset?: number): number {
    return checkSize(_this, write_bytes || 0, write_bit || 0, offset || _this.offset);
}

export function buffcheck(obj: Buffer | Uint8Array | ReaderBase): boolean {
    return (typeof Buffer !== 'undefined' && obj instanceof Buffer);
}

export function arraybuffcheck(_this: BiReader | BiWriter | ReaderBase, obj: Buffer | Uint8Array): boolean {
    return obj instanceof Uint8Array || isBuffer(obj);
}

export function extendarray(_this: BiReader | BiWriter | ReaderBase, to_padd: number): void {
    if ((typeof Buffer !== 'undefined' && _this.data instanceof Buffer)) {
        var paddbuffer = Buffer.alloc(to_padd);
        _this.data = Buffer.concat([_this.data, paddbuffer]);
    } else {
        const addArray = new Array(to_padd);
        _this.data = new Uint8Array([..._this.data, ...addArray]);
    }
    _this.size = _this.data.length;
    _this.sizeB = _this.data.length * 8;
}

export function checkSize(_this: BiReader | BiWriter | ReaderBase, write_bytes: number, write_bit?: number, offset?: number): number {
    const bits: number = (write_bit || 0) + _this.bitoffset;
    var new_off = (offset || _this.offset);
    var writesize = write_bytes || 0;
    if (bits != 0) {
        //add bits
        writesize += Math.ceil(bits / 8);
    }
    //if biger extend
    const needed_size: number = new_off + writesize;
    if (needed_size > _this.size) {
        const dif = needed_size - _this.size;
        if (_this.strict == false) {
            _this.extendArray(dif);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m hexdump:\n" + _this.hexdump() : "";
            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: writing to ` + needed_size + " at " + _this.offset + " of " + _this.size);
        }
    }
    //start read location
    return new_off;
}

export function skip(_this: BiReader | BiWriter | ReaderBase, bytes: number, bits?: number): void {
    var new_size = (((bytes || 0) + _this.offset) + Math.ceil((_this.bitoffset + (bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0) + _this.offset) * 8) + _this.bitoffset + (bits || 0)) / 8);
    }

    if (new_size > _this.size) {
        if (_this.strict == false) {
            _this.extendArray(new_size - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: Seek of range of data: seek " + new_size + " of " + _this.size);
        }
    }

    // Adjust byte offset based on bit overflow
    _this.offset += Math.floor((_this.bitoffset + (bits || 0)) / 8);
    // Adjust bit offset
    _this.bitoffset = (_this.bitoffset + (bits || 0) + 64) % 8;
    // Adjust byte offset based on byte overflow
    _this.offset += bytes;
    // Ensure bit offset stays between 0-7
    _this.bitoffset = Math.min(Math.max(_this.bitoffset, 0), 7);
    // Ensure offset doesn't go negative
    _this.offset = Math.max(_this.offset, 0);
}

export function align(_this: BiReader | BiWriter | ReaderBase, n: number) {
    var a = _this.offset % n;
    if (a) {
        _this.skip(n - a);
    }
}

export function alignRev(_this: BiReader | BiWriter | ReaderBase, n: number) {
    var a = _this.offset % n;
    if (a) {
        _this.skip(a * -1);
    }
}

export function goto(_this: BiReader | BiWriter | ReaderBase, bytes: number, bits?: number): void {
    var new_size = (((bytes || 0)) + Math.ceil(((bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0)) * 8) + (bits || 0)) / 8);
    }
    if (new_size > _this.size) {
        if (_this.strict == false) {
            _this.extendArray(new_size - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: Goto utside of range of data: goto " + new_size + " of " + _this.size);
        }
    }
    _this.offset = bytes;
    // Adjust byte offset based on bit overflow
    _this.offset += Math.floor(((bits || 0)) / 8);
    // Adjust bit offset
    _this.bitoffset = ((bits || 0) + 64) % 8;
    // Ensure bit offset stays between 0-7
    _this.bitoffset = Math.min(Math.max(_this.bitoffset, 0), 7);
    // Ensure offset doesn't go negative
    _this.offset = Math.max(_this.offset, 0);
}

export function remove(_this: BiReader | BiWriter | ReaderBase, startOffset?: number, endOffset?: number, consume?: boolean, remove?: boolean, fillValue?: number): any {
    const new_start = Math.abs(startOffset || 0);
    const new_offset = (endOffset || _this.offset);
    if (new_offset > _this.size) {
        if (_this.strict == false) {
            _this.extendArray(new_offset - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + endOffset + " of " + _this.size);
        }
    }
    if (_this.strict == true && remove == true) {
        _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
        throw new Error("\x1b[33m[Strict mode]\x1b[0m: Can not remove data in strict mode: endOffset" + endOffset + " of " + _this.size);
    }
    const data_removed = _this.data.slice(new_start, new_offset);
    if (remove) {
        const part1 = _this.data.subarray(0, new_start);
        const part2 = _this.data.subarray(new_offset, _this.size);
        if (isBuffer(_this.data)) {
            _this.data = Buffer.concat([part1, part2]);
        } else {
            _this.data = new Uint8Array([...part1, ...part2]);
        }
        _this.size = _this.data.length;
        _this.sizeB = _this.data.length * 8;
    }
    if (fillValue != undefined && remove == false) {
        const part1 = _this.data.subarray(0, new_start);
        const part2 = _this.data.subarray(new_offset, _this.size);
        const replacement = new Array(data_removed.length).fill(fillValue & 0xff);
        if (isBuffer(_this.data)) {
            const buff_placement = Buffer.from(replacement);
            _this.data = Buffer.concat([part1, buff_placement, part2]);
        } else {
            _this.data = new Uint8Array([...part1, ...replacement, ...part2]);
        }
        _this.size = _this.data.length;
        _this.sizeB = _this.data.length * 8;
    }
    if (consume == true) {
        if (remove != true) {
            _this.offset = new_offset;
            _this.bitoffset = 0;
        } else {
            _this.offset = new_start;
            _this.bitoffset = 0;
        }
    }
    return data_removed;
}

export function addData(_this: BiReader | BiWriter | ReaderBase, data: Buffer | Uint8Array, consume?: boolean, offset?: number, replace?: boolean): void {
    if (_this.strict == true) {
        _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
        throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Can not insert data in strict mode. Use unrestrict() to enable.`);
    }
    if (typeof Buffer !== 'undefined' && data instanceof Buffer && !(_this.data instanceof Buffer)) {
        throw new Error("Data insert must be a Buffer");
    }
    if (data instanceof Uint8Array && !(_this.data instanceof Uint8Array)) {
        throw new Error("Data insert must be a Uint8Array");
    }
    var needed_size: number = offset || _this.offset;
    if (replace) {
        needed_size = (offset || _this.offset) + data.length;
    }
    if (replace) {
        const part1 = _this.data.subarray(0, needed_size - data.length);
        const part2 = _this.data.subarray(needed_size, _this.size);
        if (isBuffer(_this.data)) {
            _this.data = Buffer.concat([part1, data, part2]);
        } else {
            _this.data = new Uint8Array([...part1, ...data, ...part2]);
        }
        _this.size = _this.data.length;
        _this.sizeB = _this.data.length * 8;
    } else {
        const part1 = _this.data.subarray(0, needed_size);
        const part2 = _this.data.subarray(needed_size, _this.size);
        if (isBuffer(_this.data)) {
            _this.data = Buffer.concat([part1, data, part2]);
        } else {
            _this.data = new Uint8Array([...part1, ...data, ...part2]);
        }
        _this.size = _this.data.length;
        _this.sizeB = _this.data.length * 8;
    }
    if (consume) {
        _this.offset = (offset || _this.offset) + data.length;
        _this.bitoffset = 0;
    }
}

/**
 * Console logs provided data as hex dump.
 * 
 * @param {Uint8Array|Buffer} src - Uint8Array or Buffer
 * @param {object} options 
 * ```javascript
 *   {
 *       length: 192, // number of bytes to log, default 192 or end of data
 *       startByte: 0, // byte to start dump (default 0)
 *       supressUnicode: false // Supress unicode character preview for even columns
 *   }
 * ```
 */
export function hexdump(src: Uint8Array | Buffer, options?: { length?: number, startByte?: number, supressUnicode?: boolean }): void {

    if (!(src instanceof Uint8Array || isBuffer(src))) {
        throw new Error("Write data must be Uint8Array or Buffer.");
    }

    const fake_reader = {
        data: src,
        size: src.length,
        offset: options && options.startByte || 0,
        errorDump: true,
        extendArray: extendarray,
    };

    hexDump(<unknown>fake_reader as BiReader, options);
}

export function hexDump(_this: BiReader | BiWriter | ReaderBase, options?: { length?: number, startByte?: number, supressUnicode?: boolean }): void {
    var length: any = options && options.length;
    var startByte: any = options && options.startByte;
    var supressUnicode: any = options && options.supressUnicode || false;

    if ((startByte || 0) > _this.size) {
        _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
        throw new Error("Hexdump start is outside of data size: " + startByte + " of " + _this.size);
    }
    const start = startByte || _this.offset;
    const end = Math.min(start + (length || 192), _this.size);
    if (start + (length || 0) > _this.size) {
        _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
        throw new Error("Hexdump amount is outside of data size: " + (start + (length || 0)) + " of " + end);
    }
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
    const rows: Array<string> = [];
    var header = "   0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  ";
    var ending = "0123456789ABCDEF";
    var addr: string = "";
    for (let i = start; i < end; i += 16) {
        addr = i.toString(16).padStart(5, '0');
        var row = <unknown>_this.data?.slice(i, i + 16) as number[] || [];
        var hex = Array.from(row, (byte) => byte.toString(16).padStart(2, '0')).join(' ');
        rows.push(`${addr}  ${hex.padEnd(47)}  `);
    }
    let result = '';
    let make_wide: boolean = false;
    let i = start;
    while (i < end) {
        const byte = <unknown>_this.data[i] as number;
        if (byte < 32 || byte == 127) {
            result += '.';
        } else
            if (byte < 127) {
                // Valid UTF-8 start byte or single-byte character
                // Convert the byte to a character and add it to the result
                result += String.fromCharCode(byte);
            } else
                if (supressUnicode) {
                    result += '.';
                } else
                    if (hex_check(byte, 1) == 0) {
                        //Byte 1
                        result += String.fromCharCode(byte);
                    } else
                        if (hex_check(byte, 3) == 6) {
                            //Byte 2
                            if (i + 1 <= end) {
                                //check second byte
                                const byte2 = <unknown>_this.data[i + 1] as number;
                                if (hex_check(byte2, 2) == 2) {
                                    const charCode = ((byte & 0x1f) << 6) | (byte2 & 0x3f);
                                    i++;
                                    make_wide = true;
                                    const read = " " + String.fromCharCode(charCode);
                                    result += read;
                                } else {
                                    result += ".";
                                }
                            } else {
                                result += ".";
                            }
                        } else
                            if (hex_check(byte, 4) == 14) {
                                //Byte 3
                                if (i + 1 <= end) {
                                    //check second byte
                                    const byte2 = <unknown>_this.data[i + 1] as number;
                                    if (hex_check(byte2, 2) == 2) {
                                        if (i + 2 <= end) {
                                            //check third byte
                                            const byte3 = <unknown>_this.data[i + 2] as number;
                                            if (hex_check(byte3, 2) == 2) {
                                                const charCode =
                                                    ((byte & 0x0f) << 12) |
                                                    ((byte2 & 0x3f) << 6) |
                                                    (byte3 & 0x3f);
                                                i += 2;
                                                make_wide = true;
                                                const read = "  " + String.fromCharCode(charCode);
                                                result += read;
                                            } else {
                                                i++;
                                                result += " .";
                                            }
                                        } else {
                                            i++;
                                            result += " .";
                                        }
                                    } else {
                                        result += ".";
                                    }
                                } else {
                                    result += ".";
                                }
                            } else
                                if (hex_check(byte, 5) == 28) {
                                    //Byte 4
                                    if (i + 1 <= end) {
                                        //check second byte
                                        const byte2 = <unknown>_this.data[i + 1] as number;
                                        if (hex_check(byte2, 2) == 2) {
                                            if (i + 2 <= end) {
                                                //check third byte
                                                const byte3 = <unknown>_this.data[i + 2] as number;
                                                if (hex_check(byte3, 2) == 2) {
                                                    if (i + 3 <= end) {
                                                        //check fourth byte
                                                        const byte4 = <unknown>_this.data[i + 2] as number;
                                                        if (hex_check(byte4, 2) == 2) {
                                                            const charCode = (((byte4 & 0xFF) << 24) | ((byte3 & 0xFF) << 16) | ((byte2 & 0xFF) << 8) | (byte & 0xFF));
                                                            i += 3
                                                            make_wide = true;
                                                            const read = "   " + String.fromCharCode(charCode);
                                                            result += read;
                                                        } else {
                                                            i += 2
                                                            result += "  .";
                                                        }
                                                    } else {
                                                        i += 2
                                                        result += "  .";
                                                    }
                                                } else {
                                                    i++;
                                                    result += " .";
                                                }
                                            } else {
                                                i++;
                                                result += " .";
                                            }
                                        } else {
                                            result += ".";
                                        }
                                    } else {
                                        result += ".";
                                    }
                                } else {
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
    if (make_wide) {
        rows.push("*Removed character byte header on unicode detection");
    }
    console.log(rows.join("\n"));
}

export function AND(_this: BiReader | BiWriter | ReaderBase, and_key: any, start?: number, end?: number, consume?: boolean): any {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof and_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] & (and_key & 0xff);
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    } else {
        if (arraybuffcheck(_this, and_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != and_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }
                input[i] = input[i] & and_key[number]
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        } else {
            throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}

export function OR(_this: BiReader | BiWriter | ReaderBase, or_key: any, start?: number, end?: number, consume?: boolean): any {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof or_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] | (or_key & 0xff);
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    } else {
        if (arraybuffcheck(_this, or_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != or_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }
                input[i] = input[i] | or_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        } else {
            throw new Error("OR key must be a byte value, string, Uint8Array or Buffer")
        }
    }
}

export function XOR(_this: BiReader | BiWriter | ReaderBase, xor_key: any, start?: number, end?: number, consume?: boolean): any {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof xor_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] ^ (xor_key & 0xff);
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    } else {
        if (arraybuffcheck(_this, xor_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != xor_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }
                input[i] = input[i] ^ xor_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}

export function NOT(_this: BiReader | BiWriter | ReaderBase, start?: number, end?: number, consume?: boolean): any {
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
        _this.data[i] = ~_this.data[i];
        if (consume) {
            _this.offset = i;
            _this.bitoffset = 0;
        }
    }
}

export function LSHIFT(_this: BiReader | BiWriter | ReaderBase, shift_key: any, start?: number, end?: number, consume?: boolean): any {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof shift_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] << shift_key;
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    } else {
        if (arraybuffcheck(_this, shift_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != shift_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }
                input[i] = input[i] << shift_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}

export function RSHIFT(_this: BiReader | BiWriter | ReaderBase, shift_key: any, start?: number, end?: number, consume?: boolean): any {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof shift_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] >> shift_key;
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    } else {
        if (arraybuffcheck(_this, shift_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != shift_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }
                input[i] = input[i] >> shift_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}

export function ADD(_this: BiReader | BiWriter | ReaderBase, add_key: any, start?: number, end?: number, consume?: boolean): any {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        } else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof add_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] + add_key;
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    } else {
        if (arraybuffcheck(_this, add_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != add_key.length - 1) {
                    number = number + 1;
                } else {
                    number = 0;
                }
                input[i] = input[i] + add_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        } else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}

export function fString(_this: BiReader | BiWriter | ReaderBase, searchString: string): number {
    // Convert the searchString to Uint8Array
    const searchArray = new TextEncoder().encode(searchString);

    for (let i = _this.offset; i <= _this.size - searchArray.length; i++) {
        let match = true;

        for (let j = 0; j < searchArray.length; j++) {
            if (_this.data[i + j] !== searchArray[j]) {
                match = false;
                break;
            }
        }

        if (match) {
            return i; // Found the string, return the index
        }
    }

    return -1; // String not found

}

export function fNumber(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, bits: number, unsigned: boolean, endian?: string): number {

    check_size(_this, Math.floor(bits / 8), 0);

    for (let z = _this.offset; z <= (_this.size - (bits / 8)); z++) {

        var off_in_bits = 0;

        var value = 0;

        for (var i = 0; i < bits;) {
            var remaining = bits - i;
            var bitOffset = off_in_bits & 7;
            var currentByte = <unknown>_this.data[z + (off_in_bits >> 3)] as number;

            var read = Math.min(remaining, 8 - bitOffset);

            var mask: number, readBits: number;

            if ((endian != undefined ? endian : _this.endian) == "big") {

                mask = ~(0xFF << read);
                readBits = (currentByte >> (8 - read - bitOffset)) & mask;
                value <<= read;
                value |= readBits;

            } else {

                mask = ~(0xFF << read);
                readBits = (currentByte >> bitOffset) & mask;
                value |= readBits << i;

            }

            off_in_bits += read;
            i += read;
        }

        if (unsigned == true || bits <= 7) {

            value = value >>> 0;

        } else {
            if (bits !== 32 && value & (1 << (bits - 1))) {
                value |= -1 ^ ((1 << bits) - 1);
            }
        }

        if (value === targetNumber) {
            return z - _this.offset; // Found the byte, return the index from current
        }
    }

    return -1; // number not found
}

export function fHalfFloat(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, endian?: string): number {

    check_size(_this, 2, 0);

    for (let z = _this.offset; z <= (_this.size - 2); z++) {

        var value = 0;

        if ((endian != undefined ? endian : _this.endian) == "little") {
            value = ((<unknown>_this.data[z + 1] as number & 0xFFFF) << 8) | (<unknown>_this.data[z] as number & 0xFFFF);
        } else {
            value = ((<unknown>_this.data[z] as number & 0xFFFF) << 8) | (<unknown>_this.data[z + 1] as number & 0xFFFF);
        }

        const sign = (value & 0x8000) >> 15;
        const exponent = (value & 0x7C00) >> 10;
        const fraction = value & 0x03FF;

        let floatValue: number;

        if (exponent === 0) {
            if (fraction === 0) {
                floatValue = (sign === 0) ? 0 : -0; // +/-0
            } else {
                // Denormalized number
                floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
            }
        } else if (exponent === 0x1F) {
            if (fraction === 0) {
                floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
            } else {
                floatValue = Number.NaN;
            }
        } else {
            // Normalized number
            floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
        }

        if (floatValue === targetNumber) {
            return z; // Found the number, return the index
        }
    }

    return -1; // number not found
}

export function fFloat(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, endian?: string): number {

    check_size(_this, 4, 0);

    for (let z = _this.offset; z <= (_this.size - 4); z++) {

        var value = 0;

        if ((endian != undefined ? endian : _this.endian) == "little") {
            value = (((<unknown>_this.data[z + 3] as number & 0xFF) << 24) | ((<unknown>_this.data[z + 2] as number & 0xFF) << 16) | ((<unknown>_this.data[z + 1] as number & 0xFF) << 8) | (<unknown>_this.data[z] as number & 0xFF));
        } else {
            value = ((<unknown>_this.data[z] as number & 0xFF) << 24) | ((<unknown>_this.data[z + 1] as number & 0xFF) << 16) | ((<unknown>_this.data[z + 2] as number & 0xFF) << 8) | (<unknown>_this.data[z + 3] as number & 0xFF);
        }

        const isNegative = (value & 0x80000000) !== 0 ? 1 : 0;

        // Extract the exponent and fraction parts
        const exponent = (value >> 23) & 0xFF;
        const fraction = value & 0x7FFFFF;

        // Calculate the float value
        let floatValue: number;

        if (exponent === 0) {
            // Denormalized number (exponent is 0)
            floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
        } else if (exponent === 0xFF) {
            // Infinity or NaN (exponent is 255)
            floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
        } else {
            // Normalized number
            floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
        }

        if (floatValue === targetNumber) {
            return z; // Found the number, return the index
        }

    }

    return -1; // number not found
}

export function fBigInt(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, unsigned: boolean, endian?: string): number {

    check_size(_this, 8, 0);

    for (let z = _this.offset; z <= (_this.size - 8); z++) {
        let value: bigint = BigInt(0);
        if ((endian == undefined ? _this.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((<unknown>_this.data[z + i] as number & 0xFF)) << BigInt(8 * i);
            }
            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
            }
        } else {
            for (let i = 0; i < 8; i++) {
                value = (value << BigInt(8)) | BigInt((<unknown>_this.data[z + i] as number & 0xFF));
            }
            if (unsigned == undefined || unsigned == false) {
                if (value & (BigInt(1) << BigInt(63))) {
                    value -= BigInt(1) << BigInt(64);
                }
            }
        }

        if (value == BigInt(targetNumber)) {
            return z;
        }
    }

    return -1;// number not found
}

export function fDoubleFloat(_this: BiReader | BiWriter | ReaderBase, targetNumber: number, endian?: string): number {

    check_size(_this, 8, 0);

    for (let z = _this.offset; z <= (_this.size - 8); z++) {

        let value = BigInt(0);
        if ((endian == undefined ? _this.endian : endian) == "little") {
            for (let i = 0; i < 8; i++) {
                value = value | BigInt((<unknown>_this.data[z + i] as number & 0xFF)) << BigInt(8 * i);
            }
        } else {
            for (let i = 0; i < 8; i++) {
                value = (value << BigInt(8)) | BigInt((<unknown>_this.data[z + i] as number & 0xFF));
            }
        }

        const sign = (value & 0x8000000000000000n) >> 63n;
        const exponent = Number((value & 0x7FF0000000000000n) >> 52n) - 1023;
        const fraction = Number(value & 0x000FFFFFFFFFFFFFn) / Math.pow(2, 52);

        var floatValue: number;

        if (exponent == -1023) {
            if (fraction == 0) {
                floatValue = (sign == 0n) ? 0 : -0; // +/-0
            } else {
                // Denormalized number
                floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, -1022) * fraction;
            }
        } else if (exponent == 1024) {
            if (fraction == 0) {
                floatValue = (sign == 0n) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
            } else {
                floatValue = Number.NaN;
            }
        } else {
            // Normalized number
            floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
        }

        if (floatValue == targetNumber) {
            return z;
        }

    }

    return -1; // number not found
}

export function wbit(_this: BiReader | BiWriter | ReaderBase, value: number, bits: number, unsigned?: boolean, endian?: string) {
    if (value == undefined) {
        throw new Error('Must supply value.');
    }
    if (bits == undefined) {
        throw new Error("Enter number of bits to write")
    }
    if (bits == 0) {
        return;
    }
    if (bits <= 0 || bits > 32) {
        throw new Error('Bit length must be between 1 and 32. Got ' + bits);
    }
    if (unsigned == true) {
        if (value < 0 || value > Math.pow(2, bits)) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + 0 + " max: " + Math.pow(2, bits) + " value: " + value);
        }
    } else {
        const maxValue = Math.pow(2, bits - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if (unsigned == true) {
        const maxValue = Math.pow(2, bits) - 1;
        value = value & maxValue;
    }

    const size_needed = ((((bits - 1) + _this.bitoffset) / 8) + _this.offset);
    if (size_needed > _this.size) {
        //add size
        _this.extendArray(size_needed - _this.size);
    }

    var off_in_bits = (_this.offset * 8) + _this.bitoffset;

    for (var i = 0; i < bits;) {
        var remaining = bits - i;
        var bitOffset = off_in_bits & 7;
        var byteOffset = off_in_bits >> 3;
        var written = Math.min(remaining, 8 - bitOffset);

        var mask: number, writeBits: number, destMask: number;
        if ((endian != undefined ? endian : _this.endian) == "big") {

            mask = ~(~0 << written);
            writeBits = (value >> (bits - i - written)) & mask;
            var destShift = 8 - bitOffset - written;
            destMask = ~(mask << destShift);
            _this.data[byteOffset] = (_this.data[byteOffset] & destMask) | (writeBits << destShift);

        } else {

            mask = ~(0xFF << written);
            writeBits = value & mask;
            value >>= written;
            destMask = ~(mask << bitOffset);
            _this.data[byteOffset] = (_this.data[byteOffset] & destMask) | (writeBits << bitOffset);

        }

        off_in_bits += written;
        i += written;
    }

    _this.offset = _this.offset + Math.floor(((bits) + _this.bitoffset) / 8); //end byte
    _this.bitoffset = ((bits) + _this.bitoffset) % 8;
}

export function rbit(_this: BiReader | BiWriter | ReaderBase, bits?: number, unsigned?: boolean, endian?: string): number {
    if (bits == undefined || typeof bits != "number") {
        throw new Error("Enter number of bits to read");
    }
    if (bits == 0) {
        return 0;
    }
    if (bits <= 0 || bits > 32) {
        throw new Error('Bit length must be between 1 and 32. Got ' + bits);
    }
    const size_needed = ((((bits - 1) + _this.bitoffset) / 8) + _this.offset);
    if (bits <= 0 || size_needed > _this.size) {
        _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
        throw new Error("Invalid number of bits to read: " + size_needed + " of " + _this.size);
    }

    var off_in_bits = (_this.offset * 8) + _this.bitoffset;

    var value = 0;

    for (var i = 0; i < bits;) {
        var remaining = bits - i;
        var bitOffset = off_in_bits & 7;
        var currentByte = <unknown>_this.data[off_in_bits >> 3] as number;

        var read = Math.min(remaining, 8 - bitOffset);

        var mask: number, readBits: number;

        if ((endian != undefined ? endian : _this.endian) == "big") {

            mask = ~(0xFF << read);
            readBits = (currentByte >> (8 - read - bitOffset)) & mask;
            value <<= read;
            value |= readBits;

        } else {

            mask = ~(0xFF << read);
            readBits = (currentByte >> bitOffset) & mask;
            value |= readBits << i;

        }

        off_in_bits += read;
        i += read;
    }

    _this.offset = _this.offset + Math.floor(((bits) + _this.bitoffset) / 8); //end byte
    _this.bitoffset = ((bits) + _this.bitoffset) % 8;

    if (unsigned == true || bits <= 7) {

        return value >>> 0;

    }

    if (bits !== 32 && value & (1 << (bits - 1))) {
        value |= -1 ^ ((1 << bits) - 1);
    }

    return value;
}

export function wbyte(_this: BiReader | BiWriter | ReaderBase, value: number, unsigned?: boolean): void {

    check_size(_this, 1, 0);

    if (unsigned == true) {
        if (value < 0 || value > 255) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + 0 + " max: " + 255 + " value: " + value);
        }
    } else {
        const maxValue = Math.pow(2, 8 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    _this.data[_this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
    _this.offset += 1;
    _this.bitoffset = 0;
}

export function rbyte(_this: BiReader | BiWriter | ReaderBase, unsigned?: boolean): number {

    check_size(_this, 1);

    var read = <unknown>_this.data[_this.offset] as number;
    _this.offset += 1;
    _this.bitoffset = 0;
    if (unsigned == true) {
        return read & 0xFF;
    } else {
        return read > 127 ? read - 256 : read;
    }
}

export function wint16(_this: BiReader | BiWriter | ReaderBase, value: number, unsigned?: boolean, endian?: string): void {

    check_size(_this, 2, 0);

    if (unsigned == true) {
        if (value < 0 || value > 65535) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + 0 + " max: " + 65535 + " value: " + value);
        }
    } else {
        const maxValue = Math.pow(2, 16 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if ((endian != undefined ? endian : _this.endian) == "little") {
        _this.data[_this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
        _this.data[_this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
    } else {
        _this.data[_this.offset] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
        _this.data[_this.offset + 1] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
    }
    _this.offset += 2;
    _this.bitoffset = 0;
}

export function rint16(_this: BiReader | BiWriter | ReaderBase, unsigned?: boolean, endian?: string): number {

    check_size(_this, 2);

    var read: number;
    if ((endian != undefined ? endian : _this.endian) == "little") {
        read = ((<unknown>_this.data[_this.offset + 1] as number & 0xFFFF) << 8) | (<unknown>_this.data[_this.offset] as number & 0xFFFF);
    } else {
        read = ((<unknown>_this.data[_this.offset] as number & 0xFFFF) << 8) | (<unknown>_this.data[_this.offset + 1] as number & 0xFFFF);
    }
    _this.offset += 2;
    _this.bitoffset = 0;
    if (unsigned == undefined || unsigned == false) {
        return read & 0x8000 ? -(0x10000 - read) : read;
    } else {
        return read & 0xFFFF;
    }
}

export function rhalffloat(_this: BiReader | BiWriter | ReaderBase, endian?: string): number {

    var uint16Value = _this.readInt16(true, (endian != undefined ? endian : _this.endian));
    const sign = (uint16Value & 0x8000) >> 15;
    const exponent = (uint16Value & 0x7C00) >> 10;
    const fraction = uint16Value & 0x03FF;

    let floatValue: number;

    if (exponent === 0) {
        if (fraction === 0) {
            floatValue = (sign === 0) ? 0 : -0; // +/-0
        } else {
            // Denormalized number
            floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
        }
    } else if (exponent === 0x1F) {
        if (fraction === 0) {
            floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        } else {
            floatValue = Number.NaN;
        }
    } else {
        // Normalized number
        floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
    }

    return floatValue;
}

export function whalffloat(_this: BiReader | BiWriter | ReaderBase, value: number, endian?: string): void {

    check_size(_this, 2, 0);

    const maxValue = 65504;
    const minValue = 5.96e-08;
    if (value < minValue || value > maxValue) {
        _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
        throw new Error('Value is out of range for the specified half float length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
    }
    const signMask = 0x8000;
    const exponentMask = 0x7C00;
    const fractionMask = 0x03FF;

    // Determine sign, exponent, and fraction bits
    let signBit = (value & signMask) >> 15;
    let exponentBits = (value & exponentMask) >> 10;
    let fractionBits = value & fractionMask;

    // Special cases for NaN and Infinity
    if (exponentBits === 0x1F) {
        // NaN or Infinity, copy exponent and fraction
        exponentBits = 0xFF;
    } else if (exponentBits === 0x00) {
        // Denormalized numbers, exponent is 0, adjust exponent bits
        exponentBits = 0x00;
        fractionBits = 0x00; // Clear fraction for denormals
    } else {
        // Normalized number, subtract exponent bias
        exponentBits -= 15;
    }

    // Combine sign, exponent, and fraction bits into half float format
    let halfFloatBits = (signBit << 15) | (exponentBits << 10) | fractionBits;

    // Write bytes based on endianness
    if ((endian == undefined ? _this.endian : endian) == "little") {
        _this.data[_this.offset] = halfFloatBits & 0xFF;
        _this.data[_this.offset + 1] = (halfFloatBits >> 8) & 0xFF;
    } else {
        _this.data[_this.offset] = (halfFloatBits >> 8) & 0xFF;
        _this.data[_this.offset + 1] = halfFloatBits & 0xFF;
    }

    _this.offset += 2;
    _this.bitoffset = 0;
}

export function wint32(_this: BiReader | BiWriter | ReaderBase, value: number, unsigned?: boolean, endian?: string): void {

    check_size(_this, 4, 0);

    if (unsigned == true) {
        if (value < 0 || value > 4294967295) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + 0 + " max: " + 4294967295 + " value: " + value);
        }
    } else {
        const maxValue = Math.pow(2, 32 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if ((endian == undefined ? _this.endian : endian) == "little") {
        _this.data[_this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        _this.data[_this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
        _this.data[_this.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
        _this.data[_this.offset + 3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
    } else {
        _this.data[_this.offset] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        _this.data[_this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
        _this.data[_this.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
        _this.data[_this.offset + 3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
    }
    _this.offset += 4;
    _this.bitoffset = 0;
}

export function rint32(_this: BiReader | BiWriter | ReaderBase, unsigned?: boolean, endian?: string): number {

    check_size(_this, 4);

    var read: number;
    if ((endian != undefined ? endian : _this.endian) == "little") {
        read = (((<unknown>_this.data[_this.offset + 3] as number & 0xFF) << 24) | ((<unknown>_this.data[_this.offset + 2] as number & 0xFF) << 16) | ((<unknown>_this.data[_this.offset + 1] as number & 0xFF) << 8) | (<unknown>_this.data[_this.offset] as number & 0xFF));
    } else {
        read = ((<unknown>_this.data[_this.offset] as number & 0xFF) << 24) | ((<unknown>_this.data[_this.offset + 1] as number & 0xFF) << 16) | ((<unknown>_this.data[_this.offset + 2] as number & 0xFF) << 8) | (<unknown>_this.data[_this.offset + 3] as number & 0xFF);
    }
    _this.offset += 4;
    _this.bitoffset = 0;
    if (unsigned == undefined || unsigned == false) {
        return read;
    } else {
        return read >>> 0;
    }
}

export function rfloat(_this: BiReader | BiWriter | ReaderBase, endian?: string): number {

    var uint32Value = _this.readInt32(true, (endian == undefined ? _this.endian : endian));
    // Check if the value is negative (i.e., the most significant bit is set)
    const isNegative = (uint32Value & 0x80000000) !== 0 ? 1 : 0;

    // Extract the exponent and fraction parts
    const exponent = (uint32Value >> 23) & 0xFF;
    const fraction = uint32Value & 0x7FFFFF;

    // Calculate the float value
    let floatValue: number;

    if (exponent === 0) {
        // Denormalized number (exponent is 0)
        floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
    } else if (exponent === 0xFF) {
        // Infinity or NaN (exponent is 255)
        floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
    } else {
        // Normalized number
        floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
    }

    return floatValue;
}

export function wfloat(_this: BiReader | BiWriter | ReaderBase, value: number, endian?: string): void {

    check_size(_this, 4, 0);

    const MIN_POSITIVE_FLOAT32 = Number.MIN_VALUE;
    const MAX_POSITIVE_FLOAT32 = 3.4028235e+38;
    const MIN_NEGATIVE_FLOAT32 = -3.4028235e+38;
    const MAX_NEGATIVE_FLOAT32 = -Number.MIN_VALUE;
    if (!((value === 0) ||
        (value >= MIN_POSITIVE_FLOAT32 && value <= MAX_POSITIVE_FLOAT32) ||
        (value >= MIN_NEGATIVE_FLOAT32 && value <= MAX_NEGATIVE_FLOAT32))) {
        _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
        throw new Error('Value is out of range for the specified float length.' + " min: " + MIN_NEGATIVE_FLOAT32 + " max: " + MAX_POSITIVE_FLOAT32 + " value: " + value);
    }

    const dataView = new DataView(new Uint8Array(4).buffer);
    dataView.setFloat32(0, value, true);
    let intValue = dataView.getInt32(0, true);

    let shift = 0;
    for (let i = 0; i < 4; i++) {
        if ((endian == undefined ? _this.endian : endian) == "little") {
            _this.data[_this.offset + i] = (intValue >> shift) & 0xFF;
        } else {
            _this.data[_this.offset + (3 - i)] = (intValue >> shift) & 0xFF;
        }
        shift += 8;
    }

    _this.offset += 4;
    _this.bitoffset = 0;
}

export function rint64(_this: BiReader | BiWriter | ReaderBase, unsigned?: boolean, endian?: string): bigint {

    check_size(_this, 8);

    // Convert the byte array to a BigInt
    let value: bigint = BigInt(0);
    if ((endian == undefined ? _this.endian : endian) == "little") {
        for (let i = 0; i < 8; i++) {
            value = value | BigInt((<unknown>_this.data[_this.offset] as number & 0xFF)) << BigInt(8 * i);
            _this.offset += 1
        }
        if (unsigned == undefined || unsigned == false) {
            if (value & (BigInt(1) << BigInt(63))) {
                value -= BigInt(1) << BigInt(64);
            }
        }
    } else {
        for (let i = 0; i < 8; i++) {
            value = (value << BigInt(8)) | BigInt((<unknown>_this.data[_this.offset] as number & 0xFF));
            _this.offset += 1
        }
        if (unsigned == undefined || unsigned == false) {
            if (value & (BigInt(1) << BigInt(63))) {
                value -= BigInt(1) << BigInt(64);
            }
        }
    }
    _this.bitoffset = 0;
    return value
}

export function wint64(_this: BiReader | BiWriter | ReaderBase, value: number, unsigned?: boolean, endian?: string): void {

    check_size(_this, 8, 0);

    if (unsigned == true) {
        if (value < 0 || value > Math.pow(2, 64) - 1) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + 0 + " max: " + (Math.pow(2, 64) - 1) + " value: " + value);
        }
    } else {
        const maxValue = Math.pow(2, 63) - 1;
        const minValue = -Math.pow(2, 63);
        if (value < minValue || value > maxValue) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    // Convert the BigInt to a 64-bit signed integer
    const bigIntArray = new BigInt64Array(1);
    bigIntArray[0] = BigInt(value);

    // Use two 32-bit views to write the Int64
    const int32Array = new Int32Array(bigIntArray.buffer);

    for (let i = 0; i < 2; i++) {
        if ((endian == undefined ? _this.endian : endian) == "little") {
            if (unsigned == undefined || unsigned == false) {
                _this.data[_this.offset + i * 4 + 0] = int32Array[i];
                _this.data[_this.offset + i * 4 + 1] = (int32Array[i] >> 8);
                _this.data[_this.offset + i * 4 + 2] = (int32Array[i] >> 16);
                _this.data[_this.offset + i * 4 + 3] = (int32Array[i] >> 24);
            } else {
                _this.data[_this.offset + i * 4 + 0] = int32Array[i] & 0xFF;
                _this.data[_this.offset + i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                _this.data[_this.offset + i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                _this.data[_this.offset + i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
            }
        } else {
            if (unsigned == undefined || unsigned == false) {
                _this.data[_this.offset + (1 - i) * 4 + 0] = int32Array[i];
                _this.data[_this.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 8);
                _this.data[_this.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 16);
                _this.data[_this.offset + (1 - i) * 4 + 3] = (int32Array[i] >> 24);
            } else {
                _this.data[_this.offset + (1 - i) * 4 + 0] = int32Array[i] & 0xFF;
                _this.data[_this.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                _this.data[_this.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                _this.data[_this.offset + (1 - i) * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
            }
        }
    }

    _this.offset += 8;
    _this.bitoffset = 0;
}

export function wdfloat(_this: BiReader | BiWriter | ReaderBase, value: number, endian?: string): void {

    check_size(_this, 8, 0);

    const MIN_POSITIVE_FLOAT64 = 2.2250738585072014e-308;
    const MAX_POSITIVE_FLOAT64 = Number.MAX_VALUE;
    const MIN_NEGATIVE_FLOAT64 = -Number.MAX_VALUE;
    const MAX_NEGATIVE_FLOAT64 = -2.2250738585072014e-308;
    if (!((value === 0) ||
        (value >= MIN_POSITIVE_FLOAT64 && value <= MAX_POSITIVE_FLOAT64) ||
        (value >= MIN_NEGATIVE_FLOAT64 && value <= MAX_NEGATIVE_FLOAT64))) {
        _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
        throw new Error('Value is out of range for the specified 64bit length.' + " min: " + MIN_NEGATIVE_FLOAT64 + " max: " + MAX_POSITIVE_FLOAT64 + " value: " + value);
    }
    const intArray = new Int32Array(2);
    const floatArray = new Float64Array(intArray.buffer);

    floatArray[0] = value;

    const bytes = new Uint8Array(intArray.buffer);

    for (let i = 0; i < 8; i++) {
        if ((endian == undefined ? _this.endian : endian) == "little") {
            _this.data[_this.offset + i] = bytes[i];
        } else {
            _this.data[_this.offset + (7 - i)] = bytes[i];
        }
    }

    _this.offset += 8
    _this.bitoffset = 0
}

export function rdfloat(_this: BiReader | BiWriter | ReaderBase, endian?: string): number {

    var uint64Value = _this.readInt64(true, (endian == undefined ? _this.endian : endian));
    const sign = (uint64Value & 0x8000000000000000n) >> 63n;
    const exponent = Number((uint64Value & 0x7FF0000000000000n) >> 52n) - 1023;
    const fraction = Number(uint64Value & 0x000FFFFFFFFFFFFFn) / Math.pow(2, 52);

    var floatValue: number;

    if (exponent == -1023) {
        if (fraction == 0) {
            floatValue = (sign == 0n) ? 0 : -0; // +/-0
        } else {
            // Denormalized number
            floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, -1022) * fraction;
        }
    } else if (exponent == 1024) {
        if (fraction == 0) {
            floatValue = (sign == 0n) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        } else {
            floatValue = Number.NaN;
        }
    } else {
        // Normalized number
        floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
    }

    return floatValue;
}

export function rstring(_this: BiReader | BiWriter | ReaderBase, options?: {
    length?: number,
    stringType?: string,
    terminateValue?: number,
    lengthReadSize?: number,
    stripNull?: boolean,
    encoding?: string,
    endian?: string,
}): string {

    var length: any = options && options.length;
    var stringType: any = options && options.stringType || 'utf-8';
    var terminateValue: any = options && options.terminateValue;
    var lengthReadSize: any = options && options.lengthReadSize || 1;
    var stripNull: any = options && options.stripNull || true;
    var encoding: any = options && options.encoding || 'utf-8';
    var endian: any = options && options.endian || _this.endian;

    var terminate = terminateValue;

    if (length != undefined) {
        check_size(_this, length);
    }

    if (typeof terminateValue == "number") {
        terminate = terminateValue & 0xFF;
    } else {
        if (terminateValue != undefined) {
            throw new Error("terminateValue must be a number");
        }
    }

    if (stringType == 'utf-8' || stringType == 'utf-16') {

        if (encoding == undefined) {
            if (stringType == 'utf-8') {
                encoding = 'utf-8';
            }
            if (stringType == 'utf-16') {
                encoding = 'utf-16';
            }
        }

        // Read the string as UTF-8 encoded untill 0 or terminateValue
        const encodedBytes: Array<number> = [];

        if (length == undefined && terminateValue == undefined) {
            terminate = 0;
        }

        var read_length = 0;

        if (length != undefined) {
            read_length = length;
        } else {
            read_length = _this.data.length - _this.offset;
        }

        for (let i = 0; i < read_length; i++) {
            if (stringType === 'utf-8') {
                var read = _this.readUByte();
                if (read == terminate) {
                    break;
                } else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read);
                    }
                }
            } else {
                var read = _this.readInt16(true, endian);
                var read1 = read & 0xFF;
                var read2 = (read >> 8) & 0xFF;
                if (read == terminate) {
                    break;
                } else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read1);
                        encodedBytes.push(read2);
                    }
                }
            }
        }

        return new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));

    } else if (stringType == 'pascal' || stringType == 'wide-pascal') {

        if (encoding == undefined) {
            if (stringType == 'pascal') {
                encoding = 'utf-8';
            }
            if (stringType == 'wide-pascal') {
                encoding = 'utf-16';
            }
        }

        var maxBytes: number;
        if (lengthReadSize == 1) {
            maxBytes = _this.readUByte();
        } else if (lengthReadSize == 2) {
            maxBytes = _this.readInt16(true, endian);
        } else if (lengthReadSize == 4) {
            maxBytes = _this.readInt32(true, endian);
        } else {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : ""
            throw new Error("Invalid length read size: " + lengthReadSize);
        }

        // Read the string as Pascal or Delphi encoded
        const encodedBytes: Array<number> = [];
        for (let i = 0; i < maxBytes; i++) {
            if (stringType == 'wide-pascal') {
                const read = _this.readInt16(true, endian)
                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read)
                }
            } else {
                const read = _this.readUByte()
                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read)
                }
            }
        }
        var str_return: string
        if (stringType == 'wide-pascal') {
            str_return = new TextDecoder(encoding).decode(new Uint16Array(encodedBytes));
        } else {
            str_return = new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
        }

        return str_return
    } else {
        throw new Error('Unsupported string type: ' + stringType);
    }
}

export function wstring(_this: BiReader | BiWriter | ReaderBase, string: string, options?: {
    length?: number,
    stringType?: string,
    terminateValue?: number,
    lengthWriteSize?: number,
    stripNull?: boolean,
    encoding?: string,
    endian?: string,
}): void {
    var length: any = options && options.length;
    var stringType: any = options && options.stringType || 'utf-8';
    var terminateValue: any = options && options.terminateValue;
    var lengthWriteSize: any = options && options.lengthWriteSize || 1;
    var encoding: any = options && options.encoding || 'utf-8';
    var endian: any = options && options.endian || _this.endian;

    if (stringType === 'utf-8' || stringType === 'utf-16') {
        // Encode the string in the specified encoding

        if (encoding == undefined) {
            if (stringType == 'utf-8') {
                encoding = 'utf-8';
            }
            if (stringType == 'utf-16') {
                encoding = 'utf-16';
            }
        }

        const encoder = new TextEncoder();

        const encodedString = encoder.encode(string);

        if (length == undefined && terminateValue == undefined) {
            terminateValue = 0;
        }

        var totalLength = (length || encodedString.length) + (terminateValue != undefined ? 1 : 0);

        if (stringType == 'utf-16') {
            totalLength = (length || (encodedString.length * 2)) + (terminateValue != undefined ? 2 : 0);
        }

        check_size(_this, totalLength, 0);

        // Write the string bytes to the Uint8Array
        for (let i = 0; i < encodedString.length; i++) {
            if (stringType === 'utf-16') {
                const charCode = encodedString[i];
                if (endian == "little") {
                    _this.data[_this.offset + i * 2] = charCode & 0xFF;
                    _this.data[_this.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                } else {
                    _this.data[_this.offset + i * 2 + 1] = charCode & 0xFF;
                    _this.data[_this.offset + i * 2] = (charCode >> 8) & 0xFF;
                }
            } else {
                _this.data[_this.offset + i] = encodedString[i];
            }
        }

        if (terminateValue != undefined) {
            if (stringType === 'utf-16') {
                _this.data[_this.offset + totalLength - 1] = terminateValue & 0xFF;
                _this.data[_this.offset + totalLength] = (terminateValue >> 8) & 0xFF;
            } else {
                _this.data[_this.offset + totalLength] = terminateValue;
            }
        }

        _this.offset += totalLength;
        _this.bitoffset = 0;

    } else if (stringType == 'pascal' || stringType == 'wide-pascal') {

        if (encoding == undefined) {
            if (stringType == 'pascal') {
                encoding = 'utf-8';
            }
            if (stringType == 'wide-pascal') {
                encoding = 'utf-16';
            }
        }

        const encoder = new TextEncoder();

        // Calculate the length of the string based on the specified max length
        var maxLength: number;

        // Encode the string in the specified encoding
        if (lengthWriteSize == 1) {
            maxLength = 255;
        } else if (lengthWriteSize == 2) {
            maxLength = 65535;
        } else if (lengthWriteSize == 4) {
            maxLength = 4294967295;
        } else {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error("Invalid length write size: " + lengthWriteSize);
        }
        if (string.length > maxLength || (length || 0) > maxLength) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error("String outsize of max write length: " + maxLength);
        }
        var maxBytes = Math.min(string.length, maxLength);
        const encodedString = encoder.encode(string.substring(0, maxBytes));

        var totalLength = (length || encodedString.length);

        if (stringType == 'wide-pascal') {
            totalLength = (length || (encodedString.length * 2));
        }

        if (lengthWriteSize == 1) {
            _this.writeUByte(maxBytes);
        } else if (lengthWriteSize == 2) {
            _this.writeUInt16(maxBytes, endian);
        } else if (lengthWriteSize == 4) {
            _this.writeUInt32(maxBytes, endian);
        }

        check_size(_this, totalLength, 0)

        // Write the string bytes to the Uint8Array
        for (let i = 0; i < encodedString.length; i++) {
            if (stringType == 'wide-pascal') {
                const charCode = encodedString[i];
                if (endian == "little") {
                    _this.data[_this.offset + i * 2] = charCode & 0xFF;
                    _this.data[_this.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                } else {
                    _this.data[_this.offset + i * 2 + 1] = charCode & 0xFF;
                    _this.data[_this.offset + i * 2] = (charCode >> 8) & 0xFF;
                }
            } else {
                _this.data[_this.offset + i] = encodedString[i];
            }
        }

        _this.offset += totalLength;
        _this.bitoffset = 0;
    } else {
        throw new Error('Unsupported string type: ' + stringType);
    }
}

export class ReaderBase{
    /**
     * Endianness of default read. 
     * @type {'little'|'big'}
     */
    public endian: string = "little";
    /**
     * Current read byte location.
     */
    public offset: number = 0;
    /**
     * Current read byte's bit location.
     */
    public bitoffset: number = 0;
    /**
     * Size in bytes of the current buffer.
     */
    public size: number = 0;
    /**
     * Size in bits of the current buffer.
     */
    public sizeB: number = 0;
    /**
     * Allows the buffer to extend reading or writing outside of current size
     */
    public strict: boolean = false;
    /**
     * Console log a hexdump on error.
     */
    public errorDump: boolean = true;
    /**
     * Current buffer data.
     * @type {Buffer|Uint8Array}
     */
    public data: any = [];

    isBufferOrUint8Array(obj: Buffer | Uint8Array): boolean {
        return arraybuffcheck(this, obj);
    }

    extendArray(to_padd: number): void {
        return extendarray(this, to_padd);
    }

    /**
     *
     * Change endian, defaults to little.
     * 
     * Can be changed at any time, doesn't loose position.
     *
     * @param {string} endian - endianness ``big`` or ``little``
     */
    endianness(endian: string): void {
        if (endian == undefined || typeof endian != "string") {
            throw new Error("Endian must be big or little");
        }
        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new Error("Endian must be big or little");
        }
        this.endian = endian;
    }

    /**
     * Sets endian to big.
     */
    bigEndian(): void {
        this.endianness("big");
    }

    /**
     * Sets endian to big.
     */
    big(): void {
        this.endianness("big");
    }

    /**
     * Sets endian to big.
     */
    be(): void {
        this.endianness("big");
    }

    /**
     * Sets endian to little.
     */
    littleEndian(): void {
        this.endianness("little");
    }

    /**
     * Sets endian to little.
     */
    little(): void {
        this.endianness("little");
    }

    /**
     * Sets endian to little.
     */
    le(): void {
        this.endianness("little");
    }

    /**
     * Size in bytes of the current buffer.
     * 
     * @returns {number} size
     */
    get length(): number {
        return this.size;
    }

    /**
     * Size in bytes of the current buffer.
     * 
     * @returns {number} size
     */
    get len(): number {
        return this.size;
    }

    /**
     * Size in bytes of the current buffer.
     * 
     * @returns {number} size
     */
    get FileSize(): number {
        return this.size;
    }

    /**
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get lengthB(): number {
        return this.sizeB;
    }

    /**
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get FileSizeB(): number {
        return this.sizeB;
    }

    /**
     * Size in bits of the current buffer.
     * 
     * @returns {number} size
     */
    get lenb(): number {
        return this.sizeB;
    }

    //
    //get position
    //

    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get tell(): number {
        return this.offset;
    }

    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get FTell(): number {
        return this.offset;
    }

    /**
     * Get the current byte position.
     *
     * @return {number} current byte position
     */
    get getOffset(): number {
        return this.offset;
    }

    /**
     * Get the current byte position;
     *
     * @return {number} current byte position
     */
    get saveOffset(): number {
        return this.offset;
    }

    /**
     * Get the current byte position;
     *
     * @return {number} current byte position
     */
    get off(): number{
        return this.offset;
    }

    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get getOffsetBit(): number {
        return this.bitoffset;
    }

    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get tellB(): number {
        return this.bitoffset;
    }

    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get FTellB(): number {
        return this.bitoffset;
    }

    /**
     * Get the current bit position (0-7).
     *
     * @return {number} current bit position
     */
    get offb():number{
        return this.bitoffset;
    }

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get getOffsetAbsBit(): number {
        return (this.offset * 8) + this.bitoffset;
    }

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current bit position
     */
    get saveOffsetAbsBit(): number {
        return (this.offset * 8) + this.bitoffset;
    }

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get tellAbsB(): number {
        return (this.offset * 8) + this.bitoffset;
    }

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get saveOffsetBit(): number {
        return (this.offset * 8) + this.bitoffset;
    }

    /**
     * Get the current absolute bit position (from start of data).
     *
     * @return {number} current absolute bit position
     */
    get offab():number{
        return (this.offset * 8) + this.bitoffset;
    }

    /**
     * Size in bytes of current read position to the end
     * 
     * @returns {number} size
     */
    get remain(): number {
        return this.size - this.offset;
    }

    /**
     * Size in bytes of current read position to the end
     * 
     * @returns {number} size
     */
    get FEoF(): number {
        return this.size - this.offset;
    }

    /**
     * Size in bits of current read position to the end
     * 
     * @returns {number} size
     */
    get remainB(): number {
        return (this.size * 8) - this.saveOffsetAbsBit;
    }

    /**
     * Size in bits of current read position to the end
     * 
     * @returns {number} size
     */
    get FEoFB(): number {
        return (this.size * 8) - this.saveOffsetAbsBit;
    }

    /**
     * Row line of the file (16 bytes per row).
     * 
     * @returns {number} size
     */
    get getLine(): number {
        return Math.abs(Math.floor((this.offset - 1) / 16));
    }

    /**
     * Row line of the file (16 bytes per row).
     * 
     * @returns {number} size
     */
    get row(): number {
        return Math.abs(Math.floor((this.offset - 1) / 16));
    }

    //
    //finishing
    //

    /**
     * Returns current data.
     * 
     * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
     */
    get get(): Buffer | Uint8Array {
        return this.data;
    }

    /**
     * Returns current data.
     * 
     * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
     */
    get return(): Buffer | Uint8Array {
        return this.data;
    }

     /**
     * Console logs data as hex dump.
     * 
     * @param {object} options 
     * ```javascript
     *   {
     *       length: 192, // number of bytes to log, default 192 or end of data
     *       startByte: 0, // byte to start dump (default current byte position)
     *       supressUnicode: false // Supress unicode character preview for even columns
     *   }
     * ```
     */
    hexdump(options?: { length?: number, startByte?: number, supressUnicode?: boolean }): void {
        return hexDump(this, options);
    }

    /**
     * Turn hexdump on error off (default on).
     */
    errorDumpOff(): void {
        this.errorDump = false;
    }

    /**
     * Turn hexdump on error on (default on).
     */
    errorDumpOn(): void {
        this.errorDump = true;
    }

    //
    //strict mode change
    //

    /**
     * Disallows extending data if position is outside of max size.
     */
    restrict(): void {
        this.strict = true;
    }

    /**
     * Allows extending data if position is outside of max size.
     */
    unrestrict(): void {
        this.strict = false;
    }

    /**
     * removes data.
     */
    end(): void {
        this.data = undefined;
    }

    /**
     * removes data.
     */
    close(): void {
        this.data = undefined;
    }

    /**
     * removes data.
     */
    done(): void {
        this.data = undefined;
    }

    /**
     * removes data.
     */
    finished(): void {
        this.data = undefined;
    }

    //
    //find
    //

    /**
     * Searches for byte position of string from current read position.
     * 
     * Returns -1 if not found.
     * 
     * Does not change current read position.
     * 
     * @param {string} string - String to search for.
     */
    findString(string: string): number {
        return fString(this, string);
    }

    /**
     * Searches for byte value (can be signed or unsigned) position from current read position.
     * 
     * Returns -1 if not found.
     * 
     * Does not change current read position.
     * 
     * @param {number} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {string} endian - endianness of value (default set endian).
     */
    findByte(value: number, unsigned?: boolean, endian?: string): number {
        return fNumber(this, value, 8, unsigned == undefined ? true : unsigned, endian);
    }

    /**
     * Searches for short value (can be signed or unsigned) position from current read position.
     * 
     * Returns -1 if not found.
     * 
     * Does not change current read position.
     * 
     * @param {number} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {string} endian - endianness of value (default set endian).
     */
    findShort(value: number, unsigned?: boolean, endian?: string): number {
        return fNumber(this, value, 16, unsigned == undefined ? true : unsigned, endian);
    }

    /**
     * Searches for integer value (can be signed or unsigned) position from current read position.
     * 
     * Returns -1 if not found.
     * 
     * Does not change current read position.
     * 
     * @param {number} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {string} endian - endianness of value (default set endian).
     */
    findInt(value: number, unsigned?: boolean, endian?: string): number {
        return fNumber(this, value, 32, unsigned == undefined ? true : unsigned, endian);
    }

    /**
     * Searches for 64 bit value (can be signed or unsigned) position from current read position.
     * 
     * Returns -1 if not found.
     * 
     * Does not change current read position.
     * 
     * @param {number} value - Number to search for.
     * @param {boolean} unsigned - If the number is unsigned (default true)
     * @param {string} endian - endianness of value (default set endian).
     */
    findInt64(value: number, unsigned?: boolean, endian?: string): number {
        return fBigInt(this, value, unsigned == undefined ? true : unsigned, endian);
    }

    /**
     * Searches for half float value position from current read position.
     * 
     * Returns -1 if not found.
     * 
     * Does not change current read position.
     * 
     * @param {number} value - Number to search for.
     * @param {string} endian - endianness of value (default set endian).
     */
    findHalfFloat(value: number, endian?: string): number {
        return fHalfFloat(this, value, endian);
    }

    /**
     * Searches for float value position from current read position.
     * 
     * Returns -1 if not found.
     * 
     * Does not change current read position.
     * 
     * @param {number} value - Number to search for.
     * @param {string} endian - endianness of value (default set endian).
     */
    findFloat(value: number, endian?: string): number {
        return fFloat(this, value, endian);
    }

    /**
     * Searches for double float value position from current read position.
     * 
     * Returns -1 if not found.
     * 
     * Does not change current read position.
     * 
     * @param {number} value - Number to search for.
     * @param {string} endian - endianness of value (default set endian).
     */
    findDoubleFloat(value: number, endian?: string): number {
        return fDoubleFloat(this, value, endian);
    }

    //
    // move from current position
    //

    /**
     * Aligns current byte position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} number - Byte to align
     */
    align(number: number): void {
        return align(this, number);
    }

    /**
     * Reverse aligns current byte position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} number - Byte to align
     */
    alignRev(number: number): void {
        return alignRev(this, number);
    }

    //
    // directly set current position
    //

    /**
     * Offset current byte or bit position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    skip(bytes: number, bits?: number): void {
        return skip(this, bytes, bits);
    }

    /**
    * Offset current byte or bit position.
    * 
    * Note: Will extend array if strict mode is off and outside of max size.
    * 
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip
    */
    jump(bytes: number, bits?: number): void {
        this.skip(bytes, bits);
    }

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    FSeek(byte: number, bit?: number): void {
        return goto(this, byte, bit)
    }

    /**
     * Offset current byte or bit position.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} bytes - Bytes to skip
     * @param {number} bits - Bits to skip
     */
    seek(bytes: number, bits?: number): void {
        return this.skip(bytes, bits)
    }

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    goto(byte: number, bit?: number): void {
        return goto(this, byte, bit);
    }

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    pointer(byte: number, bit?: number): void {
        return this.goto(byte, bit)
    }

    /**
     * Change position directly to address.
     * 
     * Note: Will extend array if strict mode is off and outside of max size.
     * 
     * @param {number} byte - byte to set to
     * @param {number} bit - bit to set to
     */
    warp(byte: number, bit?: number): void {
        return this.goto(byte, bit)
    }

    //
    // go to start
    //

    /**
     * Set byte and bit position to start of data.
     */
    rewind(): void {
        this.offset = 0;
        this.bitoffset = 0;
    }

    /**
     * Set byte and bit position to start of data.
     */
    gotoStart(): void {
        return this.rewind();
    }

    /**
     * Set current byte and bit position to end of data.
     */
    last(): void {
        this.offset = this.size;
        this.bitoffset = 0;
    }

    /**
     * Set current byte and bit position to end of data.
     */
    gotoEnd(): void {
        this.offset = this.size;
        this.bitoffset = 0;
    }

    /**
     * Set byte and bit position to start of data.
     */
    EoF(): void {
        this.offset = this.size;
        this.bitoffset = 0;
    }

    //
    //remove part of data
    //

    /**
     * Deletes part of data from start to current byte position unless supplied, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @param {number} startOffset - Start location (default 0)
     * @param {number} endOffset - End location (default current position)
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    delete(startOffset?: number, endOffset?: number, consume?: boolean): Buffer | Uint8Array {
        return remove(this, startOffset || 0, endOffset || this.offset, consume || false, true);
    }

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    clip(): Buffer | Uint8Array {
        return remove(this, this.offset, this.size, false, true);
    }

    /**
     * Deletes part of data from current byte position to end, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    trim(): Buffer | Uint8Array {
        return remove(this, this.offset, this.size, false, true);
    }

    /**
     * Deletes part of data from current byte position to supplied length, returns removed.
     * 
     * Note: Errors in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    crop(length: number, consume?: boolean): Buffer | Uint8Array {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }

    /**
     * Deletes part of data from current position to supplied length, returns removed.
     * 
     * Note: Only works in strict mode.
     * 
     * @param {number} length - Length of data in bytes to remove
     * @param {boolean} consume - Move position to end of removed data (default false)
     * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
     */
    drop(length: number, consume?: boolean): Buffer | Uint8Array {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }

    /**
     * Replaces data in data.
     * 
     * Note: Must be same data type as supplied data. Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    replace(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void {
        return addData(this, data, consume || false, offset || this.offset, true);
    }

    /**
     * Replaces data in data.
     * 
     * Note: Must be same data type as supplied data. Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Offset to add it at (defaults to current position)
     */
    overwrite(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void {
        return addData(this, data, consume || false, offset || this.offset, true);
    }

    //
    // copy out
    //

    /**
     * Returns part of data from current byte position to end of data unless supplied.
     * 
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    lift(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer | Uint8Array {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }

    /**
     * Returns part of data from current byte position to end of data unless supplied.
     * 
     * @param {number} startOffset - Start location (default current position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move position to end of lifted data (default false)
     * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    fill(startOffset?: number, endOffset?: number, consume?: boolean, fillValue?: number): Buffer | Uint8Array {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    extract(length: number, consume?: boolean): Buffer | Uint8Array {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    slice(length: number, consume?: boolean): Buffer | Uint8Array {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }

    /**
     * Extract data from current position to length supplied.
     * 
     * Note: Does not affect supplied data.
     * 
     * @param {number} length - Length of data in bytes to copy from current offset
     * @param {number} consume - Moves offset to end of length
     * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
     */
    wrap(length: number, consume?: boolean): Buffer | Uint8Array {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }

    //
    //insert
    //

    /**
     * Inserts data into data.
     * 
     * Note: Must be same data type as supplied data. Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    insert(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void {
        return addData(this, data, consume || false, offset || this.offset, false);
    }

    /**
     * Inserts data into data.
     * 
     * Note: Must be same data type as supplied data. Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current byte position to end of data (default false)
     * @param {number} offset - Byte position to add at (defaults to current position)
     */
    place(data: Buffer | Uint8Array, consume?: boolean, offset?: number): void {
        return addData(this, data, consume || false, offset || this.offset, false);
    }

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Must be same data type as supplied data. Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    unshift(data: Buffer | Uint8Array, consume?: boolean): void {
        return addData(this, data, consume || false, 0, false);
    }

    /**
     * Adds data to start of supplied data.
     * 
     * Note: Must be same data type as supplied data. Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    prepend(data: Buffer | Uint8Array, consume?: boolean): void {
        return addData(this, data, consume || false, 0, false);
    }

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Must be same data type as supplied data. Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    push(data: Buffer | Uint8Array, consume?: boolean): void {
        return addData(this, data, consume || false, this.size, false);
    }

    /**
     * Adds data to end of supplied data.
     * 
     * Note: Must be same data type as supplied data. Errors on strict mode.
     * 
     * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
     * @param {boolean} consume - Move current write position to end of data (default false)
     */
    append(data: Buffer | Uint8Array, consume?: boolean): void {
        return addData(this, data, consume || false, this.size, false);
    }

    //
    // math
    //

    /**
     * XOR data.
     * 
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xor(xorKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var XORKey: any = xorKey;
        if (typeof xorKey == "number") {
            //pass
        } else
            if (typeof xorKey == "string") {
                xorKey = new TextEncoder().encode(xorKey);
            } else
                if (this.isBufferOrUint8Array(XORKey)) {
                    //pass
                } else {
                    throw new Error("XOR must be a number, string, Uint8Array or Buffer");
                }
        return XOR(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }

    /**
     * XOR data.
     * 
     * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
     * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    xorThis(xorKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;
        var XORKey: any = xorKey;
        if (typeof xorKey == "number") {
            Length = length || 1;
        } else
            if (typeof xorKey == "string") {
                const encoder = new TextEncoder().encode(xorKey);
                XORKey = encoder;
                Length = length || encoder.length;
            } else
                if (this.isBufferOrUint8Array(XORKey)) {
                    Length = length || xorKey.length;
                } else {
                    throw new Error("XOR must be a number, string, Uint8Array or Buffer");
                }
        return XOR(this, XORKey, this.offset, this.offset + Length, consume || false);
    }

    /**
     * OR data
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    or(orKey: number | string | Uint8Array | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var ORKey: any = orKey;
        if (typeof orKey == "number") {
            //pass
        } else
            if (typeof orKey == "string") {
                orKey = new TextEncoder().encode(orKey);
            } else
                if (this.isBufferOrUint8Array(ORKey)) {
                    //pass
                } else {
                    throw new Error("OR must be a number, string, Uint8Array or Buffer");
                }
        return OR(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }

    /**
     * OR data.
     * 
     * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
     * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    orThis(orKey: number | string | Uint8Array | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;
        var ORKey: any = orKey;
        if (typeof orKey == "number") {
            Length = length || 1;
        } else
            if (typeof orKey == "string") {
                const encoder = new TextEncoder().encode(orKey);
                ORKey = encoder;
                Length = length || encoder.length;
            } else
                if (this.isBufferOrUint8Array(ORKey)) {
                    Length = length || orKey.length
                } else {
                    throw new Error("OR must be a number, string, Uint8Array or Buffer");
                }
        return OR(this, ORKey, this.offset, this.offset + Length, consume || false);
    }

    /**
     * AND data.
     * 
     * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    and(andKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var ANDKey: any = andKey;
        if (typeof ANDKey == "number") {
            //pass
        } else
            if (typeof ANDKey == "string") {
                ANDKey = new TextEncoder().encode(ANDKey);
            } else
                if (typeof ANDKey == "object") {
                    //pass
                } else {
                    throw new Error("AND must be a number, string, number array or Buffer");
                }
        return AND(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }

    /**
     * AND data.
     * 
     * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
     * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    andThis(andKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;
        var ANDKey: any = andKey;
        if (typeof andKey == "number") {
            Length = length || 1;
        } else
            if (typeof andKey == "string") {
                const encoder = new TextEncoder().encode(andKey);
                ANDKey = encoder;
                Length = length || encoder.length;
            } else
                if (typeof andKey == "object") {
                    Length = length || andKey.length;
                } else {
                    throw new Error("AND must be a number, string, number array or Buffer");
                }
        return AND(this, ANDKey, this.offset, this.offset + Length, consume || false);
    }

    /**
     * Add value to data.
     * 
     * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    add(addKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var addedKey: any = addKey;
        if (typeof addedKey == "number") {
            //pass
        } else
            if (typeof addedKey == "string") {
                addedKey = new TextEncoder().encode(addedKey);
            } else
                if (typeof addedKey == "object") {
                    //pass
                } else {
                    throw new Error("Add key must be a number, string, number array or Buffer");
                }
        return ADD(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }

    /**
     * Add value to data.
     * 
     * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
     * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    addThis(addKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;
        var AddedKey: any = addKey;
        if (typeof AddedKey == "number") {
            Length = length || 1;
        } else
            if (typeof AddedKey == "string") {
                const encoder = new TextEncoder().encode(AddedKey);
                AddedKey = encoder;
                Length = length || encoder.length;
            } else
                if (typeof AddedKey == "object") {
                    Length = length || AddedKey.length;
                } else {
                    throw new Error("Add key must be a number, string, number array or Buffer");
                }
        return ADD(this, AddedKey, this.offset, this.offset + Length, consume || false);
    }

    /**
     * Not data.
     * 
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    not(startOffset?: number, endOffset?: number, consume?: boolean): void {
        return NOT(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }

    /**
     * Not data.
     * 
     * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    notThis(length?: number, consume?: boolean): void {
        return NOT(this, this.offset, this.offset + (length || 1), consume || false);
    }

    /**
     * Left shift data.
     * 
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var lShiftKey: any = shiftKey;
        if (typeof lShiftKey == "number") {
            //pass
        } else
            if (typeof lShiftKey == "string") {
                lShiftKey = new TextEncoder().encode(lShiftKey);
            } else
                if (typeof lShiftKey == "object") {
                    //pass
                } else {
                    throw new Error("Left shift must be a number, string, number array or Buffer");
                }
        return LSHIFT(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }

    /**
     * Left shift data.
     * 
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
     * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    lShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;
        var lShiftKey: any = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        } else
            if (typeof lShiftKey == "string") {
                const encoder = new TextEncoder().encode(lShiftKey);
                lShiftKey = encoder;
                Length = length || encoder.length;
            } else
                if (typeof lShiftKey == "object") {
                    Length = length || lShiftKey.length;
                } else {
                    throw new Error("Left shift must be a number, string, number array or Buffer");
                }
        return LSHIFT(this, shiftKey, this.offset, this.offset + Length, consume || false);
    }

    /**
     * Right shift data.
     * 
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} startOffset - Start location (default current byte position)
     * @param {number} endOffset - End location (default end of data)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShift(shiftKey: number | string | Array<number> | Buffer, startOffset?: number, endOffset?: number, consume?: boolean): void {
        var rShiftKey: any = shiftKey;
        if (typeof rShiftKey == "number") {
            //pass
        } else
            if (typeof rShiftKey == "string") {
                rShiftKey = new TextEncoder().encode(rShiftKey);
            } else
                if (typeof rShiftKey == "object") {
                    //pass
                } else {
                    throw new Error("Right shift must be a number, string, number array or Buffer");
                }
        return RSHIFT(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }

    /**
     * Right shift data.
     * 
     * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
     * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
     * @param {boolean} consume - Move current position to end of data (default false)
     */
    rShiftThis(shiftKey: number | string | Array<number> | Buffer, length?: number, consume?: boolean): void {
        var Length: number = length || 1;
        var lShiftKey: any = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        } else
            if (typeof lShiftKey == "string") {
                const encoder = new TextEncoder().encode(lShiftKey);
                lShiftKey = encoder;
                Length = length || encoder.length;
            } else
                if (typeof lShiftKey == "object") {
                    Length = length || lShiftKey.length;
                } else {
                    throw new Error("Right shift must be a number, string, number array or Buffer");
                }
        return RSHIFT(this, lShiftKey, this.offset, this.offset + Length, consume || false);
    }

    //
    //bit reader
    //

    /**
     *
     * Write bits, must have at least value and number of bits.
     * 
     * ``Note``: When returning to a byte write, remaining bits are skipped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - number of bits to write
     * @param {boolean} unsigned - if value is unsigned
     * @param {string} endian - ``big`` or ``little``
     */
    writeBit(value: number, bits: number, unsigned?: boolean, endian?: string): void {
        return wbit(this, value, bits, unsigned, endian);
    }

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitBE(value: number, bits: number): void{
        return wbit(this, value, bits, true, "big");
    }

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int 
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns number
     */
    writeBitBE(value: number, bits: number, unsigned?: boolean): void{
        return wbit(this, value, bits, unsigned, "big");
    }

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @returns number
     */
    writeUBitLE(value: number,bits: number): void{
        return wbit(this, value, bits, true, "little");
    }

    /**
     * Bit field writer.
     * 
     * Note: When returning to a byte write, remaining bits are dropped.
     *
     * @param {number} value - value as int
     * @param {number} bits - bits to write
     * @param {boolean} unsigned - if the value is unsigned
     * @returns number
     */
    writeBitLE(value: number,bits: number, unsigned?: boolean): void{
        return wbit(this, value, bits, unsigned, "little");
    }

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readBit(bits?: number, unsigned?: boolean, endian?: string): number {
        return rbit(this, bits, unsigned, endian);
    }

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitBE(bits: number): number {
        return this.readBit(bits, true, "big");
    }

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitBE(bits: number, unsigned?: boolean): number {
        return this.readBit(bits, unsigned, "big");
    }

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @returns {number}
     */
    readUBitLE(bits: number): number {
        return this.readBit(bits, true, "little");
    }

    /**
     * Bit field reader.
     * 
     * Note: When returning to a byte read, remaining bits are dropped.
     *
     * @param {number} bits - bits to read
     * @param {boolean} unsigned - if the value is unsigned
     * @returns {number}
     */
    readBitLE(bits: number, unsigned?: boolean): number {
        return this.readBit(bits, unsigned, "little");
    }

    /**
     * Read byte.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number}
     */
    readByte(unsigned?: boolean): number {
        return rbyte(this, unsigned);
    }

    /**
     * Read multiple bytes.
     * 
     * @param {number} amount - amount of bytes to read
     * @param {boolean} unsigned - if value is unsigned or not
     * @returns {number[]}
     */
    readBytes(amount:number, unsigned?: boolean): number[] {
        return Array.from({length: amount}, () => rbyte(this, unsigned));
    }

    /**
     * Write byte.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeByte(value: number, unsigned?: boolean): void {
        return wbyte(this, value, unsigned);
    }

    /**
     * Write multiple bytes.
     * 
     * @param {number[]} values - array of values as int
     * @param {boolean} unsigned - if the value is unsigned
     */
    writeBytes(values: number[], unsigned?: boolean): void {
        for (let i = 0; i < values.length; i++) {
            wbyte(this, values[i], unsigned);
        }
    }

    /**
     * Write unsigned byte.
     *
     * @param {number} value - value as int 
     */
    writeUByte(value: number): void {
        return wbyte(this, value, true);
    }

    /**
     * Read unsigned byte.
     * 
     * @returns {number}
     */
    readUByte(): number {
        return this.readByte(true);
    }

    /**
     * Read short.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt16(unsigned?: boolean, endian?: string): number {
        return rint16(this, unsigned, endian);
    }

    /**
     * Write int16.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     */
    writeInt16(value: number, unsigned?: boolean, endian?: string): void {
        return wint16(this, value, unsigned, endian);
    }

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     * @param {string} endian - ``big`` or ``little``
     */
    writeUInt16(value: number, endian?: string): void {
        return wint16(this, value, true, endian);
    }

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    writeUInt16BE(value: number): void {
        return this.writeInt16(value, true, "big");
    }

    /**
     * Write unsigned int16.
     *
     * @param {number} value - value as int 
     */
    writeUInt16LE(value: number): void {
        return this.writeInt16(value, true, "little");
    }

    /**
     * Write signed int16.
     *
     * @param {number} value - value as int 
     */
    writeInt16LE(value: number): void {
        return this.writeInt16(value, false, "little");
    }

    /**
     * Read unsigned short.
     * 
     * @param {string} endian - ``big`` or ``little``
     * 
     * @returns {number}
     */
    readUInt16(endian?: string): number {
        return this.readInt16(true, endian);
    }

    /**
     * Read unsigned short in little endian.
     * 
     * @returns {number}
     */
    readUInt16LE(): number {
        return this.readInt16(true, "little");
    }

    /**
     * Read signed short in little endian.
     * 
     * @returns {number}
     */
    readInt16LE(): number {
        return this.readInt16(false, "little");
    }

    /**
     * Read unsigned short in big endian.
     * 
     * @returns {number}
     */
    readUInt16BE(): number {
        return this.readInt16(true, "big");
    }

    /**
    * Read signed short in big endian.
    * 
    * @returns {number}
    */
    readInt16BE(): number {
        return this.readInt16(false, "big");
    }

    /**
     * Read half float.
     * 
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readHalfFloat(endian?: string): number {
        return rhalffloat(this, endian);
    }

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     * @param {string} endian - ``big`` or ``little``
     */
    writeHalfFloat(value: number, endian?: string): void {
        return whalffloat(this, value, endian);
    }

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    writeHalfFloatBE(value: number): void{
        return this.writeHalfFloat(value, "big");
    }

    /**
     * Writes half float.
     * 
     * @param {number} value - value as int 
     */
    writeHalfFloatLE(value: number): void{
        return this.writeHalfFloat(value, "little");
    }

    /**
    * Read half float.
    * 
    * @returns {number}
    */
    readHalfFloatBE(): number {
        return this.readHalfFloat("big");
    }

    /**
     * Read half float.
     * 
     * @returns {number}
     */
    readHalfFloatLE(): number {
        return this.readHalfFloat("little");
    }

    /**
     * Read 32 bit integer.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt32(unsigned?: boolean, endian?: string): number {
        return rint32(this, unsigned, endian);
    }

    /**
     * Write int32.
     *
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     */
    writeInt32(value: number, unsigned?: boolean, endian?: string): void {
        return wint32(this, value, unsigned, endian);
    }

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     * @param {string} endian - ``big`` or ``little``
     */
    writeUInt32(value: number, endian?: string): void {
        return wint32(this, value, true, endian);
    }

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    writeInt32LE(value: number): void {
        return this.writeInt32(value, false, "little");
    }

    /**
     * Write unsigned int32.
     *
     * @param {number} value - value as int 
     */
    writeUInt32LE(value: number): void {
        return this.writeInt32(value, true, "little");
    }

    /**
     * Write signed int32.
     *
     * @param {number} value - value as int 
     */
    writeInt32BE(value: number): void {
        return this.writeInt32(value, false, "big");
    }

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readInt32BE(): number {
        return this.readInt32(false, "big");
    }

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    readUInt32BE(): number {
        return this.readInt32(true, "big");
    }

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readInt32LE(): number {
        return this.readInt32(false, "little");
    }

    /**
     * Read signed 32 bit integer.
     * 
     * @returns {number}
     */
    readUInt32LE(): number {
        return this.readInt32(true, "little");
    }

    /**
     * Read unsigned 32 bit integer.
     * 
     * @returns {number}
     */
    readUInt(): number {
        return this.readInt32(true);
    }

    /**
     * Read float.
     * 
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readFloat(endian?: string): number {
        return rfloat(this, endian);
    }

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     * @param {string} endian - ``big`` or ``little``
     */
    writeFloat(value: number, endian?: string): void {
        return wfloat(this, value, endian);
    }

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     */
    writeFloatLE(value: number): void{
        return this.writeFloat(value, "little");
    }

    /**
     * Write float.
     * 
     * @param {number} value - value as int 
     */
    writeFloatBE(value: number): void{
        return this.writeFloat(value, "big");
    }

    /**
     * Read float.
     * 
     * @returns {number}
     */
    readFloatBE(): number {
        return this.readFloat("big");
    }

    /**
     * Read float.
     * 
     * @returns {number}
     */
    readFloatLE(): number {
        return this.readFloat("little");
    }

    /**
     * Read signed 64 bit integer.
     * 
     * @param {boolean} unsigned - if value is unsigned or not
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readInt64(unsigned?: boolean, endian?: string): bigint {
        return rint64(this, unsigned, endian);
    }

    /**
     * Write 64 bit integer.
     * 
     * @param {number} value - value as int 
     * @param {boolean} unsigned - if the value is unsigned
     * @param {string} endian - ``big`` or ``little``
     */
    writeInt64(value: number, unsigned?: boolean, endian?: string): void {
        return wint64(this, value, unsigned, endian);
    }

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {number} value - value as int 
     * @param {string} endian - ``big`` or ``little``
     */
    writeUInt64(value: number, endian?: string) {
        return this.writeInt64(value, true, endian);
    }

    /**
     * Write signed 64 bit integer.
     * 
     * @param {number} value - value as int 
     */
    writeInt64LE(value: number): void {
        return this.writeInt64(value, false, "little");
    }

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {number} value - value as int 
     */
    writeUInt64LE(value: number): void {
        return this.writeInt64(value, true, "little");
    }

    /**
     * Write signed 64 bit integer.
     * 
     * @param {number} value - value as int 
     */
    writeInt64BE(value: number): void {
        return this.writeInt64(value, false, "big");
    }

    /**
     * Write unsigned 64 bit integer.
     * 
     * @param {number} value - value as int 
     */
    writeUInt64BE(value: number): void {
        return this.writeInt64(value, true, "big");
    }

    /**
     * Read unsigned 64 bit integer.
     * 
     * @returns {number}
     */
    readUInt64(): bigint {
        return this.readInt64(true);
    }

    /**
     * Read signed 64 bit integer.
     * 
     * @returns {number}
     */
    readInt64BE(): bigint {
        return this.readInt64(false, "big");
    }

    /**
     * Read unsigned 64 bit integer.
     * 
     * @returns {number}
     */
    readUInt64BE(): bigint {
        return this.readInt64(true, "big");
    }

    /**
     * Read signed 64 bit integer.
     * 
     * @returns {number}
     */
    readInt64LE(): bigint {
        return this.readInt64(false, "little");
    }

    /**
     * Read unsigned 64 bit integer.
     * 
     * @returns {number}
     */
    readUInt64LE(): bigint {
        return this.readInt64(true, "little");
    }

    /**
     * Read double float.
     * 
     * @param {string} endian - ``big`` or ``little``
     * @returns {number}
     */
    readDoubleFloat(endian?: string): number {
        return rdfloat(this, endian);
    }

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     * @param {string} endian - ``big`` or ``little``
     */
    writeDoubleFloat(value: number, endian?: string): void {
        return wdfloat(this, value, endian);
    }

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    writeDoubleFloatBE(value: number): void{
        return this.writeDoubleFloat(value, "big");
    }

    /**
     * Writes double float.
     * 
     * @param {number} value - value as int 
     */
    writeDoubleFloatLE(value: number): void{
        return this.writeDoubleFloat(value, "little");
    }

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    readDoubleFloatBE(): number {
        return this.readDoubleFloat("big");
    }

    /**
     * Read double float.
     * 
     * @returns {number}
     */
    readDoubleFloatLE(): number {
        return this.readDoubleFloat("little");
    }

    /**
    * Reads string, use options object for different types.
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
    readString(
        options?: {
            length?: number,
            stringType?: string,
            terminateValue?: number,
            lengthReadSize?: number,
            stripNull?: boolean,
            encoding?: string,
            endian?: string,
        }): string {

        return rstring(this, options);
    }

    /**
    * Writes string, use options object for different types.
    * 
    * 
    * @param {string} string - text string
    * @param {object} options - options: 
    * ```javascript
    * {
    *  length: string.length,  //for fixed length, non-terminate value utf strings
    *  stringType: "utf-8", //utf-8, utf-16, pascal or wide-pascal
    *  terminateValue: 0x00, // only with stringType: "utf"
    *  lengthWriteSize: 1, //for pascal strings. 1, 2 or 4 byte length write size
    *  encoding: "utf-8", //TextEncoder accepted types 
    *  endian: "little", //for wide-pascal and utf-16
    * }
    * ```
    */
    writeString(string: string, options?: {
        length?: number,
        stringType?: string,
        terminateValue?: number,
        lengthWriteSize?: number,
        stripNull?: boolean,
        encoding?: string,
        endian?: string,
    }): void {
        return wstring(this, string, options);
    }

};