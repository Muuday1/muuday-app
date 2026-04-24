# User Onboarding — Figma Frame Specs

> **Journey:** New user registration and onboarding  
> **Source:** `docs/product/design-system/frames/user-onboarding.md`

---

## Frame 1: Signup (`/cadastro`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Form Card | Card/Form | (460, 120) | (520, 560) | bg: surface-card, border: neutral-200, radius: radius-lg | Center |
| 3 | Logo | Icon/Brand | (640, 152) | (160, 48) | color: primary-500 | Top, Center |
| 4 | Title | Text/H1 | (484, 224) | (472, 36) | font: text-xl, text-center | Top, Center |
| 5 | Email Input | Input | (484, 284) | (472, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 6 | Password Input | Input | (484, 348) | (472, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 7 | Confirm Input | Input | (484, 412) | (472, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 8 | Terms Checkbox | Checkbox | (484, 476) | (472, 24) | label: text-sm | Top, Left |
| 9 | Submit Button | Button/Primary | (484, 524) | (472, 48) | bg: primary-500 | Top, Left+Right |
| 10 | Login Link | Text/Link | (484, 596) | (472, 20) | text: primary-600, text-center | Bottom, Center |

---

## Frame 2: Profile Basics (`/cadastro/perfil`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Stepper | Progress/Stepper | (360, 96) | (720, 48) | step: 32px | Top, Center |
| 3 | Form Card | Card/Form | (360, 168) | (720, 520) | bg: surface-card, border: neutral-200 | Top, Center |
| 4 | Avatar Upload | Avatar/Upload | (640, 200) | (80, 80) | radius: radius-full | Top, Center |
| 5 | Name Input | Input | (384, 312) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 6 | Phone Input | Input | (384, 376) | (672, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 7 | Bio Textarea | Textarea | (384, 440) | (672, 100) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 8 | Actions | Button/Group | (384, 576) | (672, 48) | gap: 16px | Bottom, Left+Right |

---

## Frame 3: Onboarding Complete (`/cadastro/concluido`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Success Icon | Icon/Large | (640, 160) | (160, 160) | icon: CheckCircle, color: primary-500 | Center |
| 3 | Title | Text/H1 | (360, 340) | (720, 40) | font: text-2xl, text-center | Center |
| 4 | Subtitle | Text/Body | (360, 392) | (720, 24) | font: text-lg, text-center, color: neutral-600 | Center |
| 5 | Feature Cards | Card/Grid | (360, 456) | (720, 160) | gap: 16px, 3 columns | Center |
| 6 | CTA Button | Button/Primary | (360, 656) | (720, 48) | bg: primary-500 | Bottom, Center |

---

*Figma specs complete for User Onboarding.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
