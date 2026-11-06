# Spec: Admin Order Operations

## Goal
Authorized staff can find orders, inspect immutable snapshots, advance allowed states, record notes and COD collection.

## Requirements
FR-ORD-001..002, FR-ADM-001..003.

## Acceptance criteria
- [x] Quick status tabs show server counts and apply URL-backed status filters while retaining other order filters.
- [x] List supports status/date/search, payment state and method, multiple shipping methods and provinces, exact coupon code, note presence, VND total range, and server pagination; filter state is URL-backed and status counts retain other active filters.
- [x] Selected order rows can be batch printed as invoices or delivery slips, one document page per order.
- [x] Detail shows customer contact/address, immutable item snapshots, totals, history and customer/internal notes.
- [x] Only valid transitions/actions are offered; the API state machine rejects invalid transitions.
- [x] Single and bulk status transitions require confirmation and accept an optional note saved to order history; delivery confirmation also retains the explicit COD collection choice.
- [x] Admin mutations record actor and audit metadata through the API audit middleware.
- [x] Manual COD order creation and COD collection show API validation errors beside the relevant fields.
- [x] Reviewing a cancellation/return request refreshes the active server-backed order list so resolved requests leave the pending review queue without a manual page reload.

## Data
Orders, order items, histories, payments, shipments, activity logs.

## API contract
Admin order list/detail/status/note/invoice/export endpoints under `/api/v1/admin/orders`; list and export share the validated filters, including multiple shipping methods/provinces and coupon/note filters.

## Screens/routes
Admin orders table and detail timeline.

## Constraints and exceptions
Permissions enforced at API; status flow defined in `docs/business-flows/order-lifecycle.md`.

## Out of scope
Carrier API integration.
