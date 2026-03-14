# 📚 Complete API Documentation

## Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication Endpoints

### 1. **POST** `/api/auth/signup` - Register New User
**Status:** PUBLIC
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyPassword123!",
  "confirmPassword": "MyPassword123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

---

### 2. **POST** `/api/auth/login` - Login User
**Status:** PUBLIC
**Request:**
```json
{
  "email": "john@example.com",
  "password": "MyPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

---

### 3. **POST** `/api/auth/forgot-password` - Request Password Reset
**Status:** PUBLIC
**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

---

### 4. **POST** `/api/auth/verify-otp` - Verify OTP
**Status:** PUBLIC
**Request:**
```json
{
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "email": "john@example.com"
}
```

---

### 5. **POST** `/api/auth/reset-password` - Reset Password
**Status:** PUBLIC
**Request:**
```json
{
  "otp": "123456",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 6. **GET** `/api/auth/me` - Get Current User
**Status:** PROTECTED (JWT)
**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

---

### 7. **POST** `/api/auth/logout` - Logout User
**Status:** PROTECTED (JWT)
**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful. Token is now invalid."
}
```

---

## 📦 Product Endpoints

### 8. **GET** `/api/products` - List Products
**Status:** PROTECTED (JWT)
**Query Params:**
- `search` - Search by name or SKU
- `categoryId` - Filter by category
- `isActive` - Filter by active status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Example:**
```
GET /api/products?search=laptop&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Laptop",
      "sku": "LAP-001",
      "categoryId": "uuid",
      "unitOfMeasure": "pcs",
      "lowStockQty": 5,
      "imageUrl": "...",
      "isActive": true,
      "createdAt": "2026-03-14T...",
      "stockBalances": [
        {
          "id": "uuid",
          "quantity": "50.00",
          "location": {
            "id": "uuid",
            "name": "Warehouse A - Shelf 1"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 9. **POST** `/api/products` - Create Product
**Status:** PROTECTED (JWT, MANAGER only)
**Request:**
```json
{
  "name": "Laptop",
  "sku": "LAP-001",
  "categoryId": "uuid",
  "unitOfMeasure": "pcs",
  "lowStockQty": 5,
  "imageUrl": "https://..."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "name": "Laptop",
    "sku": "LAP-001",
    "categoryId": "uuid",
    "unitOfMeasure": "pcs",
    "lowStockQty": 5,
    "imageUrl": "https://...",
    "isActive": true,
    "createdAt": "2026-03-14T...",
    "category": {
      "id": "uuid",
      "name": "Electronics"
    }
  }
}
```

---

### 10. **GET** `/api/products/:id/stock` - Get Product Stock by Location
**Status:** PROTECTED (JWT)
**Example:**
```
GET /api/products/uuid/stock
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "Laptop",
      "sku": "LAP-001",
      "stockBalances": [
        {
          "id": "uuid",
          "quantity": "30.00",
          "location": {
            "id": "uuid",
            "name": "Warehouse A - Shelf 1",
            "warehouse": {
              "id": "uuid",
              "name": "Main Warehouse"
            }
          }
        },
        {
          "id": "uuid",
          "quantity": "20.00",
          "location": {
            "id": "uuid",
            "name": "Warehouse B - Shelf 2",
            "warehouse": {
              "id": "uuid",
              "name": "Branch Warehouse"
            }
          }
        }
      ]
    },
    "stockByLocation": [...],
    "totalStock": "50.00"
  }
}
```

---

## 📥 Receipt Endpoints (Inbound Stock)

### 11. **GET** `/api/receipts` - List Receipts
**Status:** PROTECTED (JWT)
**Query Params:**
- `status` - DRAFT, WAITING, READY, DONE, CANCELED
- `warehouseId` - Filter by warehouse
- `page` - Page number
- `limit` - Items per page

**Example:**
```
GET /api/receipts?status=DRAFT&page=1
```

---

### 12. **POST** `/api/receipts` - Create Receipt
**Status:** PROTECTED (JWT)
**Request:**
```json
{
  "supplierId": "SUP-001",
  "warehouseId": "uuid",
  "scheduledDate": "2026-03-20T10:00:00Z",
  "lines": [
    {
      "productId": "uuid",
      "locationId": "uuid",
      "expectedQty": 100
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Receipt created successfully",
  "data": {
    "id": "uuid",
    "refNo": "REC-001",
    "supplierId": "SUP-001",
    "warehouseId": "uuid",
    "status": "DRAFT",
    "scheduledDate": "2026-03-20T10:00:00Z",
    "lines": [
      {
        "id": "uuid",
        "productId": "uuid",
        "locationId": "uuid",
        "expectedQty": "100.00",
        "receivedQty": "0.00",
        "product": { "id": "uuid", "name": "Laptop", "sku": "LAP-001" },
        "location": { "id": "uuid", "name": "Shelf 1" }
      }
    ],
    "createdAt": "2026-03-14T..."
  }
}
```

---

### 13. **PUT** `/api/receipts/:id/validate` - Validate Receipt (Atomically Increase Stock)
**Status:** PROTECTED (JWT)
**Example:**
```
PUT /api/receipts/uuid/validate
```

**Response (200):**
```json
{
  "success": true,
  "message": "Receipt validated successfully",
  "data": {
    "id": "uuid",
    "status": "READY",
    "refNo": "REC-001"
  }
}
```

---

## 📤 Delivery Endpoints (Outbound Stock)

### 14. **GET** `/api/deliveries` - List Deliveries
**Status:** PROTECTED (JWT)
**Query Params:** Similar to receipts

---

### 15. **POST** `/api/deliveries` - Create Delivery
**Status:** PROTECTED (JWT)
**Request:**
```json
{
  "customerId": "CUST-001",
  "warehouseId": "uuid",
  "scheduledDate": "2026-03-20T10:00:00Z",
  "lines": [
    {
      "productId": "uuid",
      "locationId": "uuid",
      "requestedQty": 50
    }
  ]
}
```

---

### 16. **PUT** `/api/deliveries/:id/validate` - Validate Delivery (Atomically Decrease Stock)
**Status:** PROTECTED (JWT)
**Example:**
```
PUT /api/deliveries/uuid/validate
```

---

## 🔄 Transfer Endpoints (Internal Stock Movement)

### 17. **POST** `/api/transfers` - Create Transfer
**Status:** PROTECTED (JWT)
**Request:**
```json
{
  "fromLocationId": "uuid",
  "toLocationId": "uuid",
  "lines": [
    {
      "productId": "uuid",
      "qty": 25
    }
  ]
}
```

---

### 18. **PUT** `/api/transfers/:id/validate` - Execute Transfer (Atomic Swap)
**Status:** PROTECTED (JWT)
**Example:**
```
PUT /api/transfers/uuid/validate
```

---

## 🔧 Adjustment Endpoints (Stock Corrections)

### 19. **POST** `/api/adjustments/:id/validate` - Apply Adjustment
**Status:** PROTECTED (JWT, MANAGER only)
**Example:**
```
POST /api/adjustments/uuid/validate
```

---

## 📊 Stock Move Endpoints (Ledger)

### 20. **GET** `/api/stock/moves` - Get Stock Move History
**Status:** PROTECTED (JWT)
**Query Params:**
- `productId` - Filter by product
- `locationId` - Filter by location
- `type` - RECEIPT, DELIVERY, TRANSFER, ADJUSTMENT
- `startDate` - From date (ISO format)
- `endDate` - To date (ISO format)
- `page` - Page number
- `limit` - Items per page

**Example:**
```
GET /api/stock/moves?type=RECEIPT&startDate=2026-01-01&page=1&limit=50
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "qty": "100.00",
      "type": "RECEIPT",
      "toLocationId": "uuid",
      "referenceId": "receipt-uuid",
      "refType": "receipt",
      "note": null,
      "createdBy": "user-uuid",
      "createdAt": "2026-03-14T...",
      "product": { "name": "Laptop", "sku": "LAP-001" },
      "toLocation": {
        "name": "Shelf 1",
        "warehouse": { "name": "Main Warehouse" }
      }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 150, "pages": 3 }
}
```

---

## 📈 Dashboard Endpoints

### 21. **GET** `/api/dashboard/kpis` - Get Dashboard KPIs
**Status:** PROTECTED (JWT)
**Query Params:**
- `warehouseId` - Optional, filter by warehouse

**Example:**
```
GET /api/dashboard/kpis?warehouseId=uuid
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "receipts": {
      "byStatus": {
        "DRAFT": 12,
        "READY": 8,
        "DONE": 145
      },
      "total": 165
    },
    "deliveries": {
      "byStatus": {
        "DRAFT": 5,
        "READY": 3,
        "DONE": 89
      },
      "total": 97
    },
    "products": {
      "total": 450,
      "active": 420,
      "inactive": 30
    },
    "warehouses": {
      "total": 5,
      "active": 5,
      "inactive": 0
    },
    "inventory": {
      "totalItems": 5000,
      "lowStockAlerts": 15
    },
    "timestamp": "2026-03-14T..."
  }
}
```

---

## 🔒 Authorization Rules

| Endpoint | Public | User | Manager | Notes |
|----------|--------|------|---------|-------|
| Auth (signup, login, forgot, reset) | ✅ | - | - | Public endpoints |
| GET /api/products | - | ✅ | ✅ | Requires JWT |
| POST /api/products | - | - | ✅ | Manager only |
| GET /api/products/:id/stock | - | ✅ | ✅ | Requires JWT |
| POST /api/receipts | - | ✅ | ✅ | Requires JWT |
| PUT /api/receipts/:id/validate | - | ✅ | ✅ | Requires JWT |
| POST /api/deliveries | - | ✅ | ✅ | Requires JWT |
| PUT /api/deliveries/:id/validate | - | ✅ | ✅ | Requires JWT |
| POST /api/transfers | - | ✅ | ✅ | Requires JWT |
| PUT /api/transfers/:id/validate | - | ✅ | ✅ | Requires JWT |
| POST /api/adjustments/:id/validate | - | - | ✅ | Manager only |
| GET /api/stock/moves | - | ✅ | ✅ | Requires JWT |
| GET /api/dashboard/kpis | - | ✅ | ✅ | Requires JWT |

---

## 🚀 Usage Flow Example

### 1. Register User
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

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "MyPassword123!"
  }'
```

### 3. Get Products (with JWT token from login)
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=20" \
  -H "Authorization: Bearer {token}"
```

### 4. Create Receipt
```bash
curl -X POST http://localhost:3000/api/receipts \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "SUP-001",
    "warehouseId": "warehouse-uuid",
    "lines": [
      {
        "productId": "product-uuid",
        "locationId": "location-uuid",
        "expectedQty": 100
      }
    ]
  }'
```

### 5. Validate Receipt
```bash
curl -X PUT http://localhost:3000/api/receipts/{receipt-id}/validate \
  -H "Authorization: Bearer {token}"
```

---

## ✅ All Endpoints Implemented

✓ POST /api/auth/signup - Register new user (Public)
✓ POST /api/auth/login - Login → returns JWT (Public)
✓ POST /api/auth/forgot-password - Send OTP to email (Public)
✓ POST /api/auth/reset-password - Verify OTP + set new password (Public)
✓ GET /api/products - List products (search, filter, page) (JWT)
✓ POST /api/products - Create product (Manager)
✓ GET /api/products/:id/stock - Stock per location (JWT)
✓ GET /api/receipts - List receipts (JWT)
✓ POST /api/receipts - Create receipt (JWT)
✓ PUT /api/receipts/:id/validate - Validate receipt (JWT)
✓ GET /api/deliveries - List deliveries (JWT)
✓ POST /api/deliveries - Create delivery (JWT)
✓ PUT /api/deliveries/:id/validate - Validate delivery (JWT)
✓ POST /api/transfers - Create transfer (JWT)
✓ PUT /api/transfers/:id/validate - Execute transfer (JWT)
✓ POST /api/adjustments/:id/validate - Apply adjustment (Manager)
✓ GET /api/stock/moves - Move history with filters (JWT)
✓ GET /api/dashboard/kpis - Aggregate KPI counts (JWT)
