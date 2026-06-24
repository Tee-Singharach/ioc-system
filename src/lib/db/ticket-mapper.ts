import type { Prisma } from "../../../generated/prisma/client";
import type { Ticket, TicketEvaluation } from "@/lib/types/ticket";
import { priorityToApp, statusToApp } from "@/lib/db/maps";

export const ticketInclude = {
  department: true,
  requester: { include: { department: true } },
  receivedBy: true,
  assignee: true,
  evaluation: { include: { evaluatedBy: true } },
  attachments: true,
  comments: { include: { author: true }, orderBy: { createdAt: "asc" as const } },
  progressNotes: { include: { author: true }, orderBy: { createdAt: "asc" as const } },
  statusHistory: { orderBy: { at: "asc" as const } },
} satisfies Prisma.TicketInclude;

export type TicketRow = Prisma.TicketGetPayload<{ include: typeof ticketInclude }>;

export function mapTicket(row: TicketRow): Ticket {
  const evaluation: TicketEvaluation | undefined = row.evaluation
    ? {
        diagnosis: row.evaluation.diagnosis,
        estimatedCost:
          row.evaluation.estimatedCost != null
            ? Number(row.evaluation.estimatedCost)
            : undefined,
        notes: row.evaluation.notes ?? undefined,
        evaluatedAt: row.evaluation.evaluatedAt.toISOString(),
        evaluatedById: row.evaluation.evaluatedById,
        evaluatedByName: row.evaluation.evaluatedBy.name,
      }
    : undefined;

  return {
    id: row.id,
    ticketNo: row.ticketNo,
    title: row.title,
    description: row.description,
    priority: priorityToApp[row.priority],
    status: statusToApp[row.status],
    departmentId: row.departmentId,
    departmentName: row.department.name,
    requesterDepartmentId: row.requester.departmentId,
    requesterDepartmentName: row.requester.department.name,
    requesterId: row.requesterId,
    requesterName: row.requester.name,
    receivedById: row.receivedById ?? undefined,
    receivedByName: row.receivedBy?.name,
    assigneeId: row.assigneeId ?? undefined,
    assigneeName: row.assignee?.name,
    assigneeDepartmentId: row.assignee?.departmentId,
    evaluation,
    attachments: row.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      size: a.size,
      url: a.url ?? undefined,
    })),
    comments: row.comments.map((c) => ({
      id: c.id,
      ticketId: c.ticketId,
      authorId: c.authorId,
      authorName: c.author.name,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    progressNotes: row.progressNotes.map((n) => ({
      id: n.id,
      authorId: n.authorId,
      authorName: n.author.name,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    })),
    statusHistory: row.statusHistory.map((h) => ({
      status: statusToApp[h.status],
      note: h.note ?? undefined,
      at: h.at.toISOString(),
    })),
    scheduledStartAt: row.scheduledStartAt.toISOString(),
    scheduledEndAt: row.scheduledEndAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
