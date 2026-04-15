-- ============================================================
-- Meter Reader PWA - Initial Schema Migration
-- Version: 1.0
-- Created: 2026-04-04
-- Database: Supabase (PostgreSQL + PostGIS)
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

-- Calculate distance between two meters
CREATE OR REPLACE FUNCTION meter_distance(
  meter_id_1 UUID,
  meter_id_2 UUID
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  dist DOUBLE PRECISION;
BEGIN
  SELECT ST_Distance(m1.location, m2.location)
  INTO dist
  FROM public.meters m1, public.meters m2
  WHERE m1.id = meter_id_1 AND m2.id = meter_id_2;
  RETURN dist;
END;
$$ LANGUAGE plpgsql;

-- Get bounding box for user's meters (for map viewport)
CREATE OR REPLACE FUNCTION get_user_meter_bounds(user_uuid UUID)
RETURNS TABLE (
  min_lat DOUBLE PRECISION,
  min_lon DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lon DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MIN(ST_Y(location::geometry))::DOUBLE PRECISION,
    MIN(ST_X(location::geometry))::DOUBLE PRECISION,
    MAX(ST_Y(location::geometry))::DOUBLE PRECISION,
    MAX(ST_X(location::geometry))::DOUBLE PRECISION
  FROM public.meters
  WHERE user_id = user_uuid AND location IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 3: Create Tables
-- ============================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meters table
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Readings table
CREATE TABLE public.readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.meters(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 4: Create Indexes
-- ============================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_timezone ON public.users(timezone);

-- Meters indexes
CREATE INDEX idx_meters_user_id ON public.meters(user_id);
CREATE INDEX idx_meters_meter_number ON public.meters(meter_number);
CREATE INDEX idx_meters_type ON public.meters(meter_type);
CREATE INDEX idx_meters_status ON public.meters(status);
CREATE INDEX idx_meters_location ON public.meters USING GIST(location);
CREATE INDEX idx_meters_last_reading ON public.meters(last_reading_date);
CREATE UNIQUE INDEX idx_meters_user_meter_number ON public.meters(user_id, meter_number);

-- Readings indexes
CREATE INDEX idx_readings_meter_id ON public.readings(meter_id);
CREATE INDEX idx_readings_timestamp ON public.readings(reading_timestamp);
CREATE INDEX idx_readings_meter_timestamp ON public.readings(meter_id, reading_timestamp DESC);
CREATE INDEX idx_readings_type ON public.readings(reading_type);
CREATE INDEX idx_readings_source ON public.readings(source);

-- ============================================================
-- STEP 5: Create Triggers
-- ============================================================

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER meters_updated_at
  BEFORE UPDATE ON public.meters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER readings_updated_at
  BEFORE UPDATE ON public.readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 6: Add Constraints
-- ============================================================

-- Prevent future-dated readings
ALTER TABLE public.readings 
  ADD CONSTRAINT chk_reading_not_future 
  CHECK (reading_timestamp <= NOW() + INTERVAL '1 hour');

-- Positive values only
ALTER TABLE public.readings 
  ADD CONSTRAINT chk_reading_positive 
  CHECK (value >= 0);

-- Delta consistency check
ALTER TABLE public.readings 
  ADD CONSTRAINT chk_delta_consistent 
  CHECK (
    previous_value IS NULL 
    OR delta_value IS NULL 
    OR ABS(delta_value - (value - previous_value)) < 0.0001
  );

-- ============================================================
-- STEP 7: Enable Row Level Security
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 8: RLS Policies - Users
-- ============================================================

CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- STEP 9: RLS Policies - Meters
-- ============================================================

CREATE POLICY meters_select_own ON public.meters
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY meters_insert_own ON public.meters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY meters_update_own ON public.meters
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY meters_delete_own ON public.meters
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- STEP 10: RLS Policies - Readings
-- ============================================================

CREATE POLICY readings_select_own ON public.readings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

CREATE POLICY readings_insert_own ON public.readings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = meter_id
      AND meters.user_id = auth.uid()
    )
  );

CREATE POLICY readings_update_own ON public.readings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

CREATE POLICY readings_delete_own ON public.readings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

-- ============================================================
-- END OF MIGRATION
-- ============================================================
