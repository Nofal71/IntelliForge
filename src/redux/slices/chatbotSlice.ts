import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import type { Chat, Message } from '../../types';

interface ChatbotState {
  chats: Chat[];
  activeChatId: string | null;
}

const initialState: ChatbotState = {
  chats: [],
  activeChatId: null,
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    createChat: (
      state,
      action: PayloadAction<{ title?: string; model?: string; systemPrompt?: string, messages?: Message[], id: any }>
    ) => {
      const chatId = action.payload.id
      const newChat: Chat = {
        id: chatId,
        title: action.payload.title || `Chat ${state.chats.length + 1}`,
        messages: action.payload.messages || [],
        model: action.payload.model || 'default',
        systemPrompt: action.payload.systemPrompt || '',
      };
      if (!state.chats.some(c => c.id === chatId)) {
        state.chats.push(newChat);
        state.activeChatId = chatId;
      }
    },
    createMessage: (
      state,
      action: PayloadAction<{ chatId: string; content: string }>
    ) => {
      const { chatId, content } = action.payload;
      const message: Message = {
        id: nanoid(),
        chatId,
        content,
        type: 'user',
        timestamp: new Date().toISOString(),
      };
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) chat.messages.push(message);
    },
    createBotMessage: (
      state,
      action: PayloadAction<{ chatId: string; content: string, messageId: string }>
    ) => {
      const { chatId, content, messageId } = action.payload;
      const message: Message = {
        id: messageId,
        chatId,
        content,
        type: 'bot',
        timestamp: new Date().toISOString(),
      };
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) chat.messages.push(message);
    },
    updateBotMessage: (
      state,
      action: PayloadAction<{ chatId: string; content: string; messageId: string }>
    ) => {
      const { chatId, content, messageId } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        const existingMessage = chat.messages.find(m => m.id === messageId && m.type === 'bot');
        if (existingMessage) {
          existingMessage.content = content;
          existingMessage.timestamp = new Date().toISOString();
        } else {
          const message: Message = {
            id: messageId,
            chatId,
            content,
            type: 'bot',
            timestamp: new Date().toISOString(),
          };
          chat.messages.push(message); // Create new message if not found
        }
      }
    },
    createSystemResponse: (
      state,
      action: PayloadAction<{ chatId: string; content: string }>
    ) => {
      const { chatId, content } = action.payload;
      const message: Message = {
        id: nanoid(),
        chatId,
        content,
        type: 'system',
        timestamp: new Date().toISOString(),
      };
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) chat.messages.push(message);
    },
    createCustomMessage: (
      state,
      action: PayloadAction<{ chatId: string; content: string; component?: string }>
    ) => {
      const { chatId, content, component } = action.payload;
      const message: Message = {
        id: nanoid(),
        chatId,
        content: component || content,
        type: 'custom',
        timestamp: new Date().toISOString(),
      };
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) chat.messages.push(message);
    },
    selectChat: (state, action: PayloadAction<string>) => {
      state.activeChatId = action.payload;
    },
    deleteChat: (state, action: PayloadAction<any>) => {
      const chatId = action.payload;
      state.chats = state.chats.filter(c => c.id !== chatId);
      if (state.activeChatId === chatId) {
        state.activeChatId = null;
      }
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      const index = state.chats.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.chats[index] = { ...action.payload, messages: action.payload.messages || [] };
      } else {
        state.chats.push({ ...action.payload, messages: action.payload.messages || [] });
      }
    },
  },
});

export const {
  createChat,
  createMessage,
  createBotMessage,
  createSystemResponse,
  createCustomMessage,
  selectChat,
  updateChat,
  deleteChat,
  updateBotMessage
} = chatbotSlice.actions;
export default chatbotSlice.reducer;