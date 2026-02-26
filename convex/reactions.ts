import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getAuthUserOrNull } from "./helpers";

/**
 * reactions.ts
 *
 * Handles emoji reactions on messages.
 *
 * The allowed emoji set is enforced on the client (UI only shows 5 options).
 * We don't validate it server-side — keeping mutations lean.
 */

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"] as const;

/**
 * Toggle a reaction on a message.
 *
 * If the current user already reacted with this emoji → delete (un-react).
 * If not → insert (react).
 *
 * This is safe from race conditions because Convex mutations are
 * executed serially — no two mutations run at the same time.
 */
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    // Check if this user already reacted with this emoji on this message
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_message_and_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", currentUser._id)
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .unique();

    if (existing) {
      // Already reacted — remove it
      await ctx.db.delete(existing._id);
    } else {
      // Not reacted yet — add it
      await ctx.db.insert("reactions", {
        messageId: args.messageId,
        userId: currentUser._id,
        emoji: args.emoji,
      });
    }
  },
});

/**
 * Get all reactions for a specific message.
 *
 * Returns a grouped summary:
 * [{ emoji: "👍", count: 3, hasReacted: true }, ...]
 *
 * hasReacted tells the UI whether to highlight this emoji for the current user.
 */
export const getReactions = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUserOrNull(ctx);

    const allReactions = await ctx.db
      .query("reactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();

    // Group by emoji: { "👍": [userId1, userId2], "❤️": [userId3] }
    const grouped: Record<string, string[]> = {};
    for (const reaction of allReactions) {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = [];
      }
      grouped[reaction.emoji].push(reaction.userId);
    }

    // Shape into array for the component
    return Object.entries(grouped).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      // hasReacted: does the current user appear in this emoji's list?
      hasReacted: currentUser ? userIds.includes(currentUser._id) : false,
    }));
  },
});

/**
 * Get reactions for multiple messages at once.
 * Used in MessageList to avoid N separate queries per message.
 *
 * Returns: Record<messageId, ReactionSummary[]>
 */
export const getReactionsForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUserOrNull(ctx);

    // Get all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    if (messages.length === 0) return {};

    // Get all reactions for all these messages in one query
    // We fetch per-message since Convex doesn't support IN queries natively
    const reactionsByMessage: Record<
      string,
      Array<{ emoji: string; count: number; hasReacted: boolean }>
    > = {};

    for (const message of messages) {
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_message", (q) => q.eq("messageId", message._id))
        .collect();

      if (reactions.length === 0) continue;

      const grouped: Record<string, string[]> = {};
      for (const r of reactions) {
        if (!grouped[r.emoji]) grouped[r.emoji] = [];
        grouped[r.emoji].push(r.userId);
      }

      reactionsByMessage[message._id] = Object.entries(grouped).map(
        ([emoji, userIds]) => ({
          emoji,
          count: userIds.length,
          hasReacted: currentUser ? userIds.includes(currentUser._id) : false,
        })
      );
    }

    return reactionsByMessage;
  },
});