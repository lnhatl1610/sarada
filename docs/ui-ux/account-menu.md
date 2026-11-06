# Admin account menu

For the complete page and interaction requirements mapped to the source plan's A–J sections, see [`page-specs/admin-account-menu.md`](page-specs/admin-account-menu.md). The detailed behavior below records implementation-specific limits, endpoints, and states.

The account menu is available from the authenticated admin header. Its main panel always shows the signed-in avatar, name, email, role, email-verification state, and recent-login details without opening a submenu. It loads immediately; the count request runs after opening and refreshes on a 60-second interval. If the summary request fails, the menu stays usable and hides the count badges.

The **Dữ liệu & tải xuống** group links to the Downloads Center for every admin, inventory import history for users with `inventory.view`, and scheduled reports for users with both `reports.view` and `reports.schedule`. The group participates in mobile accordions and saved menu visibility/order preferences.

The System group includes a direct link to the failed-job section on System health for admins with `system.health`. The staff page exposes password-reset email, session revocation, and 2FA reset actions only to users with `staff.security`; resetting 2FA asks for a reason and the shared sudo confirmation.

Desktop keeps the anchored dropdown and presents top-level menu groups as closed submenu triggers; hovering a group reveals its links, like **Hoàn thiện tài khoản**. Below 768px, it opens in a bottom Sheet with an internal scroll area. Groups start closed on every opening and tapping expands them inline; touch targets are at least 44px tall.

Summary counts come from `GET /api/v1/account/menu-summary`, which requires an admin audience token. The API returns only counts permitted by the current admin's roles and caches them per user for at most 60 seconds. System health is computed and returned only when the admin has `system.health`; others receive `unavailable`. Security warnings and system-health errors contribute to the critical account-trigger badge, including when a health error is the only outstanding alert. Unread notification totals include weekly reports only for `reports.view` users and include the current admin's own digest, and export-complete notifications.

Menu search matches the current Vietnamese or English labels plus Vietnamese and English aliases, including `pass`, `password`, `dark`, `otp`, and `logout`. Press Enter in the search field to open the first result; Arrow Down/Up moves through results, and Home/End jumps to the first/last result. The first three frequently used destinations are stored in local storage under a key scoped to the current admin. This history is local to the browser and is not sent to the API.

Quick navigation shows pending orders, orders awaiting processing for at least 24 hours, orders with pending cancellation/return requests, failed payments, pending reviews, low-stock inventory, and coupons expiring in the next seven days. Each link requires the same permission as its destination (`orders.view`, `reviews.moderate`, `inventory.view`, or `coupons.view`); the menu summary returns zero when a user lacks that permission. The order and coupon lists consume the corresponding URL filters. Staff with `orders.update_status` review customer requests in order details. The menu also contains private tasks and reminders.

Quick navigation's seven queues use URL-backed order and coupon filters. The permission-filtered quick-create submenu includes product, collection, coupon, banner, content-page, and inventory actions; personal tasks and notes are available to every signed-in admin. The header quick-create menu and account menu expose the same content-page entry.

The menu exposes presence choices and shows the current status beside the avatar. An available admin becomes away after 15 minutes without browser activity and returns to available when activity resumes; busy, manually away, and hidden selections remain in effect until their expiry. Staff management shows the same effective status with a text label as well as a color cue. The **Tài khoản & bảo mật** submenu contains login history, device/session controls, account switching, and sign-out on all devices. “Đăng xuất mọi thiết bị” revokes admin sessions and trusted-device records, then returns the current browser to login. “Đăng nhập bằng tài khoản khác” keeps at most three recent account names, emails, and avatar URLs in browser storage; selecting one revokes the current session and opens `/login` with that email prefilled. Passwords and tokens are never stored in the recent-account list.

The main account panel shows email verification with a resend action, staff code when available, a greeting and live clock in the account timezone, and the latest successful login's IP and browser/platform. It displays one actionable warning at a time, prioritizing unverified email, an expired password, missing admin two-factor authentication, an unread new-device alert, a password expiring within 14 days, then system health errors the user can view. The owner configures password age in Store Settings → Security; `0` disables expiry. Expired passwords are enforced by admin API authentication and the account page provides the forced change flow.


The admin profile form includes staff metadata fields for job title, department, bio, signature, and timezone. These fields use the existing account profile API and stay optional.

Appearance settings can remember collapsed sidebar groups per admin account in the current browser. When enabled, group open/closed changes are stored under an account-scoped local key and restored on the next visit; the setting itself syncs with the account preferences API.

Admins can pin up to eight permitted destinations (dashboard, orders, products, inventory, and personal tasks) above the normal sidebar groups. Pin order syncs with account preferences, unauthorized destinations are hidden, and the Appearance page supports drag and drop plus up/down controls to reorder entries.

Admins can select a default landing page from the destinations they can access. After authentication, the admin shell loads account permissions and appearance preferences before applying this destination. A requested protected return URL takes precedence; a saved destination that is no longer permitted falls back to the first available destination.

The notification center at `/notifications` groups notices by date and supports all/unread/archived views, event and priority filters, text search, pagination, mark-read, archive/restore, snooze (one hour, this afternoon, or tomorrow), and delete. Archived notices are excluded from the unread badge; snoozed notices return to the active list at their scheduled time. Read notices older than 90 days are pruned daily.


The same page provides admin-only Do Not Disturb settings: mute email for one or four hours, until tomorrow, until manually disabled, or a custom time; and configure weekly quiet hours by weekday and time, including windows that cross midnight. Notices continue to appear in the notification center. Urgent email can be allowed during quiet hours; security alerts always bypass quiet hours. The account menu summary marks notifications as muted while a temporary mute or scheduled quiet window is active. Times use the admin profile timezone.

Admins can configure a daily or Monday morning digest with a local send time and selected sections: pending orders, net revenue for the previous day/week, low stock, pending reviews, and their own overdue tasks. The digest uses the independent `Bản tin tóm tắt` channel preference, includes only data allowed by the admin's permissions, omits empty sections, and is skipped when there is nothing to report. Daily/weekly delivery state is recorded per account and period to prevent duplicate sends. The scheduler must be active (`npm run dev` starts it locally; production must invoke Laravel's scheduler each minute).


Focus mode is available from the account menu. It hides the admin sidebar and header, moves focus to the main content, and can be exited with the floating button or `Esc`; focus returns to the account menu trigger after exit.

Quick account-menu utilities copy the current URL, invalidate open queries to refresh data, or remove inactive query data and refresh open queries. Cache clearing leaves the current login and saved preferences intact.


The plan for the full menu and its remaining delivery phases is [ACCOUNT_MENU_PLAN_FULL.md](../../ACCOUNT_MENU_PLAN_FULL.md); the implementation checklist is [spec 21](../../specs/21-admin-account-menu/spec.md).

Personal tasks support descriptions, priority/status, due dates, reminders, optional daily/weekly recurrence, links to orders/products/customers/inventory vouchers, and assignment to active admin accounts for users with `tasks.assign`. The `/me/reminders` page lists the current admin's scheduled and overdue task reminders, with paging and snooze actions for 10 minutes, one hour, or 08:00 the next day in the admin's timezone. The scheduler sends due reminders through the channels selected under personal notification preferences.




New admin accounts use the light theme by default; legacy dark/system defaults migrate to light once, and later saved theme choices apply. Admin appearance preferences can hide or reorder account menu groups. Reordering supports drag and drop plus move buttons, and the default order can be restored. The account menu mirrors the sidebar's permission-filtered categories and destinations; hovering a group reveals its nested links. The sidebar stays full-width while its table-of-contents groups start collapsed. Account-menu groups also start closed each time the menu opens. Logout and session controls stay available. The layout is synchronized with the admin account preferences API.



The header notification bell groups operational alerts and the latest saved personal notifications; it refreshes the operational counts once per minute while open data remains cached. `/notifications` provides event, priority, unread/archive, text search, pagination, read, archive, snooze, and delete controls. These controls, labels, and date formatting follow the selected locale.

Global search opens from the admin header or the configured keyboard shortcut. It searches orders, products, customers, and matching admin pages; trigger/dialog labels and loading, error, and empty states follow the selected locale.

The role-aware introduction tour starts automatically when an admin first signs in. It shows destinations permitted for that role and opens them in a separate tab so the tour stays in place. Admins can temporarily pause automatic display for one hour; the pause timestamp is saved with account preferences and applies across devices after reload. “Bỏ qua” permanently dismisses the tour, while the account menu can still rerun it from `/help/tour`. That page also stores a per-account checklist for adding a first product, checking shipping, inviting staff, and enabling two-factor authentication, filtered to the admin's permissions. Tour copy, progress labels, checklist actions, and loading/error feedback follow the selected Vietnamese or English locale; a failed progress request can be retried from the tour page.

Keyboard shortcuts for global search, sidebar toggle, screen lock, and shortcut help are configurable in account-synced appearance preferences. Users can disable shortcuts in Accessibility settings. Bindings do not fire while typing in a form field, and the help dialog shows the current assignments.


Appearance preferences also support 14/16/18px root font sizing, 90/100/110/125% page zoom, breadcrumb visibility, high contrast, and a stronger keyboard focus ring. These settings are stored in the same account-synced `admin_appearance` JSON and applied to the document root so they take effect immediately.

Appearance formatting preferences control calendar date order (`DD/MM/YYYY` or `YYYY-MM-DD`), relative dates, 12/24-hour time, numeric separators (`vi-VN` or `en-US`), and whether the VND symbol appears before or after the amount. Shared admin date and currency formatters read these settings and the signed-in profile timezone. Week start can be saved as Monday or Sunday; it will affect a calendar when the admin UI includes a calendar component.

The Appearance page also stores a default dashboard period (7, 30, or 90 days) and whether comparison with the preceding period is enabled by default. These defaults sync with the admin account and are applied when the dashboard mounts; the dashboard's period control can still be changed for the current visit.

The same page controls dashboard widget visibility and order. Admins can hide or show each available widget and reorder visible widgets by dragging or using move buttons. The dashboard omits widgets the account cannot access, including recent orders without `orders.view`, top products without `products.view`, and recent activity without `settings.manage`.

Appearance settings can be exported as a versioned JSON file and imported for the signed-in admin. Backups contain only `admin_appearance`; importing requires schema version 1, validates every field through the existing preference rules, and replaces only that preference group. It does not include credentials, notification channels, or security settings.

Appearance preferences also let admins set the default visible columns for each data table they have visited. Table definitions are registered in browser storage, while visible column IDs are account-synced through `admin_appearance.table_column_defaults`; admins can restore all columns for an individual table.

Notification preferences include a browser-push channel. Admins can register multiple devices, send a queued test notification, and revoke a device. The browser uses a service worker and requires HTTPS or localhost; the API stores VAPID subscriptions per user and the server must be configured with a stable VAPID key pair.

The account menu opens with `Alt+A` when keyboard focus is outside an editable field. Its summary loading state includes a skeleton indicator, and a failed summary remains retryable without blocking the rest of the menu.

When the browser reports offline, internal menu links are dimmed, marked unavailable to assistive technology, and show a native “Cần kết nối” tooltip; activating one is blocked with a status notice. The browser's online flag is a connectivity hint and may not guarantee that the API is reachable.

`/help/changelog` shows the current configured app version and Markdown release notes. Each admin's last viewed version is stored in `user_preferences.admin_changelog`; the account menu displays a new badge until the current version is marked as viewed. Changelog controls follow the selected admin locale; release notes remain Vietnamese Markdown content. `/help/licenses` provides a searchable npm and Composer package/license listing generated before the admin production build from the installed npm packages and `api/composer.lock` (falling back to Composer's installed manifest) and follows the selected admin locale.


The personal activity page at `/settings/account/activity` shows only the signed-in administrator's own actions. Its filters, module/action names, change detail sheet, and empty/error feedback follow the selected Vietnamese or English locale.

The system menu group is shown only to users with relevant admin permissions. Users with `system.health` can open `/system/health`, which refreshes every 30 seconds and shows database latency, queue and failed-job counts, scheduler heartbeat, mail configuration, storage capacity/write access, latest backup age, and PHP/Laravel/environment versions. The direct `/system/failed-jobs` destination focuses the failed-job list and shows its count in the account menu. Users with `system.backup` can open `/system/backups`, queue a database plus uploaded-media ZIP, review the latest 50 manual runs, and download private archives. Archives require `BACKUP_ARCHIVE_PASSWORD`, are encrypted and retained for seven days; downloads are authenticated. Production backups require PHP ZIP and `mysqldump` on Linux. The menu summary shows a compact health status badge.


The Downloads Center also lists queued CSV exports for customers, products, orders, inventory, activity logs, and report sections. Exports over 5,000 rows are queued; smaller exports download directly. Workers recheck the owner's active status and relevant read permission, preserve validated filters, store files privately for seven days, and notify the owner when a file is ready. Each admin can have at most three active data exports; failed or expired exports can be retried. The page translates export type/status, progress, dates, sizes, retry/delete/download feedback, empty/loading/error states, and actions using the selected admin language.


The TOTP and trusted-device panels follow the selected Vietnamese or English locale for enrollment, status, recovery-code actions, device revocation, confirmations, feedback, and timestamps. Recovery codes remain available for one-time download or copy only immediately after creation.

Profile-photo upload uses a square 512 × 512 crop dialog. Its crop instructions, controls, accessibility labels, processing errors, and upload action follow the selected locale.

Admins with `api_tokens.manage` can open `/settings/account/tokens` to create up to 10 personal API tokens with selected permissions and 7-, 30-, or 90-day expiry. The owner may enable non-expiring tokens in Security settings. Creating or revoking a token opens the shared ten-minute sudo mode dialog when the current session has not been recently confirmed; sudo mode also requires a TOTP code when enabled. Plaintext is shown once after creation; the table shows scopes, creation and last-use times, last-use IP, expiry, and revoke action. Token management and changes are recorded in personal activity without logging credential values.

The personal API token page localizes permission names, token lifecycle actions, one-time plaintext guidance, feedback, and dates in Vietnamese and English.




When the admin session expires during API activity, the blocking reauthentication dialog retains the current page and supports password plus TOTP or a recovery code. Its prompts, errors, and actions follow the selected locale.

New passwords across registration, invitations, account changes, and resets are checked against known breach data with Laravel's `Password::uncompromised()` rule. The verifier sends only the first five characters of the SHA-1 password hash to the Pwned Passwords range API; it never sends the password or complete hash. The outbound request times out after five seconds.



The admin profile form enforces a 2–255 character name and keeps an account-scoped draft in the current browser session until save or discard. A colleague-facing preview reflects the current name, job title, avatar, and presence while editing. Avatar selection supports JPG, PNG, or WebP up to 2 MB, square cropping, zoom, positioning, and rotation in 90-degree increments; the preview and uploaded image use the same orientation. When no avatar image is set, the admin can choose an initials background color; this visual preference is stored per account in the current browser. Read-only metadata includes role, staff code, account creation and update times, account status, and creator when available. Admin-created order confirmation and shipment emails, plus internal order notes, append the signed-in admin's configured signature when present; storefront checkout emails remain unsigned.

The personal performance page and permission-gated staff performance view localize metric names, comparison periods, chart legend and accessible description, daily data, and loading/empty/error states. Dates and numeric values follow the selected locale and configured date format.

The shared sidebar user profile menu follows the selected locale for its accessible names, session status, profile and account settings links, help/version sections, and logout action.

Admin forgot-password, reset-password, resend, and completion screens follow the selected locale for instructions, form validation, password strength guidance, status feedback, and resend countdown.

Help pages are available at `/help`, `/help/policy`, and `/help/privacy`. The guide includes searchable product, inventory, order, marketing, report, and account articles with per-article usefulness feedback. Article and policy content is bundled in Vietnamese and English and follows the selected admin locale; article feedback IDs remain stable across languages. `/help/diagnostics` combines API/runtime details with the current browser, screen size, account ID, and request ID and can copy the summary for troubleshooting. The license catalog and diagnostics labels, states, and copy feedback follow the selected admin locale.

The `/system/backups` page localizes backup labels, actions, job states, feedback, and timestamps using the active admin locale.

Dashboard action alerts and the recent-activity widget follow the selected admin locale for their labels, descriptions, loading, empty, and retry states.

Product tag entry and bulk variant editing use localized labels, validation feedback, accessibility names, and usage guidance.

The system health and failed-job page localizes service labels, health states, summaries, pagination, retry/delete confirmations, and timestamps using the active admin locale. Technical health messages and failed-job summaries are provided by the API and displayed as returned.
