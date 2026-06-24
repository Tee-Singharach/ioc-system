import type { Ticket } from "@/lib/types/ticket";

/** ส่งคำร้องใหม่หลังปฏิเสธได้สูงสุดกี่ครั้ง (ครั้งที่ 4 ถูกปฏิเสธ → ต้องสร้างใบใหม่) */
export const MAX_RESUBMITS_AFTER_REJECT = 3;

export function countRejections(ticket: Pick<Ticket, "statusHistory">): number {
  return ticket.statusHistory.filter((h) => h.status === "ปฏิเสธ").length;
}

export function canResubmit(ticket: Ticket): boolean {
  return ticket.status === "ปฏิเสธ" && countRejections(ticket) <= MAX_RESUBMITS_AFTER_REJECT;
}

export function isResubmitExhausted(ticket: Ticket): boolean {
  return ticket.status === "ปฏิเสธ" && countRejections(ticket) > MAX_RESUBMITS_AFTER_REJECT;
}

export function canEdit(ticket: Ticket): boolean {
  return ticket.status === "รอรับเรื่อง" && !ticket.receivedById;
}

export function canCancel(ticket: Ticket): boolean {
  return ticket.status !== "เสร็จสมบูรณ์" && ticket.status !== "ยกเลิก";
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const base = { status: "ปฏิเสธ" as const, statusHistory: [{ status: "ปฏิเสธ" as const, at: "x" }] };
  if (!canResubmit(base as Ticket)) throw new Error("ticket-rules: one reject can resubmit");
  const exhausted = {
    status: "ปฏิเสธ" as const,
    statusHistory: Array.from({ length: 4 }, () => ({ status: "ปฏิเสธ" as const, at: "x" })),
  };
  if (canResubmit(exhausted as Ticket) || !isResubmitExhausted(exhausted as Ticket)) {
    throw new Error("ticket-rules: fourth reject blocks resubmit");
  }
}
