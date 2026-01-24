# 🔧 Troubleshooting Guide - Error 404

## Masalah: Mendapatkan Error 404

Jika Anda mendapatkan error 404 saat mengakses aplikasi, kemungkinan besar **server tidak berjalan** atau belum di-setup dengan benar.

---

## ✅ Solusi Cepat

### Langkah 1: Pastikan Setup Sudah Dilakukan

Sebelum menjalankan aplikasi, Anda **HARUS** melakukan setup terlebih dahulu:

```bash
# 1. Setup Backend
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed

# 2. Setup Frontend (terminal baru)
cd frontend
npm install
```

### Langkah 2: Jalankan Aplikasi

Setelah setup selesai, jalankan kedua server:

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend (buka terminal baru!)
cd frontend
npm run dev
```

### Langkah 3: Tunggu Hingga Server Siap

**Backend siap ketika muncul pesan:**
```
[Nest] Nest application successfully started
🏗️  AMANTRA Construction API Server started on port 3001
```

**Frontend siap ketika muncul pesan:**
```
✓ Ready in xxxx ms
- Local:        http://localhost:3000
```

### Langkah 4: Akses Aplikasi

Setelah kedua server berjalan:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/docs

---

## 🔍 Cek Status Server

### Cara Mengecek Apakah Server Berjalan

**Windows (PowerShell):**
```powershell
# Cek Backend (port 3001)
Test-NetConnection -ComputerName localhost -Port 3001

# Cek Frontend (port 3000)
Test-NetConnection -ComputerName localhost -Port 3000
```

**Windows (Command Prompt):**
```cmd
netstat -ano | findstr :3001
netstat -ano | findstr :3000
```

**Linux/Mac:**
```bash
# Cek Backend
curl http://localhost:3001/docs

# Cek Frontend
curl http://localhost:3000
```

---

## ❌ Penyebab Umum Error 404

### 1. Server Belum Dijalankan
**Gejala:** Tidak ada proses yang mendengarkan di port 3000 atau 3001

**Solusi:**
```bash
# Pastikan Anda menjalankan KEDUA server:
# Terminal 1: npm run start:dev (di folder backend)
# Terminal 2: npm run dev (di folder frontend)
```

### 2. Dependencies Belum Terinstall
**Gejala:** Error "command not found" atau "module not found"

**Solusi:**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Database Belum Di-Setup
**Gejala:** Backend gagal start, error prisma

**Solusi:**
```bash
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Port Sudah Digunakan
**Gejala:** Error "EADDRINUSE" atau "port already in use"

**Solusi Windows:**
```cmd
# Kill proses di port 3001
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F

# Kill proses di port 3000
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

**Solusi Linux/Mac:**
```bash
# Kill proses di port 3001
lsof -ti:3001 | xargs kill -9

# Kill proses di port 3000
lsof -ti:3000 | xargs kill -9
```

### 5. Terminal Ditutup
**Gejala:** Server berhenti ketika terminal ditutup

**Solusi:**
- Jangan tutup terminal saat server berjalan
- Buka 2 terminal terpisah (1 untuk backend, 1 untuk frontend)
- Server akan berhenti jika terminal ditutup

---

## 📋 Checklist Troubleshooting

Ikuti checklist ini jika mendapat error 404:

- [ ] Apakah Anda sudah menjalankan `npm install` di folder backend?
- [ ] Apakah Anda sudah menjalankan `npm install` di folder frontend?
- [ ] Apakah Anda sudah membuat file `.env` di backend?
- [ ] Apakah Anda sudah menjalankan `npm run db:generate`?
- [ ] Apakah Anda sudah menjalankan `npm run db:push`?
- [ ] Apakah Anda sudah menjalankan `npm run db:seed`?
- [ ] Apakah backend berjalan di terminal 1?
- [ ] Apakah frontend berjalan di terminal 2?
- [ ] Apakah Anda melihat pesan "Nest application successfully started"?
- [ ] Apakah Anda melihat pesan "✓ Ready in"?
- [ ] Apakah kedua terminal masih terbuka (tidak ditutup)?

Jika semua checklist di atas ✅, maka aplikasi seharusnya bisa diakses!

---

## 🎯 Cara Setup & Run yang Benar

### Setup Pertama Kali (Hanya Sekali)

```bash
# ==========================================
# BACKEND SETUP
# ==========================================
cd backend

# 1. Install dependencies (tunggu sampai selesai)
npm install

# 2. Buat file .env
cp .env.example .env          # Linux/Mac
copy .env.example .env        # Windows

# 3. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# ==========================================
# FRONTEND SETUP
# ==========================================
cd ../frontend

# Install dependencies (tunggu sampai selesai)
npm install
```

### Menjalankan Aplikasi (Setiap Kali)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev

# Tunggu hingga muncul:
# [Nest] Nest application successfully started
# 🏗️  AMANTRA Construction API Server started on port 3001
```

**Terminal 2 - Frontend (BUKA TERMINAL BARU!):**
```bash
cd frontend
npm run dev

# Tunggu hingga muncul:
# ✓ Ready in xxxx ms
# - Local:        http://localhost:3000
```

**Akses:**
- Buka browser: http://localhost:3000

---

## 💡 Tips Penting

### 1. Gunakan 2 Terminal Terpisah
- **Terminal 1:** Untuk backend (jangan ditutup!)
- **Terminal 2:** Untuk frontend (jangan ditutup!)

### 2. Tunggu Hingga Server Benar-Benar Siap
- Backend perlu 10-30 detik untuk start
- Frontend perlu 5-15 detik untuk start
- Jangan buka browser sebelum kedua server siap!

### 3. Pastikan Tidak Ada Error
- Lihat terminal backend, pastikan tidak ada error merah
- Lihat terminal frontend, pastikan tidak ada error merah
- Jika ada error, baca pesan error dan fix dulu sebelum lanjut

### 4. Restart Jika Perlu
Jika aplikasi tidak jalan:
```bash
# Stop kedua server (Ctrl+C di masing-masing terminal)
# Lalu start ulang dari awal
```

---

## 📞 Masih Error?

Jika masih mendapat 404 setelah mengikuti semua langkah di atas:

1. **Screenshot error** yang muncul
2. **Copy paste** pesan error dari terminal backend
3. **Copy paste** pesan error dari terminal frontend
4. **Cek** apakah kedua terminal masih berjalan

---

## 🔗 Dokumentasi Lengkap

Untuk panduan lebih detail, lihat:
- [CARA-MENJALANKAN.md](./CARA-MENJALANKAN.md) - Panduan lengkap
- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Referensi cepat
- [SETUP-CHECKLIST-INDONESIA.md](./SETUP-CHECKLIST-INDONESIA.md) - Checklist setup

---

**Versi:** 1.0  
**Update:** 24 Januari 2026  
**Status:** Verified Working ✅
