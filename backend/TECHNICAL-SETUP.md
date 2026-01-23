# 🔧 AMANTRA Construction Backend - Technical Setup

## Rekomendasi Teknis yang Sudah Diimplementasi

### 1. ✅ Input Validation dengan Class Validator
- **Status**: SELESAI
- **File**: `src/*/dto/*.ts`
- **Fitur**:
  - LoginDto - Validasi email dan password
  - RegisterDto - Validasi lengkap user registration
  - CreateProjectDto - Validasi pembuatan proyek
  - CreateContractDto - Validasi kontrak dengan min/max values
  - CreateTermDto - Validasi termin dengan percentage/value checks
  - CreateProgressDto - Validasi progres upload
  - CreateVerificationDto - Validasi verifikasi status
  - CreatePaymentDto - Validasi pembayaran

- **Cara Menggunakan**:
```typescript
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto.email, loginDto.password);
}
```

### 2. ✅ Global Exception Filter
- **Status**: SELESAI
- **File**: `src/common/filters/global-exception.filter.ts`
- **Fitur**:
  - Centralized error handling
  - Consistent error response format
  - Support untuk HttpException dan generic Error
  - Timestamp dan path tracking

- **Response Format**:
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-23T10:30:45.123Z",
  "path": "/api/v1/auth/login",
  "message": "Email harus valid",
  "error": "BadRequestException"
}
```

### 3. ✅ Winston Logger
- **Status**: SELESAI
- **File**: `src/common/logger/logger.service.ts`
- **Fitur**:
  - Daily rotating log files
  - Separate error dan application logs
  - Console output dengan color formatting
  - Exception dan rejection handlers
  - Configurable log levels via LOG_LEVEL env

- **Logging Outputs**:
  - `logs/application-YYYY-MM-DD.log` - Semua logs
  - `logs/error-YYYY-MM-DD.log` - Hanya error logs
  - `logs/exceptions.log` - Uncaught exceptions
  - `logs/rejections.log` - Unhandled rejections

- **Cara Menggunakan**:
```typescript
import { LoggerService } from './common/logger/logger.service';

constructor(private loggerService: LoggerService) {}

method() {
  this.loggerService.log('Message', 'ContextName');
  this.loggerService.error('Error', 'stack', 'Context');
  this.loggerService.warn('Warning', 'Context');
}
```

### 4. ✅ Logging Interceptor
- **Status**: SELESAI
- **File**: `src/common/interceptors/logging.interceptor.ts`
- **Fitur**:
  - Auto log semua HTTP requests/responses
  - Track response time
  - Log user email (jika authenticated)
  - Automatic error logging

- **Log Example**:
```
2024-01-23 10:30:45 [info]: [POST] /api/v1/auth/login - User: anonymous - Started
2024-01-23 10:30:46 [info]: [POST] /api/v1/auth/login - User: anonymous - Completed (200) in 1234ms
```

### 5. ✅ Enhanced Swagger Documentation
- **Status**: SELESAI
- **File**: `src/main.ts`
- **Fitur**:
  - Complete API documentation
  - Bearer JWT authentication setup
  - Proper API response codes (200, 201, 400, 403, 404, 500)
  - Bilingual descriptions (ID/EN)
  - Contact dan license information

- **Access**: `http://localhost:3001/docs`

### 6. ✅ Jest Testing Setup
- **Status**: SELESAI
- **Files**:
  - `src/auth/auth.service.spec.ts` - Auth service unit tests
  - `src/common/filters/global-exception.filter.spec.ts` - Exception filter tests
  - `src/common/logger/logger.service.spec.ts` - Logger service tests

- **Cara Menjalankan**:
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm run test -- auth.service.spec.ts
```

---

## 📦 Dependencies yang Ditambahkan

```bash
npm install winston winston-daily-rotate-file
```

**Versions**:
- `winston@^3.11.0` - Logging library
- `winston-daily-rotate-file@^4.7.1` - Log rotation

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### 3. Setup Database
```bash
npm run db:generate
npm run db:migrate
npm run db:seed  # Optional
```

### 4. Start Development Server
```bash
npm run start:dev
```

Server akan berjalan di `http://localhost:3001`
API Docs di `http://localhost:3001/docs`

---

## 🧪 Testing

### Unit Tests
```bash
# Jalankan semua tests
npm run test

# Watch mode untuk development
npm run test:watch

# Generate coverage report
npm run test:cov
```

### Example Test Output
```
PASS  src/auth/auth.service.spec.ts
  AuthService
    login
      ✓ should successfully login user with valid credentials (15ms)
      ✓ should throw UnauthorizedException when user not found (8ms)
      ✓ should throw UnauthorizedException when password is invalid (7ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

---

## 📝 Validation Examples

### Login Request
```json
POST /api/v1/auth/login

{
  "email": "invalid-email",  // ❌ Error: Email harus valid
  "password": "123"          // ❌ Error: Password minimal 6 karakter
}
```

### Create Term Request
```json
POST /api/v1/terms/contract/contract-id

{
  "termNumber": 1,
  "name": "Pekerjaan Pondasi",
  "percentage": 150,         // ❌ Error: Persentase maksimal 100%
  "value": 10000            // ❌ Error: Nilai termin minimal Rp 100.000
}
```

---

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001
API_PREFIX=api/v1

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=7d

# Logging
LOG_LEVEL=debug  # debug, info, warn, error

# Node
NODE_ENV=development
```

---

## 🏗️ Project Structure

```
src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   └── auth.service.spec.ts
├── common/
│   ├── dto/
│   ├── filters/
│   │   ├── global-exception.filter.ts
│   │   └── global-exception.filter.spec.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   ├── logger/
│   │   ├── logger.service.ts
│   │   └── logger.service.spec.ts
│   └── common.module.ts
├── projects/
│   └── dto/
│       ├── create-project.dto.ts
│       └── create-contract.dto.ts
├── terms/
│   └── dto/
│       └── create-term.dto.ts
├── progress/
│   └── dto/
│       └── create-progress.dto.ts
├── verifications/
│   └── dto/
│       └── create-verification.dto.ts
├── payments/
│   └── dto/
│       └── create-payment.dto.ts
├── app.module.ts
└── main.ts
```

---

## 🔄 Next Steps

### Immediate (CRITICAL)
1. ✅ Validation + DTOs
2. ✅ Global Error Handling
3. ✅ Logging System
4. Implement Progress Upload Module (file upload handling)
5. Implement Verification Workflow (approval/rejection logic)
6. Implement Payments Module (payment recording)

### Short Term
1. Add more comprehensive unit tests
2. Add integration tests
3. Setup CI/CD pipeline
4. Database migrations untuk production

### Medium Term
1. API rate limiting
2. Request compression
3. Caching layer
4. Security headers
5. API key authentication option

---

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Swagger/OpenAPI](https://swagger.io/)

---

## ✋ Support & Questions

Untuk pertanyaan atau masalah, silakan buat issue di repository.
