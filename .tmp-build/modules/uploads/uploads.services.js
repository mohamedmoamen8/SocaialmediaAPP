"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const mongoose_1 = require("mongoose");
const config_1 = require("../../config");
const upload_models_1 = require("../../db/models/upload.models");
const resHandle_1 = require("../../utils/errorHandle/resHandle");
const s3Presign_1 = require("../../utils/s3Presign");
const sanitizeFileName = (fileName) => path_1.default
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');
class UploadServices {
    assertS3Config() {
        if (!config_1.AWS_ACCESS_KEY_ID || !config_1.AWS_SECRET_ACCESS_KEY || !config_1.AWS_REGION || !config_1.AWS_S3_BUCKET) {
            throw new resHandle_1.BadRequestError('S3 upload configuration is missing');
        }
    }
    async createImageUpload({ userId, fileName, contentType, size, purpose, }) {
        this.assertS3Config();
        const uploadId = new mongoose_1.Types.ObjectId();
        const safeName = sanitizeFileName(fileName);
        const key = `${config_1.AWS_S3_UPLOAD_PREFIX}/${purpose}/${userId}/${uploadId.toString()}-${safeName}`;
        const url = (0, s3Presign_1.getS3ObjectUrl)({
            bucket: config_1.AWS_S3_BUCKET,
            region: config_1.AWS_REGION,
            key,
            ...(config_1.AWS_S3_PUBLIC_BASE_URL !== undefined && { publicBaseUrl: config_1.AWS_S3_PUBLIC_BASE_URL }),
        });
        const upload = await upload_models_1.uploadModel.create({
            _id: uploadId,
            owner: new mongoose_1.Types.ObjectId(userId),
            key,
            bucket: config_1.AWS_S3_BUCKET,
            region: config_1.AWS_REGION,
            url,
            contentType,
            size,
            purpose,
            status: upload_models_1.UploadStatus.pending,
        });
        const uploadUrl = (0, s3Presign_1.createPresignedPutObjectUrl)({
            accessKeyId: config_1.AWS_ACCESS_KEY_ID,
            secretAccessKey: config_1.AWS_SECRET_ACCESS_KEY,
            region: config_1.AWS_REGION,
            bucket: config_1.AWS_S3_BUCKET,
            key,
            contentType,
            expiresInSeconds: 300,
        });
        return {
            uploadId: upload._id,
            key,
            url,
            uploadUrl,
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
            },
            expiresInSeconds: 300,
        };
    }
    async getUploadStatus({ uploadId, userId }) {
        const upload = await upload_models_1.uploadModel.findOne({
            _id: uploadId,
            owner: new mongoose_1.Types.ObjectId(userId),
        });
        if (!upload)
            throw new resHandle_1.NotFoundError('Upload not found');
        return { upload };
    }
    async verifyUpload({ key, bucket, etag, size }) {
        const upload = await upload_models_1.uploadModel.findOne({ key, bucket });
        if (!upload)
            throw new resHandle_1.NotFoundError('Upload not found');
        if (size !== undefined && size !== upload.size) {
            upload.status = upload_models_1.UploadStatus.rejected;
            await upload.save();
            throw new resHandle_1.BadRequestError('Uploaded file size does not match the requested upload');
        }
        upload.status = upload_models_1.UploadStatus.verified;
        upload.verifiedAt = new Date();
        if (etag !== undefined)
            upload.etag = etag;
        await upload.save();
        return { upload };
    }
}
exports.default = new UploadServices();
