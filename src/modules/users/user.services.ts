import bcrypt from 'bcrypt';
import { IUpdatePasswordInput, IUpdateUserInput } from './user.types';
import { NotFoundError, BadRequestError } from '../../utils/errorHandle/resHandle';
import { userModel, IUser as IUserDocument, IUserModel } from '../../db/models/user.models';
import { UserRepo } from '../../repo/DB.repo';



class UserServices {
  private readonly model: IUserModel;
  private readonly repo = new UserRepo();
  constructor() {
    this.model = userModel;
  }

  async updatePassword({
    userId,
    currentPassword,
    newPassword,
  }: IUpdatePasswordInput) {
    const user = await this.model
      .findById(userId)
      .select('password provider');

    if (!user) throw new NotFoundError('User not found');
    if (user.provider !== 'system') {
      throw new BadRequestError('Google accounts cannot update password');
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password as string
    );
    if (!isMatch) throw new BadRequestError('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return { message: 'Password updated successfully' };
  }
  async getAllUsers(): Promise<IUserDocument[]> {
    return await this.repo.findall('-password -emailOtp -twoFactorOTP -resetPasswordToken');
  }
  async getUserByEmail(email: string): Promise<IUserDocument | null> {
    return await this.repo.findByEmail(email, '-password -emailOtp -twoFactorOTP -resetPasswordToken');
  }

 async getUserById(userId: string) {
  const user = await this.model
    .findById(userId)
    .select('-password -emailOtp -twoFactorOTP -resetPasswordToken');
  if (!user) throw new NotFoundError('User not found');
  return { user };
 }

 async updateUser({
  userId,
  firstName,
  lastName,
  age,
  gender,
  profilePicture,
  coverPictures,
 }: IUpdateUserInput) {
  const user = await this.model.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (age !== undefined) user.age = age;
  if (gender !== undefined) user.gender = gender;
  if (profilePicture !== undefined) user.profilePicture = profilePicture ?? undefined;
  if (coverPictures !== undefined) user.coverPictures = coverPictures;

  await user.save();

  return { user };
 }

 async softDeleteUser({ userId }: { userId: string }) {
  const user = await userModel.softDeleteById(userId);
  if (!user) throw new NotFoundError('User not found');
  return { message: 'User deleted successfully' };
 }

 async hardDeleteUser({ userId }: { userId: string }) {
  const user = await userModel.hardDeleteById(userId);
  if (!user) throw new NotFoundError('User not found');
  return { message: 'User permanently deleted successfully' };
 }

 async followUser({ currentUserId, targetUserId }: { currentUserId: string; targetUserId: string }) {
  if (currentUserId === targetUserId) throw new BadRequestError('You cannot follow yourself');

  const [current, target] = await Promise.all([
    this.model.findById(currentUserId),
    this.model.findById(targetUserId),
  ]);

  if (!current || !target) throw new NotFoundError('User not found');

  const alreadyFollowing = current.following.some(id => id.toString() === targetUserId);
  if (alreadyFollowing) return { message: 'Already following' };

  await Promise.all([
    this.model.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } }),
    this.model.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } }),
  ]);

  return { message: 'Followed successfully' };
 }

 async unfollowUser({ currentUserId, targetUserId }: { currentUserId: string; targetUserId: string }) {
  await Promise.all([
    this.model.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }),
    this.model.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } }),
  ]);
  return { message: 'Unfollowed successfully' };
 }

}




export default new UserServices();
