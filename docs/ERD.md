# AMANTRA Construction - Entity Relationship Diagram

## Overview

Sistem AMANTRA Construction menggunakan arsitektur database yang dirancang untuk mendukung:
- Kontrak konstruksi berbasis termin
- Verifikasi berlapis (multi-sign)
- Audit trail lengkap
- Integrasi dengan smart contract (future)

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    AMANTRA CONSTRUCTION ERD                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐        ┌──────────────────┐        ┌──────────────────┐
│    USER      │        │     PROJECT      │        │    CONTRACT      │
├──────────────┤        ├──────────────────┤        ├──────────────────┤
│ id (PK)      │◄──────┐│ id (PK)          │◄──────┐│ id (PK)          │
│ email        │       ││ projectCode      │       ││ contractNumber   │
│ passwordHash │       ││ name             │       ││ title            │
│ role         │       ││ description      │       ││ description      │
│ status       │       ││ location         │       ││ scope            │
│ fullName     │       ││ estimatedBudget  │       ││ totalValue       │
│ phone        │       ││ currency         │       ││ currency         │
│ company      │       ││ startDate        │       ││ retentionPercent │
│ position     │       ││ endDate          │       ││ signedDate       │
│ licenseNo    │       ││ status           │       ││ effectiveDate    │
│ specialization       ││ ownerId (FK)─────┘       ││ status           │
│ createdAt    │       ││ contractorId(FK)─┘       ││ termsConditions  │
│ updatedAt    │       ││ completionPct    │       ││ ownerSignHash    │
│ deletedAt    │       ││ createdAt        │       ││ contractorSignHash
│ lastLoginAt  │       ││ updatedAt        │       ││ projectId (FK)───┘
└──────────────┘       ││ deletedAt        │       ││ createdAt        │
       │               │└──────────────────┘       ││ updatedAt        │
       │               │         │                 ││ deletedAt        │
       │               │         │                 │└──────────────────┘
       │               │         │                 │         │
       │               │         ▼                 │         │
       │               │ ┌────────────────┐        │         ▼
       │               │ │PROJECT_SUPERVISOR      │ ┌──────────────────┐
       │               │ ├────────────────┤        │ │   WORK_PHASE     │
       │               └─│ id (PK)        │        │ │    (TERMIN)      │
       │                 │ projectId (FK)─┘        │ ├──────────────────┤
       └────────────────►│ userId (FK)            │ │ id (PK)          │
                         │ assignedAt     │        │ │ phaseNumber      │
                         │ removedAt      │        │ │ name             │
                         │ isActive       │        │ │ description      │
                         └────────────────┘        │ │ deliverables     │
                                                   │ │ acceptCriteria   │
                         ┌────────────────┐        │ │ phaseValue       │
                         │ PROJECT_WITNESS│        │ │ paymentPercent   │
                         ├────────────────┤        │ │ plannedStartDate │
                         │ id (PK)        │        │ │ plannedEndDate   │
                         │ projectId (FK)─┘        │ │ actualStartDate  │
       └────────────────►│ userId (FK)            │ │ actualEndDate    │
                         │ assignedAt     │        │ │ status           │
                         │ removedAt      │        │ │ completionPct    │
                         │ isActive       │        │ │ minVerifications │
                         └────────────────┘        │ │ contractId (FK)──┘
                                                   │ │ createdAt        │
                                                   │ │ updatedAt        │
                                                   │ │ deletedAt        │
                                                   │ └──────────────────┘
                                                   │          │
                     ┌─────────────────────────────┼──────────┼──────────────────────┐
                     │                             │          │                      │
                     ▼                             │          ▼                      ▼
          ┌──────────────────┐                     │ ┌──────────────────┐  ┌──────────────────┐
          │ PROGRESS_REPORT  │                     │ │  VERIFICATION    │  │    PAYMENT       │
          ├──────────────────┤                     │ ├──────────────────┤  ├──────────────────┤
          │ id (PK)          │                     │ │ id (PK)          │  │ id (PK)          │
          │ reportNumber     │                     │ │ type             │  │ paymentNumber    │
          │ title            │                     │ │ status           │  │ amount           │
          │ description      │                     │ │ comments         │  │ currency         │
          │ workCompleted    │                     │ │ findings         │  │ method           │
          │ issuesEncountered│                     │ │ recommendations  │  │ status           │
          │ nextSteps        │                     │ │ checklistItems   │  │ bankName         │
          │ progressPercent  │                     │ │ signatureHash    │  │ accountNumber    │
          │ status           │                     │ │ verifiedAt       │  │ accountName      │
          │ submittedAt      │                     │ │ workPhaseId (FK)─┘  │ transactionRef   │
          │ workPhaseId (FK)─┘                     │ │ progressReportId│   │ paidAt           │
          │ submittedById(FK)◄─────────────────┐   │ │ verifierId (FK)─────│ blockchainTxHash │
          │ createdAt        │                  │   │ │ createdAt       │  │ smartContractRef │
          │ updatedAt        │                  │   │ │ updatedAt       │  │ contractId (FK)──┘
          │ deletedAt        │                  │   │ └──────────────────┘  │ workPhaseId(FK)──┘
          └──────────────────┘                  │   │                       │ createdAt        │
                     │                          │   │                       │ updatedAt        │
                     │                          │   │                       │ deletedAt        │
                     │                          │   │                       └──────────────────┘
                     │                          │   │
                     └──────────────────────────┼───┼───────────────────┐
                                                │   │                   │
                                                ▼   ▼                   ▼
                                         ┌──────────────────┐    ┌──────────────────┐
                                         │  EVIDENCE_FILE   │    │   AUDIT_LOG      │
                                         ├──────────────────┤    ├──────────────────┤
                                         │ id (PK)          │    │ id (PK)          │
                                         │ fileName         │    │ action           │
                                         │ originalName     │    │ entityType       │
                                         │ mimeType         │    │ entityId         │
                                         │ fileSize         │    │ description      │
                                         │ filePath         │    │ oldValue         │
                                         │ fileHash         │    │ newValue         │
                                         │ hashAlgorithm    │    │ ipAddress        │
                                         │ type             │    │ userAgent        │
                                         │ description      │    │ userId (FK)──────┘
                                         │ capturedAt       │    │ projectId (FK)   │
                                         │ location         │    │ contractId (FK)  │
                                         │ contractId (FK)  │    │ createdAt        │
                                         │ progressReportId │    └──────────────────┘
                                         │ verificationId   │
                                         │ paymentId        │
                                         │ createdAt        │
                                         │ uploadedAt       │
                                         │ deletedAt        │
                                         └──────────────────┘
```

## Entity Descriptions

### User
Pengguna sistem dengan berbagai role:
- **OWNER**: Pemberi kerja/Pemilik proyek
- **CONTRACTOR**: Kontraktor pelaksana
- **SUPERVISOR**: Pengawas proyek (memiliki license)
- **WITNESS**: Saksi ahli (memiliki specialization)
- **ADMIN**: Administrator sistem
- **AUDITOR**: Auditor untuk review

### Project
Proyek konstruksi dengan informasi:
- Budget, timeline, lokasi
- Relasi ke owner dan contractor
- Status tracking (DRAFT → ACTIVE → COMPLETED)

### Contract
Kontrak kerja dengan fitur:
- Nilai kontrak dan retensi
- Digital signature support
- Terms & conditions (JSON)

### WorkPhase (Termin)
Tahapan pekerjaan dengan:
- Deliverables dan acceptance criteria
- Progress tracking
- Minimum verification requirements

### ProgressReport
Laporan progres dari kontraktor:
- Detail pekerjaan yang sudah selesai
- Issues dan next steps
- Status workflow (DRAFT → SUBMITTED → VERIFIED)

### Verification
Verifikasi berlapis:
- Multiple types (SUPERVISOR, WITNESS, OWNER, TECHNICAL)
- Digital signature hash
- Checklist support

### Payment
Pembayaran termin:
- Multiple methods (BANK_TRANSFER, QRIS, RTGS, ESCROW, SMART_CONTRACT)
- Blockchain integration ready
- Status tracking

### EvidenceFile
File bukti dengan:
- Hash integrity check (SHA-256)
- Multiple types (PHOTO, VIDEO, DOCUMENT, etc.)
- GPS location support

### AuditLog
Catatan audit untuk:
- Semua aksi dalam sistem
- Old/new value tracking
- IP address dan user agent

## Indexes

Semua tabel memiliki index untuk:
- Primary key (UUID)
- Foreign keys
- Frequently queried fields (status, email, etc.)
- Timestamps (createdAt)

## Soft Delete

Semua entitas utama menggunakan soft delete dengan field `deletedAt`:
- Data tidak dihapus permanen
- Mendukung restore dan audit
- Query default exclude deleted items
