# Implementation Plan: Authentication and RBAC

1. Add refresh-token persistence, role/permission seed data, JWT audience guards and refresh cookie rotation.
2. Add storefront/admin auth routes, Form Requests, Resources, policies, rate limits, and OpenAPI contract.
3. Implement API client refresh handling, login/register/recovery UI, permission-aware admin routes.
4. Update `docs/architecture/auth-rbac.md`, ADR 0001, and traceability.

Risks: cookie origin/path/SameSite behavior and revocation races. Keep rotation transactional and configure origins through env.
