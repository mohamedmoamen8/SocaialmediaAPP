import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { FRONTEND_URL } from '../config';
import { verifyAccessToken } from '../security/authToken';

export const socketEvents = {
  postCreated: 'post:created',
  postUpdated: 'post:updated',
  postDeleted: 'post:deleted',
  postLiked: 'post:liked',
  postReacted: 'post:reacted',
  postReactionRemoved: 'post:reaction:removed',
  commentAdded: 'comment:added',
  commentUpdated: 'comment:updated',
  commentDeleted: 'comment:deleted',
  postShared: 'post:shared',
} as const;

let io: Server | null = null;

export const initializeSocket = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL || '*',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        typeof socket.handshake.auth.token === 'string'
          ? socket.handshake.auth.token
          : undefined;

      if (!token) return next(new Error('Socket authentication token is required'));

      const user = await verifyAccessToken(token);
      socket.data.user = user;
      socket.join(`user:${user._id}`);
      socket.join('feed');
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('post:join', (postId: string) => {
      if (postId) socket.join(`post:${postId}`);
    });

    socket.on('post:leave', (postId: string) => {
      if (postId) socket.leave(`post:${postId}`);
    });
  });

  return io;
};

export const emitFeedEvent = (event: string, payload: unknown): void => {
  io?.to('feed').emit(event, payload);
};

export const emitPostEvent = (postId: string, event: string, payload: unknown): void => {
  io?.to('feed').to(`post:${postId}`).emit(event, payload);
};
