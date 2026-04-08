# CEO Operations Playbook

## How to Use This Document

This is your operating manual for the project. It tells you:
- **What you need to do** (and when)
- **What decisions only you can make** (and what's blocked without them)
- **Where to stop and review** (before agents keep building)

Items marked with ⏸️ are **breakpoints** — the CTO (Claude) will pause and wait for your input before proceeding.

---

## Master Timeline: CEO Actions by Phase

### ═══ PRE-PHASE 2 (Now) ═══

#### Accounts & Infrastructure Setup

| # | Action | Blocks | Effort | Status |
|---|--------|--------|--------|--------|
| A1 | Set up AWS account (or confirm existing) | All deploys | 15 min | ☐ |
| A2 | Create IAM admin user (not root) + access keys | CDK deploy | 10 min | ☐ |
| A3 | Run `aws configure` with access keys | CDK deploy | 2 min | ☐ |
| A4 | Run `npx cdk bootstrap aws://ACCOUNT/REGION` | First deploy | 5 min | ☐ |
| A5 | Generate GitHub Personal Access Token (repo scope) | Amplify CI/CD | 5 min | ☐ |

**None of these block Phase 2 development.** Phase 2 runs entirely on localhost with mock data. But completing these now means we can deploy the moment Phase 2 code is ready.

#### ⏸️ BREAKPOINT: Business Decisions (Needed for Phase 2)

These decisions affect how core features are built. Defaults are provided — confirm or override.

| # | Decision | Default Assumption | Why It Matters | Status |
|---|----------|--------------------|----------------|--------|
| D1 | **Exception thresholds** — what % change from previous reading flags a meter for review? | >40% delta = high/low exception. Zero readings flagged. Negative delta flagged. | Determines how many meters land in the review queue. Too sensitive = manager reviews everything. Too loose = problems slip through. | ☐ |
| D2 | **Reading edit authority** — can managers correct a reader's value during review? | Yes, with audit trail (original value preserved, editor + timestamp recorded) | Affects the meter review UI and database writes | ☐ |
| D3 | **Rejection workflow** — when a manager rejects a reading, what happens? | Reading goes to reread queue. Original reader must re-visit. Manager can reassign to a different reader. | Determines reread queue behavior | ☐ |
| D4 | **Cycle status transitions** — who can move a city through its lifecycle? | Managers can trigger all transitions for their assigned cities. Admins can do any city. | Determines permission model on City Data page | ☐ |

> **If you don't respond to these before Phase 2 starts, I'll build with the defaults and we adjust later.** None of these are irreversible.

#### ⏸️ BREAKPOINT: Push Approval

Pending: Security fixes commit (`1195006`) ready to push. 14 files, all security findings fixed. Approve?

---

### ═══ PHASE 2: Core MVP ═══
*Agents build: Dashboard, Load Manager, Meter Review, Reread Queue, Reader Reports*

#### During Phase 2 (No action needed unless prompted)

Agents work autonomously. You'll be prompted at the end.

#### ⏸️ BREAKPOINT: Phase 2 Review (End of Phase 2)

**What you'll see:** A working localhost demo with:
- City dashboard with status cards and meter counts
- Load Manager (assign readers to routes)
- Meter Review (sequential photo review with approve/reject)
- Reread queue
- Reader Totals and Breaks reports

**What you do:**
1. I'll start the dev server and walk you through each page
2. You verify the workflow matches how managers actually work
3. You flag anything that looks wrong or missing
4. You approve the commit + push

**Key questions I'll ask at this checkpoint:**
- Does the review flow match how you/managers actually review meters?
- Is the Load Manager assignment model correct?
- Are the reader reports showing the right data?

#### ⏸️ BREAKPOINT: First Deploy Decision

After Phase 2 review, we decide: deploy to AWS now or wait until Phase 3?

**Deploy now (recommended):**
- Gets a real URL for designer to review
- Tests the full stack (Cognito, RDS, Lambda, S3) early
- Catches integration issues before we build 40 more reports

**Wait:**
- Less AWS cost during development
- But delays finding deploy issues

**If you choose to deploy, you'll need to have completed A1-A5 by this point.**

---

### ═══ PHASE 3: Reports System ═══
*Agents build: 39 reports across 4 categories*

#### Before Phase 3

| # | Action | Blocks | Status |
|---|--------|--------|--------|
| D5 | **Review the full report list** — confirm which reports are actually needed vs. legacy cruft | Report scope (39 reports is a lot — some may be unused) | ☐ |
| D6 | **Provide a sample printed report** from the legacy system (screenshot or PDF) | Report formatting/layout | ☐ |
| D7 | **Send designer the staging URL** + Design System Brief | Designer review of MVP pages | ☐ |

#### ⏸️ BREAKPOINT: Report Scope Review (Start of Phase 3)

Before agents build 39 reports, I'll present the full list grouped by category. You tell me:
- Which reports are **must-have** for launch
- Which are **nice-to-have** (build if time allows)
- Which are **never used** (cut entirely)

This could save days of work if half the reports are legacy junk nobody uses.

#### ⏸️ BREAKPOINT: Phase 3 Review (End of Phase 3)

**What you'll see:** All reports rendering with real-looking data, CSV export working.

**What you do:**
1. Spot-check 5-10 reports against legacy system output
2. Verify column names, sort orders, and filter options match expectations
3. Approve commit + push

---

### ═══ PHASE 4: City Data + Certified Reports ═══
*Agents build: Cycle management, CustFile upload/download, certification workflow*

#### Before Phase 4 (CRITICAL — Blocks Work)

| # | Action | Blocks | Status |
|---|--------|--------|--------|
| **D8** | **Provide a sample CustFile** from the legacy system | CustFile parser — we literally cannot build this without seeing the format | ☐ |
| **D9** | **Provide a sample printed certificate** | Certificate PDF generation — need to match the format cities expect | ☐ |
| D10 | **Confirm cycle lifecycle** — walk through a real city's cycle from start to finish | Cycle state machine accuracy | ☐ |

> **D8 is the hardest blocker in the entire project.** Without a sample CustFile, we can't build the upload parser. If you can't get one before Phase 4, we'll build a placeholder and fill in the parser later.

#### ⏸️ BREAKPOINT: Phase 4 Review (End of Phase 4)

**What you'll see:** Full cycle management — upload a CustFile, see new meters appear, download completed reads.

**What you do:**
1. Test the cycle workflow end-to-end
2. Verify the CustFile parser handles your actual file format
3. Review a printed certificate
4. Approve commit + push

---

### ═══ PHASE 5: History + Polish ═══
*Agents build: Historical reports, PWA offline, responsive design, accessibility*

#### Before Phase 5

| # | Action | Blocks | Status |
|---|--------|--------|--------|
| D11 | **Designer delivers Figma refinements** for key screens | Design polish pass | ☐ |
| D12 | **Decide on custom domain** or use Amplify URL for launch | DNS + SSL setup | ☐ |
| D13 | **Prepare real city data** for UAT (or confirm mock data is sufficient) | UAT testing | ☐ |

#### ⏸️ BREAKPOINT: UAT Walkthrough (Mid Phase 5)

**The most important review.** Full walkthrough of the entire manager workflow:

1. Login
2. Select a city
3. Assign readers to routes
4. Review exceptions (photos, approve/reject, edit values)
5. Check reread queue
6. Run key reports
7. Manage city data cycle
8. View certified reports
9. Check historical data

**You do this as if you're the manager.** Flag anything that doesn't feel right.

#### ⏸️ BREAKPOINT: Launch Readiness (End of Phase 5)

**Go/No-Go decision.** I'll present:
- Full QA gate results (all 5 gates)
- Feature completeness checklist (% of legacy features covered)
- Known issues / tech debt list
- Performance metrics (page load times, API response times)

**You decide:** Ship it, or do another polish sprint?

---

### ═══ POST-LAUNCH ═══

| # | Action | When |
|---|--------|------|
| E1 | Create real manager accounts in Cognito | Before first real users |
| E2 | Upload production CustFiles for all cities | Before first real cycle |
| E3 | Run DB migration on production RDS | At first deploy |
| E4 | Set up monitoring alerts (CloudWatch) | First week |
| E5 | Onboard designer for Phase 6 (Reader App) planning | When ready |

---

## Decision Log

Track all CEO decisions here so agents don't re-ask resolved questions.

| # | Decision | Answer | Date | Phase Impact |
|---|----------|--------|------|--------------|
| D1 | Exception thresholds | **40% delta** from previous = high/low. Zero readings always flagged. Negative delta always flagged. | 2026-04-08 | Phase 2 |
| D2 | Reading edit authority | **Yes, edit with audit trail.** Original value preserved, editor + timestamp logged. | 2026-04-08 | Phase 2 |
| D3 | Rejection workflow | **Reread queue, reassignable.** Manager can assign to original reader or a different reader. Manager adds reason/note. | 2026-04-08 | Phase 2 |
| D4 | Cycle status permissions | **Managers for their cities.** Managers trigger transitions on assigned cities. Admins can do any city. | 2026-04-08 | Phase 2 |
| D5 | Report scope review | *pending* | — | Phase 3 |
| D6 | Sample printed report | *pending* | — | Phase 3 |
| D7 | Designer staging access | *pending* | — | Phase 3 |
| D8 | Sample CustFile | *pending* | — | Phase 4 (BLOCKER) |
| D9 | Sample certificate | *pending* | — | Phase 4 |
| D10 | Cycle lifecycle walkthrough | *pending* | — | Phase 4 |
| D11 | Designer Figma delivery | *pending* | — | Phase 5 |
| D12 | Custom domain decision | *pending* | — | Phase 5 |
| D13 | UAT data preparation | *pending* | — | Phase 5 |

---

## Breakpoint Summary (Quick Reference)

| Breakpoint | When | Type | What You Do |
|------------|------|------|-------------|
| **Pre-Phase 2 Decisions** | Now | Decision | Confirm D1-D4 defaults or override |
| **Push Approval** | Now | Approval | Approve security fixes push |
| **Phase 2 Review** | End Phase 2 | Review | Walk through MVP pages, verify workflow |
| **First Deploy Decision** | After Phase 2 | Decision | Deploy to AWS or wait? |
| **Report Scope Review** | Start Phase 3 | Decision | Cut unused reports from scope |
| **Phase 3 Review** | End Phase 3 | Review | Spot-check reports against legacy |
| **CustFile + Certificate** | Before Phase 4 | Blocker | Provide sample files |
| **Phase 4 Review** | End Phase 4 | Review | Test cycle management end-to-end |
| **UAT Walkthrough** | Mid Phase 5 | Review | Full manager workflow test |
| **Launch Readiness** | End Phase 5 | Go/No-Go | Ship or polish? |
| **Every Push** | Ongoing | Approval | CEO approves before any git push |
