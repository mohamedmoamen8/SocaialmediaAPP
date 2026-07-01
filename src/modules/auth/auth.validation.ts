
import { z } from 'zod';

export type schemaType = {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
};

export const signupSchema: schemaType = {
  body: z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    age: z.coerce.number().min(13).max(120).optional(),
    gender: z.coerce.number().min(0).max(1).optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }),
};
export const loginSchema: schemaType = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
};

export const otpSchema: schemaType = {
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
};

export const emailSchema: schemaType = {
  body: z.object({
    email: z.string().email(),
  }),
};

export const updatePasswordSchema: schemaType = {
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
  }),
};

export const resetPasswordSchema: schemaType = {
  body: z.object({
    email: z.string().email(),
    token: z.string(),
    newPassword: z.string().min(8),
  }),
};

export const twoFASchema: schemaType = {
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
};