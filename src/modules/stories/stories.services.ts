import { Model, Types } from 'mongoose';
import { storyModel, IStoryDocument } from '../../db/models/stories.models';
import { AppError, NotFoundError } from '../../utils/errorHandle/resHandle';
import { ICreateStoryInput, IStoryOwnerInput } from './stories.types';

class StoryServices {
  private readonly model: Model<IStoryDocument>;

  constructor() {
    this.model = storyModel;
  }

  async createStory({ userId, mediaUrl, caption }: ICreateStoryInput) {
    const story = await this.model.create({
      id_owner: new Types.ObjectId(userId),
      mediaUrl,
      ...(caption !== undefined && { caption }),
    });

    return { story };
  }

  async getActiveStories() {
    const stories = await this.model
      .find()
      .populate('id_owner', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    return { stories };
  }

  async getMyStories({ userId }: { userId: string }) {
    const stories = await this.model
      .find({ id_owner: new Types.ObjectId(userId) })
      .populate('id_owner', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    return { stories };
  }

  async viewStory({ storyId, userId }: IStoryOwnerInput) {
    const story = await this.model.findById(storyId);
    if (!story) throw new NotFoundError('Story not found');

    const alreadyViewed = story.viewers.some((id) => id.toString() === userId);
    if (!alreadyViewed) {
      story.viewers.push(new Types.ObjectId(userId));
      await story.save();
    }

    return { story };
  }

  async deleteStory({ storyId, userId }: IStoryOwnerInput) {
    const story = await this.model.findById(storyId);
    if (!story) throw new NotFoundError('Story not found');
    if (story.id_owner.toString() !== userId) {
      throw new AppError('Unauthorized - not the story owner', 403);
    }

    await story.softDelete();
    return { message: 'Story deleted successfully' };
  }

  async hardDeleteStory({ storyId, userId }: IStoryOwnerInput) {
    const story = await this.model.findById(storyId).setOptions({ withDeleted: true });
    if (!story) throw new NotFoundError('Story not found');
    if (story.id_owner.toString() !== userId) {
      throw new AppError('Unauthorized - not the story owner', 403);
    }

    await storyModel.hardDeleteById(storyId);
    return { message: 'Story permanently deleted successfully' };
  }
}

export default new StoryServices();
