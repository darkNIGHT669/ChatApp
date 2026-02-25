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
}

/**
 * components/chat/MessageList.tsx
 *
 * The scrollable message feed. The most complex component in the app.
 *
 * Smart auto-scroll logic:
 * - If user is at the bottom → auto-scroll when new messages arrive
 * - If user has scrolled up → don't auto-scroll; show "↓ New messages" button
 *
 * How we detect "at bottom":
 * scrollHeight - scrollTop - clientHeight < threshold (20px)
 * If this value is small, the user is near the bottom.
 *
 * Refs we need:
 * - scrollAreaRef: the scrollable container element
 * - bottomRef: an invisible element at the very bottom to scroll into view
 * - isAtBottomRef: tracks scroll position without causing re-renders
 *   (using a ref instead of state avoids the scroll handler causing renders)
 */
export function MessageList({ conversationId }: MessageListProps) {
  const messages = useQuery(api.messages.list, { conversationId });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessageCountRef = useRef(0);

  // Track whether user is at the bottom
  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 60;

    isAtBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
  };

  // Auto-scroll when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (!messages) return;

    const newCount = messages.length;
    const hadNewMessages = newCount > prevMessageCountRef.current;
    prevMessageCountRef.current = newCount;

    if (hadNewMessages && isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (hadNewMessages && !isAtBottomRef.current) {
      // User has scrolled up — show the button instead of forcing scroll
      setShowScrollButton(true);
    }
  }, [messages]);

  // Scroll to bottom initially when conversation loads
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
    isAtBottomRef.current = true;
  }, [conversationId]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  // Loading state
  if (messages === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">
          Loading messages...
        </div>
      </div>
    );
  }

  // Empty state
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
      {/* Scrollable message area */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          // Show date divider when the day changes between messages
          const showDateDivider =
            !prevMessage ||
            !isSameDay(prevMessage.sentAt, message.sentAt);

          return (
            <div key={message._id}>
              {showDateDivider && (
                <DateDivider timestamp={message.sentAt} />
              )}
              <MessageItem message={message} />
            </div>
          );
        })}

        {/* Typing indicator sits above the invisible bottom anchor */}
        <TypingIndicator conversationId={conversationId} />

        {/* Invisible anchor for scrollIntoView */}
        <div ref={bottomRef} />
      </div>

      {/* "↓ New messages" button */}
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

// Helper: are two timestamps on the same calendar day?
function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Date divider between messages from different days
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
