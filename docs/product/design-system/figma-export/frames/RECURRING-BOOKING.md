# Recurring Booking — Figma Frame Specs

> **Journey:** Package/recurring session booking  
> **Source:** `docs/product/design-system/frames/recurring-booking.md`

---

## Frame 1: Type Selection (`/agendar/[id]`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Title | Text/H1 | (360, 96) | (720, 40) | font: text-2xl | Top, Center |
| 3 | Single Card | Card/Selectable | (360, 160) | (720, 160) | bg: surface-card, border: neutral-200, radius: radius-lg | Top, Center |
| 4 | Single Radio | Radio | (384, 192) | (20, 20) | border: neutral-300, checked: primary-500 | Top, Left |
| 5 | Single Title | Text/H3 | (420, 188) | (300, 28) | font: text-lg, font-semibold | Top, Left |
| 6 | Single Desc | Text/Body | (420, 224) | (624, 20) | font: text-base, color: neutral-600 | Top, Left |
| 7 | Single Price | Text/H3 | (420, 256) | (200, 28) | font: text-lg, color: primary-500 | Top, Left |
| 8 | Recurring Card | Card/Selectable | (360, 344) | (720, 180) | bg: surface-card, border: neutral-200, radius: radius-lg | Top, Center |
| 9 | Recurring Radio | Radio | (384, 376) | (20, 20) | border: neutral-300, checked: primary-500 | Top, Left |
| 10 | Recurring Title | Text/H3 | (420, 372) | (300, 28) | font: text-lg, font-semibold | Top, Left |
| 11 | Recurring Desc | Text/Body | (420, 408) | (624, 20) | font: text-base, color: neutral-600 | Top, Left |
| 12 | Discount Badge | Badge/Success | (420, 440) | (140, 24) | bg: primary-50, text: primary-700 | Top, Left |
| 13 | Continue Button | Button/Primary | (360, 560) | (720, 48) | bg: primary-500 | Bottom, Center |

### Notes
- Selected card gets `border-primary-500` and `ring-2 ring-primary-500`.
- Radio is decorative; entire card is clickable.

---

## Frame 2: Recurring Config (`/agendar/[id]/recorrente`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Stepper | Progress/Stepper | (360, 96) | (720, 48) | step: 32px, active: primary-500 | Top, Center |
| 3 | Form Card | Card/Form | (360, 168) | (720, 480) | bg: surface-card, border: neutral-200 | Top, Center |
| 4 | Freq Label | Text/Label | (384, 192) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 5 | Freq Select | Select | (384, 220) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 6 | Sessions Label | Text/Label | (384, 284) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 7 | Sessions Select | Select | (384, 312) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 8 | Duration Info | Text/Body | (384, 376) | (672, 20) | font: text-base, color: neutral-600 | Top, Left |
| 9 | Summary Card | Card/Inner | (384, 420) | (672, 120) | bg: surface-page-alt, radius: radius-md | Top, Left+Right |
| 10 | Summary Title | Text/H4 | (408, 436) | (200, 24) | font: text-base, font-semibold | Top, Left |
| 11 | Summary Total | Text/H3 | (408, 472) | (300, 28) | font: text-lg, color: primary-500 | Top, Left |
| 12 | Summary Save | Text/Body | (408, 508) | (300, 20) | font: text-sm, color: success | Top, Left |
| 13 | Actions | Button/Group | (384, 672) | (672, 48) | gap: 16px | Bottom, Left+Right |

---

## Frame 3: Slot Selection (`/agendar/[id]/slots`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Stepper | Progress/Stepper | (360, 96) | (720, 48) | step: 32px | Top, Center |
| 3 | Count Badge | Badge | (1100, 96) | (120, 28) | bg: primary-500, text: white | Top, Right |
| 4 | Calendar | Calendar/Month | (360, 168) | (720, 400) | day: 40px, gap: 8px | Top, Center |
| 5 | Selected List | List/Slots | (360, 592) | (720, 120) | gap: 8px | Top, Center |
| 6 | Actions | Button/Group | (360, 736) | (720, 48) | gap: 16px | Bottom, Center |

---

## Frame 4: Success (`/agendar/[id]/confirmacao`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Success Icon | Icon/Large | (640, 160) | (160, 160) | icon: CheckCircle, color: primary-500 | Center |
| 3 | Title | Text/H1 | (360, 340) | (720, 40) | font: text-2xl, text-center | Center |
| 4 | Summary Card | Card/Summary | (360, 400) | (720, 280) | bg: surface-card, border: neutral-200 | Center |
| 5 | Session List | List/Sessions | (384, 440) | (672, 160) | gap: 8px | Top, Left+Right |
| 6 | Total | Text/H3 | (384, 620) | (300, 28) | font: text-lg, color: primary-500 | Bottom, Left |
| 7 | CTAs | Button/Group | (360, 700) | (720, 48) | gap: 16px | Bottom, Center |

---

*Figma specs complete for Recurring Booking.*
