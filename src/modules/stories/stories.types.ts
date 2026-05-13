export interface ICreateStoryInput {
  userId: string;
  mediaUrl: string;
  caption?: string;
}

export interface IStoryOwnerInput {
  storyId: string;
  userId: string;
}
