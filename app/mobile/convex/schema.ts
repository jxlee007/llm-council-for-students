import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for LLM Council
 * 
 * Tables:
 * - users: Synced from Clerk via webhooks
 * - conversations: Chat session containers
 * - messages: Individual chat messages with council data
 * - attachments: Extracted text from uploaded files
 * - analytics_events: Usage tracking
 */

export default defineSchema({
  // Users - synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    isPro: v.boolean(),
    subscriptionTier: v.optional(v.string()),
    openRouterApiKey: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  // Conversations - chat sessions
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    lastMessageAt: v.number(),
    isArchived: v.optional(v.boolean()),
    modelConfig: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "lastMessageAt"]),

  // Messages - with council stages
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    attachmentIds: v.optional(v.array(v.id("attachments"))),
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
    processing: v.optional(v.boolean()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // Attachments - extracted text from files
  attachments: defineTable({
    userId: v.string(),
    conversationId: v.id("conversations"),
    messageId: v.optional(v.id("messages")),
    fileName: v.string(),
    fileType: v.string(),
    extractedText: v.string(),
    charCount: v.number(),
    isTruncated: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"]),

  // Analytics events
  analytics_events: defineTable({
    userId: v.string(),
    eventType: v.string(),
    metadata: v.any(),
    createdAt: v.number(),
  }).index("by_event", ["eventType"]),

  // Audit logs for sensitive actions
  audit_logs: defineTable({
    userId: v.string(),
    action: v.string(),
    resourceId: v.optional(v.string()),
    resourceType: v.string(),
    timestamp: v.number(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Rate limits for actions
  rateLimits: defineTable({
    identifier: v.string(),
    key: v.string(),
    hits: v.number(),
    resetTime: v.number(),
  }).index("by_identifier_key", ["identifier", "key"]),
});
