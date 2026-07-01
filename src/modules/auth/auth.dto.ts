import { z } from 'zod';
import {
  signupSchema,
  loginSchema,
  otpSchema,
  emailSchema,
  resetPasswordSchema,
} from './auth.validation';
import { TokenPayload } from 'google-auth-library';

/**
 * @swagger
 * components:
 *   schemas:
 *     SignUp:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *
 *     ConfirmEmail:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         otp:
 *           type: string
 *
 *     ResendOTP:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *
 *     ForgetPassword:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *
 *     ResetPassword:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         otp:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
export type SignupDto = z.infer<typeof signupSchema.body>;
export type LoginDto = z.infer<typeof loginSchema.body>;
export type ConfirmEmailDto = z.infer<typeof otpSchema.body>;
export type ResendOtpDto = z.infer<typeof emailSchema.body>;
export type ForgetPasswordDto = z.infer<typeof emailSchema.body>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema.body>;
export type GoogleAuthDto = TokenPayload;
export interface LogoutDto {
  token: string;
}