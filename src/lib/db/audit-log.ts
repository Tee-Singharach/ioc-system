import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/types/ticket";

export async function writeAuditLog(
  actorId: string,
  action: string,
  target: string,
  detail?: string,
) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, target, detail: detail ?? null },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}

export async function listAuditLogs() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      actor: { include: { department: true } },
    },
  });
}

export function mapAuditLogRow(row: Awaited<ReturnType<typeof listAuditLogs>>[number]) {
  return {
    id: row.id,
    action: row.action,
    target: row.target,
    actorId: row.actorId,
    actorName: row.actor.name,
    actorUsername: row.actor.username,
    actorRole: row.actor.role as UserRole,
    actorDepartment: row.actor.department.name,
    at: row.createdAt.toISOString(),
    detail: row.detail ?? undefined,
  };
}
