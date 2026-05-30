import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export function useCouncilConfig() {
  const hasApiKey = useQuery(api.users.hasApiKey);
  const saveApiKeySecure = useAction(api.userActions.saveApiKeySecure);
  const clearApiKeyInDB = useMutation(api.users.clearApiKey);

  return {
    hasApiKey,
    saveApiKeySecure: async (args: { apiKey: string }) => {
      await saveApiKeySecure(args);
    },
    clearApiKeyInDB: async () => {
      await clearApiKeyInDB();
    },
    isLoading: hasApiKey === undefined,
  };
}
