export interface UpdateProfileDto {
  userId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  userId: string;
  oldPassword?: string;
  newPassword?: string;
}