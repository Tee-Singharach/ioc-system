export type NotificationKind =
  | "new_ticket"
  | "resubmit"
  | "received"
  | "approval_pending"
  | "approved"
  | "rejected"
  | "completed"
  | "assigned"
  | "evaluation"
  | "comment"
  | "comment_edited"
  | "comment_deleted"
  | "ticket_updated"
  | "cancelled"
  | "progress_note"
  | "password"
  | "other";

export type AppNotification = {
  id: string;
  title: string;
  href: string;
  kind?: NotificationKind;
  actorName?: string;
  ticketNo?: string;
  ticketTitle?: string;
  ticketId?: string;
  readAt?: string;
  createdAt: string;
};

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  new_ticket: "คำร้องใหม่",
  resubmit: "ส่งซ้ำ",
  received: "รับเรื่อง",
  approval_pending: "รออนุมัติ",
  approved: "อนุมัติ",
  rejected: "ปฏิเสธ",
  completed: "เสร็จสิ้น",
  assigned: "มอบหมาย",
  evaluation: "ประเมินแล้ว",
  comment: "คอมเมนต์",
  comment_edited: "แก้คอมเมนต์",
  comment_deleted: "ลบคอมเมนต์",
  ticket_updated: "แก้ไขคำร้อง",
  cancelled: "ยกเลิก",
  progress_note: "ความคืบหน้า",
  password: "บัญชี",
  other: "แจ้งเตือน",
};

export function notificationHeadline(kind: NotificationKind, actorName?: string): string {
  const name = actorName?.trim();
  switch (kind) {
    case "new_ticket":
      return name ? `${name} ยื่นคำร้องใหม่` : "มีคำร้องใหม่รอรับเรื่อง";
    case "resubmit":
      return name ? `${name} ส่งคำร้องซ้ำหลังถูกปฏิเสธ` : "มีคำร้องส่งซ้ำหลังถูกปฏิเสธ";
    case "received":
      return name ? `${name} รับเรื่องแล้ว` : "คำร้องถูกรับเรื่องแล้ว";
    case "approval_pending":
      return name ? `${name} ส่งขออนุมัติ` : "มีคำร้องรอหัวหน้าอนุมัติ";
    case "approved":
      return name ? `${name} อนุมัติคำร้องแล้ว` : "คำร้องได้รับการอนุมัติ";
    case "rejected":
      return name ? `${name} ปฏิเสธคำร้อง` : "คำร้องถูกปฏิเสธ";
    case "completed":
      return name ? `${name} ปิดงานแล้ว` : "คำร้องเสร็จสมบูรณ์";
    case "assigned":
      return name ? `${name} มอบหมายงานให้คุณ` : "ได้รับมอบหมายงานใหม่";
    case "evaluation":
      return name ? `${name} บันทึกผลประเมินแล้ว` : "มีการบันทึกผลประเมินในคำร้อง";
    case "comment":
      return name ? `${name} แสดงความคิดเห็นใหม่` : "มีความคิดเห็นใหม่ในคำร้อง";
    case "comment_edited":
      return name ? `${name} แก้ไขความคิดเห็น` : "มีการแก้ไขความคิดเห็นในคำร้อง";
    case "comment_deleted":
      return name ? `${name} ลบความคิดเห็น` : "มีความคิดเห็นถูกลบในคำร้อง";
    case "ticket_updated":
      return name ? `${name} แก้ไขรายละเอียดคำร้อง` : "มีการแก้ไขรายละเอียดคำร้อง";
    case "cancelled":
      return name ? `${name} ยกเลิกคำร้อง` : "คำร้องถูกยกเลิก";
    case "progress_note":
      return name ? `${name} บันทึกความคืบหน้า` : "มีการบันทึกความคืบหน้าในคำร้อง";
    case "password":
      return name ? `${name} รีเซ็ตรหัสผ่านให้คุณ` : "รหัสผ่านถูกรีเซ็ต";
    default:
      return "มีการอัปเดตคำร้อง";
  }
}

export function buildNotificationTitle(payload: {
  kind: NotificationKind;
  actorName?: string;
  ticketNo?: string;
  ticketTitle?: string;
}): string {
  const parts = [notificationHeadline(payload.kind, payload.actorName)];
  if (payload.ticketTitle) parts.push(payload.ticketTitle);
  if (payload.ticketNo) parts.push(payload.ticketNo);
  return parts.join(" · ");
}
