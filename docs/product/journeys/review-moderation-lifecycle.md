# Journey: Review Moderation Lifecycle

**Status:** New canonical document  
**Last updated:** 2026-04-19  
**Scope:** End-to-end review experience: submission, moderation, publication, response, and visibility  
**Actors:** User (reviewer), Professional (reviewee), Admin (moderator), System  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frame-by-Frame Analysis](#2-frame-by-frame-analysis)
3. [Moderation State Machine](#3-moderation-state-machine)
4. [Business Rules](#4-business-rules)
5. [Deep Review & Recommendations](#5-deep-review--recommendations)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Executive Summary

Reviews are a **trust cornerstone** of the marketplace. Today, reviews are submitted, stored with `is_visible=false`, and await admin moderation. However, the **reviewer receives no feedback about moderation status**, the **professional cannot respond**, and there's **no structured moderation workflow**.

**Critical insight:**
> Reviews are collected but not effectively leveraged. Users don't know if their review was accepted. Professionals cannot defend against unfair reviews. The platform loses trust signal value.

---

## 2. Frame-by-Frame Analysis

### PHASE 1: SUBMISSION

---

#### Frame 1.1: Review Prompt

**Where:** `app/(app)/agenda/page.tsx` — past bookings list  
**Current State:** Completed bookings show "Avaliar" star icon if not reviewed.

**Frame-by-frame:**
```
[Agenda — Past Sessions]
    ├── Booking card: date, pro name, status "Concluído"
    └── [★ Avaliar] link (if not reviewed)
        └── "Avaliado" text (if already reviewed)
```

**Problems identified:**
1. **Review prompt is passive** — Just a star icon, no urgency or guidance
2. **No review reminder** — If user doesn't review immediately, prompt disappears from view
3. **No context about WHY reviewing matters** — "Help others find great professionals"

**Recommended Frame 1.1 (Target):**
```
[Agenda — Past Sessions — Review Prompt Enhanced]
    ├── Completed booking card
    ├── "How was your session with [Pro]?"
    ├── [★ ★ ★ ★ ★] quick-rate inline (hover to rate, click to open full form)
    └── "Your review helps others find great professionals"
    
    [If not reviewed after 24h]
    ├── In-app notification: "Rate your session with [Pro]"
    └── Email reminder with deep link
```

---

#### Frame 1.2: Review Form

**Where:** `app/(app)/avaliar/[bookingId]/page.tsx` + `ReviewForm.tsx`  
**Current State:** 5 stars + optional comment textarea. Submit. Done.

**Frame-by-frame (detailed):**
```
[/avaliar/[id] — Review Form]
    ├── Back link: "Voltar à agenda"
    ├── Professional card: avatar initial + name + session date
    ├── Star selector (5 buttons)
    │   ├── Hover states with labels:
    │   │   ├── 1 star: "Muito ruim"
    │   │   ├── 2 stars: "Ruim"
    │   │   ├── 3 stars: "Bom"
    │   │   ├── 4 stars: "Muito bom"
    │   │   └── 5 stars: "Excelente"
    ├── Comment textarea (1000 chars)
    ├── Character counter: "0/1000"
    └── [Enviar avaliação] button
    
    [On submit]
    ├── Spinner on button
    ├── Success: "🎉 Obrigado pela avaliação!"
    ├── router.refresh() after 1.2s
    └── Parent flips to "already reviewed" state
```

**Problems identified:**
1. **No structured dimensions** — Overall rating only; missing: punctuality, expertise, communication
2. **No guided prompts** — Blank textarea is intimidating
3. **No private feedback channel** — User cannot flag issues without public shaming
4. **No consent confirmation** — No "I confirm this is genuine" checkbox
5. **No photo/media evidence** — Cannot attach screenshots of session quality
6. **Success state is transient** — "Obrigado" disappears after 1.2s, then just "Avaliação enviada"

**Recommended Frame 1.2 (Target):**
```
[/avaliar/[id] — Enhanced Review Form]
    ├── Header: "Rate your experience with [Pro Name]"
    ├── Session context: date, duration, type
    ├── Overall rating: 5 stars + label
    ├── Structured ratings (optional but encouraged):
    │   ├── "Was [Pro] punctual?" [★★★★★]
    │   ├── "Knowledge and expertise" [★★★★★]
    │   └── "Communication and clarity" [★★★★★]
    ├── Guided prompts (collapsible):
    │   ├── "What did [Pro] help you with?"
    │   ├── "What went well?"
    │   └── "What could be improved?"
    ├── Public comment (1000 chars)
    ├── Private feedback to Muuday (500 chars, optional)
    │   └── "This won't be shared with the professional"
    ├── Consent checkbox:
    │   └── [✓] "I confirm this review reflects my genuine experience"
    ├── [Submit review]
    └── "Reviews are moderated before publication. This takes 1-2 business days."
    
    [Success state — persistent]
    ├── "Thank you! Your review is under moderation."
    ├── Status tracker: Submitted → Under Review → Published
    ├── "You'll be notified when it's live."
    ├── [Edit review] (within 1 hour of submission)
    └── [Back to agenda]
```

---

### PHASE 2: MODERATION

---

#### Frame 2.1: Admin Moderation Queue

**Where:** `app/(app)/admin/avaliacoes/page.tsx` + `components/admin/ReviewModerationClient.tsx`  
**Current State:** Dedicated moderation page with structured workflow.

**Frame-by-frame:**
```
[Admin Moderation — Reviews]
    ├── Stats cards: Pendentes, Aprovadas, Rejeitadas, Sinalizadas
    ├── Filter: [Todas] [Pendentes] [Sinalizadas] [Aprovadas] [Rejeitadas]
    ├── Sort: [Mais recentes] [Menor nota] [Maior comentário] [Sinalizadas primeiro]
    ├── Review card:
    │   ├── Reviewer: name, history ("3 reviews submitted, 2 approved")
    │   ├── Professional: name, total reviews, avg rating
    │   ├── Session context: date, duration, completed/cancelled/no-show
    │   ├── Ratings: Overall star rating
    │   ├── Comment
    │   ├── Auto-flags: "Linguagem inadequada", "Suspeita de falsa", "Conflita com sessão"
    │   └── [Aprovar] [Rejeitar] [Sinalizar]
    │
    ├── [Reject] flow:
    │   ├── Reason select:
    │   │   ├── Linguagem inadequada
    │   │   ├── Fora do contexto / irrelevante
    │   │   ├── Conflita com resultado verificado da sessão
    │   │   ├── Suspeita de avaliação falsa
    │   │   ├── Contém informações pessoais
    │   │   └── Outro motivo
    │   ├── Optional internal note
    │   └── [Confirmar rejeição]
    │
    └── Batch select: checkbox + [Aprovar selecionadas] [Rejeitar selecionadas]
```

**Implementation:**
- Migration `083-review-moderation-enhancement.sql`: adds `moderation_status`, `rejection_reason`, `moderated_by`, `moderated_at`, `admin_notes`, `flag_reasons` to `reviews`; trigger keeps `is_visible` in sync
- `lib/admin/admin-service.ts`: `listReviewsForModerationService`, `moderateReviewService`, `batchModerateReviewsService`
- `lib/actions/admin.ts`: `adminListReviewsForModeration`, `adminModerateReview`, `adminBatchModerateReviews`
- Auto-flags computed on-the-fly: profanity (PT-BR + EN word list), conflicts_with_outcome (no-show + rating ≥4), suspected_fake (new account + generic text ≤1 review)

**Remaining gaps:**
1. No "Request edit" flow (user cannot edit and resubmit rejected reviews yet)
2. No notification to reviewer on moderation decision
3. No PII regex auto-flag (only profanity list)
4. No structured rating dimensions (punctuality, expertise, communication) — review form is still overall-only
5. No private feedback channel from reviewer to platform

---

#### Frame 2.2: Moderation Decision Communication

**Where:** Notification system (to be built)  
**Current State:** None. Reviewer not informed.

**Recommended Frame 2.2 (Target):**
```
[If approved]
    ├── In-app notification: "Your review for [Pro] was published!"
    ├── Email: "Your review is now live on [Pro]'s profile"
    └── Deep link: /profissional/[id] (scroll to reviews)
    
[If rejected]
    ├── In-app notification: "Your review needs adjustment"
    ├── Reason: "[Reason selected by admin]"
    ├── "You can edit and resubmit within 7 days"
    └── CTA: [Edit review]
    
[If request edit]
    ├── In-app notification: "Admin suggested changes to your review"
    ├── Admin note: "Please remove the personal phone number mentioned"
    └── CTA: [Edit review]
```

---

### PHASE 3: PUBLICATION

---

#### Frame 3.1: Published Review on Profile

**Where:** `app/(app)/profissional/[id]/page.tsx` — Reviews section  
**Current State:** Reviews list with star rating, reviewer name (or anonymous), comment, date.

**Frame-by-frame:**
```
[Profile — Reviews Section]
    ├── Rating stats: "4.8 ★ (127 avaliações)"
    ├── Reviews list:
    │   ├── Review card:
    │   │   ├── Star rating
    │   │   ├── Reviewer name or "Usuário verificado"
    │   │   ├── Date
    │   │   ├── Comment
    │   │   └── Professional response (if any)
    │   └── Pagination or "Load more"
    └── NO: rating distribution chart, helpful votes, photos
```

**Problems identified:**
1. **No rating distribution** — Cannot see if 4.8 means mostly 5s or mixed
2. **No review helpfulness** — Cannot surface most useful reviews
3. **No photos in reviews** — Visual evidence of session/workspace quality
4. **Professional response is minimal** — No structured response form

**Recommended Frame 3.1 (Target):**
```
[Profile — Reviews Section Enhanced]
    ├── Rating summary:
    │   ├── "4.8 ★" large
    │   ├── Rating distribution bar chart (5★→1★)
    │   └── "127 reviews · 98% would recommend"
    ├── Filter: [Most recent] [Highest rated] [Lowest rated] [With photos]
    ├── Review card:
    │   ├── Star rating + structured dimension bars
    │   ├── Verified session badge ("Completed 3 sessions")
    │   ├── Date + session type
    │   ├── Comment
    │   ├── Photos (if any)
    │   ├── [Helpful] button + count
    │   └── Professional response:
    │       ├── "Thank you for your feedback!" (if positive)
    │       └── "We're sorry to hear..." (if negative)
    └── [Write a review] CTA (if user had completed session)
```

---

#### Frame 3.2: Professional Response

**Where:** Not currently implemented  
**Current State:** Professional cannot respond to reviews.

**Recommended Frame 3.2 (Target):**
```
[Professional Dashboard — Reviews Tab (NEW)]
    ├── "Reviews" tab in dashboard
    ├── Review cards:
    │   ├── Star rating + comment
    │   ├── [Responder] button
    │   └── Response form:
    │       ├── Textarea (500 chars)
    │       ├── "Thank you for your kind words" template (positive)
    │       ├── "We're sorry to hear..." template (negative)
    │       └── [Submit response]
    └── Response guidelines:
        ├── "Be professional and courteous"
        ├── "Do not share personal information"
        └── "Responses are moderated"
```

---

### PHASE 4: REVIEWER EXPERIENCE

---

#### Frame 4.1: My Reviews

**Where:** Not currently implemented  
**Current State:** User cannot see reviews they've submitted.

**Recommended Frame 4.1 (Target):**
```
[/perfil — New "My Reviews" Tab]
    ├── Reviews submitted by user
    ├── Each review shows:
    │   ├── Professional name + avatar
    │   ├── Star rating
    │   ├── Comment snippet
    │   ├── Status: [Under Review] / [Published] / [Rejected — editable]
    │   ├── Date submitted
    │   └── [Edit] (if rejected or within 1h of submission)
    └── Empty state: "You haven't reviewed any sessions yet"
```

---

## 3. Moderation State Machine

```
submitted ──[admin approves]──→ published ──[user edits]──→ edited ──[re-moderation]──→ published
     │                              │
     ├──[admin requests changes]──→ pending_edit ──[user resubmits]──→ submitted
     │
     └──[admin rejects]──────────→ rejected ──[user edits within 7d]──→ submitted
                                        └──[7d passes]──→ permanently_rejected
```

### State Visibility

| State | Visible to Reviewer | Visible to Professional | Visible to Public |
|-------|---------------------|------------------------|-------------------|
| `submitted` | Yes (in "My Reviews") | No | No |
| `published` | Yes | Yes | Yes |
| `pending_edit` | Yes (with admin note) | No | No |
| `rejected` | Yes (with reason) | No | No |
| `permanently_rejected` | Yes (archived) | No | No |

---

## 4. Business Rules

### One Review Per Relationship

- A user can submit **one review per completed booking**
- If user books same professional multiple times, **each completed booking allows one review**
- Reviews are **editable** after submission (within 1 hour or until moderation)

### Moderation SLA

| Queue Size | Target SLA |
|------------|------------|
| < 50 pending | 24 hours |
| 50-200 pending | 48 hours |
| > 200 pending | 72 hours + scale ops team |

### Rejection Reasons

| Reason | Can Edit & Resubmit | Auto-Flag Trigger |
|--------|---------------------|-------------------|
| Inappropriate language | Yes | Profanity filter |
| Off-topic | Yes | ML classifier |
| Personal information | Yes | PII regex |
| Conflicts with outcome | Yes | No-show booking + 5-star review |
| Suspected fake | No | New account + generic text |

---

## 5. Deep Review & Recommendations

### Critical Issues

#### C1: Reviewer Not Informed of Moderation Status
**Severity:** Critical  
**Impact:** Users feel ignored, lower review submission rate  
**Fix:** Build notification flow + "My Reviews" section.

#### C2: Professional Cannot Respond
**Severity:** Critical  
**Impact:** Unfair reviews damage pro reputation without recourse  
**Fix:** Add professional response feature with moderation.

#### C3: Review Form Is Too Minimal
**Severity:** High  
**Impact:** Low-quality reviews, poor trust signals  
**Fix:** Guided prompts, structured dimensions, private feedback channel.

### High Priority

#### H1: No Moderation Guidelines for Admins
**Severity:** High  
**Impact:** Inconsistent moderation decisions  
**Fix:** Build structured moderation UI with required rejection reasons.

#### H2: No Rating Distribution
**Severity:** Medium  
**Impact:** Users cannot assess review reliability  
**Fix:** Add distribution chart to profile.

#### H3: No Review Reminders
**Severity:** Medium  
**Impact:** Low review volume  
**Fix:** T+1h and T+24h review reminders via notification system.

---

## 6. Implementation Plan

### Phase 1: Reviewer Experience (Week 1)

| Task | File | Effort |
|------|------|--------|
| Enhanced review form | `components/booking/ReviewForm.tsx` | 2 days |
| "My Reviews" tab in profile | `app/(app)/perfil/page.tsx` + new tab | 2 days |
| Review status tracking | `lib/actions/manage-booking.ts` | 1 day |

### Phase 2: Moderation System (Week 1-2)

| Task | File | Effort |
|------|------|--------|
| Moderation queue enhancement | `components/admin/AdminDashboard.tsx` | 2 days |
| Rejection reason system | `lib/actions/admin.ts` | 1 day |
| Review notifications | `lib/notifications/dispatch.ts` | 1 day |

### Phase 3: Publication & Profile (Week 2-3)

| Task | File | Effort |
|------|------|--------|
| Rating distribution chart | `components/professional/RatingDistribution.tsx` | 1 day |
| Structured review display | `app/(app)/profissional/[id]/page.tsx` | 2 days |
| Professional response feature | `components/dashboard/ProfessionalReviews.tsx` | 2 days |

### Phase 4: Reminders & Engagement (Week 3-4)

| Task | File | Effort |
|------|------|--------|
| Review reminder cron | `/api/cron/review-reminders` | 1 day |
| Review reminder notifications | `inngest/functions/review-reminders.ts` | 1 day |
| Helpful votes | `lib/actions/reviews.ts` | 1 day |

---

## Related Documents

- `docs/product/journeys/session-lifecycle.md` — Review window timing
- `docs/product/journeys/search-booking.md` — Profile trust signals
- `docs/product/journeys/notification-inbox-lifecycle.md` — Review notifications


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
