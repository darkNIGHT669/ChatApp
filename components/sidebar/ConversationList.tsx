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

export function ConversationList() {
  const rawConversations = useQuery(api.conversations.listMyConversations);

  if (rawConversations === undefined) {
    return (
      <div className="px-2 py-2 space-y-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const conversations = rawConversations.filter(
    (c): c is NonNullable<typeof c> => c !== null
  );

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Search for a user or create a group to start chatting
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

type ConversationItem = NonNullable<
  ReturnType<typeof useQuery<typeof api.conversations.listMyConversations>>
>[number];

function ConversationItem({
  conversation,
}: {
  conversation: NonNullable<ConversationItem>;
}) {
  const params = useParams();
  const isActive = params?.conversationId === conversation._id;
  const presenceMap = usePresenceMap();

  const otherUsers = (conversation.otherUsers ?? []).filter(
    (u): u is NonNullable<typeof u> => u !== null
  );

  const isGroup = conversation.isGroup;

  // For DMs: show the other user's online status
  const dmUser = !isGroup ? otherUsers[0] : null;
  const isOnline = dmUser ? (presenceMap?.[dmUser._id] ?? false) : false;

  // Display name: group name or DM user name
  const displayName = isGroup
    ? (conversation.name ?? "Group Chat")
    : (dmUser?.name ?? "Unknown");

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
        ${isActive ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50 text-gray-700"}
      `}
    >
      {/* Avatar: group shows stacked avatars, DM shows single */}
      <div className="relative flex-shrink-0">
        {isGroup ? (
          <GroupAvatar users={otherUsers} />
        ) : (
          <>
            <Avatar className="h-10 w-10">
              <AvatarImage src={dmUser?.imageUrl} alt={dmUser?.name} />
              <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                {dmUser?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
            )}
          </>
        )}
      </div>

      {/* Name, preview, timestamp */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{displayName}</span>
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
            {isGroup && (
              <span className="text-gray-500">
                {conversation.memberCount} members ·{" "}
              </span>
            )}
            {lastMessagePreview}
          </p>
          {conversation.unreadCount > 0 && (
            <Badge className="h-4 min-w-4 px-1 text-xs bg-blue-500 hover:bg-blue-500 flex-shrink-0">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * GroupAvatar — shows up to 2 overlapping avatars for a group chat.
 * Gives an immediate visual cue that it's a group, not a DM.
 */
function GroupAvatar({
  users,
}: {
  users: Array<{ name: string; imageUrl: string }>;
}) {
  const first = users[0];
  const second = users[1];

  return (
    <div className="relative h-10 w-10">
      {/* Back avatar (second member) */}
      {second && (
        <Avatar className="absolute bottom-0 right-0 h-7 w-7 ring-2 ring-white">
          <AvatarImage src={second.imageUrl} alt={second.name} />
          <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700">
            {second.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {/* Front avatar (first member) */}
      <Avatar className="absolute top-0 left-0 h-7 w-7 ring-2 ring-white">
        <AvatarImage src={first?.imageUrl} alt={first?.name} />
        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
          {first?.name?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}