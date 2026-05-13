import { Model, Types } from 'mongoose';
import { postModel, IPostDocument } from '../../db/models/posts.models';
import { userModel } from '../../db/models/user.models';
import {
  IAddCommentInput,
  ICommentIdInput,
  ICreatePostInput,
  IDeletePostInput,
  ILikePostInput,
  IReactPostInput,
  ISharePostInput,
  IUpdateCommentInput,
  IUpdatePostInput,
} from './posts.types';
import {
  NotFoundError,
  BadRequestError,
  AppError,
} from '../../utils/errorHandle/resHandle';

class PostServices {
  private readonly model: Model<IPostDocument>;

  constructor() {
    this.model = postModel;
  }

  private populatePost(query: ReturnType<typeof this.model.find>) {
    return query
      .populate('id_owner', 'firstName lastName profilePicture')
      .populate('comment.userId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });
  }

  async createPost({ title, body, id_owner }: ICreatePostInput) {
    const post = await this.model.create({
      title,
      body,
      id_owner: new Types.ObjectId(id_owner),
    });

    return { post };
  }

  async getAllPosts() {
    const posts = await this.populatePost(this.model.find());
    return { posts };
  }

  async getNewsFeed({ userId }: { userId: string }) {
    const posts = await this.populatePost(
      this.model.find({ id_owner: { $ne: new Types.ObjectId(userId) } })
    );
    return { posts };
  }

  async getDashboardSummary() {
    const [postsCount, usersCount, commentsStats, reactionsStats, sharesStats] =
      await Promise.all([
        this.model.countDocuments(),
        userModel.countDocuments(),
        this.model.aggregate([{ $project: { total: { $size: '$comment' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        this.model.aggregate([{ $project: { total: { $size: '$reactions' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        this.model.aggregate([{ $project: { total: { $size: '$shares' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      ]);

    return {
      postsCount,
      usersCount,
      commentsCount: commentsStats[0]?.total || 0,
      reactionsCount: reactionsStats[0]?.total || 0,
      sharesCount: sharesStats[0]?.total || 0,
    };
  }

  async getPostById({ postId }: { postId: string }) {
    const post = await this.model
      .findById(postId)
      .populate('id_owner', 'firstName lastName profilePicture')
      .populate('comment.userId', 'firstName lastName profilePicture');

    if (!post) throw new NotFoundError('Post not found');

    return { post };
  }

  async getUserPosts({ userId }: { userId: string }) {
    const posts = await this.populatePost(
      this.model.find({ id_owner: new Types.ObjectId(userId) })
    );

    return { posts };
  }

  async updatePost({ postId, userId, title, body }: IUpdatePostInput) {
    const post = await this.model.findById(postId);

    if (!post) throw new NotFoundError('Post not found');
    if (post.id_owner.toString() !== userId) {
      throw new AppError('Unauthorized - not the post owner', 403);
    }

    if (title !== undefined) post.title = title;
    if (body !== undefined) post.body = body;

    await post.save();

    return { post };
  }

  async deletePost({ postId, userId }: IDeletePostInput) {
    const post = await this.model.findById(postId);

    if (!post) throw new NotFoundError('Post not found');
    if (post.id_owner.toString() !== userId) {
      throw new AppError('Unauthorized - not the post owner', 403);
    }

    await post.softDelete();

    return { message: 'Post deleted successfully' };
  }

  async hardDeletePost({ postId, userId }: IDeletePostInput) {
    const post = await this.model.findById(postId).setOptions({ withDeleted: true });

    if (!post) throw new NotFoundError('Post not found');
    if (post.id_owner.toString() !== userId) {
      throw new AppError('Unauthorized - not the post owner', 403);
    }

    await postModel.hardDeleteById(postId);
    return { message: 'Post permanently deleted successfully' };
  }

  async toggleLike({ postId, userId }: ILikePostInput) {
    const post = await this.model.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(new Types.ObjectId(userId));
    }

    await post.save();

    return {
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      likesCount: post.likesCount,
    };
  }

  async reactToPost({ postId, userId, emoji }: IReactPostInput) {
    const post = await this.model.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    const existingReaction = post.reactions.find(
      (reaction) => reaction.userId.toString() === userId
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
      existingReaction.createdAt = new Date();
    } else {
      post.reactions.push({
        userId: new Types.ObjectId(userId),
        emoji,
        createdAt: new Date(),
      });
    }

    await post.save();

    return {
      message: 'Reaction saved',
      reactionsCount: post.reactionsCount,
      emoji,
    };
  }

  async removeReaction({ postId, userId }: ILikePostInput) {
    const post = await this.model.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    post.reactions = post.reactions.filter(
      (reaction) => reaction.userId.toString() !== userId
    );
    await post.save();

    return { message: 'Reaction removed', reactionsCount: post.reactionsCount };
  }

  async addComment({ postId, userId, text }: IAddCommentInput) {
    const post = await this.model.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    post.comment.push({
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      text,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await post.save();

    return {
      message: 'Comment added successfully',
      commentsCount: post.commentsCount,
    };
  }

  async updateComment({ postId, commentId, userId, text }: IUpdateCommentInput) {
    const post = await this.model.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    const comment = post.comment.id(commentId);
    if (!comment || comment.isDeleted) throw new NotFoundError('Comment not found');
    if (comment.userId.toString() !== userId && post.id_owner.toString() !== userId) {
      throw new AppError('Unauthorized - not the comment owner', 403);
    }

    comment.text = text;
    comment.updatedAt = new Date();
    await post.save();

    return { comment };
  }

  async deleteComment({ postId, commentId, userId }: ICommentIdInput) {
    const post = await this.model.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    const comment = post.comment.id(commentId);
    if (!comment || comment.isDeleted) throw new NotFoundError('Comment not found');
    if (comment.userId.toString() !== userId && post.id_owner.toString() !== userId) {
      throw new AppError('Unauthorized - not the comment owner', 403);
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await post.save();

    return { message: 'Comment deleted successfully', commentsCount: post.commentsCount };
  }

  async hardDeleteComment({ postId, commentId, userId }: ICommentIdInput) {
    const post = await this.model.findById(postId).setOptions({ withDeleted: true });
    if (!post) throw new NotFoundError('Post not found');

    const comment = post.comment.id(commentId);
    if (!comment) throw new NotFoundError('Comment not found');
    if (comment.userId.toString() !== userId && post.id_owner.toString() !== userId) {
      throw new AppError('Unauthorized - not the comment owner', 403);
    }

    comment.deleteOne();
    await post.save();

    return { message: 'Comment permanently deleted successfully' };
  }

  async sharePost({ postId, userId }: ISharePostInput) {
    const post = await this.model.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    const alreadyShared = post.shares.some((id) => id.toString() === userId);

    if (alreadyShared) {
      throw new BadRequestError('You already shared this post');
    }

    post.shares.push(new Types.ObjectId(userId));
    await post.save();

    return {
      message: 'Post shared successfully',
      sharesCount: post.sharesCount,
    };
  }
}

export default new PostServices();
