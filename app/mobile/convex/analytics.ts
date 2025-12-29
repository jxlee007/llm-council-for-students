import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Analytics API functions
 * Non-blocking event logging
 */

// Log an analytics event
export const log = mutation({
  args: {
    eventType: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject ?? "anonymous";

    await ctx.db.insert("analytics_events", {
      userId,
      eventType: args.eventType,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});
