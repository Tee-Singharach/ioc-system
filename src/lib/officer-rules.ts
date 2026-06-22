import type { Ticket } from "@/lib/types/ticket";
import { hasCompleteEvaluation } from "@/lib/ticket-evaluation";

/** รับเรื่องเพื่อตรวจสอบ — ยังไม่เริ่มดำเนินการซ่อม/ส่งของ */
export function canReceive(ticket: Ticket): boolean {
  return ticket.status === "รอรับเรื่อง" && !ticket.receivedById;
}

/** ส่งให้ผู้จัดการอนุมัติก่อนดำเนินการจริง — ต้องมีผลประเมินแล้ว */
export function canSubmitForApproval(ticket: Ticket): boolean {
  return ticket.status === "รอรับเรื่อง" && !!ticket.receivedById && hasCompleteEvaluation(ticket);
}

export function canSaveEvaluation(ticket: Ticket): boolean {
  return ticket.status === "รอรับเรื่อง" && !!ticket.receivedById;
}

export function canComplete(ticket: Ticket): boolean {
  return ticket.status === "กำลังดำเนินการ";
}

export function canAssign(ticket: Ticket): boolean {
  return canSubmitForApproval(ticket) || ticket.status === "กำลังดำเนินการ";
}

export function canAddProgress(ticket: Ticket): boolean {
  return ticket.status === "กำลังดำเนินการ";
}
