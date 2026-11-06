# Backend Layering

`Route/Middleware → FormRequest → Controller → Action/Service → Model/Query → Resource`.

Controllers translate HTTP input/output. Actions implement one application operation. Services encapsulate reusable domain calculations/state transitions. Models represent persistence and relationships. Jobs/events perform retryable post-commit work. Avoid hidden HTTP/database access in views or generic wrappers that add no domain value.
