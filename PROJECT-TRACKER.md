# Meter Reader PWA - Project Tracker

**Project:** Meter Reader Manager Portal  
**Version:** 0.3.0 (Manager Review & Operations)  
**Live Demo:** https://meter-reader-pwa.vercel.app  
**Last Updated:** 2026-04-05  
**Status:** 🟡 In Progress

---

## 📋 Project Overview

### Vision
A **mobile-first Progressive Web App for managers** to review, approve, and manage meter reading operations. Readers submit readings via a separate workflow (existing or future reader app). Managers focus on **review, exception handling, route assignment, and reporting**.

### Architecture Context
```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│   Reader App    │────────▶│  Manager Portal      │────────▶│  City/Backend   │
│  (Separate)     │  Reads  │  (This PWA)          │  Export │  Systems        │
│  - Field work   │         │  - Review & Approve  │         │  - CSV Download │
│  - Photo capture│         │  - Route Assignment  │         │  - Reports      │
│  - GPS capture  │         │  - Exception Mgmt    │         │                 │
└─────────────────┘         └──────────────────────┘         └─────────────────┘
```

### Scope Clarification (2026-04-05)
| Aspect | Corrected Understanding |
|--------|------------------------|
| **Reader Workflow** | ✅ Separate system (existing or future). Readers submit readings with photos + GPS. |
| **Manager Workflow** | ✅ Review submitted readings, approve/reject exceptions, assign routes, export data. |
| **Reading Submission** | ❌ Managers do NOT submit readings in this portal. They review reader submissions. |
| **Photo Review** | ✅ Managers review photos submitted by readers (not their own). |
| **Route Assignment** | ✅ Managers assign routes to readers (not self-assign). |

### Reference System Features (from Website Reference Guide)
| Section | Original System | Manager Portal Coverage |
|---------|----------------|------------------------|
| Status Page | City cycle status, meter lookup | ✅ Keep - Manager dashboard |
| Meter Review | Approve/Reject, photo vs. read, GPS verification | ✅ Core - Review workflow |
| Load Manager | Assign routes to readers | ✅ Keep - Reader assignment |
| City Data | Upload cycle files | ❌ Phase 2 (Admin function) |
| Reports | General + reader reports | ⚠️ Partial - Manager reports only |
| Certified Reports | Exceptions, certificates | ❌ Phase 2 |
| History | Cycle/meter reports | ✅ Keep - Reading history |

---

## 📚 Legacy System Functionality Reference

*Comprehensive mapping of all features from the legacy website (Website_Reference_guide.pdf)*

### 1️⃣ Status Page (Legacy Page 2)

| ID | Feature | Description | Priority | Coverage Status | Sprint/Phase | Notes |
|----|---------|-------------|----------|-----------------|--------------|-------|
| L1-01 | City Cycle Status Display | Shows city/cycle information and current status | High | ❌ Not covered | Sprint 2 | **Critical for context** |
| L1-02 | Read Downloads | Download completed/approved reads when cycle is complete | High | ⚠️ Partial (D18) | Sprint 3 | CSV export covers this |
| L1-03 | Prepare New Read Cycle | Link to start new cycle + initiate file upload | Low | ❌ Not covered | Phase 2 | Admin function |
| L1-04 | Meter Lookup by ID | Search meters by meter ID | High | ⚠️ Planned (D13) | Sprint 2 | Core feature |
| L1-05 | Meter Lookup by Address | Search meters by street address | High | ⚠️ Planned (D13) | Sprint 2 | Core feature |
| L1-06 | Meter Lookup by Account Number | Search meters by customer account | Medium | ⚠️ Planned (D13) | Sprint 2 | May need account field |
| L1-07 | Quick Reference Guides | Downloadable PDF guides | Low | ❌ Not covered | Backlog | Static content |
| L1-08 | Sales/Support Contact Info | Display contact information | Low | ❌ Not covered | Backlog | Static content |

### 2️⃣ Meter Review (Legacy Page 3) - **CORE MANAGER WORKFLOW**

| ID | Feature | Description | Priority | Coverage Status | Sprint/Phase | Notes |
|----|---------|-------------|----------|-----------------|--------------|-------|
| L2-01 | Approve Meter Exception | Manager approves a submitted read | High | ⚠️ Planned (D11) | Sprint 2 | **Core workflow** |
| L2-02 | Reject/Reread Meter | Mark read for field re-visit (sends back to reader) | High | ⚠️ Planned (D11) | Sprint 2 | **Core workflow** |
| L2-03 | Read vs. Photo Comparison | Compare reading value against submitted photo | High | ⚠️ Planned (D16) | Sprint 3 | Enhanced review |
| L2-04 | GPS vs. Address Verification | Verify GPS location matches meter address | High | ⚠️ Planned (D17) | Sprint 3 | Map display |
| L2-05 | View Notes/Comments | Display notes attached to reading (from reader) | Medium | ⚠️ Planned (D14) | Sprint 2 | Required for review |
| L2-06 | View Usage Data | Show historical usage during review | Medium | ⚠️ Planned (D15) | Sprint 3 | Context for approval |
| L2-07 | Meter Exception Queue | List of reads pending review | High | ⚠️ Partial (D3) | Sprint 2 | **Photos tab - core feature** |

### 3️⃣ Load Manager (Legacy Page 4) - **CORE MANAGER WORKFLOW**

| ID | Feature | Description | Priority | Coverage Status | Sprint/Phase | Notes |
|----|---------|-------------|----------|-----------------|--------------|-------|
| L3-01 | Assign Routes to Readers | Manager assigns routes to available readers | High | ⚠️ Planned (D8) | Sprint 2 | **Core feature - needs reader mgmt** |
| L3-02 | Split Routes | Temporarily split route between multiple readers | Low | ❌ Not covered | Phase 2 | Advanced feature |
| L3-03 | Reader Selection List | Dropdown of available readers | High | ⚠️ Planned (D8) | Sprint 2 | **Required for assignment** |
| L3-04 | Auto-Save Assignments | Route assignments save automatically | Medium | ⚠️ Planned (D8) | Sprint 2 | UX improvement |
| L3-05 | View Assignment List | Display reader + route assignments | High | ⚠️ Partial (D2) | Sprint 2 | **Shows routes, needs reader names** |

### 4️⃣ City Data Page (Legacy Pages 5-7)

| ID | Feature | Description | Priority | Coverage Status | Sprint/Phase | Notes |
|----|---------|-------------|----------|-----------------|--------------|-------|
| L4-01 | City Status Management | Complete → Prepare → Active → Ready to Download | Low | ❌ Not covered | Phase 2 | Admin workflow |
| L4-02 | Upload Cycle File | Upload city cycle data file | Low | ❌ Not covered | Phase 2 | Admin function |
| L4-03 | Upload Customer File | Upload customer data file | Low | ❌ Not covered | Phase 2 | Admin function |
| L4-04 | Upload Results Display | Show results/validation of file upload | Low | ❌ Not covered | Phase 2 | Feedback on import |
| L4-05 | Download City Reads | Export completed reads for the city | Medium | ⚠️ Partial (D18) | Sprint 3 | CSV export covers this |
| L4-06 | Load Manager Access | Access assignment tool during Active status | Medium | ⚠️ Planned (D8) | Sprint 2 | Always available |

### 5️⃣ Reports Page (Legacy Page 8)

| ID | Feature | Description | Priority | Coverage Status | Sprint/Phase | Notes |
|----|---------|-------------|----------|-----------------|--------------|-------|
| L5-01 | General Reports | Informational reports about system | Low | ❌ Not covered | Phase 2 | Analytics |
| L5-02 | Current Read Cycle Reports | Editable data reports for active cycle | Medium | ❌ Not covered | Phase 2 | Operations |
| L5-03 | Reader Reports | Performance metrics on readers | N/A | ⛔ Removed | N/A | Managers-only scope |

### 6️⃣ Certified Reports (Legacy Page 9)

| ID | Feature | Description | Priority | Coverage Status | Sprint/Phase | Notes |
|----|---------|-------------|----------|-----------------|--------------|-------|
| L6-01 | Certified Exceptions Report | Negative, Zero, Low, High usage exceptions | Low | ❌ Not covered | Phase 2 | Quality control |
| L6-02 | City Certified Reports | Meters certified by the city | Low | ❌ Not covered | Phase 2 | External validation |
| L6-03 | Certified Photo Data | Photos tied to certified reads | Low | ❌ Not covered | Phase 2 | Audit trail |
| L6-04 | Certificate Lookup | Print certificate for specific meter | Low | ❌ Not covered | Phase 2 | Customer-facing |

### 7️⃣ History Page (Legacy Page 10)

| ID | Feature | Description | Priority | Coverage Status | Sprint/Phase | Notes |
|----|---------|-------------|----------|-----------------|--------------|-------|
| L7-01 | Select Cycle by Date/Range | Choose historical cycle to view | Medium | ⚠️ Planned (D9) | Sprint 2 | Filter functionality |
| L7-02 | Run Reports on Meters | Generate reports for selected cycle | Low | ❌ Not covered | Phase 2 | Analytics |
| L7-03 | Meter History Display | View historical readings for meter | High | ⚠️ Planned (D9) | Sprint 2 | Core feature |

---

### 📊 Legacy Coverage Summary

| Category | Total Features | Covered | Partial | Removed | Not Covered | Coverage % |
|----------|----------------|---------|---------|---------|-------------|------------|
| Status Page | 8 | 0 | 4 | 0 | 4 | 50% |
| Meter Review | 7 | 0 | 5 | 0 | 2 | 71% |
| Load Manager | 5 | 0 | 3 | 1 | 1 | 60% |
| City Data | 6 | 0 | 2 | 0 | 4 | 33% |
| Reports | 3 | 0 | 0 | 1 | 2 | 0% |
| Certified Reports | 4 | 0 | 0 | 0 | 4 | 0% |
| History | 3 | 0 | 2 | 0 | 1 | 67% |
| **TOTAL** | **36** | **0** | **16** | **3** | **17** | **44%** |

**Notes:**
- **Removed (3):** Reader-specific features excluded due to managers-only scope
- **Partial (16):** Features planned in current sprint plan (Sprints 2-3)
- **Not Covered (17):** Phase 2 features or low-priority backlog items
- **Current POC Focus:** Core manager workflow (reading, review, assignment)

---

## 🎯 Deliverables Summary

| ID | Deliverable | Sprint | Status | Owner | Priority |
|----|-------------|--------|--------|-------|----------|
| D1 | Authentication System | Sprint 1 | ✅ Complete | Dev | ✅ Done |
| D2 | Dashboard - Routes Tab | Sprint 1 | ✅ Complete | Dev | ✅ Done |
| D3 | Meter Review (Photos Tab) | Sprint 1 | ⚠️ Partial | Dev | 🔄 In Progress |
| D4 | ~~Meter Reading Form~~ | N/A | ⛔ **Removed** | Dev | N/A |
| D5 | Database Schema + Mock Data | Sprint 1 | ✅ Complete | Dev | ✅ Done |
| D6 | ~~Reading Submission (DB)~~ | N/A | ⛔ **Removed** | Dev | N/A |
| D7 | ~~Photo Upload Integration~~ | N/A | ⛔ **Removed** | Dev | N/A |
| D8 | Route Assignment (Manager → Reader) | Sprint 2 | ✅ Complete | Dev | ✅ Done |
| D9 | Reading History Display | Sprint 2 | ✅ Complete | Dev | ✅ Done |
| D10 | Offline Sync Framework | Sprint 4 | ❌ Not Started | Dev | 🟠 High |
| D11 | Photo Review Workflow (Approve/Reject) | Sprint 2 | ✅ Complete | Dev | ✅ Done |
| D12 | Reader Management (CRUD) | Sprint 2 | ✅ Complete | Dev | ✅ Done |
| D13 | Meter Lookup (Search) | Sprint 2 | ✅ Complete | Dev | ✅ Done |
| D14 | Notes/Comments on Readings | Sprint 2 | ✅ Complete | Dev | ✅ Done |
| D15 | Usage Comparison Display | Sprint 4 | ❌ Not Started | Dev | 🟢 Medium |
| D16 | Enhanced Photo Review (Side-by-Side) | Sprint 4 | ❌ Not Started | Dev | 🟢 Medium |
| D17 | GPS Verification Display (Map) | Sprint 4 | ❌ Not Started | Dev | 🟢 Medium |
| D18 | Export Readings (CSV) | Sprint 4 | ❌ Not Started | Dev | 🟠 High |
| D19 | Cycle/Status Management | Sprint 2 | ⚠️ Partial | Dev | 🔄 In Progress |
| **D22** | **City/Route Hierarchy** (GAP-01) | **Sprint 3** | ❌ Not Started | Dev | 🔴 **Critical** |
| **D23** | **Exception Detection** (GAP-02) | **Sprint 3** | ❌ Not Started | Dev | 🔴 **Critical** |
| **D24** | **Reading Edit Workflow** (GAP-03) | **Sprint 3** | ❌ Not Started | Dev | 🔴 **Critical** |
| **D25** | **Usage History in Review** (GAP-04) | **Sprint 3** | ❌ Not Started | Dev | 🟠 **High** |
| **D26** | **Reread Queue** (GAP-05) | **Sprint 3** | ❌ Not Started | Dev | 🟠 **High** |
| **D27** | **Reader Totals Report** (GAP-06) | **Sprint 3** | ❌ Not Started | Dev | 🟠 **High** |
| **D28** | **Reader Tardiness Report** (GAP-06) | **Sprint 3** | ❌ Not Started | Dev | 🟠 **High** |

---

## 📋 Requirements & Features

*Project-wide objectives organized by functional area. Each feature maps to legacy requirements and sprint deliverables.*

### R1: Route & Reader Management (Load Manager)

| ID | Feature | Priority | Status | Deliverables | Legacy Mapping |
|----|---------|----------|--------|--------------|----------------|
| R1-01 | **Reader CRUD** - Create, read, update, deactivate readers | 🔴 Critical | ❌ Not Started | D12 | L3-03 |
| R1-02 | **Route Assignment** - Assign routes to readers | 🔴 Critical | ❌ Not Started | D8 | L3-01, L3-04 |
| R1-03 | **Assignment Tracking** - View who has which routes | 🔴 Critical | ⚠️ Partial | D2, D8 | L3-05 |
| R1-04 | **Route Splitting** - Split route between multiple readers | 🟢 Low | ❌ Not Started | Backlog | L3-02 |
| R1-05 | **Reader Contact Info** - Store phone/email for readers | 🟠 High | ❌ Not Started | D12 | L3-03 |

### R2: Reading Review & Approval (Meter Review)

| ID | Feature | Priority | Status | Deliverables | Legacy Mapping |
|----|---------|----------|--------|--------------|----------------|
| R2-01 | **Review Queue** - List of pending readings from readers | 🔴 Critical | ⚠️ Partial | D3, D11 | L2-07 |
| R2-02 | **Approve Reading** - Accept submitted reading | 🔴 Critical | ❌ Not Started | D11 | L2-01 |
| R2-03 | **Reject/Reread** - Send back to reader for re-visit | 🔴 Critical | ❌ Not Started | D11 | L2-02 |
| R2-04 | **Photo Display** - View reader's submitted photo | 🔴 Critical | ⚠️ Partial | D3, D11 | L2-03 |
| R2-05 | **Photo vs. Read Comparison** - Side-by-side view | 🟠 High | ❌ Not Started | D16 | L2-03 |
| R2-06 | **GPS Verification** - Compare GPS to meter address | 🟠 High | ❌ Not Started | D17 | L2-04 |
| R2-07 | **Reader Notes Display** - Show notes from reader | 🟠 High | ❌ Not Started | D14 | L2-05 |
| R2-08 | **Manager Notes** - Add internal notes to reading | 🟢 Medium | ❌ Not Started | D14 | L2-05 |
| R2-09 | **Usage History** - Show historical usage during review | 🟢 Medium | ❌ Not Started | D15 | L2-06 |

### R3: Dashboard & Status (Status Page)

| ID | Feature | Priority | Status | Deliverables | Legacy Mapping |
|----|---------|----------|--------|--------------|----------------|
| R3-01 | **Cycle Status Display** - Show current cycle & status | 🔴 Critical | ❌ Not Started | D19 | L1-01 |
| R3-02 | **Cycle Selection** - Switch between cycles | 🟠 High | ❌ Not Started | D19 | L1-01, L7-01 |
| R3-03 | **Progress Tracking** - Readings complete / total meters | 🟠 High | ❌ Not Started | D19 | L1-01 |
| R3-04 | **Route Listing** - Routes grouped by zip/area | ✅ Done | ✅ Complete | D2 | L1-01 |
| R3-05 | **Meter Lookup** - Search by ID/address/account | 🟠 High | ❌ Not Started | D13 | L1-04, L1-05, L1-06 |
| R3-06 | **Quick Reference Guides** - Downloadable PDFs | 🟢 Low | ❌ Not Started | Backlog | L1-07 |
| R3-07 | **Contact Info Display** - Sales/support contacts | 🟢 Low | ❌ Not Started | Backlog | L1-08 |

### R4: History & Reporting

| ID | Feature | Priority | Status | Deliverables | Legacy Mapping |
|----|---------|----------|--------|--------------|----------------|
| R4-01 | **Reading History** - View historical readings | 🟠 High | ❌ Not Started | D9 | L7-03 |
| R4-02 | **Filter by Cycle/Date** - Select date range or cycle | 🟠 High | ❌ Not Started | D9, D19 | L7-01 |
| R4-03 | **Export to CSV** - Download readings data | 🟠 High | ❌ Not Started | D18 | L1-02, L4-05 |
| R4-04 | **General Reports** - Informational dashboards | 🟢 Medium | ❌ Not Started | D21 (proposed) | L5-01 |
| R4-05 | **Exception Reports** - Negative/zero/high/low reads | 🟢 Medium | ❌ Not Started | D20 (proposed) | L6-01 |
| R4-06 | **Reader Performance** - Stats per reader | 🟢 Low | ❌ Not Started | Backlog | L5-03 (removed) |

### R5: City Data & Cycle Management (Admin)

| ID | Feature | Priority | Status | Deliverables | Legacy Mapping |
|----|---------|----------|--------|--------------|----------------|
| R5-01 | **Upload Cycle File** - Import city cycle data | 🟢 Low | ❌ Not Started | Phase 2 | L4-02 |
| R5-02 | **Upload Customer File** - Import customer data | 🟢 Low | ❌ Not Started | Phase 2 | L4-03 |
| R5-03 | **Upload Results** - Show import validation | 🟢 Low | ❌ Not Started | Phase 2 | L4-04 |
| R5-04 | **Cycle Status Workflow** - Pending → Active → Complete | 🟢 Low | ❌ Not Started | Phase 2 | L4-01 |
| R5-05 | **Download City Reads** - Export for city submission | 🟠 High | ❌ Not Started | D18 | L4-05 |

### R6: Certified Reports (Phase 2)

| ID | Feature | Priority | Status | Deliverables | Legacy Mapping |
|----|---------|----------|--------|--------------|----------------|
| R6-01 | **Certified Exceptions** - Approved exception reports | 🟢 Low | ❌ Not Started | Phase 2 | L6-01 |
| R6-02 | **City Certified Reports** - City-validated meters | 🟢 Low | ❌ Not Started | Phase 2 | L6-02 |
| R6-03 | **Certified Photo Data** - Photos for certified reads | 🟢 Low | ❌ Not Started | Phase 2 | L6-03 |
| R6-04 | **Certificate Lookup** - Print meter certificates | 🟢 Low | ❌ Not Started | Phase 2 | L6-04 |

### R7: Offline & Mobile (PWA Enhancements)

| ID | Feature | Priority | Status | Deliverables | Legacy Mapping |
|----|---------|----------|--------|--------------|----------------|
| R7-01 | **Offline Browsing** - Cache UI for offline use | 🟠 High | ❌ Not Started | D10 | New (PWA) |
| R7-02 | **Responsive Design** - Mobile-first layout | ✅ Done | ✅ Complete | D2, D3 | New (PWA) |
| R7-03 | **Sync Status Indicator** - Show pending/pushed | 🟠 High | ❌ Not Started | D10 | New (PWA) |

---

## 🔍 Gap Analysis & Recommendations

### Critical Gaps (High Priority Legacy Features Not Yet Covered)

| Gap ID | Legacy Feature | Impact | Recommendation | Priority | Sprint |
|--------|----------------|--------|----------------|----------|--------|
| G1 | City Cycle Status Management | Managers cannot see which cycle is active | Add D19: Cycle/Status Management | 🔴 Critical | 2 |
| G2 | Reader Management | Cannot assign routes without readers | Add D12: Reader CRUD | 🔴 Critical | 2 |
| G3 | Exception Flagging System | No way to identify unusual reads | Add D20: Exception Detection | 🟠 High | 3 |
| G4 | Analytics/Reporting Dashboard | No progress visibility | Add D21: Dashboard Analytics | 🟢 Medium | 3 |
| G5 | GPS Map Visualization | Cannot verify location visually | Add D17: Map Display | 🟠 High | 3 |

### Scope Decisions (Features Removed by Design)

| Feature | Reason for Removal | Alternative |
|---------|-------------------|-------------|
| Manager Reading Submission | Managers review, not submit | Separate reader app/ workflow handles submissions |
| Reader Performance Reports | Out of scope for POC | Can be added in Phase 2 |
| Route Splitting | Advanced feature | Can be added in Phase 2 if needed |
| Certificate Printing | Customer-facing feature | Phase 2 (Certified Reports) |

### Recommendations for Sprint 2-3 Planning

1. **Add D19: Cycle/Status Management** (Sprint 2)
   - Display current cycle status
   - Allow cycle selection/filtering
   - Maps to: L1-01, L4-01, L7-01

2. **Add D20: Exception Detection** (Sprint 3)
   - Auto-flag negative, zero, high (>40% change), low readings
   - Filter Photos tab by exception type
   - Maps to: L2-01, L2-02, L6-01

3. **Add D21: Dashboard Analytics** (Sprint 3)
   - Completion percentage per route
   - Exception count summary
   - Recent activity feed
   - Maps to: L5-01, L5-02

4. **Enhance D18 (CSV Export)** (Sprint 3)
   - Ensure export includes all fields needed for city submission
   - Add "Download City Reads" format option
   - Maps to: L1-02, L4-05

### Updated Coverage After Recommendations

If all recommendations are implemented:

| Category | Current Coverage | After Sprint 2-3 | After Phase 2 |
|----------|------------------|------------------|---------------|
| Status Page | 50% | 75% | 100% |
| Meter Review | 71% | 100% | 100% |
| Load Manager | 60% | 80% | 100% |
| City Data | 33% | 50% | 100% |
| Reports | 0% | 33% | 100% |
| Certified Reports | 0% | 0% | 100% |
| History | 67% | 100% | 100% |
| **TOTAL** | **44%** | **67%** | **100%** |

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
  - [ ] Photo review queue UI (pending reader submissions)
  - [ ] Photo inspect modal
  - [ ] Approve/Reject actions
  - [ ] Side-by-side photo vs. read comparison
  - [ ] GPS verification (map overlay)
  - [ ] Display reader name + notes
  - **Status:** ⚠️ Placeholder only

- [x] **D4: ~~Meter Reading Form~~** ⛔ **REMOVED**
  - **Note:** Reading submission is handled by separate reader workflow (not part of this portal)
  - **Status:** ⛔ Removed from scope

- [x] **D5: Database Schema + Mock Data**
  - [x] Supabase project setup
  - [x] PostGIS extension enabled
  - [x] Schema deployed (users, meters, readings)
  - [x] RLS policies configured
  - [ ] Mock data generator (needs reader submissions, not manager)
  - **Files:** `migrations/001_initial_schema.sql`, `scripts/generate-mock-data.js`
  - **Status:** ⚠️ Needs update for reader workflow

#### Sprint 1 Retrospective

**What Went Well:**
- Fast scaffold with Next.js + Tailwind
- Mockup design migrated successfully
- Database schema deployed without issues
- Authentication working

**What Needs Correction:**
- Mock data assumes managers submit readings (should be reader submissions)
- Photos tab shows manager's own photos (should show reader submissions)
- Route assignment is self-assign (should be manager → reader)
- Missing `readers` table for reader management

**Carry to Sprint 2:**
- ~~Reading submission backend~~ (Removed - reader workflow is separate)
- ~~Photo upload integration~~ (Removed - readers upload photos)
- Route assignment persistence (now: Manager assigns to readers)
- Reader Management CRUD (new critical requirement)
- Cycle/Status display (new critical requirement)

---

### Sprint 2 - Core Workflow 🚧

**Duration:** TBD  
**Goal:** Manager can assign routes to readers, review submitted readings, and approve/reject exceptions  
**Status:** 🟡 **Not Started**

#### Deliverables

- [ ] **D8: Route Assignment (Manager → Reader)** 🔴 **CRITICAL**
  - [ ] Create `readers` table (id, name, email, phone, active status)
  - [ ] Create `route_assignments` table (route_id, reader_id, manager_id, status, dates)
  - [ ] Reader selection dropdown in assignment modal
  - [ ] Assign route to reader (manager selects reader + route)
  - [ ] Update route status (unassigned → assigned → in-progress → completed)
  - [ ] Display reader name on route cards in dashboard
  - [ ] Auto-save assignments
  - **Estimated:** 4h
  - **Dependencies:** D2 (Dashboard UI exists)
  - **Legacy Mapping:** L3-01, L3-03, L3-04, L3-05
  - **Status:** ❌ Not Started

- [ ] **D12: Reader Management (CRUD)** 🔴 **CRITICAL**
  - [ ] Readers list page (table view with search/filter)
  - [ ] Add new reader (name, email, phone, active status)
  - [ ] Edit reader details
  - [ ] Deactivate reader (soft delete)
  - [ ] View reader assignment history
  - [ ] Reader detail modal/page
  - **Estimated:** 6h
  - **Dependencies:** D8 (uses readers table)
  - **Legacy Mapping:** L3-03 (Reader Selection List prerequisite)
  - **Status:** ❌ Not Started

- [ ] **D11: Photo Review Workflow (Approve/Reject)** 🔴 **CRITICAL**
  - [ ] Photo review queue (grid view of submitted readings pending review)
  - [ ] Filter by route, reader, date, exception type
  - [ ] Photo zoom/inspect modal
  - [ ] **Approve** action (accepts reading, moves to certified)
  - [ ] **Reject/Reread** action (sends back to reader for re-visit)
  - [ ] Display reading value + photo side-by-side (basic)
  - [ ] Display GPS coordinates vs. meter address
  - [ ] Display reader notes/comments
  - [ ] Update reading status (pending → approved/rejected)
  - **Estimated:** 8h
  - **Dependencies:** D8 (readers table), D12 (reader context)
  - **Legacy Mapping:** L2-01, L2-02, L2-05, L2-07
  - **Status:** ❌ Not Started

- [ ] **D19: Cycle/Status Management** 🔴 **CRITICAL**
  - [ ] Display current city/cycle status on dashboard header
  - [ ] Cycle selector (if multiple cycles exist)
  - [ ] Show cycle progress (readings complete / total meters)
  - [ ] Show status badge (Read Pending / Active / Ready to Download / Complete)
  - [ ] Filter dashboard data by selected cycle
  - **Estimated:** 3h
  - **Dependencies:** D2 (dashboard integration)
  - **Legacy Mapping:** L1-01, L7-01
  - **Status:** ❌ Not Started

- [ ] **D9: Reading History Display** 🟠 **HIGH**
  - [ ] Query readings by route/meter/reader
  - [ ] Table view on dashboard (History tab or modal)
  - [ ] Reading detail modal (shows value, photo, GPS, notes, reader)
  - [ ] Filter by date range, route, reader
  - [ ] Sort by date, meter, status
  - [ ] Export to CSV option (basic)
  - **Estimated:** 4h
  - **Dependencies:** D8, D11 (reading status workflow)
  - **Legacy Mapping:** L7-03
  - **Status:** ❌ Not Started

- [ ] **D13: Meter Lookup (Search)** 🟠 **HIGH**
  - [ ] Search by meter ID
  - [ ] Search by address
  - [ ] Search by account number (if field exists)
  - [ ] Quick access from header (search bar)
  - [ ] Display meter details (location, route, last reading)
  - [ ] Show recent reading history for meter
  - **Estimated:** 4h
  - **Dependencies:** D9 (history display)
  - **Legacy Mapping:** L1-04, L1-05, L1-06
  - **Status:** ❌ Not Started

- [ ] **D14: Notes/Comments on Readings** 🟢 **MEDIUM**
  - [ ] Add notes field to readings table (reader submits notes)
  - [ ] Display notes in photo review workflow
  - [ ] Display notes in history view
  - [ ] Manager can add internal notes (separate field)
  - [ ] Edit manager notes after submission
  - **Estimated:** 2h
  - **Dependencies:** D11 (review workflow)
  - **Legacy Mapping:** L2-05
  - **Status:** ❌ Not Started

#### Sprint 2 Acceptance Criteria

- [ ] Can create/edit/deactivate readers (D12)
- [ ] Can assign routes to readers and see assignments persist (D8)
- [ ] Dashboard shows reader names on route cards (D8)
- [ ] Can view cycle status and progress on dashboard (D19)
- [ ] Can review submitted readings in Photos tab (D11)
- [ ] Can approve or reject readings (D11)
- [ ] Rejected readings are marked for re-visit (D11)
- [ ] Can view reading history with reader info (D9)
- [ ] Can search meters by ID/address (D13)
- [ ] Can view reader notes on readings (D14)
- [ ] RLS re-enabled with proper user linking

#### Known Blockers

| ID | Blocker | Impact | Resolution | Status | Notes |
|----|---------|--------|------------|--------|-------|
| B1 | RLS disabled (mock data not linked to auth users) | High | Update mock data to link to auth users, then re-enable RLS | ⏳ Pending | Still needs RLS re-enable |
| B2 | No `readers` table schema | High | Create migration for readers table | ✅ **Resolved** | Migration 003 complete |
| B3 | Reading status workflow not defined | Medium | Define status enum: pending → approved/rejected → certified | ✅ **Resolved** | Added to migration 003 |
| B4 | Mock data assumes managers submit readings | Medium | Seed reader submissions instead | ✅ **Resolved** | Mock generator updated |
| B5 | Schema missing notes column | Low | Add migration: `ALTER TABLE readings ADD COLUMN notes TEXT` | ✅ **Resolved** | Included in migration 003 |
| B6 | No cycle/city status tracking | Medium | Add `cities` and `cycles` tables | ✅ **Resolved** | Included in migration 003 |

#### Blocker Resolution Summary (2026-04-05)

✅ **B2, B3, B5, B6** - Resolved via `migrations/003_complete_schema.sql`
✅ **B4** - Resolved via updated `scripts/generate-mock-data.js`
⏳ **B1** - RLS still disabled for development; will re-enable after frontend workflow complete

#### Schema Updates (2026-04-05)

✅ **Migration 004:** `migrations/004_route_assignment_progress.sql`
- Added `meters_total` column to `route_assignments`
- Added `meters_read` column to `route_assignments`
- Added `meters_pending` column to `route_assignments`
- Created trigger `trg_update_assignment_progress` for auto-updating counters
- Populated existing assignments with initial values

**Purpose:** Enable real-time route progress tracking for managers (L3-05, D19)

**Next Action:** Re-enable RLS policies once Sprint 2 frontend is complete and tested.

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

### 2026-04-05 (v0.3.1 - Manager Workflow Gaps Identified)
- ✅ **Manager workflow analysis completed** (guide/manager_workflow_walkthrough/MANAGER-WORKFLOWS.md)
- ✅ **Gap analysis document created** (guide/manager_workflow_walkthrough/GAP-ANALYSIS.md)
- ✅ **7 critical gaps identified** from manager's daily workflow
- ✅ **HANDOFF-09 created** - Critical Workflow Gaps (City/Routes/Meters hierarchy, exception detection, reading edit, usage history, reread queue)
- ✅ **HANDOFF-10 created** - Reader Performance Reports (Reader Totals & Tardiness)
- ✅ **Legacy coverage updated** - Now tracking City > Routes > Meters hierarchy requirement
- 🔄 **Sprint 2 completion** - 87.5% complete (7/8 handoffs done, awaiting HANDOFF-07)
- 📋 **Sprint 3 replanning needed** - New critical gaps take priority over offline sync

**Key Changes from Manager Feedback:**
- ❌ **Zip code grouping removed** - Manager uses City > Routes > Meters hierarchy (no zip code categorization)
- 🔴 **Exception-based photo queue** - Only 3.4% of readings need review (unusually high/low), not all pending
- 🔴 **Reading edit capability** - Manager must correct typos inline without rejecting
- 🔴 **Usage history in review** - Required for informed approval decisions
- 🟠 **Reread queue** - Separate queue for rejected readings
- 🟠 **Reader performance reports** - Manager explicitly uses daily (previously marked "removed")

**New Deliverables Added:**
- D22: City/Route Hierarchy (GAP-01) - Sprint 3 Priority 1
- D23: Exception Detection (GAP-02) - Sprint 3 Priority 1
- D24: Reading Edit Workflow (GAP-03) - Sprint 3 Priority 1
- D25: Usage History in Review (GAP-04) - Sprint 3 Priority 1
- D26: Reread Queue (GAP-05) - Sprint 3 Priority 2
- D27: Reader Totals Report (GAP-06) - Sprint 3 Priority 2
- D28: Reader Tardiness Report (GAP-06) - Sprint 3 Priority 2

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
