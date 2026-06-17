import type { Ticket } from "@/lib/types/ticket";

export function canReceive(ticket: Ticket): boolean {
  return ticket.status === "รอรับเรื่อง";
}

export function canUpdateStatus(ticket: Ticket): boolean {
  return (
    ticket.status === "กำลังดำเนินการ" ||
    ticket.status === "รออนุมัติ"
  );
}

export function canAssign(ticket: Ticket): boolean {
  return ticket.status === "กำลังดำเนินการ" || ticket.status === "รออนุมัติ";
}

export function canAddProgress(ticket: Ticket): boolean {
  return (
    ticket.status === "กำลังดำเนินการ" ||
    ticket.status === "รออนุมัติ"
  );
}
