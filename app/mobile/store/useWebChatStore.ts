import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

export interface WebMessage {
  id: string;
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  
  // Fields for Convex schema compatibility and council debate streaming
  stage1?: Array<{ model: string; original_model?: string; response: string }>;
  stage2?: Array<{ model: string; original_model?: string; ranking: string; parsed_ranking: string[] }>;
  stage3?: { model: string; original_model?: string; response: string };
  processing?: boolean;
  currentStage?: string; // "vision" | "stage1" | "stage2" | "stage3"
  error?: string;
  
  // Media / Attachments
  imageBase64?: string;
  imageUrl?: string;
  visionContext?: string;
  type?: 'text' | 'image' | 'image_text';
  attachmentIds?: string[];
  attachments?: any[];
}

export interface WebChat {
  id: string;
  title: string;
  updatedAt: number;
  messages: WebMessage[];
  modelConfig?: string[];
  isStarred?: boolean;
}

interface WebChatState {
  chats: Record<string, WebChat>; // Store as dictionary for fast O(1) lookups
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addChat: (chat: WebChat) => void;
  deleteChat: (id: string) => void;
  addMessage: (chatId: string, message: WebMessage) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<WebMessage>) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  toggleStarChat: (chatId: string) => void;
}

// Dummy storage for native platforms so Zustand persist doesn't crash
const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useWebChatStore = create<WebChatState>()(
  persist(
    (set, get) => ({
      chats: {},
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      addChat: (chat) => set((state) => ({
        chats: { ...state.chats, [chat.id]: chat }
      })),

      deleteChat: (id) => set((state) => {
        const newChats = { ...state.chats };
        delete newChats[id];
        return { chats: newChats };
      }),

      addMessage: (chatId, message) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return state;
        
        const enrichedMessage = { ...message, _id: message._id || message.id };
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              updatedAt: Date.now(),
              messages: [...chat.messages, enrichedMessage]
            }
          }
        };
      }),

      updateMessage: (chatId, messageId, updates) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return state;
        
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              messages: chat.messages.map((m) =>
                m.id === messageId ? { ...m, ...updates } : m
              ),
            }
          }
        };
      }),

      updateChatTitle: (chatId, title) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return state;
        
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              title,
              updatedAt: Date.now()
            }
          }
        };
      }),

      toggleStarChat: (chatId) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return state;

        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              isStarred: !chat.isStarred,
              updatedAt: Date.now()
            }
          }
        };
      }),

      deleteMessage: (chatId, messageId) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return state;
        
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              updatedAt: Date.now(),
              messages: chat.messages.filter((m) => m.id !== messageId)
            }
          }
        };
      })
    }),
    {
      name: 'council-web-storage',
      storage: createJSONStorage(() => Platform.OS === 'web' ? localStorage : dummyStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
