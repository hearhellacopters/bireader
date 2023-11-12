"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.biwriter = exports.bireader = void 0;
function isBuffer(obj) {
    return buffcheck(obj);
}
function check_size(_this, write_bytes, write_bit, offset) {
    return checkSize(_this, write_bytes || 0, write_bit || 0, offset || _this.offset);
}
function buffcheck(obj) {
    return (typeof Buffer !== 'undefined' && obj instanceof Buffer);
}
function arraybuffcheck(_this, obj) {
    return obj instanceof Uint8Array || isBuffer(obj);
}
function extendarray(_this, to_padd) {
    if ((typeof Buffer !== 'undefined' && _this.data instanceof Buffer)) {
        var paddbuffer = Buffer.alloc(to_padd);
        _this.data = Buffer.concat([_this.data, paddbuffer]);
    }
    else {
        const addArray = new Array(to_padd);
        _this.data = new Uint8Array([..._this.data, ...addArray]);
    }
}
function checkSize(_this, write_bytes, write_bit, offset) {
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
function skip(_this, bytes, bits) {
    var new_size = (((bytes || 0) + _this.offset) + Math.ceil((_this.bitoffset + (bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0) + _this.offset) * 8) + _this.bitoffset + (bits || 0)) / 8);
    }
    if (new_size > _this.size) {
        if (_this.strict == false) {
            _this.extendArray(new_size - _this.size);
        }
        else {
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
function align(_this, n) {
    var a = _this.offset % n;
    if (a) {
        _this.skip(n - a);
    }
}
function alignRev(_this, n) {
    var a = _this.offset % n;
    if (a) {
        _this.skip(a * -1);
    }
}
function goto(_this, bytes, bits) {
    var new_size = (((bytes || 0)) + Math.ceil(((bits || 0)) / 8));
    if (bits && bits < 0) {
        new_size = Math.floor(((((bytes || 0)) * 8) + (bits || 0)) / 8);
    }
    if (new_size > _this.size) {
        if (_this.strict == false) {
            _this.extendArray(new_size - _this.size);
        }
        else {
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
function remove(_this, startOffset, endOffset, consume, remove, fillValue) {
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
        if (isBuffer(_this.data)) {
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
        if (isBuffer(_this.data)) {
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
            _this.bitoffset = 0;
        }
        else {
            _this.offset = new_start;
            _this.bitoffset = 0;
        }
    }
    return data_removed;
}
function addData(_this, data, consume, offset, repalce) {
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
    var needed_size = offset || _this.offset;
    if (repalce) {
        needed_size = offset || _this.offset + data.length;
    }
    if (needed_size > _this.size) {
        if (_this.strict == false) {
            _this.extendArray(needed_size - _this.size);
        }
        else {
            _this.errorDump ? "\x1b[31m[Error]\x1b[0m: hexdump:\n" + _this.hexdump() : "";
            throw new Error("\x1b[33m[Strict mode]\x1b[0m: End offset outside of data: endOffset" + needed_size + " of " + _this.size);
        }
        _this.size = _this.data.length;
    }
    if (repalce) {
        if (isBuffer(_this.data)) {
            const part1 = _this.data.subarray(0, needed_size - data.length);
            const part2 = _this.data.subarray(needed_size, _this.size);
            _this.data = Buffer.concat([part1, data, part2]);
            _this.size = _this.data.length;
        }
        else {
            const part1 = _this.data.subarray(0, needed_size - data.length);
            const part2 = _this.data.subarray(needed_size, _this.size);
            _this.data = new Uint8Array([...part1, ...data, ...part2]);
            _this.size = _this.data.length;
        }
    }
    else {
        if (isBuffer(_this.data)) {
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
    }
    if (consume) {
        _this.offset = needed_size;
        _this.bitoffset = 0;
    }
}
function hexDump(_this, options) {
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
function AND(_this, and_key, start, end, consume) {
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
    if (typeof and_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] & (and_key & 0xff);
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    }
    else {
        if (arraybuffcheck(_this, and_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != and_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                input[i] = input[i] & and_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("AND key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function OR(_this, or_key, start, end, consume) {
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
    if (typeof or_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] | (or_key & 0xff);
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    }
    else {
        if (arraybuffcheck(_this, or_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != or_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                input[i] = input[i] | or_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("OR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function XOR(_this, xor_key, start, end, consume) {
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
            input[i] = input[i] ^ (xor_key & 0xff);
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    }
    else {
        if (arraybuffcheck(_this, xor_key)) {
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
                    _this.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function NOT(_this, start, end, consume) {
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
            _this.bitoffset = 0;
        }
    }
}
function LSHIFT(_this, shift_key, start, end, consume) {
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
    if (typeof shift_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] << shift_key;
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    }
    else {
        if (arraybuffcheck(_this, shift_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != shift_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                input[i] = input[i] << shift_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function RSHIFT(_this, shift_key, start, end, consume) {
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
    if (typeof shift_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] >> shift_key;
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    }
    else {
        if (arraybuffcheck(_this, shift_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != shift_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                input[i] = input[i] >> shift_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function ADD(_this, add_key, start, end, consume) {
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
    if (typeof add_key == "number") {
        for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
            input[i] = input[i] + add_key;
            if (consume) {
                _this.offset = i;
                _this.bitoffset = 0;
            }
        }
    }
    else {
        if (arraybuffcheck(_this, add_key)) {
            let number = -1;
            for (let i = (start || 0); i < Math.min(end || _this.size, _this.size); i++) {
                if (number != add_key.length - 1) {
                    number = number + 1;
                }
                else {
                    number = 0;
                }
                input[i] = input[i] + add_key[number];
                if (consume) {
                    _this.offset = i;
                    _this.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
function wbit(_this, value, bits, unsigned, endian) {
    if (value == undefined) {
        throw new Error('Must supply value.');
    }
    if (bits == undefined) {
        throw new Error("Enter number of bits to write");
    }
    if (bits <= 0 || bits > 32) {
        throw new Error('Bit length must be between 1 and 32.');
    }
    if (unsigned == true) {
        if (value < 0 || value > Math.pow(2, bits)) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error(`Value is out of range for the specified ${bits}bit length.` + " min: " + 0 + " max: " + Math.pow(2, bits) + " value: " + value);
        }
    }
    else {
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
        var mask, writeBits, destMask;
        if ((endian != undefined ? endian : _this.endian) == "big") {
            mask = ~(~0 << written);
            writeBits = (value >> (bits - i - written)) & mask;
            var destShift = 8 - bitOffset - written;
            destMask = ~(mask << destShift);
            _this.data[byteOffset] = (_this.data[byteOffset] & destMask) | (writeBits << destShift);
        }
        else {
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
function rbit(_this, bits, unsigned, endian) {
    if (bits == undefined || typeof bits != "number") {
        throw new Error("Enter number of bits to read");
    }
    if (bits <= 0 || bits > 32) {
        throw new Error('Bit length must be between 1 and 32.');
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
        var currentByte = _this.data[off_in_bits >> 3];
        var read = Math.min(remaining, 8 - bitOffset);
        var mask, readBits;
        if ((endian != undefined ? endian : _this.endian) == "big") {
            mask = ~(0xFF << read);
            readBits = (currentByte >> (8 - read - bitOffset)) & mask;
            value <<= read;
            value |= readBits;
        }
        else {
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
function wbyte(_this, value, unsigned) {
    check_size(_this, 1, 0);
    if (unsigned == true) {
        if (value < 0 || value > 255) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 8bit length.' + " min: " + 0 + " max: " + 255 + " value: " + value);
        }
    }
    else {
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
function rbyte(_this, unsigned) {
    check_size(_this, 1);
    var read = _this.data[_this.offset];
    _this.offset += 1;
    _this.bitoffset = 0;
    if (unsigned == true) {
        return read & 0xFF;
    }
    else {
        return read > 127 ? read - 256 : read;
    }
}
function wint16(_this, value, unsigned, endian) {
    check_size(_this, 2, 0);
    if (unsigned == true) {
        if (value < 0 || value > 65535) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 16bit length.' + " min: " + 0 + " max: " + 65535 + " value: " + value);
        }
    }
    else {
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
    }
    else {
        _this.data[_this.offset] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xff;
        _this.data[_this.offset + 1] = (unsigned == undefined || unsigned == false) ? value : value & 0xff;
    }
    _this.offset += 2;
    _this.bitoffset = 0;
}
function rint16(_this, unsigned, endian) {
    check_size(_this, 2);
    var read;
    if ((endian != undefined ? endian : _this.endian) == "little") {
        read = (_this.data[_this.offset + 1] << 8) | _this.data[_this.offset];
    }
    else {
        read = (_this.data[_this.offset] << 8) | _this.data[_this.offset + 1];
    }
    _this.offset += 2;
    _this.bitoffset = 0;
    if (unsigned == undefined || unsigned == false) {
        return read & 0x8000 ? -(0x10000 - read) : read;
    }
    else {
        return read & 0xFFFF;
    }
}
function rhalffloat(_this, endian) {
    var uint16Value = _this.readInt16(true, (endian != undefined ? endian : _this.endian));
    const sign = (uint16Value & 0x8000) >> 15;
    const exponent = (uint16Value & 0x7C00) >> 10;
    const fraction = uint16Value & 0x03FF;
    let floatValue;
    if (exponent === 0) {
        if (fraction === 0) {
            floatValue = (sign === 0) ? 0 : -0; // +/-0
        }
        else {
            // Denormalized number
            floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 0x0400);
        }
    }
    else if (exponent === 0x1F) {
        if (fraction === 0) {
            floatValue = (sign === 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        }
        else {
            floatValue = Number.NaN;
        }
    }
    else {
        // Normalized number
        floatValue = (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x0400);
    }
    return floatValue;
}
function whalffloat(_this, value, endian) {
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
    }
    else if (exponentBits === 0x00) {
        // Denormalized numbers, exponent is 0, adjust exponent bits
        exponentBits = 0x00;
        fractionBits = 0x00; // Clear fraction for denormals
    }
    else {
        // Normalized number, subtract exponent bias
        exponentBits -= 15;
    }
    // Combine sign, exponent, and fraction bits into half float format
    let halfFloatBits = (signBit << 15) | (exponentBits << 10) | fractionBits;
    // Write bytes based on endianness
    if ((endian = undefined ? endian : _this.endian) == "little") {
        _this.data[_this.offset] = halfFloatBits & 0xFF;
        _this.data[_this.offset + 1] = (halfFloatBits >> 8) & 0xFF;
    }
    else {
        _this.data[_this.offset] = (halfFloatBits >> 8) & 0xFF;
        _this.data[_this.offset + 1] = halfFloatBits & 0xFF;
    }
    _this.offset += 2;
    _this.bitoffset = 0;
}
function wint32(_this, value, unsigned, endian) {
    check_size(_this, 4, 0);
    if (unsigned == true) {
        if (value < 0 || value > 4294967295) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + 0 + " max: " + 4294967295 + " value: " + value);
        }
    }
    else {
        const maxValue = Math.pow(2, 32 - 1) - 1;
        const minValue = -maxValue - 1;
        if (value < minValue || value > maxValue) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 32bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
        }
    }
    if ((endian = undefined ? endian : _this.endian) == "little") {
        _this.data[_this.offset] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
        _this.data[_this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
        _this.data[_this.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
        _this.data[_this.offset + 3] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
    }
    else {
        _this.data[_this.offset] = (unsigned == undefined || unsigned == false) ? (value >> 24) : (value >> 24) & 0xFF;
        _this.data[_this.offset + 1] = (unsigned == undefined || unsigned == false) ? (value >> 16) : (value >> 16) & 0xFF;
        _this.data[_this.offset + 2] = (unsigned == undefined || unsigned == false) ? (value >> 8) : (value >> 8) & 0xFF;
        _this.data[_this.offset + 3] = (unsigned == undefined || unsigned == false) ? value : value & 0xFF;
    }
    _this.offset += 4;
    _this.bitoffset = 0;
}
function rint32(_this, unsigned, endian) {
    check_size(_this, 4);
    var read;
    if ((endian != undefined ? endian : _this.endian) == "little") {
        read = ((_this.data[_this.offset + 3] << 24) | (_this.data[_this.offset + 2] << 16) | (_this.data[_this.offset + 1] << 8) | _this.data[_this.offset]);
    }
    else {
        read = (_this.data[_this.offset] << 24) | (_this.data[_this.offset + 1] << 16) | (_this.data[_this.offset + 2] << 8) | _this.data[_this.offset + 3];
    }
    _this.offset += 4;
    _this.bitoffset = 0;
    if (unsigned == undefined || unsigned == false) {
        return read;
    }
    else {
        return read >>> 0;
    }
}
function rfloat(_this, endian) {
    var uint32Value = _this.readInt32(true, (endian == undefined ? _this.endian : endian));
    // Check if the value is negative (i.e., the most significant bit is set)
    const isNegative = (uint32Value & 0x80000000) !== 0 ? 1 : 0;
    // Extract the exponent and fraction parts
    const exponent = (uint32Value >> 23) & 0xFF;
    const fraction = uint32Value & 0x7FFFFF;
    // Calculate the float value
    let floatValue;
    if (exponent === 0) {
        // Denormalized number (exponent is 0)
        floatValue = Math.pow(-1, isNegative) * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
    }
    else if (exponent === 0xFF) {
        // Infinity or NaN (exponent is 255)
        floatValue = fraction === 0 ? (isNegative ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : Number.NaN;
    }
    else {
        // Normalized number
        floatValue = Math.pow(-1, isNegative) * Math.pow(2, exponent - 127) * (1 + fraction / Math.pow(2, 23));
    }
    return floatValue;
}
function wfloat(_this, value, endian) {
    check_size(_this, 4, 0);
    const maxValue = 3.402823466e+38;
    const minValue = 1.175494351e-38;
    if (value < minValue || value > maxValue) {
        _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
        throw new Error('Value is out of range for the specified float length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
    }
    let intValue = Float32Array.from([value])[0]; // Convert float to 32-bit integer representation
    let shift = 0;
    for (let i = 0; i < 4; i++) {
        if ((endian = undefined ? endian : _this.endian) == "little") {
            _this.data[_this.offset + i] = (intValue >> shift) & 0xFF;
        }
        else {
            _this.data[_this.offset + (3 - i)] = (intValue >> shift) & 0xFF;
        }
        shift += 8;
    }
    _this.offset += 4;
    _this.bitoffset = 0;
}
function rint64(_this, unsigned, endian) {
    check_size(_this, 8);
    // Convert the byte array to a BigInt
    let value = BigInt(0);
    if ((endian == undefined ? _this.endian : endian) == "little") {
        for (let i = 0; i < 8; i++) {
            value = value | BigInt(_this.data[_this.offset]) << BigInt(8 * i);
            _this.offset += 1;
        }
        if (unsigned == undefined || unsigned == false) {
            if (value & (BigInt(1) << BigInt(63))) {
                value -= BigInt(1) << BigInt(64);
            }
        }
    }
    else {
        for (let i = 0; i < 8; i++) {
            value = (value << BigInt(8)) | BigInt(_this.data[_this.offset]);
            _this.offset += 1;
        }
        if (unsigned == undefined || unsigned == false) {
            if (value & (BigInt(1) << BigInt(63))) {
                value -= BigInt(1) << BigInt(64);
            }
        }
    }
    _this.offset += 8;
    _this.bitoffset = 0;
    return value;
}
function wint64(_this, value, unsigned, endian) {
    check_size(_this, 8, 0);
    if (unsigned == true) {
        if (value < 0 || value > Math.pow(2, 64) - 1) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error('Value is out of range for the specified 64bit length.' + " min: " + 0 + " max: " + (Math.pow(2, 64) - 1) + " value: " + value);
        }
    }
    else {
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
        if ((endian = undefined ? endian : _this.endian) == "little") {
            if (unsigned == undefined || unsigned == false) {
                _this.data[_this.offset + i * 4 + 0] = int32Array[i];
                _this.data[_this.offset + i * 4 + 1] = (int32Array[i] >> 8);
                _this.data[_this.offset + i * 4 + 2] = (int32Array[i] >> 16);
                _this.data[_this.offset + i * 4 + 3] = (int32Array[i] >> 24);
            }
            else {
                _this.data[_this.offset + i * 4 + 0] = int32Array[i] & 0xFF;
                _this.data[_this.offset + i * 4 + 1] = (int32Array[i] >> 8) & 0xFF;
                _this.data[_this.offset + i * 4 + 2] = (int32Array[i] >> 16) & 0xFF;
                _this.data[_this.offset + i * 4 + 3] = (int32Array[i] >> 24) & 0xFF;
            }
        }
        else {
            if (unsigned == undefined || unsigned == false) {
                _this.data[_this.offset + (1 - i) * 4 + 0] = int32Array[i];
                _this.data[_this.offset + (1 - i) * 4 + 1] = (int32Array[i] >> 8);
                _this.data[_this.offset + (1 - i) * 4 + 2] = (int32Array[i] >> 16);
                _this.data[_this.offset + (1 - i) * 4 + 3] = (int32Array[i] >> 24);
            }
            else {
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
function wdfloat(_this, value, endian) {
    check_size(_this, 8, 0);
    const maxValue = 1.7976931348623158e308;
    const minValue = 2.2250738585072014e-308;
    if (value < minValue || value > maxValue) {
        _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
        throw new Error('Value is out of range for the specified 64bit length.' + " min: " + minValue + " max: " + maxValue + " value: " + value);
    }
    const intArray = new Int32Array(2);
    const floatArray = new Float64Array(intArray.buffer);
    floatArray[0] = value;
    const bytes = new Uint8Array(intArray.buffer);
    for (let i = 0; i < 8; i++) {
        if ((endian = undefined ? endian : _this.endian) == "little") {
            _this.data[_this.offset + i] = bytes[i];
        }
        else {
            _this.data[_this.offset + (7 - i)] = bytes[i];
        }
    }
    _this.offset += 8;
    _this.bitoffset = 0;
}
function rdfloat(_this, endian) {
    var uint64Value = _this.readInt64(true, (endian == undefined ? _this.endian : endian));
    const sign = (uint64Value & 0x8000000000000000n) >> 63n;
    const exponent = Number((uint64Value & 0x7ff0000000000000n) >> 52n) - 1023;
    const fraction = Number(uint64Value & 0x000fffffffffffffn) / Math.pow(2, 52);
    var floatValue;
    if (exponent == -1023) {
        if (fraction == 0) {
            floatValue = (sign == 0n) ? 0 : -0; // +/-0
        }
        else {
            // Denormalized number
            floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, -1022) * fraction;
        }
    }
    else if (exponent == 1024) {
        if (fraction == 0) {
            floatValue = (sign == 0n) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        }
        else {
            floatValue = Number.NaN;
        }
    }
    else {
        // Normalized number
        floatValue = (sign == 0n ? 1 : -1) * Math.pow(2, exponent) * (1 + fraction);
    }
    return floatValue;
}
function rstring(_this, options) {
    var length = options && options.length;
    var stringType = options && options.stringType || 'utf-8';
    var terminateValue = options && options.terminateValue;
    var lengthReadSize = options && options.lengthReadSize || 1;
    var stripNull = options && options.stripNull || true;
    var encoding = options && options.encoding || 'utf-8';
    var endian = options && options.endian || _this.endian;
    var terminate = terminateValue;
    if (length != undefined) {
        check_size(_this, length);
    }
    if (typeof terminateValue == "number") {
        terminate = terminateValue & 0xFF;
    }
    else {
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
        const encodedBytes = [];
        if (length == undefined && terminateValue == undefined) {
            terminate = 0;
        }
        var read_length = 0;
        if (length != undefined) {
            read_length = length;
        }
        else {
            read_length = _this.data.length - _this.offset;
        }
        for (let i = 0; i < read_length; i++) {
            if (stringType === 'utf-8') {
                var read = _this.readUByte();
                if (read == terminate) {
                    break;
                }
                else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read);
                    }
                }
            }
            else {
                var read = _this.readInt16(true, endian);
                var read1 = read & 0xFF;
                var read2 = (read >> 8) & 0xFF;
                if (read == terminate) {
                    break;
                }
                else {
                    if (!(stripNull == true && read == 0)) {
                        encodedBytes.push(read1);
                        encodedBytes.push(read2);
                    }
                }
            }
        }
        return new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
    }
    else if (stringType == 'pascal' || stringType == 'wide-pascal') {
        if (encoding == undefined) {
            if (stringType == 'pascal') {
                encoding = 'utf-8';
            }
            if (stringType == 'wide-pascal') {
                encoding = 'utf-16';
            }
        }
        var maxBytes;
        if (lengthReadSize == 1) {
            maxBytes = _this.readUByte();
        }
        else if (lengthReadSize == 2) {
            maxBytes = _this.readInt16(true, endian);
        }
        else if (lengthReadSize == 4) {
            maxBytes = _this.readInt32(true, endian);
        }
        else {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error("Invalid length read size: " + lengthReadSize);
        }
        // Read the string as Pascal or Delphi encoded
        const encodedBytes = [];
        for (let i = 0; i < maxBytes; i++) {
            if (stringType == 'wide-pascal') {
                const read = _this.readInt16(true, endian);
                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read);
                }
            }
            else {
                const read = _this.readUByte();
                if (!(stripNull == true && read == 0)) {
                    encodedBytes.push(read);
                }
            }
        }
        var str_return;
        if (stringType == 'wide-pascal') {
            str_return = new TextDecoder(encoding).decode(new Uint16Array(encodedBytes));
        }
        else {
            str_return = new TextDecoder(encoding).decode(new Uint8Array(encodedBytes));
        }
        return str_return;
    }
    else {
        throw new Error('Unsupported string type: ' + stringType);
    }
}
function wstring(_this, string, options) {
    var length = options && options.length;
    var stringType = options && options.stringType || 'utf-8';
    var terminateValue = options && options.terminateValue;
    var lengthWriteSize = options && options.lengthWriteSize || 1;
    var encoding = options && options.encoding || 'utf-8';
    var endian = options && options.endian || _this.endian;
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
                }
                else {
                    _this.data[_this.offset + i * 2 + 1] = charCode & 0xFF;
                    _this.data[_this.offset + i * 2] = (charCode >> 8) & 0xFF;
                }
            }
            else {
                _this.data[_this.offset + i] = encodedString[i];
            }
        }
        if (terminateValue != undefined) {
            if (stringType === 'utf-16') {
                _this.data[_this.offset + totalLength - 1] = terminateValue & 0xFF;
                _this.data[_this.offset + totalLength] = (terminateValue >> 8) & 0xFF;
            }
            else {
                _this.data[_this.offset + totalLength] = terminateValue;
            }
        }
        _this.offset += totalLength;
        _this.bitoffset = 0;
    }
    else if (stringType == 'pascal' || stringType == 'wide-pascal') {
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
        var maxLength;
        // Encode the string in the specified encoding
        if (lengthWriteSize == 1) {
            maxLength = 255;
        }
        else if (lengthWriteSize == 2) {
            maxLength = 65535;
        }
        else if (lengthWriteSize == 4) {
            maxLength = 4294967295;
        }
        else {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error("Invalid length write size: " + lengthWriteSize);
        }
        if (string.length > maxLength || (length || 0) > maxLength) {
            _this.errorDump ? "[Error], hexdump:\n" + _this.hexdump() : "";
            throw new Error("String outsize of max write length: " + maxLength);
        }
        var maxBytes = Math.min(string.length, maxLength);
        const encodedString = encoder.encode(string.substring(0, maxBytes));
        var totalLength = (length || encodedString.length) + lengthWriteSize;
        if (stringType == 'wide-pascal') {
            totalLength = (length || (encodedString.length * 2)) + lengthWriteSize;
        }
        check_size(_this, totalLength, 0);
        if (lengthWriteSize == 1) {
            _this.writeUByte(maxBytes);
        }
        else if (lengthWriteSize == 2) {
            _this.writeUInt16(maxBytes, endian);
        }
        else if (lengthWriteSize == 4) {
            _this.writeUInt32(maxBytes, endian);
        }
        // Write the string bytes to the Uint8Array
        for (let i = 0; i < encodedString.length; i++) {
            if (stringType == 'wide-pascal') {
                const charCode = encodedString[i];
                if (endian == "little") {
                    _this.data[_this.offset + i * 2] = charCode & 0xFF;
                    _this.data[_this.offset + i * 2 + 1] = (charCode >> 8) & 0xFF;
                }
                else {
                    _this.data[_this.offset + i * 2 + 1] = charCode & 0xFF;
                    _this.data[_this.offset + i * 2] = (charCode >> 8) & 0xFF;
                }
            }
            else {
                _this.data[_this.offset + i] = encodedString[i];
            }
        }
        _this.offset += totalLength;
        _this.bitoffset = 0;
    }
    else {
        throw new Error('Unsupported string type: ' + stringType);
    }
}
/**
* Binary reader, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
* @param {number} byteOffset - Byte offset to start reader (default 0)
* @param {number} bitOffset - Bit offset 0-7 to start reader (default 0)
* @param {string} endianness - Endianness ``big`` or ``little`` (default ``little``)
* @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default true)
*/
class bireader {
    isBufferOrUint8Array(obj) {
        return arraybuffcheck(this, obj);
    }
    extendArray(to_padd) {
        return extendarray(this, to_padd);
    }
    /**
    * Binary reader, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
    * @param {number} byteOffset - Byte offset to start reader (default 0)
    * @param {number} bitOffset - Bit offset 0-7 to start reader (default 0)
    * @param {string} endianness - Endianness ``big`` or ``little`` (default ``little``)
    * @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default true)
    */
    constructor(data, byteOffset, bitOffset, endianness, strict) {
        this.endian = "little";
        this.offset = 0;
        this.bitoffset = 0;
        this.size = 0;
        this.strict = false;
        this.errorDump = true;
        this.data = [];
        if (endianness != undefined && typeof endianness != "string") {
            throw new Error("Endian must be big or little");
        }
        if (endianness != undefined && !(endianness == "big" || endianness == "little")) {
            throw new Error("Byte order must be big or little");
        }
        this.endian = endianness || "little";
        if (byteOffset != undefined) {
            if (typeof byteOffset == "number") {
                this.offset = Math.round(byteOffset) || 0;
            }
            else {
                throw new Error("Byte offset must be number");
            }
        }
        if (bitOffset != undefined) {
            this.bitoffset = bitOffset % 8;
        }
        if (typeof strict == "boolean") {
            this.strict = strict;
        }
        else {
            if (strict != undefined) {
                throw new Error("Strict mode must be true of false");
            }
        }
        if (data == undefined) {
            throw new Error("Data required");
        }
        else {
            if (!this.isBufferOrUint8Array(data)) {
                throw new Error("Write data must be Uint8Array or Buffer");
            }
        }
        this.size = data.length + ((bitOffset || 0) % 8);
        this.data = data;
    }
    /**
    *
    * Change endian, defaults to little
    *
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - endianness ``big`` or ``little``
    */
    endianness(endian) {
        if (endian == undefined || typeof endian != "string") {
            throw new Error("Endian must be big or little");
        }
        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new Error("Endian must be big or little");
        }
        this.endian = endian;
    }
    /**
    *Sets endian to big
    */
    bigEndian() {
        this.endianness("big");
    }
    /**
    *Sets endian to big
    */
    big() {
        this.endianness("big");
    }
    /**
    *Sets endian to big
    */
    be() {
        this.endianness("big");
    }
    /**
    * Sets endian to little
    */
    littleEndian() {
        this.endianness("little");
    }
    /**
    * Sets endian to little
    */
    little() {
        this.endianness("little");
    }
    /**
    * Sets endian to little
    */
    le() {
        this.endianness("little");
    }
    //
    // move from current position
    //
    /**
    * Aligns current byte position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} number - Byte to align
    */
    align(number) {
        return align(this, number);
    }
    /**
    * Reverse aligns current byte position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} number - Byte to align
    */
    alignRev(number) {
        return alignRev(this, number);
    }
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    skip(bytes, bits) {
        return skip(this, bytes, bits);
    }
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    jump(bytes, bits) {
        this.skip(bytes, bits);
    }
    //
    // directly set current position
    //
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    goto(byte, bit) {
        return goto(this, byte, bit);
    }
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    seek(bytes, bits) {
        return this.skip(bytes, bits);
    }
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    pointer(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    warp(byte, bit) {
        return this.goto(byte, bit);
    }
    //
    //go to start
    //
    /**
    * Set byte and bit position to start of data
    */
    rewind() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    /**
    * Set byte and bit position to start of data
    */
    gotostart() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    //
    //get position
    //
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    tell() {
        return this.offset;
    }
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    getOffset() {
        return this.offset;
    }
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    saveOffset() {
        return this.offset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    tellB() {
        return this.bitoffset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    getOffsetBit() {
        return this.bitoffset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    saveOffsetAbsBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    tellAbsB() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    getOffsetAbsBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    saveOffsetBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    //
    //strict mode change
    //
    /**
    * Disallows extending data if position is outside of max size
    */
    restrict() {
        this.strict = true;
    }
    /**
    * Allows extending data if position is outside of max size
    */
    unrestrict() {
        this.strict = false;
    }
    //
    //math
    //
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xor(xorKey, startOffset, endOffset, consume) {
        var XORKey = xorKey;
        if (typeof xorKey == "number") {
            //pass
        }
        else if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        }
        else if (this.isBufferOrUint8Array(XORKey)) {
            //pass
        }
        else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return XOR(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xorThis(xorKey, length, consume) {
        var Length = length || 1;
        var XORKey = xorKey;
        if (typeof xorKey == "number") {
            Length = length || 1;
        }
        else if (typeof xorKey == "string") {
            const encoder = new TextEncoder().encode(xorKey);
            XORKey = encoder;
            Length = length || encoder.length;
        }
        else if (this.isBufferOrUint8Array(XORKey)) {
            Length = length || xorKey.length;
        }
        else {
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
    or(orKey, startOffset, endOffset, consume) {
        var ORKey = orKey;
        if (typeof orKey == "number") {
            //pass
        }
        else if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        }
        else if (this.isBufferOrUint8Array(ORKey)) {
            //pass
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return OR(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * OR data
    *
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    orThis(orKey, length, consume) {
        var Length = length || 1;
        var ORKey = orKey;
        if (typeof orKey == "number") {
            Length = length || 1;
        }
        else if (typeof orKey == "string") {
            const encoder = new TextEncoder().encode(orKey);
            ORKey = encoder;
            Length = length || encoder.length;
        }
        else if (this.isBufferOrUint8Array(ORKey)) {
            Length = length || orKey.length;
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return OR(this, ORKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    and(andKey, startOffset, endOffset, consume) {
        var ANDKey = andKey;
        if (typeof ANDKey == "number") {
            //pass
        }
        else if (typeof ANDKey == "string") {
            ANDKey = new TextEncoder().encode(ANDKey);
        }
        else if (typeof ANDKey == "object") {
            //pass
        }
        else {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return AND(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    andThis(andKey, length, consume) {
        var Length = length || 1;
        var ANDKey = andKey;
        if (typeof andKey == "number") {
            Length = length || 1;
        }
        else if (typeof andKey == "string") {
            const encoder = new TextEncoder().encode(andKey);
            ANDKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof andKey == "object") {
            Length = length || andKey.length;
        }
        else {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return AND(this, ANDKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Not data
    *
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    not(startOffset, endOffset, consume) {
        return NOT(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Not data
    *
    * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    notThis(length, consume) {
        return NOT(this, this.offset, this.offset + (length || 1), consume || false);
    }
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShift(shiftKey, startOffset, endOffset, consume) {
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            //pass
        }
        else if (typeof lShiftKey == "string") {
            lShiftKey = new TextEncoder().encode(lShiftKey);
        }
        else if (typeof lShiftKey == "object") {
            //pass
        }
        else {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return LSHIFT(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShiftThis(shiftKey, length, consume) {
        var Length = length || 1;
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        }
        else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        }
        else {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return LSHIFT(this, shiftKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShift(shiftKey, startOffset, endOffset, consume) {
        var rShiftKey = shiftKey;
        if (typeof rShiftKey == "number") {
            //pass
        }
        else if (typeof rShiftKey == "string") {
            rShiftKey = new TextEncoder().encode(rShiftKey);
        }
        else if (typeof rShiftKey == "object") {
            //pass
        }
        else {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return RSHIFT(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShiftThis(shiftKey, length, consume) {
        var Length = length || 1;
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        }
        else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        }
        else {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return RSHIFT(this, lShiftKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    add(addKey, startOffset, endOffset, consume) {
        var addedKey = addKey;
        if (typeof addedKey == "number") {
            //pass
        }
        else if (typeof addedKey == "string") {
            addedKey = new TextEncoder().encode(addedKey);
        }
        else if (typeof addedKey == "object") {
            //pass
        }
        else {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return ADD(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    addThis(addKey, length, consume) {
        var Length = length || 1;
        var AddedKey = addKey;
        if (typeof AddedKey == "number") {
            Length = length || 1;
        }
        else if (typeof AddedKey == "string") {
            const encoder = new TextEncoder().encode(AddedKey);
            AddedKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof AddedKey == "object") {
            Length = length || AddedKey.length;
        }
        else {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return ADD(this, AddedKey, this.offset, this.offset + Length, consume || false);
    }
    //
    //remove part of data
    //
    /**
    * Deletes part of data from start to current byte position unless supplied, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} startOffset - Start location (default 0)
    * @param {number} endOffset - End location (default current position)
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    delete(startOffset, endOffset, consume) {
        return remove(this, startOffset || 0, endOffset || this.offset, consume || false, true);
    }
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    clip() {
        return remove(this, this.offset, this.size, false, true);
    }
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    trim() {
        return remove(this, this.offset, this.size, false, true);
    }
    /**
    * Deletes part of data from current byte position to supplied length, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    crop(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    /**
    * Deletes part of data from current position to supplied length, returns removed
    * Note: Only works in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    drop(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    //
    //copy out
    //
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    lift(startOffset, endOffset, consume, fillValue) {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    fill(startOffset, endOffset, consume, fillValue) {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    extract(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    slice(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    wrap(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    //
    //insert
    //
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    insert(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset);
    }
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    place(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset);
    }
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    replace(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, true);
    }
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    overwrite(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, true);
    }
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    unshift(data, consume) {
        return addData(this, data, consume || false, 0);
    }
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    prepend(data, consume) {
        return addData(this, data, consume || false, 0);
    }
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    push(data, consume) {
        return addData(this, data, consume || false, this.size);
    }
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    append(data, consume) {
        return addData(this, data, consume || false, this.size);
    }
    //
    //finishing
    //
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get() {
        return this.data;
    }
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return() {
        return this.data;
    }
    /**
    * removes data
    */
    end() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    close() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    done() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    finished() {
        this.data = undefined;
    }
    /**
    * Console logs data as hex dump
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
    hexdump(options) {
        return hexDump(this, options);
    }
    /**
    * Turn hexdump on error off (default on)
    */
    errorDumpOff() {
        this.errorDump = false;
    }
    /**
    * Turn hexdump on error on (default on)
    */
    errorDumpOn() {
        this.errorDump = true;
    }
    //
    //bit reader
    //
    /**
    *
    * Write bits, must have at least value and number of bits
    *
    * ``Note``: When returning to a byte write, remaining bits are skipped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {boolean} unsigned - if value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeBit(value, bits, unsigned, endian) {
        return wbit(this, value, bits, unsigned, endian);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readBit(bits, unsigned, endian) {
        return rbit(this, bits, unsigned, endian);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit(bits, unsigned, endian) {
        return this.readBit(bits, unsigned, endian);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit(bits, endian) {
        return this.readBit(bits, true, endian);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit1(unsigned, endian) {
        return this.bit(1, unsigned, endian);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1le(unsigned) {
        return this.bit(1, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1be(unsigned) {
        return this.bit(1, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1() {
        return this.bit(1, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1le() {
        return this.bit(1, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit1be() {
        return this.bit(1, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2(unsigned) {
        return this.bit(2, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2le(unsigned) {
        return this.bit(2, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2be(unsigned) {
        return this.bit(2, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2() {
        return this.bit(2, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2le() {
        return this.bit(2, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit2be() {
        return this.bit(2, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3(unsigned) {
        return this.bit(3, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3le(unsigned) {
        return this.bit(3, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3be(unsigned) {
        return this.bit(3, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3() {
        return this.bit(3, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3le() {
        return this.bit(3, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit3be() {
        return this.bit(3, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4(unsigned) {
        return this.bit(4, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4le(unsigned) {
        return this.bit(4, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4be(unsigned) {
        return this.bit(4, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4() {
        return this.bit(4, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4le() {
        return this.bit(4, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit4be() {
        return this.bit(4, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5(unsigned) {
        return this.bit(5, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5le(unsigned) {
        return this.bit(5, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5be(unsigned) {
        return this.bit(5, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5() {
        return this.bit(5, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5le() {
        return this.bit(5, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit5be() {
        return this.bit(5, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6(unsigned) {
        return this.bit(6, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6le(unsigned) {
        return this.bit(6, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6be(unsigned) {
        return this.bit(6, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6() {
        return this.bit(6, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6le() {
        return this.bit(6, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit6be() {
        return this.bit(6, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7(unsigned) {
        return this.bit(7, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7le(unsigned) {
        return this.bit(7, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7be(unsigned) {
        return this.bit(7, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7() {
        return this.bit(7, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7le() {
        return this.bit(7, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit7be() {
        return this.bit(7, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8(unsigned) {
        return this.bit(8, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8le(unsigned) {
        return this.bit(8, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8be(unsigned) {
        return this.bit(8, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8() {
        return this.bit(8, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8le() {
        return this.bit(8, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit8be() {
        return this.bit(8, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9(unsigned) {
        return this.bit(9, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9le(unsigned) {
        return this.bit(9, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9be(unsigned) {
        return this.bit(9, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9() {
        return this.bit(9, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9le() {
        return this.bit(9, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit9be() {
        return this.bit(9, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10(unsigned) {
        return this.bit(10, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10le(unsigned) {
        return this.bit(10, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10be(unsigned) {
        return this.bit(10, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10() {
        return this.bit(10, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10le() {
        return this.bit(10, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit10be() {
        return this.bit(10, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11(unsigned) {
        return this.bit(11, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11le(unsigned) {
        return this.bit(11, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11be(unsigned) {
        return this.bit(11, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11() {
        return this.bit(11, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11le() {
        return this.bit(11, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit11be() {
        return this.bit(11, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12(unsigned) {
        return this.bit(12, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12le(unsigned) {
        return this.bit(12, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12be(unsigned) {
        return this.bit(12, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12() {
        return this.bit(12, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12le() {
        return this.bit(12, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit12be() {
        return this.bit(12, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13(unsigned) {
        return this.bit(13, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13le(unsigned) {
        return this.bit(13, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13be(unsigned) {
        return this.bit(13, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13() {
        return this.bit(13, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13le() {
        return this.bit(13, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit13be() {
        return this.bit(13, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14(unsigned) {
        return this.bit(14, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14le(unsigned) {
        return this.bit(14, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14be(unsigned) {
        return this.bit(14, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14() {
        return this.bit(14, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14le() {
        return this.bit(14, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit14be() {
        return this.bit(14, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15(unsigned) {
        return this.bit(15, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15le(unsigned) {
        return this.bit(15, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15be(unsigned) {
        return this.bit(15, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15() {
        return this.bit(15, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15le() {
        return this.bit(15, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit15be() {
        return this.bit(15, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16(unsigned) {
        return this.bit(16, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16le(unsigned) {
        return this.bit(16, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16be(unsigned) {
        return this.bit(16, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16() {
        return this.bit(16, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16le() {
        return this.bit(16, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit16be() {
        return this.bit(16, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17(unsigned) {
        return this.bit(17, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17le(unsigned) {
        return this.bit(17, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17be(unsigned) {
        return this.bit(17, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17() {
        return this.bit(17, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17le() {
        return this.bit(17, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit17be() {
        return this.bit(17, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18(unsigned) {
        return this.bit(18, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18le(unsigned) {
        return this.bit(18, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18be(unsigned) {
        return this.bit(18, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18() {
        return this.bit(18, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18le() {
        return this.bit(18, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit18be() {
        return this.bit(18, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19(unsigned) {
        return this.bit(19, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19le(unsigned) {
        return this.bit(19, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19be(unsigned) {
        return this.bit(19, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19() {
        return this.bit(19, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19le() {
        return this.bit(19, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit19be() {
        return this.bit(19, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20(unsigned) {
        return this.bit(20, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20le(unsigned) {
        return this.bit(20, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20be(unsigned) {
        return this.bit(20, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20() {
        return this.bit(20, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20le() {
        return this.bit(20, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit20be() {
        return this.bit(20, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21(unsigned) {
        return this.bit(21, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21le(unsigned) {
        return this.bit(21, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21be(unsigned) {
        return this.bit(21, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21() {
        return this.bit(21, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21le() {
        return this.bit(21, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit21be() {
        return this.bit(21, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22(unsigned) {
        return this.bit(22, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22le(unsigned) {
        return this.bit(22, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22be(unsigned) {
        return this.bit(22, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22() {
        return this.bit(22, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22le() {
        return this.bit(22, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit22be() {
        return this.bit(22, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23(unsigned) {
        return this.bit(23, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23le(unsigned) {
        return this.bit(23, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23be(unsigned) {
        return this.bit(23, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23() {
        return this.bit(23, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23le() {
        return this.bit(23, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit23be() {
        return this.bit(23, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24(unsigned) {
        return this.bit(24, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24le(unsigned) {
        return this.bit(24, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24be(unsigned) {
        return this.bit(24, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24() {
        return this.bit(24, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24le() {
        return this.bit(24, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit24be() {
        return this.bit(24, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25(unsigned) {
        return this.bit(25, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25le(unsigned) {
        return this.bit(25, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25be(unsigned) {
        return this.bit(25, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25() {
        return this.bit(25, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25le() {
        return this.bit(25, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit25be() {
        return this.bit(25, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26(unsigned) {
        return this.bit(26, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26le(unsigned) {
        return this.bit(26, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26be(unsigned) {
        return this.bit(26, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26() {
        return this.bit(26, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26le() {
        return this.bit(26, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit26be() {
        return this.bit(26, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27(unsigned) {
        return this.bit(27, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27le(unsigned) {
        return this.bit(27, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27be(unsigned) {
        return this.bit(27, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27() {
        return this.bit(27, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27le() {
        return this.bit(27, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit27be() {
        return this.bit(27, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28(unsigned) {
        return this.bit(28, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28le(unsigned) {
        return this.bit(28, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28be(unsigned) {
        return this.bit(28, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28() {
        return this.bit(28, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28le() {
        return this.bit(28, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit28be() {
        return this.bit(28, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29(unsigned) {
        return this.bit(29, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29le(unsigned) {
        return this.bit(29, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29be(unsigned) {
        return this.bit(29, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29() {
        return this.bit(29, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29le() {
        return this.bit(29, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit29be() {
        return this.bit(29, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30(unsigned) {
        return this.bit(30, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30le(unsigned) {
        return this.bit(30, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30be(unsigned) {
        return this.bit(30, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30() {
        return this.bit(30, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30le() {
        return this.bit(30, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit30be() {
        return this.bit(30, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31(unsigned) {
        return this.bit(31, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31le(unsigned) {
        return this.bit(31, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31be(unsigned) {
        return this.bit(31, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31() {
        return this.bit(31, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31le() {
        return this.bit(31, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit31be() {
        return this.bit(31, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32(unsigned) {
        return this.bit(32, unsigned);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32le(unsigned) {
        return this.bit(32, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32be(unsigned) {
        return this.bit(32, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32() {
        return this.bit(32, true);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32le() {
        return this.bit(32, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @returns number
    */
    ubit32be() {
        return this.bit(32, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitBE(bits) {
        return this.bit(bits, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitbe(bits) {
        return this.bit(bits, true, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    readBitBE(bits, unsigned) {
        return this.bit(bits, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitbe(bits, unsigned) {
        return this.bit(bits, unsigned, "big");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    readUBitLE(bits) {
        return this.bit(bits, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @returns number
    */
    ubitle(bits) {
        return this.bit(bits, true, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    readBitLE(bits, unsigned) {
        return this.bit(bits, unsigned, "little");
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitle(bits, unsigned) {
        return this.bit(bits, unsigned, "little");
    }
    //
    //byte read
    //
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    readByte(unsigned) {
        return rbyte(this, unsigned);
    }
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    writeByte(value, unsigned) {
        return wbyte(this, value, unsigned);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    writeUByte(value) {
        return wbyte(this, value, true);
    }
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    byte(unsigned) {
        return this.readByte(unsigned);
    }
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    int8(unsigned) {
        return this.readByte(unsigned);
    }
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    readUByte() {
        return this.readByte(true);
    }
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    uint8() {
        return this.readByte(true);
    }
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    ubyte() {
        return this.readByte(true);
    }
    //
    //short16 read
    //
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt16(unsigned, endian) {
        return rint16(this, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt16(value, unsigned, endian) {
        return wint16(this, value, unsigned, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt16(value, endian) {
        return wint16(this, value, true, endian);
    }
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    int16(unsigned, endian) {
        return this.readInt16(unsigned, endian);
    }
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    short(unsigned, endian) {
        return this.readInt16(unsigned, endian);
    }
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    word(unsigned, endian) {
        return this.readInt16(unsigned, endian);
    }
    /**
    * Read unsigned short
    *
    * @param {string} endian - ``big`` or ``little``
    *
    * @returns number
    */
    readUInt16(endian) {
        return this.readInt16(true, endian);
    }
    /**
    * Read unsigned short
    *
    * @param {string} endian - ``big`` or ``little``
    *
    * @returns number
    */
    uint16(endian) {
        return this.readInt16(true, endian);
    }
    /**
    * Read unsigned short
    *
    * @param {string} endian - ``big`` or ``little``
    *
    * @returns number
    */
    ushort(endian) {
        return this.readInt16(true, endian);
    }
    /**
    * Read unsigned short
    *
    * @param {string} endian - ``big`` or ``little``
    *
    * @returns number
    */
    uword(endian) {
        return this.readInt16(true, endian);
    }
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    readUInt16LE() {
        return this.readInt16(true, "little");
    }
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    uint16le() {
        return this.readInt16(true, "little");
    }
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    ushortle() {
        return this.readInt16(true, "little");
    }
    /**
    * Read unsigned short in little endian
    *
    * @returns number
    */
    uwordle() {
        return this.readInt16(true, "little");
    }
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    readInt16LE() {
        return this.readInt16(false, "little");
    }
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    int16le() {
        return this.readInt16(false, "little");
    }
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    shortle() {
        return this.readInt16(false, "little");
    }
    /**
    * Read signed short in little endian
    *
    * @returns number
    */
    wordle() {
        return this.readInt16(false, "little");
    }
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    readUInt16BE() {
        return this.readInt16(true, "big");
    }
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    uint16be() {
        return this.readInt16(true, "big");
    }
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    ushortbe() {
        return this.readInt16(true, "big");
    }
    /**
    * Read unsigned short in big endian
    *
    * @returns number
    */
    uwordbe() {
        return this.readInt16(true, "big");
    }
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    readInt16BE() {
        return this.readInt16(false, "big");
    }
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    int16be() {
        return this.readInt16(false, "big");
    }
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    shortbe() {
        return this.readInt16(false, "big");
    }
    /**
    * Read signed short in big endian
    *
    * @returns number
    */
    wordbe() {
        return this.readInt16(false, "big");
    }
    //
    //half float read
    //
    /**
    * Read half float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readHalfFloat(endian) {
        return rhalffloat(this, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeHalfFloat(value, endian) {
        return whalffloat(this, value, endian);
    }
    /**
    * Read half float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    halffloat(endian) {
        return this.readHalfFloat(endian);
    }
    /**
    * Read half float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    half(endian) {
        return this.readHalfFloat(endian);
    }
    /**
    * Read half float
    *
    * @returns number
    */
    readHalfFloatBE() {
        return this.readHalfFloat("big");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    halffloatbe() {
        return this.readHalfFloat("big");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    halfbe() {
        return this.readHalfFloat("big");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    readHalfFloatLE() {
        return this.readHalfFloat("little");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    halffloatle() {
        return this.readHalfFloat("little");
    }
    /**
    * Read half float
    *
    * @returns number
    */
    halfle() {
        return this.readHalfFloat("little");
    }
    //
    //int read
    //
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt32(unsigned, endian) {
        return rint32(this, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt32(value, unsigned, endian) {
        return wint32(this, value, unsigned, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt32(value, endian) {
        return wint32(this, value, true, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    int(unsigned, endian) {
        return this.readInt32(unsigned, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    double(unsigned, endian) {
        return this.readInt32(unsigned, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    int32(unsigned, endian) {
        return this.readInt32(unsigned, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    long(unsigned, endian) {
        return this.readInt32(unsigned, endian);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    readUInt() {
        return this.readInt32(true);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint() {
        return this.readInt32(true);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    udouble() {
        return this.readInt32(true);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint32() {
        return this.readInt32(true);
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    ulong() {
        return this.readInt32(true);
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readInt32BE() {
        return this.readInt32(false, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    intbe() {
        return this.readInt32(false, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    doublebe() {
        return this.readInt32(false, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    int32be() {
        return this.readInt32(false, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    longbe() {
        return this.readInt32(false, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    readUInt32BE() {
        return this.readInt32(true, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uintbe() {
        return this.readInt32(true, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    udoublebe() {
        return this.readInt32(true, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    uint32be() {
        return this.readInt32(true, "big");
    }
    /**
    * Read unsigned 32 bit integer
    *
    * @returns number
    */
    ulongbe() {
        return this.readInt32(true, "big");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readInt32LE() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    intle() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    doublele() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    int32le() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    longle() {
        return this.readInt32(false, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    readUInt32LE() {
        return this.readInt32(true, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    uintle() {
        return this.readInt32(true, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    udoublele() {
        return this.readInt32(true, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    uint32le() {
        return this.readInt32(true, "little");
    }
    /**
    * Read signed 32 bit integer
    *
    * @returns number
    */
    ulongle() {
        return this.readInt32(true, "little");
    }
    //
    //float read
    //
    /**
    * Read float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readFloat(endian) {
        return rfloat(this, endian);
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeFloat(value, endian) {
        return wfloat(this, value, endian);
    }
    /**
    * Read float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    float(endian) {
        return this.readFloat(endian);
    }
    /**
    * Read float
    *
    * @returns number
    */
    readFloatBE() {
        return this.readFloat("big");
    }
    /**
    * Read float
    *
    * @returns number
    */
    floatbe() {
        return this.readFloat("big");
    }
    /**
    * Read float
    *
    * @returns number
    */
    readFloatLE() {
        return this.readFloat("little");
    }
    /**
    * Read float
    *
    * @returns number
    */
    floatle() {
        return this.readFloat("little");
    }
    //
    //int64 reader
    //
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt64(unsigned, endian) {
        return rint64(this, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt64(value, unsigned, endian) {
        return wint64(this, value, unsigned, endian);
    }
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    int64(unsigned, endian) {
        return this.readInt64(unsigned, endian);
    }
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bigint(unsigned, endian) {
        return this.readInt64(unsigned, endian);
    }
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    quad(unsigned, endian) {
        return this.readInt64(unsigned, endian);
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64() {
        return this.readInt64(true);
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64() {
        return this.readInt64(true);
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigint() {
        return this.readInt64(true);
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquad() {
        return this.readInt64(true);
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    readInt64BE() {
        return this.readInt64(false, "big");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    int64be() {
        return this.readInt64(false, "big");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    bigintbe() {
        return this.readInt64(false, "big");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    quadbe() {
        return this.readInt64(false, "big");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64BE() {
        return this.readInt64(true, "big");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64be() {
        return this.readInt64(true, "big");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigintbe() {
        return this.readInt64(true, "big");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquadbe() {
        return this.readInt64(true, "big");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    readInt64LE() {
        return this.readInt64(false, "little");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    int64le() {
        return this.readInt64(false, "little");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    bigintle() {
        return this.readInt64(false, "little");
    }
    /**
    * Read signed 64 bit integer
    *
    * @returns number
    */
    quadle() {
        return this.readInt64(false, "little");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    readUInt64LE() {
        return this.readInt64(true, "little");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uint64le() {
        return this.readInt64(true, "little");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    ubigintle() {
        return this.readInt64(true, "little");
    }
    /**
    * Read unsigned 64 bit integer
    *
    * @returns number
    */
    uquadle() {
        return this.readInt64(true, "little");
    }
    //
    //doublefloat reader
    //
    /**
    * Read double float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readDoubleFloat(endian) {
        return rdfloat(this, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {number} offset - byte offset (default last write position)
    * @param {string} endian - ``big`` or ``little``
    */
    writeDoubleFloat(value, endian) {
        return wdfloat(this, value, endian);
    }
    /**
    * Read double float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    doublefloat(endian) {
        return this.readDoubleFloat(endian);
    }
    /**
    * Read double float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    dfloat(endian) {
        return this.readDoubleFloat(endian);
    }
    /**
    * Read double float
    *
    * @returns number
    */
    readDoubleFloatBE() {
        return this.readDoubleFloat("big");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    dfloatebe() {
        return this.readDoubleFloat("big");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    doublefloatbe() {
        return this.readDoubleFloat("big");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    readDoubleFloatLE() {
        return this.readDoubleFloat("little");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    dfloatle() {
        return this.readDoubleFloat("little");
    }
    /**
    * Read double float
    *
    * @returns number
    */
    doublefloatle() {
        return this.readDoubleFloat("little");
    }
    //
    //string reader
    //
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
    readString(options) {
        return rstring(this, options);
    }
    /**
    * Writes string, use options object for different types
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
    writeString(string, options) {
        return wstring(this, string, options);
    }
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
    string(options) {
        return this.readString(options);
    }
    /**
    * Reads UTF-8 (C) string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf8string(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    /**
    * Reads UTF-8 (C) string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    cstring(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
    /**
    * Reads ANSI string
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    ansistring(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue, stripNull: stripNull });
    }
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
    utf16string(length, terminateValue, stripNull, endian) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    }
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
    unistring(length, terminateValue, stripNull, endian) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string in little endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf16stringle(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string in little endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    unistringle(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little", stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string in big endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    utf16stringbe(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads UTF-16 (Unicode) string in big endian order
    *
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    unistringbe(length, terminateValue, stripNull) {
        return this.string({ stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads Pascal string
    *
    * @param {number} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring(lengthReadSize, stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: lengthReadSize, stripNull: stripNull, endian: endian });
    }
    /**
    * Reads Pascal string 1 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring1(stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: endian });
    }
    /**
    * Reads Pascal string 1 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 1 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring1be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 1, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Pascal string 2 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring2(stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: endian });
    }
    /**
    * Reads Pascal string 2 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 2 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring2be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 2, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Pascal string 4 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    pstring4(stripNull, endian) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: endian });
    }
    /**
    * Reads Pascal string 4 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4le(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "little" });
    }
    /**
    * Reads Pascal string 4 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    pstring4be(stripNull) {
        return this.string({ stringType: "pascal", encoding: "utf-8", lengthReadSize: 4, stripNull: stripNull, endian: "big" });
    }
    /**
    * Reads Wide-Pascal string
    *
    * @param {number} lengthReadSize - 1, 2 or 4 byte length write size (default 1)
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring(lengthReadSize, stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: lengthReadSize, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 1 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring1(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 1, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 2 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring2(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "little", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring2be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 2, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 4 byte length read
    *
    * @param {boolean} stripNull - removes 0x00 characters
    * @param {string} endian - ``big`` or ``little``
    *
    * @return string
    */
    wpstring4(stripNull, endian) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: endian, stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4be(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "big", stripNull: stripNull });
    }
    /**
    * Reads Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {boolean} stripNull - removes 0x00 characters
    *
    * @return string
    */
    wpstring4le(stripNull) {
        return this.string({ stringType: "wide-pascal", encoding: "utf-16", lengthReadSize: 4, endian: "little", stripNull: stripNull });
    }
}
exports.bireader = bireader;
/**
* Binary writer, includes bitfields and strings
*
* @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
* @param {number} byteOffset - Byte offset to start writer, default is 0
* @param {number} bitOffset - Bit offset to start writer, 0-7
* @param {string} endianness - Endianness ``big`` or ``little`` (default little)
* @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default false)
*/
class biwriter {
    isBufferOrUint8Array(obj) {
        return arraybuffcheck(this, obj);
    }
    extendArray(to_padd) {
        return extendarray(this, to_padd);
    }
    /**
    * Binary writer, includes bitfields and strings
    *
    * @param {Buffer|Uint8Array} data - ``Buffer`` or ``Uint8Array``. Always found in ``biwriter.data``
    * @param {number} byteOffset - Byte offset to start writer, default is 0
    * @param {number} bitOffset - Bit offset to start writer, 0-7
    * @param {string} endianness - Endianness ``big`` or ``little`` (default little)
    * @param {boolean} strict - Strict mode: if true does not extend supplied array on outside write (default false)
    */
    constructor(data, byteOffset, bitOffset, endianness, strict) {
        this.endian = "little";
        this.offset = 0;
        this.bitoffset = 0;
        this.size = 0;
        this.strict = false;
        this.errorDump = true;
        this.data = [];
        if (endianness != undefined && typeof endianness != "string") {
            throw new Error("endianness must be big or little");
        }
        if (endianness != undefined && !(endianness == "big" || endianness == "little")) {
            throw new Error("Endianness must be big or little");
        }
        this.endian = endianness || "little";
        if (byteOffset != undefined) {
            if (typeof byteOffset == "number") {
                this.offset = Math.round(byteOffset) || 0;
            }
            else {
                throw new Error("Byte offset must be number");
            }
        }
        if (bitOffset != undefined) {
            this.bitoffset = (bitOffset % 8);
        }
        if (typeof strict == "boolean") {
            this.strict = strict;
        }
        else {
            if (strict != undefined) {
                throw new Error("Strict mode must be true of false");
            }
        }
        if (data == undefined) {
            throw new Error("Data required");
        }
        else {
            if (!this.isBufferOrUint8Array(data)) {
                throw new Error("Write data must be Uint8Array or Buffer");
            }
        }
        this.data = data;
        this.size = this.data.length + ((bitOffset || 0) % 8);
    }
    /**
    * Change Endian (default little)
    *
    * Can be changed at any time, doesn't loose position
    *
    * @param {string} endian - Endianness ``big`` or ``little``
    */
    endianness(endian) {
        if (endian == undefined || typeof endian != "string") {
            throw new Error("Endian must be big or little");
        }
        if (endian != undefined && !(endian == "big" || endian == "little")) {
            throw new Error("Endian must be big or little");
        }
        this.endian = endian;
    }
    /**
    * Sets Endian to big
    *
    */
    bigEndian() {
        this.endianness("big");
    }
    /**
    * Sets Endian to big
    *
    */
    big() {
        this.endianness("big");
    }
    /**
    * Sets Endian to big
    *
    */
    be() {
        this.endianness("big");
    }
    /**
    * Sets Endian to little
    *
    */
    littleEndian() {
        this.endianness("little");
    }
    /**
    * Sets Endian to little
    *
    */
    little() {
        this.endianness("little");
    }
    /**
    * Sets Endian to little
    *
    */
    le() {
        this.endianness("little");
    }
    //
    // move from current position
    //
    /**
    * Aligns current byte position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} number - Byte to align
    */
    align(number) {
        return align(this, number);
    }
    /**
    * Reverse aligns current byte position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} number - Byte to align
    */
    alignRev(number) {
        return alignRev(this, number);
    }
    /**
    * Offset current byte or bit position
    *
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    skip(bytes, bits) {
        return skip(this, bytes, bits);
    }
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    jump(bytes, bits) {
        this.skip(bytes, bits);
    }
    //
    // directly set current position
    //
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    goto(byte, bit) {
        return goto(this, byte, bit);
    }
    /**
    * Offset current byte or bit position
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} bytes - Bytes to skip
    * @param {number} bits - Bits to skip (0-7)
    */
    seek(bytes, bits) {
        return this.skip(bytes, bits);
    }
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    pointer(byte, bit) {
        return this.goto(byte, bit);
    }
    /**
    * Change position directly to address
    * Note: Will extend array if strict mode is off and outside of max size
    *
    * @param {number} byte - byte to set to
    * @param {number} bit - bit to set to (0-7)
    */
    warp(byte, bit) {
        return this.goto(byte, bit);
    }
    //
    //go to start
    //
    /**
    * Set byte and bit position to start of data
    */
    rewind() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    /**
    * Set byte and bit position to start of data
    */
    gotostart() {
        this.offset = 0;
        this.bitoffset = 0;
    }
    //
    //get position
    //
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    tell() {
        return this.offset;
    }
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    getOffset() {
        return this.offset;
    }
    /**
    * Get the current byte position
    *
    * @return {number} current byte position
    */
    saveOffset() {
        return this.offset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    tellB() {
        return this.bitoffset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    getOffsetBit() {
        return this.bitoffset;
    }
    /**
    * Get the current bit position (0-7)
    *
    * @return {number} current bit position
    */
    saveOffsetAbsBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    tellAbsB() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    getOffsetAbsBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    /**
    * Get the current absolute bit position (from start of data)
    *
    * @return {number} current absolute bit position
    */
    saveOffsetBit() {
        return (this.offset * 8) + this.bitoffset;
    }
    //
    //strict mode change
    //
    /**
    * Disallows extending data if position is outside of max size
    */
    restrict() {
        this.strict = true;
    }
    /**
    * Allows extending data if position is outside of max size
    */
    unrestrict() {
        this.strict = false;
    }
    //
    //math
    //
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xor(xorKey, startOffset, endOffset, consume) {
        var XORKey = xorKey;
        if (typeof xorKey == "number") {
            //pass
        }
        else if (typeof xorKey == "string") {
            xorKey = new TextEncoder().encode(xorKey);
        }
        else if (this.isBufferOrUint8Array(XORKey)) {
            //pass
        }
        else {
            throw new Error("XOR must be a number, string, Uint8Array or Buffer");
        }
        return XOR(this, xorKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * XOR data
    *
    * @param {number|string|Uint8Array|Buffer} xorKey - Value, string or array to XOR
    * @param {number} length - Length in bytes to XOR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    xorThis(xorKey, length, consume) {
        var Length = length || 1;
        var XORKey = xorKey;
        if (typeof xorKey == "number") {
            Length = length || 1;
        }
        else if (typeof xorKey == "string") {
            const encoder = new TextEncoder().encode(xorKey);
            XORKey = encoder;
            Length = length || encoder.length;
        }
        else if (this.isBufferOrUint8Array(XORKey)) {
            Length = length || xorKey.length;
        }
        else {
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
    or(orKey, startOffset, endOffset, consume) {
        var ORKey = orKey;
        if (typeof orKey == "number") {
            //pass
        }
        else if (typeof orKey == "string") {
            orKey = new TextEncoder().encode(orKey);
        }
        else if (this.isBufferOrUint8Array(ORKey)) {
            //pass
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return OR(this, orKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * OR data
    *
    * @param {number|string|Uint8Array|Buffer} orKey - Value, string or array to OR
    * @param {number} length - Length in bytes to OR from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    orThis(orKey, length, consume) {
        var Length = length || 1;
        var ORKey = orKey;
        if (typeof orKey == "number") {
            Length = length || 1;
        }
        else if (typeof orKey == "string") {
            const encoder = new TextEncoder().encode(orKey);
            ORKey = encoder;
            Length = length || encoder.length;
        }
        else if (this.isBufferOrUint8Array(ORKey)) {
            Length = length || orKey.length;
        }
        else {
            throw new Error("OR must be a number, string, Uint8Array or Buffer");
        }
        return OR(this, ORKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    and(andKey, startOffset, endOffset, consume) {
        var ANDKey = andKey;
        if (typeof ANDKey == "number") {
            //pass
        }
        else if (typeof ANDKey == "string") {
            ANDKey = new TextEncoder().encode(ANDKey);
        }
        else if (typeof ANDKey == "object") {
            //pass
        }
        else {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return AND(this, andKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * AND data
    *
    * @param {number|string|Array<number>|Buffer} andKey - Value, string or array to AND
    * @param {number} length - Length in bytes to AND from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    andThis(andKey, length, consume) {
        var Length = length || 1;
        var ANDKey = andKey;
        if (typeof andKey == "number") {
            Length = length || 1;
        }
        else if (typeof andKey == "string") {
            const encoder = new TextEncoder().encode(andKey);
            ANDKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof andKey == "object") {
            Length = length || andKey.length;
        }
        else {
            throw new Error("AND must be a number, string, number array or Buffer");
        }
        return AND(this, ANDKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Not data
    *
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    not(startOffset, endOffset, consume) {
        return NOT(this, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Not data
    *
    * @param {number} length - Length in bytes to NOT from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    notThis(length, consume) {
        return NOT(this, this.offset, this.offset + (length || 1), consume || false);
    }
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShift(shiftKey, startOffset, endOffset, consume) {
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            //pass
        }
        else if (typeof lShiftKey == "string") {
            lShiftKey = new TextEncoder().encode(lShiftKey);
        }
        else if (typeof lShiftKey == "object") {
            //pass
        }
        else {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return LSHIFT(this, lShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Left shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to left shift data
    * @param {number} length - Length in bytes to left shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    lShiftThis(shiftKey, length, consume) {
        var Length = length || 1;
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        }
        else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        }
        else {
            throw new Error("Left shift must be a number, string, number array or Buffer");
        }
        return LSHIFT(this, shiftKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShift(shiftKey, startOffset, endOffset, consume) {
        var rShiftKey = shiftKey;
        if (typeof rShiftKey == "number") {
            //pass
        }
        else if (typeof rShiftKey == "string") {
            rShiftKey = new TextEncoder().encode(rShiftKey);
        }
        else if (typeof rShiftKey == "object") {
            //pass
        }
        else {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return RSHIFT(this, rShiftKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Right shift data
    *
    * @param {number|string|Array<number>|Buffer} shiftKey - Value, string or array to right shift data
    * @param {number} length - Length in bytes to right shift from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    rShiftThis(shiftKey, length, consume) {
        var Length = length || 1;
        var lShiftKey = shiftKey;
        if (typeof lShiftKey == "number") {
            Length = length || 1;
        }
        else if (typeof lShiftKey == "string") {
            const encoder = new TextEncoder().encode(lShiftKey);
            lShiftKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof lShiftKey == "object") {
            Length = length || lShiftKey.length;
        }
        else {
            throw new Error("Right shift must be a number, string, number array or Buffer");
        }
        return RSHIFT(this, lShiftKey, this.offset, this.offset + Length, consume || false);
    }
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} startOffset - Start location (default current byte position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    add(addKey, startOffset, endOffset, consume) {
        var addedKey = addKey;
        if (typeof addedKey == "number") {
            //pass
        }
        else if (typeof addedKey == "string") {
            addedKey = new TextEncoder().encode(addedKey);
        }
        else if (typeof addedKey == "object") {
            //pass
        }
        else {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return ADD(this, addedKey, startOffset || this.offset, endOffset || this.size, consume || false);
    }
    /**
    * Add value to data
    *
    * @param {number|string|Array<number>|Buffer} addKey - Value, string or array to add to data
    * @param {number} length - Length in bytes to add from curent position (default 1 byte for value, length of string or array for Uint8Array or Buffer)
    * @param {boolean} consume - Move current position to end of data (default false)
    */
    addThis(addKey, length, consume) {
        var Length = length || 1;
        var AddedKey = addKey;
        if (typeof AddedKey == "number") {
            Length = length || 1;
        }
        else if (typeof AddedKey == "string") {
            const encoder = new TextEncoder().encode(AddedKey);
            AddedKey = encoder;
            Length = length || encoder.length;
        }
        else if (typeof AddedKey == "object") {
            Length = length || AddedKey.length;
        }
        else {
            throw new Error("Add key must be a number, string, number array or Buffer");
        }
        return ADD(this, AddedKey, this.offset, this.offset + Length, consume || false);
    }
    //
    //remove part of data
    //
    /**
    * Deletes part of data from start to current byte position unless supplied, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} startOffset - Start location (default 0)
    * @param {number} endOffset - End location (default current position)
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    delete(startOffset, endOffset, consume) {
        return remove(this, startOffset || 0, endOffset || this.offset, consume || false, true);
    }
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    clip() {
        return remove(this, this.offset, this.size, false, true);
    }
    /**
    * Deletes part of data from current byte position to end, returns removed
    * Note: Errors in strict mode
    *
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    trim() {
        return remove(this, this.offset, this.size, false, true);
    }
    /**
    * Deletes part of data from current byte position to supplied length, returns removed
    * Note: Errors in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    crop(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    /**
    * Deletes part of data from current position to supplied length, returns removed
    * Note: Only works in strict mode
    *
    * @param {number} length - Length of data in bytes to remove
    * @param {boolean} consume - Move position to end of removed data (default false)
    * @returns {Buffer|Uint8Array} Removed data as ``Buffer`` or ``Uint8Array``
    */
    drop(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, true);
    }
    //
    //copy out
    //
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    lift(startOffset, endOffset, consume, fillValue) {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    /**
    * Returns part of data from current byte position to end of data unless supplied
    *
    * @param {number} startOffset - Start location (default current position)
    * @param {number} endOffset - End location (default end of data)
    * @param {boolean} consume - Move position to end of lifted data (default false)
    * @param {number} fillValue - Byte value to to fill returned data (does NOT fill unless supplied)
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    fill(startOffset, endOffset, consume, fillValue) {
        return remove(this, startOffset || this.offset, endOffset || this.size, consume || false, false, fillValue);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    extract(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    slice(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    /**
    * Extract data from current position to length supplied
    * Note: Does not affect supplied data
    *
    * @param {number} length - Length of data in bytes to copy from current offset
    * @param {number} consume - Moves offset to end of length
    * @returns {Buffer|Uint8Array} Selected data as ``Uint8Array`` or ``Buffer``
    */
    wrap(length, consume) {
        return remove(this, this.offset, this.offset + (length || 0), consume || false, false);
    }
    //
    //insert
    //
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    insert(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset);
    }
    /**
    * Inserts data into data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Byte position to add at (defaults to current position)
    */
    place(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset);
    }
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    replace(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, true);
    }
    /**
    * Replaces data in data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to replace in data
    * @param {boolean} consume - Move current byte position to end of data (default false)
    * @param {number} offset - Offset to add it at (defaults to current position)
    */
    overwrite(data, consume, offset) {
        return addData(this, data, consume || false, offset || this.offset, true);
    }
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    unshift(data, consume) {
        return addData(this, data, consume || false, 0);
    }
    /**
    * Adds data to start of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    prepend(data, consume) {
        return addData(this, data, consume || false, 0);
    }
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    push(data, consume) {
        return addData(this, data, consume || false, this.size);
    }
    /**
    * Adds data to end of supplied data
    * Note: Must be same data type as supplied data. Errors on strict mode.
    *
    * @param {Buffer|Uint8Array} data - ``Uint8Array`` or ``Buffer`` to add to data
    * @param {boolean} consume - Move current write position to end of data (default false)
    */
    append(data, consume) {
        return addData(this, data, consume || false, this.size);
    }
    //
    //finishing
    //
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    get() {
        return this.data;
    }
    /**
    * Returns current data
    *
    * @returns {Buffer|Uint8Array} ``Buffer`` or ``Uint8Array``
    */
    return() {
        return this.data;
    }
    /**
    * removes data
    */
    end() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    close() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    done() {
        this.data = undefined;
    }
    /**
    * removes data
    */
    finished() {
        this.data = undefined;
    }
    /**
    * Console logs data as hex dump
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
    hexdump(options) {
        return hexDump(this, options);
    }
    /**
    * Turn hexdump on error off (default on)
    */
    errorDumpOff() {
        this.errorDump = false;
    }
    /**
    * Turn hexdump on error on (default on)
    */
    errorDumpOn() {
        this.errorDump = true;
    }
    //
    //bit writer
    //
    /**
    *
    * Write bits, must have at least value and number of bits
    *
    * ``Note``: When returning to a byte write, remaining bits are skipped
    *
    * @param {number} value - value as int
    * @param {number} bits - number of bits to write
    * @param {boolean} unsigned - if value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeBit(value, bits, unsigned, endian) {
        return wbit(this, value, bits, unsigned, endian);
    }
    /**
    * Bit field reader
    *
    * Note: When returning to a byte read, remaining bits are dropped
    *
    * @param {number} bits - bits to read
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readBit(bits, unsigned, endian) {
        return rbit(this, bits, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit(value, bits, unsigned, endian) {
        return this.writeBit(value, bits, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit(value, bits, endian) {
        return this.writeBit(value, bits, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    writeUBitBE(value, bits) {
        return this.bit(value, bits, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    ubitbe(value, bits) {
        return this.bit(value, bits, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    writeBitBE(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitbe(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    writeUBitLE(value, bits) {
        return this.bit(value, bits, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @returns number
    */
    ubitle(value, bits) {
        return this.bit(value, bits, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    writeBitLE(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {number} bits - bits to write
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bitle(value, bits, unsigned) {
        return this.bit(value, bits, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit1(value, unsigned, endian) {
        return this.bit(value, 1, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1le(value, unsigned) {
        return this.bit(value, 1, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit1be(value, unsigned) {
        return this.bit(value, 1, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit1(value, endian) {
        return this.bit(value, 1, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit1le(value) {
        return this.bit(value, 1, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit1be(value) {
        return this.bit(value, 1, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit2(value, unsigned, endian) {
        return this.bit(value, 2, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2le(value, unsigned) {
        return this.bit(value, 2, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit2be(value, unsigned) {
        return this.bit(value, 2, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit2(value, endian) {
        return this.bit(value, 2, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit2le(value) {
        return this.bit(value, 2, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit2be(value) {
        return this.bit(value, 2, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit3(value, unsigned, endian) {
        return this.bit(value, 3, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3le(value, unsigned) {
        return this.bit(value, 3, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit3be(value, unsigned) {
        return this.bit(value, 3, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit3(value, endian) {
        return this.bit(value, 3, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit3le(value) {
        return this.bit(value, 3, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit3be(value) {
        return this.bit(value, 3, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit4(value, unsigned, endian) {
        return this.bit(value, 4, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4le(value, unsigned) {
        return this.bit(value, 4, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit4be(value, unsigned) {
        return this.bit(value, 4, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit4(value, endian) {
        return this.bit(value, 4, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit4le(value) {
        return this.bit(value, 4, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit4be(value) {
        return this.bit(value, 4, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit5(value, unsigned, endian) {
        return this.bit(value, 5, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5le(value, unsigned) {
        return this.bit(value, 5, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit5be(value, unsigned) {
        return this.bit(value, 5, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit5(value, endian) {
        return this.bit(value, 5, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit5le(value) {
        return this.bit(value, 5, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit5be(value) {
        return this.bit(value, 5, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit6(value, unsigned, endian) {
        return this.bit(value, 6, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6le(value, unsigned) {
        return this.bit(value, 6, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit6be(value, unsigned) {
        return this.bit(value, 6, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit6(value, endian) {
        return this.bit(value, 6, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit6le(value) {
        return this.bit(value, 6, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit6be(value) {
        return this.bit(value, 6, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit7(value, unsigned, endian) {
        return this.bit(value, 7, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7le(value, unsigned) {
        return this.bit(value, 7, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit7be(value, unsigned) {
        return this.bit(value, 7, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit7(value, endian) {
        return this.bit(value, 7, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit7le(value) {
        return this.bit(value, 7, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit7be(value) {
        return this.bit(value, 7, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit8(value, unsigned, endian) {
        return this.bit(value, 8, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8le(value, unsigned) {
        return this.bit(value, 8, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit8be(value, unsigned) {
        return this.bit(value, 8, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit8(value, endian) {
        return this.bit(value, 8, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit8le(value) {
        return this.bit(value, 8, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit8be(value) {
        return this.bit(value, 8, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit9(value, unsigned, endian) {
        return this.bit(value, 9, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9le(value, unsigned) {
        return this.bit(value, 9, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit9be(value, unsigned) {
        return this.bit(value, 9, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit9(value, endian) {
        return this.bit(value, 9, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit9le(value) {
        return this.bit(value, 9, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit9be(value) {
        return this.bit(value, 9, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit10(value, unsigned, endian) {
        return this.bit(value, 10, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10le(value, unsigned) {
        return this.bit(value, 10, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit10be(value, unsigned) {
        return this.bit(value, 10, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit10(value, endian) {
        return this.bit(value, 10, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit10le(value) {
        return this.bit(value, 10, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit10be(value) {
        return this.bit(value, 10, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit11(value, unsigned, endian) {
        return this.bit(value, 11, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11le(value, unsigned) {
        return this.bit(value, 11, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit11be(value, unsigned) {
        return this.bit(value, 11, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit11(value, endian) {
        return this.bit(value, 11, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit11le(value) {
        return this.bit(value, 11, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit11be(value) {
        return this.bit(value, 11, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit12(value, unsigned, endian) {
        return this.bit(value, 12, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12le(value, unsigned) {
        return this.bit(value, 12, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit12be(value, unsigned) {
        return this.bit(value, 12, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit12(value, endian) {
        return this.bit(value, 12, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit12le(value) {
        return this.bit(value, 12, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit12be(value) {
        return this.bit(value, 12, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit13(value, unsigned, endian) {
        return this.bit(value, 13, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13le(value, unsigned) {
        return this.bit(value, 13, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit13be(value, unsigned) {
        return this.bit(value, 13, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit13(value, endian) {
        return this.bit(value, 13, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit13le(value) {
        return this.bit(value, 13, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit13be(value) {
        return this.bit(value, 13, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit14(value, unsigned, endian) {
        return this.bit(value, 14, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14le(value, unsigned) {
        return this.bit(value, 14, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit14be(value, unsigned) {
        return this.bit(value, 14, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit14(value, endian) {
        return this.bit(value, 14, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit14le(value) {
        return this.bit(value, 14, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit14be(value) {
        return this.bit(value, 14, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit15(value, unsigned, endian) {
        return this.bit(value, 15, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15le(value, unsigned) {
        return this.bit(value, 15, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit15be(value, unsigned) {
        return this.bit(value, 15, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit15(value, endian) {
        return this.bit(value, 15, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit15le(value) {
        return this.bit(value, 15, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit15be(value) {
        return this.bit(value, 15, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit16(value, unsigned, endian) {
        return this.bit(value, 16, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16le(value, unsigned) {
        return this.bit(value, 16, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit16be(value, unsigned) {
        return this.bit(value, 16, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit16(value, endian) {
        return this.bit(value, 16, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit16le(value) {
        return this.bit(value, 16, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit16be(value) {
        return this.bit(value, 16, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit17(value, unsigned, endian) {
        return this.bit(value, 17, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17le(value, unsigned) {
        return this.bit(value, 17, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit17be(value, unsigned) {
        return this.bit(value, 17, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit17(value, endian) {
        return this.bit(value, 17, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit17le(value) {
        return this.bit(value, 17, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit17be(value) {
        return this.bit(value, 17, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit18(value, unsigned, endian) {
        return this.bit(value, 18, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18le(value, unsigned) {
        return this.bit(value, 18, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit18be(value, unsigned) {
        return this.bit(value, 18, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit18(value, endian) {
        return this.bit(value, 18, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit18le(value) {
        return this.bit(value, 18, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit18be(value) {
        return this.bit(value, 18, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit19(value, unsigned, endian) {
        return this.bit(value, 19, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19le(value, unsigned) {
        return this.bit(value, 19, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit19be(value, unsigned) {
        return this.bit(value, 19, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit19(value, endian) {
        return this.bit(value, 19, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit19le(value) {
        return this.bit(value, 19, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit19be(value) {
        return this.bit(value, 19, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit20(value, unsigned, endian) {
        return this.bit(value, 20, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20le(value, unsigned) {
        return this.bit(value, 20, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit20be(value, unsigned) {
        return this.bit(value, 20, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit20(value, endian) {
        return this.bit(value, 20, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit20le(value) {
        return this.bit(value, 20, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit20be(value) {
        return this.bit(value, 20, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit21(value, unsigned, endian) {
        return this.bit(value, 21, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21le(value, unsigned) {
        return this.bit(value, 21, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit21be(value, unsigned) {
        return this.bit(value, 21, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit21(value, endian) {
        return this.bit(value, 21, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit21le(value) {
        return this.bit(value, 21, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit21be(value) {
        return this.bit(value, 21, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit22(value, unsigned, endian) {
        return this.bit(value, 22, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22le(value, unsigned) {
        return this.bit(value, 22, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit22be(value, unsigned) {
        return this.bit(value, 22, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit22(value, endian) {
        return this.bit(value, 22, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit22le(value) {
        return this.bit(value, 22, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit22be(value) {
        return this.bit(value, 22, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit23(value, unsigned, endian) {
        return this.bit(value, 23, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23le(value, unsigned) {
        return this.bit(value, 23, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit23be(value, unsigned) {
        return this.bit(value, 23, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit23(value, endian) {
        return this.bit(value, 23, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit23le(value) {
        return this.bit(value, 23, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit23be(value) {
        return this.bit(value, 23, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit24(value, unsigned, endian) {
        return this.bit(value, 24, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24le(value, unsigned) {
        return this.bit(value, 24, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit24be(value, unsigned) {
        return this.bit(value, 24, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit24(value, endian) {
        return this.bit(value, 24, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit24le(value) {
        return this.bit(value, 24, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit24be(value) {
        return this.bit(value, 24, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit25(value, unsigned, endian) {
        return this.bit(value, 25, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25le(value, unsigned) {
        return this.bit(value, 25, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit25be(value, unsigned) {
        return this.bit(value, 25, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit25(value, endian) {
        return this.bit(value, 25, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit25le(value) {
        return this.bit(value, 25, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit25be(value) {
        return this.bit(value, 25, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit26(value, unsigned, endian) {
        return this.bit(value, 26, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26le(value, unsigned) {
        return this.bit(value, 26, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit26be(value, unsigned) {
        return this.bit(value, 26, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit26(value, endian) {
        return this.bit(value, 26, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit26le(value) {
        return this.bit(value, 26, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit26be(value) {
        return this.bit(value, 26, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit27(value, unsigned, endian) {
        return this.bit(value, 27, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27le(value, unsigned) {
        return this.bit(value, 27, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit27be(value, unsigned) {
        return this.bit(value, 27, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit27(value, endian) {
        return this.bit(value, 27, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit27le(value) {
        return this.bit(value, 27, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit27be(value) {
        return this.bit(value, 27, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit28(value, unsigned, endian) {
        return this.bit(value, 28, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28le(value, unsigned) {
        return this.bit(value, 28, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit28be(value, unsigned) {
        return this.bit(value, 28, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit28(value, endian) {
        return this.bit(value, 28, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit28le(value) {
        return this.bit(value, 28, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit28be(value) {
        return this.bit(value, 28, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit29(value, unsigned, endian) {
        return this.bit(value, 29, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29le(value, unsigned) {
        return this.bit(value, 29, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit29be(value, unsigned) {
        return this.bit(value, 29, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit29(value, endian) {
        return this.bit(value, 29, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit29le(value) {
        return this.bit(value, 29, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit29be(value) {
        return this.bit(value, 29, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit30(value, unsigned, endian) {
        return this.bit(value, 30, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30le(value, unsigned) {
        return this.bit(value, 30, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit30be(value, unsigned) {
        return this.bit(value, 30, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit30(value, endian) {
        return this.bit(value, 30, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit30le(value) {
        return this.bit(value, 30, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit30be(value) {
        return this.bit(value, 30, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit31(value, unsigned, endian) {
        return this.bit(value, 31, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31le(value, unsigned) {
        return this.bit(value, 31, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit31be(value, unsigned) {
        return this.bit(value, 31, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit31(value, endian) {
        return this.bit(value, 31, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit31le(value) {
        return this.bit(value, 31, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit31be(value) {
        return this.bit(value, 31, true, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    bit32(value, unsigned, endian) {
        return this.bit(value, 32, unsigned, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32le(value, unsigned) {
        return this.bit(value, 32, unsigned, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @returns number
    */
    bit32be(value, unsigned) {
        return this.bit(value, 32, unsigned, "big");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    ubit32(value, endian) {
        return this.bit(value, 32, true, endian);
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit32le(value) {
        return this.bit(value, 32, true, "little");
    }
    /**
    * Bit field writer
    *
    * Note: When returning to a byte write, remaining bits are dropped
    *
    * @param {number} value - value as int
    * @returns number
    */
    ubit32be(value) {
        return this.bit(value, 32, true, "big");
    }
    //
    //byte write
    //
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    writeByte(value, unsigned) {
        return wbyte(this, value, unsigned);
    }
    /**
    * Read byte
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @returns number
    */
    readByte(unsigned) {
        return rbyte(this, unsigned);
    }
    /**
    * Read unsigned byte
    *
    * @returns number
    */
    readUByte() {
        return rbyte(this, true);
    }
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    byte(value, unsigned) {
        return this.writeByte(value, unsigned);
    }
    /**
    * Write byte
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    */
    int8(value, unsigned) {
        return this.writeByte(value, unsigned);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    writeUByte(value) {
        return this.writeByte(value, true);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    uint8(value) {
        return this.writeByte(value, true);
    }
    /**
    * Write unsigned byte
    *
    * @param {number} value - value as int
    */
    ubyte(value) {
        return this.writeByte(value, true);
    }
    //
    //short writes
    //
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt16(value, unsigned, endian) {
        return wint16(this, value, unsigned, endian);
    }
    /**
    * Read short
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt16(unsigned, endian) {
        return rint16(this, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    int16(value, unsigned, endian) {
        return this.writeInt16(value, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    short(value, unsigned, endian) {
        return this.writeInt16(value, unsigned, endian);
    }
    /**
    * Write int16
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    word(value, unsigned, endian) {
        return this.writeInt16(value, unsigned, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt16(value, endian) {
        return this.writeInt16(value, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint16(value, endian) {
        return this.writeInt16(value, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    ushort(value, endian) {
        return this.writeInt16(value, true, endian);
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uword(value, endian) {
        return this.writeInt16(value, true, endian);
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    writeInt16BE(value) {
        return this.writeInt16(value, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    int16be(value) {
        return this.writeInt16(value, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    shortbe(value) {
        return this.writeInt16(value, false, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    wordbe(value) {
        return this.writeInt16(value, false, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    writeUInt16BE(value) {
        return this.writeInt16(value, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uint16be(value) {
        return this.writeInt16(value, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    ushortbe(value) {
        return this.writeInt16(value, true, "big");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uwordbe(value) {
        return this.writeInt16(value, true, "big");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    writeInt16LE(value) {
        return this.writeInt16(value, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    int16le(value) {
        return this.writeInt16(value, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    shortle(value) {
        return this.writeInt16(value, false, "little");
    }
    /**
    * Write signed int16
    *
    * @param {number} value - value as int
    */
    wordle(value) {
        return this.writeInt16(value, false, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    writeUInt16LE(value) {
        return this.writeInt16(value, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uint16le(value) {
        return this.writeInt16(value, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    ushortle(value) {
        return this.writeInt16(value, true, "little");
    }
    /**
    * Write unsigned int16
    *
    * @param {number} value - value as int
    */
    uwordle(value) {
        return this.writeInt16(value, true, "little");
    }
    //
    //half float
    //
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeHalfFloat(value, endian) {
        return whalffloat(this, value, endian);
    }
    /**
    * Read half float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readHalfFloat(endian) {
        return rhalffloat(this, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    half(value, endian) {
        return this.writeHalfFloat(value, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    halffloat(value, endian) {
        return this.writeHalfFloat(value, endian);
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    writeHalfFloatBE(value) {
        return this.writeHalfFloat(value, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halffloatbe(value) {
        return this.writeHalfFloat(value, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halfbe(value) {
        return this.writeHalfFloat(value, "big");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    writeHalfFloatLE(value) {
        return this.writeHalfFloat(value, "little");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halffloatle(value) {
        return this.writeHalfFloat(value, "little");
    }
    /**
    * Writes half float
    *
    * @param {number} value - value as int
    */
    halfle(value) {
        return this.writeHalfFloat(value, "little");
    }
    //
    //int32 write
    //
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt32(value, unsigned, endian) {
        return wint32(this, value, unsigned, endian);
    }
    /**
    * Read 32 bit integer
    *
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt32(unsigned, endian) {
        return rint32(this, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    int(value, unsigned, endian) {
        return this.writeInt32(value, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    int32(value, unsigned, endian) {
        return this.writeInt32(value, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    double(value, unsigned, endian) {
        return this.writeInt32(value, unsigned, endian);
    }
    /**
    * Write int32
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    long(value, unsigned, endian) {
        return this.writeInt32(value, unsigned, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt32(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint32(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    udouble(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    ulong(value, endian) {
        return this.writeInt32(value, true, endian);
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    writeInt32LE(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    int32le(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    intle(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    doublele(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    longle(value) {
        return this.writeInt32(value, false, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    writeUInt32LE(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uint32le(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uintle(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    udoublele(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    ulongle(value) {
        return this.writeInt32(value, true, "little");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    writeInt32BE(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    intbe(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    int32be(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    doublebe(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write signed int32
    *
    * @param {number} value - value as int
    */
    longbe(value) {
        return this.writeInt32(value, false, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    writeUInt32BE(value) {
        return this.writeInt32(value, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uint32be(value) {
        return this.writeInt32(value, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    uintbe(value) {
        return this.writeInt32(value, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    udoublebe(value) {
        return this.writeInt32(value, true, "big");
    }
    /**
    * Write unsigned int32
    *
    * @param {number} value - value as int
    */
    ulongbe(value) {
        return this.writeInt32(value, true, "big");
    }
    //
    //float write
    //
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeFloat(value, endian) {
        return wfloat(this, value, endian);
    }
    /**
    * Read float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readFloat(endian) {
        return rfloat(this, endian);
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    float(value, endian) {
        return this.writeFloat(value, endian);
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    writeFloatLE(value) {
        return this.writeFloat(value, "little");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    floatle(value) {
        return this.writeFloat(value, "little");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    writeFloatBE(value) {
        return this.writeFloat(value, "big");
    }
    /**
    * Write float
    *
    * @param {number} value - value as int
    */
    floatbe(value) {
        return this.writeFloat(value, "big");
    }
    //
    //int64 write
    //
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    writeInt64(value, unsigned, endian) {
        return wint64(this, value, unsigned, endian);
    }
    /**
    * Read signed 64 bit integer
    * @param {boolean} unsigned - if value is unsigned or not
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readInt64(unsigned, endian) {
        return rint64(this, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    int64(value, unsigned, endian) {
        return this.writeInt64(value, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    quad(value, unsigned, endian) {
        return this.writeInt64(value, unsigned, endian);
    }
    /**
    * Write 64 bit integer
    *
    * @param {number} value - value as int
    * @param {boolean} unsigned - if the value is unsigned
    * @param {string} endian - ``big`` or ``little``
    */
    bigint(value, unsigned, endian) {
        return this.writeInt64(value, unsigned, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeUInt64(value, endian) {
        return this.writeInt64(value, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uint64(value, endian) {
        return this.writeInt64(value, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    ubigint(value, endian) {
        return this.writeInt64(value, true, endian);
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    uquad(value, endian) {
        return this.writeInt64(value, true, endian);
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeInt64LE(value) {
        return this.writeInt64(value, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    int64le(value) {
        return this.writeInt64(value, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    bigintle(value) {
        return this.writeInt64(value, false, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    quadle(value) {
        return this.writeInt64(value, false, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeUInt64LE(value) {
        return this.writeInt64(value, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uint64le(value) {
        return this.writeInt64(value, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    ubigintle(value) {
        return this.writeInt64(value, true, "little");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uquadle(value) {
        return this.writeInt64(value, true, "little");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeInt64BE(value) {
        return this.writeInt64(value, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    int64be(value) {
        return this.writeInt64(value, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    bigintbe(value) {
        return this.writeInt64(value, false, "big");
    }
    /**
    * Write signed 64 bit integer
    *
    * @param {number} value - value as int
    */
    quadbe(value) {
        return this.writeInt64(value, false, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    writeUInt64BE(value) {
        return this.writeInt64(value, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uint64be(value) {
        return this.writeInt64(value, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    ubigintbe(value) {
        return this.writeInt64(value, true, "big");
    }
    /**
    * Write unsigned 64 bit integer
    *
    * @param {number} value - value as int
    */
    uquadbe(value) {
        return this.writeInt64(value, true, "big");
    }
    //
    //doublefloat
    //
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    writeDoubleFloat(value, endian) {
        return wdfloat(this, value, endian);
    }
    /**
    * Read double float
    *
    * @param {string} endian - ``big`` or ``little``
    * @returns number
    */
    readDoubleFloat(endian) {
        return rdfloat(this, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    doublefloat(value, endian) {
        return this.writeDoubleFloat(value, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    * @param {string} endian - ``big`` or ``little``
    */
    dfloat(value, endian) {
        return this.writeDoubleFloat(value, endian);
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    writeDoubleFloatBE(value) {
        return this.writeDoubleFloat(value, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    dfloatbe(value) {
        return this.writeDoubleFloat(value, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    doublefloatbe(value) {
        return this.writeDoubleFloat(value, "big");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    writeDoubleFloatLE(value) {
        return this.writeDoubleFloat(value, "little");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    dfloatle(value) {
        return this.writeDoubleFloat(value, "little");
    }
    /**
    * Writes double float
    *
    * @param {number} value - value as int
    */
    doublefloatle(value) {
        return this.writeDoubleFloat(value, "little");
    }
    //
    //string
    //
    /**
    * Writes string, use options object for different types
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
    writeString(string, options) {
        return wstring(this, string, options);
    }
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
    readString(options) {
        return rstring(this, options);
    }
    /**
    * Writes string, use options object for different types
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
    string(string, options) {
        return this.writeString(string, options);
    }
    /**
    * Writes UTF-8 (C) string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    *
    * @return string
    */
    utf8string(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes UTF-8 (C) string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    *
    * @return string
    */
    cstring(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "utf-8", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes ANSI string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    ansistring(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-8", encoding: "windows-1252", length: length, terminateValue: terminateValue });
    }
    /**
    * Writes UTF-16 (Unicode) string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    utf16string(string, length, terminateValue, endian) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    }
    /**
    * Writes UTF-16 (Unicode) string
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    * @param {string} endian - ``big`` or ``little``
    */
    unistring(string, length, terminateValue, endian) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: endian });
    }
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringle(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    }
    /**
    * Writes UTF-16 (Unicode) string in little endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringle(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "little" });
    }
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    utf16stringbe(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    }
    /**
    * Writes UTF-16 (Unicode) string in big endian order
    *
    * @param {string} string - text string
    * @param {number} length - for fixed length utf strings
    * @param {number} terminateValue - for non-fixed length utf strings
    */
    unistringbe(string, length, terminateValue) {
        return this.string(string, { stringType: "utf-16", encoding: "utf-16", length: length, terminateValue: terminateValue, endian: "big" });
    }
    /**
    * Writes Pascal string
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    /**
    * Writes Pascal string 1 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little`` for 2 or 4 byte length write size
    */
    pstring1(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: endian });
    }
    /**
    * Writes Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring1le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "little" });
    }
    /**
    * Writes Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring1be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 1, endian: "big" });
    }
    /**
    * Writes Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    pstring2(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: endian });
    }
    /**
    * Writes Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring2le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "little" });
    }
    /**
    * Writes Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring2be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 2, endian: "big" });
    }
    /**
    * Writes Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    pstring4(string, endian) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: endian });
    }
    /**
    * Writes Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    pstring4be(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "big" });
    }
    /**
    * Writes Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    pstring4le(string) {
        return this.string(string, { stringType: "pascal", encoding: "utf-8", lengthWriteSize: 4, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring(string, lengthWriteSize, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: endian });
    }
    /**
    * Writes Wide-Pascal string in big endian order
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringbe(string, lengthWriteSize) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string in little endian order
    *
    * @param {string} string - text string
    * @param {number} lengthWriteSize - 1, 2 or 4 byte length write size (default 1)
    */
    wpstringle(string, lengthWriteSize) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: lengthWriteSize, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring1(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 1 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring1be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string 1 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring1le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 1, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring2(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring2le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 2 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring2be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 2, endian: "big" });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read
    *
    * @param {string} string - text string
    * @param {string} endian - ``big`` or ``little``
    */
    wpstring4(string, endian) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: endian });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read in little endian order
    *
    * @param {string} string - text string
    */
    wpstring4le(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "little" });
    }
    /**
    * Writes Wide-Pascal string 4 byte length read in big endian order
    *
    * @param {string} string - text string
    */
    wpstring4be(string) {
        return this.string(string, { stringType: "wide-pascal", encoding: "utf-16", lengthWriteSize: 4, endian: "big" });
    }
}
exports.biwriter = biwriter;
//# sourceMappingURL=index.js.map