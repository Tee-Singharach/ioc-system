import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/db/audit-log";
import type { User } from "@/lib/types/ticket";

const MIN_PASSWORD_LEN = 6;

export async function adminResetUserPassword(
  actor: User,
  targetUserId: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (actor.role !== "admin") {
    return { ok: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
  }
  if (actor.id === targetUserId) {
    return { ok: false, error: "ใช้หน้าตั้งค่าเพื่อเปลี่ยนรหัสของตนเอง" };
  }
  if (newPassword.length < MIN_PASSWORD_LEN) {
    return { ok: false, error: `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LEN} ตัวอักษร` };
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, deletedAt: null },
  });
  if (!target) return { ok: false, error: "ไม่พบผู้ใช้" };
  if (target.role === "admin") {
    return { ok: false, error: "ไม่สามารถรีเซ็ตรหัสผู้ดูแลระบบได้" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash },
  });
  await writeAuditLog(actor.id, "รีเซ็ตรหัสผ่าน", target.username, target.name);
  return { ok: true };
}
