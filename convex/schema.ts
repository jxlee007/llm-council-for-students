import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  conversations: defineTable({
    title: v.string(),
    userId: v.optional(v.string()), // Nullable for guest users
    created_at: v.string(), // ISO string to match existing storage format
  }).index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.string(), // "user" or "assistant"
    content: v.optional(v.string()), // Content for user messages

    // Assistant message stages
    stage1: v.optional(v.any()), // List of model responses
    stage2: v.optional(v.any()), // Rankings
    stage3: v.optional(v.any()), // Final synthesis
  }).index("by_conversation", ["conversationId"]),
});
