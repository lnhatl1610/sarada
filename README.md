# NÉT Sarada

Architecture documentation: [index](#architecture) · [system overview](docs/architecture/system-overview.md).

Fashion commerce workspace with three applications: a Laravel API, a React admin console, and a React storefront. Product and business decisions are recorded under [`docs/`](docs/requirements/README.md); feature specifications and implementation tasks live under [`specs/`](specs/_templates/spec.md).

## Local development

### First-time setup

1. Install PHP 8.3+, Composer, Node.js/npm, and MySQL on Windows, then start one MySQL service. Create a database named `fashion_store` (or update the API database settings). If port 3306 is already occupied, use the existing MySQL service or change `DB_PORT`; do not start a second MySQL server on the same port.
2. In `api/`, copy `.env.example` to `.env`, set the local database credentials, and set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` for the first active super-admin account before seeding. Then run `composer install`, `php artisan key:generate`, `php artisan jwt:secret`, and `php artisan migrate --seed` from `api/`.
3. From the repository root, run `npm install`, `npm --prefix admin ci`, and `npm --prefix storefront ci`.

### Start all applications

Run this from the repository root:

```powershell
npm run dev
```

The root script starts five processes together: API, Admin, Storefront, the database queue worker, and Laravel scheduler. Open the Storefront at http://localhost:5173, Admin at http://localhost:5174, and API at http://localhost:8000. Press Ctrl+C in the root terminal to stop the group. The apps use strict ports; if one is occupied, stop the conflicting process or change the corresponding app configuration before starting.

MySQL runs as a local Windows service. The local API uses the database queue, so Redis is optional. Mail is written to the Laravel log by default; configure Mailpit in `api/.env` when you need to inspect outgoing messages locally. There is no fixed default super-admin login: `DatabaseSeeder` creates the first `Store Administrator` account from `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`. If migrations/seeding have already run, set both values in `api/.env` and run `php artisan db:seed` from `api/`; the seeder only creates that account when the email does not already exist, so it will not reset an existing account's password.

The local/testing permission-limited demo staff account is `demo.staff@example.test`; its password comes from `STORE_DEMO_STAFF_PASSWORD` (the example local value is `StoreDemo123!`). It is created only when an admin seed account exists and must not be used outside local/testing. The local storefront demo customer is `demo.customer@example.test` with password `StoreDemo123!`. `php artisan migrate --seed` creates the local demo data; run `php artisan db:seed --class=StorefrontOrderDemoSeeder` from `api/` to refresh the sample customer and orders. Demo credentials are for local development only; configure unique secrets for other environments.

The local demo catalog uses photorealistic AI-generated garment-only product photos (no models or illustrations), clearly labeled “Ảnh AI demo”. These are presentation assets, not verified photos of store inventory; replace them with owner-provided item photos before representing the catalog as real stock. Products without a demo photo use the neutral “real photo pending” placeholder. Neutral campaign/category graphics and the sample campaign video are demo assets; review them before using them as production brand content. Open `docs/ui-ux/mockups/storefront-assets-review.html` to review the current media batch.

Read-only local schema/API/media coverage audit (from the repository root):

```powershell
npm run audit:demo-data
```

This aggregate command compares the local database schema with `fashion_store_schema.sql`, then audits Storefront, Admin, and media fixtures. The Admin audit checks that an active Admin account exists and, when `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` are configured, verifies their match against an active super-admin without displaying either value. The command uses the database configured in `api/.env` and does not create or update records.


## Current implementation

- The Laravel API serves Storefront catalog, cart, checkout, accounts, order tracking, cancellation/return requests, reviews, newsletter, CMS, and address lookup, plus permission-gated Admin catalog and store operations.
- The Storefront has home, search/catalog, product detail, cart, COD checkout, customer account, wishlist, reviews, published pages, and order tracking. Admin includes product/media management, catalog, orders, customers, inventory, reports, staff/security, settings, content, and system operations.
- Local demo coverage is audited by the three commands above. The demo includes neutral campaign/category/collection media, a video, and explicitly labeled photorealistic AI garment photos for UAT; these are not verified store inventory photos and must be replaced with owner-confirmed item photos before production merchandising.
- `PROGRESS.md` records remaining implementation and acceptance gates. No production credentials belong in this repository.

## Architecture

Bắt đầu từ [tổng quan hệ thống](docs/architecture/system-overview.md) để hiểu các thành phần, trách nhiệm và luồng xử lý.

- [Frontend và quy tắc triển khai UI](docs/architecture/frontend-architecture.md): cấu trúc React, thư viện, state, form, component và checklist UI.
- [Backend](docs/architecture/backend-architecture.md): module Laravel, controller, action/service và ranh giới nghiệp vụ.
- [Mô hình dữ liệu](docs/architecture/data-model.md): bảng, quan hệ và quy tắc dữ liệu.
- [Quy chuẩn API](docs/architecture/api-conventions.md): request, response, validation và hợp đồng API.
- [Đăng nhập và phân quyền](docs/architecture/auth-rbac.md): JWT, refresh cookie, vai trò và quyền.
- [Bảo mật](docs/architecture/security.md): bảo vệ hệ thống và dữ liệu.
- [Tích hợp](docs/architecture/integration.md): email, lưu trữ, thanh toán và vận chuyển.
- [Hiệu năng và cache](docs/architecture/performance-caching.md): truy vấn, cache và hiệu năng.
- [Giám sát](docs/architecture/observability.md): log, lỗi và tình trạng hệ thống.
- [Triển khai](docs/architecture/deployment.md): môi trường, build, vận hành và phát hành.
- [Sơ đồ C4](docs/architecture/c4-diagrams.md): các góc nhìn kiến trúc.
- [Cây thư mục Markdown](docs/architecture/directory-structure.md): danh mục tài liệu trong repository.

Tài liệu liên quan: [ADR](docs/adr/), [luồng nghiệp vụ](docs/business-flows/), [UI/UX](docs/ui-ux/), [yêu cầu sản phẩm](docs/requirements/README.md) và [đặc tả tính năng](specs/).
