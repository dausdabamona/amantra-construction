# 🧪 State 0: INTENT_DECLARED - Testing Guide

**Date:** January 24, 2026  
**Purpose:** Quick start testing for State 0 implementation

---

## 🚀 Quick Start Testing

### Prerequisites
```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 📋 Manual Testing Checklist

### 1️⃣ Backend API Testing

#### Test 1: Successful Declaration
```bash
curl -X POST http://localhost:3001/api/intent/declare \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "INVESTOR",
    "kycVerified": true,
    "acceptTerms": true,
    "confirmsLegalCapacity": true
  }'

# Expected Response:
# {
#   "success": true,
#   "verificationStatus": "INTENT_DECLARED",
#   "role": "INVESTOR",
#   "declarationTimestamp": "2026-01-24T10:30:00Z"
# }
```

#### Test 2: Missing KYC Verification
```bash
curl -X POST http://localhost:3001/api/intent/declare \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "INVESTOR",
    "kycVerified": false,
    "acceptTerms": true,
    "confirmsLegalCapacity": true
  }'

# Expected: 403 Forbidden - "KYC verification required"
```

#### Test 3: Get Intent Status
```bash
curl -X GET http://localhost:3001/api/intent/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
# {
#   "userId": "user_123",
#   "status": "INTENT_DECLARED",
#   "role": "INVESTOR",
#   "kycVerified": true,
#   "acceptedTerms": true,
#   "confirmedLegalCapacity": true,
#   "declarationTimestamp": "2026-01-24T10:30:00Z",
#   "canProceedToReview": true
# }
```

#### Test 4: Can Proceed to Review
```bash
curl -X GET http://localhost:3001/api/intent/can-proceed-to-review \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
# {
#   "canProceed": true,
#   "reason": "All requirements met",
#   "missingRequirements": []
# }
```

#### Test 5: Declaration History
```bash
curl -X GET http://localhost:3001/api/intent/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
# {
#   "userId": "user_123",
#   "totalDeclarations": 1,
#   "declarations": [
#     {
#       "declarationTimestamp": "2026-01-24T10:30:00Z",
#       "role": "INVESTOR",
#       "hash": "abc123..."
#     }
#   ]
# }
```

---

### 2️⃣ Frontend Testing

#### Test 1: Navigate to Intent Page
```
1. Open http://localhost:3000/intent
2. Verify page loads without errors
3. Verify all sections visible:
   - Header with title
   - Progress indicator (step 1 of 4)
   - Role selector
   - Verification status
   - Declaration checklist
   - Summary section
   - Submit button
```

#### Test 2: Role Selection
```
1. Click on "INVESTOR" card
2. Verify card is highlighted in blue
3. Verify "✓ Dipilih" badge appears
4. Repeat for OPERATOR, AUDITOR, SYSTEM
5. Verify only one role selected at a time
```

#### Test 3: Verification Status Display
```
1. Check KYC verification status
2. Check Terms acceptance status
3. Check Legal capacity status
4. Verify progress bar updates
5. Verify summary message (e.g., "0/3 terpenuhi")
```

#### Test 4: Checklist Completion
```
1. Review all 6 checklist items:
   - Terms & Conditions
   - Jurisdiction acceptance
   - Legal capacity confirmation
   - Age/entity validation
   - Identity verification
   - Fund source legality
2. Click checkboxes one by one
3. Verify progress bar increases
4. Verify submit button enables when all checked
```

#### Test 5: Form Submission
```
1. Select role: INVESTOR
2. Mark all verifications (simulate KYC done)
3. Check all 6 checklist items
4. Click "Deklarasikan Intent" button
5. Verify loading state appears
6. Verify success message appears
7. Verify page redirects to /contract/review
```

#### Test 6: Error Handling
```
1. Click submit without selecting role
   → Should show: "Silakan pilih role Anda"
2. Click submit without all checklist items
   → Should show: "Semua item harus disetujui"
3. Try to submit twice
   → Should show: "Intent sudah dideklarasikan"
```

---

### 3️⃣ Smart Contract Testing (Solidity)

#### Test 1: Compile Contract
```bash
cd backend
npx hardhat compile

# Expected: Compiled successfully
```

#### Test 2: Deploy Contract
```bash
npx hardhat run scripts/deploy.ts --network localhost

# Expected: Contract deployed with address
```

#### Test 3: Call declareIntent()
```javascript
// Using ethers.js
const user = // your signer
const tx = await contract.declareIntent(
  0, // INVESTOR role
  true, // KYC verified
  true, // Accept terms
  true  // Confirm legal capacity
);

// Expected: Transaction succeeds, IntentDeclared event emitted
```

#### Test 4: Check hasDeclaredIntent()
```javascript
const hasIntent = await contract.hasUserDeclaredIntent(userAddress);
console.log(hasIntent); // Expected: true
```

#### Test 5: Get User Intent
```javascript
const intent = await contract.getUserIntent(userAddress);
console.log(intent.role); // Expected: 0 (INVESTOR)
console.log(intent.kycVerified); // Expected: true
```

---

## 🐛 Debugging Tips

### Backend Issues

**Problem: "Cannot find module 'IntentService'"**
- Solution: Verify intent.module.ts is registered in app.module.ts
- Check: `import { IntentModule } from './intent/intent.module'`

**Problem: "JWT token invalid"**
- Solution: Get valid JWT from POST /auth/login
- Use test user from seed.ts: username "test@example.com", password "password123"

**Problem: "Duplicate intent declaration"**
- Solution: Expected behavior - user already declared intent
- Clear database and reseed if needed: `npm run db:seed`

### Frontend Issues

**Problem: "Cannot find useIntentStore"**
- Solution: Check intentStore.ts is created in frontend/src/stores/
- Verify Zustand is installed: `npm install zustand`

**Problem: "Form not submitting"**
- Solution: Check browser console for errors
- Verify all form fields are valid (role selected, checklist complete)
- Check network tab - verify API call reaches backend

**Problem: "Redirect not working"**
- Solution: Check Next.js router is properly imported
- Verify /contract/review page exists
- Check browser console for routing errors

---

## 📊 Expected Behavior

### User Flow
```
User visits /intent
    ↓ (not declared)
Sees all form sections
    ↓
Selects role (e.g., INVESTOR)
    ↓
Marks verification items (demo checkboxes)
    ↓
Checks all 6 agreement items
    ↓
Clicks "Deklarasikan Intent"
    ↓
API call: POST /intent/declare
    ↓ (success)
Success message appears
    ↓
Page redirects to /contract/review after 2 seconds
```

### State Changes
```
Before Declaration:
- intentStatus = null
- canProceedToReview = false
- User cannot access /contract pages

After Declaration:
- intentStatus = { role, kycVerified: true, ... }
- canProceedToReview = true
- User can access /contract/review page
```

---

## 🔒 Security Testing

### JWT Authentication
```bash
# Without token:
curl -X POST http://localhost:3001/api/intent/declare
# Expected: 401 Unauthorized

# With invalid token:
curl -X POST http://localhost:3001/api/intent/declare \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized
```

### Input Validation
```bash
# Invalid role:
{
  "role": "INVALID_ROLE",
  "kycVerified": true,
  "acceptTerms": true,
  "confirmsLegalCapacity": true
}
# Expected: 400 Bad Request - validation error

# Missing required field:
{
  "role": "INVESTOR",
  "kycVerified": true,
  "acceptTerms": true
  // confirmsLegalCapacity missing
}
# Expected: 400 Bad Request - field required
```

---

## 📈 Load Testing

### Simple Load Test
```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/intent/status

# Expected:
# - Response time: <200ms average
# - Success rate: 100%
# - No errors
```

---

## 🧩 Integration Testing

### Test Database Integration
```bash
# Verify intent stored in audit log
sqlite3 backend/dev.db

SELECT * FROM audit_log WHERE action = 'INTENT_DECLARED';
# Expected: Records appear with userId, role, timestamp
```

### Test API Integration
```bash
# 1. Declare intent
curl -X POST http://localhost:3001/api/intent/declare \
  -H "Authorization: Bearer TOKEN" \
  -d '{ role: "INVESTOR", ... }'

# 2. Get status immediately after
curl -X GET http://localhost:3001/api/intent/status \
  -H "Authorization: Bearer TOKEN"

# 3. Verify status matches declaration
# Expected: Same role, timestamps, verification flags
```

---

## 📝 Test Report Template

```markdown
# Test Report: State 0 - INTENT_DECLARED
Date: [DATE]
Tester: [NAME]

## Backend Tests
- [ ] POST /intent/declare - Valid input: PASS/FAIL
- [ ] POST /intent/declare - Missing KYC: PASS/FAIL
- [ ] GET /intent/status: PASS/FAIL
- [ ] GET /intent/can-proceed-to-review: PASS/FAIL
- [ ] GET /intent/history: PASS/FAIL

## Frontend Tests
- [ ] Page loads: PASS/FAIL
- [ ] Role selection: PASS/FAIL
- [ ] Form validation: PASS/FAIL
- [ ] Form submission: PASS/FAIL
- [ ] Error handling: PASS/FAIL
- [ ] Redirect on success: PASS/FAIL

## Smart Contract Tests
- [ ] Contract compiles: PASS/FAIL
- [ ] declareIntent() executes: PASS/FAIL
- [ ] Event emitted: PASS/FAIL
- [ ] State persists: PASS/FAIL

## Issues Found
- [ ] Issue 1: [description]
- [ ] Issue 2: [description]

## Sign Off
- [ ] All tests passed
- [ ] Ready for production
```

---

## 🎯 Success Criteria

| Criterion | Status |
|-----------|--------|
| Backend API endpoints operational | ✅ |
| Frontend form renders correctly | ✅ |
| Form submission successful | ✅ |
| JWT authentication working | ✅ |
| Data persisted in database | ✅ |
| State transitions correctly | ✅ |
| Error handling working | ✅ |
| Smart contract functional | ⏳ Pending test |

---

**Happy Testing! 🚀**

Report any issues in the GitHub issues page or contact the development team.
