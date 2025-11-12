# TaskFlow

> A simple, secure authentication backend (TypeScript + Express + Prisma) with optional 2FA support.

This project implements user registration, login, password reset, and optional two-factor authentication using TOTP. It is intended as a focused authentication microservice that you can adapt into a larger system.

If you prefer a different name, suggestions: "AuthCore", "Gatekeeper", or "SecureAuthSvc".

## Features

- Email/password registration and login
- JWT access tokens and refresh tokens
- Optional TOTP two-factor authentication (speakeasy)
- Password reset via email (nodemailer)
- Prisma for database access and migrations
- Rate limiting and security middlewares (helmet, express-rate-limit)

## Quick start (development)

These commands are written for the fish shell (your default). Adjust if you're using bash/zsh.

1. Install dependencies

```fish
pnpm install
```

2. Create a `.env` file with the required environment variables (example below). You can use printf to write a template:

```fish
printf 'DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"\n\
PORT=4000\n\
JWT_SECRET="your_jwt_secret"\n\
REFRESH_TOKEN_SECRET="your_refresh_token_secret"\n\
SMTP_HOST=smtp.example.com\n\
SMTP_PORT=587\n\
SMTP_USER=your_smtp_user\n\
SMTP_PASS=your_smtp_password\n' > .env
```

3. Generate Prisma client and run migrations (development)

```fish
pnpm prisma generate
pnpm prisma migrate dev --name init
```

4. Run in development (watch)

```fish
pnpm run dev
```

5. Build and run production

```fish
pnpm run build
pnpm start
```

## Environment variables

At minimum you will want to set:

- DATABASE_URL — Prisma-compatible connection string
- PORT — server port (default: 4000)
- JWT_SECRET — secret used to sign access tokens
- REFRESH_TOKEN_SECRET — secret for refresh tokens
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — SMTP settings for sending reset emails
- EMAIL_FROM — optional "from" address for outgoing emails

Add any other environment keys used by your deployment/CI.

## Prisma

- Schema: `prisma/schema.prisma`
- Migrations are stored in `prisma/migrations`.

Common commands:

```fish
pnpm prisma migrate dev    # run migrations locally and generate client
pnpm prisma migrate deploy # run migrations in production
pnpm prisma studio         # open Prisma Studio
```

## Notes about Git and build artifacts

- `dist/` (compiled JS) is ignored by `.gitignore`. Build artifacts should not be committed. If you accidentally committed `dist/` in the past, the repository has a cleanup commit to remove tracked `dist/` files and `.gitignore` prevents re-adding them.
- Keep secrets out of git. This repository's `.gitignore` already contains `.env*` patterns.

## Tests

There are no tests included by default. I recommend adding a small test suite (Jest or Vitest) with:

- unit tests for authentication logic
- integration tests for the API endpoints (supertest)

## Contribution

If you plan to continue development:

1. Open issues for features you want (2FA UX, refresh token rotation, session invalidation)
2. Add tests for critical flows (login, registration, password reset)
3. Harden token handling and add rate limits where needed

## License

Choose a license: MIT is a common permissive choice. Add a `LICENSE` file if you want.

---

If you'd like, I can also:
- add a short `README` badge and a minimal `LICENSE` file;
- add example `.env.example` (without secrets);
- create basic tests and CI pipeline templates.

Tell me which extras you want and I'll add them next.
