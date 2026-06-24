import type { TicketFormData, TicketEvaluation, TicketStatus, User } from "@/lib/types/ticket";
import { prisma } from "@/lib/prisma";
import { hasCompleteEvaluation } from "@/lib/ticket-evaluation";
import { approvalNote } from "@/lib/ticket-workflow";
import { canResubmit } from "@/lib/ticket-rules";
import { priorityFromApp, statusFromApp } from "@/lib/db/maps";
import { mapTicket, ticketInclude } from "@/lib/db/ticket-mapper";
import { nextTicketNo } from "@/lib/ticket-number";

async function loadTicket(id: string) {
  const row = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  return row ? mapTicket(row) : undefined;
}

export async function listAllTickets() {
  const rows = await prisma.ticket.findMany({
    include: ticketInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapTicket);
}

export async function createTicket(user: User, data: TicketFormData) {
  const now = new Date();
  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: await nextTicketNo(user.departmentId, now),
      title: data.title.trim(),
      description: data.description.trim(),
      priority: priorityFromApp[data.priority],
      status: "WAITING_ACK",
      departmentId: data.departmentId,
      requesterId: user.id,
      scheduledStartAt: new Date(data.scheduledStartAt),
      scheduledEndAt: new Date(data.scheduledEndAt),
      attachments: {
        create: data.attachmentNames.map((name) => ({ name, size: 0 })),
      },
      statusHistory: {
        create: { status: "WAITING_ACK", at: now },
      },
    },
    include: ticketInclude,
  });
  return mapTicket(ticket);
}

export async function updateTicket(id: string, data: TicketFormData) {
  await prisma.$transaction([
    prisma.ticketAttachment.deleteMany({ where: { ticketId: id } }),
    prisma.ticket.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        priority: priorityFromApp[data.priority],
        departmentId: data.departmentId,
        scheduledStartAt: new Date(data.scheduledStartAt),
        scheduledEndAt: new Date(data.scheduledEndAt),
        attachments: {
          create: data.attachmentNames.map((name) => ({ name, size: 0 })),
        },
      },
    }),
  ]);
  return loadTicket(id);
}

async function appendStatus(id: string, status: TicketStatus, note?: string) {
  const now = new Date();
  await prisma.ticket.update({
    where: { id },
    data: {
      status: statusFromApp[status],
      statusHistory: { create: { status: statusFromApp[status], note, at: now } },
      updatedAt: now,
    },
  });
}

export async function cancelTicket(id: string) {
  await appendStatus(id, "ยกเลิก", "ยกเลิกโดยผู้แจ้ง");
  return loadTicket(id);
}

export async function resubmitTicket(id: string, data: TicketFormData) {
  const existing = await loadTicket(id);
  if (!existing || !canResubmit(existing)) return existing;

  const now = new Date();
  await prisma.$transaction([
    prisma.ticketEvaluation.deleteMany({ where: { ticketId: id } }),
    prisma.ticketAttachment.deleteMany({ where: { ticketId: id } }),
    prisma.ticket.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        priority: priorityFromApp[data.priority],
        departmentId: data.departmentId,
        scheduledStartAt: new Date(data.scheduledStartAt),
        scheduledEndAt: new Date(data.scheduledEndAt),
        status: "WAITING_ACK",
        receivedById: null,
        assigneeId: null,
        attachments: {
          create: data.attachmentNames.map((name) => ({ name, size: 0 })),
        },
        statusHistory: {
          create: {
            status: "WAITING_ACK",
            note: "ส่งคำร้องใหม่หลังถูกปฏิเสธ",
            at: now,
          },
        },
        updatedAt: now,
      },
    }),
  ]);
  return loadTicket(id);
}

export async function receiveTicket(id: string, user: User) {
  const now = new Date();
  const note = `${user.name} รับเรื่องเพื่อตรวจสอบ`;
  await prisma.ticket.update({
    where: { id, status: "WAITING_ACK", receivedById: null },
    data: {
      receivedById: user.id,
      assigneeId: user.id,
      statusHistory: { create: { status: "WAITING_ACK", note, at: now } },
      updatedAt: now,
    },
  });
  return loadTicket(id);
}

export async function saveEvaluation(
  id: string,
  user: User,
  data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">,
) {
  const now = new Date();
  await prisma.ticketEvaluation.upsert({
    where: { ticketId: id },
    create: {
      ticketId: id,
      diagnosis: data.diagnosis,
      estimatedCost: data.estimatedCost ?? null,
      notes: data.notes ?? null,
      evaluatedById: user.id,
      evaluatedAt: now,
    },
    update: {
      diagnosis: data.diagnosis,
      estimatedCost: data.estimatedCost ?? null,
      notes: data.notes ?? null,
      evaluatedById: user.id,
      evaluatedAt: now,
    },
  });
  await prisma.ticket.update({ where: { id }, data: { updatedAt: now } });
  return loadTicket(id);
}

export async function submitForApproval(id: string, user: User) {
  const ticket = await loadTicket(id);
  if (!ticket || ticket.status !== "รอรับเรื่อง" || !ticket.receivedById || !hasCompleteEvaluation(ticket)) {
    return ticket;
  }
  await appendStatus(id, "รออนุมัติ", `${user.name} ส่งเรื่องขออนุมัติ`);
  return loadTicket(id);
}

export async function approveTicket(id: string, user: User) {
  const ticket = await loadTicket(id);
  if (!ticket || ticket.status !== "รออนุมัติ") return ticket;
  await appendStatus(id, "กำลังดำเนินการ", approvalNote(user.name));
  return loadTicket(id);
}

export async function rejectTicket(id: string, user: User, reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) return loadTicket(id);
  const now = new Date();
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id, status: "PENDING_APPROVAL" },
      data: {
        status: "REJECTED",
        statusHistory: {
          create: { status: "REJECTED", note: `${user.name} ปฏิเสธ: ${trimmed}`, at: now },
        },
        updatedAt: now,
      },
    }),
    prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorId: user.id,
        content: trimmed,
      },
    }),
  ]);
  return loadTicket(id);
}

export async function completeTicket(id: string, user: User, summary?: string) {
  const trimmed = summary?.trim();
  const note = trimmed
    ? `${user.name} ส่งมอบ/ปิดงาน: ${trimmed}`
    : `${user.name} ส่งมอบ/ปิดงาน`;
  await prisma.ticket.update({
    where: { id, status: "IN_PROGRESS" },
    data: {
      status: "COMPLETED",
      statusHistory: { create: { status: "COMPLETED", note, at: new Date() } },
    },
  });
  return loadTicket(id);
}

export async function addProgressNote(id: string, user: User, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return loadTicket(id);
  const now = new Date();
  await prisma.$transaction([
    prisma.progressNote.create({
      data: { ticketId: id, authorId: user.id, content: trimmed },
    }),
    prisma.ticket.update({ where: { id, status: "IN_PROGRESS" }, data: { updatedAt: now } }),
  ]);
  return loadTicket(id);
}

export async function assignTicket(id: string, officerId: string) {
  const officer = await prisma.user.findUnique({ where: { id: officerId } });
  if (!officer) return loadTicket(id);
  const now = new Date();
  const note = `มอบหมายให้ ${officer.name}`;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return undefined;
  await prisma.ticket.update({
    where: { id },
    data: {
      assigneeId: officer.id,
      statusHistory: {
        create: { status: ticket.status, note, at: now },
      },
      updatedAt: now,
    },
  });
  return loadTicket(id);
}

export async function addComment(
  ticketId: string,
  user: User,
  content: string,
  attachmentNames?: string[],
) {
  const now = new Date();
  await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: user.id,
      content,
    },
  });
  void attachmentNames;
  await prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: now } });
  return loadTicket(ticketId);
}

export async function updateComment(ticketId: string, user: User, commentId: string, content: string) {
  await prisma.ticketComment.updateMany({
    where: { id: commentId, ticketId, authorId: user.id },
    data: { content, updatedAt: new Date() },
  });
  return loadTicket(ticketId);
}

export async function deleteComment(ticketId: string, user: User, commentId: string) {
  await prisma.ticketComment.deleteMany({
    where: { id: commentId, ticketId, authorId: user.id },
  });
  return loadTicket(ticketId);
}

export async function listDepartments() {
  return prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true },
  });
}

export async function listOfficers() {
  const rows = await prisma.user.findMany({
    where: { role: "officer", deletedAt: null },
    include: { department: true },
    orderBy: { name: "asc" },
  });
  return rows.map((o) => ({
    id: o.id,
    name: o.name,
    username: o.username,
    departmentId: o.departmentId,
    departmentName: o.department.name,
  }));
}

export async function findUserByCredentials(username: string, passwordHashCheck: (hash: string) => boolean) {
  const row = await prisma.user.findFirst({
    where: { username: username.trim().toLowerCase(), deletedAt: null },
    include: { department: true },
  });
  if (!row || !passwordHashCheck(row.passwordHash)) return null;
  return mapUserFromRow(row);
}

function mapUserFromRow(row: {
  id: string;
  username: string;
  name: string;
  role: User["role"];
  departmentId: string;
}) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    departmentId: row.departmentId,
  } satisfies User;
}

export async function listManagedUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      departmentId: true,
      deletedAt: true,
    },
  });
}

export async function listManagedDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true, deletedAt: true },
  });
}

export async function listAuditLogs() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { actor: true },
    take: 100,
  });
}
