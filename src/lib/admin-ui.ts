import type { AuditLogEntry } from "@/lib/types/admin";
import type { UserRole } from "@/lib/types/ticket";
import { userInitials } from "@/lib/ticket-progress";

export type AuditCategory = "all" | "workflow" | "user" | "security" | "system";

export const ROLE_TAB_LABELS: Record<UserRole | "all", string> = {
  all: "ทั้งหมด",
  staff: "พนักงาน",
  officer: "เจ้าหน้าที่",
  manager: "หัวหน้างาน",
  admin: "ผู้ดูแลระบบ",
};

export const ROLE_STAT_META: Record<
  UserRole,
  { title: string; description: string; accent: string; countBg: string; iconBg: string }
> = {
  staff: {
    title: "พนักงาน",
    description: "สร้างและติดตามคำร้องของตน",
    accent: "border-l-blue-500",
    countBg: "bg-blue-50 text-blue-700",
    iconBg: "bg-blue-100 text-blue-600",
  },
  officer: {
    title: "เจ้าหน้าที่",
    description: "รับงาน อัปเดตความคืบหน้า",
    accent: "border-l-amber-400",
    countBg: "bg-amber-50 text-amber-700",
    iconBg: "bg-amber-100 text-amber-600",
  },
  manager: {
    title: "หัวหน้างาน",
    description: "อนุมัติคำร้อง ดู Dashboard",
    accent: "border-l-violet-500",
    countBg: "bg-violet-50 text-violet-700",
    iconBg: "bg-violet-100 text-violet-600",
  },
  admin: {
    title: "ผู้ดูแลระบบ",
    description: "จัดการผู้ใช้ ตำแหน่ง และ Audit log",
    accent: "border-l-rose-500",
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

export const DEPT_THEMES = [
  { label: "Sky", dot: "bg-sky-500", tile: "bg-sky-50 text-sky-700", icon: "bg-sky-100 text-sky-600", ring: "ring-sky-500" },
  { label: "Rose", dot: "bg-rose-500", tile: "bg-rose-50 text-rose-700", icon: "bg-rose-100 text-rose-600", ring: "ring-rose-500" },
  { label: "Amber", dot: "bg-amber-500", tile: "bg-amber-50 text-amber-700", icon: "bg-amber-100 text-amber-600", ring: "ring-amber-500" },
  { label: "Emerald", dot: "bg-emerald-500", tile: "bg-emerald-50 text-emerald-700", icon: "bg-emerald-100 text-emerald-600", ring: "ring-emerald-500" },
  { label: "Teal", dot: "bg-teal-500", tile: "bg-teal-50 text-teal-700", icon: "bg-teal-100 text-teal-600", ring: "ring-teal-500" },
  { label: "Indigo", dot: "bg-indigo-500", tile: "bg-indigo-50 text-indigo-700", icon: "bg-indigo-100 text-indigo-600", ring: "ring-indigo-500" },
  { label: "Violet", dot: "bg-violet-500", tile: "bg-violet-50 text-violet-700", icon: "bg-violet-100 text-violet-600", ring: "ring-violet-500" },
  { label: "Fuchsia", dot: "bg-fuchsia-500", tile: "bg-fuchsia-50 text-fuchsia-700", icon: "bg-fuchsia-100 text-fuchsia-600", ring: "ring-fuchsia-500" },
  { label: "Orange", dot: "bg-orange-500", tile: "bg-orange-50 text-orange-700", icon: "bg-orange-100 text-orange-600", ring: "ring-orange-500" },
  { label: "Blue", dot: "bg-blue-500", tile: "bg-blue-50 text-blue-700", icon: "bg-blue-100 text-blue-600", ring: "ring-blue-500" },
] as const;

export function deptThemeForId(deptId: string, colorIndex?: number) {
  if (colorIndex != null && colorIndex >= 0 && colorIndex < DEPT_THEMES.length) {
    return DEPT_THEMES[colorIndex];
  }
  let n = 0;
  for (const ch of deptId) n += ch.charCodeAt(0);
  return DEPT_THEMES[n % DEPT_THEMES.length];
}

export function deptSlugFromId(id: string) {
  return id.startsWith("dept-") ? id.slice(5) : id;
}

export function mockUserEmail(usernameOrId: string) {
  const local = usernameOrId.replace(/^user-/, "").replace(/-/g, "");
  return `${local}@ioc.local`;
}

export function auditCategory(log: AuditLogEntry): Exclude<AuditCategory, "all"> {
  const text = `${log.action} ${log.detail ?? ""}`;
  if (/คำร้อง|สถานะ|มอบหมาย|รับงาน|อนุมัติ|ปฏิเสธ|workflow/i.test(text)) return "workflow";
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
  user: "bg-violet-50 text-violet-700 ring-violet-100",
  security: "bg-amber-50 text-amber-800 ring-amber-100",
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
