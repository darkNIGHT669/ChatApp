import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getAuthUserOrNull } from "./helpers";

/**
 * messages.ts
 *
 * list query uses getAuthUserOrNull → returns [] safely before user sync.
 * send/softDelete mutations use getAuthUser → throw if unauthenticated.
 */

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUserOrNull(ctx);
    if (!currentUser) return [];

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    if (!membership) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_time", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender,
          isOwnMessage: message.senderId === currentUser._id,
        };
      })
    );

    return messagesWithSenders;
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    if (args.content.trim() === "") throw new Error("Message cannot be empty");

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    if (!membership) throw new Error("Not a member of this conversation");

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: args.content.trim(),
      isDeleted: false,
      sentAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageTime: now,
    });

    await ctx.db.patch(membership._id, {
      lastReadTime: now,
    });

    return messageId;
  },
});

export const softDelete = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== currentUser._id) {
      throw new Error("You can only delete your own messages");
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "",
    });
  },
});