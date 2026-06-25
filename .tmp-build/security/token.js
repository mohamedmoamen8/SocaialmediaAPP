"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const generateToken = (payload, secret, expiresIn) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = Buffer.from(require('crypto').createHmac('sha256', secret).update(`${header}.${body}`).digest()).toString('base64url');
    return `${header}.${body}.${signature}`;
};
exports.generateToken = generateToken;
