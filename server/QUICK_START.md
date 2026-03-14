# 🚀 Quick Start Guide - Authentication System

## Step 1: Install Dependencies
```bash
npm install
```

**Packages Installed:**
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `nodemailer` - Email sending
- `validator` - Input validation

---

## Step 2: Configure Environment Variables
Edit `.env` file in the server folder:

```env
DATABASE_URL="postgresql://postgres:336699@localhost:5432/coreinventory"

# JWT Configuration
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production_min_32_chars"
JWT_EXPIRY="7d"

# Email Configuration (Gmail with App Password)
EMAIL_SERVICE="gmail"
EMAIL_USER="your_email@gmail.com"
EMAIL_APP_PASSWORD="your_16_digit_app_password"

# Frontend URL (for password reset links)
FRONTEND_URL="http://localhost:3000"

PORT=3000
```

### Getting Gmail App Password:
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-Factor Authentication first
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password to `EMAIL_APP_PASSWORD`

---

## Step 3: Generate Prisma Client
```bash
npx prisma generate
```

---

## Step 4: Run Database Migration
```bash
npx prisma migrate dev --name add_auth_and_sessions
```

This creates the `User` and `Session` tables in your PostgreSQL database.

---

## Step 5: Start the Server
```bash
npm start
```

You should see:
```
🚀 Running on http://localhost:3000
```

---

## Test the API

### 1. Test Database Connection
```bash
curl http://localhost:3000
```

Expected: `🚀 Server and Database Connected!`

---

### 2. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "STAFF"
  }
}
```

---

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

Expected Response - You'll get a **JWT TOKEN**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "STAFF"
  }
}
```

---

### 4. Access Protected Route
Copy the token from login response and use it:

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 📁 New Files Created

```
server/
├── controllers/authController.js       # Auth request handlers
├── services/authService.js             # Auth business logic
├── services/emailService.js            # Email sending
├── middleware/authMiddleware.js        # JWT verification
├── routes/authRoutes.js                # Auth endpoints
├── utils/passwordValidator.js          # Password strength checker
├── AUTH_DOCUMENTATION.md               # Full documentation
└── QUICK_START.md                      # This file
```

---

## ✨ API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Create new account |
| POST | `/api/auth/login` | No | Login & get JWT |
| POST | `/api/auth/logout` | ✓ | Logout user |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password?token=TOKEN` | No | Reset password |
| GET | `/api/auth/me` | ✓ | Get current user |
| GET | `/api/auth/verify-email?token=TOKEN` | No | Verify reset token |

---

## 🔐 Password Requirements

Your password must include:
- ✓ At least 8 characters
- ✓ 1 UPPERCASE letter (A-Z)
- ✓ 1 lowercase letter (a-z)
- ✓ 1 number (0-9)
- ✓ 1 special character (!@#$%^&*)

### Valid Examples:
- `MyPassword123!`
- `Secure@Pass789`
- `Test#123Abc`

### Invalid Examples:
- `password123` (no uppercase, no special char)
- `PASSWORD!` (no lowercase, no number)
- `Pass1@` (too short)

---

## 🐛 Troubleshooting

### "Invalid email or password" on login?
- Make sure you registered first
- Check your email and password match exactly
- Passwords are case-sensitive

### Email not sending?
- Verify EMAIL_USER and EMAIL_APP_PASSWORD in .env
- Gmail App Password should be 16 characters
- Check Gmail 2FA is enabled

### Database connection error?
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env
- Try: `psql -U postgres -d coreinventory`

### Prisma migration fails?
```bash
# Reset database (⚠️ warns data)
npx prisma migrate reset
```

---

## 🔗 Next.js Integration (Later)

When you connect to Next.js, store the token:

```javascript
// After login
localStorage.setItem('token', response.token);

// For API calls
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
};
```

---

## 📚 Full Documentation
See `AUTH_DOCUMENTATION.md` for complete API reference and examples.

---

## ✅ You're All Set!
Your authentication system is ready. Run these commands to start:

```bash
npm install
npx prisma migrate dev --name add_auth_and_sessions
npm start
```

Then test by going to: `http://localhost:3000`

**Happy coding! 🎉**
