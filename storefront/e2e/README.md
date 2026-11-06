# Storefront browser checks

Install the Chromium browser once with `npx playwright install chromium`, start the API and Storefront with the repository's `npm run dev`, then run `npm run test:e2e` from `storefront/`.

The default smoke checks only read public Storefront pages. Cart, checkout, sign-in/cart-merge, and order creation checks are skipped unless `E2E_ALLOW_MUTATIONS=true` is set. Before enabling them, point the API at a disposable test database and also set `E2E_ISOLATED_DATABASE=true`; the Playwright config refuses mutation mode without that flag. The cart-merge test additionally needs `E2E_CUSTOMER_EMAIL` and `E2E_CUSTOMER_PASSWORD` for a test customer in that database.

The stock-conflict case uses a Playwright route response to model the API's 422 cart error after a real guest cart and checkout form are prepared. It verifies the Storefront retains the entered form data and displays the server error.
