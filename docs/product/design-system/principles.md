# Muuday Design Principles

> **Version**: 1.0  
> **Date**: 2026-04-19  
> **Inspiration**: Wise (modern, flat, hyper-professional)

---

## 1. Content First

The interface exists to serve the content — not the other way around. Every element must justify its presence by supporting the user's primary task.

- **Typography is the interface**: Text hierarchy conveys structure before any visual decoration.
- **Data density over decoration**: Show what matters, hide what doesn't.
- **Progressive disclosure**: Surface essential information first; reveal details on demand.

---

## 2. Flat Surfaces

Inspired by Wise's clean aesthetic — no gratuitous depth, no ornamental shadows.

- **Cards use borders, not shadows**: `1px solid` on `neutral-200` defines containment.
- **Shadows are reserved for floating layers only**: dropdowns, modals, toasts, drawers.
- **No embossed or inset effects**: Keep surfaces truly flat.
- **Background hierarchy**: page → section → card → elevated.

---

## 3. Generous Whitespace

Breathing room creates trust and readability. Crowded interfaces feel cheap.

| Context | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Section padding (min) | 48px | 32px | 24px |
| Between sections | 64px | 48px | 32px |
| Card internal padding | 24px | 20px | 16px |
| Between related elements | 16px | 12px | 12px |
| Between unrelated elements | 32px | 24px | 16px |

---

## 4. Predictable Rhythm

Users should never guess where to find something. Consistent patterns reduce cognitive load.

- **8pt grid**: All spacing, sizing, and positioning snap to an 8px baseline.
- **Consistent component behavior**: A button always looks and acts like a button.
- **F-pattern and Z-pattern layouts**: Content flows predictably across screens.

---

## 5. Accessible by Default

WCAG 2.1 AA compliance is non-negotiable.

- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text and UI components.
- **Focus indicators**: Visible `2px solid` focus ring with `2px` offset.
- **Keyboard navigation**: Every interactive element reachable via Tab.
- **Screen reader support**: Proper ARIA labels, landmarks, and live regions.
- **Motion**: Respect `prefers-reduced-motion` for all animations.

---

## 6. Purposeful Motion

Motion guides attention and provides feedback — never entertains.

- **Fade transitions**: 150–250ms for state changes.
- **Slide for spatial context**: Drawers, modals, toasts.
- **Scale for emphasis**: Success states, important notifications.
- **No bounce, no elastic**: Keep motion linear or ease-out only.

---

## Grid System

### 12-Column Grid

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Columns | 12 | 12 | 12 |
| Gutter | 24px | 16px | 16px |
| Margin | 32px | 24px | 16px |
| Max width | 1280px | 100% | 100% |

### Container Behavior

- Content max-width: `1280px` centered
- Breakpoints: `sm(640)`, `md(768)`, `lg(1024)`, `xl(1280)`, `2xl(1536)`

---

## Iconography

- **Library**: Lucide React
- **Stroke width**: 1.5px (default), 2px (emphasis)
- **Size scale**: 16px (sm), 20px (md), 24px (lg), 32px (xl)
- **Color**: Inherit from text color unless explicitly decorative

---

## Avatar Sizes

| Size | Dimension | Usage |
|------|-----------|-------|
| xs | 24px | Inline mentions, lists |
| sm | 32px | Compact cards, tables |
| md | 48px | Profile headers, reviews |
| lg | 64px | Hero profiles |
| xl | 96px | Empty states, onboarding |
| 2xl | 128px | Cover images, large displays |

> ⚠️ **Note**: `components.md` uses md=40, lg=56, xl=80. Use `components.md` values for implementation; this table reflects the original intent.

---

## Focus Ring Specification

```
Width: 2px
Style: solid
Color: primary-500 (#22c55e)
Offset: 2px
Border-radius: matches element radius
```

---

## Motion Specification

| Type | Duration | Easing | Use Case |
|------|----------|--------|----------|
| Micro (hover) | 150ms | ease-out | Button hover, link hover |
| Standard | 250ms | ease-out | State changes, accordion |
| Macro (page) | 400ms | ease-out | Page transitions, modal |
| Entrance | 300ms | ease-out | Elements appearing |
| Exit | 200ms | ease-in | Elements disappearing |

**Easing function**: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## File Naming Conventions

- Frames: `[journey]-[screen-name].md`
- Components: `[category]-[component-name].md`
- Tokens: group by category in single file

---

*Muuday Design System — Built for trust, designed for wellness.*
