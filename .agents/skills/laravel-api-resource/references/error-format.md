# API Error Format

```json
{
  "message": "Human-readable Vietnamese message",
  "code": "STABLE_ERROR_CODE",
  "errors": { "field": ["Field-specific validation message"] }
}
```

Validation uses `VALIDATION_ERROR`; domain errors use stable codes such as `OUT_OF_STOCK`, `COUPON_EXPIRED`, and `INVALID_ORDER_TRANSITION`. Never expose stack traces or secrets.
