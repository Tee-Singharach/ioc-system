"use client";

import { useState } from "react";
import { Eye, Paperclip } from "lucide-react";
import type { Attachment } from "@/lib/types/ticket";
import { formatAttachmentSize, resolveAttachmentPreviewUrl } from "@/lib/attachment-preview";
import { AttachmentPreviewModal } from "@/components/tickets/attachment-preview-modal";

interface TicketAttachmentListProps {
  attachments: Attachment[];
  compact?: boolean;
}

export function TicketAttachmentList({ attachments, compact = false }: TicketAttachmentListProps) {
  const [preview, setPreview] = useState<Attachment | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <ul className={compact ? "space-y-1.5" : "space-y-2"}>
        {attachments.map((att) => {
          const canPreview = resolveAttachmentPreviewUrl(att) !== null;
          return (
            <li key={att.id}>
              <button
                type="button"
                onClick={() => setPreview(att)}
                className={`group flex w-full items-center gap-2 rounded-lg text-left transition-colors ${
                  compact
                    ? "py-0.5 text-sm text-blue-600 hover:underline"
                    : "rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50/50"
                } cursor-pointer`}
              >
                <Paperclip
                  className={`shrink-0 text-blue-600 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{att.name}</span>
                {!compact && (
                  <span className="shrink-0 text-xs text-zinc-400">
                    {formatAttachmentSize(att.size)}
                  </span>
                )}
                {canPreview && (
                  <Eye
                    className={`shrink-0 text-zinc-400 group-hover:text-blue-600 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
                    aria-hidden
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <AttachmentPreviewModal attachment={preview} onClose={() => setPreview(null)} />
    </>
  );
}
