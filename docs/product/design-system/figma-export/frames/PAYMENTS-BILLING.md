# Payments & Billing — Figma Frame Specs

> **Journey:** Transaction history, payouts, invoices  
> **Source:** `docs/product/design-system/frames/payments-billing.md`

---

## Frame 1: Transaction List (`/financeiro/transacoes`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page | Left |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page | Top |
| 3 | Filters | Chip/Row | (280, 80) | (600, 40) | gap: 8px | Top, Left |
| 4 | Search Input | Input/Search | (900, 80) | (300, 40) | bg: surface-card, border: neutral-200 | Top, Right |
| 5 | Export Button | Button/Secondary | (1220, 80) | (140, 40) | bg: neutral-100 | Top, Right |
| 6 | Table | Table/Data | (280, 140) | (1140, 620) | bg: surface-card, border: neutral-200 | Top, Left+Right |
| 7 | Pagination | Pagination | (280, 780) | (1140, 48) | centered | Bottom |

### Table Columns

| Column | Width | Notes |
|--------|-------|-------|
| Data | 15% | Text |
| Descrição | 30% | Text |
| Tipo | 15% | Badge |
| Valor | 15% | Color-coded |
| Status | 15% | Badge |
| Ações | 10% | Button |

---

## Frame 2: Payout Dashboard (`/financeiro/saques`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page | Left |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page | Top |
| 3 | Balance Card | Card/Highlight | (280, 96) | (560, 160) | bg: surface-card, border-left: 4px primary-500 | Top, Left |
| 4 | Balance Label | Text/Label | (304, 120) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 5 | Balance Value | Text/H1 | (304, 148) | (400, 48) | font: text-3xl, font-bold | Top, Left |
| 6 | Payout Button | Button/Primary | (304, 212) | (200, 48) | bg: primary-500 | Top, Left |
| 7 | History Card | Card/Section | (280, 288) | (1140, 500) | bg: surface-card, border: neutral-200 | Top, Left+Right |
| 8 | History Title | Text/H3 | (304, 312) | (200, 28) | font: text-lg, font-semibold | Top, Left |
| 9 | Bank Card | Card/Info | (864, 96) | (556, 160) | bg: surface-card, border: neutral-200 | Top, Right |

---

## Frame 3: Invoice Detail (`/financeiro/fatura`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page | Left |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page | Top |
| 3 | Invoice Card | Card/Document | (280, 96) | (720, 700) | bg: surface-card, border: neutral-200 | Top, Left |
| 4 | Invoice Header | Section/Header | (304, 120) | (672, 80) | border-bottom: neutral-200 | Top, Left+Right |
| 5 | Invoice Title | Text/H2 | (304, 128) | (400, 32) | font: text-xl | Top, Left |
| 6 | Invoice Date | Text/Body | (304, 168) | (200, 20) | font: text-sm, color: neutral-500 | Top, Left |
| 7 | Items Table | Table/Invoice | (304, 224) | (672, 300) | gap: 1px | Top, Left+Right |
| 8 | Total Row | Row/Total | (304, 540) | (672, 48) | bg: surface-page-alt, font: text-lg, font-bold | Top, Left+Right |
| 9 | Download Button | Button/Secondary | (304, 620) | (200, 48) | bg: neutral-100 | Top, Left |

---

*Figma specs complete for Payments & Billing.*
