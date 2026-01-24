# State 1: PRE_CONTRACT_REVIEW - Quick Reference Guide

**For developers, QA, and stakeholders**  
**Print or bookmark this page**

---

## 🚀 Quick Start

### Running State 1

**Backend:**
```bash
cd backend
npm run start:dev
```
Endpoints live at: `http://localhost:3001/api/contract-review/[id]/*`

**Frontend:**
```bash
cd frontend
npm run dev
```
Navigate to: `http://localhost:3000/contract/[id]/review`

**Smart Contract (testnet):**
```bash
cd backend/contracts
npm run deploy:test
```

---

## 📊 State 1 at a Glance

| Property | Value |
|----------|-------|
| **State Name** | PRE_CONTRACT_REVIEW |
| **Entry** | From State 0 (INTENT_DECLARED) |
| **Exit** | To State 2 (CONTRACT_ACTIVE_LOCKED) |
| **UI Steps** | 7 (non-skippable wizard) |
| **Cooldown** | 48 hours mandatory |
| **Financial Value** | IDR 10B demo (range: 3B-10B) |
| **Review Components** | 9 (5 view + 2 panel + 1 warning) |
| **Acknowledgements** | 7 flags (all required) |
| **Exit Guards** | All flags TRUE + cooldown expired + lock confirmed |

---

## 🔗 Key URLs & Endpoints

### Frontend Routes
```
/contract/[id]/review              → Main review page
/contract/[id]/active-locked       → After lock (redirects here)
```

### Backend API Endpoints

**GET (Retrieve Data):**
```
GET /api/contract-review/:id/summary              → ContractSummaryDto
GET /api/contract-review/:id/timeline             → ProcessTimelineDto[]
GET /api/contract-review/:id/risks                → RiskItemDto[]
GET /api/contract-review/:id/simulation           → SimulationScenarioDto[]
GET /api/contract-review/:id/legal-text           → LegalTextSectionDto[]
GET /api/contract-review/:id/checklist            → AcknowledgementChecklistDto[]
GET /api/contract-review/:id/status               → ContractReviewStatusDto
```

**POST (Perform Action):**
```
POST /api/contract-review/:id/acknowledge
  Body: {ackSummary, ackTimeline, ackRisks, ackSimulation, ackLegalText, ackChecklist}
  → Starts 48h cooldown

POST /api/contract-review/:id/approve-and-lock
  Body: {confirmProceedToLock: true}
  → Transitions to CONTRACT_ACTIVE_LOCKED
```

---

## 🎯 The 7-Step Wizard

| Step | Name | Ack Flag | Time | What User Does |
|------|------|----------|------|----------------|
| 1 | Summary | ackSummary | 5-10m | Read contract overview, check checkbox |
| 2 | Timeline | ackTimeline | 5m | Review 6-step timeline, check checkbox |
| 3 | Risks | ackRisks | 10-15m | Review 5 risks (up to 2.3B exposure), check checkbox |
| 4 | Simulation | ackSimulation | 10m | Select & review 4 scenarios, check checkbox |
| 5 | Legal | ackLegalText | 20-30m | Read 6 legal sections, check checkbox |
| 6 | Checklist | ackChecklist | 5m | Check all 7 items individually |
| 7 | Cooldown | ackCooldown | 48h+ | Wait & then click "Kunci Dana" |

**Total:** ~1.5-2 hours reading + 48 hours waiting

---

## 📋 Acknowledgement Flags (7 Required)

All MUST be true to proceed. No partial acceptance allowed.

```
✓ ackSummary      - Step 1: User checked "read summary" checkbox
✓ ackTimeline     - Step 2: User checked "reviewed timeline" checkbox
✓ ackRisks        - Step 3: User checked "understand risks" checkbox
✓ ackSimulation   - Step 4: User checked "reviewed scenarios" checkbox
✓ ackLegalText    - Step 5: User checked "read legal text" checkbox
✓ ackChecklist    - Step 6: ALL 7 checklist items individually checked
✓ ackCooldown     - Step 7: Auto-set true when 48h cooldown expires
```

---

## ⏱️ Cooldown Mechanism

### How It Works
1. User clicks "Next" on Step 6 after all items checked
2. Frontend sends POST `/acknowledge` with 7 ack flags
3. Backend records: `cooldownEndTime = now + 48 hours`
4. Smart contract emits: `PreContractReviewAcknowledged` event
5. Frontend shows countdown: 48:00:00 → 47:59:59 → ... → 00:00:00
6. After 48 hours expire: "Kunci Dana" button enabled
7. User clicks button → Confirmation modal → Lock confirmed
8. State transitions to: CONTRACT_ACTIVE_LOCKED

### Timestamps
```
Acknowledgement time (UTC):        2024-01-15T10:00:00Z
Cooldown end (UTC):               2024-01-17T10:00:00Z (+48h)
Can proceed to lock after:        2024-01-17T10:00:01Z onwards
```

### Guard Conditions (Must ALL be true)
```
✓ All 7 ack flags = true
✓ Current time > cooldownEndTime
✓ confirmProceedToLock = true (user confirmation)
```

---

## 📁 File Structure

### Backend
```
backend/src/contract-review/
├── contract-review.module.ts      ← Module definition
├── contract-review.controller.ts  ← 8 REST endpoints
├── contract-review.service.ts     ← 8 methods + business logic
└── dto/
    └── contract-review.dto.ts     ← 11 DTO classes
```

### Smart Contract
```
backend/contracts/
└── AmantraContract.sol
    ├── struct ContractReviewAcknowledgement
    ├── mapping reviewAcknowledgements
    ├── event PreContractReviewAcknowledged
    ├── event PreContractApproved
    └── function acknowledgePreContractReview()
    └── function approvePreContractAndLock()
    └── [4 more view functions]
```

### Frontend
```
frontend/src/
├── pages/contract/[id]/review.tsx         ← Main page (7-step wizard)
├── types/contract-review.ts               ← 16 TypeScript interfaces
├── hooks/useContractReviewStore.ts        ← Zustand store
└── components/contract-review/
    ├── SummaryView.tsx                    ← Step 1
    ├── ProcessTimelineView.tsx            ← Step 2
    ├── RiskAndConsequenceView.tsx         ← Step 3
    ├── SimulationView.tsx                 ← Step 4
    ├── LegalContractTextView.tsx          ← Step 5
    ├── AcknowledgementChecklistView.tsx   ← Step 6
    ├── CooldownTimer.tsx                  ← Step 7
    ├── ContractParametersPanel.tsx        ← Persistent right panel
    └── NoStateAdvanceWarning.tsx          ← Persistent top banner
```

---

## 🧪 Quick Testing

### Test Happy Path (5 min)
```
1. Navigate to /contract/test-id/review
2. Step 1: Read, check "Summary" checkbox, click Next
3. Step 2: Read, check "Timeline" checkbox, click Next
4. Step 3: Read, check "Risks" checkbox, click Next
5. Step 4: Read, check "Simulation" checkbox, click Next
6. Step 5: Read, check "Legal" checkbox, click Next
7. Step 6: Check all 7 items individually, click Next
8. Step 7: Wait for "Cooldown complete" message
9. Click "Kunci Dana & Aktifkan Kontrak"
10. Confirm in modal → Redirects to /contract/test-id/active-locked ✓
```

### Test State Guard (2 min)
```
1. Try to access /contract-review/invalid-id/summary (not in State 0)
   → Should return 403 "Intent not declared"
2. Try to POST /acknowledge without State 0
   → Should return 403 "Intent verification failed"
```

### Test Cooldown (24+ hours or mock time)
```
1. Send POST /acknowledge with all flags
2. Check response: cooldownEndTime should be now + 48h
3. Try POST /approve-and-lock immediately
   → Should fail: "Cooldown not expired"
4. Wait 48 hours (or mock block.timestamp in tests)
5. Try again → Should succeed
```

### Test Early Unlock Prevention
```
// Frontend
- "Kunci Dana" button disabled until cooldown expires
- Clicking during cooldown doesn't enable request

// Backend
- POST /approve-and-lock fails if now < cooldownEndTime

// Smart Contract
- require(block.timestamp > cooldownEndTime) reverts if too early
```

---

## 🐛 Debugging Tips

### Check Zustand Store (Browser Console)
```javascript
// View entire store
useContractReviewStore.getState()

// Check specific flags
const { ackSummary, ackTimeline, cooldownRemaining } = useContractReviewStore.getState()

// View localStorage
JSON.parse(localStorage.getItem('contract-review-store'))
```

### Check Backend Logs
```bash
# Watch NestJS dev server logs
npm run start:dev

# Look for:
# - "ContractReviewService: ..." debug logs
# - "POST /api/contract-review/:id/acknowledge" request logs
# - "Cooldown started:" cooldown calculation logs
```

### Check Smart Contract Events (Remix)
```solidity
// View events in transaction receipt
logs: [
  {
    topics: [PreContractReviewAcknowledged event signature],
    data: [contractId, acknowledgedBy, timestamp, hash]
  }
]
```

### Check API Responses
```bash
# Test endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/contract-review/test-id/status

# Should return:
{
  "success": true,
  "message": "Status retrieved",
  "data": {
    "ackSummary": true,
    "ackTimeline": true,
    // ... all ack flags
    "cooldownEndTime": 1705425600000,
    "canProceedToLock": false
  }
}
```

---

## 🚨 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Intent not declared" (403) | State 0 not completed | Complete State 0 first |
| "Next" button disabled | Current step not acked | Check checkbox on current step |
| "Kunci Dana" button disabled during cooldown | 48h not elapsed | Wait or mock time in tests |
| Cooldown not updating | Interval stopped | Check browser console for JS errors |
| Modal doesn't appear on Step 7 | canProceedToLock false | Ensure cooldown is actually expired |
| Redirect to active-locked fails | Backend error | Check API response for error message |

---

## 📊 Data Models (Reference)

### ContractReviewStatus (Most Important)
```typescript
{
  contractId: string
  userId: string
  ackSummary: boolean
  ackTimeline: boolean
  ackRisks: boolean
  ackSimulation: boolean
  ackLegalText: boolean
  ackChecklist: boolean
  ackCooldown: boolean
  
  acknowledgedAt: Date
  cooldownEndTime: number  // Unix timestamp ms
  cooldownRemaining: number // Computed ms until expiry
  canProceedToLock: boolean
  
  history: [
    { action: "ACKNOWLEDGED", timestamp: Date },
    { action: "COOLDOWN_STARTED", timestamp: Date },
    // ... more actions
  ]
}
```

### Risks (5 in demo)
```typescript
{
  riskId: string
  description: string  // e.g., "Cuaca buruk"
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  probability: number  // 0-100
  financialImpact: number  // IDR
  mitigation: string
  contingencyPlan: string
}
```

### SimulationScenario (4 total)
```typescript
{
  scenarioId: "best_case" | "realistic" | "worst_case" | "crisis"
  outcomeDescription: string
  budgetVariance: number  // IDR (positive = cost increase)
  probability: number  // 0-100
  timelineImpact: string  // e.g., "+10 days"
  riskFactors: string[]
  mitigationStrategy?: string
}
```

---

## ✅ Acceptance Criteria

### Functional AC
- [ ] User can navigate through all 7 steps without skipping
- [ ] Each step requires acknowledgement before proceeding
- [ ] Cooldown timer counts down accurately (±1 second tolerance)
- [ ] Lock button disabled until 48h elapsed
- [ ] Lock button enabled after 48h
- [ ] Confirmation modal appears before lock
- [ ] State transitions to CONTRACT_ACTIVE_LOCKED after lock confirmed
- [ ] Backward navigation allowed to review previous steps

### Non-Functional AC
- [ ] Page load time < 2 seconds (after data fetch)
- [ ] Cooldown update interval < 100ms latency
- [ ] Error messages in Indonesian
- [ ] All endpoints JWT-protected
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (WCAG 2.1 AA)

---

## 📞 Support Contacts

**For Implementation Issues:**
- Check this quick reference first
- Consult [STATE-1-COMPLETE-SUMMARY.md](./STATE-1-COMPLETE-SUMMARY.md) for detailed docs
- Review [MVP-ARCHITECTURE.md](./docs/MVP-ARCHITECTURE.md) for context

**For Code Questions:**
- Backend: See `backend/src/contract-review/`
- Frontend: See `frontend/src/pages/contract/[id]/review.tsx`
- Smart Contract: See `backend/contracts/AmantraContract.sol`

---

**Print Date:** [Auto-generated]  
**Version:** 1.0  
**Status:** Production Ready
