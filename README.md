# BiReader / BiWriter

A feature rich binary reader ***and writer*** that keeps track of your position to quickly create file structures. Includes shared naming conventions, programmable inputs and advanced math for easy data conversions on low level parsing. Accepts `Uint8Array`, `Buffer` or a ``filePath`` with [Streams](#bistreams).

Supported data types:

- [Bitfields](#bit-field) ([u]bit{1-32}{le|be}) 1-32 bit signed or unsigned value in big or little endian order
- [Bytes](#byte) ([u]int8, byte) 8 bit signed or unsigned value
- [Shorts](#short) ([u]int16, word, short{le|be}) 16 bit signed or unsigned value in big or little endian order
- [Half Floats](#half-float) (halffloat, half{le|be}) 16 bit decimal value in big or little endian order
- [Integers](#integer) ([u]int32, long, int, double{le|be}) 32 bit signed or unsigned value in big or little endian order
- [Floats](#float) (float{le|be}) 32 bit decimal value in big or little endian
- [Quadwords](#quadword) ([u]int64, quad, bigint{le|be}) 64 bit signed or unsigned in big or little endian
- [Double Floats](#double-float) (doublefloat, dfloat{le|be}) 64 bit decimal value in big or little endian
- [Strings](#strings) (string) Fixed and non-fixed length, UTF, pascal, wide pascal. Includes all ```TextEncoder``` types

## What's New?

### v3
 * Added Browser, Node CommonJS and Node ESM modules.
 * Added new ``BiReaderStream`` and ``BiWriterStream`` (Node only) that works without loading the whole file into memory. See [documention](#bistreams) for how to use.
 * Added ``.deleteFile()`` and ``.renameFile(filePath)``.
 * Added setter ``.strSettings`` for use with ``.str`` for easier coding.
 * Added better options for extending array buffer when writing data with ``extendBufferSize``.
 * Consolidated all options argument into single object when creating class.
 * Removed deprecated ``bireader`` and ``biwriter`` classes.
 * Fixed standalone ``hexdump`` function. 

### v2
 * Created new ``BiReader`` and ``BiWriter`` classes with *get* and *set* functions for easier coding.
 * Marked ``bireader`` and ``biwriter`` as deprecated. Set to be removed next update.

### v1
 * Included math functions and value searches.
 * Many bug fixes.

## Installation

```npm install bireader```

Provides both CommonJS and ES modules for Node and Browser.

### Example

Import the reader or writer. Create a new parser with the data and start parsing.

Includes presents for quick parsing or programmable functions (examples below).

```javascript
import {BiReader, BiWriter} from 'bireader';

// read example - parse a webp file
function parse_webp(data){
  const br = new BiReader(data);
  br.strSettings = {length: 4};
  br.hexdump({supressUnicode:true}); // console.log data as hex

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

  const header = {};
  header.magic = br.str;    // RIFF
  header.size = br.uint32le;               // 15000
  header.fileSize = header.size + 8;       // 15008
  header.payload = br.str;  // WEBP
  header.format = br.str;   // VP8X
  header.formatChunkSize = br.uint32le;    // 10
  switch (header.format){
    case "VP8 ":
        header.formatType = "Lossy";
        var read_size = 0;
        header.frame_tag = br.ubit24;
        read_size += 3;
        header.key_frame = header.frame_tag & 0x1;
        header.version = (header.frame_tag >> 1) & 0x7;
        header.show_frame = (header.frame_tag >> 4) & 0x1;
        header.first_part_size = (header.frame_tag >> 5) & 0x7FFFF;
        header.start_code = br.ubit24; // should be 2752925
        header.horizontal_size_code = br.ubit16;
        header.width = header.horizontal_size_code & 0x3FFF;
        header.horizontal_scale = header.horizontal_size_code >> 14;
        header.vertical_size_code = br.ubit16;
        header.height = header.vertical_size_code & 0x3FFF;
        header.vertical_scale = header.vertical_size_code >> 14;
        read_size += 7;
        header.VP8data = br.extract(header.formatChunkSize - read_size, true);
        break;
    case "VP8L":
        header.formatType = "Lossless";
        var read_size = 0;
        header.signature = br.ubyte; // should be 47
        read_size += 1;
        header.readWidth =  br.ubit14;
        header.width = header.readWidth+1;
        header.readHeight =  br.ubit14;
        header.height = header.readHeight+1;
        header.alpha_is_used =  br.bit1;
        header.version_number =  br.ubit3;
        read_size += 4;
        header.VP8Ldata = br.extract(header.formatChunkSize - read_size, true);
        break;
    case "VP8X":
        header.formatType = "Extended";
        br.big();              // switch to Big Endian bit read
        header.rsv = br.bit2;  // Reserved
        header.I = br.bit1;    // ICC profile
        header.L = br.bit1;    // Alpha
        header.E = br.bit1;    // Exif
        header.X = br.bit1;    // XMP
        header.A = br.bit1;    // Animation
        header.R = br.bit1;    // Reserved
        br.little();           // return to little
        header.rsv2 = br.ubit24;
        header.widthMinus1 = br.ubit24;
        header.width = header.widthMinus1 + 1
        header.heightMinus1 = br.ubit24;
        header.height = header.heightMinus1 + 1
        if(header.I)
        {
          header.ICCP = br.str;  // Should be ICCP
          header.ICCPChunkSize = br.uint32;
          header.ICCPData = br.extract(header.ICCPChunkSize, true);
        }
        if(header.L)
        {
          header.ALPH = br.str;  // Should be ALPH
          header.ALPHChunkSize = br.uint32;     // 4134
          header.ALPHData = br.extract(header.ALPHChunkSize, true);
        }
        if(header.A)
        {
          header.ANI = br.str;  // Should be ANIM or ANIF
          header.ANIChunkSize = br.uint32;
          if(header.ANI == "ANIM")
          {
            header.BGColor = br.uint32;
            header.loopCount = br.ushort;
            header.ANIMData = br.extract(header.ANIChunkSize, true);
          } else
          if (header.ANI == "ANIF")
          {
            header.FrameX = br.ubit24;
            header.FrameY = br.ubit24;
            header.readFrameWidth = br.ubit24;
            header.readFrameHeight = br.ubit24;
            header.frameWidth = readFrameWidth + 1;
            header.frameHeight = readFrameHeight + 1;
            header.duration = br.ubit24;
            header.rsv3 = br.ubit6;
            header.byte.B = br.bit1; // Blending
            header.byte.D = br.bit1; // Disposal
            header.frameData = br.extract(16, true);
            header.ANIFData = br.extract(header.ANIChunkSize, true);
          }
        }
        header.extFormatStr = br.str;
        header.extChunkSize = br.uint32;
        header.extData = br.extract(header.extChunkSize, true);
        if(header.E)
        {
          header.EXIF = br.str;  // Should be EXIF
          header.EXIFChunkSize = br.uint32;
          header.EXIFData = br.extract(header.EXIFChunkSize, true);
        }
        if(header.X)
        {
          header.XMP = br.str;  // Should be XMP
          header.XMPChunkSize = br.uint32;
          header.XMPMetaData = br.extract(header.XMPChunkSize, true);
        }
        break;
    default:
        header.data = br.extract(header.formatChunkSize, true);
        break;
  }
  br.finished();
  return header;
}

// write example - write a webp file from read data
function write_webp(data){
  const bw = new BiWriter(new Uint8Arry(0x100000)); // Will extends array as we 
  // write if needed by default
  bw.strSettings = {length: 4};
  bw.str = "RIFF";
  bw.uint32le = 0; // dummy for now, will be final size - 8
  bw.str = "WEBP";
  switch(data.format){
    case "VP8 ":
      bw.str = "VP8 ";
      bw.uint32le = data.VP8data.length;
      bw.ubit24 = data.key_frame;
      bw.ubit24 = data.start_code;
      bw.ubit16 = data.horizontal_size_code;
      bw.ubit16 = data.vertical_size_code;
      bw.overwrite(data.VP8data ,true);
      break;
    case "VP8L":
      bw.str = "VP8L";
      bw.uint32le = data.VP8Ldata.length - 4;
      bw.ubyte = 47;
      bw.ubit14 = data.width - 1;
      bw.ubit14 = data.heigth - 1;
      bw.ubit1 = data.alpha_is_used;
      bw.bit3 = data.version_number;
      bw.overwrite(data.VP8Ldata,true);
      break;
    case "VP8X":
      bw.str = "VP8X";
      bw.uint32le = 10;
      bw.big();
      bw.bit2 = 0;
      bw.bit1 = data.I;
      bw.bit1 = data.L;
      bw.bit1 = data.E;
      bw.bit1 = data.X;
      bw.bit1 = data.A;
      bw.bit1 = 0;
      bw.little();
      bw.ubit24 = data.rsv2;
      bw.ubit24 = data.width - 1;
      bw.ubit24 = data.height - 1;
      if(data.I)
      {
        bw.str = data.ICCP;
        bw.uint32 = data.ICCPData.length;;
        bw.replace(data.ICCPData, true);
      }
      if(data.L)
      {
        bw.str = data.ALPH;
        bw.uint32 = data.ALPHData.length;
        bw.replace(data.ALPHData);
      }
      if(data.A)
      {
        bw.str = data.ANI;
        bw.uint32 = data.ANIChunkSize;
        if(data.ANI == "ANIM")
        {
          bw.uint32 = data.BGColor;
          bw.ushort = data.loopCount;
          bw.replace(data.ANIMData);
        } else
        if (data.ANI == "ANIF")
        {
          bw.ubit24 = data.FrameX;
          bw.ubit24 = data.FrameY;
          bw.ubit24 = data.frameWidth - 1;
          bw.ubit24 = data.frameHeigh - 1;
          bw.ubit24 = data.duration;
          bw.ubit6  data.rsv3;
          bw.bit1 = data.byte.B;
          bw.bit1 = data.byte.D;
          bw.replace(data.frameData, true);
          bw.replace(data.ANIFData, true);
        }
      }
      bw.str = data.extFormatStr;
      bw.uint32 = data.extData.length;
      bw.replace(data.extData, true);
      if(data.E)
      {
        bw.str = data.EXIF;
        bw.uint32 = data.EXIFData.length;
        bw.replace( data.EXIFData, true);
      }
      if(data.X)
      {
        bw.str = data.XMP;
        bw.uint32 = data.XMPMetaData.length;
        bw.replace(data.XMPMetaData, true);
      }
      break;
    default:
      break;
  }
  bw.trim(); // remove any remaining bytes
  bw.goto(4);
  bw.uint32le = bw.size - 8; // write file size
  return bw.return();
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
    <td>new BiReader(<b>data</b>, {byteOffset, bitOffset, endianess, strict, extendBufferSize})</td>
    <td align="center" rowspan="2"><b>Buffer or Uint8Array</b>, byte offset (default 0), bit offset (default 0), endian big or little (default little), strict mode true to restrict extending initially supplied data (default true for reader, false for writer), extended Buffer size amount.
    </td>
    <td rowspan="2">Start with new Constructor.<br><br><b>Note:</b> Supplied data can always be found with <b>.data</b>.<br><br><b>Writing data note:</b> while BiWriter can be created with a 0 length Uint8Array or Buffer, each new value write will create a new array and concat the two. For large data writes this will lead to a degraded performance. It's best to supply a larger than needed buffer when creating the Writer and use <b>.trim()</b> after you're finished. You can also set the <b>extendBufferSize</b> value to always extend by a fixed amount when reaching the end. This will also change the logic for <b>.return</b> and <b>.get</b> to trim the remining data from the current position for you. Use <b>.data</b> instead if you want to get the whole padded buffer array.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>new BiWriter(data, {byteOffset, bitOffset, endianess, strict, extendBufferSize})</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>endianness(<b>"big" | "little"</b>)</td>
    <td align="center" rowspan="2"><b>big</b> or <b>little</b> (default little)</td>
    <td rowspan="2">Set or change Endian. Can be changed at any time.</td>
  </tr>
  <tr>
    <td>Presets</td>
    <td>bigEndian(), big(), be()<br>littleEndian(), little(), le()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>length</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets the current buffer size in bytes.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>len, size, FileSize</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>lengthB</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets the current buffer size in bits.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>lenb, sizeB, FileSizeB</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>getOffset</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets current byte position.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>off, FTell, tell, saveOffset</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>getOffsetBit</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets current byte's bit position (0-7).</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>offb, FTellB, tellB, saveOffsetBit</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>getOffsetAbsBit</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets current absolute bit position from start of data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>offab, tellAbsB, saveOffsetAbsBit</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>remain</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Size in bytes of current read position to the end.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>FEoF</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>remainB</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Size in bits of current read position to the end.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>FEoFB</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>getLine</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Row line of the file (16 bytes per row).</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>row</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>get</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Returns supplied data. <b>Note:</b> Will use .trim() command if extendBufferSize is set (removes all data after current position). Use .data if you want the full padded data buffer.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>return</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>data</td>
    <td align="center">None</td>
    <td >Returns full current buffer data.</td>
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
    <td align="center">None</td>
    <td>Sets strict mode to false, will extend array if data is outside of max size (<b>default true for reader, false for writer</b>)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>restrict()</td>
    <td align="center">None</td>
    <td>Sets strict mode to true, won't extend array if data is outside of max size (<b>default true for reader, false for writer</b>)</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>end()</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Removes supplied data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>close(), done(), finished()</td>
  </tr>
  <th align="center" colspan="4"><i>Search</i></th>
  <tr>
    <td>Name</td>
    <td>findString(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for byte position of string from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>findByte(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for byte value (can be signed or unsigned) position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>findShort(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for short value (can be signed or unsigned) position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>findInt(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for integer value (can be signed or unsigned) position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>findInt64(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for 64 bit position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>findHalfFloat(<b>value</b>, endian)</td>
    <td align="center">Searches for half float value position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>findFloat(<b>value</b>, endian)</td>
    <td align="center">Searches for float value position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>findDoubleFloat(<b>value</b>, endian)</td>
    <td align="center">Searches for double float value position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <th align="center" colspan="4"><i>Movement</i></th>
  <tr>
    <td>Name</td>
    <td>align(<b>number</b>)</td>
    <td align="center">Aligns byte position to number.</td>
    <td ><b>Note:</b> Errors in strict mode when change is outside of data size.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>alignRev(<b>number</b>)</td>
    <td align="center">Reverse aligns byte position to number.</td>
    <td ><b>Note:</b> Errors in strict mode when change is outside of data size.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>skip(<b>bytes</b>, bits)</td>
    <td align="center" rowspan="2"><b>Bytes to skip from current byte position</b>, bits to skip (default 0)</td>
    <td rowspan="2">Use negative to go back.<br><b>Note:</b> Remaining bits are dropped when returning to a byte function.</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>FSeek(<b>byte</b>, bit)<br>seek(<b>byte</b>, bit)<br>jump(<b>bytes</b>, bits)</td>
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
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Moves current byte position to start of data.</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>gotoStart()</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>last()</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Moves current byte position to end of data.</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>gotoEnd(), EoF()</td>
  </tr>
  <th align="center" colspan="4"><i>Manipulation</i></th>
  <tr>
    <td>Name</td>
    <td>delete(startOffset, endOffset, consume)</td>
    <td align="center">Start byte of data (default 0), end byte of data (default current byte position), move byte position to after data read (default false)</td>
    <td >Removes and returns data. <br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>clip()</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Removes data after the current byte position and returns data. <br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>trim()</td>
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
    <td>writeBytes(values, unsigned), overwrite(<b>data</b>, consume, offset)</td>
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
    <td>readbytes(amount, unsigned), slice(<b>length</b>, consume)<br>wrap(<b>length</b>, consume)</td>
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

## BiStreams

With 3.1 you can now use ``BiReaderStream`` and ``BiWriterStream`` (Node only) designed for larger files (or if you don't want or need the whole file loaded to memory all at once).

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
  <th align="center" colspan="4"><i>Streaming</i></th>
  <tr>
  <tr>
    <td>Name</td>
    <td>new BiReaderStream(<b>filePath</b>, {byteOffset, bitOffset, endianess, strict, extendBufferSize})</td>
    <td align="center" rowspan="2"><b>Path to file</b>, byte offset (default 0), bit offset (default 0), endian big or little (default little), strict mode true to restrict extending file size (default true for reader, false for writer), extended file size amount.
    </td>
    <td rowspan="2">Start with new Constructor.<br><br><b>Note:</b> The file must be opened with <b>.open()</b> and closed with <b>.close()</b>. The <b>.data</b> value is always the Buffer to the last read or write value. Read sizes outside of Node's max size will error, unless remove then it will create a new file.<br><br><b>Writer note:</b> You can set the <b>extendBufferSize</b> value to always extend the file by this minimum amount when reaching the end of the file. The file is saved after every write.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>new BiWriterStream(<b>filePath</b>, {byteOffset, bitOffset, endianess, strict, extendBufferSize})</td>
  </tr>
  <th align="center" colspan="4"><i>File Control</i></th>
  <tr>
    <td>Name</td>
    <td>open()
    <td align="center"><b>none</td>
    <td>Opens file for reading / writing.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>close()
    <td align="center"><b>none</td>
    <td>Closes file after reading / writing.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>writeMode(writable)
    <td align="center"><b>True if you want to switch to writing in BiReaderStream.</td>
    <td>Note: This changes reader to write mode. Allows file to be expanded in size as well.</td>
  </tr>
  <tr>
    <td>Name</td>
    <td>renameFile(<b>newFilePath</b>)
    <td align="center"><b>Full path to file to rename.</td>
    <td>Renames the file on the file system, keeps read / write position.<br/><br/><b>Note: This is permanent.</b></td>
  </tr>
  <tr>
    <td>Name</td>
    <td>deleteFile()
    <td align="center"><b>none</td>
    <td>Unlinks the file from the file system.<br/><br/><b>Note: This is permanent, it doesn't send the file to the recycling bin for recovery.</b></td>
  </tr>
</tbody>
</table>

### Streaming Caveats

 * Naming: Same function naming applies to streamers as [Common Functions](#common-functions) section but the file is saved after every operation. **BiReaderStream / BiReader** and **BiWriterStream / BiWriter** are interchangeable when it comes to all functions and class objects names for easy use with type script.
 * Writing: Unlike the other BiReader, **all write functions will throw an error unless you switch to ``.writeMode(true)``** The file is read only until you do. Any write functions inside the reader will error beforehand.
 * Large removal: When using any function that removes data from the file and would return a Buffer, **if the size of the returned Buffer is outside of the Node max size for a Buffer, a new file will be made with the location and size concat to the name with a .removed file extention instead.**

## Bit field

Parse value as a bit field. There are 32 functions from bit1 to bit32 and can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

**Note:** Remaining bits are dropped when returning to a byte read. Example, after using ``bit4`` then ``ubyte``, the read locations drops the remaining 4 bits after ``bit4`` when reading ``ubyte``. Any bit reading under 8 will always be unsigned.

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Properties</th>
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
    <td>[u]bit{1-32}{le|be}</td>
    <td>*Note: in BiReader these are get, not functions.</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]bit{1-32}{le|be} = <b>value</b></td>
    <td>*Note: in BiWriter these are set, not functions.</td>
  </tr>
</tbody>
</table>

## Byte

Parse value as a byte (aka int8). Can be signed or unsigned (with a ``u`` at the start).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Properties</th>
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
    <td>[u]{byte|int8}</td>
    <td>*Note: in BiReader these are get, not functions.</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{byte|int8} = <b>value</b></td>
    <td>*Note: in BiWriter these are set, not functions.</td>
  </tr>
</tbody>
</table>

## Short

Parse value as a int16 (aka short or word). Can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Properties</th>
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
    <td>[u]{int16|word|short}{be|le}</td>
    <td>*Note: in BiReader these are get, not functions.</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int16|word|short}{be|le} = <b>value</b></td>
    <td>*Note: in BiWriter these are set, not functions.</td>
  </tr>
</tbody>
</table>

## Half Float

Parse value as a half float (aka half). Can be in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Properties</th>
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
    <td>{halffloat|half}{be|le}</td>
    <td>*Note: in BiReader these are get, not functions.</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>{halffloat|half}{be|le} = <b>value</b></td>
    <td>*Note: in BiWriter these are set, not functions.</td>
  </tr>
</tbody>
</table>

## Integer

Parse value as a int32 (aka int, long or  double). Can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Properties</th>
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
    <td>[u]{int32|long|int|double}{be|le}</td>
    <td>*Note: in BiReader these are get, not functions.</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int32|long|int|double}{be|le} = <b>value</b></td>
    <td>*Note: in BiWriter these are set, not functions.</td>
  </tr>
</tbody>
</table>

## Float

Parse value as a float. Can be in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Properties</th>
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
    <td>float{be|le}</td>
    <td>*Note: in BiReader these are get, not functions.</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>float{be|le} = <b>value</b></td>
    <td>*Note: in BiWriter these are set, not functions.</td>
  </tr>
</tbody>
</table>

## Quadword

Parse value as a int64 (aka quad or bigint). Can be signed or unsigned (with a ``u`` at the start) and in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Properties</th>
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
    <td>[u]{int64|quad|bigint}{be|le}</td>
    <td>If value is unsigned, if value is unsigned, big or little endian.<br>*Note: in BiReader these are get, not functions.</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]{int64|quad|bigint}{be|le} = <b>value</b></td>
    <td><b>value to write</b>, if value is unsigned, big or little endian.<br>*Note: in BiWriter these are set, not functions.</td>
  </tr>
</tbody>
</table>

## Double Float

Parse value as a double float (aka dfloat). Can be in little or big endian order (``be`` or ``le`` at the end).

<table>
<thead>
  <tr>
    <th></th>
    <th align="center">Properties</th>
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
    <td>{doublefloat|dfloat}{be|le}</td>
    <td>*Note: in BiReader these are get, not functions.</td>
  </tr>
  <tr>
   <td align="center"><b>Presets (writer)</b></td>
    <td>{doublefloat|dfloat}{be|le} = <b>value</b></td>
    <td>*Note: in BiWriter these are set, not functions.</td>
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