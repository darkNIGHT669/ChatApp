"use client";

import { useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * hooks/useTyping.ts
 *
 * Manages the typing indicator lifecycle for the current user.
 *
 * Returns:
 * - `notifyTyping()`: call on each keypress
 * - `clearTyping()`: call on send or when input is cleared
 *
 * Debounce strategy:
 * We don't want to fire a Convex mutation on every single keystroke —
 * that would be hundreds of mutations per minute.
 * Instead, we use a debounce: `notifyTyping` only actually fires the
 * mutation if it hasn't fired in the last DEBOUNCE_MS (300ms).
 *
 * Auto-clear:
 * We set a 2-second timeout after each keypress. If no new keypress
 * arrives, we automatically clear the typing indicator.
 * This handles the case where the user stops typing without sending.
 *
 * Why useRef for the timers?
 * useRef values don't trigger re-renders and persist across renders.
 * Perfect for timer IDs that need cleanup.
 */

const DEBOUNCE_MS = 300;
const AUTO_CLEAR_MS = 2000;

export function useTyping(conversationId: Id<"conversations">) {
  const setTypingMutation = useMutation(api.typing.setTyping);
  const clearTypingMutation = useMutation(api.typing.clearTyping);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false); // Track to avoid redundant clears

  const notifyTyping = useCallback(() => {
    // Clear the auto-clear timer — they're still typing
    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current);
    }

    // Debounce: only fire the mutation if we haven't recently
    if (!debounceTimerRef.current) {
      isTypingRef.current = true;
      setTypingMutation({ conversationId }).catch(console.error);

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
      }, DEBOUNCE_MS);
    }

    // Auto-clear after 2s of inactivity
    autoClearTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        clearTypingMutation({ conversationId }).catch(console.error);
      }
    }, AUTO_CLEAR_MS);
  }, [conversationId, setTypingMutation, clearTypingMutation]);

  const clearTyping = useCallback(async () => {
    // Cancel pending timers
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
    debounceTimerRef.current = null;
    autoClearTimerRef.current = null;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      await clearTypingMutation({ conversationId }).catch(console.error);
    }
  }, [conversationId, clearTypingMutation]);

  return { notifyTyping, clearTyping };
}
