"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sucess_res_1 = require("../../utils/errorHandle/sucess.res");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const user_services_1 = __importDefault(require("./user.services"));
const resHandle_1 = require("../../utils/errorHandle/resHandle");
const auth_validation_1 = require("../auth/auth.validation");
const users_validation_1 = require("./users.validation");
const router = (0, express_1.Router)();
const getParam = (value, name) => {
    if (typeof value !== 'string')
        throw new resHandle_1.AppError(`${name} is required`, 400);
    return value;
};
router.get('/', auth_middleware_1.authentication, async (_req, res, next) => {
    try {
        const data = await user_services_1.default.getAllUsers();
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Users retrieved successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/me', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await user_services_1.default.getUserById(req.user._id);
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Profile retrieved successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/email', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        const email = req.query.email;
        const user = await user_services_1.default.getUserByEmail(email);
        if (!user)
            throw new resHandle_1.AppError('User not found', 404);
        (0, sucess_res_1.SuccessRes)({ res, data: user, message: 'User found successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:userId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(users_validation_1.userIdSchema), async (req, res, next) => {
    try {
        const data = await user_services_1.default.getUserById(getParam(req.params.userId, 'userId'));
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'User retrieved successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/me', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(users_validation_1.updateUserSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await user_services_1.default.updateUser({
            userId: req.user._id,
            ...req.body,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Profile updated successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/update-password', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(auth_validation_1.updatePasswordSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const { currentPassword, newPassword } = req.body;
        const data = await user_services_1.default.updatePassword({
            userId: req.user._id,
            currentPassword,
            newPassword,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Password updated' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/me', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await user_services_1.default.softDeleteUser({ userId: req.user._id });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'User deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/me/hard', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await user_services_1.default.hardDeleteUser({ userId: req.user._id });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'User permanently deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
