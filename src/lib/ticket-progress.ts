import type { Ticket, TicketStatus } from "@/lib/types/ticket";

const TERMINAL: TicketStatus[] = ["ปฏิเสธ", "ยกเลิก"];

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

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const HANDOFF_PROGRESS_PREFIX = "ส่งมอบแล้ว — ";

export function handoffProgressContent(summary: string) {
  return `${HANDOFF_PROGRESS_PREFIX}${summary.trim()}`;
}

export function isHandoffProgressNote(content: string) {
  return content.startsWith(HANDOFF_PROGRESS_PREFIX);
}

export function handoffProgressReason(content: string) {
  return isHandoffProgressNote(content) ? content.slice(HANDOFF_PROGRESS_PREFIX.length) : content;
}
