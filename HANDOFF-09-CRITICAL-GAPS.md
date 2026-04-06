# HANDOFF-09: Critical Workflow Gaps - City/Route/Meters Hierarchy

**Stories:** GAP-01, GAP-02, GAP-03, GAP-04, GAP-05  
**Priority:** 🔴 **CRITICAL** - Blocking core manager workflow  
**Estimated Effort:** 10-13 hours  
**Status:** 📋 Ready  
**Dependency:** Must complete before Sprint 3 (Offline Sync)

---

## 🎯 Objective

Implement the **City > Routes > Meters hierarchy** used in the legacy system, along with critical workflow fixes for exception-based photo review and reading editing.

**Manager's Current Workflow (Legacy):**
```
Cities (Grover Beach, etc.)
  └── Routes (North, South, Route A1, etc.)
      └── Meters (15-20 meters per route)
```

**Our Current POC (Incorrect):**
```
Zip Codes (90210, etc.)
  └── Meters (grouped by zip)
```

---

## 📋 Critical Gaps to Address

### GAP-01: No City/Route/Meters Hierarchy
**Problem:** We use zip codes as route identifiers. Manager needs actual cities with named routes.

**Legacy Example:**
- City: "Grover Beach"
  - Route: "North" (2068 meters)
  - Route: "South" (1500 meters)
- City: "Bellaire"
  - Route: "Route A1" (500 meters)

**Required Schema Changes:**
```sql
-- Cities table
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'read_pending', 'active', 'complete', 'ready_to_download'
  total_meters INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link managers to cities (many-to-many)
CREATE TABLE manager_cities (
  manager_id UUID REFERENCES auth.users(id),
  city_id UUID REFERENCES cities(id),
  PRIMARY KEY (manager_id, city_id)
);

-- Routes table (separate from meters)
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(id),
  name TEXT NOT NULL, -- "North", "South", "Route A1"
  status TEXT DEFAULT 'unassigned',
  total_meters INTEGER DEFAULT 0,
  meters_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update meters table
ALTER TABLE meters ADD COLUMN route_id UUID REFERENCES routes(id);
ALTER TABLE meters ADD COLUMN city_id UUID REFERENCES cities(id);
-- Keep zip_code for address display, but not for grouping
```

---

### GAP-02: No Exception-Based Photo Queue
**Problem:** Photo queue shows ALL pending readings. Manager only reviews **exceptions** (unusually high/low readings ~3.4% of meters).

**Exception Detection Rules:**
```typescript
const isException = (currentReading: number, previousReading: number): boolean => {
  const delta = Math.abs(currentReading - previousReading);
  const deltaPercent = (delta / previousReading) * 100;
  
  return (
    deltaPercent > 40 ||           // >40% change from previous
    currentReading === 0 ||         // Zero reading (possible skip)
    currentReading < previousReading // Negative delta (meter reset?)
  );
};
```

**Required Changes:**
1. Add `is_exception` boolean column to `readings` table (computed on insert)
2. Add exception count badge to dashboard header: "71 to Review"
3. Filter Photo Review queue to show **exceptions only** by default
4. Add toggle: "Exceptions Only" | "All Readings"

---

### GAP-03: Cannot Edit Reading Value During Review
**Problem:** Manager must be able to correct reading value if it doesn't match photo (e.g., reader typo: "760" vs photo shows "670").

**Required UI:**
```
┌─────────────────────────────────┐
│  Meter #12345 - 123 Main St    │
│                                 │
│  [Photo Display]                │
│                                 │
│  Reading Value: [ 760 ] ✏️     │
│  (Click edit to change)         │
│                                 │
│  [Approve]  [Reject]           │
└─────────────────────────────────┘
```

**Database:**
- Add `edited_by`, `edited_at`, `original_value` columns to `readings` table
- Audit trail for all edits

---

### GAP-04: No Usage History in Review Modal
**Problem:** Manager cannot see historical consumption while reviewing.

**Required:**
- Show last 6 readings in PhotoDetailModal
- Display as table or mini-chart
- Show: date, value, delta from previous

---

### GAP-05: No Separate "Reread" Queue
**Problem:** Rejected readings need dedicated queue for tracking.

**Required:**
- Add "Rereads" tab or filter on dashboard
- Show count: "4 to Reread"
- Filter: `status = 'rejected' AND needs_reread = true`

---

## 📁 Files to Create/Modify

### Schema Migration
- ✏️ **Create:** `migrations/005_city_route_hierarchy.sql`
  - Cities table
  - Routes table (separate from meters)
  - Manager-city relationships
  - Update meters with route_id, city_id
  - Add `is_exception` to readings
  - Add `edited_by`, `edited_at`, `original_value` to readings
  - Add `needs_reread` to readings

### Frontend - City/Route Selection
- ✏️ **Create:** `frontend/src/app/components/CitySelector.tsx`
- ✏️ **Modify:** `frontend/src/app/page.tsx`
  - Add city selector to header
  - Change route grouping from zip_code to routes table
  - Update all queries to filter by city_id

### Frontend - Photo Review (Exception-Based)
- ✏️ **Modify:** `frontend/src/app/components/PhotoReview.tsx`
  - Filter to show exceptions by default
  - Add "Exceptions Only" toggle
  - Add exception count badge

### Frontend - Reading Edit
- ✏️ **Modify:** `frontend/src/app/components/ApproveRejectButtons.tsx`
  - Add reading value input field
  - Allow edit before approve
  - Track original_value

### Frontend - Usage History in Review
- ✏️ **Modify:** `frontend/src/app/components/PhotoReview.tsx` (PhotoDetailModal)
  - Query last 6 readings for meter
  - Display in modal sidebar

### Frontend - Reread Queue
- ✏️ **Modify:** `frontend/src/app/page.tsx`
  - Add "Rereads" tab or filter
  - Show rejected readings count

---

## ✅ Acceptance Criteria (Must All Pass)

### City/Route Hierarchy (GAP-01)

```gherkin
Given I am a manager with access to 2 cities
When I view the dashboard
Then I see a city selector dropdown in the header

Given I select "Grover Beach" from the dropdown
When the page loads
Then I see only routes for Grover Beach

Given I select a route
When I view the route detail
Then I see all meters in that route (not grouped by zip)

Given I check the database
When I query the routes table
Then I see routes with city_id relationships
```

### Exception-Based Photo Queue (GAP-02)

```gherkin
Given there are 1000 pending readings
And 71 of them are exceptions (>40% delta, zero, or negative)
When I navigate to the Photos tab
Then I see only the 71 exception readings by default

Given I am viewing the exception queue
When I toggle "Show All Readings"
Then I see all 1000 pending readings

Given there are 71 exception readings
When I view the dashboard header
Then I see a badge: "71 to Review"
```

### Reading Edit (GAP-03)

```gherkin
Given I am reviewing a pending reading with value "760"
When I click the edit icon
Then the value becomes editable in an input field

Given I change the value to "670"
When I click "Approve"
Then the reading is updated with value="670"
And original_value="760" is saved
And edited_by=my_user_id is saved

Given I edited a reading
When I check the database
Then I see the audit trail (original_value, edited_by, edited_at)
```

### Usage History in Review (GAP-04)

```gherkin
Given I am reviewing a meter reading
When I open the photo detail modal
Then I see the last 6 readings for this meter

Given the meter has historical readings
When I view the history
Then I see date, value, and delta from previous
```

### Reread Queue (GAP-05)

```gherkin
Given there are 4 rejected readings pending reread
When I view the dashboard
Then I see a "Rereads" tab or filter with count "4"

Given I click the "Rereads" tab
When the page loads
Then I see only readings with status='rejected' and needs_reread=true
```

---

## 🔧 Technical Implementation Guide

### Step 1: Database Migration (Priority 1)

```sql
-- File: migrations/005_city_route_hierarchy.sql

-- 1. Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'read_pending',
  total_meters INTEGER DEFAULT 0,
  meters_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create manager_cities relationship
CREATE TABLE IF NOT EXISTS manager_cities (
  manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  PRIMARY KEY (manager_id, city_id)
);

-- 3. Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'unassigned',
  total_meters INTEGER DEFAULT 0,
  meters_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_id, name)
);

-- 4. Add columns to meters table
ALTER TABLE meters 
  ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES routes(id),
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);

-- 5. Add columns to readings table
ALTER TABLE readings
  ADD COLUMN IF NOT EXISTS is_exception BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_value NUMERIC,
  ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS needs_reread BOOLEAN DEFAULT FALSE;

-- 6. Create index for exception queries
CREATE INDEX IF NOT EXISTS idx_readings_exception 
  ON readings(is_exception, status) 
  WHERE status = 'pending';

-- 7. Migrate existing data (example - adjust based on actual data)
-- Create default city
INSERT INTO cities (id, name, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default City', 'active');

-- Create routes from zip codes
INSERT INTO routes (city_id, name, status)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'Route ' || zip_code,
  'unassigned'
FROM (SELECT DISTINCT zip_code FROM meters WHERE zip_code IS NOT NULL) AS unique_zips;

-- Link meters to routes
UPDATE meters m
SET route_id = r.id,
    city_id = '00000000-0000-0000-0000-000000000001'
FROM routes r
WHERE r.name = 'Route ' || m.zip_code;

-- 8. Create function to detect exceptions
CREATE OR REPLACE FUNCTION check_reading_exception()
RETURNS TRIGGER AS $$
DECLARE
  previous_reading NUMERIC;
  delta_percent NUMERIC;
BEGIN
  -- Get previous reading for same meter
  SELECT value INTO previous_reading
  FROM readings
  WHERE meter_id = NEW.meter_id
    AND reading_timestamp < NEW.reading_timestamp
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
    NEW.is_exception := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for auto-detecting exceptions
DROP TRIGGER IF EXISTS trg_check_exception ON readings;
CREATE TRIGGER trg_check_exception
  BEFORE INSERT OR UPDATE ON readings
  FOR EACH ROW
  EXECUTE FUNCTION check_reading_exception();
```

---

### Step 2: Update Supabase Client Types

```typescript
// frontend/src/lib/supabase.ts

// Add new types
export interface City {
  id: string;
  name: string;
  status: 'read_pending' | 'active' | 'complete' | 'ready_to_download';
  total_meters: number;
  meters_read: number;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  city_id: string;
  name: string;
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed';
  total_meters: number;
  meters_read: number;
  created_at: string;
  updated_at: string;
}

export interface Reading {
  // ... existing fields
  is_exception: boolean;
  original_value: number | null;
  edited_by: string | null;
  edited_at: string | null;
  needs_reread: boolean;
}

// Update Database type
export interface Database {
  public: {
    Tables: {
      cities: {
        Row: City;
        Insert: Omit<City, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<City, 'id' | 'created_at' | 'updated_at'>>;
      };
      routes: {
        Row: Route;
        Insert: Omit<Route, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Route, 'id' | 'created_at' | 'updated_at'>>;
      };
      // ... existing tables
    };
  };
}
```

---

### Step 3: City Selector Component

```typescript
// frontend/src/app/components/CitySelector.tsx

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin } from 'lucide-react'

interface City {
  id: string;
  name: string;
  status: string;
}

interface CitySelectorProps {
  onCityChange?: (cityId: string) => void;
}

export function CitySelector({ onCityChange }: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCities()
  }, [])

  async function loadCities() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('manager_cities')
      .select(`
        cities (*)
      `)
      .eq('manager_id', user.id)

    if (data) {
      const cityList = data.map(mc => mc.cities)
      setCities(cityList)
      if (cityList.length > 0) {
        setSelectedCity(cityList[0].id)
        onCityChange?.(cityList[0].id)
      }
    }
    setLoading(false)
  }

  function handleCityChange(cityId: string) {
    setSelectedCity(cityId)
    onCityChange?.(cityId)
  }

  if (loading || cities.length === 0) {
    return null; // Or show loading state
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin size={18} className="text-blue-100" />
      <select
        value={selectedCity}
        onChange={(e) => handleCityChange(e.target.value)}
        className="bg-blue-700 text-white border border-blue-600 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-white"
      >
        {cities.map(city => (
          <option key={city.id} value={city.id}>
            {city.name} ({city.status.replace('_', ' ')})
          </option>
        ))}
      </select>
    </div>
  )
}
```

---

### Step 4: Update Dashboard with City Selector

```typescript
// frontend/src/app/page.tsx - Update header section

import { CitySelector } from './components/CitySelector'

// Add state
const [selectedCityId, setSelectedCityId] = useState<string>('')

// Update header
<header className="bg-blue-600 text-white p-4 shadow-md">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <CitySelector onCityChange={setSelectedCityId} />
      <div>
        <h1 className="text-xl font-semibold">Meter Reading Manager</h1>
        {user && <p className="text-sm text-blue-100">{user.email}</p>}
      </div>
    </div>
    {/* ... rest of header */}
  </div>
</header>

// Update route loading to filter by city
async function loadRoutes() {
  if (!selectedCityId) return;
  
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      meters (count)
    `)
    .eq('city_id', selectedCityId)
    // ... rest of query
}
```

---

### Step 5: Exception Detection in PhotoReview

```typescript
// frontend/src/app/components/PhotoReview.tsx

// Add state
const [showExceptionsOnly, setShowExceptionsOnly] = useState(true)
const [exceptionCount, setExceptionCount] = useState(0)

// Update query to filter exceptions
async function loadPhotos() {
  let query = supabase
    .from('readings')
    .select(`
      *,
      meters (meter_number, address, city, zip_code, route_id),
      readers (full_name, email, phone)
    `)
    .eq('status', 'pending')

  // Filter exceptions by default
  if (showExceptionsOnly) {
    query = query.eq('is_exception', true)
  }

  // ... rest of query
}

// Load exception count for badge
async function loadExceptionCount() {
  const { count } = await supabase
    .from('readings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('is_exception', true)
  
  setExceptionCount(count || 0)
}

// Add toggle to UI
<div className="flex items-center gap-2">
  <label className="text-sm text-gray-600">
    <input
      type="checkbox"
      checked={showExceptionsOnly}
      onChange={(e) => setShowExceptionsOnly(e.target.value)}
      className="mr-2"
    />
    Exceptions Only
  </label>
  <span className="text-sm text-gray-600">
    {exceptionCount} to Review
  </span>
</div>
```

---

### Step 6: Reading Edit in ApproveRejectButtons

```typescript
// frontend/src/app/components/ApproveRejectButtons.tsx

// Add state
const [isEditing, setIsEditing] = useState(false)
const [editedValue, setEditedValue] = useState(reading.value.toString())

// Add input field to UI
<div className="mb-3">
  <label className="text-sm text-gray-600">Reading Value</label>
  {isEditing ? (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="number"
        value={editedValue}
        onChange={(e) => setEditedValue(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
      />
      <button
        onClick={() => setIsEditing(false)}
        className="p-2 text-green-600 hover:bg-green-50 rounded"
      >
        <Check size={18} />
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-lg font-semibold">{reading.value}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 text-gray-400 hover:text-gray-600"
      >
        <Edit size={16} />
      </button>
    </div>
  )}
</div>

// Update approve handler
async function handleApprove() {
  const { error } = await supabase
    .from('readings')
    .update({
      status: 'approved',
      value: isEditing ? parseFloat(editedValue) : reading.value,
      original_value: isEditing ? reading.value : null,
      edited_by: isEditing ? user.id : null,
      edited_at: isEditing ? new Date().toISOString() : null,
      approved_at: new Date().toISOString()
    })
    .eq('id', readingId)
  
  // ... handle success
}
```

---

### Step 7: Usage History in PhotoDetailModal

```typescript
// frontend/src/app/components/PhotoReview.tsx (PhotoDetailModal)

// Add state
const [usageHistory, setUsageHistory] = useState<any[]>([])

// Load history when modal opens
useEffect(() => {
  if (reading?.meter_id) {
    loadUsageHistory(reading.meter_id)
  }
}, [reading])

async function loadUsageHistory(meterId: string) {
  const { data, error } = await supabase
    .from('readings')
    .select('value, reading_timestamp, status')
    .eq('meter_id', meterId)
    .order('reading_timestamp', { ascending: false })
    .limit(6)
  
  if (data) {
    setUsageHistory(data)
  }
}

// Add to modal UI
<div className="mt-4">
  <h4 className="text-sm font-medium text-gray-900 mb-2">
    Usage History (Last 6 Readings)
  </h4>
  <div className="bg-gray-50 rounded-lg p-3">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-2 text-gray-600">Date</th>
          <th className="text-right text-gray-600">Value</th>
          <th className="text-right text-gray-600">Delta</th>
        </tr>
      </thead>
      <tbody>
        {usageHistory.map((reading, idx) => {
          const delta = idx < usageHistory.length - 1 
            ? reading.value - usageHistory[idx + 1].value 
            : 0;
          return (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-2 text-gray-900">
                {new Date(reading.reading_timestamp).toLocaleDateString()}
              </td>
              <td className="text-right font-medium">
                {reading.value.toLocaleString()}
              </td>
              <td className={`text-right ${
                delta > 0 ? 'text-red-600' : 
                delta < 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {delta > 0 ? '+' : ''}{delta.toLocaleString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
```

---

### Step 8: Reread Queue

```typescript
// frontend/src/app/page.tsx - Add reread tab

// Add state
const [activeTab, setActiveTab] = useState<Tab>('routes')
type Tab = 'routes' | 'photos' | 'rereads'

// Add reread count
const [rereadCount, setRereadCount] = useState(0)

// Load reread count
async function loadRereadCount() {
  const { count } = await supabase
    .from('readings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected')
    .eq('needs_reread', true)
  
  setRereadCount(count || 0)
}

// Add tab to navigation
<nav className="bg-white border-b border-gray-200">
  <div className="flex">
    <button onClick={() => setActiveTab('routes')} className="...">
      Routes
    </button>
    <button onClick={() => setActiveTab('photos')} className="...">
      Photos
      {exceptionCount > 0 && (
        <span className="ml-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
          {exceptionCount}
        </span>
      )}
    </button>
    <button onClick={() => setActiveTab('rereads')} className="...">
      Rereads
      {rereadCount > 0 && (
        <span className="ml-1 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">
          {rereadCount}
        </span>
      )}
    </button>
  </div>
</nav>

// Add reread tab content
{activeTab === 'rereads' && (
  <PhotoReview 
    filterStatus="rejected"
    filterNeedsReread={true}
  />
)}
```

---

## 📊 Definition of Done

- [ ] All 5 gaps (GAP-01 through GAP-05) are addressed
- [ ] Database migration runs without errors
- [ ] All acceptance criteria pass
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] RLS policies updated for new tables
- [ ] Existing data migrated correctly
- [ ] Exception detection working (test with mock data)
- [ ] Reading edit audit trail visible in database

---

## 🚧 Blockers & Dependencies

**Blockers:**
- None - this is self-contained

**Dependencies:**
- None - this is foundational work for Sprint 3

**RLS Considerations:**
- Need policies for:
  - `cities` - managers see only their assigned cities
  - `routes` - managers see routes in their cities
  - `manager_cities` - users see only their own relationships

---

## 📝 Report Back With

1. ✅ List of files created/modified
2. 🚧 Any blockers encountered (schema migration, RLS, etc.)
3. ❓ Questions for clarification
4. 📸 Screenshots of:
   - City selector in header
   - Exception-based photo queue
   - Reading edit UI
   - Usage history in modal
   - Reread tab

---

## 🧪 Testing Checklist

- [ ] Create new city in database
- [ ] Assign city to manager via `manager_cities`
- [ ] Create routes for the city
- [ ] Assign meters to routes
- [ ] Create readings with various deltas
- [ ] Verify `is_exception` auto-detects correctly
- [ ] Test city selector changes displayed routes
- [ ] Test exception filter in photo queue
- [ ] Test reading edit saves audit trail
- [ ] Test usage history shows correct data
- [ ] Test reread tab shows rejected readings

---

**Start immediately.** This is the highest priority work before Sprint 3 can begin.

— Sprint Manager 🚀
