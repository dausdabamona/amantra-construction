# Contract State Machine - Integration Guide

**Date:** January 24, 2025  
**Status:** Ready for Integration  
**Version:** 1.0

---

## 📋 Overview

This guide provides step-by-step instructions for integrating the enterprise-grade contract state machine into the AMANTRA platform. The state machine has been implemented across three layers:

1. **Smart Contract (Solidity)** - EVM-compatible immutable state machine
2. **Backend Service (NestJS)** - REST API with guard conditions and audit logging
3. **Frontend Store (Zustand)** - Synchronized state management with polling

---

## 🚀 Integration Steps

### Step 1: Update Prisma Schema

Add contract state tracking tables to [backend/prisma/schema.prisma](backend/prisma/schema.prisma):

```prisma
// Add these models to your schema.prisma

model ContractStateLog {
  id                String    @id @default(cuid())
  contractId        String
  previousState     Int?
  newState          Int
  timestamp         DateTime  @default(now())
  transitionedBy    String
  reason            String?
  guardConditions   String?   // JSON
  hash              String?   // SHA256 immutability check
  
  contract          Project   @relation(fields: [contractId], references: [id], onDelete: Restrict)
  transitionedByUser User     @relation(fields: [transitionedBy], references: [id], onDelete: Restrict)
  
  @@index([contractId])
  @@index([newState])
  @@index([timestamp])
}

model ContractLockTimeout {
  id                    String    @id @default(cuid())
  contractId            String    @unique
  lockedAt              DateTime
  cooldownExpiresAt     DateTime
  cooldownDurationMs    Int       @default(172800000)  // 48 hours
  hasExpired            Boolean   @default(false)
  expirationVerifiedAt  DateTime?
  
  contract              Project   @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  @@index([cooldownExpiresAt])
  @@index([hasExpired])
}

model ContractAcknowledgment {
  id                  String    @id @default(cuid())
  contractId          String
  userId              String
  acknowledgedAt      DateTime
  ipAddress           String?
  userAgent           String?
  documentHash        String?
  signature           String?
  acknowledgmentType  String    // 'INITIAL_TERMS', 'MUTUAL_APPROVAL', etc.
  
  contract            Project   @relation(fields: [contractId], references: [id], onDelete: Cascade)
  user                User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  
  @@unique([contractId, userId, acknowledgmentType])
  @@index([contractId])
  @@index([userId])
}

model ContractGuardCheck {
  id            String    @id @default(cuid())
  contractId    String
  transitionId  String
  guardName     String
  passed        Boolean
  details       String?   // JSON
  checkedAt     DateTime  @default(now())
  
  contract      Project   @relation(fields: [contractId], references: [id], onDelete: Cascade)
  transition    ContractStateLog @relation(fields: [transitionId], references: [id], onDelete: Cascade)
  
  @@index([contractId])
  @@index([transitionId])
}

model ContractRights {
  id                String    @id @default(cuid())
  contractId        String
  state             Int
  role              String
  rightName         String
  rightDescription  String?
  grantedAt         DateTime  @default(now())
  revokedAt         DateTime?
  
  contract          Project   @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  @@index([contractId])
  @@index([state])
}

model ContractObligation {
  id                    String    @id @default(cuid())
  contractId            String
  state                 Int
  role                  String
  obligationName        String
  obligationDescription String?
  obligationDeadline    DateTime?
  status                String    @default("PENDING") // PENDING, IN_PROGRESS, COMPLETED, VIOLATED, WAIVED
  createdAt             DateTime  @default(now())
  completedAt           DateTime?
  
  contract              Project   @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  @@index([contractId])
  @@index([status])
}
```

Then update the `Project` model to include contract state:

```prisma
model Project {
  // ... existing fields ...
  
  contractState             Int?
  stateLog                  ContractStateLog[]
  lockTimeout               ContractLockTimeout?
  acknowledgments           ContractAcknowledgment[]
  guardChecks               ContractGuardCheck[]
  rights                    ContractRights[]
  obligations               ContractObligation[]
}
```

**Run migrations:**
```bash
cd backend
npx prisma migrate dev --name contract_state_tables
npx prisma generate
```

---

### Step 2: Register ContractStateModule in Backend

Update [backend/src/app.module.ts](backend/src/app.module.ts):

```typescript
import { ContractStateModule } from './contract-state/contract-state.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TermsModule,
    ProgressModule,
    VerificationsModule,
    PaymentsModule,
    AuditModule,
    ContractStateModule,  // ADD THIS
  ],
})
export class AppModule {}
```

Create the module file at [backend/src/contract-state/contract-state.module.ts](backend/src/contract-state/contract-state.module.ts):

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ContractStateService } from './contract-state.service';
import { ContractStateController } from './contract-state.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [ContractStateService],
  controllers: [ContractStateController],
  exports: [ContractStateService],
})
export class ContractStateModule {}
```

---

### Step 3: Import Store in Frontend

The Zustand store has already been created at [frontend/src/stores/contractStateStore.ts](frontend/src/stores/contractStateStore.ts).

To use it in components:

```typescript
import { useContractStateStore } from '@/stores/contractStateStore';

function MyComponent() {
  const store = useContractStateStore();
  
  // Fetch state
  await store.fetchContractState(contractId);
  
  // Transition
  await store.transitionToReview(contractId);
  
  // Access state
  console.log(store.currentState);  // ContractState enum value
}
```

---

### Step 4: Add State Machine Component to UI

Use the pre-built component in your pages:

```typescript
import ContractStateMachine from '@/components/ContractStateMachine';

function ContractPage({ contractId }: { contractId: string }) {
  return (
    <div>
      <h1>Contract Lifecycle</h1>
      <ContractStateMachine contractId={contractId} />
    </div>
  );
}
```

---

### Step 5: Deploy Smart Contract (Optional)

To deploy the Solidity contract to an EVM chain:

1. **Install Hardhat or Truffle:**
   ```bash
   npm install --save-dev hardhat
   npx hardhat init
   ```

2. **Copy contract to `contracts/` directory:**
   ```bash
   cp backend/contracts/AmantraContract.sol contracts/
   ```

3. **Compile:**
   ```bash
   npx hardhat compile
   ```

4. **Deploy to testnet:**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. **Store contract address in environment variables:**
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   VITE_CONTRACT_ADDRESS=0x...
   ```

---

## 📊 State Machine Validation

### Enum Values (Must be Synchronized)

**Solidity (contract):**
```solidity
enum ContractState {
  INTENT_DECLARED = 0,
  PRE_CONTRACT_REVIEW = 1,
  CONTRACT_ACTIVE_LOCKED = 2,
  OPERATION_RUNNING = 3,
  EVALUATION_AND_CALCULATION = 4,
  RIGHTS_FINALIZED_AND_DISTRIBUTION = 5,
  CONTRACT_CLOSED_AND_ARCHIVED = 6,
  EXCEPTION_AND_FORCE_MAJEURE = 9
}
```

**Backend (NestJS):**
```typescript
export enum ContractState {
  INTENT_DECLARED = 0,
  PRE_CONTRACT_REVIEW = 1,
  CONTRACT_ACTIVE_LOCKED = 2,
  OPERATION_RUNNING = 3,
  EVALUATION_AND_CALCULATION = 4,
  RIGHTS_FINALIZED_AND_DISTRIBUTION = 5,
  CONTRACT_CLOSED_AND_ARCHIVED = 6,
  EXCEPTION_AND_FORCE_MAJEURE = 9,
}
```

**Frontend (React/Zustand):**
```typescript
export enum ContractState {
  INTENT_DECLARED = 0,
  PRE_CONTRACT_REVIEW = 1,
  CONTRACT_ACTIVE_LOCKED = 2,
  OPERATION_RUNNING = 3,
  EVALUATION_AND_CALCULATION = 4,
  RIGHTS_FINALIZED_AND_DISTRIBUTION = 5,
  CONTRACT_CLOSED_AND_ARCHIVED = 6,
  EXCEPTION_AND_FORCE_MAJEURE = 9,
}
```

---

## 🔐 Critical Guard Conditions

### State 0 → State 1 (INTENT_DECLARED → PRE_CONTRACT_REVIEW)
- ✅ Both parties must have signed
- ✅ All documents must be uploaded
- ✅ Documents must be <7 days old

**Backend Check:**
```typescript
private validateInitialDocuments(contract: any) {
  if (!contract.ownerSigned || !contract.contractorSigned) {
    throw new Error('Both parties must sign before review');
  }
  if (!contract.documents || contract.documents.length === 0) {
    throw new Error('Documents must be uploaded');
  }
  const docAge = Date.now() - contract.documents[0].uploadedAt;
  if (docAge > 7 * 24 * 60 * 60 * 1000) {
    throw new Error('Documents are too old (>7 days)');
  }
}
```

### State 1 → State 2 (PRE_CONTRACT_REVIEW → CONTRACT_ACTIVE_LOCKED)
- ✅ Legal approval must be obtained
- ✅ Both parties must mutually approve
- ✅ Both parties must acknowledge terms
- ⏰ **48-hour mandatory cooldown starts**

### State 2 → State 3 (CONTRACT_ACTIVE_LOCKED → OPERATION_RUNNING)
- ✅ **Cooldown must have expired** (48 hours minimum)
- ✅ No modifications allowed after lock
- ✅ This is the execution trigger point

---

## 🔄 Cooldown Mechanism

The 48-hour cooldown is **mandatory and non-skippable**:

```typescript
// Backend tracks cooldown
async lockContract(contractId: string) {
  const lockedAt = new Date();
  const cooldownExpiresAt = new Date(lockedAt.getTime() + 48 * 60 * 60 * 1000);
  
  await prisma.contractLockTimeout.create({
    data: {
      contractId,
      lockedAt,
      cooldownExpiresAt,
      cooldownDurationMs: 48 * 60 * 60 * 1000,
    },
  });
}

// Frontend polls cooldown status every 5 seconds
const cooldownStatus = await store.fetchCooldownStatus(contractId);
// Returns: { isActive: boolean, remainingMs: number }
```

---

## 📝 Acknowledgment Workflow

All critical state transitions require explicit acknowledgment:

```typescript
// 1. User views contract terms
// 2. System records acknowledgment with metadata
await store.acknowledgeTerms(contractId, {
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  documentHash: sha256(contract.terms),
});

// 3. Backend verifies both parties have acknowledged before allowing lock
if (!hasAcknowledged(party1) || !hasAcknowledged(party2)) {
  throw new Error('Both parties must acknowledge terms before locking');
}
```

---

## 🎯 Common Integration Issues

### Issue: "Cooldown Not Respecting 48-Hour Requirement"
**Solution:** Ensure frontend respects `cooldownStatus.remainingMs`:
```typescript
const canExecute = !store.cooldownStatus?.isActive;
<button disabled={!canExecute}>Start Execution</button>
```

### Issue: "State Transitions Not Audited"
**Solution:** Verify audit logging is enabled:
```typescript
await auditService.log({
  action: 'CONTRACT_STATE_TRANSITION',
  entity: 'Contract',
  entityId: contractId,
  userId: user.id,
  details: { from: previousState, to: newState },
});
```

### Issue: "UI Not Updating After Transition"
**Solution:** Ensure store refetch after action:
```typescript
await store.transitionToReview(contractId);
// Store automatically refetches via action
```

---

## 📚 API Endpoints Reference

### Get Current State
```
GET /contract-state/:contractId/state
Response: { currentState: 0-6 | 9 }
```

### Get Full Context
```
GET /contract-state/:contractId/context
Response: {
  currentState: 0,
  metadata: { responsibleParty, deadline, ... },
  transitions: ContractStateLog[],
  acknowledgments: ContractAcknowledgment[],
  guardStatus: { checksPerformed, allPassed }
}
```

### Get Cooldown Status
```
GET /contract-state/:contractId/cooldown
Response: {
  isActive: true,
  remainingMs: 123456,
  cooldownExpiresAt: "2025-01-26T12:30:00Z"
}
```

### Transition Endpoints
```
POST /contract-state/:contractId/transition/to-review
POST /contract-state/:contractId/transition/lock
POST /contract-state/:contractId/transition/start-execution
POST /contract-state/:contractId/transition/submit-for-evaluation
POST /contract-state/:contractId/transition/finalize-rights
POST /contract-state/:contractId/transition/close
POST /contract-state/:contractId/transition/emergency
POST /contract-state/:contractId/acknowledge
```

---

## ✅ Testing Checklist

- [ ] Enum values match across all three layers (Solidity, NestJS, React)
- [ ] Database migration runs without errors
- [ ] ContractStateModule registers in AppModule
- [ ] Frontend store imports successfully
- [ ] State machine component renders without errors
- [ ] Can transition through State 0 → 1 (pre-review)
- [ ] Locking contract (State 1 → 2) starts cooldown
- [ ] Cannot start execution (State 2 → 3) until cooldown expires
- [ ] Cooldown timer displays and counts down correctly
- [ ] All transitions are audited in AuditLog
- [ ] Guard conditions prevent invalid transitions
- [ ] Contract becomes immutable after lock (State 2)
- [ ] Emergency state (9) accessible from any state
- [ ] Terminal state (6) prevents further transitions

---

## 📞 Support

For integration issues:

1. Check [docs/CONTRACT-STATE-MACHINE.md](docs/CONTRACT-STATE-MACHINE.md) for detailed state specifications
2. Review [backend/src/contract-state/contract-state.service.ts](backend/src/contract-state/contract-state.service.ts) for guard logic
3. Verify enum synchronization across all three layers
4. Check browser console and backend logs for specific error messages

---

**Generated:** January 24, 2025  
**Architecture Version:** 1.0  
**Next Steps:** Execute integration checklist above to activate state machine
