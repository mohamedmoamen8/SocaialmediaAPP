"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamSchema = exports.reactPostSchema = exports.updateCommentSchema = exports.commentIdSchema = exports.addCommentSchema = exports.postIdSchema = exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
const posts_models_1 = require("../../db/models/posts.models");
const mongoIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
exports.createPostSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200),
        body: zod_1.z.string().min(1, 'Body is required'),
    }),
};
exports.updatePostSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200).optional(),
        body: zod_1.z.string().min(1).optional(),
    }),
    params: zod_1.z.object({
        postId: mongoIdSchema,
    }),
};
exports.postIdSchema = {
    params: zod_1.z.object({
        postId: mongoIdSchema,
    }),
};
exports.addCommentSchema = {
    body: zod_1.z.object({
        text: zod_1.z.string().min(1, 'Comment cannot be empty'),
    }),
    params: zod_1.z.object({
        postId: mongoIdSchema,
    }),
};
exports.commentIdSchema = {
    params: zod_1.z.object({
        postId: mongoIdSchema,
        commentId: mongoIdSchema,
    }),
};
exports.updateCommentSchema = {
    body: zod_1.z.object({
        text: zod_1.z.string().min(1, 'Comment cannot be empty'),
    }),
    params: zod_1.z.object({
        postId: mongoIdSchema,
        commentId: mongoIdSchema,
    }),
};
exports.reactPostSchema = {
    body: zod_1.z.object({
        emoji: zod_1.z.enum(posts_models_1.allowedReactionEmojis),
    }),
    params: zod_1.z.object({
        postId: mongoIdSchema,
    }),
};
exports.userIdParamSchema = {
    params: zod_1.z.object({
        userId: mongoIdSchema,
    }),
};
