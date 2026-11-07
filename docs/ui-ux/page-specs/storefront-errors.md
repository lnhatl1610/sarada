# Storefront error and maintenance pages

## Recovery behavior

- Unknown routes show a concise Vietnamese explanation, a product search form, suggested search terms, four quick links to real discovery routes, four API-backed best sellers when available, and a link to the home page. Product suggestions have loading, retry, and empty behavior and use the shared responsive image fallback.
- The 404 artwork uses the local fashion-themed SVG; its subtle garment movement stops under `prefers-reduced-motion`.
- Server or rendering errors offer retry, support-contact, and home actions without a product-search form. Permission errors do not suggest retrying an unchanged request.
- Maintenance mode shows the configured message and expected return time when available, plus the same search and home recovery affordances. It reuses the existing newsletter form with explicit consent and its inline loading, validation, success, and server-error feedback; subscriptions take effect immediately per FR-MKT-001.
- Search submits a normal `GET /search?q=...` navigation so the query remains shareable and works with browser history.
- Keep controls keyboard accessible, visibly focused, and touch sized on narrow screens.
