import { chatModel, IChat } from '../../db/models/chat.model';
import { IMessage, messageModel } from '../../db/models/message.model';
import { userModel } from '../../db/models/user.models';
import {
  AccessChatDto,
  AddToGroupDto,
  CreateGroupChatDto,
  GetChatMessagesDto,
  GetMyChatsDto,
  RemoveFromGroupDto,
  RenameGroupDto,
  SendMessageDto,
} from './chats.dto';
import { AppError, BadRequestError, NotFoundError } from '../../utils/errorHandle/resHandle';
import { io } from '../../socket';
import { Query, Types } from 'mongoose';

class ChatServices {
  private populateChat = <T>(query: Query<T, IChat>) => {
    return query
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'firstName lastName profilePicture email',
        },
      });
  };

  async accessChat(dto: AccessChatDto) {
    if (dto.currentUserId === dto.otherUserId) {
      throw new BadRequestError('You cannot create a chat with yourself.');
    }

    const existingChat = await chatModel.findOne({
      isGroupChat: false,
      participants: { $all: [dto.currentUserId, dto.otherUserId] },
    });

    if (existingChat) {
      const populatedChat = await this.populateChat(chatModel.findById(existingChat._id));
      return { chat: populatedChat };
    }

    const newChatData = {
      chatName: 'sender',
      isGroupChat: false,
      participants: [dto.currentUserId, dto.otherUserId],
    };

    const createdChat = await chatModel.create(newChatData);
    const fullChat = await this.populateChat(chatModel.findById(createdChat._id));

    return { chat: fullChat };
  }

  async getMyChats(dto: GetMyChatsDto) {
    const chats = await this.populateChat(
      chatModel.find({ participants: dto.userId }).sort({ updatedAt: -1 })
    );
    return { chats };
  }

  async createGroupChat(dto: CreateGroupChatDto) {
    const allParticipants = [...new Set([dto.adminId, ...dto.participants])];

    if (allParticipants.length < 3) {
      throw new BadRequestError('Group chats require at least 3 participants.');
    }

    const newChat = await chatModel.create({
      chatName: dto.name,
      isGroupChat: true,
      participants: allParticipants,
      groupAdmin: new Types.ObjectId(dto.adminId),
    });

    const fullChat = await this.populateChat(chatModel.findById(newChat._id));
    return { chat: fullChat };
  }

  async renameGroup(dto: RenameGroupDto) {
    const chat = await chatModel.findById(dto.chatId);
    if (!chat) throw new NotFoundError('Chat not found');
    if (chat.groupAdmin?.toString() !== dto.userId) {
      throw new AppError('Only the group admin can rename the group', 403);
    }

    chat.chatName = dto.chatName;
    await chat.save();

    const fullChat = await this.populateChat(chatModel.findById(dto.chatId));
    return { chat: fullChat };
  }

  async addToGroup(dto: AddToGroupDto) {
    const chat = await chatModel.findById(dto.chatId);
    if (!chat) throw new NotFoundError('Chat not found');
    if (chat.groupAdmin?.toString() !== dto.adminId) {
      throw new AppError('Only the group admin can add participants', 403);
    }

    const updatedChat = await chatModel.findByIdAndUpdate(
      dto.chatId,
      { $addToSet: { participants: dto.userIdToAdd } },
      { new: true }
    );

    if (!updatedChat) {
      throw new NotFoundError('Chat not found after update.');
    }

    const fullChat = await this.populateChat(chatModel.findById(updatedChat._id));

    // Notify existing members of the change
    io.to(dto.chatId).emit('chat:group:updated', fullChat);

    return { chat: fullChat };
  }

  async removeFromGroup(dto: RemoveFromGroupDto) {
    const chat = await chatModel.findById(dto.chatId);
    if (!chat) throw new NotFoundError('Chat not found');
    if (chat.groupAdmin?.toString() !== dto.adminId) {
      throw new AppError('Only the group admin can remove participants', 403);
    }

    const updatedChat = await chatModel.findByIdAndUpdate(
      dto.chatId,
      { $pull: { participants: dto.userIdToRemove } },
      { new: true }
    );

    if (!updatedChat) {
      throw new NotFoundError('Chat not found after update.');
    }

    const fullChat = await this.populateChat(chatModel.findById(updatedChat._id));

    // Notify the removed user in real-time that they've been removed
    io.to(dto.userIdToRemove).emit('chat:group:removed', { chatId: dto.chatId });
    // Notify existing members of the change
    io.to(dto.chatId).emit('chat:group:updated', fullChat);

    return { chat: fullChat };
  }

  async leaveGroup({ userId, chatId }: { userId: string; chatId: string }) {
    const chat = await chatModel.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');
    if (!chat.isGroupChat) throw new BadRequestError('This is not a group chat');
    if (!chat.participants.some(p => p.toString() === userId)) {
      throw new AppError('You are not a participant of this chat', 403);
    }
    if (chat.groupAdmin?.toString() === userId) {
      throw new BadRequestError('Admin cannot leave. Transfer admin rights first or delete the group.');
    }

    await chatModel.findByIdAndUpdate(chatId, { $pull: { participants: userId } });
    io.to(userId).emit('chat:group:removed', { chatId });
    io.to(chatId).emit('chat:group:updated', { chatId, leftUserId: userId });

    return { message: 'Left group successfully' };
  }

  async sendMessage(dto: SendMessageDto) {
    const chat = await chatModel.findById(dto.chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    if (!chat.participants.some(p => p.toString() === dto.senderId)) {
        throw new AppError('You are not a participant of this chat', 403);
    }

    const newMessage = await messageModel.create({
      sender: new Types.ObjectId(dto.senderId),
      content: dto.content,
      chat: new Types.ObjectId(dto.chatId),
    });

    chat.latestMessage = newMessage._id as Types.ObjectId | IMessage;
    await chat.save();

    const populatedMessage = await newMessage.populate('sender', 'firstName lastName profilePicture');
    const fullyPopulatedMessage = await populatedMessage.populate('chat');
    const finalMessage = await userModel.populate(fullyPopulatedMessage, {
        path: 'chat.participants',
        select: 'firstName lastName profilePicture email',
    });

    // Emit the new message to all clients in the chat room
    io.to(dto.chatId).emit('chat:message:new', finalMessage);

    return { message: finalMessage };
  }

  async getChatMessages(dto: GetChatMessagesDto & { page?: number; limit?: number }) {    const chat = await chatModel.findById(dto.chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    if (!chat.participants.some(p => p.toString() === dto.userId)) {
        throw new AppError('You are not a participant of this chat', 403);
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 30;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      messageModel.find({ chat: dto.chatId })
        .populate('sender', 'firstName lastName profilePicture email')
        .populate('chat')
        .populate('readBy', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      messageModel.countDocuments({ chat: dto.chatId }),
    ]);

    return { messages, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}

export default new ChatServices();