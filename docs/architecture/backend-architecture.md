# Backend Architecture

## Application structure

The backend is a Laravel 13 modular monolith: modules share one codebase and deployment, while Admin and Storefront remain separate HTTP/JSON clients. Public endpoints use `/api/v1`; staff endpoints use `/api/v1/admin`. Authentication and API contracts are documented in [auth/RBAC](auth-rbac.md) and [API conventions](api-conventions.md).

Keep Laravel's standard application directories (`app`, `bootstrap`, `config`, `database`, `public`, `resources`, `routes`, `storage`, and `tests`). Composer maps the `App` namespace to `app/`; modules therefore use namespaces such as `App\Modules\Catalog`. Database migrations, seeders, and factories stay in the application-level `database/` directory.

Module folders may contain `Actions`, `DTOs`, `Enums`, `Events`, `Exceptions`, `Http`, `Listeners`, `Models`, `Policies`, `Providers`, `Repositories`, `Routes`, and `Services` as needed. Existing application-level `app/Http`, `app/Models`, `app/Services`, `app/Support`, and `app/Shared` also remain in use; the module template does not imply that every class has already moved into a module or that every feature needs every folder. Repositories are useful for a meaningful data-access contract, not mandatory wrappers around Eloquent.

## Request layers
Route/middleware → Form Request → thin controller → domain Action/Service → Eloquent transaction/models → API Resource. Jobs, events, and listeners handle non-critical post-commit work such as email and rating aggregation.

- Routes map HTTP methods and URLs; middleware handles authentication, audience checks, throttling, and other cross-cutting concerns.
- Form Requests validate and normalize input; controllers delegate business operations and return Resources.
- DTOs carry explicit typed input when useful. Actions implement individual use cases; services coordinate cohesive reusable rules.
- Models define persistence, relationships, and casts. Resources select public JSON fields and omit credentials and internal data. Policies authorize resource-specific actions.
- Validation and business errors follow the shared API error contract; business logic does not depend on request objects.

When changing backend code, inspect neighboring code, configuration, and existing tests first; preserve established project conventions unless correcting a correctness or security defect. Confirm version-sensitive framework APIs against the installed Laravel version. Prefer framework features and existing abstractions, and add a new abstraction only for a clear domain boundary, meaningful duplication, or independently testable behavior.

## Domain modules
Current module directories are `Identity`, `AdminAccess`, `Announcements`, `Catalog`, `Cart`, `Checkout`, `Orders`, `Inventory`, `Marketing`, `Membership`, `Promotions`, `Shipping`, `Payments`, `Reviews`, `Reporting`, and `Support`. Module routes live in `app/Modules/<Module>/Routes/api.php`. Keep business code with its owning domain and place genuinely shared primitives in the existing support/shared locations.

Identity/AdminAccess own accounts and access; Catalog owns product presentation data; Inventory owns stock writes; Cart and Checkout prepare purchases; Orders owns order snapshots and transitions; Payments and Shipping own their respective payment and delivery workflows; Promotions, Marketing, and Membership own their corresponding commercial flows; Reviews, Reporting, Announcements, and Support contain their domain behavior. Use published domain service boundaries for cross-module work and document exceptions.

## Actions and services
Use an Action for a single business operation (`PlaceOrderAction`, `CancelOrderAction`); use a Service for cohesive reusable domain calculations (`PriceCalculator`, `CouponService`, `OrderStateMachine`). Keep DTOs explicit. Avoid generic repositories that only wrap Eloquent.

## Transactions and events
Checkout locks variant inventory rows, validates current stock/prices/coupons, writes order snapshots/usages, reserves stock through `InventoryService`, and clears the cart atomically. Order transitions also delegate reservation release, completed sales, and returns to that service within the status transaction. Product creation initializes stock through the same service. Dispatch email/event work after commit; inventory quantity and movement writes belong only to `InventoryService` (with `AdjustInventoryAction` as the admin operation boundary).

## Queries, cache, queues
Whitelist filters and sorts; eager-load resources; use database indexes and bounded pagination. Use cache only with explicit invalidation. Queue email/image processing; jobs must be retry-safe.

Avoid hidden N+1 queries during resource serialization. Use configuration files for `env()` access and read values through `config()` elsewhere. Set explicit timeouts for outbound HTTP calls, use framework fakes for external effects in tests, and dispatch transactional events after commit. Scheduled work that can overlap must use an appropriate overlap lock; queue reservation time must exceed the job timeout.

The fixed weekly admin report is scheduled for Monday at 08:00 in the application timezone. User-configured daily and weekly admin digests are checked every minute and sent at each admin's profile timezone. Digest content is permission-filtered, and a per-user period marker prevents duplicate delivery.

## Dependency boundaries
HTTP controllers depend on domain actions. Domain modules may share stable contracts/support services but should not reach into another module's internal models/actions. Document exceptions in an ADR and enforce with available static tooling when the application is wired.
