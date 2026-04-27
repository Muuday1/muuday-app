# Codex Implementation Instructions

## What you are building

You are implementing the Muuday professional onboarding, tier-gated settings, recurrence/multiple bookings, and video sessions (Agora) system. All services are VIDEO ONLY (no in-person). Professionals serve GLOBALLY (no jurisdiction restrictions).

## How to work

1. **Follow the plan strictly.** Read `docs/engineering/onboarding-and-tiers-implementation-plan.md` — it has 14 phases with exact file paths, exact changes, and exit criteria.
2. **Execute phases IN ORDER:** Phase 1 → Phase 2 → then Phases 3-14. Do NOT skip ahead.
3. **After each phase, verify the exit criteria** listed at the end of that phase section before moving to the next.
4. **Read existing code before modifying.** Every file you need to change is listed in the plan with its current state described. Read the file first, understand it, then make targeted changes.
5. **Do NOT create files that aren't in the plan** unless strictly necessary for the change.
6. **Do NOT add comments, docstrings, or type annotations to code you didn't change.**
7. **Do NOT refactor surrounding code.** Only change what the plan specifies.

## Blur/Lock UX Pattern (CRITICAL — applies everywhere)

Tier-gated features use a BLUR/LOCK pattern. The professional can navigate to ALL areas freely, but locked features are:
- **Visible but blurred** — `blur-sm opacity-60 pointer-events-none` on the content
- **Overlay on top** with: lock icon, text "Disponível no plano Professional/Premium", and "Ver planos" CTA button
- **Underlying content shows realistic preview** — not empty state. Show placeholder/disabled inputs behind the blur.

Create a reusable component `components/tier/TierLockedOverlay.tsx` with props: `currentTier`, `requiredTier`, `featureName`, `children`. If current >= required, render children normally. Otherwise, render children blurred with overlay.

Tier hierarchy: basic < professional < premium.

Apply this pattern to ALL tier-locked features in edit profile, settings, scheduling settings, onboarding checklist, and dashboard. See the full spec in the plan under "UX PATTERN — BLUR/LOCK FOR TIER-GATED FEATURES".

## Critical rules

- **All sessions are VIDEO (Agora).** There is no in-person option. Do not add delivery_method, in_person, or presencial anywhere.
- **No service jurisdiction.** Professionals serve globally. Do not add service_jurisdictions field.
- **Tier limits (source of truth: `lib/tier-config.ts` + `db/sql/migrations/045-wave2-admin-plan-configs.sql`):**
  - Basic: 1 service, 1 specialty, 3 tags, 1 option/service, 30-day window
  - Professional: 3 services, 3 specialties, 4 tags, 3 options/service, 90-day window
  - Premium: 5 services, 3 specialties, 5 tags, 6 options/service, 180-day window
- **Annual = 10x monthly** (not 15% discount)
- **Buffer time:** Basic fixed 15min, Professional/Premium configurable 5-60min
- **Manual-accept:** Professional/Premium only. Basic is auto-accept only.
- **Recurrence:** Same day + same time, repeating. USER chooses periodicity (weekly, biweekly, monthly, every X days). USER chooses duration (num occurrences or end date). Constrained by professional's booking window.
- **Multiple bookings:** User selects multiple non-recurring dates in one checkout. Independent bookings linked by batch_booking_group_id.
- **Tier enforcement MUST be server-side** (in lib/actions/), not just UI.
- **UI language is Portuguese (pt-BR).**

## Phase execution guide

### PHASE 1 — Schema (do this FIRST)
Read the plan's Phase 1. Create a single Supabase migration with all ALTER TABLE and CREATE TABLE statements. Do NOT touch any TypeScript files yet.

Files to create:
- `supabase/migrations/YYYYMMDDHHMMSS_onboarding_tiers_expansion.sql`

### PHASE 2 — Backend Logic
Read the plan's Phase 2. Update these files in order:

1. `lib/tier-config.ts` — Fix WRONG limits (currently Basic has 2 specialties/3 services). Add TierFeature type and isFeatureAvailable(), getMinNoticeRange(), getBufferConfig(), getSocialLinksLimit(), getExtendedBioLimit().
2. `lib/professional/onboarding-gates.ts` — Add new snapshot fields, new reason codes (missing_cancellation_policy, missing_terms_acceptance, missing_credentials), new blockers, new matrix rows.
3. `lib/professional/onboarding-state.ts` — Add queries for new columns and professional_credentials count.
4. `lib/booking/types.ts` — Add recurrence fields.
5. `lib/booking/settings.ts` — Default bufferMinutes to 15 (currently 0).
6. `lib/booking/availability-engine.ts` — Apply buffer time in slot calculation.
7. Create `lib/booking/recurrence-engine.ts` — Slot generation and conflict detection.
8. Create `lib/booking/batch-booking.ts` — Batch booking creation.

### PHASE 3 — Search Cards
Update `app/(app)/buscar/page.tsx`:
- Add cover_photo_url, video_intro_url, whatsapp_number to select query
- Show cover photo as card header if available
- Show tier badge (Professional/Premium only)

### PHASE 4 — Professional Public Profile
Update `app/(app)/profissional/[id]/page.tsx`:
- Cover photo as header background (instead of gradient) if available
- Tier badge next to name
- WhatsApp button (Professional/Premium)
- Social links (Professional/Premium)
- Video intro embed (Professional/Premium)
- Add new fields to select query

### PHASE 5 — Professional Edit Profile
Update `app/(app)/editar-perfil-profissional/page.tsx`:
- Add cover photo upload, WhatsApp input, video intro URL, social links
- Lock tier-gated fields for Basic with upgrade CTA
- Enforce limits on save (server-side in lib/actions/professional.ts)

### PHASE 6 — Onboarding Checklist
Update `app/(app)/onboarding-profissional/page.tsx`:
- Add new checklist items: cancellation policy, terms, credentials (sensitive), calendar sync
- Show tier-gated optional items with lock icon

### PHASE 7 — Settings Pages
Update:
- `components/settings/ProfessionalSettingsWorkspace.tsx` — tier-aware sections
- `app/(app)/configuracoes-agendamento/page.tsx` — buffer time (fixed for Basic), manual-accept (locked for Basic), min notice range by tier, max window by tier

### PHASE 8 — Calendar & Availability
Update:
- `app/(app)/disponibilidade/page.tsx` — show buffer time, calendar sync status
- `app/(app)/agenda/page.tsx` — recurring booking indicators, batch grouping

### PHASE 9 — Booking Checkout
Update:
- `components/booking/BookingForm.tsx` — add recurring option (periodicity selector, duration) and multiple bookings ("adicionar mais datas")
- `lib/actions/booking.ts` — handle recurrence and batch creation
- `app/(app)/agendar/[id]/page.tsx` — pass new props

### PHASE 10 — Dashboard
Update `app/(app)/dashboard/page.tsx` — show tier, upgrade CTA, calendar sync warning

### PHASE 11 — Video Sessions (Agora)
Create:
- `app/api/agora/token/route.ts` — RTC token generation
- `components/booking/VideoSession.tsx` — Agora video component
- `app/(app)/sessao/[bookingId]/page.tsx` — session room page
Update:
- `app/(app)/agenda/page.tsx` — "Entrar na sessao" button

### PHASE 12 — Stripe Pay-in (UK Only)
Update:
- `lib/stripe/client.ts` — single Stripe UK client (no region switching)
- All customer pay-in routed through Stripe UK
- Payouts handled by Trolley (not Stripe Connect)
- See `docs/project/payments-engine/MASTER-PLAN.md` for canonical architecture

### PHASE 13 — Admin
Update `app/(app)/admin/page.tsx` — show credentials in review queue

### PHASE 14 — Landing & Public
Update `app/page.tsx` and `app/registrar-profissional/page.tsx` — feature cards, tier preview

## Source of truth documents

Read these before starting:
- `docs/spec/source-of-truth/part1-foundations-search-tiers.md` — Section 4 (tiers)
- `docs/spec/source-of-truth/part2-onboarding-booking-lifecycle.md` — Section 1 (onboarding)
- `docs/engineering/onboarding-and-tiers-implementation-plan.md` — THE PLAN (follow this)

## Testing

After each phase:
- Run `pnpm tsc --noEmit` to check for type errors
- Run `pnpm lint` to check for lint issues
- Fix any errors before proceeding to the next phase


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
