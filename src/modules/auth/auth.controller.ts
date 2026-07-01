import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { validation } from '../../middleware/validation.middleware';
import { SuccessRes } from '../../utils/errorHandle/sucess.res';
import { authentication } from '../../middleware/auth.middleware';
import authServices from './auth.services';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID } from '../../config';
import { signupSchema, loginSchema, otpSchema, emailSchema, resetPasswordSchema, twoFASchema } from './auth.validation';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => 
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

const router = Router();
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { errMsg: 'Too many requests, please try again later', status: 429 },
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { errMsg: 'Too many OTP attempts, please wait', status: 429 },
});




/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUp'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/signup', authLimiter, validation(signupSchema), asyncHandler(async (req, res) => {
  const data = await authServices.signup(req.body);
  SuccessRes({ res, data, message: 'User registered successfully', status: 201 });
}));

/**
 * @swagger
 * /auth/confirm-email:
 *   post:
 *     summary: Confirm user email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmEmail'
 *     responses:
 *       200:
 *         description: Email confirmed
 *       400:
 *         description: Bad request
 */
router.post('/confirm-email', otpLimiter, validation(otpSchema), asyncHandler(async (req, res) => {
  const data = await authServices.confirmEmail(req.body);
  SuccessRes({ res, data, message: 'Email confirmed' });
}));

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendOTP'
 *     responses:
 *       200:
 *         description: OTP resent
 *       400:
 *         description: Bad request
 */
router.post('/resend-otp', otpLimiter, validation(emailSchema), asyncHandler(async (req, res) => {
  const data = await authServices.resendOtp(req.body);
  SuccessRes({ res, data, message: 'OTP resent' });
}));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Bad request
 */
router.post('/login', authLimiter, validation(loginSchema), asyncHandler(async (req, res) => {
  const data = await authServices.login(req.body);
  SuccessRes({ res, data, message: 'Login successful' });
}));

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Authenticate with Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google auth successful
 *       400:
 *         description: Bad request
 */
router.post('/google', asyncHandler(async (req, res) => {
  const { idToken } = req.body as { idToken: string };

  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new Error('Invalid Google token');

  const data = await authServices.googleAuth(payload);
  SuccessRes({ res, data, message: 'Google auth successful' });
}));

/**
 * @swagger
 * /auth/forget-password:
 *   post:
 *     summary: Send password reset link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgetPassword'
 *     responses:
 *       200:
 *         description: Reset link sent
 *       400:
 *         description: Bad request
 */
router.post('/forget-password', authLimiter, validation(emailSchema), asyncHandler(async (req, res) => {
  const data = await authServices.forgetPassword(req.body);
  SuccessRes({ res, data, message: 'Reset link sent' });
}));

/**
 * @swagger
 * /auth/reset-password:
 *   patch:
 *     summary: Reset user password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: Password reset
 *       400:
 *         description: Bad request
 */
router.patch('/reset-password', validation(resetPasswordSchema), asyncHandler(async (req, res) => {
  const data = await authServices.resetPassword(req.body);
  SuccessRes({ res, data, message: 'Password reset' });
}));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authentication, asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Malformed token');

  const data = await authServices.logout({ token });
  SuccessRes({ res, data, message: 'Logged out' });
}));

/**
 * @swagger
 * /auth/logout/all:
 *   post:
 *     summary: Log out from all devices
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *       401:
 *         description: Unauthorized
 */
router.post('/logout/all', authentication, asyncHandler(async (req, res) => {
  // req.user is guaranteed to be present by the authentication middleware
  const data = await authServices.logoutAllDevices({ 
    userId: req.user!._id 
  });
  SuccessRes({ res, data, message: 'Logged out from all devices' });
}));

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *       401:
 *         description: Unauthorized
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) throw new Error('Refresh token is required');
  const data = await authServices.refreshToken(refreshToken);
  SuccessRes({ res, data, message: 'Tokens refreshed' });
}));

/**
 * @swagger
 * /auth/2fa/verify:
 *   post:
 *     summary: Verify 2FA OTP and get tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmEmail'
 *     responses:
 *       200:
 *         description: 2FA verified, tokens issued
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/2fa/verify', otpLimiter, validation(twoFASchema), asyncHandler(async (req, res) => {
  const data = await authServices.verifyTwoFactor(req.body);
  SuccessRes({ res, data, message: '2FA verified' });
}));


export default router;