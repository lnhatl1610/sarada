# Career openings

Requirements: FR-CMS-003, NFR-A11Y-001.

## Scope

- Staff with `content.manage` manage career openings independently from the informational CMS `careers` page.
- An opening has a title, department, location, employment type (`full_time` or `part_time`), optional summary, description, optional requirements and benefits, active/publication state, and display order.
- The Storefront `/careers` page combines the published CMS introduction with active openings, supports department and location filters, and gives each opening a keyboard-operable details disclosure.
- The public API returns active openings only and provides filter options derived from active records.
- Application forms, CV uploads, applicant records, notifications, reviewer access, and retention/deletion are explicitly out of scope until the store approves those rules.

## API

- `GET /api/v1/careers`: optional `department`, `location`, `page`, and `per_page`; returns active openings, current department/location facets, and pagination metadata.
- Admin CRUD: `GET|POST /api/v1/admin/career-openings`, `PATCH|DELETE /api/v1/admin/career-openings/{opening}`. All routes require the Admin audience and `content.manage`.
- Validate bounded text, employment type, status, pagination, and nonnegative display order. Never expose inactive openings publicly.

## Acceptance

- Admin can create, edit, publish/unpublish, filter, paginate, and delete openings; API errors are shown beside the form or list.
- Public listing omits inactive openings and filters correctly by each selected facet and their combination.
- Storefront provides loading, retryable error, empty, no-filter-match, and success states; filters have labels, work by keyboard, and remain usable on small screens.
- Details disclosures expose description, requirements, and benefits as text without interpreting authored strings as HTML.
- No applicant personal data is collected or stored.

## Verification

- Keep the OpenAPI contract, generated Admin/Storefront types, data model, ERD, page specification, and implementation tracker synchronized.
- Build Admin and Storefront; run Pint and `git diff --check`. Do not run tests unless explicitly requested.
