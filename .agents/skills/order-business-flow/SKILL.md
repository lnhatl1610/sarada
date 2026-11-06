---
name: order-business-flow
description: Use when changing order transitions, checkout totals, stock reservation/release, coupon redemption, cancellation, or cart merge behavior.
---

# Order Business Flow

1. Read `docs/business-flows/` files relevant to the change and `docs/diagrams/order-state.mmd`.
2. Route every order transition through the state machine and write history.
3. Calculate item prices, discount, shipping, and total in a server-owned calculator.
4. Change inventory only through the inventory service and append movement records; lock rows inside transactions.
5. Reserve coupon use atomically; make cancellation reversals idempotent.
6. Update business flow docs, state diagram, feature spec, API contract, and acceptance cases.
7. Treat tests as required project work when the user requests testing; do not state that they passed otherwise.

See `references/state-table.md`.
