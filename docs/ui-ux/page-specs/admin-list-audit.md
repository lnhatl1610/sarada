# Admin list and table audit

Audit basis: TypeScript AST inspection of all 41 `DataTable` call sites under `admin/src`, followed by source inspection of the shared table and the identified list implementations. This is source evidence; no runtime or visual check was performed.

## Server-paginated lists

All 21 server-paginated table instances provide server totals, current page, page size, and sort state to the shared `DataTable`. Their list requests and query/effect dependencies follow the active page size and sort/filter state.

| Screen | Source | Evidence |
|---|---|---|
| Products | `admin/src/App.tsx` | Server pagination, shared page-size control, URL-backed filters/sort, controlled selection and bulk actions. |
| Orders | `admin/src/App.tsx` | Server pagination, shared page-size control, URL-backed filters/sort, controlled selection and bulk actions. |
| Inventory | `admin/src/App.tsx` | Server pagination, shared page-size control, URL-backed filters/sort, permission-gated selection and adjustments. |
| Reviews | `admin/src/App.tsx` | Server pagination, shared page-size control, URL-backed filters/sort, shared selection and bulk moderation capped at 100. |
| Personal activity | `admin/src/features/account/AccountActivityPage.tsx` | Server pagination, page-size preference, URL-backed filters/sort and account-scoped presets. |
| Login sessions | `admin/src/features/account/AccountSettingsPage.tsx` | Server pagination, page-size preference and URL-backed page/sort; API keeps the current session first. |
| Admin activity log | `admin/src/features/activity/ActivityLogsPage.tsx` | Server pagination, page-size preference, URL-backed advanced filters/sort and CSV export; filters, audit-detail labels and known module/action enums follow the selected locale. Audit values and paths remain verbatim. |
| Coupons | `admin/src/features/campaigns/CampaignPage.tsx` | Server pagination and URL-backed sort; coupon usage history also follows the shared page-size preference and sort. |
| Collection product search | `admin/src/features/catalog-options/CollectionProductsPage.tsx` | Server-paginated product search, URL-backed sort, shared selection and page-size control. Assigned products are a bounded manually ordered collection. |
| Catalog references | `admin/src/features/catalog-options/ReferenceDataPage.tsx` | Server pagination, URL-backed sort where the resource supports it, URL-backed filters, and advanced filters for categories/collections. Tree/reorder mode retains its drag ordering. |
| Tags | `admin/src/features/catalog-options/TagsPage.tsx` | Server pagination, URL-backed sort, shared selection and merge action. |
| Content pages | `admin/src/features/content/ContentPagesPage.tsx` | Server pagination, URL-backed title/status/update-time sort and URL-backed filters; editor, validation, template selection, preview, list actions and feedback follow the selected admin locale. Storefront starter-page content remains Vietnamese. |
| Customers | `admin/src/features/customers/CustomersPage.tsx` | Server pagination, URL-backed advanced filters/sort, URL-backed filters and export. |

Customer CSV export controls, queued-export notices, and failures follow the selected admin locale.
| Inventory movements | `admin/src/features/inventory/InventoryMovementsPage.tsx` | Server pagination, URL-backed advanced filters/sort and URL-backed filters. |
| Operations lists | `admin/src/features/operations/OperationsPage.tsx` | Shared server-paginated table and URL-backed sort for payments, shipments, movements, staff, carts and wishlists; applicable advanced filters use the shared Sheet. |
| Shipping methods | `admin/src/features/shipping/ShippingMethodsPage.tsx` | Server pagination, page-size preference, URL-backed search/sort and URL-backed filters. |
| Shipping rates | `admin/src/features/shipping/ShippingRatesPanel.tsx` | Server pagination, page-size preference, URL-backed search/status/sort and URL-backed filters. |
| Staff records | `admin/src/features/staff/StaffPage.tsx` | Server pagination, page-size preference, URL-backed filters/sort. |
| Staff invitations | `admin/src/features/staff/StaffPage.tsx` | Server pagination, page-size preference, URL-backed search/sort and URL-backed filters. |
| Staff approvals | `admin/src/features/staff/StaffPage.tsx` | Server pagination, page-size preference, URL-backed search/sort and URL-backed filters. |

## Shared behavior and bounded tables

- `admin/src/components/shared/data-table.tsx` exposes the 10/20/50/100 page-size selector, visible row range/total, sort controls, loading/empty/error/retry states, account-scoped column visibility, controlled selection, page-level select-all, and Shift-click range selection.
- The shared table pins the first visible data column on the left and recognized action columns on the right; explicit `pin` metadata is also supported.
- Product detail variant rows are an in-record editor table, not a separately paginated list.
- The 19 report tables show bounded report aggregates from their report response; they do not represent independently paginated record lists.
- The remaining `DataTable` instances are report aggregates and a product variant snapshot. They have no independent record-list pagination requirement.

## Result

The shared list/table criterion is covered by the source audit above. Form primitive adoption remains a separate open requirement in `specs/18-admin-shell-design-system/spec.md` and needs its own form-by-form audit.
