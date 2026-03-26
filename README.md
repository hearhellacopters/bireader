# BiReader / BiWriter

**A fast, dual-mode (sync / async) file / buffer handler with byte + bit-level access.**

Feature rich binary reader ***and writer*** that keeps track of your position to quickly create file structures. Perfect for binary parsers, editors, game save files, custom formats, or any situation where you need random access + structural modifications without loading the entire file into memory. Includes shared naming conventions, programmable inputs and advanced math for easy data conversions on low level parsing. Accepts `Uint8Array`, `Buffer` or a `filePath`. Includes Sync and [Async](#async) verions.

---

## ✨ Features

- **Dual mode**: Sync or Async file reader (`r+` / `r`) on disk **or** pure in-memory `Buffer` or `Uint8Array`
- **Chunked async loading** – configurable `windowSize` (default 4 KiB)  
  → Set `windowSize: 0` to load the entire file in **one** async read
- **Byte cursor**: Track and change location with `offset` +Bit cursor `bitOffset`
- **Full bitfield support** – `readBit()` / `writeBit()` with:
  - signed / unsigned
  - big-endian (`'be'`) or little-endian (`'le'`)
  - any alignment (bits can start anywhere)
- **Structural edits**:
  - `insert()` – insert data anywhere
  - `remove()` – delete data and **return** the removed chunk
  - `trim()` – shrink (returns removed tail)
  - `push()` – Grows start
- **Expandable files** with smart `growthIncrement` (default 1 MiB) to minimize syscalls
- `return()` – flushes changes and returns the complete current content
- `readonly` and `strict` modes (for limiting `growthIncrement`)
- In `async` class, all operations automatically wait for required chunks
- Zero dependencies (only `fs` & `fs/promises` in Node)

---

## ✅ Supported data types

- [Bitfields](#bit-field) ([u]bit{1-32}{le|be}) 1-32 bit signed or unsigned value in big or little endian order
- [Bytes](#byte) ([u]int8, byte) 8 bit signed or unsigned value
- [Shorts](#short) ([u]int16, word, short{le|be}) 16 bit signed or unsigned value in big or little endian order
- [Half Floats](#half-float) (halffloat, half{le|be}) 16 bit decimal value in big or little endian order
- [Integers](#integer) ([u]int32, long, int, double{le|be}) 32 bit signed or unsigned value in big or little endian order
- [Floats](#float) (float{le|be}) 32 bit decimal value in big or little endian
- [Quadwords](#quadword) ([u]int64, quad, bigint{le|be}) 64 bit signed or unsigned in big or little endian
- [Double Floats](#double-float) (doublefloat, dfloat{le|be}) 64 bit decimal value in big or little endian
- [Strings](#strings) (string) Fixed and non-fixed length, UTF, pascal, wide pascal. Includes all `TextEncoder` types

## ⭐ What's New?

### v4
 * Added `BiReaderAsync` and `BiWriterAsync`. See [Async](#async) classes.
 * Uses `DataView` read and write functions when possible for more efficient code (previous code is now fallback).
 * Added support for `UTF-32` and `Double Wide Pascal` (32 bit) strings.
 * Large code clean up with included test.
 * Marked deprecated `BiReaderStream` and `BiWriterStream` as functionality was moved to `BiReader` and `BiWriter` for file reading (Node only).
 * Values for writes are now clamped to bit size and don't throw errors.

### v3
 * Added `enforceBigInt` option for always returning a `BigInt` type on 64 bit reads, otherwise will return a `number` if integer safe.
 * Added Browser, Node CommonJS and Node ESM modules.
 * Added new `BiReaderStream` and `BiWriterStream` (Node only).
 * Added `.deleteFile()` and `.renameFile(filePath)`.
 * Added setter `.strSettings` for use with `.str` for easier coding.
 * Added better options for extending array buffer when writing data with `growthIncrement`.
 * Consolidated all options argument into single object when creating class.
 * Removed deprecated `bireader` and `biwriter` classes.
 * Fixed standalone `hexdump` function. 

### v2
 * Created new `BiReader` and `BiWriter` classes with *get* and *set* functions for easier coding.
 * Marked `bireader` and `biwriter` as deprecated. Set to be removed next update.

### v1
 * Included math functions and value searches.
 * Many bug fixes.

## Installation

``npm install bireader``

Provides both CommonJS and ES modules. Works in Browser, Node.js (CJS + ESM), and provides zero-dependency binaries.

## Quick Start – The 4 Classes

| Class         | Use Case                        | Style | Best For                 |
|   ---         |         ---                     | ---   |      ---                 |
|`BiReader`     | Most parsing tasks              | Sync  | Buffers + normal files   |
|`BiWriter`     | Creating / editing binary files | Sync  | In-memory + normal files |
|`BiReaderAsync`| Huge files (> 2–4 GB)           | Async | Very large files         |
|`BiWriterAsync`| Writing huge files without OOM  | Async | Streaming / large output |

### 1. BiReader + BiWriter (Sync – Recommended for 99% of use cases)

```javascript
import { BiReader, BiWriter } from 'bireader';

// === Reading from Buffer / Uint8Array ===
const data = new Uint8Array([0x01, 0x02, 0x03, 0x04 /* ... */]);
const br = new BiReader(data);

console.log(br.uint32le);        // auto-advances cursor
console.log(br.halffloatle);
console.log(br.readString(10));  // or use .pstring2le, .widestring, etc.

// === Writing (auto-grows) ===
const bw = new BiWriter();
bw.uint32le = 0xCAFEBABE;
bw.halffloatle = 3.1416;
bw.pstring2le("Hello World");
bw.writeBit(0b101, 3);           // bit-level control

const finalBuffer = bw.data;     // or bw.toBuffer()
```
**Node.js file support (still sync)**

```javascript
const brFile = new BiReader('huge-but-not-gigantic.bin'); // accepts filePath
console.log(brFile.int64le);
```

### 2. BiReaderAsync + BiWriterAsync (Async – for huge files)

```javascript
import { BiReaderAsync, BiWriterAsync } from 'bireader';

// === Async Reader (random access, no full load into RAM) ===
const brAsync = await BiReaderAsync.create('massive-50gb-file.bin');

await brAsync.seek(1024 * 1024 * 1024);    // jump to 1 GB mark
const magic = await brAsync.str();         // or .uint32le, .halffloatle, etc.
const value = await brAsync.readUint64();  // all methods are now async

await brAsync.close();
```

**Async Writer**

```javascript
const bwAsync = await BiWriterAsync.create('output-huge.bin');

await bwAsync.writeUint32(0xDEADBEEF);
await bwAsync.halffloatle(1.618);
await bwAsync.writeString("Header data", { stringType: 'utf8', terminateValue: 0 });

await bwAsync.close();   // flushes everything
```

**Important: `BiReaderAsync` / `BiWriterAsync` are Node.js only (they use `fs/promises`).**

### 3. Bit-Field Example (works on all 4 classes)

```javascript
const br = new BiReader(myData);
br.goto(0x100);

// Bit-level presets (auto-advance cursor)
console.log(br.ubit4);     // 4 bits
console.log(br.bit8);      // signed 8 bits
console.log(br.ubit24be);  // 24 bits big-endian

// Manual bit control
br.insetBit = 3;
console.log(br.readBit(5));        // read any number of bits
br.writeBit(0b10110, 5);           // write any number of bits
```

### 4. String Handling (all variants)

```javascript
const bw = new BiWriter();
bw.strSettings = { length: 8, stringType: 'utf16le', terminateValue: 0 };

bw.str = "Hello 🌍";           // uses current strSettings
bw.pstring2le("Pascal string");
bw.widestring("UTF-16 wide string");

const br = new BiReader(bw.data);
console.log(br.cstring());       // null-terminated
console.log(br.pstring4be());
```

### 5. Math Helpers (XOR, shifts, etc.)

```javascript
const bw = new BiWriter(data);
bw.xor(0xAA);                  // XOR entire buffer with key
bw.lShift(1, 0, 8);            // left-shift first 8 bytes by 1 bit
bw.and(0x0F, 0, 4);            // AND bytes 0-3 with 0x0F
console.log(bw.toHex());       // nice hexdump helper
```

### 6. Real-World Complete Example (WebP parser)

<details>
<summary>Click to expand</summary>

Import the reader or writer. Create a new parser with the data and start parsing.

Includes presents for quick parsing or programmable functions (examples below).

```javascript
import {BiReader, BiWriter} from 'bireader';

// read example - parse a webp file
function parseWebp(data){
  const br = new BiReader(data);
  br.strSettings = {length: 4};
  br.hexdump({suppressUnicode:true}); // console.log data as hex

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
  header.magic = br.str;                // RIFF
  header.size = br.uint32le;            // 15000
  header.fileSize = header.size + 8;    // 15008
  header.payload = br.str;              // WEBP
  header.format = br.str;               // VP8X
  header.formatChunkSize = br.uint32le; // 10
  switch (header.format){
    case "VP8 ":
        header.formatType = "Lossy";
        var readSize = 0;
        header.frame_tag = br.ubit24;
        readSize += 3;
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
        readSize += 7;
        header.VP8data = br.extract(header.formatChunkSize - readSize, true);
        break;
    case "VP8L":
        header.formatType = "Lossless";
        var readSize = 0;
        header.signature = br.ubyte; // should be 47
        readSize += 1;
        header.readWidth =  br.ubit14;
        header.width = header.readWidth+1;
        header.readHeight =  br.ubit14;
        header.height = header.readHeight+1;
        header.alpha_is_used =  br.bit1;
        header.version_number =  br.ubit3;
        readSize += 4;
        header.VP8Ldata = br.extract(header.formatChunkSize - readSize, true);
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
</details>

## Common Functions

Common functions for setup, movement, manipulation and math shared by both.

Naming is shared across sync and async classes.

<table>
<thead>
  <tr>
    <th align="center" colspan="2">Methods</th>
    <th align="center">Params (bold requires)</th>
    <th align="left">Desc</th>
  </tr>
</thead>
<tbody>
  <tr>
  <th align="center" colspan="4"><i>Setup</i></th>
  <tr>
  <tr>
    <td>Class</td>
    <td>new BiReader(<b>dataOrPath</b>, {byteOffset, bitOffset, endianess, strict, growthIncrement, enforceBigInt, readOnly})</td>
    <td  rowspan="2"><b>dataOrPath:</b> string path or Buffer or Uint8Array</b><br><b>byteOffset:</b> byte offset (default <code>0</code>)<br><b>bitOffset:</b> bit offset (overides <code>byteOffset</code>) (default <code>0</code>)<br><b>endianess:</b> endian big or little (default <code>little</code>)<br><b>strict:</b> strict mode restrict extending initially supplied data (default <code>true</code> for reader, <code>false</code> for writer)<br><b>growthIncrement:</b> default extended Buffer size (default <code>1 MiB</code>)<br><b>enforceBigInt:</b> always return <code>bigint</code> values on 64 bit reads (default <code>false</code>)<br><b>readOnly:</b> read only Buffer or file (default <code>true</code> in writer)
    </td>
    <td rowspan="2">Start with new Constructor.<br><br><b>File Note:</b> When writing to a file, you must use close() when finished, or commit() to make sure changes are committed.<br><br><b>Data Note:</b> Supplied data can always be found with <b>.data</b>.<br><br><b>Supplied data note:</b> While BiWriter can be created with a 0 length Uint8Array or Buffer, the default <code>growthIncrement</code> will prevent a new array created on each operation (leading to a degraded performance). It's best to supply a larger than needed buffer when creating the Writer and use <b>.trim()</b> after you're finished.</td>
  </tr>
  <tr>
    <td>Class</td>
    <td>new BiWriter(<b>dataOrPath</b>, {byteOffset, bitOffset, endianess, strict, growthIncrement, enforceBigInt, writeable})</td>
  </tr>
  <th align="center" colspan="4"><i>File Mode</i></th>
  <tr>
    <td>Function</td>
    <td>open()
    <td align="center"><b>none</td>
    <td>Opens file for reading / writing. Happens before any operations.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>close()
    <td align="center"><b>none</td>
    <td>Closes file after reading / writing. Note: Commits any edits to the file.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>commit()
    <td align="center"><b>none</td>
    <td>Commits any edits to data to file.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>writeMode(<b>mode</b>)</td>
    <td align="center" >boolean</td>
    <td>Set strict and readOnly to true or false. Will close and reopen file in file mode.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>renameFile(<b>newFilePath</b>)
    <td align="center"><b>Full path to file to rename.</td>
    <td>Renames the file on the file system, keeps read / write position.<br/><br/><b>Note: This is permanent.</b></td>
  </tr>
  <tr>
    <td>Function</td>
    <td>deleteFile()
    <td align="center"><b>none</td>
    <td>Unlinks the file from the file system.<br/><br/><b>Note: This is permanent, it doesn't send the file to the recycling bin for recovery.</b></td>
  </tr>
  <th align="center" colspan="4"><i>Endian</i></th>
  <tr>
    <td>Function</td>
    <td>endianness(<b>"big" | "little"</b>)</td>
    <td align="center" rowspan="2"><code>big</code> or <code>little</code> (default <code>little</code>)</td>
    <td rowspan="2">Set or change Endian. Can be changed at any time.</td>
  </tr>
  <tr>
    <td>Presets</td>
    <td>bigEndian(), big(), be()<br>littleEndian(), little(), le()</td>
  </tr>
  <th align="center" colspan="4"><i>Size</i></th>
  <tr>
    <td>get</td>
    <td>size</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets the current buffer size in bytes.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>length, len, fileSize</td>
  </tr>
  <tr>
    <td>get</td>
    <td>sizeBits</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets the current buffer size in bits.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>lengthBits, lenBits, fileSizeBits</td>
  </tr>
  <th align="center" colspan="4"><i>Position</i></th>
  <tr>
    <td>get</td>
    <td>offset</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets current byte position.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>byteOffset, off, FTell, saveOffset</td>
  </tr>
  <tr>
    <td>get</td>
    <td>bitOffset</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets current bit position.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>offsetBits, offBits, FTellBits, saveBitOffset</td>
  </tr>
  <tr>
    <td>get</td>
    <td>insetBit</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Gets current byte's bit position (0-7).</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>inBit, bitTell, saveInsetBit</td>
  </tr>
  <tr>
    <td>get</td>
    <td>remain</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Size in bytes of current read position to the end.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>FEoF</td>
  </tr>
  <tr>
    <td>get</td>
    <td>remainBits</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Size in bits of current read position to the end.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>FEoFBits</td>
  </tr>
  <tr>
    <td>get</td>
    <td>getLine</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Row line of the file (16 bytes per row).</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>row</td>
  </tr>
  <th align="center" colspan="4"><i>Finishing</i></th>
  <tr>
    <td>Function</td>
    <td>get()</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Returns supplied data. <b>Note:</b> Will use <code>.trim()</code> function if <code>growthIncrement</code> extended the buffer (removes all data after current position). Use <code>.data</code> if you want the full padded data buffer.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>return(), getFullBuffer()</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>end()</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Removes supplied data.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>close(), done(), finished()</td>
  </tr> 
  <tr>
    <td>get</td>
    <td>data</td>
    <td align="center">None</td>
    <td >Returns full current buffer data.</td>
  </tr>
  <th align="center" colspan="4"><i>Hex Dump</i></th>
  <tr>
    <td>Function</td>
    <td>hexdump({length, startByte, suppressUnicode})</td>
    <td align="center">Length of dump in bytes (default 192), byte position to start the dump (default current byte position), Suppress unicode character preview for cleaner columns (default false)</td>
    <td >Console logs data. Will trigger on error unless turned off (see below)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>errorDumpOff()</td>
    <td align="center">None</td>
    <td >Does not hexdump on error (default)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>errorDumpOn()</td>
    <td align="center">None</td>
    <td >Turns on hexdump on error</td>
  </tr>
  <th align="center" colspan="4"><i>Strict</i></th>
  <tr>
    <td>Function</td>
    <td>unrestrict()</td>
    <td align="center">None</td>
    <td>Sets strict mode to false, will extend array if data is outside of max size (<b>default true for reader, false for writer</b>)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>restrict()</td>
    <td align="center">None</td>
    <td>Sets strict mode to true, won't extend array if data is outside of max size (<b>default true for reader, false for writer</b>)</td>
  </tr>
   
  <th align="center" colspan="4"><i>Search</i></th>
  <tr>
    <td>Function</td>
    <td>findString(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for byte position of string from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>findByte(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for byte value (can be signed or unsigned) position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>findShort(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for short value (can be signed or unsigned) position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>findInt(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for integer value (can be signed or unsigned) position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>findInt64(<b>value</b>, unsigned, endian)</td>
    <td align="center">Searches for 64 bit position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>findHalfFloat(<b>value</b>, endian)</td>
    <td align="center">Searches for half float value position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>findFloat(<b>value</b>, endian)</td>
    <td align="center">Searches for float value position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>findDoubleFloat(<b>value</b>, endian)</td>
    <td align="center">Searches for double float value position from current read position.</td>
    <td ><b>Note:</b> Does not change current read position.</td>
  </tr>
  <th align="center" colspan="4"><i>Movement</i></th>
  <tr>
    <td>Function</td>
    <td>align(<b>number</b>)</td>
    <td align="center">Aligns byte position to number.</td>
    <td ><b>Note:</b> Errors in strict mode when change is outside of data size.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>alignRev(<b>number</b>)</td>
    <td align="center">Reverse aligns byte position to number.</td>
    <td ><b>Note:</b> Errors in strict mode when change is outside of data size.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>skip(<b>bytes</b>, bits)</td>
    <td align="center" rowspan="2"><b>Bytes to skip from current byte position</b>, bits to skip (default 0)</td>
    <td rowspan="2">Use negative to go back.<br><b>Note:</b> Remaining bits are dropped when returning to a byte function.</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>FSeek(<b>byte</b>, bit)<br>seek(<b>byte</b>, bit)<br>jump(<b>bytes</b>, bits)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>goto(<b>byte</b>, bit)</td>
    <td align="center" rowspan="2"><b>Byte offset from start</b>, bits within byte offset</td>
    <td rowspan="2"><b>Note:</b> Remaining bits are drop when returning to byte function.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>pointer(<b>byte</b>, bit)<br>warp(<b>byte</b>, bit)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>rewind()</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Moves current byte position to start of data.</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>gotoStart()</td>
  </tr>
  <tr>
    <td>Function</td>
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
    <td>Function</td>
    <td>delete(startOffset, endOffset, consume)</td>
    <td align="center">Start byte of data (default 0), end byte of data (default current byte position), move byte position to after data read (default false)</td>
    <td >Removes and returns data. <br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>clip()</td>
    <td align="center" rowspan="2">None</td>
    <td rowspan="2">Removes data after the current byte position and returns data. <br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>trim()</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>crop(<b>length</b>, consume)</td>
    <td align="center" rowspan="2"><b>Number of bytes to read and remove from current byte position</b>, move byte position to after data read (default false)</td>
    <td rowspan="2">Removes and returns data from current byte position for length of data</b>.<br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>drop(<b>length</b>, consume)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>replace(<b>data</b>, offset, consume)</td>
    <td align="center" rowspan="2"><b>Data to replace in supplied data</b>, move byte position to after data read (default false), byte position to start replace (default current byte position)</td>
    <td rowspan="2">Replaces data at current byte or supplied offset.<br><b>Note:</b> Errors on strict mode</td>
  </tr>
  <tr>
    <td>Alias</td>
    <td>overwrite(<b>data</b>, offset, consume)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>lift(startByte, endByte, consume, fillValue)</td>
    <td align="center" rowspan="2">Start of byte read (default current byte position), end of byte read (default end of data), move current byte position to end of byte read (default false), value to fill bytes (will <b>NOT</b> fill on default)</td>
    <td rowspan="2">Returns data from supplied byte positions. <br><b>Note:</b> Only moves current byte position if consume is true. Only fills data if value is supplied</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>fill(startByte, endByte, consume, fillValue)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>extract(<b>length</b>, consume)</td>
    <td align="center" rowspan="2"><b>Number of bytes to read</b>, move byte position to after data read (default false)</td>
    <td rowspan="2">Returns data from current byte position for length of data</b>.</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>readbytes(amount, unsigned), slice(<b>length</b>, consume)<br>wrap(<b>length</b>, consume)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>insert(<b>data</b>, offset, consume)</td>
    <td align="center" rowspan="2"><b>New data to insert</b>, byte position to insert (default current byte position), move byte position to after data read (default true)</td>
    <td rowspan="2">Inserts new data into supplied data. <b>Note:</b> Data type must match supplied data. Errors on strict mode</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>place(<b>data</b>, consume, offset), write(<b>data</b>, consume, offset)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>unshift(<b>data</b>, consume)</td>
    <td align="center" rowspan="2"><b>New data to insert</b>, move byte position to after data read (default false)</td>
    <td rowspan="2">Adds new data to start of supplied data<br><b>Note:</b> Data type must match supplied data. Errors on strict mode</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>prepend(<b>data</b>, consume)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>push(<b>data</b>, consume)</td>
    <td align="center" rowspan="2"><b>New data to insert</b>, move byte position to after data read (default false)</td>
    <td rowspan="2">Adds new data to end of supplied data<br><b>Note:</b> Data type must match supplied data. Errors on strict mode</td>
  </tr>
  <tr>
    <td>Aliases</td>
    <td>append(<b>data</b>, consume)</td>
  </tr>
  <th align="center" colspan="4"><i>Math</i></th>
  <tr>
    <td>Function</td>
    <td>xor(<b>xorKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, Uint8Array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >XOR data. <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>xorThis(<b>xorKey</b>, length, consume)
    <td align="center"><b>Byte value, string, Uint8Array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>XOR data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>or(<b>orKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, Uint8Array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >OR data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>orThis(<b>orKey</b>, length, consume)
    <td align="center"><b>Byte value, string, Uint8Array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>OR data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>and(<b>andKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >AND data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>andThis(<b>andKey</b>, length, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>AND data <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>add(<b>addKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >Add value to data (per byte). <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>addThis(<b>addKey</b>, length, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>Add value to data (per byte)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>not(startOffset, endOffset, consume)
    <td align="center">Byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >NOT data (per byte)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>notThis(length, consume)
    <td align="center">Length of bytes starting at current byte position (default 1), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>NOT data (per byte)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>lShift(<b>shiftKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >Left shift data (per byte). <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>lShiftThis(<b>shiftKey</b>, length, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>Left shift data (per byte)</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>rShift(<b>shiftKey</b>, startOffset, endOffset, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, byte position to start (default current position), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td >Right shift data (per byte). <b>Note:</b> Will loop if operation length is longer than supplied key.</td>
  </tr>
  <tr>
    <td>Function</td>
    <td>rShiftThis(<b>shiftKey</b>, length, consume)
    <td align="center"><b>Byte value, string, number array or Buffer</b>, length of bytes starting at current byte (repeats when longer, default 1 byte for byte value, string length or end of data for string, array length or end of data for array or Buffer), byte position to end (default end of data), move byte position to after operation (default false)</td>
    <td>Right shift data (per byte)</td>
  </tr>
</tbody>
</table>

## Async

With 4.0 you can now use ``BiReaderAsync`` and ``BiWriterAsync`` for async operations. Pass a normal Buffer, Uint8Array or a string path (only in Node.js). When passed a Buffer or Uint8Array, it's uses the same logic as the sync class. When working with reading or creating a file, the class async loads the files in chunks for quick editing (window size is editing). This class is designed for larger files where you don't want to load the whole file buffer into memory all at once or need an async class.

**Naming:** Same function naming applies to async as [Common Functions](#common-functions) section but these classes use all async functions, **so `get` and `set` methods are now also async functions.**

<table>
<thead>
  <tr>
    <th align="center" colspan="2">Methods</th>
    <th align="center">Params (bold requires)</th>
    <th align="left">Desc</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>Class</td>
    <td>new BiReaderAsync(<b>dataOrFilePath</b>, {byteOffset, bitOffset, endianess, strict, growthIncrement, readOnly, windowSize})</td>
    <td  rowspan="2"><b>dataOrPath:</b> string path or Buffer or Uint8Array</b><br><b>byteOffset:</b> byte offset (default <code>0</code>)<br><b>bitOffset:</b> bit offset (overides <code>byteOffset</code>) (default <code>0</code>)<br><b>endianess:</b> endian big or little (default <code>little</code>)<br><b>strict:</b> strict mode restrict extending initially supplied data (default <code>true</code> for reader, <code>false</code> for writer)<br><b>growthIncrement:</b> default extended Buffer size (default <code>1 MiB</code>)<br><b>enforceBigInt:</b> always return <code>bigint</code> values on 64 bit reads (default <code>false</code>)<br><b>readOnly:</b> read only Buffer or file (default <code>true</code> in writer)<br><b>windowSize:</b> The chunk size when reading files. Set to <code>0</code> if you want the whole file read in one async cycle (default <code>4 KiB</code>)
    </td>
    <td rowspan="2">Start with new Constructor.<br><br><b>Note:</b> The file must be opened with await <code>.open()</code> and closed with await <code>.close()</code>. The <b>.data</b> can't be used in file mode, so use await <code>.get()</code> or <code>.return()</code></td>
  </tr>
  <tr>
    <td>Class</td>
    <td>new BiWriterAsync(<b>dataOrFilePath</b>, {byteOffset, bitOffset, endianess, strict, growthIncrement, readOnly, windowSize})</td>
  </tr>
  <th align="center" colspan="4"><i>Quick Create</i></th>
  <tr>
    <td>Function</td>
    <td>create(<b>dataOrFilePath</b>, {byteOffset, bitOffset, endianess, strict, growthIncrement, readOnly, windowSize})
    <td>Same as above</tb>
    <td align="center">Static async function that creates and opens the class all at once.</td>
  </tr>
</tbody>
</table>

## Bit field

Parse value as a bit field. There are 32 functions from bit1 to bit32 and can be signed or unsigned (with a `u` at the start) and in little or big endian order (`be` or `le` at the end).

**Note:** Remaining bits are dropped when returning to a byte read. Example, after using `bit4` then `ubyte`, the read locations drops the remaining 4 bits after `bit4` when reading `ubyte`. Any bit reading under 8 will always be unsigned.

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
    <td>*Note: In BiReader these are get, not functions.</td>
  </tr>
  <tr>
    <td align="center"><b>Presets (writer)</b></td>
    <td>[u]bit{1-32}{le|be} = <b>value</b></td>
    <td>*Note: In BiWriter these are set, not functions.</td>
  </tr>
</tbody>
</table>

## Byte

Parse value as a byte (aka int8). Can be signed or unsigned (with a `u` at the start).

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

Parse value as a int16 (aka short or word). Can be signed or unsigned (with a `u` at the start) and in little or big endian order (`be` or `le` at the end).

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

Parse value as a half float (aka half). Can be in little or big endian order (`be` or `le` at the end).

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

Parse value as a int32 (aka int, long or  double). Can be signed or unsigned (with a `u` at the start) and in little or big endian order (`be` or `le` at the end).

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

Parse value as a float. Can be in little or big endian order (`be` or `le` at the end).

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

Parse value as a int64 (aka quad or bigint). Can be signed or unsigned (with a `u` at the start) and in little or big endian order (`be` or `le` at the end).

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

Parse value as a double float (aka dfloat). Can be in little or big endian order (`be` or `le` at the end).

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

Parse a string in any format. Either null terminated strings (utf) or fixed length (pascal). Be sure to use options object for formatting unless using a preset. Default string settings can be stored in `strSettings`. Strings with larger than 1 byte character reads can use `be` or `le` at the end for little or big endian.

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
    <td><b>length:</b> Length in uints (NOT bytes) for non-terminate UTF strings. If not supplied, reads until <code>0x00</code> or supplied terminate value (for fixed length UTF strings only)<br><b>stringType:</b> String type. Defaults to utf-8 (<code>utf-8</code>, <code>utf-16</code>, <code>utf-32</code>, <code>pascal</code>, <code>wide-pascal</code>, <code>double-wide-pascal</code> accepted)<br><b>terminateValue:</b> Terminate value. Default is <code>0x00</code> (for non-fixed length utf strings)<br><b>lengthReadSize:</b> Size of the first value that defines the length of the string. Defaults to <code>1</code> as uint8, respects supplied endian (for Pascal strings only, accepts <code>1</code>, <code>2</code> or <code>4</code> bytes)<br><b>stripNull:</b> Removes 0x00 characters on read (default <code>true</code>)<br><b>encoding:</b> Defaults to <code>utf-8</code> (accepts all TextDecoder options)<br><b>endian:</b> for <code>utf-16</code>, <code>utf-32</code>, <code>wide-pascal</code> and <code>double-wide-pascal</code> character order</td>
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
     <td>
      <b>string:</b> String to write<br>
      length:</b> Length in uints (NOT bytes) for non-terminate UTF strings. If not supplied, reads until <code>0x00</code> or supplied terminate value (for fixed length UTF strings only, in units NOT bytes)<br>
      <b>stringType:</b> String type. Defaults to utf-8 (<code>utf-8</code>, <code>utf-16</code>, <code>utf-32</code>, <code>pascal</code>, <code>wide-pascal</code>, <code>double-wide-pascal</code> accepted)<br>
      <b>terminateValue:</b> Terminate value. Default is <code>0x00</code> (for non-fixed length utf strings)<br>
      <b>lengthReadSize:</b> Size of the first value that defines the length of the string. Defaults to <code>1</code> as uint8, respects supplied endian (for Pascal strings only, accepts <code>1</code>, <code>2</code> or <code>4</code> bytes)<br>
      <b>encoding:</b> Defaults to <code>utf-8</code> (accepts all TextDecoder options)<br>
      <b>endian:</b> for <code>utf-16</code>, <code>utf-32</code>, <code>wide-pascal</code> and <code>double-wide-pascal</code> character order</td>
  </tr>
  <tr>
    <td><b>Default settings</b></td>
    <td>strSettings = {length?, stringType?, terminateValue?, lengthReadSize?, lengthWriteSize?, stripNull?, encoding?, endian?}</td>
    <td>
      <b>length:</b> Length of string for fixed length, non-terminate value utf strings (in units NOT bytes)<br/>
      <b>stringType:</b> <code>utf-8</code>, <code>utf-16</code>, <code>utf-32</code>,<code>pascal</code>, <code>wide-pascal</code> or <code>double-wide-pascal</code>. Default <code>utf-8</code>.<br/>
      <b>terminateValue:</b> Number only with <code>stringType</code> of utf types.<br/>
      <b>lengthReadSize</b> For pascal strings. 1, 2 or 4 byte length read size. Default <code>1</code><br/>
      <b>lengthWriteSize:</b> For pascal strings. 1, 2 or 4 byte length write size. Default <code>1</code>.<br/>
      <b>stripNull:</b> Removes code>0x00</code> characters. default <code>true</code><br/>
      <b>encoding:</b> TextEncoder accepted types. Default <code>utf-8</code>.<br/>
      <b>endian:</b> <code>big</code> or <code>little</code><br/>
    </td>
  </tr>
  <tr>
    <td><b>get / set</b></td>
    <td>str()</td>
    <td>
      Quickly read or write a string with the set <code>strSettings</code> options.
    </td>
  </tr>
  <tr>
    <td align="center"><b>Functions (reader)</b></td>
    <td>
    {c|utf8}string(length, terminateValue, stripNull)<br>
    ansistring(length, terminateValue, stripNull)<br>
    pstring(lengthReadSize, stripNull, endian)<br>
    pstring{1|2|4}{be|le}(stripNull, endian)
    </td>
    <td>Get a single byte string as a fixed length (pascal) or null terminated (utf) string</td>
  </tr>
  <tr>
    <td align="center"><b>Functions (reader)</b></td>
    <td>
    {utf16|uni}string(length, terminateValue, stripNull, endian)<br>
    wpstring{be|le}(lengthReadSize, stripNull, endian)<br>
    wpstring{1|2|4}{be|le}(stripNull, endian)
    </td>
    <td>Get a wide (2 byte) string as a fixed length (pascal) or null terminated (utf) string</td>
  </tr>
  <tr>
    <td align="center"><b>Functions (reader)</b></td>
    <td>
    utf32string{be|le}(length, terminateValue, stripNull, endian)<br>
    dwpstring{be|le}(lengthReadSize, stripNull, endian)<br>
    dwpstring{1|2|4}{be|le}(stripNull, endian)
    </td>
    <td>Get a double wide (4 byte) string as a fixed length (pascal) or null terminated (utf) string</td></td>
  </tr>
  <tr>
    <td align="center"><b>Functions (writer)</b></td>
    <td>
    {c|utf8}string(<b>string</b>, length, terminateValue)<br>
    ansistring(<b>string</b>, length, terminateValue)<br>
    pstring(<b>string</b>, lengthWriteSize, endian)<br>
    pstring{1|2|4}{be|le}(<b>string</b>, endian)
    </td>
    <td>Write a single byte string as a fixed length (pascal) or null terminated (utf) string</td>
  </tr>
  <tr>
    <td align="center"><b>Functions (writer)</b></td>
    <td>
    {utf16|uni}string{be|le}(<b>string</b>,length, terminateValue, endian)<br>
    wpstring{be|le}(<b>string</b>, lengthWriteSize, endian)<br>
    wpstring{1|2|4}{be|le}(<b>string</b>, endian)
    </td>
    <td>Write a wide (2 byte) string as a fixed length (pascal) or null terminated (utf) string</td>
  </tr>
  <tr>
    <td align="center"><b>Functions (writer)</b></td>
    <td>
    utf32string{be|le}(<b>string</b>,length, terminateValue, endian)<br>
    dwpstring{be|le}(<b>string</b>, lengthWriteSize, endian)<br>
    dwpstring{1|2|4}{be|le}(<b>string</b>, endian)
    </td>
    <td>Write a double wide (4 byte) string as a fixed length (pascal) or null terminated (utf) string</td></td>
  </tr>
</tbody>
</table>

## Acknowledgements

This project was born from the desire to have a single library that could both read and write in binary with common named functions. Having been using tools like [Binary-parser](https://github.com/keichi/binary-parser), [QuickBMS](https://aluigi.altervista.org/quickbms.htm) and [010 Editor](https://www.sweetscape.com/010editor/) in the past, I wanted something I could translate quickly to a Node app and then use in a web site without having to redo work.

I'm happy to connect and grow this library if others find it useful. Pull requests or [bug reports](https://github.com/hearhellacopters/bireader/issues) are welcome!

## License

[MIT](https://github.com/hearhellacopters/bireader/blob/main/LICENSE)