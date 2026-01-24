# Contract State Machine Architecture

## Global Enum (All Layers)

```
enum ContractState {
  INTENT_DECLARED = 0,              // Initial state - parties express intent
  PRE_CONTRACT_REVIEW = 1,           // Legal review & conditions verification
  CONTRACT_ACTIVE_LOCKED = 2,        // Contract locked, cannot be modified
  OPERATION_RUNNING = 3,             // Active execution phase
  EVALUATION_AND_CALCULATION = 4,    // Performance evaluation & calculations
  RIGHTS_FINALIZED_AND_DISTRIBUTION = 5,  // Rights determined, distribution prepared
  CONTRACT_CLOSED_AND_ARCHIVED = 6,  // Contract concluded & archived
  EXCEPTION_AND_FORCE_MAJEURE = 9    // Emergency/exception state
}
```

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTRACT LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  INTENT_DECLARED │ ◄─────────────────────────────────┐
    │   (State 0)      │                                   │
    └────────┬─────────┘                                   │
             │ Condition: Both parties sign intent         │ Exception/
             │ Guard: DocumentsUploaded ✓                  │ Revocation
             │ Rights: View-only, no commitment            │
             │ Obligations: Submit documents               │
             │ Deadline: 7 days                            │
             ▼                                             │
    ┌──────────────────────────────┐                      │
    │  PRE_CONTRACT_REVIEW         │                      │
    │  (State 1)                   │                      │
    │  Legal Review Phase          │                      │
    └────────┬─────────────────────┘                      │
             │ Condition: All docs reviewed & legal OK    │
             │ Guard: LegalApprovalProvided ✓             │
             │ Rights: Propose amendments                 │
             │ Obligations: Review & approve/reject       │
             │ Deadline: 14 days                          │
             │ Consequence: Auto-reject if expired        │
             ▼                                             │
    ┌──────────────────────────────┐                      │
    │  CONTRACT_ACTIVE_LOCKED      │                      │
    │  (State 2) ⛔ IMMUTABLE       │                      │
    │  Lock-in Phase               │                      │
    └────────┬─────────────────────┘                      │
             │ Condition: Mutual signature + cooldown     │
             │ Guard: BothPartiesSigned ✓                 │
             │ Guard: Cooldown 48h passed ✓               │
             │ Rights: View contract terms (read-only)    │
             │ Obligations: Prepare for execution         │
             │ Deadline: 3 days pre-execution setup       │
             │ ⚠️  NO MODIFICATIONS POSSIBLE FROM HERE     │
             ▼                                             │
    ┌──────────────────────────────┐                      │
    │  OPERATION_RUNNING           │                      │
    │  (State 3)                   │                      │
    │  Execution Phase             │                      │
    └────────┬─────────────────────┘                      │
             │ Condition: Execution start signal given    │
             │ Guard: ExecutionStarted ✓                  │
             │ Rights: Submit performance reports         │
             │ Obligations: Execute per terms             │
             │ Deadline: Per contract schedule            │
             │ Milestone tracking enabled                 │
             ▼                                             │
    ┌──────────────────────────────┐                      │
    │  EVALUATION_AND_CALCULATION  │                      │
    │  (State 4)                   │                      │
    │  Assessment Phase            │                      │
    └────────┬─────────────────────┘                      │
             │ Condition: All operations completed        │
             │ Guard: PerformanceEvaluated ✓              │
             │ Rights: Review calculations                │
             │ Obligations: Verify metrics & compute      │
             │ Deadline: 10 days                          │
             │ Automatic computation trigger on deadline  │
             ▼                                             │
    ┌──────────────────────────────┐                      │
    │ RIGHTS_FINALIZED_            │                      │
    │ AND_DISTRIBUTION             │                      │
    │  (State 5)                   │                      │
    │  Distribution Phase          │                      │
    └────────┬─────────────────────┘                      │
             │ Condition: Rights calculated & finalized   │
             │ Guard: DistributionApproved ✓              │
             │ Rights: Execute distribution               │
             │ Obligations: Complete transfers            │
             │ Deadline: 5 days                           │
             │ On-chain settlement triggers               │
             ▼                                             │
    ┌──────────────────────────────┐                      │
    │  CONTRACT_CLOSED_AND_ARCHIVED│                      │
    │  (State 6) ✅ FINAL           │                      │
    │  Archival Phase              │                      │
    └──────────────────────────────┘                      │
             │ No further transitions                     │
             │ Rights: View archive only                  │
             │ Data stored immutably on-chain             │
             │                                            │
    ┌──────────────────────────────┐                      │
    │  EXCEPTION_AND_FORCE_MAJEURE │ ◄──────────────────┘
    │  (State 9) 🚨 EMERGENCY       │ From any state if
    └──────────────────────────────┘ emergency triggered
             │ Condition: Dispute/emergency triggered
             │ Guard: EmergencyPartySignature ✓
             │ Rights: Invoke emergency protocols
             │ Obligations: Dispute resolution
             │ Deadline: 20 days
             │ Can transition to State 6 after resolution
             ▼
         [Resolution/Archive]
```

## State Transition Rules

### Immutability Checkpoint
```
State 0 → 1: REVERSIBLE (with both parties)
State 1 → 2: IRREVERSIBLE AFTER COOLDOWN (48-hour delay mandatory)
State 2 → 3: IRREVERSIBLE (locked, execution begins)
State 3 → 4: AUTOMATIC (on completion signal)
State 4 → 5: AUTOMATIC (on calculation completion)
State 5 → 6: AUTOMATIC (on distribution completion)
State 6:     TERMINAL (no transitions)
State 9:     EMERGENCY ESCAPE (accessible from any state except 6)
```

## Rights & Obligations Matrix

| State | Rights | Obligations | Responsible Party | Waiting For |
|-------|--------|-------------|-------------------|-------------|
| 0 (INTENT) | View draft, propose changes | Submit docs, sign intent | Both parties equally | Other party signature |
| 1 (REVIEW) | Propose amendments, review legal | Legal review, approve terms | Lawyer/Legal team | Legal sign-off |
| 2 (LOCKED) | Read contract (immutable) | Prepare execution | Contractor | Execution start signal |
| 3 (RUNNING) | Submit reports, request payment | Execute per schedule | Contractor | Milestones completion |
| 4 (EVAL) | Review calculations, contest | Compute performance metrics | Evaluator | Verification completion |
| 5 (DISTRIBUTION) | Execute transfers | Complete on-chain settlement | Treasury | Transfer confirmation |
| 6 (ARCHIVED) | Read-only archive access | None | None | None |
| 9 (EMERGENCY) | Invoke protocols, propose resolution | Dispute documentation | Either party | Dispute settlement |

## Detailed State Specifications

### State 0: INTENT_DECLARED
**Purpose:** Initial intent to contract
**Entry Conditions:**
- Parties identified and verified
- Basic contract parameters defined
- Both parties submit signed declaration

**Exit Conditions (to State 1):**
- Both parties sign intent document
- All required documents uploaded
- No competing declarations active

**Automatic Actions:**
- Create audit log entry
- Send notifications to both parties
- Start 7-day deadline timer

**Emergency Exit:**
- Either party can revoke with written notice
- Auto-revoke if 7-day deadline expires

---

### State 1: PRE_CONTRACT_REVIEW
**Purpose:** Legal validation and amendment period
**Entry Conditions:**
- Contract state == INTENT_DECLARED
- Both parties signed intent
- Trigger: `transitionToReview()` called by either party

**Exit Conditions (to State 2):**
- Legal team approved document
- Both parties acknowledged final terms
- 14-day review period active

**Automatic Actions:**
- Lock document from further amendments (after 48h into state)
- Generate legal summary report
- Send review status notifications

**Emergency Exit:**
- Reject if legal issues found → back to State 0
- Either party can withdraw → back to State 0

---

### State 2: CONTRACT_ACTIVE_LOCKED
**Purpose:** Immutable lock-in with mandatory cooldown
**Entry Conditions:**
- State == PRE_CONTRACT_REVIEW
- Legal approval obtained
- Both parties explicitly acknowledged terms
- Trigger: `lockContract()` called by either party

**Exit Conditions (to State 3):**
- Cooldown timer (48 hours) has passed ✅
- Execution start signal given
- Both parties confirmed readiness

**Automatic Actions:**
- Start 48-hour cooldown timer (mandatory, cannot be skipped)
- Disable all modifications to contract
- Submit to blockchain for immutable recording
- Send "cooling down" notifications with countdown

**CRITICAL GUARDRAILS:**
- ⛔ NO contract modifications allowed in this state
- ⛔ NO state transitions until cooldown expires
- ⛔ Timer cannot be reset or cancelled
- ✅ Parties can view contract in read-only mode
- ✅ Parties can prepare execution setup

**Emergency Exit:**
- Force majeure invocation possible but rare
- Would require unanimous consent + legal documentation

---

### State 3: OPERATION_RUNNING
**Purpose:** Active contract execution
**Entry Conditions:**
- State == CONTRACT_ACTIVE_LOCKED
- Cooldown expired (48h+ passed)
- Execution start signal received
- Trigger: `startExecution()` called by Owner

**Exit Conditions (to State 4):**
- All milestones completed OR
- Auto-trigger on final milestone date reached

**Automatic Actions:**
- Enable milestone tracking
- Enable progress report submission
- Generate periodic status reports
- Monitor deadline compliance

**Key Behaviors:**
- Contractor submits progress reports at milestones
- Supervisor verifies completion
- Witness provides technical approval
- Automatic payment triggers on verification

**Emergency Exit:**
- If emergency triggered, pause operations
- Dispute resolution activates

---

### State 4: EVALUATION_AND_CALCULATION
**Purpose:** Performance assessment and rights calculation
**Entry Conditions:**
- State == OPERATION_RUNNING
- All operation milestones completed
- Trigger: `submitForEvaluation()` called by system OR Owner

**Exit Conditions (to State 5):**
- Evaluation metrics calculated
- Both parties acknowledge results
- Calculations verified by third party (if required)

**Automatic Actions:**
- Lock progress reports (read-only)
- Trigger automatic calculations at deadline
- Generate performance report
- Calculate payment distribution

**Timeline:**
- 10-day evaluation window
- Auto-calculate on day 10 if not completed manually
- Results immutable after calculation

---

### State 5: RIGHTS_FINALIZED_AND_DISTRIBUTION
**Purpose:** Finalize rights, prepare on-chain distribution
**Entry Conditions:**
- State == EVALUATION_AND_CALCULATION
- Calculations finalized
- Trigger: `finalizeRights()` called by system

**Exit Conditions (to State 6):**
- All on-chain transfers completed
- Blockchain confirms settlement
- All parties acknowledge distribution

**Automatic Actions:**
- Prepare on-chain settlement transaction
- Lock rights from modification
- Generate distribution statement
- Initiate payment transfers

**On-Chain Integration:**
- Smart contract executes distribution
- Immutable record created on blockchain
- Confirmation returned to backend

---

### State 6: CONTRACT_CLOSED_AND_ARCHIVED
**Purpose:** Permanent archival and final record
**Entry Conditions:**
- State == RIGHTS_FINALIZED_AND_DISTRIBUTION
- All distributions completed
- Trigger: `closeContract()` called by system

**Behaviors:**
- ✅ Read-only archive access for all parties
- ✅ Immutable record on blockchain
- ✅ Historical audit log available
- ⛔ No modifications possible
- ⛔ No state transitions

**Data Retention:**
- 7-year legal hold minimum
- Stored on-chain indefinitely
- Off-chain backup archival

---

### State 9: EXCEPTION_AND_FORCE_MAJEURE
**Purpose:** Emergency/dispute handling
**Entry Conditions:**
- Can be triggered from any state except 6 (archived)
- Requires emergency party signature
- Trigger: `invokeEmergency()` called by either party

**Emergency Scenarios:**
1. **Dispute Resolution:** Parties disagree on terms/performance
2. **Force Majeure:** Unforeseen circumstances prevent execution
3. **Breach:** One party fails to meet obligations
4. **Regulatory:** Legal/regulatory changes make contract impossible

**Automatic Actions:**
- Freeze all operations
- Lock all transitions (except to State 6)
- Activate dispute resolution protocol
- Send emergency notifications

**Resolution Process:**
- 20-day dispute resolution window
- Can resolve to: State 6 (archive), or back to operational state

## Acknowledgment & Cooldown Requirements

### Pre-Lock Checklist (Before State 2 Lock)
```
Parties must explicitly acknowledge:
☐ Contract terms read and understood
☐ All conditions and obligations reviewed
☐ Financial implications confirmed
☐ Rights distribution method understood
☐ Emergency protocols understood
☐ Irreversibility understood (post-lock)
```

### Cooldown Timer (State 2 → 3 Transition)
```
Duration: 48 hours (mandatory, non-skippable)
Display: Real-time countdown in UI
Notifications: Every 6 hours during cooldown
Purpose: Allow parties to withdraw before execution
```

### State 3 Execution Conditions
```
Before operation start, system must verify:
✓ All pre-requisites met
✓ Both parties confirmed readiness
✓ Milestone schedule locked
✓ Payment schedule confirmed
✓ Participant roles assigned
```

## Transitions Checklist

### Transition: State 0 → 1 (INTENT → REVIEW)
```
Guard Conditions:
✓ Both parties signed intent
✓ All documents uploaded (checklist 100%)
✓ No competing declarations
✓ Intent valid < 7 days old

Pre-Transition Checks:
□ Document hash verified
□ Signatures cryptographically valid
□ Legal team assigned

Post-Transition Actions:
→ Lock intent from modifications
→ Notify legal team
→ Start 14-day review timer
→ Generate legal review checklist
```

### Transition: State 1 → 2 (REVIEW → LOCKED)
```
Guard Conditions:
✓ Legal approval completed
✓ Both parties acknowledged final terms
✓ No outstanding amendments
✓ Review period active (0-14 days)

Pre-Transition Checks:
□ Legal sign-off verified
□ Amendment history logged
□ Blockchain submission prepared

Post-Transition Actions:
→ Start 48-hour mandatory cooldown
→ Submit to blockchain
→ Lock all modifications
→ Disable amendment requests
→ Send cooldown notifications
```

### Transition: State 2 → 3 (LOCKED → RUNNING)
```
Guard Conditions:
✓ Cooldown timer expired (48h+ passed)
✓ Execution start signal received
✓ Both parties confirmed readiness

Pre-Transition Checks:
□ Cooldown verified on-chain
□ Milestone schedule validated
□ Payment conditions configured

Post-Transition Actions:
→ Activate operation tracking
→ Enable progress reports
→ Start milestone timers
→ Enable payment triggers
```

### Transition: State 3 → 4 (RUNNING → EVALUATION)
```
Guard Conditions:
✓ All milestones completed OR deadline reached
✓ Final progress report submitted
✓ No outstanding disputes

Pre-Transition Checks:
□ Milestone completion verified
□ Supervisor sign-off obtained
□ Performance metrics ready

Post-Transition Actions:
→ Lock progress reports
→ Trigger calculations
→ Start 10-day evaluation window
→ Disable modification requests
```

### Transition: State 4 → 5 (EVALUATION → DISTRIBUTION)
```
Guard Conditions:
✓ Calculations completed
✓ Both parties acknowledged results
✓ No disputed calculations
✓ Evaluation period closed

Pre-Transition Checks:
□ Calculation audit trail verified
□ Distribution amounts calculated
□ On-chain settlement prepared

Post-Transition Actions:
→ Lock rights calculations
→ Prepare on-chain transfer
→ Generate distribution statement
→ Initiate payment transfers
```

### Transition: State 5 → 6 (DISTRIBUTION → ARCHIVED)
```
Guard Conditions:
✓ All on-chain transfers completed
✓ Blockchain confirms settlement
✓ All parties acknowledged distribution

Pre-Transition Checks:
□ On-chain transaction confirmed
□ Settlement hash recorded
□ Archive readiness verified

Post-Transition Actions:
→ Finalize archive package
→ Lock from all modifications
→ Generate final audit report
→ Store immutably on-chain
```

## Event Emission Standard

Every state transition must emit:
```
ContractStateChanged {
  contractId: bytes32,
  previousState: ContractState,
  newState: ContractState,
  timestamp: uint256,
  initiatedBy: address,
  transitionHash: bytes32,
  conditions: bytes,  // serialized condition flags
}
```

## Auditing & Logging

All state transitions logged with:
- Timestamp (blockchain time)
- Initiating party
- All guard conditions checked
- All automatic actions taken
- Resulting contract state
- Hash of state data

All logs are immutable on-chain.
