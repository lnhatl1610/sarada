---
name: api-contract-openapi
description: Use when adding/changing REST request or response shapes, API paths, status/error codes, pagination, or generating frontend types from the contract.
---

# API Contract Workflow

1. Read `docs/architecture/api-conventions.md` and the feature spec.
2. Update `api/openapi.yaml` with paths, schemas, auth, permissions, examples, and errors.
3. Keep Laravel Form Requests/Resources consistent with the contract.
4. Regenerate TypeScript declarations using the repo generation script; do not hand-edit generated output.
5. Update consumers, examples, docs, and traceability. Describe breaking changes and versioning.
6. Do not claim validation/generation passed unless explicitly requested and run.

