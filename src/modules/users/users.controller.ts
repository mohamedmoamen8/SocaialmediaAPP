import { Router, type Router as RouterType } from 'express';
import { SuccessRes } from '../../utils/errorHandle/sucess.res';
import { authentication } from '../../middleware/auth.middleware';
import { validation } from '../../middleware/validation.middleware';
import userServices from './user.services';
import { AppError } from '../../utils/errorHandle/resHandle';
import { updatePasswordSchema } from '../auth/auth.validation';
import { updateUserSchema, userIdSchema } from './users.validation';

const router: RouterType = Router();

const getParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== 'string') throw new AppError(`${name} is required`, 400);
  return value;
};

router.get('/', authentication, async (_req, res, next) => {
  try {
    const data = await userServices.getAllUsers();
    SuccessRes({ res, data, message: 'Users retrieved successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authentication, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await userServices.getUserById(req.user._id);
    SuccessRes({ res, data, message: 'Profile retrieved successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/email', authentication, async (req, res, next) => {
  try {
    const email = req.query.email as string;
    const user = await userServices.getUserByEmail(email);
    if (!user) throw new AppError('User not found', 404);
    SuccessRes({ res, data: user, message: 'User found successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/:userId', authentication, validation(userIdSchema), async (req, res, next) => {
  try {
    const data = await userServices.getUserById(getParam(req.params.userId, 'userId'));
    SuccessRes({ res, data, message: 'User retrieved successfully' });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', authentication, validation(updateUserSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await userServices.updateUser({
      userId: req.user._id,
      ...req.body,
    });
    SuccessRes({ res, data, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/update-password',
  authentication,
  validation(updatePasswordSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };
      const data = await userServices.updatePassword({
        userId: req.user._id,
        currentPassword,
        newPassword,
      });
      SuccessRes({ res, data, message: 'Password updated' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/me', authentication, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await userServices.softDeleteUser({ userId: req.user._id });
    SuccessRes({ res, data, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/me/hard', authentication, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const data = await userServices.hardDeleteUser({ userId: req.user._id });
    SuccessRes({ res, data, message: 'User permanently deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
