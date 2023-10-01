export function checkSize(_this, write_bytes, write_bit, offset) {
    const bits = (write_bit || 0) + _this.bitoffset;
    var new_off = (offset || _this.offset);
    var writesize = write_bytes || 0;
    if (bits != 0) {
        //add bits
        writesize += Math.ceil(bits / 8);
    }
    //if biger extend
    const needed_size = new_off + writesize;
    if (needed_size > _this.size) {
        const dif = needed_size - _this.size;
        if (_this.strict == false) {
            _this.extendArray(dif);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m hexdump:\n" + _this.hexdump() : "";
            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Reached end of data: writing to ` + needed_size + " at " + _this.offset + " of " + _this.size);
        }
    }
    //start read location
    return new_off;
}
export function skip(_this, bytes, bits) {
    const new_size = (((bytes || 0) + _this.offset) + Math.ceil((_this.bitoffset + (bits || 0)) / 8));
    _this.check_size(bytes || 0, bits || 0);
    if (new_size > _this.size) {
        _this.errorDump ? "\x1b[31m[Error]\x1b[0m hexdump:\n" + _this.hexdump() : "";
        throw new Error("\x1b[33m[Strict mode]\x1b[0m: Seek outside of size of data: " + _this.size);
    }
    _this.bitoffset += (bits || 0) % 8;
    _this.offset += (bytes || 0);
}
export function goto(_this, byte, bit) {
    const new_size = (byte + Math.ceil((bit || 0) / 8));
    if (new_size > _this.size && _this.strict == false) {
        _this.extendArray(new_size - _this.size);
    }
    else {
        _this.errorDump ? "\x1b[31m[Error]\x1b[0m hexdump:\n" + _this.hexdump() : "";
        throw new Error("\x1b[33m[Strict mode]\x1b[0m: Outside of range of data: goto " + new_size + " of " + _this.size);
    }
    _this.offset = byte;
    _this.bitoffset = (bit || 0) % 8;
}
export function remove(_this, startOffset, endOffset, consume, remove, fillValue) {
    const new_start = Math.abs(startOffset || 0);
    const new_offset = (endOffset || _this.offset);
    if (new_offset > _this.size) {
        if (_this.strict == false) {
            _this.extendArray(new_offset - _this.size);
        }
        else {
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
        if (_this.isBuffer(_this.data)) {
            _this.data = Buffer.concat([part1, part2]);
        }
        else {
            _this.data = new Uint8Array([...part1, ...part2]);
        }
        _this.size = _this.data.length;
    }
    if (fillValue != undefined && remove == false) {
        const part1 = _this.data.subarray(0, new_start);
        const part2 = _this.data.subarray(new_offset, _this.size);
        const replacement = new Array(data_removed.length).fill(fillValue & 0xff);
        if (_this.isBuffer(_this.data)) {
            const buff_placement = Buffer.from(replacement);
            _this.data = Buffer.concat([part1, buff_placement, part2]);
        }
        else {
            _this.data = new Uint8Array([...part1, ...replacement, ...part2]);
        }
        _this.size = _this.data.length;
    }
    if (consume == true) {
        if (remove != true) {
            _this.offset = new_offset;
        }
        else {
            _this.offset = new_start;
        }
    }
    return data_removed;
}
export function addData(_this, data, consume, offset) {
    if (typeof Buffer !== 'undefined' && data instanceof Buffer && !(_this.data instanceof Buffer)) {
        throw new Error("Data insert must be a Buffer");
    }
    if (data instanceof Uint8Array && !(_this.data instanceof Uint8Array)) {
        throw new Error("Data insert must be a Uint8Array");
    }
    const needed_size = offset || _this.offset;
    if (needed_size > _this.size) {
        const dif = needed_size - _this.size;
        if (_this.strict == false) {
            _this.extendArray(dif);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error(`\x1b[33m[Strict mode]\x1b[0m: Insert outside of current data: writing to ` + needed_size + " at " + _this.offset + " of " + _this.size);
        }
        _this.size = _this.data.length;
    }
    if (_this.isBuffer(_this.data)) {
        const part1 = _this.data.subarray(0, needed_size);
        const part2 = _this.data.subarray(needed_size, _this.size);
        _this.data = Buffer.concat([part1, data, part2]);
        _this.size = _this.data.length;
    }
    else {
        const part1 = _this.data.subarray(0, needed_size);
        const part2 = _this.data.subarray(needed_size, _this.size);
        _this.data = new Uint8Array([...part1, ...data, ...part2]);
        _this.size = _this.data.length;
    }
    if (consume) {
        _this.offset = _this.offset + data.length;
    }
}
export function hexDump(_this, options) {
    var length = options && options.length;
    var startByte = options && options.startByte;
    var supressUnicode = options && options.supressUnicode || false;
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
    function hex_check(byte, bits) {
        var value = 0;
        for (var i = 0; i < bits;) {
            var remaining = bits - i;
            var bitOffset = 0;
            var currentByte = byte;
            var read = Math.min(remaining, 8 - bitOffset);
            var mask, readBits;
            mask = ~(0xFF << read);
            readBits = (currentByte >> (8 - read - bitOffset)) & mask;
            value <<= read;
            value |= readBits;
            i += read;
        }
        value = value >>> 0;
        return value;
    }
    const rows = [];
    var header = "   0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  ";
    var ending = "0123456789ABCDEF";
    var addr = "";
    for (let i = start; i < end; i += 16) {
        addr = i.toString(16).padStart(5, '0');
        var row = _this.data?.slice(i, i + 16) || [];
        var hex = Array.from(row, (byte) => byte.toString(16).padStart(2, '0')).join(' ');
        rows.push(`${addr}  ${hex.padEnd(47)}  `);
    }
    let result = '';
    let make_wide = false;
    let i = start;
    while (i < end) {
        const byte = _this.data[i];
        if (byte < 32 || byte == 127) {
            result += '.';
        }
        else if (byte < 127) {
            // Valid UTF-8 start byte or single-byte character
            // Convert the byte to a character and add it to the result
            result += String.fromCharCode(byte);
        }
        else if (supressUnicode) {
            result += '.';
        }
        else if (hex_check(byte, 1) == 0) {
            //Byte 1
            result += String.fromCharCode(byte);
        }
        else if (hex_check(byte, 3) == 6) {
            //Byte 2
            if (i + 1 <= end) {
                //check second byte
                const byte2 = _this.data[i + 1];
                if (hex_check(byte2, 2) == 2) {
                    const charCode = ((byte & 0x1f) << 6) | (byte2 & 0x3f);
                    i++;
                    make_wide = true;
                    const read = " " + String.fromCharCode(charCode);
                    result += read;
                }
                else {
                    result += ".";
                }
            }
            else {
                result += ".";
            }
        }
        else if (hex_check(byte, 4) == 14) {
            //Byte 3
            if (i + 1 <= end) {
                //check second byte
                const byte2 = _this.data[i + 1];
                if (hex_check(byte2, 2) == 2) {
                    if (i + 2 <= end) {
                        //check third byte
                        const byte3 = _this.data[i + 2];
                        if (hex_check(byte3, 2) == 2) {
                            const charCode = ((byte & 0x0f) << 12) |
                                ((byte2 & 0x3f) << 6) |
                                (byte3 & 0x3f);
                            i += 2;
                            make_wide = true;
                            const read = "  " + String.fromCharCode(charCode);
                            result += read;
                        }
                        else {
                            i++;
                            result += " .";
                        }
                    }
                    else {
                        i++;
                        result += " .";
                    }
                }
                else {
                    result += ".";
                }
            }
            else {
                result += ".";
            }
        }
        else if (hex_check(byte, 5) == 28) {
            //Byte 4
            if (i + 1 <= end) {
                //check second byte
                const byte2 = _this.data[i + 1];
                if (hex_check(byte2, 2) == 2) {
                    if (i + 2 <= end) {
                        //check third byte
                        const byte3 = _this.data[i + 2];
                        if (hex_check(byte3, 2) == 2) {
                            if (i + 3 <= end) {
                                //check fourth byte
                                const byte4 = _this.data[i + 2];
                                if (hex_check(byte4, 2) == 2) {
                                    const charCode = (((byte4 & 0xFF) << 24) | ((byte3 & 0xFF) << 16) | ((byte2 & 0xFF) << 8) | (byte & 0xFF));
                                    i += 3;
                                    make_wide = true;
                                    const read = "   " + String.fromCharCode(charCode);
                                    result += read;
                                }
                                else {
                                    i += 2;
                                    result += "  .";
                                }
                            }
                            else {
                                i += 2;
                                result += "  .";
                            }
                        }
                        else {
                            i++;
                            result += " .";
                        }
                    }
                    else {
                        i++;
                        result += " .";
                    }
                }
                else {
                    result += ".";
                }
            }
            else {
                result += ".";
            }
        }
        else {
            // Invalid UTF-8 byte, add a period to the result
            result += '.';
        }
        i++;
    }
    const chunks = result.match(new RegExp(`.{1,${16}}`, 'g'));
    chunks?.forEach((self, i) => {
        rows[i] = rows[i] + (make_wide ? "|" + self + "|" : self);
    });
    header = "".padStart(addr.length) + header + (make_wide ? "" : ending);
    rows.unshift(header);
    if (make_wide) {
        rows.push("*Removed character byte header on unicode detection");
    }
    console.log(rows.join("\n"));
}
export function and(_this, xor_key, start, end, consume) {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof xor_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] & (xor_key && 0xff);
            if (consume) {
                _this.offset = i;
            }
        }
    }
    else {
        if (_this.isBufferOrUint8Array(xor_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != xor_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                input[i] = input[i] & xor_key[number];
                if (consume) {
                    _this.offset = i;
                }
            }
        }
        else {
            throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
export function or(_this, xor_key, start, end, consume) {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof xor_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] | (xor_key && 0xff);
            if (consume) {
                _this.offset = i;
            }
        }
    }
    else {
        if (_this.isBufferOrUint8Array(xor_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != xor_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                input[i] = input[i] | xor_key[number];
                if (consume) {
                    _this.offset = i;
                }
            }
        }
        else {
            throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
export function xor(_this, xor_key, start, end, consume) {
    const input = _this.data;
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    if (typeof xor_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] ^ (xor_key && 0xff);
            if (consume) {
                _this.offset = i;
            }
        }
    }
    else {
        if (_this.isBufferOrUint8Array(xor_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != xor_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                input[i] = input[i] ^ xor_key[number];
                if (consume) {
                    _this.offset = i;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
export function not(_this, start, end, consume) {
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
        _this.data[i] = ~_this.data[i];
        if (consume) {
            _this.offset = i;
        }
    }
}
export function lshift(_this, value, start, end, consume) {
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
        _this.data[i] = _this.data[i] << value;
        if (consume) {
            _this.offset = i;
        }
    }
}
export function rshift(_this, value, start, end, consume) {
    if ((end || 0) > _this.size) {
        if (_this.strict == false) {
            _this.extendArray((end || 0) - _this.size);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + (end || 0) + " of " + _this.size);
        }
    }
    for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
        _this.data[i] = _this.data[i] >> value;
        if (consume) {
            _this.offset = i;
        }
    }
}
//# sourceMappingURL=common.js.map