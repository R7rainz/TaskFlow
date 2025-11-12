## TaskFlow API Documentation

Base path: `/v1`

Authentication: Bearer JWT (send `Authorization: Bearer <token>` header for protected endpoints)

Contents
- Authentication endpoints (signup, signin, refresh, logout)
- Password reset (forgot/reset)
- Protected profile
- Two-factor authentication endpoints under `/v1/2fa`

Common request/response notes
- All requests and responses are JSON unless otherwise noted.
- Error responses use appropriate HTTP status codes and include a `message` or `error` field.

---

## Endpoints

### POST /v1/signup
Register a new user.

Request body:

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Str0ngP@ssw0rd"
}
```

Response (201):

```json
{
  "message": "User registered successfully",
  "user": { "id": "uuid", "name": "Alice", "email": "alice@example.com" }
}
```

---

### POST /v1/signin
Login with email/password. If user has 2FA enabled, the response will indicate `requires2Fa: true` and include `userId`.

Request body:

```json
{ "email": "alice@example.com", "password": "Str0ngP@ssw0rd" }
```

Responses:
- 200 (2FA required)

```json
{ "message": "Two-factor authentication required", "requires2Fa": true, "userId": "..." }
```

- 200 (successful login)

```json
{
  "message": "User logged in successfully",
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "..." },
  "refreshToken": "<refresh-token>"
}
```

---

### POST /v1/refresh
Exchange a refresh token for a new access token (and optionally a new refresh token depending on implementation).

Request body:

```json
{ "refreshToken": "<refresh-token>" }
```

Response (200):

```json
{ "token": "<new-jwt>", "refreshToken": "<new-refresh-token>" }
```

---

### POST /v1/forgot-password
Request a password reset email (returns a reset token for testing environments).

Request body:

```json
{ "email": "alice@example.com" }
```

Response (200):

```json
{ "message": "Reset instructions sent", "resetToken": "<token-for-testing>" }
```

---

### POST /v1/reset-password
Reset password using the token sent to the user's email.

Request body:

```json
{ "token": "<reset-token>", "newPassword": "N3wP@ssw0rd" }
```

Response (200):

```json
{ "message": "Password has been reset successfully" }
```

---

### POST /v1/logout
Invalidate a refresh token and (optionally) the current access token.

Headers:
- Authorization: Bearer <access-token>

Request body:

```json
{ "refreshToken": "<refresh-token>" }
```

Response (200):

```json
{ "message": "User logged out successfully" }
```

---

### GET /v1/profile
Protected route. Returns the authenticated user's data.

Headers:
- Authorization: Bearer <access-token>

Response (200):

```json
{ "message": "This is protected data!", "user": { ... } }
```

---

## Two-Factor Authentication (/v1/2fa)

All endpoints under `/v1/2fa` are described below.

### GET /v1/2fa/setup
Protected. Generate a TOTP secret and backup codes for the authenticated user.

Headers:
- Authorization: Bearer <access-token>

Response (200):

```json
{
  "qrCode": "data:image/png;base64,...",
  "manualEntryCode": "ABCDEF",
  "backupCodes": ["XXXXXXX", "YYYYYYY"],
  "encryptedSecret": "<encrypted-secret>"
}
```

### POST /v1/2fa/verify-otp
Protected. Verify an OTP and enable 2FA.

Request body:

```json
{ "otpCode": "123456", "tempEncryptedSecret": "...", "backupCodes": ["XXXXXXX",...] }
```

Response (200):

```json
{ "message": "2FA verified successfully", "backupCodes": ["...",...] }
```

### POST /v1/2fa/verify-backup
Protected. Verify using a backup code (enables 2FA and returns new data).

Request body:

```json
{ "backupCode": "ABCDEFG", "userEmail": "alice@example.com" }
```

Response (200):

```json
{ "message": "2FA verified successfully", "backupCodes": [...], "newSecret": "...", "qrCodeDataURL": "..." }
```

### POST /v1/2fa/verify-loginOTP-2fa
Verify an OTP for login flow when 2FA is required.

Request body:

```json
{ "userId": "...", "otpCode": "123456" }
```

Response (200):

```json
{ "message": "Login successfull", "user": {...}, "token": "...", "refreshToken": "..." }
```

### POST /v1/2fa/verify-loginbackupCode-2fa
Verify a backup code for login when 2FA is required.

Request body:

```json
{ "userId": "...", "backupCode": "ABCDEFG" }
```

Response (200):

```json
{ "message": "Login successfull", "user": {...}, "token": "...", "refreshToken": "...", "remainingBackupCodes": [...] }
```

---

## Authentication & headers

- Use `Authorization: Bearer <token>` for protected endpoints (profile, logout, 2FA setup/verify endpoints that require authentication).
- Content-Type: application/json for request bodies.

## Error handling

- 400 — Bad request (validation errors)
- 401 — Unauthorized (missing/invalid token)
- 403 — Forbidden (if applicable)
- 404 — Not found (user not found)
- 500 — Internal server error

---

If you'd like, I can also generate an OpenAPI YAML file and a Postman collection from this spec so it can be imported into API tooling. Tell me if you want the OpenAPI (YAML) and I'll add it as `openapi.yaml` in the repo.
