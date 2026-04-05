# RLS Setup Guide - Link Mock Data to Auth User

**Problem:** Mock data was generated with random user IDs, but RLS policies only show data where `user_id = auth.uid()`.

**Solution:** Link existing mock data to YOUR auth user account.

---

## Option A: Quick Fix (SQL Script)

**Best if:** You already have mock data and just want to link it

### Steps

1. **Sign up via the app** (if you haven't already)
   - Go to https://meter-reader-pwa.vercel.app
   - Click "Sign up"
   - Use any email/password

2. **Get your User ID**
   - Open Supabase Dashboard: https://supabase.com/dashboard/project/qjvexijvewosweznmgtg
   - Go to **Authentication** → **Users**
   - Find your user (most recent)
   - Copy the **User ID** (UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

3. **Run the SQL script**
   - Go to **SQL Editor** in Supabase Dashboard
   - Open `scripts/link-mock-data-to-auth.sql`
   - Replace `YOUR_USER_ID_HERE` with your actual user ID
   - Click **Run**

4. **Verify**
   ```sql
   SELECT COUNT(*) as meter_count, user_id 
   FROM public.meters 
   GROUP BY user_id;
   ```
   Should show your user ID with ~100 meters

5. **Re-enable RLS**
   ```sql
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
   ```

---

## Option B: Fresh Start (Regenerate Data)

**Best if:** You want clean data tied to your account from the start

### Steps

1. **Get your User ID** (same as Option A, steps 1-2)

2. **Set up environment variables**
   ```bash
   cd /home/ctk/.openclaw/workspace/projects/meter-reader-pwa
   ```
   
   Create/edit `.env`:
   ```bash
   SUPABASE_URL=https://qjvexijvewosweznmgtg.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   AUTH_USER_ID=your-user-id-here
   ```
   
   **Get Service Role Key:**
   - Supabase Dashboard → **Settings** → **API**
   - Copy the **service_role** key (NOT the anon key!)
   - ⚠️ **Never commit this to git!**

3. **Delete old mock data** (optional but recommended)
   ```sql
   -- In SQL Editor
   DELETE FROM public.readings WHERE meter_id IN (SELECT id FROM public.meters WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@meterreader.test'));
   DELETE FROM public.meters WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@meterreader.test');
   DELETE FROM public.users WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@meterreader.test');
   ```

4. **Run the generator**
   ```bash
   cd scripts
   npm install  # if not already done
   node generate-mock-data-linked.js
   ```

5. **Verify**
   - Should see: `✅ Inserted 20 meters` and `✅ Inserted 300 readings`
   - All data is now linked to YOUR user ID

6. **Re-enable RLS** (same as Option A, step 5)

---

## Verify RLS is Working

After linking data and re-enabling RLS, test it:

```sql
-- This should return your meters
SELECT COUNT(*) FROM public.meters;

-- This should return 0 (you can't see other users' data)
-- Run this while logged in as a DIFFERENT user to verify
```

---

## Troubleshooting

### "No rows returned" after enabling RLS

**Cause:** Data not linked to your user ID

**Fix:** Run Option A or B above

### "permission denied for table"

**Cause:** Using anon key instead of service role key for admin operations

**Fix:** Use service role key for migrations/data generation, anon key for app

### Can't find my User ID

**Alternative:** Run this in SQL Editor:
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Next Steps

After RLS is enabled:
1. Test the reading form submission
2. Verify you only see your own meters/readings
3. Proceed with Photo Upload integration

---

**Questions?** Check Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
