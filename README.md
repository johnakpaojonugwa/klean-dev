# Klean Management Backend

A modular Node.js backend for laundry and service management with Express, MongoDB, Redis, JWT authentication, and Swagger API documentation.

## Key Features

- User authentication and session management
- Role-based authorization for Super Admin, Branch Manager, Staff, and Customers
- Branch and employee management with flexible manager assignment
- Order, inventory, invoice, and notification workflows
- Analytics dashboards and exportable reports
- Health checks and Swagger API documentation for easy discovery
- Cloudinary file uploads for user avatars and asset storage
- Redis-backed rate limiting with fallback to local memory
- Scheduled jobs and audit logging utilities
- Input validation middleware for data integrity

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file at the project root with required environment variables.
3. Run the server:
   ```bash
   npm run dev
   ```
4. Visit the API docs at `http://localhost:3000/api/v1/docs`.

## Environment Variables

Required:
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Optional but recommended in production:
- `RESEND_API_KEY` or `SENDGRID_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `CLOUD_NAME`
- `CLOUD_API_KEY`
- `CLOUD_API_SECRET`
- `SENTRY_DSN`
- `CORS_ORIGIN`
- `REQUEST_TIMEOUT`
- `NODE_ENV`

## API Overview

Base URL: `/api/v1`

### Public endpoints
- `GET /api/v1/health`
- `GET /api/v1/docs`
- `GET /api/v1/docs.json`
- `POST /api/v1/auth/sign-up`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `PATCH /api/v1/auth/reset-password/:token`

### Authentication-protected resources
- `POST /api/v1/auth/logout`
- `PATCH /api/v1/auth/change-password`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `POST /api/v1/inventory`
- `GET /api/v1/notifications`
- `GET /api/v1/analytics/*`

## Project Structure

- `server.js` — app bootstrap, middleware, route registration, service initialization
- `routes/` — route definitions grouped by feature
- `controllers/` — request handlers and business logic
- `models/` — Mongoose schemas and data models
- `middlewares/` — authentication, authorization, validation, error handling, rate limiting
- `services/` — Redis, analytics, notification, payroll, and other shared services
- `utils/` — helper modules for logging, response formatting, file upload, email, and scheduling
- `tests/` — integration and unit tests with Jest

## Testing

- `npm test`
- `npm run test:watch`
- `npm run test:coverage`

## Notes

- Swagger UI is available at `/api/v1/docs`.
- The application validates critical production credentials before startup.
- Redis is used for rate limiting and caching when available, with graceful fallback.
