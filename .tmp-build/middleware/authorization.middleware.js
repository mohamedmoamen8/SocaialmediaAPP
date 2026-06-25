"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const resHandle_1 = require("../utils/errorHandle/resHandle");
const authorization = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user)
                throw new resHandle_1.AppError('Unauthorized', 401);
            if (!roles.includes(req.user.role)) {
                throw new resHandle_1.AppError('Forbidden - insufficient permissions', 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorization = authorization;
