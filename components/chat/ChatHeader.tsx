"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePresenceMap } from "@/hooks/usePresence";
import { Id } from "@/convex/_generated/dataModel";

/**
 * ChatHeader accepts any object that has at least _id, name, imageUrl.
 * Using a loose interface with [key: string]: unknown allows Convex's
 * full user document (with extra fields like clerkId, email) to be passed
 * without TypeScript complaining about extra properties.
 */
interface OtherUser {
  _id: Id<"users">;
  name: string;
  imageUrl: string;
  [key: string]: unknown;
}

interface ChatHeaderProps {
  conversation: {
    _id: Id<"conversations">;
    otherUsers: OtherUser[];
  };
}

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