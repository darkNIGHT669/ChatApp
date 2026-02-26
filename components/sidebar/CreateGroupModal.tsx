"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { X, Search, Users, Check } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface CreateGroupModalProps {
  onClose: () => void;
}

/**
 * components/sidebar/CreateGroupModal.tsx
 *
 * A modal for creating a group chat.
 *
 * UX flow:
 * 1. User types a group name
 * 2. User searches for people and clicks to select them
 * 3. Selected users appear as chips at the top
 * 4. Click "Create Group" → fires createGroup mutation → navigates to new chat
 *
 * State:
 * - groupName: the text input value
 * - searchQuery: filters the user list
 * - selectedIds: Set of selected user IDs (Set for O(1) lookup)
 *
 * Why a Set for selectedIds?
 * We need fast "is this user selected?" checks on every render.
 * A Set gives us O(1) .has() vs O(n) .includes() on an array.
 * We convert to array only when passing to the mutation.
 */
export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<Id<"users">>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const createGroup = useMutation(api.conversations.createGroup);

  const users = useQuery(
    api.users.listOtherUsers,
    searchQuery.trim() ? { searchQuery } : {}
  );

  const selectedUsers = useQuery(api.users.listOtherUsers, {});

  const toggleUser = (userId: Id<"users">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    setError("");

    if (groupName.trim() === "") {
      setError("Please enter a group name.");
      return;
    }
    if (selectedIds.size < 1) {
      setError("Please select at least 1 other person.");
      return;
    }

    setIsCreating(true);
    try {
      const conversationId = await createGroup({
        name: groupName.trim(),
        memberIds: [...selectedIds],
      });
      onClose();
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      setError("Failed to create group. Please try again.");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // Get selected user profiles for the chips display
  const selectedUserProfiles = (selectedUsers ?? []).filter(
    (u) => u !== null && selectedIds.has(u._id)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">New Group Chat</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
            {/* Group name input */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Project Team, Squad..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-lg border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-colors placeholder:text-gray-400"
                autoFocus
              />
            </div>

            {/* Selected members chips */}
            {selectedIds.size > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Members ({selectedIds.size} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedUserProfiles.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => toggleUser(user._id)}
                      className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs
                                 px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback className="text-[8px]">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {user.name}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User search */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                Add People
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-colors placeholder:text-gray-400"
                />
              </div>

              {/* User list */}
              <div className="border border-gray-100 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {users === undefined && (
                  <div className="px-3 py-8 text-center text-sm text-gray-400">
                    Loading...
                  </div>
                )}
                {users !== undefined && users.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-gray-400">
                    No users found
                  </div>
                )}
                {users?.map((user) => {
                  if (!user) return null;
                  const isSelected = selectedIds.has(user._id);

                  return (
                    <button
                      key={user._id}
                      onClick={() => toggleUser(user._id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left
                        ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user.imageUrl} alt={user.name} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      {/* Checkmark */}
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-300"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              {selectedIds.size === 0
                ? "Select at least 1 person"
                : `${selectedIds.size + 1} people total`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isCreating}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || selectedIds.size < 1 || !groupName.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isCreating ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}