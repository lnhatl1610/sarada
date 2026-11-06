# Open Questions and Working Assumptions

To keep implementation moving, this pass uses the working choices below. They are assumptions, not user-confirmed product decisions; change the requirement/spec and create an ADR when the owner confirms a different choice.

| Question | Working assumption | Impact if changed |
|---|---|---|
| Product variants | Size + color, variant-level price; other attributes descriptive only | Schema, SKU and product form |
| Guest checkout | Allowed | Order user_id nullable; tracking requires contact match |
| Social login | Excluded from first release | Add provider linking and account merge later |
| Vietnam addresses | Current province/commune catalog from the official dated snapshot; retain legacy district codes on historic records | Address selector and API wire shape; see ADR-0012/0013 |
| Locale/currency | Storefront now defaults to English and offers an EN/VI preference; currency remains integer VND. English coverage is being translated incrementally, and English catalog/CMS source content still needs editorial review. | Formatting, catalog copy, and content workflow |
| Returns (resolved) | The store owner confirmed that authenticated customers may request a return within seven days of successful delivery. The API enforces the deadline using `orders.delivered_at`; staff review requests, and approval does not automate refunds or inventory changes. | If the store changes this policy, update the business rule, API enforcement, Storefront copy, and fixture together; refunds and returned-goods handling remain manual |
| Customer account deletion | The current Storefront flow performs soft deletion, revokes login sessions, and retains the soft-deleted row's email, name, phone, password hash, and customer role; no automatic purge/anonymization is configured. | Owner must approve the retention/anonymization period and privacy notice before production account-deletion UAT sign-off |
| Email | SMTP selected by environment | Credentials and provider-specific features are deployment configuration |
| Images | Local public disk in development; S3-compatible disk for production | Configure disk and URL lifecycle |
| Deployment | Dockerized VPS with Nginx as documented target | Adapt secrets, host, CI/CD and scaling to actual provider |
| Search | MySQL FULLTEXT initially | Search adapter can move to Scout/Meilisearch |
| Shipping | Fixed fee/free-shipping threshold by province | Replace rate source for carrier integration |
| Brand/design | Editorial neutral fashion identity, warm ivory/ink with muted burgundy accent | Replace tokens/assets if brand guide is supplied |
| Account menu plan scope | Implement all plan priorities in order; P3 work remains sequenced after P0–P2 | Larger delivery; features requiring external credentials remain unavailable until configured |
| Account menu system group | Keep the system group in the account menu as the plan specifies and hide entries without permission | Move to sidebar only if the admin navigation is redesigned later |
| Account menu language | Keep the current Vietnamese-only interface through P2; treat P3 English as a later localization phase from the plan | Full translation requires localization infrastructure and string review |
| Account menu workspace | Keep private tasks and reminders; optional notes and bookmarks were removed in migration `2026_11_04_000002` | Tasks remain in `user_tasks`; no schema/API/UI for private notes or bookmarks |

