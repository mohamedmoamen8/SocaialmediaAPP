import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config';
import { IUserPayload } from '../modules/users/user.types';
import { AppError } from '../utils/errorHandle/resHandle';
import { userModel } from '../db/models/user.models';
import redisClient from '../utils/redisClient';

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new AppError('Authorization header is required', 401);

    const token = authHeader.split(' ')[1];
    if (!token) throw new AppError('Token is required', 401);

    const isBlacklisted = await redisClient.get(`blacklist_${token}`);
    if (isBlacklisted) throw new AppError('Token invalidated, please login again', 401);

    const decoded = jwt.verify(token, TOKEN_SECRET) as IUserPayload;

    const user = await userModel.findById(decoded._id).select('tokenVersion');
    if (!user) throw new AppError('User not found', 404);

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AppError('Session expired, please login again', 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};