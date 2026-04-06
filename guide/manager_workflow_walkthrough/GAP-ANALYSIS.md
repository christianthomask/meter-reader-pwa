# Manager Workflow Gap Analysis

**Date:** April 5, 2026  
**Source:** `guide/manager_workflow_walkthrough/MANAGER-WORKFLOWS.md`  
**Analyst:** Project Sprint Manager  
**Version:** 0.3.0 (Manager Portal)

---

## Executive Summary

After reviewing the manager's detailed workflow walkthrough from the legacy Alexander's RouteManager system, I've identified **7 critical gaps** between their daily operational needs and our current POC implementation.

**Overall Coverage:** ~60% of daily workflow features  
**Critical Gaps:** 3 items blocking core workflow  
**High Priority Gaps:** 4 items impacting usability

---

## Manager's 7-Step Workflow (Legacy System)

### STEP 1: City Selection
**What they do:** Select a city from the homepage (e.g., "Grover Beach")  
**Legacy UI:** Homepage with cities grouped by status (Ready to Download, Active, Read Pending, Complete)

### STEP 2: Navigate to Route Manager
**What they do:** Click the "Route Manager" icon to access route assignment  
**Legacy UI:** City dashboard with navigation icons

### STEP 3: Route Assignment
**What they do:** 
- See list of readers (green section)
- Select a reader → they move to yellow section (assigned readers)
- Select route from orange section (checkboxes)
- Assign reader to route

**Key UX:** Two-panel interface with readers on top, routes below

### STEP 4: Access Photo Approval Queue
**What they do:** 
- Return to city homepage
- See "71 to Review" count (meters with unusual readings requiring photos)
- Click on the number to see approval queue

**Key Insight:** Photos are specifically for **exception readings** (unusually high/low), not all readings

### STEP 5: Review & Approve/Reject
**What they do:**
- See all 71 meters requiring approval in order
- View usage history from previous months (bottom)
- See info box on right side
- Choose "Reread" or "Approve"
- **Can edit the reading value** (e.g., change "760" in text box) if it doesn't match photo
- Approve → passes to city for review
- Reread → goes to "4 to Reread" queue

**Critical Features:**
- Usage history visible during review
- **Edit reading value inline**
- One-at-a-time sequential review
- Info box with meter details

### STEP 6: Reread Queue Management
**What they do:**
- See "4 to Reread" count on city homepage
- Click to see list of meters needing re-reads
- Select one → opens photo approval page
- Can assign to reader for recheck OR assign to self

**Key Feature:** Separate queue for rejected readings

### STEP 7: Reporting & Analytics
**What they use:**
1. **Reader Totals** (green): List of readers, how much they've read, which route
2. **Reader Tardiness** (red): List of readers with stop times >10 minutes, timestamps

**Note:** Manager says "I only really use these two" - focuses on productivity monitoring

---

## Gap Analysis: Legacy vs. Current POC

### 🔴 CRITICAL GAPS (Blocking Core Workflow)

#### GAP-01: No City/Multi-City Selection
**Legacy:** Manager can select between multiple cities (Grover Beach, etc.)  
**Current POC:** Single city/context only - no city selector  
**Impact:** Manager cannot use app if they manage multiple cities  
**User Story Impact:** US-19.1 (Cycle Status) - needs city context  
**Priority:** 🔴 Critical  
**Effort:** 3-4 hours

**Required Changes:**
- Add `cities` table relationship to user profile
- City selector on dashboard header
- Filter all data by selected city
- Show city status (Active, Read Pending, Complete)

---

#### GAP-02: No Exception-Based Photo Queue
**Legacy:** Only meters with **unusually high/low readings** require photos (71 of 2068 meters = 3.4%)  
**Current POC:** Photo queue shows ALL pending readings  
**Impact:** Manager overwhelmed with normal readings, cannot focus on exceptions  
**User Story Impact:** US-11.1 (Photo Review Queue) - missing exception filtering  
**Priority:** 🔴 Critical  
**Effort:** 2-3 hours

**Required Changes:**
- Add exception detection logic (40% delta threshold, zero readings, negative readings)
- Add `is_exception` flag to readings table or compute in query
- Filter Photo Review queue to show only exceptions by default
- Add toggle to show "All Readings" vs "Exceptions Only"
- Display exception count in dashboard header (like "71 to Review")

---

#### GAP-03: Cannot Edit Reading Value During Review
**Legacy:** Manager can edit the reading value inline if it doesn't match photo  
**Current POC:** No edit capability - can only approve or reject  
**Impact:** Manager must reject readings that could be quickly corrected, increasing reader workload  
**User Story Impact:** US-11.2 (Approve Reading) - missing edit capability  
**Priority:** 🔴 Critical  
**Effort:** 2-3 hours

**Required Changes:**
- Add reading value input field in ApproveRejectButtons or PhotoDetailModal
- Allow manager to update reading value before approving
- Add audit trail: `edited_by`, `edited_at`, `original_value`
- Validation: prevent extreme changes without comment

---

### 🟠 HIGH PRIORITY GAPS (Impact Usability)

#### GAP-04: No Usage History in Review Workflow
**Legacy:** Usage history from previous months shown at bottom of review screen  
**Current POC:** Reading history exists in separate modal, not integrated into review  
**Impact:** Manager cannot make informed approval decisions without context  
**User Story Impact:** US-11.4 (View Reading Details) - partially covered but not in context  
**Priority:** 🟠 High  
**Effort:** 3-4 hours

**Required Changes:**
- Add usage history chart/table to PhotoDetailModal
- Show last 3-6 readings for the meter
- Display average consumption, delta from previous
- Visual indicator if current reading is abnormal

---

#### GAP-05: No Separate "Reread" Queue
**Legacy:** Rejected readings go to separate "4 to Reread" queue  
**Current POC:** Rejected readings just have `status='rejected'` - no dedicated queue view  
**Impact:** Manager cannot easily track which readings need re-visits  
**User Story Impact:** US-11.3 (Reject Reading) - partially covered  
**Priority:** 🟠 High  
**Effort:** 2 hours

**Required Changes:**
- Add "Rereads" tab or filter on dashboard
- Show count of rejected readings pending re-visit
- Allow assignment of rereads to readers (or self)
- Track reread completion

---

#### GAP-06: No Reader Productivity Reports
**Legacy:** 
- Reader Totals: readings per reader, route assignment
- Reader Tardiness: stops >10 minutes with timestamps  
**Current POC:** No reader performance analytics  
**Impact:** Manager cannot monitor team productivity  
**User Story Impact:** Not in current sprint plan (was marked "removed")  
**Priority:** 🟠 High (per manager: "I only really use these two")  
**Effort:** 6-8 hours

**Required Changes:**
- Create Reader Totals report page
  - Table: Reader name, route, readings count, completion %
- Create Reader Tardiness report (requires GPS timestamp tracking)
  - Query readings with >10 min gaps between submissions
  - Show reader name, route, stop time, duration
- Add to dashboard navigation

**Note:** This was previously marked as "Reader Performance - Removed" but manager explicitly states it's critical to their workflow. **Recommendation: Re-prioritize to Sprint 3.**

---

#### GAP-07: No Info Box / Meter Details in Review
**Legacy:** Info box on right side shows meter details during review  
**Current POC:** Basic meter info (number, address) shown, but not comprehensive  
**Impact:** Manager lacks context during review  
**Priority:** 🟠 Medium  
**Effort:** 1-2 hours

**Required Changes:**
- Enhance PhotoDetailModal with more meter info
- Show: meter type, account number, GPS coordinates, previous reading date
- Add map view for GPS verification (already planned in Sprint 3)

---

## Coverage Summary

| Workflow Step | Legacy Feature | POC Coverage | Gap Severity |
|---------------|----------------|--------------|--------------|
| **Step 1: City Selection** | Multi-city selector | ❌ Not covered | 🔴 Critical |
| **Step 2: Navigation** | Route Manager icon | ⚠️ Partial (tabs exist) | 🟢 Low |
| **Step 3: Route Assignment** | Assign readers to routes | ✅ Covered | ✅ Complete |
| **Step 4: Photo Queue Access** | Exception count display | ❌ Not covered | 🔴 Critical |
| **Step 5: Review & Approve** | Approve/Reject with edit | ⚠️ Partial (no edit) | 🔴 Critical |
| **Step 5: Review Context** | Usage history visible | ⚠️ Partial (separate modal) | 🟠 High |
| **Step 6: Reread Queue** | Separate reread queue | ❌ Not covered | 🟠 High |
| **Step 7: Reports** | Reader totals & tardiness | ❌ Not covered | 🟠 High |

---

## Recommendations

### Immediate (Before Sprint 3)

1. **Add Reading Edit Capability** (GAP-03) - 2-3h
   - Modify `ApproveRejectButtons.tsx` or `RejectionReasonModal.tsx`
   - Add input field for reading value
   - Update Supabase query to allow value update on approve

2. **Implement Exception Detection** (GAP-02) - 2-3h
   - Add computed `is_exception` flag based on:
     - Delta > 40% from previous reading
     - Zero reading
     - Negative delta
   - Filter PhotoReview to show exceptions by default
   - Add exception count to dashboard header

3. **Add Usage History to Review Modal** (GAP-04) - 3-4h
   - Query last 6 readings for meter in PhotoDetailModal
   - Display as table or simple chart
   - Show average, delta, abnormal indicator

### Sprint 3 Planning (Re-prioritize)

4. **Add City/Multi-City Support** (GAP-01) - 3-4h
   - Schema: link users to multiple cities
   - City selector in header
   - Filter all queries by city

5. **Create Reread Queue** (GAP-05) - 2h
   - Add "Rereads" tab or filter
   - Show rejected readings pending action
   - Allow assignment to readers

6. **Re-add Reader Performance Reports** (GAP-06) - 6-8h
   - **Move from "removed" to Sprint 3 priority**
   - Reader Totals report
   - Reader Tardiness report (requires GPS timestamp analysis)

### Phase 2 (Future)

7. **Enhanced Meter Info Box** (GAP-07) - 1-2h
   - Add to PhotoDetailModal
   - Can wait until after critical gaps addressed

---

## Updated Sprint 3 Backlog (Recommended)

### Priority 1 - Critical Workflow Gaps
- [ ] **GAP-03:** Edit reading value during review (2-3h)
- [ ] **GAP-02:** Exception-based photo queue (2-3h)
- [ ] **GAP-04:** Usage history in review modal (3-4h)

### Priority 2 - High Priority Gaps
- [ ] **GAP-01:** City/multi-city selection (3-4h)
- [ ] **GAP-05:** Reread queue management (2h)
- [ ] **GAP-06:** Reader performance reports (6-8h) ← **Previously removed, now re-added**

### Priority 3 - Planned Sprint 3 Features
- [ ] **D10:** Offline sync framework (16h)
- [ ] **D16:** Enhanced photo review (side-by-side) (4h)
- [ ] **D17:** GPS verification map (6h)
- [ ] **D18:** CSV export (2h)

**Total Revised Sprint 3 Effort:** ~48-52 hours (was ~32 hours)

---

## Questions for Product Owner (CTK)

1. **City Support:** Is multi-city support required for the POC demo, or can we assume single-city for now?

2. **Exception Threshold:** The legacy system flags "unusually high or low" readings. Should we use:
   - 40% delta from previous reading (already in mockup)?
   - Different threshold?
   - Additional rules (zero readings, negative delta)?

3. **Reading Edit Workflow:** When a manager edits a reading value:
   - Should it auto-approve after edit?
   - Or require explicit approve after edit?
   - Should the reader be notified of the edit?

4. **Reader Tardiness Report:** This requires tracking time gaps between reading submissions. Do we have GPS timestamp data in the readings, or do we need to add it?

5. **Sprint 3 Scope:** With these new gaps identified, should we:
   - Extend Sprint 3 timeline?
   - Defer offline sync (D10) to Sprint 4?
   - Focus only on workflow gaps first?

---

## Next Steps

1. **Review this analysis** with stakeholder (manager who provided workflow)
2. **Prioritize gaps** - confirm which are must-have vs. nice-to-have
3. **Update Sprint 3 plan** based on decisions
4. **Create user stories** for new gaps (GAP-01 through GAP-07)
5. **Estimate effort** and adjust sprint capacity

---

**Prepared By:** Project Sprint Manager  
**Date:** April 5, 2026  
**Status:** Awaiting Product Owner Review
