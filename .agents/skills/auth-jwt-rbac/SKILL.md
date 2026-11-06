---
name: auth-jwt-rbac
description: Use when changing login, JWT claims, refresh cookies, session revocation, roles, permissions, policies, route guards, or account security.
---

# Authentication and Authorization

1. Read `docs/architecture/auth-rbac.md`, `docs/architecture/security.md`, and `docs/diagrams/auth-flow.mmd`.
2. Maintain short-lived audience-scoped access JWTs; hold them only in frontend memory.
3. Persist only hashes of random refresh tokens; rotate atomically and revoke family on reuse/logout/reset.
4. Enforce audience and permission on every API route; frontend visibility is only a UX hint.
5. Seed permission names in `resource.action` form and map them to policies/gates.
6. Update cookie/CORS/CSRF guidance, OpenAPI, and security acceptance criteria.
7. Treat token values as secrets in logs, errors, screenshots, and test fixtures.
