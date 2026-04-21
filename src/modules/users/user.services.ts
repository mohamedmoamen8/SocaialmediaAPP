import { userModel } from '../../db/models/user.models';
import {
  ISignupInput,
  ILoginInput,
  IUpdatePasswordInput,
  IResetPasswordInput,
} from './user.types';
import {
  
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../utils/errorHandle/resHandle';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  FRONTEND_URL,
} from '../../config';
import { sendOTPEmail, sendResetPasswordEmail } from '../../utils/emailService/email';
import redisClient from '../../utils/redisClient';


const signTokens = (
  _id: string,
  tokenVersion: number,
  role: number
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    { _id, tokenVersion, role },
    TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { _id, tokenVersion, role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' }
  );

  return { accessToken, refreshToken };
};


const signup = async ({
  firstName,
  lastName,
  email,
  password,
  age,
  gender,
}: ISignupInput) => {
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

const user = await userModel.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    ...(age !== undefined && { age }),         
    ...(gender !== undefined && { gender }),  
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailOtp = otp;
  user.emailOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  await sendOTPEmail(email, otp);

  return { message: 'OTP sent to your email' };
};



const confirmEmail = async ({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) => {
  const user = await userModel
    .findOne({ email })
    .select('emailOtp emailOTPExpires isEmailConfirmed');

  if (!user) throw new NotFoundError('User not found');
  if (user.isEmailConfirmed) throw new BadRequestError('Email already confirmed');
  if (user.emailOtp !== otp) throw new BadRequestError('Invalid OTP');
  if (!user.emailOTPExpires || Date.now() > user.emailOTPExpires.getTime()) {
    throw new BadRequestError('OTP expired');
  }

  user.isEmailConfirmed = true;
  user.emailOtp = null;
  user.emailOTPExpires = null;
  await user.save();

  return { message: 'Email confirmed successfully' };
};


const login = async ({ email, password }: ILoginInput) => {
  const user = await userModel
    .findOne({ email })
    .select('password provider isEmailConfirmed isTwoFactorEnabled tokenVersion role firstName lastName');

  if (!user) throw new BadRequestError('Invalid credentials');
  if (user.provider !== 'system') throw new BadRequestError('Use Google login');
  if (!user.isEmailConfirmed) throw new BadRequestError('Please confirm your email first');

  const isMatch = await bcrypt.compare(password, user.password as string);
  if (!isMatch) throw new BadRequestError('Invalid credentials');

  // 2FA enabled → send OTP, no tokens yet
  if (user.isTwoFactorEnabled) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorOTP = otp;
    user.twoFactorOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    await sendOTPEmail(email, otp);

    return {
      twoFactorRequired: true,
      message: 'OTP sent to your email',
    };
  }

  const { accessToken, refreshToken } = signTokens(
    user._id.toString(),
    user.tokenVersion,
    user.role
  );

  return { accessToken, refreshToken };
};


const resendOtp = async ({ email }: { email: string }) => {
  const user = await userModel
    .findOne({ email })
    .select('isEmailConfirmed lastOtpSentAt otpResendCount emailOtp emailOTPExpires');

  if (!user) throw new NotFoundError('User not found');
  if (user.isEmailConfirmed) throw new BadRequestError('Email already confirmed');

  if (user.lastOtpSentAt) {
    const secondsSince = (Date.now() - user.lastOtpSentAt.getTime()) / 1000;
    if (secondsSince < 60) {
      throw new BadRequestError(
        `Please wait ${Math.ceil(60 - secondsSince)} seconds`
      );
    }
  }

  if (user.otpResendCount >= 5) {
    throw new BadRequestError('Maximum OTP resend limit reached');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailOtp = otp;
  user.emailOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
  user.lastOtpSentAt = new Date();
  user.otpResendCount += 1;
  await user.save();

  await sendOTPEmail(email, otp);

  return { message: `OTP resent (${user.otpResendCount}/5 attempts used)` };
};

const googleAuth = async ({
  firstName,
  lastName,
  email,
  isEmailConfirmed,
}: {
  firstName: string;
  lastName: string;
  email: string;
  isEmailConfirmed: boolean;
}) => {
  let user = await userModel.findOne({ email });

  if (user) {
    if (user.provider === 'system') {
      throw new BadRequestError('Use system login');
    }
  } else {
    user = await userModel.create({
      firstName,
      lastName,
      email,
      provider: 'google',
      isEmailConfirmed,
    });
  }

  const { accessToken, refreshToken } = signTokens(
    user._id.toString(),
    user.tokenVersion,
    user.role
  );

  return { accessToken, refreshToken };
};

const updatePassword = async ({
  userId,
  currentPassword,
  newPassword,
}: IUpdatePasswordInput) => {
  const user = await userModel.findById(userId).select('password provider');
  if (!user) throw new NotFoundError('User not found');
  if (user.provider !== 'system') {
    throw new BadRequestError('Google accounts cannot update password');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password as string);
  if (!isMatch) throw new BadRequestError('Current password is incorrect');

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return { message: 'Password updated successfully' };
};


const forgetPassword = async ({ email }: { email: string }) => {
  const user = await userModel.findOne({ email }).select('email provider');
  if (!user) throw new NotFoundError('User not found');
  if (user.provider !== 'system') {
    throw new BadRequestError('Google accounts cannot reset password');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
  await sendResetPasswordEmail(email, resetLink);

  return { message: 'Password reset link sent to your email' };
};

const resetPassword = async ({
  email,
  token,
  newPassword,
}: IResetPasswordInput) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await userModel
    .findOne({ email })
    .select('resetPasswordToken resetPasswordTokenExpires tokenVersion');

  if (!user) throw new NotFoundError('User not found');
  if (user.resetPasswordToken !== hashedToken) {
    throw new BadRequestError('Invalid reset link');
  }
  if (
    !user.resetPasswordTokenExpires ||
    Date.now() > user.resetPasswordTokenExpires.getTime()
  ) {
    throw new BadRequestError('Reset link has expired');
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpires = null;
  user.tokenVersion += 1;
  await user.save();

  return { message: 'Password reset successfully, please login again' };
};


const logout = async ({ token }: { token: string }) => {
  const decoded = jwt.decode(token) as { exp: number } | null;
  if (!decoded) throw new BadRequestError('Invalid token');

  const ttl = Math.ceil(decoded.exp - Date.now() / 1000);
  if (ttl > 0) {
    await redisClient.setEx(`blacklist_${token}`, ttl, 'true'); // ✅ works now
  }

  return { message: 'Logged out successfully' };
};


const logoutAllDevices = async ({ userId }: { userId: string }) => {
  const user = await userModel.findById(userId).select('tokenVersion');
  if (!user) throw new NotFoundError('User not found');

  user.tokenVersion += 1;
  await user.save();

  return { message: 'Logged out from all devices successfully' };
};


const userServices = {
  signup,
  confirmEmail,
  login,
  resendOtp,
  googleAuth,
  updatePassword,
  forgetPassword,
  resetPassword,
  logout,
  logoutAllDevices,
};

export default userServices;