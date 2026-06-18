import type { Attachment } from "@/lib/types/ticket";

export type AttachmentPreviewKind = "image" | "pdf" | "unsupported";

export function attachmentPreviewKind(name: string): AttachmentPreviewKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "unsupported";
}

export function formatAttachmentSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ponytail: mock tickets have no stored blobs — fall back to sample files by kind
export function resolveAttachmentPreviewUrl(attachment: Attachment): string | null {
  if (attachment.url) return attachment.url;
  const kind = attachmentPreviewKind(attachment.name);
  if (kind === "image") return "/mock-preview/sample.jpg";
  if (kind === "pdf") return "/mock-preview/sample.pdf";
  return null;
}
