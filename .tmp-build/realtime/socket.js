"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitPostEvent = exports.emitFeedEvent = exports.initializeSocket = exports.socketEvents = void 0;
const socket_io_1 = require("socket.io");
const config_1 = require("../config");
const authToken_1 = require("../security/authToken");
exports.socketEvents = {
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
};
let io = null;
const initializeSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: config_1.FRONTEND_URL || '*',
            credentials: true,
        },
    });
    io.use(async (socket, next) => {
        try {
            const token = typeof socket.handshake.auth.token === 'string'
                ? socket.handshake.auth.token
                : undefined;
            if (!token)
                return next(new Error('Socket authentication token is required'));
            const user = await (0, authToken_1.verifyAccessToken)(token);
            socket.data.user = user;
            socket.join(`user:${user._id}`);
            socket.join('feed');
            next();
        }
        catch (error) {
            next(error instanceof Error ? error : new Error('Socket authentication failed'));
        }
    });
    io.on('connection', (socket) => {
        socket.on('post:join', (postId) => {
            if (postId)
                socket.join(`post:${postId}`);
        });
        socket.on('post:leave', (postId) => {
            if (postId)
                socket.leave(`post:${postId}`);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const emitFeedEvent = (event, payload) => {
    io?.to('feed').emit(event, payload);
};
exports.emitFeedEvent = emitFeedEvent;
const emitPostEvent = (postId, event, payload) => {
    io?.to('feed').to(`post:${postId}`).emit(event, payload);
};
exports.emitPostEvent = emitPostEvent;
