# ADR-0010: Use TanStack Table for admin data tables

- Status: Accepted
- Date: 2026-10-23
- Decision owners: Product owner

## Context

The admin plan requires `@tanstack/react-table`. The shared table currently owns table markup, sorting controls, row selection, column visibility, and pagination with hand-written logic. Admin list data is already paginated and sorted by the API, and filter/sort/page state is reflected in the URL.

## Options considered

- Keep the current hand-built table: no new dependency, but each table behavior remains custom and is harder to extend consistently.
- Use TanStack Table: adds a headless table dependency and adapter work, while providing typed column/row models and standard controlled table state.
- Use a full component table library: reduces local markup but introduces visual opinions and styling that conflict with the app's shadcn-based components and theme tokens.

## Decision

Use `@tanstack/react-table` inside the existing shared `DataTable` component. Keep the component's current public props so feature pages migrate without API changes. Configure manual sorting and pagination; API responses remain authoritative. Keep filter and page state in the URL and keep row selection and column visibility controlled by the shared component.

## Consequences and risks

- List pages gain one shared, typed row/column model and keep their existing Vietnamese UI and theme.
- The headless library adds a small bundle and type surface; use only the required row models and tree-shake unused exports.
- If the adapter causes regressions, reverting the shared implementation restores the previous renderer without changing feature APIs or backend contracts.
