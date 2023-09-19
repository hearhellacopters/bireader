# bireader

A quick and simple binary reader and writer that tracks your position. Includes multiple simple sharded language for easy data conversions to do low level data functions. Accepts `Uint8Array` or `Buffer`.

Supported data types are:

- [Bitfields](#bit-field) (bit1 - bit32{le/be}) 1-32 bit signed or unsigned bits in big or little endian
- [Bytes](#byte) ({u}int8, byte) 8 bit signed or unsigned value
- [Shorts](#short) ({u}int16, word, short{le/be}) 16 bit signed or unsigned value in big or little endian
- [Half Floats](#half-float) (halffloat, half{le/be}) 16 bit decimal value in big or little endian
- [Integers](#integer) ({u}int32, int, double{le/be}) 32 bit signed and unsigned in big or little endian
- [Floats](#float) (float{le/be}) 32 bit decimal value in big or little endian
- [Quadwords](#quadword) ({u}int64, quad, bigint{le/be}) 64 bit signed and unsigned in big or little endian
- [Double Floats](#float) (doublefloat, dfloat{le/be}) 64 bit decimal value in big or little endian
- [Strings](#strings) (string) Fixed length, UTF, pascal, wide pascal, delphi and all ```TextEncoder``` types

## Installation

```npm install bireader```

### Quick Start

Import the reader or writer. Create a new parser with the data and start parsing.

```javascript
import {bireader, biwriter} from 'bireader';

function header_read(data){
    const br = new bireader(data)
    const header = {}
    header.magic = br.string({length:4})
    header.ver = br.ubyte()
    br.skip(2) //reserved
    if(header.ver == 10){
        br.endianness("big")
        header.file_size = br.size
        header.heigth = br.uint()
        header.width = br.udouble()
    } else if(header.ver < 9) {
        br.endianness("little")
        header.file_size = br.ushort()
        header.heigth = br.uword()
        header.width = br.uint16()
    } else {
        throw new Error('Unknown version of ' + header.ver)
    }
    br.finished()
    return header
}

function header_write(size, magic, ver, heigth, width){
    const data = new Uint8Array(size)
    const bw = new biwriter(data)
    header.magic = bw.string(magic, {length:4})
    header.ver = bw.uint8(ver)
    br.int16(0) //reserved
    if(header.ver == 10){ 
        header.heigth = bw.uint32be(heigth)
        header.width = bw.uint32be(width)
    } else if(header.ver < 9) {
        header.file_size = bw.ushort(size)
        header.heigth = bw.uint16(heigth)
        header.width = bw.uint16(width)
    } else {
        throw new Error('Unknown version of ' + ver)
    }
    bw.end()
    return data
}
```

## Common Functions

Common functions for setup and movement shared by both (unless indicated).

<table>
<thead>
  <tr>
    <th align="center" colspan="2">Function</th>
    <th align="center">Params (bold requires)</th>
    <th align="left">Notes</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>Name</td>
    <td>new bireader(data, 1, 0, "big")</td>
    <td align="center" rowspan="2">Buffer | Uint8Array, byte offset, bit offset, endianness</td>
    <td rowspan="2">new constructor </td>
  </tr>
  <tr>
    <td>Name</td>
    <td>new biwriter(data, 0, 8, "little")</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>endianness(str)</td>
    <td align="center" rowspan="2">big or little (default little)</td>
    <td rowspan="2">Can be changed at any time</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>bigEndian()<br>big()<br>littleEndian()<br>little()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>skip(bytes, bits)</td>
    <td align="center" rowspan="2">bytes to skip, bits to skip</td>
    <td rowspan="2">Use negative to go back</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>fskip(bytes, bits)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>goto(byte, bit)</td>
    <td align="center" rowspan="2">offset current byte, bit read position</td>
    <td rowspan="2">Note: remaining bits are drop when returning to byte data</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>seek(byte, bit)<br>fseek(byte, bit)<br>pointer(byte, bit)<br>warp(byte, bit)<br>fsetpos(byte, bit)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>rewind()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Moves current read position to start of data</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>gotostart()<br>tostart()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>ftell()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Gets current read position in bytes</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>tell()<br>fgetpos()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>unrestrict()</td>
    <td align="center">none</td>
    <td>biwriter only: Will extend array if data is written outside of max size (default on)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>restrict()</td>
    <td align="center">none</td>
    <td>biwriter only: Won't extend array if data is written outside of max size (default off)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>crop(start, end)</td>
    <td align="center" rowspan="2">start location of data, end location of data</td>
    <td rowspan="2">Returns data truncated. defaults to 0 and current read / write position. <br>Note: Does not affect supplied data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>clip(start, end)<br>truncate(start, end)<br>slice(start, end)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>get() </td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">returns supplied data</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>return()<br>data</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>end()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">removes supplied data</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>close()<br>done()<br>finished()</td>
  </tr>
</tbody>
</table>

## Bit field

TODO

## Byte

TODO

## Short

TODO

## Half Float

TODO

## Integer

TODO

## Float

TODO

## Quadword

TODO

## Double Float

TODO

## Strings

TODO
