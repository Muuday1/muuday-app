# Muuday Design Tokens — Figma Variables Export

> **Purpose**: Ready-to-import token values for Figma Variables (or Tokens Studio). Copy-paste into Figma's variable editor or use Figma Tokens plugin.

---

## How to Import

1. **Figma Native Variables** (Figma 2023+):
   - Open Figma → Design panel → Local variables
   - Create collection "Muuday Tokens"
   - Add variables below as color/string/number variables
   - Create modes: `Light` (default)

2. **Tokens Studio Plugin**:
   - Install "Tokens Studio for Figma"
   - Import this JSON or copy-paste per token group

---

## Color Tokens

| Token | Type | Light Value | Usage |
|-------|------|-------------|-------|
| `primary/50` | color | `#f0fdf4` | Lightest green bg |
| `primary/100` | color | `#dcfce7` | Hover row bg |
| `primary/200` | color | `#bbf7d0` | Light accent bg |
| `primary/300` | color | `#86efac` | Decorative |
| `primary/400` | color | `#4ade80` | Hover state |
| `primary/500` | color | `#22c55e` | Primary action, CTAs |
| `primary/600` | color | `#16a34a` | Hover primary button, focus ring |
| `primary/700` | color | `#15803d` | Active state |
| `primary/800` | color | `#166534` | Dark emphasis |
| `primary/900` | color | `#14532d` | Text on light green bg |
| `primary/950` | color | `#052e16` | Deepest green |
| `brand/bright` | color | `#9FE870` | Celebratory only (badges, confetti) |
| `accent/orange` | color | `#e8950f` | Warm accent, limited use |

### Neutral Scale

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `neutral/50` | color | `#fafaf9` | Page bg, surface |
| `neutral/100` | color | `#f5f5f4` | Section alt bg |
| `neutral/200` | color | `#e7e5e4` | Borders, dividers |
| `neutral/300` | color | `#d6d3d1` | Disabled borders |
| `neutral/400` | color | `#a8a29e` | Placeholder text |
| `neutral/500` | color | `#78716c` | Secondary text |
| `neutral/600` | color | `#57534e` | Body text |
| `neutral/700` | color | `#44403c` | Strong text |
| `neutral/800` | color | `#292524` | Headings |
| `neutral/900` | color | `#1c1917` | Primary text |
| `neutral/950` | color | `#0c0a09` | Deepest neutral |

### Semantic Colors

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `semantic/success` | color | `primary/500` | Success states |
| `semantic/success-bg` | color | `primary/50` | Success backgrounds |
| `semantic/warning` | color | `#e8950f` | Warnings |
| `semantic/warning-bg` | color | `#fef3c7` | Warning bg |
| `semantic/error` | color | `#ef4444` | Errors |
| `semantic/error-bg` | color | `#fef2f2` | Error bg |
| `semantic/info` | color | `#3b82f6` | Info |
| `semantic/info-bg` | color | `#eff6ff` | Info bg |

### Surface Colors

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `surface/page` | color | `#f4f8f5` | Page background |
| `surface/page-alt` | color | `#fafaf9` | Alt page sections |
| `surface/card` | color | `#ffffff` | Card bg |
| `surface/elevated` | color | `#ffffff` | Modals, dropdowns |
| `surface/overlay` | color | `rgba(28,25,23,0.5)` | Backdrop overlay |
| `surface/header` | color | `#f4f8f5` | Header bg |
| `surface/input` | color | `#ffffff` | Input bg |

### Text Colors

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `text/primary` | color | `#1c1917` | Headings, primary text |
| `text/secondary` | color | `#57534e` | Body text |
| `text/muted` | color | `#78716c` | Captions, labels |
| `text/inverse` | color | `#ffffff` | Text on dark bg |
| `text/disabled` | color | `#a8a29e` | Disabled text |
| `text/link` | color | `primary/600` | Links (WCAG AA ✅) |
| `text/link-hover` | color | `primary/700` | Link hover |

### Border Colors

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `border/default` | color | `#e7e5e4` | Default borders |
| `border/strong` | color | `#d6d3d1` | Focus borders |
| `border/active` | color | `primary/500` | Active/selected borders |

---

## Typography Tokens

| Token | Type | Value | Notes |
|-------|------|-------|-------|
| `font/family/body` | string | `"Inter", sans-serif` | Body text |
| `font/family/display` | string | `"Space Grotesk", sans-serif` | Headings, numbers |
| `font/family/mono` | string | `"JetBrains Mono", monospace` | Code, data |

| Token | Type | Value | Notes |
|-------|------|-------|-------|
| `font/size/xs` | number | 10 | Caption, badges |
| `font/size/sm` | number | 13 | Small text, labels |
| `font/size/base` | number | 16 | Body text |
| `font/size/lg` | number | 20 | Lead text |
| `font/size/xl` | number | 25 | H4, section titles |
| `font/size/2xl` | number | 31 | H3 |
| `font/size/3xl` | number | 39 | H2 |
| `font/size/4xl` | number | 49 | H1 |
| `font/size/5xl` | number | 61 | Hero |

| Token | Type | Value | Notes |
|-------|------|-------|-------|
| `font/weight/regular` | number | 400 | Body |
| `font/weight/medium` | number | 500 | UI elements |
| `font/weight/semibold` | number | 600 | Buttons, labels |
| `font/weight/bold` | number | 700 | Headings |

| Token | Type | Value | Notes |
|-------|------|-------|-------|
| `line-height/tight` | number | 1.25 | Headings |
| `line-height/normal` | number | 1.5 | Body |
| `line-height/relaxed` | number | 1.625 | Large text |

| Token | Type | Value | Notes |
|-------|------|-------|-------|
| `letter-spacing/tight` | number | -0.02 | Display headings |
| `letter-spacing/normal` | number | 0 | Body |
| `letter-spacing/wide` | number | 0.05 | Labels, uppercase |

---

## Spacing Tokens

| Token | Type | Value (px) | Usage |
|-------|------|------------|-------|
| `space/0` | number | 0 | Zero |
| `space/1` | number | 4 | Tight gaps |
| `space/2` | number | 8 | Default gap |
| `space/3` | number | 12 | Component padding |
| `space/4` | number | 16 | Medium gap |
| `space/5` | number | 20 | Form gaps |
| `space/6` | number | 24 | Section gap |
| `space/8` | number | 32 | Large gap |
| `space/10` | number | 40 | Section padding |
| `space/12` | number | 48 | Large section |
| `space/16` | number | 64 | Hero spacing |

---

## Radius Tokens

| Token | Type | Value (px) | Usage |
|-------|------|------------|-------|
| `radius/none` | number | 0 | Sharp edges |
| `radius/sm` | number | 6 | Small elements |
| `radius/md` | number | 8 | Buttons, inputs, default |
| `radius/lg` | number | 12 | Cards, panels |
| `radius/xl` | number | 16 | Modals, large cards |
| `radius/full` | number | 999 | Avatars, badges ONLY |

---

## Shadow Tokens (Floating Elements Only)

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `shadow/sm` | string | `0 1px 2px 0 rgba(0,0,0,0.05)` | Subtle lift |
| `shadow/md` | string | `0 4px 6px -1px rgba(0,0,0,0.1)` | Dropdowns, menus |
| `shadow/lg` | string | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, drawers |
| `shadow/xl` | string | `0 20px 25px -5px rgba(0,0,0,0.1)` | Toasts, notifications |
| `shadow/none` | string | `none` | Cards, flat surfaces |

> ⚠️ **CRITICAL**: Cards, sections, and content panels use `shadow/none`. Shadows only for floating layers (dropdowns, modals, toasts).

---

## Animation Tokens

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `duration/fast` | number | 150 | Hover, micro-interactions |
| `duration/normal` | number | 250 | Default transitions |
| `duration/slow` | number | 400 | Page transitions |

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `easing/default` | string | `cubic-bezier(0.4, 0, 0.2, 1)` | Default ease-out |
| `easing/enter` | string | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |
| `easing/exit` | string | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |

---

## Breakpoint Tokens

| Token | Type | Value (px) | Usage |
|-------|------|------------|-------|
| `breakpoint/sm` | number | 640 | Mobile landscape |
| `breakpoint/md` | number | 768 | Tablet |
| `breakpoint/lg` | number | 1024 | Desktop |
| `breakpoint/xl` | number | 1280 | Large desktop |
| `breakpoint/2xl` | number | 1536 | Wide screens |

---

## Z-Index Tokens

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `z-index/base` | number | 0 | Default |
| `z-index/dropdown` | number | 50 | Dropdowns |
| `z-index/sticky` | number | 100 | Sticky elements |
| `z-index/drawer` | number | 200 | Drawers |
| `z-index/modal` | number | 300 | Modals |
| `z-index/toast` | number | 400 | Toasts |
| `z-index/tooltip` | number | 500 | Tooltips |

---

## Frame Tokens

| Token | Type | Value | Usage |
|-------|------|-------|-------|
| `frame/desktop` | number | 1440 | Desktop frame width |
| `frame/tablet` | number | 768 | Tablet frame width |
| `frame/mobile` | number | 375 | Mobile frame width |
| `frame/grid-columns` | number | 12 | Grid columns |
| `frame/gutter` | number | 24 | Desktop gutter (px) |
| `frame/margin-desktop` | number | 32 | Desktop margin (px) |
| `frame/margin-mobile` | number | 16 | Mobile margin (px) |
| `frame/max-width` | number | 1280 | Max content width |

---

## JSON Export (Tokens Studio Format)

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
    "brand": {
      "bright": { "value": "#9FE870", "type": "color" }
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
  }
}
```

---

## Post-Import Checklist

After importing tokens into Figma:

- [ ] All 11 primary colors verified visually
- [ ] All 11 neutral colors verified visually
- [ ] Semantic colors mapped correctly
- [ ] Typography sizes: 10, 13, 16, 20, 25, 31, 39, 49, 61
- [ ] Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- [ ] Radius: 0, 6, 8, 12, 16, 999 (full)
- [ ] Shadows: sm/md/lg/xl/none
- [ ] Create `Light` mode (default)
- [ ] Test a component with tokens applied
