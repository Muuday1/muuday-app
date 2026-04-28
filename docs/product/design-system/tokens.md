# Muuday Design Tokens

> **Version**: 1.0  
> **Date**: 2026-04-19  
> **Format**: Figma-ready with OKLCH values where applicable

---

## Color Tokens

### Primary Scale (Green)

The vibrant green that defines Muuday's identity.

| Token | Hex | OKLCH | Usage |
|-------|-----|-------|-------|
| `primary-50` | `#f0fdf4` | OKLCH 97% 0.02 150 | Lightest backgrounds |
| `primary-100` | `#dcfce7` | OKLCH 94% 0.05 150 | Hover row backgrounds |
| `primary-200` | `#bbf7d0` | OKLCH 88% 0.1 150 | Light accent fills |
| `primary-300` | `#86efac` | OKLCH 80% 0.15 150 | Decorative elements |
| `primary-400` | `#4ade80` | OKLCH 75% 0.18 150 | Hover states |
| `primary-500` | `#22c55e` | OKLCH 70% 0.2 150 | **Primary actions, CTAs** |
| `primary-600` | `#16a34a` | OKLCH 62% 0.18 150 | **Links on white (WCAG AA ✅)** |
| `primary-700` | `#15803d` | OKLCH 55% 0.16 150 | Active states |
| `primary-800` | `#166534` | OKLCH 48% 0.14 150 | Dark emphasis |
| `primary-900` | `#14532d` | OKLCH 40% 0.12 150 | Text on light green |
| `primary-950` | `#052e16` | OKLCH 25% 0.08 150 | Deepest green |

> ⚠️ **Critical**: `primary-500` on white = 3.2:1 — fails WCAG AA for normal text. Use `primary-600` (4.6:1 ✅) for links and focus indicators on white backgrounds.

### Brand Bright

| Token | Hex | OKLCH | Usage |
|-------|-----|-------|-------|
| `brand-bright` | `#9FE870` | OKLCH 85% 0.22 135 | **Celebratory only** — badges, confetti, success animations |

> ⚠️ **Critical**: `brand-bright` on white = 1.4:1 — never use for text. Decorative only.

### Warm Neutrals

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#fafaf9` | Page backgrounds, surface base |
| `neutral-100` | `#f5f5f4` | Section alternate backgrounds |
| `neutral-200` | `#e7e5e4` | **Borders, dividers, card outlines** |
| `neutral-300` | `#d6d3d1` | Disabled borders, subtle separators |
| `neutral-400` | `#a8a29e` | Placeholder text |
| `neutral-500` | `#78716c` | **Secondary text, captions** |
| `neutral-600` | `#57534e` | **Body text** |
| `neutral-700` | `#44403c` | Strong text, headings |
| `neutral-800` | `#292524` | Primary headings |
| `neutral-900` | `#1c1917` | **Primary text, darkest content** |
| `neutral-950` | `#0c0a09` | Deepest neutral, near-black |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#22c55e` | Success states (same as primary-500) |
| `success-bg` | `#f0fdf4` | Success backgrounds |
| `warning` | `#e8950f` | Warnings, attention needed |
| `warning-bg` | `#fef3c7` | Warning backgrounds |
| `error` | `#ef4444` | Errors, destructive actions |
| `error-bg` | `#fef2f2` | Error backgrounds |
| `info` | `#3b82f6` | Informational states |
| `info-bg` | `#eff6ff` | Info backgrounds |

### Surface Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-page` | `#f4f8f5` | Page background |
| `surface-page-alt` | `#fafaf9` | Alternate page sections |
| `surface-card` | `#ffffff` | Card backgrounds |
| `surface-elevated` | `#ffffff` | Modals, dropdowns, toasts |
| `surface-overlay` | `rgba(28,25,23,0.5)` | Backdrop overlay |
| `surface-header` | `#f4f8f5` | Header background |
| `surface-input` | `#ffffff` | Input backgrounds |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#1c1917` | Headings, primary text |
| `text-secondary` | `#57534e` | Body text |
| `text-muted` | `#78716c` | Captions, labels, metadata |
| `text-inverse` | `#ffffff` | Text on dark backgrounds |
| `text-disabled` | `#a8a29e` | Disabled text |
| `text-link` | `#16a34a` | **Links (primary-600)** |
| `text-link-hover` | `#15803d` | Link hover (primary-700) |

### Border Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `border-default` | `#e7e5e4` | Default borders (neutral-200) |
| `border-strong` | `#d6d3d1` | Focus borders (neutral-300) |
| `border-active` | `#22c55e` | Active/selected borders (primary-500) |

---

## Typography Tokens

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `font-body` | `"Inter", system-ui, sans-serif` | Body text, UI elements |
| `font-display` | `"Space Grotesk", system-ui, sans-serif` | Headings, numbers, display |
| `font-mono` | `"JetBrains Mono", monospace` | Code, data tables |

### Type Scale (1.25× Major Third)

| Token | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|----------------|-------|
| `text-xs` | 10px | 1.5 | 0.02em | Captions, badges |
| `text-sm` | 13px | 1.5 | 0 | Small text, labels |
| `text-base` | 16px | 1.5 | 0 | Body text |
| `text-lg` | 20px | 1.5 | -0.01em | Lead paragraphs |
| `text-xl` | 25px | 1.25 | -0.02em | H4, section titles |
| `text-2xl` | 31px | 1.25 | -0.02em | H3 |
| `text-3xl` | 39px | 1.2 | -0.02em | H2 |
| `text-4xl` | 49px | 1.15 | -0.02em | H1 |
| `text-5xl` | 61px | 1.1 | -0.02em | Hero headings |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-regular` | 400 | Body text |
| `font-medium` | 500 | UI labels, emphasis |
| `font-semibold` | 600 | Buttons, navigation, headings |
| `font-bold` | 700 | Display headings, strong emphasis |

---

## Spacing Tokens (8pt Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | Zero spacing |
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Default gap, base unit |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Medium gap |
| `space-5` | 20px | Form element gaps |
| `space-6` | 24px | Section gaps, card padding |
| `space-8` | 32px | Large gaps |
| `space-10` | 40px | Section padding |
| `space-12` | 48px | Large section padding |
| `space-16` | 64px | Hero spacing |

---

## Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0px | Sharp edges |
| `radius-sm` | 6px | Small elements |
| `radius-md` | 8px | **Buttons, inputs, default** |
| `radius-lg` | 12px | Cards, panels |
| `radius-xl` | 16px | Modals, large cards |
| `radius-full` | 999px | **Avatars, badges ONLY** |

> ⚠️ **Critical**: No pill buttons. `radius-full` is reserved for avatars and badges.

---

## Shadow Tokens (Floating Elements Only)

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-none` | `none` | **Cards, flat surfaces** |
| `shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | Subtle lift |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Dropdowns, menus |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, drawers |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Toasts, notifications |

> ⚠️ **Critical**: Cards and content panels use `shadow-none` with `border-default`. Shadows are only for floating layers.

---

## Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Hover, micro-interactions |
| `duration-normal` | 250ms | Default transitions |
| `duration-slow` | 400ms | Page transitions, modals |

### Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default ease-out |
| `ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |

---

## Breakpoint Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `breakpoint-sm` | 640px | Mobile landscape |
| `breakpoint-md` | 768px | Tablet |
| `breakpoint-lg` | 1024px | Desktop |
| `breakpoint-xl` | 1280px | Large desktop |
| `breakpoint-2xl` | 1536px | Wide screens |

---

## Z-Index Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | Default stacking |
| `z-dropdown` | 50 | Dropdown menus |
| `z-sticky` | 100 | Sticky headers |
| `z-drawer` | 200 | Drawers |
| `z-modal` | 300 | Modals |
| `z-toast` | 400 | Toast notifications |
| `z-tooltip` | 500 | Tooltips |

---

## Frame Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `frame-desktop` | 1440px | Desktop frame width |
| `frame-tablet` | 768px | Tablet frame width |
| `frame-mobile` | 375px | Mobile frame width |
| `frame-grid-columns` | 12 | Grid column count |
| `frame-gutter` | 24px | Desktop gutter |
| `frame-margin-desktop` | 32px | Desktop margin |
| `frame-margin-mobile` | 16px | Mobile margin |
| `frame-max-width` | 1280px | Max content width |

---

## JSON Token Map

For automated tooling and Figma Tokens Studio:

```json
{
  "color": {
    "primary": {
      "50": { "value": "#f0fdf4", "type": "color" },
      "100": { "value": "#dcfce7", "type": "color" },
      "200": { "value": "#bbf7d0", "type": "color" },
      "300": { "value": "#86efac", "type": "color" },
      "400": { "value": "#4ade80", "type": "color" },
      "500": { "value": "#22c55e", "type": "color" },
      "600": { "value": "#16a34a", "type": "color" },
      "700": { "value": "#15803d", "type": "color" },
      "800": { "value": "#166534", "type": "color" },
      "900": { "value": "#14532d", "type": "color" },
      "950": { "value": "#052e16", "type": "color" }
    },
    "neutral": {
      "50": { "value": "#fafaf9", "type": "color" },
      "100": { "value": "#f5f5f4", "type": "color" },
      "200": { "value": "#e7e5e4", "type": "color" },
      "300": { "value": "#d6d3d1", "type": "color" },
      "400": { "value": "#a8a29e", "type": "color" },
      "500": { "value": "#78716c", "type": "color" },
      "600": { "value": "#57534e", "type": "color" },
      "700": { "value": "#44403c", "type": "color" },
      "800": { "value": "#292524", "type": "color" },
      "900": { "value": "#1c1917", "type": "color" },
      "950": { "value": "#0c0a09", "type": "color" }
    },
    "brand": {
      "bright": { "value": "#9FE870", "type": "color" }
    }
  },
  "fontSize": {
    "xs": { "value": "10px", "type": "fontSize" },
    "sm": { "value": "13px", "type": "fontSize" },
    "base": { "value": "16px", "type": "fontSize" },
    "lg": { "value": "20px", "type": "fontSize" },
    "xl": { "value": "25px", "type": "fontSize" },
    "2xl": { "value": "31px", "type": "fontSize" },
    "3xl": { "value": "39px", "type": "fontSize" },
    "4xl": { "value": "49px", "type": "fontSize" },
    "5xl": { "value": "61px", "type": "fontSize" }
  },
  "spacing": {
    "1": { "value": "4px", "type": "spacing" },
    "2": { "value": "8px", "type": "spacing" },
    "3": { "value": "12px", "type": "spacing" },
    "4": { "value": "16px", "type": "spacing" },
    "5": { "value": "20px", "type": "spacing" },
    "6": { "value": "24px", "type": "spacing" },
    "8": { "value": "32px", "type": "spacing" },
    "10": { "value": "40px", "type": "spacing" },
    "12": { "value": "48px", "type": "spacing" },
    "16": { "value": "64px", "type": "spacing" }
  },
  "borderRadius": {
    "sm": { "value": "6px", "type": "borderRadius" },
    "md": { "value": "8px", "type": "borderRadius" },
    "lg": { "value": "12px", "type": "borderRadius" },
    "xl": { "value": "16px", "type": "borderRadius" },
    "full": { "value": "999px", "type": "borderRadius" }
  }
}
```

---

## Dark Mode Token System

> **Status**: Draft — ready for implementation when dark mode is prioritized (see P3.5 in NEXT_STEPS.md).

### Philosophy

Dark mode is not a simple inversion. Surfaces lighten progressively toward the user (darkest at the back, lighter on top), and text maintains the same semantic relationships with adjusted contrast.

### Color Mapping

| Light Token | Light Value | Dark Token | Dark Value | Rationale |
|-------------|-------------|------------|------------|-----------|
| `surface-page` | `#f4f8f5` | `dark:surface-page` | `#0c0a09` | Deepest neutral — page background |
| `surface-page-alt` | `#fafaf9` | `dark:surface-page-alt` | `#141210` | Slightly lifted for alternating sections |
| `surface-card` | `#ffffff` | `dark:surface-card` | `#1c1917` | Card backgrounds — neutral-900 |
| `surface-elevated` | `#ffffff` | `dark:surface-elevated` | `#292524` | Modals, dropdowns, toasts — neutral-800 |
| `surface-overlay` | `rgba(28,25,23,0.5)` | `dark:surface-overlay` | `rgba(0,0,0,0.7)` | Darker overlay for better focus trapping |
| `text-primary` | `#1c1917` | `dark:text-primary` | `#f5f5f4` | Primary text — neutral-100 |
| `text-secondary` | `#57534e` | `dark:text-secondary` | `#a8a29e` | Body text — neutral-400 |
| `text-muted` | `#78716c` | `dark:text-muted` | `#78716c` | Captions stay the same (mid-neutral works in both) |
| `text-inverse` | `#ffffff` | `dark:text-inverse` | `#1c1917` | Text on light surfaces in dark mode |
| `border-default` | `#e7e5e4` | `dark:border-default` | `#292524` | Subtle borders — neutral-800 |
| `border-strong` | `#d6d3d1` | `dark:border-strong` | `#44403c` | Focus borders — neutral-700 |

### Semantic Colors in Dark Mode

Semantic colors (primary, success, warning, error, info) remain **unchanged in hue** but may shift in usage:

| Token | Dark Mode Behavior |
|-------|-------------------|
| `primary-500` | Same hex `#22c55e`; used for active borders, focus rings, and interactive elements |
| `primary-600` | Same hex `#16a34a`; links on dark backgrounds (contrast against `#1c1917` = 5.8:1 ✅) |
| `success-500` | Same hex `#22c55e`; success states |
| `warning-500` | Same hex `#e8950f`; warning states |
| `error-500` | Same hex `#ef4444`; error states |
| `info-500` | Same hex `#3b82f6`; info states |

> **Brand-bright** (`#9FE870`) is preserved for accents but used more sparingly in dark mode to avoid glare.

### Component Dark Mode Rules

| Component | Dark Rule |
|-----------|-----------|
| Card | `bg-surface-card` + `border-default` (subtle border for definition) |
| Button Primary | Same `primary-500` bg, `primary-950` text (7.1:1 ✅) |
| Button Secondary | `bg-neutral-800` + `text-primary` |
| Input | `bg-surface-page-alt` + `border-default`, focus → `border-strong` |
| Avatar | No change to image; fallback initials use `neutral-700` bg |
| Modal | `bg-surface-elevated`, `dark:surface-overlay` backdrop |
| Toast | `bg-surface-elevated`, semantic border-left for variant |
| Tooltip | `bg-neutral-700` + `text-primary` (invert of light mode) |

### Tailwind Implementation Pattern

```css
/* globals.css or tailwind.config dark mode plugin */
.dark {
  --mu-surface-page: #0c0a09;
  --mu-surface-card: #1c1917;
  --mu-surface-elevated: #292524;
  --mu-text-primary: #f5f5f4;
  --mu-text-secondary: #a8a29e;
  --mu-border-default: #292524;
}
```

```tsx
/* Component usage */
<div className="bg-surface-page dark:bg-[var(--mu-surface-page)]">
  <Card className="bg-surface-card dark:bg-[var(--mu-surface-card)] border-border-default dark:border-[var(--mu-border-default)]">
```

### Accessibility

- All dark mode combinations must meet WCAG AA 4.5:1 for normal text.
- `prefers-color-scheme: dark` is the default trigger; manual toggle overrides.
- Respect `prefers-reduced-motion` for any dark mode transition animations.
- Avoid pure black (`#000000`) — use `#0c0a09` (neutral-950) to reduce eye strain.

---

## Token Reconciliation Notes

The following corrections were applied to resolve inconsistencies found during review:

1. **neutral-200**: Unified to `#e7e5e4` (was `#E8E6E1` in components.md)
2. **neutral-500**: Unified to `#78716c` (was `#8A8580` in components.md)
3. **Link color**: Specified as `primary-600` (#16a34a) for WCAG AA compliance on white
4. **text-sm**: 13px (not 14px)
5. **text-lg**: 20px (not 18px)
6. **Shadows**: Cards use `none`; floating elements use `sm/md/lg/xl`
7. **radius-full**: Reserved for avatars and badges only
8. **Avatar sizes**: Aligned to components.md scale (md=40, lg=56, xl=80, 2xl=128)
9. **Badge/Toast**: Already use semantic tokens (`primary-50`, `warning-bg`, etc.); no hardcoded hexes in components.md
10. **Dark mode**: Draft token system added with full surface/text/border mappings and component rules

---

*Tokens are the single source of truth. All components and frames must reference these values.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
