# 🚀 DEPLOYMENT & TESTING CHECKLIST - AMANTRA Construction

## 📌 CURRENT STATUS

### ✅ Backend Services
- Port: **3001**
- Status: **RUNNING** ✓
- Swagger UI: http://localhost:3001/docs
- Database: SQLite (backend/prisma/dev.db)
- Test Data: Loaded with 4 users (Owner, Contractor, Supervisor, Witness)

### ✅ Frontend Services
- Port: **3000**
- Status: **RUNNING** ✓
- Browser: http://localhost:3000
- Framework: Next.js 14 with React
- State Management: Context API (Auth + App)

---

## 🔐 TEST LOGIN CREDENTIALS

### Demo User Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Owner** | owner@amantra.id | Password123! | Pemberi Kerja (Client) |
| **Contractor** | contractor@amantra.id | Password123! | Kontraktor (Vendor) |
| **Supervisor** | supervisor@amantra.id | Password123! | Pengawas Lapangan |
| **Witness** | witness@amantra.id | Password123! | Saksi Ahli |

### Quick Login (Frontend)
1. Go to http://localhost:3000
2. Click **"Demo Owner"** button (or any role)
3. Should redirect to /dashboard

---

## ✅ VERIFICATION CHECKLIST

### 1. Backend Connection Test
```bash
# Check backend is running
curl http://localhost:3001/api/auth/me
# Expected: 401 (Unauthorized - no token) ✓

# Login test via API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@amantra.id","password":"Password123!"}'
# Expected: 200 with token ✓
```

### 2. Frontend Connection Test
- [ ] Frontend loads at http://localhost:3000
- [ ] Login page visible (email input, password input, submit button)
- [ ] Demo buttons visible (Owner, Contractor, Supervisor, Witness)
- [ ] Form validation working
- [ ] Error toast showing for invalid login

### 3. Authentication Flow Test
- [ ] Click "Demo Owner" button
- [ ] Should show loading state
- [ ] Should redirect to /dashboard
- [ ] Should display "Welcome, Owner" or user name
- [ ] Token stored in localStorage
- [ ] Session persists on refresh

### 4. Dashboard Test (by Role)

#### Owner Dashboard Should Show:
- [ ] "Total Projects" stat
- [ ] "Total Value" stat (in IDR)
- [ ] "Pending Verifications" stat
- [ ] "Ready Payments" stat
- [ ] "Create Project" button
- [ ] Recent projects table
- [ ] View Projects button

#### Contractor Dashboard Should Show:
- [ ] Similar stats
- [ ] "Create Project" button
- [ ] "Upload Progress" button (different from owner)
- [ ] Recent projects table

#### Supervisor Dashboard Should Show:
- [ ] "Review Verifications" button
- [ ] "View Pending Items" button
- [ ] Similar stats but no create buttons

#### Witness Dashboard Should Show:
- [ ] "Final Verification" button
- [ ] "View Pending Items" button
- [ ] Same stats display

### 5. Protected Routes Test
- [ ] Try accessing /projects without logging in
  - Expected: Redirect to /auth/login
- [ ] Try accessing /verifications as Owner
  - Expected: May show different UI than Supervisor
- [ ] Try accessing /audit
  - Expected: Show audit logs

### 6. API Integration Test
- [ ] Open DevTools (F12) → Network tab
- [ ] Go to dashboard
- [ ] Should see API calls:
  - GET /api/projects (to fetch project list)
  - GET /api/payments/ready (to fetch payment stats)
  - Other relevant API calls
- [ ] All requests should include Authorization header with token
- [ ] Responses should be 200 OK (not 401 Unauthorized)

### 7. State Management Test
- [ ] Login and note the user name displayed
- [ ] Refresh page (F5)
- [ ] User should still be logged in (session persisted)
- [ ] Logout button should work
- [ ] After logout, redirect to /auth/login

### 8. Error Handling Test
- [ ] Try login with wrong password
  - Expected: Error toast with message
- [ ] Try login with non-existent email
  - Expected: Error toast with message
- [ ] Check browser console (F12)
  - Expected: No red errors in console

---

## 🎯 MANUAL TESTING SCENARIOS

### Scenario 1: Owner Creates Project
```
1. Login as Owner
2. Click "Create Project" button
3. Fill project form:
   - Name: "Test Project"
   - Description: "Testing"
   - Budget: "100000000"
4. Click Create
5. Verify in recent projects table
```

### Scenario 2: Contractor Uploads Progress
```
1. Login as Contractor
2. Go to Projects → Select a project
3. Click "Upload Progress"
4. Fill progress form:
   - Description: "50% complete"
   - Upload photo (if applicable)
5. Click Submit
6. Verify submission (should show pending verification)
```

### Scenario 3: Supervisor Reviews Progress
```
1. Login as Supervisor
2. Go to Verifications
3. See list of pending verifications
4. Click on one verification
5. Can Approve or Reject
6. Comment (optional)
7. Click Submit
```

### Scenario 4: Owner Confirms Payment
```
1. Login as Owner
2. Go to Payments
3. See "Ready Payments"
4. Click on a ready payment
5. Review payment details
6. Confirm payment
7. Should move to "Paid" status
```

---

## 🔧 TROUBLESHOOTING

### Frontend Not Loading
```bash
# Check if port 3000 is running
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Restart frontend
cd frontend
npm run dev
```

### Backend Not Responding
```bash
# Check if port 3001 is running
netstat -ano | findstr :3001  # Windows
lsof -i :3001                  # Mac/Linux

# Check if seed data is loaded
# Use Swagger UI at http://localhost:3001/docs

# Restart backend
cd backend
npm run start
```

### Login Not Working
1. Check backend is running (http://localhost:3001/docs)
2. Check console for errors (F12 → Console tab)
3. Check Network tab for failed requests
4. Verify email/password are correct
5. Clear localStorage: `localStorage.clear()` in console

### Token Expiry (if implementing JWT expiry)
```tsx
// In AuthContext, when token expires:
// 1. Auto-refresh with refresh token OR
// 2. Redirect to login with message
// 3. Current implementation: No expiry for MVP
```

---

## 📊 API ENDPOINT TESTING (via Swagger)

### Test These Endpoints (in order):

1. **POST /api/auth/login**
   - Input: `{"email":"owner@amantra.id","password":"Password123!"}`
   - Expected: 200 with token

2. **GET /api/auth/me**
   - Header: `Authorization: Bearer {token}`
   - Expected: 200 with user data

3. **GET /api/projects**
   - Header: `Authorization: Bearer {token}`
   - Expected: 200 with projects array

4. **GET /api/payments/ready**
   - Header: `Authorization: Bearer {token}`
   - Expected: 200 with ready payments

5. **GET /api/audit**
   - Header: `Authorization: Bearer {token}`
   - Expected: 200 with audit logs

---

## 🎨 UI/UX VERIFICATION

- [ ] Login page is responsive (test on mobile size)
- [ ] Dashboard is responsive
- [ ] Colors match design (primary: blue, success: green, etc.)
- [ ] Loading spinners show during API calls
- [ ] Toast notifications appear for success/error
- [ ] Status badges are color-coded:
  - Pending: Yellow/Orange
  - Approved: Green
  - Rejected: Red
  - Paid: Green

---

## 📈 PERFORMANCE VERIFICATION

- [ ] Dashboard loads in < 2 seconds
- [ ] No console warnings/errors
- [ ] Network requests are minimal
- [ ] Images (if any) load quickly
- [ ] No memory leaks when navigating pages

---

## 🔒 SECURITY VERIFICATION

- [ ] Token stored in localStorage (secure in production with httpOnly)
- [ ] No sensitive data logged in console
- [ ] Protected routes redirect unauthorized users
- [ ] CORS working correctly (frontend can call backend)
- [ ] API errors don't expose sensitive info

---

## 📝 QUICK START TESTING (5 minutes)

```bash
# 1. Open two terminals

# Terminal 1: Backend
cd backend
npm run start
# Wait for "Server running on port 3001"

# Terminal 2: Frontend
cd frontend
npm run dev
# Wait for "ready - started server on http://localhost:3000"

# 3. Open browser
# Go to http://localhost:3000

# 4. Test login
# Click "Demo Owner" → Should load dashboard

# 5. Open DevTools (F12)
# Go to Network tab
# Refresh page
# Should see API calls with 200 OK responses
# No 401 Unauthorized errors
```

---

## ✨ WHAT WORKS NOW

✅ Backend API (all endpoints)  
✅ Frontend static pages  
✅ Authentication (login/logout)  
✅ State management (Auth Context, App Context)  
✅ API service layer (axios wrapper)  
✅ Protected routes  
✅ Dashboard (with real data)  
✅ Form validation  
✅ Error handling  
✅ Toast notifications  

---

## ⏳ WHAT NEEDS IMPLEMENTATION

📋 Project CRUD pages (create, edit, delete)  
📋 Terms/Contract workflow  
📋 Progress upload modal  
📋 Verification approval workflow  
📋 Payment confirmation modal  
📋 Audit log filtering  
📋 File upload (if needed)  
📋 Pagination in lists  

---

## 🎓 IMPLEMENTATION GUIDE

All template code is available in:  
📄 **docs/FRONTEND-IMPLEMENTATION.md**

Each page template includes:
- React component structure
- TypeScript interfaces
- API integration example
- Form validation
- Error handling
- Role-based rendering

**Estimated time to implement all remaining pages: 4-6 hours**

---

## 📞 SUPPORT LINKS

- Swagger API Docs: http://localhost:3001/docs
- Frontend: http://localhost:3000
- Backend Status: http://localhost:3001/api/auth/me (with token)
- Database: backend/prisma/dev.db

---

**Status: READY FOR TESTING** ✅  
**Last Updated**: 23 January 2026  
**Frontend Port**: 3000  
**Backend Port**: 3001
