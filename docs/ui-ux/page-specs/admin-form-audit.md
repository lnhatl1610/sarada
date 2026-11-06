# Admin form audit

This source audit covers the shared form primitive acceptance item in `specs/18-admin-shell-design-system/spec.md`.

## Findings

- A TypeScript AST scan covered 58 feature `.tsx` files and 209 shared `FormField` instances. 91 fields are explicitly marked required. The remaining 118 are optional inputs, alternative-path controls, descriptive metadata, read-only values, or search/import controls; required values with a required schema are marked in the screen implementation.
- The scan found no React Hook Form screen without `useUnsavedFormGuard`.
- One file contains native form markup without that guard: `account/SessionReauthDialog.tsx`. This is a blocking reauthentication dialog that prevents dismissal until the user verifies the session, so there is no unsaved work to discard.
- Required markers and field validation were completed for staff, catalog references, customers, inventory adjustments and receipts, products and variants, account settings, campaigns, order/refund/address/shipment actions, shipping methods and rates, and store configuration. Optional product metadata, contact details, schedules, descriptions, images, and profile fields remain optional.
- Destructive actions use the shared confirmation dialog or an equivalent explicit confirmation flow; page specifications record the affected workflows.
- The shell provides success/error toast feedback for mutations that do not already handle their own outcome. Validation errors with HTTP 422 remain beside their fields, and local page notices are not duplicated by the shell.
- Shared password show/hide controls follow the selected admin locale for their accessible name.

## Verification limits

The form inventory used source inspection. The admin TypeScript/Vite production build passes after correcting the settings role enum; it reports the existing large JavaScript chunk advisory. No lint, tests, or browser visual review was run for this continuation. Visual QA remains deferred per the user's earlier preference.
