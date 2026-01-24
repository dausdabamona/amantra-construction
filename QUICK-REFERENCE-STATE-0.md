# 📖 State 0: INTENT_DECLARED - Developer Quick Reference

**Last Updated:** January 24, 2026  
**For:** Frontend & Backend Developers

---

## 🎯 What is State 0?

State 0 (INTENT_DECLARED) is the **entry gate** to the AMANTRA platform. Before users can create or manage contracts, they must:

1. ✅ Select their role (INVESTOR/OPERATOR/AUDITOR/SYSTEM)
2. ✅ Confirm KYC verification
3. ✅ Accept platform terms
4. ✅ Confirm legal capacity

**Once declared, the user can access all other contract states.**

---

## 📚 File Locations

### Backend
```
backend/src/intent/
├── intent.controller.ts       # REST endpoints
├── intent.service.ts          # Business logic
├── intent.module.ts           # Module definition
└── dto/
    └── declare-intent.dto.ts  # Validation schemas
```

### Frontend
```
frontend/src/
├── pages/intent.tsx           # Main page
├── stores/intentStore.ts      # Zustand state
├── components/
│   ├── RoleSelector.tsx
│   ├── IdentityVerificationStatus.tsx
│   └── DeclarationChecklist.tsx
└── types/intent.ts            # TypeScript types
```

---

## 🔌 API Quick Reference

### POST /intent/declare
```typescript
// Request
{
  role: "INVESTOR" | "OPERATOR" | "AUDITOR" | "SYSTEM",
  kycVerified: true,
  acceptTerms: true,
  confirmsLegalCapacity: true
}

// Response (200 OK)
{
  success: true,
  verificationStatus: "INTENT_DECLARED",
  role: "INVESTOR",
  declarationTimestamp: "2026-01-24T10:30:00Z",
  message: "Intent berhasil dideklarasikan..."
}

// Error (403 Forbidden)
{
  statusCode: 403,
  message: "KYC verification required",
  error: "Forbidden"
}
```

### GET /intent/status
```typescript
// Response (200 OK)
{
  userId: "user_123",
  status: "INTENT_DECLARED",
  role: "INVESTOR",
  kycVerified: true,
  acceptedTerms: true,
  confirmedLegalCapacity: true,
  declarationTimestamp: "2026-01-24T10:30:00Z",
  canProceedToReview: true,
  message: "..."
}
```

### GET /intent/can-proceed-to-review
```typescript
// Response (200 OK)
{
  canProceed: true,
  reason: "All requirements met",
  missingRequirements: [],
  status: "INTENT_DECLARED"
}

// Or if missing requirements:
{
  canProceed: false,
  reason: "KYC not verified",
  missingRequirements: ["kycVerified"],
  status: "NOT_DECLARED"
}
```

### GET /intent/history
```typescript
// Response (200 OK)
{
  userId: "user_123",
  totalDeclarations: 1,
  declarations: [
    {
      declarationTimestamp: "2026-01-24T10:30:00Z",
      role: "INVESTOR",
      hash: "abc123def456..."
    }
  ],
  message: "..."
}
```

---

## 🎨 Frontend Components

### RoleSelector
```typescript
import RoleSelector from '@/components/RoleSelector';

<RoleSelector
  selectedRole={role}
  onRoleSelect={(role) => setRole(role)}
  disabled={isLoading}
/>

// Props
interface Props {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
  disabled?: boolean;
}
```

### IdentityVerificationStatus
```typescript
import IdentityVerificationStatus from '@/components/IdentityVerificationStatus';

<IdentityVerificationStatus
  kycVerified={verified}
  acceptedTerms={terms}
  confirmedLegalCapacity={capacity}
  isLoading={false}
/>

// Props
interface Props {
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  isLoading?: boolean;
}
```

### DeclarationChecklist
```typescript
import DeclarationChecklist from '@/components/DeclarationChecklist';

<DeclarationChecklist
  onChecklistChange={(completed) => setCompleted(completed)}
  isLoading={false}
/>

// Props
interface Props {
  onChecklistChange: (completed: boolean) => void;
  isLoading?: boolean;
}
```

---

## 🏪 State Management (Zustand)

### Using the Intent Store
```typescript
import { useIntentStore } from '@/stores/intentStore';

// In your component
const store = useIntentStore();

// Access state
const { selectedRole, intentStatus, isLoading, error } = store;

// Update state
store.setSelectedRole(UserRole.INVESTOR);
store.setKycVerified(true);
store.setAcceptedTerms(true);
store.setConfirmedLegalCapacity(true);
store.setChecklistCompleted(true);

// API actions
await store.declareIntent(
  userId,
  role,
  kycVerified,
  acceptTerms,
  confirmLegalCapacity
);

const status = await store.getIntentStatus(userId);
const canProceed = await store.canProceedToReview(userId);

// Utilities
const isComplete = store.isIntentComplete();
store.resetForm();
store.clearError();
```

---

## 🔐 Smart Contract Quick Reference

### UserRole Enum
```solidity
enum UserRole {
  INVESTOR,    // 0 - Capital provider
  OPERATOR,    // 1 - Project manager
  AUDITOR,     // 2 - Independent verifier
  SYSTEM       // 3 - Admin
}
```

### IntentDeclaration Struct
```solidity
struct IntentDeclaration {
  address user;
  UserRole role;
  bool kycVerified;
  bool acceptedTerms;
  bool confirmedLegalCapacity;
  uint256 declarationTimestamp;
  bytes32 declarationHash;
}
```

### Key Functions
```solidity
// Declare intent
function declareIntent(
  UserRole _role,
  bool _kycVerified,
  bool _acceptedTerms,
  bool _confirmedLegalCapacity
) external validRole(_role)

// Get intent details
function getUserIntent(address _user)
external view returns (IntentDeclaration memory)

// Check if user declared intent
function hasUserDeclaredIntent(address _user)
external view returns (bool)

// Verify integrity
function verifyIntentHash(
  address _user,
  UserRole _role,
  uint256 _timestamp,
  bytes32 _hash
) external pure returns (bool)

// Admin queries
function getDeclaredUserCount() external view returns (uint256)
function getDeclaredUserAt(uint256 index) external view returns (address)
```

### Key Modifiers
```solidity
// Require intent declaration
modifier onlyIntentDeclared() {
  require(hasDeclaredIntent[msg.sender], "Must declare intent");
  _;
}

// Validate role
modifier validRole(UserRole _role) {
  require(uint8(_role) <= 3, "Invalid role");
  _;
}
```

---

## 📝 Common Tasks

### Add Intent Declaration to New Endpoint
```typescript
@Post('create-contract')
@UseGuards(JwtAuthGuard)
async createContract(@Req() req: any) {
  const userId = req.user.id;
  
  // ✅ Guard: Check intent declared
  const hasIntent = await this.intentService.hasUserDeclaredIntent(userId);
  if (!hasIntent) {
    throw new ForbiddenException('Must declare intent first');
  }
  
  // Continue with contract creation
}
```

### Protect Frontend Routes
```typescript
// In pages/contract/create.tsx
import { useIntentStore } from '@/stores/intentStore';
import { useRouter } from 'next/router';

export default function CreateContract() {
  const router = useRouter();
  const store = useIntentStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if intent declared
    store.getIntentStatus(userId).then(status => {
      if (!status?.canProceedToReview) {
        router.push('/intent'); // Redirect to intent page
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return <div>Contract Creation Page</div>;
}
```

### Get User's Declared Intent
```typescript
// Backend
async getUserIntentDetails(userId: string) {
  const status = await this.intentService.getIntentStatus(userId);
  if (!status) {
    throw new NotFoundException('Intent not found');
  }
  return status;
}

// Frontend
const intentDetails = await api.get(`/intent/status`);
console.log(intentDetails.role); // "INVESTOR"
```

---

## 🚨 Error Handling

### Backend Error Messages (Indonesian)
```typescript
// Missing fields
"Field tidak boleh kosong"

// KYC not verified
"KYC verification required sebelum dapat melanjutkan"

// Terms not accepted
"Anda harus menerima syarat dan ketentuan platform untuk melanjutkan"

// Capacity not confirmed
"Anda harus mengkonfirmasi kapasitas hukum untuk melanjutkan"

// Duplicate declaration
"Anda sudah mendeklarasikan intent. Silakan lanjutkan ke tahap review."

// Invalid role
"Role harus salah satu dari: INVESTOR, OPERATOR, AUDITOR, atau SYSTEM"

// Not authenticated
"Unauthorized: No JWT token provided"
```

### Frontend Error Handling
```typescript
try {
  await store.declareIntent(userId, role, true, true, true);
  // Success
} catch (error) {
  if (error.response?.status === 403) {
    // Show verification required message
    toast.error(error.response.data.message);
  } else if (error.response?.status === 400) {
    // Show validation error
    toast.error('Form tidak valid');
  }
}
```

---

## 🧪 Quick Testing Commands

### Test API with curl
```bash
# Declare intent
curl -X POST http://localhost:3001/api/intent/declare \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "INVESTOR",
    "kycVerified": true,
    "acceptTerms": true,
    "confirmsLegalCapacity": true
  }'

# Get status
curl -X GET http://localhost:3001/api/intent/status \
  -H "Authorization: Bearer JWT_TOKEN"

# Check can proceed
curl -X GET http://localhost:3001/api/intent/can-proceed-to-review \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Get JWT Token
```bash
# Login first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Extract token from response and use in header
```

---

## 🔗 Related Resources

| Document | Purpose |
|----------|---------|
| [STATE-0-INTENT-DECLARED.md](docs/STATE-0-INTENT-DECLARED.md) | Complete specification |
| [STATE-0-TESTING-GUIDE.md](STATE-0-TESTING-GUIDE.md) | Testing procedures |
| [STATE-0-IMPLEMENTATION-VERIFIED.md](STATE-0-IMPLEMENTATION-VERIFIED.md) | Verification report |
| [API Swagger Docs](http://localhost:3001/docs) | Interactive API docs |

---

## 💡 Key Concepts

**State 0 = Entry Gate**
- Must be passed before any contract access
- Immutable once declared
- Audit trail maintained
- On-chain verification

**UserRole = Access Level**
- Determines permissions in contracts
- 4 distinct roles: INVESTOR, OPERATOR, AUDITOR, SYSTEM
- Selected during intent declaration
- Cannot be changed afterward

**Verification = Requirements**
- KYC must be verified
- Terms must be accepted
- Legal capacity must be confirmed
- All three required before declaration

**Immutability = Trust**
- Declaration stored in audit log (immutable by design)
- SHA256 hash for integrity
- On-chain record for compliance
- Cannot be modified or deleted

---

## ⚡ Performance Tips

1. **Cache intent status** in frontend to reduce API calls
2. **Use Zustand actions** for state management (not useState)
3. **Lazy-load verification status** if it depends on external service
4. **Batch role selections** if changing roles frequently
5. **Store JWT token** in secure cookie, not localStorage

---

## 🤝 Contributing

When adding features to State 0:

1. ✅ Update TypeScript types in [frontend/src/types/intent.ts](frontend/src/types/intent.ts)
2. ✅ Update backend DTOs in [backend/src/intent/dto/declare-intent.dto.ts](backend/src/intent/dto/declare-intent.dto.ts)
3. ✅ Update smart contract in [backend/contracts/AmantraContract.sol](backend/contracts/AmantraContract.sol)
4. ✅ Update documentation in [docs/STATE-0-INTENT-DECLARED.md](docs/STATE-0-INTENT-DECLARED.md)
5. ✅ Add tests and update [STATE-0-TESTING-GUIDE.md](STATE-0-TESTING-GUIDE.md)

---

## 📞 Quick Help

**Q: User can't declare intent?**
A: Check JWT token is valid. Use `/auth/login` first.

**Q: Submit button stays disabled?**
A: Check all checklist items are checked. Verify role is selected.

**Q: Getting "Intent already declared" error?**
A: Expected behavior. User must proceed to next state or clear database.

**Q: Smart contract not compiling?**
A: Run `npm run contracts:compile` in backend folder.

**Q: Frontend store not updating?**
A: Check intentStore.ts actions are called. Verify Zustand is installed.

---

**Need help?** Check the full documentation or contact the development team.

**Last Updated:** January 24, 2026  
**Status:** ✅ Complete & Ready to Use
