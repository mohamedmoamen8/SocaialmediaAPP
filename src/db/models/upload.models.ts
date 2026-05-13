import mongoose, { Document, Model, Query, Schema, Types } from 'mongoose';

export enum UploadPurpose {
  profilePicture = 'profilePicture',
  coverPicture = 'coverPicture',
  postImage = 'postImage',
  storyImage = 'storyImage',
}

export enum UploadStatus {
  pending = 'pending',
  verified = 'verified',
  rejected = 'rejected',
}

export interface IUploadDocument extends Omit<Document, '_id'> {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  key: string;
  bucket: string;
  region: string;
  url: string;
  contentType: string;
  size: number;
  purpose: UploadPurpose;
  status: UploadStatus;
  verifiedAt: Date | null;
  etag?: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  softDelete(): Promise<IUploadDocument>;
}

interface IUploadModel extends Model<IUploadDocument> {
  softDeleteById(uploadId: string | Types.ObjectId): Promise<IUploadDocument | null>;
}

const uploadSchema = new Schema<IUploadDocument, IUploadModel>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true, unique: true, trim: true },
    bucket: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    contentType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 1 },
    purpose: {
      type: String,
      enum: Object.values(UploadPurpose),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(UploadStatus),
      default: UploadStatus.pending,
    },
    verifiedAt: { type: Date, default: null },
    etag: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

uploadSchema.methods.softDelete = async function softDelete(): Promise<IUploadDocument> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

uploadSchema.statics.softDeleteById = async function softDeleteById(
  uploadId: string | Types.ObjectId
) {
  const upload = await this.findById(uploadId);
  if (!upload) return null;
  return await upload.softDelete();
};

uploadSchema.pre('save', function preSave() {
  if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
});

uploadSchema.pre(/^find/, function preFindNotDeleted(
  this: Query<unknown, IUploadDocument>
) {
  if (!this.getOptions().withDeleted) {
    this.where({ isDeleted: false });
  }
});

export const uploadModel =
  (mongoose.models['Upload'] as IUploadModel | undefined) ||
  mongoose.model<IUploadDocument, IUploadModel>('Upload', uploadSchema);
