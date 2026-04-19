# God File Refactoring Plan

## Context

After the major architecture sprint, we successfully refactored `lib/actions/booking.ts` (876→720→646 lines) and `lib/actions/manage-booking.ts` (829→620 lines). However, a scan of the codebase reveals several remaining god files and god components that need attention.

## Current State

### Server Actions / Library Files (>500 lines)

| File | Lines | Functions | Priority |
|------|-------|-----------|----------|
| `lib/actions/request-booking.ts` | 861 | 10 | **HIGH** |
| `lib/email/resend.ts` | 897 | 25+ | **HIGH** |
| `lib/ops/stripe-resilience.ts` | 816 | 18 | MEDIUM |
| `lib/professional/onboarding-gates.ts` | 770 | 8 | MEDIUM |
| `lib/actions/admin.ts` | 655 | — | LOW |
| `lib/actions/booking.ts` | 646 | — | LOW (already refactored) |
| `lib/actions/manage-booking.ts` | 620 | — | LOW (already refactored) |
| `lib/actions/email.ts` | 548 | — | LOW |

### Components (>500 lines)

| File | Lines | Priority |
|------|-------|----------|
| `components/dashboard/OnboardingTrackerModal.tsx` | 3,995 | **CRITICAL** |
| `components/booking/BookingForm.tsx` | 1,151 | **HIGH** |
| `components/settings/ProfessionalSettingsWorkspace.tsx` | 629 | MEDIUM |
| `components/agenda/ProfessionalAvailabilityWorkspace.tsx` | 600 | MEDIUM |
| `components/professional/ProfileAvailabilityBookingSection.tsx` | 549 | LOW |
| `components/agenda/ProfessionalAgendaPage.tsx` | 523 | LOW |

---

## Proposed Refactoring

### Phase 1: Server Actions (High Priority)

#### 1.1 `lib/actions/request-booking.ts` → Extract shared modules

**Current:** 861 lines, 10 functions

**Extract to:**
- `lib/booking/request-validation.ts` (extend existing) — add request-booking-specific schemas
- `lib/booking/request-availability-checks.ts` — professional eligibility, tier checks
- `lib/booking/request-state-machine.ts` (already exists) — status transitions
- `lib/actions/request-booking.ts` — keep only exported action handlers (~400 lines target)

**Functions to extract:**
- `getAuthenticatedContext()` → shared auth helper (if not already)
- `expireRequestIfNeeded()` → `lib/booking/request-helpers.ts`
- `professionalCanReceiveRequestBooking()` → `lib/booking/request-availability-checks.ts`

#### 1.2 `lib/email/resend.ts` → Split by domain

**Current:** 897 lines, 25+ email functions, massive inline HTML templates

**Extract to:**
- `lib/email/client.ts` — Resend client initialization, `sendEmail()` wrapper
- `lib/email/theme.ts` — `THEME` object, `emailLayout()`, `cta()`, `infoBox()`, `signoff()`
- `lib/email/templates/booking.ts` — booking-related emails (confirmation, reminder, cancellation, reschedule)
- `lib/email/templates/professional.ts` — professional emails (approved, needs changes, rejected)
- `lib/email/templates/user.ts` — user emails (welcome, complete account, password reset)
- `lib/email/templates/marketing.ts` — marketing emails (newsletter, waitlist, welcome series, reengagement)
- `lib/email/templates/review.ts` — review emails
- `lib/email/resend.ts` — re-export everything for backward compatibility

**Target:** Each file <300 lines

### Phase 2: Components (Critical/High Priority)

#### 2.1 `components/dashboard/OnboardingTrackerModal.tsx` → Component extraction

**Current:** 3,995 lines — this is a god component

**Analysis:** Contains:
- ~30 helper functions/constants at module level
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
  - `AvailabilityStage.tsx`
  - `PlanStage.tsx`
  - `TermsStage.tsx`
  - `ReviewStage.tsx`
- `PhotoUploader.tsx` — reusable photo upload + validation
- `constants.ts` — all constants, options, labels
- `helpers.ts` — utility functions

**Target:** Modal shell <200 lines, each stage <300 lines

#### 2.2 `components/booking/BookingForm.tsx` → Extract hooks and sub-components

**Current:** 1,151 lines

**Extract to:**
- `hooks/useBookingForm.ts` — form state, validation, submission
- `hooks/useTimeSlots.ts` — time slot generation logic
- `components/booking/form-steps/` — step components
- `components/booking/TimeSlotPicker.tsx`

### Phase 3: Other Library Files

#### 3.1 `lib/ops/stripe-resilience.ts`

**Current:** 816 lines, 18 functions

**Extract to:**
- `lib/stripe/client.ts` — client initialization
- `lib/stripe/webhook-handlers.ts` — webhook event processing
- `lib/stripe/jobs.ts` — cron job functions (payout scan, renewal checks, retry queue)
- `lib/stripe/helpers.ts` — utility functions

#### 3.2 `lib/professional/onboarding-gates.ts`

**Current:** 770 lines, 8 functions

**Extract to:**
- `lib/professional/gate-evaluators.ts` — individual gate evaluation functions
- `lib/professional/gate-helpers.ts` — utility functions
- `lib/professional/onboarding-gates.ts` — main export orchestrator

---

## Implementation Order

1. **Email templates** (`lib/email/resend.ts`) — safest, no logic changes, pure code movement
2. **Request booking actions** (`lib/actions/request-booking.ts`) — follow same pattern as booking.ts refactor
3. **OnboardingTrackerModal** — highest user impact, but most complex
4. **Stripe resilience** — can be done incrementally
5. **Onboarding gates** — lower priority, stable code

## Success Criteria

- No file >500 lines (except generated/config files)
- All existing tests pass
- No functional changes (pure refactoring)
- Build passes
- Smoke tests pass

## Risks

- **OnboardingTrackerModal**: High risk due to complexity and lack of tests. Recommend adding component tests first.
- **Email templates**: Medium risk — need to verify all email functions still produce identical HTML output.
- **Request booking**: Low risk — follow proven pattern from booking.ts refactor.
