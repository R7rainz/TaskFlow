# Contributing to TaskFlow

Thanks for your interest in contributing to TaskFlow! This document describes a small, lightweight workflow to keep the repository consistent and easy to maintain.

Getting started

1. Fork the repository and create a topic branch for your change. Use descriptive branch names, e.g. `feat/2fa-setup` or `fix/login-guard`.
2. Make small, focused commits. Follow Conventional Commits where possible (`feat:`, `fix:`, `chore:`, `docs:`).
3. Run tests and linters locally (add tests where appropriate).
4. Open a Pull Request describing the change and link related issues.

Code style and quality

- Keep functions small and focused; put business logic in `src/services/` and keep controllers thin.
- Add unit tests for logic in `services/` and integration tests for HTTP endpoints (e.g., using `supertest`).
- Keep TypeScript `strict` enabled. Run `pnpm run build` to confirm TypeScript compiles.

Commit messages

- Use Conventional Commits to allow automated changelog generation. Examples:
  - `feat(auth): add refresh token rotation`
  - `fix(login): handle missing user in login result`

Pull request checklist

- [ ] My code builds (pnpm run build).
- [ ] I added or updated tests where applicable.
- [ ] I added or updated documentation in the README if needed.

Thank you for contributing!
