# Next-Redis-App

Next-Redis-App เป็นโปรเจกต์ตัวอย่างที่พัฒนาด้วย **Next.js + Redis** สำหรับทดลองระบบ Cache และการทำงานแบบเรียลไทม์ผ่าน Redis Dashboard ผู้ใช้สามารถตรวจสอบสถานะ Redis และทดสอบคำสั่งพื้นฐานได้จากหน้าเว็บเดียว

---

## คุณสมบัติ

- ตรวจสอบสถานะการเชื่อมต่อ Redis (Health Check)
- แสดงข้อมูลระบบจาก Redis (INFO, Memory, Uptime, Clients, Keys)
- Realtime Dashboard (Auto Refresh)
- บันทึกข้อมูลลง Redis (SET + TTL)
- ดึงข้อมูลจาก Redis (GET)
- ล้างข้อมูลทั้งหมด (FLUSHDB)
- UI แบบ Dark / Glass Dashboard
- รองรับการใช้งาน Redis ผ่าน Docker

---

## เทคโนโลยีสแต็ค

**Frontend**
- Next.js (App Router)
- React
- Tailwind CSS v4

**Backend / Cache**
- Redis
- ioredis
- Next.js Route Handlers (REST API)

---

## เริ่มต้นใช้งาน

### 1. โครงการโคลน

```bash
git clone https://github.com/Pachared42/Next-Redis-App.git
cd Next-Redis-App
```

### 2. ติดตั้งส่วนประกอบที่จำเป็น

```bash
npm install
```

### 3. เรียกใช้งาน Redis (Docker)

```bash
docker run -d \
  --name redis-local \
  -p 6379:6379 \
  redis:7
```

### 4. เรียกใช้ Next.js

```bash
npm run dev
```

เปิดใน Browser:

```
http://localhost:3000
```

---

## การกำหนดค่า Redis

ไฟล์: `lib/redis.ts`

```ts
import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

export default redis;
```

---

## จุดเชื่อมต่อ API

| Endpoint | Method | Description |
|----------|--------|------------|
| `/api/redis/health` | GET | ตรวจสอบสถานะ Redis |
| `/api/redis/set` | POST | บันทึกค่าเข้า Redis |
| `/api/redis/get` | GET | อ่านค่าจาก Redis |
| `/api/redis/flush` | POST | ล้างข้อมูลทั้งหมด |

---

## กรณีศึกษา

- ทดลอง Redis Cache
- Redis Monitoring Dashboard
- เรียนรู้การทำงานของ Redis + Next.js
- ตัวอย่างระบบ Realtime
- Debug การเชื่อมต่อ Redis

---

## ใบอนุญาต

โปรเจกต์นี้จัดทำขึ้นเพื่อการศึกษาและทดลองใช้งานเท่านั้น
