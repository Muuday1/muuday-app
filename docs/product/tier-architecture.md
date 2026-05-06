# Muuday Tier Architecture — Source of Truth

**Status:** Canonical specification  
**Last updated:** 2026-04-19  
**Scope:** Professional tier model, entitlements, limits, and conversion strategy  
**Purpose:** Define a 2-tier paid model with clear value differentiation. **There is no free plan.**

---

## The Problem with Previous Tiers

| Previous Issue | Why It Confused |
|----------------|-----------------|
| **"Professional" = role + tier** | A "professional" user on the "Professional" tier created semantic collision |
| **3 tiers with minimal differentiation** | Basic (free) got almost nothing; Professional got almost everything; Premium added only PDF export |
| **Free tier unsustainable** | Free professionals incurred platform costs (video, storage, support) without revenue |
| **Arbitrary numeric limits** | 1/3/5 services, 3/4/5 tags felt random |
| **No clear conversion path** | Users could not articulate why they'd upgrade from Basic → Pro → Premium |

**Decision:** Eliminate the free tier entirely. Every professional on Muuday pays to be on the platform. Two paid tiers provide clear choice without overwhelming.

---

## New Tier Model

### Philosophy

> **"Pague pelo que precisa. Escalone quando crescer."**

Two paid tiers. One billing variation. No free plan. No ambiguity.

| Tier | Billing | Positioning |
|------|---------|-------------|
| **Essencial** | Monthly subscription | For professionals starting their practice — one service, essential features |
| **Pro** | Monthly subscription | For professionals scaling their practice — unlimited services, full feature set |
| **Pro Anual** | Annual subscription (~17% discount) | Same as Pro, billed yearly |

### Naming Rules

- **Role**: `user` (cliente) vs `professional` (prestador) — unchanged
- **Tier**: `essential` or `pro` — never use "professional" as a tier name
- **Tier label in UI**: "Essencial" / "Pro" / "Pro Anual"
- **Never say**: "upgrade to Professional" — say "upgrade to Pro"
- **Never imply**: any tier is free — both are paid subscriptions

---

## Feature Matrix

### Core Features (all tiers)

Every professional gets:
- Public profile page with bio, photo, and reviews
- 1 service (Essencial) or unlimited services (Pro) with price and duration
- Availability calendar
- Booking acceptance (manual or auto)
- Video sessions (Agora)
- Basic support
- Request booking (all tiers)

### Essencial Tier Limits

| Dimension | Limit | Rationale |
|-----------|-------|-----------|
| Services | 1 | Enough to start; upgrade to diversify |
| Tags | 5 | Enough for discoverability |
| Booking window | 30 days | Prevents calendar bloat |
| Cover photo | ✅ | Visual identity is essential |
| WhatsApp on profile | ✅ | Direct contact is a conversion tool |
| Confirmation mode | Manual or Auto | Full control even on entry tier |
| Batch booking (multiple dates) | ✅ | Users can book multiple sessions |
| Recurring packages | ❌ | Complex to manage; Pro feature |
| Video intro | ❌ | Media hosting cost; Pro feature |
| Social links | ❌ | Advanced profile; Pro feature |
| Calendar sync (Outlook/Google) | ❌ | Integration complexity; Pro feature |
| Promotions / discounts | ❌ | Revenue optimization; Pro feature |
| CSV/PDF export | ❌ | Business analytics; Pro feature |
| Service descriptions | Basic (200 chars) | Detailed descriptions are Pro |
| Platform fee | 15% | Higher fee on entry tier |
| "Pro" badge on profile | ❌ | Badge reserved for Pro tier |
| Analytics dashboard | Basic | Views and bookings count only |

### Pro Tier (Monthly / Annual)

| Dimension | Limit | Rationale |
|-----------|-------|-----------|
| Services | Unlimited | Full portfolio offering |
| Tags | Unlimited | Maximum discoverability |
| Booking window | 90 days | Long-term planning |
| Cover photo | ✅ | Included |
| WhatsApp on profile | ✅ | Included |
| Confirmation mode | Manual, Auto, or Hybrid | Full flexibility |
| Batch booking | ✅ | Included |
| Recurring packages | ✅ | Subscription revenue model |
| Video intro | ✅ | Build trust before booking |
| Social links | ✅ | Cross-platform presence |
| Calendar sync | Outlook + Google | Professional workflow |
| Promotions / discounts | ✅ | First-session discounts, coupons |
| CSV/PDF export | ✅ | Tax/accounting compliance |
| Service descriptions | Full (2000 chars) | Rich service storytelling |
| Platform fee | 10% | Lower fee rewards commitment |
| Priority support | ✅ | Faster response |
| "Pro" badge on profile | ✅ | Trust signal for users |
| Analytics dashboard | Full | Conversion, earnings, trends |

---

## Tier Conversion Strategy

### Essencial → Pro Triggers

| Trigger | Where it happens | CTA |
|---------|-----------------|-----|
| Try to add 2nd service | `/dashboard/servicos` | "Adicione mais serviços com Pro" |
| Try to enable recurring | Service editor | "Pacotes recorrentes disponíveis no Pro" |
| Try to upload video intro | Profile edit | "Vídeo de apresentação é um recurso Pro" |
| 10 bookings completed | Dashboard milestone | "Você está pronto para Pro — veja por quê" |
| View earnings analytics | Dashboard | "Análises completas no Pro" |
| Need calendar sync | Settings | "Sincronize sua agenda com Pro" |

### Pro → Pro Annual Trigger

| Trigger | Where | CTA |
|---------|-------|-----|
| 3 months on Pro | Billing settings | "Economize 17% com Pro Anual" |
| Annual tax season | Email / Dashboard | "Exporte relatórios anuais e economize na assinatura" |

---

## Tier Storage & Validation

### Database

```sql
-- professionals.tier: 'essential' | 'pro' | 'pro_annual'
-- professionals.plan_expires_at: TIMESTAMPTZ
-- professionals.plan_started_at: TIMESTAMPTZ
```

### Validation Rules

1. **Essencial** → `plan_expires_at >= NOW()` (paid monthly)
2. **Pro** → `plan_expires_at >= NOW()` (paid monthly)
3. **Pro Annual** → `plan_expires_at >= NOW()` + yearly billing
4. On expiry: 7-day grace period, then account suspended (not downgraded to free — there is no free tier)
5. On re-subscribe: reactivate previously inactive services

### Grace Period

- Pro expires → 7-day grace period where all features work
- After 7 days → account suspended (profile hidden from search, no new bookings)
- Previously inactive services remain archived and restore on re-subscription
- **No downgrade to free tier** — because there is no free tier

---

## UI Guidelines for Tier Gates

### When an Essencial user tries to use a Pro feature:

```
┌─────────────────────────────────────────┐
│  ⭐ Recursos Pro                         │
│                                         │
│  Pacotes recorrentes permitem que seus  │
│  clientes agendem acompanhamento        │
│  semanal automaticamente.               │
│                                         │
│  [Ver planos Pro]  [Agora não]         │
└─────────────────────────────────────────┘
```

**Rules:**
- Never block with error — always upsell with context
- Show WHAT the feature does, not just "upgrade required"
- Price should be visible: "A partir de R$ XX/mês"
- "Agora não" must always be an option (no dark patterns)
- **Never imply** the current tier is free

---

## Migration from Old Tiers

| Old Tier | New Tier | Action |
|----------|----------|--------|
| `basic` (free) | `essential` | Migrate with payment requirement — users must subscribe within 30 days or account is suspended |
| `professional` | `essential` or `pro` | Map based on feature usage; heavy users → Pro, light users → Essencial |
| `premium` | `pro` | Rename + preserve all data |

Migration script:
```sql
-- Step 1: Rename existing paid tiers
UPDATE professionals SET tier = 'pro' WHERE tier IN ('professional', 'premium');

-- Step 2: Former Basic users become Essential (must subscribe)
UPDATE professionals SET tier = 'essential' WHERE tier = 'basic';

-- Step 3: Set plan_expires_at for all (no NULL — there is no free tier)
-- Former free users get 30-day trial
UPDATE professionals 
SET plan_expires_at = NOW() + INTERVAL '30 days' 
WHERE tier = 'essential' AND plan_expires_at IS NULL;
```

---

## Related Documents

- [`professional-workspace-journey.md`](./journeys/professional-workspace-journey.md) — Dashboard with tier context
- [`profile-edit-journey.md`](./journeys/profile-edit-journey.md) — Service editing with tier limits
- [`search-booking.md`](./journeys/search-booking.md) — Booking flow (no tier gates for users)
- [`settings-preferences-journey.md`](./journeys/settings-preferences-journey.md) — Plan management in settings
