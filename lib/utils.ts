import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — Tailwind class merger.
 * Combines clsx (conditional classes) with tailwind-merge
 * (removes conflicting Tailwind utilities).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatTimestamp — Smart timestamp formatter.
 *
 * mode "time"  → always shows time only:         "2:34 PM"
 * mode "short" → today shows time, else date:    "2:34 PM" or "Feb 15"
 * mode "full"  → full label:                     "Today at 2:34 PM" or "Feb 15, 2:34 PM"
 */
export function formatTimestamp(
  timestamp: number,
  mode: "time" | "short" | "full"
): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const isCurrentYear = date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (mode === "time") {
    return timeStr;
  }

  if (mode === "short") {
    if (isToday) return timeStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(isCurrentYear ? {} : { year: "numeric" }),
    });
  }

  if (mode === "full") {
    if (isToday) return `Today at ${timeStr}`;
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(isCurrentYear ? {} : { year: "numeric" }),
      }) + `, ${timeStr}`
    );
  }

  return timeStr;
}