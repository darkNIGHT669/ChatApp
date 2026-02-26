import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getAuthUserOrNull } from "./helpers";

/**
 * messages.ts
 *
 * Updated for file/media sharing:
 *
 * generateUploadUrl — gets a short-lived signed URL from Convex storage.
 *   The client POSTs the file directly to this URL (browser → Convex storage).
 *   This keeps large files off our mutation layer.
 *
 * send — now accepts optional fileId, fileType, fileName.
 *   A message can be: text only, file only, or text + file.
 *
 * getFileUrl — converts a storageId → a public HTTPS URL.
 *   Called per-message when rendering attachments.
 *
 * list — unchanged, file fields come through automatically via spread.
 */

// ─── FILE UPLOAD ─────────────────────────────────────────────────────────────

/**
 * Step 1 of the upload flow.
 * Returns a one-time URL the client uses to POST the file directly.
 * Convex storage handles the actual file bytes — not our server.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthUser(ctx); // must be authenticated
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Converts a Convex storageId to a public URL for display.
 * Returns null if the file doesn't exist.
 */
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUserOrNull(ctx);
    if (!currentUser) return [];

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    if (!membership) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_time", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);

        // Resolve file URL if this message has an attachment
        const fileUrl = message.fileId
          ? await ctx.storage.getUrl(message.fileId)
          : null;

        return {
          ...message,
          sender,
          fileUrl,
          isOwnMessage: message.senderId === currentUser._id,
        };
      })
    );

    return messagesWithSenders;
  },
});

/**
 * Send a message — supports text, file, or both.
 *
 * Validation rules:
 * - Must have either content OR a file (not both empty)
 * - content is stored as empty string "" for file-only messages
 */
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    // Optional file attachment
    fileId: v.optional(v.id("_storage")),
    fileType: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    const hasText = args.content.trim() !== "";
    const hasFile = !!args.fileId;

    if (!hasText && !hasFile) {
      throw new Error("Message must have content or a file");
    }

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId)
      )
      .unique();

    if (!membership) throw new Error("Not a member of this conversation");

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: args.content.trim(),
      isDeleted: false,
      sentAt: now,
      // Only include file fields if present
      ...(args.fileId && {
        fileId: args.fileId,
        fileType: args.fileType,
        fileName: args.fileName,
      }),
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageTime: now,
    });

    await ctx.db.patch(membership._id, {
      lastReadTime: now,
    });

    return messageId;
  },
});

export const softDelete = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== currentUser._id) {
      throw new Error("You can only delete your own messages");
    }

    // Note: we don't delete the file from storage on soft-delete.
    // Files are cheap and deleting could cause broken references
    // if we ever add message editing later.
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "",
    });
  },
});