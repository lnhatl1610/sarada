# Sarada — Agent Guide

Single-vendor fashion store branded Sarada: `api/` Laravel REST API, `admin/` React admin SPA, `storefront/` React storefront SPA. Product and UI language is Vietnamese; currency is integer VND; checkout uses COD.

## Commands
- Start all local apps from the repository root with `npm run dev` (after `npm install`).
- API: `cd api; php -d upload_max_filesize=6M -d post_max_size=18M artisan serve` (supports product images and review videos up to 5 MB with multiple image attachments); format PHP with `vendor/bin/pint --dirty --format agent`.
- Frontends: `cd admin` or `cd storefront`; `npm run dev`, `npm run lint`, `npm run build`.
- Local prerequisites: PHP/Composer, Node.js/npm, and a local MySQL service.
- Do not run tests unless the user asks for testing/verification.

## Invariants
- Controllers validate through Form Requests, delegate business work to domain actions/services, and return API Resources.
- Recalculate prices, shipping, discounts, and totals on the server. Never trust client-supplied prices.
- Store money as integer VND; never use floating point for money.
- Order state changes go through the order state machine and create history records.
- Inventory and checkout changes are transactional and lock inventory rows.
- Enforce authorization in the API with policies/permissions. Frontend guards only control presentation.
- Access JWTs stay in memory. Refresh tokens are httpOnly cookies; never put auth tokens in localStorage.
- Guest cart identifiers are not authentication credentials and may be stored client-side.
- Use TanStack Query for remote state, React Hook Form + Zod for forms, and feature-oriented React modules.
- Frontend/UI implementation rules, the feature template, and the UI acceptance checklist are maintained in `docs/architecture/frontend-architecture.md`; follow them alongside the applicable design skill.
- Never edit a migration that has already been applied; add a new migration.
- Keep secrets out of source control; edit `.env.example`, never commit `.env` values.

## Read by task
- Product scope and assumptions: `docs/requirements/vision-scope.md`, `docs/requirements/open-questions.md`.
- Requirements and business rules: `docs/requirements/`.
- Architecture index: `README.md` (Architecture section); system map: `docs/architecture/system-overview.md`.
- Database/API/auth/backend/frontend conventions: `docs/architecture/data-model.md`, `docs/architecture/api-conventions.md`, `docs/architecture/auth-rbac.md`, `docs/architecture/backend-architecture.md`, `docs/architecture/frontend-architecture.md`.
- Business process: `docs/business-flows/`; UI: `docs/ui-ux/`; decisions: `docs/adr/`.
- Feature acceptance and task plans: `specs/`.
- Reusable workflows: `.agents/skills/`.
- Current progress: `PROGRESS.md`.

## Workflow
1. Read the feature spec, linked requirement IDs, and relevant domain docs.
2. Use the matching repo skill when one exists.
3. Keep API contract, backend, frontend types, UI states, and documentation aligned.
4. Update `PROGRESS.md` and the relevant docs/spec when behavior or scope changes.
5. Do not claim tests or checks passed unless they were explicitly requested and run.

## Area-specific guidance
- Laravel: `api/AGENTS.md`.
- Admin UI: `admin/AGENTS.md`.
- Storefront UI: `storefront/AGENTS.md`.
