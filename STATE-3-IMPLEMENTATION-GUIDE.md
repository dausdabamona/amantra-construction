# State 3: OPERATION_RUNNING - Complete Implementation Guide

**Status:** ✅ Fully Implemented (100%)
**Date Completed:** January 26, 2025
**Scope:** Backend API (5 files), Smart Contract (1 file), Frontend (9 files), Documentation (3 guides)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Smart Contract Functions](#smart-contract-functions)
7. [Workflow Examples](#workflow-examples)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is OPERATION_RUNNING?

State 3 represents the execution phase of the construction contract. After funds are locked and both parties confirm their commitment (State 2: CONTRACT_ACTIVE_LOCKED), the actual construction work begins.

**Key Characteristics:**

- ✅ Funds are locked in escrow (not accessible)
- 🚀 Work is actively executing
- 📋 Progress must be reported via milestone-based reporting
- ✅ All reports must be verified before payment
- 🔒 Rights are on hold until all milestones completed
- ⏳ Deadlines are enforced with overdue detection
- 💰 No distribution possible until verified

### Contract Lifecycle in State 3

```
Entry Point: startOperation()
├─ Initialize 3 milestones
├─ Set state to OPERATION_RUNNING
├─ Set waiting state to WAITING_FOR_REPORT
└─ Emit OperationStarted event

During Operation:
├─ Contractor submits report: submitReport()
├─ ProjectOwner verifies: verifyReport()
├─ On approval: milestone marked complete
├─ On rejection: contractor re-submits report
└─ Repeat for all 3 milestones

Exit Point: All milestones verified
└─ Transition to EVALUATION_AND_CALCULATION state
```

---

## Architecture

### 3-Layer Security Model

```
Frontend Layer (React/Next.js)
├─ Validation on form submission
├─ Button disabling based on state
├─ Warning banners for deadlines
└─ Clear "waiting for" indicators

API Layer (NestJS Backend)
├─ DTO validation with class-validator
├─ Business logic guards
├─ Permission checks
├─ Audit logging
└─ Exception handling

Blockchain Layer (Solidity)
├─ Immutable state tracking
├─ Guard modifiers
├─ Event emissions
└─ Irreversible operations
```

### Data Flow

```
User Action (Frontend)
    ↓
HTTP Request with DTO
    ↓
NestJS Controller (JWT validation)
    ↓
Service Layer (Business Logic + Guards)
    ↓
Audit Log Entry
    ↓
Smart Contract Call (State update)
    ↓
Event Emission
    ↓
Response to Frontend
    ↓
Store Update (Zustand)
    ↓
UI Re-render
```

---

## Implementation Details

### Backend Files (5 Total)

#### 1. **operation.dto.ts** (~750 lines)
- **Purpose:** Define all data transfer objects with validation
- **Exports:**
  - Enums: ReportStatus, OperationWaitingState, VerificationResult, ...
  - DTOs: StartOperationDto, SubmitReportDto, VerifyReportDto, GetProgressDto
  - Response wrappers: OperationResponseDto, OperationStateResponseDto
- **Features:** Full Swagger documentation, Indonesian validation messages

#### 2. **operation.service.ts** (~500 lines)
- **Purpose:** Implement business logic with guards and validation
- **Core Methods:**
  - `startOperation()` - Transition to OPERATION_RUNNING
  - `getOperationState()` - Get current state
  - `submitReport()` - Submit progress report
  - `verifyReport()` - Verify submitted report
  - `getProgress()` - Get complete operation progress
- **Guards:** 5-layer validation chain
- **Features:** Mock data, audit logging, event emission

#### 3. **operation.controller.ts** (~300 lines)
- **Purpose:** REST API endpoints for operation management
- **Endpoints:**
  - `POST /contract/:id/operation/start` - Start operation
  - `GET /contract/:id/operation` - Get full progress
  - `POST /contract/:id/operation/report` - Submit report
  - `POST /contract/:id/operation/verify` - Verify report
  - `GET /contract/:id/operation/state` - Get state only
- **Features:** Full Swagger docs, JWT protection, error handling

#### 4. **operation.module.ts** (~20 lines)
- **Purpose:** NestJS module registration
- **Imports:** PrismaModule, AuditModule
- **Exports:** OperationService

#### 5. **app.module.ts** (Modified +2 lines)
- **Purpose:** Register OperationModule in main app
- **Change:** Added OperationModule import and registration

### Frontend Files (9 Total)

#### Types (`types/operation.ts`)
- **Enums:** OperationState, OperationWaitingState, ReportStatus, VerificationResultType, ActivityType
- **Interfaces:** 20+ type definitions for full type safety
- **Selectors & Computed Values:** Helper types for store

#### Store (`stores/useOperationStore.ts`)
- **State Management:** Zustand store with localStorage persistence
- **Actions:** 9 methods for state management
- **Selectors:** 12 selector hooks for optimized re-renders
- **Computed Hooks:** useOperationContext, useContractRightsContext, useContractObligationsContext

#### Components (6 Total)
1. **ContractStatePanel** - Display state, day counter, active milestone
2. **RightsObligationsPanel** - Rights on hold and current obligations
3. **NextConditionPanel** - What we're waiting for and deadline
4. **ActivityTimeline** - Immutable audit trail visualization
5. **ReportSubmissionForm** - Contractor interface for reporting
6. **VerificationStatusBadge** - Visual status indicator

#### Page (`pages/contract/[id]/operation.tsx`)
- **Route:** `/contract/[id]/operation`
- **Layout:** 3-column with state, conditions, and timeline
- **Features:** Real-time updates, error handling, loading states

### Smart Contract (`operation.contract.sol`)
- **Events:** 6 events (OperationStarted, ReportSubmitted, ReportVerified, etc.)
- **Functions:** 8 functions (startOperation, submitReport, verifyReport, etc.)
- **Guards:** 5 modifiers for state transitions
- **Data Structures:** Milestone, Report, OperationState tracking

---

## API Endpoints

### 1. Start Operation

**Endpoint:** `POST /contract/:id/operation/start`

**Request:**
```json
{
  "confirmOperationStart": true,
  "scheduledStartTime": "2026-02-01T00:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Operasi konstruksi berhasil dimulai...",
  "data": {
    "operationState": { ... },
    "submittedReports": [],
    "activityTimeline": [ ... ],
    "milestoneSummary": { ... }
  },
  "error": null,
  "timestamp": "2026-02-01T12:30:45Z"
}
```

**Guards:**
- Contract owner only
- Must be in CONTRACT_ACTIVE_LOCKED state
- Funds must be locked
- confirmOperationStart must be true
- scheduledStartTime must be future date

---

### 2. Get Progress

**Endpoint:** `GET /contract/:id/operation`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Status operasi diperoleh",
  "data": {
    "operationState": {
      "state": "OPERATION_RUNNING",
      "waitingState": "WAITING_FOR_VERIFICATION",
      "activeMilestoneNumber": 1,
      "daysSinceStart": 5,
      "daysUntilDeadline": 35,
      "isOverdue": false,
      "overallProgress": 33,
      "milestones": [ ... ],
      "currentResponsibleParty": "PT Contoh Konstruksi",
      "waitingFor": "Verifikasi laporan dari ProjectOwner"
    },
    "submittedReports": [ ... ],
    "activityTimeline": [ ... ],
    "milestoneSummary": {
      "total": 3,
      "completed": 1,
      "pending": 2,
      "inReview": 0,
      "overallProgress": 33
    }
  },
  "error": null,
  "timestamp": "2026-02-06T12:30:45Z"
}
```

---

### 3. Submit Report

**Endpoint:** `POST /contract/:id/operation/report`

**Request:**
```json
{
  "milestoneNumber": 1,
  "progressDescription": "Lokasi telah siap, material sudah tiba, tim terbentuk dan siap mulai",
  "completionPercentage": 85,
  "photoUrls": [
    "https://cdn.example.com/photo1.jpg",
    "https://cdn.example.com/photo2.jpg"
  ],
  "notes": "Kualitas material sudah diverifikasi oleh supplier"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Laporan kemajuan berhasil dikirim dan menunggu verifikasi...",
  "data": {
    "reportId": "0x...",
    "milestoneNumber": 1,
    "status": "SUBMITTED",
    "submittedDate": "2026-02-06T12:30:45Z",
    "completionPercentage": 85,
    "reportHash": "0x..."
  },
  "error": null,
  "timestamp": "2026-02-06T12:30:45Z"
}
```

**Guards:**
- Operation must be running
- Milestone must exist (1-3)
- Completion percentage 0-100
- Caller must be contractor
- Cannot submit for already-verified milestone

---

### 4. Verify Report

**Endpoint:** `POST /contract/:id/operation/verify`

**Request:**
```json
{
  "milestoneNumber": 1,
  "result": "APPROVED",
  "verificationNotes": "Semua deliverable terpenuhi dengan baik",
  "foundIssues": []
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan disetujui. Milestone dianggap selesai dan pembayaran dapat diproses.",
  "data": {
    "reportId": "0x...",
    "status": "VERIFIED",
    "verifiedBy": "owner@example.com",
    "verifiedDate": "2026-02-07T09:15:30Z",
    "verificationNotes": "Semua deliverable terpenuhi dengan baik"
  },
  "error": null,
  "timestamp": "2026-02-07T09:15:30Z"
}
```

**Possible Results:**
- `APPROVED` - Milestone complete, can proceed
- `REJECTED` - Milestone failed, contractor must redo
- `REVISION_REQUIRED` - Needs minor fixes, resubmit

---

### 5. Get Operation State

**Endpoint:** `GET /contract/:id/operation/state`

**Response (200 OK):** (Lightweight - state only)
```json
{
  "success": true,
  "message": "Status operasi diperoleh",
  "data": {
    "state": "OPERATION_RUNNING",
    "waitingState": "WAITING_FOR_VERIFICATION",
    "activeMilestoneNumber": 1,
    "daysSinceStart": 5,
    "daysUntilDeadline": 35,
    "isOverdue": false,
    "overallProgress": 33
  },
  "error": null,
  "timestamp": "2026-02-06T12:30:45Z"
}
```

---

## Frontend Components

### ContractStatePanel
**Purpose:** Show current contract state, day counter, and active milestone

**Props:**
- `className?: string` - CSS classes

**Displays:**
- Current state (OPERATION_RUNNING, etc.)
- Days elapsed (live counter)
- Active milestone with progress bar
- Milestone summary (total, completed, pending)
- Overall progress percentage
- Overdue/deadline warning if applicable

**Example Usage:**
```tsx
<ContractStatePanel />
```

---

### RightsObligationsPanel
**Purpose:** Show rights on hold and current obligations

**Props:**
- `className?: string`

**Displays:**
- Rights that are locked and why
- When they will be released
- Release conditions
- Current obligation and deadline
- Progress percentage
- Consequence of not meeting deadline
- Blocked vs allowed actions

---

### NextConditionPanel
**Purpose:** Show what we're waiting for and action items

**Props:**
- `className?: string`

**Displays:**
- Waiting state icon and description
- Responsible party
- Time remaining (live countdown)
- Deadline date
- Step-by-step action items
- Urgency badge

---

### ActivityTimeline
**Purpose:** Display immutable audit trail

**Props:**
- `className?: string`
- `maxItems?: number` (default 10)

**Displays:**
- Chronological list of activities
- Activity type with icon
- Description and actor
- Timestamp
- Status indicator
- Details if available
- Audit trail certification notice

---

### ReportSubmissionForm
**Purpose:** Interface for contractors to submit progress reports

**Props:**
- `contractId: string` - Contract ID
- `onSubmit?: (data) => Promise<void>` - Submit handler
- `onCancel?: () => void` - Cancel handler
- `isLoading?: boolean` - Loading state
- `className?: string`

**Features:**
- Progress percentage slider
- Description textarea
- Photo upload with drag-drop
- Photo preview with delete
- Additional notes field
- Deliverable checklist
- Form validation
- Tips box

---

### VerificationStatusBadge
**Purpose:** Visual indicator of report verification status

**Props:**
- `report: ProgressReport` - Report object
- `showDetails?: boolean` (default true)
- `className?: string`

**Displays:**
- Status icon and label
- Report details
- Verification info
- Found issues (if rejected)
- Report hash
- Photo count
- Status-specific messages

---

## Smart Contract Functions

### startOperation()
**Purpose:** Transition from CONTRACT_ACTIVE_LOCKED to OPERATION_RUNNING

**Guards:**
1. Contract in CONTRACT_ACTIVE_LOCKED state
2. Funds locked in escrow
3. Caller is contract owner
4. Scheduled start time in future

**Actions:**
1. Initialize 3 standard milestones
2. Set operation as active
3. Initialize waiting state to WAITING_FOR_REPORT
4. Emit OperationStarted event

---

### submitReport()
**Purpose:** Submit progress report for milestone

**Guards:**
1. Operation running
2. Milestone exists (1-3)
3. Completion percentage 0-100
4. Caller is responsible party

**Actions:**
1. Create report with SUBMITTED status
2. Generate unique reportId
3. Store reportHash for integrity
4. Update milestone status
5. Change waiting state to WAITING_FOR_VERIFICATION
6. Emit ReportSubmitted event

---

### verifyReport()
**Purpose:** Verify submitted report

**Actions if APPROVED:**
1. Update status to VERIFIED
2. Update milestone status
3. Calculate overall progress
4. Emit ReportVerified event
5. If all verified, allow state advancement

**Actions if REJECTED:**
1. Update status to REJECTED
2. Keep milestone in SUBMITTED state
3. Update waiting state to WAITING_FOR_REPORT

---

## Workflow Examples

### Example 1: Complete Happy Path (All Approved)

```
Day 1: startOperation()
  ├─ Set state = OPERATION_RUNNING
  ├─ Initialize milestones 1, 2, 3
  ├─ Set waitingState = WAITING_FOR_REPORT
  └─ Emit OperationStarted

Days 2-30: Work on Milestone 1
  ├─ Contractor works on site preparation
  └─ Takes progress photos

Day 30: submitReport(milestone=1, progress=100%)
  ├─ Report created with SUBMITTED status
  ├─ Photos uploaded
  ├─ waitingState = WAITING_FOR_VERIFICATION
  ├─ Emit ReportSubmitted
  └─ Waiting for ProjectOwner

Day 32: verifyReport(milestone=1, result=APPROVED)
  ├─ Report status = VERIFIED
  ├─ Milestone 1 completed
  ├─ overallProgress = 33%
  ├─ Set activeMilestoneNumber = 2
  ├─ waitingState = WAITING_FOR_REPORT
  ├─ Emit ReportVerified & MilestoneCompleted
  └─ Waiting for Milestone 2 report

... Repeat for Milestones 2 and 3 ...

Day 150: All 3 milestones verified
  ├─ overallProgress = 100%
  ├─ Rights now ready to be released
  ├─ Can transition to EVALUATION_AND_CALCULATION
  └─ Next step: Final payment calculation
```

---

### Example 2: Report Rejection & Resubmission

```
Day 30: submitReport(milestone=1, progress=80%)
  ├─ Report SUBMITTED
  └─ Waiting for verification

Day 32: verifyReport(milestone=1, result=REJECTED)
  ├─ Issues found: "Kualitas material tidak sesuai spesifikasi"
  ├─ Report status = REJECTED
  ├─ Milestone stays SUBMITTED
  ├─ waitingState = WAITING_FOR_REPORT
  └─ Contractor notified to redo work

Days 33-40: Contractor fixes issues and re-works

Day 40: submitReport(milestone=1, progress=100%)
  ├─ New report SUBMITTED
  ├─ Waiting for verification
  └─ Previous rejected report available for reference

Day 42: verifyReport(milestone=1, result=APPROVED)
  ├─ Report VERIFIED
  ├─ Milestone 1 complete
  └─ Proceed to Milestone 2
```

---

### Example 3: Deadline Overdue

```
Milestone 1 target: Feb 15
Day 1: startOperation(), waitingState = WAITING_FOR_REPORT

Days 2-14: Contractor working...

Day 15: Deadline reached
  ├─ isOverdue flag set
  ├─ daysOverdue = 0
  ├─ Warning banner shown
  └─ Denda starts accumulating

Day 20: verifyReport(milestone=1, result=APPROVED)
  ├─ Report VERIFIED
  ├─ daysOverdue = 5
  ├─ Penalty calculated based on daysOverdue
  └─ Frontend shows "5 HARI TERTUNDA"
```

---

## Testing Guide

### Backend Testing

#### 1. Start Operation
```bash
curl -X POST http://localhost:3001/contract/contract-001/operation/start \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmOperationStart": true,
    "scheduledStartTime": "2026-02-15T00:00:00Z"
  }'
```

#### 2. Submit Report
```bash
curl -X POST http://localhost:3001/contract/contract-001/operation/report \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneNumber": 1,
    "progressDescription": "Pekerjaan 85% selesai",
    "completionPercentage": 85,
    "photoUrls": ["photo1.jpg", "photo2.jpg"],
    "notes": "Kualitas bagus"
  }'
```

#### 3. Get Progress
```bash
curl -X GET http://localhost:3001/contract/contract-001/operation \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### 4. Verify Report
```bash
curl -X POST http://localhost:3001/contract/contract-001/operation/verify \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneNumber": 1,
    "result": "APPROVED",
    "verificationNotes": "Bagus, lanjut"
  }'
```

### Frontend Testing

#### Test 1: Operation Flow
1. Navigate to `/contract/contract-001/operation`
2. Click "Mulai Operasi"
3. Observe state change to OPERATION_RUNNING
4. Check ContractStatePanel shows day counter

#### Test 2: Submit Report
1. Select Milestone 1
2. Set progress to 85%
3. Add photos
4. Click "Kirim Laporan"
5. Check store updates with new report

#### Test 3: Real-time Updates
1. Start operation
2. Open browser console
3. Check live countdown in NextConditionPanel
4. Verify updates every second

#### Test 4: Deadline Warnings
1. Start operation with past milestone deadline
2. ContractStatePanel shows red/orange warning
3. NextConditionPanel shows CRITICAL urgency

---

## Troubleshooting

### Issue: "Operation not running" Error

**Cause:** Trying to submit report before starting operation

**Solution:**
1. Call startOperation() first
2. Wait for OperationStarted event
3. Then submit report

### Issue: Report hash mismatch

**Cause:** Report data changed after submission

**Solution:**
1. Use verifyReportIntegrity() function
2. Check blockchain event logs
3. Get original report from audit trail

### Issue: Deadline not showing

**Cause:** Target completion date not set properly

**Solution:**
1. Check Milestone structure in service
2. Verify targetCompletionDate is set
3. Recalculate daysUntilDeadline

### Issue: Store not updating

**Cause:** Zustand store not receiving data

**Solution:**
1. Check API response structure
2. Verify setOperationData() called
3. Check browser console for errors
4. Clear localStorage and reload

### Issue: Photo upload not working

**Cause:** File size too large or wrong format

**Solution:**
1. Compress photos
2. Use JPG/PNG/WebP only
3. Max 5 MB per file
4. Max 5 photos total

---

## Performance Optimization

### Frontend
- Use selector hooks to prevent unnecessary re-renders
- Lazy load components with React.lazy()
- Optimize images before upload
- Use useMemo for expensive calculations

### Backend
- Add database indexing on contractId and milestoneNumber
- Cache milestone definitions
- Use pagination for timeline queries
- Add query result caching (Redis)

### Smart Contract
- Minimize storage operations
- Use events for logging instead of storage
- Batch operations when possible
- Optimize gas usage

---

## Next Steps (State 4 - EVALUATION_AND_CALCULATION)

After all milestones are verified in State 3:

1. Trigger evaluation logic
2. Calculate final amounts
3. Determine distribution percentages
4. Prepare payment breakdown
5. Emit EvaluationComplete event
6. Transition to State 4: EVALUATION_AND_CALCULATION

---

## References

- [AMANTRA Architecture](../ARCHITECTURE.md)
- [MVP Architecture](../docs/MVP-ARCHITECTURE.md)
- [User Flow](../docs/user-flow.md)
- [Smart Contract Reference](./operation.contract.sol)
- [API Reference](./operation.controller.ts)

---

**Document Version:** 1.0
**Last Updated:** January 26, 2025
**Status:** Complete & Ready for Testing
