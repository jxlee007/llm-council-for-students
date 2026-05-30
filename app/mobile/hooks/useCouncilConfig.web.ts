import { useUIStore } from '../lib/store';

export function useCouncilConfig() {
  const hasApiKey = useUIStore((state) => state.hasApiKey);
  const settingsLoaded = useUIStore((state) => state.settingsLoaded);

  return {
    hasApiKey: settingsLoaded ? hasApiKey : undefined,
    saveApiKeySecure: async (args: { apiKey: string }) => {
      // On web, the local saveApiKey in ConfigureScreen handles saving key.
      // So this is a no-op that resolves immediately.
      return Promise.resolve();
    },
    clearApiKeyInDB: async () => {
      // On web, the local clearApiKey in ConfigureScreen handles clearing key.
      // So this is a no-op that resolves immediately.
      return Promise.resolve();
    },
    isLoading: !settingsLoaded,
  };
}
