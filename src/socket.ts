import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from './security/authToken';
import { userModel } from './db/models/user.models';
import { IUser } from './db/models/user.models';
import { chatModel } from './db/models/chat.model';
import { messageModel } from './db/models/message.model';
import { FRONTEND_URL } from './config';

let io: Server;

interface AuthenticatedSocket extends Socket {
  user: IUser;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL || '*',
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }
    try {
      const decoded = await verifyAccessToken(token);
      const user = await userModel.findById(decoded._id).lean();
      if (!user) {
        return next(new Error('Authentication error: User not found.'));
      }
      (socket as AuthenticatedSocket).user = user as IUser;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);
    const user = (socket as AuthenticatedSocket).user;

    // Join a room for the user's own ID to receive direct notifications
    socket.join(user._id.toString());

    // Join the global feed room for post events
    socket.join('feed');

    // Automatically join rooms for all chats the user is a part of
    const userChats = await chatModel.find({ participants: user._id }).select('_id').lean();
    userChats.forEach(chat => {
      socket.join(chat._id.toString());
    });

    // Listen for typing indicators
    socket.on('chat:typing:start', ({ chatId }: { chatId: string }) => {
      const user = (socket as AuthenticatedSocket).user;
      // Broadcast to other users in the chat room
      socket.to(chatId).emit('chat:typing:started', {
        user: { _id: user._id, firstName: user.firstName, lastName: user.lastName },
        chatId,
      });
    });

    socket.on('chat:typing:stop', ({ chatId }: { chatId: string }) => {
      const user = (socket as AuthenticatedSocket).user;
      // Broadcast to other users in the chat room
      socket.to(chatId).emit('chat:typing:stopped', {
        user: { _id: user._id, firstName: user.firstName, lastName: user.lastName },
        chatId,
      });
    });

    // Listen for when a user has read messages in a chat
    socket.on('chat:messages:read', async ({ chatId }: { chatId: string }) => {
      const user = (socket as AuthenticatedSocket).user;
      try {
        const userId = user._id;

        // Update all messages in the chat that are not from the current user
        // and that the user has not yet read.
        const updateResult = await messageModel.updateMany(
          { chat: chatId, sender: { $ne: userId }, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        // If messages were updated, notify the entire chat room.
        if (updateResult.modifiedCount > 0) {
          io.to(chatId).emit('chat:messages:seen', { chatId, userId });
        }
      } catch (error) {
        console.error('Error in chat:messages:read event:', error);
      }
    });

    // Allow clients to dynamically join a chat room
    socket.on('chat:join', ({ chatId }: { chatId: string }) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export { io };

export const emitFeedEvent = (event: string, payload: unknown): void => {
  io?.to('feed').emit(event, payload);
};

export const emitPostEvent = (postId: string, event: string, payload: unknown): void => {
  io?.to('feed').to(`post:${postId}`).emit(event, payload);
};