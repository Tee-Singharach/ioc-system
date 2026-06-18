import type { ProgressNote } from "@/lib/types/ticket";
import { formatRelativeTime } from "@/lib/ticket-progress";

export function ProgressNotesList({ notes }: { notes: ProgressNote[] }) {
  if (notes.length === 0) return null;

  return (
    <div className="border-t border-zinc-100 pt-6">
      <h2 className="text-sm font-semibold text-zinc-900">บันทึกความคืบหน้า</h2>
      <ul className="mt-3 space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-zinc-900">{note.authorName}</span>
              <time className="text-xs text-zinc-400">{formatRelativeTime(note.createdAt)}</time>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">{note.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
