/**
 * Type definitions for LLM Council API responses.
 * Matches the backend response structure from FastAPI.
 */

/** OpenRouter Model */
export interface Model {
    id: string;
    name: string;
    description?: string;
    context_length: number;
    pricing: {
        prompt: string;
        completion: string;
    };
    provider?: string;
    capabilities?: {
        image: boolean;
        video: boolean;
    };
    ui_pills?: string[];
    rankings?: string[];
}

/** Stage 1: Individual model response */
export interface Stage1Response {
    model: string;
    response: string;
}

/** Stage 2: Model ranking with parsed data */
export interface Stage2Response {
    model: string;
    ranking: string;
    parsed_ranking: string[];
}

/** Stage 3: Chairman's final synthesized answer */
export interface Stage3Response {
    model: string;
    response: string;
}

/** Aggregate ranking for a model */
export interface AggregateRanking {
    model: string;
    average_rank: number;
    rankings_count: number;
}

/** User message in a conversation */
export interface UserMessage {
    role: 'user';
    content: string;
}

/** Assistant message with 3-stage council response */
export interface AssistantMessage {
    role: 'assistant';
    stage1: Stage1Response[];
    stage2: Stage2Response[];
    stage3: Stage3Response;
}

/** A message in the conversation (either user or assistant) */
export type Message = UserMessage | AssistantMessage;

/** Full conversation with messages */
export interface Conversation {
    id: string;
    created_at: string;
    title: string;
    messages: Message[];
}

/** Conversation metadata for list view */
export interface ConversationMetadata {
    id: string;
    created_at: string;
    title: string;
    message_count: number;
}

/** Response from sending a message */
export interface SendMessageResponse {
    stage1: Stage1Response[];
    stage2: Stage2Response[];
    stage3: Stage3Response;
    metadata: {
        label_to_model: Record<string, string>;
        aggregate_rankings: AggregateRanking[];
    };
}

/** SSE event types from streaming endpoint */
export type SSEEventType =
    | 'stage1_start'
    | 'stage1_complete'
    | 'stage2_start'
    | 'stage2_complete'
    | 'stage3_start'
    | 'stage3_complete'
    | 'title_complete'
    | 'complete'
    | 'error';

export interface SSEEvent {
    type: SSEEventType;
    data?: unknown;
    message?: string;
    metadata?: {
        label_to_model?: Record<string, string>;
        aggregate_rankings?: AggregateRanking[];
    };
}
