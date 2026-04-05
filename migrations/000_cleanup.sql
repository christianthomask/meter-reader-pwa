-- ============================================================
-- Meter Reader PWA - Cleanup Script
-- Purpose: Drop all tables to allow clean migration re-run
-- WARNING: This will DELETE ALL DATA
-- ============================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.route_assignments CASCADE;
DROP TABLE IF EXISTS public.readers CASCADE;
DROP TABLE IF EXISTS public.cycles CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.readings CASCADE;
DROP TABLE IF EXISTS public.meters CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS get_manager_pending_readings(UUID);
DROP FUNCTION IF EXISTS get_cycle_progress(UUID);
DROP FUNCTION IF EXISTS find_meters_nearby(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS meter_distance(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_meter_bounds(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop extensions (optional - usually keep these)
-- DROP EXTENSION IF EXISTS postgis;
-- DROP EXTENSION IF EXISTS postgis_topology;

-- ============================================================
-- ✅ Database cleaned. Ready to run migrations.
-- ============================================================
