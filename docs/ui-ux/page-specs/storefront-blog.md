# Storefront blog

## Routes
- `/blog` shows the newest published article as a featured story on the unfiltered first page, then published articles with category and tag filters, URL-backed search across titles, excerpts, body content, category names, and tags, plus bounded pagination. Search, category, and tag filters can be combined; changing the search resets pagination.
- The index sidebar reuses the consent-aware newsletter form and lists up to three published articles ranked by aggregate detail views. A detail API request adds one view; the system stores no reader identifiers, so the count represents requests rather than unique people. Articles with no views are omitted.
- `/blog` cards show each article's tag links, optional author name, and estimated reading time beside the publication date. `/blog/:slug` shows the optional author name and short bio, tags, category, date, an optional table of contents from sanitized H2/H3 headings, share actions (copy link, native share, Facebook), staff-linked products, chronological links to the nearest newer and older published articles, and up to three recent articles from the same category.

## Content and states
- Drafts and articles scheduled for a future timestamp are never returned by public APIs or included in search and sitemap results.
- The index and article routes show loading, recoverable error, empty, and not-found states. Search, category, tag, and pagination controls are keyboard accessible and use URL state; search terms are bounded to 120 characters by the API.
- Article cover images use the staff-provided alt text. Inline article HTML is sanitized by the server and sanitized again before rendering.
- The API reading-time estimate counts whitespace-delimited words from sanitized text at 200 words per minute, with a one-minute minimum, so index and detail stay consistent. The table of contents is omitted when the article has no H2/H3 headings; duplicate or punctuation-only headings receive unique stable anchor IDs.
- Sharing uses the browser's native share sheet when available, falls back to copy-link feedback when native sharing is unavailable, and provides a Facebook share action through the approved `react-share` package. Cancellation of the native share sheet does not show an error.
- Product cards point to current published product details and show server-calculated current starting prices. When active variants are available, shoppers can open the existing quick-view dialog, choose a variant, and add it to the cart without leaving the article. Prices and stock are fetched from product records; article HTML never stores price or availability.

## SEO
- Article metadata uses the article SEO title/description with title/excerpt fallbacks, a canonical URL, Open Graph image, and `BlogPosting` JSON-LD. A supplied author is emitted as a `Person`; when no author has been entered, the store organization remains the structured-data author.
- The sitemap adds `/blog` only when published articles exist and includes currently visible article details.

## Admin
- `/blog` in Admin uses the `content.manage` permission. Staff edit title, slug, category, excerpt, optional author name/bio, cover/alt text, rich content, SEO metadata, publication state/time, and up to 12 related products. A bio requires an author name; older articles without author details remain unattributed.
- Staff may assign up to 8 reusable tags per post; names are trimmed, deduplicated, slugged, and validated to 50 characters.
- Categories are normalized from the entered name and offered inline; deleting the final article in a category removes it from public category filters.
