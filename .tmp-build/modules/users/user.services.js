"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const resHandle_1 = require("../../utils/errorHandle/resHandle");
const user_models_1 = require("../../db/models/user.models");
const DB_repo_1 = require("../../repo/DB.repo");
class UserServices {
    model;
    repo = new DB_repo_1.UserRepo();
    constructor() {
        this.model = user_models_1.userModel;
    }
    async updatePassword({ userId, currentPassword, newPassword, }) {
        const user = await this.model
            .findById(userId)
            .select('password provider');
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        if (user.provider !== 'system') {
            throw new resHandle_1.BadRequestError('Google accounts cannot update password');
        }
        const isMatch = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch)
            throw new resHandle_1.BadRequestError('Current password is incorrect');
        user.password = await bcrypt_1.default.hash(newPassword, 12);
        await user.save();
        return { message: 'Password updated successfully' };
    }
    async getAllUsers() {
        return await this.repo.findall('-password -emailOtp -twoFactorOTP -resetPasswordToken');
    }
    async getUserByEmail(email) {
        return await this.repo.findByEmail(email, '-password -emailOtp -twoFactorOTP -resetPasswordToken');
    }
    async getUserById(userId) {
        const user = await this.model
            .findById(userId)
            .select('-password -emailOtp -twoFactorOTP -resetPasswordToken');
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        return { user };
    }
    async updateUser({ userId, firstName, lastName, age, gender, profilePicture, coverPictures, }) {
        const user = await this.model.findById(userId);
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        if (firstName !== undefined)
            user.firstName = firstName;
        if (lastName !== undefined)
            user.lastName = lastName;
        if (age !== undefined)
            user.age = age;
        if (gender !== undefined)
            user.gender = gender;
        if (profilePicture !== undefined)
            user.profilePicture = profilePicture ?? undefined;
        if (coverPictures !== undefined)
            user.coverPictures = coverPictures;
        await user.save();
        return { user };
    }
    async softDeleteUser({ userId }) {
        const user = await user_models_1.userModel.softDeleteById(userId);
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        return { message: 'User deleted successfully' };
    }
    async hardDeleteUser({ userId }) {
        const user = await user_models_1.userModel.hardDeleteById(userId);
        if (!user)
            throw new resHandle_1.NotFoundError('User not found');
        return { message: 'User permanently deleted successfully' };
    }
}
exports.default = new UserServices();
