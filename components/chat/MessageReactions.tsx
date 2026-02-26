"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: Id<"messages">;
  reactions: ReactionSummary[];
  isOwnMessage: boolean;
}

/**
 * components/chat/MessageReactions.tsx
 *
 * Two parts in one component:
 *
 * 1. ReactionPicker — the row of 5 emoji buttons that appears on hover.
 *    Positioned above the message bubble (opposite side from sender).
 *
 * 2. ReactionDisplay — the existing reaction counts shown below the bubble.
 *    Each pill is also clickable to toggle that reaction.
 *
 * State: `showPicker` controls the emoji picker visibility.
 * The picker auto-hides after selecting an emoji.
 *
 * Why pass reactions as a prop instead of querying inside?
 * The parent (MessageItem) already has all reactions via the
 * getReactionsForConversation query — one query for all messages.
 * Querying per-message would cause N queries for N messages.
 */
export function MessageReactions({
  messageId,
  reactions,
  isOwnMessage,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  const handleReact = async (emoji: string) => {
    setShowPicker(false);
    try {
      await toggleReaction({ messageId, emoji });
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"}`}>
      {/* Emoji picker — shown on hover via parent's group-hover */}
      {showPicker && (
        <div
          className={`flex items-center gap-0.5 bg-white border border-gray-200
                      rounded-full px-2 py-1 shadow-lg z-10
                      ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="text-lg hover:scale-125 transition-transform p-0.5 rounded-full
                         hover:bg-gray-100"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Reaction trigger button — the "+" that appears on hover */}
      <button
        onClick={() => setShowPicker((v) => !v)}
        className={`
          opacity-0 group-hover:opacity-100 transition-opacity
          text-xs text-gray-400 hover:text-gray-600
          bg-white border border-gray-200 rounded-full px-2 py-0.5
          hover:bg-gray-50 shadow-sm
          ${showPicker ? "opacity-100" : ""}
        `}
      >
        😊 +
      </button>

      {/* Existing reactions display */}
      {reactions.length > 0 && (
        <div className={`flex flex-wrap gap-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
          {reactions.map(({ emoji, count, hasReacted }) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`
                flex items-center gap-1 text-xs px-2 py-0.5 rounded-full
                border transition-all
                ${
                  hasReacted
                    ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }
              `}
              title={hasReacted ? `Remove ${emoji}` : `React with ${emoji}`}
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}