// node common js
export { BiReader } from './BiReader.js';
export { BiWriter } from './BiWriter.js';
export { BiReaderAsync } from './BiReaderAsync.js';
export { BiWriterAsync } from './BiWriterAsync.js';
export { hexdump } from './common.js';

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