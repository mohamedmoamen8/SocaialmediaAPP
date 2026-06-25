"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.postModel = exports.allowedReactionEmojis = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.allowedReactionEmojis = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
const commentSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
const reactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, enum: exports.allowedReactionEmojis, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });
const postSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true },
    id_owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: [commentSchema], default: [] },
    likes: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'User', default: [] },
    shares: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'User', default: [] },
    reactions: { type: [reactionSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
postSchema.virtual('likesCount').get(function () {
    return this.likes.length;
});
postSchema.virtual('commentsCount').get(function () {
    return this.comment.filter((comment) => !comment.isDeleted).length;
});
postSchema.virtual('sharesCount').get(function () {
    return this.shares.length;
});
postSchema.virtual('reactionsCount').get(function () {
    return this.reactions.length;
});
postSchema.methods.softDelete = async function softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.comment.forEach((comment) => {
        comment.isDeleted = true;
        comment.deletedAt = new Date();
    });
    return await this.save();
};
postSchema.statics.softDeleteById = async function softDeleteById(postId) {
    const post = await this.findById(postId);
    if (!post)
        return null;
    return await post.softDelete();
};
postSchema.statics.hardDeleteById = async function hardDeleteById(postId) {
    return await this.findOneAndDelete({ _id: postId }).setOptions({ withDeleted: true });
};
postSchema.pre('save', function preSave() {
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});
postSchema.post('save', function postSave(doc) {
    console.log(`Post saved: ${doc._id.toString()}`);
});
postSchema.pre('insertMany', function preInsertMany(next, docs) {
    docs.forEach((doc) => {
        if (doc.isDeleted && !doc.deletedAt)
            doc.deletedAt = new Date();
    });
    next();
});
postSchema.pre(/^find/, function preFindNotDeleted() {
    if (!this.getOptions().withDeleted) {
        this.where({ isDeleted: false });
    }
});
postSchema.pre('aggregate', function preAggregateNotDeleted() {
    const options = this.options;
    if (!options.withDeleted) {
        this.pipeline().unshift({ $match: { isDeleted: false } });
    }
});
exports.postModel = mongoose_1.default.models['Post'] ||
    mongoose_1.default.model('Post', postSchema);
