# Tasks: Authentication

- [x] Configure compatible JWT dependency and audience/session guards; short-lived bearer credentials are signed JWTs and the existing session row supports immediate revocation.
- [x] Add refresh-token schema, rotation/reuse revocation, and logout.
- [x] Add role/permission seeding and API authorization; `AdminPermissionsSeeder` seeds the API permission catalog and role grants, while protected module routes apply audience and permission middleware.
- [x] Add frontend login return routing and single-flight refresh flows.
- [x] Complete admin login UX with password visibility, an accessible pending state, and a direct password-recovery link.
- [x] Lock admin login for 15 minutes after five failed credentials and show the remaining time on `/locked`.
- [x] Support an optional 30-day trusted admin browser after successful TOTP or recovery-code verification; store hashes only and revoke trust on password or 2FA credential changes.
- [x] Update OpenAPI and architecture/auth decision notes. Traceability remains to be reconciled after the full feature set.
- [x] Add admin password change with current-password verification and revocation of every access/refresh session.
- [x] Add public registration email verification, pending approval, resend verification, owner approval/rejection, and decision email.
- [x] Separate optional registration marketing consent from required terms acceptance and persist newsletter opt-in only when selected.
- [x] Add staff invite creation, expiry, token rotation on resend, revocation, accept page, password setup, and account activation.
- [x] Update OpenAPI, data model, ERD, and auth documentation for registration and invitation workflows.
