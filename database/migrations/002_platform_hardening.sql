-- =====================================================
-- 002 — Platform hardening
-- =====================================================
--
-- Everything in here is idempotent and safe to re-run.
-- Run with:  psql -d markit_roofing -f database/migrations/002_platform_hardening.sql
--
-- Covers:
--   1.  updated_at / created_at on every table, maintained by trigger
--   2.  account lifecycle + PIPEDA consent capture on client
--   3.  inventory: coverage_sqft promoted out of app-level ALTERs, soft delete,
--       non-negative quantity/cost constraints
--   4.  inspection_request: real appointment times (TIMESTAMPTZ + duration),
--       job-site address, closed status vocabulary, soft delete
--   5.  orders: closed status vocabulary
--   6.  cost_estimate: customer accept/decline, closed status vocabulary,
--       soft delete
--   7.  report: turned into a real inspector-authored job report
--   8.  notification: type vocabulary widened to match the code (the app has
--       been emitting 'estimate_submitted', which the old CHECK rejected —
--       those inserts were failing silently)
--   9.  audit_log: who changed what, when
--   10. inventory_movement: stock ledger so quantities stop being a
--       write-only number
--   11. inspector_availability / inspector_time_off: scheduling inputs
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'client', 'inspector', 'admin', 'super_admin', 'stock', 'items',
        'inspection_request', 'orders', 'cost_estimate', 'invoice', 'report'
    ] LOOP
        EXECUTE format(
            'ALTER TABLE %I
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()', t);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END $$;

-- notification already carries created_at, but as a naive TIMESTAMP. Every
-- other time column in the system is now timezone-aware; make this one match
-- so "5 minutes ago" in the bell menu is right for a user in any timezone.
ALTER TABLE notification
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE notification
    ALTER COLUMN read_at TYPE TIMESTAMPTZ USING read_at AT TIME ZONE 'UTC';

-- =====================================================
-- 2. ACCOUNT LIFECYCLE + CONSENT
-- =====================================================

ALTER TABLE client
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS consent_version VARCHAR(20);

ALTER TABLE inspector    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE admin        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE super_admin  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Contact details are how the crew reaches a customer on the day; make the
-- lookup cheap and the uniqueness explicit.
CREATE INDEX IF NOT EXISTS idx_client_email    ON client (lower(email));
CREATE INDEX IF NOT EXISTS idx_inspector_email ON inspector (lower(email));

-- =====================================================
-- 3. INVENTORY ITEMS
-- =====================================================
-- coverage_sqft was being bolted on at boot by inventory-service's
-- ensureSchema(). That runs on every start, races other replicas, and hides
-- the column from anyone reading the schema file. It belongs here.

ALTER TABLE items
    ADD COLUMN IF NOT EXISTS coverage_sqft NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE items SET qty_on_hand = 0 WHERE qty_on_hand IS NULL OR qty_on_hand < 0;
UPDATE items SET unit_cost = 0 WHERE unit_cost IS NULL OR unit_cost < 0;
UPDATE items SET reorder_threshold = 0 WHERE reorder_threshold IS NULL OR reorder_threshold < 0;

ALTER TABLE items
    ALTER COLUMN qty_on_hand SET DEFAULT 0,
    ALTER COLUMN qty_on_hand SET NOT NULL,
    ALTER COLUMN unit_cost SET DEFAULT 0,
    ALTER COLUMN unit_cost SET NOT NULL,
    ALTER COLUMN reorder_threshold SET DEFAULT 0,
    ALTER COLUMN reorder_threshold SET NOT NULL;

ALTER TABLE items DROP CONSTRAINT IF EXISTS items_non_negative;
ALTER TABLE items ADD CONSTRAINT items_non_negative CHECK (
    qty_on_hand >= 0 AND unit_cost >= 0 AND reorder_threshold >= 0 AND coverage_sqft > 0
);

CREATE INDEX IF NOT EXISTS idx_items_active   ON items (item_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);

-- =====================================================
-- 4. INSPECTION REQUESTS
-- =====================================================
-- scheduled_date was a DATE, so an appointment could never carry a time of
-- day. You cannot run a booking system that can only say "Tuesday".

ALTER TABLE inspection_request
    ALTER COLUMN scheduled_date TYPE TIMESTAMPTZ USING scheduled_date::timestamptz;

ALTER TABLE inspection_request
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN IF NOT EXISTS site_address VARCHAR(200),
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_reason VARCHAR(250);

ALTER TABLE inspection_request DROP CONSTRAINT IF EXISTS inspection_request_duration_sane;
ALTER TABLE inspection_request ADD CONSTRAINT inspection_request_duration_sane
    CHECK (duration_minutes BETWEEN 15 AND 480);

-- Normalise before locking the vocabulary down, so the constraint can be
-- added VALID rather than left NOT VALID forever.
UPDATE inspection_request SET status = 'pending' WHERE status IS NULL;
UPDATE inspection_request SET status = lower(trim(status));
UPDATE inspection_request SET status = 'pending'
    WHERE status NOT IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

ALTER TABLE inspection_request
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE inspection_request DROP CONSTRAINT IF EXISTS inspection_request_status_check;
ALTER TABLE inspection_request ADD CONSTRAINT inspection_request_status_check
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_inspection_request_status
    ON inspection_request (status, request_id DESC);
CREATE INDEX IF NOT EXISTS idx_inspection_request_client
    ON inspection_request (client_id, request_id DESC);
CREATE INDEX IF NOT EXISTS idx_inspection_request_inspector_sched
    ON inspection_request (inspector_id, scheduled_date);

-- =====================================================
-- 5. ORDERS
-- =====================================================

UPDATE orders SET status = 'active' WHERE status IS NULL;
UPDATE orders SET status = lower(trim(status));
UPDATE orders SET status = 'active'
    WHERE status NOT IN ('active', 'estimated', 'scheduled', 'completed', 'cancelled');

ALTER TABLE orders
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('active', 'estimated', 'scheduled', 'completed', 'cancelled'));

-- One order per inspection request. convertRequestToOrder() checks this in
-- application code, but two concurrent clicks would both pass that check.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_request_unique
    ON orders (request_id) WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_client ON orders (client_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- =====================================================
-- 6. COST ESTIMATES — customer decision
-- =====================================================
-- An admin approving an estimate only means "this is fit to send". The
-- customer accepting it is a separate fact and the one that actually starts
-- the job, so it gets its own columns rather than overloading `status`.

ALTER TABLE cost_estimate
    ADD COLUMN IF NOT EXISTS client_response VARCHAR(20) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS client_responded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS client_response_note VARCHAR(500),
    ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE cost_estimate DROP CONSTRAINT IF EXISTS cost_estimate_client_response_check;
ALTER TABLE cost_estimate ADD CONSTRAINT cost_estimate_client_response_check
    CHECK (client_response IN ('pending', 'accepted', 'declined'));

UPDATE cost_estimate SET status = 'draft' WHERE status IS NULL;
UPDATE cost_estimate SET status = lower(trim(status));
UPDATE cost_estimate SET status = 'draft'
    WHERE status NOT IN ('draft', 'submitted', 'approved', 'rejected');

ALTER TABLE cost_estimate
    ALTER COLUMN status SET DEFAULT 'draft',
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE cost_estimate DROP CONSTRAINT IF EXISTS cost_estimate_status_check;
ALTER TABLE cost_estimate ADD CONSTRAINT cost_estimate_status_check
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));

ALTER TABLE cost_estimate DROP CONSTRAINT IF EXISTS cost_estimate_total_non_negative;
ALTER TABLE cost_estimate ADD CONSTRAINT cost_estimate_total_non_negative
    CHECK (total_amount IS NULL OR total_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_cost_estimate_order ON cost_estimate (order_id);

-- =====================================================
-- 7. JOB REPORTS
-- =====================================================
-- The report table existed and report-service read from it, but nothing in
-- the system ever wrote a row. These columns are what an inspector actually
-- fills in when closing a job out.

ALTER TABLE report
    ADD COLUMN IF NOT EXISTS title VARCHAR(150),
    ADD COLUMN IF NOT EXISTS findings TEXT,
    ADD COLUMN IF NOT EXISTS recommendations TEXT,
    ADD COLUMN IF NOT EXISTS labour_hours NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE report SET status = 'submitted' WHERE status IS NULL OR status = '';
UPDATE report SET title = COALESCE(title, 'Job report');

ALTER TABLE report DROP CONSTRAINT IF EXISTS report_status_check;
ALTER TABLE report ADD CONSTRAINT report_status_check
    CHECK (status IN ('draft', 'submitted', 'reviewed'));

ALTER TABLE report DROP CONSTRAINT IF EXISTS report_costs_non_negative;
ALTER TABLE report ADD CONSTRAINT report_costs_non_negative CHECK (
    (material_used_cost  IS NULL OR material_used_cost  >= 0) AND
    (material_waste_cost IS NULL OR material_waste_cost >= 0) AND
    (labour_hours        IS NULL OR labour_hours        >= 0)
);

-- One report per order. A second one would double-count in every financial
-- rollup report-service produces.
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_order_unique
    ON report (order_id) WHERE deleted_at IS NULL AND order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_inspector ON report (inspector_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_report_status    ON report (status);

-- =====================================================
-- 8. NOTIFICATIONS — widen the type vocabulary
-- =====================================================
-- estimate-service has been POSTing type='estimate_submitted' since the
-- notify client was added. The old CHECK only allowed three values, so every
-- one of those inserts raised 23514, got swallowed by the fire-and-forget
-- catch, and the admin queue alert never appeared.

ALTER TABLE notification DROP CONSTRAINT IF EXISTS notification_type_check;
ALTER TABLE notification ADD CONSTRAINT notification_type_check CHECK (
    type IN (
        'inspection_request_submitted',
        'inspection_assigned',
        'inspection_scheduled',
        'inspection_status_changed',
        'estimate_submitted',
        'estimate_approved',
        'estimate_rejected',
        'estimate_accepted_by_client',
        'estimate_declined_by_client',
        'job_report_submitted',
        'low_stock',
        'role_changed'
    )
);

ALTER TABLE notification DROP CONSTRAINT IF EXISTS notification_recipient_type_check;
ALTER TABLE notification ADD CONSTRAINT notification_recipient_type_check CHECK (
    recipient_type IN ('admin', 'client', 'inspector', 'super_admin')
);

-- =====================================================
-- 9. AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
    audit_id     BIGSERIAL PRIMARY KEY,
    actor_uid    VARCHAR(128),
    actor_role   VARCHAR(20),
    actor_id     INTEGER,
    action       VARCHAR(60)  NOT NULL,
    entity_type  VARCHAR(40)  NOT NULL,
    entity_id    INTEGER,
    summary      TEXT,
    metadata     JSONB        NOT NULL DEFAULT '{}'::jsonb,
    request_id   VARCHAR(64),
    ip_address   VARCHAR(64),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity  ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor   ON audit_log (actor_role, actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);

-- =====================================================
-- 10. INVENTORY MOVEMENT LEDGER
-- =====================================================
-- qty_on_hand used to be a number anybody could overwrite with no history.
-- Every change now leaves a row here, and approving an estimate consumes the
-- materials it was priced with.

CREATE TABLE IF NOT EXISTS inventory_movement (
    movement_id         BIGSERIAL PRIMARY KEY,
    item_id             INTEGER      NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    change_qty          NUMERIC(12, 2) NOT NULL,
    balance_after       NUMERIC(12, 2) NOT NULL,
    reason              VARCHAR(30)  NOT NULL,
    related_entity_type VARCHAR(30),
    related_entity_id   INTEGER,
    note                VARCHAR(250),
    actor_role          VARCHAR(20),
    actor_id            INTEGER,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT inventory_movement_reason_check CHECK (
        reason IN ('initial', 'receipt', 'consumption', 'return', 'adjustment', 'correction', 'write_off')
    ),
    CONSTRAINT inventory_movement_change_nonzero CHECK (change_qty <> 0)
);

CREATE INDEX IF NOT EXISTS idx_inventory_movement_item
    ON inventory_movement (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_created
    ON inventory_movement (created_at DESC);

-- An estimate consumes its materials exactly once, however many times the
-- approve button gets clicked.
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_movement_consumption_unique
    ON inventory_movement (related_entity_type, related_entity_id, item_id)
    WHERE reason = 'consumption';

-- =====================================================
-- 11. INSPECTOR SCHEDULING
-- =====================================================
-- Weekly working hours, stored as minutes past midnight in the company's
-- local timezone. Minutes rather than TIME because every consumer of this
-- does arithmetic on it, and TIME + interval in JS is worse than integers.

CREATE TABLE IF NOT EXISTS inspector_availability (
    availability_id SERIAL PRIMARY KEY,
    inspector_id    INTEGER  NOT NULL REFERENCES inspector(inspector_id) ON DELETE CASCADE,
    weekday         SMALLINT NOT NULL,
    start_minute    SMALLINT NOT NULL,
    end_minute      SMALLINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT inspector_availability_weekday_check CHECK (weekday BETWEEN 0 AND 6),
    CONSTRAINT inspector_availability_window_check  CHECK (
        start_minute >= 0 AND end_minute <= 1440 AND end_minute > start_minute
    ),
    CONSTRAINT inspector_availability_unique UNIQUE (inspector_id, weekday, start_minute)
);

CREATE INDEX IF NOT EXISTS idx_inspector_availability_inspector
    ON inspector_availability (inspector_id, weekday);

CREATE TABLE IF NOT EXISTS inspector_time_off (
    time_off_id  SERIAL PRIMARY KEY,
    inspector_id INTEGER     NOT NULL REFERENCES inspector(inspector_id) ON DELETE CASCADE,
    starts_at    TIMESTAMPTZ NOT NULL,
    ends_at      TIMESTAMPTZ NOT NULL,
    reason       VARCHAR(150),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT inspector_time_off_range_check CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_inspector_time_off_inspector
    ON inspector_time_off (inspector_id, starts_at, ends_at);

-- Default Mon–Fri 08:00–17:00 for any inspector with nothing configured, so
-- the scheduler has something to validate against on day one.
INSERT INTO inspector_availability (inspector_id, weekday, start_minute, end_minute)
SELECT i.inspector_id, d.weekday, 480, 1020
FROM inspector i
CROSS JOIN (SELECT generate_series(1, 5) AS weekday) d
WHERE NOT EXISTS (
    SELECT 1 FROM inspector_availability a WHERE a.inspector_id = i.inspector_id
)
ON CONFLICT DO NOTHING;

COMMIT;
