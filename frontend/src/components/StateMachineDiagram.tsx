import React from 'react';

/**
 * State Machine ASCII Diagram Component
 * Displays the complete contract state lifecycle with transitions
 */
export const StateMachineDiagram: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg overflow-x-auto">
      <pre className="text-xs font-mono text-gray-800 whitespace-pre">
{`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    AMANTRA CONTRACT STATE MACHINE - COMPLETE LIFECYCLE        ║
╚══════════════════════════════════════════════════════════════════════════════╝

                            CONTRACT LIFECYCLE DIAGRAM
                            ══════════════════════════════

                        ┌─────────────────────────────┐
                        │   STATE 0: INTENT_DECLARED   │
                        │    (Initial State)          │
                        │  Contract created & awaiting │
                        │  signatures + documents     │
                        └─────────────┬───────────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │        GUARD CHECKS FOR STATE 0→1:       │
                ├─────────────────────────────────────────┤
                │ ✓ Both parties must sign                │
                │ ✓ All documents uploaded                │
                │ ✓ Documents < 7 days old                │
                └─────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │ STATE 1: PRE_CONTRACT_REVIEW │
                        │  Legal Review Phase         │
                        │ Awaiting legal verification │
                        │ and approvals               │
                        └─────────────┬───────────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │        GUARD CHECKS FOR STATE 1→2:       │
                ├─────────────────────────────────────────┤
                │ ✓ Legal approval obtained               │
                │ ✓ Both parties mutually approve         │
                │ ✓ Both parties acknowledge terms        │
                │ ⏰ 48-HOUR MANDATORY COOLDOWN STARTS    │
                └─────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │ STATE 2: CONTRACT_ACTIVE_LOCKED ║
                        │  ⏰ MANDATORY COOLDOWN      │
                        │  Contract IMMUTABLE        │
                        │  48-hour wait period       │
                        └─────────────┬───────────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │      GUARD CHECKS FOR STATE 2→3:         │
                ├─────────────────────────────────────────┤
                │ ✓ COOLDOWN MUST EXPIRE (48h minimum)   │
                │ ✓ No modifications allowed after lock   │
                │ ⚠️ CRITICAL: Cannot skip cooldown!      │
                │ ⚠️ If attempted early: BLOCKED          │
                └─────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │  STATE 3: OPERATION_RUNNING │
                        │   Execution Phase           │
                        │ Work in progress            │
                        │ Progress reporting          │
                        └─────────────┬───────────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │        GUARD CHECKS FOR STATE 3→4:       │
                ├─────────────────────────────────────────┤
                │ ✓ All milestones complete               │
                │ ✓ Progress reports submitted            │
                │ ✓ Supervisor approval obtained          │
                │ ✓ Witness technical approval obtained   │
                └─────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │EVALUATION_AND_CALCULATION  │
                        │  Evaluation Phase           │
                        │ Performance assessment      │
                        │ Rights calculation          │
                        └─────────────┬───────────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │        GUARD CHECKS FOR STATE 4→5:       │
                ├─────────────────────────────────────────┤
                │ ✓ Evaluation window active (<10 days)   │
                │ ✓ Evaluation passed                     │
                │ ✓ Rights verified                       │
                │ ✓ Distribution ready                    │
                └─────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │RIGHTS_FINALIZED_            │
                        │AND_DISTRIBUTION             │
                        │  Distribution Phase         │
                        │ Payments & distributions    │
                        └─────────────┬───────────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │        GUARD CHECKS FOR STATE 5→6:       │
                ├─────────────────────────────────────────┤
                │ ✓ No prerequisites (final step)         │
                │ ✓ Either party can initiate             │
                │ ✓ After this: READ-ONLY MODE            │
                └─────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │ STATE 6: CONTRACT_CLOSED_   │
                        │ AND_ARCHIVED                │
                        │  ✅ TERMINAL STATE          │
                        │  Read-only access only      │
                        │  No further transitions     │
                        └─────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                          EMERGENCY/DISPUTE STATE                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

                              ANY STATE (except 6)
                                      │
                    ┌───────────────────┴───────────────────┐
                    │   INVOKE EMERGENCY TRANSITION       │
                    │   (Manual or automatic dispute)      │
                    │   Provide dispute reason             │
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
                      ┌─────────────────────────────┐
                      │ STATE 9: EXCEPTION_AND_     │
                      │ FORCE_MAJEURE               │
                      │  🚨 EMERGENCY MODE          │
                      │  Dispute Resolution         │
                      │  20-day window for resolution
                      └─────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │  After 20-day dispute window:       │
                    │  - Resolved: Return to prior state  │
                    │  - Unresolved: Archive (State 6)    │
                    └───────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                    STATE TRANSITION SUMMARY TABLE                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

  FROM STATE │ TO STATE │ NAME                  │ REVERSIBLE │ CRITICAL GUARD
  ───────────┼──────────┼──────────────────────┼────────────┼─────────────────────────────
  0          │ 1        │ to-review            │ No         │ Both signed + docs <7d
  1          │ 2        │ lock                 │ No         │ Legal approval + START 48h
  2          │ 3        │ start-execution      │ No         │ COOLDOWN EXPIRED (48h min)
  3          │ 4        │ submit-for-evaluation│ No         │ Milestones complete
  4          │ 5        │ finalize-rights      │ No         │ Eval window <10d active
  5          │ 6        │ close                │ No         │ TERMINAL (no reverse)
  Any (≠6)   │ 9        │ emergency            │ No         │ Authorized user + reason
  9          │ Previous │ resolve              │ Yes*       │ 20-day dispute window


╔══════════════════════════════════════════════════════════════════════════════╗
║                    MANDATORY TIMELINE REQUIREMENTS                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

  ┌─ DOCUMENT AGE REQUIREMENT ─────────────────────────────────────────────┐
  │ Location: STATE 0 → STATE 1                                           │
  │ Requirement: ALL documents must be less than 7 days old               │
  │ Purpose: Ensure recent, valid contract documentation                 │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─ MANDATORY COOLDOWN PERIOD ────────────────────────────────────────────┐
  │ Location: STATE 1 → STATE 2 (starts) → STATE 2 → STATE 3 (verified) │
  │ Duration: EXACTLY 48 HOURS (172,800,000 milliseconds)               │
  │ Enforcement: Non-skippable, enforced by both backend and smart contract
  │ Purpose: Mandatory legal review period before execution             │
  │ Guard: Cannot transition to STATE 3 if cooldown active              │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─ EVALUATION WINDOW REQUIREMENT ────────────────────────────────────────┐
  │ Location: STATE 4 → STATE 5                                          │
  │ Duration: Maximum 10 days from evaluation start                      │
  │ Purpose: Complete evaluation before rights finalization              │
  │ Guard: Cannot finalize if evaluation window expired                  │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─ DISPUTE RESOLUTION WINDOW ────────────────────────────────────────────┐
  │ Location: STATE 9 (Emergency Mode)                                   │
  │ Duration: Maximum 20 days to resolve dispute                         │
  │ Purpose: Allow parties to resolve contract disputes                  │
  │ Outcome: After 20d → archive (STATE 6) or return to prior state      │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─ FRONTEND COOLDOWN POLLING ────────────────────────────────────────────┐
  │ Location: STATE 2 (while cooldown active)                            │
  │ Frequency: Every 5 seconds                                           │
  │ Purpose: Real-time cooldown countdown display                        │
  │ Accuracy Target: ±500ms drift tolerance                              │
  └─────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                        IMMUTABILITY GUARANTEES                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

  ✅ IMMUTABLE AFTER STATE 2 (CONTRACT_ACTIVE_LOCKED)
     • No contract modifications allowed
     • No term changes permitted
     • No date adjustments allowed
     • Read-only access to contract

  ✅ IMMUTABLE AUDIT TRAIL
     • Every transition logged to ContractStateLog
     • Transitions hashed (SHA256) for tamper detection
     • Cannot delete or modify transition history
     • Compliant with legal/regulatory requirements

  ✅ NON-REVERSIBLE TRANSITIONS (except Emergency)
     • State 0 → 1: Cannot reverse to State 0
     • State 1 → 2: Cannot reverse to State 1
     • State 2 → 3: Cannot reverse to State 2
     • State 5 → 6: TERMINAL - NO REVERSAL POSSIBLE

  ✅ STATE 6 IS TERMINAL
     • No transitions allowed from State 6
     • Cannot reopen archived contracts
     • Read-only access in perpetuity
     • Historical records preserved


╔══════════════════════════════════════════════════════════════════════════════╗
║                   ROLE-BASED PERMISSIONS AT EACH STATE                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

  STATE 0 (INTENT_DECLARED)
    OWNER      → Create contract, upload documents, sign
    CONTRACTOR → Review terms, sign, upload documents
    SUPERVISOR → View only, read documentation
    WITNESS    → View only, read documentation

  STATE 1 (PRE_CONTRACT_REVIEW)
    OWNER      → Cannot modify, await legal review
    CONTRACTOR → Cannot modify, await legal review
    SUPERVISOR → Legal verification authority
    WITNESS    → Technical verification support

  STATE 2 (CONTRACT_ACTIVE_LOCKED) ← IMMUTABLE POINT
    OWNER      → View execution timeline only
    CONTRACTOR → Cannot modify, must execute per terms
    SUPERVISOR → Monitor progress, approve/reject milestones
    WITNESS    → Monitor progress, provide technical approval

  STATE 3 (OPERATION_RUNNING)
    OWNER      → Monitor progress
    CONTRACTOR → Submit progress reports and documentation
    SUPERVISOR → Verify progress completion
    WITNESS    → Technical verification of work quality

  STATE 4 (EVALUATION_AND_CALCULATION)
    OWNER      → View evaluation results
    CONTRACTOR → Provide any additional documentation
    SUPERVISOR → Contribute to performance evaluation
    WITNESS    → Provide technical evaluation

  STATE 5 (RIGHTS_FINALIZED_AND_DISTRIBUTION)
    OWNER      → Initiate payment distributions
    CONTRACTOR → Receive payment notifications
    SUPERVISOR → Monitor payment processing
    WITNESS    → Verify final compliance

  STATE 6 (CONTRACT_CLOSED_AND_ARCHIVED) ← READ-ONLY
    OWNER      → Read-only access to complete contract
    CONTRACTOR → Read-only access to complete contract
    SUPERVISOR → Read-only access, compliance review
    WITNESS    → Read-only access to verification records

  STATE 9 (EXCEPTION_AND_FORCE_MAJEURE)
    OWNER      → Submit dispute evidence
    CONTRACTOR → Submit dispute evidence
    SUPERVISOR → Mediation authority
    WITNESS    → Technical dispute resolution


╔══════════════════════════════════════════════════════════════════════════════╗
║                    KEY METRICS & PERFORMANCE TARGETS                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

  ⏱️  STATE TRANSITION LATENCY
      Target: < 200 ms
      Measurement: From API request to DB commit
      Alert: If > 500 ms

  🛡️ GUARD CHECK PASS RATE
      Target: > 99.9%
      Measurement: Successful transitions / Total attempts
      Alert: If < 99%

  ⏰ COOLDOWN TIMER ACCURACY
      Target: ± 500 ms drift
      Measurement: (Expected expiry - Actual expiry) / Duration
      Alert: If ± 1 second or greater

  📝 AUDIT LOG WRITE LATENCY
      Target: < 500 ms
      Measurement: Time from transition to audit log entry
      Alert: If > 1000 ms

  ❌ ERROR RATE
      Target: < 0.1%
      Measurement: Failed transitions / Total attempts
      Alert: If > 1%


═══════════════════════════════════════════════════════════════════════════════

                          LEGEND & SYMBOLS REFERENCE

  ┌─ Boxes represent states with metadata
  │ Numbers (0-6, 9) are state enum values
  ▼ Arrows indicate allowed transitions
  ✓ Required guard conditions for transition
  ✅ Terminal/completion milestone
  🚨 Emergency/exception mode
  ⏰ Time-based requirement
  ⚠️ Critical constraint or warning

═══════════════════════════════════════════════════════════════════════════════
`}
      </pre>
    </div>
  );
};

export default StateMachineDiagram;
