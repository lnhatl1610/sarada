# Admin review moderation

The review list uses server filters and permission-gated moderation actions. Opening a review shows a detail drawer with product/customer context, rating, review text, purchase verification, fit feedback, attachments, and a related order when available. Review details and customer-authored text remain as stored.

- Hiding one or more reviews requires a reason of at least three characters. The dialog warns that the reason is retained for staff reference and shows validation and API errors beside the reason or in the dialog.
- Review details show a localized timestamp and translated status, fit, purchase, empty-content, and empty-attachment labels. Image enlargement has descriptive accessible names and closes on Escape or backdrop click.
- Staff with review moderation permission can save or clear a public response on an approved review; the response appears below that review in the Storefront.
- Any image marked `Ảnh AI demo:` by the API is visibly labeled `Ảnh AI demo` in the detail drawer and zoom viewer; the API-provided alt text is preserved through enlargement, so seeded media is never presented to staff as customer-submitted photos.
- Review deletion uses a confirmation dialog that identifies the review and customer. Deletion is destructive and includes its attached images.
- Dialog controls, accessible names, validation, confirmation copy, and feedback follow the selected admin language. Product, customer, order, review, and moderation-reason values remain data.
