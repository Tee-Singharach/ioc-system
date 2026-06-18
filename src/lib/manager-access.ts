import type { Ticket, User } from "@/lib/types/ticket";

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
  return tickets.filter(
    (t) => t.status === "รออนุมัติ" && t.departmentId === manager.departmentId,
  );
}

export function getApprovalHistoryTickets(
  tickets: Ticket[],
  manager: Pick<User, "departmentId">,
): Ticket[] {
  return tickets
    .filter((t) => {
      if (t.departmentId !== manager.departmentId) return false;
      if (t.status !== "เสร็จสมบูรณ์" && t.status !== "ปฏิเสธ") return false;
      return t.statusHistory.some((h) => h.status === "รออนุมัติ");
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
  const decision = ticket.statusHistory
    .slice(pendingIdx + 1)
    .find((h) => h.status === "เสร็จสมบูรณ์" || h.status === "ปฏิเสธ");
  if (!decision) return null;
  return {
    action: decision.status === "เสร็จสมบูรณ์" ? "approved" : "rejected",
    at: decision.at,
    note: decision.note,
  };
}
