# bireader

A simple binary reader and writer that keeps track of your position to quickly create file structures. Includes shared naming conventions and multiple programmable calling for easy data conversions to do low level parsing. Accepts `Uint8Array` or `Buffer`.

Supported data types are:

- [Bitfields](#bit-field) ([u]bit{1-32}{le|be}) 1-32 bit signed or unsigned value in big or little endian order
- [Bytes](#byte) ([u]int8, byte) 8 bit signed or unsigned value
- [Shorts](#short) ([u]int16, word, short{le|be}) 16 bit signed or unsigned value in big or little endian order
- [Half Floats](#half-float) (halffloat, half{le|be}) 16 bit decimal value in big or little endian order
- [Integers](#integer) ([u]int32, int, double{le|be}) 32 bit signed or unsigned value in big or little endian order
- [Floats](#float) (float{le|be}) 32 bit decimal value in big or little endian
- [Quadwords](#quadword) ([u]int64, quad, bigint{le|be}) 64 bit signed or unsigned in big or little endian
- [Double Floats](#double-float) (doublefloat, dfloat{le|be}) 64 bit decimal value in big or little endian
- [Strings](#strings) (string) Fixed and non-fixed length, UTF, pascal, wide pascal. Includes all ```TextEncoder``` types

## Installation

```npm install bireader```

### Quick Start

Import the reader or writer. Create a new parser with the data and start parsing.

Includes all presents for quick parsing or programmable functions (examples below).

```javascript
import {bireader, biwriter} from 'bireader';

//example of using mixed preset function naming and programmable calls
function header_read(data){
    const br = new bireader(data)
    const header = {}
    header.magic = br.cstring({length:4})
    const unsigned = header.magic == "foo" ? true : false
    header.ver = br.int32(unsigned, unsigned == true : "big" : "little")
    br.skip(2) //reserved
    if(header.ver == 10){
      br.endianness("big")
      header.file_size = br.size
      header.heigth = br.uint()
      header.width = br.quad()
    } else if(header.ver < 9) {
      br.le()
      header.file_size = br.ushort()
      header.heigth = br.uword()
      header.width = br.uint64()
    } else {
      throw new Error('Unknown version of ' + header.ver)
    }
    br.finished()
    return header
}

function header_write(size, magic, ver, heigth, width){
    const data = new Uint8Array(size)
    const bw = new biwriter(data)
    bw.writeString(magic, {length:4})
    const unsigned = true
    header.ver = bw.uint8(ver)
    if(header.ver == 10){ 
      bw.bit16() //reserved
      bw.uint32be(heigth)
      bw.quadbe(width)
    } else if(header.ver < 9) {
      bw.fskip(2) //reserved
      bw.uint16le(size)
      const bitsize = header.magic == "foo" ? 16 : 32
      const byteOffset = 0
      const bitOffset = 0
      bw.bit(heigth, bitsize, byteOffset, bitOffset0, unsigned)
      bw.int64le(width, byteOffset, unsigned)
    } else {
      throw new Error('Unknown version of ' + ver)
    }
    const header = bw.crop(0,size)
    bw.finished()
    return header
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
    <td>new bireader(<b>data</b>, 1, 0, "big")</td>
    <td align="center" rowspan="2"><b>Buffer or Uint8Array</b>, byte offset, bit offset, endian</td>
    <td rowspan="2">new Constructor</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>new biwriter(<b>data</b>, 0, 8, "little")</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>endianness(<b>str</b>)</td>
    <td align="center" rowspan="2"><b>big</b> or <b>little</b> (default little)</td>
    <td rowspan="2">Can be changed at any time.</td>
  </tr>
  <tr>
    <td>Presets</td>
    <td>bigEndian()<br>big()<br>be()<br>littleEndian()<br>little()<br>le()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>skip(<b>bytes</b>, bits)</td>
    <td align="center" rowspan="2"><b>bytes to skip</b>, bits to skip</td>
    <td rowspan="2">Use negative to go back.<br><b>Note:</b> Remaining bits are dropped when returning to a byte read.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>fskip(<b>bytes</b>, bits)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>goto(<b>byte</b>, bit)</td>
    <td align="center" rowspan="2"><b>Offset from current byte</b>, bit read position</td>
    <td rowspan="2"><b>Note:</b> Remaining bits are drop when returning to byte data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>seek(<b>byte</b>, bit)<br>fseek(<b>byte</b>, bit)<br>pointer(<b>byte</b>, bit)<br>warp(<b>byte</b>, bit)<br>fsetpos(<b>byte</b>, bit)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>rewind()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Moves current read position to start of data.</td>
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
    <td><b>biwriter only:</b> Will extend array if data is written outside of max size (default on)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>restrict()</td>
    <td align="center">none</td>
    <td><b>biwriter only:</b> Won't extend array if data is written outside of max size (default off)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>crop(startOffset, endOffset)</td>
    <td align="center" rowspan="2">start byte of data, end byte of data</td>
    <td rowspan="2">Returns data truncated. defaults to 0 and current read / write position. <br><b>Note:</b> Does not affect supplied data or current read position.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>clip(startOffset, endOffset)<br>truncate(startOffset, endOffset)<br>slice(startOffset, endOffset)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>get() </td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Returns supplied data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>return()<br>data</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>end()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Removes supplied data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>close()<br>done()<br>finished()</td>
  </tr>
</tbody>
</table>

## Bit field

Parse value as a bit field. There are 32 functions from bit1 to bit32 and can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

**Note:** Remaining bits are dropped when returning to a byte read. Example, after using bit4() then ubyte(), the read locations drops the remaining 4 bits after bit4() when reading ubyte().

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>readBit(<b>bits</b>, unsigned, endian)</td>
    <td><b>number of bits</b>, if the value is returned unsigned, big or little endian</td>
  </tr>
  <tr>
    <td>writeBit(<b>value, bits</b>, offsetBits, offsetBytes, unsigned, endian)</td>
    <td><b>value to write, number of bits</b>, bits offset from current position, byte offset from current position, if the value is written unsigned, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]bit{1-32}{le|be}(*unsigned)</td>
    <td>If value is signed or not.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]bit{1-32}{le|be}(<b>value</b>, offsetBits, offsetBytes, *unsigned)</td>
    <td><b>value to write</b>, byte offset from current position, if value is unsigned or not.<br>*Note: functions without the starting letter <u>u</U> can still be called unsigned when <b>true</b> is the <i>fourth</i> augment</td>
  </tr>
</tbody>
</table>

## Byte

Parse value as a byte (aka int8). Can be signed or unsigned (with a ``u`` at the start).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>readByte(unsigned)</td>
    <td>if the value is returned unsigned</td>
  </tr>
  <tr>
    <td>writeByte(<b>value</b>, offsetBytes, unsigned)</td>
    <td><b>value to write</b>, byte offset from current position, if the value is written unsigned<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]{byte|int8}(*unsigned)</td>
    <td>If value is signed or not.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{byte|int8}(<b>value</b>, offsetBytes, *unsigned)</td>
    <td><b>value to write</b>, byte offset from current position, if value is signed or not.<br>*Note: functions without the starting letter <u>u</U> can still be called unsigned when <b>true</b> is the <i>third</i> augment</td>
  </tr>
</tbody>
</table>

## Short

Parse value as a int16 (aka short or word). Can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>readInt16(unsigned, endian)</td>
    <td>if the value is returned unsigned, big or little endian</td>
  </tr>
  <tr>
    <td>writeInt16(<b>value</b>, offsetBytes, unsigned, endian)</td>
    <td><b>value to write</b>, byte offset from current position, if the value is written unsigned, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]{int16|word|short}{be|le}(*unsigned, *endian)</td>
    <td>If value is unsigned, big or little endian.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>second</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int16|word|short}{be|le}(<b>value</b>, offsetBytes, *unsigned, *endian)</td>
    <td><b>value to write</b>, if value is unsigned, big or little endian.<br>*Note: functions without the starting letter <u>u</U> can still be called unsigned when <b>true</b> is the <i>third</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>fourth</i> augment (does not overwite set endian).</td>
  </tr>
</tbody>
</table>

## Half Float

Parse value as a half float (aka half). Can be in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>readHalfFloat(endian)</td>
    <td>big or little endian</td>
  </tr>
  <tr>
    <td>writeHalfFloat(<b>value</b>, offsetBytes, endian)</td>
    <td><b>value to write</b>, byte offset from current position, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>{halffloat|half}{be|le}(*endian)</td>
    <td>Big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>first</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>{halffloat|half}{be|le}(<b>value</b>, offsetBytes, *endian)</td>
    <td><b>value to write</b>, byte offset from current position, big or little endian.<br>*Note: and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>second</i> augment (does not overwite set endian).</td>
  </tr>
</tbody>
</table>

## Integer

Parse value as a int32 (aka int or double). Can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>readInt32(unsigned, endian)</td>
    <td>if the value is returned unsigned, big or little endian</td>
  </tr>
  <tr>
    <td>writeInt32(<b>value</b>, offsetBytes, unsigned, endian)</td>
    <td><b>value to write</b>, byte offset from current position, if the value is written unsigned, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]{int32|int|double}{be|le}(*unsigned, *endian)</td>
    <td>If value is unsigned, little or big endian.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>second</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int32|int|double}{be|le}(<b>value</b>, offsetBytes, *unsigned, *endian)</td>
    <td><b>value to write</b>, byte offset from current position, if value is unsigned, little or big endian<br>*Note: functions without the starting letter <u>u</U> can still be called unsigned when <b>true</b> is the <i>third</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>fourth</i> augment (does not overwite set endian).</td>
  </tr>
</tbody>
</table>

## Float

Parse value as a float. Can be in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>readFloat(endian)</td>
    <td>big or little endian</td>
  </tr>
  <tr>
    <td>writeInt64(<b>value</b>, offsetBytes, endian)</td>
    <td><b>value to write</b>, byte offset from current position, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>float{be|le}(*endian)</td>
    <td>Big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>first</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>float{be|le}(<b>value</b>, offsetBytes, *endian)</td>
    <td><b>value to write</b>, byte offset from current position, big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>third</i> augment (does not overwite set endian).</td>
  </tr>
</tbody>
</table>

## Quadword

Parse value as a int64 (aka quad or bigint). Can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>readInt64(unsigned, endian)</td>
    <td>if the value is returned unsigned, big or little endian</td>
  </tr>
  <tr>
    <td>writeInt64(<b>value</b>, offsetBytes, unsigned, endian)</td>
    <td><b>value to write</b>, byte offset from current position, if the value is written unsigned, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]{int64|quad|bigint}{be|le}(*unsigned, *endian)</td>
    <td>If value is unsigned, if value is unsigned, big or little endian.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>second</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int64|quad|bigint}{be|le}(<b>value</b>, offsetBytes, *unsigned, *endian)</td>
    <td><b>value to write</b>, byte offset from current position, if value is unsigned, big or little endian.<br>*Note: functions without the starting letter <u>u</U> can still be called unsigned when <b>true</b> is the <i>third</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>fourth</i> augment (does not overwite set endian).</td>
  </tr>
</tbody>
</table>

## Double Float

Parse value as a double float (aka dfloat). Can be in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>readDoubleFloat(endian)</td>
    <td>big or little endian</td>
  </tr>
  <tr>
    <td>writeDoubleFloat(<b>value</b>, offsetBytes, endian)</td>
    <td><b>value to write</b>, byte offset from current position, big or little endian.<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>{doublefloat|dfloat}{be|le}(*endian)</td>
    <td>Big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>first</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
   <td align="center"><b>Presets (writer)</b></td>
    <td>{doublefloat|dfloat}{be|le}(<b>value</b>, offsetBytes, *endian)</td>
    <td><b>Value to write</b>, byte offset from current position, big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>third</i> augment (does not overwite set endian).</td>
  </tr>
</tbody>
</table>

## Strings

Parse a string in any format. Be sure to use options object for formatting unless using a preset. Strings with larger than 1 byte character reads can use ``be`` or ``le`` at the end for little or big endian.

Presents include C or Unicode, Ansi and muliple pascals.


<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Functions</th>
    <th align="left">Params (bold requires)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td align="center" rowspan="2"><b>Name<br>(master)</b></td>
    <td>
      readString({<br>
        length,<br>
        stringType,<br>
        terminateValue,<br>
        lengthReadSize,<br>
        stripNull,<br>
        encoding,<br>
        endian<br>
        })
        </td>
    <td><ul><li>Length for non-fixed UTF strings. If not supplied, reads until 0 or supplied terminate value (for fixed length UTF strings only)</li><li>String type. Defaults to utf-8 (utf-8, utf-16, pascal, wide-pascal accepted)</li><li>Terminate value. Default is 0x00 (for non-fixed length utf strings)</li><li>Size of the first value that defines the length of the string. Defaults to 1 as uint8, respects supplied endian (for Pascal strings only, accepts 1, 2 or 4 bytes)</li><li>Removes 0x00 characters on read (default true)</li><li>Encoding. Defaults to utf-8 on utf-8 or pascal and utf-16 on utf-16 or wide-pascal (accepts all TextDecoder options)</li><li>Endian (for wide-pascal and utf-16 character order, does not overwite set endian)</li></ul></td>
  </tr>
  <tr>
    <td>writeString(<b>string</b>, {<br>
        length,<br>
        stringType,<br>
        terminateValue,<br>
        lengthReadSize,<br>
        encoding,<br>
        endian<br>
        })</td>
     <td><ul><li><b>String to write</b></li><li>Length for non-fixed UTF strings. If not supplied, defaults to encoded string length (for fixed length UTF strings only, will trucate if supplied value is smaller than string length)</li><li>String type. Defaults to utf-8 (utf-8, utf-16, pascal, wide-pascal accepted)</li><li>Terminate value. Default is 0x00 (for non-fixed length utf strings)</li><li>Size of the first value that defines the length of the string. Defaults to 1 as uint8, respects supplied endian (for Pascal strings only, accepts 1, 2 or 4 bytes)</li><li>Encoding. Defaults to utf-8 on utf-8 or pascal and utf-16 on utf-16 or wide-pascal (accepts all TextDecoder options)</li><li>Endian (for wide-pascal and utf-16 character order, does not overwite set endian)</li></ul></td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>
    {c|utf8}string(length, terminateValue, stripNull)<br>
    ansistring(length, terminateValue, stripNull)<br>
    {utf16|uni}string(length, terminateValue, stripNull, *endian)<br>
    pstring(lengthReadSize, stripNull, *endian)<br>
    pstring{1|2|4}{be|le}(stripNull, *endian)<br>
    wpstring{be|le}(lengthReadSize, stripNull, *endian)<br>
    wpstring{1|2|4}{be|le}(stripNull, *endian)
    </td>
    <td>Based on above.<br><b>Note:</b> Presets use augments not a single object. Endian only needed when not part of function name. Does not override set endian.</td>
  </tr>
  <tr>
  <td align="center"><b>Presets (writer)</b></td>
    <td>
    {c|utf8}string(<b>string</b>, offset, length, terminateValue)<br>
    ansistring(<b>string</b>, offset, length, terminateValue)<br>
    {utf16|uni}string{be|le}(<b>string</b>, offset, length, terminateValue, *endian)<br>
    pstring(<b>string</b>, offset, lengthWriteSize, *endian)<br>
    pstring{1|2|4}{be|le}(<b>string</b>,offset, *endian)<br>
    wpstring{be|le}(<b>string</b>, offset, lengthWriteSize, *endian)<br>
    wpstring{1|2|4}{be|le}(<b>string</b>, offset, *endian)
    </td>
    <td>Based on above.<br><b>Note:</b> Presets use augments not a single object. Endian only needed when not part of function name. Does not override set endian.</td>
  </tr>
</tbody>
</table>

## Acknowledgements

This project was born from the desire to have a single library that could both read and write in binary with common named functions. Having been using tools like [Binary-parser](https://github.com/keichi/binary-parser), [QuickBMS](https://aluigi.altervista.org/quickbms.htm) and [010 Editor](https://www.sweetscape.com/010editor/) in the past, I wanted something I could translate quickly to a Node app and then use in a web site without having to redo work.

I'm happy to connect and grow this library if others find it useful. Pull requests or [bug reports](https://github.com/hearhellacopters/bireader/issues) are welcome!

## License

[MIT](https://github.com/hearhellacopters/bireader/blob/main/LICENSE)