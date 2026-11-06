# Spec: Authentication and RBAC

## Goal
Customers and staff can sign in to their own audience, refresh sessions safely, and access only permitted operations.

## Requirements
FR-AUTH-001..005, FR-ADM-001, NFR-SEC-001, NFR-SEC-003, BR-ADM-001.

## User story
As a customer or staff member, I want to authenticate securely so I can use only my account's allowed features.

## Acceptance criteria
- [x] Registration validates unique email, hashes the password, requires terms acceptance, and creates an unverified `pending_approval` account without issuing a session.
- [x] Registration presents optional marketing-email consent separately from required terms acceptance and creates a newsletter subscription only when the customer opts in.
- [x] Registration emails a signed verification link; the account must be approved before storefront login.
- [x] Public registration defaults on in local/testing/UAT and off elsewhere; `STORE_PUBLIC_REGISTRATION_ENABLED` and saved owner setting override the environment default. Both registration-status response and registration endpoint use the same effective setting. Local UAT confirmed the endpoint, signed verification link, verified-email/pending-approval state, and rendered registration form.
- [x] Staff invitations use expiring hashed one-time tokens, allow 24/48/168-hour expiry, can be resent/revoked, and create an active verified account only after password and terms are submitted.
- [x] Owner approval assigns a role and sends a decision email; only `super_admin` can grant the `admin` role.
- [x] Staff management exposes the planning's owner, admin, sales manager, warehouse, customer service, content editor, and accountant roles; legacy staff accounts remain supported.
- [x] `/roles` shows preset descriptions, assigned user counts, and a permission matrix. The store owner role is immutable and only `super_admin` may save matrix changes.
- [x] Login returns an audience-bound signed JWT and sets a refresh cookie; the JWT is bound to a revocable session row.
- [ ] Refresh rotates the opaque cookie; reuse revokes only that token's full replacement chain and leaves unrelated device/session families active.
- [ ] Storefront audience cannot access admin routes; permissions are enforced by API.
- [ ] Logout and password reset revoke refresh sessions.
- [x] An authenticated admin can change their password after verifying the current password; all access and refresh sessions are revoked and both audience cookies are cleared.
- [x] An account email change requires the current password, sends a one-hour single-use link to the new address, keeps the current address active until confirmation, then updates the verified address and notifies the previous address.
- [x] When access and refresh credentials cannot restore an admin session, a blocking dialog rechecks the password and any enabled 2FA while keeping the current route mounted; successful reauthentication resumes the page and refreshes its data.

## Data
Users, pending_email_changes, roles/permissions, refresh_tokens, and Sanctum personal_access_tokens; see `docs/architecture/data-model.md`.

## API contract
`GET /api/v1/auth/registration-status`, `POST /api/v1/auth/register`, `POST /api/v1/auth/resend-verification`, `POST /api/v1/auth/login|refresh|logout`, `GET /api/v1/auth/me`; admin equivalents under `/api/v1/admin/auth`, including `POST /api/v1/admin/auth/password`. `GET /api/v1/account/sessions` accepts optional `page` and `per_page` parameters and returns pagination metadata when either is supplied; callers without them retain the legacy response. Staff invitation and approval endpoints are under `/api/v1/staff-invitations` and `/api/v1/admin/staff`.

## Screens/routes
Storefront login/register/verify-email/pending-approval/forgot password; admin login, `/staff` invitation/approval management, and `/accept-invite/:token`.

## Admin login UI
- [x] Email and password fields show Vietnamese API validation beside the matching field.
- [x] Password visibility can be toggled with an accessible button.
- [x] Login submission disables the button and displays a loading indicator and status text.
- [x] The forgot-password link opens `/forgot-password`.
- [x] Password recovery uses a generic delivery message, a separate `/forgot-password/sent` screen with a 60-second resend countdown, and a `/reset-password/done` confirmation screen.
- [x] Reset-password form shows a four-level strength meter, password requirements, and a link to request a replacement reset link.
- [x] Password reset emails route staff to the admin SPA and customers to the storefront; both deep links carry the reset token and email required by the API.
- [x] Storefront now includes forgot-password, sent, reset, and success screens so customer reset links resolve to working pages.
- [x] Login returns to the same-origin route the user requested; expired sessions preserve that route through login, and login/recovery routes cannot become return destinations.
- [x] Admin login locks the email/IP pair for 15 minutes after five incorrect credential attempts and directs the user to `/locked` with a remaining-time countdown; inactive admin accounts receive the same page with administrator contact guidance.
- [x] After a successful admin 2FA challenge, users may trust the current browser for 30 days. The token is hashed at rest, rotated on use, and revoked after password or 2FA credential changes.
- [x] Admin login, lockout, password recovery, invitation acceptance, and error states share a responsive split-screen layout with a 420px form column, branded fashion illustration panel, and terms/privacy links to the published Storefront CMS routes `/pages/terms` and `/pages/privacy`; the brand panel is hidden below 900px.
- [x] Six-digit administrator authenticator codes use six labeled input cells with automatic focus advance, keyboard navigation, paste, and one-time-code autofill support on login, session reauthentication, and account 2FA management.

## Shared auth layouts
- [x] Admin and storefront login, registration, email verification, pending approval, invitation acceptance, password recovery, and maintenance states use the responsive split-screen layout; the brand panel hides below 900px.
- [x] Storefront registration shows password strength and policy checks, and links required terms consent to the published terms page.

## Constraints and exceptions
Rate-limit login, keep access token in memory, cookie refresh scoped per audience, no social login in first release.

## Out of scope
Social login.
