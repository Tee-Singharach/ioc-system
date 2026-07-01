import type { UserRole } from "@/lib/types/ticket";
import type { AppNotification, NotificationKind } from "@/lib/types/notification";
import { buildNotificationTitle } from "@/lib/types/notification";
import { prisma } from "@/lib/prisma";
import { emitSyncToUsers } from "@/lib/realtime/emit";

export function ticketHrefForRole(role: UserRole, ticketId: string): string {
  switch (role) {
    case "staff":
      return `/tickets/${ticketId}`;
    case "officer":
      return `/officer/inbox/${ticketId}`;
    case "manager":
      return `/manager/tickets/${ticketId}`;
    case "admin":
      return "/admin/audit-logs";
    default:
      return `/tickets/${ticketId}`;
  }
}

function mapRow(row: {
  id: string;
  title: string;
  kind: string;
  actorName: string | null;
  ticketNo: string | null;
  ticketTitle: string | null;
  href: string;
  ticketId: string | null;
  readAt: Date | null;
  createdAt: Date;
}): AppNotification {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind as NotificationKind,
    actorName: row.actorName ?? undefined,
    ticketNo: row.ticketNo ?? undefined,
    ticketTitle: row.ticketTitle ?? undefined,
    href: row.href,
    ticketId: row.ticketId ?? undefined,
    readAt: row.readAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function officersInDept(departmentId: string): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { departmentId, role: "officer", deletedAt: null },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function managersInDept(departmentId: string): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { departmentId, role: "manager", deletedAt: null },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export function ticketStakeholderIds(ticket: {
  requesterId: string;
  receivedById?: string;
  assigneeId?: string;
}): string[] {
  return [...new Set([ticket.requesterId, ticket.receivedById, ticket.assigneeId].filter(Boolean))] as string[];
}

export type NotifyPayload = {
  kind: NotificationKind;
  actorName?: string;
  ticketNo?: string;
  ticketTitle?: string;
  ticketId?: string;
  href?: string;
};

export async function notifyUsers(
  userIds: string[],
  payload: NotifyPayload,
  options?: { excludeUserId?: string },
) {
  const unique = [...new Set(userIds)].filter(
    (id) => id && id !== options?.excludeUserId,
  );
  if (!unique.length) return;

  const users = await prisma.user.findMany({
    where: { id: { in: unique }, deletedAt: null },
    select: { id: true, role: true },
  });

  const title = buildNotificationTitle(payload);
  const data = users.map((u) => ({
    userId: u.id,
    title,
    kind: payload.kind,
    actorName: payload.actorName ?? null,
    ticketNo: payload.ticketNo ?? null,
    ticketTitle: payload.ticketTitle ?? null,
    href:
      payload.href ??
      (payload.ticketId ? ticketHrefForRole(u.role, payload.ticketId) : "/"),
    ticketId: payload.ticketId ?? null,
  }));

  if (data.length) {
    await prisma.notification.createMany({ data });
    emitSyncToUsers(
      users.map((u) => u.id),
      payload.ticketId,
    );
  }
}

export async function listNotificationsForUser(
  userId: string,
  limit = 30,
): Promise<AppNotification[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapRow);
}

export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
