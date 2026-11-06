# Admin management from the SQL catalog

Source: the user-supplied “Kế hoạch trang quản trị Sarada (dựa trên schema SQL)” on 2026-10-22. This implementation follows the first-release COD and single-store decisions in `docs/requirements/vision-scope.md` and `docs/requirements/open-questions.md`.

## Delivered in this pass

- Add new-customer count and cancellation/return rate to the dashboard summary and show the metrics in responsive KPI cards.

- Link the account menu to profile, security, and sessions destinations; deep links load the matching account tab and browser history stays in sync.

- Add API-backed global search for products, orders, and customers, with at most five matching results per group and per-group permission filtering. Add operational alert counts and latest records for pending orders, failed payment records, pending reviews, and low stock; refresh the admin alert menu every 60 seconds. Keep a single account control in the header and remove the duplicate sidebar account control.

- Keep one account menu in the header; leave the sidebar footer without an account control.
- Group navigation by sales, catalog, inventory, marketing, customers, and system permissions.
- Expose the planned product creation and store payment settings routes directly in the sidebar; selected navigation items follow their direct URL.
- Manage categories, brands, color values, size values, collections, coupons, banners, and shipping methods with server-backed list/create/update/delete flows. Deletion is blocked for referenced catalog or shipping records; used coupons must be disabled.
- The categories screen supports tree and table views, URL-persisted search/status/parent/root/product-assignment filters, server pagination and sorting in table mode, and drag reordering only when the complete unfiltered tree is loaded.
- Category editing persists description and SEO metadata, and deletion is blocked until its products and child categories are moved elsewhere.
- Brand management includes logo upload/preview, description, SEO metadata, search, and active-state filtering.
- Size values now expose their attribute group in the table and editor; ordering stays within a single group while existing color/size deletion guards remain active.
- Collections expose derived running/upcoming/expired/disabled status, schedule-overlap date filters, banner upload/preview, and SEO metadata. Their product manager supports search, multi-attach, drag ordering, individual detach, and confirmed bulk detach of up to 1,000 product memberships without deleting products or inventory.
- Direct collection and coupon edit routes load the addressed record through permission-protected detail endpoints; collection reads require `products.view`, coupon reads require `coupons.view`, and edit routes require their matching update/manage permission. Invalid account, collection, coupon, and nonpositive numeric-ID paths return the shell's 404 state.
- Show COD payments, shipments, inventory movements, abandoned carts, and wishlist counts from paginated API queries.
- Show customer list/detail to staff and admins with `customers.view`; only users with `users.manage` may edit or block accounts. Blocking a customer revokes their active sessions.
- Show staff list and allow account creation, role/status updates, and password reset. Blocking or resetting a staff account revokes sessions. `admin` has all first-release permissions; `staff` cannot manage users/settings/reports or delete records.
- Prevent self-lockout and protect the last active admin during role/status changes and deletion. Serialize the active-admin check with a row lock so simultaneous staff mutations cannot demote or delete the final admin. Passwords require letters and digits; the temporary-password generator uses cryptographic randomness.
- Show a date-filtered business report with paid COD revenue comparison, daily revenue, top products, inventory retail value, new customers, coupon usage, and CSV export.
- Configure store contact, default shipping fee/free-shipping threshold, and the default low-stock threshold for new variants. Checkout uses the saved shipping values.
- Record successful admin write requests in `activity_logs`, redacting credential fields, and show the read-only filtered journal.
- Add a detailed product editor for metadata, categorization, collections, variants, and image URLs. New variant stock creates an inventory movement.
- Add payment filtering and payment/shipment records to order details. Cancellation requires a reason.

## Acceptance criteria still open

- Product creation now uses a four-step editor for metadata, categorization, variants, image URLs, and SEO; image file upload/reorder is available in the dedicated image manager. A drag/drop bulk variant matrix remains optional follow-up work.
- Order bulk status actions, payment status updates, full manual refund recording, filtered CSV export, internal notes, authorized shipment create/update, print actions, address snapshot edits, and delivered-to-return inventory restoration are available. Gateway/provider reconciliation is outside the COD release.
- Authorized image upload is available through the generic endpoint and product-specific endpoint (`POST /admin/products/{product}/images/upload`); the dedicated `/products/:id/images` manager supports upload, primary selection, reorder, and delete. Drag/drop gestures in the long product editor remain optional follow-up work.
- Password recovery is now available through generic `/auth/forgot-password` and `/auth/reset-password` endpoints with mail notification and token/session invalidation; the admin has public recovery screens for both routes.
- Inventory CSV import and product image reorder endpoints are now authorized and transactional. The admin provides `/inventory/import` with CSV preview and row validation, and `/products/:id/images` with reorder controls.
- Named revenue, products, customers, and inventory report views and API payloads are now section scoped. The inventory report includes stock totals/status counts and up to 100 lowest-stock variants, with a link to the full filtered inventory list. Customer spending/date/email verification filters, inventory status/export, payment-method and top-customer report breakdowns, collection membership listing/sorting, coupon usage detail, inventory CSV import, and customer CSV export are also available.
- The alert menu is live and stores its read signature in the admin browser so the badge clears after acknowledgement; server-side notification history and shop review replies remain outside the current schema. The activity journal captures sanitized request changes but does not yet reconstruct before/after model snapshots.
- Staff permissions are role based, displayed from the backend role-permission matrix, and editable per shared role through the admin screen. Staff can view coupon campaigns through `coupons.view` while mutation actions remain protected by `coupons.manage`. Roles remain global across modules, so custom role creation is intentionally outside this scope.

## Data and security rules

- All amounts are integer VND. Checkout calculates totals and shipping on the server.
- API permissions enforce read and write access. Admin UI checks hide controls only.
- Stock changes continue through transaction-locked inventory actions and movements.
- No VNPay, MoMo, Stripe, carrier API, multi-tenant, PIN/2FA, device or firmware controls are presented as working features in this release.
