# Spec: Cart and Merge

## Goal
Guests and customers can maintain a cart; after login, guest lines merge into the authenticated cart without exceeding availability.

## Requirements
FR-CART-001..002, BR-CART-001.

## Acceptance criteria
- [ ] Add/update validate active variants and positive integer quantities; remove is scoped to the caller's cart; the combined line quantity is at most 20.
- [ ] Each cart contains one line per variant and quantity cannot exceed available stock, including when inventory or cart changes run concurrently.
- [ ] Merge is idempotent, caps quantities at 20 and available stock, removes invalid/unavailable lines, and returns the canonical cart.
- [x] Guest recovery email requires explicit consent, can be updated or withdrawn from a non-empty cart, and is cleared when the cart empties, expires, or checkout succeeds.

## Data
Carts and cart_items; `unit_price_snapshot` is informational only and refreshed from server data.

## API contract
`GET /cart`, `POST /cart/items`, `PATCH|DELETE /cart/items/{id}`, `POST /cart/merge`, `PUT|DELETE /cart/recovery-contact`.

Each cart product summary includes the selected image URL and its accessible `image_alt` text. Storefront preserves that alt text and uses a neutral pending-photo description when the URL or alt is missing; it must not label a placeholder as a product illustration. Storefront reads and caches the canonical cart in TanStack Query with separate guest/customer keys; logout clears customer cart data.

## Screens/routes
Storefront header bag trigger opens the mini-cart drawer; the drawer links to `/cart` for full cart editing and `/checkout` when the cart is synchronized and available.

## Constraints and exceptions
Guest token is not an auth credential; API must prevent cart enumeration.

Cart recovery sends email at one and 24 hours after inactivity. Signed-in customers must be active and have explicitly subscribed to newsletter email. Guests can enter an email and explicitly consent on a non-empty cart; the guest can update or withdraw that contact from the same cart. Each cart activity restarts both reminder stages. Empty or expired carts, inactive customers, and carts without the required consent are excluded. Zalo delivery is not supported.

The guest recovery address is returned only with that guest's canonical cart response and is cleared when its last item is removed, the cart expires, checkout succeeds, or consent is withdrawn. The guest cart token remains an identifier, never an authentication credential.

## Out of scope
Saved carts across multiple devices for guest users.
