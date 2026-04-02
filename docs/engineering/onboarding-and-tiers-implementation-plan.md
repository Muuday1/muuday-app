# Onboarding, Tiers & Cross-Cutting Implementation Plan

Last updated: 2026-04-02
Depends on: Part 1 (Section 3-4), Part 2 (Section 1, 13), execution-plan.md Wave 2

---

## Context

This plan covers ALL changes needed to implement the corrected tier limits, new onboarding fields, tier-gated settings, recurrence/multiple bookings, video sessions (Agora), and Stripe dual-platform architecture. It maps every change to the specific files that need modification.

**Spec changes made (2026-04-02):**
- Tier limits corrected: Basic 1 service/1 specialty, Professional 5/3, Premium 10/3
- Annual = 10x monthly (not 15% discount)
- 11 new onboarding/profile fields added
- Recurrence with user-chosen periodicity + multiple bookings
- Video via Agora (not deferred)
- Dual Stripe (BR + UK)
- All sessions are VIDEO only (Agora). No in-person.
- No service jurisdiction — professionals serve globally.
- Blur/lock UX pattern for tier-gated features.

---

## UX PATTERN — BLUR/LOCK FOR TIER-GATED FEATURES (applies to ALL phases)

This is the core UX concept for tier gating. It applies across ALL pages where a feature is restricted by tier.

### Concept
The professional can navigate freely to ALL areas of the platform. Nothing is hidden. But features locked by their current tier are:
1. **Visible but blurred/dimmed** — the professional can SEE the feature exists
2. **Not interactive** — clicks on locked areas do nothing (pointer-events: none)
3. **Overlay with lock icon + tier badge** — a semi-transparent overlay sits on top with:
   - A lock icon (🔒 or Lucide `Lock`)
   - Text: "Disponível no plano Professional" or "Disponível no plano Premium"
   - A CTA button: "Ver planos" linking to plan comparison page
4. **The underlying content shows a realistic preview** — not empty state. For example:
   - Locked "Video intro" section shows a placeholder video thumbnail with blur
   - Locked "Social links" section shows greyed-out input fields
   - Locked "Manual-accept" toggle shows the toggle in disabled state with blur overlay
   - Locked "Buffer time slider" shows the slider at 15min, disabled, with blur overlay

### Implementation pattern
Create a reusable component:
```
components/tier/TierLockedOverlay.tsx
```
Props:
- `currentTier: ProfessionalTier`
- `requiredTier: ProfessionalTier` — minimum tier needed
- `featureName: string` — e.g. "Video de apresentação"
- `children: ReactNode` — the actual feature content (rendered blurred behind overlay)

Behavior:
- If `currentTier >= requiredTier` → render children normally, no overlay
- If `currentTier < requiredTier` → render children with `blur-sm opacity-60 pointer-events-none` + overlay on top

Tier hierarchy: basic < professional < premium

### Where this pattern applies

**Edit Profile page (`editar-perfil-profissional`):**
- Video intro URL input → locked for Basic
- Social links inputs → locked for Basic
- Extended bio (long section) → locked for Basic

**Settings workspace (`ProfessionalSettingsWorkspace`):**
- WhatsApp visibility toggle → locked for Basic
- WhatsApp notification toggle → locked for Basic
- Manual-accept toggle → locked for Basic
- Buffer time slider → locked for Basic (show fixed 15min behind blur)
- Outlook calendar sync → locked for Basic
- CSV/PDF export buttons → locked for Basic/Professional respectively

**Scheduling settings (`configuracoes-agendamento`):**
- Manual-accept mode → locked for Basic
- Buffer time configuration → locked for Basic
- Min notice range beyond Basic range → show options but locked

**Profile public page (`profissional/[id]`):**
- This is the PUBLIC view — no lock overlay here. Simply don't render tier-gated fields the professional hasn't unlocked.

**Onboarding checklist (`onboarding-profissional`):**
- Tier-gated optional items show with lock icon + "Disponível no plano Professional/Premium" text
- These are NOT blockers — just informational. The professional can complete onboarding without them.

**Dashboard:**
- Upgrade CTA card if on Basic tier
- Show what they'd unlock by upgrading (use feature preview cards with blur)

---

## PHASE 1 — Schema & Data Model

No UI changes. All columns nullable/defaulted. Zero breaking changes.

### Step 1.1 — Extend `professionals` table
```sql
alter table professionals add column if not exists whatsapp_number text;
alter table professionals add column if not exists cover_photo_url text;
alter table professionals add column if not exists video_intro_url text;
alter table professionals add column if not exists social_links jsonb;
alter table professionals add column if not exists platform_region text; -- 'br' | 'uk' | null
```

### Step 1.2 — Extend `professional_settings` table
```sql
alter table professional_settings add column if not exists calendar_sync_provider text;
alter table professional_settings add column if not exists cancellation_policy_accepted boolean default false;
alter table professional_settings add column if not exists terms_accepted_at timestamptz;
alter table professional_settings add column if not exists terms_version text;
alter table professional_settings add column if not exists buffer_time_minutes integer default 15;
alter table professional_settings add column if not exists notification_email boolean default true;
alter table professional_settings add column if not exists notification_push boolean default true;
alter table professional_settings add column if not exists notification_whatsapp boolean default false;
```

### Step 1.3 — Create `professional_credentials` table
```sql
create table professional_credentials (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references professionals(id) on delete cascade,
  file_url text not null,
  file_name text,
  credential_type text, -- 'diploma', 'license', 'certification', 'other'
  uploaded_at timestamptz default now(),
  verified boolean default false,
  verified_at timestamptz,
  verified_by uuid references profiles(id)
);
-- RLS: professional can read/insert own. Admin can read/update all.
```

### Step 1.4 — Extend `bookings` table
```sql
alter table bookings add column if not exists recurrence_group_id uuid;
alter table bookings add column if not exists batch_booking_group_id uuid;
alter table bookings add column if not exists recurrence_periodicity text; -- 'weekly'|'biweekly'|'monthly'|'custom'
alter table bookings add column if not exists recurrence_interval_days integer;
alter table bookings add column if not exists recurrence_end_date date;
alter table bookings add column if not exists recurrence_occurrence_index integer;
-- Index for group lookups
create index if not exists idx_bookings_recurrence_group on bookings(recurrence_group_id) where recurrence_group_id is not null;
create index if not exists idx_bookings_batch_group on bookings(batch_booking_group_id) where batch_booking_group_id is not null;
```

### Step 1.6 — Migration & RLS
- Write single Supabase migration file with all above
- Update RLS for professional_credentials
- Run on dev branch → validate → production

**Exit criteria:** All columns exist. RLS passes. Existing queries unaffected.

**Files touched:** Migration file only (new file in `supabase/migrations/`)

---

## PHASE 2 — Backend Logic

### Step 2.1 — Update tier-config.ts
**File:** `lib/tier-config.ts`

Current values are WRONG (Basic: 2 specialties/3 services, Premium: 5/20). Fix to:
```typescript
export type TierFeature =
  | 'manual_accept' | 'video_intro' | 'whatsapp_profile' | 'social_links'
  | 'extended_bio' | 'outlook_sync' | 'whatsapp_notifications' | 'promotions'
  | 'csv_export' | 'pdf_export' | 'cover_photo'

TIER_LIMITS = {
  basic: { specialties: 1, tags: 3, services: 1, serviceOptionsPerService: 3, bookingWindowDays: 60 },
  professional: { specialties: 3, tags: 5, services: 5, serviceOptionsPerService: 6, bookingWindowDays: 90 },
  premium: { specialties: 3, tags: 10, services: 10, serviceOptionsPerService: 10, bookingWindowDays: 180 },
}
```
Add:
- `TIER_FEATURES: Record<ProfessionalTier, TierFeature[]>` — which features each tier has
- `isFeatureAvailable(tier, feature): boolean`
- `getMinNoticeRange(tier): { min: number, max: number }` — Basic 2-48h, Pro 1-72h, Premium 0.5-168h
- `getBufferConfig(tier): { configurable: boolean, defaultMinutes: number }` — Basic fixed 15, Pro/Premium configurable
- `getSocialLinksLimit(tier): number` — Basic 0, Pro 2, Premium 5
- `getExtendedBioLimit(tier): number` — Basic 0, Pro 2000, Premium 5000
- `getGalleryLimit(tier): number` — removed (no gallery)

### Step 2.2 — Update onboarding-gates.ts
**File:** `lib/professional/onboarding-gates.ts`

Add to `ProfessionalOnboardingSnapshot`:
```typescript
professional: {
  ...existing,
  whatsappNumber?: string | null
  coverPhotoUrl?: string | null
  videoIntroUrl?: string | null
  socialLinks?: Record<string, string> | null
}
settings: {
  ...existing,
  calendarSyncProvider?: string | null
  cancellationPolicyAccepted?: boolean
  termsAcceptedAt?: string | null
  termsVersion?: string | null
  bufferTimeMinutes?: number
  notificationPreferences?: { email: boolean; push: boolean; whatsapp: boolean } | null
}
credentialUploadCount: number
```

Add reason codes:
- `missing_cancellation_policy` → C5, required_for_review_submission
- `missing_terms_acceptance` → C6, required_for_review_submission
- `missing_credentials` → C3, required_for_go_live (sensitive categories only)

Add matrix rows for these 4 fields.

### Step 2.3 — Update onboarding-state.ts
**File:** `lib/professional/onboarding-state.ts`

Add queries for: professional_credentials count, new professional columns, new settings columns.

### Step 2.4 — Update booking settings
**File:** `lib/booking/settings.ts`

- Add `bufferTimeMinutes` to `ProfessionalBookingSettings` (currently `bufferMinutes` exists but defaults to 0)
- Default bufferMinutes to 15 (was 0)
- Add `deliveryMethod` to service-level settings

**File:** `lib/booking/types.ts`
- Add `'batch'` to `BOOKING_TYPES`
- Add recurrence fields to BookingSlotInput

### Step 2.5 — Update booking availability engine
**File:** `lib/booking/availability-engine.ts`

- Apply buffer time between sessions when calculating available slots
- Respect tier-based booking window limits
- Add recurrence slot generation logic
- Add batch booking validation (multiple non-recurring dates)
- Conflict detection for recurring slots

### Step 2.6 — Update public visibility
**File:** `lib/professional/public-visibility.ts`

- Include new snapshot fields in evaluation
- Ensure new blocker codes propagate correctly

### Step 2.7 — Create recurrence engine
**New file:** `lib/booking/recurrence-engine.ts`

- `generateRecurrenceSlots(startDate, dayOfWeek, time, periodicity, intervalDays, endDateOrCount, bookingWindowDays): Date[]`
- `detectConflicts(slots, existingBookings, blockedTimes): ConflictResult[]`
- `createRecurrenceGroup(slots, bookingData): Booking[]`

### Step 2.8 — Create batch booking engine
**New file:** `lib/booking/batch-booking.ts`

- `createBatchBooking(dates[], bookingData): Booking[]`
- Links bookings by `batch_booking_group_id`

**Exit criteria:** All backend logic correct. Tier limits enforced server-side. Recurrence/batch generation works.

---

## PHASE 3 — Search Cards & Discovery

### Step 3.1 — Update search result cards
**File:** `app/(app)/buscar/page.tsx`

Currently cards show: photo/initial, name, category, specialty, price, rating, location, tags.
Add:
- Cover photo as card header (if available, replacing gradient)
- Tier badge next to name (Professional/Premium only — no badge for Basic)
- Video intro indicator icon (if has video_intro_url)
- WhatsApp indicator (if Professional/Premium and has whatsapp_number)

### Step 3.2 — Update search query to include new fields
**File:** `app/(app)/buscar/page.tsx`

Current select: `id,public_code,session_price_brl,session_duration_minutes,rating,total_reviews,tier,tags,bio,profiles!inner(...),category,subcategories`
Add to select: `cover_photo_url,video_intro_url,whatsapp_number

### Step 3.3 — Update search filters
**File:** `app/(app)/buscar/page.tsx`, `components/search/MobileFiltersDrawer.tsx`, `components/search/DesktopFiltersAutoApply.tsx`



### Step 3.4 — Update recommendation cards
**File:** `app/(app)/profissional/[id]/page.tsx` (lines 264-293)

Same card updates as 3.1 for recommendation section at bottom of profile page.

**Exit criteria:** Cards show new fields. Filters work. No layout regressions.

---

## PHASE 4 — Professional Public Profile Page

### Step 4.1 — Profile header
**File:** `app/(app)/profissional/[id]/page.tsx` (lines 326-349)

Currently: gradient header with avatar.
Change to:
- If `cover_photo_url` exists → use as header background image instead of gradient
- Tier badge next to name (Professional: green outline badge, Premium: gold badge)
- WhatsApp button (if Professional/Premium and has number)
- Social links row (if Professional/Premium, max by tier)

### Step 4.2 — Video intro section
**File:** `app/(app)/profissional/[id]/page.tsx`

Add new section after bio:
- Embedded video player (YouTube/Vimeo oEmbed) if `video_intro_url` exists
- Only visible if Professional/Premium


### Step 4.4 — Credentials display (sensitive categories)
**File:** `app/(app)/profissional/[id]/page.tsx`

For sensitive categories, show "Credenciais verificadas" badge if credentials uploaded and verified.

### Step 4.5 — Delivery method on services
**File:** `components/professional/ProfileAvailabilityBookingSection.tsx`

### Step 4.6 — Update data loading
**File:** `app/(app)/profissional/[id]/page.tsx` (line 86)

Add to professional select: `cover_photo_url,video_intro_url,whatsapp_number,social_links`

**Exit criteria:** Profile shows all new fields. Tier-gated fields only show for correct tiers.

---

## PHASE 5 — Professional Edit Profile

### Step 5.1 — Add new fields to edit form
**File:** `app/(app)/editar-perfil-profissional/page.tsx`

Add form sections:
- WhatsApp number input
- Cover photo upload
- Video intro URL (with YouTube/Vimeo URL validation) — show lock for Basic
- Social links (instagram, linkedin, website) — show lock for Basic, respect tier limit
- Credential upload section (for sensitive categories)

### Step 5.2 — Tier-aware field locking
**File:** `app/(app)/editar-perfil-profissional/page.tsx`

- Import `getTierLimits`, `isFeatureAvailable` from tier-config
- Lock/blur fields that exceed tier (video_intro for Basic, social_links for Basic)
- Show "Disponivel no plano Professional" CTA with link to plan comparison
- Enforce specialty limit (1 for Basic, 3 for Pro/Premium)
- Enforce service count limit when creating new services

### Step 5.3 — Update save action
**File:** `lib/actions/professional.ts`

- Validate tier limits server-side before saving
- Save new fields to professionals table
- Handle credential file uploads to Supabase Storage

**Exit criteria:** Professional can edit all new fields. Tier limits enforced on save.

---

## PHASE 6 — Onboarding Checklist Page

### Step 6.1 — Update onboarding page
**File:** `app/(app)/onboarding-profissional/page.tsx`

Add new checklist items:
- C2: "Jurisdicao de atendimento" with link to edit profile
- C3: "Upload de credenciais" (for sensitive categories) with link to edit profile
- C5: "Aceitar politica de cancelamento" with inline checkbox or link
- C5: "Conectar calendario" (recommended, not blocking) with Google/Outlook buttons
- C6: "Aceitar termos de servico" with inline checkbox or link

Show tier-gated optional items with lock icon:
- "Video de apresentacao" (Professional/Premium)
- "WhatsApp no perfil" (Professional/Premium)
- "Links de redes sociais" (Professional/Premium)

### Step 6.2 — Update completar-perfil page
**File:** `app/(app)/completar-perfil/page.tsx`

Add missing field prompts for new required fields.

**Exit criteria:** Full onboarding checklist with all new items. Blockers show correct actionHref.

---

## PHASE 7 — Configuracoes (Settings) Pages

### Step 7.1 — Update ProfessionalSettingsWorkspace
**File:** `components/settings/ProfessionalSettingsWorkspace.tsx`

Currently has sections: profile, scheduling, notifications, billing/payout.
Add/modify:
- **Profile section:** cover photo, video intro (tier-gated), social links (tier-gated), WhatsApp number
- **Scheduling section:** buffer time config (fixed display for Basic, slider for Pro/Premium), manual-accept toggle (locked for Basic)
- **Notifications section:** add WhatsApp toggle (locked for Basic), add push toggle
- **Export section:** CSV (Pro/Premium), PDF (Premium only)
- Each locked section shows tier badge + "Disponivel no plano X" with upgrade CTA

### Step 7.2 — Update configuracoes-agendamento page
**File:** `app/(app)/configuracoes-agendamento/page.tsx`

- Buffer time: currently `BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60]` → for Basic, show fixed 15min (disabled). For Pro/Premium, show slider 5-60min.
- Manual-accept: currently shows toggle for all → hide/lock for Basic
- Min notice: filter `MIN_NOTICE_OPTIONS` by tier range (Basic: 2-48, Pro: 1-72, Premium: 0.5-168)
- Max booking window: filter `MAX_WINDOW_OPTIONS` by tier max (Basic: up to 60, Pro: up to 90, Premium: up to 180)
- Import tier config and current professional tier

### Step 7.3 — Update configuracoes page
**File:** `app/(app)/configuracoes/page.tsx`

Currently redirects non-professionals to /perfil. Add tier-awareness to the workspace.

### Step 7.4 — Calendar sync settings
**File:** `components/settings/ProfessionalSettingsWorkspace.tsx` (or new section)

- Google Calendar connect/disconnect
- Outlook connect/disconnect (Pro/Premium only)
- Status indicator: connected/not connected
- Persistent banner if not connected post go-live

### Step 7.5 — Terms and cancellation policy management
**File:** `components/settings/ProfessionalSettingsWorkspace.tsx`

- Show accepted terms version and date
- Show accepted cancellation policy
- Both are read-only after acceptance (can re-accept if new version)

**Exit criteria:** All settings tier-aware. Locked features show upgrade CTA. Buffer/notice/window respect tier ranges.

---

## PHASE 8 — Calendar & Availability

### Step 8.1 — Update disponibilidade page
**File:** `app/(app)/disponibilidade/page.tsx`

- Show buffer time info (currently not shown)
- Add calendar sync status/button
- Show booking window info based on tier

### Step 8.2 — Update agenda page
**File:** `app/(app)/agenda/page.tsx`

- Show recurring bookings with visual indicator (repeating icon, connected line)
- Show batch bookings grouped
- Allow cancelling single occurrence of recurrence
- Allow cancelling all remaining occurrences

### Step 8.3 — Buffer time in slot calculation
**File:** `lib/booking/availability-engine.ts`

Currently buffer may not be applied. Ensure:
- After each booking, `bufferTimeMinutes` is blocked
- Slot generation respects buffer from tier config (Basic: always 15, Pro/Premium: from settings)

**Exit criteria:** Calendar shows recurrence. Buffer applied. Tier-based window enforced.

---

## PHASE 9 — Booking Checkout Flow

### Step 9.1 — Update BookingForm: recurring option
**File:** `components/booking/BookingForm.tsx`

Currently has `enableRecurring` prop and `initialBookingType`. Expand:
- Periodicity selector: Semanal / Quinzenal / Mensal / Personalizado (every X dias)
- Duration: "Quantas sessoes?" or "Ate quando?" (number or date picker)
- Preview: list of all dates that will be booked with price total
- Warning if any date conflicts
- Constrained by professional's booking window

### Step 9.2 — Update BookingForm: multiple bookings option
**File:** `components/booking/BookingForm.tsx`

Add "Adicionar mais datas" button:
- Opens additional date/time picker
- User can add multiple non-recurring dates
- Cart-style summary with individual prices + total
- Single "Confirmar X sessoes" button

### Step 9.3 — Update booking action: recurrence
**File:** `lib/actions/booking.ts`

- Accept recurrence params (periodicity, intervalDays, endDate/count)
- Generate slots via recurrence engine
- Create bookings linked by recurrence_group_id
- Payment: single charge for all sessions or per-session (decide based on Stripe limits)

### Step 9.4 — Update booking action: batch
**File:** `lib/actions/booking.ts`

- Accept array of dates
- Generate bookings linked by batch_booking_group_id
- Single payment intent for batch

### Step 9.5 — Update agendar page
**File:** `app/(app)/agendar/[id]/page.tsx`

- Pass new props to BookingForm for recurrence/batch
- Delivery method selector if service supports both

### Step 9.6 — Update solicitar (request booking) page
**File:** `app/(app)/solicitar/[id]/page.tsx`

- Same recurrence/batch options for request bookings

### Step 9.7 — Update MobileBookingStickyCta
**File:** `components/booking/MobileBookingStickyCta.tsx`

- Show total for batch/recurring (not just single session price)

**Exit criteria:** User can book recurring + batch. Prices calculate correctly. Payment covers all sessions.

---

## PHASE 10 — Dashboard

### Step 10.1 — Update dashboard
**File:** `app/(app)/dashboard/page.tsx`

- Show tier badge and current plan
- Show tier upgrade CTA if Basic
- Show calendar sync warning if not connected
- Show recurring booking counts in "upcoming" section
- Show pending terms/cancellation policy acceptance if missing
- Translate status values to Portuguese (auto_accept → "Aceite automatica", draft → "Rascunho")

**Exit criteria:** Dashboard reflects tier, warns about missing items, shows recurrence.

---

## PHASE 11 — Video Sessions (Agora)

### Step 11.1 — Agora account & env setup
- Create Agora project at agora.io
- Add `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` to .env.local and Vercel

### Step 11.2 — Token generation API
**New file:** `app/api/agora/token/route.ts`
- Generate RTC token scoped to booking ID as channel name
- Validate user is participant of booking
- Token valid for booking duration + 30min


### Step 11.4 — Video session UI
**New file:** `components/booking/VideoSession.tsx`
- Agora SDK integration for 1:1 video
- Controls: mute audio, toggle camera, end session, fullscreen
- Timer showing session time

### Step 11.5 — Join session button
**File:** `app/(app)/agenda/page.tsx` (booking detail)
- "Entrar na sessao" button appears 10min before scheduled time
- Links to video session page
- All sessions are video (Agora)

**New file:** `app/(app)/sessao/[bookingId]/page.tsx`
- Video session room page
- Loads VideoSession component
- Session end triggers review prompt

**Exit criteria:** Video works 1:1. Token is secure. Time-gated entry.

---

## PHASE 12 — Stripe Dual-Platform

### Step 12.1 — BR Stripe account setup
- Register Stripe account with CNPJ
- Get BR keys: `STRIPE_BR_SECRET_KEY`, `STRIPE_BR_PUBLISHABLE_KEY`
- Add to .env.local and Vercel

### Step 12.2 — Stripe client routing
**File:** `lib/stripe/client.ts`

- Add `getStripeClientForRegion(region: 'br' | 'uk'): Stripe`
- Default to UK for non-BR professionals

### Step 12.3 — Connected account creation routing
**File:** `lib/actions/professional.ts` (or wherever connect onboarding happens)

- Detect professional country
- BR → create Express account on BR Stripe
- Non-BR → create Express account on UK Stripe
- Store `platform_region` on professional record

### Step 12.4 — Payment routing
**File:** `lib/actions/booking.ts` (payment creation)

- For bookings with BR professionals, charge via BR Stripe
- For others, charge via UK Stripe
- Application fee logic remains the same

**Exit criteria:** BR professionals on BR Stripe, others on UK. Payments route correctly.

---

## PHASE 13 — Admin Impact

### Step 13.1 — Admin review: new fields
**File:** `app/(app)/admin/page.tsx`

- Show credential uploads in admin review queue
- Show tier and plan status
- Show video intro URL for content review

### Step 13.2 — Admin taxonomia: specialty limits
**File:** `app/(app)/admin/taxonomia/page.tsx`

- When assigning specialties, validate against professional's tier limit

**Exit criteria:** Admin can review all new fields. Limits enforced.

---

## PHASE 14 — Landing Page & Public Pages

### Step 14.1 — Landing page trust signals
**File:** `app/page.tsx`

- Show count of professionals with video sessions
- Show count of verified professionals (credentials)
- Update feature cards to mention video sessions

### Step 14.2 — Registration page
**File:** `app/registrar-profissional/page.tsx`

- Show tier comparison preview
- Highlight video sessions, recurrence, multi-date booking as platform features

**Exit criteria:** Public pages reflect new capabilities.

---

## EXECUTION ORDER & DEPENDENCIES

```
PHASE 1 (Schema) ─────────────────────────────────────────────────────────
    │
    ├──→ PHASE 2 (Backend logic) ─────────────────────────────────────────
    │        │
    │        ├──→ PHASE 3 (Search cards)
    │        ├──→ PHASE 4 (Profile page)
    │        ├──→ PHASE 5 (Edit profile)
    │        ├──→ PHASE 6 (Onboarding checklist)
    │        ├──→ PHASE 7 (Settings pages)
    │        ├──→ PHASE 8 (Calendar & availability)
    │        ├──→ PHASE 9 (Booking checkout - recurrence/batch)
    │        ├──→ PHASE 10 (Dashboard)
    │        └──→ PHASE 13 (Admin)
    │
    ├──→ PHASE 11 (Agora - parallel)
    ├──→ PHASE 12 (Stripe dual - parallel)
    └──→ PHASE 14 (Landing/public - parallel, low dependency)
```

**Recommended execution order (sequential work):**
1. Phase 1 → Phase 2 (foundation — everything depends on this)
2. Phase 5 + Phase 6 (professional can fill new fields + see checklist)
3. Phase 7 (settings tier-gating)
4. Phase 3 + Phase 4 (public-facing: cards + profile)
5. Phase 8 + Phase 9 (calendar + booking flow with recurrence/batch)
6. Phase 10 (dashboard)
7. Phase 11 (Agora — can start earlier if account is ready)
8. Phase 12 (Stripe dual — blocked by CNPJ registration)
9. Phase 13 + Phase 14 (admin + landing)

---

## FILES IMPACT SUMMARY

| File | Phases |
|------|--------|
| `lib/tier-config.ts` | 2 |
| `lib/professional/onboarding-gates.ts` | 2 |
| `lib/professional/onboarding-state.ts` | 2 |
| `lib/professional/public-visibility.ts` | 2 |
| `lib/booking/settings.ts` | 2 |
| `lib/booking/types.ts` | 2 |
| `lib/booking/availability-engine.ts` | 2, 8 |
| `lib/booking/recurrence-engine.ts` | 2 (new) |
| `lib/booking/batch-booking.ts` | 2 (new) |
| `lib/stripe/client.ts` | 12 |
| `lib/actions/booking.ts` | 9 |
| `lib/actions/professional.ts` | 5, 12 |
| `app/(app)/buscar/page.tsx` | 3 |
| `components/search/MobileFiltersDrawer.tsx` | 3 |
| `components/search/DesktopFiltersAutoApply.tsx` | 3 |
| `app/(app)/profissional/[id]/page.tsx` | 4 |
| `components/professional/ProfileAvailabilityBookingSection.tsx` | 4 |
| `app/(app)/editar-perfil-profissional/page.tsx` | 5, 11 |
| `app/(app)/onboarding-profissional/page.tsx` | 6 |
| `app/(app)/completar-perfil/page.tsx` | 6 |
| `components/settings/ProfessionalSettingsWorkspace.tsx` | 7 |
| `app/(app)/configuracoes-agendamento/page.tsx` | 7 |
| `app/(app)/configuracoes/page.tsx` | 7 |
| `app/(app)/disponibilidade/page.tsx` | 8 |
| `app/(app)/agenda/page.tsx` | 8, 11 |
| `components/booking/BookingForm.tsx` | 9 |
| `components/booking/MobileBookingStickyCta.tsx` | 9 |
| `app/(app)/agendar/[id]/page.tsx` | 9 |
| `app/(app)/solicitar/[id]/page.tsx` | 9 |
| `app/(app)/dashboard/page.tsx` | 10 |
| `app/api/agora/token/route.ts` | 11 (new) |
| `components/booking/VideoSession.tsx` | 11 (new) |
| `app/(app)/sessao/[bookingId]/page.tsx` | 11 (new) |
| `app/(app)/admin/page.tsx` | 13 |
| `app/(app)/admin/taxonomia/page.tsx` | 13 |
| `app/page.tsx` | 14 |
| `app/registrar-profissional/page.tsx` | 14 |
| Supabase migration file | 1 (new) |

---

## APPENDIX A — GOOGLE CALENDAR SYNC (detailed)

### A.1 — Google Cloud project setup
- Create project in Google Cloud Console (or use existing Muuday project)
- Enable Google Calendar API
- Create OAuth 2.0 credentials (Web application type)
- Authorized redirect URI: `https://muuday.com/api/auth/google-calendar/callback`
- Store `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` in env

### A.2 — OAuth consent screen
- App name: Muuday
- Scopes required: `https://www.googleapis.com/auth/calendar.readonly` (read-only — Muuday reads professional's calendar to block conflicting slots, does NOT write events to Google Calendar)
- User type: External
- **IMPORTANT:** For production, Google requires verification review. Submit early — takes 2-6 weeks.

### A.3 — Database: calendar sync tokens
```sql
create table professional_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references professionals(id) on delete cascade unique,
  provider text not null, -- 'google' | 'outlook'
  access_token text not null, -- encrypted at rest
  refresh_token text not null, -- encrypted at rest
  token_expires_at timestamptz not null,
  calendar_id text, -- specific calendar ID chosen by professional
  last_sync_at timestamptz,
  sync_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### A.4 — API routes
**New file:** `app/api/auth/google-calendar/connect/route.ts`
- Generates OAuth URL with state = professional_id (encrypted)
- Redirects professional to Google consent screen
- Scopes: `calendar.readonly`

**New file:** `app/api/auth/google-calendar/callback/route.ts`
- Receives authorization code from Google
- Exchanges for access_token + refresh_token
- Stores in professional_calendar_connections (tokens encrypted via lib/stripe/pii-guards.ts or similar)
- Updates professional_settings.calendar_sync_provider = 'google'
- Redirects to /configuracoes with success message

**New file:** `app/api/auth/google-calendar/disconnect/route.ts`
- Revokes Google token
- Deletes connection row
- Sets calendar_sync_provider = null

### A.5 — Sync logic
**New file:** `lib/calendar/google-calendar-sync.ts`

Function: `syncGoogleCalendarConflicts(professionalId: string)`
- Fetch events from Google Calendar for the next N days (= professional's booking window)
- For each event: create a "blocked_time" entry in a new `calendar_blocked_times` table
- Blocked times prevent slot generation in availability-engine
- Run sync:
  - On connect (initial full sync)
  - Every 15 minutes via cron job (`app/api/cron/calendar-sync/route.ts`)
  - On demand when professional views availability page

```sql
create table calendar_blocked_times (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references professionals(id) on delete cascade,
  source text not null, -- 'google' | 'outlook' | 'manual'
  external_event_id text, -- Google event ID for dedup
  start_at timestamptz not null,
  end_at timestamptz not null,
  title text, -- optional, for professional's reference
  synced_at timestamptz default now()
);
create index idx_calendar_blocked_professional on calendar_blocked_times(professional_id, start_at);
```

### A.6 — Availability engine integration
**File:** `lib/booking/availability-engine.ts`
- When calculating available slots, also query calendar_blocked_times for the professional
- Exclude any slot that overlaps with a blocked time
- This is additive to the existing availability + buffer logic

### A.7 — Outlook sync (Professional/Premium only)
Same architecture as Google but with Microsoft Graph API:
- Enable Microsoft Graph API
- Scopes: `Calendars.Read`
- OAuth flow same pattern, different provider
- Separate routes: `app/api/auth/outlook-calendar/connect|callback|disconnect`
- Sync logic reuses same calendar_blocked_times table with source = 'outlook'

### A.8 — UI in settings
**File:** `components/settings/ProfessionalSettingsWorkspace.tsx`
- Section "Sincronização de Calendário"
- Google Calendar: "Conectar" / "Conectado ✓" / "Desconectar"
- Outlook: same buttons (locked for Basic via TierLockedOverlay)
- Last sync time shown
- Sync error shown if any
- Manual "Sincronizar agora" button

### A.9 — Post go-live persistent banner
If professional is live but has no calendar connected:
- Show yellow banner on dashboard: "Conecte seu calendário para evitar conflitos de horário"
- Banner has "Conectar agora" CTA
- Banner can be dismissed but reappears after 7 days

---

## APPENDIX B — STRIPE SUBSCRIPTION BILLING FOR TIERS (detailed)

### B.1 — Stripe products already created
Products exist on live account test mode:
- Muuday Basic: `prod_UG8paV31S8IV8o`
- Muuday Professional: `prod_UG8pCaomJBFxki`
- Muuday Premium: `prod_UG8plYwttrDCBD`

Each has 8 prices (4 currencies × monthly + annual). Annual = 10× monthly.

### B.2 — Database: subscription tracking
```sql
create table professional_subscriptions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references professionals(id) on delete cascade unique,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  tier text not null default 'basic', -- 'basic' | 'professional' | 'premium'
  billing_period text not null default 'monthly', -- 'monthly' | 'annual'
  status text not null default 'trialing', -- 'trialing' | 'active' | 'past_due' | 'cancelled' | 'unpaid'
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### B.3 — Subscription creation flow
1. Professional completes C6 (plan selection) in onboarding
2. Professional clicks "Confirmar plano" → creates Stripe Checkout Session:
   ```
   POST /api/stripe/checkout-session
   body: { tier, billingPeriod, professionalId }
   ```
3. Checkout Session params:
   - `mode: 'subscription'`
   - `subscription_data.trial_period_days: 90` (3 months free)
   - `price`: selected price ID based on tier + currency + billing period
   - `success_url`: `/configuracoes?plano=sucesso`
   - `cancel_url`: `/onboarding-profissional`
   - `customer_email`: professional's email
   - `metadata: { professional_id, tier }`
4. On success, Stripe fires `checkout.session.completed` webhook → create subscription record
5. Professional's `tier` field on professionals table is updated
6. `billingCardOnFile` becomes true (card saved via Checkout)

**New file:** `app/api/stripe/checkout-session/route.ts`
**New file:** `lib/stripe/subscription.ts` — helpers for creating checkout sessions, reading subscription status

### B.4 — Trial logic (3 months free)
- All professionals start with 90-day trial
- During trial: full access to selected tier features
- Trial status visible in settings: "Seu plano gratuito termina em X dias"
- 30 days before trial end: email reminder (Resend)
- 7 days before: second reminder
- 1 day before: final reminder
- If card on file: auto-charge starts after trial
- If no card: status becomes `past_due`, features downgrade to Basic after 7 days grace

### B.5 — Trial expiry screen (personalized upgrade)
When trial ends and professional hasn't confirmed payment:
- **Full-screen modal** on next login (cannot dismiss, must act)
- Shows: "Seu período gratuito terminou"
- Shows what they'd lose by downgrading to Basic:
  - Number of services that exceed Basic limit (e.g. "Você tem 4 serviços, Basic permite 1")
  - Features they're using that are tier-locked (e.g. "Video de apresentação", "WhatsApp no perfil")
- Two CTAs:
  - "Continuar com Professional/Premium" → Stripe Checkout to add card
  - "Mudar para plano Básico" → downgrade (with warning about what gets deactivated)
- If downgrade: services beyond limit 1 become draft, video_intro hidden, social_links hidden, manual-accept disabled

**New file:** `components/tier/TrialExpiredModal.tsx`
**File:** `app/(app)/layout.tsx` — check subscription status on load, show modal if expired

### B.6 — Upgrade flow
- Professional clicks "Ver planos" (from any TierLockedOverlay or settings)
- Opens plan comparison page (`/planos`)
- Clicks "Upgrade para Professional" or "Upgrade para Premium"
- Creates Stripe Checkout Session (or Billing Portal for existing subscribers)
- On success: tier updated immediately via webhook
- Prorated billing handled by Stripe

### B.7 — Downgrade flow
- Professional goes to settings → plan → "Mudar plano"
- Clicks lower tier
- Warning: "Ao mudar para Basic, as seguintes funcionalidades serão desativadas: ..."
- Lists specific things that will be lost
- Downgrade takes effect at end of current billing period (cancel_at_period_end on Stripe)
- During remaining period: full access to current tier

### B.8 — Stripe Customer Portal
**New file:** `app/api/stripe/customer-portal/route.ts`
- Creates Stripe Billing Portal session
- Professional can manage card, view invoices, cancel subscription
- Link from settings: "Gerenciar pagamento"

---

## APPENDIX C — TIER TIMING IN ONBOARDING (detailed)

### C.1 — When plans appear
- **C1 to C5:** No plan selection shown. Professional fills profile, services, availability.
- **C6 (Plan selection):** Full plan comparison page with all 3 tiers:
  - Shows features, limits, prices in professional's currency
  - Default selection: Basic (pre-selected)
  - Annual vs monthly toggle
  - "3 meses grátis" badge prominent on all tiers
  - CTA: "Selecionar plano" (does NOT create subscription yet — just saves preference)

### C.2 — When payment happens
- **C7 (Payout onboarding):** Stripe Connect onboarding for receiving payouts
- **C8 (Submit for review):** Before submitting, system checks:
  - If selected tier is Basic: no payment needed until first booking
  - If selected tier is Professional/Premium: card must be on file → triggers Stripe Checkout with trial
- **C9 (Go live):** After admin approval, professional goes live. Trial starts.

### C.3 — Post go-live tier awareness
- Dashboard shows: "Plano: Professional | Trial gratuito até DD/MM/AAAA"
- Settings shows: subscription details, next billing date, manage payment link
- 30/7/1 day reminders via email before trial ends

### C.4 — Basic tier: always free?
- Basic has NO subscription fee — it's free forever
- Basic professionals do NOT need a card on file for their plan (only for payout purposes at first_booking_acceptance gate)
- Basic professionals see upgrade CTAs throughout the platform (blur/lock pattern)

---

## APPENDIX D — EMAIL NOTIFICATIONS (Resend — detailed)

### D.1 — Existing emails in lib/email/resend.ts (already implemented)
1. `sendWelcomeEmail` — user welcome
2. `sendCompleteAccountEmail` — complete social login account
3. `sendBookingConfirmationEmail` — booking confirmed (user)
4. `sendNewBookingToProfessionalEmail` — new booking (professional)
5. `sendSessionReminder24hEmail` — 24h reminder (user)
6. `sendSessionReminder1hEmail` — 1h reminder (user)
7. `sendProfessionalReminder24hEmail` — 24h reminder (professional)
8. `sendBookingCancelledEmail` — cancellation
9. `sendPaymentConfirmationEmail` — payment receipt
10. `sendPaymentFailedEmail` — payment failed
11. `sendRefundEmail` — refund processed
12. `sendNewReviewEmail` — new review received
13. `sendProfileApprovedEmail` — admin approved profile
14. `sendProfileRejectedEmail` — admin rejected profile
15. `sendNewsletterEmail` — newsletter
16. `sendRequestReviewEmail` — review request after session
17. `sendRescheduledEmail` — rescheduled
18. `sendIncompleteProfileReminderEmail` — incomplete profile nudge
19. `sendWaitlistConfirmationEmail` — waitlist
20. `sendWelcomeSeries1Email` — drip 1
21. `sendWelcomeSeries2Email` — drip 2
22. `sendWelcomeSeries3Email` — drip 3
23. `sendReferralInviteEmail` — referral
24. `sendFirstBookingNudgeEmail` — first booking nudge
25. `sendReengagementEmail` — reengagement
26. `sendLaunchEmail` — launch
27. `sendPasswordResetEmail` — password reset

### D.2 — NEW emails needed for new features
Add to `lib/email/resend.ts` following the existing THEME and emailLayout pattern:

**Subscription/tier emails:**
28. `sendTrialStartedEmail(to, name, tier, trialEndDate)` — "Seu período gratuito de 3 meses começou! Plano: X. Expira em: DD/MM/AAAA"
29. `sendTrialEndingEmail(to, name, tier, daysLeft, trialEndDate)` — "Seu período gratuito termina em X dias. Adicione um cartão para continuar."
30. `sendTrialExpiredEmail(to, name, tier)` — "Seu período gratuito expirou. Suas funcionalidades foram reduzidas para o plano Básico."
31. `sendUpgradeConfirmationEmail(to, name, oldTier, newTier)` — "Você fez upgrade para o plano X! Agora você tem acesso a: ..."
32. `sendDowngradeNoticeEmail(to, name, oldTier, newTier, effectiveDate)` — "Seu plano será alterado para X em DD/MM. As seguintes funcionalidades serão desativadas: ..."

**Recurring booking emails:**
33. `sendRecurrenceCreatedEmail(to, name, professionalName, service, dates[], periodicity)` — "Agendamento recorrente criado! X sessões com Professional toda semana/quinzena/mês"
34. `sendRecurrenceSlotConflictEmail(to, name, professionalName, conflictDate)` — "Sessão recorrente em DD/MM não está disponível. Reagende esta ocorrência."
35. `sendRecurrenceCancelledEmail(to, name, professionalName, cancelledDates[], remainingDates[])` — "X sessões canceladas da sua recorrência. Y sessões restantes."

**Batch booking emails:**
36. `sendBatchBookingConfirmationEmail(to, name, professionalName, dates[], totalPrice)` — "X sessões agendadas com Professional. Datas: ..."

**Calendar sync emails:**
37. `sendCalendarConnectedEmail(to, name, provider)` — "Calendário Google/Outlook conectado com sucesso!"
38. `sendCalendarSyncErrorEmail(to, name, provider, error)` — "Erro na sincronização do calendário. Reconecte em Configurações."

**Video session emails:**
39. `sendSessionStartingSoonEmail(to, name, professionalName, bookingId, minutesUntil)` — "Sua sessão com X começa em Y minutos. [Entrar na sessão]"

**Admin emails:**
40. `sendProfileSubmittedForReviewEmail(to, professionalName)` — to admin: "Novo perfil para revisão: Professional Name"
41. `sendProfileNeedsChangesEmail(to, name, adminNotes)` — to professional: "Seu perfil precisa de ajustes: [notes]"

### D.3 — Email trigger points
Each email must be called from the correct action/webhook:

| Email | Trigger point |
|-------|---------------|
| 28 (trial started) | `checkout.session.completed` webhook |
| 29 (trial ending) | Cron job: `app/api/cron/trial-reminders/route.ts` — runs daily, checks subscriptions with trial_end within 30/7/1 days |
| 30 (trial expired) | `customer.subscription.updated` webhook when status = past_due or cancelled |
| 31 (upgrade) | `customer.subscription.updated` webhook when tier changes up |
| 32 (downgrade) | When professional confirms downgrade in UI |
| 33 (recurrence created) | `lib/actions/booking.ts` after recurrence group created |
| 34 (slot conflict) | `lib/booking/recurrence-engine.ts` when conflict detected |
| 35 (recurrence cancelled) | `lib/actions/manage-booking.ts` when cancel remaining |
| 36 (batch booking) | `lib/actions/booking.ts` after batch created |
| 37 (calendar connected) | Google/Outlook callback route |
| 38 (calendar sync error) | `lib/calendar/google-calendar-sync.ts` on repeated failure |
| 39 (session starting) | Cron job: `app/api/cron/booking-reminders/route.ts` (existing) — add 10min reminder |
| 40 (submitted for review) | `lib/actions/professional-onboarding.ts` submit action |
| 41 (needs changes) | Admin action in `lib/actions/admin.ts` |

### D.4 — New cron job needed
**New file:** `app/api/cron/trial-reminders/route.ts`
- Runs daily
- Query professional_subscriptions where status = 'trialing'
- If trial_end - now <= 30 days: send reminder (once)
- If trial_end - now <= 7 days: send reminder (once)
- If trial_end - now <= 1 day: send final reminder (once)
- Track sent reminders via a `reminder_sent_30d`, `reminder_sent_7d`, `reminder_sent_1d` boolean on professional_subscriptions

---

## APPENDIX E — STRIPE WEBHOOKS FOR DUAL-PLATFORM (detailed)

### E.1 — Current webhook route
**File:** `app/api/webhooks/stripe/route.ts`
- Already exists with signature verification and inbox persistence
- Uses Inngest workers for processing

### E.2 — Dual-platform webhook handling
Two Stripe accounts = two webhook endpoints needed:

**UK Stripe:** `app/api/webhooks/stripe/route.ts` (existing) — keep as-is
**BR Stripe:** `app/api/webhooks/stripe-br/route.ts` (new)
- Same signature verification logic but using `STRIPE_BR_WEBHOOK_SECRET`
- Same inbox persistence and Inngest routing

Both routes insert into the same `stripe_webhook_events` table with a `platform_region` column.

### E.3 — Critical webhook events to handle

**Subscription lifecycle:**
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create professional_subscriptions row, update professional.tier, send trial started email |
| `customer.subscription.updated` | Update tier/status/period dates, detect upgrade/downgrade, send appropriate email |
| `customer.subscription.deleted` | Set status = cancelled, downgrade to Basic if not already |
| `invoice.paid` | Update current_period dates, mark subscription active |
| `invoice.payment_failed` | Set status = past_due, send payment failed email, start grace period |

**Connect account lifecycle (payout):**
| Event | Action |
|-------|--------|
| `account.updated` | Update payout onboarding status, check KYC completion |
| `payout.created` | Log payout event |
| `payout.failed` | Alert admin, notify professional |

**Payment lifecycle (bookings):**
| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Confirm booking(s), send confirmation emails |
| `payment_intent.payment_failed` | Cancel pending booking(s), send failure email |
| `charge.refunded` | Update booking status, send refund email |
| `charge.dispute.created` | Alert admin, create dispute case |

### E.4 — Env vars needed
```
# UK Stripe (existing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# BR Stripe (new)
STRIPE_BR_SECRET_KEY=sk_test_...
STRIPE_BR_WEBHOOK_SECRET=whsec_...
STRIPE_BR_PUBLISHABLE_KEY=pk_test_...
```

### E.5 — Webhook registration
Register webhooks in both Stripe dashboards:
- UK: `https://muuday.com/api/webhooks/stripe`
- BR: `https://muuday.com/api/webhooks/stripe-br`

Events to subscribe to (both): checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed, account.updated, payment_intent.succeeded, payment_intent.payment_failed, charge.refunded, charge.dispute.created, payout.created, payout.failed

---

## APPENDIX F — ADMIN REVIEW QUEUE (detailed)

### F.1 — Current state
Admin page exists at `app/(app)/admin/page.tsx`. Professional statuses: draft, submitted_for_review, needs_changes, approved_live.

### F.2 — Review queue display
When professional submits for review (C8), their status becomes `submitted_for_review`.

Admin sees queue with:
- Professional name + photo
- Category + specialty
- Country
- Tier selected
- Submitted date
- "Revisar" button

### F.3 — Review detail view
**New file:** `app/(app)/admin/revisao/[professionalId]/page.tsx`

Shows ALL professional data for review:
- **Identity:** name, display name, email, country, timezone
- **Taxonomy:** category, subcategory, specialties (with count vs tier limit)
- **Profile:** bio, photo, cover photo (if any), video intro URL (if any, with embedded preview), social links
- **Credentials:** uploaded documents (for sensitive categories) — show each with download link, file name, type
- **Services:** list of services with name, description, price, duration
- **Availability:** summary of working hours
- **Plan:** selected tier
- **Sensitive category check:** if in sensitive category, verify disclaimer and credentials

### F.4 — Review actions
Three actions available:
1. **Aprovar** → status = `approved_live`, send `sendProfileApprovedEmail`
2. **Solicitar alterações** → status = `needs_changes`, admin writes notes in text field, send `sendProfileNeedsChangesEmail` with notes
3. **Rejeitar** → status = `rejected` (new status), send `sendProfileRejectedEmail` with reason

### F.5 — Admin notes field
```sql
alter table professionals add column if not exists admin_review_notes text;
alter table professionals add column if not exists reviewed_at timestamptz;
alter table professionals add column if not exists reviewed_by uuid references profiles(id);
```

### F.6 — Audit trail
Each review action logged via existing `lib/admin/audit-log.ts`:
- action: 'professional_review'
- details: { professional_id, old_status, new_status, notes }

---

## APPENDIX G — PLAN COMPARISON PAGE (detailed)

### G.1 — Route
**New file:** `app/(app)/planos/page.tsx`
- Accessible by any professional (logged in)
- Also embeddable as section in onboarding (C6)

### G.2 — Layout
Three columns (desktop) / accordion (mobile):

Each column shows:
- **Plan name + badge** (Básico / Profissional / Premium)
- **Price:** monthly and annual (with "10 meses pelo preço de 12" callout on annual)
- **"3 meses grátis"** badge
- **Feature checklist:**

| Feature | Básico | Profissional | Premium |
|---------|--------|-------------|---------|
| Serviços ativos | 1 | 5 | 10 |
| Especialidades | 1 | 3 | 3 |
| Tags | 3 | 5 | 10 |
| Janela de agendamento | 60 dias | 90 dias | 180 dias |
| Sessões por vídeo (Agora) | ✓ | ✓ | ✓ |
| Recorrência e pacotes | ✓ | ✓ | ✓ |
| Multiple bookings | ✓ | ✓ | ✓ |
| Foto de capa | ✓ | ✓ | ✓ |
| Vídeo de apresentação | ✗ | ✓ | ✓ |
| WhatsApp no perfil | ✗ | ✓ | ✓ |
| Links de redes sociais | ✗ | Até 2 | Até 5 |
| Bio estendida | ✗ | 2000 chars | 5000 chars |
| Aceite manual de booking | ✗ | ✓ | ✓ |
| Buffer time configurável | Fixo 15min | 5-60min | 5-60min |
| Notificações WhatsApp | ✗ | ✓ | ✓ |
| Sync Outlook | ✗ | ✓ | ✓ |
| Promoções/descontos | ✗ | ✓ | ✓ |
| Exportação CSV | ✗ | ✓ | ✓ |
| Exportação PDF | ✗ | ✗ | ✓ |
| Boost de ranking | ✗ | Moderado | Alto |
| Destaque em categorias | ✗ | Rotativo | Prioridade |
| Perfil em destaque | ✗ | ✗ | ✓ |
| Badge no perfil | ✗ | Profissional | Premium |

- **CTA button:**
  - If current plan: "Plano atual" (disabled)
  - If upgrade: "Upgrade para X — 3 meses grátis"
  - If downgrade: "Mudar para X" (with warning)

### G.3 — Currency toggle
- Show prices in professional's detected currency (BRL, USD, EUR, GBP)
- Manual currency toggle available

### G.4 — Billing period toggle
- Toggle between "Mensal" and "Anual (economize ~17%)"
- Prices update dynamically

### G.5 — FAQ section below plans
- "Posso mudar de plano depois?" → Sim, a qualquer momento.
- "O que acontece quando o período gratuito termina?" → Se tiver cartão, cobrança automática. Senão, volta para Básico.
- "Posso cancelar?" → Sim, acesso continua até o fim do período pago.

---

## RISK NOTES

1. **Stripe BR account** — Requires CNPJ. May take days. START EARLY.
2. **Agora SDK** — Bundle size impact (~2MB). Use dynamic import: `const AgoraRTC = (await import('agora-rtc-sdk-ng')).default`
3. **Google Calendar OAuth** — Production consent screen needs Google review (2-6 weeks). Submit early. Use test mode initially (100 users limit).
4. **Recurrence payment** — Each session in a recurrence is a separate booking with its own payment. Use Stripe `payment_intent` per session. Link them by `recurrence_group_id`. Do NOT try to charge N sessions in one payment intent.
5. **Migration safety** — All new columns nullable/defaulted. Zero breaking changes.
6. **Tier enforcement** — MUST be server-side in actions, not just UI. Client can bypass.
7. **Cover photo storage** — Create Supabase Storage bucket `professional-media`. Max 5MB, accept jpg/png/webp. Resize to 1200x400 on upload.
8. **Video intro URL** — Only YouTube/Vimeo. Validate with regex: `youtube\.com|youtu\.be|vimeo\.com`. No self-hosted video.
9. **Calendar token encryption** — Google/Outlook OAuth tokens are sensitive. Encrypt at rest using the same pattern as `lib/stripe/pii-guards.ts`.
10. **Webhook idempotency** — Both UK and BR Stripe webhook routes must use the existing idempotent inbox (`stripe_webhook_events`) to prevent duplicate processing.
