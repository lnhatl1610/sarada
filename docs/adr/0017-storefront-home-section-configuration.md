# ADR 0017: Storefront home section configuration

- Status: Accepted
- Context: The launch specification requires store staff to control the visibility and order of supported home sections. The current home page uses a fixed JSX order.
- Options: Add a relational table for section preferences, or store a validated ordered list in the existing `settings` table. A new table offers stronger row-level constraints but adds migrations and CRUD for ten fixed, site-wide section preferences. The existing settings table already stores owner-managed store configuration and supports JSON values.
- Decision: Store one ordered `home_sections` JSON setting with a fixed allowlist of section keys and an enabled flag. The Admin settings API validates every key exactly once and at least one enabled section. Public configuration returns only the normalized allowlisted values. Storefront and SEO snapshots render the configured order; missing or malformed configuration resolves to the documented default order.
- Consequences: No schema migration is needed. The Admin settings permission/audit path remains authoritative. Future section types require an API allowlist, OpenAPI update, Admin label, and Storefront renderer change. P1/P2 sections without an implementation are not exposed as toggles.
- Migration/rollback: Existing stores receive the default order when the setting is absent. To roll back, remove the `home_sections` setting; readers fall back to the same default. No existing rows are transformed.
