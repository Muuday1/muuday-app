# Profile Edit Journey — Figma Frame Specs

> **Journey:** User and professional profile editing flows  
> **Source:** `docs/product/design-system/frames/profile-edit.md`

---

## Frame 1.1: User Edit Profile

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, form max-width 560px centered

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Back Button | Button/Icon | (32, 80) | (40, 40) | icon: neutral-500, radius: radius-md | Top, Left |
| 3 | Page Title | Text/H1 | (440, 80) | (560, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left+Right |
| 4 | Save Button | Button/Text | (1200, 80) | (80, 32) | font: text-base, color: primary-500 | Top, Right |
| 5 | Avatar Container | Box/Center | (440, 144) | (560, 160) | padding-top: space-8, padding-bottom: space-8 | Top, Left+Right |
| 6 | Avatar | Avatar/XLarge | (560, 144) | (120, 120) | radius: radius-lg, object-fit: cover | Center |
| 7 | Camera Overlay | Button/Icon | (640, 224) | (40, 40) | bg: surface 80% opacity, radius: radius-full | Center |
| 8 | Change Photo Link | Text/Link | (560, 276) | (120, 20) | font: text-sm, color: primary-500 | Center |
| 9 | Section Title (Dados pessoais) | Text/H3 | (440, 328) | (560, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left+Right |
| 10 | Form Label (Nome) | Text/Label | (440, 372) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 11 | Input (Nome) | Input/Text | (440, 400) | (560, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 12 | Form Label (Display) | Text/Label | (440, 464) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 13 | Input (Display) | Input/Text | (440, 492) | (560, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 14 | Form Label (Bio) | Text/Label | (440, 556) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 15 | Textarea | Input/Textarea | (440, 584) | (560, 120) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 16 | Char Counter | Text/Label | (880, 712) | (120, 20) | font: text-sm, color: neutral-500 | Top, Right |
| 17 | Section Title (Contato) | Text/H3 | (440, 752) | (560, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left+Right |
| 18 | Form Label (E-mail) | Text/Label | (440, 796) | (560, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 19 | Input (E-mail) | Input/Text | (440, 824) | (560, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 20 | Verified Badge | Icon/Text | (1000, 832) | (80, 20) | font: text-sm, color: primary-500 | Top, Right |

### Notes for the Designer
- Avatar is centered above the form.
- Camera overlay is positioned bottom-right of the avatar (absolute).
- Save button is disabled until form is dirty.
- On mobile, header is compact and inputs are full-width.

---

## Frame 2.1: Professional Edit Profile

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, 2-column layout on desktop (form left max 640px, live preview right fixed)

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Header | Shell/Header | (0, 0) | (1440, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 2 | Back Button | Button/Icon | (32, 80) | (40, 40) | icon: neutral-500, radius: radius-md | Top, Left |
| 3 | Page Title | Text/H1 | (32, 80) | (400, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left |
| 4 | Save Button | Button/Text | (1200, 80) | (80, 32) | font: text-base, color: primary-500 | Top, Right |
| 5 | Edit/Preview Toggle | SegmentedControl | (32, 144) | (640, 40) | bg: surface-muted, radius: radius-md | Top, Left |
| 6 | Section Card 1 | Card/Form | (32, 200) | (640, 400) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 7 | Section Title 1 | Text/H2 | (48, 216) | (608, 28) | font: text-xl, font-display, color: neutral-900 | Top, Left+Right |
| 8 | Form Label (Nome) | Text/Label | (48, 260) | (608, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 9 | Input (Nome) | Input/Text | (48, 288) | (608, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 10 | Form Label (Especialidade) | Text/Label | (48, 352) | (608, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 11 | Input (Especialidade) | Input/Text | (48, 380) | (608, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 12 | Form Label (Registro) | Text/Label | (48, 444) | (608, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 13 | Input (Registro) | Input/Text | (48, 472) | (608, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 14 | Form Label (Bio) | Text/Label | (48, 536) | (608, 20) | font: text-sm, color: neutral-900 | Top, Left+Right |
| 15 | Textarea (Bio) | Input/Textarea | (48, 564) | (608, 160) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 16 | Char Counter | Text/Label | (536, 732) | (120, 20) | font: text-sm, color: neutral-500 | Top, Right |
| 17 | Section Card 2 | Card/Form | (32, 616) | (640, 200) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 18 | Section Title 2 | Text/H2 | (48, 632) | (608, 28) | font: text-xl, font-display, color: neutral-900 | Top, Left+Right |
| 19 | Add Button | Button/Secondary | (48, 676) | (608, 40) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |
| 20 | Education Item | Row/Card | (48, 732) | (576, 48) | bg: surface-muted, radius: radius-md, padding: space-3 | Top, Left+Right |
| 21 | Menu Button | Button/Icon | (576, 740) | (32, 32) | icon: neutral-500, size: 32px | Top, Right |
| 22 | Section Card 3 | Card/Form | (32, 832) | (640, 160) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 23 | Checkbox Group | Control/Checkbox | (48, 860) | (608, 40) | checked: primary-500, radius: radius-sm, inline | Top, Left+Right |
| 24 | Section Card 4 | Card/Form | (32, 1008) | (640, 240) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 25 | Service Mini Card 1 | Card/Compact | (48, 1032) | (576, 64) | bg: surface-muted, radius: radius-md, padding: space-3 | Top, Left+Right |
| 26 | Service Mini Card 2 | Card/Compact | (48, 1108) | (576, 64) | bg: surface-muted, radius: radius-md, padding: space-3 | Top, Left+Right |
| 27 | Section Card 5 (Status) | Card/Form | (32, 1264) | (640, 120) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 28 | Tier Badge | Tag/Featured | (48, 1280) | (160, 24) | bg: primary-500, text: surface, radius: radius-sm | Top, Left |
| 29 | Tier Label | Text/Body | (48, 1312) | (608, 24) | font: text-base, color: neutral-900 | Top, Left+Right |
| 30 | Progress Bar | Progress/Bar | (48, 1344) | (608, 8) | fill: primary-500, track: neutral-200, radius: radius-sm | Top, Left+Right |
| 31 | Progress Text | Text/Body | (536, 1360) | (120, 20) | font: text-sm, color: neutral-500 | Top, Right |
| 32 | Preview Panel | Panel/Preview | (720, 144) | (688, 800) | bg: surface, border-left: neutral-200 | Top, Right |

### Notes for the Designer
- Desktop uses a 2-column layout: form left (max 640px), live preview right (fixed 688px).
- On mobile, preview opens in a modal/full-screen toggle.
- Section cards have 16px (space-4) internal padding.
- Progress bar is full width inside the status card.
- Education items and service mini-cards use surface-muted background.
