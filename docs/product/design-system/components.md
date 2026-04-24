# Muuday Component Library

> **Version**: 1.0  
> **Date**: 2026-04-19  
> **Total Components**: 36 (10 primitives + 9 composites + 6 layout + 10 patterns)

---

## Table of Contents

1. [Primitives](#primitives)
2. [Composites](#composites)
3. [Layout](#layout)
4. [Patterns](#patterns)
5. [Accessibility](#accessibility)
6. [Do / Don't](#do--dont)

---

## Primitives

### Button

**Figma Structure**: Component with 4 variant properties:
- `variant`: primary | secondary | ghost | danger
- `size`: sm | md | lg
- `state`: default | hover | active | focus | disabled | loading
- `icon`: none | left | right | only

**Specs**:

| Property | Value |
|----------|-------|
| Radius | `radius-md` (8px) — **NO pill** |
| Padding (sm) | `px-3 py-2` |
| Padding (md) | `px-4 py-2.5` |
| Padding (lg) | `px-6 py-3` |
| Font | `font-semibold`, `text-base` (md), `text-sm` (sm) |
| Gap (icon) | 8px |

**Variants**:

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `primary-500` | `white` | none | `primary-600` |
| Secondary | `neutral-100` | `neutral-900` | `neutral-200` | `neutral-200` |
| Ghost | transparent | `neutral-700` | none | `neutral-100` |
| Danger | `error` | `white` | none | darker error |

**Loading State**: Spinner replaces icon or appears inside button. Button disabled.

**Accessibility**:
- Focus ring: `2px solid primary-500`, offset 2px
- Disabled: `opacity-50`, `cursor-not-allowed`
- Loading: `aria-busy="true"`, `aria-label` indicates loading

---

### Input

**Figma Structure**: Component with variant properties:
- `type`: text | password | email | number | textarea
- `size`: sm | md
- `state`: default | focus | error | disabled

**Specs**:

| Property | Value |
|----------|-------|
| Radius | `radius-md` (8px) |
| Height (sm) | 36px |
| Height (md) | 44px |
| Padding | `px-4 py-2.5` |
| Background | `surface-card` |
| Border | `1px solid border-default` |
| Focus border | `primary-500` |
| Error border | `error` |
| Font | `text-base`, `text-primary` |
| Placeholder | `text-muted` |

**Textarea**: Same styling, min-height 100px, resize vertical.

**Accessibility**:
- Label associated via `htmlFor`
- Error message linked via `aria-describedby`
- Focus ring visible

---

### Select

**Figma Structure**: Dropdown input with chevron icon.

**Specs**: Same as Input for base styling. Dropdown menu uses `shadow-md`, `radius-md`, bg `surface-elevated`.

**Dropdown Items**:
- Padding: `px-4 py-2.5`
- Hover: `bg-neutral-100`
- Selected: `bg-primary-50`, `text-primary-700`

---

### Textarea

**Specs**: Same as Input. Min-height 100px. Resize vertical only.

---

### Checkbox

**Figma Structure**: Component with states:
- `state`: unchecked | checked | indeterminate | disabled
- `size`: sm | md

**Specs**:

| Property | Value |
|----------|-------|
| Size (sm) | 16px |
| Size (md) | 20px |
| Radius | `radius-sm` (6px) |
| Border | `1px solid neutral-300` |
| Checked bg | `primary-500` |
| Checked border | `primary-500` |
| Check icon | White, 12px |

**Accessibility**:
- Native `<input type="checkbox">` with custom styling
- `aria-checked` for indeterminate
- Focus ring on wrapper

---

### Radio

**Specs**: Same as Checkbox but `rounded-full`. 20px size. Dot indicator 8px when checked.

---

### Toggle (Switch)

**Specs**:

| Property | Value |
|----------|-------|
| Width | 44px |
| Height | 24px |
| Radius | `radius-full` (999px) |
| Track (off) | `neutral-300` |
| Track (on) | `primary-500` |
| Thumb | White, 20px circle |
| Thumb offset | 2px |

**Accessibility**:
- Native `<input type="checkbox">` with `role="switch"`
- `aria-checked` reflects state

---

### Badge

**Figma Structure**: Component with variants:
- `variant`: default | success | warning | error | info | pro
- `size`: sm | md

**Specs**:

| Property | Value |
|----------|-------|
| Radius | `radius-full` (999px) — **exception allowed** |
| Padding (sm) | `px-2 py-0.5` |
| Padding (md) | `px-2.5 py-1` |
| Font | `text-xs`, `font-medium` |

**Variants**:

| Variant | Background | Text |
|---------|-----------|------|
| Default | `neutral-100` | `neutral-700` |
| Success | `primary-50` | `primary-700` |
| Warning | `warning-bg` | `warning` |
| Error | `error-bg` | `error` |
| Info | `info-bg` | `info` |
| Pro | `brand-bright` | `neutral-900` |

---

### Avatar

**Figma Structure**: Component with variants:
- `size`: xs | sm | md | lg | xl | 2xl
- `shape`: circle | rounded
- `state`: default | online | offline

**Specs**:

| Size | Dimension | Usage |
|------|-----------|-------|
| xs | 24px | Inline mentions |
| sm | 32px | Compact cards |
| md | 40px | Profile headers |
| lg | 56px | Large displays |
| xl | 80px | Hero sections |
| 2xl | 128px | Cover images |

> ⚠️ **Note**: `principles.md` lists md=48, lg=64, xl=96, 2xl=128. Use this table (from `components.md`) as the canonical implementation scale.

**Fallback**: Initials on `neutral-200` background, `neutral-500` text.

**Online indicator**: 8px green dot, bottom-right, 2px white border.

---

### Icon

**Library**: Lucide React
**Stroke width**: 1.5px (default), 2px (emphasis)
**Sizes**: 16px (sm), 20px (md), 24px (lg), 32px (xl)

---

## Composites

### Card

**Figma Structure**: Auto-layout container with padding.

**Specs**:

| Property | Value |
|----------|-------|
| Background | `surface-card` |
| Border | `1px solid border-default` |
| Radius | `radius-lg` (12px) or `radius-xl` (16px) |
| Shadow | **NONE** — `shadow-none` |
| Padding (sm) | `p-4` |
| Padding (md) | `p-6` |
| Padding (lg) | `p-8` |

**Hover State**: `border-neutral-300` transition, `duration-fast`.

**Selected State**: `border-active` (`primary-500`).

---

### Modal

**Figma Structure**: Centered overlay with backdrop.

**Specs**:

| Property | Value |
|----------|-------|
| Background | `surface-elevated` |
| Radius | `radius-lg` (12px) |
| Shadow | `shadow-lg` ✅ (floating element) |
| Padding | `p-6` |
| Max width | 560px (md), 720px (lg) |
| Backdrop | `surface-overlay` |

**Animation**: Fade in backdrop, scale up modal, `duration-normal`.

---

### Drawer

**Figma Structure**: Slide-out panel from edge.

**Specs**:

| Property | Value |
|----------|-------|
| Background | `surface-elevated` |
| Shadow | `shadow-lg` ✅ (floating element) |
| Width (sm) | 320px |
| Width (md) | 400px |
| Width (lg) | 560px |
| Backdrop | `surface-overlay` |

**Animation**: Slide from right/bottom, `duration-normal`.

---

### Toast

**Figma Structure**: Fixed position notification.

**Specs**:

| Property | Value |
|----------|-------|
| Background | `surface-elevated` |
| Radius | `radius-md` (8px) |
| Shadow | `shadow-xl` ✅ (floating element) |
| Padding | `px-4 py-3` |
| Position | Top-right, bottom-right, or bottom-center |

**Variants**: success | warning | error | info

**Auto-dismiss**: 5 seconds. Progress bar optional.

---

### Tooltip

**Specs**:

| Property | Value |
|----------|-------|
| Background | `neutral-800` |
| Text | `white` |
| Radius | `radius-md` (8px) |
| Padding | `px-3 py-2` |
| Font | `text-sm` |
| Arrow | 8px triangle |
| Shadow | `shadow-md` ✅ |

---

### Dropdown

**Specs**:

| Property | Value |
|----------|-------|
| Background | `surface-elevated` |
| Radius | `radius-md` (8px) |
| Shadow | `shadow-md` ✅ |
| Padding | `py-1` |
| Item padding | `px-4 py-2.5` |
| Divider | `1px solid neutral-200` |

---

### Tabs

**Figma Structure**: Tab list with content panels.

**Specs**:

| Property | Value |
|----------|-------|
| Variant | default (underline) |
| Active indicator | `2px solid primary-500`, bottom |
| Inactive text | `text-secondary` |
| Active text | `text-primary` |
| Tab padding | `px-4 py-3` |
| Gap between tabs | 0 (border separation) |

**⚠️ CRITICAL**: No pill tab variant. Only underline style.

**Accessibility**:
- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- Arrow key navigation
- Focus ring on active tab

---

### Accordion

**Specs**:

| Property | Value |
|----------|-------|
| Background | `surface-card` |
| Border | `1px solid border-default` |
| Radius | `radius-lg` (12px) |
| Header padding | `px-6 py-4` |
| Content padding | `px-6 pb-4` |
| Chevron rotation | 180° when open |
| Animation | `duration-normal` |

---

### Stepper

**Figma Structure**: Horizontal or vertical progress indicator.

**Specs**:

| Property | Value |
|----------|-------|
| Orientation | horizontal | vertical |
| Step size | 32px |
| Step radius | `radius-full` |
| Connector height | 2px |
| Connector gap | 4px |

**States**:
- Pending: `bg-neutral-200`, `text-neutral-500`
- Active: `border-2 border-primary-500`, `text-primary-500`
- Completed: `bg-primary-500`, `text-white`
- Error: `bg-error`, `text-white`

---

## Layout

### Shell

**Structure**: App wrapper with header + main content + optional sidebar.

**Specs**:
- Min height: `100vh`
- Background: `surface-page`
- Content area: flex column

---

### Header

**Specs**:

| Property | Value |
|----------|-------|
| Position | sticky, top-0 |
| Height | 64px |
| Background | `surface-page` |
| Border | `1px solid border-default` (bottom) |
| Shadow | **NONE** — use border only |
| Z-index | `z-sticky` (100) |
| Padding | `px-8` (desktop), `px-4` (mobile) |

**Scrolled state**: Background gains slight opacity change, border remains.

---

### Footer

**Specs**:
- Background: `surface-page-alt`
- Padding: `py-12 px-8`
- Border top: `1px solid border-default`

---

### Sidebar

**Specs**:

| Property | Value |
|----------|-------|
| Width | 240px (expanded), 64px (collapsed) |
| Background | `surface-page` |
| Border | `1px solid border-default` (right) |
| Shadow | **NONE** |
| Padding | `py-4 px-3` |

**Nav items**:
- Height: 40px
- Radius: `radius-md`
- Hover: `bg-neutral-100`
- Active: `bg-primary-50`, `text-primary-700`

---

### Grid

**Specs**:
- 12 columns
- Gutter: 24px (desktop), 16px (tablet/mobile)
- Margin: 32px (desktop), 16px (mobile)
- Max width: 1280px, centered

---

### Section

**Specs**:
- Padding: `py-12 md:py-16 lg:py-20`
- Optional background: `surface-page-alt`

---

## Patterns

### EmptyState

**Specs**:
- Centered content
- Icon: 64px, `neutral-300`
- Title: `text-xl`, `font-semibold`
- Description: `text-base`, `text-secondary`
- CTA: Secondary button
- Padding: `py-12 px-6`

**Types**: search | data | error | notification

---

### Skeleton

**Specs**:
- Background: `neutral-100`
- Radius: `radius-md`
- Animation: pulse, `duration-slow`

**Shapes**:
- Text: height matches font size, full width
- Avatar: square → `rounded-full`
- Card: rectangle with `radius-lg`
- List: multiple text lines stacked

---

### ErrorBoundary

**Specs**:
- Centered content
- Icon: AlertTriangle, `error`
- Title: "Something went wrong"
- Description: Error message or generic fallback
- CTA: "Reload page" or "Go back"

---

### ConfirmationDialog

**Specs**:
- Modal variant
- Title: `text-lg`, `font-semibold`
- Description: `text-base`, `text-secondary`
- Actions: Cancel (ghost) + Confirm (primary or danger)

---

### SearchBar

**Specs**:

| Property | Value |
|----------|-------|
| Height | 48px |
| Background | `surface-card` |
| Border | `1px solid border-default` |
| Radius | `radius-md` |
| Padding | `pl-4 pr-3` |
| Icon | Search, 20px, `text-muted` |
| Clear button | X icon, appears when text present |

**Focus**: Border changes to `primary-500`.

---

### FilterChip

**Specs**:
- Background: `surface-card`
- Border: `1px solid border-default`
- Radius: `radius-md`
- Padding: `px-3 py-1.5`
- Font: `text-sm`

**Active state**: `bg-primary-50`, `border-primary-200`, `text-primary-700`.

---

### Pagination

**Specs**:
- Previous/Next buttons (ghost variant)
- Page numbers: `text-sm`, `radius-md`
- Active: `bg-primary-500`, `text-white`
- Gap between items: 4px

---

### Breadcrumb

**Specs**:
- Items separated by ChevronRight (16px, `text-muted`)
- Current item: `text-primary`, `font-medium`
- Previous items: `text-secondary`, hover underline
- Font: `text-sm`

---

### ProgressBar

**Specs**:
- Track: `bg-neutral-100`, `radius-full`, height 8px
- Fill: `bg-primary-500`, `radius-full`
- Optional label: percentage below or inside

---

### ProgressStep

**Specs**: Same as Stepper but linear (no branching).

---

## Accessibility

### Focus Management

- All interactive elements must have visible focus rings
- Focus ring: `2px solid primary-500`, offset 2px
- Focus trap in modals and drawers
- Return focus on modal close

### ARIA Patterns

| Component | ARIA Roles |
|-----------|-----------|
| Tabs | tablist, tab, tabpanel |
| Accordion | region, button |
| Modal | dialog, aria-modal |
| Stepper | list, listitem |
| Toast | status, alert |
| Tooltip | tooltip |

### Keyboard Navigation

| Component | Keys |
|-----------|------|
| Tabs | ArrowLeft/Right, Home, End |
| Accordion | Enter/Space, ArrowUp/Down |
| Modal | Escape, Tab (trap) |
| Dropdown | Enter/Space, ArrowUp/Down, Escape |
| Stepper | ArrowLeft/Right |

---

## Do / Don't

### Buttons

✅ **Do**
- Use `rounded-md` (8px)
- Keep labels concise (1–3 words)
- Use primary for the main action only

❌ **Don't**
- Use `rounded-full` for buttons
- Use multiple primary buttons in one view
- Disable without explanation

### Cards

✅ **Do**
- Use `border` + `shadow-none`
- Use consistent internal padding
- Use hover state for interactive cards

❌ **Don't**
- Add shadows to cards
- Use different border colors without reason
- Nest cards more than 2 levels deep

### Tabs

✅ **Do**
- Use underline style
- Keep labels short
- Show content immediately on selection

❌ **Don't**
- Use pill tabs
- Use more than 6 tabs
- Nest tabs inside tabs

### Avatars

✅ **Do**
- Use `rounded-full`
- Show fallback initials
- Use consistent sizing per context

❌ **Don't**
- Use `rounded-md` for avatars
- Stretch or distort images
- Use different sizes in the same list

### Shadows

✅ **Do**
- Use shadows on modals, drawers, dropdowns, toasts
- Use `shadow-md` for dropdowns
- Use `shadow-lg` for modals

❌ **Don't**
- Use shadows on cards
- Use shadows on sections
- Use shadows on static content

---

*Component library complete. See individual frame docs for context-specific usage.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
