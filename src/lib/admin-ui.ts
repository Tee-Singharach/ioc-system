import type { AuditLogEntry } from "@/lib/types/admin";
import type { UserRole } from "@/lib/types/ticket";

export type AuditCategory = "all" | "workflow" | "user" | "security" | "system";

export const ROLE_TAB_LABELS: Record<UserRole | "all", string> = {
  all: "ทั้งหมด",
  staff: "พนักงาน",
  officer: "เจ้าหน้าที่",
  manager: "หัวหน้า",
  admin: "ผู้ดูแลระบบ",
};

export const ROLE_STAT_META: Record<
  UserRole,
  { title: string; description: string; countBg: string; iconBg: string }
> = {
  staff: {
    title: "พนักงาน",
    description: "สร้างและติดตามคำร้องของตน",
    countBg: "bg-blue-50 text-blue-700",
    iconBg: "bg-blue-100 text-blue-600",
  },
  officer: {
    title: "เจ้าหน้าที่",
    description: "รับงาน อัปเดตความคืบหน้า",
    countBg: "bg-amber-50 text-amber-700",
    iconBg: "bg-amber-100 text-amber-600",
  },
  manager: {
    title: "หัวหน้า",
    description: "อนุมัติคำร้อง ดู Dashboard",
    countBg: "bg-violet-50 text-violet-700",
    iconBg: "bg-violet-100 text-violet-600",
  },
  admin: {
    title: "ผู้ดูแลระบบ",
    description: "จัดการผู้ใช้ ตำแหน่ง และ Audit log",
    countBg: "bg-rose-50 text-rose-700",
    iconBg: "bg-rose-100 text-rose-600",
  },
};

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  staff: "bg-blue-50 text-blue-700 ring-blue-200",
  officer: "bg-amber-50 text-amber-800 ring-amber-200",
  manager: "bg-violet-50 text-violet-700 ring-violet-200",
  admin: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function deptSlugFromId(id: string) {
  return id.startsWith("dept-") ? id.slice(5) : id;
}

export function mockUserEmail(usernameOrId: string) {
  const local = usernameOrId.replace(/^user-/, "").replace(/-/g, "");
  return `${local}@ioc.local`;
}

export function auditCategory(log: AuditLogEntry): Exclude<AuditCategory, "all"> {
  const text = `${log.action} ${log.detail ?? ""}`;
  if (/คำร้อง|สถานะ|มอบหมาย|รับเรื่อง|อนุมัติ|ปฏิเสธ|ปิดงาน|ความคิดเห็น|ความคืบหน้า|ประเมิน/i.test(text)) {
    return "workflow";
  }
  if (/ผู้ใช้|สิทธิ์|แผนก|ลบผู้ใช้|ลบแผนก|role|user/i.test(text)) return "user";
  if (/ล็อกอิน|login|security|session|รหัสผ่าน/i.test(text)) return "security";
  return "system";
}

export const AUDIT_CATEGORY_LABELS: Record<Exclude<AuditCategory, "all">, string> = {
  workflow: "Workflow",
  user: "ผู้ใช้",
  security: "Security",
  system: "ระบบ",
};

export const AUDIT_CATEGORY_BADGE: Record<Exclude<AuditCategory, "all">, string> = {
  workflow: "bg-blue-50 text-blue-700 ring-blue-100",
  user: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  security: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  system: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function formatAuditTimestamp(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
