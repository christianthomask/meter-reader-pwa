# 🚀 HANDOFF-06 Kickoff: Approve/Reject Reading

**Priority:** 🔴 **CRITICAL - START NOW**  
**Story:** US-11.2, US-11.3 - Approve/Reject Reading  
**Estimated Effort:** 5-6 hours  
**Status:** 📋 Ready to Start

---

## 🎯 Why This Matters

This is the **final critical piece** of the Sprint 2 core workflow:

```
Manager Workflow Progress:
1. ✅ Assign routes to readers (HANDOFF-04)
2. ✅ View route details (HANDOFF-08)
3. ✅ See pending readings (HANDOFF-05)
4. 🚀 APPROVE/REJECT readings (HANDOFF-06) ← YOU ARE HERE
```

**Without this:** Managers can see pending readings but can't act on them.  
**With this:** Full end-to-end workflow is COMPLETE! 🎉

---

## 📋 What You're Building

### Objective
Enable managers to approve or reject readings from **both** the Photo Review queue AND the Route Detail view.

### Key Features
1. **Approve Button** - Changes status to 'approved' ✅
2. **Reject Button** - Opens reason selector ⚠️
3. **Dropdown + Free Text** - Auto-populate but editable
4. **Dual Location** - Works in queue AND route detail
5. **Stay on Reading** - Status updates inline (no navigation)

---

## 🎨 UI/UX Spec

### Rejection Reason Selector

**Pattern:** Dropdown auto-populates free text field

```
┌─────────────────────────────────────────┐
│  Reject Reading                         │
├─────────────────────────────────────────┤
│  Reason: [Select a reason ▼]            │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Usage exceeds 40% increase from   │ │
│  │ previous reading                  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Cancel]  [Reject Reading]             │
└─────────────────────────────────────────┘
```

### Dropdown Options

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

### Interaction Flow

```
1. Click "Reject" button
   ↓
2. Modal opens with dropdown
   ↓
3. Select reason from dropdown
   ↓
4. Free text field auto-populates with reason text
   ↓
5. User can edit text (optional)
   ↓
6. Click "Reject Reading"
   ↓
7. Status updates to 'rejected' inline
   ↓
8. Success toast shows
   ↓
9. Queue/detail refreshes (reading now shows "Rejected" status)
```

---

## 🏗️ Technical Implementation

### Where to Implement

**Location 1:** Photo Review Queue (`PhotoReview.tsx`)
- Add Approve/Reject buttons to each reading card
- OR: Click card → modal with approve/reject actions

**Location 2:** Route Detail (`/routes/[zipCode]/page.tsx`)
- Add Approve/Reject buttons to meter cards with pending readings
- OR: Click meter → modal with approve/reject actions

**Recommendation:** Do both for maximum flexibility

### Database Update

```typescript
// Approve
async function approveReading(readingId: string) {
  const { data, error } = await supabase
    .from('readings')
    .update({ 
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', readingId)
    .select()
    .single();
  
  return { data, error };
}

// Reject
async function rejectReading(readingId: string, reason: string) {
  const { data, error } = await supabase
    .from('readings')
    .update({ 
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', readingId)
    .select()
    .single();
  
  return { data, error };
}
```

### RLS Policy

```sql
-- Policy: readings_update_workflow
-- Managers can update readings from their readers
UPDATE (
  EXISTS (
    SELECT 1 FROM public.readers
    WHERE readers.id = readings.reader_id
    AND readers.manager_id = auth.uid()
  )
)
```

✅ Already implemented in Migration 003 - no changes needed.

### Component Structure

```
frontend/src/app/components/
├── ApproveRejectButtons.tsx    # Reusable button component
├── RejectionReasonModal.tsx    # Modal with dropdown + text
└── ReadingDetailModal.tsx      # Full reading info + actions
```

### State Management (Rejection Modal)

```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedReason, setSelectedReason] = useState('');
const [rejectionText, setRejectionText] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

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

// Submit rejection
const handleSubmit = async () => {
  setIsSubmitting(true);
  const { error } = await rejectReading(readingId, rejectionText);
  if (!error) {
    toast.success('Reading rejected');
    setIsOpen(false);
    // Refresh parent component (queue or route detail)
    onReadingUpdated();
  }
  setIsSubmitting(false);
};
```

---

## 📁 Files to Create/Modify

### Create
- `frontend/src/app/components/ApproveRejectButtons.tsx` - Reusable buttons
- `frontend/src/app/components/RejectionReasonModal.tsx` - Rejection modal
- `frontend/src/app/components/ReadingDetailModal.tsx` - Full reading detail

### Modify
- `frontend/src/app/components/PhotoReview.tsx` - Add approve/reject to queue
- `frontend/src/app/routes/[zipCode]/page.tsx` - Add approve/reject to route detail
- `frontend/src/app/components/ReadingCard.tsx` - Add action buttons (optional)

---

## ✅ Acceptance Criteria (Must Pass)

```gherkin
# Approve
Given I am viewing a pending reading in the queue
When I click "Approve"
Then the reading status changes to 'approved'
And I see a success toast
And the reading is no longer in the pending list

# Reject - Dropdown
Given I click "Reject"
When the modal opens
Then I see a dropdown of rejection reasons

Given I select a reason from dropdown
When the modal shows
Then the free text field is pre-populated with the reason

# Reject - Manual Edit
Given I have selected a reason from dropdown
When I manually edit the free text field
Then my custom text replaces the pre-populated text

Given I submit the rejection
When I check the database
Then my custom text is saved as the rejection_reason

# Post-Action Flow
Given I approve or reject a reading
When the action completes
Then I stay on the same reading (no navigation)
And the status updates inline
And I see a success toast
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Click "Approve" on pending reading → status updates
- [ ] Click "Reject" → modal opens
- [ ] Select reason from dropdown → text field populates
- [ ] Edit text manually → custom text saves
- [ ] Submit rejection → status updates to 'rejected'
- [ ] Success toast appears
- [ ] Queue/detail refreshes
- [ ] Works from Photo Review queue
- [ ] Works from Route Detail view
- [ ] RLS allows update (manager's readers only)

### TypeScript + Build
```bash
npx tsc --noEmit  # ✅ No errors
npm run build     # ✅ Successful
```

---

## ⚠️ Important Notes

### 1. Stay on Same Reading
**DO NOT** navigate away after approve/reject. Instead:
- Update status inline
- Refresh the parent component
- Show success toast

**Why:** Managers may want to add notes or review the reading again.

### 2. Dropdown + Free Text Pattern
This is important for flexibility:
- **Dropdown** = Quick selection of common reasons
- **Free text** = Custom details or edits

**Example:**
```
Dropdown: "high_usage" → Pre-populates: "Usage exceeds 40% increase..."
User edits: "Usage exceeds 40% increase - customer may have leak"
Saved: "Usage exceeds 40% increase - customer may have leak"
```

### 3. Dual Implementation
Implement in **both** locations:
- **Photo Review Queue** = Bulk workflow (review many readings)
- **Route Detail** = Meter-level workflow (review specific route)

**Why:** Different managers have different workflows.

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Files Created | 3 components |
| Files Modified | 2-3 pages |
| Build Size Impact | < +2 kB |
| TypeScript Errors | 0 |
| Manual Test Cases | All pass |

---

## 🎯 Definition of Done

- [ ] Approve works from queue
- [ ] Approve works from route detail
- [ ] Reject with dropdown works
- [ ] Custom rejection reasons work
- [ ] Stay on same reading after action
- [ ] Status updates inline
- [ ] Success/error toasts implemented
- [ ] Queue/detail refreshes after action
- [ ] No console errors
- [ ] Mobile responsive

---

## 📸 Report Back With

1. ✅ Files created/modified
2. 🚧 Any blockers (RLS, state management, etc.)
3. ❓ Questions for clarification
4. 📸 Screenshot of:
   - Approve/Reject buttons
   - Rejection reason modal
   - Updated reading status

---

## 💬 Questions to Consider

1. **Modal vs. Inline:** Should approve/reject be in a modal, or inline buttons on the card?
2. **Confirmation:** Should approve require confirmation, or just reject?
3. **Keyboard Shortcuts:** Add 'A' for approve, 'R' for reject? (Nice-to-have)
4. **Batch Actions:** Allow selecting multiple readings and approving together? (Future enhancement)

---

## 🚀 You're Cleared to Start

**This is the final critical workflow piece for Sprint 2.**

**After this:** Only HANDOFF-07 (Cycle Status) remains - which is a "nice to have".

**When you complete this:** Sprint 2 core workflow is **DONE** and we can:
- Ship early
- Start Sprint 3 (Offline Sync)
- Or polish existing features

---

**Standing by for questions during implementation.**

**Sprint Manager Out** 🎯

---

## 📊 Sprint 2 Progress

| Handoff | Story | Status |
|---------|-------|--------|
| 01 | US-12.1 | ✅ Approved |
| 02 | US-12.2 | ✅ Approved |
| 03 | US-12.3/4 | ✅ Approved |
| 04 | US-8.1 | ✅ Approved |
| 05 | US-11.1 | ✅ Approved |
| 08 | US-8.2 | ✅ Approved |
| **06** | **US-11.2/3** | 🚧 **In Progress** |
| 07 | US-19.1 | 📋 Ready |

**Progress:** 6/8 handoffs complete (75%)  
**After HANDOFF-06:** Core workflow = **100% complete** 🎉
