# Admin reports

## Routes and access

- `/reports/revenue`, `/reports/orders`, `/reports/products`, `/reports/customers`, `/reports/inventory`, and `/reports/coupons` are separate permission-gated pages under `reports.view`.
- Revenue, products, and customers use a shared date range; the selected report can be exported as CSV or printed/saved as PDF. Inventory is a current snapshot, so its page does not show an irrelevant date selector.
- `/reports/overview` remains available for existing links and returns the combined report payload.

## Report contents

- Revenue: current and previous period totals, collected orders by day and payment method, category revenue, and coupon use. Revenue totals require a paid order in the `delivered` or `completed` state so pre-paid orders that have not arrived are not counted as fulfilled sales.
- Orders: counts by status, cancellation/return rate, average time from confirmation to shipment, and order counts by destination province.
- Products: best-selling fulfilled orders for the selected order date range and current cumulative product view/sold counters.
- Customers: new customer count, paid-order repeat segments, province distribution from saved shipping addresses, and highest spending customers.
- Inventory: variant count, total on-hand and available quantities, retail value at current variant prices, counts by stock status, and up to 100 out-of-stock or low-stock variants. The table links to the full filtered inventory list when the report cap is reached.
- Coupons: use count, total discounts, and fulfilled paid revenue by coupon code.
- Do not calculate profit because the schema has no cost basis. Money remains integer VND.

## Interaction and states

- The shared `DateRangePicker` provides Today, 7 days, 30 days, This month, and custom date inputs. Selected values stay in URL state and report data and CSV use the same range. Inventory remains a current snapshot and does not show a date selector.
- Report page headings, filters, metric labels, charts, table headers, empty states, errors, and accessible descriptions use the selected Vietnamese or English locale. Dates follow the shared date preference; money and counts use the account's configured number and currency formatting.
- Each data table has a specific empty message. Loading, API error/retry, and CSV export errors are visible and announced. Print styles hide admin navigation and filters and preserve report panels for PDF output.
- All report routes and API responses require `reports.view`; the backend remains authoritative.

## Scheduled reports

- `/reports/schedules` requires `reports.view` and `reports.schedule`. Admins choose one report, configure report parameters, daily/weekly/monthly recurrence, local send time and IANA time zone, CSV/PDF format, and active staff recipients with report access.
- The page lists next and last run times and recent errors, supports editing and deletion, and links generated artifacts to the Downloads Center. Generated files are private and expire after seven days.
- Schedule forms, validation, recurrence labels, recipient guidance, status, timestamps, empty/loading/error states, and mutation feedback use the selected admin locale.

## Scheduled reports

- `/reports/schedules` requires `reports.view` and `reports.schedule`. Admins choose one report, configure report parameters, daily/weekly/monthly recurrence, local send time and IANA time zone, CSV/PDF format, and active staff recipients with report access.
- The page lists next and last run times and recent errors, supports editing and deletion, and links each generated artifact to the Downloads Center. Generated files are private and expire after seven days.
- Schedule forms, validation, recurrence labels, recipient guidance, status, timestamps, empty/loading/error states, and mutation feedback use the selected admin locale.

## Acceptance criteria

- [x] Each planned report route opens its own report section and requests the corresponding named API endpoint.
- [x] Inventory shows total stock, available stock, status counts, and actionable low/out-of-stock variant rows.
- [x] CSV export uses the selected report section and date range.
- [x] Report requests and exports are protected by the `reports.view` API permission.
- [ ] Manually review report layouts at 360px, 768px, and 1440px in light and dark themes.
