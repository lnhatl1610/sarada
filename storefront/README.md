# Sarada Storefront

React, Vite, and TypeScript storefront for the Sarada monorepo. The UI is Vietnamese and all authoritative catalog, price, stock, shipping, coupon, and order data comes from the Laravel API.

## Local setup

1. From the repository root, install dependencies with `npm install`.
2. Optionally copy `storefront/.env.example` to `storefront/.env` and set `VITE_API_URL` when the API is on another host. If omitted, the app uses port 8000 on the hostname used to open the Storefront, keeping refresh-cookie requests same-site.
3. Start the full local workspace from the repository root with `npm run dev`, or run only this SPA with `npm --prefix storefront run dev`.

## Build and lint

Run these commands from `storefront/`:

- `npm run lint`
- `npm run build`

`npm run build` produces the regular client-rendered SPA and does not require a reachable API.

## Production build

Use `npm run build` for the client-rendered SPA. Build-time SEO snapshot generation was removed with the scripts directory. Configure the public API and Storefront HTTPS origins for production.
