"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TicketAttachmentList } from "@/components/tickets/ticket-attachment-list";
import { canOfficerViewTicket } from "@/lib/officer-access";
import { formatShortDate, isTicketOverdue, userInitials } from "@/lib/ticket-progress";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { OfficerActions, OverdueBadge } from "@/components/tickets/officer-actions";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { TicketComments } from "@/components/tickets/ticket-comments";
import { TicketStepper } from "@/components/tickets/ticket-stepper";
import { Card, CardBody } from "@/components/ui/card";

function PersonField({
  label,
  name,
  tone,
}: {
  label: string;
  name: string;
  tone: "blue" | "amber" | "none";
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {tone !== "none" && name !== "—" && (
          <div
            aria-hidden
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              tone === "blue" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {userInitials(name)}
          </div>
        )}
        <p className="text-sm font-medium text-zinc-900">{name}</p>
      </div>
    </div>
  );
}

export default function OfficerTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useMockAuth();
  const {
    getTicket,
    receiveTicket,
    updateTicketStatus,
    assignTicket,
    addComment,
    updateComment,
    deleteComment,
  } = useMockTickets();
  const ticket = getTicket(id);

  if (!ticket || !user || !canOfficerViewTicket(ticket, user)) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">ไม่พบคำร้อง</p>
        <Link href="/officer/inbox" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          กลับไปรายการ
        </Link>
      </div>
    );
  }

  const responsible = ticket.assigneeName ?? ticket.receivedByName ?? "—";
  const overdue = isTicketOverdue(ticket);

  return (
    <div className="space-y-6">
      <Link
        href="/officer/inbox"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        ย้อนกลับ
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-zinc-600">{ticket.ticketNo}</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {overdue && <OverdueBadge />}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {ticket.title}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_17rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardBody className="space-y-6 p-5 sm:p-6">
              <TicketStepper status={ticket.status} history={ticket.statusHistory} />

              <div className="border-t border-zinc-100 pt-6">
                <h2 className="text-sm font-semibold text-zinc-900">รายละเอียด</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                  {ticket.description}
                </p>
              </div>

              <div className="grid gap-5 border-t border-zinc-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <PersonField label="ผู้ยื่น" name={ticket.requesterName} tone="blue" />
                <PersonField label="ผู้รับผิดชอบ" name={responsible} tone="amber" />
                <PersonField label="ผู้อนุมัติ" name="—" tone="none" />
                <div>
                  <p className="text-xs font-medium text-zinc-500">ฝ่าย</p>
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
                  <p
                    className={`mt-1.5 text-sm font-medium ${overdue ? "text-red-600" : "text-zinc-900"}`}
                  >
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
        </div>

        <OfficerActions
          ticket={ticket}
          currentOfficerId={user.id}
          onReceive={() => receiveTicket(ticket.id)}
          onUpdateStatus={(status) => updateTicketStatus(ticket.id, status)}
          onAssign={(officerId) => assignTicket(ticket.id, officerId)}
        />
      </div>
    </div>
  );
}
