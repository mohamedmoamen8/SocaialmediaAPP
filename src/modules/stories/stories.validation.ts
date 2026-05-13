import { z } from 'zod';
import { ValidationSchema } from '../../middleware/validation.middleware';

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createStorySchema: ValidationSchema = {
  body: z.object({
    mediaUrl: z.string().url('mediaUrl must be a valid URL'),
    caption: z.string().max(200).optional(),
  }),
};

export const storyIdSchema: ValidationSchema = {
  params: z.object({
    storyId: mongoIdSchema,
  }),
};
