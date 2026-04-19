# Search & Booking Journey — Figma Frame Specs

> **Journey:** Client search-to-booking flow  
> **Source:** `docs/product/design-system/frames/search-booking.md`

---

## Frame 1: Search Results (`/buscar`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline grid, 12-column grid (desktop), 32px page margins, 24px gutters

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Search Input | Input/Search | (32, 80) | (800, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left |
| 3 | Location Chip | Chip/Filter | (848, 88) | (120, 32) | bg: surface-muted, text: neutral-900, radius: radius-lg | Top, Left |
| 4 | Filter Button | Button/Icon | (984, 88) | (80, 32) | icon: neutral-500 | Top, Left |
| 5 | Category Chips | Chip/Filter | (32, 144) | (1376, 32) | bg: surface-muted, text: neutral-900, radius: radius-lg | Top, Left+Right |
| 6 | Filter Sidebar | Sheet/Sidebar | (32, 192) | (280, 700) | bg: surface, border: neutral-200 | Top, Bottom, Left |
| 7 | Pro Card 1 | Card/Pro | (328, 192) | (1080, 200) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 8 | Card Avatar | Avatar/Medium | (348, 212) | (56, 56) | radius: radius-md | Top, Left |
| 9 | Card Name | Text/H3 | (420, 212) | (400, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left |
| 10 | Rating | Text/Inline | (420, 244) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 11 | Card Tags | Tag/Outline | (420, 272) | (300, 24) | border: neutral-200, font: text-sm, radius: radius-sm | Top, Left |
| 12 | Price | Text/H3 | (1140, 272) | (200, 24) | font: text-lg, font-display, color: primary-500 | Top, Right |
| 13 | Pro Card 2 | Card/Pro | (328, 408) | (1080, 200) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 14 | Load More | Button/Secondary | (328, 624) | (1080, 48) | text: neutral-900, bg: surface-muted | Bottom, Left+Right |

### Notes for the Designer
- All frames use the 8px grid. Snap all elements to this grid.
- Header is sticky (z-index: z-sticky).
- Filter sidebar is desktop only; on mobile it becomes a bottom sheet.
- Pro cards are flat — no shadow.
- Card internal padding is 24px (space-6).
- Horizontal gap between sidebar and cards is 16px (space-4).

---

## Frame 2: Profile Bio Tab (`/profissional/[id]`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, content max-width 720px centered (desktop), 16px margins (mobile)

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Cover Photo | Image/Cover | (0, 64) | (1440, 200) | radius: radius-lg (bottom), object-cover | Top, Left+Right |
| 3 | Avatar | Avatar/Large | (360, 232) | (96, 96) | radius: radius-lg, border: 4px surface | Top, Left |
| 4 | Name | Text/H1 | (480, 248) | (600, 32) | font: text-2xl, font-display, color: neutral-900 | Top, Left |
| 5 | Rating Row | Text/Body | (480, 284) | (400, 20) | font: text-base, color: neutral-500 | Top, Left |
| 6 | Badge | Tag/Featured | (480, 312) | (120, 24) | bg: primary-500, text: surface, radius: radius-sm | Top, Left |
| 7 | Tab Bar | Nav/Tabs | (0, 352) | (1440, 48) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 8 | Active Tab | Nav/Tab Active | (360, 352) | (120, 48) | text: neutral-900, border-bottom: 2px primary-500 | Top, Left |
| 9 | Section Title (Sobre mim) | Text/H3 | (360, 424) | (720, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left+Right |
| 10 | Bio Text | Text/Body | (360, 460) | (720, 80) | font: text-base, color: neutral-700 | Top, Left+Right |
| 11 | Section Title (Formação) | Text/H3 | (360, 556) | (720, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left+Right |
| 12 | Info Box | Box/Muted | (360, 596) | (720, 80) | bg: surface-muted, radius: radius-md | Top, Left+Right |
| 13 | Review Card | Card/Review | (360, 692) | (720, 120) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 14 | Sticky CTA | Button/Primary | (980, 800) | (280, 48) | bg: primary-500, text: surface, radius: radius-md | Bottom, Right |

### Notes for the Designer
- Avatar overlaps the cover photo by 32px vertically.
- Tab bar is sticky below the header.
- On mobile, the CTA becomes a full-width sticky bottom bar (64px).
- Content is centered at max-width 720px on desktop.

---

## Frame 3: Services Tab (`/profissional/[id]?tab=servicos`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, content max-width 720px centered

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Profile Header | Group | (0, 64) | (1440, 288) | same as Frame 2 | Top, Left+Right |
| 3 | Tab Bar | Nav/Tabs | (0, 352) | (1440, 48) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 4 | Active Tab (Serviços) | Nav/Tab Active | (480, 352) | (120, 48) | text: neutral-900, border-bottom: 2px primary-500 | Top, Left |
| 5 | Section Title | Text/H3 | (360, 424) | (720, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left+Right |
| 6 | Service Card 1 | Card/Expandable | (360, 460) | (720, 120) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 7 | Card Header | Row/Clickable | (360, 460) | (720, 48) | cursor: pointer, padding: space-4 | Top, Left+Right |
| 8 | Service Name | Text/H3 | (376, 468) | (400, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left |
| 9 | Price | Text/H3 | (1000, 468) | (120, 28) | font: text-lg, font-display, color: primary-500 | Top, Right |
| 10 | Chevron | Icon | (1144, 476) | (24, 24) | color: neutral-500, rotate 180° when expanded | Top, Right |
| 11 | Expanded Body | Box | (360, 508) | (720, 72) | padding-top: space-4, border-top: neutral-200 | Top, Left+Right |
| 12 | Description | Text/Body | (376, 516) | (688, 20) | font: text-base, color: neutral-900 | Top, Left+Right |
| 13 | Includes Tags | Tag/Outline | (376, 548) | (200, 24) | border: primary-500, font: text-sm, radius: radius-sm | Top, Left |
| 14 | Book Button | Button/Secondary | (1000, 548) | (120, 32) | border: primary-500, text: primary-500, radius: radius-md | Top, Right |
| 15 | Service Card 2 | Card/Expandable | (360, 596) | (720, 80) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 16 | Service Card 3 | Card/Expandable | (360, 688) | (720, 80) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 17 | Sticky CTA | Button/Primary | (0, 836) | (1440, 64) | bg: primary-500, text: surface, radius: radius-md | Bottom, Left+Right |

### Notes for the Designer
- Cards stack with 16px gap (space-4).
- Only one card expanded at a time (accordion behavior).
- Hover on card border transitions to primary-500, 150ms ease.
- On mobile, CTA is sticky bottom bar.

---

## Frame 4: Slot Selection (`/agendar/[id]`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, max-width 960px centered (desktop)

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Service Header | Box/Sticky | (0, 64) | (1440, 72) | bg: surface, border-bottom: neutral-200, shadow: shadow-md | Top, Left+Right |
| 3 | Back Button | Button/Icon | (32, 80) | (40, 40) | icon: neutral-500 | Top, Left |
| 4 | Service Title | Text/H2 | (80, 72) | (400, 28) | font: text-xl, font-display, color: neutral-900 | Top, Left |
| 5 | Service Meta | Text/Body | (80, 100) | (400, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 6 | Booking Type Toggle | SegmentedControl | (240, 160) | (960, 48) | bg: surface-muted, border: neutral-200, radius: radius-md | Top, Left+Right |
| 7 | Active Segment | Button/Selected | (240, 160) | (480, 48) | bg: surface, text: neutral-900, shadow: shadow-md | Top, Left |
| 8 | Calendar | Calendar/Picker | (240, 224) | (480, 360) | bg: surface, font: text-base | Top, Left |
| 9 | Day Cell | Button/Day | (256, 280) | (40, 40) | radius: radius-md, font: text-sm | Top, Left |
| 10 | Selected Day | Button/Day Selected | (336, 280) | (40, 40) | bg: primary-500, text: surface | Top, Left |
| 11 | Time Slot | Button/Chip | (752, 272) | (72, 40) | bg: surface, border: neutral-200, radius: radius-md | Top, Left |
| 12 | Selected Slot | Button/Chip Selected | (832, 272) | (72, 40) | bg: primary-500, text: surface | Top, Left |
| 13 | Policy Box | Box/Muted | (240, 600) | (960, 80) | bg: surface-muted, radius: radius-md | Top, Left+Right |
| 14 | Policy Checkbox | Control/Checkbox | (256, 616) | (20, 20) | checked: primary-500, radius: radius-sm | Top, Left |
| 15 | Policy Text | Text/Body | (288, 616) | (896, 20) | font: text-base, color: neutral-900 | Top, Left+Right |
| 16 | Sticky CTA | Button/Primary | (0, 836) | (1440, 64) | bg: primary-500, text: surface, radius: radius-md | Bottom, Left+Right |

### Notes for the Designer
- Service header is sticky below nav (z-index: z-sticky).
- Calendar day cells are 40×40px minimum touch target.
- Time slots are arranged in a 2-column grid on mobile, horizontal row on desktop.
- CTA is disabled until a slot is selected.

---

## Frame 5: Personal Info

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, form max-width 560px centered

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Back Button | Button/Icon | (32, 80) | (40, 40) | icon: neutral-500 | Top, Left |
| 3 | Step Indicator | Text/Label | (1200, 80) | (200, 20) | font: text-sm, color: neutral-500 | Top, Right |
| 4 | Title | Text/H1 | (440, 120) | (560, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left+Right |
| 5 | Subtitle | Text/Body | (440, 164) | (560, 24) | font: text-base, color: neutral-500 | Top, Left+Right |
| 6 | Form Label (Nome) | Text/Label | (440, 212) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 7 | Input (Nome) | Input/Text | (440, 240) | (560, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 8 | Form Label (E-mail) | Text/Label | (440, 304) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 9 | Input (E-mail) | Input/Text | (440, 332) | (560, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 10 | Form Label (Telefone) | Text/Label | (440, 396) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 11 | Input (Telefone) | Input/Text | (440, 424) | (560, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 12 | Form Label (Nascimento) | Text/Label | (440, 488) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 13 | Input (Nascimento) | Input/Text | (440, 516) | (560, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 14 | Form Label (Motivo) | Text/Label | (440, 580) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 15 | Textarea | Input/Textarea | (440, 608) | (560, 120) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 16 | Privacy Checkbox | Control/Checkbox | (440, 744) | (20, 20) | checked: primary-500, radius: radius-sm | Top, Left |
| 17 | Privacy Label | Text/Link | (472, 744) | (400, 20) | font: text-sm, color: primary-500 | Top, Left |
| 18 | CTA | Button/Primary | (440, 784) | (560, 48) | bg: primary-500, text: surface, radius: radius-md | Bottom, Left+Right |

### Notes for the Designer
- Form is centered at max-width 560px on desktop.
- On mobile, inputs become full-width with 16px (space-4) horizontal padding.
- Pre-filled inputs show a check icon inside (right side).
- Validation errors appear below the field in text-sm error-500.

---

## Frame 6: Checkout

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, 2-column layout max-width 960px centered

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Back Button | Button/Icon | (32, 80) | (40, 40) | icon: neutral-500 | Top, Left |
| 3 | Step Indicator | Text/Label | (1200, 80) | (200, 20) | font: text-sm, color: neutral-500 | Top, Right |
| 4 | Title | Text/H1 | (240, 120) | (960, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left+Right |
| 5 | Summary Card | Card/Compact | (240, 176) | (480, 160) | bg: surface-muted, radius: radius-lg | Top, Left |
| 6 | Pro Avatar | Avatar/Small | (256, 192) | (40, 40) | radius: radius-md | Top, Left |
| 7 | Pro Name | Text/H3 | (308, 196) | (400, 24) | font: text-base, font-display, color: neutral-900 | Top, Left |
| 8 | Appointment Meta | Text/Body | (308, 224) | (400, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 9 | Date | Text/Body | (308, 248) | (400, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 10 | Divider | Line | (240, 352) | (960, 1) | color: neutral-200 | Top, Left+Right |
| 11 | Row Label (Consulta) | Text/Body | (240, 368) | (400, 24) | font: text-base, color: neutral-900 | Top, Left |
| 12 | Row Value | Text/Body | (1000, 368) | (200, 24) | font: text-base, color: neutral-900 | Top, Right |
| 13 | Row Label (Taxa) | Text/Body | (240, 400) | (400, 24) | font: text-sm, color: neutral-500 | Top, Left |
| 14 | Row Value (Taxa) | Text/Body | (1000, 400) | (200, 24) | font: text-sm, color: neutral-500 | Top, Right |
| 15 | Divider | Line | (240, 432) | (960, 1) | color: neutral-200 | Top, Left+Right |
| 16 | Total Row | Text/H2 | (240, 448) | (960, 28) | font: text-xl, font-display, color: neutral-900 | Top, Left+Right |
| 17 | Coupon Box | Input/Inline | (240, 496) | (960, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 18 | Apply Button | Button/Text | (1144, 504) | (120, 32) | font: text-sm, color: primary-500 | Top, Right |
| 19 | Payment Method Card | Radio/List | (240, 564) | (960, 120) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 20 | Selected Method | Radio/List Active | (256, 580) | (928, 40) | border: 2px primary-500 | Top, Left+Right |
| 21 | CTA | Button/Primary | (240, 700) | (960, 48) | bg: primary-500, text: surface, radius: radius-md | Bottom, Left+Right |

### Notes for the Designer
- Left column (summary) is 480px, right column (payment) fills remaining width.
- On mobile, columns stack vertically.
- CTA shows dynamic total price.
- Coupon input has an inline apply button on the right.

---

## Frame 7: Payment Processing

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, centered content max-width 480px

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Spinner | Loading/Spinner | (696, 280) | (48, 48) | color: primary-500 | Center |
| 3 | Title | Text/H2 | (480, 344) | (480, 32) | font: text-xl, font-display, color: neutral-900 | Top, Left+Right |
| 4 | Subtitle | Text/Body | (480, 384) | (480, 24) | font: text-base, color: neutral-500 | Top, Left+Right |
| 5 | Hold Banner | Banner/Info | (480, 424) | (480, 80) | bg: surface-muted, radius: radius-md | Top, Left+Right |
| 6 | Timer Icon | Icon | (496, 440) | (20, 20) | color: primary-500 | Top, Left |
| 7 | Timer Text | Text/Body | (528, 440) | (400, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 8 | Progress Bar | Progress/Bar | (496, 472) | (448, 8) | fill: primary-500, track: neutral-200, radius: radius-sm | Top, Left+Right |
| 9 | Appointment Card | Card/Compact | (480, 520) | (480, 80) | bg: surface-muted, radius: radius-lg | Top, Left+Right |
| 10 | Pro Name | Text/Body | (496, 536) | (400, 24) | font: text-base, color: neutral-900 | Top, Left+Right |
| 11 | Details | Text/Body | (496, 564) | (400, 20) | font: text-sm, color: neutral-500 | Top, Left+Right |

### Notes for the Designer
- All content is vertically and horizontally centered.
- Spinner rotates infinitely (1s linear).
- Progress bar animates down as hold timer expires.
- On error, spinner is replaced by error icon and title changes.

---

## Frame 8: Confirmation

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, centered content max-width 560px

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Minimal Header | Shell/Minimal | (0, 0) | (1440, 64) | bg: surface, centered logo only | Top, Left+Right |
| 2 | Success Icon | Icon/Circle | (688, 120) | (64, 64) | bg: primary-500, icon: surface, radius: radius-full | Center |
| 3 | Title | Text/H1 | (440, 200) | (560, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left+Right |
| 4 | Confirmation Card | Card/Featured | (440, 252) | (560, 240) | bg: surface, border: neutral-200, radius: radius-xl | Top, Left+Right |
| 5 | Avatar | Avatar/Medium | (456, 268) | (56, 56) | radius: radius-md | Top, Left |
| 6 | Pro Name | Text/H3 | (528, 276) | (400, 24) | font: text-lg, font-display, color: neutral-900 | Top, Left+Right |
| 7 | Details | Text/Body | (528, 308) | (400, 20) | font: text-base, color: neutral-500 | Top, Left+Right |
| 8 | Calendar Button 1 | Button/Secondary | (456, 348) | (528, 40) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 9 | Calendar Button 2 | Button/Secondary | (456, 396) | (528, 40) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 10 | Next Steps Title | Text/H3 | (440, 508) | (560, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left+Right |
| 11 | Next Steps List | List/Ordered | (440, 548) | (560, 80) | font: text-base, color: neutral-900 | Top, Left+Right |
| 12 | Primary CTA | Button/Primary | (440, 640) | (560, 48) | bg: primary-500, text: surface, radius: radius-md | Bottom, Left+Right |
| 13 | Secondary CTA | Button/Text | (440, 696) | (560, 24) | font: text-base, color: neutral-500 | Bottom, Left+Right |

### Notes for the Designer
- Success icon uses scale-in animation (transition-spring).
- Confirmation card has 24px (space-6) internal padding.
- Calendar export buttons are full-width inside the card.
- On mobile, the card becomes edge-to-edge with 16px padding.
