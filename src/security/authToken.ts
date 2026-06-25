import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config';
import { IUserPayload } from '../modules/users/user.types';
import { AppError } from '../utils/errorHandle/resHandle';
import { userModel } from '../db/models/user.models';
import redisClient from '../utils/redisClient';

export const getBearerToken = (authorization?: string): string => {
  if (!authorization) throw new AppError('Authorization header is required', 401);

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Bearer token is required', 401);

  return token;
};

export const verifyAccessToken = async (token: string): Promise<IUserPayload> => {
  const isBlacklisted = await redisClient.get(`blacklist_${token}`);
  if (isBlacklisted) throw new AppError('Token invalidated, please login again', 401);

  const decoded = jwt.verify(token, TOKEN_SECRET) as IUserPayload;
  const user = await userModel.findById(decoded._id).select('tokenVersion');
  if (!user) throw new AppError('User not found', 404);

  if (decoded.tokenVersion !== user.tokenVersion) {
    throw new AppError('Session expired, please login again', 401);
  }

  return decoded;
};

export const authenticateAuthorizationHeader = async (
  authorization?: string
): Promise<IUserPayload> => verifyAccessToken(getBearerToken(authorization));
