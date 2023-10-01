/// <reference types="node" />
export declare function checkSize(_this: any, write_bytes: number, write_bit?: number, offset?: number): number;
export declare function skip(_this: any, bytes: number, bits?: number): void;
export declare function goto(_this: any, byte: number, bit?: number): void;
export declare function remove(_this: any, startOffset?: number, endOffset?: number, consume?: boolean, remove?: boolean, fillValue?: number): any;
export declare function addData(_this: any, data: Buffer | Uint8Array, consume?: boolean, offset?: number): void;
export declare function hexDump(_this: any, options?: {
    length?: number;
    startByte?: number;
    supressUnicode?: boolean;
}): void;
export declare function AND(_this: any, xor_key: any, start?: number, end?: number): any;
export declare function OR(_this: any, xor_key: any, start?: number, end?: number): any;
export declare function XOR(_this: any, xor_key: any, start?: number, end?: number): any;
export declare function NOT(_this: any, start?: number, end?: number): any;
export declare function LSHIFT(_this: any, value: number, start?: number, end?: number): any;
export declare function RSHIFT(_this: any, value: number, start?: number, end?: number): any;
//# sourceMappingURL=common.d.ts.map