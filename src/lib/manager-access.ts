import type { Ticket, User } from "@/lib/types/ticket";
import { sortTicketsByRecent } from "@/lib/ticket-sort";

export function getManagerDepartmentTickets(
  tickets: Ticket[],
  manager: Pick<User, "departmentId">,
): Ticket[] {
  return tickets.filter((t) => t.departmentId === manager.departmentId);
}

export function getPendingApprovalTickets(
  tickets: Ticket[],
  manager: Pick<User, "departmentId">,
): Ticket[] {
  return sortTicketsByRecent(
    tickets.filter(
      (t) => t.status === "รออนุมัติ" && t.departmentId === manager.departmentId,
    ),
  );
}

export function getApprovalHistoryTickets(
  tickets: Ticket[],
  manager: Pick<User, "departmentId">,
): Ticket[] {
  return sortTicketsByRecent(
    tickets.filter((t) => {
      if (t.departmentId !== manager.departmentId) return false;
      if (t.status !== "เสร็จสมบูรณ์" && t.status !== "ปฏิเสธ") return false;
      return t.statusHistory.some((h) => h.status === "รออนุมัติ");
    }),
  );
}

export function canManagerViewTicket(
  ticket: Ticket,
  manager: Pick<User, "departmentId">,
): boolean {
  return ticket.departmentId === manager.departmentId;
}

export function getApprovalDecision(ticket: Ticket): {
  action: "approved" | "rejected";
  at: string;
  note?: string;
} | null {
  const pendingIdx = ticket.statusHistory.findIndex((h) => h.status === "รออนุมัติ");
  if (pendingIdx === -1) return null;
  const after = ticket.statusHistory.slice(pendingIdx + 1);
  const rejected = after.find((h) => h.status === "ปฏิเสธ");
  if (rejected) {
    return { action: "rejected", at: rejected.at, note: rejected.note };
  }
  const approved = after.find(
    (h) => h.status === "กำลังดำเนินการ" && h.note?.includes("อนุมัติ"),
  );
  if (approved) {
    return { action: "approved", at: approved.at, note: approved.note };
  }
  return null;
}
