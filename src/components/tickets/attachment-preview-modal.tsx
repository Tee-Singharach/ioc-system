"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import type { Attachment } from "@/lib/types/ticket";
import {
  attachmentPreviewKind,
  formatAttachmentSize,
  resolveAttachmentPreviewUrl,
} from "@/lib/attachment-preview";
import { ModalPortal } from "@/components/ui/modal-portal";

interface AttachmentPreviewModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export function AttachmentPreviewModal({ attachment, onClose }: AttachmentPreviewModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!attachment) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [attachment, onClose]);

  if (!attachment) return null;

  const kind = attachmentPreviewKind(attachment.name);
  const url = resolveAttachmentPreviewUrl(attachment);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="ปิด"
        className="absolute inset-0 bg-zinc-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-semibold text-zinc-900">
              {attachment.name}
            </h2>
            <p className="text-xs text-zinc-500">{formatAttachmentSize(attachment.size)}</p>
          </div>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-zinc-50 p-4">
          {kind === "image" && url ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: and mock preview URLs
            <img
              src={url}
              alt={attachment.name}
              className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain"
            />
          ) : kind === "pdf" && url ? (
            <iframe
              src={url}
              title={attachment.name}
              className="h-[70vh] w-full rounded-lg border border-zinc-200 bg-white"
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-white text-center">
              <p className="text-sm font-medium text-zinc-700">
                {url ? "ไม่สามารถแสดงตัวอย่างไฟล์นี้ในเบราว์เซอร์ได้" : "ไม่สามารถแสดงตัวอย่างไฟล์นี้ในระบบได้"}
              </p>
              <p className="text-xs text-zinc-500">รองรับการดูตัวอย่างเฉพาะไฟล์รูปภาพและ PDF</p>
              {url && (
                <a
                  href={url}
                  download={attachment.name}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  ดาวน์โหลดไฟล์
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
