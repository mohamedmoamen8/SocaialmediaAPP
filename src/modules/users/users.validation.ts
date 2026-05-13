import { z } from 'zod';
import { ValidationSchema } from '../../middleware/validation.middleware';
import { Gender } from './user.types';

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const userIdSchema: ValidationSchema = {
  params: z.object({
    userId: mongoIdSchema,
  }),
};

export const updateUserSchema: ValidationSchema = {
  body: z.object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(3).max(50).optional(),
    age: z.number().int().min(13).max(120).optional(),
    gender: z.union([z.literal(Gender.male), z.literal(Gender.female)]).optional(),
    profilePicture: z.string().url().nullable().optional(),
    coverPictures: z.array(z.string().url()).optional(),
  }),
};
