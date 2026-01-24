# Feature: Contractor Selection & Track Record Module

## 🎯 Overview

**Type:** Feature Enhancement  
**Priority:** Medium  
**Complexity:** High  
**Estimated Effort:** 3-4 Sprints

---

## 📋 Context

AMANTRA Construction currently allows project creation but lacks a robust contractor selection mechanism. This feature will enable **Owners** to select contractors based on:

- Historical track record
- Performance metrics
- Experience level (Senior, Intermediate, Junior)
- Project completion history
- Quality and integrity scores

---

## ✅ Scope Clarification

**⚠️ This feature is OUT OF SCOPE for the current PR:**
- Current PR: Documentation (Indonesian setup guides) + Security (multer DoS patches)
- This feature requires: New database schema, backend API, frontend UI, business logic

**This is a NEW feature that requires a separate PR.**

---

## 🎨 User Stories

### As an Owner (Pemberi Kerja)
- I want to **view a list of available contractors** with their track records
- I want to **filter contractors** by experience level and performance score
- I want to **select a contractor** for my construction project
- I want to **see detailed contractor profiles** including past projects

### As a Supervisor (Pengawas)
- I want to **view contractor audit trails** for transparency
- I want to **see contractor performance** on previous projects

### As a System Admin
- I want to **manage contractor data** (create, update, archive)
- I want to **track contractor performance metrics** across all projects

---

## 🗄️ Database Schema Design

### Entity: `Contractor`

```prisma
model Contractor {
  id                String    @id @default(uuid())
  userId            String?   @unique // Link to User model (if contractor has login)
  companyName       String
  registrationNumber String   @unique // NIB atau SIUP
  classification    String    // SENIOR, INTERMEDIATE, JUNIOR
  
  // Experience & Metrics
  yearsOfExperience Int
  totalProjects     Int       @default(0)
  completedProjects Int       @default(0)
  
  // Performance Scores (0-100)
  qualityScore      Float     @default(0)
  timelinessScore   Float     @default(0)
  integrityScore    Float     @default(0)
  overallRating     Float     @default(0)
  
  // Contact & Legal
  address           String
  phone             String
  email             String    @unique
  certifications    String?   // JSON: ["SBU", "ISO9001", etc]
  
  // Status
  isActive          Boolean   @default(true)
  isVerified        Boolean   @default(false)
  joinedAt          DateTime  @default(now())
  
  // Relations
  projectHistory    ProjectHistory[]
  contracts         Contract[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([classification])
  @@index([overallRating])
  @@index([isActive])
}
```

### Entity: `ProjectHistory`

```prisma
model ProjectHistory {
  id                String    @id @default(uuid())
  contractorId      String
  contractor        Contractor @relation(fields: [contractorId], references: [id])
  
  // Project Details
  projectName       String
  projectValue      Float
  projectLocation   String
  projectType       String    // "BUILDING", "INFRASTRUCTURE", "RESIDENTIAL"
  
  // Timeline
  startDate         DateTime
  endDate           DateTime?
  plannedDuration   Int       // days
  actualDuration    Int?      // days
  
  // Performance
  qualityScore      Float     // 0-100
  timelinessScore   Float     // 0-100
  budgetVariance    Float     // percentage (+/-)
  clientSatisfaction Float    // 0-100
  
  // Status
  status            String    // "COMPLETED", "ONGOING", "TERMINATED"
  remarks           String?
  
  // Verification
  verifiedBy        String?   // User ID of verifier
  verifiedAt        DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([contractorId])
  @@index([status])
}
```

### Entity: `PerformanceScore`

```prisma
model PerformanceScore {
  id                String    @id @default(uuid())
  contractorId      String
  projectHistoryId  String
  
  // Score Categories
  technicalQuality  Float     // 0-100
  workmanship       Float     // 0-100
  materialQuality   Float     // 0-100
  safety            Float     // 0-100
  timeManagement    Float     // 0-100
  budgetControl     Float     // 0-100
  communication     Float     // 0-100
  problemSolving    Float     // 0-100
  
  // Overall
  overallScore      Float     // Average of above
  
  // Audit
  evaluatedBy       String    // User ID
  evaluatedAt       DateTime  @default(now())
  notes             String?
  
  createdAt         DateTime  @default(now())
  
  @@index([contractorId])
  @@index([projectHistoryId])
}
```

---

## 🏗️ Architecture Design

### Backend Structure

```
backend/src/
├── contractors/
│   ├── contractors.module.ts
│   ├── contractors.controller.ts
│   ├── contractors.service.ts
│   ├── dto/
│   │   ├── create-contractor.dto.ts
│   │   ├── update-contractor.dto.ts
│   │   ├── filter-contractors.dto.ts
│   │   └── contractor-performance.dto.ts
│   └── entities/
│       ├── contractor.entity.ts
│       ├── project-history.entity.ts
│       └── performance-score.entity.ts
├── contractor-selection/
│   ├── contractor-selection.module.ts
│   ├── contractor-selection.controller.ts
│   ├── contractor-selection.service.ts
│   └── dto/
│       ├── select-contractor.dto.ts
│       └── contractor-ranking.dto.ts
└── performance-tracking/
    ├── performance-tracking.module.ts
    ├── performance-tracking.controller.ts
    └── performance-tracking.service.ts
```

### Frontend Structure

```
frontend/src/
├── pages/
│   ├── contractors/
│   │   ├── index.tsx              // List all contractors
│   │   ├── [id].tsx               // Contractor detail
│   │   └── select.tsx             // Selection wizard
│   └── projects/
│       └── [id]/
│           └── select-contractor.tsx
├── components/
│   ├── contractors/
│   │   ├── ContractorCard.tsx
│   │   ├── ContractorProfile.tsx
│   │   ├── ContractorRanking.tsx
│   │   ├── ContractorFilter.tsx
│   │   └── TrackRecordTable.tsx
│   └── selection/
│       ├── SelectionWizard.tsx
│       └── ComparisonTable.tsx
└── services/
    └── contractorService.ts
```

---

## 🔄 User Flow

### 1. Owner Selects Contractor

```
1. Owner navigates to Project Detail
2. Click "Pilih Kontraktor" button
3. System displays Contractor Selection Wizard:
   
   Step 1: Filter & Search
   - Classification filter (Senior/Intermediate/Junior)
   - Minimum rating filter
   - Search by company name
   
   Step 2: Review Rankings
   - Table showing:
     * Company name
     * Classification
     * Overall rating (⭐⭐⭐⭐⭐)
     * Completed projects count
     * Average quality score
     * Timeliness score
     * Integrity score
   - Sort by: Rating, Projects, Quality
   
   Step 3: View Details
   - Click contractor to see:
     * Company profile
     * Certifications
     * Project history table
     * Performance charts
     * Client testimonials
   
   Step 4: Compare (optional)
   - Select up to 3 contractors
   - View side-by-side comparison
   
   Step 5: Select
   - Click "Pilih Kontraktor"
   - Confirm selection
   - System creates contract assignment
4. Contractor receives notification
5. Contract workflow begins
```

### 2. Supervisor/Auditor Views Audit Trail

```
1. Navigate to Contractor Profile
2. View "Audit Trail" tab
3. See:
   - All project assignments
   - Performance evaluations
   - Score changes over time
   - Verification history
```

---

## 📊 Sample Data: 5 Contractors

### 1. PT Megah Konstruksi (Senior - Experienced)

```json
{
  "companyName": "PT Megah Konstruksi",
  "classification": "SENIOR",
  "yearsOfExperience": 15,
  "totalProjects": 87,
  "completedProjects": 82,
  "qualityScore": 92,
  "timelinessScore": 88,
  "integrityScore": 95,
  "overallRating": 91.67,
  "certifications": ["SBU Grade 7", "ISO 9001:2015", "ISO 14001", "OHSAS 18001"],
  "projectHistory": [
    {
      "projectName": "Gedung Perkantoran 20 Lantai - Jakarta",
      "projectValue": 85000000000,
      "status": "COMPLETED",
      "qualityScore": 94,
      "timelinessScore": 90,
      "clientSatisfaction": 95
    },
    {
      "projectName": "Mall Metropolitan - Surabaya",
      "projectValue": 120000000000,
      "status": "COMPLETED",
      "qualityScore": 91,
      "timelinessScore": 85,
      "clientSatisfaction": 92
    }
  ]
}
```

### 2. CV Bangun Jaya (Intermediate - Solid Track Record)

```json
{
  "companyName": "CV Bangun Jaya",
  "classification": "INTERMEDIATE",
  "yearsOfExperience": 8,
  "totalProjects": 34,
  "completedProjects": 31,
  "qualityScore": 85,
  "timelinessScore": 82,
  "integrityScore": 88,
  "overallRating": 85.0,
  "certifications": ["SBU Grade 5", "ISO 9001:2015"],
  "projectHistory": [
    {
      "projectName": "Ruko 3 Lantai - Bandung",
      "projectValue": 5000000000,
      "status": "COMPLETED",
      "qualityScore": 87,
      "timelinessScore": 84,
      "clientSatisfaction": 88
    },
    {
      "projectName": "Gedung Sekolah 4 Lantai - Bekasi",
      "projectValue": 8000000000,
      "status": "COMPLETED",
      "qualityScore": 83,
      "timelinessScore": 80,
      "clientSatisfaction": 85
    }
  ]
}
```

### 3. PT Karya Prima (Senior - High Quality)

```json
{
  "companyName": "PT Karya Prima",
  "classification": "SENIOR",
  "yearsOfExperience": 12,
  "totalProjects": 56,
  "completedProjects": 54,
  "qualityScore": 96,
  "timelinessScore": 91,
  "integrityScore": 94,
  "overallRating": 93.67,
  "certifications": ["SBU Grade 6", "ISO 9001:2015", "ISO 14001", "Green Building"],
  "projectHistory": [
    {
      "projectName": "Hotel Bintang 5 - Bali",
      "projectValue": 95000000000,
      "status": "COMPLETED",
      "qualityScore": 98,
      "timelinessScore": 93,
      "clientSatisfaction": 97
    }
  ]
}
```

### 4. CV Mitra Bangun (Intermediate - Reliable)

```json
{
  "companyName": "CV Mitra Bangun",
  "classification": "INTERMEDIATE",
  "yearsOfExperience": 6,
  "totalProjects": 22,
  "completedProjects": 20,
  "qualityScore": 80,
  "timelinessScore": 78,
  "integrityScore": 83,
  "overallRating": 80.33,
  "certifications": ["SBU Grade 4"],
  "projectHistory": [
    {
      "projectName": "Rumah Sakit 3 Lantai - Semarang",
      "projectValue": 12000000000,
      "status": "COMPLETED",
      "qualityScore": 82,
      "timelinessScore": 76,
      "clientSatisfaction": 81
    }
  ]
}
```

### 5. PT Pemula Konstruksi (Junior - New Entrant)

```json
{
  "companyName": "PT Pemula Konstruksi",
  "classification": "JUNIOR",
  "yearsOfExperience": 2,
  "totalProjects": 5,
  "completedProjects": 4,
  "qualityScore": 72,
  "timelinessScore": 70,
  "integrityScore": 75,
  "overallRating": 72.33,
  "certifications": ["SBU Grade 2"],
  "projectHistory": [
    {
      "projectName": "Renovasi Gedung Kantor - Tangerang",
      "projectValue": 2000000000,
      "status": "COMPLETED",
      "qualityScore": 75,
      "timelinessScore": 72,
      "clientSatisfaction": 74
    },
    {
      "projectName": "Pembangunan Gudang - Karawang",
      "projectValue": 3500000000,
      "status": "COMPLETED",
      "qualityScore": 70,
      "timelinessScore": 68,
      "clientSatisfaction": 71
    }
  ]
}
```

---

## 🔐 Access Control & Permissions

| Role | View List | View Details | Select | Manage Data | View Audit |
|------|-----------|--------------|--------|-------------|------------|
| Owner | ✅ | ✅ | ✅ | ❌ | ❌ |
| Contractor | ✅ (own) | ✅ (own) | ❌ | ✅ (own) | ❌ |
| Supervisor | ✅ | ✅ | ❌ | ❌ | ✅ |
| Witness | ✅ | ✅ | ❌ | ❌ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📈 Implementation Roadmap

### Phase 1: Foundation & Dummy Data (Sprint 1)
**Goal:** Setup database and seed with 5 contractors

**Tasks:**
- [ ] Create Prisma schema for Contractor, ProjectHistory, PerformanceScore
- [ ] Run migration: `npx prisma migrate dev --name add_contractors`
- [ ] Create seed script: `prisma/seeds/contractors.seed.ts`
- [ ] Seed 5 contractors with sample data (as specified above)
- [ ] Verify data in Prisma Studio
- [ ] Create backend module structure (contractors, contractor-selection)
- [ ] Setup basic CRUD endpoints:
  - `GET /contractors` - List contractors
  - `GET /contractors/:id` - Get contractor details
  - `POST /contractors` - Create contractor (admin only)
  - `PUT /contractors/:id` - Update contractor
- [ ] Write unit tests for contractor service

**Deliverables:**
- Working database with 5 contractors
- Basic REST API endpoints
- Swagger documentation updated

---

### Phase 2: Selection Wizard UI (Sprint 2)
**Goal:** Frontend interface for contractor selection

**Tasks:**
- [ ] Create `/contractors` page (list view)
  - Display contractor cards with key metrics
  - Filter by classification, rating
  - Search by company name
- [ ] Create `/contractors/[id]` page (detail view)
  - Company profile section
  - Project history table
  - Performance charts (quality, timeliness, integrity)
- [ ] Create `/projects/[id]/select-contractor` wizard
  - Step 1: Filter & Search
  - Step 2: Rankings table (sortable)
  - Step 3: Detailed comparison (up to 3)
  - Step 4: Final selection + confirmation
- [ ] Implement ranking algorithm:
  ```typescript
  ranking = (
    overallRating * 0.4 +
    qualityScore * 0.25 +
    timelinessScore * 0.20 +
    integrityScore * 0.15
  )
  ```
- [ ] Add contractor selection to project workflow
- [ ] Create API service: `contractorService.ts`
- [ ] Write E2E tests for selection flow

**Deliverables:**
- Working selection wizard UI
- Contractor comparison feature
- Integration with project creation

---

### Phase 3: Contract Assignment & Integration (Sprint 3)
**Goal:** Link contractors to contracts and terms

**Tasks:**
- [ ] Update Contract model:
  - Add `selectedContractorId` field
  - Add relation to Contractor
- [ ] Create contractor assignment endpoint:
  - `POST /projects/:id/assign-contractor`
- [ ] Implement notification system:
  - Email to selected contractor
  - In-app notification
- [ ] Add contractor info to project detail page
- [ ] Update contract PDF generation to include contractor details
- [ ] Add contractor performance tracking during project:
  - Quality checkpoints
  - Timeline adherence
  - Budget tracking
- [ ] Implement contractor dashboard:
  - View assigned projects
  - Track performance metrics
  - Update project status
- [ ] Add audit log for contractor selection:
  - Who selected
  - When selected
  - Selection criteria used

**Deliverables:**
- Contractors linked to projects/contracts
- Notification system working
- Contractor dashboard

---

### Phase 4: Performance Evaluation & Audit (Sprint 4)
**Goal:** Track and evaluate contractor performance

**Tasks:**
- [ ] Create performance evaluation form:
  - Technical quality (0-100)
  - Workmanship (0-100)
  - Material quality (0-100)
  - Safety (0-100)
  - Time management (0-100)
  - Budget control (0-100)
  - Communication (0-100)
  - Problem solving (0-100)
- [ ] Implement evaluation workflow:
  - Supervisor evaluates at each termin
  - Witness validates evaluation
  - Owner approves final score
- [ ] Auto-update contractor overall scores after project completion
- [ ] Create audit trail viewer:
  - Timeline of contractor activities
  - Score changes over time
  - Verification history
- [ ] Add reporting:
  - Contractor performance report (PDF)
  - Comparison report (multiple contractors)
  - Trend analysis
- [ ] Implement contractor rating system:
  - Star rating display (1-5 stars)
  - Rating breakdown
  - Client testimonials
- [ ] Add blacklist/warning system:
  - Flag contractors with poor performance
  - Require admin approval for flagged contractors

**Deliverables:**
- Performance evaluation system
- Audit trail viewer
- Contractor rating & reputation system
- PDF reports

---

## 🧪 Testing Requirements

### Unit Tests
- Contractor CRUD operations
- Ranking algorithm accuracy
- Performance score calculations
- Access control enforcement

### Integration Tests
- Contractor selection flow
- Contract assignment
- Notification delivery
- Audit log creation

### E2E Tests
- Complete selection wizard flow
- Performance evaluation workflow
- Report generation

---

## 📋 Acceptance Criteria

### Must Have (MVP)
- [x] Database schema with Contractor, ProjectHistory, PerformanceScore
- [x] Seed data: 5 contractors (2 senior, 2 intermediate, 1 junior)
- [x] REST API endpoints for contractor CRUD
- [x] Selection wizard UI (filter, rank, compare, select)
- [x] Contractor assignment to projects/contracts
- [x] Basic performance tracking

### Should Have
- [x] Performance evaluation form
- [x] Audit trail viewer
- [x] Contractor dashboard
- [x] Notification system
- [x] PDF reports

### Nice to Have
- [ ] Advanced analytics (charts, trends)
- [ ] Contractor ratings & reviews
- [ ] Blacklist management
- [ ] Contractor certification verification
- [ ] Integration with external databases (LPJK, etc.)

---

## 🚀 Technical Considerations

### Performance
- Use pagination for contractor lists (default: 20 per page)
- Cache contractor rankings (recalculate daily)
- Index database fields: classification, overallRating, isActive

### Security
- Validate contractor selection permissions
- Audit all contractor assignments
- Encrypt sensitive contractor data
- Rate limiting on selection endpoints

### Data Integrity
- Prevent duplicate contractor registrations (by email, registration number)
- Validate performance scores (0-100 range)
- Ensure project history consistency
- Track all score changes with audit logs

---

## 📝 Additional Notes

### Business Rules
1. **Owner** can only select contractors with `isActive = true`
2. **Junior contractors** can only be selected for projects < Rp 10B
3. **Intermediate contractors** can handle projects up to Rp 50B
4. **Senior contractors** have no project value limit
5. Performance scores update automatically after project completion
6. Contractors with overall rating < 60 trigger warning notification

### Future Enhancements
- AI-powered contractor recommendation based on project type
- Contractor marketplace (bidding system)
- Integration with government contractor database (LPJK)
- Blockchain-based contractor certification
- Multi-language support for contractor profiles

---

## 🔗 Related Documentation

- [AMANTRA Architecture](./docs/MVP-ARCHITECTURE.md)
- [Database Schema](./backend/prisma/schema.prisma)
- [API Documentation](http://localhost:3001/docs)
- [User Flow Diagram](./docs/user-flow.md)

---

## ✅ Definition of Done

- [ ] All code merged to main branch
- [ ] Database migrations applied
- [ ] API endpoints documented in Swagger
- [ ] Frontend pages deployed and accessible
- [ ] All tests passing (unit + integration + E2E)
- [ ] Performance benchmarks met (< 500ms response time)
- [ ] Security audit completed
- [ ] User documentation updated
- [ ] Demo video recorded
- [ ] Stakeholder sign-off obtained

---

**Created:** 2026-01-24  
**Status:** DRAFT - Pending Approval  
**Owner:** TBD  
**Est. Completion:** Q1 2026 (4 sprints)
