import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IUser, UserRole, Gender, ProviderTypes } from '../../modules/users/user.types';


export interface IUserDocument extends Omit<IUser, never>, Document {
  _id: Types.ObjectId; 
}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String, required: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, required: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true },
    password: { type: String, minlength: 8 },
    age: { type: Number },
    gender: {
      type: Number,
      enum: Object.values(Gender).filter((v) => typeof v === 'number'),
      default: Gender.male,
    },
    role: {
      type: Number,
      enum: Object.values(UserRole).filter((v) => typeof v === 'number'),
      default: UserRole.user,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderTypes),
      default: ProviderTypes.system,
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
  },
  {  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
   }
);

userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 86400,
    partialFilterExpression: { isEmailConfirmed: false },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const userModel: Model<IUserDocument> =
  mongoose.models['User'] ||
  mongoose.model<IUserDocument>('User', userSchema);