import type { Ticket } from "@/lib/types/ticket";

export function canApprove(ticket: Ticket): boolean {
  return ticket.status === "รออนุมัติ";
}

export function canReject(ticket: Ticket): boolean {
  return ticket.status === "รออนุมัติ";
}
