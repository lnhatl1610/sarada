# Admin catalog reference data

## Categories

- Provide tree and table views, with the selected view and filters stored in the URL.
- Search by category name and filter by active state, root categories or a direct parent, and whether products are assigned.
- The tree view supports changing sibling order and moving a category under another category or back to the root. Disable reorder while filtered or paginated so a partial result cannot overwrite the full order.
- The table view uses server pagination and shows name, parent, slug, product count, status, and row actions.
- Create and edit allow a parent, sort order, image URL or JPG/PNG/WebP upload (2 MB maximum) with preview, description, slug, SEO title/description, and active state. Category image uploads use the authenticated admin upload endpoint and require catalog create or update permission. Prevent choosing the edited category or one of its descendants as its parent.
- Block deletion while products or child categories remain assigned; tell the administrator to move them to another category first.
- Show loading, empty, no-match, and retry states in both views.
- Translate tree controls, drag-and-drop instructions, accessible names, filters, form fields, upload guidance, validation, confirmations, and feedback with the selected admin language. Keep category names and other saved catalog values as entered.

## Brands

- Show logo, name, slug, product count, active state, and row actions. Search by name and filter by active state.
- Create and edit support a validated JPG/PNG/WebP logo upload (2 MB maximum) with URL fallback and preview, description, SEO title/description, and active state.
- Logo upload uses the authenticated admin upload endpoint and requires catalog create or update permission.
- Translate table controls, form fields, logo upload guidance, status labels, validation, and feedback with the selected admin language; keep saved brand values unchanged.

## Color and size values

- Color values show a color swatch, value, hex code, variant usage count, and order. Editing uses a native color picker and order field; the sortable view reorders values without changing their IDs.
- Size values show the value, attribute group (for example, shirts or shoes), variant usage count, and order. Create/edit can select an existing group by name or add a group; sorting only reorders values within the same group.
- Do not allow deletion of colors or sizes that are referenced by product variants.
- Translate sortable controls, group and usage labels, forms, validation, and feedback with the selected admin language; keep saved color and size values unchanged.

## Product tags

- Search and paginate tags by name/slug, show product usage counts, and allow permission-gated creation/editing and merge of selected duplicate tags into a chosen target.
- The admin page translates labels, validation, loading/error/empty states, selection accessibility names, and save/merge feedback using the selected admin language. Tag names and slugs remain user-authored values.

## Collections

- Show banner, name, product count, schedule, derived status (running/upcoming/expired/disabled), and row actions.
- Search by name; filter by derived status and an inclusive date range. The range includes collections whose schedule overlaps the selected dates.
- Create/edit supports description, banner URL or upload with preview, start/end time, active state, and SEO metadata. Banner upload accepts JPG/PNG/WebP up to 2 MB.
- Preserve collection product membership management at `/collections/:id/products`, including URL-backed, debounced server search with saved search/sort presets, pagination/sorting for products that are not already assigned, attaching selections across result pages, drag ordering of assigned products, individual removal, and confirmed bulk removal (up to 1,000 products). Removal updates only collection membership; it does not delete products or inventory.
- Translate collection filters, schedule/status labels, banner controls, forms, validation, confirmations, and feedback with the selected admin language; keep collection content as entered.
- The membership page localizes search, loading/empty/error states, selection counts, reorder/remove controls, success feedback, and individual/bulk confirmation dialogs using the selected admin language. Keep accessible names on selection, drag, and remove controls descriptive of their product.
