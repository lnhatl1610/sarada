# Admin Inventory

## Inventory list

- Show product thumbnail, product/variant color and size, SKU, barcode, on-hand quantity, reserved quantity, available quantity, low-stock threshold, and last movement. Available quantity is displayed as on-hand minus reserved and is read-only.
- Provide quick tabs for all, available, low, and out-of-stock variants with server counts. Counts respect search, the low-stock toggle, and category/brand/color/size filters while ignoring the selected stock status. Support search by product name, SKU, or barcode; low-stock and stock-status filters; category, brand, color, and size filters; allowlisted server sorting by product name/SKU/on-hand/available/threshold; and server pagination. Preserve filters and sort in the URL and apply the same filters to CSV export.
- Permit selecting up to 100 variants across pages and applying one non-negative low-stock threshold to the selected variants. Require `inventory.adjust`; preserve on-hand/reserved quantities and do not create stock movements for threshold-only changes.
- The threshold dialog marks its 0–1,000,000 integer input as required and disables Save until the value changes.
- Provide stock-status tabs and server filters for category, brand, color, and size; keep these filter values in the URL and apply them to the same inventory CSV export.
- Distinguish normal, low, and unavailable stock with text/icon plus color. Provide loading skeleton, empty results, API error/retry, and permission-denied states.
- Current list implementation uses shared DataTable/FilterBar and server pagination; search, low-stock, stock status, category, sort, and page state are URL-backed. CSV export uses the active filters and sort order. Category and stock options come from authorized API data; sort fields are allowlisted by the API.

## Adjustment and movement history

- Adjustment dialog shows current on-hand/reserved/available quantities, integer delta, resulting on-hand quantity, and required reason. Reject zero, fractional, or invalid deltas before submit; the API remains authoritative for availability constraints.
- The adjustment form marks operation type, quantity delta, and reason as required; the manual receipt form marks its positive quantity and 3–500 character note as required.
- Support positive stock receipts and signed adjustments; receipts create `import` movements, while corrections create `adjust` movements.
- The `/inventory/import` page offers manual receiving by searched SKU/barcode/product and CSV import as separate modes. Manual receiving previews the selected variant and current on-hand/reserved quantities, requires a positive integer and note, and asks for confirmation before applying the receipt.
- `/inventory/adjust` creates a voucher for up to 100 distinct variants. Each row has a signed integer delta; the voucher requires a reason category (stocktake, damage, loss, or other), shows before/after quantities, and confirms once before submission. The entire voucher is atomic and each ledger entry references its voucher.
- Confirm the operation before saving. On success update the row from the API response and provide a direct link to the recorded movement history.
- Movement history is append-only and shows timestamp, actor, reason, reference, movement type, and quantity delta. Never imply that editing the displayed quantity directly is supported.
- The dedicated `/inventory/movements` screen filters by movement type, actor, and inclusive date range; debounced search matches product name, SKU, or reason. The table shows timestamp, SKU/product, movement type, signed quantity delta, stock after, reference, note, and actor. Order references link to orders and adjustment batch references link to the read-only voucher detail. Timestamp, SKU, delta, and stock columns sort on the server. CSV export streams every server-filtered movement in the selected order.
- Keep SKU/product search in the quick filter bar. Put movement type, actor, and date range in the right-side advanced-filter Sheet with draft values, Apply, and Reset; saved presets retain all criteria and sort.
- CSV receipt import provides a downloadable `sku,quantity,note` template, validates the header and positive integer quantities, previews quoted CSV fields (including commas in notes), and checks SKU existence through a read-only API preview before confirmation. The preview marks invalid rows and provides an error CSV containing each source line's SKU, quantity, note, and error. Confirmation imports only valid rows through `AdjustInventoryAction`, records a `csv_import` movement, and rechecks SKUs while applying changes. After a partial import, the uploaded file is cleared so accepted quantities cannot be added twice by retrying the same submission.
- The CSV file picker uses the shared form field with accepted file format/size guidance and is disabled while previewing or submitting an import.
- `/imports` lists inventory CSV runs with actor, source filename, status, row counts, and timestamp. Each row-error file downloads as CSV; admins see only their own history unless they also have `exports.view_all`. Users can fix the downloaded rows and submit a corrected CSV from `/inventory/import`.

## Acceptance criteria

- Inventory import, adjustment voucher, and import-history controls use the active Vietnamese or English admin locale, including validation feedback and confirmation dialogs.
- The low-stock threshold dialog uses the active admin locale for its labels, range guidance, validation, and save action.
- The stock adjustment dialog uses the active locale for operation choices, reserved-stock validation, confirmation summaries, and formatted quantities.
- Inventory movement history localizes movement/reference types, table headers, filter labels/chips, empty state, and CSV export feedback. Quantities and dates use shared locale-aware formatters.
- The inventory list localizes stock-status tabs, search and advanced filters, active-filter chips, table labels/actions, empty/error feedback, and bulk threshold controls. Counts use the configured number format.

- [x] Filters, search, sorting, and pagination operate on server results and preserve state in the URL.
- [x] Inventory rows include variant identifiers and thumbnail, and barcode search returns matching stock rows.
- [x] Adjustments require a reason and confirmation and display API validation errors.
- [x] Reserved stock cannot be adjusted away and available stock never displays below zero.
- [x] Movement history exposes actor, reason, reference, movement type, timestamp, and quantity delta.
- [x] Movement type/date/search/sort filters operate on server results and CSV contains the full filtered result set.
- [x] Movement type, actor, and date filters are applied from the advanced-filter Sheet; URL state restores them through browser Back/Forward.
- [x] Inventory category, brand, color, size, and sorting criteria use the draft advanced-filter Sheet; Back/Forward restores URL-backed filters and page.
- [x] Applied quick and advanced stock filters appear as removable chips; clear-all resets the search, stock tab, low-stock toggle, and advanced filters.
- [x] CSV receipt writes go through the inventory action and create one ledger movement per accepted row.
- [x] CSV import previews row-level format and unknown-SKU errors before confirmation and allows downloading those errors.
