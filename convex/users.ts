import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getAuthUserId } from "./helpers";

/**
 * users.ts — User profile management
 *
 * Clerk manages authentication (passwords, OAuth, sessions).
 * Convex stores the application profile so other users can discover you,
 * and so we can reference you in messages/conversations with a Convex ID.
 *
 * Flow: User signs in via Clerk → our app calls `upsertUser` on mount →
 * profile is stored/updated in Convex → other users can query it.
 */

/**
 * Called on app load for every authenticated user.
 * Upsert = insert if not exists, update if exists.
 */
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
    });
  },
});

/**
 * Returns all users except the currently logged-in user.
 * Used in the user search/list panel.
 */
export const listOtherUsers = query({
  args: {
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    const allUsers = await ctx.db.query("users").collect();

    const others = allUsers.filter((u) => u._id !== currentUser._id);

    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const q = args.searchQuery.toLowerCase();
      return others.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    return others;
  },
});

/**
 * Fetch a single user by their Convex ID.
 * v.id("users") ensures Convex type-checks this as a real users table ID.
 */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get the current authenticated user's Convex profile.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getAuthUser(ctx);
      return user;
    } catch {
      return null;
    }
  },
});