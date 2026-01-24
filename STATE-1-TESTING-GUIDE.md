# State 1: PRE_CONTRACT_REVIEW - Testing & QA Guide

**Comprehensive QA testing procedures for State 1 implementation**

---

## 1. Unit Tests

### Backend Service Tests

#### Test: `getContractSummary()`
```typescript
it('should return contract summary with demo data', async () => {
  const result = await service.getContractSummary('test-contract-id');
  
  expect(result).toHaveProperty('contractorName');
  expect(result).toHaveProperty('contractValue', 10000000000);
  expect(result).toHaveProperty('numberOfTerms', 3);
  expect(result).toHaveProperty('duration', 180);
  expect(result).toHaveProperty('keyTerms');
  expect(result.keyTerms).toHaveLength(6);
});
```

#### Test: `getProcessTimeline()`
```typescript
it('should return 6 timeline steps with risk levels', async () => {
  const result = await service.getProcessTimeline('test-contract-id');
  
  expect(result).toHaveLength(6);
  expect(result[0]).toHaveProperty('stepName', 'Kickoff');
  expect(result[0]).toHaveProperty('riskLevel', 'LOW');
  expect(result[2]).toHaveProperty('riskLevel', 'HIGH'); // Phase 1
  
  // Check duration sum
  const totalDays = result.reduce((sum, step) => sum + step.duration, 0);
  expect(totalDays).toBe(153); // 7+14+60+5+60+7
});
```

#### Test: `getRisksAndConsequences()`
```typescript
it('should return 5 risks with financial impact', async () => {
  const result = await service.getRisksAndConsequences('test-contract-id');
  
  expect(result).toHaveLength(5);
  
  // Check specific risks
  const weatherRisk = result.find(r => r.description.includes('Weather'));
  expect(weatherRisk?.severity).toBe('CRITICAL');
  expect(weatherRisk?.probability).toBe(60);
  expect(weatherRisk?.financialImpact).toBe(500000000); // 500M
  
  // Check total exposure
  const totalExposure = result.reduce((sum, r) => sum + r.financialImpact, 0);
  expect(totalExposure).toBeGreaterThan(2000000000); // Over 2B
});
```

#### Test: `acknowledgeContract()` 
```typescript
it('should record acknowledgements and calculate cooldown', async () => {
  const result = await service.acknowledgeContract('test-contract-id', {
    ackSummary: true,
    ackTimeline: true,
    ackRisks: true,
    ackSimulation: true,
    ackLegalText: true,
    ackChecklist: true,
    ackCooldown: true,
  });
  
  expect(result).toHaveProperty('ackSummary', true);
  expect(result).toHaveProperty('cooldownEndTime');
  
  const cooldownMs = result.cooldownEndTime - Date.now();
  const expectedMs = 48 * 60 * 60 * 1000;
  
  expect(cooldownMs).toBeCloseTo(expectedMs, -3); // Within ±1000ms
  expect(result).toHaveProperty('canProceedToLock', false); // Not yet expired
});
```

#### Test: `approvePreContractAndLock()`
```typescript
it('should reject if cooldown not expired', async () => {
  await expect(
    service.approvePreContractAndLock('test-contract-id', true)
  ).rejects.toThrow('Cooldown not expired');
});

it('should succeed after cooldown expires', async () => {
  // Mock time advance (48 hours)
  jest.useFakeTimers();
  jest.advanceTimersByTime(48 * 60 * 60 * 1000 + 1000);
  
  const result = await service.approvePreContractAndLock('test-contract-id', true);
  
  expect(result).toHaveProperty('status', 'CONTRACT_ACTIVE_LOCKED');
  
  jest.useRealTimers();
});
```

#### Test: State 0 Guard
```typescript
it('should block access if intent not declared', async () => {
  // Don't call intent declaration
  
  await expect(
    service.getContractSummary('unknown-contract')
  ).rejects.toThrow('Intent not declared');
});
```

### DTO Validation Tests

#### Test: ContractSummaryDto
```typescript
it('should validate ContractSummaryDto', async () => {
  const dto = new ContractSummaryDto();
  dto.contractorName = '';  // Invalid: empty
  
  const errors = await validate(dto);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toBe('contractorName');
});
```

#### Test: AcknowledgeContractDto
```typescript
it('should reject partial acknowledgements', async () => {
  const dto = new AcknowledgeContractDto();
  dto.ackSummary = true;
  dto.ackTimeline = true;
  // Missing: ackRisks, ackSimulation, ackLegalText, ackChecklist
  
  const errors = await validate(dto);
  expect(errors.length).toBeGreaterThan(0);
});
```

---

## 2. Integration Tests

### API Endpoint Tests

#### Test: GET /api/contract-review/:id/summary
```typescript
describe('GET /contract-review/:id/summary', () => {
  it('should return 200 with contract summary', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/contract-review/test-id/summary')
      .set('Authorization', `Bearer ${jwtToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('contractorName');
  });
  
  it('should return 403 without JWT token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/contract-review/test-id/summary');
    
    expect(response.status).toBe(403);
  });
  
  it('should return 404 for non-existent contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/contract-review/non-existent/summary')
      .set('Authorization', `Bearer ${jwtToken}`);
    
    expect(response.status).toBe(404);
  });
});
```

#### Test: POST /api/contract-review/:id/acknowledge
```typescript
describe('POST /contract-review/:id/acknowledge', () => {
  it('should record acknowledgements with valid flags', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/contract-review/test-id/acknowledge')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        ackSummary: true,
        ackTimeline: true,
        ackRisks: true,
        ackSimulation: true,
        ackLegalText: true,
        ackChecklist: true,
        ackCooldown: false, // Not yet, will auto-expire
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.cooldownEndTime).toBeDefined();
    expect(response.body.data.canProceedToLock).toBe(false);
  });
  
  it('should reject partial acknowledgements', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/contract-review/test-id/acknowledge')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        ackSummary: true,
        ackTimeline: true,
        // Missing other flags
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('All 7 flags required');
  });
});
```

#### Test: POST /api/contract-review/:id/approve-and-lock
```typescript
describe('POST /contract-review/:id/approve-and-lock', () => {
  it('should reject if cooldown not expired', async () => {
    // First acknowledge
    await request(app.getHttpServer())
      .post('/api/contract-review/test-id/acknowledge')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(allAcksTrue);
    
    // Try to lock immediately
    const response = await request(app.getHttpServer())
      .post('/api/contract-review/test-id/approve-and-lock')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ confirmProceedToLock: true });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Cooldown not expired');
  });
  
  it('should succeed after cooldown expires', async () => {
    // Mock time + all setup
    jest.useFakeTimers();
    
    // First acknowledge
    await request(app.getHttpServer())
      .post('/api/contract-review/test-id/acknowledge')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(allAcksTrue);
    
    // Advance 48+ hours
    jest.advanceTimersByTime(48 * 60 * 60 * 1000 + 1000);
    
    // Try to lock
    const response = await request(app.getHttpServer())
      .post('/api/contract-review/test-id/approve-and-lock')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ confirmProceedToLock: true });
    
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CONTRACT_ACTIVE_LOCKED');
    
    jest.useRealTimers();
  });
});
```

---

## 3. Frontend Component Tests

### React Component Tests (Jest + React Testing Library)

#### Test: SummaryView Component
```typescript
describe('SummaryView', () => {
  it('should render summary content', () => {
    const mockSummary = {
      contractorName: 'PT. ABC',
      contractValue: 10000000000,
      // ... other fields
    };
    
    const { getByText } = render(
      <SummaryView
        summary={mockSummary}
        isLoading={false}
        onAcknowledge={jest.fn()}
        isAcknowledged={false}
      />
    );
    
    expect(getByText(/Ringkasan Kontrak/i)).toBeInTheDocument();
    expect(getByText(/10.*B/)).toBeInTheDocument();
  });
  
  it('should call onAcknowledge when checkbox checked', () => {
    const mockFn = jest.fn();
    const { getByRole } = render(
      <SummaryView
        summary={mockSummary}
        isLoading={false}
        onAcknowledge={mockFn}
        isAcknowledged={false}
      />
    );
    
    const checkbox = getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockFn).toHaveBeenCalledWith(true);
  });
});
```

#### Test: CooldownTimer Component
```typescript
describe('CooldownTimer', () => {
  it('should display countdown timer', () => {
    const futureTime = Date.now() + (48 * 60 * 60 * 1000);
    
    const { getByText } = render(
      <CooldownTimer
        cooldownEndTime={futureTime}
        isLoading={false}
      />
    );
    
    expect(getByText(/48:00:00|47:\d{2}:\d{2}/)).toBeInTheDocument();
  });
  
  it('should show "Cooldown complete" when expired', () => {
    const pastTime = Date.now() - 1000;
    
    const { getByText } = render(
      <CooldownTimer
        cooldownEndTime={pastTime}
        isLoading={false}
      />
    );
    
    expect(getByText(/Periode Pendinginan Selesai/i)).toBeInTheDocument();
  });
  
  it('should update countdown every second', async () => {
    jest.useFakeTimers();
    
    const futureTime = Date.now() + (60 * 1000); // 1 minute
    
    const { getByText, rerender } = render(
      <CooldownTimer
        cooldownEndTime={futureTime}
        isLoading={false}
      />
    );
    
    expect(getByText(/00:01:00/)).toBeInTheDocument();
    
    jest.advanceTimersByTime(1000);
    
    rerender(
      <CooldownTimer
        cooldownEndTime={futureTime}
        isLoading={false}
      />
    );
    
    expect(getByText(/00:00:59/)).toBeInTheDocument();
    
    jest.useRealTimers();
  });
});
```

#### Test: AcknowledgementChecklistView Component
```typescript
describe('AcknowledgementChecklistView', () => {
  it('should require all 7 items checked', () => {
    const mockChecklist = [
      { itemId: 'item1', title: 'Item 1', critical: true },
      { itemId: 'item2', title: 'Item 2', critical: true },
      // ... all 7 items
    ];
    
    const { getByRole } = render(
      <AcknowledgementChecklistView
        checklist={mockChecklist}
        isLoading={false}
        onAcknowledge={jest.fn()}
        acknowledgedItems={new Set()}
      />
    );
    
    const checkboxes = getByRole('checkbox');
    expect(checkboxes).toHaveLength(7);
  });
  
  it('should show 7/7 when all checked', () => {
    const allItems = new Set(['item1', 'item2', /* ... */, 'item7']);
    
    const { getByText } = render(
      <AcknowledgementChecklistView
        checklist={mockChecklist}
        isLoading={false}
        onAcknowledge={jest.fn()}
        acknowledgedItems={allItems}
      />
    );
    
    expect(getByText(/7\/7/)).toBeInTheDocument();
  });
});
```

---

## 4. End-to-End (E2E) Tests

### Playwright E2E Test (Happy Path)

```typescript
import { test, expect } from '@playwright/test';

test('complete contract review flow', async ({ page }) => {
  // 1. Navigate to review page
  await page.goto('/contract/test-contract-123/review');
  
  // 2. Verify page loaded
  await expect(page.locator('h1')).toContainText('Ringkasan Kontrak');
  
  // 3. Step 1: Summary
  const summaryCheckbox = page.locator('input[name="summary"]');
  await expect(summaryCheckbox).toBeVisible();
  await summaryCheckbox.check();
  await page.locator('button:has-text("Selanjutnya")').click();
  
  // 4. Step 2: Timeline
  const timelineCheckbox = page.locator('input[name="timeline"]');
  await timelineCheckbox.check();
  await page.locator('button:has-text("Selanjutnya")').click();
  
  // 5. Step 3: Risks
  const risksCheckbox = page.locator('input[name="risks"]');
  await risksCheckbox.check();
  await page.locator('button:has-text("Selanjutnya")').click();
  
  // 6. Step 4: Simulation
  const simulationCheckbox = page.locator('input[name="simulation"]');
  await simulationCheckbox.check();
  await page.locator('button:has-text("Selanjutnya")').click();
  
  // 7. Step 5: Legal
  const legalCheckbox = page.locator('input[name="legal"]');
  await legalCheckbox.check();
  await page.locator('button:has-text("Selanjutnya")').click();
  
  // 8. Step 6: Checklist (7 items)
  for (let i = 1; i <= 7; i++) {
    await page.locator(`input[name="checklist-${i}"]`).check();
  }
  await page.locator('button:has-text("Selanjutnya")').click();
  
  // 9. Step 7: Cooldown (mock 48h)
  await page.clock.runFor(48 * 60 * 60 * 1000 + 1000);
  
  // 10. Lock button should be enabled
  const lockButton = page.locator('button:has-text("Kunci Dana")');
  await expect(lockButton).toBeEnabled();
  
  // 11. Click lock → modal appears
  await lockButton.click();
  await expect(page.locator('h2:has-text("Konfirmasi Akhir")')).toBeVisible();
  
  // 12. Confirm lock
  await page.locator('button:has-text("Kunci Dana"):nth-child(2)').click();
  
  // 13. Should redirect to active-locked
  await expect(page).toHaveURL(/\/contract\/.*\/active-locked/);
});

test('cooldown prevents early lock', async ({ page }) => {
  await page.goto('/contract/test-contract-123/review');
  
  // Proceed to Step 7
  await fillAllSteps(page);
  
  // Verify lock button disabled
  const lockButton = page.locator('button:has-text("Kunci Dana")');
  await expect(lockButton).toBeDisabled();
  
  // Verify countdown showing ~48:00:00
  await expect(page.locator('text=48:00:00')).toBeVisible();
});
```

---

## 5. Security Tests

### Authorization Tests

```typescript
test('unauthorized user cannot access review', async () => {
  // No JWT token
  const response = await fetch('/api/contract-review/test-id/summary');
  expect(response.status).toBe(403);
});

test('wrong user cannot access other contract review', async () => {
  const userId2Token = generateJWT({ userId: 'user-2' });
  
  const response = await fetch('/api/contract-review/user-1-contract/summary', {
    headers: { Authorization: `Bearer ${userId2Token}` }
  });
  
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({
    message: expect.stringMatching(/tidak memiliki akses|forbidden/i)
  });
});
```

---

## 6. Performance Tests

### Load Time Tests

```typescript
test('page load time < 2 seconds', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/contract/test-contract/review', { 
    waitUntil: 'networkidle' 
  });
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000);
});

test('cooldown updates within 100ms', async ({ page }) => {
  // Get initial countdown value
  const initialValue = await page.locator('[data-test="countdown"]').textContent();
  
  // Wait 100ms
  await page.waitForTimeout(100);
  
  // Should still show similar countdown (±100ms)
  const finalValue = await page.locator('[data-test="countdown"]').textContent();
  
  // Parse timestamps and verify difference ≤ 100ms
  const diff = parseCountdown(initialValue) - parseCountdown(finalValue);
  expect(diff).toBeLessThanOrEqual(100);
});
```

---

## 7. Accessibility Tests

### WCAG 2.1 AA Tests

```typescript
test('page has correct heading hierarchy', async ({ page }) => {
  const headings = await page.locator('h1, h2, h3, h4').all();
  
  // Should start with h1
  const firstHeading = await headings[0].evaluate(el => el.tagName);
  expect(firstHeading).toBe('H1');
});

test('all interactive elements keyboard accessible', async ({ page }) => {
  await page.goto('/contract/test-contract/review');
  
  // Tab through all elements
  let focusable = 0;
  while (focusable < 50) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    
    if (['BUTTON', 'INPUT', 'A'].includes(focused)) {
      focusable++;
    }
  }
  
  expect(focusable).toBeGreaterThan(10); // Multiple focusable elements
});

test('form labels properly associated', async ({ page }) => {
  const inputs = await page.locator('input').all();
  
  for (const input of inputs) {
    const inputId = await input.getAttribute('id');
    if (inputId) {
      const label = page.locator(`label[for="${inputId}"]`);
      await expect(label).toHaveCount(1);
    }
  }
});
```

---

## 8. Manual Testing Checklist

### Desktop Browser (Chrome, Firefox, Safari)
- [ ] All 7 steps render correctly
- [ ] Navigation buttons work (Next, Back)
- [ ] Checkboxes toggle on/off
- [ ] Accordion sections expand/collapse
- [ ] Cooldown countdown updates smoothly
- [ ] Modal appears on lock attempt
- [ ] Page responsive to window resize

### Mobile Browser (iOS Safari, Android Chrome)
- [ ] Touch interactions work (tap checkboxes, buttons)
- [ ] Readable text without zooming
- [ ] No horizontal scrolling required
- [ ] Modal usable on small screen
- [ ] Countdown visible and updating

### Edge Cases
- [ ] Refresh page mid-review → Store restores state
- [ ] Close browser mid-review → Reopen → State persisted
- [ ] Poor network → Spinner shows, then completes
- [ ] API timeout → Error message shown
- [ ] User goes backward then forward → State consistent

---

## 9. Test Execution

### Run All Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All with coverage
npm run test:coverage
```

### Expected Coverage
- **Statements:** >85%
- **Branches:** >80%
- **Functions:** >85%
- **Lines:** >85%

---

## 10. Test Data

### Create Test Contract (In State 0)
```typescript
const testContract = {
  id: 'test-contract-123',
  contractorId: 'contractor-1',
  ownerId: 'owner-1',
  state: 'INTENT_DECLARED', // Must be this
  value: 10000000000,
  title: 'Test Construction Project',
  // ... other fields
};
```

### JWT Test Token
```javascript
const testToken = jwt.sign({
  userId: 'test-user-1',
  email: 'test@example.com',
  role: 'OWNER'
}, process.env.JWT_SECRET, { expiresIn: '1h' });
```

---

## 11. Known Issues & Workarounds

| Issue | Workaround |
|-------|-----------|
| Cooldown doesn't update after page refresh | localStorage persisted, but timer resets; refresh page to sync |
| Modal appears behind overlay | Check z-index in CSS; should be 50+ higher than content |
| Step completion not persisting | Verify Zustand store persists to localStorage |

---

## 12. Sign-Off Criteria

**✅ QA Pass Requirements:**

- [ ] All unit tests pass (>85% coverage)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] No critical bugs found
- [ ] Manual testing checklist complete
- [ ] Performance targets met (<2s load, <100ms update)
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Security audit passes (no XSS, CSRF, XXE)

**Sign-Off:**
```
QA Lead: _________________ Date: _______
Dev Lead: ________________ Date: _______
Product: _________________ Date: _______
```

---

**Document Version:** 1.0  
**Last Updated:** [Current Session]  
**Next Review:** After State 1 deployment
