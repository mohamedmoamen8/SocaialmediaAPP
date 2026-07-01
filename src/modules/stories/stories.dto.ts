export interface CreateStoryDto {
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
}

export interface ViewStoryDto {
  storyId: string;
  userId: string;
}