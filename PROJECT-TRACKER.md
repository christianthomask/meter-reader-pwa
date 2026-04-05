# Meter Reader PWA - Project Tracker

**Project:** Meter Reader Manager Portal  
**POC Version:** 0.3.0 (Managers-Only)  
**Live Demo:** https://meter-reader-pwa.vercel.app  
**Last Updated:** 2026-04-04  
**Status:** 🟡 In Progress

---

## 📋 Project Overview

### Vision
A Progressive Web App for **managers** to conduct meter reading operations with offline-first sync, GPS verification, and photo documentation.

### Scope Clarification (2026-04-04)
**This POC is managers-only.** There is no separate reader app or reader submission workflow. Managers perform readings directly and review their own photos.

### Reference System Features (from Website Reference Guide)
| Section | Original System | Managers-Only POC |
|---------|----------------|-------------------|
| Status Page | City cycle status, meter lookup | ✅ Keep - Manager dashboard |
| Meter Review | Approve/Reject, photo vs. read, GPS verification | ✅ Core - Self-review workflow |
| Load Manager | Assign routes to readers | ⚠️ Modified - Self-assign only |
| City Data | Upload cycle files | ❌ Phase 2 |
| Reports | General + reader reports | ⚠️ Partial - General only |
| Certified Reports | Exceptions, certificates | ❌ Phase 2 |
| History | Cycle/meter reports | ✅ Keep - Reading history |

---

## 🎯 Deliverables Summary

| ID | Deliverable | Sprint | Status | Owner |
|----|-------------|--------|--------|-------|
| D1 | Authentication System | Sprint 1 | ✅ Complete | Dev |
| D2 | Dashboard - Routes Tab | Sprint 1 | ✅ Complete | Dev |
| D3 | Meter Review (Photos Tab) | Sprint 1 | ⚠️ Partial | Dev |
| D4 | Meter Reading Form | Sprint 1 | ⚠️ Partial | Dev |
| D5 | Database Schema + Mock Data | Sprint 1 | ✅ Complete | Dev |
| D6 | Reading Submission (DB) | Sprint 2 | ❌ Not Started | Dev |
| D7 | Photo Upload Integration | Sprint 2 | ❌ Not Started | Dev |
| D8 | Route Self-Assignment | Sprint 2 | ❌ Not Started | Dev |
| D9 | Reading History Display | Sprint 2 | ❌ Not Started | Dev |
| D10 | Offline Sync Framework | Sprint 3 | ❌ Not Started | Dev |
| D11 | Photo Review Workflow | Sprint 2 | ❌ Not Started | Dev |
| D12 | ~~Reader Management CRUD~~ | N/A | ⛔ Removed | Dev |
| D13 | Meter Lookup (Search) | Sprint 2 | ❌ Not Started | Dev |
| D14 | Notes/Comments on Readings | Sprint 2 | ❌ Not Started | Dev |
| D15 | Usage Comparison Display | Sprint 3 | ❌ Not Started | Dev |
| D16 | Enhanced Photo Review (Side-by-Side) | Sprint 3 | ❌ Not Started | Dev |
| D17 | GPS Verification Display (Map) | Sprint 3 | ❌ Not Started | Dev |
| D18 | Export Readings (CSV) | Sprint 3 | ❌ Not Started | Dev |

---

## 📅 Sprint Breakdown

### Sprint 1 - Foundation ✅

**Duration:** April 4, 2026  
**Goal:** Working POC with UI + database + mock data  
**Status:** ✅ **Complete**

#### Deliverables

- [x] **D1: Authentication System**
  - [x] Email/password signup
  - [x] Login/logout flow
  - [x] User profile creation
  - [x] Protected routes
  - **Files:** `frontend/src/app/login/page.tsx`, `frontend/src/app/signup/page.tsx`
  - **Status:** ✅ Live on Vercel

- [x] **D2: Dashboard - Routes Tab**
  - [x] Route listing (grouped by zip)
  - [x] Route cards with status badges
  - [x] Assign reader modal (mock)
  - [x] Tab navigation (Routes/Photos)
  - [x] Sync status bar
  - **Files:** `frontend/src/app/page.tsx`
  - **Status:** ✅ Live on Vercel

- [x] **D3: Meter Review (Photos Tab)**
  - [x] Tab navigation
  - [ ] Photo review queue UI (manager's own photos)
  - [ ] Photo inspect modal
  - [ ] Review/flag actions
  - [ ] Side-by-side photo vs. read comparison
  - [ ] GPS verification (map overlay)
  - **Status:** ⚠️ Placeholder only

- [x] **D4: Meter Reading Form**
  - [x] GPS capture + accuracy display
  - [x] Reading input with validation
  - [x] Delta calculation (% change)
  - [x] Recheck warning (>40%)
  - [ ] Photo capture (actual camera)
  - [ ] Submit to database
  - [ ] Notes/comments field
  - **Files:** `frontend/src/app/components/MeterReadingForm.tsx`
  - **Status:** ⚠️ UI complete, backend pending

- [x] **D5: Database Schema + Mock Data**
  - [x] Supabase project setup
  - [x] PostGIS extension enabled
  - [x] Schema deployed (users, meters, readings)
  - [x] RLS policies configured
  - [x] Mock data generator (100 meters, 1,500 readings)
  - **Files:** `migrations/001_initial_schema.sql`, `scripts/generate-mock-data.js`
  - **Status:** ✅ Complete

#### Sprint 1 Retrospective

**What Went Well:**
- Fast scaffold with Next.js + Tailwind
- Mockup design migrated successfully
- Database schema deployed without issues
- Mock data generation working

**Blockers:**
- RLS needs to be re-enabled with proper user linking
- Reading form submit is console.log only

**Carry to Sprint 2:**
- Reading submission backend
- Photo upload integration
- Route assignment persistence

---

### Sprint 2 - Core Workflow 🚧

**Duration:** TBD  
**Goal:** End-to-end reading workflow functional  
**Status:** 🟡 **Not Started**

#### Deliverables

- [ ] **D6: Reading Submission (DB)**
  - [ ] Supabase insert on form submit
  - [ ] Update meter.last_reading_date
  - [ ] Success/error toast feedback
  - [ ] Redirect to dashboard on success
  - **Estimated:** 2h
  - **Dependencies:** D4 (Reading Form)
  - **Status:** ❌ Not Started

- [ ] **D7: Photo Upload Integration**
  - [ ] Supabase Storage bucket setup
  - [ ] Camera/file picker in form
  - [ ] Upload progress indicator
  - [ ] Store URL in readings.photo_url
  - [ ] View uploaded photo in history
  - **Estimated:** 4h
  - **Dependencies:** D6
  - **Status:** ❌ Not Started

- [ ] **D8: Route Self-Assignment**
  - [ ] Create `route_assignments` table
  - [ ] Save assignment to DB on modal submit (manager self-assigns)
  - [ ] Load assignments on dashboard
  - [ ] Update route status (unassigned → assigned → in-progress → completed)
  - [ ] Remove reader selection UI
  - **Estimated:** 2h
  - **Dependencies:** D2
  - **Status:** ❌ Not Started

- [ ] **D9: Reading History Display**
  - [ ] Query last 50 readings per route/meter
  - [ ] Table view on dashboard
  - [ ] Reading detail modal
  - [ ] Filter by date range
  - [ ] Export to CSV option
  - **Estimated:** 2h
  - **Dependencies:** D6
  - **Status:** ❌ Not Started

- [ ] **D11: Photo Review Workflow**
  - [ ] Photo review queue (grid view, manager's own photos)
  - [ ] Photo zoom/inspect modal
  - [ ] Flag for re-visit / mark as verified
  - [ ] Filter by date/route
  - [ ] OCR integration (future)
  - **Estimated:** 5h
  - **Dependencies:** D7
  - **Status:** ❌ Not Started

- [ ] **D13: Meter Lookup (Search)**
  - [ ] Search by meter ID
  - [ ] Search by address
  - [ ] Search by account number
  - [ ] Quick access from header
  - [ ] Display meter details + recent readings
  - **Estimated:** 3h
  - **Dependencies:** D9
  - **Status:** ❌ Not Started

- [ ] **D14: Notes/Comments on Readings**
  - [ ] Add notes field to readings table
  - [ ] Text input in reading form
  - [ ] Display notes in history/review
  - [ ] Edit notes after submission
  - **Estimated:** 2h
  - **Dependencies:** D6
  - **Status:** ❌ Not Started

#### Sprint 2 Acceptance Criteria

- [ ] Can submit a reading and see it in database
- [ ] Can upload a photo with reading
- [ ] Can self-assign a route and see it persist
- [ ] Can view reading history per route
- [ ] Can review own photos in Photos tab
- [ ] Can search meters by ID/address/account
- [ ] Can add notes to readings
- [ ] RLS re-enabled with proper user linking

#### Known Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| RLS disabled for testing | Medium | Link mock data to auth users, then re-enable |
| No Supabase Storage bucket | Low | Create bucket in dashboard |
| Mock data assumes readers table | Low | Remove reader references, use users table only |
| Schema needs notes column | Low | Add migration for readings.notes |

---

### Sprint 3 - Offline + Advanced 📋

**Duration:** TBD  
**Goal:** Offline-first capability for managers in the field + enhanced review  
**Status:** ⚪ **Planned**

#### Deliverables

- [ ] **D10: Offline Sync Framework**
  - [ ] Service worker setup (next-pwa)
  - [ ] IndexedDB queue for pending readings
  - [ ] Background sync on reconnect
  - [ ] Sync status indicator (pending count)
  - [ ] Conflict resolution UI
  - **Estimated:** 16h
  - **Dependencies:** D6
  - **Status:** ❌ Not Started

- [ ] **D15: Usage Comparison Display**
  - [ ] Show current vs. previous reading delta
  - [ ] Historical usage chart (last 12 readings)
  - [ ] Average consumption indicator
  - [ ] High/low usage alerts
  - **Estimated:** 4h
  - **Dependencies:** D9
  - **Status:** ❌ Not Started

- [ ] **D16: Enhanced Photo Review (Side-by-Side)**
  - [ ] Side-by-side photo vs. reading value
  - [ ] Zoom/pan photo viewer
  - [ ] Compare multiple photos for same meter
  - [ ] Quick approve/re-visit actions
  - **Estimated:** 4h
  - **Dependencies:** D7, D11
  - **Status:** ❌ Not Started

- [ ] **D17: GPS Verification Display (Map)**
  - [ ] Leaflet map integration
  - [ ] Show meter location vs. capture point
  - [ ] Distance calculation
  - [ ] Flag if outside tolerance (>50m)
  - **Estimated:** 6h
  - **Dependencies:** D6
  - **Status:** ❌ Not Started

- [ ] **D18: Export Readings (CSV)**
  - [ ] Export selected route readings
  - [ ] Export all readings for date range
  - [ ] Include all fields (GPS, photo URL, notes)
  - [ ] Download as CSV file
  - **Estimated:** 2h
  - **Dependencies:** D9
  - **Status:** ❌ Not Started

#### Sprint 3 Acceptance Criteria

- [ ] Can submit reading while offline
- [ ] Readings queue and sync when online
- [ ] Photo review queue functional with side-by-side view
- [ ] Can see usage history charts
- [ ] Can verify GPS accuracy on map
- [ ] Can export readings to CSV

---

### Sprint 4 - Customer Portal (Phase 2) 📋

**Duration:** TBD  
**Goal:** Customer-facing usage dashboard  
**Status:** ⚪ **Planned**

#### Deliverables

- [ ] **D19: Customer Authentication**
  - [ ] Separate customer login flow
  - [ ] Link customers to meters
  - [ ] Password reset
  - **Estimated:** 3h

- [ ] **D20: Usage Dashboard**
  - [ ] Usage history chart (Recharts)
  - [ ] Compare to previous periods
  - [ ] Cost estimator
  - [ ] Download usage report
  - **Estimated:** 8h

- [ ] **D21: Alerts & Notifications**
  - [ ] High usage alert configuration
  - [ ] Leak detection notification
  - [ ] Email/SMS preferences
  - **Estimated:** 6h

---

### Sprint 5 - Analytics (Phase 2) 📋

**Duration:** TBD  
**Goal:** Predictive analytics + optimization  
**Status:** ⚪ **Planned**

#### Deliverables

- [ ] **D22: Usage Analytics**
  - [ ] Aggregation queries (daily/monthly)
  - [ ] Trend detection
  - [ ] Anomaly detection (leaks)
  - **Estimated:** 8h

- [ ] **D23: Route Optimization**
  - [ ] Geospatial clustering
  - [ ] Efficient route generation
  - [ ] Daily assignment algorithm
  - **Estimated:** 12h

- [ ] **D24: Admin Dashboard**
  - [ ] Manager performance metrics
  - [ ] Heat maps (geographic)
  - [ ] Exception reports
  - **Estimated:** 10h

---

## 🚧 Current Blockers

| ID | Blocker | Severity | Sprint | Resolution | Status |
|----|---------|----------|--------|------------|--------|
| B1 | RLS disabled (mock data not linked to auth users) | Medium | 2 | Update mock data user_id to match auth user, or re-run generator after signup | ⏳ Pending |
| B2 | Reading form submit = console.log only | High | 2 | Implement Supabase insert in MeterReadingForm.tsx | ⏳ Pending |
| B3 | No Supabase Storage bucket for photos | Low | 2 | Create bucket in Supabase Dashboard → Storage | ⏳ Pending |
| B4 | Mock data assumes readers table | Low | 2 | Remove reader references, use users table only | ⏳ Pending |
| B5 | Schema missing notes column | Low | 2 | Add migration: ALTER TABLE readings ADD COLUMN notes TEXT | ⏳ Pending |

---

## 📊 Progress Tracking

### Overall Progress

```
Sprint 1: ████████████████████ 100% ✅
Sprint 2: ░░░░░░░░░░░░░░░░░░░░   0% 🚧
Sprint 3: ░░░░░░░░░░░░░░░░░░░░   0%
Sprint 4: ░░░░░░░░░░░░░░░░░░░░   0%
Sprint 5: ░░░░░░░░░░░░░░░░░░░░   0%
───────────────────────────────────────
Total:    ███░░░░░░░░░░░░░░░░░  15%
```

### By Deliverable Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Complete | 5 | 29% |
| ⚠️ Partial | 2 | 12% |
| ❌ Not Started | 9 | 53% |
| ⛔ Removed | 1 | 6% |

### Effort Tracking

| Sprint | Estimated Hours | Actual Hours | Variance |
|--------|-----------------|--------------|----------|
| Sprint 1 | 20h | ~18h | -2h ✅ |
| Sprint 2 | 20h | - | - |
| Sprint 3 | 28h | - | - |
| Sprint 4 | 17h | - | - |
| Sprint 5 | 30h | - | - |
| **Total** | **115h** | **18h** | **97h remaining** |

---

## 📁 File Index

### Frontend
- `frontend/src/app/page.tsx` - Dashboard (Routes/Photos)
- `frontend/src/app/login/page.tsx` - Login page
- `frontend/src/app/signup/page.tsx` - Signup page
- `frontend/src/app/components/MeterReadingForm.tsx` - Reading modal
- `frontend/src/app/layout.tsx` - Root layout
- `frontend/src/lib/supabase.ts` - Supabase client + types

### Backend
- `migrations/001_initial_schema.sql` - Database schema
- `migrations/002_add_notes_column.sql` - Add notes to readings (TODO)
- `scripts/generate-mock-data.js` - Mock data generator
- `schema-design.md` - Schema documentation
- `supabase-config.md` - Connection info

### Documentation
- `POC-STATUS.md` - Detailed status report
- `INFRASTRUCTURE_COMPARISON.md` - Architecture doc for designers
- `README-POC.md` - POC setup guide
- `PROJECT-TRACKER.md` - This file
- `Website_Reference_guide.pdf` - Original system reference

---

## 🔗 Quick Links

- **Live Demo:** https://meter-reader-pwa.vercel.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/qjvexijvewosweznmgtg
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** (link pending)

---

## 📝 Change Log

### 2026-04-04 (v0.3.0 - Managers-Only Scope)
- ✅ Created PROJECT-TRACKER.md
- ✅ Sprint 1 complete (Foundation)
- ✅ Live deployment on Vercel
- ✅ **Scope clarified: Managers-only POC** (no reader app)
- ✅ Removed D12 (Reader Management CRUD)
- ✅ Updated D3 to "Meter Review" (expanded scope)
- ✅ Added D13-D18 (Reference Guide features)
- ✅ Updated D11 to Photo Review (manager's own photos)
- ✅ Updated Sprint 2/3 with new deliverables
- ⚠️ Sprint 2 ready to start

### 2026-04-04 (v0.2.0)
- ✅ Sprint 1 complete (Foundation)
- ✅ Live deployment on Vercel

---

## 🎯 Next Session Goals

**Priority 1:** Complete D6 (Reading Submission to DB)
- [ ] Add Supabase insert to MeterReadingForm.tsx
- [ ] Update meter.last_reading_date on submit
- [ ] Add success/error feedback
- [ ] Test end-to-end flow

**Priority 2:** Resolve B1 (RLS + User Linking)
- [ ] Option A: Update mock data to match auth user
- [ ] Option B: Re-run mock generator after signup
- [ ] Re-enable RLS policies

**Priority 3:** Start D7 (Photo Upload)
- [ ] Create Supabase Storage bucket
- [ ] Add camera/file picker to form
- [ ] Implement upload + URL storage

**Priority 4:** Add D14 (Notes Column)
- [ ] Create migration: `ALTER TABLE readings ADD COLUMN notes TEXT`
- [ ] Add notes field to reading form
- [ ] Display notes in history/review

---

**Last Review:** 2026-04-04  
**Next Review:** TBD (after Sprint 2)
