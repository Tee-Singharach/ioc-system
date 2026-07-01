import type { TicketFormData, TicketEvaluation, TicketStatus, User } from "@/lib/types/ticket";
import { prisma } from "@/lib/prisma";
import { hasCompleteEvaluation } from "@/lib/ticket-evaluation";
import { approvalNote } from "@/lib/ticket-workflow";
import { canResubmit } from "@/lib/ticket-rules";
import { priorityFromApp, statusFromApp } from "@/lib/db/maps";
import { mapTicket, ticketInclude } from "@/lib/db/ticket-mapper";
import { nextTicketNo } from "@/lib/ticket-number";
import { saveUploadBatch } from "@/lib/storage/save-upload";
import { writeAuditLog } from "@/lib/db/audit-log";
import {
  managersInDept,
  notifyUsers,
  officersInDept,
  ticketStakeholderIds,
} from "@/lib/db/notification-service";
import { handoffProgressContent } from "@/lib/ticket-progress";
import { emitSyncToUsers } from "@/lib/realtime/emit";

async function loadTicket(id: string) {
  const row = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  return row ? mapTicket(row) : undefined;
}

async function syncTicketViewers(ticketId: string, excludeUserId?: string) {
  const ticket = await loadTicket(ticketId);
  if (!ticket) return;
  const officerIds = await officersInDept(ticket.departmentId);
  const userIds = [...new Set([...ticketStakeholderIds(ticket), ...officerIds])].filter(
    (id) => id !== excludeUserId,
  );
  emitSyncToUsers(userIds, ticketId);
}

async function notifyStakeholdersAndOfficers(
  ticket: { id: string; ticketNo: string; title: string; departmentId: string; requesterId: string; receivedById?: string; assigneeId?: string },
  kind: "ticket_updated" | "cancelled",
  user: User,
) {
  const officerIds = await officersInDept(ticket.departmentId);
  const userIds = [...new Set([...ticketStakeholderIds(ticket), ...officerIds])];
  await notifyUsers(
    userIds,
    {
      kind,
      actorName: user.name,
      ticketNo: ticket.ticketNo,
      ticketTitle: ticket.title,
      ticketId: ticket.id,
    },
    { excludeUserId: user.id },
  );
}

async function auditTicket(actorId: string, action: string, ticketId: string, detail?: string) {
  const row = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { ticketNo: true },
  });
  await writeAuditLog(actorId, action, row?.ticketNo ?? ticketId, detail);
}

export async function listAllTickets() {
  const rows = await prisma.ticket.findMany({
    include: ticketInclude,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapTicket);
}

export async function createTicket(user: User, data: TicketFormData) {
  const now = new Date();
  const saved = data.attachmentUploads?.length ? await saveUploadBatch(data.attachmentUploads) : [];
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
        create: saved.length
          ? saved.map((s) => ({ name: s.name, size: s.size, url: s.url }))
          : data.attachmentNames.map((name) => ({ name, size: 0 })),
      },
      statusHistory: {
        create: { status: "WAITING_ACK", at: now },
      },
    },
    include: ticketInclude,
  });
  const mapped = mapTicket(ticket);
  await writeAuditLog(user.id, "สร้างคำร้อง", mapped.ticketNo, mapped.title);
  const officerIds = await officersInDept(data.departmentId);
  await notifyUsers(
    officerIds,
    {
      kind: "new_ticket",
      actorName: user.name,
      ticketNo: mapped.ticketNo,
      ticketTitle: mapped.title,
      ticketId: mapped.id,
    },
    { excludeUserId: user.id },
  );
  return mapped;
}

export async function updateTicket(id: string, user: User, data: TicketFormData) {
  const before = await prisma.ticket.findUnique({ where: { id }, select: { departmentId: true } });
  const saved = data.attachmentUploads?.length ? await saveUploadBatch(data.attachmentUploads) : [];
  const attachmentChanged =
    data.keptAttachmentIds !== undefined || (data.attachmentUploads?.length ?? 0) > 0;

  if (attachmentChanged) {
    const keptIds = data.keptAttachmentIds ?? [];
    await prisma.ticketAttachment.deleteMany({
      where: { ticketId: id, id: { notIn: keptIds } },
    });
    if (saved.length) {
      await prisma.ticketAttachment.createMany({
        data: saved.map((s) => ({
          ticketId: id,
          name: s.name,
          size: s.size,
          url: s.url,
        })),
      });
    }
  }

  await prisma.ticket.update({
    where: { id },
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      priority: priorityFromApp[data.priority],
      departmentId: data.departmentId,
      scheduledStartAt: new Date(data.scheduledStartAt),
      scheduledEndAt: new Date(data.scheduledEndAt),
    },
  });
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(user.id, "แก้ไขคำร้อง", id, ticket.title);
    if (before && before.departmentId !== ticket.departmentId) {
      const officerIds = await officersInDept(ticket.departmentId);
      await notifyUsers(
        officerIds,
        {
          kind: "new_ticket",
          actorName: user.name,
          ticketNo: ticket.ticketNo,
          ticketTitle: ticket.title,
          ticketId: ticket.id,
        },
        { excludeUserId: user.id },
      );
    } else {
      await notifyStakeholdersAndOfficers(ticket, "ticket_updated", user);
    }
    await syncTicketViewers(id, user.id);
  }
  return ticket;
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

export async function cancelTicket(id: string, user: User) {
  await appendStatus(id, "ยกเลิก", "ยกเลิกโดยผู้แจ้ง");
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(user.id, "ยกเลิกคำร้อง", id);
    await notifyStakeholdersAndOfficers(ticket, "cancelled", user);
    await syncTicketViewers(id, user.id);
  }
  return ticket;
}

export async function resubmitTicket(id: string, user: User, data: TicketFormData) {
  const existing = await loadTicket(id);
  if (!existing || !canResubmit(existing)) return existing;

  const now = new Date();
  const keptRows = await prisma.ticketAttachment.findMany({
    where: { ticketId: id, id: { in: data.keptAttachmentIds ?? [] } },
  });
  const saved = data.attachmentUploads?.length ? await saveUploadBatch(data.attachmentUploads) : [];
  const attachmentCreates = [
    ...keptRows.map((r) => ({ name: r.name, size: r.size, url: r.url })),
    ...saved.map((s) => ({ name: s.name, size: s.size, url: s.url })),
  ];
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
          create: attachmentCreates.length
            ? attachmentCreates
            : data.attachmentNames.map((name) => ({ name, size: 0 })),
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
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(user.id, "ส่งคำร้องใหม่", id, "หลังถูกปฏิเสธ");
    const officerIds = await officersInDept(ticket.departmentId);
    await notifyUsers(
      officerIds,
      {
        kind: "resubmit",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
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
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(user.id, "รับเรื่อง", id);
    await notifyUsers(
      [ticket.requesterId],
      {
        kind: "received",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
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
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(user.id, "บันทึกผลประเมิน", id, data.diagnosis.slice(0, 120));
    await notifyUsers(
      [ticket.requesterId],
      {
        kind: "evaluation",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
}

export async function submitForApproval(id: string, user: User) {
  const ticket = await loadTicket(id);
  if (!ticket || ticket.status !== "รอรับเรื่อง" || !ticket.receivedById || !hasCompleteEvaluation(ticket)) {
    return ticket;
  }
  await appendStatus(id, "รออนุมัติ", `${user.name} ส่งเรื่องขออนุมัติ`);
  const updated = await loadTicket(id);
  if (updated) {
    await auditTicket(user.id, "ส่งขออนุมัติ", id);
    const managerIds = await managersInDept(updated.departmentId);
    await notifyUsers(
      managerIds,
      {
        kind: "approval_pending",
        actorName: user.name,
        ticketNo: updated.ticketNo,
        ticketTitle: updated.title,
        ticketId: updated.id,
      },
      { excludeUserId: user.id },
    );
  }
  return updated;
}

export async function approveTicket(id: string, user: User) {
  const ticket = await loadTicket(id);
  if (!ticket || ticket.status !== "รออนุมัติ") return ticket;
  await appendStatus(id, "กำลังดำเนินการ", approvalNote(user.name));
  const updated = await loadTicket(id);
  if (updated) {
    await auditTicket(user.id, "อนุมัติคำร้อง", id);
    const recipients = [updated.requesterId, updated.receivedById].filter(
      (x): x is string => !!x,
    );
    await notifyUsers(
      recipients,
      {
        kind: "approved",
        actorName: user.name,
        ticketNo: updated.ticketNo,
        ticketTitle: updated.title,
        ticketId: updated.id,
      },
      { excludeUserId: user.id },
    );
  }
  return updated;
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
        content: `ปฏิเสธคำร้อง — เหตุผล: ${trimmed}`,
      },
    }),
  ]);
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(user.id, "ปฏิเสธคำร้อง", id, trimmed);
    const recipients = [ticket.requesterId, ticket.receivedById].filter(
      (x): x is string => !!x,
    );
    await notifyUsers(
      recipients,
      {
        kind: "rejected",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
}

export async function completeTicket(id: string, user: User, summary?: string) {
  const trimmed = summary?.trim();
  if (!trimmed) return loadTicket(id);

  const now = new Date();
  const note = `${user.name} ส่งมอบ/ปิดงาน: ${trimmed}`;
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id, status: "IN_PROGRESS" },
      data: {
        status: "COMPLETED",
        statusHistory: { create: { status: "COMPLETED", note, at: now } },
        updatedAt: now,
      },
    }),
    prisma.progressNote.create({
      data: {
        ticketId: id,
        authorId: user.id,
        content: handoffProgressContent(trimmed),
        createdAt: now,
      },
    }),
  ]);
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(user.id, "ปิดงาน", id, trimmed);
    await notifyUsers(
      [ticket.requesterId],
      {
        kind: "completed",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
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
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(user.id, "บันทึกความคืบหน้า", id, trimmed.slice(0, 120));
    await notifyUsers(
      ticketStakeholderIds(ticket),
      {
        kind: "progress_note",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
}

export async function assignTicket(id: string, actor: User, officerId: string) {
  const officer = await prisma.user.findUnique({ where: { id: officerId } });
  if (!officer) return loadTicket(id);
  const now = new Date();
  const note = `มอบหมายให้ ${officer.name}`;
  const row = await prisma.ticket.findUnique({ where: { id } });
  if (!row) return undefined;
  await prisma.ticket.update({
    where: { id },
    data: {
      assigneeId: officer.id,
      statusHistory: {
        create: { status: row.status, note, at: now },
      },
      updatedAt: now,
    },
  });
  const ticket = await loadTicket(id);
  if (ticket) {
    await auditTicket(actor.id, "มอบหมายงาน", id, `มอบหมายให้ ${officer.name}`);
    await notifyUsers(
      [officer.id],
      {
        kind: "assigned",
        actorName: actor.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: actor.id },
    );
  }
  return ticket;
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
  const ticket = await loadTicket(ticketId);
  if (ticket) {
    await auditTicket(user.id, "เพิ่มความคิดเห็น", ticketId, content.slice(0, 120));
    await notifyUsers(
      ticketStakeholderIds(ticket),
      {
        kind: "comment",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
}

export async function updateComment(ticketId: string, user: User, commentId: string, content: string) {
  await prisma.ticketComment.updateMany({
    where: { id: commentId, ticketId, authorId: user.id },
    data: { content, updatedAt: new Date() },
  });
  const ticket = await loadTicket(ticketId);
  if (ticket) {
    await auditTicket(user.id, "แก้ไขความคิดเห็น", ticketId);
    await notifyUsers(
      ticketStakeholderIds(ticket),
      {
        kind: "comment_edited",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
}

export async function deleteComment(ticketId: string, user: User, commentId: string) {
  await prisma.ticketComment.deleteMany({
    where: { id: commentId, ticketId, authorId: user.id },
  });
  const ticket = await loadTicket(ticketId);
  if (ticket) {
    await auditTicket(user.id, "ลบความคิดเห็น", ticketId);
    await notifyUsers(
      ticketStakeholderIds(ticket),
      {
        kind: "comment_deleted",
        actorName: user.name,
        ticketNo: ticket.ticketNo,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
      },
      { excludeUserId: user.id },
    );
  }
  return ticket;
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
