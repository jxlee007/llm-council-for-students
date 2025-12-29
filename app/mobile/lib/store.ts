/**
 * UI Store for transient state management.
 * Handles only UI state and local settings.
 * All data persistence (conversations, messages) is handled by Convex.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { AggregateRanking } from './types';

const API_KEY_SECURE_KEY = 'openrouter_api_key';
const COUNCIL_MODELS_KEY = '@llm_council_models';
const CHAIRMAN_MODEL_KEY = '@llm_council_chairman';

// SecureStore helper that falls back to AsyncStorage on web
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(`@secure_${key}`, value);
    } else {
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

interface UIState {
    // Active message state (transient)
    isProcessing: boolean;
    currentStage: 0 | 1 | 2 | 3;
    aggregateRankings: AggregateRanking[];

    // Settings (persisted locally)
    hasApiKey: boolean;
    councilModels: string[];
    chairmanModel: string | null;

    // Actions
    loadSettings: () => Promise<void>;
    setIsProcessing: (value: boolean) => void;
    setCurrentStage: (stage: 0 | 1 | 2 | 3) => void;
    setAggregateRankings: (rankings: AggregateRanking[]) => void;
    setCouncilModels: (models: string[]) => void;
    setChairmanModel: (model: string | null) => void;

    // API Key management
    saveApiKey: (key: string) => Promise<void>;
    loadApiKey: () => Promise<string | null>;
    clearApiKey: () => Promise<void>;
    checkApiKeyExists: () => Promise<void>;
}

export const useUIStore = create<UIState>((set, get) => ({

    // Initial state
    isProcessing: false,
    currentStage: 0,
    aggregateRankings: [],
    hasApiKey: false,
    councilModels: [],
    chairmanModel: null,

    // Load local settings
    loadSettings: async () => {
        try {
            // Load council config
            const councilData = await AsyncStorage.getItem(COUNCIL_MODELS_KEY);
            if (councilData) {
                set({ councilModels: JSON.parse(councilData) });
            }

            const chairmanData = await AsyncStorage.getItem(CHAIRMAN_MODEL_KEY);
            if (chairmanData) {
                set({ chairmanModel: chairmanData });
            }

            // Check API key
            const key = await secureStorage.getItem(API_KEY_SECURE_KEY);
            set({ hasApiKey: !!key });

        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    },

    setIsProcessing: (value) => set({ isProcessing: value }),

    setCurrentStage: (stage) => set({ currentStage: stage }),

    setAggregateRankings: (rankings) => set({ aggregateRankings: rankings }),

    setCouncilModels: (models) => {
        set({ councilModels: models });
        AsyncStorage.setItem(COUNCIL_MODELS_KEY, JSON.stringify(models));
    },

    setChairmanModel: (model) => {
        set({ chairmanModel: model });
        if (model) {
            AsyncStorage.setItem(CHAIRMAN_MODEL_KEY, model);
        } else {
            AsyncStorage.removeItem(CHAIRMAN_MODEL_KEY);
        }
    },

    // API Key management
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

