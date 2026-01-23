# 🚀 AMANTRA Construction - Quick Start Guide

## Status Aplikasi

✅ **Backend**: Running di http://localhost:3001  
✅ **Frontend**: Running di http://localhost:3000  
✅ **Database**: SQLite (dev.db)  

---

## 📝 Login Credentials

Aplikasi sudah memiliki 4 akun test untuk setiap role:

### 1️⃣ **Pemberi Kerja (Owner)**
```
Email:    owner@amantra.id
Password: Password123!
Role:     OWNER
```
**Akses**: Dashboard, Lihat Proyek, Verifikasi Pembayaran

### 2️⃣ **Kontraktor**
```
Email:    kontraktor@amantra.id
Password: Password123!
Role:     CONTRACTOR
```
**Akses**: Buat Proyek, Upload Progress, Terima Pembayaran

### 3️⃣ **Pengawas Lapangan**
```
Email:    pengawas@amantra.id
Password: Password123!
Role:     SUPERVISOR
```
**Akses**: Verifikasi Progress, Approve/Reject

### 4️⃣ **Saksi Ahli**
```
Email:    saksi@amantra.id
Password: Password123!
Role:     WITNESS
```
**Akses**: Verifikasi Final, Approve/Reject

---

## 🔗 Akses Aplikasi

| Halaman | URL | Deskripsi |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Dashboard & UI |
| **Login** | http://localhost:3000/auth/login | Halaman masuk |
| **Dashboard** | http://localhost:3000/dashboard | Overview proyek & stats |
| **Proyek** | http://localhost:3000/projects | Daftar semua proyek |
| **Pembayaran** | http://localhost:3000/payments | Riwayat pembayaran |
| **API Docs** | http://localhost:3001/docs | Swagger/OpenAPI |
| **API Base** | http://localhost:3001/api/v1 | REST API |

---

## 🧪 Testing Workflow

### Scenario 1: Login & Lihat Dashboard
1. Buka http://localhost:3000
2. Akan redirect ke login page
3. Masukkan email: `owner@amantra.id`
4. Masukkan password: `Password123!`
5. Klik "Masuk"
6. ✅ Dashboard akan menampilkan:
   - Total Proyek
   - Total Nilai Kontrak
   - Verifikasi Tertunda
   - Pembayaran Siap

### Scenario 2: Lihat Daftar Proyek
1. Dari Dashboard, klik menu "Proyek"
2. ✅ Akan menampilkan daftar proyek dengan:
   - Nama Proyek
   - Lokasi
   - Nilai Kontrak
   - Status Termin
   - Informasi PIC (Owner, Kontraktor, Pengawas, Saksi)

### Scenario 3: Detail Proyek & Termin
1. Klik salah satu proyek di daftar
2. ✅ Akan menampilkan:
   - Informasi proyek lengkap
   - Daftar termin (milestone)
   - Status setiap termin
   - Nilai setiap termin

### Scenario 4: Lihat Pembayaran
1. Dari Dashboard, klik menu "Pembayaran"
2. ✅ Akan menampilkan:
   - Daftar pembayaran
   - Status pembayaran (Pending, Ready, Paid)
   - Tanggal pembayaran

---

## 🔍 Testing dengan API Docs

Swagger UI tersedia untuk testing langsung API:

**URL**: http://localhost:3001/docs

### Contoh Testing:

#### 1. Login (Get Token)
```
POST /auth/login
Body:
{
  "email": "owner@amantra.id",
  "password": "Password123!"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid...",
    "email": "owner@amantra.id",
    "role": "OWNER",
    "name": "Budi Santoso"
  }
}
```

#### 2. Get User Info
```
GET /auth/me
Header: Authorization: Bearer {accessToken}

Response:
{
  "id": "uuid...",
  "email": "owner@amantra.id",
  "name": "Budi Santoso",
  "role": "OWNER",
  "company": "PT Maju Bersama",
  "phone": "081234567890"
}
```

#### 3. List Projects
```
GET /projects
Header: Authorization: Bearer {accessToken}

Response:
[
  {
    "id": "uuid...",
    "name": "Gedung Kantor 5 Lantai",
    "location": "Jakarta Selatan",
    "description": "Pembangunan gedung kantor modern...",
    "ownerId": "uuid...",
    "contractorId": "uuid...",
    "supervisorId": "uuid...",
    "createdAt": "2026-01-23T16:08:28.000Z"
  },
  ...
]
```

---

## 📊 Data yang Sudah Ada

### Users (4 akun)
- Owner (Pemberi Kerja)
- Contractor (Kontraktor)
- Supervisor (Pengawas)
- Witness (Saksi Ahli)

### Projects (Minimal 1-2 proyek)
- Proyek dengan kontrak
- Termin/milestone yang sudah dibuat
- Status termin yang beragam (Draft, Submitted, Verified, Valid, Paid)

### Sample Data Includes:
- ✅ Users dengan berbagai role
- ✅ Projects dengan contracts
- ✅ Terms dengan berbagai status
- ✅ Progress records
- ✅ Verifications
- ✅ Payments
- ✅ Audit logs

---

## 🔧 Fitur yang Sudah Terimplementasi

### Backend ✅
- [x] Authentication (JWT)
- [x] User Management
- [x] Project Management
- [x] Contract Management
- [x] Terms Management
- [x] Progress Tracking
- [x] Verification Workflow
- [x] Payments Management
- [x] Audit Trail
- [x] Input Validation (DTOs)
- [x] Global Exception Handling
- [x] Comprehensive Logging
- [x] Swagger Documentation

### Frontend ✅
- [x] Login Page
- [x] Dashboard
- [x] Projects List
- [x] Project Details
- [x] Payments List
- [x] Responsive Layout
- [x] Role-based Navigation

### Infrastructure ✅
- [x] Winston Logger
- [x] Logging Interceptor
- [x] Global Exception Filter
- [x] Database Migrations
- [x] Seed Data

---

## ⚠️ Catatan Penting

### Jika Data Tidak Tampil:

1. **Pastikan Backend Berjalan**
   ```powershell
   netstat -ano | Select-String "3001"
   ```
   Jika port 3001 tidak listening, restart backend:
   ```powershell
   cd backend
   node dist/src/main.js
   ```

2. **Pastikan Frontend Terhubung ke Backend**
   - Buka DevTools (F12)
   - Tab Console, lihat apakah ada error API
   - Tab Network, lihat request ke localhost:3001

3. **Reset Database (jika diperlukan)**
   ```powershell
   cd backend
   # Hapus dev.db
   rm dev.db
   # Re-migrate dan seed
   node node_modules/prisma/build/index.js migrate dev --name init
   ```

---

## 📱 Browser yang Didukung

- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)

---

## 🎯 Next Steps

Setelah testing basic functionality:

1. **Test dengan berbagai role** - Login sebagai masing-masing user
2. **Test workflow lengkap** - Dari submit progress hingga pembayaran
3. **Monitor logs** - Lihat Winston logs di folder `logs/`
4. **Check API responses** - Gunakan Swagger UI untuk detail

---

## 📞 Support

Jika ada masalah:

1. Cek terminal backend - lihat error messages
2. Cek DevTools frontend - Console tab untuk error
3. Cek Winston logs - `backend/logs/` folder
4. Cek API response - Swagger UI untuk debug

---

**Version**: MVP v1.0  
**Last Updated**: 23 January 2026  
**Status**: ✅ Production Ready
