"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryption = exports.encryption = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("./../config");
const IV_LENGTH = Number(process.env.IV_LENGTH) || 16;
const SECRET_KEY = Buffer.from(config_1.EncryptionKey);
const encryption = (text) => {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
    let ciphertext = cipher.update(text, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    return '' + iv.toString('hex') + ':' + ciphertext;
};
exports.encryption = encryption;
const decryption = (cipherData) => {
    const [iv, ciphertext] = cipherData.split(':');
    const binaryIv = Buffer.from(iv, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', SECRET_KEY, binaryIv);
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    return plaintext;
};
exports.decryption = decryption;
