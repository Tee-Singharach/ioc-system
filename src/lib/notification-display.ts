import type { AppNotification, NotificationKind } from "@/lib/types/notification";
import {
  NOTIFICATION_KIND_LABEL,
  notificationHeadline,
} from "@/lib/types/notification";

type BadgeColor = "gray" | "blue" | "green" | "yellow" | "red" | "purple";

const KIND_COLOR: Record<NotificationKind, BadgeColor> = {
  new_ticket: "blue",
  resubmit: "yellow",
  received: "purple",
  approval_pending: "yellow",
  approved: "green",
  rejected: "red",
  completed: "green",
  assigned: "blue",
  evaluation: "purple",
  comment: "gray",
  comment_edited: "gray",
  comment_deleted: "gray",
  ticket_updated: "yellow",
  cancelled: "red",
  progress_note: "purple",
  password: "yellow",
  other: "gray",
};

const TICKET_NO_RE = /[A-Z][A-Z0-9]*-\d{8}-\d+/;

function classifyFromTitle(title: string): NotificationKind {
  if (title.includes("รหัสผ่าน") || title.includes("รีเซ็ตรหัส")) return "password";
  if (title.includes("แสดงความคิดเห็น")) return "comment";
  if (title.includes("แก้ไขความคิดเห็น")) return "comment_edited";
  if (title.includes("ลบความคิดเห็น")) return "comment_deleted";
  if (title.includes("แก้ไขรายละเอียดคำร้อง")) return "ticket_updated";
  if (title.includes("ยกเลิกคำร้อง") || title.includes("ถูกยกเลิก")) return "cancelled";
  if (title.includes("บันทึกความคืบหน้า")) return "progress_note";
  if (title.startsWith("มีคำร้องใหม่") || title.includes("ยื่นคำร้องใหม่")) return "new_ticket";
  if (title.includes("ส่งใหม่หลังถูกปฏิเสธ") || title.includes("ส่งซ้ำ")) return "resubmit";
  if (title.includes("รับเรื่อง")) return "received";
  if (title.includes("บันทึกผลประเมิน") || title.includes("ผลประเมินแล้ว")) return "evaluation";
  if (title.includes("รอหัวหน้าอนุมัติ") || title.includes("ส่งขออนุมัติ")) return "approval_pending";
  if (title.includes("อนุมัติ")) return "approved";
  if (title.includes("ปฏิเสธ")) return "rejected";
  if (title.includes("เสร็จ") || title.includes("ปิดงาน")) return "completed";
  if (title.includes("มอบหมาย")) return "assigned";
  return "other";
}

function extractCommentAuthor(title: string): string | undefined {
  const m = title.match(/^(.+?) แสดงความคิดเห็น/);
  return m?.[1];
}

function extractActorFromLegacyTitle(title: string, kind: NotificationKind): string | undefined {
  if (kind === "comment") return extractCommentAuthor(title);
  const m = title.match(/^(.+?) (ยื่นคำร้องใหม่|ส่งคำร้องซ้ำ|รับเรื่อง|บันทึกผลประเมิน|บันทึกความคืบหน้า|ส่งขออนุมัติ|อนุมัติ|ปฏิเสธ|ปิดงาน|มอบหมาย|รีเซ็ต|แก้ไขรายละเอียด|ยกเลิก|แก้ไขความคิดเห็น|ลบความคิดเห็น)/);
  return m?.[1];
}

/** title ใน DB เก็บเป็น "หัวข้อ · ชื่อคำร้อง · เลขคำร้อง" */
function splitStoredTitle(title: string): { ticketTitle?: string; ticketNo?: string } {
  const parts = title.split(" · ").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) {
    const ticketNo = title.match(TICKET_NO_RE)?.[0];
    return ticketNo ? { ticketNo } : {};
  }
  const last = parts[parts.length - 1]!;
  const ticketNo = last.match(TICKET_NO_RE)?.[0];
  if (!ticketNo) return { ticketTitle: parts.slice(1).join(" · ") };
  const middle = parts.slice(1, -1);
  return {
    ticketTitle: middle.length ? middle.join(" · ") : undefined,
    ticketNo,
  };
}

export function formatNotificationDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export type NotificationDisplay = {
  kind: NotificationKind;
  kindLabel: string;
  badgeColor: BadgeColor;
  headline: string;
  subject?: string;
  meta: string;
};

function resolveSubject(
  kind: NotificationKind,
  headline: string,
  ticketTitle?: string,
): string | undefined {
  if (kind === "password") {
    return "กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่";
  }
  const trimmed = ticketTitle?.trim();
  if (!trimmed || trimmed === headline || headline.includes(trimmed)) return undefined;
  return trimmed;
}

export function parseNotificationDisplay(item: AppNotification): NotificationDisplay {
  const fromTitle = splitStoredTitle(item.title);
  const kind = item.kind ?? classifyFromTitle(item.title);
  const ticketNo =
    item.ticketNo ?? fromTitle.ticketNo ?? item.title.match(TICKET_NO_RE)?.[0];
  const ticketTitle = item.ticketTitle ?? fromTitle.ticketTitle;
  const actorName =
    item.actorName ?? extractActorFromLegacyTitle(item.title, kind);
  const headline = notificationHeadline(kind, actorName);

  const metaParts: string[] = [];
  if (ticketNo) metaParts.push(ticketNo);
  metaParts.push(formatNotificationDate(item.createdAt));

  return {
    kind,
    kindLabel: NOTIFICATION_KIND_LABEL[kind],
    badgeColor: KIND_COLOR[kind],
    headline,
    subject: resolveSubject(kind, headline, ticketTitle),
    meta: metaParts.join(" · "),
  };
}

if (process.env.NODE_ENV !== "production") {
  const structured = parseNotificationDisplay({
    id: "n1",
    kind: "rejected",
    actorName: "สมศักดิ์",
    ticketNo: "IT-20260630-1",
    ticketTitle: "รับสมัครฝ่าย IT",
    title: "สมศักดิ์ ปฏิเสธคำร้อง · รับสมัครฝ่าย IT · IT-20260630-1",
    href: "/tickets/x",
    createdAt: "2026-06-30T12:16:00.000Z",
  });
  if (structured.subject !== "รับสมัครฝ่าย IT" || structured.headline.includes("รับสมัคร")) {
    throw new Error("notification-display: subject must be ticket title only");
  }
  const legacy = parseNotificationDisplay({
    id: "n2",
    title: "คำร้อง IT-20260630-1 ถูกปฏิเสธ",
    href: "/officer/inbox/x",
    createdAt: "2026-06-30T12:16:00.000Z",
  });
  if (legacy.subject !== undefined) {
    throw new Error("notification-display: legacy should not duplicate headline in subject");
  }
}
