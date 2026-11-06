# ADR-0008: Run local applications on the host with concurrently

- Status: Accepted
- Date: 2026-10-23
- Decision owners: Product owner

## Context

The full Docker Compose development stack required Docker Desktop and conflicted with the host MySQL service on port 3306. The repository already supports running Laravel and both Vite apps directly on Windows.

## Decision

Run the API, admin, storefront, database queue worker, and scheduler as host processes coordinated by the root npm script using concurrently. Run MySQL as a local Windows service. Redis remains optional under the current API local configuration; configure Mailpit or another SMTP service to inspect queued email during development.

## Alternatives considered

- Keep the full Compose stack: provides isolated service versions, but requires Docker Desktop and port management.
- Start each application in a separate terminal: needs no extra runner, but requires multiple manual commands and makes logs harder to follow.

## Consequences and risks

- PHP, Composer, Node.js/npm, and MySQL must be installed and configured on the host.
- The root `npm run dev` command starts the three app processes, queue worker, and scheduler, and stops the group when one exits. The queue and scheduler require the local database to be reachable.
- Local database credentials and the admin seed account are configured in api/.env; keep that file private.

## Rollback

Restore the Docker Compose files and follow ADR-0007 if a containerized local stack is needed again. The application code and database schema are independent of the process runner.
