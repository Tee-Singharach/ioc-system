---
name: IOC System
description: ระบบบริหารจัดการคำร้องภายในองค์กร — light theme, Thai UI
colors:
  background: "#fafafa"
  foreground: "#171717"
  surface: "#ffffff"
  surface-muted: "#fafafa"
  app-bg: "#fafafa"
  border: "#e4e4e7"
  border-subtle: "#f4f4f5"
  ink-primary: "#18181b"
  ink-secondary: "#71717a"
  ink-muted: "#a1a1aa"
  brand: "#2563eb"
  brand-hover: "#1d4ed8"
  danger: "#dc2626"
  success: "#16a34a"
  warning: "#ca8a04"
typography:
  sans:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  sans-bold:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
  mono:
    fontFamily: "var(--font-geist-mono), monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: "0.5rem"
  lg: "0.5rem"
spacing:
  sidebar: "16rem"
  page: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  app-shell-sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-primary}"
    width: "{spacing.sidebar}"
---

## Overview

IOC System ใช้ **light theme** เท่านั้น — พื้นหลัง zinc/neutral อ่อน, sidebar ขาว, accent น้ำเงิน (blue-600) สำหรับ brand และ primary action

Tech: Next.js App Router, Tailwind CSS v4, Lucide icons, Geist Sans/Mono

UI copy ภาษาไทยทั้งหมด

## Colors

| Token | ใช้เมื่อ |
|-------|---------|
| `app-bg` / zinc-50 | พื้นหลังแอปหลัก |
| `surface` / white | sidebar, card, panel |
| `brand` / blue-600 | logo mark, ปุ่ม primary, ลิงก์เน้น |
| zinc-900 / zinc-500 | ข้อความหลัก / รอง |
| semantic badges | yellow/purple/blue/green/red/gray ตามสถานะคำร้อง |

อย่าเพิ่ม gradient หรือ neon accent นอก palette นี้

## Typography

- **Geist Sans** — UI ทั้งหมด (หัวข้อ, ป้าย, ตาราง, ปุ่ม)
- **Geist Mono** — code/ID ถ้าจำเป็น
- สเกล: `text-sm` เป็นค่าเริ่มต้นสำหรับ UI; `text-xs` สำหรับ meta/secondary
- หัวข้อหน้า: `font-bold` + `text-zinc-900`

## Elevation

- การ์ดหลัก: `ioc-card` — พื้น **ขาว**, border + shadow เบา (ไม่ใส่สีฟ้า/gradient บนการ์ด)
- หัวการ์ด: `ioc-card-header` — พื้นขาว + เส้นแบ่งด้านล่าง
- การ์ดว่าง: `Card variant="muted"` — ขาว, ขอบประ, ไม่มี shadow

## Components

- **AppShell**: sidebar 64 (`w-64`), header โลโก้ IOC, nav, user block, logout
- **Card** (`Card`, `CardHeader`, `CardBody`) + class `ioc-*` ใน `globals.css` — panel/card ทุกหน้า
- **PageHeader**: หัวข้อหน้า list/form — `ioc-page-title` + `ioc-page-desc`
- **Button**: variants `primary` | `secondary` | `danger` | `ghost` — `rounded-lg`, `text-sm font-medium`
- **Badge**: สีตาม status/priority — ข้อความภาษาไทยใน badge เสมอ
- **Form controls**: Input, Select, Textarea ใน `src/components/ui/` — คง border zinc และ focus ring สม่ำเสมอ
- **TicketTable / TicketFilters**: ตาราง + กรอง — density ปานกลาง อ่านหลายแถวได้

## Do's and Don'ts

**Do**

- ใช้ component ใน `src/components/ui/` (`Card`, `PageHeader`, `Button`, `Input`…) และ class `ioc-*` ก่อนสร้างใหม่
- คง light theme และภาษาไทย
- สถานะคำร้องแสดงทั้งสีและข้อความ

**Don't**

- Dark mode หรือ theme toggle
- Purple gradient hero / marketing layout
- ปุ่มหรือ input สไตล์ใหม่ที่ไม่ match Button/Input ที่มี
- ข้อความ UI ภาษาอังกฤษ (ยกเว้น code, username, technical constants)
