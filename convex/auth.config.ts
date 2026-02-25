/**
 * convex/auth.config.ts
 *
 * Tells Convex how to validate Clerk JWTs.
 * The `domain` must match your Clerk Frontend API URL.
 * Find it in: Clerk Dashboard → API Keys → Frontend API URL
 *
 * Example: https://your-app.clerk.accounts.dev
 *
 * How this works:
 * When a user makes a request, Clerk attaches a JWT to it.
 * Convex fetches Clerk's public keys from this domain and validates the token.
 * If valid, ctx.auth.getUserIdentity() returns the user's info.
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
