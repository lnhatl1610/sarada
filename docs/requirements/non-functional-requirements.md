# Non-functional Requirements

- **NFR-PERF-001** Product listing API p95 should be below 300 ms at the agreed production load. Should; benchmark before release.
- **NFR-PERF-002** Storefront LCP should be below 2.5 s on the agreed mobile 4G profile. Should; measure in production-like environment.
- **NFR-SEC-001** Access tokens must not be stored in browser localStorage. Must; inspect frontend storage and flows.
- **NFR-SEC-002** Server must recalculate monetary values and authorize every protected operation. Must; verify negative/forbidden cases.
- **NFR-SEC-003** Refresh tokens must be stored hashed, rotated, and revoked on logout/reuse. Must.
- **NFR-SEC-004** Public auth, checkout, and upload endpoints must be rate-limited and validate input/MIME/size. Must.
- **NFR-A11Y-001** Main customer and staff flows should meet WCAG 2.1 AA, including keyboard operation, labels, focus visibility, and 4.5:1 text contrast. Should.
- **NFR-SEO-001** Product and collection pages should expose title, description, canonical URL, and sitemap entries; SPA indexing limits must be documented. Should.
- **NFR-OBS-001** API logs should carry request IDs and errors should be observable without logging secrets or tokens. Should.
- **NFR-MAINT-001** Code changes must preserve type/lint/build quality and keep API contract, docs, and generated client types aligned. Must.
- **NFR-AVAIL-001** Production database backups must be restorable and queue failures observable. Must before production.
