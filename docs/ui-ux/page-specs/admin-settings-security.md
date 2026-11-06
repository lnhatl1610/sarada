# Admin security settings

Route: `/settings/security`. Users with `settings.manage` can disable or enable public customer registration, require 2FA for active staff roles, set session lifetime from 1 to 90 days, configure the login attempt limit from 3 to 20 per minute, and choose a password minimum length from 8 to 64 plus letter, number, and special-character requirements. Store settings mark the store name and numeric operating values as required, validate each integer range beside its field, and allow the unpaid-order timeout to be set to zero to disable auto-cancellation.

The admin sign-in screen follows the selected locale for password, and two-factor prompts, actions, and accessible password controls.

Security settings labels, role names, validation guidance, and save feedback follow the selected admin locale.

Public registration is off by default and the API rejects registration while disabled. Selecting required 2FA roles is allowed only after every active user in those roles has enrolled; the login API enforces the saved role policy. New refresh sessions use the configured session lifetime. Login and 2FA verification use the configured per-minute attempt limit. Password settings are enforced at the API boundary for storefront registration/reset/change and admin invitation/account changes; admin account passwords retain a ten-character floor.
