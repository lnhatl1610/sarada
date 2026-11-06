# Spec: Admin settings and preferences

## Goal
Let staff personalize admin display and manage store-wide operational settings through a permission-checked, audited API.

## Requirements
- FR-ADM-007: persist supported admin display preferences per admin account and keep a local cache for immediate startup.
- FR-ADM-SET-001: persist account notification choices and personal activity/display settings per account.
- FR-ADM-SET-002: manage store identity, payments, shipping, email, SEO, security, and maintenance through `settings.manage`.
- NFR-A11Y-001: all preference controls are labeled and keyboard accessible.

## User story
As an admin user, I want to choose a comfortable display mode so daily store management is easier to read.

## Acceptance criteria
- [x] Theme supports light, dark, and following the operating system, with immediate preview.
- [x] Accent, table density, and reduced motion update the shell immediately.
- [x] Preferences persist after reload without storing authentication credentials; supported appearance values sync through `/account/preferences` and use local storage as the startup cache.
- [x] Reset restores the documented defaults.
- [x] Store-wide settings require a permission-checked API and audit record before being exposed. Successful updates write actor, action, path, and changed field names to `activity_logs`; setting values are excluded from the audit payload.
- [x] Store settings cover identity/contact, favicon/business hours, payment flags and non-COD unpaid order timeout, shipping defaults, email sender/templates/alert lists, SEO defaults, security/password policy, and maintenance.
- [x] General store settings display the API server timezone and fixed VND currency as read-only fields.
- [x] Store settings keep Save/Cancel controls visible at the bottom while scrolling; Save is disabled until the current settings form changes.
- [x] Email test sends use saved templates; test actions stay disabled while settings are dirty or the test recipient is empty. Order and shipment emails queue after business events; low-stock alerts queue when available stock crosses down through its threshold.
- [x] Weekly report notifications summarize paid, fulfilled orders net of recorded refunds and current low-stock variants for the previous Monday–Sunday period. They dispatch Monday at 08:00 in the application timezone through each active `reports.view` admin's saved in-app/email preferences and link to the matching revenue report.
- [x] A scheduled command cancels expired non-COD unpaid orders through the state machine, releasing inventory and coupon usage.
- [x] The storefront applies public SEO defaults and blocks its storefront shell while maintenance is enabled; the admin API and SPA remain accessible.

## Data
Personal display preferences use browser local storage. Account notification preferences are server-stored per account. Store-wide settings use the key-value settings table and require `settings.manage`.

## API contract
| Method | Path | Permission | Request/response |
|---|---|---|---|
| GET/PATCH | `/admin/settings` | `settings.manage` | Editable store settings key/value envelope |
| POST | `/admin/settings/test-email` | `settings.manage` | Send selected saved email template to a supplied address |
| GET | `/auth/registration-status` | Public | Registration, maintenance, and safe SEO/branding defaults |

## Screens/routes
`/?page=preferences` — see [Admin settings and preferences](../../docs/ui-ux/admin-settings.md).

## Constraints and exceptions
- Never store access or refresh credentials in local storage.
- Only expose preferences that the current admin UI can actually apply.
- Browser display settings must not alter commerce data or checkout behavior.

## Out of scope
Hardware controls, firmware/device operations, integrated payment gateways, and analytics script execution without explicit analytics consent.
