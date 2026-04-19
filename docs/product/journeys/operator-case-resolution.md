# Journey: Operator Case Resolution

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** End-to-end admin/ops experience for handling disputes, exceptions, and operational cases  
**Actors:** Admin/Ops (operator), User (via evidence), Professional (via evidence), System  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Case Taxonomy](#2-case-taxonomy)
3. [Frame-by-Frame Analysis](#3-frame-by-frame-analysis)
4. [Case State Machine](#4-case-state-machine)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

Muuday needs a **structured case queue** for operational exceptions. Today, admin actions are scattered across the dashboard (approve pro, moderate review, toggle gates). There is **no unified case entity**, no **assignment system**, and no **audit trail for decisions**.

**Critical insight:**
> Without a case system, the ops team will lose track of who is handling what, why decisions were made, and whether users were notified. This creates legal risk and operational chaos as volume grows.

---

## 2. Case Taxonomy

### Case Types

| Type | Trigger | Priority | SLA |
|------|---------|----------|-----|
| `dispute` | User files dispute | P0 | 24h first response |
| `no_show_claim` | No-show reported | P1 | 24h |
| `refund_manual_review` | Refund outside policy | P1 | 48h |
| `payout_failed` | Stripe/Airwallex failure | P1 | 24h |
| `professional_flagged` | Trust flag triggered | P1 | 48h |
| `professional_verification_review` | Credential anomalies | P2 | 72h |
| `review_report` | Review reported by pro/user | P2 | 48h |
| `off_platform_payment` | Evidence of off-platform payment | P0 | 24h |
| `technical_session_failure` | Video session provider failure | P1 | 12h |
| `content_taxonomy_review` | New specialty/tag suggestion | P3 | 5 days |
| `account_suspension_review` | Suspension appeal | P0 | 24h |

### Case Severity

| Severity | Definition | Example |
|----------|------------|---------|
| Critical | Financial loss, safety risk, legal exposure | Dispute >$500, off-platform payment, suspension appeal |
| High | Revenue impact, trust erosion | No-show claim, payout failure, flagged professional |
| Medium | Quality issue, policy violation | Review report, verification anomaly |
| Low | Administrative, enhancement | Taxonomy suggestion, content curation |

---

## 3. Frame-by-Frame Analysis

### PHASE 1: CASE CREATION

---

#### Frame 1.1: Auto-Creation Triggers

**Where:** System events (webhooks, server actions, cron)  
**Current State:** Some notifications to ops (e.g., `reportProfessionalNoShow` creates `ops.professional_no_show` notification). No formal case.

**Recommended Frame 1.1 (Target):**
```
[Auto-Case Creation Flow]
    ├── Trigger: user reports no-show
    ├── System:
    │   ├── Creates case: type=no_show_claim
    │   ├── Links: booking_id, user_id, professional_id
    │   ├── Auto-collects evidence:
    │   │   ├── Booking details
    │   │   ├── Session join logs (if any)
    │   │   ├── Chat history
    │   │   └── Payment record
    │   ├── Priority: P1
    │   └── Assigns: unassigned (queue)
    └── Notification to ops: "New case: No-show claim #1234"
```

---

#### Frame 1.2: Manual Case Creation

**Where:** Admin dashboard  
**Current State:** Not possible. Admin can only act within existing UI.

**Recommended Frame 1.2 (Target):**
```
[Admin Dashboard — "Create Case" Button]
    ├── [+ Novo caso] button
    ├── Form:
    │   ├── Type select (from taxonomy)
    │   ├── Linked entity: search booking/professional/user
    │   ├── Summary (textarea)
    │   ├── Priority override (auto from type, editable)
    │   └── Assignee (self or unassigned)
    └── On create: case appears in queue
```

---

### PHASE 2: TRIAGE

---

#### Frame 2.1: Case Queue View

**Where:** New route: `/admin/casos`  
**Current State:** Does not exist.

**Recommended Frame 2.1 (Target):**
```
[/admin/casos — Case Queue]
    
    Header:
    ├── "Fila de casos"
    ├── Stats: [Novos: 12] [Em andamento: 8] [Aguardando: 5] [Resolvidos hoje: 3]
    └── [+ Novo caso]
    
    Filters:
    ├── Meus casos / Todos
    ├── Tipo: [Todos] [Disputa] [No-show] [Reembolso] ...
    ├── Prioridade: [P0] [P1] [P2] [P3]
    ├── Status: [Novo] [Triagem] [Investigação] ...
    └── SLA: [Dentro do prazo] [Vencendo] [Vencido]
    
    Queue list (sortable):
    ├── Colunas: ID | Tipo | Prioridade | Entidade | SLA | Status | Responsável | Criado
    ├── Color coding:
    │   ├── P0: red border
    │   ├── P1: amber border
    │   └── SLA vencido: red background tint
    └── Click row → opens case detail
```

---

#### Frame 2.2: Case Assignment

**Recommended Frame 2.2 (Target):**
```
[Case Assignment]
    ├── Bulk select: checkbox on queue rows
    ├── [Atribuir a mim] button
    ├── [Atribuir a...] dropdown: list of ops team members
    └── Auto-assignment rules (configurable):
        ├── Round-robin for new cases
        ├── Load-balanced (assign to least busy)
        └── Specialist routing (payment cases → Payments Ops)
```

---

### PHASE 3: INVESTIGATION

---

#### Frame 3.1: Case Detail View

**Where:** New route: `/admin/casos/[caseId]`  
**Current State:** Does not exist. Admins must navigate between `/admin/revisao/[id]`, dashboard tabs, and DB.

**Recommended Frame 3.1 (Target):**
```
[/admin/casos/[id] — Case Detail]
    
    Header:
    ├── Case #1234 — No-show claim
    ├── Priority badge: P1
    ├── SLA: "Vence em 4h" (countdown)
    ├── Status: [Novo → Triagem → Investigação → Resolvido]
    └── Assignee: [You] [Reatribuir]
    
    Three-column layout:
    
    Left (summary):
    ├── Summary card
    ├── Timeline:
    │   ├── Created: 19 Abr, 14:32 (auto)
    │   ├── Assigned: 19 Abr, 15:10 (by system)
    │   └── [Add note]
    └── Linked entities:
        ├── Booking: #5678 → link
        ├── User: Ana Silva → profile
        ├── Professional: Dr. Carlos → profile
        └── Payment: #9012 → link
    
    Center (evidence):
    ├── Evidence tabs:
    │   ├── Booking details
    │   ├── Session logs (join/leave times)
    │   ├── Chat messages
    │   ├── Payment record
    │   └── Uploaded evidence (user/pro)
    ├── [Request more info from user] button
    ├── [Request more info from professional] button
    └── [Upload internal evidence]
    
    Right (decision):
    ├── Decision form (context-aware per case type)
    │   ├── No-show claim:
    │   │   ├── [User no-show confirmed]
    │   │   ├── [Professional no-show confirmed]
    │   │   ├── [Inconclusive — no action]
    │   │   └── [Both parties at fault]
    │   ├── Dispute:
    │   │   ├── [Approve full refund]
    │   │   ├── [Approve partial refund] + amount
    │   │   ├── [Reject refund]
    │   │   └── [Escalate to legal]
    │   └── Professional review:
    │       ├── [Aprovar]
    │       ├── [Solicitar ajustes]
    │       └── [Rejeitar]
    ├── Decision notes (required)
    ├── [Preview communication] (what user/pro will see)
    └── [Apply decision]
```

---

#### Frame 3.2: Evidence Collection

**Recommended Frame 3.2 (Target):**
```
[Evidence Panel]
    ├── Auto-collected evidence (read-only):
    │   ├── Booking state at time of incident
    │   ├── Session events (join timestamps, disconnects)
    │   ├── Payment state
    │   └── Previous cases involving same user/pro
    ├── User-submitted evidence:
    │   ├── Uploads (images, screenshots)
    │   └── Written statement
    ├── Professional-submitted evidence:
    │   ├── Uploads
    │   └── Written statement
    └── Internal evidence:
        ├── Admin notes
        ├── Communication logs
        └── Third-party verification (if any)
```

---

### PHASE 4: DECISION & COMMUNICATION

---

#### Frame 4.1: Structured Decision

**Recommended Frame 4.1 (Target):**
```
[Decision Form — No-Show Example]
    ├── Findings:
    │   ├── "User joined at 10:05, waited 15 min, left at 10:20"
    │   ├── "Professional never joined"
    │   └── "No communication from professional"
    ├── Decision: [Professional no-show confirmed]
    ├── Actions (auto-checked):
    │   ├── [✓] Refund user 100% (R$ 150)
    │   ├── [✓] Flag professional (strike +1)
    │   ├── [✓] Notify user: "We confirmed your report..."
    │   └── [✓] Notify professional: "No-show confirmed..."
    ├── Custom note to user (optional):
    │   └── "We're sorry for the inconvenience..."
    ├── Custom note to professional (optional):
    │   └── "This is your second no-show. A third will result in suspension."
    └── [Apply decision]
```

---

#### Frame 4.2: Communication Templates

**Recommended Frame 4.2 (Target):**
```
[Communication Templates]
    ├── Pre-built templates per case type:
    │   ├── No-show user win: "We reviewed your claim..."
    │   ├── No-show pro win: "We reviewed the session logs..."
    │   ├── Dispute approved: "We've approved your refund..."
    │   └── Dispute rejected: "After reviewing the evidence..."
    ├── Variables: {userName}, {proName}, {bookingDate}, {refundAmount}
    └── [Preview] before sending
```

---

### PHASE 5: CLOSURE

---

#### Frame 5.1: Case Closure

**Recommended Frame 5.1 (Target):**
```
[Case Closed]
    ├── Status: Resolvido
    ├── Resolution summary:
    │   ├── Decision: Professional no-show confirmed
    │   ├── Refund: R$ 150 to user
    │   ├── Professional strike: 1 (total: 2)
    │   └── Notifications sent: user ✓, professional ✓
    ├── Time to resolution: 18h 32min
    └── [Reopen case] (if new evidence emerges)
```

---

## 4. Case State Machine

```
new ──[auto or manual assign]──→ triaging ──[evidence gathered]──→ investigating
                                                                     │
                                                                     ├──[decision made]──→ resolved ──[notify parties]──→ closed
                                                                     │
                                                                     ├──[needs external input]──→ awaiting_response ──[response received]──→ investigating
                                                                     │
                                                                     └──[beyond authority]──→ escalated ──[senior decides]──→ resolved
```

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: No Case Entity Exists
**Severity:** Critical  
**Impact:** No audit trail, no accountability, no operational scalability  
**Fix:** Create `cases` table and all related UI.

#### C2: Admin Actions Are Scattered
**Severity:** Critical  
**Impact:** Ops team must navigate multiple screens for one incident  
**Fix:** Unify all operational actions into case detail view.

#### C3: No Assignment System
**Severity:** High  
**Impact:** Cases fall through cracks, duplicate work  
**Fix:** Build queue with assignment and SLA tracking.

### High Priority

#### H1: No Evidence Collection
**Severity:** High  
**Impact:** Decisions made without context  
**Fix:** Auto-collect booking, session, payment data on case creation.

#### H2: No Communication Templates
**Severity:** High  
**Impact:** Inconsistent user communication, legal risk  
**Fix:** Structured decision forms with pre-built templates.

#### H3: No SLA Tracking
**Severity:** Medium  
**Impact:** Slow resolution, user frustration  
**Fix:** SLA countdown per case, escalation rules.

---

## 6. Implementation Plan

### Phase 1: Data Model (Week 1)

```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL,
  severity TEXT NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  payment_id UUID REFERENCES payments(id),
  user_id UUID REFERENCES profiles(id),
  professional_id UUID REFERENCES profiles(id),
  summary TEXT NOT NULL,
  decision TEXT,
  decision_notes TEXT,
  resolution_outcome TEXT,
  sla_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE case_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) NOT NULL,
  evidence_type TEXT NOT NULL, -- auto_collected, user_submitted, pro_submitted, internal
  source TEXT NOT NULL, -- table_name, file_path, etc.
  data JSONB,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 2: Queue UI (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Case queue page | `app/(app)/admin/casos/page.tsx` | 2 days |
| Case detail page | `app/(app)/admin/casos/[caseId]/page.tsx` | 3 days |
| Case list component | `components/admin/CaseQueue.tsx` | 2 days |

### Phase 3: Case Creation (Week 2)

| Task | File | Effort |
|------|------|--------|
| Auto-case creation on triggers | `lib/cases/auto-create.ts` | 2 days |
| Manual case creation | `lib/actions/cases.ts` | 1 day |
| Evidence collection | `lib/cases/evidence.ts` | 1 day |

### Phase 4: Decision System (Week 3)

| Task | File | Effort |
|------|------|--------|
| Decision forms per case type | `components/admin/CaseDecisionForm.tsx` | 2 days |
| Communication templates | `lib/cases/templates.ts` | 1 day |
| Case actions server | `lib/actions/cases.ts` | 2 days |

### Phase 5: SLA & Reporting (Week 4)

| Task | File | Effort |
|------|------|--------|
| SLA tracking | `lib/cases/sla.ts` | 1 day |
| Escalation rules | `inngest/functions/case-escalation.ts` | 1 day |
| Case analytics | `app/(app)/admin/casos/analytics` | 2 days |

---

## Related Documents

- `docs/product/journeys/session-lifecycle.md` — No-show and dispute triggers
- `docs/product/journeys/trust-safety-compliance.md` — Trust flags and enforcement
- `docs/spec/source-of-truth/part4-admin-ops-notifications-trust.md` — Admin ops spec
