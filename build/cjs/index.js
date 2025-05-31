"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.biwriter = exports.bireader = exports.hexdump = exports.BiWriter = exports.BiReader = void 0;
var bireader_1 = require("./bireader");
Object.defineProperty(exports, "BiReader", { enumerable: true, get: function () { return bireader_1.BiReader; } });
var biwriter_1 = require("./biwriter");
Object.defineProperty(exports, "BiWriter", { enumerable: true, get: function () { return biwriter_1.BiWriter; } });
var common_1 = require("./common");
Object.defineProperty(exports, "hexdump", { enumerable: true, get: function () { return common_1.hexdump; } });
/**
 * Not in use anymore.
 * @since 3.0 @deprecated Use ``BiReader`` instead.
 */
class bireader {
    constructor() {
        throw new Error("bireader is deprecated. Use BiReader instead.");
    }
}
exports.bireader = bireader;
/**
 * Not in use anymore.
 * @since 3.0 @deprecated Use ``BiWriter`` instead.
 */
class biwriter {
    constructor() {
        throw new Error("biwriter is deprecated. Use BiWriter instead.");
    }
}
exports.biwriter = biwriter;
//# sourceMappingURL=index.js.map