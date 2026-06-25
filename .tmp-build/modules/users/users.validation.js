"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.userIdSchema = void 0;
const zod_1 = require("zod");
const user_types_1 = require("./user.types");
const mongoIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
exports.userIdSchema = {
    params: zod_1.z.object({
        userId: mongoIdSchema,
    }),
};
exports.updateUserSchema = {
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2).max(50).optional(),
        lastName: zod_1.z.string().min(3).max(50).optional(),
        age: zod_1.z.number().int().min(13).max(120).optional(),
        gender: zod_1.z.union([zod_1.z.literal(user_types_1.Gender.male), zod_1.z.literal(user_types_1.Gender.female)]).optional(),
        profilePicture: zod_1.z.string().url().nullable().optional(),
        coverPictures: zod_1.z.array(zod_1.z.string().url()).optional(),
    }),
};
