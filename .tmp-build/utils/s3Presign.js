"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3ObjectUrl = exports.createPresignedPutObjectUrl = void 0;
const crypto_1 = __importDefault(require("crypto"));
const algorithm = 'AWS4-HMAC-SHA256';
const service = 's3';
const hmac = (key, data) => crypto_1.default.createHmac('sha256', key).update(data, 'utf8').digest();
const hash = (value) => crypto_1.default.createHash('sha256').update(value, 'utf8').digest('hex');
const encodeRfc3986 = (value) => encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
const toAmzDate = (date) => date.toISOString().replace(/[:-]|\.\d{3}/g, '');
const getSignatureKey = (secretAccessKey, dateStamp, region) => {
    const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    return hmac(kService, 'aws4_request');
};
const createPresignedPutObjectUrl = ({ accessKeyId, secretAccessKey, region, bucket, key, contentType, expiresInSeconds, }) => {
    const now = new Date();
    const amzDate = toAmzDate(now);
    const dateStamp = amzDate.slice(0, 8);
    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const encodedKey = key.split('/').map(encodeRfc3986).join('/');
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const signedHeaders = 'content-type;host';
    const queryParams = {
        'X-Amz-Algorithm': algorithm,
        'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
        'X-Amz-Date': amzDate,
        'X-Amz-Expires': String(expiresInSeconds),
        'X-Amz-SignedHeaders': signedHeaders,
    };
    const canonicalQueryString = Object.entries(queryParams)
        .map(([queryKey, value]) => `${encodeRfc3986(queryKey)}=${encodeRfc3986(value)}`)
        .sort()
        .join('&');
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
    const canonicalRequest = [
        'PUT',
        `/${encodedKey}`,
        canonicalQueryString,
        canonicalHeaders,
        signedHeaders,
        'UNSIGNED-PAYLOAD',
    ].join('\n');
    const stringToSign = [
        algorithm,
        amzDate,
        credentialScope,
        hash(canonicalRequest),
    ].join('\n');
    const signingKey = getSignatureKey(secretAccessKey, dateStamp, region);
    const signature = crypto_1.default
        .createHmac('sha256', signingKey)
        .update(stringToSign, 'utf8')
        .digest('hex');
    return `https://${host}/${encodedKey}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
};
exports.createPresignedPutObjectUrl = createPresignedPutObjectUrl;
const getS3ObjectUrl = ({ bucket, region, key, publicBaseUrl, }) => {
    const encodedKey = key.split('/').map(encodeRfc3986).join('/');
    if (publicBaseUrl)
        return `${publicBaseUrl.replace(/\/$/, '')}/${encodedKey}`;
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
};
exports.getS3ObjectUrl = getS3ObjectUrl;
