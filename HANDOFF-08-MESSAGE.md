# 📋 Message to Lead Developer

---

## 🚨 Priority Update: HANDOFF-08 Added to Queue

**Status:** 🔴 **START THIS NEXT**  
**Priority:** Critical (blocks realistic workflow testing)

---

## 🎯 Why This Handoff Exists

During mobile testing, we discovered a **critical gap**:

### Current Problem
- ✅ Dashboard shows 20 route cards
- ✅ Route cards show progress bars
- ❌ **Can't tap route to see which meters are pending**

### Real-World Scenario
```
Manager Maria opens her phone:
"Route 90210 is 53% complete... but which meters still need review?"

Currently: She can't tell.
After HANDOFF-08: She taps Route 90210 → sees all 15 meters with status.
```

---

## 📦 HANDOFF-08: Route Detail View

**Story:** US-8.2 - View Route Details & Meter List  
**Estimated Effort:** 4-5 hours  
**Status:** 📋 Ready to Start

### Objective
Enable managers to tap a route and see all meters in that route with their reading status.

### Key Features
1. **Route Header** - Shows assigned reader, progress (8/15 meters), contact info
2. **Meter List** - All 15 meters in the route with status badges
3. **Status Indicators:**
   - ✅ Green = Reading approved
   - ⏳ Yellow = Pending review
   - ⚪ Gray = Not read yet
4. **Meter Details** - Address, last reading date, reading value
5. **Click Meter** → View reading history (modal or separate page)
6. **Filter** - All / Read / Pending / Not Read
7. **Back Button** → Returns to dashboard

---

## 🏗️ Technical Spec

### Route Structure
```
Dashboard (/) → Route Detail (/routes/90210)
```

**Option A:** Next.js dynamic route (recommended)
- File: `frontend/src/app/routes/[zipCode]/page.tsx`
- URL: `/routes/90210`, `/routes/90211`, etc.

**Option B:** Modal overlay
- Component: `RouteDetailModal.tsx`
- Triggered from dashboard route card

**Recommendation:** Option A (better URL sharing, browser back button works)

### Data Query

```typescript
// Get meters for route with latest reading
const { data: meters } = await supabase
  .from('meters')
  .select(`
    *,
    latest_reading:readings (
      value,
      reading_timestamp,
      status,
      reader_id
    )
  `)
  .eq('zip_code', zipCode)
  .eq('user_id', managerId)
  .order('address');
```

### UI Layout

```
┌─────────────────────────────────────┐
│ ← Back    Route 90210 - Route A1   │
├─────────────────────────────────────┤
│ Assigned: John Smith                │
│ 📞 +1-555-123-4567                  │
│ Progress: 8/15 meters (53%)         │
│ [████████████░░░░░░░░░]            │
├─────────────────────────────────────┤
│ Filter: [All ▼]  Read  Pending      │
├─────────────────────────────────────┤
│ 📍 123 Main St                      │
│    ✅ Read - 4,521 gal (Apr 5)      │
├─────────────────────────────────────┤
│ 📍 456 Oak St                       │
│    ⏳ Pending Review - 4,489 gal    │
├─────────────────────────────────────┤
│ 📍 789 Elm St                       │
│    ⚪ Not Read                      │
└─────────────────────────────────────┘
```

---

## 📁 Files to Create

```
frontend/src/app/
├── routes/
│   └── [zipCode]/
│       ├── page.tsx          # Main route detail page
│       └── loading.tsx       # Loading state
└── components/
    ├── RouteHeader.tsx       # Route info + progress
    ├── MeterList.tsx         # List container
    ├── MeterCard.tsx         # Individual meter display
    └── MeterDetailModal.tsx  # Optional: reading history
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Tap route card on dashboard → detail page opens
- [ ] See all 15 meters for the route
- [ ] Meter status badges accurate (Read/Pending/Not Read)
- [ ] Click meter → shows reading history
- [ ] Filter by status works
- [ ] Back button returns to dashboard
- [ ] Progress bar matches meter count
- [ ] Assigned reader info displays
- [ ] Mobile responsive (cards stack on small screens)

### TypeScript + Build
```bash
npx tsc --noEmit  # ✅ No errors
npm run build     # ✅ Successful
```

---

## ⚠️ Important Notes

### 1. Route Identification
- Routes are identified by `zip_code` (text)
- Dashboard route cards use `route.zip_code` as identifier
- Pass zip_code in URL: `/routes/90210`

### 2. Reading Status Logic
```typescript
// Determine meter status
const getStatus = (meter) => {
  if (!meter.latest_reading) return 'not-read';
  if (meter.latest_reading.status === 'pending') return 'pending';
  if (meter.latest_reading.status === 'approved') return 'read';
  if (meter.latest_reading.status === 'rejected') return 'pending';
  return 'not-read';
};
```

### 3. Latest Reading Per Meter
Each meter has ~12 readings in history. You need the **most recent**:
```typescript
// Option 1: Query with order + limit
readings (
  value,
  reading_timestamp,
  status
)
.order('reading_timestamp', { ascending: false })
.limit(1)

// Option 2: Fetch all, pick latest in client
const latestReading = readings[0]; // Already ordered
```

---

## 🎯 Priority Context

### Why This Is HANDOFF-08 (Not 06)

We're inserting this **before** Approve/Reject (HANDOFF-06) because:

1. **Workflow Logic:**
   - Assign routes (HANDOFF-04) ✅
   - **See route details** (HANDOFF-08) ← **You are here**
   - Review pending readings (HANDOFF-05) ✅
   - **Approve/Reject from route detail** (HANDOFF-06)

2. **Testing Reality:**
   - You can't test approve/reject without knowing which meters need it
   - Route detail makes the workflow complete

3. **Mobile UX:**
   - Managers in the field need to see route progress at meter level
   - This is a core feature, not a "nice to have"

---

## 🚀 Ready to Start

**You're cleared to begin HANDOFF-08.**

**When you report back, include:**
1. Files created/modified
2. How you handled routing (dynamic route vs. modal)
3. How you fetched latest reading per meter
4. Any RLS issues with meters/readings JOIN
5. Screenshot of route detail view

---

## 📊 Updated Sprint 2 Queue

| Handoff | Story | Status | Priority |
|---------|-------|--------|----------|
| **08** | US-8.2 | 📋 Ready | 🔴 **START HERE** |
| 06 | US-11.2/3 | 📋 Ready | 🔴 Critical |
| 07 | US-19.1 | 📋 Ready | 🟠 High |

**After HANDOFF-08:** Continue with HANDOFF-06 (Approve/Reject)

---

## 💬 Questions?

1. **Routing:** Prefer dynamic route (`/routes/[zipCode]`) or modal?
2. **Meter detail:** New page, modal, or expandable card?
3. **Performance:** 15 meters per route is manageable, but consider virtual scrolling if we scale to 200 meters/route

---

**This completes the core manager workflow. Great catch on identifying this gap!**

**Standing by for questions during implementation.**

**Sprint Manager Out** 🎯
