# Spec: Admin Dashboard

## Goal
Managers and authorized staff see a reliable operational summary and navigate to actions they can perform.

## Requirements
FR-ADM-001..006, FR-INV-003, NFR-OBS-001.

## Acceptance criteria
- [x] Summary scopes revenue, order count, new customers, cancellation/return rate, and status/payment breakdowns to the selected period; pending orders and low-stock variants reflect current store state.
- [x] Revenue and top-product aggregates are capped to the selected date range; recent orders request only five rows.
- [x] Permission filtering hides inaccessible links and the API rejects direct unauthorized calls; dashboard data requires `orders.view`, while activity history requires `settings.manage`.
- [x] Dashboard widgets have independent loading, empty, and retryable error states.
- [x] TanStack Query caches dashboard data by admin and period and refreshes on schedule, focus, or explicit user action.
- [x] Tablet and mobile layouts constrain dashboard grid children and prevent intrinsic content from widening the page.
- [x] Date controls cover today, 7/30/90 days, this month, and an inclusive custom range capped at 366 days; date inputs, validation, query boundaries, and revenue buckets use the signed-in admin's profile timezone (falling back to the API timezone).
- [x] KPI comparison can be enabled or disabled; revenue can be grouped by day, week, or month and optionally displays the immediately preceding equal-length period.
- [x] Permission-filtered action alerts link to pending orders, failed deliveries, low-stock variants, and pending reviews; staff with `settings.manage` see the ten latest activity records.
- [x] Top five products include thumbnails; each order-status donut segment and legend entry opens its filtered order list; low-stock rows show SKU, color, size, and available quantity.
- [x] Dashboard summary includes collected item revenue by the product's current category; proportional order refunds are removed, uncategorized items remain visible, and the category donut summarizes the top five categories plus the remainder.

## Data
Aggregate from orders/order_items/inventory; never count cancelled orders as revenue. Convert the admin's local date range to UTC query boundaries, then bucket chart rows back into the same profile timezone so a UTC server does not reject or shift the local business day.

## API contract
`GET /api/v1/admin/dashboard/summary`, `/revenue`, and `/top-products` require `orders.view`. Summary returns `category_breakdown` for paid delivered/completed order items in the selected period. Refunds are allocated proportionally across line totals, matching product-performance reporting; categories use the product's current category because order items do not snapshot category. Custom date ranges are inclusive and limited to 366 days; revenue accepts day/week/month grouping.

## Screens/routes
Admin `/` dashboard with KPI cards, chart, top products, recent orders.

## Constraints and exceptions
Define dashboard revenue across supported payment methods as paid, delivered/completed orders after refunds; category revenue is item value after proportional refunds and is not a reconciliation of shipping or order-level discounts. Keep date ranges capped to avoid unbounded scans.

## Out of scope
Forecasting and custom report builder.
