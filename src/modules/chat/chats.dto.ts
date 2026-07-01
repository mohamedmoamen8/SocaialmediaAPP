export interface AccessChatDto {
  currentUserId: string;
  otherUserId: string;
}

export interface GetMyChatsDto {
  userId: string;
}

export interface CreateGroupChatDto {
  adminId: string;
  participants: string[];
  name: string;
}

export interface RenameGroupDto {
  chatId: string;
  chatName: string;
  userId: string;
}

export interface AddToGroupDto {
  chatId: string;
  userIdToAdd: string;
  adminId: string;
}

export interface RemoveFromGroupDto {
  chatId: string;
  userIdToRemove: string;
  adminId: string;
}

export interface SendMessageDto {
  senderId: string;
  chatId: string;
  content: string;
}

export interface GetChatMessagesDto {
  chatId: string;
  userId: string;
}