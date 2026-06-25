"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const express_2 = require("graphql-http/lib/use/express");
const config_1 = require("./config");
const users_controller_1 = __importDefault(require("./modules/users/users.controller"));
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const posts_controller_1 = __importDefault(require("./modules/posts/posts.controller"));
const stories_controller_1 = __importDefault(require("./modules/stories/stories.controller"));
const uploads_controller_1 = __importDefault(require("./modules/uploads/uploads.controller"));
const resHandle_1 = require("./utils/errorHandle/resHandle");
const redisClient_1 = __importDefault(require("./utils/redisClient"));
const dbConnection_1 = require("./db/dbConnection");
const schema_1 = require("./graphql/schema");
const graphql_context_1 = require("./graphql/graphql.context");
const socket_1 = require("./realtime/socket");
const app = (0, express_1.default)();
const bootstrap = async () => {
    await redisClient_1.default.connect();
    await (0, dbConnection_1.dbConnection)();
    const httpServer = (0, http_1.createServer)(app);
    (0, socket_1.initializeSocket)(httpServer);
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.get('/test', (_req, res) => {
        res.json({ message: 'Express works' });
    });
    app.all('/graphql', (0, express_2.createHandler)({
        schema: schema_1.schema,
        rootValue: schema_1.rootValue,
        context: async (req) => (0, graphql_context_1.createGraphQLContext)(req.raw),
    }));
    app.use('/auth', auth_controller_1.default);
    app.use('/users', users_controller_1.default);
    app.use('/posts', posts_controller_1.default);
    app.use('/stories', stories_controller_1.default);
    app.use('/uploads', uploads_controller_1.default);
    app.all('/{*path}', (req, _res) => {
        throw new resHandle_1.NotFoundError(`url not found: ${req.path}`);
    });
    app.use((err, _req, res, _next) => {
        res.status(err.statusCode || 500).json({
            errMsg: err.message,
            status: err.statusCode || 500,
        });
    });
    httpServer.listen(config_1.PORT || 3002, () => {
        console.log(`Server is running on port ${process.env.PORT || 3002}`);
    });
};
exports.bootstrap = bootstrap;
