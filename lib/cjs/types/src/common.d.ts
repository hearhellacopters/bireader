/// <reference types="node" />
export declare function buffcheck(obj: Array<Buffer | Uint8Array>): boolean;
export declare function arraybuffcheck(_this: any, obj: Array<Buffer | Uint8Array>): boolean;
export declare function extendarray(_this: any, to_padd: number): void;
export declare function checkSize(_this: any, write_bytes: number, write_bit?: number, offset?: number): number;
export declare function skip(_this: any, bytes: number, bits?: number): void;
export declare function goto(_this: any, byte: number, bit?: number): void;
export declare function remove(_this: any, startOffset?: number, endOffset?: number, consume?: boolean, remove?: boolean, fillValue?: number): any;
export declare function addData(_this: any, data: Buffer | Uint8Array, consume?: boolean, offset?: number, repalce?: boolean): void;
export declare function hexDump(_this: any, options?: {
    length?: number;
    startByte?: number;
    supressUnicode?: boolean;
}): void;
export declare function AND(_this: any, and_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function OR(_this: any, or_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function XOR(_this: any, xor_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function NOT(_this: any, start?: number, end?: number, consume?: boolean): any;
export declare function LSHIFT(_this: any, shift_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function RSHIFT(_this: any, shift_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function ADD(_this: any, add_key: any, start?: number, end?: number, consume?: boolean): any;
export declare function wbit(_this: any, value: number, bits: number, unsigned?: boolean, endian?: string): void;
export declare function rbit(_this: any, bits?: number, unsigned?: boolean, endian?: string): number;
export declare function wbyte(_this: any, value: number, unsigned?: boolean): void;
export declare function rbyte(_this: any, unsigned?: boolean): number;
export declare function wint16(_this: any, value: number, unsigned?: boolean, endian?: string): void;
export declare function rint16(_this: any, unsigned?: boolean, endian?: string): number;
export declare function rhalffloat(_this: any, endian?: string): number;
export declare function whalffloat(_this: any, value: number, endian?: string): void;
export declare function wint32(_this: any, value: number, unsigned?: boolean, endian?: string): void;
export declare function rint32(_this: any, unsigned?: boolean, endian?: string): number;
export declare function rfloat(_this: any, endian?: string): number;
export declare function wfloat(_this: any, value: number, endian?: string): void;
export declare function rint64(_this: any, unsigned?: boolean, endian?: string): bigint;
export declare function wint64(_this: any, value: number, unsigned?: boolean, endian?: string): void;
export declare function wdfloat(_this: any, value: number, endian?: string): void;
export declare function rdfloat(_this: any, endian?: string): number;
export declare function rstring(_this: any, options?: {
    length?: number;
    stringType?: string;
    terminateValue?: number;
    lengthReadSize?: number;
    stripNull?: boolean;
    encoding?: string;
    endian?: string;
}): string;
export declare function wstring(_this: any, string: string, options?: {
    length?: number;
    stringType?: string;
    terminateValue?: number;
    lengthWriteSize?: number;
    stripNull?: boolean;
    encoding?: string;
    endian?: string;
}): void;
//# sourceMappingURL=common.d.ts.map