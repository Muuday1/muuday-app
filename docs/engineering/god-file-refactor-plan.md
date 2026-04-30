# God File Refactoring Plan

## Context

After the major architecture sprint, we successfully refactored `lib/actions/booking.ts` (876→720→646 lines) and `lib/actions/manage-booking.ts` (829→620 lines). However, a scan of the codebase reveals several remaining god files and god components that need attention.

## Current State

### Server Actions / Library Files (>500 lines)

| File | Lines | Functions | Priority | Status |
|------|-------|-----------|----------|--------|
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
| `components/dashboard/OnboardingTrackerModal.tsx` | ~~3,995~~ **2,038** | **CRITICAL** | ✅ Availability stage removed; further extraction needed |
| `components/booking/BookingForm.tsx` | ~~1,151~~ **1,377** | **HIGH** | ⚠️ Grew; needs hook/sub-component extraction |
| `components/agenda/ProfessionalAgendaPage.tsx` | ~~523~~ **660** | LOW | ⚠️ Grew; monitor |
| `components/professional/ProfileAvailabilityBookingSection.tsx` | ~~549~~ **625** | LOW | ⚠️ Grew; monitor |
| `components/agenda/ProfessionalAvailabilityWorkspace.tsx` | ~~600~~ **540** | MEDIUM | ✅ Reduced |
| `components/settings/ProfessionalSettingsWorkspace.tsx` | ~~629~~ **347** | MEDIUM | ✅ Reduced |

---

## Completed Work

### Cleanup Pass: 2026-04-30

**OnboardingTrackerModal.tsx** (3,995 → 2,038 lines)
- Removed inline `AvailabilityStage` and all associated state/handler logic (`availabilityMap`, `bookingRules`, `profileTimezone`, `saveAvailabilityCalendar`, etc.)
- Removed ~20 unused imports and helper functions (`Link`, `Upload`, `Blocker`, `TrackerViewMode`, `BlockerCta`, `PLAN_PRICE_BASE_BRL`, `PLAN_COMPARISON_ROWS`, `PLAN_ROW_BY_LABEL`, `LANGUAGE_OPTIONS`, `PROFESSIONAL_TITLES`, `TARGET_AUDIENCE_OPTIONS`, `toKeywords`, `formatCurrencyFromBrl`, `rgbToHsl`, `humanizeTaxonomyValue`, `resolveTaxonomyLabel`, `buildDefaultAvailabilityMap`, `categoryNameBySlug`, `subcategoryNameBySlug`)
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

#### 2.1 `components/dashboard/OnboardingTrackerModal.tsx` → Component extraction

**Current:** 2,038 lines — still a god component, but availability stage removed

**Analysis:** Contains:
- ~20 helper functions/constants at module level
- Complex state management
- Multiple "stages" of onboarding
- File upload handling
- Photo validation
- Plan selection/pricing
- Terms acceptance
- Review adjustments

**Extract to:**
- `components/dashboard/onboarding/` directory
- `useOnboardingState.ts` — custom hook for all state management
- `useOnboardingContext.ts` — data fetching hook
- `OnboardingStageRenderer.tsx` — stage routing component
- Individual stage components:
  - `ProfileStage.tsx`
  - `QualificationsStage.tsx`
  - `ServicesStage.tsx`
  - `PlanStage.tsx`
  - `TermsStage.tsx`
  - `ReviewStage.tsx`
- `PhotoUploader.tsx` — reusable photo upload + validation
- `constants.ts` — all constants, options, labels
- `helpers.ts` — utility functions

**Target:** Modal shell <200 lines, each stage <300 lines

#### 2.2 `components/booking/BookingForm.tsx` → Extract hooks and sub-components

**Current:** 1,377 lines (grew from 1,151)

**Extract to:**
- `hooks/useBookingForm.ts` — form state, validation, submission
- `hooks/useTimeSlots.ts` — time slot generation logic
- `components/booking/form-steps/` — step components
- `components/booking/TimeSlotPicker.tsx`

### Phase 3: Monitor & Maintain

#### 3.1 `lib/ops/stripe-resilience.ts` — **DONE** (41 lines)

#### 3.2 `lib/professional/onboarding-gates.ts` — **DONE** (294 lines)

---

## Implementation Order

1. **OnboardingTrackerModal** — highest user impact; extract stage components incrementally
2. **BookingForm** — extract hooks and sub-components
3. **Agenda page components** — monitor `ProfessionalAgendaPage.tsx` (660 lines) and `ProfileAvailabilityBookingSection.tsx` (625 lines)

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
