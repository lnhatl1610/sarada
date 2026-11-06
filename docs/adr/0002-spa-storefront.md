# ADR 0002: Vite single-page applications for admin and storefront

- Status: Accepted
- Context: The project has separate staff and customer experiences and the repository already contains two Vite React apps.
- Decision: Keep `admin/` and `storefront/` as independent Vite SPAs talking to the Laravel API. Use route-based code splitting, metadata, sitemap generation, and responsive image optimization.
- Consequences: Simple deployment and clear security boundaries; product SEO is weaker than SSR. Evaluate prerendering/SSR only if measured organic-search needs justify it.
