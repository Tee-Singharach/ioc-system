"use server";

import bcrypt from "bcryptjs";
import type { Attachment, Ticket, TicketEvaluation, TicketFormData, User } from "@/lib/types/ticket";
import type { AuditLogEntry, ManagedDepartment, ManagedUser } from "@/lib/types/admin";
import * as db from "@/lib/db/ticket-service";
import * as adminDb from "@/lib/db/admin-service";
import { adminResetUserPassword } from "@/lib/db/user-service";
import { listAuditLogs, mapAuditLogRow, writeAuditLog } from "@/lib/db/audit-log";

export async function fetchAllTickets(): Promise<Ticket[]> {
  return db.listAllTickets();
}

export async function loginWithPassword(username: string, password: string): Promise<User | null> {
  const user = await db.findUserByCredentials(username, (hash) => bcrypt.compareSync(password, hash));
  if (user) await writeAuditLog(user.id, "เข้าสู่ระบบ", user.username);
  return user;
}

export async function fetchDepartments() {
  return db.listDepartments();
}

export async function fetchOfficers() {
  return db.listOfficers();
}

export async function fetchAdminUsers(): Promise<ManagedUser[]> {
  const rows = await adminDb.listManagedUsers();
  return rows.map((u) => ({
    ...u,
    deletedAt: u.deletedAt?.toISOString(),
  }));
}

export async function fetchAdminDepartments(): Promise<ManagedDepartment[]> {
  const rows = await adminDb.listManagedDepartments();
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    shortName: d.shortName ?? undefined,
    deletedAt: d.deletedAt?.toISOString(),
  }));
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const rows = await listAuditLogs();
  return rows.map(mapAuditLogRow);
}

export async function actionAppendAuditLog(
  user: User,
  action: string,
  target: string,
  detail?: string,
): Promise<AuditLogEntry> {
  await writeAuditLog(user.id, action, target, detail);
  const rows = await listAuditLogs();
  const latest = rows[0];
  if (!latest) {
    return {
      id: `log-${Date.now()}`,
      action,
      target,
      actorId: user.id,
      actorName: user.name,
      actorUsername: user.username,
      actorRole: user.role,
      actorDepartment: "",
      at: new Date().toISOString(),
      detail,
    };
  }
  return mapAuditLogRow(latest);
}

export async function actionCreateTicket(user: User, data: TicketFormData) {
  return db.createTicket(user, data);
}

export async function actionUpdateTicket(id: string, user: User, data: TicketFormData) {
  return db.updateTicket(id, user, data);
}

export async function actionCancelTicket(id: string, user: User) {
  return db.cancelTicket(id, user);
}

export async function actionResubmitTicket(id: string, user: User, data: TicketFormData) {
  return db.resubmitTicket(id, user, data);
}

export async function actionReceiveTicket(id: string, user: User) {
  return db.receiveTicket(id, user);
}

export async function actionSaveEvaluation(
  id: string,
  user: User,
  data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">,
) {
  return db.saveEvaluation(id, user, data);
}

export async function actionSubmitForApproval(id: string, user: User) {
  return db.submitForApproval(id, user);
}

export async function actionCompleteTicket(id: string, user: User, summary?: string) {
  return db.completeTicket(id, user, summary);
}

export async function actionAddProgressNote(id: string, user: User, content: string) {
  return db.addProgressNote(id, user, content);
}

export async function actionAssignTicket(id: string, user: User, officerId: string) {
  return db.assignTicket(id, user, officerId);
}

export async function actionAddComment(
  ticketId: string,
  user: User,
  content: string,
  attachments?: Attachment[],
) {
  return db.addComment(ticketId, user, content, attachments?.map((a) => a.name));
}

export async function actionUpdateComment(
  ticketId: string,
  user: User,
  commentId: string,
  content: string,
) {
  return db.updateComment(ticketId, user, commentId, content);
}

export async function actionDeleteComment(ticketId: string, user: User, commentId: string) {
  return db.deleteComment(ticketId, user, commentId);
}

export async function actionApproveTicket(id: string, user: User) {
  return db.approveTicket(id, user);
}

export async function actionRejectTicket(id: string, user: User, reason: string) {
  return db.rejectTicket(id, user, reason);
}

export async function actionAdminResetUserPassword(
  actor: User,
  targetUserId: string,
  newPassword: string,
) {
  return adminResetUserPassword(actor, targetUserId, newPassword);
}

export async function actionAdminCreateUser(
  actor: User,
  input: { username: string; name: string; role: User["role"]; departmentId: string },
  password: string,
) {
  return adminDb.createManagedUser(actor, { ...input, password });
}

export async function actionAdminUpdateUserRole(actor: User, userId: string, role: User["role"]) {
  return adminDb.updateManagedUserRole(actor, userId, role);
}

export async function actionAdminUpdateUserDepartment(
  actor: User,
  userId: string,
  departmentId: string,
) {
  return adminDb.updateManagedUserDepartment(actor, userId, departmentId);
}

export async function actionAdminUpdateUserName(actor: User, userId: string, name: string) {
  return adminDb.updateManagedUserName(actor, userId, name);
}

export async function actionAdminSoftDeleteUser(actor: User, userId: string) {
  return adminDb.softDeleteManagedUser(actor, userId);
}

export async function actionAdminRestoreUser(actor: User, userId: string) {
  return adminDb.restoreManagedUser(actor, userId);
}

export async function actionAdminCreateDepartment(
  actor: User,
  input: { slug: string; name: string; shortName: string },
) {
  return adminDb.createManagedDepartment(actor, input);
}

export async function actionAdminUpdateDepartment(
  actor: User,
  id: string,
  input: { name: string; shortName: string },
) {
  return adminDb.updateManagedDepartment(actor, id, input);
}

export async function actionAdminSoftDeleteDepartment(actor: User, id: string) {
  return adminDb.softDeleteManagedDepartment(actor, id);
}

export async function actionAdminRestoreDepartment(actor: User, id: string) {
  return adminDb.restoreManagedDepartment(actor, id);
}
