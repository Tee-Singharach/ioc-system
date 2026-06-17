"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { canCancel, canEdit, canResubmit } from "@/lib/ticket-rules";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { TicketForm } from "@/components/tickets/ticket-form";
import { Button } from "@/components/ui/button";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StaffTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useMockAuth();
  const { getTicket, updateTicket, cancelTicket, resubmitTicket } = useMockTickets();
  const ticket = getTicket(id);
  const [mode, setMode] = useState<"view" | "edit" | "resubmit">("view");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!ticket || (user && ticket.requesterId !== user.id)) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">ไม่พบคำร้อง</p>
        <Link href="/tickets" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          กลับไปรายการ
        </Link>
      </div>
    );
  }

  const editing = mode === "edit" || mode === "resubmit";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/tickets" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">{ticket.ticketNo}</p>
            <h1 className="mt-1 text-xl font-bold text-zinc-900">{ticket.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">สร้างเมื่อ {formatDateTime(ticket.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {!editing && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-zinc-500">แผนก</p>
                <p className="mt-1 text-sm">{ticket.departmentName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">ผู้รับผิดชอบ</p>
                <p className="mt-1 text-sm">{ticket.assigneeName ?? "—"}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-500">รายละเอียด</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{ticket.description}</p>
            </div>

            {ticket.attachments.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-500">ไฟล์แนบ</p>
                <ul className="mt-2 space-y-1">
                  {ticket.attachments.map((att) => (
                    <li key={att.id} className="flex items-center gap-2 text-sm text-zinc-700">
                      <Paperclip className="h-3.5 w-3.5 text-zinc-400" />
                      {att.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
              {canEdit(ticket) && (
                <Button variant="secondary" onClick={() => setMode("edit")}>
                  แก้ไข
                </Button>
              )}
              {canResubmit(ticket) && (
                <Button onClick={() => setMode("resubmit")}>ส่งคำร้องใหม่</Button>
              )}
              {canCancel(ticket) && !showCancelConfirm && (
                <Button variant="danger" onClick={() => setShowCancelConfirm(true)}>
                  ยกเลิกคำร้อง
                </Button>
              )}
              {showCancelConfirm && (
                <div className="flex w-full items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                  <span className="text-sm text-red-700">ยืนยันยกเลิกคำร้อง?</span>
                  <Button
                    variant="danger"
                    onClick={() => {
                      cancelTicket(ticket.id);
                      setShowCancelConfirm(false);
                    }}
                  >
                    ยืนยัน
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
                    ไม่ยกเลิก
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {editing && (
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <TicketForm
              initialData={{
                title: ticket.title,
                description: ticket.description,
                priority: ticket.priority,
                departmentId: ticket.departmentId,
                attachmentNames: ticket.attachments.map((a) => a.name),
              }}
              submitLabel={mode === "resubmit" ? "ส่งคำร้องใหม่" : "บันทึกการแก้ไข"}
              onSubmit={(data) => {
                if (mode === "resubmit") {
                  resubmitTicket(ticket.id, data);
                } else {
                  updateTicket(ticket.id, data);
                }
                setMode("view");
              }}
              onCancel={() => setMode("view")}
            />
          </div>
        )}
      </div>

      {ticket.progressNotes.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">ความคืบหน้าจากเจ้าหน้าที่</h2>
          <div className="space-y-3">
            {ticket.progressNotes.map((note) => (
              <div key={note.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-800">{note.authorName}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{formatDateTime(note.createdAt)}</p>
                <p className="mt-2 text-sm text-zinc-700">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">ติดตามสถานะ</h2>
        <TicketTimeline history={ticket.statusHistory} />
      </div>
    </div>
  );
}
