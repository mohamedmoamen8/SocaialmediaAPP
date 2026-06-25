"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const sucess_res_1 = require("../../utils/errorHandle/sucess.res");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const resHandle_1 = require("../../utils/errorHandle/resHandle");
const posts_services_1 = __importDefault(require("./posts.services"));
const socket_1 = require("../../realtime/socket");
const posts_validation_1 = require("./posts.validation");
const router = (0, express_1.Router)();
const getParam = (value, name) => {
    if (typeof value !== 'string')
        throw new resHandle_1.AppError(`${name} is required`, 400);
    return value;
};
router.post('/', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.createPostSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const { title, body } = req.body;
        const data = await posts_services_1.default.createPost({
            title,
            body,
            id_owner: req.user._id,
        });
        (0, socket_1.emitFeedEvent)(socket_1.socketEvents.postCreated, data.post);
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Post created', status: 201 });
    }
    catch (error) {
        next(error);
    }
});
router.get('/', auth_middleware_1.authentication, async (_req, res, next) => {
    try {
        const data = await posts_services_1.default.getAllPosts();
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Posts retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/feed', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await posts_services_1.default.getNewsFeed({ userId: req.user._id });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'News feed retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/dashboard/summary', auth_middleware_1.authentication, async (_req, res, next) => {
    try {
        const data = await posts_services_1.default.getDashboardSummary();
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Dashboard summary retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/my-posts', auth_middleware_1.authentication, async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await posts_services_1.default.getUserPosts({ userId: req.user._id });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Your posts retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/profile/:userId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.userIdParamSchema), async (req, res, next) => {
    try {
        const data = await posts_services_1.default.getUserPosts({
            userId: getParam(req.params.userId, 'userId'),
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Profile posts retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:postId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.postIdSchema), async (req, res, next) => {
    try {
        const data = await posts_services_1.default.getPostById({
            postId: getParam(req.params.postId, 'postId'),
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Post retrieved' });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:postId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.updatePostSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const { title, body } = req.body;
        const payload = {
            postId: getParam(req.params.postId, 'postId'),
            userId: req.user._id,
            ...(title !== undefined && { title }),
            ...(body !== undefined && { body }),
        };
        const data = await posts_services_1.default.updatePost(payload);
        (0, socket_1.emitPostEvent)(payload.postId, socket_1.socketEvents.postUpdated, data.post);
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Post updated' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:postId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.postIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const postId = getParam(req.params.postId, 'postId');
        const data = await posts_services_1.default.deletePost({
            postId,
            userId: req.user._id,
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postDeleted, { postId, userId: req.user._id });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Post deleted' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:postId/hard', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.postIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await posts_services_1.default.hardDeletePost({
            postId: getParam(req.params.postId, 'postId'),
            userId: req.user._id,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Post permanently deleted' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:postId/like', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.postIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const postId = getParam(req.params.postId, 'postId');
        const data = await posts_services_1.default.toggleLike({
            postId,
            userId: req.user._id,
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postLiked, { postId, userId: req.user._id, ...data });
        (0, sucess_res_1.SuccessRes)({ res, data, message: data.message });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:postId/react', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.reactPostSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const postId = getParam(req.params.postId, 'postId');
        const data = await posts_services_1.default.reactToPost({
            postId,
            userId: req.user._id,
            emoji: req.body.emoji,
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postReacted, { postId, userId: req.user._id, ...data });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Reaction saved' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:postId/react', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.postIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const postId = getParam(req.params.postId, 'postId');
        const data = await posts_services_1.default.removeReaction({
            postId,
            userId: req.user._id,
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postReactionRemoved, {
            postId,
            userId: req.user._id,
            ...data,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Reaction removed' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:postId/comment', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.addCommentSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const postId = getParam(req.params.postId, 'postId');
        const { text } = req.body;
        const data = await posts_services_1.default.addComment({
            postId,
            userId: req.user._id,
            text,
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.commentAdded, {
            postId,
            userId: req.user._id,
            text,
            ...data,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Comment added' });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:postId/comment/:commentId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.updateCommentSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const postId = getParam(req.params.postId, 'postId');
        const data = await posts_services_1.default.updateComment({
            postId,
            commentId: getParam(req.params.commentId, 'commentId'),
            userId: req.user._id,
            text: req.body.text,
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.commentUpdated, { postId, comment: data.comment });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Comment updated' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:postId/comment/:commentId', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.commentIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const postId = getParam(req.params.postId, 'postId');
        const commentId = getParam(req.params.commentId, 'commentId');
        const data = await posts_services_1.default.deleteComment({
            postId,
            commentId,
            userId: req.user._id,
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.commentDeleted, {
            postId,
            commentId,
            userId: req.user._id,
            ...data,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Comment deleted' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:postId/comment/:commentId/hard', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.commentIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const data = await posts_services_1.default.hardDeleteComment({
            postId: getParam(req.params.postId, 'postId'),
            commentId: getParam(req.params.commentId, 'commentId'),
            userId: req.user._id,
        });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Comment permanently deleted' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:postId/share', auth_middleware_1.authentication, (0, validation_middleware_1.validation)(posts_validation_1.postIdSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new resHandle_1.AppError('Unauthorized', 401);
        const postId = getParam(req.params.postId, 'postId');
        const data = await posts_services_1.default.sharePost({
            postId,
            userId: req.user._id,
        });
        (0, socket_1.emitPostEvent)(postId, socket_1.socketEvents.postShared, { postId, userId: req.user._id, ...data });
        (0, sucess_res_1.SuccessRes)({ res, data, message: 'Post shared' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
