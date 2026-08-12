-- =====================================================
-- 001 — cost_estimate: materials + roof dimensions
-- =====================================================
--
-- Two separate problems fixed here.
--
-- 1. `materials`
--    estimate-service has always INSERTed and UPDATEd a `materials` column,
--    but no CREATE TABLE ever defined it. Any database built purely from
--    markit_roofing.sql would reject every estimate write. If your running
--    database already has this column it was added by hand; the IF NOT EXISTS
--    guard below makes re-running this safe either way.
--
-- 2. `length_ft` / `width_ft` / `pitch_ft`
--    The estimate form collects roof dimensions, derives a square footage and
--    a total, then throws the inputs away — only the rendered `details` string
--    survived. That made "Edit estimate" impossible to prefill: the admin was
--    handed a blank calculator and whatever they retyped overwrote the
--    original. Persisting the three inputs makes an estimate reproducible.
--
-- Idempotent: safe to run more than once.
-- Run with:  psql -d markit_roofing -f database/migrations/001_cost_estimate_dimensions.sql

BEGIN;

-- Raw material lines: [{ material_id, quantity, cost }, ...]
-- JSONB rather than TEXT so the rows stay queryable later.
ALTER TABLE cost_estimate
    ADD COLUMN IF NOT EXISTS materials JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Roof dimensions in feet, exactly as entered on the estimate form.
-- Nullable: estimates created before this migration have no dimensions to
-- backfill, and pitch is optional on the form even for new ones.
ALTER TABLE cost_estimate
    ADD COLUMN IF NOT EXISTS length_ft NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS width_ft  NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS pitch_ft  NUMERIC(10, 2);

-- Dimensions are either a positive measurement or absent. A zero or negative
-- length would silently produce a $0 estimate, so reject it at the boundary.
ALTER TABLE cost_estimate
    DROP CONSTRAINT IF EXISTS cost_estimate_dimensions_positive;

ALTER TABLE cost_estimate
    ADD CONSTRAINT cost_estimate_dimensions_positive CHECK (
        (length_ft IS NULL OR length_ft > 0) AND
        (width_ft  IS NULL OR width_ft  > 0) AND
        (pitch_ft  IS NULL OR pitch_ft >= 0)
    );

-- The admin queue reads "everything awaiting review, newest first" on every
-- page load, and the inspector dashboard filters by author.
CREATE INDEX IF NOT EXISTS idx_cost_estimate_status
    ON cost_estimate (status);

CREATE INDEX IF NOT EXISTS idx_cost_estimate_inspector
    ON cost_estimate (inspector_id, estimate_date DESC);

COMMIT;
