# 📌 Quick Reference - AMANTRA Construction

Panduan cepat untuk menjalankan dan troubleshooting aplikasi AMANTRA.

---

## 🚀 Perintah Cepat

### Backend (Terminal 1)
```bash
cd backend
npm install              # Install dependencies (pertama kali saja)
npm run db:generate      # Generate Prisma client (pertama kali saja)
npm run db:push          # Setup database (pertama kali saja)
npm run db:seed          # Isi data demo (pertama kali saja)
npm run start:dev        # Jalankan backend
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install              # Install dependencies (pertama kali saja)
npm run dev              # Jalankan frontend
```

---

## 🔗 URL Penting

| Aplikasi | URL | Deskripsi |
|----------|-----|-----------|
| **Frontend** | http://localhost:3000 | Aplikasi web utama |
| **API Docs** | http://localhost:3001/docs | Swagger/OpenAPI documentation |
| **Prisma Studio** | http://localhost:5555 | Database viewer (jalankan: `npm run db:studio`) |

---

## 🔑 Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@amantra.id | Password123! |
| Contractor | kontraktor@amantra.id | Password123! |
| Supervisor | pengawas@amantra.id | Password123! |
| Witness | saksi@amantra.id | Password123! |

---

## 🔧 Troubleshooting Cepat

### ❌ Port sudah digunakan

**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### ❌ Database error

```bash
cd backend
rm -f prisma/dev.db*  # Hapus database (Linux/Mac)
del prisma\dev.db*    # Hapus database (Windows)
npm run db:push       # Buat database baru
npm run db:seed       # Isi data demo
```

### ❌ Backend tidak jalan

```bash
cd backend
npm install
npm run db:generate
npm run start:dev  # Tidak perlu build untuk dev mode
```

### ❌ Frontend tidak jalan

```bash
cd frontend
npm install
rm -rf .next          # Hapus cache (Linux/Mac)
rmdir /s .next        # Hapus cache (Windows)
npm run dev
```

---

## 📁 Struktur File Penting

```
amantra-construction/
├── backend/
│   ├── .env              ← Konfigurasi backend (copy dari .env.example)
│   ├── prisma/
│   │   ├── dev.db        ← Database SQLite (auto-created di sini!)
│   │   ├── schema.prisma ← Skema database
│   │   └── seed.ts       ← Data demo
│   └── src/
│       ├── auth/         ← Authentication
│       ├── projects/     ← Manajemen proyek
│       ├── terms/        ← Termin/milestone
│       └── main.ts       ← Entry point backend
│
├── frontend/
│   ├── .env.local        ← (Opsional) Konfigurasi frontend
│   └── src/
│       ├── pages/        ← Halaman aplikasi
│       ├── services/     ← API integration
│       └── contexts/     ← State management
│
└── docs/                 ← Dokumentasi
```

---

## 🔍 Cek Status Aplikasi

### Backend berjalan?
```bash
curl http://localhost:3001/api/v1
# atau buka: http://localhost:3001/docs
```

### Frontend berjalan?
```bash
curl http://localhost:3000
# atau buka: http://localhost:3000
```

### Database terisi?
```bash
cd backend
npm run db:studio
# Cek tabel Users, Projects, dll
```

---

## 🛠️ Perintah Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Migrate database
npm run db:migrate

# Seed data demo
npm run db:seed

# Reset semua (HATI-HATI!)
npm run db:reset

# Buka database viewer
npm run db:studio

# Push schema tanpa migration
npm run db:push
```

---

## 📝 Log Files

### Backend Logs
```
backend/logs/
├── error.log           ← Error messages
├── combined.log        ← Semua log
└── app-YYYY-MM-DD.log  ← Daily logs
```

### Frontend Logs
- Lihat di browser DevTools (F12) > Console
- Lihat di terminal tempat `npm run dev` berjalan

---

## 🎯 Testing Workflow

### 1. Login sebagai Owner
1. Buka http://localhost:3000
2. Login dengan: owner@amantra.id / Password123!
3. Cek Dashboard ada data proyek

### 2. Cek API via Swagger
1. Buka http://localhost:3001/docs
2. Klik "Authorize" 
3. Login via `/auth/login`
4. Copy token dari response
5. Paste token di Authorize
6. Test endpoint lainnya

### 3. Cek Database
```bash
cd backend
npm run db:studio
```
- Buka http://localhost:5555
- Cek tabel Users, Projects, Terms, dll

---

## 🔄 Reset Aplikasi

### Reset Database (kehilangan semua data!)
```bash
cd backend
rm -f prisma/dev.db*    # Linux/Mac
del prisma\dev.db*      # Windows
npm run db:push
npm run db:seed
```

### Reset Node Modules
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

---

## 📞 Butuh Bantuan?

1. **Baca panduan lengkap:** [CARA-MENJALANKAN.md](./CARA-MENJALANKAN.md)
2. **Cek dokumentasi:** Folder `/docs`
3. **Lihat error logs:**
   - Backend: Terminal backend atau `backend/logs/`
   - Frontend: Browser DevTools (F12) > Console
4. **Test API:** http://localhost:3001/docs

---

## 💡 Tips

- **Selalu buka 2 terminal:** Satu untuk backend, satu untuk frontend
- **Jangan tutup terminal** saat aplikasi berjalan
- **Cek logs** jika ada error
- **Gunakan Swagger** untuk test API langsung
- **Gunakan Prisma Studio** untuk lihat/edit database
- **Clear browser cache** jika ada masalah UI

---

**Versi:** 1.0  
**Update:** 24 Januari 2026
