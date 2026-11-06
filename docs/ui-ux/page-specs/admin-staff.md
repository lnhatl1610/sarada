# Admin staff management

Route: `/staff`. Requires `users.manage`. The page manages staff accounts, invitation links, and verified accounts awaiting approval.

## Staff accounts

- URL-backed views: all, active, pending, blocked, and invited. Each tab shows a server count; counts honor current search, and active/blocked counts also honor the staff role and last-login filters. The active and blocked views apply their matching account status; pending and invited focus their corresponding secondary lists.
- Search by name, email, or phone. The all/active/blocked list supports role and last-login date range filters, sortable columns, shared page size, per-account column preferences, removable filter chips, and URL-backed filters.
- The staff table shows avatar or initial, name, email, phone, role, status, last login, creation time, and row actions. Data is server-paginated with loading, error/retry, empty, and no-match states.
- Row actions edit the account, block/unblock it, request a password-reset email, revoke its sessions, open its activity log when permitted, or delete it. The current user cannot block or revoke their own session from this list. Role-management restrictions are enforced by the API and reflected in the available controls.

## Invitations

- The invited view searches by recipient email and lists role, inviter, expiry, status, and actions. Invitations can be resent or revoked; expired invitations can be resent to issue a fresh link.
- Search and sort state are URL-backed and paginated; changing them resets the invitation table to its first page.
- The invitation form collects email, assignable role, link lifetime (24 hours, 48 hours, or 7 days), and an optional message. Unsaved changes require confirmation before dismissal.
- The invitation acceptance page localizes its heading, invitation details, role label, password fields, terms control, validation, and loading/error/submit states. Invitation expiry follows the selected locale; recipient email and assigned role remain data from the invitation.

## Pending approvals

- The pending view searches verified accounts awaiting review and lists name/phone, verified email, verification time, registration time, and the role to assign.
- Approving assigns the selected role; rejecting removes the pending request. These actions require API authorization and report success or failure in the page.
- Search and sort state are URL-backed and paginated; changing them resets the approval table to its first page.

## Interaction and safety

- The role-permission matrix follows the selected admin locale for role descriptions, permission modules and actions, accessible checkbox labels, bulk controls, confirmation copy, and save/loading/error feedback. Permission identifiers remain visible for auditability.

- Destructive account deletion, blocking, unblocking, and session revocation use confirmation dialogs. Forms validate required name, email, password, role, and status fields and show server validation errors beside the relevant inputs.
- Staff create/edit labels mark required name, email, role, and status fields with `*`; password is required only on create and optional on edit. Validation errors remain beside their matching controls.
- Staff management follows the selected admin locale for role labels, search and filter controls, table columns and statuses, invitation and approval queues, forms, validation, confirmation dialogs, row menus, accessible names, and status announcements. Staff names, emails, invitation messages, and reviewer-provided content remain as entered. The invitation acceptance page follows the selected admin language.
