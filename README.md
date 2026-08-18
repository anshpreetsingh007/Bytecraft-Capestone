# Markit Roofing Management Platform

A web platform for Markit Roofing that digitises inspection requests, scheduling,
cost estimates, inventory and job close-out, for customers, inspectors and
office staff.

## Contents

- [Running it](#running-it)
- [Architecture](#architecture)
- [Roles and what each can do](#roles-and-what-each-can-do)
- [The workflow, end to end](#the-workflow-end-to-end)
- [Security model](#security-model)
- [Database](#database)
- [Development](#development)
- [Checks](#checks)
- [Deployment](#deployment)

## Running it

### With Docker (recommended)

```bash
cp .env.docker.example .env.docker   # if you do not already have one
docker compose up --build
```

The app is on <http://localhost:3000>. Nothing else is published: the seven
services and Postgres talk to each other on an internal network, and the
Next.js app proxies `/api/*` through to whichever service owns the path.

On a fresh volume, Postgres runs the base schema and both migrations in order,
so the database comes up fully migrated.

### Without Docker

```bash
npm install
npm --prefix microservices/auth-service install   # ...and each other service
npm run dev:all
```

You will need Postgres running locally with the schema applied:

```bash
psql -d markit_roofing -f database/markit_roofing.sql
psql -d markit_roofing -f database/migrations/001_cost_estimate_dimensions.sql
psql -d markit_roofing -f database/migrations/002_platform_hardening.sql
psql -d markit_roofing -f database/sample_data.sql   # optional
```

> **Migration 002 is required.** The services query columns and tables it
> creates (`is_active`, `audit_log`, `inventory_movement`, timezone-aware
> appointment times), so an unmigrated database will error on almost every
> request.

## Architecture

A Next.js front end and seven Express services against one Postgres database.

| Service | Port | Owns |
| --- | --- | --- |
| `auth-service` | 3004 | Accounts, roles, the audit log |
| `estimate-service` | 3002 | Cost estimates and the customer's decision |
| `inventory-service` | 3003 | Stock levels and the movement ledger |
| `notification-service` | 3005 | In-app alerts |
| `report-service` | 3006 | Job reports and business reporting |
| `submission-service` | 3007 | Inspection requests, scheduling, orders |
| `ai-chatbot-service` | 3001 | The website assistant |

The browser only ever calls the Next.js origin. `next.config.ts` rewrites each
`/api/*` prefix to the owning service, which is what allows the service ports to
stay unpublished.

Code shared by every service — token verification, role checks, validation,
error handling, logging, the retrying HTTP client — lives in
`microservices/shared/` and is copied into each service by
`npm run sync:shared`. Each service has its own Docker build context and cannot
reach a sibling directory, so the copies are generated rather than symlinked.
CI fails if a copy has drifted from its source.

Full endpoint reference: [`docs/openapi.yaml`](docs/openapi.yaml).

## Roles and what each can do

**Customer** — request an inspection, track its progress, read approved
estimates, and accept or decline them.

**Inspector** — see the jobs assigned to them, move them through
assigned → in progress → completed, write estimates, and file a job report when
the work is done.

**Admin** — everything above plus: book inspectors at a date and time, convert
requests into orders, approve or reject estimates, manage inventory, sign off
job reports, and read business reporting.

**Super admin** — plus: assign roles, deactivate accounts, read the audit log.

## The workflow, end to end

1. A customer submits an inspection request (or the chatbot files one for them).
2. An admin books an inspector at a specific date and time. Double bookings are
   refused; working hours and time off produce a warning.
3. The inspector marks the job in progress, then completed.
4. An admin converts the request into an **order**.
5. An inspector or admin writes a **cost estimate** against the order and
   submits it.
6. An admin approves it. Approving draws the priced materials out of stock and
   makes the estimate visible to the customer.
7. The **customer accepts or declines**. Accepting is what commits us to the
   work; nothing before that does.
8. When the job is finished the inspector files a **job report** — materials
   used, waste, hours, profit.
9. An admin signs the report off, which closes the order and feeds the
   financial reporting.

### There is no invoicing

Markit takes payment in cash on completion, or arranges financing directly with
the customer over the phone. The platform therefore has no invoicing, no payment
capture and no card handling. Reporting measures **accepted estimates** rather
than money received, which is the figure the business actually has.

## Security model

Every service verifies the caller's Firebase ID token before doing anything.
Tokens are checked against Google's published signing keys — RS256 signature,
audience, issuer and expiry — using only `node:crypto`, so no Firebase
service-account key has to be distributed to seven containers. The only
configuration needed is the Firebase project id, which is public.

The token proves *who* the caller is. It says nothing about what they may do, so
every request also resolves the UID to a role in Postgres. Roles are never read
from the request.

On top of that:

- **Ownership checks.** A customer can only read their own records, an inspector
  only their own queue, and notifications only their own — whatever ids appear in
  the URL.
- **Internal endpoints.** The calls that raise notifications and draw stock
  require a shared secret, so a browser cannot post a fake "your estimate was
  approved" alert.
- **CORS** is restricted to the app's own origin.
- **Rate limiting** on every service, tighter on writes and on the chatbot.
- **Validation** on every input, with one error shape and no database messages
  leaking to the browser.
- **Audit log** for role changes, approvals, stock adjustments and deletions.
- **Soft deletes**, so removing a record cannot orphan the work attached to it.

`RoleGuard` in the front end is a redirect for convenience. It runs in the user's
own browser and is not a security control.

## Database

Twelve original tables plus five added by migration 002:

- `audit_log` — who changed what, and when.
- `inventory_movement` — every stock change, with a running balance.
- `inspector_availability` / `inspector_time_off` — the inputs to scheduling.

Migration 002 also converts `inspection_request.scheduled_date` from a `DATE` to
a `TIMESTAMPTZ` with a duration, so an appointment can carry a time of day; adds
`created_at`/`updated_at` everywhere with triggers; closes the status vocabulary
with CHECK constraints; adds the missing indexes; and widens the notification
type constraint, which the application had already outgrown.

Migrations are idempotent — running one twice is a no-op.

## Development

```bash
npm run dev            # Next.js only
npm run dev:all        # Next.js and all seven services
npm run sync:shared    # after editing microservices/shared/
```

Editing shared code means editing `microservices/shared/` and re-running
`npm run sync:shared`. The copies under `microservices/*/src/shared/` are
generated and carry a banner saying so.

## Checks

```bash
npm run verify          # everything below, in order
```

| Command | Checks |
| --- | --- |
| `npm run check:shared` | The vendored shared kit matches its source |
| `npm run check:k8s-schema` | The Postgres ConfigMap matches the SQL files |
| `npm run lint` | ESLint over the Next.js app |
| `npm run typecheck` | The Next.js app typechecks |
| `npm run typecheck:services` | All seven services typecheck |
| `npm test` | The shared-kit test suite |

Tests use Node 22's built-in runner, so there is no test framework to install.
They cover the validation helpers, the authorisation rules, the retry policy of
the inter-service client, the rate limiter, and token verification — including
the forgery cases (`alg: none`, HS256 confusion, tampered payloads, wrong signing
key, expired tokens, wrong project).

GitHub Actions runs all of it on every push, and additionally applies the schema
and both migrations to a real Postgres to prove they work and are idempotent.

## Deployment

Kubernetes manifests are in `k8s/`. Each service has liveness, readiness and
startup probes, resource requests and limits, and a 30-second termination grace
period matching the graceful shutdown in the services themselves.

`k8s/06-postgres-schema.yaml` is generated — run `npm run build:k8s-schema`
after changing any SQL, or CI will fail.

Set `INTERNAL_SERVICE_TOKEN` to a real value per environment
(`openssl rand -hex 32`). The services refuse to start in production without it.

## Team

Zaara Ahmad, Cielo Pacot, Diego Tapasco, Anshpreet Singh, Sven Milicevic.
