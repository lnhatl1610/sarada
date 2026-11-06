# Spec: Checkout and Orders

## Goal
Place one COD order with authoritative totals and atomic inventory/coupon updates; customers can view and track it.

## Requirements
FR-CHK-001..004, FR-ORD-001..003, BR-CHK-001..003, BR-ORD-001..003.

## Acceptance criteria
- [ ] Preview recomputes current price, coupon, shipping, and total without writes; shipping lookup and preview reject province codes absent from the current address catalog while using the configured default fee for valid provinces without a custom rate.
- [ ] Checkout line-item amounts are rendered from the matching API quote item (`variant_id` and quantity); before a matching quote exists, the UI must not display client-calculated line totals.
- [ ] Cart line amounts and drawer subtotal are rendered only from cart API `line_total` values matching their server-priced quantity; while a line is pending or unpriced, show a synchronization state rather than a client-calculated amount.
- [ ] Order placement requires an idempotency key scoped to the authenticated account or guest cart token; same-scope retries return the same order without repeating order-created notifications, and other scopes cannot retrieve it.
- [x] Checkout requires explicit acceptance of the terms and privacy policy; the API rejects order placement without `terms_accepted: true`.
- [x] Checkout exposes configuration loading/error retry states and does not allow order submission until the public API confirms the supported COD method is enabled.
- [x] New COD orders are rejected by the API when the store disables COD; the checkout UI shows the unavailable/loading state and disables placement until COD is confirmed enabled. Existing same-scope idempotent retries still return their original order.
- [x] A successful order response includes immutable item snapshots and server-calculated subtotal, discount, shipping, and total for the confirmation view.
- [x] Cart, checkout preview, and order placement resolve an optional storefront access token: signed-in requests use the authenticated customer's cart/order ownership, guests use their cart token, and supplied invalid/revoked/admin-audience credentials are rejected. Manual API UAT verified customer ownership, guest access, invalid-token 401, and admin-audience 403 on 2026-10-27.
- [ ] Insufficient stock, invalid coupon, or invalid address creates no partial order.
- [ ] Order snapshots remain unchanged when product data later changes.
- [ ] Guest tracking requires the order code and exactly one matching customer phone number or email; unknown orders and mismatched contact details return the same not-found response.
- [ ] Status transitions validate state machine and append history.
- [ ] Staff can create a manual COD order by selecting/entering a customer, adding active variants, entering delivery details, and selecting shipping/coupon options; amounts are recalculated and stock is reserved atomically.
- [x] Current variant pricing honors the product sale window in preview, checkout, and manual order creation; order items retain the charged unit price snapshot.
- [x] Account order detail can add saved variant IDs and quantities back to the cart through the normal server-priced cart endpoint.

## Data
Orders, order_items, histories, payments, shipments, inventory and coupon usage.

## API contract
`POST /checkout/preview`, `POST /orders`, `GET /orders`, `GET /orders/{code}`, `POST /orders/{code}/cancel`, `GET /orders/track`, `GET /admin/orders/manual-options`, `GET /admin/orders/manual-customers`, `POST /admin/orders/manual`.

## Screens/routes
`/checkout`, `/order-success/:code`, `/track-order`, account orders; admin order queue/detail and `/orders/create`.

## Constraints and exceptions
All writes in one transaction with row locks; COD only; one coupon; customers may immediately cancel pending orders or request cancellation while pending, confirmed, or processing.

## Out of scope
Online payment gateways and automated refunds. Customer cancellation and seven-day return-request intake, staff review, and stock restoration after staff confirms return receipt are in scope under FR-ORD-004; refunds and returned-goods inspection remain manual.
