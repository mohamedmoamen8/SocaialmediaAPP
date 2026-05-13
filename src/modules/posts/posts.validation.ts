import { z } from 'zod';
import { ValidationSchema } from '../../middleware/validation.middleware';
import { allowedReactionEmojis } from '../../db/models/posts.models';
const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createPostSchema: ValidationSchema = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    body: z.string().min(1, 'Body is required'),
  }),
};

export const updatePostSchema: ValidationSchema = {
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    body: z.string().min(1).optional(),
  }),
  params: z.object({
    postId: mongoIdSchema,
  }),
};

export const postIdSchema: ValidationSchema = {
  params: z.object({
    postId: mongoIdSchema,
  }),
};

export const addCommentSchema: ValidationSchema = {
  body: z.object({
    text: z.string().min(1, 'Comment cannot be empty'), 
  }),
  params: z.object({
    postId: mongoIdSchema,
  }),
};

export const commentIdSchema: ValidationSchema = {
  params: z.object({
    postId: mongoIdSchema,
    commentId: mongoIdSchema,
  }),
};

export const updateCommentSchema: ValidationSchema = {
  body: z.object({
    text: z.string().min(1, 'Comment cannot be empty'),
  }),
  params: z.object({
    postId: mongoIdSchema,
    commentId: mongoIdSchema,
  }),
};

export const reactPostSchema: ValidationSchema = {
  body: z.object({
    emoji: z.enum(allowedReactionEmojis),
  }),
  params: z.object({
    postId: mongoIdSchema,
  }),
};

export const userIdParamSchema: ValidationSchema = {
  params: z.object({
    userId: mongoIdSchema,
  }),
};
