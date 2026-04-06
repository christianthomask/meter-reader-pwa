# Sprint 3 - User Stories (Critical Workflow Gaps)

**Sprint Goal:** Implement City > Routes > Meters hierarchy and critical workflow fixes identified from manager's daily workflow analysis  
**Duration:** 2 weeks (extended from original plan)  
**Priority:** 🔴 Critical - Blocking core manager workflow  
**Total Stories:** 7 new user stories (GAP-01 through GAP-06)

---

## Background

On April 5, 2026, a manager provided detailed documentation of their daily workflow using the legacy Alexander's RouteManager system. Analysis revealed **7 critical gaps** between their operational needs and our current POC implementation.

**Key Insight:** Legacy system uses **City > Routes > Meters** hierarchy, not zip code grouping. Manager only reviews **exception readings** (3.4% of submissions), not all pending readings.

**Reference:** `guide/manager_workflow_walkthrough/MANAGER-WORKFLOWS.md`

---

## Epic: Critical Workflow Gaps (GAP-01 through GAP-06)

### US-22.1: Select City from Dashboard

**As a** Manager  
**I want** to select which city I'm working with from a dropdown  
**So that** I can see routes and meters for that specific city

**Acceptance Criteria:**

```gherkin
Given I am logged in and have access to multiple cities
When I view the dashboard header
Then I see a city selector dropdown with my available cities

Given I select "Grover Beach" from the dropdown
When the page reloads
Then I see only routes for Grover Beach

Given I have access to 3 cities
When I check the database
Then I see records in manager_cities linking my user to those cities

Given I select a different city
When the page updates
Then all data (routes, meters, readings) reflects the selected city
```

**Priority:** 🔴 Critical  
**Estimate:** 3 points  
**Dependencies:** D22 (City/Route hierarchy schema)  
**Legacy Mapping:** L1-01 (City Cycle Status Display)

---

### US-22.2: View Routes Grouped by Named Routes (Not Zip Codes)

**As a** Manager  
**I want** to see routes with meaningful names (North, South, Route A1)  
**So that** I can identify routes the way the city does

**Acceptance Criteria:**

```gherkin
Given I select a city with 5 routes
When I view the dashboard
Then I see routes named "North", "South", "Route A1", etc. (not zip codes)

Given a route has 15 meters
When I view the route card
Then I see "15 meters" and the route name

Given I click on a route card
When the route detail page opens
Then I see all 15 meters in that route
```

**Priority:** 🔴 Critical  
**Estimate:** 2 points  
**Dependencies:** US-22.1, D22  
**Legacy Mapping:** L3-05 (View Assignment List)

---

### US-23.1: View Exception Readings Queue (Default Filter)

**As a** Manager  
**I want** to see only exception readings in the Photo Review queue by default  
**So that** I can focus on the 3.4% of readings that need my attention

**Acceptance Criteria:**

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

**Priority:** 🔴 Critical  
**Estimate:** 3 points  
**Dependencies:** D23 (Exception detection schema + trigger)  
**Legacy Mapping:** L2-07 (Meter Exception Queue)

---

### US-23.2: Auto-Detect Exception Readings

**As a** Manager  
**I want** the system to automatically flag exception readings  
**So that** I don't have to manually identify unusual readings

**Acceptance Criteria:**

```gherkin
Given a reading is submitted with >40% delta from previous reading
When the reading saves to the database
Then is_exception flag is automatically set to TRUE

Given a reading is submitted with value = 0
When the reading saves
Then is_exception flag is set to TRUE

Given a reading is submitted with negative delta (lower than previous)
When the reading saves
Then is_exception flag is set to TRUE

Given a reading is within normal range (<40% delta)
When the reading saves
Then is_exception flag is set to FALSE
```

**Priority:** 🔴 Critical  
**Estimate:** 2 points  
**Dependencies:** D23 (Database trigger function)  
**Legacy Mapping:** L2-01, L2-02 (Exception approval/rejection)

---

### US-24.1: Edit Reading Value During Review

**As a** Manager  
**I want** to edit the reading value if it doesn't match the photo  
**So that** I can correct typos without rejecting the reading

**Acceptance Criteria:**

```gherkin
Given I am reviewing a reading with value "760"
When I click the edit icon
Then the value becomes editable in an input field

Given I change the value to "670"
When I click "Approve"
Then the reading is updated with value="670"
And original_value="760" is saved to the database
And edited_by=my_user_id is saved

Given I edited a reading
When I check the database
Then I see the audit trail (original_value, edited_by, edited_at)

Given I want to approve without editing
When I click "Approve"
Then the reading is approved with the original value
```

**Priority:** 🔴 Critical  
**Estimate:** 3 points  
**Dependencies:** D24 (Reading edit columns in schema)  
**Legacy Mapping:** Step 5 of manager workflow (edit read inline)

---

### US-25.1: View Usage History in Photo Review Modal

**As a** Manager  
**I want** to see the last 6 readings for a meter while reviewing  
**So that** I can make informed approval decisions

**Acceptance Criteria:**

```gherkin
Given I am reviewing a meter reading
When I open the photo detail modal
Then I see the last 6 readings for this meter

Given the meter has historical readings
When I view the history
Then I see date, value, and delta from previous for each reading

Given the current reading is significantly higher than average
When I view the history
Then I see a visual indicator (red text or icon) highlighting the anomaly

Given the meter has no historical readings
When I view the history section
Then I see "No previous readings" message
```

**Priority:** 🟠 High  
**Estimate:** 3 points  
**Dependencies:** D25 (Usage history query)  
**Legacy Mapping:** Step 5 (usage history from previous months on bottom)

---

### US-26.1: View Reread Queue (Rejected Readings)

**As a** Manager  
**I want** to see a separate queue for rejected readings  
**So that** I can track which readings need re-visits

**Acceptance Criteria:**

```gherkin
Given there are 4 rejected readings pending reread
When I view the dashboard
Then I see a "Rereads" tab or filter with count "4"

Given I click the "Rereads" tab
When the page loads
Then I see only readings with status='rejected' and needs_reread=true

Given a rejected reading has been reassigned to a reader
When I view the reread queue
Then I see the assigned reader's name

Given all rereads are completed
When I view the reread tab
Then I see "No pending rereads" message
```

**Priority:** 🟠 High  
**Estimate:** 2 points  
**Dependencies:** D26 (Reread queue columns + view)  
**Legacy Mapping:** Step 6 ("4 to Reread" queue)

---

### US-27.1: View Reader Totals Report

**As a** Manager  
**I want** to see a report of each reader's productivity  
**So that** I can monitor team performance

**Acceptance Criteria:**

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

Given I want to export the data
When I click "Export CSV"
Then I download a CSV with all reader totals
```

**Priority:** 🟠 High  
**Estimate:** 4 points  
**Dependencies:** D27 (Reader totals view in database)  
**Legacy Mapping:** Step 7 (Reader totals - "I only really use this")

---

### US-28.1: View Reader Tardiness Report

**As a** Manager  
**I want** to see readers with gaps >10 minutes between readings  
**So that** I can identify productivity issues

**Acceptance Criteria:**

```gherkin
Given a reader submitted readings at 10:00 AM, 10:05 AM, 10:35 AM, 10:40 AM
When I view the tardiness report
Then I see one incident:
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

**Priority:** 🟠 High  
**Estimate:** 4 points  
**Dependencies:** D28 (Reader tardiness view in database)  
**Legacy Mapping:** Step 7 (Reader tardiness - "I only really use this")

---

## Story Point Summary

| Epic | Story ID | Title | Points | Priority |
|------|----------|-------|--------|----------|
| City/Route Hierarchy | US-22.1 | Select City from Dashboard | 3 | 🔴 Critical |
| City/Route Hierarchy | US-22.2 | Named Routes (Not Zip) | 2 | 🔴 Critical |
| Exception Detection | US-23.1 | Exception Queue Filter | 3 | 🔴 Critical |
| Exception Detection | US-23.2 | Auto-Detect Exceptions | 2 | 🔴 Critical |
| Reading Edit | US-24.1 | Edit Reading Value | 3 | 🔴 Critical |
| Usage History | US-25.1 | Usage History in Review | 3 | 🟠 High |
| Reread Queue | US-26.1 | Reread Queue View | 2 | 🟠 High |
| Reader Reports | US-27.1 | Reader Totals Report | 4 | 🟠 High |
| Reader Reports | US-28.1 | Reader Tardiness Report | 4 | 🟠 High |
| **TOTAL** | | | **26 points** | |

---

## Sprint Capacity Planning

- **Team Velocity:** 20-25 points per 2-week sprint (1 developer)
- **Sprint 3 Capacity:** 26 points (critical gaps only)
- **Carry to Sprint 4:** Offline sync (D10), enhanced photo review (D16), GPS map (D17), CSV export (D18)

---

## Implementation Order (Recommended)

### Phase 1: Foundation (Days 1-3)
1. **US-22.1, US-22.2** - City/Route hierarchy schema + UI
2. **US-23.2** - Exception detection trigger

### Phase 2: Core Workflow (Days 4-7)
3. **US-23.1** - Exception queue filter
4. **US-24.1** - Reading edit workflow
5. **US-25.1** - Usage history in review

### Phase 3: Queue Management (Days 8-9)
6. **US-26.1** - Reread queue

### Phase 4: Reports (Days 10-14)
7. **US-27.1** - Reader Totals Report
8. **US-28.1** - Reader Tardiness Report

---

## Acceptance Testing Plan

### Test Data Requirements
- Create 3 cities (Grover Beach, Bellaire, Corona)
- Create 5 routes per city (North, South, Route A1, etc.)
- Create 15-20 meters per route
- Create 100+ readings with various deltas (some >40%, some zero, some negative)
- Create readings with timestamps that produce >10 min gaps

### Test Scenarios
1. **City Selection:** Switch between cities, verify routes update
2. **Exception Detection:** Submit readings with various deltas, verify auto-flagging
3. **Photo Review:** Filter exceptions, toggle to all readings
4. **Reading Edit:** Edit value, approve, verify audit trail
5. **Usage History:** Open modal, verify last 6 readings display
6. **Reread Queue:** Reject reading, verify appears in reread tab
7. **Reader Reports:** Verify totals accuracy, tardiness detection

---

## Definition of Done (Sprint 3)

- [ ] All 9 user stories implemented and tested
- [ ] Database migration (cities, routes, exception detection) runs successfully
- [ ] All acceptance criteria pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Mobile responsive (city selector, reports)
- [ ] RLS policies updated for new tables
- [ ] Existing data migrated (zip codes → routes)
- [ ] Manager workflow validated with stakeholder

---

**Ready for development.** Start with HANDOFF-09 (GAP-01 through GAP-05), then HANDOFF-10 (GAP-06 reports).

— Sprint Manager 🚀
