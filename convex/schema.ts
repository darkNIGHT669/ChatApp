import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  conversations: defineTable({
    name: v.optional(v.string()),
    isGroup: v.boolean(),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageTime: v.optional(v.number()),
  }).index("by_last_message_time", ["lastMessageTime"]),

  members: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastReadTime: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_user_and_conversation", ["userId", "conversationId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    // content is empty string for file-only messages
    content: v.string(),
    isDeleted: v.boolean(),
    sentAt: v.number(),
    // ── File attachment fields (all optional) ──────────────────────────────
    // fileId: the Convex storage ID returned after uploading
    // fileType: MIME type e.g. "image/jpeg", "application/pdf"
    // fileName: original filename e.g. "photo.jpg", "report.pdf"
    fileId: v.optional(v.id("_storage")),
    fileType: v.optional(v.string()),
    fileName: v.optional(v.string()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_and_time", ["conversationId", "sentAt"]),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_and_user", ["messageId", "userId"]),

  presence: defineTable({
    userId: v.id("users"),
    lastSeen: v.number(),
    isOnline: v.boolean(),
  }).index("by_user", ["userId"]),

  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_and_conversation", ["userId", "conversationId"]),
});