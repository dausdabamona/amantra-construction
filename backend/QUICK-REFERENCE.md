# 🚀 Quick Reference Guide - AMANTRA Backend

## Installation & Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# 3. Setup database
npm run db:generate
npm run db:migrate

# 4. Start development server
npm run start:dev
```

**Access Points:**
- API: `http://localhost:3001/api/v1`
- Docs: `http://localhost:3001/docs`

---

## Common Commands

```bash
# Development
npm run start:dev              # Start dengan auto-reload
npm run start:debug            # Debug mode

# Database
npm run db:migrate             # Run migrations
npm run db:seed                # Seed database
npm run db:studio              # Open Prisma Studio (GUI)
npm run db:reset               # Reset database (CAREFUL!)

# Testing
npm run test                   # Run all tests
npm run test:watch             # Watch mode
npm run test:cov               # Coverage report

# Code Quality
npm run lint                   # Run ESLint
npm run format                 # Format dengan Prettier

# Build
npm run build                  # Build production
npm run start:prod             # Run production build
```

---

## Creating New DTOs

### Template:
```typescript
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSomethingDto {
  @ApiProperty({
    example: 'Example value',
    description: 'Description of this field',
  })
  @IsNotEmpty({ message: 'Field tidak boleh kosong' })
  @IsString({ message: 'Field harus string' })
  fieldName: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Optional field',
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Minimal nilai adalah 1' })
  optionalField?: number;
}
```

### Available Validators:
- `@IsNotEmpty()` - Required field
- `@IsString()`, `@IsNumber()`, `@IsInt()` - Type validation
- `@MinLength()`, `@MaxLength()` - String length
- `@Min()`, `@Max()` - Number range
- `@IsEmail()` - Email validation
- `@IsUUID()` - UUID validation
- `@IsPhoneNumber()` - Phone validation
- `@IsIn(['value1', 'value2'])` - Enum validation
- `@IsOptional()` - Make field optional
- `@IsArray()`, `@ArrayMinSize()` - Array validation

---

## Using Logger

```typescript
import { LoggerService } from './common/logger/logger.service';

constructor(private loggerService: LoggerService) {}

// Different log levels
this.loggerService.log('Info message', 'ContextName');
this.loggerService.debug('Debug message', 'ContextName');
this.loggerService.warn('Warning message', 'ContextName');
this.loggerService.error('Error message', 'stack trace', 'ContextName');
this.loggerService.verbose('Verbose message', 'ContextName');
```

**Log Output Files:**
- `logs/application-YYYY-MM-DD.log` - All logs
- `logs/error-YYYY-MM-DD.log` - Errors only

---

## Creating New Endpoints

### Step 1: Create DTO (src/module/dto/create-*.dto.ts)
```typescript
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ example: 'Name', description: 'Name description' })
  @IsNotEmpty({ message: 'Name tidak boleh kosong' })
  @IsString({ message: 'Name harus string' })
  name: string;
}
```

### Step 2: Update Controller
```typescript
import { CreateModuleDto } from './dto/create-module.dto';

@Post()
@ApiOperation({ summary: 'Deskripsi endpoint' })
@ApiResponse({ status: 201, description: 'Berhasil dibuat' })
async create(@Body() createModuleDto: CreateModuleDto) {
  return this.moduleService.create(createModuleDto);
}
```

### Step 3: Add Service Logic
```typescript
async create(createModuleDto: CreateModuleDto) {
  this.loggerService.log('Creating module', 'ModuleService');
  // Your logic here
  return result;
}
```

---

## Error Handling

### Throw HTTP Exceptions:
```typescript
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

// Validation error
throw new BadRequestException('Invalid input');

// Not found
throw new NotFoundException('Resource not found');

// Forbidden
throw new ForbiddenException('Access denied');

// Internal server error
throw new InternalServerErrorException('Something went wrong');
```

### Error Response Format:
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-23T10:30:45.123Z",
  "path": "/api/v1/endpoint",
  "message": "Invalid input",
  "error": "BadRequestException"
}
```

---

## Testing a New Service

```typescript
describe('NewService', () => {
  let service: NewService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewService,
        { provide: 'Repository', useValue: mockRepository },
      ],
    }).compile();

    service = module.get<NewService>(NewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create something', async () => {
    mockRepository.create.mockResolvedValue({ id: 1, name: 'Test' });

    const result = await service.create({ name: 'Test' });

    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockRepository.create).toHaveBeenCalled();
  });
});
```

---

## API Request Examples

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Create Project (with token)
```bash
curl -X POST http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Proyek Konstruksi A",
    "description": "Deskripsi proyek",
    "location": "Jakarta"
  }'
```

---

## Database Operations

```typescript
// Create
const user = await this.prisma.user.create({
  data: { email: 'user@example.com', ... }
});

// Read
const user = await this.prisma.user.findUnique({
  where: { id: userId }
});

// Update
const user = await this.prisma.user.update({
  where: { id: userId },
  data: { name: 'New Name' }
});

// Delete
await this.prisma.user.delete({
  where: { id: userId }
});

// Query with relations
const project = await this.prisma.project.findUnique({
  where: { id: projectId },
  include: {
    contract: { include: { terms: true } },
    owner: true,
    contractor: true
  }
});
```

---

## Swagger / API Docs

### Access:
```
http://localhost:3001/docs
```

### Decorators:
```typescript
@ApiOperation({ summary: 'Brief description' })
@ApiResponse({ status: 200, description: 'Success response' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 404, description: 'Not found' })
@ApiBearerAuth()  // Indicates endpoint needs JWT
```

---

## Environment Variables

```bash
# Server
PORT=3001
API_PREFIX=api/v1
NODE_ENV=development

# Database
DATABASE_URL=file:./dev.db

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug  # debug, info, warn, error
```

---

## Common Issues & Solutions

### Issue: Port already in use
```bash
# Find process using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>
```

### Issue: Database locked
```bash
npm run db:reset
npm run db:migrate
```

### Issue: Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: JWT authentication failing
- Check `.env` JWT_SECRET is set
- Check token format: `Authorization: Bearer TOKEN`
- Check token is not expired (7 days default)

---

## Performance Tips

1. **Pagination**: Always paginate large datasets
2. **Indexes**: Add database indexes untuk frequently queried fields
3. **Caching**: Cache static data yang jarang berubah
4. **Compression**: Enable GZIP compression
5. **Rate Limiting**: Implement rate limiting untuk production

---

## Security Checklist

- [ ] Change `JWT_SECRET` dari example value
- [ ] Setup HTTPS dalam production
- [ ] Enable CORS untuk domain yang diizinkan
- [ ] Validate all user inputs (sudah included)
- [ ] Hash passwords (sudah dengan bcrypt)
- [ ] Implement rate limiting
- [ ] Setup WAF (Web Application Firewall)
- [ ] Regular security audits

---

## Useful Links

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Swagger UI](http://localhost:3001/docs)
- [Class Validator](https://github.com/typestack/class-validator)
- [Winston Logger](https://github.com/winstonjs/winston)

---

**Keep this reference handy for daily development! 📚**
