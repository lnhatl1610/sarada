# Admin settings and preferences

## Personal display preferences

Route: `/?page=preferences`. This screen is available to every authenticated admin because it only changes that user's browser presentation.

| Preference | Options | Persistence |
|---|---|---|
| Theme | Light, dark, follow device | Account preference API, with browser local storage startup cache |
| Accent | Burgundy, blue, emerald, violet, teal, amber | Account preference API, with browser local storage startup cache |
| Table density | Comfortable, compact | Account preference API, with browser local storage startup cache |
| Page size | 10, 20, 50, 100 rows | Account preference API, with browser local storage startup cache |
| Sidebar state | Expanded or collapsed | Account preference API, with browser local storage startup cache |
| Motion | Standard or reduced | Account preference API, with browser local storage startup cache; operating-system reduced-motion preference is always respected |

Changes apply immediately. The appearance page also includes a sample dashboard and table preview that reflects the selected theme, accent, and table density. Reset restores light/dark system following, burgundy accent, comfortable tables, and standard motion. Preferences never contain authentication credentials or store data.

## Store configuration and device-only controls

Store configuration such as contact details, checkout thresholds, shipping, SEO, and email belongs to the separate authorized settings API and is audited on save. It is not part of this personal preferences screen. Hardware controls such as Wi-Fi, brightness, audio devices, UART, firmware updates, and power actions are not available to a browser-based Sarada admin and must not be presented as working controls.

Store settings are available under `/settings/*`, protected by `settings.manage` and saved through the audited `/admin/settings` API. Each settings form keeps its Save/Cancel action bar visible at the bottom while scrolling, and Save stays disabled until the form changes. General settings cover name, logo/favicon, contact, business hours, social links, up to six manually curated Instagram posts with thumbnail URLs and alt text, shipping defaults, low-stock threshold, read-only server timezone, and the fixed VND currency. Logo and favicon accept an uploaded JPG, PNG, or WebP image up to 2 MB through `/admin/uploads`, show a preview, and retain URL entry for externally hosted media. SEO's Open Graph share image has the same upload and preview behavior. The upload route accepts `settings.manage` in addition to the existing product/content permissions. Payment settings cover payment flags, bank-transfer instructions, and the timeout for unpaid non-COD orders. Shipping rates have their own CRUD page. Email settings include sender, order/shipment/password-reset/invitation templates, validated alert recipients, and a send-test action. Test emails use saved templates and the configured test recipient; sending is disabled until edits are saved and a recipient is entered. Order and shipment templates also run on their corresponding business events. SEO defaults include page metadata and share image; the storefront applies them. Security settings include registration, 2FA roles, session lifetime, login attempts, and the minimum password policy. Maintenance settings gate the storefront and show an expected return time. VNPay, MoMo, and Stripe flags remain configuration only; transaction processing is not integrated, and gateway secrets belong in `.env`.

Personal account security is available at `/settings/account/security`. Password policy is enforced by the API for registration, reset, account changes, staff invitations, and staff account changes. Store staff passwords have a ten-character minimum. The storefront password experience should continue to show policy validation beside the field.

## Follow-up

- Apply public store branding and business hours consistently across all storefront routes.
- The public GA4 measurement ID is safe to expose, but load the storefront tag only after analytics consent. Reject non-GA4 IDs and keep marketing pixels separate from the analytics consent category.
- Add operational system health and export/import workflows only when backed by real server capabilities.
