# Contract State Machine - Quick Reference

**Quick lookup guide for developers working with the contract state machine**

---

## 🎯 State Enum Values

| State | Value | Name | Description |
|-------|-------|------|-------------|
| 0 | INTENT_DECLARED | Initial intent | Contract created, awaiting signatures |
| 1 | PRE_CONTRACT_REVIEW | Legal review | Awaiting legal approval |
| 2 | CONTRACT_ACTIVE_LOCKED | Locked (48h cooldown) | Contract immutable, 48h mandatory wait |
| 3 | OPERATION_RUNNING | Execution phase | Work in progress |
| 4 | EVALUATION_AND_CALCULATION | Evaluation | Performance being assessed |
| 5 | RIGHTS_FINALIZED_AND_DISTRIBUTION | Distribution | Payment distribution occurring |
| 6 | CONTRACT_CLOSED_AND_ARCHIVED | Archived | TERMINAL - No further changes |
| 9 | EXCEPTION_AND_FORCE_MAJEURE | Emergency | Dispute/emergency mode (20-day window) |

---

## 🔄 State Transitions

```
0 → 1: Both signed + docs uploaded + docs <7 days old
1 → 2: Legal approval + mutual approval + both acknowledged (START 48H COOLDOWN)
2 → 3: Cooldown expired (MANDATORY - cannot skip)
3 → 4: Milestones complete + evaluation criteria met
4 → 5: Evaluation window active (<10 days) + rights verified
5 → 6: No further prerequisites (TERMINAL)
9 → *: Emergency/dispute mode (can transition from any state except 6)
```

---

## 🛡️ Guard Conditions Checklist

### Before State 0 → 1
```typescript
✓ contract.ownerSigned === true
✓ contract.contractorSigned === true
✓ contract.documents.length > 0
✓ (now - documents[0].uploadedAt) <= 7 days
```

### Before State 1 → 2 (CRITICAL)
```typescript
✓ contract.legalApproved === true
✓ contract.ownerApproved === true
✓ contract.contractorApproved === true
✓ acknowledgedBy.includes(ownerId)
✓ acknowledgedBy.includes(contractorId)
// STARTS 48-HOUR COOLDOWN
```

### Before State 2 → 3 (MANDATORY GUARD)
```typescript
✓ cooldown.expiresAt <= now()
✓ (now - cooldown.lockedAt) >= 48 hours
✓ contract.status !== ARCHIVED
// IF COOLDOWN NOT MET: TransitionGuardError
```

### Before State 3 → 4
```typescript
✓ milestones.every(m => m.completed === true)
✓ progressReports.all.submitted === true
✓ supervisor.approved === true
✓ witness.approved === true
```

### Before State 4 → 5
```typescript
✓ (now - evaluationStarted) < 10 days
✓ evaluation.passed === true
✓ rights.verified === true
✓ distribution.ready === true
```

### Before State 5 → 6
```typescript
✓ No prerequisites
✓ Either party can initiate
✓ After this: read-only mode
```

---

## 🚀 API Endpoints Quick Reference

### Query Endpoints
```bash
# Current state
GET /contract-state/:id/state
→ { currentState: 0-6|9 }

# Full context
GET /contract-state/:id/context
→ { currentState, metadata, transitions[], rights[], obligations[] }

# Cooldown status
GET /contract-state/:id/cooldown
→ { isActive, remainingMs, expiresAt }
```

### Transition Endpoints
```bash
# Transition to state 1
POST /contract-state/:id/transition/to-review
→ { success, newState: 1, message }

# Lock contract (→ state 2, starts cooldown)
POST /contract-state/:id/transition/lock
→ { success, newState: 2, cooldownExpiresAt }

# Start execution (→ state 3)
POST /contract-state/:id/transition/start-execution
→ { success, newState: 3 }

# Submit evaluation (→ state 4)
POST /contract-state/:id/transition/submit-for-evaluation
→ { success, newState: 4 }

# Finalize rights (→ state 5)
POST /contract-state/:id/transition/finalize-rights
→ { success, newState: 5 }

# Archive (→ state 6, TERMINAL)
POST /contract-state/:id/transition/close
→ { success, newState: 6, archived: true }

# Emergency (→ state 9)
POST /contract-state/:id/transition/emergency
{
  "reason": "string"
}
→ { success, newState: 9 }
```

### Acknowledgment
```bash
# Record acknowledgment
POST /contract-state/:id/acknowledge
{
  "type": "INITIAL_TERMS|MUTUAL_APPROVAL|LOCK_CONFIRMATION|...",
  "documentHash": "sha256_hex"
}
→ { acknowledged: true, acknowledgedAt }
```

---

## 💾 Frontend Store Usage

### Import
```typescript
import { useContractStateStore } from '@/stores/contractStateStore';
import { ContractState, stateLabels, stateColors } from '@/stores/contractStateStore';
```

### Common Patterns

```typescript
// Get store instance
const store = useContractStateStore();

// Fetch state (auto-triggers re-render)
await store.fetchStateContext(contractId);

// Check current state
if (store.currentState === ContractState.CONTRACT_ACTIVE_LOCKED) {
  // Contract is locked and immutable
}

// Get user-friendly label
console.log(stateLabels[store.currentState]); // "Contract Locked (State 2)"

// Get state color for UI
console.log(stateColors[store.currentState]); // "amber" | "green" | "red" | etc

// Check cooldown
if (store.cooldownStatus?.isActive) {
  console.log(`Cooldown: ${store.cooldownStatus.remainingMs}ms remaining`);
}

// Transition
try {
  await store.transitionToReview(contractId);
  // Store auto-refetches state
} catch (error) {
  console.error(store.error);
}

// Check if transition is possible
const canExecute = store.currentState === ContractState.CONTRACT_ACTIVE_LOCKED 
  && !store.cooldownStatus?.isActive;
```

---

## 🔐 Security Reminders

⚠️ **CRITICAL:**
- [ ] Guard conditions checked on BACKEND (not frontend)
- [ ] Cooldown is NON-SKIPPABLE - minimum 48 hours
- [ ] State 2 locks contract - NO MODIFICATIONS possible after
- [ ] State 6 is TERMINAL - no further transitions
- [ ] All transitions must be audited and immutable
- [ ] Acknowledgments require explicit user consent

---

## 🐛 Common Debugging

### "Guard failed: Cooldown not expired"
```typescript
// Possible cause: Cooldown duration not met
// Solution: Check cooldownExpiresAt is in the past
const cooldown = await store.fetchCooldownStatus(contractId);
console.log(cooldown.remainingMs); // Should be <= 0
```

### "Cannot transition from state X to Y"
```typescript
// Check guard conditions:
const context = await store.fetchStateContext(contractId);
console.log(context.guardStatus); // See which checks failed
```

### "State not updating in UI"
```typescript
// Ensure you're awaiting the transition
await store.transitionToReview(contractId); // don't forget await
// Store auto-refetches, but you can also manually fetch:
await store.fetchStateContext(contractId);
```

### "Cooldown shows as inactive but can't transition"
```typescript
// Check current state
if (store.currentState !== ContractState.CONTRACT_ACTIVE_LOCKED) {
  // Can't execute from non-locked state
  // Try transitioning to state 2 first
}
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `backend/src/contract-state/contract-state.service.ts` | State transition business logic |
| `backend/src/contract-state/contract-state.controller.ts` | REST API endpoints |
| `backend/contracts/AmantraContract.sol` | Smart contract (optional) |
| `frontend/src/stores/contractStateStore.ts` | Zustand state management |
| `frontend/src/components/ContractStateMachine.tsx` | UI component |
| `backend/prisma/schema.prisma` | Database schema updates |
| `docs/CONTRACT-STATE-MACHINE.md` | Full specification |
| `docs/CONTRACT-STATE-MACHINE-INTEGRATION.md` | Integration guide |
| `docs/DEPLOYMENT-CHECKLIST.md` | Deployment steps |

---

## ⏱️ Timing Reminders

| Duration | Purpose |
|----------|---------|
| **48 hours** | Mandatory cooldown after locking (State 1 → 2) |
| **7 days** | Maximum age for documents at State 0 → 1 |
| **10 days** | Evaluation window (State 4 → 5) |
| **20 days** | Dispute resolution window (State 9) |
| **5 seconds** | Frontend cooldown polling interval |

---

## 🎯 Rights & Obligations Matrix

### State 2 (CONTRACT_ACTIVE_LOCKED) - Rights
- ✓ OWNER: View contract, see execution timeline
- ✓ CONTRACTOR: View contract, see execution timeline
- ✓ SUPERVISOR: Monitor progress, approve/reject milestones
- ✓ WITNESS: Monitor progress, provide technical approval

### State 2 (CONTRACT_ACTIVE_LOCKED) - Obligations
- → OWNER: Cannot modify contract
- → CONTRACTOR: Cannot modify contract, must execute per terms
- → SUPERVISOR: Must monitor and verify progress
- → WITNESS: Must provide technical verification

---

## 🚨 Emergency Mode (State 9)

```typescript
// Invoke emergency from any state (except archived)
await store.invokeEmergency(contractId, "Dispute: Payment not received");

// In emergency mode:
// - Contract enters dispute resolution
// - 20-day window to resolve
// - Both parties can submit evidence
// - Can transition to archive (6) or back to previous state (after resolution)
```

---

**Last Updated:** January 24, 2025  
**Version:** 1.0  
**Maintainer:** AMANTRA Development Team

For detailed specifications, see [CONTRACT-STATE-MACHINE.md](CONTRACT-STATE-MACHINE.md)
