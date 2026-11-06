# Vision and Scope

## Vision
Run a Vietnamese single-vendor fashion shop through a storefront and staff admin, backed by one Laravel API. Customers browse products and place COD orders; staff manage catalog, stock, orders, promotions, content, and reports.

## Users
- Guest shopper: browse, maintain a guest cart, checkout without an account, and track an order using order code plus phone/email.
- Customer: manage profile, addresses, wishlist, orders, and verified-purchase reviews.
- Staff: process orders and inventory within granted permissions.
- Manager/content editor/super admin: manage the capabilities assigned to their roles.

## First release scope
Authentication, RBAC, catalog with size/color variants, product images, inventory, guest/member carts and merge, checkout preview, COD order placement, order lifecycle, customer cancellation and seven-day return-request intake with staff review, coupons, customer account/address/wishlist/reviews, content pages/banners, admin operations, dashboard/reporting, email notifications, and deployment documentation.

## Outside first release
Online payment gateways, carrier API integrations, multi-vendor, multi-currency, social login, automated refunds and advanced returns handling, 2FA, Meilisearch, and full SSR. Keep extension points where the architecture already calls for them.

## Constraints and measures
- Vietnamese UI and VND integer amounts.
- Single store, one coupon per order, COD initially.
- Prioritize money/inventory correctness, then security, catalog performance, maintainability.
- Target NFRs are listed in `non-functional-requirements.md`; validate them with environment-specific measurements before production claims.

## Assumptions
Use size and color variants with variant-level pricing; allow guest checkout; use the current Vietnamese province/commune address catalog with legacy district fields retained for old records; use MySQL FULLTEXT initially; configure SMTP via environment; use local public storage for local development and an S3-compatible disk in production; province-level fixed shipping fee; return requests are accepted within seven days after delivery and reviewed manually, with refunds and returned-goods processing left to staff; social login and multi-currency remain later scope. See ADR-0012/0013 and `open-questions.md`.
