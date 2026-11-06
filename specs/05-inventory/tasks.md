# Tasks: Inventory

- [x] Add inventory schema and seed defaults for variants.
- [x] Route every stock change through the inventory domain service; admin adjustments, CSV receipts, product stock initialization, checkout reservations, order completion, cancellation, and returns use transaction-locked inventory operations.
- [x] Route CSV receipt rows through `AdjustInventoryAction` and retain per-row import errors.
- [x] Add adjustment API, listing, movement history and low-stock data.
- [x] Build admin inventory listing and guarded adjustments with a required reason.
- [x] Add manual SKU receiving and CSV template/error downloads.
- [x] Add atomic, multi-variant adjustment vouchers with a persistent batch reference.
- [x] Add catalog filters and row/bulk low-stock threshold editing.
- [x] Update docs and traceability for implemented inventory flows and document the remaining concurrent-checkout stress verification.
