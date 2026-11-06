# API Agent Guide

Backend architecture is maintained centrally in `docs/architecture/backend-architecture.md` at the repository root.

Laravel 13 REST API. Follow the existing modular routing under `app/Modules/*/Routes/` and keep domain code isolated by module.

- Read root `AGENTS.md` and the relevant `docs/` plus `specs/` before changing behavior.
- Follow the backend rules in `docs/architecture/backend-architecture.md` and the root `.agents/skills/laravel-api-resource/` or `.agents/skills/laravel-domain-action/` workflow that matches the task.
- When the user asks for tests, cover observable behavior and API contracts, inspect nearby tests for conventions, and use the installed PHPUnit/Laravel features.
- Confirm package APIs against the installed version. Do not add dependencies beyond the approved project plan.
- Controllers stay thin; validate with Form Requests; return API Resources; enforce access in policies/middleware.
- Money is integer VND. Checkout, coupons, and inventory use transactions and row locks.
- Never trust client price, status, role, or permission values.
- Preserve the module route files and namespace; do not move the app into a different architecture without an ADR.
- Use Artisan generators for Laravel classes/migrations. Format changed PHP with `vendor/bin/pint --dirty --format agent`.
- Keep `.env` and database contents private.
