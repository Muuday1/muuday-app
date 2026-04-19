# Professional Onboarding — Figma Frame Specs

> **Journey:** Professional registration and verification  
> **Source:** `docs/product/design-system/frames/professional-onboarding.md`

---

## Frame 1: Registration (`/registrar-profissional`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Stepper | Progress/Stepper | (360, 96) | (720, 48) | step: 32px, active: primary-500 | Top, Center |
| 3 | Form Card | Card/Form | (360, 168) | (720, 520) | bg: surface-card, border: neutral-200, radius: radius-lg | Center |
| 4 | Form Title | Text/H2 | (384, 192) | (400, 36) | font: text-xl, font-semibold | Top, Left |
| 5 | Name Input | Input | (384, 252) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 6 | Email Input | Input | (384, 316) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 7 | CPF Input | Input | (384, 380) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 8 | Specialty Select | Select | (384, 444) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 9 | Bio Textarea | Textarea | (384, 508) | (672, 100) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 10 | Actions | Button/Group | (384, 636) | (672, 48) | gap: 16px | Bottom, Left+Right |

---

## Frame 2: Verification (`/registrar-profissional/verificacao`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Stepper | Progress/Stepper | (360, 96) | (720, 48) | step: 32px | Top, Center |
| 3 | Form Card | Card/Form | (360, 168) | (720, 600) | bg: surface-card, border: neutral-200 | Top, Center |
| 4 | Doc Label | Text/Label | (384, 192) | (300, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 5 | Doc Upload | Dropzone | (384, 220) | (672, 100) | bg: surface-page, border-dashed: neutral-300 | Top, Left+Right |
| 6 | Creds Label | Text/Label | (384, 340) | (300, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 7 | Creds Input | Input | (384, 368) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 8 | Selfie Label | Text/Label | (384, 432) | (300, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 9 | Selfie Capture | Camera/Preview | (384, 460) | (200, 200) | bg: neutral-900, radius: radius-lg | Top, Left |
| 10 | Submit Button | Button/Primary | (384, 696) | (672, 48) | bg: primary-500 | Bottom, Left+Right |

---

## Frame 3: Approval Waiting (`/registrar-profissional/aguardando`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Empty Icon | Icon/Large | (640, 160) | (160, 160) | icon: Clock, color: warning, size: 64px | Center |
| 3 | Title | Text/H1 | (360, 340) | (720, 40) | font: text-2xl, text-center | Center |
| 4 | Subtitle | Text/Body | (360, 392) | (720, 24) | font: text-lg, text-center, color: neutral-600 | Center |
| 5 | Timeline Card | Card/Timeline | (360, 448) | (720, 160) | bg: surface-card, border: neutral-200 | Center |
| 6 | CTA Button | Button/Primary | (360, 640) | (720, 48) | bg: primary-500 | Bottom, Center |

---

## Frame 4: First Booking Enabled (`/dashboard`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page | Left |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page | Top |
| 3 | Welcome Banner | Card/Banner | (280, 96) | (1140, 120) | bg: primary-50, border: primary-200, radius: radius-lg | Top, Left+Right |
| 4 | Banner Title | Text/H3 | (304, 120) | (600, 28) | font: text-lg, color: primary-700 | Top, Left |
| 5 | Empty Agenda | Card/Empty | (280, 240) | (1140, 400) | bg: surface-card, border: neutral-200 | Top, Left+Right |
| 6 | Checklist | List/Checklist | (304, 280) | (600, 200) | gap: 12px | Top, Left |
| 7 | Quick CTA | Button/Primary | (304, 520) | (240, 48) | bg: primary-500 | Top, Left |

---

*Figma specs complete for Professional Onboarding.*
