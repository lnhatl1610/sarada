# Spec: Admin shell and design system

## Goal
Give staff a consistent, accessible, responsive admin shell with a predictable light/dark theme and navigation filtered by API-provided permissions.

## Requirements
- NFR-A11Y-001: keyboard access, visible focus, semantic structure, and accessible labels.
- NFR-MAINT-001: shared design tokens and reusable interface patterns.
- FR-ADM-001..006: admin authentication, operations, reporting, and audit scope.

## User story
As an admin user, I want a consistent shell that only shows screens available to my role, so I can operate the store without confusing or inaccessible navigation.

## Acceptance criteria
- [x] The shell provides desktop sidebar collapse, tablet/mobile navigation drawer, topbar, breadcrumb, and skip link.
- [x] Sidebar items map only to implemented admin screens and require the matching `/admin/auth/me` permission.
- [x] Staff with `orders.view` can open the dashboard, while report pages remain gated by `reports.view`.
- [x] Sidebar groups use icon-led collapsible branches and automatically expand the branch containing the active route.
- [x] Opening a supported page without its permission displays a 403 state; an unknown page displays a 404 state.
- [x] Light/dark mode follows system preference on first visit and stores a manual choice locally.
- [x] The topbar provides a system/light/dark theme cycle and permission-filtered quick-create links for products, coupons, banners, and collections.
- [x] The sidebar footer has no account control; the only account menu is in the topbar.
- [x] The sidebar footer shows a compact avatar, staff name, role, and active-session indicator; the topbar remains the only interactive account menu.
- [x] The sidebar shows the configured store name and logo; `/admin/auth/me` exposes only those public brand settings to authenticated admin users.
- [x] The topbar account menu uses `/admin/auth/me` data and provides profile details, preferences, password change, role-filtered guidance, version, and logout.
- [x] The account menu provides a quick usage guide, working keyboard shortcut reference, storefront contact link, and application version information.
- [x] The topbar account control shows avatar, name, role, an active-session indicator, and an accessible account label.
- [x] The topbar exposes `Ctrl+K`/`Cmd+K` quick search alongside the shared account control.
- [x] Permission-filtered sidebar badges show pending orders, reviews awaiting moderation, and low-stock variants using the shared operational alert query.
- [x] Shared status badge presents Vietnamese labels and status text plus a tone marker.
- [x] Shared DataTable supports server-side sorting/paging, loading/empty/error states, optional controlled row selection, and a column visibility menu; each admin user’s column choices are scoped to the current list route and table columns. FilterBar, ConfirmDialog, and status/empty/error/skeleton primitives are also available.
- [x] Route rendering is covered by a React error boundary; an expired session clears the in-memory access token and shows a login message.
- [x] Shared list/table primitives cover all server-paginated admin lists with URL-backed server pagination and sorting, shared page-size controls, and visible row range/total. Screen-by-screen evidence is recorded in [admin list audit](../../docs/ui-ux/page-specs/admin-list-audit.md).
- [x] Shared form primitives are adopted by all existing screens with consistent labels, field-level errors, dirty-state handling, and destructive-action confirmations; the separate source audit is recorded in [admin form audit](../../docs/ui-ux/page-specs/admin-form-audit.md).
- [x] Notification delivery preferences are saved per user, and personal activity history is restricted to the authenticated user.
- [x] Account screens follow the Vietnamese-only, single-store product scope; profile and TOTP 2FA use the existing account API. English localization, PIN, and account/workspace switching remain outside this planning scope because no product or API requirement defines them.
- [x] Permission-scoped admin notifications are persisted per account, support unread filtering and read markers, and can be opened from the notification center.
- [x] The personal activity page filters by date, module, and action with URL-backed pagination and a detail sheet for available before/after snapshots.
- [x] The admin activity drawer expands related batch snapshots into individual record/field rows with before and after values.
- [x] Account sessions use the shared data table and show parsed browser, OS, device, IP, timestamps, current session, and revoke actions.

## Data
Account notification preferences are stored per user in `user_preferences`; appearance controls continue to apply locally and authentication tokens are never persisted in browser storage.
Admin notification history uses Laravel's polymorphic `notifications` table. Each notification belongs to one admin user and is delivered only to active users with the matching permission and enabled in-app or email preference. Notifications run after commit through Laravel's queue; the database queue worker must be running for new items to appear. API list/read operations re-check the user's current permissions.
Individual and bulk notification read actions are recorded in the admin activity log. Bulk read entries include before/after details for up to 100 affected notification rows and the API result retains the total updated count.

## API contract
| Method | Path | Permission | Request/response |
|---|---|---|---|
| GET | `/api/v1/admin/auth/me` | Authenticated | Current user profile, role names, permission names, and public store name/logo; sensitive settings are excluded |
| GET | `/api/v1/admin/dashboard/summary` | `orders.view` | Staff and admins can open the planned dashboard; reports pages remain protected by `reports.view` |
| GET | `/api/v1/admin/alerts` | Authenticated | Permission-filtered counts and up to five recent pending orders, failed-payment orders, pending reviews, and low-stock variants |
| GET | `/api/v1/admin/search?q=` | Per-group view permissions | Returns up to five authorized order, product, and customer matches for the topbar search |
| GET/PUT | `/api/v1/account/preferences` | Authenticated account audience | Read or update the current user's allowlisted appearance and notification preference groups |
| GET | `/api/v1/account/activity` | Authenticated account audience | Paginated activity rows scoped to the current user's ID |
| GET | `/api/v1/admin/notifications` | Authenticated admin; results permission-filtered | Paginated personal notification history and unread count |
| POST | `/api/v1/admin/notifications/read-all` | Authenticated admin; visible events only | Marks the current user's visible notifications as read |
| PATCH | `/api/v1/admin/notifications/{id}/read` | Authenticated admin; owned and permission-visible record | Marks one notification as read |
| GET | `/api/v1/admin/products`, `/api/v1/admin/orders` | Corresponding view permission | Existing list filters are opened by quick search |

## Screens/routes
See [Admin application shell](../../docs/ui-ux/admin-app-shell.md).

## Constraints and exceptions
- UI permission filtering is presentation only; API middleware must enforce access.
- The customer list, profile, export, and global-search results use `customers.view`; customer mutations remain gated by `users.manage`.
- Do not show navigation to unfinished features.
- Keep the current query-string page routing until a separate router migration is planned.
- The account menu appears once in the topbar; the sidebar footer has no account menu, following the latest admin UI plan.

## Out of scope
Complete English translations, PIN, switching accounts, permission seeding, hardware controls, and the storefront appearance picker.
