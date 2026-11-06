# Implementation Plan: Checkout and Orders

1. Implement price/coupon/shipping calculation and preview.
2. Implement idempotent transactional place/cancel actions, row locks, snapshots, inventory and coupon reversals.
3. Implement state machine, status history, COD payment handling, guest track and account views.
4. Add queued post-commit email, OpenAPI contract, UI and business-flow docs.
