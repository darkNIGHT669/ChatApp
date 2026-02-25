"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { Send } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTyping } from "@/hooks/useTyping";

interface MessageInputProps {
  conversationId: Id<"conversations">;
}

/**
 * components/chat/MessageInput.tsx
 *
 * The text input + send button at the bottom of the chat.
 *
 * Key behaviors:
 * - Enter to send (Shift+Enter for newline — though textarea isn't multiline here)
 * - Calls `setTyping` on every keystroke via the useTyping hook
 * - Calls `clearTyping` on send
 * - Optimistic UI: input clears immediately on send; error is logged if mutation fails
 * - Disabled state while sending to prevent double-sends
 */
export function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendMessage = useMutation(api.messages.send);
  const { notifyTyping, clearTyping } = useTyping(conversationId);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent form submit / newline
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    // Notify others that we're typing (debounced inside the hook)
    if (e.target.value.trim()) {
      notifyTyping();
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    // Optimistic clear: remove text immediately for snappy UX
    setContent("");
    setIsSending(true);

    try {
      await clearTyping(); // Stop showing "typing..." indicator
      await sendMessage({ conversationId, content: trimmed });
    } catch (error) {
      // Restore content on failure so user doesn't lose their message
      setContent(trimmed);
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1 px-4 py-2.5 text-sm bg-gray-100 rounded-full border-0
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white
                     transition-colors placeholder:text-gray-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          className="flex-shrink-0 h-9 w-9 flex items-center justify-center
                     bg-blue-500 text-white rounded-full
                     hover:bg-blue-600 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
