# bireader v5 - Summary of changes (v4.0.13 → 5.0.0)

A full correctness pass plus a ground-up internal rewrite. The public API is preserved
(the whole test suite passes) except for a small set of deliberate breaking changes
(§4 → [`MIGRATION_V5.md`](./MIGRATION_V5.md)).

## At a glance

| | Before (v4) | After (v5) |
|---|---|---|
| Engine | two ~4,500–5,000-line god-classes (`BiBase`, `BiBaseAsync`) | 8 small engine bricks (~3,100 lines total), each unit-tested |
| Facades (4) | ~14,200 lines, hand-written aliases | ~6,100 lines, aliases **generated** from a table |
| `common.ts` | ~1,490 lines (much of it dead) | 793 lines (dead fallback machinery pruned) |
| `strictNullChecks` | off | **on** (whole codebase) |
| Async concurrency | shared cursor, corrupts under overlap | every op serialized by a built-in queue |
| Tests | 48 | **1,134** main + **174** engine |
| Net tracked source | - | **+2,324 / −20,600 lines** |

## 1. Correctness

The initial review found and fixed a large batch of real bugs. Highlights:

- **Sync `findByte`/`findShort`/`findInt` always returned 0** (a shadowed variable made the
  comparison `value === value`).
- **`readBytes()` returned the first byte repeated N times** (sync and async).
- **`writeUByte()` passed `consume` into the `unsigned` parameter** (sync and async).
- **After a partial bit read, every multi-byte read/write re-read the same byte** (offset
  advanced from the wrong base).
- The constructor **applied `bitOffset` using `byteOffset`** and double-counted bytes.
- Writing a **negative `float16` clamped to `5.96e-8`** (sign-blind min clamp).
- Async chunked-file bugs: growing/shrinking left a **stale boundary chunk** (silent data
  loss or an **infinite loop**); `windowSize: 0` file mode **read all zeros** and hung;
  `xor`/`or`/… with an explicit offset **read from the cursor but wrote to `startOffset`**;
  multi-byte writes shared **module-level scratch buffers** (cross-instance corruption).
- The `BiWriterAsync.wpstring1be`/`wpstring1le` **endianness was swapped**.

Rebuilding the engine surfaced **two more** async bugs (also fixed, regression-tested in
[`test/async-edits.test.ts`](test/async-edits.test.ts)):

- `delete()` returned a live **view** of the removed range that the in-place shift then
  overwrote → garbage bytes.
- `fill(start, end, false, value)` wrote the fill **at the cursor** instead of `start`.

## 2. Architecture - the engine rewrite

The two god-classes were decomposed into small, independently testable units under
[`src/core/engine/`](src/core/engine/), and both were then **deleted** (~9,300 lines):

```
cursor.ts               position math (byte + bit), one implementation
source.ts               async Source interface
  memory-source.ts        MemorySource (Uint8Array/Buffer)
  chunked-file-source.ts  ChunkedFileSource (windowed file I/O + v5 grow/shrink fixes)
sync-source.ts          SyncSource + MemorySyncSource + FileSyncSource (whole-file)
codecs.ts               numeric/float/bit value codecs (DataView-based; fallbacks dropped)
engine.ts               BiEngine  (async)  - BiReaderAsync / BiWriterAsync extend it
sync-engine.ts          BiSyncEngine (sync) - BiReader / BiWriter extend it
```

- The two engines share `cursor.ts` and `codecs.ts` and differ only in their source layer
  and in sync being Promise-free.
- The pre-`DataView` integer/float fallback codecs (`#8`) are gone - every runtime with
  `Uint8Array` has `DataView`; only the manual `float16` path is kept.
- With both non-strict god-classes deleted, `strictNullChecks` was flipped on globally
  (`#1`) - only 3 residual errors, all in `common.ts`, were fixed. No retrofit was needed.
- `common.ts` is now a lean shared foundation (types, guards, string/math codecs,
  `hexdump`); ~700 lines of dead per-width codecs + capability flags were pruned.

## 3. New capabilities

- **Concurrency-safe async.** Every async op runs through a built-in op-queue, so
  overlapping cursor calls on one instance are serialized instead of corrupting the cursor
  (v5's opt-in `runExclusive` generalized to the default). Cursor-free **`*At(offset)`**
  read/write methods stay lock-free and are safe to call concurrently.
- **Faster async strings** - `readString`/`writeString` do a single batched I/O instead of
  one awaited call per byte.
- **`close()`** in file mode no longer loads the whole file just to close it.

## 4. Breaking changes

Full detail in [`MIGRATION_V5.md`](./MIGRATION_V5.md). In brief:

- Async `close()` returns `void` in file mode (use `get()` for the bytes).
- Async `findByte`/`findShort`/`findInt` return an **absolute** offset (was cursor-relative).
- Constrained generics; constructors no longer mutate the caller's `options` object.
- The internal base classes `BiBase` / `BiBaseAsync` no longer exist (they weren't exported);
  the browser entry no longer re-exports `BiBase`.
- The whole codebase compiles under `strictNullChecks`.

## 5. Tooling (maintainers)

The ~1,300 mechanical numeric/bit/endian aliases per facade are **generated**, not
hand-written, from a single declarative table:

- [`scripts/alias-spec.mjs`](scripts/alias-spec.mjs) - the table (expands to 271 members/facade).
- `npm run apply:aliases` re-renders the `#region Generated mechanical aliases` block in all
  four facades in place (edit the spec, run this).
- [`test/aliases.parity.test.ts`](test/aliases.parity.test.ts) - 1,084 checks asserting every
  live alias delegates with the exact width/sign/endian, so a mistyped literal fails CI (the
  class of bug behind the old `wpstring1le/be` swap is now impossible).

Irregular members stay hand-written per facade: the constructor, `create`, the parameterized
`bit()`/`ubit()`/`string()`, and the string-family aliases (`pstring`, `utf8string`, …).

## 6. Verification

- `npm test` - **1,134** passing (48 original behaviour + 1,084 alias-parity + 2 regression).
- `npm run test:engine` - **174** passing (cursor, codecs, sources, engine equivalence).
- `npx tsc` - clean under full `strict` (esm + cjs); `npm run build` clean.
- The engine equivalence tests + full facade suite prove the rewrite is behaviour-preserving;
  the alias parity suite proves the generated aliases match the spec.

## Related documents

- [`MIGRATION_V5.md`](./MIGRATION_V5.md) - user-facing breaking changes + new features.
- [`src/core/engine/README.md`](src/core/engine/README.md) - engine internals and layering.
