# Project progress

- Replaced the active Home route in development and production with a responsive Blzr editorial composition matching the supplied fashion reference: sage canvas, split white/charcoal stage, oversized headline, extracted model imagery, collection gallery, and dismissible collection teaser. Navigation uses existing catalog/search/account/cart/content routes; no fabricated price, rating, stock, or cart state is introduced. Other pages retain their existing shell. Automated tests were not run (not requested).
- Kept the editorial hero intact and added the requested fashion-store content below it: announcement bar, category tiles, new-arrivals cards, tailoring promo, service commitments, newsletter signup, and footer links. The new sections are responsive and verified in the storefront preview.

- API cleanup requested by owner: removed PHPUnit/test caches, temporary visual QA scripts, the stray `toArray())` file, `vendor-passkey`, `.claude`, `.cursor`, `.codex`, `.mcp.json`, and `boost.json`. `api/CLAUDE.md` remains because Windows denied deletion through both filesystem and patch tools; its ACL grants ordinary users read/write but not delete. Updated the directory snapshot to remove deleted tool folders. No application code changed.

- Consolidated useful content from `api/docs/api-architecture.md` into `docs/architecture/backend-architecture.md`, including Laravel/module structure and layer responsibilities. Removed the outdated duplicate and its empty docs directory; updated API agent guidance and the directory snapshot. No application code changed.

- Corrected README placement per the owner's clarification: the architecture index now lives in the existing root `README.md`; removed `docs/architecture/README.md` and updated agent guidance and the directory snapshot.

- Removed root `ARCHITECTURE.md` and created `docs/architecture/README.md` as the architecture index. Consolidated its relevant system details and inventory flow into `system-overview.md`, updated root README/agent guidance/architecture skill references, and corrected obsolete overview claims about passkeys and build-time SEO by omitting the removed capabilities. No application code changed.

- Moved the five standalone docs (API conventions, authentication/RBAC, backend architecture, data model, frontend architecture) into `docs/architecture/`. Updated agent guides, skill references, specs, internal Markdown links, and the directory snapshot. Documentation-only reorganization; no build or tests run.

- Removed root `scripts/` and `storefront/scripts/` at the owner's request. Removed Admin's license-generation prebuild hook and Storefront SEO/optimizer/audit commands, kept the generated license data and existing image assets, and updated current documentation. ADR-0016 is withdrawn; earlier progress entries about the removed scripts are historical. No build or tests run.

- Removed the `deploy/` directory at the user's request, including its six Nginx, Supervisor, and cron example files. Updated deployment/frontend documentation to describe hosting requirements without references to removed templates. No application code changed.

- Consolidated the frontend/UI rules, feature module template, and UI acceptance checklist into `docs/architecture/frontend-architecture.md`. Removed the `shadcn-ui-page` and `react-feature-module` skill definitions and their migrated reference files; updated root agent guidance and the directory snapshot. Impeccable remains available for design work. Documentation-only change; no build or tests run.

- FAQ/help center: embedded the existing contact request form in a collapsed section on `/faq`, passing the signed-in customer fields and honoring `contact_form_enabled`; when disabled, show contact-info fallback. Reuses the current API endpoint and validation; updated FAQ spec and detailed-layout tracker. No build/tests run.
- Re-ran the image optimizer after adding PNG/JPEG master conversion: it regenerated the manifest with 450 WebP entries and reported 90 source-limited variants; no PNG/JPEG master inputs are currently present, so this run exercised the existing WebP corpus only. Build and tests were not run.
- Image pipeline now accepts high-resolution `*-photo.png`, `.jpg`, and `.jpeg` originals by normalizing them to WebP before responsive variants and AVIF are produced. Existing WebP masters remain unchanged; detail variants stay resolution-gated and byte-budgeted. Updated PDP and implementation specs. No tests or build were run.
- Confirmed existing AVIF delivery in `ResponsiveImage`: its `<picture>` uses AVIF candidates derived from API-verified WebP `srcset` and retains the WebP `<img>` fallback. No API field change was necessary; documented this in the image implementation tracker.
- Ran `npm run images:optimize:demo` after the high-resolution variant change: refreshed the manifest for 450 WebP assets; 19 active seeder images have 200w/600w outputs within their byte budgets; 90 responsive candidates were skipped because the source dimensions are too small (including 1200w for the 800×1000 masters). The script now reports those source-limited skips explicitly. This is an asset generation run, not a test; no build/lint/tests were run.
- Image pipeline: added the 1200×1600 WebP derivative with a 200 KB cap when source dimensions support it, and exposed an existing 1200w file through ProductResource `srcset`. The optimizer removes a stale 1200w derivative when the replacement source is smaller instead of upscaling. Existing 800×1000 seeded photos therefore keep 200/600 variants only. Updated PDP spec and implementation tracker. No optimizer run, Pint, build, or tests were run.
- PDP gallery: added Left/Right arrow-key navigation inside the full-screen image dialog, complementing the existing touch swipe and previous/next buttons; updated the product-detail spec. No build, browser QA, or tests were run.
- Responsive storefront header: expanded the second-row search/utility layout to 381–460px so the brand and category trigger keep a dedicated first row on compact phones; synchronized the storefront home page spec. CSS/source inspection only; no browser visual QA, build, or tests were run.
- Đối chiếu mục 5 của plan với asset/seeder hiện tại: có 20 mapping cho 19 ảnh demo riêng (một sản phẩm dùng chung ảnh), mỗi ảnh đang dùng có bản 800×1000, 200×267 và 600×800 kèm AVIF. Không có bản 1200×1600 do nguồn demo chỉ 800×1000; seeder chỉ gắn một ảnh demo chính, chưa đủ gallery 7 góc theo màu. Cập nhật tracker để nêu đúng khoảng trống; không tự phóng to ảnh hoặc xem ảnh AI demo là ảnh hàng thật. Không chạy test/build.

### Detailed fashion website layout implementation (2026-11-06)

- Replaced the generic 404 placard graphic with a small fashion-themed SVG illustration featuring a floating dress and 404 sign. Its animation honors `prefers-reduced-motion`; no animation package or remote asset is required. Updated the detailed-layout tracker. No tests or frontend checks were run.
- Completed the 404 page's four quick links to real discovery routes (all products, new arrivals, collections, and stores), shown only for 404 states. Links reflow from four columns to two on mobile and retain visible keyboard focus. Updated the storefront error page spec and detailed-layout tracker. No tests or frontend checks were run.
- Replaced the Admin dashboard's recent-order link list with the plan's semantic table: five named columns, up to eight latest orders, order-code detail links, and bounded horizontal scrolling at narrow widths. Loading, retryable error, and empty states remain intact; the page spec now records the table requirement. No tests or frontend checks were run.
- Added `/style-guide` as an occasion/outfit discovery index backed by Admin-selected published Lookbooks. Cards use store-managed names, descriptions, and images; each opens the existing outfit flow with variant selection and add-selected-items-to-cart. Added responsive loading/error/empty states, footer and HTML sitemap links, the Laravel XML sitemap entry with a cache-key bump, SEO metadata, and a `build:seo` snapshot. Updated content-page and detailed-layout specs. No tests or frontend checks were run.
- Extended `/faq` into the plan's help-center entry: it now presents up to six responsive topic cards derived from published FAQ groups, each linking to its matching section, and the page title/copy direct customers to contact support when needed. No policy text or unconfigured chat channel was invented. Updated the FAQ page spec and detailed-layout tracker. No tests or frontend checks were run.
- Updated both storefront footer variants and the HTML sitemap to label `/faq` as “Trung tâm trợ giúp,” matching the expanded page role and making it easier to discover. No tests or frontend checks were run.
- Corrected the Admin dashboard to match the detailed layout's eight-row recent-orders table (the earlier dashboard page spec and progress note incorrectly said five): the query now requests eight orders, its widget copy reflects eight, and the page spec/tracker are aligned. No tests or frontend checks were run.
- Changed the header search trigger to open a full-screen native dialog with focus management, Escape/backdrop/close-button dismissal, and focus restoration. The existing API suggestions now show at most four products with the planned 64px thumbnails alongside category, collection, editorial, recent, and trending suggestions. Updated the Home page spec and tracker. No tests or frontend checks were run.
- Raised the PDP's 360-degree viewer threshold from 8 to 24 ordered frames, matching the plan's 24–36-frame image-sequence guidance; Admin upload guidance now calls for that range. Direct drag, keyboard slider, and previous/next controls remain available. Updated the PDP page spec and tracker. No tests or frontend checks were run.
- Completed the PDP's planned direct-drag 360° interaction on top of the existing Admin-ordered frame viewer. Pointer dragging advances frames proportionally to gallery width; the range input and buttons remain accessible, vertical touch scrolling is preserved, and changing color cancels the drag and resets the frame. Updated the PDP page spec and tracker. No tests or frontend checks were run.
- Added UI-first `/refer-a-friend` and `/affiliate` pages with editorial layouts, referral-code/benefit/history placeholders, onboarding steps, an accessible validated application preview, footer/sitemap links, metadata, and noindex while policy/API work remains incomplete. They do not issue codes/rewards or send applications. No tests or frontend checks were run.
- Added a UI-first `/gift-cards` page with the planned denominations, three designs, recipient/email/message/scheduled-date fields, a responsive flippable preview, accessible form validation, footer/sitemap links, and SEO metadata. The preview explicitly states it does not issue a card or order; the complete gift-card feature remains gated on owner policy for issuance, balance, expiry, refunds, redemption, and the Admin/API flow. No tests or frontend checks were run.
- Added a welcome newsletter dialog that appears after 15 seconds or desktop exit intent, at most once per session. A new public boolean reports whether the configured welcome coupon is currently active, within its date window, and has remaining uses; the coupon code remains private. The dialog reuses the explicit-consent newsletter form and respects Escape/backdrop/close-button dismissal and reduced motion. Updated the detailed layout to reflect the configured offer instead of promising a fixed 10% discount, plus the home page spec and full-spec tracker. API type generation, storefront production build, scoped ESLint, Pint, and PHP syntax check passed; no tests were run.
- Added the public `/sitemap` HTML directory with grouped stable routes, API-backed categories, collections, brands, and published CMS pages; each remote group has loading, retryable error, and empty states. Linked it in the footer, added it to known routes and canonical metadata, included its path in the XML sitemap, and added its grouped SEO snapshot output. Updated the detailed layout, content-page spec, and frontend SEO documentation. Storefront build, SEO script syntax, API Pint, and scoped lint passed; no tests or browser verification were run.
- Brand detail pages now have their own editorial masthead with Admin-managed logo, banner/alt text, short brand story, and brand SEO metadata; the existing product grid remains filtered and the filter panel stays collapsed initially. Added brand banner upload/preview fields in Admin and additive migration `2026_11_06_001656_add_brand_banner_fields_to_brands_table`. Added published brand URLs to the sitemap and branded product-grid snapshots for search engines. OpenAPI/types, the layout plan, catalog page spec, and data model are aligned. API type generation, Pint, and both production builds passed. The local database has multiple earlier pending migrations, so no migration or SQL snapshot export was applied; the new migration remains pending. No tests were run.
- Reworked checkout into three gated steps: recipient information, fulfillment/quote, and payment. Step-specific React Hook Form validation prevents progression with invalid data; back navigation remains available, and client/API validation errors focus the step that needs attention. The API quote/order flow and desktop summary remain authoritative.
- Added responsive progress and step-action styling with visible focus states and reduced-motion behavior.
- Made the server-priced order summary sticky beside checkout on desktop and a collapsed, total-visible accordion above the form on compact screens. Order success now has a two-second confetti accent that is disabled for reduced-motion preferences.
- Fixed the product-detail shared-image transition to wrap `ResponsiveImage` in `motion.div` (the image component itself does not accept Motion props); reduced-motion users skip the shared layout animation.
- Aligned AI demo product-photo delivery with the detailed layout: the generator now writes 200×267, 600×800, and 1200×1600 WebP variants with size-budget retries; the existing-image optimizer backfills verified 200/600 candidates, creates AVIF derivatives, and records dimensions/bytes in its manifest. The Product API emits a sorted `srcset` using only files that exist and keeps the legacy 360/640 variants compatible. Pint, PHP lint, and the image-optimization pipeline completed successfully; no tests were run.
- Storefront production build passed after the checkout summary and success-state animation changes. No tests were run.
- Added the PDP “Hoàn thiện outfit” selector using published same-category related products: shoppers can choose up to four products, select an available variant for each, see an API-price estimate, and add selected items through the existing cart API with partial-failure feedback. The related-products endpoint now includes active variants and current available inventory; UI copy discloses these as category-based suggestions rather than curated outfit pairings. API contract docs and the PDP spec are aligned. Storefront production build passed; PHP lint and Pint passed. No tests were run.
- Implemented the cart layout's select-all/per-line checkboxes and confirmed bulk removal. Requests run sequentially through the canonical cart API; successful lines leave the selection and failures remain selected with partial-result feedback. Cart controls are disabled during the batch to prevent concurrent edits. Updated the detailed layout, cart page spec, and tracker. Storefront production build passed. Full lint remains failing on six existing errors in NotificationPreferencesPage, WishlistPage, useCatalogQueries, and StorefrontSearchBox, plus three warnings elsewhere; CartPage has no reported lint errors. No tests were run.
- Added full-cart cross-sell suggestions from the related-products API. The cart excludes products already present, offers only products with available variants, requires an explicit variant choice, and shows loading/retry/empty states. Updated the detailed layout, cart page spec, and tracker. Storefront production build passed; no tests were run.
- Added a Sale-page campaign countdown that appears only when the active Admin-configured campaign banner enables it and has a real `ends_at`. The CTA jumps to the sale product grid; no sale-through percentage is fabricated without campaign target data. Updated the catalog spec, detailed layout note, and tracker. Storefront production build passed; scoped ESLint found no errors (one existing React Compiler warning in `CatalogPage`). No tests were run.

### Storefront brand rename and header logo visibility (2026-11-05)

- Changed the storefront display name to Sarada across storefront copy/metadata, API defaults, demo seed data, PWA manifest, and social preview artwork. Added and applied targeted data migrations so existing default NÉT Studio/Morrow store settings and brand record now migrate to Sarada without changing the retained brand slug.
- Storefront header and footer now always render the original monogram asset `/branding/net-studio-mark.png`; favicon and structured data use the same asset. Increased its display size while preserving the original PNG color (no image filter). Store name remains an accessible label and is not printed beside the logo.
- Storefront production build completed successfully. No tests were run.

### UI-first preview header logo (2026-11-05)

- The missing logo report was from `/` with `?mode=ui`, which renders a separate UI-first preview header rather than the production `StorefrontHeader`. Updated that preview header to use the original monogram PNG with responsive sizing and contrast, matching the production header/footer.
- Applied the plan's Fraunces display + Inter body fonts to the UI-first preview, replacing the preview's Georgia/system-ui overrides.
- Direct Chrome visual recheck was stopped by the user. Storefront production build passed with `RAYON_NUM_THREADS=1` after an initial memory allocation failure. No tests were run.

### Storefront font family registration fix (2026-11-05)

- Fixed the font token names to match the actual self-hosted `@fontsource-variable` registrations (`Fraunces Variable` and `Inter Variable`). The old tokens silently selected Georgia/system fallbacks, which caused the reported Vietnamese glyph rendering issue in the UI-first preview.
- Storefront production build passed with `RAYON_NUM_THREADS=1`. Direct browser confirmation was stopped by the user. No tests were run.

### Storefront editorial plan continuation (2026-11-05)

- Applied the warm editorial visual system on the storefront with self-hosted Fraunces/Inter fonts, shared color/radius/shadow tokens, and added motion/hover polish in the home experience. The UI plan remains in progress; this does not complete every planned page or release gate.
- Added reduced-motion-aware staggered reveals to home product rails and desktop-only pointer tilt/spotlight to catalog cards, matching the plan's product-card interaction while keeping mobile and reduced-motion behavior static.
- Removed legacy homepage font overrides and raised the editorial display-font rule so old component-level system/Georgia declarations no longer suppress Fraunces on storefront headings.
- Kept the original N monogram image for the storefront logo and favicon paths; removed the added wordmark logo. Updated the Morrow social preview artwork and repaired Vietnamese metadata encoding in the document head and preview SVGs.
- Storefront production build completed successfully after the metadata and card interaction updates. The latest typography cascade cleanup still needs a compile pass. No tests were run.

### Storefront English locale and typography (2026-11-05)

- Restored storefront appearance remains Editorial / Magazine (S13) with Sand & Clay (P09). Added self-hosted DM Sans for interface text and DM Serif Display for headings.
- Added a persistent EN/VI language selector, defaults new visitors to English, and updates the document language. Translated the primary desktop navigation, account menu, announcement bar, and selected homepage controls/states; the remaining storefront pages and API-authored content still need full English translation.
- Changed document metadata and default SEO title/description to English. Store currency and checkout remain VND/COD as specified.
- Storefront production build passed after font and locale changes. Full-spec release and remaining P0 acceptance gates are still open.

### Storefront full-spec continuation and original appearance restore (2026-11-05)

- Restored the storefront default appearance to Editorial / Magazine (S13) with Sand & Clay (P09), including the appearance reset action. Existing browser settings left by the temporary S04/P12 Glassmorphism default are migrated back to the prior default once.
- Removed the temporary Glassmorphism stylesheet/background asset and the self-hosted font packages added for that style. Existing storefront feature work and UI-first preview routes remain intact.
- Storefront production build completed successfully after the restore. The full-spec tracker still has open release/owner-input items and remains active.

### Storefront customer passkeys (2026-11-05)

- Connected the existing WebAuthn API to the Storefront: customers can register/list/remove passkeys in account settings, and supported browsers can use passkey login. Challenges remain one-use with a five-minute expiry; password login/reset remains the recovery fallback. Updated generated API types, account/security docs, and the full-spec tracker. No tests, build, or lint were run.

### Storefront guest checkout conversion (2026-11-05)

- Added an optional account-registration action to the guest order-success page while keeping order tracking and shopping links available. Signed-in customers do not see the registration prompt. Updated the checkout page spec and Storefront full-spec tracker. No tests, build, or lint were run.

### Storefront catalog visibility and product discovery (2026-11-05)

- Fixed the public product resource closure that previously caused the catalog endpoint to return HTTP 500; the local API now returns 19 published products and the demo image URLs respond successfully.
- The home best-seller rail now starts on Tất cả, avoiding an empty default audience tab while preserving Nam/Nữ/Phụ kiện filters. Desktop catalog filters are collapsed by default so product imagery appears higher on the page; the existing mobile filter sheet remains unchanged.
- Tightened the desktop Storefront header layout and improved product image/card hierarchy in the minimal theme. Updated the home, catalog, and full-spec UI notes. No tests/build/lint were run.

### Storefront store pickup (2026-11-05)

- Added a separate per-store/variant inventory and reservation pool while retaining the online inventory pool. Pickup quote/placement checks active store availability, locks branch balances, charges no delivery fee, snapshots branch details on the order, and routes reservation/release/sale/return movements through InventoryService.
- Added Admin branch stock listing, reasoned quantity adjustments, movement history, and safeguards preventing deletion of branches with open pickup orders or retained inventory history. Admin and customer order views show pickup details and contextual ready/picked-up labels.
- Updated ADR-0019, checkout flow, data model, ERD, order state diagram, store-location spec, OpenAPI, generated API types, and the storefront-full-spec tracker. Migration `2026_11_05_440000_add_store_pickup_inventory` is pending; no database migration or tests were run.
- Follow-up review merged the pickup-specific state explanation into the existing order-state note and hid branch stock controls from staff without `inventory.view`.

### Storefront Vietnamese voice search (2026-11-05)

- Added explicit microphone search on the Storefront catalog/search form using browser speech recognition in `vi-VN`. It submits recognized terms through the existing search flow and caps input to the current 120-character limit.
- Unsupported browsers, denied microphone permission, and recognition failures show accessible feedback while retaining normal text search. No audio is sent to the Storefront API.
- Updated the storefront full-spec task tracker. No tests or builds were run.

### Storefront product detail videos (2026-11-05)

- Added a separate `product_videos` table, product relationship, and Admin upload/delete API guarded by `products.update`; uploads accept MP4/WebM up to 5 MB, optional captions, and optional color associations.
- Added an Admin video manager and native-control video playback on product detail. Public API exposes videos only when the detail endpoint eagerly loads them; selecting a color filters the gallery's color-specific videos.
- Updated OpenAPI, generated API types, data model, ERD, and the full-spec tracker. Migration has not been run; no tests/builds were run.

### Storefront product 360-degree viewer (2026-11-05)

- Added an additive `is_360_frame` flag to product images and an Admin checkbox; existing images remain regular gallery images by default.
- Product detail shows a color-aware 360-degree frame viewer only when at least eight frames are ordered for that product/color, with keyboard-operable range and previous/next controls.
- Updated OpenAPI, generated types, product image ERD/data-model notes, and the PDP tracker. Migration has not been run; no tests/builds were run.

### Storefront remembered login session (2026-11-05)

- Added an unchecked “Ghi nhớ tôi” option to Storefront login. Checked sessions use a persistent httpOnly refresh cookie for the configured lifetime; unchecked sessions use a browser-session cookie, with the selection preserved across refresh rotations. The API defaults omitted values to the existing persistent behavior for compatibility and leaves Admin login unchanged. Added `refresh_tokens.remember_me`, applied the additive migration, regenerated the SQL schema snapshot, and updated OpenAPI types, security docs, and the account page specification. No tests or frontend build/lint were run.

### Storefront verified phone changes (2026-11-05)

- Replaced direct customer phone edits with a recent-authenticated SMS verification flow requiring the current password. Added `phone_verified_at`, one pending challenge per account, HMAC-only six-digit codes, ten-minute expiry, five-attempt limit, one-minute resend cooldown, phone masking in audit logs, and verification-gated phone login. Admin profile updates remain separate. Updated OpenAPI, account UI, account data export, ERD/auth-flow diagrams, data/security docs, and the full-spec tracker. Applied the additive local migration and regenerated the SQL schema snapshot. API types, routes, Pint formatting, and schema snapshot were checked; no tests or frontend build/lint were run.

### Storefront catalog quick view (2026-11-05)

- Added a responsive, native-dialog quick view to product cards with variant-aware color and size selection, current variant VND price and API stock state, product photo disclosure, detail-page link, and add-to-cart. The dialog closes after cart API success and retains its state/error after a rejected add. Updated catalog UI guidance and the full-spec tracker. No tests, frontend build, or lint were run.

### Storefront personal data export (2026-11-05)

- Exposed the existing owner-scoped personal data export and retention endpoints to authenticated storefront accounts as well as Admin accounts; signed downloads also require a valid account session. Added a privacy section to customer account settings with queued/running progress, retryable load/download errors, and seven-day expiry display. Updated OpenAPI, generated client types, and account/API/auth docs. No tests, frontend build, or lint were run.

### Storefront Zalo ZBS notifications (2026-11-05)

- Connected Zalo ZBS Template Message delivery to order-created/shipped, price-drop, newsletter-welcome, and Admin promotion notifications. Delivery follows each customer's Zalo preference and requires an account phone. Added OAuth refresh with encrypted persistence of each rotated refresh token and cached access tokens, plus environment placeholders and channel-availability reporting. The four approved Zalo templates must match the variable names emitted by the notifications; real delivery remains unverified until the shop supplies valid OA credentials and approved template IDs. No tests or build/lint checks were run.

### Storefront notification preferences and browser push (2026-11-05)

- Added customer-owned notification preferences for order, promotion, and price-drop events across in-account, email, SMS, Zalo, and browser push channels, with server-reported availability and validation against unavailable channels. Order and price-drop email/in-app/push delivery respects saved choices; configured Twilio SMS delivery uses retryable jobs that load the customer's current phone at send time. Storefront customers can register/revoke their own browser push devices. Zalo delivery was completed in the entry above. No tests, frontend build, or lint were run.

### Storefront customer order notifications (2026-11-05)

- Added customer-scoped, paginated notification inbox APIs with unread count, single mark-read, and mark-all-read. Authenticated order placement and shipment updates now create in-app notifications in the existing Laravel notifications table, and `/account/notifications` displays them with order links and retryable loading/error states. Updated OpenAPI, generated types, account/API docs, and the full-spec tracker. Customer channel preferences and promotional/SMS/Zalo/browser-push delivery remain open. No tests, frontend build, or lint were run.

### Personalized storefront recommendations (2026-11-05)

- Added authenticated `GET /account/recommendations`, ranking related in-stock published products from recent views and paid delivered/completed order items. Added an accessible, retryable homepage recommendation rail and Admin toggle/order setting. Existing persisted home-section settings are kept in order and receive newly supported keys when normalized. Updated OpenAPI, generated types, data/API/UI docs, and the full-spec tracker. Route registration and PHP formatting were checked; no tests, frontend build, or lint were run.

### Storefront customer voucher wallet (2026-11-05)

- Added authenticated, paginated `GET /account/vouchers` using existing coupons and customer coupon usage, with server-derived availability and status filters. Storefront `/account/vouchers` shows offer terms, usage, expiry, loading/error/empty states, and lets customers enter a code or use an available voucher by carrying it to the cart; cart quote remains authoritative. Updated OpenAPI, generated types, API/UI docs, and the full-spec tracker. No tests, frontend build, or lint were run.

### Customer order refund details (2026-11-05)

- Storefront order details now include the total amount refunded and a timestamped list of refund amounts. The account order page presents that history beside cancellation/return request decisions and staff responses. The API omits refund reasons and recorder metadata. Updated OpenAPI, generated types, account UX/data/API docs, and the full-spec tracker. No tests, build, or lint were run.

### Configurable homepage membership promotion (2026-11-05)

- Added the membership section to the shared homepage allowlist/defaults, Admin enable/order settings and English label, storefront rendering, and SEO snapshot ordering. The storefront block loads tier rates, point conversion, and expiry from the public program API with loading and retryable error states. Updated homepage UX spec and full-spec tracker. No frontend build, lint, or tests were run.

### Storefront checkout membership point redemption (2026-11-05)

- Checkout now accepts the customer's opt-in to redeem points, calculates the discount on the API against the post-coupon merchandise subtotal, consumes the earliest-expiring ledger lots under a user lock, and records point/discount snapshots on the order. Refunds restore redeemed points proportionally and returns restore them fully with original expiry. Applied migration `2026_11_05_370000_add_checkout_membership_redemption`; regenerated `fashion_store_schema.sql` and audited the connected database at 76 tables/729 columns with matching normalized definitions. Regenerated admin/storefront OpenAPI types and updated the data model, UI page spec, and implementation tracker. PHP Pint had passed for these changes in the preceding work; no tests, frontend build, or lint were run.

### Public storefront membership program page (2026-11-05)

- Added public `GET /api/v1/membership/tiers` backed by the same tier rules used for customer membership, plus `/membership` with responsive tier cards, benefits, earning/expiry rules, registration/account links, metadata, WebPage JSON-LD, sitemap inclusion, and an API-backed SEO prerender snapshot. The footer links to the program, and accessibility/keyboard route inventories include it. Regenerated OpenAPI types and confirmed both membership routes register with `php artisan route:list --path=membership`. No tests or frontend checks were run.

### Storefront membership points foundation (2026-11-05)

- Added the customer points ledger and tier summary API. Points accrue once after a paid order is delivered/completed, carry a 12-month expiry, and receive refund/return adjustments. Added the `/account/membership` page with tier progress, benefits, expiry notice, paginated history, account navigation, and a compact dashboard summary. The ledger migration was applied; the 76-table/726-column schema snapshot was regenerated and audited against the local database. OpenAPI types were regenerated and Pint formatted changed PHP files. No tests or frontend checks were run. Checkout point redemption and voucher wallet remain unfinished; current tier/earn/expiry/conversion rules are defaults requiring owner approval before launch.

### Catalog category and collection headers (2026-11-05)

- Category and collection listing pages now render published API cover images when present; category pages link directly to active child categories with compact chips. Demo media disclosures follow collection cover alt metadata. Missing images stay omitted. Updated catalog UI documentation and added a granular tracker item. No frontend checks or tests were run.

### Cart price-change warning (2026-11-05)

- The cart now compares the last synchronized unit price against each line's unit price in the current server quote. When they differ, it names the affected item and shows the old and new price beside the quote. No browser-calculated total is used. Updated cart UI documentation and added a granular full-spec tracker item. No tests or frontend checks were run.

### Catalog pagination SEO links (2026-11-05)

- Paginated storefront catalog, search, collection, category, brand, and merchandising routes now emit `rel="prev"` / `rel="next"` head links from API pagination metadata. Each link preserves active filters and sort; page one omits the page parameter, and stale links are removed when pagination is unavailable. Updated the catalog UI spec and added a granular full-spec tracker item. No tests or frontend checks were run.

### Storefront VAT invoice request (2026-11-05)

- Checkout now optionally collects a tax code, company name, and invoice address, validates them only when invoice is requested, and snapshots those values on the order. Success confirms receipt of the request; authorized Admin order detail displays the submitted invoice identity fields. Added migration `2026_11_05_320000_add_vat_invoice_details_to_orders_table`, OpenAPI/generated types, UI/business-flow/data-model/ERD docs, and a tracker entry. Tax-code autofill is not included because no lookup provider is configured; customers enter the code manually.
- Migration was applied to the connected local database. Build, lint, Pint, syntax and schema snapshot checks are pending. No tests were run.

### Storefront system color mode (2026-11-05)

- Completed the appearance picker's missing system-following mode: customers can choose device, light, or dark; device mode listens to `prefers-color-scheme` changes while open, persists the choice, and updates storefront color tokens and theme metadata. Updated appearance docs and the P2 tracker. Storefront production build and targeted ESLint passed. No tests or browser UAT were run.

### Storefront product comparison (2026-11-05)

- Added `/compare` for up to four published products with live API data, price/brand/category/material/fit/color/size/stock/rating comparison, browser-persisted selections, removable/clearable choices, and shareable URLs. Selection is available from catalog cards and product detail. Added `noindex`, a responsive horizontally scrollable table, accessible controls, UI documentation, and a full-spec tracker entry.
- Storefront production build and focused ESLint for the comparison feature, route, catalog, and SEO code passed. ESLint reports only the existing React Hook Form `watch()` compiler warning in `CatalogPage.tsx`. No test suite or browser UAT was run.

### Storefront FAQ (2026-11-05)

- Added searchable, topic-grouped `/faq` content backed by active-only plain-text FAQ records. Staff with `content.manage` can search, create, edit, publish/unpublish, paginate, and delete entries in Admin. The page uses native disclosure controls and FAQPage structured data; sitemap and release snapshots include the route only when active FAQs exist.
- Applied `2026_11_05_310000_create_faqs_table`, updated OpenAPI/generated types, Admin audit mapping, requirements, specs, ERD, page route, footer, and SQL snapshot. PHP Pint, PHP syntax checks, route registration, OpenAPI type generation, both production builds, targeted ESLint in Admin and Storefront, and 73-table/689-column schema audit passed. No tests or interactive API/browser UAT were run.

### Storefront store directory (2026-11-05)

- Added the public `/stores` directory with active-only location data, province filtering, map/directions, and nearby sorting that requests geolocation only after the visitor clicks. Admin staff with `content.manage` can create, edit, publish/unpublish, filter, and delete store locations; coordinates and opening hours are validated.
- Added and applied `2026_11_05_300000_create_store_locations_table`, public/Admin API routes and OpenAPI types, sitemap/SEO snapshot support, accessibility/keyboard audit coverage, requirements, page specs, ERD, data-model notes, and the SQL schema snapshot. The Storefront and Admin production builds, PHP Pint, and 72-table/680-column schema snapshot audit passed. No tests or interactive browser/API UAT were run.

### Storefront guest cart recovery (2026-11-05)

- Added guest-only cart recovery contact endpoints and a consent form on the full cart page. Guests can save/update their email or withdraw consent; contact data is returned only with the matching cart, excluded for signed-in carts, and cleared when the cart empties, expires, or checkout succeeds. The reminder scheduler now includes consented guest carts alongside active newsletter-subscribed members.
- Applied migration `2026_11_05_290000_add_guest_cart_recovery_consent_to_carts_table`; updated OpenAPI/generated types, Storefront, FR-MKT-003, cart specs, data model, ERD, and the full-spec tracker. Storefront production build, targeted ESLint, Pint, route registration, and the 71-table/665-column schema snapshot audit passed. No test suite, browser UAT, or actual email delivery was run.

### Storefront review video media (2026-11-05)

- Extended delivered-order reviews with one MP4/WebM upload up to 5 MB alongside existing photos. Server validates detected MIME/extension/size, marks media as image/video, and stores both behind the pending review until staff approval. Approved PDP reviews render videos with native controls; Admin moderation details preview both media types and list counts include all files.
- Added migration `2026_11_05_280000_add_media_type_to_review_images_table`, updated OpenAPI/types, upload UI, PHP 18 MB request-body guidance, data model, ERD, requirement, and catalog/full-spec trackers. Pint, OpenAPI type generation, both production builds, targeted ESLint, and the 71-table/663-column schema audit passed. No tests or media-upload UAT were run.

### Storefront abandoned-cart email reminders (2026-11-05)

- Added cart activity tracking and one-hour/24-hour reminder claims. Cart mutations and guest-to-customer merges restart both stages; active members need a matching newsletter subscription, while guests use the separate explicit cart-recovery consent added in the follow-up section above. Zalo delivery remains unsupported.
- Added migration `2026_11_05_270000_add_cart_recovery_tracking_to_carts_table` and scheduled `storefront:dispatch-cart-recovery` every 15 minutes. API mutations and queue delivery have not yet been exercised in UAT; no tests were run.

### Storefront product Q&A (2026-11-05)

- Added moderated `product_questions`: signed-in customers can ask questions, the public PDP lists answered questions only, and Admin staff with `reviews.moderate` can answer, hide, or reopen them. Public and Admin resources omit customer contact details. Updated OpenAPI/generated types, product detail/Admin screens, requirements, API/data-model docs, and catalog/full-spec trackers.
- Applied migration `2026_11_05_260000_create_product_questions_table`, regenerated the schema snapshot, and passed the 71-table/659-column audit. Storefront and Admin production builds, targeted ESLint, Pint, and route registration passed. No tests or interactive/UAT checks were run.

### Storefront price-drop and wishlist restock alerts (2026-11-05)

- Added FR-MKT-002, a customer-owned product price-alert table/API, PDP and wishlist controls, one-time queued Vietnamese email after the scheduled watcher observes a lower effective VND price, and account-email restock registration for sold-out variants on both surfaces. Guest PDP email/SMS restock remains intact.
- Applied additive price-alert and stock-alert ownership migrations to the connected local database, regenerated `fashion_store_schema.sql`, and passed the 70-table/649-column schema audit. OpenAPI type generation, Storefront production build, targeted ESLint, Pint, route registration, and scheduler listing passed. Full Storefront lint still reports existing failures in unrelated files; no tests or mail-delivery UAT were run.

### Storefront public review data minimization (2026-11-05)

- Added a dedicated Storefront review resource that omits customer email, while Admin review endpoints retain their permission-protected customer email field. The public OpenAPI schema now describes only the reviewer display name; refreshed generated types and aligned the existing review fixture.
- PHP syntax/Pint, Storefront build, and targeted ESLint passed. No tests were run.

### Storefront product delivery estimator (2026-11-05)

- Added FR-CHK-005 and a PDP delivery estimator that loads province/ward choices and destination-eligible configured methods only when opened. The public shipping endpoint now returns the province-rate fallback, active methods, base VND fees, free-shipping threshold, and configured ETA text; estimates are labeled informational and checkout keeps final pricing authority.
- Reused the same shipping-method eligibility query for checkout preview and the estimate endpoint, updated OpenAPI/generated types and API/PDP specs. PHP syntax/Pint and Storefront build/targeted ESLint passed; no tests were run.

### Storefront product specification tab (2026-11-05)

- Added the missing keyboard-operable Specifications tab on product detail. It displays only catalog data that exists (category, brand, fit, material, selected SKU/color/size) and has an explicit empty state. Product benefit copy also reflects configured bank transfer/VietQR alongside COD. Updated the product detail page spec and full-spec tracker.
- Corrected the bank BIN pattern escaping in OpenAPI and regenerated Admin/Storefront API types. Storefront production build passed; no tests were run.

### Storefront manual bank transfer checkout (2026-11-05)

- Added a configured bank transfer/VietQR option alongside COD. Orders snapshot bank destination details, and an order-scoped capability token protects a payment instructions page that shows the exact amount/reference and polls payment status. The order confirmation email repeats account, amount, and reference for recovery. Staff must reconcile transfers manually in Admin; no gateway settlement is claimed.
- Added and applied the additive `orders.payment_instructions` migration to the connected local database. Updated OpenAPI/generated types, public payment-method disclosures, docs, and regenerated the SQL schema snapshot. OpenAPI generation, PHP syntax/Pint, Storefront production build, and the 65-table/603-column schema audit passed; no tests were run.

### Storefront empty-cart recommendations (2026-11-05)

- Empty cart now recommends up to four real best-selling products from the catalog API and links to their product pages and the full best-sellers list. Loading and retryable error states are included; an empty recommendation result stays omitted.
- Updated the full-spec tracker. No tests or frontend checks were run.

### Storefront checkout delivery method selection (2026-11-05)

- Checkout quotes the province-rate fallback alongside active Admin-configured methods, scoped nationally, by province, or by selected wards. The selected delivery area is sent with preview; the API filters options and revalidates/locks the selected method inside the order transaction. Order and customer/guest tracking responses preserve the selected method and estimate snapshots.
- Admin can set a method's province and optional ward limits. Updated OpenAPI, generated API types, checkout/admin UI, flow/page specifications, API conventions, data-model notes, and SQL schema snapshot. Two additive migrations for area scope and order snapshots are pending; no tests were run.

### Storefront back-in-stock SMS option (2026-11-05)

- Extended the sold-out variant alert to accept one email or Vietnamese phone number. SMS is queued through Twilio only when credentials are configured; the Storefront exposes the option only when enabled, and failed SMS jobs retry and restore the pending alert.
- Added an additive migration, public configuration flag, API contract, generated type updates, form/UI behavior, data-model/API/UI documentation, and the expected SQL schema snapshot shape. OpenAPI type generation, Pint, and PHP syntax checks passed. The migration remains unapplied; Twilio credentials and delivery are deployment prerequisites. No tests were run.

### Storefront order detail receipt and support flow (2026-11-05)

- Added the saved payment method to the authenticated customer order detail contract and display, alongside order date and payment status.
- Customers can print/save an order summary as PDF and open the contact form with their order code prefilled. Print styles isolate the order summary and omit interactive controls; the page states that the printout is not a VAT invoice.
- Updated OpenAPI, generated API types, customer account UX notes, and the implementation tracker. The API types were generated successfully, Pint passed, and PHP syntax passed; no tests were run.

### Storefront search results include published content pages (2026-11-05)

- Added a bounded, paginated `/search/pages` API that searches published CMS page title, slug, SEO description, and content; responses reuse the safe title/slug/plain-text resource and never expose drafts or raw HTML.
- `/search?q=` now has accessible product and page-result tabs, accurate result counts, retry/empty states, and previous/next pagination for content pages. Image/voice search and future blog article search remain outside this slice.
- Updated OpenAPI and generated Admin/Storefront API types, API conventions, Storefront search UX notes, and the implementation tracker. OpenAPI type generation, Pint, and PHP syntax checks passed. No database changes or tests were run.

### Storefront contact page and inquiry form (2026-11-05)

- The stable `/contact` page now works even without a published CMS record, shows configured support/store contact details, and provides a form for name, phone, email, topic, optional order code, message, and optional validated image.
- The public API sends requests directly to the configured support email (falling back to the store email), limits submissions to five per minute per IP, and does not persist message or attachment content. A missing recipient or mail delivery failure returns a stable retryable `503` response.
- Updated public storefront configuration, OpenAPI and generated API types, API conventions, contact page UX notes, and implementation tracker. OpenAPI generation, Pint, and PHP syntax checks passed; no tests were run.

### Storefront phone-number sign-in (2026-11-05)

- Storefront login now accepts either a normalized email address or the account's unique phone number. Admin login remains email-only, and legacy Storefront `{ email, password }` requests remain supported while new clients send `{ identifier, password }`.
- Updated the storefront form, API contract/types, identity/abuse-control docs, and the granular authentication tracker. The existing login throttle now keys on the storefront identifier. OpenAPI types regenerated, Pint passed, and PHP syntax checks passed for the changed PHP files. No tests were run.

### Consent-gated storefront analytics (2026-11-05)

- Exposed the validated public GA4 measurement ID through storefront configuration and kept the tracker unloaded until analytics cookies are explicitly accepted. Revoking consent updates Google consent state to denied.
- Added route page views and GA4 commerce events for product views, successful cart additions, checkout starts, and API-confirmed purchases. Purchase values and line items come from server responses; paths mask order/reset tokens and query strings are omitted.
- Updated cookie copy, API contract, settings validation, and the storefront implementation tracker. No advertising pixel or external conversion API is installed.

### Storefront error and maintenance recovery (2026-11-05)

- Shared a recovery panel across unknown routes, router error boundaries, and maintenance mode with a product search form, suggested search queries, and a home link; server/render errors can be retried.
- Added the error-page UX notes and a granular P0 tracker item. No tests were run.

### Admin-configurable storefront homepage sections (2026-11-05)

- Added validated `settings.home_sections` configuration for the ten implemented homepage sections without a new table or migration. Admin can reorder sections and toggle visibility while keeping at least one enabled; the public configuration endpoint returns only allowlisted section IDs.
- Storefront rendering and release-time SEO snapshots now apply the configured order and visibility, with a hidden level-one heading retained when the hero is disabled. The recently viewed section stays browser-local and is not embedded in static SEO output. Updated the OpenAPI contract, generated types, architecture ADR, and home UX spec. Storefront TypeScript, targeted ESLint, PHP Pint, OpenAPI generation, and Node syntax checks passed. The Admin typecheck still reports existing unrelated errors in campaigns and reports; no tests were run.

### Storefront best-seller audience tabs (2026-11-05)

- Added the public catalog's validated `target_gender` filter and wired the home best-seller rail to server-filtered Nam/Nữ tabs plus a Phụ kiện tab backed by the active accessories category slug. Tabs are keyboard-operable, retain their filter in the all-results link, and show an explicit empty state without inventing products.
- Updated the OpenAPI contract, generated types, API conventions, and homepage acceptance tracker. Storefront TypeScript, targeted ESLint, PHP Pint, OpenAPI generation, and Node syntax checks passed; no tests were run.

### Storefront featured category tiles (2026-11-05)

- Capped the home category rail at six real category/audience tiles. Nam/Nữ tiles use images from published products filtered by configured target audience; the accessories tile uses the active accessories category and its maintained image. Missing audience products do not create empty or fabricated tiles.
- Updated the homepage UX spec and implementation tracker. Storefront TypeScript and targeted ESLint passed; no tests were run.

### Storefront service strip facts (2026-11-05)

- Expanded the home service strip with address-based delivery fees, COD only when enabled, return-policy links only when a matching page is published, and support only when a store contact or contact page exists. Release-time SEO snapshots use the same public configuration/page metadata.
- Updated homepage acceptance notes. Storefront TypeScript, targeted ESLint, and Node syntax checks passed; no tests were run.

### Storefront horizontal product rails (2026-11-05)

- Converted home new-arrival and best-seller product rows to horizontal, snap-aligned rails with previous/next controls, keyboard-focusable tracks, touch/trackpad scrolling, and reduced-motion-aware scroll behavior. Raised each rail to eight results; release snapshots inherit the horizontal layout.
- Updated homepage UX notes and acceptance tracker. Storefront TypeScript, targeted ESLint, and Node syntax checks passed; no tests were run.

### Storefront route breadcrumbs and structured data (2026-11-05)

- Added shared visual breadcrumbs for product detail, account, checkout, tracking, CMS, brand-index, and authentication routes; catalog and collection-index pages retain their existing breadcrumb navigation. Category, collection, brand, and account trails use resolved route data when available.
- The same trail now emits Schema.org `BreadcrumbList` structured data, including on catalog pages. Targeted ESLint and Storefront TypeScript checks pass; no tests were run.

### Rotating storefront announcement (2026-11-05)

- Replaced the static announcement with two verified delivery messages and a COD message only when enabled. It rotates every seven seconds, exposes previous/next and pause/resume controls, stays dismissible with persisted browser preference, and does not claim promotions or unconfigured return/free-shipping terms.
- Updated the shared-shell UX spec and implementation tracker. TypeScript and targeted ESLint checks pass; no tests were run.

### Storefront campaign hero carousel (2026-11-05)

- The home hero now supports up to four active API banners with accessible previous/next and direct slide controls; it does not autoplay. Mobile-specific slides follow the same configured order, and hero videos use native controls, a poster, and a text description.
- Updated storefront home UX documentation and the full-spec tracker. Storefront TypeScript check passes; no tests were run.

### Published CMS links in storefront footer (2026-11-05)

- Added a throttled public endpoint that returns at most 100 published CMS page links using only title, slug, ID, and publication status. The storefront footer now fetches this list once, so newly published information pages are discoverable without requesting their content or exposing drafts.
- Updated the home/footer UX spec, full-spec tracker, OpenAPI contract, and generated API types. Pint and OpenAPI type generation pass; no tests were run.

### Anonymous storefront search trends (2026-11-05)

- Added public trend and search-submission endpoints. Only explicit submitted terms that match published products are aggregated by normalized term and UTC day; email, URL, phone-like and wildcard queries are skipped, and no user ID or IP is written.
- Search suggestions show terms with at least three submissions in the last seven days. Added a daily scheduled prune command for the 30-day retention window and disclosed the anonymous aggregation in the search UI.
- Added the new-table migration, ERD/data-model documentation, OpenAPI shapes and generated API types. Applied only the additive search-term migration to the connected local MySQL database; the unrelated avatar migration remains pending. Added a reproducible schema-only exporter and regenerated the 65-table SQL snapshot; the read-only schema audit matched all 65 tables and 602 columns. No tests were run.

### Storefront product search typo tolerance (2026-11-05)

- Product search now checks exact published-catalog matches first. Only when none exist, it evaluates a bounded set of published product candidates using normalized edit distance across product, brand, category, SKU, and active variant text; exact-search rules and other active filters remain in force.
- Near matches are limited to 100 and scored by distance for relevance sorting. Updated the API description and catalog acceptance notes. No tests were run.

### Published page search suggestions (2026-11-05)

- Added a bounded public search endpoint for matching published CMS pages; its Resource returns a page title, slug, and sanitized plain-text description, and never includes drafts or raw content HTML.
- Header search now fetches page suggestions alongside product suggestions, includes them in keyboard navigation and direct navigation to `/pages/:slug`, and offers independent retry when page search fails.
- Updated OpenAPI, generated API types, catalog UI guidance, and the full-spec tracker. Search-term trends and typo-tolerant product matching remain open P0 requirements. No tests were run.

### Storefront cart variant switching (2026-11-05)

- Cart responses now include active same-product variant choices with current server prices and stock. The full cart renders an accessible combined color/size selector and disables out-of-stock choices.
- `PATCH /api/v1/cart/items/{item}` accepts an optional `variant_id`; the API enforces same-product membership, active status, stock and per-variant quantity limits, recalculates the price, and merges into an existing matching line in the cart transaction.
- Updated OpenAPI, generated API types, cart behavior documentation, and the full-spec tracker. No tests were run.

### Storefront cart coupon offers (2026-11-05)

- Added `GET /api/v1/coupons/available`, which evaluates active offers against the canonical cart subtotal and the signed-in customer's usage limit, returns explicit eligibility reasons, respects legacy coupon expiry fields, and excludes inactive or out-of-window coupons. It rejects cart lines whose product or stock is no longer valid.
- Added an API-backed coupon list to the cart. Eligible offers populate the coupon field and use the existing server quote before carrying the code into checkout; ineligible offers show the server reason and remain disabled.
- Updated the OpenAPI contract, generated-client source inputs, and cart page acceptance notes. No tests were run.

### Production seeding behavior documented (2026-10-28)

- Reviewed AdminPermissionsSeeder: it only creates/updates API roles, permissions, and role mappings; DatabaseSeeder creates a super-admin only when both explicit credentials are configured. Confirmed current local runtime uses MySQL and Laravel 13.33.0. Added a production seed-data section to docs/architecture/deployment.md explaining that demo catalog/media/customers/orders are local/testing only and real catalog photography must be owner-approved.

### Production guard for demo catalog and order seeders (2026-10-28)

- CatalogSeeder, StorefrontDemoSeeder, and StorefrontOrderDemoSeeder now return outside local/testing, including when invoked directly; DatabaseSeeder only invokes them in local/testing. This prevents AI product/banner media, sample stock, demo customers, and demo orders from being seeded in production while retaining permission seeding and configured super-admin creation. Pint passed for all four changed PHP files. Updated docs/architecture/data-model.md. No database writes or test suite.

### AI-demo disclosure regression detection for photo-based media (2026-10-28)

- Extended audit-storefront-media.php to require the AI-demo prefix on alt text for versioned photo-based category covers, collection covers, and banners. PHP syntax check passed. Full read-only audits on fashion_store and fashion_store_uat_20261027 both report 0 photo-based assets missing disclosure, 0 duplicate demo category covers, 0 missing/invalid media, and 0 Storefront/Admin coverage failures. Updated the UAT checklist; no DB writes or test suite.

### Duplicate category-cover regression detection (2026-10-28)

- Extended audit-storefront-media.php to hash the seven expected demo category covers and fail when two referenced covers have identical bytes, preventing recurrence of the Trang phục/Áo duplicate. PHP syntax check passed. The full read-only demo-data audit passed on both fashion_store and isolated fashion_store_uat_20261027: 0 duplicate category covers, 0 missing or invalid media, 0 missing alt, 0 Storefront/Admin coverage failures, and 81 tables/730 columns match the SQL snapshot. Updated the UAT checklist. No tests or DB writes.

### Storefront canonical localhost origin and verification route (2026-10-28)

- Followed up the SEO origin check: port 5173 is bound on IPv6 loopback by the Storefront Vite process, so 127.0.0.1:5173 fails while localhost:5173 serves the app. GET /verify-email?verified=1 on the canonical localhost origin returned HTTP 200. This confirms the API sitemap/verification redirect origin is reachable in the current local setup; no verification token was submitted and no account data changed.

### Storefront SEO snapshot build against the UAT API (2026-10-28)

- Ran the production SEO build against the API on port 8001. A first run intentionally failed validation because the requested site origin (127.0.0.1:5174) disagreed with the origin emitted by the API sitemap (localhost:5173); no wrong-origin snapshots were accepted. Re-ran with the API-configured origin: build succeeded and prerendered 36 public routes. A read-only output scan found 36 HTML snapshots and all contain the configured origin. Release builds must set STOREFRONT_PRERENDER_SITE_URL to the deployed Laravel STOREFRONT_URL. No DB changes or test suites.

### Admin and Storefront API transport source audit (2026-10-28)

- Source search found no direct fetch calls in feature modules and no environment-specific API host strings outside the central API-base modules. Storefront requests use its shared Axios client; Admin requests/uploads use the shared admin-api transport, which owns request IDs, refresh handling, and upload progress. Both apps read VITE_API_URL with the same local port-8000 fallback and trim trailing slashes. This was a read-only source audit; no code or API contract changes.

### Storefront/API local runtime and deployment gate check (2026-10-28)

- Read-only HTTP checks against the existing UAT runtime returned 200 for API /up on port 8001, Storefront /register on 5174, and the new category-trang-phuc-photo-v2.webp media URL. Admin port 5173 had no listener. A temporary foreground Admin Vite session on 5175 served the sign-in page with HTTP 200; the browser accessibility tree showed the email/password controls and brand panel, and the console had no errors. No credentials were entered. The process was stopped after review and port 5175 is clear; authenticated Admin pages remain unreviewed. Nginx is not installed on this workstation; the example configs still need nginx -t after deployment-specific substitutions. No DB changes or test suites.

### OpenAPI clients and Admin/Storefront release builds (2026-10-28)

- Regenerated Admin and Storefront TypeScript clients from api/openapi.yaml with npm run api:types. ESLint completed successfully in both apps, and both production builds passed (TypeScript plus Vite). No test suite was run.

### Storefront media reproducibility and local demo-data re-audit (2026-10-28)

- assets:storefront:verify confirmed all 48 tracked generated assets reproduce with identical SHA-256 hashes after rendering. Image sizes, video dimensions/duration, and banner contrast checks completed successfully. audit:demo-data against the configured local database and, with a process-only DB_DATABASE override, the isolated fashion_store_uat_20261027 database confirmed schema parity (81 tables/730 columns), 0 Storefront/Admin coverage failures, and 0 missing/invalid media files, missing alt text, or legacy concept alt text. Both audits were read-only, made no application data writes, and no test suite was run. The separate UAT registration draft remains unsubmitted pending user password entry and form completion.

### Storefront duplicate and stale media correction (2026-10-28)

- The source-media review found that the active `Trang phục` and `Áo` category covers were pixel-identical and that the generated asset-review board still described real garment photos as brand graphics. Created a distinct cream-shirt/olive-cardigan/navy-trouser AI flat-lay for `Trang phục`, added its versioned source and renderer/manifest entries, updated `StorefrontDemoSeeder` to use the unique v2 file and descriptive AI-disclosed alt text, and updated only the matching category row in both `fashion_store` and `fashion_store_uat_20261027`. Also corrected stale collection `Hàng mới` and campaign-image alt text in both databases and in the seeder's legacy-alt migration allowlist. The asset renderer produced an 800×1000 WebP at 63,348 bytes; regenerated `storefront-assets-review.html` and the source-media contact sheet now show distinct imagery and accurate alt text. Actual Storefront/Admin rendered media review and owner approval are still open; no tests were run.
- The Storefront API on port 8001 returned the new category URL and alt; the new media URL returned HTTP 200. `npm run audit:demo-data` then passed read-only on both the configured local DB and isolated UAT DB: schema matched 81 tables/730 columns, all Storefront/Admin coverage checks were zero-failure, and the media audit found 0 missing/invalid files, 0 missing alt text, and 0 legacy concept alt text. PHP syntax and the two changed Node asset scripts also passed syntax checks; no test suite was run.

### Admin UI local startup check (2026-10-28)

- Started only the Admin Vite app on `127.0.0.1:5175`, explicitly pointed it at the already-running isolated UAT API on port 8001, and confirmed the sign-in page/brand panel rendered. The Admin app returned HTTP 200; no credentials were entered and no API-authenticated media screen was visited. Closed the temporary browser tab and stopped the Admin process; port 5175 is no longer listening. Authenticated Admin media rendering remains open because no usable UAT Admin sign-in credential is staged.

### Storefront category, collection, and campaign media inventory (2026-10-28)

- Reviewed a contact sheet of all 7 seeded category covers, 2 collection covers, 3 current banner image sources (desktop hero, mobile hero, campaign), and a frame from the campaign MP4. The garment/accessory subjects match their category/campaign use and are flat-lay/photo-style with no wearer, mannequin, or drawn illustration; visible source files carry an `Ảnh AI demo` badge. `ffprobe` reports the current campaign file as one 1280×720 video stream, 5 seconds, with no audio stream. Saved the sheet at `docs/qa/storefront-campaign-media-contact-sheet.jpg`. This checks source media only; rendered Admin/Storefront page coverage and owner approval remain open. No app data changed and no tests were run.

### Storefront product-photo visual inventory (2026-10-28)

- Inspected a contact sheet of all 19 product photos currently selected by `StorefrontDemoSeeder`: 16 apparel flat-lays and three accessory flat-lays. The visible garments/items are photographed-style standalone objects with no people, mannequins, or drawn illustrations. Saved the review sheet at `docs/qa/storefront-product-photo-contact-sheet.jpg` for owner review. This confirms visual content only: all generated images remain AI demo media, do not establish that an item matches real stock, and still require owner approval and replacement with actual inventory photos before production merchandising. No application data or assets were changed; no tests were run.
- Prepared another disposable registration draft in the running local/UAT Storefront at `http://127.0.0.1:5174/register`; API port 8001 is process-configured for `fashion_store_uat_20261027`. The exact `uat-registration-20261028@example.test` address was absent from that database before entry, and `/auth/registration-status` returned public registration enabled. The approved fake name/email are filled; no password, Terms acceptance, or submit action was entered. The draft remains open for the user to enter the new credential and complete the final signup step.

### Admin/Storefront OpenAPI client refresh (2026-10-28)

- Regenerated both TypeScript declarations from `api/openapi.yaml` with `npm run api:types`; the Admin and Storefront production builds passed against the generated clients. No API paths or request/response contracts changed in this refresh. No test suite was run.

### Storefront keyboard route and product-tab review (2026-10-28)

- Refreshed the read-only keyboard audit over 31 routes at 390px and 1440px (62 observations): every route completed a Tab focus cycle, with 0 runtime/server errors; Escape closed the mobile navigation, cart drawer, filter sheet, and size guide, returning focus to each trigger. Separately exercised product tabs with ArrowRight/ArrowLeft/Home/End at 320/390/768/1440px; focus and `aria-selected` remained synchronized and wrapped at either end. Authenticated account-specific interactions, valid keyboard-only checkout/order submission, and real screen-reader review remain open. Report: `docs/qa/storefront-keyboard-audit.json`.

### Storefront icon controls and media badge accessibility (2026-10-28)

- Replaced mobile-menu/search/wishlist/quantity text symbols with decorative Lucide SVGs and converted the delivery-strip separator to a CSS dot with no text node. Axe no longer reports label/name or separator-text incomplete results. Product information tabs wrap below 900px; checks at 320/390/768px confirmed every tab fits, and there are no tab targets. The latest scan covers 31 routes × 4 widths (124 observations), with 0 violations, 21 incomplete checks, and 0 runtime/server errors. The remaining 17 contrast-incomplete cases are limited to the authentication brand gradient and registration controls that axe cannot resolve through overlays. The contrast script verifies panel text at 6.10:1 and logo accent at 5.59:1; manual form-color calculations give body/helper/link/button pairs of 15.09:1, 5.39:1, 7.08:1, and 14.63:1. Four video-caption checks are manually classified as not applicable to silent video-only media with an equivalent text description. Manual viewport review confirmed discount labels do not overlap demo-image labels on five inspected cards. Storefront lint and production build passed; no test suite was run.

### Storefront theme palette contrast audit (2026-10-28)

- Ran `tools/quality/audit-storefront-theme-contrast.mjs` against all 14 appearance palettes in light and dark modes and the authentication panel's gradient samples. All palette text/link combinations meet 4.5:1, control boundaries meet 3:1, white panel text reaches 6.10:1, and its logo accent reaches 5.59:1 under a conservative overlay estimate. No contrast failures were reported; assistive-technology review remains open.

### Demo image disclosure contrast (2026-10-28)

- Changed the `Ảnh AI demo` badge from a translucent to an opaque `#fffdf9` background so its text contrast does not depend on the underlying product/category image. The `#302d28` text against `#fffdf9` calculates to 13.50:1; a rendered catalog view confirmed the badge remains clear and visually consistent. Refreshed the axe audit on 31 routes × 4 widths (124 observations): 0 violations, 21 incomplete checks, 0 runtime errors, and 0 server errors. Badge overlap was corrected for discounted demo-photo cards, and the latest audit has no badge or product-tab targets. Remaining 17 contrast-incomplete cases were manually checked against source colors and conservative gradient samples; full screen-reader review remains open. The 4 video-caption checks are manually classified as not applicable because the campaign video has no audio and equivalent text is available. Storefront lint and production build passed; no test suite was run.

### Storefront authenticated account keyboard review and autofill fix (2026-10-28)

- Extended the read-only keyboard review across account profile/email/password/session settings, order list/detail, address book, and wishlist. Tab order reached the expected navigation, links, fields, selectors, and actions; keyboard selection of a wishlist variant worked without adding it to the cart. The order detail now visibly presents the demo history in chronological order. No profile, order, address, wishlist, or session data was submitted or changed; a temporary local profile edit was discarded and the server still shows the original name.
- Found that Chrome autofilled a saved unrelated address into “Email mới”, making a clean form appear edited and opening a false unsaved-changes dialog. Disabled autofill and kept the field read-only until focus; switched the email form to stable default values and reset profile values from the account response. Browser UAT confirmed the new-email field stays blank when loaded/focused, clean navigation proceeds without a warning, and a real unsaved profile draft still prompts and can be discarded. Browser console had no warnings/errors. Targeted ESLint and Storefront production build passed; no test suite was run.
- The full mobile keyboard matrix and real screen-reader review remain open. A separate registration handoff is currently open on the Storefront form with only the approved synthetic name/email filled; a read-only lookup confirms that address has zero user rows. API and Storefront remain temporarily available on the isolated UAT database for the user to enter a password, accept Terms, and submit.

### Storefront demo order history chronology (2026-10-28)

- Fixed `StorefrontOrderDemoSeeder` so the historical delivered-order fixture backdates `placed_at`, each pre-delivery status-history event, `shipped_at`, and `delivered_at` consistently; completion events, when present, follow delivery by one day.
- Re-ran the idempotent seeder only against isolated `fashion_store_uat_20261027`. Read-back confirmed the seeded order's history is chronologically `pending` (2026-10-13 22:32), `confirmed` (23:32), `processing` (2026-10-14 00:32), `shipping` (01:32), and `delivered` (02:32), with `placed_at`, `shipped_at`, and `delivered_at` matching those events. PHP syntax and Pint checks passed; no test suite was run.

### Storefront order and address account pages (2026-10-28)

- Browser review found the order-history and order-detail components had no page-layout styles; order statuses were also shown as raw API values. Added responsive order cards/detail panels, a readable status timeline/review form, Vietnamese order/payment-status labels on account and public tracking pages, and high-contrast labels/focus styling.
- The saved-address list and address form likewise had no layout rules. Added responsive address cards, action controls, field grids, labels, and focus states without changing the address API flow.
- Verified the order list/detail and address page in Chromium at the available desktop viewport. Keyboard focus reached the skip link, navigation, every order link, address edit/delete controls, all enabled address fields, province selector, default checkbox, and submit button in order; no form was submitted. Browser console showed no runtime errors. Mobile visual review and the full authenticated account keyboard matrix remain open; no test suite was run.

### Storefront release status and registration handoff (2026-10-28)

- Updated the plan's current-status rows to match the 2026-10-28 evidence available at that time: axe scan of 31 routes × 4 widths (124 observations, 0 violations; first 157, then 85 incomplete items), silent-video text alternative, and keyboard smoke across 31 routes × 2 widths (62 observations). The newer audit at the top of this file records 21 incomplete checks after reducing contrast analyzer uncertainty. Remaining screen-reader review, authenticated account keyboard coverage, production deployment/performance, and store-owner approvals stay open.
- A second disposable registration draft was prepared on the local Storefront against isolated `fashion_store_uat_20261027`; only the approved synthetic name/email were entered. The browser policy requires the user to enter the temporary password, accept Terms, and submit themselves. The draft was not submitted; its temporary browser tab did not persist into the next turn, so the API/Storefront processes were stopped. No test suite was run.

### Storefront account email-change browser UAT (2026-10-28)

- Confirmed the user's registration decision: public customer registration defaults on in local/UAT and remains off in production unless explicitly overridden. The environment-aware default and `STORE_PUBLIC_REGISTRATION_ENABLED` override are already implemented and documented.
- On the isolated `fashion_store_uat_20261027` database, signed in to the demo customer in the Storefront browser, opened Account → Email, and submitted a change to a disposable `example.test` address. The UI confirmed that a verification link was sent and that the current verified email remains active until confirmation. The API used Laravel's local log mailer; no external mail was sent and the new address was not activated.
- Logged out through the UI, removed the exact pending email-change row from the isolated UAT DB, confirmed no pending request remained for the demo customer, stopped the temporary API and Storefront processes, and confirmed ports 8000 and 5173 had no listeners. Broader password/reset and other account browser UAT remain open. No test suite was run.

### Storefront registration browser UAT preparation (2026-10-28)

- Verified the isolated UAT API returns HTTP 200 with public registration enabled and opened the Storefront registration form. Entered only disposable `example.test` values locally; the final submit was not completed because it accepts the Storefront Terms of Use and explicit approval is pending. Confirmed no UAT account was created and stopped both temporary app processes; ports 8000 and 5173 are clear. The user decision to default registration on in local/UAT is already implemented; this is a separate browser-submission consent gate.

### Storefront profile form browser UAT (2026-10-28)

- Using the seeded demo customer and isolated UAT DB, changed the profile name to a disposable value and confirmed the Storefront displayed “Đã lưu hồ sơ.” Restored “Khách hàng demo” through the same UI and read the original value back from the DB. Logged out through the UI, verified no active refresh session and no disposable registration account, then stopped API/Storefront and confirmed ports 8000 and 5173 are clear. No test suite was run.

- On the isolated UAT DB, added a synthetic Hanoi address through the Storefront form and confirmed it appeared beside the unchanged default address. The address-delete action opened the browser-native `window.confirm` prompt on the earlier attempt; the UI has since been replaced with an app-native dialog. A fresh UAT browser run confirmed its heading, selected-address description, Keep/Delete actions, Escape behavior, focus return to the delete trigger on cancel, successful deletion, and focus return to the address-book heading after deletion. Changing province/ward preserved entered recipient, phone, and street values. Removed the disposable address through the UI; the original default address remains. API and Storefront processes were stopped; ports 8000 and 5173 are clear. Other account forms remain open; no test suite was run.

### Storefront address deletion confirmation UX (2026-10-28)

- Replaced address deletion's browser-native `window.confirm` with a modal `<dialog>` in the Storefront. The dialog names the selected recipient and street, supports Escape and an explicit cancel action, keeps focus within the modal via native `showModal()`, returns focus to the trigger on cancel/Escape, moves focus to the address-book heading after successful deletion removes that trigger, shows deletion errors in the dialog, and disables both actions while the API request is pending. Account UI spec updated.
- A fresh browser retest could not reach the address page: the temporary session remained on the login form without a visible API/form error, while the isolated demo account is still active and its documented local credential hash is valid. No address or account data changed during this attempt; all temporary API/Storefront processes were stopped, the original address remains, and there are no active refresh sessions. Manual verification of the new modal and delete-success focus remains open; no test suite was run.
- Storefront production build (`rtk npm run build`) initially caught an unused `useState` import in `AddressBookPage.tsx`; after removing it, TypeScript and Vite production build succeeded. No test suite was run.

### Storefront auth-form browser review (2026-10-28)

- Reviewed the login, registration, and forgot-password forms in the Storefront against the isolated UAT API. Empty login displayed email/password errors and focused the email control; empty registration displayed name/email/password/confirmation/terms errors and focused the name control. The registration password-strength guidance and terms checkbox were visible and labeled; forgot-password showed its email field and submit action. No account was created, no mail was sent, and no credentials were entered. Stopped the temporary API and Storefront processes; ports 8000 and 5173 have no listeners. Auth reset submission and authenticated account-form browser UAT remain open. No test suite ran.

### Storefront/Admin fixture and media audit (2026-10-28)

- Re-ran the read-only `npm run audit:demo-data` against the currently configured local database. The schema matches `fashion_store_schema.sql` across 81 tables and 730 columns; Storefront fixture, Admin fixture, and media checks report zero failures. Confirmed 19/19 active products have variants, thumbnails, galleries, and disclosed AI-demo photo references; 19/19 AI product photos have matching disclosure in alt text. The audit also found 3 banners (including one video source), 7 category images, 2 collection covers, 6 published pages, 108 active variants with inventory, and one pending AI-demo review-image fixture. No owner-provided product photos are present. The audit is read-only and changed no database rows or assets.

### Demo customer login readiness coverage (2026-10-28)

- Extended `audit-storefront-api-demo-data.php` to report/fail `demo_customer_login_ready` unless the seeded customer is active, verified, has the customer role, and its password hash matches the effective environment credential. The checker mirrors the seeder's `StoreDemo123!` fallback only for `local`/`testing`, never prints a credential, and requires an explicitly configured password in other environments. `php -l` and Pint passed; re-ran `npm run audit:demo-data` against `fashion_store_uat_20261027`: `demo_customer_login_ready=yes`, Storefront/Admin audits each had zero failures, schema matched 81 tables/730 columns, and media had no missing/invalid files. Read-only audit; no DB rows changed. No test suite ran.

### Storefront review moderation disclosure UAT (2026-10-28)

- On the isolated UAT database, the existing review fixture is linked to a delivered customer order. Admin review list/detail returned HTTP 200; detail returned the pending status and explicit AI-demo image alt text saying it is not a customer-submitted photo. The public product review endpoint returned no pending review. No review or fixture was changed. One exploratory Admin login token that was not covered by logout was identified by its UAT row ID and removed with its linked refresh token; all later Admin sessions were logged out. Stopped the temporary API; ports 8000, 5173, and 5174 have no listeners. A fresh review submission and UI moderation action remain open. No test suite ran.

### Storefront review submission and moderation UAT (2026-10-28)

- On the isolated UAT database, replaced the existing pending review fixture only for the duration of this API flow. A delivered-order customer submitted a review through `POST /api/v1/reviews` (201, pending); Admin API detail returned the pending review (200), the Admin status endpoint approved it (200), and the public product-review endpoint then included it. During an earlier read-only detail check, Admin `ReviewResource` returned the demo review image with explicit AI-demo/not-customer-submitted alt text, and the public endpoint omitted the pending review. The fixture was fully restored afterward: original review status and image row are present, temporary review/activity rows are absent, product rating values and demo-customer password hash were restored, and no recent active access/refresh token remains. Removed the temporary UAT script, stopped API, and confirmed ports 8000/5173/5174 are clear. Storefront submission and Admin moderation UI visual review remain open. No test suite ran.

### Storefront SEO local release build (2026-10-28)

- Ran `npm run build:seo` against the isolated `fashion_store_uat_20261027` API with Storefront origin `http://localhost:5173`. TypeScript and Vite production build succeeded; prerender generated 36 public route snapshots, and an independent file count confirmed 36 HTML files. The API sitemap returned 35 locations on the same localhost origin; the prerender adds the home snapshot. The production API/origin build and production-host checks remain open. Stopped the temporary API and confirmed ports 8000, 5173, and 5174 have no listeners. No test suite ran.

### Storefront customer account browser UAT (2026-10-28)

- In the local `fashion_store` environment, confirmed the demo customer is active, email-verified, and its hash matches the documented local sample credential without printing or changing the password. Browser sign-in succeeded; a full reload restored `/account` through the refresh cookie. Read-only inspection covered profile/email/password/session sections, the saved default Hanoi address, wishlist product and AI-demo disclosure, and delivered-order details with approved and pending review states plus the demo return request. Logout redirected to login; read-only DB inspection found no recent access token or active refresh token. No customer/order data was changed, then API and Storefront were stopped and ports 8000/5173/5174 were confirmed clear. Correction: the isolated UAT DB also has `APP_ENV=local`, so despite the unset `STORE_DEMO_CUSTOMER_PASSWORD`, its seed used the local `StoreDemo123!` fallback and its hash matches that credential. The earlier HTTP 422 was caused by the UAT request sending a null password. The review-flow script temporarily changed the UAT hash and restored it exactly. A real `APP_ENV=uat` seed must set a unique password. Browser account mutations, profile/email/password submission, and full route/accessibility review remain open. No test suite ran.

# Registration defaults and UAT (2026-10-28): recorded the owner decision to enable public customer registration by default in local/testing/UAT while leaving production off by default. Added `FR-AUTH-005`, environment-aware API config and consistent status/register fallbacks, an explicit `STORE_PUBLIC_REGISTRATION_ENABLED` override, and updated the auth spec, security docs, OpenAPI description, Storefront plan, and UAT checklist. Isolated UAT DB had no saved override; `/auth/registration-status` returned true, Storefront registration rendered, a disposable registration returned 202 and logged a signed verification link, verification returned 302 and set `email_verified_at` while keeping `pending_approval`. The test account and role link were removed. A temporary saved false setting made the API status return false and was then removed. Laravel config showed production default false and explicit env override true. Temporary API/Storefront servers stopped and ports are clear. Other release UAT gates remain open. PHP syntax/config checks passed; no test suite was run.

### Storefront account API UAT and wishlist fix (2026-10-28)

- On the isolated UAT database, a disposable customer successfully updated and read back their profile, created/edited/deleted a Hanoi address, added/listed/re-added/removed a wishlist product, and merged a guest cart into their customer cart with the expected quantity. Wishlist add initially returned HTTP 500 because Laravel auto-added `updated_at` to the pivot insert even though `wishlists` only defines `created_at`. The controller now uses `insertOrIgnore` to add the unique join row with `created_at` only; repeat UAT returned 201, duplicate add kept one row, and remove returned 200. Address, cart item/cart, wishlist row, role link, refresh/access sessions, and user were removed after the checks. Pint and PHP syntax checks passed; no test suite ran. Customer password/email changes, admin registration approval, and browser account mutations remain open.

### Customer credential change UAT (2026-10-28)

- On the isolated UAT database, a disposable customer changed password successfully; login with the old password returned 422 and login with the new password returned 200. Email-change request preserved the current email while pending; after processing only this account's queued notifications through a temporary queue and local log mailer, the one-time confirmation link returned 302, `/auth/me` showed the new verified email, and the pending-email row was consumed. Password-change and old-email security notifications were also recorded locally. The disposable user, role, activity records, access/refresh tokens, and pending-email records were removed. The unrelated 76 queued jobs were left untouched; API process stopped. No test suite ran. Admin approval and browser credential forms remain open.

### Registration approval UAT (2026-10-28)

- On the isolated UAT database, an unverified disposable registration could not sign in (HTTP 422); after email verification it remained blocked pending owner approval (HTTP 422). The seeded local super admin signed in through the Admin API and approved the user as `customer` (HTTP 200); Storefront login and `/auth/me` then returned HTTP 200 with the customer role. Both temporary sessions were logged out, the disposable account/role/session rows were removed, and the API server was stopped. The existing unrelated queue backlog was untouched. This verifies the Admin-to-Storefront approval API flow; browser approval remains open. Customer account deletion was subsequently verified in a separate UAT entry below. No test suite ran.

### Customer account deletion UAT (2026-10-28)

- On the isolated UAT database, `DELETE /api/v1/account` with the correct current password returned 200, soft-deleted the customer, removed access tokens, revoked refresh tokens, and made the active bearer token return 401. Inspection showed the soft-deleted row still retains email, name, password hash, and role links; no purge/anonymization occurs. The disposable record, role, and related activity/session rows were hard-removed after inspection. Temporary API server stopped. The behavior is now documented in auth/privacy notes; owner approval of production retention and Storefront privacy copy remains open. No test suite ran.

### Customer password recovery UAT (2026-10-28)

- On the isolated UAT database, a disposable customer received the non-disclosing forgot-password response and the reset email through the local log mailer. The signed reset token was accepted once by the reset endpoint, the new password matched the stored hash, and the reset-token row was removed. The disposable customer and role link were deleted, and the API server was stopped. This covered the API and mail-link path; browser form interaction and login with the reset password remain unverified. No test suite was run.

### Current Storefront/Admin demo data audit (2026-10-28)

- Ran the read-only `npm run audit:demo-data` against the currently configured `fashion_store` database. The schema matches `fashion_store_schema.sql` across 81 tables/730 columns; Storefront coverage, Admin fixture coverage, and local media reference checks all report 0 failed checks.
- Current data includes 19 active products with variants, galleries, and disclosed AI-demo apparel photos; 3 banners including 1 video; 7 category images; 2 collections; 6 required public pages; and a disclosed pending AI-demo review image. There are still 0 owner-provided product-photo pairs, so actual shop photography and owner acceptance remain a production gate. Audit was read-only; no database writes occurred.

### Storefront responsive DOM accessibility spot-check (2026-10-28)

- Manually inspected 7 public/auth entry routes at 320, 390, 768, and 1440px (28 route/viewport observations) in Chromium. The rendered pages had one main landmark, an H1, named buttons/links/form controls, and alt attributes on all images; no horizontal overflow or browser JavaScript errors were observed. Guest refresh requests returned the expected 401. This is a DOM heuristic spot-check, not an axe/WCAG audit or screen-reader review; authenticated account routes remain unreviewed.
- The audit ran against the current local API `.env` database `fashion_store`, not an isolated UAT database, and used a temporary process-only API request-limit override to avoid throttling while checking page layouts. No account/order/inventory data was changed. Deleted only the nine empty ownerless carts created by these browser sessions (IDs 300–308), after verifying all had zero items. Stopped API/Storefront processes; `.env` was unchanged. No test suite was run.

### Storefront campaign evidence and release build (2026-10-28)

- Synchronized the implementation plan and UAT checklist with the campaign-video browser evidence: keyboard playback succeeded and an MP4 failure rendered the poster at 390px without horizontal overflow. The broader visual media matrix remains open.
- Re-ran `npm --prefix storefront run lint` and `npm --prefix storefront run build`; both succeeded. The production build completed TypeScript compilation and emitted the Vite bundle. No test suite was run.

### Expanded Admin/Storefront media UAT and preference fix (2026-10-28)

- On isolated UAT, Admin rendered every visible image on `/products` (20 total including the brand mark), `/categories` (1), `/collections` (3), `/banners` (4), and `/pages` (1). The campaign video preview loaded metadata and decoded at 1280×720 with no media error.
- The same session exposed account preference writes returning 422 because Laravel's wildcard `distinct` compared column IDs across separate tables. Updated `UpdateAccountPreferencesRequest` to enforce uniqueness within each table. Repeated the Admin route review; no preference validation errors remained. Pint passed on the changed Form Request.
- Admin row checkbox review confirmed normal selection, Shift range selection, and Space-key toggle; no React controlled-checkbox warnings or failed requests remained. Only the initial unauthenticated refresh returned the expected 401.
- Storefront home selected the mobile hero at 320/390px and desktop hero at 768/1440px; all checked hero/category images loaded and document width matched each viewport. No media/network failures occurred. The campaign poster loaded; its video was intentionally not auto-started. Admin video preview was separately decoded successfully.
- `npm run build:seo` succeeded against the isolated UAT API with the matching `http://localhost:5173` site origin, generated all 36 public route snapshots, and the static `ao-so-mi-linen` page contains the new generated-v4 image URL. This is local UAT evidence; the release build still needs the public production API/site origins.
- Stopped the API, Admin, and Storefront servers; disabled UAT user 21 and revoked its refresh tokens. No test suite was run.

### Storefront campaign-video interaction UAT (2026-10-28)

- In an isolated Chromium session, keyboard Space started the campaign video from the native controls; the player reported 1280×720 metadata, `paused: false`, and no media error.
- In a separate 390px viewport, deliberately blocked the campaign MP4 request. The `onError` fallback removed the video element and rendered the API poster with its descriptive alt text; the document remained 390px wide with no horizontal overflow.
- Deleted only the two newly created empty guest carts (IDs 34 and 35) after confirming both were ownerless and had no cart items. Stopped the temporary API/Storefront servers. No test suite was run.

### Admin media browser UAT fixes (2026-10-28)

- In an isolated Chromium session against `fashion_store_uat_20261027`, the Admin products page rendered all 19 product images (800px source images); the banners page rendered all 3 banner thumbnails (desktop 1600px, mobile 720px, campaign 1200px). The campaign video file was requested successfully by the browser. No Admin content was edited.
- Fixed account preference sync rejecting an intentionally empty `menu_layout.hidden` array by requiring the key's presence when `menu_layout` is supplied. Browser UAT then confirmed `PUT /account/preferences` returned 200.
- Fixed the banners list sending `q=` when the search field is empty; Laravel converts it to null, which failed string validation. The UI now omits blank `q`; the banners API returned 200 and all three banners rendered.
- Fixed the shared Admin table's row-selection checkbox using `checked` with `onClick` but no `onChange`. A later isolated Chromium review of `/products` selected rows normally, selected a range with Shift, toggled with Space, and recorded zero `checked` warnings or failed requests. Screen-reader review and the rest of the Admin media matrix remain open. Temporary API/Admin servers were stopped; the UAT content-editor account was set inactive and its refresh tokens revoked. No test suite was run.

### Photorealistic apparel demo images (2026-10-28)

- Created 16 distinct photorealistic flat-lay AI concept images for the 16 apparel products (no people, mannequins, illustration, text, or logos). Kept the 3 accessory images as-is. Added versioned WebP originals at 1024px plus 640px and 360px responsive derivatives (48 files; about 3.7 MB total); earlier image files remain intact.
- Updated `StorefrontDemoSeeder` to select the new apparel images. In `fashion_store_uat_20261027`, reran the demo seeder and confirmed product records now point to the new media. The Storefront detail for `ao-so-mi-linen` loaded the new image at 1024×1024 with 640/360 srcset choices and kept the visible AI-demo disclosure and descriptive alt text. No failed image/media requests occurred; the one unauthenticated refresh call returned the expected 401.
- The full `npm run audit:demo-data` then found five 640px derivatives above the repository's 80 KiB ceiling. Re-encoded those files; rerunning the audit passed with matching schema (81 tables/730 columns), 19/19 products with disclosed media, and zero failed media/data checks. The 640px derivatives now meet the size rule.
- These are photorealistic generated examples, not photos of verified store inventory. Product-owner approval or real store photos are still needed before representing them as actual merchandise. No test suite was run.

### Authenticated Admin media API UAT (2026-10-28)

- On `fashion_store_uat_20261027`, created a temporary verified `content_editor` with only catalog/content permissions. Admin login, `/admin/auth/me`, product, category, collection, banner, and CMS-page reads all returned HTTP 200: 19 products, 7 categories, 2 collections, 3 banners, and 6 pages.
- The Admin product payload returned the responsive product image and explicit AI-demo alt text; category media included its descriptive graphic alt; banner records included the campaign image and video URL. No Admin write endpoint was called. Admin logout returned 200; both temporary users named `Codex UAT media reviewer` were disabled and all their refresh tokens were revoked.
- Stopped the temporary API/Admin processes and confirmed ports 8000 and 5174 were closed. This verifies authenticated API connectivity and payload shape, not the Admin's rendered media previews; screen-reader review is still open. No test suite was run.

### Storefront/Admin integration smoke UAT (2026-10-28)

- Started API with `DB_DATABASE=fashion_store_uat_20261027` plus the Admin and Storefront Vite apps for a read-only runtime check. Both frontend roots returned HTTP 200; Storefront products, categories, and banners endpoints each returned HTTP 200.
- The product payload included responsive image URLs and alt text disclosing `Ảnh AI demo`; the banner payload contained three entries, including the campaign video. This confirms the public API-to-Storefront media payload is connected. Admin API actions were not exercised because this pass did not authenticate.
- Stopped all three temporary processes and confirmed ports 8000, 5174, and 5173 no longer responded. No database writes or test suite runs were made. The full Admin visual/media and screen-reader reviews remain open.

### Storefront product-to-checkout keyboard UAT (2026-10-28)

- In isolated browser UAT, keyboard-only navigation moved from skip link/main content through product variant selection, Add to bag, cart drawer, quantity controls, and checkout. Selecting Natural + S announced 11 available units; adding the item and increasing quantity showed the API-updated 1,380,000 VND subtotal. Escape closed the drawer and returned focus to its trigger.
- Checkout focus order reached all delivery fields, location selectors, coupon, note, quote, and order button. Keyboard selected Hanoi and a ward; server quote showed 30,000 VND shipping / 1,410,000 VND total. Pressing Enter with required fields blank created no order, displayed inline errors, and moved focus to recipient name. No code defect was found in this path; an AX snapshot labels native-select options as disabled while open, although keyboard selection works and produces the correct stock/address quote.
- Removed the only test product line, verified orders/payments/inventory movement/reserved stock were unchanged, and removed empty guest carts 29/30 after confirming they were ownerless. Stopped API/Storefront UAT processes. Remaining account/mobile/full-route keyboard, screen-reader, valid browser order, Admin media, production, and owner approval reviews remain open; no test suite was run.

### Checkout rejection-path UAT (2026-10-28)

- On the isolated UAT DB, separate manual API probes returned 422 for insufficient variant stock (11 available, requesting 12), a ward from another province, and an invalid coupon. After the corrected probes, order/payment/item/coupon-use counts and inventory movement/quantity/reserved totals exactly matched the pre-probe baseline (14/14/14/3/30; 1,298 on hand, 4 reserved). All three probe carts/items were removed.
- The first address probe accidentally used a valid Hà Nội ward and created one synthetic pending order. I identified it immediately, removed its queued confirmation job, restored the exact inventory reservation, deleted the test order, and confirmed the baseline before rerunning with the Cao Bằng ward. No real customer data was used; no test suite was run.

### Storefront media and public CMS UAT (2026-10-28)

- Read-only audits against `fashion_store_uat_20261027` again confirmed the 81-table/730-column schema match, 19 active products with individual disclosed AI flat-lay photos, 3 banners (1 video), 7 category images, 2 collection covers, 6 published CMS pages, 11 required UI illustrations, and zero missing media/alt/dimension/format checks.
- Browser review on an isolated API/Storefront stack confirmed the home campaign is clearly branded as abstract artwork, while a product detail shows a realistic linen-shirt flat-lay without a model and carries the visible `Ảnh AI demo` disclosure plus explanatory alt text. Public about, shipping/returns, contact, privacy, terms, and size-guide routes loaded their API content; several pages explicitly identify sample copy or measurements that still need owner approval. Browser console had no warning/error entries during the review.
- The browser created empty guest carts 21/22 in the isolated UAT database; confirmed both had no owner or items, removed only those rows, and verified both IDs were absent. Stopped temporary API/Storefront servers; production photography, Admin visual media, responsive crop/video controls, account flows, screen-reader, and owner approval remain open. No test suite was run.

### Admin timezone and onboarding UAT fixes (2026-10-28)

- Admin dashboard date filters, query boundaries, and revenue chart buckets now use the signed-in admin profile timezone (with the app timezone as fallback). The `/admin/auth/me` response includes that timezone and OpenAPI-generated frontend types are synced. In isolated UAT, the dashboard connected successfully, included the local 28/10 date, and the “Hôm nay” filter returned the expected day.
- Fixed admin onboarding snooze/skip preferences accepting an empty `completed` array. Previously the API rejected it as `validation.required`, so the one-hour snooze did not persist. Browser UAT verified “Tạm ẩn hướng dẫn trong 1 giờ” closes the prompt and remains dismissed after reload.
- API Pint and PHP syntax checks passed; Admin production build passed. The configured local database was not used for this browser session. Logged out the demo staff user and stopped temporary API/Admin servers. No test suite was run.
- The demo staff account can view the dashboard and product list; product detail correctly returns 403 for its role. Authenticated Admin media and privileged workflows remain open; see `docs/qa/storefront-release-uat-checklist.md`.

### Storefront announcement strip and keyboard spot-check (2026-10-28)

- Fixed the shared Storefront announcement strip: its grid layout treated the text around the separator as separate grid items, placing the shipping and COD messages on two lines and letting the second overlap the header. A centered, nowrap flex row now keeps both messages together; the Storefront home/CMS visual check confirmed the strip is one line.
- On the catalog, the first Tab reached the skip link, Enter focused `#primary-content`, Tab traversal reached the price filter, and the brand filter opened with Enter then closed with Escape while returning focus to its trigger. The public shipping page rendered the configured 7-day return information. Console warnings/errors: none.
- This was a browser review against the isolated UAT database. `GET /cart` created two empty guest carts; both were confirmed to contain no items and removed afterward. No form, order, or inventory change occurred. Full mobile/account/checkout keyboard review and screen-reader UAT remain open; see `docs/qa/storefront-release-uat-checklist.md`.
- Continued the desktop review on `/track-order`: labels, submit action, and keyboard focus render. A no-match lookup using only fabricated `FS-UAT-NOT-REAL` and `uat-no-order@example.test` data exposed a blank alert because the API's 404 `message` is empty. Shared API error extraction now ignores empty strings, and the tracking page provides a clear 404 message; the rebuilt page showed “Không tìm thấy đơn hàng. Hãy kiểm tra lại mã đơn và thông tin liên hệ.” as a visible `role="alert"`. Storefront production build passed. The isolated UAT database created two empty guest carts in each review session (IDs 17–20); all four were verified to contain zero items and removed. Stopped temporary API and Storefront processes; ports 8000, 5173, and 5174 have no listeners. No real order/contact data or inventory was changed. No test suite was run.
- `npm --prefix storefront run build` passed after the CSS change. No test suite was run.

### Read-only Storefront and Admin entry-screen browser review (2026-10-28)

- Temporarily started the API, Admin, and Storefront after checking the local environment points to `APP_ENV=local` and database `fashion_store`. API `/up`, Storefront `/`, and Admin `/` each returned HTTP 200.
- Read-only browser review confirmed the Storefront home renders API-backed category/collection media, product rails, campaign media controls, and newsletter. The `ao-so-mi-linen` detail renders its flat-lay product photo with an explicit AI-demo disclosure, product data, and variant controls. The Admin login form and brand panel rendered. No credentials were entered and no forms were submitted.
- The Storefront browser console showed no warnings or errors during this review. Stopped all three temporary processes and confirmed ports 8000, 5173, and 5174 refuse connections. No test suite was run and no database mutation was made.
- Re-ran the read-only `npm run audit:demo-data` after browser review: schema snapshot still matches (81 tables/730 columns); Storefront API, Admin API, and media audits each report 0 failed coverage checks. All 19 active products have disclosed AI-demo images, and 0 color pairs have owner-provided photos.
- Re-audited the isolated `fashion_store_uat_20261027` Admin demo dataset without writes: 9/9 roles, 26/26 permissions, all required workflow fixtures, and 0 failed coverage checks. Re-ran `npm run assets:storefront:verify`: 30 generated assets reproduced with identical SHA-256 hashes; banner text contrast measured at 5.15:1–5.21:1. The verifier exited successfully; Chrome emitted unrelated missing-extension-registry diagnostics during headless rendering.
- Authenticated Admin media, full CMS/media review, account/order mutations, accessibility, and production checks remain open; see `docs/qa/storefront-release-uat-checklist.md`.

### OpenAPI client sync and frontend release builds (2026-10-28)

- Regenerated Admin and Storefront TypeScript clients from `api/openapi.yaml` using `npm run api:types`.
- Admin and Storefront lint both passed. Both production builds passed (`tsc -b && vite build`); Admin also regenerated its third-party license notice file as part of the build.
- This verifies current API type generation and frontend compilation only. No test suite or authenticated Admin workflow was run.

### Read-only responsive Storefront review (2026-10-28)

- Ran a separate headless Chromium review after temporarily starting the local API/Admin/Storefront stack. Public Storefront home and a garment-only AI-demo product detail rendered; product photos loaded with visible demo disclosures, and all home media loaded after scrolling. The campaign video poster rendered.
- At 320, 390, 768, and 1440 CSS px, the home page document width matched the viewport. The product detail had no horizontal overflow at 390 CSS px. No non-auth HTTP errors or page errors appeared; one guest refresh request returned HTTP 401 while restoring an unauthenticated session.
- Admin login, authenticated Admin media, account flows, CMS routes, keyboard-only traversal, and screen-reader review remain open. Stopped the temporary stack and verified ports 8000, 5173, and 5174 are closed. See `docs/qa/storefront-release-uat-checklist.md`.

### Report and workflow follow-up (2026-10-28)

- Fixed payment summary aggregation to include legacy `refunded` payment rows without a `payment_refunds` record while still summing recorded partial/full refunds when present.
- Product revenue reporting now retains order-item name snapshots when a historical item no longer has a linked `product_id`; category/brand filters still use the linked product when supplied.
- Made settings audit field ordering deterministic in request order while retaining the privacy behavior of recording field names only.
- Updated API fixtures to require an approved return request before stock receipt, supply the required review rejection reason, and use a `super_admin` actor for the last-admin protection scenario.
- Pint and PHP syntax checks passed for the modified API files. No tests were run after these changes; API behavior remains unverified until an explicitly authorized verification run.
- The temporary API/Admin/Storefront stack was started for the approved browser checklist and stopped after the Windows browser tool could not determine the active Chrome URL safely. Ports 8000, 5173, and 5174 are not listening.
- Re-ran the read-only demo-data audit on the configured local database: schema matches `fashion_store_schema.sql` (81 tables/730 columns); Storefront and Admin demo-data coverage each report 0 failed checks; media audit reports 0 missing files/alt text, invalid dimensions/formats/sizes, or missing demo-media records. All 19 active products have disclosed AI demo photos. No data was modified by the audit.

### Storefront S7.4 unit tests, S7.5 E2E, and garment flat-lay media (2026-10-28)

- `npm run test:unit` initially exposed two test-harness gaps: Vitest collected Playwright specs and Testing Library trees were not cleaned between cases. Vitest now includes only `src/**/*.test.{ts,tsx}` and shared setup calls RTL `cleanup()`. The catalog API test retains MSW coverage and handles the jsdom cross-origin OPTIONS preflight and credentialed GET response with explicit CORS headers.
- The unit suite now passes all 6 files / 13 tests. It covers money formatting, variant selection, checkout form validation, catalog URL state, product reviews, and catalog API query parameters.
- Replaced the catalog demo-photo batch with 19 realistic garment/accessory-only AI flat-lays; none contains a wearer, mannequin, or illustration. Each has 800/640/360 WebP variants (57 files, about 2.0 MB total). The seeder maps each active demo product to a matching flat-lay and retains an explicit disclosure that generated photos are not verified stock photos. Updated the local media review board to show the replacement batch.
- `npm run test:e2e` completed with all 9 tests passing on a disposable MySQL database: COD order and tracking, signed-in guest-cart merge, stock-conflict form retention, and six read-only Storefront smoke cases. The first runs exposed duplicate locators and the public API's 60-request/minute limit; the test uses unambiguous role/text selectors and the temporary test API alone used a 600-request/minute limit. The production setting was not changed.
- `npm run test:unit` passed all 6 files / 13 tests; Storefront `npm run lint`, `npm run build`, and Pint for `StorefrontDemoSeeder.php` passed. API and Storefront processes were stopped afterward; the disposable `fashion_store_e2e_20261028_01` database was removed, and ports 8000/5173 are closed. Idempotent replay/concurrency, screen-reader coverage, device/production performance, and owner approval of generated photos remain open.

### Admin relative media URLs across catalog, settings, and reviews (2026-10-28)

- Source review found API-returned relative media paths were rendered directly in brand/collection rows, category/brand/collection upload previews, store logo/favicon/Open Graph previews, and review attachment/zoom images. Those previews now resolve against the configured API origin through the shared `mediaUrl` helper; submitted field values remain unchanged.
- A deeper pass also found that the product-create wizard could receive API-relative image URLs. Its gallery and primary-image previews now resolve API paths while preserving local file blob previews and original payload values.
- Updated `docs/ui-ux/page-specs/admin-store-operations.md` to describe the shared behavior. A follow-up source search found no remaining raw API image URL bindings in those target surfaces; local object-URL previews, generated QR data, and already-normalized branding/print URLs remain intentionally direct.
- `admin` `npm run lint` and `npm run build` completed successfully. No test suite or browser session was run; visual Admin media UAT remains open.

### Cart and checkout monetary display uses API prices (2026-10-27)

- Source review found Storefront cart lines and the header cart drawer multiplied cached client `product.price × quantity` even though `/cart` already returns authoritative `line_total`; checkout line rows had the same issue despite `/checkout/preview` returning quoted line totals.
- Cart mapping now keeps API `line_total` with the quantity it priced. Cart rows and drawer subtotal use those API values only while the displayed quantity matches; otherwise they show a synchronization message. Cart subtotal aggregation sums server-provided line totals rather than recalculating unit prices.
- Checkout rows now match API quote items by `variant_id` and quantity and display `line_total`; before a matching quote arrives they show “Chờ báo giá”. The checkout spec records both invariants; browser/build verification for this edit remains open. No test suite or frontend check was run.

### Storefront browser review: responsive hero and product photo disclosure (2026-10-27)

- Resumed the authorized local browser review against the isolated UAT database and confirmed the Storefront home page, 19-item catalog, and a denim-jacket detail page render API-backed content. The product detail displays the flat-lay jacket and a compact AI disclosure beside the image.
- At the narrow tablet viewport, the home hero title crowded the campaign image. Changed the 621–960px layout to use bounded flexible columns, horizontal padding, and a fluid heading size; visual review shows the copy now stays in its own column.
- Catalog review confirmed generated flat-lay garments render without wearers or illustrations and the cards visibly announce `Ảnh AI demo`. It also exposed a disclosure-badge CSS collision: the generic `.art > span` positioning stretched the pill into a large white oval that covered clothing. Added a more specific reset for its bottom/right constraints and text color; browser review now shows a compact readable pill at the top of each image and the full garment remains visible.
- `npm run lint` and `npm run build` in `storefront/` both completed successfully after the CSS changes. The temporary local API (bound to 127.0.0.1 and pointed at the isolated UAT database) and Vite server were stopped after browser review; ports 8000 and 5175 no longer listen.
- Re-ran `npm run audit:demo-data`: the SQL snapshot still matches 81 tables/730 columns, Storefront/Admin/media report zero failed coverage checks, and all 19 active product images retain AI disclosure. The audit found no owner-provided product photos, so the production-photo gate remains open.
- Reviewed the current Admin product-media client wiring: `ProductImagesPage` reads product details and colors through `adminApiFetch`, uploads through the shared `adminApiUpload`, and derives its `Ảnh AI demo` badge from the API alt text; product detail uses the same API media URL helper. This verifies source-level integration only. Authenticated Admin media rendering/upload still needs browser UAT.
- Additional read-only keyboard spot-check: opened the catalog filter dialog and confirmed Escape closes it. The full keyboard checklist (including tab order/focus return, checkout, and account routes) remains open. Stopped the temporary UAT API/Vite processes after the check and verified ports 8000 and 5175 have no listening process.
- The image assets themselves are unchanged. These are still disclosed AI demo concepts, not store-verified stock photographs. The product-photo/Admin media review, end-to-end browser checkout, full accessibility review, owner UAT, and production gates remain open. No test suite was run.

### Storefront optional authentication and order-lifecycle UAT (2026-10-27)

- Manual UAT first exposed that public cart/checkout routes ignored a supplied Storefront Bearer JWT. A signed-in cart therefore became a guest cart and checkout could not bind the order to the customer, preventing owner-scoped cancellation/return requests.
- Added `OptionalStorefrontAuthentication` to public cart and checkout routes. Missing credentials retain guest behavior; supplied credentials must resolve to an active, revocable Storefront session. Invalid/revoked credentials return 401 and Admin-audience credentials return 403 instead of falling back to a guest cart.
- Updated OpenAPI optional-auth declarations, generated Admin/Storefront API types, API/auth/security/checkout documentation, and checkout acceptance criteria.
- On isolated `fashion_store_uat_20261027`, valid Storefront credentials created an account-owned order/cart; the guest cart remained available; an invalid bearer returned 401 and an Admin bearer returned 403.
- Manual API UAT approved a pending cancellation through the Admin queue and verified its `reserve`/`release` movements. A separate COD order advanced through confirmed, processing, shipping, and delivered with collection recorded; return approval left it delivered, and the later `returned` transition restored inventory through `InventoryService`.
- Verified exact seven-day return deadline accepted and an eight-day attempt rejected using the same domain action under a rollback-only frozen-clock UAT transaction; no simulated request rows persisted. A rejected request could be followed by a new request. An invalid transition from `returned` returned 422.
- UAT DB snapshots confirmed final available stock and product `sold_count` equal their starting values. Temporary accounts were deactivated and access/refresh sessions revoked. No production data was touched and no test suite was run. Browser checkout, account screens, missing-delivery-time rejection, accessibility, and production checks remain open.

### UAT API Storefront ↔ Admin và sửa lỗi runtime (2026-10-27)

- Khởi động API tạm với guard xác nhận `APP_ENV=local`, `DB_DATABASE=fashion_store_uat_20261027`; dùng HTTP trực tiếp để UAT, không chạy test suite. Đã dừng API và Storefront tạm sau khi hoàn tất.
- Luồng checkout: thêm/cập nhật/tải lại cart, địa chỉ Hà Nội, báo giá coupon hợp lệ, coupon sai/tỉnh sai đều bị từ chối `422` và không tạo order/payment/coupon usage/inventory movement. Cart không bị mất khi yêu cầu bị từ chối.
- Phát hiện lần đặt đầu trả `500` sau commit vì `AdminPersonalNotification` khai báo lại `$afterCommit` không tương thích với Laravel `Queueable`; đơn vẫn đã được commit. Sửa cả 8 notification cùng kiểu bằng `Queueable::afterCommit()`. Retry đúng key/scope trả lại đơn cũ `200`, chỉ có một đơn/payment/history/coupon use/reserve movement; không nhân đôi.
- Một đơn mới sau sửa được tạo `201`; retry trả cùng đơn `200`. DB xác nhận payment COD khớp tổng tiền, một item, một lịch sử ban đầu, một movement giữ kho, một lượt coupon và cart rỗng.
- UAT phát hiện `TrackOrderRequest` dùng `prohibited_with`, rule không có trong Laravel 13 đã cài (`validateProhibitedWith` không tồn tại); đổi sang `prohibits`. Tra cứu đúng điện thoại trả `200`, sai điện thoại trả `404`.
- Tạo tài khoản Admin UAT tạm bằng credential ngẫu nhiên nội bộ, gọi login/me, Admin order queue/detail, chuyển đơn `pending → confirmed`, xác nhận Storefront track phản ánh trạng thái mới; logout `200`, access token cũ bị từ chối `403`. Tài khoản tạm được vô hiệu hóa và token bị thu hồi.
- Order codes UAT: `FS261027-ZWBJLL` (request đầu gặp lỗi sau commit, retry khôi phục đúng đơn) và `FS261027-YXC9EW` (luồng sau sửa thành công; đã chuyển sang confirmed). Hai đơn chỉ tồn tại trong DB UAT riêng.
- Computer Use không hoàn tất kiểm tra trực quan vì công cụ chặn thao tác khi không xác định được URL; vì vậy trạng thái UAT này là API/DB, không xác nhận browser checkout hoặc toàn bộ accessibility.

### Fresh database migration and schema audit (2026-10-27)

- Tạo database UAT riêng `fashion_store_uat_20261027`, migrate và seed local. Lượt audit fresh install phát hiện `users.avatar` chỉ dài 255 ký tự và thứ tự cột bảng `users` lệch SQL snapshot dù DB local hiện có đã khớp.
- Thêm migration tiến `2026_10_27_151907_align_users_avatar_length`: đổi avatar thành nullable `varchar(500)`, đồng bộ thứ tự cột với snapshot và chặn rollback nếu có URL dài hơn 255 ký tự. Không sửa migration cũ.
- Chạy lại migrations trên UAT riêng; audit thành công: 81 bảng/730 cột, định nghĩa bảng/index/foreign key khớp `fashion_store_schema.sql`; audit dữ liệu Storefront báo 0 lỗi. Không chạy test suite.
- Luồng đặt hàng có ghi/đọc dữ liệu demo nhưng chưa thực hiện UAT mutation trên giao diện; các bước checkout trong checklist vẫn mở.

### Tạo ảnh flat-lay quần áo demo chân thực (2026-10-27)

- Theo yêu cầu mới, tạo 16 ảnh AI phong cách ảnh chụp studio, mỗi ảnh là một món quần áo bày phẳng, không người mẫu/mannequin và không minh họa; màu và kiểu dáng bám catalog. Ảnh là concept demo, không xác thực hàng tồn kho thực tế.
- Thêm bộ ảnh phiên bản v3 cùng WebP responsive 360/640/800, giữ nguyên các ảnh cũ. Seeder local chuyển sang ảnh v3 cho mẫu quần áo, giữ nguyên ảnh do cửa hàng tải lên; 3 phụ kiện tiếp tục dùng ảnh hiện có.
- Chạy `StorefrontDemoSeeder` trên `APP_ENV=local`, không khởi động ứng dụng. `npm run audit:demo-data` và audit media cùng đạt 0 lỗi; 19 sản phẩm active vẫn có ảnh gallery/thumbnail với disclosure AI. Schema snapshot vẫn khớp 81 bảng/730 cột.
- Tạo lại `docs/ui-ux/mockups/storefront-assets-review.html`; bảng hiện hiển thị 19 sản phẩm từ database local. Ảnh người bán tải lên được seeder ưu tiên và bộ ảnh cũ vẫn được giữ lại. Không chạy test suite.

### Rà lỗi “access session … audience” trong log đăng nhập (2026-10-27)

- Tìm được 6 lỗi cũ trong `api/storage/logs/laravel.log`, tất cả ghi thời điểm 2026-10-25. Stack trace đi qua luồng phát hành access session lúc login/refresh cho Storefront và Admin; không có lỗi mới được tạo trong lần rà này.
- Chạy preflight nội bộ cho `IssueAccessTokenAction` với tài khoản `super_admin` và customer active bên trong transaction rồi rollback. Phát hành access session cho cả audience `admin` và `storefront` đều thành công; không phát sinh token/refresh session còn lưu trong database. Không in email, credential hoặc token.
- Cấu hình URL Admin mặc định cùng API port 8000 và CORS local bao gồm origin Admin 5174. Browser check bằng tài khoản Admin seed local xác nhận login HTTP 200, giao diện Tổng quan hiển thị, `/admin/auth/me` HTTP 200, logout HTTP 200 và refresh sau logout bị từ chối HTTP 401. Browser check Storefront bằng khách demo xác nhận login và `/auth/me` HTTP 200; tải lại trang `/account/orders` dùng refresh cookie HTTP 200, trang đơn hàng hiện, logout HTTP 200 và refresh sau logout bị từ chối HTTP 401. Mã dùng access token trong state bộ nhớ; API đặt cookie refresh `HttpOnly`. Thu hồi/xóa các phiên tạm, dừng API/Admin/Storefront và xác nhận cổng 8000/5173/5174 không còn listener; xóa script kiểm tra tạm. Không chạy test suite. Các luồng khôi phục mật khẩu, đăng ký mới, xóa tài khoản và full customer-account UAT vẫn chưa được xác minh.

### Tách bundle khởi động Admin và kiểm tra runtime (2026-10-27)

- Build trước đó có entry bundle 533.09 kB. Thử gom mọi dependency vào `vendor` tạo chunk 1.1 MB nên đã bỏ. Cấu hình Rolldown cuối cùng chỉ tách React/React DOM/scheduler thành chunk cache riêng, giữ lại code splitting theo route cho các trang Admin.
- Admin production build và ESLint đạt. Entry giảm còn 326.07 kB (91.51 kB gzip), React chunk 218.75 kB (68.27 kB gzip); không còn chunk vượt 500 kB. Tổng gzip của entry + React tăng nhẹ khoảng 3.7 kB so với bundle đơn cũ; chunk React riêng cho phép cache độc lập giữa các bản cập nhật.
- Mở build production ở trang `/login` bằng trình duyệt; form đăng nhập và các điều khiển passkey/SSO hiển thị trong accessibility tree. Không nhập thông tin đăng nhập. Đã dừng preview và xác nhận cổng 4173 không còn listener.
- Đây là kiểm tra route công khai, không xác nhận đăng nhập hoặc các route Admin đã xác thực; không chạy test suite.

### Tự động kiểm tương phản chữ banner và tái lập media (2026-10-27)

- Renderer banner giờ lấy mẫu màu chữ trên gradient và họa tiết nền, từ chối render nếu tương phản dưới 4,5:1. Kiểm tra phát hiện màu caption cũ chỉ đạt 4,41:1; đã đổi sang màu đậm hơn. Kết quả hiện tại: hero desktop/mobile tối thiểu 5,21:1, campaign tối thiểu 5,15:1.
- Sửa A4 trong kế hoạch ghi đúng 30 đầu ra của verifier. `npm run assets:storefront:verify` hiện xác nhận SHA-256 trùng cho cả 30 file sau khi render lại; mọi banner, cover, video, OG và icon tiếp tục đạt giới hạn kích thước/định dạng.
- Chạy lại `npm run audit:demo-data`: 81 bảng/730 cột khớp snapshot SQL, coverage Storefront/Admin/media đều 0 lỗi; disclosure AI cho cả 19 sản phẩm còn nguyên.
- Sau khi đổi public media, Admin và Storefront lint + production build đều thành công. Admin vẫn có cảnh báo entry bundle 533.09 kB (>500 kB); Storefront entry là 365.90 kB. Build Admin cập nhật file notice giấy phép phụ thuộc do script build sinh ra.
- Đây là xác minh pipeline/build và audit dữ liệu chỉ đọc, không chạy test suite hay tạo đơn.

### Tái tạo bộ media Storefront bằng một lệnh (2026-10-27)

- Thêm `npm run assets:storefront` làm lệnh điều phối xuyên nền tảng cho SVG nguồn, cover/banner/video WebP/MP4, ảnh OG và favicon/app icons. Mỗi renderer dừng pipeline khi lỗi; vẫn giữ các lệnh riêng để chạy từng nhóm. Ảnh sản phẩm AI có workflow nguồn tách biệt, không bị render lại thành đồ họa trung tính.
- Thêm `npm run assets:storefront:verify`; lệnh render lại rồi so SHA-256 cho 30 SVG/raster/video đầu ra. Hai lần render liên tiếp trên máy hiện tại cho hash trùng toàn bộ.
- Cập nhật `tools/assets/README.md` và A4 trong kế hoạch với yêu cầu Node.js, Chrome/Edge và FFmpeg.
- Chạy pipeline thành công: 7 cover danh mục + 2 collection dưới 80 KB; 3 banner đúng kích thước dưới 150 KiB; video 35.5 KB; OG 1200×630 dưới 150 KiB; icon 32/180/512 px đúng kích thước. Chạy lại `npm run audit:demo-data`: so khớp DB/SQL, Storefront, Admin và media đều 0 lỗi.
- Đây là render asset, không chạy test suite. Audit dùng database local; production, ảnh hàng thật và chủ cửa hàng duyệt nội dung vẫn là các cổng riêng.

### Local Admin first-login setup documented (2026-10-27)

- Reviewed `DatabaseSeeder` and `AdminWorkflowDemoSeeder` after earlier reports of login trouble. A super-admin is created only when `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` are set; there is no fixed default super-admin. The permission-limited demo staff fixture is seeded only in local/testing and only when an admin exists.
- Updated README first-time setup to set the initial credentials before `migrate --seed`, documented the existing-account/no-password-reset behavior, and listed the local-only demo staff account. Updated the audit instructions to use the aggregate `npm run audit:demo-data` command.
- Extended the Admin API audit to count active Admin accounts and, when seed credentials are configured, verify in-process that they match an active super-admin without printing the email or password. The aggregate audit reports 3 active Admin accounts, a matching configured super-admin credential, one login-ready demo staff account, and zero failed checks.
- No login form or authentication endpoint was submitted; credential/hash and role readiness are verified, but interactive sign-in and cookie behavior remain unverified.

### Nginx release validation procedure (2026-10-27)

- Reviewed the existing Admin, Storefront, API, and security-header Nginx examples against the deployment plan. Added concrete pre-reload `nginx -t`/reload steps and external-client checks for SPA routes, robots/sitemap origins, API health, media mounts, CSP, cache headers, and credentialed CORS.
- No Nginx executable, production hostname, certificate, or deployment host is available locally, so syntax and live-host behavior remain unverified. No service was reloaded.

### Live catalog price-sort and sale-price query review (2026-10-27)

- Temporarily started the local API and made read-only GET requests for `sort=price_asc` and `sort=price_desc`. Both returned all 19 active products in monotonic order by the displayed price; the returned sale comparisons had no values less than or equal to their current prices. `Áo khoác trench ngắn` returned 1,850,000 VND with a 2,050,000 VND comparison price.
- Stopped the API process and verified port 8000 has no listener. This exercises the real local MySQL-backed query/resource path, but is not a test-suite run and does not verify checkout repricing or sale-window edge times.

### SQL schema snapshot matches applied migrations (2026-10-27)

- Read-only `php artisan migrate:status` reports all 60 migration files as `Ran` in the current local database. Added `npm run audit:schema-snapshot`, a reusable read-only comparison that checks table/column names, types, nullability, and normalized full `CREATE TABLE` definitions. It reports 81 tables and 730 columns match, including defaults, indexes, foreign keys, and table options; only `AUTO_INCREMENT` counters are ignored. All 60 migration filenames are present in the snapshot migration table, including the latest `idempotency_scope` change. Integrated the schema comparison into `npm run audit:demo-data` so the aggregate API/media audit runs it automatically.
- The comparison is against the current local database, not production. No migration or database write was performed.

### Combined database, API, and media audit (2026-10-27)

- Re-ran `npm run audit:demo-data` after combining schema validation with the Storefront API, Admin API, and media audits. All four report zero failures: DB/snapshot DDL match (81 tables, 730 columns); all 19 active products have variants, gallery/thumbnail files and AI-demo disclosures; all 108 active variants have inventory; banners, video, CMS, locations, order/coupon and Admin fixtures pass; no required files or alt text are missing.
- The audit confirms zero owner-provided product/color photos, so those images remain a production merchandising input. The command is read-only; it created no order and changed no database row.

### Admin review-image zoom retains AI-demo disclosure (2026-10-27)

- Updated the Admin review detail drawer to retain an image's API alt text when opening the zoom viewer. AI-demo review fixtures now keep a visible `Ảnh AI demo` badge both in the attachment grid and in the zoom overlay.
- Updated the review page specification. Admin ESLint and the local TypeScript project build passed; no test suite was run. Authenticated Admin browser verification remains open.

### Responsive runtime review across Storefront breakpoints (2026-10-27)

- Temporarily started only the API and Storefront under the owner's earlier approval. Used headless Chromium viewports at 320px, 390px, and 1440px to inspect the home, new-products catalog, product detail, cart, checkout, login, and order-tracking routes. Every inspected document had `scrollWidth === clientWidth`; no element extended beyond the viewport.
- The sweep made enough public API requests to exceed the configured 60-requests-per-minute local limit, producing 429 responses; unauthenticated session calls also returned 401. Chromium recorded no uncaught JavaScript `pageerror`, but this was not a clean console/network pass and authenticated routes remain unverified. The throttle was not changed.
- Stopped both temporary servers and verified ports 8000 and 5173–5175 were no longer listening. No forms, login, orders, or state-changing actions were submitted.

### Disclosed local review-image fixture covers the image moderation path (2026-10-27)

- Added one review-image fixture to the local/testing seeder only, attached to the existing pending demo review. It reuses the generated shirt flat-lay, copies it to the public storage disk idempotently, and never seeds the asset in production.
- `ReviewResource` now returns an explicit `Ảnh AI demo:` alt description for this demo-only path; ordinary customer uploads retain the customer-photo description. Admin and Storefront show the AI-demo disclosure in review details/content, including if UAT moderation later approves the sample.
- OpenAPI describes this disclosure, generated Admin/Storefront types were refreshed, and the media audit now requires one valid local fixture. The seeder and audit report one review image, one pending disclosed demo image, zero missing files/invalid URLs, and zero other coverage failures.
- Pint, PHP syntax checks, Storefront/Admin ESLint, and both local TypeScript build checks passed. No test suite was run. The public product review listing still excludes the pending fixture by contract.

### Read-only local runtime review of Storefront media and API (2026-10-27)

- Temporarily started the root `npm run dev` stack under the owner's earlier approval. API `/up`, Storefront `/`, and Admin `/` returned HTTP 200.
- Browser review confirmed the homepage renders both product rails and campaign media; the `new=1` catalog returns seven products with loaded AI-demo images and explanatory alt text; a product detail renders its photo, demo disclosure, variants, and product content; Admin reaches the login screen. No login, form submission, order, or other data mutation occurred.
- Stopped the temporary stack after review. Confirmed ports 8000 and 5173–5175 no longer accept connections. This review does not verify authenticated Admin workflows, mobile 320px overflow, screen-reader behavior, or checkout mutations.

### Storefront review-image component coverage (2026-10-27)

- Added a component spec using the generated `StorefrontReview` API shape to cover rendering an attached review image, preserving server-provided alt text, lazy loading, and opening the full image with a safe `noreferrer` link.
- Kept the image inside an isolated test fixture; no synthetic customer review or review photo was added to public demo data.
- Storefront ESLint and the project-local TypeScript build (`node ./node_modules/typescript/bin/tsc -b --pretty false`) passed. The spec was not run; no test suite was executed.

### Storefront E2E smoke specs match current merchandising and media behavior (2026-10-27)

- The homepage smoke specs now check that “Xem tất cả” retains each product rail's API sort and merchandising filter. Added a navigation scenario proving the `new=1` filter survives a later sort change and remains visible as an active chip.
- Replaced a stale product-photo assertion that expected the removed neutral placeholder with assertions for the currently seeded AI flat-lay disclosure and its unverified-photo alt text.
- Updated test code only; did not run the test suite, as required by the root agent guide unless explicitly requested.

### Catalog keeps home-rail merchandising filters (2026-10-27)

- Verified home rail links pass `new=1` or `best_seller=1` and their sort to `/products`. Found catalog filter application rebuilt the query and dropped those flags when a shopper changed sort or regular filters.
- Updated catalog URL state to preserve active merchandising flags through filter/sort changes and added Vietnamese labels for their active-filter chips. Clearing all filters still removes them.
- Catalog page spec now requires preservation/readable chips. Storefront lint and build:seo passed; all 36 local snapshots were regenerated. Stopped the temporary API and verified no listener remains on app/API/Admin/Mailpit ports. No test suite ran.
- Read-only runtime review confirmed the home “Sản phẩm mới” rail opens `/products?sort=newest&new=1`; changing sort to bestseller and applying produced `/products?sort=bestseller&new=1` and retained the seven new products. No state-changing form was submitted. Stopped temporary API and Storefront servers; target ports are free.

### Home product rails preserve catalog filters (2026-10-27)

- Fixed each home-rail “Xem tất cả” link to retain that rail's API sort/filter: newest products open the new-product catalog; best sellers open the bestseller-sorted catalog.
- Updated the Storefront home page spec with the link behavior.
- Storefront ESLint passed; build:seo passed TypeScript/Vite and regenerated all 36 local public-route snapshots. The temporary API process used for prerendering was stopped; target application/Mailpit ports have no listeners. No test suite ran.

### OpenAPI and demo-data integration audit (2026-10-27)

- Regenerated both Admin and Storefront TypeScript declarations from api/openapi.yaml with npm run api:types. Admin lint/build and Storefront lint/build:seo then passed against the generated contract; Admin retains the existing 533.09 kB entry-chunk advisory.
- Ran the read-only demo-data/media audit: all three audit groups report zero failed checks. It confirms 19 active products with variants, gallery/thumbnail media and AI-photo disclosures; 3 active banners including 1 video; 7 categories; 2 populated collections; 6 published pages; 34 province entries with 3,321 wards; and complete Admin permission/demo fixtures.
- build:seo regenerated 36 local public-route snapshots. Stopped the temporary API used by prerendering and verified ports 8000, 5173–5175, 8025, and 1025 have no listeners. No test suite ran.
- Production remains unverified: the audit reports zero owner-provided product photos; generated AI photos are disclosed demo media only. Production origins, SMTP/monitoring, real imagery, and owner approval of final brand/content remain release inputs.

### Checkout summary now waits for the API quote (2026-10-27)

- Removed the client-computed cart sum from the checkout summary. Before a current preview arrives, subtotal and grand total are labeled as unavailable; the free-shipping progress uses only the latest API quote and otherwise explains how to request one.
- Updated the Cart and Checkout page spec to make this server-authoritative display behavior explicit.
- Storefront lint and production build passed. Regenerated all 36 local SEO snapshots with matching localhost API/site origins after the regular build cleared dist. No test suite ran.
- Stopped the temporary API used by SEO prerendering and verified ports 8000, 5173–5175, 8025, and 1025 have no listeners.

### Storefront runtime review of checkout and account routes (2026-10-27)

- Temporarily started the root npm run dev stack under the previously granted browser-review authorization, then reviewed Storefront pages without submitting forms or changing data.
- Confirmed /cart and /checkout show the empty-cart state with a catalog CTA; /track-order exposes order-code and phone/email fields; unauthenticated /account redirects to /login?returnTo=%2Faccount; login, password recovery, invitation-only registration, contact, and privacy pages render.
- No checkout, login, registration, newsletter, or order lookup was submitted. Stopped the temporary stack and verified ports 8000, 5173–5175, 8025, and 1025 have no listeners. No test suite ran.
- This read-only route smoke review does not verify completed purchases, screen-reader support, production UAT, or WCAG sign-off.

### Storefront SEO snapshot build restored (2026-10-27)

- The regular `npm run build` clears `storefront/dist`; inspection found only the root index and confirmed the prior route snapshots were absent. Rebuilt with `npm run build:seo` against the configured local API using a matching `http://localhost:5173` site origin.
- Verified all 36 SEO `index.html` files were regenerated, including product, category, collection, and CMS snapshots. The midi-dress snapshot references the newly seeded v2 WebP and contains the `Ảnh AI demo` disclosure.
- These localhost snapshots are for local preview only and must be rebuilt with the real HTTPS Storefront/API origins for production. The temporary API process was stopped; no tests ran.

### Three refreshed Storefront demo product photos (2026-10-27)

- Routed the new garment-only AI flat-lays to the Natural linen shirt, black cotton trousers, and Natural square-neck midi dress. Preserved the prior source assets under their original filenames; the new images use versioned `-v2` names.
- Converted each source into responsive 360×450, 640×800, and 800×1000 WebP files (largest derivatives: 67,954 bytes). Updated `StorefrontDemoSeeder` to use these only for demo media; an owner-provided gallery image still takes precedence.
- Ran the idempotent `StorefrontDemoSeeder` against the configured local database. Read-only verification shows all three product thumbnails now reference their v2 files.
- Re-ran `npm run audit:demo-data`: Storefront, Admin, and media audits each report zero failed checks; all 19 active products retain AI disclosure and complete thumbnail/gallery media.
- Updated the photo comparison board to identify these three assets as the current disclosed demo photos. No test suite was run.
- Browser review of `/products/vay-midi-co-vuong` confirmed the new WebP is rendered; moved the shared `Ảnh AI demo` badge from the bottom to the upper-left so the disclosure is visible beside the image in the initial viewport. Verified in the rendered page; API and Storefront were stopped afterward.
- After the media/CSS change, `npm run lint` and `npm run build` in `storefront/` both passed. No test suite was run.

### Storefront manual route review (2026-10-27)

- Read-only browser review confirmed the home, catalog (19 products), product detail, áo category, Thu đông 2026 collection, shipping/return policy, and not-found routes load expected titles, headings, and API-backed content. The product detail exposes the AI-demo disclosure and accessible variant controls.
- Browser console returned no warnings or errors for the reviewed routes. No login, newsletter, cart, checkout, or other state-changing form was submitted; no test suite was run.
- The review API and Storefront processes were stopped after inspection; no app listener should remain open.

### Current demo-data and media coverage audit (2026-10-27)

- Re-ran all three read-only audits from the root README. Storefront API coverage: 19 active products with variants, thumbnails, galleries, AI-demo disclosures; 7 categories, 2 populated collections, 3 banners, 6 published policy pages, checkout/order fixtures, and 0 failed coverage checks.
- Media audit: 11 required UI illustrations, 20 product thumbnail/gallery records (19 AI demo and 1 shared placeholder), 1 banner video, required logo/favicon/OG assets, and 0 missing files, dimensions, formats, alt text, or failed checks.
- Admin API coverage: all 9 expected roles and 26 permissions, inventory/order/support/customer/staff fixtures present, and 0 failed coverage checks. The owner directed realistic garment-only photos without wearers or illustrations for demo/UAT; the README and catalog disclose that AI photos are not verified store inventory. Owner-confirmed photos remain required before production merchandising.
- Ran the read-only Storefront palette contrast audit: all 14 light/dark palettes pass 4.5:1 text/link contrast and 3:1 computed control-boundary contrast.

### Admin product-media upload session handling (2026-10-27)

- The product-gallery uploader used a private `XMLHttpRequest`, bypassing the Admin HTTP client's 401 refresh/retry and request-ID capture. Replaced that transport with `adminApiUpload`, preserving upload progress, response validation, and retry-after-token-refresh while recording request IDs in the shared client.
- Added typed network/timeout/abort errors so the gallery keeps filename-specific Vietnamese messages. Updated frontend architecture guidance to document the progress-enabled shared transport. No OpenAPI/API behavior changed. `npm run lint` and `npm run build` in `admin/` both pass on the final code; Vite retains the pre-existing 533.09 kB entry-chunk advisory. No tests ran.

### Additional flat-lay photo candidates (2026-10-27)

- Created new studio-style, no-model AI photo candidates for the linen shirt and cotton pique polo in response to the request for realistic garment-only images.
- Saved review copies under `docs/ui-ux/mockups/product-photo-review/` and documented their status. They are review-only: they have not replaced existing demo media, changed the database/seeder, or been uploaded to the API. Keep the `Ảnh AI demo` disclosure if approved for demo/UAT; these images do not verify the store's actual stock.
- Opened the linen-shirt review image in Codex. Quality review/acceptance of these two candidates is pending; no test suite or app runtime was used.
- At the owner's direction, generated a second garment-only photo pair. The linen shirt is ivory, matching the Natural SKU; the first polo candidate was green, which did not match catalog variants, so it was discarded and replaced with a navy polo matching the existing Xanh navy variant. Both retained candidates are photoreal-style AI images, have no model/mannequin/illustration, and are labeled as generated review candidates; they are not photographs of verified stock.
- Copied the new candidates into the review folder and added them to the responsive comparison board and README. They remain unapproved and were not copied into serving demo media, seeded into product records, or uploaded to the API.
- Reconciled generated image colors with `CatalogSeeder.php`: linen shirt is Natural and polo includes Xanh navy. The photo review board now points to those matching variants; all six image references resolve and each has non-empty alt text. A static source scan found no direct frontend `fetch()` calls outside the shared Admin/Storefront HTTP clients. No test suite or app runtime was run.
- Added a responsive side-by-side review board comparing each candidate to its currently used demo photo, with visible AI/demo and pending-review disclosures. Static path/alt check found and then fixed two incorrect relative paths; all four referenced images now resolve and have non-empty alt text. The browser URL policy blocked `file:` preview, so visual rendering of this board remains unverified.
- Updated the plan's open-input checklist to explicitly mark the unselected A1 brand direction and these two photo candidates as owner-review gates. No brand palette or product media is applied from those pending choices.

### Storefront favicon monogram correction (2026-10-27)

- Corrected the source favicon from an “S” monogram to an “N” monogram to match NÉT Studio; kept the existing background and colors pending the owner's choice among brand directions.
- Regenerated favicon-32.png, apple-touch-icon.png, and android-chrome-512.png through `npm run assets:storefront-icons`. The renderer confirmed 32×32, 180×180, and 512×512 outputs; visual inspection of the 32px icon shows the N monogram.
- Chrome emitted warnings about unrelated missing extension registry values while rendering; the asset renderer completed successfully. No app or test suite was run.
- Re-ran the read-only `npm run audit:demo-data` after the icon change: Storefront, Admin, and media audit groups each reported 0 failed checks. The 19 catalog AI demo photos remain correctly disclosed; the two new photo candidates are review-only and do not alter those product records.
- `npm --prefix storefront run build` completed successfully and copied all four referenced icon files into `storefront/dist/`.
- Replaced the Admin's default Vite lightning-bolt favicon with the same NÉT Studio N monogram; `npm --prefix admin run build` succeeded and `admin/dist/favicon.svg` matches its source. The existing Admin main-chunk size advisory (533.09 kB) remains.
- A subsequent authorized browser-review attempt could not select a stable Chrome window: `list_windows` and `list_apps` returned conflicting/stale window IDs. Per computer-use recovery guidance, stopped UI interaction. Stopped the temporary root dev stack and verified ports 8000, 5173, 5174, and 5175 are free; no forms or orders were submitted.

### Storefront and Admin in-app browser route review (2026-10-27)

- Recovered manual route review with the Codex in-app browser after the native Chrome window IDs proved inconsistent. Opened the Storefront home, catalog, and linen-shirt detail; API-backed content loaded with 19 products, working filter options, image disclosure/alt text, correct price display, and expected disabled size/add-to-bag controls until a color is selected.
- Opened `/reports/inventory` in Admin without submitting credentials. The protected route redirected to the Admin login screen, with the expected recovery, passkey and SSO controls and no visible error state.
- No forms were submitted, no auth or order was created, and no test suite ran. The temporary root `npm run dev` stack was stopped after review; ports 8000, 5173, 5174, and 5175 are free.
- Regenerated Admin and Storefront TypeScript declarations from `api/openapi.yaml`. Storefront and Admin production builds both succeeded afterward; the Admin build retains the existing 533.09 kB main-chunk advisory. No tests ran. Confirmed no app/API ports remain in LISTENING state.

### Admin entry-chunk size investigation (2026-10-27)

- Inspected an Admin production sourcemap: route/page modules are already emitted as lazy chunks; the entry contains the global `App.tsx` shell and React DOM. The entry is 533.13 kB raw and 156.15 kB gzip, so no arbitrary chunk-boundary change or warning-threshold increase was applied.
- Restored the normal production build after the temporary sourcemap analysis. `npm run build` succeeded with the same >500 kB advisory and no sourcemap files remaining in `admin/dist`; no source changes or tests were made.

### Admin build-version environment example (2026-10-27)

- Added `VITE_APP_VERSION` to `admin/.env.example` and deployment guidance. Admin diagnostics, support requests, and the account version panel read this build-time value; API `APP_VERSION` remains a separate runtime setting.
- A targeted source/config scan confirms the variable is documented in the Admin sample and release instructions. This documentation/config-example-only change did not require a build or test run.
- A read-only environment scan also confirmed `VITE_API_URL` and `VITE_STOREFRONT_URL` remain optional overrides with documented same-host defaults, while API-specific credentials and storage/service variables retain Laravel configuration defaults or are provider-specific.

### Seven-day customer return policy consistency scan (2026-10-27)

- Cross-searched the API action/OpenAPI contract, Storefront shipping copy/seeder, and requirements for the approved return window. They consistently use seven days from successful delivery (`delivered_at`) and manual staff review; the exact deadline remains inclusive. Other seven-day references concern unrelated file-retention periods. No conflicting return deadline was found, so no policy copy or behavior was changed.

### Storefront runtime and demo-data verification (2026-10-27)

- Re-ran `npm run audit:demo-data`: zero failed checks. Current coverage includes 19 active products with variants, thumbnails/galleries, and AI disclosure; 3 active banners including one video, 7 categories, 2 collections, 6 published pages, Admin fixtures, and 11 referenced UI illustrations; no missing or invalid media/alt references.
- Temporarily ran `npm run dev` and reviewed live Storefront home, catalog, product detail, and empty cart in the in-app browser. The pages rendered API-backed content; catalog showed 19 products, product detail showed its AI disclosure, and the empty cart had a browse CTA. Public GETs for products, banners, collections, categories, and Laravel `/up` returned HTTP 200. Admin reached its login screen; no credentials were entered.
- Stopped the temporary run and verified no listeners remain on ports 8000, 5173–5175, 8025, or 1025. No test suite ran and no cart/order mutations were made.
- Storefront ESLint and production build passed after this runtime review; the split route chunks built successfully, with no test suite run.
- Follow-up unauthenticated route review covered checkout empty state, order-lookup fields, published shipping/returns policy, safe account-to-login redirect with `returnTo`, not-found, and password-recovery form. No recovery email or order lookup was submitted. Stopped the second temporary run and again verified ports 8000, 5173–5175, 8025, and 1025 have no listeners.

### Same-site local API and Storefront origins (2026-10-27)

- Found Admin/Storefront defaults hardcoded to `localhost:8000` while the apps are commonly opened as `127.0.0.1`; this mixes sites for the `SameSite=Lax` refresh cookie. Centralized API-base resolution in each SPA so the default follows the current browser hostname and protocol; explicit `VITE_API_URL` still overrides it. Admin Storefront links now also follow the current hostname by default, with `VITE_STOREFRONT_URL` as an override. Updated env examples and auth guidance.
- Verified Storefront at `http://127.0.0.1:5173/products` with no `VITE_API_URL`: it fetched and rendered all 19 API products and filter options. The first attempt hit the configured 60-request rate limit from repeated route review; after the advertised 11-second retry interval the API returned 200 and the catalog rendered normally. Admin opened at `127.0.0.1:5174` to the login screen; no credentials were entered.
- Admin and Storefront ESLint and production builds passed. Admin retains the existing >500 kB main-chunk warning. Stopped the temporary app run and confirmed no listeners remain on app/API ports. No test suite ran.

### Deployment proxy, API media origin, and CORS config (2026-10-27)

- Confirmed Laravel's global `TrustProxies` middleware reads `config/trustedproxy.php`; the config now splits the documented comma-separated `TRUSTED_PROXIES` into trimmed IP/CIDR entries, and keeps an empty list as `null` for direct connections. A command-level config smoke check with two proxy IPs passed.
- Removed the duplicate `API_ALLOWED_ORIGINS` declaration from `api/.env.example`.
- Added `deploy/nginx/api.conf.example` for the API domain: Laravel front-controller routing, HTTPS FastCGI parameters, upload request size, and cached public demo/upload media. Deployment docs now require the public directory and persistent upload storage to be shared read-only with Nginx at the configured filesystem path. Static review found balanced location/server blocks and no duplicate upstream names. The host has no Nginx binary, so `nginx -t` could not be run.
- Compared `fashion_store_schema.sql` directly with the configured local MySQL database: all 81 table names and all 60 applied migration names match. The snapshot remains schema-only; API demo rows and media references are managed by Laravel seeders and public files.
- PHP syntax and Pint passed. No test suite was run and no production proxy or domain values were configured.
- Re-generated Admin and Storefront TypeScript declarations from the current OpenAPI contract; both apps' ESLint and production builds passed afterward. Admin retains its existing 532.90 kB main-chunk warning (156.05 kB gzip). Storefront main entry is 365.90 kB (113.71 kB gzip). No test suites were run.
- With a temporary local API process and process-only local build URLs, `storefront/npm run build:seo` generated 36 route snapshots. The home snapshot contains product rails with AI disclosure alt text; the trench detail snapshot contains the 360/640/800 `srcset`, descriptive AI-photo alt text, canonical metadata, and API media URL. Restored the regular SPA build afterward so local API URLs are not left in `dist`; stopped the temporary API.

### Admin product image demo disclosure (2026-10-27)\n\n- Updated Admin create, edit, and image-management guidance to explain that generated AI photos are for demo/UAT only and must be replaced by store-supplied actual photos before selling. Added an Ảnh AI demo badge wherever image alt text starts with the seeded disclosure prefix. Updated the Admin products spec and English translations.\n- Admin lint and production build passed. The existing main-chunk size warning remains; no tests were run.\n\n### AI flat-lay photos for Storefront demo catalog (2026-10-27)

- Following the owner's approval, generated item-only, photorealistic AI flat-lay photos (no models or illustrations) for the 19-product local demo catalog. The blazer copy reuses the blazer image; 18 distinct 800×1000 WebP photos and 360×450/640×800 responsive variants are stored under `api/public/demo-media/products/`.
- Updated `StorefrontDemoSeeder` to keep operator-uploaded photos, seed AI photos for demo products, and retain the neutral placeholder as fallback. Seeded image alt text begins `Ảnh AI demo:`; Storefront cards, home rails, detail, related products, and wishlist show the disclosure badge. Collection copy now says demo images are AI-generated and not verified product photos.
- Updated the asset workflow, A8 notes, and generated media-review board; added a product-photo manifest and source-to-WebP converter. Images are for demo/UAT only and must be replaced with store-confirmed photography before production merchandising.
- Ran the idempotent Storefront demo seeder and `npm run audit:demo-data`: 19/19 active products have image and AI disclosure; no missing media, alt text, size/dimension/format failures, or audit coverage failures. PHP syntax/Pint, Storefront ESLint, and production build passed. Did not run a test suite.
- With the owner's temporary-start approval, reviewed the home and trench product detail in the browser. The generated product photo and `Ảnh AI demo` label appeared in both surfaces, with alt text stating the photo is unverified. Temporarily started API and Storefront, then stopped both; ports 8000 and 5173 have no listening processes.
- Updated the approved desktop/mobile mockup suite to use the same disclosed AI flat-lay photos in home/catalog cards, product detail, and cart examples. Updated home/product-detail specs and the A3/A8 planning language; a static asset-reference audit found 22 images, 16 product photos, all image alt text present, all file references valid, and no remaining product placeholders. The in-app browser refused the local `file:` preview under its URL policy, so this updated mockup has not been visually re-reviewed in-browser.

### Storefront Playwright E2E foundation (2026-10-27)

- Added `@playwright/test`, `test:e2e`, Chromium desktop/mobile route smoke checks, and gated checkout, guest-cart merge, and API stock-conflict scenarios.
- Mutation scenarios require both `E2E_ALLOW_MUTATIONS=true` and `E2E_ISOLATED_DATABASE=true`; customer-cart merge also reads credentials only from environment variables. Added setup guidance in `storefront/e2e/README.md`.
- Storefront lint, production build, and a direct TypeScript check for the Playwright config/specs passed. Did not run unit or E2E tests; no browser binaries were installed.
- The prior temporary dev session has no listeners on ports 8000, 5173, or 5174.

### Storefront and Admin API build audit (2026-10-27)

- Regenerated Admin and Storefront API types from `api/openapi.yaml` successfully.
- Admin and Storefront ESLint and production builds passed. Admin build reports a 532.90 kB main chunk (156.04 kB gzip); the build remains successful and the warning is retained for bundle analysis.
- Reviewed the Storefront mockup image sources: product slots use the pending-photo placeholder; campaign and category sources are neutral graphics, not apparel photography.
- Did not run unit or E2E tests. Admin login was not automated; authenticated Admin runtime behavior remains unverified.
- Stopped the temporary dev session and verified no listeners remain on ports 8000, 5173, or 5174.

### Storefront unit-test foundation (2026-10-27)

- Added Vitest, React Testing Library, MSW, and jsdom configuration plus a `test:unit` script.
- Added coverage for VND formatting, variant selection, checkout schema validation, catalog URL state, and catalog API query parameters.
- Extracted product variant selection helpers and exported the checkout schema so those behaviors can be tested directly.
- Did not run the test suite, following the repository instruction not to run tests unless requested.

### Storefront order lookup form styling (2026-10-27)

- Browser review found the tracking route rendered its shared `auth-form` markup without loading the stylesheet that formats labels and inputs.
- Loaded the shared auth form styles on `TrackOrderPage`; the page now uses the intended vertical, bordered input layout instead of concatenated labels and placeholders.
- Verified the issue on the live local route before the fix and confirmed the corrected fields render separately with visible borders afterward.

### Storefront runtime and demo-media audit (2026-10-27)

- Started the API, Admin, and Storefront temporarily for browser review; the homepage, catalog sort, product detail, empty cart, and order lookup routes loaded. The catalog returned 19 products and the product page used the neutral pending-photo asset with its disclosure badge.
- Re-ran `npm run audit:demo-data`: Storefront and Admin demo coverage checks had zero failures; all media files and references were present, and no active product referenced generated apparel photography.
- Did not sign in or place an order during this read-only route review.
- Stopped the temporary dev processes afterward and verified ports 8000, 5173, and 5174 no longer have listeners.
- Storefront lint and production build passed after the tracking form fix; unit tests remain unrun per repository instructions.

### Storefront reduced-motion source audit (2026-10-27)

- Reviewed every Storefront CSS `animation:` and `transition:` declaration against `prefers-reduced-motion`. Global shell rules reduce scroll/transition/animation durations, and each shimmer animation is explicitly disabled; the only interactive category-image transform and both shipping-progress width transitions are disabled for reduced-motion users. The campaign video has native controls and does not autoplay. No uncovered moving effect was found; this is a source audit, not device or screen-reader acceptance.

### Unified read-only API and media coverage audit (2026-10-27)

- Added root command `npm run audit:demo-data` to run the Storefront data, Admin data, and media reference audits together; documented that it reads the configured local database/media without writes.
- Ran the unified command successfully: Storefront reports 19 active products, 3 banners including 1 video, 6 required published pages, 34 provinces/3,321 wards and 0 failed checks; Admin reports 9 roles, 26 permissions, inventory on all 108 active variants and 0 failed checks; media reports 0 missing files, alt-text gaps, invalid dimensions/formats/sizes, or generated apparel-photo references. Product photos remain neutral placeholders until real store photos are supplied.

### Storefront cart session uses TanStack Query (2026-10-27)

- Replaced the manual `useEffect`/Promise cart GET and guest-to-customer merge flow with a TanStack Query cart snapshot and merge mutation. Query keys separate guest sessions from customer identities; the UI derives its canonical cart lines and initial loading/error state from the query. Cart line/add mutations and checkout continue to reconcile through the shared cache setter, and logout clears the private cart cache before loading the guest session.
- Added cancellation via TanStack Query's `AbortSignal` for cart reads and updated the frontend architecture/business-flow/cart spec documentation.
- Storefront ESLint and TypeScript/Vite production build pass. Read-only browser review after the change rendered the API-backed empty-cart state with no browser console errors; no cart writes, login, merge, checkout, or order submission was performed. Temporarily started API and Storefront processes were stopped; ports 8000 and 5173 have no listeners. Merge behavior still needs an authenticated session-flow acceptance review.

### Storefront cart and order-route read-only review (2026-10-27)

- Temporarily started the local Laravel API and Storefront under the owner's existing browser-review authorization. The rendered accessibility trees for `/cart`, `/checkout` with an empty cart, and `/track-order` show page-specific headings, the shared skip link/navigation/footer, and the expected recovery or lookup fields. `/pages/about` also rendered its page-specific title/content. No form was submitted and no cart or order data was changed.
- Stopped both temporary processes and verified ports 8000 and 5173 have no listeners. A direct DOM evaluation during fast SPA route changes returned incomplete content compared with the browser accessibility tree, so those measurements were discarded; they are not recorded as route or responsive pass evidence. Full route/accessibility acceptance and purchase E2E remain open.

### Cancellation/return request API copy correction (2026-10-27)

- Cross-checked the Storefront request, Laravel actions/validation, Admin detail/review endpoint, OpenAPI paths, generated frontend types, and the seven-day delivery deadline rule. The API enforces one pending request per order, locks the order during request/review, and uses the existing order transition path for approved cancellations; return approval does not restore inventory until staff records the return transition.
- Fixed two mojibaked Vietnamese validation messages in the customer request action and one English message in the legacy direct-cancel endpoint when a pending staff request exists. PHP syntax checks and Pint on the two changed files passed. No request was submitted and no test suite was run.
- Fixed the Admin follow-up state as well: after staff approves or rejects a cancellation/return request, the active orders list now refetches, removing resolved requests from the server-filtered pending queue without requiring a manual reload. The Admin orders acceptance spec records this behavior. Admin lint/build passed; the existing 544 KB entry-chunk warning remains. No test suite or mutating API request was run.

### Storefront auth accessibility follow-up (2026-10-27)

- Read-only axe WCAG 2.1 A/AA scans now cover cart, checkout, login, registration, password recovery, order tracking, two public content pages, account settings, and not-found at 390px; login, registration, and recovery were also scanned at 1440px. No violations were reported, and the audited routes had no horizontal overflow or page JavaScript errors.
- Fixed auth-page text inheriting a pale global muted color on a light surface by defining a local `--muted` token in `StorefrontAuthLayout.css`; darkened the auth footer text and links to meet contrast on the light background.
- Desktop axe marks only the gradient brand-panel text as incomplete because a pseudo-element prevents automatic background-color resolution. No violations were found; the panel's white text was manually checked against the darkest patterned highlight (4.69:1) after darkening the radial gradient. Other dynamic/ARIA incomplete checks and full screen-reader coverage remain open.
- Storefront `npm run lint` and `npm run build` passed. No test suite was run.

### Storefront mobile navigation keyboard review (2026-10-27)

- Read-only Chromium review at 390px confirmed the skip link receives initial focus and the mobile category sheet opens with keyboard activation, exposes its category/collection/account/cart links, traps Tab within the native modal dialog, closes with Escape, and restores focus to the trigger.
- The appearance dialog also opens from the keyboard, receives focus at its close control, closes with Escape, and restores focus to its trigger. No page JavaScript errors occurred. No forms were submitted and no test suite was run.

### Storefront release-build mobile LCP baseline (2026-10-27)

- Built the intended SEO release bundle against the configured local API and matched the site origin to the API sitemap (`http://localhost:5173`); the prerender produced 36 public route snapshots. A first attempt used a mismatched preview origin and produced only the home/catalog snapshots; correcting the origin restored the complete 36-route output.
- Measured the generated release home page in Chromium at 390Ã—844 CSS px with cold cache, 150 ms RTT, 1.6 Mbps down, 750 Kbps up, and 4Ã— CPU slowdown. Three PerformanceObserver LCP samples were 1,144 / 1,148 / 1,152 ms (median 1,148 ms); the mobile hero image was the LCP element, with no page JavaScript errors. This local emulation is under the 2.5 s target but does not replace measurement on a physical device or production hosting.
- Restored the ordinary Storefront build afterward so `dist` does not retain snapshots with local canonical URLs. No tests were run.

### Storefront accessibility review (2026-10-27)

- Ran a read-only axe WCAG 2.1 A/AA scan on the home, catalog, and product-detail pages at 390px and 1440px. The initial scan found a serious `label-content-name-mismatch` on the mobile catalog filter trigger; the accessible name and rendered spacing now match both the visible label and active-filter count. Follow-up scans report zero violations across the six page/viewport combinations and the 390px active-category-filter route.
- Browser keyboard review confirms the catalog filter dialog opens with Enter, closes with Escape, and returns focus to its trigger. Product-detail tabs respond to ArrowRight; the size-guide dialog opens with Enter and closes with Escape. No page JavaScript errors or horizontal overflow were observed in these audited pages/viewports.
- Axe marks color contrast, some dynamic labels/ARIA values, and the home video-caption rule for manual review. The seeded campaign video has a five-second H.264 video stream and no audio stream; its descriptive label/campaign copy is present. Full screen-reader review and the rest of the checkout/account route set remain open, so the plan's overall WCAG/browser gate is not marked complete. No test suite was run.

### Current Admin/Storefront API and media fixture audit (2026-10-27)

- Re-ran the read-only coverage auditors against the configured database and local public media disk. Storefront API coverage: 19 active products with variants and gallery entries, 30 color/variant pairs, 3 banners including a video, 7 category covers, 2 collection covers, 6 published pages, all 34 provinces and 3,321 wards, and checkout/account/order fixtures; zero failed checks.
- Media coverage: all required records/files, formats, dimensions, and alt text are valid; no generated apparel media or customer review photos. Products intentionally have zero owner-provided photos and continue to use the neutral pending-photo placeholder, following the owner's instruction not to use fake clothing.
- Admin API coverage: 9/9 roles, 26/26 permissions, inventory linked to all 108 active variants, and operational/order/support/demo-workspace fixtures; zero failed checks. No records were changed, no server was started, and no test suite was run.

### Storefront mobile product-detail purchase bar (2026-10-27)

- Browser review at 390 CSS px found the fixed purchase bar appeared on initial load because the main add-to-cart control starts below the viewport; the bar covered the product heading. It now stays hidden until the main control has actually entered the viewport and then leaves it, and hides again when the shared footer enters view. Keyboard focus still suppresses it, and the existing safe-area and content spacing remain in place.
- Updated the product-detail spec with the trigger and footer behavior. Storefront lint and production build pass. Headless Chromium browser review confirmed no horizontal overflow at 320, 360, 768, or 1440 CSS px on the reviewed routes; at 390px the initial sticky bar is absent, the product tabs respond to ArrowRight, and the size guide opens with Enter and closes with Escape. No page JavaScript errors occurred. The targeted follow-up saw one 401 on `/api/v1/auth/refresh`, the anonymous-session restore attempt; a rapid multi-route sweep also hit transient 429 rate limits, so those results are not treated as an application defect. No checkout, order, or newsletter submission was made, and no test suite was run.

### Storefront SEO snapshot release build (2026-10-27)

- Updated the SEO prerender script to load `.env.production`/`.env.production.local` through Vite's env loader, with process variables taking precedence; documented the two variables in `.env.example`, the Storefront README, and ADR-0016.
- Made API fetching resilient to HTTP 408/429/5xx responses with numeric or HTTP-date `Retry-After`, exponential backoff, and reduced route-fetch concurrency from six to three.
- Temporarily started only the local API and ran `storefront`'s `build:seo` with a temporary local env file. It generated 36 routes (home, catalog, 19 products, 7 categories, 2 collections, and 6 CMS pages). The temporary env file was removed afterward.
- The actual production Storefront origin is not configured, so the localhost-origin snapshots were not kept as release artifacts. Lint, the SEO release build, the prerender script syntax check, and ordinary Storefront production builds all succeeded. Rebuilt the ordinary bundle to restore a clean `dist`; the API process was stopped, and MySQL was left running. No tests were run.

### Admin entry-bundle investigation (2026-10-27)

- Traced the recurring Vite size warning to the Admin entry: `index-*.js` was 554.34 KB minified and 160.9 KB gzip; `admin/src/App.tsx` is a single large `App` component spanning route/session state and the shell. Feature pages and rich-text editing already use lazy imports.
- Extracted the product advanced-filter sheet, saved-filter view, and validation messages into lazy `features/products/ProductAdvancedFilters.tsx`; extracted the review list table, inventory table, and order list table into their respective lazy feature modules. Build output confirms separate chunks of 5.50, 2.98, 2.62, and 3.01 KiB.
- The Admin entry fell to 544.06 KB (159.16 KB gzip) from 554.34 KB (160.90 KB gzip). Admin lint and production build pass; the Vite size warning remains and further route-level extraction is needed. No test suite was run.
- Follow-up source-map inspection confirms ordinary route/page components are already lazy chunks, while the main entry remains about 544 KB (159 KB gzip). `App.tsx` contributes about 249 KB of unminified source. Moved Product Create/List, Admin Preferences, Reports, Support, Announcements, Help Extras, and Inventory Controls styles from the static App entry into their lazy feature modules; the entry stylesheet fell from 256.44 KB to 223.02 KB (33.42 KB / 13% smaller), and Vite now emits route-specific CSS chunks. Admin lint/build pass; the JavaScript entry warning remains and the App shell is still a separate optimization task. Temporary source maps/audit script were removed.

### CMS terms and privacy template slugs (2026-10-27)

- Reviewed the content editor flow and confirmed its templates are shown only while creating a new page. Kept their unique slugs so selecting a template cannot conflict with existing `terms`/`privacy` pages; documented that current policy pages should be edited from their existing rows. Admin ESLint and production build pass; the existing 554 KB entry-chunk advisory remains. No test suite was run.

### Admin authentication policy links (2026-10-27)

- Browser inspection of the Admin login found its terms/privacy footer linking to `/pages/dieu-khoan` and `/pages/bao-mat`, while the published Storefront CMS slugs are `/pages/terms` and `/pages/privacy`. Updated `AdminAuthLayout` and the authentication acceptance spec to use the published slugs.
- Rechecked the hot-reloaded Admin login accessibility tree: both links now point to the corrected routes. Opened each route and confirmed the published Terms and Privacy page titles and content render from the API. Admin ESLint and production build pass; the existing 554 KB entry-chunk warning remains. No credentials were entered and no test suite was run.
- Closed the temporary review tabs and stopped the API, Admin, and Storefront processes; verified ports 8000/5173/5174 are no longer listening while MySQL remains available on 3306.

### Fresh integration and release-source audit (2026-10-27)

- Re-ran the read-only Storefront API-data, Admin API-data, media, and theme-contrast audits against the configured local database. Each reports zero failed checks. Current fixtures include 19 active products with variants and galleries, 3 banners including 1 video, 7 category images, 2 collection covers, 6 published pages, 34 provinces/3,321 wards, 9 roles/26 permissions, and all 108 active published variants linked to inventory.
- Confirmed all product media remains the neutral pending-photo placeholder: zero owner-provided product-color photos and zero generated garment references. Real product photography and the remaining owner approval/UAT decisions are still required; do not replace these placeholders with invented apparel.
- Regenerated Admin and Storefront API declarations from `api/openapi.yaml`. Storefront and Admin ESLint plus production builds pass. Admin build retains the existing 554 KB entry-chunk warning; Storefront has no chunk warning. No test suite was run.
- The previous browser review is complete and the guest cart was restored to empty. API, Admin, and Storefront dev processes were stopped afterward; MySQL was left running. Admin authenticated report review and production/UAT gates remain outstanding.

### Current API demo-data and media audit (2026-10-27)

- Re-ran all three read-only audits against the configured database and local media disk. Storefront coverage: 19 active products with variants, thumbnails, and galleries; 30 color pairs; 3 banners including 1 video; 2 collections; 6 required published pages; 34 provinces and 3,321 wards; demo checkout/order/review states; 0 failed checks.
- Admin coverage: 9/9 roles, 26/26 permissions assigned to super-admin, inventory for all 108 active published variants, and representative order, staff, permission, inventory, support, announcement, export, and failed-job workflows; 0 failed checks.
- Media audit: all 3 banners, 7 category images, 2 collection covers, store logo/favicon/share image, product placeholders, and campaign video resolve locally; no missing/invalid media or alt text. No generated clothing images are referenced. Product photos and customer review photos remain absent because the store has not supplied authentic assets.
- The source-level Storefront theme-contrast audit covers all 14 appearance palettes in light and dark modes: text/link pairs meet 4.5:1 and computed control boundaries meet 3:1. This does not replace rendered browser or screen-reader review.
- These are read-only database/media coverage audits, not API integration tests, browser UAT, or production verification. No app servers were started or stopped.

### Rendered Storefront browser review (2026-10-27)

- Reviewed the running Storefront at 360, 768, and 1440 CSS pixels. The homepage has no document-width overflow at any size; the catalog, product detail, cart, empty-cart checkout, and guest order-tracking routes also have no horizontal overflow at 360px.
- The catalog renders 19 API-backed products with sort/filter controls and pagination. Product detail loads server-backed price, variants, stock state, tabs, and related product; all product media use the clearly labeled neutral pending-photo placeholder. Empty cart and checkout render their recovery state without checkout fields; guest tracking exposes order code and phone/email fields. No forms were submitted.
- Keyboard review traversed the homepage links into the campaign video, through its native controls, then through campaign/lookbook links, newsletter controls, and footer links. The home-page spec checklist now records this pass. No Storefront console errors were observed during the reviewed routes.
- Completed a guest purchase-path preview without submitting an order: selected an in-stock color/size, added the product to cart, selected Hanoi, and requested the server shipping quote. The cart showed that the 1,850,000 VND subtotal had reached the free-shipping threshold, with a 0 VND shipping fee and 1,850,000 VND total. Removed the review item afterward; the cart returned to its empty state.
- Admin's report URL redirected to its login screen in the review tab. The Admin 360/768/1440 light/dark report check remains pending sign-in; the user was asked to sign in directly without sharing credentials.
- The project API and frontend listeners were already running before this review began. This review used the running apps; no test suite was run.

### Storefront 320px horizontal-overflow fix (2026-10-27)

- A rendered-browser check found a 15px horizontal scrollbar at the 320px viewport because `body` forced `min-width: 320px` while the browser reserved 15px for its vertical scrollbar. Removed the hard minimum so the body follows the available width.
- Rechecked the rendered home, catalog, product detail, cart, checkout, and guest order-tracking routes at 320px; none has document-level horizontal overflow. The home-page spec now records the responsive check separately; keyboard navigation review remains open. The temporary viewport was reset and the temporary review tab closed. No project server or test suite was started.

### Storefront skip-link keyboard review (2026-10-27)

- In the running Storefront browser, pressing Tab from the initial page state focuses the “Bỏ qua điều hướng” link first. Activating it with Enter changes the fragment to `#primary-content` and moves keyboard focus to that target. The focused target is the named current-page content container. The home spec records this verified behavior; full keyboard review of header controls, home links, and mobile navigation remains open. No user data was entered and no project server or test suite was started.

### Storefront mobile-menu focus containment (2026-10-27)

- Browser keyboard review found that Tab from the last menu link and Shift+Tab from the close button could move focus behind the open modal. Added a visible/enabled focusable-element boundary handler to the native mobile navigation dialog, wrapping Tab to the close button and Shift+Tab to the last link.
- Rechecked both boundaries in the running browser: focus remains inside the open dialog and wraps in each direction. Escape closes the dialog and restores focus to the “Mở danh mục” trigger. Updated the home-page spec. No forms were submitted, no app server was started/stopped, and no test suite was run.

### Storefront appearance-picker focus return (2026-10-27)

- Desktop keyboard traversal showed visible focus through the brand, primary/category/collection links, search input and submit button, appearance control, account/cart links, and hero action. Pressing Enter on the appearance control opened its dialog and focused the close button, but Escape left focus on `body`.
- The picker now captures the opening element and returns focus to it after Escape, the close button, backdrop dismissal, or HoÃ n táº¥t. Browser review confirms Escape and HoÃ n táº¥t close the picker and restore visible focus to the header trigger; no console errors were recorded. The home spec records the verified scope while full traversal of remaining home links/footer actions stays open. No setting was changed, no form submitted, and no server or test suite was started.

### Storefront full home keyboard-traversal attempt (2026-10-27)

- Repeated the desktop traversal after waiting for API-backed navigation and product links to render. The browser confirmed keyboard stops through the skip link, brand, header navigation/search/account/cart, hero action, category and collection links, and product links; the campaign `<video controls>` exposes native internal focus while `document.activeElement` remains the video host. The DOM-only browser controls cannot advance focus within that native player, so the remaining newsletter/footer traversal is not verified and the checklist stays open. All rendered footer links are enabled, visible anchors in the DOM. No form was submitted and the temporary viewport/tab were reset/closed.

### Storefront, Admin, and media data audit rerun (2026-10-27)

- Re-ran the three read-only audits against the configured local database. Storefront and Admin fixture coverage both report 0 failed checks. Storefront has 19 active products, 30 active product-color pairs, 3 banners, 6 required published pages, and all 34 provinces/3,321 wards; Admin has all 9 expected roles and 26 permissions, with 108/108 active published variants linked to inventory.
- The media audit reports 0 missing files, missing alt text, invalid media dimensions/formats/sizes, or generated product-photo references. All 19 product thumbnails and 19 gallery records use the valid neutral pending-photo placeholder; there are currently 0 owner-provided product-color photos. Do not substitute concept/generated clothing imagery; real store photographs are still required for product presentation.

### Storefront guest order-tracking route review (2026-10-27)

- Read-only browser inspection confirms `/track-order` renders the guest tracking form with named order-code and phone/email fields and a lookup action; no customer data was entered or submitted. This confirms the route's initial desktop state only, not a successful or failed API lookup.

### Checkout empty-cart route guard (2026-10-27)

- Read-only runtime review found `/checkout` displayed the delivery form and a zero subtotal when entered directly with an empty cart. Checkout now waits for cart sync, then shows the branded empty-cart illustration and a shopping link once the canonical cart is confirmed empty; expired and failed-cart states retain their recovery/error messages.
- Updated the cart/checkout spec. Storefront lint and production build pass. A second read-only browser review confirms the empty state appears and the delivery form/zero-total summary are gone. No cart/order data was changed; no application servers or tests were run.

### Storefront catalog and product-detail runtime review (2026-10-27)

- Read-only browser inspection of the existing Storefront confirmed `/products?sort=newest` renders 19 API-backed items with the active sort chip and two-page pagination. A product detail route loaded server-provided price/compare price, color variant, stock-dependent size selection, neutral real-photo-pending gallery, tabs, and related product data.
- No cart mutation or order submission was performed. This confirms desktop route/API rendering for catalog and one product, not 320px layout, keyboard operation, checkout, or E2E acceptance; no application process was started/stopped and no tests were run.

### Storefront live desktop accessibility-tree review (2026-10-27)

- Read-only inspection of the existing Storefront tab at `127.0.0.1:5173` shows the API-backed home rendered with hero, seven category links, collections, newest/bestseller product rails, campaign video, newsletter, and published footer links. Product cards expose “Chưa có ảnh thật”; banner/category/collection media use neutral graphic descriptions, so no fake clothing is shown.
- The snapshot confirms accessible names and page landmarks at the current desktop viewport, but does not prove keyboard behavior, 320 CSS-pixel layout, or all routes. No application process was started/stopped and no tests were run.

### Storefront newsletter announcement change verified (2026-10-27)

- Storefront `npm run lint` and `npm run build` both pass after separating newsletter success (`status`) from API submission failure (`alert`). The build emitted no chunk-size warning. No tests or development servers were run.

### Storefront newsletter error announcements (2026-10-27)

- Separated newsletter success and API failure messages into distinct live regions. Successful signup uses a polite `status`; a root submission failure uses an `alert`, while email/consent field errors keep their existing input associations.
- Updated the Storefront home spec. Source review confirms the success and root-error nodes are conditional and have distinct IDs/roles; no tests, build, or app servers were run.

### Storefront implementation plan status synchronized (2026-10-27)

- Reconciled `Káº¿ hoáº¡ch triá»ƒn khai Storefront â€“ Sarada.md` against current routes, feature modules, OpenAPI, media/API audits, and existing progress records. The original 2026-10-26 implementation table is now labeled as a historical baseline; the document now shows implemented areas separately from remaining browser, E2E, accessibility, LCP, authentic-media, and production gates.
- Updated the backend endpoint inventory to reflect the implemented banners, collections, catalog filters, newsletter, locations, and SEO routes. This is a documentation/source reconciliation; no tests or app servers were run.

### Product imagery owner direction reaffirmed (2026-10-27)

- The owner explicitly confirmed that fake clothing must not be used. The current media review board and Storefront mockups use only the neutral pending-photo placeholder for product slots; no garment concept images are included. A stale earlier progress entry claiming six mockup apparel images was corrected.
- Re-ran the read-only media audit against the configured local database: 19 active product thumbnails and 19 gallery records, zero generated product-media references, zero missing files/alts, and a valid neutral placeholder. A8 remains pending real product photos from the store; no app servers or tests were run.

### Admin CMS draft preview sanitization (2026-10-27)

- Source review found the Admin page-content editor preview inserted unsaved HTML directly into `dangerouslySetInnerHTML`. Added the same formatting-tag allowlist policy used by the API and Storefront before rendering the draft preview; unsafe elements are discarded and attributes are stripped.
- Updated the Admin content-page spec and frontend architecture notes. Reviewed the preview call site and sanitizer wiring; no tests, builds, or application servers were run.

### Return-window demo states (2026-10-27)

- The Storefront order fixtures now include a delivered COD order inside the seven-day return window with its pending return request, plus a delivered order fourteen days old to demonstrate the expired customer state. The historical fixture rebases only its delivery/status-history/shipment times on rerun, keeping the rest of the sample order intact.
- Extended the read-only Storefront coverage audit to require both inside-window and past-window orders. Ran the idempotent order demo seeder and audit: 1 eligible + 1 expired delivered order, all Storefront data checks pass with 0 failures (19 products, 30/30 color-gallery pairs, 3 banners, 6 pages, 34 provinces/3,321 wards). PHP syntax and Pint pass for the seeder; no application server or tests were run.

### Admin order-review delivery deadline context (2026-10-27)

- Admin order detail now returns the order-level `delivered_at` field (separate from individual shipment timestamps). The Admin's cancellation/return request panel shows the successful delivery time and seven-day return-request deadline for return cases, or calls out when the order record lacks the delivery time.
- Updated the Admin order-detail OpenAPI schema/types, English catalog entries, and Admin order spec. PHP Pint/syntax, API type generation, and Admin ESLint/production build pass. The existing 554.54 KB entry-chunk advisory remains. No tests or app servers were run.

### Seven-day customer return-request window (2026-10-27)

- Applied the store owner's confirmed seven-day window, measured from `orders.delivered_at` and inclusive of the exact deadline. The API rejects return requests when the delivery timestamp is missing or the deadline has passed; the Storefront order detail exposes the delivery timestamp, shows the deadline/expired state, and hides the return action after expiry.
- Updated OpenAPI and regenerated Admin/Storefront types. Updated the order lifecycle, BR/FR-ORD-004, account UI spec, implementation plan, requirements assumptions, and data-model notes.
- Updated the seeded shipping/returns CMS page to explain the confirmed policy. Seeder upgrades only the exact legacy demo copy, preserving administrator-authored page content. The read-only demo-data audit now checks for this policy copy and passes with 0 failed checks (19 products, 30/30 color-gallery pairs, 3 banners, 6 published pages, 34 provinces/3,321 wards).
- PHP Pint/syntax, Storefront and Admin ESLint/production builds, and OpenAPI type generation pass. The existing Admin 554.54 KB entry-chunk warning remains. No tests or application servers were run; deadline boundary behavior still needs the feature acceptance test, and rendered browser acceptance remains pending.

### Configurable rate limits for media uploads (2026-10-27)

- Added the named `uploads` limiter to Admin media, product images, account avatars, customer reviews, and support attachments. The limiter applies an independent per-IP and per-account ceiling, configurable with `API_UPLOADS_PER_MINUTE` (default 20, clamped to 1â€“120); endpoint-specific throttles remain in place.
- Documented the limit in API OpenAPI 429 responses, security architecture, deployment configuration, and `.env.example`; regenerated Admin and Storefront API types.
- OpenAPI type generation, PHP Pint/syntax checks, API route listing, and both Admin/Storefront lint and production builds pass. Admin retains the existing >500 KB chunk warning. No tests or application servers were run.

### Configurable rate limits for public Storefront APIs (2026-10-27)

- Added `API_PUBLIC_REQUESTS_PER_MINUTE` (default 60, clamped to 1â€“600 per client IP) to public catalog, collection, category/filter, CMS page, location/shipping, cart, checkout, review-read, and Storefront registration-status routes. Existing stricter endpoint-specific limits remain; authenticated cart merge stays outside the public limiter.
- Added matching OpenAPI 429 responses and regenerated Admin/Storefront API declarations; documented both public and media limits in security/deployment guidance and `.env.example`.
- Route listings confirm the named middleware is attached to catalog/cart/location routes. Added optional `TRUSTED_PROXIES` configuration that is empty by default and trusts only explicitly configured proxy addresses, keeping client-IP limits accurate behind a known proxy without accepting arbitrary forwarded headers.
- API types, PHP Pint/syntax, Admin/Storefront ESLint and production builds pass. The existing Admin >500 KB chunk warning remains. No tests or servers were run.

### Storefront/Admin API and media audit rerun (2026-10-27)

- Re-ran the read-only Storefront API fixture, Admin API fixture, and Storefront media audits against the configured database. Each reports 0 failed checks: 19 active products, 30/30 product-color gallery pairs, 3 active banners including a video, all 34 provinces/3,321 wards, 9 Admin roles/26 permissions, and no missing media files, alt text, or invalid media dimensions/formats/sizes.
- The Storefront home spec's remaining manual acceptance gate is still rendered-browser review at 320px plus keyboard navigation; this environment's project workflow leaves app startup and browser acceptance to the user. No tests or servers were run.

### Storefront media review board refreshed (2026-10-27)

- Regenerated `docs/ui-ux/mockups/storefront-assets-review.html` from local API records: 3 banners, 7 category covers, 2 collection covers, 19 demo products, one neutral A3 layout mockup using the pending-photo placeholder, and 11 UI illustrations. No generated clothing images are used for product media; the store still needs to provide real product photos. Opened the board in Codex for visual review.
- Updated the implementation plan and A8 upload note to reflect that `/admin/uploads` now also permits `settings.manage`. A8 approval remains distinct from the approved A3 mockup; seeded product media stays marked as concept/demo until the store reviews it.

### Storefront public logo integration (2026-10-27)

- Exposed the configured `store_logo` through the existing public Storefront configuration endpoint and OpenAPI contract, regenerated Admin/Storefront types, and rendered the logo in the shared Storefront header/footer. Empty or failed logo URLs fall back to the accessible configured store name; the footer copyright also follows that name and current year. Storefront UI spec and API conventions updated. Admin and Storefront ESLint/build pass (Admin retains the known 554.53 KB entry-chunk warning); API types regenerated; PHP Pint/syntax checks pass. No tests or app servers run.

### Storefront public brand settings and assets seeded (2026-10-27)

- The expanded Storefront data audit exposed a missing `store_name` setting in the configured local database. `StorefrontDemoSeeder` now fills only blank public branding/SEO settings (`store_name`, logo, favicon, SEO title/description, and OG image), preserving non-empty operator values. Added the 1200Ã—630 NÃ‰T Studio OG image under API-served demo media and extended API-data/media audits to cover the public brand configuration and its referenced assets. Ran the idempotent Storefront demo seeder; API coverage now has 0 failed checks and the media audit reports 0 missing files, alt-text gaps, or invalid format/dimension/size records. PHP Pint and syntax checks pass; no tests or app server were run.

### Storefront dynamic brand metadata (2026-10-27)

- Added the customer-safe `store_name` to the existing public `/auth/registration-status` configuration response and OpenAPI contract, then regenerated Admin and Storefront API declarations. Storefront product/category/collection title fallbacks and home Organization/WebSite/Product brand JSON-LD now use the configured store name; release-time SEO snapshots use the same value. Updated API and UI specs. Admin and Storefront ESLint/TypeScript/Vite production builds pass; the known Admin 554.53 KB entry-chunk warning remains. PHP Pint and syntax check pass. No tests, app server, or API-backed `build:seo` run. `pint --dirty` was unavailable because this checkout has no Git metadata, so Pint was run directly on the changed controller.

### Storefront SEO sitemap origin validation (2026-10-27)

- The SEO prerenderer now fails with an actionable error when sitemap URLs do not match `STOREFRONT_PRERENDER_SITE_URL`, instead of silently dropping routes. A local API-backed build initially exposed an origin mismatch and generated only two routes; after aligning the local origin, `build:seo` generated all 36 public routes (home, catalog, products, categories, collections, and published pages). The product snapshot retained the neutral pending-photo placeholder and “Chưa có ảnh thật” label; no fabricated apparel imagery was introduced.
- Restored the ordinary SPA output with `npm run build` after the SEO build. Storefront ESLint and production build pass; `storefront/dist` contains one `index.html`. The temporary API process has stopped and ports 5173, 5174, 5175, and 8000 have no listeners. No test suite or customer/admin data mutations were performed. Production SEO output still needs a real deployed Storefront origin aligned with Laravel `STOREFRONT_URL`.

### Storefront customer review photos (2026-10-27)

- Added optional customer photo uploads to the delivered-order review form. The Storefront submits multipart data; validation limits attachments to five JPG/PNG/WebP images, 2 MB each and 4000Ã—4000 pixels. Uploaded images are saved to the public review media path and linked to the review inside a database transaction; files are cleaned up if persistence fails or an admin deletes the review.
- Public approved-review responses now include images with descriptive alt text, and product pages display the approved photos. Updated OpenAPI and regenerated Admin/Storefront types; updated the product-detail page spec. The mockup direction with realistic clothing photography is approved for Phase 2.
- Storefront and Admin lint/build passed; PHP Pint and syntax checks passed; OpenAPI type generation passed. No tests or app servers were run. Rendered-browser upload/moderation/display review remains pending.
- Re-ran read-only API/media coverage audits: Storefront (19 active products, 19 with variant/thumb/gallery coverage, 2 active collections, 3 banners including 1 video, 6 required published pages, 34 provinces/3,321 wards) and Admin fixture coverage both report 0 failed checks. Media audit reports 0 missing files, missing alt text, or invalid format/dimension/size records.

### Storefront browser theme-color (2026-10-27)

- Aligned the first-load browser theme-color with the Storefront's default light palette (`#FBF7F0`), then synchronize the meta tag with the selected appearance palette after hydration and when the user switches theme or palette. Updated the home UI spec. Storefront ESLint and production build pass; no server or tests run.
- SPA navigation now updates `og:url` from the same normalized canonical URL, keeping social metadata aligned with the current product/category/collection/content route. Updated product detail SEO notes; Storefront ESLint and production build pass. No tests or server run.

### Admin account-menu API client consistency (2026-10-27)

- Replaced the account menu's direct `fetch` calls for menu summary, recent items, tracking preference, presence, and logout-all with the shared `adminApiFetch` client. These protected calls now use the configured session refresh/retry behavior and capture API request IDs consistently. Public staff invitation and session reauthentication calls remain on their intentional separate flows.
- Admin ESLint and production build pass; the entry chunk remains 621.67 KB / 176.44 KB gzip with the existing Vite chunk-size warning. No tests or servers were run.
- Consolidated all remaining Admin API endpoint calls in the staff invitation and session reauthentication pages on `adminApiFetch`. The shared client now assigns and captures `X-Request-Id` for authenticated and public requests, including refresh requests, while keeping login/2FA outside automatic refresh. Source scan finds no direct `fetch()` calls in Admin feature code. Admin lint/build pass.

### Admin account-menu deferred loading (2026-10-27)

- Sourcemap attribution showed the eagerly loaded account menu contributed 67.81 KB raw / 16.47 KB gzip to the initial Admin entry. It now loads on click or `Alt+A`, and is prefetched on hover/focus with an accessible fallback trigger. Admin lint and production build pass. The entry fell from 621.71 KB / 176.46 KB gzip to 554.53 KB / 161.12 KB gzip; the Vite >500 KB advisory remains. No browser run or tests.

### Storefront campaign video failure fallback (2026-10-27)

- A campaign video now switches to its API-provided poster image with descriptive alt text when the browser reports a load/playback error; unsupported legacy URL values already render the image directly. The fallback resets when the campaign media URL changes. Storefront ESLint and production build pass; no tests or server run.

### OpenAPI type regeneration and app builds (2026-10-27)

- Regenerated the Admin and Storefront declarations from `api/openapi.yaml` with `npm run api:types`. Admin and Storefront ESLint and production builds both pass against the generated contract; no tests or app servers were run.
- The Admin production build still reports its known 998.87 KB entry-chunk warning; route-controller decomposition remains open.
- Follow-up verification after A3 approval: the read-only Storefront API-data, Storefront media, and Admin API-data audits all report zero failed checks. Current media coverage is 3 banners (including 1 video), 7 category covers, 2 collection covers, 19 product thumbnails, and 49 gallery images; all referenced files, alt text, formats, and dimensions pass. API fixtures include 19 active products, 34 provinces/3,321 wards, 9 roles/26 permissions, inventory for all 108 active variants, and four orders with their operational demo records.
- Re-ran ESLint and production builds for both apps successfully. Storefront's largest entry chunk is 365.76 KB (113.65 KB gzip); Admin's is 998.87 KB (288.82 KB gzip) and retains the Vite large-chunk advisory. No tests or servers were run. Browser-only responsive/keyboard review, Admin report visual review, and production content/policy approval remain open.
- Reduced Admin's initial entry chunk by lazy-loading the password-recovery, error, locked-account, session-reauthentication, and local-lock screens; each route/state has an accessible loading fallback. The app shell no longer downloads these modules eagerly.
- Split the Admin's 3,694-line English translation dictionary into `admin/src/lib/i18n.en.ts` and load it through a local dynamic import only when the saved Admin locale is English. Vietnamese remains the initialized and failure fallback locale; the document language follows the active locale. Added latest-request handling to avoid stale locale changes and documented the behavior.
- `npm run build` in `admin/` passed (including `tsc -b`) after these changes. The English dictionary is now a separate 233.07 KB (69.93 KB gzip) chunk; the main entry fell from 998.87 KB (288.82 KB gzip) to 621.34 KB (176.23 KB gzip), a reduction of 377.53 KB raw / 112.59 KB gzip. Vite still warns because the entry remains above 500 KB. No tests or app/server were run; language switching still needs browser review.
- Re-ran `npm run lint` in `admin/`; ESLint passes after the translation-loader changes. No tests or app/server were run.
- Improved Admin's local frontend diagnostics for S8.3: the bounded, redacted error buffer now records uncaught browser errors and unhandled promise rejections as well as `console.error`. It remains memory-only and is sent only when staff explicitly file a bug report; no automatic third-party telemetry is enabled. Updated `docs/architecture/observability.md`. Admin ESLint and production build (including TypeScript) pass; the main entry remains 621.69 KB / 176.46 KB gzip. No tests or app/server were started.
- Reviewed the Storefront home layout rules for the remaining 320px acceptance item: the header switches to a two-row grid, its search form has shrinkable width, and category/product rails use two `minmax(0, 1fr)` columns. This source inspection found no specific additional overflow defect to fix, but it is not rendered-browser proof; the acceptance item remains unchecked until the user runs the app for manual review.
- Reviewed Admin Reports responsive/themed CSS at source level for its open manual gate: metrics use 4/2/1 columns across 900px/540px breakpoints, report filters collapse to one column below 700px, chart rows shrink below 640px, and cards/charts use semantic shell color tokens. No specific source-level overflow or hard-coded light-theme defect was found. This does not satisfy the rendered 360px/768px/1440px light/dark review; that gate remains unchecked.
- Found that `fashion_store_schema.sql` was behind two migrations already applied to the configured MySQL database. Laravel's `schema:dump` could not run because `mysqldump` is unavailable, so regenerated the schema-only snapshot with read-only `SHOW CREATE TABLE` queries and current migration metadata. It now contains all 81 table definitions and all 60 applied migration records, including `banners.description`, `orders.idempotency_scope`, and migrations 59â€“60. No application rows were exported; the documented 81-table count remains accurate.

### Storefront catalog URL query validation (2026-10-27)

- Validate URL-derived product query parameters against `ListStorefrontProductsRequest` before fetching, including option lengths, integer price/page values, page size, supported sort, booleans, and max â‰¥ min. Invalid or malformed shared links show an inline message and do not send a product request or retain stale placeholder products.
- Storefront ESLint and production build pass; no tests or app server were run.

### Storefront header search validation (2026-10-27)

- Reused the API-aligned 120-character Zod search schema in the global header and catalog search. Header input now validates with React Hook Form, reports an accessible inline error, and remounts on route/query changes to restore the URL-backed query after browser navigation.
- Updated the catalog page spec. Storefront ESLint and production build pass; no tests or app server were run.

### Storefront application entrypoint extraction (2026-10-27)

- Reduced `src/App.tsx` from 105 lines of app-state orchestration to a one-line router entry. Moved feature-hook composition into `src/app/StorefrontApplication.tsx`, keeping route-to-page and shared-shell rendering in `StorefrontRouteContent`; updated the architecture map accordingly.
- Storefront ESLint and production build pass. No tests or app server were run.

### Storefront catalog filter forms (2026-10-27)

- Replaced the desktop and mobile catalog filter `FormData` handlers with a shared React Hook Form + Zod form. It validates nonnegative integer VND bounds, max â‰¥ min, supported sort values, and API length limits before updating the URL; inline accessible field errors keep the mobile sheet open, while closing the sheet retains its draft.
- Updated the catalog UI spec. Storefront ESLint and production build pass; no tests or app server were run.

### Storefront catalog-search validation (2026-10-27)

- Replaced the catalog page's unvalidated search submission with React Hook Form + Zod. Queries are trimmed and capped at the Storefront API's 120-character limit; an accessible inline error prevents invalid navigation. Header search and browser URL/back-forward synchronization remain unchanged.
- Updated the catalog UI spec. Storefront ESLint and production build pass; no tests or app server were run.

### Storefront campaign-video caching (2026-10-27)

- Closed an S8.1 deployment gap: the Storefront Nginx example now applies the existing one-day cache policy to public MP4/WebM files alongside unversioned images and fonts. Documented the static media cache behavior in deployment guidance. This supports banner video assets while preserving immutable caching only for Vite-fingerprinted `/assets/` files.
- No server or tests were run; Nginx syntax validation still requires the deployment Nginx environment.

### Storefront release-data audit (2026-10-27)

- Re-ran the read-only data audits against the current configured database: Storefront coverage has 0 failed checks (19 active products, 30/30 color pairs with gallery images, 3 banners including video, 7 category covers, 2 collection covers, 6 published pages, and all 34 provinces with 3,321 wards); Admin coverage has 0 failures (9 roles, 26 permissions, inventory on all 108 active variants, four complete demo orders, and workspace fixtures); media audit found no missing files, alt text, or size/format/dimension failures.
- The 14-palette light/dark text and control-boundary contrast audit passes. Storefront ESLint and production build pass; no tests or app server were run.

### Storefront order-review form validation (2026-10-27)

- Moved customer review validation and draft state into the order detail form with React Hook Form + Zod. It enforces an eligible purchased item, rating 1â€“5, title up to 160 characters, content up to 5000 characters, and at least one of title/content. API failures stay on the form with the draft intact; success resets the form and updates the private review status cache. Navigating to another order remounts the form and clears the prior draft.
- Updated the account page spec. Storefront ESLint and production build pass. No tests or app server were run.

### Storefront coupon form validation (2026-10-27)

- Converted the cart coupon field to React Hook Form + Zod with trimmed input and the API's 100-character limit. Invalid input now has an accessible inline error; quote requests still use current cart/province context, stale-response protection, and server-calculated discounts/shipping.
- Storefront ESLint and production build pass. No tests or app server were run.

### Storefront address-book form validation (2026-10-27)

- Converted the delivery-address form to React Hook Form + Zod. Client checks now mirror the API's recipient, Vietnamese phone, province/ward, and street constraints; province changes clear the dependent ward and related server errors. API field validation remains visible inline with accessible error associations, and existing address CRUD/cache behavior is retained.
- Storefront ESLint and production build pass. No tests or app server were run.

### Storefront customer authentication forms (2026-10-27)

- Moved login, registration, forgot-password, and password-reset forms onto React Hook Form + Zod. Login/register/reset now show inline field errors linked with `aria-invalid`/`aria-describedby`; registration and reset use the API's current password policy, confirmation, and terms validation. API error messages, generic non-disclosing recovery responses, safe post-login redirect, password strength/checklist, and verification/reset resend countdowns remain intact. Storefront ESLint and production TypeScript/Vite build pass; no tests or server were run.

### Storefront color-specific demo gallery coverage (2026-10-27)

- Extended the read-only Storefront API data audit to compare every active product/color variant pair against `product_images.color_value_id`. It exposed only 5/30 pairs linked. Updated `StorefrontDemoSeeder` to retain and associate the existing matching color SVG illustrations alongside shared concept photos, without touching operator-uploaded media; the product detail gallery now labels those assets “Hình minh họa màu”. Re-ran the seeder and audited the configured database: all 30/30 product/color pairs have gallery media, all 49 product image records have alt text and files, all media constraints pass, and the API coverage audit has zero failures. Storefront ESLint and production TypeScript/Vite build pass. These remain labeled concept/illustration assets, not verified product photography.

### Admin support inbox build validation (2026-10-27)

- Admin ESLint found an unused local `Ticket` type after the support inbox moved to generated OpenAPI types; removed the stale alias. Admin ESLint and the production TypeScript/Vite build now pass. The build regenerates 545 third-party license notices and retains the existing 1.1 MB entry-chunk warning, so broader Admin shell/code-splitting work remains open. No tests or app server were run.
- Followed the bundle warning by lazy-loading account, order, inventory, review, shipment, dashboard, filter, product-list, and table components that are only needed on their feature routes or after opening a dialog. The product table/grid now lives in a route-lazy `ProductListPanel`, with shared typed product rows. The generic table keeps its row/column inference through a typed lazy wrapper; a shell Suspense boundary covers the dialogs. Admin TypeScript, ESLint, and production build pass. The entry chunk fell from 1,114.70 KB to 998.87 KB, and the table is emitted as a separate 56.25 KB chunk. The entry still exceeds 500 KB; extracting the large route controller and browser runtime review remain open.

### Storefront product detail tabs (2026-10-27)

- Replaced the three collapsed product-information disclosures and the detached review section with four Details, Materials & care, Shipping/returns, and Reviews tabs. The tablist supports Left/Right Arrow and Home/End, updates selected-tab/panel ARIA relationships, and keeps the shipping CMS query lazy until its tab is selected. The review module stays lazy until Reviews is selected.
- Updated the product-detail UI spec. Storefront ESLint initially surfaced an existing synchronous search-state update inside an effect; replaced it with URL-derived search state plus a route-scoped draft setter, preserving back/forward synchronization without the cascading render. Storefront ESLint, TypeScript project compilation, and the production Vite build pass; the 14-palette light/dark token contrast audit also passes. No tests or app server were run, so rendered behavior and the separate 320px home-page acceptance item remain to be reviewed in a running browser.

### Support-ticket API contract and Admin types (2026-10-27)

- Corrected the OpenAPI support-ticket paths to describe their actual Admin-audience use, status/pagination filters, and concrete JSON responses for lists, conversations, messages, contact data, assignees, ticket updates, and private file downloads. Added shared schemas and regenerated Admin and Storefront TypeScript declarations with `npm run api:types`.
- Admin's support inbox now uses generated ticket/message/attachment/contact/assignee types and sends ticket status/assignment updates as the documented JSON `PATCH` rather than a multipart method override. Route authorization remains Admin-only; no Storefront/customer audience was added. Type generation succeeded; no app build or tests were run.

### API request failure correlation logs (2026-10-27)

- The request-correlation middleware now emits structured `api.request.failed` entries for 5xx responses with the returned request ID, method, route name, status, and elapsed milliseconds. It deliberately omits request payloads and query strings. Static review also confirms credentialed CORS exposes `X-Request-Id` to Admin and Storefront clients. Updated observability guidance; `php -l` passes, but no application runtime or log-channel verification was run.

### Current demo media and API coverage audit (2026-10-27)

- Updated `docs/architecture/frontend-architecture.md` to describe the neutral pending-photo placeholder. Fixed the release-time SEO prerenderer so home/product snapshots use the same “Chưa có ảnh thật” and “Ảnh đồ họa” badges as the interactive Storefront, including accessible card labels; legacy alt text remains identified when encountered. `node --check storefront/scripts/prerender-seo.mjs` passes. With the API already running, `build:seo` generated 36 routes; 20 product snapshots all include the real-photo-pending disclosure, and the home snapshot includes both disclosure labels.
- Read-only browser review of the already-running Storefront confirmed API-backed homepage products, neutral category/collection graphics, a campaign video, and the pending-photo badge on the product detail page. The rendered page shows the expected variant-dependent size selector and server-provided prices. This is desktop source/runtime review, not 320px or keyboard acceptance.
- The refreshed media board exposed legacy category/collection alt text that still described generated clothing despite the neutral replacement images. Fixed the idempotent Storefront seeder to recognize known legacy “Ảnh concept demo” alt text only on demo-media records, preserve other operator-authored alt text, and replace the outdated labels with neutral-graphic descriptions. Re-seeded the local data, regenerated the board, and verified the board no longer contains the old clothing alt text. Added a regression check to the media audit that fails if demo assets keep legacy concept alt text; PHP Pint/syntax and the Storefront media/API data audits pass with zero failed checks.
- User clarified on 2026-10-27: do not use fake clothing. Replaced Storefront demo product imagery with a neutral “real photo pending” placeholder, changed campaign/category/collection media to neutral graphics, and changed the approved A3 mockups to use the placeholder. Removed unused generated apparel photos/illustrations and their responsive-source generator. Reseeded the local demo database while preserving operator-uploaded media. The Storefront media and API coverage audits both report zero failed checks; no generated product photos remain referenced. A8 remains open until the store supplies and reviews authentic product media.
- Re-ran the Storefront media and API coverage audits after removing fake clothing assets and reseeding. Media has 3 banners, 1 video, 7 category covers, 2 collection covers, and 19 pending-photo product gallery records; no missing alt text, files, or size/format/dimension failures. API data has 19 variant-complete products, 7 categories, 2 collections, 6 required published CMS pages, valid checkout/shipping fixtures, reviews and order-change states, and 34 provinces with 3,321 wards; zero failed checks. Admin data has all 9 roles/26 permissions, inventory for 108/108 active variants, workflow/order fixtures, and zero failed checks. These audits verify local demo-data coverage, not live browser-to-API flows.
- Re-ran `npm run lint` and `npm run build` in both `storefront/` and `admin/` after the media changes; both passed. Admin still emits a 554.54 KB entry chunk and Vite's large-chunk advisory. No tests or servers were run. Browser UAT, 320px overflow/keyboard review, production API deployment, and authentic store media remain outstanding release gates.
- Re-ran the read-only Admin API fixture audit after the Storefront reseed: all 9 roles/26 permissions, inventory for 108/108 variants, 4 order/payment/history fixtures, staff/workspace/support fixtures, and exports are present; 0 failed checks. The root `npm run dev` script is configured to launch API, Admin, Storefront, queue, and scheduler together; it was not started because the user requested control of project startup.
- Reconciled the asset plan and Storefront home spec with the no-fake-clothing decision: A7 now calls for a neutral pending-photo frame, not garment illustrations, and the home media disclosure describes neutral graphics/placeholders. Corrected the asset workflow documentation to list actual banner/video dimensions and limits, then regenerated the review board and confirmed the generator passes `php -l`.
- Re-generated Admin and Storefront API declarations from `api/openapi.yaml` with `npm run api:types`; both generation steps succeeded. Rebuilt both SPAs against those generated declarations; both passed `tsc -b` and Vite production builds. Admin continues to emit the 554.54 KB chunk advisory.

### Storefront SEO route audit (2026-10-27)

- Source review confirms the Laravel app serves `/robots.txt` and `/sitemap.xml`; the Storefront Nginx example proxies those exact paths to Laravel instead of letting the SPA fallback return `index.html`. `useStorefrontSeo` supplies route-level titles/descriptions, canonical URLs, robots meta, and Organization/WebSite, Product, WebPage, or CollectionPage JSON-LD. This is source evidence only: Nginx syntax and live crawler responses remain unverified because no local web server is running.

### Storefront keyboard navigation entry (2026-10-27)

- Added a visible-on-focus skip link before the shared announcement/header and a focusable, named route-content target. Keyboard and screen-reader users can bypass repeated navigation and start at the current page body; focus styling follows the active palette.
- Updated the home-page checklist to separate implemented keyboard semantics from the remaining live-browser check at 320 CSS pixels. This is source-level evidence only; rendered overflow and keyboard usability still need review in a running Storefront.

### Storefront theme contrast audit (2026-10-27)

- Ran the read-only theme contrast audit for all 14 palettes in light and dark mode. Text/link combinations meet 4.5:1 and computed control boundaries meet 3:1. This validates configured theme tokens only, not every rendered component or screenshot.

### Storefront homepage merchandising filters (2026-10-27)

- Connected the “new products” rail to the API `new=1` filter and the best-seller rail to `best_seller=1` while retaining newest/sold-count sorting. This prevents either homepage rail from filling with items that do not have the matching merchandising flag. Updated the home page spec. No tests or frontend checks were run.

### Storefront/Admin demo and media audit (2026-10-27)

- Re-ran all three read-only demo audits. Storefront media: 3 banners, 1 video, 7 category covers, 2 collection covers, 19 product thumbnails, and 24 gallery images; no missing files/alts or size/format/dimension failures. Storefront API data: 7 categories, 1 brand, 19 variant-complete products, 2 collections, 3 banners, 6 published pages, 3 shipping rates, 6 new products, 18 best sellers, review/order-change states, 34 province/3,321 ward records, and zero failed checks. Admin API data: all 9 roles/26 permissions, inventory for 108/108 variants, histories/payments/shipments, local workflow fixtures, retry-safe failed job, and ready export; zero failed checks. These are demo-data audits, not runtime or end-to-end verification.

### Storefront browser-storage security audit (2026-10-27)

- Static search confirms the API access token is held in module memory and not written to Web Storage. Persisted values are limited to appearance preference, password-reset email/resend cooldown in session storage, and the guest-cart identifier; refresh credentials use the credentialed httpOnly-cookie API flow. No code changes or tests were needed for this audit.

### Nginx cache header cleanup (2026-10-27)

- Removed `expires` where the Storefront locations already set an explicit `Cache-Control`; cache lifetimes and `immutable` behavior remain encoded in the single explicit header. Nginx documents that `expires` also writes `Cache-Control`. Config syntax/runtime remains unverified because Nginx is unavailable.

### HSTS for Admin and Storefront Nginx (2026-10-27)

- Added a one-year HSTS response header to the shared HTTPS security-header snippet used by both app hosts. `includeSubDomains` and preload are intentionally absent because domain ownership and HTTPS readiness for every subdomain are deployment-specific. No Nginx runtime was available for verification.

### Admin Nginx release configuration (2026-10-27)

- Added an Admin static-site Nginx example with HTTPS redirect, SPA fallback, no-cache HTML, immutable Vite assets, short-lived public image caching, and the shared CSP/security-header snippet. Updated deployment guidance for both app origins and credentialed CORS. Nginx is unavailable in the workspace, so syntax/runtime was not checked; no tests were run.

### Storefront Nginx security-header inheritance (2026-10-27)

- Fixed the release Nginx example so its security headers remain present on SPA routes, `index.html`, fingerprinted assets, and public images even when those locations add their own cache headers. Extracted the policy into an installable snippet and documented the deployment copy step and API-origin replacement. Nginx syntax/runtime was not checked because Nginx is not installed in this workspace; no tests were run.

### Storefront forbidden-route illustration (2026-10-27)

- Added a dedicated access-denied SVG and selected the not-found, access-denied, or connection illustration by route status. Updated the storefront home/error-state spec. No tests or visual checks were run.

### Storefront not-found and API error states (2026-10-27)

- Added matching not-found or connection illustrations to missing category, product, and public-content states, and added connection art to collection-loading errors. Product 404 states now visibly receive the not-found illustration despite using an alert role. Updated the home page spec. No tests or visual checks were run.

### Storefront account empty states (2026-10-27)

- Added dedicated SVG illustrations for empty orders, wishlist, and address-book states. The empty order list now offers a direct catalog action. Updated the account page spec. No tests or visual checks were run.

### Storefront connection error illustrations (2026-10-27)

- Added a dedicated connection-error SVG and used it for failed banner loading, catalog API errors, and unexpected route failures. A 403 remains a permission state and 404 keeps its not-found illustration. Updated the Storefront home spec. No tests or visual checks were run.

### Storefront mobile navigation overflow (2026-10-27)

- Made the modal navigation sheet scroll internally for long category/collection lists and added top/bottom device safe-area padding. Updated the home page spec. The narrow-phone and keyboard acceptance item remains unchecked until visual/manual review; no tests or servers were run.

### Storefront search history synchronization (2026-10-27)

- Initialized the header search draft from React Router's current URL and synchronize it whenever the query string changes, so browser back/forward restores the visible search text along with catalog results. Removed a duplicate synchronization effect from the route renderer so only `App` owns this state. Updated the catalog page spec. No tests or frontend checks were run.

### Storefront account settings query state (2026-10-27)

- Replaced manual profile/session loading in `AccountSettingsPage` with a customer-scoped TanStack Query. The query supports request cancellation and exposes a retryable error state.
- Profile/email/avatar updates write to the cached account data; password/session changes invalidate it. Logout and account deletion clear the private query. Updated the account page spec and frontend architecture map. No tests or frontend checks were run.

### Admin operations demo downloads and failed jobs (2026-10-27)

- Added a local/testing-only `failed_jobs` fixture backed by `DemoNoopQueueJob`, so the Admin failed-queue list has a reviewable row and retrying it performs no application or external writes. The seeder is idempotent and skips the fixture if the configured failed-jobs table is absent.
- Added an idempotent ready `admin_report` export with a private local CSV containing two fictional SKUs. The fixture gives Admin Downloads a ready row and a real file for its authenticated download endpoint, without exporting customer, inventory, or order data.
- Extended the read-only Admin API data audit to confirm the no-op job payload, unexpired export record, exact stored file size, and both fictional rows. Updated the asset tooling documentation. Seeded `AdminWorkflowDemoSeeder` twice in `local`; audit reports one failed-job fixture, one ready export, and zero failed checks. PHP syntax and Pint passed. No tests or servers were run.

### Admin dashboard lazy presentation module (2026-10-26)

- Moved the dashboard's revenue chart, status/payment/stock breakdown, recent orders, and top-products widgets out of `admin/src/App.tsx` into `admin/src/features/dashboard/DashboardWidgets.tsx`; the shell now lazy-loads this presentation module only when dashboard widgets render. API queries, range selection, permission checks, and mutation behavior remain in the app shell.
- Admin ESLint and production build pass after extraction. The dashboard widget chunk is 10.79 KB (3.32 KB gzip); the entry chunk decreased from 1,128.60 KB to 1,118.69 KB (309.71 KB gzip), so the existing >500 KB warning remains and requires broader shell decomposition. No tests or runtime/screenshot checks were run.
- Continued product-route decomposition: moved the responsive product-card grid into `admin/src/features/products/ProductCardGrid.tsx` and shared thumbnail fallback into `ProductThumbnail.tsx`; the grid is lazy-loaded while the list table can reuse the lightweight thumbnail. Targeted ESLint and TypeScript/build pass. The product grid chunk is 4.34 KB (1.63 KB gzip), and the entry is now 1,114.70 KB (308.68 KB gzip); Vite's large-entry warning remains. No tests or runtime/screenshot checks were run.

### Storefront demo-media review board (2026-10-26)

- User approved the revised mockup with more recognizable apparel imagery as the visual direction for Phase 2. This satisfies the A3 mockup gate; it does not approve the separate demo-media batch below as production/store content.
- Fresh post-approval verification: `npm run lint` and `npm run build` passed in both `storefront/` and `admin/`. Storefront's largest emitted JavaScript chunk is 365.65 KB (113.61 KB gzip). Admin builds successfully but still emits its existing 1,128.60 KB entry chunk (312.27 KB gzip) and Vite's >500 KB advisory; this is a performance follow-up, not a build failure.
- Re-ran `php tools/assets/audit-storefront-media.php`: 3 banner images, 1 campaign video, 7 category covers, 2 collection covers, 19 product thumbnails, and 24 gallery images are referenced; every file and alt is present and media constraints pass.
- Read-only queries against the configured local database confirmed demo records for the storefront/Admin catalog and order flows: 7 categories, 1 brand, 19 products, 108 variants, 24 gallery images, 2 collections, 3 banners, 6 pages, 1 coupon, 3 shipping rates, 1 newsletter subscription, 4 orders, 4 order items, 2 order-change requests, 2 reviews, 1 wishlist row, and 1 saved address. All registered migrations currently report `Ran`.
- Added `tools/assets/generate-storefront-media-review.php` and generated `docs/ui-ux/mockups/storefront-assets-review.html`, showing banner/video, category/collection covers, product concept images, the approved A3 mockup concepts, and UI illustrations. The board reads demo records only and does not update database records or upload files. A8 review of this separate media batch remains pending.

### Storefront catalog price-range validation (2026-10-26)

- The catalog now keeps the desktop filter or mobile Sheet open when the maximum price is below the minimum and shows an inline Vietnamese validation message. Direct/shared URLs with a reversed range also show that explanation, while `GET /products` enforces the same `price_max >= price_min` rule and returns 422; OpenAPI documents the contract.
- Updated the catalog page spec and API conventions. No tests or frontend checks were run, following the repository instructions.

### Storefront private review status on order details (2026-10-26)

- Authenticated order details now include each order item's review moderation status, while public guest tracking omits that field and no response exposes staff moderation notes. The Storefront shows pending/approved/rejected status, removes already-reviewed items from the review selector, updates its query cache after submission, and scopes draft state to the current order.
- Updated OpenAPI, generated client types, and the account page spec. Pint and API type generation were run; no tests or frontend build were run.

### Storefront checkout requires a current quote (2026-10-26)

- Checkout no longer presents the local cart subtotal as a final grand total. The COD submit button remains disabled until a fresh server quote is available, and its label explains whether a shipping province or quote is still needed.
- Updated the cart/checkout page spec. No tests or frontend checks were run, following repository instructions.

### Storefront responsive review mockup

- Added `docs/ui-ux/mockups/storefront-review.html`, a standalone interactive preview for home, catalog, product detail, cart, and COD checkout. Reviewers can switch between desktop/mobile layouts; it uses existing demo-media assets and clearly labels product art as illustration rather than real product photography.
- The revised mockup was approved by the user on 2026-10-26, satisfying A3 and allowing Phase 2 implementation to proceed. The approved concept imagery remains mockup-only; production product photography and uploaded campaign assets still require separate review.

### Storefront approved home direction implementation (2026-10-26)

- Narrow-screen source review found that the 380px header rule compressed the logo, menu, search, appearance, account, and cart into one row, which could overflow the 320px minimum viewport. Changed the header to a two-row grid at 380px and below, giving search the remaining width; documented the layout in the home spec. This is source-level remediation only: visual and keyboard review remains pending because no server was started.
- Applied the approved editorial mockup direction to the real Storefront home page: serif display type, a shorter two-column desktop hero, more compact category/collection spacing, and mobile image-first hero stacking. Styles are scoped to the home page marker so other routes retain their existing layout.
- Added a narrow-screen header adjustment for widths below 380px, including the search field, theme control, and mobile category trigger, to support the spec's 320px viewport target.
- Updated the home-page specification with the approved responsive behavior. Storefront lint and TypeScript/Vite `build:seo` pass, including all 36 API-backed route snapshots. No tests were run; the app was not started and no screenshot-based visual verification was performed.
- Fixed theme inheritance across Storefront by applying the selected palette's text token to the store root and using palette surfaces for the home hero, story panel, and collection cards. The 14-palette light/dark contrast audit passes; Storefront lint and the 36-route SEO build pass. No tests or screenshot-based visual verification were run.
- Ensured crawler snapshots receive the same theme/layout CSS before JavaScript by loading shared `App.css` and `Home.css` from the Storefront entry and wrapping snapshots in the default light `.store` shell. Verified that the root stylesheet contains the home selectors, the snapshot includes the shell and concept labels, and `build:seo` still generates 36 public routes. Updated frontend architecture notes; lint, the 14-palette contrast audit, and SEO build pass.
- Re-ran the read-only demo-media audit against the configured database: 3 banner images, 1 video, 7 category covers, 2 collection covers, 19 thumbnails, and 24 product-gallery images are referenced; all records/files, alt text, responsive product sources, formats, and size/dimension constraints pass. Product-detail release snapshots now show visible concept badges on gallery images while retaining their alt text.
- After approval of the revised apparel mockup, audited Phase 2 against the home-page acceptance spec: search, collection/account/cart navigation, API newsletter submission, published-page footer links, and section loading/empty/error handling are implemented. Marked those three criteria complete; narrow-screen/keyboard usability remains open pending visual/runtime review.
- Expanded the responsive header breakpoint to 1160px so tablet and narrow-laptop layouts use the existing navigation dialog instead of squeezing the full desktop link row beside all header controls. Updated the home-page spec; visual/runtime review remains pending.
- Re-ran the read-only storefront data and media audits after the mockup approval: all 19 active products have variants and gallery/thumb media; the database has 7 categories, 2 active collections, 3 banners (including one video), 6 published pages, 6 new arrivals, 18 best sellers, and coverage for all 34 provinces/3,321 wards. Both audits report zero failed checks or missing media files.
- Strengthened the API demo-data audit to require the six specific CMS pages used by the home/footer and product-detail flows (`about`, `shipping`, `size-guide`, `contact`, `privacy`, `terms`), not merely any published page. PHP syntax validation and the expanded read-only audit pass; all six slugs are published. No tests were run.
- Aligned that read-only audit with API visibility rules: categories come from the active category tree, brands must back a published product, and banners, collections, and the demo coupon must be inside their current publication windows. PHP syntax validation and the audit pass with zero failures. This prevents future schedules or inactive/orphan records from falsely passing the demo-data gate.
- Made credentialed CORS configuration explicit in `api/.env.example`, documented that production must list exact Admin/Storefront origins, and trimmed whitespace from each comma-separated origin so formatting spaces do not cause silent browser CORS failures. PHP syntax validation passes; no servers or tests were run.
- Added a guarded browser-storage helper and routed guest cart-token, appearance-preference, and password-recovery convenience storage through it. Storefront now keeps working with in-memory state when browser storage is denied; access tokens remain memory-only. A source scan confirms no feature directly accesses browser storage outside the helper. No frontend checks or tests were run.

### Storefront brand and social preview defaults

- Replaced the Vite favicon with a NÃƒâ€°T Studio mark and added a 1200Ãƒâ€”630 SVG social preview image. The static HTML now includes Open Graph/Twitter defaults, theme color, and brand title/description.
- Storefront keeps API-provided SEO settings when configured and falls back to the local brand defaults when those settings are empty. Client navigation now maintains a route-level canonical URL without query parameters. JSON-LD remains active in the client app, and S7.3 now includes release-time HTML prerendering through `npm run build:seo` (ADR-0016). The regular build and live 36-route SEO build both pass; no tests were run.

### Storefront sitemap and crawler instructions

- Added Laravel `/sitemap.xml` with the storefront home URL and `lastmod` values for active products/categories, in-window active collections, and published content pages. `/robots.txt` points crawlers to the storefront's proxied sitemap URL. The sitemap uses configured `STOREFRONT_URL`, escapes XML values, and caches generated URLs briefly.
- Category sitemap entries now retain their category query in the canonical URL. Documented that production hosting must proxy the storefront's root SEO paths to Laravel. Pint and route registration pass; Storefront production build passes. Crawler-oriented rendering is now provided by the release snapshots described above. No tests were run.

### Storefront JSON-LD and product SEO fields

- Exposed stored `meta_title` and `meta_description` on public product resources and in OpenAPI, then regenerated Admin/Storefront API types. Product and collection pages now update title, description, canonical URL, and Open Graph/Twitter image from their public content; category canonicals retain the category filter.
- Home publishes Organization/WebSite/SearchAction JSON-LD; product detail publishes schema.org Product/AggregateOffer with VND price range and live availability. Crawler-readable initial HTML is generated by `npm run build:seo`. Pint, OpenAPI type generation, and Storefront build pass; no tests were run.

### Storefront empty and confirmation illustrations

- Added five original SVG illustrations for empty cart, no search results, missing product, order success, and email verification. Wired decorative artwork into cart/catalog/product-not-found/order-success and account email settings; descriptive text and actions remain available to assistive technology.
- Updated cart/checkout UI notes. These assets are interface illustrations and do not represent the real garments. Storefront build passes and copies all five illustrations to `dist/illustrations/`; no tests were run.

### Storefront Nginx release configuration

- Added `deploy/nginx/storefront.conf.example` for HTTPS redirect/TLS, static Vite hosting with SPA fallback, immutable cache headers for hashed assets, short caching for unversioned media, and FastCGI forwarding of `/robots.txt` and `/sitemap.xml` to Laravel.
- Documented the required domain, certificate, filesystem, PHP-FPM, `APP_URL`, `STOREFRONT_URL`, and build-time `VITE_API_URL` substitutions in the deployment guide. Configuration is a deployment template and has not been run through `nginx -t` because deployment paths/certificates/upstream are environment-specific.

### Storefront CMS and browser security

- Confirmed CMS page content is sanitized during admin save and again in the Laravel page resource. Added matching client-side DOM allowlisting immediately before Storefront renders CMS markup, removing event attributes, scripts, embeds, SVG, and unsupported elements.
- Added a production Content Security Policy to the Nginx template and documented the required API-origin substitution. Storefront production build passes; no tests were run.

### Storefront demo brand media

- Added a vector NÃƒâ€°T Studio brand logo at `api/public/demo-media/brands/net-studio.svg`. `CatalogSeeder` now sets this demo logo only when the brand record has no logo, preserving any real/admin-uploaded logo.
- Pint passed; re-ran `CatalogSeeder` successfully and confirmed the configured local DB now serves the logo URL from `APP_URL`. No tests were run.

### Storefront order cancellation and return request dialog

- Replaced the browser prompt with an accessible native dialog using React Hook Form and Zod validation (3Ã¢â‚¬â€œ1,000 characters), visible API errors, and explicit close/submit actions.
- Kept the API/business-flow eligibility: cancellation requests before shipment (`pending`, `confirmed`, `processing`) and return requests after delivery (`delivered`, `completed`); staff review remains authoritative. Updated the account spec and S6.3 plan wording to match the order lifecycle.
- Storefront TypeScript/Vite production build passes. No tests were run.

### Storefront variant-specific demo media

- Added color-specific SVG illustrations for the seeded product/color combinations and changed `StorefrontDemoSeeder` to attach them to `product_images.color_value_id`, while keeping each product's shared image as the primary fallback. All 30 active seeded product/color pairs now have a matching image association.
- Re-ran the idempotent storefront demo seeder. The local database now has 49 product images (19 shared primary illustrations + 30 color-specific illustrations); all 30 media URLs resolve to files under `api/public/demo-media`. Banner desktop/mobile, collection banners, 7 active category covers, and the campaign MP4 are already present and referenced by the seeded records. Pint passes; no tests were run.

### Storefront checkout location selectors

- Checkout and the signed-in address book now use public province and ward catalog endpoints backed by the shared official catalog. Saved addresses prefill the selector; historic district-based codes remain readable and editable, while new address writes use two levels.
- Checkout API validates province/ward pairs and resolves names server-side in order snapshots. The local migration is applied and the SQL snapshot reflects nullable `addresses.district_code`; the checkout Storefront TypeScript/Vite production build passes. No tests were run.

### Storefront checkout form validation

- Replaced manual checkout field state with React Hook Form and a Zod schema for recipient, Vietnamese phone, optional email, address, coupon, and note. Client validation is displayed beside the relevant field; API validation for checkout fields maps back into the same form.
- Guest checkout and the COD method remain available. Storefront build passes after form integration. No tests were run.

### Storefront order success and tracking handoff

- The success route now uses the plan's `/checkout/success/:code` path while retaining `/order-success/:code` as an alias. It shows the order code and server-returned COD amount, and links to the existing code-and-phone tracking flow with the code prefilled.
- Documented the actual order-placement response payload in OpenAPI. `npm run api:types` and Storefront/Admin production builds pass; Admin reports its existing large main-chunk advisory. No tests were run.

### Storefront canonical cart and stock recovery

- Cart reads, add, merge, quantity changes, and removal now use full canonical cart responses so cached presentation cannot retain stale price, stock, image, or variant values. A successful sign-in merge is followed by a read of the authenticated cart.
- Cart loading and API failures are explicit with retry. If live stock drops below the quantity already in the cart, the line shows the mismatch, can be reduced directly to available stock, and checkout remains blocked until resolved; rejected quantity changes refresh stock from the API.
- Storefront production build passes after these changes. No tests were run.

### Storefront catalog filter facets

- Added public `GET /catalog/filter-options`, which returns distinct brands, sizes, and colors that are used by published products and active variants. This avoids silently omitting filter values beyond the first 48 catalog products.
- Connected catalog controls to the facet query with retry feedback, documented the endpoint in OpenAPI, and included relevance sorting for searches. API types were regenerated; Pint and route registration checks pass; Storefront/Admin builds pass. No tests were run.

### Storefront two-level address schema

- Applied `2026_10_26_045823_make_address_district_code_nullable` to the configured local MySQL database. Laravel reports the migration as `Ran`, and schema introspection confirms `addresses.district_code` is nullable.
- Updated `fashion_store_schema.sql` to reflect the migrated column definition. This verifies the address-schema delta; it is not a fresh full-schema dump comparison.

### Storefront checkout idempotency

- Replaced the per-click order key with a key tied to the submitted customer/address/coupon/note payload and cart snapshot. Network retries reuse it; any payload/cart change rotates it. The submit button now blocks duplicate in-flight requests and reports its busy state.
- Bound checkout idempotency replay to the authenticated user ID or guest cart token, storing only a SHA-256 digest in `orders.idempotency_scope`. Replays from a different scope, and legacy orders without a scope, return not found. The migration is applied to the local database and the SQL schema snapshot includes the new column.
- Updated the checkout acceptance spec and OpenAPI/docs. PHP formatting and syntax checks passed; no tests were run.

### Storefront product detail API and variant selection

- Product details now load directly by slug instead of relying on the currently paginated catalog results. Added explicit loading, retry, and not-found screens.
- Variant color swatches, selected-variant price/compare price, stock status, and a keyboard-editable quantity control now stay connected to API stock. Gallery has previous/next controls and size guidance uses a dismissible native dialog.
- Added `color_value_id` to product image and variant responses, documented it in OpenAPI, regenerated Admin and Storefront API types, and taught the gallery to combine selected-color media with shared product images. The demo seeder now supplies a matching illustration for each seeded product/color combination.
- Cart updates now wait for the API response; failures stay visible beside the add button and preserve the selected variant and quantity.
- Added a mobile purchase bar that appears when the main button scrolls out of view, reflects current price and selected variant, respects safe-area insets, and hides while product controls have focus.
- `npm run api:types`, Pint for the changed API resource, and the Storefront TypeScript/Vite production build passed; no tests were run.

### Storefront video banner and admin media integration

Added optional `banners.video_url` with a new migration, exposed it from public and admin banner resources, and added editable URL plus playback preview in the Admin banner form. Added seeded editorial MP4 to the `campaign` banner; Storefront now plays it with the campaign image as poster and image fallback. Aligned Admin's banner position filters and reorder validation with the seeded `hero`, `hero-mobile`, and `campaign` values so those records can be viewed and reordered. Updated OpenAPI, generated types, ERD/data-model docs, and the SQL snapshot. Applied migration and demo seeder; confirmed the DB has the campaign video URL and no pending migrations. Pint and Admin/Storefront production builds passed. No tests were run.

### Admin build recovery

Restored the Admin production build by correcting the catalog form schema inference, wiring the operations column definitions and translation context, fixing string page-size state, translating the sidebar and payment payload labels in component scope, making the VAPID application key an owned `ArrayBuffer`, and aligning the Admin user type with the API's timezone field. `rtk npm run build` in `admin/` now passes TypeScript and Vite. Vite still reports the existing >500 kB main-chunk advisory. No tests were run.

### Storefront newsletter API (Phase 1 B1.4)

Added a public, rate-limited `POST /api/v1/newsletter/subscriptions` endpoint. It validates and lowercases email, requires explicit consent, persists consent time in a uniquely indexed `newsletter_subscriptions` table, and returns the same generic accepted response for duplicate submissions. Replaced the home page's fake-success toast with a TanStack Query mutation form showing validation and network errors. Updated OpenAPI and generated admin/storefront types, data-model/ERD docs, the SQL-only schema snapshot, and this progress record. Applied migration `2026_10_26_041059_create_newsletter_subscriptions_table` to the local database. Pint passed; storefront production build passed. No tests were run, per repository instructions.

### Account menu hierarchy

- Restored the flat admin sidebar navigation. The account menu now shows its existing profile, frequent, account, notification, workspace, appearance, data, quick-navigation, system, creation, store, and help groups as expandable sections on desktop and mobile. Group expansion is remembered in browser storage; menu visibility, order, and permissions remain unchanged. Updated the account-menu UI spec and docs.

### Account menu plan â€” cancellation/return request workflow

- Implemented the account-menu plan's pending order-change queue: additive `order_change_requests` migration, customer-owned cancellation/return intake with reasons/history, permission-gated staff decisions, a pending-request quick-link count/filter, and admin review controls. Cancellation approval uses `TransitionOrderAction`; delivered/completed orders require an approved return request and staff confirmation before `returned` restores inventory. OpenAPI and generated frontend declarations plus order/account-menu specs and lifecycle docs are aligned. Migrations `2026_10_26_000027` and `000028` are applied locally; the 80-table SQL snapshot is refreshed. API types generated and changed PHP files formatted with Pint; no tests/build were run.

### Account menu plan â€” quick-create coverage

- Added the planned content-page creation destination to account-menu search and its quick-create submenu, and exposed the same `/pages` editor from the header quick-create menu. Both controls require `content.manage`; the existing page editor opens with a blank form ready to create a page. Updated the account-menu guide and implementation checklist. No tests, frontend build, or server run.

### Account menu plan â€” cancellation/return request scope audit

- The earlier audit found the pending-request queue missing and marked it incomplete. The follow-up implementation above resolves that gap with a dedicated request model, API, queue, and review flow.

### Account menu plan â€” activity-log retention

- Replaced the privacy page's claim that activity logs are never pruned with configurable `activity.retention_days` (default 365, bounded 30Ã¢â‚¬â€œ3650). Added the settings API/UI, authenticated retention summary, daily chunked `activitylog:prune` command, and an additive `created_at` index migration for efficient cleanup. Documented the retention policy and API contract; its index migration has now been applied locally. No tests, frontend build, or server run.

### Account menu plan â€” complete quick-navigation queues

- The source plan requested seven quick links, while the existing menu had only four. Added permission-filtered counts and links for confirmed/processing orders unchanged for 24 hours, cancellation/return outcomes updated within seven days, and active usable coupons ending within seven days. Added matching URL-backed order queue and coupon status filters, OpenAPI descriptions, regenerated TypeScript API declarations, and updated the acceptance/spec/UI docs. The cancellation/return link surfaces recent terminal order outcomes because the current order schema has no separate pending cancellation/return request records. Pint and API type generation passed; no tests, frontend build, or server run.

### Local API fetch and CORS handling

- Added the admin/storefront local Vite origins on ports 5173Ã¢â‚¬â€œ5175 for both `localhost` and `127.0.0.1` to the default CORS allowlist and `.env.example`, covering the current admin browser origin at `127.0.0.1:5175`. Configured Laravel guest auth middleware to avoid redirecting API requests to the undefined web `login` route; unauthenticated API requests can now render the intended JSON auth response instead of a 500 error. No tests or server restart were run.

### Account menu plan â€” password lifetime and initial credential enforcement

- Implemented owner-only `security.password_max_age_days` in Store Settings (0 disables, bounded to 0Ã¢â‚¬â€œ3650 days), enforced expired-password change at admin session issuance for password, OAuth, and passkey logins, and added the 14-day account-menu warning. Directly created and invitation-created staff now enter the existing forced-password-change flow on first sign-in.
- Kept the enforcement in existing `settings`, `users.password_changed_at`, and `users.must_change_password` storage; no schema migration was needed. Updated the API contract, generated types, auth/data-model/UI documentation, and the feature spec. No tests or frontend build were run.

### Account menu plan â€” full documentation and API alias audit

- Corrected the migrated SQL snapshot inventory in `docs/architecture/data-model.md` from 56 to 79 tables and listed the current table names. Added a complete admin account-menu/workspace page specification mapped to plan sections AÃ¢â‚¬â€œJ and linked it from the existing account-menu guide.
- Documented all 47 previously missing Laravel admin route operations (catalog and campaign aliases, operational aliases, export/OAuth aliases, and product duplication), including permission gates and canonical-route traceability. Added the `PATCH /admin/tags/{tag}` alias. The route/OpenAPI audit now reports 333 relevant operations and zero undocumented operations.
- Regenerated admin and storefront TypeScript API declarations from `api/openapi.yaml`. Parsed the OpenAPI YAML and generated declarations successfully. No test suite, frontend build, or server was run.

### Admin account menu â€” unfamiliar session recovery

- Added an admin-only report action that revokes the selected login session and refresh token, sends a mandatory security alert, and sets `must_change_password`. Admin API middleware now blocks protected requests with `ADMIN_PASSWORD_CHANGE_REQUIRED` until password change clears the flag; admin `/auth/me` reports the flag and the UI routes to a password recovery form recommending TOTP. Session inventory and revoke-all now target `token_type=session`, preserving API tokens. Updated OpenAPI, auth/data-model docs, and account-menu acceptance/tasks. No tests or builds were run.

### Account menu plan localization â€” final static-text audit pass

- Routed product target-gender and rating labels, revenue chart headings, payment-payload controls, account/customer/staff/catalog labels, and support context/pagination labels through the admin translation dictionary. Localized shared dialog close text, breadcrumb navigation/overflow names, and sidebar sheet/rail labels. Added locale plural mappings for star counts and updated product/UI component guidance plus the task checklist. A static JSX audit found no remaining untranslated direct JSX phrases outside conditional bilingual help copy and brand names; remaining raw attribute values are example inputs, empty decorative image alts, or provider/technical identifiers. No tests or frontend builds were run.
- Parsed all 18 changed TypeScript/TSX files without syntax errors and audited 3,622 English dictionary keys for duplicates; a direct translation-call audit found zero missing literal keys. Marked the English localization work complete in the feature checklist.

### Account menu plan localization â€” product gender options

- Routed the product detail form's target-gender options through the existing Vietnamese/English dictionary, including male, female, and children labels. Updated the localization task checklist. No tests or builds were run.

### Account menu plan localization â€” order print documents

- Localized invoice and delivery-slip titles, metadata, recipient and payment labels, tables, totals, signatures, and legal footer. Dates and integer-VND values use shared locale formatters; order/customer/address data remains verbatim. Updated the order UI spec and localization checklist. Static AST checks found no parse errors or missing literal translation keys; no tests or frontend build were run.

### Account menu plan localization â€” shared controls

- Localized the shared password visibility control, product status switch, customer CSV export action and feedback, and two-factor state errors. Verified existing translations for report weekdays, personal task tabs, and keyboard shortcut labels; added the missing search shortcut label. Updated relevant form, product, list, and account-menu documentation. Static AST key checks found no missing direct keys; no tests or frontend build were run.

### Account menu plan localization â€” admin shell

- Localized shell skip/navigation labels, account identity and session details, route loading fallbacks, API connection notice, 403/404 guidance, product filter errors, toast messages, and product archive confirmations. Updated shell documentation and the account-menu localization checklist. Static AST checks found no parse errors or missing literal translation keys; no tests or frontend build were run.

### Account menu plan localization â€” staff management

- Localized staff management tables, presence and account states, invitation and approval flows, search/advanced filters, role labels, forms, validation, impersonation and account actions, and confirmation dialogs. API and validation errors pass through the selected locale when translations exist. Updated the staff UI spec and localization checklist. Static TS AST checks found no parse errors or missing literal translation keys; no tests or frontend build were run.

### Account menu plan localization â€” order detail

- Localized order detail headings, tables, customer/shipment actions, payment and refund history, COD collection dialog, accessible names, and missing-payload state. Monetary values use the shared locale-aware VND formatter. Updated the order UI spec and account-menu localization checklist. Targeted AST checks found no parse errors, missing literal translation keys, or duplicate dictionary keys; no tests or frontend build were run.

### Account menu plan localization â€” staff role permissions

- Localized the role-permission matrix, role names/descriptions, permission module and action labels, accessible checkbox names, bulk selection, confirmation, and loading/save feedback. Updated the staff UI spec and account-menu localization checklist. Static AST checks found no parse errors or missing literal translation keys; no tests or frontend build were run.

### Account menu plan localization â€” help articles and policy pages

- Added an English Markdown guide matching the Vietnamese article structure and localized `/help`, `/help/policy`, and `/help/privacy`. Search checks both bundled languages; article feedback IDs remain stable across locale changes. Updated the account-menu UI spec and localization checklist. Static TS AST checks found no parse errors, missing literal translation keys, duplicate dictionary keys, or article count mismatch. No tests or frontend build were run.

### Account menu plan localization â€” shipping settings

- Localized shipping method and province-rate filters, tables, accessible row actions, forms, validation, API errors, confirmations, and feedback. VND display now uses the shared locale-aware formatter, and saved method/province names remain data. Updated the shipping UI spec and account-menu localization checklist. Targeted AST checks found no TSX parse errors, missing literal translation keys, or duplicate dictionary keys; no tests or frontend build were run.

### Account menu plan localization â€” review dialogs

- Localized review moderation and detail dialogs, including reason validation/API errors, translated fit/status/purchase labels, image accessibility and zoom, related-order actions, deletion confirmation, and locale-aware timestamps. The App-level review deletion confirmation and moderation title now follow the selected language. Added the review UI spec and updated the localization checklist. No tests or frontend build were run.

### Account menu plan localization â€” product image management

- Localized image metadata controls, primary-image and reorder actions, keyboard instructions, upload queue/progress/retry feedback, validation/API errors, save feedback, and deletion confirmation. Dynamic upload errors and filenames use translated interpolation. Updated the product UI spec and account-menu localization checklist. Static AST audit found no TSX parse errors, missing literal keys, duplicate dictionary entries, or raw Vietnamese JSX/attributes in `ProductImagesPage.tsx`; no tests or frontend build were run.

### Account menu plan localization â€” account menu accessibility

- Localized the mobile account menu sheet's close button accessible name for English and recorded its coverage in the checklist. No tests or frontend build were run.

### Account menu plan localization â€” staff invitation acceptance

- Localized invitation acceptance headings and details, role and expiry rendering, password and terms controls, validation, and loading/error/submit feedback. Invitation timestamps use the shared locale-aware formatter. Updated the staff UI spec and localization checklist. Targeted source audit found no parse errors or raw Vietnamese JSX/attributes; no tests or frontend build were run.

### Account menu plan localization â€” SSO settings and password recovery

- Localized the SSO allowed-domain setting labels, guidance, loading/save states, and API error feedback; documented owner-only access and locale behavior. Audited the password recovery route: its validation, reset and resend states, strength checklist, accessible labels, and feedback already use translations, with only the NÃƒâ€°T brand mark remaining static. Updated the account page spec and localization checklist. No tests or frontend build were run.

### Account menu plan localization â€” catalog reference data

- Localized categories, brands, colors, sizes, and collection controls, including drag-and-drop accessibility instructions, filters, table headings/statuses, forms, upload labels, validation, deletion confirmations, and mutation feedback. Added English resources and documented the behavior in the catalog page spec and localization checklist. Targeted TypeScript AST audit found no TSX parse errors, missing literal translation keys, duplicate dictionary keys, or raw Vietnamese JSX/attributes in `ReferenceDataPage.tsx`; no tests or frontend build were run.

### Account menu plan localization â€” store settings

- Localized all six store settings sections, fields, guidance, loading/retry states, save and test-email feedback, and client validation messages. Server field errors resolve through the active translation dictionary; role names follow the locale. Saved email templates and maintenance copy remain editable store content. Targeted AST audits found no parse diagnostics, missing literal translation keys, raw Vietnamese JSX/attributes, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan database setup â€” backups and browser push

- Applied all pending account-menu migrations on the configured local MySQL database. Fixed the pending `system.backup` permission migration to use the repository's `permission_role` pivot table; the database confirmed the permission is assigned to `admin` and `super_admin`, and `push_subscriptions` exists. Regenerated `fashion_store_schema.sql` from the live schema as DDL only (79 tables, no row data), and updated the data model, ERD, and checklist. PHP Pint passed for the corrected migration. Runtime VAPID values and a Windows MySQL dump binary remain environment setup requirements; no tests or frontend build were run.

### Account menu plan localization â€” review moderation

- Localized review moderation tabs, filters, bulk actions, table labels, accessibility names, empty/error states, and dynamic count summaries. Review counts and image counts follow the configured number format. Targeted AST checks found no parse errors, missing literal translations, raw Vietnamese JSX/attributes in the review list, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” admin sign-in

- Localized sign-in and two-factor challenge labels, passkey and OAuth actions, password visibility names, and session-loading feedback. Targeted AST checks found no parse diagnostics or missing literal translation keys in the login branch; no frontend build or tests were run.

### Account menu plan localization â€” dashboard and product/order shared controls

- Localized dashboard period comparison labels and made comparison numbers follow the active locale. Localized internal order-note validation and feedback, product SEO preview placeholders, and rich-text editor loading/accessibility controls. Added the missing English product-image management label. Targeted AST audits found no parse errors, missing literal translation keys, raw Vietnamese JSX/attributes in the changed components, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” inventory list

- Localized inventory status tabs, search and advanced filters, filter chips, table labels/actions, and bulk threshold controls. Selected variant counts use the configured number format. Targeted AST audits found no parse errors, missing literal translation keys, raw Vietnamese JSX/attributes, or duplicate dictionary keys in the inventory list; no frontend build or tests were run.

### Account menu plan localization â€” inventory movement history

- Localized inventory movement and reference labels, table headers, filter controls/chips, empty states, and CSV export errors. Movement quantities and timestamps use shared locale-aware formatters. Targeted AST checks found no parse errors, missing literal/conditional translation keys, raw Vietnamese JSX/attributes, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” manual order creation

- Localized manual order creation headings, customer and product search, quantity accessibility labels, shipping fields, pricing guidance, and submission feedback. Currency amounts use the shared locale-aware VND formatter. Targeted AST checks found no parse errors, missing literal/conditional keys, raw Vietnamese JSX/attributes, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” stock adjustment dialog

- Localized stock adjustment operations, schema validation, reserved-stock guidance, confirmation and success states, and locale-formatted quantity summaries. Targeted AST checks across stock adjustment and shared location fields found no parse errors, missing literal/conditional translation keys, raw Vietnamese JSX, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” order address fields

- Localized the shared province/city and ward/commune field labels and empty options. Official place names remain as published in Vietnamese. Targeted AST checks found no parse errors, missing literal translation keys, raw Vietnamese JSX, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” order action dialogs

- Localized shared order cancellation, status, shipping-address, and refund dialogs, including mode-specific headings, cancellation reasons, validation messages, and refund amount formatting. Targeted AST checks found no parse errors, missing literal or dynamic-copy keys, raw Vietnamese JSX/attributes, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” order delivery and shipment dialogs

- Localized order delivery and shipment editor dialog instructions, validation copy, shipment statuses, and actions. The shipment form errors now resolve through the active locale. Targeted AST checks found no parse errors, missing literal or status-label keys, raw Vietnamese JSX, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” product controls

- Localized product tag entry and bulk variant editing labels, validation messages, accessibility text, and usage guidance. Targeted AST checks found no parse errors, missing literal keys, raw Vietnamese JSX, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” inventory threshold

- Localized the low-stock threshold dialog labels, range guidance, validation feedback, and actions. Targeted AST checks across the threshold dialog and product tag/bulk editor found no parse errors, missing literal translation keys, raw Vietnamese JSX, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” dashboard widgets

- Localized dashboard action-alert cards and the recent-activity widget, including event action labels and loading/empty/error states. Targeted AST checks found no parse errors, missing literal or activity-action keys, raw Vietnamese JSX, or duplicate dictionary keys. No frontend build or tests were run.

### Account menu plan localization â€” backup management

- Localized backup management headings, descriptions, actions, job states, feedback, and timestamps using the active locale formatter. Updated the account-menu checklist and UI documentation. A targeted AST audit found no parse errors, missing literal translation keys, raw Vietnamese JSX, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” system health

- Localized System health and failed-job UI labels, service status summaries, pagination, retry/delete confirmations, and timestamps. API-provided diagnostic details and failed-job summaries remain displayed verbatim. A targeted AST scan found no parse errors, missing literal/conditional translation keys, raw Vietnamese JSX, or duplicate dictionary keys; no frontend build or tests were run.

### Account menu plan localization â€” inventory

- Localized the manual/CSV inventory import flow, adjustment voucher form and detail, and import history for the active admin locale. Added English dictionary entries for labels, confirmations, validation feedback, and pagination, and updated the inventory UI spec and localization checklist. Targeted TypeScript AST scans found no parse errors, missing literal translation keys, or raw Vietnamese JSX/attributes in these pages; no frontend build or tests were run.

### Account menu plan localization â€” help tools

- Localized the third-party license catalog and runtime diagnostics labels, screen summary, loading/error feedback, and copy result for English. Updated the account-menu UI documentation and localization checklist. Static AST audits found no parse errors, missing literal translation keys, raw Vietnamese JSX, or duplicate dictionary keys in these pages. Release-note and Markdown help article content remains Vietnamese when English is selected; no tests or frontend build were run.
- Localized the changelog page controls, version state, loading feedback, and mark-as-viewed action. AST audit found no TSX parse errors, missing literal keys, or duplicate i18n keys across the changelog, licenses, and diagnostics pages. Release note entries remain Vietnamese Markdown content. No frontend build or tests were run.

### Account menu appearance controls

- Added account-synced font size, page zoom, breadcrumb visibility, high-contrast tokens, and a stronger focus ring. The controls apply immediately through document-root settings and persist with `admin_appearance`; OpenAPI and generated frontend declarations are aligned.
- Date/time, number, and currency preferences are now account-synced and applied by shared admin formatters, including timezone-aware display and relative dates. The account also saves dashboard period/comparison defaults and widget visibility/order, remembers collapsed sidebar groups per account/browser, pins up to eight permission-filtered sidebar destinations with saved ordering, applies a permission-filtered default landing page after login when no return URL was requested, and exports/imports versioned JSON for appearance preferences. Per-table default column controls and applying week-start preference to a calendar remain open. OpenAPI types generated; PHP syntax lint and Pint passed. No frontend build or tests were run.

### Account menu plan browser push

- Added the Laravel Web Push channel with VAPID configuration support, per-user/device subscriptions, secure register/list/revoke endpoints, a queued test notification, and preference-based push delivery for admin notifications. Added a browser service worker, device management and per-event channel toggles in admin notification settings, OpenAPI/generated types, UI/data-model documentation, and the planning checklist.
- Composer resolved `laravel-notification-channels/webpush` 13.0.1 and its Web Push dependencies; package files are present and optimized autoload generation succeeded. `composer install` stopped while replacing a Windows-locked `api/vendor/bin/patch-type-declarations` file, so vendor upgrades may be partial. The migration is now applied; runtime VAPID keys still need configuration. No app build or tests were run. PHP syntax/Pint and route listing passed.

### Account menu P0 interaction audit

- Added the planned `Alt+A` menu shortcut and a visible skeleton while summary counts load. Verified the existing desktop 320px/viewport-scroll sizing, mobile sheet layout and minimum touch rows, summary retry on error, permission-filtered badges, and `/system/failed-jobs` anchor.
- Added offline link styling, `aria-disabled`, a native connection tooltip, and click blocking with a status notice. A complete state-by-state visual audit remains open.

### Account menu plan localization foundation

- Added bundled `i18next`/`react-i18next` setup, Vietnamese default/fallback, `vi`/`en` account appearance persistence, a language selector on Appearance preferences, and a quick selector in the account menu. Admin sidebar group/item labels and page titles now resolve through the translation resource; OpenAPI and generated client declarations include the locale preference.
- English coverage is still partial: most feature page copy remains Vietnamese and the full menu state audit/documentation checklist is open. No frontend build or tests were run.

### Account menu P3 role preview

- Added the `staff.impersonate` permission via an additive migration and included it in the permission seeder for admin and super_admin roles.
- Added a menu-only role preview sourced from the configured staff role matrix. It filters navigation, quick-create, account-menu, and search links and displays a banner; actual route guards and API authorization remain based on the signed-in user's permissions.
- Employee impersonation was completed in the follow-up section below. The migration is unapplied. No tests, lint, or frontend build were run.

### Account menu P3 employee impersonation

- Added an additive session table that binds an acting admin identity to an active non-admin staff target for at most 30 minutes. The access JWT remains subject to the admin; API permission checks use the target. Refresh rotation preserves the binding and its original expiry, while logout or expiry ends it.
- Added staff selection from the account menu and staff list, a sticky identity/expiry banner with an exit action, dedicated API endpoints, and blocks for password, email, two-factor, session, logout-all, and API-token management while impersonating.
- Admin writes, account writes, `/me` writes, start/stop actions, and logout record actor and target IDs. Updated OpenAPI, generated frontend declarations, ERD, data model, auth guidance, and the UI spec. Pint and API type generation passed. The additive migrations are unapplied; no tests or frontend build were run.

### Account menu P3 configurable keyboard shortcuts

- Added account-synced bindings for global search, sidebar toggle, screen lock, and shortcut help, with fixed non-conflicting choices and an Accessibility toggle. The help dialog and search trigger show the active bindings, and key handlers ignore form fields.
- Updated the source plan, OpenAPI contract and generated API types, account-menu spec, and UI documentation. No tests, lint, or frontend build were run.

### Account security sudo audit

- Audited the sensitive write routes against the plan: email/password, two-factor setup and recovery, passkeys, personal API tokens, alert disable, and staff 2FA reset all use server-side `recent.auth` enforcement. The confirmation is keyed to the authenticated admin session for ten minutes and requires TOTP when enabled.
- Updated the source plan and acceptance checklist to reflect the implemented coverage. No tests were run.

### Account menu P2 inventory import history

- Added `import_jobs` records for inventory CSV runs, including actor, original filename, row counts, outcome, and row-level errors. Errors are downloadable as CSV; source files are not retained.
- Added owner-scoped `/admin/imports` history, detail, and error-download APIs plus a paginated admin page linked from the inventory section. `exports.view_all` admins can see all runs.
- Updated OpenAPI and generated admin/storefront API types, ERD, data model, UI page spec, account-menu spec, and source plan. Pint formatted the modified PHP. Migration is additive and unapplied. No tests or frontend build were run.

### Account menu P2 browser push

- Composer could not reach Packagist (`Could not resolve host: repo.packagist.org`), so the Web Push sender dependency described by the plan could not be installed in this environment. The feature remains unimplemented and this blocker is recorded for follow-up.

### Account menu P3 permission requests

- Added requester-owned permission request history and an admin review queue. Approval applies a direct grant to one account and requires the reviewer to hold the requested permission.
- Added the queue to recent-page tracking and documented the new tables, API, and UI flow. OpenAPI types were regenerated; PHP formatting was run on the changed backend files. The migration remains unapplied. No tests or frontend build were run.

### Account menu responsive layout

- Reworked the account menu at widths below 768px into a bottom Sheet with an internal scroll area, remembered expandable groups, inline nested menus, 44px touch targets, and focus return. The trigger announces presence and attention count. Desktop retains the dropdown and Radix keyboard handling.
- Updated the account-menu UI docs, feature acceptance criteria, and implementation checklist. No tests, lint, or frontend build were run.

### Account menu P3 account switching

- Added a menu dialog for up to three recent admin accounts, stored as name, email, and avatar metadata only. Choosing an account logs out the current session and opens `/login` with the chosen email prefilled; a separate action opens login with a blank email.
- Updated account-menu documentation and task tracking. No tests, lint, or frontend build were run.

### Account menu P2 reminders

- Added the owner-scoped `GET /me/reminders` API and `POST /me/tasks/{task}/snooze`, including 10-minute, one-hour, and next-morning options in the admin's timezone. Completed tasks cannot be snoozed; snoozing resets reminder delivery state.
- Added the paginated `/me/reminders` admin page and account-menu link; the existing every-minute command continues to deliver daily/weekly reminders.
- Updated OpenAPI, generated API types, account-menu UI and data-model docs, and plan tracking. PHP formatting and API type generation were run; no tests or frontend build were run.

### Account menu P3 shifts and handoff

- Added the additive `user_shifts` table, owner-scoped summary/start/end/history APIs, and a `/me/shift` page. Transactions lock the admin row before starting or ending a shift; weekly duration follows the profile timezone, and a new shift shows the previous completed shift's handoff note.
- Added the account-menu link, OpenAPI schemas/routes, generated frontend types, ERD, data-model and UI docs, and plan tracking. PHP formatting and API type generation were run; the migration was not applied and no tests or frontend build were run.

### Account menu P2 personal performance

- Added the authenticated `/api/v1/me/performance` endpoint with today/7-day/30-day windows, preceding-period comparison, timezone-aware daily timeline, and per-section permission filtering. Metrics include order status transitions and average confirmation time, inventory adjustments, review approvals, and personal tasks completed by a recorded due date.
- Added review approval actor records to `activity_logs`, a performance page and chart under the account menu, the OpenAPI response contract, and feature/data model notes. Historical review approvals before this audit write cannot be attributed to an individual.
- PHP Pint formatting and OpenAPI type generation completed. No tests or frontend build were run.

### Account menu P2 staff performance

- Added a separate staff-performance permission and an additive migration, plus `GET /api/v1/admin/staff/{staff}/performance`. The route limits targets to assignable admin/staff accounts and filters commerce metrics by the viewer's matching permissions.
- Added a staff-row link and reused the personal performance page for employee metrics. Updated the API resource, OpenAPI contract, TypeScript declarations, role seeder, and feature/security/data-model docs. PHP Pint and OpenAPI type generation completed; the migration has not been applied. No tests or frontend build were run.

### Account menu plan P0 foundation

- Added the admin-only `GET /api/v1/account/menu-summary` endpoint with a 60-second per-user cache. It returns notification and permission-filtered commerce counts, plus security status and zero-valued counts for account-menu features that do not have backing data yet.
- Connected the account menu to the summary query; it loads when opened, refreshes every 60 seconds, scopes cache data by admin ID, and hides unavailable badges on API errors. Added quick links for orders and inventory.
- Added menu search with Vietnamese labels and aliases (`pass`, `dark`, `otp`, `logout`), plus a per-admin top-three frequently used list stored in local storage.
- Updated OpenAPI and regenerated admin/storefront API declarations. Corrected preference documentation to describe the existing server sync and browser startup cache.
- Added account-level Do Not Disturb presets, custom expiry, and weekly quiet hours using the admin profile timezone. Email is suppressed while active, notifications remain in-app, urgent mail follows the saved preference, and security alerts always bypass quiet hours. The account-menu summary exposes the active muted state; OpenAPI types and account-menu docs are synchronized. No tests or frontend checks were run.
- Added daily and Monday weekly admin digests with configurable local send time and sections for pending orders, net revenue, low stock, pending reviews, and personal overdue tasks. Dispatch respects each admin's permissions and a separate in-app/email preference, omits empty reports, honors DND email suppression, and records a per-user period marker to prevent duplicate sends. No new migration is needed; no tests or frontend checks were run.
- Added cross-device recent history for allowlisted admin pages and order/product/customer records, with API-side read-permission checks, owner scoping, a 20-item cap, tracking opt-out, clear-history control, and daily 90-day pruning. Added an additive `user_recent_items` migration, OpenAPI/types, ERD/data-model/spec docs. The migration has not been run; no tests or frontend checks were run.
- Added an additive migration for personal tasks, notes, and bookmarks; owner-scoped CRUD APIs and resources; assignment gating through `tasks.assign`; and task counters in the menu summary. Added pages for task filters/completion, note editing/pinning, and bookmark add/reorder/delete, with links from the account menu. Added FR-ADM-008..009, traceability, a feature spec, and data/UI documentation. The migration has not been run.
- Added a read-only permission summary page and a confirmed logout-all action that revokes the admin's sessions and trusted-device records; both are reflected in OpenAPI and the account menu.
- Added login history capture for successful admin login, incorrect password/2FA, and lockout; added an owner-scoped history API, a transparent security score, presence updates, profile extension fields, and a daily 180-day login-history cleanup command. Admin password changes and resets now update `password_changed_at`. The new migration has not been run.
- PHP Pint and the admin production build passed; the build retains Vite's existing large-chunk advisory. No tests were run. The migration was not applied.

Updated: 2026-10-25

### Admin form source audit

- Completed the form-by-form source audit for shared labels, inline validation, dirty-state guards, and destructive confirmations; evidence and the mandatory reauthentication-dialog exception are recorded in `docs/ui-ux/page-specs/admin-form-audit.md`.
- Added required markers and bounded integer validation for store shipping/stock thresholds and security settings, and aligned product-create slug/status labels with their required schemas. Added shell toast feedback for mutations without local outcome handlers, while preserving inline 422 errors and avoiding duplicate page notices.
- Fixed the settings schema's missing `warehouse_staff` 2FA role after the admin build surfaced the mismatch. The admin production build now passes with the existing large-chunk advisory; no lint, tests, or browser visual review were run, and visual QA remains deferred.

### Admin planning scope reconciliation

- Re-read the referenced AÃ¢â‚¬â€œF planning and checked the remaining shell checklist against product scope and API routes. Confirmed the plan calls for Vietnamese UI and account profile/TOTP 2FA, while English localization, PIN, and workspace switching are not defined and conflict with the current Vietnamese-only, single-store scope. Updated the checklist to state that boundary; responsive/dark-mode visual acceptance remains deferred as previously requested.

### Admin two-factor code entry

- Replaced the single six-digit field with a shared six-cell OTP input on admin login, session reauthentication, TOTP enrollment, and recovery-code management. It supports automatic focus movement, keyboard arrows, paste, and browser one-time-code autofill while preserving the existing string payload sent to the API.
- Updated the authentication and account UI acceptance notes. No frontend build or browser check was run.

### E24 settings save bar

- Added a sticky Save/Cancel action bar to each store settings form, with compact mobile wrapping. It uses the existing dirty-state behavior, so Save remains disabled until values change. Updated the settings guide and acceptance criteria. No frontend build or browser check was run.
- Corrected the email settings helper text to match the API: all four templates can be tested, while test mail uses saved values. Disabled the test action until settings are saved and a recipient address is available. Documented that order and shipment templates run on their business events.
- Added read-only server timezone data to the settings response and displayed it beside fixed VND currency in the general settings form. Updated OpenAPI, generated admin/storefront declarations, and settings acceptance notes. PHP Pint and syntax lint passed; no frontend build or browser check was run.

### A3 table column preferences

- Scoped saved column visibility to the current admin route and table column set, in addition to the signed-in admin account. This prevents tables on separate management pages with overlapping column IDs from sharing visibility changes. Updated the admin shell guide and design-system acceptance spec. No frontend checks or browser review were run.

### C3.4 weekly report notification

- Added a scheduled summary of the previous MondayÃ¢â‚¬â€œSunday period, with fulfilled paid-order net revenue and current low-stock variants. It dispatches through the existing `weekly_report` in-app/email preferences to active admins with `reports.view` and links to the matching revenue report. The schedule runs Monday at 08:00 using the application timezone. Updated the account and backend guides. No tests or schedule execution were run.

### Product sale schedule follow-up

- Added optional product-level sale start/end datetimes with a new migration. Product create/edit forms validate the interval and show the schedule alongside variant pricing.
- Variant discounts are active only inside a configured window; products with no window keep their prior always-on discount behavior. Catalog price display, sorting/filters, cart values, checkout quotes, storefront order placement, admin manual-order options, and manual order totals now use the effective price. Checkout/manual orders evaluate at one timestamp and keep immutable order-item price snapshots.
- Updated OpenAPI, generated admin/storefront API declarations, schema snapshot, product acceptance docs, data model, ERD, architecture guide, and ADR-0011. Applied only the new additive migration to the local database. No tests or frontend build were run.

### Admin login lockout follow-up

- Added a 15-minute email/IP lockout after five incorrect admin credential attempts. Lock state is returned with an expiry timestamp, while account-inactive responses direct the user to administrator support without exposing an expiry.
- Added the `/locked` page with a live countdown and return-to-login link that preserves the original protected route, and documented the behavior in the auth specification and security guidance.
- PHP Pint passed for the updated controller, and OpenAPI TypeScript declarations were regenerated. No tests or frontend build were run.

### Account session security notice follow-up

- The admin sessions page now warns when another active session uses an IP address different from the current device, with guidance to revoke unfamiliar sessions.
- Updated the account page specification. No tests or frontend build were run.

### Trusted admin browser follow-up

- Added the planned “Tin cậy thiết bị này trong 30 ngày” choice to admin 2FA verification. Trusted browser tokens are random, stored as SHA-256 hashes, scoped to an httpOnly admin-auth cookie, and rotated with a renewed 30-day expiry on use.
- Password changes/resets, recovery-code replacement, and 2FA disable revoke remembered devices. Added the migration and applied it to the local database; the SQL snapshot now includes its 56th table. Updated OpenAPI, generated API declarations, auth flow, security guidance, data model, and auth acceptance notes.
- PHP Pint passed. No tests or frontend build were run.

## Admin redesign implementation

Reference: user's full admin redesign planning (sections AÃ¢â‚¬â€œF, supplied in the attachment during this task). The repository contains substantial prior implementation; this section tracks the remaining gaps found while aligning it to that planning.

### Completed in this continuation

- Finished the product edit A4 layout: the sticky header shows product name/status and guarded Back/Save/Save draft/Cancel controls; Save stays disabled while clean. The editor now uses the same responsive 65/35 main/side-rail layout as product creation, with status, classification, tags, collections, primary-image preview, and SEO preview in the rail. Extended the shared switch styling to supporting cards so featured/new flags render consistently on both forms. Updated product page acceptance notes. No checks or servers were run in this continuation.
- Completed the collection product picker gap from E10/A3: available products are now filtered out at the API, and the search panel uses the shared DataTable with URL-backed debounced search, server pagination/sorting, shared page size, multi-page selection, empty/error/retry states, and a bulk attach action. Updated OpenAPI-generated declarations and the catalog page spec. Pint, API type generation, admin lint, production build, and PHP syntax checks passed. No tests were run.
- Aligned the admin shell with planning section A1: desktop sidebar is 260px, icon mode is 72px, and the footer now shows the signed-in staff member's avatar, name, role, and active-session marker while the account menu stays in the topbar. Updated the shell guide and acceptance spec. Admin lint and production build passed; no tests were run.
- Fixed the staff page's pending-approval and invitation lists to consume paginated API responses, search and sort on the server, and use the shared DataTable with loading/error/retry and pagination states. Added validated API query parameters and synchronized OpenAPI-generated frontend declarations. Admin lint and production build passed; PHP syntax checks passed. No tests were run.
- Added a one-time email-change confirmation flow: the current address remains active until the new address confirms, expired token hashes are rejected, and the previous address receives a security notice. Added its migration, OpenAPI contract, account UI state, and auth/data-model documentation.
- Completed the shipment list gaps from E4: quick status tabs group pickup, in-transit, delivered, and failed/returned shipments; recipient and address are searchable and visible; CSV includes destination fields; and each row can print a safely escaped shipping label.
- Added admin session recovery from section D: failed refresh or a rejected retry opens a blocking reauthentication dialog without changing routes; password and optional 2FA are verified through the existing auth flow, then cached API data is refreshed.
- Added per-user preference storage for account notification choices, with strict allowlisted API validation.
- Added persistent permission-scoped admin notification history for new orders, failed deliveries, low stock, pending reviews, and verified registration approvals; individual and bulk read state is stored per account and email follows each user's event preferences.
- Added account-menu help dialogs for basic workflows, supported keyboard shortcuts, storefront contact, and current package version.
- Aligned account sessions and personal activity with the shared data-table patterns; added date/module/action filters, URL-backed pagination, a detail sheet, and before/after snapshots for supported single-record admin writes.
- Added a personal activity endpoint that scopes all returned activity rows to the signed-in user.
- Added account notification and activity pages and exposed profile, security, sessions, notifications, activity, and appearance through account routes/menu entries.
- Added per-user appearance preference loading/saving for theme, six accent colors, density, page size, reduced motion, and sidebar collapse.
- Added sessions API metadata for IP address and user agent/device details; parsed browser/version, operating system, and device type for session display and OpenAPI.
- Added order and coupon report API/UI sections and routes; report exports include coupon discount and fulfilled revenue values.
- Added links to existing forgotten-cart and wishlist management screens and status-filtered order navigation.
- Added a shared split-screen design to admin login, lockout, password recovery, staff invitation acceptance, and error states. The form column is sized around 420px, the branded fashion panel hides below 900px, and footer links resolve to the storefront's actual terms and privacy slugs.
- Extended the same split-screen layout to storefront login, registration, verification/pending-approval, password recovery, and maintenance screens. Storefront login now includes an accessible show/hide password button and keeps registration conditional on the public-registration setting.
- Added a policy-driven strength meter and requirement checklist to storefront registration, with a direct link from required consent to the published terms page.
- Expanded the admin dashboard to support today, 7/30/90 days, this month, and bounded custom ranges; all date-scoped API requests share the selected range. Added optional KPI/previous-revenue comparisons, day/week/month chart grouping, permission-filtered action alerts, and the latest ten audit events for staff with activity-log access. Recent orders now request the five rows specified by the plan.
- Completed the remaining E1 dashboard details: top-five products include thumbnails, each status-donut slice and legend entry links to filtered orders, and the low-stock list includes SKU, color/size, and available units. Tightened the top-products API to five rows and synchronized OpenAPI plus generated admin/storefront declarations. PHP Pint passed; no tests or frontend build were run.
- Added tag CRUD and transactional merge API, plus the `/tags` admin screen with search, product counts, and bulk merge selection.
- Added encrypted per-account admin TOTP enrollment, one-time recovery codes, hashed five-minute login challenges, and the SPA verification step before issuing session tokens.
- Added and applied the two-factor migration; updated the SQL schema snapshot, ERD, OpenAPI, generated API types, security guidance, and account-page specification.
- Added `/settings/security` for public registration, required 2FA roles, session duration, and login rate limits; the API enforces each saved policy and prevents enabling mandatory 2FA before active users enroll.
- Updated OpenAPI, generated client declarations, ERD, schema snapshot, data model, and admin shell/report documentation for this work.
- Implemented admin manual COD order creation at `/orders/create`, including active customer and variant search, quantity/stock checks, shipping method and coupon inputs, server-owned pricing, transaction-locked reservations through `InventoryService`, coupon usage, payment/history snapshots, and request idempotency. Added route/navigation, OpenAPI paths, and checkout/order specs and flow documentation.
- Implemented email-verified public registration with pending approval, generic verification resend, and storefront gating until activation. Added `/verify-email` and `/pending-approval` screens and hides the registration link while registration is disabled.
- Implemented staff invitation issuance, role assignment, 24/48/168-hour expiry, hashed one-time tokens, resend/token rotation, revoke, accept/password setup, and automatic admin sign-in after acceptance. Added verified-registration approval/rejection with role selection and email notices; only `super_admin` may grant the `admin` role.
- Applied the new `staff_invitations` migration to local MySQL; the schema snapshot now matches 50 tables. Updated OpenAPI and generated admin/storefront declarations, auth/security docs, ERD, and auth feature acceptance/tasks.
- Added verified registration approvals to the 60-second admin alert feed and sidebar badge, plus manual order creation to the topbar quick-create menu.
- Completed the admin password recovery screens from the auth plan: separate email-sent and reset-success routes, resend countdown, generic delivery copy, and reset password checklist/strength meter. Fixed the unauthenticated route gate so recovery screens remain reachable.
- Fixed reset-email routing by sending staff reset links to the admin SPA and customer links to the storefront, including the email required by the reset API. Added storefront forgot/sent/reset/done screens and the missing forgot-password link from customer login.
- Added and applied the planning's default admin role migration and permission presets; added role-aware invitations/approvals/account editing, role filtering, and a dedicated `/roles` matrix with user counts and row/column bulk permission controls. Protected the immutable store-owner role and restricted assignment or management of the broad administrator role to the owner.
- Added `/settings/email`, `/settings/seo`, and `/settings/maintenance`; the API stores sender details, four email templates, alert recipient lists, SEO share image/analytics ID, and maintenance status/message/time.
- Wired saved sender and templates into password-reset and staff-invitation notifications, added a permission-protected throttled test-email endpoint, and made the storefront show the configured maintenance screen and SEO title/description/share image.
- Updated the registration-status API contract, settings schema, generated API declarations, and admin shell documentation. Analytics ID is stored for future consent-aware integration.
- Completed additional settings behavior from E24: favicon/business hours, automatic unpaid non-COD order timeout, and an API-enforced password minimum/complexity policy across registration, reset, account changes, invitation acceptance, and staff password changes.
- Expanded E2 order filters to multi-select shipping methods and provinces, exact coupon codes with saved-code suggestions, and note presence. These filters are validated by the API and shared by server results, status counts, URL state, saved filters, and CSV export; payment-method filtering now supports future stored methods. Province choices fall back to historic order addresses if shipping-rate options are not configured. Updated OpenAPI, generated types, order specs, and docs. PHP Pint and type generation passed; no tests or frontend build were run.
- Added E2 batch printing for selected orders: staff can print invoices or price-free delivery slips in one print dialog, with one page per order. Detail fetches run in small batches and report a recoverable error if any selected order cannot load. Removed a fixed print-page height to prevent long orders from overflowing. Updated the order page specification. PHP Pint passed after the latest API change. No tests or frontend build were run.
- Added confirmation before deleting the admin account avatar. API errors remain visible in the confirmation dialog, and the avatar is cleared from the page and shell only after a successful response. Updated the account page specification. No tests or frontend build were run.
- Added explicit confirmation before disabling two-factor authentication or replacing recovery codes; the prompt explains the security impact, while both operations retain the password and authenticator-code checks. Updated the account page specification. No tests or frontend build were run.
- Extended E23 product audit snapshots on product update/delete to include associated variants, images, inventory, latest stock movement per variant, and tag/collection links. The audit diff only records rows and fields that actually changed. Updated the operations page specification; PHP Pint passed. No tests or frontend build were run.
- Matched the product-image upload limit to the planning's 5 MB per file in product create/edit UI validation and the API request validator. Shared image uploaders retain their 2 MB default for avatars and other media. The `dev:api` command now raises PHP upload/post limits so the development server can receive those files. Updated the product page spec, OpenAPI description, and generated declarations. PHP Pint and API type generation passed; no tests or frontend build were run.
- Queued customer order confirmation, shipment status, new-order alerts, and low-stock alerts after committed business changes. Added the scheduled cancellation command to the state machine workflow and made `npm run dev` start its scheduler and database queue worker.
- Exposed the public password policy to registration/reset screens and updated those forms to show configured requirements. Added settings/security acceptance coverage and refreshed local-runner, checkout, inventory, and settings documentation.
- Completed the category screen from E6 with tree/table views, URL-backed search and filters, table paging/sorting, hierarchy-safe reorder, SEO and description fields, dirty-form protection, and deletion guards for categories still containing products or children. Added and applied a reversible category-description migration and synchronized OpenAPI types, SQL snapshot, ERD, model/API docs, and feature spec.
- Added category image upload through the authenticated admin upload endpoint, URL fallback, inline preview, and matching catalog feature documentation; upload accepts JPG/PNG/WebP up to 2 MB.
- Expanded customer management E13 with filters for order-count range, last-purchase date, province code, and gender; synchronized filtered CSV export and added last-purchase sorting/display. Customer detail now includes default-first addresses, full cart line items and totals, and append-only staff notes protected by `users.manage`; added migration, OpenAPI operation, schema snapshot, ERD, and page-spec updates.
- Completed brand E7 fields with logo upload/preview using the shared admin upload endpoint, description, SEO metadata, and list logo display. Added and applied the additive brand metadata migration; admin uploads now accept either catalog create or update permission.
- Completed E8 list coverage for color/size values: color table and sortable view, size table and group-aware sortable view, reusable size groups through the existing `attributes` table, order display, and per-group drag reordering.
- Expanded collection E10 coverage with schedule-derived status tabs/filtering, inclusive overlap date filters, banner upload/preview, and SEO metadata; added/applied the additive metadata migration and synchronized SQL/OpenAPI references.
- Completed collection product management with confirmed bulk removal (up to 1,000 memberships), atomic membership validation, and normalized ordering after removal; synchronized its OpenAPI contract and catalog page specification.
- Completed review moderation E14: pending/approved/hidden tabs, URL-backed search and filters (rating, image presence, purchase verification, fit, date range), image and status columns, bulk approve/hide with required reason, delete confirmation, and a detail drawer with image zoom, moderation reason, and related-order navigation. The API resource now includes customer email, image count, order reference, and moderation reason; applied the moderation-reason migration and synchronized OpenAPI, generated types, schema snapshot, ERD, and page spec.
- Completed abandoned-cart management E15: configurable inactivity threshold, VND value range and registered/guest filters; contact and last-updated list fields; a read-only cart drawer with line snapshots/current stock/expiry; and CSV export using active filters. The detail API excludes guest session tokens; OpenAPI and the operations page spec describe the behavior.
- Completed wishlist management E16 with product/customer groupings, category and date filters, sortable counts/latest activity, product inventory context, URL-backed view state, and filter-aware CSV export. Updated the OpenAPI contract and operations page spec.
- Completed coupon management E17 with server-filtered status tabs, type and effective-date filters, minimum-order-value sorting/display, a `coupons.manage`-gated status switch, coupon duplication with a fresh code, and usage history with the total discount summary. Updated OpenAPI and the operations page spec.
- Completed banner management E18 filters for position and active state, title search, position-grouped ordering, filter-safe drag behavior, and desktop/mobile image previews. Updated OpenAPI and the operations page spec.
- Expanded content pages E19 with published/draft filtering, a shared rich-text editor and preview, SEO metadata, six editable starter templates, and server-side HTML sanitization on writes and reads. Added the SEO metadata migration and synchronized schema docs, SQL snapshot, OpenAPI, and storefront metadata rendering.
- Completed E20 report coverage with date and section filters, accessible chart summaries with data tables, CSV and print-to-PDF actions, revenue discount/shipping metrics, payment/category/brand/coupon breakdowns, order status/location and processing metrics, product sales and slow-mover breakdowns, customer cohorts/spend/location, and inventory snapshot/stagnant-stock/estimated sell-through metrics. Updated report API filters/OpenAPI and the admin report specification. No tests or frontend build were run.
- Completed E21 staff-list gaps: added all/active/pending/blocked/invited views, server-side last-login date filters, lock/unlock, emailed password reset, revoke-all-sessions action with self-revocation protection, and a direct link to logs filtered by staff ID. Added the activity-log user filter, endpoint contract, and staff specification.
- Completed E22 role-matrix follow-up: grouped permissions by module and added a confirmation warning before removing permissions from roles with assigned staff. Existing role presets, counts, select-all controls, and protected owner permissions remain backed by API enforcement.
- Completed E23 activity-log coverage: added staff/module/action/date/IP filters, search across actor/path/recorded values, a redacted before/after detail drawer, and filter-aware streamed CSV export. Updated request validation, OpenAPI, and the operations page specification.
- Extended E23 audit coverage to successful admin login (including completed two-factor login), logout, and operations CSV export; completed the activity filter's module/action options for current admin routes.
- Expanded E24 shipping settings with searchable province-rate management (fee, per-province free-shipping threshold, active state) using the existing `shipping_rates` schema. Storefront quotes and manual orders now use the same province override and global fallback rule; updated OpenAPI, checkout flow, data model, and operations page spec.
- Completed the dedicated E12 inventory movement screen with URL-backed filters, paginated ledger context, actor/type/date filters, debounced SKU/product/reason search, and streamed full-result CSV export. Added matching API validation, route, OpenAPI, and inventory documentation.
- Added permission-protected bulk low-stock threshold updates for up to 100 selected variants, with row-locking and unchanged quantity/movement ledger semantics.
- Expanded E11 inventory filtering with brand, color, and size options, and added quick stock-status tabs; the same filters now feed CSV export.
- Added manual receiving mode to `/inventory/import` with SKU/barcode/product lookup and a confirmation preview, alongside the existing CSV flow.
- Added `/inventory/adjust` vouchers for up to 100 variants with per-row signed deltas, reason categories, reserved-stock validation, stable row locking, and atomic linked inventory movements. Added the voucher table migration and synchronized the SQL snapshot, ERD, data model, OpenAPI, and inventory spec.
- Added read-only adjustment voucher details at `/inventory/adjustments/:id` and linked each voucher reference from the movement ledger.
- Expanded the E3 payment page with server-filtered quick status tabs and counts, minimum/maximum VND filters, transaction-reference sorting, a full payment/order/customer detail sheet, COD collection with an audit note, and reason-required full-refund recording through the existing order workflow. OpenAPI and the operations page spec now describe the filters and detail response.
- Completed E3 refund amounts with append-only `payment_refunds` records, locked remaining-balance checks, per-payment/order refund totals, reason and recorder history, partial/full refund status reconciliation, and backfill for legacy fully-refunded payments. The payment and order detail screens display refunded and remaining amounts; payment-level refunds now accept the requested VND amount and reason.
- Aligned legacy payment row status `paid` with provider status `success` in the payment tabs and summaries. COD collection is now one-way, restricted to unpaid COD orders, and still records a required audit note; order detail refund dialogs accept an amount and reason.

### Remaining planning areas

- The detailed sections below record follow-up work that supersedes the earlier broad “remaining” notes. The full 521-line planning document still needs a requirement-by-requirement audit before this goal can be marked complete.
- A source audit of every currently registered admin mutation route and admin-side pivot write found each mapped to a before/after snapshot or an explicit safe audit record. Repeat this route-to-snapshot audit when new mutations are added; end-to-end runtime behavior remains unverified because tests and server runs are not authorized by the repository instructions.
- Runtime visual acceptance has not been completed. No development server was started during these changes, in keeping with the user's instruction to run the project manually.
- Automated tests remain unrun under the repository instruction to run them only when requested.
- Existing API clients can use the order-level refund route; omitting `amount` defaults to the remaining amount of the latest successful transaction.
- Role presets now match the planned taxonomy; remaining broad work includes full feature-by-feature list/detail coverage. Public registration remains disabled by default and can be enabled in security settings. Checkout continues to use COD as the default payment method.
- Delivery retries require the database queue and configured SMTP; analytics ID remains stored until consent-aware tracking is implemented. Unpaid timeout currently excludes COD orders because COD remains the only checkout method.

### Latest E3 refund follow-up

- Applied `2026_10_25_014356_create_payment_refunds_table` to local MySQL (batch 18); its status is `Ran`. Legacy fully refunded payments are backfilled during this migration.
- PHP syntax checks and Pint passed for changed backend files. OpenAPI type generation passed. No tests or frontend build were run in this continuation.
- Dashboard, revenue reports, coupon and payment-method revenue, customer spend, and product/category revenue now subtract append-only refund amounts, including partial refunds. Item refund value is allocated by line-total share.
- Development servers were not started or stopped.

### E5 product list follow-up

- Added server filters for multiple categories, brands, and collections; detailed stock state; sale/image presence; creation date; and preserved price-range, gender, featured/new, status, search, and sort filters. Product quick tabs now cover all, active, draft, out-of-stock, and archived views.
- Added table/card-grid selection, price, stock, sales, rating, status, and permission-aware action views. Added filtered streaming CSV export with spreadsheet formula-prefix neutralization, and bulk category assignment plus additive collection/tag assignment. Archive checks `products.delete` on the API even though the shared bulk route also serves update actions.
- Archived soft-deleted product rows now return the `archived` display state; product price-range limits apply to the same variant. OpenAPI and generated admin/storefront declarations were updated.
- No tests or frontend build were run; development servers were not started or stopped.

### A3 shared table follow-up

- Shared data tables now persist column visibility per signed-in account and table, support Shift-click range selection on the current page, and pin explicitly marked first/last columns (including recognized action columns) while horizontally scrolling.
- The shared table now exposes 10/20/50/100 page-size choices. Product, order, inventory, and review list requests use the selected account preference and reset to page one when it changes.
- Added the shared page-size event/state bridge and wired it into tags, catalog references, coupons, content pages, customers, staff, operations, activity logs, personal activity, shipping methods/rates, and inventory movements. Their API query keys and `per_page` values now follow the account preference.
- Audited the repository's shared `DataTable` call sites; all server-paginated tables now expose the account page-size preference, and their list query keys refresh when that preference changes. Product card-grid pagination exposes the same 10/20/50/100 control.
- A3 list behavior now has URL-backed filters and presets, advanced-filter Sheets where filters warrant them, removable chips, shared sort and page-size controls, account-scoped column visibility per route, current-page Shift range selection, and pinned first/action columns. Continue the full requirement audit and address any list-specific exception found.
- Closed the account-session list pagination gap: `/account/sessions` supports validated `page`/`per_page` parameters and pagination metadata for the admin while preserving the legacy response for callers without those parameters. Admin page size follows the account preference and page state is URL-backed. Updated OpenAPI-generated client types, the account page spec, and the auth API contract. Type generation, targeted ESLint, admin production build, PHP syntax, and Pint formatting checks passed; no tests were run.
- Updated the shared table's result summary to display the visible row range and total (for example, “Hiển thị 21–40 / 128”), matching the A3 pagination layout across every list that supplies server totals. The broad shared-primitives acceptance remains open pending the remaining screen-by-screen audit.
- Closed another concrete A3 gap: product, order, and inventory headers now trigger their existing allowlisted server sorts and persist them in the corresponding URL state. Review columns now expose server sorting for their visible fields; the review Form Request validates sort fields/direction and OpenAPI/types are synchronized. Updated the operations spec. API type generation and PHP Pint/syntax checks passed; no frontend checks or tests were run.
- A3 standardizes secondary row actions with the accessible `RowActionsMenu` (`Ã¢â€¹Â¯`) on products, orders, payments, shipments, inventory, reviews, coupons, banners, content pages, catalog references, tags, product variants, shipping methods/rates, staff records/invitations/approvals, and active sessions. Destructive choices are grouped last; quick status controls stay in their table column. Admin production build passed; lint reported zero errors and nine warnings.
- E4 now filters shipments by carrier name on the server. The URL-backed filter appears as a removable chip, persists in saved filters, and also applies to CSV export. Updated OpenAPI, generated admin/storefront declarations, and the operations page spec. Admin build/lint, Pint on the modified PHP files, and PHP syntax checks passed; no tests or servers were run.
- E5 product row menus now include a new-tab storefront preview for active products, alongside edit, duplicate, and archive actions.
- C2 now includes the planned **Xem cÃ¡Â»Â­a hÃƒÂ ng** account-menu item, opening the configured storefront root in a new tab.
- A1/B collapsed sidebar groups now open their authorized navigation popover on hover, while retaining the Radix trigger interaction for keyboard use. Admin build passed; targeted ESLint found zero errors and the same two existing hook-dependency warnings in `App.tsx`.
- A3 now uses the shared row menu for actions in the sortable category/attribute lists and banner reorder list; drag handles remain separate. Updated the store-operations page spec.
- D/E2 single and bulk cancellation dialogs now require a reason category and show a required description only for “Khác”; the selected human-readable reason continues through the existing note/history API. Updated order and lifecycle documentation. Admin build passed; targeted ESLint had zero errors and one existing React Hook Form/compiler warning.
- Added account-scoped named filter presets with apply, save, and delete actions. Wired them into product, order, inventory, review, customer, activity, staff, operations, catalog-reference, tag, coupon, content, shipping-method, shipping-rate, and inventory-movement lists. Applying a preset restores its filter and sort values through the existing URL-backed list state.
- Added a reusable right-side advanced-filter Sheet with draft values, apply, and reset controls. Customer order-count, last-purchase range, province, and gender filters now use it; filters only alter the list after Apply.
- Moved the product list's featured/new status, stock, sort, category/brand/collection, audience, price range, sale/image, and created-date filters into the same Sheet. Search and product status remain quick filters; saved presets continue to apply both quick and advanced values.
- Continued the A3 source audit: personal activity, content pages, and login sessions now expose server-side sortable visible columns with URL-backed sort state; saved activity/content filters retain non-default sort. The sessions API keeps the current session first and uses allowlisted sort fields. Coupon usage history now follows the shared page-size preference. Updated OpenAPI, generated client types, and account/operations UI specs. PHP syntax and Pint checks passed; no frontend tests, build, or visual QA were run.
- A 41-call-site TypeScript AST audit confirmed the 21 server-paginated admin list tables expose shared pagination, page size, and sort controls; report aggregates and product-detail variant snapshots are bounded non-list tables. The audit also found reviews had a custom checkbox column that bypassed shared select-all and Shift-range behavior; replaced it with shared row selection and capped selections at the API's 100-review limit. Updated the reviews page spec. Runtime/visual validation remains deferred.
- Recorded screen-by-screen list evidence in `docs/ui-ux/page-specs/admin-list-audit.md` and split the broad shell acceptance item: the list/table criterion is complete from source evidence; shared form adoption remains open for its own screen-by-screen audit.
- Form audit found the product creation sticky Save and Save Draft buttons were active before any input. Both now require the aggregate dirty state, which includes product fields, uploaded/staged images, selected colors/sizes, and variants. Updated the product page spec; no frontend checks or tests were run.
- Continued the required-field label audit: staff name/email/role/status and create-only password, catalog reference name, shipping method name, and province-rate code/name now show the required marker. Updated the staff and store-operations page specs. No tests or frontend checks were run.
- Expanded the form audit across customer editing, inventory adjustment/manual receiving, product editing and variant forms, account password/email changes, coupon/banner forms, payment refunds, order address edits, shipment status, and store identity. Added missing required markers and strengthened product edit validation for required name, slug, SKU, category, and integer base price. Updated the affected page specifications. The all-screens form primitive criterion remains open while the audit continues. No tests, frontend checks, or visual QA were run.
- Tightened shipping method and province-rate fee validation to require non-negative integer VND and marked those fees required. Manual stock receipts now mark and enforce their required note; customer and order internal notes expose their minimum lengths as required. Updated inventory, order, and store-operations specifications. No tests or frontend checks were run.
- Continued the required-marker pass into stock threshold editing; the dialog now marks the validated integer threshold required, and the inventory specification records the save behavior. No tests or frontend checks were run.
- Source scan found the variant bulk editor did not mark its target field/value as required, even though Apply stays disabled until a value is selected. Both controls now show required markers, and the product spec reflects that constraint. No tests or frontend checks were run.
- Remaining A3 work includes moving advanced filters into the Sheet on other suitable lists and checking selection/pinned-column behavior on each list. The shared URL-state hook already restores all registered filter and page values on browser Back/Forward.
- Extended browser Back/Forward synchronization to restore filters and pagination on the main product, order, inventory, and review lists; sidebar navigation now runs the same URL hydration path.
- Moved review criteria (rating, image, verified purchase, fit, and dates) and inventory category/brand/color/size/sort criteria into the shared advanced-filter Sheet. Applying an advanced filter or saved preset now writes its complete filter set as one history entry.
- Moved inventory movement type, actor, and date criteria into the shared advanced-filter Sheet; SKU/product search remains in the quick bar and saved presets retain the full filter set.
- Moved staff role and last-login date range into the shared advanced-filter Sheet; search remains quick and status remains in the status tabs.
- Consolidated customer registration dates, spend range, email verification, order count, last purchase, province, and gender into the advanced-filter Sheet. The quick controls now contain search only, alongside the status tabs; presets and exports still include the full filter state.
- Moved activity-log staff, module, action, IP, and date filters into the shared advanced-filter Sheet; actor/path/value search remains in the quick bar, with saved presets and CSV using the full set.
- Grouped filters across operations lists in the shared advanced-filter Sheet: payment method/date/amount, shipment dates, movement type/dates, cart inactivity/value/customer/date, and wishlist category/date. Search and payment/shipment status tabs remain quick; filter URL state still feeds exports.
- Added the A3 density selector to the shared table toolbar. It uses the existing account-level appearance preference, updates the same saved setting as the appearance page, and applies compact or comfortable row spacing across tables.
- Added a shared removable-filter-chip row and wired it into customer, activity-log, staff, inventory-movement, and operations lists; each chip clears its URL-backed criterion independently and the existing clear-all action remains available.
- Wired removable chips and complete clear-all behavior into the main product, order, inventory, and review lists, including their quick tabs and advanced filters.
- Wired removable chips into the remaining shared-filter lists: coupons, banners, catalog references, tags, content pages, personal activity, and shipping methods/rates. A source audit now finds one `activeFilters` prop for each of the 16 `FilterBar` usages.
- Aligned sidebar groups, labels, and direct links with the planning; added low-stock URL hydration and item popovers for collapsed sidebar groups. Extended the permission-filtered alert count API with delivery-failed orders and added its sidebar badge. Regenerated frontend API declarations from OpenAPI.
- Added collection selection to the product creation form and validated/saved collection memberships in the same database transaction as the product, variants, tags, and initial stock. Updated the OpenAPI contract and product form acceptance notes.
- Completed the alert popover's failed-delivery group with the latest five affected orders and added a persistent-notification “mark all read” action. Updated the alert contract, generated API declarations, and shell documentation.
- Standardized search debounce through a shared 300 ms hook for URL-backed admin lists, global search, inventory lookups, and manual-order product/customer lookups. Inputs and URL state remain immediate while request keys use the settled search value.
- Applied the A3 advanced-filter Sheet to catalog categories/collections and campaigns. Category hierarchy/product-presence and collection date criteria now apply together as one URL history entry; coupon type/date and banner position follow the same apply/reset flow, while common search/status controls stay quick.
- Completed the shared table's A3 sort cycle: sortable headers now switch ascending, descending, then clear the sort back to the list default across admin list screens. The table also persists per-user column visibility and supports shift-range selection and pinned edge/action columns.
- Added a shared unsaved-form guard and applied it across all React Hook Form editors found in the admin, including campaign/content/catalog/customer/shipping/staff editors, account forms, shipment/order/inventory dialogs, product editors, and product-image metadata/uploads. Custom-state notification preferences, two-factor inputs, payment and review dialogs, inventory thresholds, and saved-filter drafts now use the same route/unload guard; dialog close/cancel confirms before discarding. Product create/detail and catalog-reference editors now register with the shared route guard, including browser Back. Save controls in these editors disable until changed. A source scan found no remaining admin `useForm` component without a dirty guard; broader planning acceptance remains in progress.
- Connected dirty-form registration to the admin router: sidebar/search navigation and browser Back now ask before changing routes, while same-route list-filter history remains navigable without a form warning.
- Regenerated admin/storefront API declarations after the create-product and alert contract changes and formatted the modified PHP files with Pint. No tests or frontend build were run.
- No frontend checks or builds were run, per project instructions.

### C3.1 profile avatar follow-up

- Added a square avatar crop dialog with preview, zoom, horizontal/vertical positioning, and a 512 Ãƒâ€” 512 canvas export before upload. Crop selection is treated as unsaved state; closing it or navigating away asks before discarding, and upload errors keep the crop available for retry.
- Aligned the admin profile name field to the planned 2Ã¢â‚¬â€œ100 character range, marked it required, and added an explicit Cancel action that confirms before resetting dirty profile values.
- Extended the self-account API resource with status, creation time, and last login; the admin profile now shows these with email and role as read-only fields. The shared profile endpoint enforces the 2Ã¢â‚¬â€œ100 name range, and OpenAPI plus generated admin/storefront types match the response.
- Updated the account page specification. No frontend checks or builds were run, per project instructions.

### C3.1 avatar crop error handling

- The crop dialog now reports unreadable or invalid image data and keeps cropping/upload disabled until a valid image loads. Re-selecting a file resets the preview and crop controls to that file's initial state. The account page spec records this behavior.
- No frontend checks or builds were run, per project instructions.

### C2 account-menu logout confirmation

- Added a keyboard-navigable Security submenu with direct links to password, login email, and 2FA sections. Added a confirmation dialog before admin logout; confirming invokes the existing API logout flow, which revokes the current session and returns the user to login.
- Updated the account page specification. No tests or frontend build were run, per project instructions.

### C3.2 password visibility controls

- Added accessible show/hide controls to password fields rendered through the shared admin `FormField`, including login, invitation acceptance, password recovery, session reauthentication, staff forms, and account security forms. Existing autocomplete, controlled values, and form validation are retained.
- Completed password-change guidance in account security: added the four-level meter checklist, validation that the new password differs, a checked-by-default option to revoke other sessions, and a queued email security notice. The backend preserves the active session, always revokes trusted-device records, and defaults missing options to revoking other sessions for older clients. Updated both password endpoints, OpenAPI types, and security/account documentation.
- Updated the account page specification. No tests or frontend build were run, per project instructions.

### C3 account tab keyboard behavior

- Account profile, security, and sessions tabs now use roving tab focus, respond to Left/Right Arrow and Home/End, expose linked tab panels, and retain the existing unsaved-change confirmation when keyboard navigation activates another tab.
- Added visible keyboard focus treatment and documented the interaction. No tests or frontend build were run, per project instructions.

### E23 activity snapshot coverage follow-up

- Extended the account-write audit middleware to cover the legacy admin password-change endpoint too. It records the safe `password` changed-field marker and before/after session revocations while excluding password values; the endpoint still keeps the active session valid. PHP Pint passed. No tests or server were run.
- Fixed single-resource audit diffs to compare stored values before redaction, then redact the values and emit explicit `changed_fields`; secret-like fields now remain visibly changed without exposing their content. Audited all current admin mutation routes from Laravel's route registry and checked their resource or batch snapshot paths; the remaining E23 concern is continued coverage for related pivots and non-resource writes. Updated the operations spec. No tests or servers were run.
- Staff invitation acceptance now records the invitation status, created account, and assigned role as a personal activity entry inside the same transaction; the token-free path and changes never include password values. Updated the operations spec. PHP Pint passed; no tests or servers were run.
- Corrected activity-log resource resolution for staff invitations/roles, customer notes, inventory variants and adjustment vouchers, product variants/images, payments, shipments, shipping rates, and notifications. The middleware now resolves nested IDs/foreign keys explicitly, avoiding snapshots of an unrelated row that happens to share a parent ID.
- Before/after values now include only columns that actually changed. Core bulk order/product/review updates, inventory thresholds, catalog/banner/image reordering, collection product ordering, and tag merges snapshot the targeted rows (up to 100); staff role assignments, permission matrices, and product/tag/collection relationships are also captured, including links created with new staff/products. Nested values are capped, and payload/authorization/cookie fields are redacted.
- Settings updates now snapshot their submitted key-value rows and record actual before/after changes; bank account values are redacted without hiding whether the field changed.
- Added snapshot mapping for the `/colors` and `/sizes` route aliases so create/update/delete logs read `attribute_values` rows, matching the already mapped `/catalog-options/{kind}` endpoints.
- Added before/after snapshots for related order history and payment records during status/payment/shipment/refund operations; refund rows and manual-order item/payment rows are now included as grouped records.
- Updated the operations page specification. PHP Pint passed on the modified middleware. Inventory CSV receipts (first 100 matched variants) and multi-SKU adjustment vouchers now snapshot inventory rows plus each variant's latest movement before and after the write. Product creation, duplication, variant creation, and image mutations capture their child variant/inventory/movement/image rows; staff session revocation compares affected access and refresh session rows with token hashes redacted. Order status changes now capture inventory/reservation movements and coupon use/release alongside order history; manual orders include coupon and stock reservation changes. Successful multipart admin uploads outside inventory CSV import now record sanitized file metadata and a SHA-256 digest in before/after detail rows; raw bytes and URL query values are excluded. Collection deletion now snapshots product memberships before/after the cascade. Review moderation and deletion now snapshot affected product rating aggregates alongside the review rows. A source audit of all registered admin mutation routes and direct pivot writes found no additional uncovered path; no tests or frontend build were run.
- Added authenticated account write auditing for profile/avatar, email-change requests, password and session changes, user preferences, and two-factor management. Before/after values are compared by field; password material, 2FA secrets/codes, and token values are omitted or redacted. Signed email-change confirmation also records a safe before/after email change. The account activity page's audit feed now includes these events; no tests or frontend build were run.
- Extended staff session audit snapshots to staff-account soft deletion as well as explicit “revoke all sessions”. Before/after records include the affected refresh/access session rows; token fields stay redacted, and the route is restricted to the two session-revoking DELETE paths. Updated the activity-log page specification. No tests or servers were run.
- Fixed customer avatar URLs in the admin list and detail view by resolving relative storage paths against the API origin through the shared `mediaUrl` helper. Added the fallback behavior to the customer page spec. No frontend checks or build were run.
- Completed the C3.6 appearance-page preview: a sample admin header, KPI cards, and status table now reflect the current theme, accent, and density choices as they are applied. Updated the admin settings guide. No frontend checks or build were run.
- Corrected the admin shell's inline sidebar variables to the planned 260px expanded and 72px icon widths; updated the design guide to match and to document all three admin theme modes.
- Completed E2.1 transition confirmations: individual and bulk status changes now open a dialog with an optional history note, and the delivery/COD dialog includes the same note while preserving its collection choice and guarding unsaved text. Updated admin order acceptance and lifecycle/state documentation. The API already accepted the note field, so the contract and backend did not need changes. No frontend checks or build were run.

### E12 inventory movement route-state follow-up

- Moved inventory movement URL initialization into the page component so filtered links opened after the SPA starts hydrate from the current URL. The page already synchronizes Back/Forward and writes search, filters, sort, and pagination to the URL.
- Added the inventory movement URL and shared page-size behavior to the operations page specification. No frontend checks or build were run, per project instructions.

### C3.5 personal activity filters follow-up

- Added the account and authentication modules plus login, logout, email-change, and export actions to the personal activity filters. The filters now cover the module/action values written by the admin audit paths. No frontend checks or build were run, per project instructions.
- Updated both personal and admin activity detail sheets to display the audit `changed_fields` list alongside available before/after values, including field-name-only entries for password changes whose values are intentionally never captured.

### Admin interface build repair

- Fixed malformed JSX in the admin login password toggle and category parent selector that prevented TypeScript from parsing the application.
- Fixed additional build blockers in the admin shell, shared data table/form field, activity log, report filters, and global search. The admin production build now completes successfully.
- Follow-up cleanup removed redundant review error wrappers, replaced table mutation expressions with explicit branches, derived the reauthentication email from current props, and moved the 2FA status request into TanStack Query. Avatar blob preview setup and the event-only unsaved-form callback now document their intentional effect/ref use.
- Admin `npm run build` and `npm run lint -- --quiet` both pass. Production build still reports the existing large JavaScript chunk advisory. No server was started or stopped; no tests were run.

### E23 notification read audit follow-up

- Added before/after batch snapshots for notifications changed by the bulk “mark all read” action, scoped to the authenticated admin's own unread notification records. Existing audit redaction and batch-size limits apply; the API result keeps the full updated count.
- Updated the activity drawer to expand batch snapshots into per-record, per-field before/after rows. Documented both audit and display behavior in the admin shell spec.
- PHP Pint, `php -l`, and Laravel route middleware inspection passed; admin `npm run build` and `npm run lint -- --quiet` passed. No tests or servers were run.

### E2 current delivery-address selectors

- Replaced manual province/district/ward code entry and the incomplete edit-address form with dependent province and commune/ward selectors, matching the current two-level administrative structure.
- Generated the bundled 34-province, 3,321-commune catalog directly from the National Statistics Office's public SOAP catalog for 25/10/2026. No runtime catalog service or new database table is required.
- Manual orders now send official province/commune codes and display names; district codes remain nullable for compatibility. Editing an existing order preserves legacy district and other address snapshot fields while updating the new province/commune selection.
- Added ADR-0012 and aligned OpenAPI, data-model, architecture, and admin operations documentation. API type declarations were regenerated and Pint passed for the modified PHP files. Address summaries and print documents now omit codes; the API and UI block address edits after delivery, completion, return, or cancellation. Admin production build and lint passed; build reports the existing large JavaScript chunk advisory. No tests or servers were run. Fixed a nullability issue in the store timezone field exposed by the production build.

### E11 inventory CSV pre-import validation

- Added a read-only server preview for CSV imports that checks row format and SKU existence before confirmation. The UI shows row errors and downloads them with their original SKU, quantity, and note; SKU existence checks are batched, and the final import still rechecks each SKU inside its transaction and imports valid rows. Updated OpenAPI and the inventory page specification. Admin build, PHP Pint, and PHP syntax checks passed; no tests or servers were run.

### E5.1 product variant bulk editing

- Added a shared bulk editor to product creation and editing for variant sale price, comparison price, weight, and active state; create also supports initial stock. Empty comparison prices can be cleared with `0`. Existing on-hand quantities stay read-only here and remain managed through inventory actions. Updated the product page specification. Admin production build passed; no tests or browser checks were run.

### A2/A3 banner list consistency

- Banner lists now use the account's shared page-size preference, account-scoped saved filters, and a clear-filter empty result when search or filters return no rows. Updated the store-operations page specification. Admin production build passed; no tests or browser checks were run.

### A3 collection product picker

- Added account-scoped saved search and sort presets to the collection product picker; applying a preset clears its old page and selection state. Updated the catalog page specification.

### A2 variant matrix replacement guard

- Product creation now confirms before regenerating a populated variant matrix, explaining that existing SKU, price, initial stock, and status edits will be replaced. Updated the product page specification. Admin production build passed; no tests or browser checks were run.

### A3 personal activity presets

- Added account-scoped presets for the personal activity page's module, action, and date filters. Applying a preset updates the URL-backed state together and returns to page one. Updated the account page specification. Admin production build passed; no tests or browser checks were run.

### A3 staff invitation and approval presets

- Added separate account-scoped saved filters for pending staff invitations and approval requests, including their search and table sort. Applying a preset updates the URL-backed list state together and resets the relevant table to page one. Added the staff page specification. Admin production build passed; no tests or browser checks were run.

### C3 shared account navigation

- Added one six-item account navigation across profile, security, sessions, notifications, activity, and appearance. It is vertical on desktop, horizontal and scrollable on narrow screens, and routes through the shared unsaved-form guard. Replaced the removed account tabs' outdated keyboard acceptance note in the account specification. Admin production build passed; lint passed with 0 errors and 9 existing warnings; no browser checks were run.

### A3 status tab counts

- Added server-side counts to product, inventory, customer, staff, coupon, review, payment, and shipment status tabs. Counts respect applicable active search and advanced filters while ignoring the selected status. Fixed inventory tabs reading the review count state. Updated OpenAPI and generated TypeScript declarations, and documented the counts on the affected page specifications. Laravel Pint, PHP syntax checks, OpenAPI type generation, admin build, and lint passed; lint has 0 errors and 9 existing warnings. No tests or servers were run.

### A2 manual-order field errors

- Routed Laravel 422 errors for customer, recipient, province/ward, address, shipping method, coupon, and item quantity fields to the matching controls. Added shared FormField labels and inline errors, cleared stale errors as fields change, and kept item errors aligned when a selected row is removed. Updated the admin order page specification. Admin production build passed; lint passed with 0 errors and 9 existing warnings. No tests or servers were run.

### A2 payment action field errors

- Standardized COD collection and refund dialogs on the shared `FormField` component. Laravel 422 errors now attach to the refund amount and reason/note controls; collection's API `note` key maps to the reason control. Local range and minimum-length checks display beside the relevant field. COD collection from order detail also maps server validation for `note` to its control. Admin production build passed, and ESLint passed for both changed React modules. The full `npm run lint` command stalled without output in this environment. No tests or servers were run.

### E19 content preview parity

- Aligned the admin rich-text preview's title scale, body spacing, headings, lists, blockquote, and overflow behavior with the storefront content page; the mobile title follows the storefront breakpoint. Both admin and public page responses use the shared server sanitizer. Removed duplicate `meta_title` and `meta_description` keys from the shared `PageResource` array. Updated the operations spec to reflect the implemented sanitized rich-text schema and preview behavior. Admin production build, targeted ESLint, PHP syntax, and Pint checks passed. Browser visual QA and servers were not run.

### B sidebar destination audit

- Audited the admin navigation page registry, direct-path map, and screen render branches. Navigation destinations map to dedicated feature screens, while unknown paths and permission failures render explicit 404/403 states. Marked that acceptance criterion in the operations page spec; the broader list, permission, and mutation acceptance criteria remain open pending their own audits.

### B notifications mutation errors

- Added visible inline error feedback when marking one saved notification as read fails; the notification stays in the list and can be retried. Admin production build and targeted ESLint passed. No tests or servers were run.

### B/E admin operations acceptance audit

- Audited the 41 `DataTable` call sites and shared table behavior: operational list views use manual server pagination/sorting and expose loading, empty, error, and retry states; report/detail tables are bounded aggregate or snapshot views. Reviewed the admin navigation/page render registry, protected route middleware, React Query mutations, and caught admin write flows. The source audit found registered API mutations guarded by permission middleware and all write paths show feedback; audit snapshot coverage for registered mutation routes and pivot writes was recorded above. Marked the corresponding store-operations acceptance criteria complete. This is a source audit; automated and runtime checks were not run.

### E24 settings coverage audit

- Confirmed the general store settings form includes store name/logo/favicon, contact details, address, social links, opening hours, read-only timezone, and read-only VND currency; the payments form includes COD/bank-transfer flags, bank details, and the unpaid-order timeout. The API supplies timezone and settings writes are permission-gated. No settings code change was needed in this audit.

### E14 review form primitive and validation

- Replaced the hide-review dialog's manual label with shared `FormField`; local minimum-length errors and Laravel 422 `reason` errors now appear beside the textarea for single and bulk moderation. Preserved actionable non-validation errors. Updated the operations page spec. Admin production build passed; targeted ESLint had zero errors and two existing hook-dependency warnings in `App.tsx`. No tests or servers were run.

### E20 report export audit

- Confirmed all six report sections use named endpoints, CSV export follows the selected section/date range, and the print stylesheet supports browser Save as PDF by hiding admin chrome and filters. Updated the report page spec to reflect the existing CSV/PDF controls. Responsive visual review remains deferred per the user's earlier preference.
- Wired the admin account profile form to the existing staff metadata API fields: job title, department, bio, signature, and timezone. OpenAPI frontend types regenerated; admin production build passed (	sc -b && vite build). The account page is code-split; Vite still reports the existing large main chunk warning. No tests run. Pint --dirty could not run because this workspace has no Git repository; no PHP files changed in this continuation.
- User reported the admin UI issue is no longer occurring.
- Added the seven-step account completion checklist to the cached menu summary and displayed incomplete steps as direct links. Updated the OpenAPI contract, generated admin/storefront API types, and account-menu documentation. Pint and PHP syntax checks passed; admin build passed. Admin lint passed with zero errors and nine existing warnings. No tests run.
- Final verification after moving frequent-item hydration out of a mount effect: admin lint exits successfully with zero errors (nine existing warnings), admin production build succeeds, Pint passes for the changed controller, and PHP syntax check passes. OpenAPI client types are current. The seven-step checklist reads onboarding state from the existing user_preferences table when it is present. No tests run.
- Expanded the account-menu quick-navigation group with permission-gated, prefiltered links for pending orders, failed payments, pending reviews, and low-stock inventory. Added a quick-create submenu for catalog, campaigns, banners, inventory adjustments, and personal tasks/notes. Existing admin URL filters are reused; no new API data or permissions were introduced. Admin lint exits successfully with zero errors (nine warnings); production build succeeds with the existing large-chunk warning. No tests run.
- Completed the account-menu quick-navigation and create submenu with permission-filtered pending-order, failed-payment, pending-review, and low-stock links using the existing URL filters. Recent-use tracking now recognizes these filtered routes.
- Expanded personal tasks with descriptions, editable status/priority, due times, reminder times, daily/weekly repetition, related records, assignee selection, and server-side priority/record filters. Added a minimal assignee directory that returns only active admin IDs/names and is permission-gated; assignment validation rejects non-staff or inactive accounts.
- Added scheduled task-reminder delivery, one-time/daily/weekly recurrence handling, and per-user in-app/email preferences. Added the task reminder event to account notification preferences and visibility.
- Updated OpenAPI and generated admin/storefront declarations, requirements, account-menu spec/tasks, UI docs, and data model docs. Pint and PHP syntax checks passed; Laravel lists the assignee route and reminder command/schedule. Admin lint passed with zero errors (nine existing warnings); TypeScript production build passed with the existing large-chunk warning. No tests run.

Admin account menu preferences now support hiding/showing groups and changing order. The layout saves to admin appearance preferences with API validation and OpenAPI documentation.

Added the admin notification center at `/notifications` with unread/archive tabs, event and priority filtering, search, pagination, mark-read, archive/restore, snooze, and delete. Notification retention now prunes read admin notices after 90 days. A new additive migration adds archive and snooze timestamps; apply migrations in the API environment before using these actions.

Added P2 focus mode from the account menu. It hides the sidebar and header, moves focus to the content area, and supports exit by button or Escape with focus returned to the account-menu trigger.

Added account-menu utilities to copy the current URL, refresh active query data, and remove inactive query cache while refreshing open queries without clearing login state or saved preferences.

Saved admin list filters now persist through `/me/views` with an additive `saved_views` migration, per-admin ownership, team sharing guarded by `saved_views.share`, and one default per admin/page. The shared filter control migrates old localStorage entries as each list page is opened and applies that page's default view. Added a grouped `/me/views` account page, account-menu link, OpenAPI contract and generated client types, ERD, and data model notes. Migration has not been run.

Completed the trusted-device management portion of P2 using the existing 30-day hashed-cookie records. Admins can list their own active devices and revoke one or all from account security; API responses include parsed browser/device metadata, IP, and expiry while omitting token hashes. Updated account-menu navigation, OpenAPI and generated client types, auth guidance, and feature docs. No schema migration was needed, and no tests or frontend checks were run.

Added P2 system health reporting guarded by `system.health`: database latency, configured queue backlog, failed-job count, scheduler heartbeat, mail transport configuration, storage capacity/write access, and runtime versions. The account menu and admin sidebar expose the page only to authorized roles; menu summary reports a compact overall status. Added a one-minute scheduler heartbeat, additive permission migration, OpenAPI schema, UI, docs, and menu group preference support. The permission migration has not been run; `schedule:work` must be active for the scheduler heartbeat to stay healthy. No tests or frontend checks were run.

Added the P2 account privacy page with background ZIP export jobs, signed seven-day downloads, daily expiry cleanup, browser storage/query-cache clearing that preserves the active in-memory login, a data-retention list, and password-confirmed deactivation requests. Added a `users.manage` review queue on Staff and roles; approval blocks the account and revokes refresh/access sessions, with last-active-admin checks on request and approval. Added migration `2026_10_26_000014_create_account_privacy_tables.php`, OpenAPI contracts/generated client types, the ERD, data model, and UI docs. Migration has not been run. No tests or frontend checks were run.

Extended the system page with a paginated failed-job list, sanitized first-line error summaries, confirmed retry and delete actions, and permission-gated API routes. OpenAPI and generated client types are current.

Added support tickets for signed-in admins with private image attachments, owner-scoped conversations, replies and contact information. Added the `support.manage` admin inbox with status/type/search filters, ticket assignment to eligible agents, status/severity updates, private downloads, and notifications for new tickets and replies. Added report-page and feature-feedback forms with route/browser/app context, screenshots, and a 1Ã¢â‚¬â€œ5 rating. Added migration `2026_10_26_000015_create_support_tickets_tables.php`, permission seeding, menu count, OpenAPI and generated types, ERD, data model, and account menu documentation. Migration has not been run. Passkey support remains pending because Composer could not resolve Packagist from this environment; no passkey dependency was retained.

Added `X-Request-Id` UUID response headers to API requests, exposed the header through CORS, and include the latest ID in submitted bug reports for easier support correlation.

Personal data exports now include the account owner's support tickets and message history, with safe attachment metadata only and no private disk paths. Export queries remain compatible with databases where the new support migration has not yet been applied.

Added searchable Markdown help with article feedback, static terms/privacy pages, and `/help/diagnostics` combining authenticated API/runtime details with browser and screen data. Added owner-authenticated `GET /admin/app-info`, OpenAPI and generated types, and account-menu links. At that point, static changelog, third-party license listing, onboarding tour, and passkeys remained in the plan backlog; onboarding was implemented in the following entry.

Added system announcements with date scheduling, audience targeting for all admins or selected roles, per-admin read tracking, read counts, and create/edit/delete administration behind `announcements.manage`. Added `/announcements` and `/announcements/manage`, the account-menu unread badge, migration `2026_10_26_000016_create_announcements_tables.php`, OpenAPI paths/schemas, and refreshed generated API types. Pint formatted changed PHP files. Migration has not been applied; no tests or frontend checks were run.

Added a role-aware admin introduction tour that opens on first login and can be rerun from the account menu. Added a permission-filtered getting-started checklist on `/help/tour`; tour and checklist progress persist in `user_preferences.admin_onboarding` through the existing account preferences API. Updated request validation, OpenAPI preference keys, account menu, and onboarding docs. No new database table is required. No tests or frontend checks were run.

Fixed active sidebar icon contrast for both expanded and collapsed navigation in light and dark themes. Tightened desktop account-menu group headers while keeping mobile touch targets at 44px. Added account-synced one-hour snooze for the onboarding tour, updated request validation/OpenAPI/UI docs, and retained permanent dismissal and manual rerun.

Kept the sidebar full-width while collapsing its table-of-contents groups on initial load. Account-menu sections now use hover submenus like the account-completion checklist and mirror the sidebar categories. Set the default theme for new accounts to light; saved theme choices remain respected. Limited the account-synced tour snooze to one hour and documented the behavior.

Moved account identity, email verification, and recent-login details into the main account-menu panel so they are visible without opening the profile submenu. Removed the copy-email action and its handler.

Moved account switching and sign-out on all devices into the account/security submenu. Added a one-time migration that resets legacy dark/system defaults to light while preserving later theme choices.

Aligned the sidebar's System category with neighboring groups: it expands inline when the sidebar is open, and uses the existing hover popover when the sidebar is in icon mode.

Added `/help/changelog` with current app version details, release notes, per-admin read tracking, and a new-version menu badge. Added `/help/licenses`, generated from installed npm package manifests and `api/composer.lock` by `scripts/generate-third-party-licenses.mjs`; the script runs automatically as the admin `prebuild` hook. The generated listing currently contains 498 npm/Composer notices. Updated OpenAPI preference keys and account-menu/data-model docs. No tests or frontend checks were run.

### 2026-10-25 â€” Personal API tokens

Added scoped personal API token management at `/settings/account/tokens`: admins with `api_tokens.manage` can create up to 10 tokens, select current permission scopes and expiry, use the 10-minute session-scoped sudo mode (with TOTP when enabled), copy plaintext once, inspect last-use time/IP, and revoke with confirmation. API tokens are accepted only on admin routes with explicit permission middleware; `RequirePermission` intersects each requested route permission with token abilities. Added additive token metadata and permission migration, owner control for non-expiring tokens, account activity audit snapshots without hashes/plaintext, OpenAPI operations and generated declarations, and auth/data/UI documentation. Expanded sudo mode to admin email/password changes, 2FA mutations, and passkey enrollment/removal, with the shared dialog used by account settings; storefront password checks remain required. Added passkey management and passwordless admin login using `laravel/passkeys`, five-minute one-use challenges, session-bound registration, the ordinary admin JWT/refresh-cookie issuance, login history, and secure-origin configuration. Added account security-alert preferences with mandatory credential-change notices and configurable alerts for new devices/IPs, repeated failed logins, and passkey enrollment. Migrations, frontend build, and application tests were not run.

Extended account-menu navigation to the existing notification preferences, personal support requests, permission-gated support inbox, announcement administration, store maintenance, and diagnostics pages; search and frequent-use tracking include those destinations. Disabling configurable security alerts now prompts for the shared sudo confirmation and is enforced server-side for the authenticated admin session. Updated OpenAPI and account-menu documentation. Pint passed; no tests or frontend build were run.

Continued the linked-accounts item from `ACCOUNT_MENU_PLAN_FULL.md`: added owner-scoped Google/Microsoft OAuth linking with single-use state and PKCE, server-side provider code exchange, UserInfo lookup, optional owner-only allowed-domain settings, activity audit, and metadata-only persistence. The account settings page exposes provider linking when credentials are configured. Telegram has hashed six-digit pairing codes, secret-checked private-chat webhook handling, test-message delivery, and guarded unlink. SSO login and Telegram notification preference delivery remain pending. Migration is unapplied; API type generation and Pint succeeded, and Laravel's route list confirms the callback and account routes. No tests or frontend build were run.

Added owner-scoped staff 2FA reset at `POST /api/v1/admin/staff/{staff}/reset-2fa`. The operation requires `users.manage` and the ten-minute sudo session, rejects self-reset, restricts resetting an `admin` to the store owner, clears authenticator/recovery secrets, revokes trusted devices and all sessions, records an activity log, and notifies the affected staff member. Added the action to staff row actions only for accounts with 2FA enabled, with a confirmation dialog and shared sudo prompt. Updated OpenAPI/generated types and auth documentation. Pint passed and the route is present in Laravel's route list; tests and frontend build were not run.

Added Laravel `Password::uncompromised()` to the shared password policy used by account changes, registration, staff invitations/creation, and recovery. The request uses five-character SHA-1 prefix lookup against Pwned Passwords with a five-second timeout; Vietnamese validation feedback and OpenAPI/privacy documentation were added. Generated frontend API declarations and Pint passed. No tests or build were run.

Added the P2 admin idle-timeout preference with 15/30/60/120-minute and disabled options. The admin receives a one-minute “stay signed in” warning before regular logout, and mouse/keyboard/touch/scroll activity synchronizes across tabs through `BroadcastChannel`. Added preference validation, OpenAPI schema, Security settings UI, and auth/UI documentation. Frontend build and tests were not run.

Extended admin session security with an independent auto-lock preference (5/10/15/30/60 minutes or disabled). Added `Ctrl/Cmd+L` and account-menu locking, cross-tab lock propagation, a full-screen overlay that preserves the live app state, password plus optional TOTP unlock, and current-session passkey unlock with session-bound one-use WebAuthn challenges. Five failed attempts end the session. Added throttled routes, OpenAPI, acceptance criteria, and security/UI docs. Pint and generated API types passed; frontend build and tests were not run.
### Account menu P3 scheduled reports
- Added additive `report_schedules` storage and owner-scoped create/list/update/delete API. Schedule management requires `reports.view` plus `reports.schedule`; recipients must be active staff accounts with `reports.view`; filters are allowlisted, frequency supports daily/weekly/monthly in an IANA timezone, and CSV/PDF output is supported.
- Added `/reports/schedules`, report saved-filter controls, a minute scheduler dispatcher, and queued email delivery. Runs create private seven-day `scheduled_report` export records.
- Added `/downloads` for personal-data ZIPs and scheduled report exports, including private authenticated download, expiry, delete, owner scoping, `exports.view_all`, retry for failed/expired files, and a link back to the schedule. No tests, lint, or frontend build run.



### 2026-10-26 â€” Admin build recovery
The first production build exposed existing JSX/type errors in security settings, account deactivation review, announcement route typing, hook declaration ordering, passkey mutation handling, menu API imports, and scheduled report form values. Fixed these issues; `npm run build` in `admin/` now completes successfully. Pint formatted the SSO controllers, and Laravel route listing confirms OAuth start, callback, completion, and account connection routes. No application tests were run.


### 2026-10-26 â€” Telegram notification channel
Added Telegram as an opt-in delivery channel for the admin notification types currently produced by the application. The account notification matrix shows the Telegram column and disables it until a Telegram account is linked. The queued notification channel sends concise text with an admin deep link and limits delivery to ten messages per admin per minute. Updated preference validation, OpenAPI/generated client types, docs, and the account-menu checklist. Pint and PHP syntax checks passed; Laravel exposes the preferences routes; the admin production build passed. No database migration or application tests were run.

### 2026-10-26 â€” Admin data export queue
Extended the Downloads Center with filtered customer, product, order, inventory, activity, and report CSV exports. Exports over 5,000 rows enter the queue; workers recheck the owner's active status and permission, cap active jobs at three per admin, keep files private for seven days, support retry, and notify the owner on completion. Streamed exports avoid loading all rows at once where the source endpoint supports cursors/chunks. Updated OpenAPI/generated declarations, the data model, account-menu docs, and the implementation checklist. Pint, PHP syntax checks, and route listing passed. Admin production build passed after fixing TypeScript narrowing in the Downloads and Reports pages. No application tests were run.

Added the missing **DÃ¡Â»Â¯ liÃ¡Â»â€¡u & tÃ¡ÂºÂ£i xuÃ¡Â»â€˜ng** account-menu group with links to Downloads for all admins, Imports for `inventory.view`, and scheduled reports for `reports.view` plus `reports.schedule`. Added the group to mobile accordions and synchronized hide/reorder preferences, and documented its permission behavior. Added a direct failed-job link for `system.health` users and an anchor on the existing system page. Regenerated OpenAPI declarations and the admin production build passed. Backup architecture investigation found that Spatie's package matches the plan but Composer cannot resolve Packagist in this environment; Composer restored its manifest/lock changes. The system backup feature remains unimplemented and the wider menu audit remains open.

### 2026-10-26 â€” Staff security permission boundary
Added the additive `staff.security` permission and granted it to the default admin and store-owner roles. Staff password-reset email, session revocation, and 2FA reset controls now require that permission; reset links use an authenticated staff endpoint, session revocation is audited, and 2FA resets require recent authentication, sudo confirmation, and a recorded reason. Updated OpenAPI, role docs, and the account-menu link. Migration is not applied. No tests were run.

### 2026-10-26 - System backups
Implemented the planned system backup area after the admin UI issue was reported resolved. Added Spatie Laravel Backup 10.3.3, encrypted private database and uploaded-media ZIPs, a queued manual run, run history, authenticated downloads, seven-day cleanup, and a 48-hour warning in System health. Added system.backup, two additive migrations, OpenAPI schemas/routes, account-menu and sidebar links, and updated RBAC, ERD, data model, and UI docs. The migrations are now applied. Composer autoload and Laravel package discovery succeeded, though the install attempt encountered a Windows lock on a vendor shim while updating 21 dependency versions. Production requires PHP ZIP, Linux, mysqldump, a queue worker, and BACKUP_ARCHIVE_PASSWORD; local Windows currently has no mysqldump on PATH. No application tests or frontend checks were run.

### 2026-10-26 - Account table column defaults
Added per-table visible-column settings to account-synced admin appearance preferences. DataTable registers visited table definitions in browser storage; the preferences page lists their hideable columns, applies changes immediately, and can restore all columns for a table. Added API validation and OpenAPI schema, then regenerated admin and storefront API declarations. Fixed an unmatched parenthesis in the table-preference registry helper that could prevent the admin from compiling. No tests or frontend build were run.

Continued the account-menu plan audit. Marked the appearance controls complete in the account-menu task tracker after confirming the page, account sync, and OpenAPI support; noted that no admin calendar currently consumes the saved week-start preference. Started the remaining English localization by translating account-menu group labels, profile checklist labels, presence controls, quick tools, and focus-mode exit text. Full admin-wide English coverage remains open. No tests or frontend build were run.

Continued account-menu English localization: translated all account-menu groups and links, status and loading feedback, profile checklist, recent-item controls, search/account-switch/help dialogs, confirmations, quick actions, and dynamic date labels now use the selected locale. Added matching English resources; a source scan found no remaining literal Vietnamese JSX text in AdminAccountMenu, no missing literal t() keys, and no duplicate translation keys. Updated the localization task and UI documentation. This is a source audit only; no frontend build or tests were run. Admin-wide translation remains incomplete.

Completed the remaining account-menu localization details: mobile sheet text, account switch and search dialogs, help and shortcut content, sign-out confirmations, action toasts, recent-item dates, and account/presence/alert accessibility labels now use English resources. Source scans report no untranslated static Vietnamese JSX text in the account menu, no missing literal translation keys, and no duplicate English dictionary keys. No frontend build or tests were run.

Continued the English localization audit in admin appearance preferences. Dashboard/widget settings, navigation pins, preview content, table density and columns, accessibility controls, JSON import/export feedback, shortcuts, account-menu ordering, and screen-reader action labels now pass through the translation resources. Added the English strings and verified there are no duplicate resource keys or missing literal translation entries in this page (excluding a custom-event name caught by the simple source scan). Broader admin page/form/notification/error localization remains open. No frontend build or tests were run.

Continued English localization on the personal permission summary. Permission groups, role names, granted/missing states, permission request form, retry/loading/error and empty states, request history, and dates now use the selected locale; permission search matches both Vietnamese and English labels. Added bundled English strings and marked this page complete in the localization checklist. The full admin-wide translation remains open. No frontend build or tests were run.

Translated the personal privacy/data page, including export and deactivation request states, browser-storage controls, retention descriptions, locale-aware timestamps, error/empty/loading feedback, and both confirmation dialogs. Updated the account-menu localization checklist and UI documentation. Source scan found no missing literal English resource entries or duplicate dictionary keys for this page. No frontend build or tests were run.

Translated the personal reminders page. Reminder status, recurrence, snooze durations/actions, empty/loading/error states, pagination labels, and date formatting now follow the selected admin locale. Added English resources and checked the page's literal translation keys; no frontend build or tests were run.

Translated the shift and handoff page, including active/inactive shift states, start/end feedback, handoff guidance, weekly duration units, history, pagination, and server conflict messages. Dates and times now use the selected locale. No frontend build or tests were run.

Translated the login history and security score page, including login result filters, dynamic security checks, loading/error/empty feedback, IP/device fallbacks, and locale-specific timestamps. Updated account-menu localization documentation and checklist. No frontend build or tests were run.

Translated account notification delivery preferences and their security-alert, Do Not Disturb, digest, and browser-push panels. Notification types/channels, quiet-hour weekdays and presets, digest settings, push-device states, feedback, and accessibility labels use the selected locale; push timestamps also follow it. Updated the UI docs and localization checklist. A source scan found no missing literal translation entries or duplicate dictionary keys in these files. No frontend build or tests were run.

P0 notification audit found that the notification center's permission filter omitted owner-scoped `permission_request_result` and `export_complete` events; the unread summary also omitted those events, `weekly_report`, and `admin_digest`. Added both owner-scoped event types to the notification visibility allowlist and menu count, plus `weekly_report` gated by `reports.view`. Removed a duplicate support-event append and documented the count behavior. No tests or application checks were run.

P0 permission audit found that `/account/menu-summary` ran the system-health probes and returned their status to admins without `system.health`. It now skips those probes and returns `unavailable` for those admins; OpenAPI, generated admin/storefront types, and UI documentation now describe that value. Also repaired mojibake in system-backup health messages. `npm run api:types` completed successfully as required contract generation; no tests or application checks were run.

P0 account-trigger audit found isolated system-health errors were counted as critical but omitted from the total that decides whether the trigger badge renders. Added health errors to that total and documented the critical badge behavior. No tests or frontend checks were run.

Translated idle logout and automatic screen-lock settings, including all duration choices, help text, and save/load feedback. Updated the account-menu localization checklist and UI documentation. No tests or frontend checks were run.

Translated account passkey management labels, empty/loading/error states, registration and removal feedback, confirmation text, and locale-aware dates. Updated the localization checklist and account UI documentation. No tests or frontend checks were run.

Translated the personal activity page filters, module/action names, change details, empty/error states, and table headers. Added English dictionary entries and updated the account localization checklist and UI docs. No tests or frontend checks were run.

Translated linked-account status and actions for Google, Microsoft, and Telegram, including OAuth callback outcomes, Telegram pairing, confirmations, and expiry time formatting in the selected locale. A source scan found all literal translation keys and no newly duplicated dictionary keys. No tests or frontend checks were run.

Localized the account settings page's profile fields, email and password controls, session table, confirmation dialogs, validation messages, and password-strength guidance. Added English translations for the visible labels and feedback. Static source scan found all literal translation keys; dictionary scan found no new duplicate keys (three older duplicates remain elsewhere). No tests or frontend checks were run.

Localized the two-factor panel's enrollment guidance, loading/error/status states, recovery-code copy/download actions, confirmation dialogs, and activation timestamp. Static source scan found all literal translation keys; no tests or frontend checks were run.

Localized trusted-device guidance, status/errors, device revocation controls, confirmation, and last-used/expiry timestamps. Static source scan found all literal translation keys across the account settings, two-factor, and trusted-device panels. No tests or frontend checks were run.

Translated the personal API token page, including permission names, expiry options, loading/empty/error states, one-time plaintext guidance, copy feedback, and revocation confirmation. Static scan found all literal translation keys and the permission-label entries. No tests or frontend checks were run.

Translated the shared sudo-mode dialog's instructions, password/2FA labels, error, and confirmation states; this dialog is reused for sensitive account and staff actions. No tests or frontend checks were run.

Translated the avatar crop dialog instructions, zoom/position controls, accessible labels, image-processing errors, and upload actions. Static scan found all literal translation keys; no tests or frontend checks were run.

Localized the shared password-change dialog, including labels, validation feedback, errors, and the warning that changing the password signs out admin and storefront sessions. Static scan found all literal translation keys; no tests or frontend checks were run.

Localized session reauthentication prompts and errors, including password, TOTP, and recovery-code choices while retaining the existing session-restoration behavior. Static scan found all literal translation keys. No tests or frontend checks were run.

Localized the screen-lock dialog, password/TOTP/passkey unlock controls, server/network feedback, failed-attempt counter, and automatic logout notice. Static source scan found all literal translation keys. No tests or frontend checks were run.

Localized the idle-session continuation warning and interpolated seconds remaining. No tests or frontend checks were run.

Localized personal workspace task, note, and bookmark forms and lists, including status/priority filters, validation and error states, accessible bookmark ordering labels, and locale-aware task/reminder dates. Static scan found all literal translation keys; no tests or frontend checks were run.

Localized the saved-views page groups, owner/shared/default labels, empty/loading/error states, and open action. Static scan found all literal translation keys and missing dynamic page titles were added to the English resource. No tests or frontend checks were run.

Localized the shared account-settings navigation labels and accessible navigation name so account subpages stay translated when switching tabs. No tests or frontend checks were run.

Localized the personal and staff performance page, including metric names, period picker and comparison labels, chart legend and accessible description, daily details, and loading/empty/error feedback. Dates and numbers use the shared locale formatters. Added the matching English resource entries and updated the account-menu localization checklist and UI documentation. No tests or frontend checks were run.

Localized the shared sidebar profile menu's accessible names, session status, account/profile actions, help/version sections, and logout label. Added the English resources and recorded the work in the account-menu checklist and UI documentation. No tests or frontend checks were run.

Localized the admin password recovery flow's request/reset forms, validation messages, password checklist and strength labels, sent/done screens, and resend countdown. Added matching English resources and updated the account-menu localization checklist and UI documentation. No tests or frontend checks were run.

Completed the planned automatic-presence behavior: active browser interaction sends a rate-limited heartbeat, available users are derived as away after 15 minutes without activity, and resume activity restores available status. Exposed effective presence in staff management with a text label, updated the OpenAPI contract and generated admin API type, and documented the behavior. No tests or frontend checks were run.

Expanded the account-menu identity block to show email verification/resend, copy email, staff code, a timezone-aware greeting and live clock, and the latest successful login's IP and browser/platform. Included security alerts in the unread summary and added one prioritized actionable warning for unverified email, missing admin 2FA, an unread new-device alert, or visible system health errors. Updated the menu-summary OpenAPI fields and checklist/spec/UI documentation. No tests or frontend build were run.

Localized the role-aware admin introduction tour and getting-started checklist, including step content, progress labels, checklist labels, actions, and API feedback. The `/help/tour` route now shows a loading state and a retryable error when onboarding progress cannot be loaded instead of rendering a blank page. Updated the localization checklist and UI documentation. No tests or frontend build were run.

Aligned the admin profile name limit with the plan (2Ã¢â‚¬â€œ255 characters) across client validation, API validation, and OpenAPI. Added account-scoped session draft recovery and a live preview of the colleague-facing profile card. Updated the account menu task checklist and UI documentation. No tests or frontend build were run.

Added selectable account-scoped initials background colors for the no-avatar state, persisted as a browser visual preference and reflected immediately in the profile preview and top-bar account avatar. Added English labels for the new profile controls and metadata. No tests or frontend build were run.

Completed avatar rotation controls in the crop dialog; rotation is applied to the preview and the final square image. Updated the account-menu checklist and UI documentation. No tests or frontend build were run.

Added nullable `users.created_by` provenance with a self-referencing null-on-delete foreign key, populated it for directly created and invitation-accepted staff, and exposed creator name plus account update time in the profile API/read-only section. Added the schema and ERD documentation. Migration was generated but not applied; no tests or frontend build were run.

Connected the optional admin profile signature to staff-authored internal order notes and admin-triggered customer order confirmation/shipment emails. Storefront checkout emails remain unchanged. Updated account menu documentation and tasks. No tests were run.

Scanned account settings, avatar crop, top-bar account menu, idle-session warning, and sidebar account profile for missing literal English translation keys. Added the three missing profile/avatar messages; the scan found no other missing literal keys in these components. No tests or frontend build were run.

Localized the admin operations screens, including table columns, filters, inventory movement and payment labels, printable shipment labels, payment payload actions, and empty/error feedback. Added English dictionary coverage and documented the locale behavior. Source parsing found no syntax errors and an AST scan found no missing literal translation keys; no tests or frontend build were run.

Localized customer management list filters and statuses, profile details, purchase and cart summaries, internal notes, form controls, and API feedback. Added English resources and updated the account-menu localization checklist and operations UI spec. AST scans for customer, report, and operations pages found no raw Vietnamese JSX text, missing literal English keys, or parse errors; no tests or frontend build were run.

Localized campaign and banner tables, filters, coupon types and statuses, form validation/API feedback, accessibility labels, sortable controls, empty/loading states, and coupon rule previews. Campaign values now use the shared locale-aware date and VND formatters. Added English resources and documented the page behavior. AST scans for customer, campaign, reports, and operations pages found no raw Vietnamese JSX text, missing literal translation keys, or parse errors; no tests or frontend build were run.

Localized the product detail page's sections, pricing and variant controls, SEO fields, validation errors, accessibility labels, unsaved-change confirmation, and save feedback. Product money values now use the shared locale-aware VND formatter. Updated the product UI spec and account-menu localization checklist; source audit found no raw localized JSX text or missing literal keys and no parse diagnostics. No tests or frontend build were run.

Localized product creation's wizard, image upload/reordering and alt text, variant matrix and validation, catalog options, save feedback, and unsaved-change dialogs. Parameterized Zod schemas by the active translator and kept API validation matching against Vietnamese server messages. Added English resources; AST audit found no missing literal keys, raw Vietnamese JSX, or syntax errors. No tests or frontend build were run.

Completed the account-menu search keyboard behavior from the source plan: Enter opens the first result, Arrow Up/Down moves through results and returns to the search field, and Home/End jumps to the result boundaries. Search now matches both the localized visible label and stored aliases in the active locale. Updated the account-menu UI documentation; no tests or frontend build were run.

Expanded account-menu search coverage to all 57 currently indexed permitted destinations and actions, including linked accounts, passkeys, data/downloads, saved views, support/system administration, and quick-create routes. Removed duplicate destination entries. A source audit found no duplicate search hrefs, missing English label keys, or TSX parse errors; no tests or frontend build were run.

Localized the support request form and staff inbox, including filters, request type/status/severity labels, contextual browser/app details, assignment controls, attachments, validation, and API feedback. Ticket dates now use the shared locale-aware formatter. Updated the account-menu UI spec; AST audit found no missing literal English keys or raw Vietnamese JSX and no parse errors. No tests or frontend build were run.

Localized all static report-page text, filters, metrics, tables, charts, empty/error feedback, and chart accessibility fallback across Vietnamese and English. Report values now use the shared date, number, and VND formatters. An AST-based source scan found no raw Vietnamese JSX text, no missing literal English dictionary keys, and no syntax parse errors in `ReportsPage.tsx`; no test or build was run. Updated the report UI spec and localization checklist.

Localized the system announcements inbox and management form, including announcement types, audiences/roles, scheduling controls, read states/counts, empty/loading/error feedback, and action labels. Announcement dates now use the shared locale-aware date formatter and dynamic read/date text uses translated interpolation. Updated the account-menu task checklist and UI documentation. TSX parsing and literal translation-key source audit found no errors or missing keys; no tests or frontend build were run.

Localized the admin notification bell and center controls, including operational alert categories, personal notice actions, filters, priorities, archived/read/snoozed states, errors, empty/loading feedback, pagination labels, and relative/calendar dates. Added English resources, updated notification UI documentation, and marked the notification-control localization subtask complete. A TSX/i18n AST source audit found no parse errors, missing literal translation keys, duplicate dictionary keys, or raw Vietnamese JSX in these two components; no tests or frontend build were run.

Localized the global-search trigger and dialog, including accessible names, query guidance, result groups, loading/error/empty messages, and English dictionary resources. Page-result matching now searches both the page label and its description. Updated the account-menu UI spec and localization checklist. Source parsing and literal-key coverage checks found no missing keys or raw Vietnamese JSX; no tests or frontend build were run.

Localized the shared admin error fallback, advanced-filter sheet, data-table loading/error/empty states and pagination controls, and saved-filter controls. Data-table number ranges now use the selected locale, and empty-state copy supplied by pages is looked up in the English dictionary. Added English strings for current table empty states and documented the shared locale behavior. Static TSX and dictionary audits were used; no tests or frontend build were run.

Localized the admin topbar breadcrumbs, permission-gated quick-create menu, theme toggle accessible labels, impersonation banner, and role-preview banner. These controls now use translated interpolation and locale-aware expiry times. Updated the admin shell documentation and localization checklist; source parse and literal-key checks found no missing strings in the header. No tests or frontend build were run.

Localized the shared sign-in layout, temporary account lockout page, and admin 403/404/500 states. Error titles/descriptions, retry and return actions, policy labels, and the fashion-panel copy use the selected language. Updated the shell docs and localization checklist. TSX parsing and literal-key checks found no missing keys; untranslated JSX is limited to the NÃƒâ€°T brand marks. No tests or frontend build were run.

Closed a help-menu gap from section A/8.5Ã¢â‚¬â€œ8.6 of `ACCOUNT_MENU_PLAN_FULL.md`: the account menu now has direct bug-report and feature-feedback shortcuts. They preselect the ticket type, and reports preserve the originating admin route (including the legacy `?page=` route) in the ticket context. The existing form supplies version/browser/request ID and supports screenshot uploads. Updated the account-menu UI spec and task checklist; no tests or frontend build were run.

Completed the remaining console-context part of planned bug reporting: the admin now keeps an in-memory ring of the latest 20 `console.error` entries, redacts common credential fields, attaches up to 6,000 characters to bug tickets, and shows the excerpt in the permission-gated staff inbox. Added bounded Form Request validation, preserved the client-reported request ID, documented the OpenAPI and data-model context, and regenerated both frontend API declarations. Pint formatted the changed PHP files; no tests or frontend build were run.

The account-menu plan audit found that linked-account settings and passkey management were searchable but absent from the rendered account/security submenu. Added direct menu links and updated the menu spec/checklist; the plan's current Mobile Sheet groups remain represented by matching IDs in the preference model and responsive CSS. No tests or frontend build were run.

Localized the collection product membership page: search/filter copy, selection and bulk actions, drag/remove accessible labels, loading/empty/error and mutation feedback, and confirmation dialogs now use the selected admin language. Updated the catalog page spec and account-menu localization checklist. No tests or frontend build were run.

Localized the content-page editor and list: translated validation, form controls, template choices, preview, actions, empty state, confirmations, and save/delete feedback. Existing storefront starter content remains Vietnamese, while template labels and editor chrome follow the selected admin language. Content-page timestamps now use the shared locale-aware formatter. Updated the list audit and account-menu localization checklist. Source AST checks found no missing translation keys, raw Vietnamese JSX, duplicate dictionary entries, or TSX parse errors. No tests or frontend build were run.

Localized product tag management, including its editor validation, search, selection/merge controls, accessible names, empty/error states, and save/merge feedback. Updated the catalog UI spec and account-menu localization checklist. Source AST checks found no missing translation keys, raw Vietnamese JSX, duplicate dictionary entries, or TSX parse errors. No tests or frontend build were run.

Localized the Downloads Center, including export types and statuses, progress labels, date/size metadata, retry/delete/download actions, and loading/empty/error feedback. File sizes and timestamps now follow the selected admin locale. Updated the account-menu UI spec and localization checklist. No tests or frontend build were run.

Localized scheduled report management, including form validation, report/filter choices, recurrence and weekday labels, recipient guidance, run metadata, confirmations, and mutation states. Schedule timestamps now use the shared locale-aware formatter. Updated the reports page spec and account-menu localization checklist. No tests or frontend build were run.

Localized shared date-range presets and labels, filter-bar accessible names/actions, confirmation-dialog buttons, image-upload selection errors, stat/loading state labels, and the sidebar toggle name. Updated shared component guidance and the localization checklist. Static AST scans found no literal-key gaps or parse diagnostics in these shared modules. No tests or frontend build were run.

Localized the system activity log's page copy, filters, audit-detail dialog, column names, export feedback, and known module/action labels. Audit field values and request paths remain unchanged for traceability. Updated the admin list audit and localization checklist. No tests or frontend build were run.

Localized staff permission-request review and account-deactivation review panels, including permission labels, locale-aware dates/pagination, reviewer notes, confirmation copy, and decision feedback. Updated the staff page spec and account-menu localization checklist. Static AST checks found no missing literal translations, raw Vietnamese JSX, duplicate dictionary entries, or parse diagnostics. No tests or frontend build were run.
Localized the dashboard introduction, KPI cards and period controls, revenue chart legend and accessible description, status/payment breakdowns, recent orders, top products, and hidden-widget state. Dates use the selected language, counts follow the configured number format, and shared status badges translate their labels. Updated the dashboard UI spec and account-menu localization checklist. TSX parsing and duplicate dictionary-key source audits were used; no tests or frontend build were run.

Localized the product list and card grid, including quick/advanced filters, bulk actions, accessible labels, table headings/actions, empty/error states, and pagination. Product counts now use the configured number format. Updated the product UI spec and account-menu localization checklist. Targeted TypeScript AST audits found no missing literal translations, raw Vietnamese JSX/attributes, duplicate dictionary keys, or parse diagnostics in the affected files; no tests or frontend build were run.

Completed locale coverage for product and order filter chips, including translated status, payment method, stock and audience values, formatted counts, date filters, and VND ranges. Localized the order list's quick tabs, advanced filters, bulk print/status actions, table/payment/status labels, and detail loading/error feedback. Updated the order UI spec and localization checklist. Targeted TS AST audits found no missing literal translation keys, raw Vietnamese UI text, duplicate dictionary keys, or parse diagnostics in the affected regions; no tests or frontend build were run.
### Account menu plan localization â€” help articles and policy pages

Added an English Markdown help guide matching the Vietnamese article structure and localized the `/help`, `/help/policy`, and `/help/privacy` page controls and policy content. Search covers both bundled languages, while feedback IDs remain tied to the Vietnamese article identity so existing votes continue to map correctly. Updated the account-menu localization checklist and UI documentation. No tests or frontend build were run.


### Admin theme default migration

Bumped the persisted theme migration to v3 so browsers affected by earlier attempts are migrated too. The HTML head now applies the light palette before the React bundle renders, and the migration stays pending until the light preference is synchronized or the user explicitly chooses a theme. No tests or frontend build were run.

### Storefront foundation â€” initial migration

Added the planned React Router data-router entry, route error page, TanStack Query provider, Axios client with in-memory access-token handling and refresh-cookie retry, and moved the storefront product-list request into a hierarchical query. Removed the hard-coded product preview fallback so API failures no longer masquerade as catalog data. Updated storefront dependencies and fixed the reported Vite advisory. npm run build passes; npm audit fix reports zero vulnerabilities. The wider storefront plan, API-backed homepage content, and demo media data remain in progress.


### Storefront demo catalog and illustration coverage

Expanded the idempotent catalog seed to 10 curated products across five clothing and accessory categories, added color values and multi-color size variants for new styles, and retained support for the existing ao-khoac-blazer-copy database record after verifying it exists. Generated 18 clearly labeled SVG illustration assets for products and category covers, mapped all 11 demo products to local media URLs, and attached them to storefront collections. Applied CatalogSeeder and StorefrontDemoSeeder locally. Current DB counts: 11 products, 7 categories, 64 variants, 11 product images, and no missing product thumbnails. PHP syntax checks passed; asset generator syntax check passed. No tests run.

### Storefront homepage API product rails

The homepage now loads the newest and best-selling products through separate public catalog queries, with per-rail loading skeletons, retryable API errors, and hidden empty rails. The main hero headline, image, alt text, and destination now come from the published hero banner; mobile uses its dedicated banner placement. Campaign image or video content is rendered from the campaign banner, and collection loading now reserves layout space with skeleton cards. Updated the storefront home page spec. No tests or build were run.

### Storefront header and footer content integration

The main navigation now builds category and collection links from API responses instead of pointing at hard-coded collection slugs. The footer checks published public content pages by slug and renders only successful published pages, while order tracking links to its app route. Updated the home page spec. No tests or build were run.

### Storefront mobile navigation sheet and Lookbook

Added a native modal navigation sheet for mobile with focus handling from the browser dialog, Escape and backdrop dismissal, API-backed category and collection links, and account/cart shortcuts. Added a dedicated Lookbook section based on the first published collection with a banner, while the remaining collections stay in the collection rail. Updated the home page spec. No tests or build were run.

### Storefront catalog URL filters and pagination

Connected the storefront catalog to the API paginator metadata. The results total now reflects the server count; previous/next controls update the URL and retain all filters. Added individual removable filter chips and a clear-all action, resetting page to 1 after search or filter edits. Added a native mobile bottom sheet with retained draft values, Apply, and Reset actions, plus layout-preserving product skeletons and retryable stale-result errors. Updated the catalog page spec. No tests or build were run.

### Storefront catalog pagination demo data

Expanded the idempotent seed to 18 catalog styles plus the existing blazer-copy record, producing 19 active products across seven categories, 108 active variants, 19 product image records, and 26 labeled SVG assets. Added one-size values for scarf and wallet variants and seeded non-zero sample sold counts so the bestseller query has meaningful ordering. Applied the catalog and storefront demo seeders locally; Pint passed. DB inspection confirms 19 active products span two API pages at 16 per page, 18 have positive demo sales, and no active products lack thumbnails. No tests or frontend build were run.

Catalog filter-option lookup now requests up to the API limit of 48 active products independently of the current result page, so brand, size, and color choices are not limited to page 1 of the paginated grid.

### Storefront banner media audit

- Corrected `autumn-editorial-desktop.webp from 1440Ãƒâ€”960 (3:2) to 1440Ãƒâ€”810 (16:9) by center-cropping the original; the composition retains the open left side for headline text and the right-side fabric still life. The asset is 82,250 bytes, below the 150 KB plan limit, and keeps the existing public URL.
- The mobile hero measures 960Ãƒâ€”1200 (4:5). The campaign banner is 1440Ãƒâ€”960 and 87,492 bytes; the campaign video is H.264, 720Ãƒâ€”480, 6 seconds, and 68,240 bytes.
- Existing banner records point at these stable paths, so no database or seeder change was needed for the crop. The broader asset acceptance item remains incomplete: a reusable render template/script, collection/category coverage and alt-text audit, and user review of the media batch are still outstanding.

### Storefront category and collection cover batch

- Added 	ools/assets/render-storefront-covers.mjs and 
pm run assets:storefront-covers; the repeatable pipeline uses headless Chromium plus FFmpeg to produce seven category and two collection WebP covers at 800Ãƒâ€”1000. The script enforces the plan's under-80-KB cover limit.
- Current outputs are 9.9Ã¢â‚¬â€œ71.3 KB. StorefrontDemoSeeder now points the seven category images and two collection banners at these covers. It upgrades only null or known demo URLs so operator-uploaded media is preserved. Seeder PHP syntax passed, the seeder ran successfully, and direct DB inspection confirmed all nine URLs resolve to the new demo-media paths.
- Added 	ools/assets/README.md with regeneration prerequisites and the demo/illustration boundary. User review of the media batch remains pending before production use; this does not mark plan acceptance A8 complete.

### Storefront category covers in the homepage

- Replaced the one-off category fetch with a TanStack Query request and added a responsive image-led category rail on the homepage. It renders the full API category tree with useful alt text, loading skeletons, retryable errors, catalog-filter links, and hides on collection detail routes or an empty category response.
- Updated /categories OpenAPI schema with its existing nullable image field and regenerated the Admin/Storefront declarations. Updated the Storefront home page specification. OpenAPI type generation passed; no tests or frontend build were run.

### Storefront campaign and newsletter seed coverage

- Added the active NETWELCOME15 percent coupon for checkout preview/order fixtures and a clearly synthetic demo-subscriber@example.test row to exercise newsletter persistence. Both use first-or-create seeding, so reruns do not reset coupon usage or alter recorded consent timestamps.
- Applied the idempotent seeder. Local DB has one coupon and one newsletter subscription. The catalog and new category-rail Storefront production build succeeded (TypeScript + Vite). No tests were run.
- At this point in the audit, order/account sample scenarios were still uncovered; see the later lifecycle-seed entry for their subsequent completion.

### Storefront order idempotency and lifecycle seed

- The first API-backed order-data audit exposed that checkout and manual-order code already query/write orders.idempotency_key, but neither the applied migrations nor the SQL snapshot defined the column. Added an additive nullable unique 120-character key migration, updated the Order model and data-model docs, applied the migration locally, and synchronized `fashion_store_schema.sql.
- Added an idempotent guest COD demo order through CreateManualOrderAction, so it contains the server-calculated total, item snapshot, pending payment, initial order history, inventory reservation, and movement. Local DB now has one order/item/payment/history. Re-running the seeder retained one order and one reserved unit.
- PHP syntax and migration application succeeded. The Storefront production build also passed for the earlier API-backed category rail. No automated tests were run.


### Storefront account and lifecycle fixture coverage

- Extended StorefrontOrderDemoSeeder with an active demo customer, Hanoi address, wishlist entry, coupon-backed customer order delivered through the order state machine, COD collection, shipment tracking, pending review, and pending return request. All rows are seeded idempotently through existing domain actions where required.
- The local API seeder was rerun successfully after Pint and PHP syntax validation. Verified current fixture counts: 1 demo customer, 1 address, 1 wishlist, 2 orders (guest pending + customer delivered), 2 order items/payments, 1 coupon usage, 1 pending review, 1 pending return request, 1 shipment, and 6 order-history rows.
- STORE_DEMO_CUSTOMER_PASSWORD must be configured in local api/.env for a known demo login password; otherwise the seeder assigns a random password. No test suite was run.


### Storefront homepage mockup alignment

- Updated the responsive Storefront review mockup to show the API-backed category-cover rail and real seeded collection covers, keeping the mobile two-column layout and descriptive image alt text. Parsed the HTML and confirmed each referenced cover asset exists.

### Storefront unknown-route handling

- Added a real route-level 404 state in the shared storefront shell for unknown paths, with Vietnamese explanation and a home link; product not-found and API-error states remain distinct.
- `npm --prefix storefront run build` passed (TypeScript and Vite). No tests were run.

### Storefront public content feature extraction

- Moved public page fetching into a feature API/query using the shared Axios client and a hierarchical `pages/detail` query key. Added explicit 404 classification, bounded retries for transient failures, cancellation through the query signal, retry UI, and feature-local HTML sanitization. The page query still supplies SEO metadata to the app shell.
- `storefront/src/App.tsx` no longer owns the public-page fetch state/effect or HTML sanitizer; the public content page renders loading, not-found, request-error, and success states from `features/content`.
- Storefront production build passed (TypeScript + Vite). No tests were run.

### Storefront product detail query migration

- Replaced direct `fetch` effects for related products and public reviews with catalog API functions using the shared Axios client and TanStack Query keys under `products/related` and `products/reviews`. Query requests now cancel on route changes and share cache behavior with product detail data.
- Added visible retry states for related-product and review API failures so failed requests are not presented as successful empty data.
- Storefront production build passed (TypeScript + Vite). No tests were run. Additional direct API calls remain in `App.tsx` and other features; the shared-client migration is still in progress.

### Storefront public configuration query

- Replaced the Storefront app-shell direct fetch and four separately managed state values for registration, maintenance, public SEO, and favicon with a typed public-configuration API call through the shared Axios client and a cached TanStack Query. Favicon updates react to the returned setting; existing default SEO values and maintenance behavior are preserved.
- Storefront production build passed (TypeScript + Vite). No tests were run. The API response type records the nullable maintenance end time from OpenAPI.

### Storefront shared-client migration for cart, auth, and orders

- Removed direct `fetch` from `App.tsx`. Login, initial refresh-cookie session restoration, current-user loading, logout, guest-cart merge, account order reads, order lookup, order tracking, cancellation/return requests, and review submission now use the shared Axios client. Authenticated requests retain bearer headers; refresh cookies still use `withCredentials`; order mutations preserve idempotency and map Laravel validation errors back to checkout.
- Converted cart read/update/remove operations from raw Fetch to the shared Axios client and removed per-call API URL plumbing. This adds shared request IDs and refresh retry to cart operations.
- Storefront production build passed (TypeScript + Vite). No tests were run. Raw Fetch remains in account/auth feature modules and will be migrated next.

### Storefront shared API client rollout

- Migrated address and wishlist API functions to the shared Axios client, including authenticated headers and common error normalization. Converted account settings reads, profile/email/password mutations, session operations, and avatar FormData upload to the same client.
- Converted registration, verification resend, password reset, and forgot-password requests to Axios; registration/password policy now shares the cached public storefront configuration query. Removed the per-page API URL plumbing.
- Source scan finds no remaining native `fetch(...)` calls under `storefront/src`; API traffic now uses the shared Axios client and feature API/query modules. `npm --prefix storefront run build` passed (TypeScript + Vite). No tests were run.

### Storefront order tracking page extraction

- Moved guest order lookup into `features/orders/TrackOrderPage.tsx`, including its form state, API mutation, normalized error/retry state, and result rendering. It uses the shared Axios client and keeps the query-prefilled order code and VND formatting supplied by the app shell.
- Removed the corresponding tracking state and request handler from `App.tsx`; the `/track-order` route now renders the feature page. The Storefront production build passed (TypeScript + Vite). No tests were run.

### Storefront checkout success page extraction

- Moved order-success content and its tracking/shop links into `features/checkout/CheckoutSuccessPage.tsx`. The page accepts the order code and an optional server-calculated total from navigation state, and delegates VND formatting to the app shell.
- `/checkout/success/:code` and the legacy `/order-success/:code` route now render the feature page. Storefront production build passed (TypeScript + Vite). No tests were run.

### Storefront wishlist page extraction

- Moved the account wishlist presentation into `features/account/WishlistPage.tsx`, with typed product data, loading/empty states, price formatting, and a remove callback. The `/account/wishlist` route now delegates its view to that feature while the app shell retains API/session coordination.
- Storefront production build passed (TypeScript + Vite). No tests were run.

### Storefront cart page extraction

- Moved the cart view into `features/cart/CartPage.tsx` with typed lines and callbacks. The feature renders sync loading/errors and retry, stock corrections, quantity controls, item removal, empty state, subtotal, and checkout eligibility; API synchronization and authoritative totals remain coordinated by the app/domain layer.
- The `/cart` route now delegates to the cart feature. Storefront production build passed (TypeScript + Vite). No tests were run.

### Storefront account address book page extraction

- Moved the address book and dependent province/ward form presentation into `features/account/AddressBookPage.tsx`. The feature accepts typed customer addresses and location options and exposes callbacks for save, edit, default selection, delete, cancel, and location retry; the app shell still owns the shared address data needed by checkout.
- The `/account/addresses` route now delegates its view to the account feature. Storefront production build passed (TypeScript + Vite). No tests were run.

### Storefront wishlist query and mutation state

- Replaced the app-shell wishlist fetch effect and duplicated loading state with a user-scoped TanStack Query cache. Wishlist toggles now read the latest cached or freshly fetched list before selecting add versus remove, then update the cache after the API mutation succeeds.
- Added a distinct wishlist API-error state with retry; a failed request no longer appears as a valid empty list. Storefront production build passed (TypeScript + Vite). No tests were run.

### Storefront feature route code splitting

- Added lazy-loaded feature chunks for account settings, address book, wishlist, registration, password recovery, order tracking, checkout, checkout success, and public content. A shared Suspense fallback announces page loading while a chunk resolves.
- Production output now emits separate feature assets; the App chunk is 211.37 kB (62.63 kB gzip), and the storefront build passed (TypeScript + Vite). No tests were run.

### Storefront demo media integrity audit

- Added reusable `tools/assets/audit-storefront-media.php` and documented its invocation. It checks every database reference to seeded banner images/videos, category and collection covers, product thumbnails, and gallery images against `api/public/demo-media/`, and reports missing product-image alt text.
- The audit passes against the configured local database: 3 banner images, 1 banner video, 7 category covers, 2 collection covers, 19 product thumbnails, and 49 gallery images all resolve; 0 gallery images are missing alt text and 0 referenced files are missing. Plan acceptance requiring user review of the demo media remains pending.

### Storefront lint gate recovery

- Resolved the existing Storefront ESLint errors: documented intentional route/data synchronization effects, normalized irregular Unicode whitespace, preserved causes when wrapping API errors, and moved button variant constants out of the component-only module for Fast Refresh.
- Replaced React Hook Form's compiler-incompatible `watch()` subscription with `useWatch()` and kept a complete draft fallback. `npm --prefix storefront run lint` now passes without errors or warnings; the production build passes. No tests were run.

### Storefront cart route lazy chunk

- Changed the cart page from a static app-shell import to a lazy-loaded feature chunk. Vite now emits `CartPage` separately, and the App chunk decreased from 212.52 kB to 209.10 kB (gzip 63.05 kB to 62.07 kB).
- Storefront lint and production build both pass. No tests were run.

### Storefront shared address query

- Replaced the account-address `useEffect` fetch and separate address-list state with a user-scoped TanStack Query shared by `/account/addresses` and checkout. The query passes its abort signal through the account API client.
- Address create/edit/default/delete mutations now update the shared query cache so checkout immediately sees account-page changes. Logout removes cached account address and wishlist data. The address book has distinct query loading/error states and retryable location loading remains intact. Storefront lint and production build pass; no tests were run.

### Storefront account order queries

- Added feature-local order-list/detail API functions with abort-signal support and normalized errors. Replaced direct Axios effects and duplicate list/detail state with user-scoped TanStack Query entries; order-change requests update the cached detail and invalidate the list.
- Added login, loading, retryable error, empty, and success states for order history and order detail. Logout clears the account order cache. Storefront lint and production build pass; no tests were run.

### Storefront account order page extraction

- Extracted order history and order detail views into `features/orders/AccountOrdersPage.tsx`, including item totals, shipping address, status timeline, cancellation/return request history, and verified-purchase review form. The feature components are lazy-loaded from the app shell.
- Production build emits a separate 6.92 kB (2.18 kB gzip) account-orders chunk, and the App chunk decreased from 210.60 kB to 204.88 kB (gzip 62.32 kB to 61.24 kB). Lint and production build pass; no tests were run.

### Storefront product detail feature extraction

- Moved product gallery, color/size/quantity selection, size guide dialog, product reviews, related products, focus-aware mobile sticky purchase bar, and loading/error/not-found states into a lazy `features/catalog/ProductDetailPage` feature. The app shell now supplies API/query state and cart/wishlist callbacks; product-selection state stays with the page.
- Reviews and related products are split into feature-local lazy chunks. The production App chunk decreased from 204.88 kB to 193.62 kB (gzip 61.24 kB to 58.69 kB). Storefront lint and production build pass; no tests were run.

### Storefront catalog page extraction

- Moved catalog rendering and mobile filter-sheet state into the lazy `features/catalog/CatalogPage feature. The app shell continues to own URL/search/filter parameters, catalog API/query state, and product/wishlist actions, then supplies them through typed props.
- 
pm --prefix storefront run lint passes. 
pm --prefix storefront run build passes (TypeScript + Vite); output emits a separate 5.03 kB catalog chunk and the App chunk is 189.55 kB (57.98 kB gzip). No tests were run.

### Storefront catalog URL state hook

- Extracted catalog query parsing, active-filter derivation, search submission, filter apply/remove/reset, and pagination URL updates into `features/catalog/useCatalogUrlState.ts. All catalog state stays URL-backed, pagination resets when search or filters change, and the existing query string is preserved only when searching within products or a collection.
- 
pm --prefix storefront run lint passes. 
pm --prefix storefront run build passes (TypeScript + Vite); catalog is a separate 5.03 kB chunk and App is 189.98 kB (58.17 kB gzip). No tests were run.

### Storefront server-backed guest cart cleanup

- Removed the legacy `fashion-store-cart localStorage read/write. The cart now initializes empty and is populated by the API synchronization flow; startup removes any old cached cart payload. The non-authentication guest cart identifier remains in `fashion-store-cart-token for API access.
- 
pm --prefix storefront run lint and 
pm --prefix storefront run build pass. A source scan confirms there is no remaining cart-payload read/write; only the one-time legacy-key removal matches. No tests were run.

### Storefront login page extraction

- Extracted the login form presentation into a lazy-loaded `features/auth/LoginPage feature. The app shell continues to own login submission, server errors, and auth/session state; the feature receives controlled values and accessible callbacks.
- Production build emits a 1.60 kB (0.77 kB gzip) login chunk; the App chunk decreased from 189.86 kB to 188.79 kB (gzip 58.15 kB to 57.97 kB). Storefront lint and build pass; no tests were run.

### Storefront keyboard focus and reduced motion

- Added a visible high-contrast :focus-visible ring for links, buttons, form controls, and tab stops, with a light blue ring and dark backing for dark theme. Added a global prefers-reduced-motion: reduce override to suppress animation and transition durations and disable smooth scrolling across the storefront.
- Storefront lint and production build pass. This is a static accessibility improvement; no automated axe/screen-reader audit or tests were run.

### Storefront catalog image and touch improvements

- Replaced catalog product CSS backgrounds with semantic <img> elements that use the API alt text, a labeled fallback, and the 3:4 image ratio. The first product row loads eagerly (first image high priority); later rows are lazy-loaded. Wishlist targets now meet 44 Ã— 44 px touch sizing.
- Marked the catalog-card acceptance item complete and documented the behavior in docs/ui-ux/page-specs/catalog.md. Storefront lint and production build pass; no tests were run.

### Storefront mobile catalog filter accessibility

- Improved the native modal filter sheet with an explicit trigger-to-dialog relationship, a screen-reader label that reports active selections, a focused heading on open, and short instructions linked through `aria-describedby. Native dialog behavior retains modal focus containment and Escape dismissal; labeled fields and visible Apply/Reset controls remain available.
- Marked the mobile-filter accessibility item complete in the catalog page spec. Storefront lint and production build pass. No axe, screen-reader session, or automated tests were run, so assistive-technology acceptance remains to be manually audited.

### Storefront catalog pricing and stock cues

- Completed the catalog card data cues from the page specification: show the compare-at price and sale badge only when it exceeds the current price, and show availability only when variant stock data is present, using API quantities.
- Documented the behavior in docs/ui-ux/page-specs/catalog.md. Storefront lint and production build pass; no tests were run.

### Storefront minimum mobile viewport

- Removed the 350 px minimum body width that forced horizontal overflow on 320 px phones; storefront now supports a 320 CSS-pixel viewport. Added the minimum-width verification target to the home page spec.
- Storefront lint and production build pass. This is a stylesheet-level correction; visual viewport checks across all routes remain part of final responsive acceptance. No tests were run.

### Storefront home page feature extraction

- Moved the home-page composition (editorial hero and mobile image, category rail, collections, new/bestseller rails, campaign video/image, lookbook, and newsletter) into a lazy `features/home/HomePage component. It receives API data states and retry callbacks from the existing app shell; current server queries and media behavior are preserved.
- Production build emits an 11.30 kB (2.95 kB gzip) HomePage chunk plus its 0.79 kB CSS chunk. App decreased from 188.79 kB to 176.36 kB (gzip 57.97 kB to 55.14 kB). Storefront lint and build pass; no tests were run.

### Storefront theme color token alignment

- Connected the Storefront legacy color aliases (--ink, --muted, --line, --paper, and --wine) to the currently selected appearance palette, so components using older tokens follow light/dark mode and custom palette choices instead of retaining fixed fallback colors.
- Storefront lint and production build pass. This aligns token values; a full contrast audit across every style/palette and rendered screen remains outstanding. No tests were run.

### Storefront palette contrast correction

- Ran a static WCAG contrast calculation for the hex text tokens (	ext, muted, primary) against palette background/surface colors and for onPrimary against primary button colors. Found and corrected the P13 light primary color: the former coral measured 2.53:1 against the page background; the replacement measures 5.19:1 against the background and 5.69:1 for white button text against the primary surface.
- The palette audit now reports 0 failures for checked hex text/background and primary-button pairs. Storefront lint and production build pass. This does not replace full rendered contrast checks for alpha/gradient surfaces or every individual UI state; no tests were run.

### Storefront shared header and footer extraction

- Moved global storefront navigation, search form, appearance entry, cart count, mobile navigation sheet, and published-page footer links into reusable home/layout components. App shell retains the callbacks and state; search, cart, and data-driven links are unchanged.
- Storefront lint and production build pass. The App chunk is 176.87 kB (55.30 kB gzip); no tests were run.

### Storefront palette-aware secondary text and links

- Replaced hard-coded secondary gray text colors in App, Auth, Catalog, Home, ProductDetail, and appearance-picker styles with the palette-driven muted token (with a readable fallback outside the store shell). Replaced fixed burgundy link/action colors in Auth, Cart, ProductDetail, and auth-shell styles with the palette primary token.
- Storefront lint and production build pass. A targeted CSS scan confirms the audited gray/brand literals are no longer used as hard-coded text colors. No tests or full rendered contrast audit were run.

### Storefront SPA navigation for shared and home links

- Replaced full-document anchors with React Router Link for shared header/footer navigation, the mobile menu, category rail, home product rail, collection cards, and lookbook destinations. These links now preserve in-memory session/cart/query state during navigation. Banner destinations remain anchors because admin-configured banner links may point outside the SPA.
- Storefront lint and production build pass. Other feature pages still contain internal anchors and remain to be migrated. No tests were run.

### Storefront SPA navigation for feature pages

- Continued replacing internal full-document anchors with React Router Link across catalog cards and empty states, product detail breadcrumbs and size-guide contact, related products, cart/checkout and checkout success, account settings/address/order pages, auth and password recovery flows, public content pages, and application fallback/login states.
- Internal storefront navigation now keeps SPA state for these routes. Admin-configured banner destinations remain ordinary anchors because they may be external URLs. Storefront lint and production build pass after these changes; no tests were run.

### Storefront published legal-page links

- Corrected the terms and privacy destinations in registration consent and the shared authentication footer to use the seeded CMS slugs /pages/terms and /pages/privacy. The prior localized slugs did not correspond to public page records and led to the CMS not-found state.
- Storefront lint and production build pass after this fix; no tests were run.

### Storefront internal banner navigation

- Made banner calls to action use React Router for same-site absolute paths while retaining anchor navigation for external destinations. Also moved the 404 home action to React Router. This removes the remaining full-document navigation anchors in Storefront source except the intentional external-banner fallback.
- Storefront lint and production build pass; no tests were run.

### Storefront product material and care data

- Exposed nullable material and care_instruction on the public product-detail API response, documented both in OpenAPI, and regenerated Admin/Storefront TypeScript declarations. The Storefront detail page now renders those fields and honest empty states instead of static generic claims.
- Removed unconfirmed shipping/return promises (including a 7-day exchange window) from product detail. The page now describes only supported checkout/tracking/COD behavior and links to the published shipping policy.
- Extended the idempotent demo seeder to fill those fields only when blank for its 19 illustrative products. Ran the seeder against the configured local DB; verification reports 19 products with material and 19 with care instructions. Pint passed for changed PHP. Storefront lint/build and Admin build pass; no tests were run.

### Storefront approved review demo coverage

- Extended StorefrontOrderDemoSeeder with a second idempotent demo COD order for a distinct product. It is created through CreateManualOrderAction, delivered only through TransitionOrderAction (with normal status history and inventory accounting), and used to create one approved, verified-purchase review. The existing delivered-order pending review remains intact for moderation UX.
- Ran Pint and the seeder. Local DB verification shows two demo review records: one pending on the linen shirt and one approved on the cotton T-shirt; both reference order items, and the two seeded order keys each exist once. No tests were run.

### Storefront demo review rating aggregates

- Corrected the approved-review demo seeder to recompute the product's published-review average and count after creating the verified review, matching the aggregate behavior of Admin moderation.
- Ran Pint and the seeder twice. Local DB now reports 
ating_avg = 5.00, 
ating_count = 1, one approved review, and one approved-review demo order, confirming reruns remain idempotent. No tests were run.

### Storefront unambiguous color/size selection

- Product pages now require a color choice before enabling the size selector when color variants exist. The selector then lists only variants for that color, eliminating duplicate size labels that previously allowed a shopper to add an unintended color variant. Added the rule to the product-detail page spec.
- Storefront lint and production build pass; no tests were run.

### Storefront empty review rating state

- Product detail and review headers now show the rating average/count only when at least one approved review exists; products with no public reviews no longer show a misleading zero-star score next to the empty state. Updated the product-detail acceptance spec.
- Storefront lint and production build pass; no tests were run.

### Storefront demo media audit

- Ran the repository's media audit against the configured local DB. It found 3 banner images, 1 banner video, 7 category covers, 2 collection covers, 19 product thumbnails, and 49 product-gallery media references. All referenced files exist, all 49 product images have alt text, and there are no image limit/format/dimension violations.

### Storefront social preview PNG

- Added a repeatable 
pm run assets:storefront-og renderer that uses headless Chrome/Edge to export the branded SVG source as storefront/public/og-image.png, validating PNG signature and exact 1200Ãƒâ€”630 dimensions. Updated Open Graph/Twitter defaults and the runtime fallback to the PNG while keeping the SVG source editable.
- Generated and visually inspected the PNG (307,315 bytes). Storefront lint and production build pass; no tests were run.

### Storefront multi-size icon assets

- Added 
pm run assets:storefront-icons to render `favicon.svg into 32Ãƒâ€”32 browser, 180Ãƒâ€”180 Apple touch, and 512Ãƒâ€”512 high-resolution PNG icons, with PNG signature and dimensions checked. Linked all icon variants from the storefront document head and documented the generation workflow.
- Generated all three PNG files and visually inspected the 512Ãƒâ€”512 icon. Storefront lint and production build pass; no tests were run.

### Storefront local demo customer login

- Local/testing seeding now gives the storefront demo customer a documented password when no override is configured; non-local environments retain random-password behavior unless explicitly configured. The seeder also ensures the customer role is attached.
- Updated .env.example and local setup docs. Re-ran the idempotent seeder and verified the local demo user exists, is active and email-verified, has the customer role, and its stored hash matches the documented local credential. Pint passed; no tests were run.

### Storefront Open Graph size requirement

- Replaced the 307 KB Open Graph PNG with a visually inspected 1200Ãƒâ€”630 JPEG (51,969 bytes, under the plan's 150 KiB limit). Updated static and runtime metadata fallbacks, and made the asset renderer validate JPEG signature and size. The renderer uses headless Chrome/Edge plus FFmpeg and supports CHROME_PATH/FFMPEG_PATH overrides.
- Storefront lint and production build pass; the built output contains the optimized JPEG. No tests were run.
### Storefront order-action feature extraction

- Moved customer cancellation/return request state and mutations plus order review form state/submission from the app shell into features/orders/useCustomerOrderActions.ts. The hook updates the relevant order detail query, invalidates the order list, preserves the login return path, and continues to use the existing API contract.
- Documented the feature boundary in docs/architecture/frontend-architecture.md. Per the React feature workflow, no frontend checks were run in this change; the hook and call sites were reviewed for TypeScript compatibility.
### Storefront A3 review mockup suite

- Added docs/ui-ux/mockups/storefront-suite.html with interactive desktop/mobile previews for Home, Catalog, Product Detail, Cart, and Checkout. It uses existing local demo banners, covers, and product illustrations, includes page/device controls, and labels the content as a non-live mockup.
- Confirmed referenced local media files exist and opened the artifact in Codex for review. A3 approval remains pending; no production implementation behavior changed.
### Storefront address-book feature extraction

- Moved the account address-book draft, province selection, save/edit/delete/default mutations, confirmation behavior, and query-cache updates into features/account/useAddressBookActions.ts. Logout and the existing AddressBookPage now use the hook; the API contract and visible flows remain the same.
- Updated frontend architecture notes. No frontend checks were run in this change, following the React feature workflow.
### Storefront wishlist feature extraction

- Moved wishlist query state, guest login redirect, add/remove API mutation, cache updates, success/error feedback, and retry into features/account/useStorefrontWishlist.ts. Catalog, product detail, and wishlist pages now consume the same feature hook; account query keys remain scoped by customer id.
- Updated the frontend architecture notes. No frontend checks were run in this change, following the React feature workflow.
### Storefront cart-line feature extraction

- Moved cart quantity changes, line removal, per-line busy ids, failed-mutation refresh, and canonical server-cart application into features/cart/useCartLineActions.ts. CartPage now consumes the feature callbacks; retry, guest-cart merge, checkout, and add-to-cart behavior remain in the shell for subsequent extraction.
- Updated the frontend architecture notes. No frontend checks were run in this change, following the React feature workflow.
### Storefront cart-session feature extraction

- Moved guest cart-token initialization, legacy cart-key cleanup, canonical cart load, post-login guest-cart merge, retry/reset behavior, and their loading/error states into features/cart/useCartSession.ts. Checkout and add-to-cart still consume the same token and status in the app shell; cart-line changes are handled by useCartLineActions.ts.
- Updated the frontend architecture notes. No frontend checks were run in this change, following the React feature workflow.
### Storefront add-to-cart feature extraction

- Moved available-variant selection, add-item API request, session-token persistence, canonical cart replacement, and busy/error/success feedback into features/cart/useAddToCart.ts. Product detail still passes its selected variant and quantity through the same API-backed callback.
- Updated the frontend architecture notes. No frontend checks were run in this change, following the React feature workflow.
### Storefront checkout-action feature extraction

- Moved checkout quote preview, COD order submission, payload-sensitive Idempotency-Key reuse, API field-error handling, cart clearing, and success navigation into features/checkout/useCheckoutActions.ts. The hook still builds shipping data from form values, sends the guest cart token and access token where available, and leaves totals authoritative on the server.
- Updated the frontend architecture notes. No frontend checks were run in this change, following the React feature workflow.
### Storefront catalog-query feature extraction

- Moved catalog listing and filters, product detail, related products, and review queries into storefront/src/features/catalog/useCatalogQueries.ts while retaining their query keys, enabled conditions, stale time, retry settings, and placeholder behavior.
- Updated the frontend architecture notes. No frontend checks were run, following the React feature workflow.
### Storefront home-content query extraction

- Moved the API-backed banner, category, collection, and published-page-link queries into storefront/src/features/home/useHomeContentQueries.ts; preserved query keys and stale times, and retained existing loading, error, retry, and empty-content behavior.
- Updated frontend architecture notes. No frontend checks were run, following the React feature workflow.
### Storefront account and address-location query extraction

- Moved account address/order reads into features/account/useAccountQueries.ts and province/ward lookups into features/checkout/useAddressLocations.ts, preserving query keys, route enablement, cache lifetimes, and retry behavior.
- Updated frontend architecture notes. No frontend checks were run, following the React feature workflow.
### Storefront product and review API contract alignment

- Updated api/openapi.yaml to match ProductResource output (including description, rating, category/brand, and removing fields the public resource does not return) and documented the paginated storefront review response and submission envelope.
- Regenerated API declarations for admin and storefront with npm run api:types; Storefront catalog, product detail, review list, wishlist, and home rails now consume generated product/review schemas instead of duplicating their response types.
- Updated the product-detail spec. OpenAPI type generation completed; no build, lint, or tests were run.
- Replaced the storefront catalog/detail/review, wishlist, and home-rail product projections with picks from the generated API schemas; cart lines remain a minimal cart-owned product shape.

### Storefront public-content API contract alignment

- Added generated schemas for storefront banners, collections, category trees, published CMS pages, and newsletter acknowledgements, matching the Laravel resources and controller responses.
- Updated the home and CMS clients to consume generated API types, including newsletter error typing; regenerated declarations for admin and storefront with npm run api:types.
- Updated frontend architecture notes. No build, lint, or tests were run.


### Storefront cart and checkout API contract alignment

- Replaced the loose cart item response schema with explicit generated cart, cart-item, and product-summary schemas matching the Laravel cart presenter, including availability and line totals.
- Documented the checkout quote payload and envelope, placed-order envelope, cart removal response, and order tracking response; Storefront cart and checkout clients now consume generated OpenAPI types.
- Regenerated Admin and Storefront API declarations with npm run api:types. No build, lint, or tests were run.


### Storefront order API contract alignment

- Restricted the authenticated order-list response to the summary fields used by Storefront instead of serializing the entire database row.
- Added generated schemas for the paginated order list, order line items, and public order history, and switched order-list/detail/tracking/change-request clients to generated response types.
- Updated the account order UI for nullable placement dates and the backend variant_name field; regenerated API declarations. No build, lint, or tests were run.


### Storefront catalog filters and configuration API alignment

- Added named OpenAPI schemas for catalog filter options and storefront registration, maintenance, SEO, favicon, and password policy configuration, matching the Laravel response fields.
- Updated catalog and storefront configuration clients to use generated schema types instead of handwritten response models.
- Regenerated Admin and Storefront API declarations. No build, lint, or tests were run.


### Storefront catalog pagination contract alignment

- Added a named OpenAPI schema for Laravel resource pagination links and metadata on public product search.
- Replaced the handwritten generic product-page, product, related-product, and review client types with generated API schema types; catalog queries and the home product rail now use that typed client.
- Regenerated Admin and Storefront API declarations. No build, lint, or tests were run.


### Storefront authentication response contract alignment

- Documented the actual login, refresh, identity, logout, registration, verification-resend, and password-recovery response envelopes in OpenAPI, including the in-memory-only access-token contract.
- Switched the Storefront auth context, refresh interceptor, registration, resend-verification, and password-recovery clients to generated schemas; password policy and customer identity types now share those schemas.
- Regenerated Admin and Storefront API declarations. No build, lint, or tests were run.


### Storefront session bootstrap extraction

- Moved refresh-cookie restoration, in-memory HTTP token synchronization, and authenticated-user validation from App.tsx into features/auth/useStorefrontSessionEffects.ts. Invalid sessions still clear the user and reset cart-merge state.
- Stabilized the cart merge reset callback so session validation does not refetch the current identity on unrelated renders. Updated frontend architecture notes. No build, lint, or tests were run.


### Storefront address and wishlist API contract alignment

- Added OpenAPI envelopes for saved-address lists and mutations, wishlist pagination, and message responses; the generated saved-address model now reflects the AddressResource including resolved province/ward names and the default flag.
- Replaced handwritten account address response/input and generic account API envelopes with generated address and product-page schemas for address book and wishlist clients.
- Regenerated Admin and Storefront API declarations. No build, lint, or tests were run.


### Storefront cart and location clients use generated response types

- Replaced hand-written province/ward option envelopes with generated location-catalog schemas.
- Replaced optional, locally declared cart envelopes in cart reads, updates, removal, and add-to-cart with the generated cart envelope contract.
- No API generation was needed for this consumer-only change. No build, lint, or tests were run.


### Storefront account settings API alignment (2026-10-26)
- Replaced remaining legacy AccountSettingsPage endpoint calls with typed account feature API methods for profile, email, password, account deletion, verification email, avatar, and session actions.
- Tightened the OpenAPI ProfileEnvelope required fields and regenerated admin/storefront API TypeScript declarations with npm run api:types.
- No build, lint, or tests were run.


### Cart merge contract and canonical response (2026-10-26)
- Documented POST /cart/merge with generated request and CartEnvelope response types; Storefront now consumes the canonical cart returned by the merge instead of issuing a second cart read.
- Updated CartController to return the shared cart presenter after the transactional merge, avoiding raw Eloquent model serialization; aligned the cart-merge flow documentation.
- Typed review submission payload and response from OpenAPI. API TypeScript generation and Pint formatting completed; no tests, lint, or build were run.

- Added MergeGuestCartRequest so guest cart merge validation follows the API Form Request convention.

- Typed the storefront logout response with the generated MessageEnvelope; the scan found no other untyped api client calls in storefront/src/features.


### A3 clothing photography revision (2026-10-26)
- Replaced product SVGs in both interactive Storefront mockups with six photorealistic clothing concept images: linen vest, trench jacket, knit cardigan, blazer set, blouse-and-trousers, and shirt-and-skirt looks.
- Stored optimized 1000x1250 WebP assets under docs/ui-ux/mockups/assets/ and clarified that generated concepts are for mockup review only, not real sale-item photography or API seed data.
- Checked 26 mockup image references; all local assets exist. A3 approval remains pending.


### Storefront route error states (2026-10-26)
- Added distinct 403 access-denied, 404 not-found, and 500 failure copy to the React Router error boundary; added a retry action for 500 responses and reused the not-found illustration in route and application 404 states.
- No build, lint, or tests were run.


### Storefront SEO extraction (2026-10-26)
- Moved route-aware title/description/social metadata, canonical links, favicon updates, and home/product JSON-LD construction into storefront/src/features/seo/useStorefrontSeo.ts; App now uses a dedicated serializer for safe JSON-LD embedding.
- Updated frontend architecture documentation. App.tsx remains 301 lines; the planned shell reduction is still in progress.
- No build, lint, or tests were run.


### Storefront appearance extraction (2026-10-26)
- Moved saved appearance initialization, picker visibility, persistence, and CSS token generation into features/appearance/useStorefrontAppearance.ts; App.tsx was 295 lines before adding the account-route guard (currently 301 lines).
- Updated the frontend architecture note. No build, lint, or tests were run.


### Storefront account return-path guard (2026-10-26)
- Protected /account routes now wait for refresh-cookie restoration and send guests to login with the original path, query, and hash. Added same-origin validation before login follows returnTo; updated frontend architecture guidance.
- No build, lint, or tests were run.


### Storefront seeded-media audit (2026-10-26)
- Re-ran tools/assets/audit-storefront-media.php against the current seeded files: 3 banner images, 1 banner video, 7 category covers, 2 collection covers, 19 product thumbnails, and 49 gallery references; zero missing files/alt texts and zero size, format, or dimension violations.


### Storefront responsive image fallback (2026-10-26)
- Added shared ResponsiveImage with intrinsic dimensions, lazy decoding, optional server-provided srcSet/sizes, and a labeled apparel illustration fallback; applied it to catalog, product detail, category, collection, lookbook, hero, campaign, and home product media.
- No generated width variants are advertised: the current API exposes single image URLs. Updated asset workflow and frontend architecture docs. No build, lint, or tests were run.


### Storefront shared VND formatting and related media (2026-10-26)
- Centralized integer VND display in lib/money.ts and removed duplicate NumberFormat logic from the app shell, home product rail, and filter chips. Related-product cards now use ResponsiveImage instead of CSS background images, so failed media receives the shared illustrated fallback.
- Updated frontend architecture documentation. No build, lint, or tests were run.


### Storefront wishlist purchase action (2026-10-26)
- Wishlist products now retain the variants returned by the existing API. The page requires an explicit available color/size selection before adding, disables sold-out choices, uses the shared responsive image fallback, and shows add/cart-sync errors with retry.
- Added an account page-spec acceptance item. No build, lint, or tests were run.


### Storefront build and OpenAPI type alignment (2026-10-26)
- Fixed TypeScript contract drift: profile timezone and logout_other_devices are optional as the Laravel Form Requests specify; order review choices use variant_name; checkout malformed-response messages no longer access undeclared envelope fields; removed an unused tracked-order type import.
- Regenerated Admin and Storefront OpenAPI declarations. Storefront production build passed (TypeScript and Vite); no tests were run.


### Storefront explicit route table (2026-10-26)
- Replaced the single wildcard React Router entry with explicit routes for auth, catalog, collections, cart/checkout, tracking, account, and CMS pages; retained the shared App renderer during the strangler migration and wildcard 404 fallback.
- Updated frontend architecture documentation. No tests were run.


### Storefront route check (2026-10-26)
- After introducing the explicit route table, the Storefront TypeScript/Vite production build and ESLint both passed. No tests were run.


### Storefront login feature extraction (2026-10-26)
- Moved login form state, API submission/error handling, and safe returnTo navigation from App.tsx into features/auth/useStorefrontLogin.ts. App shell now delegates login behavior to the auth feature.
- Storefront production build and ESLint passed after the extraction. No tests were run.


### Storefront logout extraction and mockup approval (2026-10-26)
- Moved logout API/session cleanup and private account-query removal into features/auth/useStorefrontLogout.ts; documented auth feature boundaries.
- The user approved the revised A3 Storefront mockup with realistic apparel concept imagery. The A3 design-approval gate is now satisfied; production asset approval remains separate.
- Storefront production build and ESLint passed after the extraction. No tests were run.

### Storefront newsletter error accessibility (2026-10-26)
- Newsletter API validation now marks and describes only the affected email or consent control. Rate-limit/network/API failures remain form-level messages instead of incorrectly flagging the email field. Updated the Storefront home page spec.
- Storefront production build and ESLint passed; no tests were run.

### Storefront cart state ownership (2026-10-26)
- Added `features/cart/useStorefrontCart.ts` to own canonical cart-line state and compose guest/session sync, line mutations, add-to-cart, retry, and cart-token handling. The app shell now consumes this single feature hook for cart, checkout, wishlist and auth session integration.
- Updated docs/architecture/frontend-architecture.md. Storefront production build and ESLint passed; no tests were run.

### Storefront account route guard extraction (2026-10-26)
- Moved refresh-session waiting and unauthenticated returnTo redirect behavior into `features/auth/StorefrontAccountRouteGuard.tsx`, preserving the safe relative route handling performed by the login feature. Updated frontend architecture documentation.
- Storefront production build and ESLint passed; no tests were run.

### Storefront account orchestration (2026-10-26)
- Added `features/account/useStorefrontAccount.ts` to compose route-aware address/order queries, address-book actions, wishlist actions, and customer order-change/review actions. App now delegates those account concerns through one feature hook shared by account pages and checkout.
- Updated docs/architecture/frontend-architecture.md. Storefront production build and ESLint passed; no tests were run.

### Storefront cart image fallback and accessibility (2026-10-26)
- Replaced CartPage background-image links with the shared ResponsiveImage, descriptive alt text, fixed intrinsic dimensions, and the existing local fallback illustration. Cart image navigation now uses React Router links. Updated cart/checkout page-spec acceptance.
- Storefront production build and ESLint passed; no tests were run.

### Storefront shipping-threshold contract and checkout progress (2026-10-26)
- Documented the existing GET /shipping/fee response in OpenAPI and regenerated Admin/Storefront declarations. Storefront queries the selected province rate and displays API-backed free-shipping progress in checkout, with loading, error, and retry states. The threshold is never hard-coded; coupon totals remain calculated by checkout preview.
- Updated cart/checkout page spec and frontend architecture docs. OpenAPI type generation, Storefront production build, and ESLint passed; no tests were run.

### Storefront cart coupon and shipping summary (2026-10-26)
- Added a cart promotion box with province selection, coupon apply/remove through the server's checkout-preview quote, API-authoritative subtotal/discount/shipping/grand total, and free-shipping progress from the selected province. Valid coupon codes carry to checkout and are recalculated there. Quote output is hidden whenever cart, province, coupon, or customer changes; province/shipping failures expose retry.
- OpenAPI response generation, Storefront production build, and ESLint passed; no tests were run.

### Storefront checkout live quote preview (2026-10-26)
- Checkout now debounces server preview after province, coupon, or canonical cart changes while preserving manual recalculation. It clears obsolete quotes immediately, ignores out-of-date responses, and renders preview failures inline. The final order request still recalculates authoritative totals server-side.
- Updated cart/checkout page spec. Storefront production build and ESLint passed; no tests were run.

### Storefront debounced cart quantity editing (2026-10-26)
- Cart line quantity is now directly editable, validated as a positive integer within API stock and business bounds, and saved after a 500 ms debounce. Invalid drafts show inline feedback; rejected updates restore the last canonical quantity and preserve the server error/retry behavior. Increment/decrement controls use the same debounce path.
- Updated cart/checkout page spec. Storefront production build and ESLint passed; no tests were run.


### Storefront newsletter schema validation (2026-10-26)
- Reworked the newsletter form to use React Hook Form and a Zod schema for email and consent validation, matching Phase 2 requirements. Server validation errors attach to their fields; network/rate-limit failures remain form-level, and successful submissions reset the form.
- The user approved the revised apparel-concept mockup, satisfying the A3 design gate. Concept imagery remains mockup-only and is not treated as product photography or seeded product media.
- Storefront production build and ESLint passed; no tests were run.


### Storefront demo media seeder synchronization (2026-10-26)
- Made demo media seeding reconcile seeded category covers, product illustration alt text and thumbnails, collection covers, and banner image/video/link URLs on rerun. Reconciliation only replaces blank values or URLs under the demo-media namespace; custom uploaded asset URLs remain intact.
- Pint formatting and PHP syntax validation passed. Database seeding was not run because it would mutate the configured database; tests were not run.


### Storefront demo media synchronization verification (2026-10-26)
- The earlier note that database seeding was not run was superseded: after confirming .env targets the local fashion_store database, ran php artisan db:seed --class=StorefrontDemoSeeder successfully.
- Read-only DB audit found 62 URLs under /demo-media/ across categories, products, product galleries, collections, and banners; every referenced local public file exists, including the seeded video.


### Storefront account field-level API validation (2026-10-26)
- Account settings now preserve structured validation errors from the API and attach supported fields to the profile, email, password, and account-deletion forms. Unknown validation fields remain visible in a form-level message; recoverable failures do not reset entered values.
- Storefront production build and ESLint passed; no tests were run.


### Storefront S7.6 security review (2026-10-26)
- Verified CMS page HTML is sanitized on admin save, in the Laravel public resource, and again in the Storefront allowlist before HTML insertion. The production Nginx example defines a restrictive CSP and standard security headers, with the deployment API origin documented as a required replacement.
- Verified the public newsletter endpoint is limited to 5 requests per minute. Storefront local/session storage contains appearance preference, guest-cart identifier, and reset-flow email/countdown only; access tokens remain in React memory and refresh credentials use the API cookie flow.
- S7.6 implementation checks are present. Full deployment CSP validation and automated security verification remain part of release hardening; no tests were run.


### Storefront account unsaved-change guard (2026-10-26)
- Added React Router navigation blocking to customer account settings when profile, email, password, or deletion forms contain unsaved edits. The existing before-unload warning still covers closing/reloading the tab; successful submissions reset their corresponding form.
- Documented the behavior in the account page spec. Storefront production build and ESLint passed; no tests were run.


### Storefront public auth route extraction (2026-10-26)
- Moved login, registration, email-verification, password-recovery, and reset route rendering from App.tsx into `features/auth/StorefrontPublicAuthRoute.tsx`, with a separate route matcher. The auth feature now owns its lazy page loading and dispatch; the existing login/session hooks and URLs remain unchanged.
- App.tsx decreased from 184 to 176 lines. This advances S0.4 but does not meet its under-100-line target yet. Storefront production build and ESLint passed; no tests were run.


### Storefront expired-cart recovery (2026-10-26)
- Added was_expired to the OpenAPI cart contract and generated Admin/Storefront types. When cart reads or guest-cart merges encounter expired data, the API clears it and signals the event; Storefront presents a recovery message. Checkout preview/order requests reject expired carts rather than pricing or placing orders from stale contents.
- Documented the behavior in the cart/checkout spec. OpenAPI type generation, PHP Pint/syntax checks, Storefront production build, and ESLint passed. Automated/runtime expiry coverage remains pending; tests were not run.


### Storefront checkout expired-cart recovery (2026-10-26)
- Extended the expired-cart recovery message to the checkout screen, where the cart is disabled after expiry. A cart validation error returned by checkout APIs now appears inline with a link to reopen the canonical cart instead of only a transient toast.
- Updated the cart/checkout page spec. Storefront production build and ESLint passed; automated/runtime expiry verification remains pending and no tests were run.


### Storefront mockup approval and Admin banner upload (2026-10-26)
- User approved the revised realistic apparel imagery mockup as the design direction for Storefront Phase 2. This is a design approval; mockup imagery is not production catalog imagery.
- Admin banner editor uploads JPG/PNG/WebP (max 2 MB) through /admin/uploads, previews the returned public URL, and shows upload status/errors. API upload permission includes content.manage; banner video remains URL-configurable.
- Updated OpenAPI permission description, Admin English strings, and admin store operations spec. 
pm run api:types passed; Admin production build passed (bundle-size advisory); focused ESLint reported 0 errors and one existing 
eact-hooks/incompatible-library warning in CampaignPage; full Admin ESLint remains red due multiple unrelated files. No tests run.


### Storefront demo apparel media (2026-10-26)
- Added 15 generated photorealistic concept images for the 15 apparel entries in the demo catalog, optimized as 900Ãƒâ€”1200 WebP files (~56Ã¢â‚¬â€œ95 KB each) under api/public/demo-media/products/. Accessory entries remain illustrations suited to those products.
- Updated StorefrontDemoSeeder so each apparel product gets the matching demo image as its primary image and the 	humbnail; old demo illustrations are demoted, user-owned media URLs are preserved. Reseeded CatalogSeeder and StorefrontDemoSeeder against the local database; verified 15 primary photo rows and the seeded campaign video banner URLs. PHP lint and Pint passed; no tests run.
- Updated storefront home page spec to label generated apparel photography as demo concept media, not a claim about real stocked products.
- Cross-checked 57 database URLs across category covers, product thumbnails/images, banner images/video, and collections against api/public/demo-media; no referenced local media files are missing.


### Storefront API demo-data audit (2026-10-26)
- Current local DB coverage: 7 categories, 19 active products, 108 variants, 24 product images (16 primary apparel photo records including one legacy blazer copy), 2 collections, 3 banners, 5 pages, 1 coupon, 1 newsletter record, 2 reviews (pending and approved), 3 orders (2 delivered, 1 pending), 1 pending return request, 2 shipments, 1 wishlist, and 1 customer address.
- Public address endpoints use the shared shared/data/vietnam-addresses.json; /sitemap.xml and /robots.txt are backed by Laravel routes. The demo campaign banner points to a local WebP poster and MP4 video.


### Banner video upload integration (2026-10-26)
- Extended the permission-gated /admin/uploads endpoint to accept MP4 video up to 5 MB alongside existing image types. The Admin banner form now uploads MP4, fills ideo_url, refreshes its poster-backed preview, shows errors/progress, and prevents saving while media upload is pending.
- Updated OpenAPI response/request documentation, generated Admin and Storefront API types, and the admin store operations spec. PHP lint and Pint passed; Admin focused ESLint reported 0 errors and one existing 
eact-hooks/incompatible-library warning; Admin production build passed with the existing large-bundle advisory. No tests run.


### Storefront route CSS splitting (2026-10-26)
- Moved home, catalog/filter, product-detail, cart/sync, checkout-success, and auth styles into their lazy feature modules; made public-auth and maintenance layouts lazy as well. Updated frontend architecture guidance.
- Storefront production build passed (	sc -b + Vite). The shared App CSS fell from 60.32 KB (12.21 KB gzip) to 30.66 KB (6.57 KB gzip); route styles now appear in separate lazy CSS chunks. No tests run.

### Banner alt text across Admin/API/Storefront (2026-10-26)
- Added an additive banners.alt migration with a legacy title backfill. Admin requires descriptive alt text and sends it through the banner API; admin and Storefront resources return it with a title fallback. Updated OpenAPI schemas, generated frontend API types, docs, and seeded demo banner descriptions while preserving operator media and custom alt text.
- Applied the migration to local fashion_store and reran StorefrontDemoSeeder; a read-only query confirmed the three demo banner descriptions. API type generation, Pint, and Admin/Storefront production builds passed. Admin build reports the existing large-chunk advisory. No tests run.

### Storefront autumn apparel hero media (2026-10-26)
- Replaced the seeded desktop/mobile autumn hero's textile still-life art with newly generated apparel-concept campaign images showing a model wearing a burgundy linen blouse and beige trousers. Added optimized WebP assets under demo-media/banners (56 KB desktop, 83 KB mobile) and accurate Vietnamese alt text; retained old media files and preserved operator-customized banner content. Documented that the generated images are campaign concepts, not proof of stocked products.
- Reran StorefrontDemoSeeder and verified the saved hero rows. GET /api/v1/banners?placement=hero returned the new image URL and alt text; both desktop/mobile assets returned HTTP 200 as image/webp. Pint and PHP syntax validation passed. No tests run.

### Storefront apparel collection covers (2026-10-26)
- Replaced the two seeded collection-cover references with generated editorial apparel concepts for autumn and new arrivals (800Ãƒâ€”1000 WebP, 40 KB and 45 KB), leaving the original still-life files intact. Reseeding updates only demo-media URLs and preserves custom covers. Updated the home-page spec and asset workflow documentation.
- Storefront media audit reports 0 missing files, 0 invalid dimensions/formats/sizes, and 0 missing product-image alt texts. The collections API returns both new URLs and both images serve as image/webp with HTTP 200. Pint and PHP syntax validation passed; no tests run.

### Storefront app-shell route extraction (2026-10-26)
- Moved route-to-page rendering, shared storefront shell, route guards, and route-level SEO assembly into app/StorefrontRouteContent.tsx. App.tsx now composes feature hooks and passes grouped feature state into the route renderer; it is 95 lines, meeting S0.4's under-100-line target. Account deletion now navigates through React Router after clearing the session.
- Updated frontend architecture docs. Storefront TypeScript/Vite production build passed after the extraction; no tests run.

### Collection-cover alt text from Admin to Storefront (2026-10-26)
- Added the additive collections.banner_alt migration with a name-based fallback for existing rows. Admin collection editing now captures descriptive Vietnamese alt text, validates it when a cover is set, previews it, and sends it through the catalog API. Admin and public resources return the description; the Storefront lookbook uses it directly. Updated OpenAPI-generated types, ERD, data model, page specs, and SQL snapshot.
- Applied the migration and reran StorefrontDemoSeeder; both seeded collections now have image-specific descriptions. Runtime GET /api/v1/collections returns the new field. The media audit now checks product, banner, and collection-cover alt text and reports 0 missing alt text, 0 missing files, and 0 invalid media. Pint, OpenAPI type generation, and Admin/Storefront production builds passed; Admin retains its large-chunk advisory. No tests run.

### Category-image alt text across Admin/API/Storefront (2026-10-26)
- Added additive categories.image_alt migration with a fallback for existing categories. Admin category editing now captures and validates image descriptions; Storefront category cards and category API resources expose the descriptions. Updated OpenAPI-generated types, SQL snapshot, ERD/data-model/UI specs, and seeded demo descriptions while preserving operator media and custom alt text.
- Applied migration (id 58, batch 33) and reran StorefrontDemoSeeder; no pending migrations and no seeded image categories with missing alt text. Media audit reports 0 missing alt text, 0 missing files, and 0 invalid media. Pint, API type generation, and Storefront production build passed. Admin production build passed with its existing >500 KB chunk advisory. No tests run.

### Storefront unpublished collection route handling (2026-10-26)
- Collection URLs now wait for the public collection query, show a retryable error if it fails, and render a not-found state when a slug is no longer published or no longer exists. This prevents an invalid collection URL from silently displaying the unfiltered catalog. Added a layout-preserving responsive loading state with reduced-motion support and updated the catalog page spec.
- Storefront TypeScript/Vite production build passed. No tests or manual browser verification were run.

### Storefront published collection route states (2026-10-26)
- Direct collection URLs now resolve against the published collection list. The route shows a responsive loading skeleton, a retryable error state on query failure, or a not-found state for missing/unpublished slugs instead of silently showing the general catalog. Unresolved collection routes are marked 
oindex,nofollow; only a resolved published collection stays indexable. Updated the catalog page spec.
- Storefront TypeScript/Vite production build passed. No tests or manual browser verification were run.

### Storefront announcement accuracy (2026-10-26)
- Replaced the hard-coded 1,500,000 VND free-shipping threshold and unconfirmed seven-day return promise with the confirmed nationwide delivery and COD message. This avoids contradicting province-specific shipping settings and the still-open returns policy. Updated the approved HTML mockups and homepage specification to match.
- Storefront TypeScript/Vite production build passed. No tests or manual browser verification were run.

### Banner destination safety across Admin/API/Storefront (2026-10-26)
- Admin now validates banner destinations as root-relative internal paths or absolute HTTP(S) URLs. The Laravel campaign Form Request enforces the same rule, OpenAPI documents it, and Storefront renders unsupported legacy values as inert text rather than an unsafe link. Added an input hint and English validation copy; documented the rule in the Admin operations spec.
- Generated API types, PHP syntax validation, and Pint passed. Admin and Storefront production builds passed; Admin retains its existing large-chunk advisory. No tests were run.

### Banner video URL safety (2026-10-26)
- Restricted Admin/API banner video sources to absolute HTTP(S) URLs and kept Admin preview from loading an unsupported scheme. Storefront applies the same protocol check to legacy records and falls back to the descriptive campaign image when the saved video URL is unsupported. Updated OpenAPI, generated types, Admin and Storefront page specs.
- PHP syntax validation, Pint, API type generation, and Admin/Storefront production builds passed. Admin retains its existing large-chunk advisory. No tests were run.

### Storefront product-thumbnail alt coverage (2026-10-26)
- Extended the media audit to require each non-deleted product thumbnail URL to match a gallery image for that product with non-empty alt text. This validates the duplicated thumbnail reference without introducing a second source of alt copy. Documented the inherited-alt rule in the asset workflow.
- PHP syntax check and media audit passed: 19 product thumbnails, 24 gallery URLs, 0 missing alt descriptions, 0 missing files, and 0 invalid media.

### Storefront demo shipping rates (2026-10-26)
- The demo seeder now creates missing active shipping rates for Hà Nội, Đà Nẵng, and Hồ Chí Minh using the current global shipping fee and free-shipping threshold. Existing rates are preserved. Province names come from the shared official address catalog.
- Seeded the current database and confirmed all three rates are active at 30,000 VND with a 1,500,000 VND free-shipping threshold. Pint and PHP syntax validation passed; no tests were run.

### Storefront Phase 2 mockup approval and build audit (2026-10-26)
- The user approved the revised apparel-focused Storefront mockup as the Phase 2 visual direction. The existing Home page implementation was audited against S2.1Ã¢â‚¬â€œS2.5: it uses API-backed banners, categories, collections, latest/bestseller rails, and newsletter submission; it has loading, empty, and retryable error handling, and the footer links only to published CMS pages.
- Storefront production build passed. Admin production build also passed; its existing large-chunk advisory remains. No tests were run.

### Storefront product-switch selection reset (2026-10-26)
- Switching directly between product detail routes now clears the previous product's selected color, variant, gallery image, and quantity when the product ID changes. This prevents stale selections from carrying into the next item. Documented in the product-detail spec.
- Storefront production build passed. No tests were run.

### Storefront demo cancellation-request coverage (2026-10-26)
- Added an idempotent COD demo order for an available polo variant and a pending customer cancellation request. The existing delivered-order return request and pending/approved review examples remain in place. This gives Storefront account/order flows and Admin request review screens data for both cancellation and return cases.
- Ran StorefrontOrderDemoSeeder twice and confirmed exactly one order and one pending cancellation request for the fixed demo key. Pint and PHP syntax validation passed; no tests were run.

### Storefront not-found SEO metadata (2026-10-26)
- Storefront now applies 
oindex,nofollow to unmatched routes, unresolved product details, missing/unpublished CMS pages, and unresolved collections. Published pages and resolved public catalog routes remain indexable. Route patterns are shared between router registration and metadata classification to avoid a second route list.
- Updated the catalog SEO specification. Storefront TypeScript/Vite production build passed; no tests were run.

### Storefront collection-card image descriptions (2026-10-26)
- Home-page collection cards now use the collection cover's API-provided Vietnamese banner_alt, with a collection-name fallback for legacy data. Updated the storefront-home spec.
- Storefront TypeScript/Vite production build passed; no tests were run.

### Storefront responsive hero preloading (2026-10-26)
- The published desktop and mobile hero image URLs are now preloaded with React DOM resource hints, high fetch priority, and matching viewport media queries as soon as the API-backed hero renders. This avoids preloading the desktop crop on mobile; the hero image remains eager and the campaign video remains deferred until playback.
- Updated the home-page performance spec. Storefront TypeScript/Vite production build passed; no tests or device LCP measurements were run.

### Storefront lint cleanup (2026-10-26)
- Removed a redundant product-detail state-reset effect; the route already keys/remounts the page when its product changes. Replaced banner-path control-character regex matching with explicit character-code checks, and made search draft synchronization satisfy exhaustive hook dependencies.
- Storefront ESLint now passes with no warnings, and the TypeScript/Vite production build passes. No tests were run.

### Admin lint remediation pass (2026-10-26)
- Fixed an impure render-time expiration check in API token management using a clock state refreshed once per minute; corrected changelog link-parser escapes; moved preferences option constants out of the component module for Fast Refresh; removed an unused destructuring; and aligned the sidebar callback dependency with its captured user object.
- Targeted ESLint reports no errors in the edited files (four existing exhaustive-dependency warnings remain in App.tsx). Admin TypeScript/Vite production build passed; its existing large-chunk advisory remains. The full Admin lint still has unrelated outstanding findings; no tests were run.

### Admin lint remediation continuation (2026-10-26)
- Cleared the remaining Admin ESLint errors in saved-filter defaults, campaign form synchronization, account menu hydration, onboarding tour visibility, report schedule deep links, session guard refs, and time-dependent account pages. Campaign path validation now checks character codes without a control-character regex; account OAuth callback state is read from the browser URL without an unavailable router dependency.
- Full Admin lint passes with 0 errors and 19 warnings. Admin TypeScript/Vite production build passes; the existing large-chunk advisory remains. No tests were run.

### Storefront responsive hero alternative text (2026-10-26)
- The hero image now switches to the mobile banner's own alt text at the same 620 px breakpoint used by the responsive image source, and falls back to the desktop description when no mobile alt is configured.
- Storefront ESLint and TypeScript/Vite production build passed. No tests were run.

### Storefront demo-media verification (2026-10-26)
- php tools/assets/audit-storefront-media.php passed: 3 banner images, 1 video, 7 category covers, 2 collection covers, 19 product thumbnails, and 24 gallery images. All files and alt descriptions exist; no invalid image formats, dimensions, or size limits.

### Storefront guest order tracking by phone or email (2026-10-26)
- Closed the plan/spec gap: guest tracking now accepts an order code plus exactly one of the checkout phone number or email. A Form Request validates the mutually exclusive contact fields; the public API returns the same 404 for an unknown code and a non-matching contact, while the existing route throttle remains active.
- Updated OpenAPI, regenerated Admin/Storefront API types, and updated the tracking form to use React Hook Form/Zod with linked accessible field errors. Updated account and checkout-order specs. OpenAPI type generation, Pint, PHP syntax checks, Storefront lint, and Storefront production build passed. No tests were run.

### Storefront order tracking identifier edge case (2026-10-26)
- The API now selects the email column only when a non-null email identifier was validated; empty email plus phone falls back to phone. Confirmed the idempotent demo order seeder already supplies both phone and email for the seeded customer order. Pint and PHP syntax validation passed. No tests were run.

### Storefront seeded video media audit (2026-10-26)
- Extended the repeatable demo-media audit to enforce the Admin MP4 upload size limit and detect non-MP4 containers via the 

typ signature. Updated the asset workflow documentation. The seeded clip passes the audit and 

fprobe confirms a decodable 6-second H.264 High-profile 720Ãƒâ€”480, 24 fps video in yuv420p, sized 68,240 bytes.
- Pint, PHP syntax validation, and the full media audit passed with no missing files, missing alt text, or invalid media. No tests were run.

### Storefront theme contrast audit (2026-10-26)
- Added a repeatable contrast audit for all 14 appearance palettes in light and dark modes. Text, muted text, links, and button labels meet 4.5:1; computed input/select/textarea boundaries meet 3:1 against sampled surfaces.
- Storefront controls now use an accessible boundary color independent of decorative separators. Storefront ESLint, production build, and the palette audit passed; no tests were run.

### Storefront category and collection structured data (2026-10-26)
- Resolved category and collection listing pages now emit schema.org CollectionPage with published metadata and an ItemList of the visible API-backed products. Product entries link to public detail routes and include the catalog image when present.
- Updated the catalog specification and frontend SEO architecture notes. Storefront ESLint and TypeScript/Vite production build passed. No tests were run. S7.3 remains incomplete pending crawler-oriented rendering/prerender support.

### Storefront demo apparel-image disclosure (2026-10-26)
- Demo product photos are now visibly labeled “Ảnh concept demo” on catalog cards, home product rails, related products, and product detail. Product links include the disclosure in their accessible names. Real operator-uploaded photos are unaffected because detection relies on the demo-seeder alt-text prefix.
- Documented the demo-image boundary in the catalog spec and asset workflow guide. Storefront ESLint and TypeScript/Vite production build passed; no tests were run.

### Storefront seed media coverage audit (2026-10-26)
- Extended the read-only media audit to require demo coverage for all 7 seeded categories, 18 catalog demo products, 2 collections, and hero/hero-mobile/campaign banners (including the campaign video). It now catches missing DB records, thumbnails, or gallery images as well as broken files and metadata.
- PHP syntax validation and the media audit passed against the current database: no missing required records, files, alt text, or invalid media. The audit found 3 banner images, 1 video, 7 category covers, 2 collection covers, 19 thumbnails, and 24 gallery images.

### Storefront CMS page structured data (2026-10-26)
- Published CMS pages now emit schema.org WebPage JSON-LD using the page's public title, description, canonical URL, and API creation/update timestamps. Unresolved pages still receive noindex metadata and do not emit this schema.
- Updated frontend architecture SEO notes. Storefront ESLint and TypeScript/Vite production build passed; no tests were run. Crawler-oriented rendering remains outstanding for S7.3.

### Storefront S0.4 completion update (2026-10-26)
- Current `storefront/src/App.tsx` is 91 lines, below the S0.4 target of 100 lines. Route rendering and auth route handling live in `app/StorefrontRouteContent.tsx` and `features/auth/StorefrontPublicAuthRoute.tsx`; this supersedes the older note that App.tsx was still 176 lines.

### Admin lint cleanup continuation (2026-10-26)
- Resolved Admin's remaining stale hook dependencies and replaced React Hook Form `watch()` subscriptions with `useWatch()` in account recovery, catalog references, order dialogs, store settings, and support tickets. The route map is now module-scoped; intentional route/query-to-form synchronization is documented at its state updates.
- Full Admin ESLint passes with 0 errors and 0 warnings. Admin TypeScript/Vite production build passes; its existing large-chunk advisory remains. No tests were run.

### Admin route code splitting follow-up

- Converted major Admin route pages (catalog, campaign, settings, reports, staff, customers, products, inventory, and manual order) to lazy imports. Added an accessible loading fallback for route content and invitation acceptance.
- Admin `npm run lint` and `npm run build` pass. The main JS chunk decreased from the prior 1.73 MB build to 1.13 MB (312 KB gzip); the build still reports a >500 KB main-chunk advisory, so performance work remains open. No tests were run.

### Storefront responsive product media (S7.2)

- Added a reproducible `assets:storefront-product-sources` workflow that generates 360px and 640px WebP candidates for all 15 seeded apparel concept photos (30 files, each under 35 KB). The existing full-size image remains the fallback.
- Public product resources expose `srcset` only for demo photos after checking the local variants; OpenAPI and generated Admin/Storefront API types include the optional field. Storefront now passes API sources to catalog, home rails, product detail, related products, and wishlist images. Illustrations and operator uploads receive no fabricated descriptors.
- Extended the media audit to validate each responsive source. `php tools/assets/audit-storefront-media.php` reports complete records/files/alt text and zero invalid assets. Storefront and Admin lint/build, API type generation, PHP syntax, and Pint passed. No tests were run; mobile 4G LCP measurement remains open.

### Storefront P0 copy and API-data audit

- Removed the catalog's hard-coded `Essential Ã‚Â· Collection 01` description fallback; a product card now displays a description only when the API supplies one. Removed home-page material/sustainability/founding-year claims that were not backed by store configuration or published content.
- Source audit confirms there is no preview-product array or those unsupported strings in Storefront source. Storefront lint and production build pass. No tests or server runs were performed.

### Storefront product detail CMS data

- Product detail now reads the published `shipping` page for delivery/returns copy and loads `size-guide` only when the shopper opens the size guide. Both states distinguish loading, network failure, and unpublished content; returned CMS markup is sanitized before rendering. Removed unsupported category/review-name/description fallbacks from the detail page.
- Added an explicitly labeled centimeter-based sample size guide to `StorefrontDemoSeeder` and applied the idempotent seeder locally; DB inspection confirms the page is published. Updated the product-detail spec. Storefront lint/build and PHP Pint/syntax passed. No tests or server runs.

### Storefront asset-upload gate verification (A8)

- Verified Admin banner/category/collection/brand assets use the authenticated `/api/v1/admin/uploads` endpoint; product images have the dedicated upload endpoint. API media upload allows JPG/PNG/WebP/MP4 up to 5 MB, while the shared Admin image picker intentionally caps image selection at 2 MB and the campaign video input caps MP4 at 5 MB. Upload route requires the admin audience and one of its documented product/content permissions, including `settings.manage` for store branding uploads.
- Updated the storefront implementation plan with the verified route and limits. Demo media completeness remains covered by `tools/assets/audit-storefront-media.php`; approval of real production assets and production UAT remain open.


### Collection detail and catalog lookup
- Collection detail routes now resolve with GET /collections/{slug} instead of searching the first paginated collection list, so collections beyond the home page can open directly. Added validated include_products (default true) and made Storefront request metadata only; separately paginated GET /products?collection={slug} supplies product cards. OpenAPI, generated Admin/Storefront types, and the catalog page spec are aligned.
- PHP syntax, Pint on changed PHP files, Storefront lint, and Storefront production build passed. No tests or development servers were run.


### API-backed banner copy for the approved Storefront mockup
- Added nullable 500-character banner description with an additive migration. Admin campaign forms edit it, both admin/public resources return it, OpenAPI and generated types include it, and the Storefront hero/campaign render it only when supplied. Seeded demo hero/campaign records with concise copy without overwriting non-empty operator descriptions; refreshed the SQL snapshot and specs.
- Applied the migration and StorefrontDemoSeeder locally. PHP syntax and Pint passed; Storefront lint/build and Admin production build passed. Admin build retains its existing large-chunk warning. No tests or servers were run.

### Visible disclosure on seeded concept media
- The existing concept-image detector already recognizes the seeded alt-text prefix, but home hero/campaign, category covers, and collection/lookbook covers were not displaying the badge. Added the badge to those surfaces and updated seeded alt text while preserving known operator-authored copy. Updated the home spec.
- Reseeded local demo content and verified hero/mobile/campaign, category, and collection alt text begins with the concept disclosure. The media audit reports 0 missing records/files/alt text and 0 invalid assets. Storefront lint and production build passed. No tests or servers were run.
### Storefront crawler-readable release snapshots (S7.3)

- Added `npm run build:seo`, which builds the regular Vite SPA and then generates route-specific HTML snapshots from Laravel's public sitemap/API for the home page, product catalog, published products, active categories and collections, and published CMS pages. Snapshots include descriptive metadata, canonical URLs, useful initial page text/images, and schema.org JSON-LD; a bounded worker pool limits API requests during release generation.
- Category sitemap entries now use stable `/categories/:slug` routes, with legacy query-filter URLs still supported in the Storefront. Category navigation links share the canonical path, each category renders API-backed metadata/products, and release prerendering emits category-specific snapshots. Bumped the sitemap cache key so existing deployments do not retain the previous query URL set.
- The local sitemap and release build confirm 36 public route snapshots, including all seven active seeded categories. Category snapshot HTML has page content, canonical metadata, and JSON-LD. Storefront lint and SEO production build pass; the API sitemap controller passes PHP syntax validation. The static palette audit passes for 14 light/dark themes at the documented contrast thresholds, and media audit reports no missing/invalid demo assets or alt text. No tests were run.
- Fixed the public `category` filter to include active descendant categories. The local release build now renders 19 products for the seeded `Trang phục` parent and the correct leaf counts (`Áo`: 4; `Hàng mới`: 5). Updated OpenAPI parameter semantics and catalog guidance; Pint, OpenAPI type generation, Storefront lint, and `build:seo` pass. No tests were run.
- Replaced the fixed-depth public category eager-load with a shared `ActiveCategoryTree` used by category responses, descendant filters, and sitemap generation. This returns all active visible levels consistently and excludes active child rows whose ancestor is inactive; bumped the sitemap cache namespace. Pint, PHP syntax checks, Storefront lint, and the 36-route SEO build pass. No tests were run.
- Improved release snapshots to preload desktop/mobile hero media using viewport conditions, render the API's mobile hero crop in `<picture>`, use API image `srcset` for seeded WebP images, and lazy-load catalog card images after the first four (first card gets high fetch priority). The live 36-page build emits two hero preloads, one mobile source, and the 19-product catalog has 4 eager/15 lazy images with 16 responsive `srcset`s. Storefront lint and SEO build pass; LCP has not yet been measured on a mobile 4G profile. No tests were run.
- Prevented homepage product rails from competing with the hero: all eight products in the generated home snapshot now use lazy loading and automatic fetch priority; the hero remains high priority, while catalog first cards stay eager/high priority. Verified the live 36-route SEO build, home HTML attributes, catalog first-image priority, and Storefront lint. No tests were run; mobile 4G LCP remains unmeasured.
- Expanded crawler-readable home HTML to match the approved storefront layout and live API data: category covers, collection cards, newest/bestseller product rails with VND prices, campaign video/image, lookbook, concept badges, and the hero/service strip are now present before JavaScript. Live output contains 7 category cards, 1 collection card, 8 product cards, 1 campaign video, 1 lookbook, and the hero's high fetch priority; all rail product images remain lazy. TypeScript/Vite `build:seo`, script syntax check, and Storefront lint pass. No tests were run; mobile 4G LCP remains unmeasured.
- Kept the normal `npm run build` independent of the API. Documented the release-only API/site URL variables, static Nginx behavior, freshness requirement, and the choice versus SSR in ADR-0016 and deployment/frontend architecture docs. No tests were run; generated production snapshots still require running `build:seo` with the release API available.


### Storefront API demo-data coverage audit

- Added 	ools/assets/audit-storefront-api-demo-data.php, a read-only audit of local database coverage across catalog, home rails, filters, product variants/media, collections, banners, CMS pages, checkout, newsletter, reviews, order queues, account fixtures, and address lookup. Documented its usage in 	ools/assets/README.md.
- The audit exposed that VietnamAddressCatalog::wards() called province(), which returns only province code/name, so the API returned an empty ward list even when the source catalog contained wards. Updated ward lookup to read the selected province's ward list directly; unknown province codes still return 
ull.
- Corrected the audit's home-rail check: newest products are ordered by created_at and do not require the separate is_new catalog flag. The address check now also requires the Hanoi ward list to be non-empty.
- PHP syntax and the read-only local data audit were run. No tests or servers were run.

### Storefront new-arrival demo data

- The read-only API-data audit found no active products marked is_new, leaving the published GET /products?new=true filter without sample results. CatalogSeeder now marks six known demo apparel items as new on creation and initializes them only when the database has no active new-arrival products, preserving existing merchandising when it is already configured.
- Ran the idempotent CatalogSeeder against the configured local database. The audit now reports 6 active new-arrival products and zero failed coverage checks across catalog, media, checkout, account/order examples, and address lookup (34 provinces and 126 Hanoi wards).
- PHP Pint and syntax validation passed. No tests or servers were run.

### Admin API demo-data coverage audit

- Added `tools/assets/audit-admin-api-demo-data.php`, a read-only audit of the configured local database covering all nine Admin/API roles, 26 permissions and super-admin assignments, active variant inventory, stock movement history, order items/payments/status histories, and shipments for delivered orders. Activity-log count is informational and does not require synthetic logs.
- Documented the audit in `tools/assets/README.md`. PHP syntax validation passed; the audit reports 0 failed checks (9/9 roles, 26/26 permissions, inventory for 108/108 active variants, 6 movements, and order/payment/history/shipment coverage). No tests or servers were run.

### Admin operational demo fixtures

- Added `AdminWorkflowDemoSeeder` to seed local/testing-only records for the Admin workspace and operations APIs: three personal tasks across todo/doing/done, pinned note, report bookmark, saved order view, role-targeted announcement, unread database notification, recent-item entry, paused report schedule, customer support conversation with two messages, and customer note. It is called from `DatabaseSeeder` and avoids active report schedules and notification dispatch.
- Added a historical inventory CSV import with a failed row for the import-history/download API; it does not modify inventory. Extended the read-only Admin API demo audit to require this fixture and its error row.
- Added a local/testing-only verified staff fixture with a configurable local password and a pending `products.delete` request, so the permission-request screen can be populated and reviewed without sending an invitation email. Documented the local-only boundary in `docs/architecture/auth-rbac.md`.
- Ran the seeder twice; record counts remained stable and all audit checks pass, including 9/9 roles, 26/26 permissions, inventory for 108/108 variants, 4 orders with item/payment/history data, 2 delivered shipments, an active verified demo staff login with one pending permission request, one import-error row, and the Admin workspace/support fixtures. PHP syntax and Pint passed. No tests or servers were run.

### Coupon usage amounts in Admin history

- Source review found both Storefront checkout and Admin manual-order creation left `coupon_usages.discount` at its database default, while the Admin campaign usage endpoint displays that field. Both order paths now persist the server-calculated discount amount; the checkout and coupon business-flow docs describe the reporting contract.
- The idempotent demo-order seeder now reconciles the stored coupon discount against the immutable order snapshot when rerun; the Admin API-data audit requires a matching non-zero discount so existing local demo data is covered too.
- Ran `StorefrontOrderDemoSeeder` against the configured local database to reconcile the existing fixture. The read-only Admin API audit then passed all checks, including coupon discount equality, with the order count unchanged at four. PHP syntax and Pint passed. No tests or servers were run.

### Storefront HÃ ng má»›i category integration

- The catalog API and OpenAPI already agreed on the 
ew query parameter; the earlier suspected contract mismatch was disproved during source inspection. The real UI/data gap was that the seeded HÃ ng má»›i category had no products assigned because garment-type categories own the single category relation.
- Reserved the existing hang-moi category slug as a storefront alias for the is_new merchandising flag in the public product query. This keeps product garment categories intact while making the category filter and /categories/hang-moi route return the six seeded arrivals. Documented the behavior in OpenAPI, API conventions, and the catalog page spec.
- Regenerated Admin and Storefront API declarations. Pint and PHP syntax validation pass; the read-only API demo-data audit reports zero failed coverage checks. No tests or servers were run.

### Address catalog coverage for all storefront checkout provinces

- Strengthened the read-only Storefront API data auditor to verify ward lists for every province returned by the location catalog, not just the Hanoi sample. The configured catalog contains 34 provinces, each with ward data, for 3,321 wards total; the database/API fixture audit reports zero failed checks.
- Updated 	ools/assets/README.md to document the all-province coverage check. No database records were changed and no server or tests were run.

### Reusable catalog tag demo data

- `CatalogSeeder` now creates six reusable Vietnamese product tags (new arrivals, best sellers, linen, cotton, office, and minimalist style) and idempotently attaches them to matching demo apparel using additive `syncWithoutDetaching` behavior.
- The read-only Admin API demo audit now checks that reusable tags exist and active demo products use them. Ran `CatalogSeeder` in the verified local environment; the Admin audit reports six tags, 15 active products with tags, and zero failed checks. The Storefront demo-data audit also remains at zero failed checks.
- PHP syntax and Pint passed for the changed seeder. No tests or development servers were run.

### Storefront/Admin static release verification (2026-10-27)

- Ran `npm run lint` and `npm run build` in both `storefront/` and `admin/`; all four commands passed. These are static checks/builds only, not runtime or browser acceptance evidence.
- Storefront's production entry is 365.76 KB raw / 113.65 KB gzip. Admin builds successfully but still emits Vite's >500 KB chunk warning for a 621.69 KB / 176.46 KB gzip entry; route-controller/code-splitting work remains open.
- No tests or dev servers were run. Browser responsive/keyboard review and production-policy/content decisions remain outstanding.

### Admin manual-order shipping-method demo fixture (2026-10-27)

- The read-only database inventory found `shipping_methods` empty even though Admin manual-order entry selects active methods. `StorefrontDemoSeeder` now idempotently creates one active “Giao hàng tiêu chuẩn” option at the configured default fee; its estimated delivery time stays null until the store confirms a promise.
- Extended the Admin API demo audit to require an active method. Ran the seeder in `local`; Admin, Storefront API-data, and media audits all report zero failures. Pint and PHP syntax validation pass; no tests or servers were run.

### Multi-SKU inventory adjustment demo coverage (2026-10-27)

- Local table inventory showed the multi-variant adjustment voucher API had no demo batch. `AdminWorkflowDemoSeeder` now calls the existing transactional inventory action to create one labeled stocktake voucher with two +2 SKU entries for the demo linen shirt; a stable note marker prevents repeat runs from changing stock again.
- Extended the read-only Admin API audit to require the voucher and at least two linked adjustment movements. Ran the seeder twice in `local`; movement count stayed at 8 after the second run, with one voucher/two linked ledger entries and zero failed audit checks.
- Updated the demo workflow documentation. PHP syntax and Pint pass; no tests or servers were run.

### Admin announcement read-state demo coverage (2026-10-27)

- The database had no `announcement_reads`, leaving announcement read receipts/counts without a sample. The local/testing Admin seeder now creates a second role-targeted notice and an idempotent read receipt for the Admin fixture user, while retaining the existing unread announcement for the same role audience.
- Extended the read-only Admin audit to require both unread and read announcement examples plus the receipt. Ran the seeder twice; the audit confirms one seeded read receipt and zero failures. PHP syntax and Pint pass; no tests or servers were run.

### Demo staff shift and handoff coverage (2026-10-27)

- `user_shifts` was empty although Admin exposes start/end, shift history, weekly duration, and handoff APIs. The local/testing seeder now creates one closed 8-hour shift with a handoff note for `demo.staff@example.test`; it never opens a shift for the real Admin account and is idempotent within the current week.
- Extended the Admin API audit to require the completed demo shift. Ran the seeder twice in `local`; the audit reports one valid shift and zero failures. Updated the account-menu documentation, which had incorrectly said the migration was unapplied. PHP syntax and Pint pass; no tests or servers were run.

### Account deactivation approval revokes every account's sessions (2026-10-27)

- Source review found that approval only changed account status and revoked sessions for privileged admins; ordinary staff/customer requests were marked approved while the account remained active. Approval now blocks every requested account and revokes its refresh tokens, personal access-session rows, and trusted-admin devices. The final-active-admin guard and no-self-review guard remain intact.
- Updated authentication/security guidance, account-menu acceptance criteria, and the OpenAPI result description; regenerated Admin and Storefront API declarations. OpenAPI type generation, Pint, and PHP syntax validation pass. No tests or servers were run.

### Account-deactivation review demo data (2026-10-27)

- Added a pending deactivation-review fixture owned by a separate disposable demo staff account. Approving it exercises the new universal account-block/session-revocation behavior without risking the login-ready `demo.staff@example.test` account.
- The read-only Admin API audit now verifies that the request state matches the disposable requester's account state (active while pending/rejected, blocked after approval). Ran the Admin workflow seeder twice in `local`; the request stayed pending, the primary demo staff login remained ready, and the audit reports zero failures. PHP syntax and Pint pass; no tests or servers were run.

### Demo-table exclusion review and full data/media audit (2026-10-27)

- Classified the remaining empty tables: settings correctly resolve API defaults; refund rows are absent in the COD-only demo; real backups/device subscriptions/provider links require configured hosts or user credentials; token/challenge tables are transient secrets; and review images have no current customer upload route. Documented why these must not be populated with fabricated credentials or customer media.
- Re-ran all three read-only audits after adding account-deactivation fixtures. Admin API coverage, Storefront API coverage, and demo-media integrity each report zero failed checks. Current Storefront data includes 19 active products, 3 banners (one video), 7 category covers, 2 collection covers, 49 gallery images, all with valid files/alt/dimensions; checkout address data covers all 34 provinces and 3,321 wards.
- No tests or servers were run.
### Store branding image uploads in Admin settings (2026-10-27)

- Added logo, favicon, and Open Graph image uploads to Store Settings using the shared Admin image uploader, with image previews and retained external URL fields. Saving stays disabled while any image is uploading.
- Added `settings.manage` to the existing Admin upload route permission alternatives and aligned the OpenAPI summary and Admin settings guide. The endpoint still enforces its existing image/video MIME and 5 MB server limit; the shared image picker caps these settings images at 2 MB.
- Admin lint and production build pass; route PHP Pint and syntax checks pass. The build retains the existing >500 KB chunk warning. No tests or development servers were run.

### Storefront home uses configured brand name (2026-10-27)

- Removed remaining hard-coded NÃ‰T brand labels from the Storefront home sections, newsletter consent text, and mobile navigation heading. These now use the same public `store_name` already supplied to the header/footer and SEO defaults.
- Updated the home page spec. Storefront ESLint and the TypeScript/Vite production build pass; no tests or app servers were run.


### Storefront return-window demo coverage (2026-10-27)

- Stabilized two idempotent delivered-order fixtures: one delivered yesterday with a pending return request, and one delivered 14 days ago with a review. Order timestamps, delivery/completion history, and shipment timestamps stay aligned on each seeder run, preserving examples inside and past the seven-day return window.
- The Storefront API demo audit now requires both eligibility states. Seeder ran successfully; audit reports 1 eligible order, 1 expired order, and 0 failed checks. PHP Pint and syntax validation pass; no tests or servers were run.

### Return-window fixture audit tightened (2026-10-27)

- Strengthened the read-only Storefront API demo audit beyond aggregate delivered-order counts: it now verifies the eligible order has a pending return request created after delivery, the expired example has no pending return request, and both seeded shipment timestamps equal their order delivery timestamps.
- Marked the account-page acceptance item complete against the implemented API/UI behavior and the new fixture-level audit. PHP Pint, syntax validation, and the local data audit pass; the audit reports 1 eligible order, 1 expired order, and 0 failed checks. No tests or servers were run.

### Storefront minimum-width layout hardening (2026-10-27)

- Allowed the home service strip to wrap below 380px, preserving its centered layout while preventing the delivery/payment labels from forcing a fixed single-row width at the documented 320px minimum.
- Storefront ESLint and production build pass. The rendered 320px browser and keyboard acceptance remains open because no browser session/server was started.

### Storefront implementation-plan decision cleanup (2026-10-27)

- Reconciled the named implementation plan with decisions and work already recorded elsewhere: the seven-day return policy is marked resolved, and A3 records the user's approval of the responsive apparel mockup dated 2026-10-26. Kept A8's separate real-content/media approval explicitly open, since approval of the mockup does not constitute approval of the demo media batch.
- No code or database changes; no tests or servers were run.

### Storefront customer review-image media audit (2026-10-27)

- Corrected the media documentation: review images now have a customer upload API, but demo fixtures intentionally do not invent customer-submitted photos. Extended the read-only media audit to validate stored review-image URLs and check local public-disk file existence when using local storage; remote disks are reported without remote file reads.
- The media audit passes with zero failures: current database has no review-image rows, and product/banner/category/collection/brand media remains complete (19 product thumbnails, 49 gallery images, 3 banners including 1 video, 7 category covers, 2 collection covers; no missing files or alt text). PHP Pint and syntax checks pass. No tests or servers were run.

### Storefront integration audit and footer copy cleanup (2026-10-27)

- Re-ran the read-only Storefront API, media, and Admin API demo audits against the configured database; all three report zero failures. Storefront coverage includes 19 active products, 30/30 color-image pairs, 3 banners with 1 video, 6 published pages, 34 provinces/3,321 wards, and 1 eligible plus 1 expired return example. Admin coverage includes 9 roles, 26 permissions, and inventory for all 108 active variants.
- Observed the already-running Storefront at http://127.0.0.1:5173/ without starting or stopping it: the home data rendered, browser console had no errors, and the 630px viewport had no horizontal overflow. Removed the redundant English Designed to be worn footer phrase so the footer stays consistent with the Vietnamese interface. Storefront ESLint and production build pass.
- The documented 320px browser review is still unverified. The available browser panel had a fixed 630px viewport, and a data-URL iframe wrapper was rejected by its URL security policy; no workaround or app restart was attempted. No tests or servers were run.

### Storefront API-backed SEO release build (2026-10-27)

- Used the already-running API and Storefront origins for 
pm run build:seo; no server was started and no .env file was changed. The release prerender completed successfully and generated exactly 36 index.html snapshots from the live sitemap.
- Inspected generated home and product snapshots: canonical URLs use the configured Storefront origin; home includes Organization/WebSite JSON-LD and API-backed campaign/product content; product detail includes its API title, VND price, media URLs, and Product/Offer JSON-LD. This closes the previously unrun API-dependent SEO build check for the current local data. No tests were run.

### Storefront home banner query scope (2026-10-27)

- Limited the campaign/hero banner API query to the active home route. Other routes no longer request banner data they do not render; navigating to `/` enables the query and reuses the shared TanStack Query cache. Shared category/collection navigation and published footer links remain available across routes.
- Updated the frontend architecture and home-page spec to document the route-scoped query. No tests or servers were run.

### No-fake-apparel visual cleanup (2026-10-27)

- Replaced the remaining jacket illustration on the Storefront authentication layout with an abstract NÃ‰T Studio brand graphic, matching the Admin login treatment. The graphic has descriptive brand artwork alt text; it does not depict clothing.
- Re-ran read-only Storefront, Admin, and media coverage audits against the configured database: each reports 0 failed checks. The current catalog has 19 active products and 30 product/color combinations, with 0 store-provided product photos; all products remain clearly marked as awaiting real photos, as requested.
- Re-ran `npm run lint` and `npm run build` in both SPAs; both pass. Admin still has the known 554.34 KB entry-chunk warning. A source scan found no remaining jacket/clothing illustration assets or references in app/media/mockup sources. Existing local servers were left running; no tests were run.
- Corrected the seeded “Hàng mới” collection description so it says the store is updating real product photos, and corrected the campaign description so it accurately describes its neutral brand video. The idempotent seeder changes only exact former demo copy, preserving store-authored content. Added audit regression checks for both stale descriptions, reran the Storefront seeder, and confirmed the expanded API data audit still reports 0 failures. Live GETs of `/api/v1/products` and `/api/v1/banners?placement=campaign` return the pending-real-photo disclosure and accurate video description; Pint and PHP syntax validation pass.
- Removed unused apparel silhouette rules from the Storefront's globally imported `App.css`, including the generic `.art::before` fallback that could draw a garment behind product imagery if an image failed or was transparent. Product image containers now fall back to the existing neutral background. A CSS source scan finds no silhouette rules; Storefront ESLint and production build pass.
- Replaced misleading “Hình minh họa sản phẩm” image-alt fallbacks across catalog, home rails, product detail, wishlist, and cart. Added a shared resolver that preserves API alt text, identifies the pending-photo placeholder, and uses a neutral product label for real images without alt text. Added `image_alt` to the cart product summary in OpenAPI and Laravel's cart response, regenerated Admin/Storefront types, and updated the cart/catalog specs. Storefront ESLint/build and PHP Pint/syntax pass; no tests were run.
- Removed stale mockup copy claiming generated photorealistic fashion imagery was used. Both Storefront review mockups now disclose neutral brand graphics and pending-photo placeholders; replaced references to removed campaign image filenames and changed product image sources to the maintained placeholder asset. Updated the asset review documentation to distinguish store-supplied product photos from pending placeholders. Static path/name scan found no remaining photorealistic/generated apparel-image claims or removed asset references in the mockup docs; no tests or servers were run.
- Revalidated current database coverage after the mockup cleanup: Storefront API-data audit (19 products, 30 color pairs, 3 banners including a video, 34 provinces/3,321 wards) passed with 0 failed checks; media audit (all required files, alt text, dimensions, and formats) passed with 0 failures; Admin API-data audit (9 roles, 26 permissions, 108/108 variants with inventory) passed with 0 failures. Also checked every local image/video source referenced by the two review mockups resolves to an existing file. No tests or servers were run.
- Updated Admin product create/edit and image-management screens to explicitly require real photos of the listed products, prohibit generated clothing images, and explain that the Storefront keeps a neutral pending-photo placeholder until real photos are uploaded. Added English translations and documented the behavior in the Admin product spec. Source review confirms both upload flows and empty states use the new guidance; no tests or servers were run.
- Extended the same real-photo guidance to the separate product-thumbnail URL override on the Admin detail page. The empty thumbnail preview now explains the neutral Storefront fallback, so this alternative image entry route does not imply a fabricated photo is needed. Confirmed the shared FormField renders and associates its hint with the URL input; no tests or servers were run.
- Confirmed Admin remains compatible with the regenerated OpenAPI types: `npm run lint` and `npm run build` both pass. The production build still reports the existing 554.34 KB entry-chunk advisory; no tests or servers were run.
- Read-only runtime smoke check found the already-running API on `127.0.0.1:8000` and Storefront dev server on `127.0.0.1:5173`. `/up`, `/api/v1/products?per_page=1`, and Storefront `/` returned HTTP 200; the product API returned JSON with `Access-Control-Allow-Origin: http://127.0.0.1:5173`. No process was started or stopped.
- Rewrote the stale root README setup and implementation summary: it now reflects all five `npm run dev` processes, strict local ports, local MySQL/database queue defaults, Mailpit use, the real-product-photo rule, media review board, and read-only fixture/media audits. Confirmed the old three-process/basic-product-management wording is gone; no app server or tests were run.
- Added the previously planned `.github/workflows/ci.yml`: CI now checks generated OpenAPI types, runs Admin/Storefront lint and production builds, validates Composer manifests, and checks PHP formatting with Pint. Kept test suites out of automation pending the project's stated owner-enable gate. Parsed the workflow YAML locally and confirmed all three jobs and read-only token permissions; did not execute CI jobs or tests.
- Verified Admin API CORS preflights against the already-running local API without sending writes: origins `127.0.0.1:5174` and `127.0.0.1:5175` both receive 204 for Admin requests, including POST/PATCH/DELETE with authorization/content-type/accept headers. No application process was started or stopped.

### Admin dashboard route chunk (2026-10-27)

- Moved dashboard filtering, data-query orchestration, KPI cards, charts, and widgets from the main Admin application module into a lazy-loaded AdminDashboardPage feature chunk. The dashboard is loaded on first visit and stays mounted after that visit so its date/filter state is retained while switching admin pages. Sidebar alert counts now rely on the dedicated alerts query rather than the dashboard summary request.
- Admin lint and production build pass. Build output reports AdminDashboardPage at 28.08 kB (7.93 kB gzip); main entry is 532.85 kB (156.04 kB gzip), down from the pre-split 544.38 kB (159.27 kB gzip). The CSS entry remains 223.02 kB (35.39 kB gzip). Vite still warns that the main entry exceeds 500 kB; no tests or app servers were run.

### Storefront read-only route review (2026-10-27)

- Temporarily started the local Laravel API and Storefront Vite server after owner authorization, then reviewed the rendered home, catalog, product detail, empty cart, and empty checkout routes in the browser accessibility tree. Each rendered route had the shared skip link, primary content landmark, and functional API-backed navigation/content; product cards and detail explicitly announce the pending real-photo placeholder. The empty cart and checkout both provide a clear link back to products. No cart, newsletter, account, or order mutation was performed.
- The catalog and product recommendations expose Áo khoác blazer nhẹ (copy) (out of stock) from a previously retained local database record; its seed detail is identified as demo data. Asked the owner whether to hide this duplicate from the public Storefront, and am preserving it until they decide. Stopped both processes after the review; ports 5173 and 8000 are no longer listening. This is a rendered route review, not an E2E checkout test.

### Storefront/Admin API and media audit (2026-10-27)

- Re-ran the three read-only database/media audits against the current configured database. Storefront coverage reports 19/19 active products with variants and galleries, 30 active color pairs (0 owner-provided product-photo pairs yet), 2 collections with products, 3 banners including 1 video, 6 published pages, 34 provinces with 3,321 wards, and all required checkout/order/account/newsletter demo states; 0 failed checks.
- Media audit confirms the logo/favicon/OG image, 3 banner images, campaign video, 7 category covers, 2 collection covers, 19 product thumbnails and gallery references all have valid local files and alt text, meet format/dimension/size requirements, and contain no generated product-photo references; 0 failed checks. Admin audit confirms all 9 roles/26 permissions, 108/108 active variants with inventory, seeded order/payment/history/shipment records, and the required Admin workflow fixtures; 0 failed checks. These are data coverage audits, not purchase-flow E2E tests.
- The owner decision about the public duplicate catalog item remains pending; no database records were changed.

### Storefront public content page browser review (2026-10-27)

- Read the rendered About and Contact content pages using the running local API/Storefront, then stopped both processes and confirmed ports 5173 and 8000 are closed. Both routes have page-specific document titles, one page-level heading, the shared skip link, and main-content landmark; no forms were submitted.
- Current About and Contact copy explicitly indicates that official brand/support information must be supplied through Storefront settings or Admin CMS. Shipping/return rules are already aligned with the owner-approved seven-day request window. Final brand story, contact channels, legal terms, and size-chart measurements remain owner content gates; I did not invent them.

### Storefront empty-cart accessibility refinement (2026-10-27)

- Marked the decorative N monogram in the empty-cart state as aria-hidden, so assistive technology proceeds directly to the meaningful heading instead of announcing a stray character.
- Storefront ESLint and production build pass. The route chunks remain lazy; the largest shared JS chunk is 365.76 kB (113.65 kB gzip), and Vite reports no oversize-chunk warning. No tests or app servers were run.

### Storefront S7.6 frontend security review (2026-10-27)

- Reviewed token/storage and CMS-rendering paths. Access JWT is held in module memory; browser storage is limited to appearance, guest-cart session token, and password-recovery email/resend timing. No auth token in local/session storage and no console log/debug/info calls were found in Storefront source.
- CMS page content is sanitized on Admin writes, Laravel resource reads, and again in the Storefront before dangerouslySetInnerHTML; the allowlist removes attributes and drops script/style/iframe/object/embed/SVG/MathML/template. JSON-LD serialization escapes < before insertion into its script node. Static review found no discrepancy; no tests were run.

### Checkout request state moved to TanStack Query (2026-10-27)

- Replaced the hand-managed busy flags and direct request orchestration for checkout quote and order submission with TanStack Query mutations in the checkout action hook. Request and response shapes for both POST endpoints now come from generated OpenAPI types.
- Preserved server-owned quote/order totals, the stable idempotency key for retries with an unchanged cart/payload, same-scope cart/auth headers, existing API validation mapping, quote invalidation on input changes, and request-ID protection from stale preview responses. An empty province also invalidates any in-flight preview.
- Storefront ESLint and TypeScript/Vite production build pass with no lint warnings. No test suite or order mutations were run.

### Order and review mutations use TanStack Query (2026-10-27)

- Moved Storefront order cancellation/return requests and product review submissions into TanStack Query mutations. The dialog still owns its local busy/focus behavior; the review form reads its pending state from the mutation. Order detail updates and order-list invalidation remain unchanged, while a successful review marks its matching line with the returned moderation status.
- The API remains authoritative for cancellation/return eligibility and the seven-day delivery-based deadline. No order transition or inventory logic moved to the client. Storefront ESLint and TypeScript/Vite production build pass with no lint warnings; no review or order-change request was submitted.

### Address book mutations use TanStack Query (2026-10-27)

- Moved address create/update, set-default, and delete requests into TanStack Query mutations. Local form draft and field-validation state remain local; the existing customer-scoped address cache updates and default-address behavior are preserved.
- The address list now disables duplicate set-default/delete actions while a matching mutation is pending and announces the active row action in its button text. Storefront ESLint and TypeScript/Vite production build pass with no lint warnings; no customer address was changed.

### Account settings mutations use TanStack Query (2026-10-27)

- Moved profile, email, password, account deletion, avatar upload/removal, email verification resend, and session revocation actions to TanStack Query mutations. Kept server validation errors mapped to their existing form fields, and preserved account/session cache updates and logout callbacks.
- Storefront ESLint and TypeScript/Vite production build pass. No account mutation or test suite was run.
- Owner direction: do not use fake or AI-generated clothing photos as product photography. Keep product photos as placeholders until real store-supplied photos are available; current media audit contains no generated product-photo references.

### Storefront real-photo and route checklist refresh (2026-10-27)

- Re-ran the current read-only API/media audits against the configured database: Storefront 0 failed checks (19 active products, 30 color pairs, 0 owner-provided product-photo pairs, 0 generated product-photo references, 3 banners including one video, all 34 provinces and 3,321 wards); Admin 0 failed checks; media 0 failed checks (no missing files, alt text, invalid dimensions/formats/sizes, or generated product media). This confirms product assets resolve to the neutral pending-photo placeholder while real store photos are unavailable.
- Temporarily started the local apps under the owner's existing browser-review authorization. Read the rendered home, catalog, product detail, and empty checkout accessibility trees: catalog reports 19 products, detail clearly marks the missing real photo and keeps add-to-cart disabled until a variant is selected, and empty checkout links back to products. No account, cart, newsletter, or order write was submitted.
- The catalog still exposes the local demo record “Áo khoác blazer nhẹ (copy)” as out of stock; it remains untouched while the owner's earlier keep-or-hide decision is pending. Stopped the temporary `npm run dev` process and confirmed ports 5173, 5174, 5175, and 8000 have no listening sockets.

### Storefront cart writes use TanStack Query mutations (2026-10-27)

- Moved add-to-cart, server quantity updates, line removal, and the coupon/shipping quote preview to TanStack Query mutations. Pending row IDs now come from the mutation cache, so concurrent actions on different cart lines retain independent disabled states; API responses still replace the cart with canonical server values, and failures still refresh the cart and show the existing toast. Quote results remain guarded by the province/coupon/cart signature so stale responses cannot replace current totals.
- Moved customer login submission to a TanStack Query mutation, preserving the in-memory access token, customer state, API error display, and safe same-origin `returnTo` navigation.
- Storefront ESLint and TypeScript/Vite production build pass. No cart/auth API mutation or test suite was run.

### Storefront authentication forms use TanStack Query mutations (2026-10-27)

- Moved customer registration, verification-email resend, password-recovery request/resend/reset, and login submissions to TanStack Query mutations. Password policy validation, resend throttling/storage, safe login return navigation, and existing API error messages remain unchanged; credentials and access tokens are not added to browser storage.
- Storefront ESLint and TypeScript/Vite production build pass. No authentication API request or test suite was run.

### Order change dialog uses mutation pending state (2026-10-27)

- Removed the dialog's duplicate local busy flag; cancellation/return request pending state now comes from the TanStack Query mutation that submits the request. The dialog still owns its form validation, server error, and focus behavior, and cannot close while the API request is pending.
- Storefront ESLint and TypeScript/Vite production build pass. No order-change request or test suite was run.
- Storefront logout now also uses a TanStack Query mutation; cleanup of customer-only query caches, access token, cart-merge state, address draft, and navigation still runs after the best-effort API logout response.

### Shipping policy copy aligned with live checkout (2026-10-27)

- Runtime route review showed the seeded public shipping page promised that an estimated delivery time appears during checkout, but the current checkout/shipping-fee contract exposes no delivery ETA. Removed that unsupported promise from the demo copy; it now says the address-based shipping fee is shown before placing an order, while retaining the owner-confirmed seven-day return-request window.
- Updated the seeder to migrate only the exact prior demo copy (or its known legacy variant), preserving any store-edited page content. Ran `StorefrontDemoSeeder`; the rendered `/pages/shipping` route now confirms the corrected text. PHP Pint and PHP syntax validation pass. The temporary app processes were stopped and ports 5173, 5174, 5175, and 8000 have no listeners; no tests or form submissions were run.

### Storefront auth mutation route review (2026-10-27)

- Reviewed rendered `/login`, `/register`, and `/forgot-password` routes after moving their submissions to TanStack Query mutations. Login and recovery expose labeled fields and actions; registration correctly follows the API's disabled-registration setting and presents its invite-only state. No auth request was submitted.
- Stopped the temporary `npm run dev` process and confirmed ports 5173, 5174, 5175, and 8000 have no listening sockets. This was a read-only accessibility-tree review, not an authentication flow test.

### Storefront release proxy configuration review (2026-10-27)

- Rechecked the Nginx examples against the deployment guide: the Storefront routes `/robots.txt` and `/sitemap.xml` to Laravel, serves fingerprinted build assets and public media with the documented cache policies, falls back to the SPA for client routes, and includes the security-header/CSP snippet in cache locations. No repository-level mismatch was found.
- Real hostnames, TLS paths, PHP-FPM path/service, API origin, CORS origins, and production smoke/UAT remain environment-specific and cannot be verified from this local workspace.

### Temporary browser review after startup authorization (2026-10-27)

- Temporarily started the Laravel API and Admin/Storefront Vite servers for a read-only UI review. Storefront home, catalog (19 products), one product detail, and empty-cart checkout rendered their route-specific content. No form was submitted and no cart/order/customer data was changed.
- Admin opened to the sign-in page; no authenticated Admin session was available, so internal order queue/detail screens were not browser-reviewed. API health URL `/api/v1/health` is not defined and returned 404; the API server itself started normally.
- Product cards/details explicitly show “Chưa có ảnh thật”; the site displays neutral artwork rather than fabricated clothing. Real product photos remain a content dependency, consistent with the owner's instruction not to use fake apparel. This review does not replace responsive, authenticated, checkout, or screen-reader acceptance.

### Checkout/Admin order implementation traceability (2026-10-27)

- Confirmed the Admin order queue, detail, and status task is implemented across `api/app/Modules/Orders/Routes/api.php`, `api/app/Http/Controllers/Api/V1/Admin/OrderController.php`, `admin/src/App.tsx`, and the `admin/src/features/orders/` components. Matching OpenAPI operations and generated Admin types are present; checkout/order business-flow documentation covers the workflow. Marked the two stale traceability tasks complete in `specs/04-checkout-order/tasks.md`.
- This source/contract audit does not constitute authenticated Admin browser acceptance; the temporary browser session was logged out and no Admin credentials were used.

### Catalog implementation traceability and data re-audit (2026-10-27)

- Re-ran `npm run audit:demo-data`: storefront/Admin coverage checks all pass. Storefront has 19 active products with active variants and thumbnail/gallery records, 3 banners (1 video), 7 categories, 2 product-bearing collections, 6 required published pages, 34 provinces and 3,321 wards. Admin audit covers all 9 roles/26 permissions, inventory for all 108 active variants, four orders with payment/history records, and no failed checks.
- The media audit finds no missing files/alt text or invalid dimensions/formats. It also confirms 0 owner-provided apparel photo pairs, with products continuing to use the explicitly labeled neutral placeholder. Do not replace these with generated clothing imagery.
- Cross-checked public filtering/detail routes and Admin product CRUD/image/variant routes against Laravel controllers, permission middleware, OpenAPI, and generated API types; Storefront catalog/detail routes were also rendered in the prior read-only browser review. Reconciled the stale Catalog implementation/contract/type/UI task checkboxes in `specs/02-catalog/tasks.md`. The acceptance criteria remain unverified for auth-protected CRUD, exhaustive filter combinations, and responsive/device behavior.

### Storefront mini-cart drawer and shared cart controls (2026-10-27)

- Added a keyboard-operable header bag button and a native modal side drawer backed by the existing TanStack Query cart snapshot and add/update/remove callbacks. It shows loading, recoverable error/retry, expired-cart, empty, stocked-line, and unavailable-stock states; subtotal is labeled as an estimate, and checkout is disabled until cart sync and availability are current. The drawer links to full cart editing and checkout without changing cart ownership or bypassing server pricing.
- Extracted the cart row and quantity editor into a shared `CartLineItem` used by both the drawer and `/cart`; moved shared cart types out of the page module. OpenAPI, endpoints, generated API types, and cart-merge flow were already present, so no contract change was needed. Updated the cart spec/tasks, shared component patterns, and requirement traceability.
- Read-only browser review against the local API confirmed the empty drawer opens from the header, Escape closes it and restores focus, and its “Khám phá sản phẩm” link closes the drawer and opens the API-backed 19-product catalog. No cart mutation, account login, checkout, or order submission occurred. Vite transformed the updated Storefront with no compile overlay; its existing hydration-fallback console warning remains. No tests or build checks were run.
- Follow-up manual browser review (temporary isolated origin http://localhost:5175): selected an in-stock variant for Áo sơ mi linen dáng rộng, added it to the guest cart, opened the header drawer and confirmed the selected color/size, quantity, and subtotal, then removed the line and confirmed the drawer/header returned to empty. Browser console reported no errors. No login, checkout, or order submission occurred; the isolated guest cart was left empty. Temporary API and Storefront listeners were stopped afterward. No tests/build checks were run.

### Storefront homepage and cart drawer runtime review (2026-10-27)

- Started the API and Storefront temporarily for browser review. The first isolated port (127.0.0.1:5176) was rejected by the configured API CORS allowlist; switched to the supported http://localhost:5175 origin rather than broadening CORS. The home page then loaded campaign, category, collection, product, video, and published-page content from the API.
- Opened the empty mini-cart drawer, confirmed its accessible heading and browse-products action, and closed it with Escape; focus returned to the header cart button. At the available 630 px browser viewport, scrollWidth matched clientWidth (no horizontal overflow). A 390 px viewport was not emulated in this review. Browser console had no errors; the existing React Router hydration-fallback warning remains.
- Closed the temporary browser tab and stopped both local servers. No forms, account actions, or order submissions occurred; no tests/build checks were run.

### Admin login password control fix (2026-10-27)

- Manual browser review of the public Admin login found two overlapping password visibility buttons: the page supplied a custom toggle while the shared FormField also auto-generated one. Added an explicit showPasswordToggle option to FormField and disabled its automatic toggle for this login field, preserving the existing page-owned visibility state.
- Vite hot reload completed. Read-only DOM inspection confirmed one login toggle and zero shared duplicate toggles; the password input remained masked. Browser console had no errors. No login was submitted and no automated checks were run.
- Closed the temporary Admin tab and stopped Admin/API servers; ports 5174 and 8000 are no longer listening.

### Local Admin and Storefront CORS origin verification (2026-10-27)

- Temporarily started the API and sent read-only requests with the exact local app origins. API responses allow credentials and return the matching Access-Control-Allow-Origin for http://localhost:5174, http://localhost:5175, http://127.0.0.1:5174, and http://127.0.0.1:5175. This confirms the supported local Admin/Storefront ports; the earlier 5176 test origin is intentionally not allowed.
- Stopped the API after the check; port 8000 is no longer listening. No user data or API mutation was sent.

### Historical audience-session login error triage (2026-10-27)

- Traced the reported API session-audience exception to IssueAccessTokenAction.issueForSession, reached during admin login and refresh in log entries dated 2026-10-25. The current token issuer file was modified later that night and explicitly marks newly issued Sanctum rows as token_type=session before issuing the audience-bound JWT; no matching log entry appears after 2026-10-25 23:05.
- This historical evidence plus the separately verified CORS responses does not prove a current successful login. No credentials were read or submitted, so authenticated acceptance remains unverified.


### Storefront initial lazy-route fallback (2026-10-27)

- Added an accessible RouterProvider HydrateFallback to every lazy Storefront route, using the existing loading treatment so direct navigation has immediate feedback during route-module loading.
- Temporarily opened the API and Storefront on the configured local origin. The fallback appeared before the API-backed home content; the campaign, catalog sections, products, video, and published page links then rendered. Browser console had no warnings or errors after the change.
- Closed the temporary tab and stopped both servers. No tests/build checks were run.

### Current Storefront/Admin API and media audit (2026-10-27)

- Re-ran the read-only demo-data audit against the current local database. Storefront coverage: 7 categories, 19 active products with variants/gallery and color/size filters, 3 banners including one video, 2 product-bearing collections, 6 required published pages, 34 provinces and 3,321 wards, plus checkout/order/newsletter fixtures; failed checks: 0.
- Admin coverage: all 9 roles and 26 permissions, all 108 active variants with inventory, four seeded orders with items/payments/history, and the required operational demo fixtures; failed checks: 0.
- Media audit: all required references and local files resolve; no missing alt text, invalid media size/format/dimensions, or generated apparel photos. Owner-provided product photos: 0, so active products continue to use the explicitly labeled neutral placeholder. The audit made no writes.

### Admin product image upload rollback cleanup (2026-10-27)

- Made product image uploads delete the newly stored public-disk file if the database transaction fails. This prevents orphaned image files when the product disappears or image metadata/primary-image persistence fails; successful uploads and all existing product image URLs remain unchanged.
- Kept product imagery limited to store-supplied photos. No generated clothing imagery or substitute product photos were added. No tests or database writes were run.

### Admin Vietnamese text encoding and narrow-screen fix (2026-10-27)

- Restored UTF-8 Vietnamese text accidentally decoded as Windows-1252 in `admin/src/App.tsx` and `admin/src/features/support/SupportTicketsPage.tsx`; a source scan found no remaining reversible mojibake sequences in Admin TypeScript, CSS, or HTML sources.
- Reduced the Admin document minimum width from 360px to 320px. Manual browser review confirmed the login screen text renders correctly and the document has no horizontal overflow at 320px; the 390px login view also fits. No credentials were submitted.
- Manually reviewed the API-backed Storefront home, catalog, product detail, cart, and checkout at 320px and 390px; each had no horizontal document overflow. The video file and banner/media records pass the read-only demo-media audit; the deferred video uses `preload=none` and has no browser decode error before playback.
- Re-ran the read-only API/media audit: Storefront, Admin, and media audits each reported zero failed checks; all 19 active products still use the explicitly labeled neutral placeholder, with zero generated apparel references and zero owner-provided product-photo pairs.

### Storefront release SEO snapshot verification (2026-10-27)

- Regenerated both Admin and Storefront OpenAPI declarations from `api/openapi.yaml`; SHA-256 hashes matched before and after, proving the generated types are current.
- With the local public API and explicit local build origins, `npm run build:seo` generated 36 route snapshots. Spot checks of home, product, category, collection, and shipping-page HTML found route metadata, canonical links, and JSON-LD; the product snapshot retains the `Chưa có ảnh thật` disclosure.
- The first build attempt correctly rejected missing prerender environment variables; the release guide documents the required API and Storefront origins. The API process was stopped after the build. No forms, authentication, cart mutations, or orders were submitted.

### Admin settings operational API traceability (2026-10-27)

- Audited the two stale open tasks in `specs/20-admin-settings-preferences/tasks.md`. Admin health/failed-job pages call the permission-gated health APIs; backup controls call the permission-gated backup list/create/download APIs; export and import flows are backed by the existing export-job and versioned account-preference endpoints. Matching Laravel routes and OpenAPI operations are present.
- Confirmed public registration/maintenance/branding settings are read directly from the settings table; they are not stored in a separate public-settings cache. The sitemap cache is limited to public route/content data, so cache invalidation on settings writes is not currently applicable. Updated task traceability and left future invalidation conditional on introducing an independent public-settings cache.
- This was a source/contract audit only; no backup was queued, export/import was triggered, and no privileged UI operation was submitted.

### Backend CI static checks repair (2026-10-27)

- `composer validate --strict` exposed an unbounded `laravel-notification-channels/webpush` constraint. Constrained it to the locked compatible major (`^13.0`) and refreshed `composer.lock` metadata without changing package versions.
- The CI PHP formatting check found formatting drift in `DeleteAccountRequest.php`, `UploadAccountAvatarRequest.php`, `bootstrap/providers.php`, and `config/backup.php`; formatted those four files with Pint.
- Re-ran `composer validate --strict` and `vendor/bin/pint --test --format agent`; both pass. No test suite was run.

### SQL snapshot and migrated database alignment review (2026-10-27)

- Read-only `php artisan migrate:status` shows every migration is applied. The repository has 60 migration files and `fashion_store_schema.sql` records all 60 migration rows, including the latest `idempotency_scope` migration and column.
- The SQL file contains 81 `CREATE TABLE` statements, matching `docs/architecture/data-model.md`; its 60 `INSERT` statements are only the Laravel migration-history rows. This remains a schema snapshot, not a backup of seeded catalog, order, account, or media data. Demo records stay reproducible through the seeders and are checked separately by `npm run audit:demo-data`.
- No SQL regeneration was needed; the live schema and snapshot version markers agree, and no database rows were changed.

### Audience binding at access-token issuance (2026-10-27)

- Tightened `IssueAccessTokenAction::issueForSession` to require the backing Sanctum session's `audience:<audience>` ability before minting a JWT. A caller can no longer create an Admin-audience JWT from a Storefront session or vice versa; route middleware remains the second enforcement layer.
- Audited the login, 2FA/passkey, refresh, impersonation, role/permission seeding, and protected route paths. Login creates audience-scoped session abilities, and `RequireAudience` plus `RequirePermission` guard the API. Reconciled the completed role/permission seeding task in the auth spec.
- Pint and `php -l` pass for the changed action. No login credentials were submitted and no authentication tests were run.

### Frontend API transport audit (2026-10-27)

- Searched the Admin and Storefront feature sources for direct `fetch`/Axios calls. Storefront feature requests flow through the shared Axios client and typed API wrappers; Admin requests flow through `adminApiFetch`, including asynchronous export downloads. No page-level request path bypassing those clients was found.

### Campaign video decode check (2026-10-27)

- Validated the seeded campaign MP4 with `ffprobe`: H.264, 1280×720, 5 seconds, 35,489 bytes. Decoded the entire file with FFmpeg without errors. The media audit had already confirmed the API banner reference, file size/format, and alt text.
- This verifies the demo video asset itself; it does not replace real-device playback/UAT or approval of final campaign content.

### Storefront public-route mobile review (2026-10-27)

- Under the owner's temporary-startup authorization, manually opened Storefront login, invite-only registration, password recovery, guest order tracking, the published shipping/privacy/terms/contact/about/size-guide pages, and a not-found route at a 320px viewport. Every route rendered its expected content and had `documentElement.scrollWidth <= clientWidth`; the browser console had no errors. No credentials were entered and no forms were submitted.
- The terms, contact, about, and size-guide pages explicitly disclose that final store-approved content is still needed. Kept that content unchanged; these remain owner-content release gates.
- Closed the temporary browser tab, stopped the API and Storefront servers, and restored the browser's default viewport.


### Storefront route fallback lint correction (2026-10-27)

- Moved StorefrontRouteLoading into its own module so the router module exports only the router and Vite Fast Refresh no longer reports a component-export lint violation.
- Storefront ESLint and TypeScript/Vite production build pass. Admin ESLint and production build also pass; Admin build reports an existing >500 kB main chunk advisory. The read-only demo-data/media audit passes with zero failed coverage checks and no fabricated apparel photos. No test suite or authenticated purchase flow was run.

### Storefront campaign video browser check (2026-10-27)

- Started the API and Storefront temporarily under the owner's authorization; both served locally and the API returned HTTP 200.
- The initial window-state invocation used the wrong argument shape and did not capture the video; reopened the local Storefront in Chrome and used the correct window API. The native video controls changed to `pause`, the timeline advanced to 5/5 seconds, and playback completed.
- Browser playback and the separate FFmpeg decode both pass. This confirms local browser playback, not final campaign-content approval or device/production UAT.
- Stopped both temporary server processes after the check. No test suite or user data flow was run.

### Storefront Vietnamese heading wrap (2026-10-27)

- Browser review of the home hero showed Vietnamese headline text breaking within words at desktop width. Updated the hero heading to wrap at normal word boundaries and use width-responsive sizing; removed negative tracking from the hero, campaign, lookbook, section, and newsletter display headings so Vietnamese marks have room.
- Reopened the live Storefront and visually confirmed the hero headline now wraps between words at the desktop viewport. Mobile visual review and full browser compatibility remain release checks; no test suite was run.
- Storefront ESLint and TypeScript/Vite production build pass after the CSS change; the production CSS bundle contains the updated word-wrap rules.

### Latest API demo data and media audit (2026-10-27)

- Re-ran `npm run audit:demo-data` against the current configured database and local media directory. All three read-only audits pass with zero failed coverage checks: 19/19 active products have variants and thumbnail/gallery records; all 9 API roles and 26 permissions are seeded; 108/108 active variants have inventory; all required media records, local files, dimensions, formats, and alt text are valid.
- The storefront still has 0 owner-provided product photos and uses the approved neutral placeholder for product media; generated product-photo references are 0. Customer review image fixtures are also 0. Genuine product photography and store-approved production content remain release inputs.

### Storefront responsive home breakpoint review (2026-10-27)

- Temporarily reviewed the home page in Chrome at 175% browser zoom, which activates the 620px responsive breakpoint in the 1038px-wide window (about 593 CSS px). The mobile category layout appeared in two columns; the home hero, shipping strip, search, appearance, account, and bag controls were visible. The accessibility tree included the expected heading and links.
- This was a visual breakpoint spot-check, not a precise-device-width overflow measurement. The separate 320px route review remains the narrow-screen evidence. Restored browser zoom and stopped the temporary API and Storefront processes afterward.


### Release build and demo-media recheck (2026-10-27)

- Re-ran Admin and Storefront lint and production builds. Both lint commands and both builds completed successfully. Storefront generated production chunks with the largest JavaScript chunk at 365.90 kB; Admin emitted its known 532.90 kB main-chunk advisory, while the rich-text editor is a separate lazy chunk.
- Re-ran the read-only API/demo-media audit. Storefront and Admin fixture coverage each reported 0 failed checks. All required media references/files and alts are valid; 19/19 products remain on the explicit neutral no-real-photo placeholder, with 0 owner-provided product photo pairs and 0 generated apparel references.
- No test suite, login, purchase, or database mutation was run. Store-approved product photography, final policy/brand copy, production Nginx/runtime/monitoring, and UAT remain release gates.

### Root local development startup verification (2026-10-27)

- Ran `npm run dev` from the repository root under the owner's temporary-startup authorization. Confirmed API `/up`, Admin `/`, and Storefront `/` all returned HTTP 200 on their configured local ports (8000, 5174, and 5173).
- Stopped the root concurrently process after the check and verified no API/Admin/Storefront listener remained on those ports. No user credentials or write operations were used.

### Demo variant SKU normalization fix (2026-10-27)

- A read-only public catalog API check found demo SKUs with Vietnamese diacritics and inconsistent casing (for example, color suffixes produced by PHP strtoupper() on UTF-8). Updated CatalogSeeder to transliterate color/size components to ASCII and to find existing seeded variants by product + color value + size value before updating the SKU, preserving variant IDs and inventory links on reseed.
- Re-ran the catalog seeder twice; both runs completed, and the existing 108 active variants remained intact. The read-only API returned HTTP 200 with all 19 products and 108 variants; zero active SKUs contained non-ASCII characters. Added that invariant to the demo-data audit.
- Re-ran `npm run audit:demo-data`: Storefront, Admin, and media checks all reported zero failures. Pint and PHP syntax checks passed. No test suite, user order, login, or media upload was performed.

### Catalog seeder non-destructive rerun refinement (2026-10-27)

- Refined the SKU repair so an existing product/color/size variant only receives its normalized SKU. Demo price, comparison price, active state, and linked inventory are initialized only for a newly created variant; rerunning the catalog seeder will not reset staff-edited variant values.
- Pint and PHP syntax checks pass. Re-ran CatalogSeeder and the full read-only demo-data/media audit: 108 active variants still have inventory, zero active SKUs contain non-ASCII characters, and Storefront/Admin/media audits report zero failed checks.

### Product SEO metadata fallback review (2026-10-27)

- Read-only review confirmed nullable product meta_description is handled by the Storefront SEO hook: product pages fall back to short_description for the document description and Product JSON-LD. Seeded products therefore retain useful page metadata even when the optional SEO field is blank; no database change was needed.

### Storefront public API HTTP smoke review (2026-10-27)

- Temporarily started the Laravel API and issued read-only GET requests to banners, collections, categories, catalog filter options, products, provinces, Hanoi wards, shipping fee, the published shipping page, and registration status. All ten endpoints returned HTTP 200 with populated response data (including 19 products, 2 collections, 34 provinces, and 126 Hanoi wards).
- Stopped the API after the review. No credentials, forms, orders, or other write operations were used.

### Static Storefront illustration coverage (2026-10-27)

- Extended the read-only media audit to verify that all 11 required Storefront SVG illustrations exist as readable SVG files and are referenced by TypeScript/TSX/CSS source. The audit reports 11 present and 0 missing or unreferenced.
- Pint, PHP syntax validation, and the full `npm run audit:demo-data` pass; Storefront, Admin, demo-media, and static-illustration audits report zero failed checks.

### Browser review, Admin auth typography, and product photo preview (2026-10-27)

- Under the owner's temporary startup authorization, `npm run dev` opened Storefront and Admin. Browser review confirmed Storefront home and catalog (19 products), product detail, empty cart, and empty-checkout states rendered; no account credentials, orders, or writes were used. Admin login rendered and was not submitted.
- Fixed the Admin sign-in hero heading: its large serif face and tight tracking made Vietnamese diacritics visually hard to read. Switched that heading to the project DM Sans/Arial sans-serif stack with normal letter spacing. Reopened the login page and visually confirmed the full Vietnamese headline is legible. Admin lint and production build passed; the existing 532.90 kB main-chunk advisory remains.
- Generated and copied `docs/ui-ux/mockups/product-photo-review/ai-generated-flatlay-short-trench-preview.png`: a photorealistic, no-model flat-lay trench-coat image. It is an AI-generated preview, not a photo of the store's actual item; it is not connected to product records and must not be presented as genuine product photography.
- Stopped the temporary root dev process and verified no listeners remain on ports 8000, 5173, 5174, or 5175. No test suite was run.

### Storefront media and API demo-data audit refresh (2026-10-27)

- Re-ran npm run audit:demo-data against the current local database and media. Storefront, Admin, and media audits all report 0 failed coverage checks. All 19 active products have variants, thumbnail/gallery references, generated photo references, and the Ảnh AI demo disclosure; 0 products have owner-provided product-photo pairs.
- The audit also confirmed 3 active banners including 1 video, 7 categories, 2 collections with products, 6 published pages, all 11 required referenced UI illustrations, no missing media files, no invalid image dimensions/formats, and no missing image alt text.
- This confirms the generated flat-lay images are integrated for demo/UAT. They are not evidence of actual store stock or product appearance; owner-provided photos remain required for production merchandising. No test suite or credentialed flow was run.

### Local runtime and API-origin surface audit (2026-10-27)

- Started the root npm run dev process under the previously granted temporary-start approval. HTTP checks returned 200 for Laravel /up, Admin /, and Storefront / on ports 8000, 5174, and 5173. Stopped the process after the check and verified ports 8000, 5173, 5174, and 5175 are free.
- Static source scan found no raw fetch() calls or hardcoded localhost/127.0.0.1 API URLs in Admin or Storefront source. API origin configuration is centralized in each app API-base helper; the Storefront Axios client uses its helper.
- Reviewed the checked-in Nginx examples for Admin, Storefront, API, media, HTTPS redirects, CSP headers, and sitemap/robots forwarding. They are example templates and cannot verify the owner production host or its DNS/TLS/upstream values.
- The Windows computer-use helper stopped the browser review because it could not determine Chrome’s current URL with enough confidence. No UI action was taken. Route-by-route browser review remains open.

### Storefront route review and demo catalog cleanup (2026-10-27)

- Used a separate in-app browser tab to inspect the Storefront home, catalog, product detail, category, seasonal collection, empty cart, empty checkout, account guard/login redirect, guest order lookup, and published shipping/returns page. Admin reached its login screen. The reviewed routes loaded API content with product-image disclosure, filter controls, policy copy, and empty-state actions; no credentials, form submissions, or orders were entered.
- Found the legacy blazer duplicate exposed publicly as “(copy)” even though Admin duplicate-product behavior creates copies as drafts. Read-only inspection confirmed it had no order-item references. Changed only the local demo database record for slug `ao-khoac-blazer-copy` from active to draft; retained the Admin record, variants, and media.
- Public API now returns 18 active products and 404 for the draft product detail; a fresh catalog page shows 18 products and no “(copy)” item. The related-products panel also no longer includes that copy.
- Re-ran `npm run audit:demo-data` after the local data update: Storefront, Admin, and media coverage each report 0 failed checks. Counts now reflect 18 active products / 104 active variants; 19 product-media records include the retained draft copy.
- Stopped the temporary root dev process and verified ports 8000, 5173, 5174, and 5175 are free. This was an accessibility-tree route review only; visual responsive review, screen-reader testing, authenticated Admin pages, and purchase-flow UAT remain open.

### Nineteenth distinct Storefront demo product photo (2026-10-27)

- Generated a photorealistic AI flat-lay of a cropped indigo denim jacket with no wearer, mannequin, or illustration. Converted it to 360×450, 640×800, and 800×1000 WebP files under `api/public/demo-media/products/`; added the source filename to the repeatable product-photo preparation script.
- Added `Áo khoác denim ngắn` as a separate catalog seed item with four active size variants, inventory, demo material/care copy, new-arrival tagging, and its own image gallery record. The legacy blazer copy stays draft; the catalog now has 19 active, uniquely photographed products.
- Added the new photo to the local media review board. Re-ran the Storefront/Admin/media audit: all three report 0 failed coverage checks, with 19 active products and photos, 108 active variants with inventory, 20 total product-media records including the retained draft copy, and no missing files, alt text, or invalid image dimensions/formats/sizes. Pint passed on the changed PHP seeders. No test suite was run.
- The new image is AI demo content and remains disclosed in the API-derived alt text. Store-provided product photos are still required before production merchandising.

### Public CMS and authentication-route review (2026-10-27)

- With a temporary root dev run, reviewed the published about, contact, privacy, shipping/returns, terms, and size-guide pages; registration-disabled state; login redirect; password recovery form and confirmation state; and Storefront 404 page in separate in-app browser tabs. Each loaded its expected API-backed content and navigation without a visible error.
- Found owner-content gates, not code failures: contact details are still described as configurable, the terms page labels itself a template, the size guide labels measurements as demo values, and the about page identifies its copy as sample content. Registration is closed by the current store configuration. No personal data, credentials, recovery emails, or orders were submitted.
- Stopped the temporary dev process and verified ports 8000, 5173, 5174, and 5175 are free. The route check used accessibility trees; it does not close the visual responsive, screen-reader, account-authenticated, or purchase-flow reviews.

### Storefront route and data recheck (2026-10-27)

- Rechecked the public CMS set (about, contact, privacy, shipping/returns, terms, size guide), registration-disabled state, login, recovery form/confirmation, account login redirect, guest order lookup, cart/empty checkout, catalog/category/collection, one product detail, and 404 in the in-app browser. All sampled routes reached their expected page and API-backed content without a visible loading/error state.
- Re-ran `npm run audit:demo-data`: Storefront, Admin, and media checks each report 0 failures. Coverage remains 19 active products and 19 disclosed AI photo references; 108 active variants have inventory; media audit finds 20 product image records including the retained draft clone, with no missing files, alt text, or invalid dimensions/formats.
- Owner content is still a release gate: about/contact copy is sample/configuration-oriented, terms explicitly say template, and size measurements are demo data. Registration is currently disabled by store configuration. No forms, email recovery, authentication, or orders were submitted; no test suite ran. Dev processes are stopped and ports 8000 and 5173–5175 are free.


### Refined photorealistic garment photo (2026-10-27)

- Created a photorealistic flat-lay image for `Áo gile linen`: a beige linen vest on a studio surface, with no wearer, mannequin, illustration, text, or brand mark. Saved new 360/640/full-size WebP siblings (`ao-gile-linen-v2-*`) without overwriting the earlier demo asset.
- Updated the Storefront demo seeder to select the new version for this product and refreshed the approved Storefront mockup image references. The API continues to label this as AI demo media; it does not establish that the pictured garment is the actual item held by the store.
- Applied `StorefrontDemoSeeder` to the local demo database and re-ran `npm run audit:demo-data`; Storefront, Admin, and media audit groups each report 0 failed checks. No test suite was run.
- Started the root dev stack under the owner's prior temporary-start authorization, opened `/products/ao-gile-linen`, and confirmed the page renders the disclosed product image. A direct `GET /api/v1/products/ao-gile-linen` returned HTTP 200 and the new v2 image URL plus 360/640/full-size srcset. Stopped the stack and verified ports 8000 and 5173–5175 are free.
- Reprocessed only the new image through the repository's FFmpeg WebP pipeline so its outputs follow the documented portrait 360×450 / 640×800 / 800×1000 sizes. Added a `--only` option to avoid regenerating unrelated product images, updated the media review board and source manifest, and reran `npm run audit:demo-data`; all API/media checks still report 0 failures.
- After conversion, restarted only Laravel for a read-only API check: `GET /api/v1/products/ao-gile-linen` returned HTTP 200, the srcset advertises 360w/640w/800w, and the 800w file is served successfully (79,648 bytes). Stopped Laravel and confirmed port 8000 is free.

### UAT visual review attempt (2026-10-27)

- Started the root dev stack under the prior temporary-start authorization to continue desktop/mobile visual review. The Windows browser automation returned stale, conflicting Chrome window IDs on two refreshed selections (`get_window` could not find the IDs returned by `list_apps` / `list_windows`), so no browser interaction was performed. Stopped the dev stack and confirmed ports 8000, 5173, 5174, and 5175 are free. Visual UAT remains open; no forms or orders were submitted.

### Storefront/Admin release checks (2026-10-27)

- `npm run lint` and `npm run build` pass in both `admin/` and `storefront/`. Admin build still reports a 533.09 kB main JavaScript chunk warning (156.11 kB gzip); Storefront build reports a 365.90 kB main JavaScript chunk (113.71 kB gzip). No test suite was run.
- Static security review confirmed CMS HTML is sanitized in both Admin preview and Storefront render, Admin auth uses memory/cookie boundaries rather than persisting bearer tokens in browser storage, and public API routes use a configurable rate limiter. A production deployment still needs the actual domain/API origin, SMTP, TLS, and observability values.
- Regenerated both frontend API type declarations from `api/openapi.yaml` with `npm run api:types`, then rebuilt Admin and Storefront successfully. The Admin build retains the same >500 kB main-chunk warning; no test suite was run.

### OpenAPI route coverage and generated types (2026-10-27)

- Corrected the OpenAPI YAML so it parses with a standard YAML parser, documented the public OAuth login-start endpoint, and aligned static Admin operations/export/product-duplicate paths with Laravel's actual routes.
- Compared Laravel's route list with OpenAPI operations: 385/385 method-path pairs match, with no undocumented Laravel routes or phantom OpenAPI operations.
- Regenerated `admin/src/types/api.d.ts` and `storefront/src/types/api.d.ts` from `api/openapi.yaml`. Admin and Storefront production builds completed successfully; the Admin build retains its 533.09 kB main-chunk advisory.
- Re-ran `npm run audit:demo-data`; Storefront API, Admin API, and media coverage each report 0 failed checks. The 19 product images remain explicitly disclosed as AI demo photos, with no wearer or illustration; they are not verified photos of store inventory.
- No test suite was run. Browser UAT and owner-provided product photography remain open release gates.

### Mobile Storefront and Admin entry visual review (2026-10-27)

- Inspected the local media review board in Chromium: the product set contains distinct photorealistic AI flat-lay garments/accessories without a wearer or illustration; the public AI-demo disclosure is present. Banner and category-cover graphics remain labeled as illustrations and do not claim to show products.
- After allowing the public API rate-limit window to reset, reviewed the Storefront home, catalog, `Áo gile linen` detail, and empty cart at 360 CSS px. All returned HTTP 200, the expected images loaded (19/19 on home, 18 on catalog, 7 on detail, 2 in the empty cart), and none of the reviewed pages overflowed horizontally or had broken images.
- Reviewed the Admin entry page at 1440 CSS px: login screen rendered with no horizontal overflow or broken images. No login, form submission, cart mutation, or order creation was performed.
- A first rapid series of hard navigations exceeded the configured 60-request/minute public API limiter and returned temporary 429s; the later review after the limiter window reset had no 429s. Unauthenticated `POST /auth/refresh` returned 401 as expected.
- The Windows Chrome automation exposed inconsistent window identifiers again, so the visual review used the locally installed headless Chromium driver instead. Closed the browser, stopped the temporarily started app stack, and verified ports 8000 and 5173–5175 have no listeners. No test suite was run.

### Queue and scheduler deployment examples (2026-10-27)

- Added `deploy/supervisor/fashion-store-queue.conf.example` for a single restartable Laravel worker with bounded job runtime/shutdown and rotating Supervisor logs, plus `deploy/cron/fashion-store-scheduler.example` to run Laravel's scheduler once per minute and forward output to syslog.
- Documented deployment-specific values, the separate-container alternative, and the Admin System Health checks to perform after deployment in `docs/architecture/deployment.md`.
- Confirmed the installed Laravel CLI exposes the configured `queue:work` flags and `schedule:run --no-interaction`. The local workstation has no Nginx/Supervisor commands, so host-level parser validation and production startup remain unverified. No test suite ran and no production secrets or host settings were changed.

### A1 brand identity proposals (2026-10-27)

- Added `docs/ui-ux/mockups/brand-directions-review.html` with three responsive vector proposals for `NÉT Studio`: editorial burgundy, modern studio/olive, and textile-mark/clay. The board keeps the existing name/tagline, shows light and dark logo treatments and palette swatches, and states that none of the proposals has been applied to the storefront.
- Previewed the board in Chromium at 1440 and 360 CSS px: all three proposals render, have accessible SVG labels, and do not overflow horizontally. Opened the artifact in Codex for review; owner selection is pending before changing the production logo, favicon, or brand tokens.
- Checked the current logo and OG SVG source as UTF-8: Vietnamese text is correctly encoded; earlier mojibake was only PowerShell terminal display. No asset changes were made on that false alarm.

### Strict OpenAPI YAML parse and type refresh (2026-10-27)

- Fixed YAML indentation and inline-description quoting defects in `api/openapi.yaml` that made a strict Symfony YAML parser reject the contract. The fixes preserve endpoint schemas and behavior.
- Symfony YAML now parses the contract successfully and reports 294 paths. Regenerated Admin and Storefront TypeScript declarations with `npm run api:types`.
- No test suite was run; no API implementation or database behavior changed.

### Product media direction confirmed (2026-10-27)

- The owner asked for realistic clothing photos without a wearer or illustration. Existing demo assets already follow that direction; visually checked the linen shirt photo. Keep the visible “Ảnh AI demo” disclosure because these generated images are not verified photos of actual store inventory.
- Updated the README media policy to allow the photorealistic garment-only images for the local demo while requiring verified store photos before presenting them as actual inventory.

### Storefront garment mockup parity and media audit (2026-10-27)

- Replaced legacy neutral placeholders in `docs/ui-ux/mockups/storefront-review.html` with the existing photorealistic AI flat-lay product assets for the catalog, detail, cart, and checkout views. Updated Vietnamese copy to say that the garments have no wearer/illustration and are not verified store inventory; visible image labels and alt text disclose AI demo status.
- Verified all 10 local demo-media references in the mockup resolve. Reviewed the shirt detail at 1440px and 390px: no broken images and no horizontal overflow. This is a visual mockup review, not an E2E or test-suite run.
- Re-ran `npm run audit:demo-data`: Storefront, Admin, and media coverage each reported 0 failures; 19 active products have disclosed demo photos, 3 active banners include one video, all required pages/locations/inventory/roles/permissions are present, and local media dimensions/formats/alt text pass.
- Temporarily started only API, Admin, and Storefront for the review, then stopped all three; ports 8000 and 5173–5175 have no listeners. No test suite or user write flow was run.

### Storefront mockup AI disclosure and plan-summary consistency (2026-10-27)

- Added the same visible `ẢNH AI DEMO` badge used by the live product-detail feature to the mockup detail gallery; retained accessible alt text identifying the garment-only demo photo as unverified inventory.
- Re-rendered the detail mockup in Chromium at 1440px and 390px. Both layouts stay within the viewport, all four gallery images load, and the disclosure badge is visible.
- Updated the current progress summary and A3 acceptance row to reflect the owner's garment-only AI demo direction; removed the obsolete pending media-policy conflict from the current-status summary. Production still requires store-confirmed item photography.

### Catalog page-level heading and accessible route review (2026-10-27)

- Browser accessibility-tree review found that resolved catalog pages rendered their main title as `h2`, leaving no page-level `h1`. Updated `CatalogPage` to render the API-backed all-products/category/collection title as a visible `h1`, with desktop/mobile typography and selected appearance-theme styles preserved.
- Updated `docs/ui-ux/page-specs/catalog.md` to require one visible page title heading and align product-photo disclosure with the owner-approved AI demo/UAT policy.
- Ran Storefront ESLint and production build successfully. In Chromium, verified `/products` at 1440px, `/categories/ao` at 390px, and `/collections/thu-dong-2026` at 390px: each accessibility tree exposes exactly one page-level heading with the expected title; document width matches the viewport. No API 429s or JavaScript exceptions occurred.
- Stopped the temporary API and Storefront servers; ports 8000 and 5173–5175 are free. No test suite ran and no form/order data was submitted.

### Storefront P0 accessibility-tree route pass (2026-10-27)

- With API and Storefront running temporarily, inspected Chromium accessibility trees after route data finished loading for `/`, `/products`, `/products/ao-so-mi-linen`, `/cart`, `/checkout`, `/track-order`, `/pages/shipping`, `/login`, and `/forgot-password` at 390px.
- All nine routes exposed a named page-level `h1`; no visible interactive control had an empty accessible name. All pages stayed within the viewport, with no JavaScript exceptions or API 429/5xx responses. The expected guest `POST /auth/refresh` 401 is not reported as an app error.
- This tree inspection is a limited manual accessibility review, not a screen-reader certification or test-suite run. Stopped both temporary processes and verified ports 8000 and 5173–5175 are free.

### Admin sign-in public-route review (2026-10-27)

- Temporarily ran the API and Admin and reviewed the sign-in page at 1440px and 390px. After waiting for session recovery to finish, the page shows the expected login form and one `h1`; both viewports fit without horizontal overflow or broken images, and there are no JavaScript errors.
- The unauthenticated `POST /api/v1/admin/auth/refresh` returned the expected 401. No credentials were entered; protected Admin workflows remain unreviewed in the browser.
- Stopped the API and Admin processes; ports 8000 and 5173–5175 are free. No test suite ran.

### README demo-photo status reconciliation (2026-10-27)

- Replaced the outdated Current implementation summary that said all product photos remained pending. The README now reflects the 19 disclosed AI demo photos for UAT and preserves the owner-confirmed product-photo requirement before production merchandising.
- Searched the active README, plan, and catalog UI spec for the conflicting blanket prohibition/pending wording; current summaries now agree with the seeded media policy. Historical progress entries remain as dated records.

### Production build and SEO prerender verification (2026-10-27)

- Admin npm run build completed successfully; Vite reported the existing entry chunk at 533.09 kB, above its 500 kB advisory threshold.
- Storefront npm run lint passed. npm run build:seo initially stopped because its required prerender origins were not supplied; reran with the local API origin and the Storefront origin that matches the local Laravel sitemap (http://localhost:5173). It completed and reported 36 public routes prerendered.
- Confirmed 36 generated HTML snapshots. Stopped the temporary API process. No test suite was run.

### Demo-data audit and public-route runtime review (2026-10-27)

- Re-ran npm run audit:demo-data against the current local database. Storefront, Admin, and media coverage each reported zero failed checks; all 19 active products have variants, thumbnails, galleries, and explicit AI-demo photo disclosures; three active banners include one video; all expected published pages and location data are present. No active product/color pair has owner-provided photos, so the AI imagery remains demo-only.
- Temporarily started API and Storefront with the owner-approved local review scope. Visited 15 public routes at 390 CSS px. The routes had no horizontal overflow, broken images, unnamed visible controls, JavaScript page errors, or 429/5xx responses. Waited for API-backed content before assessing the home, product detail, collection, policy, and registration page headings; each showed its expected H1. No login, cart change, or order submission occurred. The local setting currently disables public registration; the Admin setting and API enforce this configuration. Confirm whether the store should enable it during UAT before signup-flow acceptance.
- Stopped both temporary servers. This was a manual browser review, not a test-suite or screen-reader certification.

### Regenerated API clients and rebuilt Admin/Storefront (2026-10-27)

- Regenerated TypeScript API declarations for both clients from api/openapi.yaml.
- Admin and Storefront ESLint passed. Both production TypeScript/Vite builds completed successfully against the generated declarations. Admin retains the 533.09 kB uncompressed entry-chunk advisory; the output reports 156.12 kB gzip. Storefront production bundle entry is 365.90 kB (113.70 kB gzip).
- No test suite was run.

### API client and authentication-storage invariant review (2026-10-27)

- Source review confirms both Admin and Storefront retain access tokens in in-memory application state; the Storefront Axios client uses credentialed refresh-cookie requests. Local/session storage call sites are limited to UI preferences, cart-session identifiers, and password-recovery UI metadata. No access-token storage call was found in Admin or Storefront source.
- This was a code-path review, not a browser security penetration assessment.

### Keyboard navigation review on Storefront purchase routes (2026-10-27)

- The first broad keyboard sweep ran into the configured public API rate limit and returned 429 responses; those observations were discarded. After the limit window reset, reviewed Tab navigation at 390 CSS px on home, catalog, product detail, and login. Sampled focus stops had accessible names and visible focus indicators; the successful pass recorded no page errors or 429/5xx responses.
- No forms, cart changes, login, or orders were submitted. This is a limited keyboard review, not a complete screen-reader or WCAG audit. Stopped the temporary API and Storefront servers.

### Restored the release SEO snapshots after the regular SPA build (2026-10-27)

- The follow-up `npm run build` from the previous verification cleared nested prerender output, leaving one root `index.html`. Confirmed this from the current `storefront/dist` directory.
- Re-ran `npm run build:seo` with the local API and Storefront origins required by the release script. It completed with 36 prerendered public routes; verified 36 HTML snapshots are present. The API process was stopped and app/API/Mailpit listener ports are free.
- Deployment documentation already distinguishes the regular SPA build from the release `build:seo` command; no code change was needed.

### Prerender snapshots include a primary landmark for every public SEO route (2026-10-27)

- A no-JavaScript inspection of the 36 release snapshots found that the homepage snapshot had no `<main>` landmark, even though the live React homepage has one. Updated the prerender generator so the homepage snapshot wraps content in `<main id="primary-content">` and every route rendered through `renderPage` uses the same primary-content target. This also gives the existing skip-link target a consistent ID after the client shell loads.
- Rebuilt with `npm run build:seo`; the script regenerated all 36 public routes. At 390 CSS px with JavaScript disabled and after layout settled, verified all snapshots return 200, have SEO title/description/canonical, exactly one H1 and primary main landmark, named visible controls, image alt attributes, and no horizontal overflow. The 36-route inspection reported zero failures; Storefront ESLint passed.
- Stopped the temporary preview/API processes. This is static snapshot and landmark validation, not full screen-reader certification.

### Consolidated Storefront release UAT checklist (2026-10-27)

- Added `docs/qa/storefront-release-uat-checklist.md` to coordinate disposable-environment checkout/order acceptance, account and return flows, Admin synchronization, media disclosure, keyboard/screen-reader review, production hosting checks, and store-owner approval. It warns against placing test orders or changing settings on production and asks operators to redact credentials and customer data.
- Marked only already evidenced data/build/static-route checks complete; checkout mutations, full screen-reader, deployment-host verification, and final owner sign-off remain explicitly open. Linked the checklist from the active Storefront plan.
- No tests or order mutations were run.

### Checkout province-code validation review (2026-10-27)

- Code review found that shipping-fee lookup and checkout preview accepted arbitrary province strings and returned the global default fee. They now reject codes absent from the current official province catalog; valid provinces without a configured regional rate still use the documented store fallback. Legacy three-level order addresses remain supported as specified by ADR-0013.
- Updated OpenAPI to document validation errors and the catalog requirement. Order-placement validation already prevented new-format invalid province/ward pairs before writes.
- No test suite or order mutation was run. The manual release UAT checklist still has the full transactional checkout/order flow open.
- A concurrent same-key replay path could return the original order from inside the transaction and then enqueue the “new order” notifications again; it also returned HTTP 201. The transaction now records whether it created the order; only newly committed orders send notifications and return 201, while a replay returns 200. Updated checkout flow and acceptance text. This edge case has not been exercised with concurrent database requests; no test suite was run.
- Reconciled the Admin account-menu spec with the owner-confirmed return policy: seven days from `delivered_at`, inclusive of the deadline; missing delivery time and expired requests are rejected. Refunds and goods inspection remain manual. Runtime behavior is implemented but the before/at/after-deadline cases remain pending isolated UAT evidence.

### Storefront/Admin API and media coverage re-audit (2026-10-27)

- Re-ran `npm run audit:demo-data` against the current local database. Storefront API, Admin API, and media checks each reported zero failed checks. Coverage includes all active products having variants and disclosed AI-demo photos, banners/video, category/collection/CMS media, addresses, active shipping/coupon fixtures, order lifecycle/change-request fixtures, and Admin roles/permissions/workspace demo data.
- The audit still reports zero owner-provided product/color photos. AI imagery remains demo/UAT only. No data was modified and no order was created.
- After regenerating the OpenAPI clients, Admin and Storefront ESLint and production builds completed successfully. Admin retains the existing 533.09 kB entry-chunk advisory (156.12 kB gzip); Storefront's entry chunk is 365.90 kB (113.70 kB gzip).
- The regular Storefront build clears route snapshots, so rebuilt the release with `STOREFRONT_PRERENDER_API_URL=http://127.0.0.1:8000/api/v1` and `STOREFRONT_PRERENDER_SITE_URL=http://localhost:5173`. It generated 36 public route snapshots. Stopped the temporary API server and verified 36 snapshots remain and ports 8000, 5173, 5174, and 5175 have no listeners. No test suite or order workflow was run.

### Cart quantity and guest-merge consistency (2026-10-27)

- Code review found repeated add requests could combine into a line above the API's per-request limit of 20, update operations did not lock current inventory or reject archived variants, and merge could preserve inactive/out-of-stock lines. Added Add/Update Form Requests, an aggregate 20-item cap, transaction locks for cart mutations, current active-variant/inventory checks, and a focused `MergeGuestCartAction` that locks carts in stable order, merges against current stock, removes invalid/unavailable customer lines, and deletes the guest cart.
- Checkout now locks the owning cart before reading and clearing items, coordinating it with cart edits and merge. Updated the cart spec, OpenAPI description, and merge flow doc. These concurrency cases have not been exercised with database requests; no test suite was run.

### Refresh-token family reuse revocation (2026-10-27)

- Auth review found revoked-token reuse was revoking every refresh/access session for the user, despite the documented requirement to revoke only the compromised family. Reuse handling now follows the locked, same-user/same-audience `replaced_by_id` chain, revokes its refresh rows and linked access sessions atomically, and preserves unrelated devices. No schema migration is needed because the replacement chain already records family membership.
- Updated auth documentation/spec. Static source review only; MySQL concurrency and replay cases have not been exercised, and no test suite or migration was run.

### Storefront catalog effective-price sorting (2026-10-27)

- Follow-up UI review showed product cards display the lowest effective active-variant price, so sorting descending by a variant maximum would make visible card prices appear out of order. Both sort directions remain based on that displayed price. Removed the unnecessary max-price subquery and documented the ascending/descending semantics and sale-window behavior in OpenAPI and the catalog spec.
- This source/doc correction has not been exercised against MySQL fixture products; no test suite was run.

### Catalog sale comparison follows displayed variant price (2026-10-27)

- Price-resource review found a product card could show the lowest price from a non-sale variant alongside the comparison price of a different, more expensive sale variant. Loaded-variant serialization and the correlated query fallback now only return a comparison price from sale variants whose effective price equals the displayed product minimum. Updated catalog acceptance and UI behavior notes.
- Pint and current API type/build evidence do not cover this SQL case; it has not been exercised against MySQL fixtures and no test suite was run.

### Stable lock order for multi-variant orders (2026-10-27)

- Source review confirmed Storefront and manual order creation lock every requested variant and recheck inventory inside the enclosing transaction. Both flows lock variant rows, then the complete matching inventory set, in ascending IDs before checking availability. Order cancellation, delivery, and return transitions now process inventory operations in `variant_id`, then order-item ID order to align with batch adjustments. Documented both creation and transition lock ordering in checkout/inventory flows.
- Pint passed on the three modified PHP actions/controllers. MySQL concurrent transaction behavior has not been exercised; the inventory concurrency acceptance remains open and no test suite was run.
- Current Admin and Storefront lint/build runs both completed successfully after API type regeneration. Storefront `build:seo` completed against the local API and regenerated 36 snapshots; the temporary API process was stopped and the expected app/API ports were verified free. The Admin 533.09 kB entry-chunk advisory remains.

### Read-only live Storefront route review (2026-10-27)

- Started the local API, Admin, and Storefront temporarily under the previously granted browser-review permission. The Storefront home rendered banner, categories, collection, new/best-selling rails, and newsletter; `/products` rendered 19 products with AI-demo disclosures; a product detail loaded its image disclosure, price, variant selection, and related products; `/account` redirected to login with a `returnTo` value.
- No form was submitted and no customer/order/inventory data was changed. Stopped the temporary `npm run dev` process afterward; ports 8000, 5173, 5174, 5175, and 8025 have no listeners. This was a read-only smoke review, not checkout UAT, screen-reader review, or a test-suite run.
- Re-ran `npm run audit:demo-data` against the current local database: Storefront, Admin, and media each report zero failed coverage checks. It confirms 19 active products with variants, thumbnail/gallery, and AI-photo disclosures; 108 active variants with inventory; 3 banners including 1 video; and 34 provinces with 3,321 wards. No owner-provided product/color photos are present.

### Storefront variant stock UI review (2026-10-28)

- User confirmed the desired product image direction: realistic garment-only photography, with no wearer or illustration. Existing catalog media already contains AI-generated flat-lay photos for all 19 active products, with visible demo disclosures; these are not verified photographs of store inventory.
- In the isolated UAT database, the four active ao-so-mi-linen variants have positive inventory (11/14/14/12 units available). The product page exposed size M with 14 units available and an enabled add-to-bag button. The accessibility tree's disabled label for native options was misleading; the live dropdown worked and there was no stock-mapping bug.
- Added the M variant to the guest cart and confirmed the cart showed `Natural · M`, quantity 1, and a 690,000₫ subtotal. Removed the item immediately afterward and confirmed the cart was empty. No checkout or order was created.
- Stopped the temporary API and Storefront processes after inspection. No test suite was run.

### Storefront guest cart reload UAT (2026-10-28)

- Follow-up browser evidence confirms the shared cart-line image renders the garment photo after loading; the earlier blank screenshot captured the image before it finished loading, so no image-source code change was needed.
- Added the Natural/M variant, changed quantity from 1 to 2, and reloaded `/cart`. The API-backed cart rehydrated quantity 2 and a 1,380,000 VND line/subtotal. Removed the item and confirmed the guest cart returned to empty; no checkout or order was created.
- Marked this specific guest-cart reload checklist item complete. Stopped the temporary API and Storefront processes. No test suite was run.

### Storefront browser guest checkout UAT (2026-10-28)

- Used the isolated UAT database and fake contact/address data to submit a guest COD order through the Storefront UI. The server quote showed 690,000 VND subtotal plus 30,000 VND shipping, and the success page showed the matching 720,000 VND total and order code `FS261027-DALR5W`.
- Confirmed the cart was cleared after placement and the tracking page, using the fake phone, returned the same pending order, item, and total. No email address, real contact details, or production data were used.
- Stopped the temporary API and Storefront processes after review. Updated the UAT checklist; no test suite was run.

### Read-only Storefront/Admin media data audit (2026-10-28)

- Ran `npm run audit:demo-data` against the isolated `fashion_store_uat_20261027` database. The schema matches 81 tables and 730 columns; Storefront, Admin, and media audits each reported zero failed coverage checks.
- The audit found 3 active banner images including 1 video source, 7 category images, 2 collection covers, 19 active product thumbnail/gallery images, 6 published CMS pages, and 1 disclosed AI-demo review image. Product/review disclosures and required media alt text are present; there are no missing files or invalid media dimensions/formats.
- No database or media files were changed. Admin visual review remains open because Windows browser automation could not confidently determine the active page URL; no test suite was run.

### Admin banner previews resolve relative media URLs (2026-10-28)

- Source review found Admin banner list thumbnails and desktop/mobile previews assigned API media strings directly to `img.src`. A relative `/storage/...` path would resolve against the Vite Admin origin instead of the configured API origin.
- Reused the shared `mediaUrl` helper for list and preview image rendering. The form retains and submits the original image value, so this only changes display URL resolution.
- Admin `npm run lint` and `npm run build` both completed successfully. No test suite was run. Visual browser confirmation remains open due the Windows browser URL-detection limitation.
### Storefront photo set and API verification follow-up (2026-10-28)

- Created 19 realistic garment-only flat-lay photos for demo products, with no wearer or mannequin, and connected each to the seeded product. Storefront and review mockup label them Ảnh AI demo; these assets are for demo/UAT and remain unapproved as actual merchandise photography.
- API audit on a disposable MySQL database previously reported no catalog/media coverage failures. During the later API suite run, the first full pass reported 51/61 passing. Follow-up source fixes address a password-rule runtime exception, Carbon day bucketing, brand filter queries against a nonexistent deleted_at column, and settings audit logs that had included setting values. Settings audit now records changed field names only and omits the settings response payload.
- A focused rerun after those fixes passed 21/27 cases. The six remaining failures need review: a return transition is attempted without an approved request; review rejection omits its required reason; the last-admin fixture lacks the matching permission; payment summary count differs from the fixture expectation; the product report fixture has no linked product IDs; and the settings audit test assumes a different field order. No further suite run was performed per the explicit test-suite constraint. Treat full API verification as unresolved.
- The throwaway API test database is was removed; the primary fashion_store database was not used for tests or modified.



### Storefront forgot-password browser UAT (2026-10-28)

- Corrected the demo address to `demo.customer@example.test` and submitted the forgot-password form on the isolated UAT database. The local Laravel mail log contained the reset email and a new Storefront link. Opened the link, submitted the known demo password again, and reached the success page. Signed in successfully with the same demo credential and immediately logged out, leaving its effective credential unchanged. Database readback confirmed zero reset-token rows and zero active refresh sessions for the demo customer. Stopped temporary API and Storefront processes and verified ports 8000 and 5173 were clear. No test suite was run.

### Storefront wishlist browser UAT (2026-10-28)

- Signed in as the seeded demo customer on isolated UAT. The account initially had the expected single saved product, Váy midi c? vuông. Removed it in the wishlist UI and confirmed the empty state; favorited the same product again from its detail page and confirmed it returned to the wishlist with the correct variant options. This restores the original fixture exactly.
- Logged out through the UI. Database readback confirms the wishlist remains at one row, no password-reset token remains, and no active refresh session remains for the demo customer. Temporary API and Storefront processes were stopped; ports 8000 and 5173 are clear. No test suite was run.

### Storefront password-change browser UAT (2026-10-28)

- Signed into the seeded demo customer on isolated UAT, changed its password through Account ? Password to a temporary UAT-only value, then changed it back through the same UI. Confirmed the success message reported other sessions signed out, logged out, and signed in again with the original documented credential.
- Isolated DB readback verified the original credential hash matches, active refresh sessions are zero, and reset-token rows are zero. API and Storefront were stopped; ports 8000 and 5173 are clear. No test suite was run.

### Storefront email-change browser UAT (2026-10-28)

- Used the Storefront Account ? Email form on isolated UAT to request a change from the seeded demo address to a unique example.test address. The app kept the current verified email until confirmation; with the queue configured as sync only for this temporary API process and the mailer set to log, the confirmation link was captured locally and verified in the browser. The Storefront then showed the new address as verified.
- Requested and verified a second change back to the original demo email. Logged out. Database readback confirmed one demo user on the original address, no test-address user, no pending email-change rows for the test address, and no active refresh sessions. Removed only the orphaned queue job created by the first queued-mode attempt; all other queue jobs were left untouched (85 remained). Temporary services were stopped and ports 8000/5173 are clear. No test suite was run.

### Storefront session-management UAT follow-up (2026-10-28)

- The Storefront session screen showed the current Chrome/Windows session and a separate secondary API session created with an explicit UAT User-Agent. The UI revoke click timed out at the browser-control layer, so I did not count the UI action as verified.
- Used authenticated UAT API requests to revoke that exact secondary session, revoke remaining other sessions, then log out the cleanup session. DB readback confirms zero session access tokens, zero active refresh tokens, zero pending email changes, and no test-address user. The demo customer's original email remains in place; 85 unrelated queued jobs remain untouched. API and Storefront were stopped and ports 8000/5173 are clear. Session-list rendering is verified; browser revoke-button interaction remains open. No test suite was run.


### Storefront registration browser UAT and cleanup (2026-10-28)

- With explicit user approval, submitted the Storefront registration form using disposable example.test data and accepted the Terms. The UI showed the pending-approval confirmation; the signed verification link was received through the local Laravel log mailer and confirmed the email. Login correctly displayed that the account awaited store-owner approval.
- Removed the exact disposable account (user id 28) and any dependent rows from isolated fashion_store_uat_20261027; verified its email is absent, demo user id 2 remains, the original pending review fixture remains, and unrelated queued jobs remain at 85. No external email was sent. API and Storefront local servers were stopped. No test suite was run.
- Review-form browser follow-up exposed required-field errors, but browser locator/navigation instability prevented a complete valid submission. No review was submitted in this attempt; the original pending review fixture was restored and verified. Storefront review submission UI remains open.


### Storefront review draft lifecycle recheck (2026-10-28)

- Rechecked the account detail route after a build caught an invalid draft-reset effect. `StorefrontRouteContent` already keys `AccountOrderDetailPage` by the complete route path, so switching order details unmounts the old form and clears its draft. Removed the redundant change; no code change is needed for this behavior.
- After removing the redundant draft-reset effect, `rtk npm run build` in `storefront/` completed successfully (TypeScript and Vite production build). No test suite was run.


### Storefront session-revocation confirmation UX (2026-10-28)

- Replaced the generic browser confirmation for single-session and revoke-other-session actions with a native in-app dialog. It identifies the selected device, explains that the current device stays signed in, disables actions while the API request is pending, keeps failures visible inside the dialog, supports Escape/cancel, and restores focus to the trigger or session heading after success. Avatar removal keeps its existing confirmation. Updated `docs/ui-ux/page-specs/account.md`.
- `rtk npm run build` in `storefront/` passed (TypeScript and Vite). Browser interaction remains to be rechecked; no test suite was run.


### OpenAPI client regeneration and frontend release builds (2026-10-28)

- Regenerated Admin and Storefront TypeScript API declarations from `api/openapi.yaml` with `npm run api:types` (OpenAPI TypeScript 7.13.0). Both generated successfully.
- `npm run build` passed in `admin/` and `storefront/`, including TypeScript and Vite production builds. No test suite was run.

- Regenerated API declarations from `api/openapi.yaml`; TypeScript/Vite production builds passed for Admin and Storefront. Follow-up to the session dialog updates the session query cache immediately after a successful revoke and refetches in the background, so closing/focus restoration does not wait on list refresh. Storefront build passed again after this change.

### Admin and Storefront lint verification (2026-10-28)

- `rtk npm run lint` passed in both `admin/` and `storefront/`. Together with the prior OpenAPI regeneration and successful production builds, both frontend packages compile and lint against the current generated API contract. No tests were run.

### Storefront generated asset reproducibility (2026-10-28)

- Ran `npm run assets:storefront:verify`. The renderer regenerated category/collection covers, desktop/mobile/campaign banners, the campaign video, OG image, and app icons; contrast met at least 5.15:1 on the banners. All 30 generated outputs matched their recorded SHA-256 hashes. Command exited 0. Product flat-lay photos remain separate generated-v4 assets and were not overwritten by the neutral graphics renderer. No test suite was run.
- After asset regeneration, re-ran `npm run audit:demo-data` against `fashion_store_uat_20261027`; exit 0. SQL schema still matches (81 tables/730 columns), Storefront and Admin demo-data audits have zero failed checks, and all media records/files/alt text are valid, including one pending disclosed AI-demo review image. The audit is read-only.

### Storefront session-revocation dialog browser review (2026-10-28)

- Started the Storefront Vite dev server temporarily and used an isolated headless Chromium context with mocked /api/v1 responses; no real API, database, or account data was accessed or mutated.
- Verified initial focus on the dialog cancel action; cancel and Escape restored focus to the session button; confirming sent DELETE /api/v1/account/sessions/12, removed that session from the UI, and focused the session heading after the row disappeared. Chromium reported no page errors.
- Stopped the Vite server after review. This verifies the Storefront dialog interaction only; session revocation against the real UAT API remains open. No test suite was run. This supersedes the earlier note that the browser interaction had not been rechecked.

### Storefront session revocation against isolated UAT API (2026-10-28)

- First confirmed the UAT connection with DB_DATABASE=fashion_store_uat_20261027; db:show --counts connected to MySQL but its console summary failed afterward because this PHP runtime lacks intl. No command used the default fashion_store database.
- Created two Storefront sessions for the seeded demo customer, identified the newly created session by ID, revoked only that session, and confirmed the access JWT is denied with HTTP 403 (matching JwtAuthenticationTest) and its refresh cookie is denied with HTTP 401. Existing UAT sessions remained present.
- A headless browser run drove the real Storefront login and session settings UI against the UAT API with only GET /cart stubbed. It uniquely selected a Firefox secondary session, submitted the UI revoke action, observed the expected DELETE response and row removal, then confirmed the secondary JWT/refresh were rejected. The page reload rotated the primary access JWT, so the harness final list read used a stale token; two sessions created by the interrupted browser reviews were matched by exact ID/time/device metadata and revoked. The pre-existing session was preserved.
- Stopped API and Storefront servers; ports 8000 and 5173 are no longer listening. No order, product, cart, or profile data was changed; no test suite was run.

### Storefront real-API session UI UAT completion (2026-10-28)

- Repeated the Storefront session review on the isolated UAT database using two real browser contexts and the real API. The primary context reloaded /account/settings; the browser rotated its refresh cookie and access token, and the harness captured the replacement token before continuing.
- Selected the unique Firefox 141 secondary session, confirmed the dialog identified that device, and revoked it from the Storefront UI. The API returned 200, the row disappeared, the secondary JWT returned 403, its refresh request returned 401, and reloading the revoked browser context sent it to /login. No browser page errors occurred. The prior UAT session remained present.
- Intercepted only the guest-cart GET to prevent cart writes. A read-only DB snapshot afterward showed the latest cart rows predated this run and the existing customer cart remained empty. Signed out the primary context and revoked/cleaned review-created sessions. Stopped both temporary servers; ports 8000 and 5173 are clear. No test suite was run. This completes the live browser/API session-revocation check; other account-browser checklist items remain open.

### Customer account browser UAT checklist closure (2026-10-28)

- Based on the recorded browser evidence for login/logout, forgot/reset password, email/password/profile mutations and restoration, address lifecycle, wishlist, registration, and the newly completed real-API session revocation flow, marked the customer account browser UAT checklist item complete. Review submission/moderation, full accessibility/screen-reader coverage, and remaining lifecycle checks remain open.

- Completed read-only Admin review moderation browser UAT in isolated fashion_store_uat_20261027: pending list/action menu/detail loaded; attached AI-demo image decoded and its alt text clearly disclosed demo imagery. No moderation or customer/order data changed. Storefront review submission still needs an eligible unreviewed delivered order item; screen-reader and remaining lifecycle checks remain open. Temporary API/Admin services stopped.

### Storefront API/demo-media audit (2026-10-28)

- Re-ran the read-only 
pm run audit:demo-data against isolated fashion_store_uat_20261027 by overriding DB_DATABASE for this process only; the repository .env remains unchanged.
- Schema matches the SQL snapshot (81 tables/730 columns). Storefront API coverage and Admin API coverage each report 0 failed checks. All 19 active products have variants, thumbnails/gallery, generated-photo references, and matching AI-demo disclosure; all 11 required UI illustrations and all banner/category/collection/review media references are present and valid. No media files are missing or invalid.
- The audit confirms media/demo data coverage, not store-owner approval or real inventory photography; those production gates remain open.

### Storefront account-deletion confirmation UX (2026-10-28)

- Replaced the customer account deletion browser-native confirm with an in-app accessible dialog. Password validation occurs before opening; cancel/Escape reset the sensitive password value and return focus to the trigger; recoverable network/API errors remain in the dialog; an incorrect server-validated password closes the dialog and returns focus to its field. The destructive request still uses the existing API and is sent only after the explicit confirm action.
- Browser UAT on isolated fashion_store_uat_20261027 verified open, cancel, Escape, focus restoration, and password clearing. The observed account DELETE request count was zero; the customer session was logged out through the UI. API and Storefront services were stopped, and ports 8000/5173 were confirmed clear.
- Updated docs/ui-ux/page-specs/account.md. No account or order data was modified. No test suite, lint, or build was run.

### Storefront avatar-deletion confirmation UX (2026-10-28)

- Replaced the remaining customer-avatar window.confirm action with an in-app dialog. The dialog keeps API failures visible, disables actions while pending, returns focus to the trigger on cancel/Escape, and focuses the account heading after successful deletion disables the original trigger.
- Isolated UAT used a temporary browser-only avatar response override; no account data or avatar was changed. Cancel/Escape returned focus correctly and sent zero avatar DELETE requests. The test session logged out; temporary API and Storefront servers were stopped.
- Updated the account page spec. No test suite, lint, or build was run.

### Storefront unsaved-navigation confirmation UX (2026-10-28)

- Replaced the SPA-navigation window.confirm in account settings with an accessible in-app dialog. It identifies unsaved values, focuses the Stay action, restores focus and preserves the form when canceled, and continues the blocked navigation only after explicit discard. The browser beforeunload warning remains for reload/tab close.
- Isolated browser UAT changed the profile name in memory, verified Stay preserved it and focus, then verified explicit discard navigated to the order list. No profile update was submitted; the customer logged out through the UI. API/Storefront processes were stopped.
- Updated the account page spec. No test suite, lint, or build was run.


### Storefront registration and garment-photo UAT follow-up (2026-10-28)

- With explicit user approval, submitted the Storefront registration form using disposable example.test data and accepted the Terms. The browser showed pending approval; the local log mailer supplied the signed verification link, which redirected to the visible email-verified state while the account stayed pending approval.
- Hard-deleted the exact temporary UAT user (id 29) and detached its customer role from isolated fashion_store_uat_20261027. No external email was sent. Temporary API and Storefront processes were stopped; ports 8000 and 5173 are clear.
- Visually checked all 16 generated-v4 garment flat-lays: realistic clothing arranged without people or illustrations. They remain AI-generated demo images, not verified inventory photos; owner approval remains open. No tests, lint, or build were run.

### Storefront photo-based category and campaign media (2026-10-28)

- Added a versioned renderer for 7 category covers, 2 collection covers, desktop/mobile hero banners, a campaign banner, and campaign video. The generated photo media has a visible `Ảnh AI demo` disclosure; previous neutral assets remain intact.
- Copied three generated source PNGs into `tools/assets/source-photos/` and updated the full renderer, SHA-256 asset verifier, and asset workflow documentation. Full render and reproducibility verification completed; cover/banner/video size limits are enforced.
- Visually inspected representative hero, outerwear, and campaign outputs. They show realistic item-only flat-lays without people. Ran `StorefrontDemoSeeder` against local `fashion_store` and isolated `fashion_store_uat_20261027`, then read-only `npm run audit:demo-data` on both; both audits passed with 0 coverage failures, no missing/invalid media, and SQL parity at 81 tables/730 columns. Refreshed the Storefront media review board. Store-owner approval remains pending; no production claim is made. No tests, lint, or build were run.

### Storefront route-and-breakpoint DOM review (2026-10-28)

- Reviewed 31 concrete Storefront routes at 320, 390, 768, and 1440 CSS px (124 observations) against the isolated UAT API using Chromium. All rendered routes had one main landmark and one H1; the heuristic found no unnamed buttons/links, unlabeled visible fields, missing `img` alt attributes, or horizontal overflow. No page runtime errors, HTTP 5xx, or 429 responses occurred.
- Guest-cart GET was intercepted to avoid writes. Unauthenticated refresh/cart 401s were expected. The first pass at default rate limits returned 429 and was discarded; the final pass used the process-only API limit of 600/minute and no `.env` changes. API and Storefront were stopped afterward; ports 8000 and 5173 are clear.
- This review does not replace axe/WCAG, full keyboard interaction coverage, or real screen-reader review; those gates remain open. No test suite was run.

### Storefront accessibility scan and registration UAT (2026-10-28)

- With explicit user approval, submitted the local UAT registration form as `Khách UAT đăng ký`, accepted the Terms, verified the email through the local Laravel log mailer, confirmed the account remained pending store approval, then hard-deleted the temporary user from `fashion_store_uat_20261027`. No external email was sent; the disposable record is absent.
- Fixed route semantics to use one app-level main landmark; updated page roots to avoid nested mains, corrected the cart's accessible label, removed `aria-controls` references to conditional cart/filter dialogs, and marked password-strength indicators as meters. The Storefront production build passed.
- Ran axe-core 4.14.0 in Chromium 156 across 31 routes and 4 widths (320, 390, 768, 1440): 124 observations, 0 violations, 0 runtime errors, and 0 server errors. The report retains 157 incomplete checks for manual contrast, icon-name, and video-caption review. Full keyboard-route and real screen-reader review remain open. Report: `docs/qa/storefront-axe-audit.json`.
- No test suite was run. API and Storefront were stopped after the UAT scan; ports 8000 and 5173 are clear.

### Storefront keyboard route smoke (2026-10-28)

- Added reusable `storefront` command `npm run audit:keyboard`, which scans all 31 known routes at 390 and 1440 CSS px and records focus cycles, visible-focus detection, route redirects, dialogs, and server/runtime errors. Anonymous `GET /api/v1/cart` is intercepted to avoid creating guest-cart rows.
- Current run reviewed 62 observations in Chromium 156 with zero failed focus cycles, runtime errors, or server errors. Escape closed the mobile navigation, cart drawer, catalog filter sheet, and size-guide dialog; focus returned to each opener.
- Account routes redirected to login without an authenticated session, so the full account keyboard matrix remains unverified. Full screen-reader review and manual review of the 157 axe-incomplete contrast/name/video-caption checks remain open. Report: `docs/qa/storefront-keyboard-audit.json`.
- The campaign MP4 was inspected with ffprobe: H.264, 1280×720, 5 seconds, video-only with no audio stream. Updated the campaign's demo description/alt in `StorefrontDemoSeeder` and UAT data; the Storefront video now references the equivalent description with `aria-describedby`. The production build passed, and the full axe run on the updated UAT content remained at 0 violations, 0 runtime/server errors, and 157 incomplete observations. The video-caption result is manually classified as not applicable to silent video-only media; contrast/name checks and real screen-reader review remain open.
- After UAT, both API and Storefront processes were stopped and ports 8000/5173 were confirmed clear. The local `fashion_store` database was not changed in this follow-up.

### Admin security confirmation dialogs (2026-10-28)

- Replaced native browser confirmations for staff impersonation in both Staff and Account menus, deleting notifications/downloads/report schedules, unlinking Telegram, and importing account preferences with the shared accessible confirmation dialog.
- Replaced the native reason prompt for staff 2FA reset with a labeled field inside the confirmation dialog. The action cannot be confirmed until the reason has at least five non-whitespace characters; the existing sudo-mode check and API request remain in place.
- Kept native confirmations for unsaved-form navigation because browser unload confirmation is handled by the platform.
- Admin ESLint and production build passed. No test suite was run.

### Storefront live media visual follow-up (2026-10-28)

- Used the already-running local Storefront/API in read-only fashion; reviewed the home hero, linen-shirt detail, `Áo` category, and `Thu đông 2026` collection. Screens showed garment flat-lays with visible `Ảnh AI demo` disclosure. On the category route all seven rendered images decoded, the five clothing photos had descriptive disclosure alt text, and a 630 px viewport had no horizontal document overflow.
- API `/up` on ports 8000 and 8001 and Storefront on 5174 returned HTTP 200. No app service was started or stopped. Docker Desktop's Linux engine pipe was unavailable to `docker ps`; this does not establish MySQL/Redis/worker/scheduler/Mailpit health. The full media matrix, narrow breakpoint/device review, authenticated Admin media screens, screen reader, and owner approval gates remain open.
- Updated `docs/qa/storefront-release-uat-checklist.md` with the observed routes and environment limitation. No forms or mutating API operations were submitted; no test suite was run.
- The visual review exposed stale accessible descriptions on the desktop/mobile hero and the Thu dong collection cover. Inspected each source image, fixed the legacy-alt recognition and hostname-independent demo-media matching in `StorefrontDemoSeeder`, and updated only the exact three matching records in both `fashion_store` and isolated `fashion_store_uat_20261027`. Read-only verification returned the accurate flat-lay descriptions in both DBs; live Storefront AX output showed the corrected hero and collection alt text. PHP syntax check passed; no test suite was run.

### Storefront public API media URL reachability (2026-10-28)

- Read-only GET requests to the isolated UAT API on port 8001 covered registration status, categories, banners, collections, and all 19 active products. HEAD-followed 70 unique catalog/product-srcset/banner/campaign-video URLs and the two distinct store-brand assets (logo/favicon and SEO Open Graph image); all 72 unique URLs returned HTTP 200 from the local media server on port 8000.
- This verifies the current API-provided media URLs resolve across the local UAT API/media origins. It does not establish the health of Docker-managed services, full rendered Admin/Storefront media review, store-owner approval, or actual inventory photography. No data was mutated and no test suite was run.

### Admin local Storefront link host fix (2026-10-28)

- Read-only Admin browser review reproduced broken Terms/Privacy links when Admin ran on `127.0.0.1:5175` while the Storefront dev server listened at `localhost:5173`; the derived `127.0.0.1:5173` origin refused connections although the `localhost` origin returned HTTP 200.
- Updated `admin/src/lib/storefront-base.ts` to normalize localhost, IPv4 loopback, and IPv6 loopback Admin hostnames to `localhost` for the default Storefront link, while keeping `VITE_STOREFRONT_URL` authoritative. A fresh Admin login render emitted the two `localhost:5173` links, and both legal routes returned HTTP 200. No credentials were entered and no data changed. No tests, lint, or build were run.
- Stopped the temporary Admin Vite server after the login-page review; port 5175 returned `ECONNREFUSED` afterward.

### Reusable Storefront API media reachability audit (2026-10-28)

- Added `npm run audit:storefront-api-media` with an optional API base URL argument or `STOREFRONT_API_BASE_URL`. It reads registration status, categories, banners, collections, and the maximum permitted 48 products per request, extracts image/srcset/video/brand media references, and checks the URLs with bounded parallel HEAD requests. The audit does not mutate API data.
- Ran it against both the local API at port 8000 and isolated UAT API at port 8001: each returned 7 categories, 3 banners, 2 collections, 19 products, and 72 unique media URLs; all media URLs returned HTTP 200 with the expected image/video `Content-Type`. An optional `--include-reviews` pass checked each product's approved-review endpoint; one approved review per environment had no image references. Kept review checks opt-in to avoid unnecessary public-API rate-limit consumption. Updated the UAT checklist. This is a reachability/type check only and does not replace full rendered visual review or owner approval.

### Local runtime preflight snapshot (2026-10-28)

- API `/up` on ports 8000/8001 and Storefront `/` on `localhost:5173` and `127.0.0.1:5174` returned HTTP 200. Laravel connected to local MySQL 8.0.44 / `fashion_store`; read-only information-schema counts were 81 tables/730 columns, and `npm run audit:schema-snapshot` confirmed parity with `fashion_store_schema.sql`.
- Runtime config resolves to MySQL, database queue, database cache, and log mailer; Redis and Mailpit are not configured dependencies for this local environment and their ports (6379, 1025, 8025) are closed. Process command classification showed two `artisan serve` commands and their two PHP built-in server children; neither `queue:work` nor `schedule:work` is running. Admin is not running. `db:show --counts` connected to MySQL but its summary failed because the PHP CLI lacks `intl`; the dedicated schema audit succeeded. This is a local snapshot, not production deployment evidence.

### Newsletter single-step opt-in decision (2026-10-28)

- The store owner selected immediate single-step subscription after explicit consent; no confirmation email is required. Recorded this as `FR-MKT-001` / `BR-MKT-001`, updated the plan, data/API/UI specs, and OpenAPI description/example. The existing action already persists the normalized email and consent timestamp idempotently; the API now returns `Bạn đã đăng ký nhận tin thành công.`
- Regenerated Admin and Storefront OpenAPI TypeScript declarations with `npm run api:types`; Pint passed for the modified controller. Newsletter submission/duplicate UAT remains pending and is listed in the release checklist; no subscription data was created during this change.




### Newsletter consent fixture audit (2026-10-28)

- Strengthened 	ools/assets/audit-storefront-api-demo-data.php to verify the seeded newsletter email is normalized and has a recorded consent timestamp, matching the chosen single-step opt-in rule. PHP syntax check passed; read-only audit reported 
ewsletter_fixtures_with_recorded_consent: 1, 
ewsletter_normalized_consent_fixture: yes, and 
ailed coverage checks: 0 against the local DB.
- This confirms seeded demo data only. Newsletter form submission and duplicate-subscription UAT are still pending; no subscription was created during this audit and no test suite was run.

### Storefront plan newsletter decision reconciliation (2026-10-28)

- Replaced the plan's stale open question claiming newsletter double opt-in was undecided with the owner's confirmed single-step opt-in decision and the remaining end-to-end UAT gate. This keeps the plan's risk register consistent with `FR-MKT-001`, `BR-MKT-001`, OpenAPI, and the UAT checklist. No app was started and no UAT mutation or test suite was run.
- Re-read the Storefront newsletter form, API request, route, and persistence action: unchecked consent is rejected on client and server; valid email is lowercased/trimmed, subscription stores `consented_at`, duplicates are ignored, and the endpoint is limited to five attempts per minute. `npm run lint` and `npm run build` both succeeded in `storefront/`. No test suite or live form mutation was run.
- Continued release validation for Admin: `npm run lint` and `npm run build` both succeeded in `admin/` (TypeScript + Vite production build); its prebuild regenerated the 651-entry third-party license notices. This verifies compilation and lint only, not authenticated browser workflows. No test suite or service startup was run.
- Rechecked local API `/up` at ports 8000/8001 and Storefront at 5173/5174 (all HTTP 200), then ran Storefront `npm run build:seo` against `http://localhost:8000/api/v1` with public origin `http://localhost:5173`. Sitemap origin matched and the prerender completed 36 public routes. This is local release evidence only; a production-domain build, deployment-host Nginx validation, and production operations checks remain open. No test suite, form submission, or database mutation was run.
- Re-ran the read-only root `npm run audit:demo-data`: SQL snapshot parity is 81 tables/730 columns; Storefront and Admin API fixture audits each report zero failed coverage checks; media audit reports 0 missing/invalid files, 0 missing alt text, and 19/19 active products with the required AI-demo disclosure. Re-ran `npm run audit:storefront-api-media -- http://localhost:8000/api/v1`: registration status, 7 categories, 3 banners, 2 collections, and 19 products exposed 72 unique media URLs, all reachable with zero failures. This current local DB/API result does not substitute for owner-provided actual product photography or production-origin verification. No data was mutated and no test suite was run.
- Repeated read-only Storefront coverage against isolated `fashion_store_uat_20261027` and API port 8001: demo-data audit reported zero failed checks, including one normalized newsletter consent fixture; 7 categories, 3 banners, 2 collections, and 19 products exposed 72 unique media URLs, all reachable. This confirms both local and UAT API media coverage now; neither audit reviewed media visually or approved it for production. No UAT rows were changed and no test suite was run.
- The owner confirmed AI-generated clothing media may remain in UAT when visibly labeled, but must not be presented as real inventory photography. Updated the plan's resolved decision; visual quality approval and actual product photography remain separate production gates. API validation also passed: `composer validate --strict` reports valid, and Laravel route discovery exposes the newsletter POST plus Storefront product list/detail/related/review routes. No test suite was run.
- Regenerated OpenAPI declarations for Admin and Storefront with `npm run api:types`; both TypeScript/Vite builds passed against those declarations. Laravel route discovery also confirmed all four Admin dashboard endpoints (`summary`, `revenue`, `top-products`, and the dashboard root) and Storefront product endpoints exist. No test suite or live mutation was run.

### Curated demo collection memberships (2026-10-28)

- A live read-only API check found the demo seeder attached every active product to both `Hàng mới` and `Thu đông 2026` (19 each). Centralized demo collection membership slugs in `CatalogSeeder`; `Hàng mới` now follows the seven new-arrival SKUs and `Thu đông 2026` contains the four outerwear SKUs. `StorefrontDemoSeeder` applies the curated order and removes stale pivot memberships when re-run; it remains guarded to local/testing. The read-only data audit now compares exact SKU sets, not just non-empty collections.
- Applied the scoped demo seeder to `fashion_store` and isolated `fashion_store_uat_20261027`. Both Storefront API origins return 7 `Hàng mới` products and 4 `Thu đông 2026` products; local Storefront/Admin/media coverage audits report zero failed checks. Reloaded the live `/collections/hang-moi` page: it renders 7 product cards and 7 disclosed AI-demo images with no alert. Pint and PHP syntax checks passed. No test suite was run.


### Optional identity/admin feature removal — 2026-11-04

- Removed per-user permission requests/grants, linked OAuth/Telegram accounts, passkeys, employee impersonation, account deactivation requests, and trusted-device enrollment from the active API and admin UI.
- Added an additive migration to drop the eight associated tables and remove the obsolete `staff.impersonate` permission. Historical migrations remain unchanged. Applying the migration permanently removes rows in those tables.
- Removed related API contract paths and regenerated the admin/storefront TypeScript API declarations. Updated the schema snapshot and data-model table count to 73.
- Composer removed `laravel/passkeys` from composer.json and composer.lock. The package install cleanup could not finish because Windows locked a file under api/vendor; unrelated package updates in the lockfile may also have been resolved during Composer update.

### Optional admin collaboration feature removal — 2026-11-04

- Added migration `2026_11_04_000002_remove_optional_admin_collaboration_features` to drop `user_recent_items`, `user_bookmarks`, `user_shifts`, `announcements`, `announcement_reads`, `support_tickets`, `support_ticket_messages`, `user_notes`, and `saved_views`, and remove the related permissions. Existing migration files remain unchanged.
- Removed related admin routes, screens, menu entries, notification settings, export fields, seed/audit references, and report-schedule integration with saved views. Task management and reminders remain available.
- Removed the retired paths and schemas from OpenAPI and regenerated Admin/Storefront types. Removed the related tables from the SQL snapshot and updated the data model, account-menu docs, and feature spec.
- Applied both optional-feature removal migrations to the configured `fashion_store` database; the requested tables and the earlier optional identity tables were confirmed absent afterward. The unrelated avatar migration remains pending.
- Admin and Storefront production builds both passed. Laravel route discovery shows no personal-history/shift, support-ticket, or announcement routes; task and reminder routes remain.

- Final follow-up: removed stale admin demo-audit assertions, seeder instructions, help text, and documentation claims for decommissioned features; cleaned unused admin translations. Admin build passes; PHP syntax and migration status confirmed. Verified all nine requested tables are absent, and the SQL schema snapshot defines 64 tables with none of them present.

### Product garment scale corrected with new images — 2026-11-04

- Generated a new v5 image for each of the 16 apparel demo SKUs, using the currently active generated-v4 product image as the edit reference. Each image retains the garment style and is composed smaller within a textured warm-neutral background.
- Added v5 source mappings to prepare-ai-demo-product-photos.py, generated 360/640/800 WebP assets, and updated StorefrontDemoSeeder to use v5 while retaining v4 assets for rollback. Re-seeded the configured local 
ashion_store; 17 product records now point to v5 (blazer duplicate SKU shares the same image).
- Regenerated the product media review board and updated the asset README. Reverted CSS-only image padding/object-fit changes so the new images control garment scale.
- Storefront media audit: zero missing files or invalid dimensions/format, zero missing product alt text. Admin and Storefront builds passed.


## NÉT Studio folded-fabric mark — 2026-11-04

- Added the text-free folded-fabric logo mark as a transparent PNG for storefront/admin branding.
- Updated demo storefront logo/favicon and the NÉT Studio catalog brand to use the new mark while preserving custom configured URLs.
- Updated static browser-tab favicons in admin and storefront, removed the admin logo tile background, and made initials a fallback so they do not show through the transparent mark. Updated sign-in/error brand marks.
- Verified both frontend production builds and PHP seeder syntax.


## Minimal UI refresh for both apps — 2026-11-04

- Added shared minimal visual layers for the storefront and admin: neutral palette, flat surfaces, thin borders, restrained radii, consistent sans-serif headings, and clearer text sizing.
- Simplified the storefront hero and catalog presentation while keeping product imagery and the existing 3:4 product card ratio.
- Updated admin light/dark shell tokens, cards, tables, controls, and navigation active states; preserved status colors and appearance preferences.
- Updated UI design tokens and principles. Storefront and admin production builds both passed.


## Storefront customer account center — 2026-11-04

- Added a shared account header and responsive navigation for profile/security, orders, addresses, wishlist, and order details.
- Applied the minimal storefront style to account forms, address cards, wishlist items, order history/details, dialogs, loading/error states, and mobile navigation without changing API behavior or account actions.
- Documented the account navigation and responsive behavior in the customer account page spec.
- Storefront production build passed after the account routes were integrated.
## Storefront full specification — 2026-11-04

- Added selectable minimum-discount filters (10/20/30/50%). The API requires an active variant discount within the product's current sale window; Form Request, OpenAPI, Storefront validation/form/chips, docs, and URL-state fixture are aligned. OpenAPI types and Pint are pending; no tests were run.
- Product detail gallery now opens the selected image in a full-screen dialog, supports browser pinch zoom, and changes images with touch swipes or explicit previous/next controls. The dialog has Escape/close behavior, labeled controls, and retains image disclosure. Updated the product-detail spec and tracker. No checks or tests were run.
- Added material as a catalog facet. The API returns trimmed material values in use by published products and filters by the normalized value; OpenAPI, Form Request, Storefront query validation/form/chips, UX docs, and the existing URL-state fixture are aligned. Admin and Storefront OpenAPI types regenerated successfully; Pint passed for changed PHP files. No tests were run.
- Added an API-backed catalog rating threshold (1–5 stars). It filters on the published aggregate of approved reviews and excludes products with no approved ratings; URL state, chips, Form Request, OpenAPI, and the existing URL-state fixture are aligned. Admin and Storefront OpenAPI types regenerated successfully; Pint passed for the changed PHP files. No tests were run.
- Added API-backed catalog sorts for highest approved rating and largest active variant discount amount; discounts outside the product sale window are excluded. Updated the Form Request, OpenAPI sort enum, Storefront validation/select/chips, and catalog acceptance docs. Admin and Storefront OpenAPI types regenerated successfully; Pint passed for the changed PHP files. No tests were run.
- Added a URL-backed availability filter for in-stock and out-of-stock products. Laravel filters published products by active variants whose `quantity - reserved` is positive; OpenAPI, Storefront validation/form/chips, catalog documentation, and the existing filter fixture are aligned. Admin and Storefront OpenAPI types regenerated successfully; Pint passed for the changed PHP files. No tests were run.
- Search pages with no product matches now offer anonymous trending search alternatives and API-ranked best sellers. Recommendations load only for a resolved empty search state; best-seller failures have an independent retry. Updated catalog UX docs and the implementation tracker. No checks or tests were run.
- Product cards now reveal a second supplied image on hover-capable fine-pointer devices. Touch and keyboard interactions retain the primary image; the secondary image stays hidden from assistive technology and carries its visible demo disclosure when needed. Updated the catalog page spec and tracker. No checks or tests were run.
- Added quick add to catalog cards. Shoppers select a specific color/size; out-of-stock variants are unavailable, cart API errors stay inline, and success opens the mini-cart. Updated catalog documentation and the implementation tracker. No checks or tests were run.
- Added accessible 2/3/4-column controls to catalog product listings. The choice applies to wider screens while mobile layouts remain two columns. Updated the catalog page spec and implementation tracker. No checks or tests were run.
- Completed the mini-cart auto-open behavior after the server confirms an add-to-cart from product detail or the signed-in wishlist. Failed additions leave the drawer closed; “Mua ngay” still proceeds straight to checkout. No checks or tests were run.

- Started implementing the complete scope in `storefront-full-spec.md`; the implementation tracker is `specs/storefront-full-spec/tasks.md`.
- Added a dedicated `/search?q=` route using the existing server-paginated catalog results. The header search now has debounced product suggestions, matching published category/collection links, browser-local recent searches, keyboard listbox navigation, and a full-results action.
- Expanded the existing Storefront product query to match product SKU, brand, category, and variant color as well as product name/description. The API response contract is unchanged.
- Search result URLs are noindex; the site's structured SearchAction now points to `/search`.
- Added a cookie-consent banner and editable necessary/analytics/marketing preferences with a footer entry point. Preferences are saved locally; no analytics or marketing scripts are loaded by this feature.
- Added a closable delivery/COD information strip, a sticky header that hides on downward scroll and returns on upward scroll, and a five-item mobile navigation bar. The mobile PDP purchase bar is positioned above the bottom navigation and safe-area inset.
- Added `/collections`, a lazy-loaded index of published collections with responsive image cards, media disclosures, and loading/error/empty states. Updated its title and description metadata.
- Added `/new-arrivals`, `/best-sellers`, and `/sale` listing routes. New and bestseller use existing server filters; sale uses active variant discounts and respects the configured sale window. Added route-specific headings and metadata, and documented the API query parameter.
- Added `/brands` and `/brands/:slug`, reusing the published-brand filter data and product query. The directory and unavailable-brand states are covered; brand listing metadata and collection structured data follow the selected brand.
- Added `/contact` as a canonical alias for the published CMS contact page and added links to new-arrival, sale, brand, and contact destinations in the responsive storefront navigation/footer. Added the public content page behavior to the UI spec.
- Regenerated Admin and Storefront OpenAPI TypeScript declarations after documenting the new `sale` query parameter. No test, lint, or production build was run for this continuation.
- Product detail now shows the brand and SKU, links its rating summary to reviews, and offers clipboard, Facebook, and native device sharing. Added “Mua ngay”; cart addition now exposes success/failure so checkout navigation happens only after the API accepted the selected item. The official Zalo share plugin is implemented with an Admin OA ID setting and loads after explicit shopper action; the store must still configure its real OA ID and validate sharing on a supported device.
- Exposed `social_zalo_oa_id` through store settings and the public storefront configuration contract; regenerated both Admin and Storefront OpenAPI types. The OpenAPI generation succeeded. No tests, lint, or production build were run for this continuation.
- Expanded the public storefront configuration with store contact/social links and COD availability. Reworked the footer to show only configured contact details, social destinations, nationwide shipping, address-calculated fees, and COD only when enabled. Updated the UI docs/tracker and regenerated API types. No tests, lint, or build were run.
- Added the product ID to the canonical cart response and API contract, then connected a full-cart “Lưu yêu thích và xóa khỏi giỏ” action to the authenticated wishlist API. The row stays in the cart unless save and remove both succeed; guest save redirects through login and leaves the row in place. Updated cart docs/tracker and regenerated API types. No tests, lint, or build were run.
- No tests, lint, or build were run in this implementation turn.
- Added API-backed catalog minimum discount filters at 10%, 20%, 30%, and 50%, scoped to currently active sale windows. Updated the query contract, generated Admin and Storefront API types, and formatted the Laravel request/controller with Pint. No tests, lint, or build were run.
- Product cards now calculate and show the active discount percentage and display approved-review average/count only when reviews exist. Updated the catalog page spec and full-spec tracker. No tests, lint, or build were run.
- Catalog product cards now show accessible color swatches for colors that have API-linked color-specific imagery. Selecting a swatch updates the primary and hover image and exposes the selected state. Updated catalog UX docs and the full-spec tracker. No tests, lint, or build were run.
- Added a PDP recently viewed rail using browser-local product slugs and fresh API fetches for up to six previous published products; unavailable products are omitted. Updated PDP documentation and tracker. Account synchronization and other placements are still pending. No tests, lint, or build were run.
- Extended the browser-local recently viewed rail to the home page and cart, in addition to PDP. The same shared component fetches fresh public product data and omits unavailable products. Updated PDP docs and tracker; account synchronization remains outstanding. No tests, lint, or build were run.
- Completed cross-device account sync for recently viewed products: added a customer-scoped API, validated most-recent-first slug replacement, a cascading relational table, cache-private response headers, OpenAPI types, and frontend merging with browser history. Updated the SQL schema snapshot, ERD, and data/UI docs. Pint and OpenAPI type generation passed. The new migration is pending application; no tests were run.
- Added P0 mini-cart free-shipping progress. The public store configuration now exposes the configured global threshold; a selected province uses the shipping API threshold, and the progress waits for current server-priced cart lines. Updated the home UI spec and tracker. Pint and OpenAPI type generation passed. No tests, lint, or build were run.
- Added API-backed related-product suggestions to the mini-cart, excluding products already in the cart. Shoppers must explicitly choose an available color/size variant before adding; loading, empty, API retry, and add-error states are exposed. Updated the storefront UI spec and full-spec tracker. No tests, lint, or build were run.
- Connected PDP review pagination to the existing server `page` parameter and response metadata. Added accessible previous/next controls with current-page and total counts; updated the product-detail UI spec and full-spec tracker. No tests, lint, or build were run.
- Added approved-review counts per star to the product-detail API response and rendered the distribution as labeled accessible progress bars on the PDP. Updated OpenAPI, generated storefront/admin types, UI documentation, and the full-spec tracker. Pint formatted the changed PHP files and `npm run api:types` succeeded. No tests, lint, or build were run.
- Added API-validated PDP review sorting by newest, highest rating, or lowest rating. Sorting runs before pagination and resets the selected page. Updated the OpenAPI query enum and storefront UI/tracker docs. Pint formatted the changed PHP files and `npm run api:types` succeeded. No tests, lint, or build were run.
- Public PDP reviews now include the purchased color/size snapshot from the order item and translate available fit feedback into Vietnamese. The added field contains only the variant-name snapshot, not order or customer data. Updated OpenAPI and UI/tracker docs. Pint and `npm run api:types` succeeded. No tests, lint, or build were run.
- Product JSON-LD now includes approved review samples and AggregateRating in the live app and SEO snapshots. Product detail loads at most three latest approved review samples for structured data, exposing only public review fields; snapshots render the same review text visibly. Updated OpenAPI and SEO docs/tracker. Pint and `npm run api:types` succeeded. No tests, lint, or build were run.
- PDP review filters now support an exact star rating and image-only results. The API applies filters before sorting and pagination; changing filters resets to page one, and filtered empty states offer a clear action. Updated the contract, UI spec, and P1 tracker. Pint and `npm run api:types` succeeded. No tests, lint, or build were run.
- Extended PDP review filters with purchased size. The API returns only sizes present on approved order-linked reviews, filters by the purchased variant's size relation, and exposes that size in review results when available. Updated the API contract and UI/tracker docs. Pint and `npm run api:types` succeeded. No tests, lint, or build were run.
- Checkout now requires shoppers to accept the linked terms and privacy policy before placing an order; the API validates `terms_accepted: true`. Updated OpenAPI, generated Admin/Storefront types, checkout UI docs, and full-spec tracker. Pint and `npm run api:types` succeeded. No tests, lint, or build were run.
- Checkout confirmation now uses the API's order-item snapshots and authoritative subtotal, discount, shipping, and total to show a complete COD summary. The placed-order response/OpenAPI contract and confirmation UI/docs were updated; route refresh still falls back to the order-tracking link because order detail is not re-requested there. Pint and `npm run api:types` succeeded. No tests, lint, or build were run.
- `/account` now has a customer overview with the latest API-backed order, saved delivery address, retries, empty states, and shortcuts. Profile/security settings now have their own `/account/settings` navigation route. Updated account queries, routing, docs, and the full-spec tracker. No tests, lint, or build were run.
- Account order history now filters on the URL by order-status group, code or purchased product, and placement date; results remain server-paginated and scoped to the signed-in customer. Updated Form Request validation, OpenAPI parameters/types, query state, accessible filter UI, docs, and tracker. Pint and `npm run api:types` succeeded. No tests, lint, or build were run.
- Registration now offers optional email marketing consent independently from required terms acceptance; API validation and the registration transaction create a newsletter subscription only for an explicit opt-in. Updated OpenAPI, auth-flow/security docs, and storefront tracker. No tests, lint, or build were run.
- Product detail size selection now uses accessible buttons, clearly marks sold-out options, and keeps them unselectable while preserving color, stock, quantity, and purchase behavior. Updated catalog UX docs and full-spec tracker. No tests, lint, or build were run.
- Account order detail now supports “Mua lại” by re-adding each saved variant and quantity through the existing cart API, which revalidates current stock and prices. It reports partial failures and opens the cart after a fully successful reorder. Updated account/checkout docs and tracker. No tests, lint, or build were run.

- Guest order tracking now renders the API-provided public order-status history as a chronological timeline with local timestamps; no-match responses use one neutral message. Updated the storefront UI spec and implementation tracker. No tests, lint, or build were run.

- Guest order tracking now includes public shipment carrier, tracking code, status, and shipped time when available. The response exposes only customer-facing shipment fields; the Storefront UI places these above the order timeline. Updated OpenAPI and regenerated Admin/Storefront API types. No tests, lint, or build were run.

- Authenticated customer order details now show carrier, tracking code, and ship date when available, matching the guest order-tracking page. Updated account UI documentation and the full-spec tracker. No tests, lint, or build were run.

- The home service strip now reads COD availability from the public Storefront configuration and hides the COD claim when disabled or not yet loaded; this prevents an unsupported payment promise. Updated home UI documentation and tracker. No tests, lint, or build were run.

- The dismissible header announcement and SEO-rendered home snapshot now follow the same COD-enabled setting as the interactive home service strip; COD messaging is omitted when disabled or unavailable. Updated home UI docs and tracker. No tests, lint, or build were run.

- Checkout now enforces the store's COD setting server-side before creating a new order; a disabled COD method returns validation errors. Existing same-scope idempotent retries still replay the original order. Checkout disables order placement until COD is confirmed enabled, and PDP no longer advertises COD when disabled. Documented the rule in the checkout flow and OpenAPI contract.

- Checkout now distinguishes public configuration loading, failure, and COD-disabled states. A failed configuration request offers retry, and order submission remains disabled until the COD setting is confirmed. Updated checkout UX docs/spec and tracker.

- Customer address book now supports Nhà/Công ty/Khác labels and independent shipping/invoice defaults. Added an additive migration that backfills invoice defaults from existing delivery defaults; address API resources/validation and single-default/fallback handling are updated, and account/checkout UIs show the new choices and badges. Updated OpenAPI types, ERD, data model, SQL snapshot, account UX docs, and trackers. Migration remains pending application; no tests were run.

- Campaign banners now support an Admin-configured live countdown tied to `banners.ends_at`; the API requires the campaign placement and end timestamp, while the SEO snapshot shows the configured end date before JavaScript loads. Added migration `2026_11_05_130000_add_show_countdown_to_banners_table`, updated OpenAPI/types, data-model/ERD, home UX, and the full-spec tracker. Migration is pending application; no tests were run.

- Catalog filter coverage now includes an exact product fit/silhouette field editable in Admin and queryable from the Storefront. Color options return attribute HEX values and render as labeled, keyboard-operable swatches. Updated product migration/model/requests/resources, OpenAPI and generated types, catalog URL/filter schemas, Admin create/edit forms, data-model/ERD and UX/tracker docs. The migration is pending application; no tests were run.

- Product detail stock messaging now respects each variant's configured `low_stock_threshold`: the API returns an `is_low_stock` flag, the Storefront shows the exact remaining count only below that threshold, and uses generic in-stock/out-of-stock text otherwise. Updated OpenAPI and generated types, PDP UX notes, and the full-spec tracker. Pint and API type generation passed; no tests were run.

- Sold-out PDP sizes now let shoppers request a one-time email alert. Added `product_stock_alerts`, a rate-limited public endpoint, an idempotent subscription action, a queued email notification, and post-commit inventory transition hooks for stock adjustments, canceled reservations, and returned items. Updated OpenAPI, generated types, data model, ERD, PDP UX notes, and tracker. Migration `2026_11_05_150000_create_product_stock_alerts_table` is pending; no tests were run. SMS alerts remain unavailable until an SMS provider is configured.

- Catalog cards now display a “Mới” badge only when the product's existing Admin-maintained `is_new` flag is true. Exposed that flag in the public Product resource/OpenAPI types, updated the catalog UI spec and full-spec tracker, and kept sale and stock badges tied to API data.
- Verification for the catalog badge change: Pint, PHP lint, generated API types, Storefront TypeScript, and ESLint passed. ESLint reports the existing React Hook Form `watch()` compiler warning in `CatalogPage.tsx`; no tests were run.

- Approved product reviews now support a public store response. Added a nullable response column, an Admin-only endpoint with approved-status enforcement and audit logging, an editor in the review detail drawer, and public rendering below the approved review. Updated OpenAPI, generated types, data model, ERD, PDP/Admin review UX docs, and the P0 tracker. Migration `2026_11_05_160000_add_store_response_to_reviews_table` is pending; no tests were run.
- Review-response checks: Pint and PHP lint passed; Admin and Storefront TypeScript and Admin/Storefront ESLint passed; Laravel route listing confirmed the Admin response endpoint. No tests were run.

- Approved Storefront reviews now support “Hữu ích” votes. Added a rate-limited endpoint, a unique review/browser-visitor vote table, an authoritative API count, and a persistent anonymous visitor ID so duplicate clicks/retries remain idempotent. Updated OpenAPI, generated types, data model, ERD, PDP UX notes, and the P0 tracker. Migration `2026_11_05_170000_create_review_helpful_votes_table` is pending; no tests were run.
- Helpful-vote checks: Pint and PHP lint passed; Storefront/Admin TypeScript and Storefront ESLint passed; Laravel route listing confirmed the endpoint. No tests were run.
- Storefront size guidance: added per-product size range storage and Admin editing, then exposed configured size suggestions in the PDP guide using shopper-entered height and weight. Recommendations are sourced from explicit store data; missing matches remain clearly unconfigured. Added API contract/types and updated schema/UX docs. Migration `2026_11_05_180000_create_product_size_recommendations_table` is pending; no database migration or tests were run.
- Customer size profile: Storefront customers can save optional height, weight, bust, waist, and hip measurements in their account profile. The signed-in PDP pre-fills height and weight from that profile while preserving per-product edits. Measurements are included in customer data exports and cleared when an account is deleted. Updated the account API contract, generated types, SQL snapshot, and account UX docs. Migration `2026_11_05_190000_add_customer_body_measurements_to_users_table` is pending; no tests were run.
- Customer-profile checks: Pint, PHP lint, Storefront TypeScript, targeted Storefront ESLint, and route listing passed. No tests were run.
- Newsletter welcome coupon: Admin can configure an existing coupon that is active, in its date window, and has remaining uses. A new, explicitly consented subscriber receives the coupon code by queued email; duplicate submissions do not resend. Updated Storefront settings, API contract, and marketing UX/data docs. No schema migration is needed; no tests were run.

- Homepage Lookbook now uses an explicit `collections.is_lookbook` selection instead of inferring intent from the first collection with a banner. Admin selects one currently published collection at a time, validates its banner/alt text, and selecting another clears the previous choice. Interactive Storefront and release SEO snapshot share the same selection rule. Added migration `2026_11_05_330000_add_is_lookbook_to_collections_table`, updated OpenAPI/generated types, ERD, data model, home UX, and the full-spec tracker. Applied the migration locally, exported and audited the 73-table/694-column SQL snapshot, and ran Pint on changed PHP files. No tests or frontend checks were run.

- Completed the P1 shop-the-look flow on the existing collection model: the selected Lookbook collection can assign 0–100% image coordinates to collection products in Admin, preview those numbered pins, and publish keyboard-accessible product links on `/lookbook/:slug`. The API returns only published products with configured pins for the Lookbook query; the regular collection listing remains paginated and unchanged. Added migration `2026_11_05_340000_add_lookbook_positions_to_collection_products_table`, updated OpenAPI/generated types, sitemap, SEO prerender, route metadata, ERD, data model, UI docs, and the P1 tracker. Applied the migration, exported and audited the 73-table/696-column snapshot, and ran Pint on changed PHP. No tests or frontend checks were run.

- Added the P1 storefront back-to-top control to the shared app shell. It appears after 480 px of scrolling, remains keyboard accessible while focused, sits above the fixed mobile navigation and safe area, and switches to instant scrolling for reduced-motion users. Updated the home UI spec and full-spec tracker. No tests or frontend checks were run.

- Implemented the P1 editorial blog foundation: added scheduled/published article storage and ordered product links; permission-gated Admin editing; public category-filtered article lists, sanitized details, related posts, and linked products; article search results; canonical/metadata/BlogPosting JSON-LD; and sitemap entries. Updated OpenAPI/generated types, data model, search documentation, and the blog page spec. Applied migration `2026_11_05_350000_create_blog_posts_tables`, exported the 75-table/714-column SQL snapshot, and audited it against the local database. No tests or frontend checks were run.
- Newsletter welcome-coupon notices for signed-in customers now honor their in-app, browser-push, and SMS preferences, with email still requiring explicit newsletter consent; the inbox recognizes the `promotion` event and offers an offer link. Updated OpenAPI, generated Admin/Storefront types, API/data/UI docs, and the full-spec tracker. `npm run api:types` and Pint completed; no tests or frontend checks were run. General Admin campaign notification delivery and Zalo ZNS remain open.
- The signed-in notification-preferences form now creates newsletter consent when a customer enables promotion email and withdraws it when disabled. Preference persistence and consent changes are transactional, and re-enabling preserves an existing consent timestamp. Updated API/data/account docs; Pint formatting completed. No tests were run.
- Added Admin promotion campaigns: authorized staff compose and confirm a title/message/internal link; a unique queued job sends active customer accounts through enabled channels and newsletter subscribers by email consent, while campaign history records queue/skip/failure counts. Recipient rows use a keyed email hash and are deleted after processing. Added OpenAPI/types, audit logging, Admin UI, docs, and applied migrations `2026_11_05_380000_create_storefront_promotion_campaigns_table`, `2026_11_05_390000_create_storefront_promotion_campaign_recipients_table`, and `2026_11_05_400000_add_constraints_to_storefront_promotion_campaign_recipients_table`. Regenerated the 78-table/753-column SQL snapshot and confirmed it matches MySQL. No tests were run.
- Added Storefront “Ghi nhớ tôi” login behavior: unchecked creates a session-only httpOnly refresh cookie and checked creates a persistent cookie for the configured session lifetime. The choice survives refresh-token rotation and older API clients remain compatible. Added `refresh_tokens.remember_me`, updated OpenAPI/UI/security/data-model docs, applied the additive local migration, and regenerated the SQL snapshot.

- Hoàn tất crop ảnh đại diện khách hàng ở Storefront: chọn vùng vuông, xoay, phóng to và chỉnh vị trí trước khi tải ảnh 512 × 512 lên; giới hạn ảnh đầu vào/đầu ra 2 MB, lỗi ảnh và lỗi API giữ trong hộp thoại. Cập nhật đặc tả tài khoản và tracker. Không chạy test/build/lint theo hướng dẫn dự án.

- Mở rộng menu desktop của Storefront từ danh sách liên kết bị giới hạn thành menu danh mục phân cấp lấy từ API, liên kết mọi bộ sưu tập và trang thương hiệu, kèm tối đa hai ảnh danh mục thật. Bổ sung đóng bằng Escape và cập nhật UI spec/tracker; tiêu chí shared shell tổng thể vẫn còn mở. Không chạy test/build/lint theo hướng dẫn dự án.

- Hoàn thiện bộ lọc catalog Storefront cho tiêu chí hàng mới, bán chạy và đang giảm giá: checkbox URL-backed, chip xóa riêng, trạng thái preset bị khóa trên trang merchandising và vẫn giữ các tiêu chí khác. Cập nhật schema, trang, OpenAPI-query validation usage, UX spec và tracker; các mục catalog tổng thể còn mở. Không chạy test/build/lint theo hướng dẫn dự án.

- Thêm nhãn Bán chạy vào thẻ catalog khi sold_count do API trả về lớn hơn 0; cập nhật kiểu dữ liệu catalog, CSS, trang spec và tracker. Không chạy test/build/lint theo hướng dẫn dự án.

- Thêm lối tắt Yêu thích kèm số sản phẩm đang lưu vào header Storefront, nối trực tiếp với danh sách wishlist; thu gọn nhãn thành biểu tượng ở mobile để giữ chỗ. Cập nhật UI spec và tracker; tiêu chí shared shell tổng thể vẫn mở. Không chạy test/build/lint.

- Hoàn thiện menu tài khoản trong header: khách có lối tắt đăng nhập/tạo tài khoản; thành viên có đơn hàng, yêu thích, hồ sơ và đăng xuất. Hỗ trợ Escape, focus trigger, responsive label; cập nhật UI spec và tracker. Không chạy test/build/lint.

- Hoàn thiện trang thương hiệu với nhóm chữ cái theo tiếng Việt và các liên kết nhảy nhanh bàn phím; dấu thanh được quy về chữ cơ sở, Đ xếp chung D, tên bắt đầu ký tự khác vào nhóm #. Cập nhật CSS, trang spec và tracker. Không chạy test/build/lint.

- Bổ sung liên kết Tất cả bộ sưu tập vào menu desktop, menu mobile và footer để trang chỉ mục luôn tìm thấy, kể cả khi catalog rỗng. Cập nhật storefront-home spec và tracker. Không chạy test/build/lint.
- Implemented multiple customer-owned wishlists end to end: an additive migration backfills existing favorites into a default list; old endpoints remain compatible; authenticated APIs support list CRUD, per-list products, and revocable read-only share tokens; Storefront includes list management and a public shared-list page. Updated OpenAPI and generated types, ERD, data model, account UI spec, and full-spec tracker. Migration and tests were not run.
- Added the Storefront PWA manifest and iOS home-screen metadata, production-only registration for the push-capable service worker, offline shell/navigation/static-asset caching, an offline recovery page, and a live offline status message. Public catalog/content GET responses are stored under same-origin Cache Storage keys in the API client so they can be reused when the API is on a separate origin; authenticated and transaction/account endpoints are excluded. Added an explicit manifest MIME type in the Storefront Nginx example and updated the home UI spec and P2 tracker. No build or offline browser QA was run.
- Added published-product facet counts to the Storefront category tree and filter-options API for categories (including descendants), brands, sizes, colors, materials, and fits. The catalog exposes the counts in a collapsible summary instead of deriving them from the current page. Updated OpenAPI/generated frontend types, catalog UI spec, and the full-spec tracker. No build or API checks were run.
- Started a development-only UI-first preview sequence from `storefront-full-spec.md`: home, catalog, product detail, cart, and checkout screens now render local fixture content in a separate app branch before API-backed hooks mount. Local controls demonstrate the planned states without persisting data or placing orders. Added the preview route guide. `npm --prefix storefront run build` passed; no tests were run. Remaining preview screens include authentication, account, search, editorial content, tracking, and responsive/shared-shell review before connecting fixtures to the existing APIs.
- UI-first storefront typography follow-up: reduced the display headline's tight negative tracking so Vietnamese diacritics remain visually distinct at large sizes, and restored the original logo mark in the UI-first footer instead of a text brand treatment. Storefront production build completed; visual browser confirmation is still outstanding.
- Storefront image delivery follow-up: added an idempotent Sharp script for AVIF derivatives of demo product WebP sources and an optimized manifest, then made `ResponsiveImage` prefer AVIF while retaining API-provided WebP srcsets as fallback. Hero mobile art now shares a valid `<picture>` with the image sources. Storefront production build passed; no tests or browser visual checks were run.
- Storefront shared UI follow-up: applied layered glass/shadow styling to native dialogs and toasts, refined product tabs into a soft pill control, and changed the mobile bottom navigation into a floating glass pill with safe-area spacing. Aligned editorial heading tracking with the plan's `-0.02em` so Vietnamese glyphs have room. Storefront production build passed; no tests or browser visual checks were run.
- Home lookbook enhancement: the selected featured collection now loads product details and staff-positioned pins through existing collection endpoints; the image hotspots and adjacent product list show API prices, product links, and add-to-cart using the existing cart action. Added loading/retry messaging and documented the home behavior. Storefront production build passed; no tests or browser runtime checks were run.
- Checkout layout follow-up: `/checkout` now hides the shared full header, footer, and back-to-top control and shows the existing store logo with a secure-payment lock label, including the empty-cart state. Updated the checkout UX spec and full-spec tracker. Storefront production build and focused ESLint passed; no tests were run.
- Shared footer follow-up: completed the four-column footer with grouped support/about links, published CMS pages, configured contacts/social links, API-backed newsletter signup with explicit consent, only enabled payment-method badges, shipping information, privacy controls, and Vietnamese/VND footer strip. Newsletter form instances now receive unique DOM IDs. Updated the source layout plan, Storefront UX spec, and shared-shell tracker. Storefront production build and focused ESLint passed; no tests were run.
- PDP checklist audit: traced the open product-detail acceptance item through the live route and current implementation. Variant/color selection, swipe/lightbox/360° imagery, stock alerts, configured size recommendations, cart/buy actions, paginated reviews/questions, outfit/related/recent products, SEO product ratings, and loading/error/not-found states are present; closed the composite tracker item with file references. No code changes or tests were needed for this audit.
- Cart/checkout checklist audit: traced the cart to canonical API operations, server coupon eligibility/quotes, guest-cart persistence and merge, stock/expiry/error states, and the checkout to configured methods, server quotes, address/shipping/pickup validation, idempotency, and success/payment routes. Closed both broad implementation tracker rows; separate release/browser/UAT gates remain open. No code changes or tests were needed for this audit.
- Customer-account checklist audit: confirmed implemented profile/contact/password/account deletion, address book, order history/details/reorder, multi-list wishlist, passkeys and session revocation, notifications/privacy preferences and owner-scoped export, and server logout with client cache cleanup. Closed the implementation summary row; device-specific and release checks remain open. No code changes or tests were needed for this audit.
- Admin Dashboard plan follow-up: added period-scoped `category_breakdown` to `/admin/dashboard/summary` for paid delivered/completed order-item revenue, applying proportional refund allocation consistent with product-performance reports and retaining unclassified items. The dashboard now renders a responsive, localized category donut (top five plus remainder) with empty and accessible summary states. Updated OpenAPI/generated types, dashboard specs, layout plan, API conventions, and translations. API type generation, Pint, PHP syntax/route checks, Admin production build, and focused ESLint passed; no tests were run.

- Homepage Instagram plan item implemented: Admin Store Settings now curate up to six public post/reel URLs with image URLs and required alt text. The public Storefront configuration validates and returns these entries, the homepage renders an accessible responsive six-image rail only when configured, and Admin controls the section's visibility/order. The SEO prerender uses the same content and section order. OpenAPI/generated types and storefront/Admin UX docs and trackers were updated. `npm run api:types`, both frontend production builds, targeted ESLint, PHP lint/Pint, and prerender-script syntax checks passed; no tests were run. Existing Instagram content must be entered in Store Settings before the rail appears.
- Lookbook plan section 3.3 implemented as a route-specific editorial page: `/lookbook/:slug` now pins the collection image on desktop, overlays numbered Admin hotspots, lists products in the configured order with current prices and available variant selection, and adds selected items sequentially through the cart API with partial-failure feedback. Mobile stacks the image and outfit list; the SEO prerender now emits the same two-column editorial structure and ordered product links. Updated the source layout plan, Storefront UX specification, and implementation tracker. Storefront production build, focused ESLint, and SEO prerender JavaScript syntax check passed; no tests were run.
