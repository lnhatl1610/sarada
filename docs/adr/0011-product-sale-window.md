# ADR-0011: Schedule product discounts with one product-level window

## Status

Accepted

## Context

The admin product plan needs optional promotion start and end times. The catalog already stores the discounted amount and comparison price on each variant, while `products.sale_price` is a cached lowest discounted variant price. Keeping dates at the variant level would add more data and allow variants in one product to show conflicting campaign periods.

## Options considered

1. Add optional start and end datetimes to each product and use the existing variant prices.
2. Create a separate promotion and promotion-item model with schedules per variant.

## Decision

Use nullable `products.sale_starts_at` and `products.sale_ends_at` columns. A product's configured interval applies to every variant whose `compare_at_price` is greater than `price`. An empty interval keeps existing variant discounts active without a time limit. A missing start or end leaves that side of the interval open. The end instant is inclusive.

Catalog display, price filtering/sorting, cart presentation, checkout quotes, storefront order placement, and admin manual-order options all use the same effective-price rule. Checkout and manual order creation recompute prices on the server and snapshot the charged price on each order item.

## Consequences

- Existing discounts continue to behave as they do today when both new fields are null.
- Product variants share one promotion period.
- Campaigns that need multiple overlapping windows or different dates per variant would require a separate promotion model later.
- The product sale price cache remains a catalog summary; runtime pricing checks the schedule directly.
