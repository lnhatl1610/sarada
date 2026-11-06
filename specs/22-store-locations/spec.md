# Store locations

## Goal
Let shoppers find current, published physical store locations and let authorized staff maintain the location directory.

## Requirement
FR-CMS-001.

## Storefront behavior
- `/stores` lists active locations, filters by province, and shows each location's address, phone, optional email, opening hours, and coordinates-backed map/directions.
- The map centers on the selected location. Visitors can open directions in an external map service.
- “Gần tôi” requests browser location only after an explicit click, sorts the loaded active locations by great-circle distance, and never stores the visitor's coordinates. Denied/unavailable location leaves province and alphabetical browsing usable.
- Loading, retryable error, no locations, no province matches, and geolocation failure have distinct accessible states.

## Admin behavior
- Staff with `content.manage` can create, edit, publish/unpublish, filter, and delete unused locations. Locations with open pickup orders, inventory balances, or movement history are retained and must be unpublished instead of deleted.
- Coordinates and opening hours are required for published data. Latitude and longitude use valid earth bounds.
- Public responses exclude inactive locations. Admin list responses include both statuses and pagination metadata.

## Data and API
- `store_locations` stores name, address, current province code/name, optional ward, public contact, opening-hours text, latitude/longitude, sort order, and active state.
- Public: `GET /api/v1/stores?province_code=&page=&per_page=`.
- Admin: `GET|POST /api/v1/admin/stores`, `PATCH|DELETE /api/v1/admin/stores/{store}`; all operations require `content.manage`.

## Out of scope
- Appointment booking and real-time opening status. Store inventory and checkout pickup fulfillment are implemented separately in [`specs/24-store-pickup/spec.md`](../24-store-pickup/spec.md).
- Automatic geocoding; staff enter coordinates from a trusted map source.
