import { Router, Request, Response, NextFunction } from 'express';
import { validation } from '../../middleware/validation.middleware';
import { SuccessRes } from '../../utils/errorHandle/sucess.res';
import { authentication } from '../../middleware/auth.middleware';
import chatServices from './chats.services';
import {
  accessChatSchema,
  createGroupChatSchema,
  groupActionSchema,
  renameGroupSchema,
  sendMessageSchema,
} from './chats.validation';
import { BadRequestError } from '../../utils/errorHandle/resHandle';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  fn(req, res, next).catch(next);
};

const router = Router();
router.use(authentication);

// 1-on-1 Chats
router.post('/', validation(accessChatSchema), asyncHandler(async (req, res) => {
    const data = await chatServices.accessChat({ currentUserId: req.user!._id, otherUserId: req.body.userId });
    SuccessRes({ res, data, message: 'Chat accessed successfully' });
}));

// Get all user's chats
router.get('/', asyncHandler(async (req, res) => {
    const data = await chatServices.getMyChats({ userId: req.user!._id });
    SuccessRes({ res, data, message: 'Chats retrieved successfully' });
}));

// Group Chats
router.post('/group', validation(createGroupChatSchema), asyncHandler(async (req, res) => {
    const data = await chatServices.createGroupChat({ adminId: req.user!._id, ...req.body });
    SuccessRes({ res, data, message: 'Group chat created successfully' });
}));

router.patch('/group/:chatId/rename', validation(renameGroupSchema), asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    if (typeof chatId !== 'string') throw new BadRequestError('Invalid Chat ID');
    const data = await chatServices.renameGroup({
      userId: req.user!._id,
      chatId,
      chatName: req.body.chatName,
    });
    SuccessRes({ res, data, message: 'Group renamed successfully' });
}));

router.patch('/group/:chatId/add', validation(groupActionSchema), asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    if (typeof chatId !== 'string') throw new BadRequestError('Invalid Chat ID');
    const data = await chatServices.addToGroup({
      adminId: req.user!._id,
      chatId,
      userIdToAdd: req.body.userId,
    });
    SuccessRes({ res, data, message: 'User added to group' });
}));

router.patch('/group/:chatId/remove', validation(groupActionSchema), asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    if (typeof chatId !== 'string') throw new BadRequestError('Invalid Chat ID');
    const data = await chatServices.removeFromGroup({
      adminId: req.user!._id,
      chatId,
      userIdToRemove: req.body.userId,
    });
    SuccessRes({ res, data, message: 'User removed from group' });
}));

router.delete('/group/:chatId/leave', asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    if (typeof chatId !== 'string') throw new BadRequestError('Invalid Chat ID');
    const data = await chatServices.leaveGroup({ userId: req.user!._id, chatId });
    SuccessRes({ res, data, message: 'Left group successfully' });
}));

// Messages
router.post('/messages', validation(sendMessageSchema), asyncHandler(async (req, res) => {
    const data = await chatServices.sendMessage({ senderId: req.user!._id, ...req.body });
    SuccessRes({ res, data, message: 'Message sent successfully' });
}));

router.get('/:chatId/messages', asyncHandler(async (req, res) => {
    const { chatId } = req.params as { chatId: string };
    if (typeof chatId !== 'string') throw new BadRequestError('Invalid Chat ID');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const data = await chatServices.getChatMessages({
      chatId,
      userId: req.user!._id,
      page,
      limit,
    });
    SuccessRes({ res, data, message: 'Messages retrieved successfully' });
}));

export default router;