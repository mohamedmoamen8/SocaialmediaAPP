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
exports.storyModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const storySchema = new mongoose_1.Schema({
    id_owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, maxlength: 200 },
    viewers: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'User', default: [] },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        index: { expires: 0 },
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
storySchema.virtual('viewersCount').get(function () {
    return this.viewers.length;
});
storySchema.methods.softDelete = async function softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return await this.save();
};
storySchema.statics.softDeleteById = async function softDeleteById(storyId) {
    const story = await this.findById(storyId);
    if (!story)
        return null;
    return await story.softDelete();
};
storySchema.statics.hardDeleteById = async function hardDeleteById(storyId) {
    return await this.findOneAndDelete({ _id: storyId }).setOptions({ withDeleted: true });
};
storySchema.pre('save', function preSave() {
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});
storySchema.post('save', function postSave(doc) {
    console.log(`Story saved: ${doc._id.toString()}`);
});
storySchema.pre('insertMany', function preInsertMany(next, docs) {
    docs.forEach((doc) => {
        if (!doc.expiresAt)
            doc.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (doc.isDeleted && !doc.deletedAt)
            doc.deletedAt = new Date();
    });
    next();
});
storySchema.pre(/^find/, function preFindActive() {
    if (!this.getOptions().withDeleted) {
        this.where({ isDeleted: false, expiresAt: { $gt: new Date() } });
    }
});
exports.storyModel = mongoose_1.default.models['Story'] ||
    mongoose_1.default.model('Story', storySchema);
