import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getAuthUserOrNull } from "./helpers";

/**
 * typing.ts
 *
 * getTypingUsers uses getAuthUserOrNull → returns [] safely before user sync.
 * setTyping/clearTyping mutations use getAuthUser → throw if unauthenticated.
 */

const TYPING_TIMEOUT_MS = 3000;

export const setTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("typing")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: now });
    } else {
      await ctx.db.insert("typing", {
        conversationId: args.conversationId,
        userId: currentUser._id,
        updatedAt: now,
      });
    }
  },
});

export const clearTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("typing")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getTypingUsers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUserOrNull(ctx);
    if (!currentUser) return [];

    const now = Date.now();
    const cutoff = now - TYPING_TIMEOUT_MS;

    const typingRows = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const activeTypers = typingRows.filter(
      (t) => t.userId !== currentUser._id && t.updatedAt > cutoff
    );

    const typingUsers = await Promise.all(
      activeTypers.map((t) => ctx.db.get(t.userId))
    );

    return typingUsers.filter(Boolean);
  },
});