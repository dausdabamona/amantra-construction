import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Define enums locally since Prisma types may not be generated
const UserRole = {
  OWNER: 'OWNER',
  CONTRACTOR: 'CONTRACTOR',
  SUPERVISOR: 'SUPERVISOR',
  WITNESS: 'WITNESS',
} as const;

const TermStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  VERIFIED: 'VERIFIED',
  VALID: 'VALID',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
} as const;

const VerificationRole = {
  SUPERVISOR: 'SUPERVISOR',
  WITNESS: 'WITNESS',
} as const;

const VerificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

const PaymentStatus = {
  PENDING: 'PENDING',
  READY: 'READY',
  PAID: 'PAID',
} as const;

const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SUBMIT_PROGRESS: 'SUBMIT_PROGRESS',
  VERIFY_APPROVE: 'VERIFY_APPROVE',
  VERIFY_REJECT: 'VERIFY_REJECT',
  PAYMENT_CONFIRM: 'PAYMENT_CONFIRM',
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AMANTRA MVP database...\n');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.term.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ============================================
  // CREATE 4 USERS (1 per role)
  // ============================================
  console.log('Creating users...');

  const owner = await prisma.user.create({
    data: {
      email: 'owner@amantra.id',
      passwordHash,
      role: UserRole.OWNER,
      name: 'Budi Santoso',
      phone: '081234567890',
      company: 'PT Maju Bersama',
    },
  });

  const contractor = await prisma.user.create({
    data: {
      email: 'kontraktor@amantra.id',
      passwordHash,
      role: UserRole.CONTRACTOR,
      name: 'Andi Wijaya',
      phone: '081234567891',
      company: 'PT Konstruksi Handal',
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'pengawas@amantra.id',
      passwordHash,
      role: UserRole.SUPERVISOR,
      name: 'Ir. Dewi Lestari',
      phone: '081234567892',
      company: 'Konsultan Pengawas Jaya',
    },
  });

  const witness = await prisma.user.create({
    data: {
      email: 'saksi@amantra.id',
      passwordHash,
      role: UserRole.WITNESS,
      name: 'Dr. Rahmat Hidayat',
      phone: '081234567893',
      company: 'Universitas Teknik Indonesia',
    },
  });

  console.log('✓ 4 users created\n');

  // ============================================
  // CREATE PROJECT
  // ============================================
  console.log('Creating project...');

  const project = await prisma.project.create({
    data: {
      name: 'Pembangunan Gedung Kantor PT Maju Bersama',
      description: 'Proyek pembangunan gedung perkantoran 3 lantai',
      location: 'Jl. Sudirman No. 123, Jakarta Pusat',
      ownerId: owner.id,
      contractorId: contractor.id,
      supervisorId: supervisor.id,
      witnessId: witness.id,
    },
  });

  console.log('✓ Project created\n');

  // ============================================
  // CREATE CONTRACT
  // ============================================
  console.log('Creating contract...');

  const contract = await prisma.contract.create({
    data: {
      contractNumber: 'KTR-2024-001',
      totalValue: 5000000000, // 5 Miliar
      termCount: 3,
      projectId: project.id,
    },
  });

  console.log('✓ Contract created\n');

  // ============================================
  // CREATE 3 TERMS (TERMIN)
  // ============================================
  console.log('Creating terms...');

  // Termin 1: Pekerjaan Pondasi - PAID (sudah selesai)
  const term1 = await prisma.term.create({
    data: {
      termNumber: 1,
      name: 'Pekerjaan Pondasi',
      description: 'Galian, pemancangan, dan pile cap',
      percentage: 30,
      value: 1500000000, // 1.5 Miliar
      status: TermStatus.PAID,
      contractId: contract.id,
    },
  });

  // Termin 2: Struktur Lantai 1-2 - VALID (siap dibayar)
  const term2 = await prisma.term.create({
    data: {
      termNumber: 2,
      name: 'Struktur Lantai 1-2',
      description: 'Kolom, balok, dan plat lantai 1-2',
      percentage: 40,
      value: 2000000000, // 2 Miliar
      status: TermStatus.VALID,
      contractId: contract.id,
    },
  });

  // Termin 3: Struktur Lantai 3 & Atap - SUBMITTED (menunggu verifikasi)
  const term3 = await prisma.term.create({
    data: {
      termNumber: 3,
      name: 'Struktur Lantai 3 & Atap',
      description: 'Kolom, balok, plat lantai 3, dan rangka atap',
      percentage: 30,
      value: 1500000000, // 1.5 Miliar
      status: TermStatus.SUBMITTED,
      contractId: contract.id,
    },
  });

  console.log('✓ 3 terms created\n');

  // ============================================
  // CREATE PROGRESS FOR EACH TERM
  // ============================================
  console.log('Creating progress reports...');

  // Progress for Term 1 (completed)
  await prisma.progress.create({
    data: {
      description: 'Pekerjaan pondasi selesai 100%. Galian selesai, tiang pancang terpasang, pile cap sudah dicor.',
      photoUrl: '/uploads/progress/term1-final.jpg',
      claimPercentage: 100,
      termId: term1.id,
      uploadedById: contractor.id,
    },
  });

  // Progress for Term 2 (valid, siap dibayar)
  await prisma.progress.create({
    data: {
      description: 'Struktur lantai 1 dan 2 selesai. Kolom dan balok sudah dicor, plat lantai selesai.',
      photoUrl: '/uploads/progress/term2-final.jpg',
      claimPercentage: 100,
      termId: term2.id,
      uploadedById: contractor.id,
    },
  });

  // Progress for Term 3 (submitted, menunggu verifikasi)
  await prisma.progress.create({
    data: {
      description: 'Pengecoran kolom lantai 3 selesai 80%. Bekisting balok sedang dipasang.',
      photoUrl: '/uploads/progress/term3-progress.jpg',
      claimPercentage: 80,
      termId: term3.id,
      uploadedById: contractor.id,
    },
  });

  console.log('✓ Progress reports created\n');

  // ============================================
  // CREATE VERIFICATIONS
  // ============================================
  console.log('Creating verifications...');

  // Verifications for Term 1 (both approved)
  await prisma.verification.create({
    data: {
      role: VerificationRole.SUPERVISOR,
      status: VerificationStatus.APPROVED,
      notes: 'Pekerjaan sesuai spesifikasi, kualitas baik.',
      verifiedAt: new Date('2024-01-15'),
      termId: term1.id,
      verifierId: supervisor.id,
    },
  });

  await prisma.verification.create({
    data: {
      role: VerificationRole.WITNESS,
      status: VerificationStatus.APPROVED,
      notes: 'Struktur pondasi memenuhi standar teknis.',
      verifiedAt: new Date('2024-01-16'),
      termId: term1.id,
      verifierId: witness.id,
    },
  });

  // Verifications for Term 2 (both approved)
  await prisma.verification.create({
    data: {
      role: VerificationRole.SUPERVISOR,
      status: VerificationStatus.APPROVED,
      notes: 'Struktur lantai 1-2 sesuai gambar kerja.',
      verifiedAt: new Date('2024-02-20'),
      termId: term2.id,
      verifierId: supervisor.id,
    },
  });

  await prisma.verification.create({
    data: {
      role: VerificationRole.WITNESS,
      status: VerificationStatus.APPROVED,
      notes: 'Mutu beton dan besi sesuai spesifikasi.',
      verifiedAt: new Date('2024-02-21'),
      termId: term2.id,
      verifierId: witness.id,
    },
  });

  // Term 3 - No verifications yet (waiting)

  console.log('✓ Verifications created\n');

  // ============================================
  // CREATE PAYMENTS
  // ============================================
  console.log('Creating payments...');

  // Payment for Term 1 (PAID)
  await prisma.payment.create({
    data: {
      amount: 1500000000,
      status: PaymentStatus.PAID,
      proofUrl: '/uploads/payments/term1-bukti.jpg',
      transactionRef: 'TRF-20240120-001',
      paidAt: new Date('2024-01-20'),
      termId: term1.id,
    },
  });

  // Payment for Term 2 (READY - siap dibayar)
  await prisma.payment.create({
    data: {
      amount: 2000000000,
      status: PaymentStatus.READY,
      termId: term2.id,
    },
  });

  // Payment for Term 3 (PENDING - belum valid)
  await prisma.payment.create({
    data: {
      amount: 1500000000,
      status: PaymentStatus.PENDING,
      termId: term3.id,
    },
  });

  console.log('✓ Payments created\n');

  // ============================================
  // CREATE AUDIT LOGS
  // ============================================
  console.log('Creating audit logs...');

  // SQLite doesn't support createMany, so create individually
  const auditLogs = [
    {
      action: AuditAction.CREATE,
      entityType: 'Project',
      entityId: project.id,
      description: 'Proyek "Pembangunan Gedung Kantor PT Maju Bersama" dibuat',
      userId: owner.id,
    },
    {
      action: AuditAction.CREATE,
      entityType: 'Contract',
      entityId: contract.id,
      description: 'Kontrak KTR-2024-001 dibuat dengan nilai Rp 5.000.000.000',
      userId: owner.id,
    },
    {
      action: AuditAction.SUBMIT_PROGRESS,
      entityType: 'Term',
      entityId: term1.id,
      description: 'Progres termin 1 diajukan oleh kontraktor',
      userId: contractor.id,
    },
    {
      action: AuditAction.VERIFY_APPROVE,
      entityType: 'Verification',
      entityId: term1.id,
      description: 'Termin 1 disetujui oleh Pengawas',
      userId: supervisor.id,
    },
    {
      action: AuditAction.VERIFY_APPROVE,
      entityType: 'Verification',
      entityId: term1.id,
      description: 'Termin 1 disetujui oleh Saksi',
      userId: witness.id,
    },
    {
      action: AuditAction.PAYMENT_CONFIRM,
      entityType: 'Payment',
      entityId: term1.id,
      description: 'Pembayaran termin 1 dikonfirmasi sebesar Rp 1.500.000.000',
      userId: owner.id,
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log('✓ Audit logs created\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ AMANTRA MVP Database Seeded Successfully!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n  Demo Accounts (Password: Password123!):\n');
  console.log('  ┌─────────────┬──────────────────────┬─────────────────────┐');
  console.log('  │ Role        │ Email                │ Name                │');
  console.log('  ├─────────────┼──────────────────────┼─────────────────────┤');
  console.log('  │ Owner       │ owner@amantra.id     │ Budi Santoso        │');
  console.log('  │ Kontraktor  │ kontraktor@amantra.id│ Andi Wijaya         │');
  console.log('  │ Pengawas    │ pengawas@amantra.id  │ Ir. Dewi Lestari    │');
  console.log('  │ Saksi       │ saksi@amantra.id     │ Dr. Rahmat Hidayat  │');
  console.log('  └─────────────┴──────────────────────┴─────────────────────┘');
  console.log('\n  Demo Project Status:');
  console.log('  • Termin 1: ✓ TERBAYAR (Rp 1.5M)');
  console.log('  • Termin 2: ⏳ VALID - Siap Dibayar (Rp 2M)');
  console.log('  • Termin 3: 🔄 DIAJUKAN - Menunggu Verifikasi (Rp 1.5M)');
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
