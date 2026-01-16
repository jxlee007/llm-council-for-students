import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutations for council processing.
 * Called by the runCouncil action in council.ts
 */

/**
 * Insert a user message into the conversation.
 */
export const insertUserMessage = internalMutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        attachmentIds: v.optional(v.array(v.id("attachments"))),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            role: "user",
            content: args.content,
            attachmentIds: args.attachmentIds,
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
        });

        return messageId;
    },
});

/**
 * Insert a placeholder assistant message (processing state).
 */
export const insertAssistantPlaceholder = internalMutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            role: "assistant",
            content: "",
            processing: true,
            createdAt: Date.now(),
        });

        return messageId;
    },
});

/**
 * Update assistant message with Stage 1 results.
 */
export const updateStage1 = internalMutation({
    args: {
        messageId: v.id("messages"),
        stage1: v.array(
            v.object({
                model: v.string(),
                response: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            stage1: args.stage1,
        });
    },
});

/**
 * Update assistant message with Stage 2 results.
 */
export const updateStage2 = internalMutation({
    args: {
        messageId: v.id("messages"),
        stage2: v.array(
            v.object({
                model: v.string(),
                ranking: v.string(),
                parsed_ranking: v.array(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            stage2: args.stage2,
        });
    },
});

/**
 * Update assistant message with Stage 3 result and final content.
 */
export const updateStage3 = internalMutation({
    args: {
        messageId: v.id("messages"),
        stage3: v.object({
            model: v.string(),
            response: v.string(),
        }),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            stage3: args.stage3,
            content: args.content,
        });
    },
});

/**
 * Update conversation title.
 */
export const updateConversationTitle = internalMutation({
    args: {
        conversationId: v.id("conversations"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.conversationId, {
            title: args.title,
        });
    },
});

/**
 * Mark message as finished processing.
 */
export const finishProcessing = internalMutation({
    args: {
        messageId: v.id("messages"),
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            processing: false,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
        });
    },
});

/**
 * Set error state on message.
 */
export const setError = internalMutation({
    args: {
        messageId: v.id("messages"),
        conversationId: v.id("conversations"),
        error: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            processing: false,
            content: `Error: ${args.error}`,
            error: args.error,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
        });
    },
});
