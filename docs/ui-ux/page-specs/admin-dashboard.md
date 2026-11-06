# Admin Dashboard

## Purpose and layout

Give managers a fast view of store health and shortcuts to permitted work. Use a desktop-first content grid with a collapsible sidebar, topbar, breadcrumb, and page title. At tablet widths, stack the revenue and recent-order panels, show breakdown panels in two columns, and let the final breakdown panel span the row; use one column on mobile. Dashboard grid children must be allowed to shrink within the viewport.

## Content and behavior

- KPI cards show collected revenue, order count, average paid order value, new customers, and cancellation/return rate for today, 7 days, 30 days, this month, or a custom date range of at most 366 days. An enabled comparison shows the immediately preceding equal-length period; rate differences use percentage points and other metrics use percent change. Keep VND integer formatting and explain that revenue includes paid orders only after they are delivered or completed, regardless of payment method. Low-stock variants remain visible in the dedicated low-stock panel.
- Revenue chart groups collected VND revenue from paid orders in delivered or completed states by day, week, or month and plots order count as a separate line. Include the optional previous-period revenue line, zero-activity buckets, Vietnamese date labels, distinct line patterns, a legend, and an accessible textual summary.
- The action-alert panel links pending orders, failed deliveries, low-stock variants, and reviews awaiting approval to their filtered management views. Hide each alert without its matching permission and provide loading, retryable error, and all-clear states.
- Show order-status distribution as a donut with a labeled count legend; each donut segment and legend item links to the matching filtered order list. Show collected revenue by payment method as proportional bars.
- Show paid, delivered/completed item revenue by current product category as an accessible donut, with the top five categories and a combined remainder. Proportional refunds are removed; show an explicit empty state when the period has no category revenue.
- Top-products widget shows the five highest-selling products with image, product name, units sold, and revenue, with a link to the product record. Recent orders use a semantic, horizontally scrollable table for up to eight latest orders with order code, customer, placed date, total, and status; each order code links to its detail. The low-stock list shows SKU, color/size, and available quantity. The recent-activity panel shows the ten latest admin audit events to staff with `settings.manage`.
- Quick links are shown only when the current user has the matching permission. API authorization remains authoritative.
- Selecting a time range refreshes all date-scoped widgets together and exposes pending, empty, and error states. A failed widget must not make the rest of the dashboard unusable. Custom ranges must be inclusive, cannot end in the future, and cannot exceed 366 days.
- Keep dashboard responses in TanStack Query under per-admin and per-period query keys. Dashboard widgets load independently so a failed widget does not erase successful data from the others.
- Dashboard data refreshes automatically once per minute while the page is open, refreshes when the browser tab regains focus, and offers pause/resume plus an explicit refresh action. Show the last successful refresh time and distinguish API connecting, connected, and failed states.
- Low-stock and pending-order counts link to the corresponding filtered management views.
- Dashboard controls, page introduction, KPI labels, chart legends and accessible descriptions, table headings, status badges, and loading/empty/error feedback use the selected admin language. Dashboard dates follow the selected language; counts follow the configured number format.
- Period comparison summaries use the selected admin language and locale-aware number formatting.

## Responsive behavior

- At 701–1200 px, revenue and recent-order panels stack; breakdown panels use two columns with the final low-stock panel spanning both columns so all four panels remain readable beside the sidebar.
- At 700 px and below, dashboard and breakdown panels stack in one column.
- Grid children use `min-width: 0` so chart labels and order rows cannot force the dashboard wider than its content area.

## Acceptance criteria

- [x] KPI values and chart update for today, 7, 30, and 90 days, this month, and a custom range. The five plan-defined KPIs can be compared against the immediately preceding equal-length period; cancellation/return rate uses percentage points. Top-product sales use the same selected range.
- [x] Revenue chart supports day/week/month grouping and an optional previous-period revenue line.
- [x] Permission-filtered action alerts link to pending orders, failed deliveries, low stock, and pending reviews; the recent-activity panel shows up to ten latest audit entries to users with activity-log permission.
- [x] Chart, top products, and recent orders have loading skeletons, useful empty states, and retryable errors.
- [x] Recent order and low-stock links open the matching record/filter.
- [x] Keyboard users can reach filters, chart summary, rows, and quick links; focus remains visible.
- [x] Unauthorized menu links and actions are hidden; dashboard API endpoints enforce `orders.view` (covered by the dashboard permission feature test).
- [x] Layout adapts at tablet and mobile widths with bounded dashboard grid children.
- [x] Automatic refresh can be paused/resumed; manual refresh and last-updated time are visible.
