# Storefront Search

## Route and behavior

- `/search?q=` renders the catalog result page with the query, sort, pagination, and filters reflected in the URL.
- Header search debounces API-backed product suggestions and also matches loaded category and collection names.
- Recent search terms are optional browser-local convenience data. Search terms and authentication credentials are never sent to browser storage other than the query already visible in the URL.
- Selecting a product opens its product page; selecting a category or collection opens that published page; submitting or selecting a recent term opens `/search?q=`.
- Search results, suggestion errors, and empty suggestions remain distinct. A failed suggestions request does not prevent a full search.
- `/search?q=` separates product results from matching published CMS pages in accessible result tabs. Content results are server-paginated, link to the canonical page route, and expose only a title and sanitized text description.
- Search result pages and query variants are `noindex,nofollow`; canonical URLs omit search parameters.
- The API searches product name, description, SKU, brand, category, and variant color. Search is limited by the existing 120-character query validation and pagination bounds.

## Accessibility

- The input is a labeled combobox with a listbox of grouped options, an active descendant, ArrowUp/ArrowDown navigation, Enter activation, and Escape dismissal.
- Suggestions and status messages have accessible names; all mouse actions are also keyboard-operable.

## Remaining full-spec search scope

- Trending product search terms use anonymous, bounded query aggregates and typo tolerance searches only the published product catalog.
- The content results tab searches published CMS pages and published/current blog articles and links each result to its correct public route. Image and voice search remain unimplemented.
