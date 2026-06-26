import type { Ticket } from "@/lib/types/ticket";

/** ล่าสุดก่อน — อัปเดตล่าสุดอยู่บน ถ้าเวลาเท่ากันเรียงเลขคำร้องใหม่ก่อน */
export function compareTicketsByRecent(a: Pick<Ticket, "updatedAt" | "ticketNo">, b: Pick<Ticket, "updatedAt" | "ticketNo">): number {
  const atDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  if (atDiff !== 0) return atDiff;
  return b.ticketNo.localeCompare(a.ticketNo);
}

export function sortTicketsByRecent<T extends Pick<Ticket, "updatedAt" | "ticketNo">>(tickets: T[]): T[] {
  return [...tickets].sort(compareTicketsByRecent);
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const older = { updatedAt: "2024-01-01T00:00:00Z", ticketNo: "IOC-2024-001" };
  const newer = { updatedAt: "2024-06-01T00:00:00Z", ticketNo: "IOC-2024-002" };
  if (sortTicketsByRecent([older, newer])[0] !== newer) {
    throw new Error("ticket-sort: newer updatedAt should sort first");
  }
}
