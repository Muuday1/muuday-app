# Journey: Global Context Propagation

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** How country, timezone, currency, and language propagate across all user journeys  
**Actors:** All (User, Professional, Admin, System)  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Context Dimensions](#2-context-dimensions)
3. [Propagation Rules by Journey](#3-propagation-rules-by-journey)
4. [Frame-by-Frame: Context Settings](#4-frame-by-frame-context-settings)
5. [Edge Cases](#5-edge-cases)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

Global context (country, timezone, currency, language) is referenced in 5+ documents with slight inconsistencies. This document establishes the **single source of truth** for how context flows through every journey.

**Critical insight:**
> Timezone bugs are the #1 cause of booking confusion in marketplaces. A user in London booking a professional in São Paulo must see the session time in BOTH timezones, clearly labeled, everywhere.

---

## 2. Context Dimensions

| Dimension | Source of Truth | Default Resolution | User Override |
|-----------|----------------|-------------------|---------------|
| **Country** | `profiles.country` | Device geolocation or IP | Yes, in settings |
| **Timezone** | `profiles.timezone` | Device timezone | Yes, in settings |
| **Currency** | `profiles.currency` | Country default (BRL for BR, GBP for UK, USD for others) | Yes, in settings |
| **Language** | `profiles.language` or Accept-Language header | Browser language | Yes, in settings |

### Country → Defaults Mapping

| Country | Default Timezone | Default Currency | Default Language |
|---------|-----------------|------------------|------------------|
| BR | America/Sao_Paulo | BRL | pt-BR |
| PT | Europe/Lisbon | EUR | pt-PT |
| UK | Europe/London | GBP | en-GB |
| US | America/New_York | USD | en-US |
| Other | Device timezone | USD | en-US |

---

## 3. Propagation Rules by Journey

### Auth & Onboarding

| Step | Country | Timezone | Currency | Language |
|------|---------|----------|----------|----------|
| Signup form | Auto-detect, editable | Auto-detect, editable | Derived from country, editable | Browser default |
| OAuth callback | Use existing or detect | Use existing or detect | Use existing or derive | Browser default |
| Complete account | Normalize to chosen | Normalize to chosen | Normalize to chosen | Normalize to chosen |
| Post-login | Load from profile | Load from profile | Load from profile | Load from profile |

**Rule:** Country, timezone, and currency are captured EARLY (signup) because they affect all downstream behavior. Changes after booking history exists should warn user about implications.

### Search & Discovery

| Element | Country | Timezone | Currency | Language |
|---------|---------|----------|----------|----------|
| Search results | Filter by pro country OR user's search intent | Not shown | Convert and display | UI labels |
| Profile view | Show pro country | Show both user + pro timezone | Convert to user currency | UI labels |
| Price display | N/A | N/A | User currency, with "≈" if converted | N/A |
| Availability calendar | N/A | Show slots in user timezone (toggle to pro) | N/A | Day/month names |

**Rule:** Search is always in user's context. Professional's context is secondary and clearly labeled.

### Booking

| Element | Country | Timezone | Currency | Language |
|---------|---------|----------|----------|----------|
| Booking form | N/A | User timezone default, toggle to pro | User currency | UI labels |
| Calendar | N/A | User timezone | N/A | Day/month names |
| Time slots | N/A | Display both: "10:00 (São Paulo) / 14:00 (London)" | N/A | N/A |
| Success screen | N/A | Both timezones | User currency | UI labels |
| Confirmation email | N/A | Both timezones | User currency | User language |

**Rule:** Booking is the **highest-risk area for timezone bugs**. Every time display must show BOTH user and professional timezones, or at minimum have a clear toggle.

### Session Execution

| Element | Country | Timezone | Currency | Language |
|---------|---------|----------|----------|----------|
| Join window | N/A | UTC canonical, display in both | N/A | UI labels |
| Session page | N/A | Both timezones prominently | N/A | UI labels |
| Reminders | N/A | User timezone ONLY (recipient's context) | N/A | User language |

**Rule:** Session execution uses UTC internally. Display must be timezone-safe and explicit.

### Agenda

| Element | Country | Timezone | Currency | Language |
|---------|---------|----------|----------|----------|
| Upcoming list | N/A | User timezone default | N/A | Relative time ("em 2 horas") |
| Past list | N/A | User timezone | N/A | Date format |
| Professional agenda | N/A | Pro timezone default | N/A | Same |

**Rule:** Agenda shows in the viewer's timezone by default. Cross-timezone bookings show both.

### Payments

| Element | Country | Timezone | Currency | Language |
|---------|---------|----------|----------|----------|
| Checkout | Based on user's country | N/A | User currency | User language |
| Receipt | User country | N/A | Charged currency + user currency (if different) | User language |
| Payout | Pro country | N/A | Pro currency | Pro language |
| Refund | User country | N/A | Original currency | User language |

**Rule:** Payments follow the **payer's currency** for charges, **recipient's currency** for payouts.

### Notifications

| Element | Country | Timezone | Currency | Language |
|---------|---------|----------|----------|----------|
| In-app notification | N/A | User timezone | N/A | User language |
| Email | N/A | User timezone | N/A | User language |
| Reminder | N/A | User timezone | N/A | User language |

**Rule:** All notifications are in the **recipient's** context exclusively.

---

## 4. Frame-by-Frame: Context Settings

### Current State

**Where:** `app/(app)/perfil/page.tsx`, `app/(app)/configuracoes/page.tsx`  
**Current State:** Country, timezone, currency, language are set during signup and editable in settings. Scattered across forms.

### Target State: Unified Context Settings

```
[/configuracoes — Context Tab]
    
    Location & Time:
    ├── País: [Brazil ▼]
    │   └── Affects: currency default, compliance rules, payout eligibility
    ├── Fuso horário: [America/Sao_Paulo ▼]
    │   └── Affects: all time displays, reminder timing
    └── Horário local atual: "14:32 (São Paulo)"
    
    Preferences:
    ├── Moeda: [BRL (R$) ▼]
    │   └── "Prices will be shown in this currency"
    ├── Idioma: [Português (Brasil) ▼]
    │   └── Affects: all UI text, emails, notifications
    └── Formato de data: [DD/MM/YYYY ▼]
    
    Impact preview:
    ├── "Your next session will show as:"
    │   └── "Seg, 21 Abr, 10:00 (São Paulo) / 14:00 (London)"
    └── [Save changes]
    
    Warning on change:
    ├── If user has upcoming bookings and changes timezone:
    │   └── "⚠️ You have 3 upcoming sessions. Changing timezone will affect how times are displayed, not the actual session times."
    └── If user changes currency:
        └── "Prices will be converted using current exchange rates."
```

---

## 5. Edge Cases

### Daylight Saving Transitions

| Scenario | Rule |
|----------|------|
| Session scheduled before DST, occurs after DST | Display time adjusts automatically. No user action needed. |
| User in non-DST country books pro in DST country | Both times shown with offset. System handles conversion. |
| DST gap (spring forward) | If session falls in gap, block booking. Show error: "This time doesn't exist due to daylight saving." |
| DST overlap (fall back) | If session falls in overlap, use first occurrence. Document choice. |

### Cross-Country Currency

| Scenario | Rule |
|----------|------|
| User in UK, Pro in BR, charge in GBP | Stripe UK rail. Payout to pro in BRL via BR rail. |
| Unsupported currency | Fallback to USD. Show "Prices shown in USD. Your bank may charge conversion fees." |
| Currency change after booking | Display remains in original booking currency. New bookings use new currency. |

### Language Fallback

| Scenario | Rule |
|----------|------|
| User language = pt-PT, but only pt-BR available | Use pt-BR with note: "Muuday is currently available in Brazilian Portuguese." |
| User language = unsupported | Fallback to en-US. Show language selector prominently. |
| Email language ≠ UI language | Use profile language for all communications. |

---

## 6. Implementation Plan

### Phase 1: Audit & Standardize (Week 1)

| Task | File | Effort |
|------|------|--------|
| Audit all timezone displays | Search codebase for `scheduled_at`, `toLocaleString`, `Intl.DateTimeFormat` | 2 days |
| Standardize timezone helper | `lib/timezone/display.ts` | 1 day |
| Audit all currency displays | Search for `price`, `currency`, `formatPrice` | 1 day |

### Phase 2: Display Hardening (Week 2)

| Task | File | Effort |
|------|------|--------|
| Dual-timezone component | `components/ui/DualTimezoneDisplay.tsx` | 1 day |
| Apply to booking form | `components/booking/BookingForm.tsx` | 1 day |
| Apply to agenda | `app/(app)/agenda/page.tsx` | 1 day |
| Apply to session page | `app/(app)/sessao/[id]/page.tsx` | 1 day |

### Phase 3: Settings Consolidation (Week 3)

| Task | File | Effort |
|------|------|--------|
| Unified context settings | `components/settings/ContextSettings.tsx` | 2 days |
| Context change warnings | `lib/actions/user-profile.ts` | 1 day |
| Country-dependent defaults | `lib/config/country-defaults.ts` | 1 day |

### Phase 4: Testing (Week 4)

| Task | File | Effort |
|------|------|--------|
| DST transition tests | `tests/unit/timezone.test.ts` | 2 days |
| Cross-timezone booking E2E | `checkly/tests/cross-timezone-booking.spec.js` | 2 days |

---

## Related Documents

- `docs/spec/source-of-truth/part2-onboarding-booking-lifecycle.md` — Timezone rules
- `lib/booking/recurring-deadlines.ts` — Deadline calculations
- `lib/professional/onboarding-helpers.ts` — Country/timezone setup
