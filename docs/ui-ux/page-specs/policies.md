# Storefront policies

## `/policies/:slug`
- Supported policy slugs are `returns`, `shipping`, `payment`, `privacy`, `terms`, and `cookies`; each route reads the matching published CMS page. `/pages/:slug` remains available for other CMS content.
- Render the CMS title, published content, and the page's update date (fall back to its creation date with an accurate label).
- Build the table of contents only from sanitized CMS `h2` and `h3` headings, assign stable unique in-page IDs, and make each link navigate to its section. Do not invent section headings when policy content has not been authored.
- Link only to other published CMS pages in the supported policy group. The footer and HTML sitemap use the policy route aliases for these slugs.
- Keep content readable at every viewport, preserve the storefront's active palette, and show existing retry/not-found states when the CMS page cannot be loaded.
- Policy text is merchant-owned. Demo or placeholder copy must be replaced and approved before production use; UI implementation does not create or imply a legal policy.
