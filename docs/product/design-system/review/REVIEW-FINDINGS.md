# Muuday Design System — Deep Review Findings

> **Review date:** 2026-04-19  
> **Scope:** All files in `docs/product/design-system/` and `docs/product/journeys/`  
> **Reviewer:** AI Code Agent (kimi-cli)  
> **Methodology:** Full-text read of 32 documents, cross-reference audit, Wise design-language benchmark, WCAG 2.1 AA spot-check.

---

## Section 1: What Is Good (✅)

1. **Comprehensive token system with perceptually-uniform color values.** `tokens.md` documents every color with Hex, OKLCH, usage rationale, and explicit contrast ratios (e.g., `primary-500` on white → 3.2:1, `primary-600` → 4.6:1). This is production-grade and unambiguous. *(File: `tokens.md`, Sections 1.1–1.9)*

2. **Accessibility is explicitly prioritized, not retrofitted.** `principles.md` dedicates an entire section (§7) to WCAG 2.1 AA compliance, with concrete rules: 4.5:1 text contrast, 3:1 UI component contrast, color-never-sole-indicator, and focus-visible specs. *(File: `principles.md`, Section 7)*

3. **Motion specs respect user preferences.** `principles.md` includes a complete `prefers-reduced-motion` media query block, duration tokens, easing tokens, and per-interaction micro-interaction tables. *(File: `principles.md`, Section 6)*

4. **Clear UX → UI cross-reference pattern documented.** `README.md` explicitly defines the relationship between UX journeys and UI frames: “UX Frame → UI Frame (visual specification), UX Business Rule → UI State.” This prevents the two doc sets from drifting. *(File: `design-system/README.md`, Section “Relationship to UX Journeys”)*

5. **Developer handoff includes migration guide.** `handoff.md` provides before/after CSS snippets for migrating legacy components (`mu-btn-primary` pill → 8px radius, `mu-shell-card` shadow → border-only). This reduces implementation risk. *(File: `handoff.md`, Section 5)*

6. **Token naming convention is systematic and portable.** The `category/semantic-variant/scale` format (e.g., `color/primary/500`, `spacing/component/16`) maps cleanly to Figma Variables, CSS custom properties, and Tailwind config. *(File: `principles.md`, Section 10.2)*

7. **Mobile-first responsive philosophy is well-defined.** Breakpoints, grid columns, gutter/margin scaling, and typography scaling are all specified in one place. *(File: `principles.md`, Section 8)*

8. **Z-index is managed via semantic tokens.** Instead of magic numbers, the system uses `z-dropdown`, `z-sticky`, `z-modal`, `z-toast`, etc., with explicit stacking-context rules. *(File: `tokens.md`, Section 8)*

9. **Shadow restraint philosophy is consistently articulated.** Multiple documents repeat the rule: “Cards are flat. Shadows are reserved for floating elements that break the z-axis.” This creates a coherent brand signature. *(Files: `tokens.md` Section 5; `components.md` Card spec; `handoff.md` QA checklist)*

10. **Empty state and skeleton patterns are specified.** `components.md` includes dedicated sections for `EmptyState` and `Loading Skeleton` with shape variants, color tokens, and accessibility rules (`aria-busy`, reduced-motion). *(File: `components.md`, Patterns section)*

11. **Voice & tone guidelines include concrete before/after examples.** The “Be direct / Be specific / Be human” table with real Portuguese UI copy makes the guidelines actionable for content writers. *(File: `principles.md`, Section 9)*

12. **Stagger patterns for animations are defined.** Lists, grids, form fields, and toast stacks have explicit delay increments and max-item caps, preventing cognitive overload from cascade animations. *(File: `tokens.md`, Section 6.5)*

13. **Error boundary and confirmation dialog patterns exist.** Beyond happy-path components, the library includes `ErrorBoundary` and `ConfirmationDialog` with retry actions, error codes, and safe-action focus rules. *(File: `components.md`, Patterns section)*

14. **Handoff file mapping links frames to code routes.** The table mapping each design system doc to `app/` route(s) is essential for traceability. *(File: `handoff.md`, Section 3)*

15. **Contrast ratios are self-documented for brand-bright colors.** The explicit callout that `brand-bright` on white fails at 1.4:1 and is “decorative only” prevents misuse. *(File: `tokens.md`, Section 1.1a)*

---

## Section 2: What Needs Improvement (⚠️)

| # | Severity | File(s) | Problem | Recommended Fix |
|---|----------|---------|---------|-----------------|
| 1 | **Critical** | `tokens.md` §1.2 vs `components.md` Token Quick Reference | **Neutral color hex values are completely different.** Example: `neutral-200` is `#e7e5e4` in tokens but `#E8E6E1` in components; `neutral-500` is `#78716c` vs `#8A8580`; `neutral-900` is `#1c1917` vs `#1A1714`. This will cause visual drift between Figma and code. | Reconcile to a single source of truth. Prefer the OKLCH-calibrated values in `tokens.md` and update `components.md` to reference them verbatim. |
| 2 | **Critical** | `tokens.md` §1.1a / `components.md` Button | **`primary-500` (#22c55e) on white achieves only 3.2:1 contrast.** Tokens.md admits this is “large text only,” yet `components.md` specifies it as the primary button background with `#14532d` (primary-900) text. The text is fine, but `primary-500` is also used as focus-ring color, link color, and border color where normal text may appear. | Elevate minimum interactive text on `primary-500` surfaces to `primary-900` (8.2:1 ✅). For links/focus on white, use `primary-600` (4.6:1 ✅) instead of `primary-500`. Update token usage table. |
| 3 | **Critical** | `handoff.md` §1 vs `tokens.md` §1.7 | **Handoff references non-existent tokens:** `--color-surface`, `--color-surface-muted`, `--text-sm`, `--text-base`. The actual tokens are `surface-page`/`surface-page-alt`/`surface-card`, and font tokens are `font/size/sm` (`0.8125rem` = 13px), not 14px. | Audit `handoff.md` against `tokens.md` JSON quick-sheet (§10.1) and rewrite the mapping table with exact token names. |
| 4 | **High** | `tokens.md` §2.2 vs `components.md` Token Quick Reference | **Typography scale mismatch.** `tokens.md`: `text-sm` = 13px, `text-lg` = 20px, `text-2xl` = 30px. `components.md`: `font-size-sm` = 14px, `font-size-lg` = 18px, `font-size-2xl` = 24px. | Align `components.md` to the `tokens.md` scale, which follows a 1.25× Major Third ratio and is explicitly marked “Figma-ready.” |
| 5 | **High** | `tokens.md` §1.8 vs `components.md` Button / Modal / etc. | **Surface-muted text color is missing from tokens.** `components.md` and multiple frames reference `--color-surface-muted` and `--color-neutral-900` for text on muted surfaces, but `tokens.md` only defines `surface-page-alt` (#fafaf9) and does not define a semantic “text on muted” token. | Add `text-muted` or `text-secondary` token explicitly for muted-surface contexts, or standardize on `text-secondary` (#57534e) as already defined. |
| 6 | **High** | `components.md` Button §Accessibility vs `tokens.md` §1.9 / §5 | **Focus ring opacity is inconsistent.** `components.md` Button focus uses `--color-primary-500 at 50% opacity`; `tokens.md` `shadow-focus` uses `primary-500 at 15% opacity`. These produce radically different visibility. | Standardize on one value. Recommend 15% opacity for shadow glow (subtle) AND a 2px solid `primary-500` ring for high-visibility focus, matching `principles.md` §7.2. |
| 7 | **High** | `frames/search-booking.md` Frame 4 vs `principles.md` §2 / §3 | **Sticky service header uses `--shadow-md`.** This violates the flat-surfaces principle that “shadows are reserved for floating elements only.” A sticky sub-header is not a floating element. | Replace shadow with a 1px `neutral-200` bottom border, consistent with other sticky headers (e.g., tab bar). |
| 8 | **High** | `frames/request-booking.md` Frame 1.1 vs `principles.md` §3.1 | **Header uses `--shadow-sm` and avatar uses `--shadow-md`.** Both violate flat-surfaces principle. | Remove shadows; use borders or whitespace for elevation. If avatar must pop, use a 2px `surface-card` border as specified in `principles.md` §5.1. |
| 9 | **Medium** | `principles.md` §5.1 vs `components.md` Avatar §Size Mapping | **Avatar size scales are inconsistent.** `principles.md`: xs=24, sm=32, md=48, lg=64, xl=96, 2xl=128. `components.md`: xs=24, sm=32, md=40, lg=56, xl=80. No 2xl. | Align to `principles.md` which has more granularity and matches the 8pt grid. Update `components.md` size mapping table. |
| 10 | **Medium** | `components.md` Badge §Tokens Applied | **Badge uses hardcoded hex values** (`#DCFCE7`, `#FEF3C7`, `#FEE2E2`, `#DBEAFE`) instead of semantic tokens (`success-100`, `warning-100`, etc.). This breaks themeability. | Replace hardcoded values with semantic token references. Verify OKLCH hue alignment (success is hue 145, primary is 150; they are close but not identical). |
| 11 | **Medium** | `components.md` Toast §Tokens Applied | **Toast backgrounds use hardcoded hex values** (`#F0FDF4`, `#FFFBEB`, `#FEF2F2`, `#EFF6FF`) instead of `success-50`, `warning-50`, etc. | Replace with semantic token references from `tokens.md`. |
| 12 | **Medium** | `handoff.md` §2 “Create New” vs §4 P2 | **Stepper is listed twice** in the component inventory (once as P1 “Create New”, once as P2 “Nice-to-Have”). This creates planning confusion. | Remove the duplicate P2 entry. Keep P1 because both onboarding journeys depend on it. |
| 13 | **Medium** | `frames/session-lifecycle.md` vs `frames/video-session.md` | **Duplicate/redundant video session coverage.** Both files specify Pre-join, In-session, and Post-session frames with overlapping but slightly different token usage (e.g., `session-lifecycle` uses `--color-surface-muted`, `video-session` uses `--color-surface-muted` but also `--shadow-md` on controls). | Merge `frames/video-session.md` into `frames/session-lifecycle.md` or delete `video-session.md` and redirect to the canonical session-lifecycle frames. Resolve token differences (e.g., controls bar shadow). |
| 14 | **Medium** | `components.md` Modal §Tokens Applied vs `tokens.md` §1.7 | **Modal overlay color mismatch.** `components.md` uses `rgba(26, 23, 20, 0.5)`; `tokens.md` defines `surface-overlay` as `rgba(28, 25, 23, 0.5)`. Different base colors produce slightly different warmth. | Standardize on `tokens.md` `surface-overlay` value and reference the token in `components.md`. |
| 15 | **Medium** | `components.md` Tabs §Variants | **“Pill” tab variant exists despite “no pill buttons” philosophy.** `principles.md` and `README.md` state: “Use `999px` only for tags and avatars — no pill buttons.” The pill tab variant visually resembles a pill button and contradicts the radius discipline. | Remove the pill tab variant or explicitly justify it as an exception. Otherwise, replace with underline or default variants only. |
| 16 | **Medium** | `frames/professional-workspace.md` Frame 1.3 | **Detail panel uses `--shadow-md`.** Again, a non-floating panel gets a shadow, violating flat-surfaces. | Replace with 1px left border `neutral-200` or remove shadow. |
| 17 | **Low** | `principles.md` §8.3 Typography Scaling | **`text-xs` is 10px across all breakpoints.** While the system specifies 10px, WCAG 2.1 recommends avoiding text below 12px for readability. The `text-xs` token is used for captions, labels, and table headers. | Consider bumping `text-xs` to 12px (0.75rem) or adding a `text-2xs` at 10px and elevating `text-xs` to 12px. |
| 18 | **Low** | `frames/search-booking.md` Frame 1 vs `components.md` FilterChip | **Filter chip radius mismatch.** Search frame specifies `--radius-lg` (12px) for filter chips; `components.md` `FilterChip` specifies `--radius-md` (8px). | Standardize on `--radius-md` (8px) for chips to align with the “consistent radius” principle. |
| 19 | **Low** | `frames/recurring-booking.md` vs `journeys/recurring-booking-journey.md` | **UI frames stop at success screen; journey docs recommend 5+ additional frames** (agenda grouping, management modal, reschedule scope, cancel scope, renewal notification) that have no UI frame equivalents. | Create UI frame specs for at least the critical recurring-management screens (Frame 2.2 management modal, Frame 3.2 cancel scope) or mark them as “UI frame TBD.” |
| 20 | **Low** | `components.md` ProgressBar §Tokens Applied | **Complete state switches to `success-500`, but `success-500` and `primary-500` are nearly identical greens.** This is redundant; the semantic distinction is unclear. | Either differentiate success green visually from primary green (e.g., shift success hue to 145 vs primary 150 with more chroma difference) or use `primary-500` for progress and reserve `success-500` only for explicit success states. |

---

## Section 3: Inconsistencies Found (❌)

### 3.1 `tokens.md` vs `components.md`

| Token Aspect | `tokens.md` Value | `components.md` Value | Verdict |
|--------------|-------------------|-----------------------|---------|
| `neutral-200` | `#e7e5e4` | `#E8E6E1` | ❌ Mismatch |
| `neutral-300` | `#d6d3d1` | — (not listed) | ⚠️ Gap |
| `neutral-400` | `#a8a29e` | `#B0ABA4` | ❌ Mismatch |
| `neutral-500` | `#78716c` | `#8A8580` | ❌ Mismatch |
| `neutral-600` | `#57534e` | `#6A6560` | ❌ Mismatch |
| `neutral-700` | `#44403c` | `#4A4540` | ❌ Mismatch |
| `neutral-800` | `#292524` | `#2E2A26` | ❌ Mismatch |
| `neutral-900` | `#1c1917` | `#1A1714` | ❌ Mismatch |
| `text-sm` / `font-size-sm` | 13px (0.8125rem) | 14px | ❌ Mismatch |
| `text-lg` / `font-size-lg` | 20px (1.25rem) | 18px | ❌ Mismatch |
| `text-2xl` / `font-size-2xl` | 30px (1.875rem) | 24px | ❌ Mismatch |
| Surface token names | `surface-page`, `surface-page-alt`, `surface-card` | `--color-surface`, `--color-surface-muted` | ❌ Different naming |
| Focus shadow opacity | 15% (`shadow-focus`) | 50% (Button focus) | ❌ Inconsistent |
| Overlay rgba base | `rgba(28, 25, 23, 0.5)` | `rgba(26, 23, 20, 0.5)` | ❌ Different warmth |
| `success-500` | `#22c55e` (hue 145) | `#16A34A` (no OKLCH given) | ❌ Different hex |
| `warning-500` | `#f59e0b` (hue 80) | `#D97706` | ❌ Different hex |
| `error-500` | `#ef4444` (hue 25) | `#DC2626` | ❌ Different hex |
| `info-500` | `#3b82f6` (hue 255) | `#2563EB` | ❌ Different hex |

**Impact:** Developers using `tokens.md` for CSS variables and `components.md` for Figma components will ship two different color palettes. This is the most severe systemic issue in the design system.

### 3.2 `components.md` vs `frames/*.md`

| Component | `components.md` Spec | Frame Usage | Issue |
|-----------|----------------------|-------------|-------|
| Card radius | `--radius-lg` (12px) | `frames/search-booking.md` Pro Card: `--radius-lg` ✅ | OK |
| FilterChip radius | `--radius-md` (8px) | `frames/search-booking.md` Filter Chips: `--radius-lg` ❌ | Inconsistent |
| Button radius | `--radius-md` (8px), “no pill buttons” | `frames/request-booking.md` Profile CTA: `--radius-md` ✅ | OK |
| Avatar radius | `--radius-full` (999px) for circles | `frames/request-booking.md` Avatar: `--radius-xl` ❌ | Should be `full` |
| Tabs variant | default, underline, pill | `frames/search-booking.md` Tab Bar: underline style ✅ | OK |
| Card shadow | `shadow-none` (flat) | `frames/search-booking.md` sticky header: `--shadow-md` ❌ | Violation |
| Drawer shadow | Not specified | `frames/professional-workspace.md` Detail Panel: `--shadow-md` ❌ | Violation |
| Header shadow | Not specified | `frames/request-booking.md` Header: `--shadow-sm` ❌ | Violation |
| Toggle size | md track 44×24px, sm 36×20px | `frames/settings-preferences.md` Toggle: 48×28px track ❌ | Custom size not in tokens |

### 3.3 `frames/*.md` vs `../journeys/*.md`

| Journey | UI Frames File | UX Journey File | Alignment Status |
|---------|----------------|-----------------|------------------|
| Search & Booking | `frames/search-booking.md` (8 frames) | `journeys/search-booking.md` (8 frames) | ⚠️ **Partially aligned.** Journey Frame 4 is “Booking Step 1 — Service + Slot”; UI Frame 4 is “Slot Selection.” Journey includes timezone toggle and batch/recurring toggles not shown in UI frame. |
| Professional Workspace | `frames/professional-workspace.md` (4 frames) | `journeys/professional-workspace-journey.md` (4 frames + detail) | ⚠️ **Aligned at high level, but journey adds tier-upgrade rules, drag-to-reorder, and batch confirm that UI frames don’t specify.** |
| Session Lifecycle | `frames/session-lifecycle.md` (3 frames) | `journeys/session-lifecycle.md` (11 frames across 4 phases) | ❌ **Severely misaligned.** UI frames cover only Pre-join / In-session / Post-session. Journey adds Booking Confirmation, Manual Confirmation, Reminders, Preparation, Session Page Entry, Video Session, Completion, Review, No-Show, Dispute. Many journey frames have NO UI equivalent. |
| Video Session | `frames/video-session.md` (3 frames) | `journeys/session-lifecycle.md` (absorbed) | ❌ **Redundant / duplicate.** Same 3 frames as session-lifecycle with minor token differences. |
| Recurring Booking | `frames/recurring-booking.md` (4 frames) | `journeys/recurring-booking-journey.md` (4 setup + 5 management frames) | ❌ **Management frames missing in UI.** Journey recommends Agenda Grouping, Management Modal, Reschedule Scope, Cancel Scope, Renewal Notification — none have UI frame specs. |
| Request Booking | `frames/request-booking.md` (4 frames) | `journeys/request-booking-journey.md` (6 frames) | ⚠️ **Partially aligned.** Journey adds enhanced Profile CTA, Pro Inbox Card, Pro Offer Form, and Notification frames that UI frames only partially cover. |
| User Onboarding | `frames/user-onboarding.md` (3 frames) | `journeys/user-onboarding.md` (stub/legacy) | ❌ **Journey is a stub.** UI frames are more complete than the canonical journey, which is marked “needs rewrite.” |
| Professional Onboarding | `frames/professional-onboarding.md` (4 frames) | `journeys/professional-onboarding.md` (stub/legacy) | ❌ **Journey is a stub.** Same issue as user onboarding. |
| Trust & Safety | `frames/trust-safety.md` (3 frames) | `journeys/trust-safety-compliance.md` (stub/legacy) | ❌ **Journey is a stub.** Canonical ops journey is `operator-case-resolution.md`, which has no matching UI frames. |
| Admin Operations | `frames/admin-operations.md` (3 frames) | `journeys/operator-case-resolution.md` (canonical, 11 case frames) | ❌ **Severely misaligned.** UI frames only cover dashboard, queue, and decision panel. Journey adds Case Creation, Triage, Investigation, Evidence, Decision, Communication, Closure — no UI specs. |
| Payments & Billing | `frames/payments-billing.md` (3 frames) | `journeys/payments-billing-revenue.md` (stub/legacy) | ❌ **Journey is a stub.** Canonical financial journey is `financial-overview-journey.md`, which recommends transaction detail, payout schedule, and earnings analytics UI frames that do not exist. |
| Settings & Preferences | `frames/settings-preferences.md` (2 frames) | `journeys/settings-preferences-journey.md` (4 phases, 6+ frames) | ❌ **Misaligned.** UI frames only cover User Settings and Professional Settings. Journey recommends Notification Settings, Security, Data & Privacy frames — none have UI specs. |
| Profile Edit | `frames/profile-edit.md` (2 frames) | `journeys/profile-edit-journey.md` (2 phases, 2.2 frames) | ⚠️ **Partially aligned.** Journey adds Re-Review Status frame and live-preview mode that UI frames mention but don’t fully specify. |

### 3.4 `principles.md` vs Actual Frame Specs

| Principle | Source Location | Frame Violation | Details |
|-----------|-----------------|-----------------|---------|
| **Flat surfaces — no shadows on cards** | `principles.md` §1.2, §3 | `frames/search-booking.md` Frame 4 | Sticky service header uses `--shadow-md`. |
| | | `frames/professional-workspace.md` Frame 1.3 | Detail panel uses `--shadow-md`. |
| | | `frames/request-booking.md` Frame 1.1 | Header uses `--shadow-sm`; avatar uses `--shadow-md`. |
| | | `frames/session-lifecycle.md` Frame 2 | Chat panel uses `--shadow-md`; control bar uses `--shadow-md`. |
| **Generous whitespace — section padding never less than 48px on desktop** | `principles.md` §3.1 | `frames/admin-operations.md` Frame 1 | Stats grid and alert cards have no specified outer padding; likely defaults to 16–24px. |
| | | `frames/trust-safety.md` Frame 1 | Modal padding not specified beyond generic 24px; no section-level padding. |
| **Consistent radius — 8px default, predictable shapes** | `principles.md` §1.3, `README.md` | `frames/settings-preferences.md` Frame 1 | Toggle track is described as 48×28px with `--radius-full`, but `components.md` Toggle specifies 44×24px (md). Custom size breaks predictability. |
| **Green as identity anchor** | `principles.md` §1.4 | `frames/admin-operations.md` | Alert card uses “yellow/red” accent borders; no green identity presence. |
| | | `frames/payments-billing.md` | No green used except possibly status badges; mostly neutral table. |
| **Type clarity — legible first** | `principles.md` §1.5 | `frames/search-booking.md` Frame 1 | Result count, filter chips, and card meta use `text-sm` (13px) or smaller; on mobile this is aggressive. |
| **Color is never the sole indicator of state** | `principles.md` §7.1 | `frames/admin-operations.md` Frame 2 | Status badges are contextual colors (green/yellow/red) but text labels like “Em análise” are present ✅. However, the queue item hover state is only `surface-muted` with no icon or pattern addition. |

---

## Section 4: Missing Elements (➕)

### Components Missing from the Library
The following components are referenced in frames but have no spec in `components.md`:

1. **DatePicker / Calendar** — Referenced in `frames/search-booking.md` (slot selection), `frames/recurring-booking.md` (mini calendar), `frames/request-booking.md` (inline calendar). No `Calendar` or `DatePicker` component exists.
2. **SegmentedControl** — Referenced in `frames/search-booking.md` Frame 4 (“Booking Type Toggle”) and `frames/professional-workspace.md` Frame 1.3 (Day/Week/Month). No spec.
3. **FilterChip / Chip** — `frames/search-booking.md` uses “Chip/Filter” and “Chip/Filter Active” but `components.md` only has `FilterChip` with different radius.
4. **Banner** — Referenced as “Banner/Info” in `frames/search-booking.md` Frame 7 (Payment Processing) and “Banner/Action” in `frames/professional-workspace.md`. No spec.
5. **Timeline / Stepper visual** — `frames/user-onboarding.md` and `frames/professional-onboarding.md` reference steppers, but `components.md` Stepper only covers the circle/connector component, not the full page layout.
6. **MessageBubble / ChatMessage** — `frames/session-lifecycle.md` Frame 2 describes chat bubbles but no `ChatMessage` component is defined.
7. **VideoPlayer / VideoPreview** — `handoff.md` lists `VideoPlayer` as P1, but `components.md` has no video component spec.
8. **Dropzone** — `handoff.md` lists `Dropzone` as P1. `frames/professional-onboarding.md` Frame 2 references upload zones. No detailed spec.
9. **RichTextEditor / NotesEditor** — `frames/session-lifecycle.md` Frame 2 mentions “Notes Panel” with rich text toolbar. No spec.
10. **DataTable mobile card-flip variant** — `principles.md` §8.2 mentions “card flip” as a mobile table pattern, but `components.md` Table only has default/compact density.
11. **OTPInput / VerificationCode** — No spec for MFA/2FA codes, which `journeys/settings-preferences-journey.md` recommends.
12. **PhoneInput with country code** — Profile edit frames mention phone numbers but no international phone input component.
13. **CurrencyInput / PriceInput** — Professional profile edit and service editor need price inputs with currency symbol; no spec.
14. **Slider / RangeSlider** — Search recovery journey mentions price slider; no component spec.
15. **DateRangePicker** — Financial overview journey mentions date range selectors; no spec.

### States Missing

| State | Where Needed | Why Missing |
|-------|--------------|-------------|
| **Offline / No connection** | All frames | No generic offline banner or full-screen offline state specified. |
| **Skeleton for search results** | `frames/search-booking.md` | Skeleton pattern exists but not applied to search result cards, filter chips, or calendar. |
| **Skeleton for agenda/calendar** | `frames/professional-workspace.md`, `frames/session-lifecycle.md` | No loading spec for calendar grid or time slots. |
| **Rate-limit / blocking UI** | Login, booking, messaging | No “Too many attempts” or cooldown UI spec. |
| **Maintenance mode** | Global | No maintenance page frame. |
| **404 Not Found** | Global | No 404 frame spec. |
| **500 / Error boundary page** | Global | `ErrorBoundary` component exists but no full-page fatal error frame. |
| **Partial failure** | Recurring booking, batch actions | No UI for “3 of 12 sessions created” or partial save. |
| **Optimistic UI revert** | Settings toggles, favorites | No spec for when optimistic update fails and UI must revert. |
| **Session expired / re-auth** | All authenticated frames | No “Your session has expired, please log in again” modal spec. |

### Responsive Behaviors Not Specified

1. **Landscape mobile orientation** — All frames specify portrait mobile (375×812). No landscape behaviors for video session, calendar, or split layouts.
2. **Touch gestures** — Pull-to-refresh, swipe-to-dismiss notification, swipe between agenda days, pinch-to-zoom on document preview — none are specified.
3. **Image srcset breakpoints** — `principles.md` mentions `srcset` but does not define breakpoint-to-resolution mappings.
4. **Sidebar collapse animation** — `frames/professional-workspace.md` mentions icon-only sidebar at tablet but no animation spec.
5. **Modal-to-bottom-sheet transition** — Many frames say “modal on desktop, bottom sheet on mobile” but don’t specify the breakpoint or transition animation.
6. **Keyboard appearance handling** — No spec for how fixed bottom CTAs behave when mobile keyboard opens.

### Accessibility Gaps

1. **High-contrast mode** — No `prefers-contrast` media query considerations.
2. **Screen reader announcement patterns** — While `aria-live` is mentioned, there is no centralized pattern for toast announcements, route changes, or dynamic list updates.
3. **Focus order diagrams** — Complex frames (checkout, session with chat + notes + video) lack tab-order diagrams.
4. **Keyboard shortcuts** — No shortcut definitions (e.g., `Esc` to close modal is mentioned, but not `?` for help, `/` for search, etc.).
5. **Screen magnification behavior** — No spec for how layout behaves at 200% zoom beyond “functional.”

### Dark Mode Considerations

**Dark mode is entirely absent.** Despite `tokens.md` defining `surface-inverse` (`#1c1917`) and `text-inverse` (`#ffffff`), there is no:
- Dark mode color mapping table.
- Dark mode component variants.
- Dark mode frame specifications.
- Toggle or auto-detection behavior (`prefers-color-scheme`).
- Image/adaptation rules for avatars, cover photos, and illustrations in dark mode.

This is a significant gap for a modern design system targeting professionals who may use the platform in low-light environments.

### Error / Empty / Loading States Missing for Specific Frames

| Frame | Missing State |
|-------|---------------|
| `frames/search-booking.md` Frame 1 (Search) | No skeleton for filter sidebar; no “search unavailable” error state. |
| `frames/search-booking.md` Frame 2 (Profile) | No skeleton for cover photo; no “profile not found” 404 state. |
| `frames/search-booking.md` Frame 4 (Slot Selection) | No skeleton for calendar grid; no “calendar failed to load” retry state. |
| `frames/professional-workspace.md` Frame 1.1 (Dashboard) | No empty state for “first day, no data”; no skeleton for KPI sparklines. |
| `frames/professional-workspace.md` Frame 1.4 (Financial) | No empty state for “no transactions yet”; no loading state for chart. |
| `frames/session-lifecycle.md` Frame 1 (Pre-join) | No “browser not supported” state; no “camera in use by another app” state. |
| `frames/session-lifecycle.md` Frame 2 (In-session) | No “reconnecting” skeleton; no “host ended session” abrupt closure state. |
| `frames/user-onboarding.md` Frame 1 (Signup) | No “email already exists” inline state; no social-auth failure state. |
| `frames/trust-safety.md` Frame 1 (Report) | No “report submitted, case #123” confirmation state with case tracker link. |
| `frames/admin-operations.md` Frame 2 (Queue) | No empty state for “all clear”; no loading skeleton for table pagination. |

---

## Section 5: Wise Alignment Gaps (🎨)

Muuday explicitly targets a “Wise-inspired” aesthetic. The following gaps were identified by comparing the documented system to Wise’s actual public design language.

### Color Usage

| Wise Pattern | Muuday Current State | Gap |
|--------------|----------------------|-----|
| Bold, full-bleed green hero sections (`#9FE870` backgrounds with dark green text) | `brand-bright` exists but is restricted to “illustrations, success celebrations, Pro badge background, empty state accents.” Never used as section background. | **Green is not used boldly enough.** Wise uses their bright green for entire onboarding success screens, marketing heroes, and confirmation pages. Muuday confirmation frames use white cards on neutral gray. |
| Limited palette: essentially green + near-black + white + one accent blue | Muuday has 5 full semantic scales (primary, success, warning, error, info) + 11-step neutral + brand-bright. | **Palette is too complex.** Wise derives almost all UI from 3 colors. Muuday’s warning amber and info blue dilute the green identity. |
| Green used for progress, success, AND primary action | Muuday uses green for primary and success, but blue for info/progress. | **Progress indicators should use primary green, not blue.** The `ProgressBar` spec uses `primary-500` for fill but switches to `success-500` for complete — this is acceptable, but intermediate states could be more consistently green. |

### Typography

| Wise Pattern | Muuday Current State | Gap |
|--------------|----------------------|-----|
| Custom geometric sans (Wise Sans) or tight Inter with aggressive negative tracking | Inter + Space Grotesk. Space Grotesk is geometric but softer than Wise Sans. | **Display font lacks Wise’s confident boldness.** Wise headlines are extremely tight, heavy, and condensed. Muuday’s `text-5xl` at 61px with `-0.03em` tracking is conservative. |
| Very large hero numbers for amounts (48–72px, tight leading) | Price display in search cards uses `text-lg` (20px) or `text-xl` (24px). | **Financial figures are not prominent enough.** Wise makes amounts the dominant element. Muuday prices feel like metadata. |
| Monospace numbers for all financial data | “Monospaced feel” is mentioned for time labels in agenda, but not formalized as a number font. | **No monospace number token.** Wise uses a monospace or tabular-nums style for all amounts to prevent jitter. |

### Component Styling

| Wise Pattern | Muuday Current State | Gap |
|--------------|----------------------|-----|
| Buttons are extremely flat, often 0px or 4px radius, no borders | Muuday mandates 8px radius on ALL buttons consistently. | **Buttons are not flat enough.** Wise primary buttons are frequently full-bleed green rectangles with 0–4px radius. Muuday’s 8px is friendly but less “tool-like.” |
| Cards often have NO border — separation via whitespace and subtle background shifts | Muuday mandates 1px `neutral-200` border on every card. | **Cards are not flat enough.** Wise dashboard cards use background color alone (`#F2F4F7` or white) with no stroke. Muuday’s bordered cards feel more Bootstrap-like than Wise-like. |
| Large, prominent inputs with massive tap targets and minimal borders | Muuday inputs are 48px height with 1px neutral-200 border. | **Inputs are adequate but not iconic.** Wise amount inputs are the centerpiece of their UI — huge, borderless, with massive type. Muuday has no “hero input” pattern. |

### Layout Density

| Wise Pattern | Muuday Current State | Gap |
|--------------|----------------------|-----|
| Dense, information-rich dashboards (24–32px gaps, tight padding) | Muuday specifies 48px section padding on desktop, 32–48px component gaps. | **Whitespace may be TOO generous for a tool.** Wise’s dashboard feels dense and efficient. Muuday’s “never less than 48px” rule risks making the professional workspace feel like a marketing page rather than a cockpit. |
| Sticky summary bars with minimal height (48–56px) | Muuday sticky CTAs are 64px bottom bars. | **Slightly oversized for dense tools.** |

### Motion & Micro-interactions

| Wise Pattern | Muuday Current State | Gap |
|--------------|----------------------|-----|
| Distinctive “card flip” animation for revealing details | No card flip spec. | **Missing brand signature motion.** |
| Amount input bounce / spring on keystroke | No input micro-interaction beyond focus border. | **Missing tactile feedback for financial inputs.** |
| Progress bar fill with elastic ease and segment markers | `ProgressBar` uses generic `500ms ease-out`. | **Too generic.** Wise progress bars have characterful, segmented fills. |
| Celebration confetti / burst on completion | Success icons use generic `scale-in`. | **Missing celebration motion.** Muuday confirmation screens are static; Wise uses lively scale + bounce. |
| Skeleton shimmer is a wave/diagonal sweep | Muuday skeleton uses horizontal gradient sweep. | **Acceptable but not distinctive.** |
| Number counting animation (amounts tick up) | No number animation spec. | **Missing for financial KPIs and checkout totals.** |

### Summary: What Is NOT Wise-Like Enough

1. **Green is treated as an accent, not an identity.** Wise drowns key moments in green. Muuday drips it sparingly.
2. **Borders on everything.** Wise uses whitespace and background shifts. Muuday uses 1px strokes on nearly every container.
3. **Too many semantic colors.** Wise gets by with green + red + neutral. Muuday adds amber warning and blue info everywhere.
4. **No “hero amount” input pattern.** Wise’s most recognizable component is the big, bold, borderless send/receive input. Muuday has no equivalent.
5. **Motion is generic.** The easing and duration tokens are fine for a default system, but there is no Wise-style brand motion (elastic progress, card flips, amount bounces).
6. **Density is too low for dashboards.** The professional workspace will feel spacious but potentially inefficient compared to Wise’s dense, scannable interfaces.

---

## Section 6: Action Items

| Priority | Item | Effort | Owner | Files to Update |
|----------|------|--------|-------|-----------------|
| **P0** | Fix neutral color hex mismatch between `tokens.md` and `components.md` | 0.5 day | Design Engineer | `components.md` (Token Quick Reference) |
| **P0** | Fix `primary-500` contrast failure on white — elevate link/focus text to `primary-600` | 0.5 day | Design Engineer | `tokens.md` §1.1 usage notes; `components.md` Button/Link/Input focus specs |
| **P0** | Fix `handoff.md` referencing non-existent tokens (`--color-surface`, `--text-sm`, etc.) | 0.5 day | Design Engineer | `handoff.md` §1 |
| **P0** | Resolve duplicate video session frames: merge or delete `frames/video-session.md` | 0.5 day | Product Designer | `frames/video-session.md` → redirect to `frames/session-lifecycle.md` |
| **P1** | Standardize typography scale: align `components.md` to `tokens.md` (13px sm, 20px lg, 30px 2xl) | 0.5 day | Design Engineer | `components.md` Token Quick Reference |
| **P1** | Add missing component specs: DatePicker, Calendar, SegmentedControl, Chip, Banner, Timeline | 3 days | Product Designer | `components.md` (new sections) |
| **P1** | Remove hardcoded hex values in Badge and Toast; replace with semantic tokens | 0.5 day | Design Engineer | `components.md` Badge, Toast |
| **P1** | Align avatar size tokens across `principles.md` and `components.md` | 0.5 day | Design Engineer | `components.md` Avatar |
| **P1** | Fix focus ring opacity inconsistency (standardize on 2px solid ring + 15% shadow glow) | 0.5 day | Design Engineer | `components.md` Button, Input, Checkbox, Radio |
| **P1** | Remove shadows from non-floating elements in frame specs (search sticky header, workspace detail panel, request header) | 0.5 day | Product Designer | `frames/search-booking.md`, `frames/professional-workspace.md`, `frames/request-booking.md` |
| **P1** | Add dark mode token system (`dark:` variants for all surface, text, border tokens) | 2 days | Design Engineer | `tokens.md` (new section); `components.md` (add dark variants to each component) |
| **P1** | Add generic error/empty/loading frame specs: 404, 500, offline, skeleton-for-search | 2 days | Product Designer | `frames/` (new files: `system-states.md` or per-frame additions) |
| **P2** | Create UI frame specs for missing recurring management screens (management modal, cancel scope, reschedule scope) | 2 days | Product Designer | `frames/recurring-booking.md` (append new frames) |
| **P2** | Create UI frame specs for missing settings screens (Notifications, Security, Data & Privacy) | 2 days | Product Designer | `frames/settings-preferences.md` (append new frames) |
| **P2** | Create UI frame specs for admin case resolution journey (investigation, evidence, communication, closure) | 2 days | Product Designer | `frames/admin-operations.md` (append new frames) OR `frames/operator-case-resolution.md` |
| **P2** | Add responsive gesture specs: pull-to-refresh, swipe-to-dismiss, landscape behavior | 1 day | Product Designer | `principles.md` (new section under Responsive) |
| **P2** | Add accessibility specs: high-contrast mode, keyboard shortcuts, screen-reader announcement patterns | 1 day | Product Designer | `principles.md` §7 (append) |
| **P2** | Add missing states: rate-limit UI, session expired modal, partial failure, optimistic revert | 1 day | Product Designer | `components.md` Patterns section |
| **P3** | Reduce card border usage to align with Wise flat aesthetic (experiment with background-shift separation) | 2 days | Product Designer | `components.md` Card; all `frames/` |
| **P3** | Add brand-specific motion specs: celebration bounce, amount input spring, progress elastic fill, card flip | 2 days | Product Designer | `principles.md` §6; `tokens.md` §6 |
| **P3** | Review professional workspace density: reduce section padding from 80px to 48–64px for dashboard contexts | 0.5 day | Product Designer | `principles.md` §3.1 (add dashboard exception note); `frames/professional-workspace.md` |
| **P3** | Consolidate journey/frame cross-references: update `journeys/_README.md` to flag all stub journeys and map canonical journeys to UI frames | 1 day | Product Manager | `journeys/_README.md`; add cross-reference table |
| **P3** | Add “hero amount” input component spec for checkout and financial displays | 1 day | Product Designer | `components.md` (new composite: `AmountInput`) |

---

## Appendix: Files Reviewed

### Design System
- `docs/product/design-system/README.md`
- `docs/product/design-system/principles.md`
- `docs/product/design-system/tokens.md`
- `docs/product/design-system/components.md`
- `docs/product/design-system/handoff.md`
- `docs/product/design-system/frames/search-booking.md`
- `docs/product/design-system/frames/professional-workspace.md`
- `docs/product/design-system/frames/profile-edit.md`
- `docs/product/design-system/frames/settings-preferences.md`
- `docs/product/design-system/frames/session-lifecycle.md`
- `docs/product/design-system/frames/request-booking.md`
- `docs/product/design-system/frames/recurring-booking.md`
- `docs/product/design-system/frames/user-onboarding.md`
- `docs/product/design-system/frames/professional-onboarding.md`
- `docs/product/design-system/frames/trust-safety.md`
- `docs/product/design-system/frames/admin-operations.md`
- `docs/product/design-system/frames/payments-billing.md`
- `docs/product/design-system/frames/video-session.md`

### Journeys
- `docs/product/journeys/_README.md`
- `docs/product/journeys/search-booking.md`
- `docs/product/journeys/search-recovery-journey.md`
- `docs/product/journeys/session-lifecycle.md`
- `docs/product/journeys/recurring-booking-journey.md`
- `docs/product/journeys/request-booking-journey.md`
- `docs/product/journeys/review-moderation-lifecycle.md`
- `docs/product/journeys/professional-workspace-journey.md`
- `docs/product/journeys/financial-overview-journey.md`
- `docs/product/journeys/profile-edit-journey.md`
- `docs/product/journeys/settings-preferences-journey.md`
- `docs/product/journeys/user-onboarding.md`
- `docs/product/journeys/professional-onboarding.md`
- `docs/product/journeys/trust-safety-compliance.md`
- `docs/product/journeys/operator-case-resolution.md`
- `docs/product/journeys/payments-billing-revenue.md`
- `docs/product/journeys/notification-inbox-lifecycle.md`
- `docs/product/journeys/global-context-propagation.md`

---

*End of review.*
