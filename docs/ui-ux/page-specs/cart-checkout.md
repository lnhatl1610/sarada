# Cart and Checkout

## Cart

After the shopper requests a cart quote, compare each line's last synchronized unit price with the quote's server-returned unit price. If a price changed, show the product name and old/new per-item prices beside the current quote. The quote remains authoritative; do not calculate a replacement total in the browser.

- Rehydrate the canonical cart from the API on page load. Guests use the guest-cart identifier only for cart access; it is never treated as an authentication credential. Persist that identifier when browser storage is available and keep it in memory when storage is blocked. Merge guest lines after sign-in and show stock/quantity adjustments returned by the API.
- Each line shows image, product/variant, SKU where useful, unit price, editable positive quantity, available stock, line total, and remove action. Debounce or explicitly submit quantity changes; handle server rejection without losing the last valid quantity.
- The full cart has per-line selection, a select-all control, and a confirmed bulk-remove action. Removals run sequentially through the canonical cart API; successful lines leave the selection while failures remain selected and visible for retry. Busy lines cannot be removed in bulk.
- The non-empty full cart also shows up to four API-related products not already in the cart, each with an explicit in-stock variant selection and add action. Loading, retryable error, and no-eligible-products states are shown.
- Let shoppers choose another active color/size combination for the same product in the full cart. Recheck its current price and stock on the server, and merge into an existing matching line atomically.
- Full-cart lines can be saved to the signed-in customer's wishlist; the line is removed only after the wishlist API succeeds. Guests are sent through the existing login return flow, and a failed save leaves the cart line intact.
- Quantity can be typed directly; valid positive integers are debounced before saving, bounded by available stock and the business limit, and restored from the canonical API cart when rejected.
- Show coupon entry/removal, subtotal, discount, shipping, total, and progress toward the free-shipping threshold. Every total is based on the latest API quote.
- List currently active coupons from the API with server-evaluated cart and per-customer eligibility; explain unavailable reasons and apply eligible coupons through the same quote flow as manual entry.
- On a non-empty guest cart, offer an accessible email field and explicit consent for up to two recovery emails, sent after one and 24 hours of inactivity. Show the saved address and let the guest update or withdraw consent. Hide the control for signed-in customers; their reminder eligibility uses their separately stored newsletter consent.
- Empty cart includes a return-to-shopping action and up to four API-backed best sellers. Recommendation loading, retryable API failure, and no-result states are explicit. Cart loading, expiry, API error/retry, unavailable product, and adjusted-stock states are explicit.

## Checkout

- Present checkout as a three-step responsive flow: customer information, fulfillment, and payment. Keep a visible, keyboard-operable progress navigator on desktop and mobile. Only completed/current steps are selectable; the next step validates the current one. Focus the next section after transition and send validation/API errors back to the step containing the invalid fields. Respect reduced-motion preferences and keep the current server quote beside the form.
- Use a distraction-free checkout shell: hide the full storefront header, footer, and back-to-top control on `/checkout`; show the configured brand mark and a clear secure-checkout lock label above the flow, including the empty-cart state.
- Opening `/checkout` with a successfully synchronized empty cart shows the branded empty-cart state and a return-to-shopping action; it does not present a zero-total order form.
- Order success uses a brief two-second confetti accent, hides it for reduced-motion preferences, and keeps the API-returned order code and placed-at date, line items, totals, tracking action, and optional guest registration prompt visible.
- Use a single responsive page. Collect name, phone, optional email, province then commune/ward through dependent selectors, street address, and delivery note. Show only payment methods enabled by public configuration: COD and/or manually reconciled bank transfer/QR. Bank transfer instructions show a VietQR image, exact amount, bank account, order reference, expiry, copy actions, and pending/paid status; explain that payment is confirmed after store reconciliation. If payment configuration is unavailable or no method is enabled, show a retryable error or unavailable state and keep order placement disabled. Never ask customers to enter opaque address codes manually. Preserve legacy district codes only when selecting an older saved address.
- Offer an optional, unchecked email-newsletter consent alongside customer contact details. Require a valid email only when selected, submit the subscription after the order succeeds, and report subscription success/failure without undoing or blocking the placed order. Link the consent copy to the privacy policy.
- Signed-in customers can select a saved address or add/edit one inline; guests can checkout without creating an account. Show validation next to fields and preserve valid values on failure.
- Before placing an order, shoppers must explicitly accept the linked terms and privacy policy; show an inline error when they try to submit without accepting, and enforce `terms_accepted: true` in the order API.
- Preview recalculates shipping, coupon, and total on the server as address/cart/coupon/delivery-method changes. Once a province is selected, show the province-based rate plus active Admin-configured methods and their expected-time text; do not invent delivery estimates. Keep the quote summary sticky beside the form on desktop. On mobile, put it before the form in a collapsible summary that shows the current total while closed.
- Until a current checkout quote is available, do not display a client-computed subtotal or free-shipping progress as current. Show a clear quote-pending or quote-error state; summary amounts and progress use the latest server quote.
- Checkout debounces server preview after province, coupon, delivery-method, or canonical cart changes; stale preview responses are discarded and failures are shown inline. The shopper can also request a manual recalculation.
- After the shopper selects a province, show the server-configured free-shipping threshold and progress using the current API subtotal; allow retry if the threshold request fails.
- Disable duplicate submission while placing the order and send an idempotency key. On success show order code, amount, and tracking link; bank-transfer orders continue to the scoped payment instruction page. For a guest, offer account registration after the order is placed without blocking order tracking. On API failure retain the cart and explain the field/action to fix.

## Implementation notes

- Storefront now reuses the same idempotency key when the submitted order payload and cart snapshot are unchanged, including after a network failure. Editing recipient/address/coupon/note or cart contents creates a new key. The submit button is disabled while the request is in flight.
- Checkout fields use React Hook Form with a Zod schema. Client validation appears beside the field, and API validation keys for customer, address, and coupon fields map back into the same form; guests may submit without a saved address and COD is shown before submission.
- The payment-configuration query exposes loading, retryable error, and no-method states; the submit control stays disabled until at least one method is confirmed enabled by the public API.
- Successful checkout displays the order code, item and selected delivery-method snapshots, API-authoritative subtotal/discount/shipping/total, links to order tracking with the order code prefilled, and keeps the previous success URL working as an alias. Bank transfer opens the scoped instruction page and sends the snapshotted account, amount, and reference in the order confirmation email.
- The success page may show up to four current published products related to the purchased products, excluding products already in the order; recommendations have loading, retryable error, and no-results behavior and do not change order totals.
- `GET /shipping/fee` has a typed OpenAPI response for the province fee and free-shipping threshold; checkout uses that threshold instead of hard-coded campaign values.
- The checkout preview quote is cleared as province, coupon, delivery-method, or cart inputs change, then refreshed from the server after the input settles.
- Checkout lists the province-based rate and active configured shipping methods eligible for the selected province and ward. Admin can scope methods nationally, to one province, or to selected wards. The quote applies current threshold/coupon rules and revalidates the selected method under lock before order creation. The selected method name and estimate are snapshotted onto the order and shown after placement and in order details.
- The final total is shown only from a current server quote, and order submission stays disabled while the quote is missing, stale, loading, or failed.
- Checkout does not show a client-computed subtotal or free-shipping progress before a current server quote exists; it labels the subtotal as unavailable and explains how to request the quote.
- Cart reads and successful mutations replace local presentation with the canonical API response, including unit price, quantity, image, variant label, and available stock. Guest-cart merges are followed by an authenticated cart read; failed reads show retry instead of silently treating stale local storage as current.
- Cart-line photos use the shared responsive image component with descriptive alt text and an explicit illustration fallback when the API image is absent or fails.
- Cart coupon validation and subtotal/shipping/discount/grand-total preview use `POST /checkout/preview` after the shopper selects a province. Checkout refreshes the same quote when the delivery method changes. The applied coupon is carried to checkout and revalidated before order placement; edits to cart, province, coupon, delivery method, or customer hide any stale total.
- The cart loads the selected province's shipping fee and free-shipping threshold from `GET /shipping/fee`; its progress and fee display use the API response and expose loading/error/retry states.
- If live stock falls below the saved cart quantity, the cart explains the difference and offers a one-action reduction to available stock. Checkout stays disabled until the quantity is valid; failed quantity changes refresh the canonical cart.
- If a cart's server expiry has passed, the cart API clears its stale lines, renews the session, and returns `was_expired`; both cart and checkout show a recovery message. Checkout preview/order APIs reject an expired cart if called before cart state is refreshed, and the server error links back to the cart.
- Empty cart, no-result catalog, missing product, successful checkout, and email-verification screens use branded decorative illustrations from `storefront/public/illustrations/`; these assets are not product photography.

## Acceptance criteria

- The guest order-tracking result shows a carrier lookup link only when staff configured a valid HTTPS URL; the link opens in a new tab safely.
- Shipment statuses from the carrier workflow (`pending`, `picked_up`, `in_transit`, `delivered`, `failed`, `returned`) are shown with Vietnamese labels independently of the order status timeline.
- Unpaid bank-transfer guidance explains the API-returned expiry when automatic cancellation is configured; when `expires_at` is null, it does not claim the order will be automatically cancelled.

- [x] Cart state rehydrates and quantity updates use canonical API values.
- [x] Cart supports per-line/select-all selection and confirmed bulk removal through sequential API mutations, preserving failed lines and surfacing partial results.
- [x] A non-empty full cart offers up to four published related products outside the current cart, requires an available variant, and has loading/error/empty states.
- [x] Expired cart contents are cleared and surfaced to the shopper, and checkout APIs reject expired cart requests.
- [x] Quantity can be edited directly with debounced server updates, bounds validation, and canonical rollback on failure.
- [x] Cart-line image links have accessible labels and render the shared responsive fallback for missing or failed media.
- [x] Cart lines can be saved to the wishlist and removed only after the save operation succeeds; unavailable product IDs are not offered as save actions.
- [x] Full-cart lines show active color/size variants, current prices and stock; selecting a replacement revalidates server-side and merges matching cart lines.
- [x] Cart coupons can be applied/removed through the server quote, and the validated code carries into checkout for final revalidation.
- [x] The cart lists active API-backed coupons, shows server-calculated eligibility and reasons, and applies eligible offers only through the server quote.
- [x] Cart shipping fee and free-shipping progress use server values for the selected province.
- [x] Empty cart recommends current API-backed best sellers and includes loading, retry, and empty-result behavior.
- [x] Guest cart offers consent-based email reminders, allows the address to be updated or consent withdrawn, and clears the contact when the cart empties, expires, or is checked out.
- [x] Checkout address selectors use the official province/commune catalog, reject mismatched province/commune pairs at the API, preserve older district-based addresses, and let signed-in customers choose saved addresses.
- [x] Guest checkout remains available; COD is stated before order submission.
- [x] Order placement requires acceptance of the terms and privacy policy in the UI and API.
- [x] Preview and final totals are server-authoritative; unchanged retries reuse the unique idempotency key and the API returns the existing order.
- [x] Success route shows the order code and API-returned COD total, then opens order tracking with the code prefilled.
- [x] Guest checkout success offers optional account registration and keeps guest order tracking available without requiring sign-up.
- [x] Success, empty, loading, stock-change, validation, and network-error states are covered.
- [x] Checkout's free-shipping progress uses the server threshold for the selected province and has loading/error/retry states.
- [x] Checkout quote preview debounces province, coupon, and cart changes, discards outdated responses, and shows preview errors inline.
- [x] Checkout can optionally collect a tax code, company name, and invoice address; conditional validation prevents incomplete requests, the API stores the request on the order, and success/Admin detail confirm and show it.
- [x] Checkout is a three-step form with gated progression, step-specific validation, back navigation, accessible focus movement, and correct-step recovery for client/API field errors.
- [x] Checkout summary stays sticky beside the form on desktop and becomes a collapsed, keyboard-accessible accordion above the form on compact screens.
# Cart pricing changes

After the shopper requests a cart quote, compare each line's last synchronized unit price with the quote's server-returned unit price. If a price changed, show the product name and old/new per-item prices beside the current quote. The quote remains authoritative; do not calculate a replacement total in the browser.
