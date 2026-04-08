# QA Department Framework

## Operating Model

This project operates as a **multi-agent development firm**. The QA Department is one of several departments, each modeled as specialized agents with defined responsibilities, gates, and handoff protocols.

**Org Chart:**
```
┌─────────────────────────────────────────────────────────┐
│  LEADERSHIP                                             │
│  CEO (User) — Final decisions, approvals, push auth     │
│  CTO (Claude Orchestrator) — Architecture, coordination │
└─────────────────────┬───────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───┴────┐    ┌───────┴──────┐   ┌─────┴──────┐
│  DEV   │    │     QA       │   │   DESIGN   │
│  DEPT  │    │  DEPARTMENT  │   │   DEPT     │
└────────┘    └──────────────┘   └────────────┘
```

---

## QA Department Structure

### Roles (Agent Types)

| Role | Agent Type | Responsibility |
|------|-----------|----------------|
| **QA Lead** | Orchestrator (CTO) | Decides what tests to run, interprets results, gates phases |
| **Security Auditor** | general-purpose agent | OWASP Top 10 code review, dependency scanning, IAM review |
| **Smoke Tester** | general-purpose agent | Runtime verification — start servers, hit endpoints, check responses |
| **Type Checker** | bash commands (inline) | TypeScript compilation, ESLint, build verification |
| **Test Writer** | general-purpose agent (worktree) | Creates unit/integration tests for new code |
| **Regression Runner** | bash commands (inline) | Runs full test suite, reports failures |

---

## Quality Gates

Every phase must pass these gates before the CTO marks it complete and requests push approval from the CEO.

### Gate 1: Static Analysis (Automated, Every Phase)
Run by: **Type Checker** (inline bash)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| TypeScript (frontend) | `cd frontend && npx tsc --noEmit` | Zero errors |
| TypeScript (backend) | `cd backend && npx tsc --noEmit` | Zero errors |
| TypeScript (infra) | `cd infra && npx tsc --noEmit` | Zero errors |
| ESLint | `cd frontend && npx next lint` | Zero errors, zero warnings |
| Next.js Build | `cd frontend && npx next build` | Build succeeds |

### Gate 2: Dependency Security (Automated, Every Phase)
Run by: **Type Checker** (inline bash)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Frontend audit | `cd frontend && npm audit` | No critical/high in direct deps |
| Backend audit | `cd backend && npm audit` | No critical/high in direct deps |
| Infra audit | `cd infra && npm audit` | No critical/high |

**Policy:** High/critical vulnerabilities in direct dependencies block the phase. Vulnerabilities in deep transitive dependencies (e.g., sub-dep of a sub-dep) are logged but don't block if no fix is available.

### Gate 3: Security Code Review (Agent, Every Phase)
Run by: **Security Auditor** agent

**Scope:** All files changed in the phase (determined via `git diff`).

**Checks:**
- SQL injection (parameterized queries only, no string interpolation)
- XSS (no `dangerouslySetInnerHTML`, proper output encoding)
- Broken access control (role checks on every handler)
- Broken authentication (no hardcoded tokens, proper session handling)
- SSRF / path traversal (validate all user-supplied paths, URLs, keys)
- Sensitive data exposure (no secrets in code, no verbose error messages)
- IAM least privilege (Lambda permissions scoped to need)
- CORS (no wildcard origins in production responses)
- Input validation (allowlists on enums, length limits, type coercion)

**Output Format:**
```
CRITICAL: [file:line] Description — Must fix before commit
HIGH:     [file:line] Description — Must fix before phase completion
MEDIUM:   [file:line] Description — Fix during development
LOW:      [file:line] Description — Best practice, track for later
```

**Policy:** CRITICAL and HIGH findings block the phase. MEDIUM findings are tracked as TODOs. LOW findings are logged.

### Gate 4: Smoke Test (Agent, Every Phase)
Run by: **Smoke Tester** agent

**Process:**
1. Start Next.js dev server on a test port
2. Curl all routes that should exist after this phase
3. Verify HTTP status codes (200, or expected redirects)
4. Verify response contains expected content (page title, key elements)
5. Kill dev server

**Pass Criteria:** All routes return expected status codes and content. No 500s, no blank pages.

### Gate 5: Unit/Integration Tests (Agent, Phase 2+)
Run by: **Regression Runner** (inline bash)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Frontend tests | `cd frontend && npm test` | All tests pass |
| Backend tests | `cd backend && npm test` | All tests pass |

**Policy:** Phase 2 will establish the test framework (Jest + React Testing Library for frontend, Jest for backend). From Phase 2 onward, every new feature must include tests. Test coverage is tracked but not gated (no minimum % requirement for MVP).

---

## QA Integration with Development Workflow

### Per-Agent QA (During Development)

When a **Dev agent** (frontend, backend, etc.) completes its work:

1. The agent itself runs `tsc --noEmit` on its project before reporting done
2. If it wrote a Lambda handler, it must use parameterized SQL (no string interpolation)
3. If it wrote a frontend component that renders user data, it must not use `dangerouslySetInnerHTML`

These are **inline checks** — the dev agent is responsible for them as part of its own work.

### Per-Phase QA (After All Agents Complete)

After all dev agents for a phase complete:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Dev Agents  │────>│  QA Battery  │────>│  CEO Review  │
│  Complete    │     │  (Gates 1-5) │     │  + Push Auth │
└──────────────┘     └──────────────┘     └──────────────┘
```

**QA Battery** runs as parallel agents:
- Gate 1 (Static Analysis) — inline bash, fast
- Gate 2 (Dependency Security) — inline bash, fast  
- Gate 3 (Security Code Review) — background agent
- Gate 4 (Smoke Test) — background agent
- Gate 5 (Tests) — inline bash (Phase 2+)

**All gates must pass** before the CTO presents the phase for CEO push approval.

### Per-Push QA (Before Every Push)

Before requesting CEO push approval, the CTO:
1. Confirms all gates passed
2. Summarizes any MEDIUM/LOW findings
3. Lists all files changed
4. Presents commit message(s)

CEO then approves or blocks the push.

---

## QA Artifacts

### Test Framework Setup (To Be Created in Phase 2)

**Frontend:**
```
frontend/
├── jest.config.ts
├── src/
│   ├── __tests__/          # Page-level tests
│   ├── components/
│   │   └── __tests__/      # Component tests
│   └── lib/
│       └── __tests__/      # Utility tests
```

**Backend:**
```
backend/
├── jest.config.ts
├── src/
│   ├── handlers/
│   │   └── __tests__/      # Handler tests (mock DB)
│   └── lib/
│       └── __tests__/      # Library tests
```

### Security Findings Log

All security findings are tracked in this file with their status:

```
| ID | Severity | Finding | File | Status | Fixed In |
|----|----------|---------|------|--------|----------|
```

Updated after each security audit.

---

## Phase 1 Security Audit Results

### Findings

| ID | Severity | Finding | File | Status |
|----|----------|---------|------|--------|
| SEC-001 | CRITICAL | No role-based authorization on any handler | backend/src/handlers/*.ts | OPEN |
| SEC-002 | CRITICAL | S3 path traversal via presigned download URL | backend/src/handlers/photos.ts | OPEN |
| SEC-003 | CRITICAL | Mock auth shipped in login page (any email/password accepted) | frontend/src/app/login/page.tsx | OPEN — Acceptable for Phase 1 (no real Cognito yet) |
| SEC-004 | HIGH | Wildcard CORS origin in Lambda responses | backend/src/lib/response.ts | OPEN |
| SEC-005 | HIGH | All Lambdas get full S3 permissions (least privilege violation) | infra/lib/route-manager-stack.ts | OPEN |
| SEC-006 | HIGH | No input validation on status fields (assignments, readers) | backend/src/handlers/assignments.ts, readers.ts | OPEN |
| SEC-007 | HIGH | USER_PASSWORD_AUTH enabled in Cognito | infra/lib/route-manager-stack.ts | OPEN |
| SEC-008 | MEDIUM | No pagination on list endpoints | backend/src/handlers/*.ts | OPEN |
| SEC-009 | MEDIUM | Filename injection in S3 upload key | backend/src/handlers/photos.ts | OPEN |
| SEC-010 | MEDIUM | No content-type validation on upload presigned URLs | backend/src/handlers/photos.ts | OPEN |
| SEC-011 | LOW | Auth store persisted to localStorage | frontend/src/stores/auth-store.ts | OPEN |
| SEC-012 | LOW | API Gateway access logging not configured | infra/lib/route-manager-stack.ts | OPEN |
| SEC-013 | LOW | Cognito password policy: requireSymbols=false | infra/lib/route-manager-stack.ts | OPEN |

### Dependency Vulnerabilities

| Package | Severity | Project | Issue | Status |
|---------|----------|---------|-------|--------|
| next-pwa (via serialize-javascript) | HIGH (x9) | frontend | RCE via RegExp.flags, CPU exhaustion DoS | OPEN — next-pwa is deprecated, consider serwist |
| esbuild <=0.24.2 | MODERATE | backend | Dev server request hijack (dev-only, not production risk) | OPEN — acceptable |
| infra | CLEAN | infra | No vulnerabilities | N/A |

### Smoke Test Results

| Route | Status | Result |
|-------|--------|--------|
| `/` | 307 -> `/dashboard` | PASS |
| `/login` | 200 | PASS |
| `/dashboard` | 200 | PASS |
| `/readers` | 200 | PASS |

### Phase 1 Gate Summary

| Gate | Status | Notes |
|------|--------|-------|
| Gate 1: Static Analysis | PASS | Zero TS errors, zero ESLint warnings, build succeeds |
| Gate 2: Dependency Security | PARTIAL | 9 high in frontend (next-pwa transitive), 1 moderate in backend (dev-only) |
| Gate 3: Security Code Review | FAIL | 3 CRITICAL, 4 HIGH findings |
| Gate 4: Smoke Test | PASS | All 4 routes return expected responses |
| Gate 5: Unit Tests | N/A | Test framework not yet established |
