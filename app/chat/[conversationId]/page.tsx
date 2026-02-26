"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as Id<"conversations">;
  const markAsRead = useMutation(api.conversations.markAsRead);

  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    markAsRead({ conversationId }).catch(console.error);
  }, [conversationId, markAsRead]);

  if (conversation === undefined) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-16 border-b border-gray-200 animate-pulse bg-gray-50" />
        <div className="flex-1 animate-pulse bg-gray-50" />
        <div className="h-20 border-t border-gray-200 animate-pulse bg-gray-50" />
      </div>
    );
  }

  if (conversation === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-400 text-sm">Conversation not found.</p>
      </div>
    );
  }

  const otherUsers = conversation.otherUsers.flatMap((u) =>
    u !== null && u !== undefined ? [u] : []
  );

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        conversationId={conversation._id}
        isGroup={conversation.isGroup}
        groupName={conversation.name}
        otherUsers={otherUsers}
        memberCount={conversation.memberCount}
      />
      <MessageList
        conversationId={conversationId}
        isGroup={conversation.isGroup}
      />
      <MessageInput conversationId={conversationId} />
    </div>
  );
}