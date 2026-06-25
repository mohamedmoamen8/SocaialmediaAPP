"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = require("express");
const config_1 = require("../../config");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const sucess_res_1 = require("../../utils/errorHandle/sucess.res");
const resHandle_1 = require("../../utils/errorHandle/resHandle");
const uploads_services_1 = __importDefault(require("./uploads.services"));
const uploads_validation_1 = require("./uploads.validation");
const router = (0, express_1.Router)();
const getParam = (value, name) => {
    if (typeof value !== 'string')
        throw new resHandle_1.AppError(`${name} is required`, 400);
    return value;
};
const verifyLambdaSecret = (providedSecret) => {
    if (!config_1.AWS_UPLOAD_VERIFY_SECRET) {
        throw new resHandle_1.AppError('Upload verification secret is not configured', 500);
    }
    if (!providedSecret)
        throw new resHandle_1.AppError('Verification secret is required', 401);
    const expected = Buffer.from(config_1.AWS_UPLOAD_VERIFY_SECRET);
    const provided = Buffer.from(providedSecret);
    if (expected.length !== provided.length || !crypto_1.default.timingSafeEqual(expected, provided)) {
        throw new resHandle_1.AppError('Invalid verification secret', 401);
    }
};
router.post('/images/presign', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(uploads_validation_1.createImageUploadSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await uploads_services_1.default.createImageUpload({
            userId: req.user._id,
            fileName: req.body.fileName,
            contentType: req.body.contentType,
            size: req.body.size,
            purpose: req.body.purpose,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Image upload URL created', status: 201 });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:uploadId/status', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(uploads_validation_1.uploadIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await uploads_services_1.default.getUploadStatus({
            uploadId: getParam(req.params.uploadId, 'uploadId'),
            userId: req.user._id,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Upload status retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/verify', (0, validation_middleware_1.validation)(uploads_validation_1.verifyUploadSchema), async (req, res, next) => {
    try {
        verifyLambdaSecret(req.headers['x-upload-verify-secret']);
        const data = await uploads_services_1.default.verifyUpload(req.body);
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Upload verified' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
