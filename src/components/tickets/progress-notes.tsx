"use client";

import { useState } from "react";
import type { ProgressNote } from "@/lib/types/ticket";
import { formatShortDate } from "@/lib/ticket-progress";
import { Button } from "@/components/ui/button";

export function ProgressNotes({
  notes,
  canAdd,
  onAdd,
}: {
  notes: ProgressNote[];
  canAdd: boolean;
  onAdd: (content: string) => void;
}) {
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);

  if (!canAdd && notes.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4">
      <h2 className="text-sm font-semibold text-zinc-900">ความคืบหน้า</h2>
      {notes.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-zinc-200/80 bg-white p-3">
              <p className="text-xs text-zinc-500">
                {n.authorName} · {formatShortDate(n.createdAt)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-800">{n.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">ยังไม่มีบันทึกความคืบหน้า</p>
      )}
      {canAdd && (
        <div className="mt-3">
          {open ? (
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="อัปเดตความคืบหน้า เช่น ส่งเครื่องศูนย์ซ่อมแล้ว รอ 3 วัน"
                rows={2}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!content.trim()}
                  onClick={() => {
                    onAdd(content.trim());
                    setContent("");
                    setOpen(false);
                  }}
                >
                  บันทึก
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
              เพิ่มความคืบหน้า
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
