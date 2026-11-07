# Glossary

- **Career opening**: A published job listing with a role, department, location, employment type, and store-authored description; it does not represent an application or applicant record.

- **FAQ**: A store-maintained question and answer shown publicly when active, grouped under a topic such as ordering or delivery.

- **SKU**: unique stock-keeping identifier for one sellable product variant.
- **Variant**: a purchasable combination such as product + size + color.
- **On-hand quantity**: physical units recorded in inventory.
- **Reserved quantity**: units held by placed, not-yet-finalized orders.
- **Available quantity**: on-hand minus reserved.
- **Snapshot**: immutable order-time copy of product, variant, price, and shipping address data.
- **Guest cart token**: random identifier for a guest cart; it is not an authentication token.
- **Access token**: short-lived signed JWT bearer credential sent in the Authorization header and held in memory by the browser. Its audience is `admin` or `storefront`, and its `sid` claim identifies the revocable session row (ADR-0001).
- **Refresh token**: opaque, rotating credential in an httpOnly cookie; only its hash is persisted.
- **Audience**: token context (`admin` or `storefront`) checked by API middleware.
- **COD**: cash on delivery.
- **FR / NFR / BR**: functional requirement / non-functional requirement / business rule.
- **Permission**: named action such as `orders.update_status`, granted to a role or user.
- **Personal task**: a private work item owned by an admin, or assigned to that admin by another staff member with `tasks.assign`.
- **Personal note**: private text saved by one admin for their own reference.
- **Bookmark**: a saved admin destination or record link owned by one admin.
