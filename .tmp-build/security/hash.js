"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.createHash = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../config");
const createHash = async (data) => {
    const hash = await bcrypt_1.default.hash(data, config_1.Salt);
    return hash;
};
exports.createHash = createHash;
const compareHash = async (data, hash) => {
    const isMatch = await bcrypt_1.default.compare(data, hash);
    return isMatch;
};
exports.compareHash = compareHash;
