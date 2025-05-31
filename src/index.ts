export { BiReader } from './bireader';
export { BiWriter } from './biwriter';
export { hexdump }  from './common';

/**
 * Not in use anymore.
 * @since 3.0 @deprecated Use ``BiReader`` instead.
 */
export class bireader{
    constructor(){
        throw new Error("bireader is deprecated. Use BiReader instead.");
    }
}

/**
 * Not in use anymore.
 * @since 3.0 @deprecated Use ``BiWriter`` instead.
 */
export class biwriter{
    constructor(){
        throw new Error("biwriter is deprecated. Use BiWriter instead.");
    }
}