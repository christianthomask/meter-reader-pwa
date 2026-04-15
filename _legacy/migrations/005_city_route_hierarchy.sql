-- ============================================================
-- Meter Reader PWA - Migration 005: City/Route/Meters Hierarchy
-- Version: 1.0
-- Created: 2026-04-05
-- Database: Supabase (PostgreSQL)
-- Purpose: Implement city/route hierarchy and exception-based workflow
-- ============================================================

-- ============================================================
-- STEP 1: Create Cities Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'read_pending' CHECK (status IN ('read_pending', 'active', 'complete', 'ready_to_download')),
  total_meters INTEGER DEFAULT 0,
  meters_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_status ON public.cities(status);

-- ============================================================
-- STEP 2: Create Manager-City Relationship Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.manager_cities (
  manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  PRIMARY KEY (manager_id, city_id)
);

CREATE INDEX IF NOT EXISTS idx_manager_cities_manager ON public.manager_cities(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_cities_city ON public.manager_cities(city_id);

-- ============================================================
-- STEP 3: Create Routes Table (Separate from Meters)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'assigned', 'in-progress', 'completed')),
  total_meters INTEGER DEFAULT 0,
  meters_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_id, name)
);

CREATE INDEX IF NOT EXISTS idx_routes_city ON public.routes(city_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON public.routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_name ON public.routes(name);

-- ============================================================
-- STEP 4: Add Columns to Meters Table
-- ============================================================

ALTER TABLE public.meters 
  ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.routes(id),
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);

CREATE INDEX IF NOT EXISTS idx_meters_route ON public.meters(route_id);
CREATE INDEX IF NOT EXISTS idx_meters_city ON public.meters(city_id);

-- ============================================================
-- STEP 5: Add Columns to Readings Table for Workflow
-- ============================================================

ALTER TABLE public.readings
  ADD COLUMN IF NOT EXISTS is_exception BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_value NUMERIC,
  ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS needs_reread BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_readings_exception ON public.readings(is_exception, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_readings_needs_reread ON public.readings(status, needs_reread) WHERE status = 'rejected' AND needs_reread = true;
CREATE INDEX IF NOT EXISTS idx_readings_edited_by ON public.readings(edited_by);

-- ============================================================
-- STEP 6: Create Function to Detect Exception Readings
-- ============================================================

CREATE OR REPLACE FUNCTION check_reading_exception()
RETURNS TRIGGER AS $$
DECLARE
  previous_reading NUMERIC;
  delta_percent NUMERIC;
BEGIN
  -- Get previous reading for same meter
  SELECT value INTO previous_reading
  FROM public.readings
  WHERE meter_id = NEW.meter_id
    AND reading_timestamp < NEW.reading_timestamp
    AND status IN ('approved', 'certified')
  ORDER BY reading_timestamp DESC
  LIMIT 1;
  
  -- Calculate exception status
  IF previous_reading IS NOT NULL AND previous_reading > 0 THEN
    delta_percent := (ABS(NEW.value - previous_reading) / previous_reading) * 100;
    
    IF delta_percent > 40 OR NEW.value = 0 OR NEW.value < previous_reading THEN
      NEW.is_exception := TRUE;
    ELSE
      NEW.is_exception := FALSE;
    END IF;
  ELSE
    -- First reading or no previous reading
    NEW.is_exception := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 7: Create Trigger for Auto-Detecting Exceptions
-- ============================================================

DROP TRIGGER IF EXISTS trg_check_exception ON public.readings;
CREATE TRIGGER trg_check_exception
  BEFORE INSERT OR UPDATE ON public.readings
  FOR EACH ROW
  EXECUTE FUNCTION check_reading_exception();

-- ============================================================
-- STEP 8: Create Function to Update Route/City Progress
-- ============================================================

CREATE OR REPLACE FUNCTION update_route_city_progress()
RETURNS TRIGGER AS $$
DECLARE
  meter_route_id UUID;
  meter_city_id UUID;
BEGIN
  -- Get route and city from meter
  SELECT m.route_id, m.city_id INTO meter_route_id, meter_city_id
  FROM public.meters m
  WHERE m.id = NEW.meter_id;
  
  -- Update route progress
  IF meter_route_id IS NOT NULL THEN
    UPDATE public.routes
    SET 
      meters_read = (
        SELECT COUNT(DISTINCT r.meter_id)
        FROM public.readings r
        WHERE r.status IN ('approved', 'certified')
        AND EXISTS (
          SELECT 1 FROM public.meters m 
          WHERE m.id = r.meter_id AND m.route_id = meter_route_id
        )
      ),
      updated_at = NOW()
    WHERE id = meter_route_id;
  END IF;
  
  -- Update city progress
  IF meter_city_id IS NOT NULL THEN
    UPDATE public.cities
    SET 
      meters_read = (
        SELECT COUNT(DISTINCT r.meter_id)
        FROM public.readings r
        WHERE r.status IN ('approved', 'certified')
        AND EXISTS (
          SELECT 1 FROM public.meters m 
          WHERE m.id = r.meter_id AND m.city_id = meter_city_id
        )
      ),
      updated_at = NOW()
    WHERE id = meter_city_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_progress ON public.readings;
CREATE TRIGGER trg_update_progress
  AFTER INSERT OR UPDATE ON public.readings
  FOR EACH ROW
  EXECUTE FUNCTION update_route_city_progress();

-- ============================================================
-- STEP 9: Migrate Existing Data
-- ============================================================

-- Create default city for existing data
INSERT INTO public.cities (id, name, status, total_meters, meters_read)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default City', 'active', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Create routes from unique zip codes
INSERT INTO public.routes (city_id, name, status, total_meters)
SELECT 
  '00000000-0000-0000-0000-000000000001' as city_id,
  'Route ' || zip_code as name,
  'unassigned' as status,
  COUNT(*) as total_meters
FROM (SELECT DISTINCT zip_code FROM public.meters WHERE zip_code IS NOT NULL) AS unique_zips
GROUP BY zip_code
ON CONFLICT (city_id, name) DO NOTHING;

-- Link meters to routes
UPDATE public.meters m
SET 
  route_id = r.id,
  city_id = '00000000-0000-0000-0000-000000000001'
FROM public.routes r
WHERE r.name = 'Route ' || m.zip_code
AND m.route_id IS NULL;

-- Update city total_meters count
UPDATE public.cities c
SET total_meters = (
  SELECT COUNT(*) FROM public.meters m WHERE m.city_id = c.id
);

-- ============================================================
-- STEP 10: Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_cities ENABLE ROW LEVEL SECURITY;

-- Cities: Managers see only their assigned cities
DROP POLICY IF EXISTS cities_select_assigned ON public.cities;
CREATE POLICY cities_select_assigned ON public.cities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manager_cities mc
      WHERE mc.city_id = cities.id AND mc.manager_id = auth.uid()
    )
  );

-- Routes: Managers see routes in their assigned cities
DROP POLICY IF EXISTS routes_select_assigned ON public.routes;
CREATE POLICY routes_select_assigned ON public.routes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manager_cities mc
      WHERE mc.city_id = routes.city_id AND mc.manager_id = auth.uid()
    )
  );

-- Manager-cities: Users see only their own relationships
DROP POLICY IF EXISTS manager_cities_select_own ON public.manager_cities;
CREATE POLICY manager_cities_select_own ON public.manager_cities
  FOR SELECT
  USING (manager_id = auth.uid());

-- ============================================================
-- STEP 11: Add Comments for Documentation
-- ============================================================

COMMENT ON TABLE public.cities IS 'Cities with reading cycles and progress tracking';
COMMENT ON TABLE public.routes IS 'Routes within cities, assigned to readers';
COMMENT ON TABLE public.manager_cities IS 'Many-to-many relationship between managers and cities';
COMMENT ON COLUMN public.readings.is_exception IS 'Auto-detected unusual reading (>40% change, zero, or negative delta)';
COMMENT ON COLUMN public.readings.original_value IS 'Original reading value before manager edit';
COMMENT ON COLUMN public.readings.edited_by IS 'Manager who edited the reading value';
COMMENT ON COLUMN public.readings.edited_at IS 'Timestamp of manager edit';
COMMENT ON COLUMN public.readings.needs_reread IS 'Flag for readings requiring re-visit';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
