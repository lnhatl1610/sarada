# Admin application shell

## Purpose

Provide a consistent, permission-aware frame for all admin screens in `PLAN_AGENT_ADMIN_UI_FASHION_STORE.md`.

## Navigation and access

| Page | URL | Required permission |
|---|---|---|
| Tổng quan | `/?page=dashboard` | `orders.view` |
| Sản phẩm, danh mục, thương hiệu, màu sắc, kích cỡ, bộ sưu tập | `/products`, `/categories`, `/brands`, `/colors`, `/sizes`, `/collections` | `products.view` |
| Thêm sản phẩm | `/products/create` | `products.create` |
| Đánh giá | `/reviews` | `reviews.moderate` |
| Đơn hàng, đơn trả hàng, vận chuyển, thanh toán | `/orders`, `/orders?status=returned`, `/shipments`, `/payments` | `orders.view` |
| Tồn kho, nhập CSV, lịch sử nhập/xuất | `/inventory`, `/inventory/import`, `/inventory/movements` | `inventory.view` or `inventory.adjust` for CSV import |
| Khách hàng | `/customers` | `customers.view` |
| Mã giảm giá | `/coupons` | `coupons.view` |
| Banner | `/banners` | `content.manage` |
| Báo cáo | `/reports/revenue`, `/reports/products`, `/reports/customers`, `/reports/inventory` | `reports.view` |
| Nhân viên, lời mời, duyệt đăng ký | `/staff` | `users.manage` |
| Vai trò và ma trận quyền | `/roles` | `users.manage` |
| Cài đặt chung, thanh toán, bảo mật, email, SEO, bảo trì và vận chuyển | `/settings/general`, `/settings/payments`, `/settings/security`, `/settings/email`, `/settings/seo`, `/settings/maintenance`, `/settings/shipping-methods` | `settings.manage` |

The shell reads permissions from `/admin/auth/me`. It hides navigation without a matching permission and shows a 403 state for a known page opened directly without permission. The API remains authoritative. Direct routes outside the sidebar include login/recovery, detail and create/edit screens, account settings, preferences, and 403/404/500 pages; unknown paths show a 404 state.

Create/edit routes keep the form state synchronized with in-app URL changes as well as direct page loads. Product, collection, and coupon edit routes require update/manage permission; collection and coupon forms fetch the addressed record through their permission-protected detail endpoints. Dynamic detail URLs require positive numeric IDs; invalid IDs and unknown paths show the 404 state.

## Layout

- Desktop: 260px collapsible sidebar, reduced to 72px in icon mode, with icon-led expandable groups and active page indication. All groups in the expanded sidebar use the same click-to-expand behavior. In icon mode, hovering any group icon opens a popover listing authorized destinations; triggers remain keyboard operable. The sidebar footer shows the signed-in staff member's avatar, name, role, and active-session indicator as a compact identity card; the single interactive account menu lives in the topbar.
- Sidebar navigation scrolls independently when its links exceed the viewport; native scrollbar chrome is hidden while wheel, trackpad, keyboard, and touch scrolling remain available.
- The browser document scrollbar is also hidden; long pages remain scrollable with wheel, trackpad, keyboard, and touch input.
- The sidebar brand reads `store_name` and `store_logo` from the authenticated admin identity response. Staff can display the public brand values without receiving permission to read or edit the rest of store settings.
- Tablet and mobile: off-canvas sidebar opened from the topbar, with a backdrop to close it.
- The shared `AppHeader` provides the breadcrumb, `GlobalSearch` (`Ctrl+K`/`Cmd+K`) across authorized order, product, and customer results plus locally matched authorized pages, permission-filtered quick-create actions, operational alerts, a system/light/dark theme cycle, and the single authenticated-user menu. Search results are debounced and capped at five per group. Alerts refresh every 60 seconds while the tab is visible. The popover shows the latest five pending and delivery-failed orders, failed-payment orders, pending reviews, and low-stock variants that the current user can access; each group links to its filtered list. Persistent notices support individual and bulk read state; operational count markers are stored per account in browser storage.
- Sidebar badges use the same polled alert data for pending orders, delivery-failed orders, reviews awaiting moderation, low-stock variants, and staff awaiting approval. Counts only appear on navigation items the current user is allowed to see.
- User menu: avatar or initials, name, role, active-session indicator, and a profile popup with account details, account display settings, password change, role-filtered screen guidance, version information, and logout.
- Main content: one page heading and a skip link to the main region.
- Sidebar collapse, theme, accent, density, and motion choices are local browser preferences. Access tokens remain in memory.

## Theme

Use the admin tokens documented in `docs/ui-ux/DESIGN.md`. The first visit follows the operating-system color preference; theme, accent, density, and motion preferences are saved together in `fashion-admin-preferences` (with compatibility for the former `fashion-admin-theme` key). The sidebar follows the selected theme in monochrome and uses inverse colors for the active item. The storefront appearance picker is not available in admin.

## Authentication entry

- The admin login form keeps email and password errors beside their fields, provides a keyboard accessible show/hide password control, and links to `/forgot-password`.
- While a login request is pending, the submit button is disabled and shows an animated progress icon with the text “Đang đăng nhập…”. The animation is reduced for users who request reduced motion.

## Responsive and accessibility requirements

- At tablet widths, the drawer overlays the page and the document does not gain horizontal scrolling.
- Every icon-only action has an accessible name. Active navigation uses `aria-current="page"`.
- Keyboard focus is visible. The skip link is the first focusable shell element.
- Reduced-motion preferences are respected.
- The profile appears only once in the topbar. Its menu opens below the trigger and fits the mobile viewport.
- Global search opens the matching product, order, or customer destination. `Ctrl+K` / `Cmd+K` focuses search. Operational alert groups and search results are permission-filtered by the API. The alert menu exposes loading, empty, and retryable error states; its per-account count-based read marker does not represent persistent notification records.
- List filters and pagination are URL-backed; browser Back/Forward and sidebar navigation restore the matching list state. Multi-field advanced filters and saved presets apply as one history entry.
- Shared list controls show removable chips for applied filters, a clear-all action, per-account density, page size, and hideable columns; column choices are stored separately for each admin list so similarly named columns on another page do not inherit them. Density changes use the same saved appearance preference as the account display settings. Every shared `FilterBar` list shows chips for its active quick and advanced criteria.
- Staff search stays in the quick filter bar; role and last-login date range are edited in the shared advanced-filter Sheet, with Apply/Reset and URL-backed state.
- The topbar profile menu uses the authenticated API response. Password changes revoke other sessions.

## Current scope and follow-up

This shell wraps the implemented COD store management screens. Account preferences are stored per user, account activity is limited to the authenticated user, and personal notifications have persisted history/read state. The topbar account menu includes quick guides, the supported keyboard shortcuts, storefront contact, and version information. Admin language can be switched between Vietnamese and English from the account menu or Appearance preferences; English translation coverage is still in progress. Topbar quick-create, theme, notification, and global-search controls follow the selected locale. Shared data tables, URL-backed filters, advanced filters, and the shell error fallback also use localized labels and states. Account/workspace switching remains follow-up work. Route rendering is covered by a global error boundary. When refresh cannot restore an expired session, a blocking dialog asks for the password and any required 2FA while preserving the mounted route; successful reauthentication refreshes current data. Account profile, security, session, notification-preference/history, activity, and appearance controls are available from the topbar account menu. Password changes revoke all admin and storefront sessions. Store contact, payment, shipping, security, email templates, SEO defaults, and storefront maintenance have dedicated settings screens. Order, shipment, and personal notification jobs require the database queue worker; email delivery also requires working SMTP configuration.
The shared sign-in layout, account lockout screen, and admin 403/404/500 states also follow the selected Vietnamese or English locale; product branding remains unchanged.

The shell localizes the skip link, sidebar and pinned navigation labels, account identity tooltip, loading fallbacks for lazy routes, API connection notice, missing/forbidden-route guidance, product filter errors, and archive confirmations. Admin toast messages are resolved through the selected locale before display.
