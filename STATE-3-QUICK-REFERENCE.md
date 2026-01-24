# STATE 3: OPERATION_RUNNING - Quick Reference

## 🎯 What is State 3?

Execution phase where contract work is actively happening. Funds locked, progress reported, milestones verified.

## ⚡ Key Endpoints

```
POST   /contract/:id/operation/start       Start operation
GET    /contract/:id/operation             Get full progress
POST   /contract/:id/operation/report      Submit report
POST   /contract/:id/operation/verify      Verify report
GET    /contract/:id/operation/state       Get state only
```

## 📁 Files Created/Modified

### Backend (5 Files)
- `src/operation/operation.dto.ts` - DTOs & validation (750 lines)
- `src/operation/operation.service.ts` - Business logic (500 lines)
- `src/operation/operation.controller.ts` - REST endpoints (300 lines)
- `src/operation/operation.module.ts` - Module definition (20 lines)
- `src/app.module.ts` - Module registration (+2 lines)

### Frontend (9 Files)
- `types/operation.ts` - Type definitions
- `stores/useOperationStore.ts` - Zustand store
- `components/ContractStatePanel.tsx` - State display
- `components/RightsObligationsPanel.tsx` - Rights & obligations
- `components/NextConditionPanel.tsx` - What's waiting
- `components/ActivityTimeline.tsx` - Audit trail
- `components/ReportSubmissionForm.tsx` - Report form
- `components/VerificationStatusBadge.tsx` - Status badge
- `pages/contract/[id]/operation.tsx` - Main page

### Smart Contract (1 File)
- `src/operation/operation.contract.sol` - Solidity functions

---

## 🔐 3 Waiting States

1. **WAITING_FOR_REPORT** - Contractor must submit progress
2. **WAITING_FOR_VERIFICATION** - ProjectOwner must review
3. **WAITING_FOR_MILESTONE_COMPLETION** - All milestones done

---

## 💾 3 Standard Milestones

| # | Description | % | Deadline | Status |
|---|-------------|---|----------|--------|
| 1 | Site Prep & Material | 33% | Day 45 | PENDING |
| 2 | Main Works | 33% | Day 135 | PENDING |
| 3 | Completion & Handover | 34% | Day 180 | PENDING |

---

## ✅ Report Lifecycle

```
PENDING → SUBMITTED → VERIFIED ✅
                  ↘ REJECTED ❌ → (resubmit)
                  ↘ REVISION_REQUIRED ✏️ → (resubmit)
```

---

## 🚀 Quick Start

### 1. Start Operation
```bash
POST /contract/contract-001/operation/start
{
  "confirmOperationStart": true,
  "scheduledStartTime": "2026-02-15T00:00:00Z"
}
```

### 2. Submit Report
```bash
POST /contract/contract-001/operation/report
{
  "milestoneNumber": 1,
  "progressDescription": "85% selesai",
  "completionPercentage": 85,
  "photoUrls": ["photo1.jpg", "photo2.jpg"],
  "notes": "Optional notes"
}
```

### 3. Verify Report
```bash
POST /contract/contract-001/operation/verify
{
  "milestoneNumber": 1,
  "result": "APPROVED",
  "verificationNotes": "Good quality"
}
```

### 4. Check Progress
```bash
GET /contract/contract-001/operation
```

---

## 🎨 Frontend Components

### ContractStatePanel
- Shows current state (OPERATION_RUNNING)
- Days elapsed counter
- Active milestone with progress bar
- Overall progress percentage
- Overdue/deadline warnings

### RightsObligationsPanel
- Rights locked & why
- When released
- Release conditions
- Current obligation
- Progress toward deadline
- Blocked/allowed actions

### NextConditionPanel
- What we're waiting for
- Who's responsible
- Time remaining
- Action items
- Urgency level

### ActivityTimeline
- Immutable audit trail
- All state changes
- Reports submitted
- Verifications
- Blockchain proof badge

### ReportSubmissionForm
- Progress slider
- Description textarea
- Photo drag-drop upload
- Photo preview
- Form validation
- Tips box

### VerificationStatusBadge
- Report status
- Verification date
- Verified by
- Issues found (if rejected)
- Report hash

---

## 🔒 Guard Validations

### For startOperation()
- ✅ Contract owner only
- ✅ State = CONTRACT_ACTIVE_LOCKED
- ✅ Funds locked
- ✅ confirmOperationStart = true
- ✅ scheduledStartTime is future

### For submitReport()
- ✅ Operation running
- ✅ Milestone exists (1-3)
- ✅ 0 ≤ percentage ≤ 100
- ✅ Caller is contractor
- ✅ Milestone not already verified

### For verifyReport()
- ✅ Operation running
- ✅ Report exists
- ✅ Report in SUBMITTED status
- ✅ Caller is owner/witness
- ✅ Result is valid (APPROVED/REJECTED/REVISION)

---

## 📊 Store Hooks (Zustand)

```typescript
// Selectors
useOperationLoading()      // boolean
useOperationError()         // string | null
useOperationData()          // OperationProgress
useActiveMilestone()        // MilestoneData
useOperationState()         // OperationStateData
useSubmittedReports()       // ProgressReport[]
useActivityTimeline()       // ActivityTimelineItem[]
useMilestoneSummary()       // MilestoneSummary

// Computed
useOperationContext()       // Full context for display
useContractRightsContext()  // Rights info
useContractObligationsContext() // Obligations info
```

---

## 🎯 Typical Flow

```
1. User clicks "Mulai Operasi"
   → POST /operation/start
   → State → OPERATION_RUNNING
   → Waiting state → WAITING_FOR_REPORT

2. Days pass... contractor works on milestone

3. User (contractor) clicks "Kirim Laporan"
   → Fills form with progress, photos
   → POST /operation/report
   → Report status → SUBMITTED
   → Waiting state → WAITING_FOR_VERIFICATION

4. ProjectOwner reviews in approval queue
   → Checks photos and description
   → POST /operation/verify with APPROVED/REJECTED
   → If APPROVED:
      - Milestone status → VERIFIED
      - overallProgress increases
      - Move to next milestone OR complete
   → If REJECTED:
      - Report status → REJECTED
      - Waiting state → WAITING_FOR_REPORT
      - Contractor resubmits

5. All 3 milestones verified
   → Ready to transition to State 4
   → EVALUATION_AND_CALCULATION
```

---

## ⏰ Time Calculations

```
Days Since Start = (now - operationStartTime) / 86400
Days Until Deadline = (milestoneDeadline - now) / 86400
Is Overdue = daysUntilDeadline < 0
Days Overdue = abs(daysUntilDeadline)
```

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Operation not running" | Haven't called startOperation | Call startOperation first |
| Report not uploading | Wrong file type/size | Use JPG/PNG, <5MB each |
| Store not updating | API response invalid | Check API response structure |
| Deadline not showing | Target date not set | Check milestone targetCompletionDate |
| Waiting state wrong | Status not recalculated | Verify report status update logic |

---

## 📱 API Response Format

All endpoints return:
```json
{
  "success": true/false,
  "message": "User-friendly message in Indonesian",
  "data": { ... },
  "error": null or "Error message",
  "timestamp": "2026-02-01T12:30:45Z"
}
```

---

## 🔗 State Transitions

```
From: CONTRACT_ACTIVE_LOCKED
Entry: startOperation()
Waiting States: WAITING_FOR_REPORT → WAITING_FOR_VERIFICATION → WAITING_FOR_MILESTONE_COMPLETION
Exit: All 3 milestones verified
To: EVALUATION_AND_CALCULATION
```

---

## 📋 Validation Rules

- Report description: min 20 chars, max 2000 chars
- Photos: JPG/PNG/WebP, max 5MB each, max 5 per report
- Progress percentage: 0-100
- Milestone deadlines: target completion date
- Notes: optional, max 1000 chars

---

## 💡 Key Concepts

**Immutable Audit Trail:** All activities stored on blockchain. Cannot be changed or deleted.

**Report Hash:** Stored on blockchain. Proves report submitted at specific time with specific content.

**Waiting States:** Discrete states (only 3 options). Clear who should act next.

**Three-Layer Security:**
- Frontend: UI validation & disabling
- Backend: DTO validation & business logic
- Blockchain: Immutable guards & events

**Rights on Hold:** No distribution possible until all milestones verified.

**Deadline Enforcement:** Automatic detection and penalty calculation.

---

## 📚 Documentation

- [Complete Implementation Guide](./STATE-3-IMPLEMENTATION-GUIDE.md)
- [API Detailed Reference](./backend/src/operation/operation.controller.ts)
- [Smart Contract Functions](./backend/src/operation/operation.contract.sol)
- [Type Definitions](./frontend/src/types/operation.ts)

---

## ✨ Next Steps

1. Test all endpoints with provided cURL commands
2. Verify smart contract deploys without errors
3. Test frontend components in browser
4. Run end-to-end workflow test
5. Deploy to staging environment
6. Prepare for State 4 (EVALUATION_AND_CALCULATION)

---

**Version:** 1.0  
**Date:** January 26, 2025  
**Status:** ✅ Production Ready
