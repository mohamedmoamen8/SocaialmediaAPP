import { buildSchema } from 'graphql';
import authServices from '../modules/auth/auth.services';
import postServices from '../modules/posts/posts.services';
import userServices from '../modules/users/user.services';
import { allowedReactionEmojis, ReactionEmoji } from '../db/models/posts.models';
import { AppError } from '../utils/errorHandle/resHandle';
import { emitFeedEvent, emitPostEvent, socketEvents } from '../realtime/socket';
import { GraphQLContext, requireGraphQLUser } from './graphql.context';

export const schema = buildSchema(`
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

type IdLike = { toString(): string };

const toDateString = (value: unknown): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
};

const normalizeId = (value: unknown): string => {
  if (value && typeof value === 'object' && '_id' in value) {
    return normalizeId((value as { _id: IdLike })._id);
  }

  return String(value);
};

const normalizeUser = (user: unknown) => {
  if (!user || typeof user !== 'object') return null;
  const source = 'toObject' in user ? (user as { toObject(): Record<string, unknown> }).toObject() : user;
  const data = source as Record<string, unknown>;
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
    isEmailConfirmed:
      typeof data.isEmailConfirmed === 'boolean' ? data.isEmailConfirmed : null,
    profilePicture: data.profilePicture ? String(data.profilePicture) : null,
    coverPictures: Array.isArray(data.coverPictures)
      ? data.coverPictures.map((picture) => String(picture))
      : [],
    createdAt: toDateString(data.createdAt),
    updatedAt: toDateString(data.updatedAt),
  };
};

const normalizePost = (post: unknown) => {
  const source = 'toObject' in (post as object)
    ? (post as { toObject(): Record<string, unknown> }).toObject()
    : post;
  const data = source as Record<string, unknown>;
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
      const item = comment as Record<string, unknown>;
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
      const item = reaction as Record<string, unknown>;
      return {
        userId: normalizeId(item.userId),
        emoji: item.emoji,
        createdAt: toDateString(item.createdAt),
      };
    }),
    likesCount: Number(data.likesCount || likes.length),
    commentsCount: Number(
      data.commentsCount || comments.filter((comment) => !(comment as { isDeleted?: boolean }).isDeleted).length
    ),
    sharesCount: Number(data.sharesCount || shares.length),
    reactionsCount: Number(data.reactionsCount || reactions.length),
    isDeleted: Boolean(data.isDeleted),
    deletedAt: toDateString(data.deletedAt),
    createdAt: toDateString(data.createdAt),
    updatedAt: toDateString(data.updatedAt),
  };
};

const assertReactionEmoji = (emoji: string): ReactionEmoji => {
  if (!allowedReactionEmojis.includes(emoji as ReactionEmoji)) {
    throw new AppError('Invalid reaction emoji', 400);
  }

  return emoji as ReactionEmoji;
};

export const rootValue = {
  async users(_args: unknown, context: GraphQLContext) {
    requireGraphQLUser(context);
    const users = await userServices.getAllUsers();
    return users.map(normalizeUser);
  },

  async me(_args: unknown, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await userServices.getUserById(user._id);
    return normalizeUser(data.user);
  },

  async posts(_args: unknown, context: GraphQLContext) {
    requireGraphQLUser(context);
    const data = await postServices.getAllPosts();
    return data.posts.map(normalizePost);
  },

  async feed(_args: unknown, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await postServices.getNewsFeed({ userId: user._id });
    return data.posts.map(normalizePost);
  },

  async myPosts(_args: unknown, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await postServices.getUserPosts({ userId: user._id });
    return data.posts.map(normalizePost);
  },

  async post({ postId }: { postId: string }, context: GraphQLContext) {
    requireGraphQLUser(context);
    const data = await postServices.getPostById({ postId });
    return normalizePost(data.post);
  },

  async dashboardSummary(_args: unknown, context: GraphQLContext) {
    requireGraphQLUser(context);
    return await postServices.getDashboardSummary();
  },

  async signup(args: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    age?: number;
    gender?: number;
  }) {
    return await authServices.signup(args);
  },

  async login({ email, password }: { email: string; password: string }) {
    return await authServices.login({ email, password });
  },

  async createPost({ title, body }: { title: string; body: string }, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await postServices.createPost({ title, body, id_owner: user._id });
    const payload = normalizePost(data.post);
    emitFeedEvent(socketEvents.postCreated, payload);
    return payload;
  },

  async updatePost(
    { postId, title, body }: { postId: string; title?: string; body?: string },
    context: GraphQLContext
  ) {
    const user = requireGraphQLUser(context);
    const input = {
      postId,
      userId: user._id,
      ...(title !== undefined && { title }),
      ...(body !== undefined && { body }),
    };
    const data = await postServices.updatePost(input);
    const payload = normalizePost(data.post);
    emitPostEvent(postId, socketEvents.postUpdated, payload);
    return payload;
  },

  async deletePost({ postId }: { postId: string }, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await postServices.deletePost({ postId, userId: user._id });
    emitPostEvent(postId, socketEvents.postDeleted, { postId, userId: user._id });
    return data;
  },

  async likePost({ postId }: { postId: string }, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await postServices.toggleLike({ postId, userId: user._id });
    emitPostEvent(postId, socketEvents.postLiked, { postId, userId: user._id, ...data });
    return data;
  },

  async reactToPost(
    { postId, emoji }: { postId: string; emoji: string },
    context: GraphQLContext
  ) {
    const user = requireGraphQLUser(context);
    const data = await postServices.reactToPost({
      postId,
      userId: user._id,
      emoji: assertReactionEmoji(emoji),
    });
    emitPostEvent(postId, socketEvents.postReacted, { postId, userId: user._id, ...data });
    return data;
  },

  async removeReaction({ postId }: { postId: string }, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await postServices.removeReaction({ postId, userId: user._id });
    emitPostEvent(postId, socketEvents.postReactionRemoved, {
      postId,
      userId: user._id,
      ...data,
    });
    return data;
  },

  async addComment({ postId, text }: { postId: string; text: string }, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await postServices.addComment({ postId, userId: user._id, text });
    emitPostEvent(postId, socketEvents.commentAdded, { postId, userId: user._id, text, ...data });
    return data;
  },

  async updateComment(
    { postId, commentId, text }: { postId: string; commentId: string; text: string },
    context: GraphQLContext
  ) {
    const user = requireGraphQLUser(context);
    const data = await postServices.updateComment({
      postId,
      commentId,
      userId: user._id,
      text,
    });
    const comment = normalizePost({ _id: postId, comment: [data.comment] }).comments[0];
    emitPostEvent(postId, socketEvents.commentUpdated, { postId, comment });
    return comment;
  },

  async deleteComment(
    { postId, commentId }: { postId: string; commentId: string },
    context: GraphQLContext
  ) {
    const user = requireGraphQLUser(context);
    const data = await postServices.deleteComment({ postId, commentId, userId: user._id });
    emitPostEvent(postId, socketEvents.commentDeleted, {
      postId,
      commentId,
      userId: user._id,
      ...data,
    });
    return data;
  },

  async sharePost({ postId }: { postId: string }, context: GraphQLContext) {
    const user = requireGraphQLUser(context);
    const data = await postServices.sharePost({ postId, userId: user._id });
    emitPostEvent(postId, socketEvents.postShared, { postId, userId: user._id, ...data });
    return data;
  },
};
