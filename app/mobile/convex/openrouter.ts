"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8001";

/**
 * Proxy action to send message to Python Backend without exposing API Key.
 */
export const sendMessage = action({
  args: {
    conversationId: v.string(),
    content: v.string(),
    councilMembers: v.optional(v.array(v.string())),
    chairmanModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Rate Limit: 5 requests per minute per user
    await ctx.runMutation(internal.rateLimits.check, {
      identifier: identity.subject,
      key: "sendMessageProxy",
      limit: 5,
      windowMs: 60 * 1000,
    });

    // Fetch user config for API Key
    const userConfig = await ctx.runQuery(internal.users.getUserConfig, {
      userId: identity.subject,
    });

    const apiKey = userConfig?.openRouterApiKey;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["X-OpenRouter-Key"] = apiKey;
    }

    // Call Python Backend
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${args.conversationId}/message`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: args.content,
          council_members: args.councilMembers,
          chairman_model: args.chairmanModel,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend Error: ${response.status} - ${text}`);
    }

    return await response.json();
  },
});
