import { userModel } from '../../db/models/user.models';
import {
  ISignupInput,
  ILoginInput,
  IResetPasswordInput,
  IUser, IGoogleAuthInput
} from '../users/user.types';
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
import { Model } from 'mongoose';


class AuthServices {
  private readonly model: Model<IUser>
  private readonly tokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly frontendUrl: string;

  constructor() {
    this.model = userModel;
    this.tokenSecret = TOKEN_SECRET;
    this.refreshTokenSecret = REFRESH_TOKEN_SECRET;
    this.frontendUrl = FRONTEND_URL;
  }

  

  private signTokens(
    _id: string,
    tokenVersion: number,
    role: number
  ): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { _id, tokenVersion, role },
      this.tokenSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { _id, tokenVersion, role },
      this.refreshTokenSecret,
      { expiresIn: '1d' }
    );

    return { accessToken, refreshToken };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  
  async signup({
    firstName,
    lastName,
    email,
    password,
    age,
    gender,
  }: ISignupInput) {
    const existingUser = await this.model.findOne({ email });
    if (existingUser) throw new ConflictError('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.model.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      ...(age !== undefined && { age }),
      ...(gender !== undefined && { gender }),
    });

    const otp = this.generateOTP();
    user.emailOtp = otp;
    user.emailOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp);

    return { message: 'OTP sent to your email' };
  }
  async googleAuth({
    firstName,
    lastName,
    email,
    isEmailConfirmed,
  }: IGoogleAuthInput) {
    let user = await this.model.findOne({ email });

    if (user) {
      if (user.provider === 'system') {
        throw new BadRequestError('Use system login');
      }
    } else {
      user = await this.model.create({
        firstName,
        lastName,
        email,
        provider: 'google',
        isEmailConfirmed,
      });
    }

    return this.signTokens(
      user._id.toString(),
      user.tokenVersion,
      user.role
    );
  }

  async confirmEmail({ email, otp }: { email: string; otp: string }) {
    const user = await this.model
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
  }

  
  async resendOtp({ email }: { email: string }) {
    const user = await this.model
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

    const otp = this.generateOTP();
    user.emailOtp = otp;
    user.emailOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.lastOtpSentAt = new Date();
    user.otpResendCount += 1;
    await user.save();

    await sendOTPEmail(email, otp);

    return { message: `OTP resent (${user.otpResendCount}/5 attempts used)` };
  }

 
  async login({ email, password }: ILoginInput) {
    const user = await this.model
      .findOne({ email })
      .select('password provider isEmailConfirmed isTwoFactorEnabled tokenVersion role');

    if (!user) throw new BadRequestError('Invalid credentials');
    if (user.provider !== 'system') throw new BadRequestError('Use Google login');
    if (!user.isEmailConfirmed) throw new BadRequestError('Please confirm your email first');

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) throw new BadRequestError('Invalid credentials');

    if (user.isTwoFactorEnabled) {
      const otp = this.generateOTP();
      user.twoFactorOTP = otp;
      user.twoFactorOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      await sendOTPEmail(email, otp);

      return {
        twoFactorRequired: true,
        message: 'OTP sent to your email',
      };
    }

    return this.signTokens(
      user._id.toString(),
      user.tokenVersion,
      user.role
    );
  }
  

 
  

  
  async forgetPassword({ email }: { email: string }) {
    const user = await this.model
      .findOne({ email })
      .select('email provider resetPasswordToken resetPasswordTokenExpires');

    if (!user) throw new NotFoundError('User not found');
    if (user.provider !== 'system') {
      throw new BadRequestError('Google accounts cannot reset password');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(resetToken);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}&email=${email}`;
    await sendResetPasswordEmail(email, resetLink);

    return { message: 'Password reset link sent to your email' };
  }

  
  async resetPassword({ email, token, newPassword }: IResetPasswordInput) {
    const hashedToken = this.hashToken(token);

    const user = await this.model
      .findOne({ email })
      .select('resetPasswordToken resetPasswordTokenExpires tokenVersion password');

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
  }

  
  async logout({ token }: { token: string }) {
    const decoded = jwt.decode(token) as { exp: number } | null;
    if (!decoded) throw new BadRequestError('Invalid token');

    const ttl = Math.ceil(decoded.exp - Date.now() / 1000);
    if (ttl > 0) {
      await redisClient.setEx(`blacklist_${token}`, ttl, 'true');
    }

    return { message: 'Logged out successfully' };
  }

  
  async logoutAllDevices({ userId }: { userId: string }) {
    const user = await this.model
      .findById(userId)
      .select('tokenVersion');

    if (!user) throw new NotFoundError('User not found');

    user.tokenVersion += 1;
    await user.save();

    return { message: 'Logged out from all devices successfully' };
  }
}

export default new AuthServices();