/**
 * @file Phase-2 engine brick: the byte-source abstraction.
 *
 * Part of the planned decomposition (see ./README.md). The two engine god-classes
 * currently interleave three concerns: WHERE bytes live (memory vs. file), HOW the
 * cursor moves, and HOW values are coded. `Source` isolates the first: a uniform
 * async surface for reading/writing/growing a backing store, so `BiEngine` can be
 * written once against this interface instead of branching on `isMemoryMode`
 * everywhere (the pattern behind several v4 file-mode bugs).
 */

export interface Source {
    /** Current size in bytes. */
    readonly size: number;

    /** Whether writes are permitted. */
    readonly readOnly: boolean;

    /** Read exactly `length` bytes at absolute `offset` (no cursor involved). */
    read(offset: number, length: number): Promise<Uint8Array>;

    /** Write `data` at absolute `offset` (no cursor involved). */
    write(offset: number, data: Uint8Array): Promise<void>;

    /** Grow or shrink the backing store to exactly `size` bytes. */
    resize(size: number): Promise<void>;

    /** Flush any buffered writes to the backing store. */
    flush(): Promise<void>;

    /** Release resources (close file handle, drop caches). Idempotent. */
    close(): Promise<void>;
}
