import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/db/audit-log";
import type { User, UserRole } from "@/lib/types/ticket";

const MIN_PASSWORD_LEN = 6;

type AdminResult = { ok: true } | { ok: false; error: string };

function requireAdmin(actor: User): AdminResult | { ok: true } {
  if (actor.role !== "admin") return { ok: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
  return { ok: true };
}

export async function listManagedUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      departmentId: true,
      deletedAt: true,
    },
  });
}

export async function listManagedDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true, deletedAt: true },
  });
}

export async function createManagedUser(
  actor: User,
  input: {
    username: string;
    name: string;
    role: UserRole;
    departmentId: string;
    password: string;
  },
): Promise<AdminResult> {
  const gate = requireAdmin(actor);
  if (!gate.ok) return gate;

  const username = input.username.trim().toLowerCase();
  const name = input.name.trim();
  if (!username || !name) return { ok: false, error: "กรุณากรอกชื่อผู้ใช้และชื่อ-นามสกุล" };
  if (input.password.length < MIN_PASSWORD_LEN) {
    return { ok: false, error: `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LEN} ตัวอักษร` };
  }

  const dept = await prisma.department.findFirst({
    where: { id: input.departmentId, deletedAt: null },
  });
  if (!dept) return { ok: false, error: "แผนกไม่ถูกต้อง" };

  const exists = await prisma.user.findFirst({ where: { username } });
  if (exists && !exists.deletedAt) return { ok: false, error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" };

  const passwordHash = await bcrypt.hash(input.password, 10);
  if (exists?.deletedAt) {
    await prisma.user.update({
      where: { id: exists.id },
      data: {
        name,
        role: input.role,
        departmentId: input.departmentId,
        passwordHash,
        deletedAt: null,
      },
    });
    await writeAuditLog(actor.id, "สร้างผู้ใช้", username, `กู้คืนบัญชี · สิทธิ์ ${input.role}`);
    return { ok: true };
  }

  await prisma.user.create({
    data: {
      username,
      name,
      role: input.role,
      departmentId: input.departmentId,
      passwordHash,
    },
  });
  await writeAuditLog(actor.id, "สร้างผู้ใช้", username, `สิทธิ์ ${input.role}`);
  return { ok: true };
}

export async function updateManagedUserRole(
  actor: User,
  userId: string,
  role: UserRole,
): Promise<AdminResult> {
  const gate = requireAdmin(actor);
  if (!gate.ok) return gate;
  if (actor.id === userId) return { ok: false, error: "ไม่สามารถเปลี่ยนบทบาทของตนเองได้" };

  const target = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!target) return { ok: false, error: "ไม่พบผู้ใช้" };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  await writeAuditLog(actor.id, "อัปเดตสิทธิ์", target.username, `เปลี่ยนสิทธิ์เป็น ${role}`);
  return { ok: true };
}

export async function updateManagedUserDepartment(
  actor: User,
  userId: string,
  departmentId: string,
): Promise<AdminResult> {
  const gate = requireAdmin(actor);
  if (!gate.ok) return gate;
  if (actor.id === userId) return { ok: false, error: "ไม่สามารถเปลี่ยนแผนกของตนเองได้" };

  const target = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!target) return { ok: false, error: "ไม่พบผู้ใช้" };

  const dept = await prisma.department.findFirst({
    where: { id: departmentId, deletedAt: null },
  });
  if (!dept) return { ok: false, error: "แผนกไม่ถูกต้อง" };

  await prisma.user.update({ where: { id: userId }, data: { departmentId } });
  await writeAuditLog(actor.id, "อัปเดตแผนก", target.username, `ย้ายไปแผนก ${dept.name}`);
  return { ok: true };
}

export async function softDeleteManagedUser(actor: User, userId: string): Promise<AdminResult> {
  const gate = requireAdmin(actor);
  if (!gate.ok) return gate;
  if (actor.id === userId) return { ok: false, error: "ไม่สามารถลบบัญชีของตนเองได้" };

  const target = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!target) return { ok: false, error: "ไม่พบผู้ใช้" };
  if (target.role === "admin") return { ok: false, error: "ไม่สามารถลบผู้ดูแลระบบได้" };

  const now = new Date();
  await prisma.user.update({ where: { id: userId }, data: { deletedAt: now } });
  await writeAuditLog(actor.id, "ลบผู้ใช้", target.username, `ลบผู้ใช้ ${target.name}`);
  return { ok: true };
}

export async function createManagedDepartment(
  actor: User,
  input: { slug: string; name: string; shortName: string },
): Promise<AdminResult> {
  const gate = requireAdmin(actor);
  if (!gate.ok) return gate;

  const name = input.name.trim();
  const shortName = input.shortName.trim();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!slug) return { ok: false, error: "กรุณาระบุรหัสแผนก" };
  if (!name) return { ok: false, error: "กรุณาระบุชื่อแผนก" };
  if (!shortName) return { ok: false, error: "กรุณาระบุชื่อย่อ" };

  const id = slug.startsWith("dept-") ? slug : `dept-${slug}`;
  const existing = await prisma.department.findUnique({ where: { id } });
  if (existing && !existing.deletedAt) return { ok: false, error: "รหัสแผนกนี้มีอยู่แล้ว" };

  const nameTaken = await prisma.department.findFirst({
    where: { name, deletedAt: null, ...(existing ? { id: { not: id } } : {}) },
  });
  if (nameTaken) return { ok: false, error: "ชื่อแผนกนี้มีอยู่แล้ว" };

  if (existing?.deletedAt) {
    await prisma.department.update({
      where: { id },
      data: { name, shortName, deletedAt: null },
    });
    await writeAuditLog(actor.id, "สร้างแผนก", id, `กู้คืนแผนก · ${name}`);
    return { ok: true };
  }

  await prisma.department.create({ data: { id, name, shortName } });
  await writeAuditLog(actor.id, "สร้างแผนก", id, `ชื่อแผนก: ${name}`);
  return { ok: true };
}

export async function updateManagedDepartment(
  actor: User,
  id: string,
  input: { name: string; shortName: string },
): Promise<AdminResult> {
  const gate = requireAdmin(actor);
  if (!gate.ok) return gate;

  const name = input.name.trim();
  const shortName = input.shortName.trim();
  const target = await prisma.department.findFirst({ where: { id, deletedAt: null } });
  if (!target) return { ok: false, error: "ไม่พบแผนก" };
  if (!name) return { ok: false, error: "กรุณาระบุชื่อแผนก" };
  if (!shortName) return { ok: false, error: "กรุณาระบุชื่อย่อ" };

  const nameTaken = await prisma.department.findFirst({
    where: { name, deletedAt: null, id: { not: id } },
  });
  if (nameTaken) return { ok: false, error: "ชื่อแผนกนี้มีอยู่แล้ว" };

  await prisma.department.update({ where: { id }, data: { name, shortName } });
  await writeAuditLog(actor.id, "แก้ไขแผนก", id, `อัปเดต ${name}`);
  return { ok: true };
}

export async function softDeleteManagedDepartment(
  actor: User,
  id: string,
): Promise<AdminResult> {
  const gate = requireAdmin(actor);
  if (!gate.ok) return gate;

  const target = await prisma.department.findFirst({ where: { id, deletedAt: null } });
  if (!target) return { ok: false, error: "ไม่พบแผนก" };

  const activeCount = await prisma.user.count({
    where: { departmentId: id, deletedAt: null },
  });
  if (activeCount > 0) {
    return { ok: false, error: `มีผู้ใช้ ${activeCount} คนในแผนกนี้ — ย้ายผู้ใช้ก่อนลบ` };
  }

  const now = new Date();
  await prisma.department.update({ where: { id }, data: { deletedAt: now } });
  await writeAuditLog(actor.id, "ลบแผนก", id, `ลบแผนก ${target.name}`);
  return { ok: true };
}
