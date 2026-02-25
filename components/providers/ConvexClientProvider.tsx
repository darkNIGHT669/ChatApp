"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

/**
 * components/providers/ConvexClientProvider.tsx
 *
 * Why "use client"?
 * React context (which providers use) only works in Client Components.
 * This is the standard pattern: thin client wrapper around server-compatible children.
 *
 * ConvexProviderWithClerk vs ConvexProvider:
 * ConvexProviderWithClerk automatically attaches Clerk's auth token to every
 * Convex request. This is what makes ctx.auth.getUserIdentity() work server-side.
 *
 * The ConvexReactClient is initialized once outside the component
 * so it's not recreated on every render.
 */
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
