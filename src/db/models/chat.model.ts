import { Model, Schema, Types, model, Document } from 'mongoose';
import { IUser } from './user.models';
import { IMessage } from './message.model';

export interface IChat extends Document {
  chatName: string;
  isGroupChat: boolean;
  participants: Types.ObjectId[] | IUser[];
  latestMessage?: Types.ObjectId | IMessage;
  groupAdmin?: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    latestMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const chatModel: Model<IChat> = model<IChat>('Chat', chatSchema);