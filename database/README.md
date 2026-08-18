# Markit Roofing Database

PostgreSQL schema for the ByteCraft capstone project.

## Files

| File | What it does |
| --- | --- |
| `markit_roofing.sql` | Creates the base tables, relationships and indexes |
| `migrations/001_cost_estimate_dimensions.sql` | Estimate materials and roof dimensions |
| `migrations/002_platform_hardening.sql` | Timestamps, constraints, indexes, audit log, stock ledger, scheduling |
| `sample_data.sql` | Sample records for development |
| `reset.sql` | Drops every table. Local development only |
| `test_connection.py` | Checks Python can reach the database |

## Setup

Apply them in this order. Migration 002 is **not optional** — the services query
columns and tables it creates, so an unmigrated database errors on almost every
request.

```bash
psql -d markit_roofing -f database/markit_roofing.sql
psql -d markit_roofing -f database/migrations/001_cost_estimate_dimensions.sql
psql -d markit_roofing -f database/migrations/002_platform_hardening.sql
psql -d markit_roofing -f database/sample_data.sql   # optional
```

`docker compose up` does all of this automatically on a fresh volume.

Both migrations are idempotent, so re-running one is a no-op. That is checked in
CI, which applies each of them twice.

## Tables

**Identity** — `client`, `inspector`, `admin`, `super_admin`

One row per person per role. Somebody promoted from customer to inspector has a
row in both; the effective role is the highest-ranked *active* one. Demotion
deactivates the staff row rather than deleting it, so the history of every job
that person worked stays intact.

**Work** — `inspection_request`, `orders`, `cost_estimate`, `report`

The path a job takes: a request becomes an order, an order gets an estimate, and
a finished job gets a report. `invoice` still exists but nothing writes to it —
see below.

**Inventory** — `stock`, `items`, `inventory_movement`

`items.qty_on_hand` is the current level; `inventory_movement` is the ledger
behind it. Every change — opening balance, receipt, manual adjustment,
consumption by an approved estimate — leaves a row with the balance after it.

**Scheduling** — `inspector_availability`, `inspector_time_off`

Weekly working hours (as minutes past midnight) and booked absences. Used to
warn when a booking falls outside someone's hours.

**Supporting** — `notification`, `audit_log`

## What migration 002 changes, and why

**Appointments could not carry a time of day.** `inspection_request.scheduled_date`
was a `DATE`, so the system could only ever say "Tuesday". It is now a
`TIMESTAMPTZ` with a `duration_minutes`, which is what makes conflict detection
possible.

**Notifications the app sent were being rejected.** The `type` CHECK allowed
three values, but the code had been emitting `estimate_submitted` for some time.
Every one of those inserts failed with a 23514 that the fire-and-forget error
handler swallowed, so the "estimate needs approval" alert never appeared. The
constraint now covers all twelve types the application uses.

**Nothing had timestamps.** `created_at` and `updated_at` are on every table now,
with a trigger maintaining `updated_at`.

**Statuses were free text.** `VARCHAR(30)` with no constraint meant a request
could be set to anything at all. Each one is now a closed set, normalised before
the constraint is added so it applies to existing rows.

**Nothing was accountable.** `audit_log` records who changed what and when, with
the request id that ties it back to the service logs.

**Stock was a write-only number.** Anyone could overwrite `qty_on_hand` with no
history. `inventory_movement` records every change, and approving an estimate
consumes the materials it was priced with — exactly once, enforced by a partial
unique index.

**A customer could not agree to an estimate.** `client_response`,
`client_responded_at` and `client_response_note` capture the decision that
actually starts a job, separately from an admin approving it for sending.

**`report` had no writable shape.** The analytics read from it but nothing wrote
to it. Title, findings, recommendations, labour hours and a status were added so
an inspector can file one.

**Deletes destroyed history.** `deleted_at` on the tables that other rows point
at, so removing a record cannot orphan the work attached to it.

**Missing indexes.** On the columns the dashboards filter and sort by every page
load.

## The invoice table

`invoice` is left in place but unused. Markit takes payment in cash on
completion, or arranges financing with the customer over the phone, so the
platform deliberately does not invoice anyone. Reporting measures accepted
estimates instead — that is the commitment the business actually has a record
of, and it is why every revenue figure that used to read from `invoice` was
reporting zero.

## Connection test

```bash
pip install psycopg2-binary
python database/test_connection.py
```
