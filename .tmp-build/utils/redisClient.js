"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_1 = require("../config");
const redisClient = (0, redis_1.createClient)({
    url: config_1.REDIS_URL || 'redis://localhost:6379',
});
let errorLogged = false;
redisClient.on('error', (err) => {
    if (!errorLogged) {
        console.error('Redis error:', err.message);
        errorLogged = true;
    }
});
redisClient.on('connect', () => {
    errorLogged = false;
    console.log('Redis connected ✅');
});
exports.default = redisClient;
