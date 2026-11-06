# Storefront blog

## Routes
- `/blog` shows published articles, category filters, and bounded pagination.
- `/blog/:slug` shows the published article, its category and date, sanitized rich text, products linked by staff, and up to three recent articles from the same category.

## Content and states
- Drafts and articles scheduled for a future timestamp are never returned by public APIs or included in search and sitemap results.
- The index and article routes show loading, recoverable error, empty, and not-found states. Category and pagination controls are keyboard accessible and use URL state.
- Article cover images use the staff-provided alt text. Inline article HTML is sanitized by the server and sanitized again before rendering.
- Product links point to current published product details. No price or availability is copied into article content.

## SEO
- Article metadata uses the article SEO title/description with title/excerpt fallbacks, a canonical URL, Open Graph image, and `BlogPosting` JSON-LD.
- The sitemap adds `/blog` only when published articles exist and includes currently visible article details.

## Admin
- `/blog` in Admin uses the `content.manage` permission. Staff edit title, slug, category, excerpt, cover/alt text, rich content, SEO metadata, publication state/time, and up to 12 related products.
- Categories are normalized from the entered name and offered inline; deleting the final article in a category removes it from public category filters.
