import mongoose, { Document, Model, Query, Schema, Types } from 'mongoose';

export interface IStoryDocument extends Omit<Document, '_id'> {
  _id: Types.ObjectId;
  id_owner: Types.ObjectId;
  mediaUrl: string;
  caption?: string;
  viewers: Types.ObjectId[];
  expiresAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  viewersCount: number;
  softDelete(): Promise<IStoryDocument>;
}

interface IStoryModel extends Model<IStoryDocument> {
  softDeleteById(storyId: string | Types.ObjectId): Promise<IStoryDocument | null>;
  hardDeleteById(storyId: string | Types.ObjectId): Promise<IStoryDocument | null>;
}

const storySchema = new Schema<IStoryDocument, IStoryModel>(
  {
    id_owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, maxlength: 200 },
    viewers: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

storySchema.virtual('viewersCount').get(function () {
  return this.viewers.length;
});

storySchema.methods.softDelete = async function softDelete(): Promise<IStoryDocument> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

storySchema.statics.softDeleteById = async function softDeleteById(
  storyId: string | Types.ObjectId
) {
  const story = await this.findById(storyId);
  if (!story) return null;
  return await story.softDelete();
};

storySchema.statics.hardDeleteById = async function hardDeleteById(
  storyId: string | Types.ObjectId
) {
  return await this.findOneAndDelete({ _id: storyId }).setOptions({ withDeleted: true });
};

storySchema.pre('save', function preSave() {
  if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
});

storySchema.post('save', function postSave(doc) {
  console.log(`Story saved: ${doc._id.toString()}`);
});

(storySchema.pre as unknown as (name: string, fn: (next: () => void, docs: IStoryDocument[]) => void) => void)(
  'insertMany',
  function preInsertMany(next, docs) {
  docs.forEach((doc) => {
    if (!doc.expiresAt) doc.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (doc.isDeleted && !doc.deletedAt) doc.deletedAt = new Date();
  });
  next();
}
);

storySchema.pre(/^find/, function preFindActive(
  this: Query<unknown, IStoryDocument>
) {
  if (!this.getOptions().withDeleted) {
    this.where({ isDeleted: false, expiresAt: { $gt: new Date() } });
  }
});

export const storyModel =
  (mongoose.models['Story'] as IStoryModel | undefined) ||
  mongoose.model<IStoryDocument, IStoryModel>('Story', storySchema);
