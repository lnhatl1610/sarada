# Public content pages

Published CMS pages resolve at `/pages/:slug`. The `about` and `careers` pages also have stable `/about` and `/careers` storefront URLs while reading the same published CMS records; contact reads the published `contact` record at `/contact`. Each entry point renders the CMS title, body, metadata, and retryable loading/error/not-found states. These aliases are indexable only when their CMS content has been published. The careers page also lists active job openings with department/location filters and accessible detail disclosures, even when the optional CMS introduction is unavailable. The application/CV form is not implemented until the store defines submission, reviewer access, and retention workflow.

The about and careers routes appear in the footer when their CMS content is published; contact remains linked and shows the configured store details even when its optional CMS page is unpublished. New arrivals, bestsellers, sale, and brand directory routes are linked from the responsive navigation; mobile discovery links live in the category sheet.

`/sitemap` is a human-readable directory linked from the footer. It groups stable discovery routes, active category-tree entries, published collections, brands with published products, and published CMS pages. Each remote group has its own loading, retryable error, and empty state; the Laravel `/sitemap.xml` remains the machine-readable sitemap.

`/style-guide` lists Admin-selected, published Lookbook collections as outfit inspiration. Cards use collection-owned titles, descriptions, images, and demo-image disclosures; opening a Lookbook exposes its real product variants and the existing add-selected-outfit action. The page never invents occasion copy or outfit/product data, and shows loading, retryable error, and no-published-lookbooks states. The route appears in both sitemaps and renders in the client SPA.

`/contact` remains available even when the optional CMS `contact` page has not been published. It shows configured support/store phone, email, hours, and address with direct-call/email/map links. When a support or store recipient email is configured, the page provides a form with customer name, Vietnamese phone, email, topic, optional order code, message, and an optional JPG/PNG/WebP image up to 2 MB. Signed-in customer details prefill the form. Submission is rate limited, delivered to the configured support email (falling back to the store email), and does not persist the message or attachment; the API returns a retryable error if delivery is unavailable.

The contact topic list includes product advice, orders, returns/warranty, cooperation, and other. The Contact details show a Zalo messaging link only when the store configures a Zalo URL.

The Contact page embeds the existing OpenStreetMap/Leaflet view when active store locations are available. Location loading has a retry state, the empty state does not invent coordinates, and the `/stores` directory remains available for directions.

The contact page also links directly to FAQ and order tracking so customers can self-serve before sending a message.

The shared footer reads the public store configuration for email, phone, address, business hours, and social links. It only renders configured values and reflects whether COD is enabled; shipping copy explains that the fee is calculated from the delivery address and shown before ordering.

Published pages use their configured title and description, emit `WebPage` JSON-LD, and remain indexable. Missing or unavailable pages render the shared content error state and are marked `noindex,nofollow`. The `/about`, `/careers`, `/contact`, and `/size-guide` aliases use their stable routes as canonical URLs so they do not duplicate their `/pages/:slug` entries in search results.
