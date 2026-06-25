"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessRes = void 0;
const SuccessRes = ({ res, message = "Done", data = {}, status = 200 }) => {
    res.status(status).json({ message, data });
};
exports.SuccessRes = SuccessRes;
