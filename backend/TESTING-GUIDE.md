# 🧪 Testing Guide - AMANTRA Backend

## Overview

Backend sudah dilengkapi dengan Jest testing framework dan beberapa contoh test untuk reference.

---

## Setup & Running Tests

### Install Dependencies
Jest sudah termasuk dalam `package.json`

### Run Tests

```bash
# Run all tests once
npm run test

# Run tests dalam watch mode (auto-rerun saat file berubah)
npm run test:watch

# Run specific test file
npm run test -- auth.service.spec.ts

# Run dengan coverage report
npm run test:cov

# Debug mode
npm run test:debug
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
Time:        2.456 s
Coverage:    92% statements, 85% branches, 78% functions, 88% lines
```

---

## Test Structure

### Basic Template
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let dependency: DependencyService;

  // Setup sebelum setiap test
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: DependencyService,
          useValue: { /* mock implementation */ },
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
    dependency = module.get<DependencyService>(DependencyService);
  });

  // Cleanup setelah setiap test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Actual test
  it('should do something', () => {
    const result = service.doSomething();
    expect(result).toBe(expectedValue);
  });
});
```

---

## Existing Test Files

### 1. Auth Service Tests
**File**: `src/auth/auth.service.spec.ts`

**Tests:**
- ✅ Successful login dengan valid credentials
- ✅ Failed login - user not found
- ✅ Failed login - invalid password

**Mocking:**
```typescript
const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  passwordHash: 'hashed_pass',
  // ... other fields
};

(prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
```

### 2. Global Exception Filter Tests
**File**: `src/common/filters/global-exception.filter.spec.ts`

**Tests:**
- ✅ Handle HttpException
- ✅ Handle generic Error
- ✅ Include timestamp in response
- ✅ Handle BadRequestException

### 3. Logger Service Tests
**File**: `src/common/logger/logger.service.spec.ts`

**Tests:**
- ✅ Service instantiation
- ✅ All logging methods exist
- ✅ Methods don't throw errors
- ✅ Different log levels work

### 4. DTOs Validation Tests
**File**: `src/common/dto/validation.spec.ts`

**Tests:**
- ✅ LoginDto validation
- ✅ CreateProjectDto validation
- ✅ CreateTermDto with constraints
- ✅ Invalid data rejection

---

## Writing Unit Tests

### Example: Testing a Service

```typescript
describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(ProjectsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const input = {
        name: 'Project A',
        description: 'Description',
        ownerId: 'user-1',
      };

      const expected = {
        id: 'project-1',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(expected);

      const result = await service.create(input);

      expect(result).toEqual(expected);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it('should handle database errors', async () => {
      const input = { name: 'Project A', ownerId: 'user-1' };

      (prisma.project.create as jest.Mock)
        .mockRejectedValue(new Error('Database error'));

      await expect(service.create(input))
        .rejects.toThrow('Database error');
    });
  });
});
```

### Example: Testing a Controller

```typescript
describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ProjectsController);
    service = module.get(ProjectsService);
  });

  it('should create a project', async () => {
    const dto = { name: 'Project A' };
    const mockUser = { sub: 'user-1', email: 'user@example.com' };
    const expected = { id: 'project-1', ...dto };

    (service.create as jest.Mock).mockResolvedValue(expected);

    const result = await controller.create(dto, { user: mockUser });

    expect(result).toEqual(expected);
    expect(service.create).toHaveBeenCalledWith(dto, mockUser);
  });
});
```

### Example: Testing DTOs

```typescript
describe('CreateProjectDto', () => {
  it('should pass validation with correct data', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      name: 'Valid Project Name',
      description: 'Valid description',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with missing required fields', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      description: 'Only description',
      // Missing name
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });
});
```

---

## Mocking & Fixtures

### Mock Services
```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  project: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};
```

### Mock JWT
```typescript
const mockJwtService = {
  sign: jest.fn().mockReturnValue('jwt-token-123'),
  verify: jest.fn().mockReturnValue({ sub: 'user-id' }),
};
```

### Mock Request/Response
```typescript
const mockRequest = {
  user: { sub: 'user-1', email: 'user@example.com', role: 'OWNER' },
  headers: { authorization: 'Bearer token' },
  method: 'POST',
  url: '/api/v1/projects',
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  send: jest.fn(),
};
```

---

## Test Assertions

### Basic Assertions
```typescript
// Equality
expect(result).toBe(5);                      // Exact match
expect(result).toEqual({ id: 1 });          // Deep equality
expect(result).toStrictEqual({ id: 1 });    // Strict equality

// Truthiness
expect(result).toBeTruthy();
expect(result).toBeFalsy();
expect(result).toBeNull();
expect(result).toBeUndefined();
expect(result).toBeDefined();

// Numbers
expect(result).toBeGreaterThan(5);
expect(result).toBeGreaterThanOrEqual(5);
expect(result).toBeLessThan(5);
expect(result).toBeLessThanOrEqual(5);
expect(result).toBeCloseTo(3.14159, 2);     // 2 decimals

// Strings
expect(result).toMatch(/pattern/);
expect(result).toContain('substring');

// Arrays
expect(result).toHaveLength(3);
expect(result).toContain('item');
expect(result).toEqual(expect.arrayContaining(['item']));

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveReturnedWith('value');

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(promise).rejects.toThrow();
expect(promise).resolves.toBe('value');
```

---

## Testing Async Code

### Using async/await
```typescript
it('should fetch user', async () => {
  const mockUser = { id: 1, name: 'John' };
  (prisma.user.findUnique as jest.Mock)
    .mockResolvedValue(mockUser);

  const result = await service.getUser(1);

  expect(result).toEqual(mockUser);
});
```

### Using Promises
```typescript
it('should fetch user', () => {
  return service.getUser(1).then(result => {
    expect(result).toEqual(mockUser);
  });
});
```

### Testing Promise Rejection
```typescript
it('should reject on error', async () => {
  (prisma.user.findUnique as jest.Mock)
    .mockRejectedValue(new Error('Not found'));

  await expect(service.getUser(1))
    .rejects.toThrow('Not found');
});
```

---

## Coverage Reports

### Generate Coverage
```bash
npm run test:cov
```

### Coverage Output
```
File                    | % Stmts | % Branch | % Funcs | % Lines |
All files              |   92.5  |   85.2   |   88.9  |   91.8  |
 src/auth/              |   95.2  |   90.1   |   92.3  |   94.5  |
  auth.service.ts      |   98.5  |   95.0  |   96.0  |   97.5  |
  auth.controller.ts   |   92.1  |   85.2  |   89.0  |   91.3  |
```

### Coverage HTML Report
```bash
# Report generated in: coverage/index.html
open coverage/index.html
```

---

## Best Practices

### ✅ DO:
- Use descriptive test names: `should throw error when email is invalid`
- Test one thing per test
- Use `beforeEach` untuk setup common test data
- Mock external dependencies
- Test both success dan error cases
- Keep tests isolated and independent

### ❌ DON'T:
- Test implementation details, test behavior
- Create long tests with many assertions
- Share state between tests
- Skip cleanup in `afterEach`
- Mock things you don't need to mock
- Ignore test failures

---

## Common Test Patterns

### Happy Path & Error Cases
```typescript
describe('getUserById', () => {
  // Happy path
  it('should return user when found', async () => {
    // ... test code
  });

  // Error cases
  it('should throw NotFoundException when user not found', async () => {
    // ... test code
  });

  it('should throw error on database failure', async () => {
    // ... test code
  });
});
```

### Input Validation
```typescript
describe('validation', () => {
  it('should accept valid input', () => { /* ... */ });
  it('should reject null input', () => { /* ... */ });
  it('should reject empty input', () => { /* ... */ });
  it('should reject invalid format', () => { /* ... */ });
});
```

### Authorization
```typescript
describe('authorization', () => {
  it('should allow owner to access', () => { /* ... */ });
  it('should deny non-owner access', () => { /* ... */ });
  it('should deny unauthenticated access', () => { /* ... */ });
});
```

---

## Debugging Tests

### Run Single Test
```bash
npm run test -- auth.service.spec.ts
```

### Run Tests Matching Pattern
```bash
npm run test -- --testNamePattern="should login"
```

### Debug Mode
```bash
npm run test:debug
# Then open chrome://inspect in Chrome
```

### Console Logging in Tests
```typescript
it('should do something', () => {
  console.log('Debug info:', someVariable);
  expect(result).toBe(expected);
});
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest CLI Options](https://jestjs.io/docs/cli)
- [Class Validator Testing](https://github.com/typestack/class-validator#usage)

---

**Happy Testing! 🚀**
