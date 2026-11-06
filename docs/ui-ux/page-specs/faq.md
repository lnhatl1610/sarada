# FAQ page

## Storefront `/faq` — help center
- Page title and short introduction; search input keeps `q` in the URL and can be shared.
- Show up to six topic cards from the live FAQ groups. Cards link to their matching topic; do not invent a topic when the store has not published it. When the configured contact form is available, expose it in a collapsed help-request section on this page using the existing contact endpoint and form. Otherwise link to the contact page for configured support details.
- Active entries appear in topic groups ordered by topic order/name, then entry order/question.
- Each answer uses a native `<details>/<summary>` disclosure so it works with keyboard and assistive technology. Answers are plain text.
- Distinguish initial loading, retryable API error, no published FAQs, and no search matches.
- Use `FAQPage` JSON-LD only for active entries currently included in the response. The release snapshot and live page use the same public data.
- Mobile layout has one column, readable line length, and touch-friendly summaries.

## Admin `/faqs`
- `content.manage` staff can create, edit, publish/unpublish, search, paginate, and delete FAQs.
- Form fields: topic, question, plain-text answer, topic order, entry order, publication toggle.
- Keep validation beside fields, confirm deletion, show save/delete results, and retain server-side permission enforcement.
