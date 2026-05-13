import { ReactionEmoji } from '../../db/models/posts.models';

export interface ICreatePostInput {
  title: string;
  body: string;
  id_owner: string;
}

export interface IUpdatePostInput {
  postId: string;
  userId: string;
  title?: string;
  body?: string;
}

export interface IAddCommentInput {
  postId: string;
  userId: string;   
  text: string;     
}

export interface ILikePostInput {
  postId: string;
  userId: string;
}

export interface ISharePostInput {
  postId: string;
  userId: string;
}

export interface IDeletePostInput {
  postId: string;
  userId: string;
}

export interface ICommentIdInput extends IDeletePostInput {
  commentId: string;
}

export interface IUpdateCommentInput extends ICommentIdInput {
  text: string;
}

export interface IReactPostInput {
  postId: string;
  userId: string;
  emoji: ReactionEmoji;
}
