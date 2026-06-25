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
exports.uploadModel = exports.UploadStatus = exports.UploadPurpose = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var UploadPurpose;
(function (UploadPurpose) {
    UploadPurpose["profilePicture"] = "profilePicture";
    UploadPurpose["coverPicture"] = "coverPicture";
    UploadPurpose["postImage"] = "postImage";
    UploadPurpose["storyImage"] = "storyImage";
})(UploadPurpose || (exports.UploadPurpose = UploadPurpose = {}));
var UploadStatus;
(function (UploadStatus) {
    UploadStatus["pending"] = "pending";
    UploadStatus["verified"] = "verified";
    UploadStatus["rejected"] = "rejected";
})(UploadStatus || (exports.UploadStatus = UploadStatus = {}));
const uploadSchema = new mongoose_1.Schema({
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true, unique: true, trim: true },
    bucket: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    contentType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 1 },
    purpose: {
        type: String,
        enum: Object.values(UploadPurpose),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(UploadStatus),
        default: UploadStatus.pending,
    },
    verifiedAt: { type: Date, default: null },
    etag: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
uploadSchema.methods.softDelete = async function softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return await this.save();
};
uploadSchema.statics.softDeleteById = async function softDeleteById(uploadId) {
    const upload = await this.findById(uploadId);
    if (!upload)
        return null;
    return await upload.softDelete();
};
uploadSchema.pre('save', function preSave() {
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});
uploadSchema.pre(/^find/, function preFindNotDeleted() {
    if (!this.getOptions().withDeleted) {
        this.where({ isDeleted: false });
    }
});
exports.uploadModel = mongoose_1.default.models['Upload'] ||
    mongoose_1.default.model('Upload', uploadSchema);
