import { createBotMessage, createChat, createCustomMessage, createMessage, createSystemResponse, selectChat } from "../slices/chatbotSlice";

export const chatbotReducers = {
  createChat,
  createMessage,
  createBotMessage,
  createSystemResponse,
  createCustomMessage,
  selectChat,
};