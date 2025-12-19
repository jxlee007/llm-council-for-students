/**
 * API wrapper for LLM Council FastAPI backend.
 * Connects to the existing backend endpoints.
 */

import type {
    Conversation,
    ConversationMetadata,
    SendMessageResponse,
} from './types';

// Backend URL - change for production
const API_BASE_URL = 'http://localhost:8001';

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
}

/**
 * List all conversations (metadata only).
 */
export async function getConversations(): Promise<ConversationMetadata[]> {
    return fetchApi<ConversationMetadata[]>('/api/conversations');
}

/**
 * Create a new conversation.
 */
export async function createConversation(): Promise<Conversation> {
    return fetchApi<Conversation>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

/**
 * Get a specific conversation with all messages.
 */
export async function getConversation(conversationId: string): Promise<Conversation> {
    return fetchApi<Conversation>(`/api/conversations/${conversationId}`);
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
    apiKey?: string | null
): Promise<SendMessageResponse> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    // Add API key header if provided
    if (apiKey) {
        headers['X-OpenRouter-Key'] = apiKey;
    }

    return fetchApi<SendMessageResponse>(
        `/api/conversations/${conversationId}/message`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({ content }),
        }
    );
}

/**
 * Send a message and stream the 3-stage council process via SSE.
 * Returns an async generator that yields SSE events.
 * @param conversationId - The conversation ID
 * @param content - The message content
 * @param apiKey - Optional OpenRouter API key for BYOK
 */
export async function* sendMessageStream(
    conversationId: string,
    content: string,
    apiKey?: string | null
): AsyncGenerator<{ type: string; data?: unknown; message?: string; metadata?: unknown }> {
    const url = `${API_BASE_URL}/api/conversations/${conversationId}/message/stream`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    // Add API key header if provided
    if (apiKey) {
        headers['X-OpenRouter-Key'] = apiKey;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
    });

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
}

/**
 * Health check for the backend.
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
    return fetchApi<{ status: string; service: string }>('/');
}

export { API_BASE_URL };
