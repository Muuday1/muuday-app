# Admin Operations — Figma Frame Specs

> **Journey:** Admin dashboard, review queue, decision panel  
> **Source:** `docs/product/design-system/frames/admin-operations.md`

---

## Frame 1: Admin Dashboard (`/admin`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page, border-right: neutral-200 | Left |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page | Top |
| 3 | Stats Row | Card/Grid | (280, 96) | (1140, 120) | gap: 16px, 4 columns | Top, Left+Right |
| 4 | Stat Card 1 | Card/Stat | (280, 96) | (270, 120) | bg: surface-card, border: neutral-200 | Top, Left |
| 5 | Stat Card 2 | Card/Stat | (566, 96) | (270, 120) | bg: surface-card, border: neutral-200 | Top |
| 6 | Stat Card 3 | Card/Stat | (852, 96) | (270, 120) | bg: surface-card, border: neutral-200 | Top |
| 7 | Stat Card 4 | Card/Stat | (1138, 96) | (282, 120) | bg: surface-card, border: neutral-200 | Top, Right |
| 8 | Activity Title | Text/H3 | (280, 240) | (400, 28) | font: text-lg, font-semibold | Top, Left |
| 9 | Activity Feed | List/Activity | (280, 280) | (1140, 400) | gap: 8px | Top, Left+Right |

### Stat Cards

| Card | Metric | Color |
|------|--------|-------|
| 1 | Usuários | `text-primary` |
| 2 | Profissionais | `text-secondary` |
| 3 | Receita | `text-success` |
| 4 | Disputas | `text-warning` |

---

## Frame 2: Review Queue (`/admin/revisao`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page | Left |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page | Top |
| 3 | Tabs | Nav/Tabs | (280, 80) | (600, 48) | border-bottom: neutral-200 | Top, Left |
| 4 | Table | Table/Data | (280, 152) | (1140, 600) | bg: surface-card, border: neutral-200 | Top, Left+Right |
| 5 | Table Header | Row/Header | (280, 152) | (1140, 48) | bg: surface-page-alt, border-bottom: neutral-200 | Top |
| 6 | Table Rows | Row/Data | (280, 200) | (1140, 552) | gap: 1px | Top |
| 7 | Pagination | Pagination | (280, 768) | (1140, 48) | centered | Bottom |

### Table Columns

| Column | Width | Notes |
|--------|-------|-------|
| Nome | 25% | Avatar + name |
| Especialidade | 20% | Text |
| Data | 15% | Text |
| Documentos | 15% | Link icons |
| Status | 15% | Badge |
| Ações | 10% | Button group |

---

## Frame 3: Decision Panel (`/admin/fila/[id]`)

- **Dimensions:** Desktop 1440×900 / Mobile 375×812
- **Background:** `surface-page`

### Layers

| # | Layer Name | Component | Position | Size | Tokens | Constraints |
|---|------------|-----------|----------|------|--------|-------------|
| 1 | Sidebar | Shell/Sidebar | (0, 0) | (240, 900) | bg: surface-page | Left |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page | Top |
| 3 | Details Card | Card/Details | (280, 96) | (560, 400) | bg: surface-card, border: neutral-200 | Top, Left |
| 4 | Doc Viewer | Card/Preview | (864, 96) | (556, 400) | bg: surface-page-alt, border: neutral-200 | Top, Right |
| 5 | Decision Card | Card/Form | (280, 520) | (1140, 200) | bg: surface-card, border: neutral-200 | Bottom, Left+Right |
| 6 | Notes Textarea | Textarea | (304, 560) | (700, 100) | bg: surface-page, border: neutral-200 | Top, Left |
| 7 | Approve Button | Button/Primary | (1024, 560) | (180, 48) | bg: primary-500 | Top, Right |
| 8 | Reject Button | Button/Danger | (1024, 624) | (180, 48) | bg: error | Top, Right |

---

*Figma specs complete for Admin Operations.*
