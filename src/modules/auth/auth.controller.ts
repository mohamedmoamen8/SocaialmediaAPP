import { Router } from 'express';
import { validation } from '../../middleware/validation.middleware';
import { SuccessRes } from '../../utils/errorHandle/sucess.res';
import { authentication } from '../../middleware/auth.middleware';
import authServices from './auth.services';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID } from '../../config';
import { AppError } from '../../utils/errorHandle/resHandle';
import { signupSchema, loginSchema, otpSchema, emailSchema,  resetPasswordSchema } from './auth.validation';
const router = Router();
const client = new OAuth2Client(GOOGLE_CLIENT_ID);




router.post('/signup', validation(signupSchema), async (req, res, next) => {
  try {
    const data = await authServices.signup(req.body);
    SuccessRes({ res, data, message: 'User registered successfully', status: 201 });
  } catch (error) {
    next(error);
  }
});


router.post('/confirm-email', validation(otpSchema), async (req, res, next) => {
  try {
    const { email, otp } = req.body as { email: string; otp: string };
    const data = await authServices.confirmEmail({ email, otp });
    SuccessRes({ res, data, message: 'Email confirmed' });
  } catch (error) {
    next(error);
  }
});


router.post('/resend-otp', validation(emailSchema), async (req, res, next) => {
  try {
    const { email } = req.body as { email: string };
    const data = await authServices.resendOtp({ email });
    SuccessRes({ res, data, message: 'OTP resent' });
  } catch (error) {
    next(error);
  }
});


router.post('/login', validation(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const data = await authServices.login({ email, password });
    SuccessRes({ res, data, message: 'Login successful' });
  } catch (error) {
    next(error);
  }
});


router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body as { idToken: string };

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google token');

    const nameParts = (payload.name ?? '').split(' ');
    const firstName = nameParts[0] ?? 'User';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const data = await authServices.googleAuth({
      firstName,
      lastName,
      email: payload.email as string,
      isEmailConfirmed: payload.email_verified ?? false,
    });

    SuccessRes({ res, data, message: 'Google auth successful' });
  } catch (error) {
    next(error);
  }
});




router.post('/forget-password', validation(emailSchema), async (req, res, next) => {
  try {
    const { email } = req.body as { email: string };
    const data = await authServices.forgetPassword({ email });
    SuccessRes({ res, data, message: 'Reset link sent' });
  } catch (error) {
    next(error);
  }
});


router.patch('/reset-password', validation(resetPasswordSchema), async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body as {
      email: string;
      token: string;
      newPassword: string;
    };
    const data = await authServices.resetPassword({ email, token, newPassword });
    SuccessRes({ res, data, message: 'Password reset' });
  } catch (error) {
    next(error);
  }
});


router.post('/logout', authentication, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new AppError('Authorization header missing', 401);
    
    const token = authHeader.split(' ')[1];
    if (!token) throw new AppError('Token missing', 401);

    const data = await authServices.logout({ token });
    SuccessRes({ res, data, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
});


router.post('/logout/all', authentication, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const data = await authServices.logoutAllDevices({ 
      userId: req.user._id 
    });
    SuccessRes({ res, data, message: 'Logged out from all devices' });
  } catch (error) {
    next(error);
  }
});

export default router;