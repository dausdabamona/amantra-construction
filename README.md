# AMANTRA Construction B2B Platform

Sistem manajemen kontrak konstruksi berbasis termin dengan verifikasi berlapis.

## 🚀 Cara Menjalankan Aplikasi

**📖 [Panduan Lengkap: CARA-MENJALANKAN.md](./CARA-MENJALANKAN.md)**

Panduan lengkap dalam Bahasa Indonesia yang mencakup:
- Persiapan awal dan instalasi
- Setup backend dan frontend
- Cara menjalankan aplikasi
- Akun demo untuk testing
- Troubleshooting lengkap

**Quick Start:**
```bash
# Backend
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run start:dev

# Frontend (terminal baru)
cd frontend
npm install
npm run dev
```

Akses: http://localhost:3000 (Frontend) | http://localhost:3001/docs (API Docs)

---

## Overview

AMANTRA (Amanah Manajemen Transaksi) adalah platform B2B untuk industri konstruksi yang menyediakan:

- **Kontrak Berbasis Termin**: Pembayaran bertahap berdasarkan milestone pekerjaan
- **Verifikasi Berlapis**: Setiap progres harus diverifikasi oleh pengawas dan saksi ahli
- **Audit Trail**: Pencatatan lengkap setiap aktivitas dengan bukti digital
- **Siap Web3**: Arsitektur yang siap terhubung dengan smart contract AmantraLedger

## Project Structure

```
amantra-construction/
├── frontend/          # Next.js PWA (bilingual ID/EN)
├── backend/           # NestJS API with Prisma ORM
├── database/          # Migrations & seeds
│   ├── migrations/
│   └── seeds/
└── docs/              # Documentation
    ├── diagrams/      # ERD, flowcharts
    └── api/           # API specifications
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, PWA |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | SQLite (dev) → PostgreSQL/Supabase (prod) |
| Auth | JWT + Role-based Access Control |

## User Roles

| Role | Bahasa Indonesia | Description |
|------|------------------|-------------|
| OWNER | Pemberi Kerja | Project owner, initiates contracts and confirms payments |
| CONTRACTOR | Kontraktor | Executes construction work and uploads progress |
| SUPERVISOR | Pengawas | Verifies work progress |
| WITNESS | Saksi Ahli | Technical expert verification |

## Business Flow

```
1. Create Project (Owner)
       ↓
2. Create Contract (Owner + Contractor)
       ↓
3. Define Work Phases/Termin
       ↓
4. Upload Progress Report (Contractor)
       ↓
5. Verification (Supervisor + Witness)
       ↓
6. Phase Approval
       ↓
7. Payment Trigger (simulation)
       ↓
All activities → Audit Log
```

## Demo Accounts

Aplikasi sudah dilengkapi dengan 4 akun demo:

| Role | Email | Password | Fungsi |
|------|-------|----------|--------|
| Owner | owner@amantra.id | Password123! | Membuat proyek, kontrak, verifikasi pembayaran |
| Contractor | kontraktor@amantra.id | Password123! | Upload progress, submit verifikasi |
| Supervisor | pengawas@amantra.id | Password123! | Verifikasi progress (approval pertama) |
| Witness | saksi@amantra.id | Password123! | Verifikasi teknis (approval kedua) |

## Environment Variables

Backend: Copy `backend/.env.example` to `backend/.env` (sudah siap pakai untuk development)  
Frontend: Otomatis menggunakan `http://localhost:3001/api/v1` (tidak perlu konfigurasi)

## Migration to Supabase

See [docs/migration-guide.md](docs/migration-guide.md) for detailed migration instructions.

## License

Proprietary - AMANTRA Construction
