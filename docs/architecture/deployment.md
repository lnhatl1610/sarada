# Deployment Architecture

## Target
Dockerized VPS behind Nginx with TLS: `api` PHP-FPM, static `admin` and `storefront` builds, MySQL, Redis, queue worker, scheduler, and persistent image storage. The exact host/domain and provider credentials remain environment-specific.

## Environments
- Local development: install PHP, Composer, Node.js, and MySQL on the host; run the API, both SPAs, database queue worker, and scheduler together with the root concurrently script. Configure Mailpit or another SMTP service when checking outbound email. Redis is optional for the current local defaults.
- Staging: production-like MySQL/Redis, isolated storage and mail credentials, seeded non-sensitive data.
- Production: TLS, private database/Redis networks, least-privilege accounts, external backups, monitoring, managed secrets.

## Release sequence
Build immutable app assets → deploy API code → run additive migrations → restart queue workers → build Storefront release assets with the deployed public API reachable → publish frontend assets → smoke-check health/auth/catalog → monitor logs and queue. Roll back app code independently; use forward-only database changes unless a migration is proven reversible.

## Production seed data
`CatalogSeeder`, `StorefrontDemoSeeder`, `StorefrontOrderDemoSeeder`, and `AdminWorkflowDemoSeeder` are restricted to `local`/`testing`, both through `DatabaseSeeder` and direct invocation. Production seeding through `DatabaseSeeder` creates API roles/permissions and only creates a super-admin when explicit seed credentials are configured; it does not add the AI-demo catalog, sample stock, demo customers, or demo orders. Load owner-approved catalog and photography through the Admin workflows before production merchandising.

## Nginx for Admin and Storefront
Server configuration is maintained outside this repository. Configure Nginx to serve the Admin and Storefront Vite builds over HTTPS, cache fingerprinted `/assets/` files immutably, and fall back to `index.html` for SPA routes. Forward Storefront `/robots.txt` and `/sitemap.xml` to Laravel and serve API requests through PHP-FPM. Expose the public `/demo-media/` and `/storage/` assets returned by API resources; mount Laravel public media at the same path used by PHP-FPM and run `php artisan storage:link`. Set an 18 MiB request-body limit for multipart uploads, configure security headers and an environment-specific Content Security Policy, and allow both exact frontend origins in the API's credentialed CORS configuration.

Set the real `server_name`, TLS certificate paths, static `root`, PHP-FPM upstream, API origin in the Content Security Policy, and `SCRIPT_FILENAME` path. Set `VITE_API_URL=https://<api-domain>/api/v1` and run `npm run build` in each frontend. Configure Laravel `APP_URL` and `STOREFRONT_URL` for the deployed API and Storefront origins. Keep environment-specific values outside source control.

After configuring the host and installing certificates, validate the Nginx configuration before reloading:

```sh
sudo nginx -t && sudo systemctl reload nginx
```

Then verify the live routes from a client outside the host: Admin and Storefront `/` return the built SPA, Storefront `/robots.txt` and `/sitemap.xml` return the expected origin and published routes, API `/up` is healthy, and a referenced `/demo-media/` and `/storage/` asset returns successfully. Also inspect response headers for HTTPS, the configured Content-Security-Policy, cache policy, and credentialed CORS from both exact frontend origins. `nginx -t` validates syntax only; it does not verify DNS, certificate trust, PHP-FPM reachability, shared media mounts, or application behavior.

`npm run build` produces the client-rendered SPA without requiring a reachable API. Build-time SEO snapshot scripts have been removed; configure the host to serve the SPA fallback for frontend routes.

## Operations
Run the queue worker under Supervisor or Horizon and invoke Laravel's scheduler every minute. Maintain worker and scheduler configuration on the deployment host, including its runtime user, PHP binary, application path, shutdown timeout, and log rotation. For separate containers, run `queue:work` as the queue container's main process and invoke `schedule:run` once per minute in the scheduler container. Confirm worker status, scheduler heartbeat, failed jobs, and backup status in Admin's System Health page after deployment. Back up MySQL and persistent storage, encrypt and retain backups off-host, and document a restore procedure.

Configure `APP_URL`, `STOREFRONT_URL`, `ADMIN_URL`, `API_ALLOWED_ORIGINS`, `API_PUBLIC_REQUESTS_PER_MINUTE`, `API_UPLOADS_PER_MINUTE`, `TRUSTED_PROXIES` when using a separate HTTP proxy/load balancer, database, Redis, mail, storage, JWT signing secret, and frontend API base URLs outside source control. `API_ALLOWED_ORIGINS` is a comma-separated list of exact browser origins (scheme, hostname, and optional port; no path or trailing slash). `API_PUBLIC_REQUESTS_PER_MINUTE` limits public Storefront endpoints by client IP (default 60, clamped to 1–600). `API_UPLOADS_PER_MINUTE` limits authenticated upload requests independently by IP and account (default 20, clamped to 1–120). If a separate proxy is used, set `TRUSTED_PROXIES` to its exact IPs/CIDRs so Laravel can read the real client IP; never trust arbitrary forwarded headers or `*` on a public host. The API uses credentialed CORS for refresh-token cookies, so list every deployed Admin and Storefront origin explicitly and do not use `*`.

Set `VITE_APP_VERSION` in the Admin build environment before `npm --prefix admin run build`. The Admin embeds this value in diagnostics; the API's runtime `APP_VERSION` remains configured separately.

## CI/CD
`.github/workflows/ci.yml` runs on pushes, pull requests, and manual dispatch. It regenerates OpenAPI TypeScript declarations and fails if they are stale, lints and builds Admin and Storefront, validates Composer manifests, and checks PHP formatting with Pint. The workflow does not run the test suites; enable the appropriate API/frontend tests after the project owner requests and configures those checks. Release deployment remains a separate, environment-specific operation.
