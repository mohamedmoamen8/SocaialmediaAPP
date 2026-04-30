
import { z } from 'zod';

export type schemaType = {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
};

export const signupSchema: schemaType = {
  body: z.object({
    username: z.string().min(5).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    repeatdpassword: z.string().min(8),
    age: z.coerce.number().optional(),
    gender: z.coerce.number().optional(),
  }).refine((data)=>{
     if(data.password !== data.repeatdpassword){
      return false;
     } else {return true
     }
    },
     {
      error: "Passwords don't match"})
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