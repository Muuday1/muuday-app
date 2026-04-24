# Professional Workspace Journey — Figma Frame Specs

> **Journey:** Professional dashboard and management flows  
> **Source:** `docs/product/design-system/frames/professional-workspace.md`

---

## Frame 1.1: Dashboard (`/dashboard`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, sidebar 240px fixed (desktop), main content fills remainder

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | bg: surface, border-right: neutral-200 | Top, Bottom, Left |
| 2 | Logo | Brand/Logo | (24, 16) | (32, 32) | color: primary-500 | Top, Left |
| 3 | Nav Item (Dashboard) | Nav/Item Active | (0, 64) | (240, 48) | text: neutral-900, bg: surface-muted, left-border: 3px primary-500 | Top, Left+Right |
| 4 | Nav Item (Serviços) | Nav/Item | (0, 112) | (240, 48) | text: neutral-500, height: 48px | Top, Left+Right |
| 5 | Nav Item (Agenda) | Nav/Item | (0, 160) | (240, 48) | text: neutral-500, height: 48px | Top, Left+Right |
| 6 | Nav Item (Financeiro) | Nav/Item | (0, 208) | (240, 48) | text: neutral-500, height: 48px | Top, Left+Right |
| 7 | Nav Item (Configurações) | Nav/Item | (0, 256) | (240, 48) | text: neutral-500, height: 48px | Top, Left+Right |
| 8 | Topbar | Shell/Topbar | (240, 0) | (1200, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 9 | Greeting | Text/H1 | (272, 80) | (600, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left |
| 10 | Sub-greeting | Text/Body | (272, 120) | (600, 24) | font: text-base, color: neutral-500 | Top, Left |
| 11 | KPI Card 1 | Card/Metric | (272, 168) | (200, 120) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 12 | KPI Value 1 | Text/H2 | (288, 184) | (168, 32) | font: text-xl, font-display, color: primary-500 | Top, Left |
| 13 | KPI Label 1 | Text/Body | (288, 224) | (168, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 14 | KPI Card 2 | Card/Metric | (496, 168) | (200, 120) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 15 | KPI Card 3 | Card/Metric | (720, 168) | (200, 120) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 16 | Priority Banner | Banner/Action | (272, 312) | (1168, 80) | bg: surface-muted, left-border: 4px primary-500, radius: radius-md | Top, Left+Right |
| 17 | Banner Text | Text/Body | (288, 328) | (900, 24) | font: text-base, color: neutral-900 | Top, Left |
| 18 | Banner CTA | Button/Primary Small | (1200, 336) | (120, 32) | bg: primary-500, text: surface, radius: radius-md | Top, Right |
| 19 | Section Title | Text/H3 | (272, 416) | (200, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left |
| 20 | Appointment Row 1 | Row/List | (272, 456) | (1168, 48) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 21 | Time 1 | Text/Label | (288, 464) | (80, 20) | font: text-sm, color: primary-500 | Top, Left |
| 22 | Client 1 | Text/Body | (384, 464) | (400, 20) | font: text-base, color: neutral-900 | Top, Left |
| 23 | Appointment Row 2 | Row/List | (272, 504) | (1168, 48) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 24 | Quick Actions | Button/Secondary | (272, 576) | (1168, 48) | bg: surface, border: neutral-200, radius: radius-md | Top, Left+Right |

### Notes for the Designer
- Sidebar is fixed on desktop, collapses to bottom nav on mobile.
- KPI cards are flat (no shadow) with 1px border.
- Priority banner is dismissible via an X icon (top-right).
- On tablet, sidebar collapses to 72px icons-only with tooltips.

---

## Frame 1.2: Services Management (`/dashboard/servicos`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, sidebar 240px, main content max-width fills viewport

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | bg: surface, border-right: neutral-200 | Top, Bottom, Left |
| 2 | Topbar | Shell/Topbar | (240, 0) | (1200, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 3 | Page Title | Text/H1 | (272, 80) | (400, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left |
| 4 | New Button | Button/Primary | (1200, 80) | (120, 40) | bg: primary-500, radius: radius-md | Top, Right |
| 5 | Service Card 1 | Card/List | (272, 144) | (1168, 80) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 6 | Service Name 1 | Text/H3 | (288, 152) | (400, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left |
| 7 | Service Price 1 | Text/H3 | (1000, 152) | (120, 28) | font: text-lg, font-display, color: primary-500 | Top, Right |
| 8 | Service Meta 1 | Text/Body | (288, 184) | (400, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 9 | Menu Button 1 | Button/Icon | (1384, 160) | (32, 32) | icon: neutral-500, radius: radius-md | Top, Right |
| 10 | Service Card 2 | Card/List | (272, 240) | (1168, 80) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 11 | Modal Overlay | Overlay/Backdrop | (0, 0) | (1440, 900) | bg: rgba(0,0,0,0.4) | Center |
| 12 | Modal | Sheet/Modal | (440, 200) | (560, 500) | bg: surface, radius: radius-xl, padding: space-6 | Center |
| 13 | Modal Title | Text/H2 | (456, 216) | (528, 28) | font: text-xl, font-display | Top, Left+Right |
| 14 | Form Grid | Layout/Grid | (456, 264) | (528, 200) | 2 columns, gap: space-4 | Top, Left+Right |
| 15 | Modal Footer | Box | (456, 672) | (528, 48) | border-top: neutral-200, padding: space-4 | Bottom, Left+Right |
| 16 | Save Button | Button/Primary | (1344, 680) | (120, 32) | bg: primary-500 | Bottom, Right |

### Notes for the Designer
- Service cards hover with border transitioning to primary-500.
- Modal is centered on desktop, full-screen bottom sheet on mobile.
- Form grid has two columns for price + duration side by side.
- Save button is right-aligned in modal footer.

---

## Frame 1.3: Agenda (`/agenda`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, sidebar 240px, calendar grid fills main area

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | bg: surface, border-right: neutral-200 | Top, Bottom, Left |
| 2 | Topbar | Shell/Topbar | (240, 0) | (1200, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 3 | Page Title | Text/H1 | (272, 80) | (200, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left |
| 4 | Today Button | Button/Secondary Small | (1200, 80) | (80, 32) | bg: surface, border: neutral-200 | Top, Right |
| 5 | Calendar Nav | Button/Icon | (1100, 80) | (80, 32) | icon: neutral-500, radius: radius-md | Top, Right |
| 6 | Month Label | Text/H2 | (900, 80) | (200, 28) | font: text-xl, font-display, color: neutral-900 | Top, Right |
| 7 | View Toggle | SegmentedControl | (272, 128) | (320, 40) | bg: surface-muted, radius: radius-md | Top, Left |
| 8 | Week View Grid | Calendar/Week | (272, 184) | (860, 600) | 7 columns, gap: space-2 | Top, Left |
| 9 | Day Header 1 | Text/Label | (272, 184) | (120, 32) | font: text-sm, color: neutral-500, uppercase | Top, Left |
| 10 | Day Header 2 | Text/Label | (400, 184) | (120, 32) | font: text-sm, color: neutral-500, uppercase | Top, Left |
| 11 | Day Header 3 | Text/Label | (528, 184) | (120, 32) | font: text-sm, color: neutral-500, uppercase | Top, Left |
| 12 | Selected Day Column | Column/Active | (528, 216) | (120, 568) | bg: surface-muted, radius: radius-lg top | Top, Left |
| 13 | Time Slot | Row/Slot | (272, 216) | (120, 40) | height: space-3, border-bottom: neutral-200 | Top, Left |
| 14 | Booking Block | Block/Event | (544, 224) | (104, 32) | bg: primary-500 15% opacity, text: primary-500, radius: radius-sm | Top, Left |
| 15 | Free Slot | Row/Empty | (272, 256) | (120, 40) | bg: surface, dashed border: neutral-200 | Top, Left |
| 16 | Detail Panel | Panel/Slide | (1140, 184) | (340, 600) | bg: surface, border-left: neutral-200, shadow: shadow-md | Top, Right |
| 17 | Detail Title | Text/H3 | (1156, 200) | (308, 24) | font: text-lg, font-display | Top, Left+Right |
| 18 | Detail Meta | Text/Body | (1156, 232) | (308, 20) | font: text-sm, color: neutral-500 | Top, Left+Right |
| 19 | Action Button | Button/Primary | (1156, 280) | (120, 32) | bg: primary-500 | Top, Left |
| 20 | Cancel Button | Button/Text Danger | (1290, 280) | (80, 20) | font: text-sm, color: error-500 | Top, Left |

### Notes for the Designer
- Week view is default on desktop; day view on mobile.
- Booking blocks fill the full column width.
- Detail panel slides in from the right on desktop, bottom sheet on mobile.
- Day columns have a minimum width of 120px.

---

## Frame 1.4: Financial Overview (`/financeiro`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`
- **Layout Grid:** 8px baseline, sidebar 240px

### Layers (top to bottom)

| # | Layer Name | Component / Shape | Position (x, y) | Size (w, h) | Applied Tokens | Constraints |
|---|------------|-------------------|-----------------|-------------|----------------|-------------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | bg: surface, border-right: neutral-200 | Top, Bottom, Left |
| 2 | Topbar | Shell/Topbar | (240, 0) | (1200, 64) | bg: surface, border-bottom: neutral-200 | Top, Left+Right |
| 3 | Page Title | Text/H1 | (272, 80) | (200, 36) | font: text-2xl, font-display, color: neutral-900 | Top, Left |
| 4 | Export Button | Button/Secondary | (1200, 80) | (120, 32) | bg: surface, border: neutral-200, radius: radius-md | Top, Right |
| 5 | KPI Card 1 | Card/Metric | (272, 144) | (200, 120) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 6 | KPI Value 1 | Text/H2 | (288, 160) | (168, 32) | font: text-xl, font-display, color: primary-500 | Top, Left |
| 7 | KPI Label 1 | Text/Body | (288, 200) | (168, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 8 | KPI Card 2 | Card/Metric | (496, 144) | (200, 120) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 9 | KPI Card 3 | Card/Metric | (720, 144) | (200, 120) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left |
| 10 | Chart Container | Box | (272, 288) | (1168, 320) | bg: surface, border: neutral-200, radius: radius-lg | Top, Left+Right |
| 11 | Chart Title | Text/H3 | (288, 304) | (200, 24) | font: text-lg, font-display, color: neutral-900 | Top, Left |
| 12 | Bar | Chart/Bar | (320, 480) | (32, 80) | fill: primary-500, radius: 4px | Top, Left |
| 13 | Grid Line | Line | (272, 400) | (1168, 1) | dashed: neutral-200 | Top, Left+Right |
| 14 | Section Title | Text/H3 | (272, 624) | (200, 28) | font: text-lg, font-display, color: neutral-900 | Top, Left |
| 15 | Transaction Row 1 | Row/List | (272, 664) | (1168, 48) | padding: space-4, border-bottom: neutral-200 | Top, Left+Right |
| 16 | Date 1 | Text/Body | (288, 672) | (80, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 17 | Client 1 | Text/Body | (384, 672) | (400, 20) | font: text-base, color: neutral-900 | Top, Left |
| 18 | Amount 1 | Text/Body | (1000, 672) | (120, 20) | font: text-base, color: neutral-900 | Top, Right |
| 19 | Status Icon 1 | Icon | (1200, 672) | (20, 20) | color: primary-500 | Top, Right |

### Notes for the Designer
- KPI cards are flat with 1px border.
- Chart bars use 4px radius on top corners.
- Transaction rows have hover state bg: surface-muted.
- On mobile, KPI cards scroll horizontally.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
