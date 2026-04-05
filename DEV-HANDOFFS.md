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

## HANDOFF-01: Readers List Page

**Story:** US-12.1 - View Readers List  
**Priority:** 🔴 Critical  
**Estimated Effort:** 2-3 hours  
**Status:** 🔍 Awaiting Audit

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

## HANDOFF-06: Approve/Reject Reading

**Story:** US-11.2, US-11.3 - Approve/Reject Reading  
**Priority:** 🔴 Critical  
**Estimated Effort:** 4-5 hours  
**Status:** ⏳ Blocked (depends on HANDOFF-05)

### Objective
Enable managers to approve or reject individual readings from the review queue.

### Requirements
- [ ] Reading detail modal shows full info (photo, GPS, notes, history)
- [ ] "Approve" button changes status to 'approved'
- [ ] "Reject" button opens reason selector, changes status to 'rejected'
- [ ] Update reading in Supabase
- [ ] Remove from pending queue on action
- [ ] Success toast on action
- [ ] Navigate to next pending reading after action (optional)

### Acceptance Criteria

```gherkin
Given I am viewing a pending reading detail
When I click "Approve"
Then the reading status changes to 'approved' and I see a success toast

Given I click "Reject"
When I select a reason and confirm
Then the reading status changes to 'rejected'

Given I approve a reading
When I return to the queue
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
  .update({ status: 'approved' })
  .eq('id', readingId);

// Reject
await supabase
  .from('readings')
  .update({ 
    status: 'rejected',
    rejection_reason: selectedReason
  })
  .eq('id', readingId);
```

**Rejection Reasons:**
- `high_usage` - "Usage exceeds 40% increase"
- `low_usage` - "Usage significantly below normal"
- `zero_reading` - "Zero reading submitted"
- `photo_unclear` - "Photo is blurry or unreadable"
- `gps_mismatch` - "GPS location does not match"

### Files to Create/Modify
- ✏️ Create: `frontend/src/app/components/ReadingDetailModal.tsx`
- ✏️ Modify: `frontend/src/app/components/ReadingCard.tsx` (add click handler)

### Definition of Done
- [ ] All AC pass
- [ ] Approve works
- [ ] Reject with reason works
- [ ] Queue updates after action
- [ ] No console errors

### Report Back With
1. ✅ Files created/modified
2. 🚧 Blockers
3. ❓ Questions

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
