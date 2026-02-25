"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface TypingIndicatorProps {
  conversationId: Id<"conversations">;
}

/**
 * components/chat/TypingIndicator.tsx
 *
 * Shows "Alex is typing..." with an animated pulsing dots animation.
 * Disappears when no one is typing.
 *
 * The query automatically re-runs every time the `typing` table changes,
 * so this updates in real time without any polling.
 *
 * Why render null when empty?
 * We want zero height when no one's typing. The message list's spacing
 * should not shift when the indicator appears/disappears — so we use
 * absolute positioning in the parent rather than flow layout.
 */
export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId });

  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u?.name).filter(Boolean);

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : "Several people are typing";

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      {/* Pulsing dots animation */}
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 italic">{label}</span>
    </div>
  );
}
