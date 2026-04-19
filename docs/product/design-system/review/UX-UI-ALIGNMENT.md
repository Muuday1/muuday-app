# UX-UI Alignment Document

> **Version**: 1.0  
> **Date**: 2026-04-19  
> **Purpose**: Master mapping of every UX journey frame to its UI specification

---

## Master Mapping Table

| UX Journey | UX Frame | UI Frame Document | UI Frame Section | Status |
|------------|----------|-------------------|------------------|--------|
| Search & Booking | Search Results | `frames/search-booking.md` | SB-01 | ✅ Complete |
| Search & Booking | Profile Bio Tab | `frames/search-booking.md` | SB-02 | ✅ Complete |
| Search & Booking | Services Tab | `frames/search-booking.md` | SB-03 | ✅ Complete |
| Search & Booking | Slot Selection | `frames/search-booking.md` | SB-04 | ✅ Complete |
| Search & Booking | Personal Info | `frames/search-booking.md` | SB-05 | ✅ Complete |
| Search & Booking | Checkout | `frames/search-booking.md` | SB-06 | ✅ Complete |
| Search & Booking | Payment Processing | `frames/search-booking.md` | SB-07 | ✅ Complete |
| Search & Booking | Confirmation | `frames/search-booking.md` | SB-08 | ✅ Complete |
| Professional Workspace | Dashboard | `frames/professional-workspace.md` | PW-01 | ✅ Complete |
| Professional Workspace | Services Management | `frames/professional-workspace.md` | PW-02 | ✅ Complete |
| Professional Workspace | Agenda | `frames/professional-workspace.md` | PW-03 | ✅ Complete |
| Professional Workspace | Financial Overview | `frames/professional-workspace.md` | PW-04 | ✅ Complete |
| Profile Edit | User Edit Profile | `frames/profile-edit.md` | PE-01 | ✅ Complete |
| Profile Edit | Professional Edit Profile | `frames/profile-edit.md` | PE-02 | ✅ Complete |
| Settings & Preferences | User Settings | `frames/settings-preferences.md` | SP-01 | ✅ Complete |
| Settings & Preferences | Professional Settings | `frames/settings-preferences.md` | SP-02 | ✅ Complete |
| Session Lifecycle | Pre-join | `frames/session-lifecycle.md` | SL-01 | ✅ Complete |
| Session Lifecycle | In-session | `frames/session-lifecycle.md` | SL-02 | ✅ Complete |
| Session Lifecycle | Post-session | `frames/session-lifecycle.md` | SL-03 | ✅ Complete |
| Request Booking | Profile CTA | `frames/request-booking.md` | RB-01 | ✅ Complete |
| Request Booking | Request Form | `frames/request-booking.md` | RB-02 | ✅ Complete |
| Request Booking | Pro Response Panel | `frames/request-booking.md` | RB-03 | ✅ Complete |
| Request Booking | Negotiation | `frames/request-booking.md` | RB-04 | ✅ Complete |
| Request Booking | Success | `frames/request-booking.md` | RB-05 | ✅ Complete |
| Recurring Booking | Type Selection | `frames/recurring-booking.md` | RC-01 | ✅ Complete |
| Recurring Booking | Recurring Config | `frames/recurring-booking.md` | RC-02 | ✅ Complete |
| Recurring Booking | Slot Selection | `frames/recurring-booking.md` | RC-03 | ✅ Complete |
| Recurring Booking | Success | `frames/recurring-booking.md` | RC-04 | ✅ Complete |
| User Onboarding | Signup | `frames/user-onboarding.md` | UO-01 | ✅ Complete |
| User Onboarding | Profile Basics | `frames/user-onboarding.md` | UO-02 | ✅ Complete |
| User Onboarding | Onboarding Complete | `frames/user-onboarding.md` | UO-03 | ✅ Complete |
| Professional Onboarding | Registration | `frames/professional-onboarding.md` | PO-01 | ✅ Complete |
| Professional Onboarding | Verification | `frames/professional-onboarding.md` | PO-02 | ✅ Complete |
| Professional Onboarding | Approval Waiting | `frames/professional-onboarding.md` | PO-03 | ✅ Complete |
| Professional Onboarding | First Booking Enabled | `frames/professional-onboarding.md` | PO-04 | ✅ Complete |
| Trust & Safety | Report Flow | `frames/trust-safety.md` | TS-01 | ✅ Complete |
| Trust & Safety | Dispute Initiation | `frames/trust-safety.md` | TS-02 | ✅ Complete |
| Trust & Safety | Resolution | `frames/trust-safety.md` | TS-03 | ✅ Complete |
| Admin Operations | Admin Dashboard | `frames/admin-operations.md` | AO-01 | ✅ Complete |
| Admin Operations | Review Queue | `frames/admin-operations.md` | AO-02 | ✅ Complete |
| Admin Operations | Decision Panel | `frames/admin-operations.md` | AO-03 | ✅ Complete |
| Payments & Billing | Transaction List | `frames/payments-billing.md` | PB-01 | ✅ Complete |
| Payments & Billing | Payout Dashboard | `frames/payments-billing.md` | PB-02 | ✅ Complete |
| Payments & Billing | Invoice Detail | `frames/payments-billing.md` | PB-03 | ✅ Complete |
| Video Session | Session Lobby | `frames/video-session.md` | VS-01 | ✅ Complete |
| Video Session | Active Call | `frames/video-session.md` | VS-02 | ✅ Complete |
| Video Session | End Screen | `frames/video-session.md` | VS-03 | ✅ Complete |

**Total**: 13 journeys, 47 frames, 47 mapped ✅

---

## Cross-Reference Audit

### UX Business Rules → UI States

| Business Rule | UX Document | UI Frame | Reflected |
|---------------|-------------|----------|-----------|
| 2 paid tiers only (Essencial/Pro) | `journeys/*.md` | All frames | ✅ Yes |
| Multi-service booking canonical | `journeys/search-booking.md` | SB-01 through SB-08 | ✅ Yes |
| No free plan | `journeys/*.md` | All pricing frames | ✅ Yes |
| 24h cancellation policy | `journeys/search-booking.md` | SB-06 Checkout | ✅ Yes |
| Pro verification required | `journeys/professional-onboarding.md` | PO-02 Verification | ✅ Yes |
| Session recording consent | `journeys/session-lifecycle.md` | SL-01 Pre-join | ✅ Yes |
| Recurring package discounts | `journeys/recurring-booking.md` | RC-02 Config | ✅ Yes |

---

## Conflict Resolution Rules

When UX and UI specifications conflict:

1. **User safety > Aesthetics**: If a UI pattern hides important safety information, the UX rule wins.
2. **Accessibility > Design**: WCAG 2.1 AA compliance is non-negotiable.
3. **Consistency > Novelty**: Reuse established patterns over new ones.
4. **Performance > Polish**: Faster load times trump subtle animations.
5. **Mobile > Desktop**: Mobile constraints take priority in responsive decisions.

### Resolution Process

1. Identify the conflict
2. Document both sides
3. Apply hierarchy rules above
4. If still ambiguous, escalate to user (per AI-INSTRUCTIONS.md)
5. Document resolution in this file

---

## Sync Checklist

When UX journeys are updated, verify UI alignment:

- [ ] New frames added to this mapping table
- [ ] Frame IDs assigned sequentially
- [ ] UI frame document created/updated
- [ ] Component references verified
- [ ] Business rules reflected in UI states
- [ ] Accessibility requirements checked
- [ ] Review findings updated if needed
- [ ] Handoff document updated if needed

---

## Known Gaps

| Gap | Description | Priority | Action |
|-----|-------------|----------|--------|
| Recurring booking management | No frames for managing/canceling recurring packages | P1 | Add to backlog |
| Refund flow | Missing dedicated refund request UI | P2 | Add to backlog |
| Referral program | No referral UI in user settings | P3 | Add to backlog |
| Dark mode | No dark mode token specifications | P3 | Future consideration |

---

## Duplicate Coverage

**Issue**: `frames/session-lifecycle.md` and `frames/video-session.md` overlap.

- `session-lifecycle.md`: Covers pre-join, in-session, post-session from a UX journey perspective
- `video-session.md`: Covers the same screens from a technical/session execution perspective

**Resolution**: Keep both. `session-lifecycle.md` is the canonical UX frame reference. `video-session.md` provides technical implementation details. Cross-reference between them.

---

*Last synchronized: 2026-04-19*
