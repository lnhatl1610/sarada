---
name: laravel-domain-action
description: Use when implementing a new business operation or non-trivial backend behavior in a Sarada Laravel domain module.
---

# Domain Action

1. Identify the owning module and read its docs/spec plus `docs/architecture/backend-architecture.md`.
2. Model one operation as a focused Action; extract a Service only for cohesive reusable domain behavior.
3. Validate input at HTTP boundary; pass explicit typed data into domain logic.
4. Use a transaction and row locks for inventory, coupon limits, or order state changes.
5. Emit events only after commit for notifications/analytics. Make queued jobs retry-safe.
6. Keep module dependencies pointed at stable contracts/support; update docs/ADR/static boundary config for boundary changes.
7. Use tests only when requested; never claim unrun checks.

See `references/layering.md`.
