import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    userId: v.optional(v.string()),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("conversations", {
      title: args.title,
      userId: args.userId,
      created_at: args.created_at,
    });
    return id;
  },
});

export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // If userId is provided, filter by it.
    // If not, we technically shouldn't return everything in a real app,
    // but for this prototype/guest mode, we might need a strategy.
    // However, the python client currently lists ALL conversations in file storage.
    // So here we will list all for now, or filter by user if provided.

    if (args.userId) {
      return await ctx.db
        .query("conversations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }

    // Fallback: List all (admin view or local dev parity)
    return await ctx.db.query("conversations").order("desc").collect();
  },
});

export const updateTitle = mutation({
  args: {
    id: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});
