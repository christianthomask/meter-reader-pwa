-- ============================================================
-- Meter Reader PWA - Migration 004: Route Assignment Progress Tracking
-- Version: 2.1
-- Created: 2026-04-05
-- Database: Supabase (PostgreSQL)
-- Purpose: Add progress tracking columns to route_assignments table
-- ============================================================

-- ============================================================
-- STEP 1: Add Progress Tracking Columns
-- ============================================================

-- Add meters_total column (total meters in the route)
ALTER TABLE public.route_assignments 
  ADD COLUMN IF NOT EXISTS meters_total INTEGER DEFAULT 0;

-- Add meters_read column (completed/approved readings)
ALTER TABLE public.route_assignments 
  ADD COLUMN IF NOT EXISTS meters_read INTEGER DEFAULT 0;

-- Add meters_pending column (readings awaiting review)
ALTER TABLE public.route_assignments 
  ADD COLUMN IF NOT EXISTS meters_pending INTEGER DEFAULT 0;

-- ============================================================
-- STEP 2: Create Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_route_assignments_meters_total 
  ON public.route_assignments(meters_total);

CREATE INDEX IF NOT EXISTS idx_route_assignments_meters_read 
  ON public.route_assignments(meters_read);

-- ============================================================
-- STEP 3: Create Trigger Function for Auto-Update
-- ============================================================

-- Function to update meters_read and meters_pending when readings change status
CREATE OR REPLACE FUNCTION update_route_assignment_progress()
RETURNS TRIGGER AS $$
DECLARE
  assignment_route_id UUID;
  assignment_reader_id UUID;
BEGIN
  -- Determine which route assignment to update
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    assignment_route_id := NEW.meter_id;  -- Will be updated via meter's route
    assignment_reader_id := NEW.reader_id;
  ELSIF TG_OP = 'DELETE' THEN
    assignment_route_id := OLD.meter_id;
    assignment_reader_id := OLD.reader_id;
  END IF;

  -- Update the route assignment counters
  IF TG_OP = 'DELETE' THEN
    -- Reading deleted, decrement counters
    UPDATE public.route_assignments
    SET 
      meters_read = GREATEST(0, meters_read - 1),
      meters_pending = GREATEST(0, meters_pending - 1),
      updated_at = NOW()
    WHERE route_id = assignment_route_id
    AND reader_id = assignment_reader_id;
  ELSE
    -- Reading inserted or updated, recalculate counters
    UPDATE public.route_assignments ra
    SET 
      meters_read = (
        SELECT COUNT(*) 
        FROM public.readings r
        JOIN public.meters m ON r.meter_id = m.id
        WHERE r.reader_id = ra.reader_id
        AND r.status IN ('approved', 'certified')
        AND m.zip_code::uuid = ra.route_id  -- Cast zip_code to UUID for comparison
      ),
      meters_pending = (
        SELECT COUNT(*) 
        FROM public.readings r
        JOIN public.meters m ON r.meter_id = m.id
        WHERE r.reader_id = ra.reader_id
        AND r.status = 'pending'
        AND m.zip_code::uuid = ra.route_id
      ),
      updated_at = NOW()
    WHERE ra.route_id = assignment_route_id
    AND ra.reader_id = assignment_reader_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 4: Create Trigger on Readings Table
-- ============================================================

DROP TRIGGER IF EXISTS trg_update_assignment_progress ON public.readings;
CREATE TRIGGER trg_update_assignment_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.readings
  FOR EACH ROW
  EXECUTE FUNCTION update_route_assignment_progress();

-- ============================================================
-- STEP 5: Populate Existing Assignments (if any)
-- ============================================================

-- Update meters_total for existing assignments based on meter count per zip
-- Note: route_id stores zip_code as text, so we compare text to text
UPDATE public.route_assignments ra
SET meters_total = (
  SELECT COUNT(*) 
  FROM public.meters m 
  WHERE m.zip_code = ra.route_id::text
)
WHERE meters_total = 0;

-- Update meters_read for existing assignments
UPDATE public.route_assignments ra
SET 
  meters_read = (
    SELECT COUNT(*) 
    FROM public.readings r
    JOIN public.meters m ON r.meter_id = m.id
    WHERE r.reader_id = ra.reader_id
    AND r.status IN ('approved', 'certified')
    AND m.zip_code = ra.route_id::text
  ),
  meters_pending = (
    SELECT COUNT(*) 
    FROM public.readings r
    JOIN public.meters m ON r.meter_id = m.id
    WHERE r.reader_id = ra.reader_id
    AND r.status = 'pending'
    AND m.zip_code = ra.route_id::text
  )
WHERE reader_id IS NOT NULL;

-- ============================================================
-- STEP 6: Add Comments for Documentation
-- ============================================================

COMMENT ON COLUMN public.route_assignments.meters_total IS 'Total meters in the assigned route';
COMMENT ON COLUMN public.route_assignments.meters_read IS 'Number of meters with approved/certified readings';
COMMENT ON COLUMN public.route_assignments.meters_pending IS 'Number of meters with pending readings awaiting review';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
