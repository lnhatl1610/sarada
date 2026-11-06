# Admin tags

Route: `/tags`. Product managers with catalog permissions can search tags by name or slug, review product usage counts, create and edit tags, and merge selected source tags into one target. A merge transfers each source tag's product associations without duplicates and then removes the source tags in one transaction.

The list stores its search and page in the URL. It provides loading, error/retry, empty, and no-match states. Write controls are hidden without their corresponding permission; the API enforces the same permissions.

The API contract is documented in `api/openapi.yaml` under `/admin/tags`.
