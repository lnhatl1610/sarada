# Admin Order Management

Order detail content follows the selected admin locale for payment/refund and shipment labels, accessible actions, COD collection confirmation, and system-generated dates. Monetary amounts use the shared locale-aware VND formatter; customer-entered notes, names, and transaction identifiers remain unchanged.

Invoice and delivery-slip printouts follow the selected admin locale for document labels and instructions. Order snapshots, customer-provided content, addresses, and codes remain unchanged.

Order delivery and shipment editor dialogs use the selected admin locale for instructions, status labels, validation feedback, and actions.

Order cancellation, bulk status, address correction, and refund dialogs localize their instructions, reasons, form labels, server-independent validation, and confirmation actions. Refund amount guidance uses the shared locale-aware number formatter.

Province/city and ward/commune field labels follow the admin locale; official place names remain in Vietnamese.

Internal order-note headings, field guidance, validation, and save feedback follow the selected admin locale.

Manual order creation follows the selected admin locale for customer/product selection, shipping fields, form actions, and server-revalidated pricing guidance. Product/customer values and official address names remain store data.

- Keep order status in its dedicated quick control. Put view and print actions in the accessible row `⋯` menu.

## Order list

- Provide search by order code, customer name, email, and phone; status, date range, multiple shipping methods and provinces, exact coupon code, note presence, payment state/method, and total-range filters; sortable placed date/total; server-side pagination; and filter/sort state reflected in the URL and CSV export.
- Keep filters when opening a detail and returning to the list. Show applied-filter chips and a clear-all action.
- Rows show order code, customer/contact, item-unit count, placed time, total VND, payment method and state, fulfillment state, and view/print actions. Item count is aggregated from immutable order item rows by the API. Status labels include text and icon/shape; do not rely on color alone.
- Order filters include payment method and payment status. `payment_status=failed` finds an order with at least one failed row in `payments`; the row keeps the order's own collection state and separately shows the failed transaction badge/count.
- Provide quick status tabs for all, pending, confirmed, processing, shipping, delivered, delivery failed, completed, cancelled, and returned orders. Counts come from the server and respect the current search/date/payment/shipping/total filters while ignoring the selected status.
- Support loading skeleton, no-orders state, no-filter-results state, API error with retry, and permission-denied state.
- Current list implementation uses shared DataTable/FilterBar and server pagination; search by code/name/email/phone, status/payment/shipping/date/total/coupon/province/note filters, sort order, and page are URL-backed. CSV export reuses the same active filters and sort. Selected orders can be batch printed as invoices or delivery slips, with one print page per order.
- The navigation includes a returned-orders shortcut at `/orders?status=returned`; the returned filter is active in both API results and sidebar selection after reload.

## Order detail

- Show the order-level successful delivery time and, for each return request, the seven-day request deadline applied by the API so reviewers have the same policy context as the Storefront and backend.

- Show immutable order snapshots: customer contact, delivery address, item name/variant/SKU/quantity/unit-price, subtotal, discount, shipping, grand total, and COD payment state.
- Show immutable snapshot image, name, variant/SKU, unit price, quantity, and line total. Link to the source product only when it still exists and the operator has `products.view`.
- Show payment provider/reference/amount/status/time and a collapsed JSON payload view. Redact credential, token, signature, and card-sensitive keys before returning payload data from the API.
- Show customer name/email with a `/customers/:id` link only when the operator has `customers.view`.
- Show chronological status history with timestamp and actor. Show shipment carrier/reference/status and shipped/delivered times; authorized operators can create or update a shipment from the detail page.
- Gate order status, payment, address, refund, shipment, and internal-note actions by `orders.update_status`; enforce the same permission in the API.
- Offer only state-machine-valid actions. Every single or bulk status transition opens a confirmation dialog with an optional note saved to order history. Cancellation requires choosing a reason from the provided list; selecting “Khác” reveals a required text field, and the chosen reason is saved to order history. For delivered orders, explicitly confirm whether COD money was collected before marking payment as paid. Explain why an action is unavailable.
- Allow authorized staff to append an internal note to order history. Keep the customer's checkout note read-only and separate. Notes and state changes show success/error feedback and remain in the history after reload.
- Internal notes are required when added, limited to 3–2,000 characters; API 422 validation for `note` appears beside the textarea and clears when the user edits it.
- Provide invoice/print and export actions only when implemented and permitted; disclose unavailable document data instead of presenting a dead control.
- Invoice and delivery-slip print controls render separate print-only documents: the sales document includes immutable item prices and totals, while the delivery slip contains recipient, address, carrier/tracking, and item quantities without prices. Both include store branding and signature space.
- Shipment updates open an accessible dialog for carrier, tracking code, and status. Client and API field errors appear beside the matching field; successful saves refresh the server-backed shipment row.
- Cancellation, bulk cancellation, delivery-address edits, and refund recording use accessible dialogs with React Hook Form/Zod validation. Laravel 422 errors appear beside the corresponding input; cancellation reasons are required and saved to order history.
- Required fields show `*` in the refund amount/reason and delivery-address name, phone, and street controls. Province and ward selectors also show required markers and inline errors; shipment status is required while carrier and tracking code remain optional.
- Address editing is offered only before delivery. Province selection controls the available commune/ward list, and both controls use the bundled 25/10/2026 snapshot of the official National Statistics Office catalog. New addresses store province/commune codes and display names; editing an old snapshot preserves legacy district fields. Address summaries and print documents show street and locality names, never opaque codes.
- COD collection is a one-way action for unpaid COD orders and requires a 3–1,000 character audit note; the API does not permit staff to reverse a paid state to unpaid.
- Refund entries preserve the original payment amount, require a VND amount and reason, and show append-only history with the remaining refundable balance.
- Opening order detail from the list or through `/orders/:id` shows a loading skeleton, reports fetch errors with a retry action, and ignores stale responses if another order is requested first.
- The order list, active filter chips, payment methods/statuses, bulk actions, accessible names, and loading/empty/error feedback use the selected admin language. Order counts and dates follow the configured locale; totals remain integer VND.

## Acceptance criteria

- [x] Search, filters, sorting, and pagination operate on server results and preserve URL state.
- [x] The returned-orders shortcut applies the server status filter and remains selected while that filter is active.
- [x] Detail values come from immutable order snapshots, not current product/customer records.
- [x] Detail shows snapshot images and unit prices, redacted payment payloads, shipment dates/status, and named history actors; product/customer links respect view permissions.
- [x] COD collection is one-way, requires an audit note, and cannot be used for non-COD or already paid orders.
- [x] Refund entries preserve the original payment amount, require a VND amount and reason, and show append-only refund history with the remaining refundable balance.
- [x] Invalid state transitions cannot be selected in the UI and are rejected by the API.
- [x] Cancellation and COD collection require their respective confirmation steps and produce visible feedback.
- [x] Single and bulk status transitions require confirmation and allow an optional history note; delivery confirmation retains the separate COD-collection choice and accepts the same note.
- [x] Shipment carrier, tracking code, and status edit in a dialog with inline validation and server refresh.
- [x] Single/bulk cancellation, address editing, and refund recording use validated dialogs with inline API field errors.
- [x] Manual-order creation and pre-delivery address editing use dependent province and commune/ward selectors; the API prevents address changes after delivery, completion, return, or cancellation and preserves historic district data.
- [x] Manual-order server validation errors appear beside their matching customer, recipient, location, shipping, coupon, and item fields; changing a value clears its stale error.
- [x] Internal-note length errors appear beside the note field.
- [x] Invoice and delivery-slip controls print separate documents with order snapshots; the invoice includes prices and totals while the delivery slip omits prices.
- [x] The list shows item count, payment method and status, and provides direct view/print actions backed by order detail data.
- [x] The payment-method filter accepts COD, transfer, or other stored methods; the failed-payment filter queries related `payments` rows and each matching order shows a separate failed-attempt badge/count.
- [x] Advanced order filters select multiple shipping methods/provinces, suggest coupon codes while accepting manual entry, and filter customer/order-note presence. The same validated criteria drive list results, tab counts, and CSV export.
- [x] Selected orders can be batch printed as invoices or delivery slips; each selected order gets a separate print page.
- [x] Quick status tabs update the URL-backed status filter and show server counts for the other active filters.
- [x] Secondary order filters are edited in a draft Sheet and applied together; Back/Forward restores URL-backed filters and page.
- [x] Applied search, status, payment, shipping, total, date, coupon, province, and note criteria appear as removable chips; clear-all resets the full order filter set.
- [x] Loading, empty, error, and permission states are explicit; detail remains keyboard accessible.
