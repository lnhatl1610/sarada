# Admin Product Management

Product creation and detail sections, status labels, pricing, image and variant controls, validation feedback, accessibility labels, and unsaved-change dialogs are localized in Vietnamese and English. Date and VND values use the account's shared locale formatters.

The product status switch follows the active locale for its accessible action name, saving state, and status label.

The SEO search preview placeholders and rich-text editor loading and accessibility controls follow the selected admin locale.

## Product list

- Use a server-side table with 300 ms debounced search across product name/slug/SKU, status/category/brand/featured/new-arrival filters, sorting, and pagination. Preserve state in query parameters and restore it after viewing a product.
- Show thumbnail, name/slug, category, SKU, starting price in VND, active variant count, stock summary, sold count, rating, publish status, updated time, and row actions. Support both table and product-card grid views.
- The table row menu contains edit, storefront preview for active products, duplicate, and archive actions according to permissions; archive is the final destructive menu item. Storefront previews open in a new tab. Keep publish status in its dedicated quick control.
- During an active sale window, show the lowest discounted active variant price and strike through the corresponding comparison price; outside the window, show the lowest effective active variant price.
- Show a permission-gated switch on each row to publish or hide the product. Disable it while saving, announce the pending state accessibly, and retain the prior state with an error notice if the API rejects the update.
- Bulk import remains optional. The planning-specified CSV export downloads all rows matching the current filters. Bulk actions support status, featured state, category assignment, collection attachment, tag attachment, and confirmed archive; archive permission is checked separately from update permission.
- Include skeleton, empty catalog, no search results, API error/retry, and permission-denied states.
- Current API-backed list behavior: shared DataTable/FilterBar, server pagination metadata, URL-persisted filters, quick status tabs with server counts for all, active, draft, archived, and out-of-stock products, and allowlisted server filters for multiple categories, brands, and collections; featured/new-arrival state; in-stock, low-stock, and out-of-stock state; sale price; image presence; creation date; VND price range; and sort order. Counts honor the current search and advanced filters, excluding only the selected status and stock state. Search covers product name, slug, product SKU, and variant SKU. Filter options load from the catalog API. Archived soft-deleted products return with an `archived` display status. CSV export streams the entire filtered result and neutralizes spreadsheet formula prefixes.
- Product list filters, bulk actions, table and card views, accessible labels, and empty/error/loading feedback use the selected admin language. Product counts use the configured number format; prices use the shared integer-VND formatter.
- Product target-gender filter options and review-star counts use translated labels with locale-aware plural wording.

## Create/edit form

- Product details include an optional fit/silhouette value (maximum 80 characters), edited alongside material and used for the Storefront catalog filter.

- Organize the form into Basics, Classification, Media, Variants, Search preview, and Publishing sections. Show a progress/section navigation for long forms.
- Basics: required name, unique slug generated from name but editable, product SKU, base display price, and category; short/long description, brand, and tags are optional. The create and edit forms mark the required product status alongside those fields. Classification also supports attaching one product to multiple collections at creation time.
- The create and edit forms share the lazily loaded Tiptap description editor. On edit, API validation is announced beside the editor and users without update permission receive a read-only editor.
- Media: `/products/:id/images` provides multi-file upload (JPG, PNG, WebP, up to 5 MB per image) with previews, editable alt text, optional color association, primary-image selection, pointer and keyboard drag reorder, per-file retry/removal after upload failures, and remove confirmation. Seeded photorealistic AI images are labeled `Ảnh AI demo` when their alt text starts with `Ảnh AI demo:` and are for demo/UAT only; they are not confirmed photos of actual store inventory. Upload guidance and the product thumbnail URL helper explain that the store must replace demo images with store-supplied actual photos before sales. Successful files continue uploading when another file fails. Resolve relative image paths against the API origin. Alt text, color association, order, primary selection, and image removal on the product edit page are staged with the product form and saved in its transaction; binary uploads remain immediate so file progress and retry work independently. Enforce allowed file type/size, explain failures inline, and show per-file upload progress. The product description editor is loaded on demand so its rich-text dependencies are not part of the initial admin bundle.
- The image-management page localizes its controls, drag-and-drop keyboard guidance, upload progress/retry states, validation and API errors, success feedback, and removal confirmation using the selected admin language. Product names, image alt text, and file names remain user data.
- Variants: editable size × color combinations with required unique SKU and variant price, active state, and stock. Allow adding/removing combinations, flag duplicate SKU, and show effective available stock as read-only inventory data. Regenerating a matrix confirms before replacing existing variant values. Create/edit forms can apply price, comparison price, weight, and active state to all variants; both bulk-edit controls are required before the action is enabled, and creation also supports bulk initial stock. On edit, product fields and staged variant changes are submitted together in one API transaction; a new variant's initial quantity creates an inventory receipt, while existing stock stays in the inventory workflow.
- Sale schedule: optional product-wide start and end datetimes apply to discounted variants (variant price below its comparison price). If both dates are empty, existing discounts continue without a schedule; a missing start or end leaves that side open. Outside a configured window, storefront listings, variant choices, cart, checkout, and manual orders use the comparison price. The end instant is inclusive, and order item prices keep their placement-time snapshot.
- Search preview: live title, meta description, canonical slug, and character counters (`meta_title` ≤255, `meta_description` ≤500). The create and edit forms both preview the title, route, and description, with product-name/short-description fallbacks. Publishing uses `draft`, `active`, or `hidden`; archiving is a separate soft-delete action, with a clear public visibility explanation.
- Product `is_featured` and `is_new` fields and variant `is_active` use keyboard-accessible switches in create/edit forms.
- Use a responsive 65/35 two-column layout for create and edit. Keep status, featured/new flags, category, brand, audience, tags, collections, primary-image preview, and SEO preview in the sticky supporting rail; keep the active long-form section in the main column.
- Keep sticky top-header `Save`, `Save draft`, and `Cancel` actions available across tabs. The header also shows Back, product name, and status; Back and Cancel share the dirty-navigation confirmation. Save stays disabled until there are changes. Saving a draft persists the complete product form with `status=draft`. Warn before leaving when dirty. Confirm archive/delete and stock-affecting actions. Save errors beside fields; retain entered values after server validation errors.
- Product edit 422 errors for staged variants map back to their SKU/price/attribute fields when the draft is reopened; staged image metadata errors map to the corresponding alt text/color controls, and order/primary errors appear beside that image card.

## Acceptance criteria

- [x] Search, filters, sorting, and pagination reflect authorized server behavior; no unimplemented bulk-action controls are shown.
- [x] Users with `products.update` can publish or hide a product from its row; the switch exposes its state and pending update accessibly.
- [x] Product featured/new flags and variant active state render as keyboard-accessible switches.
- [x] Create/edit SEO fields enforce their documented limits and render a live title, slug, and description preview.
- [x] The product creation form provides a sticky save-draft action that submits the complete form as `draft`.
- [x] Save and save-draft stay disabled until product fields, images, colors/sizes, or variants have changed; both use the complete dirty-state calculation.
- [x] Create/edit supports categories, brands, tags, images, variants, SEO, and publishing state.
- [x] Product creation can attach up to 50 existing collections; relation changes are committed with the product and initial inventory transaction.
- [x] Product create/edit loads, validates, and saves up to 20 reusable tags; tags can be added with Enter/comma and removed from the chip list.
- [x] Image and variant rows are operable by keyboard and have accessible labels.
- [x] Dirty-form navigation warning and destructive-action confirmations are implemented.
- [x] Price and stock are displayed in VND and stock changes use the inventory workflow.
- [x] Product edit submits product fields, staged variants, and staged image metadata/removals in one API transaction.
- [x] API validation errors for product fields, staged variant fields, and staged image fields are shown with their associated controls.
- [x] Product list supports multiple category, brand, and collection filters, detailed stock state, sale/image/date filters, quick tabs, and filtered CSV export.
- [x] Bulk product actions support category assignment and additive collection/tag attachment; archive requires `products.delete` on the API.
- [x] Table and card-grid views show sale pricing, stock, sold count, rating, status controls, and permission-gated actions.
- [x] Advanced product filters are edited in a draft Sheet and applied together; search and status remain quick filters, and Back/Forward restores URL-backed list filters and page.
- [x] Applied search, status, and advanced criteria appear as individual removable chips; clear-all resets the full filter set and sort.
- [x] Product create/edit stores optional sale start/end datetimes, validates their order, and server pricing applies or expires the variant discount consistently across catalog, cart, and order creation.
- [x] Product edit uses the two-column supporting rail and a sticky title/status/action header; Back and Cancel keep the unsaved-change guard.
- [x] Create/edit applies selected price, comparison price, weight, and active state to all variants; creation also applies initial stock, while existing inventory stays on the inventory screen.
- [x] Regenerating a populated variant matrix confirms before replacing current variant data.

The product detail page uses a layout wrapper around its tab panels so the variant editor and image metadata editor remain valid independent HTML forms. The sticky Save action explicitly submits the shared product details state across tabs.
