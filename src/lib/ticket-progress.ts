import type { StatusHistoryEntry, Ticket, TicketStatus } from "@/lib/types/ticket";

const WORKFLOW: TicketStatus[] = ["รอรับเรื่อง", "กำลังดำเนินการ", "รออนุมัติ", "เสร็จสมบูรณ์"];
const TERMINAL: TicketStatus[] = ["ปฏิเสธ", "ยกเลิก"];

function workflowStepIndex(status: TicketStatus, history: StatusHistoryEntry[]): number {
  if (status === "เสร็จสมบูรณ์") return WORKFLOW.length - 1;
  const idx = WORKFLOW.findIndex((s) => s === status);
  if (idx >= 0) return idx;
  if (TERMINAL.includes(status)) {
    let max = 0;
    for (const h of history) {
      const i = WORKFLOW.findIndex((s) => s === h.status);
      if (i > max) max = i;
    }
    return max;
  }
  return 0;
}

export function ticketWorkflowPercent(status: TicketStatus, history: StatusHistoryEntry[]): number {
  if (status === "เสร็จสมบูรณ์") return 100;
  const current = workflowStepIndex(status, history);
  return Math.round((current / (WORKFLOW.length - 1)) * 100);
}

export function isTicketOverdue(ticket: Ticket): boolean {
  if (TERMINAL.includes(ticket.status) || ticket.status === "เสร็จสมบูรณ์") return false;
  return new Date(ticket.scheduledEndAt).getTime() < Date.now();
}

export function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return name.slice(0, 2);
}

export function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}
