"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Pencil, XCircle } from "lucide-react";
import { TicketAttachmentList } from "@/components/tickets/ticket-attachment-list";
import { canCancel, canEdit } from "@/lib/ticket-rules";
import { formatShortDate, userInitials } from "@/lib/ticket-progress";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { TicketStepper } from "@/components/tickets/ticket-stepper";
import { EvaluationCard } from "@/components/tickets/ticket-evaluation";
import { StaffResubmitPanel } from "@/components/tickets/staff-resubmit-panel";
import { StaffWorkflowHint } from "@/components/tickets/staff-workflow-hint";
import { ProgressNotes } from "@/components/tickets/progress-notes";
import { TicketComments } from "@/components/tickets/ticket-comments";
import { TicketForm } from "@/components/tickets/ticket-form";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Card, CardBody } from "@/components/ui/card";

type DialogType = "edit" | "resubmit" | "cancel" | null;

function PersonField({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {name !== "—" && (
          <div
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600"
          >
            {userInitials(name)}
          </div>
        )}
        <p className="text-sm font-medium text-zinc-900">{name}</p>
      </div>
    </div>
  );
}

export default function StaffTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useMockAuth();
  const { getTicket, updateTicket, cancelTicket, resubmitTicket, addComment, updateComment, deleteComment } =
    useMockTickets();
  const ticket = getTicket(id);
  const [mode, setMode] = useState<"view" | "edit" | "resubmit">("view");
  const [dialog, setDialog] = useState<DialogType>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
  const showActionsMenu = !editing && (canEdit(ticket) || canCancel(ticket));
  const responsible = ticket.assigneeName ?? ticket.receivedByName ?? "—";

  return (
    <div className="space-y-6">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        ย้อนกลับ
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-zinc-600">{ticket.ticketNo}</span>
            <StatusBadge status={ticket.status} receivedById={ticket.receivedById} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {ticket.title}
          </h1>
        </div>
        {showActionsMenu && (
          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="เมนูเพิ่มเติม"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <MoreVertical className="h-5 w-5" aria-hidden />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="ปิดเมนู"
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                >
                  {canEdit(ticket) && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setDialog("edit");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      <Pencil className="h-4 w-4 text-zinc-400" aria-hidden />
                      แก้ไขคำร้อง
                    </button>
                  )}
                  {canCancel(ticket) && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setDialog("cancel");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" aria-hidden />
                      ยกเลิกคำร้อง
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!editing ? (
        <>
          <Card>
            <CardBody className="space-y-6 p-5 sm:p-6">
              <TicketStepper ticket={ticket} />
              <StaffResubmitPanel ticket={ticket} onResubmit={() => setDialog("resubmit")} />
              <StaffWorkflowHint ticket={ticket} />
              {ticket.evaluation && <EvaluationCard evaluation={ticket.evaluation} />}

              {ticket.description.trim() && (
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">รายละเอียด</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                    {ticket.description}
                  </p>
                </div>
              )}

              <div className="grid gap-5 border-t border-zinc-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <PersonField label="ผู้ยื่น" name={ticket.requesterName} />
                <PersonField label="ผู้รับผิดชอบ" name={responsible} />
                <PersonField label="ผู้อนุมัติ" name="—" />
                <div>
                  <p className="text-xs font-medium text-zinc-500">ฝ่ายรับผิดชอบ</p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">{ticket.departmentName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">วันที่สร้าง</p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">
                    {formatShortDate(ticket.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">วันกำหนด</p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">
                    {formatShortDate(ticket.scheduledEndAt)}
                  </p>
                </div>
              </div>

              {ticket.attachments.length > 0 && (
                <div className="border-t border-zinc-100 pt-6">
                  <h2 className="text-sm font-semibold text-zinc-900">ไฟล์แนบ</h2>
                  <div className="mt-3">
                    <TicketAttachmentList attachments={ticket.attachments} />
                  </div>
                </div>
              )}

            </CardBody>
          </Card>

          {ticket.progressNotes.length > 0 && (
            <Card>
              <CardBody className="p-5 sm:p-6">
                <ProgressNotes notes={ticket.progressNotes} canAdd={false} onAdd={() => {}} />
              </CardBody>
            </Card>
          )}

          {user && (
            <Card>
              <CardBody className="p-5 sm:p-6">
                <TicketComments
                  comments={ticket.comments}
                  currentUserId={user.id}
                  creationNote={{
                    authorName: ticket.requesterName,
                    createdAt: ticket.createdAt,
                    content: "สร้างคำร้องและส่งเข้าระบบ",
                  }}
                  onAdd={(content, attachments) => addComment(ticket.id, content, attachments)}
                  onUpdate={(commentId, content) => updateComment(ticket.id, commentId, content)}
                  onDelete={(commentId) => deleteComment(ticket.id, commentId)}
                />
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <TicketForm
          header={{
            title: mode === "resubmit" ? "ส่งคำร้องใหม่" : "แก้ไขคำร้อง",
            description: "แก้ไขได้ก่อนมีผู้รับเรื่อง",
          }}
          initialData={{
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            departmentId: ticket.departmentId,
            scheduledStartAt: ticket.scheduledStartAt,
            scheduledEndAt: ticket.scheduledEndAt,
          }}
          initialAttachments={ticket.attachments}
          submitLabel={mode === "resubmit" ? "ส่งคำร้องใหม่" : "บันทึกการแก้ไข"}
          onSubmit={async (data) => {
            if (mode === "resubmit") resubmitTicket(ticket.id, data);
            else updateTicket(ticket.id, data);
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      )}

      <ConfirmModal
        open={dialog === "edit"}
        title="แก้ไขคำร้อง"
        description="ต้องการแก้ไขข้อมูลคำร้องนี้หรือไม่? การแก้ไขได้เฉพาะก่อนมีเจ้าหน้าที่รับเรื่อง"
        confirmLabel="แก้ไข"
        onConfirm={() => {
          setDialog(null);
          setMode("edit");
        }}
        onCancel={() => setDialog(null)}
      />

      <ConfirmModal
        open={dialog === "resubmit"}
        title="ส่งคำร้องใหม่"
        description="ต้องการส่งคำร้องนี้เข้าระบบอีกครั้งหรือไม่? คุณสามารถปรับข้อมูลก่อนส่งได้"
        confirmLabel="ดำเนินการต่อ"
        onConfirm={() => {
          setDialog(null);
          setMode("resubmit");
        }}
        onCancel={() => setDialog(null)}
      />

      <ConfirmModal
        open={dialog === "cancel"}
        title="ยกเลิกคำร้อง"
        description="ยืนยันยกเลิกคำร้องนี้หรือไม่? เมื่อยกเลิกแล้วจะไม่สามารถดำเนินการต่อได้"
        confirmLabel="ยืนยันยกเลิก"
        cancelLabel="ไม่ยกเลิก"
        variant="danger"
        onConfirm={() => {
          cancelTicket(ticket.id);
          setDialog(null);
        }}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
