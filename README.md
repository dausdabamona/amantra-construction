# AMANTRA Construction B2B Platform

Sistem manajemen kontrak konstruksi berbasis termin dengan verifikasi berlapis.

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

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Development

```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.example` files in each directory for required configuration.

## Migration to Supabase

See [docs/migration-guide.md](docs/migration-guide.md) for detailed migration instructions.

## License

Proprietary - AMANTRA Construction
