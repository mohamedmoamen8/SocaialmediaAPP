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