import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Attachments API functions
 * Handles text-extracted file attachments (max 50k chars)
 */

// List attachments for a conversation
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return attachments;
  },
});

// Create an attachment with extracted text
export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    fileName: v.string(),
    fileType: v.string(),
    extractedText: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Truncate to 50k chars if needed
    const MAX_CHARS = 50000;
    const isTruncated = args.extractedText.length > MAX_CHARS;
    const extractedText = isTruncated
      ? args.extractedText.slice(0, MAX_CHARS)
      : args.extractedText;

    const attachmentId = await ctx.db.insert("attachments", {
      userId: identity.subject,
      conversationId: args.conversationId,
      fileName: args.fileName,
      fileType: args.fileType,
      extractedText,
      charCount: extractedText.length,
      isTruncated,
      createdAt: Date.now(),
    });

    return attachmentId;
  },
});

// Delete an attachment
export const remove = mutation({
  args: { id: v.id("attachments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const attachment = await ctx.db.get(args.id);
    if (!attachment || attachment.userId !== identity.subject) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.id);
  },
});
