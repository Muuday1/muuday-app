# Muuday Usability Test Plan

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** Structured usability testing protocols for Muuday's critical journeys  
**Purpose:** Validate journey quality, uncover friction, and measure improvement over time  

---

## Table of Contents

1. [Testing Strategy Overview](#1-testing-strategy-overview)
2. [Test Protocols by Journey](#2-test-protocols-by-journey)
3. [Participant Recruitment](#3-participant-recruitment)
4. [Test Environment](#4-test-environment)
5. [Success Metrics](#5-success-metrics)
6. [Test Schedule](#6-test-schedule)
7. [Reporting Template](#7-reporting-template)

---

## 1. Testing Strategy Overview

### Testing Philosophy

> **"Test early, test often, test with real humans."**

Muuday's usability testing follows a **continuous discovery** model:
- **Baseline tests** before major changes (measure current state)
- **Validation tests** after implementation (verify improvements)
- **Exploratory tests** quarterly (discover unknown friction)

### Testing Types

| Type | When | Duration | Participants |
|------|------|----------|--------------|
| **Moderated** | Baseline + Validation | 45-60 min | 5 per persona |
| **Unmoderated** | Quick validation | 15-20 min | 10-15 |
| **A/B Usability** | Feature comparison | Task-based | 20+ per variant |

### What We Test

We test **tasks**, not features. A task is something a real user wants to accomplish:
- ✅ "Book your first therapy session"
- ❌ "Test the booking form component"

### Core Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Task Success Rate** | % of participants who complete task | ≥ 80% |
| **Time on Task** | Median time to complete | Reduce 20% vs baseline |
| **Error Rate** | % of participants who make errors | ≤ 15% |
| **System Usability Scale (SUS)** | Standardized 10-question score | ≥ 68 |
| **Net Promoter Score (NPS)** | Likelihood to recommend | ≥ 30 |

---

## 2. Test Protocols by Journey

---

### TEST-01: First-Time User Onboarding

**Persona:** Ana (First-Timer)  
**Journey:** `user-onboarding.md`  
**Priority:** P0 — Critical conversion path

#### Scenario
> "You've been feeling anxious about work and a friend recommended Muuday. You've never had online therapy. Find someone who can help you and book your first session."

#### Tasks

| # | Task | Success Criteria | Max Time |
|---|------|-----------------|----------|
| 1 | Create an account | Completes signup without asking for help | 3 min |
| 2 | Find a psychologist | Identifies "Psicologia" category and sees relevant professionals | 2 min |
| 3 | Choose a professional | Selects a pro based on visible trust signals (rating, reviews, price) | 2 min |
| 4 | Book a session | Completes booking flow including payment | 4 min |
| 5 | Confirm the booking | Verifies booking appears in agenda with correct details | 1 min |

#### What to Observe
- Where does Ana hesitate or ask "what do I do now?"
- Does she understand the difference between categories?
- Does she notice and trust the review system?
- Does payment flow cause anxiety or abandonment?

#### Post-Task Questions
1. "How confident did you feel that you picked the right person?" (1-5)
2. "What information was missing when choosing a professional?"
3. "Was there any point where you wanted to give up?"

---

### TEST-02: Professional Onboarding & First Booking

**Persona:** João (Newcomer)  
**Journey:** `professional-onboarding.md` + `professional-workspace-journey.md`  
**Priority:** P0 — Critical supply path

#### Scenario
> "You're a newly certified nutritionist. You want to start offering online consultations on Muuday. Set up your profile so clients can find you and book sessions."

#### Tasks

| # | Task | Success Criteria | Max Time |
|---|------|-----------------|----------|
| 1 | Complete identity stage | Uploads photo, writes bio, selects category | 5 min |
| 2 | Set services and pricing | Sets price, duration, and tags | 3 min |
| 3 | Set availability | Defines weekly schedule | 3 min |
| 4 | Understand status | Can explain why profile is/isn't visible | 2 min |
| 5 | Check first booking readiness | Identifies what's blocking first bookings | 2 min |

#### What to Observe
- Does João understand the dual-gate system?
- Does he know when he'll appear in search results?
- Where does he get stuck in the onboarding modal?
- Does he understand the fee structure?

#### Post-Task Questions
1. "Do you know when you'll start receiving bookings?" (Y/N)
2. "What was the most confusing part of onboarding?"
3. "How long did it feel like onboarding took?" (actual vs perceived)

---

### TEST-03: Search & Discovery

**Persona:** Ana (First-Timer) + Carlos (Regular)  
**Journey:** `search-booking.md` + `search-recovery-journey.md`  
**Priority:** P0 — Critical acquisition path

#### Scenario A (Ana)
> "You need help with work-related stress. Find a professional who speaks Portuguese, costs less than R$ 150, and is available in the evening."

#### Scenario B (Carlos)
> "Your regular coach is on vacation. Find a similar coach who can meet tomorrow at 2pm Lisbon time."

#### Tasks

| # | Task | Success Criteria | Max Time |
|---|------|-----------------|----------|
| 1 | Apply filters | Successfully filters by category, price, language | 2 min |
| 2 | Evaluate results | Identifies 2-3 suitable professionals | 2 min |
| 3 | Handle zero results (if triggered) | Successfully recovers from empty state | 2 min |
| 4 | Compare professionals | Makes informed choice using visible data | 2 min |

#### What to Observe
- Do filters reduce results too aggressively?
- Does empty state help users recover?
- Are trust signals (rating, reviews) noticed and used?
- Is "next availability" information useful?

#### Post-Task Questions
1. "How easy was it to find what you were looking for?" (1-5)
2. "What information would have helped you decide faster?"
3. "What would you do if no results appeared?"

---

### TEST-04: Session Execution

**Persona:** Carlos (Regular)  
**Journey:** `session-lifecycle.md`  
**Priority:** P1 — Core product experience

#### Scenario
> "Your session starts in 5 minutes. Join the video call, verify your camera and microphone work, and be ready for the session."

#### Tasks

| # | Task | Success Criteria | Max Time |
|---|------|-----------------|----------|
| 1 | Find session join link | Locates session from agenda/dashboard | 1 min |
| 2 | Join session | Clicks join and enters video room | 1 min |
| 3 | Verify device | Confirms camera and microphone work | 2 min |
| 4 | Understand controls | Identifies mute, camera, end call buttons | 1 min |
| 5 | Handle disconnection | Knows how to rejoin if connection drops | 1 min |

#### What to Observe
- Does pre-join device check reduce anxiety?
- Are controls intuitive without explanation?
- What happens if connection is poor?
- Does user know what to do if pro doesn't show up?

#### Post-Task Questions
1. "How confident did you feel joining the session?" (1-5)
2. "What would you do if the video didn't work?"
3. "How would you rate the video quality experience?"

---

### TEST-05: Professional Workspace Operations

**Persona:** Dr. Silva (Established) + João (Newcomer)  
**Journey:** `professional-workspace-journey.md`  
**Priority:** P1 — Pro retention

#### Scenario A (Dr. Silva)
> "You have 3 pending booking confirmations and a client wants a custom time. Confirm the bookings, respond to the request, and block next Friday for vacation."

#### Scenario B (João)
> "You want to understand how much you've earned this month and when you'll be paid. Check your earnings and payout schedule."

#### Tasks

| # | Task | Success Criteria | Max Time |
|---|------|-----------------|----------|
| 1 | Confirm pending bookings | Accepts/declines all pending confirmations | 2 min |
| 2 | Respond to request | Sends proposal for custom time | 3 min |
| 3 | Block vacation day | Adds exception to availability | 2 min |
| 4 | Check earnings | Finds monthly earnings and fee breakdown | 2 min |
| 5 | Understand payout | Identifies next payout date and amount | 1 min |

#### What to Observe
- Does batch confirmation save time?
- Is request response flow intuitive?
- Can pro easily add calendar exceptions?
- Does financial page answer "how much did I earn?" clearly?

#### Post-Task Questions
1. "How easy is it to manage your schedule on Muuday?" (1-5)
2. "Do you understand how much you earn per session?"
3. "What task took longer than it should have?"

---

### TEST-06: Review Submission

**Persona:** Carlos (Regular)  
**Journey:** `review-moderation-lifecycle.md`  
**Priority:** P1 — Trust signals

#### Scenario
> "You just finished a great session with your coach. You want to leave a review to help other users. Submit a review and check its status."

#### Tasks

| # | Task | Success Criteria | Max Time |
|---|------|-----------------|----------|
| 1 | Find review prompt | Locates review option after session | 1 min |
| 2 | Submit review | Completes rating + comment + structured dimensions | 2 min |
| 3 | Understand moderation | Knows review is pending approval | 1 min |
| 4 | Check review status | Finds "My Reviews" section and sees status | 1 min |

#### What to Observe
- Are structured rating dimensions helpful or annoying?
- Does moderation notice set correct expectations?
- Can user find their submitted reviews later?

#### Post-Task Questions
1. "How easy was it to leave a review?" (1-5)
2. "Did you know what would happen to your review after submission?"
3. "What would make you more likely to leave reviews?"

---

### TEST-07: Edge Case Recovery

**Persona:** Any  
**Journey:** `edge-case-recovery-playbook.md`  
**Priority:** P1 — Resilience

#### Scenarios (One per participant)

| # | Scenario | What to Test |
|---|----------|-------------|
| 1 | "Your payment failed during booking. What do you do?" | Recovery flow clarity |
| 2 | "The professional didn't show up. What do you do?" | No-show report flow |
| 3 | "You need to cancel a session in 12 hours. What happens?" | Cancellation policy clarity |
| 4 | "You accidentally booked the wrong time. Can you change it?" | Reschedule flow |
| 5 | "Search returns zero results. What do you do?" | Empty state recovery |

#### What to Observe
- Does user find the recovery path without help?
- Is the messaging clear and reassuring?
- Does user know what will happen next (refund, rebooking, etc.)?

---

## 3. Participant Recruitment

### Target Numbers

| Test | Personas | Per Persona | Total |
|------|----------|-------------|-------|
| Baseline (pre-implementation) | Ana, Carlos, Maria, João, Dr. Silva | 3 each | 15 |
| Validation (post-implementation) | Ana, Carlos, João | 3 each | 9 |
| Quarterly exploratory | Mixed | 5 | 5 |

### Recruitment Channels

1. **Existing users** — Email invitation with incentive (session credit)
2. **Social media** — Instagram/Twitter posts targeting relevant demographics
3. **Professional networks** — LinkedIn for professional personas
4. **User research panel** — Build a pool of 20-30 willing participants

### Screening Questions

For users:
- "Have you used online therapy or coaching before?" (recruit mix)
- "What device do you primarily use for browsing?" (ensure mobile testers)
- "What's your budget for a single session?" (recruit across price ranges)

For professionals:
- "How long have you been practicing?" (recruit mix of new/established)
- "How do you currently find clients?" (understand context)
- "What platform features matter most to you?" (prioritization signal)

---

## 4. Test Environment

### Setup Options

| Option | Pros | Cons | When to Use |
|--------|------|------|-------------|
| **Production** | Real data, real experience | Risk of real bookings/payments | Unmoderated, read-only tasks |
| **Staging** | Safe to make changes | May differ from production | Moderated tests, booking flow |
| **Prototype** | Fast to iterate | Not real functionality | Early design validation |

### Recommended Setup

- **Moderated tests:** Staging environment with test Stripe keys + seeded data
- **Unmoderated tests:** Production with "test mode" flag + demo accounts
- **A/B tests:** Production with feature flags

### Tools

| Purpose | Tool |
|---------|------|
| Session recording | Hotjar / LogRocket |
| Moderated sessions | Zoom + screen sharing |
| Unmoderated tasks | Maze / UserTesting |
| Surveys | Typeform |
| SUS scoring | Standardized form (print/online) |

---

## 5. Success Metrics

### Benchmarking Framework

We track metrics across three dimensions:

```
Effectiveness (Can they do it?)
├── Task success rate ≥ 80%
└── Error rate ≤ 15%

Efficiency (How fast?)
├── Time on task ≤ benchmark
└── Clicks/taps to complete ≤ benchmark

Satisfaction (How do they feel?)
├── SUS score ≥ 68
├── NPS ≥ 30
└── Post-task confidence ≥ 4/5
```

### Baseline Targets

| Journey | Task Success | Time (median) | SUS Target |
|---------|-------------|---------------|------------|
| User Onboarding | 80% | 8 min | 70 |
| Pro Onboarding | 75% | 12 min | 68 |
| Search & Booking | 85% | 6 min | 72 |
| Session Join | 90% | 3 min | 75 |
| Pro Workspace | 80% | 5 min | 70 |
| Review | 85% | 3 min | 72 |

---

## 6. Test Schedule

### Phase 1: Baseline (Before Implementation)

| Week | Tests | Focus |
|------|-------|-------|
| 1 | TEST-01, TEST-02 | Onboarding (both sides) |
| 2 | TEST-03 | Search & Discovery |
| 3 | TEST-04, TEST-05 | Session + Workspace |
| 4 | TEST-06, TEST-07 | Review + Edge Cases |

### Phase 2: Validation (After Implementation)

| Week | Tests | Focus |
|------|-------|-------|
| 1 | TEST-01, TEST-03 | Auth + Search Recovery |
| 2 | TEST-02, TEST-05 | Dual-gate + Dashboard |
| 3 | TEST-04, TEST-06 | Pre-join + Reviews |
| 4 | TEST-07 | Edge cases |

### Phase 3: Continuous

- **Monthly:** Review Hotjar/LogRocket recordings for 2 hours
- **Quarterly:** Run 5-person exploratory test
- **After major releases:** Run relevant validation tests within 2 weeks

---

## 7. Reporting Template

### Usability Test Report

```markdown
# Test Report: [Journey Name] — [Date]

## Participants
- N = [number]
- Personas: [which]
- Devices: [mobile/desktop mix]

## Key Findings

### 🔴 Critical Issues
1. [Issue description] — [X of N participants]
   - Evidence: [quote or observation]
   - Recommendation: [what to change]

### 🟡 High Priority
1. [Issue description] — [X of N participants]

### 🟢 Low Priority / Observations
1. [Observation]

## Metrics

| Task | Success Rate | Avg Time | Errors |
|------|-------------|----------|--------|
| Task 1 | X% | Xm | Y% |
| Task 2 | X% | Xm | Y% |

- SUS Score: XX (n=X)
- NPS: XX (n=X)

## Recommendations

| Priority | Change | Journey Doc | Owner |
|----------|--------|-------------|-------|
| P0 | [description] | [link] | [who] |
| P1 | [description] | [link] | [who] |

## Next Steps
- [ ] Fix critical issues
- [ ] Re-test in [timeframe]
- [ ] Update journey docs with findings
```

---

## Related Documents

- `docs/product/ux-research/personas.md` — Participant archetypes
- `docs/product/ux-research/journey-audit-and-recommendations.md` — Gap analysis
- `docs/product/IMPLEMENTATION-ROADMAP.md` — Prioritization of fixes
