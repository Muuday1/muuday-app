# Journey: Recurring Booking

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** Complete recurring booking experience: setup, management, modification, cancellation, and billing  
**Actors:** User (client), Professional, System  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frame-by-Frame Analysis](#2-frame-by-frame-analysis)
3. [Recurring State Machine](#3-recurring-state-machine)
4. [Business Rules](#4-business-rules)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

Recurring bookings allow users to book a series of sessions with a professional on a regular cadence (weekly, biweekly, monthly, or custom). While the backend engine exists (`lib/booking/recurrence-engine.ts`), the **UX journey is underdocumented and underdeveloped**.

**Critical insight:**
> The current recurring flow is buried inside the direct booking form. Users must discover it. There's no dedicated recurring management screen, no visual grouping in the agenda, and the cancellation scope (single vs series) is ambiguous.

---

## 2. Frame-by-Frame Analysis

### PHASE 1: SETUP

---

#### Frame 1.1: Booking Form — Type Selection

**Where:** `components/booking/BookingForm.tsx`  
**Current State:** Three cards: "Sessão única" | "Recorrente" | "Várias datas"

**Frame-by-frame:**
```
[BookingForm — Step 1: Type Selection]
    ├── Card 1: "Sessão única" (default selected)
    ├── Card 2: "Recorrente" 
    │   └── If enableRecurring=false: disabled with opacity-50 + "Indisponível no plano básico"
    └── Card 3: "Várias datas" (batch)
    
    [User clicks "Recorrente"]
        └── Recurring config panel appears below
```

**Problems identified:**
1. **Recurring is hidden behind type selection** — Users booking their first session may not notice recurring option
2. **No explanation of what recurring means** — "Recorrente" is just a label; no value proposition
3. **Tier gating is punitive** — Disabled state says what's NOT available, not what IS available on higher tiers

**Recommended Frame 1.1 (Target):**
```
[BookingForm — Type Selection Enhanced]
    ├── "Sessão única" (default)
    │   └── Subtitle: "One appointment"
    ├── "Pacote recorrente" 
    │   ├── Subtitle: "Weekly or monthly sessions with [Pro Name]"
    │   ├── Badge: "Save 5% on 4+ sessions" (if applicable)
    │   └── If disabled: "Available on Professional plan. [Upgrade]"
    └── "Várias datas" (batch)
        └── Subtitle: "Book 2–20 specific dates"
        
    [Visual enhancement]
    ├── Selected card gets brand border + checkmark
    └── Unselected cards are subtle but readable
```

---

#### Frame 1.2: Recurring Configuration

**Where:** `components/booking/BookingForm.tsx` — recurring panel  
**Current State:** Periodicity dropdown, interval input, duration mode (occurrences vs end-date), count selector, auto-renew checkbox.

**Frame-by-frame:**
```
[Recurring Config Panel]
    ├── "Periodicidade" dropdown: [Semanal / Quinzenal / Mensal / Personalizado]
    ├── "Intervalo" input (number) — shows when "Personalizado" selected
    ├── "Duração do pacote" pills: [Por número de sessões / Até uma data]
    ├── If "Por número": "Número de sessões" slider (2-52)
    ├── If "Até uma data": Date picker
    ├── "Renovação automática" checkbox
    └── Price preview: "Total: R$ X,XXX (Y sessões × R$ ZZZ)"
```

**Problems identified:**
1. **No calendar preview** — User cannot see WHICH dates will be booked
2. **"Personalizado" is confusing** — What does interval mean? "Every 3 weeks"?
3. **No conflict detection preview** — User only discovers conflicts at submit time
4. **Auto-renew is scary** — No explanation of what happens at renewal
5. **No comparison to single sessions** — Should show "vs R$ X,XXX if booked individually"

**Recommended Frame 1.2 (Target):**
```
[Recurring Config Panel — Enhanced]
    ├── Cadence selector:
    │   ├── [Weekly] [Biweekly] [Monthly] [Custom]
    │   └── Custom: "Every [3] [weeks/months]"
    ├── Duration:
    │   ├── [4 sessions] [8 sessions] [12 sessions] [Custom]
    │   └── Custom: slider or date picker
    ├── 📅 Calendar preview (NEW):
    │   ├── Mini calendar showing all session dates highlighted
    │   ├── Conflicts marked in red (if any)
    │   └── "First session: [Date]. Last session: [Date]."
    ├── Pricing:
    │   ├── "Y sessions × R$ ZZZ = R$ Total"
    │   ├── "Service fee: Grátis"
    │   └── "Equivalent to X single bookings: R$ Comparison"
    ├── Renewal:
    │   ├── [✓] Auto-renew after last session
    │   └── Info tooltip: "We'll notify you 7 days before renewal. Cancel anytime."
    └── Cancellation policy:
        └── "Cancel individual sessions up to 24h before. Cancel entire series anytime."
```

---

#### Frame 1.3: Slot Selection for Recurring

**Where:** `components/booking/BookingForm.tsx` — calendar + time grid  
**Current State:** User picks ONE date/time. System generates recurring dates from that anchor.

**Frame-by-frame:**
```
[Calendar + Time Selection]
    ├── User selects date (first session)
    ├── User selects time
    ├── System generates all recurring dates from anchor
    └── Checkboxes for policy + timezone acceptance
```

**Problems identified:**
1. **User only sees first session date** — The generated dates are invisible until success screen
2. **No ability to skip a week** — If one generated date conflicts with vacation, user must cancel later
3. **Time is fixed** — Cannot vary time per session (e.g., Mondays 10am, Wednesdays 3pm)

**Recommended Frame 1.3 (Target):**
```
[Slot Selection — Recurring Enhanced]
    ├── "Select your first session"
    ├── Calendar with availability dots
    ├── Time grid
    ├── [Generate preview] button
    └── Generated sessions list (editable):
        ├── Session 1: [Date] [Time] ✓
        ├── Session 2: [Date] [Time] ✓
        ├── Session 3: [Date] [Time] ⚠️ (pro unavailable)
        │   └── [Remove] or [Pick alternative time]
        └── ...
```

---

#### Frame 1.4: Success Screen

**Where:** `components/booking/BookingForm.tsx` — success state  
**Current State:** Generic success with confirmation mode info.

**Recommended Frame 1.4 (Target):**
```
[Success Screen — Recurring]
    ├── 🎉 "Pacote recorrente agendado!"
    ├── Summary card:
    │   ├── "Y sessions with [Pro Name]"
    │   ├── "Starting [Date] at [Time]"
    │   ├── "Every [cadence]"
    │   └── "Last session: [Date]"
    ├── Calendar export: "Add all sessions to my calendar" (.ics with all dates)
    ├── Session list preview (first 3 + "View all in agenda")
    ├── "Manage my recurring bookings" link
    └── CTAs: [Ver agenda] [Buscar mais profissionais]
```

---

### PHASE 2: MANAGEMENT

---

#### Frame 2.1: Agenda — Recurring Grouping

**Where:** `app/(app)/agenda/page.tsx`  
**Current State:** Recurring bookings appear as individual cards with "Recorrência" badge.

**Frame-by-frame:**
```
[Agenda — Upcoming Sessions]
    ├── Booking card 1: "Recorrência" badge, date, time, pro name
    ├── Booking card 2: "Recorrência" badge, date, time, pro name
    ├── Booking card 3: "Recorrência" badge, date, time, pro name
    └── ... (no visual grouping)
```

**Problems identified:**
1. **No visual grouping** — Cannot tell which bookings belong to the same series
2. **Scattered cards** — If user has multiple recurring series + one-offs, agenda is noisy
3. **No series-level actions** — Must modify/cancel each session individually

**Recommended Frame 2.1 (Target):**
```
[Agenda — Upcoming Sessions — Grouped]
    
    Recurring Packages:
    ├── 📦 "Weekly with Dr. Silva" (4 sessions remaining)
    │   ├── Next: Seg, 21 Abr, 10:00
    │   ├── Following: Seg, 28 Abr, 10:00
    │   └── [Expand ▼] / [Manage]
    │
    └── 📦 "Biweekly with Carla Mendes" (2 sessions remaining)
        ├── Next: Qui, 24 Abr, 14:00
        └── [Expand ▼] / [Manage]
    
    Individual Sessions:
    ├── Sessão única: Sex, 25 Abr, 16:00 — Dr. Silva
    └── ...
```

---

#### Frame 2.2: Recurring Management Modal

**Where:** New component needed  
**Current State:** Does not exist. User must modify sessions one by one.

**Recommended Frame 2.2 (Target):**
```
[Recurring Management Modal — /agenda?manageRecurring=[parentId]]
    
    Header:
    ├── "Pacote recorrente com [Pro Name]"
    ├── "Weekly on Mondays at 10:00"
    └── "3 of 8 sessions remaining"
    
    Session list:
    ├── [✓] Concluída — 7 Abr, 10:00
    ├── [✓] Concluída — 14 Abr, 10:00
    ├── [→] Próxima — 21 Abr, 10:00
    ├── [○] Agendada — 28 Abr, 10:00
    │   └── [Remarcar esta sessão] [Cancelar esta sessão]
    ├── [○] Agendada — 5 Mai, 10:00
    └── [○] Agendada — 12 Mai, 10:00
    
    Series actions:
    ├── [Alterar horário de todas] (affects future sessions)
    ├── [Pausar pacote] (temporarily skip all)
    ├── [Cancelar pacote] (cancel all future sessions)
    └── Renewal: "Renova em 12 Mai. [Cancelar renovação automática]"
```

---

### PHASE 3: MODIFICATION

---

#### Frame 3.1: Reschedule Single Session

**Where:** `components/booking/BookingActions.tsx`  
**Current State:** User clicks "Remarcar" → datetime picker → submit. No scope selection.

**Recommended Frame 3.1 (Target):**
```
[Reschedule Flow — Recurring Context]
    ├── User clicks "Remarcar"
    ├── Modal: "What do you want to reschedule?"
    │   ├── (○) Only this session (21 Abr)
    │   └── (○) All future sessions from this one
    ├── If "Only this": standard reschedule flow
    └── If "All future": warn about pro availability for all dates
```

---

#### Frame 3.2: Cancel Scope Selection

**Where:** `components/booking/BookingActions.tsx`  
**Current State:** "Tem certeza que deseja cancelar?" — ambiguous scope.

**Recommended Frame 3.2 (Target):**
```
[Cancel Flow — Recurring]
    ├── User clicks "Cancelar" on recurring child booking
    ├── Modal: "Cancel session or entire series?"
    │   ├── [Cancelar apenas esta sessão]
    │   │   └── Refund: prorated based on cancellation policy
    │   └── [Cancelar todas as sessões futuras]
    │       └── Refund: prorated for all future sessions
    ├── Reason input (optional)
    └── Confirmation: "R$ XXX will be refunded within 5-10 business days."
```

---

### PHASE 4: RENEWAL

---

#### Frame 4.1: Renewal Notification

**Where:** System event  
**Current State:** Undocumented.

**Recommended Frame 4.1 (Target):**
```
[Renewal Notification — T-7 days]
    ├── "Your recurring package with [Pro] renews in 7 days"
    ├── "Last session: [Date]. Renewal creates 8 new sessions."
    ├── "Total: R$ X,XXX"
    ├── [Renew automatically] (default if auto-renew on)
    ├── [Modify renewal] (change cadence, count, or cancel)
    └── [Cancel renewal]
```

---

## 3. Recurring State Machine

### Booking Types

| Type | Description | Parent/Child |
|------|-------------|--------------|
| `one_off` | Single session | Standalone |
| `recurring_parent` | Series metadata | Parent |
| `recurring_child` | Individual session in series | Child of parent |
| `batch` | Multiple manually selected dates | Standalone group |

### Parent Status Lifecycle

```
active ──[all children completed/cancelled]──→ completed
    │
    ├──[user pauses]──→ paused ──[user resumes]──→ active
    ├──[user cancels]──→ cancelled
    └──[renewal fails/payment issue]──→ payment_failed ──[resolved]──→ active
```

### Child Status Lifecycle

Same as regular booking: `pending_confirmation` → `confirmed` → `completed` / `cancelled` / `no_show`

---

## 4. Business Rules

### Cancellation Policy for Recurring

| Action | Notice Required | Refund |
|--------|-----------------|--------|
| Cancel single session | >24h before that session | 100% of that session |
| Cancel single session | <24h before | 0% |
| Cancel entire series | Anytime | Prorated for all future sessions |
| Pro cancels single | Anytime | 100% + platform apology |
| Pro cancels series | Anytime | 100% of all future |

### Modification Rules

| Change | Allowed | Notice |
|--------|---------|--------|
| Reschedule single session | Yes, if slot available | >24h |
| Reschedule all future | Yes, if slots available | >24h before next |
| Change time of series | Yes | Affects future only |
| Change pro | No | Must cancel + rebook |
| Pause series | Yes | Immediate |

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: No Visual Grouping in Agenda
**Severity:** Critical  
**Impact:** Users with recurring bookings have chaotic agendas  
**Fix:** Implement recurring package cards with expand/collapse.

#### C2: No Recurring Management UI
**Severity:** Critical  
**Impact:** Cannot manage series without contacting support  
**Fix:** Build recurring management modal accessible from agenda.

#### C3: Cancellation Scope Is Ambiguous
**Severity:** High  
**Impact:** Users accidentally cancel entire series or only one session unintentionally  
**Fix:** Explicit scope selection modal on every cancel action for recurring children.

### High Priority

#### H1: No Calendar Preview During Setup
**Severity:** High  
**Impact:** Users don't know which dates they're committing to  
**Fix:** Generate and display all dates before submit.

#### H2: No .ics Export for All Sessions
**Severity:** Medium  
**Impact:** Users forget recurring sessions  
**Fix:** Generate .ics with all recurring dates on success screen.

#### H3: No Renewal Flow
**Severity:** Medium  
**Impact:** Series ends without warning  
**Fix:** T-7 and T-1 renewal notifications with modify/cancel CTAs.

---

## 6. Implementation Plan

### Phase 1: Agenda Grouping (Week 1)

| Task | File | Effort |
|------|------|--------|
| Recurring package card component | `components/agenda/RecurringPackageCard.tsx` | 2 days |
| Group bookings by parent in agenda | `app/(app)/agenda/page.tsx` | 1 day |
| Expand/collapse interaction | `components/agenda/RecurringPackageCard.tsx` | 1 day |

### Phase 2: Management Modal (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Recurring management modal | `components/agenda/RecurringManagementModal.tsx` | 3 days |
| Single session reschedule from modal | `lib/actions/manage-booking.ts` | 1 day |
| Series pause/resume | `lib/actions/manage-booking.ts` | 1 day |

### Phase 3: Setup Enhancement (Week 2-3)

| Task | File | Effort |
|------|------|--------|
| Calendar preview in booking form | `components/booking/BookingForm.tsx` | 2 days |
| Conflict detection preview | `lib/booking/recurrence-engine.ts` | 1 day |
| Enhanced success screen | `components/booking/BookingForm.tsx` | 1 day |
| .ics multi-event generation | `lib/calendar/ics-generator.ts` | 1 day |

### Phase 4: Cancellation Scope (Week 3)

| Task | File | Effort |
|------|------|--------|
| Cancel scope modal | `components/booking/CancelScopeModal.tsx` | 1 day |
| Prorated refund calculation | `lib/actions/manage-booking.ts` | 1 day |
| Update booking actions | `components/booking/BookingActions.tsx` | 1 day |

### Phase 5: Renewal (Week 4)

| Task | File | Effort |
|------|------|--------|
| Renewal cron job | `/api/cron/recurring-renewal` | 1 day |
| Renewal notification templates | `lib/email/templates/recurring.ts` | 1 day |
| Renewal UI in management modal | `components/agenda/RecurringManagementModal.tsx` | 1 day |

---

## Related Documents

- `docs/product/journeys/search-booking.md` — Parent booking journey
- `lib/booking/recurrence-engine.ts` — Backend engine
- `lib/booking/recurring-deadlines.ts` — Deadline calculations


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
