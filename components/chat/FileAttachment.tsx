"use client";

import { FileIcon, Download, ImageIcon } from "lucide-react";

interface FileAttachmentProps {
  fileUrl: string;
  fileType: string;
  fileName: string;
  isOwnMessage: boolean;
}

/**
 * components/chat/FileAttachment.tsx
 *
 * Renders differently based on file type:
 *
 * Images (image/*):
 *   → Inline image with max-width, rounded corners, click to open full size
 *
 * Everything else (pdf, zip, docx, etc.):
 *   → A pill with file icon, filename, and download button
 *
 * Why a separate component?
 * MessageItem is already complex. Keeping file rendering isolated
 * makes both easier to read and test.
 */
export function FileAttachment({
  fileUrl,
  fileType,
  fileName,
  isOwnMessage,
}: FileAttachmentProps) {
  const isImage = fileType.startsWith("image/");

  if (isImage) {
    return (
      <div className="mt-1 max-w-xs">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Click to open full size"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={fileName}
            className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer
                       hover:opacity-95 transition-opacity border border-black/5"
            loading="lazy"
          />
        </a>
        <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
          {fileName}
        </p>
      </div>
    );
  }

  // Non-image file — show as a download pill
  const fileExtension = fileName.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className={`
        mt-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl
        border max-w-xs transition-colors group/file
        ${
          isOwnMessage
            ? "bg-blue-400/20 border-blue-300/30 hover:bg-blue-400/30"
            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
        }
      `}
    >
      {/* File type icon */}
      <div
        className={`
          h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0
          ${isOwnMessage ? "bg-blue-400/30" : "bg-gray-200"}
        `}
      >
        <FileIcon
          className={`h-4 w-4 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}
        />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isOwnMessage ? "text-blue-50" : "text-gray-800"
          }`}
        >
          {fileName}
        </p>
        <p
          className={`text-xs ${
            isOwnMessage ? "text-blue-200" : "text-gray-400"
          }`}
        >
          {fileExtension} file
        </p>
      </div>

      {/* Download icon */}
      <Download
        className={`h-4 w-4 flex-shrink-0 opacity-0 group-hover/file:opacity-100
          transition-opacity ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}
      />
    </a>
  );
}