# Store locations

- The `/stores` directory uses a two-column list/map layout on wide screens and a single-column stack on mobile.
- A province selector filters the public API results; cards show store name, address, opening hours, phone/email links, and clear “Xem bản đồ”/“Chỉ đường” actions.
- Selecting a card centers the embedded map on that store. The map is an external OpenStreetMap embed; an external directions link remains available if the embed cannot load.
- “Gần tôi” calls `navigator.geolocation` only after a shopper activates it, sorts available locations by distance, and does not persist coordinates. Permission denial and unavailable geolocation explain how to continue with province filtering.
- Show distinct loading, connection error with retry, empty directory, no province results, and geolocation states. Every control has a visible label and keyboard focus.
- Admin stores use the existing content-management permission and include an explicit publication switch so drafts are never returned publicly.
