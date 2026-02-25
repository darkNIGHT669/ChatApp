import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * helpers.ts
 *
 * getAuthUser: returns the user or throws (use in mutations where auth is required)
 * getAuthUserOrNull: returns the user or null (use in queries to avoid hard crashes)
 */

export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new Error("User profile not found. Call upsertUser first.");

  return user;
}

export async function getAuthUserId(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthUser(ctx);
  return user._id;
}

/**
 * Safe version for queries — returns null instead of throwing.
 * Use this in useQuery hooks to avoid "Unhandled Runtime Error" crashes
 * during the brief window between Clerk login and Convex user sync.
 */
export async function getAuthUserOrNull(ctx: QueryCtx | MutationCtx) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user ?? null;
  } catch {
    return null;
  }
}