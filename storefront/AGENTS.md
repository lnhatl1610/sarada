# Storefront Agent Guide

React + Vite + TypeScript customer storefront. Mobile-first, Vietnamese, VND.

- Follow root `AGENTS.md`; read `docs/architecture/frontend-architecture.md`, `docs/ui-ux/`, the relevant business flow, and feature spec.
- Keep code feature-oriented under `src/features/`; use remote-state queries for catalog/cart/order data.
- Calculate display estimates for UX only; the API recalculates all authoritative price/discount/shipping totals.
- Access tokens stay in memory. A guest cart token is not an auth token.
- Provide loading, empty, error, and success states; use keyboard-accessible controls and responsive layouts.
- Style new UI with Tailwind utilities and shadcn/ui primitives from `src/components/ui/` (`cn()` for class merging); do not add new feature `.css` files. Use only the libraries listed in `docs/architecture/frontend-architecture.md`; self-host fonts with `@fontsource-variable/*`.
- Follow `docs/ui-ux/component-guidelines.md` for shadcn/ui and shared component usage.
- Product imagery should be prominent and maintain a 3:4 card ratio where possible.
