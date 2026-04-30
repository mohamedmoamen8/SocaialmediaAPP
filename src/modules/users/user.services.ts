import bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { IUser, IUpdatePasswordInput } from './user.types';
import { NotFoundError, BadRequestError } from '../../utils/errorHandle/resHandle';
import { userModel } from '../../db/models/user.models';
import { UserRepo } from '../../repo/DB.repo';



class UserServices {
  private readonly model: Model<IUser>;
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
 async getAllUsers(): Promise<IUser[]> {
  return await this.repo.findall();
 }
 async getUserByEmail(email: string): Promise<IUser | null> {
  return await this.repo.findByEmail(email);
 }

}




export default new UserServices();