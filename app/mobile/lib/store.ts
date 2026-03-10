/**
 * UI Store for transient state management.
 * Handles only UI state and local settings.
 * All data persistence (conversations, messages) is handled by Convex.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { PRESETS } from './presets';
import { ExtractedFile, ExtractedImage } from './files';

const API_KEY_SECURE_KEY = 'openrouter_api_key';
const COUNCIL_MODELS_KEY = '@llm_council_models';
const CHAIRMAN_MODEL_KEY = '@llm_council_chairman';
const ACTIVE_PRESET_KEY = '@llm_council_active_preset';
const CUSTOM_PROMPTS_KEY = '@llm_council_custom_prompts';

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
  // Settings (persisted locally)
  hasApiKey: boolean;
  councilModels: string[];
  chairmanModel: string | null;
  activePresetId: string | null;
  customSystemPrompts: Record<string, string>;

  // Pending message for navigation
  pendingMessage: {
    content: string;
    attachments?: ExtractedFile[];
    images?: ExtractedImage[];
  } | null;

  // Available models (cached)
  availableModels: any[];
  modelsLastFetched: number;

  // Actions
  loadSettings: () => Promise<void>;
  fetchModelsIfNeeded: () => Promise<any[]>;
  setCouncilModels: (models: string[], presetId?: string) => void;
  setChairmanModel: (model: string | null, presetId?: string) => void;
  setActivePresetId: (id: string | null) => void;
  updateCustomSystemPrompt: (presetId: string, prompt: string) => void;
  setPendingMessage: (message: { content: string; attachments?: ExtractedFile[]; images?: ExtractedImage[] } | null) => void;

  // API Key management
  saveApiKey: (key: string) => Promise<void>;
  loadApiKey: () => Promise<string | null>;
  clearApiKey: () => Promise<void>;
  checkApiKeyExists: () => Promise<void>;
}

// findMatchingPreset removed since presets are now dynamic

export const useUIStore = create<UIState>((set, get) => ({

  // Initial state
  hasApiKey: false,
  councilModels: [],
  chairmanModel: null,
  activePresetId: null,
  customSystemPrompts: {},
  pendingMessage: null,
  availableModels: [],
  modelsLastFetched: 0,

  setPendingMessage: (message) => set({ pendingMessage: message }),

  // Fetch models with 60s cache
  fetchModelsIfNeeded: async () => {
    const { availableModels, modelsLastFetched } = get();
    const now = Date.now();
    
    // Check if cache is still valid (60s)
    if (availableModels.length > 0 && (now - modelsLastFetched) < 60000) {
      return availableModels;
    }

    try {
      const { getFreeModels } = await import('./api');
      const models = await getFreeModels();
      set({ availableModels: models, modelsLastFetched: now });
      return models;
    } catch (error) {
      console.error('[Store] Failed to fetch models:', error);
      return availableModels; // Return stale cache on error
    }
  },

  // Load local settings
  loadSettings: async () => {
    try {
      // Load council config
      const councilData = await AsyncStorage.getItem(COUNCIL_MODELS_KEY);
      let loadedCouncil: string[] = [];
      if (councilData) {
        loadedCouncil = JSON.parse(councilData);
      }

      const chairmanData = await AsyncStorage.getItem(CHAIRMAN_MODEL_KEY);
      const loadedChairman = chairmanData || null;

      const presetData = await AsyncStorage.getItem(ACTIVE_PRESET_KEY);
      const loadedPreset = presetData || null;

      const promptData = await AsyncStorage.getItem(CUSTOM_PROMPTS_KEY);
      let loadedPrompts: Record<string, string> = {};
      if (promptData) {
        loadedPrompts = JSON.parse(promptData);
      }

      set({
        councilModels: loadedCouncil,
        chairmanModel: loadedChairman,
        activePresetId: loadedPreset,
        customSystemPrompts: loadedPrompts
      });

      // Check API key
      const key = await secureStorage.getItem(API_KEY_SECURE_KEY);
      set({ hasApiKey: !!key });

    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  setCouncilModels: async (models, presetId) => {
    try {
      set({ councilModels: models, activePresetId: presetId || null });
      await AsyncStorage.setItem(COUNCIL_MODELS_KEY, JSON.stringify(models));
      if (presetId) {
        await AsyncStorage.setItem(ACTIVE_PRESET_KEY, presetId);
      } else {
        await AsyncStorage.removeItem(ACTIVE_PRESET_KEY);
      }
    } catch (error) {
      console.error('[Store] Failed to save council models:', error);
    }
  },

  setChairmanModel: async (model, presetId) => {
    try {
      set({ chairmanModel: model, activePresetId: presetId || null });
      if (model) {
        await AsyncStorage.setItem(CHAIRMAN_MODEL_KEY, model);
      } else {
        await AsyncStorage.removeItem(CHAIRMAN_MODEL_KEY);
      }
      if (presetId) {
        await AsyncStorage.setItem(ACTIVE_PRESET_KEY, presetId);
      } else {
        await AsyncStorage.removeItem(ACTIVE_PRESET_KEY);
      }
    } catch (error) {
      console.error('[Store] Failed to save chairman model:', error);
    }
  },

  setActivePresetId: async (id) => {
    try {
      set({ activePresetId: id });
      if (id) {
        await AsyncStorage.setItem(ACTIVE_PRESET_KEY, id);
      } else {
        await AsyncStorage.removeItem(ACTIVE_PRESET_KEY);
      }
    } catch (error) {
      console.error('[Store] Failed to save active preset:', error);
    }
  },

  updateCustomSystemPrompt: async (presetId, prompt) => {
    try {
      const prompts = { ...get().customSystemPrompts, [presetId]: prompt };
      set({ customSystemPrompts: prompts });
      await AsyncStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(prompts));
    } catch (error) {
      console.error('[Store] Failed to save custom system prompt:', error);
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
