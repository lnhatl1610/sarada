# Storefront Gift Card Page

Route: `/gift-cards`.

## Interface

- Match the Storefront's minimal fashion editorial style: restrained color, serif display heading, fine dividers, generous spacing, and a sticky desktop preview.
- Let the shopper choose the plan's 200,000₫, 500,000₫, 1,000,000₫, or a custom amount.
- Offer three card designs, recipient name and email, an optional message limited to 240 characters, and an optional future send date.
- Keep the preview synchronized with the selected value and recipient details. The card can be flipped with a button; reduced-motion preferences disable the flip animation.
- On small screens, show the preview before the form and use touch-sized controls.
- Native required/email/number/date validation keeps errors attached to the relevant input.

## Commerce boundary

This page is currently an interactive UI preview only. It must not create an order, issue value, send an email, or claim successful payment. The confirmation explicitly says no gift card or order was created. Do not enable purchase until the owner approves issuance, balance, expiry, refund, and redemption policy and the corresponding API/Admin flow is implemented.

The route is excluded from search indexing while it remains a preview.
