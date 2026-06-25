"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootValue = exports.schema = void 0;
const graphql_1 = require("graphql");
const auth_services_1 = __importDefault(require("../modules/auth/auth.services"));
const posts_services_1 = __importDefault(require("../modules/posts/posts.services"));
const user_services_1 = __importDefault(require("../modules/users/user.services"));
const posts_models_1 = require("../db/models/posts.models");
const resHandle_1 = require("../utils/errorHandle/resHandle");
const socket_1 = require("../realtime/socket");
const graphql_context_1 = require("./graphql.context");
exports.schema = (0, graphql_1.buildSchema)(`
  enum ReactionEmoji {
    like
    love
    haha
    wow
    sad
    angry
  }

  type AuthPayload {
    accessToken: String
    refreshToken: String
    twoFactorRequired: Boolean
    message: String
  }

  type MessagePayload {
    message: String!
  }

  type CountPayload {
    message: String
    likesCount: Int
    reactionsCount: Int
    commentsCount: Int
    sharesCount: Int
    emoji: ReactionEmoji
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    fullName: String
    email: String
    age: Int
    gender: Int
    role: Int
    provider: String
    isEmailConfirmed: Boolean
    profilePicture: String
    coverPictures: [String!]!
    createdAt: String
    updatedAt: String
  }

  type Comment {
    id: ID!
    userId: ID!
    text: String!
    isDeleted: Boolean!
    deletedAt: String
    createdAt: String
    updatedAt: String
  }

  type Reaction {
    userId: ID!
    emoji: ReactionEmoji!
    createdAt: String
  }

  type Post {
    id: ID!
    title: String!
    body: String!
    owner: User
    comments: [Comment!]!
    likes: [ID!]!
    shares: [ID!]!
    reactions: [Reaction!]!
    likesCount: Int!
    commentsCount: Int!
    sharesCount: Int!
    reactionsCount: Int!
    isDeleted: Boolean!
    deletedAt: String
    createdAt: String
    updatedAt: String
  }

  type DashboardSummary {
    postsCount: Int!
    usersCount: Int!
    commentsCount: Int!
    reactionsCount: Int!
    sharesCount: Int!
  }

  type Query {
    users: [User!]!
    me: User!
    posts: [Post!]!
    feed: [Post!]!
    myPosts: [Post!]!
    post(postId: ID!): Post!
    dashboardSummary: DashboardSummary!
  }

  type Mutation {
    signup(
      firstName: String!
      lastName: String!
      email: String!
      password: String!
      age: Int
      gender: Int
    ): MessagePayload!
    login(email: String!, password: String!): AuthPayload!
    createPost(title: String!, body: String!): Post!
    updatePost(postId: ID!, title: String, body: String): Post!
    deletePost(postId: ID!): MessagePayload!
    likePost(postId: ID!): CountPayload!
    reactToPost(postId: ID!, emoji: ReactionEmoji!): CountPayload!
    removeReaction(postId: ID!): CountPayload!
    addComment(postId: ID!, text: String!): CountPayload!
    updateComment(postId: ID!, commentId: ID!, text: String!): Comment!
    deleteComment(postId: ID!, commentId: ID!): CountPayload!
    sharePost(postId: ID!): CountPayload!
  }
`);
const toDateString = (value) => {
    if (!value)
        return null;
    return value instanceof Date ? value.toISOString() : String(value);
};
const normalizeId = (value) => {
    if (value && typeof value === 'object' && '_id' in value) {
        return normalizeId(value._id);
    }
    return String(value);
};
const normalizeUser = (user) => {
    if (!user || typeof user !== 'object')
        return null;
    const source = 'toObject' in user ? user.toObject() : user;
    const data = source;
    const firstName = String(data.firstName || '');
    const lastName = String(data.lastName || '');
    return {
        id: normalizeId(data._id),
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        email: data.email ? String(data.email) : null,
        age: typeof data.age === 'number' ? data.age : null,
        gender: typeof data.gender === 'number' ? data.gender : null,
        role: typeof data.role === 'number' ? data.role : null,
        provider: data.provider ? String(data.provider) : null,
        isEmailConfirmed: typeof data.isEmailConfirmed === 'boolean' ? data.isEmailConfirmed : null,
        profilePicture: data.profilePicture ? String(data.profilePicture) : null,
        coverPictures: Array.isArray(data.coverPictures)
            ? data.coverPictures.map((picture) => String(picture))
            : [],
        createdAt: toDateString(data.createdAt),
        updatedAt: toDateString(data.updatedAt),
    };
};
const normalizePost = (post) => {
    const source = 'toObject' in post
        ? post.toObject()
        : post;
    const data = source;
    const comments = Array.isArray(data.comment) ? data.comment : [];
    const reactions = Array.isArray(data.reactions) ? data.reactions : [];
    const likes = Array.isArray(data.likes) ? data.likes : [];
    const shares = Array.isArray(data.shares) ? data.shares : [];
    return {
        id: normalizeId(data._id),
        title: String(data.title || ''),
        body: String(data.body || ''),
        owner: normalizeUser(data.id_owner),
        comments: comments.map((comment) => {
            const item = comment;
            return {
                id: normalizeId(item._id),
                userId: normalizeId(item.userId),
                text: String(item.text || ''),
                isDeleted: Boolean(item.isDeleted),
                deletedAt: toDateString(item.deletedAt),
                createdAt: toDateString(item.createdAt),
                updatedAt: toDateString(item.updatedAt),
            };
        }),
        likes: likes.map((id) => normalizeId(id)),
        shares: shares.map((id) => normalizeId(id)),
        reactions: reactions.map((reaction) => {
            const item = reaction;
            return {
                userId: normalizeId(item.userId),
                emoji: item.emoji,
                createdAt: toDateString(item.createdAt),
            };
        }),
        likesCount: Number(data.likesCount || likes.length),
        commentsCount: Number(data.commentsCount || comments.filter((comment) => !comment.isDeleted).length),
        sharesCount: Number(data.sharesCount || shares.length),
        reactionsCount: Number(data.reactionsCount || reactions.length),
        isDeleted: Boolean(data.isDeleted),
        deletedAt: toDateString(data.deletedAt),
        createdAt: toDateString(data.createdAt),
        updatedAt: toDateString(data.updatedAt),
    };
};
const assertReactionEmoji = (emoji) => {
    if (!posts_models_1.allowedReactionEmojis.includes(emoji)) {
        throw new resHandle_1.AppError('Invalid reaction emoji', 400);
    }
    return emoji;
};
exports.rootValue = {
    async users(_args, context) {
        (0, graphql_context_1.requireGraphQLUser)(context);
        const users = await user_services_1.default.getAllUsers();
        return users.map(normalizeUser);
    },
    async me(_args, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await user_services_1.default.getUserById(user._id);
        return normalizeUser(data.user);
    },
    async posts(_args, context) {
        (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.getAllPosts();
        return data.posts.map(normalizePost);
    },
    async feed(_args, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.getNewsFeed({ userId: user._id });
        return data.posts.map(normalizePost);
    },
    async myPosts(_args, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.getUserPosts({ userId: user._id });
        return data.posts.map(normalizePost);
    },
    async post({ postId }, context) {
        (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.getPostById({ postId });
        return normalizePost(data.post);
    },
    async dashboardSummary(_args, context) {
        (0, graphql_context_1.requireGraphQLUser)(context);
        return await posts_services_1.default.getDashboardSummary();
    },
    async signup(args) {
        return await auth_services_1.default.signup(args);
    },
    async login({ email, password }) {
        return await auth_services_1.default.login({ email, password });
    },
    async createPost({ title, body }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.createPost({ title, body, id_owner: user._id });
        const payload = normalizePost(data.post);
        (0, socket_1.emitFeedEvent)(socket_1.socketEvents.postCreated, payload);
        return payload;
    },
    async updatePost({ postId, title, body }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const input = {
            postId,
            userId: user._id,
            ...(title !== undefined && { title }),
            ...(body !== undefined && { body }),
        };
        const data = await posts_services_1.default.updatePost(input);
        const payload = normalizePost(data.post);
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postUpdated, payload);
        return payload;
    },
    async deletePost({ postId }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.deletePost({ postId, userId: user._id });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postDeleted, { postId, userId: user._id });
        return data;
    },
    async likePost({ postId }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.toggleLike({ postId, userId: user._id });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postLiked, { postId, userId: user._id, ...data });
        return data;
    },
    async reactToPost({ postId, emoji }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.reactToPost({
            postId,
            userId: user._id,
            emoji: assertReactionEmoji(emoji),
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postReacted, { postId, userId: user._id, ...data });
        return data;
    },
    async removeReaction({ postId }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.removeReaction({ postId, userId: user._id });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postReactionRemoved, {
            postId,
            userId: user._id,
            ...data,
        });
        return data;
    },
    async addComment({ postId, text }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.addComment({ postId, userId: user._id, text });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.commentAdded, { postId, userId: user._id, text, ...data });
        return data;
    },
    async updateComment({ postId, commentId, text }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.updateComment({
            postId,
            commentId,
            userId: user._id,
            text,
        });
        const comment = normalizePost({ _id: postId, comment: [data.comment] }).comments[0];
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.commentUpdated, { postId, comment });
        return comment;
    },
    async deleteComment({ postId, commentId }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.deleteComment({ postId, commentId, userId: user._id });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.commentDeleted, {
            postId,
            commentId,
            userId: user._id,
            ...data,
        });
        return data;
    },
    async sharePost({ postId }, context) {
        const user = (0, graphql_context_1.requireGraphQLUser)(context);
        const data = await posts_services_1.default.sharePost({ postId, userId: user._id });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postShared, { postId, userId: user._id, ...data });
        return data;
    },
};
