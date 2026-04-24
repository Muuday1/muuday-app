# Trust & Safety — Figma Frame Specs

> **Journey:** Reporting, disputes, and resolution  
> **Source:** `docs/product/design-system/frames/trust-safety.md`

---

## Frame 1: Report Flow (`/reportar`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-overlay`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Backdrop | Shape/Overlay | (0, 0) | (1440, 900) | bg: surface-overlay | Center |
| 2 | Modal | Modal/Form | (420, 120) | (600, 660) | bg: surface-elevated, shadow: shadow-lg, radius: radius-lg | Center |
| 3 | Modal Title | Text/H2 | (444, 144) | (552, 36) | font: text-xl, font-semibold | Top, Left |
| 4 | Close Button | Button/Icon | (960, 144) | (32, 32) | icon: X, color: neutral-500 | Top, Right |
| 5 | Reason Label | Text/Label | (444, 200) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 6 | Reason Select | Select | (444, 228) | (552, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 7 | Details Label | Text/Label | (444, 292) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 8 | Details Textarea | Textarea | (444, 320) | (552, 160) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 9 | Evidence Label | Text/Label | (444, 500) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 10 | Upload Zone | Dropzone | (444, 528) | (552, 80) | bg: surface-page, border-dashed: neutral-300, radius: radius-md | Top, Left+Right |
| 11 | Submit Button | Button/Primary | (444, 636) | (552, 48) | bg: primary-500 | Bottom, Left+Right |

---

## Frame 2: Dispute Initiation (`/disputa`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-overlay`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Backdrop | Shape/Overlay | (0, 0) | (1440, 900) | bg: surface-overlay | Center |
| 2 | Modal | Modal/Form | (420, 160) | (600, 580) | bg: surface-elevated, shadow: shadow-lg | Center |
| 3 | Title | Text/H2 | (444, 184) | (552, 36) | font: text-xl | Top, Left |
| 4 | Booking Input | Input | (444, 240) | (552, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 5 | Reason Select | Select | (444, 304) | (552, 44) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 6 | Description Textarea | Textarea | (444, 368) | (552, 140) | bg: surface-page, border: neutral-200 | Top, Left+Right |
| 7 | Evidence Dropzone | Dropzone | (444, 528) | (552, 80) | bg: surface-page, border-dashed: neutral-300 | Top, Left+Right |
| 8 | Submit Button | Button/Primary | (444, 636) | (552, 48) | bg: primary-500 | Bottom, Left+Right |

---

## Frame 3: Resolution (`/disputa/resolucao`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface-page | Top |
| 2 | Status Card | Card/Status | (360, 96) | (720, 120) | bg: surface-card, border: neutral-200 | Top, Center |
| 3 | Status Badge | Badge | (384, 120) | (140, 28) | bg: info-bg, text: info | Top, Left |
| 4 | Thread Card | Card/Chat | (360, 240) | (720, 320) | bg: surface-card, border: neutral-200 | Top, Center |
| 5 | Resolution Card | Card/Decision | (360, 584) | (720, 160) | bg: surface-page-alt, border: neutral-200 | Bottom, Center |
| 6 | Accept Button | Button/Primary | (384, 680) | (336, 48) | bg: primary-500 | Bottom, Left |
| 7 | Reject Button | Button/Ghost | (736, 680) | (320, 48) | text: neutral-700 | Bottom, Right |

---

*Figma specs complete for Trust & Safety.*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
