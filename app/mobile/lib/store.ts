/**
 * Zustand store for app state management.
 * Handles conversations, settings, and local caching.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Conversation, ConversationMetadata, Message, AggregateRanking } from './types';

const CONVERSATIONS_KEY = '@llm_council_conversations';
const API_KEY_SECURE_KEY = 'openrouter_api_key';

// SecureStore helper that falls back to AsyncStorage on web
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use AsyncStorage on web (less secure, but works)
      await AsyncStorage.setItem(`@secure_${key}`, value);
    } else {
      // Use SecureStore on native
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(`@secure_${key}`);
    } else {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(`@secure_${key}`);
    } else {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  },
};

interface AppState {
    // Conversations
    conversationsList: ConversationMetadata[];
    currentConversation: Conversation | null;
    isLoadingConversations: boolean;

    // Active message state
    isProcessing: boolean;
    currentStage: 0 | 1 | 2 | 3;
    aggregateRankings: AggregateRanking[];

    // Settings
    hasApiKey: boolean;

    // Actions
    loadConversationsFromStorage: () => Promise<void>;
    saveConversationToStorage: (conversation: Conversation) => Promise<void>;
    setConversationsList: (list: ConversationMetadata[]) => void;
    setCurrentConversation: (conversation: Conversation | null) => void;
    addMessageToCurrentConversation: (message: Message) => void;
    updateConversationTitle: (id: string, title: string) => void;
    setIsProcessing: (value: boolean) => void;
    setCurrentStage: (stage: 0 | 1 | 2 | 3) => void;
    setAggregateRankings: (rankings: AggregateRanking[]) => void;

    // API Key management
    saveApiKey: (key: string) => Promise<void>;
    loadApiKey: () => Promise<string | null>;
    clearApiKey: () => Promise<void>;
    checkApiKeyExists: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    // Initial state
    conversationsList: [],
    currentConversation: null,
    isLoadingConversations: false,
    isProcessing: false,
    currentStage: 0,
    aggregateRankings: [],
    hasApiKey: false,

    // Load conversations from AsyncStorage
    loadConversationsFromStorage: async () => {
        set({ isLoadingConversations: true });
        try {
            const data = await AsyncStorage.getItem(CONVERSATIONS_KEY);
            if (data) {
                const conversations: ConversationMetadata[] = JSON.parse(data);
                set({ conversationsList: conversations });
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            set({ isLoadingConversations: false });
        }
    },

    // Save a conversation to AsyncStorage
    saveConversationToStorage: async (conversation: Conversation) => {
        try {
            // Save full conversation
            await AsyncStorage.setItem(
                `${CONVERSATIONS_KEY}_${conversation.id}`,
                JSON.stringify(conversation)
            );

            // Update conversations list
            const { conversationsList } = get();
            const metadata: ConversationMetadata = {
                id: conversation.id,
                created_at: conversation.created_at,
                title: conversation.title,
                message_count: conversation.messages.length,
            };

            const existingIndex = conversationsList.findIndex(c => c.id === conversation.id);
            let newList: ConversationMetadata[];

            if (existingIndex >= 0) {
                newList = [...conversationsList];
                newList[existingIndex] = metadata;
            } else {
                newList = [metadata, ...conversationsList];
            }

            set({ conversationsList: newList });
            await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(newList));
        } catch (error) {
            console.error('Failed to save conversation:', error);
        }
    },

    setConversationsList: (list) => set({ conversationsList: list }),

    setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

    addMessageToCurrentConversation: (message) => {
        const { currentConversation } = get();
        if (currentConversation) {
            const updated = {
                ...currentConversation,
                messages: [...currentConversation.messages, message],
            };
            set({ currentConversation: updated });
            get().saveConversationToStorage(updated);
        }
    },

    updateConversationTitle: (id, title) => {
        const { conversationsList, currentConversation } = get();

        // Update in list
        const newList = conversationsList.map(c =>
            c.id === id ? { ...c, title } : c
        );
        set({ conversationsList: newList });

        // Update current if it matches
        if (currentConversation?.id === id) {
            set({ currentConversation: { ...currentConversation, title } });
        }

        // Persist to storage
        AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(newList));
    },

    setIsProcessing: (value) => set({ isProcessing: value }),

    setCurrentStage: (stage) => set({ currentStage: stage }),

    setAggregateRankings: (rankings) => set({ aggregateRankings: rankings }),

    // API Key management using SecureStore (or AsyncStorage on web)
    saveApiKey: async (key: string) => {
        await secureStorage.setItem(API_KEY_SECURE_KEY, key);
        set({ hasApiKey: true });
    },

    loadApiKey: async () => {
        return await secureStorage.getItem(API_KEY_SECURE_KEY);
    },

    clearApiKey: async () => {
        await secureStorage.deleteItem(API_KEY_SECURE_KEY);
        set({ hasApiKey: false });
    },

    checkApiKeyExists: async () => {
        const key = await secureStorage.getItem(API_KEY_SECURE_KEY);
        set({ hasApiKey: !!key });
    },
}));

/**
 * Load a specific conversation from AsyncStorage.
 */
export async function loadConversationFromStorage(id: string): Promise<Conversation | null> {
    try {
        const data = await AsyncStorage.getItem(`${CONVERSATIONS_KEY}_${id}`);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to load conversation:', error);
    }
    return null;
}
