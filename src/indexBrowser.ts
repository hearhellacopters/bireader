export { BiReader } from './BiReader.js';
export { BiWriter } from './BiWriter.js';
export { hexdump }  from './common.js';

/**
 * Isn't usable in browser.
 * @since 3.0 
 * @deprecated Use ``BiReader`` instead.
 */
export class BiReaderStream{
    constructor(){
        throw new Error("BiReaderStream isn't usable in browser. Use BiReader instead.");
    }
}

/**
 * Isn't usable in browser.
 * @since 3.0 
 * @deprecated Use ``BiWriter`` instead.
 */
export class BiWriterStream{
    constructor(){
        throw new Error("BiReaderStream isn't usable in browser. Use BiReader instead.");
    }
}

/**
 * Not in use anymore.
 * @since 3.0 
 * @deprecated Use ``BiReader`` instead.
 */
export class bireader{
    constructor(){
        throw new Error("bireader is deprecated. Use BiReader instead.");
    }
}

/**
 * Not in use anymore.
 * @since 3.0 
 * @deprecated Use ``BiWriter`` instead.
 */
export class biwriter{
    constructor(){
        throw new Error("biwriter is deprecated. Use BiWriter instead.");
    }
}