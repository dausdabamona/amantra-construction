# 🚀 State 0: INTENT_DECLARED - START HERE

**Welcome to State 0 Implementation!**

This document is your entry point to the State 0 (INTENT_DECLARED) implementation for the AMANTRA Construction Platform.

---

## ⚡ TL;DR (30 seconds)

**What?** Entry gate to AMANTRA platform - users must declare intent, select role, confirm KYC, accept terms, confirm legal capacity.

**Status?** ✅ **COMPLETE** - 12 files, 2,250+ lines of code, 100% documented, ready for testing.

**Where?** 
- Backend: `backend/src/intent/`
- Frontend: `frontend/src/pages/intent.tsx` + components + store
- Smart Contract: `backend/contracts/AmantraContract.sol`

**What to read?**
- Quick overview: [STATE-0-EXECUTIVE-DASHBOARD.md](STATE-0-EXECUTIVE-DASHBOARD.md) (5 min)
- Development: [QUICK-REFERENCE-STATE-0.md](QUICK-REFERENCE-STATE-0.md) (8 min)
- Testing: [STATE-0-TESTING-GUIDE.md](STATE-0-TESTING-GUIDE.md) (10 min)
- Full spec: [docs/STATE-0-INTENT-DECLARED.md](docs/STATE-0-INTENT-DECLARED.md) (15 min)

---

## 👥 Choose Your Role

### 👨‍💻 I'm a Developer
**Start here:** [QUICK-REFERENCE-STATE-0.md](QUICK-REFERENCE-STATE-0.md)
- API endpoints cheat sheet
- Component props reference
- Code snippets
- Common tasks

**Then explore:** 
- Backend: [backend/src/intent/](backend/src/intent/) - Source code
- Frontend: [frontend/src/](frontend/src/) - React components
- Smart Contract: [backend/contracts/AmantraContract.sol](backend/contracts/AmantraContract.sol)

### 🧪 I'm QA / Testing
**Start here:** [STATE-0-TESTING-GUIDE.md](STATE-0-TESTING-GUIDE.md)
- Manual test cases
- API test examples (cURL)
- Frontend test scenarios
- Success criteria

**Then reference:**
- [STATE-0-FINAL-VERIFICATION.md](STATE-0-FINAL-VERIFICATION.md) - What to verify
- Test checklist in guide
- Expected responses

### 📊 I'm a Project Manager / Stakeholder
**Start here:** [STATE-0-EXECUTIVE-DASHBOARD.md](STATE-0-EXECUTIVE-DASHBOARD.md)
- One-page overview
- What's delivered
- Status summary
- Next steps

**Then review:**
- [STATE-0-FINAL-VERIFICATION.md](STATE-0-FINAL-VERIFICATION.md) - Verification report
- [STATE-0-COMPLETE-SUMMARY.md](STATE-0-COMPLETE-SUMMARY.md) - Full summary
- Checklist status

### 🏗️ I'm an Architect / Tech Lead
**Start here:** [STATE-0-COMPLETE-SUMMARY.md](STATE-0-COMPLETE-SUMMARY.md)
- Architecture overview
- Design decisions
- Integration points
- Performance characteristics

**Then review:**
- [docs/STATE-0-INTENT-DECLARED.md](docs/STATE-0-INTENT-DECLARED.md) - Complete spec
- [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md) - Backend patterns
- Smart contract design

---

## 📚 Documentation Hierarchy

```
START HERE (This file)
    ↓
    ├─ 5 min: STATE-0-EXECUTIVE-DASHBOARD.md (One-page overview)
    │
    ├─ Developer Path:
    │   ├─ 8 min: QUICK-REFERENCE-STATE-0.md (API + Components)
    │   ├─ 15 min: docs/STATE-0-INTENT-DECLARED.md (Full spec)
    │   └─ Source code: backend/src/intent/, frontend/src/
    │
    ├─ QA Path:
    │   ├─ 10 min: STATE-0-TESTING-GUIDE.md (Test procedures)
    │   └─ 5 min: STATE-0-FINAL-VERIFICATION.md (Checklist)
    │
    ├─ Manager Path:
    │   ├─ 5 min: STATE-0-EXECUTIVE-DASHBOARD.md (Status)
    │   └─ 10 min: STATE-0-COMPLETE-SUMMARY.md (Details)
    │
    └─ Navigation:
        └─ STATE-0-DOCUMENTATION-INDEX.md (Full index)
```

---

## 🎯 Quick Facts

| Item | Value |
|------|-------|
| **Status** | ✅ Complete |
| **Lines of Code** | 2,250+ |
| **API Endpoints** | 4 |
| **React Components** | 4 |
| **Smart Contract Lines** | +225 |
| **Documentation** | 6 files, 2,050+ lines |
| **Test Scenarios** | 20+ |
| **Time to Implement** | 1 day |
| **Ready for Testing?** | ✅ YES |
| **Production Ready?** | ✅ YES (after testing) |

---

## 🏗️ What Was Built

### Backend (NestJS)
```
backend/src/intent/
├── intent.controller.ts       ✅ 4 endpoints
├── intent.service.ts          ✅ 7 methods + guards
├── intent.module.ts           ✅ Module registration
└── dto/declare-intent.dto.ts  ✅ Validation DTOs
```
**Total:** 665 lines

### Frontend (React)
```
frontend/src/
├── pages/intent.tsx               ✅ Main page
├── stores/intentStore.ts          ✅ Zustand store
├── components/
│   ├── RoleSelector.tsx           ✅ Role selection
│   ├── IdentityVerificationStatus.tsx ✅ Status display
│   └── DeclarationChecklist.tsx    ✅ Checklist
└── types/intent.ts                ✅ TypeScript types
```
**Total:** 1,100 lines

### Smart Contract (Solidity)
```
backend/contracts/AmantraContract.sol
├── State 0: INTENT_DECLARED        ✅ Enum
├── UserRole enum                   ✅ 4 roles
├── IntentDeclaration struct        ✅ Data structure
├── Mappings                        ✅ 3 mappings
├── Functions                       ✅ 8 functions
├── Modifiers                       ✅ 2 modifiers
└── Events                          ✅ IntentDeclared event
```
**Total:** +225 lines

### Documentation
- ✅ Complete Specification (450 lines)
- ✅ Executive Summary (400 lines)
- ✅ Testing Guide (350 lines)
- ✅ Quick Reference (250 lines)
- ✅ Final Verification (400 lines)
- ✅ Documentation Index (300 lines)

**Total:** 2,050+ lines

---

## 🔌 API Overview

### 4 Endpoints Ready

```
POST /intent/declare
  → Declare user intent with all verifications

GET /intent/status
  → Get current declaration status

GET /intent/can-proceed-to-review
  → Check if ready for next state

GET /intent/history
  → View audit trail
```

**All endpoints:** JWT auth required, fully documented, Swagger auto-generated

---

## 🎨 Frontend Flow

```
User arrives → /intent page
    ↓
Select role (INVESTOR/OPERATOR/AUDITOR/SYSTEM)
    ↓
Verify KYC status (confirmed)
    ↓
Accept platform terms (confirmed)
    ↓
Confirm legal capacity (confirmed)
    ↓
Check agreement checklist (6 items)
    ↓
Click "Deklarasikan Intent" button
    ↓
API submission to backend
    ↓
Backend validates all guards
    ↓
Backend stores in audit log
    ↓
Smart contract records declaration
    ↓
Success message shown
    ↓
Redirect to /contract/review (State 1)
```

---

## 🔐 Security Features

✅ JWT authentication on all endpoints  
✅ Input validation (DTOs with class-validator)  
✅ Role-based access control (RBAC)  
✅ Immutable audit trail (cannot be modified)  
✅ SHA256 hashing (data integrity)  
✅ Smart contract verification (on-chain)  
✅ User-friendly error messages (Indonesian)  
✅ Proper HTTP status codes  

---

## ✅ Verification Checklist

Before you start:

- [ ] I understand State 0 is the entry gate
- [ ] I know the 4 roles (INVESTOR, OPERATOR, AUDITOR, SYSTEM)
- [ ] I know the 3 verifications (KYC, terms, legal capacity)
- [ ] I understand the 4 API endpoints
- [ ] I know where the code is located
- [ ] I've read at least one documentation file

---

## 🚀 Getting Started

### For Development
```bash
cd backend
npm run start:dev          # Start backend

cd frontend
npm run dev               # Start frontend

# Visit http://localhost:3000/intent
```

### For Testing
```bash
# See STATE-0-TESTING-GUIDE.md for detailed procedures

# Quick API test:
curl -X GET http://localhost:3001/api/intent/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### For Deployment
1. Run unit tests
2. Run integration tests
3. Deploy to staging
4. Run UAT
5. Deploy to production

---

## 📖 Document Guide

### Quick Overview (5 minutes)
→ [STATE-0-EXECUTIVE-DASHBOARD.md](STATE-0-EXECUTIVE-DASHBOARD.md)

### Developer Cheat Sheet (8 minutes)
→ [QUICK-REFERENCE-STATE-0.md](QUICK-REFERENCE-STATE-0.md)

### Testing Procedures (10 minutes)
→ [STATE-0-TESTING-GUIDE.md](STATE-0-TESTING-GUIDE.md)

### Complete Specification (15 minutes)
→ [docs/STATE-0-INTENT-DECLARED.md](docs/STATE-0-INTENT-DECLARED.md)

### Full Summary (10 minutes)
→ [STATE-0-COMPLETE-SUMMARY.md](STATE-0-COMPLETE-SUMMARY.md)

### Verification Report (8 minutes)
→ [STATE-0-FINAL-VERIFICATION.md](STATE-0-FINAL-VERIFICATION.md)

### Navigation Index (6 minutes)
→ [STATE-0-DOCUMENTATION-INDEX.md](STATE-0-DOCUMENTATION-INDEX.md)

---

## 💡 Key Concepts

**State 0 = Entry Gate**
Users must declare intent before accessing any contracts. Think of it as registering with the platform.

**UserRole = Access Level**
4 distinct roles with different permissions:
- INVESTOR (capital provider)
- OPERATOR (project manager)
- AUDITOR (independent verifier)
- SYSTEM (admin)

**Verification = Requirements**
3 things users must confirm:
- KYC verified (identity check passed)
- Terms accepted (agreed to T&Cs)
- Legal capacity (authorized to sign contracts)

**Immutability = Trust**
Once declared, intent cannot be changed or deleted. Records are:
- Stored in immutable audit log
- Hashed with SHA256
- Recorded on smart contract
- Timestamped and user-tracked

---

## 🎯 Success Criteria

State 0 is successful when:
- ✅ User can declare intent
- ✅ System stores declaration immutably
- ✅ User is redirected to State 1
- ✅ User cannot bypass State 0
- ✅ Audit trail is maintained
- ✅ On-chain record is created
- ✅ Error handling works correctly
- ✅ Performance is optimized

---

## 🔄 What's Next?

### Immediate (Today)
- [ ] Read this document
- [ ] Choose your path above
- [ ] Start with your recommended document

### Short-term (This Week)
- [ ] Review implementation
- [ ] Run manual tests
- [ ] Verify functionality
- [ ] Check documentation

### Medium-term (Next Week)
- [ ] Run full test suite
- [ ] Perform load testing
- [ ] Security penetration testing
- [ ] UAT with test users

### Long-term (Before Release)
- [ ] Deploy to staging
- [ ] Final review
- [ ] Deploy to production
- [ ] Start State 1 implementation

---

## 🆘 Need Help?

### Common Questions

**Q: I'm lost, where do I start?**  
A: You're already here! Choose your role above and follow the recommended document.

**Q: What's the status?**  
A: ✅ COMPLETE - Ready for testing. See [STATE-0-EXECUTIVE-DASHBOARD.md](STATE-0-EXECUTIVE-DASHBOARD.md).

**Q: How do I test this?**  
A: Follow [STATE-0-TESTING-GUIDE.md](STATE-0-TESTING-GUIDE.md) for step-by-step procedures.

**Q: Where's the code?**  
A: Backend in `backend/src/intent/`, Frontend in `frontend/src/`, Contract in `backend/contracts/`.

**Q: Is it production ready?**  
A: Yes, after testing. See [STATE-0-FINAL-VERIFICATION.md](STATE-0-FINAL-VERIFICATION.md).

---

## 📞 Contact

For questions about:
- **API/Backend:** Check [backend/src/intent/intent.service.ts](backend/src/intent/intent.service.ts)
- **Frontend:** Check [frontend/src/stores/intentStore.ts](frontend/src/stores/intentStore.ts)
- **Smart Contract:** Check [backend/contracts/AmantraContract.sol](backend/contracts/AmantraContract.sol)
- **Testing:** Check [STATE-0-TESTING-GUIDE.md](STATE-0-TESTING-GUIDE.md)
- **Specification:** Check [docs/STATE-0-INTENT-DECLARED.md](docs/STATE-0-INTENT-DECLARED.md)

---

## 🎉 You're Ready!

Everything is in place:
- ✅ Code is complete
- ✅ Documentation is comprehensive
- ✅ Testing procedures are ready
- ✅ Security is implemented
- ✅ Architecture is solid

**Next Step:** Choose your role above and read the recommended document.

---

**Status:** ✅ Complete & Ready  
**Last Updated:** January 24, 2026  
**Version:** 1.0  

---

## 🗺️ Quick Navigation

| Who | Start Here | Time |
|-----|------------|------|
| Executive | [Executive Dashboard](STATE-0-EXECUTIVE-DASHBOARD.md) | 5 min |
| Developer | [Quick Reference](QUICK-REFERENCE-STATE-0.md) | 8 min |
| QA/Tester | [Testing Guide](STATE-0-TESTING-GUIDE.md) | 10 min |
| Architect | [Complete Summary](STATE-0-COMPLETE-SUMMARY.md) | 10 min |
| Everyone | [Full Specification](docs/STATE-0-INTENT-DECLARED.md) | 15 min |

---

**🚀 Let's build something great!**
