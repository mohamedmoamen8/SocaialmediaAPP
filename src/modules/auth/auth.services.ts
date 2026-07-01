import { userModel } from '../../db/models/user.models';
import {
  SignupDto,
  LoginDto,
  ResetPasswordDto,
  ConfirmEmailDto,
  ResendOtpDto,
  ForgetPasswordDto,
  LogoutDto,
} from './auth.dto';
import { IUser } from '../../db/models/user.models';
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
import { verifyRefreshToken} from '../../security/authToken';
import { sendOTPEmail, sendResetPasswordEmail } from '../../utils/emailService/email';
import redisClient from '../../utils/redisClient';
import { TokenPayload } from 'google-auth-library'; 
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

  
  async signup(dto: SignupDto & { firstName: string; lastName: string; email: string; password: string; age?: number; gender?: number }) {
    const { firstName, lastName, email, password, age, gender } = dto;
    const existingUser = await this.model.findOne({ email: email });
    if (existingUser) throw new ConflictError('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new this.model({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      provider: 'system',
      age: age,
      gender: gender,
    });

    const otp = this.generateOTP();
    user.emailOtp = otp;
    user.emailOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp);

    return { message: 'OTP sent to your email' };
  }
  async googleAuth(payload: TokenPayload) {
    const { email, email_verified: isEmailConfirmed } = payload;
    if (!email) throw new BadRequestError('Email not found in Google token');

    const nameParts = (payload.name ?? '').split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || firstName;

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
        isEmailConfirmed: isEmailConfirmed ?? false,
      });
    }

    return this.signTokens(
      user._id.toString(),
      user.tokenVersion,
      user.role
    );
  }

  async confirmEmail(dto: ConfirmEmailDto) {
    const { email, otp } = dto as { email: string; otp: string };
    const user = await this.model
      .findOne({ email: email })
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

  
  async resendOtp(dto: ResendOtpDto) {
    const { email } = dto as { email: string };
    const user = await this.model
      .findOne({ email: email })
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

 
  async login(dto: LoginDto) {
    const { email, password } = dto as { email: string; password: string };
    const user = await this.model
      .findOne({ email: email })
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
  

 
  

  
  async forgetPassword(dto: ForgetPasswordDto) {
    const { email } = dto as { email: string };
    const user = await this.model
      .findOne({ email: email })
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

  
  async resetPassword(dto: ResetPasswordDto) {
    const { email, token, newPassword } = dto as { email: string; token: string; newPassword: string };
    const hashedToken = this.hashToken(token);

    const user = await this.model
      .findOne({ email: email })
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

  
  async logout(dto: LogoutDto) {
    const decoded = jwt.decode(dto.token) as { exp: number } | null;
    if (!decoded) throw new BadRequestError('Invalid token');

    const ttl = Math.ceil(decoded.exp - Date.now() / 1000);
    if (ttl > 0) {
      await redisClient.setEx(`blacklist_${dto.token}`, ttl, 'true');
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
  async refreshToken(refreshToken: string) {
    const decoded = await verifyRefreshToken(refreshToken);

    // one-time use: blacklist this refresh token so it can't be replayed
    const payload = jwt.decode(refreshToken) as { exp: number } | null;
    if (payload?.exp) {
      const ttl = Math.ceil(payload.exp - Date.now() / 1000);
      if (ttl > 0) {
        await redisClient.setEx(`blacklist_${refreshToken}`, ttl, 'true');
      }
    }

    return this.signTokens(decoded._id, decoded.tokenVersion, decoded.role);
  }

  async verifyTwoFactor(dto: { email: string; otp: string }) {
    const user = await this.model
      .findOne({ email: dto.email })
      .select('twoFactorOTP twoFactorOTPExpires tokenVersion role');

    if (!user) throw new NotFoundError('User not found');
    if (user.twoFactorOTP !== dto.otp) throw new BadRequestError('Invalid OTP');
    if (!user.twoFactorOTPExpires || Date.now() > user.twoFactorOTPExpires.getTime()) {
      throw new BadRequestError('OTP expired');
    }

    user.twoFactorOTP = null;
    user.twoFactorOTPExpires = null;
    await user.save();

    return this.signTokens(user._id.toString(), user.tokenVersion, user.role);
  }
}

export default new AuthServices();