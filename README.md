# TaskFlow

![TaskFlow logo](https://img.shields.io/badge/TaskFlow-Auth-blue?style=for-the-badge&logo=lock)

> A simple, secure authentication backend (TypeScript + Express + Prisma) with optional 2FA support.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-%2357A0CE.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16.x-green?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/R7rainz/TaskFlow/pulls)

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

## Project structure

Brief overview of the primary files and folders you'll see in this repo:

- `src/` — TypeScript source files
  - `index.ts` — application entry point
  - `controllers/` — Express controllers (auth, 2FA)
  - `services/` — business logic and integrations (authServices, emailService, twoFactorService)
  - `routes/` — route definitions (v1)
  - `middleware/` — Express middleware (auth, rate limiting)
  - `validators/` — request validation logic
  - `types/` — shared TypeScript types
- `prisma/` — Prisma schema and migrations
- `generate/` — generated Prisma client (do not commit; listed for context)
- `.env*` and `prod.env` — environment variable files (ignored in git)
- `README.md`, `package.json`, `tsconfig.json`, `Dockerfile` — repo metadata and build config

This structure keeps clear separation between HTTP handling (controllers/routes) and business logic (services), making unit testing and maintenance easier.

## Maintenance & contribution guidelines

This project follows a lightweight maintenance workflow to keep the repo clean and stable:

- Branching: use topic branches from `master` (or create a `main` branch if you prefer). Prefix branch names with the issue or feature, e.g. `feat/2fa-setup` or `fix/login-guard`.
- Commits: follow Conventional Commits (e.g., `feat(...)`, `fix(...)`, `chore(...)`) so changelogs can be generated later.
- Pull requests: open PRs for all changes; include a description of the change and link to any related issues. Keep PRs small and focused.
- Code style: keep TypeScript strict (tsconfig) and prefer small, well-tested functions in `services/`.
- Tests: add unit tests (Jest/Vitest) for `services/` and integration tests (supertest) for critical endpoints.

### Releasing and dependency updates

- Use `pnpm` to manage dependencies. Run `pnpm up` to update dependencies and test locally before committing.
- Consider Dependabot or GitHub Actions to automatically open PRs for dependency updates.

### Security and secrets

- Never commit secrets. Use `.gitignore` (already configured) and keep production secrets in a secret manager or via the deployment platform.
- Rotate JWT/refresh secrets periodically and store them in a secure vault.

## Support & contact

For questions or to report bugs, open an issue in the repository. If you want direct help with setup, tell me what environment you deploy to (Docker, DigitalOcean, Kubernetes) and I can provide tailored instructions.

## Docker (deployment)

This repository documents a single-container Docker deployment (build + run) since you deploy with Docker directly. If you use a multi-service orchestration later you can add a `docker-compose.yml` or Kubernetes manifests.

Build and run (single container)

```sh
# build the image from the project root
docker build -t auth-backend:latest .

# run the container using an env file (recommended)
# create a `prod.env` file with your environment variables and do:
docker run -d \
	--name auth-backend \
	-p 8000:8000 \
	--env-file prod.env \
	auth-backend:latest
```

Notes

- Make sure the `PORT` value in `prod.env` matches the port you expose (the example uses `8000`). The project default in development is `4000` — keep them consistent.
- Use Docker secrets or your orchestration's secret management for production instead of plaintext env files.
- Build the app inside the image (`pnpm run build`) and use a multi-stage Dockerfile to produce a small production image.
- To run Prisma migrations, either run them before starting the container or exec into the container and run `pnpm prisma migrate deploy`.

If you'd like, I can add a minimal `Dockerfile` or a `prod.env.example` to this repo and commit them for you.

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
