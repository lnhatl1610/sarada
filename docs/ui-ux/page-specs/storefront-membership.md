# Storefront membership page

## Routes and access

- `/membership` is a public program page with the current tiers, earning multipliers, benefits, expiry, point conversion rule, and registration/account links. Its data comes from the public membership API.
- `/account/membership` is available only to an authenticated storefront customer and uses the shared customer-account shell.
- The account overview shows the current tier and point balance when the membership summary loads; both summary and detail page use the same customer-scoped query.

## Membership summary

- Show current tier, available points, rolling 12-month eligible spend, progress toward the next tier, and points expiring within 30 days.
- Show each tier's threshold, earning multiplier, and configured benefit text from the API. Do not hardcode tier rules in the UI.
- The ledger shows signed point changes, description, VND basis, creation date, expiration date, and expired state. Pagination requests the selected server page.
- Loading, retryable error, and empty ledger states must remain available. Checkout offers an opt-in control only to authenticated customers, shows loading/error/empty balance states, and explains that points reduce the post-coupon merchandise subtotal. The server quote is authoritative and the checkout breakdown shows points used and their VND discount.

## Current business rules

- The current implementation derives tier from paid delivered/completed orders during the trailing 12 months. Point earning is recorded once after both delivery and payment; refunds and returns write adjustment entries rather than editing prior ledger rows.
- Earned points expire after 12 months. The current default is 1 point per 10,000 VND at the base rate and 100 VND conversion value; thresholds and benefits are provisional and require store-owner approval before launch.
- A customer voucher wallet is not implemented yet. Redeemed points keep their original expiry if restored after a refund or return.
