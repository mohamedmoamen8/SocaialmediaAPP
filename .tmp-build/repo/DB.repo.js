"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepo = exports.DBRepo = void 0;
const user_models_1 = require("../db/models/user.models");
class DBRepo {
    model;
    constructor(model) {
        this.model = model;
    }
    async findById(id, projection, options) {
        const doc = await this.model.findById(id, projection).exec();
        return doc;
    }
    async find(filter, projection, options) {
        const docs = await this.model.find(filter, projection, options).exec();
        return docs;
    }
    async findOne(filter, projection, options) {
        const doc = await this.model.findOne(filter, projection, options).exec();
        return doc;
    }
    async create(data) {
        if (Array.isArray(data)) {
            return await this.model.create(data);
        }
        return await this.model.create(data);
    }
    async findall(projection, options) {
        const docs = await this.model.find({}, projection, options).exec();
        return docs;
    }
    async findByEmail(email, projection, options) {
        const doc = await this.model.findOne({ email }, projection, options).exec();
        return doc;
    }
}
exports.DBRepo = DBRepo;
class UserRepo extends DBRepo {
    constructor() {
        super(user_models_1.userModel);
    }
}
exports.UserRepo = UserRepo;
