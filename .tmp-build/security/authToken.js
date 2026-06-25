"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAuthorizationHeader = exports.verifyAccessToken = exports.getBearerToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const resHandle_1 = require("../utils/errorHandle/resHandle");
const user_models_1 = require("../db/models/user.models");
const redisClient_1 = __importDefault(require("../utils/redisClient"));
const getBearerToken = (authorization) => {
    if (!authorization)
        throw new resHandle_1.AppError('Authorization header is required', 401);
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token)
        throw new resHandle_1.AppError('Bearer token is required', 401);
    return token;
};
exports.getBearerToken = getBearerToken;
const verifyAccessToken = async (token) => {
    const isBlacklisted = await redisClient_1.default.get(`blacklist_${token}`);
    if (isBlacklisted)
        throw new resHandle_1.AppError('Token invalidated, please login again', 401);
    const decoded = jsonwebtoken_1.default.verify(token, config_1.TOKEN_SECRET);
    const user = await user_models_1.userModel.findById(decoded._id).select('tokenVersion');
    if (!user)
        throw new resHandle_1.AppError('User not found', 404);
    if (decoded.tokenVersion !== user.tokenVersion) {
        throw new resHandle_1.AppError('Session expired, please login again', 401);
    }
    return decoded;
};
exports.verifyAccessToken = verifyAccessToken;
const authenticateAuthorizationHeader = async (authorization) => (0, exports.verifyAccessToken)((0, exports.getBearerToken)(authorization));
exports.authenticateAuthorizationHeader = authenticateAuthorizationHeader;
