# React Frontend Architecture

## Stack target
React + Vite + strict TypeScript; React Router data router/lazy routes; TanStack Query for server state; TanStack Table for admin list rendering with server-owned sorting and pagination; React state/context for client-owned UI state; React Hook Form + Zod; Axios client with refresh handling; shared design tokens and accessible UI components. Storefront prioritizes mobile layout and image performance. Its route table explicitly registers public, catalog, cart/checkout, account, and content paths. `App.tsx` is a one-line router entry; `app/StorefrontApplication.tsx` composes feature hooks and app state, while `app/StorefrontRouteContent.tsx` owns route-to-page rendering, the shared storefront shell, and account/maintenance guards. Shared `App.css` and `Home.css` load from the Storefront entry so the server-generated release snapshots and the home hero have layout styles before JavaScript; other feature styles remain imported by their lazy routes.

## Feature structure
```text
src/
  app/                 # providers, router, layouts, error boundaries
  components/ui/        # primitive components
  components/shared/    # shared data table, price, empty/error states
  features/<feature>/   # api.ts, queries.ts, schemas.ts, components/, pages/
  lib/                 # HTTP client, formatters, constants
  hooks/                # reusable UI hooks
  types/                # generated OpenAPI types
  styles/               # tokens and global CSS
```

## Frontend and UI implementation rules

This document is the canonical source for frontend structure, state, forms, and project-specific UI implementation rules. For a change, read the root and app `AGENTS.md`, the feature spec, [UI principles](../ui-ux/principles.md), [design tokens](../ui-ux/DESIGN.md), the relevant page spec, and existing components. Impeccable provides the design workflow; these architecture rules remain applicable when using it.

- Establish information hierarchy, responsive behavior, and loading, empty, error, success, disabled, and destructive states before styling.
- Reuse local primitives. Both apps use shadcn/ui as the source for new shared primitives; add only needed components from the relevant app directory and follow [component guidelines](../ui-ux/component-guidelines.md).
- Use semantic HTML, accessible names, associated labels and validation errors, visible keyboard focus, keyboard operation, contrast-compliant tokens, non-color status cues, and reduced-motion support.
- Keep storefront controls touch-friendly and product images prominent, with useful alt text and a consistent aspect ratio. Admin tables retain server-owned filtering, sorting, and pagination and remain keyboard usable.
- Put feature API calls, query keys/hooks, schemas, components, and pages under `features/<feature>/`. Keep API data in TanStack Query; use React state/context for client-owned UI state. Add a dedicated client-state package only through an ADR when built-in state no longer fits.
- Validate forms with React Hook Form and Zod, preserve field-level API errors, and keep critical errors visible until resolved.
- UI permission checks control presentation; API authorization remains authoritative. Access tokens stay in memory, and frontend totals are display estimates only.
- Keep routes, OpenAPI-generated types, documentation, and page specs aligned. Update design tokens when the shared design system changes. Run frontend checks only when requested and report visual verification only when it was actually performed.
- Admin and Storefront use Tailwind CSS v4 with CSS-first configuration and `@import "tailwindcss"`; follow each app's existing component and CSS conventions, avoid deprecated v3 utilities, and prefer `gap` for spacing between sibling elements.
- Storefront styling: write new UI with Tailwind utilities and semantic design tokens (CSS variables in `src/index.css`); do not add new hand-written feature `.css` files. Existing feature CSS may stay until the screen is next reworked, then migrate it.
- Storefront components: build on the existing shadcn/ui primitives in `src/components/ui/` (`new-york` style, `neutral` base, `lucide` icons per `components.json`). Add a primitive with the shadcn CLI only when a screen needs it, compose class names with `cn()` from `@/lib/utils` (`clsx` + `tailwind-merge`), and define variants with `class-variance-authority`. `radix-ui` is already installed in both apps and backs the shared dialog, popover, tabs, sheet, and menu primitives; do not add a second primitive package for those roles.

### Approved frontend libraries
Use these before adding anything new; a new runtime dependency needs an ADR (see `docs/adr/`).

| Concern | Library |
|---|---|
| Routing, SEO, PWA, and performance | `react-router` (Storefront routes and lazy route boundaries); `features/seo/useStorefrontSeo.ts` owns metadata, canonical URLs, and JSON-LD; the custom `public/storefront-sw.js` handles the production app shell/public responses while excluding private pages; Vite/React lazy imports and `ResponsiveImage` handle code and image loading. No Helmet or PWA plugin is added. |
| Server state | `@tanstack/react-query` |
| Client-owned state | React `useState`/context; no external store until an ADR establishes a need |
| Forms and validation | `react-hook-form`, `@hookform/resolvers`, `zod` |
| HTTP | `axios` (shared client in `lib/`) |
| Styling | `tailwindcss` v4, `@tailwindcss/vite`, `tw-animate-css` |
| UI primitives | shadcn/ui, `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Icons | `lucide-react` |
| Motion | `motion` (respect reduced motion) |
| Carousels | `embla-carousel-react` (single JS carousel library; use native scroll-snap for simple rails; only add autoplay when the design requires it) |
| Admin charts | `recharts` (dashboard/report charts; lazy-load chart views) |
| Video playback | `react-player` (lazy-load its HTML file player for product/review MP4/WebM; preserve browser controls without bundling unused HLS/DASH/hosted providers) |
| Admin onboarding | `driver.js` (role-aware steps; app persists completion and snooze state) |
| Store locator map | `react-leaflet` + `leaflet` (OpenStreetMap tiles; keep list and directions usable without the map) |
| Toasts | `sonner` (both apps) |
| Fonts | `@fontsource-variable/*` (self-hosted; do not import fonts from Google CDN) |
| Admin tables | `@tanstack/react-table` (admin only) |
| Admin drag and drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (admin ordering controls; support keyboard, pointer, and touch input) |
| Admin rich text | `@tiptap/react` (CMS and product content) |
| Admin localization | `i18next`, `react-i18next` (Storefront remains Vietnamese-only) |
| Analytics | Google Analytics 4 through the existing `gtag.js` bridge (Storefront; load only after analytics consent and a valid Measurement ID) |
| Social sharing | `react-share` (Storefront product/compare actions; prefer native Web Share where available) |
| Accessibility automation | `@playwright/test`, `axe-core` (development only; Playwright smoke suite lives in `storefront/e2e/`) |

Admin notification rendering is hosted once by `Toaster` in `src/main.tsx`; `src/lib/admin-toast.ts` maps shared success/error notices to Sonner, including QueryClient mutation defaults. Keep toast colors connected to the Admin semantic CSS variables so light/dark themes remain in sync. The role-aware onboarding tour uses Driver.js to highlight the dashboard and only visible navigation links; account preferences continue to store completion, dismissal, and snooze state.

### Feature module template

```text
features/<feature>/
  api.ts          # typed request functions
  queries.ts      # query keys, query/mutation hooks
  schemas.ts      # Zod input schemas
  components/     # focused reusable feature pieces
  pages/          # route-level screens
```

Keep modules smaller when the feature is read-only or needs only one component; do not create empty layers for symmetry.

### UI acceptance checklist

- Clear page title and primary action.
- Mobile, tablet, and desktop behavior matches the page spec.
- Keyboard users can reach, operate, and leave all controls; focus is visible.
- Form labels and errors are programmatically associated.
- Loading, empty, failure, success, disabled, and destructive states are represented.
- Product images preserve their intended ratio and have useful alt text.
- Color is not the only status cue; tokens meet the contrast target.
- Critical errors remain visible until resolved.

## Admin localization
The admin uses bundled `i18next` and `react-i18next` resources. Keep Vietnamese as the default/fallback locale, save the admin's `vi`/`en` choice in the existing `admin_appearance` account preference, and leave storefront language independent. Use the original Vietnamese copy as translation keys so untranslated screens remain usable while English coverage is added. Keep locale resources beside the admin app and avoid runtime translation network requests. Load the English dictionary as a separate local chunk only when an admin selects English; if that chunk cannot load, keep Vietnamese active and keep the document language in sync.

Admin frontend API requests go through `lib/admin-api.ts` (`adminApiFetch`), including public invitation/login and session reauthentication calls. Multipart uploads that need progress reporting use `adminApiUpload` from the same client; it assigns/captures `X-Request-Id` and shares the protected-route access-token refresh/retry behavior. Only protected routes receive the active access token. Login, refresh, and challenge verification stay outside the protected refresh flow. Avoid calling browser `fetch` directly for API endpoints.

The Admin account-menu module is lazy-loaded on first activation and prefetched on pointer hover or keyboard focus. Its account shortcut still opens the menu before the module is downloaded; the fallback trigger stays labeled and keyboard-operable while loading.

Query keys are hierarchical (`['products','list',filters]`, `['orders','detail',code]`). Successful mutations invalidate affected queries; cart may optimistically update and reconcile with server response. Forms share Zod schemas where practical. Route guards redirect to login with a safe `returnTo`; admin route/menu access reads permissions from `/admin/auth/me`. Add route error boundaries and 403/404/500 views; lazy-load routes and images.

Storefront account URLs wait for refresh-cookie restoration before guarding, then redirect unauthenticated visitors to login with the same-origin path, query, and hash. After login, `resolveSafeStorefrontReturnTo` rejects external URLs, backslash-based paths, and auth-entry routes before navigating to the saved destination.

Storefront feature behavior lives beside its pages and API clients. Home banners, categories, collections, and public-page links are queried by `features/home/useHomeContentQueries.ts`; their response types, catalog product pages/products/reviews, public CMS page types, catalog filter options, registration/maintenance configuration, login/refresh/identity responses, cart payloads, checkout quotes, shipping fees, placed-order responses, and customer order summaries/details come from generated OpenAPI schemas. Auth token synchronization, refresh-cookie session restoration, and current-user validation are owned by `features/auth/useStorefrontSessionEffects.ts`; login form state, API submission, and safe return navigation live in `features/auth/useStorefrontLogin.ts`; logout, private account/cart-cache clearing, and guest-cart merge reset live in `features/auth/useStorefrontLogout.ts`; and private account-route session restoration/returnTo redirects live in `features/auth/StorefrontAccountRouteGuard.tsx`. `features/account/useStorefrontAccount.ts` composes route-aware address/order queries and the address book, wishlist, order-change, and review actions used by account pages and checkout. Catalog list, product-detail, filter-option, related-product, and review queries are owned by `features/catalog/useCatalogQueries.ts`; catalog URL state, filter controls/chips, and pagination assembly are composed by `features/catalog/useStorefrontCatalog.tsx`. `features/cart/useStorefrontCart.ts` composes the cart session query, guest-to-customer merge mutation, line mutations, add-to-cart, and retry actions used by the app shell, checkout, and wishlist. Canonical cart lines live in that session's TanStack Query cache, keyed separately for guest and customer identities; successful cart mutations reconcile server responses into that cache. Account address and order reads by `features/account/useAccountQueries.ts`; account profile and session reads by `features/account/AccountSettingsPage.tsx` use TanStack Query keyed by customer ID, and logout clears private caches; account profile, email, password, avatar, and session mutations by `features/account/account-settings-api.ts`; province, ward, and selected-province shipping-fee lookups by `features/checkout/useAddressLocations.ts`; address-book form state and CRUD cache updates by `features/account/useAddressBookActions.ts`; wishlist queries and toggles by `features/account/useStorefrontWishlist.ts`; order cancellation/return and review submission by `features/orders/useCustomerOrderActions.ts`; checkout preview/order placement, idempotency, and result navigation by `features/checkout/useCheckoutActions.ts`; appearance persistence and token generation by `features/appearance/useStorefrontAppearance.ts`; and document metadata, canonical URLs, favicon updates, and JSON-LD generation by `features/seo/useStorefrontSeo.ts`. Shared media uses `components/shared/ResponsiveImage.tsx` for fixed intrinsic dimensions, lazy decoding, optional `srcSet`/`sizes`, and a neutral placeholder disclosing when a real product photo is unavailable. These hooks and components preserve the API contract and keep feature behavior out of the app shell.

Do not persist access tokens. Browser storage is optional: use the guarded helper in `lib/browser-storage.ts` for client preferences, guest cart identifiers, guest wishlist product ID/slug references, and short-lived password-recovery convenience state; keep in-memory state authoritative when storage is blocked. Guest wishlist references are refreshed through public product detail reads and merged into the signed-in customer's default list after authentication. Do not trust client totals. Convert VND through `lib/money.ts` and dates through shared locale helpers. Every page implements loading, empty, error, and success states.

## Home editorial composition

The production `/` route uses the API-backed `features/home/HomePage.tsx` and the shared storefront header/footer. Home sections follow public Storefront configuration and use API data for banners, categories, products, collections, campaigns, Instagram, newsletter, and membership; product rails use live prices and inventory. The page also renders approved public reviews and the latest published Blog API articles when matching data exists, while hiding either section when it is empty. In development, `?mode=api` forces the production path and the default dev Home keeps `features/home/BlazerHome.tsx` available as a UI-first preview. The preview's isolated styles/assets do not replace production behavior or the shared shell.

## Storefront metadata

The human-readable `/sitemap` page groups API-backed categories, published collections, brands with published products, and published CMS pages; the Laravel `/sitemap.xml` remains the machine-readable index.

The Storefront document ships Vietnamese NÉT Studio title, description, theme color, favicon, and Open Graph/Twitter image defaults. Client navigation updates title, description, and social preview for product, collection, and published content pages, applies public store SEO values when configured, and writes a canonical URL for the current route. The home page emits Organization/WebSite/SearchAction JSON-LD; product detail emits Product/AggregateOffer data from API price and stock values; resolved category and collection listings emit CollectionPage/ItemList data from their published metadata and visible API products; published CMS pages emit WebPage data with their canonical URL and API timestamps. The Laravel host exposes `/sitemap.xml` with published products, active categories and collections, and published information pages; `/robots.txt` points to that sitemap. Both use `STOREFRONT_URL` for canonical public links. Production hosting must proxy the storefront's root SEO paths to these Laravel routes.

The Storefront uses the regular Vite SPA build (`npm run build`). Build-time crawler snapshots and their helper scripts were removed at the project owner’s request; public pages render in the browser. Laravel continues to expose the XML sitemap and robots routes.

CMS page HTML is allowlisted when saved and when serialized by Laravel, then sanitized again by the Storefront before `dangerouslySetInnerHTML`. The Admin editor also sanitizes unsaved HTML before its live preview. Both client allowlists match the API's formatting tags and strip every attribute; scripts, embeds, SVG, and other unsupported elements are removed. Production hosting must define a Content Security Policy using the deployed API origin; server configuration is maintained outside this repository.

The Storefront banner query is enabled only while `/` is active. Category/collection navigation and published footer links remain shared across routes, so their queries stay available in the app shell.

Customer order history reads URL-backed status, code/product search, date, and page filters through the authenticated orders endpoint. The API applies those filters before pagination and scopes every result to the current customer.
