import { Request, Response, NextFunction } from 'express';
import { authenticateAuthorizationHeader } from '../security/authToken';

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    req.user = await authenticateAuthorizationHeader(req.headers.authorization);
    next();
  } catch (error) {
    next(error);
  }
};
