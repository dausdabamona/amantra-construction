# AMANTRA Construction - User Flow

## Alur Bisnis Utama

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AMANTRA CONSTRUCTION BUSINESS FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   1. CREATE     │     │   2. CREATE     │     │   3. DEFINE     │     │   4. EXECUTE    │
│    PROJECT      │────►│   CONTRACT      │────►│   WORK PHASES   │────►│     WORK        │
│    (Owner)      │     │ (Owner+Kontr.)  │     │   (TERMIN)      │     │  (Kontraktor)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                                                │
        ┌───────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   5. UPLOAD     │     │  6. MULTI-LAYER │     │   7. TERMIN     │     │   8. TRIGGER    │
│    PROGRESS     │────►│   VERIFICATION  │────►│   APPROVAL      │────►│   PAYMENT       │
│   (Kontraktor)  │     │(Pengawas+Saksi) │     │    (Owner)      │     │    (Admin)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                                                │
                                                                                │
                                                         All Activities ────────┼────► AUDIT LOG
                                                                                │
```

## Detailed User Flows

### Flow 1: Pembuatan Proyek (Owner)

```
Owner                                                System
  │                                                    │
  │──── Login ─────────────────────────────────────────►
  │◄─── Return JWT Token ─────────────────────────────│
  │                                                    │
  │──── Create Project ───────────────────────────────►
  │     {name, location, budget, dates}                │
  │                                                    │
  │                              ┌─ Generate project code
  │                              ├─ Assign owner
  │◄─── Project Created ─────────┴─ Log to audit
  │                                                    │
  │──── Assign Contractor ────────────────────────────►
  │◄─── Contractor Assigned ──────────────────────────│
  │                                                    │
  │──── Assign Supervisors ───────────────────────────►
  │◄─── Supervisors Assigned ─────────────────────────│
  │                                                    │
  │──── Assign Witnesses ─────────────────────────────►
  │◄─── Witnesses Assigned ───────────────────────────│
  │                                                    │
```

### Flow 2: Pembuatan Kontrak (Owner + Kontraktor)

```
Owner                     Kontraktor                    System
  │                           │                           │
  │──── Create Contract ──────┼───────────────────────────►
  │     {title, scope, value} │                           │
  │                           │                           │
  │                           │      ┌─ Generate contract number
  │                           │      ├─ Set status: DRAFT
  │◄─── Contract Created ─────┼──────┴─ Log to audit
  │                           │                           │
  │──── Sign Contract ────────┼───────────────────────────►
  │     {signatureHash}       │                           │
  │◄─── Owner Signed ─────────┼───────────────────────────│
  │                           │                           │
  │                           │──── Sign Contract ────────►
  │                           │     {signatureHash}       │
  │                           │                           │
  │                           │      ┌─ Both signed?
  │                           │      ├─ Yes: Activate contract
  │◄──────────────────────────┼◄─────┴─ Log to audit
  │   Contract ACTIVE         │                           │
```

### Flow 3: Definisi Termin (Owner)

```
Owner                                                System
  │                                                    │
  │──── Create Work Phase ────────────────────────────►
  │     {phaseNumber, name, deliverables,              │
  │      value, paymentPercentage,                     │
  │      minVerifications: 2}                          │
  │                                                    │
  │                              ┌─ Validate total % ≤ 100
  │                              ├─ Set status: PENDING
  │◄─── Phase Created ───────────┴─ Log to audit
  │                                                    │
  │──── Create Phase 2..N ────────────────────────────►
  │◄─── Phases Created ───────────────────────────────│
  │                                                    │
```

### Flow 4: Pelaksanaan Pekerjaan (Kontraktor)

```
Kontraktor                                           System
  │                                                    │
  │──── Start Phase ──────────────────────────────────►
  │     {phaseId}                                      │
  │                              ┌─ Set status: IN_PROGRESS
  │                              ├─ Set actualStartDate
  │◄─── Phase Started ───────────┴─ Log to audit
  │                                                    │
  │                                                    │
  │    ... Pekerjaan berlangsung ...                   │
  │                                                    │
  │──── Update Progress ──────────────────────────────►
  │     {completionPercentage: 50}                     │
  │◄─── Progress Updated ─────────────────────────────│
  │                                                    │
```

### Flow 5: Upload Laporan Progres (Kontraktor)

```
Kontraktor                                           System
  │                                                    │
  │──── Create Progress Report ───────────────────────►
  │     {title, description,                           │
  │      workCompleted, progressPct}                   │
  │                              ┌─ Generate report number
  │◄─── Report Created ──────────┴─ Status: DRAFT
  │                                                    │
  │──── Upload Evidence ──────────────────────────────►
  │     {file, type: PHOTO}                            │
  │                              ┌─ Calculate SHA-256 hash
  │                              ├─ Store file
  │◄─── Evidence Uploaded ───────┴─ Link to report
  │                                                    │
  │──── Submit Report ────────────────────────────────►
  │                              ┌─ Set status: SUBMITTED
  │                              ├─ Set submittedAt
  │◄─── Report Submitted ────────┴─ Notify verifiers
  │                                                    │
```

### Flow 6: Verifikasi Berlapis (Pengawas + Saksi)

```
Pengawas                    Saksi                      System
  │                           │                           │
  │◄── Notification: Report submitted ───────────────────│
  │                           │◄── Notification ─────────│
  │                           │                           │
  │──── View Report ──────────┼───────────────────────────►
  │◄─── Report Details ───────┼───────────────────────────│
  │                           │                           │
  │──── Create Verification ──┼───────────────────────────►
  │     {type: SUPERVISOR,    │                           │
  │      comments, findings}  │                           │
  │                           │                           │
  │──── Approve ──────────────┼───────────────────────────►
  │     {signatureHash}       │                           │
  │                           │                           │
  │◄─── Verification 1/2 ─────┼───────────────────────────│
  │                           │                           │
  │                           │──── Create Verification ──►
  │                           │     {type: WITNESS,       │
  │                           │      comments, findings}  │
  │                           │                           │
  │                           │──── Approve ──────────────►
  │                           │     {signatureHash}       │
  │                           │                           │
  │                           │      ┌─ Check: 2/2 verifications
  │                           │      ├─ Update phase: VERIFIED
  │◄──────────────────────────┼◄─────┴─ Notify owner
  │   Phase VERIFIED          │                           │
```

### Flow 7: Persetujuan Termin (Owner)

```
Owner                                                System
  │                                                    │
  │◄── Notification: Phase verified ─────────────────│
  │                                                    │
  │──── View Phase Details ───────────────────────────►
  │◄─── {phase, verifications, evidence} ─────────────│
  │                                                    │
  │──── Approve Phase ────────────────────────────────►
  │                              ┌─ Set status: APPROVED
  │                              ├─ Set actualEndDate
  │◄─── Phase Approved ──────────┴─ Ready for payment
  │                                                    │
```

### Flow 8: Pembayaran (Admin/Owner)

```
Admin                                                System
  │                                                    │
  │──── Create Payment ───────────────────────────────►
  │     {workPhaseId, amount,                          │
  │      method: BANK_TRANSFER}                        │
  │                              ┌─ Generate payment number
  │                              ├─ Set status: PENDING
  │◄─── Payment Created ─────────┴─ Log to audit
  │                                                    │
  │──── Update Status: APPROVED ──────────────────────►
  │◄─── Payment Approved ─────────────────────────────│
  │                                                    │
  │──── Process Payment ──────────────────────────────►
  │     {transactionRef}                               │
  │                              ┌─ Set status: PROCESSING
  │◄─── Payment Processing ──────┴─ Log to audit
  │                                                    │
  │──── Complete Payment ─────────────────────────────►
  │                              ┌─ Set status: COMPLETED
  │                              ├─ Set paidAt
  │                              ├─ Update phase: PAID
  │◄─── Payment Completed ───────┴─ Log to audit
  │                                                    │
```

### Alternative: Smart Contract Payment (Future)

```
Admin                                                System
  │                                                    │
  │──── Simulate Smart Contract Payment ──────────────►
  │     {paymentId}                                    │
  │                              ┌─ Generate blockchain tx hash
  │                              ├─ Set method: SMART_CONTRACT
  │                              ├─ Store smartContractRef
  │◄─── Payment via Blockchain ──┴─ Log to audit
  │                                                    │
```

## State Diagrams

### Project Status

```
    ┌─────────┐
    │  DRAFT  │
    └────┬────┘
         │ activate()
         ▼
    ┌─────────┐
    │  ACTIVE │◄───────┐
    └────┬────┘        │
         │             │ resume()
    hold()│            │
         ▼             │
    ┌─────────┐        │
    │ ON_HOLD ├────────┘
    └────┬────┘
         │ complete() / cancel() / dispute()
         ▼
┌─────────────┬───────────────┐
│  COMPLETED  │   CANCELLED   │   DISPUTED
└─────────────┴───────────────┘
```

### Work Phase Status

```
    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │ start()
         ▼
    ┌─────────────┐
    │ IN_PROGRESS │
    └──────┬──────┘
           │ submitForVerification()
           ▼
    ┌─────────────────────┐
    │ PENDING_VERIFICATION│
    └──────────┬──────────┘
               │ verifications complete
               ▼
    ┌──────────┐
    │ VERIFIED │
    └────┬─────┘
         │ approve()
         ▼
    ┌──────────┐
    │ APPROVED │
    └────┬─────┘
         │ payment completed
         ▼
    ┌──────┐
    │ PAID │
    └──────┘

    (REJECTED dapat terjadi dari PENDING_VERIFICATION)
```

### Verification Status

```
    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │
    ┌────┴────┬──────────────┐
    │         │              │
    ▼         ▼              ▼
┌──────┐ ┌────────┐ ┌─────────────────┐
│APPROVED│ │REJECTED│ │REVISION_REQUESTED│
└────────┘ └────────┘ └─────────────────┘
```

## Audit Trail

Setiap aksi dalam sistem tercatat di audit log:

| Action | Description |
|--------|-------------|
| CREATE | Pembuatan entitas baru |
| READ | Akses data (opsional) |
| UPDATE | Perubahan data |
| DELETE | Penghapusan (soft delete) |
| LOGIN | Login pengguna |
| LOGOUT | Logout pengguna |
| VERIFY | Verifikasi oleh pengawas/saksi |
| APPROVE | Persetujuan |
| REJECT | Penolakan |
| SUBMIT | Pengajuan untuk review |
| UPLOAD | Upload file bukti |
| DOWNLOAD | Download file |
| SIGN | Tanda tangan digital |
| PAYMENT | Aksi pembayaran |

Setiap audit log mencakup:
- User ID & nama
- Timestamp
- Entity type & ID
- Description
- Old value & New value (untuk UPDATE)
- IP Address & User Agent
