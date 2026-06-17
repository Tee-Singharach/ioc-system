# IOC System — เอกสารโปรเจกต

ระบบบริหารจัดการคำร้องภายในองค์กร (Internal Ticket Management System) ที่ออกแบบมาเพื่อเพิ่มประสิทธิภาพในการติดตามงานและการสื่อสารระหว่างแผนก

## Tech Stack

* **Frontend/Backend:** Next.js
* **Database Management:** Prisma ORM
* **Database:** MySQL (Hosted on Plesk)
* **Icons:** Lucide Icons
* **Visualization:** Impeccable Graphify

---

## สิทธิ์การใช้งาน (User Roles & Permissions)

### 1. พนักงาน (Staff)

* เข้าสู่ระบบและออกจากระบบ (Login / Logout)
* รีเซ็ตรหัสผ่าน (Reset Password)
* ดูรายการคำร้องของตนเอง (View Ticket List)
* สร้างคำร้องใหม่พร้อมแนบไฟล์ (Create Ticket & Attach Files)
* จัดการความคิดเห็น (Create, Edit, Delete Comment)
* ติดตามสถานะงาน (Track Status)
* แก้ไขข้อมูลคำร้อง (เฉพาะก่อนเจ้าหน้าที่รับงาน)
* ยกเลิกคำร้อง (ไม่อนุญาตหากสถานะเป็น "เสร็จสมบูรณ์")
* แก้ไขและส่งคำร้องใหม่กรณีถูกปฏิเสธ (Resubmit after Reject)

### 2. เจ้าหน้าที่ (Officer)

* รับเรื่องและเริ่มดำเนินการ (Receive Ticket)
* ปรับปรุงสถานะงาน (Update Status)
* มอบหมายงาน (Assign Ticket)
* รายงานความคืบหน้า (Update Progress)
* บริหารจัดการลำดับขั้นตอนงาน (Workflow Management)
* มอบหมายงานข้ามแผนกตามโครงสร้างองค์กร (Cross-department Assignment)

### 3. ผู้จัดการ (Manager)

* อนุมัติคำร้อง (Approve Ticket)
* ปฏิเสธคำร้องพร้อมระบุเหตุผล (Reject Ticket with Comment)
* ตรวจสอบประวัติการอนุมัติ (View Approval History)
* ตรวจสอบภาพรวมผ่าน Dashboard (View Dashboard)

### 4. ผู้ดูแลระบบ (Admin)

* บริหารจัดการผู้ใช้งานและสิทธิ์การเข้าถึง (User & Role Management)
* บริหารจัดการข้อมูลแผนก (Department Management)
* ตรวจสอบบันทึกกิจกรรมย้อนหลัง (View Audit Logs)
* จัดการการลบข้อมูลแบบชั่วคราว (Soft Delete)

---

## ข้อมูลและระบบการทำงาน (System Specifications)

### ระบบยืนยันตัวตน (Authentication)

* ยืนยันตัวตนด้วย Username และ Password
* ระบบรีเซ็ตรหัสผ่าน
* บริหารจัดการ Session ด้วย JWT และตรวจสอบการหมดอายุ (Session Expiration)

### ข้อกำหนดของคำร้อง (Ticket Specifications)

* **ข้อมูลพื้นฐาน:** หัวข้อ (Title), รายละเอียด (Description), ระดับความสำคัญ (Priority), แผนกที่เกี่ยวข้อง (Department), ไฟล์แนบ (Attachment)
* **เงื่อนไขและกฎธุรกิจ:**
    * ขนาดไฟล์แนบรวมไม่เกิน 200 MB
    * แก้ไขคำร้องได้เฉพาะ "ก่อน" มีเจ้าหน้าที่รับงานเท่านั้น
    * ห้ามแก้ไขหากมีผู้รับงานแล้ว และห้ามยกเลิกหากสถานะ "เสร็จสมบูรณ์"
    * คำร้องที่ถูกปฏิเสธ (Reject) สามารถแก้ไขและส่งใหม่ (Resubmit) ได้

### ฟีเจอร์ระดับองค์กร (Enterprise Features)

* **Search & Filter:** ระบบค้นหาและกรองข้อมูลขั้นสูง
* **Pagination:** การแบ่งหน้าข้อมูลเพื่อประสิทธิภาพ
* **Soft Delete:** ระบบลบข้อมูลแบบคงสถานะในฐานข้อมูล
* **Audit Logs:** บันทึกประวัติการเปลี่ยนแปลงข้อมูลสำคัญ
* **Error Handling & Rate Limiting:** ระบบจัดการข้อผิดพลาดและความปลอดภัย

---

## ข้อกำหนดในการพัฒนา (Development Guidelines)

1. **Strict Scope:** พัฒนาฟีเจอร์ตามที่ระบุในเอกสารนี้เท่านั้น
2. **Database:** ใช้ Prisma Migration ในการจัดการโครงสร้างฐานข้อมูลเสมอ
3. **Security:** ทุก API Endpoint ต้องผ่านการตรวจสอบสิทธิ์ (AuthN & AuthZ)
4. **Data Integrity:** ข้อมูลสำคัญต้องมี Audit Log บันทึกความเปลี่ยนแปลง
5. **Ambiguity:** หากความต้องการไม่ชัดเจน ให้ทำเครื่องหมาย TODO ไว้ ห้ามคาดเดาเอง
