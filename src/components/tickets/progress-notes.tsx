"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { ProgressNote } from "@/lib/types/ticket";
import {
  formatDateTime,
  handoffProgressReason,
  isHandoffProgressNote,
} from "@/lib/ticket-progress";
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
          {notes.map((n) => {
            const handoff = isHandoffProgressNote(n.content);
            return (
              <li
                key={n.id}
                className={
                  handoff
                    ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3"
                    : "rounded-lg border border-zinc-200/80 bg-white p-3"
                }
              >
                {handoff ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    ส่งมอบแล้ว
                  </div>
                ) : null}
                <p className={`text-xs ${handoff ? "mt-1 text-emerald-600/80" : "text-zinc-500"}`}>
                  {n.authorName} · {formatDateTime(n.createdAt)}
                </p>
                <p
                  className={`mt-1 text-sm leading-relaxed ${
                    handoff ? "font-medium text-emerald-900" : "text-zinc-800"
                  }`}
                >
                  {handoff ? handoffProgressReason(n.content) : n.content}
                </p>
              </li>
            );
          })}
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
