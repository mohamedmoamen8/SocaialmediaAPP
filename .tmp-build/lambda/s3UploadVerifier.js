"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const apiBaseUrl = process.env.API_BASE_URL;
const verifySecret = process.env.AWS_UPLOAD_VERIFY_SECRET;
const handler = async (event) => {
    if (!apiBaseUrl || !verifySecret) {
        throw new Error('API_BASE_URL and AWS_UPLOAD_VERIFY_SECRET are required');
    }
    const records = event.Records || [];
    const results = await Promise.all(records.map(async (record) => {
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/uploads/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-upload-verify-secret': verifySecret,
            },
            body: JSON.stringify({
                key,
                bucket: record.s3.bucket.name,
                etag: record.s3.object.eTag,
                size: record.s3.object.size,
            }),
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Upload verification failed for ${key}: ${response.status} ${body}`);
        }
        return {
            key,
            verified: true,
        };
    }));
    return {
        verifiedCount: results.length,
        results,
    };
};
exports.handler = handler;
