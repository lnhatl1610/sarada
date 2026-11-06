# Admin account menu and personal workspace

## Goal
Give authenticated staff one accessible account menu for identity, security, alerts, personal navigation, and private work items.

## Requirements
- FR-ADM-008: permission-filtered account menu summary, search, and frequent destinations.
- FR-ADM-009: private tasks with owner-scoped APIs and permission-gated task assignment.
- FR-ADM-001: the API remains the authority for admin audience and permissions.
- NFR-A11Y-001: all menu and workspace controls support labels, keyboard use, and visible focus.

## Source
`ACCOUNT_MENU_PLAN_FULL.md`, sections A–J, is a historical design source; its decommissioned optional features are excluded from current scope. Vietnamese remains the shipped locale through P2; P3 English is a later localization phase.

## Acceptance criteria
- [x] On screens narrower than 768px, the account menu opens as a bottom Sheet; its groups start closed on every opening and tapping a group expands its links inline; every menu item has at least 44px touch height.
- [x] On desktop, account-menu groups use closed submenu triggers; hovering a group reveals its links as it does for the account-completion submenu.
- [x] The account trigger announces the admin's presence and attention count; menu interactions keep Radix keyboard handling and restore focus to the trigger after closing.
- [x] The main account menu shows the signed-in avatar, name, email, role, email verification and resend, staff code when present, timezone-aware greeting and clock, recent login IP/device, and one actionable high-priority warning, including unread new-device alerts; omit the copy-email action.
- [x] The admin menu exposes the planned account, security, notification, activity, appearance, quick navigation, help, and logout groups, hiding unavailable actions by permission.
- [x] `GET /account/menu-summary` requires an admin token, filters counts by permission, caches per user for up to 60 seconds, and returns no private counts for another user.
- [x] Menu summary loads after the menu opens, refreshes every 60 seconds, and does not block navigation on failure.
- [x] Quick navigation includes pending orders, orders unchanged for at least 24 hours while confirmed/processing, pending cancellation/return requests, failed payments, pending reviews, low-stock inventory, and coupons expiring within seven days; links and counts follow destination permissions.
- [x] Authenticated customers can submit a reasoned cancellation or return request for an eligible owned order, see its review history, and cannot submit a second request while one is pending.
- [x] Staff with `orders.update_status` can approve/reject requests; cancellation approval uses the state machine, while return approval leaves inventory untouched until staff confirms receipt by transitioning the order to `returned`.
- [x] Search supports labels and documented aliases; frequent destinations are ranked per admin in local storage.
- [x] Task CRUD supports owner work, permission-gated assignment, due/priority/status filters, completion, and ownership-safe reads/mutations.
- [x] Tasks include descriptions, linked records, reminders, recurrence, and assignment to active admin accounts only.
- [x] `/me/reminders` lists the authenticated admin's scheduled and overdue task reminders, supports pagination and snoozing, and keeps reminder recurrence under the scheduled command.
- [x] The menu links to a read-only permission summary and can revoke all admin sessions with an explicit confirmation.
- [x] Login history, security score checks, and presence updates are available through admin-audience APIs.
- [x] Available admins become away after 15 minutes without browser activity and return to available when activity resumes; staff management displays effective presence.
- [x] The admin profile form reads and saves job title, department, bio, signature, and timezone through the existing profile endpoint.
- [x] The menu summary includes a seven-step profile checklist with links to each incomplete action.
- [x] P2 and P3 features follow the source plan's schema and authorization requirements; credentials and external providers remain environment-configured.
- [x] Admin notifications have permission-scoped list/search/filter APIs with unread, archive, and snooze state; the UI supports reading, archiving, snoozing, deleting, and pagination.
- [x] Focus mode hides the admin navigation chrome and restores a usable keyboard focus when exited by button or Escape.
- [x] Personal performance compares today, 7-day, or 30-day metrics with the preceding equal period, renders a daily activity chart, and hides commerce metrics according to API permissions.
- [x] Staff with `staff.view_performance` can open an assignable employee's performance page; the API filters commerce metric sections by the viewer's matching permissions.
- [x] Admins can request missing API permissions with a reason, review request history, and receive a result notice; users.manage reviewers can approve/reject, and approval grants only the requester after confirming the reviewer has that permission.
- [x] Sensitive admin account writes require a server-validated, current-session sudo confirmation with a ten-minute lifetime; when TOTP is enabled, confirmation also validates the current TOTP code.
- [x] An admin can report an unfamiliar session; the API revokes that session and its refresh token, sends a mandatory security alert, and requires a password change before further admin API access. The account page offers the forced password flow and recommends enabling TOTP.
- [x] Admins can customize the search, sidebar, lock, and shortcut-help bindings in account-synced appearance preferences and disable keyboard shortcuts from Accessibility settings; shortcuts do not activate while typing.
- [x] Trusted-device management lists only the current admin's devices and supports revoking one or all; hashed credentials are never returned.
- [x] The `system.health` permission gates the health API/page; the status check reports database latency, queue state, failed jobs, scheduler heartbeat, mail transport config, storage, and runtime versions.
- [x] Failed jobs can be paginated, retried, or removed by a user with `system.health`; exception text is limited to a sanitized first line.
- [x] Personal data export jobs are owner-scoped, run in the queue, include only safe account/workspace data, and expose signed seven-day downloads.
- [x] Account switching stores at most three recent account names/emails/avatar URLs locally, stores no password or token, revokes the current session before switching, and prefills the selected email at login.
- [x] Inventory CSV imports are recorded with actor, filename, row totals and errors; `/imports` is paginated, owner-scoped by default, and offers a row-error CSV to the owner or `exports.view_all` admins.
- [x] Owner-configured `security.password_max_age_days` warns administrators 14 days before expiry and sets `must_change_password` at admin login after expiry; directly created and invitation-created staff must change their initial password. Zero disables password age enforcement.

## API contract
| Method | Path | Audience / permission | Purpose |
|---|---|---|---|
| GET | `/account/menu-summary` | Admin | Cached, permission-filtered menu counts |
| POST | `/account/presence/activity` | Admin | Record recent browser interaction for automatic presence |
| GET/POST | `/me/tasks` | Admin; `tasks.assign` to assign another user | List or create tasks |
| GET | `/admin/imports` | Admin; `inventory.view`; all users only with `exports.view_all` | List paginated import history |
| GET | `/admin/imports/{importJob}` | Admin; owner or `exports.view_all` | Read one import result |
| GET | `/admin/imports/{importJob}/errors` | Admin; owner or `exports.view_all` | Download row failures as CSV |
| PATCH/DELETE | `/me/tasks/{task}` | Admin; owner only | Update or delete an owned task |
| POST | `/me/tasks/{task}/complete` | Admin; owner only | Complete an owned task |
| GET | `/me/performance?range=today\|7d\|30d` | Admin; order/inventory/review sections require their matching permissions | Compare personal metrics with the preceding equal period and show daily activity in the admin's timezone |
| GET | `/admin/staff/{staff}/performance?range=today\|7d\|30d` | Admin; `staff.view_performance`; section metrics also require their matching permissions | Read an assignable staff account's performance |
| POST | `/account/sessions/{session}/report` | Admin; owner session; throttled | Revoke an unfamiliar session, alert the admin, and require password change |
| POST | `/account/unlock` | Admin; throttled | Verify password and required TOTP to unlock the current screen without rotating the session |
| GET | `/admin/system/health` | Admin; `system.health` | Read system health and operational metrics |
| GET | `/admin/system/failed-jobs` | Admin; `system.health` | List failed jobs with pagination |
| POST | `/admin/system/failed-jobs/{job}/retry` | Admin; `system.health` | Retry a failed job |
| DELETE | `/admin/system/failed-jobs/{job}` | Admin; `system.health` | Remove a failed job record |
| GET/POST | `/account/privacy/exports` | Admin; owner scoped | List exports or queue a personal data ZIP |
| GET | `/account/privacy/exports/{job}/download` | Admin; owner scoped; signed; expires after 7 days | Download a ready ZIP |
| GET | `/admin/app-info` | Admin | Read app/API versions, runtime, environment, timezone, commit, and request ID for diagnostics |


The account-menu order queue contains orders with a pending `order_change_requests` row. Authenticated customers can request cancellation for pending, confirmed, or processing orders and return for delivered or completed orders. A return request requires `delivered_at` and is accepted through the exact seven-day deadline after successful delivery; the API rejects requests after that deadline. Staff review requests with `orders.update_status`. Cancellation approval uses the order state machine; return approval records the decision only. Staff may transition a delivered/completed order to `returned` only after a return request is approved and the returned goods are received, which restores inventory. Refunds remain manual; the system does not automate refund payments or returned-goods inspection.

## Data
`user_tasks` is introduced by an additive migration and is present in the current SQL snapshot. Migration files remain the source of truth for applying schema changes to another environment.




Personal performance reads actor-attributed order status history and inventory movements, completed personal tasks, and review approval activity logs. Review attribution starts when the audit write ships; older approvals cannot be attributed to an admin. Metrics for orders, inventory, and reviews are hidden as `null` when their corresponding permissions are missing. “Completed on time” counts only tasks with a due date completed by that deadline. This feature adds no schema migration.

Viewing another staff member's metrics requires `staff.view_performance`. The role is granted to `admin` and `super_admin` by an additive migration; the role-permission matrix may grant it to other admin roles. The API only accepts assignable staff/admin accounts and filters order, inventory, and review sections using the viewer's corresponding permissions.

## Verification
Feature tests should cover audience, permission, validation, owner isolation, caps, and task transitions. Component tests should cover menu search, badges, keyboard navigation, and failed summary loading. These checks have not been requested or run.
