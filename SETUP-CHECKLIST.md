# ✅ Setup Checklist - AMANTRA Backend

Gunakan checklist ini untuk memastikan setup lengkap dan benar.

---

## 📋 Pre-Setup Checklist

### Requirements
- [ ] Node.js v18+ installed
- [ ] npm v9+ installed  
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Terminal/command line access

**Check Versions:**
```bash
node --version      # Should be v18+
npm --version       # Should be v9+
git --version       # Should be v2.40+
```

---

## 🔧 Installation Checklist

### Step 1: Clone & Navigate
```bash
# Navigate to project
cd amantra-construction/backend

# Check you're in right directory
pwd  # Should end with /backend
```

- [ ] Project cloned/navigated
- [ ] Terminal in `/backend` directory
- [ ] `package.json` visible (`ls package.json`)

### Step 2: Install Dependencies
```bash
npm install
```

- [ ] npm install completed without errors
- [ ] `node_modules` folder created
- [ ] `package-lock.json` generated

### Step 3: Setup Environment
```bash
cp .env.example .env
# Edit .env file with your settings
```

- [ ] `.env` file created
- [ ] `DATABASE_URL` set correctly
- [ ] `JWT_SECRET` changed from default
- [ ] `PORT` configured (default 3001)
- [ ] `LOG_LEVEL` set (default debug)

### Step 4: Database Setup
```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Optional: seed sample data
```

- [ ] Prisma client generated
- [ ] Database migrations completed
- [ ] Database file/connection working
- [ ] Tables created (verify with db:studio)

---

## ✨ New Features Checklist

### DTOs & Validation
```bash
# Verify DTO files exist
ls src/auth/dto/
ls src/projects/dto/
ls src/terms/dto/
ls src/progress/dto/
ls src/verifications/dto/
ls src/payments/dto/
```

- [ ] auth/dto/login.dto.ts exists
- [ ] auth/dto/register.dto.ts exists
- [ ] projects/dto/create-project.dto.ts exists
- [ ] projects/dto/create-contract.dto.ts exists
- [ ] terms/dto/create-term.dto.ts exists
- [ ] progress/dto/create-progress.dto.ts exists
- [ ] verifications/dto/create-verification.dto.ts exists
- [ ] payments/dto/create-payment.dto.ts exists

### Infrastructure Files
```bash
# Verify infrastructure files
ls src/common/filters/
ls src/common/interceptors/
ls src/common/logger/
ls src/common/common.module.ts
```

- [ ] global-exception.filter.ts exists
- [ ] logging.interceptor.ts exists
- [ ] logger.service.ts exists
- [ ] common.module.ts exists

### Test Files
```bash
# Verify test files
ls src/**/*.spec.ts
```

- [ ] auth.service.spec.ts exists
- [ ] global-exception.filter.spec.ts exists
- [ ] logger.service.spec.ts exists
- [ ] validation.spec.ts exists

### Documentation Files
```bash
# Verify documentation
ls TECHNICAL-SETUP.md
ls QUICK-REFERENCE.md
ls TESTING-GUIDE.md
ls ARCHITECTURE.md
```

- [ ] TECHNICAL-SETUP.md exists
- [ ] QUICK-REFERENCE.md exists
- [ ] TESTING-GUIDE.md exists
- [ ] ARCHITECTURE.md exists

---

## 🚀 Build & Run Checklist

### Build Backend
```bash
npm run build
```

- [ ] Build completed without errors
- [ ] `dist` folder created
- [ ] Compiled JS files generated

### Start Development Server
```bash
npm run start:dev
```

- [ ] Server started successfully
- [ ] Logs show "🏗️  AMANTRA Construction API Server started"
- [ ] Listening on correct port (default 3001)
- [ ] No red error messages

### Check Server Health

**Terminal Output Should Show:**
```
2024-01-23 10:30:45 [info]: 🏗️  AMANTRA Construction API Server started on port 3001
2024-01-23 10:30:45 [info]: 📚 Swagger Docs available at http://localhost:3001/docs
```

- [ ] Server running message appears
- [ ] Port correct (default 3001)
- [ ] Logs being written

### Access API
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token"
```

- [ ] API responds (should get 401 Unauthorized with proper error format)
- [ ] Response is JSON format
- [ ] Response includes statusCode, timestamp, message

### Access Swagger Docs
Open browser to: `http://localhost:3001/docs`

- [ ] Swagger UI loads
- [ ] All endpoints visible
- [ ] Can scroll through API documentation
- [ ] Login endpoint visible
- [ ] Projects endpoints visible
- [ ] Terms endpoints visible

---

## 🧪 Testing Checklist

### Run All Tests
```bash
npm run test
```

- [ ] Tests run without hanging
- [ ] Test output shows passing/failing
- [ ] No errors in test execution
- [ ] Coverage report generated

### Expected Test Output
```
Test Suites: 4 passed, 4 total
Tests:       16+ passed, 16+ total
Coverage:    80%+ statements, 75%+ branches
```

- [ ] At least 3+ test suites pass
- [ ] At least 12+ test cases pass
- [ ] Coverage above 75%

### Run Tests in Watch Mode
```bash
npm run test:watch
```

- [ ] Tests re-run when files change
- [ ] Watch mode starts without errors
- [ ] Press 'q' to quit watch mode

### Generate Coverage Report
```bash
npm run test:cov
```

- [ ] Coverage report generated
- [ ] `coverage` folder created
- [ ] Can open `coverage/index.html` in browser

---

## 📝 Validation Testing Checklist

### Test Invalid Login (Terminal)
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "123"}'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-23T10:30:45.123Z",
  "path": "/api/v1/auth/login",
  "message": [
    "Email harus valid",
    "Password minimal 6 karakter"
  ]
}
```

- [ ] Returns 400 status code
- [ ] Includes validation error messages
- [ ] Error messages in Indonesian
- [ ] Response format consistent

### Test Valid Input (Terminal)
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "valid@example.com", "password": "password123"}'
```

- [ ] Request accepted (either 200 or 401 from server)
- [ ] Not rejected by validation
- [ ] Response is proper JSON

---

## 📊 Logging Checklist

### Check Console Logs
During `npm run start:dev`, check terminal for:

```
2024-01-23 10:30:45 [info]: Message here
```

- [ ] Logs appear in terminal with timestamps
- [ ] Logs are color-coded
- [ ] Info messages appear (not just errors)

### Check Log Files
```bash
ls logs/
```

- [ ] `logs` folder exists
- [ ] `application-YYYY-MM-DD.log` file exists
- [ ] `error-YYYY-MM-DD.log` file exists

### View Log Content
```bash
tail -f logs/application-*.log    # View live logs
head -20 logs/application-*.log   # View first 20 lines
```

- [ ] Log files contain JSON formatted logs
- [ ] Each log has timestamp
- [ ] Each log has level (info, error, warn, etc)

### Test Error Logging
Try to trigger an error (e.g., invalid endpoint):
```bash
curl http://localhost:3001/api/v1/nonexistent
```

Check logs:
```bash
tail logs/error-*.log
```

- [ ] Error logged in error log file
- [ ] Error has full details (path, timestamp, status)
- [ ] Stack trace captured (if applicable)

---

## 🔒 Security Checklist

### JWT Configuration
- [ ] JWT_SECRET in .env is not empty
- [ ] JWT_SECRET is not 'your_secret_key' (default)
- [ ] JWT_EXPIRATION is set (e.g., 7d)

### CORS Configuration
- [ ] CORS_ORIGIN matches frontend URL
- [ ] CORS_CREDENTIALS properly set
- [ ] Check .env for CORS settings

### Environment Variables
- [ ] No sensitive data in .env is hardcoded
- [ ] .env file is in .gitignore
- [ ] .env.example has masked values

### Password Security
- [ ] Bcrypt is being used for passwords
- [ ] Plaintext passwords never logged

---

## 📚 Documentation Checklist

### Read Documentation
- [ ] Read QUICK-REFERENCE.md (15 min)
- [ ] Read TECHNICAL-SETUP.md (40 min)
- [ ] Understood how DTOs work
- [ ] Understood error handling
- [ ] Understood logging setup

### Verify Code Examples
- [ ] Try examples from QUICK-REFERENCE.md
- [ ] Can create a simple DTO
- [ ] Can add a logger call
- [ ] Understand error handling pattern

---

## 🔍 Verification Checklist

### File Structure
```bash
tree -L 2 src/
```

Verify structure matches expected layout:

- [ ] src/auth/ has auth files
- [ ] src/projects/ has project files
- [ ] src/common/ has filter, interceptor, logger
- [ ] src/terms/ has term files
- [ ] src/progress/ has progress files
- [ ] src/verifications/ has verification files
- [ ] src/payments/ has payment files

### Database Connection
```bash
npm run db:studio
```

- [ ] Prisma Studio opens in browser
- [ ] Can see User, Project, Contract tables
- [ ] Can see Term, Progress, Verification tables
- [ ] Can see Payment, AuditLog tables

### API Endpoints
Access Swagger at: `http://localhost:3001/docs`

- [ ] Can see Auth endpoints
- [ ] Can see Projects endpoints
- [ ] Can see Terms endpoints
- [ ] Can see Progress endpoints
- [ ] Can see Verifications endpoints
- [ ] Can see Payments endpoints

---

## 🎯 Final Verification

### Server Restart
```bash
# Stop current server (Ctrl+C)
# Start again
npm run start:dev
```

- [ ] Server starts fresh without errors
- [ ] Logs appear correctly
- [ ] API responds to requests
- [ ] Swagger docs load

### Quick API Test
```bash
# Test invalid request
curl http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return 400 with validation errors
```

- [ ] Response has proper format
- [ ] Status code is correct
- [ ] Error messages are present

### Test Execution
```bash
npm run test
```

- [ ] All tests pass (or mostly pass)
- [ ] No hanging tests
- [ ] Coverage is reasonable

---

## ✅ Setup Complete!

Once all checkboxes are checked:

```bash
# You're ready to develop! 🎉
npm run start:dev
```

Open: `http://localhost:3001/docs` to see your API

---

## 🆘 Troubleshooting

### Server Won't Start
```bash
# Kill process on port 3001
lsof -i :3001          # Find process
kill -9 <PID>          # Kill it

# Try again
npm run start:dev
```

### Database Errors
```bash
# Reset database
npm run db:reset

# Migrate again
npm run db:migrate
```

### Tests Won't Run
```bash
# Clear Jest cache
npm run test -- --clearCache

# Try again
npm run test
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=3002  # Use different port

# Or kill existing process
npx kill-port 3001
```

---

## 📞 Need Help?

1. Check [QUICK-REFERENCE.md](backend/QUICK-REFERENCE.md) for common issues
2. Check [TECHNICAL-SETUP.md](backend/TECHNICAL-SETUP.md) for detailed setup
3. Review [TESTING-GUIDE.md](backend/TESTING-GUIDE.md) for test issues
4. Check terminal logs for specific errors

---

**Setup Date**: _____________  
**Completed By**: _____________  
**Status**: ✅ Ready for Development  

---

🚀 **Happy Developing!**
