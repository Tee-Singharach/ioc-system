"use client";

import { memo, useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import { Paperclip, Pencil, Send, Trash2, X } from "lucide-react";
import type { Attachment, Comment } from "@/lib/types/ticket";
import { AttachmentPreviewModal } from "@/components/tickets/attachment-preview-modal";
import { formatRelativeTime, userInitials } from "@/lib/ticket-progress";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface TicketCommentsProps {
  comments: Comment[];
  currentUserId: string;
  creationNote?: { authorName: string; createdAt: string; content: string };
  readOnly?: boolean;
  onAdd: (content: string, attachments?: Attachment[]) => void;
  onUpdate: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}

function PersonAvatar({ name, tone }: { name: string; tone: "blue" | "amber" }) {
  const colors =
    tone === "blue"
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";
  return (
    <div
      aria-hidden
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colors}`}
    >
      {userInitials(name)}
    </div>
  );
}

const CreationFeedItem = memo(function CreationFeedItem({
  authorName,
  createdAt,
  content,
}: {
  authorName: string;
  createdAt: string;
  content: string;
}) {
  return (
    <li className="flex gap-3">
      <PersonAvatar name={authorName} tone="blue" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-zinc-900">{authorName}</span>
          <time suppressHydrationWarning className="text-xs text-zinc-400">{formatRelativeTime(createdAt)}</time>
        </div>
        <p className="mt-2 rounded-xl bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-700">
          {content}
        </p>
      </div>
    </li>
  );
});

const CommentFeedItem = memo(function CommentFeedItem({
  comment,
  isOwn,
  isEditing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  comment: Comment;
  isOwn: boolean;
  isEditing: boolean;
  editDraft: string;
  onEditDraftChange: (value: string) => void;
  onStartEdit: (comment: Comment) => void;
  onSaveEdit: (commentId: string) => void;
  onCancelEdit: () => void;
  onDelete: (commentId: string) => void;
}) {
  const [previewAtt, setPreviewAtt] = useState<Attachment | null>(null);

  return (
    <li className="flex gap-3">
      <PersonAvatar name={comment.authorName} tone="blue" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-zinc-900">{comment.authorName}</span>
            <time suppressHydrationWarning className="text-xs text-zinc-400">{formatRelativeTime(comment.createdAt)}</time>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-zinc-400">(แก้ไขแล้ว)</span>
            )}
          </div>
          {isOwn && !isEditing && (
            <div className="flex shrink-0 gap-0.5">
              <button
                type="button"
                aria-label="แก้ไขความคิดเห็น"
                onClick={() => onStartEdit(comment)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="ลบความคิดเห็น"
                onClick={() => onDelete(comment.id)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editDraft}
              onChange={(e) => onEditDraftChange(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              rows={3}
            />
            <div className="flex gap-2">
              <Button type="button" onClick={() => onSaveEdit(comment.id)}>
                บันทึก
              </Button>
              <Button type="button" variant="secondary" onClick={onCancelEdit}>
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <>
            {comment.content && (
              <p className="mt-2 rounded-xl bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-700">
                {comment.content}
              </p>
            )}
            {comment.attachments && comment.attachments.length > 0 && (
              <ul
                className={`space-y-1 ${comment.content ? "mt-2 px-1" : "mt-2 rounded-xl bg-zinc-50 px-4 py-3"}`}
              >
                {comment.attachments.map((att) => (
                  <li key={att.id}>
                    <button
                      type="button"
                      onClick={() => setPreviewAtt(att)}
                      className="flex max-w-full items-center gap-1.5 text-sm text-blue-600 hover:underline"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{att.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <AttachmentPreviewModal attachment={previewAtt} onClose={() => setPreviewAtt(null)} />
      </div>
    </li>
  );
});

const MAX_FILE_SIZE_MB = 200;

function CommentComposer({
  onAdd,
}: {
  onAdd: (content: string, attachments?: Attachment[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<{ name: string; size: number; url: string }[]>([]);
  const [error, setError] = useState("");

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`ขนาดไฟล์รวมต้องไม่เกิน ${MAX_FILE_SIZE_MB} MB`);
      return;
    }
    setPendingFiles(
      files.map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) })),
    );
    setError("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content && pendingFiles.length === 0) {
      setError("กรุณากรอกความคิดเห็นหรือแนบไฟล์");
      return;
    }
    const attachments = pendingFiles.length
      ? pendingFiles.map((f, i) => ({
          id: `att-${Date.now()}-${i}`,
          name: f.name,
          size: f.size,
          url: f.url,
        }))
      : undefined;
    onAdd(content, attachments);
    setDraft("");
    setPendingFiles([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50/50 px-2 py-1">
        <button
          type="button"
          aria-label="แนบไฟล์"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
        <label htmlFor="ticket-comment" className="sr-only">
          เขียนความคิดเห็น
        </label>
        <textarea
          id="ticket-comment"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError("");
          }}
          placeholder="เขียนความคิดเห็น..."
          rows={1}
          className="min-h-8 flex-1 resize-none border-0 bg-transparent py-1.5 text-sm outline-none placeholder:text-zinc-400"
        />
        <Button type="submit" aria-label="ส่ง" className="shrink-0 p-2">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {pendingFiles.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {pendingFiles.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
            >
              <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`ลบไฟล์ ${file.name}`}
                onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                className="shrink-0 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}

const CommentFeed = memo(function CommentFeed({
  comments,
  currentUserId,
  creationNote,
  readOnly = false,
  onUpdate,
  onDelete,
}: {
  comments: Comment[];
  currentUserId: string;
  creationNote?: { authorName: string; createdAt: string; content: string };
  readOnly?: boolean;
  onUpdate: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const startEdit = useCallback((comment: Comment) => {
    setEditingId(comment.id);
    setEditDraft(comment.content);
  }, []);

  const saveEdit = useCallback(
    (commentId: string) => {
      const content = editDraft.trim();
      if (!content) return;
      onUpdate(commentId, content);
      setEditingId(null);
      setEditDraft("");
    },
    [editDraft, onUpdate],
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft("");
  }, []);

  const feed = useMemo(
    () =>
      [
        ...(creationNote
          ? [{ kind: "creation" as const, id: "creation", at: creationNote.createdAt, note: creationNote }]
          : []),
        ...comments.map((comment) => ({
          kind: "comment" as const,
          id: comment.id,
          at: comment.createdAt,
          comment,
        })),
      ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [comments, creationNote],
  );

  return (
    <>
      <ul className="mt-5 space-y-5">
        {feed.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            ยังไม่มีคอมเมนต์
          </li>
        ) : (
          feed.map((item) => {
            if (item.kind === "creation") {
              const note = item.note;
              return (
                <CreationFeedItem
                  key={item.id}
                  authorName={note.authorName}
                  createdAt={note.createdAt}
                  content={note.content}
                />
              );
            }

            const comment = item.comment;
            return (
              <CommentFeedItem
                key={comment.id}
                comment={comment}
                isOwn={!readOnly && comment.authorId === currentUserId}
                isEditing={editingId === comment.id}
                editDraft={editingId === comment.id ? editDraft : comment.content}
                onEditDraftChange={setEditDraft}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onDelete={setDeleteId}
              />
            );
          })
        )}
      </ul>

      <ConfirmModal
        open={deleteId !== null}
        title="ลบความคิดเห็น"
        description="ยืนยันลบความคิดเห็นนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={() => {
          if (deleteId) onDelete(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
});

export function TicketComments({
  comments,
  currentUserId,
  creationNote,
  readOnly = false,
  onAdd,
  onUpdate,
  onDelete,
}: TicketCommentsProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900">คอมเมนต์</h2>
      <CommentFeed
        comments={comments}
        currentUserId={currentUserId}
        creationNote={creationNote}
        readOnly={readOnly}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
      {!readOnly && (
        <>
          <div className="mt-5 border-t border-zinc-200" aria-hidden />
          <CommentComposer onAdd={onAdd} />
        </>
      )}
    </div>
  );
}
