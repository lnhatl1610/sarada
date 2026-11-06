# Component Patterns

- **Forms:** visible label, optional/required indication, inline field error, disabled pending state, disable Save until values change, and warn before discarding dirty forms or leaving the page. Use the shared unsaved-form guard so in-app route changes, browser Back, and tab close are covered. For custom-state editors, compare the draft to its saved baseline and use the same guard; dialog close/cancel controls should confirm before discarding.
- **Data tables:** server-side paging/sort/filter, debounce search, preserve filters in URL, selectable rows only when bulk action is available, and an explicit empty state. Sortable headers cycle ascending → descending → default order.
- **Admin locale:** shared tables, saved-filter controls, advanced-filter sheets, the date-range picker, filter toolbar, confirmation dialog, image uploader, statistics/loading states, sidebar trigger, global search, notification controls, and the fatal-error fallback use the selected Vietnamese or English locale, including accessible names and loading/empty/error copy. Number and date formatting follows the locale.
- **Dialogs:** use a confirmation dialog for destructive actions; focus returns to the trigger after close.
- **Mobile filters:** open in a bottom Sheet with apply/reset actions; show applied filter chips.
- **Advanced list filters:** keep one to three frequent criteria in the quick toolbar and move secondary criteria into the shared right-side Sheet. Draft values apply together as one URL history entry; reset returns the draft to defaults, and applied criteria remain represented by removable chips.
- **Product card:** 3:4 image, second-image hover on pointer devices, variant swatches, sale/new labels, accessible wishlist button.
- **Cart:** the header bag trigger opens a side drawer; it links to checkout or the full `/cart` page. The drawer and full cart page share line-item quantity/removal controls, stock warnings, and API-synchronized state.
- **Notifications:** toast for success, inline/banner for recoverable errors, persistent page state for critical failures.
- **Loading:** skeletons preserve layout; use `aria-busy` for substantial async regions.
