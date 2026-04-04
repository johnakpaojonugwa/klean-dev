# Klean Backend API Reference

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints (except `/auth/*`) require a JWT token in the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

---

## Auth Endpoints
**Base Path:** `/auth`

### 1. Register
- **Method:** `POST`
- **Path:** `/auth/sign-up`
- **Auth Required:** ❌ No
- **Body:**
  ```json
  {
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "role": "CUSTOMER"
  }
  ```
- **Response:** `201`
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": { "_id", "fullname", "email", "role", "avatar", "branchId" },
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```

### 2. Login
- **Method:** `POST`
- **Path:** `/auth/login`
- **Auth Required:** ❌ No
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "_id", "fullname", "email", "role", "avatar", "branchId" },
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```

### 3. Refresh Token
- **Method:** `POST`
- **Path:** `/auth/refresh-token`
- **Auth Required:** ❌ No
- **Body:**
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Notes:** This endpoint is protected by stricter rate limiting to prevent abuse.
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Token refreshed",
    "data": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```

### 4. Logout
- **Method:** `POST`
- **Path:** `/auth/logout`
- **Auth Required:** ✅ Yes
- **Body:**
  ```json
  { "refreshToken": "string" }
  ```

### 5. Forgot Password
- **Method:** `POST`
- **Path:** `/auth/forgot-password`
- **Auth Required:** ❌ No
- **Body:**
  ```json
  {
    "email": "john@example.com"
  }
  ```

### 6. Reset Password
- **Method:** `PATCH`
- **Path:** `/auth/reset-password/:token`
- **Auth Required:** ❌ No
- **Body:**
  ```json
  {
    "password": "NewSecurePass123!",
    "confirmPassword": "NewSecurePass123!"
  }
  ```

### 7. Health Check
- **Method:** `GET`
- **Path:** `/health`
- **Auth Required:** ❌ No
- **Response:**
  ```json
  {
    "success": true,
    "message": "Server is running"
  }
  ```

### 8. API Docs
- **Method:** `GET`
- **Path:** `/docs`
- **Auth Required:** ❌ No
- **Notes:** Serves Swagger UI documentation for the API

---

## User Management
**Base Path:** `/users`

### 1. Create User
- **Method:** `POST`
- **Path:** `/users`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Body:**
  ```json
  {
    "fullname": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "password": "SecurePass123!",
    "role": "CUSTOMER",
    "branchId": "branch_id"
  }
  ```

### 2. Get All Users
- **Method:** `GET`
- **Path:** `/users`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 3. Get Customers
- **Method:** `GET`
- **Path:** `/users/customers`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`, `STAFF`

### 4. Get Own Profile
- **Method:** `GET`
- **Path:** `/users/me`
- **Auth Required:** ✅ Yes

### 5. Get User by ID
- **Method:** `GET`
- **Path:** `/users/:userId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 6. Update User
- **Method:** `PUT`
- **Path:** `/users/:userId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 7. Soft Delete User
- **Method:** `PATCH`
- **Path:** `/users/:userId/status`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 8. Delete User
- **Method:** `DELETE`
- **Path:** `/users/:userId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

---

## Branch Manager Management
**Base Path:** `/branch-managers`

### 1. Create Branch Manager
- **Method:** `POST`
- **Path:** `/branch-managers`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

### 2. Get Branch Managers
- **Method:** `GET`
- **Path:** `/branch-managers`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 3. Get Branch Manager by ID
- **Method:** `GET`
- **Path:** `/branch-managers/:userId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 4. Update Branch Manager
- **Method:** `PUT`
- **Path:** `/branch-managers/:userId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

### 5. Delete Branch Manager
- **Method:** `DELETE`
- **Path:** `/branch-managers/:userId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

---

## Branch Management
**Base Path:** `/branch`

### 1. Create Branch
- **Method:** `POST`
- **Path:** `/branch`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`
- **Body:**
  ```json
  {
    "name": "Downtown Branch",
    "address": "123 Main St, City, State",
    "phoneNumber": "+1234567890",
    "managerId": "manager_user_id"
  }
  ```

### 2. Get All Branches
- **Method:** `GET`
- **Path:** `/branch`
- **Auth Required:** ✅ Yes

### 3. Get Branch by ID
- **Method:** `GET`
- **Path:** `/branch/:branchId`
- **Auth Required:** ✅ Yes

### 4. Update Branch
- **Method:** `PUT`
- **Path:** `/branch/:branchId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

### 5. Delete Branch
- **Method:** `DELETE`
- **Path:** `/branch/:branchId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

---

## Order Management
**Base Path:** `/orders`

### 1. Create Order
- **Method:** `POST`
- **Path:** `/orders`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`, `STAFF`, `CUSTOMER`
- **Body:**
  ```json
  {
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "items": [
      {
        "itemType": "Wash & Fold",
        "quantity": 5,
        "unitPrice": 10.00
      }
    ],
    "pickupDate": "2026-04-10",
    "deliveryDate": "2026-04-12",
    "priority": "NORMAL",
    "discount": 0,
    "totalAmount": 50.00,
    "branchId": "branch_id"
  }
  ```

### 2. Get All Orders
- **Method:** `GET`
- **Path:** `/orders`
- **Auth Required:** ✅ Yes
- **Query Params:**
  - `status`: `RECEIVED|PROCESSING|READY|DELIVERED|CANCELLED`
  - `paymentStatus`: `PAID|UNPAID`
  - `search`: Search by order number or customer name
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10, max: 100)

### 3. Get Single Order
- **Method:** `GET`
- **Path:** `/orders/:orderId`
- **Auth Required:** ✅ Yes

### 4. Update Order
- **Method:** `PUT`
- **Path:** `/orders/:orderId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 5. Mark Order as Paid
- **Method:** `PUT`
- **Path:** `/orders/:orderId/mark-paid`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 6. Update Order Status
- **Method:** `PATCH`
- **Path:** `/orders/:orderId/status`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`, `STAFF`
- **Body:**
  ```json
  {
    "status": "PROCESSING"
  }
  ```

### 7. Delete Order
- **Method:** `DELETE`
- **Path:** `/orders/:orderId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

---

## Inventory Management
**Base Path:** `/inventory`

### 1. Get Low Stock Items
- **Method:** `GET`
- **Path:** `/inventory/low-stock`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 2. Add Inventory Item
- **Method:** `POST`
- **Path:** `/inventory`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Body:**
  ```json
  {
    "name": "Laundry Detergent",
    "category": "Cleaning Supplies",
    "branchId": "branch_id",
    "currentStock": 50,
    "unit": "L",
    "reorderLevel": 10,
    "unitCost": 25.00
  }
  ```

### 3. Get Inventory by Branch
- **Method:** `GET`
- **Path:** `/inventory/branch/:branchId`
- **Auth Required:** ✅ Yes

### 4. Update Inventory Item
- **Method:** `PUT`
- **Path:** `/inventory/:itemId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 5. Delete Inventory Item
- **Method:** `DELETE`
- **Path:** `/inventory/:itemId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

---

## Employee Management
**Base Path:** `/employees`

### 1. Onboard Employee
- **Method:** `POST`
- **Path:** `/employees`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Body:**
  ```json
  {
    "fullname": "Jane Smith",
    "email": "jane@company.com",
    "password": "SecurePass123!",
    "phoneNumber": "+1234567890",
    "designation": "Laundry Attendant",
    "department": "Operations",
    "branchId": "branch_id",
    "joinDate": "2026-04-01",
    "employeeJobRole": "STAFF"
  }
  ```

### 2. Get All Employees
- **Method:** `GET`
- **Path:** `/employees`
- **Auth Required:** ✅ Yes

### 3. Get Employee by User ID
- **Method:** `GET`
- **Path:** `/employees/user/:userId`
- **Auth Required:** ✅ Yes

### 4. Get Employee
- **Method:** `GET`
- **Path:** `/employees/:employeeId`
- **Auth Required:** ✅ Yes

### 5. Update Employee
- **Method:** `PUT`
- **Path:** `/employees/:employeeId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 6. Terminate Employee
- **Method:** `POST`
- **Path:** `/employees/:employeeId/terminate`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

### 7. Delete Employee
- **Method:** `DELETE`
- **Path:** `/employees/:employeeId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

---

## Payroll Management
**Base Path:** `/payroll`

### Salary Structure

#### 1. Create Salary Structure
- **Method:** `POST`
- **Path:** `/payroll/structure/create`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`
- **Body:**
  ```json
  {
    "name": "Standard Staff Salary",
    "baseSalary": 3000.00,
    "allowances": {
      "transport": 200.00,
      "meal": 150.00
    },
    "deductions": {
      "insurance": 50.00,
      "tax": 150.00
    },
    "taxRate": 0.1
  }
  ```

#### 2. Get Salary Structures
- **Method:** `GET`
- **Path:** `/payroll/structure/list`
- **Auth Required:** ✅ Yes

#### 3. Update Salary Structure
- **Method:** `PUT`
- **Path:** `/payroll/structure/:structureId`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

### Payroll Processing

#### 4. Process Payroll
- **Method:** `POST`
- **Path:** `/payroll/process`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Body:**
  ```json
  {
    "employeeIds": ["emp1", "emp2"],
    "month": "April",
    "year": 2026
  }
  ```

#### 5. Process Payroll for Branch
- **Method:** `POST`
- **Path:** `/payroll/process-branch`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`
- **Body:**
  ```json
  {
    "branchId": "branch_id",
    "month": "April",
    "year": 2026
  }
  ```

#### 6. Get Payrolls
- **Method:** `GET`
- **Path:** `/payroll/list`
- **Auth Required:** ✅ Yes

#### 7. Get Payroll
- **Method:** `GET`
- **Path:** `/payroll/:payrollId`
- **Auth Required:** ✅ Yes

#### 8. Approve Payroll
- **Method:** `PUT`
- **Path:** `/payroll/:payrollId/approve`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

#### 9. Mark Payroll as Paid
- **Method:** `PUT`
- **Path:** `/payroll/:payrollId/mark-paid`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

#### 10. Generate Salary Slip
- **Method:** `GET`
- **Path:** `/payroll/:payrollId/salary-slip`
- **Auth Required:** ✅ Yes
- **Response:** PDF file

---

## Leave Management
**Base Path:** `/leave`

### Leave Types

#### 1. Create Leave Type
- **Method:** `POST`
- **Path:** `/leave/type/create`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`
- **Body:**
  ```json
  {
    "name": "Annual Leave",
    "description": "Paid annual leave",
    "maxDays": 25,
    "requiresApproval": true
  }
  ```

#### 2. Get Leave Types
- **Method:** `GET`
- **Path:** `/leave/type/list`
- **Auth Required:** ✅ Yes

### Leave Requests

#### 3. Request Leave
- **Method:** `POST`
- **Path:** `/leave/request`
- **Auth Required:** ✅ Yes
- **Body:**
  ```json
  {
    "leaveTypeId": "leave_type_id",
    "startDate": "2026-04-15",
    "endDate": "2026-04-20",
    "reason": "Family vacation"
  }
  ```

#### 4. Get Leaves
- **Method:** `GET`
- **Path:** `/leave/list`
- **Auth Required:** ✅ Yes

#### 5. Get Leave
- **Method:** `GET`
- **Path:** `/leave/:leaveId`
- **Auth Required:** ✅ Yes

#### 6. Approve Leave
- **Method:** `PUT`
- **Path:** `/leave/:leaveId/approve`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

#### 7. Reject Leave
- **Method:** `PUT`
- **Path:** `/leave/:leaveId/reject`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

#### 8. Cancel Leave
- **Method:** `PUT`
- **Path:** `/leave/:leaveId/cancel`
- **Auth Required:** ✅ Yes

#### 9. Get Leave Balance
- **Method:** `GET`
- **Path:** `/leave/balance/:employeeId`
- **Auth Required:** ✅ Yes

---

## Notification Management
**Base Path:** `/notifications`

### 1. Get Notifications
- **Method:** `GET`
- **Path:** `/notifications`
- **Auth Required:** ✅ Yes

### 2. Mark Notification as Read
- **Method:** `PUT`
- **Path:** `/notifications/:notificationId/read`
- **Auth Required:** ✅ Yes

### 3. Mark All Notifications as Read
- **Method:** `PUT`
- **Path:** `/notifications/mark-all-read`
- **Auth Required:** ✅ Yes

### 4. Delete Notification
- **Method:** `DELETE`
- **Path:** `/notifications/:notificationId`
- **Auth Required:** ✅ Yes

### Low Stock Alerts

#### 5. Get Low Stock Alerts
- **Method:** `GET`
- **Path:** `/notifications/low-stock/alerts`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

#### 6. Resolve Low Stock Alert
- **Method:** `PUT`
- **Path:** `/notifications/low-stock/alerts/:alertId/resolve`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`

#### 7. Manually Trigger Low Stock Check
- **Method:** `POST`
- **Path:** `/notifications/low-stock/check`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`

---

## Invoice Management
**Base Path:** `/invoices`

### 1. Create Invoice
- **Method:** `POST`
- **Path:** `/invoices`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Body:**
  ```json
  {
    "orderId": "order_id"
  }
  ```

### 2. Get My Invoices
- **Method:** `GET`
- **Path:** `/invoices/my-invoices`
- **Auth Required:** ✅ Yes

### 3. Get Invoice by ID
- **Method:** `GET`
- **Path:** `/invoices/:id`
- **Auth Required:** ✅ Yes

### 4. Download Invoice
- **Method:** `GET`
- **Path:** `/invoices/:id/download`
- **Auth Required:** ✅ Yes
- **Response:** PDF file

---

## Analytics & Dashboard
**Base Path:** `/analytics`

### 1. Get Dashboard Summary
- **Method:** `GET`
- **Path:** `/analytics/dashboard`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Query Params:**
  - `branchId`: Filter by branch (SUPER_ADMIN only)

### 2. Get Period Analytics
- **Method:** `GET`
- **Path:** `/analytics/period`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Query Params:**
  - `startDate`: YYYY-MM-DD (required)
  - `endDate`: YYYY-MM-DD (required)
  - `branchId`: Branch filter (optional)

### 3. Get Daily Analytics
- **Method:** `GET`
- **Path:** `/analytics/daily`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Query Params:**
  - `date`: YYYY-MM-DD (optional, defaults to today)
  - `branchId`: Branch filter (optional)

### 4. Get Order Trends
- **Method:** `GET`
- **Path:** `/analytics/orders/trends`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Query Params:**
  - `startDate`: YYYY-MM-DD (required)
  - `endDate`: YYYY-MM-DD (required)
  - `branchId`: Branch filter (optional)

### 5. Get Revenue Analytics
- **Method:** `GET`
- **Path:** `/analytics/revenue`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Query Params:**
  - `startDate`: YYYY-MM-DD (required)
  - `endDate`: YYYY-MM-DD (required)
  - `branchId`: Branch filter (optional)

### 6. Get Customer Analytics
- **Method:** `GET`
- **Path:** `/analytics/customers`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Query Params:**
  - `startDate`: YYYY-MM-DD (required)
  - `endDate`: YYYY-MM-DD (required)
  - `branchId`: Branch filter (optional)

### 7. Export Dashboard PDF
- **Method:** `POST`
- **Path:** `/analytics/export/pdf`
- **Auth Required:** ✅ Yes
- **Roles:** `SUPER_ADMIN`, `BRANCH_MANAGER`
- **Body:**
  ```json
  {
    "dashboardData": {},
    "dateRange": {
      "startDate": "2026-04-01",
      "endDate": "2026-04-30"
    }
  }
  ```
- **Response:** PDF file

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["field error 1", "field error 2"]
}
```

### Common HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email, etc.)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

---

## Rate Limiting

- **Global:** 100 requests per 15 minutes
- **Auth endpoints:** 5 requests per 15 minutes
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## File Upload

Endpoints that accept file uploads use `multipart/form-data`:

```javascript
const formData = new FormData();
formData.append('avatar', file);
formData.append('fullname', 'John Doe');
// ... other fields
```

Supported formats: JPEG, PNG, GIF (max 5MB)
- **Response:** `200`

### 5. Forgot Password
- **Method:** `POST`
- **Path:** `/auth/forgot-password`
- **Auth Required:** ❌ No
- **Body:**
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response:** `200`

### 6. Reset Password
- **Method:** `PATCH`
- **Path:** `/auth/reset-password/:token`
- **Auth Required:** ❌ No
- **Body:**
  ```json
  {
    "password": "NewPass123!",
    "confirmPassword": "NewPass123!"
  }
  ```
- **Response:** `200`

---

## Dashboard & Analytics Endpoints
**Base Path:** `/analytics`

### 1. Get Dashboard Summary
- **Method:** `GET`
- **Path:** `/analytics/dashboard`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Query Params:**
  - `branchId` (optional) - For SUPER_ADMIN to filter by branch
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Dashboard data retrieved",
    "data": {
      "totalOrders": 150,
      "totalRevenue": 25000,
      "totalCustomers": 45,
      "ordersByStatus": { "PENDING": 10, "PROCESSING": 5, "DELIVERED": 135 },
      "branchLeaderboard": [
        { "_id", "name", "branchCode", "totalRevenue", "totalOrders" }
      ]
    }
  }
  ```

### 2. Get Analytics for Period
- **Method:** `GET`
- **Path:** `/analytics/period`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Query Params:**
  - `startDate` (required) - ISO format: `2024-01-01`
  - `endDate` (required) - ISO format: `2024-12-31`
  - `branchId` (optional) - For SUPER_ADMIN
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Analytics retrieved",
    "data": {
      "analytics": [
        {
          "date": "2024-01-01",
          "totalOrders": 10,
          "totalRevenue": 5000,
          "paidOrders": 8,
          "unpaidOrders": 2,
          "newCustomers": 3
        }
      ],
      "totals": {
        "totalOrders": 300,
        "totalRevenue": 150000,
        "newCustomers": 50
      }
    }
  }
  ```

### 3. Get Daily Analytics
- **Method:** `GET`
- **Path:** `/analytics/daily`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Query Params:**
  - `date` (optional) - ISO format, defaults to today
  - `branchId` (optional) - For SUPER_ADMIN
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Daily analytics retrieved",
    "data": {
      "date": "2024-03-03",
      "analytics": { "totalOrders": 15, "totalRevenue": 8500, ... }
    }
  }
  ```

### 4. Get Order Trends
- **Method:** `GET`
- **Path:** `/analytics/orders/trends`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Query Params:**
  - `startDate` (required)
  - `endDate` (required)
  - `branchId` (optional)
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Order trends retrieved",
    "data": {
      "dailyOrders": [
        { "date": "2024-01-01", "orders": 10, "revenue": 5000 }
      ],
      "statusBreakdown": { "PENDING": 50, "PROCESSING": 30, "DELIVERED": 220 },
      "summary": { "totalOrders": 300, "totalRevenue": 150000, "newCustomers": 50 }
    }
  }
  ```

### 5. Get Revenue Analytics
- **Method:** `GET`
- **Path:** `/analytics/revenue`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Query Params:**
  - `startDate` (required)
  - `endDate` (required)
  - `branchId` (optional)
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Revenue analytics retrieved",
    "data": {
      "dailyRevenue": [
        { "date": "2024-01-01", "revenue": 5000, "paid": 8, "unpaid": 2 }
      ],
      "totalRevenue": 150000,
      "averageOrderValue": "500.00"
    }
  }
  ```

### 6. Get Customer Analytics
- **Method:** `GET`
- **Path:** `/analytics/customers`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Query Params:**
  - `startDate` (required)
  - `endDate` (required)
  - `branchId` (optional)
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Customer analytics retrieved",
    "data": {
      "newCustomersPerDay": [
        { "date": "2024-01-01", "newCustomers": 3, "active": 45 }
      ],
      "totalNewCustomers": 50,
      "averageNewCustomersPerDay": 1.61,
      "growth": "22.50"
    }
  }
  ```

### 7. Export Dashboard as PDF
- **Method:** `POST`
- **Path:** `/analytics/export/pdf`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:**
  ```json
  {
    "dashboardData": { /* dashboard object */ },
    "dateRange": { "startDate": "2024-01-01", "endDate": "2024-03-03" }
  }
  ```
- **Response:** `200` (PDF file)

---

## Order Endpoints
**Base Path:** `/orders`

### 1. Create Order
- **Method:** `POST`
- **Path:** `/orders`
- **Auth Required:** ✅ Yes
- **Body:**
  ```json
  {
    "customerName": "Jane Customer",
    "customerPhone": "+1234567890",
    "items": [
      { "itemType": "Shirt", "quantity": 2, "unitPrice": 50 }
    ],
    "pickupDate": "2024-03-10",
    "deliveryDate": "2024-03-15",
    "priority": "NORMAL",
    "discount": 5,
    "totalAmount": 95,
    "branchId": "6xxxx" // Required for admin, optional for customer
  }
  ```
- **Response:** `201`

### 2. Get All Orders
- **Method:** `GET`
- **Path:** `/orders`
- **Auth Required:** ✅ Yes
- **Query Params:**
  - `status` (optional) - PENDING, PROCESSING, READY, DELIVERED, CANCELLED
  - `paymentStatus` (optional) - PAID, UNPAID
  - `search` (optional) - Order number or customer name
  - `page` (optional) - Default: 1
  - `limit` (optional) - Default: 10, Max: 100
- **Response:** `200`

### 3. Get Single Order
- **Method:** `GET`
- **Path:** `/orders/:orderId`
- **Auth Required:** ✅ Yes
- **Response:** `200`

### 4. Update Order
- **Method:** `PUT`
- **Path:** `/orders/:orderId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:** Any order fields to update
- **Response:** `200`

### 5. Update Order Status
- **Method:** `PATCH`
- **Path:** `/orders/:orderId/status`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER, STAFF)
- **Body:**
  ```json
  {
    "status": "PROCESSING"
  }
  ```
- **Response:** `200`

### 6. Delete Order
- **Method:** `DELETE`
- **Path:** `/orders/:orderId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Response:** `200`

---

## Inventory Endpoints
**Base Path:** `/inventory`

### 1. Get Low Stock Items
- **Method:** `GET`
- **Path:** `/inventory/low-stock`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Response:** `200`

### 2. Add Inventory Item
- **Method:** `POST`
- **Path:** `/inventory`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:**
  ```json
  {
    "name": "Detergent",
    "category": "DETERGENT",
    "branchId": "6xxxx",
    "currentStock": 100,
    "unit": "Bottle",
    "reorderLevel": 20,
    "unitCost": 5.50
  }
  ```
- **Response:** `201`

### 3. Get Inventory by Branch
- **Method:** `GET`
- **Path:** `/inventory/branch/:branchId`
- **Auth Required:** ✅ Yes
- **Response:** `200`

### 4. Update Inventory Item
- **Method:** `PUT`
- **Path:** `/inventory/:itemId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:** Any inventory fields
- **Response:** `200`

### 5. Delete Inventory Item
- **Method:** `DELETE`
- **Path:** `/inventory/:itemId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Response:** `200`

---

## Employee Endpoints
**Base Path:** `/employees`

### 1. Onboard Employee
- **Method:** `POST`
- **Path:** `/employees`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:**
  ```json
  {
    "fullname": "John Staff",
    "email": "john.staff@example.com",
    "password": "StaffPass123!",
    "phoneNumber": "+1234567890",
    "designation": "Wash Operator",
    "department": "Operations",
    "branchId": "6xxxx",
    "joinDate": "2024-03-01",
    "employeeJobRole": "STAFF"
  }
  ```
- **Response:** `201`

### 2. Get All Employees
- **Method:** `GET`
- **Path:** `/employees`
- **Auth Required:** ✅ Yes
- **Query Params:**
  - `status` (optional) - ACTIVE, INACTIVE, TERMINATED
  - `department` (optional)
  - `search` (optional)
  - `page` (optional)
  - `limit` (optional)
- **Response:** `200`

### 3. Get Single Employee
- **Method:** `GET`
- **Path:** `/employees/:employeeId`
- **Auth Required:** ✅ Yes
- **Response:** `200`

### 4. Get Employee by User ID
- **Method:** `GET`
- **Path:** `/employees/user/:userId`
- **Auth Required:** ✅ Yes
- **Response:** `200`

### 5. Update Employee
- **Method:** `PUT`
- **Path:** `/employees/:employeeId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:** Any allowed fields (designation, department, salaryStructureId, status)
- **Response:** `200`

### 6. Terminate Employee
- **Method:** `POST`
- **Path:** `/employees/:employeeId/terminate`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:**
  ```json
  {
    "terminationDate": "2024-03-10",
    "terminationReason": "Voluntary Resignation",
    "exitNotes": "Employee resigned"
  }
  ```
- **Response:** `200`

### 7. Delete Employee
- **Method:** `DELETE`
- **Path:** `/employees/:employeeId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Response:** `200`

---

## Payroll Endpoints
**Base Path:** `/payroll`

### 1. Create Salary Structure
- **Method:** `POST`
- **Path:** `/payroll/structure/create`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Body:**
  ```json
  {
    "name": "Standard Operator",
    "branchId": "6xxxx",
    "baseSalary": 2000,
    "allowances": 500,
    "deductions": 100,
    "isActive": true
  }
  ```
- **Response:** `201`

### 2. Get Salary Structures
- **Method:** `GET`
- **Path:** `/payroll/structure/list`
- **Auth Required:** ✅ Yes
- **Query Params:**
  - `branchId` (optional)
  - `isActive` (optional) - true/false
- **Response:** `200`

### 3. Update Salary Structure
- **Method:** `PUT`
- **Path:** `/payroll/structure/:structureId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Body:** Any structure fields
- **Response:** `200`

### 4. Process Payroll
- **Method:** `POST`
- **Path:** `/payroll/process`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:**
  ```json
  {
    "employeeId": "6xxxx",
    "payrollMonth": "2024-03"
  }
  ```
- **Response:** `201`

### 5. Process Payroll for Branch
- **Method:** `POST`
- **Path:** `/payroll/process-branch`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Body:**
  ```json
  {
    "branchId": "6xxxx",
    "payrollMonth": "2024-03"
  }
  ```
- **Response:** `201`

### 6. Get Payroll Records
- **Method:** `GET`
- **Path:** `/payroll/list`
- **Auth Required:** ✅ Yes
- **Query Params:**
  - `employeeId` (optional)
  - `branchId` (optional)
  - `month` (optional) - Format: YYYY-MM
  - `status` (optional) - PENDING, PROCESSED, PAID
  - `page` (optional)
  - `limit` (optional)
- **Response:** `200`

### 7. Get Single Payroll
- **Method:** `GET`
- **Path:** `/payroll/:payrollId`
- **Auth Required:** ✅ Yes
- **Response:** `200`

### 8. Approve Payroll
- **Method:** `PUT`
- **Path:** `/payroll/:payrollId/approve`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Response:** `200`

### 9. Mark Payroll as Paid
- **Method:** `PUT`
- **Path:** `/payroll/:payrollId/mark-paid`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:**
  ```json
  {
    "paymentDate": "2024-03-05",
    "paymentMethod": "BANK_TRANSFER",
    "bankTransactionId": "TXN123456"
  }
  ```
- **Response:** `200`

### 10. Generate Salary Slip
- **Method:** `GET`
- **Path:** `/payroll/:payrollId/salary-slip`
- **Auth Required:** ✅ Yes
- **Response:** `200`

---

## Leave Endpoints
**Base Path:** `/leaves`

### 1. Create Leave Type
- **Method:** `POST`
- **Path:** `/leaves/type/create`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Body:**
  ```json
  {
    "name": "Annual Leave",
    "daysPerYear": 20,
    "description": "Paid annual leave"
  }
  ```
- **Response:** `201`

### 2. Get Leave Types
- **Method:** `GET`
- **Path:** `/leaves/type/list`
- **Auth Required:** ✅ Yes
- **Response:** `200`

### 3. Request Leave
- **Method:** `POST`
- **Path:** `/leaves/request`
- **Auth Required:** ✅ Yes
- **Body:**
  ```json
  {
    "employeeId": "6xxxx",
    "leaveTypeId": "6xxxx",
    "startDate": "2024-03-10",
    "endDate": "2024-03-15",
    "reason": "Personal reasons"
  }
  ```
- **Response:** `201`

### 4. Get All Leaves
- **Method:** `GET`
- **Path:** `/leaves/list`
- **Auth Required:** ✅ Yes
- **Query Params:**
  - `employeeId` (optional)
  - `status` (optional) - PENDING, APPROVED, REJECTED
  - `page` (optional)
  - `limit` (optional)
- **Response:** `200`

### 5. Get Single Leave
- **Method:** `GET`
- **Path:** `/leaves/:leaveId`
- **Auth Required:** ✅ Yes
- **Response:** `200`

### 6. Approve Leave
- **Method:** `PUT`
- **Path:** `/leaves/:leaveId/approve`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Response:** `200`

### 7. Reject Leave
- **Method:** `PUT`
- **Path:** `/leaves/:leaveId/reject`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:**
  ```json
  {
    "rejectionReason": "Insufficient staffing"
  }
  ```
- **Response:** `200`

### 8. Cancel Leave
- **Method:** `PUT`
- **Path:** `/leaves/:leaveId/cancel`
- **Auth Required:** ✅ Yes (Employee can cancel own leave)
- **Response:** `200`

### 9. Get Leave Balance
- **Method:** `GET`
- **Path:** `/leaves/balance/:employeeId`
- **Auth Required:** ✅ Yes
- **Response:** `200`

---

## User Management Endpoints
**Base Path:** `/users`

### 1. Get All Users
- **Method:** `GET`
- **Path:** `/users`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Response:** `200`

### 2. Get Single User
- **Method:** `GET`
- **Path:** `/users/:userId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Response:** `200`

### 3. Update User
- **Method:** `PUT`
- **Path:** `/users/:userId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Body:**
  ```json
  {
    "fullname": "Updated Name",
    "email": "user@example.com",
    "avatar": "file_upload"
  }
  ```
- **Response:** `200`

### 4. Delete User
- **Method:** `DELETE`
- **Path:** `/users/:userId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Response:** `200`

---

## Branch Management Endpoints
**Base Path:** `/branch`

### 1. Create Branch
- **Method:** `POST`
- **Path:** `/branch`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Body:**
  ```json
  {
    "name": "Downtown Branch",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    },
    "email": "downtown@klean.com",
    "contactNumber": "+1234567890",
    "servicesOffered": ["WASH_FOLD", "IRONING", "DRY_CLEANING"],
    "operatingHours": "9 AM - 6 PM",
    "manager": "manager_user_id" // Optional
  }
  ```
- **Response:** `201`
  ```json
  {
    "success": true,
    "message": "Branch created successfully",
    "data": {
      "branch": {
        "_id": "branch_id",
        "name": "Downtown Branch",
        "address": {
          "street": "123 Main Street",
          "city": "New York",
          "state": "NY",
          "zip": "10001"
        },
        "email": "downtown@klean.com",
        "contactNumber": "+1234567890",
        "branchCode": "DOW-01",
        "servicesOffered": ["WASH_FOLD", "IRONING", "DRY_CLEANING"],
        "operatingHours": "9 AM - 6 PM",
        "manager": null,
        "isActive": true,
        "totalOrders": 0,
        "totalRevenue": 0
      }
    }
  }
  ```

### 2. Get All Branches
- **Method:** `GET`
- **Path:** `/branch`
- **Auth Required:** ✅ Yes
- **Query Parameters:**
  - `isActive` (optional): Filter by active status (`true`/`false`)
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Branches retrieved",
    "data": {
      "branches": [
        {
          "_id": "branch_id",
          "name": "Downtown Branch",
          "address": {
            "street": "123 Main Street",
            "city": "New York",
            "state": "NY",
            "zip": "10001"
          },
          "email": "downtown@klean.com",
          "contactNumber": "+1234567890",
          "branchCode": "DOW-01",
          "servicesOffered": ["WASH_FOLD", "IRONING", "DRY_CLEANING"],
          "operatingHours": "9 AM - 6 PM",
          "manager": {
            "_id": "manager_id",
            "fullname": "John Smith",
            "email": "manager@klean.com"
          },
          "isActive": true,
          "totalOrders": 150,
          "totalRevenue": 25000
        }
      ],
      "pagination": {
        "total": 25,
        "page": 1,
        "pages": 3
      }
    }
  }
  ```

### 3. Get Branch by ID
- **Method:** `GET`
- **Path:** `/branch/:branchId`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `branchId`: Branch ID
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Branch retrieved",
    "data": {
      "branch": {
        "_id": "branch_id",
        "name": "Downtown Branch",
        "address": {
          "street": "123 Main Street",
          "city": "New York",
          "state": "NY",
          "zip": "10001"
        },
        "email": "downtown@klean.com",
        "contactNumber": "+1234567890",
        "branchCode": "DOW-01",
        "servicesOffered": ["WASH_FOLD", "IRONING", "DRY_CLEANING"],
        "operatingHours": "9 AM - 6 PM",
        "manager": {
          "_id": "manager_id",
          "fullname": "John Smith",
          "email": "manager@klean.com"
        },
        "isActive": true,
        "totalOrders": 150,
        "totalRevenue": 25000
      }
    }
  }
  ```

### 4. Update Branch
- **Method:** `PUT`
- **Path:** `/branch/:branchId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Path Parameters:**
  - `branchId`: Branch ID
- **Body:**
  ```json
  {
    "name": "Updated Downtown Branch",
    "address": {
      "street": "456 Updated Street",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    },
    "email": "updated@klean.com",
    "contactNumber": "+1234567890",
    "servicesOffered": ["WASH_FOLD", "IRONING", "DRY_CLEANING", "PICKUP"],
    "operatingHours": "8 AM - 7 PM",
    "manager": "new_manager_id",
    "isActive": true
  }
  ```
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Branch updated successfully",
    "data": {
      "branch": {
        "_id": "branch_id",
        "name": "Updated Downtown Branch",
        "address": {
          "street": "456 Updated Street",
          "city": "New York",
          "state": "NY",
          "zip": "10001"
        },
        "email": "updated@klean.com",
        "contactNumber": "+1234567890",
        "branchCode": "UPD-01",
        "servicesOffered": ["WASH_FOLD", "IRONING", "DRY_CLEANING", "PICKUP"],
        "operatingHours": "8 AM - 7 PM",
        "manager": {
          "_id": "new_manager_id",
          "fullname": "Jane Doe",
          "email": "jane@klean.com"
        },
        "isActive": true
      }
    }
  }
  ```

### 5. Delete Branch
- **Method:** `DELETE`
- **Path:** `/branch/:branchId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Path Parameters:**
  - `branchId`: Branch ID
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Branch deleted successfully"
  }
  ```

---

## Branch Manager Management Endpoints
**Base Path:** `/branch-managers`

### 1. Create Branch Manager
- **Method:** `POST`
- **Path:** `/branch-managers`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Body:**
  ```json
  {
    "fullname": "John Smith",
    "email": "manager@branch.com",
    "phoneNumber": "+1234567890",
    "password": "SecurePass123!",
    "branchId": "branch_id_here",
    "designation": "Branch Manager",
    "department": "Operations"
  }
  ```
- **Response:** `201`
  ```json
  {
    "success": true,
    "message": "Branch manager created successfully",
    "data": {
      "_id": "user_id",
      "fullname": "John Smith",
      "email": "manager@branch.com",
      "role": "BRANCH_MANAGER",
      "branchId": "branch_id",
      "designation": "Branch Manager"
    }
  }
  ```

### 2. Get All Branch Managers
- **Method:** `GET`
- **Path:** `/branch-managers`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
  - `search` (optional): Search by name or email
  - `branchId` (optional): Filter by branch (SUPER_ADMIN only)
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Branch managers retrieved successfully",
    "data": {
      "pagination": {
        "total": 25,
        "page": 1,
        "pages": 3
      },
      "managers": [
        {
          "_id": "user_id",
          "fullname": "John Smith",
          "email": "manager@branch.com",
          "branchId": {
            "_id": "branch_id",
            "name": "Downtown Branch"
          },
          "designation": "Branch Manager",
          "status": "active"
        }
      ]
    }
  }
  ```

### 3. Get Branch Manager by ID
- **Method:** `GET`
- **Path:** `/branch-managers/:userId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN, BRANCH_MANAGER)
- **Path Parameters:**
  - `userId`: Branch manager user ID
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Branch manager retrieved",
    "data": {
      "manager": {
        "_id": "user_id",
        "fullname": "John Smith",
        "email": "manager@branch.com",
        "branchId": {
          "_id": "branch_id",
          "name": "Downtown Branch"
        },
        "designation": "Branch Manager",
        "status": "active"
      }
    }
  }
  ```

### 4. Update Branch Manager
- **Method:** `PUT`
- **Path:** `/branch-managers/:userId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Path Parameters:**
  - `userId`: Branch manager user ID
- **Body:**
  ```json
  {
    "fullname": "Updated Name",
    "email": "newemail@branch.com",
    "phoneNumber": "+1234567890",
    "branchId": "new_branch_id",
    "designation": "Senior Branch Manager",
    "department": "Operations",
    "status": "active"
  }
  ```
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Branch manager updated",
    "data": {
      "_id": "user_id",
      "fullname": "Updated Name",
      "email": "newemail@branch.com",
      "branchId": "new_branch_id",
      "designation": "Senior Branch Manager"
    }
  }
  ```

### 5. Delete Branch Manager
- **Method:** `DELETE`
- **Path:** `/branch-managers/:userId`
- **Auth Required:** ✅ Yes (SUPER_ADMIN only)
- **Path Parameters:**
  - `userId`: Branch manager user ID
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Branch manager deleted"
  }
  ```

---

## Health Check
**Base Path:** `/`

### Health Check Endpoint
- **Method:** `GET`
- **Path:** `/api/v1/health`
- **Auth Required:** ❌ No
- **Response:** `200`
  ```json
  {
    "success": true,
    "message": "Server is running"
  }
  ```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["field error 1", "field error 2"]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Server Error

---

## Roles & Permissions

### Available Roles
- **SUPER_ADMIN** - Full system access
- **BRANCH_MANAGER** - Branch-level access
- **STAFF** - Limited operational access
- **CUSTOMER** - Self-service only

### Permission Matrix

| Endpoint | SUPER_ADMIN | BRANCH_MANAGER | STAFF | CUSTOMER |
|----------|:-----------:|:--------------:|:-----:|:--------:|
| Create Order | ✅ | ✅ | ❌ | ✅ |
| Onboard Employee | ✅ | ✅ | ❌ | ❌ |
| Process Payroll | ✅ | ✅ | ❌ | ❌ |
| View Dashboard | ✅ | ✅ | ❌ | ❌ |
| Update Order Status | ✅ | ✅ | ✅ | ❌ |
| Delete User | ✅ | ❌ | ❌ | ❌ |

---

## Rate Limiting
- Auth endpoints: **5 requests per 15 minutes**
- Other endpoints: **100 requests per 15 minutes**

---

## Contact Support
For API issues or questions, contact the development team or refer to the technical documentation.

