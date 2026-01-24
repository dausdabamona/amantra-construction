# State 6: CONTRACT_CLOSED_AND_ARCHIVED Implementation Summary

## Overview
Implemented the terminal state (State 6) of the AMANTRA contract lifecycle. Once a contract enters this state, it becomes **immutable and read-only**. No further modifications, re-openings, or re-distributions are allowed.

---

## Backend Implementation

### 1. **Prisma Schema Updates** (`backend/prisma/schema.prisma`)
Added three new models for archive management:

- **ContractArchive** - Central registry for closed contracts
  - `finalState`: Terminal state flag
  - `finalHash`: Immutable hash of final state
  - `finalRightsSnapshot`: Complete JSON snapshot of rights and distribution
  - `transactionHashes`: All on-chain transaction IDs
  - `transitionLog`: Full state machine transition history
  - `phaseTimestamps`: Timestamps for each contract phase (intent → archive)
  - `distributionCompleted`: Boolean confirming all transfers are confirmed
  - `archivedAt`: Archive timestamp (immutable record)
  - `closedBy`: User ID who initiated closure
  - `notes`: Optional closure notes

- **FinalReport** - Formal closure report
  - `title`, `summary`, `totalFunds`, `totalResult`, `durationDays`, `documentUrl`
  - Links to contract and archive
  - Maintains historical record of contract completion

- **AuditTrail** - Immutable audit trail for archived contracts
  - `action`: Type of action (e.g., 'DISTRIBUTION_COMPLETED', 'ARCHIVE_FINALIZED')
  - `message`: Human-readable description
  - `actorId`: User who performed action
  - `txHash`: Related blockchain transaction
  - Comprehensive audit log preserved at closure time

### 2. **Archive Service** (`backend/src/archive/archive.service.ts`)

**Key Methods:**

- **`close(contractId, userId, dto)`** - Terminal transition
  - **Guards:**
    - Distribution must be fully prepared and executed
    - All transfer instructions must be confirmed
    - No pending objections or active exceptions
    - Evaluation finalized with calculation hash
  - **Actions:**
    - Creates immutable archive record
    - Snapshots all final rights and distribution details
    - Collects all transaction hashes for traceability
    - Generates final report with metadata
    - Creates comprehensive audit trail
    - Records closure in contract and audit logs

- **`getArchive(contractId)`** - Read-only archive retrieval
  - Returns complete `ArchiveSnapshot` with all immutable data
  - Suitable for audits, compliance, and historical reference

- **`getHistory(contractId)`** - Transition and audit history
  - Returns state transition log and full audit trail
  - Demonstrates complete chain of custody

### 3. **Archive Controller** (`backend/src/archive/archive.controller.ts`)

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/contract/:id/close` | POST | Close contract and create archive (terminal transition) |
| `/contract/:id/archive` | GET | Retrieve immutable archive snapshot (read-only) |
| `/contract/:id/history` | GET | Get state transition and audit history |

All endpoints are JWT-protected and honor role-based access control.

### 4. **Archive Module** (`backend/src/archive/archive.module.ts`)
- Imports: `PrismaModule`, `AuditModule`
- Wired into `AppModule`

### 5. **DTOs** (`backend/src/archive/dto/archive.dto.ts`)

- `CloseContractDto` - Closure request with optional final report metadata
- `ArchiveSnapshotDto` - Immutable snapshot of archived contract
- `AuditTrailItemDto` - Individual audit entry
- `FinalReportDto` - Formal closure report
- `ArchiveResponseDto<T>` - Standard API response envelope

---

## Smart Contract (Solidity) Updates

### 1. **State Variables**
```solidity
mapping(bytes32 => bool) public distributionCompleted;  // Track distribution completion
```

### 2. **Events**
```solidity
event ContractClosed(bytes32 indexed contractId, uint256 timestamp);
event ContractArchived(bytes32 indexed contractId, bytes32 finalHash, uint256 timestamp);
```

### 3. **Functions**

**`distribute(contractId)`**
- Sets `distributionCompleted[contractId] = true`
- Emits `DistributionCompleted` event
- Precondition: All guards from State 5 (hash check, objections cleared)
- Does NOT yet close contract (allows distribution finalization before terminal close)

**`closeContract(contractId)` (NEW)**
- **Requires:**
  - Current state = `RIGHTS_FINALIZED_AND_DISTRIBUTION`
  - `distributionCompleted[contractId] == true`
  - `evaluationCalculationHash[contractId] != bytes32(0)`
- **Actions:**
  - Sets state to `CONTRACT_CLOSED_AND_ARCHIVED`
  - Emits `ContractClosed` and `ContractArchived` events
  - Transitions to terminal state (no further changes possible)
- **Guards prevent:**
  - Re-opening, re-distributing, or re-evaluating
  - Any state changes after archive

---

## Frontend Implementation

### 1. **Types** (`frontend/src/types/archive.ts`)

```typescript
interface ArchiveSnapshot {
  contractId: string;
  finalState: string;  // 'CONTRACT_CLOSED_AND_ARCHIVED'
  finalHash?: string;  // Immutable final hash
  finalRightsSnapshot: ArchiveFinalRightsSnapshot;  // Complete rights snapshot
  transactionHashes: string[];  // All on-chain tx IDs
  transitionLog: any[];  // State machine history
  phaseTimestamps: ArchivePhaseTimestamps;  // Timeline of all phases
  distributionCompleted: boolean;
  closedBy?: string;
  archivedAt: string;  // Immutable timestamp
  notes?: string;
  finalReport?: ArchiveFinalReport;
  auditTrail: ArchiveAuditTrailItem[];
}
```

### 2. **Store** (`frontend/src/stores/useArchiveStore.ts`)

Zustand store for archive state management:
- `snapshot`: Current archive data
- `loading`, `error`: UI state
- `setData()`: Load archive
- `setError()`: Manage errors
- `reset()`: Clear state

Persisted to localStorage for offline access.

### 3. **Components**

#### **ContractStatePanel** (`frontend/src/components/archive/ContractStatePanel.tsx`)
- Displays state = "CONTRACT_CLOSED_AND_ARCHIVED"
- Shows final hash, archived timestamp, closed-by info
- Displays read-only guard warning
- Shows transaction hash collection

#### **FinalSummaryCard** (`frontend/src/components/archive/FinalSummaryCard.tsx`)
- Duration calculation (intent declared → archived)
- Total funds and total result from report
- Report title, summary, document link
- Closure notes display

#### **RightsObligationsHistoryTable** (`frontend/src/components/archive/RightsObligationsHistoryTable.tsx`)
- Displays final shares (investor, operator)
- Shows fees and penalties applied
- Details all distribution instructions
- Status of each transfer (CONFIRMED)
- Transaction hashes for each instruction

#### **FullTimelineViewer** (`frontend/src/components/archive/FullTimelineViewer.tsx`)
- Complete state machine timeline
- All 9 phases: Intent → Locked → Operation → Evaluation → Rights → Distribution → Archive
- Timestamps for each phase
- Visual timeline with indicators

#### **DocumentDownloadSection** (`frontend/src/components/archive/DocumentDownloadSection.tsx`)
- Link to final report PDF
- Immutable archive hash display
- All transaction hashes (hyperlinked/copyable)
- Final state snapshot JSON
- Audit trail link
- Terminal state warning (read-only access only)

### 4. **Route** (`frontend/src/pages/contract/[id]/archive.tsx`)

**ArchivePage:**
- Fetches archive snapshot via `archiveService.getArchive(contractId)`
- Displays all archive components
- Shows last 20 audit trail entries
- Manages loading/error states
- Read-only by design (no modify buttons, no state changes)

### 5. **API Client** (`frontend/src/services/api.ts`)

```typescript
export const archiveService = {
  closeContract: async (contractId: string, data: any) => { ... },
  getArchive: async (contractId: string) => { ... },
  getHistory: async (contractId: string) => { ... },
};
```

### 6. **State Store** (`frontend/src/stores/contractStateStore.ts`)

Updated `closeContract()` action:
- Calls backend `/contract-state/:id/transition/close` endpoint
- Transitions state to `CONTRACT_CLOSED_AND_ARCHIVED`
- Refetches context with archived metadata
- Error handling for failed transitions

---

## Guard Conditions & Validations

### Backend Guards

1. **Distribution must be complete:**
   - `finalRights.txStatus == 'CONFIRMED'`
   - All `distributionInstructions` status == `'CONFIRMED'`
   - Completion log entry exists

2. **No active objections:**
   - Evaluation objections resolved
   - No pending exceptions/force majeure

3. **Current state validation:**
   - Must be in `RIGHTS_FINALIZED_AND_DISTRIBUTION` state
   - Cannot skip intermediate states

4. **Immutability:**
   - Once archived, no modifications allowed
   - All data becomes read-only
   - Terminal state = no further transitions

### Smart Contract Guards

```solidity
function closeContract(bytes32 _contractId) external
  onlyState(_contractId, RIGHTS_FINALIZED_AND_DISTRIBUTION)
  onlyAuthorized(_contractId)
{
  require(distributionCompleted[_contractId], "Distribution not confirmed");
  require(evaluationCalculationHash[_contractId] != 0, "Hash required");
  // ... transitions to CLOSED_AND_ARCHIVED (terminal)
}
```

---

## Data Immutability & Audit Trail

### Captured at Archive Time

1. **Full State Snapshot:**
   - All final rights (investor/operator shares, fees, penalties)
   - All distribution instructions with status and tx hashes
   - All transfer execution logs

2. **Transaction History:**
   - Every on-chain transaction ID related to the contract
   - Maintains cryptographic proof of state changes

3. **Transition Timeline:**
   - Complete state machine journey from intent → archive
   - Timestamp of each phase
   - User who initiated each transition

4. **Audit Trail:**
   - Every action taken on the contract
   - Actor (user ID), action type, message
   - Related transaction hashes
   - Immutable historical record

### Read-Only Access

- Archive endpoints (`GET /contract/:id/archive`, `GET /contract/:id/history`) are **read-only**
- No modification, no state changes
- Can be referenced by future contracts as historical proof
- Suitable for compliance audits and regulatory review

---

## Database Relationships

```
Contract
  ├─ ContractArchive (1:1) ← Terminal archive record
  │   ├─ FinalReport (1:1) ← Formal closure report
  │   └─ AuditTrail[] (1:M) ← Immutable audit entries
  │
  ├─ FinalRights
  │   └─ DistributionInstruction[]
  │   └─ TransferExecutionLog[]
  │
  └─ AuditLog[] ← Legacy audit (contract-level)
```

---

## State Machine Diagram

```
... (States 0-5)
       │
       ▼
   5: RIGHTS_FINALIZED_AND_DISTRIBUTION
       │
       ├─ [Guard: Distribution complete + no objections]
       │
       ▼
   6: CONTRACT_CLOSED_AND_ARCHIVED ◄── TERMINAL STATE
       │
       ├─ NO FURTHER TRANSITIONS
       ├─ READ-ONLY MODE ACTIVE
       └─ IMMUTABLE ARCHIVE CREATED
```

---

## API Endpoints Summary

### Backend Archive Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/contract/:id/close` | POST | JWT | Close contract (State 5→6, terminal) |
| `/contract/:id/archive` | GET | JWT | Retrieve immutable archive snapshot |
| `/contract/:id/history` | GET | JWT | Get transition + audit history |

### State Management Endpoints (Existing)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/contract-state/:id/transition/close` | POST | JWT | Trigger state transition to ARCHIVED |
| `/contract-state/:id/state` | GET | JWT | Get current contract state |
| `/contract-state/:id/context` | GET | JWT | Get full state context with metadata |

---

## Implementation Checklist

- ✅ Prisma models added (ContractArchive, FinalReport, AuditTrail)
- ✅ Archive service implemented with close/getArchive/getHistory methods
- ✅ Archive controller with 3 endpoints
- ✅ Archive module created and wired to AppModule
- ✅ Solidity contract updated with closeContract function and guards
- ✅ Solidity distributionCompleted tracking added
- ✅ Frontend types for ArchiveSnapshot
- ✅ Zustand store for archive state
- ✅ 5 archive component views (ContractStatePanel, FinalSummary, RightsHistory, Timeline, Documents)
- ✅ Archive route page created
- ✅ API client (archiveService) integrated
- ✅ Contract state store updated with closeContract transition
- ✅ Guard conditions enforced in backend and smart contract

---

## Next Steps (Post-Deployment)

1. **Run Prisma migrations:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

2. **Frontend build & test:**
   ```bash
   cd frontend
   npm run build
   npm run test
   ```

3. **Integration testing:**
   - Test full contract lifecycle: Intent → Archive
   - Verify guards prevent unauthorized transitions
   - Validate immutability of archived data
   - Test audit trail completeness

4. **Compliance review:**
   - Ensure audit trail meets regulatory requirements
   - Validate data retention and accessibility
   - Test read-only access controls

---

## Notes for Developers

- **No recalculation in State 6:** All rights and obligations are frozen. Distribution amounts cannot be modified.
- **Terminal state guard:** Use `onlyState(CLOSED_AND_ARCHIVED)` modifiers to prevent operations on archived contracts.
- **Immutability:** All archive data is stored as JSON snapshots. Consider encryption for sensitive data in production.
- **Off-chain storage:** Consider IPFS or similar for FinalReport PDFs for long-term availability.
- **Blockchain sync:** Ensure contract closure is always coordinated with on-chain closeContract() call for cryptographic proof.

---

## Files Modified/Created

### Backend
- ✅ `backend/prisma/schema.prisma` - Added 3 models
- ✅ `backend/src/archive/archive.service.ts` - Service implementation
- ✅ `backend/src/archive/archive.controller.ts` - Controller with 3 endpoints
- ✅ `backend/src/archive/archive.module.ts` - Module definition
- ✅ `backend/src/archive/dto/archive.dto.ts` - DTOs
- ✅ `backend/src/app.module.ts` - Imported ArchiveModule
- ✅ `backend/src/contract-state/contract-state.service.ts` - Enhanced closeContract guard
- ✅ `backend/contracts/AmantraContract.sol` - Added closeContract + events

### Frontend
- ✅ `frontend/src/types/archive.ts` - Type definitions
- ✅ `frontend/src/stores/useArchiveStore.ts` - Zustand store
- ✅ `frontend/src/components/archive/ContractStatePanel.tsx` - State display
- ✅ `frontend/src/components/archive/FinalSummaryCard.tsx` - Summary (enhanced)
- ✅ `frontend/src/components/archive/FullTimelineViewer.tsx` - Timeline viewer
- ✅ `frontend/src/components/archive/RightsObligationsHistoryTable.tsx` - Rights table
- ✅ `frontend/src/components/archive/DocumentDownloadSection.tsx` - Document section
- ✅ `frontend/src/pages/contract/[id]/archive.tsx` - Archive page
- ✅ `frontend/src/services/api.ts` - Added archiveService
- ✅ `frontend/src/stores/contractStateStore.ts` - Updated closeContract action

---

**Status:** ✅ **COMPLETE**

State 6: CONTRACT_CLOSED_AND_ARCHIVED is fully implemented across backend, smart contract, and frontend. All guards, audit trails, and immutability protections are in place. Ready for testing and deployment.
