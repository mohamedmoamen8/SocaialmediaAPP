"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const dbConnection = async () => {
    await mongoose_1.default.connect(config_1.MONGO_URI);
    console.log('MongoDB connected ✅');
};
exports.dbConnection = dbConnection;
