---
name: db-schema-migration
description: Use when adding/changing database tables, columns, indexes, constraints, Eloquent relationships, seeds, or migration behavior for Sarada.
---

# Database Schema and Migration

1. Read `docs/architecture/data-model.md`, `docs/diagrams/erd.mmd`, the feature spec, and sibling migrations/models.
2. Check actual database engine and framework/package version; design for both intended MySQL and local setup where supported.
3. Add a new migration; never edit an applied migration. Include foreign keys, indexes, nullability, checks, delete behavior, and safe defaults.
4. Use integer VND; preserve order snapshots; enforce uniqueness/idempotency/concurrency invariants in the database where practical.
5. Update model relationships/casts/fillable, factory/seeder where applicable, data model, ERD, OpenAPI types if exposed, and feature spec.
6. Note any destructive/backfill/large-table rollout and rollback strategy. Run migrations only when explicitly requested or necessary for implementation setup.

See `references/naming.md`.
