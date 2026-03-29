MUUDAY - PART 5
VIDEO / SESSION EXECUTION, COMPLIANCE FRAMEWORK, OPEN VALIDATIONS, PHASE-2 THINKING, AND FINAL CONSOLIDATION GUIDE

IMPORTANT POSITIONING OF THIS FILE
This is Part 5 of 5. It is intentionally written as the final decision and validation layer on top of the previous four files.

Part 1 covered foundations, taxonomy, tiers, search, discovery, trust signals, and review philosophy.
Part 2 covered professional onboarding, availability, calendar logic, booking flow, request booking, and the booking lifecycle.
Part 3 covered payments, billing, Stripe / Connect / Billing, refunds, payouts, revenue logic, and ledger / finance structure.
Part 4 covered admin operations, trust and safety, disputes, moderation, notifications, and analytics.
Part 5 covers the things that were deliberately left either provisional, external, or best decided later in implementation sequence:
1. video/session execution,
2. sensitive-category disclaimers and compliance framing,
3. the exact external validations that still need to happen before the architecture is fully frozen,
4. what should be thought through later but not built yet,
5. how to consolidate the five files into one master product and implementation spec.

This document is intentionally detailed and explicit. Nothing here should be assumed to be implied by another part unless stated explicitly.

=====================================================================
SECTION 1 - EXECUTIVE SUMMARY OF WHAT IS ALREADY DECIDED VS WHAT REMAINS PROVISIONAL
=====================================================================

1.1 WHAT IS ALREADY DECIDED ENOUGH TO BUILD AROUND
The following items are already sufficiently defined across the five-part package and should be treated as product decisions, not open brainstorming:

A. Marketplace structure
- Muuday is a marketplace connecting users and professionals.
- The professional side has three tiers: Basic, Professional, Premium.
- Discovery, ranking, booking windows, service limits, tags, specialties, and promotional tools vary by tier.

B. Booking model
- Users can book one-off, recurring, and monthly services.
- Request booking exists for Professional and Premium, but not for Basic.
- Professionals can choose auto-accept or manual-accept.
- If manual-accept is enabled, the professional has 48 hours to accept or reject.
- Booking uses a detailed internal state machine but simplified UI statuses.

C. Payment and revenue model
- Muuday charges the user and later pays the professional.
- Separate charges and transfers is the preferred Stripe funds flow.
- Professional subscription billing exists, with 3 months free and then card billing.
- Payout eligibility starts 48 hours after the session ends, unless there is a dispute.
- Payout is weekly and requires a minimum of R$100.

D. Search and discovery
- Search is taxonomy-led but supports free text.
- Tags do not act as filters, but they do affect search matching.
- Default search sort is relevance, with user-visible sort options for relevance, price, rating, and next availability.
- Cards are rich but clean; price appears in the user’s chosen currency.

E. Review and trust model
- One public review per client-professional pair.
- That review can be updated after future sessions.
- Professional can post one public response, and update that response if the client edits the review.
- Private feedback to Muuday exists separately.

1.2 WHAT IS STILL PROVISIONAL BY DESIGN
The following items are intentionally not frozen as hard implementation choices yet:

A. Final video provider selection
- Preferred target: embedded video with LiveKit.
- Fallback: automatic Google Meet link per booking.
- Reason for deferral: this can be left until later in implementation, once product, cost, and speed-to-launch priorities are clearer.

B. Final Stripe corridor validation for UK-platform-to-Brazil professional payouts
- This is the biggest external validation item.
- Product logic is clear; corridor support and the exact Stripe-supported structure must still be confirmed.

C. Final legal wording for sensitive categories and cross-border service positioning
- Product principles are set.
- Final enforceable language still needs legal / compliance review.

These are not gaps in the product concept. They are validation items, wording items, and architecture choice items.

=====================================================================
SECTION 2 - VIDEO AND SESSION EXECUTION STRATEGY
=====================================================================

2.1 DECISION STATUS
Current strategic decision:
- Preferred direction: embedded video / session experience using LiveKit.
- Fallback direction: Google Meet link automatically generated per booking.
- Implementation sequencing decision: leave the final provider choice until later in the build.

This means the product should be designed around a provider-agnostic session abstraction so that Muuday does not hard-couple business logic to a single call provider too early.

2.2 WHY VIDEO WAS DELIBERATELY LEFT LATER
The reason to leave video later is not because it is unimportant. It is because it is one of the few areas where early product architecture can still remain flexible without harming the rest of the platform.

Everything else in Muuday already depends on well-defined objects:
- professional,
- service,
- booking,
- schedule,
- payment,
- payout,
- state machine,
- notifications,
- disputes,
- review,
- case handling.

Video should plug into that system, not force the shape of it.

This is especially important because:
- LiveKit gives a better owned experience, but is more technical.
- Google Meet gives a faster path and lower operational burden.
- The platform must be able to survive either path.

2.3 MUUDAY SESSION MODEL - PROVIDER AGNOSTIC CONCEPT
Regardless of provider, the booking system should conceptually create a “session room” abstraction.

Every session room should have:
- session_room_id
- booking_id
- provider_type (livekit / google_meet / future_provider)
- session_status (not_ready / join_open / in_progress / ended / failed)
- scheduled_start_at_utc
- scheduled_end_at_utc
- join_opens_at_utc
- join_closes_at_utc (optional)
- client_joined_at
- professional_joined_at
- actual_started_at
- actual_ended_at
- failure_reason (if any)
- provider_room_reference
- provider_join_url_user (if provider uses URL entry)
- provider_join_url_professional (if provider uses role-based URL)
- audit metadata

This abstraction allows the booking flow, reminders, no-show logic, disputes, and analytics to remain stable even if the provider changes.

2.4 PRODUCT RULES FOR SESSION ENTRY ALREADY DECIDED
The following video/session rules are already decided:

A. Session provider direction
- Preferred: embedded LiveKit.
- Fallback: Google Meet link.

B. Entry timing
- Join becomes available only near the scheduled session time.
- Earlier than that, the user sees a “not available yet” state.

C. Waiting room / lobby
- The user enters a waiting room / lobby.
- The professional enters and the session effectively begins.
- System must separately log lobby entry and session start.

D. No-show evidence model
- The system must record:
  - who joined,
  - when they joined,
  - how long they stayed.
- If the other party never arrives, that becomes strong evidence, but not an absolute automated ruling in every case.

E. Grace window for lateness / no-show
- 15-minute window.
- If one side does not arrive within 15 minutes, that becomes strong evidence of no-show.
- Terms must explicitly state that if the client is late, the time counts as time already consumed from the session.

F. Screen sharing
- Screen sharing is allowed in the MVP.

G. No visible session countdown timer in the UI
- Muuday does not need to show an explicit countdown or time-left widget.
- But the system must still track timing internally.

H. Early session end does not auto-change payout/refund
- If the session ends early, that alone should not automatically change payout or refund.
- It remains evidence for manual review if needed.

I. Platform technical failure handling
- If the session fails due to Muuday/platform/provider failure, the user gets refund or priority rebooking and the professional is not penalized.

2.5 LIVEKIT PATH - WHY IT IS THE PREFERRED TARGET
If Muuday goes embedded, LiveKit is a strong fit because it gives:
- room-based real-time communication,
- role-based token access,
- web and mobile SDK support,
- event handling for join/leave,
- more ownership over the full in-product session experience,
- better future extensibility for screen share, in-session metadata, possible future data features, and deep platform analytics.

In plain language, LiveKit is the “owned product experience” path.

Advantages for Muuday:
- Keeps the user inside the platform.
- Better control over waiting room / join states.
- Better event visibility for no-show and dispute evidence.
- More natural integration with booking timeline and session status.
- Better long-term path if Muuday later adds premium in-session tools.

Disadvantages for Muuday:
- More technical work.
- Requires token server and provider integration logic.
- Requires more QA across browsers / mobile.
- Higher implementation complexity than a simple link-based approach.

2.6 GOOGLE MEET PATH - WHY IT IS THE RIGHT FALLBACK
If Muuday decides not to embed video in the first implementation wave, Google Meet is the most rational fallback because:
- it removes most WebRTC ownership burden,
- users already understand it,
- professionals are likely already comfortable with it,
- it is cheaper and simpler operationally,
- it greatly reduces platform-side support complexity.

Advantages for Muuday:
- fastest to launch,
- low technical complexity,
- low real-time infrastructure responsibility,
- simpler browser/mobile support,
- clearer operational behavior.

Disadvantages for Muuday:
- weaker owned product experience,
- weaker in-product control,
- weaker room state and join telemetry,
- more fragmented user journey,
- less “premium platform” feel.

2.7 PROVIDER DECISION FRAMEWORK - HOW TO DECIDE LATER
When it is time to make the final decision, use this scoring framework.

Questions:
1. Is the team optimizing for fastest launch or strongest owned UX?
2. Is building embedded session experience worth delaying launch by several weeks?
3. Is the future value of in-session control high enough to justify added complexity?
4. Are disputes / no-show evidence likely to benefit materially from embedded telemetry?
5. Is the expected category mix heavily consultation-based, screen-share-heavy, and repetition-heavy?
6. Does the team want the call to feel like “the Muuday product” or simply “a good session attached to the marketplace”?

If the answers lean heavily toward speed, simplicity, and cost-efficiency:
- choose Google Meet first.

If the answers lean heavily toward ownership, control, premium UX, and future extensibility:
- choose LiveKit first.

2.8 USER-SIDE TECHNICAL REQUIREMENTS FOR SESSION EXECUTION
Regardless of provider, the user-side product must support:
- booking detail page with join state,
- “not yet available” state,
- lobby / waiting state,
- join CTA when allowed,
- session problem CTA,
- post-session next actions,
- session timeline visibility,
- no-show and issue reporting,
- rebooking / refund / support follow-up if the session fails.

If LiveKit is used, user-side implementation must additionally support:
- provider-specific secure join token retrieval,
- media permissions prompts,
- camera/mic state handling,
- lobby state rendering,
- join failure recovery,
- reconnect handling,
- leave / session ended behavior,
- screen sharing view behavior if the user is the receiver.

If Google Meet is used, user-side implementation must support:
- join link display,
- copy/open actions,
- reminder links,
- “open externally” flow,
- fallback instructions if the provider session is not accessible.

2.9 PROFESSIONAL-SIDE TECHNICAL REQUIREMENTS FOR SESSION EXECUTION
Professional-facing behavior must support:
- session schedule visibility,
- join state and availability state,
- lobby/room entry,
- documentation of join time,
- visibility into whether the client has arrived,
- session issue reporting,
- no-show reporting,
- strong ties between session record and booking record.

If LiveKit is used, professional-side implementation must support:
- provider-specific role token,
- professional join flow,
- screen sharing initiation,
- session start event logging,
- session issue reporting tied to room status.

If Google Meet is used, professional-side implementation must support:
- automatic access to the generated Meet link,
- copy/open actions,
- session problem reporting tied to the booking.

2.10 ADMIN-SIDE TECHNICAL REQUIREMENTS FOR SESSION EXECUTION
Admin should not need full video moderation in the MVP, but admin must have operational visibility into session metadata.

Admin needs to see:
- provider type,
- scheduled start and end,
- actual join times,
- whether user joined,
- whether professional joined,
- whether a failure was logged,
- whether a dispute references this session,
- relevant session timeline entries.

Admin should be able to use this for:
- no-show review,
- technical issue review,
- refunds and payout decisions,
- support responses.

2.11 BACKEND / SYSTEM TECHNICAL REQUIREMENTS FOR SESSION EXECUTION
System requirements regardless of provider:
- provider-agnostic session room model,
- session lifecycle event logging,
- booking-to-session linkage,
- secure provider credential handling,
- session start eligibility logic,
- session entry time window enforcement,
- no-show evidence logs,
- provider error logging,
- timeline event emission,
- analytics events.

If LiveKit is used, system additionally needs:
- room creation or reusable room logic,
- access token generation,
- role-based grants,
- webhook/event processing,
- reconciliation between provider events and internal booking states.

If Google Meet is used, system additionally needs:
- automated Meet link creation tied to booking,
- link storage,
- link distribution,
- booking cancellation / reschedule behavior that updates or invalidates links as needed.

2.12 RECOMMENDED SESSION EVENTS TO TRACK
Regardless of provider, Muuday should track at minimum:
- session_join_available
- session_join_attempted_user
- session_join_attempted_professional
- session_joined_user
- session_joined_professional
- session_waiting_room_entered_user
- session_started
- session_ended
- session_failed
- session_problem_reported
- session_no_show_flagged_user
- session_no_show_flagged_professional

These should map to both analytics and the internal booking timeline.

2.13 IMPLEMENTATION NOTES FOR VIDEO / SESSION EXECUTION
Implementation note 1:
Do not let provider-specific concepts leak into core booking logic. The booking system should not require LiveKit concepts in order to function.

Implementation note 2:
Treat video session provider as an adapter layer. That means the booking system asks for:
- create_session_room
- open_join_window
- get_join_payload_for_user
- get_join_payload_for_professional
- handle_provider_event
- close_session

Implementation note 3:
Support a temporary no-video mode even if the product target is LiveKit. This gives the platform resilience if the provider decision changes late.

Implementation note 4:
Provider selection should not block delivery of search, booking, payments, payouts, notifications, reviews, and admin operations.

2.14 AI CODER INSTRUCTIONS - VIDEO / SESSION EXECUTION

FOR CODEX
- Build a provider-agnostic session abstraction first.
- Do not hardwire LiveKit event names into core booking logic.
- Implement the booking/session boundary as clean interfaces.
- Prioritize state logging and auditability over fancy UI behavior.
- If provider decision remains open, scaffold both:
  - SessionProvider interface,
  - LiveKitProvider implementation stub,
  - GoogleMeetProvider implementation stub.

FOR CLAUDE
- Use Claude for system design, state machine refinement, webhook modeling, edge-case mapping, and sequence diagrams.
- Ask Claude to produce:
  - session lifecycle diagrams,
  - no-show evidence matrix,
  - waiting-room logic,
  - provider abstraction design,
  - failure handling flows.

FOR CURSOR
- Use Cursor for implementing the provider adapter, session UI states, event handling, and component-level work.
- Good use cases:
  - building booking detail session states,
  - wiring provider join actions,
  - implementing timeline event rendering,
  - handling permission and error states.

FOR ANTIGRAVITY
- Use Antigravity if it is being used more as a product/design or parallel coding assistant for flow generation, UI ideas, or architecture prompting.
- Best use here:
  - UI flow variants for session join states,
  - edge case maps,
  - alternative provider decision trees,
  - prompt-driven generation of support/admin flows.

2.15 COST-EFFECTIVE TOOLING PREFERENCE FOR THIS LAYER
Because Muuday wants to stay cost-effective and avoid giant complexity, the recommendation is:
- keep session logic abstraction simple,
- do not build custom video infra from scratch,
- only own as much real-time complexity as the product truly benefits from.

Practical reading of that:
- If the team is resource-constrained, Google Meet is the cheapest and simplest path.
- If the team can absorb more complexity and believes in premium owned UX, LiveKit is a rational next step.

=====================================================================
SECTION 3 - SENSITIVE CATEGORY COMPLIANCE FRAMEWORK AND DISCLAIMER SYSTEM
=====================================================================

3.1 WHY THIS MATTERS
Muuday is especially exposed in categories that can sound regulated, clinical, jurisdiction-bound, or professionally restricted. The problem is not just whether a professional has a credential. The real issue is how the platform positions the service and what the user thinks they are buying.

The product must not accidentally present restricted services as if they are fully regulated cross-border services when they are actually closer to:
- consultation,
- orientation,
- advice,
- informational support,
- non-diagnostic guidance,
- second-opinion style input,
- document review,
- coaching, depending on category.

3.2 CORE COMPLIANCE PRINCIPLE
Muuday must define service scope through:
1. category naming,
2. subcategory naming,
3. specialty naming,
4. profile copy,
5. service copy,
6. badge logic,
7. profile disclaimers,
8. checkout disclaimers,
9. terms of use,
10. admin review rules.

This must be coherent across the whole system. It is not enough to hide a disclaimer in the terms.

3.3 DECISIONS ALREADY MADE ABOUT SENSITIVE CATEGORIES
The following are already decided:
- categories that are sensitive can have credential upload and manual review,
- verification can exist,
- the platform must make clear when the service is consultative / informational and not a local regulated act,
- this distinction must be reflected in product wording, terms, and admin review,
- disclaimers should appear both on the profile and in checkout,
- the badge does not become a search filter in the MVP.

3.4 PRACTICAL POSITIONING RULE FOR SENSITIVE CATEGORIES
Muuday should not lazily position every sensitive professional as if they were performing the fully regulated form of the profession globally.

Example logic:
- “consultor médico” or “medical consultant” may be safer product language than implying the platform offers full medical treatment / prescriptive care across jurisdictions.
- “health guidance” or “second-opinion style orientation” may be safer than implying direct clinical treatment if that is not legally supported.
- “tax consultant for expats” may be safer than implying licensed local tax filing authority in every possible jurisdiction unless that is true.

This must be category-specific and professionally reviewed later, but the product principle is already set.

3.5 PROFILE-LEVEL DISCLAIMER REQUIREMENTS
For sensitive categories, the profile page should show a concise, human-readable disclaimer.

It should clarify, when applicable:
- the service is informational / consultative in nature,
- it does not replace local regulated care or legally required local professional services,
- the professional does not automatically provide acts that require jurisdictional authorization,
- the user remains responsible for seeking local formal care, treatment, representation, or regulated services where applicable.

The profile-level disclaimer should be short enough not to destroy conversion, but clear enough not to mislead.

3.6 CHECKOUT-LEVEL DISCLAIMER REQUIREMENTS
Checkout must restate the crucial part more explicitly.

The checkout confirmation step should make the user acknowledge, when relevant:
- the scope of the service,
- that they are not purchasing restricted regulated acts unless explicitly supported,
- that cross-border legal/medical/regulated limitations may apply,
- that the platform is facilitating a service within the stated scope, not guaranteeing broader legal authority.

3.7 TERMS OF USE / PROFESSIONAL TERMS / PLATFORM RULES REQUIREMENTS
Muuday should have platform-level documentation that makes clear:
- what professionals may and may not claim,
- what professionals may and may not offer by category,
- how credentials may be displayed,
- how verification badges work,
- that verification by Muuday does not mean global regulatory authorization in every jurisdiction,
- that cross-border service scope may be limited,
- that professionals are responsible for complying with applicable laws for their services.

3.8 USER-SIDE TECHNICAL REQUIREMENTS FOR COMPLIANCE
User-facing product requirements:
- per-category disclaimer capability,
- per-service disclaimer capability,
- checkout acknowledgement logic tied to category,
- warning labels or notices in the profile UI,
- visible but non-overwhelming trust signals,
- ability to store which disclaimer version the user saw and accepted at checkout.

3.9 PROFESSIONAL-SIDE TECHNICAL REQUIREMENTS FOR COMPLIANCE
Professional-facing requirements:
- structured professional category selection,
- controlled taxonomy,
- credential upload flows for sensitive categories,
- ability to see why certain categories require extra review,
- restrictions on claims in bio/headline/service titles where necessary,
- visibility into verification status,
- ability to provide documents for review.

3.10 ADMIN-SIDE TECHNICAL REQUIREMENTS FOR COMPLIANCE
Admin must be able to:
- define which categories are sensitive,
- define which categories require extra disclaimers,
- define which categories require credential review,
- approve or reject uploaded credentials,
- flag risky copy or claims,
- override listing go-live for sensitive professions,
- maintain taxonomy wording and disclaimer copy.

3.11 BACKEND / SYSTEM REQUIREMENTS FOR COMPLIANCE
System requirements:
- category-level risk flags,
- disclaimer templates by category and service type,
- versioned disclaimer records,
- accepted_disclaimer_version stored per booking/payment,
- credential_review_status per professional/category,
- admin moderation queue for sensitive-category onboarding,
- restricted claim detection hooks (manual in MVP, automatable later).

3.12 IMPLEMENTATION NOTES FOR COMPLIANCE
Implementation note 1:
Do not rely on a single general disclaimer at the footer of the site. That is not enough.

Implementation note 2:
The most dangerous failure mode is mismatched language between:
- landing page,
- search card,
- profile,
- service title,
- checkout,
- terms.
These must be aligned.

Implementation note 3:
The platform should store evidence of which legal / disclaimer text was displayed and accepted during checkout for each booking.

Implementation note 4:
Sensitive-category admin review should be lightweight in the MVP but real. This is not something to fake.

3.13 AI CODER INSTRUCTIONS - COMPLIANCE / DISCLAIMER LAYER

FOR CODEX
- Build disclaimer handling as structured data, not hardcoded strings scattered across UI.
- Use a model like:
  - category_risk_profile,
  - disclaimer_template,
  - disclaimer_version,
  - booking_disclaimer_acceptance.
- Ensure each booking stores the version of disclaimer shown at checkout.

FOR CLAUDE
- Use Claude to draft category-specific disclaimer frameworks, admin review checklists, and risk wording variants.
- Claude is especially useful for:
  - turning product intent into policy language,
  - defining prohibited claims,
  - drafting structured onboarding review rules.

FOR CURSOR
- Use Cursor to implement:
  - disclaimer rendering components,
  - category-aware checkout warnings,
  - admin moderation UIs,
  - credential upload and review interfaces.

FOR ANTIGRAVITY
- Use Antigravity for category taxonomy wording experiments, disclaimer variants, and profile language ideation.
- It can help compare user-friendly copy vs stricter regulatory copy.

=====================================================================
SECTION 4 - FINAL EXTERNAL VALIDATIONS THAT STILL NEED TO HAPPEN BEFORE ARCHITECTURE FREEZE
=====================================================================

4.1 STRIPE UK PLATFORM -> BRAZIL PROFESSIONAL PAYOUT VALIDATION
This remains the single most important external validation item.

What is already decided conceptually:
- platform entity preference: UK,
- users can pay globally,
- professionals are mostly in Brazil,
- Muuday charges users and later pays professionals,
- Connect + Billing + separate charges and transfers is the preferred model.

What is not yet guaranteed:
- whether the exact UK-platform-to-Brazil payout corridor is supported in the needed way,
- whether Muuday qualifies for the right Stripe payout structure,
- what exact workaround or alternate flow Stripe recommends if not.

What to ask Stripe explicitly:
1. Can a UK-based platform process user payments and pay Brazilian professionals in the intended marketplace structure?
2. Does the platform qualify for the needed cross-border payout product / path?
3. What is the recommended Connect configuration for this corridor?
4. Is separate charges and transfers the right model for the corridor, or does Stripe recommend a different funds flow?
5. Are there restrictions on holding funds before payout in this scenario?
6. What is the recommended fallback structure if this exact corridor is not supported?

What to prepare before contacting Stripe:
- one-page architecture summary,
- corridor summary (user pays globally, professional receives in Brazil),
- professional country mix,
- entity structure (UK primary, possible Brazil entity fallback),
- payout timing rules,
- refund and dispute model,
- service types sold.

4.2 VIDEO PROVIDER VALIDATION
The provider choice is intentionally deferred, but before implementation freeze the team should validate:
- whether LiveKit covers the product’s exact MVP requirements without undue complexity,
- whether Google Meet would materially accelerate launch enough to justify weaker owned UX,
- whether embedded video is truly worth owning in the first release wave.

Validation checklist:
1. Do we need lobby + join-state telemetry in-product enough to justify embedded complexity?
2. Do we have the engineering bandwidth for tokenized room access and session-state handling?
3. Is the category mix screen-share-heavy enough to make embedded experience strategically important?
4. Is provider-agnostic abstraction already in place so that the decision can safely be delayed?

4.3 LEGAL / TERMS REVIEW VALIDATION
Before launch, Muuday should review:
- cancellation language,
- no-show language,
- lateness language,
- refund rules,
- recurring plan renewal / pause / cancellation rules,
- sensitive-category service scope,
- off-platform payment restrictions,
- review moderation policy,
- verification / badge language,
- subscription / trial language for professionals.

4.4 TAX / ACCOUNTING / INVOICING VALIDATION
Muuday already has product-level policy decisions, but before launch it still needs validation on:
- who issues what invoice or receipt in practice,
- what must be shown to customer vs professional,
- VAT / sales tax / service tax handling by entity and corridor,
- accounting treatment of held funds and transfers,
- annual plan accounting,
- referral / credit accounting.

=====================================================================
SECTION 5 - THINGS TO THINK ABOUT LATER, BUT NOT IMPLEMENT NOW
=====================================================================

This section is deliberately about “think later, do not build yet.”
These are not urgent MVP deliverables. They are strategic future considerations.

5.1 VIDEO / IN-SESSION EXPANSIONS
Think later about:
- in-session notes,
- AI summaries,
- in-session file area,
- recording (if ever appropriate),
- post-session deliverables,
- structured clinical / advisory notes,
- in-session text chat side panel,
- whiteboard/co-browsing,
- premium-only in-session tooling.

Do not implement now because:
- complexity is high,
- privacy/compliance burden increases,
- core marketplace mechanics matter more first.

5.2 SEARCH / DISCOVERY EXPANSIONS
Think later about:
- saved searches,
- dynamic recommendation modules,
- AI-assisted matching,
- query understanding and intent detection,
- semantic search tuning,
- better featured collection logic,
- SEO landing pages by need/problem,
- experimentation with ranking weights.

Do not implement now because:
- MVP should first validate category-market fit and basic demand.

5.3 PROFESSIONAL GROWTH / CRM TOOLS
Think later about:
- professional analytics dashboards,
- conversion funnel reporting for professionals,
- profile A/B tools,
- client reactivation campaigns,
- follow-up prompts,
- professional-side discount campaigns by segment,
- waitlist management tools,
- message templates,
- cancellation recovery flows.

Do not implement now because:
- they are powerful but not required to prove the core business.

5.4 ADVANCED BILLING / CREDIT MODELS
Think later about:
- wallet / stored credit,
- gift cards,
- bundled credits,
- session banks,
- multi-session packs with nuanced payout logic,
- pro-rated partial month recurring variations,
- advanced loyalty systems.

Do not implement now because:
- these add major complexity to ledger, refunds, and disputes.

5.5 ADVANCED TRUST & SAFETY
Think later about:
- automated claim detection,
- fraud scoring,
- risky-off-platform-conversation detection,
- automatic moderation heuristics,
- repeat no-show penalty automation,
- professional trust score.

Do not implement now because:
- manual process plus limited tooling is enough at first.

5.6 ADVANCED CALENDAR / SCHEDULING
Think later about:
- multiple calendars per professional,
- round-robin or team-based bookings,
- buffer logic by service type,
- vacation/OOO templates,
- recurring slot reservations with stronger automation,
- dynamic working-hours overrides.

Do not implement now because:
- you already have enough scheduling logic for an MVP.

5.7 PREMIUM PLAN EXPANSIONS TO THINK ABOUT LATER
Think later about:
- fidelity/minimum-term options in premium tiers,
- more advanced plan templates,
- custom branding blocks,
- featured placement purchasing,
- advanced request booking controls,
- annual professional plan upsell journeys,
- richer search optimization controls.

=====================================================================
SECTION 6 - CONSOLIDATION GUIDE: HOW TO MERGE ALL 5 FILES INTO ONE MASTER SPEC
=====================================================================

6.1 PREFERRED MASTER FILE STRUCTURE
If you later consolidate the five files into one master text spec, use this structure:

1. Executive summary
2. Product scope and principles
3. Taxonomy and discovery model
4. Professional plans / tiers
5. Professional onboarding and go-live
6. User journey and search journey
7. Booking lifecycle
8. Request booking and recurring logic
9. Payments architecture
10. Billing and professional subscription model
11. Refunds, disputes, no-show, and payout model
12. Reviews, badges, and trust signals
13. Admin operations and moderation
14. Notifications, inbox, and timeline
15. Video/session execution strategy
16. Sensitive-category compliance framework
17. Analytics and event tracking
18. Open validations before architecture freeze
19. Future considerations / not in MVP
20. Appendix: AI coder instructions by area

6.2 MERGE PRIORITY AND CONFLICT RULES
When consolidating, use these rules:

Rule 1:
Later refined decisions override earlier rougher wording.
Example:
- if an earlier section said “maybe A or C,” but a later question locked “C,” the final consolidated file must state only C.

Rule 2:
Keep provider-provisional decisions clearly marked as provisional.
Do not accidentally rewrite them as final if they were intentionally deferred.

Rule 3:
Taxonomy, pricing, tiers, booking, and payments should all use the same terminology everywhere.
Do not let the consolidated file use inconsistent names for the same object.

Rule 4:
For each major section, separate:
- user-side behavior,
- professional-side behavior,
- admin-side behavior,
- backend/system behavior.

Rule 5:
For each major decision, keep:
- product decision,
- reason,
- technical requirement,
- implementation note,
- AI coder instruction.

6.3 WHAT SHOULD DEFINITELY NOT BE LOST DURING CONSOLIDATION
Do not lose these important nuances:
- tags do not act as filters, but they do affect search.
- reviews are one per user-professional pair and updateable.
- manual-accept can take 48h.
- client lateness consumes session time.
- recurring next-cycle slots are reserved but not financially confirmed until renewal.
- video provider choice is intentionally deferred.
- sensitive categories must be framed as allowed scope, not broad implied authority.
- off-platform payment enforcement is strict but graduated.
- admin case handling exists in a structured way.
- payouts depend on post-session delay and dispute window.

=====================================================================
SECTION 7 - RECOMMENDED BUILD SEQUENCE AFTER THESE 5 FILES
=====================================================================

If the team is starting implementation after this package, the cleanest build sequence is:

Wave 1 - Foundations
- auth,
- professional onboarding,
- taxonomy,
- profile and service setup,
- search basics,
- cards and profile page,
- availability and scheduling base.

Wave 2 - Booking core
- booking state machine,
- direct booking,
- request booking,
- review screen,
- slot hold and checkout preparation,
- booking timeline.

Wave 3 - Payments core
- Stripe setup,
- user checkout,
- professional subscription billing,
- refund flows,
- payout eligibility logic,
- admin finance controls,
- ledger basics.

Wave 4 - Trust and admin
- reviews,
- badges,
- case queue,
- moderation,
- notifications,
- inbox,
- analytics.

Wave 5 - Session execution
- final video provider decision,
- session abstraction,
- provider adapter,
- join/lobby flow,
- session event tracking,
- no-show evidence integration.

This ordering preserves flexibility and avoids letting video complexity block the marketplace core.

=====================================================================
SECTION 8 - FINAL RECOMMENDATIONS IF FORCED TO CHOOSE TODAY ON THE OPEN ITEMS
=====================================================================

If forced to choose immediately, the strongest practical recommendations today would be:

8.1 VIDEO
- Choose Google Meet first if launch speed and lower complexity matter more.
- Choose LiveKit first if owned premium UX matters enough to justify extra engineering.
- Because Muuday explicitly wants to leave this later, the real recommendation is: build the abstraction first, not the provider.

8.2 STRIPE CORRIDOR
- Keep UK as the intended primary platform entity.
- Validate Brazil payout architecture directly with Stripe before implementation freeze.
- Keep Brazil-entity-assisted payout structure as the fallback plan if needed.

8.3 COMPLIANCE
- Treat sensitive-category positioning as a first-class product concern, not just a terms concern.
- Keep the user promise narrower and more accurate than broader and riskier.

=====================================================================
SECTION 9 - FINAL “WHAT IS STILL MISSING” LIST
=====================================================================

Nothing critical is missing from the product and operational model.

What remains missing is not product definition, but the following specific items:

1. Final external validation with Stripe on UK platform / Brazil payouts.
2. Final provider selection between LiveKit and Google Meet.
3. Final legal wording for sensitive categories, regulated-scope disclaimers, and terms.
4. Final tax/accounting review for the chosen entity structure.
5. Final exact initial lists of categories / subcategories / specialties.
6. Final exact price points for the professional tiers.
7. Final exact ranking weights and search tuning.
8. Final UI copy and design system application.

These are not signs that the product spec is incomplete. They are the normal remaining items before moving from strategy/specification into production delivery.

=====================================================================
SECTION 10 - FINAL MESSAGE FOR FUTURE CONSOLIDATION
=====================================================================

This five-part package is detailed enough to act as:
- a product spec,
- an operations spec,
- a payments architecture spec,
- a search/discovery strategy spec,
- a technical requirements base,
- and an AI-coding implementation guide.

If you consolidate later, do not reduce the system to simplistic summaries like:
- “Stripe handles payments,”
- “Users book professionals,”
- “There are 3 plans,”
- “There is search.”

The value of this package is in the exact rules and the interaction between those rules.

The most important thing to preserve when consolidating is not the volume of text. It is the decision precision.

END OF PART 5
