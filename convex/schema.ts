import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * SCHEMA DESIGN NOTES
 *
 * users         — mirrors Clerk profiles. Synced via webhook or on first login.
 * conversations — a chat channel. Currently 1:1, extensible to groups.
 * members       — join table: who belongs to which conversation.
 *                 Also tracks `lastReadTime` for unread count logic.
 * messages      — the actual chat content. Soft-deletable.
 * presence      — one row per user, updated on mount/unmount.
 * typing        — ephemeral rows; written on keypress, deleted on send/timeout.
 */
export default defineSchema({
  users: defineTable({
    // clerkId is our foreign key to Clerk's user system
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  }).index("by_clerk_id", ["clerkId"]),
  // Index lets us do: db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", id))

  conversations: defineTable({
    // For DMs this is null; for groups it's set (extensible for feature 14)
    name: v.optional(v.string()),
    isGroup: v.boolean(),
    // Snapshot of last message for sidebar preview — avoids a join query
    lastMessageId: v.optional(v.id("messages")),
    lastMessageTime: v.optional(v.number()),
  }).index("by_last_message_time", ["lastMessageTime"]),
  // Sorted index so we can show conversations newest-first in the sidebar

  members: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    // Unix timestamp (ms) of the last message this user has "seen"
    // Used to compute unread count: count messages after this timestamp
    lastReadTime: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_user_and_conversation", ["userId", "conversationId"]),
  // by_user:            find all conversations a user is part of
  // by_conversation:    find all members in a conversation
  // by_user_and_conversation: check membership / get lastReadTime efficiently

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    // Soft delete: we keep the row, just flip this flag and clear content
    isDeleted: v.boolean(),
    // _creationTime is built-in to Convex, but we store this explicitly
    // so we can sort and do timestamp comparisons without extra lookups
    sentAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_and_time", ["conversationId", "sentAt"]),
  // by_conversation_and_time: paginate messages in order within a conversation

  presence: defineTable({
    userId: v.id("users"),
    // ISO string or epoch ms of last heartbeat
    lastSeen: v.number(),
    // true = app is open right now
    isOnline: v.boolean(),
  }).index("by_user", ["userId"]),
  // One row per user. Updated via mutation on mount, cleared on unmount.

  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    // Timestamp of last keystroke — used to expire stale indicators
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_and_conversation", ["userId", "conversationId"]),
  // We'll query by_conversation to show "X is typing..." in a chat
  // We'll query by_user_and_conversation to upsert the current user's typing row
});
