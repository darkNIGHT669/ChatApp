import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getAuthUserOrNull } from "./helpers";

// ─── DM ──────────────────────────────────────────────────────────────────────

export const getOrCreateDM = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    const myMemberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    const myConversationIds = new Set(
      myMemberships.map((m) => m.conversationId.toString())
    );

    const theirMemberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", args.otherUserId))
      .collect();

    for (const membership of theirMemberships) {
      if (myConversationIds.has(membership.conversationId.toString())) {
        const conversation = await ctx.db.get(membership.conversationId);
        if (conversation && !conversation.isGroup) {
          return membership.conversationId;
        }
      }
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
      lastMessageTime: now,
    });

    await ctx.db.insert("members", {
      conversationId,
      userId: currentUser._id,
      lastReadTime: now,
    });

    await ctx.db.insert("members", {
      conversationId,
      userId: args.otherUserId,
      lastReadTime: 0,
    });

    return conversationId;
  },
});

// ─── GROUP ───────────────────────────────────────────────────────────────────

/**
 * Creates a group conversation.
 *
 * Design decisions:
 * - Creator is always added as a member automatically
 * - memberIds should be OTHER users (not the creator)
 * - We deduplicate memberIds with a Set to be safe
 * - Min 1 other member required (2 total) — enforced here and in the UI
 */
export const createGroup = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    if (args.name.trim() === "") throw new Error("Group name cannot be empty");
    if (args.memberIds.length < 1)
      throw new Error("A group needs at least 2 members");

    const now = Date.now();

    const conversationId = await ctx.db.insert("conversations", {
      isGroup: true,
      name: args.name.trim(),
      lastMessageTime: now,
    });

    // Add creator
    await ctx.db.insert("members", {
      conversationId,
      userId: currentUser._id,
      lastReadTime: now,
    });

    // Add selected members (deduplicated, skip self if accidentally included)
    const uniqueMemberIds = [...new Set(args.memberIds)];
    for (const memberId of uniqueMemberIds) {
      if (memberId === currentUser._id) continue;
      await ctx.db.insert("members", {
        conversationId,
        userId: memberId,
        lastReadTime: 0,
      });
    }

    return conversationId;
  },
});

// ─── QUERIES ─────────────────────────────────────────────────────────────────

export const listMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthUserOrNull(ctx);
    if (!currentUser) return [];

    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    if (memberships.length === 0) return [];

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);
        if (!conversation) return null;

        const allMembers = await ctx.db
          .query("members")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        const otherMembers = allMembers.filter(
          (m) => m.userId !== currentUser._id
        );

        const otherUsers = await Promise.all(
          otherMembers.map((m) => ctx.db.get(m.userId))
        );

        const lastMessage = conversation.lastMessageId
          ? await ctx.db.get(conversation.lastMessageId)
          : null;

        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_and_time", (q) =>
            q
              .eq("conversationId", conversation._id)
              .gt("sentAt", membership.lastReadTime)
          )
          .collect();

        const unreadCount = unreadMessages.filter(
          (m) => m.senderId !== currentUser._id
        ).length;

        return {
          ...conversation,
          otherUsers: otherUsers.filter(Boolean),
          memberCount: allMembers.length,
          lastMessage,
          unreadCount,
          myLastReadTime: membership.lastReadTime,
        };
      })
    );

    return conversations
      .filter(Boolean)
      .sort((a, b) => (b!.lastMessageTime ?? 0) - (a!.lastMessageTime ?? 0));
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUserOrNull(ctx);
    if (!currentUser) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const allMembers = await ctx.db
      .query("members")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const isMember = allMembers.some((m) => m.userId === currentUser._id);
    if (!isMember) return null;

    const otherMembers = allMembers.filter(
      (m) => m.userId !== currentUser._id
    );

    const otherUsers = await Promise.all(
      otherMembers.map((m) => ctx.db.get(m.userId))
    );

    const allUsers = await Promise.all(
      allMembers.map((m) => ctx.db.get(m.userId))
    );

    return {
      ...conversation,
      otherUsers: otherUsers.filter(Boolean),
      allUsers: allUsers.filter(Boolean),
      memberCount: allMembers.length,
    };
  },
});

export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    if (!membership) throw new Error("Not a member");

    await ctx.db.patch(membership._id, {
      lastReadTime: Date.now(),
    });
  },
});