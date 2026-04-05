# Supabase Storage Setup - Meter Reader Photos

## Create Storage Bucket

### Steps

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/qjvexijvewosweznmgtg
   - Navigate to: **Storage** (left sidebar)

2. **Create New Bucket**
   - Click **New Bucket** button
   - Fill in the form:
     - **Name:** `meter-photos`
     - **Public bucket:** ✅ **Enable** (toggle on)
       - This makes files publicly accessible via URL
     - **File size limit:** `10485760` bytes (10MB)
   - Click **Create bucket**

---

## Configure Access (RLS Policies)

**Note:** Supabase's Storage UI has changed. You can add policies via the **Policies** page OR directly in SQL Editor.

### Option A: Via Storage Policies UI (Recommended)

1. **Go to Storage Policies**
   - In the Storage section, click on your `meter-photos` bucket
   - Look for **Policies** tab (or "Access policies" section)
   - Click **New Policy** (or "Add policy")

2. **Create Policy 1: Upload (INSERT)**
   - Policy type: **Insert** (or "Create")
   - Policy name: `Allow authenticated users to upload`
   - Target role: `authenticated`
   - Policy definition (SQL):
     ```sql
     bucket_id = 'meter-photos'
     ```
   - Click **Save** or **Create**

3. **Create Policy 2: View (SELECT)**
   - Policy type: **Select** (or "Read")
   - Policy name: `Allow users to view photos`
   - Target role: `authenticated`
   - Policy definition (SQL):
     ```sql
     bucket_id = 'meter-photos'
     ```
   - Click **Save** or **Create**

4. **Create Policy 3: Delete (DELETE)**
   - Policy type: **Delete** (or "Remove")
   - Policy name: `Allow users to delete their photos`
   - Target role: `authenticated`
   - Policy definition (SQL):
     ```sql
     bucket_id = 'meter-photos'
     ```
   - Click **Save** or **Create**

---

### Option B: Via SQL Editor (Alternative)

If the UI doesn't show policy options, use SQL Editor:

1. **Go to SQL Editor**
   - In left sidebar, click **SQL Editor**
   - Click **New Query**

2. **Run this SQL:**
   ```sql
   -- Enable RLS on storage.objects
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

   -- Policy 1: Allow uploads
   CREATE POLICY "Allow authenticated users to upload photos"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'meter-photos');

   -- Policy 2: Allow viewing
   CREATE POLICY "Allow users to view photos"
   ON storage.objects
   FOR SELECT
   TO authenticated
   USING (bucket_id = 'meter-photos');

   -- Policy 3: Allow deletion
   CREATE POLICY "Allow users to delete their photos"
   ON storage.objects
   FOR DELETE
   TO authenticated
   USING (bucket_id = 'meter-photos');
   ```

3. **Click Run** (or Cmd/Ctrl + Enter)

---

## Verify Setup

### Check Bucket Exists
1. Go back to **Storage**
2. You should see `meter-photos` in the bucket list

### Check Policies
1. Click on `meter-photos` bucket
2. Go to **Policies** tab
3. You should see 3 policies:
   - ✅ Allow authenticated users to upload photos (INSERT)
   - ✅ Allow users to view photos (SELECT)
   - ✅ Allow users to delete their photos (DELETE)

### Test Upload (Optional)
1. Click on `meter-photos` bucket
2. Click **Upload** button
3. Select any image file from your computer
4. Verify it appears in the file list
5. Click on the file → Copy **Public URL**
6. Open URL in browser - should display the image

---

## Expected URL Format

After uploading, your photo URLs will look like:
```
https://qjvexijvewosweznmgtg.supabase.co/storage/v1/object/public/meter-photos/readings/M-DEMO-001/1234567890-photo.jpg
```

The frontend code automatically generates this URL after upload.

---

## Troubleshooting

### "Policy not found" or "Permission denied"
- Make sure you're using the **authenticated** role, not "public"
- Verify bucket name matches exactly: `meter-photos`

### Can't find Policies tab
- Supabase may have moved it. Try:
  - Bucket → Settings → Policies
  - Or use **Option B** (SQL Editor) above

### Upload fails in the app
- Check browser console for error messages
- Verify bucket is marked as **Public**
- Confirm you're logged in (authenticated user)

---

## Next Steps

After the bucket is created:
1. ✅ Frontend code will upload photos automatically
2. ✅ URLs will be stored in `readings.photo_url`
3. ✅ Photos will display in the Photo Review tab

---

## Storage Costs (Estimate)

- **Free tier:** 1GB storage, 2GB bandwidth/month
- **Photo size:** ~2-5MB per photo (compressed)
- **Estimated:** 200-500 photos before hitting free tier limit

For POC testing, the free tier is sufficient.
