"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const stories_models_1 = require("../../db/models/stories.models");
const resHandle_1 = require("../../utils/errorHandle/resHandle");
class StoryServices {
    model;
    constructor() {
        this.model = stories_models_1.storyModel;
    }
    async createStory({ userId, mediaUrl, caption }) {
        const story = await this.model.create({
            id_owner: new mongoose_1.Types.ObjectId(userId),
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
    async getMyStories({ userId }) {
        const stories = await this.model
            .find({ id_owner: new mongoose_1.Types.ObjectId(userId) })
            .populate('id_owner', 'firstName lastName profilePicture')
            .sort({ createdAt: -1 });
        return { stories };
    }
    async viewStory({ storyId, userId }) {
        const story = await this.model.findById(storyId);
        if (!story)
            throw new resHandle_1.NotFoundError('Story not found');
        const alreadyViewed = story.viewers.some((id) => id.toString() === userId);
        if (!alreadyViewed) {
            story.viewers.push(new mongoose_1.Types.ObjectId(userId));
            await story.save();
        }
        return { story };
    }
    async deleteStory({ storyId, userId }) {
        const story = await this.model.findById(storyId);
        if (!story)
            throw new resHandle_1.NotFoundError('Story not found');
        if (story.id_owner.toString() !== userId) {
            throw new resHandle_1.AppError('Unauthorized - not the story owner', 403);
        }
        await story.softDelete();
        return { message: 'Story deleted successfully' };
    }
    async hardDeleteStory({ storyId, userId }) {
        const story = await this.model.findById(storyId).setOptions({ withDeleted: true });
        if (!story)
            throw new resHandle_1.NotFoundError('Story not found');
        if (story.id_owner.toString() !== userId) {
            throw new resHandle_1.AppError('Unauthorized - not the story owner', 403);
        }
        await stories_models_1.storyModel.hardDeleteById(storyId);
        return { message: 'Story permanently deleted successfully' };
    }
}
exports.default = new StoryServices();
