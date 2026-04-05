# Sprint 2 - Development Handoffs

**Project:** Meter Reader PWA - Manager Portal  
**Sprint:** 2 - Core Workflow  
**Handoff System:** Sprint Manager → Lead Developer → Audit

---

## 🔄 Handoff Workflow

1. **Sprint Manager** creates handoff (this document)
2. **Lead Developer** implements and reports back
3. **Sprint Manager** audits implementation
4. **Repeat** for next handoff

### Handoff Status Legend

| Status | Meaning |
|--------|---------|
| 📋 Ready | Handoff ready to start |
| 🚧 In Progress | Developer working on it |
| 🔍 Awaiting Audit | Implementation complete, awaiting review |
| ✅ Approved | Audit passed, merged |
| ❌ Needs Work | Audit failed, revisions needed |

---

## HANDOFF-08: Route Detail View ⭐ **NEXT UP**

**Story:** US-8.2 - View Route Details & Meter List  
**Priority:** 🔴 Critical  
**Estimated Effort:** 4-5 hours  
**Status:** 📋 Ready

### Objective
Enable managers to tap a route and see all meters in that route with their reading status.

### Requirements
- [ ] Create `/routes/[zipCode]` page or modal view
- [ ] Display route header info (zip code, assigned reader, progress)
- [ ] List all meters in the route (15 meters typical)
- [ ] Show meter status: ✅ Read, ⏳ Pending, ❌ Not Read
- [ ] Display meter address, last reading date, reading value
- [ ] Click meter → view reading history (optional: modal or navigate)
- [ ] Filter meters by status (All / Read / Pending)
- [ ] Show route progress summary at top
- [ ] Back button to dashboard

### Acceptance Criteria (Must Pass)

```gherkin
Given I am on the dashboard
When I tap on Route 90210
Then I see a detail view with all 15 meters in that route

Given a meter has an approved reading
When I view the meter list
Then I see a green checkmark and the reading value

Given a meter has a pending reading
When I view the meter list
Then I see a yellow "Pending Review" badge

Given a meter has no recent reading
When I view the meter list
Then I see "Not Read" status

Given I tap on a meter
When the meter detail opens
Then I see reading history for that meter
```

### Technical Notes

**Database:**
- Query `meters` table filtered by `zip_code`
- JOIN with `readings` to get latest reading per meter
- Filter readings by `reader_id` (assigned reader)

**Supabase Query:**
```typescript
// Get meters for route
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

// Get route assignment
const { data: assignment } = await supabase
  .from('route_assignments')
  .select(`
    *,
    readers (full_name, email, phone)
  `)
  .eq('route_id', zipCode)
  .eq('manager_id', managerId)
  .single();
```

**RLS Policy:** 
- `meters_select_own` - managers see their own meters
- `readings_select_workflow` - managers see readings from their readers

**Components to Create:**
- `frontend/src/app/routes/[zipCode]/page.tsx` (or modal component)
- `frontend/src/app/components/MeterList.tsx`
- `frontend/src/app/components/MeterCard.tsx`
- `frontend/src/app/components/RouteHeader.tsx`

### Files to Create/Modify
- ✏️ Create: `frontend/src/app/routes/[zipCode]/page.tsx`
- ✏️ Create: `frontend/src/app/components/MeterList.tsx`
- ✏️ Create: `frontend/src/app/components/MeterCard.tsx`
- ✏️ Create: `frontend/src/app/components/RouteHeader.tsx`
- ✏️ Modify: `frontend/src/app/page.tsx` (dashboard - add click handler to route cards)

### Definition of Done
- [ ] All acceptance criteria pass
- [ ] Route header shows assigned reader + progress
- [ ] Meter list displays all 15 meters
- [ ] Status badges accurate (Read/Pending/Not Read)
- [ ] Click meter → shows reading history
- [ ] Filter by status works
- [ ] Back button returns to dashboard
- [ ] Mobile responsive (meter cards stack on small screens)
- [ ] No console errors

### Report Back With
1. ✅ List of files created/modified
2. 🚧 Any blockers (routing, data fetching, etc.)
3. ❓ Questions for clarification
4. 📸 Screenshot of route detail view

---

## HANDOFF-01: Readers List Page

**Story:** US-12.1 - View Readers List  
**Priority:** 🔴 Critical  
**Estimated Effort:** 2-3 hours  
**Status:** ✅ Approved

### Objective
Create a Readers management page that displays all readers assigned to the logged-in manager.

### Requirements
- [ ] Create `/readers` page route
- [ ] Fetch readers from Supabase (`readers` table where `manager_id = auth.uid()`)
- [ ] Display readers in a table with columns: Name, Email, Phone, Status, Actions
- [ ] Show active/inactive status badge
- [ ] Handle loading state
- [ ] Handle empty state (no readers yet)
- [ ] Add "Add Reader" button (opens modal - Handoff-02)

### Acceptance Criteria (Must Pass)

```gherkin
Given I am logged in as a manager with 5 readers
When I navigate to /readers
Then I see a table with 5 rows showing all my readers

Given I have no readers
When I navigate to /readers
Then I see an empty state message: "No readers yet. Click 'Add Reader' to get started."

Given the page is loading
When I navigate to /readers
Then I see a loading skeleton or spinner

Given a reader has active=false
When I view the list
Then I see a gray "Inactive" badge next to their name
```

### Technical Notes

**Database:**
- Table: `public.readers`
- Columns: `id`, `full_name`, `email`, `phone`, `active`, `created_at`

**Supabase Query:**
```typescript
const { data: readers, error } = await supabase
  .from('readers')
  .select('*')
  .eq('manager_id', user.id)
  .order('created_at', { ascending: false });
```

**Components to Create:**
- `frontend/src/app/readers/page.tsx` (main page)
- `frontend/src/app/readers/ReadersTable.tsx` (table component)
- `frontend/src/app/readers/EmptyState.tsx` (empty state component)

### Files to Create/Modify
- ✏️ Create: `frontend/src/app/readers/page.tsx`
- ✏️ Create: `frontend/src/app/readers/ReadersTable.tsx`
- ✏️ Create: `frontend/src/app/readers/EmptyState.tsx`
- ✏️ Modify: `frontend/src/app/layout.tsx` (add navigation link if needed)

### Definition of Done
- [ ] All acceptance criteria pass
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Mobile responsive (table scrolls horizontally if needed)
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Code has comments explaining Supabase queries

### Report Back With
1. ✅ List of files created/modified
2. 🚧 Any blockers encountered (RLS, types, etc.)
3. ❓ Questions for clarification
4. 📸 Screenshot of the readers page (optional but helpful)

---

## HANDOFF-02: Add Reader Modal

**Story:** US-12.2 - Add New Reader  
**Priority:** 🔴 Critical  
**Estimated Effort:** 3-4 hours  
**Status:** 📋 Ready (depends on HANDOFF-01)

### Objective
Create a modal form that allows managers to add new readers to their team.

### Requirements
- [ ] Create modal component (opens from Readers page)
- [ ] Form fields: Full Name (required), Email (required), Phone (optional)
- [ ] Email validation (format check)
- [ ] Submit button creates reader in Supabase
- [ ] Success toast on creation
- [ ] Error handling (duplicate email, network error)
- [ ] Modal closes on success, stays open on error
- [ ] Form resets after successful submission

### Acceptance Criteria (Must Pass)

```gherkin
Given I am on the Readers page
When I click "Add Reader"
Then a modal opens with a form containing Name, Email, Phone fields

Given I fill in Name and Email (valid format)
When I click "Save"
Then the reader is created and I see a success toast

Given I enter an email that already exists
When I click "Save"
Then I see an error: "A reader with this email already exists"

Given I enter an invalid email format (e.g., "test@")
When I try to submit
Then I see a validation error before the form submits

Given I created a reader successfully
When the modal closes
Then the new reader appears in the readers list
```

### Technical Notes

**Database:**
- Table: `public.readers`
- Insert columns: `manager_id`, `full_name`, `email`, `phone`, `active=true`

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('readers')
  .insert({
    manager_id: user.id,
    full_name: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    active: true
  })
  .select()
  .single();
```

**Components to Create:**
- `frontend/src/app/readers/AddReaderModal.tsx`
- Use existing UI components if available (Button, Input, Modal)

**Validation:**
- Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Name: required, min 2 characters
- Phone: optional, format loosely enforced

### Files to Create/Modify
- ✏️ Create: `frontend/src/app/readers/AddReaderModal.tsx`
- ✏️ Modify: `frontend/src/app/readers/page.tsx` (add modal trigger)

### Definition of Done
- [ ] All acceptance criteria pass
- [ ] Email validation works client-side
- [ ] Duplicate email error handled gracefully
- [ ] Success/error toasts implemented
- [ ] Modal closes on success
- [ ] Form resets after submission
- [ ] No console errors

### Report Back With
1. ✅ List of files created/modified
2. 🚧 Any blockers (form validation, modal UI, etc.)
3. ❓ Questions for clarification
4. 📸 Screenshot of modal (optional)

---

## HANDOFF-03: Edit Reader & Deactivate

**Story:** US-12.3, US-12.4 - Edit Reader Details & Deactivate  
**Priority:** 🟠 High  
**Estimated Effort:** 2-3 hours  
**Status:** 📋 Ready (depends on HANDOFF-01)

### Objective
Allow managers to edit reader details and toggle active/inactive status.

### Requirements
- [ ] Add "Edit" button to each row in ReadersTable
- [ ] Edit modal pre-populates with current reader data
- [ ] Can update: Name, Email, Phone
- [ ] Can toggle Active/Inactive status
- [ ] Save updates to Supabase
- [ ] Show confirmation before deactivating (warns about route assignments)
- [ ] Success toast on update

### Acceptance Criteria (Must Pass)

```gherkin
Given I click "Edit" on a reader row
When the modal opens
Then all fields are pre-filled with the reader's current data

Given I change the phone number
When I click "Save"
Then the changes persist and appear in the table

Given I toggle a reader to Inactive
When I confirm the warning
Then the reader's status updates to inactive

Given a reader is inactive
When I view the list
Then I see a gray "Inactive" badge
```

### Technical Notes

**Database:**
- Table: `public.readers`
- Update: `UPDATE readers SET full_name=?, email=?, phone=?, active=? WHERE id=?`

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('readers')
  .update({
    full_name: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    active: formData.active
  })
  .eq('id', readerId)
  .select()
  .single();
```

**Components:**
- Can reuse AddReaderModal with edit mode, or create `EditReaderModal.tsx`
- Add confirmation dialog for deactivation

### Files to Create/Modify
- ✏️ Create: `frontend/src/app/readers/EditReaderModal.tsx` (or modify AddReaderModal)
- ✏️ Modify: `frontend/src/app/readers/ReadersTable.tsx` (add Edit button)
- ✏️ Modify: `frontend/src/app/readers/page.tsx` (add modal state)

### Definition of Done
- [ ] All acceptance criteria pass
- [ ] Edit modal pre-populates correctly
- [ ] Deactivation warning shows
- [ ] Updates persist to database
- [ ] Table refreshes after edit
- [ ] No console errors

### Report Back With
1. ✅ List of files created/modified
2. 🚧 Any blockers
3. ❓ Questions for clarification

---

## HANDOFF-04: Route Assignment Modal

**Story:** US-8.1 - Assign Route to Reader  
**Priority:** 🔴 Critical  
**Estimated Effort:** 3-4 hours  
**Status:** 🔍 Awaiting Audit

### Objective
Enable managers to assign routes to readers from the dashboard.

### Requirements
- [ ] Add "Assign" button to route cards on dashboard
- [ ] Modal shows dropdown of active readers
- [ ] Select reader and confirm assignment
- [ ] Create record in `route_assignments` table
- [ ] Update route card to show assigned reader name
- [ ] Success toast on assignment

### Acceptance Criteria

```gherkin
Given I am on the dashboard
When I click "Assign" on an unassigned route
Then a modal opens with a reader dropdown

Given I select a reader and click "Assign"
When the assignment saves
Then the route card shows the reader's name

Given I assign a route
When I check the database
Then a record exists in route_assignments
```

### Technical Notes

**Database:**
- Table: `public.route_assignments`
- Columns: `route_id`, `reader_id`, `manager_id`, `status='assigned'`

**Supabase Query:**
```typescript
// Get active readers
const { data: readers } = await supabase
  .from('readers')
  .select('id, full_name, email')
  .eq('manager_id', user.id)
  .eq('active', true);

// Create assignment
const { error } = await supabase
  .from('route_assignments')
  .insert({
    route_id: routeId,
    reader_id: selectedReaderId,
    manager_id: user.id,
    status: 'assigned'
  });
```

### Files to Create/Modify
- ✏️ Create: `frontend/src/app/components/AssignRouteModal.tsx`
- ✏️ Modify: `frontend/src/app/page.tsx` (dashboard - add Assign button)

### Definition of Done
- [ ] All AC pass
- [ ] Reader dropdown shows only active readers
- [ ] Assignment persists to database
- [ ] Dashboard updates to show reader name
- [ ] No console errors

### Report Back With
1. ✅ Files created/modified
2. 🚧 Blockers
3. ❓ Questions

---

## HANDOFF-05: Photo Review Queue

**Story:** US-11.1 - View Pending Readings Queue  
**Priority:** 🔴 Critical  
**Estimated Effort:** 4-5 hours  
**Status:** 🔍 Awaiting Audit

### Objective
Create a queue of pending readings in the Photos tab for manager review.

### Requirements
- [ ] Photos tab queries readings with status='pending'
- [ ] Display as grid of cards (photo thumbnail, meter info, reader name)
- [ ] Click card opens detail modal (Handoff-06)
- [ ] Filter by reader, route, date range
- [ ] Show count of pending readings
- [ ] Handle empty state (no pending readings)

### Acceptance Criteria

```gherkin
Given there are 50 pending readings
When I navigate to Photos tab
Then I see a grid of 50 reading cards

Given a reading has a photo
When I view the card
Then I see a thumbnail of the photo

Given there are no pending readings
When I navigate to Photos tab
Then I see "All caught up! No pending readings."
```

### Technical Notes

**Database:**
- Table: `public.readings`
- Join: `meters` (meter_number, address), `readers` (full_name)

**Supabase Query:**
```typescript
const { data: readings } = await supabase
  .from('readings')
  .select(`
    *,
    meters (meter_number, address, city, zip_code),
    readers (full_name, email)
  `)
  .eq('status', 'pending')
  .in('readers.manager_id', user.id)
  .order('reading_timestamp', { ascending: false });
```

### Files to Create/Modify
- ✏️ Modify: `frontend/src/app/page.tsx` (Photos tab)
- ✏️ Create: `frontend/src/app/components/ReadingCard.tsx`
- ✏️ Create: `frontend/src/app/components/ReviewQueue.tsx`

### Definition of Done
- [ ] All AC pass
- [ ] Grid layout responsive
- [ ] Reading cards show key info
- [ ] Filters work
- [ ] No console errors

### Report Back With
1. ✅ Files created/modified
2. 🚧 Blockers
3. ❓ Questions

---

## HANDOFF-06: Approve/Reject Reading ⭐ **NEXT UP**

**Story:** US-11.2, US-11.3 - Approve/Reject Reading  
**Priority:** 🔴 Critical  
**Estimated Effort:** 5-6 hours  
**Status:** 📋 Ready

### Objective
Enable managers to approve or reject readings from both the review queue AND route detail view.

### Requirements
- [ ] Add Approve/Reject buttons to Photo Review queue (PhotoReview.tsx)
- [ ] Add Approve/Reject buttons to Route Detail view (routes/[zipCode]/page.tsx)
- [ ] Reading detail modal shows full info (photo, GPS, notes, reader info)
- [ ] "Approve" button changes status to 'approved'
- [ ] "Reject" button opens reason selector (dropdown + free text)
- [ ] **Dropdown auto-populates free text field** (can also manually edit)
- [ ] Update reading in Supabase
- [ ] **Stay on same reading after action** (status updates inline)
- [ ] Success toast/banner on action
- [ ] Queue/detail refreshes to show updated status

### Acceptance Criteria

```gherkin
Given I am viewing a pending reading in the queue
When I click "Approve"
Then the reading status changes to 'approved' and I see a success toast

Given I click "Reject"
When the modal opens
Then I see a dropdown of rejection reasons

Given I select a reason from dropdown
When the modal shows
Then the free text field is pre-populated with the reason

Given I manually edit the free text field
When I submit the rejection
Then my custom text is saved as the rejection reason

Given I approve or reject a reading
When the action completes
Then I stay on the same reading (status updates inline)

Given I approve a reading in the queue
When the queue refreshes
Then the reading is no longer in the pending list
```

### Technical Notes

**Database:**
- Table: `public.readings`
- Update: `status`, `rejection_reason` (if rejected), `manager_notes` (optional)

**Supabase Query:**
```typescript
// Approve
await supabase
  .from('readings')
  .update({ 
    status: 'approved',
    updated_at: new Date().toISOString()
  })
  .eq('id', readingId);

// Reject
await supabase
  .from('readings')
  .update({ 
    status: 'rejected',
    rejection_reason: rejectionReasonText,  // From dropdown or manual
    updated_at: new Date().toISOString()
  })
  .eq('id', readingId);
```

**Rejection Reasons (Dropdown Options):**
```typescript
const REJECTION_REASONS = {
  high_usage: 'Usage exceeds 40% increase from previous reading',
  low_usage: 'Usage significantly below normal range',
  zero_reading: 'Zero reading submitted - possible skip',
  negative_reading: 'Negative delta detected',
  photo_unclear: 'Photo is blurry or meter number unreadable',
  gps_mismatch: 'GPS location does not match meter address',
  other: 'Other (please specify)'
};
```

**UI Pattern (Dropdown + Free Text):**
```typescript
const [selectedReason, setSelectedReason] = useState('');
const [rejectionText, setRejectionText] = useState('');

// When dropdown changes, populate text field
const handleReasonSelect = (reasonKey: string) => {
  setSelectedReason(reasonKey);
  setRejectionText(REJECTION_REASONS[reasonKey] || '');
};

// User can still edit text field manually
const handleTextChange = (text: string) => {
  setRejectionText(text);
  setSelectedReason('custom'); // Mark as custom
};
```

**RLS Policy:** `readings_update_workflow` - managers can update readings from their readers

### Files to Create/Modify
- ✏️ Create: `frontend/src/app/components/ReadingDetailModal.tsx`
- ✏️ Create: `frontend/src/app/components/ApproveRejectButtons.tsx` (reusable)
- ✏️ Create: `frontend/src/app/components/RejectionReasonModal.tsx`
- ✏️ Modify: `frontend/src/app/components/PhotoReview.tsx` (add approve/reject)
- ✏️ Modify: `frontend/src/app/routes/[zipCode]/page.tsx` (add approve/reject)

### Definition of Done
- [ ] All AC pass
- [ ] Approve works from both queue and route detail
- [ ] Reject with dropdown + free text works
- [ ] Custom rejection reasons supported
- [ ] Stay on same reading after action
- [ ] Status updates inline (no navigation)
- [ ] Success/error toasts implemented
- [ ] Queue/detail refreshes after action
- [ ] No console errors

### Report Back With
1. ✅ Files created/modified
2. 🚧 Blockers
3. ❓ Questions
4. 📸 Screenshot of approve/reject UI

---

## HANDOFF-07: Cycle Status Display

**Story:** US-19.1 - Display Current Cycle Status  
**Priority:** 🔴 Critical  
**Estimated Effort:** 2-3 hours  
**Status:** ⏳ Blocked (depends on HANDOFF-01)

### Objective
Show current reading cycle status and progress on dashboard header.

### Requirements
- [ ] Query current cycle from `cycles` table
- [ ] Display cycle name (e.g., "Spring 2026")
- [ ] Show status badge (Read Pending / Active / Complete)
- [ ] Show progress: "X / Y meters complete (Z%)"
- [ ] Place in dashboard header

### Acceptance Criteria

```gherkin
Given there is an active cycle
When I view the dashboard
Then I see the cycle name and status badge

Given 500 of 1000 meters are approved
When I view the progress
Then I see "500 / 1000 meters complete (50%)"
```

### Technical Notes

**Database:**
- Table: `public.cycles`
- Columns: `name`, `status`, `total_meters`, `approved_readings`

**Supabase Query:**
```typescript
const { data: cycle } = await supabase
  .from('cycles')
  .select('*')
  .eq('status', 'active')
  .single();
```

### Files to Create/Modify
- ✏️ Create: `frontend/src/app/components/CycleStatus.tsx`
- ✏️ Modify: `frontend/src/app/page.tsx` (add to header)

### Definition of Done
- [ ] All AC pass
- [ ] Status badge shows correct color
- [ ] Progress bar accurate
- [ ] No console errors

### Report Back With
1. ✅ Files created/modified
2. 🚧 Blockers
3. ❓ Questions

---

## 📊 Handoff Progress Tracker

| Handoff ID | Story | Priority | Status | Assigned | Audit |
|------------|-------|----------|--------|----------|-------|
| HANDOFF-01 | US-12.1 | 🔴 Critical | 📋 Ready | - | - |
| HANDOFF-02 | US-12.2 | 🔴 Critical | 📋 Ready | - | - |
| HANDOFF-03 | US-12.3/4 | 🟠 High | 📋 Ready | - | - |
| HANDOFF-04 | US-8.1 | 🔴 Critical | ⏳ Blocked | - | - |
| HANDOFF-05 | US-11.1 | 🔴 Critical | ⏳ Blocked | - | - |
| HANDOFF-06 | US-11.2/3 | 🔴 Critical | ⏳ Blocked | - | - |
| HANDOFF-07 | US-19.1 | 🔴 Critical | ⏳ Blocked | - | - |

---

## 📝 Developer Report Template

When completing a handoff, the developer should report:

```markdown
## HANDOFF-[ID] - Implementation Report

**Status:** ✅ Complete / 🚧 Partial / ❌ Blocked

### Files Created/Modified
1. `path/to/file1.tsx` - Description
2. `path/to/file2.tsx` - Description

### Acceptance Criteria Status
- [ ] AC1: Pass/Fail - Notes
- [ ] AC2: Pass/Fail - Notes

### Blockers Encountered
[Any issues, RLS problems, type errors, etc.]

### Questions for Sprint Manager
[Any clarification needed]

### Screenshots/Demo Notes
[Optional: describe what was implemented]

### Ready for Audit
Yes/No - If yes, Sprint Manager will review
```

---

## 🔍 Audit Checklist (Sprint Manager Use)

For each handoff, I will verify:

```markdown
## HANDOFF-[ID] - Audit Report

**Audited By:** Sprint Manager  
**Date:** YYYY-MM-DD  
**Result:** ✅ Approved / ❌ Needs Work

### Code Review
- [ ] TypeScript types correct
- [ ] Supabase queries use RLS properly
- [ ] Error handling implemented
- [ ] Loading states present
- [ ] No console errors

### Acceptance Criteria Verification
- [ ] AC1: Pass/Fail - Evidence
- [ ] AC2: Pass/Fail - Evidence

### UX Review
- [ ] Mobile responsive
- [ ] Accessible (labels, focus states)
- [ ] Consistent with existing UI

### Issues Found
[List any bugs, improvements needed]

### Next Steps
[Approve and move to next handoff, or request revisions]
```

---

**Instructions for Lead Developer:**

1. Pick the highest priority handoff with status "📋 Ready"
2. Implement all requirements
3. Test against acceptance criteria
4. Fill out the **Developer Report Template** above
5. Report back in this chat
6. I (Sprint Manager) will audit and either:
   - ✅ Approve → Move to next handoff
   - ❌ Request revisions → You fix and re-report

**Start with HANDOFF-01 (Readers List Page).**
