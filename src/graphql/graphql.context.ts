import { Request } from 'express';
import { authenticateAuthorizationHeader } from '../security/authToken';
import { IUserPayload } from '../modules/users/user.types';
import { AppError } from '../utils/errorHandle/resHandle';

export interface GraphQLContext extends Record<PropertyKey, unknown> {
  user?: IUserPayload;
}

export const createGraphQLContext = async (req: Request): Promise<GraphQLContext> => {
  const authorization = req.headers.authorization;
  if (!authorization) return {};

  return {
    user: await authenticateAuthorizationHeader(authorization),
  };
};

export const requireGraphQLUser = (context: GraphQLContext): IUserPayload => {
  if (!context.user) throw new AppError('Unauthorized', 401);
  return context.user;
};
