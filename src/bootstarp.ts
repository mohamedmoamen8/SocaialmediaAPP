import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createHandler } from 'graphql-http/lib/use/express';
import { PORT } from './config';
import userRouter from './modules/users/users.controller';
import authRouter from './modules/auth/auth.controller';
import postRouter from './modules/posts/posts.controller';
import storyRouter from './modules/stories/stories.controller';
import uploadRouter from './modules/uploads/uploads.controller';
import { AppError, NotFoundError } from './utils/errorHandle/resHandle';
import redisClient from './utils/redisClient';
import { dbConnection } from './db/dbConnection';
import { schema, rootValue } from './graphql/schema';
import { createGraphQLContext, GraphQLContext } from './graphql/graphql.context';
import { initializeSocket } from './realtime/socket';

const app: Express = express();

export const bootstrap = async () => {
  await redisClient.connect();
  await dbConnection();

  const httpServer = createServer(app);
  initializeSocket(httpServer);

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/test', (_req, res) => {
    res.json({ message: 'Express works' });
  });

  app.all(
    '/graphql',
    createHandler<GraphQLContext>({
      schema,
      rootValue,
      context: async (req) => createGraphQLContext(req.raw),
    })
  );

  app.use('/auth', authRouter);
  app.use('/users', userRouter);
  app.use('/posts', postRouter);
  app.use('/stories', storyRouter);
  app.use('/uploads', uploadRouter);

  app.all('/{*path}', (req: Request, _res: Response) => {
    throw new NotFoundError(`url not found: ${req.path}`);
  });

  app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.statusCode || 500).json({
      errMsg: err.message,
      status: err.statusCode || 500,
    });
  });

  httpServer.listen(PORT || 3002, () => {
    console.log(`Server is running on port ${process.env.PORT || 3002}`);
  });
};
