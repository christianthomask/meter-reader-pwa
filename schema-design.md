# Meter Reader PWA - Database Schema Design

**Project:** Meter Reader Progressive Web App  
**Database:** Supabase (PostgreSQL + PostGIS)  
**Version:** 1.0  
**Created:** 2026-04-04  

---

## Entity Relationship Diagram

```
users (1) ──< (many) meters
              │
              └── (1) ──< (many) readings
```

---

## Extension Setup

```sql
-- Enable PostGIS (run once per Supabase project)
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis_topology SCHEMA extensions;
```

---

## Table: users

Extends Supabase's `auth.users` table with profile data.

```sql
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

-- Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_timezone ON public.users(timezone);

-- Trigger for updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | References `auth.users.id` |
| `email` | TEXT | User's email (unique) |
| `full_name` | TEXT | Display name |
| `phone` | TEXT | Optional contact |
| `timezone` | TEXT | Default: America/Los_Angeles |
| `preferences` | JSONB | Flexible settings (notifications, units, themes) |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

---

## Table: meters

Stores meter metadata and GPS locations.

```sql
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

-- Indexes
CREATE INDEX idx_meters_user_id ON public.meters(user_id);
CREATE INDEX idx_meters_meter_number ON public.meters(meter_number);
CREATE INDEX idx_meters_type ON public.meters(meter_type);
CREATE INDEX idx_meters_status ON public.meters(status);
CREATE INDEX idx_meters_location ON public.meters USING GIST(location);
CREATE INDEX idx_meters_last_reading ON public.meters(last_reading_date);

-- Unique constraint: one meter number per user
CREATE UNIQUE INDEX idx_meters_user_meter_number 
  ON public.meters(user_id, meter_number);

-- Trigger for updated_at
CREATE TRIGGER meters_updated_at
  BEFORE UPDATE ON public.meters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to `users.id` |
| `meter_number` | TEXT | Utility-assigned meter ID |
| `meter_type` | TEXT | water/electric/gas/solar |
| `manufacturer` | TEXT | Meter manufacturer |
| `model` | TEXT | Meter model |
| `serial_number` | TEXT | Device serial |
| `install_date` | DATE | When installed |
| `location` | GEOGRAPHY(POINT, 4326) | GPS coordinates (WGS84) |
| `address` | TEXT | Street address |
| `city` | TEXT | City |
| `state` | TEXT | State/Province |
| `zip_code` | TEXT | Postal code |
| `status` | TEXT | active/inactive/maintenance/decommissioned |
| `last_reading_date` | TIMESTAMPTZ | Last reading timestamp |
| `metadata` | JSONB | Custom fields per meter type |

---

## Table: readings

Time-series utility readings.

```sql
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

-- Indexes
CREATE INDEX idx_readings_meter_id ON public.readings(meter_id);
CREATE INDEX idx_readings_timestamp ON public.readings(reading_timestamp);
CREATE INDEX idx_readings_meter_timestamp ON public.readings(meter_id, reading_timestamp DESC);
CREATE INDEX idx_readings_type ON public.readings(reading_type);
CREATE INDEX idx_readings_source ON public.readings(source);

-- Constraints
ALTER TABLE public.readings 
  ADD CONSTRAINT chk_reading_not_future 
  CHECK (reading_timestamp <= NOW() + INTERVAL '1 hour');

ALTER TABLE public.readings 
  ADD CONSTRAINT chk_reading_positive 
  CHECK (value >= 0);

ALTER TABLE public.readings 
  ADD CONSTRAINT chk_delta_consistent 
  CHECK (
    previous_value IS NULL 
    OR delta_value IS NULL 
    OR ABS(delta_value - (value - previous_value)) < 0.0001
  );

-- Trigger for updated_at
CREATE TRIGGER readings_updated_at
  BEFORE UPDATE ON public.readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `meter_id` | UUID | Foreign key to `meters.id` |
| `reading_timestamp` | TIMESTAMPTZ | When reading was taken |
| `value` | DECIMAL(15,4) | Reading value (high precision) |
| `unit` | TEXT | kWh/gallons/therms/kW/etc |
| `reading_type` | TEXT | actual/estimated/adjusted/self_read |
| `source` | TEXT | manual/api/iot_device/import/ocr |
| `previous_value` | DECIMAL(15,4) | Prior reading for delta |
| `delta_value` | DECIMAL(15,4) | Usage since last reading |
| `cost` | DECIMAL(10,2) | Optional cost |
| `metadata` | JSONB | Weather, occupancy, notes |
| `photo_url` | TEXT | Photo of meter display |

---

## Helper Functions

### Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Find Meters Nearby

```sql
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
```

### Meter Distance

```sql
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
```

### User Meter Bounds (for map viewport)

```sql
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
```

---

## Row Level Security (RLS) Policies

### Enable RLS

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
```

### Users Policies

```sql
-- Users can only see their own profile
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Meters Policies

```sql
-- Users can see their own meters
CREATE POLICY meters_select_own ON public.meters
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own meters
CREATE POLICY meters_insert_own ON public.meters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own meters
CREATE POLICY meters_update_own ON public.meters
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own meters
CREATE POLICY meters_delete_own ON public.meters
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Readings Policies

```sql
-- Users can see readings from their own meters
CREATE POLICY readings_select_own ON public.readings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

-- Users can insert readings for their own meters
CREATE POLICY readings_insert_own ON public.readings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = meter_id
      AND meters.user_id = auth.uid()
    )
  );

-- Users can update readings from their own meters
CREATE POLICY readings_update_own ON public.readings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

-- Users can delete readings from their own meters
CREATE POLICY readings_delete_own ON public.readings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meters
      WHERE meters.id = readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );
```

---

## Index Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | `idx_users_email` | B-tree | Fast login lookup |
| users | `idx_users_timezone` | B-tree | Timezone queries |
| meters | `idx_meters_user_id` | B-tree | List user's meters |
| meters | `idx_meters_meter_number` | B-tree | Search by number |
| meters | `idx_meters_user_meter_number` | B-tree (unique) | Prevent duplicates |
| meters | `idx_meters_type` | B-tree | Filter by type |
| meters | `idx_meters_status` | B-tree | Filter by status |
| meters | `idx_meters_location` | GIST | Spatial queries |
| meters | `idx_meters_last_reading` | B-tree | Find stale meters |
| readings | `idx_readings_meter_id` | B-tree | Lookup by meter |
| readings | `idx_readings_timestamp` | B-tree | Global time queries |
| readings | `idx_readings_meter_timestamp` | B-tree (composite) | Time-series per meter |
| readings | `idx_readings_type` | B-tree | Filter by type |
| readings | `idx_readings_source` | B-tree | Filter by source |

---

## Security Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | Own only | Own only | Own only | N/A |
| meters | Own only | Own only | Own only | Own only |
| readings | Own meters | Own meters | Own meters | Own meters |

**Notes:**
- RLS is always on - no accidental data leaks
- `auth.uid()` is the current authenticated user's ID
- Policies cascade through relationships
- Service role can bypass RLS for admin/migration scripts

---

## Next Steps

1. **Stage 2:** Create Supabase project and enable PostGIS
2. **Stage 3:** Apply schema (tables, indexes, constraints)
3. **Stage 4:** Verify PostGIS functionality
4. **Stage 5:** Create aggregation tables and triggers
5. **Stage 6:** Generate mock data
6. **Stage 7:** Create migration scripts

---

**File Location:** `/home/ctk/.openclaw/workspace/projects/meter-reader-pwa/schema-design.md`
