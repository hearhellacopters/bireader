# Engine

This is the decomposition of the two god-classes (`core/BiBase.ts` **and**
`core/BiBaseAsync.ts` - **both deleted**, ~9,600 lines) into small, independently testable
units **Complete and live:**

- `BiEngine` (async) - `BiReaderAsync` / `BiWriterAsync` extend it.
- `BiSyncEngine` (sync) - `BiReader` / `BiWriter` extend it.

Both are strict-null-safe, and with the legacy classes gone the global `strictNullChecks`
flip has landed (`tsconfig.json`). The async and sync engines share `cursor.ts` + `codecs.ts`
and differ only in their source layer (async windowed `Source` vs. sync whole-file
`SyncSource`) and in sync being Promise-free.

## Why

The old engines interleaved five concerns in one class each, which is why the
sync and async variants drifted and why the same edge case (grow/shrink, partial
final chunk, bit-offset math) produced bugs in one variant but not the other:

- **position math** - offset / insetBit arithmetic
- **byte source** - memory vs. full-file vs. windowed-file, plus growth policy
- **codecs** - per-width numeric + string encode/decode
- **structural edits** - insert / delete / replace / fill
- **the alias facade** - ~1,300 delegating members

## Target shape

```
engine/
  cursor.ts               ✅ position math - one implementation, unit-tested
  source.ts               ✅ async Source interface
  memory-source.ts        ✅ MemorySource - async, over a Uint8Array/Buffer
  chunked-file-source.ts  ✅ ChunkedFileSource - async windowed file I/O w/ the v5 grow/shrink fixes
  sync-source.ts          ✅ SyncSource interface + MemorySyncSource + FileSyncSource (whole-file)
  codecs.ts               ✅ numeric + float + bit codecs (fallbacks dropped per §6 #8, float16 kept)
  engine.ts               ✅ BiEngine (async) - full surface + file mode + op-queue (every op serialized)
  sync-engine.ts          ✅ BiSyncEngine (sync) - same surface, Promise-free, position via setters
```

Covered by `npm run test:engine` (174 checks) plus the full facade suite (`npm test`, 1,134,
normal + fallback). Building the engines surfaced and fixed **four** async bugs the shipping
code had (the two v5 fixes plus `delete`'s returned bytes and `fill`'s target range).

## Migration status - complete

1. `cursor.ts` + unit tests  ✅
2. `source.ts` interface     ✅
3. `MemorySource` + `ChunkedFileSource` (v5 chunk grow/shrink fixes, tested in isolation)  ✅
4. `codecs.ts` - pure `_r*`/`_w*` helpers; pre-`DataView` fallbacks dropped (§6 #8), float16 kept  ✅
5. `BiEngine` (async) with the op-queue + structural edits  ✅
6. Async facades re-pointed at `BiEngine`; `BiBaseAsync` deleted  ✅
7. `BiSyncEngine` (sync) + `SyncSource`/`MemorySyncSource`/`FileSyncSource`; sync facades
   re-pointed; `BiBase` deleted; **`strictNullChecks` flipped on globally** (§6 #1)  ✅

### Facade aliases are generated

The ~271 mechanical numeric/bit/endian aliases per facade (`bit8le`, `uint32be`, …) are no
longer hand-written: they're **generated** from [`scripts/alias-spec.mjs`](../../../scripts/alias-spec.mjs)
into a `#region Generated mechanical aliases` … `#endregion` block, delegating to the engine
primitives (`readBit`/`writeInt16`/…). To change an alias, edit the spec and run
**`npm run apply:aliases`** - it re-renders the block in all four facades in place;
[`test/aliases.parity.test.ts`](../../../test/aliases.parity.test.ts) then proves they match
the spec. Only irregular members stay hand-written per facade: the constructor, `create`,
`bit()`/`ubit()`/`string()`, and the string-family aliases (`pstring`, `utf8string`, …).
This cut the four facades from ~14,200 to ~6,100 lines.

### Module layering

`common.ts` is the shared foundational module (types + guards + string/math codecs +
`hexdump`); both engines build on it. `codecs.ts` holds the engine-specific numeric/bit/float
value codecs. The pure string/math helpers (`_rstring`/`_wstring`/`_XOR`/…) intentionally live
in `common.ts` rather than `codecs.ts` - moving them down into an engine sub-module would
invert the dependency direction. The dead per-width codecs and `DataView`-capability flags that
the old god-classes used were pruned from `common.ts` (~700 lines) once those classes were deleted.
