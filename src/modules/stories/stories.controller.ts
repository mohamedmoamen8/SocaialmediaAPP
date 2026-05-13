import { Router } from 'express';
import { authentication } from '../../middleware/auth.middleware';
import { validation } from '../../middleware/validation.middleware';
import { SuccessRes } from '../../utils/errorHandle/sucess.res';
import { AppError } from '../../utils/errorHandle/resHandle';
import storyServices from './stories.services';
import { createStorySchema, storyIdSchema } from './stories.validation';

const router = Router();

const getParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== 'string') throw new AppError(`${name} is required`, 400);
  return value;
};

router.post('/', authentication, validation(createStorySchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const data = await storyServices.createStory({
      userId: req.user._id,
      mediaUrl: req.body.mediaUrl,
      caption: req.body.caption,
    });

    SuccessRes({ res, data, message: 'Story created', status: 201 });
  } catch (error) {
    next(error);
  }
});

router.get('/', authentication, async (_req, res, next) => {
  try {
    const data = await storyServices.getActiveStories();
    SuccessRes({ res, data, message: 'Stories retrieved' });
  } catch (error) {
    next(error);
  }
});

router.get('/my-stories', authentication, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await storyServices.getMyStories({ userId: req.user._id });
    SuccessRes({ res, data, message: 'Your stories retrieved' });
  } catch (error) {
    next(error);
  }
});

router.post('/:storyId/view', authentication, validation(storyIdSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await storyServices.viewStory({
      storyId: getParam(req.params.storyId, 'storyId'),
      userId: req.user._id,
    });
    SuccessRes({ res, data, message: 'Story viewed' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:storyId', authentication, validation(storyIdSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await storyServices.deleteStory({
      storyId: getParam(req.params.storyId, 'storyId'),
      userId: req.user._id,
    });
    SuccessRes({ res, data, message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:storyId/hard', authentication, validation(storyIdSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await storyServices.hardDeleteStory({
      storyId: getParam(req.params.storyId, 'storyId'),
      userId: req.user._id,
    });
    SuccessRes({ res, data, message: 'Story permanently deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
