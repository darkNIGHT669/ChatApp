import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser } from "./helpers";

/**
 * presence.ts
 *
 * Tracks which users are currently online.
 *
 * Strategy:
 * - On app mount, call `setOnline` → upsert presence row with isOnline=true
 * - Every 30s, call `heartbeat` to refresh lastSeen timestamp
 * - On app unmount (window close / tab close), call `setOffline`
 * - A user is considered "online" if isOnline=true AND lastSeen < 60s ago
 *   (the 60s buffer handles cases where setOffline didn't fire — e.g. browser crash)
 *
 * Why store both isOnline and lastSeen?
 * isOnline alone doesn't handle crashes. lastSeen alone requires math on every query.
 * Together they give us clean online detection with crash resilience.
 */

const ONLINE_THRESHOLD_MS = 60_000; // 60 seconds

export const setOnline = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { isOnline: true, lastSeen: now });
    } else {
      await ctx.db.insert("presence", {
        userId: currentUser._id,
        isOnline: true,
        lastSeen: now,
      });
    }
  },
});

export const setOffline = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isOnline: false,
        lastSeen: Date.now(),
      });
    }
  },
});

export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: Date.now() });
    }
  },
});

/**
 * Returns a map of userId → isOnline for all users.
 * Components use this to show the green dot.
 */
export const getPresenceMap = query({
  args: {},
  handler: async (ctx) => {
    const allPresence = await ctx.db.query("presence").collect();
    const now = Date.now();

    // Build a map: userId string → boolean
    const presenceMap: Record<string, boolean> = {};

    for (const p of allPresence) {
      // User is online if flag is set AND they sent a heartbeat recently
      const isRecentlyActive = now - p.lastSeen < ONLINE_THRESHOLD_MS;
      presenceMap[p.userId] = p.isOnline && isRecentlyActive;
    }

    return presenceMap;
  },
});
