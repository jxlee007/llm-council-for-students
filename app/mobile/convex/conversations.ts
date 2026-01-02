import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Conversation API functions
 */

// List all conversations for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return conversations.filter((c) => !c.isArchived);
  },
});

// Get a single conversation by ID
export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== identity.subject) {
      return null;
    }

    return conversation;
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    title: v.string(),
    modelConfig: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const conversationId = await ctx.db.insert("conversations", {
      userId: identity.subject,
      title: args.title,
      lastMessageAt: Date.now(),
      isArchived: false,
      modelConfig: args.modelConfig,
    });

    return conversationId;
  },
});

// Update conversation title
export const updateTitle = mutation({
  args: {
    id: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.id, { title: args.title });
  },
});

// Archive (soft delete) a conversation
export const archive = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.id, { isArchived: true });
  },
});

// Delete a conversation permanently
export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== identity.subject) {
      throw new Error("Not found");
    }

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.id);

    // Audit log
    await ctx.db.insert("audit_logs", {
      userId: identity.subject,
      action: "conversation.delete",
      resourceId: args.id,
      resourceType: "conversation",
      success: true,
      timestamp: Date.now(),
    });
  },
});
