# Implementation Plan: Admin shell and design system

## Context
The admin is currently a single React component with query-string page selection and CSS-based screens. `admin/src/App.tsx` owns the shell and current API calls; `admin/src/index.css` owns global shadcn theme variables.

## Steps
1. Record shell and theme choices in ADR-0006 and UI documentation.
2. Add scoped admin light/dark tokens, theme persistence, sidebar collapse, and responsive drawer.
3. Filter navigation and supported route content from permissions loaded through `/admin/auth/me`.
4. Add 403/404 states and accessibility affordances; remove dead placeholder navigation.
5. Track remaining P0 shared primitives and error/session states in tasks and progress docs.

## Risks and recovery
Permission data loads asynchronously; keep the shell usable while `/admin/auth/me` resolves and never treat hidden controls as authorization. If theme rendering causes regressions, remove `AdminShell.css` import while retaining the original app styles.

## Acceptance evidence
Review desktop, tablet, and mobile behavior in the app, including light/dark mode, collapsed navigation, keyboard focus, and permission-filtered navigation. Run frontend checks only when requested.
