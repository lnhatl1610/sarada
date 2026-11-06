# Spec: Inventory

## Goal
Maintain accurate available stock with a full ledger for sales, reservations, releases, receipts, and staff adjustments.

## Requirements
FR-INV-001..003, BR-INV-001..002.

## Acceptance criteria
- [x] Adjustment requires permission and reason, then writes a movement.
- [x] CSV import provides a template, applies valid receipts through the inventory adjustment action, reports row-level errors, and downloads the error rows.
- [x] Manual receipts search and select a variant, require a positive quantity and note, and confirm before recording an import movement.
- [x] Multi-variant adjustment vouchers require a reason category, validate reserved stock, lock rows in a stable order, and record all movements atomically with one voucher reference.
- [x] Available stock never becomes negative; manual adjustments cannot reduce physical stock below reservations.
- [ ] Concurrent checkout cannot oversell under simultaneous requests.
- [x] Low-stock query uses available quantity and configured threshold.

## Data
One inventory row per variant, append-only movements, and adjustment batch headers referenced by each voucher movement.

## API contract
Admin inventory listing, adjustment, voucher, receipt, and movement history under `/api/v1/admin/inventory`.

The movement list supports variant, text, movement type, actor, and inclusive date filters. Its CSV export streams the complete filtered ledger.

## Screens/routes
Admin inventory table, adjustment dialog and voucher detail, manual/CSV receiving, movement history, dashboard alert.

## Constraints and exceptions
Only `InventoryService` changes inventory quantities or creates stock movements. The service locks inventory rows and is called inside the enclosing checkout or order-state transaction, so order snapshots, coupon use, stock movement, and status history still commit or roll back together.

## Out of scope
Automated supplier procurement.
