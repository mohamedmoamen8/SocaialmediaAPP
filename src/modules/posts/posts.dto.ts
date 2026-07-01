export interface CreatePostDto {
  userId: string;
  content: string;
  mediaUrls?: string[];
}

export interface UpdatePostDto {
  postId: string;
  userId: string;
  content: string;
}

export interface ReactToPostDto {
  postId: string;
  userId: string;
  reaction: string;
}

export interface AddCommentDto {
  postId: string;
  userId: string;
  content: string;
}