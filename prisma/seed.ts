/**
 * ข้อมูลตัวอย่างสำหรับอธิบาย workflow — รหัสผ่านทุกบัญชี: password123
 * รัน: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
const DEMO_PASSWORD = "password123";

const d = (iso: string) => new Date(iso);

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.ticketStatusHistory.deleteMany(),
    prisma.progressNote.deleteMany(),
    prisma.ticketComment.deleteMany(),
    prisma.ticketAttachment.deleteMany(),
    prisma.ticketEvaluation.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.user.deleteMany(),
    prisma.department.deleteMany(),
  ]);

  await prisma.department.createMany({
    data: [
      { id: "dept-it", name: "เทคโนโลยีสารสนเทศ", shortName: "IT" },
      { id: "dept-hr", name: "ทรัพยากรบุคคล", shortName: "HR" },
      { id: "dept-finance", name: "การเงิน", shortName: "Finance" },
      { id: "dept-admin", name: "บริหารทั่วไป", shortName: "Admin" },
      {
        id: "dept-old",
        name: "แผนกเลิกใช้ (ตัวอย่าง)",
        shortName: "Old",
        deletedAt: d("2024-05-20T11:00:00Z"),
      },
    ],
  });

  await prisma.user.createMany({
    data: [
      {
        id: "staff-001",
        username: "staff1",
        name: "สมชาย ใจดี",
        role: "staff",
        departmentId: "dept-it",
        passwordHash,
      },
      {
        id: "staff-002",
        username: "staff2",
        name: "มานี มีสุข",
        role: "staff",
        departmentId: "dept-hr",
        passwordHash,
      },
      {
        id: "officer-001",
        username: "officer1",
        name: "วิชัย เจ้าหน้าที่",
        role: "officer",
        departmentId: "dept-it",
        passwordHash,
      },
      {
        id: "officer-002",
        username: "officer2",
        name: "สุดา รับเรื่อง",
        role: "officer",
        departmentId: "dept-it",
        passwordHash,
      },
      {
        id: "officer-003",
        username: "officer3",
        name: "ประเสริฐ ข้ามแผนก",
        role: "officer",
        departmentId: "dept-hr",
        passwordHash,
      },
      {
        id: "manager-001",
        username: "manager1",
        name: "สมศักดิ์ ผู้จัดการ",
        role: "manager",
        departmentId: "dept-it",
        passwordHash,
      },
      {
        id: "manager-002",
        username: "manager2",
        name: "วราภรณ์ ผู้จัดการ",
        role: "manager",
        departmentId: "dept-hr",
        passwordHash,
      },
      {
        id: "admin-001",
        username: "admin1",
        name: "ผู้ดูแล ระบบ",
        role: "admin",
        departmentId: "dept-admin",
        passwordHash,
      },
      {
        id: "staff-legacy",
        username: "staff_legacy",
        name: "ผู้ใช้เก่า (ตัวอย่าง soft delete)",
        role: "staff",
        departmentId: "dept-old",
        passwordHash,
        deletedAt: d("2024-06-05T09:15:00Z"),
      },
    ],
  });

  // EX-01 คำร้องใหม่ — ยังไม่มีผู้รับเรื่อง
  await prisma.ticket.create({
    data: {
      id: "tkt-ex-01",
      ticketNo: "IT-20260619-001",
      title: "คอมพิวเตอร์เปิดไม่ติด",
      description: "คอมพิวเตอร์ตั้งโต๊ะชั้น 3 เปิดไม่ติด ไฟ power ไม่เข้า\nแผนก: IT",
      priority: "HIGH",
      status: "WAITING_ACK",
      departmentId: "dept-it",
      requesterId: "staff-001",
      scheduledStartAt: d("2026-06-20T01:00:00Z"),
      scheduledEndAt: d("2026-06-20T09:00:00Z"),
      statusHistory: { create: { status: "WAITING_ACK", at: d("2026-06-19T08:00:00Z") } },
    },
  });

  // EX-02 กำลังประเมิน — รับเรื่องแล้ว ยังไม่มีผลประเมิน
  await prisma.ticket.create({
    data: {
      id: "tkt-ex-02",
      ticketNo: "IT-20260618-001",
      title: "ขอติดตั้งโปรแกรมใหม่",
      description: "ต้องการติดตั้ง Adobe Acrobat บนเครื่องใหม่",
      priority: "MEDIUM",
      status: "WAITING_ACK",
      departmentId: "dept-it",
      requesterId: "staff-001",
      receivedById: "officer-001",
      assigneeId: "officer-001",
      scheduledStartAt: d("2026-06-21T01:00:00Z"),
      scheduledEndAt: d("2026-06-21T09:00:00Z"),
      statusHistory: {
        create: [
          { status: "WAITING_ACK", at: d("2026-06-18T08:00:00Z") },
          {
            status: "WAITING_ACK",
            note: "วิชัย เจ้าหน้าที่ รับเรื่องเพื่อตรวจสอบ",
            at: d("2026-06-18T09:00:00Z"),
          },
        ],
      },
    },
  });

  // EX-03 รออนุมัติ — มีผลประเมิน + ค่าใช้จ่าย
  await prisma.ticket.create({
    data: {
      id: "tkt-ex-03",
      ticketNo: "IT-20260617-001",
      title: "เครื่องพิมพ์ติดกระดาษ",
      description: "เครื่องพิมพ์ชั้น 2 ติดกระดาษบ่อย ต้องการตรวจซ่อม",
      priority: "HIGH",
      status: "PENDING_APPROVAL",
      departmentId: "dept-it",
      requesterId: "staff-001",
      receivedById: "officer-001",
      assigneeId: "officer-001",
      scheduledStartAt: d("2026-06-19T03:00:00Z"),
      scheduledEndAt: d("2026-06-19T09:00:00Z"),
      evaluation: {
        create: {
          diagnosis: "ตรวจพบหัวพิมพ์สึก ต้องส่งศูนย์ซ่อม",
          estimatedCost: 2500,
          notes: "ส่งขออนุมัติก่อนสั่งซ่อม",
          evaluatedById: "officer-001",
          evaluatedAt: d("2026-06-18T10:45:00Z"),
        },
      },
      statusHistory: {
        create: [
          { status: "WAITING_ACK", at: d("2026-06-17T08:00:00Z") },
          {
            status: "WAITING_ACK",
            note: "วิชัย เจ้าหน้าที่ รับเรื่องเพื่อตรวจสอบ",
            at: d("2026-06-17T09:00:00Z"),
          },
          {
            status: "PENDING_APPROVAL",
            note: "วิชัย เจ้าหน้าที่ ส่งเรื่องขออนุมัติ",
            at: d("2026-06-18T11:00:00Z"),
          },
        ],
      },
    },
  });

  // EX-04 กำลังดำเนินการ — ตัวอย่างขั้นหลังอนุมัติ (officer1 รับผิดชอบ, เจ้าหน้าที่แผนก IT อื่นเห็นในกล่องงาน)
  await prisma.ticket.create({
    data: {
      id: "tkt-ex-04",
      ticketNo: "IT-20260614-001",
      title: "อัปเกรด RAM เครื่องทำงาน",
      description: "เครื่องช้า ขอเพิ่ม RAM เป็น 16GB",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      departmentId: "dept-it",
      requesterId: "staff-001",
      receivedById: "officer-001",
      assigneeId: "officer-001",
      scheduledStartAt: d("2026-06-16T01:00:00Z"),
      scheduledEndAt: d("2026-06-16T09:00:00Z"),
      evaluation: {
        create: {
          diagnosis: "RAM 8GB ไม่พอ แนะนำอัปเกรด 16GB",
          estimatedCost: 1800,
          evaluatedById: "officer-001",
          evaluatedAt: d("2026-06-15T10:00:00Z"),
        },
      },
      progressNotes: {
        create: {
          authorId: "officer-001",
          content: "สั่ง RAM แล้ว รอของเข้าคลัง",
          createdAt: d("2026-06-16T06:00:00Z"),
        },
      },
      statusHistory: {
        create: [
          { status: "WAITING_ACK", at: d("2026-06-14T08:00:00Z") },
          {
            status: "WAITING_ACK",
            note: "วิชัย เจ้าหน้าที่ รับเรื่องเพื่อตรวจสอบ",
            at: d("2026-06-14T09:00:00Z"),
          },
          {
            status: "PENDING_APPROVAL",
            note: "วิชัย เจ้าหน้าที่ ส่งเรื่องขออนุมัติ",
            at: d("2026-06-15T10:30:00Z"),
          },
          {
            status: "IN_PROGRESS",
            note: "สมศักดิ์ ผู้จัดการ อนุมัติให้ดำเนินการ",
            at: d("2026-06-15T14:00:00Z"),
          },
        ],
      },
    },
  });

  // EX-05 เสร็จสมบูรณ์
  await prisma.ticket.create({
    data: {
      id: "tkt-ex-05",
      ticketNo: "IT-20260608-001",
      title: "ขอเบิกกระดาษ A4",
      description: "ขอเบิกกระดาษ A4 จำนวน 5 รีม สำหรับงานธุรการ",
      priority: "LOW",
      status: "COMPLETED",
      departmentId: "dept-it",
      requesterId: "staff-001",
      receivedById: "officer-001",
      assigneeId: "officer-001",
      scheduledStartAt: d("2026-06-10T01:00:00Z"),
      scheduledEndAt: d("2026-06-10T09:00:00Z"),
      evaluation: {
        create: {
          diagnosis: "มีสต็อกกระดาษ A4 เพียงพอในคลัง",
          notes: "เบิกจากคลังชั้น B",
          evaluatedById: "officer-001",
          evaluatedAt: d("2026-06-09T09:30:00Z"),
        },
      },
      statusHistory: {
        create: [
          { status: "WAITING_ACK", at: d("2026-06-08T08:00:00Z") },
          {
            status: "WAITING_ACK",
            note: "วิชัย เจ้าหน้าที่ รับเรื่องเพื่อตรวจสอบ",
            at: d("2026-06-08T09:00:00Z"),
          },
          {
            status: "PENDING_APPROVAL",
            at: d("2026-06-09T10:00:00Z"),
          },
          {
            status: "IN_PROGRESS",
            note: "สมศักดิ์ ผู้จัดการ อนุมัติให้ดำเนินการ",
            at: d("2026-06-09T11:00:00Z"),
          },
          {
            status: "COMPLETED",
            note: "วิชัย เจ้าหน้าที่ ส่งมอบ/ปิดงาน: จัดส่งกระดาษเรียบร้อย",
            at: d("2026-06-10T16:00:00Z"),
          },
        ],
      },
    },
  });

  // EX-06 ปฏิเสธ
  await prisma.ticket.create({
    data: {
      id: "tkt-ex-06",
      ticketNo: "HR-20260613-001",
      title: "ขอเปลี่ยนกะการทำงานชั่วคราว",
      description: "ขอเปลี่ยนกะเดือนกรกฎาคม เนื่องจากเรียนต่อ",
      priority: "MEDIUM",
      status: "REJECTED",
      departmentId: "dept-hr",
      requesterId: "staff-002",
      receivedById: "officer-003",
      assigneeId: "officer-003",
      scheduledStartAt: d("2026-07-01T01:00:00Z"),
      scheduledEndAt: d("2026-07-31T09:00:00Z"),
      evaluation: {
        create: {
          diagnosis: "ตรวจสอบตารางงานแล้ว ตำแหน่งไม่รองรับการเปลี่ยนกะชั่วคราว",
          evaluatedById: "officer-003",
          evaluatedAt: d("2026-06-14T01:00:00Z"),
        },
      },
      comments: {
        create: {
          authorId: "manager-002",
          content: "ตารางงานเดือนกรกฎาคนเต็ม ไม่สามารถเปลี่ยนกะได้",
          createdAt: d("2026-06-14T02:00:00Z"),
          updatedAt: d("2026-06-14T02:00:00Z"),
        },
      },
      statusHistory: {
        create: [
          { status: "WAITING_ACK", at: d("2026-06-13T04:00:00Z") },
          {
            status: "WAITING_ACK",
            note: "ประเสริฐ ข้ามแผนก รับเรื่องเพื่อตรวจสอบ",
            at: d("2026-06-13T05:00:00Z"),
          },
          {
            status: "PENDING_APPROVAL",
            at: d("2026-06-14T01:30:00Z"),
          },
          {
            status: "REJECTED",
            note: "วราภรณ์ ผู้จัดการ ปฏิเสธ: ตารางงานเดือนกรกฎาคนเต็ม",
            at: d("2026-06-14T02:30:00Z"),
          },
        ],
      },
    },
  });

  // EX-07 HR — คำร้องใหม่ (แผนก HR)
  await prisma.ticket.create({
    data: {
      id: "tkt-ex-07",
      ticketNo: "HR-20260619-001",
      title: "ขอลาพักร้อน 3 วัน",
      description: "ขอลาพักร้อนวันที่ 25-27 มิ.ย. 2569",
      priority: "MEDIUM",
      status: "WAITING_ACK",
      departmentId: "dept-hr",
      requesterId: "staff-002",
      scheduledStartAt: d("2026-06-25T01:00:00Z"),
      scheduledEndAt: d("2026-06-27T09:00:00Z"),
      statusHistory: { create: { status: "WAITING_ACK", at: d("2026-06-19T07:00:00Z") } },
    },
  });

  // EX-08 ประเมินแล้ว ไม่มีค่าใช้จ่าย (ติ๊กมีค่าใช้จ่ายแต่ไม่ใส่จำนวน — ไม่บังคับ)
  await prisma.ticket.create({
    data: {
      id: "tkt-ex-08",
      ticketNo: "HR-20260618-001",
      title: "ขอสิทธิ์เข้าโฟลเดอร์แชร์",
      description: "ขอสิทธิ์อ่าน/เขียนโฟลเดอร์ Finance-Q2",
      priority: "MEDIUM",
      status: "PENDING_APPROVAL",
      departmentId: "dept-it",
      requesterId: "staff-002",
      receivedById: "officer-002",
      assigneeId: "officer-002",
      scheduledStartAt: d("2026-06-22T01:00:00Z"),
      scheduledEndAt: d("2026-06-22T09:00:00Z"),
      evaluation: {
        create: {
          diagnosis: "ตรวจสอบแล้วผู้ขอมีความจำเป็นใช้งานโฟลเดอร์ตามบทบาท",
          evaluatedById: "officer-002",
          evaluatedAt: d("2026-06-19T08:00:00Z"),
        },
      },
      statusHistory: {
        create: [
          { status: "WAITING_ACK", at: d("2026-06-18T08:00:00Z") },
          {
            status: "WAITING_ACK",
            note: "สุดา รับเรื่อง รับเรื่องเพื่อตรวจสอบ",
            at: d("2026-06-18T09:00:00Z"),
          },
          {
            status: "PENDING_APPROVAL",
            note: "สุดา รับเรื่อง ส่งเรื่องขออนุมัติ",
            at: d("2026-06-19T08:30:00Z"),
          },
        ],
      },
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        id: "log-001",
        action: "seed",
        target: "database",
        actorId: "admin-001",
        detail: "โหลดข้อมูลตัวอย่าง IOC workflow",
        createdAt: d("2026-06-19T12:00:00Z"),
      },
    ],
  });

  console.log("Seed OK — บัญชีทดสอบ: staff1 / officer1 / manager1 / admin1 (รหัสผ่าน: password123)");
  console.log("คำร้องตัวอย่าง: IT-20260619-001, HR-20260619-001 ฯลฯ (แผนกผู้ยื่น-วันที่-เลขรัน)");
  console.log("เจ้าหน้าที่ IT: กล่องงาน → งานของฉัน มีตัวอย่างครบทุกขั้น workflow");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
