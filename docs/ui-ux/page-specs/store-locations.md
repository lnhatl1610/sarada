# Store locations

- The `/stores` directory uses a two-column list/map layout on wide screens and a single-column stack on mobile.
- Province and ward selectors filter the public API results using the current Vietnam address catalog; changing province clears the ward. Cards show store name, address, opening hours, phone/email links, and clear “Xem bản đồ”/“Chỉ đường” actions.
- Selecting a card centers the lazy-loaded Leaflet map and emphasizes that store's marker. The map uses a configurable tile URL, displays OpenStreetMap attribution and a report link, disables scroll-wheel zoom, and keeps the full location list and external directions link available if map tiles fail.
- “Gần tôi” calls `navigator.geolocation` only after a shopper activates it, loads the remaining result pages before switching to distance order, and does not persist coordinates. The control stays busy while locations load; if another page fails, the page keeps its current ordering and offers a retry. Changing province or clearing nearby order invalidates pending location requests. Permission denial and unavailable geolocation explain how to continue with province filtering.
- Store cards show `Đang mở`/`Đã đóng` only when Admin has configured a weekly schedule; otherwise preserve the staff-authored opening-hours text without guessing a live status. Weekly intervals use Vietnam local time.
- Show distinct loading, connection error with retry, empty directory, no province results, and geolocation states. Every control has a visible label and keyboard focus.
- Admin stores use the existing content-management permission and include an explicit publication switch so drafts are never returned publicly.
