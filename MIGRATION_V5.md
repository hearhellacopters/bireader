# Migrating to bireader v5

v5 is the first release since the v4 correctness pass. It carries the bug fixes from 
v.4.0.14 plus a set of intentionally **breaking** API/type changes and new capabilities.
Most code that reads/writes in-memory buffers needs **no changes**.

## Breaking changes

### 1. `async close()` no longer returns the whole file

In file mode, `await writer.close()` used to load and concatenate the entire file
just to hand it back. It now flushes pending writes, closes the handle, and returns
`void`. Reading a 4 GiB file no longer allocates 4 GiB on close.

```diff
- const bytes = await writer.close();      // used to return the file
+ const bytes = await writer.get();        // read it explicitly first
+ await writer.close();
```

Memory mode still returns the buffer from `close()`, unchanged.

### 2. Async `findByte` / `findShort` / `findInt` return an ABSOLUTE offset

They previously returned an offset **relative to the current cursor**, inconsistent
with every other `find*` method (and with the sync classes). They now return the
absolute byte position, matching `findBytes`, `findInt64`, `findFloat`, etc.

```diff
- const rel = await reader.findInt(0x1234);   // was: position from cursor
+ const abs = await reader.findInt(0x1234);   // now: absolute position (or -1)
```

### 3. Constrained generics

The classes are now declared as:

```ts
class BiReader<DataType extends string | Uint8Array | Buffer = Uint8Array,
               alwaysBigInt extends boolean = false>
```

`new BiReader(buf)` / `new BiReader("path")` infer correctly and are unaffected.
Only code that passed explicit type arguments violating these bounds needs updating.

### 4. The constructor no longer mutates your `options` object

Previously the constructor wrote its defaults back into the object you passed
(`options.strict = options.strict ?? true`, …). It now merges into a fresh object
and leaves yours untouched. This only affects code that relied on reading the
defaults back out of its own options object after construction.

### 5. `enforceBigInt` typing

`enforceBigInt` is a `boolean` type parameter now. Runtime behaviour is unchanged.

### 6. The 32-bit `double` alias was renamed to `dword`

`double` (and `udouble`, `doublele`, `doublebe`, `udoublele`, `udoublebe`) were a confusing
name for a 32-bit integer sitting next to the 64-bit `doublefloat` / `dfloat`. They are now
`dword` / `udword` (+ `le`/`be`). The 64-bit float aliases (`doublefloat`, `dfloat`) are
unchanged.

```diff
- reader.double        writer.doublele = x        reader.udoublebe
+ reader.dword         writer.dwordle = x         reader.udwordbe
```

## New in v5

### Concurrency-safe async access

The async classes share one cursor across `await` points, so overlapping
cursor-based calls on the **same instance** interleave. Two new tools:

- **`runExclusive(fn)`** - serializes a sequence of cursor operations. Overlapping
  calls queue and run one at a time; reentrant (safe to nest).

  ```ts
  const [a, b] = await Promise.all([
      reader.runExclusive(() => reader.readUInt32()),
      reader.runExclusive(() => reader.readUInt32()),
  ]); // deterministic, sequential
  ```

- **Positional `*At(offset, …)` methods** - read/write at an absolute offset without
  touching the cursor, so they are safe to call concurrently by construction:
  `readUInt8At`, `readInt16At`, `readUInt16At`, `readInt32At`, `readUInt32At`,
  `readFloat32At`, `readFloat64At`, `readBigInt64At`, `readBigUInt64At`,
  `readBytesAt`, and the `write*At` counterparts.

  ```ts
  const [hdr, len] = await Promise.all([
      reader.readUInt32At(0, 'big'),
      reader.readUInt16At(8, 'little'),
  ]);
  ```

### Faster async strings

`readString` / `writeString` in the async classes now do a single batched
read/write instead of one awaited I/O per byte.

## Async engine reimplemented (mostly internal)

`BiReaderAsync` / `BiWriterAsync` now run on a new, decomposed engine (`BiEngine`, over a
`Source` abstraction) instead of the old `BiBaseAsync`. The public API and behaviour are
preserved (the full 1,134-test suite passes), with these deliberate improvements:

- **Every** async operation on an instance is now serialized through a built-in op-queue,
  so overlapping cursor calls on one instance no longer interleave - `runExclusive` is now
  the default, not just an opt-in. (Positional `*At` methods remain lock-free.)
- Two more async bugs found while building the engine are fixed (`delete`'s returned bytes
  were a live view corrupted by the shift; `fill(start,end,…,value)` wrote at the cursor
  instead of `start`), and the engine no longer over-allocates via `growthIncrement`
  (buffers grow to the exact size).
- `close()` in file mode returns `void` (unchanged from the v5 note); memory mode returns
  the buffer.

If you relied on `BiBaseAsync` directly (it was an internal base class, not exported), it
no longer exists - use `BiReaderAsync` / `BiWriterAsync`.

## Sync engine reimplemented (mostly internal)

`BiReader` / `BiWriter` now run on `BiSyncEngine` (over a `SyncSource`) instead of the old
`BiBase`, mirroring the async change. Public API and behaviour are preserved (full suite
passes). `BiBase` - an internal, un-exported base class - no longer exists; use
`BiReader` / `BiWriter`. The browser entry no longer re-exports `BiBase`.

With both legacy base classes gone, the whole codebase now compiles under
`strictNullChecks`.

## Tooling (maintainers)

- The ~1,300 mechanical aliases (numeric/bit/endian variants) are now derived from a
  single declarative table, [`scripts/alias-spec.mjs`](./scripts/alias-spec.mjs):
  - `npm run apply:aliases` re-renders the `#region Generated mechanical aliases` block in
    all four facades in place (edit the spec, run this).
  - `test/aliases.parity.test.ts` (1,084 checks, part of `npm test`) asserts every
    live alias delegates with the exact spec width/sign/endian - a mistyped endian or
    sign literal now fails CI.
- `src/core/engine/` is the engine both facade pairs run on (`BiEngine` async,
  `BiSyncEngine` sync); `npm run test:engine` runs its unit tests. See
  [`src/core/engine/README.md`](./src/core/engine/README.md).
