# Muuday Journey Documentation — Master Index

**Last updated:** 2026-04-19  
**Status:** 19 canonical journeys documented + 2 master implementation guides + 5 research documents  
**Scope:** All end-to-end product journeys for the Muuday marketplace  

> 🚨 **Implementing changes? Start here:**
> 1. Read [`IMPLEMENTATION-ROADMAP.md`](../IMPLEMENTATION-ROADMAP.md) — what to build, in what order
> 2. Read [`AI-AGENT-INSTRUCTIONS.md`](../AI-AGENT-INSTRUCTIONS.md) — how to build it (rules, workflow, pitfalls)
> 3. Then read the specific journey doc for frame-by-frame UX specs  

---

## Canonical Journeys

### User-Facing Journeys

| # | Document | Status | Actors | Key Flow |
|---|----------|--------|--------|----------|
| 1 | [User Onboarding](user-onboarding.md) | In progress | User, System | Landing → Auth → Onboarding → Dashboard |
| 2 | [Search & Booking](search-booking.md) | In progress | User, System, Professional | Search → Profile Bio → Services → Multi-Step Booking → Checkout → Confirmation |
| 3 | [Search Recovery](search-recovery-journey.md) | ✅ Complete | User, System | Query → Filter → Zero Results → Recovery → Waitlist |
| 4 | [Session Lifecycle](session-lifecycle.md) | ✅ Complete | User, Professional, System | Pre-Session → Join → In-Session → Post-Session → Dispute |
| 5 | [Recurring Booking](recurring-booking-journey.md) | ✅ Complete | User, System, Professional | Setup → Management → Modification → Renewal |
| 6 | [Review Moderation](review-moderation-lifecycle.md) | ✅ Complete | User, Professional, Admin, System | Submit → Moderate → Publish → Respond |

### Professional-Facing Journeys

| # | Document | Status | Actors | Key Flow |
|---|----------|--------|--------|----------|
| 7 | [Professional Onboarding](professional-onboarding.md) | In progress | Professional, Admin, System | Signup → Onboarding → Submission → Review → Live |
| 8 | [Professional Workspace](professional-workspace-journey.md) | ✅ Complete | Professional, System | Dashboard → Agenda → Availability → Rules → Earnings |
| 9 | [Session Management](session-management.md) | In progress | Professional, System | Agenda → Confirm/Cancel → Reminders → Post-Session |
| 10 | [Video Session Execution](video-session-execution.md) | In progress | User, Professional, System | Join → A/V → Tools → End → Handoff |

### Admin & Operations Journeys

| # | Document | Status | Actors | Key Flow |
|---|----------|--------|--------|----------|
| 11 | [Admin Operations](admin-operations.md) | In progress | Admin, System | Queue → Review → Decide → Notify → Audit |
| 12 | [Operator Case Resolution](operator-case-resolution.md) | ✅ Complete | Operator, User, Professional, System | Create → Triage → Investigate → Decide → Close |

### System & Cross-Cutting Journeys

| # | Document | Status | Actors | Key Flow |
|---|----------|--------|--------|----------|
| 13 | [Payments & Revenue](payments-billing-revenue.md) | Planned | User, Professional, System | Charge → Split → Payout → Refund → Report |
| 14 | [Trust & Safety](trust-safety-compliance.md) | In progress | User, Professional, Admin, System | Monitoring → Flag → Investigate → Enforce → Appeal |
| 15 | [Notification Inbox](notification-inbox-lifecycle.md) | ✅ Complete | All, System | Trigger → Dispatch → Render → State → Archive |
| 16 | [Global Context Propagation](global-context-propagation.md) | ✅ Complete | All, System | Country → Timezone → Currency → Language |
| 17 | [Request Booking](request-booking-journey.md) | ✅ Complete | User, Professional, System | Request → Offer → Accept/Decline → Convert |
| 18 | [Financial Overview](financial-overview-journey.md) | ✅ Complete | Professional, System | Earnings → Payouts → Transactions → Analytics |
| 19 | [Profile Edit](profile-edit-journey.md) | ✅ Complete | User, Professional, System | Edit → Validate → Save → Review |
| 20 | [Settings & Preferences](settings-preferences-journey.md) | ✅ Complete | User, Professional, System | Region → Notifications → Security → Health |

### Implementation Guides

| Document | Purpose | Who Reads |
|----------|---------|-----------|
| [IMPLEMENTATION-ROADMAP.md](../IMPLEMENTATION-ROADMAP.md) | Master checklist: every change, prioritized, with acceptance criteria | AI Agent (primary), PM |
| [AI-AGENT-INSTRUCTIONS.md](../AI-AGENT-INSTRUCTIONS.md) | How to implement: architecture rules, UX rules, workflow, pitfalls | AI Agent (primary) |

### Research & Strategy

| # | Document | Status | Type |
|---|----------|--------|------|
| — | [Journey Audit & Recommendations](../ux-research/journey-audit-and-recommendations.md) | ✅ Complete | Audit (5.9/10 score) |
| — | [Journey Implementation Map](../ux-research/journey-implementation-map.md) | ✅ Complete | Operational change map |
| — | [Edge Case Recovery Playbook](../ux-research/edge-case-recovery-playbook.md) | ✅ Complete | 12 edge cases with recovery paths |
| — | [Personas](../ux-research/personas.md) | ✅ Complete | 6 user & professional archetypes |
| — | [Usability Test Plan](../ux-research/usability-test-plan.md) | ✅ Complete | 7 structured test protocols with metrics |

---

## Journey Interdependency Map

```
User Onboarding ─────┬──→ Search & Booking ───┬──→ Session Lifecycle ───┬──→ Review Moderation
                     │         ↑                │                         │
                     │         └── Search Recovery                         └──→ Trust & Safety
                     │                        │
                     │                        ├──→ Recurring Booking
                     │                        │
                     │                        ├──→ Request Booking
                     │                        │
                     └──→ Profile Edit ───────┘
                     │                        │
                     └──→ Settings & Preferences
                     │
Professional Onboard─┘
                     │
                     └──→ Professional Workspace
                     │         ├──→ Session Management
                     │         ├──→ Availability / Rules
                     │         └──→ Financial Overview
                     │
                     └──→ Video Session Execution (merged into Session Lifecycle)

Admin Operations ────┬──→ Operator Case Resolution
                     │
                     └──→ Trust & Safety
                     │
                     └──→ Review Moderation

Notification Inbox ←── All journeys (cross-cutting)
Global Context ←────── All journeys (cross-cutting)
Payments ←──────────── Search & Booking, Session Lifecycle, Recurring Booking, Financial Overview
```

---

## Documentation Conventions

Each journey document follows this structure:
1. **Executive Summary** — Why this journey matters, what's broken
2. **Frame-by-Frame Analysis** — Page-by-page, component-by-component UX review
3. **State Machine** — Status transitions and rules
4. **Business Rules** — Policies, SLAs, guardrails
5. **Deep Review & Recommendations** — Critical issues and fixes
6. **Implementation Plan** — Phase-by-phase, file-by-file breakdown

---

## How to Use These Documents

### For the Implementing AI Agent (MOST IMPORTANT)

1. **Start with** [`IMPLEMENTATION-ROADMAP.md`](../IMPLEMENTATION-ROADMAP.md) — find your current task by Phase and Change ID
2. **Read** [`AI-AGENT-INSTRUCTIONS.md`](../AI-AGENT-INSTRUCTIONS.md) — architecture rules, workflow, pre/post-flight checklists
3. **Read the specific journey document** referenced in the roadmap task — frame-by-frame UX specs
4. **Implement** following the rules in AI-AGENT-INSTRUCTIONS.md
5. **Update** IMPLEMENTATION-ROADMAP.md after EVERY task (mark ✅, check acceptance criteria)
6. **Update** the journey document with implementation status

### For Product Managers:
- Read the Executive Summary and Deep Review sections first
- Use the Implementation Plan for sprint planning
- Reference the Interdependency Map when scoping new features
- Track progress in IMPLEMENTATION-ROADMAP.md

### For Designers:
- Use Frame-by-Frame Analysis as the spec for design deliverables
- Each "Frame" maps to a screen or state that needs design

### For Engineers:
- Use State Machine sections to model data
- Use Implementation Plan for file-level task breakdown
- Cross-reference with `docs/spec/source-of-truth/` for technical details

### For QA:
- Each Frame represents a test scenario
- Edge Case Recovery Playbook is your test case source
- Use IMPLEMENTATION-ROADMAP.md acceptance criteria as test cases

---

## Legacy Documents (Superseded)

The following documents are partially superseded by the new canonical docs but still contain valuable implementation details:

- `session-management.md` — Merged into `session-lifecycle.md`
- `video-session-execution.md` — Merged into `session-lifecycle.md`
- `trust-safety-compliance.md` — Partially superseded by `operator-case-resolution.md`

---



---

## UX Blueprint Reference

The full 91-journey UX Blueprint lives at:
`artifacts/onedrive-import-2026-04-01/ux-blueprint.html`

This HTML document contains Preply benchmarks and detailed user flow diagrams. The canonical documents in this directory are the operational translation of those 91 journeys into actionable product specs.
