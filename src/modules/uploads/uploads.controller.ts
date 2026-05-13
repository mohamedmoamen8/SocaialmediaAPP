import crypto from 'crypto';
import { Router } from 'express';
import { AWS_UPLOAD_VERIFY_SECRET } from '../../config';
import { authentication } from '../../middleware/auth.middleware';
import { validation } from '../../middleware/validation.middleware';
import { SuccessRes } from '../../utils/errorHandle/sucess.res';
import { AppError } from '../../utils/errorHandle/resHandle';
import uploadServices from './uploads.services';
import {
  createImageUploadSchema,
  uploadIdSchema,
  verifyUploadSchema,
} from './uploads.validation';

const router = Router();

const getParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== 'string') throw new AppError(`${name} is required`, 400);
  return value;
};

const verifyLambdaSecret = (providedSecret: string | undefined): void => {
  if (!AWS_UPLOAD_VERIFY_SECRET) {
    throw new AppError('Upload verification secret is not configured', 500);
  }

  if (!providedSecret) throw new AppError('Verification secret is required', 401);

  const expected = Buffer.from(AWS_UPLOAD_VERIFY_SECRET);
  const provided = Buffer.from(providedSecret);

  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    throw new AppError('Invalid verification secret', 401);
  }
};

router.post(
  '/images/presign',
  authentication,
  validation(createImageUploadSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const data = await uploadServices.createImageUpload({
        userId: req.user._id,
        fileName: req.body.fileName,
        contentType: req.body.contentType,
        size: req.body.size,
        purpose: req.body.purpose,
      });

      SuccessRes({ res, data, message: 'Image upload URL created', status: 201 });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:uploadId/status', authentication, validation(uploadIdSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await uploadServices.getUploadStatus({
      uploadId: getParam(req.params.uploadId, 'uploadId'),
      userId: req.user._id,
    });

    SuccessRes({ res, data, message: 'Upload status retrieved' });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', validation(verifyUploadSchema), async (req, res, next) => {
  try {
    verifyLambdaSecret(req.headers['x-upload-verify-secret'] as string | undefined);
    const data = await uploadServices.verifyUpload(req.body);
    SuccessRes({ res, data, message: 'Upload verified' });
  } catch (error) {
    next(error);
  }
});

export default router;
