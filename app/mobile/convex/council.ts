"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { decryptApiKey } from "./encryption";

const API_BASE_URL = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || "http://localhost:8001";
const CONNECTION_TIMEOUT_MS = 30000; // 30s to establish connection
const STREAM_TIMEOUT_MS = 180000; // 3 minutes max for full stream

/**
 * Stage 1 response type from FastAPI
 */
interface Stage1Response {
    model: string;
    response: string;
}

/**
 * Stage 2 response type from FastAPI
 */
interface Stage2Response {
    model: string;
    ranking: string;
    parsed_ranking: string[];
}

/**
 * Stage 3 response type from FastAPI
 */
interface Stage3Response {
    model: string;
    response: string;
}

/**
 * SSE Event from FastAPI streaming endpoint
 */
interface SSEEvent {
    type: string;
    data?: Stage1Response[] | Stage2Response[] | Stage3Response | { title: string } | Record<string, any>;
    message?: string;
    metadata?: {
        label_to_model?: Record<string, string>;
        aggregate_rankings?: Array<{
            model: string;
            average_rank: number;
            rankings_count: number;
        }>;
    };
}

/**
 * Run the council process for a message.
 * This action:
 * 1. Creates a user message in Convex
 * 2. Creates a placeholder assistant message with processing=true
 * 3. Calls FastAPI streaming endpoint
 * 4. Updates assistant message with stage1, stage2, stage3 incrementally
 * 5. On error, updates message with error content
 */
export const runCouncil = action({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        context: v.optional(v.string()), // Additional context (e.g. file content) for LLM but not for display
        attachmentIds: v.optional(v.array(v.id("attachments"))),
        councilMembers: v.optional(v.array(v.string())),
        chairmanModel: v.optional(v.string()),
        imageBase64: v.optional(v.string()),
        imageMimeType: v.optional(v.string()),
        attachmentType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Rate limit: 5 council requests per minute
        await ctx.runMutation(internal.rateLimits.check, {
            identifier: identity.subject,
            key: "runCouncil",
            limit: 5,
            windowMs: 60 * 1000,
        });

        // 1. Create user message
        const type = args.imageBase64 ? (args.content ? "image_text" : "image") : "text";
        // Create a data URI for imageUrl if image is present
        const imageUrl = args.imageBase64
            ? `data:${args.imageMimeType || "image/jpeg"};base64,${args.imageBase64}`
            : undefined;

        const userMessageId = await ctx.runMutation(internal.councilMutations.insertUserMessage, {
            conversationId: args.conversationId,
            content: args.content,
            attachmentIds: args.attachmentIds,
            imageBase64: args.imageBase64,
            imageUrl: imageUrl,
            attachmentType: args.attachmentType,
            type: type as "text" | "image" | "image_text",
        });

        // 2. Create placeholder assistant message (processing)
        const assistantMessageId = await ctx.runMutation(
            internal.councilMutations.insertAssistantPlaceholder,
            {
                conversationId: args.conversationId,
            }
        );

        // Fetch user's API key if they have one
        const userConfig = await ctx.runQuery(internal.users.getUserConfig, {
            userId: identity.subject,
        });

        // Decrypt the API key if present
        let apiKey: string | null = null;
        if (userConfig?.openRouterApiKey) {
            try {
                apiKey = decryptApiKey(userConfig.openRouterApiKey);
            } catch (error) {
                console.error("[Council] Failed to decrypt API key");
            }
        }
        // Log only presence, never the key content
        console.log(`[Council] API Key status: ${apiKey ? "CONFIGURED" : "NOT_CONFIGURED"}`);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (apiKey) {
            headers["X-OpenRouter-Key"] = apiKey;
        } else {
            console.warn("[Council] No API Key configured, backend may require one");
        }

        // Combine context and content for the LLM prompt
        const llmPrompt = args.context
            ? `${args.context}\n\n${args.content}`
            : args.content;

        const body: Record<string, unknown> = { content: llmPrompt };
        if (args.councilMembers && args.councilMembers.length > 0) {
            body.council_members = args.councilMembers;
        }
        if (args.chairmanModel) {
            body.chairman_model = args.chairmanModel;
        }
        if (args.imageBase64) {
            body.image_data = {
                data: args.imageBase64,
                mime_type: args.imageMimeType || "image/jpeg",
            };
        }
        if (args.attachmentType) {
            body.attachment_type = args.attachmentType;
        }

        try {
            // 3. Call FastAPI streaming endpoint with connection timeout
            const controller = new AbortController();
            const connectionTimeout = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);

            const response = await fetch(
                `${API_BASE_URL}/api/conversations/${args.conversationId}/message/stream`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body),
                    signal: controller.signal,
                }
            );

            clearTimeout(connectionTimeout);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Backend Error: ${response.status} - ${text}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No response body");
            }

            const decoder = new TextDecoder();
            let buffer = "";

            // 4. Process SSE events and update Convex incrementally
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const event: SSEEvent = JSON.parse(line.slice(6));

                            if (event.type === "vision_complete" && event.data) {
                                await ctx.runMutation(internal.councilMutations.updateMessageVision, {
                                    messageId: userMessageId,
                                    visionContext: JSON.stringify(event.data),
                                });
                            } else if (event.type === "stage1_complete" && event.data) {
                                await ctx.runMutation(internal.councilMutations.updateStage1, {
                                    messageId: assistantMessageId,
                                    stage1: event.data as Stage1Response[],
                                });
                            } else if (event.type === "stage2_complete" && event.data) {
                                await ctx.runMutation(internal.councilMutations.updateStage2, {
                                    messageId: assistantMessageId,
                                    stage2: event.data as Stage2Response[],
                                });
                            } else if (event.type === "stage3_complete" && event.data) {
                                const stage3 = event.data as Stage3Response;
                                await ctx.runMutation(internal.councilMutations.updateStage3, {
                                    messageId: assistantMessageId,
                                    stage3,
                                    content: stage3.response,
                                });
                            } else if (event.type === "title_complete" && event.data) {
                                const titleData = event.data as { title: string };
                                await ctx.runMutation(internal.councilMutations.updateConversationTitle, {
                                    conversationId: args.conversationId,
                                    title: titleData.title,
                                });
                            } else if (event.type === "error") {
                                throw new Error(event.message || "Council processing failed");
                            }
                        } catch (parseError) {
                            // Skip malformed JSON
                            if (parseError instanceof SyntaxError) continue;
                            throw parseError;
                        }
                    }
                }
            }

            // Mark as no longer processing
            await ctx.runMutation(internal.councilMutations.finishProcessing, {
                messageId: assistantMessageId,
                conversationId: args.conversationId,
            });

            return { success: true, messageId: assistantMessageId };
        } catch (error: unknown) {
            // 5. On error, update message with error content
            const errorMessage =
                error instanceof Error ? error.message : "Council processing failed";

            await ctx.runMutation(internal.councilMutations.setError, {
                messageId: assistantMessageId,
                conversationId: args.conversationId,
                error: errorMessage,
            });

            return { success: false, error: errorMessage };
        }
    },
});
