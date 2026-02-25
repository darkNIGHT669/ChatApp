"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

/**
 * hooks/usePresence.ts
 *
 * Two exports:
 *
 * 1. `usePresence()` — called once in the chat layout.
 *    Sets online on mount, offline on unmount, sends heartbeat every 30s.
 *
 * 2. `usePresenceMap()` — used by any component that needs to show online dots.
 *    Returns: { [userId]: boolean }
 *
 * Why separate them?
 * The heartbeat + online/offline lifecycle should run ONCE (in layout).
 * The presence map can be subscribed to by many components — Convex
 * deduplicates the subscription so it's only one WebSocket message.
 *
 * Cleanup on unmount:
 * The useEffect return function fires when the component unmounts.
 * For tab close, we additionally register a `beforeunload` listener.
 * Note: browsers don't guarantee async requests complete on beforeunload,
 * so `setOffline` may not always fire on tab close — hence why we also
 * check lastSeen staleness in the query (60s threshold).
 */
export function usePresence() {
  const { isSignedIn } = useUser();
  const setOnline = useMutation(api.presence.setOnline);
  const setOffline = useMutation(api.presence.setOffline);
  const heartbeat = useMutation(api.presence.heartbeat);

  useEffect(() => {
    if (!isSignedIn) return;

    // Mark online on mount
    setOnline().catch(console.error);

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      heartbeat().catch(console.error);
    }, 30_000);

    // Mark offline on tab close
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliability on page unload
      // Since we can't await mutations here, we fire and hope
      setOffline().catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup: mark offline when component unmounts (route change, etc.)
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setOffline().catch(console.error);
    };
  }, [isSignedIn, setOnline, setOffline, heartbeat]);
}

/**
 * Returns the presence map for all users.
 * This query is reactive — components using this will re-render
 * when anyone comes online or goes offline.
 */
export function usePresenceMap() {
  return useQuery(api.presence.getPresenceMap);
}
