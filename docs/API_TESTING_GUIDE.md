# API Testing Guide

## Setup

1. Copy `.env.example` (if available) or create `.env`.
2. Ensure the following values are configured correctly:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` (for file uploads)
   - `RESEND_API_KEY` or `SENDGRID_API_KEY` (for email delivery)
3. Start the server:
   ```bash
   npm run dev
   ```

## Authorization

- Most protected endpoints require a Bearer token in the `Authorization` header:
  ```http
  Authorization: Bearer <access-token>
  ```
- Obtain the token via `POST /api/v1/auth/login`.
- Use the refresh endpoint `POST /api/v1/auth/refresh-token` to renew expired access tokens.

## Recommended Testing Tools

- Postman
- Insomnia
- curl
- HTTP client built into VS Code

## Common Requests

### Login

`POST /api/v1/auth/login`

Headers:
- `Content-Type: application/json`

Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User

`GET /api/v1/users/me`

Headers:
- `Authorization: Bearer <access-token>`

### Create Order

`POST /api/v1/orders`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <access-token>`

Body example:
```json
{
  "customerId": "<customerId>",
  "items": [
    { "productId": "<productId>", "quantity": 2 }
  ],
  "branchId": "<branchId>",
  "total": 120.50
}
```

## Swagger UI

- Browse the generated API documentation at `/api/v1/docs`
- Use `/api/v1/docs.json` to inspect the raw OpenAPI schema

## Rate Limiting

- Authentication routes use stricter throttling for refresh and login flows.
- General API rate limiting is enforced through Redis with fallback to memory.

## Running Automated Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Troubleshooting

- If authentication fails, verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set and at least 32 characters long.
- If Redis is unavailable, the app degrades gracefully and continues with in-memory limits.
- For file upload errors, verify Cloudinary credentials and `uploadMiddleware` configuration.
