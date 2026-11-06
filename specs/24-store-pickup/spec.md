# Store pickup

## Goal

Let a customer choose a published store during checkout only when every cart variant has enough unreserved stock at that store. Pickup uses the existing order pricing, coupon, membership, payment, idempotency, and order-history rules.

## Rules

- Online inventory and store inventory are separate fulfillment pools. Store pickup must never infer store stock from the online inventory row.
- A new store/variant balance starts at zero. Admin must record the branch's physical stock before it is offered for pickup.
- Pickup orders have zero shipping fee, retain the customer's name/phone and a snapshot of store details, and lock/reserve each store inventory row during placement.
- The API rechecks active store status and every requested quantity inside the order transaction. Client availability is an estimate only.
- Store cancellation releases the reservation at the same branch. Marking an order picked up consumes it; a received return restores it to that branch through the Inventory module.
- Orders retain store name/address/contact/hours even if the store is edited or deactivated later.
- A store with stock rows, inventory movements, or open pickup orders cannot be deleted; staff must unpublish it so audit history and outstanding reservations remain valid.

## Acceptance

- Admin can view and adjust a branch's stock by variant with a reason and sees a branch-specific movement history.
- Storefront availability lists only active branches that can fulfill the entire cart, and the customer can select one.
- A stale or insufficient branch quantity returns a field-level error and writes no order, reservation, coupon usage, payment, or stock movement.
- Concurrent pickup requests for the final branch unit cannot both succeed.
- Existing delivery checkout, its online stock pool, and its shipping quote are unchanged.
- Admin and customer order views identify the selected branch and show contextual ready-for-pickup/picked-up labels.
