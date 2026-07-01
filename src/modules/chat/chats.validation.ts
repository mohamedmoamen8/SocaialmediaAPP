import { z } from 'zod';
import { schemaType } from '../auth/auth.validation';

export const accessChatSchema: schemaType = {
  body: z.object({
    userId: z.string().nonempty('Target user ID is required'),
  }),
};

export const createGroupChatSchema: schemaType = {
  body: z.object({
    participants: z.array(z.string()).min(2, 'A group chat needs at least 2 other participants'),
    name: z.string().min(3, 'Group name must be at least 3 characters long'),
  }),
};

export const groupActionSchema: schemaType = {
  params: z.object({
    chatId: z.string(),
  }),
  body: z.object({
    userId: z.string(),
  }),
};

export const renameGroupSchema: schemaType = {
  params: z.object({
    chatId: z.string(),
  }),
  body: z.object({
    chatName: z.string().min(3),
  }),
};

export const sendMessageSchema: schemaType = {
  body: z.object({
    chatId: z.string(),
    content: z.string().nonempty(),
  }),
};