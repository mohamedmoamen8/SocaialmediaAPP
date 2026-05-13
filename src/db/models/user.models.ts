import bcrypt from 'bcrypt';
import mongoose, { Schema, Document, Model, Query, Types } from 'mongoose';
import { IUser, UserRole, Gender, ProviderTypes } from '../../modules/users/user.types';
import { postModel } from './posts.models';
import { storyModel } from './stories.models';


export interface IUserDocument extends Omit<IUser, never>, Document {
  _id: Types.ObjectId; 
  isDeleted: boolean;
  deletedAt: Date | null;
  softDelete(): Promise<IUserDocument>;
}

interface IUserModel extends Model<IUserDocument> {
  softDeleteById(userId: string | Types.ObjectId): Promise<IUserDocument | null>;
  hardDeleteById(userId: string | Types.ObjectId): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    firstName: { type: String, required: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, required: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
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

userSchema.methods.softDelete = async function softDelete(): Promise<IUserDocument> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await postModel.updateMany(
    { id_owner: this._id },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  ).setOptions({ withDeleted: true });
  await storyModel.updateMany(
    { id_owner: this._id },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  ).setOptions({ withDeleted: true });
  return await this.save();
};

userSchema.statics.softDeleteById = async function softDeleteById(
  userId: string | Types.ObjectId
) {
  const user = await this.findById(userId);
  if (!user) return null;
  return await user.softDelete();
};

userSchema.statics.hardDeleteById = async function hardDeleteById(
  userId: string | Types.ObjectId
) {
  const user = await this.findOneAndDelete({ _id: userId }).setOptions({ withDeleted: true });
  if (user) {
    await postModel.deleteMany({ id_owner: user._id }).setOptions({ withDeleted: true });
    await storyModel.deleteMany({ id_owner: user._id }).setOptions({ withDeleted: true });
  }
  return user;
};

userSchema.pre('save', async function preSave() {
  if (this.isModified('password') && this.password && !this.password.startsWith('$2')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
});

userSchema.post('save', function postSave(doc) {
  console.log(`User saved: ${doc._id.toString()}`);
});

(userSchema.pre as unknown as (name: string, fn: (next: () => void, docs: IUserDocument[]) => Promise<void>) => void)(
  'insertMany',
  async function preInsertMany(next, docs) {
  await Promise.all(
    docs.map(async (doc) => {
      if (doc.password && !doc.password.startsWith('$2')) {
        doc.password = await bcrypt.hash(doc.password, 12);
      }
      if (doc.isDeleted && !doc.deletedAt) doc.deletedAt = new Date();
    })
  );
  next();
}
);

userSchema.pre(/^find/, function preFindNotDeleted(
  this: Query<unknown, IUserDocument>
) {
  if (!this.getOptions().withDeleted) {
    this.where({ isDeleted: false });
  }
});

export const userModel: IUserModel =
  (mongoose.models['User'] as IUserModel | undefined) ||
  mongoose.model<IUserDocument, IUserModel>('User', userSchema);
