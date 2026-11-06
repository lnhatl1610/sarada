# Coupon

Accept one coupon per order. Validate active state, start/end time, minimum eligible subtotal, global usage limit, and per-user usage limit. `percent` discounts subtotal and respects `max_discount`; `fixed` discounts subtotal up to subtotal; `free_ship` discounts shipping only. Recheck and reserve usage within the checkout transaction so concurrent checkouts cannot exceed limits. Store the server-calculated discount amount in `coupon_usages.discount` for Admin campaign usage history. On allowed order cancellation, reverse usage exactly once.
