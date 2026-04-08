-- ============================================================
-- Meter Reader PWA - Complete Schema Migration
-- Version: 2.0 (Combined)
-- Created: 2026-04-05
-- Database: Supabase (PostgreSQL + PostGIS)
-- Purpose: Complete schema with reader management & workflow
-- ============================================================

-- ============================================================
-- STEP 1: Enable Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis_topology SCHEMA extensions;

-- ============================================================
-- STEP 2: Helper Functions
-- ============================================================

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Find meters within X meters of a GPS point
CREATE OR REPLACE FUNCTION find_meters_nearby(
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 5000
)
RETURNS TABLE (
  meter_id UUID,
  meter_number TEXT,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.meter_number,
    ST_Distance(m.location, ST_GeogFromText(
      'SRID=4326;POINT(' || lon || ' ' || lat || ')'
    )) AS distance_meters
  FROM public.meters m
  WHERE ST_DWithin(
    m.location,
    ST_GeogFromText('SRID=4326;POINT(' || lon || ' ' || lat || ')'),
    radius_meters
  )
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 3: Create Users Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 4: Create Readers Table
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
-- STEP 5: Create Meters Table
-- ============================================================

CREATE TABLE public.meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meter_number TEXT NOT NULL,
  meter_type TEXT NOT NULL CHECK (meter_type IN ('water', 'electric', 'gas', 'solar')),
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  install_date DATE,
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'decommissioned')),
  last_reading_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cycle_id UUID  -- Added for cycle tracking
);

-- ============================================================
-- STEP 6: Create Readings Table
-- ============================================================

CREATE TABLE public.readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.meters(id) ON DELETE CASCADE,
  reader_id UUID REFERENCES public.readers(id) ON DELETE SET NULL,
  reading_timestamp TIMESTAMPTZ NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  unit TEXT NOT NULL,
  reading_type TEXT DEFAULT 'actual' CHECK (reading_type IN ('actual', 'estimated', 'adjusted', 'self_read')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'api', 'iot_device', 'import', 'ocr')),
  previous_value DECIMAL(15,4),
  delta_value DECIMAL(15,4),
  cost DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'certified')),
  rejection_reason TEXT,
  reader_notes TEXT,
  manager_notes TEXT,
  capture_location GEOGRAPHY(POINT, 4326),
  gps_accuracy_meters DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 7: Create Route Assignments Table
-- ============================================================

CREATE TABLE public.route_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL,
  reader_id UUID NOT NULL REFERENCES public.readers(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in-progress', 'completed', 'cancelled')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  cycle_id UUID,  -- Link to cycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 8: Create Cities & Cycles Tables
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
  name TEXT NOT NULL,
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

-- ============================================================
-- STEP 9: Create Indexes
-- ============================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_timezone ON public.users(timezone);

-- Readers indexes
CREATE INDEX IF NOT EXISTS idx_readers_manager_id ON public.readers(manager_id);
CREATE INDEX IF NOT EXISTS idx_readers_email ON public.readers(email);
CREATE INDEX IF NOT EXISTS idx_readers_active ON public.readers(active);

-- Meters indexes
CREATE INDEX IF NOT EXISTS idx_meters_user_id ON public.meters(user_id);
CREATE INDEX IF NOT EXISTS idx_meters_meter_number ON public.meters(meter_number);
CREATE INDEX IF NOT EXISTS idx_meters_type ON public.meters(meter_type);
CREATE INDEX IF NOT EXISTS idx_meters_status ON public.meters(status);
CREATE INDEX IF NOT EXISTS idx_meters_location ON public.meters USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_meters_last_reading ON public.meters(last_reading_date);
CREATE INDEX IF NOT EXISTS idx_meters_user_meter_number ON public.meters(user_id, meter_number);
CREATE INDEX IF NOT EXISTS idx_meters_cycle_id ON public.meters(cycle_id);

-- Readings indexes
CREATE INDEX IF NOT EXISTS idx_readings_meter_id ON public.readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON public.readings(reading_timestamp);
CREATE INDEX IF NOT EXISTS idx_readings_meter_timestamp ON public.readings(meter_id, reading_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_readings_type ON public.readings(reading_type);
CREATE INDEX IF NOT EXISTS idx_readings_source ON public.readings(source);
CREATE INDEX IF NOT EXISTS idx_readings_status ON public.readings(status);
CREATE INDEX IF NOT EXISTS idx_readings_reader_id ON public.readings(reader_id);
CREATE INDEX IF NOT EXISTS idx_readings_capture_location ON public.readings USING GIST(capture_location);

-- Route assignments indexes
CREATE INDEX IF NOT EXISTS idx_route_assignments_reader_id ON public.route_assignments(reader_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_manager_id ON public.route_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_status ON public.route_assignments(status);
CREATE INDEX IF NOT EXISTS idx_route_assignments_cycle_id ON public.route_assignments(cycle_id);

-- Cycles indexes
CREATE INDEX IF NOT EXISTS idx_cycles_city_id ON public.cycles(city_id);
CREATE INDEX IF NOT EXISTS idx_cycles_status ON public.cycles(status);

-- ============================================================
-- STEP 10: Create Triggers
-- ============================================================

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS readers_updated_at ON public.readers;
CREATE TRIGGER readers_updated_at
  BEFORE UPDATE ON public.readers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS meters_updated_at ON public.meters;
CREATE TRIGGER meters_updated_at
  BEFORE UPDATE ON public.meters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS readings_updated_at ON public.readings;
CREATE TRIGGER readings_updated_at
  BEFORE UPDATE ON public.readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS route_assignments_updated_at ON public.route_assignments;
CREATE TRIGGER route_assignments_updated_at
  BEFORE UPDATE ON public.route_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS cities_updated_at ON public.cities;
CREATE TRIGGER cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS cycles_updated_at ON public.cycles;
CREATE TRIGGER cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 11: Add Constraints
-- ============================================================

-- Prevent future-dated readings
ALTER TABLE public.readings 
  DROP CONSTRAINT IF EXISTS chk_reading_not_future;
ALTER TABLE public.readings 
  ADD CONSTRAINT chk_reading_not_future 
  CHECK (reading_timestamp <= NOW() + INTERVAL '1 hour');

-- Positive values only
ALTER TABLE public.readings 
  DROP CONSTRAINT IF EXISTS chk_reading_positive;
ALTER TABLE public.readings 
  ADD CONSTRAINT chk_reading_positive 
  CHECK (value >= 0);

-- Delta consistency check
ALTER TABLE public.readings 
  DROP CONSTRAINT IF EXISTS chk_delta_consistent;
ALTER TABLE public.readings 
  ADD CONSTRAINT chk_delta_consistent 
  CHECK (
    previous_value IS NULL 
    OR delta_value IS NULL 
    OR ABS(delta_value - (value - previous_value)) < 0.0001
  );

-- ============================================================
-- STEP 12: Enable Row Level Security
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 13: RLS Policies - Users
-- ============================================================

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- STEP 14: RLS Policies - Readers
-- ============================================================

DROP POLICY IF EXISTS readers_select_own ON public.readers;
CREATE POLICY readers_select_own ON public.readers
  FOR SELECT
  USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS readers_insert_own ON public.readers;
CREATE POLICY readers_insert_own ON public.readers
  FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

DROP POLICY IF EXISTS readers_update_own ON public.readers;
CREATE POLICY readers_update_own ON public.readers
  FOR UPDATE
  USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS readers_delete_own ON public.readers;
CREATE POLICY readers_delete_own ON public.readers
  FOR DELETE
  USING (auth.uid() = manager_id);

-- ============================================================
-- STEP 15: RLS Policies - Meters
-- ============================================================

DROP POLICY IF EXISTS meters_select_own ON public.meters;
CREATE POLICY meters_select_own ON public.meters
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS meters_insert_own ON public.meters;
CREATE POLICY meters_insert_own ON public.meters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS meters_update_own ON public.meters;
CREATE POLICY meters_update_own ON public.meters
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS meters_delete_own ON public.meters;
CREATE POLICY meters_delete_own ON public.meters
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- STEP 16: RLS Policies - Readings (Updated for workflow)
-- ============================================================

DROP POLICY IF EXISTS readings_select_workflow ON public.readings;
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

DROP POLICY IF EXISTS readings_insert_workflow ON public.readings;
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

DROP POLICY IF EXISTS readings_update_workflow ON public.readings;
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
-- STEP 17: RLS Policies - Route Assignments
-- ============================================================

DROP POLICY IF EXISTS route_assignments_select_own ON public.route_assignments;
CREATE POLICY route_assignments_select_own ON public.route_assignments
  FOR SELECT
  USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS route_assignments_insert_own ON public.route_assignments;
CREATE POLICY route_assignments_insert_own ON public.route_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

DROP POLICY IF EXISTS route_assignments_update_own ON public.route_assignments;
CREATE POLICY route_assignments_update_own ON public.route_assignments
  FOR UPDATE
  USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS route_assignments_delete_own ON public.route_assignments;
CREATE POLICY route_assignments_delete_own ON public.route_assignments
  FOR DELETE
  USING (auth.uid() = manager_id);

-- ============================================================
-- STEP 18: RLS Policies - Cities & Cycles
-- ============================================================

DROP POLICY IF EXISTS cities_select_all ON public.cities;
CREATE POLICY cities_select_all ON public.cities
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS cycles_select_own ON public.cycles;
CREATE POLICY cycles_select_own ON public.cycles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS cycles_insert_own ON public.cycles;
CREATE POLICY cycles_insert_own ON public.cycles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS cycles_update_own ON public.cycles;
CREATE POLICY cycles_update_own ON public.cycles
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- STEP 19: Helper Functions for Workflow
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
