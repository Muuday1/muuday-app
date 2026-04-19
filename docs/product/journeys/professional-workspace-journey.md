# Journey: Professional Workspace

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** End-to-end professional workspace: dashboard, agenda, availability, settings, and financial overview  
**Actors:** Professional (primary), System, Admin  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frame-by-Frame Analysis](#2-frame-by-frame-analysis)
3. [Workspace State Model](#3-workspace-state-model)
4. [Business Rules](#4-business-rules)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

The professional workspace is the **operational cockpit** for providers on Muuday. It spans the Dashboard (`/dashboard`), Agenda (`/agenda`), Availability workspace (`/disponibilidade`), Booking rules (`/configuracoes-agendamento`), Profile editor, and Financial overview (`/financeiro`). While functional, the workspace suffers from **fragmented navigation**, **invisible dual-gate status**, and **missing analytics**.

**Critical insight:**
> The professional workspace is where retention is won or lost. A pro who cannot easily understand their status, manage their schedule, and track earnings will churn. Today, critical information (dual-gate status, next session, pending actions) is scattered across 5+ routes.

---

## 2. Frame-by-Frame Analysis

### PHASE 1: DASHBOARD

---

#### Frame 1.1: Dashboard Entry

**Where:** `app/(app)/dashboard/page.tsx`  
**Current State:** Four KPI cards + alerts + quick actions + upcoming sessions + 30-day summary.

**Frame-by-frame (detailed):**
```
[/dashboard]
    ├── Onboarding card (if incomplete)
    ├── Header: "Dashboard" + tier badge
    ├── Alerts section (workspace health alerts)
    ├── KPI Cards (4-col grid):
    │   ├── Urgent: pending confirmations + open requests
    │   ├── Next Session: client name + date/time
    │   ├── Earnings: week + month totals
    │   └── Account Health: status, confirmation mode, window, exceptions
    ├── Quick Actions (2x4 grid):
    │   ├── Confirmar pendências
    │   ├── Responder solicitações
    │   ├── Atualizar disponibilidade
    │   ├── Ajustar regras de agendamento
    │   ├── Editar serviço e perfil
    │   ├── Visualizar perfil público
    │   ├── Revisar financeiro
    │   └── Ver status da conta
    ├── Upcoming Sessions list (max 8)
    └── Summary cards (30d + calendar integration)
```

**New: Services Quick View**
```
    [NEW] Services section (if multi-service enabled):
    ├── "Seus serviços" card
    │   ├── Service 1: "Sessão Inicial" — R$ 180 — 50 min
    │   ├── Service 2: "Acompanhamento" — R$ 150 — 50 min
    │   └── [Gerenciar serviços]
    └── Shows which services support recurring
```

**Problems identified:**
1. **No dual-gate visualization** — `first_booking_enabled` is shown as plain text in "Account Health" card; the distinction between "Profile Live" and "Ready to Book" is invisible
2. **Earnings card shows raw captured amounts** — Not net of fees, not split by source, not trend vs last period
3. **No performance trends** — No chart of bookings over time, no conversion rate from profile view to booking
4. **Quick actions are all equal weight** — Pending confirmations should be more prominent when they exist
5. **Onboarding card blocks the dashboard** — When incomplete, the entire dashboard is blurred (`blur-[1px] opacity-80`)
6. **No review snapshot** — Pro cannot see recent reviews or their rating trend

**Recommended Frame 1.1 (Target):**
```
[/dashboard — Enhanced]
    
    Header:
    ├── "Olá, [Name]" + tier badge + "Profile Live ✓ / Ready to Book ✗" dual-gate indicator
    └── [NEW] Date + "Você tem [N] ações pendentes"
    
    Priority Banner (only when actionable):
    ├── "🔴 3 confirmações pendentes — expiram em 4h"
    └── [Resolver agora]
    
    KPI Cards (reordered by priority):
    ├── Pending Actions (large, amber if >0)
    │   ├── Confirmations: N
    │   ├── Requests: N
    │   └── Next deadline: "Expira em 2h"
    ├── Earnings (with sparkline)
    │   ├── This week: R$ XXX (↑12% vs last week)
    │   ├── This month: R$ XXX
    │   └── [Ver detalhes]
    ├── Next Session (prominent)
    │   ├── Client name + photo
    │   ├── Date/time + countdown
    │   └── [Entrar na sessão] (if within join window)
    └── Performance
        ├── Profile views: N (↑5%)
        ├── Booking conversion: X%
        ├── Rating: ★ 4.8 (127 reviews)
        └── [Ver reviews]
    
    Quick Actions (contextual, not always 8):
    ├── If pending > 0: [Confirmar] [Responder] (large, primary)
    ├── Always: [Atualizar disponibilidade] [Editar perfil]
    └── Collapsed: [Financeiro] [Configurações] [Ver perfil público]
    
    Charts (NEW):
    ├── Bookings over time (last 30 days)
    ├── Earnings over time
    └── Review rating distribution
    
    Recent Activity Feed (NEW):
    ├── "Ana Silva agendou para Seg, 21 Abr"
    ├── "Carlos Mendes deixou uma avaliação ★★★★★"
    └── "Pagamento processado: R$ 150"
```

---

#### Frame 1.2: Onboarding Tracker Overlay

**Where:** `components/dashboard/ProfessionalOnboardingCard.tsx` + `OnboardingTrackerModal.tsx`  
**Current State:** Card on dashboard with status. Click opens full-screen modal with 6 stages.

**Frame-by-frame:**
```
[OnboardingCard]
    ├── Status: "Em revisão" / "Aprovado" / "Precisa de ajustes"
    ├── Progress bar
    └── [Continuar / Ver ajustes]
    
[OnboardingTrackerModal — 2,181 lines]
    ├── Left sidebar: progress + stage list
    ├── Right: stage content
    │   ├── Identity (name, photo, bio)
    │   ├── Services (category, subcategory, specialty, price)
    │   ├── Availability (weekly schedule)
    │   ├── Plan (tier selection + Stripe checkout)
    │   ├── Payout (bank details)
    │   └── Submit Review
    └── Adjustment banner (if needs changes)
```

**Problems identified:**
1. **Modal is 2,181 lines** — Monolithic, hard to maintain, loads all stages at once
2. **No dual-gate progress** — After approval, pro thinks they're done. "Ready to Book" gate is invisible
3. **Photo validation is strict** — 320x320 min, face centered, neutral background. Failure is not explained well
4. **Terms require scroll-to-end** — Good for compliance, but no progress indicator within terms
5. **Stripe checkout inside modal** — Can fail silently if modal is closed

**Recommended Frame 1.2 (Target):**
```
[Onboarding — Refactored]
    ├── Split into pages, not modal: /onboarding/identity, /onboarding/services, etc.
    ├── Persistent dual-gate tracker:
    │   ├── Gate 1: "Perfil público" — checklist with ✓/○
    │   └── Gate 2: "Pronto para agendar" — checklist with ✓/○
    ├── Each stage: save & continue (not all-at-once)
    └── Plan selection: redirect to Stripe (separate flow), return with success param
```

---

### PHASE 2: AGENDA

---

#### Frame 2.1: Agenda Overview

**Where:** `components/agenda/ProfessionalAgendaPage.tsx` — `overview` view  
**Current State:** KPI cards + next 5 sessions + calendar view.

**Frame-by-frame:**
```
[/agenda?view=overview]
    ├── View switcher: Visão geral | Pendências | Regras e disponibilidades
    ├── KPI cards: Confirmações pendentes, Requests em aberto, Próximas sessões
    ├── Next 5 sessions (card grid, xl:5 cols)
    └── Full calendar with availability rules + bookings + external busy slots
```

**Problems identified:**
1. **Calendar is read-only** — Cannot click a date to block it or add an exception
2. **No session actions from overview** — Must navigate to `/sessao/[id]` to cancel/reschedule
3. **External calendar sync errors are buried** — Small red text under "Gerenciar sync"
4. **No session grouping** — Recurring sessions appear as individual cards
5. **No revenue preview per session** — Cannot see how much each upcoming session pays

**Recommended Frame 2.1 (Target):**
```
[Agenda Overview — Enhanced]
    ├── Same layout
    ├── Session cards with actions:
    │   ├── [Cancelar] [Remarcar] [Entrar] (contextual by status + time)
    │   └── Revenue: "R$ 150"
    ├── [NEW] Click calendar date → quick-add exception modal
    ├── [NEW] Sync error banner (prominent, not small text)
    │   └── "Google Calendar sync failed. [Reconectar]"
    └── [NEW] Recurring package grouping
```

---

#### Frame 2.2: Agenda Inbox

**Where:** `components/agenda/ProfessionalAgendaPage.tsx` — `inbox` view  
**Current State:** Combined list of pending confirmations + open requests. Filter pills: Todas / Confirmações / Requests.

**Frame-by-frame:**
```
[/agenda?view=inbox]
    ├── Filter pills: Todas / Confirmações / Requests
    ├── Inbox items sorted by deadline
    ├── Confirmation card:
    │   ├── Client avatar + name
    │   ├── "Confirmação pendente" badge
    │   ├── SLA label: "Expira em Xh" / "SLA expirado"
    │   ├── Date/time + duration
    │   └── BookingActions (confirm/cancel/reschedule)
    └── Request card:
        ├── Client name + status badge
        ├── Preferred window
        ├── Proposal window (if offered)
        └── RequestBookingActions (offer/decline)
```

**Problems identified:**
1. **SLA expiration is not actionable enough** — "SLA expirado" is just text; should auto-escalate
2. **No batch actions** — Must confirm one by one
3. **No request templates** — Pro offering alternative times must manually pick each time
4. **No client context** — Cannot see if this is a repeat client or first booking
5. **Requests and confirmations are mixed** — Different mental models; should be visually distinct

**Recommended Frame 2.2 (Target):**
```
[Agenda Inbox — Enhanced]
    ├── [NEW] Segmented tabs (not pills): Confirmações | Requests | Todos
    ├── Confirmation section:
    │   ├── Batch select: checkbox per item
    │   ├── [Aceitar selecionados] [Recusar selecionados]
    │   └── Per-item:
    │       ├── Client info + "Cliente recorrente" badge (if >1 booking)
    │       ├── Session details + revenue
    │       ├── SLA countdown (red if < 2h)
    │       └── Actions: [Aceitar] [Recusar] [Remarcar]
    └── Request section:
        ├── Per-item:
        │   ├── Client info
        │   ├── Preferred window
        │   ├── [NEW] Quick-offer templates:
        │   │   ├── "Próxima disponível"
        │   │   ├── "Mesmo horário, próxima semana"
        │   │   └── "Horário personalizado"
        │   └── Actions: [Enviar proposta] [Recusar]
```

---

#### Frame 2.3: Availability Rules

**Where:** `components/agenda/ProfessionalAvailabilityWorkspace.tsx`  
**Current State:** Weekly schedule editor + full calendar preview + context stats + quick select + save button.

**Frame-by-frame:**
```
[/agenda?view=availability_rules]
    ├── Context stats: Buffer ativo, Janela máxima, Status de sync
    ├── Rules summary card (embedded mode)
    ├── WeeklyScheduleEditor:
    │   ├── Each day: toggle + start/end time inputs
    │   └── Quick-select: "Seg-Sex 9-18", etc.
    ├── Full calendar preview
    └── [Salvar horas de trabalho]
```

**Problems identified:**
1. **No exception management** — Cannot block specific dates (vacation, holidays) from this view
2. **Calendar preview is read-only** — Clicking does nothing
3. **No conflict warning** — Saving availability that overlaps with existing bookings is allowed
4. **Quick-select overwrites without confirmation** — One click changes all days
5. **No timezone awareness warning** — If pro changes timezone, existing bookings may shift unexpectedly

**Recommended Frame 2.3 (Target):**
```
[Availability Rules — Enhanced]
    ├── Context stats (same)
    ├── WeeklyScheduleEditor
    ├── [NEW] Exceptions panel:
    │   ├── "Próximas exceções"
    │   ├── List: "12 Abr — Feriado (bloqueado)"
    │   └── [+ Adicionar exceção] → date picker + all-day or time range
    ├── Calendar preview:
    │   ├── Click date → add exception OR view bookings
    │   └── Drag to create temporary block
    ├── [NEW] Conflict warning:
    │   └── "⚠️ 2 sessões existentes conflitam com novo horário. [Ver conflitos]"
    └── Save with confirmation if conflicts detected
```

---

### PHASE 3: BOOKING RULES & SETTINGS

---

#### Frame 3.1: Booking Rules Panel

**Where:** `components/agenda/ProfessionalBookingRulesPanel.tsx`  
**Current State:** Form with confirmation mode, buffer time, minimum notice, max booking window, cancellation policy, recurring toggle.

**Problems identified:**
1. **No A/B test capability** — Cannot try different prices for different segments
2. **No seasonal pricing** — Cannot set higher prices during peak periods
3. **No package discounts** — Recurring discount is hardcoded, not configurable
4. **Cancellation policy is binary** — "Flexible" vs "Strict"; no custom rules

**Recommended Frame 3.1 (Target):**
```
[Booking Rules — Enhanced]
    ├── Confirmation mode: [Auto-aceite] [Manual] [Híbrido (primeiro manual)]
    ├── Buffer time slider
    ├── Minimum notice
    ├── Max booking window
    ├── [NEW] Pricing rules:
    │   ├── Base price
    │   ├── [NEW] Peak pricing: "+20% aos sábados"
    │   └── [NEW] Package discount: "5% para 4+ sessões"
    ├── Cancellation policy:
    │   ├── Templates: [Flexível] [Moderada] [Estrita]
    │   └── [NEW] Custom: "Reembolso 100% até 48h, 50% até 24h"
    └── [NEW] Auto-reminders: "Notificar cliente 24h antes"
```

---

### PHASE 4: PROFILE EDITOR

---

#### Frame 4.1: Professional Profile Edit

**Where:** `/editar-perfil-profissional`  
**Current State:** Not fully explored in codebase; likely separate from onboarding.

**Problems identified:**
1. **Profile edit is separate from onboarding data** — Risk of divergence
2. **No preview of public profile** — Cannot see how profile looks to users while editing
3. **No SEO/meta editing** — Cannot customize profile description for search

**Recommended Frame 4.1 (Target):**
```
[Profile Editor]
    ├── Split view: edit (left) + preview (right)
    ├── Sections: Bio, Services, Pricing, Photos, Video, Credentials
    ├── [Preview as visitor] toggle
    └── [Publicar alterações] with changelog
```

---

### PHASE 5: FINANCIAL OVERVIEW

---

#### Frame 5.1: Financial Dashboard

**Where:** `/financeiro`  
**Current State:** Not explored in detail; referenced in quick actions.

**Recommended Frame 5.1 (Target):**
```
[/financeiro]
    ├── Earnings chart (monthly)
    ├── Transaction list:
    │   ├── Date, client, amount, status, fee breakdown
    │   └── [Ver comprovante]
    ├── Payout status:
    │   ├── Next payout: R$ XXX em [date]
    │   └── Payout method: [****1234]
    ├── Tax documents (if applicable)
    └── [Solicitar saque antecipado] (if available)
```

---

### Frame 1.5: Services Management (NEW)

**Where:** Dashboard quick view + dedicated `/dashboard/servicos` (future)  
**Current State:** None — professionals have exactly 1 implicit "Sessão principal"

**Target Frame:**
```
[/dashboard — Services section]
    ├── Header: "Meus serviços"
    ├── Service cards (sortable):
    │   ├── Card 1 (expanded):
    │   │   ├── Name: "Sessão Inicial"
    │   │   ├── Description: "Avaliação completa com histórico..."
    │   │   ├── Duration: 50 min
    │   │   ├── Price: R$ 180
    │   │   ├── Recurring: ✅ Permitido
    │   │   ├── Active: ✅ Visível
    │   │   └── [Editar] [Desativar]
    │   └── Card 2 (collapsed):
    │       ├── "Acompanhamento — R$ 150"
    │       └── [Expandir]
    ├── [+ Adicionar novo serviço]
    └── Re-order handle (⋮⋮) on each card
```

**Rules:**
- Professional can have 1-5 active services (tier-dependent: Basic=1, Professional=3, Premium=5)
- Each service has: name, description, duration, price, recurring flag, active flag
- Services are ordered by `display_order`
- Deactivating a service hides it from profile but keeps historical bookings
- Price changes on active services trigger admin re-review
- Name/description changes publish immediately

---

## 3. Workspace State Model

### Professional Operational States

```
onboarding ──[approved]──→ profile_live ──[first_booking_gate_passed]──→ ready_to_book
     │                           │
     ├──[rejected]──→ rejected   ├──[suspended]──→ suspended
     └──[needs_changes]──→ adjustment

ready_to_book ──[active]──→ active_professional
     │
     ├──[no bookings 30d]──→ at_risk
     ├──[3+ no-shows]──→ review
     └──[payment issue]──→ billing_hold
```

### Dashboard Alert Priorities

| Priority | Condition | Color | Action |
|----------|-----------|-------|--------|
| P0 | Confirmation expiring < 2h | Red | Immediate action required |
| P0 | Sync failure | Red | Reconnect calendar |
| P1 | Pending confirmations > 0 | Amber | Confirm/reject |
| P1 | Onboarding needs changes | Amber | Fix and resubmit |
| P2 | No availability set | Blue | Set schedule |
| P2 | No bookings in 14d | Blue | Review pricing/profile |

---

## 4. Business Rules

### Confirmation SLA

| Mode | Response Time | Auto-action if missed |
|------|---------------|----------------------|
| Manual | 24h from booking | Booking auto-cancelled, user refunded |
| Auto-accept | Immediate | N/A |
| Híbrido | 24h for first booking; auto for repeat | Same as manual |

### Availability Rules

| Rule | Default | Max |
|------|---------|-----|
| Buffer time | 15 min | Tier-dependent (Basic: 30, Pro: 60) |
| Min notice | 24h | 72h |
| Max booking window | 30 days | Tier-dependent (Basic: 30, Pro: 90) |

### Earnings Display

| Metric | Calculation | Display |
|--------|-------------|---------|
| Gross | Sum of all captured payments | Raw amount |
| Net | Gross - platform fee - Stripe fee | "Você recebe" |
| Payout | Net - tax withholdings | "Transferido" |

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: Dual-Gate Status Is Invisible
**Severity:** Critical  
**Impact:** Pros think they're live when they can't receive bookings; support tickets  
**Fix:** Add persistent dual-gate indicator to dashboard header and all workspace pages.

#### C2: Onboarding Modal Is 2,181 Lines
**Severity:** Critical  
**Impact:** Unmaintainable, slow to load, blocks dashboard  
**Fix:** Refactor into route-based multi-step flow with per-stage persistence.

#### C3: Agenda Calendar Is Read-Only
**Severity:** High  
**Impact:** Pros must navigate multiple screens to block a vacation day  
**Fix:** Make calendar interactive — click to add exception, drag to block.

### High Priority

#### H1: No Performance Analytics
**Severity:** High  
**Impact:** Pros fly blind; cannot optimize pricing or availability  
**Fix:** Add charts: bookings over time, conversion rate, earnings trend, review sentiment.

#### H2: No Batch Actions in Inbox
**Severity:** High  
**Impact:** Manual confirmation of multiple bookings is tedious  
**Fix:** Checkbox selection + batch accept/decline.

#### H3: No Exception Management in Availability
**Severity:** High  
**Impact:** Pros cannot easily block vacation days  
**Fix:** Built-in exception calendar with date picker.

### Medium Priority

#### M1: No Client Context in Inbox
**Severity:** Medium  
**Impact:** Cannot prioritize repeat clients  
**Fix:** Show booking history count and total spent per client.

#### M2: No Seasonal/Peak Pricing
**Severity:** Medium  
**Impact:** Revenue optimization missed  
**Fix:** Configurable peak pricing rules.

#### M3: No Profile Preview While Editing
**Severity:** Low  
**Impact:** Pros publish changes without seeing result  
**Fix:** Split-view editor with live preview.

### New: Multi-Service Support

#### N1: No Service Management in Workspace
**Severity:** High (blocks multi-service booking UX)  
**Impact:** Professionals cannot offer differentiated services; revenue optimization missed  
**Fix:** Add service CRUD to dashboard with drag-to-reorder.

#### N2: Service Count Limits Not Enforced
**Severity:** Medium  
**Impact:** Pros might create unlimited services, cluttering profile  
**Fix:** Enforce tier-based limits (Basic=1, Professional=3, Premium=5).

#### N3: No Service-Level Analytics
**Severity:** Medium  
**Impact:** Cannot tell which service is most popular  
**Fix:** Break down bookings, earnings, and reviews by service.

---

## 6. Implementation Plan

### Phase 1: Dual-Gate Visibility (Week 1)

| Task | File | Effort |
|------|------|--------|
| Dual-gate indicator component | `components/dashboard/DualGateStatus.tsx` | 1 day |
| Add to dashboard header | `app/(app)/dashboard/page.tsx` | 1 day |
| Add to agenda header | `components/agenda/ProfessionalAgendaPage.tsx` | 1 day |

### Phase 2: Dashboard Analytics (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Earnings sparkline | `components/dashboard/EarningsChart.tsx` | 2 days |
| Booking trend chart | `components/dashboard/BookingTrendChart.tsx` | 1 day |
| Recent activity feed | `components/dashboard/ActivityFeed.tsx` | 1 day |
| Review snapshot | `components/dashboard/ReviewSnapshot.tsx` | 1 day |

### Phase 3: Agenda Enhancements (Week 2-3)

| Task | File | Effort |
|------|------|--------|
| Interactive calendar | `components/calendar/ProfessionalAvailabilityCalendar.tsx` | 2 days |
| Exception management | `components/agenda/ExceptionManager.tsx` | 2 days |
| Session actions from overview | `components/agenda/ProfessionalAgendaPage.tsx` | 1 day |
| Batch inbox actions | `components/agenda/ProfessionalAgendaPage.tsx` | 1 day |

### Phase 4: Onboarding Refactor (Week 3-5)

| Task | File | Effort |
|------|------|--------|
| Route-based onboarding | `app/(app)/onboarding/[stage]/page.tsx` | 3 days |
| Per-stage persistence | `lib/professional/onboarding-state.ts` | 2 days |
| Dual-gate tracker | `components/dashboard/DualGateTracker.tsx` | 2 days |

### Phase 5: Financial Dashboard (Week 5-6)

| Task | File | Effort |
|------|------|--------|
| Financial overview page | `app/(app)/financeiro/page.tsx` | 2 days |
| Transaction list | `components/finance/TransactionList.tsx` | 1 day |
| Payout status | `components/finance/PayoutStatus.tsx` | 1 day |

### Phase 6: Multi-Service Management (Week 6-7)

| Task | File | Effort |
|------|------|--------|
| Service list component | `components/dashboard/ProfessionalServicesList.tsx` | 2 days |
| Service CRUD modal | `components/dashboard/ServiceEditorModal.tsx` | 2 days |
| Drag-to-reorder | `components/dashboard/ServiceReorderList.tsx` | 1 day |
| Service analytics cards | `components/dashboard/ServiceAnalyticsCard.tsx` | 1 day |
| Tier-based limits | `lib/tier-config.ts` | 1 day |

---

## Related Documents

- `docs/product/journeys/professional-onboarding.md` — Onboarding flow
- `docs/product/journeys/session-lifecycle.md` — Session management
- `docs/product/journeys/recurring-booking-journey.md` — Recurring packages
- `docs/product/journeys/payments-billing-revenue.md` — Financial backend
- `lib/professional/workspace-health.ts` — Alert generation logic
