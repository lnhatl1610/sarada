# ADR-0009: Centralize stock mutations in the Inventory domain service

- Status: Accepted
- Date: 2026-10-23
- Decision owners: Product owner

## Context

Stock was being reserved in checkout, released or sold during order transitions, initialized by catalog controllers, and adjusted/imported by admin endpoints. Each path wrote inventory rows and movement records separately, increasing the chance of missing ledger entries or bypassing row locks. The system prioritizes stock correctness and has no external inventory service.

## Options considered

- Keep stock updates in each calling module: avoids cross-module calls, but duplicates locking, validation, and ledger rules across checkout, orders, catalog, and admin.
- Put the shared operations in `app/Support`: makes the dependency visibly shared, but moves inventory-specific business rules outside their owning domain and requires a broader abstraction.
- Keep a public `InventoryService` in the Inventory module and have business workflows call it: preserves one owner for stock rules and uses the existing service boundary with a direct, testable dependency.

## Decision

Use `App\Modules\Inventory\Services\InventoryService` as the stable stock mutation boundary. It owns quantity changes, `inventory_movements`, and `sold_count` updates. Checkout and order-state actions call it from their existing enclosing transactions; admin controllers go through `AdjustInventoryAction`; catalog flows use it to initialize variant inventory.

## Consequences and risks

- Stock mutation logic and movement creation have one owner; all writes lock the relevant inventory row.
- Checkout and Orders depend on this public Inventory service. This is an intentional domain dependency; callers must keep their encompassing transaction so order, coupon, and stock updates remain atomic.
- Nested service transactions participate in the outer transaction. Any later failure in the order operation rolls back the inventory changes and movement rows as well.
- The service is covered by API tests for admin import/adjustment and order cancellation, delivery, and return flows. Concurrent checkout stress coverage remains a separate verification item.

## Rollback

Move each caller back only if inventory ownership changes again, preserving the row locks and movement assertions. No database migration is required for this decision.
