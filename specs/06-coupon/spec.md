# Spec: Coupons

## Goal
Staff manage coupons and the server applies one eligible discount consistently at checkout.

## Requirements
FR-CPN-001, BR-CPN-001..002.

## Acceptance criteria
- [x] Admin can create percentage, fixed-amount, and free-shipping coupons; the list derives schedule/usage status, and the form generates codes, validates date/limit/value rules inline, and previews the saved rule.
- [x] Enforce active date range, minimum subtotal, usage caps and per-user limit.
- [x] Percent discount respects max cap; fixed discount cannot exceed subtotal; free shipping affects shipping only.
- [x] Coupon usage is serialized under a row lock; cancellation removes the usage record and decrements the counter once. Concurrent-database stress verification remains outstanding.

## Data
Coupons and coupon_usages.

## API contract
Storefront apply/remove/preview coupon; admin CRUD and usage stats.

## Screens/routes
Checkout coupon input; admin coupon list/form/detail.

## Constraints and exceptions
One coupon per order; server is authoritative.

## Out of scope
Stacking and customer-specific campaigns.
