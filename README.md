# bireader

A feature rich binary reader and writer that keeps track of your position to quickly create file structures. Includes shared naming conventions, programmable inputs and advanced math for easy data conversions to do low level parsing. Accepts `Uint8Array` or `Buffer`.

Supported data types are:

- [Bitfields](#bit-field) ([u]bit{1-32}{le|be}) 1-32 bit signed or unsigned value in big or little endian order
- [Bytes](#byte) ([u]int8, byte) 8 bit signed or unsigned value
- [Shorts](#short) ([u]int16, word, short{le|be}) 16 bit signed or unsigned value in big or little endian order
- [Half Floats](#half-float) (halffloat, half{le|be}) 16 bit decimal value in big or little endian order
- [Integers](#integer) ([u]int32, long, int, double{le|be}) 32 bit signed or unsigned value in big or little endian order
- [Floats](#float) (float{le|be}) 32 bit decimal value in big or little endian
- [Quadwords](#quadword) ([u]int64, quad, bigint{le|be}) 64 bit signed or unsigned in big or little endian
- [Double Floats](#double-float) (doublefloat, dfloat{le|be}) 64 bit decimal value in big or little endian
- [Strings](#strings) (string) Fixed and non-fixed length, UTF, pascal, wide pascal. Includes all ```TextEncoder``` types

## Installation

```npm install bireader```

Provides both CommonJS and ES modules.

### Example

Import the reader or writer. Create a new parser with the data and start parsing.

Includes presents for quick parsing or programmable functions (examples below).

```javascript
import {bireader, biwriter} from 'bireader';

//read example - parse a webp file
function parse_webp(data){
  const br = new bireader(data)
  br.hexdump({supressUnicode:true}) //console.log data as hex

  //         0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  0123456789ABCDEF
  // 00000  52 49 46 46 98 3a 00 00 57 45 42 50 56 50 38 58  RIFF.:..WEBPVP8X
  // 00010  0a 00 00 00 10 00 00 00 ff 00 00 ff 00 00 41 4c  ..............AL
  // 00020  50 48 26 10 00 00 01 19 45 6d 1b 49 4a 3b cf 0c  PH&.....Em.IJ;..
  // 00030  7f c0 7b 60 88 e8 ff 04 80 a2 82 65 56 d2 d2 86  ..{`.......eV...
  // 00040  24 54 61 d0 83 8f 7f 0e 82 b6 6d e3 f0 a7 bd ed  $Ta.......m.....
  // 00050  87 10 11 13 40 3b 86 8f 26 4b d6 2a b7 6d 24 39  ....@;..&K.*.m$9
  // 00060  52 4f fe 39 7f 3b 62 4e cc ec 9b 17 31 01 0c 24  RO.9.;bN....1..$
  // 00070  49 89 23 e0 01 ab 52 64 e3 23 fc 61 db 76 cc 91  I.#...Rd.#.a.v..
  // 00080  b6 7d fb 51 48 c5 69 db 4c 1b 63 db b6 ed b9 6d  .}.QH.i.L.c....m
  // 00090  db be 87 8d b1 6d db 9e b6 cd a4 d3 ee 24 95 54  .....m.......$.T
  // 000a0  52 b8 8e 65 a9 eb 38 ce ab 52 75 9d 67 ff 75 2f  R..e..8..Ru.g.u/
  // 000b0  77 44 40 94 6d 25 6c 74 91 a8 88 86 58 9b da 6e  wD@.m%lt....X..n

  const header = {}
  header.magic = br.string({length:4})    //RIFF
  header.size = br.uint32le()             //15000
  header.fileSize = header.size + 8       //15008
  header.payload = br.string({length:4})  //WEBP
  header.format = br.string({length:4})   //VP8X
  header.formatChunkSize = br.uint32le()  //10
  switch (header.format){
    case "VP8 ":
        header.formatType = "Lossy"
        var read_size = 0
        header.frame_tag = br.ubit24()
        read_size += 3;
        header.key_frame = header.frame_tag & 0x1;
        header.version = (header.frame_tag >> 1) & 0x7;
        header.show_frame = (header.frame_tag >> 4) & 0x1;
        header.first_part_size = (header.frame_tag >> 5) & 0x7FFFF;
        header.start_code = br.ubit24() //should be 2752925
        header.horizontal_size_code = br.ubit16();
        header.width = header.horizontal_size_code & 0x3FFF;
        header.horizontal_scale = header.horizontal_size_code >> 14;
        header.vertical_size_code = br.ubit16();
        header.height = header.vertical_size_code & 0x3FFF;
        header.vertical_scale = header.vertical_size_code >> 14;
        read_size += 7;
        header.VP8data = br.extract(header.formatChunkSize - read_size, true)
        break;
    case "VP8L":
        header.formatType = "Lossless"
        var read_size = 0
        header.signature = br.ubyte() //should be 47
        read_size += 1;
        header.readWidth =  br.ubit14()
        header.width = header.readWidth+1;
        header.readHeight =  br.ubit14()
        header.height = header.readHeight+1;
        header.alpha_is_used =  br.bit1() 
        header.version_number =  br.ubit3() 
        read_size += 4;
        header.VP8Ldata = br.extract(header.formatChunkSize - read_size, true)
        break;
    case "VP8X":
        header.formatType = "Extended"
        br.big() //switch to Big Endian bit read
        header.rsv = br.bit2()  //Reserved
        header.I = br.bit1()    //ICC profile
        header.L = br.bit1()    //Alpha
        header.E = br.bit1()    //Exif
        header.X = br.bit1()    //XMP
        header.A = br.bit1()    //Animation
        header.R = br.bit1()    //Reserved
        br.little() //return to little
        header.rsv2 = br.ubit24()
        header.widthMinus1 = br.ubit24()
        header.width = header.widthMinus1 + 1
        header.heightMinus1 = br.ubit24()
        header.height = header.heightMinus1 + 1
        if(header.I)
        {
          header.ICCP = br.string({length:4})  // Should be ICCP
          header.ICCPChunkSize = br.uint32()
          header.ICCPData = br.extract(header.ICCPChunkSize, true)
        }
        if(header.L)
        {
          header.ALPH = br.string({length:4})  // Should be ALPH
          header.ALPHChunkSize = br.uint32() //4134
          header.ALPHData = br.extract(header.ALPHChunkSize, true)
        }
        if(header.A)
        {
          header.ANI = br.string({length:4})  // Should be ANIM or ANIF
          header.ANIChunkSize = br.uint32()
          if(header.ANI == "ANIM")
          {
            header.BGColor = br.uint32()
            header.loopCount = br.ushort()
            header.ANIMData = br.extract(header.ANIChunkSize, true)
          } else
          if (header.ANI == "ANIF")
          {
            header.FrameX = br.ubit24()
            header.FrameY = br.ubit24()
            header.readFrameWidth = br.ubit24()
            header.readFrameHeight = br.ubit24()
            header.frameWidth = readFrameWidth + 1
            header.frameHeight = readFrameHeight + 1
            header.duration = br.ubit24()
            header.rsv3 = br.ubit6()
            header.byte.B = br.bit1() //Blending
            header.byte.D = br.bit1() //Disposal
            header.frameData = br.extract(16, true)
            header.ANIFData = br.extract(header.ANIChunkSize, true)
          }
        }
        header.extFormatStr = br.string({length:4})
        header.extChunkSize = br.uint32()
        header.extData = br.extract(header.extChunkSize, true)
        if(header.E)
        {
          header.EXIF = br.string({length:4})  // Should be EXIF
          header.EXIFChunkSize = br.uint32()
          header.EXIFData = br.extract(header.EXIFChunkSize, true)
        }
        if(header.X)
        {
          header.XMP = br.string({length:4})  // Should be XMP
          header.XMPChunkSize = br.uint32()
          header.XMPMetaData = br.extract(header.XMPChunkSize, true)
        }
        break;
    default:
        header.data = br.extract(header.formatChunkSize, true)
        break;
  }
  br.finished()
  return header
}

//write example - write a webp file from read data
function write_webp(data){
  const bw = new biwriter(new Uint8Arry(1)) //extends array as we write by default
  bw.string("RIFF",{length:4})
  bw.uint32le(0) //dummy for now, will be final size - 8
  bw.string("WEBP",{length:4})
  switch(data.format){
    case "VP8 ":
      bw.string("VP8 ",{length:4})
      bw.uint32le(data.VP8data.length)
      bw.ubit24(data.key_frame)
      bw.ubit24(data.start_code)
      bw.ubit16(data.horizontal_size_code)
      bw.ubit16(data.vertical_size_code)
      bw.overwrite(data.VP8data ,true)
      break;
    case "VP8L":
      bw.string("VP8L",{length:4})
      bw.uint32le(data.VP8Ldata.length - 4)
      bw.ubyte(47)
      bw.ubit14(data.width - 1)
      bw.ubit14(data.heigth - 1)
      bw.ubit1(data.alpha_is_used)
      bw.bit3(data.version_number)
      bw.overwrite(data.VP8Ldata,true)
      break;
    case "VP8X":
      bw.string("VP8X",{length:4})
      bw.uint32le(10)
      bw.big()
      bw.bit2(0)
      bw.bit1(data.I)
      bw.bit1(data.L)
      bw.bit1(data.E)
      bw.bit1(data.X)
      bw.bit1(data.A)
      bw.bit1(0)
      bw.little()
      bw.ubit24(data.rsv2)
      bw.ubit24(data.width - 1)
      bw.ubit24(data.height - 1)
      if(data.I)
      {
        bw.string(data.ICCP, {length:4})
        bw.uint32(data.ICCPData.length)
        bw.replace(data.ICCPData, true)
      }
      if(data.L)
      {
        bw.string(data.ALPH, {length:4})
        bw.uint32(data.ALPHData.length) 
        bw.replace(data.ALPHData)
      }
      if(data.A)
      {
        bw.string(data.ANI, {length:4})
        bw.uint32(data.ANIChunkSize)
        if(data.ANI == "ANIM")
        {
          bw.uint32(data.BGColor)
          bw.ushort(data.loopCount)
          bw.replace(data.ANIMData)
        } else
        if (data.ANI == "ANIF")
        {
          bw.ubit24(data.FrameX)
          bw.ubit24(data.FrameY)
          bw.ubit24(data.frameWidth - 1)
          bw.ubit24(data.frameHeigh - 1)
          bw.ubit24(data.duration)
          bw.ubit6(data.rsv3)
          bw.bit1(data.byte.B)
          bw.bit1(data.byte.D) 
          bw.replace(data.frameData, true)
          bw.replace(data.ANIFData, true)
        }
      }
      bw.string(data.extFormatStr, {length:4})
      bw.uint32(data.extData.length)
      bw.replace(data.extData, true)
      if(data.E)
      {
        bw.string(data.EXIF, {length:4})
        bw.uint32(data.EXIFData.length)
        bw.replace( data.EXIFData, true)
      }
      if(data.X)
      {
        bw.string(data.XMP, {length:4})
        bw.uint32(data.XMPMetaData.length)
        bw.replace(data.XMPMetaData, true)
      }
      break;
    default:
      break;
  }
  bw.trim() //remove any remaining bytes
  bw.goto(4)
  bw.uint32le(bw.size - 8) //write file size
  return bw.return()
}
```

## Common Functions

Common functions for setup, movement, manipulation and math shared by both.

<table>
<thead>
  <tr>
    <th align="center" colspan="2">Function</th>
    <th align="center">Params (bold requires)</th>
    <th align="left">Desc</th>
  </tr>
</thead>
<tbody>
  <tr>
  <th align="center" colspan="4"><i>Setup</i></th>
  <tr>
  <tr>
    <td>Name</td>
    <td>new bireader(<b>data</b>, byteOffset, bitOffset, endianess, strict)</td>
    <td align="center" rowspan="2"><b>Buffer or Uint8Array</b>, byte offset (default 0), bit offset (default 0), endian big or little (default little), strict mode true to restrict extending initially supplied data (default true for reader, false for writer)</td>
    <td rowspan="2">Start with new Constructor.<br><b>Note:</b> Data can always be found with .data</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>new biwriter(<b>data</b>, byteOffset, bitOffset, endianess, strict)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>endianness(<b>bigOrLittle</b>)</td>
    <td align="center" rowspan="2"><b>big</b> or <b>little</b> (default little)</td>
    <td rowspan="2">Set or change Endian. Can be changed at any time.</td>
  </tr>
  <tr>
    <td>Presets</td>
    <td>bigEndian(), big(), be()<br>littleEndian(), little(), le()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>getOffset()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Gets current byte position.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>tell(), saveOffset()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>getOffsetBit()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Gets current bit position (0-7).</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>tellB(), saveOffsetBit()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>getOffsetAbsBit()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Gets current absolute bit position from start of data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>tellAbsB(), saveOffsetAbsBit()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>get() </td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Returns supplied data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>return()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>hexdump({length, startByte, supressUnicode})</td>
    <td align="center">Length of dump in bytes (default 192), byte position to start the dump (default current byte position), supress unicode character preview for cleaner columns (default false)</td>
    <td >Console logs data. Will trigger on error unless turned off (see below)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>errorDumpOff()</td>
    <td align="center">None</td>
    <td >Does not hexdump on error (default true)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>errorDumpOn()</td>
    <td align="center">None</td>
    <td >Will hexdump on error (default true)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>unrestrict()</td>
    <td align="center">none</td>
    <td>Sets strict mode to false, will extend array if data is outside of max size (<b>default true for reader, false for writer</b>)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>restrict()</td>
    <td align="center">none</td>
    <td>Sets strict mode to true, won't extend array if data is outside of max size (<b>default true for reader, false for writer</b>)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>end()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Removes supplied data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>close(), done(), finished()</td>
  </tr>
  <th align="center" colspan="4"><i>Movement</i></th>
  <tr>
    <td>Name</td>
    <td>skip(<b>bytes</b>, bits)</td>
    <td align="center" rowspan="2"><b>Bytes to skip from current byte position</b>, bits to skip (default 0)</td>
    <td rowspan="2">Use negative to go back.<br><b>Note:</b> Remaining bits are dropped when returning to a byte function.</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>seek(<b>byte</b>, bit)<br>jump(<b>bytes</b>, bits)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>goto(<b>byte</b>, bit)</td>
    <td align="center" rowspan="2"><b>Byte offset from start</b>, bit offset from byte offset</td>
    <td rowspan="2"><b>Note:</b> Remaining bits are drop when returning to byte function.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>pointer(<b>byte</b>, bit)<br>warp(<b>byte</b>, bit)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>rewind()</td>
    <td align="center" rowspan="2">none</td>
    <td rowspan="2">Moves current byte position to start of data.</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>gotostart()</td>
  </tr>
  <th align="center" colspan="4"><i>Manipulation</i></th>
  <tr>
    <td>Name</td>
    <td>delete(startOffset, endOffset, consume)</td>
    <td align="center">Start byte of data (default 0), end byte of data (default current byte position), move byte position to after data read (default false)</td>
    <td >Removes and returns data. <br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Preset</td>
    <td>clip()<br>trim()</td>
    <td align="center">None</td>
    <td >Removes data after the current byte position and returns data. <br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>crop(<b>length</b>, consume)</td>
    <td align="center" rowspan="2"><b>Number of bytes to read and remove from current byte position</b>, move byte position to after data read (default false)</td>
    <td rowspan="2">Removes and returns data from current byte position for length of data</b>.<br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>drop(<b>length</b>, consume)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>replace(<b>data</b>, consume, offset)</td>
    <td align="center" rowspan="2"><b>Data to replace in supplied data</b>, move byte position to after data read (default false), byte position to start replace (default current byte position)</td>
    <td rowspan="2">Replaces data at current byte or supplied offset.<br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>overwrite(<b>data</b>, consume, offset)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>lift(startByte, endByte, consume, fillValue)</td>
    <td align="center" rowspan="2">Start of byte read (default current byte position), end of byte read (default end of data), move current byte position to end of byte read (default false), value to fill bytes (will <b>NOT</b> fill on default)</td>
    <td rowspan="2">Returns data from supplied byte positions. <br><b>Note:</b> Only moves current byte position if consume is true. Only fills data if value is supplied</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>fill(startByte, endByte, consume, fillValue)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>extract(<b>length</b>, consume)</td>
    <td align="center" rowspan="2"><b>Number of bytes to read</b>, move byte position to after data read (default false)</td>
    <td rowspan="2">Returns data from current byte position for length of data</b>.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>slice(<b>length</b>, consume)<br>wrap(<b>length</b>, consume)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>insert(<b>data</b>, consume, offset)</td>
    <td align="center" rowspan="2"><b>New data to insert</b>, move byte position to after data read (default false), byte position to insert (default current byte position)</td>
    <td rowspan="2">Inserts new data into supplied data. <b>Note:</b> Data type must match supplied data. Errors on strict mode</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>place(<b>data</b>, consume, offset)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>unshift(<b>data</b>, consume)</td>
    <td align="center" rowspan="2"><b>New data to insert</b>, move byte position to after data read (default false)</td>
    <td rowspan="2">Adds new data to start of supplied data<br><b>Note:</b> Data type must match supplied data. Errors on strict mode</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>prepend(<b>data</b>, consume)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>push(<b>length</b>, consume)</td>
    <td align="center" rowspan="2"><b>Number</b>, move byte position to after data read (default false)</td>
    <td rowspan="2">Adds new data to end of supplied data<br><b>Note:</b> Data type must match supplied data. Errors on strict mode</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>append(<b>data</b>, consume)</td>
  </tr>
  <th align="center" colspan="4"><i>Math</i></th>
  <tr>
    <td>Name</td>
    <td>xor(<b>xorKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, Uint8Array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >XOR data. <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>xorThis(<b>xorKey</b>, length, consume)
    <td align="center"><b>Byte value, string, Uint8Array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>XOR data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>or(<b>orKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, Uint8Array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >OR data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>orThis(<b>orKey</b>, length, consume)
    <td align="center"><b>Byte value, string, Uint8Array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>OR data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>and(<b>andKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >AND data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>andThis(<b>andKey</b>, length, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>AND data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>add(<b>addKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >Add value to data (per byte). <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>addThis(<b>addKey</b>, length, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>Add value to data (per byte)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>not(startOffset, endOffset, consume)
    <td align="center">Byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >NOT data (per byte)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>notThis(length, consume)
    <td align="center">Length of bytes starting at current byte position (default 1), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>NOT data (per byte)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>lShift(<b>shiftKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >Left shift data (per byte). <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>lShiftThis(<b>shiftKey</b>, length, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>Left shift data (per byte)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>rShift(<b>shiftKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >Right shift data (per byte). <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>rShiftThis(<b>shiftKey</b>, length, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>Right shift data (per byte)</td>
  </tr>
</tbody>
</table>

## Bit field

Parse value as a bit field. There are 32 functions from bit1 to bit32 and can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

**Note:** Remaining bits are dropped when returning to a byte read. Example, after using ``bit4()`` then ``ubyte()``, the read locations drops the remaining 4 bits after ``bit4()`` when reading ``ubyte()``. Any bit reading under 8 will always be unsigned.

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
    <td>writeBit(<b>value, bits</b>, unsigned, endian)</td>
    <td><b>value to write, number of bits</b>, if the value is written unsigned, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]bit{1-32}{le|be}(*unsigned)</td>
    <td>If value is signed or not.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]bit{1-32}{le|be}(<b>value</b>, *unsigned)</td>
    <td><b>value to write</b>, if value is unsigned or not.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>fourth</i> augment</td>
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
    <td>[u]{byte|int8}(<b>value</b>, *unsigned)</td>
    <td><b>value to write</b>, if value is signed or not.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>third</i> augment</td>
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
    <td>writeInt16(<b>value</b>, unsigned, endian)</td>
    <td><b>value to write</b>, if the value is written unsigned, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]{int16|word|short}{be|le}(*unsigned, *endian)</td>
    <td>If value is unsigned, big or little endian.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>second</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int16|word|short}{be|le}(<b>value</b>, *unsigned, *endian)</td>
    <td><b>value to write</b>, if value is unsigned, big or little endian.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>third</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>fourth</i> augment (does not overwite set endian).</td>
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
    <td>writeHalfFloat(<b>value</b>, endian)</td>
    <td><b>value to write</b>, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>{halffloat|half}{be|le}(*endian)</td>
    <td>Big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>first</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>{halffloat|half}{be|le}(<b>value</b>, *endian)</td>
    <td><b>value to write</b>, big or little endian.<br>*Note: and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>second</i> augment (does not overwite set endian).</td>
  </tr>
</tbody>
</table>

## Integer

Parse value as a int32 (aka int, long or  double). Can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

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
    <td>writeInt32(<b>value</b>, unsigned, endian)</td>
    <td><b>value to write</b>, if the value is written unsigned, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]{int32|long|int|double}{be|le}(*unsigned, *endian)</td>
    <td>If value is unsigned, little or big endian.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>second</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int32|long|int|double}{be|le}(<b>value</b>,  *unsigned, *endian)</td>
    <td><b>value to write</b>, if value is unsigned, little or big endian<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>third</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>fourth</i> augment (does not overwite set endian).</td>
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
    <td>writeInt64(<b>value</b>, endian)</td>
    <td><b>value to write</b>, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>float{be|le}(*endian)</td>
    <td>Big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>first</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>float{be|le}(<b>value</b>,  *endian)</td>
    <td><b>value to write</b>, big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>third</i> augment (does not overwite set endian).</td>
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
    <td>writeInt64(<b>value</b>, unsigned, endian)</td>
    <td><b>value to write</b>, if the value is written unsigned, big or little endian<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>[u]{int64|quad|bigint}{be|le}(*unsigned, *endian)</td>
    <td>If value is unsigned, if value is unsigned, big or little endian.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>first</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>second</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int64|quad|bigint}{be|le}(<b>value</b>, *unsigned, *endian)</td>
    <td><b>value to write</b>, if value is unsigned, big or little endian.<br>*Note: functions without the starting letter <u>u</u> can still be called unsigned when <b>true</b> is the <i>third</i> augment, and functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>fourth</i> augment (does not overwite set endian).</td>
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
    <td>writeDoubleFloat(<b>value</b>, endian)</td>
    <td><b>value to write</b>, big or little endian.<br>Note: Will throw error if value is outside of size of data</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (reader)</b></td>
    <td>{doublefloat|dfloat}{be|le}(*endian)</td>
    <td>Big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>first</i> augment (does not overwite set endian).</td>
  </tr>
  <tr>
   <td align="center"><b>Presets (writer)</b></td>
    <td>{doublefloat|dfloat}{be|le}(<b>value</b>, *endian)</td>
    <td><b>Value to write</b>, big or little endian.<br>*Note: functions without ending letters <u>be</u> or <u>le</u> can still be called the endian in the <i>third</i> augment (does not overwite set endian).</td>
  </tr>
</tbody>
</table>

## Strings

Parse a string in any format. Be sure to use options object for formatting unless using a preset. Strings with larger than 1 byte character reads can use ``be`` or ``le`` at the end for little or big endian.

Presents include C or Unicode, Ansi and multiple pascals.


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
    {c|utf8}string(length, terminateValue, stripNull)<br><br>
    ansistring(length, terminateValue, stripNull)<br><br>
    {utf16|uni}string(length, terminateValue, stripNull, *endian)<br><br>
    pstring(lengthReadSize, stripNull, *endian)<br><br>
    pstring{1|2|4}{be|le}(stripNull, *endian)<br><br>
    wpstring{be|le}(lengthReadSize, stripNull, *endian)<br><br>
    wpstring{1|2|4}{be|le}(stripNull, *endian)
    </td>
    <td>Based on above.<br><b>Note:</b> Presets use augments not a single object. Endian only needed when not part of function name. Does not override set endian.</td>
  </tr>
  <tr>
  <td align="center"><b>Presets (writer)</b></td>
    <td>
    {c|utf8}string(<b>string</b>, length, terminateValue)<br><br>
    ansistring(<b>string</b>, length, terminateValue)<br><br>
    {utf16|uni}string{be|le}(<b>string</b>,length, terminateValue, *endian)<br><br>
    pstring(<b>string</b>, lengthWriteSize, *endian)<br><br>
    pstring{1|2|4}{be|le}(<b>string</b>, *endian)<br><br>
    wpstring{be|le}(<b>string</b>, lengthWriteSize, *endian)<br><br>
    wpstring{1|2|4}{be|le}(<b>string</b>, *endian)
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