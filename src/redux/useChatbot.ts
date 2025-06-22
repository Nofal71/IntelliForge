import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import {
  createChat,
  createMessage,
  createBotMessage,
  selectChat,
  updateChat,
  deleteChat,
  updateBotMessage
} from './slices/chatbotSlice';
import type { Chat, Message } from '../types';

export const useChatbot = () => {
  const dispatch = useDispatch();
  const chats = useSelector((state: RootState) => state.chatbot.chats || []); // Default to []
  const activeChatId = useSelector((state: RootState) => state.chatbot.activeChatId || null);
  const activeChat = chats.find(chat => chat.id === activeChatId) || null;

  return {
    chats,
    activeChat,
    activeChatId,
    createChat: (payload: { title: string; model: string; systemPrompt: string; messages: Message[], id: any }) => {
      dispatch(createChat(payload));
      return payload;
    },
    deleteChat: (chatId: any) => {
      dispatch(deleteChat(chatId));
    },
    createMessage: (chatId: string, content: string) =>
      dispatch(createMessage({ chatId, content })),
    createBotMessage: (chatId: string, content: string, messageId: string) =>
      dispatch(createBotMessage({ chatId, content, messageId })),
    updateBotMessage: (chatId: string, content: string, messageId: string) =>
      dispatch(updateBotMessage({ chatId, content, messageId })),
    selectChat: (chatId: string) => dispatch(selectChat(chatId)),
    updateChat: (chat: Chat) => dispatch(updateChat(chat)),
  };
};