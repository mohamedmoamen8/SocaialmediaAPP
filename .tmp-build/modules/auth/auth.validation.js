"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.updatePasswordSchema = exports.emailSchema = exports.otpSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = {
    body: zod_1.z.object({
        username: zod_1.z.string().min(5).max(100),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
        repeatdpassword: zod_1.z.string().min(8),
        age: zod_1.z.coerce.number().optional(),
        gender: zod_1.z.coerce.number().optional(),
    }).refine((data) => {
        if (data.password !== data.repeatdpassword) {
            return false;
        }
        else {
            return true;
        }
    }, {
        error: "Passwords don't match"
    })
};
exports.loginSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
    }),
};
exports.otpSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        otp: zod_1.z.string().length(6),
    }),
};
exports.emailSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
    }),
};
exports.updatePasswordSchema = {
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(8),
        newPassword: zod_1.z.string().min(8),
    }),
};
exports.resetPasswordSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        token: zod_1.z.string(),
        newPassword: zod_1.z.string().min(8),
    }),
};
