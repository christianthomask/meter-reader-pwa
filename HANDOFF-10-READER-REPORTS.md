# HANDOFF-10: Reader Performance Reports

**Story:** GAP-06 - Reader Productivity Monitoring  
**Priority:** 🟠 **HIGH** - Manager explicitly states: "I only really use these two [reports]"  
**Estimated Effort:** 6-8 hours  
**Status:** 📋 Ready  
**Dependency:** Requires HANDOFF-09 completion (city/route hierarchy)

---

## 🎯 Objective

Implement two critical reader performance reports that the manager uses daily for team productivity monitoring:

1. **Reader Totals Report** - Shows each reader's productivity: readings count, route assignment, completion %
2. **Reader Tardiness Report** - Identifies readers with gaps >10 minutes between reading submissions

**Legacy System Reference:**
- Manager states: "I only really use these two, circled in green and red respectively"
- Green: Reader totals (list of readers, how much they've read, on which route)
- Red: Reader tardiness (times they stopped reading for more than 10 minutes)

---

## 📋 Requirements

### Report 1: Reader Totals

**What it shows:**
- Reader name
- Assigned route(s)
- Total readings submitted
- Readings approved vs. pending vs. rejected
- Completion percentage
- Last activity timestamp

**Legacy UI Example:**
```
Reader Totals
┌──────────────┬──────────────┬─────────┬────────────┬───────────┐
│ Reader Name  │ Route        │ Readings│ Completion │ Last Active│
├──────────────┼──────────────┼─────────┼────────────┼───────────┤
│ John Doe     │ North        │ 145     │ 67%        │ 2:15 PM   │
│ Jane Smith   │ South        │ 203     │ 89%        │ 1:45 PM   │
│ Bob Johnson  │ Route A1     │ 87      │ 45%        │ 3:30 PM   │
└──────────────┴──────────────┴─────────────────────┴───────────┘
```

### Report 2: Reader Tardiness

**What it shows:**
- Reader name
- Route where tardiness occurred
- Stop start time
- Stop end time
- Duration (minutes)
- Location (meter address or GPS)

**Detection Logic:**
```typescript
// Gap between consecutive reading submissions > 10 minutes
const tardinessThreshold = 10 * 60 * 1000; // 10 minutes in ms

const gaps = readings.reduce((acc, current, idx, arr) => {
  if (idx === 0) return acc;
  
  const previous = arr[idx - 1];
  const gapMs = new Date(current.reading_timestamp).getTime() - 
                new Date(previous.reading_timestamp).getTime();
  
  if (gapMs > tardinessThreshold) {
    acc.push({
      reader_id: current.reader_id,
      route: current.route_name,
      stop_start: previous.reading_timestamp,
      stop_end: current.reading_timestamp,
      duration_minutes: Math.round(gapMs / 60000),
      location: previous.meter_address
    });
  }
  
  return acc;
}, []);
```

**Legacy UI Example:**
```
Reader Tardiness (Stops > 10 minutes)
┌──────────────┬──────────────┬────────────┬──────────┬──────────┬─────────────────┐
│ Reader Name  │ Route        │ Stop Start │ Stop End │ Duration │ Location        │
├──────────────┼──────────────┼────────────┼──────────┼──────────┼─────────────────┤
│ John Doe     │ North        │ 10:15 AM   │ 10:45 AM │ 30 min   │ 123 Main St    │
│ Jane Smith   │ South        │ 1:30 PM    │ 1:50 PM  │ 20 min   │ 456 Oak Ave    │
│ Bob Johnson  │ Route A1     │ 9:00 AM    │ 9:25 AM  │ 25 min   │ 789 Pine Rd    │
└──────────────┴──────────────┴──────────────────────┴───────────────────────────┘
```

---

## 📁 Files to Create/Modify

### Backend - Database Functions

- ✏️ **Create:** `migrations/006_reader_performance_views.sql`
  - Create `reader_totals_view` for performance metrics
  - Create `reader_tardiness_view` for gap detection
  - Add indexes for performance

### Frontend - Reader Totals Report

- ✏️ **Create:** `frontend/src/app/reports/readers/page.tsx`
- ✏️ **Create:** `frontend/src/app/reports/readers/ReaderTotalsTable.tsx`
- ✏️ **Create:** `frontend/src/app/reports/readers/ReaderTotalsCard.tsx` (mobile view)

### Frontend - Reader Tardiness Report

- ✏️ **Create:** `frontend/src/app/reports/tardiness/page.tsx`
- ✏️ **Create:** `frontend/src/app/reports/tardiness/TardinessTable.tsx`
- ✏️ **Create:** `frontend/src/app/reports/tardiness/TardinessCard.tsx` (mobile view)

### Frontend - Navigation

- ✏️ **Modify:** `frontend/src/app/page.tsx`
  - Add "Reports" link to header or navigation
- ✏️ **Create:** `frontend/src/app/components/ReportsMenu.tsx`

---

## ✅ Acceptance Criteria

### Reader Totals Report

```gherkin
Given I am a manager with 5 readers
When I navigate to Reports → Reader Totals
Then I see a table with all 5 readers and their metrics

Given a reader has submitted 100 readings
And 80 are approved, 15 pending, 5 rejected
When I view the reader totals
Then I see:
  - Total: 100
  - Approved: 80
  - Pending: 15
  - Rejected: 5
  - Completion: 80%

Given a reader has no activity today
When I view the report
Then I see "Last active: Yesterday" or "Never"

Given I click on a reader name
When the reader detail opens
Then I see their route assignment history

Given I want to export the data
When I click "Export CSV"
Then I download a CSV with all reader totals
```

### Reader Tardiness Report

```gherkin
Given a reader submitted readings at 10:00 AM, 10:05 AM, 10:35 AM, 10:40 AM
When I view the tardiness report
Then I see one entry:
  - Stop Start: 10:05 AM
  - Stop End: 10:35 AM
  - Duration: 30 minutes

Given there are no tardiness incidents today
When I view the report
Then I see "No tardiness incidents found"

Given I want to see only incidents > 20 minutes
When I set the filter to "20 minutes"
Then I see only incidents exceeding 20 minutes

Given I want to see tardiness for a specific date
When I select a date range
Then I see only incidents within that range

Given there are tardiness incidents
When I view the report
Then I see the location (meter address) for each incident
```

---

## 🔧 Technical Implementation Guide

### Step 1: Database Views (SQL Migration)

```sql
-- File: migrations/006_reader_performance_views.sql

-- 1. Reader Totals View
CREATE OR REPLACE VIEW reader_totals_view AS
SELECT
  r.id AS reader_id,
  r.full_name AS reader_name,
  r.email,
  r.phone,
  r.active,
  ra.route_id,
  rt.name AS route_name,
  c.name AS city_name,
  COUNT(rd.id) AS total_readings,
  COUNT(*) FILTER (WHERE rd.status = 'approved') AS approved_readings,
  COUNT(*) FILTER (WHERE rd.status = 'pending') AS pending_readings,
  COUNT(*) FILTER (WHERE rd.status = 'rejected') AS rejected_readings,
  COUNT(*) FILTER (WHERE rd.status = 'certified') AS certified_readings,
  ROUND(
    COUNT(*) FILTER (WHERE rd.status = 'approved') * 100.0 / 
    NULLIF(COUNT(rd.id), 0), 
    1
  ) AS completion_percentage,
  MAX(rd.reading_timestamp) AS last_activity,
  ra.status AS assignment_status,
  ra.meters_total,
  ra.meters_read,
  ra.meters_pending
FROM readers r
LEFT JOIN route_assignments ra ON r.id = ra.reader_id
LEFT JOIN routes rt ON ra.route_id = rt.id
LEFT JOIN cities c ON rt.city_id = c.id
LEFT JOIN readings rd ON r.id = rd.reader_id
GROUP BY 
  r.id, r.full_name, r.email, r.phone, r.active,
  ra.route_id, rt.name, c.name, ra.status, 
  ra.meters_total, ra.meters_read, ra.meters_pending;

-- 2. Reader Tardiness View (gaps > 10 minutes)
CREATE OR REPLACE VIEW reader_tardiness_view AS
WITH reading_gaps AS (
  SELECT
    rd.reader_id,
    rd.meter_id,
    rd.reading_timestamp,
    LAG(rd.reading_timestamp) OVER (
      PARTITION BY rd.reader_id 
      ORDER BY rd.reading_timestamp
    ) AS previous_timestamp,
    LAG(m.address) OVER (
      PARTITION BY rd.reader_id 
      ORDER BY rd.reading_timestamp
    ) AS previous_address,
    ra.route_id,
    rt.name AS route_name
  FROM readings rd
  LEFT JOIN meters m ON rd.meter_id = m.id
  LEFT JOIN route_assignments ra ON rd.reader_id = ra.reader_id AND ra.status IN ('assigned', 'in-progress')
  LEFT JOIN routes rt ON ra.route_id = rt.id
)
SELECT
  rg.reader_id,
  r.full_name AS reader_name,
  rg.route_id,
  rg.route_name,
  rg.previous_address AS location_start,
  m.address AS location_end,
  rg.previous_timestamp AS stop_start,
  rg.reading_timestamp AS stop_end,
  EXTRACT(EPOCH FROM (rg.reading_timestamp - rg.previous_timestamp)) / 60 AS duration_minutes,
  c.name AS city_name
FROM reading_gaps rg
JOIN readers r ON rg.reader_id = r.id
LEFT JOIN meters m ON rg.meter_id = m.id
LEFT JOIN route_assignments ra ON rg.reader_id = ra.reader_id
LEFT JOIN routes rt ON ra.route_id = rt.id
LEFT JOIN cities c ON rt.city_id = c.id
WHERE rg.previous_timestamp IS NOT NULL
  AND EXTRACT(EPOCH FROM (rg.reading_timestamp - rg.previous_timestamp)) / 60 > 10
ORDER BY rg.reading_timestamp DESC;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_readings_reader_timestamp 
  ON readings(reader_id, reading_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_readings_status_reader 
  ON readings(status, reader_id);

-- 4. Grant permissions
GRANT SELECT ON reader_totals_view TO authenticated;
GRANT SELECT ON reader_tardiness_view TO authenticated;

-- 5. RLS Policies (if needed)
-- Note: Views inherit RLS from underlying tables, but we may need additional policies
ALTER VIEW reader_totals_view OWNER TO postgres;
ALTER VIEW reader_tardiness_view OWNER TO postgres;
```

---

### Step 2: Reader Totals Report Page

```typescript
// frontend/src/app/reports/readers/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User, Download, Filter, Calendar } from 'lucide-react'
import { ReaderTotalsTable } from './ReaderTotalsTable'
import { ReaderTotalsCard } from './ReaderTotalsCard'

interface ReaderTotal {
  reader_id: string;
  reader_name: string;
  email: string;
  phone: string | null;
  active: boolean;
  route_id: string | null;
  route_name: string | null;
  city_name: string | null;
  total_readings: number;
  approved_readings: number;
  pending_readings: number;
  rejected_readings: number;
  certified_readings: number;
  completion_percentage: number | null;
  last_activity: string | null;
  assignment_status: string | null;
  meters_total: number | null;
  meters_read: number | null;
  meters_pending: number | null;
}

export default function ReaderTotalsReport() {
  const router = useRouter()
  const [readerTotals, setReaderTotals] = useState<ReaderTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [filterActive, setFilterActive] = useState<boolean>(true)
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [showExportMenu, setShowExportMenu] = useState(false)

  useEffect(() => {
    loadReaderTotals()
  }, [filterActive, selectedCity])

  async function loadReaderTotals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('reader_totals_view')
      .select('*')
      .eq('active', filterActive)
      .order('completion_percentage', { ascending: false })

    if (error) {
      console.error('Error loading reader totals:', error)
    } else {
      setReaderTotals(data || [])
    }
    setLoading(false)
  }

  async function exportToCSV() {
    const headers = [
      'Reader Name',
      'Email',
      'Phone',
      'Route',
      'City',
      'Total Readings',
      'Approved',
      'Pending',
      'Rejected',
      'Completion %',
      'Last Activity'
    ]

    const rows = readerTotals.map(rt => [
      rt.reader_name,
      rt.email,
      rt.phone || '',
      rt.route_name || 'Unassigned',
      rt.city_name || '',
      rt.total_readings,
      rt.approved_readings,
      rt.pending_readings,
      rt.rejected_readings,
      rt.completion_percentage || 0,
      rt.last_activity ? new Date(rt.last_activity).toLocaleString() : 'Never'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reader-totals-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Reader Totals Report</h1>
              <p className="text-sm text-gray-600">Track reader productivity and completion</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filterActive}
              onChange={(e) => setFilterActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show Active Readers Only
          </label>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Cities</option>
              {/* Add city options */}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : readerTotals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No readers found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <ReaderTotalsTable readerTotals={readerTotals} />
            </div>
            
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {readerTotals.map(reader => (
                <ReaderTotalsCard key={reader.reader_id} reader={reader} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
```

---

### Step 3: Reader Totals Table Component

```typescript
// frontend/src/app/reports/readers/ReaderTotalsTable.tsx

import { User, CheckCircle, Clock, XCircle, Award } from 'lucide-react'

interface ReaderTotal {
  reader_id: string;
  reader_name: string;
  email: string;
  phone: string | null;
  active: boolean;
  route_name: string | null;
  city_name: string | null;
  total_readings: number;
  approved_readings: number;
  pending_readings: number;
  rejected_readings: number;
  completion_percentage: number | null;
  last_activity: string | null;
}

interface ReaderTotalsTableProps {
  readerTotals: ReaderTotal[];
}

export function ReaderTotalsTable({ readerTotals }: ReaderTotalsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Reader
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Route
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider">
              Approved
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-yellow-600 uppercase tracking-wider">
              Pending
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-red-600 uppercase tracking-wider">
              Rejected
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
              Completion
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Last Active
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {readerTotals.map((reader) => (
            <tr key={reader.reader_id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{reader.reader_name}</span>
                    {!reader.active && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{reader.email}</div>
                  {reader.phone && (
                    <div className="text-xs text-gray-500">{reader.phone}</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900">{reader.route_name || 'Unassigned'}</div>
                {reader.city_name && (
                  <div className="text-xs text-gray-500">{reader.city_name}</div>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-lg font-semibold text-gray-900">
                  {reader.total_readings}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="font-medium text-green-700">{reader.approved_readings}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock size={14} className="text-yellow-600" />
                  <span className="font-medium text-yellow-700">{reader.pending_readings}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <XCircle size={14} className="text-red-600" />
                  <span className="font-medium text-red-700">{reader.rejected_readings}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (reader.completion_percentage || 0) >= 80 ? 'bg-green-500' :
                        (reader.completion_percentage || 0) >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(reader.completion_percentage || 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {reader.completion_percentage || 0}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock size={14} />
                  {reader.last_activity 
                    ? new Date(reader.last_activity).toLocaleString()
                    : 'Never'
                  }
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

### Step 4: Reader Tardiness Report Page

```typescript
// frontend/src/app/reports/tardiness/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Download, Clock, AlertTriangle, Filter, Calendar } from 'lucide-react'
import { TardinessTable } from './TardinessTable'
import { TardinessCard } from './TardinessCard'

interface TardinessIncident {
  reader_id: string;
  reader_name: string;
  route_id: string | null;
  route_name: string | null;
  location_start: string | null;
  location_end: string | null;
  stop_start: string;
  stop_end: string;
  duration_minutes: number;
  city_name: string | null;
}

export default function ReaderTardinessReport() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<TardinessIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [minDuration, setMinDuration] = useState<number>(10)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedReader, setSelectedReader] = useState<string>('all')

  useEffect(() => {
    loadTardinessIncidents()
  }, [minDuration, startDate, endDate, selectedReader])

  async function loadTardinessIncidents() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('reader_tardiness_view')
      .select('*')
      .gte('duration_minutes', minDuration)
      .order('stop_end', { ascending: false })

    if (startDate) {
      query = query.gte('stop_end', new Date(startDate).toISOString())
    }
    if (endDate) {
      query = query.lte('stop_end', new Date(endDate).toISOString())
    }
    if (selectedReader !== 'all') {
      query = query.eq('reader_id', selectedReader)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading tardiness:', error)
    } else {
      setIncidents(data || [])
    }
    setLoading(false)
  }

  async function exportToCSV() {
    const headers = [
      'Reader Name',
      'Route',
      'City',
      'Stop Start',
      'Stop End',
      'Duration (min)',
      'Location Start',
      'Location End'
    ]

    const rows = incidents.map(inc => [
      inc.reader_name,
      inc.route_name || 'Unknown',
      inc.city_name || '',
      new Date(inc.stop_start).toLocaleString(),
      new Date(inc.stop_end).toLocaleString(),
      Math.round(inc.duration_minutes),
      inc.location_start || '',
      inc.location_end || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reader-tardiness-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Reader Tardiness Report</h1>
              <p className="text-sm text-gray-600">
                Track reading gaps exceeding {minDuration} minutes
              </p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500" />
            <label className="text-sm text-gray-700">Min Duration:</label>
            <select
              value={minDuration}
              onChange={(e) => setMinDuration(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              placeholder="Start date"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              placeholder="End date"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedReader}
              onChange={(e) => setSelectedReader(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Readers</option>
              {/* Add reader options */}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">No tardiness incidents found</p>
            <p className="text-sm mt-1 text-gray-600">
              All readers are maintaining good pace (gaps &lt; {minDuration} min)
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
              <AlertTriangle size={16} />
              <span>
                Found {incidents.length} incident{incidents.length !== 1 ? 's' : ''} with gaps &gt; {minDuration} minutes
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <TardinessTable incidents={incidents} />
            </div>
            
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {incidents.map(incident => (
                <TardinessCard key={`${incident.reader_id}-${incident.stop_start}`} incident={incident} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
```

---

## 📊 Definition of Done

- [ ] Both reports accessible from dashboard navigation
- [ ] Reader Totals shows all metrics accurately
- [ ] Reader Tardiness detects gaps > 10 minutes correctly
- [ ] CSV export works for both reports
- [ ] Date range filtering works
- [ ] Reader filter works
- [ ] Mobile responsive (card view for small screens)
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Database views created and queryable
- [ ] RLS policies allow manager access

---

## 🧪 Testing Checklist

- [ ] Create 3 test readers
- [ ] Submit 50+ readings with varying timestamps
- [ ] Create some gaps > 10 minutes between readings
- [ ] Verify Reader Totals shows correct counts
- [ ] Verify Reader Tardiness detects all gaps
- [ ] Test CSV export downloads correctly
- [ ] Test date range filtering
- [ ] Test on mobile device (card view)

---

**Ready to start after HANDOFF-09 completion.**

— Sprint Manager 🚀
