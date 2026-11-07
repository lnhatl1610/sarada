# Storefront UI-first preview

Purpose: build and review storefront screens with local fixture data before wiring their page content and interactions to the API.

## Development routes

- `/` — editorial home preview; use `/?mode=api` to open the current API-backed home.
- `/products?mode=ui` — catalog preview with local category, price, and sort controls.
- `/products/:slug?mode=ui` — product detail preview with local color, size, quantity, favorite, and accordion controls.
- `/cart?mode=ui` — cart preview with local quantity, remove-item, coupon-message, and empty states.
- `/checkout?mode=ui` — checkout preview with local fulfillment/payment choices, native required-field validation, and a non-persisted completion state.

The preview routes are enabled only in Vite development mode. `StorefrontApplication` selects them before mounting the connected storefront component, so cart, catalog, account, configuration, analytics, and session API hooks are not initialized for these screens. Fixture interactions are in-memory and do not persist or create orders. Fixture products and images are for layout review; avoid presenting fixture values as verified store inventory, reviews, promotions, delivery terms, or payment availability. The production routes and existing API-backed pages remain separate.

The editorial home preview footer uses a full-width white surface and a constrained inner container. Its five desktop groups become three columns at tablet widths and two at mobile widths. Keep the preview footer layout explicitly scoped so the shared storefront footer grid rules cannot constrain its container.

## Screen order

1. Home — implemented.
2. Catalog and product detail — implemented.
3. Cart and checkout — implemented.
4. Login, registration, and customer account.
5. Search, collections, editorial content, tracking, and supporting pages.
6. Review the shared shell, keyboard behavior, and responsive layouts across the complete screen set.
7. Connect the approved screen designs to their existing API contracts and replace fixture data/actions.

## Acceptance for each preview screen

- The primary layout and responsive behavior are visible with local data and imagery.
- Core controls respond locally and clearly disclose actions that do not persist.
- No page-specific API request is needed to render the preview.
- No invented stock, customer reviews, live promotions, shipping terms, or payment availability is presented as store data.
