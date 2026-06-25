"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_models_1 = require("../../db/models/user.models");
const resHandle_1 = require("../../utils/errorHandle/resHandle");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../config");
const email_1 = require("../../utils/emailService/email");
const redisClient_1 = __importDefault(require("../../utils/redisClient"));
class AuthServices {
    model;
    tokenSecret;
    refreshTokenSecret;
    frontendUrl;
    constructor() {
        this.model = user_models_1.userModel;
        this.tokenSecret = config_1.TOKEN_SECRET;
        this.refreshTokenSecret = config_1.REFRESH_TOKEN_SECRET;
        this.frontendUrl = config_1.FRONTEND_URL;
    }
    signTokens(_id, tokenVersion, role) {
        const accessToken = jsonwebtoken_1.default.sign({ _id, tokenVersion, role }, this.tokenSecret, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ _id, tokenVersion, role }, this.refreshTokenSecret, { expiresIn: '1d' });
        return { accessToken, refreshToken };
    }
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    async signup({ firstName, lastName, email, password, age, gender, }) {
        const existingUser = await this.model.findOne({ email });
        if (existingUser)
            throw new resHandle_1.ConflictError('Email already exists');
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
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
        await (0, email_1.sendOTPEmail)(email, otp);
        return { message: 'OTP sent to your email' };
    }
    async googleAuth({ firstName, lastName, email, isEmailConfirmed, }) {
        let user = await this.model.findOne({ email });
        if (user) {
            if (user.provider === 'system') {
                throw new resHandle_1.BadRequestError('Use system login');
            }
        }
        else {
            user = await this.model.create({
                firstName,
                lastName,
                email,
                provider: 'google',
                isEmailConfirmed,
            });
        }
        return this.signTokens(user._id.toString(), user.tokenVersion, user.role);
    }
    async confirmEmail({ email, otp }) {
        const user = await this.model
            .findOne({ email })
            .select('emailOtp emailOTPExpires isEmailConfirmed');
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        if (user.isEmailConfirmed)
            throw new resHandle_1.BadRequestError('Email already confirmed');
        if (user.emailOtp !== otp)
            throw new resHandle_1.BadRequestError('Invalid OTP');
        if (!user.emailOTPExpires || Date.now() > user.emailOTPExpires.getTime()) {
            throw new resHandle_1.BadRequestError('OTP expired');
        }
        user.isEmailConfirmed = true;
        user.emailOtp = null;
        user.emailOTPExpires = null;
        await user.save();
        return { message: 'Email confirmed successfully' };
    }
    async resendOtp({ email }) {
        const user = await this.model
            .findOne({ email })
            .select('isEmailConfirmed lastOtpSentAt otpResendCount emailOtp emailOTPExpires');
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        if (user.isEmailConfirmed)
            throw new resHandle_1.BadRequestError('Email already confirmed');
        if (user.lastOtpSentAt) {
            const secondsSince = (Date.now() - user.lastOtpSentAt.getTime()) / 1000;
            if (secondsSince < 60) {
                throw new resHandle_1.BadRequestError(`Please wait ${Math.ceil(60 - secondsSince)} seconds`);
            }
        }
        if (user.otpResendCount >= 5) {
            throw new resHandle_1.BadRequestError('Maximum OTP resend limit reached');
        }
        const otp = this.generateOTP();
        user.emailOtp = otp;
        user.emailOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
        user.lastOtpSentAt = new Date();
        user.otpResendCount += 1;
        await user.save();
        await (0, email_1.sendOTPEmail)(email, otp);
        return { message: `OTP resent (${user.otpResendCount}/5 attempts used)` };
    }
    async login({ email, password }) {
        const user = await this.model
            .findOne({ email })
            .select('password provider isEmailConfirmed isTwoFactorEnabled tokenVersion role');
        if (!user)
            throw new resHandle_1.BadRequestError('Invalid credentials');
        if (user.provider !== 'system')
            throw new resHandle_1.BadRequestError('Use Google login');
        if (!user.isEmailConfirmed)
            throw new resHandle_1.BadRequestError('Please confirm your email first');
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch)
            throw new resHandle_1.BadRequestError('Invalid credentials');
        if (user.isTwoFactorEnabled) {
            const otp = this.generateOTP();
            user.twoFactorOTP = otp;
            user.twoFactorOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
            await user.save();
            await (0, email_1.sendOTPEmail)(email, otp);
            return {
                twoFactorRequired: true,
                message: 'OTP sent to your email',
            };
        }
        return this.signTokens(user._id.toString(), user.tokenVersion, user.role);
    }
    async forgetPassword({ email }) {
        const user = await this.model
            .findOne({ email })
            .select('email provider resetPasswordToken resetPasswordTokenExpires');
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        if (user.provider !== 'system') {
            throw new resHandle_1.BadRequestError('Google accounts cannot reset password');
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = this.hashToken(resetToken);
        user.resetPasswordToken = hashedToken;
        user.resetPasswordTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}&email=${email}`;
        await (0, email_1.sendResetPasswordEmail)(email, resetLink);
        return { message: 'Password reset link sent to your email' };
    }
    async resetPassword({ email, token, newPassword }) {
        const hashedToken = this.hashToken(token);
        const user = await this.model
            .findOne({ email })
            .select('resetPasswordToken resetPasswordTokenExpires tokenVersion password');
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        if (user.resetPasswordToken !== hashedToken) {
            throw new resHandle_1.BadRequestError('Invalid reset link');
        }
        if (!user.resetPasswordTokenExpires ||
            Date.now() > user.resetPasswordTokenExpires.getTime()) {
            throw new resHandle_1.BadRequestError('Reset link has expired');
        }
        user.password = await bcrypt_1.default.hash(newPassword, 12);
        user.resetPasswordToken = null;
        user.resetPasswordTokenExpires = null;
        user.tokenVersion += 1;
        await user.save();
        return { message: 'Password reset successfully, please login again' };
    }
    async logout({ token }) {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded)
            throw new resHandle_1.BadRequestError('Invalid token');
        const ttl = Math.ceil(decoded.exp - Date.now() / 1000);
        if (ttl > 0) {
            await redisClient_1.default.setEx(`blacklist_${token}`, ttl, 'true');
        }
        return { message: 'Logged out successfully' };
    }
    async logoutAllDevices({ userId }) {
        const user = await this.model
            .findById(userId)
            .select('tokenVersion');
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        user.tokenVersion += 1;
        await user.save();
        return { message: 'Logged out from all devices successfully' };
    }
}
exports.default = new AuthServices();
