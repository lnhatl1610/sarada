# ADR-0018: Add bank transfer with VietQR to Storefront checkout

- Status: Accepted
- Date: 2026-11-05

## Context

The full Storefront specification requires COD and bank transfer/QR in the launch checkout. The current project vision and ADR-0004 describe a COD-first release, while Admin already stores bank transfer settings and unpaid non-COD orders already have an expiry policy. Gateway credentials and bank transaction webhooks are not available in the repository.

## Options

1. Integrate a payment gateway first. This can automate payment sessions and confirmation, but requires merchant credentials, provider selection, callback/webhook security, and provider-specific operational setup.
2. Add configured bank transfer with an order-specific VietQR and manual payment confirmation. This uses the existing order/payment records and bank settings, while clearly keeping an order unpaid until staff reconcile the transfer.

## Decision

Add bank transfer as a supported Storefront payment method when the store has enabled it and supplied a valid bank BIN, bank name, account number, and account holder. The API snapshots the bank instructions on the order, reserves inventory through the existing transaction, and exposes a scoped payment-instructions capability for the payment page. The QR is generated from the saved order amount and transfer reference. Staff must confirm receipt before the order becomes paid. Non-COD expiry continues to cancel unpaid bank-transfer orders and release reservations through the normal order transition action.

COD remains available under its existing setting. Gateway integrations remain behind the payment boundary and require their own provider-specific ADR, credentials, callbacks, and reconciliation behavior; enabling a provider flag alone must never advertise or accept a payment method without a working integration.

## Consequences

- Existing orders and payment schema are extended only to snapshot bank transfer instructions; no historic order is reinterpreted.
- The payment page exposes no customer contact or address data. Its scoped token is derived from the application key and the order code; requests are rate limited.
- VietQR image rendering depends on the VietQR quick-link image service. The page also displays copyable bank and transfer details if the image cannot load.
- Payment is not automatically verified. Store operations must reconcile the bank statement and confirm the payment in Admin.
- Rollback disables the Storefront option and payment route; the added nullable order snapshot column is safe to retain until a later schema cleanup.
