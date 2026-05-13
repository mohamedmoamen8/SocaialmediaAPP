import { Router } from 'express';
import { validation } from '../../middleware/validation.middleware';
import { SuccessRes } from '../../utils/errorHandle/sucess.res';
import { authentication } from '../../middleware/auth.middleware';
import { AppError } from '../../utils/errorHandle/resHandle';
import postServices from './posts.services';
import {
  addCommentSchema,
  commentIdSchema,
  createPostSchema,
  postIdSchema,
  reactPostSchema,
  updateCommentSchema,
  updatePostSchema,
  userIdParamSchema,
} from './posts.validation';

const router = Router();

const getParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== 'string') throw new AppError(`${name} is required`, 400);
  return value;
};

router.post('/', authentication, validation(createPostSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { title, body } = req.body as { title: string; body: string };
    const data = await postServices.createPost({
      title,
      body,
      id_owner: req.user._id,
    });

    SuccessRes({ res, data, message: 'Post created', status: 201 });
  } catch (error) {
    next(error);
  }
});

router.get('/', authentication, async (_req, res, next) => {
  try {
    const data = await postServices.getAllPosts();
    SuccessRes({ res, data, message: 'Posts retrieved' });
  } catch (error) {
    next(error);
  }
});

router.get('/feed', authentication, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await postServices.getNewsFeed({ userId: req.user._id });
    SuccessRes({ res, data, message: 'News feed retrieved' });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/summary', authentication, async (_req, res, next) => {
  try {
    const data = await postServices.getDashboardSummary();
    SuccessRes({ res, data, message: 'Dashboard summary retrieved' });
  } catch (error) {
    next(error);
  }
});

router.get('/my-posts', authentication, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await postServices.getUserPosts({ userId: req.user._id });
    SuccessRes({ res, data, message: 'Your posts retrieved' });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/profile/:userId',
  authentication,
  validation(userIdParamSchema),
  async (req, res, next) => {
    try {
      const data = await postServices.getUserPosts({
        userId: getParam(req.params.userId, 'userId'),
      });
      SuccessRes({ res, data, message: 'Profile posts retrieved' });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:postId', authentication, validation(postIdSchema), async (req, res, next) => {
  try {
    const data = await postServices.getPostById({
      postId: getParam(req.params.postId, 'postId'),
    });
    SuccessRes({ res, data, message: 'Post retrieved' });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:postId',
  authentication,
  validation(updatePostSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { title, body } = req.body as { title?: string; body?: string };
      const payload = {
        postId: getParam(req.params.postId, 'postId'),
        userId: req.user._id,
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
      };
      const data = await postServices.updatePost(payload);

      SuccessRes({ res, data, message: 'Post updated' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:postId', authentication, validation(postIdSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const data = await postServices.deletePost({
      postId: getParam(req.params.postId, 'postId'),
      userId: req.user._id,
    });

    SuccessRes({ res, data, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
});

router.delete(
  '/:postId/hard',
  authentication,
  validation(postIdSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const data = await postServices.hardDeletePost({
        postId: getParam(req.params.postId, 'postId'),
        userId: req.user._id,
      });

      SuccessRes({ res, data, message: 'Post permanently deleted' });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:postId/like', authentication, validation(postIdSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const data = await postServices.toggleLike({
      postId: getParam(req.params.postId, 'postId'),
      userId: req.user._id,
    });

    SuccessRes({ res, data, message: data.message });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:postId/react',
  authentication,
  validation(reactPostSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const data = await postServices.reactToPost({
        postId: getParam(req.params.postId, 'postId'),
        userId: req.user._id,
        emoji: req.body.emoji,
      });

      SuccessRes({ res, data, message: 'Reaction saved' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:postId/react', authentication, validation(postIdSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const data = await postServices.removeReaction({
      postId: getParam(req.params.postId, 'postId'),
      userId: req.user._id,
    });

    SuccessRes({ res, data, message: 'Reaction removed' });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:postId/comment',
  authentication,
  validation(addCommentSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const { text } = req.body as { text: string };
      const data = await postServices.addComment({
        postId: getParam(req.params.postId, 'postId'),
        userId: req.user._id,
        text,
      });

      SuccessRes({ res, data, message: 'Comment added' });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:postId/comment/:commentId',
  authentication,
  validation(updateCommentSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const data = await postServices.updateComment({
        postId: getParam(req.params.postId, 'postId'),
        commentId: getParam(req.params.commentId, 'commentId'),
        userId: req.user._id,
        text: req.body.text,
      });

      SuccessRes({ res, data, message: 'Comment updated' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:postId/comment/:commentId',
  authentication,
  validation(commentIdSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const data = await postServices.deleteComment({
        postId: getParam(req.params.postId, 'postId'),
        commentId: getParam(req.params.commentId, 'commentId'),
        userId: req.user._id,
      });

      SuccessRes({ res, data, message: 'Comment deleted' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:postId/comment/:commentId/hard',
  authentication,
  validation(commentIdSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const data = await postServices.hardDeleteComment({
        postId: getParam(req.params.postId, 'postId'),
        commentId: getParam(req.params.commentId, 'commentId'),
        userId: req.user._id,
      });

      SuccessRes({ res, data, message: 'Comment permanently deleted' });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:postId/share', authentication, validation(postIdSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const data = await postServices.sharePost({
      postId: getParam(req.params.postId, 'postId'),
      userId: req.user._id,
    });

    SuccessRes({ res, data, message: 'Post shared' });
  } catch (error) {
    next(error);
  }
});

export default router;
