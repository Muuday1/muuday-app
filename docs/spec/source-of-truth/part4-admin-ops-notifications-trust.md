MUUDAY CONSOLIDATION — PART 4
ADMIN OPERATIONS, TRUST & SAFETY, DISPUTES, REVIEWS, NOTIFICATIONS, INBOX, ANALYTICS

IMPORTANT CONTEXT
This document is Part 4 of a 5-part Muuday consolidation. It is intentionally written as a standalone execution document, but it also assumes the strategic choices already made in Parts 1, 2, and 3.

This part focuses on:
- admin operations and internal workflows
- trust and safety mechanisms
- dispute handling and case operations
- review moderation and credibility systems
- notification architecture
- in-app inbox behavior
- analytics and event tracking
- operational requirements for user, professional, admin, and backend
- implementation notes
- AI coder instructions

This document does not try to re-explain all booking and payment rules from scratch, but it references them where operationally necessary. In the final overall consolidation, all five parts should be considered together.

================================================================================
SECTION 1 — WHY THIS PART EXISTS
================================================================================

Muuday is not just a marketplace UI. It is an operational system that needs to survive real-world behavior:
- professionals arriving late
- users canceling at the last second
- disputes about whether a session happened
- payout failures
- billing failures
- attempted off-platform payments
- edited reviews
- categories with more regulatory sensitivity
- manual exceptions that can easily become chaos if not structured

If the admin and trust layer is not designed upfront, the product may look elegant in demos but fail under real usage. This part exists to make sure the operational engine is as intentional as the booking and payment engine.

================================================================================
SECTION 2 — ADMIN OPERATING MODEL
================================================================================

2.1 Core principle
Muuday needs a lightweight but formal internal operating system for exceptions.
The admin side must not be an unstructured set of buttons scattered across the product.
The platform needs a controlled case-handling model.

2.2 Decision already made
Muuday will use a hybrid admin/case model rather than purely scattered manual actions.
It should not be a giant enterprise back-office from day one, but it must already support structured exception handling.

2.3 Admin roles that should exist conceptually
Even if all functions are initially handled by one founder/admin account, the system should be architected as if the following operational roles exist:

1. Marketplace Ops
- approves professionals for first publication
- reviews category/taxonomy suggestions
- handles listing quality
- checks onboarding completeness

2. Payments Ops
- investigates refunds
- handles payout failures
- reviews financial edge cases
- resolves transfer/reversal issues
- watches billing/subscription failures

3. Trust & Safety / Support Ops
- reviews no-show claims
- handles disputes
- reviews reported reviews
- investigates attempted off-platform payment
- handles sensitive complaints and policy violations

4. Content / Discovery Ops
- manages featured collections
- manages manual curation
- approves new specialty suggestions
- moderates bad tags or misleading claims

The same human may play all four roles at the start, but the software model should separate these concerns.

================================================================================
SECTION 3 — CASE QUEUE / ADMIN CASE SYSTEM
================================================================================

3.1 Core decision
Muuday should have a formal but lightweight case queue.
This is not optional if the marketplace will handle real booking, payment, recurring plans, and professional subscriptions.

3.2 Why it matters
Without a case queue, the team quickly loses control over:
- who is handling an issue
- what decision was made
- why it was made
- whether the user/professional was notified
- whether payout/refund was executed
- whether a risk flag was added
- whether the same professional already had past incidents

3.3 Minimum case entity
Every operational case should have at least:
- case_id
- case_type
- related booking_id if applicable
- related payment_id if applicable
- related user_id
- related professional_id
- current status
- priority
- severity
- assigned owner
- created_at
- updated_at
- source of case creation
- summary
- structured decision field
- internal notes
- user-visible resolution outcome
- linked evidence

3.4 Recommended case types
Muuday should support, at minimum:
- dispute
- no_show_claim
- refund_manual_review
- payout_failed
- professional_flagged
- professional_verification_review
- recurring_renewal_issue
- subscription_billing_issue_professional
- review_report
- off_platform_payment_report
- technical_session_failure
- content/taxonomy_review
- account_suspension_review

3.5 Recommended case statuses
Internal statuses can be more detailed than user-facing states.
Recommended internal case statuses:
- new
- triaging
- awaiting_internal_review
- awaiting_user_response
- awaiting_professional_response
- awaiting_evidence
- awaiting_financial_action
- resolved
- escalated
- closed
- rejected

3.6 Priority levels
Recommended:
- low
- normal
- high
- urgent

Urgent should be reserved for:
- active payout failure with significant funds blocked
- ongoing fraud risk
- regulatory/sensitive category issue
- major system outage affecting live bookings
- repeated professional misconduct affecting upcoming sessions

3.7 Assignment model
Every case should have a single owner at any moment.
Even if multiple admins can see it, one person must be accountable.

3.8 User side technical requirements
User should not see the internal case object.
User should see only:
- issue submitted / under review
- if more information is needed
- decision/result
- any refund or booking outcome

3.9 Professional side technical requirements
Professional should see only what is relevant:
- complaint exists
- action needed if any
- deadline to respond if any
- result affecting payout, booking, or account status

3.10 Admin side technical requirements
Admin must be able to:
- open a case manually
- open a case from booking, payment, review, professional, or user page
- attach evidence
- assign owner
- change status
- trigger refund-related actions
- trigger payout blocks or holds where product rules allow
- flag accounts
- log every internal action

3.11 Backend/system requirements
System should allow cases to be created by:
- webhook events
- user reports
- professional reports
- admin manual actions
- automated policy triggers

All major case actions should write to an audit log.

3.12 Implementation notes
Do not build a heavy CRM-style case management system initially.
Build a small internal operational object with:
- strong linking to booking/payment/user/professional
- clear state transitions
- event log
- structured internal notes

This is enough for MVP and early scale.

================================================================================
SECTION 4 — TRUST & SAFETY FOUNDATION
================================================================================

4.1 Trust model
Muuday trust and safety should be practical, not performative.
The product should not pretend everything can be solved automatically.
It should instead combine:
- identity and payment readiness
- review signals
- booking/session evidence
- admin moderation
- limited but clear policy enforcement

4.2 Main trust surfaces
Trust for users comes from:
- quality of profile
- visible category and specialty clarity
- reviews
- badges
- payout/payment readiness signals
- consistent scheduling behavior
- low cancellation/no-show behavior over time
- responsive communication

Trust for professionals comes from:
- clear rules
- predictable payout timing
- dispute process that uses evidence
- visible timeline of events
- clear response channels for reviews and issues

4.3 Main safety risk buckets
Muuday should explicitly model risk buckets:
- off-platform payment attempts
- fake/misleading professional claims
- repeated professional cancellation/no-show
- repeated client no-show or abuse
- sensitive-category overclaiming
- payment/billing abuse
- review abuse
- document misuse in chat/uploads
- repeated payout or KYC failures that correlate with risk

4.4 Internal account flags
Recommended account flags for professionals:
- new_professional
- verification_pending
- verification_failed
- repeated_cancellation_risk
- repeated_no_show_risk
- review_abuse_risk
- off_platform_payment_warning
- payout_issue
- billing_issue
- sensitive_category_manual_review
- suspended
- banned

Recommended account flags for users:
- repeated_no_show_risk
- abusive_behavior_reported
- payment_risk
- dispute_pattern_flag
- off_platform_payment_attempt_flag

4.5 Flag logic should not be purely visible externally
Most flags are internal only.
A few outcomes may affect public visibility indirectly:
- not published
- temporarily hidden
- cannot accept bookings
- cannot receive payouts

================================================================================
SECTION 5 — DISPUTES, NO-SHOWS, AND EVIDENCE OPERATIONS
================================================================================

5.1 Already decided rules that matter operationally
Muuday already decided:
- disputes can be opened by both user and professional, with different scopes
- dispute window is 48h after session end
- session logs and platform evidence are the main evidence source
- 15 minutes without the other party joining becomes strong no-show evidence
- client lateness counts against session time
- professional lateness creates stronger protection for the client

This section translates those decisions into operations.

5.2 Dispute creation sources
A dispute or no-show case can be created by:
- user after session
- professional after session
- system when attendance pattern indicates likely no-show
- admin manually after support contact

5.3 Minimum data captured when opening a dispute
- who opened it
- dispute type
- booking linked
- free text explanation
- structured reason selection
- timestamps
- whether session logs exist
- whether chat evidence exists
- whether attachments/screenshots exist

5.4 Dispute categories recommended
- no_show_user
- no_show_professional
- service_quality_issue
- technical_failure_platform
- technical_failure_other_party
- misleading_service_scope
- billing_or_pricing_issue
- conduct_issue

5.5 Evidence order of precedence
Muuday should use evidence in the following general priority order:
1. platform-generated evidence
2. chat and booking timeline records
3. uploaded evidence from participants
4. contextual manual statements

5.6 Platform-generated evidence should include
- booking timestamps
- booking state transitions
- payment success timestamp
- professional acceptance timestamp if manual
- session join timestamps if video is embedded
- session waiting room/lobby events if used
- session leave timestamps
- session duration signal
- reminder delivery status if tracked

5.7 Chat and communication evidence should include
- timestamps
- messages exchanged before session
- urgent coordination attempts
- indications of absence or late arrival
- off-platform payment solicitation if it happened in chat

5.8 Manual evidence may include
- screenshot of waiting room
- screenshot of external call error
- screenshot of attempted contact
- uploaded files or receipts

5.9 Decision principles
Muuday should not auto-decide every dispute.
Even when evidence is strong, the system should frame it as:
- strong evidence
- suggested outcome
- admin can still override in exceptional cases

5.10 User side technical requirements
User should be able to:
- open dispute within allowed window
- choose reason
- add evidence
- see case status
- see final outcome

5.11 Professional side technical requirements
Professional should be able to:
- open allowed dispute types
- respond to a dispute opened against them
- upload explanation/evidence
- see final outcome affecting payout/reputation

5.12 Admin side technical requirements
Admin should be able to:
- view booking timeline and finance together
- see evidence in one case view
- issue refund or partial refund
- record no-show outcome
- mark professional/user behavior flags
- note repeat patterns

5.13 Implementation notes
Do not over-automate dispute decisioning in v1.
Do build:
- strong evidence capture
- strong case view
- quick admin actions
- risk flags

================================================================================
SECTION 6 — REVIEW SYSTEM AND MODERATION
================================================================================

6.1 Review model already decided
- reviews exist in MVP
- one review per client-professional pair
- review can be edited after later completed sessions
- professional can post one public response
- if review changes, professional is alerted and can revise response
- private feedback also exists separately

6.2 Public review object should store at least
- review_id
- user_id
- professional_id
- initial_booking_id that created the review opportunity
- last_completed_booking_id associated with most recent edit
- public_rating
- public_text
- created_at
- updated_at
- current status
- moderation flags
- professional_response_text if any
- professional_response_updated_at

6.3 Review eligibility rules
A user should only be allowed to leave or edit a review after:
- a session is marked completed
- the booking belongs to that professional

6.4 Why one review per relationship is powerful
This prevents:
- spam reviews from the same person
- artificial score inflation from repeated sessions
- clutter on the profile

It also better reflects long-term service relationships.

6.5 How rating aggregation should work
Public aggregate rating should use the latest active review value for each unique user-professional pair.
If a review is hidden or removed, it should no longer contribute to the public aggregate.

6.6 Review moderation triggers
Muuday should support review reporting for:
- abusive content
- hate/harassment
- privacy leaks
- clearly false accusations
- promotional spam
- irrelevant content

6.7 Who can take action
- user can edit review and request removal
- professional can report review and post one response
- admin can hide, remove, restore, or annotate internally

6.8 Recommended review statuses
- active
- under_review
- hidden
- removed

6.9 Notification logic around reviews
When a new review is posted:
- professional gets notified
When a review is edited:
- professional gets notified again
- professional may update response
When a review is reported:
- admin case may open if needed

6.10 User side technical requirements
User should be able to:
- leave review after completed session
- edit existing review later after additional completed sessions
- request removal
- submit private feedback separately

6.11 Professional side technical requirements
Professional should be able to:
- see new or edited review
- post one response
- edit that response after a review edit
- report review

6.12 Admin side technical requirements
Admin should be able to:
- hide or remove review
- inspect history of edits
- see linked bookings and timestamps
- see whether the professional responded
- audit patterns of abusive reviewing

6.13 Implementation notes
Use moderation softly at first.
Do not create a giant content moderation suite.
Do create:
- review status field
- edit history
- response object
- report flow
- admin moderation action log

================================================================================
SECTION 7 — BADGES, VERIFICATION, AND TRUST SIGNALS
================================================================================

7.1 Badge philosophy
Badges should help trust, not become a casino of meaningless icons.
Muuday already chose a moderate badge system.

7.2 Recommended badges for MVP and near-MVP
- Verified
- Payment configured
- Fast responder
- Professional
- Premium
- Recurring available
- Monthly plan available

7.3 Badge semantics must be clear
Never use a badge label that implies legal or medical authority unless the internal compliance logic truly supports it.

7.4 Verified should not mean one vague thing
Muuday should separate internally at least:
- identity/basic platform verification
- payout/account setup complete
- category-specific credential reviewed if applicable

Externally, the label may be simplified, but internal semantics must stay distinct.

7.5 Sensitive category nuance
For categories like medical or adjacent regulated guidance:
Muuday must not allow misleading presentation.
If the category is structured as consultant or informational advisor, the badge and copy must not imply full local clinical authority.

7.6 Technical requirements
Badges should be rule-driven, not manually hardcoded per profile.
Each badge needs:
- eligibility logic
- visibility rules
- expiration or revocation logic if applicable

================================================================================
SECTION 8 — PROFESSIONAL MODERATION AND CONTENT GOVERNANCE
================================================================================

8.1 First publication review
Already decided:
- first go-live requires light admin review

8.2 What admin should review before first publication
- profile completeness
- photo appropriateness
- bio quality and clarity
- taxonomy alignment
- service clarity
- pricing sanity
- sensitive category disclaimers where relevant
- payout readiness rules
- claims that might be misleading or out-of-scope

8.3 Change review policy
Already decided:
- hybrid, not overly rigid

Operational meaning:
Changes can be divided into:
1. immediate changes
- small copy edits
- photos
- tags
- minor description tweaks

2. controlled changes
- category
- specialty
- large price change
- service model change
- recurring plan structure changes
- claims/disclaimers in sensitive categories

8.4 Taxonomy governance
Already decided:
- categories, subcategories, specialties are platform-governed
- tags can be added by professionals within limits
- new specialty suggestions require approval
- new tags can appear immediately but are moderatable

8.5 Admin tools required
Admin should be able to:
- approve/reject first publication
- request edits
- approve specialty suggestion
- remove bad tags
- hide listing temporarily
- flag misleading claims
- suspend profile publication without deleting historical records

================================================================================
SECTION 9 — OFF-PLATFORM PAYMENT ENFORCEMENT
================================================================================

9.1 Already decided
- ambiguous case can start with warning
- explicit attempt to move payment off-platform is a serious strike
- repeated cases lead to suspension or ban

9.2 Operational implementation
Reports or detected evidence should create an internal case.
Evidence sources may include:
- in-app chat
- user report
- professional report
- admin observation

9.3 Recommended action ladder
1. ambiguous / soft suspicion
- note internally
- warning if needed

2. clear solicitation for off-platform payment
- serious strike
- case opened
- trust review

3. repeated behavior
- suspension
- possible ban
- payout review if necessary

9.4 Technical requirements
System should allow case linking to:
- offending messages
- booking context
- prior incidents

================================================================================
SECTION 10 — NOTIFICATION ARCHITECTURE
================================================================================

10.1 Already decided
MVP notifications use:
- email
- in-app notifications

No WhatsApp/SMS in MVP core.

10.2 Notification philosophy
Notifications should be:
- timely
- actionable
- role-specific
- not spammy
- linked to actual product state

10.3 Core notification categories
1. Booking lifecycle
2. Payment lifecycle
3. Review and feedback
4. Subscription/billing lifecycle
5. Admin/action-required notices
6. Request booking flow
7. Safety/trust alerts where appropriate

10.4 Minimum user notifications
User must receive notifications for:
- booking confirmed
- booking pending professional confirmation
- booking accepted
- booking declined
- booking canceled
- booking rescheduled
- refund issued
- reminders
- review/feedback request
- recurring renewal success/failure where applicable
- pause/cancellation status for recurring plans

10.5 Minimum professional notifications
Professional must receive notifications for:
- new booking
- booking pending action if manual accept
- request booking submitted
- booking canceled
- booking rescheduled
- payout sent
- payout failed
- subscription billing issue on professional plan
- review created or edited
- review report or trust case affecting them
- recurring plan change requests where relevant

10.6 Minimum admin notifications
Admin should receive internal alerts for:
- dispute opened
- payout failed
- professional flagged
- payment/billing failure that needs action
- review reported
- professional first-publication ready for review
- recurring renewal issue affecting bookings
- technical incident affecting bookings or sessions

10.7 Delivery rules
Recommended model:
- email for important transactional milestones
- in-app for real-time awareness and persistent visibility

10.8 Notification object should store
- notification_id
- recipient_type
- recipient_id
- notification_type
- entity_type
- entity_id
- title
- body
- channel availability
- read/unread state for in-app
- sent_at
- email_delivery_status if available

10.9 User side technical requirements
Users need:
- unread count
- ability to open the linked entity
- ability to mark read
- clear separation from chat

10.10 Professional side technical requirements
Professionals need the same, plus:
- billing and payout alerts
- profile moderation notices
- recurring plan request notices

10.11 Backend requirements
Notification triggers should be event-driven.
Avoid building notifications with ad hoc direct calls scattered everywhere.
Use a central notification service or dispatcher.

================================================================================
SECTION 11 — REMINDERS
================================================================================

11.1 Already decided
Muuday reminders follow a multi-touch pattern:
- booking confirmation immediately
- 24h before session
- 1h before session
- 10 min before session via in-app

11.2 Reminder purpose
- reduce no-show
- reduce lateness
- reinforce time and timezone
- make join flow obvious

11.3 What reminders should include
- professional name
- service name
- session date and time
- explicit timezone
- join or booking link
- reschedule/cancel links when still allowed

11.4 Timezone-safe behavior
All reminder generation must be based on canonical UTC time plus viewer-local conversion logic.
Do not hardcode reminder times using only client-local browser assumptions.

================================================================================
SECTION 12 — IN-APP INBOX / NOTIFICATION CENTER
================================================================================

12.1 Already decided
Muuday should have an in-app notification inbox separate from chat.

12.2 Why separate inbox matters
Chat is for communication between user and professional.
Inbox is for platform-generated state changes and required actions.
Mixing them would reduce clarity.

12.3 Inbox contents
Recommended inbox content types:
- booking updates
- payment updates
- refund updates
- recurring renewal updates
- payout updates for professionals
- billing alerts for professionals
- review-related notices
- platform notices

12.4 Minimum inbox behaviors
- unread badge count
- chronological feed
- click-through to linked object
- mark as read
- mark all as read later if desired

12.5 What should not go there initially
- full chat threads
- heavy workflow tools
- marketing spam

================================================================================
SECTION 13 — TIMELINE / AUDIT VISIBILITY
================================================================================

13.1 Already decided
Each booking should have a booking timeline.

13.2 Operational importance
Timeline reduces support load because it explains what happened.
A timeline should be available, with appropriate level of detail, to:
- user
- professional
- admin

13.3 Timeline events to show externally where relevant
- booking created
- payment confirmed
- professional accepted
- booking confirmed
- reminder sent
- rescheduled
- canceled
- completed
- refund issued

13.4 Timeline events that may be admin-only
- risk flag added
- internal review opened
- transfer reversal executed
- payout held for trust review
- hidden moderation actions

13.5 Technical requirements
Timeline should be derived from event logs, not hand-maintained text fields.

================================================================================
SECTION 14 — ANALYTICS AND EVENT TRACKING
================================================================================

14.1 Already decided
Muuday wants a minimum mandatory analytics event set from MVP onward.
This is essential for improving search, booking conversion, retention, and monetization.

14.2 Analytics philosophy
Track enough to make decisions, not everything just because you can.
Use event names consistently and include clean properties.

14.3 Event groups already defined
Discovery / Search:
- search_opened
- search_query_submitted
- filter_applied
- result_clicked
- professional_profile_viewed
- service_viewed
- favorite_added

Booking:
- slot_selected
- booking_review_viewed
- checkout_started
- payment_succeeded
- payment_failed
- booking_confirmed
- booking_pending_professional_acceptance
- booking_accepted
- booking_declined
- booking_canceled
- booking_rescheduled
- booking_completed
- no_show_user
- no_show_professional

Recurring / Subscription:
- recurring_plan_started
- recurring_renewal_succeeded
- recurring_renewal_failed
- recurring_auto_renew_disabled
- recurring_paused
- recurring_resumed

Post-session:
- review_prompt_shown
- review_submitted
- private_feedback_submitted
- dispute_opened

Professional / Revenue:
- professional_signup_started
- professional_profile_completed
- professional_submitted_for_review
- professional_published
- plan_selected
- trial_started
- subscription_started
- subscription_payment_failed
- payout_eligible
- payout_sent
- payout_failed

14.4 Recommended properties to attach where relevant
- user_id or anonymous session id
- professional_id
- booking_id
- service_id
- category
- subcategory
- specialty
- tier
- currency
- localized currency shown
- base price
- total paid
- timezone
- recurring vs one-off
- platform state at event time

14.5 Technical requirements
Use a consistent analytics layer.
Do not scatter events directly from random UI components with inconsistent names.
Create:
- event naming spec
- event property spec
- server-side events for important financial/booking milestones
- client-side events for discovery and conversion interactions

================================================================================
SECTION 15 — USER SIDE OPERATIONAL REQUIREMENTS
================================================================================

15.1 The user should be able to
- receive booking state updates clearly
- understand when a booking is pending professional confirmation
- submit disputes within rules
- leave and edit review
- provide private feedback optionally
- receive receipts by email and in app/account
- see timeline/history of booking
- access notification inbox
- understand cancellations/refunds/statuses clearly

15.2 User should not need to understand internal admin language
Avoid exposing internal case statuses or payment engine jargon.

15.3 User interface states that need explicit copy
- pending professional confirmation
- confirmed
- refunded
- rescheduled
- no-show under review
- issue under review
- recurring renewal failed
- paused recurring plan

================================================================================
SECTION 16 — PROFESSIONAL SIDE OPERATIONAL REQUIREMENTS
================================================================================

16.1 The professional should be able to
- understand new booking vs pending manual acceptance
- see payout/billing alerts
- see booking timelines relevant to them
- respond to reviews
- see review edits
- open disputes where allowed
- see why a payout is blocked or failed
- see status of first-publication review or listing moderation
- manage request booking flow
- use notification inbox

16.2 Professionals should not be able to
- directly execute refunds in MVP
- override financial decisions outside platform rules
- bypass moderation controls for sensitive taxonomy or serious content changes

16.3 Professional transparency requirements
Especially because professionals are monetized users, they need a reliable internal explanation system for:
- why they are not live
- why a payout failed
- why their profile is flagged or under review
- what plan they are on
- what trial or annual status they are in

================================================================================
SECTION 17 — ADMIN SIDE OPERATIONAL REQUIREMENTS
================================================================================

17.1 Admin needs a unified console across:
- professionals
- users
- bookings
- payments
- payouts
- reviews
- cases
- notifications if relevant

17.2 Admin should be able to move between entities quickly
From a booking page, admin should be able to jump to:
- user profile
- professional profile
- payment details
- case details
- review details

17.3 Admin auditability is mandatory
Every manual admin action touching:
- refunds
- disputes
- visibility
- publication
- flags
- review moderation
should be logged.

17.4 Minimum admin dashboards recommended
- pending publication reviews
- open cases by status/priority
- payout failures
- renewal failures affecting upcoming bookings
- top repeated cancellation/no-show professionals
- unresolved review reports

================================================================================
SECTION 18 — BACKEND / SYSTEM REQUIREMENTS
================================================================================

18.1 Event-first architecture
Many behaviors in this part should be driven by domain events, not tightly coupled controller logic.
Examples:
- booking_confirmed triggers notification and timeline event
- review_submitted triggers professional alert
- payout_failed opens case or alert depending on severity
- dispute_opened triggers admin visibility and timeline updates

18.2 Recommended system components
- notification service
- case service
- review moderation module
- audit log service
- analytics dispatcher
- policy/risk evaluation helpers

18.3 State consistency
Do not let user-facing status, admin case status, and payment status drift independently without mapping.
Create explicit mapping layers.

================================================================================
SECTION 19 — IMPLEMENTATION NOTES
================================================================================

19.1 Build order recommendation for this part
1. Notification service and in-app inbox
2. Booking timeline
3. Review system with response/edit/report
4. Admin publication review tools
5. Case queue for disputes/refunds/payout issues
6. Risk flags and moderate trust automation
7. Analytics instrumentation

19.2 What not to overbuild in v1
- heavy machine-learning trust scoring
- enterprise support tooling
- fully automated dispute decisioning
- complex moderation queues with too many statuses
- broad omnichannel messaging

19.3 What must not be skipped
- audit log
- notification routing
- case entity
- clear review rules
- internal flags
- event tracking specification

================================================================================
SECTION 20 — TOOLING PREFERENCES FOR IMPLEMENTATION
================================================================================

20.1 Guiding principle
Any tool suggested later should be:
- cost-effective
- low to moderate complexity
- friendly to Claude / Codex / Cursor / Antigravity workflows
- realistically operable by a lean founding team

20.2 Recommended implementation posture
For admin and notifications, prefer:
- a simple internal dashboard in the main app
- a lightweight event/queue model
- transactional email provider with straightforward templates
- analytics stack that can be instrumented without huge overhead

20.3 Avoid early overkill
Avoid needing a heavy separate support platform for core product operations before the internal objects exist in your main system.

================================================================================
SECTION 21 — INSTRUCTIONS FOR AI CODER
================================================================================

21.1 Shared instruction set for all AI coding tools
When implementing this part, the AI coder must:
- preserve the distinction between user-facing simplicity and internal operational detail
- model cases, reviews, notifications, flags, and timelines as first-class entities where appropriate
- use explicit enums for statuses
- use audit logging for all sensitive admin actions
- keep role-based access extremely clear
- implement event-driven triggers for notifications and timeline generation
- avoid hiding core rules in UI-only logic

21.2 Codex instructions
Ask Codex to:
- generate database schemas for case, review, notification, inbox, and audit log tables
- define enums for case status, review status, notification types, and flags
- generate service-layer functions for dispute opening, review creation/update, and notification dispatch
- generate admin query endpoints with filters for cases and publication review
- write tests for state transitions and permissions

21.3 Claude instructions
Ask Claude to:
- reason about state machines and moderation logic
- propose robust edge-case handling for disputes and reviews
- refine policy copy and admin logic flows
- review PRD consistency across booking, payments, and admin operations
- identify ambiguity between user-visible and internal states

21.4 Cursor instructions
Ask Cursor to:
- implement the UI flows for inbox, timelines, review response, admin case list, and moderation actions
- help refactor duplicated notification logic into reusable hooks/services
- improve type safety around enums and status mapping
- speed up editing across multiple related files

21.5 Antigravity instructions
Ask Antigravity to:
- help generate structured implementation plans
- break operational flows into tasks and subtasks
- analyze architecture and dependency risks
- critique whether the admin/trust system is too heavy or too light for MVP

================================================================================
SECTION 22 — WHAT IS STILL DEFERRED AFTER THIS PART
================================================================================

This part intentionally does not fully finalize:
- final session/video provider implementation details
- deep legal wording of sensitive-category disclaimers and terms
- final compliance text pack
- exact initial category list and operational moderation SOPs per category

Those belong either in Part 5 or in later legal/compliance review work.

================================================================================
SECTION 23 — THINK LATER, DO NOT IMPLEMENT YET
================================================================================

These are important future-thinking items, but should not be implemented now unless there is a strong reason:

1. automated trust scoring models
2. advanced reputation weights in ranking
3. multi-admin SLA dashboards
4. advanced content moderation AI
5. broader omnichannel notification stack
6. public transparency center for professional performance
7. more complex review reputation models
8. advanced dispute automation based on session telemetry
9. policy-specific workflows for high-risk sensitive categories
10. full support CRM integration

These should be considered only after the MVP and early operational patterns are visible.

END OF PART 4
