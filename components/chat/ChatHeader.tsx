"use client";

import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePresenceMap } from "@/hooks/usePresence";
import { Id } from "@/convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  name: string;
  imageUrl: string;
  [key: string]: unknown;
}

interface ChatHeaderProps {
  conversationId: Id<"conversations">;
  isGroup: boolean;
  groupName?: string | null;
  otherUsers: User[];
  memberCount: number;
}

/**
 * components/chat/ChatHeader.tsx
 *
 * Handles two modes:
 * - DM: shows other user's avatar, name, online status
 * - Group: shows stacked avatars, group name, member count
 *
 * Props are passed explicitly (not the whole conversation object)
 * to avoid TypeScript conflicts with the Convex return type.
 */
export function ChatHeader({
  conversationId,
  isGroup,
  groupName,
  otherUsers,
  memberCount,
}: ChatHeaderProps) {
  const presenceMap = usePresenceMap();

  const dmUser = !isGroup ? otherUsers[0] : null;
  const isOnline = dmUser ? (presenceMap?.[dmUser._id] ?? false) : false;

  const displayName = isGroup
    ? (groupName ?? "Group Chat")
    : (dmUser?.name ?? "Unknown");

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
      {/* Back button — mobile only */}
      <Link
        href="/chat"
        className="md:hidden p-1 -ml-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {/* Avatar */}
      {isGroup ? (
        <div className="relative h-9 w-9 flex-shrink-0">
          {otherUsers[1] && (
            <Avatar className="absolute bottom-0 right-0 h-6 w-6 ring-2 ring-white">
              <AvatarImage src={otherUsers[1].imageUrl} />
              <AvatarFallback className="text-[9px] bg-purple-100 text-purple-700">
                {otherUsers[1].name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <Avatar className="absolute top-0 left-0 h-6 w-6 ring-2 ring-white">
            <AvatarImage src={otherUsers[0]?.imageUrl} />
            <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">
              {otherUsers[0]?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      ) : (
        <div className="relative flex-shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={dmUser?.imageUrl} alt={dmUser?.name} />
            <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
              {dmUser?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
          )}
        </div>
      )}

      {/* Name and subtitle */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{displayName}</h2>
        <p className="text-xs text-gray-400">
          {isGroup ? (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCount} members
            </span>
          ) : isOnline ? (
            <span className="text-green-500 font-medium">Online</span>
          ) : (
            "Offline"
          )}
        </p>
      </div>
    </header>
  );
}