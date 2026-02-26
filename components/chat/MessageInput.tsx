"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { Send, Paperclip, X, FileIcon, ImageIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTyping } from "@/hooks/useTyping";

interface MessageInputProps {
  conversationId: Id<"conversations">;
}

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed types: images + common document/archive types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface SelectedFile {
  file: File;
  preview: string | null; // data URL for images, null for other files
}

/**
 * components/chat/MessageInput.tsx
 *
 * Updated upload flow:
 * 1. User clicks paperclip or pastes an image
 * 2. File is validated (type + size)
 * 3. Preview shows in the input area
 * 4. On send:
 *    a. generateUploadUrl → get signed URL
 *    b. POST file to signed URL → get storageId
 *    c. send mutation with content + storageId + fileType + fileName
 *
 * Why POST directly to Convex storage URL?
 * This bypasses our mutation layer for large binary data.
 * The mutation only receives a small storageId string, not the file bytes.
 */
export function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const { notifyTyping, clearTyping } = useTyping(conversationId);

  // ── File validation ───────────────────────────────────────────────────────

  const validateAndSelectFile = useCallback((file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File type not supported. Try an image, PDF, or document.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    // Generate preview URL for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFile({ file, preview: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile({ file, preview: null });
    }
  }, []);

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelectFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) validateAndSelectFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (e.target.value.trim()) notifyTyping();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const trimmed = content.trim();
    const hasContent = trimmed !== "" || selectedFile !== null;
    if (!hasContent || isUploading) return;

    setIsUploading(true);
    setError(null);

    // Optimistic clear
    const contentToSend = trimmed;
    const fileToUpload = selectedFile;
    setContent("");
    setSelectedFile(null);

    try {
      await clearTyping();

      let fileId: Id<"_storage"> | undefined;
      let fileType: string | undefined;
      let fileName: string | undefined;

      if (fileToUpload) {
        // Step 1: Get a signed upload URL from Convex
        setUploadProgress(10);
        const uploadUrl = await generateUploadUrl();

        // Step 2: POST the file directly to Convex storage
        setUploadProgress(40);
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": fileToUpload.file.type },
          body: fileToUpload.file,
        });

        if (!response.ok) {
          throw new Error("File upload failed");
        }

        // Step 3: Extract the storageId from the response
        setUploadProgress(80);
        const { storageId } = await response.json();
        fileId = storageId;
        fileType = fileToUpload.file.type;
        fileName = fileToUpload.file.name;
      }

      // Step 4: Send the message with optional file info
      setUploadProgress(90);
      await sendMessage({
        conversationId,
        content: contentToSend,
        ...(fileId && { fileId, fileType, fileName }),
      });

      setUploadProgress(100);
    } catch (err) {
      // Restore content on failure
      setContent(contentToSend);
      if (fileToUpload) setSelectedFile(fileToUpload);
      setError("Failed to send. Please try again.");
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const canSend = (content.trim() !== "" || selectedFile !== null) && !isUploading;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white">
      {/* Error message */}
      {error && (
        <div className="mb-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-2">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* File preview area */}
      {selectedFile && (
        <div className="mb-2 relative inline-block">
          {selectedFile.preview ? (
            // Image preview
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedFile.preview}
                alt="Preview"
                className="max-h-32 max-w-xs rounded-xl object-cover border border-gray-200"
              />
              <button
                onClick={clearFile}
                className="absolute -top-2 -right-2 h-5 w-5 bg-gray-800 text-white
                           rounded-full flex items-center justify-center hover:bg-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            // Non-image file preview pill
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 pr-8 relative">
              <FileIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate max-w-[200px]">
                {selectedFile.file.name}
              </span>
              <button
                onClick={clearFile}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="mb-2 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        {/* File picker button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-500
                     hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Text input */}
        <input
          type="text"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            isUploading ? "Uploading..." : "Type a message or paste an image..."
          }
          disabled={isUploading}
          className="flex-1 px-4 py-2.5 text-sm bg-gray-100 rounded-full border-0
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white
                     transition-colors placeholder:text-gray-400 disabled:opacity-50"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 h-9 w-9 flex items-center justify-center
                     bg-blue-500 text-white rounded-full hover:bg-blue-600
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}