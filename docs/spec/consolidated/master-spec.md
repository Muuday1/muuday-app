# Muuday Unified Master Spec

Last updated: 2026-03-29
Source baseline: `docs/spec/source-of-truth/part1..part5`

## Scope

This file consolidates the five source parts into one implementation-facing structure without replacing or deleting source content.

## Non-negotiable decisions (already locked)

1. Marketplace model
- Muuday is a managed marketplace (not just a directory).
- Users book professionals across multiple service domains.
- Discovery, trust, booking, payment, and moderation are one connected system.

2. Taxonomy and discovery
- Hierarchy: Category > Subcategory > Specialty > Tag.
- Categories/subcategories/specialties are platform-governed.
- Tags enrich search recall but are not primary filters.
- Search is hybrid: structured filters + weighted free text.

3. Professional plans
- Tiers: Basic, Professional, Premium.
- Tier impacts limits, visibility, and operational/commercial capabilities.
- Signup incentive: 3-month free period.
- Annual option with discount exists.

4. Auth and role model
- User/customer and professional are separate account types.
- Professional login cannot be used as user account.
- User login cannot be used as professional account.
- Dual-role shared account is out of scope for now.
- Route guards are explicit by role (public, user, professional, admin).

5. Screen architecture and navigation baseline
- Logged-out nav baseline:
  - Home
  - Buscar profissionais
  - Registrar como profissional
  - Sobre nos
  - Ajuda
  - Login
  - Language switcher
  - Currency switcher
- Public search/profile is available without login.
- Booking action from public flow triggers sign-up/login modal (primary: sign up, secondary: login).
- Logged-in user primary nav:
  - Buscar profissionais
  - Bookings
  - Favorites
  - Profile
- Logged-in professional primary nav:
  - Dashboard
  - Calendario
  - Financeiro
  - Configuracoes
- Admin primary nav:
  - Dashboard
  - Operations
  - Professionals
  - Users
  - Finance
  - Catalog
  - Growth
  - Settings

6. Booking lifecycle
- Booking flow is service-first then slot selection then review then payment.
- Acceptance modes: auto-accept or manual-accept.
- Manual acceptance has explicit deadline behavior.
- Slot hold before payment is required.
- Internal booking state machine is explicit; UI statuses are simplified.

7. Availability and timezone
- UTC is canonical persistence format.
- User/professional/admin views must be timezone-safe and explicit.
- Minimum notice, booking window, and buffer rules are first-class constraints.

8. Recurring behavior
- Recurring is supported with fixed default schedule templates.
- Future-cycle slot reservation and release rules are explicit.
- Pause/change windows are deadline-based.

9. Payments and revenue
- Muuday charges the customer and pays professionals later.
- Preferred Stripe model: Separate Charges and Transfers.
- Payout eligibility is delayed after session completion and dispute window.
- Weekly payout cadence and payout minimum threshold are defined.
- Refunds return to original payment method in MVP.

10. Professional billing
- Professional subscription billing exists after free period.
- Billing failure has grace window and booking-block consequences.

11. Trust, moderation, and admin operations
- First go-live requires light admin review.
- Reviews are one-per-user-professional with edit/update model.
- Professional response to review is controlled.
- Structured case queue is required for disputes and exceptions.
- Auditability is mandatory for sensitive admin actions.

12. Notifications and inbox
- Email + in-app notifications are MVP baseline.
- In-app inbox is separate from chat.
- Reminder cadence is defined and timezone-safe.

13. Compliance and sensitive categories
- Sensitive categories require stricter wording and disclaimer controls.
- Profile + checkout disclaimer layers are required.
- Verification and claim governance must be category-aware.

14. Professional onboarding and gating matrix
- Stage model is explicit and execution-ready:
  - account creation
  - identity positioning
  - profile
  - services
  - availability
  - plan/billing setup
  - payout onboarding
  - submit for review
  - go live
- Field-level requirements are explicitly classified by gate:
  - account creation
  - valid profile draft
  - review submission
  - go live
  - first booking acceptance
  - payout eligibility

## Provisional decisions (intentionally open)

1. Video provider final lock
- Preferred target: embedded provider model.
- Fallback: external meeting-link model.
- Build provider-agnostic abstraction first.

2. Stripe corridor final validation
- UK platform and Brazil-heavy professional payout corridor must be validated directly with Stripe before architecture freeze.

3. Final legal/tax wording and structure
- Product-level policy is defined.
- Legal and accounting language still needs final review.

## Deferred (do not build now unless explicitly promoted)

1. Wallet/credit systems.
2. Advanced tax automation.
3. High-complexity trust scoring automation.
4. Advanced growth CRM sophistication beyond MVP workflows.
5. Deep in-session premium tooling.

## Cross-domain implementation principles

1. Deterministic rules over implicit behavior.
2. Booking state, payment state, payout state, and case state must stay separated.
3. Event-driven orchestration with auditable logs.
4. Policy snapshots at booking/payment time.
5. Role-based UX simplification backed by rich internal states.
6. Operational control first; avoid over-automation in ambiguous cases.

## Canonical references by domain

1. Foundations/discovery/tiers/trust baseline: Part 1.
2. Onboarding/booking/scheduling/state model: Part 2.
3. Payments/billing/payout/ledger model: Part 3.
4. Admin cases/notifications/trust ops: Part 4.
5. Video/compliance/open validations/future-thinking: Part 5.
