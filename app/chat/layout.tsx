"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { usePresence } from "@/hooks/usePresence";

/**
 * app/chat/layout.tsx
 *
 * Key fix: we track `isUserSynced` state.
 * We don't render the sidebar or children until upsertUser has completed
 * and the user profile exists in Convex.
 * This prevents queries like listMyConversations from firing before
 * the user row exists in the database.
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const [isUserSynced, setIsUserSynced] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    upsertUser({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? "Anonymous",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl,
    })
      .then(() => setIsUserSynced(true))
      .catch(console.error);
  }, [isLoaded, user, upsertUser]);

  // Show loading until Clerk is ready AND user is synced to Convex
  if (!isLoaded || !isUserSynced) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatShell>{children}</ChatShell>
  );
}

/**
 * Separate component so usePresence only runs after user is synced.
 * usePresence calls Convex mutations which need the user to exist first.
 */
function ChatShell({ children }: { children: React.ReactNode }) {
  usePresence();

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}