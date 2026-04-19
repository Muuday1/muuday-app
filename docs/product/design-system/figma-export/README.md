# Muuday Figma Export Package

> **Version**: 1.0  
> **Date**: 2026-04-19  
> **Designer**: Import into Figma and start building components immediately.

---

## 📦 What's in This Package

| File | Size | Purpose |
|------|------|---------|
| `README.md` | — | This file — start here |
| `tokens-export.md` | 12 KB | All design tokens in Figma Variables format |
| `components.json` | 12 KB | 36 component specs with auto-layout, variants, tokens |
| `frames-index.json` | 12 KB | 47 frames mapped to 13 journeys, routes, components |

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Figma File
1. Open Figma → New design file
2. Name it: `Muuday Design System`

### Step 2: Import Tokens
1. Open **Local variables** (right sidebar → Design → Local variables)
2. Create collection: `Muuday Tokens`
3. Add all tokens from `tokens-export.md` → Color / Typography / Spacing / Radius / Shadow / Animation sections
4. Create mode: `Light` (default)

### Step 3: Set Up Grid
1. Create frame: `Desktop / 1440×900`
2. Add grid: **12 columns**, gutter `24px`, margin `32px`, max-width `1280px`
3. Create frame: `Mobile / 375×812`
4. Add grid: **12 columns**, gutter `16px`, margin `16px`

### Step 4: Build First Component
1. Create component: `Button`
2. Apply tokens: bg=`primary/500`, text=`text/inverse`, radius=`radius/md`
3. Add variants: `variant`=[primary, secondary, ghost, danger], `size`=[sm, md, lg], `state`=[default, hover, active, disabled]
4. Set auto-layout: horizontal, padding `10 16`, gap `8`, align center

### Step 5: Build First Frame
1. Create frame: `SB-01 Search Results`
2. Size: 1440×900
3. Components: Header + SearchBar + FilterChips + Card grid
4. Apply tokens: bg=`surface/page`, cards use `shadow/none` + `border/default`

---

## 🎨 Design Philosophy (Wise-Inspired)

**Flat Surfaces** → Cards have NO shadows. Only 1px borders.  
**Generous Whitespace** → Minimum section padding 48px desktop, 32px tablet, 24px mobile.  
**Vibrant Green** → Primary `#22c55e` for CTAs. Brand bright `#9FE870` for celebrations only.  
**8px Radius** → Buttons, inputs, badges. NO pill shapes (999px only for avatars/tags).  
**Inter + Space Grotesk** → Clean, modern, highly legible.

---

## 📐 Component Priority

Build in this order:

1. **P0 - Primitives** (Week 1)
   - Button, Input, Select, Checkbox, Badge, Avatar
2. **P0 - Composites** (Week 2)
   - Card, Modal, Drawer, Toast, Tabs, Accordion
3. **P1 - Layout** (Week 3)
   - Header, Sidebar, Footer, Grid, Section
4. **P1 - Patterns** (Week 4)
   - EmptyState, Skeleton, SearchBar, FilterChip, Pagination, Stepper
5. **P2 - Frames** (Week 5–6)
   - All 47 frames from `frames-index.json`

---

## 🔗 Token Reference

| Token Category | File | Section |
|---------------|------|---------|
| Colors | `tokens-export.md` | Color Tokens |
| Typography | `tokens-export.md` | Typography Tokens |
| Spacing | `tokens-export.md` | Spacing Tokens |
| Radius | `tokens-export.md` | Radius Tokens |
| Shadows | `tokens-export.md` | Shadow Tokens |
| Animation | `tokens-export.md` | Animation Tokens |
| Breakpoints | `tokens-export.md` | Breakpoint Tokens |

---

## 🖼️ Frame Reference

| Journey | Priority | Frames | File |
|---------|----------|--------|------|
| Search & Booking | P0 | 8 | `frames/search-booking.md` |
| Professional Workspace | P0 | 4 | `frames/professional-workspace.md` |
| Profile Edit | P1 | 2 | `frames/profile-edit.md` |
| Settings & Preferences | P1 | 2 | `frames/settings-preferences.md` |
| Session Lifecycle | P1 | 3 | `frames/session-lifecycle.md` |
| Request Booking | P1 | 5 | `frames/request-booking.md` |
| Recurring Booking | P1 | 4 | `frames/recurring-booking.md` |
| User Onboarding | P2 | 3 | `frames/user-onboarding.md` |
| Professional Onboarding | P2 | 4 | `frames/professional-onboarding.md` |
| Trust & Safety | P2 | 3 | `frames/trust-safety.md` |
| Admin Operations | P2 | 3 | `frames/admin-operations.md` |
| Payments & Billing | P2 | 3 | `frames/payments-billing.md` |
| Video Session | P2 | 3 | `frames/video-session.md` |

---

## ⚠️ Critical Rules

1. **NO shadows on cards** → Use `border/default` only
2. **NO pill buttons** → Use `radius/md` (8px)
3. **Links use `primary/600`** → NOT `primary/500` (contrast fail)
4. **Avatars: `radius/full`** → ONLY element allowed to be fully rounded
5. **Shadows only for floating** → Dropdowns, modals, toasts, drawers
6. **2 paid tiers only** → Essencial / Pro (no free plan)
7. **Brand bright `#9FE870` only for celebrations** → Never for text on white

---

## 🧪 Testing Checklist

Before handing off to dev:

- [ ] All 36 components built with correct variants
- [ ] All tokens applied via Figma Variables (not hardcoded hex)
- [ ] Auto-layout works correctly on all components
- [ ] Desktop + mobile frames created for P0 journeys
- [ ] Prototype links between frames (Search → Profile → Booking → Checkout)
- [ ] Accessibility: focus states visible, color contrast checked
- [ ] No pill buttons except avatars/tags
- [ ] No shadows on cards or sections

---

## 📞 Questions?

- See full design system: `docs/product/design-system/`
- Review findings: `docs/product/design-system/review/REVIEW-FINDINGS.md`
- UX journey docs: `docs/product/journeys/`
- Alignment doc: `docs/product/design-system/review/UX-UI-ALIGNMENT.md`

---

*Built for Muuday — Modern wellness marketplace*
