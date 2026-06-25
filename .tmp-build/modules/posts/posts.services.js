"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const posts_models_1 = require("../../db/models/posts.models");
const user_models_1 = require("../../db/models/user.models");
const resHandle_1 = require("../../utils/errorHandle/resHandle");
class PostServices {
    model;
    constructor() {
        this.model = posts_models_1.postModel;
    }
    populatePost(query) {
        return query
            .populate('id_owner', 'firstName lastName profilePicture')
            .populate('comment.userId', 'firstName lastName profilePicture')
            .sort({ createdAt: -1 });
    }
    async createPost({ title, body, id_owner }) {
        const post = await this.model.create({
            title,
            body,
            id_owner: new mongoose_1.Types.ObjectId(id_owner),
        });
        return { post };
    }
    async getAllPosts() {
        const posts = await this.populatePost(this.model.find());
        return { posts };
    }
    async getNewsFeed({ userId }) {
        const posts = await this.populatePost(this.model.find({ id_owner: { $ne: new mongoose_1.Types.ObjectId(userId) } }));
        return { posts };
    }
    async getDashboardSummary() {
        const [postsCount, usersCount, commentsStats, reactionsStats, sharesStats] = await Promise.all([
            this.model.countDocuments(),
            user_models_1.userModel.countDocuments(),
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
    async getPostById({ postId }) {
        const post = await this.model
            .findById(postId)
            .populate('id_owner', 'firstName lastName profilePicture')
            .populate('comment.userId', 'firstName lastName profilePicture');
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        return { post };
    }
    async getUserPosts({ userId }) {
        const posts = await this.populatePost(this.model.find({ id_owner: new mongoose_1.Types.ObjectId(userId) }));
        return { posts };
    }
    async updatePost({ postId, userId, title, body }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        if (post.id_owner.toString() !== userId) {
            throw new resHandle_1.AppError('Unauthorized - not the post owner', 403);
        }
        if (title !== undefined)
            post.title = title;
        if (body !== undefined)
            post.body = body;
        await post.save();
        return { post };
    }
    async deletePost({ postId, userId }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        if (post.id_owner.toString() !== userId) {
            throw new resHandle_1.AppError('Unauthorized - not the post owner', 403);
        }
        await post.softDelete();
        return { message: 'Post deleted successfully' };
    }
    async hardDeletePost({ postId, userId }) {
        const post = await this.model.findById(postId).setOptions({ withDeleted: true });
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        if (post.id_owner.toString() !== userId) {
            throw new resHandle_1.AppError('Unauthorized - not the post owner', 403);
        }
        await posts_models_1.postModel.hardDeleteById(postId);
        return { message: 'Post permanently deleted successfully' };
    }
    async toggleLike({ postId, userId }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        const alreadyLiked = post.likes.some((id) => id.toString() === userId);
        if (alreadyLiked) {
            post.likes = post.likes.filter((id) => id.toString() !== userId);
        }
        else {
            post.likes.push(new mongoose_1.Types.ObjectId(userId));
        }
        await post.save();
        return {
            message: alreadyLiked ? 'Post unliked' : 'Post liked',
            likesCount: post.likesCount,
        };
    }
    async reactToPost({ postId, userId, emoji }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        const existingReaction = post.reactions.find((reaction) => reaction.userId.toString() === userId);
        if (existingReaction) {
            existingReaction.emoji = emoji;
            existingReaction.createdAt = new Date();
        }
        else {
            post.reactions.push({
                userId: new mongoose_1.Types.ObjectId(userId),
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
    async removeReaction({ postId, userId }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        post.reactions = post.reactions.filter((reaction) => reaction.userId.toString() !== userId);
        await post.save();
        return { message: 'Reaction removed', reactionsCount: post.reactionsCount };
    }
    async addComment({ postId, userId, text }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        post.comment.push({
            _id: new mongoose_1.Types.ObjectId(),
            userId: new mongoose_1.Types.ObjectId(userId),
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
    async updateComment({ postId, commentId, userId, text }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        const comment = post.comment.id(commentId);
        if (!comment || comment.isDeleted)
            throw new resHandle_1.NotFoundError('Comment not found');
        if (comment.userId.toString() !== userId && post.id_owner.toString() !== userId) {
            throw new resHandle_1.AppError('Unauthorized - not the comment owner', 403);
        }
        comment.text = text;
        comment.updatedAt = new Date();
        await post.save();
        return { comment };
    }
    async deleteComment({ postId, commentId, userId }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        const comment = post.comment.id(commentId);
        if (!comment || comment.isDeleted)
            throw new resHandle_1.NotFoundError('Comment not found');
        if (comment.userId.toString() !== userId && post.id_owner.toString() !== userId) {
            throw new resHandle_1.AppError('Unauthorized - not the comment owner', 403);
        }
        comment.isDeleted = true;
        comment.deletedAt = new Date();
        await post.save();
        return { message: 'Comment deleted successfully', commentsCount: post.commentsCount };
    }
    async hardDeleteComment({ postId, commentId, userId }) {
        const post = await this.model.findById(postId).setOptions({ withDeleted: true });
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        const comment = post.comment.id(commentId);
        if (!comment)
            throw new resHandle_1.NotFoundError('Comment not found');
        if (comment.userId.toString() !== userId && post.id_owner.toString() !== userId) {
            throw new resHandle_1.AppError('Unauthorized - not the comment owner', 403);
        }
        comment.deleteOne();
        await post.save();
        return { message: 'Comment permanently deleted successfully' };
    }
    async sharePost({ postId, userId }) {
        const post = await this.model.findById(postId);
        if (!post)
            throw new resHandle_1.NotFoundError('Post not found');
        const alreadyShared = post.shares.some((id) => id.toString() === userId);
        if (alreadyShared) {
            throw new resHandle_1.BadRequestError('You already shared this post');
        }
        post.shares.push(new mongoose_1.Types.ObjectId(userId));
        await post.save();
        return {
            message: 'Post shared successfully',
            sharesCount: post.sharesCount,
        };
    }
}
exports.default = new PostServices();
