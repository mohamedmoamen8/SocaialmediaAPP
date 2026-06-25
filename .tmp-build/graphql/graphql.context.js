"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireGraphQLUser = exports.createGraphQLContext = void 0;
const authToken_1 = require("../security/authToken");
const resHandle_1 = require("../utils/errorHandle/resHandle");
const createGraphQLContext = async (req) => {
    const authorization = req.headers.authorization;
    if (!authorization)
        return {};
    return {
        user: await (0, authToken_1.authenticateAuthorizationHeader)(authorization),
    };
};
exports.createGraphQLContext = createGraphQLContext;
const requireGraphQLUser = (context) => {
    if (!context.user)
        throw new resHandle_1.AppError('Unauthorized', 401);
    return context.user;
};
exports.requireGraphQLUser = requireGraphQLUser;
