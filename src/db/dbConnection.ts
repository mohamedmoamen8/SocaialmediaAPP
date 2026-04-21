import mongoose from 'mongoose';
import { MONGO_URI } from '../config';

export const dbConnection = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected ✅');
};