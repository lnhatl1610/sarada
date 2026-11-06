# ADR-0019: Track pickup stock by store location

- Status: Accepted
- Date: 2026-11-05
- Decision owners: Storefront implementation

## Context

Store pickup requires availability for every requested variant at a chosen physical location. The existing `inventories` row is one online-fulfillment pool per variant; `store_locations` currently stores contact and map details only. Treating aggregate online stock as available at every branch would promise stock the branch may not have. Existing order inventory must remain valid while branch stock is introduced.

## Options considered

- Reuse aggregate online stock for all pickup locations: avoids schema and admin work, but cannot truthfully report branch availability and can oversell when multiple branches are enabled.
- Add a branch stock pool while retaining the existing online pool: preserves current online checkout and gives each store an independently managed quantity/reservation ledger; staff must maintain both channels according to physical counts.
- Replace the current inventory table with a location-normalized inventory system: provides one aggregate model, but requires a high-risk migration of all stock, imports, reservations, reporting, and existing order transitions before pickup can ship.

## Decision

Keep `inventories` as the online-fulfillment pool and add `store_location_inventories` keyed by store and variant. The Inventory module remains the only owner of stock mutations and movement records for both pools. Pickup availability is derived only from the selected active store's unreserved branch quantity. Checkout locks and reserves the branch rows and stores a durable pickup location snapshot on the order. Existing online reservations, pricing, and delivery flows remain on `inventories`.

Pickup orders use zero shipping fee and the existing order state machine: `shipping` means ready for pickup, and `delivered` means picked up. Storefront and Admin labels are contextual to `fulfillment_type`; pickup cancellation and returns release/restore stock to the same branch through InventoryService.

## Consequences and risks

- Existing online stock is not backfilled into store balances; new branch balances start at zero until staff records a physical count. This prevents phantom pickup availability.
- Staff must adjust online and store pools to match their actual fulfillment operations. The Admin interface must clearly identify the pool and branch for every adjustment.
- Orders preserve the branch's name/address/contact/hours snapshot if the branch is later edited. Branches with inventory or movement history are retained and unpublished instead of deleted; open pickup orders block deletion.
- There are still only two fulfillment pools (online and physical stores); transfers between them are not supported in this phase.

## Migration and rollback

Add a store/variant stock table, a nullable store-location reference to the shared inventory movement ledger, and fulfillment/pickup snapshots on orders. The migration is additive and initializes no branch stock. Roll back by stopping pickup orders and applying the down migration; the existing online pool and existing orders are not rewritten.
