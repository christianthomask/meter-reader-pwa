-- ============================================================
-- Meter Reader PWA - Migration 002: Reader Management & Reading Status
-- Version: 2.0
-- Created: 2026-04-05
-- Database: Supabase (PostgreSQL + PostGIS)
-- Purpose: Add reader management and reading approval workflow
-- ============================================================

-- ============================================================
-- STEP 1: Create Readers Table
-- ============================================================

CREATE TABLE public.readers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  assigned_routes_count INTEGER DEFAULT 0,
  completed_readings_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 2: Create Route Assignments Table
-- ============================================================

CREATE TABLE public.route_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL,  -- References a logical route (zip/area grouping)
  reader_id UUID NOT NULL REFERENCES public.readers(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in-progress', 'completed', 'cancelled')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 3: Add Reading Status & Workflow Fields
-- ============================================================

-- Add status column for approval workflow
ALTER TABLE public.readings 
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending', 'approved', 'rejected', 'certified'));

-- Add rejection reason
ALTER TABLE public.readings 
  ADD COLUMN rejection_reason TEXT;

-- Add reader notes (submitted by reader with reading)
ALTER TABLE public.readings 
  ADD COLUMN reader_notes TEXT;

-- Add manager notes (internal notes added during review)
ALTER TABLE public.readings 
  ADD COLUMN manager_notes TEXT;

-- Add reader_id to track who submitted the reading
ALTER TABLE public.readings 
  ADD COLUMN reader_id UUID REFERENCES public.readers(id) ON DELETE SET NULL;

-- Add GPS capture location (where reading was taken)
ALTER TABLE public.readings 
  ADD COLUMN capture_location GEOGRAPHY(POINT, 4326);

-- Add GPS accuracy in meters
ALTER TABLE public.readings 
  ADD COLUMN gps_accuracy_meters DECIMAL(5,2);

-- ============================================================
-- STEP 4: Add Cycle/City Status Tracking (for D19)
-- ============================================================

CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- e.g., "Spring 2026", "Cycle 04-2026"
  status TEXT NOT NULL DEFAULT 'read_pending' 
    CHECK (status IN ('read_pending', 'active', 'ready_for_download', 'complete')),
  start_date DATE,
  end_date DATE,
  total_meters INTEGER DEFAULT 0,
  completed_readings INTEGER DEFAULT 0,
  approved_readings INTEGER DEFAULT 0,
  rejected_readings INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link meters to cycles
ALTER TABLE public.meters 
  ADD COLUMN cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL;

-- Link route assignments to cycles
ALTER TABLE public.route_assignments 
  ADD COLUMN cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL;

-- ============================================================
-- STEP 5: Create Indexes
-- ============================================================

-- Readers indexes
CREATE INDEX idx_readers_manager_id ON public.readers(manager_id);
CREATE INDEX idx_readers_email ON public.readers(email);
CREATE INDEX idx_readers_active ON public.readers(active);

-- Route assignments indexes
CREATE INDEX idx_route_assignments_reader_id ON public.route_assignments(reader_id);
CREATE INDEX idx_route_assignments_manager_id ON public.route_assignments(manager_id);
CREATE INDEX idx_route_assignments_status ON public.route_assignments(status);
CREATE INDEX idx_route_assignments_cycle_id ON public.route_assignments(cycle_id);

-- Readings indexes (new columns)
CREATE INDEX idx_readings_status ON public.readings(status);
CREATE INDEX idx_readings_reader_id ON public.readings(reader_id);
CREATE INDEX idx_readings_capture_location ON public.readings USING GIST(capture_location);

-- Cycles indexes
CREATE INDEX idx_cycles_city_id ON public.cycles(city_id);
CREATE INDEX idx_cycles_status ON public.cycles(status);
CREATE INDEX idx_meters_cycle_id ON public.meters(cycle_id);

-- ============================================================
-- STEP 6: Create Triggers
-- ============================================================

CREATE TRIGGER readers_updated_at
  BEFORE UPDATE ON public.readers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER route_assignments_updated_at
  BEFORE UPDATE ON public.route_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 7: Enable Row Level Security
-- ============================================================

ALTER TABLE public.readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 8: RLS Policies - Readers
-- ============================================================

-- Managers can see their own readers
CREATE POLICY readers_select_own ON public.readers
  FOR SELECT
  USING (auth.uid() = manager_id);

CREATE POLICY readers_insert_own ON public.readers
  FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY readers_update_own ON public.readers
  FOR UPDATE
  USING (auth.uid() = manager_id);

CREATE POLICY readers_delete_own ON public.readers
  FOR DELETE
  USING (auth.uid() = manager_id);

-- ============================================================
-- STEP 9: RLS Policies - Route Assignments
-- ============================================================

-- Managers can see their own assignments
CREATE POLICY route_assignments_select_own ON public.route_assignments
  FOR SELECT
  USING (auth.uid() = manager_id);

CREATE POLICY route_assignments_insert_own ON public.route_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY route_assignments_update_own ON public.route_assignments
  FOR UPDATE
  USING (auth.uid() = manager_id);

CREATE POLICY route_assignments_delete_own ON public.route_assignments
  FOR DELETE
  USING (auth.uid() = manager_id);

-- ============================================================
-- STEP 10: RLS Policies - Readings (Updated for workflow)
-- ============================================================

-- Managers can see readings from their readers
CREATE POLICY readings_select_workflow ON public.readings
  FOR SELECT
  USING (
    -- Manager's own readings (legacy support)
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = readings.meter_id
      AND meters.user_id = auth.uid()
    )
    OR
    -- Readings from manager's readers
    EXISTS (
      SELECT 1 FROM public.readers
      WHERE readers.id = readings.reader_id
      AND readers.manager_id = auth.uid()
    )
  );

CREATE POLICY readings_insert_workflow ON public.readings
  FOR INSERT
  WITH CHECK (
    -- Manager can insert (legacy support)
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = meter_id
      AND meters.user_id = auth.uid()
    )
    OR
    -- Reader's manager can approve (via reader_id)
    reader_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.readers
      WHERE readers.id = reader_id
      AND readers.manager_id = auth.uid()
    )
  );

CREATE POLICY readings_update_workflow ON public.readings
  FOR UPDATE
  USING (
    -- Manager can update readings from their meters or readers
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = readings.meter_id
      AND meters.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.readers
      WHERE readers.id = readings.reader_id
      AND readers.manager_id = auth.uid()
    )
  );

-- ============================================================
-- STEP 11: RLS Policies - Cities & Cycles
-- ============================================================

-- For now, allow managers to see all cities/cycles
-- Can be restricted later with manager_city_assignments table
CREATE POLICY cities_select_all ON public.cities
  FOR SELECT
  USING (true);

CREATE POLICY cycles_select_own ON public.cycles
  FOR SELECT
  USING (true);  -- Can be restricted later

CREATE POLICY cycles_insert_own ON public.cycles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY cycles_update_own ON public.cycles
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- STEP 12: Helper Functions for Workflow
-- ============================================================

-- Get pending readings count for manager
CREATE OR REPLACE FUNCTION get_manager_pending_readings(manager_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.readings r
    JOIN public.readers rd ON r.reader_id = rd.id
    WHERE rd.manager_id = manager_uuid
    AND r.status = 'pending'
  );
END;
$$ LANGUAGE plpgsql;

-- Get cycle progress
CREATE OR REPLACE FUNCTION get_cycle_progress(cycle_uuid UUID)
RETURNS TABLE (
  total_meters INTEGER,
  completed_readings INTEGER,
  approved_readings INTEGER,
  rejected_readings INTEGER,
  pending_readings INTEGER,
  completion_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(c.total_meters, 0) as total_meters,
    COALESCE(c.completed_readings, 0) as completed_readings,
    COALESCE(c.approved_readings, 0) as approved_readings,
    COALESCE(c.rejected_readings, 0) as rejected_readings,
    (SELECT COUNT(*) FROM public.readings r 
     JOIN public.meters m ON r.meter_id = m.id 
     WHERE m.cycle_id = cycle_uuid AND r.status = 'pending') as pending_readings,
    CASE 
      WHEN c.total_meters > 0 
      THEN ROUND((COALESCE(c.approved_readings, 0)::DECIMAL / c.total_meters) * 100, 2)
      ELSE 0 
    END as completion_percentage
  FROM public.cycles c
  WHERE c.id = cycle_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
