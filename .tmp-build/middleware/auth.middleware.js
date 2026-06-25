"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const authToken_1 = require("../security/authToken");
const authentication = async (req, res, next) => {
    try {
        req.user = await (0, authToken_1.authenticateAuthorizationHeader)(req.headers.authorization);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authentication = authentication;
