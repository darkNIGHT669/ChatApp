import { MessageSquare } from "lucide-react";

/**
 * app/chat/page.tsx
 *
 * Shown on desktop when no conversation is selected.
 * On mobile, the sidebar takes full width, so this is hidden.
 *
 * This is a Server Component (no client-side interactivity needed).
 */
export default function ChatIndexPage() {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <MessageSquare className="h-12 w-12 text-gray-300" />
        </div>
        <h2 className="text-lg font-medium text-gray-700">
          Select a conversation
        </h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Choose an existing conversation from the sidebar, or search for a
          user to start a new one.
        </p>
      </div>
    </div>
  );
}
