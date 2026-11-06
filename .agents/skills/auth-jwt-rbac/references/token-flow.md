# Token Flow Checklist

- Credential login validates audience and account status.
- Access JWT is short-lived and includes subject, issuer, audience, expiry, and unique ID.
- Refresh cookie is Secure in production, httpOnly, SameSite=Lax, scoped to auth endpoints, and audience-specific.
- Refresh lookup hashes supplied token; consume old token and create replacement in one transaction.
- Reuse of consumed token revokes the family; logout revokes current access and refresh credentials.
- Browser refresh interceptor is single-flight and retries a failed request only once.
- Auth and permission failures use stable JSON error codes.
