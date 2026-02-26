"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTimestamp } from "@/lib/utils";
import { MessageReactions } from "./MessageReactions";
import { FileAttachment } from "./FileAttachment";

interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageItemProps {
  message: {
    _id: Id<"messages">;
    content: string;
    sentAt: number;
    isDeleted: boolean;
    isOwnMessage: boolean;
    fileUrl?: string | null;
    fileType?: string;
    fileName?: string;
    sender: {
      name: string;
      imageUrl: string;
    } | null;
  };
  reactions: ReactionSummary[];
  showSenderName?: boolean;
}

/**
 * components/chat/MessageItem.tsx
 *
 * Updated to render file attachments.
 *
 * Message layout possibilities:
 * 1. Text only       → bubble with text
 * 2. File only       → FileAttachment (no bubble)
 * 3. Text + file     → bubble with text, then FileAttachment below
 *
 * The bubble is only rendered if there's non-empty text content.
 * This avoids an empty bubble appearing for file-only messages.
 */
export function MessageItem({
  message,
  reactions,
  showSenderName = false,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const softDelete = useMutation(api.messages.softDelete);

  const hasText = message.content.trim() !== "";
  const hasFile = !!message.fileUrl && !!message.fileType && !!message.fileName;

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
      {/* Avatar */}
      {!message.isOwnMessage && (
        <Avatar className="h-7 w-7 flex-shrink-0 mb-0.5">
          <AvatarImage src={message.sender?.imageUrl} alt={message.sender?.name} />
          <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
            {message.sender?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Content column */}
      <div
        className={`flex flex-col gap-1 max-w-[70%] ${
          message.isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        {/* Sender name in groups */}
        {showSenderName && !message.isOwnMessage && message.sender && (
          <span className="text-xs text-gray-400 px-1 font-medium">
            {message.sender.name}
          </span>
        )}

        {/* Deleted state */}
        {message.isDeleted ? (
          <div className="px-3 py-2 rounded-2xl text-sm bg-gray-100 text-gray-400 italic">
            This message was deleted
          </div>
        ) : (
          <>
            {/* Text bubble — only if there's text */}
            {hasText && (
              <div
                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                  message.isOwnMessage
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                {message.content}
              </div>
            )}

            {/* File attachment */}
            {hasFile && (
              <FileAttachment
                fileUrl={message.fileUrl!}
                fileType={message.fileType!}
                fileName={message.fileName!}
                isOwnMessage={message.isOwnMessage}
              />
            )}
          </>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-400 px-1">
          {formatTimestamp(message.sentAt, "time")}
        </span>

        {/* Reactions */}
        {!message.isDeleted && (
          <MessageReactions
            messageId={message._id}
            reactions={reactions}
            isOwnMessage={message.isOwnMessage}
          />
        )}
      </div>

      {/* Delete button */}
      {message.isOwnMessage && !message.isDeleted && showActions && (
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity
                     p-1 text-gray-400 hover:text-red-500 mb-8"
          title="Delete message"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}