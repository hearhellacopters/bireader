// node common js
import fs from 'fs';
import fsp from 'fs/promises';
import { BiReader } from './BiReader.js';
import { BiWriter } from './BiWriter.js';
import { BiSyncEngine } from './core/engine/sync-engine.js';
import { BiReaderAsync } from './BiReaderAsync.js';
import { BiWriterAsync } from './BiWriterAsync.js';
import { BiEngine } from './core/engine/engine.js';
export { hexdump } from './common.js';

BiSyncEngine.fs = fs;
BiEngine.fs = fsp;

export{
    BiReader,
    BiWriter,
    BiReaderAsync,
    BiWriterAsync
};

/**
 * Not in use anymore.
 * @since 3.0 
 * @deprecated Use ``BiReader`` instead.
 */
export class bireader {
    constructor() {
        throw new Error("bireader is deprecated. Use BiReader instead.");
    }
};

/**
 * Not in use anymore.
 * @since 4.0 
 * @deprecated Use ``BiReaderLegacy`` instead.
 */
export class BiReaderStream {
    constructor() {
        throw new Error("BiReaderStream is deprecated. Use BiReader instead.");
    }
};

/**
 * Not in use anymore.
 * @since 3.0 
 * @deprecated Use ``BiWriter`` instead.
 */
export class biwriter {
    constructor() {
        throw new Error("biwriter is deprecated. Use BiWriter instead.");
    }
};

/**
 * Not in use anymore.
 * @since 4.0 
 * @deprecated Use ``BiWriterLegacy`` instead.
 */
export class BiWriterStream {
    constructor() {
        throw new Error("BiWriterStream is deprecated. Use BiWriter instead.");
    }
};