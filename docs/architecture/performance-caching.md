# Performance and Caching

- Paginate product/order lists server-side with bounded page size; whitelist searchable/sortable fields.
- Index slugs, foreign keys, product visibility/category, order status/date/user, and inventory movement lookups.
- Eager-load relationships serialized by resources; inspect high-cardinality queries before caching.
- Cache public categories, banners, settings, and home collections with explicit invalidation on staff updates. Do not cache personal data or authorization results across users.
- Optimize catalog images to responsive WebP/AVIF sizes and lazy-load below-the-fold media.
- Use Redis for shared production cache and queue; local file/array cache is not a production design.
- Measure API p95 and LCP against NFR targets before claiming compliance.
