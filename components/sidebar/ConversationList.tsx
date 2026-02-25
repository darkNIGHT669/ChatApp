"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/utils";
import { usePresenceMap } from "@/hooks/usePresence";

/**
 * components/sidebar/ConversationList.tsx
 *
 * Lists all conversations for the current user.
 * Each item is a link to /chat/[conversationId].
 * Active item is highlighted.
 */
export function ConversationList() {
  const conversations = useQuery(api.conversations.listMyConversations);

  if (conversations === undefined) {
    // Loading skeleton
    return (
      <div className="px-2 py-2 space-y-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Search for a user above to start chatting
        </p>
      </div>
    );
  }

  return (
    <nav className="px-2 py-2 space-y-0.5">
      {conversations.map((conversation) => (
        <ConversationItem key={conversation._id} conversation={conversation} />
      ))}
    </nav>
  );
}

/**
 * Single conversation row in the sidebar.
 *
 * Displays:
 * - Other user's avatar with online indicator dot
 * - Other user's name
 * - Last message preview (truncated)
 * - Timestamp of last message
 * - Unread count badge
 */
function ConversationItem({
  conversation,
}: {
  conversation: NonNullable<
    ReturnType<typeof useQuery<typeof api.conversations.listMyConversations>>
  >[number];
}) {
  const params = useParams();
  const isActive = params?.conversationId === conversation._id;
  const presenceMap = usePresenceMap();

  // For DMs, there's exactly one other user
  const otherUser = conversation.otherUsers[0];

  if (!otherUser) return null;

  const isOnline = presenceMap?.[otherUser._id] ?? false;

  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.isDeleted
      ? "This message was deleted"
      : conversation.lastMessage.content
    : "No messages yet";

  return (
    <Link
      href={`/chat/${conversation._id}`}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
        ${isActive
          ? "bg-blue-50 text-blue-900"
          : "hover:bg-gray-50 text-gray-700"
        }
      `}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.imageUrl} alt={otherUser.name} />
          <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
            {otherUser.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Online dot */}
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
        )}
      </div>

      {/* Name, preview, timestamp */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{otherUser.name}</span>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTimestamp(conversation.lastMessage.sentAt, "short")}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate ${
              isActive ? "text-blue-600" : "text-gray-400"
            } ${conversation.lastMessage?.isDeleted ? "italic" : ""}`}
          >
            {lastMessagePreview}
          </p>
          {/* Unread badge */}
          {conversation.unreadCount > 0 && (
            <Badge
              className="h-4 min-w-4 px-1 text-xs bg-blue-500 hover:bg-blue-500 flex-shrink-0"
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
