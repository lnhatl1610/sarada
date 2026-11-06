# Zalo ZBS Template Message

Zalo currently delivers these transactional and marketing notifications through its ZBS Template Message API. The integration uses the OA access token flow and the send-by-phone endpoint.

## Configuration

Set the variables from `api/.env.example` in the API environment:

- `ZALO_ZBS_APP_ID`, `ZALO_ZBS_SECRET_KEY`, and the initial `ZALO_ZBS_REFRESH_TOKEN` from the authorized Zalo OA application.
- Four approved template IDs: order placed, order shipped, price drop, and promotion.

The initial refresh token is only a bootstrap value. After the first refresh, the API stores the newly rotated refresh token encrypted in the `settings` table; back up the database and Laravel `APP_KEY` together. The access token is cached and refreshed shortly before expiry. Do not copy a rotated refresh token back to source control or logs.

## Approved template variables

Configure each Zalo template with the exact variable names for its event:

| Event | Variables |
| --- | --- |
| Order placed | `customer_name`, `order_code`, `message` |
| Order shipped | `customer_name`, `order_code`, `message`, `tracking_code` |
| Price drop | `product_name`, `previous_price`, `current_price` |
| Promotion and welcome coupon | `title`, `message`, `href` |

The values are supplied as strings. Price values are formatted in Vietnamese thousands notation. Zalo only makes the customer preference channel available after credentials and all four IDs are configured and the customer's profile has a phone number. Customers must enable Zalo separately for each event.

## Operational notes

The recipient phone is normalized to international Vietnam format (`84...`) at send time. Queued notifications honor the customer's saved preferences when Laravel resolves their channels. Provider errors fail the Laravel notification job for the configured queue retry policy; application errors contain only HTTP status/provider error code, never the phone or tokens. A real send requires an authorized OA, active approved templates, and a valid recipient covered by the template's Zalo policy.
