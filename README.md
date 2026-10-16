# WiFi Hotspot System

Mfumo wa WiFi ya Self-Service — MikroTik + M-Pesa Lipa Namba

## Muundo wa Project

- `portal/` — Captive Portal (Frontend) ✅
- `backend/` — API Server (Node.js) 🚧
- `mikrotik/` — Config scripts 🔜
- `admin/` — Admin Dashboard 🔜

## Hatua za Maendeleo

- [x] Hatua A: Captive Portal
- [ ] Hatua B: MikroTik Config
- [ ] Hatua C: Backend + M-Pesa
- [ ] Hatua D: Admin Dashboard

## Tech Stack

- Frontend: HTML, CSS, Vanilla JS
- Backend: Node.js, Express
- Database: MySQL
- Router: MikroTik RouterOS
- Payment: M-Pesa Daraja API

## Kuendesha kwa Majaribio

1. Fungua `portal/index.html` kwenye browser
2. Bonyeza package yoyote → Endelea
3. Weka namba yoyote (mfano 0712345678)
4. Bonyeza "Lipa Sasa"
5. Baada ya sekunde 5, utaona "Malipo Yamefanikiwa" (MOCK MODE)

## Kuendesha Backend

```bash
cd backend
npm install
node server.js
```

Kisha badilisha `CONFIG.MOCK_MODE = false` kwenye `portal/script.js`.
