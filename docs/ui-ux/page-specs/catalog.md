# Collection and Product Listing

`/collections` lists published collections from the shared Storefront collection query. It provides loading, retryable error, empty, and populated states; each card links to its public collection route and uses the API image alt/disclosure data.

`/brands` lists brands that currently have published products; `/brands/:slug` presents the brand banner, logo, short story, SEO metadata, and filtered product grid. Brand content is maintained with catalog options in Admin, and the filter panel remains collapsed by default on the brand page. The banner uses the configured image alt text, falls back to a generated description, and stacks above the brand identity on narrow screens. `/new-arrivals` and `/best-sellers` use the server's merchandising flags. `/sale` filters to products with active variant discounts inside their configured sale window. When the active campaign banner has `show_countdown` and a future `ends_at`, the Sale page shows that campaign's real end time and countdown; without configured campaign timing it omits the timer. These landing pages retain the regular catalog filters, sorting, pagination, and product-card states.

The brand directory groups the current published-product brands by Vietnamese alphabet initial and provides keyboard-operable letter links that jump to matching groups. Diacritics are normalized for the index (`Đ` shares `D`); names within each group use Vietnamese collation. A `#` group catches names that do not start with a Latin letter.

## Catalog controls

- Show breadcrumb, collection title/description, result count, sort control, and search. Sort options include relevance, newest, price ascending/descending, best-selling, highest approved rating, and largest active variant discount amount.
- Published category and collection listings show their API-provided cover image when available. Category listings also show direct chips for active child categories; unavailable cover media is omitted instead of replaced with invented campaign imagery.
- Filters include category, brand, price range with server-bounded dual sliders and integer-VND inputs, size, color swatches, material, fit/silhouette, availability (in stock / out of stock), minimum average rating, and minimum discount percentage. Color swatches use the additive `color_swatches` API property with `color_hex` and accessible color names while filtering by the exact color value; the existing `colors` string list remains compatible. Price bounds use effective prices across active variants and honor sale windows. Material and fit options come from published products; availability uses server inventory after reservations; rating uses approved reviews and excludes unrated products; discount thresholds only include currently active sale windows. Desktop filters sit in a collapsible panel so the product grid appears near the top of the page; mobile uses a bottom Sheet with Apply and Reset actions. Show applied filter chips with individual remove controls and Clear all.
- The expandable facet summary shows published-product counts for each category (including descendants), brand, size, color, material, and fit option. Counts come from public API data rather than the current page slice.
- Keep search, filters, sort, and page in query parameters so refresh, back/forward, and sharing preserve the view. Reset pagination when filter criteria change.
- Paginated catalog routes add `rel="prev"` and `rel="next"` links from the API's current/last-page metadata. Each link preserves the active query filters and sort; page one omits the `page` parameter, and links outside the available range are removed.
- Preserve the URL's active `new` and `best_seller` merchandising filters when the shopper changes regular filters or sort; show these flags as readable Vietnamese chips.
- The filter form can enable or clear `new`, `best_seller`, and active-window `sale` filters on general catalog routes. The dedicated new-arrival, best-seller, and sale routes show their preset as checked and keep it locked while shoppers edit other filters.
- Keep the header search input synchronized with the URL when browser back/forward navigation restores a previous `q` value.
- Header and catalog search share validation: trim the query, enforce the API's 120-character limit, and show an accessible inline error before navigation.
- Header search requests published CMS page suggestions from the API alongside products; only public page titles and safe text snippets are returned, and content suggestion failures can be retried independently.
- If a product query has no exact catalog match, the API can return published products with a close spelling match for query words of at least three characters; exact matches always take precedence.
- When the search box is empty, show recently submitted product terms with at least three matches during the last seven days. Tracking is limited to exact published-product matches, excludes email/URL/phone-like values, stores no account or IP, and expires after 30 days.
- When search results are empty, suggest other anonymous trending terms and currently returned best-selling products. Fetch these recommendations only for a resolved empty search state, and let shoppers retry the best-seller request independently.
- Validate URL-derived Storefront product query parameters before fetching; invalid direct/shared links display the parameter error and do not send a malformed product request.
- Show an applied-filter result count and retain selected values when the Sheet closes without applying.
- Reject a price range when the maximum is below the minimum, keep the filter form open, and identify the range error inline; the API enforces the same rule for direct/shared URLs.
- Validate all catalog filter values with the matching API constraints before navigation: nonnegative integer prices, maximum not below minimum, supported sort values, and bounded query/option lengths. Keep the mobile sheet open when a field is invalid.

## Product grid and states

- Provide 2/3/4-column density controls on the catalog grid. Keep the mobile grid at two columns for readable card content.
- Product cards offer a compact quick-add disclosure with an explicit color/size variant selector; unavailable variants are disabled, API errors remain visible, and successful additions use the shared mini-cart flow.
- Product cards also open a keyboard-accessible quick-view dialog with color/size selection, variant-specific price and stock, product imagery, a detail-page link, and add-to-cart that closes only after API success.
- Product cards show the exact discount percentage when the API supplies an active compare-at price, and show the approved-review average and count only when at least one approved review exists.
- Product cards label new arrivals only when the API product record is explicitly marked `is_new`; availability and sale badges continue to reflect current API stock and active pricing.
- Product cards label an item “Bán chạy” only when the API's server-owned `sold_count` is greater than zero; the Storefront does not estimate sales from clicks, views, or ratings.
- The Sale page may show an “Đã bán X%” progress bar only when Admin/API supplies a real campaign sales target and sold quantity; it must not derive a campaign percentage from historical product sales or current stock.
- When the API links a color variant to color-specific product imagery, cards show accessible color swatches; choosing a swatch updates the primary and hover image to that color.
- When a second product image is supplied, reveal it only on hover-capable fine pointers. Keep primary image content for touch/keyboard use, hide the hover-only image from assistive technology, and display any demo disclosure with the secondary image.

- Use 2 columns on mobile and 3–4 on desktop. Cards use a 3:4 product image, product name, price/compare price, variant or availability cue, and sale/new label where applicable.
- A second image may appear on pointer hover only; all primary information remains visible without hover. Wishlist is a labeled, keyboard-accessible toggle for signed-in and guest states.
- Loading uses layout-preserving skeletons. Empty catalog and no-match states explain next actions; API errors offer retry without discarding query state.

## Acceptance criteria

- [x] Shoppers can select 2, 3, or 4 catalog columns on wider screens; narrow screens retain two columns.
- [x] Quick add sends the selected available variant through the shared cart action and preserves the selection if the request fails.
- [x] Secondary product imagery appears only on hover-capable fine pointers and retains its visual demo disclosure.
- [x] Product cards display active sale percentage and approved-review summary from API data without inventing labels or empty ratings.
- [x] Color swatches select the matching API-linked product image and expose their selected state to assistive technology.

- [x] All displayed filters and sort options change the server query and URL state.
- [x] Published category/collection covers and active child-category chips use the API's public catalog metadata.
- [x] Paginated catalog metadata emits valid previous/next head links that preserve the current filter and sort query.
- [x] Mobile filters are operable with keyboard/screen reader and have clear Apply/Reset behavior.
- [x] Result count and filter chips match the active query.
- [x] Availability filters distinguish variants with positive available quantity from products without available stock and are preserved in shareable URLs.
- [x] Sort by approved rating and active discount amount is validated, shareable, and ordered by the API.
- [x] Minimum rating filters use the API's approved-review average and exclude unrated products.
- [x] Material options are derived from published-product values and filter the server list; URL state and chips reflect the selected value.
- [x] Price slider bounds come from active-variant effective prices; both range handles synchronize with integer-VND inputs and URL filters.
- [x] Discount percentage thresholds use active variant discounts within the product sale window and are preserved in the URL/chips.
- [x] Product cards remain touch-friendly, image-led, and usable without hover.
- [x] Product quick view keeps variant selection and remains open with an error when the cart API rejects the add; success closes the dialog and uses the shared mini-cart flow.
- [x] Header suggestions include published CMS pages as well as products, categories, and collections, with keyboard selection and an independent content-query retry state.
- [x] Product search falls back to bounded edit-distance matching only when the catalog has no exact text match.
- [x] Empty search results provide trending query alternatives and server-ranked best sellers without replacing the original search state.
- [x] Search suggestions show server-aggregated popular terms, preserve recent browser-only terms, and disclose anonymous 30-day trend aggregation.
- [x] Collection, brand, new-arrival, bestseller, and active-sale landing routes have distinct headings; brand and merchandising routes retain canonical URLs and metadata.

## Implementation notes

- Collection routes resolve through `GET /collections/{slug}?include_products=0`, independently of the paginated home collection list, so any published collection can open directly without loading its full product graph. Product cards use the separately filtered and paginated `GET /products?collection={slug}` endpoint. While collection metadata loads, keep a layout-preserving loading state; offer retry for API failures and show not-found for an unpublished slug.
- Unresolved, unavailable, and unpublished collection routes carry `noindex,nofollow` metadata; only a resolved published collection is indexable.
- Unknown routes, missing products, and unpublished or missing CMS pages carry `noindex,nofollow` metadata so SPA-rendered 404 states are not advertised as public content.
- Catalog and collection routes expose a semantic breadcrumb; collection pages show the published collection description when available.
- Every resolved catalog, category, and collection route exposes one visible `h1` whose text matches the current page title; the catalog controls and dialog headings follow below it.
- Public category links use `/categories/:slug`; their title, description, and cover image come from the active category API record and release HTML snapshot. Legacy `/products?category=...` URLs remain supported, retain only the category filter in their canonical URL, and drop transient search/sort/page parameters.
- Filtering by a parent category includes products assigned to any active descendant category, so top-level category cards do not lead to an empty list when products are assigned to child categories.
- The reserved `hang-moi` category slug filters by the API's `is_new` merchandising flag, so the seeded Hàng mới category works without moving products out of their garment-type categories.
- The public category tree includes every level whose full ancestor chain is active; the category sitemap and category filter use the same visible tree.
- Resolved category and collection pages emit `CollectionPage` JSON-LD with the published title, description, canonical page URL, cover image, and the currently rendered API product items. Product entries use their public detail URLs and available catalog image.
- Account, cart, checkout, order-tracking, authentication, and unresolved/not-found routes are marked `noindex,nofollow`; resolved published catalog and content routes remain indexable.
- The public catalog response includes server pagination metadata; the storefront displays its total and keeps the current page in the URL.
- Filter chips remove one query parameter at a time or clear all filters. Filter changes return to page 1.
- Mobile filter fields live in a native modal bottom sheet and preserve their draft values until Apply or Reset.
- Brand, size, and color choices come from the public `/catalog/filter-options` facet endpoint over all published products and active variants, rather than the current catalog page. Search defaults to API relevance ordering; every visible sort value is supported by the product-list endpoint.
- Brand directory cards use those same published-product facets, avoiding an additional API endpoint or exposing brands with no current storefront products. Unknown brand slugs show a not-found state and are noindexed.
- New-arrival and bestseller routes use `/products?new=1` and `/products?best_seller=1`; the sale route uses `/products?sale=1`, whose filter only matches active variants discounted at the current server time.
- Catalog product artwork is rendered as a semantic image with API alt text (and a named fallback), uses the planned 3:4 ratio, and does not rely on hover to reveal product information. The wishlist control has a 44 × 44 px touch target. The first visible row loads eagerly while later products are lazy-loaded.
- Product cards use store-supplied product photos or explicitly disclosed photorealistic AI flat-lay photos for demo/UAT. AI demo photos show garments without wearers or illustrations, carry an `Ảnh AI demo` badge and explanatory alt text, and are not claims about actual stock or item appearance. Store-confirmed photos are required before production merchandising. Missing images show a plain neutral surface without graphic artwork.
- If a product image is unavailable or fails to load, Storefront shows a plain neutral surface without substitute artwork; real product media uses its accessible alt text.
- Cards show a sale badge and compare-at price only when the API compare price exceeds the current product price; availability appears only when variant stock data is present and is computed from the server-provided quantities.
- Product-card price is the lowest effective price among active variants. Its compare-at price must come from a sale variant with that same effective price, so a more expensive variant cannot make a non-sale lowest price appear discounted.
- Product details expose both add-to-cart and “Mua ngay”. Buy-now waits for the cart API to accept the selected variant and quantity before routing to checkout, and shares the same in-progress/stock guards as add-to-cart.
- PDP color and size choices are buttons; sizes with no available stock remain visible, struck through, and announced as sold out, but cannot be selected. Color-dependent sizes stay disabled until the shopper chooses a color.
- Product detail links its current brand and selected/default variant SKU. Rating summary opens the reviews tab; sharing offers clipboard copy, Facebook, the device's native share sheet, and the official Zalo Share Plugin when a store OA ID is configured. The Zalo SDK loads only after the shopper opens that option.
