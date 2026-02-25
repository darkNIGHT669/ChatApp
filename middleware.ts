import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * middleware.ts
 *
 * Clerk middleware runs on every request before it reaches your pages.
 * Public routes: sign-in, sign-up (don't require auth)
 * Everything else (/chat, etc.) is protected.
 *
 * Note: In Clerk v6+, auth() is async and protect() is called differently.
 * We use the simpler pattern: protect all non-public routes directly.
 */
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};