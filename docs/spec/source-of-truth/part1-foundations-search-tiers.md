MUUDAY CONSOLIDATED PRODUCT SPECIFICATION
PART 1 OF 5 â€” FOUNDATIONS, TAXONOMY, PROFESSIONAL TIERS, SEARCH/DISCOVERY, PROFILE & TRUST LAYER

Status of this document
- This is Part 1 of a 5-part consolidated specification.
- It is written to be self-contained.
- It is intentionally detailed.
- It is meant to be implementation-oriented, not just strategy-oriented.
- It reflects the decisions made in the working sessions so far.
- This part does NOT yet cover the full booking state machine, checkout details, Stripe funds flow, payout operations, refunds/disputes workflow, or full admin case operations. Those are covered in later parts.

How to use this document
- Read this document as the source of truth for the product areas it covers.
- Treat this document as a build specification for product, design, and engineering.
- Where a point is marked as â€œfuture considerationâ€ or â€œlater phase,â€ it should NOT be implemented now.
- Where a point is marked â€œMVP,â€ assume it is in scope unless explicitly deferred.
- Where a point is marked â€œpremium laterâ€ or similar, it is a roadmap note rather than an MVP instruction.

What this part covers
1. Product foundations and operating principles
2. Marketplace structure and service model overview
3. Taxonomy model: category, subcategory, specialty, tags
4. Professional plans/tiers: Basic, Professional, Premium
5. Pricing/visibility implications of tiers
6. Search, discovery, ranking, sorting, filters, autocomplete, no-results behavior
7. Search result cards, profile presentation, trust signals, reviews, favorites, rebooking entry points
8. Professional profile publishing and first go-live rules at a high level
9. Product implications for user, professional, admin, and system behavior
10. Technical requirements, implementation notes, and AI-coder instructions for the areas above

Questions consolidated into this part
This part consolidates the decisions originating mainly from the following question clusters from the working sessions:
- Taxonomy and profile structure
- Professional tiers and plan logic
- Search/discovery/ranking/cards/filtros/autocomplete
- Reviews/trust/profile credibility
- Favorites and rebooking entry points
- Publishing/go-live logic at a high level

--------------------------------------------------------------------
SECTION 1 â€” PRODUCT FOUNDATIONS
--------------------------------------------------------------------

1.1 Product concept
Muuday is a marketplace connecting users, especially Brazilians living abroad, with professionals who can provide services remotely. The platform supports professionals primarily based in Brazil, but not exclusively. The product is designed to support one-off consultations, recurring services, and monthly subscription-style professional services.

This is not a generic directory. It is a structured marketplace with:
- discovery
- trust signals
- booking
- communication
- payments
- recurring service support
- moderation/go-live controls
- tiered professional plans

1.2 Product philosophy
The platform should feel:
- premium
- trustworthy
- operationally clear
- commercially structured
- easy enough to launch without enterprise-level complexity

The product should avoid two opposite mistakes:
- being so open and flexible that it becomes operational chaos
- being so rigid that professionals cannot onboard or sell naturally

1.3 Marketplace operating principles
The key operating principles that affect everything in this part are:

Principle A â€” Structure over chaos
The marketplace should be structured around a controlled taxonomy and controlled professional setup.

Principle B â€” Flexible but not messy
Professionals can configure important commercial choices, but inside platform-defined boundaries.

Principle C â€” Search should be useful, not noisy
Users should be able to discover the right professional without a giant mess of filters, labels, or spam.

Principle D â€” Paid tiers should matter, but not break trust
Professional plans can influence visibility and tooling, but should not make search feel fake or fully pay-to-win.

Principle E â€” Tags enrich search but should not pollute the filter UI
The structured taxonomy should drive navigation and filtering. Tags should improve recall and dynamic search matching.

Principle F â€” Trust should be embedded in discovery
Reviews, verifications, profile quality, and clarity of offer must be visible enough to support conversion.

Search filter UX baseline (execution detail, Wave 2)
- Filter bar sits below the search bar and runs horizontally on desktop.
- Specialty selector is disabled until a category is selected.
- Country/location must be shown by full country name (never 2-letter code in user-facing UI).
- Filter option values (category, specialty, language, location) must come from currently available professionals, not static/global lists.
- Search cards must render country by full name and price in the user selected currency.

1.4 Core actors
This product has four main actor groups:

A. User / customer
The person searching, choosing, booking, paying, and attending services.

B. Professional
The person listing services, managing availability, receiving bookings, and delivering the service.

C. Admin / operations
The platform operator managing quality, approvals, disputes, moderation, and commercial rules.

D. System / platform logic
The application itself, including ranking, taxonomy, service rules, state transitions, notifications, and integrations.

1.5 Scope boundary for this part
This part is focused on discovery, structure, and professional commercial configuration.
It does NOT fully define:
- booking state machine detail
- checkout logic
- refunds / Stripe operational details
- payout schedules and ledger implementation detail
- dispute case handling detail
Those are intentionally left to later parts.

--------------------------------------------------------------------
SECTION 2 â€” MARKETPLACE SERVICE MODEL OVERVIEW
--------------------------------------------------------------------

2.1 Service models supported by Muuday
Muuday supports three service models.

Model 1 â€” One-off session
Examples:
- a doctor-like consultative session
- one accountant consultation
- one career consultation
- one language tutoring session

Model 2 â€” One-off plus recurring
Examples:
- psychologist first consultation followed by weekly sessions
- specialist intake followed by ongoing sessions

Model 3 â€” Monthly subscription-style service
Examples:
- accountant monthly support
- ongoing advisory service
- recurring service relationship paid on a monthly cycle

2.2 Why this matters for search/discovery
Search and profile structure must help users understand whether a professional:
- offers one-off services
- offers recurring work
- offers monthly ongoing support

In the MVP, this information is mostly expressed at the service and profile level, not overexposed as a search filter.

2.3 Why this matters for tiers
Professional, Premium, and future higher-value commercial tiers should support more advanced monetization models and packaging logic without making the Basic plan too complicated.

--------------------------------------------------------------------
SECTION 3 â€” TAXONOMY MODEL
--------------------------------------------------------------------

3.1 Final taxonomy structure
The Muuday marketplace taxonomy must follow this hierarchy:

1. Category
The large marketplace category shown on the landing page.
Example: SaÃºde, Corpo e Movimento.

2. Subcategory
The profession or role.
Example: Consultor mÃ©dico.

3. Specialty
The specific area of expertise.
Example: Ginecologia.

4. Tags
Flexible descriptive terms.
Example: amamentaÃ§Ã£o, parto, menopausa, fertilidade.

3.2 Why this structure exists
This hierarchy is important because it separates:
- the user-facing navigation structure
- the professional positioning structure
- the search enrichment layer

Without this separation, the marketplace quickly becomes messy.

3.3 Role of each layer

Category
- Used in landing navigation and top-level browsing.
- Represents a broad problem space or market vertical.
- Must be controlled by Muuday.
- Must remain relatively stable.

Subcategory
- Represents the professional role or profession.
- Used in filtering and search structure.
- Controlled by Muuday.
- Must remain curated.

Specialty
- Represents a more specific expertise area.
- Used in search and filtering.
- Controlled by Muuday.
- Should be extensible but not open chaos.

Tags
- Freeform descriptive layer.
- Used for search dynamism and semantic matching.
- Not used as a primary filter.
- Can be professional-added within limits.
- Can be moderated or removed.

3.4 Example taxonomy expression
Example path:
- Category: SaÃºde, Corpo e Movimento
- Subcategory: Consultor mÃ©dico
- Specialty: Ginecologia
- Tags: amamentaÃ§Ã£o, parto, saÃºde hormonal, menopausa

3.5 Governance rules
Categories, subcategories, and specialties are controlled by Muuday.
Professionals do not create these freely.

Tags are more flexible.
Professionals may add tags subject to tier limits and moderation.
Professionals may also suggest new specialties or tags for internal review.

3.6 Taxonomy creation/editing rights

Categories
- Created and edited only by Muuday.

Subcategories
- Created and edited only by Muuday.

Specialties
- Created and edited only by Muuday.
- Professionals can suggest additions.
- Suggestions do not go live automatically.

Tags
- Professionals can add tags directly, within limits.
- Tags can appear immediately.
- Tags remain subject to moderation, cleanup, and removal.

3.7 Moderation rules for taxonomy-related content
- New tags can appear immediately but are reviewable.
- New specialty suggestions require approval before becoming part of the marketplace structure.
- Admin must retain the ability to merge, rename, retire, or remove taxonomy items that cause duplication or confusion.

3.8 Why tags are not primary filters
Tags should NOT become main filters in the MVP because:
- too many tags create visual noise
- tags are inconsistent by nature
- tags are better for recall than for filter clarity
- specialty is a stronger controlled layer for filtering

3.9 How tags should be used instead
Tags should be used to improve:
- free-text search matching
- semantic recall
- profile richness
- long-tail discovery
- autocomplete and related suggestions in later phases

3.10 Limit rules by tier
Specialties per tier:
- Basic: up to 2 specialties
- Professional: up to 3 specialties
- Premium: up to 5 specialties

Tags per tier:
- Basic: up to 3 tags
- Professional: up to 5 tags
- Premium: up to 10 tags

3.11 User-side requirements for taxonomy
The user must be able to:
- browse top-level categories
- filter by category, profession, specialty
- search using free text that matches structured taxonomy and tags
- understand the professionalâ€™s positioning without reading a huge biography

3.12 Professional-side requirements for taxonomy
The professional must be able to:
- choose category, subcategory, and specialty from platform-controlled options
- add tags up to tier limits
- suggest new specialties for review
- understand how taxonomy affects search and discovery

3.13 Admin-side requirements for taxonomy
Admin must be able to:
- create/edit/archive categories
- create/edit/archive subcategories
- create/edit/archive specialties
- review specialty suggestions
- moderate tags
- merge duplicates
- manage naming consistency
- ensure regulated or sensitive categories use proper labeling and disclaimers

3.14 System/backend requirements for taxonomy
The backend should support:
- category table
- subcategory table linked to category
- specialty table linked to subcategory
- professional_specialty relation
- service_specialty relation if needed
- tags relation by professional or by service
- moderation status for suggested specialties/tags
- search indexing across taxonomy and tags

3.15 Implementation notes for taxonomy
- Keep taxonomy normalized and controlled.
- Do not rely on tags for core discovery logic.
- Use taxonomy IDs internally, not only labels.
- Keep translation/localization support in mind even if not fully implemented yet.
- Allow taxonomy evolution without breaking existing profiles.

3.16 AI coder instructions â€” taxonomy
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
--------------------------------------------------------------------
SECTION 4 â€” PROFESSIONAL PLANS / TIERS
--------------------------------------------------------------------

4.1 Final tier structure
Muuday will have 3 professional plans:
- Basic
- Professional
- Premium

4.2 Why 3 tiers are better than 2
Three tiers create a stronger upgrade ladder.
They allow Muuday to separate:
- entry-level platform participation
- growth-oriented tooling
- premium monetization and discovery advantages

If only 2 tiers exist, the premium tier often becomes overcrowded with too many benefits.
Three tiers create clearer packaging.

4.3 What tiers should influence
Tiers should influence:
- operational limits
- commercial flexibility
- search/discovery advantages
- visibility and badges
- booking window limits
- number of services
- number of specialties/tags
- future monetization features

Tiers should not completely override:
- quality
- user relevance
- reviews
- profile trust
- actual fit for a search query

4.4 Tier philosophy
Basic
- good enough to operate
- simpler configuration
- fewer growth and monetization tools
- limited visibility advantages

Professional
- stronger commercial toolkit
- better discovery presence
- better operational flexibility
- aimed at serious platform users

Premium
- strongest commercial toolkit
- strongest visibility/discovery benefits within trust boundaries
- more advanced monetization controls
- higher-value packaging

4.5 Billing structure already decided elsewhere but relevant here
- Monthly plan exists.
- Annual plan exists.
- Annual discount: 15%.
- All professional plans should support a 3-month free signup period.

4.6 Tier selection timing
The professional enters onboarding with Basic as default.
The system should show the existence of all tiers early.
The final plan confirmation happens closer to go-live.
This avoids confusion at the first step while still selling upgrade value.

4.7 Trial / signup offer
- All professionals can get 3 months free when signing up.
- The professional should still select a plan.
- Card collection should still happen as part of the commercial onboarding flow.
- The trial logic belongs more fully to payments, but it affects tier adoption, so it matters here.

4.8 Annual plan rule
- Annual plan available.
- Annual discount: 15%.
- This must be reflected in the plan comparison and upgrade flows.

4.9 Plan switching logic (high-level, as relevant here)
- Upgrade should be easier/faster.
- Downgrade should be more controlled.
- During trial, upgrade should be allowed; downgrade should be more constrained.
- Detailed subscription handling is covered later, but UI/UX must anticipate it.

4.10 Tier benefits â€” final high-level model
Tiers differ across three dimensions:

A. Operational capacity
Examples:
- booking window
- number of services
- number of specialties/tags

B. Growth / visibility
Examples:
- discovery boost
- badges
- featured areas
- stronger visual presence

C. Monetization controls
Examples:
- promotions
- recurring setup flexibility
- premium package options
- future loyalty/fidelity tools

4.11 Booking window by tier
- Basic: 60 days
- Professional: 90 days
- Premium: 180 days

4.12 Service count by tier
- Basic: 3 services
- Professional: 10 services
- Premium: 20 services

4.13 Service option count (durations / service variants) by tier
- Basic: up to 3 options per service
- Professional: up to 6 options per service
- Premium: up to 10 options per service

4.14 Recurring/plan sophistication by tier
Basic in MVP
- simpler packaging
- limited promotional/commercial sophistication
- one-off and basic recurring allowed, but less flexibility in advanced offers

Professional
- stronger commercial flexibility
- request booking available
- promotions allowed
- stronger visibility

Premium
- strongest commercial flexibility
- more advanced promotional possibilities
- stronger discovery placement
- future premium-only monetization options such as more advanced first-session conversion or loyalty constructs

4.15 Loyalty/fidelity rules (future)
Default marketplace model remains no-fidelity/month-to-month.
However, in future premium variants, Muuday may allow limited fidelity options chosen from a platform-defined menu.
This is roadmap, not MVP.

4.16 Service-model related premium controls
Basic MVP behavior
- one-off session stays separate from recurring plan start by default

Premium future behavior
- professional may choose whether first session can be credited into a recurring plan

This should be presented as a later premium feature, not an MVP requirement.

4.17 Discovery and tier influence
Tier influences discovery, but only moderately.
This is important enough to repeat.
Muuday must avoid a marketplace that feels like paid spam.

The search system should still heavily weight:
- relevance
- taxonomy fit
- availability
- review quality
- conversion performance
- completeness/trustworthiness

4.18 Visibility benefits by tier
Basic
- standard listing
- no meaningful paid ranking lift
- no featured placement by default

Professional
- badge
- small ranking boost
- some visual enhancement
- better discovery chances
- request booking available

Premium
- premium badge
- moderate ranking boost
- stronger visual prominence
- eligibility for featured/campaign placements
- stronger discovery advantages

4.19 Featured placement and transparency rule
Normal tier-based boosting does not require a special â€œsponsoredâ€ label.
But truly editorial/featured/campaign placements should be visibly signaled.
This preserves trust.

4.20 Curated/editorial discovery and tiers
Admin can create featured collections and highlighted areas.
Professional/Premium may be more likely to benefit from these, but featured placement remains curated and limited.

4.21 User-side requirements for tiers
Users should:
- sense that some professionals are more established or premium
- not feel manipulated by overt paid spam
- see subtle trust/quality/plan signals
- never need to understand the platformâ€™s plan system to book successfully

4.22 Professional-side requirements for tiers
Professionals should:
- understand clearly what each plan changes
- see limits and benefits before go-live
- be able to compare booking window, service counts, tags/specialties, and visibility perks
- understand which features are not available in Basic

4.23 Admin-side requirements for tiers
Admin should be able to:
- define plan entitlements
- change plan limits over time
- grant or revoke features
- control which features are premium now versus later
- expose featured placement rules
- override or support plan adjustments where needed

4.24 System/backend requirements for tiers
The backend must support:
- tier enumeration
- entitlement mapping table or config
- feature flags by tier
- plan-based UI exposure
- search boost weights by tier
- service count enforcement
- tag/specialty count enforcement
- booking window enforcement

4.25 Implementation notes for tiers
- Do not hardcode all tier logic deep inside UI.
- Use a configuration-driven entitlement layer where possible.
- Keep search boost logic adjustable without rewriting core search.
- Build clear upgrade prompts, but avoid constant nagging.

4.26 AI coder instructions â€” tiers
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
--------------------------------------------------------------------
SECTION 5 â€” SEARCH, DISCOVERY, RANKING, FILTERS, AND EMPTY STATES
--------------------------------------------------------------------

5.1 Search philosophy
Search is one of the most important parts of Muuday.
A user should be able to find the right professional through:
- browsing
- text search
- filtering
- curated discovery

The search experience should feel:
- rich
- dynamic
- guided
- controlled
- trustworthy

It should not feel like:
- a messy classifieds board
- a pure paid placement feed
- a giant wall of tiny filters

5.2 What search must support in MVP
The search layer must support:
- browsing by taxonomy
- text search
- filters
- sorting
- autocomplete suggestions
- no-results fallback suggestions
- some editorial/curated collections
- search-aware card design

5.3 Primary filters in MVP
Primary filters in the MVP are:
- Category
- Subcategory / profession
- Specialty
- Price
- Availability
- Language
- Rating minimum

5.4 Explicitly excluded from primary filters in MVP
Do not use these as primary user-facing filters in MVP:
- tags
- type of service (one-off/recurring/monthly) as a main filter
- tier of professional
- too many badges or advanced metadata

5.5 Why service type is not a primary filter
Although service models matter, exposing that too strongly at filter level early may increase complexity without enough benefit. The user can understand service model on the profile.

5.6 Why tags are not filters but are part of search
Tags improve search dynamism and recall.
They are helpful for matching user language to professional positioning.
However, they are too messy to become a clean filter set.

5.7 Search input model
Search must support:
- text free search
- category browsing
- filter narrowing

Text search is not purely semantic and not purely taxonomy-bound. It is hybrid.

5.8 What the search engine should match against
The search system should attempt to match against:
- category
- subcategory
- specialty
- tags
- professional name
- profile headline
- short bio
- service names

5.9 Search anchoring principle
Even though free text exists, the search should still be anchored to platform structure.
This means structured fields should carry more importance than loose descriptive fields.

5.10 Autocomplete in MVP
Autocomplete should exist in a basic form.
It should suggest:
- categories
- subcategories
- specialties
- professionals

Autocomplete does not need to be fully intelligent in MVP.
Its role is to reduce friction and guide users toward marketplace structure.

5.11 Default search sorting
The default sorting should be relevance-based.
However, the user can explicitly change sort to:
- relevance
- price
- rating
- next availability

5.12 Relevance logic
Relevance should be hybrid and should consider:
- text/query match
- taxonomy match
- profile quality
- review quality
- conversion signals
- availability
- completeness
- moderate tier boost

This is NOT a final weighting formula, but it is the correct conceptual model.

5.13 Tier boost rule
Tier boost exists but is moderate.
It should never fully replace relevance or quality.
Premium should not always outrank a significantly better-matching professional simply because of payment.

5.14 No exact result behavior
When search finds no exact match, the platform should not dead-end the user.
Instead it should show:
- message that no exact result was found
- related specialties
- professionals from the same subcategory
- suggestions to widen price or availability
- request booking, where applicable

5.15 Why this matters
This reduces bounce and helps the marketplace retain intent even when supply is imperfect.

5.16 Curated/editorial layers on top of search
Muuday should support editorial discovery areas such as:
- most popular among Brazilians abroad
- womenâ€™s health
- taxes for expatriates
- psychologists in Portuguese
- featured professionals

These collections should be curated but limited, not the main search engine.

5.17 Need-based entry points
In addition to profession-based navigation, the landing/discovery experience can include need-based entry points such as:
- I need help with taxes abroad
- I need therapy in Portuguese
- I need womenâ€™s health guidance

These should route into taxonomy/search rather than replace taxonomy.

5.18 User-side requirements for search
Users must be able to:
- browse by category
- search by text
- refine with filters
- sort results
- understand why a professional might be relevant
- quickly see price, trust, availability, and role
- recover from no-results situations

5.19 Professional-side requirements for search
Professionals need:
- clear understanding that taxonomy, profile quality, reviews, and conversion matter
- clarity on how plan level influences visibility without making promises of guaranteed top placement
- ability to enrich their profile within allowed structures

5.20 Admin-side requirements for search
Admin needs:
- limited editorial curation controls
- ability to create featured collections
- ability to review search quality problems
- ability to adjust or override category landing experiences
- ability to monitor abuse/spam/low-quality supply

5.21 System/backend requirements for search
The system should support:
- indexed searchable fields
- ranking logic with weighted fields
- filterable taxonomy fields
- filterable numeric fields like price/rating/availability
- autocomplete index or endpoint
- no-results fallback logic
- editorial collections tables/config
- search analytics instrumentation

5.22 Implementation notes for search
- Keep tags in the index but out of the main filter UI.
- Weight taxonomy and service title heavily.
- Weight biography and tags more lightly.
- Build search analytics from day one.
- Keep ranking weights configurable.
- Avoid giant filter panels in the MVP.

5.23 AI coder instructions â€” search
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
--------------------------------------------------------------------
SECTION 6 â€” SEARCH CARDS, PROFILE CARDS, AND DISCOVERY UX
--------------------------------------------------------------------

6.1 Card richness rule
Search cards should be richer than minimal cards, but still clean.
The goal is not to make them minimalistic to the point of low information.
The goal is to make them information-rich but well designed.

6.2 Card design principle
Card content should be:
- scannable
- premium-feeling
- visually clean
- non-chaotic
- helpful for decision-making

6.3 What the card should show in MVP
The search card should show:
- professional photo
- professional name
- profession / subcategory
- main specialty
- starting price
- rating
- next availability preview
- relevant badge(s)
- important trust/commercial signals that fit without clutter

6.4 What should not appear on the card in MVP
Do not overexpose:
- service-type labels like one-off / monthly / recurring on the search card
- too many tags
- giant blocks of explanatory text
- too many micro-metrics

6.5 Price presentation on card
Price should be shown on the search card.
It should be shown in the userâ€™s chosen currency.
This is very important.

Examples:
- From Â¥8,500
- From Â£40
- A partir de R$200

6.6 Tier/card visual differentiation
Cards should have subtle differentiation by tier, not aggressive redesigns.

Basic
- standard card

Professional
- badge
- light visual enhancement

Premium
- premium badge
- stronger but still tasteful visual emphasis

6.7 Why subtle differentiation matters
This gives professionals real value without making the results page feel like ads.

6.8 Featured placement signaling rule
Normal tier influence does not require explicit â€œfeaturedâ€ labeling.
But truly featured/campaign placements should be signaled visually.

6.9 Profile CTAs
On the professional profile page, the platform should support:
- primary CTA: Book / Reservar
- secondary CTA: Message / Mandar mensagem
- additional CTA when applicable: Request booking

6.10 Profile availability preview
The profile page should show a preview of availability near the top.
The actual slot selection should happen only after service and duration selection.

6.11 Booking flow implication
The actual booking flow order should be:
1. user sees profile and general context
2. user selects service
3. user selects duration/format
4. user selects actual eligible slot
5. user reviews summary
6. user pays

6.12 Service presentation on profile in MVP
In the MVP, services on the profile can be shown in a relatively simple list rather than a sophisticated comparison grid.
However, each service entry still needs enough clarity to show:
- service name
- price
- duration
- short description
- service type context where relevant

6.13 User-side requirements for cards/profiles
Users should be able to:
- understand what the professional does quickly
- see price without opening blind
- assess credibility quickly
- move from discovery to booking with low friction

6.14 Professional-side requirements for cards/profiles
Professionals need:
- clean representation of their role and main specialty
- fair opportunity to stand out via quality and tier
- visibility into how their profile completeness affects discovery

6.15 Admin-side requirements for cards/profiles
Admin should be able to:
- control badges shown
- control featured placements
- moderate misleading claims or design abuse
- maintain a coherent, non-spammy discovery environment

6.16 System/backend requirements for cards/profiles
The backend and front-end should support:
- card-level computed price in user-selected currency
- badge eligibility flags
- next-availability preview
- structured profile rendering
- lightweight featured placement tagging

6.17 Implementation notes for cards/profiles
- Keep the card flexible enough for future additions, but lock the MVP card into a disciplined layout.
- Do not expose every possible service nuance on the card.
- Reserve deeper explanation for the profile page.

6.18 AI coder instructions â€” cards/profiles
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
--------------------------------------------------------------------
SECTION 7 â€” TRUST SIGNALS, REVIEWS, BADGES, AND CREDIBILITY
--------------------------------------------------------------------

7.1 Badge strategy
Muuday should have a moderate badge system.
Not too few, not too many.

7.2 Badge categories that matter
- verification / trust
- operational status
- tier plan
- service model availability
- response or quality signals

7.3 Example badges already aligned with prior decisions
- Verified
- Payment configured
- Fast response
- Professional
- Premium
- Recurrence available
- Monthly plan available

7.4 Reviews in MVP
Reviews should be in the MVP.
This includes:
- rating
- visible textual review

7.5 One-review-per-client-per-professional rule
A client can leave only 1 review per professional.
That review can later be edited after future completed sessions.

7.6 Why this review model is good
This avoids:
- review spam
- one customer flooding many repeated reviews
- artificially inflated review counts from one relationship

It still allows long-term experience updates.

7.7 Review eligibility rule
A user can only review after a completed session.

7.8 Review edit rule
After additional completed sessions, the existing review can be edited.
This should update:
- rating
- text
- timestamp of latest update

7.9 Professional response to review
Professionals can post one public response.
The response can be revised when the review changes.
This response is subject to moderation/reporting.

7.10 Review moderation/removal rule
The client can request removal.
Admin makes final removal/visibility decisions.
If the review is edited, the professional should be alerted and allowed to update their response.

7.11 Public review vs private feedback
Muuday should have both:
- public review layer
- optional private feedback layer

The private feedback is optional for the client.
It helps quality and operations but does not need to be mandatory.

7.12 Categories sensitive to regulation/trust
Sensitive categories need extra trust handling.
Examples may include:
- medical-style consultative professionals
- psychologists
- accountants or regulated advisory roles

7.13 Sensitive category verification rule
For sensitive categories, verification may include:
- credential upload
- manual review
- verified badge after approval

However, Muuday must also be very careful about service framing.

7.14 Critical compliance/product positioning rule for sensitive categories
If a service is not legally acting as regulated practice, the platform must not imply that it is.
For example, where appropriate, the service may need to be framed as:
- consultative guidance
- informational support
- advisory service
not as formal regulated practice, prescription, or jurisdiction-crossing authority where that is not allowed.

7.15 Disclaimer strategy for sensitive categories
Disclaimers should appear:
- on the profile (short form)
- in checkout (clearer confirmation)

This is not only a legal idea; it is also a product clarity requirement.

7.16 â€œVerifiedâ€ filter rule
Verified status should appear as badge/signal.
It should not become a dedicated search filter in the MVP.

7.17 User-side requirements for trust layer
Users should be able to:
- see whether someone is verified or premium or responsive
- read reviews
- distinguish high-trust profiles
- understand service scope, especially in sensitive categories

7.18 Professional-side requirements for trust layer
Professionals should be able to:
- see how they can earn trust signals
- upload verification where required
- respond to reviews once
- understand category-specific disclaimers and restrictions

7.19 Admin-side requirements for trust layer
Admin must be able to:
- review credentials
- assign/remove badges
- moderate reviews and responses
- enforce naming/claim rules in sensitive categories
- review misleading profile claims

7.20 System/backend requirements for trust layer
The system should support:
- rating aggregates
- single review per client-professional pair
- editable review with latest update timestamp
- one public professional response
- moderation flags and visibility states
- verification badge states
- category-specific disclaimer flags

7.21 Implementation notes for trust layer
- Keep trust signals visible but not overloaded.
- Treat sensitive category wording as a governance problem, not just a copy problem.
- Make sure review editing and response updating preserve audit trail.

7.22 AI coder instructions â€” trust/reviews
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
--------------------------------------------------------------------
SECTION 8 â€” FAVORITES, REBOOKING ENTRY POINTS, AND LIGHT RETENTION FEATURES
--------------------------------------------------------------------

8.1 Favorites
Users can favorite/save professionals in the MVP.
This supports:
- later return
- shortlist behavior
- comparison behavior
- low-friction retention

8.2 Rebooking
Muuday should support rebooking.
At minimum, the user should be able to click something like â€œbook againâ€ from a prior booking and have the flow prefilled with:
- same professional
- same service
- same duration
Then the user chooses a new slot and proceeds.

8.3 Recurring suggestion variant
For recurring-friendly use cases, the rebooking layer may also suggest a similar pattern or prior recurring schedule, without forcing it.

8.4 Why favorites and rebooking matter
They lower the cost of repeat behavior, which matters heavily in:
- psychologists
- accountants
- tutoring/coaching
- follow-up consultative work

8.5 User-side requirements
Users should be able to:
- save professionals
- view saved professionals later
- rebook without rebuilding everything from zero

8.6 Professional-side requirements
Professionals benefit from:
- easier return traffic
- more repeat booking
- more visible relationship continuity

8.7 Admin/system requirements
The system should support:
- favorites relation table
- quick access lists
- booking prefill helpers
- analytics around save/favorite and rebooking behavior

8.8 AI coder instructions â€” favorites/rebooking
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
--------------------------------------------------------------------
SECTION 9 â€” PROFESSIONAL GO-LIVE, PUBLISHING, AND FIRST REVIEW GATE (HIGH LEVEL)
--------------------------------------------------------------------

9.1 First go-live rule
A professional does not go live automatically the first time.
The first publication should pass through a light admin review.

9.2 Why this exists
This helps prevent:
- obvious spam
- poor quality profiles
- miscategorized professionals
- misleading regulated claims
- confusing services

9.3 What happens after first approval
After the first approval:
- lighter changes can go live quickly
- only more structural or risky changes need review

9.4 Required journey at high level
Before first go-live, a professional should at minimum have:
- account created
- taxonomy selected properly
- photo and core profile fields
- at least one service
- pricing/duration defined
- availability configured
- plan selected
- billing basics configured
- payout onboarding prepared enough for first booking logic

Full onboarding detail is covered in a later part, but this part establishes the top-level rule.

9.5 User-side implication
Users should feel that listed professionals are not entirely unreviewed raw submissions.

9.6 Professional-side implication
Professionals should understand:
- first publication requires review
- later updates are less rigid
- structural changes may still trigger moderation

9.7 Admin-side implication
Admin needs:
- a manageable review queue
- ability to approve, reject, or request edits
- ability to identify misleading titles/claims/taxonomy misuse

9.8 System/backend requirements
Need support for:
- publishing status
- review status
- change type classification
- admin notes
- resubmission states

9.9 AI coder instructions â€” go-live
Unified instructions for any AI coding/design/system assistant
- Implement with modular domain boundaries and explicit interfaces.
- Keep core rules deterministic, typed, and validated server-side.
- Document state transitions, edge cases, and failure/recovery behavior.
- Prioritize auditability, timeline traceability, and role-based permissions.
- Keep generated solutions cost-effective, maintainable, and low-complexity.
- Do not hardwire provider-specific assumptions into core domain logic.
--------------------------------------------------------------------
SECTION 10 â€” MINIMUM ANALYTICS SIGNALS RELEVANT TO THIS PART
--------------------------------------------------------------------

10.1 Why analytics matters here
Search, profile quality, and monetization cannot be improved later if discovery and trust interactions are not tracked now.

10.2 Discovery/search events relevant to this part
Minimum events:
- search_opened
- search_query_submitted
- filter_applied
- result_clicked
- professional_profile_viewed
- service_viewed
- favorite_added

10.3 Why these matter
These events help answer:
- which searches fail
- which filters matter
- which professionals get clicks but not bookings
- which categories need better supply
- which card/profile designs convert better

10.4 Plan/visibility events relevant to this part
- professional_signup_started
- professional_profile_completed
- professional_submitted_for_review
- professional_published
- plan_selected
- trial_started

10.5 Trust/review events relevant to this part
- review_prompt_shown
- review_submitted
- private_feedback_submitted

10.6 System/backend requirements for analytics
- consistent event schema
- event names documented
- user role attached where relevant
- professional ID / category / tier context attached when relevant
- currency/search context where relevant

--------------------------------------------------------------------
SECTION 11 â€” SUMMARY OF FINAL DECISIONS COVERED IN THIS PART
--------------------------------------------------------------------

11.1 Taxonomy summary
- Hierarchy is Category > Subcategory > Specialty > Tag.
- Category/subcategory/specialty are controlled by Muuday.
- Tags are flexible and professional-added within limits.
- Tags do not become filters.
- Tags do participate in search.
- Professionals can suggest specialties for approval.

11.2 Tier summary
- 3 plans: Basic, Professional, Premium.
- Annual plan exists with 15% discount.
- 3 months free for signup.
- Tier affects operations, growth, monetization, and search visibility.
- Tier influence on ranking is moderate, not dominant.

11.3 Limits summary
- Booking window: 60 / 90 / 180 days
- Services: 3 / 10 / 20
- Options per service: 3 / 6 / 10
- Specialties: 2 / 3 / 5
- Tags: 3 / 5 / 10

11.4 Search summary
- Filters: category, subcategory, specialty, price, availability, language, rating minimum
- No service-type filter in MVP
- Tags enrich search, not filters
- Search supports free text plus structured filters
- Sort options: relevance, price, rating, next availability
- Autocomplete exists in basic form
- No-results experience should suggest alternatives

11.5 Discovery/card summary
- Card is rich but clean
- Price appears on card in user-selected currency
- Card shows key trust/commercial signals, but not too much noise
- Service-type labels do not appear on the search card in MVP

11.6 Trust summary
- Reviews are in MVP
- One review per client-professional pair
- Review can be edited later
- Professional can respond once publicly
- Sensitive categories need special wording, review, and disclaimers
- Verified is badge-level, not a search filter in MVP

11.7 Favorites/rebooking summary
- Favorites exist in MVP
- Rebooking exists and reuses prior context

11.8 Go-live summary
- First live publication requires light admin review
- Later changes are more flexible

--------------------------------------------------------------------
SECTION 12 â€” WHAT THIS PART DOES NOT YET FULLY SPECIFY
--------------------------------------------------------------------

The following areas are intentionally left to later parts:
- exact booking state machine transitions at the event level
- payment collection and Stripe model detail
- refund/reversal logic detail
- payout timing implementation detail
- recurring billing operational detail
- session/video provider final decision and its runtime flows
- full notification orchestration
- admin case queue detail
- compliance wording final drafts

These will appear in later parts so this part can remain focused and actionable.

--------------------------------------------------------------------
END OF PART 1
--------------------------------------------------------------------


