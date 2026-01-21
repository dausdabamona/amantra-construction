import { PrismaClient, UserRole, UserStatus, ProjectStatus, ContractStatus, PhaseStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.evidenceFile.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.workPhase.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.projectWitness.deleteMany();
  await prisma.projectSupervisor.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Create Users
  console.log('Creating users...');

  const owner = await prisma.user.create({
    data: {
      email: 'owner@amantra.id',
      passwordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      fullName: 'Budi Santoso',
      phone: '+6281234567890',
      company: 'PT Maju Bersama',
      position: 'Direktur Utama',
    },
  });

  const contractor = await prisma.user.create({
    data: {
      email: 'kontraktor@amantra.id',
      passwordHash,
      role: UserRole.CONTRACTOR,
      status: UserStatus.ACTIVE,
      fullName: 'Andi Wijaya',
      phone: '+6281234567891',
      company: 'PT Konstruksi Handal',
      position: 'Project Manager',
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'pengawas@amantra.id',
      passwordHash,
      role: UserRole.SUPERVISOR,
      status: UserStatus.ACTIVE,
      fullName: 'Ir. Dewi Lestari',
      phone: '+6281234567892',
      company: 'Konsultan Pengawas Jaya',
      position: 'Pengawas Lapangan',
      licenseNumber: 'SKA-TK-001234',
      specialization: 'Teknik Sipil',
    },
  });

  const witness = await prisma.user.create({
    data: {
      email: 'saksi@amantra.id',
      passwordHash,
      role: UserRole.WITNESS,
      status: UserStatus.ACTIVE,
      fullName: 'Dr. Rahmat Hidayat',
      phone: '+6281234567893',
      company: 'Universitas Teknologi Indonesia',
      position: 'Dosen & Konsultan',
      licenseNumber: 'SKA-AK-005678',
      specialization: 'Struktur Bangunan',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@amantra.id',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      fullName: 'Admin Sistem',
      phone: '+6281234567894',
      company: 'AMANTRA',
      position: 'System Administrator',
    },
  });

  const auditor = await prisma.user.create({
    data: {
      email: 'auditor@amantra.id',
      passwordHash,
      role: UserRole.AUDITOR,
      status: UserStatus.ACTIVE,
      fullName: 'Siti Nurhaliza',
      phone: '+6281234567895',
      company: 'KAP Audit Prima',
      position: 'Senior Auditor',
      licenseNumber: 'CPA-12345',
    },
  });

  console.log('Users created ✓');

  // Create Project
  console.log('Creating project...');

  const project = await prisma.project.create({
    data: {
      projectCode: 'PRJ-2024-DEMO01',
      name: 'Pembangunan Gedung Kantor PT Maju Bersama',
      description: 'Proyek pembangunan gedung perkantoran 5 lantai dengan basement',
      location: 'Jl. Sudirman No. 123, Jakarta Pusat',
      estimatedBudget: 15000000000,
      currency: 'IDR',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
      status: ProjectStatus.ACTIVE,
      ownerId: owner.id,
      contractorId: contractor.id,
    },
  });

  // Assign supervisor and witness to project
  await prisma.projectSupervisor.create({
    data: {
      projectId: project.id,
      userId: supervisor.id,
    },
  });

  await prisma.projectWitness.create({
    data: {
      projectId: project.id,
      userId: witness.id,
    },
  });

  console.log('Project created ✓');

  // Create Contract
  console.log('Creating contract...');

  const contract = await prisma.contract.create({
    data: {
      contractNumber: 'KTR-202401-DEMO01',
      title: 'Kontrak Pekerjaan Struktur Gedung Kantor',
      description: 'Kontrak untuk pekerjaan struktur utama gedung',
      scope: 'Pekerjaan struktur beton bertulang, pondasi, kolom, balok, dan plat lantai 1-5',
      totalValue: 8000000000,
      currency: 'IDR',
      retentionPercentage: 5,
      status: ContractStatus.ACTIVE,
      signedDate: new Date('2024-01-10'),
      effectiveDate: new Date('2024-01-15'),
      projectId: project.id,
      termsConditions: JSON.stringify({
        paymentTerms: 'Pembayaran per termin setelah verifikasi',
        warranty: '2 tahun',
        penalty: '0.1% per hari keterlambatan',
      }),
    },
  });

  console.log('Contract created ✓');

  // Create Work Phases (Termin)
  console.log('Creating work phases...');

  const phases = [
    {
      phaseNumber: 1,
      name: 'Pekerjaan Pondasi',
      description: 'Galian dan pemasangan pondasi tiang pancang dan pile cap',
      deliverables: JSON.stringify([
        'Galian tanah',
        'Pemasangan tiang pancang',
        'Pile cap',
        'Sloof',
      ]),
      acceptanceCriteria: 'Sesuai gambar kerja dan spesifikasi teknis',
      phaseValue: 1600000000,
      paymentPercentage: 20,
      plannedStartDate: new Date('2024-01-15'),
      plannedEndDate: new Date('2024-03-15'),
      status: PhaseStatus.VERIFIED,
      completionPercentage: 100,
      actualStartDate: new Date('2024-01-15'),
      actualEndDate: new Date('2024-03-10'),
    },
    {
      phaseNumber: 2,
      name: 'Pekerjaan Struktur Lantai 1-2',
      description: 'Pekerjaan kolom, balok, dan plat lantai 1 dan 2',
      deliverables: JSON.stringify([
        'Kolom lantai 1',
        'Balok lantai 1',
        'Plat lantai 1',
        'Kolom lantai 2',
        'Balok lantai 2',
        'Plat lantai 2',
      ]),
      phaseValue: 2400000000,
      paymentPercentage: 30,
      plannedStartDate: new Date('2024-03-16'),
      plannedEndDate: new Date('2024-06-15'),
      status: PhaseStatus.IN_PROGRESS,
      completionPercentage: 65,
      actualStartDate: new Date('2024-03-16'),
    },
    {
      phaseNumber: 3,
      name: 'Pekerjaan Struktur Lantai 3-5',
      description: 'Pekerjaan kolom, balok, dan plat lantai 3, 4, dan 5',
      deliverables: JSON.stringify([
        'Struktur lantai 3',
        'Struktur lantai 4',
        'Struktur lantai 5',
        'Atap',
      ]),
      phaseValue: 2400000000,
      paymentPercentage: 30,
      plannedStartDate: new Date('2024-06-16'),
      plannedEndDate: new Date('2024-09-15'),
      status: PhaseStatus.PENDING,
      completionPercentage: 0,
    },
    {
      phaseNumber: 4,
      name: 'Pekerjaan Finishing Struktur',
      description: 'Finishing struktur dan serah terima',
      deliverables: JSON.stringify([
        'Waterproofing',
        'Expansion joint',
        'Pembersihan',
        'Dokumentasi as-built',
      ]),
      phaseValue: 1600000000,
      paymentPercentage: 20,
      plannedStartDate: new Date('2024-09-16'),
      plannedEndDate: new Date('2024-12-15'),
      status: PhaseStatus.PENDING,
      completionPercentage: 0,
    },
  ];

  for (const phase of phases) {
    await prisma.workPhase.create({
      data: {
        ...phase,
        contractId: contract.id,
        minVerifications: 2,
      },
    });
  }

  console.log('Work phases created ✓');

  // Create sample audit logs
  console.log('Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        userId: owner.id,
        action: 'CREATE',
        entityType: 'Project',
        entityId: project.id,
        description: 'Proyek "Pembangunan Gedung Kantor PT Maju Bersama" dibuat',
        projectId: project.id,
      },
      {
        userId: owner.id,
        action: 'CREATE',
        entityType: 'Contract',
        entityId: contract.id,
        description: 'Kontrak "Kontrak Pekerjaan Struktur Gedung Kantor" dibuat',
        projectId: project.id,
        contractId: contract.id,
      },
      {
        userId: contractor.id,
        action: 'UPDATE',
        entityType: 'WorkPhase',
        entityId: 'phase-1',
        description: 'Termin 1 dimulai',
        contractId: contract.id,
      },
      {
        userId: supervisor.id,
        action: 'VERIFY',
        entityType: 'WorkPhase',
        entityId: 'phase-1',
        description: 'Termin 1 diverifikasi oleh pengawas',
        contractId: contract.id,
      },
    ],
  });

  console.log('Audit logs created ✓');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Demo accounts:');
  console.log('----------------------------');
  console.log('Owner:      owner@amantra.id');
  console.log('Contractor: kontraktor@amantra.id');
  console.log('Supervisor: pengawas@amantra.id');
  console.log('Witness:    saksi@amantra.id');
  console.log('Admin:      admin@amantra.id');
  console.log('Auditor:    auditor@amantra.id');
  console.log('----------------------------');
  console.log('Password:   Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
