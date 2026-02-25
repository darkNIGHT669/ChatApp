"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { Search, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * components/sidebar/UserSearch.tsx
 *
 * Lets the current user search for other users and start a DM.
 *
 * Flow:
 * 1. User types in the search box
 * 2. useQuery reactively filters users from Convex (re-runs on each keystroke)
 * 3. User clicks a result → getOrCreateDM mutation → navigate to conversation
 *
 * Why pass searchQuery to the server query instead of filtering client-side?
 * For small datasets (< few hundred users) client-side filtering is fine.
 * The query already runs on the server with the filter — this scales better
 * and avoids sending all users to the client on every render.
 *
 * The results dropdown is dismissed when:
 * - User clears the search box
 * - User selects a result
 */
export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Only search when there's input — avoids showing all users by default
  const users = useQuery(
    api.users.listOtherUsers,
    searchQuery.trim() ? { searchQuery } : "skip"
  );

  const getOrCreateDM = useMutation(api.conversations.getOrCreateDM);

  const handleSelectUser = async (userId: Id<"users">) => {
    setIsLoading(true);
    try {
      const conversationId = await getOrCreateDM({ otherUserId: userId });
      setSearchQuery(""); // Clear search after selection
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to open conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showResults = searchQuery.trim().length > 0;

  return (
    <div className="px-3 py-2 border-b border-gray-100">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 rounded-lg border-0
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white
                     transition-colors placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {showResults && (
        <div className="mt-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {users === undefined && (
            // Loading state
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              Searching...
            </div>
          )}

          {users !== undefined && users.length === 0 && (
            // Empty state
            <div className="px-3 py-4 text-center text-sm text-gray-400">
              No users found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {users !== undefined &&
            users.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelectUser(user._id)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50
                           transition-colors text-left disabled:opacity-50"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user.imageUrl} alt={user.name} />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
