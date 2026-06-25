"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const sucess_res_1 = require("../../utils/errorHandle/sucess.res");
const resHandle_1 = require("../../utils/errorHandle/resHandle");
const stories_services_1 = __importDefault(require("./stories.services"));
const stories_validation_1 = require("./stories.validation");
const router = (0, express_1.Router)();
const getParam = (value, name) => {
    if (typeof value !== 'string')
        throw new resHandle_1.AppError(`${name} is required`, 400);
    return value;
};
router.post('/', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(stories_validation_1.createStorySchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await stories_services_1.default.createStory({
            userId: req.user._id,
            mediaUrl: req.body.mediaUrl,
            caption: req.body.caption,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Story created', status: 201 });
    }
    catch (error) {
        next(error);
    }
});
router.get('/', auth_middleware_1.authentication, async (_req, res, next) => {
    try {
        const data = await stories_services_1.default.getActiveStories();
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Stories retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/my-stories', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await stories_services_1.default.getMyStories({ userId: req.user._id });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Your stories retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:storyId/view', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(stories_validation_1.storyIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await stories_services_1.default.viewStory({
            storyId: getParam(req.params.storyId, 'storyId'),
            userId: req.user._id,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Story viewed' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:storyId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(stories_validation_1.storyIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await stories_services_1.default.deleteStory({
            storyId: getParam(req.params.storyId, 'storyId'),
            userId: req.user._id,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Story deleted' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:storyId/hard', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(stories_validation_1.storyIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await stories_services_1.default.hardDeleteStory({
            storyId: getParam(req.params.storyId, 'storyId'),
            userId: req.user._id,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Story permanently deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
