# Session Lifecycle — Figma Frame Specs

> **Journey:** Video session pre-join, in-session, post-session  
> **Source:** `docs/product/design-system/frames/session-lifecycle.md`

---

## Frame 1: Pre-join (`/sessao/[id]/lobby`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Session Info | Card/Info | (360, 96) | (720, 120) | bg: surface-card, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 3 | Info Title | Text/H3 | (384, 120) | (400, 28) | font: text-lg, font-semibold | Top, Left |
| 4 | Info Details | Text/Body | (384, 156) | (672, 20) | font: text-base, color: neutral-600 | Top, Left |
| 5 | Video Preview | Video/Preview | (360, 240) | (720, 405) | bg: neutral-900, radius: radius-lg | Center |
| 6 | Blur Toggle | Toggle/Row | (360, 661) | (720, 40) | label: text-base, toggle: primary-500 | Top, Left+Right |
| 7 | Device Controls | Toolbar | (540, 720) | (360, 56) | gap: 16px | Center, Bottom |
| 8 | Mic Button | IconButton | (540, 720) | (56, 56) | bg: neutral-200, icon: neutral-700, radius: radius-full | Bottom |
| 9 | Cam Button | IconButton | (612, 720) | (56, 56) | bg: neutral-200, icon: neutral-700, radius: radius-full | Bottom |
| 10 | Speaker Button | IconButton | (684, 720) | (56, 56) | bg: neutral-200, icon: neutral-700, radius: radius-full | Bottom |
| 11 | Join Button | Button/Primary | (520, 800) | (400, 48) | bg: primary-500, radius: radius-md | Bottom, Center |

### Notes
- Video preview shows user's camera feed or placeholder avatar.
- Device controls are 56px circles.
- Active state: `bg-primary-500`, `text-white`.
- Mobile: video preview becomes full-width, controls stack vertically.

---

## Frame 2: In-session (`/sessao/[id]`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `neutral-900`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Main Video | Video/Main | (0, 0) | (1440, 900) | bg: neutral-900, object-cover | Center |
| 2 | Self View | Video/PiP | (1232, 680) | (160, 120) | bg: neutral-800, border: 2px white, radius: radius-md | Bottom, Right |
| 3 | Timer | Text/Overlay | (680, 24) | (80, 24) | font: text-sm, color: white/80 | Top, Center |
| 4 | Toolbar | Toolbar/Floating | (440, 820) | (560, 64) | bg: surface-elevated, shadow: shadow-lg, radius: radius-xl | Bottom, Center |
| 5 | Mic | IconButton | (464, 828) | (48, 48) | bg: neutral-200, radius: radius-full | Bottom |
| 6 | Video | IconButton | (528, 828) | (48, 48) | bg: neutral-200, radius: radius-full | Bottom |
| 7 | Chat | IconButton | (592, 828) | (48, 48) | bg: neutral-200, radius: radius-full | Bottom |
| 8 | Share | IconButton | (656, 828) | (48, 48) | bg: neutral-200, radius: radius-full | Bottom |
| 9 | End | IconButton | (768, 828) | (48, 48) | bg: error, text: white, radius: radius-full | Bottom |
| 10 | Chat Drawer | Drawer/Right | (1080, 64) | (360, 836) | bg: surface-elevated, shadow: shadow-lg | Right, Top+Bottom |

### Notes
- Toolbar floats 40px from bottom, centered.
- End call button is red (`error`).
- Chat drawer slides from right, 360px wide.
- Mobile: toolbar becomes full-width, icons smaller.

---

## Frame 3: Post-session (`/sessao/[id]/review`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top, Left+Right |
| 2 | Summary Card | Card/Section | (360, 96) | (720, 140) | bg: surface-card, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 3 | Review Title | Text/H2 | (360, 260) | (720, 36) | font: text-xl, font-semibold, text-center | Top, Center |
| 4 | Stars | Rating/Stars | (560, 316) | (320, 48) | star: 32px, empty: neutral-300, filled: accent-orange | Center |
| 5 | Review Label | Text/Label | (360, 380) | (720, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 6 | Review Textarea | Textarea | (360, 408) | (720, 120) | bg: surface-card, border: neutral-200, radius: radius-md | Top, Left+Right |
| 7 | Submit Button | Button/Primary | (560, 552) | (320, 48) | bg: primary-500, radius: radius-md | Top, Center |

### Notes
- Star rating: 5 stars, 32px each.
- Hover: star turns `accent-orange`.
- Textarea optional — can submit with rating only.

---

*Figma specs complete for Session Lifecycle.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
