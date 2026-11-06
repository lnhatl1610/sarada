# Tasks: Catalog

- [x] Implement category, brand, attribute, product, image, variant and inventory schema.
- [x] Implement public catalog queries and admin CRUD with permissions.
- [x] Add filter/sort/pagination contract and generated frontend types.
- [x] Build product administration and shopper catalog/detail experiences.
- [x] Update the API contract, architecture docs, and catalog traceability.
- [x] Add a permission-gated per-row product publish/hide switch backed by the authorized product update API.
- [x] Render product featured/new flags and variant active state as keyboard-accessible switches in create/edit forms.
- [x] Show sale price with the matching variant comparison price during an active sale window.
- [x] Add product-wide optional sale start/end datetimes and apply the effective price consistently to storefront catalog, price filters/sorting, cart, checkout, and manual orders; preserve order-item price snapshots.
- [x] Filter products marked as new through the persisted admin list state and authorized API query.
- [x] Show live search-result previews and character guidance for product SEO fields in create/edit forms.
- [x] Add a create-form save-draft action that persists the product and its initial variants with draft status.
- [x] Add product tags with normalized slugs, a many-to-many pivot, API validation, and editable create/detail fields.
- [x] Add customer-owned price-drop alerts to PDP/wishlist and account-email restock subscriptions from PDP/wishlist; schedule one queued email after an effective VND price falls below the captured baseline.
- [x] Add moderated product Q&A: authenticated customer submissions, paginated answered-only public PDP questions, and permission-gated Admin answer/hide controls.
- [x] Support moderated customer review video alongside photos; expose approved video only in public reviews and render media in Admin moderation.
