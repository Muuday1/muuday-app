# Journey: Notification & Inbox Lifecycle

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** All notification triggers, delivery, display, and actionability across the platform  
**Actors:** User, Professional, Admin, System  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Notification Taxonomy](#3-notification-taxonomy)
4. [Frame-by-Frame: Inbox UI](#4-frame-by-frame-inbox-ui)
5. [Frame-by-Frame: Delivery Flows](#5-frame-by-frame-delivery-flows)
6. [Deep Review & Recommendations](#6-deep-review--recommendations)
7. [Implementation Plan](#7-implementation-plan)

---

## 1. Executive Summary

Notifications are the **nervous system** of a marketplace. Today, Muuday has email templates (Resend) but lacks a unified notification architecture and a functional in-app inbox. This creates a "dead platform" feeling between bookings.

**Critical gap:**
> Users book a session, receive no confirmation notification, get no reminder, and must manually remember to join. Professionals don't know when bookings arrive unless they refresh their agenda.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRIGGER LAYER                    DISPATCH LAYER          CHANNEL LAYER     │
│  ┌─────────────┐                ┌─────────────┐         ┌─────────────┐    │
│  │ Booking     │──event──┐     │             │         │  In-app     │    │
│  │ created     │         │     │  Inngest    │──┬─────→│  inbox      │    │
│  └─────────────┘         │     │  dispatcher │  │      └─────────────┘    │
│  ┌─────────────┐         │     │             │  │      ┌─────────────┐    │
│  │ Booking     │──event──┼────→│  +          │  ├─────→│  Email      │    │
│  │ confirmed   │         │     │  Supabase   │  │      │  (Resend)   │    │
│  └─────────────┘         │     │  realtime   │  │      └─────────────┘    │
│  ┌─────────────┐         │     │  (future)   │  │      ┌─────────────┐    │
│  │ Session     │──event──┤     │             │  └─────→│  Push       │    │
│  │ reminder    │         │     └─────────────┘         │  (future)   │    │
│  └─────────────┘         │                             └─────────────┘    │
│  ┌─────────────┐         │                                                  │
│  │ Review      │──event──┘                                                  │
│  │ approved    │                                                            │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current State (As-Is)

| Component | Status | Notes |
|-----------|--------|-------|
| Email (Resend) | ✅ Active | Templates exist for booking, review, approval |
| In-app inbox | ❌ Placeholder | `/mensagens` shows only conversation context |
| Push notifications | ❌ Not implemented | Future |
| Realtime delivery | ❌ Not implemented | Would require Supabase realtime |
| Notification preferences | ❌ Not implemented | Users cannot opt out per type |

---

## 3. Notification Taxonomy

### By Actor

#### User Notifications

| ID | Event | Trigger | Priority | Channels | Deep Link |
|----|-------|---------|----------|----------|-----------|
| UN-01 | Booking created | `createBooking()` success | High | In-app, Email | `/agenda` |
| UN-02 | Booking confirmed | Pro clicks "Confirmar" | High | In-app, Email | `/agenda` |
| UN-03 | Booking declined | Pro declines / expiry | High | In-app, Email | `/agenda` |
| UN-04 | Booking cancelled | Either party cancels | High | In-app, Email | `/agenda` |
| UN-05 | Session reminder (24h) | Cron T-24h | Medium | In-app, Email | `/sessao/[id]` |
| UN-06 | Session reminder (1h) | Cron T-1h | High | In-app, Email | `/sessao/[id]` |
| UN-07 | Session joinable | Cron T-20min | High | In-app, Email | `/sessao/[id]` |
| UN-08 | Session completed | `completeBooking()` | Medium | In-app | `/avaliar/[id]` |
| UN-09 | Review reminder | T+1h after completion | Low | In-app, Email | `/avaliar/[id]` |
| UN-10 | Review published | Admin approves review | Low | In-app | `/profissional/[id]` |
| UN-11 | Request proposed | Pro offers alternative time | High | In-app, Email | `/agenda` |
| UN-12 | Payout processed | System | Low | Email | `/financeiro` |

#### Professional Notifications

| ID | Event | Trigger | Priority | Channels | Deep Link |
|----|-------|---------|----------|----------|-----------|
| PN-01 | New booking | `createBooking()` | High | In-app, Email | `/agenda` |
| PN-02 | New request | `createRequestBooking()` | High | In-app, Email | `/agenda` |
| PN-03 | Request accepted | User accepts proposal | High | In-app, Email | `/agenda` |
| PN-04 | Session reminder (24h) | Cron T-24h | Medium | In-app, Email | `/sessao/[id]` |
| PN-05 | Session reminder (1h) | Cron T-1h | High | In-app, Email | `/sessao/[id]` |
| PN-06 | Review received | User submits review | Low | In-app | `/dashboard` |
| PN-07 | Onboarding approved | Admin approves | High | In-app, Email | `/dashboard` |
| PN-08 | Adjustment requested | Admin requests changes | High | In-app, Email | `/dashboard?openOnboarding=1` |
| PN-09 | Payout available | Weekly payout batch | Medium | Email | `/financeiro` |

#### Admin Notifications

| ID | Event | Trigger | Priority | Channels |
|----|-------|---------|----------|----------|
| AN-01 | New pro pending review | `submit-review` | High | Email |
| AN-02 | New review pending moderation | `reviews.insert` | Medium | Email, In-app |
| AN-03 | No-show reported | `reportProfessionalNoShow` | High | Email, In-app |
| AN-04 | Dispute filed | `cases.insert` | High | Email, In-app |
| AN-05 | Payout failure | Stripe webhook | High | Email |

---

## 4. Frame-by-Frame: Inbox UI

### Current State

**Where:** `app/(app)/mensagens/page.tsx`  
**What exists:** A placeholder showing conversation context with a link to the professional profile. No actual inbox.

**Frame-by-frame:**
```
[/mensagens]
    ├── Page title: "Mensagens"
    ├── Placeholder text explaining messaging is limited
    └── Link to professional profile
```

### Target State: Notification Inbox

**Frame 4.1: Inbox List View**

```
[/mensagens — Reimagined as Notification Inbox]
    
    Header:
    ├── "Notificações" title
    ├── [Marcar todas como lidas] (if unread exist)
    └── Filter tabs: [Todas] [Não lidas] [Agendamentos] [Sistema]
    
    Notification list (grouped by date):
    ├── Hoje
    │   ├── 🔔 "Sua sessão com Dr. Silva começa em 1 hora"
    │   │   ├── Time: 14:30
    │   │   ├── [Entrar na sessão] button
    │   │   └── Unread dot (blue)
    │   ├── ✅ "Dr. Silva confirmou seu agendamento"
    │   │   ├── Time: 09:15
    │   │   └── [Ver agenda]
    │   └── 💬 "Você recebeu uma proposta de horário"
    │       ├── Time: 08:42
    │       └── [Ver solicitação]
    ├── Ontem
    │   └── ⭐ "Sua avaliação foi publicada"
    │       └── [Ver perfil]
    └── Esta semana
        └── 💰 "Pagamento processado: R$ 450,00"
            └── [Ver financeiro]
    
    Empty state (no notifications):
    ├── Illustration
    ├── "Você não tem notificações"
    └── "Quando houver novidades, aparecerão aqui."
```

**Frame 4.2: Notification Detail View (expandable)**

```
[User clicks notification]
    ├── Expands inline (accordion style) OR
    └── Navigates to detail page (for complex items)
    
    Expanded notification:
    ├── Full message text
    ├── Related entity preview (booking card, profile snippet)
    ├── Primary action button (context-aware)
    └── [Descartar] [Marcar como lida]
```

**Frame 4.3: Notification Preferences**

```
[/configuracoes — New "Notificações" tab]
    
    Channel preferences per category:
    ├── Agendamentos
    │   ├── [✓] In-app  [✓] Email  [ ] Push
    ├── Sessões
    │   ├── [✓] In-app  [✓] Email  [✓] Push
    ├── Financeiro
    │   ├── [✓] In-app  [✓] Email  [ ] Push
    └── Marketing
        ├── [ ] In-app  [ ] Email  [ ] Push
    
    Digest options:
    ├── [ ] Resumo diário (8h)
    └── [ ] Resumo semanal (segunda, 8h)
```

---

## 5. Frame-by-Frame: Delivery Flows

### Flow 1: Booking Confirmation Notification

```
[Trigger: createBooking() returns success]
    ↓
[Inngest receives event: booking.created]
    ↓
[Dispatcher logic]
    ├── Recipient: user (booker)
    ├── Priority: High
    ├── Channels: In-app + Email
    └── Content:
        ├── Title: "Sessão agendada com [Pro Name]"
        ├── Body: "[Date] às [Time] ([Timezone]). Duração: [Duration] min."
        ├── CTA: "Ver na agenda"
        └── Deep link: /agenda
    ↓
[In-app: Insert notification row]
    ├── notifications table: unread=true, type=booking_created
    └── Realtime update (if socket connected)
    ↓
[Email: Resend API call]
    ├── Template: booking-confirmation
    ├── To: user.email
    └── Send (non-blocking)
    ↓
[Professional notification (parallel)]
    ├── Trigger: same event
    ├── Content: "Novo agendamento: [User Name] em [Date] [Time]"
    └── CTA: "Confirmar agendamento" → /agenda
```

### Flow 2: Session Reminder

```
[Cron: /api/cron/booking-reminders runs every 15 min]
    ↓
[Identify bookings in reminder window]
    ├── T-24h: first reminder
    ├── T-1h: second reminder
    └── T-20min: join window reminder
    ↓
[For each matching booking]
    ├── User notification:
    │   ├── T-24h: "Lembrete: sua sessão é amanhã"
    │   ├── T-1h: "Começa em 1 hora"
    │   └── T-20min: "Já pode entrar na sessão"
    └── Professional notification:
        ├── T-24h: "Lembrete: sessão com [User] amanhã"
        ├── T-1h: "Começa em 1 hora"
        └── T-20min: "Já pode entrar na sessão"
    ↓
[Channel selection]
    ├── T-24h: Email + In-app
    ├── T-1h: Email + In-app + Push (future)
    └── T-20min: In-app + Push (future) + Email
    ↓
[Deep link: /sessao/[id]]
```

### Flow 3: Review Moderation

```
[Trigger: admin approves review]
    ↓
[Notification to reviewer (user)]
    ├── "Sua avaliação foi publicada"
    ├── Shows star rating snippet
    └── CTA: "Ver no perfil de [Pro]"
    ↓
[Notification to professional]
    ├── "Você recebeu uma nova avaliação"
    ├── Shows star rating
    └── CTA: "Ver no dashboard"
```

---

## 6. Deep Review & Recommendations

### Critical Issues

#### C1: No Functional Inbox
**Severity:** Critical  
**Impact:** Platform feels dead, users miss critical updates  
**Fix:** Repurpose `/mensagens` as notification inbox. Build notification table and UI.

#### C2: Notification Content Is Undocumented
**Severity:** Critical  
**Impact:** Inconsistent user experience, ops cannot validate  
**Fix:** This document defines all notification templates. Implement as code.

#### C3: No Realtime Delivery
**Severity:** High  
**Impact:** Professionals don't know about bookings until they refresh  
**Fix:** Supabase realtime on `notifications` table OR polling with SWR.

### High Priority

#### H1: No Notification Preferences
**Severity:** High  
**Impact:** Email fatigue, unsubscribe risk  
**Fix:** Add preferences panel in settings.

#### H2: Reminder Cron Is Undocumented
**Severity:** High  
**Impact:** May have gaps or timezone bugs  
**Fix:** Document reminder cadence. Add integration tests.

#### H3: No Deep Linking
**Severity:** High  
**Impact:** Users must navigate manually from notification  
**Fix:** Every notification includes `deepLink` field.

### Medium Priority

#### M1: No Push Notifications
**Severity:** Medium  
**Impact:** Mobile engagement low  
**Fix:** Plan for OneSignal or similar post-MVP.

#### M2: No Notification Grouping
**Severity:** Medium  
**Impact:** Inbox noise  
**Fix:** Group by entity (all notifications about booking #123 together).

---

## 7. Implementation Plan

### Phase 1: Data Model (Week 1)

```sql
-- notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL, -- booking_created, booking_confirmed, etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- { bookingId, professionalId, deepLink }
  channel TEXT NOT NULL DEFAULT 'in_app', -- in_app, email, push
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for unread count
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, read);
```

### Phase 2: Inbox UI (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Notification list component | `components/notifications/NotificationList.tsx` | 2 days |
| Notification item component | `components/notifications/NotificationItem.tsx` | 1 day |
| Mark read / dismiss actions | `lib/actions/notifications.ts` | 1 day |
| Repurpose /mensagens | `app/(app)/mensagens/page.tsx` | 1 day |
| Unread badge on nav | `components/layout/SidebarNav.tsx`, `MobileNav.tsx` | 1 day |

### Phase 3: Dispatch System (Week 2-3)

| Task | File | Effort |
|------|------|--------|
| Notification insert helper | `lib/notifications/dispatch.ts` | 2 days |
| Inngest notification function | `inngest/functions/notifications.ts` | 2 days |
| Email template mapping | `lib/email/templates/index.ts` | 1 day |
| Realtime subscription (optional) | Supabase realtime setup | 2 days |

### Phase 4: Trigger Wiring (Week 3-4)

| Task | Trigger Point | Effort |
|------|---------------|--------|
| Booking notifications | `lib/actions/booking.ts` | 1 day |
| Request booking notifications | `lib/actions/request-booking.ts` | 1 day |
| Review notifications | `lib/actions/manage-booking.ts` | 1 day |
| Reminder cron wiring | `/api/cron/booking-reminders` | 1 day |
| Admin notifications | `lib/actions/admin.ts` | 1 day |

### Phase 5: Preferences (Week 4)

| Task | File | Effort |
|------|------|--------|
| Preferences data model | Migration | 0.5 day |
| Preferences UI | `components/settings/NotificationSettings.tsx` | 2 days |
| Preferences enforcement | `lib/notifications/dispatch.ts` | 1 day |

---

## Related Documents

- `docs/product/journeys/session-lifecycle.md` — Notification triggers within session lifecycle
- `docs/product/journeys/operator-case-resolution.md` — Admin notification triggers
- `lib/email/templates/*.ts` — Existing email templates


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
