import dotenv from 'dotenv';

dotenv.config({ path: './config/.env' });

export const PORT: number = process.env.PORT as unknown as number;
export const MONGO_URI: string = process.env.MONGO_URI as string;
export const TOKEN_SECRET: string = process.env.TOKEN_SECRET as string;
export const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET as string;
export const REDIS_URL: string = process.env.REDIS_URL as string;
export const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET as string;
export const EMAIL_USER: string = process.env.EMAIL_USER as string;
export const EMAIL_PASS: string = process.env.EMAIL_PASS as string;
export const FRONTEND_URL: string = process.env.FRONTEND_URL as string;
export const EncryptionKey: string = process.env.EncryptionKey as string;
export const IV_LENGTH: number = Number(process.env.IV_LENGTH) || 16;
export const Salt: number = Number(process.env.Salt) || 10;
export const AWS_REGION: string = process.env.AWS_REGION as string;
export const AWS_ACCESS_KEY_ID: string = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY: string = process.env.AWS_SECRET_ACCESS_KEY as string;
export const AWS_S3_BUCKET: string = process.env.AWS_S3_BUCKET as string;
export const AWS_S3_UPLOAD_PREFIX: string = process.env.AWS_S3_UPLOAD_PREFIX || 'uploads';
export const AWS_S3_PUBLIC_BASE_URL: string | undefined = process.env.AWS_S3_PUBLIC_BASE_URL;
export const AWS_UPLOAD_VERIFY_SECRET: string = process.env.AWS_UPLOAD_VERIFY_SECRET as string;
