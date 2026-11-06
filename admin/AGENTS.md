# Admin Agent Guide

React + Vite + TypeScript application for staff operations.

- Follow root `AGENTS.md`; read `docs/architecture/frontend-architecture.md`, `docs/architecture/auth-rbac.md`, and the matching feature spec.
- Keep code feature-oriented under `src/features/`; shared UI belongs under `src/components/shared/`.
- Treat API data as remote state; use the shared query client and invalidate affected keys after mutations.
- Permission checks in the UI only hide controls. The API remains authoritative.
- Use Vietnamese copy, accessible labels/focus states, explicit loading/empty/error/success states, and responsive desktop/tablet layout.
- Follow `docs/ui-ux/component-guidelines.md` for shadcn/ui and shared component usage.
- Use the admin shell and semantic theme tokens documented in `docs/ui-ux/admin-app-shell.md` and `docs/ui-ux/DESIGN.md`; do not expose links to unfinished screens.
- Do not store access or refresh tokens in localStorage.
