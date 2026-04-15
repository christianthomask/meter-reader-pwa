-- ============================================================
-- Link Mock Data to Auth User
-- Purpose: Update mock data user_id to match your auth user
-- Run this AFTER signing up via the app
-- ============================================================

-- STEP 1: Find your auth user ID
-- Run this in Supabase SQL Editor after logging in via the app
SELECT 
  id, 
  email, 
  created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Copy your user ID from the results above
-- Example: '12345678-1234-1234-1234-123456789abc'

-- STEP 2: Update mock data to use your user ID
-- Replace YOUR_USER_ID_HERE with your actual auth.users.id

-- Update meters
UPDATE public.meters 
SET user_id = 'YOUR_USER_ID_HERE'::uuid 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@meterreader.test'
);

-- Update users table (mock user profiles)
UPDATE public.users 
SET id = 'YOUR_USER_ID_HERE'::uuid,
    email = 'your-actual-email@example.com'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@meterreader.test'
);

-- STEP 3: Verify the update
SELECT 
  COUNT(*) as meter_count,
  user_id 
FROM public.meters 
GROUP BY user_id;

-- STEP 4: Re-enable RLS (after verifying data is linked)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'meters', 'readings');

-- ============================================================
-- ALTERNATIVE: Delete mock data and re-run generator
-- ============================================================

-- If you prefer to start fresh:
-- 1. Delete all mock data
DELETE FROM public.readings WHERE meter_id IN (SELECT id FROM public.meters WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@meterreader.test'));
DELETE FROM public.meters WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@meterreader.test');
DELETE FROM public.users WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@meterreader.test');

-- 2. Run the mock data generator with your auth user ID
-- See: scripts/generate-mock-data-linked.js

-- ============================================================
-- END OF SCRIPT
-- ============================================================
