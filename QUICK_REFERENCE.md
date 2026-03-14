# 🚀 Quick Reference Guide

## Quick Start (Copy & Paste)

### Step 1: Navigate to Server
```bash
cd c:\Users\jenil\Documents\Odoo-hachthon-2026\Odoo-IUHackathon-26\server
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Generate Prisma & Create Database
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Step 4: Start Server
```bash
npm start
```

Expected: `🚀 Running on http://localhost:3000`

---

## 📋 File Locations

### Controllers (8 files)
- `controllers/authController.js`
- `controllers/productController.js`
- `controllers/receiptController.js`
- `controllers/deliveryController.js`
- `controllers/transferController.js`
- `controllers/adjustmentController.js`
- `controllers/stockMoveController.js`
- `controllers/dashboardController.js`

### Services (8 files)
- `services/authService.js`
- `services/emailService.js`
- `services/productService.js`
- `services/receiptService.js`
- `services/deliveryService.js`
- `services/transferService.js`
- `services/adjustmentService.js`
- `services/stockMoveService.js`
- `services/dashboardService.js`

### Routes (8 files)
- `routes/authRoutes.js`
- `routes/productRoutes.js`
- `routes/receiptRoutes.js`
- `routes/deliveryRoutes.js`
- `routes/transferRoutes.js`
- `routes/adjustmentRoutes.js`
- `routes/stockMoveRoutes.js`
- `routes/dashboardRoutes.js`

---

## 🔑 API Endpoints at a Glance

### Auth (7 endpoints)
```
POST   /api/auth/signup                    - Register
POST   /api/auth/login                     - Login
POST   /api/auth/forgot-password           - Request OTP
POST   /api/auth/verify-otp                - Verify OTP
POST   /api/auth/reset-password            - Reset password
GET    /api/auth/me                        - Get current user
POST   /api/auth/logout                    - Logout
```

### Products (3 endpoints)
```
GET    /api/products                       - List products
POST   /api/products                       - Create product (Manager)
GET    /api/products/:id/stock             - Get stock by location
```

### Receipts (3 endpoints)
```
GET    /api/receipts                       - List receipts
POST   /api/receipts                       - Create receipt
PUT    /api/receipts/:id/validate          - Validate (increase stock)
```

### Deliveries (3 endpoints)
```
GET    /api/deliveries                     - List deliveries
POST   /api/deliveries                     - Create delivery
PUT    /api/deliveries/:id/validate        - Validate (decrease stock)
```

### Transfers (2 endpoints)
```
POST   /api/transfers                      - Create transfer
PUT    /api/transfers/:id/validate         - Execute (atomic swap)
```

### Adjustments (1 endpoint)
```
POST   /api/adjustments/:id/validate       - Apply adjustment (Manager)
```

### Stock Moves (1 endpoint)
```
GET    /api/stock/moves                    - Get ledger with filters
```

### Dashboard (1 endpoint)
```
GET    /api/dashboard/kpis                 - Get KPIs
```

---

## 🧪 Test Requests

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@test.com",
    "password": "Test123!@",
    "confirmPassword": "Test123!@"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "Test123!@"
  }'
```

### 3. Get Products (replace TOKEN with actual JWT)
```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer TOKEN"
```

### 4. Get Dashboard
```bash
curl -X GET http://localhost:3000/api/dashboard/kpis \
  -H "Authorization: Bearer TOKEN"
```

---

## 🛠️ Common Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# View database
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Start server
npm start

# Format code
npx prettier --write .
```

---

## 📊 Database Models (12 Total)

✅ User - Authentication
✅ Warehouse - Storage facility
✅ Location - Warehouse sections
✅ Product - Items to track
✅ Category - Product grouping
✅ StockBalance - Current stock levels
✅ StockMove - Audit trail
✅ Receipt - Inbound documents
✅ ReceiptLine - Receipt items
✅ DeliveryOrder - Outbound documents
✅ DeliveryLine - Delivery items
✅ Transfer - Internal movement
✅ TransferLine - Transfer items
✅ Adjustment - Stock corrections
✅ AdjustmentLine - Adjustment items
✅ ReorderRule - Reorder levels

---

## 🔒 Authentication Roles

### STAFF (Default)
- View products
- View stock
- Create/read receipts and deliveries
- Create transfers
- View stock moves
- View dashboard

### MANAGER
- All STAFF permissions
- Create products
- Create/manage categories
- Apply stock adjustments
- Manage warehouses

---

## 📝 Environment Variables (.env)

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/inventory"
JWT_SECRET="your_32_char_secret_key_here"
JWT_EXPIRY="7d"
EMAIL_SERVICE="gmail"
EMAIL_USER="your_email@gmail.com"
EMAIL_APP_PASSWORD="your_16_digit_app_password"
FRONTEND_URL="http://localhost:3000"
PORT=3000
```

---

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is in use: `netstat -ano | findstr :3000`
- Kill process: `taskkill /F /IM node.exe`

### Database connection error
- PostgreSQL running? `psql -U postgres`
- Database exists? `CREATE DATABASE inventory;`
- DATABASE_URL correct? Check .env

### Migration fails
- Reset: `npx prisma migrate reset`
- Clean state: `npx prisma db push`

### JWT error
- Generate strong secret (32+ chars)
- Update JWT_SECRET in .env

### Email not sending
- Gmail 2FA enabled?
- App password created?
- EMAIL_APP_PASSWORD correct?

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| API_DOCUMENTATION.md | Complete API reference |
| SETUP_GUIDE.md | Setup & deployment |
| IMPLEMENTATION_SUMMARY.md | What's implemented |
| QUICK_REFERENCE.md | This file |

---

## ✅ Checklist Before Going Live

- [ ] Database created and migrations run
- [ ] .env configured with production values
- [ ] JWT_SECRET set to strong random value
- [ ] Email configured and tested
- [ ] FRONTEND_URL updated
- [ ] PORT configured
- [ ] All dependencies installed
- [ ] Server starts without errors
- [ ] Test endpoints working
- [ ] CORS configured properly
- [ ] Error logging setup
- [ ] Backups scheduled

---

## 🎯 Next Steps

1. **Test Endpoints** → See API_DOCUMENTATION.md
2. **Connect Frontend** → Link Next.js app to these APIs
3. **Deploy** → Push to production environment
4. **Monitor** → Set up logging and monitoring
5. **Scale** → Add caching, CDN, load balancing

---

## 💡 Pro Tips

1. **Use Postman** for testing APIs
2. **Save JWT token** for multiple requests
3. **Check logs** for debugging
4. **Use pagination** to avoid large responses
5. **Test error cases** before production
6. **Monitor database** queries for performance
7. **Backup database** regularly
8. **Update dependencies** regularly

---

## 📞 Support

- **Prisma Docs**: https://www.prisma.io/docs/
- **Express Docs**: https://expressjs.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **JWT Info**: https://jwt.io/

---

## ✨ You're All Set!

Everything is implemented and ready to go. Start the server and enjoy! 🚀

```bash
npm start
```

Happy coding! 💻
