# Integrations

- **Email:** Laravel mailer/Mailables queued via SMTP configured in environment. Mailpit is the local sink. Do not bake provider credentials into code.
- **Images:** Laravel filesystem abstraction. Local public disk for development; S3-compatible disk for deployment. Product records retain storage paths, not signed URLs.
- **Payments:** `PaymentGateway` boundary; COD is the only initial implementation. A gateway must verify callbacks and be idempotent before enabling online payment.
- **Shipping:** `ShippingRateProvider` boundary; first implementation reads province-level fixed rates/free threshold. Carrier integration is later scope.
- **Frontend contract:** `api/openapi.yaml` is the shared source for REST request/response types.
