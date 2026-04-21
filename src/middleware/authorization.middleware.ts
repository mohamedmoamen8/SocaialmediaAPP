import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../modules/users/user.types';
import { AppError } from '../utils/errorHandle/resHandle';

export const authorization = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      if (!roles.includes(req.user.role as UserRole)) {
        throw new AppError('Forbidden - insufficient permissions', 403);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};