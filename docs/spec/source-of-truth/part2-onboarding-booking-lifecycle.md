MUUDAY CONSOLIDATED PRODUCT SPECIFICATION
PART 2 OF 5 — PROFESSIONAL ONBOARDING, AVAILABILITY, BOOKING LIFECYCLE, BOOKING STATES, REQUEST BOOKING, REBOOKING, CALENDAR/TIMEZONE LOGIC

Status of this document
- This is Part 2 of a 5-part consolidated specification.
- It is written to be self-contained.
- It is intentionally detailed.
- It is implementation-oriented and should be readable by product, design, engineering, and operations.
- It reflects the decisions already made in the working sessions so far.
- It should be treated as source material for building the professional onboarding and booking systems.
- This part deliberately avoids going deep into Stripe funds flow, payout calculations, refunds accounting, and subscription billing mechanics. Those are covered in later parts.

How this part fits with the other parts
- Part 1 covered: product foundations, taxonomy, tiers, search/discovery, profile trust, reviews, and visibility logic.
- Part 2 covers: professional onboarding, service setup, availability logic, direct booking flow, request booking flow, booking state machine, recurring slot behavior at a booking level, rescheduling/cancellation flow behavior, and calendar/timezone handling.
- Part 3 will cover: payments, Stripe architecture, Connect, Billing, fees, refunds, disputes, payout timing, subscriptions, and recurring payment logic.
- Part 4 will cover: notifications, admin cases, moderation, post-session review operations, support workflows, session/video/chat specifics, and trust & safety operations.
- Part 5 will cover: technical architecture, data model guidance, analytics, implementation sequencing, cost-effective tool choices, and deferred strategic items.

What this part covers
1. Professional signup and first go-live journey
2. Minimum required information and gating rules for publication and first booking
3. Service setup rules and booking-related service configuration
4. Availability rules, booking windows, minimum notice, and calendar integration approach
5. Direct booking journey from profile to confirmed booking
6. Manual-accept versus auto-accept booking logic
7. Request booking flow
8. Booking state machine, UI states, and platform-side status handling
9. Reschedule and cancellation behavior from a booking-operations perspective
10. Booking timeline, slot holding, checkout expiration recovery, and price lock rules
11. Recurring booking mechanics at the scheduling layer
12. Timezone, calendar, and date/time handling principles
13. Technical requirements, implementation notes, and AI-agnostic build instructions for this scope
14. Auth role split, route guards, and screen inventory by role
15. Public/user/professional/admin navigation baseline
16. Detailed professional onboarding stages and requirement matrix

Questions mainly consolidated into this part
This part primarily consolidates the decisions that originated from the question clusters on:
- professional signup and go-live
- minimum onboarding requirements
- service setup
- availability and booking windows
- booking journey and review screen
- manual vs auto accept
- request booking
- slot holds and checkout recovery
- booking state machine
- recurring slot handling
- timezone and calendar handling
- cancellation/rebooking interface behavior

--------------------------------------------------------------------
--------------------------------------------------------------------
SECTION 0 - AUTH MODEL, ROLE SPLIT, ROUTE GUARDS, AND SCREEN INVENTORY
--------------------------------------------------------------------

0.1 Account type and role split (final rule)
- User/customer and professional are separate account types.
- A professional login cannot be used as a user account.
- A user login cannot be used as a professional account.
- Do not implement shared dual-role accounts for now.

0.2 Route guard and permission rules
- Public routes: home, search, public professional profiles, about, help, login, user sign-up, professional registration entry.
- User routes: user workspace only.
- Professional routes: professional workspace only.
- Admin routes: admin workspace only.
- Any attempt to access another role workspace must redirect to the correct login or unauthorized state.

0.3 Logged-out navigation (public)
Baseline top navigation order:
- Home
- Buscar profissionais
- Registrar como profissional
- Sobre nos
- Ajuda
- Login button/icon
- Language switcher
- Currency switcher

Public behavior rules:
- Buscar profissionais is publicly accessible without login.
- Logged-out timezone defaults to device/computer timezone.
- Logged-out currency defaults to location/computer context, with manual override available.
- If a visitor tries to book from public search/profile flow, open sign-up/login modal.
- In that modal:
  - primary action: sign up / create user account
  - secondary action: login

0.4 Screen inventory by role

Logged-out visitor screens:
- Landing / Home
- Buscar profissionais / Search results
- Professional public profile
- Sobre nos
- Ajuda / FAQ / support landing
- Login
- User sign-up modal/page
- Professional registration entry page

Logged-in user/customer primary navigation:
- click logo returns to landing page from any screen
- Buscar profissionais
- Bookings
- Favorites
- Profile (avatar/name entry)

Logged-in user/customer secondary areas:
- Messages/chat as secondary persistent entry (floating icon, shortcut, or contextual entry)
- Notifications/inbox as icon/secondary area
- Settings nested under Profile
- Financial history nested under Profile or Booking detail context

Logged-in professional primary navigation:
- Dashboard
- Calendario
- Financeiro
- Configuracoes

Logged-in professional secondary/contextual areas:
- messages/chat
- request booking queue
- reviews and performance
- booking detail screens
- payout onboarding alerts

Admin primary navigation:
- Dashboard
- Operations
- Professionals
- Users
- Finance
- Catalog
- Growth
- Settings

0.5 User-side IA rules (main areas)
- Buscar profissionais: search input, suggestions, filters, sort, results, no-results guidance, profile access.
- Bookings: upcoming/past/pending, detail, reschedule/cancel flows, timeline, session entry, review prompts.
- Favorites: saved professionals and quick re-entry/rebooking.
- Profile: account details, settings, language/timezone/preferences, payment methods, payments/refunds/receipts, notification settings, support, logout.

0.6 Professional-side IA rules (main areas)
- Dashboard must answer: what needs action now, upcoming sessions, pending confirmations, earnings summary, payout/billing/account health.
- Calendario must operate as scheduling control center: confirmed, pending, blocked, recurring, external sync conflicts.
- Financeiro must expose earnings, payouts, booking-level money history, adjustments/refunds, billing/plan status, exports.
- Configuracoes must own business setup: profile, services, pricing, taxonomy, availability defaults, booking preferences, notifications, payout/billing setup, compliance tasks.

0.7 Cross-role enforcement rule
- Logged-in users can access user areas only.
- Logged-in professionals can access professional areas only.
- Public search remains viewable without login, but any booking action must trigger sign-up/login if unauthenticated.

0.8 Navigation complexity control
- Keep top-level nav minimal for each role.
- Keep detail flows nested under parent areas.
- Do not promote every operational screen to top-level navigation.

--------------------------------------------------------------------
SECTION 1 — PROFESSIONAL ONBOARDING STRATEGY
--------------------------------------------------------------------

1.1 Final policy on professional onboarding
Muuday must make professional onboarding structured but not heavy-handed. The platform cannot be so open that unqualified or badly configured profiles flood the marketplace, and it also cannot be so rigid that good professionals drop before going live.

The final operating principle is:
- onboarding must feel guided
- first publication must pass a light admin review
- publication requirements and first-booking requirements are not identical
- some requirements can be deferred until before the first booking, but not indefinitely

1.2 Professional signup journey — final structure
The professional onboarding journey must follow this sequence:

Step 1 — Account creation
The professional creates an account with the minimum identity and location data.

Minimum required in Step 1:
- name
- email
- password or social login equivalent
- country of residence
- timezone
- primary language

What this means for the professional
- The professional can enter the platform and begin setup.
- They are not yet public.
- They are not yet bookable.

What this means for admin
- Admin does not need to intervene yet.

System/backend behavior
- Create professional account entity.
- Initialize onboarding progress state.
- Save country and timezone early, because they influence later availability and compliance behavior.

Technical requirements
- Support email/password or equivalent auth.
- Capture timezone explicitly rather than inferring only from browser.
- Support onboarding progress persistence.

Implementation notes
- Do not require payment or payout setup before the professional even understands the platform.
- Keep the first step low-friction.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
1.3 Step 2 — Professional positioning within the taxonomy
The professional must then position themselves inside the Muuday taxonomy.

Minimum required:
- category
- subcategory
- specialty
- public/professional display name
- short headline
- short bio starter

What this means for the professional
- They must decide what they are in marketplace terms.
- They cannot remain a vague generalist profile.

What this means for admin
- Admin later verifies whether the chosen taxonomy path makes sense.

System/backend behavior
- Enforce selection from curated category / subcategory / specialty lists.
- Prevent freeform taxonomy creation.
- Allow later suggestions for new specialties, but not open creation during core onboarding.

Technical requirements
- Controlled lists for category, subcategory, specialty.
- Dynamic specialty list dependent on selected subcategory.
- Draft-save support.

Implementation notes
- The taxonomy step should guide the professional with examples.
- The UI must make clear the difference between specialty and tag.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
1.4 Step 3 — Public profile minimum
The professional must then create the visible public layer of the profile.

Minimum required:
- profile photo
- short bio
- languages spoken
- base location / country
- at least one service draft

What this means for the professional
- They cannot go live with an empty shell profile.
- The profile must already look credible before review.

What this means for admin
- Admin later checks whether the profile is coherent and presentable.

System/backend behavior
- Track profile completeness.
- Block go-live if required public fields are missing.

Technical requirements
- Image upload with validation and cropping support.
- Profile completeness scoring or boolean requirement checks.

Implementation notes
- Profile completeness should be visible to the professional.
- The platform should say exactly what is missing.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
1.5 Step 4 — Service creation minimum
The professional must create at least one bookable service draft.

Minimum required:
- service name
- service type
  - one-off
  - one-off plus recurring
  - monthly subscription-style service
- price
- duration
- short description
- availability configuration

What this means for the professional
- The professional cannot just have a profile; they must have at least one reservable offer.

What this means for admin
- Admin later checks whether the service is clear, priced coherently, and positioned correctly.

System/backend behavior
- Validate service data before the go-live stage.
- Support multiple service types even if their financial logic differs later.

Technical requirements
- Service table with service_type enum.
- Duration and pricing model fields.
- Availability relation to services rather than only to the professional globally.

Implementation notes
- Service setup should not assume every professional has the same service model.
- One-off, recurring, and monthly services should share a common base model but allow type-specific rules.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
1.6 Step 5 — Availability and agenda setup
The professional must configure enough availability for the marketplace to create real bookings.

Minimum required:
- working availability windows
- minimum notice
- maximum booking window according to tier
- timezone confirmation
- calendar sync, when applicable

What this means for the professional
- They cannot go live without usable availability.

System/backend behavior
- Availability is a real booking dependency, not cosmetic information.

Technical requirements
- Recurring weekly availability representation.
- Exceptions and blocked times architecture.
- Support for future calendar sync with the professional calendar.

Implementation notes
- Availability should be service-aware wherever possible.
- The system must not rely only on static generic hours if service durations differ.

1.7 Step 6 — Plan choice and billing preparation
Final decision:
- The professional enters onboarding with Basic as the default.
- The platform shows Basic / Professional / Premium early enough in onboarding so the professional understands the options.
- The final plan confirmation happens near go-live, not in the very first minute.
- The professional receives 3 months free on the selected plan at signup/publication time.

What this means for the professional
- They are not overwhelmed immediately by plan selection.
- They still understand what the paid tiers unlock before going live.
- They must save a card before going live, because the free period will eventually end.

System/backend behavior
- Start with Basic default state.
- Store selected target plan before publication.
- Create trial/waiver logic later in billing.

Technical requirements
- Plan comparison screen in onboarding.
- Trial period metadata.
- Saved payment method flag before go-live.

Implementation notes
- This is a refined "C" model from the decision process: default Basic, plans shown early, final decision before go-live.

1.8 Step 7 — Payments / payout onboarding gating
Important final decision:
- The professional may create profile and be visible/publicly present.
- But they must complete Stripe / payout onboarding before accepting the first reservation.

This means the system distinguishes:
- published profile eligibility
- first booking acceptance eligibility

What this means for the professional
- They can finish public setup and be listed.
- They cannot accept a first booking without payments/payout requirements complete.

What this means for admin
- Admin can publish the profile but still see payment-readiness state.

System/backend behavior
- Store flags like:
  - profile_published
  - can_accept_first_booking
  - payout_onboarding_complete
  - billing_method_on_file
- Prevent acceptance flow until gating passes.

Technical requirements
- Booking-eligibility guardrails.
- UI banner explaining what is missing.

Implementation notes
- This improves supply growth without creating broken downstream booking flows.

1.9 Step 8 — Light admin review for first go-live
Final decision:
- The first time a professional goes live, the profile and services must pass a light admin review.
- After that, lighter updates can flow more freely, while structural/commercial updates follow the review rules from Part 1.

Admin should check at minimum:
- profile seems real
- taxonomy choice makes sense
- service is understandable
- service price is not obvious spam/noise
- content is appropriate
- category-sensitive disclaimers/credential requirements are respected

Technical requirements
- Admin review queue.
- Status fields:
  - draft
  - submitted_for_review
  - needs_changes
  - approved_live
- Review notes field.

Implementation notes
- Review should be light and fast.
- This is not meant to become a heavy manual bottleneck.

--------------------------------------------------------------------
1.10 PROFESSIONAL ONBOARDING JOURNEY - FULL DETAIL (EXECUTION-READY)
Recommended stage order:
1. Account creation
2. Basic professional identity
3. Public profile
4. Service setup
5. Availability / calendar
6. Plan selection and billing setup
7. Payout / payments onboarding
8. Final review / submit for approval
9. Go live

1.11 Stage detail and required fields

Stage 1 - Account creation
Required now:
- name
- email
- password or auth provider
- country of residence
- timezone
- primary language
Optional later:
- phone
- additional languages
- profile image

Stage 2 - Basic professional identity
Required now:
- public/professional display name
- category
- subcategory/profession
- specialties (limit by tier: Basic 1, Professional 3, Premium 3)
- headline
- base country
- (removed — professionals serve globally, no jurisdiction restriction)
- sensitive-category disclaimer prompts where relevant

Stage 3 - Public profile
Required now:
- profile photo
- short bio
- languages spoken
- credibility/experience summary (minimum starter)
- cover photo (available to all tiers, optional but strongly encouraged)
Optional now / required later by category:
- long bio (Professional: up to 2000 chars, Premium: up to 5000 chars — not available for Basic)
- credential upload (required_for_go_live for sensitive categories: saude, juridico, medico)
- trust badge evidence fields
New items (not in original spec):
- WhatsApp number (optional — visible on public profile for Professional and Premium only)
- video intro link (YouTube/Vimeo — available for Professional and Premium only)
- social media / website links (Professional: up to 2, Premium: up to 5 — not available for Basic)
- notification preferences (email, push, WhatsApp — defaults to all enabled, configurable; WhatsApp notifications for Professional and Premium only)

Stage 4 - Service setup
Required before submission:
- service name
- service type (one-off / one-off+recurring / monthly subscription)
- duration options (up to 3 per service Basic, 6 Professional, 10 Premium)
- pricing
- description
- category/subcategory/specialty association
- availability relation
- service type count limit: Basic 1, Professional 5, Premium 10 distinct service offerings
Service delivery:
- All sessions are video via Agora (no in-person option)
- Video session setup is automatic (Agora backend config, no manual professional setup)
Optional by tier/category:
- recurring enabled flag (available to all tiers — recurrence = same day/time, user picks periodicity)
- monthly-plan settings
- advanced tags
- sensitive-category disclaimers
Booking modes supported per service:
- single booking (one date)
- multiple bookings (user selects several non-recurring dates in one checkout)
- recurring booking (same day/time, user chooses periodicity: weekly, biweekly, monthly, or every X weeks/days)

Stage 5 - Availability / calendar
Required before go-live:
- working days/hours
- timezone confirmation
- minimum notice (Basic 2h-48h, Professional 1h-72h, Premium 30min-168h)
- maximum booking window (Basic 60 days, Professional 90 days, Premium 180 days)
- auto-accept or manual-accept choice (manual-accept only for Professional and Premium)
- blocked times baseline
- buffer time between sessions (Basic: fixed 15min, Professional/Premium: configurable 5-60min)
- cancellation/no-show policy acceptance (platform default policy — professional must accept before review submission, required_for_review_submission)
Required before go-live (strongly recommended at Stage 5):
- external calendar sync — Google Calendar (all tiers), Outlook (Professional and Premium only)
- calendar sync is not a hard blocker for go-live but the system shows a persistent banner post go-live if not connected
Optional now:
- advanced recurring slot preferences

Stage 6 - Plan selection / billing setup
Rules:
- 3 tiers: Basic / Professional / Premium
- show plans early, default starts as Basic
- final confirmation near go-live
- 3 months free on sign-up
- annual plan: annual = 10× monthly price (not a percentage discount)
- during trial: upgrade allowed, downgrade only in next cycle
Required before review submission:
- terms of service acceptance (termsAcceptedAt + termsVersion — required_for_review_submission)
Required before first booking acceptance:
- card on file for future professional billing

Stage 7 - Payout / payments onboarding
Required before first booking acceptance:
- Stripe connected onboarding started and minimum required payout fields complete
Required before receiving payout:
- payout setup and required KYC/identity status complete

Stage 8 - Submit for review / approval
System must show explicit checklist:
- complete now
- missing but optional
- missing and blocking submission/go-live/first booking/payout
First publication requires light admin review.

Stage 9 - Go live
- profile can be listed when go-live criteria pass
- accepting first booking still depends on booking-eligibility criteria

1.12 Onboarding questions and requirements matrix (authoritative)

Field classification:
- required_at_account_creation
- required_for_valid_profile_draft
- required_for_review_submission
- required_for_go_live
- required_for_first_booking_acceptance
- required_for_payout

Minimum matrix:
- name: account_creation
- email: account_creation
- password/auth: account_creation
- country_of_residence: account_creation
- timezone: account_creation
- primary_language: account_creation
- display_name: valid_profile_draft
- category/subcategory/specialty: valid_profile_draft + review_submission
- (service_jurisdiction removed — professionals serve globally)
- headline + short_bio: valid_profile_draft + review_submission
- profile_photo: review_submission + go_live
- at_least_one_service: review_submission + go_live
- service_price_and_duration: review_submission + go_live
- availability_baseline: review_submission + go_live
- acceptance_mode_choice: review_submission + go_live
- cancellation_policy_accepted: review_submission (platform default policy, not customizable in MVP)
- terms_accepted (termsAcceptedAt + termsVersion): review_submission
- professional_plan_selection: review_submission
- billing_card_for_professional_plan: first_booking_acceptance
- payout_connected_account_minimum: first_booking_acceptance
- payout_kyc_complete: payout
- sensitive_category_disclaimer_fields: review_submission + go_live (where applicable)
- sensitive_category_credentials: go_live or first_booking_acceptance based on category risk policy
- credential_upload: go_live (for sensitive categories only — saude, juridico, medico)
Optional but tracked:
- cover_photo: optional (all tiers)
- whatsapp_number: optional (visible on profile for Professional/Premium only)
- video_intro_url: optional (Professional/Premium only)
- social_links: optional (Professional up to 2, Premium up to 5)
- calendar_sync_provider: optional but strongly recommended — persistent banner if not connected post go-live
- notification_preferences: optional — defaults to all enabled

1.13 Gating summary (explicit)
- Minimum required to create account: Stage 1 required fields only.
- Minimum required to submit for review: stages 2 to 6 baseline fields complete + cancellation policy accepted + terms accepted.
- Minimum required to go live: approved submission + go-live blockers cleared + credential upload (sensitive categories).
- Minimum required to accept first booking: payout/billing gating requirements complete.
- Minimum required to receive payout: payout/KYC requirements complete.

1.14 Implementation readiness notes for onboarding
- Every onboarding field must have explicit state and gate mapping.
- Every gate decision must be machine-checkable and audit-friendly.
- Do not hide blockers; present them as clear checklist items.
SECTION 2 — MINIMUM REQUIRED TO GO LIVE VS MINIMUM REQUIRED TO ACCEPT BOOKINGS
--------------------------------------------------------------------

2.1 Minimum required to create account
Required:
- auth identity
- country
- timezone

2.2 Minimum required to have a meaningful profile draft
Required:
- category
- subcategory
- specialty
- profile photo
- professional/public name
- short headline
- short bio

2.3 Minimum required to be listed publicly
Required:
- all profile minimums above
- at least one service configured
- service price
- service duration
- availability configured
- plan chosen
- initial profile approved by admin

2.4 Minimum required to accept the first booking
Required:
- payout / payment onboarding complete
- professional billing setup sufficiently complete
- plan/trial/commercial terms accepted
- any category-sensitive credential/disclaimer requirements met

2.5 Why this two-layer model matters
If Muuday requires everything before any public visibility, supply creation may drop.
If Muuday requires nothing before first booking, the platform will break operationally.
The chosen model keeps supply growth while protecting the first actual transaction.

--------------------------------------------------------------------
SECTION 3 — SERVICE SETUP RULES RELEVANT TO BOOKING
--------------------------------------------------------------------

3.1 Service models supported in the booking layer
Each service must explicitly declare one of the following:
- one_off_service
- recurring_session_service
- monthly_subscription_service

This is important because booking behavior changes by service type even before financial logic is considered.

3.2 Limits inherited from tiers
These were already decided in Part 1 and must be enforced here operationally.

Service count limit:
- Basic: 3 services
- Professional: 10 services
- Premium: 20 services

Option/duration count per service:
- Basic: 3 options
- Professional: 6 options
- Premium: 10 options

Specialty limit:
- Basic: 2
- Professional: 3
- Premium: 5

Tag limit:
- Basic: 3
- Professional: 5
- Premium: 10

Booking window limit by tier:
- Basic: 60 days
- Professional: 90 days
- Premium: 180 days

3.3 Service comparison on profile
Final decision for MVP:
- Services appear as a simple list rather than a rich comparison table.
- However, each service still needs clear minimum metadata.

Each service listing in profile should show:
- service name
- price
- duration
- service description short version
- type of service when relevant

3.4 Service type selection per service, not just per professional
Final decision:
- Professionals should choose service model at the service level, not only once at the account level.

Example:
One professional can have:
- a one-off consultation
- a one-off plus recurring service
- a monthly subscription service

Technical requirements
- service_type field on service record
- service-level booking and recurring flags
- service-level UI branching

Implementation notes
- This avoids artificially flattening professional offers.

3.5 Price locking rule for existing bookings
Final decision:
- Price is locked at the time of checkout.
- Later price changes apply only to future bookings or future cycles where explicitly allowed.
- Existing paid bookings are never repriced.

What this means
- Users are protected from post-purchase repricing.
- Support and dispute complexity is reduced.

Technical requirements
- Snapshot booking price data at booking creation time.
- Never derive booked price dynamically from current service price.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Keep domain models explicit, typed, and auditable.
- Keep transitions deterministic and prevent illegal state changes.
- Keep role-based UI/status mapping clear without leaking internal complexity.
- Keep implementation modular and maintainable for lean operations.

--------------------------------------------------------------------
SECTION 4 — AVAILABILITY, AGENDA, CALENDAR, BOOKING WINDOW, AND TIMEZONE
--------------------------------------------------------------------

4.1 Core availability rule
Availability is not merely display information. It must be treated as a bookability engine.

4.2 Professional-side calendar sync strategy
Final decision:
- Strong calendar sync on the professional side in MVP.
- User side gets lightweight add-to-calendar actions first.

This means:
- Professional calendar sync is part of conflict prevention.
- User calendar sync is convenience, not a booking integrity dependency.

4.3 User-side calendar handling in MVP
User receives:
- Add to Google Calendar
- Add to Apple Calendar / ICS equivalent
- links in email and booking page

4.4 Booking window rule by tier
Already decided and must be enforced in booking logic:
- Basic: next 60 days only
- Professional: next 90 days only
- Premium: next 180 days only

4.5 Minimum notice
A minimum notice setting exists on the professional side.
Default was discussed as 24 hours, but the system should support configurable minimum notice per professional/service according to the business rules already agreed.

4.6 Buffer logic
Professional-side buffer can exist as a configurable setting.
This affects slot generation and should be enforced at the availability engine level, not manually in UI only.

4.7 Timezone handling — final rule
This is a critical global-platform rule.

Muuday must:
- store canonical timestamps in UTC
- store user timezone
- store professional timezone
- show date/time in the viewer’s relevant timezone
- show timezone explicitly in booking details, reminders, and review screen
- allow admin to view both sides clearly

User side behavior
- User sees booking date/time in the user’s timezone.

Professional side behavior
- Professional sees booking date/time in the professional’s timezone.

Admin behavior
- Admin can view:
  - user timezone time
  - professional timezone time
  - internal UTC reference

Technical requirements
- UTC canonical datetime storage
- timezone-aware rendering layer
- no naive datetime arithmetic
- DST-safe scheduling logic

Implementation notes
- This rule should be applied consistently in profile previews, slot selection, review screen, reminders, booking details, admin views, and exports.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
--------------------------------------------------------------------
SECTION 5 — BOOKING JOURNEY: USER-SIDE FLOW
--------------------------------------------------------------------

5.1 Entry into booking
The booking flow must begin from the professional profile.

The profile page must contain:
- primary CTA: Reserve / Book
- secondary CTA: Message
- additional CTA when eligible: Request booking

5.2 Availability preview at profile level
Final decision:
- The profile should show a light preview of availability.
- Actual slot selection happens only after service and duration/form are selected.

Why this matters
- Users want confidence that the professional has near-term availability.
- But the slot engine must respect service-specific duration rules.

5.3 Final booking flow order
Final decision:
- Show profile and context
- Show a preview of availability
- User selects service
- User selects duration / format if relevant
- User selects real eligible slot
- User reaches review/final summary screen
- User proceeds to payment

5.4 Review/final summary screen before payment
Final decision:
- There must always be a review step before payment.

This review screen must clearly show:
- professional
- service
- duration
- date/time
- timezone
- cancellation policy
- final total price

And it must require explicit checkbox acknowledgment for:
- cancellation / no-show policy
- time / timezone confirmation

What this means for the user
- The user sees a final confirmation screen before paying.
- The user must explicitly accept critical rules.

What this means for admin and support
- The platform has stronger defensibility in dispute scenarios.

Technical requirements
- Booking summary page/component
- policy version snapshot
- acceptance timestamp storage
- checkbox requirement logging

Implementation notes
- This is not optional because too much of the marketplace depends on clear time, cancellation, and cross-border expectations.

5.5 Success screen after payment
Final decision:
- After successful payment, show a rich but compact success page.

This page must show:
- booking confirmed or pending confirmation state, depending on acceptance mode
- professional
- service
- date/time
- timezone
- status
- add to calendar
- message professional
- future join-session CTA
- booking detail link
- cancellation summary

--------------------------------------------------------------------
SECTION 6 — DIRECT BOOKING ACCEPTANCE MODES
--------------------------------------------------------------------

6.1 Final decision: professional can choose auto-accept or manual-accept
Each professional can choose, in setup, between:
- auto_accept
- manual_accept

This choice affects booking state behavior.

6.2 Auto-accept logic
If professional uses auto-accept:
- user chooses slot
- user reviews
- user pays
- booking becomes confirmed immediately if slot is still valid

What this means
- Fastest UX
- Lowest friction
- Best for professionals who trust their calendar setup

6.3 Manual-accept logic
If professional uses manual-accept:
- user chooses slot
- user reviews
- user pays
- booking becomes pending_professional_acceptance
- professional has 48 hours to accept or reject

If no response within 48 hours:
- booking expires
- user receives refund
- slot is released

What this means for user
- User must be told clearly that payment happened but confirmation is pending.

What this means for professional
- They must respond within 48 hours.

What this means for admin
- Cases of non-response should be visible for quality operations.

Technical requirements
- acceptance_mode at professional and/or service level
- expiration timer logic
- refund trigger integration later in payments layer
- UI state messaging

Implementation notes
- The 48-hour choice is intentionally generous. Therefore, UX clarity is mandatory.

6.4 How pending acceptance appears in UI
Final decision:
- In booking list: show simple label such as “Pending confirmation.”
- In booking detail: show detailed explanation.

Booking detail page must show:
- payment completed
- waiting for professional confirmation
- response deadline
- what happens if not accepted in time
- booking will be refunded if it expires without acceptance

--------------------------------------------------------------------
SECTION 7 — REQUEST BOOKING FLOW
--------------------------------------------------------------------

7.1 Availability of request booking by tier
Final decision:
- Basic: no request booking
- Professional and Premium: request booking available

7.2 Why request booking exists
Request booking supports:
- full or constrained calendars
- professionals who prefer custom scheduling
- categories with more back-and-forth before confirming time

7.3 Request booking user flow
When request booking is available, user can:
- join waitlist
- suggest a time window
- request a suitable slot even when no open slot is shown

7.4 Professional actions in request booking flow
Professional can:
- accept request with proposed slot
- reject request
- propose alternative time

7.5 Request booking offer expiration
Final decision:
- Once the professional offers a concrete slot, it is reserved for 24 hours.
- If the user does not complete payment in 24 hours, the offer expires and the slot is released.

7.6 Direct payment link for request booking
Final decision:
- Once a request booking proposal is accepted or offered, the user receives a direct payment link for that exact proposal.

This proposal-specific link must already contain:
- professional
- service
- duration
- proposed slot
- price

What this means
- User does not need to rebuild the booking manually.
- Conversion improves.

Technical requirements
- request_booking entity
- proposal entity or embedded proposal state
- proposal expiration timestamp
- payment link generation tied to locked proposal details

Implementation notes
- Request booking should not become a second-class manual workflow outside the system.
- It needs proper objects and statuses.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Keep domain models explicit, typed, and auditable.
- Keep transitions deterministic and prevent illegal state changes.
- Keep role-based UI/status mapping clear without leaking internal complexity.
- Keep implementation modular and maintainable for lean operations.

--------------------------------------------------------------------
SECTION 8 — SLOT HOLDING, CHECKOUT PENDING, CHECKOUT RECOVERY
--------------------------------------------------------------------

8.1 Short hold during checkout
Final decision:
- When a user starts checkout on a slot, the slot should be held for a short period by Muuday logic.
- If payment confirms, booking is created.
- If payment fails or the hold expires, slot is released.

The exact hold duration is a platform rule, not a Stripe-native scheduling feature.

8.2 Booking exists only after successful payment confirmation
A slot selection alone is not a confirmed reservation.
The platform must treat unpaid holds as temporary, not real bookings.

8.3 Recovery after abandoned or expired checkout
Final decision:
- If checkout expires or is abandoned, user may receive a recovery link.
- However, the original slot is not reserved indefinitely.
- If the user returns later and the original slot is gone, Muuday must redirect the user to alternatives with the same professional/service/duration when possible.

8.4 Why this matters
This protects:
- inventory efficiency
- conversion recovery
- booking clarity

Technical requirements
- slot_hold object or equivalent temporary reservation logic
- expiration job / scheduler
- recovery path from expired checkout
- revalidation of slot availability on recovery

Implementation notes
- Do not confuse checkout session lifecycle with booking inventory lifecycle.
- They are related but not identical.

--------------------------------------------------------------------
SECTION 9 — BOOKING STATE MACHINE
--------------------------------------------------------------------

9.1 Final decision
Muuday must have a detailed internal booking state machine and a simplified user-facing UI layer.

9.2 Example internal booking states
The exact naming can vary, but the system should support the equivalent of:
- draft
- slot_held
- pending_payment
- pending_professional_acceptance
- confirmed
- declined_by_professional
- expired
- canceled_by_user
- canceled_by_professional
- rescheduled
- completed
- no_show_user
- no_show_professional
- disputed
- partially_refunded
- fully_refunded

9.3 Example simplified UI states
User/professional-facing UI can simplify to:
- Pending
- Confirmed
- Rescheduled
- Cancelled
- Completed
- In dispute
- Refunded

9.4 Why this matters
A detailed internal state machine is necessary for:
- automations
- payment hooks
- refunds
- payouts later
- notifications
- admin cases
- analytics
- debugging

Technical requirements
- enum or state machine implementation
- allowed transitions map
- event log / timeline generation
- role-based display transformation layer

Implementation notes
- State machine should be explicit, not implicit through ad hoc flags.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Keep domain models explicit, typed, and auditable.
- Keep transitions deterministic and prevent illegal state changes.
- Keep role-based UI/status mapping clear without leaking internal complexity.
- Keep implementation modular and maintainable for lean operations.

--------------------------------------------------------------------
SECTION 10 — BOOKING DETAIL PAGE AND TIMELINE
--------------------------------------------------------------------

10.1 Booking detail actions
Final decision:
- When allowed, both Cancel and Reschedule should be clearly visible from the booking detail area.
- Do not hide cancellation to manipulate retention.

10.2 Booking timeline
Final decision:
- Every booking should have a simple timeline of key events.

Minimum timeline events:
- booking created
- payment confirmed
- professional confirmed, if relevant
- reminder sent
- session completed / canceled / rescheduled
- refund issued
- payout eligible / payout sent, where relevant on professional/admin side

What this means
- Users get better clarity.
- Professionals understand what happened.
- Admin can support with less ambiguity.

Technical requirements
- event log table or timeline events model
- display layer by role

Implementation notes
- Timeline does not need to expose every low-level internal event in the MVP.

--------------------------------------------------------------------
SECTION 11 — RESCHEDULING, CANCELLATION INPUTS, AND PRICE FREEZE AT BOOKING LAYER
--------------------------------------------------------------------

11.1 Rescheduling financial logic at booking layer
Final decision:
- If same professional, same service, same duration: payment stays attached to the booking.
- If service, duration, price, or professional changes materially: treat as new booking or financial adjustment flow later.

11.2 Rescheduling reason capture
Final decision:
- cancellation requires a reason
- rescheduling reason is lighter / optional

Use cases of reasons:
- product analytics
- dispute context
- support
- quality measurement

11.3 Cancellation reason capture
Cancellation reason should be mandatory with:
- short reason list
- optional free text

11.4 Price freeze
Already covered earlier:
- booked price is fixed at purchase time
- future service price changes do not alter existing bookings

Technical requirements
- cancellation_reason and reschedule_reason fields or linked event objects
- booking snapshot fields for service title, price, duration, timezone, policies

--------------------------------------------------------------------
SECTION 12 — REBOOKING AND FAVORITE-ADJACENT BEHAVIOR IN BOOKING LAYER
--------------------------------------------------------------------

12.1 Rebooking final decision
- User can click “book again.”
- System pre-fills professional, service, and duration.
- User then selects a new slot and completes payment.
- For recurring-eligible relationships, system may suggest prior schedule patterns.

12.2 Why this matters
This increases:
- retention
- repeat purchase speed
- convenience for returning users

Technical requirements
- reusable booking-intent payload generated from prior booking
- service still valid check
- prefill compatibility guard if service changed

--------------------------------------------------------------------
SECTION 13 — RECURRING BOOKING MECHANICS AT THE SCHEDULING LAYER
--------------------------------------------------------------------

Important note
This section covers recurring booking and slot mechanics. The financial treatment of renewal, monthly charging, payout splitting, and failed renewal accounting belongs to Part 3.

13.1 Recurring services begin with service-defined logic
Final decision:
- Professionals can define, per service, whether a service is one-off, one-off plus recurring, or monthly subscription-style.
- The platform must not force one recurring model across all professionals.

13.2 How recurring schedule should be structured
Final decision:
- Recurrence means: same day of the week, same time slot, repeating.
- The user (client) chooses the periodicity at checkout: every week, every 2 weeks, every 3 weeks, monthly, or custom interval in days.
- The user chooses how long the recurrence lasts: by number of occurrences or by end date, constrained by the professional's booking window (tier-based: Basic 60d, Professional 90d, Premium 180d).
- The system replicates slots within the professional's available booking window.
- If a recurring slot falls on a blocked/unavailable day, the system notifies both parties to reschedule that specific occurrence.
- Each recurring booking is an individual booking linked by a recurrence_group_id — each can be independently cancelled or rescheduled.
- Within rules, the user can reschedule individual sessions.

This means:
- recurring service starts with a stable schedule structure chosen by the user
- not a pure “book ad hoc every week” mess
- periodicity is user-driven, not fixed by the professional

13.2.1 Multiple bookings (non-recurring batch)
- Users can select several non-recurring dates in a single checkout for the same service and professional.
- Dates do not need to be the same day of the week.
- All selected slots are booked and paid in one transaction.
- Each booking within the batch is an independent booking — can be individually cancelled or rescheduled.
- Available to all tiers.

13.3 Next-cycle reserved slots
Final decision:
- For recurring monthly plans, next-cycle slots can appear as planned/reserved for that customer.
- Nobody else can take those slots while reserved.
- But they become financially confirmed only when the renewal payment succeeds.

13.4 Release rule for next-cycle reserved slots
Final decision:
- If the renewal is not paid, those reserved slots stay held until 7 days before the first session of the new cycle.
- After that, they are released automatically.

13.5 If payment arrives after release
Final decision:
- Platform attempts to restore the same slots if still available.
- Otherwise offer alternatives.

13.6 Changing recurring default slot pattern
Final decision:
- Changes to recurring fixed slots apply only to the next cycle.
- They must be requested at least 7 days before the first session of the next cycle.
- New slots are guaranteed only if available.

13.7 Client pause of recurring plan at the scheduling layer
Final decision:
- Client may request a pause for one cycle.
- Default request deadline: 7 days before renewal.
- After that, only if professional accepts manually.
- Professional must accept the pause request.
- If accepted, future cycle slots are not financially confirmed.

13.8 If professional refuses pause
Final decision:
- User can negotiate.
- If no agreement, user can disable auto-renew so the plan ends at cycle end.

13.9 One missed session within recurring cycle
Final decision:
- If user cancels within rules, they can reschedule within the same cycle if availability exists.
- If not used within the cycle, it expires.
- No-show loses the session.
- No automatic partial refund for a single missed session inside the plan.

13.10 If professional cancels one session within recurring cycle
Final decision:
- Client should get priority for a replacement when possible.
- Professional does not receive payout for that canceled session.
- Repeated occurrences should flag the professional but not be treated as an extreme violation on first occurrence.

13.11 If long-term professional unavailability affects recurring plan
Final decision:
- Unused future sessions should be refunded.
- The plan is tied to that professional; there is no automatic transfer to another one.

13.12 No switching professional inside the same plan
Final decision:
- If the user wants another professional, the current relationship ends and a new one begins.

Technical requirements for recurring scheduling
- recurring_schedule object with: day_of_week, time, periodicity (weekly/biweekly/monthly/custom_days), start_date, end_date_or_count
- recurrence_group_id linking individual bookings within a recurrence
- reserved_future_slot states separate from financially confirmed sessions
- recurrence template logic
- batch_booking_group_id for multiple bookings (non-recurring batch checkout)
- conflict detection when recurring slot overlaps with blocked time or existing booking
- slot release scheduler tied to renewal status
- recurring pause request workflow

Implementation notes
- Keep booking/scheduling state separate from financial billing state.
- They must communicate, but should not be collapsed into one brittle object.

AI coder instructions
Unified instructions for any AI coding/design/system assistant
- Keep domain models explicit, typed, and auditable.
- Keep transitions deterministic and prevent illegal state changes.
- Keep role-based UI/status mapping clear without leaking internal complexity.
- Keep implementation modular and maintainable for lean operations.

--------------------------------------------------------------------
SECTION 14 � SESSION EXECUTION RULES AT A HIGH LEVEL (AGORA LOCKED)
--------------------------------------------------------------------

Important note
Provider decision is locked to Agora for the current roadmap. This section captures the booking-layer rules required regardless of future provider changes.

14.1 Join timing rule
Final decision:
- Session join becomes available only near the start time.
- Earlier than that, the UI must show “not available yet” or equivalent.

14.2 Presence evidence rule
Final decision:
- The system records who entered, when they entered, and how long they stayed.
- If the other party does not appear within the no-show threshold, these logs become strong evidence but not automatic final judgment in every case.

14.3 Late and no-show threshold
Final decision:
- 15-minute threshold.
- The terms must explicitly state that if the user is late, that delay counts as time already consumed and does not automatically extend the session.

14.4 If session ends early
Final decision:
- No automatic payout or refund adjustment.
- Duration is tracked, but changes require review or complaint.

14.5 Platform technical failure
Final decision:
- If failure is clearly Muuday/platform-caused and blocks the session, user gets priority reschedule or refund and professional is not penalized.
- If the failure is clearly user-side or professional-side, normal rules apply.
- Gray cases go to admin review.

14.6 Screen sharing
Final decision:
- Allowed in MVP.

Implementation note
- Full provider-specific implementation guidance is deferred.

--------------------------------------------------------------------
SECTION 15 — WHAT USERS, PROFESSIONALS, ADMINS, AND SYSTEM MUST DO IN THIS PART
--------------------------------------------------------------------

15.1 User-side minimum product responsibilities
The user experience must allow the user to:
- discover a professional profile
- understand services and pricing
- preview availability
- choose service and duration before real slot selection
- review final booking details including timezone and cancellation policy
- complete payment
- understand whether the booking is pending or confirmed
- cancel or reschedule where allowed
- add booking to calendar
- message professional
- use rebooking
- understand recurring slot rules if relevant

15.2 Professional-side minimum product responsibilities
The professional experience must allow the professional to:
- complete guided onboarding
- choose taxonomy position correctly
- create clear services
- configure availability
- choose auto-accept or manual-accept
- respond to request bookings and pending manual bookings
- understand publication blockers and first-booking blockers
- manage recurring schedule logic where applicable
- see booking timeline and status

15.3 Admin-side minimum product responsibilities
Admin tools must allow the admin to:
- review first-time go-live submissions
- approve or request changes
- inspect booking timeline
- inspect booking state
- inspect request booking flows
- understand pending acceptance and expiration situations
- support recurring scheduling edge cases
- inspect timezone and calendar context when needed

15.4 System/backend minimum responsibilities
The system must:
- support explicit onboarding state tracking
- enforce profile/publication/first-booking gates
- support structured service models
- generate valid service-based slot availability
- hold slots temporarily during checkout
- release slots when needed
- support manual and auto acceptance modes
- support request booking lifecycle
- maintain a detailed internal booking state machine
- support recurring schedule reservation logic independent of later billing detail
- maintain timezone-safe behavior
- record booking events for timeline and later analytics

--------------------------------------------------------------------
SECTION 16 — CORE TECHNICAL REQUIREMENTS FOR THIS PART
--------------------------------------------------------------------

16.1 Data model domains that must exist
At minimum, the system should conceptually include entities or equivalent models for:
- user
- professional
- professional_plan
- onboarding_progress
- professional_profile
- service
- service_option or duration option
- availability_rule
- availability_exception / blocked_time
- booking
- booking_event / timeline event
- slot_hold
- request_booking
- request_booking_proposal
- recurring_schedule_template
- recurring_reserved_slot / future cycle reservation
- review_policy_acceptance snapshot or equivalent booking-terms snapshot

16.2 Booking snapshot requirements
Each booking should store a snapshot of:
- professional name at booking time
- service name at booking time
- duration at booking time
- price at booking time
- timezone context at booking time
- cancellation/no-show policy version at booking time
- service type at booking time

16.3 Availability engine requirements
The availability engine must support:
- service-aware duration handling
- minimum notice enforcement
- booking window enforcement per tier
- buffer handling
- temporary holds
- calendar conflict checking on professional side
- timezone-safe slot generation

16.4 State machine requirements
The booking state machine must:
- prevent illegal transitions
- expose simplified UI statuses
- generate timeline events
- integrate with acceptance mode, request booking, reschedule, cancel, and completion logic

16.5 Calendar requirements
Professional-side calendar sync should:
- reduce double booking
- support reading busy blocks
- preserve booking source-of-truth inside Muuday

User-side calendar output should:
- generate add-to-calendar actions
- not become the booking source-of-truth

16.6 Recurring scheduling requirements
Recurring scheduling logic must support:
- default fixed slot patterns
- next-cycle reservation states
- release deadlines
- pause-request handling at the schedule layer
- changing next-cycle slots before deadline

--------------------------------------------------------------------
SECTION 17 — IMPLEMENTATION NOTES FOR PRODUCT/ENGINEERING
--------------------------------------------------------------------

17.1 Keep profile publication and booking eligibility separate
This is one of the most important structural choices in the system. It should not be merged into one boolean.

17.2 Treat services as first-class, structured objects
Do not model professional offers as plain text blobs.

17.3 Make availability service-aware
Avoid simplistic availability that ignores duration/service differences.

17.4 Keep booking inventory and payment lifecycle related but separate
A slot hold is not a confirmed booking. A checkout session is not the same as inventory reservation. A recurring planned slot is not always a financially confirmed session.

17.5 Keep recurring schedule logic separate from billing logic
The schedule system and the billing system must communicate, but should not be collapsed into one fragile object.

17.6 Make all deadline-based rules explicit
This includes:
- manual accept deadline
- request booking proposal expiration
- recurring slot release deadline
- change recurring slot deadline
- pause request deadline

17.7 Use deterministic rule engines where possible
For onboarding completeness, booking eligibility, and visibility states, deterministic rules are better than vague heuristics.

--------------------------------------------------------------------
SECTION 18 - AI-AGNOSTIC BUILD INSTRUCTIONS FOR THIS PART
--------------------------------------------------------------------

18.1 Unified instructions for any AI coding/design/system assistant
- Build onboarding as a real multi-step stateful flow with persisted progress.
- Keep profile publication eligibility separate from first-booking eligibility.
- Model services as structured entities with explicit service_type and settings.
- Build service-aware availability and slot generation logic.
- Use explicit, typed state transitions for booking and request-booking flows.
- Use UTC canonical storage and convert at view boundaries only.
- Keep role-aware timeline rendering for user/professional/admin.
- Keep route guards explicit by account type (user, professional, admin, public).

18.2 Session abstraction directives
- Build a provider-agnostic session abstraction first.
- Do not hardwire Agora event names directly into core booking logic.
- Implement booking/session boundary as clean interfaces.
- Use provider-adapter boundaries and scaffold:
  - SessionProvider interface
  - AgoraProvider implementation stub
  - ProviderFallback implementation stub

18.3 AI-assisted delivery checklist
Use the AI assistant to support:
- system design
- state machine refinement
- webhook modeling
- edge-case mapping
- sequence diagrams
- session lifecycle diagrams
- no-show evidence matrix
- waiting-room logic
- provider abstraction design
- failure handling flows
- provider adapter implementation
- session UI states
- event handling
- booking/session timeline rendering
- permission and error states
- admin/support flow generation
- alternative provider decision trees

18.4 Delivery quality requirements
- prioritize auditability and traceability over UI complexity
- keep implementation modular and maintainable
- prefer cost-effective, low-complexity solutions suitable for lean teams
SECTION 19 — WHAT IS DEFERRED TO LATER PARTS
--------------------------------------------------------------------

The following are intentionally not finalized in this part and will be covered later:
- Stripe funds flow architecture
- Connect account selection details
- fees, application fees, and split logic
- payout schedule mechanics and minimum balances
- refund accounting logic
- dispute ledger treatment
- monthly plan billing mechanics
- failed renewal financial outcomes
- notifications detail beyond what is booking-relevant here
- admin case queue operational design
- final video provider lock-in and provider-specific implementation

--------------------------------------------------------------------
SECTION 20 — FUTURE CONSIDERATIONS (DO NOT IMPLEMENT NOW)
--------------------------------------------------------------------

These are not MVP instructions. They are later-phase ideas that should be reconsidered after the core system works.

- richer service comparison UI on professional profiles
- deeper user calendar sync beyond links/ICS
- more advanced recurring package configurations
- more automated provider-selection logic for video
- finer-grained session instrumentation in UI
- more advanced admin tools around recurring exceptions
- more sophisticated booking-eligibility scoring
- additional automation around suggested alternatives when slots are unavailable

End of Part 2.

