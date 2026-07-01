import { Model, Schema, Types, model, Document } from 'mongoose';
import { IUser } from './user.models';
import { IChat } from './chat.model';

export interface IMessage extends Document {
  sender: Types.ObjectId | IUser;
  content: string;
  chat: Types.ObjectId | IChat;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const messageModel: Model<IMessage> = model<IMessage>('Message', messageSchema);