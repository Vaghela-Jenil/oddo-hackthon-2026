# Authentication System Documentation

## Overview
Complete JWT-based authentication system with password reset, email notifications, and session management.

## Features
✅ **User Registration (Signup)** - Create account with strict password requirements  
✅ **User Login** - JWT token generation with session tracking  
✅ **Password Reset** - Email-based reset with 1-hour token expiry  
✅ **Session Management** - Track active sessions with revocation capability  
✅ **Role-Based Access** - MANAGER and STAFF roles with authorization middleware  
✅ **Email Notifications** - Welcome email + password reset emails via Nodemailer  
✅ **Strict Password Policy** - Minimum 8 chars, uppercase, lowercase, number, special char  

---

## Password Requirements
Passwords must contain:
- ✓ Minimum 8 characters
- ✓ At least 1 UPPERCASE letter (A-Z)
- ✓ At least 1 lowercase letter (a-z)
- ✓ At least 1 number (0-9)
- ✓ At least 1 special character (!@#$%^&*)

**Example Valid Password**: `MyPassword123!`

---

## Environment Variables
Set these in `.env`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
JWT_SECRET="your_secret_key_min_32_chars"
JWT_EXPIRY="7d"
EMAIL_SERVICE="gmail"
EMAIL_USER="your_email@gmail.com"
EMAIL_APP_PASSWORD="16_digit_app_password"
FRONTEND_URL="http://localhost:3000"
PORT=3000
```

---

## API Endpoints

### 1. **POST** `/api/auth/signup` - Register New User
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyPassword123!",
  "confirmPassword": "MyPassword123!"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "errors": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter"
  ]
}
```

---

### 2. **POST** `/api/auth/login` - Login User
**Request:**
```json
{
  "email": "john@example.com",
  "password": "MyPassword123!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3. **POST** `/api/auth/forgot-password` - Request Password Reset
**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

*Note: Email will contain a reset link like:*
```
http://localhost:3000/reset-password?token=abc123def456...
```

---

### 4. **POST** `/api/auth/reset-password?token=TOKEN` - Reset Password
**Request:**
```json
{
  "newPassword": "NewPassword456@",
  "confirmPassword": "NewPassword456@"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

*Note: All previous sessions are revoked for security*

---

### 5. **GET** `/api/auth/me` - Get Current User *(Protected)*
**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

---

### 6. **POST** `/api/auth/logout` - Logout User *(Protected)*
**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 7. **GET** `/api/auth/verify-email?token=TOKEN` - Verify Reset Token
**Response (Success - 200):**
```json
{
  "success": true,
  "email": "john@example.com"
}
```

---

## Usage Example (cURL/REST Client)

### Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "MyPassword123!",
    "confirmPassword": "MyPassword123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "MyPassword123!"
  }'
```

### Access Protected Route
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Password Reset Request
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

---

## Database Schema

### User Model
```prisma
model User {
  id                Int       @id @default(autoincrement())
  name              String?
  email             String    @unique
  passwordHash      String
  role              Role      @default(STAFF)
  isActive          Boolean   @default(true)
  resetToken        String?   @unique
  resetTokenExpiry  DateTime?
  lastLogin         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  stockMoves        StockMove[]
  sessions          Session[]
}

enum Role {
  MANAGER
  STAFF
}
```

### Session Model
```prisma
model Session {
  id        String    @id @default(cuid())
  token     String    @unique
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  isRevoked Boolean   @default(false)
  createdAt DateTime  @default(now())
}
```

---

## File Structure
```
server/
├── controllers/
│   └── authController.js        # HTTP request handlers
├── services/
│   ├── authService.js           # Business logic
│   └── emailService.js          # Email sending
├── middleware/
│   └── authMiddleware.js        # JWT verification & role auth
├── routes/
│   └── authRoutes.js            # API route definitions
├── utils/
│   └── passwordValidator.js     # Password strength checker
├── prisma/
│   └── schema.prisma            # Database schema
├── config/
│   └── prisma.js                # Prisma client setup
├── .env                         # Environment variables
└── server.js                    # Express app entry
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example env
cp .env.example .env

# Edit .env with your values
# - Database URL
# - JWT secret
# - Gmail App Password
# - Frontend URL
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Create Database & Tables
```bash
npx prisma migrate dev --name init
```

### 5. Start Server
```bash
npm start
```

---

## Security Notes
⚠️ **Important**: 
- Change `JWT_SECRET` in production (use a strong 32+ character key)
- Store `.env` in `.gitignore`
- Use HTTPS in production
- Use Gmail App Passwords (not regular password)
- Sessions are revoked on password reset
- Tokens expire after 7 days (configurable)
- Reset tokens expire after 1 hour

---

## Next.js Integration
When connecting to Next.js:

1. **Store JWT in localStorage**:
```javascript
localStorage.setItem('token', response.token);
```

2. **Add to API requests**:
```javascript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
};
```

3. **Protected pages** - Check token on mount
4. **Logout** - Clear localStorage and make logout API call

---

## Troubleshooting

### Email not sending?
- Verify EMAIL_USER and EMAIL_APP_PASSWORD in .env
- Check Gmail 2FA is enabled
- Generate new App Password from Gmail settings

### "Invalid token" errors?
- Token may be expired (7 days default)
- User may have logged out (token revoked)
- Check JWT_SECRET matches between server and client

### Password strength errors?
- See password requirements above
- Test with: `MyPassword123!`

### Database connection issues?
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run: `npx prisma db push`

---

## Future Enhancements
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Email verification on signup
- [ ] Token refresh mechanism
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for auth events

---
