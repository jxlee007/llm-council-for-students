import { internalMutation, internalQuery, mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Users API functions
 * Synced from Clerk via webhooks
 */

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

// Get current user
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    return user;
  },
});

// Get or create user (called on first login)
// This ensures user records exist for OAuth users who bypass webhooks
export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Check if user exists
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      // Create new user from JWT claims
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "",
        name: identity.name,
        isPro: false,
        createdAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    return user;
  },
});

// Upsert user from Clerk webhook
export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
      });
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      isPro: false,
      createdAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      userId: userId,
      action: "user.upsert_webhook",
      resourceId: userId,
      resourceType: "user",
      timestamp: Date.now(),
      success: true,
    });

    return userId;
  },
});

// Delete user (for Clerk webhook)
export const deleteByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// Get user config (for internal actions) - returns decrypted key
export const getUserConfig = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      return null;
    }

    // Return the encrypted key - decryption happens in the action
    return {
      openRouterApiKey: user.openRouterApiKey || undefined,
    };
  },
});

// Internal mutation to store encrypted API key
export const storeEncryptedApiKey = internalMutation({
  args: {
    clerkId: v.string(),
    encryptedKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      openRouterApiKey: args.encryptedKey,
    });

    // Audit log for API key update
    await ctx.db.insert("audit_logs", {
      userId: args.clerkId,
      action: "user.update_api_key",
      resourceId: user._id,
      resourceType: "user",
      timestamp: Date.now(),
      success: true,
    });
  },
});

// Update user's OpenRouter API key (encrypts before storage)
// Note: This is a mutation that stores plain text for now
// For encryption, use the saveApiKeySecure action instead
export const updateApiKey = mutation({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Store as-is for now - the action wrapper handles encryption
    await ctx.db.patch(user._id, {
      openRouterApiKey: args.apiKey,
    });
  },
});

// Clear user's OpenRouter API key
export const clearApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      openRouterApiKey: undefined,
    });

    // Audit log for API key removal
    await ctx.db.insert("audit_logs", {
      userId: identity.subject,
      action: "user.clear_api_key",
      resourceId: user._id,
      resourceType: "user",
      timestamp: Date.now(),
      success: true,
    });
  },
});

// Check if current user has an API key stored
export const hasApiKey = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    return !!user?.openRouterApiKey;
  },
});

// Debug query - REMOVE IN PRODUCTION
// Shows only whether a key exists, never the key itself
export const debugUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({
      id: u._id,
      clerkId: u.clerkId,
      email: u.email,
      hasKey: !!u.openRouterApiKey,
      // Never log or return actual key content
      keyStatus: u.openRouterApiKey
        ? (u.openRouterApiKey.startsWith("enc:") ? "ENCRYPTED" : "LEGACY")
        : "NONE"
    }));
  },
});
