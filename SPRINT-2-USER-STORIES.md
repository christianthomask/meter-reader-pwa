# Sprint 2 - User Stories

**Sprint Goal:** Manager can assign routes to readers, review submitted readings, and approve/reject exceptions

**Duration:** 2 weeks  
**Priority:** 🔴 Critical workflow implementation

---

## 📖 What Are User Stories?

**User stories** are short, simple descriptions of a feature told from the perspective of the person who desires the new capability. They follow a standard format:

```
As a [type of user],
I want [some feature],
So that [some benefit/value].
```

### Why We Use User Stories

1. **User-Centric:** Forces us to think from the user's perspective, not technical specs
2. **Clear Value:** Every story explains WHY we're building something
3. **Testable:** Acceptance criteria define when the story is "done"
4. **Estimable:** Team can size the effort required
5. **Negotiable:** Details can be discussed and refined

### Anatomy of a Good User Story

```markdown
**Story ID:** US-001
**Title:** Create New Reader Account
**As a** Manager
**I want** to create a new reader account
**So that** I can assign routes to my field team

**Acceptance Criteria:**
Given I am on the Readers page
When I click "Add Reader" and fill in required fields
Then a new reader is created and appears in the list

Given the reader email already exists
When I try to create the account
Then I see an error message "Email already registered"

**Priority:** High  
**Estimate:** 3 points  
**Dependencies:** None
```

---

## Sprint 2 User Stories

### Epic 1: Reader Management (D12)

---

#### US-12.1: View Readers List

**As a** Manager  
**I want** to see a list of all my readers  
**So that** I can know who is on my team and their contact information

**Acceptance Criteria:**

```gherkin
Given I am logged in as a manager
When I navigate to the Readers page
Then I see a table with columns: Name, Email, Phone, Status, Assigned Routes

Given I have 10 readers in the database
When I view the readers list
Then I see all 10 readers displayed

Given a reader is inactive
When I view the list
Then I see a status badge showing "Inactive"
```

**Priority:** 🔴 High  
**Estimate:** 2 points  
**Dependencies:** D12 (readers table exists)

---

#### US-12.2: Add New Reader

**As a** Manager  
**I want** to add a new reader to my team  
**So that** I can expand my field workforce

**Acceptance Criteria:**

```gherkin
Given I am on the Readers page
When I click "Add Reader" button
Then a modal opens with form fields: Full Name, Email, Phone

Given I have filled in all required fields
When I click "Save"
Then the reader is created and appears in the list

Given I enter an email that already exists
When I try to save
Then I see an error: "A reader with this email already exists"

Given I created a new reader
When I check the database
Then the reader has active=true and assigned_routes_count=0
```

**Priority:** 🔴 High  
**Estimate:** 3 points  
**Dependencies:** US-12.1

---

#### US-12.3: Edit Reader Details

**As a** Manager  
**I want** to edit a reader's contact information  
**So that** I can keep their details up to date

**Acceptance Criteria:**

```gherkin
Given I am viewing the readers list
When I click "Edit" on a reader row
Then a modal opens with the reader's current information

Given I have updated the phone number
When I click "Save"
Then the changes are persisted and visible in the list

Given I change a reader's status to Inactive
When I save
Then the reader cannot be assigned to new routes
```

**Priority:** 🟠 Medium  
**Estimate:** 2 points  
**Dependencies:** US-12.1

---

#### US-12.4: Deactivate Reader

**As a** Manager  
**I want** to deactivate a reader  
**So that** they cannot be assigned to new routes

**Acceptance Criteria:**

```gherkin
Given I have a reader who left the company
When I deactivate the reader
Then their status changes to "Inactive"

Given a reader is inactive
When I try to assign them a route
Then I see a warning: "Cannot assign inactive reader"

Given a reader has completed readings
When I deactivate them
Then their historical readings remain in the system
```

**Priority:** 🟠 Medium  
**Estimate:** 1 point  
**Dependencies:** US-12.1

---

### Epic 2: Route Assignment (D8)

---

#### US-8.1: Assign Route to Reader

**As a** Manager  
**I want** to assign a route to a reader  
**So that** they know which meters to read

**Acceptance Criteria:**

```gherkin
Given I am on the Dashboard (Routes tab)
When I click "Assign" on a route card
Then a modal opens with a dropdown of available readers

Given I select a reader and click "Assign"
When the assignment saves
Then the route card shows the reader's name

Given I assign a route
When I check the database
Then a record exists in route_assignments with status='assigned'
```

**Priority:** 🔴 Critical  
**Estimate:** 3 points  
**Dependencies:** D12 (readers list exists)

---

#### US-8.2: View Route Assignments

**As a** Manager  
**I want** to see which reader has which route  
**So that** I can track who is working where

**Acceptance Criteria:**

```gherkin
Given routes are assigned to readers
When I view the dashboard
Then each route card displays the assigned reader's name

Given a route has no assignment
When I view the dashboard
Then the route shows "Unassigned" badge

Given I hover over a reader name
When the route card displays
Then I see a tooltip with reader contact info
```

**Priority:** 🔴 Critical  
**Estimate:** 2 points  
**Dependencies:** US-8.1

---

#### US-8.3: Reassign Route

**As a** Manager  
**I want** to reassign a route from one reader to another  
**So that** I can adjust to changing availability

**Acceptance Criteria:**

```gherkin
Given a route is assigned to Reader A
When I click "Reassign" and select Reader B
Then the route is transferred to Reader B

Given I reassign a route
When I check the database
Then the old assignment is marked cancelled and new one created

Given a route is in-progress
When I reassign it
Then I see a warning: "Route is in progress. Reassign anyway?"
```

**Priority:** 🟠 Medium  
**Estimate:** 3 points  
**Dependencies:** US-8.1

---

### Epic 3: Photo Review Workflow (D11)

---

#### US-11.1: View Pending Readings Queue

**As a** Manager  
**I want** to see all readings pending my review  
**So that** I can approve or reject them

**Acceptance Criteria:**

```gherkin
Given readers have submitted 50 readings
When I navigate to the Photos tab
Then I see a grid of readings with status='pending'

Given a reading has a photo
When I view the queue
Then I see a thumbnail of the photo

Given a reading has no photo
When I view the queue
Then I see a "No Photo" placeholder icon
```

**Priority:** 🔴 Critical  
**Estimate:** 3 points  
**Dependencies:** D12, D8 (readers and assignments exist)

---

#### US-11.2: Approve Reading

**As a** Manager  
**I want** to approve a submitted reading  
**So that** it moves to certified status

**Acceptance Criteria:**

```gherkin
Given I am reviewing a pending reading
When I click "Approve"
Then the reading status changes to 'approved'

Given I approve a reading
When I check the database
Then the reading is updated with approved timestamp

Given all meters in a route are approved
When the last reading is approved
Then the route assignment status changes to 'completed'
```

**Priority:** 🔴 Critical  
**Estimate:** 2 points  
**Dependencies:** US-11.1

---

#### US-11.3: Reject Reading (Request Re-read)

**As a** Manager  
**I want** to reject a reading and request a re-visit  
**So that** inaccurate readings can be corrected

**Acceptance Criteria:**

```gherkin
Given I am reviewing a suspicious reading
When I click "Reject"
Then a modal opens asking for rejection reason

Given I select a reason and confirm
When I submit
Then the reading status changes to 'rejected'

Given a reading is rejected
When the reader views their assignments
Then they see this meter flagged for re-visit
```

**Priority:** 🔴 Critical  
**Estimate:** 3 points  
**Dependencies:** US-11.1

---

#### US-11.4: View Reading Details

**As a** Manager  
**I want** to see full details of a reading  
**So that** I can make an informed approval decision

**Acceptance Criteria:**

```gherkin
Given I am in the review queue
When I click on a reading card
Then a modal opens showing:
  - Meter number and address
  - Reading value and date
  - Photo (zoomable)
  - GPS coordinates
  - Reader notes
  - Usage history (last 3 readings)

Given the reading has GPS coordinates
When I view the details
Then I see a map showing meter location vs. capture point
```

**Priority:** 🔴 Critical  
**Estimate:** 5 points  
**Dependencies:** US-11.1

---

#### US-11.5: Filter Review Queue

**As a** Manager  
**I want** to filter the review queue by route, reader, or date  
**So that** I can focus on specific subsets

**Acceptance Criteria:**

```gherkin
Given I have 500 pending readings
When I filter by Reader "John"
Then I see only John's submissions

Given I have readings from multiple routes
When I filter by Route "90210"
Then I see only readings from that zip code

Given readings span multiple months
When I set date range to "Last 7 days"
Then I see only recent submissions
```

**Priority:** 🟠 High  
**Estimate:** 3 points  
**Dependencies:** US-11.1

---

### Epic 4: Cycle/Status Management (D19)

---

#### US-19.1: Display Current Cycle Status

**As a** Manager  
**I want** to see the current reading cycle status  
**So that** I know where we are in the process

**Acceptance Criteria:**

```gherkin
Given I am on the dashboard
When I view the header
Then I see the cycle name (e.g., "Spring 2026")

Given the cycle is in progress
When I view the status
Then I see a badge: "Active"

Given the cycle is complete
When I view the status
Then I see a badge: "Complete"
```

**Priority:** 🔴 Critical  
**Estimate:** 2 points  
**Dependencies:** D19 (cycles table exists)

---

#### US-19.2: View Cycle Progress

**As a** Manager  
**I want** to see progress toward cycle completion  
**So that** I can track team performance

**Acceptance Criteria:**

```gherkin
Given the cycle has 1000 meters
When I view the progress bar
Then I see "X / 1000 meters complete (Y%)"

Given 300 readings are pending review
When I view the breakdown
Then I see: Approved: 500, Pending: 300, Rejected: 50

Given a route is fully approved
When I view route status
Then it shows a green checkmark
```

**Priority:** 🟠 High  
**Estimate:** 3 points  
**Dependencies:** US-19.1

---

#### US-19.3: Switch Between Cycles

**As a** Manager  
**I want** to switch between different cycles  
**So that** I can review historical data

**Acceptance Criteria:**

```gherkin
Given multiple cycles exist in the system
When I click the cycle selector dropdown
Then I see a list of available cycles

Given I select a different cycle
When the page reloads
Then all data reflects the selected cycle
```

**Priority:** 🟢 Medium  
**Estimate:** 3 points  
**Dependencies:** US-19.1

---

## 📊 Story Point Summary

| Epic | Stories | Total Points | Critical | High | Medium |
|------|---------|--------------|----------|------|--------|
| D12: Reader Management | 4 | 8 points | 2 | 0 | 2 |
| D8: Route Assignment | 3 | 8 points | 2 | 1 | 0 |
| D11: Photo Review | 5 | 16 points | 4 | 1 | 0 |
| D19: Cycle Management | 3 | 8 points | 1 | 1 | 1 |
| **TOTAL** | **15** | **40 points** | **9** | **3** | **3** |

### Sprint Capacity Planning

- **Team Velocity:** Assume 20-25 points per 2-week sprint (1 developer)
- **Sprint 2 Capacity:** 20 points (focus on critical stories first)
- **Carry to Sprint 3:** ~20 points (medium priority stories)

---

## 🎯 Sprint 2 Acceptance Criteria (Overall)

- [ ] ✅ US-12.1, US-12.2: Can view and create readers
- [ ] ✅ US-8.1, US-8.2: Can assign routes and see reader names
- [ ] ✅ US-11.1, US-11.2, US-11.3: Can review, approve, reject readings
- [ ] ✅ US-19.1, US-19.2: Can see cycle status and progress
- [ ] ✅ Database schema supports all workflows
- [ ] ✅ RLS policies tested and working

---

## 📝 Implementation Notes

### Database Queries (Supabase)

**Get manager's readers:**
```javascript
const { data } = await supabase
  .from('readers')
  .select('*')
  .eq('manager_id', userId)
  .eq('active', true);
```

**Get pending readings for review:**
```javascript
const { data } = await supabase
  .from('readings')
  .select(`
    *,
    meters (meter_number, address),
    readers (full_name, email)
  `)
  .eq('readers.manager_id', userId)
  .eq('status', 'pending');
```

**Assign route to reader:**
```javascript
const { data } = await supabase
  .from('route_assignments')
  .insert({
    route_id: routeId,
    reader_id: readerId,
    manager_id: userId,
    status: 'assigned'
  });
```

**Approve reading:**
```javascript
const { data } = await supabase
  .from('readings')
  .update({ 
    status: 'approved',
    approved_at: new Date().toISOString()
  })
  .eq('id', readingId);
```

---

**Next Steps:**
1. Review stories with product owner
2. Prioritize within sprint backlog
3. Break down into technical tasks
4. Estimate effort per task
5. Assign to sprint iterations
