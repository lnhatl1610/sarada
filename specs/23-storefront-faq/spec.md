# Storefront FAQ

## Goal
Let shoppers find trustworthy answers to common store questions and let authorized content editors maintain those answers.

## Requirements
FR-CMS-002.

## Acceptance criteria
- Public `/faq` shows active FAQ entries grouped by topic, with keyboard-operable disclosure controls.
- Search is URL-backed, case-insensitive, and matches topic, question, or answer. Empty search results are distinct from loading and API errors.
- Public API returns only active entries, with a bounded result set. Draft entries do not appear in the page, sitemap, or FAQPage structured data.
- Staff with `content.manage` can create, edit, publish/unpublish, search, and delete entries. Inputs are validated and writes pass through the admin audit middleware.
- Answers are plain text and render as text; no user-provided HTML is executed.
- Each active answer asks whether it helped. A visitor can record one yes/no response per answer; repeat submissions return the original choice and never add duplicate feedback.
- Voting requires a random browser UUID, accepts no contact details, and is protected by public rate limiting; unlisted or inactive FAQs return 404.

## Data
`faqs`: topic, question, plain-text answer, topic order, entry order, and publication state.

## API contract
- Public `GET /api/v1/faqs?q=` returns grouped active entries.
- Public `POST /api/v1/faqs/{faq}/helpful-votes` records `{visitor_id, helpful}` idempotently.
- Admin `GET|POST /api/v1/admin/faqs`, `PATCH|DELETE /api/v1/admin/faqs/{faq}` require `content.manage`.

## Route and UI
- Storefront `/faq`: searchable topic groups, collapsible answers, URL query, loading/error/empty states.
- Admin `/faqs`: validated editor, search, publication state, pagination, and delete confirmation.
