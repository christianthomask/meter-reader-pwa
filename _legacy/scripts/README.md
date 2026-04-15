# Mock Data Generator

Generates realistic test data for the Meter Reader PWA.

## What It Creates

- **5 users** with profile data
- **100 meters** (water, electric, gas, solar mix)
- **1,500+ readings** with realistic usage patterns
- GPS coordinates spread across Los Angeles area
- 365 days of historical data

## Prerequisites

**Node.js:** v18 or later

**Supabase CLI:** ❌ **NOT required** for this script

The script uses the Supabase JavaScript client library, not the CLI.

## Setup

### 1. Install Dependencies

```bash
cd /home/ctk/.openclaw/workspace/projects/meter-reader-pwa
npm install
```

This installs:
- `@supabase/supabase-js` - Supabase client
- `dotenv` - Environment variable loading
- `uuid` - Unique ID generation

### 2. Configure Environment (Optional)

The script already has your credentials hardcoded for the POC, but you can use a `.env` file:

```bash
# Create .env file
cp .env.example .env

# Edit with your values (if different from defaults)
SUPABASE_URL=https://qjvexijvewosweznmgtg.supabase.co
SUPABASE_ANON_KEY=sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj
```

### 3. Run the Generator

```bash
npm run generate-mock-data
```

Or directly:

```bash
node scripts/generate-mock-data.js
```

## Expected Output

```
🧪 Meter Reader PWA - Mock Data Generator

📍 Supabase URL: https://qjvexijvewosweznmgtg.supabase.co
📊 Generating:
   - 5 users
   - ~100 meters
   - ~1500 readings

👤 Generating users...
📊 Generating meters...
📈 Generating readings...

📤 Inserting data into Supabase...

   Inserting users...
   ✅ Inserted 5 users
   Inserting meters...
   ✅ Inserted 100 meters
   Inserting readings (in batches)...
      Progress: 100/1500 readings (7%)
      Progress: 200/1500 readings (13%)
      ...
   ✅ Inserted 1500 readings

🎉 Mock data generation complete!
```

## Configuration

Edit `scripts/generate-mock-data.js` to customize:

```javascript
const CONFIG = {
  numUsers: 5,              // Number of test users
  numMetersPerUser: 20,     // Meters per user
  numReadingsPerMeter: 15,  // Readings per meter
  daysOfHistory: 365,       // How far back to generate
  
  centerLat: 34.0522,       // GPS center (Los Angeles)
  centerLon: -118.2437,
  locationRadiusKm: 50,     // Spread radius
  
  // Meter type distribution (must sum to 1.0)
  meterTypes: {
    water: 0.35,
    electric: 0.35,
    gas: 0.20,
    solar: 0.10
  }
};
```

## Troubleshooting

### "Failed to insert" errors

- Check that your Supabase project is active
- Verify RLS policies allow inserts (they should for authenticated users)
- For initial testing, you can temporarily disable RLS:
  ```sql
  ALTER TABLE public.meters DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.readings DISABLE ROW LEVEL SECURITY;
  ```

### "Rate limit" errors

The script batches inserts to avoid this. If you still hit limits:
- Reduce `numReadingsPerMeter` in config
- Increase delay between batches (add `await new Promise(r => setTimeout(r, 1000))`)

### "PostGIS error" on insert

Make sure PostGIS extension is enabled in Supabase:
1. Go to Database → Extensions
2. Enable `postgis` and `postgis_topology`

## Clear Mock Data

To wipe and regenerate:

```sql
-- Run in Supabase SQL Editor
TRUNCATE public.readings CASCADE;
TRUNCATE public.meters CASCADE;
TRUNCATE public.users CASCADE;
```

Then re-run the generator.

---

**Next Step:** After generating mock data, we'll build aggregation tables and triggers (Stage 5).
