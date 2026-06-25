"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const sucess_res_1 = require("../../utils/errorHandle/sucess.res");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const auth_services_1 = __importDefault(require("./auth.services"));
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("../../config");
const resHandle_1 = require("../../utils/errorHandle/resHandle");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
const client = new google_auth_library_1.OAuth2Client(config_1.GOOGLE_CLIENT_ID);
router.post('/signup', (0, validation_middleware_1.validation)(auth_validation_1.signupSchema), async (req, res, next) => {
    try {
        const data = await auth_services_1.default.signup(req.body);
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'User registered successfully', status: 201 });
    }
    catch (error) {
        next(error);
    }
});
router.post('/confirm-email', (0, validation_middleware_1.validation)(auth_validation_1.otpSchema), async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const data = await auth_services_1.default.confirmEmail({ email, otp });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Email confirmed' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/resend-otp', (0, validation_middleware_1.validation)(auth_validation_1.emailSchema), async (req, res, next) => {
    try {
        const { email } = req.body;
        const data = await auth_services_1.default.resendOtp({ email });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'OTP resent' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', (0, validation_middleware_1.validation)(auth_validation_1.loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await auth_services_1.default.login({ email, password });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Login successful' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/google', async (req, res, next) => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_1.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload)
            throw new Error('Invalid Google token');
        const nameParts = (payload.name ?? '').split(' ');
        const firstName = nameParts[0] ?? 'User';
        const lastName = nameParts.slice(1).join(' ') || firstName;
        const data = await auth_services_1.default.googleAuth({
            firstName,
            lastName,
            email: payload.email,
            isEmailConfirmed: payload.email_verified ?? false,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Google auth successful' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/forget-password', (0, validation_middleware_1.validation)(auth_validation_1.emailSchema), async (req, res, next) => {
    try {
        const { email } = req.body;
        const data = await auth_services_1.default.forgetPassword({ email });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Reset link sent' });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/reset-password', (0, validation_middleware_1.validation)(auth_validation_1.resetPasswordSchema), async (req, res, next) => {
    try {
        const { email, token, newPassword } = req.body;
        const data = await auth_services_1.default.resetPassword({ email, token, newPassword });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Password reset' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/logout', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            throw new resHandle_1.AppError('Authorization header missing', 401);
        const token = authHeader.split(' ')[1];
        if (!token)
            throw new resHandle_1.AppError('Token missing', 401);
        const data = await auth_services_1.default.logout({ token });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Logged out' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/logout/all', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await auth_services_1.default.logoutAllDevices({
            userId: req.user._id
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Logged out from all devices' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
