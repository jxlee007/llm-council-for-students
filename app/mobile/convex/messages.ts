import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkRateLimit } from "./rateLimits";

/**
 * Messages API functions
 */

// List messages for a conversation
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Enrich messages with attachments
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        let attachments: any[] = [];
        if (msg.attachmentIds && msg.attachmentIds.length > 0) {
          const docs = await Promise.all(
            msg.attachmentIds.map((id) => ctx.db.get(id))
          );
          attachments = docs.filter((doc) => doc !== null);
        }
        return { ...msg, attachments };
      })
    );

    return enrichedMessages;
  },
});

// Send a user message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    attachmentIds: v.optional(v.array(v.id("attachments"))),
    imageBase64: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Rate limit: 10 messages per minute per conversation
    await checkRateLimit(ctx, args.conversationId, "sendMessage", 10, 60 * 1000);

    if (args.content.length > 5000) {
      throw new Error("Message content exceeds 5000 characters");
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Not found");
    }

    // Create the user message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "user",
      content: args.content,
      attachmentIds: args.attachmentIds,
      imageBase64: args.imageBase64,
      createdAt: Date.now(),
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

// Add assistant response (called after council processing)
export const addAssistantResponse = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    stage1: v.optional(
      v.array(
        v.object({
          model: v.string(),
          response: v.string(),
        })
      )
    ),
    stage2: v.optional(
      v.array(
        v.object({
          model: v.string(),
          ranking: v.string(),
          parsed_ranking: v.array(v.string()),
        })
      )
    ),
    stage3: v.optional(
      v.object({
        model: v.string(),
        response: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Not found");
    }

    // Create the assistant message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: args.content,
      stage1: args.stage1,
      stage2: args.stage2,
      stage3: args.stage3,
      createdAt: Date.now(),
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});
