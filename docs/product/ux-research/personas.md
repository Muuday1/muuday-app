# Muuday Personas

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** Primary user and professional archetypes for the Muuday marketplace  
**Purpose:** Anchor all design, product, and engineering decisions to real human needs  

---

## Table of Contents

1. [Why Personas Matter](#1-why-personas-matter)
2. [User Personas](#2-user-personas)
3. [Professional Personas](#3-professional-personas)
4. [Persona Intersections](#4-persona-intersections)
5. [How to Use These Personas](#5-how-to-use-these-personas)

---

## 1. Why Personas Matter

Muuday serves two sides of a marketplace — **users seeking help** and **professionals offering expertise**. Without documented personas, every feature decision risks being made for an abstract "user" who doesn't exist. These personas ground the 91 journeys in the UX Blueprint and the 15 canonical journey documents to real human contexts.

**Key principle:** Every journey should be traceable to at least one primary persona.

---

## 2. User Personas

---

### 👤 U-01: Ana — The First-Timer

> *"I don't even know what kind of help I need. I just know I need to talk to someone."*

| Attribute | Detail |
|-----------|--------|
| **Age** | 28 |
| **Location** | São Paulo, SP (BRT) |
| **Occupation** | Marketing analyst |
| **Tech comfort** | High |
| **Primary need** | Emotional/mental support (anxiety, burnout) |
| **Budget sensitivity** | Medium — willing to pay R$ 80-150/session |
| **Time flexibility** | Evenings and weekends |
| **Preferred language** | Portuguese |

**Context:**
Ana is experiencing work-related burnout and anxiety. She's never had therapy or coaching before. She heard about Muuday from Instagram. She doesn't know the difference between a psychologist, therapist, and coach. She needs guidance, not just a list of professionals.

**Goals:**
- Find the RIGHT type of professional for her situation
- Book a first session without committing to a long-term plan
- Feel safe and validated in her choice

**Pain points:**
- Overwhelmed by too many categories and specializations
- Worried about wasting money on the wrong professional
- Unclear about what happens after booking
- Anxious about the video session itself (first time)

**Journeys most relevant:**
- Search Recovery (needs guidance when lost)
- User Onboarding (needs education about categories)
- Session Lifecycle (needs pre-join reassurance)
- Review Moderation (reads reviews for validation)

**Design implications:**
- Search should have guided category selection ("What do you need help with?")
- First-time UX should include education, not just transaction
- Reviews should be prominent and trustworthy
- Session join should include device check and waiting room

---

### 👤 U-02: Carlos — The Regular

> *"I know what I need. I just want to book it quickly and get on with my day."*

| Attribute | Detail |
|-----------|--------|
| **Age** | 42 |
| **Location** | Lisbon, PT (WET) |
| **Occupation** | Software engineer |
| **Tech comfort** | Very high |
| **Primary need** | Ongoing career coaching |
| **Budget sensitivity** | Low — prioritizes quality over price |
| **Time flexibility** | Lunch breaks, early mornings |
| **Preferred language** | English or Portuguese |

**Context:**
Carlos has been working with the same career coach on Muuday for 6 months. He books recurring sessions. He trusts the platform and rarely browses. When his coach is unavailable, he wants to find a temporary replacement quickly. He books cross-timezone (coach is in Brazil).

**Goals:**
- Rebook with his regular coach in 2 clicks
- Find backup professionals when needed
- Manage his recurring package (pause, modify)
- See session history and notes

**Pain points:**
- Rebooking his regular coach requires too many clicks
- No quick way to find "similar professionals" to his coach
- Recurring package management is buried
- Timezone confusion when booking cross-border

**Journeys most relevant:**
- Recurring Booking (manages his monthly package)
- Search & Booking (finds backup coaches)
- Session Lifecycle (joins sessions efficiently)
- Global Context Propagation (cross-timezone clarity)

**Design implications:**
- Dashboard should surface "Rebook with [Coach]" prominently
- Search should have "Find similar to [Coach]" feature
- Recurring management should be accessible from agenda
- All times should show both timezones clearly

---

### 👤 U-03: Maria — The Price-Conscious Caregiver

> *"I need help for my daughter, but I need to make sure I can afford it every month."*

| Attribute | Detail |
|-----------|--------|
| **Age** | 45 |
| **Location** | Belo Horizonte, MG (BRT) |
| **Occupation** | Public school teacher |
| **Tech comfort** | Medium |
| **Primary need** | Child nutrition/psychology |
| **Budget sensitivity** | High — needs R$ 50-80/session |
| **Time flexibility** | After 18h weekdays, flexible weekends |
| **Preferred language** | Portuguese |

**Context:**
Maria is seeking help for her 12-year-old daughter's eating habits. She needs a nutritionist who works with children. Price is a major factor — she needs to budget monthly. She's not tech-savvy and gets confused by too many options. She prefers to pay via Pix (Brazilian instant payment).

**Goals:**
- Find affordable specialists within budget
- Understand total cost before committing
- Book at times that work with her daughter's school schedule
- Pay in a way she trusts

**Pain points:**
- Price filters don't account for her budget well
- No "first session discount" visibility
- Unclear about payment methods (wants Pix)
- Difficult to find child-specialized professionals

**Journeys most relevant:**
- Search & Booking (price filtering, specialty search)
- Request Booking (requests custom times that fit her schedule)
- Payments & Revenue (needs affordable payment options)
- Financial Overview (not applicable — she's a user)

**Design implications:**
- Price filter should have "max budget" input, not just slider
- Search should show "first session discount" badges
- Payment flow should support Pix prominently
- Categories should have "children/adolescents" filters

---

## 3. Professional Personas

---

### 👤 P-01: Dr. Silva — The Established Expert

> *"I'm already busy. I just want a platform that brings me clients without extra work."*

| Attribute | Detail |
|-----------|--------|
| **Age** | 52 |
| **Location** | Rio de Janeiro, RJ (BRT) |
| **Profession** | Clinical psychologist, 20 years experience |
| **Tech comfort** | Low-medium |
| **Current workload** | 15-20 sessions/week |
| **Primary goal** | Fill remaining slots efficiently |
| **Price range** | R$ 200-300/session |
| **Tier** | Premium |

**Context:**
Dr. Silva has a thriving offline practice and wants to expand online. She's skeptical of platforms that take too much commission or require too much admin work. She wants auto-accept for bookings from repeat clients and manual confirmation for new ones. She rarely edits her profile.

**Goals:**
- Get high-quality clients who respect her time
- Minimize administrative overhead
- Maintain professional reputation
- Get paid reliably and on time

**Pain points:**
- Onboarding is overwhelming and unclear about requirements
- Manual confirmation of every booking is tedious
- Doesn't understand why some bookings are blocked
- Financial page tells her almost nothing about her earnings
- No-shows cost her money and time

**Journeys most relevant:**
- Professional Onboarding (needs clarity, not confusion)
- Professional Workspace (dashboard, agenda, earnings)
- Session Lifecycle (no-show handling)
- Financial Overview (needs transparent earnings)
- Review Moderation (wants to respond to reviews)

**Design implications:**
- Onboarding should have "express path" for experienced pros
- Dashboard should show "next session" + earnings at a glance
- Auto-accept for repeat clients should be default
- Financial page needs fee breakdown and payout schedule
- Review response should be simple and quick

---

### 👤 P-02: João — The Newcomer

> *"I just got my certification. I need clients FAST or I won't survive the first 6 months."*

| Attribute | Detail |
|-----------|--------|
| **Age** | 27 |
| **Location** | Curitiba, PR (BRT) |
| **Profession** | Nutritionist, recently certified |
| **Tech comfort** | High |
| **Current workload** | 2-3 sessions/week |
| **Primary goal** | Build client base and reputation |
| **Price range** | R$ 60-100/session |
| **Tier** | Basic |

**Context:**
João is newly certified and building his practice from zero. He needs every client he can get. He's willing to offer discounts for first-time clients. He's very active on social media and sees Muuday as a client acquisition channel. He's frustrated that his Basic tier limits his visibility.

**Goals:**
- Get discovered by clients in his city
- Build review count quickly
- Understand why he's not appearing in search results
- Upgrade to higher tier when he can afford it

**Pain points:**
- Unclear why his profile isn't showing in search (dual-gate confusion)
- Basic tier feels too restrictive
- No guidance on how to optimize his profile for discovery
- Reviews take too long to appear (moderation delay)
- Doesn't understand the fee structure

**Journeys most relevant:**
- Professional Onboarding (dual-gate tracker must be crystal clear)
- Search & Booking (needs to understand discovery)
- Professional Workspace (needs performance analytics)
- Review Moderation (wants reviews published faster)
- Request Booking (wants every lead opportunity)

**Design implications:**
- Dual-gate tracker must explain EXACTLY what's needed to go live
- Dashboard should show "Profile views → Bookings" conversion
- Request booking should be available on Basic tier (it currently isn't)
- Profile edit should have "optimization tips"
- First-booking discount should be easy to set up

---

### 👤 P-03: Patricia — The Digital Nomad

> *"I work with clients from multiple countries. I need the platform to handle timezones and currencies for me."*

| Attribute | Detail |
|-----------|--------|
| **Age** | 35 |
| **Location** | London, UK (GMT) |
| **Profession** | Business coach |
| **Tech comfort** | Very high |
| **Current workload** | 10-15 sessions/week |
| **Primary goal** | Serve international clients seamlessly |
| **Price range** | £80-120/session |
| **Tier** | Professional |

**Context:**
Patricia is Brazilian but lives in London and serves clients in Brazil, Portugal, and the UK. She needs timezone clarity for every booking. She prices in GBP but accepts BRL and EUR. She manages her own calendar (Google Calendar sync is essential). She frequently travels and needs to block dates easily.

**Goals:**
- Clear timezone display for every session
- Multi-currency pricing support
- Reliable calendar sync
- Easy exception management for travel
- Cross-border payment handling

**Pain points:**
- Timezone confusion leads to missed sessions
- Currency conversion is unclear to clients
- Calendar sync occasionally fails silently
- No easy way to block vacation dates
- Payout to UK bank account is slow/unclear

**Journeys most relevant:**
- Global Context Propagation (timezone/currency handling)
- Professional Workspace (calendar sync, exceptions)
- Session Lifecycle (pre-join clarity)
- Financial Overview (multi-currency payouts)

**Design implications:**
- Every time display must show both pro and client timezone
- Currency should be configurable per pro
- Calendar sync status should be prominent and actionable
- Availability exceptions should be quick to add
- Financial page should show earnings in pro's preferred currency

---

## 4. Persona Intersections

### Key Moments Where Personas Interact

| Moment | User | Professional | Tension |
|--------|------|--------------|---------|
| **First booking** | Ana (anxious, first-timer) | João (newcomer, eager) | Both are inexperienced; platform must build trust |
| **Rebooking** | Carlos (efficient, regular) | Dr. Silva (busy, established) | Carlos expects speed; Dr. Silva wants control |
| **Cross-timezone** | Carlos (Lisbon) | Patricia (London) | Timezone confusion risks no-shows |
| **Price negotiation** | Maria (budget-conscious) | João (needs clients) | Platform must facilitate without race-to-bottom |
| **Dispute** | Any user | Any professional | Platform must be fair and transparent |

### Persona-to-Journey Mapping

| Journey | Primary Persona(s) | Secondary |
|---------|-------------------|-----------|
| User Onboarding | Ana | Maria |
| Search & Booking | Ana, Carlos, Maria | — |
| Search Recovery | Ana | Maria |
| Session Lifecycle | Carlos | Ana |
| Recurring Booking | Carlos | — |
| Review Moderation | Carlos | João |
| Request Booking | Maria | Carlos |
| Professional Onboarding | João | Dr. Silva |
| Professional Workspace | João | Dr. Silva, Patricia |
| Financial Overview | João | Patricia |
| Profile Edit | João | Patricia |
| Settings & Preferences | Patricia | Carlos |
| Notification Inbox | All | All |
| Global Context Propagation | Patricia | Carlos |
| Operator Case Resolution | Admin | Any |

---

## 5. How to Use These Personas

### For Product Managers
- Before prioritizing any feature, ask: "Which persona needs this most?"
- Use Ana for empathy-driven features (onboarding, guidance)
- Use Carlos for efficiency-driven features (quick rebook, recurring)
- Use Maria for accessibility-driven features (price clarity, payment options)
- Use Dr. Silva for reliability-driven features (auto-accept, clear earnings)
- Use João for growth-driven features (discovery, reviews, profile optimization)
- Use Patricia for global-scale features (timezone, currency, sync)

### For Designers
- Every mockup should specify which persona it's for
- Test flows by "walking through" as each persona
- Ask: "Would Ana understand this?" and "Would Carlos tolerate the friction?"

### For Engineers
- When implementing a feature, consider edge cases for each primary persona
- Example: Timezone display → test with Patricia (cross-TZ) and Carlos (recurring)
- Example: Search → test with Ana (first-timer, needs guidance) and Maria (budget filter)

### For QA
- Write test cases from persona perspectives
- Example: "As Ana (first-timer), can I complete booking without knowing what 'psicologia' means?"
- Example: "As Patricia (digital nomad), are all times displayed in both my timezone and client's?"

---

## Appendix: Persona Validation

These personas should be validated with:
1. **User interviews** — 5-8 interviews per primary persona
2. **Analytics review** — Segment real user behavior by demographics
3. **Support ticket analysis** — What do real users complain about?
4. **Quarterly review** — Update personas as user base evolves

**Next research task:** Conduct structured interviews with 2-3 users matching each persona to validate assumptions and refine details.
