# ADR 0013: Admin passkeys over the existing JWT API

- Status: Superseded on 2026-11-04. Passkey support was removed because it is outside the current product scope; its table is dropped by the optional identity/admin cleanup migration.
- Historical decision and implementation details are retained below for context only.


- Status: Accepted
- Context: The account plan requires WebAuthn passkey enrollment and passwordless admin login, while the API issues audience-scoped JWTs with rotating httpOnly refresh cookies. Passkeys must follow that session flow and must not create a parallel web-session authentication path. The plan's suggested `laragear/webauthn` package has been superseded by Laravel's `laravel/passkeys` package.
- Options:
  1. Use `laravel/passkeys` and `@laravel/passkeys`, disable their default web-session routes, and adapt the package's WebAuthn actions to the existing admin API and JWT session issuer. This reuses protocol validation and the supported browser client; route, challenge-session, and response integration require app-owned code.
  2. Use `web-auth/webauthn-lib` directly. This avoids framework route assumptions but requires the application to own credential persistence, challenge handling, origin/RP validation, ceremony verification, and protocol upgrades.
- Decision: Use `laravel/passkeys` plus `@laravel/passkeys`; keep API route ownership, admin audience checks, 2FA policy, and JWT/refresh issuance in Sarada. Add only new migrations and require HTTPS plus an exact configured origin/RP ID outside localhost.
- Consequences: WebAuthn ceremony validation comes from the library and the SPA uses the matching browser client. Custom endpoints must keep challenge state session-backed and must issue the same revocable JWT/refresh credentials as password login. The package's default stateful web-login routes stay disabled.
- Migration/rollback: Add the package migration for passkey credentials as a new additive migration and add `passkey` to the login-result enum through a new migration if the existing database requires it. Rollback removes the additive credential table and package dependency; registered passkeys then stop working. Never edit or rerun already-applied migrations.
