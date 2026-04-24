# Muuday Design System — Implementation Playbook

> **Version**: 1.0  
> **Date**: 2026-04-19  
> **Scope**: Step-by-step guide to implement the design system  
> **Estimated Effort**: ~37.5 days (1 senior frontend developer)

---

## Quick Reference

```
┌─────────────────────────────────────────┐
│  MUUDAY DESIGN SYSTEM — QUICK REF      │
├─────────────────────────────────────────┤
│  Primary:     #22c55e (green)          │
│  Link:        #16a34a (primary-600)    │
│  Page bg:     #f4f8f5                  │
│  Card border: #e7e5e4                  │
│  Body text:   #57534e                  │
│  Heading:     #1c1917                  │
├─────────────────────────────────────────┤
│  Button radius: 8px  (rounded-md)      │
│  Card radius:   12px (rounded-lg)      │
│  Card shadow:   NONE (use border)      │
│  Avatar:        rounded-full ✅        │
│  Badge:         rounded-full ✅        │
├─────────────────────────────────────────┤
│  Font body:     Inter                  │
│  Font display:  Space Grotesk          │
│  Grid:          12-col, 24px gutter    │
│  Max width:     1280px                 │
└─────────────────────────────────────────┘
```

---

## Pre-Flight Checklist

- [ ] Read `principles.md`
- [ ] Read `tokens.md`
- [ ] Read `components.md`
- [ ] Read `handoff.md`
- [ ] Read `review/REVIEW-FINDINGS.md`
- [ ] Ensure `npm run dev` works
- [ ] Ensure `npm run build` passes
- [ ] Create feature branch: `git checkout -b design-system/v1`

---

## Phase 1: Tokens & Foundation (3 days)

### Update `tailwind.config.ts`

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['Space Grotesk', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},

colors: {
  primary: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0',
    300: '#86efac', 400: '#4ade80', 500: '#22c55e',
    600: '#16a34a', 700: '#15803d', 800: '#166534',
    900: '#14532d', 950: '#052e16',
  },
  neutral: {
    50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4',
    300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c',
    600: '#57534e', 700: '#44403c', 800: '#292524',
    900: '#1c1917', 950: '#0c0a09',
  },
  brand: { bright: '#9FE870' },
  accent: { orange: '#e8950f' },
  surface: {
    page: '#f4f8f5', 'page-alt': '#fafaf9',
    card: '#ffffff', elevated: '#ffffff',
  },
},

borderRadius: {
  sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '999px',
},

boxShadow: {
  sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
  none: 'none',
},
```

### Update `app/globals.css`

```css
:root {
  --mu-primary-500: #22c55e;
  --mu-primary-600: #16a34a;
  --mu-brand-bright: #9FE870;
  --mu-page-bg: #f4f8f5;
  --mu-card-bg: #ffffff;
  --mu-text-primary: #1c1917;
  --mu-text-secondary: #57534e;
  --mu-border-default: #e7e5e4;
  --mu-shadow-none: none;
}
```

### Install Fonts

Add to `app/layout.tsx`:
```typescript
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })
```

**DoD**: Build passes, no visual regressions.

---

## Phase 2: Primitives (5 days)

### Button
- Radius: `rounded-md` (8px) — **NO pill**
- Variants: primary/secondary/ghost/danger
- Sizes: sm/md/lg
- States: default/hover/active/focus/disabled/loading

### Input / Select / Textarea
- Radius: `rounded-md`
- Border: `border-neutral-200`
- Focus: `border-primary-500`
- Error: `border-error`

### Checkbox / Radio / Toggle
- Checkbox: `rounded-sm` (6px)
- Radio: `rounded-full`
- Toggle: `rounded-full`, track 44×24px

### Badge
- Radius: `rounded-full` ✅ (exception)
- Variants: default/success/warning/error/info/pro

### Avatar
- Sizes: xs(24) sm(32) md(40) lg(56) xl(80) 2xl(128)
- Radius: `rounded-full` ✅ (exception)
- Online indicator: 8px green dot

---

## Phase 3: Composites (5 days)

### Card
- **NO shadow** — `shadow-none`
- Border: `1px solid border-default`
- Radius: `radius-lg` (12px) or `radius-xl` (16px)
- Hover: `border-neutral-300`

### Modal / Drawer / Toast
- **Shadow allowed** ✅ (floating elements)
- Modal: `shadow-lg`
- Toast: `shadow-xl`

### Tabs
- **NO pill variant** — underline only
- Active indicator: `2px solid primary-500`

### Accordion / Stepper / Dropdown
- Follow component specs in `components.md`

---

## Phase 4: Layout (3 days)

### Header
- Sticky, `border-bottom`, **NO shadow**
- Height: 64px

### Sidebar
- Width: 240px expanded, 64px collapsed
- `border-right`, **NO shadow**

### Grid
- 12 columns, 24px gutter, max-width 1280px

---

## Phase 5: Patterns (5 days)

### EmptyState / Skeleton / SearchBar / FilterChip
### Pagination / Breadcrumb / ProgressBar

See `components.md` for all pattern specs.

---

## Phase 6: Migration (4 days)

### Find & Replace

```bash
# Pill → 8px
rounded-full → rounded-md (buttons only)
# Keep rounded-full for: avatars, badges, toggles

# Shadow → Border
shadow-md on cards → remove, add border
# Keep shadow for: modals, drawers, dropdowns, toasts

# Old brand color
#1a8a50 → primary-500 / primary-600

# Fonts
Plus Jakarta Sans → Inter
Bricolage Grotesk → Space Grotesk
```

### Manual Review Checklist

- [ ] `rounded-full` only on avatars, badges, toggles
- [ ] `shadow-*` only on floating elements
- [ ] Links use `primary-600` on white
- [ ] Cards have border, no shadow
- [ ] Buttons have `rounded-md`

---

## Priority Matrix

| Priority | Items | Timeline |
|----------|-------|----------|
| **P0** | Tokens, button radius, card shadow→border, tabs, colors | Week 1 |
| **P1** | New components, frames | Weeks 2–3 |
| **P2** | Patterns, remaining frames | Weeks 4–5 |
| **P3** | Animations, polish | Week 6+ |

---

## Testing Checklist

- [ ] No `rounded-full` buttons
- [ ] No shadows on cards
- [ ] `primary-600` for links
- [ ] Fonts loading
- [ ] 8pt grid respected
- [ ] Focus rings visible
- [ ] Build passes
- [ ] All tests pass
- [ ] Visual regression pass

---

*Playbook complete. See `handoff.md` for detailed migration guide.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
