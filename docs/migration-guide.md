# Migration Guide: Local SQLite to Supabase

## Overview

Panduan ini menjelaskan langkah-langkah migrasi dari database SQLite lokal ke Supabase PostgreSQL untuk production deployment.

## Pre-Migration Checklist

- [ ] Backup database lokal
- [ ] Export data existing
- [ ] Setup Supabase project
- [ ] Test connection ke Supabase
- [ ] Review schema compatibility

## Step 1: Setup Supabase Project

1. **Buat project di Supabase**
   - Kunjungi https://supabase.com
   - Buat project baru
   - Catat connection string

2. **Dapatkan Database URL**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

## Step 2: Update Prisma Schema

Edit `backend/prisma/schema.prisma`:

```prisma
// Ganti provider dari sqlite ke postgresql
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

**Catatan PostgreSQL-specific changes:**

```prisma
// SQLite menggunakan String untuk JSON, PostgreSQL bisa gunakan Json type
// Opsional: ganti tipe data untuk performa lebih baik

model Contract {
  // ... other fields
  termsConditions   Json?  // Ganti dari String? ke Json?
}

model WorkPhase {
  deliverables      Json   // Ganti dari String ke Json
  // ...
}
```

## Step 3: Update Environment Variables

1. **Production .env**
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
   ```

2. **Atau gunakan connection pooling (recommended)**
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

## Step 4: Generate New Migration

```bash
# Hapus migrasi SQLite lama
rm -rf prisma/migrations

# Generate migrasi PostgreSQL baru
npx prisma migrate dev --name init_postgresql

# Atau untuk production
npx prisma migrate deploy
```

## Step 5: Data Migration

### Option A: Fresh Start (Recommended untuk PoC)

```bash
# Jalankan seed untuk data demo
npm run db:seed
```

### Option B: Migrate Existing Data

1. **Export dari SQLite**
   ```bash
   # Buat script export
   node scripts/export-sqlite.js > backup.json
   ```

2. **Script export-sqlite.js**
   ```javascript
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();

   async function exportData() {
     const data = {
       users: await prisma.user.findMany(),
       projects: await prisma.project.findMany(),
       contracts: await prisma.contract.findMany(),
       workPhases: await prisma.workPhase.findMany(),
       progressReports: await prisma.progressReport.findMany(),
       verifications: await prisma.verification.findMany(),
       payments: await prisma.payment.findMany(),
       evidenceFiles: await prisma.evidenceFile.findMany(),
       auditLogs: await prisma.auditLog.findMany(),
     };
     console.log(JSON.stringify(data, null, 2));
   }

   exportData();
   ```

3. **Import ke PostgreSQL**
   ```bash
   # Update DATABASE_URL ke Supabase
   node scripts/import-postgres.js backup.json
   ```

## Step 6: Verify Migration

```bash
# Connect ke Supabase
npx prisma studio

# Jalankan test
npm run test

# Check API
curl http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amantra.id","password":"Password123!"}'
```

## Step 7: Update Frontend Configuration

Update `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
```

## Rollback Plan

Jika migrasi gagal:

1. **Restore SQLite**
   ```bash
   # Kembalikan schema ke SQLite
   git checkout prisma/schema.prisma

   # Restore .env
   export DATABASE_URL="file:./dev.db"
   ```

2. **Restore dari backup**
   ```bash
   cp backup/dev.db prisma/dev.db
   ```

## Post-Migration Tasks

- [ ] Setup Row Level Security (RLS) di Supabase
- [ ] Configure database backups
- [ ] Setup monitoring
- [ ] Update CI/CD pipelines
- [ ] Test semua endpoint API
- [ ] Verify audit logs berfungsi

## Supabase-Specific Features

Setelah migrasi, Anda bisa memanfaatkan fitur Supabase:

### 1. Row Level Security (RLS)

```sql
-- Enable RLS untuk user table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT USING (auth.uid()::text = id);
```

### 2. Realtime Subscriptions

```typescript
// Frontend: Subscribe ke perubahan
const subscription = supabase
  .channel('audit_logs')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'AuditLog' },
    payload => console.log('New audit log:', payload)
  )
  .subscribe();
```

### 3. Edge Functions (Optional)

Untuk webhook notifications atau scheduled tasks.

## Troubleshooting

### Error: Cannot find module '@prisma/client'
```bash
npx prisma generate
```

### Error: P1001 - Can't reach database server
- Check connection string
- Verify IP whitelist di Supabase
- Check SSL settings

### Error: Unique constraint violation
- Data duplikat saat import
- Jalankan dengan flag --skip-duplicates

## Support

Untuk bantuan lebih lanjut:
- Prisma Docs: https://www.prisma.io/docs
- Supabase Docs: https://supabase.com/docs
- AMANTRA Support: support@amantra.id
