import { prisma } from "@/lib/prisma";

const BANGKOK = "Asia/Bangkok";

/** วันที่ยื่น (โซน Asia/Bangkok) → YYYYMMDD */
export function ticketDateStamp(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK }).format(at).replace(/-/g, "");
}

export function departmentCode(shortName: string | null | undefined, id: string): string {
  const raw = (shortName ?? id.replace(/^dept-/, "") ?? "GEN").toUpperCase();
  const code = raw.replace(/[^A-Z0-9]/g, "");
  return code || "GEN";
}

/** ดึงเลขรันจาก prefix {DEPT}-{YYYYMMDD}- */
export function parseTicketSeq(ticketNo: string, prefix: string): number | null {
  const suffixRe = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d{3})$`);
  const m = ticketNo.match(suffixRe);
  return m ? Number.parseInt(m[1], 10) : null;
}

/** แผนกผู้ยื่น + วันที่ยื่น + เลขรันต่อแผนกต่อวัน (เช่น IT-20260619-001) */
export async function nextTicketNo(requesterDepartmentId: string, at: Date = new Date()): Promise<string> {
  const dept = await prisma.department.findUnique({
    where: { id: requesterDepartmentId },
    select: { shortName: true, id: true },
  });
  if (!dept) throw new Error(`Unknown department: ${requesterDepartmentId}`);

  const code = departmentCode(dept.shortName, dept.id);
  const date = ticketDateStamp(at);
  const prefix = `${code}-${date}-`;

  const rows = await prisma.ticket.findMany({
    where: { ticketNo: { startsWith: prefix } },
    select: { ticketNo: true },
  });

  let max = 0;
  for (const { ticketNo } of rows) {
    const seq = parseTicketSeq(ticketNo, prefix);
    if (seq != null) max = Math.max(max, seq);
  }

  // ponytail: >999/แผนก/วัน → ขยายหลักหรือ error ชัดเจน
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  if (ticketDateStamp(new Date("2026-06-19T01:00:00Z")) !== "20260619") {
    throw new Error("ticket-number: bangkok date stamp");
  }
  if (departmentCode("IT", "dept-it") !== "IT") throw new Error("ticket-number: dept code");

  const samples = ["IT-20260618-001", "IT-20260618-002", "IT-20260619-001"];
  let max18 = 0;
  let max19 = 0;
  for (const ticketNo of samples) {
    const s18 = parseTicketSeq(ticketNo, "IT-20260618-");
    if (s18 != null) max18 = Math.max(max18, s18);
    const s19 = parseTicketSeq(ticketNo, "IT-20260619-");
    if (s19 != null) max19 = Math.max(max19, s19);
  }
  if (max18 !== 2 || max19 !== 1) throw new Error("ticket-number: daily seq per prefix");
}
