import mongoose, { Document, Model, Query, Schema, Types } from 'mongoose';

export const allowedReactionEmojis = ['like', 'love', 'haha', 'wow', 'sad', 'angry'] as const;

export type ReactionEmoji = (typeof allowedReactionEmojis)[number];

export interface IComment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReaction {
  userId: Types.ObjectId;
  emoji: ReactionEmoji;
  createdAt: Date;
}

export interface IPostDocument extends Omit<Document, '_id'> {
  _id: Types.ObjectId;
  title: string;
  body: string;
  id_owner: Types.ObjectId;
  comment: Types.DocumentArray<IComment>;
  likes: Types.ObjectId[];
  shares: Types.ObjectId[];
  reactions: IReaction[];
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  reactionsCount: number;
  softDelete(): Promise<IPostDocument>;
}

interface IPostModel extends Model<IPostDocument> {
  softDeleteById(postId: string | Types.ObjectId): Promise<IPostDocument | null>;
  hardDeleteById(postId: string | Types.ObjectId): Promise<IPostDocument | null>;
}

const commentSchema = new Schema<IComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const reactionSchema = new Schema<IReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, enum: allowedReactionEmojis, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const postSchema = new Schema<IPostDocument, IPostModel>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true },
    id_owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: [commentSchema], default: [] },
    likes: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    shares: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    reactions: { type: [reactionSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

postSchema.virtual('commentsCount').get(function () {
  return this.comment.filter((comment) => !comment.isDeleted).length;
});

postSchema.virtual('sharesCount').get(function () {
  return this.shares.length;
});

postSchema.virtual('reactionsCount').get(function () {
  return this.reactions.length;
});

postSchema.methods.softDelete = async function softDelete(): Promise<IPostDocument> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.comment.forEach((comment: IComment) => {
    comment.isDeleted = true;
    comment.deletedAt = new Date();
  });
  return await this.save();
};

postSchema.statics.softDeleteById = async function softDeleteById(
  postId: string | Types.ObjectId
) {
  const post = await this.findById(postId);
  if (!post) return null;
  return await post.softDelete();
};

postSchema.statics.hardDeleteById = async function hardDeleteById(
  postId: string | Types.ObjectId
) {
  return await this.findOneAndDelete({ _id: postId }).setOptions({ withDeleted: true });
};

postSchema.pre('save', function preSave() {
  if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
});

postSchema.post('save', function postSave(doc) {
  console.log(`Post saved: ${doc._id.toString()}`);
});

(postSchema.pre as unknown as (name: string, fn: (next: () => void, docs: IPostDocument[]) => void) => void)(
  'insertMany',
  function preInsertMany(next, docs) {
  docs.forEach((doc) => {
    if (doc.isDeleted && !doc.deletedAt) doc.deletedAt = new Date();
  });
  next();
}
);

postSchema.pre(/^find/, function preFindNotDeleted(
  this: Query<unknown, IPostDocument>
) {
  if (!this.getOptions().withDeleted) {
    this.where({ isDeleted: false });
  }
});

postSchema.pre('aggregate', function preAggregateNotDeleted() {
  const options = this.options as { withDeleted?: boolean };
  if (!options.withDeleted) {
    this.pipeline().unshift({ $match: { isDeleted: false } });
  }
});

export const postModel =
  (mongoose.models['Post'] as IPostModel | undefined) ||
  mongoose.model<IPostDocument, IPostModel>('Post', postSchema);
