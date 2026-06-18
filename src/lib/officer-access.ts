import type { Ticket, TicketStatus, User } from "@/lib/types/ticket";

const TERMINAL_STATUSES: TicketStatus[] = ["เสร็จสมบูรณ์", "ปฏิเสธ", "ยกเลิก"];

export function getInboxPendingTickets(
  tickets: Ticket[],
  officer: Pick<User, "departmentId">,
): Ticket[] {
  return tickets.filter(
    (t) => t.status === "รอรับเรื่อง" && t.departmentId === officer.departmentId,
  );
}

export function getOfficerMyTasks(
  tickets: Ticket[],
  officer: Pick<User, "id">,
): Ticket[] {
  return tickets.filter(
    (t) =>
      !TERMINAL_STATUSES.includes(t.status) &&
      t.status !== "รอรับเรื่อง" &&
      (t.assigneeId === officer.id || t.receivedById === officer.id),
  );
}

export function getOfficerTickets(tickets: Ticket[], officer: Pick<User, "id" | "departmentId">): Ticket[] {
  return tickets.filter(
    (t) =>
      t.departmentId === officer.departmentId ||
      t.assigneeId === officer.id ||
      t.receivedById === officer.id,
  );
}

export function canOfficerViewTicket(ticket: Ticket, officer: Pick<User, "id" | "departmentId">): boolean {
  return getOfficerTickets([ticket], officer).length > 0;
}

export function homePathForRole(role: User["role"]): string {
  if (role === "officer") return "/officer/inbox";
  if (role === "staff") return "/tickets";
  return "/login";
}
