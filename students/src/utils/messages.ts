import { Message } from '@polito/student-api-client';

export const filterUnread = (messages: Message[]) =>
  messages.filter(m => !m.isRead);
