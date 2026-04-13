# API Reference

## Authentication

### `POST /api/v1/auth/sign-up`
- Registers a new user
- Multipart/form-data supported for avatar upload
- Validation via `validateRegister`

### `POST /api/v1/auth/login`
- Authenticates a user and returns access and refresh tokens

### `POST /api/v1/auth/refresh-token`
- Refreshes JWT tokens
- Rate limited to 3 requests per 15 minutes

### `POST /api/v1/auth/logout`
- Requires authentication
- Revokes refresh session

### `POST /api/v1/auth/forgot-password`
- Sends a password reset link

### `PATCH /api/v1/auth/reset-password/:token`
- Resets password using a valid token

### `PATCH /api/v1/auth/change-password`
- Requires authentication
- Changes password for the current user

## Users

### `POST /api/v1/users`
- Create a user (Super Admin or Branch Manager only)

### `GET /api/v1/users`
- Lists users (Super Admin and Branch Manager only)

### `GET /api/v1/users/customers`
- Lists customer accounts

### `GET /api/v1/users/me`
- Gets current authenticated user

### `PUT /api/v1/users/me`
- Updates own profile

### `GET /api/v1/users/:userId`
- Gets a user by ID (Super Admin and Branch Manager only)

### `PUT /api/v1/users/:userId`
- Updates a user by ID

### `PATCH /api/v1/users/:userId/status`
- Soft-delete or disable a user

### `DELETE /api/v1/users/:userId`
- Deletes a user (Super Admin only)

## Branches

### `POST /api/v1/branch`
- Create a branch (Super Admin only)
- **Request Body**:
  - `name` (string, required): Branch name (min 2 characters)
  - `address` (object, required): Address with `street`, `city`, `state`, `zip`
  - `email` (string, required): Branch email
  - `contactNumber` (string, required): Phone number (7-15 digits)
  - `servicesOffered` (array, required): Array of services (e.g., ["WASH_FOLD", "DELIVERY"])
  - `operatingHours` (string, optional): Operating hours
  - `managerId` (string, optional): User ID of the branch manager (can be assigned later)
- **Validation**: Input validated for format and required fields before processing
- **Notes**: Branches can be created without a manager initially, allowing for separate manager assignment workflow

### `GET /api/v1/branch`
- List branches (all authenticated users)
- **Query Params**: `isActive` (boolean), `page` (number), `limit` (number, max 100)

### `GET /api/v1/branch/:branchId`
- Get branch details (all authenticated users)
- **Path Params**: `branchId` (string)

### `PUT /api/v1/branch/:branchId`
- Update branch (Super Admin only)
- **Request Body**: Same as create, all fields optional
- **Validation**: Input validated for format before processing

### `DELETE /api/v1/branch/:branchId`
- Delete branch (Super Admin only)
- **Path Params**: `branchId` (string)

## Branch Managers

### `POST /api/v1/branch-managers`
- Create a branch manager (Super Admin only)
- **Request Body**:
  - `fullname` (string, required): Full name
  - `email` (string, required): Email address
  - `phoneNumber` (string, required): Phone number
  - `password` (string, required): Password
  - `address` (string, optional): Address
  - `designation` (string, optional): Job designation
  - `department` (string, optional): Department
  - `branchId` (string, required): Branch ID to assign manager to
- **Validation**: Ensures branch exists, no duplicate managers per branch, unique email/phone
- **Notes**: Automatically assigns the manager to the specified branch and updates branch's manager field

### `GET /api/v1/branch-managers`
- List branch managers (Super Admin and Branch Manager)
- **Query Params**: `branchId`, `search`, `page`, `limit`

### `GET /api/v1/branch-managers/:userId`
- Get a branch manager by ID (Super Admin and Branch Manager)
- **Path Params**: `userId` (string)

### `PUT /api/v1/branch-managers/:userId`
- Update branch manager (Super Admin only)
- **Request Body**: Same as create, all fields optional

### `DELETE /api/v1/branch-managers/:userId`
- Delete branch manager (Super Admin only)
- **Path Params**: `userId` (string)

## Orders

### `POST /api/v1/orders`
- Create an order

### `GET /api/v1/orders`
- List orders

### `GET /api/v1/orders/:orderId`
- Get an order by ID

### `PUT /api/v1/orders/:orderId`
- Update an order

### `PUT /api/v1/orders/:orderId/mark-paid`
- Mark an order as paid

### `PATCH /api/v1/orders/:orderId/status`
- Update order status

### `DELETE /api/v1/orders/:orderId`
- Delete an order

## Inventory

### `GET /api/v1/inventory/low-stock`
- List low stock items (Super Admin and Branch Manager only)

### `POST /api/v1/inventory`
- Add inventory item

### `GET /api/v1/inventory/branch/:branchId`
- Inventory items by branch

### `PUT /api/v1/inventory/:itemId`
- Update inventory item

### `PATCH /api/v1/inventory/:itemId/adjust`
- Adjust stock quantity

### `DELETE /api/v1/inventory/:itemId`
- Delete inventory item

## Notifications

### `GET /api/v1/notifications`
- Get notifications for the authenticated user

### `PUT /api/v1/notifications/:notificationId/read`
- Mark a notification as read

### `PUT /api/v1/notifications/mark-all-read`
- Mark all notifications as read

### `DELETE /api/v1/notifications/:notificationId`
- Delete a notification

## Low Stock Alerts

### `GET /api/v1/notifications/low-stock/alerts`
- List low stock alerts

### `PUT /api/v1/notifications/low-stock/alerts/:alertId/resolve`
- Resolve a low stock alert

### `POST /api/v1/notifications/low-stock/check`
- Trigger a manual low stock check

## Invoices

### `POST /api/v1/invoices`
- Create an invoice

### `GET /api/v1/invoices/my-invoices`
- Get the authenticated user’s invoices

### `GET /api/v1/invoices/:id`
- Get invoice by ID

### `GET /api/v1/invoices/:id/download`
- Download invoice PDF

## Analytics

### `GET /api/v1/analytics/dashboard`
- Fetch dashboard analytics data

### `GET /api/v1/analytics/period`
- Fetch analytics for a date period

### `GET /api/v1/analytics/daily`
- Fetch daily analytics

### `GET /api/v1/analytics/orders/trends`
- Get order trend analytics

### `GET /api/v1/analytics/revenue`
- Revenue analytics

### `GET /api/v1/analytics/customers`
- Customer analytics

### `POST /api/v1/analytics/export/pdf`
- Export dashboard report as PDF

## Payroll

### `POST /api/v1/payroll/structure/create`
- Create a salary structure

### `GET /api/v1/payroll/structure/list`
- List salary structures

### `PUT /api/v1/payroll/structure/:structureId`
- Update salary structure

### `POST /api/v1/payroll/process`
- Process payroll

### `POST /api/v1/payroll/process-branch`
- Process payroll for a branch

### `GET /api/v1/payroll/list`
- List payroll records

### `GET /api/v1/payroll/:payrollId`
- Get a payroll record

### `PUT /api/v1/payroll/:payrollId/approve`
- Approve payroll

### `PUT /api/v1/payroll/:payrollId/mark-paid`
- Mark payroll as paid

### `GET /api/v1/payroll/:payrollId/salary-slip`
- Download or generate salary slip PDF

## Leave Management

### `POST /api/v1/leaves/type/create`
- Create a leave type

### `GET /api/v1/leaves/type/list`
- List leave types

### `POST /api/v1/leaves/request`
- Request leave

### `GET /api/v1/leaves/list`
- List leave requests

### `GET /api/v1/leaves/:leaveId`
- Get leave details

### `PUT /api/v1/leaves/:leaveId/approve`
- Approve leave

### `PUT /api/v1/leaves/:leaveId/reject`
- Reject leave

### `PUT /api/v1/leaves/:leaveId/cancel`
- Cancel leave request

### `GET /api/v1/leaves/balance/:employeeId`
- Get leave balance for an employee
