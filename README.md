# IOC System

## ติดตั้ง

```bash
npm install
```

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ใช้ทำอะไร |
|--------|-----------|
| `npm run dev` | รัน dev server → [http://localhost:3000](http://localhost:3000) |
| `npm run build` | build สำหรับ production |
| `npm run start` | รัน production server (ต้อง build ก่อน) |
| `npm run lint` | ตรวจสอบ code ด้วย ESLint |

## Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
JWT_SECRET="your-secret-key"
```

## เอกสารโปรเจกต

ดูรายละเอียดฟีเจอร์, สิทธิ์ผู้ใช้ และกฎธุรกิจที่ [docs/SPEC.md](docs/SPEC.md)
