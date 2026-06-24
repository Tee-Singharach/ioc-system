"use server";

import bcrypt from "bcryptjs";
import type { Attachment, Ticket, TicketEvaluation, TicketFormData, User } from "@/lib/types/ticket";
import type { AuditLogEntry, ManagedDepartment, ManagedUser } from "@/lib/types/admin";
import * as db from "@/lib/db/ticket-service";

export async function fetchAllTickets(): Promise<Ticket[]> {
  return db.listAllTickets();
}

export async function loginWithPassword(username: string, password: string): Promise<User | null> {
  return db.findUserByCredentials(username, (hash) => bcrypt.compareSync(password, hash));
}

export async function fetchDepartments() {
  return db.listDepartments();
}

export async function fetchOfficers() {
  return db.listOfficers();
}

export async function fetchAdminUsers(): Promise<ManagedUser[]> {
  const rows = await db.listManagedUsers();
  return rows.map((u) => ({
    ...u,
    deletedAt: u.deletedAt?.toISOString(),
  }));
}

export async function fetchAdminDepartments(): Promise<ManagedDepartment[]> {
  const rows = await db.listManagedDepartments();
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    shortName: d.shortName ?? undefined,
    deletedAt: d.deletedAt?.toISOString(),
  }));
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const rows = await db.listAuditLogs();
  return rows.map((l) => ({
    id: l.id,
    action: l.action,
    target: l.target,
    actorId: l.actorId,
    actorName: l.actor.name,
    at: l.createdAt.toISOString(),
    detail: l.detail ?? undefined,
  }));
}

export async function actionCreateTicket(user: User, data: TicketFormData) {
  return db.createTicket(user, data);
}

export async function actionUpdateTicket(id: string, data: TicketFormData) {
  return db.updateTicket(id, data);
}

export async function actionCancelTicket(id: string) {
  return db.cancelTicket(id);
}

export async function actionResubmitTicket(id: string, data: TicketFormData) {
  return db.resubmitTicket(id, data);
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

export async function actionAssignTicket(id: string, officerId: string) {
  return db.assignTicket(id, officerId);
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
