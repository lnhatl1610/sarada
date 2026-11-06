# ADR 0003: Single-vendor store

- Status: Accepted
- Context: Planning targets one store operator and one catalog.
- Decision: Products, inventory, promotions, and settings belong to one shop; no vendor/tenant ownership layer in the first release.
- Consequences: Simpler authorization and checkout. A future multi-vendor change requires explicit tenancy boundaries and data migration.
