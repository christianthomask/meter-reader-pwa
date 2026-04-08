-- ============================================================
-- Meter Reader PWA - Migration 003
-- Add route_assignments table for manager self-assignment
-- Version: 0.3.0 (Managers-Only POC)
-- Created: 2026-04-04
-- ============================================================

-- Create route_assignments table
CREATE TABLE IF NOT EXISTS public.route_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  route_area TEXT NOT NULL,  -- zip_code or area identifier
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in-progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  meters_total INTEGER DEFAULT 0,
  meters_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active assignment per user per area
  UNIQUE(user_id, route_area)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_route_assignments_user_id ON public.route_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_area ON public.route_assignments(route_area);
CREATE INDEX IF NOT EXISTS idx_route_assignments_status ON public.route_assignments(status);

-- Trigger for updated_at
CREATE TRIGGER route_assignments_updated_at
  BEFORE UPDATE ON public.route_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.route_assignments ENABLE ROW LEVEL SECURITY;

-- Users can see their own assignments
CREATE POLICY route_assignments_select_own ON public.route_assignments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own assignments
CREATE POLICY route_assignments_insert_own ON public.route_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own assignments
CREATE POLICY route_assignments_update_own ON public.route_assignments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own assignments
CREATE POLICY route_assignments_delete_own ON public.route_assignments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.route_assignments IS 'Manager self-assignment of reading routes (managers-only POC)';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
