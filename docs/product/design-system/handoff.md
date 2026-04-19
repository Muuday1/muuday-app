# Muuday Design System — Developer Handoff

> **Version**: 1.0  
> **Date**: 2026-04-19  
> **Audience**: Frontend developers implementing the design system

---

## Token → CSS/Tailwind Mapping

### Colors

| Token | Tailwind Class | CSS Variable | Notes |
|-------|---------------|--------------|-------|
| `primary-500` | `bg-primary-500` / `text-primary-500` | `--mu-primary-500` | CTAs, active states |
| `primary-600` | `bg-primary-600` / `text-primary-600` | `--mu-primary-600` | **Links on white (WCAG AA)** |
| `neutral-200` | `border-neutral-200` | `--mu-border-default` | Card borders |
| `neutral-500` | `text-neutral-500` | — | Secondary text |
| `surface-page` | `bg-[#f4f8f5]` | `--mu-page-bg` | Page background |
| `surface-card` | `bg-white` | — | Card background |
| `text-primary` | `text-neutral-900` | — | Primary text |
| `text-secondary` | `text-neutral-600` | — | Body text |
| `text-muted` | `text-neutral-500` | — | Captions |

### Typography

| Token | Tailwind Class | CSS |
|-------|---------------|-----|
| `font-body` | `font-sans` | `font-family: var(--font-inter)` |
| `font-display` | `font-display` | `font-family: var(--font-space-grotesk)` |
| `text-sm` | `text-[13px]` | `font-size: 13px` |
| `text-base` | `text-base` | `font-size: 16px` |
| `text-lg` | `text-[20px]` | `font-size: 20px` |
| `font-semibold` | `font-semibold` | `font-weight: 600` |

### Spacing

| Token | Tailwind | Value |
|-------|----------|-------|
| `space-1` | `p-1` / `gap-1` | 4px |
| `space-2` | `p-2` / `gap-2` | 8px |
| `space-4` | `p-4` / `gap-4` | 16px |
| `space-6` | `p-6` / `gap-6` | 24px |

### Radius

| Token | Tailwind | Value |
|-------|----------|-------|
| `radius-sm` | `rounded-sm` | 6px |
| `radius-md` | `rounded-md` | 8px |
| `radius-lg` | `rounded-lg` | 12px |
| `radius-xl` | `rounded-xl` | 16px |
| `radius-full` | `rounded-full` | 999px |

### Shadows

| Token | Tailwind | Value |
|-------|----------|-------|
| `shadow-none` | `shadow-none` | none |
| `shadow-sm` | `shadow-sm` | subtle |
| `shadow-md` | `shadow-md` | dropdowns |
| `shadow-lg` | `shadow-lg` | modals |
| `shadow-xl` | `shadow-xl` | toasts |

---

## Component Inventory

### Components to Create (New)

| Component | Location | Priority | Effort |
|-----------|----------|----------|--------|
| Stepper | `components/ui/stepper.tsx` | P1 | Medium |
| FilterChip | `components/ui/filter-chip.tsx` | P1 | Low |
| ProgressBar | `components/ui/progress-bar.tsx` | P2 | Low |
| Breadcrumb | `components/ui/breadcrumb.tsx` | P2 | Low |

### Components to Modify (Existing)

| Component | Changes | Priority | Effort |
|-----------|---------|----------|--------|
| Button | `rounded-full` → `rounded-md` | P0 | Low |
| Card | Remove shadow, add border | P0 | Low |
| Input | `rounded-full` → `rounded-md` | P0 | Low |
| Tabs | Remove pill variant | P0 | Medium |
| Avatar | Verify size scale | P1 | Low |
| Badge | Keep `rounded-full` | P0 | None |
| Header | Remove shadow, add border | P0 | Low |

### Components to Keep (No Changes)

| Component | Reason |
|-----------|--------|
| Modal | Already uses shadow correctly |
| Drawer | Already uses shadow correctly |
| Toast | Already uses shadow correctly |
| Tooltip | Already uses shadow correctly |
| Checkbox | Already correct |
| Radio | Already correct |
| Toggle | Already correct |

---

## Migration Guide

### Pill → 8px Radius

**Before:**
```tsx
<Button className="rounded-full">Label</Button>
```

**After:**
```tsx
<Button className="rounded-md">Label</Button>
```

**Exceptions** (keep `rounded-full`):
- Avatars
- Badges
- Toggle switches

### Shadow → Border

**Before:**
```tsx
<div className="bg-white shadow-md rounded-lg p-6">
  {/* card content */}
</div>
```

**After:**
```tsx
<div className="bg-white border border-neutral-200 rounded-lg p-6">
  {/* card content */}
</div>
```

**Exceptions** (keep shadow):
- Modals
- Drawers
- Dropdowns
- Toasts

### Color Migration

**Before:**
```tsx
className="text-[#1a8a50]"
className="bg-[#1a8a50]"
```

**After:**
```tsx
className="text-primary-600"  // links
className="bg-primary-500"     // buttons
```

### Font Migration

**Before:**
```tsx
// tailwind.config.ts
fontFamily: {
  sans: ['Plus Jakarta Sans', ...],
  display: ['Bricolage Grotesque', ...],
}
```

**After:**
```tsx
// tailwind.config.ts
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['Space Grotesk', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

---

## Implementation Priority Matrix

| Priority | Items | Timeline |
|----------|-------|----------|
| **P0** | Tokens, Button radius, Card shadow→border, Header shadow→border, Tabs pill→underline, Color migration | Week 1 |
| **P1** | New components (Stepper, FilterChip), Avatar sizes, Layout frames | Weeks 2–3 |
| **P2** | Pattern components, remaining frames, documentation | Weeks 4–5 |
| **P3** | Animations, polish, edge cases | Week 6+ |

---

## Effort Estimation

| Phase | Days | Cumulative |
|-------|------|------------|
| Token foundation | 3 | 3 |
| Primitives | 5 | 8 |
| Composites | 5 | 13 |
| Layout | 3 | 16 |
| Patterns | 5 | 21 |
| Frames (P0) | 5 | 26 |
| Frames (P1) | 5 | 31 |
| Frames (P2) | 3 | 34 |
| Migration & cleanup | 4 | 38 |
| Testing & QA | 3 | 41 |

**Total estimated effort**: ~37.5 days (1 senior frontend developer)

---

## Testing Checklist

Before marking implementation complete:

- [ ] All P0 components migrated
- [ ] No `rounded-full` buttons (except avatars/badges)
- [ ] No shadows on cards or sections
- [ ] `primary-600` used for links on white
- [ ] Fonts loading correctly (Inter, Space Grotesk)
- [ ] 8pt grid respected
- [ ] Focus rings visible on all interactive elements
- [ ] Build passes
- [ ] All tests pass
- [ ] Visual regression tests pass

---

## Quick Reference Card

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

*Handoff complete. Questions? Check `components.md` for specs or `tokens.md` for values.*
