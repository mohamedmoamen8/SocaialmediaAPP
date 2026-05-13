import { z } from 'zod';
import { ValidationSchema } from '../../middleware/validation.middleware';
import { UploadPurpose } from '../../db/models/upload.models';

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export const createImageUploadSchema: ValidationSchema = {
  body: z.object({
    fileName: z.string().min(1).max(160),
    contentType: z.enum(allowedImageTypes),
    size: z.number().int().min(1).max(5 * 1024 * 1024),
    purpose: z.enum([
      UploadPurpose.profilePicture,
      UploadPurpose.coverPicture,
      UploadPurpose.postImage,
      UploadPurpose.storyImage,
    ]),
  }),
};

export const uploadIdSchema: ValidationSchema = {
  params: z.object({
    uploadId: mongoIdSchema,
  }),
};

export const verifyUploadSchema: ValidationSchema = {
  body: z.object({
    key: z.string().min(1),
    bucket: z.string().min(1),
    etag: z.string().optional(),
    size: z.number().int().min(1).optional(),
  }),
};
