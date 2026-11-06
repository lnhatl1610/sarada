# Admin promotion notifications

`/campaign-notifications` is available to staff with `coupons.manage` from the Marketing menu.

- Staff compose a title, message, and same-origin Storefront path, then review the content in a confirmation dialog before sending.
- The API queues delivery in the background. Active customer accounts receive only their enabled promotion channels; browser push requires an active device subscription, and SMS requires a configured Twilio sender and profile phone.
- Email delivery is limited to matching `newsletter_subscriptions` consent records. Anonymous newsletter subscribers receive email only.
- Campaign history shows queued, skipped, and failed preparation counts and a retryable loading/error state. It refreshes every four seconds while a campaign is queued or sending. It never shows recipient email addresses; temporary recipient rows are removed when queue preparation finishes.
- Campaign links reject external, protocol-relative, whitespace-containing, or backslash paths.
