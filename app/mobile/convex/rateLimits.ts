import { internalMutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Shared Rate Limiting Logic
 */

// Helper function for Mutations to call directly
export const checkRateLimit = async (
  ctx: MutationCtx,
  identifier: string,
  key: string,
  limit: number,
  windowMs: number
) => {
  const now = Date.now();
  const resetTime = now + windowMs;

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_key", (q) =>
      q.eq("identifier", identifier).eq("key", key)
    )
    .first();

  if (existing) {
    if (existing.resetTime > now) {
      if (existing.hits >= limit) {
        throw new Error(`Rate limit exceeded. Try again later.`);
      }
      await ctx.db.patch(existing._id, {
        hits: existing.hits + 1,
      });
    } else {
      // Reset window
      await ctx.db.patch(existing._id, {
        hits: 1,
        resetTime: resetTime,
      });
    }
  } else {
    await ctx.db.insert("rateLimits", {
      identifier,
      key,
      hits: 1,
      resetTime,
    });
  }
};

// Internal Mutation for Actions to call
export const check = internalMutation({
  args: {
    identifier: v.string(),
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    await checkRateLimit(
      ctx,
      args.identifier,
      args.key,
      args.limit,
      args.windowMs
    );
  },
});
