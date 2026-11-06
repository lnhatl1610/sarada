# Business Rules

- **BR-CAT-001** Only published, non-deleted products and active variants are visible to shoppers.
- **BR-CAT-002** SKU and product slug are unique. Variant price is authoritative; base product price is a display fallback.
- **BR-CART-001** A cart has at most one line per variant; quantity is a positive integer and cannot exceed available stock.
- **BR-CHK-001** Checkout accepts only COD in the first release.
- **BR-CHK-002** The API recalculates price, coupon, shipping, and total using current persisted data.
- **BR-CHK-003** One idempotency key creates at most one order; retries return the original order result.
- **BR-INV-001** All stock changes create an inventory movement. Direct quantity updates outside the inventory domain are forbidden.
- **BR-INV-002** Reserve stock when an order is placed; release it on allowed cancellation. A delivered COD order marks payment paid only when staff confirms collection.
- **BR-ORD-001** Customers may immediately cancel pending orders through the existing self-service action or submit a cancellation request for pending, confirmed, or processing orders. Staff cancellation remains limited to pre-shipping states and all transitions use the order state machine.
- **BR-ORD-002** Every transition follows `docs/business-flows/order-lifecycle.md` and creates history.
- **BR-CPN-001** One coupon per order. Percent coupons may have a cap; free-shipping coupons discount shipping only.
- **BR-CPN-002** Coupon must be active, within date range, meet minimum subtotal, and satisfy global and per-user limits.
- **BR-REV-001** A customer may review only a product variant/order item they purchased after delivery/completion; staff approval is required for publication.
- **BR-ADM-001** API policies are authoritative; UI visibility does not grant permission.
- **BR-ORD-003** Public tracking requires both an unpredictable order code and matching contact value; sequential numeric IDs are never exposed.
- **BR-ORD-004** An authenticated customer may have at most one pending change request per owned order. Cancellation requests are allowed for pending, confirmed, or processing orders; return requests are allowed for delivered or completed orders until seven days after `delivered_at` (inclusive). The API is authoritative and rejects a return request when the delivery timestamp is missing or its deadline has passed. A staff decision is final. Approving cancellation transitions the order through `TransitionOrderAction`; approving a return records approval only, and staff transitions to `returned` after receiving the goods so inventory is restored at that point.
- **BR-MKT-001** Newsletter subscriptions take effect immediately after the visitor provides a valid email and explicit consent; no email-confirmation step is required. Repeated submissions for the same normalized email are idempotent.
