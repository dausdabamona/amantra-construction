# AMANTRA Construction MVP 0.1 - Arsitektur Sistem

## Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AMANTRA CONSTRUCTION MVP 0.1                        │
│                    Sistem Kontrak Konstruksi Berbasis Amanah                │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   BROWSER   │
                              │  (Next.js)  │
                              └──────┬──────┘
                                     │
                                     │ HTTP/REST
                                     │
                              ┌──────▼──────┐
                              │   BACKEND   │
                              │  (NestJS)   │
                              │             │
                              │ ┌─────────┐ │
                              │ │   JWT   │ │
                              │ │  Auth   │ │
                              │ └─────────┘ │
                              └──────┬──────┘
                                     │
                                     │ Prisma ORM
                                     │
                              ┌──────▼──────┐
                              │   SQLite    │
                              │  Database   │
                              └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              4 USER ROLES                                   │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│     OWNER       │   KONTRAKTOR    │    PENGAWAS     │        SAKSI          │
│                 │                 │                 │                       │
│ • Buat Proyek   │ • Upload Progres│ • Verifikasi    │ • Verifikasi          │
│ • Buat Kontrak  │ • Input Deskripsi│ • Setuju/Tolak │ • Setuju/Tolak        │
│ • Input Termin  │ • Klaim Persen  │                 │                       │
│ • Lihat Status  │                 │                 │                       │
│ • Upload Bukti  │                 │                 │                       │
│   Transfer      │                 │                 │                       │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

## Alur Bisnis MVP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ALUR TERMIN AMANTRA                               │
└─────────────────────────────────────────────────────────────────────────────┘

  OWNER                 KONTRAKTOR              PENGAWAS              SAKSI
    │                       │                      │                    │
    │ 1. Buat Proyek        │                      │                    │
    │────────────────►      │                      │                    │
    │                       │                      │                    │
    │ 2. Buat Kontrak       │                      │                    │
    │    + Termin           │                      │                    │
    │────────────────►      │                      │                    │
    │                       │                      │                    │
    │                       │ 3. Upload Progres    │                    │
    │                       │    (Foto+Deskripsi)  │                    │
    │                       │─────────────────────►│                    │
    │                       │                      │                    │
    │                       │                      │ 4. Verifikasi      │
    │                       │                      │    (Setuju/Tolak)  │
    │                       │                      │────────────────────►
    │                       │                      │                    │
    │                       │                      │                    │ 5. Verifikasi
    │                       │                      │                    │    (Setuju/Tolak)
    │                       │                      │◄───────────────────│
    │                       │                      │                    │
    │                       │                      │                    │
    │◄──────────────────────┴──────────────────────┴────────────────────┘
    │         6. Jika 2 Setuju → Status = VALID / SIAP DIBAYAR
    │
    │ 7. Upload Bukti Transfer
    │──────────────────►
    │
    │         8. Status = TERBAYAR
    │
    ▼
 [SELESAI] → Lanjut Termin Berikutnya
```

## Status Termin

```
┌──────────┐     ┌──────────┐     ┌─────────────┐     ┌───────┐     ┌──────────┐
│  DRAFT   │────►│ DIAJUKAN │────►│ DIVERIFIKASI│────►│ VALID │────►│ TERBAYAR │
└──────────┘     └──────────┘     └─────────────┘     └───────┘     └──────────┘
     │                │                  │
     │                │                  │ (Jika ditolak)
     │                │                  ▼
     │                │           ┌──────────┐
     │                └──────────►│ DITOLAK  │
     │                            └────┬─────┘
     │                                 │
     └─────────────────────────────────┘ (Revisi & ajukan ulang)
```

## Stack Teknologi

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Frontend | Next.js 14 + TypeScript | SSR, mudah deploy, PWA ready |
| Styling | Tailwind CSS | Cepat, konsisten, responsive |
| Backend | NestJS + TypeScript | Terstruktur, dokumentasi otomatis |
| ORM | Prisma | Type-safe, migrasi mudah |
| Database | SQLite (dev) → PostgreSQL (prod) | Simple untuk MVP |
| Auth | JWT | Stateless, simple |
| File Storage | Local (dev) → S3 (prod) | Simulasi dulu |

## Struktur Folder

```
amantra-construction/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.ts                # Demo data
│   ├── src/
│   │   ├── main.ts                # Entry point
│   │   ├── app.module.ts          # Root module
│   │   ├── prisma/                # Prisma service
│   │   ├── auth/                  # Authentication
│   │   ├── users/                 # User management
│   │   ├── projects/              # Project CRUD
│   │   ├── contracts/             # Contract CRUD
│   │   ├── terms/                 # Term/Termin CRUD
│   │   ├── progress/              # Progress upload
│   │   ├── verifications/         # Verification logic
│   │   ├── payments/              # Payment status
│   │   └── audit/                 # Audit logging
│   └── uploads/                   # Local file storage
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx          # Landing
│   │   │   ├── login.tsx          # Login
│   │   │   ├── dashboard.tsx      # Dashboard
│   │   │   ├── projects/
│   │   │   │   ├── index.tsx      # Daftar proyek
│   │   │   │   ├── [id].tsx       # Detail proyek
│   │   │   │   └── new.tsx        # Buat proyek baru
│   │   │   ├── terms/
│   │   │   │   └── [id].tsx       # Detail termin + progres
│   │   │   └── verify/
│   │   │       └── [id].tsx       # Halaman verifikasi
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── TermCard.tsx
│   │   │   ├── ProgressForm.tsx
│   │   │   └── VerifyForm.tsx
│   │   ├── lib/
│   │   │   ├── api.ts             # API client
│   │   │   └── auth.ts            # Auth helpers
│   │   └── store/
│   │       └── auth.ts            # Auth state
│   └── public/
│
└── docs/
    ├── MVP-ARCHITECTURE.md
    ├── API-SPEC.md
    └── SPRINT-PLAN.md
```

## Wireframe (Text)

### 1. Login Page
```
┌──────────────────────────────────────────┐
│           AMANTRA Construction           │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Email: [________________]          │  │
│  │ Password: [________________]       │  │
│  │                                    │  │
│  │ Role: [▼ Pilih Role           ]   │  │
│  │   • Owner                          │  │
│  │   • Kontraktor                     │  │
│  │   • Pengawas                       │  │
│  │   • Saksi                          │  │
│  │                                    │  │
│  │         [ MASUK ]                  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 2. Dashboard (Owner)
```
┌──────────────────────────────────────────────────────────────┐
│ AMANTRA  │ Dashboard │ Proyek │                    │ Logout │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Selamat Datang, Budi (Owner)                               │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ RINGKASAN                                               ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   ││
│  │  │ 3       │  │ 5       │  │ 2       │  │ 1       │   ││
│  │  │ Proyek  │  │ Termin  │  │ Pending │  │ Siap    │   ││
│  │  │ Aktif   │  │ Aktif   │  │ Verify  │  │ Bayar   │   ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  PROYEK TERBARU                            [ + Buat Proyek ] │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Gedung Kantor A        │ Rp 5.000.000.000 │ 60% │ ►   ││
│  │ Renovasi Gudang B      │ Rp 500.000.000   │ 30% │ ►   ││
│  │ Pembangunan Jalan C    │ Rp 2.000.000.000 │ 0%  │ ►   ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 3. Detail Proyek
```
┌──────────────────────────────────────────────────────────────┐
│ ← Kembali                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  GEDUNG KANTOR PT MAJU BERSAMA                              │
│  ────────────────────────────────────────────                │
│  Nilai Kontrak: Rp 5.000.000.000                            │
│  Kontraktor: PT Konstruksi Handal                           │
│  Lokasi: Jl. Sudirman No. 123                               │
│                                                              │
│  DAFTAR TERMIN                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ # │ Nama              │ Nilai       │ Status    │ Aksi ││
│  ├───┼───────────────────┼─────────────┼───────────┼──────┤│
│  │ 1 │ Pekerjaan Pondasi │ Rp 1.5M     │ ✓TERBAYAR │ Lihat││
│  │ 2 │ Struktur Lt 1-2   │ Rp 2.0M     │ ⏳VALID    │ Bayar││
│  │ 3 │ Struktur Lt 3-4   │ Rp 1.5M     │ 🔄DIAJUKAN│ Lihat││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Progress Keseluruhan: [██████████░░░░░░░░░░] 50%           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4. Halaman Termin (Kontraktor)
```
┌──────────────────────────────────────────────────────────────┐
│ ← Kembali ke Proyek                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TERMIN 2: STRUKTUR LANTAI 1-2                              │
│  Status: DIAJUKAN                                           │
│  Nilai: Rp 2.000.000.000 (40% dari kontrak)                 │
│                                                              │
│  ────────────────────────────────────────────                │
│  UPLOAD PROGRES                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  📷 [Klik untuk upload foto]                           ││
│  │                                                         ││
│  │  Deskripsi Pekerjaan:                                  ││
│  │  ┌───────────────────────────────────────────────────┐ ││
│  │  │ Pengecoran kolom lantai 2 selesai 100%           │ ││
│  │  │ Pemasangan bekisting balok sedang berjalan...    │ ││
│  │  └───────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │  Klaim Persentase: [████████░░] 80%                    ││
│  │                                                         ││
│  │              [ SIMPAN DRAFT ]  [ AJUKAN ]              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  RIWAYAT PROGRES                                            │
│  • 15 Jan - 60% - "Kolom lt 1 selesai" - [foto]            │
│  • 10 Jan - 40% - "Pondasi selesai" - [foto]               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5. Halaman Verifikasi (Pengawas/Saksi)
```
┌──────────────────────────────────────────────────────────────┐
│ ← Kembali                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  VERIFIKASI PROGRES                                         │
│  ────────────────────────────────────────────                │
│  Proyek: Gedung Kantor PT Maju Bersama                      │
│  Termin: 2 - Struktur Lantai 1-2                            │
│  Diajukan oleh: Andi Wijaya (Kontraktor)                    │
│  Tanggal: 20 Januari 2024                                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  FOTO PROGRES                                          ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                  ││
│  │  │  📷 1   │ │  📷 2   │ │  📷 3   │                  ││
│  │  └─────────┘ └─────────┘ └─────────┘                  ││
│  │                                                         ││
│  │  Deskripsi: Pengecoran kolom lantai 2 selesai 100%     ││
│  │  Klaim: 80%                                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  STATUS VERIFIKASI                                          │
│  • Pengawas: ⏳ Menunggu                                    │
│  • Saksi: ⏳ Menunggu                                       │
│                                                              │
│  Catatan Verifikasi:                                        │
│  ┌───────────────────────────────────────────────────┐     │
│  │ (Opsional) Masukkan catatan...                    │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
│      [ ❌ TOLAK ]                    [ ✓ SETUJUI ]         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6. Status Pembayaran (Owner)
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  TERMIN 2 - SIAP DIBAYAR ✓                                  │
│  ────────────────────────────────────────────                │
│                                                              │
│  Nilai Termin: Rp 2.000.000.000                             │
│                                                              │
│  Verifikasi:                                                │
│  ✓ Pengawas: Ir. Dewi Lestari - Disetujui (20 Jan)         │
│  ✓ Saksi: Dr. Rahmat Hidayat - Disetujui (21 Jan)          │
│                                                              │
│  ────────────────────────────────────────────                │
│  UPLOAD BUKTI TRANSFER                                      │
│                                                              │
│  📎 [Pilih file bukti transfer...]                          │
│                                                              │
│  Nomor Referensi: [____________________]                    │
│                                                              │
│              [ KONFIRMASI PEMBAYARAN ]                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | /auth/login | Login | All |
| GET | /auth/me | Get current user | All |
| GET | /projects | List projects | All |
| POST | /projects | Create project | Owner |
| GET | /projects/:id | Get project detail | All |
| POST | /projects/:id/contract | Create contract | Owner |
| POST | /contracts/:id/terms | Add terms | Owner |
| GET | /terms/:id | Get term detail | All |
| POST | /terms/:id/progress | Upload progress | Kontraktor |
| POST | /progress/:id/verify | Submit verification | Pengawas, Saksi |
| POST | /terms/:id/pay | Upload payment proof | Owner |
| GET | /audit | Get audit logs | Owner |

## Sprint Plan (2 Minggu)

### Week 1: Foundation
| Hari | Task |
|------|------|
| 1 | Setup project, database schema, seed data |
| 2 | Auth (login, JWT, role guard) |
| 3 | Project & Contract CRUD |
| 4 | Term CRUD + listing |
| 5 | Progress upload (file + form) |

### Week 2: Flow Completion
| Hari | Task |
|------|------|
| 6 | Verification logic (Pengawas + Saksi) |
| 7 | Status update flow (VALID when 2 approve) |
| 8 | Payment upload & confirmation |
| 9 | Audit log + dashboard stats |
| 10 | Testing, bug fixes, deployment |
