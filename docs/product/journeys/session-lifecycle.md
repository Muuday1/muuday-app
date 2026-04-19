# Journey: Session Lifecycle (Unified)

**Status:** Canonical — replaces `session-management.md` + `video-session-execution.md` + trust-session fragments  
**Last updated:** 2026-04-19  
**Scope:** End-to-end post-booking experience from confirmation to review/dispute resolution  
**Actors:** User (client), Professional, System (cron/automation), Admin/Ops  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Phase Map](#2-phase-map)
3. [Frame-by-Frame Analysis](#3-frame-by-frame-analysis)
4. [State Machine](#4-state-machine)
5. [Inter-Journey Handoffs](#5-inter-journey-handoffs)
6. [Deep Review & Recommendations](#6-deep-review--recommendations)
7. [Implementation Plan](#7-implementation-plan)

---

## 1. Executive Summary

This document unifies three previously fragmented journeys into one canonical source of truth for the entire post-booking user experience. The session lifecycle spans from the moment a booking is confirmed until the review period closes and any disputes are resolved.

**Critical insight from frame-by-frame review:**
> The current implementation has **strong backend state management** but **weak frontend lifecycle visualization**. Users and professionals cannot see where they are in the session journey, which creates anxiety, no-shows, and support tickets.

---

## 2. Phase Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SESSION LIFECYCLE PHASES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: PRE-SESSION                                                       │
│  ├── Confirmation (auto or manual)                                          │
│  ├── Reminders (multi-touch, timezone-safe)                                 │
│  └── Preparation (join window, device check, session link)                  │
│                                                                             │
│  PHASE 2: SESSION WINDOW                                                    │
│  ├── Join availability (20 min before → 4h after)                           │
│  ├── Waiting room / lobby                                                   │
│  ├── Active session (Agora video)                                           │
│  └── Session end (manual or auto)                                           │
│                                                                             │
│  PHASE 3: POST-SESSION                                                      │
│  ├── Completion marking                                                     │
│  ├── Review window (opens immediately, closes after N days)                 │
│  └── Review submission                                                      │
│                                                                             │
│  PHASE 4: EXCEPTION                                                         │
│  ├── No-show (user or professional)                                         │
│  ├── Dispute initiation                                                     │
│  └── Resolution (admin case queue)                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frame-by-Frame Analysis

### PHASE 1: PRE-SESSION

---

#### Frame 1.1: Booking Confirmation (System Event)

**Where:** Backend — `lib/actions/booking.ts`, `lib/actions/request-booking.ts`  
**Current State:** Booking status transitions to `confirmed` (auto-accept) or `pending_confirmation` (manual). User sees result on success screen.  
**What happens today:**
- Direct booking: success screen shows "Sua sessão foi agendada" + context about confirmation mode
- Request booking: professional receives in their agenda inbox
- User receives NO immediate notification (placeholder `/mensagens`)
- Professional receives NO immediate notification (only via agenda refresh)

**Frame-by-frame breakdown:**
```
[Server: booking inserted with status]
    ↓
[Success screen rendered — Frame 1.1a]
    ├── Green checkmark
    ├── "Sua sessão foi agendada"
    ├── Confirmation mode info box (auto vs manual)
    ├── Two CTAs: "Ver minha agenda" / "Buscar mais profissionais"
    └── NO: "Add to calendar", "Share", "Session details summary"
    ↓
[Agenda page — Frame 1.1b]
    ├── Booking appears in upcoming list
    ├── Status badge: "Aguardando confirmação" or "Confirmado"
    └── NO: timeline, countdown, or next-action guidance
```

**Problems identified:**
1. **No calendar integration for user** — Cannot add to Google/Outlook/Apple Calendar
2. **No session summary on success** — User doesn't have a shareable/printable confirmation
3. **No immediate notification** — Platform feels dead after booking
4. **Professional has no push notification** — Must manually check agenda
5. **No "what happens next" guidance** — Especially for manual-accept bookings

**Recommended Frame 1.1 (Target):**
```
[Success Screen]
    ├── 🎉 Animated confirmation
    ├── Session summary card (pro name, date, time, timezone, duration, price)
    ├── "What happens next" timeline preview:
    │   ├── ✅ Booked
    │   ├── ⏳ Awaiting confirmation (if manual) / ✅ Confirmed (if auto)
    │   ├── ⏳ Reminder 24h before
    │   └── ⏳ Session day
    ├── "Add to my calendar" buttons (Google/Outlook/Apple .ics)
    ├── "Share this booking" (copy link or WhatsApp)
    ├── "Session requirements" (if pro requires purpose/materials)
    └── CTAs: "View agenda" (primary) / "Browse more" (secondary)
```

---

#### Frame 1.2: Manual Confirmation (Professional Action)

**Where:** `app/(app)/agenda/page.tsx` + `components/agenda/ProfessionalAgendaPage.tsx`  
**Current State:** Professional sees pending confirmations in agenda with SLA badges.

**Frame-by-frame breakdown:**
```
[Professional opens /agenda]
    ↓
[Agenda view switcher: Overview / Pendências / Requests / Regras]
    ↓
[Overview tab shows stat card: "X aguardando confirmação"]
    ↓
[Professional clicks booking card]
    ├── Booking details: name, date, time, duration
    ├── <BookingActions> renders: [Confirmar] [Cancelar]
    └── NO: client context (first-time? message? objective?)
    ↓
[Professional clicks "Confirmar"]
    ├── Button shows spinner
    ├── Green feedback: "Agendamento confirmado"
    └── Status badge changes to "Confirmado"
```

**Problems identified:**
1. **No client context on confirmation** — Pro doesn't see session purpose or if client is new
2. **No SLA urgency visualization** — "Expira em 12h" is text-only; no color progression
3. **No batch confirm** — Must confirm one by one
4. **No auto-reminder to professional** — If they forget, booking expires

**Recommended Frame 1.2 (Target):**
```
[Professional Agenda — Inbox View]
    ├── Filter: Todas / Aguardando confirmação / Solicitações / Sessões de hoje
    ├── Pending cards sorted by urgency (color: green → yellow → red as SLA approaches)
    ├── Card shows:
    │   ├── Avatar + client name
    │   ├── "Primeira sessão" badge (if new client)
    │   ├── Session objective (if provided)
    │   ├── SLA countdown with visual urgency
    │   └── [Confirmar] [Ver detalhes] [Propor outro horário]
    ├── Batch select: checkbox to confirm multiple
    └── Push notification: "Você tem 2 confirmações pendentes"
```

---

#### Frame 1.3: Reminders

**Where:** `/api/cron/booking-reminders`, `lib/ops/booking-reminders.ts`  
**Current State:** Cron job runs and presumably sends emails/notifications. Details undocumented.

**Frame-by-frame breakdown (inferred):**
```
[System cron triggers]
    ↓
[Identify bookings needing reminders]
    ├── 24h before session
    ├── 1h before session
    └── 15 min before session (join window opens)
    ↓
[Send notification — inferred]
    ├── Email (via Resend templates)
    └── In-app notification (undocumented, likely not implemented)
    ↓
[User receives... what?]
    └── Unknown — no journey documentation for notification content
```

**Problems identified:**
1. **Reminder content is undocumented** — We don't know what users receive
2. **No in-app notification** — Only email, which may go to spam
3. **No WhatsApp/SMS fallback** — For critical reminders
4. **No reminder customization** — Pro cannot set their own reminder cadence
5. **No "join now" deep link** — Reminder should one-tap open session

**Recommended Frame 1.3 (Target):**
```
[Reminder Cadence]
    ├── T-24h: Email + In-app — "Your session with [Pro] is tomorrow at [time]"
    ├── T-1h: In-app + Push (future) — "Starting in 1 hour. Test your device."
    ├── T-15min: In-app + Push — "Join now" (deep link to /sessao/[id])
    └── T+1h (if not joined): "Missed session?" with reschedule/dispute CTAs

[Reminder Content Template]
    ├── Professional photo + name
    ├── Session date/time in user's timezone
    ├── "Join session" button (deep link)
    ├── "Add to calendar" (if not already)
    ├── "Session link" (if pro provided external link)
    └── "Need to reschedule?" link
```

---

#### Frame 1.4: Session Preparation

**Where:** `app/(app)/agenda/page.tsx` — both user and professional  
**Current State:** "Entrar na sessão" button appears. No pre-join preparation.

**Frame-by-frame breakdown:**
```
[User/Pro opens /agenda near session time]
    ↓
[Booking card shows]
    ├── Date, time, other party name
    ├── Status badge: "Confirmado"
    ├── [Entrar na sessão] button with Video icon
    └── NO: device check, connection test, materials list, countdown
```

**Problems identified:**
1. **No pre-join device check** — User discovers camera/mic issues at session time
2. **No session materials** — If pro requested documents/prep, not visible here
3. **No countdown** — User doesn't know exactly when join window opens
4. **No connection quality indicator** — Can't predict if connection will be stable

**Recommended Frame 1.4 (Target):**
```
[Agenda Card — Within 24h of Session]
    ├── Countdown: "Starts in 4h 23min"
    ├── [Test my camera and microphone] — opens device check modal
    ├── Session materials (if pro uploaded): "Download prep document"
    ├── Session link (if pro provided): "Alternative link"
    ├── [Entrar na sessão] — disabled until join window, then prominent
    └── "Add 15min reminder" toggle
```

---

### PHASE 2: SESSION WINDOW

---

#### Frame 2.1: Session Page Entry

**Where:** `app/(app)/sessao/[bookingId]/page.tsx`  
**Current State:** Server component gates access. Shows info card + VideoSession component (if in window) or warning (if outside).

**Frame-by-frame breakdown:**
```
[User navigates to /sessao/[bookingId]]
    ↓
[Server validates]
    ├── Auth check → redirect /login
    ├── Participant check → redirect /agenda
    ├── Booking exists → notFound()
    ├── Status check → must be confirmed or completed
    └── Start time check → must have start_time
    ↓
[Page renders]
    ├── Back link: "Voltar para agenda"
    ├── Info card: "Sessão por video" + participants + join window time
    └── Conditional:
        ├── BEFORE window: amber warning "A entrada fica disponível 20 minutos antes..."
        ├── AFTER window (+4h): amber warning "Esta sessão já encerrou."
        └── IN window: <VideoSession bookingId={...} />
```

**Problems identified:**
1. **No pre-join screen** — Immediately tries to join Agora; no preparation UX
2. **Amber warning is static text** — No countdown, no dynamic messaging
3. **No "I'm ready" signal** — Both parties don't know if the other is online
4. **No fallback if Agora fails** — Should suggest alternative link or reschedule
5. **No session agenda/materials visible** — Should show session purpose/context

**Recommended Frame 2.1 (Target):**
```
[/sessao/[id] — Pre-Join Screen (NEW)]
    ├── Header: "Session with [Pro Name]" + countdown
    ├── Session context card:
    │   ├── Date/time in both timezones
    │   ├── Duration
    │   ├── Session objective (if user provided)
    │   └── Session materials (download links)
    ├── Participant readiness:
    │   ├── You: "Ready ✓" (after device check)
    │   └── [Pro Name]: "Waiting..." / "Ready ✓" / "Joined"
    ├── Device check panel:
    │   ├── Camera preview
    │   ├── Mic test (record 3s, playback)
    │   ├── Speaker test
    │   └── Connection quality (ping/latency)
    ├── [Join Session] — enabled after device check passes
    └── Fallback: "Can't connect? [Use alternative link] [Report issue]"
    
[/sessao/[id] — Outside Window]
    ├── Before: Countdown + "Come back at [time]"
    ├── After (within dispute window): "Session ended. [Leave review] [Report issue]"
    └── After (dispute window closed): "Session ended. [View history]"
```

---

#### Frame 2.2: Video Session (Agora)

**Where:** `components/booking/VideoSession.tsx`  
**Current State:** Agora Web SDK initialization. Local + remote video tiles. Mic/camera toggles.

**Frame-by-frame breakdown:**
```
[VideoSession mounts]
    ↓
[Fetches Agora token via /api/agora/token]
    ├── POST with bookingId
    ├── Server validates: participant, window, booking status
    └── Returns RTC token (2h expiry)
    ↓
[Initializes Agora client]
    ├── Joins channel
    ├── Creates local audio/video tracks
    └── Publishes tracks
    ↓
[UI renders]
    ├── Status card: connection status + token expiry
    ├── Local video: "Você" label + your camera
    ├── Remote video: "Participantes" + grid of remote users
    │   └── Empty: "Aguardando outro participante entrar..."
    └── Controls: [Mic toggle] [Camera toggle]
```

**Problems identified:**
1. **No waiting room UX** — "Aguardando outro participante" is just text
2. **No chat during wait** — Could exchange messages before/after session
3. **No session timer** — Cannot see elapsed time
4. **No recording indicator** — If sessions are recorded, should show consent
5. **No in-session help** — If connection degrades, no troubleshooting
6. **No session notes** — Pro cannot take notes during session
7. **No "extend session" option** — If running over, cannot easily add time
8. **Token expiry visible but not actionable** — "Token expires in 1:23:45" is noise

**Recommended Frame 2.2 (Target):**
```
[Video Session UI]
    ├── Header bar:
    │   ├── Session timer (elapsed / remaining)
    │   ├── Connection quality indicator (green/yellow/red dot)
    │   └── [Minimize] [Fullscreen] [End session]
    ├── Main area:
    │   ├── Large remote video (pro dominates for client view)
    │   ├── Picture-in-picture local video (draggable)
    │   └── Screen share tile (if enabled)
    ├── Waiting state:
    │   ├── "Dr. Silva will join shortly"
    │   ├── [Send message] — chat while waiting
    │   └── [Test device again]
    ├── Side panel (collapsible):
    │   ├── Chat history
    │   ├── Session notes (pro-only, synced)
    │   └── Session materials
    └── Controls:
        ├── [Mic] [Camera] [Screen share] [Chat]
        ├── [Raise hand] (for group sessions, future)
        └── [End session] — with confirmation "End for everyone?"
        
[Session End Flow]
    ├── Confirmation: "End session for both parties?"
    ├── Post-session summary:
    │   ├── Duration: 47 min of 50 min scheduled
    │   ├── [Leave review] CTA
    │   └── [Back to agenda]
```

---

### PHASE 3: POST-SESSION

---

#### Frame 3.1: Session Completion

**Where:** `components/booking/BookingActions.tsx` — `completeBooking` action  
**Current State:** Professional clicks "Concluir sessão" after session end time. Status → `completed`.

**Frame-by-frame breakdown:**
```
[Professional agenda — past session]
    ├── Booking card shows status "Confirmado" (past)
    ├── [Concluir sessão] button visible
    └── [Cliente no-show] button visible
    ↓
[Pro clicks "Concluir sessão"]
    ├── Server validates: confirmed status, session end time passed
    ├── Status → completed
    └── Feedback: "Sessão concluída."
```

**Problems identified:**
1. **No auto-complete** — If pro forgets to mark complete, booking stays "confirmed" forever
2. **No completion confirmation for user** — User doesn't know pro marked it complete
3. **No session duration stored** — Actual vs planned duration not captured
4. **No no-show automation** — System doesn't auto-detect no-shows

**Recommended Frame 3.1 (Target):**
```
[Auto-Complete Logic]
    ├── T+30min after scheduled end: auto-mark "completed" if both joined
    ├── T+15min after scheduled end: prompt pro "Did the session happen?"
    │   ├── [Yes, mark complete]
    │   ├── [No, client didn't show] → no-show flow
    │   └── [We rescheduled] → manual override
    └── If neither party joined: auto-mark "no_show" after T+1h

[Completion Notification]
    ├── User receives: "Your session with [Pro] is complete. [Leave review]"
    └── Pro receives: "Session marked complete. Earnings will be available in [X days]."
```

---

#### Frame 3.2: Review Submission

**Where:** `app/(app)/avaliar/[bookingId]/page.tsx` + `ReviewForm.tsx`  
**Current State:** User submits 1-5 stars + optional comment. Review stored with `is_visible=false`.

**Frame-by-frame breakdown:**
```
[User navigates to /avaliar/[id]]
    ↓
[Server validates]
    ├── Auth check → /login
    ├── Booking ownership check
    ├── Status must be 'completed'
    └── existingReview check
    ↓
[If already reviewed]
    ├── Success emoji
    ├── "Avaliação enviada!"
    ├── Star count + comment
    ├── "Ficará visível após revisão."
    └── [Voltar à agenda]
    ↓
[If not reviewed]
    ├── Professional card: avatar + name + session date
    ├── <ReviewForm>:
    │   ├── 5 star buttons (hover: "Muito ruim" → "Excelente")
    │   ├── Comment textarea (1000 chars, live counter)
    │   └── [Enviar avaliação]
    └── On submit: spinner → "🎉 Obrigado!" → router.refresh()
```

**Problems identified:**
1. **No review guidance** — Empty textarea, no prompts ("What went well?", "What could improve?")
2. **No structured categories** — Just stars + free text. Missing: punctuality, knowledge, communication
3. **No visibility status after submit** — User doesn't know review is pending moderation
4. **No review reminder** — If user doesn't review immediately, no follow-up
5. **No professional response invitation** — Pro should be able to respond to reviews

**Recommended Frame 3.2 (Target):**
```
[Review Form — Enhanced]
    ├── Header: "How was your session with [Pro]?"
    ├── Overall rating: 5 stars + labels
    ├── Structured ratings (optional):
    │   ├── Punctuality: [stars]
    │   ├── Knowledge: [stars]
    │   └── Communication: [stars]
    ├── Guided prompts:
    │   ├── "What did [Pro] help you with?"
    │   ├── "What went well?"
    │   └── "What could be improved?"
    ├── Public comment (1000 chars)
    ├── Private feedback to Muuday (optional, 500 chars)
    ├── Consent: "I confirm this review reflects my genuine experience"
    └── [Submit review]
    
[Post-Submit State]
    ├── "Thank you! Your review is pending moderation."
    ├── Status tracker: Submitted → Under Review → Published
    ├── "You'll be notified when it's live."
    └── [Back to agenda] [Book another session]
```

---

### PHASE 4: EXCEPTION

---

#### Frame 4.1: No-Show Handling

**Where:** `components/booking/BookingActions.tsx`  
**Current State:** User or pro can report no-show. Refund applied. Ops notification created.

**Frame-by-frame breakdown:**
```
[Agenda — past confirmed session]
    ├── [Reportar no-show profissional] (user view)
    └── [Cliente no-show] (pro view)
    ↓
[Click → immediate server action]
    ├── Status → no_show
    ├── 100% refund (if user reported pro no-show)
    ├── Notification to ops team
    └── Feedback banner
```

**Problems identified:**
1. **No evidence collection** — Just a button click, no "Did you wait? For how long?"
2. **No grace period** — Should distinguish "5 min late" from "never showed"
3. **No automatic no-show detection** — System should detect if neither joined
4. **No strike accumulation visible** — Pro doesn't see their no-show history
5. **No user compensation beyond refund** — Credit or priority rebooking?

**Recommended Frame 4.1 (Target):**
```
[No-Show Report Flow]
    ├── Trigger: "Report no-show" button (available T+15min after start)
    ├── Form:
    │   ├── "How long did you wait?" [15min / 30min / 45min / 60min]
    │   ├── "Did you try contacting them?" [Yes/No]
    │   ├── Evidence upload (screenshot of empty call, messages)
    │   └── "Describe what happened" (textarea)
    ├── On submit:
    │   ├── Status → no_show
    │   ├── Automatic refund initiated
    │   ├── Case created in admin queue
    │   └── "We'll review this within 24h."
    └── Professional side:
        ├── If reported: "No-show claim filed. Respond with evidence."
        └── Counter-evidence upload (screenshots, messages)
```

---

#### Frame 4.2: Dispute Initiation

**Where:** Not explicitly implemented in UI yet  
**Current State:** Disputes mentioned in architecture but no user-facing flow.

**Recommended Frame 4.2 (Target):**
```
[Dispute Entry Points]
    ├── From agenda: "Report issue" on completed/cancelled/no-show bookings
    ├── From review page: "Dispute charge" link
    └── From email: deep link to dispute form
    
[Dispute Form]
    ├── "What happened?" [select]
    │   ├── Professional didn't show
    │   ├── Session quality was poor
    │   ├── Charged incorrectly
    │   ├── Professional was inappropriate
    │   └── Other
    ├── "Describe the issue" (textarea, 2000 chars)
    ├── Evidence upload (up to 3 files)
    ├── "What resolution do you want?"
    │   ├── Full refund
    │   ├── Partial refund
    │   ├── Reschedule free
    │   └── Just report (no refund)
    └── [Submit dispute]
    
[Post-Submit]
    ├── Case ID assigned
    ├── "We're reviewing your case. Response within 48h."
    ├── Case status tracker in profile
    └── Email confirmation with case ID
```

---

## 4. State Machine

### Booking Status Transitions (UI-visible)

```
confirmed ──[session time passes]──→ completed ──[review window]──→ reviewed
     │                                    │
     ├──[pro clicks cancel]──────→ cancelled                           │
     ├──[user clicks cancel]─────→ cancelled                           │
     ├──[pro reports no-show]────→ no_show ──[auto refund]────────────┘
     ├──[user reports no-show]───→ no_show ──[auto refund]────────────┘
     ├──[user reschedules]───────→ rescheduled ──[new booking]────────→
     └──[dispute filed]──────────→ disputed ──[admin resolves]────────→
```

### Internal vs UI States

| Internal Status | UI Label (User) | UI Label (Pro) | Visible Actions |
|-----------------|-----------------|----------------|-----------------|
| `pending_confirmation` | Aguardando confirmação | Aguardando sua confirmação | Pro: Confirm/Cancel |
| `confirmed` | Confirmado | Confirmado | Both: Cancel, Reschedule. Pro: Add link, Complete. Past: No-show |
| `completed` | Concluído | Concluído | User: Review. Both: View history |
| `cancelled` | Cancelado | Cancelado | Both: View history, Rebook |
| `no_show` | Não compareceu | Não compareceu | Both: View history, Dispute |
| `rescheduled` | Remarcado | Remarcado | Both: View new booking |

---

## 5. Inter-Journey Handoffs

| Handoff | From | To | Trigger | Data Passed |
|---------|------|-----|---------|-------------|
| H1 | Booking created | Session lifecycle | `createBooking()` success | bookingId, status, scheduledAt |
| H2 | Booking confirmed | Pre-session phase | Status → `confirmed` | Confirmation triggers reminder cron |
| H3 | Reminder cron | Notification inbox | Time-based | bookingId, reminder type |
| H4 | Join window opens | Session execution | `now >= start - 20min` | bookingId, token request |
| H5 | Session ends | Post-session | Status → `completed` | bookingId, review window opens |
| H6 | Review submitted | Trust/Moderation | Insert into `reviews` | reviewId, moderation queue |
| H7 | No-show reported | Trust/Finance | Status → `no_show` | caseId, refund trigger |
| H8 | Dispute filed | Admin case queue | Insert into `cases` | caseId, bookingId, evidence |

---

## 6. Deep Review & Recommendations

### Critical Issues (Fix Immediately)

#### C1: Missing Pre-Join Experience
**Severity:** Critical  
**Impact:** No-shows, technical failures, poor first impression  
**Evidence:** `/sessao/[id]` immediately renders Agora with no preparation. No device check. No waiting room.  
**Fix:** Build pre-join screen with device test, connection quality, participant readiness.

#### C2: No Lifecycle Visualization
**Severity:** Critical  
**Impact:** User anxiety, support tickets, churn  
**Evidence:** Agenda shows static status badges. No timeline. No "what happens next."  
**Fix:** Add `BookingTimeline` component to every booking detail view.

#### C3: Notification Ghost Journey
**Severity:** Critical  
**Impact:** Platform feels dead, users miss sessions  
**Evidence:** `/mensagens` is placeholder. No documented notification content. No in-app inbox.  
**Fix:** Implement notification/inbox journey (see `notification-inbox-lifecycle.md`).

### High Priority

#### H1: No Auto-Complete / Auto No-Show Detection
**Severity:** High  
**Impact:** Data quality, payout delays, manual ops overhead  
**Fix:** Cron job to auto-complete sessions where both parties joined. Auto no-show if neither joined.

#### H2: Review Flow Is Underdeveloped
**Severity:** High  
**Impact:** Low review volume, poor trust signals  
**Fix:** Guided review form, review reminders, structured categories, moderation visibility.

#### H3: No Session Context in Video Call
**Severity:** High  
**Impact:** Disjointed experience, pro unprepared  
**Fix:** Show session objective, materials, and client notes in session UI side panel.

### Medium Priority

#### M1: No Calendar Export
**Severity:** Medium  
**Impact:** User forgets sessions, no-shows  
**Fix:** Add .ics generation + Google/Outlook calendar links on success screen and reminders.

#### M2: No Batch Confirm for Professionals
**Severity:** Medium  
**Impact:** Professional friction  
**Fix:** Checkbox + "Confirm selected" in professional inbox.

---

## 7. Implementation Plan

### Phase 1: Foundation (Week 1)

| Task | File(s) | Effort | Owner |
|------|---------|--------|-------|
| Build `BookingTimeline` component | `components/booking/BookingTimeline.tsx` | 2 days | Frontend |
| Integrate timeline into agenda | `app/(app)/agenda/page.tsx` | 1 day | Frontend |
| Document notification content templates | `lib/email/templates/session.ts` | 1 day | Product |

### Phase 2: Pre-Join Experience (Week 2)

| Task | File(s) | Effort | Owner |
|------|---------|--------|-------|
| Build pre-join screen | `app/(app)/sessao/[bookingId]/page.tsx` refactor | 3 days | Frontend |
| Device check modal | `components/session/DeviceCheckModal.tsx` | 2 days | Frontend |
| Connection quality test | `/api/agora/token` + latency check | 1 day | Backend |

### Phase 3: Session Enhancement (Week 3)

| Task | File(s) | Effort | Owner |
|------|---------|--------|-------|
| Session timer + controls | `components/booking/VideoSession.tsx` | 2 days | Frontend |
| In-session side panel | `components/session/SessionSidePanel.tsx` | 2 days | Frontend |
| Chat while waiting | Supabase realtime + UI | 2 days | Full-stack |

### Phase 4: Post-Session Hardening (Week 4)

| Task | File(s) | Effort | Owner |
|------|---------|--------|-------|
| Auto-complete cron | `/api/cron/session-completion` | 1 day | Backend |
| Enhanced review form | `components/booking/ReviewForm.tsx` | 2 days | Frontend |
| Review reminder flow | Inngest function | 1 day | Backend |
| No-show evidence collection | `components/booking/NoShowReportForm.tsx` | 2 days | Frontend |

### Phase 5: Dispute Foundation (Week 5)

| Task | File(s) | Effort | Owner |
|------|---------|--------|-------|
| Dispute form UI | `components/booking/DisputeForm.tsx` | 2 days | Frontend |
| Case creation backend | `lib/actions/dispute.ts` | 2 days | Backend |
| Case status tracker | `app/(app)/perfil/page.tsx` (add tab) | 1 day | Frontend |

---

## Related Documents

- `docs/product/journeys/search-booking.md` — Parent booking journey
- `docs/product/journeys/notification-inbox-lifecycle.md` — Notification triggers
- `docs/product/journeys/review-moderation-lifecycle.md` — Review post-submission
- `docs/product/journeys/operator-case-resolution.md` — Dispute resolution
- `lib/booking/state-machine.ts` — Internal state transitions
- `lib/actions/manage-booking.ts` — Server actions
