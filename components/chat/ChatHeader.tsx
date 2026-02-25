"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePresenceMap } from "@/hooks/usePresence";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

interface ChatHeaderProps {
  conversation: {
    _id: Id<"conversations">;
    otherUsers: Array<{
      _id: Id<"users">;
      name: string;
      imageUrl: string;
    }>;
  };
}

/**
 * components/chat/ChatHeader.tsx
 *
 * Displays at the top of the active conversation.
 * Shows: back button (mobile), other user's avatar + name + online status.
 *
 * The back button uses Link to /chat — this navigates back to the
 * conversation list on mobile (where the sidebar fills the whole screen).
 */
export function ChatHeader({ conversation }: ChatHeaderProps) {
  const presenceMap = usePresenceMap();
  const otherUser = conversation.otherUsers[0];

  const isOnline = otherUser ? (presenceMap?.[otherUser._id] ?? false) : false;

  if (!otherUser) return null;

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
      {/* Back button — only visible on mobile */}
      <Link
        href="/chat"
        className="md:hidden p-1 -ml-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUser.imageUrl} alt={otherUser.name} />
          <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
            {otherUser.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
        )}
      </div>

      {/* Name and status */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{otherUser.name}</h2>
        <p className="text-xs text-gray-400">
          {isOnline ? (
            <span className="text-green-500 font-medium">Online</span>
          ) : (
            "Offline"
          )}
        </p>
      </div>
    </header>
  );
}
