"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUploadSchema = exports.uploadIdSchema = exports.createImageUploadSchema = void 0;
const zod_1 = require("zod");
const upload_models_1 = require("../../db/models/upload.models");
const mongoIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
exports.createImageUploadSchema = {
    body: zod_1.z.object({
        fileName: zod_1.z.string().min(1).max(160),
        contentType: zod_1.z.enum(allowedImageTypes),
        size: zod_1.z.number().int().min(1).max(5 * 1024 * 1024),
        purpose: zod_1.z.enum([
            upload_models_1.UploadPurpose.profilePicture,
            upload_models_1.UploadPurpose.coverPicture,
            upload_models_1.UploadPurpose.postImage,
            upload_models_1.UploadPurpose.storyImage,
        ]),
    }),
};
exports.uploadIdSchema = {
    params: zod_1.z.object({
        uploadId: mongoIdSchema,
    }),
};
exports.verifyUploadSchema = {
    body: zod_1.z.object({
        key: zod_1.z.string().min(1),
        bucket: zod_1.z.string().min(1),
        etag: zod_1.z.string().optional(),
        size: zod_1.z.number().int().min(1).optional(),
    }),
};
