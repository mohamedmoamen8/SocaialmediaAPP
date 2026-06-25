"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importStar(require("mongoose"));
const user_types_1 = require("../../modules/users/user.types");
const posts_models_1 = require("./posts.models");
const stories_models_1 = require("./stories.models");
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, required: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 8 },
    age: { type: Number },
    gender: {
        type: Number,
        enum: Object.values(user_types_1.Gender).filter((v) => typeof v === 'number'),
        default: user_types_1.Gender.male,
    },
    role: {
        type: Number,
        enum: Object.values(user_types_1.UserRole).filter((v) => typeof v === 'number'),
        default: user_types_1.UserRole.user,
    },
    provider: {
        type: String,
        enum: Object.values(user_types_1.ProviderTypes),
        default: user_types_1.ProviderTypes.system,
    },
    isEmailConfirmed: { type: Boolean, default: false },
    profilePicture: { type: String, default: null },
    coverPictures: { type: [String], default: [] },
    tokenVersion: { type: Number, default: 0 },
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorOTP: { type: String, default: null },
    twoFactorOTPExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpires: { type: Date, default: null },
    emailOtp: { type: String, default: null },
    emailOTPExpires: { type: Date, default: null },
    lastOtpSentAt: { type: Date, default: null },
    otpResendCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 86400,
    partialFilterExpression: { isEmailConfirmed: false },
});
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.methods.softDelete = async function softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await posts_models_1.postModel.updateMany({ id_owner: this._id }, { $set: { isDeleted: true, deletedAt: new Date() } }).setOptions({ withDeleted: true });
    await stories_models_1.storyModel.updateMany({ id_owner: this._id }, { $set: { isDeleted: true, deletedAt: new Date() } }).setOptions({ withDeleted: true });
    return await this.save();
};
userSchema.statics.softDeleteById = async function softDeleteById(userId) {
    const user = await this.findById(userId);
    if (!user)
        return null;
    return await user.softDelete();
};
userSchema.statics.hardDeleteById = async function hardDeleteById(userId) {
    const user = await this.findOneAndDelete({ _id: userId }).setOptions({ withDeleted: true });
    if (user) {
        await posts_models_1.postModel.deleteMany({ id_owner: user._id }).setOptions({ withDeleted: true });
        await stories_models_1.storyModel.deleteMany({ id_owner: user._id }).setOptions({ withDeleted: true });
    }
    return user;
};
userSchema.pre('save', async function preSave() {
    if (this.isModified('password') && this.password && !this.password.startsWith('$2')) {
        this.password = await bcrypt_1.default.hash(this.password, 12);
    }
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});
userSchema.post('save', function postSave(doc) {
    console.log(`User saved: ${doc._id.toString()}`);
});
userSchema.pre('insertMany', async function preInsertMany(next, docs) {
    await Promise.all(docs.map(async (doc) => {
        if (doc.password && !doc.password.startsWith('$2')) {
            doc.password = await bcrypt_1.default.hash(doc.password, 12);
        }
        if (doc.isDeleted && !doc.deletedAt)
            doc.deletedAt = new Date();
    }));
    next();
});
userSchema.pre(/^find/, function preFindNotDeleted() {
    if (!this.getOptions().withDeleted) {
        this.where({ isDeleted: false });
    }
});
exports.userModel = mongoose_1.default.models['User'] ||
    mongoose_1.default.model('User', userSchema);
