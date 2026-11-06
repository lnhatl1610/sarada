# ADR-0006: Admin theme and application shell

- Status: Accepted
- Date: 2026-10-22
- Decision owners: Product owner

## Context

The current admin interface has a single light style, a fixed-width navigation rail, and several menu links that lead to roadmap placeholders. Admin needs a consistent shell, accessible navigation, and a compact theme choice without exposing the storefront's full appearance catalog.

## Decisions

1. Use an enterprise operations style (S14) with comfortable density, 8px control radius, 12px card radius, and subtle shadows.
2. Keep burgundy as the admin accent over warm neutral workspace surfaces. Use a monochrome sidebar that follows the selected theme: white/black in light mode and black/white in dark mode, with inverse active-item colors. Use the scoped light/dark token values in `docs/ui-ux/DESIGN.md`.
3. Support light and dark themes only. On first visit, follow `prefers-color-scheme`; persist an explicit choice in local storage.
4. Do not add the storefront appearance picker to admin.
5. At desktop widths, keep a collapsible sidebar. At tablet/mobile widths, use an off-canvas navigation drawer. Store the collapsed preference locally.
6. Do not render links for admin areas without a working screen. Guard supported screens by permissions returned from `/admin/auth/me`; API authorization remains authoritative.
7. Keep the existing lightweight CSS revenue chart during this shell phase. Reconsider a shared chart dependency when the dashboard is expanded.
8. Keep comfortable table density as the only density until user preferences can be stored server-side. Defer compact density.
9. When export is implemented, produce CSV with UTF-8 BOM for spreadsheet compatibility.
10. When page content editing is implemented, use a Markdown editor first and sanitize the rendered HTML on the server.

## Consequences

- Admin theme values are scoped to `.admin-shell`, leaving storefront theme settings independent.
- Sidebar links are limited to implemented pages and are filtered by API-provided permissions.
- Error pages, notification center, session-expiry dialog, shared table primitives, and new CRUD modules remain separate follow-up work.
- No API routes or permissions are added as part of the shell decision.

## Alternatives considered

- A palette picker in admin: rejected because staff need a predictable interface for operations and training.
- A full component rewrite in the shell pass: rejected because existing admin pages are still a single legacy component and new business screens need their own feature specs and API contracts.
