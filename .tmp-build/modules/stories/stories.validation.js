"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyIdSchema = exports.createStorySchema = void 0;
const zod_1 = require("zod");
const mongoIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
exports.createStorySchema = {
    body: zod_1.z.object({
        mediaUrl: zod_1.z.string().url('mediaUrl must be a valid URL'),
        caption: zod_1.z.string().max(200).optional(),
    }),
};
exports.storyIdSchema = {
    params: zod_1.z.object({
        storyId: mongoIdSchema,
    }),
};
