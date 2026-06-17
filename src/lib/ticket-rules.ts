import type { Ticket } from "@/lib/types/ticket";

export function canEdit(ticket: Ticket): boolean {
  return ticket.status === "รอรับเรื่อง";
}

export function canCancel(ticket: Ticket): boolean {
  return ticket.status !== "เสร็จสมบูรณ์" && ticket.status !== "ยกเลิก";
}

export function canResubmit(ticket: Ticket): boolean {
  return ticket.status === "ปฏิเสธ";
}
