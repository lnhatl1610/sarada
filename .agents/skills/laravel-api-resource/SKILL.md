---
name: laravel-api-resource
description: Use when implementing or changing a Laravel REST endpoint, API Resource, Form Request, controller, route, pagination, or error response in this repository.
---

# Laravel API Resource

1. Read `docs/architecture/api-conventions.md`, the module route file, sibling controllers/requests/resources, and linked feature spec.
2. Confirm Laravel and package versions before using version-sensitive APIs.
3. Add a versioned route with authentication/audience/permission middleware; validate via Form Request.
4. Keep controller thin; call a domain action/service; return a Resource and stable error code.
5. Whitelist filter/sort fields, paginate with bounds, and avoid raw model serialization or N+1 queries.
6. Update `api/openapi.yaml`, generated FE types, docs, and traceability when the contract changes.
7. Use tests only when the user asks for testing/verification; format modified PHP with Pint.

See `references/error-format.md`.
