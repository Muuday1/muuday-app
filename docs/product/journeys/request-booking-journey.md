# Journey: Request Booking

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** End-to-end request booking: user submits preferred time, professional proposes alternative, negotiation, conversion  
**Actors:** User (client), Professional, System  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frame-by-Frame Analysis](#2-frame-by-frame-analysis)
3. [Request State Machine](#3-request-state-machine)
4. [Business Rules](#4-business-rules)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

Request Booking is Muuday's **negotiated scheduling** flow. When a professional's public availability doesn't meet a user's needs, the user can submit a request with their preferred time. The professional can accept, decline, or propose an alternative. This flow exists at `/solicitar/[id]` and is managed through `RequestBookingActions`.

**Critical insight:**
> Request booking is a high-intent conversion path — users who request custom times are often more valuable than instant bookers. Yet the current UX is minimal: no negotiation back-and-forth, no context about why the user is requesting, and pros have no templates for quick responses.

---

## 2. Frame-by-Frame Analysis

### PHASE 1: REQUEST CREATION (User)

---

#### Frame 1.1: Profile — "Solicitar Horário" CTA

**Where:** `app/(app)/profissional/[id]/page.tsx`  
**Current State:** "Agendar" is primary; "Solicitar horário" may be secondary or hidden.

**Frame-by-frame:**
```
[Public Profile]
    ├── Primary CTA: [Agendar] → direct booking
    └── Secondary: [Solicitar horário] → /solicitar/[id]
        └── Only shown if pro tier allows (professional/premium)
```

**Problems identified:**
1. **"Solicitar" is secondary** — Users may not notice it; for some pros it may be the ONLY way to book
2. **No explanation of what "solicitar" means** — User doesn't know if it's a custom time or a message
3. **No availability preview** — User clicks "solicitar" without knowing when pro is usually free

**Recommended Frame 1.1 (Target):**
```
[Public Profile — CTAs Enhanced]
    ├── If pro has open slots: [Agendar] (primary)
    ├── If pro has limited/no slots: [Solicitar horário] (primary)
    │   └── Badge: "Horários esgotados? Peça um horário personalizado"
    └── Tooltip on hover: "O profissional responderá em até 24h"
```

---

#### Frame 1.2: Request Form

**Where:** `app/(app)/solicitar/[id]/page.tsx` + `RequestBookingForm.tsx`  
**Current State:** Simple form: datetime-local, duration select, optional message. Submit.

**Frame-by-frame (detailed):**
```
[/solicitar/[id] — RequestBookingForm]
    ├── Back link: "Voltar ao perfil"
    ├── Heading: "Solicitar horário"
    ├── Subtext: "Envie um horário preferencial para [Pro Name]. O profissional pode aprovar, recusar ou propor alternativa."
    ├── Inputs:
    │   ├── Horário preferencial: datetime-local (default: now + 48h)
    │   ├── Duração: select [30/45/60/90/120 min]
    │   └── Mensagem (opcional): textarea (1200 chars)
    ├── Timezone labels:
    │   ├── "Fuso do checkout: [User timezone]"
    │   └── "Fuso do profissional: [Pro timezone]"
    └── [Enviar solicitação]
    
    [Success state]
    ├── CheckCircle icon + "Solicitação enviada"
    ├── "O profissional recebeu sua solicitação. Quando houver proposta, você verá na sua agenda."
    └── CTAs: [Ir para agenda] [Voltar ao perfil]
```

**Problems identified:**
1. **No calendar context** — User picks a time blindly; no visibility into pro's existing availability
2. **No multiple time options** — User can only suggest ONE time; if pro is busy, back-and-forth begins
3. **No urgency indicator** — No "I need this by [date]" or flexibility range
4. **Message is optional** — Most users won't explain their needs; pro has no context
5. **No price preview** — User doesn't know how much this will cost before submitting
6. **No confirmation that pro accepts requests** — Page could 404 after tier check fails

**Recommended Frame 1.2 (Target):**
```
[/solicitar/[id] — Enhanced Request Form]
    ├── Back link + Pro summary card (avatar, name, price)
    ├── Heading: "Solicitar horário com [Pro Name]"
    ├── Price preview: "Sessões a partir de R$ XXX / [duration] min"
    ├── [NEW] Mini calendar showing pro's availability (read-only)
    │   └── Green dots = available, Red = busy
    ├── Preferred times (up to 3):
    │   ├── Opção 1: [datetime-local] (required)
    │   ├── Opção 2: [datetime-local] (optional)
    │   └── Opção 3: [datetime-local] (optional)
    ├── Duration select
    ├── Flexibility:
    │   └── [NEW] "Tenho flexibilidade de ± [2h / 1 dia / 2 dias]"
    ├── Context (required):
    │   ├── "O que você precisa?" (guided options)
    │   │   ├── [ ] Primeira consulta
    │   │   ├── [ ] Acompanhamento
    │   │   └── [ ] Outro: ______
    │   └── "Detalhes adicionais" textarea
    ├── Urgency:
    │   └── [NEW] "Preciso até: [date]"
    ├── Timezone display:
    │   ├── "Seu fuso: [User TZ]"
    │   └── "Fuso do profissional: [Pro TZ]"
    │   └── [NEW] Both times shown side by side for each option
    └── [Enviar solicitação]
    
    [Success state — Enhanced]
    ├── "🎉 Solicitação enviada!"
    ├── "[Pro Name] tem até 24h para responder."
    ├── Request summary card:
    │   ├── Times suggested
    │   ├── Expected response by: [date]
    │   └── "Você receberá uma notificação quando [Pro] responder."
    └── CTAs: [Ver minha agenda] [Buscar outros profissionais]
```

---

### PHASE 2: PROFESSIONAL RESPONSE

---

#### Frame 2.1: Pro Inbox — Request Card

**Where:** `components/agenda/ProfessionalAgendaPage.tsx` — inbox view  
**Current State:** Request card shows: client name, preferred window, proposal window (if offered), status badge, expiration.

**Frame-by-frame:**
```
[Agenda Inbox — Request Card]
    ├── Client name
    ├── "Preferencia enviada por [user timezone]"
    ├── Status badge: [Aberta] [Proposta enviada] [Aceita] etc.
    ├── Janela preferida: [Date range] ([pro TZ])
    ├── Proposta: [Date range] (if offered)
    ├── Expira em: [Date] (if offered and status=offered)
    └── RequestBookingActions (offer/decline/accept)
```

**Problems identified:**
1. **No client context** — Is this a first-time client or repeat? Total spent?
2. **No request message visible** — User's optional message not shown in card
3. **No quick-response templates** — Pro must manually pick datetime for every offer
4. **Expiration is hidden in small text** — Easy to miss expiring proposals

**Recommended Frame 2.1 (Target):**
```
[Agenda Inbox — Request Card Enhanced]
    ├── Client section:
    │   ├── Avatar + Name
    │   ├── [NEW] "Cliente novo" or "3ª sessão" badge
    │   └── [NEW] "R$ XXX gasto anteriormente" (if repeat)
    ├── Request context:
    │   ├── "Quer marcar para [purpose]"
    │   └── User message (if any): "Preciso de tarde por causa do trabalho"
    ├── Status badge + expiration countdown
    ├── Preferred window(s):
    │   ├── Opção 1: Seg, 21 Abr, 14:00
    │   └── Opção 2: Ter, 22 Abr, 10:00
    └── Actions:
        ├── [Aceitar opção 1] [Aceitar opção 2] (if slot available)
        ├── [Propor alternativa] → opens offer form
        └── [Recusar com motivo]
```

---

#### Frame 2.2: Pro Offer Form

**Where:** `components/booking/RequestBookingActions.tsx` — pro mode  
**Current State:** Inline form with datetime-local, duration, optional message.

**Frame-by-frame:**
```
[RequestBookingActions — Pro Offering]
    ├── datetime-local input
    ├── Duration select
    ├── Message textarea
    └── [Enviar proposta] [Cancelar]
```

**Problems identified:**
1. **No slot validation** — Pro can offer a time that conflicts with existing booking
2. **No "next available" shortcut** — Must manually find open slot
3. **No pricing shown** — Pro doesn't see what user will be charged
4. **No recurring option** — Cannot propose recurring package from request flow

**Recommended Frame 2.2 (Target):**
```
[Pro Offer Form — Enhanced]
    ├── [NEW] "Próximos horários disponíveis" quick-pick:
    │   ├── [Seg, 21 Abr, 10:00] [Ter, 22 Abr, 14:00] [Qua, 23 Abr, 09:00]
    │   └── [Horário personalizado]
    ├── Custom datetime picker (if custom selected)
    ├── Duration
    ├── Price preview:
    │   └── "O cliente pagará: R$ XXX"
    ├── [NEW] "Oferecer como pacote recorrente?" toggle
    ├── Message to client:
    │   ├── Templates:
    │   │   ├── "Tenho disponível neste horário."
    │   │   ├── "Não consigo no horário solicitado, mas tenho este."
    │   │   └── Custom
    │   └── Textarea
    └── [Enviar proposta] [Recusar]
```

---

### PHASE 3: USER ACCEPTANCE

---

#### Frame 3.1: User Notification — Proposal Received

**Where:** Notification system (to be built)  
**Current State:** None. User must check agenda manually.

**Recommended Frame 3.1 (Target):**
```
[Notification + Email]
├── "[Pro Name] respondeu sua solicitação!"
├── Proposal card:
│   ├── Date/time
│   ├── Duration
│   ├── Price
│   └── Pro message: "Tenho disponível neste horário."
├── Expiration: "Válido até [Date] (23h 59min)"
└── CTAs:
    ├── [Aceitar e pagar] → booking flow
    ├── [Solicitar outro horário] → new request
    └── [Recusar]
```

---

#### Frame 3.2: User Accepts Proposal

**Where:** Agenda or notification deep link  
**Current State:** `acceptRequestBooking` server action creates booking.

**Recommended Frame 3.2 (Target):**
```
[Acceptance Flow]
├── User clicks [Aceitar e pagar]
├── Redirects to booking confirmation with pre-filled details
├── Payment step (same as direct booking)
├── Success: "Agendamento confirmado!"
└── Request status updates to "converted"
```

---

## 3. Request State Machine

```
open ──[pro offers]──→ offered ──[user accepts]──→ accepted ──[payment]──→ converted
  │                      │
  ├──[pro declines]──→ declined  ├──[user declines]──→ declined
  ├──[user cancels]──→ cancelled ├──[expires]────────→ expired
  └──[expires]────────→ expired
```

### Status Definitions

| Status | Meaning | Next Possible |
|--------|---------|---------------|
| `open` | User submitted request, pro hasn't responded | `offered`, `declined`, `cancelled` |
| `offered` | Pro proposed alternative time | `accepted`, `declined`, `expired` |
| `accepted` | User accepted proposal | `converted` |
| `converted` | Booking created and paid | Terminal |
| `declined` | Either party declined | Terminal |
| `expired` | Offer expired (24h default) | Terminal |
| `cancelled` | User cancelled before response | Terminal |

---

## 4. Business Rules

### Eligibility

| Rule | Value |
|------|-------|
| Pro tiers allowed | professional, premium |
| Min advance notice | Respects pro's `minimum_notice_hours` |
| Max booking window | Respects pro's `max_booking_window_days` |
| User must be logged in | Yes |
| Professionals cannot request | Yes (redirect to dashboard) |

### Offer Expiration

| Setting | Default | Rationale |
|---------|---------|-----------|
| Offer TTL | 24 hours | Creates urgency, prevents stale proposals |
| Auto-reminder | T-4h | Notify user that offer is expiring |
| Post-expiration | Request becomes `expired`, user can re-request | |

### Pricing

- Request booking uses pro's current session price
- No request booking fee (same as direct booking)
- Price shown to user before they submit request

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: No Calendar Context for User
**Severity:** Critical  
**Impact:** User requests impossible times, pro frustration  
**Fix:** Show pro's availability calendar on request form.

#### C2: Single Time Option
**Severity:** Critical  
**Impact:** Low conversion, high back-and-forth  
**Fix:** Allow up to 3 preferred times + flexibility range.

#### C3: No Notification on Proposal
**Severity:** Critical  
**Impact:** User doesn't know pro responded; proposal expires  
**Fix:** Build notification trigger for `request_booking` status changes.

### High Priority

#### H1: No Quick-Offer for Pro
**Severity:** High  
**Impact:** Pro manually types every offer; friction  
**Fix:** "Next available slots" quick-pick buttons.

#### H2: No Client Context for Pro
**Severity:** High  
**Impact:** Pro cannot prioritize or personalize response  
**Fix:** Show client history, total spent, previous session count.

#### H3: Request Message Optional and Hidden
**Severity:** Medium  
**Impact:** Pro has no context about user needs  
**Fix:** Make context required with guided options; show in inbox card.

---

## 6. Implementation Plan

### Phase 1: Request Form Enhancement (Week 1)

| Task | File | Effort |
|------|------|--------|
| Calendar context on request form | `components/booking/RequestBookingForm.tsx` | 2 days |
| Multiple time options | `components/booking/RequestBookingForm.tsx` | 1 day |
| Required context + guided options | `components/booking/RequestBookingForm.tsx` | 1 day |
| Price preview | `app/(app)/solicitar/[id]/page.tsx` | 1 day |

### Phase 2: Pro Inbox Enhancement (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Client context in request cards | `components/agenda/ProfessionalAgendaPage.tsx` | 1 day |
| Quick-offer templates | `components/booking/RequestBookingActions.tsx` | 2 days |
| Slot validation on offer | `lib/actions/request-booking.ts` | 1 day |

### Phase 3: Notification Wiring (Week 2)

| Task | File | Effort |
|------|------|--------|
| Request status change notifications | `lib/notifications/dispatch.ts` | 1 day |
| Expiration reminders | `inngest/functions/request-reminders.ts` | 1 day |
| Email templates | `lib/email/templates/request-booking.ts` | 1 day |

### Phase 4: Profile CTA Logic (Week 2)

| Task | File | Effort |
|------|------|--------|
| Dynamic primary CTA by availability | `app/(app)/profissional/[id]/page.tsx` | 1 day |
| "Solicitar" prominence when slots low | `components/search/SearchBookingCtas.tsx` | 1 day |

---

## Related Documents

- `docs/product/journeys/search-booking.md` — Parent booking flow
- `docs/product/journeys/notification-inbox-lifecycle.md` — Notification triggers
- `docs/product/journeys/professional-workspace-journey.md` — Pro inbox
- `lib/booking/request-booking-state-machine.ts` — Backend state machine
- `lib/actions/request-booking.ts` — Server actions


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
