# Muuday UI Design System

**Status:** Proposta de redesign — target state specification  
**Last updated:** 2026-04-19  
**Style direction:** Wise-inspired (modern, clean, hyper-professional)  
**Scope:** Complete design system + frame documentation for all 13 canonical journeys

---

## Philosophy

> **"Clarity before decoration."**

The Muuday UI should feel like a trusted professional tool — clean, confident, and effortless. Every element serves a purpose. Nothing is arbitrary.

**Core principles (Wise-inspired):**
1. **Generous whitespace** — let content breathe; density reduces trust
2. **Flat surfaces** — minimal shadows; elevation through color, not depth
3. **Consistent radius** — 8px default, predictable shapes
4. **Green as identity anchor** — start and end with green; use accents sparingly
5. **Type clarity** — legible first, expressive second
6. **Motion with purpose** — micro-interactions that guide, not distract

---

## Document Map

| Document | Purpose |
|----------|---------|
| [`principles.md`](./principles.md) | Design philosophy, grid, whitespace, iconography, motion |
| [`tokens.md`](./tokens.md) | Colors, typography, spacing, radius, shadows, animation, breakpoints |
| [`components.md`](./components.md) | Component library with variants, states, props, accessibility |
| [`frames/`](./frames/) | Frame-by-frame UI specification for each journey |
| [`handoff.md`](./handoff.md) | Developer handoff package |

### Journey Frames

| Journey | File |
|---------|------|
| Search & Booking | [`frames/search-booking.md`](./frames/search-booking.md) |
| Professional Workspace | [`frames/professional-workspace.md`](./frames/professional-workspace.md) |
| Profile Edit | [`frames/profile-edit.md`](./frames/profile-edit.md) |
| Settings & Preferences | [`frames/settings-preferences.md`](./frames/settings-preferences.md) |
| Session Lifecycle | [`frames/session-lifecycle.md`](./frames/session-lifecycle.md) |
| Request Booking | [`frames/request-booking.md`](./frames/request-booking.md) |
| Recurring Booking | [`frames/recurring-booking.md`](./frames/recurring-booking.md) |
| User Onboarding | [`frames/user-onboarding.md`](./frames/user-onboarding.md) |
| Professional Onboarding | [`frames/professional-onboarding.md`](./frames/professional-onboarding.md) |
| Trust & Safety | [`frames/trust-safety.md`](./frames/trust-safety.md) |
| Admin Operations | [`frames/admin-operations.md`](./frames/admin-operations.md) |
| Payments & Billing | [`frames/payments-billing.md`](./frames/payments-billing.md) |
| Video Session | [`frames/video-session.md`](./frames/video-session.md) |

---

## Relationship to UX Journeys

These UI frames are the visual layer on top of the UX journeys in [`../journeys/`](../journeys/). Every frame here corresponds to a frame in the UX specification. Changes to UX flow must be reflected here; changes to visual treatment must not break UX logic.

**Cross-reference pattern:**
- UX Frame → UI Frame (visual specification)
- UX Business Rule → UI State (error, empty, loading)
- UX Actor → UI Role (what they see)

---

## How to Use This System

### For Designers (Figma)
1. Read `principles.md` for philosophy
2. Import `tokens.md` values into Figma Variables
3. Build components from `components.md` specifications
4. Compose frames from `frames/` documentation

### For Developers
1. Read `handoff.md` for implementation order
2. Implement tokens first (`tokens.md`)
3. Build components (`components.md`)
4. Compose screens (`frames/`)

### For Product
1. Review `frames/` to validate visual flow
2. Check `components.md` for coverage gaps
3. Use `handoff.md` to estimate effort
