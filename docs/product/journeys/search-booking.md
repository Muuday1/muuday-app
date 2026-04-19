# User Journey: Search and Booking

**Status:** Canonical journey — major UX redesign documented  
**Last updated:** 2026-04-19  
**Scope:** End-to-end user flow from search discovery through multi-service booking confirmation  
**Purpose:** Define the target UX for professional profile browsing, multi-service selection, and multi-step booking checkout

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State vs Target State](#2-current-state-vs-target-state)
3. [Frame-by-Frame Analysis](#3-frame-by-frame-analysis)
4. [State Machine](#4-state-machine)
5. [Business Rules](#5-business-rules)
6. [Integration with Existing Features](#6-integration-with-existing-features)
7. [Data Model Evolution](#7-data-model-evolution)
8. [Implementation Plan](#8-implementation-plan)

---

## 1. Executive Summary

### The Problem

The current booking flow is optimized for a single-service-per-professional model. The professional profile mixes bio, calendar, and reviews into one long scroll. The booking form (`/agendar/[id]`) crams service type selection, calendar picking, session purpose, and payment summary into a single screen. This creates friction for professionals who want to offer differentiated services (e.g., "Sessão Inicial" vs "Acompanhamento" vs "Pacote Familiar") and for users who need clarity before committing.

### The Target

A **multi-step, service-first booking experience** where:

1. **Search → Profile Bio**: Clicking a search result lands on the professional's bio/profile page (not directly on services/booking)
2. **Profile has tabs**: Services/Packages | Bio | Reviews — user browses before deciding
3. **Service selection happens on the profile**: User picks a service/package, which reveals calendar + pricing
4. **Multi-step booking**: Service+Slot → Personal Info+Purpose → Checkout Breakdown → Payment → Confirmation
5. **Checkout transparency**: Subtotal, platform fees, taxes shown clearly before payment
6. **Recurring and batch are booking modes on top of a selected service** — not separate entry points
7. **Video is the only delivery channel** — no method selection needed (always Agora)

---

## 2. Current State vs Target State

| Aspect | Current State | Target State |
|--------|--------------|--------------|
| **Search click destination** | `/profissional/[id]` with calendar inline | `/profissional/[id]` with **Bio tab active by default** |
| **Service selection** | None — single implicit "Sessão principal" | Explicit service/package picker on profile |
| **Profile layout** | Long scroll: header → bio → calendar → reviews | **Tabbed**: Serviços / Bio / Avaliações |
| **Booking entry** | `/agendar/[id]` with everything in one form | Multi-step wizard: Slot → Info → Checkout → Pay |
| **Price display** | Simple: `price × sessions = total` | **Breakdown**: Subtotal + Platform Fee + Tax = Grand Total |
| **Session purpose** | Optional textarea buried in form | Dedicated step with guided prompts |
| **Personal info** | Not collected at booking (assumes profile complete) | Booking step confirms/reviews personal details |
| **Checkout transparency** | Minimal — total only | Full breakdown with tooltips explaining fees |
| **Success screen** | Green checkmark + "Solicitação enviada" | Branded confirmation with "Ver minha agenda" CTA |
| **Recurring / Batch** | Global booking type toggle (one_off/recurring/batch) | **Mode selector per service** — each service declares if it supports recurring |

---

## 3. Frame-by-Frame Analysis

---

### Frame 1: Search Results (`/buscar`)

**Current behavior preserved.** Search cards show:
- Cover photo, avatar, name, specialty tags
- **Primary service price + duration** (from first active `professional_services` record)
- Rating, total reviews, location, language chips
- Tier badge (Premium/Profissional/Básico)
- CTA: "Agendar" | "Mandar mensagem"

**Changes needed:**
- Card should show **"A partir de R$ X"** if professional has multiple services with different prices
- If only one service: show exact price as today
- **Clicking the card body** → `/profissional/[id]` (lands on **Bio tab**)
- **Clicking "Agendar"** → `/profissional/[id]` lands on **Services tab** (or scrolls to services section)

**Why:** The screenshot flow shows the user browsing the professional's profile before committing. We should not skip the profile.

---

### Frame 2: Professional Profile — Bio Tab (`/profissional/[id]`)

**This is the default landing when coming from search.**

**Layout (top to bottom):**

```
┌─────────────────────────────────────────┐
│  ← Back          Share               │
├─────────────────────────────────────────┤
│  [Cover Photo]                          │
│  [Avatar]  Dr. Ana Silva                │
│  Psicóloga • São Paulo, Brasil          │
│  ⭐ 4.9  •  200+ Consultas  •  8 anos   │
├─────────────────────────────────────────┤
│  [Serviços]  [Bio]  [Avaliações]       │  ← Tabs
├─────────────────────────────────────────┤
│  BIO TAB (active by default):           │
│  ─────────────────────────────────────  │
│  Sobre mim                              │
│  [Full bio text with read more]         │
│                                         │
│  Vídeo intro                            │
│  [YouTube/Vimeo embed]                  │
│                                         │
│  Idiomas                                │
│  🇧🇷 Português  🇺🇸 English             │
│                                         │
│  Especialidades                         │
│  [Tag chips]                            │
│                                         │
│  Credenciais verificadas                │
│  [Badge]                                │
│                                         │
│  ─── Sticky CTA at bottom ───          │
│  [Ver serviços e agendar]  💰 A partir  │
│      de R$ 150                          │
└─────────────────────────────────────────┘
```

**Key rules:**
- Bio tab is **default** for all visitors
- "Ver serviços e agendar" sticky CTA scrolls user to Services tab
- For logged-out users: CTA opens auth modal (preserves intent to book this professional)
- Social links, WhatsApp button visible in header

---

### Frame 3: Professional Profile — Services Tab (`/profissional/[id]?tab=servicos`)

**This is where service selection happens.** Inspired by the screenshot showing "Packages" list with expandable details.

**Layout:**

```
┌─────────────────────────────────────────┐
│  [Serviços]  [Bio]  [Avaliações]       │
├─────────────────────────────────────────┤
│  Serviços oferecidos                    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📋 Sessão Inicial               │   │
│  │ 50 min • R$ 180                │ ▼ │  ← Expandable
│  │                                 │   │
│  │ [Expanded state:]               │   │
│  │ Avaliação completa com          │   │
│  │ histórico e planejamento.       │   │
│  │                                 │   │
│  │ Duração:        50 min          │   │
│  │ Sessões:        1               │   │
│  │ Recorrente:     ❌ Não          │   │
│  │                                 │   │
│  │ [Escolher e ver horários]       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📋 Acompanhamento               │   │
│  │ 50 min • R$ 150                │ ▼ │
│  │                                 │   │
│  │ [Expanded state:]               │   │
│  │ Sessão de continuidade para     │   │
│  │ pacientes em acompanhamento.    │   │
│  │                                 │   │
│  │ Duração:        50 min          │   │
│  │ Sessões:        1               │   │
│  │ Recorrente:     ✅ Sim          │   │
│  │                                 │   │
│  │ [Escolher e ver horários]       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📋 Pacote Familiar (3 sessões)  │   │
│  │ 60 min • R$ 420 (R$ 140 cada)  │ ▼ │
│  │                                 │   │
│  │ [Expanded state:]               │   │
│  │ 3 sessões para até 4 membros.   │   │
│  │ Economia de R$ 60.              │   │
│  │                                 │   │
│  │ Duração:        60 min          │   │
│  │ Sessões:        3 (batch)       │   │
│  │ Recorrente:     ❌ Não          │   │
│  │                                 │   │
│  │ [Escolher e ver horários]       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Service card anatomy (expanded):**

| Field | Source | Display |
|-------|--------|---------|
| Name | `professional_services.name` | Title |
| Duration | `professional_services.duration_minutes` | "X min" |
| Price | `professional_services.price_brl` | In user currency with "≈" if converted |
| Description | `professional_services.description` | Collapsible text |
| Recurring enabled | `professional_services.enable_recurring` | Badge + mode availability |
| Monthly enabled | `professional_services.enable_monthly` | Badge (future) |

**Interaction:**
- Click service card → expands/collapses details
- Click "Escolher e ver horários" → reveals inline calendar OR navigates to `/agendar/[id]?servico=[serviceId]`
- Only **one service can be selected** at a time for booking
- If professional has only 1 service: skip this step, show calendar immediately

---

### Frame 4: Service + Slot Selection (`/agendar/[id]?servico=[serviceId]`)

**This replaces the current `/agendar/[id]` first screen.**

**Layout:**

```
┌─────────────────────────────────────────┐
│  ← Voltar ao perfil                     │
├─────────────────────────────────────────┤
│  Etapa 1 de 3: Serviço e horário        │
│  ───○───                                │
│                                         │
│  Serviço selecionado:                   │
│  ┌─────────────────────────────────┐   │
│  │ 📋 Sessão Inicial — 50 min      │   │
│  │ R$ 180 • por sessão             │   │
│  │ [Trocar serviço]                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─── Tipo de agendamento ───           │
│  [Sessão única] [Recorrente] [Várias]  │
│                                         │
│  ─── Calendário ───                    │
│  [←]  Abril 2026  [→]                  │
│  [D] [S] [T] [Q] [Q] [S] [S]           │
│   30  31   1   2   3   4   5          │
│    6   7   8   9  10  11  12          │
│   ...                                  │
│                                         │
│  ─── Horários disponíveis ───          │
│  Seg, 7 de Abril                       │
│  [09:00] [10:00] [14:00] [16:00]      │
│                                         │
│  [Continuar →]                         │
└─────────────────────────────────────────┘
```

**Key behaviors (preserved from current):**
- Calendar respects `availability_rules` and `existingBookings`
- Timezone toggle: "Ver no meu fuso" / "Ver no fuso do profissional"
- Duration derived from selected service's `duration_minutes`
- Recurring/batch toggles shown only if service supports them (`enable_recurring`, `enable_monthly`)
- Recurring config: periodicity, occurrences/end-date, auto-renew
- Batch config: add multiple date/time slots to a list

**New behavior:**
- Service card is pinned at top so user always knows what they're booking
- "Trocar serviço" links back to profile's Services tab
- Step indicator (1 de 3) sets expectation

---

### Frame 5: Booking Step 2 — Personal Info + Session Purpose

**This is a NEW screen. Does not exist today.**

Inspired by the screenshot showing "Book Appointment" with "Personal Information" and "Reason for booking".

**Layout:**

```
┌─────────────────────────────────────────┐
│  ← Voltar                               │
├─────────────────────────────────────────┤
│  Etapa 2 de 3: Sobre você               │
│  ──────○──                              │
│                                         │
│  Informações pessoais                   │
│  (serão usadas para a sessão)           │
│                                         │
│  Nome completo                          │
│  [Ana Carolina Silva        ]          │
│                                         │
│  Localização                            │
│  [São Paulo, Brasil         ]          │
│                                         │
│  Idade (opcional)                       │
│  [35                         ]          │
│                                         │
│  ─── Motivo da consulta ───            │
│                                         │
│  Conte um pouco sobre o que você        │
│  gostaria de tratar nesta sessão:       │
│                                         │
│  [Estou passando por um momento de      │
│   transição profissional e gostaria     │
│   de orientação para tomar a melhor     │
│   decisão...                            │
│   (máx. 1200 caracteres)     ]          │
│                                         │
│  💡 Dica: quanto mais contexto você     │
│  der, melhor preparada o profissional   │
│  estará para a sessão.                  │
│                                         │
│  [Continuar →]                         │
└─────────────────────────────────────────┘
```

**Fields:**

| Field | Source | Required | Notes |
|-------|--------|----------|-------|
| Full name | `profiles.full_name` | Yes | Pre-filled from profile, editable |
| Location | `profiles.country` | Yes | Pre-filled, editable |
| Age | New field | No | Optional, helps pro prepare |
| Session purpose | `bookings.notes` or new column | Conditional | Required if `require_session_purpose=true` |

**Rules:**
- All fields pre-filled from `profiles` table to reduce friction
- If profile is incomplete, show inline validation with "Completar perfil" link
- Session purpose has guided prompts based on category:
  - Saúde mental: "Descreva como você tem se sentido recentemente..."
  - Nutrição: "Descreva seus objetivos alimentares e hábitos atuais..."
  - Coaching: "Qual área da sua vida você quer trabalhar?"

---

### Frame 6: Booking Step 3 — Checkout Summary

**This replaces the current simple price summary with a transparent breakdown.**

Inspired by the screenshot showing "Selected Package", "Subtotal", "Platform fees", "Fees & Estimated Tax", "Grand Total".

**Layout:**

```
┌─────────────────────────────────────────┐
│  ← Voltar                               │
├─────────────────────────────────────────┤
│  Etapa 3 de 3: Revisar e pagar          │
│  ─────────○                             │
│                                         │
│  Resumo do agendamento                  │
│  ┌─────────────────────────────────┐   │
│  │ 📋 Sessão Inicial               │   │
│  │ 50 min • 1 sessão               │   │
│  │ Seg, 7 Abr • 14:00 (BRT)        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Com Dr. Ana Silva                      │
│  Psicóloga • ⭐ 4.9                    │
│                                         │
│  ─── Pagamento ───                     │
│                                         │
│  Subtotal                               │
│  1 sessão × R$ 180            R$ 180   │
│                                         │
│  Taxa da plataforma         R$ 18.00   │
│  ⓘ (ajuda a manter a plataforma)       │
│                                         │
│  Taxas e impostos            R$ 2.00   │
│  ⓘ (INSS/IOF sobre transação)          │
│                                         │
│  Desconto                   -R$ 10.00  │
│  ⓘ (PRIMEIRA10 — primeira sessão)      │
│                                         │
│  ─────────────────────────────────────  │
│  Total a pagar                R$ 190   │
│                                         │
│  [Aplicar código promocional]          │
│                                         │
│  ─── Política de cancelamento ───      │
│  • Cancelamento com 48h+: reembolso    │
│    100%                                │
│  • 24h a 48h: reembolso 50%            │
│  • Menos de 24h: sem reembolso         │
│                                         │
│  [ ] Li e aceito a política de         │
│      cancelamento                      │
│  [ ] Confirmo data/horário nos         │
│      fusos corretos                    │
│                                         │
│  [💳 Confirmar pagamento — R$ 190]     │
└─────────────────────────────────────────┘
```

**Price breakdown rules:**

| Line Item | Calculation | Notes |
|-----------|-------------|-------|
| Subtotal | `service.price_brl × session_count` | Base professional fee |
| Platform fee | `subtotal × platform_rate` (e.g., 10%) | Configurable per category/tier |
| Tax | `subtotal × tax_rate` | INSS/IOF for Brazil; VAT for EU |
| Discount | Promo code or first-session discount | Applied after fees |
| **Grand Total** | `subtotal + fees + tax - discount` | What user pays |

**Payment methods:**
- Stripe (credit card)
- Pix (Brazil)
- Wallet/credits (future)

---

### Frame 7: Payment Processing

**Transition state while Stripe/Pix processes.**

```
┌─────────────────────────────────────────┐
│                                         │
│         [Animated loader/spinner]       │
│                                         │
│      Processando seu pagamento...       │
│                                         │
│      Não feche esta tela.               │
│                                         │
└─────────────────────────────────────────┘
```

**Rules:**
- Slot is **soft-held** when user enters checkout (Step 3)
- Slot is **hard-held** when payment intent is created
- If payment fails → return to checkout with error + "Tentar novamente"
- If user abandons → slot released after 10 min TTL

---

### Frame 8: Confirmation / Success

**Inspired by the screenshot: "Thank you" illustration, "Confirmed!", "Check Appointments" link.**

```
┌─────────────────────────────────────────┐
│                                         │
│      [Illustration: calendar/check]     │
│                                         │
│         Confirmado! ✅                  │
│                                         │
│   Seu agendamento foi criado com        │
│   sucesso.                              │
│                                         │
│   ─── Resumo ───                       │
│   Dr. Ana Silva                         │
│   Sessão Inicial — 50 min               │
│   Seg, 7 de Abril às 14:00 (BRT)        │
│                                         │
│   Se o profissional confirmar           │
│   manualmente, você receberá uma        │
│   notificação em breve.                 │
│                                         │
│   [Ver minha agenda]  [Buscar mais]    │
│                                         │
│   ─── Próximos passos ───              │
│   • Receba lembretes por email          │
│   • Entre na sala 5 min antes           │
│   • Prepare seu ambiente                │
│                                         │
└─────────────────────────────────────────┘
```

**States:**

| Confirmation Mode | Success Message | Next Action |
|-------------------|-----------------|-------------|
| `auto_accept` | "Sessão confirmada" | Immediate — show session join link |
| `manual` | "Solicitação enviada" | Explain 24h SLA + auto-refund |

**CTAs:**
- Primary: "Ver minha agenda" → `/agenda`
- Secondary: "Buscar mais profissionais" → `/buscar`
- Contextual: "Adicionar ao calendário" (Google/Outlook .ics)

---

## 4. State Machine

### Booking State Machine (high-level)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  BROWSING   │────→│  SELECTING  │────→│  CHECKOUT   │────→│  PAYMENT    │
│  (profile)  │     │  (slot)     │     │  (summary)  │     │  (processing)│
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                              ┌─────────────────────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │   PAYMENT_OK?   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌─────────┐   ┌──────────┐   ┌──────────┐
        │ SUCCESS │   │  FAILED  │   │ ABANDONED│
        │confirmed│   │(retry)   │   │(release) │
        └────┬────┘   └──────────┘   └──────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌──────────┐    ┌──────────┐
│auto_accept│    │ manual   │
│CONFIRMED  │    │ PENDING  │
└──────────┘    └────┬─────┘
                     │
              ┌──────┴──────┐
              ▼             ▼
        ┌─────────┐   ┌─────────┐
        │ ACCEPTED│   │ DECLINED│
        │         │   │         │
        └────┬────┘   └────┬────┘
             │             │
             ▼             ▼
        ┌─────────┐   ┌─────────┐
        │ SESSION │   │ REFUNDED│
        │  READY  │   │         │
        └─────────┘   └─────────┘
```

### Slot Reservation State

```
AVAILABLE ──[user selects]──→ SOFT_HELD (5 min)
                                    │
                                    ├──[enters checkout]──→ HELD (10 min)
                                    │                           │
                                    │                           ├──[payment success]──→ BOOKED
                                    │                           │
                                    │                           ├──[payment fail]─────→ AVAILABLE
                                    │                           │
                                    │                           └──[timeout]──────────→ AVAILABLE
                                    │
                                    └──[navigates away]──→ AVAILABLE (after 5 min)
```

---

## 5. Business Rules

### Service Selection Rules

| Rule | Description |
|------|-------------|
| R1 | Professional must have at least 1 active service to appear in search |
| R2 | If professional has exactly 1 service, calendar is shown immediately (skip service selection) |
| R3 | If professional has >1 service, user must select one before seeing calendar |
| R4 | Service selection can be changed until payment is initiated |
| R5 | Each service declares its own `duration_minutes` and `price_brl` |
| R6 | Each service declares whether it supports recurring (`enable_recurring`) |
| R7 | Each service declares whether it supports batch (`enable_monthly` — or new `enable_batch`) |

### Pricing Rules

| Rule | Description |
|------|-------------|
| R8 | Subtotal = `service.price_brl × total_sessions` |
| R9 | Platform fee = configurable percentage (default 10%) of subtotal |
| R10 | Tax = region-dependent (INSS/IOF for Brazil, VAT for EU, etc.) |
| R11 | Grand total shown in user's currency with conversion indicator "≈" |
| R12 | Professional receives `subtotal - platform_fee` (net) |

### Booking Type Rules

| Rule | Description |
|------|-------------|
| R13 | **One-off**: Single session. Default for all services. |
| R14 | **Recurring**: Only if `service.enable_recurring = true`. Same day/time, periodic. |
| R15 | **Batch**: Multiple arbitrary dates. Independent of `enable_recurring`. Always allowed. |
| R16 | Recurring and batch are **mutually exclusive** — user picks one or the other |
| R17 | Recurring sessions auto-generate `booking_sessions` rows with `recurrence_group_id` |
| R18 | Batch sessions are individual bookings linked by `batch_group_id` |

### Profile Landing Rules

| Rule | Description |
|------|-------------|
| R19 | Clicking search result card → `/profissional/[id]` with **Bio tab active** |
| R20 | Clicking "Agendar" on search card → `/profissional/[id]` with **Services tab active** (or auto-scroll to services) |
| R21 | Deep-linking `/profissional/[id]?tab=servicos` opens Services tab directly |
| R22 | Deep-linking `/profissional/[id]?servico=[id]` opens profile with that service pre-selected |

---

## 6. Integration with Existing Features

### Recurring Booking Integration

The current recurring booking (`recurring-booking-journey.md`) is a **booking mode**, not a separate journey entry point.

**How it integrates:**
1. User selects a service that has `enable_recurring = true`
2. In Frame 4 (Slot Selection), "Recorrente" toggle is available
3. User configures periodicity + count/end-date
4. Checkout summary shows: "Pacote recorrente: X sessões × R$ Y = Subtotal"
5. `createBooking` action receives `bookingType: 'recurring'` + service ID
6. `generateRecurrenceSlots()` generates all occurrences
7. All generated sessions share the same `recurrence_group_id`

**No changes needed to:**
- Recurrence engine (`lib/booking/recurrence-engine.ts`)
- Recurring management in agenda (`recurring-booking-journey.md` §H2)
- Cancellation scope (this session vs all future)

**Changes needed:**
- `createBooking` must accept `serviceId` parameter
- Price calculation uses service price, not professional's `session_price_brl`

### Batch Booking Integration

Batch ("Várias datas") is also a booking mode.

**How it integrates:**
1. User selects any service
2. In Frame 4, "Várias datas" toggle is available (always, for all services)
3. User adds multiple date/time slots to a list
4. Checkout summary shows: "X sessões × R$ Y = Subtotal"
5. `createBooking` action receives `bookingType: 'batch'` + `batchDates[]`
6. `createBatchBookingGroup()` creates individual bookings linked by `batch_group_id`

**No changes needed to:**
- Batch booking group logic (`lib/booking/batch-booking.ts`)
- Batch cancellation scope

### Request Booking Integration

Request booking (`request-booking-journey.md`) remains a **parallel path** for when the professional doesn't have availability that matches the user's needs.

**How it integrates:**
1. User browses profile, sees "Não há horários disponíveis" or wants a custom time
2. CTA: "Solicitar horário personalizado" → `/solicitar/[id]`
3. Request booking form pre-fills the selected service (if any)
4. Request booking state machine (`open → offered → accepted/declined`) works independently

**Rule:** Request booking is available for **all services** of a professional (tier-gated: only `professional`/`premium` pros).

---

## 7. Data Model Evolution

### Current Model (Single Service)

```
professionals
├── session_price_brl
├── session_duration_minutes
└── (legacy fields)

professional_services (1 row per pro)
├── name: "Sessao principal"
├── service_type: "one_off"
└── mirrors professionals.price/duration
```

### Target Model (Multi-Service)

```
professionals
├── (price/duration fields kept for backward compatibility)
└── services → professional_services[]

professional_services (1..N rows per pro)
├── id UUID PK
├── professional_id UUID FK
├── name TEXT (e.g., "Sessão Inicial", "Acompanhamento")
├── service_type TEXT ('one_off' | 'one_off_plus_recurring' | 'monthly_subscription')
├── description TEXT
├── duration_minutes INTEGER
├── price_brl DECIMAL
├── enable_recurring BOOLEAN
├── enable_monthly BOOLEAN
├── is_active BOOLEAN
├── is_draft BOOLEAN
├── display_order INTEGER (NEW — controls sort order on profile)
└── created_at / updated_at
```

### bookings Table (add service_id)

```
bookings
├── professional_id UUID
├── service_id UUID FK → professional_services (NEW)
├── user_id UUID
├── scheduled_at TIMESTAMPTZ
├── duration_minutes INTEGER
├── amount_brl DECIMAL
├── status TEXT
├── booking_type TEXT ('one_off' | 'recurring' | 'batch')
├── recurrence_group_id UUID (nullable)
├── batch_group_id UUID (nullable)
├── notes TEXT (session purpose)
└── ...
```

### booking_sessions Table (already exists)

No schema changes. But price calculation must use `service.price_brl` instead of `professional.session_price_brl`.

### Changes to `createBooking` Server Action

**Current signature:**
```typescript
{
  professionalId: string
  scheduledAt?: string
  notes?: string
  sessionPurpose?: string
  bookingType?: 'one_off' | 'recurring' | 'batch'
  // ... recurring/batch params
}
```

**New signature:**
```typescript
{
  professionalId: string
  serviceId: string              // NEW — required
  scheduledAt?: string
  notes?: string
  sessionPurpose?: string
  bookingType?: 'one_off' | 'recurring' | 'batch'
  // ... recurring/batch params
}
```

**Validation changes:**
1. Verify `serviceId` belongs to `professionalId`
2. Verify `service.is_active = true`
3. Use `service.price_brl` and `service.duration_minutes` for calculations
4. If `bookingType === 'recurring'`, verify `service.enable_recurring = true`

---

## 8. Implementation Plan

### Phase 1: Multi-Service Data Layer (Week 1)

| Task | Files | Acceptance |
|------|-------|------------|
| Add `display_order` to `professional_services` | Migration + schema | Column exists, defaults to 0 |
| Update `upsertPrimaryService` to support multiple services | `lib/actions/professional.ts` | Can create N services; keeps backward compat |
| Update search to read all services (not just first) | `app/buscar/page.tsx` | Shows "A partir de R$ X" when multiple prices |
| Seed existing pros with 1 service (already done) | — | All pros have at least 1 service |

### Phase 2: Professional Profile Tabs (Week 1-2)

| Task | Files | Acceptance |
|------|-------|------------|
| Create `ProfessionalServicesList` component | `components/professional/ProfessionalServicesList.tsx` | Expandable cards with service details |
| Create tabbed layout for profile | `app/(app)/profissional/[id]/page.tsx` | Bio / Serviços / Avaliações tabs |
| Bio tab: extract current content | `components/professional/ProfileBioTab.tsx` | Shows bio, video, languages, tags |
| Services tab: render services list | `components/professional/ProfileServicesTab.tsx` | Sorted by `display_order`, expandable |
| Reviews tab: extract existing reviews | `components/professional/ProfileReviewsTab.tsx` | Existing review section moved here |
| Default tab = Bio for search traffic | `app/(app)/profissional/[id]/page.tsx` | `?tab=bio` is default |

### Phase 3: Service Selection → Booking Flow (Week 2-3)

| Task | Files | Acceptance |
|------|-------|------------|
| Add `serviceId` param to `/agendar/[id]` | `app/(app)/agendar/[id]/page.tsx` | URL accepts `?servico=uuid` |
| Update `BookingForm` to accept `serviceId` | `components/booking/BookingForm.tsx` | Loads service data, shows service card pinned |
| Update `createBooking` to require `serviceId` | `lib/actions/booking.ts` | Validates service belongs to pro |
| Update price calculation to use service price | `lib/actions/booking.ts` | `amount_brl` from service, not pro |
| Add service switcher in booking form | `components/booking/BookingForm.tsx` | "Trocar serviço" links back to profile |

### Phase 4: Multi-Step Booking UX (Week 3-4)

| Task | Files | Acceptance |
|------|-------|------------|
| Step 1: Service + Slot (existing form, reorganized) | `components/booking/BookingForm.tsx` | Step indicator, service card pinned |
| Step 2: Personal Info + Purpose (NEW) | `components/booking/BookingPersonalInfoStep.tsx` | Pre-filled fields, guided prompts |
| Step 3: Checkout Summary with breakdown (NEW) | `components/booking/BookingCheckoutStep.tsx` | Subtotal + fees + tax = total |
| Payment processing screen | `components/booking/BookingPaymentProcessing.tsx` | Loader, slot hold logic |
| Success screen redesign | `components/booking/BookingSuccessScreen.tsx` | Branded confirmation, .ics export |
| Step navigation state machine | `components/booking/BookingWizard.tsx` (new parent) | Back/next validation, step persistence |

### Phase 5: Professional Workspace (Week 4)

| Task | Files | Acceptance |
|------|-------|------------|
| Pro can manage multiple services | `components/dashboard/ProfessionalServicesManager.tsx` | CRUD for services |
| Pro can set service order | `components/dashboard/ProfessionalServicesManager.tsx` | Drag-to-reorder or numeric input |
| Pro can enable/disable recurring per service | `components/dashboard/ProfessionalServicesManager.tsx` | Toggle per service |
| Services reflected in dashboard earnings | `app/(app)/dashboard/page.tsx` | Earnings breakdown by service |

### Phase 6: Integration & Edge Cases (Week 5)

| Task | Files | Acceptance |
|------|-------|------------|
| Recurring booking uses service price | `lib/booking/recurrence-engine.ts` | All generated sessions use correct price |
| Batch booking uses service price | `lib/booking/batch-booking.ts` | All batch sessions use correct price |
| Request booking pre-fills service | `app/(app)/solicitar/[id]/page.tsx` | If user came from profile with service selected |
| Booking confirmation email uses service name | Email templates | "Sua Sessão Inicial com Dr. Ana" |
| Agenda shows service name per session | `app/(app)/agenda/page.tsx` | "Sessão Inicial — 14:00" |

---

## Appendix A: URL Schema

| URL | Purpose | Tab/State |
|-----|---------|-----------|
| `/profissional/[id]` | Default profile | Bio tab |
| `/profissional/[id]?tab=bio` | Profile bio | Bio tab |
| `/profissional/[id]?tab=servicos` | Profile services | Services tab |
| `/profissional/[id]?tab=avaliacoes` | Profile reviews | Reviews tab |
| `/profissional/[id]?servico=[sid]` | Profile with service pre-selected | Services tab, card expanded |
| `/agendar/[id]?servico=[sid]` | Book specific service | Step 1 (Service+Slot) |
| `/agendar/[id]?servico=[sid]&data=2026-04-07&hora=14:00` | Book with slot pre-filled | Step 1 with selections |
| `/solicitar/[id]?servico=[sid]` | Request booking for service | Request form with service |

## Appendix B: Component Inventory

| Component | New/Modified | Purpose |
|-----------|-------------|---------|
| `ProfessionalServicesList` | New | Expandable service cards on profile |
| `ProfileBioTab` | New | Bio content extracted from monolithic profile |
| `ProfileServicesTab` | New | Services list + calendar integration |
| `ProfileReviewsTab` | New | Reviews section extracted from profile |
| `BookingWizard` | New | Parent container for multi-step flow |
| `BookingPersonalInfoStep` | New | Step 2: personal info + purpose |
| `BookingCheckoutStep` | New | Step 3: price breakdown + payment |
| `BookingPaymentProcessing` | New | Payment loading state |
| `BookingSuccessScreen` | Modified | Redesigned confirmation |
| `BookingForm` | Modified | Becomes Step 1 (service + slot) |
| `ProfessionalServicesManager` | New | Pro dashboard CRUD for services |

---

## Related Documents

- [`professional-workspace-journey.md`](./professional-workspace-journey.md) — Pro management of services
- [`profile-edit-journey.md`](./profile-edit-journey.md) — Editing professional profile + services
- [`recurring-booking-journey.md`](./recurring-booking-journey.md) — Recurring session lifecycle
- [`request-booking-journey.md`](./request-booking-journey.md) — Custom time requests
- [`session-lifecycle.md`](./session-lifecycle.md) — Session execution after booking
- [`payments-billing-revenue.md`](./payments-billing-revenue.md) — Payment processing details
