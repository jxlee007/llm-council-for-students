/**
 * UI Store for transient state management.
 * Handles only UI state and local settings.
 * All data persistence (conversations, messages) is handled by Convex.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { PRESETS } from './presets';

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
  // Settings (persisted locally)
  hasApiKey: boolean;
  councilModels: string[];
  chairmanModel: string | null;
  activePresetId: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  setCouncilModels: (models: string[], presetId?: string) => void;
  setChairmanModel: (model: string | null, presetId?: string) => void;
  setActivePresetId: (id: string | null) => void;

  // API Key management
  saveApiKey: (key: string) => Promise<void>;
  loadApiKey: () => Promise<string | null>;
  clearApiKey: () => Promise<void>;
  checkApiKeyExists: () => Promise<void>;
}

const findMatchingPreset = (councilModels: string[], chairmanModel: string | null): string | null => {
  const match = Object.entries(PRESETS).find(([key, preset]) => {
    const membersMatch =
      preset.members.length === councilModels.length &&
      preset.members.every((m) => councilModels.includes(m));
    const chairmanMatch = preset.chairman === chairmanModel;
    return membersMatch && chairmanMatch;
  });
  return match ? match[0] : null;
};

export const useUIStore = create<UIState>((set, get) => ({

  // Initial state
  hasApiKey: false,
  councilModels: [],
  chairmanModel: null,
  activePresetId: null,

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

      set({
        councilModels: loadedCouncil,
        chairmanModel: loadedChairman,
        activePresetId: findMatchingPreset(loadedCouncil, loadedChairman)
      });

      // Check API key
      const key = await secureStorage.getItem(API_KEY_SECURE_KEY);
      set({ hasApiKey: !!key });

    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  setCouncilModels: (models, presetId) => {
    const { chairmanModel } = get();
    const detectedPreset = presetId || findMatchingPreset(models, chairmanModel);
    set({ councilModels: models, activePresetId: detectedPreset });
    AsyncStorage.setItem(COUNCIL_MODELS_KEY, JSON.stringify(models));
  },

  setChairmanModel: (model, presetId) => {
    const { councilModels } = get();
    const detectedPreset = presetId || findMatchingPreset(councilModels, model);
    set({ chairmanModel: model, activePresetId: detectedPreset });
    if (model) {
      AsyncStorage.setItem(CHAIRMAN_MODEL_KEY, model);
    } else {
      AsyncStorage.removeItem(CHAIRMAN_MODEL_KEY);
    }
  },

  setActivePresetId: (id) => {
    set({ activePresetId: id });
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
