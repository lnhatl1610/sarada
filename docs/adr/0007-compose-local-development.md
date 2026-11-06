# ADR-0007: Run the local application stack with Docker Compose

- Status: Superseded by ADR-0008
- Date: 2026-10-23
- Decision owners: Product owner

## Context

The repository contains three applications (Laravel API, admin SPA, storefront SPA) and supporting MySQL, Redis, and Mailpit services. Previously, Compose only started the supporting services while developers had to install PHP, Composer, and Node.js and launch each application separately.

## Decision

Use Docker Compose as the local entry point for the complete development stack. Build a PHP CLI image for the API and Node.js development images for each Vite app. Mount source folders for live reload, keep dependencies and database data in named volumes, and run API migrations after MySQL becomes healthy. The root `.env` supplies local Compose settings; the API receives service hostnames and browser-facing frontend API URLs.

## Alternatives considered

- Keep application processes on the host and use Compose for infrastructure only: simpler containers, but requires compatible local PHP, Composer, and Node.js installations and multiple launch commands.
- Add a host script to launch the three applications: one launch command, but still requires host runtimes and leaves dependency versions different across machines.

## Consequences and risks

- A first run downloads base images and installs dependencies; subsequent starts reuse named dependency and database volumes.
- The development API uses Laravel's built-in server and a fixed local-only fallback application key. Do not reuse this stack configuration for production.
- Dependency lockfile changes require rebuilding the corresponding image; database contents persist across `docker compose down` and are removed only by explicitly deleting volumes.

## Rollback

Use the documented host commands in the earlier README version after stopping Compose, or revert this ADR and the Compose/Dockerfile changes. The application source and data model do not depend on containerization.
