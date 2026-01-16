"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8001";

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
    data?: Stage1Response[] | Stage2Response[] | Stage3Response | { title: string };
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
        attachmentIds: v.optional(v.array(v.id("attachments"))),
        councilMembers: v.optional(v.array(v.string())),
        chairmanModel: v.optional(v.string()),
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
        await ctx.runMutation(internal.councilMutations.insertUserMessage, {
            conversationId: args.conversationId,
            content: args.content,
            attachmentIds: args.attachmentIds,
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
        const apiKey = userConfig?.openRouterApiKey;
        console.log(`[Council] API Key found for user ${identity.subject}: ${apiKey ? "YES (starts with " + apiKey.substring(0, 8) + "...)" : "NO"}`);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (apiKey) {
            headers["X-OpenRouter-Key"] = apiKey;
            console.log("[Council] Added X-OpenRouter-Key header");
        } else {
            console.log("[Council] WARNING: No API Key found, backend will likely fail");
        }

        const body: Record<string, unknown> = { content: args.content };
        if (args.councilMembers && args.councilMembers.length > 0) {
            body.council_members = args.councilMembers;
        }
        if (args.chairmanModel) {
            body.chairman_model = args.chairmanModel;
        }

        try {
            // 3. Call FastAPI streaming endpoint
            const response = await fetch(
                `${API_BASE_URL}/api/conversations/${args.conversationId}/message/stream`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body),
                }
            );

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

                            if (event.type === "stage1_complete" && event.data) {
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
