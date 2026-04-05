# Migration Execution Guide

## Migration 002: Add Notes Column

**File:** `migrations/002_add_notes_column.sql`  
**Purpose:** Add `notes` TEXT column to `readings` table for manager comments

---

## Option A: Run via Supabase Dashboard (Recommended)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qjvexijvewosweznmgtg
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy/paste contents of `migrations/002_add_notes_column.sql`
5. Click **Run** (or Cmd/Ctrl + Enter)
6. Verify success - should see "Success. No rows returned"

### Verify Migration

Run this query to confirm:

```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'readings' AND column_name = 'notes';

-- Should return: notes | text
```

---

## Option B: Run via Supabase CLI

```bash
# Install CLI if not already installed
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref qjvexijvewosweznmgtg

# Run migration
supabase db execute --file migrations/002_add_notes_column.sql
```

---

## Rollback (if needed)

```sql
ALTER TABLE public.readings DROP COLUMN IF EXISTS notes;
DROP INDEX IF EXISTS idx_readings_has_notes;
```

---

## Next: Update Frontend Types

After running migration, update `frontend/src/lib/supabase.ts` to include `notes` field in types.
