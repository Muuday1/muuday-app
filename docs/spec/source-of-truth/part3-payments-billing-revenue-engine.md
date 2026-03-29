
MUUDAY — PART 3
PAYMENTS, BILLING, STRIPE/CONNECT, REFUNDS, DISPUTES, PAYOUTS, FX, LEDGER, AND REVENUE OPERATIONS
Version: Working Consolidation
Status: Consolidated from the decision process
Purpose of this part: Define how money moves through Muuday for users, professionals, and the platform, including one-off bookings, recurring/monthly services, professional subscription plans, refunds, disputes, and payouts.

IMPORTANT READING NOTE
This document is intentionally explicit. It does not assume anything is already documented somewhere else.
Every major rule is restated in practical language and translated into:
1. product behavior
2. technical behavior
3. admin behavior
4. implementation guidance
5. AI-coder instructions

This part should be read together later with:
- Part 1: Foundations, taxonomy, tiers, search, trust
- Part 2: Professional onboarding, availability, booking lifecycle
- Part 4: Admin ops, moderation, notifications, exception handling
- Part 5: Video/session execution, future decisions, open questions, and post-MVP suggestions


==================================================
SECTION 1 — EXECUTIVE SUMMARY
==================================================

Muuday’s commercial model is a marketplace where:

- Muuday is the platform customers pay.
- Professionals are service providers receiving payouts from Muuday.
- Muuday charges the client first, then repasses money to the professional later.
- Muuday uses a delayed payout model to protect against cancellation, no-show, dispute, and payout risk.
- The customer sees a final total, not an internal fee breakdown.
- Professionals pay their own platform subscription after a 3-month free period.
- The platform must support:
  - one-off services
  - one-off + recurring services
  - monthly service models
- The platform must support international customers and mostly Brazil-based professionals.

The preferred payment architecture is:
- Muuday UK company as platform entity
- Stripe as primary payments provider
- Stripe Connect for marketplace flows
- Stripe Billing for professional subscriptions and recurring client subscriptions where relevant
- Separate Charges and Transfers as the preferred funds flow
- Express-style / hosted connected account onboarding for professionals
- Customer-facing localized pricing where possible
- Professional payout delayed and released under Muuday’s payout rules

Critical caveat:
The UK-platform-to-Brazil-professional payout architecture must be validated directly with Stripe because cross-border Connect behavior is not universally self-serve and may require a specific supported corridor or alternative structure.

This document therefore contains:
- final decisions already made
- implementation guidance based on those decisions
- clearly marked validation requirements where an external platform confirmation is still needed


==================================================
SECTION 2 — FINAL DECISIONS ALREADY MADE
==================================================

2.1 Platform entity and region
Decision:
- Preferred platform entity: UK
- Professionals are mostly in Brazil
- Customers can pay from anywhere (example given: Japan)
- Goal: customer pays Muuday UK; only the professional share is sent toward Brazil

Important note:
- This requires direct validation with Stripe because standard Connect region behavior may not automatically support every UK-platform-to-Brazil-connected-account payout configuration.
- If Stripe does not support the desired corridor directly in the needed way, fallback architecture must be considered.

2.2 Marketplace commercial model
Decision:
- Muuday charges the customer
- Muuday repasses to the professional later
- Muuday is effectively the customer-facing collecting platform

2.3 Charge timing before confirmation
Decision:
- Charge at booking time
- If the booking cannot proceed, refund as needed
- Do not rely on pure card authorization/hold as the main model

2.4 Payout timing to professionals
Decision:
- Professional payout becomes eligible 48 hours after the end of the session
- If there is a dispute, payout remains paused
- Weekly payout cycle
- Minimum payout amount: BRL 100 equivalent
- If minimum is not reached, amount rolls over to the next payout cycle

2.5 Cancellation and no-show economics
Decision:
- Hybrid rule
- Muuday keeps an economic share in retained value scenarios, not simply passing everything to the professional
- Details of actual cancellation policy were already defined elsewhere and should be enforced consistently
- No-show and professional-fault cases are treated differently from client-fault cases

2.6 Stripe funds flow
Decision:
- Preferred model: Separate Charges and Transfers

2.7 Connected account type
Decision:
- Use the lighter hosted account approach (Express-style logic in product terms)
- Keep onboarding and compliance burden manageable
- Give professionals visibility into earnings/payouts without exposing too much platform-critical control

2.8 Professional subscription model
Decision:
- 3 months free for signup
- Then card-on-file monthly billing
- If billing fails:
  - 7-day grace period
  - existing bookings continue
  - new bookings get blocked after grace
  - if unresolved, profile becomes paused/inactive

2.9 Customer fee model
Decision:
- Customer-facing fee logic is: 8% plus payment processing cost
- Customer sees only the final total
- No fee breakdown is shown in checkout

2.10 Refund destination
Decision:
- Refunds go back to the original payment method
- No platform wallet/credit as default refund destination in MVP

2.11 Payment methods at launch
Decision:
- Cards
- Apple Pay
- Google Pay
- Link
- PayPal

2.12 Currency model
Decision:
- Default marketplace base currency for professional cataloging: BRL
- Exception allowed for professionals outside Brazil when appropriate and approved
- Customer sees and pays in the user’s chosen currency, generally local currency
- Muuday manages the FX/price localization logic

2.13 KYC / payout onboarding timing
Decision:
- Professional may build profile and appear
- Professional must complete required Stripe/payout onboarding before accepting the first reservation

2.14 Receipts and taxes
Decision:
- “B light” approach:
  - Muuday provides payment receipt/comprobante
  - professional remains responsible for local tax obligations as applicable
  - deeper Stripe Tax/Connect tax automation is phase 2, not MVP

2.15 Risk responsibility
Decision:
- Hybrid approach
- Platform absorbs some processor/platform-side risk
- Professional absorbs clearly professional-fault cases
- Ambiguous cases go to admin review

2.16 Evidence model
Decision:
- Evidence hierarchy:
  1. platform logs
  2. platform messages
  3. proof of presence/absence
  4. screenshots/external evidence as supporting material
  5. checkout policy disclosure as persistent evidence

2.17 Manual financial actions
Decision:
- Only Muuday/admin executes:
  - manual refund
  - partial refund
  - adjustment
  - credit/manual override

2.18 Customer payment method saving
Decision:
- Save payment method with opt-in
- Saved method is for easier future checkout/rebooking
- No off-session surprise charging in MVP

2.19 Recurring/monthly renewal logic
Decision:
- Auto-renew by default
- Customer can turn off auto-renew
- Ending auto-renew means current cycle continues and next cycle does not renew
- Failed renewal does not confirm the next cycle
- Recurring future slots can be provisionally reserved under the recurring model but not fully confirmed financially until payment rules are satisfied

2.20 Professional debt recovery
Decision:
- If professional owes money to Muuday:
  - recover from future payouts first
  - then attempt to charge card on file
  - if unresolved, block/inactivate profile

2.21 Promotional economics
Decision:
- If Muuday created the promotion, Muuday funds it
- If the professional created the promotion, the professional funds it
- Co-funded campaigns allowed
- Referral and coupon do not stack on the same purchase

2.22 Financial visibility
Decision:
- Customer sees final total and simple receipt history
- Professional sees net by default with expandable breakdown
- Export basic financial data in MVP

2.23 Analytics
Decision:
- There must be a minimum required analytics set from MVP
- Search, booking, conversion, recurring revenue, payout, and trust events must be tracked


==================================================
SECTION 3 — CORE PAYMENT ARCHITECTURE
==================================================

3.1 Recommended money architecture
The intended architecture is:

CUSTOMER
    pays Muuday platform
        |
        v
MUUDAY PLATFORM ACCOUNT (preferred UK entity)
    holds charge
    applies Muuday economics
    holds funds during booking/dispute window
    creates later transfer to connected professional
        |
        v
CONNECTED PROFESSIONAL ACCOUNT
    receives payout later via payout schedule

Why this matters:
- It allows Muuday to control cancellation, no-show, delayed payout, disputes, and partial reversals
- It fits the decision that Muuday charges the customer and only later repasses funds to the provider
- It prevents over-reliance on purely immediate pass-through settlement

3.2 Why Separate Charges and Transfers fits Muuday
Muuday needs:
- customer charged before final service completion
- payout delayed until after the session and dispute window
- refund and reversal control
- ability to handle no-show and hybrid economics
- cleaner central ledger logic
- strong admin control in MVP

Separate Charges and Transfers fits because:
- the initial charge belongs to the platform side
- the transfer is a second controlled action
- payout can be delayed until business conditions are met

3.3 Why not rely on “direct professional collection”
Muuday explicitly did not choose:
- professional as primary seller of record in the user experience
- professional controlling customer charge directly

Reason:
- it weakens the marketplace’s ability to handle:
  - cancellation policy enforcement
  - no-show economics
  - centralized dispute handling
  - consistent UX
  - consistent receipts
  - recurring cross-border product behavior

3.4 Critical external validation requirement
Before fully locking production architecture, Muuday must validate with Stripe:

VALIDATION PACKET TO SEND TO STRIPE
- Platform entity: UK
- Customers pay globally (example: Japan, UK, Europe, US, etc.)
- Professionals are mostly in Brazil
- Muuday wants to:
  - charge customers on Muuday platform
  - keep platform fees
  - later pay the professional’s share in Brazil
- Marketplace uses:
  - one-off service bookings
  - recurring/monthly service cycles
  - delayed payout after service completion + 48h dispute window
- Ask Stripe:
  1. Is this corridor supported for the desired Connect model?
  2. Is Separate Charges and Transfers viable for this region combination?
  3. Is Cross-border payouts the recommended path?
  4. What restrictions apply to payout currency, payout timing, and connected account type?
  5. If not supported directly, what is Stripe’s recommended fallback structure?

If Stripe says no:
- fallback model should be documented:
  - keep Muuday UK for customer collection and primary brand layer
  - use Brazil-side payout layer/structure if necessary
  - preserve user-facing consistency while adapting backend payout architecture


==================================================
SECTION 4 — STRIPE PRODUCT MAP
==================================================

4.1 Stripe components Muuday likely needs
Primary Stripe building blocks:
- Stripe Payments
- Stripe Checkout and/or Elements
- Stripe Connect
- Stripe Billing
- Webhooks
- Stripe customer/payment method storage
- Payout scheduling controls
- Optional localized currency / FX tooling
- Optional future Stripe Tax phase 2

4.2 Recommended Stripe responsibilities by business problem

A. Customer pays for one-off booking
Use:
- Payments + Checkout/Elements

B. Customer pays for monthly/recurring service plan
Use:
- Billing and/or subscription infrastructure
- depending on how closely the recurring product is modeled as a subscription vs protected monthly cycle

C. Professional receives payout
Use:
- Connect
- Connected account onboarding
- Delayed transfer logic
- Payout schedules

D. Professional pays Muuday monthly plan
Use:
- Billing for professional subscription
- Card on file
- Trial/waiver logic

E. Manual disputes/refunds/reversals
Use:
- Platform-controlled financial actions
- Connect reversal logic when needed

F. Saved customer methods
Use:
- Payment method save with explicit opt-in

G. International pricing
Use:
- Currency localization / FX logic
- controlled carefully against Muuday’s pricing rules


==================================================
SECTION 5 — PAYMENT FLOWS BY PRODUCT TYPE
==================================================

5.1 One-off booking payment flow

BUSINESS FLOW
1. User selects professional
2. User selects service
3. User selects duration/format
4. User selects time slot
5. User sees review page
6. User accepts key policies
7. User pays
8. Booking becomes:
   - confirmed immediately if professional uses auto-accept
   - pending professional acceptance if professional uses manual-accept
9. Funds remain under platform control
10. Session happens
11. After session end + 48h with no dispute, amount becomes payout-eligible
12. Weekly payout cycle pays professional if threshold is met

FINANCIAL RULES
- Customer is charged in full upfront
- Muuday retains economic control until payout is triggered
- Professional is not immediately paid
- Cancellation/no-show/refund logic can still change platform and professional outcomes before payout

TECHNICAL REQUIREMENTS
User side:
- can see final total
- sees booking state
- sees pending vs confirmed clearly
- receives payment confirmation

Professional side:
- sees new booking or pending acceptance request
- sees whether funds are merely booked, payout-eligible, or already paid out

Admin side:
- sees full financial and operational state
- can intervene before payout when needed

Backend:
- must create immutable booking-linked financial records
- must separate booking state from payout state
- must store charge, transfer, refund, reversal, dispute, and payout relations

5.2 One-off booking with manual-accept professional

BUSINESS FLOW
1. User pays
2. Booking enters pending_professional_acceptance
3. Professional has 48h to accept or decline
4. If accepted:
   - booking becomes confirmed
5. If declined:
   - user receives refund
6. If no response within 48h:
   - booking expires
   - refund issued
   - slot released

IMPORTANT UX RULE
In this state, the user must see:
- payment captured
- waiting for professional acceptance
- countdown / deadline information
- what happens if no acceptance occurs

IMPORTANT LEDGER RULE
Even when payment is captured first:
- the booking remains operationally pending
- payout logic must not treat the amount as finalized professional revenue yet

5.3 Request booking flow

BUSINESS FLOW
1. User requests a time window or waitlist/request booking
2. Professional responds with proposed slot
3. Proposed slot is reserved for 24h
4. User receives direct payment link for that exact proposal
5. If user pays in time:
   - booking is created with the proposed terms
6. If user does not pay:
   - proposal expires
   - slot returns to availability

TECHNICAL REQUIREMENTS
- proposal object separate from full booking
- expiration timestamp
- direct-link checkout object tied to proposal ID
- proposal-to-booking conversion only on successful payment

5.4 Monthly service / recurring service payment flow

Decision already made:
- Customer pays the month upfront to reserve that cycle
- Professional receives payout weekly, following Muuday payout rules and session-by-session eligibility logic

This means the “monthly product” is not just a one-time subscription with immediate provider payout.
It is:
- a monthly collected customer cycle
- with session-level payout release rules

BUSINESS FLOW
1. Customer starts recurring/monthly plan
2. Customer pays cycle amount upfront
3. Recurring sessions for that cycle are reserved under the recurring rules
4. Each actual session still matters for payout timing
5. Professional receives payout weekly as sessions clear the 48h dispute buffer
6. If later cycle renewal fails, next cycle is not confirmed

THIS IS IMPORTANT
Muuday’s recurring product has two layers:
- commercial layer: customer pays for the cycle
- operational payout layer: provider payout is still paced and risk-managed

That means the system must not naïvely pay the professional the full month at charge time.

5.5 Professional subscription plan payment flow

Decision:
- All professionals get 3 months free at sign-up
- Then platform subscription billing begins
- Card on file required
- Grace period and block logic already defined

BUSINESS FLOW
1. Professional chooses tier
2. Trial / waiver period begins
3. Professional card is collected
4. After waiver expires:
   - monthly or annual plan billing begins
5. If payment succeeds:
   - plan remains active
6. If payment fails:
   - 7-day grace period
   - existing bookings continue
   - new bookings blocked after grace
   - unresolved failure pauses/inactivates profile

TECHNICAL REQUIREMENTS
- separate billing object from marketplace payout account
- professional plan state must exist independently from booking and payout state
- plan state must influence:
  - ability to accept new bookings
  - booking window size
  - service count
  - promotional tools
  - search boost rules
  - request booking rights
  - annual discount behavior


==================================================
SECTION 6 — PRICING, FEES, TOTALS, AND WHAT USERS SEE
==================================================

6.1 Customer-visible pricing rule
Decision:
- Customer sees only the final total
- Not the internal fee breakdown

Internal formula:
base professional price
+ Muuday fee logic
+ payment processing logic
= final customer total

But:
- the exact internal breakdown is not shown to the customer in checkout

6.2 Muuday fee rule
Decision:
- Customer fee logic: 8% plus payment processing cost
- Muuday fee applies also to recurring renewals
- Same fee logic for one-off and recurring models
- Customer sees final total only

6.3 Professional-facing transparency
Decision:
- Professional sees net by default
- Can expand to full breakdown

This is the correct compromise:
- customers are not overwhelmed
- professionals still get transparency

6.4 Pricing display locations
The final localized customer price should appear consistently in:
- search cards
- profile service list
- review page
- checkout
- booking confirmation
- booking history

Technical requirement:
- no conflicting prices across steps
- if FX or localized pricing is used, conversions must remain stable enough across the funnel not to appear broken or deceptive

6.5 Annual pricing for professionals
Decision:
- Professionals can choose annual plan
- Annual discount: 15%
- This must be reflected in:
  - plan compare screen
  - billing summary
  - professional account billing area
  - renewal communications


==================================================
SECTION 7 — CURRENCIES, FX, AND INTERNATIONAL LOGIC
==================================================

7.1 Default professional pricing currency
Decision:
- BRL is the default base currency for the marketplace
- Exception exists for approved professionals based outside Brazil

Implication:
- most catalog/service prices will be internally based on BRL
- payout logic for Brazil-based professionals aligns naturally to BRL
- user-facing localization happens on top of the base price

7.2 Customer-facing currency
Decision:
- customer pays in chosen currency, usually local currency
- Muuday manages the FX/price localization layer
- customer sees final total in selected currency

7.3 Why this matters
The user may be in Japan, UK, Europe, US, etc.
The professional may be in Brazil.
Muuday needs:
- a canonical internal commercial value
- a localized customer-facing payment value
- a payout-safe professional value
- a system ledger that records all three relevant layers

7.4 Required monetary fields in the ledger
At minimum, the financial system should be able to store:

For each customer charge:
- booking_id
- product_type
- base_price_amount
- base_price_currency
- customer_display_total_amount
- customer_display_total_currency
- fx_reference if used
- platform_fee_amount_internal
- processing_cost_amount_internal
- net_professional_amount_planned
- charge_status
- charge_id
- timestamps

For each payout/transfer:
- transfer_id
- connected_account_id
- transfer_amount
- transfer_currency
- related booking/session/cycle reference
- payout batch reference
- status

For each refund:
- refund_id
- original charge reference
- refund amount
- refund currency
- reason
- who initiated
- whether connected transfer recovery is needed

7.5 User-facing consistency rule
If a customer selects a currency:
- that currency must be reflected throughout the user flow
- the system should avoid showing one currency in search and another silently in checkout unless there is a very clear reason and disclosure


==================================================
SECTION 8 — SAVED PAYMENT METHODS AND FUTURE CHECKOUTS
==================================================

8.1 Customer payment method saving
Decision:
- optional opt-in
- used for easier future checkout
- not used for surprise off-session charging in MVP

8.2 What saved methods should power
Allowed:
- faster checkout
- rebooking
- recurring signup initiation if the product flow requires it and the customer explicitly agrees
- simpler future bookings

Not allowed in MVP:
- arbitrary platform-initiated off-session charges
- post-session surprise adjustments charged without the customer present

8.3 Technical model
User side:
- save checkbox at checkout
- manage saved methods in account
- remove/update default method

System side:
- link customer record to reusable payment method references
- honor consent and payment method lifecycle rules
- maintain clear separation between “saved for future checkout” and “authorized for recurring subscription product”

8.4 Recurring nuance
For monthly recurring services:
- if the customer is actually subscribing to a recurring plan, that recurring payment agreement is part of the product flow and not a surprise off-session charge
- this must still be clearly disclosed and managed as a recurring subscription relationship


==================================================
SECTION 9 — REFUNDS, CANCELLATIONS, AND REVERSALS
==================================================

9.1 Refund philosophy
Decision:
- refunds return to original payment method
- no platform wallet default
- refund actions are admin/platform controlled in MVP

9.2 Cancellation rule interaction
Muuday already defined platform-level cancellation/no-show logic.
This part focuses on the financial implementation behavior.

General rule:
- cancellation result determines:
  - customer refund amount
  - professional earning amount
  - Muuday fee retention/adjustment
  - whether transfer exists yet
  - whether reversal is needed

9.3 Refund timing scenarios

SCENARIO A — Cancellation before transfer to professional
Simpler scenario:
- customer was charged
- professional has not yet been paid
- Muuday calculates correct retained/refund amount
- refund is issued
- professional payout-eligible amount is updated before transfer

SCENARIO B — Cancellation or adjustment after transfer was planned or partially executed
Harder scenario:
- customer refund may still need to happen
- Muuday may need to reverse or offset professional funds
- this is why the platform needs:
  - delayed payout
  - strong ledger
  - transfer recovery logic

9.4 Professional-created service failure
If professional no-shows or clearly fails:
- customer can receive refund or rebooking benefit according to Muuday rules
- professional should not receive payout for the failed session
- repeated professional failure creates internal flags and possible operational restriction

9.5 Monthly recurring partial refund scenarios
Decision:
- no automatic partial refund just because the customer wants to stop mid-cycle
- but admin may issue partial refund for future unused sessions if the professional clearly failed or dispute is resolved in the user’s favor

This means:
- recurring products need booking/session-level and cycle-level accounting
- the platform must know which sessions in a paid cycle were:
  - used
  - canceled
  - rescheduled
  - forfeited
  - still future/unused

9.6 Professional debt after refund
Decision:
- if refund/dispute/reversal creates professional debt:
  1. recover from future payouts
  2. then charge card on file
  3. if unresolved, restrict profile

This must be ledger-backed, not handled informally.


==================================================
SECTION 10 — DISPUTES, NO-SHOWS, AND EVIDENCE
==================================================

10.1 Dispute opening rights
Decision:
- both customer and professional can open disputes
- 48h window after session end
- different scope depending on who is reporting

10.2 Evidence hierarchy
Decision:
Main evidence sources:
1. platform logs
2. platform messages
3. proof of presence/absence
4. screenshots/external material as support
5. stored checkout policy acceptance

10.3 No-show handling
Already decided elsewhere, but relevant financially:
- presence logs matter
- 15-minute threshold matters
- customer late arrival consumes booked time
- no automatic time extension
- professional late arrival may create stronger customer-protective handling

10.4 Booking/session data the system must capture for disputes
Minimum:
- booking reference
- session scheduled time
- timezone data
- actual join times
- who never joined
- waiting-room events if applicable
- message history around the session
- cancellation timestamps
- reschedule timestamps
- who initiated which action
- accepted policies snapshot
- payment status
- payout eligibility status

10.5 Admin case requirement
A dispute is not just a message thread.
The system must create an internal case/ticket-style object so admin can:
- review context
- attach evidence
- decide
- trigger financial action
- record rationale
- preserve audit history

10.6 Public review vs private feedback vs dispute
These must remain separate systems:
- public review = trust / reputation layer
- private feedback = quality signal
- dispute = operational/financial resolution process


==================================================
SECTION 11 — PROFESSIONAL PAYOUT SYSTEM
==================================================

11.1 Final payout rule summary
- Session ends
- Wait 48h
- If no dispute blocking it, session becomes payout-eligible
- Weekly payout cycle runs
- Minimum payout BRL 100 equivalent
- If under minimum, amount rolls over

11.2 Why delayed payout is necessary
It protects against:
- cancellation edge cases
- disputes
- no-show
- service failure
- processor settlement surprises
- professional debt recovery needs

11.3 What the professional should understand
Professionals should not think:
“I get paid as soon as the customer pays.”

They should understand:
- customer payment confirms commercial intent
- payout follows Muuday’s operational completion rules

This must be explained:
- in onboarding
- in professional billing docs
- in the earnings UI
- in payout FAQs
- in admin-support macros

11.4 Professional-facing payout statuses
Recommended statuses:
- Pending
- Awaiting session completion
- In dispute hold
- Payout eligible
- Scheduled for payout
- Paid out
- Payout failed
- Offset/recovered against platform debt

11.5 Minimum payout and rollovers
Decision:
- if eligible amount is below BRL 100 equivalent
- amount accumulates for the next weekly cycle
- nothing is lost
- it remains visible in the professional account

11.6 Payout failure logic
Decision:
- payout failure triggers alert
- funds remain retained
- existing bookings continue
- professional has 7 days to fix payout issue
- if unresolved, new bookings are blocked

This is operationally separate from professional monthly subscription failure, though they may sometimes overlap.


==================================================
SECTION 12 — PROFESSIONAL SUBSCRIPTION BILLING
==================================================

12.1 Professional plans and billing cycle
Muuday has:
- Basic
- Professional
- Premium

Billing choices:
- monthly
- annual with 15% discount

12.2 Trial/waiver logic
Decision:
- 3 months free
- applies at signup/publication stage
- the plan selected during onboarding gets the waiver

12.3 When tier is chosen
Decision:
- professional effectively starts from a Basic/default path
- plans are shown early
- final plan choice is confirmed near go-live
- 3-month free period applies to the chosen plan

12.4 Upgrade/downgrade behavior
Decision:
- upgrade applies immediately
- downgrade applies next cycle

12.5 Pause/cancel logic for professional plan
Decision summary from earlier discussions:
- professionals can pause profile
- paused profile means no new bookings
- monthly billing can pause with the profile under Muuday’s plan rules
- basic plan has a 60-day booking window
- canceling plan means:
  - cancel at end of current cycle
  - block new bookings
  - existing future bookings continue
  - after final commitments are done, profile becomes inactive

12.6 Failed professional plan charge
Decision:
- grace period 7 days
- existing bookings continue
- new bookings blocked
- if unresolved, profile inactive/paused

12.7 Billing UI requirements for professionals
Professional billing area should show:
- current tier
- monthly vs annual
- trial status / free period end date
- next charge date
- current card
- failed payment alerts
- grace period status
- upgrade/downgrade actions
- pause/cancel status

12.8 Admin requirements
Admin should be able to see:
- professional billing state
- tier history
- trial start/end
- failed charges
- grace period
- downgrade pending
- cancellation at period end
- linked payout account status separately


==================================================
SECTION 13 — MONTHLY CLIENT PLANS / RECURRING CLIENT BILLING
==================================================

13.1 Supported service models
Muuday supports:
- one-off
- one-off + recurring
- monthly subscription service

13.2 Renewal behavior
Decision:
- auto-renew by default

13.3 Turning off renewal
Decision:
- customer can disable auto-renew
- current cycle continues
- next cycle does not start
- customer may re-enable before period end if still in the correct state

13.4 Renewal failure
Decision:
- next cycle stays pending
- new cycle sessions are not financially confirmed until payment succeeds

13.5 Reserved recurring slots
Decision:
- future recurring slots may be protected/reserved
- nobody else can take those slots during the reservation protection period
- if payment is not completed by the release rule:
  - slots release according to the previously chosen timing logic

13.6 Pause by customer
Decision:
- customer may request pause for one cycle
- professional must be able to accept/refuse
- if refused, customer may end auto-renew and stop after current cycle

13.7 Monthly product payout logic
Critical rule:
Even if customer pays the full month upfront:
- professional is not immediately paid the entire month
- payouts are still released weekly based on the sessions clearing Muuday’s post-session protection rules

This must be crystal clear in implementation.
Otherwise the system will mismatch:
- customer cycle logic
- service delivery logic
- payout safety logic

13.8 Monthly plan pricing change
Decision:
- professional can change future plan pricing
- customer gets notice
- already paid cycle never changes
- if customer does not accept new price, plan does not renew

13.9 Monthly plan scope change
Decision:
- scope may change into the next cycle
- must be communicated with notice
- current cycle does not change retroactively


==================================================
SECTION 14 — RECEIPTS, HISTORY, EXPORTS, AND WHAT EACH PARTY SEES
==================================================

14.1 Customer side
Customer financial area (basic MVP) should include:
- payments
- refunds
- booking statuses
- receipts/comprovantes
- value paid
- currency
- date
- status
- refund status if applicable

Customer should NOT see:
- Muuday fee breakdown
- processing cost breakdown
- internal margin logic

14.2 Professional side
Professional financial area (basic MVP) should include:
- earnings
- payouts
- booking-linked earnings
- adjustments
- refunds/reversals that affect them
- professional subscription charges
- current balance / pending / eligible / paid out status

Professional sees:
- net by default
- expandable breakdown:
  - gross charged
  - Muuday fee
  - processing cost
  - payout-eligible amount
  - actual payout amount
  - refunds/reversals/adjustments

14.3 Admin side
Admin should see the full picture:
- charge records
- booking references
- customer status
- professional status
- refund history
- transfer history
- payout batch status
- debt/offset logic
- dispute linkage
- receipt status
- manual adjustment history

14.4 Receipts delivery
Decision:
- email receipts automatically
- also available inside the platform

14.5 Exports
Decision:
- export basic in MVP
- professional gets basic financial export
- admin gets richer export if possible
- customer does not need export in MVP

Recommended MVP export fields for professionals:
- booking ID
- date
- customer name or booking reference-safe field
- service
- currency
- gross amount
- fees
- net
- payout status
- payout date if paid

Recommended MVP export fields for admin:
- everything above
- plus payout account, dispute flags, refund IDs, transfer IDs, processor references


==================================================
SECTION 15 — PROMOTIONS, REFERRALS, AND THEIR MONEY LOGIC
==================================================

15.1 Cupons in MVP
Decision:
- yes
- Muuday can create
- Professional can create if tier allows
- Basic does not get its own coupon system
- Professional gets basic coupon tools
- Premium gets more flexible coupon tools

15.2 Referral and coupon stacking
Decision:
- no stacking
- one promotional benefit per purchase

15.3 Promotion funding responsibility
Decision:
- promotion created by Muuday = funded by Muuday
- promotion created by professional = funded by professional
- co-funded allowed

15.4 Referral reward structure
Decision:
- customer side can receive credit-style benefit
- professional side can receive waived months / free months
- platform should not assume all incentives behave the same way

15.5 Technical implication
Every promo application must store:
- promo source
- promo owner
- platform-funded amount
- professional-funded amount
- resulting customer discount
- effect on payout
- whether this promo consumed the slot for promo stacking rules


==================================================
SECTION 16 — REQUIRED INTERNAL LEDGER MODEL
==================================================

16.1 Why Muuday needs its own ledger
Stripe data is not enough to drive the whole product correctly.
Muuday needs its own ledger because it must understand:
- booking lifecycle
- session lifecycle
- transfer eligibility
- refunds
- partial reversals
- recurring monthly cycle logic
- professional debt recovery
- promotional funding responsibility
- payout batches
- what each user sees in product

16.2 Minimum ledger concepts
Recommended internal ledger entities:

A. Charge record
Represents the customer payment transaction

B. Booking financial record
Represents the platform’s business interpretation of that charge for a specific booking or cycle

C. Session earning record
Represents payout eligibility for a specific completed session

D. Transfer record
Represents amount assigned to professional connected account

E. Payout record
Represents bank payout batch/result

F. Refund record
Represents customer money returned

G. Reversal/offset record
Represents recovery from professional share when needed

H. Professional subscription billing record
Represents Muuday plan billing, separate from customer bookings

16.3 Why session-level earning records matter
Because Muuday decided:
- customer can pay a monthly cycle upfront
- but professional is paid session-by-session/weekly after 48h protection

Without session-level earning records, recurring monthly revenue becomes impossible to reconcile cleanly.

16.4 Ledger design principles
- append-friendly, not destructive
- every movement explainable later
- human-readable admin trace
- UI-friendly summaries layered on top
- money amounts stored with explicit currency
- separate commercial state from bookkeeping state


==================================================
SECTION 17 — FINANCIAL STATE MACHINE AND RELATIONSHIP TO BOOKING STATES
==================================================

17.1 Booking state is not enough
Muuday already decided to use an internal state machine for bookings.
Financial state must not be collapsed into booking state.
For example:
- booking can be confirmed
- but payout not yet eligible
- or refund partially issued
- or dispute open
- or transfer already made but payout failed

17.2 Recommended financial status dimensions
At minimum, keep separate state families:

A. Charge status
- not_started
- pending
- succeeded
- failed
- refunded_partial
- refunded_full

B. Acceptance status
- not_required
- pending_professional_acceptance
- accepted
- declined
- expired

C. Service completion status
- scheduled
- in_progress
- completed
- no_show_user
- no_show_professional
- canceled
- rescheduled

D. Payout eligibility status
- not_eligible
- waiting_48h_window
- dispute_hold
- eligible
- transferred
- payout_sent
- payout_failed
- reversed_or_offset

E. Dispute status
- none
- open
- under_review
- resolved_user_favor
- resolved_professional_favor
- resolved_split
- escalated

17.3 Why this is important
This state separation enables:
- correct UI simplification
- correct admin reasoning
- correct exports
- correct automation triggers
- correct professional earnings visibility


==================================================
SECTION 18 — ANALYTICS AND EVENTS REQUIRED FROM MVP
==================================================

18.1 Decision
Yes, Muuday must define minimum required analytics from MVP.

18.2 Why
Without a minimum event set, the platform cannot later improve:
- search relevance
- ranking
- funnel conversion
- rebooking
- recurring conversion
- professional quality scoring
- monetization

18.3 Minimum event groups

DISCOVERY / SEARCH
- search_opened
- search_query_submitted
- filter_applied
- sort_changed
- result_clicked
- professional_profile_viewed
- service_viewed
- favorite_added

BOOKING
- slot_selected
- booking_review_viewed
- checkout_started
- payment_succeeded
- payment_failed
- booking_confirmed
- booking_pending_professional_acceptance
- booking_accepted
- booking_declined
- booking_expired
- booking_canceled
- booking_rescheduled
- booking_completed
- no_show_user
- no_show_professional

RECURRING / SUBSCRIPTIONS
- recurring_plan_started
- recurring_renewal_succeeded
- recurring_renewal_failed
- recurring_auto_renew_disabled
- recurring_pause_requested
- recurring_pause_approved
- recurring_pause_rejected
- recurring_resumed

POST-SESSION / TRUST
- review_prompt_shown
- review_submitted
- review_edited
- professional_review_response_submitted
- private_feedback_submitted
- dispute_opened

PROFESSIONAL / REVENUE
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

18.4 Required attributes for events
At least where relevant:
- user_id / professional_id / booking_id / service_id
- tier
- category
- subcategory
- specialty
- country/timezone
- payment method family
- currency
- price band
- experiment flags if any
- acquisition channel if available


==================================================
SECTION 19 — WHAT USER, PROFESSIONAL, ADMIN, AND BACKEND EACH NEED
==================================================

19.1 User side requirements

User must be able to:
- see final price in chosen currency
- review booking before payment
- accept key policies
- pay with supported methods
- understand pending professional acceptance if applicable
- understand refunds and cancellation effects
- disable recurring auto-renew
- request pause when applicable
- see receipts and booking history
- use saved payment methods for easier future checkout
- understand no-show/late rules
- understand monthly plan renewal state

User must NOT be burdened with:
- internal fee breakdown
- payout logic
- processor complexity
- connected account complexity

19.2 Professional side requirements

Professional must be able to:
- connect payout account
- understand 3-month free plan logic
- understand plan billing
- see earnings and payouts
- understand that customer payment does not equal immediate payout
- choose auto-accept vs manual-accept
- see pending acceptance bookings
- understand when funds become payout-eligible
- understand debt recovery if refunds/disputes create negative balance conditions
- export history
- manage coupons if tier allows
- respond to reviews
- understand recurring plan commercial behavior

Professional must NOT be able in MVP to:
- directly execute manual refunds
- override platform financial decisions freely
- create uncontrolled tax or payment structures outside Muuday rules

19.3 Admin side requirements

Admin must be able to:
- see full booking and financial status
- review professional onboarding and publication
- review disputes
- execute refunds and adjustments
- see payout holds and payout failures
- see professional billing state
- see debt/offset state
- see recurring cycle issues
- see search/quality/review signals
- use a case queue for exceptions
- export data

19.4 Backend/system requirements

System must:
- separate booking and finance states
- maintain own ledger
- integrate with Stripe webhooks robustly
- support idempotent money flows
- support retry-safe event processing
- preserve snapshots of accepted policies and pricing context
- handle localized currency display safely
- support recurring cycles without corrupting payout logic
- support session-level payout eligibility
- support admin overrides with audit trail


==================================================
SECTION 20 — IMPLEMENTATION NOTES
==================================================

20.1 Do not over-automate too early
Muuday’s rules are rich.
The wrong implementation pattern would be:
- too many irreversible automatic financial decisions
- weak admin override capability
- no internal case system
- no internal ledger
- assuming Stripe objects alone equal business truth

Correct pattern:
- automate deterministic flows
- escalate ambiguous cases
- keep strong admin tooling
- keep business ledger separate from payment processor objects

20.2 Keep every booking financially explainable
For any booking, an admin should be able to answer:
- what the customer paid
- when
- in which currency
- what the platform intended economically
- what the professional should receive
- what has already been transferred
- what has been refunded
- whether there is dispute hold
- whether there is debt/offset

20.3 Build recurring carefully
Do not build recurring as “just a normal subscription” if the business wants:
- monthly customer commitment
- but session-based payout release and session-based operational handling

That hybrid is a major source of hidden complexity.
The platform data model must reflect it explicitly.

20.4 Separate “plan billing” from “booking billing”
There are at least three financial systems:
1. customer booking/marketplace charges
2. customer recurring service cycle charges
3. professional subscription plan charges

Do not mix these into one vague billing layer.

20.5 Create policy snapshots
At booking/payment time, store:
- cancellation rule snapshot
- fee rule snapshot
- service definition snapshot
- timezone snapshot
- disclaimer snapshot where relevant
- tier/plan context if it matters financially

This prevents later disputes caused by “the profile changed later.”

20.6 Keep payout gating rule-driven
Payout eligibility should not be based on a single timestamp alone.
It should consider:
- session completion
- 48h hold window
- open dispute state
- outstanding payout failure state
- professional restriction state if relevant


==================================================
SECTION 21 — AI CODER INSTRUCTIONS
==================================================

These instructions are intentionally written per tool/persona so they can be pasted or adapted later.

--------------------------------------
21.1 Instructions for Codex
--------------------------------------

Use this when asking Codex to implement Muuday’s payments/revenue layer.

You are implementing the Muuday payments, billing, and payout system.

Core business rules:
- Muuday charges the customer.
- Muuday later repays the professional.
- Use Stripe as payment processor.
- Preferred marketplace funds flow is Separate Charges and Transfers.
- Professional payout becomes eligible 48 hours after a completed session unless blocked by a dispute.
- Payout runs weekly with a minimum threshold of BRL 100 equivalent; if below threshold, rollover.
- Customer sees only final total, not internal fee breakdown.
- Customer fee logic is 8% plus processing cost, included in displayed final total.
- Refunds go to original payment method.
- Professional monthly subscription starts after a 3-month free period.
- Professional subscription failure:
  - 7-day grace period
  - existing bookings continue
  - new bookings blocked after grace
  - unresolved failure pauses/inactivates profile
- Both customer and professional can open dispute within 48h after the end of the session.
- One-off, one-off-plus-recurring, and monthly subscription-style services are all supported.
- Monthly customer plans are paid upfront by the user, but professional payout is still released weekly based on session completion and the 48h protection window.

Implementation requirements:
1. Build internal financial ledger models, do not rely only on Stripe object state.
2. Separate booking state from payment state from payout state.
3. Create idempotent webhook handlers for Stripe events.
4. Create financial snapshot tables for booking-time policies and pricing context.
5. Implement admin-safe refund and adjustment services with audit trail.
6. Implement recurring cycle logic separately from professional subscription billing.
7. Provide clean service interfaces for:
   - charge booking
   - accept/decline manual booking
   - create refund
   - calculate payout eligibility
   - run payout batch
   - apply reversal/offset
   - bill professional subscription
   - handle failed professional billing
8. Build role-aware projections for:
   - customer financial history
   - professional earnings/payout history
   - admin financial console
9. Do not expose direct refund controls to professionals in MVP.
10. Build every monetary action to be replay-safe and idempotent.

Data model guidance:
- Booking
- BookingState
- ChargeRecord
- BookingFinancialRecord
- SessionEarningRecord
- TransferRecord
- PayoutRecord
- RefundRecord
- ReversalRecord
- ProfessionalPlanSubscription
- ProfessionalDebtLedger
- DisputeCase
- PolicySnapshot
- CurrencyQuote/ConversionSnapshot if used

Output expectations:
- schema proposal
- service layer design
- webhook mapping
- admin action design
- API endpoints
- job/cron queue design
- test cases for failure/retry scenarios

--------------------------------------
21.2 Instructions for Claude
--------------------------------------

Use this when asking Claude to reason about architecture, edge cases, and implementation planning.

Please design the Muuday payments and revenue engine using the following business rules:
- Muuday is the customer-facing charging platform.
- Professionals are paid later by Muuday.
- Stripe is the primary processor.
- Preferred Connect model: Separate Charges and Transfers.
- Payout eligibility only after session completion + 48h dispute buffer.
- Weekly payouts, minimum BRL 100 equivalent.
- Customer sees only final localized total.
- Internal fee model: 8% plus processing cost.
- Refunds return to original method.
- Professional plans have 3 free months then monthly or annual billing.
- Monthly/recurring customer plans pay upfront but provider payout is still session-based and delayed.
- Build explicit handling for manual-accept bookings, request booking, recurring renewal failure, no-show, and disputes.

Tasks:
1. Produce backend architecture recommendations.
2. Identify all hidden edge cases and race conditions.
3. Suggest database schema and state machine design.
4. Propose webhook/event handling strategy.
5. Propose admin tooling required for operations.
6. Suggest how to keep finance, booking, and recurring cycles consistent.
7. Suggest tests for:
   - refund before transfer
   - refund after partial payout
   - dispute before payout
   - manual-accept expiry with refund
   - recurring renewal failure with reserved future slots
   - professional debt recovery from future payouts
   - professional subscription failure blocking new bookings
8. Prioritize simplicity and cost-effectiveness over enterprise complexity, unless absolutely necessary.

--------------------------------------
21.3 Instructions for Cursor
--------------------------------------

Use this when you want Cursor to implement directly inside a codebase.

Implement Muuday’s marketplace payments module with the following priorities:
1. Correct money state
2. Clear boundaries between booking state and money state
3. Strong admin override ability
4. Stripe webhook robustness
5. Readable code and auditability

Required modules:
- stripe_webhooks
- booking_charge_service
- booking_refund_service
- payout_eligibility_service
- payout_batch_service
- professional_subscription_service
- recurring_cycle_billing_service
- professional_debt_recovery_service
- admin_finance_actions
- financial_history_queries
- dispute_financial_resolution_service

Rules to implement:
- Customer charged at booking
- Manual-accept bookings refunded if not accepted within 48h
- Payout eligibility 48h after session completion
- Weekly payout with BRL 100 threshold
- Refund to original method only
- 7-day grace on professional plan billing failure
- New bookings blocked after grace if unpaid
- Session-based payout even when monthly customer cycle was collected upfront

Deliver:
- migrations
- service layer
- typed domain models
- background jobs
- API endpoints
- admin endpoints
- unit tests
- integration tests
- sample fixtures

--------------------------------------
21.4 Instructions for Antigravity
--------------------------------------

Use this when you want a product-aware build plan, not just raw code.

Build Muuday’s payments and marketplace finance layer in a way that preserves product flexibility and operator control.

Goals:
- simple customer checkout
- strong post-payment control for Muuday
- delayed payout to professionals
- robust recurring model
- minimal financial surprises
- strong admin recovery tools
- low ongoing ops burden

Non-goals:
- fully autonomous financial automation with no admin review paths
- wallet complexity in MVP
- gift cards in MVP
- deep tax automation in MVP
- off-session surprise charging in MVP

Design principles:
- keep UI simple but internal state rich
- preserve evidence for disputes
- make all money flows explainable
- prefer one good ledger over many ad hoc calculations
- prefer cost-effective tools and hosted primitives where reasonable
- avoid introducing unnecessary infrastructure complexity


==================================================
SECTION 22 — TOOLING PREFERENCES (COST-EFFECTIVE + AI-CODER FRIENDLY)
==================================================

The user explicitly requested that recommended tools should:
- connect well with Claude / Codex / Cursor / Antigravity
- be cost-effective
- avoid giant complexity

Recommended philosophy for this payments stack:
- Stripe as the single primary processor instead of stitching many providers
- Keep the core state in Muuday’s own DB
- Use straightforward background jobs/cron/workers rather than exotic workflow engines unless needed
- Use clear API/service boundaries
- Avoid overbuilding a finance microservice too early
- Start with one coherent payments module inside the main product backend

Recommended stack characteristics:
- strong official SDK
- strong documentation
- simple webhook model
- broad dev familiarity
- easy to reason about in AI-assisted coding tools

That means:
- Stripe is a strong fit
- a normal Postgres-backed app architecture is preferred
- a standard job queue is preferred
- avoid unnecessary additional billing providers or wallet providers in MVP


==================================================
SECTION 23 — WHAT IS STILL NOT FULLY LOCKED / EXTERNAL VALIDATION REQUIRED
==================================================

These are not missing product decisions. They are implementation validations or later-phase precision items.

23.1 Stripe corridor validation
Still required:
- validate UK platform collecting globally and paying mostly Brazil-based professionals under desired Connect model
- confirm Stripe’s recommended structure
- confirm constraints around connected accounts, payout currencies, and cross-border support

23.2 Exact pricing localization mechanism
Decision is made at product level:
- customer sees selected/local currency
But implementation still needs final method choice:
- simpler built-in localization approach
- or more controlled FX quote approach
This is implementation detail, not a missing product decision.

23.3 Exact recurring billing object model
Product rules are clear.
Implementation still needs a final engineering choice:
- how much to model as Stripe Billing native subscription objects
- and how much to model as Muuday-controlled cycle logic with payment collection and session-based payout release

23.4 Final compliance drafting for sensitive categories
Decision is clear:
- use constrained wording
- use disclaimers
- do not overclaim regulated scope
But final legal/product wording still needs polishing later.


==================================================
SECTION 24 — THINK LATER, DO NOT IMPLEMENT YET
==================================================

These are intentional future-thinking suggestions, not MVP implementation requirements.

24.1 Wallet / credits
Could be considered later for:
- goodwill credits
- retention offers
- marketplace promotions
Not MVP.

24.2 Tax automation expansion
Could later add:
- deeper Stripe Tax integration
- country-specific tax handling
- provider-level obligations support
Not MVP.

24.3 More sophisticated pricing logic
Could later add:
- category-specific fee strategies
- loyalty pricing
- repeat-customer economics
- subscription bundle logic
Not MVP.

24.4 More advanced payout segmentation
Could later add:
- risk-based payout rules by category
- trust-score-based faster payouts
- differentiated payout windows
Not MVP.

24.5 More advanced promo stack logic
Could later add:
- rule engine for stacking/eligibility
- targeted reactivation offers
- churn-prevention discounting
Not MVP.

24.6 Automated financial health scoring
Could later use:
- dispute rate
- no-show rate
- payout failures
- billing failures
- cancellation rate
to influence:
- manual review
- ranking dampening
- trust/risk controls
Not MVP.

24.7 Richer admin finance dashboards
Could later include:
- LTV by category
- CAC payback by cohort
- payout failure analytics
- country/currency heatmaps
- dispute resolution dashboard
Not MVP.

24.8 More explicit finance notifications
Could later expand to:
- WhatsApp/SMS for critical financial issues
- proactive reminders for failed payout/billing
- business performance nudges
Not MVP.


==================================================
SECTION 25 — FINAL CONCLUSION OF PART 3
==================================================

This part defines the commercial and technical spine of Muuday’s money system.

The essential design is now clear:

- Muuday charges the customer
- Muuday controls the money first
- Muuday pays the professional later
- payout is delayed to protect the marketplace
- refunds go to original method
- customer sees a simple total
- professionals pay Muuday subscription after 3 free months
- recurring customer plans exist, but provider payout is still session-aware and delayed
- admin keeps strong manual control in ambiguous or risky cases
- the system requires an internal ledger and rich internal state
- Stripe is the processor backbone, but Muuday’s own business logic remains the source of truth for marketplace operations

The main remaining work after this part is not “what should happen.”
It is:
- validating the Stripe cross-border architecture
- implementing the system cleanly
- writing strong admin tooling
- later polishing legal/compliance wording for sensitive categories

END OF PART 3
