"use client";

import { useParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConversationList } from "./ConversationList";
import { UserSearch } from "./UserSearch";

/**
 * components/sidebar/Sidebar.tsx
 *
 * The left panel of the app. Contains:
 * - App header with current user's avatar (via Clerk's UserButton)
 * - User search to start new conversations
 * - List of existing conversations
 *
 * Responsive behavior:
 * - Mobile: takes full width, hidden when a conversation is open
 * - Desktop (md+): fixed 320px wide, always visible
 *
 * UserButton is a Clerk component that renders a clickable avatar with
 * a dropdown for account management and sign-out.
 */
export function Sidebar() {
  const params = useParams();
  const hasActiveConversation = !!params?.conversationId;

  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <aside
      className={`
        flex flex-col w-full md:w-80 h-full border-r border-gray-200 bg-white
        ${hasActiveConversation ? "hidden md:flex" : "flex"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h1 className="font-semibold text-gray-900 text-lg">Messages</h1>
          {currentUser && (
            <p className="text-xs text-gray-400">{currentUser.name}</p>
          )}
        </div>
        {/* Clerk's built-in user button: avatar + sign-out dropdown */}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

      {/* Search for users to start a new DM */}
      <UserSearch />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList />
      </div>
    </aside>
  );
}
