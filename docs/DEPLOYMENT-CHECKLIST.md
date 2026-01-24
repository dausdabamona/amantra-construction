# Contract State Machine - Deployment Checklist

**Date:** January 24, 2025  
**Target Release:** Sprint Q1 2025  
**Deployment Environment:** Development → Staging → Production

---

## 📦 Pre-Deployment Validation

### ✅ Code Quality Checks

- [ ] All TypeScript files compile without errors
  ```bash
  # Backend
  cd backend && npm run build
  
  # Frontend
  cd frontend && npm run build
  ```

- [ ] No console errors in browser (F12 DevTools)

- [ ] Backend tests pass (if applicable)
  ```bash
  npm run test
  npm run test:e2e
  ```

- [ ] Smart contract compiles (if deploying to blockchain)
  ```bash
  npx hardhat compile
  npx hardhat test
  ```

- [ ] Linting passes
  ```bash
  npm run lint
  ```

### ✅ Security Checks

- [ ] No hardcoded secrets in code
- [ ] Contract addresses stored in environment variables only
- [ ] JWT tokens verified on all protected endpoints
- [ ] Rate limiting configured for state transitions
- [ ] CORS policy properly configured
- [ ] SQL injection prevention validated (Prisma)
- [ ] Audit trail immutable and tamper-evident

### ✅ Data Integrity Checks

- [ ] Enum values synchronized across all layers:
  - [ ] Solidity contract
  - [ ] NestJS backend
  - [ ] React frontend

- [ ] Database schema includes all required tables:
  - [ ] ContractStateLog
  - [ ] ContractLockTimeout
  - [ ] ContractAcknowledgment
  - [ ] ContractGuardCheck
  - [ ] ContractRights
  - [ ] ContractObligation

- [ ] Prisma schema updated with new relations

- [ ] Migration file created and tested

---

## 🚀 Deployment Steps

### Phase 1: Development Environment

**1. Run Database Migration**
```bash
cd backend
npx prisma migrate dev --name contract_state_tables
npx prisma generate
```

**2. Start Backend Services**
```bash
# In one terminal
npm run start:dev

# In another terminal - seed with test data
npm run db:seed
```

**3. Start Frontend**
```bash
cd frontend
npm run dev
```

**4. Verify State Machine Endpoints**
```bash
# Test state retrieval
curl http://localhost:3001/contract-state/{contractId}/state

# Test state transitions
curl -X POST http://localhost:3001/contract-state/{contractId}/transition/to-review
```

**5. Test Complete Flow**
- [ ] Create contract (State 0)
- [ ] Upload documents and sign (State 0 → 1)
- [ ] Lock contract - verify cooldown starts (State 1 → 2)
- [ ] Wait/skip cooldown - verify timer
- [ ] Execute contract (State 2 → 3)
- [ ] Submit for evaluation (State 3 → 4)
- [ ] Finalize rights (State 4 → 5)
- [ ] Archive contract (State 5 → 6)

---

### Phase 2: Staging Environment

**1. Deploy to Staging**
```bash
# Backend
git push origin feature/contract-state-machine
# Deploy via CI/CD pipeline to staging

# Frontend
# Deploy via Vercel/Netlify to staging environment
```

**2. Run Staging Migrations**
```bash
# On staging database server
npx prisma migrate deploy
```

**3. Configure Environment Variables**
```bash
# backend/.env.staging
DATABASE_URL=postgresql://...staging...
JWT_SECRET=staging_secret_key
ENVIRONMENT=staging

# frontend/.env.staging
NEXT_PUBLIC_API_URL=https://api-staging.amantra.dev
NEXT_PUBLIC_ENVIRONMENT=staging
```

**4. Run Smoke Tests**
```bash
npm run test:smoke:contract-state
```

**5. Load Testing (Optional)**
```bash
# Simulate 100 concurrent users transitioning states
npm run test:load
```

---

### Phase 3: Production Deployment

**1. Create Release Branch**
```bash
git checkout -b release/contract-state-v1.0
git tag -a v1.0-contract-state -m "Contract state machine v1.0"
git push --tags
```

**2. Production Database Migration**
```bash
# Run on production database - WITH BACKUP FIRST
pg_dump production_db > production_backup_$(date +%s).sql
npx prisma migrate deploy --environment production
```

**3. Deploy Backend**
```bash
# Deploy to production cluster
# Ensure zero-downtime deployment using:
# - Blue-green deployment
# - Database migration completed before code deployment
# - API versioning if needed
```

**4. Deploy Frontend**
```bash
# Deploy to production CDN
# Verify static assets cached correctly
```

**5. Health Checks**
```bash
curl https://api.amantra.dev/health
curl https://app.amantra.dev/health
```

**6. Monitor State Machine**
```bash
# Watch logs for any state transition errors
tail -f logs/contract-state.log | grep -i error

# Monitor database for audit trail
SELECT COUNT(*) FROM "ContractStateLog" WHERE "timestamp" > NOW() - INTERVAL '1 hour';
```

---

## 🔄 Rollback Plan

**If deployment fails:**

### Backend Rollback
```bash
# Rollback database migration (if schema issues)
npx prisma migrate resolve --rolled-back 20250124_contract_state_tables

# Revert to previous backend version
git revert HEAD
npm run build
npm run start:prod
```

### Frontend Rollback
```bash
# Vercel: Go to Deployments tab and promote previous version
# Or manually:
git revert HEAD
npm run build
npm run deploy
```

### Database Rollback
```bash
# Restore from backup if data corruption
psql production_db < production_backup_TIMESTAMP.sql
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

**Backend Performance:**
- [ ] State transition API response time (target: <200ms)
- [ ] Database query performance for state checks
- [ ] Cooldown timer accuracy (should be within ±500ms)
- [ ] Audit log write latency

**Frontend Performance:**
- [ ] Component render time (<500ms)
- [ ] State polling frequency (every 5 seconds)
- [ ] Zustand store update latency
- [ ] UI responsiveness during transitions

**Error Rates:**
- [ ] State transition failures (target: <0.1%)
- [ ] Guard condition check failures
- [ ] Cooldown verification errors
- [ ] Database constraint violations

### Alert Thresholds

```yaml
alerts:
  state_transition_error_rate:
    threshold: 1%
    action: page_oncall
  
  cooldown_timer_drift:
    threshold: 1000ms  # More than 1 second drift
    action: log_warning
  
  audit_log_write_latency:
    threshold: 500ms
    action: investigate
  
  guard_check_failures:
    threshold: 5_per_minute
    action: alert_security
```

---

## 📋 Post-Deployment Verification

### Day 1 After Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Verify no state transition failures
- [ ] Check cooldown timer accuracy ±500ms
- [ ] Audit trail populated correctly
- [ ] No database constraint violations
- [ ] User feedback: no complaints about state machine
- [ ] Performance metrics within expected ranges

### Week 1 After Deployment

- [ ] Generate state transition analytics
- [ ] Verify all states are being used as expected
- [ ] Check cooldown enforcement is working
- [ ] Review audit logs for compliance
- [ ] Security audit of guard conditions
- [ ] Performance optimization opportunities identified

### Month 1 After Deployment

- [ ] Generate monthly state machine report
- [ ] Review failed transitions for patterns
- [ ] Analyze cooldown duration adequacy
- [ ] Update documentation based on real usage
- [ ] Plan any optimization releases

---

## 🔐 Security Post-Deployment

### Verification Steps

- [ ] All state transitions are audited and immutable
- [ ] Cooldown timer cannot be bypassed
- [ ] Guard conditions enforced on backend (not just frontend)
- [ ] JWT tokens validated on all protected endpoints
- [ ] Database constraints prevent invalid state combinations
- [ ] Acknowledgment signatures verified
- [ ] No state transition race conditions possible
- [ ] Emergency state accessible only to authorized users

### Compliance Checks

- [ ] GDPR: User data in acknowledgments properly handled
- [ ] Audit trail meets compliance requirements
- [ ] Data retention policies followed
- [ ] Immutability guarantees maintained
- [ ] Legal hold capabilities implemented

---

## 📞 Escalation Procedure

**If Issues Occur During Deployment:**

1. **Critical Issue (Production Down)**
   - [ ] Immediate rollback to previous version
   - [ ] Notify all stakeholders
   - [ ] Post-mortem within 24 hours

2. **Major Issue (State Transitions Failing)**
   - [ ] Switch to read-only mode for state machine
   - [ ] Investigate guard conditions
   - [ ] Fix and re-deploy

3. **Minor Issue (Metrics Slightly Off)**
   - [ ] Continue monitoring
   - [ ] Create issue for optimization
   - [ ] Schedule for next release

---

## 📝 Sign-Off

**Deployment Lead:** ___________________  
**Date:** ___________________

**QA Sign-Off:** ___________________  
**Date:** ___________________

**Security Review:** ___________________  
**Date:** ___________________

**Operations Approval:** ___________________  
**Date:** ___________________

---

## 📚 Related Documents

- [CONTRACT-STATE-MACHINE.md](CONTRACT-STATE-MACHINE.md) - Full specification
- [CONTRACT-STATE-MACHINE-INTEGRATION.md](CONTRACT-STATE-MACHINE-INTEGRATION.md) - Integration guide
- [ARCHITECTURE.md](../backend/ARCHITECTURE.md) - Backend architecture
- [MVP-ARCHITECTURE.md](MVP-ARCHITECTURE.md) - Platform architecture

---

**Generated:** January 24, 2025  
**Last Updated:** January 24, 2025  
**Maintenance:** Review quarterly
