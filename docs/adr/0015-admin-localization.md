# ADR 0015: Localize the admin with i18next

- Status: Accepted
- Context: The admin is a large React SPA with Vietnamese UI copy, account-level appearance preferences, and a requirement to switch between Vietnamese and English without affecting storefront language.
- Options: Use i18next with `react-i18next` for component hooks, interpolation, and React integration; build a small custom dictionary/context that would avoid dependencies but would need app-owned language subscriptions, fallback, interpolation, and plural handling.
- Decision: Use `i18next` and `react-i18next` in `admin/`, keep locale in the existing `admin_appearance` account preference, default to Vietnamese, and use the original Vietnamese string as the translation key with Vietnamese fallback. Bundle resources in the admin so language switching works offline.
- Consequences: Admin screens can adopt translations incrementally while untranslated strings remain legible in Vietnamese. Translation resources ship with the admin bundle; there is no runtime translation service. English completeness requires every visible admin string to be migrated to a translation key and translated.
- Migration/rollback: The locale is an additive key in the existing JSON preferences object and does not need a database migration. Remove the i18next imports/resources and the `locale` preference field to roll back. This repository has no dependency-boundary guard configuration to update.
