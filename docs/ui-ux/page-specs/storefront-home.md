# Storefront Home

## Offline and install

- Storefront exposes a Vietnamese install manifest and registers its existing push-capable service worker on page load.
- The service worker caches the app shell, recent public page navigations, static assets, and a bounded set of same-origin public API responses. The HTTP client also stores cacheable public catalog/content GET responses under same-origin cache keys, so offline reads can work when the configured API uses a separate origin.
- Account, cart, checkout, tracking, and authenticated API data are excluded from offline caching. If a page was not cached, an accessible offline recovery page is shown.
- When the browser reports no network connection, the shared shell announces that cached content may be stale; cart and checkout mutations still require a live API connection.

## Header and navigation

- Header contains brand link, product search, API-backed leaf-category and collection links, account entry, wishlist link with the current saved-item count, and cart count. On mobile, a native modal sheet and fixed navigation provide category, collection, account, wishlist, and cart access with Escape and backdrop dismissal where applicable.
- The account popover offers sign-in/registration to guests, and orders, wishlist, profile, and sign-out to signed-in customers. It follows the customer state supplied by the in-memory auth session and supports Escape with focus returned to its summary control.
- Desktop navigation includes a keyboard-operable category menu grouped by the live category tree, links every published collection and brand directory, and uses up to two published category images as visual shortcuts. Escape closes the menu and returns focus to its trigger; the tablet/mobile sheet remains available at narrower widths.
- The mini-cart shows server-priced subtotal and free-shipping progress only when the current cart total and a configured global or selected-province threshold are available. Province-specific thresholds take precedence; the final fee remains confirmed in the full-cart quote.
- When the cart has items, the mini-cart can show up to two API-related products that are not already in the cart. Each suggestion requires an explicit in-stock color/size selection before adding; related-product loading and failure provide status and retry states.
- On mobile, a fixed five-item navigation bar exposes home, categories, search, wishlist, and account. The product purchase bar sits above it and both respect the device safe area.
- The one-line announcement strip rotates between nationwide delivery, address-calculated shipping fees, and COD only when enabled. It has previous/next, pause/resume, and dismiss controls; dismissal persists in browser storage and rotation starts paused when reduced motion is preferred. It does not invent free-shipping thresholds, return windows, or offers. The shared header sticks at the top, hides while scrolling down, and returns while scrolling up.
- The home service strip and dismissible header announcement show nationwide delivery, and display cash-on-delivery messaging only when the public Storefront configuration has COD enabled; they hide that claim while configuration is unavailable or COD is disabled. Release-time home snapshots use the same COD setting.
- The announcement strip stays on one centered line at narrow widths and uses only confirmed shipping/COD information; it must not hard-code free-shipping thresholds that vary by province or return windows that are not configured.
- The header's search icon opens a full-screen native dialog, focuses its search field, and restores focus to the trigger when closed. Search submits to `/search?q=` and displays the query/results state there. The dialog offers up to four API-backed product suggestions with 64px thumbnails, matching category/collection links, published content suggestions, and recent searches saved only in browser storage.
- Header search suggestions support visible focus/hover state, ArrowUp/ArrowDown selection, Enter activation, Escape dismissal, field validation, and an explicit full-results action. Network failure leaves the submitted search usable.
- Newsletter success is announced as a polite status; submission failures are announced as alerts, and field-level validation errors remain associated with their inputs.
- When Admin configures an active welcome coupon, the Storefront may show one accessible newsletter dialog per session after 15 seconds or desktop exit intent. Escape, backdrop, and close button dismiss it; reduced-motion preferences disable its entrance animation. The dialog is not shown when there is no active welcome offer.
- Keyboard users can move past the shared announcement/header using the first-focusable “Bỏ qua điều hướng” link; activating it focuses the current route content.
- A labeled “Lên đầu trang” control appears after the shopper scrolls down 480 px, clears the fixed mobile navigation and safe area, and uses instant scrolling when reduced motion is preferred.

## Home content

- Admin can enable/disable and reorder implemented homepage sections: hero, categories, new arrivals, campaign, best sellers, recently viewed products, personalized recommendations, collections, service information, lookbook, newsletter, membership, and Instagram. The public configuration API validates the complete allowlisted set; the live Storefront and release-time SEO snapshot apply the same order and visibility. Recently viewed products depend on browser history, and personalized recommendations use authenticated customer views and paid delivered/completed purchases, so SEO snapshots reserve their configured positions without embedding personal browsing data. The recommendation rail shows retryable loading/error states and stays hidden when there are no matching in-stock products. If the hero is disabled, the page keeps an accessible hidden level-one heading. Membership details load from the public program API with loading and retryable error states.
- The Instagram home rail uses up to six manually curated public post/reel URLs, image URLs, and required alt text from Admin Store Settings. It stays hidden when no posts are configured, opens posts in a new tab with `rel="noreferrer"`, and is included in the release SEO snapshot. The app does not scrape Instagram or claim automatic feed synchronization.
- Newsletter signup requires explicit marketing consent. If Admin configures a currently active coupon in Store Settings, a new subscriber receives the welcome code by email; duplicate submissions do not generate repeat welcome messages.
- The best-seller rail defaults to Tất cả so shoppers see available products immediately, then offers keyboard-operable Nam, Nữ, and Phụ kiện filters. Nam/Nữ use the product's validated `target_gender`; Phụ kiện uses the published category slug when that category exists. Each tab fetches a separate server-filtered result set and keeps the same filters in its "Xem tất cả" link; an empty tab states that it has no matching best sellers.
- The featured-category rail shows up to six image tiles. Nam/Nữ tiles appear only when a published product for that configured audience supplies a real image; Phụ kiện links to the active accessories category when present. Remaining tiles use published category images, and the rail never fabricates audience imagery.
- The service strip states nationwide delivery and address-based delivery fees, adds COD only when enabled, links to an available published return-policy page, and offers support only through configured store contacts or a published contact page. The live Storefront and SEO snapshot use the same available facts.
- New-arrival and best-seller rails expose up to eight API products in a horizontally scrollable, snap-aligned row with previous/next controls, touch/trackpad scrolling, a keyboard-focusable track, and a full-results link. Reduced-motion preferences disable smooth scrolling. Release snapshots use the same horizontal track layout.
- The Instagram rail shows up to six square, lazy-loaded image links and collapses from six columns to three and then two on narrower screens.

- Editorial hero takes its headline, image, descriptive alt text, and destination from the published hero banner; the mobile placement supplies its own image and alt text when available.
- Banner data is requested only while the home route is active; navigating to the home route enables the query and uses TanStack Query's shared cache.
- Sitewide brand names used in page-title fallbacks and Organization/WebSite structured data come from `store_name` in the public Storefront configuration; SEO title and description remain separate settings.
- Home hero, collection, campaign, lookbook, newsletter, and mobile-navigation brand labels use the configured `store_name`, matching the shared header/footer branding.
- Header and footer show the configured `store_logo` when available, with an accessible `store_name` text fallback if it is empty or fails to load.
- The shared storefront shell renders breadcrumbs on non-catalog inner routes and adds matching Schema.org `BreadcrumbList` structured data on inner routes; catalog and collection-index pages retain their page-specific breadcrumb UI.
- Hero and campaign banners may include optional, API-managed editorial copy. Store staff edit it in the Admin campaign form; Storefront does not invent banner descriptions when that field is empty.
- A campaign banner can opt into a live countdown in Admin. The API requires a campaign placement and configured `ends_at`; the Storefront counts down to that timestamp and the SEO snapshot renders the configured end date before JavaScript runs.
- Once the API returns the hero content, preload the desktop and mobile hero sources with viewport-specific media queries and high fetch priority; the hero image remains eager, while campaign video stays lazy until playback.
- Release-time home snapshots also include matching desktop/mobile image preload hints, a responsive `<picture>` hero, and eager high-priority hero loading before JavaScript runs.
- The seeded campaign uses photo-based desktop and mobile crops. In local demo/UAT, catalog products may use photorealistic AI flat-lay photos without people, with a visible `Ảnh AI demo` badge and explicit alt text. These images are not claims about real store stock; operator-uploaded store photos take precedence, and products without an image show a plain neutral surface.
- A category-cover rail reads the active category tree and image-specific alt text from `/categories`, links to the selected catalog filter, and has a skeleton and retryable error state; it stays hidden when the API returns no categories.
- Featured collections, newest products, best sellers, and campaign video/image are data-driven sections. Product rails have skeleton and retryable error states, and hide when the API has no published products. Product imagery may use store-provided photos or explicitly disclosed AI demo flat-lays; missing images use a plain neutral surface.
- The “Sản phẩm mới” rail filters by the API's `new` merchandising flag; the bestseller rail filters by `best_seller` and sorts by sold count.
- Each product rail's “Xem tất cả” link preserves that rail's API filter and sort in the catalog URL.
- Campaign video sources must be absolute HTTP(S) URLs. If a legacy video value is unsupported, Storefront displays the banner image poster instead.
- If a supported campaign video fails during loading or playback, replace the video player with the campaign image and its descriptive alt text.
- Lookbook highlights only the published collection explicitly selected in Admin, using its banner, description, and destination; it stays hidden when no featured collection is configured. On the home page, staff-positioned hotspots open a glass product card with image, current API price, product detail link, and in-stock add-to-cart action; a linked product list remains available alongside the image. Loading and retryable errors are shown while the featured collection's product details load. Selecting a new featured collection replaces the previous selection, and the release SEO snapshot follows the same featured collection rule. Its `/lookbook/:slug` page uses a responsive two-column editorial outfit section with a desktop sticky image, numbered staff-positioned hotspots, the ordered product list, current prices, in-stock variant selectors, and an add-selected-outfit action. Each product is added through the existing cart API; partial failures are reported. The SEO snapshot follows the same two-column order and provides product links before hydration. The sitemap and release snapshot include this route.
- Seeded category and collection covers use photo-based demo media and API-provided Vietnamese alt text; custom artwork uploaded by store staff takes precedence during reseeding.
- AI demo product photos show a visible “Ảnh AI demo” badge and descriptive alt text.
- The “Ảnh AI demo” badge inside product image links stays a compact readable pill and does not stretch over or obscure the garment photo.
- The home-page collection cards pass each cover's API-provided alt text to the image; they use a collection-name fallback when legacy data has no description.
- Optional collection and campaign sections stay hidden when the API has no published content.
- Newsletter uses the owner-approved single-step opt-in: after valid email and explicit consent are accepted by the API, the address is subscribed immediately without an email-confirmation step. The form validates email, shows pending/success/error feedback, and submits to the configured API. Never show success for a local-only no-op.
- Newsletter validation errors identify the email or consent field that needs attention; rate-limit and connection errors remain visible as form-level feedback.
- Guest order tracking displays the server-provided public status timeline in chronological order, including shopper-visible status notes, local timestamps, carrier and tracking codes when available. A no-match response uses one neutral message so the UI does not reveal whether the order code or contact detail was incorrect.
- Build-time SEO snapshots were removed with the Storefront scripts; the homepage sections render in the client SPA.

## Footer and responsive behavior

- Footer loads the bounded list of published CMS page titles and slugs from one public API request, then links to every published page; page content and drafts are not included in this navigation response. Order tracking links to its working route.
- Footer groups links into customer support and store information, includes the existing explicit-consent newsletter form with independent field IDs, and shows only configured contact/social/payment details. Shipping is described without promising a universal threshold; the bottom strip identifies Vietnamese and VND.
- The collection index is directly discoverable from desktop navigation, the mobile navigation sheet, and the shared footer, even when there are no published collections to list.
- The shared footer links to the `/stores` directory, which lists active staff-managed locations and their province, address, contact details, opening hours, map, and directions.
- The hero displays up to four active desktop campaign slides with manually operated previous/next and slide controls; it never auto-advances. A matching mobile banner uses the same sort order, and banner video uses native controls with a poster and accessible description.
- The approved editorial home direction uses serif display headings, a compact two-column hero on desktop, and places the campaign image above its copy on narrow mobile screens.
- At tablet and narrow-laptop widths (1160px and below), the crowded desktop link row is replaced with the existing keyboard-operable navigation dialog; search, appearance, account, and cart controls remain in the header.
- At tablet widths (621–960px), the editorial hero uses bounded flexible columns and a fluid headline size so the copy cannot overlap or clip into the campaign image.
- Storefront text inherits the selected appearance palette, and the hero, story, and collection surfaces use palette-backed colors so dark mode keeps readable text contrast.
- The browser theme-color follows the selected palette background; the first-load value matches the default light palette before the appearance settings hydrate.
- At widths below 380px, compact the home header controls and search field to preserve room for navigation without forcing page-level horizontal overflow.
- At widths up to 460px, place the search and utility controls on a second header row; the search control takes the available row width while brand and category navigation remain on the first row. At 380px and below, use the tighter horizontal padding and compact brand/menu treatment.
- Mobile stacks sections, uses comfortable tap targets, avoids horizontal overflow, and respects reduced-motion settings.
- The mobile navigation sheet scrolls within the viewport when category and collection links exceed the available height, and keeps its content clear of device safe areas.
- The document must not force a viewport wider than 320 CSS pixels; test the header, hero, rails, footer, and auth shell at that minimum width.

## Acceptance criteria

- [x] Search, collection links, account/cart actions, newsletter, and footer links perform their stated action.
- [x] Admin-curated Instagram posts render as up to six image links in configured homepage-section order and are present in the release SEO snapshot; the rail stays hidden until at least one valid post is configured.
- [x] Unpublished or unavailable content is not presented as working navigation.
- [x] Data sections provide loading, empty, and error states without layout jumps.
- Network errors, forbidden pages, and missing pages use distinct connection, access-denied, and not-found illustrations.
- Missing category/product/content pages use the not-found illustration; API connection errors use the connection illustration.
- [x] The first focusable storefront control is a skip link that moves keyboard focus to the named current-page content region.
- [x] In a running browser, the skip link is the first Tab stop and Enter moves focus to `#primary-content`.
- [x] Mobile category navigation uses a native modal dialog with a labeled close button, Escape handling, backdrop dismissal, and focus kept inside the menu at both Tab boundaries.
- [x] Desktop keyboard traversal exposes the brand, primary/category/collection links, search field and submit button, appearance picker, account, cart, and hero action with visible focus.
- [x] Opening the appearance picker from the keyboard focuses its close control; Escape and Hoàn tất close it and restore focus to the header trigger.
- [x] Confirm the rendered home page remains usable without horizontal overflow at 320 CSS pixels.
- [x] In a running browser, Tab traversal continues through the native campaign-video controls to the campaign/lookbook links, newsletter controls, and footer links.
