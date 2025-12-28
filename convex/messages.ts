import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

export const add = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.string(),
    content: v.optional(v.string()),
    stage1: v.optional(v.any()),
    stage2: v.optional(v.any()),
    stage3: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      stage1: args.stage1,
      stage2: args.stage2,
      stage3: args.stage3,
    });
  },
});
