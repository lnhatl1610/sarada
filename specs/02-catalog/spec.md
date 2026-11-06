# Spec: Product Catalog

## Goal
Staff publish a variant-aware catalog and shoppers discover active products by category, attributes, price, and search.

## Requirements
FR-CAT-001..005, FR-MKT-002, FR-ADM-002, NFR-PERF-001, NFR-SEO-001.

## User story
As a shopper, I want accurate product and variant information so I can choose an available size/color.

## Acceptance criteria
- [ ] Public lists contain only active products and return bounded pagination/filter results; both price sorts use the lowest effective active-variant price displayed on the product card and respect the sale window.
- [ ] Product details include active variants, images, availability, metadata, and approved reviews; catalog sale comparison price belongs to the active sale variant(s) that produce the displayed lowest effective product price.
- [ ] Staff CRUD operations require the corresponding permission.
- [ ] Product and variant slugs/SKUs satisfy unique constraints.
- [x] Customers can enable, reset, inspect, and disable PDP/wishlist price alerts; an alert captures the lowest effective active-variant price and queues one email after observing a lower price.
- [x] Customers can register a restock alert from a wishlist for a selected sold-out variant using their account email; guest PDP email/SMS subscriptions remain supported.
- [x] Shoppers can read paginated answered product questions; signed-in customers can submit questions, and staff with `reviews.moderate` can answer or hide them without exposing customer contact details.
- [x] Eligible customers can attach up to five validated photos and one size-limited MP4/WebM video to a delivered-order review; media stays private until moderation approves the review and renders appropriately in Storefront and Admin.

## Data
Categories, brands, products, images, attributes/values, variants, inventories, tags, size guides, customer-owned `product_price_alerts`, and moderated `product_questions`.

## API contract
Public `GET /api/v1/categories`, `/products`, `/products/{slug}`, `/products/{slug}/related`, and `/products/{slug}/questions`; signed-in question submission; staff CRUD under `/api/v1/admin/products` and moderated questions.

## Screens/routes
Admin product list/form; storefront home, collection/search, product detail.

## Constraints and exceptions
Filter/sort allowlist, soft-delete semantics, no client-authoritative stock or price.

Discounts are stored on variants as `price < compare_at_price`; an optional product-level start/end window controls when that discount is effective. With no dates, existing discounts remain active indefinitely. Outside a configured window, catalog, cart, checkout, and manual orders use the comparison price. Checkout and manual orders calculate prices on the server and snapshot the charged amount.

## Out of scope
Multi-vendor and advanced search engine.
