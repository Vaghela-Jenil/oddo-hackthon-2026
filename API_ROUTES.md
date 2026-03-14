# API Routes Documentation

**Base URL:** `http://localhost:8000/api`  
**Auth Header:** `Authorization: Bearer {token}`

---

## 🔐 AUTHENTICATION

### Signup
```
POST /auth/signup
Content-Type: application/json

Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response (201):
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📦 PRODUCTS

### Get All Products
```
GET /products?page=1&limit=20&search=&categoryId=
Authorization: Bearer {token}

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string (optional)
- categoryId: string (optional)
- isActive: boolean (optional)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Product 1",
      "sku": "SKU001",
      "categoryId": "uuid",
      "unitOfMeasure": "pcs",
      "lowStockQty": 10,
      "imageUrl": "url",
      "isActive": true,
      "createdAt": "ISO_DATE"
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

### Get Product Stock
```
GET /products/{productId}/stock
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "product": { /* product object */ },
    "stockByLocation": [
      {
        "locationId": "loc-uuid",
        "quantity": 50.0,
        "location": {
          "id": "loc-uuid",
          "name": "Rack A",
          "warehouse": { "id": "wh-uuid", "name": "Main Warehouse" }
        }
      }
    ],
    "totalStock": 150.0
  }
}
```

### Create Product
```
POST /products
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "New Product",
  "sku": "SKU-NEW-001",
  "categoryId": "category-uuid",
  "unitOfMeasure": "pcs",
  "lowStockQty": 10,
  "imageUrl": "https://example.com/image.jpg"
}

Response (201):
{
  "success": true,
  "message": "Product created successfully",
  "data": { /* product object */ }
}
```

### Update Product
```
PUT /products/{productId}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Updated Name",
  "sku": "SKU-UPD-001",
  "categoryId": "category-uuid",
  "unitOfMeasure": "kg",
  "lowStockQty": 20
}

Response (200):
{
  "success": true,
  "message": "Product updated successfully",
  "data": { /* updated product object */ }
}
```

---

## 📭 RECEIPTS (Inbound Stock)

### Get All Receipts
```
GET /receipts?page=1&limit=20&status=DRAFT&warehouseId=
Authorization: Bearer {token}

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- status: string - DRAFT, WAITING, READY, DONE, CANCELED (optional)
- warehouseId: string (optional)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "receipt-uuid",
      "refNo": "REC001",
      "status": "DRAFT",
      "warehouseId": "wh-uuid",
      "warehouse": { "id": "wh-uuid", "name": "Main Warehouse" },
      "scheduledDate": "ISO_DATE",
      "lines": [
        {
          "id": "line-uuid",
          "productId": "prod-uuid",
          "locationId": "loc-uuid",
          "expectedQty": 100.0,
          "receivedQty": 0.0,
          "product": { /* product */ },
          "location": { /* location */ }
        }
      ],
      "createdAt": "ISO_DATE"
    }
  ],
  "pagination": { /* ... */ }
}
```

### Create Receipt
```
POST /receipts
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "warehouseId": "wh-uuid",
  "supplierId": "supplier-uuid" (optional),
  "scheduledDate": "2026-03-15" (optional),
  "lines": [
    {
      "productId": "prod-uuid",
      "locationId": "loc-uuid",
      "expectedQty": 100.0
    }
  ]
}

Response (201):
{
  "success": true,
  "message": "Receipt created successfully",
  "data": { /* receipt object */ }
}

Errors:
400: { "error": "warehouseId and lines are required" }
```

### Validate Receipt
```
PUT /receipts/{receiptId}/validate
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Receipt validated successfully",
  "data": { /* updated receipt */ }
}

Errors:
400: { "error": "Receipt must be in DRAFT status" }
404: { "error": "Receipt not found" }
```

---

## 📦 DELIVERIES (Outbound Stock)

### Get All Deliveries
```
GET /deliveries?page=1&limit=20&status=DRAFT&warehouseId=
Authorization: Bearer {token}

Same query parameters as Receipts

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "delivery-uuid",
      "refNo": "DEL001",
      "status": "DRAFT",
      "warehouseId": "wh-uuid",
      "warehouse": { /* warehouse */ },
      "scheduledDate": "ISO_DATE",
      "lines": [
        {
          "id": "line-uuid",
          "productId": "prod-uuid",
          "locationId": "loc-uuid",
          "requestedQty": 50.0,
          "deliveredQty": 0.0,
          "product": { /* product */ },
          "location": { /* location */ }
        }
      ],
      "createdAt": "ISO_DATE"
    }
  ],
  "pagination": { /* ... */ }
}
```

### Create Delivery
```
POST /deliveries
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "warehouseId": "wh-uuid",
  "customerId": "customer-uuid" (optional),
  "scheduledDate": "2026-03-15" (optional),
  "lines": [
    {
      "productId": "prod-uuid",
      "locationId": "loc-uuid",
      "requestedQty": 50.0
    }
  ]
}

Response (201):
{
  "success": true,
  "message": "Delivery created successfully",
  "data": { /* delivery object */ }
}

Errors:
400: { "error": "warehouseId and lines are required" }
```

### Validate Delivery
```
PUT /deliveries/{deliveryId}/validate
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Delivery validated successfully",
  "data": { /* delivery */ }
}
```

---

## 🔄 TRANSFERS (Internal Stock Movement)

### Get All Transfers
```
GET /transfers?page=1&limit=20&status=
Authorization: Bearer {token}

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- status: string (optional)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "transfer-uuid",
      "refNo": "TRN001",
      "status": "DRAFT",
      "fromLocationId": "loc-uuid",
      "fromLocation": { /* location */ },
      "toLocationId": "loc-uuid",
      "toLocation": { /* location */ },
      "scheduledDate": "ISO_DATE",
      "lines": [
        {
          "productId": "prod-uuid",
          "qty": 30.0,
          "product": { /* product */ }
        }
      ],
      "createdAt": "ISO_DATE"
    }
  ],
  "pagination": { /* ... */ }
}
```

### Create Transfer
```
POST /transfers
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "fromLocationId": "loc-uuid-1",
  "toLocationId": "loc-uuid-2",
  "lines": [
    {
      "productId": "prod-uuid",
      "qty": 30.0
    }
  ]
}

Response (201):
{
  "success": true,
  "message": "Transfer created successfully",
  "data": { /* transfer object */ }
}

Errors:
400: { "error": "fromLocationId, toLocationId, and lines are required" }
```

### Validate Transfer
```
PUT /transfers/{transferId}/validate
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Transfer validated successfully",
  "data": { /* transfer */ }
}
```

---

## 🔧 ADJUSTMENTS (Stock Corrections)

### Get All Adjustments
```
GET /adjustments?page=1&limit=20&status=
Authorization: Bearer {token}

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- status: string (optional)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "adj-uuid",
      "refNo": "ADJ001",
      "status": "DRAFT",
      "reason": "Inventory discrepancy",
      "lines": [
        {
          "id": "line-uuid",
          "productId": "prod-uuid",
          "locationId": "loc-uuid",
          "adjustedQty": 50.0,
          "reason": "Physical count",
          "product": { /* product */ },
          "location": { /* location */ }
        }
      ],
      "createdAt": "ISO_DATE"
    }
  ],
  "pagination": { /* ... */ }
}
```

### Create Adjustment
```
POST /adjustments
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "reason": "Inventory discrepancy found during cycle count",
  "lines": [
    {
      "productId": "prod-uuid",
      "locationId": "loc-uuid",
      "adjustedQty": 50.0,
      "reason": "Physical count mismatch"
    }
  ]
}

Response (201):
{
  "success": true,
  "message": "Adjustment created successfully",
  "data": { /* adjustment object */ }
}

Errors:
400: { "error": "lines array is required" }
```

### Validate Adjustment
```
PUT /adjustments/{adjustmentId}/validate
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Adjustment validated successfully",
  "data": { /* adjustment */ }
}
```

---

## 📊 STOCK MOVES

### Get All Stock Moves
```
GET /stock/moves?page=1&limit=20&type=&productId=&fromLocationId=&toLocationId=&refType=
Authorization: Bearer {token}

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- type: string - RECEIPT, DELIVERY, TRANSFER, ADJUSTMENT (optional)
- productId: string (optional)
- fromLocationId: string (optional)
- toLocationId: string (optional)
- refType: string (optional)
- startDate: ISO_DATE (optional)
- endDate: ISO_DATE (optional)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "move-uuid",
      "productId": "prod-uuid",
      "qty": 50.0,
      "type": "RECEIPT",
      "fromLocationId": null,
      "fromLocation": null,
      "toLocationId": "loc-uuid",
      "toLocation": { /* location with warehouse */ },
      "referenceId": "receipt-uuid",
      "refType": "receipt",
      "note": "Stock receipt",
      "createdBy": "user-uuid",
      "createdByUser": { "id": "user-uuid", "name": "John" },
      "product": { /* product */ },
      "createdAt": "ISO_DATE"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## 📈 DASHBOARD

### Get KPIs
```
GET /dashboard/kpis?warehouseId=
Authorization: Bearer {token}

Query Parameters:
- warehouseId: string (optional)

Response (200):
{
  "success": true,
  "data": {
    "totalProductsInStock": 150,
    "lowStockItems": 5,
    "outOfStockItems": 2,
    "pendingReceipts": 3,
    "pendingDeliveries": 4,
    "internalTransfersScheduled": 2
  }
}
```

---

## 🏭 WAREHOUSES

### Get All Warehouses
```
GET /warehouses
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "wh-uuid",
      "name": "Main Warehouse",
      "address": "123 Main St",
      "isActive": true,
      "locations": [
        {
          "id": "loc-uuid",
          "name": "Rack A",
          "type": "RACK",
          "warehouseId": "wh-uuid"
        }
      ]
    }
  ]
}
```

---

## ✅ Common Response Patterns

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* specific data */ },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

---

## 🔑 Error Codes

- **400 Bad Request**: Invalid request parameters or validation failed
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User doesn't have permission for this action
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error
