# Request Booking — Figma Frame Specs

> **Journey:** Request-based booking flow  
> **Source:** `docs/product/design-system/frames/request-booking.md`

---

## Frame 1: Profile CTA (`/profissional/[id]`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Profile Header | Section/Profile | (0, 64) | (1440, 280) | bg: surface-page-alt | Top |
| 3 | Avatar | Avatar/XL | (360, 160) | (80, 80) | radius: radius-full | Top, Left |
| 4 | Name | Text/H1 | (460, 160) | (400, 36) | font: text-2xl | Top, Left |
| 5 | CTA Button | Button/Primary | (1040, 168) | (240, 48) | bg: primary-500 | Top, Right |
| 6 | Service Cards | Card/Grid | (360, 380) | (720, 160) | gap: 16px | Top, Center |

---

## Frame 2: Request Form (`/solicitar/[id]`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Form Card | Card/Form | (360, 96) | (720, 600) | bg: surface-card, border: neutral-200, radius: radius-lg | Center |
| 3 | Form Title | Text/H2 | (384, 120) | (400, 36) | font: text-xl, font-semibold | Top, Left |
| 4 | Service Select | Select | (384, 176) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 5 | Date Pref Label | Text/Label | (384, 240) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 6 | Date Textarea | Textarea | (384, 268) | (672, 80) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 7 | Urgency Label | Text/Label | (384, 364) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 8 | Urgency Select | Select | (384, 392) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 9 | Notes Textarea | Textarea | (384, 456) | (672, 80) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 10 | Submit Button | Button/Primary | (384, 560) | (672, 48) | bg: primary-500 | Bottom, Left+Right |

---

## Frame 3: Pro Response Panel (`/dashboard/solicitacoes`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page | Left |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page | Top |
| 3 | Tabs | Nav/Tabs | (280, 80) | (400, 48) | border-bottom: neutral-200 | Top, Left |
| 4 | Request Card | Card/Request | (280, 152) | (1140, 140) | bg: surface-card, border: neutral-200 | Top, Left+Right |
| 5 | Card Avatar | Avatar/SM | (304, 176) | (40, 40) | radius: radius-full | Top, Left |
| 6 | Card Actions | Button/Group | (1100, 196) | (300, 40) | gap: 8px | Top, Right |

---

## Frame 4: Negotiation (`/solicitar/[id]/negociar`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Thread Card | Card/Chat | (360, 96) | (720, 400) | bg: surface-card, border: neutral-200 | Top, Center |
| 3 | Proposal Card | Card/Form | (360, 520) | (720, 200) | bg: surface-card, border: neutral-200 | Bottom, Center |
| 4 | Date Input | Input | (384, 560) | (336, 44) | bg: surface-page, border: neutral-200 | Top, Left |
| 5 | Time Select | Select | (736, 560) | (320, 44) | bg: surface-page, border: neutral-200 | Top, Right |
| 6 | Send Button | Button/Primary | (384, 640) | (672, 48) | bg: primary-500 | Bottom, Left+Right |

---

## Frame 5: Success (`/solicitar/[id]/sucesso`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Success Icon | Icon/Large | (640, 200) | (160, 160) | icon: CheckCircle, color: primary-500, size: 64px | Center |
| 3 | Success Title | Text/H1 | (360, 380) | (720, 40) | font: text-2xl, text-center | Center |
| 4 | Summary Card | Card/Summary | (360, 440) | (720, 160) | bg: surface-card, border: neutral-200 | Center |
| 5 | Primary CTA | Button/Primary | (360, 632) | (352, 48) | bg: primary-500 | Bottom, Left |
| 6 | Secondary CTA | Button/Secondary | (728, 632) | (352, 48) | bg: neutral-100 | Bottom, Right |

---

*Figma specs complete for Request Booking.*
