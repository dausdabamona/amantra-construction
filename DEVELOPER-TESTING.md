# 💻 Developer Testing Guide - AMANTRA Construction

## Cara Cepat Test Aplikasi

### Option 1: Manual Login via UI

1. **Buka Frontend**
   ```
   http://localhost:3000
   ```

2. **Login dengan salah satu akun:**

   **Owner (Pemberi Kerja)**
   - Email: `owner@amantra.id`
   - Password: `Password123!`

   **Contractor (Kontraktor)**
   - Email: `kontraktor@amantra.id`
   - Password: `Password123!`

   **Supervisor (Pengawas)**
   - Email: `pengawas@amantra.id`
   - Password: `Password123!`

   **Witness (Saksi)**
   - Email: `saksi@amantra.id`
   - Password: `Password123!`

---

### Option 2: Test via Swagger UI (Backend)

**URL**: http://localhost:3001/docs

#### Step 1: Get Token
1. Buka Swagger UI
2. Expand `POST /auth/login`
3. Click "Try it out"
4. Input JSON:
```json
{
  "email": "owner@amantra.id",
  "password": "Password123!"
}
```
5. Click "Execute"
6. Copy `accessToken` dari response

#### Step 2: Authorize di Swagger
1. Click tombol "Authorize" di atas
2. Paste: `Bearer {accessToken}`
3. Click "Authorize"

#### Step 3: Test Endpoints
- GET `/projects` - List semua proyek
- GET `/projects/{id}` - Detail proyek
- GET `/terms/contract/{contractId}` - List termin
- GET `/payments/ready` - Pembayaran siap dibayar
- GET `/verifications/pending` - Verifikasi pending
- GET `/audit` - Audit trail

---

## Struktur Data yang Ada

### Users
```
owner@amantra.id        → OWNER (Pemberi Kerja)
kontraktor@amantra.id   → CONTRACTOR (Kontraktor)
pengawas@amantra.id     → SUPERVISOR (Pengawas)
saksi@amantra.id        → WITNESS (Saksi Ahli)
```

### Projects
Minimal 1-2 proyek dengan:
- Contract (Kontrak)
- Terms (Termin/Milestone)
  - Draft
  - Submitted
  - Verified
  - Valid
  - Paid
- Progress Reports
- Verifications
- Payments

---

## Troubleshooting

### Frontend Tidak Connect ke Backend
**Gejala**: Error 404 atau "Failed to fetch"

**Solusi**:
1. Cek backend berjalan: `netstat -ano | Select-String "3001"`
2. Test API manual: `curl http://localhost:3001/api/v1/projects`
3. Cek file `frontend/src/lib/api.ts` - API_URL harus `http://localhost:3001/api/v1`

### Data Tidak Muncul di Dashboard
**Gejala**: Dashboard kosong, Loading terus

**Solusi**:
1. Buka DevTools → Console tab
2. Lihat error message
3. Cek di Swagger UI apakah GET /projects berhasil
4. Pastikan sudah login dengan akun yang tepat

### Login Gagal
**Gejala**: Error "Invalid email or password"

**Solusi**:
1. Pastikan email benar: `owner@amantra.id` (bukan `owner@amantra.com`)
2. Pastikan password benar: `Password123!`
3. Cek backend log untuk detail error
4. Reset database dan re-seed (lihat bagian DB Reset)

---

## Testing Checklist

- [ ] Frontend bisa diakses (http://localhost:3000)
- [ ] Backend bisa diakses (http://localhost:3001)
- [ ] Login berhasil dengan owner@amantra.id
- [ ] Dashboard menampilkan stats
- [ ] Projects page menampilkan daftar proyek
- [ ] Detail proyek menampilkan termin
- [ ] Swagger UI bisa diakses (http://localhost:3001/docs)
- [ ] API endpoints bisa di-call via Swagger
- [ ] Role-based access (coba login dengan role berbeda)

---

## Database Setup (jika perlu reset)

```powershell
cd backend

# Stop backend jika sedang berjalan
# Hapus database lama
rm dev.db

# Re-migrate & seed
node node_modules/prisma/build/index.js migrate dev --name init

# Restart backend
node dist/src/main.js
```

---

## Environment Variables

**Backend** (.env):
```
DATABASE_URL="file:./dev.db"
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1
JWT_SECRET=dev-secret-key-amantra-2024
```

**Frontend** (.env.local - jika diperlukan):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## Common Issues & Solutions

| Issue | Solusi |
|-------|--------|
| "Cannot find module" | Run `npm install` di folder yang error |
| Port 3001 sudah dipakai | Kill process: `netstat -ano \| Select-String "3001"` |
| Seed data tidak muncul | Re-run: `node node_modules/prisma/build/index.js migrate reset` |
| Frontend blank/white | Check console (F12) untuk error |
| CORS error | Backend sudah configure CORS ke localhost:3000 |

---

## Log Locations

- **Frontend**: Browser Console (F12)
- **Backend**: Terminal output + `backend/logs/` folder
  - `logs/combined-YYYY-MM-DD.log` - All logs
  - `logs/error-YYYY-MM-DD.log` - Error only

---

**Tips**: Buka 2 terminal untuk running backend dan frontend bersamaan, atau gunakan background process seperti di Quick Start Guide.
