import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFreeModels } from '../lib/api';

// Mock Network
vi.mock('expo-network', () => ({
  getNetworkStateAsync: vi.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('api.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getFreeModels should fetch and return models', async () => {
    const mockModels = [{ id: 'model-1', name: 'Model 1' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockModels),
      text: () => Promise.resolve(JSON.stringify(mockModels)),
    });

    const models = await getFreeModels();
    expect(models).toEqual(mockModels);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/models/free'), expect.any(Object));
  });

  it('fetchApi should throw error on service failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    await expect(getFreeModels()).rejects.toThrow('API Error: 500');
  });
});
