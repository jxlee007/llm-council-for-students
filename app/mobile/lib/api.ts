/**
 * API wrapper for LLM Council FastAPI backend.
 * Connects to the existing backend endpoints.
 */

import type {
    Conversation,
    ConversationMetadata,
    SendMessageResponse,
    Model,
} from './types';
import * as Network from 'expo-network';
import { Config } from './config';

import pRetry from 'p-retry';

// Backend URL - uses env var for production, fallback to localhost
const API_BASE_URL = Config.apiUrl;

/**
 * Generic fetch wrapper with error handling and retry logic.
 */
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const runFetch = async () => {
        // Check network connectivity
        const networkState = await Network.getNetworkStateAsync();
        if (networkState.isConnected === false) {
            // p-retry doesn't retry on AbortError by default, but we'll throw a regular error for no connection
            const error = new Error('No Internet Connection');
            (error as any).noRetry = true; // Mark as non-retryable
            throw error;
        }

        // Add 30s timeout per attempt
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                signal: controller.signal,
                ...options,
            });

            if (!response.ok) {
                const errorText = await response.text();
                const error: any = new Error(`API Error: ${response.status} - ${errorText}`);
                error.status = response.status;
                
                // Only retry on 429 (Rate Limit) or 5xx (Server Error)
                if (response.status !== 429 && (response.status < 500 || response.status > 599)) {
                    error.noRetry = true;
                }
                throw error;
            }

            return await response.json();
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        } finally {
            clearTimeout(id);
        }
    };

    return pRetry(runFetch, {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        onFailedAttempt: (error) => {
            if ((error as any).noRetry) {
                throw error; // Bail out if not retryable
            }
            console.warn(`[API] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
        },
    });
}

/**
 * Get list of free models from backend.
 */
export async function getFreeModels(): Promise<Model[]> {
    return fetchApi<Model[]>('/api/models/free');
}

/**
 * Send a message and get the 3-stage council response.
 * @param conversationId - The conversation ID
 * @param content - The message content
 * @param apiKey - Optional OpenRouter API key for BYOK
 */
export async function sendMessage(
    conversationId: string,
    content: string,
    apiKey?: string | null,
    councilMembers?: string[],
    chairmanModel?: string | null
): Promise<SendMessageResponse> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    // Add API key header if provided
    if (apiKey) {
        headers['X-OpenRouter-Key'] = apiKey;
    }

    const body: any = { content };
    if (councilMembers && councilMembers.length > 0) {
        body.council_members = councilMembers;
    }
    if (chairmanModel) {
        body.chairman_model = chairmanModel;
    }

    return fetchApi<SendMessageResponse>(
        `/api/conversations/${conversationId}/message`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        }
    );
}

/**
 * Send a message and stream the 3-stage council process via SSE.
 * Returns an async generator that yields SSE events.
 * @param conversationId - The conversation ID
 * @param content - The message content
 * @param apiKey - Optional OpenRouter API key for BYOK
 * @param councilMembers - Optional list of models for the council
 * @param chairmanModel - Optional model for the chairman
 */
export async function* sendMessageStream(
    conversationId: string,
    content: string,
    apiKey?: string | null,
    councilMembers?: string[],
    chairmanModel?: string | null
): AsyncGenerator<{ type: string; data?: unknown; message?: string; metadata?: unknown }> {
    // Check network connectivity first
    const networkState = await Network.getNetworkStateAsync();
    if (networkState.isConnected === false) {
        throw new Error('No Internet Connection');
    }

    const url = `${API_BASE_URL}/api/conversations/${conversationId}/message/stream`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    // Add API key header if provided
    if (apiKey) {
        headers['X-OpenRouter-Key'] = apiKey;
    }

    const body: any = { content };
    if (councilMembers && councilMembers.length > 0) {
        body.council_members = councilMembers;
    }
    if (chairmanModel) {
        body.chairman_model = chairmanModel;
    }

    // Add 60s timeout for stream start
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(id); // Clear timeout once response starts

        if (!response.ok) {
            throw new Error(`Stream Error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE events from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        yield data;
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    } finally {
        clearTimeout(id);
    }
}

/**
 * Health check for the backend.
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
    return fetchApi<{ status: string; service: string }>('/');
}

export { API_BASE_URL };
