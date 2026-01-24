# 🚀 Panduan Lengkap: Cara Menjalankan Aplikasi AMANTRA Construction

Panduan ini akan membantu Anda menjalankan aplikasi AMANTRA Construction dari awal hingga aplikasi berjalan dengan sempurna.

## 📋 Daftar Isi

1. [Persiapan Awal](#persiapan-awal)
2. [Instalasi Backend](#instalasi-backend)
3. [Instalasi Frontend](#instalasi-frontend)
4. [Menjalankan Aplikasi](#menjalankan-aplikasi)
5. [Akses Aplikasi](#akses-aplikasi)
6. [Troubleshooting](#troubleshooting)

---

## ⚙️ Persiapan Awal

### Kebutuhan Sistem

Pastikan komputer Anda sudah terinstal:

- **Node.js** versi 18 atau lebih tinggi
  - Cek versi: `node --version`
  - Download dari: https://nodejs.org/
- **npm** (biasanya sudah terinstal bersama Node.js)
  - Cek versi: `npm --version`
- **Git** (untuk clone repository)
  - Cek versi: `git --version`

### Clone Repository

```bash
# Clone repository dari GitHub
git clone https://github.com/dausdabamona/amantra-construction.git

# Masuk ke folder project
cd amantra-construction
```

---

## 🔧 Instalasi Backend

### Langkah 1: Masuk ke Folder Backend

```bash
cd backend
```

### Langkah 2: Install Dependencies

```bash
npm install
```

Proses ini akan menginstal semua package yang diperlukan. Tunggu hingga selesai (sekitar 2-5 menit).

### Langkah 3: Setup Environment Variables

Buat file `.env` dari template yang sudah disediakan:

```bash
# Di Windows (Command Prompt)
copy .env.example .env

# Di Windows (PowerShell)
Copy-Item .env.example .env

# Di Linux/Mac
cp .env.example .env
```

**File `.env` sudah memiliki konfigurasi default yang siap digunakan untuk development**, jadi Anda tidak perlu mengubah apapun. Namun jika ingin, Anda bisa melihat dan edit file tersebut.

### Langkah 4: Setup Database

AMANTRA menggunakan SQLite untuk development (database tersimpan dalam file lokal).

#### a. Generate Prisma Client

```bash
npm run db:generate
```

#### b. Jalankan Migrasi Database

```bash
npm run db:migrate
```

Ketika diminta nama migrasi, tekan **Enter** saja (akan menggunakan nama default).

#### c. Isi Database dengan Data Contoh

```bash
npm run db:seed
```

Perintah ini akan membuat:
- 4 user dengan role berbeda (Owner, Contractor, Supervisor, Witness)
- 2 proyek contoh
- Kontrak dan termin
- Data progress dan verifikasi

### Langkah 5: Build Backend

```bash
npm run build
```

Tunggu hingga proses build selesai (sekitar 30-60 detik).

---

## 🎨 Instalasi Frontend

### Langkah 1: Buka Terminal/Command Prompt Baru

**JANGAN tutup terminal backend!** Buka terminal/command prompt baru.

### Langkah 2: Masuk ke Folder Frontend

```bash
# Dari root project
cd frontend

# Atau jika dari folder backend
cd ../frontend
```

### Langkah 3: Install Dependencies

```bash
npm install
```

Proses ini akan menginstal semua package yang diperlukan untuk frontend. Tunggu hingga selesai (sekitar 2-5 menit).

### Langkah 4: Setup Environment Variables (Opsional)

Frontend akan otomatis menggunakan `http://localhost:3001/api/v1` sebagai backend URL.

Jika ingin mengubahnya, buat file `.env.local`:

```bash
# Di Windows (Command Prompt)
echo NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 > .env.local

# Di Windows (PowerShell)
"NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" | Out-File -FilePath .env.local -Encoding utf8

# Di Linux/Mac
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local
```

---

## 🚀 Menjalankan Aplikasi

Anda memerlukan **DUA terminal** yang berjalan bersamaan:

### Terminal 1: Jalankan Backend

```bash
cd backend
npm run start:dev
```

**Tunggu hingga muncul pesan:**
```
[NestApplication] Nest application successfully started
Application is running on: http://localhost:3001
Swagger documentation available at: http://localhost:3001/docs
```

✅ Backend siap! **Jangan tutup terminal ini!**

### Terminal 2: Jalankan Frontend

```bash
cd frontend
npm run dev
```

**Tunggu hingga muncul pesan:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

✅ Frontend siap! **Jangan tutup terminal ini juga!**

---

## 🌐 Akses Aplikasi

Setelah kedua aplikasi berjalan, buka browser dan akses:

### Frontend (Aplikasi Web)
```
http://localhost:3000
```

### Backend API Documentation (Swagger)
```
http://localhost:3001/docs
```

---

## 🔑 Login ke Aplikasi

Aplikasi sudah memiliki 4 akun demo yang siap digunakan:

### 1. **Owner (Pemberi Kerja)**
```
Email:    owner@amantra.id
Password: Password123!
```
**Fungsi:** Membuat proyek, membuat kontrak, verifikasi pembayaran

### 2. **Contractor (Kontraktor)**
```
Email:    kontraktor@amantra.id
Password: Password123!
```
**Fungsi:** Upload progress pekerjaan, submit untuk verifikasi

### 3. **Supervisor (Pengawas)**
```
Email:    pengawas@amantra.id
Password: Password123!
```
**Fungsi:** Verifikasi progress pekerjaan (approval pertama)

### 4. **Witness (Saksi Ahli)**
```
Email:    saksi@amantra.id
Password: Password123!
```
**Fungsi:** Verifikasi teknis (approval kedua)

---

## 🎯 Cara Menggunakan Aplikasi

### Langkah 1: Login
1. Buka http://localhost:3000
2. Anda akan diarahkan ke halaman login
3. Masukkan salah satu email dan password di atas
4. Klik tombol **"Masuk"**

### Langkah 2: Jelajahi Dashboard
Setelah login, Anda akan melihat:
- **Total Proyek** yang Anda miliki/terlibat
- **Total Nilai Kontrak**
- **Verifikasi yang Tertunda** (untuk Supervisor dan Witness)
- **Pembayaran yang Siap** (untuk Owner)

### Langkah 3: Akses Menu
- **Dashboard** - Ringkasan dan statistik
- **Proyek** - Daftar semua proyek
- **Pembayaran** - Status pembayaran
- **Profil** - Informasi akun Anda

---

## 🔍 Troubleshooting

### ❌ Backend tidak bisa dijalankan

**Problem:** Error saat menjalankan `npm run start:dev`

**Solusi:**
```bash
# 1. Pastikan semua dependencies terinstal
npm install

# 2. Pastikan database sudah di-generate
npm run db:generate

# 3. Rebuild project
npm run build

# 4. Coba jalankan lagi
npm run start:dev
```

### ❌ Frontend tidak bisa dijalankan

**Problem:** Error saat menjalankan `npm run dev`

**Solusi:**
```bash
# 1. Pastikan semua dependencies terinstal
npm install

# 2. Hapus folder .next jika ada
rm -rf .next       # Linux/Mac
rmdir /s .next     # Windows

# 3. Coba jalankan lagi
npm run dev
```

### ❌ Port 3000 atau 3001 sudah digunakan

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solusi:**

**Windows:**
```cmd
# Cari process yang menggunakan port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process (ganti PID dengan nomor dari hasil di atas)
taskkill /PID [nomor_PID] /F
```

**Linux/Mac:**
```bash
# Cari dan kill process
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### ❌ Database error atau data kosong

**Problem:** Database error atau tidak ada data

**Solusi:**
```bash
cd backend

# Reset database (HATI-HATI: Akan menghapus semua data!)
npm run db:reset

# Atau manual:
rm dev.db           # Hapus database lama
npm run db:migrate  # Buat database baru
npm run db:seed     # Isi dengan data contoh
```

### ❌ Login tidak berhasil

**Problem:** Error saat login atau token tidak valid

**Solusi:**
1. Pastikan backend berjalan (cek http://localhost:3001/docs)
2. Clear browser cache dan cookies
3. Buka DevTools (F12) > Console, lihat error message
4. Pastikan email dan password benar (case-sensitive)

### ❌ API tidak terkoneksi

**Problem:** Frontend tidak bisa mengakses backend

**Solusi:**
1. Pastikan backend berjalan di http://localhost:3001
2. Cek CORS settings di backend/.env:
   ```
   CORS_ORIGIN=http://localhost:3000
   CORS_CREDENTIALS=true
   ```
3. Restart kedua aplikasi (backend dan frontend)

---

## 📚 Tools Tambahan

### Prisma Studio (Database GUI)

Untuk melihat dan mengedit database dengan interface visual:

```bash
cd backend
npm run db:studio
```

Akan membuka http://localhost:5555 dengan database viewer.

### API Testing dengan Swagger

Buka http://localhost:3001/docs untuk:
- Melihat semua endpoint API
- Test API langsung dari browser
- Lihat request/response format

---

## 🔄 Menghentikan Aplikasi

Untuk menghentikan aplikasi:

1. **Backend:** Tekan `Ctrl + C` di terminal backend
2. **Frontend:** Tekan `Ctrl + C` di terminal frontend

Untuk menjalankan kembali, ulangi langkah di bagian [Menjalankan Aplikasi](#menjalankan-aplikasi).

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:

1. **Cek log error** di terminal backend dan frontend
2. **Buka DevTools browser** (F12) dan lihat tab Console
3. **Cek dokumentasi lengkap** di folder `/docs`
4. **Lihat file** `QUICK-START-GUIDE.md` untuk informasi tambahan

---

## 🎓 Dokumentasi Lainnya

- [README.md](./README.md) - Informasi umum project
- [QUICK-START-GUIDE.md](./QUICK-START-GUIDE.md) - Panduan testing
- [docs/MVP-ARCHITECTURE.md](./docs/MVP-ARCHITECTURE.md) - Arsitektur sistem
- [docs/user-flow.md](./docs/user-flow.md) - Alur penggunaan aplikasi

---

**Versi:** 1.0  
**Terakhir diupdate:** 24 Januari 2026  
**Status:** ✅ Siap Digunakan

---

## ✅ Checklist Setup

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

### Backend
- [ ] Node.js 18+ terinstal
- [ ] `cd backend` 
- [ ] `npm install` berhasil
- [ ] File `.env` sudah dibuat
- [ ] `npm run db:generate` berhasil
- [ ] `npm run db:migrate` berhasil
- [ ] `npm run db:seed` berhasil
- [ ] `npm run build` berhasil
- [ ] `npm run start:dev` berjalan tanpa error
- [ ] http://localhost:3001/docs bisa diakses

### Frontend
- [ ] Terminal baru dibuka
- [ ] `cd frontend`
- [ ] `npm install` berhasil
- [ ] `npm run dev` berjalan tanpa error
- [ ] http://localhost:3000 bisa diakses
- [ ] Halaman login muncul

### Testing
- [ ] Bisa login dengan akun demo
- [ ] Dashboard menampilkan data
- [ ] Menu navigasi berfungsi
- [ ] Tidak ada error di browser console

**Jika semua checklist ✅, selamat! Aplikasi Anda sudah berjalan dengan sempurna! 🎉**
