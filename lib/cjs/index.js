"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reader_1 = __importDefault(require("./src/reader"));
const writer_1 = __importDefault(require("./src/writer"));
exports.default = {
    bireader: reader_1.default,
    biwriter: writer_1.default
};
//# sourceMappingURL=index.js.map