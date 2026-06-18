@docs/SPEC.md

# IOC System — Agent Rules

## Workflow

ก่อน implement ฟีเจอร์ แก้พฤติกรรม สิทธิ์ หรือกฎธุรกิจ → **อ่าน [`docs/SPEC.md`](docs/SPEC.md) ทุกครั้ง**

- โฟกัส section ตามเฟสปัจจุบัน (ตอนนี้ **Staff** — สิทธิ์ Staff + Ticket Specifications)
- ถ้า SPEC ไม่ครบ → อัปเดต SPEC หรือใส่ `TODO` ห้ามเดาเอง
- งาน UI ล้วน (layout, สี) ไม่ต้องอ่านทั้งไฟล์ แต่ถ้าแตะ flow คำร้อง ปุ่ม หรือสิทธิ์ ต้องเช็ค SPEC ก่อน

## กฎทั่วไป

- Mock data only จนกว่าจะมี Prisma/API
- UI ภาษาไทย, Tailwind v4, light theme — ดู [`DESIGN.md`](DESIGN.md) และใช้ `Card` / `PageHeader` / class `ioc-*` ใน `globals.css` ก่อนสร้างสไตล์ใหม่
- พัฒนาตาม role เป็นเฟส: Staff → Officer → Manager → Admin
- ห้ามคาดเดาฟีเจอร์นอก SPEC — ใส่ TODO แทน

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
