import type { Ticket, TicketStatus, User } from "@/lib/types/ticket";

const TERMINAL_STATUSES: TicketStatus[] = ["เสร็จสมบูรณ์", "ปฏิเสธ", "ยกเลิก"];

export function getInboxPendingTickets(
  tickets: Ticket[],
  officer: Pick<User, "departmentId">,
): Ticket[] {
  return tickets.filter(
    (t) =>
      t.status === "รอรับเรื่อง" &&
      !t.receivedById &&
      t.departmentId === officer.departmentId,
  );
}

export function getOfficerMyTasks(
  tickets: Ticket[],
  officer: Pick<User, "id">,
): Ticket[] {
  return tickets.filter((t) => {
    if (TERMINAL_STATUSES.includes(t.status)) return false;
    const mine = t.assigneeId === officer.id || t.receivedById === officer.id;
    if (!mine) return false;
    if (t.status === "รอรับเรื่อง" && !t.receivedById) return false;
    return true;
  });
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

/** ดำเนินการ workflow ได้จากกล่องงาน — งานรอรับในแผนก หรืองานที่รับ/ได้รับมอบหมายแล้ว */
export function canOfficerActOnTicket(ticket: Ticket, officer: Pick<User, "id" | "departmentId">): boolean {
  if (
    ticket.status === "รอรับเรื่อง" &&
    !ticket.receivedById &&
    ticket.departmentId === officer.departmentId
  ) {
    return true;
  }
  return ticket.receivedById === officer.id || ticket.assigneeId === officer.id;
}

export function homePathForRole(role: User["role"]): string {
  if (role === "officer") return "/officer/inbox";
  if (role === "manager") return "/manager/dashboard";
  if (role === "admin") return "/admin/users";
  if (role === "staff") return "/tickets";
  return "/login";
}
