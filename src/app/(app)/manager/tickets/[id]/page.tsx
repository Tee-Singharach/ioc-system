"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TicketAttachmentList } from "@/components/tickets/ticket-attachment-list";
import { canManagerViewTicket, getApprovalDecision } from "@/lib/manager-access";
import { canApprove } from "@/lib/manager-rules";
import { formatDateTime, isTicketOverdue, userInitials } from "@/lib/ticket-progress";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { ManagerActions } from "@/components/tickets/manager-actions";
import { OverdueBadge } from "@/components/tickets/officer-actions";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { ProgressNotes } from "@/components/tickets/progress-notes";
import { StatusBadge } from "@/components/tickets/status-badge";
import { StaffWorkflowHint } from "@/components/tickets/staff-workflow-hint";
import { TicketComments } from "@/components/tickets/ticket-comments";
import { TicketStepper } from "@/components/tickets/ticket-stepper";
import { EvaluationCard } from "@/components/tickets/ticket-evaluation";
import { Card, CardBody } from "@/components/ui/card";

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

function approverName(ticket: Parameters<typeof getApprovalDecision>[0]): string {
  const decision = getApprovalDecision(ticket);
  if (decision?.action !== "approved" || !decision.note) return "—";
  const match = decision.note.match(/^(.+?)\s+อนุมัติ/);
  return match?.[1] ?? "—";
}

export default function ManagerTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useMockAuth();
  const { getTicket, approveTicket, rejectTicket, addComment, updateComment, deleteComment } =
    useMockTickets();
  const ticket = getTicket(id);

  if (!ticket || !user || !canManagerViewTicket(ticket, user)) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">ไม่พบคำร้อง</p>
        <Link href="/manager/approvals" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          กลับไปรายการ
        </Link>
      </div>
    );
  }

  const responsible = ticket.assigneeName ?? ticket.receivedByName ?? "—";
  const overdue = isTicketOverdue(ticket);
  const backHref = ticket.status === "รออนุมัติ" ? "/manager/approvals" : "/manager/history";
  const showManagerActions = canApprove(ticket);

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        ย้อนกลับ
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-zinc-600">{ticket.ticketNo}</span>
          <StatusBadge status={ticket.status} receivedById={ticket.receivedById} />
          <PriorityBadge priority={ticket.priority} />
          {overdue && <OverdueBadge />}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {ticket.title}
        </h1>
      </div>

      <div
        className={
          showManagerActions ? "grid gap-6 lg:grid-cols-[1fr_17rem] lg:items-start" : "space-y-6"
        }
      >
        <div className="min-w-0 space-y-6">
          <Card>
            <CardBody className="space-y-6 p-5 sm:p-6">
              <TicketStepper ticket={ticket} />
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
                <PersonField label="ผู้อนุมัติ" name={approverName(ticket)} />
                <div>
                  <p className="text-xs font-medium text-zinc-500">ฝ่าย</p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">{ticket.departmentName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">วันที่สร้าง</p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">
                    {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">เริ่มต้น</p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">
                    {formatDateTime(ticket.scheduledStartAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">สิ้นสุด</p>
                  <p
                    className={`mt-1.5 text-sm font-medium ${overdue ? "text-red-600" : "text-zinc-900"}`}
                  >
                    {formatDateTime(ticket.scheduledEndAt)}
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

        {showManagerActions && (
          <ManagerActions
            ticket={ticket}
            onApprove={() => {
              approveTicket(ticket.id);
              router.push("/manager/history");
            }}
            onReject={(reason) => {
              rejectTicket(ticket.id, reason);
              router.push("/manager/history");
            }}
          />
        )}
      </div>
    </div>
  );
}
