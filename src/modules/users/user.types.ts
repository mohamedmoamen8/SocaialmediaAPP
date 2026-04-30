import { HydratedDocument } from "mongoose";

export enum UserRole {
  user = 0,
  admin = 1,
}

export enum Gender {
  male = 0,
  female = 1,
}

export enum ProviderTypes {
  system = 'system',
  google = 'google',
}

export interface IUser {
  
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  age?: number;
  gender?: Gender;
  role: UserRole;
  provider: ProviderTypes;
  isEmailConfirmed: boolean;
  profilePicture?: string;
  coverPictures: string[];
  tokenVersion: number;
  isTwoFactorEnabled: boolean;
  twoFactorOTP?: string | null;
  twoFactorOTPExpires?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordTokenExpires?: Date | null;
  lastOtpSentAt?: Date | null;
  otpResendCount: number;
  emailOtp?: string | null;
  emailOTPExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type HUser =HydratedDocument<IUser>;
export interface signupBodyDTO{
  name:string
  email:string

}

export interface IUserPayload {
  _id: string;
  tokenVersion: number;
  role: UserRole;
}

export interface ISignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age?: number;
  gender?: Gender;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IUpdatePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface IResetPasswordInput {
  email: string;
  token: string;
  newPassword: string;
}
export interface IGoogleAuthInput {
  firstName: string;
  lastName: string;
  email: string;
  isEmailConfirmed: boolean;
}