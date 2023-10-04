"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wstring = exports.rstring = exports.rdfloat = exports.wdfloat = exports.wint64 = exports.rint64 = exports.wfloat = exports.rfloat = exports.rint32 = exports.wint32 = exports.whalffloat = exports.rhalffloat = exports.rint16 = exports.wint16 = exports.rbyte = exports.wbyte = exports.rbit = exports.wbit = exports.ADD = exports.RSHIFT = exports.LSHIFT = exports.NOT = exports.XOR = exports.OR = exports.AND = exports.hexDump = exports.addData = exports.remove = exports.goto = exports.skip = exports.checkSize = exports.extendarray = exports.arraybuffcheck = exports.buffcheck = void 0;
function buffcheck(obj) {
    return (typeof Buffer !== 'undefined' && obj instanceof Buffer);
}
exports.buffcheck = buffcheck;
function arraybuffcheck(_this, obj) {
    return obj instanceof Uint8Array || _this.isBuffer(obj);
}
exports.arraybuffcheck = arraybuffcheck;
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
exports.extendarray = extendarray;
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
exports.checkSize = checkSize;
function skip(_this, bytes, bits) {
    const new_size = (((bytes || 0) + _this.offset) + Math.ceil((_this.bitoffset + (bits || 0)) / 8));
    _this.check_size(bytes || 0, bits || 0);
    if (new_size > _this.size) {
        _this.errorDump ? "\x1b[31m[Error]\x1b[0m hexdump:\n" + _this.hexdump() : "";
        throw new Error("\x1b[33m[Strict mode]\x1b[0m: Seek outside of size of data: " + _this.size);
    }
    _this.bitoffset += (bits || 0) % 8;
    _this.offset += (bytes || 0);
}
exports.skip = skip;
function goto(_this, byte, bit) {
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
exports.goto = goto;
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
            _this.bitoffset = 0;
        }
        else {
            _this.offset = new_start;
            _this.bitoffset = 0;
        }
    }
    return data_removed;
}
exports.remove = remove;
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
        const dif = needed_size - _this.size;
        _this.extendArray(dif);
        _this.size = _this.data.length;
    }
    if (repalce) {
        if (_this.isBuffer(_this.data)) {
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
    }
    if (consume) {
        _this.offset = needed_size;
        _this.bitoffset = 0;
    }
}
exports.addData = addData;
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
exports.hexDump = hexDump;
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
        if (_this.isBufferOrUint8Array(and_key)) {
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
exports.AND = AND;
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
        if (_this.isBufferOrUint8Array(or_key)) {
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
exports.OR = OR;
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
                    _this.bitoffset = 0;
                }
            }
        }
        else {
            throw new Error("XOR key must be a byte value, string, Uint8Array or Buffer");
        }
    }
}
exports.XOR = XOR;
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
exports.NOT = NOT;
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
        if (_this.isBufferOrUint8Array(shift_key)) {
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
exports.LSHIFT = LSHIFT;
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
        if (_this.isBufferOrUint8Array(shift_key)) {
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
exports.RSHIFT = RSHIFT;
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
        if (_this.isBufferOrUint8Array(add_key)) {
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
exports.ADD = ADD;
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
exports.wbit = wbit;
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
exports.rbit = rbit;
function wbyte(_this, value, unsigned) {
    _this.check_size(1, 0);
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
exports.wbyte = wbyte;
function rbyte(_this, unsigned) {
    _this.check_size(1);
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
exports.rbyte = rbyte;
function wint16(_this, value, unsigned, endian) {
    _this.check_size(2, 0);
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
exports.wint16 = wint16;
function rint16(_this, unsigned, endian) {
    _this.check_size(2);
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
exports.rint16 = rint16;
function rhalffloat(_this, endian) {
    _this.check_size(2);
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
    _this.offset += 2;
    _this.bitoffset = 0;
    return floatValue;
}
exports.rhalffloat = rhalffloat;
function whalffloat(_this, value, endian) {
    _this.check_size(2, 0);
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
exports.whalffloat = whalffloat;
function wint32(_this, value, unsigned, endian) {
    _this.check_size(4, 0);
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
exports.wint32 = wint32;
function rint32(_this, unsigned, endian) {
    _this.check_size(4);
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
exports.rint32 = rint32;
function rfloat(_this, endian) {
    _this.check_size(4);
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
    _this.offset += 4;
    _this.bitoffset = 0;
    return floatValue;
}
exports.rfloat = rfloat;
function wfloat(_this, value, endian) {
    _this.check_size(4, 0);
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
exports.wfloat = wfloat;
function rint64(_this, unsigned, endian) {
    _this.check_size(8);
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
exports.rint64 = rint64;
function wint64(_this, value, unsigned, endian) {
    _this.check_size(8, 0);
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
exports.wint64 = wint64;
function wdfloat(_this, value, endian) {
    _this.check_size(8, 0);
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
exports.wdfloat = wdfloat;
function rdfloat(_this, endian) {
    _this.check_size(8);
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
    _this.offset += 8;
    _this.bitoffset = 0;
    return floatValue;
}
exports.rdfloat = rdfloat;
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
        _this.check_size(length);
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
exports.rstring = rstring;
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
        _this.check_size(totalLength, 0);
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
        _this.check_size(totalLength, 0);
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
exports.wstring = wstring;
//# sourceMappingURL=common.js.map