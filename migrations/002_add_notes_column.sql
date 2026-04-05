-- ============================================================
-- Meter Reader PWA - Migration 002
-- Add notes column to readings table
-- Version: 0.3.0 (Managers-Only POC)
-- Created: 2026-04-04
-- ============================================================

-- Add notes column for reader comments/observations
ALTER TABLE public.readings 
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for searching readings with notes (optional, useful for filtering)
CREATE INDEX IF NOT EXISTS idx_readings_has_notes 
  ON public.readings (id) 
  WHERE notes IS NOT NULL AND notes != '';

-- Add comment for documentation
COMMENT ON COLUMN public.readings.notes IS 'Manager notes/observations about this reading';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
