# Storefront error and maintenance pages

## Recovery behavior

- Unknown routes and router errors show a concise Vietnamese explanation, a product search form, suggested search terms, four quick links to real discovery routes, and a link to the home page.
- The 404 artwork uses the local fashion-themed SVG; its subtle garment movement stops under `prefers-reduced-motion`.
- Server or rendering errors also offer a retry action. Permission errors do not suggest retrying an unchanged request.
- Maintenance mode shows the configured message and expected return time when available, plus the same search and home recovery affordances.
- Search submits a normal `GET /search?q=...` navigation so the query remains shareable and works with browser history.
- Keep controls keyboard accessible, visibly focused, and touch sized on narrow screens.
