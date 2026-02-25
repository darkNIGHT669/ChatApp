"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTimestamp } from "@/lib/utils";

interface MessageItemProps {
  message: {
    _id: Id<"messages">;
    content: string;
    sentAt: number;
    isDeleted: boolean;
    isOwnMessage: boolean;
    sender: {
      name: string;
      imageUrl: string;
    } | null;
  };
}

/**
 * components/chat/MessageItem.tsx
 *
 * Renders a single message bubble.
 *
 * Layout:
 * - Own messages: right-aligned, blue bubble
 * - Other's messages: left-aligned, gray bubble with avatar
 *
 * Hover shows delete button (only on own messages that aren't deleted).
 *
 * Soft delete display:
 * When isDeleted=true, content is "" — we show a placeholder in italics.
 * This communicates "a message was here" without exposing the content.
 */
export function MessageItem({ message }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const softDelete = useMutation(api.messages.softDelete);

  const handleDelete = async () => {
    try {
      await softDelete({ messageId: message._id });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return (
    <div
      className={`group flex items-end gap-2 my-1 ${
        message.isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (only for other user's messages) */}
      {!message.isOwnMessage && (
        <Avatar className="h-7 w-7 flex-shrink-0 mb-0.5">
          <AvatarImage
            src={message.sender?.imageUrl}
            alt={message.sender?.name}
          />
          <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
            {message.sender?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble + timestamp */}
      <div
        className={`flex flex-col gap-0.5 max-w-[70%] ${
          message.isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            message.isDeleted
              ? "bg-gray-100 text-gray-400 italic"
              : message.isOwnMessage
              ? "bg-blue-500 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-900 rounded-bl-sm"
          }`}
        >
          {message.isDeleted ? "This message was deleted" : message.content}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-400 px-1">
          {formatTimestamp(message.sentAt, "time")}
        </span>
      </div>

      {/* Delete action — only on own, non-deleted messages */}
      {message.isOwnMessage && !message.isDeleted && showActions && (
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1
                     text-gray-400 hover:text-red-500 mb-4"
          title="Delete message"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
