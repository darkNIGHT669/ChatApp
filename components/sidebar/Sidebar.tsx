"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ConversationList } from "./ConversationList";
import { UserSearch } from "./UserSearch";
import { CreateGroupModal } from "./CreateGroupModal";

/**
 * components/sidebar/Sidebar.tsx
 *
 * Updated to include a "New Group" button that opens CreateGroupModal.
 * The modal state (open/closed) lives here so it overlays the full app.
 */
export function Sidebar() {
  const params = useParams();
  const hasActiveConversation = !!params?.conversationId;
  const [showGroupModal, setShowGroupModal] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <>
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
          <div className="flex items-center gap-2">
            {/* New Group button */}
            <button
              onClick={() => setShowGroupModal(true)}
              title="New group chat"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-500
                         transition-colors"
            >
              <Users className="h-5 w-5" />
            </button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>

        {/* Search for DMs */}
        <UserSearch />

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList />
        </div>
      </aside>

      {/* Group modal — rendered outside aside so it overlays everything */}
      {showGroupModal && (
        <CreateGroupModal onClose={() => setShowGroupModal(false)} />
      )}
    </>
  );
}