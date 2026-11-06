# Implementation Plan: Admin settings and preferences

## Context
The admin uses `?page=...` routing in `admin/src/App.tsx`. Store-wide settings persistence exists only as a generic key/value table and has no admin API. This feature first adds browser-local display preferences that do not affect commerce data.

## Steps
1. Add an authenticated preferences page to the admin navigation.
2. Persist theme, accent, table density, and motion options in local storage and apply them through scoped CSS tokens.
3. Document store settings, system monitoring, and import/export as follow-up API-backed features.

## Risks and recovery
Validate local preference values when reading browser storage. Reset to safe defaults if storage is malformed. Keep preference selectors scoped to the admin shell.

## Acceptance evidence
Review immediate theme/accent/density/motion changes and reload persistence in the admin. Run frontend checks only when requested.
