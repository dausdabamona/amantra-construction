# ✅ Setup Checklist - AMANTRA Construction

Ikuti checklist ini untuk setup aplikasi dari awal. Centang setiap langkah setelah selesai.

---

## 📋 Persiapan

- [ ] Node.js 18+ terinstal (`node --version`)
- [ ] npm terinstal (`npm --version`)
- [ ] Repository sudah di-clone
- [ ] Buka 2 terminal/command prompt

---

## 🔧 Setup Backend (Terminal 1)

### 1. Masuk ke folder backend
```bash
cd backend
```
- [ ] Berhasil masuk ke folder backend

### 2. Install dependencies
```bash
npm install
```
- [ ] Dependencies terinstal (tunggu 2-5 menit)
- [ ] Tidak ada error merah

### 3. Setup environment
```bash
# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```
- [ ] File `.env` berhasil dibuat

### 4. Generate Prisma Client
```bash
npm run db:generate
```
- [ ] Prisma client berhasil di-generate
- [ ] Muncul pesan "Generated Prisma Client"

### 5. Migrate Database
```bash
npm run db:migrate
```
- [ ] Ketika diminta nama migrasi, tekan Enter
- [ ] Muncul pesan migrasi berhasil
- [ ] File `dev.db` muncul di folder backend

### 6. Seed Data Demo
```bash
npm run db:seed
```
- [ ] Data berhasil di-seed
- [ ] Muncul pesan sukses membuat users, projects, dll

### 7. Build Backend
```bash
npm run build
```
- [ ] Build berhasil tanpa error
- [ ] Folder `dist/` muncul

### 8. Jalankan Backend
```bash
npm run start:dev
```
- [ ] Backend berjalan di http://localhost:3001
- [ ] Muncul pesan "Nest application successfully started"
- [ ] Swagger docs tersedia di http://localhost:3001/docs
- [ ] ✨ **JANGAN TUTUP TERMINAL INI!**

---

## 🎨 Setup Frontend (Terminal 2)

### 1. Buka terminal/command prompt BARU
- [ ] Terminal baru sudah dibuka (Terminal 1 tetap jalan!)

### 2. Masuk ke folder frontend
```bash
cd frontend
```
- [ ] Berhasil masuk ke folder frontend

### 3. Install dependencies
```bash
npm install
```
- [ ] Dependencies terinstal (tunggu 2-5 menit)
- [ ] Tidak ada error merah

### 4. Jalankan Frontend
```bash
npm run dev
```
- [ ] Frontend berjalan di http://localhost:3000
- [ ] Muncul pesan "ready started server"
- [ ] Muncul pesan "compiled client and server successfully"
- [ ] ✨ **JANGAN TUTUP TERMINAL INI JUGA!**

---

## 🌐 Verifikasi Aplikasi

### 1. Cek Backend
- [ ] Buka browser: http://localhost:3001/docs
- [ ] Swagger UI muncul dengan daftar endpoints
- [ ] Tidak ada error

### 2. Cek Frontend
- [ ] Buka browser: http://localhost:3000
- [ ] Halaman login muncul
- [ ] Tidak ada error di browser console (tekan F12)

### 3. Test Login
- [ ] Di halaman login, masukkan:
  - Email: `owner@amantra.id`
  - Password: `Password123!`
- [ ] Klik tombol "Masuk"
- [ ] Berhasil masuk ke Dashboard
- [ ] Dashboard menampilkan data (Total Proyek, dll)

### 4. Test Navigasi
- [ ] Menu "Proyek" bisa diklik dan menampilkan halaman
- [ ] Menu "Pembayaran" bisa diklik dan menampilkan halaman
- [ ] Menu "Dashboard" bisa diklik dan kembali ke dashboard

---

## 🎉 Setup Selesai!

Jika semua checklist di atas sudah ✅, maka aplikasi Anda sudah berjalan dengan sempurna!

### Akses Aplikasi:
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:3001/docs

### Akun Demo:
| Role | Email | Password |
|------|-------|----------|
| Owner | owner@amantra.id | Password123! |
| Contractor | kontraktor@amantra.id | Password123! |
| Supervisor | pengawas@amantra.id | Password123! |
| Witness | saksi@amantra.id | Password123! |

---

## 🔧 Jika Ada Masalah

### Backend tidak bisa dijalankan
1. [ ] Jalankan: `npm install`
2. [ ] Jalankan: `npm run db:generate`
3. [ ] Jalankan: `npm run build`
4. [ ] Coba lagi: `npm run start:dev`

### Frontend tidak bisa dijalankan
1. [ ] Jalankan: `npm install`
2. [ ] Hapus folder `.next` jika ada
3. [ ] Coba lagi: `npm run dev`

### Port sudah digunakan
**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID [nomor_PID] /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Database error
```bash
cd backend
npm run db:reset
```

---

## 📚 Dokumentasi Lengkap

Untuk panduan lengkap, baca:
- **[CARA-MENJALANKAN.md](./CARA-MENJALANKAN.md)** - Panduan lengkap setup
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Referensi cepat perintah
- **[README.md](./README.md)** - Informasi umum project

---

**Tips:** Simpan halaman ini sebagai referensi untuk setup di komputer lain! 📌
