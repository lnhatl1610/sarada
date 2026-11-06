# Admin account menu and personal workspace

Source of truth for intended behavior: [`ACCOUNT_MENU_PLAN_FULL.md`](../../../ACCOUNT_MENU_PLAN_FULL.md). Implementation details and route behavior are summarized in [`account-menu.md`](../account-menu.md). The account menu is part of the authenticated admin shell; account and workspace pages use the same permission, localization, and accessibility rules.

## Menu shell and interactions (plan sections A–B)

- Desktop uses the header account trigger and an anchored menu. Top-level account groups are expandable, start collapsed for a compact menu, and remember their open state. At viewport widths below 768 px, the menu opens as a bottom sheet with an internal scroll region and remembered accordion groups with 44px touch targets.
- The trigger exposes presence and actionable attention count. The main menu panel shows the signed-in avatar, name, email, role, email-verification state, and recent-login details. The summary request is deferred until open, is permission-filtered by the API, refreshes every 60 seconds, and does not block navigation when it fails.
- Search matches localized labels and documented aliases. Arrow keys move through results, Home/End move to bounds, and Enter activates the highlighted result. Frequent destinations are account-scoped browser preferences.
- Menu group visibility and order, sidebar pins, collapsed groups, shortcuts, default landing destination, and dashboard/table display preferences follow the saved appearance settings described in `account-menu.md`.
- Keyboard focus remains inside the active menu/sheet, Escape closes it, and focus returns to the trigger. Touch targets on the mobile sheet are at least 44 px high. All icon-only controls have localized accessible names and a visible focus indicator.

## Account pages (plan section C, group 1)

| Page | Route | Main behavior | Guard / sensitive action |
|---|---|---|---|
| Profile | `/settings/account` | Edit profile, avatar, staff metadata, signature, timezone; preview identity; keep a session-scoped draft until save/discard. | API validates profile; destructive discard confirms; profile details remain owner-scoped. |
| Sessions | `/settings/account/sessions` | Paginated, URL-backed session history and per-session/all-session revocation. | Current session is identified; revocation requires confirmation; an unfamiliar-session report revokes that session and forces password change. |
| Activity | `/settings/account/activity` | Own audit history with filters, sorting, detail sheet, and safe before/after values. | Never expose passwords, tokens, TOTP values, or other credential material. |
| Login history | `/account/login-history` | Own successful/failed login metadata and security score explanations. | Admin audience and owner only. |
| API tokens | `/settings/account/tokens` | Create/list/revoke personal tokens and show the plaintext once. | `api_tokens.manage`, max 10 tokens, limited scopes/expiry; creation and revocation require recent sudo; do not persist plaintext. |
| Privacy | `/settings/account/privacy` | Queue personal-data export, inspect retention, clear browser/query cache, download personal data. | Export is owner-scoped and signed for seven days. |

## Personal workspace (plan section C, group 2)

- Tasks support title, description, priority, status, due/reminder time, recurrence, linked records, completion, snoozing, and assignment only to active admins. Reads and writes are owner-scoped; assigning another admin requires `tasks.assign`.
- `/me/reminders` is owner-scoped, paginated, and supports snoozing; recurrence remains the scheduled command's responsibility.

## Notifications and appearance (plan section C, groups 3–4)

- Notification history supports unread, archive, snooze, search, filters, pagination, mark-read, restore, and delete. Unread totals are permission-filtered; archived items do not contribute to the unread badge. Retention is documented with the relevant settings.
- Appearance includes locale-aware formatting, density/font/zoom, focus/high-contrast, shortcut bindings, default landing page, sidebar/group preferences, pinned routes, dashboard widgets, and table-column defaults. Invalid or no-longer-authorized landing routes fall back to an accessible destination.

## Quick access, downloads, operations, help, and session (plan section C, groups 5–9)

- Quick links are filtered by the same permission used by their destination and use URL-backed filters: pending orders, confirmed/processing orders unchanged for at least 24 hours, orders with pending cancellation/return requests, failed payments, pending reviews, low stock, and coupons expiring within seven days. Quick-create actions are shown only when the matching create permission exists; content pages use the existing blank `/pages` editor and require `content.manage`.
- Downloads list the current admin's jobs by default; `exports.view_all` controls organization-wide visibility. Workers recheck active status and data permission, files are private with bounded retention, and a maximum of three admin exports may be active per user.
- System health, failed jobs, backups, imports, and permission review are gated by their corresponding permissions. Diagnostics redact credential-like fields and show request correlation information.
- Help articles, policy/privacy pages, diagnostics, release notes, and licenses are localized.
- Logout revokes the current admin session before redirecting to login. Account switching stores at most three display identities locally and never stores a password or token.

## Authorization, data model, and API contract (plan sections D–E)

- The API is authoritative for the admin audience, owner isolation, and permissions. The frontend hides unavailable actions for presentation but does not replace API authorization.
- Admin activity logs default to 365 days; `activity.retention_days` is configurable under Store Settings → Security, shown on the account privacy page, and enforced by the daily `activitylog:prune` command.
- User-specific workspace, identity, notification, and security records are scoped to the authenticated user. Schema facts and the current 64-table SQL snapshot are documented in [`docs/architecture/data-model.md`](../../architecture/data-model.md); migrations remain the schema source of truth.

## Required UI states

Every data-backed page has loading, empty, error with retry, and success states. Mutations disable duplicate submission, preserve entered data after validation/network errors, show field-level validation where available, and confirm destructive actions. Tables retain URL-backed search/filter/sort/page state where supported. Dialogs and sheets label controls, expose errors to assistive technology, support keyboard navigation, and restore focus to the initiating control.

Password policy is owner-controlled in Store Settings → Security. A maximum age of `0` disables expiry; an expired password is forced at admin login, and the account menu links to password change beginning 14 days before expiry. Staff created directly or through an invitation must change their initial password before using the admin workspace.

## Traceability

| Plan area | Acceptance / evidence |
|---|---|
| A–B | Menu tree, responsive sheet, search/frequent links, permission-filtered summary and keyboard behavior are documented above and in `account-menu.md`. |
| C1–C9 | Account, workspace, notification, appearance, quick access, downloads, system, help, and session behavior are covered above. |
| D | API permission checks and owner scoping are mandatory; see `docs/architecture/auth-rbac.md` and the feature spec API table. |
| E | SQL snapshot inventory and current schema facts live in `docs/architecture/data-model.md`; additive migrations are documented there and in the feature spec. |
| F–J | Localization, acceptance, operational setup, implementation status, and release follow-ups are tracked in `specs/21-admin-account-menu/` and `PROGRESS.md`. |
