# Public content pages

Published CMS pages resolve at `/pages/:slug`. The contact page also has the stable `/contact` storefront URL while reading the same published `contact` page record. Both entry points render the CMS title, body, metadata, and retryable loading/error/not-found states.

The contact route is linked from the footer. New arrivals, bestsellers, sale, and brand directory routes are linked from the responsive navigation; mobile discovery links live in the category sheet.

`/sitemap` is a human-readable directory linked from the footer. It groups stable discovery routes, active category-tree entries, published collections, brands with published products, and published CMS pages. Each remote group has its own loading, retryable error, and empty state; the Laravel `/sitemap.xml` remains the machine-readable sitemap.

`/style-guide` lists Admin-selected, published Lookbook collections as outfit inspiration. Cards use collection-owned titles, descriptions, images, and demo-image disclosures; opening a Lookbook exposes its real product variants and the existing add-selected-outfit action. The page never invents occasion copy or outfit/product data, and shows loading, retryable error, and no-published-lookbooks states. The route appears in both sitemaps and renders in the client SPA.

`/contact` remains available even when the optional CMS `contact` page has not been published. It shows configured support/store phone, email, hours, and address with direct-call/email/map links. When a support or store recipient email is configured, the page provides a form with customer name, Vietnamese phone, email, topic, optional order code, message, and an optional JPG/PNG/WebP image up to 2 MB. Signed-in customer details prefill the form. Submission is rate limited, delivered to the configured support email (falling back to the store email), and does not persist the message or attachment; the API returns a retryable error if delivery is unavailable.

The shared footer reads the public store configuration for email, phone, address, business hours, and social links. It only renders configured values and reflects whether COD is enabled; shipping copy explains that the fee is calculated from the delivery address and shown before ordering.

Published pages use their configured title and description, emit `WebPage` JSON-LD, and remain indexable. Missing or unavailable pages render the shared content error state and are marked `noindex,nofollow`. The contact alias uses `/contact` as its canonical URL so it does not duplicate `/pages/contact` in search results.
