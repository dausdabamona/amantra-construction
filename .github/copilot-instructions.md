# AMANTRA Construction - AI Coding Assistant Instructions

## Project Overview

AMANTRA (Amanah Manajemen Transaksi) is a B2B construction contract management platform featuring milestone-based payments ("termin") with multi-layer verification. Built as MVP 0.1 with Next.js 14 (frontend) and NestJS (backend) using Prisma ORM with SQLite (dev) → PostgreSQL (prod).

**Core Domain:** Construction contracts split into work phases (termin), each requiring approval from both SUPERVISOR and WITNESS before payment triggers.

## Architecture Principles

### Backend Structure (NestJS)
- **Module-per-feature:** Each domain (projects, terms, progress, verifications) has its own module with controller/service/DTOs
- **Centralized infrastructure:** Global exception filter ([global-exception.filter.ts](backend/src/common/filters/global-exception.filter.ts)), validation pipe, logging interceptor configured in [main.ts](backend/src/main.ts#L25-L42)
- **Role-based access:** All protected endpoints use `@UseGuards(JwtAuthGuard)`. Services check `user.role` to filter data (see [projects.service.ts](backend/src/projects/projects.service.ts#L23-L26))
- **Audit everything:** Every state change calls `auditService.log()` with action/entity/userId

### Database Patterns (Prisma)
- **No enums in schema:** Uses `String` types with status values in code to maintain SQLite compatibility ([schema.prisma](backend/prisma/schema.prisma#L1-L7))
- **Status transitions:** Terms flow: DRAFT → SUBMITTED → VERIFIED → VALID → PAID. See [MVP-ARCHITECTURE.md](docs/MVP-ARCHITECTURE.md#L84-L95) for full state diagram
- **Unique constraints:** Terms use `@@unique([contractId, termNumber])` to prevent duplicate term numbers per contract

### Frontend Patterns (Next.js)
- **Centralized API client:** All backend calls through [services/api.ts](frontend/src/services/api.ts) using axios with automatic JWT injection
- **Bilingual support:** UI must support Indonesian (primary) and English. Error messages in Indonesian ([auth.service.ts](backend/src/auth/auth.service.ts#L21))
- **PWA-ready:** Uses next-pwa plugin; static assets in [public/](frontend/public/)

## Critical User Roles & Permissions

**4 Primary Roles** (hardcoded in [schema.prisma](backend/prisma/schema.prisma#L23)):
- `OWNER`: Creates projects, assigns team, uploads payment proof
- `CONTRACTOR`: Submits progress reports with photos
- `SUPERVISOR`: First-layer verification (approve/reject progress)
- `WITNESS`: Second-layer verification (technical expert)

**Key Rule:** Term becomes VALID only when BOTH supervisor AND witness approve. Implement this check in verification logic ([docs/user-flow.md](docs/user-flow.md#L84-L105)).

## Development Workflows

### Backend Commands
```bash
npm run start:dev          # Development with watch mode
npm run db:push            # Push schema changes (dev only)
npm run db:seed            # Seed with test users and sample project
npm run db:studio          # Visual database browser
```

**After schema changes:** Run `npx prisma generate` to update Prisma client types.

**Test users from seed:** See [prisma/seed.ts](backend/prisma/seed.ts#L50-L100) for default credentials (all use password "password123").

### Creating DTOs
- Use class-validator with **Indonesian error messages**: `@IsNotEmpty({ message: 'Field tidak boleh kosong' })`
- Always add `@ApiProperty()` decorators for Swagger docs ([QUICK-REFERENCE.md](backend/QUICK-REFERENCE.md#L57-L75))
- Pagination uses standardized `PaginationDto` from [common/dto/pagination.dto.ts](backend/src/common/dto/pagination.dto.ts)

### File Uploads
- Store in `backend/uploads/{entity}/` directories (e.g., `uploads/progress/`, `uploads/payments/`)
- Use multer middleware, save relative paths to database
- Frontend uploads via FormData with `multipart/form-data`

## Business Logic Guardrails

1. **Termin percentage validation:** Sum of all term percentages in a contract must not exceed 100%
2. **Verification workflow:** Progress must be uploaded (SUBMITTED) before verifications can be created
3. **Payment prerequisite:** Term status must be VALID before payment proof can be uploaded
4. **Audit trail:** Every CREATE/UPDATE/DELETE must log to AuditLog table with userId

## Common Pitfalls

❌ **Don't** use Prisma enums - SQLite doesn't support them. Use string literals instead.  
❌ **Don't** create endpoints without `@UseGuards(JwtAuthGuard)` decorator on controllers.  
❌ **Don't** forget to add audit logging after state changes.  
✅ **Do** check user role in service methods to filter data per user.  
✅ **Do** include all related entities in responses (use Prisma `include` for foreign keys).  
✅ **Do** use Indonesian for user-facing messages, English for technical logs.

## Key Files for Reference

- [MVP-ARCHITECTURE.md](docs/MVP-ARCHITECTURE.md) - Business flow diagrams
- [ARCHITECTURE.md](backend/ARCHITECTURE.md) - Request/response flow and logging setup
- [QUICK-REFERENCE.md](backend/QUICK-REFERENCE.md) - Common commands and code templates
- [schema.prisma](backend/prisma/schema.prisma) - Complete data model
- [user-flow.md](docs/user-flow.md) - Detailed interaction flows per role

## API Documentation

Swagger UI available at `http://localhost:3001/docs` with all endpoints auto-documented via decorators. Reference existing controllers for decorator patterns.
