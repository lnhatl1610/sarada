# Component Guidelines

Both `admin/` and `storefront/` use shadcn/ui as a source-owned component system on top of Tailwind CSS v4. Each app has its own `components.json`, theme tokens, and `src/components/ui/`; do not import components across the app boundary.

- Add only the shadcn components needed by a feature with the shadcn CLI from that app's directory. Generated components are project source and may be adapted to match the product.
- Keep shared primitives in `src/components/ui/`; keep feature-specific composition beside its feature under `src/features/`.
- Use semantic theme utilities such as `bg-background`, `text-foreground`, `border-border`, `bg-primary`, and `text-muted-foreground`. Keep burgundy as the restrained primary accent and preserve each app's existing visual identity.
- Use `cn` from `@/lib/utils` when combining conditional or caller-provided classes. Use Lucide React for interface icons and provide accessible names for icon-only controls.
- Prefer shadcn primitives for new forms, dialogs, menus, sheets, buttons, and feedback. Existing pages may keep their established CSS until that page is intentionally refreshed; avoid a full visual rewrite as part of adding a component.
- Preserve Vietnamese labels, visible keyboard focus, keyboard operation, responsive behavior, loading/empty/error/success states, and reduced-motion preferences.
- Route visible labels and accessibility text in shared primitives through the admin translation hook; include shared dialog close controls, breadcrumb overflow/navigation labels, and sidebar sheet/rail labels.
- Admin data tables use the shared TanStack Table adapter and retain server-side paging, sorting, and filtering. Storefront product cards stay image-led and mobile-first, with a 3:4 image ratio where possible.
- Admin table row actions use the shared accessible `RowActionsMenu` (`⋯`) for secondary actions. Keep high-frequency status controls in their dedicated column, place destructive actions last with the destructive style, and give each trigger a row-specific accessible name.

Keep `admin/components.json` and `storefront/components.json` aligned on style, icon library, and base color. Their CSS token values may differ slightly to preserve app-specific surfaces.
