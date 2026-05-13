import { UploadPurpose } from '../../db/models/upload.models';

export interface ICreateImageUploadInput {
  userId: string;
  fileName: string;
  contentType: string;
  size: number;
  purpose: UploadPurpose;
}

export interface IVerifyUploadInput {
  key: string;
  bucket: string;
  etag?: string;
  size?: number;
}
