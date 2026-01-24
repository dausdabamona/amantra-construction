# State 0: INTENT_DECLARED - Complete Implementation

**Date:** January 24, 2026  
**Status:** ✅ COMPLETE  
**Purpose:** Declaration of intent and legal capacity before entering contract review

---

## 📋 Overview

State 0 (INTENT_DECLARED) is the initial state in the AMANTRA contract lifecycle. Users must declare their intent, select their role, and confirm legal capacity before proceeding to contract review.

### Key Requirements
- ✅ User declares role (INVESTOR, OPERATOR, AUDITOR, SYSTEM)
- ✅ KYC verification confirmed
- ✅ Platform terms & conditions accepted
- ✅ Legal capacity confirmed
- ✅ Declaration stored on-chain (smart contract)
- ✅ No financial actions allowed at this state
- ✅ Declaration immutable once recorded

---

## 🗂️ File Structure

### Backend (NestJS)

```
backend/src/intent/
├── intent.module.ts              # Module definition
├── intent.controller.ts           # REST API endpoints
├── intent.service.ts              # Business logic
└── dto/
    └── declare-intent.dto.ts      # Request/Response DTOs
```

### Frontend (Next.js)

```
frontend/src/
├── pages/intent.tsx               # Main intent page
├── stores/intentStore.ts          # Zustand state management
├── components/
│   ├── RoleSelector.tsx           # Role selection component
│   ├── IdentityVerificationStatus.tsx  # Verification display
│   └── DeclarationChecklist.tsx    # Agreement checklist
└── types/
    └── intent.ts                  # TypeScript types
```

### Smart Contract (Solidity)

```
backend/contracts/AmantraContract.sol
├── IntentDeclaration struct       # On-chain intent data
├── UserRole enum                  # Role definitions
├── Mappings:
│   ├── hasDeclaredIntent          # Boolean per user
│   └── userIntents                # Full declaration data
├── Events:
│   └── IntentDeclared             # Declaration event
└── Functions:
    ├── declareIntent()            # Record intent
    ├── getUserIntent()            # Query intent
    ├── hasUserDeclaredIntent()    # Check declaration
    └── verifyIntentHash()         # Verify integrity
```

---

## 🔌 API Endpoints

### POST /intent/declare
**Declare user intent**

**Request:**
```json
{
  "role": "INVESTOR",
  "kycVerified": true,
  "acceptTerms": true,
  "confirmsLegalCapacity": true
}
```

**Response:**
```json
{
  "success": true,
  "verificationStatus": "INTENT_DECLARED",
  "role": "INVESTOR",
  "declarationTimestamp": "2026-01-24T10:30:00Z",
  "message": "Intent berhasil dideklarasikan..."
}
```

**Guards:**
- ✅ JWT Authentication required
- ✅ All fields must be true
- ✅ Valid role required
- ✅ No duplicate declarations

---

### GET /intent/status
**Get current intent status**

**Response:**
```json
{
  "userId": "user_123",
  "status": "INTENT_DECLARED",
  "role": "INVESTOR",
  "kycVerified": true,
  "acceptedTerms": true,
  "confirmedLegalCapacity": true,
  "declarationTimestamp": "2026-01-24T10:30:00Z",
  "canProceedToReview": true,
  "message": "Intent Anda telah dideklarasikan dan tersimpan dalam sistem."
}
```

---

### GET /intent/can-proceed-to-review
**Check if user can proceed to next state**

**Response:**
```json
{
  "canProceed": true,
  "reason": "Semua persyaratan terpenuhi. Anda dapat melanjutkan ke tahap review.",
  "missingRequirements": [],
  "status": "INTENT_DECLARED",
  "role": "INVESTOR"
}
```

---

### GET /intent/history
**Get intent declaration history (audit trail)**

**Response:**
```json
{
  "userId": "user_123",
  "totalDeclarations": 1,
  "declarations": [
    {
      "declarationTimestamp": "2026-01-24T10:30:00Z",
      "role": "INVESTOR",
      "hash": "sha256_hash_here..."
    }
  ],
  "message": "Riwayat deklarasi intent ditampilkan di atas."
}
```

---

## 📱 Frontend Components

### RoleSelector
Allows users to select their role from 4 options:
- **INVESTOR** - Capital provider
- **OPERATOR** - Project manager
- **AUDITOR** - Independent verifier
- **SYSTEM** - Admin (special permissions)

**Props:**
```typescript
selectedRole: UserRole | null;
onRoleSelect: (role: UserRole) => void;
disabled?: boolean;
```

---

### IdentityVerificationStatus
Displays verification status for:
- KYC verification
- Terms acceptance
- Legal capacity confirmation

**Props:**
```typescript
kycVerified: boolean;
acceptedTerms: boolean;
confirmedLegalCapacity: boolean;
isLoading?: boolean;
```

---

### DeclarationChecklist
Checklist of 6 required confirmations:
1. Acceptance of Terms & Conditions
2. Acceptance of platform jurisdiction
3. Confirmation of legal capacity
4. Age/entity verification
5. KYC completion
6. Legitimate funds confirmation

**Props:**
```typescript
onChecklistChange: (completed: boolean) => void;
isLoading?: boolean;
```

---

## 🏪 State Management (Zustand)

### useIntentStore
```typescript
interface IntentStore {
  // State
  userId: string | null;
  selectedRole: UserRole | null;
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  intentStatus: IntentStatus | null;
  isLoading: boolean;
  error: string | null;
  checklistCompleted: boolean;

  // Actions
  setSelectedRole(role: UserRole): void;
  setKycVerified(verified: boolean): void;
  setAcceptedTerms(accepted: boolean): void;
  setConfirmedLegalCapacity(confirmed: boolean): void;
  setChecklistCompleted(completed: boolean): void;

  // API Actions
  declareIntent(...): Promise<void>;
  getIntentStatus(userId: string): Promise<void>;
  canProceedToReview(userId: string): Promise<boolean>;

  // Utilities
  resetForm(): void;
  clearError(): void;
  isIntentComplete(): boolean;
}
```

---

## 🔐 Smart Contract Functions

### declareIntent()
```solidity
function declareIntent(
  UserRole _role,
  bool _kycVerified,
  bool _acceptedTerms,
  bool _confirmedLegalCapacity
) external validRole(_role)
```

**Requirements:**
- Intent not previously declared
- KYC verified = true
- Terms accepted = true
- Legal capacity confirmed = true

**Effects:**
- Records IntentDeclaration struct
- Sets hasDeclaredIntent[msg.sender] = true
- Generates and stores declarationHash
- Emits IntentDeclared event

---

### getUserIntent()
```solidity
function getUserIntent(address _user) 
external view returns (IntentDeclaration memory)
```

Returns complete intent declaration for user.

---

### hasUserDeclaredIntent()
```solidity
function hasUserDeclaredIntent(address _user) 
external view returns (bool)
```

Guard function to check if user has declared intent.

---

### verifyIntentHash()
```solidity
function verifyIntentHash(
  address _user,
  UserRole _role,
  uint256 _timestamp,
  bytes32 _hash
) external pure returns (bool)
```

Blockchain-like integrity verification of declaration.

---

## 🔄 State Transition Rules

### From INTENT_DECLARED to PRE_CONTRACT_REVIEW

**Requirements (Guards):**
1. ✅ User has declared intent (onlyIntentDeclared modifier)
2. ✅ KYC verified
3. ✅ Terms accepted
4. ✅ Legal capacity confirmed
5. ✅ Declaration stored on-chain

**Transition Function (Backend):**
```typescript
async transitionToReview(userId: string) {
  const status = await this.intentService.getIntentStatus(userId);
  
  if (!status?.canProceedToReview) {
    throw new ForbiddenException(
      'Requirement not met for transition'
    );
  }
  
  // Record transition in audit log
  await this.audit.log({
    action: 'STATE_TRANSITION_0_TO_1',
    entity: 'Contract',
    entityId: userId,
    details: { fromState: 0, toState: 1 }
  });
  
  return { newState: 1, success: true };
}
```

---

## 🛡️ Guard Modifiers (Smart Contract)

### @onlyIntentDeclared()
```solidity
modifier onlyIntentDeclared() {
  require(
    hasDeclaredIntent[msg.sender],
    "Must declare intent before proceeding"
  );
  _;
}
```

---

### @validRole()
```solidity
modifier validRole(UserRole _role) {
  require(uint8(_role) <= 3, "Invalid role");
  _;
}
```

---

## 📊 Data Structures

### IntentDeclaration (Smart Contract)
```solidity
struct IntentDeclaration {
  address user;                           // User address
  UserRole role;                          // Selected role
  bool kycVerified;                       // KYC status
  bool acceptedTerms;                     // Terms acceptance
  bool confirmedLegalCapacity;            // Capacity confirmation
  uint256 declarationTimestamp;           // Record timestamp
  bytes32 declarationHash;                // SHA256 verification hash
}
```

### IntentStatus (Backend Response)
```typescript
interface IntentStatus {
  userId: string;
  status: string;                         // "INTENT_DECLARED"
  role: UserRole;
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  declarationTimestamp: Date;
  canProceedToReview: boolean;
}
```

---

## 🎯 User Flow

```
1. User accesses /intent page
   ↓
2. User selects role (INVESTOR/OPERATOR/AUDITOR/SYSTEM)
   ↓
3. User verifies KYC status
   ↓
4. User reviews and accepts terms
   ↓
5. User confirms legal capacity
   ↓
6. User reviews declaration checklist
   ↓
7. User clicks "Deklarasikan Intent" button
   ↓
8. System submits POST /intent/declare
   ↓
9. Backend records in audit log
   ↓
10. Smart contract records declaration
   ↓
11. User redirected to /contract/review
   ↓
12. Transition to State 1: PRE_CONTRACT_REVIEW
```

---

## 🔍 Audit Trail

Every intent declaration creates immutable audit log entry:

```json
{
  "action": "INTENT_DECLARED",
  "entity": "Intent",
  "entityId": "user_123",
  "userId": "user_123",
  "timestamp": "2026-01-24T10:30:00Z",
  "details": {
    "role": "INVESTOR",
    "kycVerified": true,
    "acceptedTerms": true,
    "confirmedLegalCapacity": true,
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "declarationHash": "abc123def456..."
  }
}
```

---

## ✅ Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| role | Must be valid enum | "Role harus salah satu dari: INVESTOR, OPERATOR, AUDITOR, atau SYSTEM" |
| kycVerified | Must be true | "KYC verification required sebelum dapat melanjutkan" |
| acceptTerms | Must be true | "Anda harus menerima syarat dan ketentuan platform untuk melanjutkan" |
| confirmsLegalCapacity | Must be true | "Anda harus mengkonfirmasi kapasitas hukum untuk melanjutkan" |
| Duplicate declaration | Not allowed | "Anda sudah mendeklarasikan intent. Silakan lanjutkan ke tahap review." |

---

## 🎓 Testing Scenarios

### Test Case 1: Happy Path
```
Given: User has KYC verified
When: User declares intent with all confirmations
Then: Intent recorded and user can proceed to review
```

### Test Case 2: Missing KYC
```
Given: User has not completed KYC
When: User tries to declare intent
Then: Request rejected with error message
```

### Test Case 3: Duplicate Declaration
```
Given: User has already declared intent
When: User tries to declare intent again
Then: Request rejected with duplicate error
```

### Test Case 4: Invalid Role
```
Given: User provides invalid role
When: User tries to declare intent
Then: DTO validation rejects request
```

---

## 📈 Performance Targets

| Metric | Target |
|--------|--------|
| Declare intent latency | <500 ms |
| Get status latency | <200 ms |
| UI render time | <1 second |
| Smart contract gas | <200k |

---

## 🔗 Integration Points

**After Declaration (State 0):**
- ✅ Prevent access to contract pages if state < 0
- ✅ Allow transition to State 1 (PRE_CONTRACT_REVIEW)
- ✅ Store in audit log for compliance
- ✅ Emit events for monitoring

**Guard Rules:**
- ✅ No financial actions allowed
- ✅ No contract creation allowed
- ✅ No term modifications allowed
- ✅ Read-only access to platform rules

---

## 📚 Related Documentation

- [CONTRACT-STATE-MACHINE.md](CONTRACT-STATE-MACHINE.md) - Full state machine spec
- [State 1: PRE_CONTRACT_REVIEW](STATE-1-PRE-CONTRACT-REVIEW.md) - Next state
- [Smart Contract Guide](SMART-CONTRACT-GUIDE.md) - Solidity details
- [User Flow Documentation](USER-FLOW.md) - Complete user journeys

---

## ✅ Implementation Checklist

Backend:
- [x] Create IntentModule
- [x] Create IntentService with all business logic
- [x] Create IntentController with 4 endpoints
- [x] Create DTOs with validation
- [x] Add to app.module.ts
- [x] Implement audit logging
- [x] Add JWT guards
- [x] Add database query methods

Frontend:
- [x] Create /intent page
- [x] Create RoleSelector component
- [x] Create IdentityVerificationStatus component
- [x] Create DeclarationChecklist component
- [x] Create intentStore (Zustand)
- [x] Add TypeScript types
- [x] Add error handling
- [x] Add loading states

Smart Contract:
- [x] Add IntentDeclaration struct
- [x] Add UserRole enum
- [x] Add hasDeclaredIntent mapping
- [x] Add declareIntent() function
- [x] Add getUserIntent() view function
- [x] Add hasUserDeclaredIntent() guard function
- [x] Add verifyIntentHash() function
- [x] Add IntentDeclared event
- [x] Add @onlyIntentDeclared modifier
- [x] Add @validRole modifier

---

**Status:** ✅ COMPLETE & READY FOR TESTING

Next: Implement State 1 (PRE_CONTRACT_REVIEW)
