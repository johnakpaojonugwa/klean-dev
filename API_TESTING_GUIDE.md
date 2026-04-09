# API Testing Guide

Quick reference for testing the Klean Backend API

## Setup for Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm run dev
```

Server runs on: `http://localhost:3000`

### 3. Test Health Check
```bash
curl http://localhost:3000/api/v1/health
```

Expected Response:
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## Authentication Tests

### 1. Register New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "fullname": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "avatar": null
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'
```
> Note: The refresh-token endpoint is rate limited to 3 requests per 15 minutes.

### 4. Change Password (Logged-in Users)
```bash
curl -X PATCH http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!",
    "confirmPassword": "NewSecurePass456!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 5. API Docs
```bash
curl http://localhost:3000/api/v1/docs
```

### 6. Health Check
```bash
curl http://localhost:3000/api/v1/health
```

---

## User Management Tests

### Get All Users (SUPER_ADMIN/BRANCH_MANAGER only)
```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <access_token>"
```

### Get Own Profile
```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```

### Update Own Profile (Avatar, Name, Email, Phone, Address)
```bash
# For text fields only
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe Updated",
    "email": "john.updated@example.com",
    "phoneNumber": "+1234567890",
    "address": "123 New Street, City, State"
  }'

# For avatar upload (use form-data)
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>" \
  -F "avatar=@/path/to/avatar.jpg"
```

Response:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "...",
      "fullname": "John Doe Updated",
      "email": "john.updated@example.com",
      "avatar": "https://cloudinary.com/.../avatar.jpg"
    }
  }
}
```

### Get Single User
```bash
curl http://localhost:3000/api/v1/users/<userId> \
  -H "Authorization: Bearer <access_token>"
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/v1/users/<userId> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Jane Doe",
    "email": "jane@example.com"
  }'
```

### Delete User (SUPER_ADMIN only)
```bash
curl -X DELETE http://localhost:3000/api/v1/users/<userId> \
  -H "Authorization: Bearer <access_token>"
```

---

## Order Management Tests

### Create Order
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "67a1b2c3d4e5f6g7h8i9j0k1",
    "branchId": "67a1b2c3d4e5f6g7h8i9j0k2",
    "items": [
      {
        "serviceName": "Standard Wash",
        "quantity": 5,
        "unitPrice": 50
      },
      {
        "serviceName": "Dry Cleaning",
        "quantity": 2,
        "unitPrice": 100
      }
    ],
    "dueDate": "2026-01-25"
  }'
```

### Get Orders
```bash
# Get all orders
curl "http://localhost:3000/api/v1/orders" \
  -H "Authorization: Bearer <access_token>"

# Get orders with filters
curl "http://localhost:3000/api/v1/orders?status=WASHING&page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

### Get Single Order
```bash
curl http://localhost:3000/api/v1/orders/<orderId> \
  -H "Authorization: Bearer <access_token>"
```

### Update Order
```bash
curl -X PUT http://localhost:3000/api/v1/orders/<orderId> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "WASHING",
    "paymentStatus": "PARTIAL"
  }'
```

### Mark Order Paid (preferred)
```bash
curl -X PUT http://localhost:3000/api/v1/orders/<orderId>/mark-paid \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{}'  # no body required
```


### Update Order Status
```bash
curl -X PATCH http://localhost:3000/api/v1/orders/<orderId>/status \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "READY"
  }'
```

### Delete Order
```bash
curl -X DELETE http://localhost:3000/api/v1/orders/<orderId> \
  -H "Authorization: Bearer <access_token>"
```

---

## Branch Management Tests

### Create Branch (SUPER_ADMIN only)
```bash
curl -X POST http://localhost:3000/api/v1/branch \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Branch",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    },
    "contactNumber": "+12125551234"
  }'
```

### Get All Branches
```bash
curl http://localhost:3000/api/v1/branch \
  -H "Authorization: Bearer <access_token>"
```

### Get Single Branch
```bash
curl http://localhost:3000/api/v1/branch/<branchId> \
  -H "Authorization: Bearer <access_token>"
```

### Update Branch
```bash
curl -X PUT http://localhost:3000/api/v1/branch/<branchId> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Branch Updated",
    "contactNumber": "+12125551235"
  }'
```

### Delete Branch
```bash
curl -X DELETE http://localhost:3000/api/v1/branch/<branchId> \
  -H "Authorization: Bearer <access_token>"
```

---

## Inventory Management Tests

### Add Inventory Item
```bash
curl -X POST http://localhost:3000/api/v1/inventory \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "67a1b2c3d4e5f6g7h8i9j0k2",
    "itemName": "Detergent Powder",
    "category": "DETERGENT",
    "currentStock": 100,
    "unit": "kg",
    "reorderLevel": 20,
    "supplierContact": "supplier@example.com"
  }'
```

### Get Branch Inventory
```bash
curl "http://localhost:3000/api/v1/inventory/branch/<branchId>" \
  -H "Authorization: Bearer <access_token>"

# With filters
curl "http://localhost:3000/api/v1/inventory/branch/<branchId>?category=DETERGENT&lowStock=true" \
  -H "Authorization: Bearer <access_token>"
```

### Get Low Stock Items
```bash
curl "http://localhost:3000/api/v1/inventory/low-stock" \
  -H "Authorization: Bearer <access_token>"
```

### Update Inventory
```bash
curl -X PUT http://localhost:3000/api/v1/inventory/<itemId> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentStock": 80,
    "reorderLevel": 25
  }'
```

### Delete Inventory Item
```bash
curl -X DELETE http://localhost:3000/api/v1/inventory/<itemId> \
  -H "Authorization: Bearer <access_token>"
```

---

## Analytics & Dashboard Tests

**Note:** All analytics endpoints now use live queries directly from the database for real-time accuracy. No pre-computed analytics storage is required.

### Get Dashboard Summary
```bash
curl http://localhost:3000/api/v1/analytics/dashboard \
  -H "Authorization: Bearer <access_token>"
```

Response:
```json
{
  "success": true,
  "message": "Dashboard summary retrieved",
  "data": {
    "todayRevenue": 2500,
    "todayOrders": 15,
    "totalCustomers": 120,
    "lowStockItems": 3,
    "pendingOrders": 8,
    "completedOrders": 45
  }
}
```

### Get Period Analytics
```bash
# Get analytics for the last 7 days
curl "http://localhost:3000/api/v1/analytics/period?startDate=2024-01-01&endDate=2024-01-07" \
  -H "Authorization: Bearer <access_token>"

# Get analytics for specific branch
curl "http://localhost:3000/api/v1/analytics/period?startDate=2024-01-01&endDate=2024-01-07&branchId=<branchId>" \
  -H "Authorization: Bearer <access_token>"
```

Response:
```json
{
  "success": true,
  "message": "Analytics retrieved",
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-07",
      "totalRevenue": 17500,
      "totalOrders": 105,
      "averageOrderValue": 166.67
    },
    "analytics": [
      {
        "date": "2024-01-01",
        "revenue": 2500,
        "orders": 15,
        "customers": 12,
        "averageOrderValue": 166.67
      },
      {
        "date": "2024-01-02",
        "revenue": 2200,
        "orders": 13,
        "customers": 10,
        "averageOrderValue": 169.23
      }
    ]
  }
}
```

### Get Daily Analytics
```bash
# Get today's analytics
curl http://localhost:3000/api/v1/analytics/daily \
  -H "Authorization: Bearer <access_token>"

# Get analytics for specific date
curl "http://localhost:3000/api/v1/analytics/daily?date=2024-01-15" \
  -H "Authorization: Bearer <access_token>"

# Get analytics for specific branch and date
curl "http://localhost:3000/api/v1/analytics/daily?date=2024-01-15&branchId=<branchId>" \
  -H "Authorization: Bearer <access_token>"
```

### Get Order Trends
```bash
curl http://localhost:3000/api/v1/analytics/orders/trends \
  -H "Authorization: Bearer <access_token>"
```

Response:
```json
{
  "success": true,
  "message": "Order trends retrieved",
  "data": {
    "trends": [
      {
        "date": "2024-01-01",
        "orders": 15,
        "revenue": 2500
      },
      {
        "date": "2024-01-02",
        "orders": 13,
        "revenue": 2200
      }
    ],
    "growth": {
      "ordersGrowth": 12.5,
      "revenueGrowth": 8.3
    }
  }
}
```

### Get Revenue Analytics
```bash
curl http://localhost:3000/api/v1/analytics/revenue \
  -H "Authorization: Bearer <access_token>"
```

Response:
```json
{
  "success": true,
  "message": "Revenue analytics retrieved",
  "data": {
    "totalRevenue": 45250,
    "monthlyRevenue": [
      {
        "month": "2024-01",
        "revenue": 17500,
        "orders": 105
      },
      {
        "month": "2024-02",
        "revenue": 15200,
        "orders": 98
      }
    ],
    "revenueByService": [
      {
        "service": "Standard Wash",
        "revenue": 22500,
        "percentage": 49.7
      },
      {
        "service": "Dry Cleaning",
        "revenue": 15200,
        "percentage": 33.6
      }
    ]
  }
}
```

### Get Customer Analytics
```bash
curl http://localhost:3000/api/v1/analytics/customers \
  -H "Authorization: Bearer <access_token>"
```

Response:
```json
{
  "success": true,
  "message": "Customer analytics retrieved",
  "data": {
    "totalCustomers": 120,
    "newCustomersThisMonth": 15,
    "returningCustomers": 85,
    "averageOrdersPerCustomer": 3.2,
    "topCustomers": [
      {
        "customerId": "...",
        "name": "John Doe",
        "totalOrders": 12,
        "totalSpent": 1800
      }
    ]
  }
}
```

### Export Analytics to PDF
```bash
curl -X GET "http://localhost:3000/api/v1/analytics/export/pdf?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <access_token>" \
  -o analytics_report.pdf
```

---

## Error Test Cases

### 1. Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe"
  }'
```

Response (400):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Valid email is required",
    "Password must be at least 8 characters with uppercase, number, and special character"
  ]
}
```

### 2. Invalid Email
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123!"
  }'
```

Response (400):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Valid email is required"]
}
```

### 3. Unauthorized (Missing Token)
```bash
curl http://localhost:3000/api/v1/users
```

Response (401):
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 4. Invalid Token
```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer invalid_token"
```

Response (401):
```json
{
  "success": false,
  "message": "Invalid or expired token, pls login again"
}
```

### 5. Forbidden (Insufficient Permissions)
```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <customer_token>"
```

Response (403):
```json
{
  "success": false,
  "message": "Access denied. Allowed roles: SUPER_ADMIN, BRANCH_MANAGER"
}
```

### 6. Not Found
```bash
curl http://localhost:3000/api/v1/users/invalid_id \
  -H "Authorization: Bearer <access_token>"
```

Response (404):
```json
{
  "success": false,
  "message": "User not found"
}
```

### 7. Duplicate Email
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Duplicate",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Response (409):
```json
{
  "success": false,
  "message": "email already registered"
}
```

### 8. Rate Limit Exceeded
After 5 login attempts in 15 minutes:
```json
{
  "success": false,
  "message": "Too many login attempts, please try again later."
}
```

---

## Testing with Postman

1. Import the API endpoints as a Postman collection
2. Create a Postman environment with:
   - `base_url`: http://localhost:3000
   - `access_token`: (set after login)
   - `refresh_token`: (set after login)
3. Use pre-request scripts to automatically set tokens

---

## Load Testing

Test server performance under load:

```bash
# Using Apache Bench (ab)
ab -n 1000 -c 10 http://localhost:3000/api/v1/health

# Using Apache JMeter
jmeter -n -t test_plan.jmx -l results.jtl
```

---

## Debugging Tips

1. **Check Server Logs**
   - Watch `logs/info-*.log` for activity
   - Check `logs/error-*.log` for issues

2. **Enable Debug Mode**
   Set `NODE_ENV=development` for verbose logging

3. **Monitor Rate Limiting**
   - Auth endpoints reset every 15 minutes
   - General endpoints reset every 15 minutes

4. **Common Issues**
   - Token expired: Use refresh-token endpoint
   - Permission denied: Check user role
   - Validation error: Review field requirements
