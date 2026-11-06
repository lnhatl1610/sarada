# Observability

- Return a request ID on every API response and include it in structured request/error logs.
- For API 5xx responses, emit a structured `api.request.failed` log with request ID, method, route name, status, and elapsed time. Do not log request bodies, query strings, credentials, or customer data.
- Redact authorization headers, cookies, passwords, reset tokens, addresses where unnecessary, and provider secrets.
- Monitor `/up`, DB/Redis connectivity, queue depth and failed jobs, error rate, checkout failure rate, low stock, and mail delivery failures.
- Include actor/entity/action in audit records for admin changes.
- Sentry or another error tracker may be enabled through environment configuration; do not require credentials for local startup.
- The Admin keeps a bounded, in-memory buffer of recent `console.error`, uncaught browser errors, and unhandled promise rejections. It redacts common credential patterns and attaches the buffer only when a staff member explicitly files a bug report; it does not automatically transmit browser errors. Production-wide frontend alerting still requires an explicitly configured error-tracking service.
