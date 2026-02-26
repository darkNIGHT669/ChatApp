"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { ArrowDown, MessageCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageItem } from "./MessageItem";
import { TypingIndicator } from "./TypingIndicator";

interface MessageListProps {
  conversationId: Id<"conversations">;
  isGroup?: boolean;
}

/**
 * components/chat/MessageList.tsx
 *
 * Updated to:
 * 1. Fetch reactions for the entire conversation in ONE query
 *    (getReactionsForConversation) instead of per-message
 * 2. Pass reactions down to each MessageItem
 * 3. Pass isGroup to MessageItem so it shows sender names in groups
 *
 * Smart auto-scroll logic unchanged.
 */
export function MessageList({ conversationId, isGroup = false }: MessageListProps) {
  const messages = useQuery(api.messages.list, { conversationId });

  // ONE query for all reactions in this conversation
  const reactionsMap = useQuery(api.reactions.getReactionsForConversation, {
    conversationId,
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessageCountRef = useRef(0);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 60;
    isAtBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
  };

  useEffect(() => {
    if (!messages) return;
    const newCount = messages.length;
    const hadNewMessages = newCount > prevMessageCountRef.current;
    prevMessageCountRef.current = newCount;

    if (hadNewMessages && isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (hadNewMessages && !isAtBottomRef.current) {
      setShowScrollButton(true);
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
    isAtBottomRef.current = true;
  }, [conversationId]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  if (messages === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <MessageCircle className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-600">No messages yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Send a message to start the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showDateDivider =
            !prevMessage || !isSameDay(prevMessage.sentAt, message.sentAt);

          // Get reactions for this specific message from the map
          const messageReactions = reactionsMap?.[message._id] ?? [];

          return (
            <div key={message._id}>
              {showDateDivider && <DateDivider timestamp={message.sentAt} />}
              <MessageItem
                message={message}
                reactions={messageReactions}
                showSenderName={isGroup}
              />
            </div>
          );
        })}

        <TypingIndicator conversationId={conversationId} />
        <div ref={bottomRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5
                     bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg
                     hover:bg-blue-600 transition-colors z-10"
        >
          <ArrowDown className="h-3 w-3" />
          New messages
        </button>
      )}
    </div>
  );
}

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function DateDivider({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp);
  const now = new Date();
  const isCurrentYear = date.getFullYear() === now.getFullYear();

  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(isCurrentYear ? {} : { year: "numeric" }),
  });

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}