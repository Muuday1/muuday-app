# Settings & Preferences — Figma Frame Specs

> **Journey:** User and professional settings management  
> **Source:** `docs/product/design-system/frames/settings-preferences.md`

---

## Frame 1: User Settings (`/configuracoes`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, content max-width 720px centered

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Title | Text/H1 | (360, 96) | (720, 40) | font: text-2xl, font-display, color: neutral-900 | Top, Left |
| 3 | Account Card | Card/Section | (360, 152) | (720, 240) | bg: surface-card, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 4 | Card Title | Text/H3 | (384, 176) | (200, 28) | font: text-lg, font-semibold, color: neutral-900 | Top, Left |
| 5 | Email Label | Text/Label | (384, 216) | (100, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 6 | Email Input | Input/ReadOnly | (384, 240) | (480, 44) | bg: surface-page-alt, border: neutral-200, radius: radius-md | Top, Left |
| 7 | Edit Email | Button/Ghost | (880, 240) | (120, 44) | text: primary-600 | Top, Right |
| 8 | Password Label | Text/Label | (384, 300) | (100, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 9 | Password Mask | Text/Body | (384, 324) | (200, 20) | font: text-base, color: neutral-900 | Top, Left |
| 10 | Edit Password | Button/Ghost | (880, 316) | (120, 44) | text: primary-600 | Top, Right |
| 11 | Notifications Card | Card/Section | (360, 408) | (720, 200) | bg: surface-card, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 12 | Notif Title | Text/H3 | (384, 432) | (200, 28) | font: text-lg, font-semibold | Top, Left |
| 13 | Toggle 1 | Toggle/Row | (384, 480) | (672, 48) | label: text-base, toggle: primary-500 | Top, Left+Right |
| 14 | Toggle 2 | Toggle/Row | (384, 536) | (672, 48) | label: text-base, toggle: primary-500 | Top, Left+Right |

### Notes for the Designer
- Settings sections stack vertically with 16px gap.
- Each section is a Card with 24px internal padding.
- Toggles use 44×24px track, 20px thumb.
- Mobile: cards become full-width with 16px margins.

---

## Frame 2: Professional Settings (`/configuracoes/pro`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page, border-right: neutral-200 | Left, Top+Bottom |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page, border-bottom: neutral-200 | Top, Left+Right |
| 3 | Title | Text/H1 | (280, 96) | (400, 40) | font: text-2xl | Top, Left |
| 4 | Availability Card | Card/Section | (280, 152) | (1140, 280) | bg: surface-card, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 5 | Day Selector | Custom/Days | (304, 200) | (600, 48) | day: radius-md, selected: primary-500 | Top, Left |
| 6 | Hours Input | Input/Time | (304, 264) | (200, 44) | bg: surface-page, border: neutral-200 | Top, Left |
| 7 | Notif Card | Card/Section | (280, 448) | (1140, 200) | bg: surface-card, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 8 | Pro Badge | Badge/Pro | (1400, 96) | (80, 28) | bg: brand-bright, text: neutral-900, radius: radius-full | Top, Right |

### Notes
- Sidebar shows active item with `bg-primary-50`, `text-primary-700`.
- Day chips: 48×40px, gap 8px.
- Pro badge floats top-right of content area.

---

*Figma specs complete for Settings & Preferences.*
