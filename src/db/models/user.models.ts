import { Model, Schema, Types, model, Document, Query } from 'mongoose';
import { Gender, ProviderTypes } from '../../modules/users/user.types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  age?: number;
  gender?: Gender;
  provider: ProviderTypes;
  isEmailConfirmed: boolean;
  emailOtp: string | null;
  emailOTPExpires: Date | null;
  lastOtpSentAt?: Date;
  otpResendCount: number;
  tokenVersion: number;
  role: number;
  isTwoFactorEnabled?: boolean;
  twoFactorOTP?: string | null;
  twoFactorOTPExpires?: Date | null;
  resetPasswordToken: string | null;
  resetPasswordTokenExpires: Date | null;
  profilePicture?: string;
  coverPictures: string[];
  following: Types.ObjectId[];
  followers: Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {
  softDeleteById(id: string): Promise<IUser | null>;
  hardDeleteById(id: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    age: { type: Number },
    gender: { type: String, enum: Object.values(Gender) },
    tokenVersion: { type: Number, default: 0 },
    coverPictures: [String],
    isDeleted: { type: Boolean, default: false },
    provider: { type: String, enum: Object.values(ProviderTypes), required: true },
    isEmailConfirmed: { type: Boolean, default: false },
    emailOtp: { type: String, default: null },
    emailOTPExpires: { type: Date, default: null },
    lastOtpSentAt: { type: Date },
    otpResendCount: { type: Number, default: 0 },
    role: { type: Number, default: 0 },
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorOTP: { type: String, default: null },
    twoFactorOTPExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpires: { type: Date, default: null },
    profilePicture: { type: String },
    following: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true }
);

userSchema.pre<Query<IUser, any>>('find', function () {
  this.where({ isDeleted: false });
});

userSchema.pre<Query<IUser, any>>('findOne', function () {
  this.where({ isDeleted: false });
});

userSchema.statics.softDeleteById = async function (id: string) {
  return this.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

userSchema.statics.hardDeleteById = async function (id:string) {
  return this.findByIdAndDelete(id);
};

export const userModel: IUserModel = model<IUser, IUserModel>(
  'User',
  userSchema
);
