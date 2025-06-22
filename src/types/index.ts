export interface Message {
  id: string;
  chatId: string;
  content: string;
  type: 'user' | 'bot' | 'system' | 'custom';
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  model: string;
  systemPrompt: string;
  messages: Message[];
  knowledgeBaseIds: string[]
}

export interface UserData {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  apiKey?: any;
  defaultModel?: string;
  systemPrompts?: { [model: string]: { prompt: string; isDefault: boolean } };
}


export interface EditChatTitleDialogProps {
  open: boolean;
  chatId: string | null;
  onClose: () => void;
  chats: Chat[]
}


export interface RAGProject {
  ragProjectId: string;
  name: string;
  userId: string;
  createdAt: string;
  documentIds: string[];
}

export interface Document {
  documentId: string;
  ragProjectId: string;
  userId: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

export interface Chunk {
  chunkId: string;
  text: string;
  documentId: string;
  index: number; 
  embedding: number[];
}