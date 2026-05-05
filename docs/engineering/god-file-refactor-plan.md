# God File Refactoring Plan

## Context

After the major architecture sprint, we successfully refactored `lib/actions/booking.ts` (876→720→646 lines) and `lib/actions/manage-booking.ts` (829→620 lines). However, a scan of the codebase reveals several remaining god files and god components that need attention.

## Current State

### Server Actions / Library Files

| File | Lines | Functions | Priority | Status |
|------|-------|-----------|----------|--------|
| `lib/booking/request-booking-service.ts` | ~~811~~ **433** | 7 | **HIGH** | ✅ Extracted `acceptRequestBookingService` → `lib/booking/request-booking/accept-request.ts` |
| `lib/booking/manage-booking-service.ts` | ~~944~~ **448** | 6 | **HIGH** | ✅ Extracted `applyPaymentRefund`, `executeCancelSingleBooking`, `completeBookingService`, `reportProfessionalNoShowService`, `markUserNoShowService`, `listBookingsService`, `getBookingDetailService` |
| `lib/actions/request-booking.ts` | ~~861~~ **164** | 10 | **HIGH** | ✅ Extracted to `lib/booking/request-booking-service.ts` |
| `lib/email/resend.ts` | ~~897~~ **69** | 25+ | **HIGH** | ✅ Extracted to `lib/email/templates/` + `lib/email/client.ts` |
| `lib/ops/stripe-resilience.ts` | ~~816~~ **41** | 18 | MEDIUM | ✅ Extracted to `lib/stripe/` modules |
| `lib/professional/onboarding-gates.ts` | ~~770~~ **294** | 8 | MEDIUM | ✅ Reduced; partial extraction done |
| `lib/actions/admin.ts` | ~~655~~ **281** | — | LOW | ✅ Reduced |
| `lib/actions/booking.ts` | ~~646~~ **97** | — | LOW (already refactored) | ✅ Complete |
| `lib/actions/manage-booking.ts` | ~~620~~ **148** | — | LOW (already refactored) | ✅ Complete |
| `lib/actions/email.ts` | ~~548~~ **270** | — | LOW | ✅ Reduced |

### Components (>500 lines)

| File | Lines | Priority | Status |
|------|-------|----------|--------|
| `components/dashboard/OnboardingTrackerModal.tsx` | ~~3,995~~ ~~2,038~~ ~~1,009~~ **426** | **CRITICAL** | ✅ Complete — extracted 13 hooks + TrackerModalBody component |
| `components/dashboard/onboarding-tracker/stages/identity-stage.tsx` | ~~713~~ **174** | **CRITICAL** | ✅ Extracted 5 sub-components: PhotoUploadSection, IdentityFormSection, LanguageSelectorSection, TargetAudienceSection, QualificationsSection |
| `components/booking/BookingForm.tsx` | ~~1,151~~ ~~1,295~~ ~~752~~ **395** | **HIGH** | ✅ Extracted 9 presentational components + 6 custom hooks into `booking-form/` |
| `components/agenda/ProfessionalAgendaPage.tsx` | ~~523~~ ~~660~~ **134** | LOW | ✅ Extracted 7 presentational components + 2 hooks into `professional-agenda/` |
| `components/professional/ProfileAvailabilityBookingSection.tsx` | ~~549~~ ~~625~~ **166** | LOW | ✅ Extracted to `profile-availability/` |
| `components/agenda/ProfessionalAvailabilityWorkspace.tsx` | ~~600~~ ~~540~~ **127** | MEDIUM | ✅ Extracted useAvailabilityWorkspace + 4 presentational components |
| `components/settings/ProfessionalSettingsWorkspace.tsx` | ~~629~~ **347** | MEDIUM | ✅ Reduced |
| `components/admin/ReviewModerationClient.tsx` | ~~608~~ **135** | MEDIUM | ✅ Extracted useReviewModeration + 5 presentational components |
| `components/booking/WaitingRoomGame.tsx` | ~~730~~ **31** | MEDIUM | ✅ Extracted types, helpers, draw.ts, useWaitingRoomGame hook |

---

## Completed Work

### Cleanup Pass: 2026-04-30

**OnboardingTrackerModal.tsx** (3,995 → 2,038 lines)
- Removed inline `AvailabilityStage` and all associated state/handler logic (`availabilityMap`, `bookingRules`, `profileTimezone`, `saveAvailabilityCalendar`, etc.)
- Removed ~20 unused imports and helper functions (`Link`, `Upload`, `Blocker`, `TrackerViewMode`, `BlockerCta`, `PLAN_PRICE_BASE_BRL`, `PLAN_COMPARISON_ROWS`, `PLAN_ROW_BY_LABEL`, `LANGUAGE_OPTIONS`, `PROFESSIONAL_TITLES`, `TARGET_AUDIENCE_OPTIONS`, `toKeywords`, `formatCurrencyFromBrl`, `rgbToHsl`, `humanizeTaxonomyValue`, `resolveTaxonomyLabel`, `buildDefaultAvailabilityMap`, `categoryNameBySlug`, `subcategoryNameBySlug`)

### Refactor Pass: 2026-05-04

**OnboardingTrackerModal.tsx** (2,038 → 1,009 lines)
- **Phase 1 — Presentational extraction:** `StageSidebar`, `TrackerHeader`, `AdjustmentBanner`, `PlanFeatureBanner`
- **Phase 2 — Domain hooks:**
  - `usePhotoState` — photo upload, crop, validation, drag
  - `useTermsState` — terms acceptance, modal tokens
  - `useModalContext` — mega useEffect for modal context loading (~300 lines)
  - `useIdentityState` — identity form, focus areas, qualifications, saveIdentity
  - `useServiceState` — service CRUD form, saveService, deleteService
  - `usePlanState` — plan selection, pricing, savePlanSelection
- **Phase 3 — Helpers:** `toggleMultiValue` moved to `helpers.ts`
- Target: Modal shell <200 lines, each stage <300 lines (modal currently ~1,009 lines — further stage component extraction possible)
- Fixed unused catch-binding lint errors
- **Note:** `UI_STAGE_ORDER` in `constants.ts` and `ProfessionalOnboardingCard.tsx` still reference `c5_availability_calendar`. The modal now renders nothing for that stage. Follow-up: either remove it from the stage list or replace with an external link to `/disponibilidade`.

**Agenda page** (`app/(app)/agenda/page.tsx`)
- Removed dead imports (`ProfessionalAgendaPage`, `normalizeProfessionalSettingsRow`)
- Removed unused destructured `booking` from `searchParams`
- Removed unused variable declarations (`calendarIntegrationProvider`, `calendarIntegrationStatus`, `calendarIntegrationLastSyncAt`, `calendarIntegrationAccountEmail`, `calendarIntegrationLastSyncError`, `calendarTimezone`, `overviewAvailabilityExceptions`, `professionalBookingRulesPanelProps`, `overviewCalendarBookings`)
- Still queries calendar data for downstream components (not removed, just unbound locally)

**Booking services**
- `lib/booking/request-booking-service.ts`: Removed unused `normalizeProfessionalSettingsRow` import; fixed unused `_reason` parameter in `declineRequestBookingByProfessionalService`
- `lib/booking/manage-booking-service.ts`: Removed unused `normalizeProfessionalSettingsRow` import
- Aligned API route + action call sites with updated parameter signatures

**Helpers**
- `components/dashboard/onboarding-tracker/helpers.ts`: Removed unused `WEEK_DAYS` import
- `app/(app)/dashboard/page.tsx`: Removed unused `Star` import

---

## Remaining Work

### Phase 1: Server Actions (Completed — monitoring)

The original Phase 1 targets have all been extracted or reduced below 500 lines:
- `lib/actions/request-booking.ts` → logic moved to `lib/booking/request-booking-service.ts`
- `lib/email/resend.ts` → templates moved to `lib/email/templates/*`
- `lib/ops/stripe-resilience.ts` → logic moved to `lib/stripe/*`
- `lib/professional/onboarding-gates.ts` → reduced to 294 lines

**No further action required unless these files grow again.**

### Phase 2: Components (Critical/High Priority)

#### 2.1 `components/dashboard/OnboardingTrackerModal.tsx` → Component + hook extraction

**Current:** ~~3,995~~ ~~2,038~~ ~~1,009~~ **426 lines** — extraction complete

**Completed:**
- **Presentational components** (Phase 1): `StageSidebar`, `TrackerHeader`, `AdjustmentBanner`, `PlanFeatureBanner`, `TrackerModalBody`
- **Domain hooks** (Phase 2): `usePhotoState`, `useTermsState`, `useModalContext`, `useIdentityState`, `useServiceState`, `usePlanState`
- **Generic save hook** (Phase 3): `useSaveSection`
- **Refactor hooks** (Phase 4):
  - `useRefreshTrackerEvaluation` — refresh + prop sync effects
  - `useTrackerStageNavigation` — activeStageId calculation from view mode
  - `useTrackerDerivedState` — all useMemo derived values (stages, blockers, completions)
  - `usePlanCheckoutParams` — plan checkout URL params effect
  - `usePublicProfile` — bio, photo, savePublicProfile
  - `useSubmitForReview` — submitReviewState + submitForReview

**Result:** Main component 1,009 → 426 lines (-58%). Orchestrates 12 hooks + 1 modal body component.

**Extracted to:**
- `components/dashboard/onboarding-tracker/components/` — presentational components
- `components/dashboard/onboarding-tracker/hooks/` — 13 domain/refactor hooks + save wrapper
- `components/dashboard/onboarding-tracker/stages/` — 5 stage components
- `components/dashboard/onboarding-tracker/constants.ts` — all constants, options, labels
- `components/dashboard/onboarding-tracker/helpers.ts` — utility functions
- `components/dashboard/onboarding-tracker/types.ts` — shared types

#### 2.2 `components/booking/BookingForm.tsx` → Extract presentational components + hooks

**Current:** ~~1,151~~ ~~1,295~~ ~~752~~ **395 lines**

**Completed:**
- **Presentational components** extracted to `components/booking/booking-form/components/`:
  - `BookingSuccessRedirect`, `SelectedServiceCard`, `BookingTypeSelector`
  - `RecurringConfigPanel`, `TimezoneToggle`, `CalendarGrid`
  - `TimeSlotsGrid`, `SessionPurposeInput`, `BatchPanel`
  - `BookingSummarySidebar`
- **Custom hooks** extracted to `components/booking/booking-form/hooks/`:
  - `useCalendarSlots` — calendar state, slot generation, date navigation
  - `useRecurringBooking` — recurrence config, conflict detection
  - `useBatchBooking` — batch date management
  - `useBookingPricing` — price calculations, timezone conversions
  - `useBookingSubmission` — form submission, API branching, timeouts
  - `useBookingAnalytics` — analytics tracking
- **Types** extracted to `components/booking/booking-form/types.ts`

**Result:** Main component 1,295 → 395 lines (-70%). Orchestrates 6 hooks + 10 sub-components.

#### 2.3 `components/professional/ProfileAvailabilityBookingSection.tsx` → Extract presentational components + hook

**Current:** ~~549~~ ~~625~~ **166 lines**

**Completed:**
- **Presentational components** extracted to `components/professional/profile-availability/components/`:
  - `BookingControls` — duration selector, timezone toggle, booking type toggle, recurring config
  - `CalendarGrid` — month navigation & day grid with availability dots
  - `TimeSlotPicker` — time slot buttons for selected date
  - `BookingSummaryCard` — pricing, CTAs, trust signals, error banners
- **Custom hook** extracted to `components/professional/profile-availability/hooks/`:
  - `useAvailabilitySlots` — slot Map computation, calendarDays, timeSlots filtering, conflict checks
- **Types** extracted to `components/professional/profile-availability/types.ts`
- **Helpers** extracted to `components/professional/profile-availability/helpers.ts`

**Result:** Main component 625 → 166 lines (-73%). Orchestrates 1 hook + 4 sub-components.

### Phase 3: Monitor & Maintain

#### 3.1 `lib/ops/stripe-resilience.ts` — **DONE** (41 lines)

#### 3.2 `lib/professional/onboarding-gates.ts` — **DONE** (294 lines)

---

### Refactor Pass: 2026-05-05 — AdminDashboard.tsx

**AdminDashboard.tsx** (721 → 187 lines)

**Completed:**
- **Hook** extracted to `components/admin/admin-dashboard/hooks/`:
  - `useAdminDashboard` — all state, status/review actions, filters, success messaging
- **Presentational components** extracted to `components/admin/admin-dashboard/components/`:
  - `AdminOverviewTab` — stats cards + pending actions + recent professionals
  - `AdminProfessionalsTab` — professional list with expand/collapse + actions
  - `AdminReviewsTab` — review moderation cards
  - `AdminBookingsTab` — bookings table
  - `StatCard` — reusable stat card
- Main component now pure orchestrator: header + tab bar + conditional tab rendering
- TypeScript: 0 errors, build passes

---

### Refactor Pass: 2026-05-05 — identity-stage.tsx

**identity-stage.tsx** (713 → 174 lines)

**Completed:**
- **Sub-components** extracted:
  - `PhotoUploadSection` — photo upload, preview, zoom, validation checks
  - `IdentityFormSection` — title, name, category, tags, bio, experience, language
  - `LanguageSelectorSection` — secondary languages dropdown
  - `TargetAudienceSection` — target audience dropdown
  - `QualificationsSection` — qualifications CRUD, document upload
- Main component now pure orchestrator: composes 5 sub-components + save button
- TypeScript: 0 errors, build passes

---

### Refactor Pass: 2026-05-05 — ProfessionalAvailabilityWorkspace.tsx

**ProfessionalAvailabilityWorkspace.tsx** (540 → 127 lines)

**Completed:**
- **Hook** extracted to `components/agenda/availability-workspace/hooks/`:
  - `useAvailabilityWorkspace` — all state, loadAvailability, handleSave, toggleDay, updateTime, handleCopyDay (~316 lines)
- **Presentational components** extracted to `components/agenda/availability-workspace/components/`:
  - `AvailabilityWorkspaceHeader` — standalone/embedded header variant
  - `AvailabilityWorkspaceStats` — 3 stats cards (buffer, window, sync)
  - `AvailabilityWorkspaceRulesCard` — rules card with link to settings
  - `AvailabilitySaveBar` — sticky bottom save bar with status indicators
- Main component now pure orchestrator: calls hook + conditional loading/access-denied + composes 6 sub-components
- TypeScript: 0 errors, build passes

---

### Refactor Pass: 2026-05-05 — WaitingRoomGame.tsx

**WaitingRoomGame.tsx** (730 → 31 lines)

**Completed:**
- **Types + constants** extracted to `components/booking/waiting-room-game/types.ts`:
  - `Obstacle`, `Coin`, `Particle`, `Cloud`, `GamePlayer`, `GameState`
  - `GROUND_Y_RATIO`, `PLAYER_SIZE`, `GRAVITY`, `JUMP_STRENGTH`, `BASE_SPEED`, `MAX_SPEED`, `SPEED_INCREMENT`, `COIN_SPAWN_CHANCE`
- **Helpers** extracted to `components/booking/waiting-room-game/helpers.ts`:
  - `getHighScore`, `setHighScore`, `randomBetween`
- **Canvas drawing** extracted to `components/booking/waiting-room-game/draw.ts`:
  - `drawPixelText`, `drawCloud`, `drawGround`, `drawPlayer`, `drawObstacle`, `drawCoin`, `drawParticles`, `drawTitleScreen`, `drawGameOver`
- **Game engine hook** extracted to `components/booking/waiting-room-game/use-waiting-room-game.ts`:
  - Full game loop with `requestAnimationFrame`, collision detection, obstacle/coin spawning, particle physics
  - Input handling (keyboard + touch)
  - Resize handling with DPR scaling
- Main component now pure shell: canvas element + score overlay
- TypeScript: 0 errors, build passes

---

### Refactor Pass: 2026-05-05 — ReviewModerationClient.tsx

**ReviewModerationClient.tsx** (608 → 135 lines)

**Completed:**
- **Hook** extracted to `components/admin/review-moderation/hooks/`:
  - `useReviewModeration` — all state, approve/reject/flag actions, batch ops, filtering, selection, reload (~220 lines)
- **Presentational components** extracted to `components/admin/review-moderation/`:
  - `ReviewModerationStats` — 4 stat cards (pending, approved, rejected, flagged) with inline StatCard
  - `ReviewModerationFilters` — status filter pills + sort dropdown with transition loading state
  - `ReviewModerationBatchActions` — bulk approve/reject/clear selection bar
  - `ReviewModerationList` — review cards with checkbox selection, stars, comments, auto-flags, per-item actions
  - `RejectModal` — reason radio list + internal note textarea + confirm/cancel
- Main component now pure orchestrator: header + success toast + composes 5 sub-components + modal
- TypeScript: 0 errors, build passes

---

## Implementation Order

1. **OnboardingTrackerModal** — highest user impact; extract stage components incrementally ✅
2. **BookingForm** — extract hooks and sub-components ✅
3. **Agenda page components** — monitor `ProfessionalAgendaPage.tsx` (660 lines) and `ProfileAvailabilityBookingSection.tsx` (625 lines)

### Refactor Pass: 2026-05-04 — ProfessionalAgendaPage.tsx

**ProfessionalAgendaPage.tsx** (660 → 134 lines)

### Refactor Pass: 2026-05-04 — ProfileAvailabilityBookingSection.tsx

**ProfileAvailabilityBookingSection.tsx** (625 → 166 lines)
- Extracted `BookingControls`, `CalendarGrid`, `TimeSlotPicker`, `BookingSummaryCard`
- Extracted `useAvailabilitySlots` hook (~203 lines)
- Extracted shared `types.ts` and `helpers.ts`
- Main component now pure orchestrator: duration/timezone/booking-type state + composes 4 sub-components
- TypeScript: 0 errors

### Refactor Pass: 2026-05-04 — SignupForm.tsx

**SignupForm.tsx** (1,861 → 235 lines)
- **Presentational components** extracted to `components/auth/signup/components/`:
  - `SignupStepIndicator` — progress bar stepper
  - `RoleSelectorStep` — user/professional role selection cards
  - `PersonalDataForm` — step 2 personal data (name, country, email, password + strength)
  - `ProfessionalDataForm` — step 3 professional data (headline, specialty, tags, qualifications, terms)
  - `TermsModal` — scroll-to-accept terms overlay
  - `SignupSuccessModal` — signup success confirmation
- **Custom hook** extracted to `components/auth/signup/hooks/`:
  - `useSignupForm` — all ~40 useState declarations, 8 useEffects, validation, submit handler (~650 lines)
- **Types** extracted to `components/auth/signup/types.ts`
- **Helpers** extracted to `components/auth/signup/helpers.ts`
- Main component now pure orchestrator: calls hook + conditional step rendering + modals
- TypeScript: 0 errors
- **Presentational components** extracted to `components/agenda/professional-agenda/components/`:
  - `AgendaHeader` — title block + view switcher
  - `AgendaStatsCards` — 3 summary stat cards
  - `UpcomingBookingsSection` — upcoming bookings grid
  - `OverviewCalendarSection` — calendar section with sync status
  - `InboxHeader` — inbox title + filter pills
  - `InboxList` — unified inbox list (confirmations + requests)
  - `BlockTimeModal` — block time slot modal with async handler
- **Custom hooks** extracted to `components/agenda/professional-agenda/hooks/`:
  - `useBlockTimeModal` — modal state, open/close, loading, error
  - `useInboxItems` — inbox item merging + filtering
- **Helpers** extracted to `components/agenda/professional-agenda/helpers.ts`:
  - `viewLinkClass`, `getConfirmationDeadline`, `getSlaLabel`
  - `getRequestStatusUi`, `getDurationMinutes`, `bookingModeMeta`
- **Types** extracted to `components/agenda/professional-agenda/types.ts`

## Success Criteria

- No file >500 lines (except generated/config files)
- All existing tests pass
- No functional changes (pure refactoring)
- Build passes
- Smoke tests pass

## Risks

- **OnboardingTrackerModal**: High risk due to complexity and lack of tests. Recommend adding component tests first.
- **BookingForm**: Medium risk — widely used; ensure all form variants tested.



---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
