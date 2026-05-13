import path from 'path';
import { Types } from 'mongoose';
import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_S3_BUCKET,
  AWS_S3_PUBLIC_BASE_URL,
  AWS_S3_UPLOAD_PREFIX,
  AWS_SECRET_ACCESS_KEY,
} from '../../config';
import { UploadStatus, uploadModel } from '../../db/models/upload.models';
import { BadRequestError, NotFoundError } from '../../utils/errorHandle/resHandle';
import { createPresignedPutObjectUrl, getS3ObjectUrl } from '../../utils/s3Presign';
import { ICreateImageUploadInput, IVerifyUploadInput } from './uploads.types';

const sanitizeFileName = (fileName: string): string =>
  path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');

class UploadServices {
  private assertS3Config() {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_S3_BUCKET) {
      throw new BadRequestError('S3 upload configuration is missing');
    }
  }

  async createImageUpload({
    userId,
    fileName,
    contentType,
    size,
    purpose,
  }: ICreateImageUploadInput) {
    this.assertS3Config();

    const uploadId = new Types.ObjectId();
    const safeName = sanitizeFileName(fileName);
    const key = `${AWS_S3_UPLOAD_PREFIX}/${purpose}/${userId}/${uploadId.toString()}-${safeName}`;
    const url = getS3ObjectUrl({
      bucket: AWS_S3_BUCKET,
      region: AWS_REGION,
      key,
      ...(AWS_S3_PUBLIC_BASE_URL !== undefined && { publicBaseUrl: AWS_S3_PUBLIC_BASE_URL }),
    });

    const upload = await uploadModel.create({
      _id: uploadId,
      owner: new Types.ObjectId(userId),
      key,
      bucket: AWS_S3_BUCKET,
      region: AWS_REGION,
      url,
      contentType,
      size,
      purpose,
      status: UploadStatus.pending,
    });

    const uploadUrl = createPresignedPutObjectUrl({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: AWS_REGION,
      bucket: AWS_S3_BUCKET,
      key,
      contentType,
      expiresInSeconds: 300,
    });

    return {
      uploadId: upload._id,
      key,
      url,
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      expiresInSeconds: 300,
    };
  }

  async getUploadStatus({ uploadId, userId }: { uploadId: string; userId: string }) {
    const upload = await uploadModel.findOne({
      _id: uploadId,
      owner: new Types.ObjectId(userId),
    });

    if (!upload) throw new NotFoundError('Upload not found');

    return { upload };
  }

  async verifyUpload({ key, bucket, etag, size }: IVerifyUploadInput) {
    const upload = await uploadModel.findOne({ key, bucket });
    if (!upload) throw new NotFoundError('Upload not found');

    if (size !== undefined && size !== upload.size) {
      upload.status = UploadStatus.rejected;
      await upload.save();
      throw new BadRequestError('Uploaded file size does not match the requested upload');
    }

    upload.status = UploadStatus.verified;
    upload.verifiedAt = new Date();
    if (etag !== undefined) upload.etag = etag;
    await upload.save();

    return { upload };
  }
}

export default new UploadServices();
