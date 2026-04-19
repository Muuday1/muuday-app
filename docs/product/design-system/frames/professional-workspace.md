# Professional Workspace Frames

> **Journey:** Professional dashboard and management flows  
> **User:** Verified professional (both Essencial and Pro tiers)  
> **Source:** `docs/product/design-system/frames/professional-workspace.md`  
> **Version:** 1.0  
> **Date:** 2026-04-19

---

## Shared Navigation — Sidebar & Header

All Professional Workspace frames share a persistent **Sidebar** (desktop) and **Header** (all breakpoints).

### Sidebar (Desktop only)

| Property | Token / Value |
|----------|---------------|
| Width | 240px |
| Height | 100vh |
| Background | `surface-page` (#f4f8f5) |
| Border-right | 1px solid `neutral-200` |
| Shadow | `shadow-none` |
| Padding | `py-4 px-3` (16px vertical, 12px horizontal) |
| Position | Fixed, left edge |
| Z-index | `z-sticky` (100) |

**Nav Items:**

| State | Background | Text | Border-left |
|-------|-----------|------|-------------|
| Default | transparent | `neutral-500` | none |
| Hover | `neutral-100` | `neutral-700` | none |
| Active | `primary-50` | `primary-700` | 3px solid `primary-500` |
| Item height | 40px | | |
| Item radius | `radius-md` (8px) | | |
| Icon size | 20px | | |
| Gap (icon → label) | 12px | | |

**Nav items (in order):**
1. Dashboard (LayoutDashboard icon) → `/dashboard`
2. Serviços (Briefcase icon) → `/dashboard/servicos`
3. Agenda (Calendar icon) → `/agenda`
4. Financeiro (Wallet icon) → `/financeiro`
5. Configurações (Settings icon) → `/configuracoes`

**Mobile behavior:** Sidebar collapses to a **bottom navigation bar** (64px height) with icon-only tabs and labels below (text-xs). Active state uses `primary-500` icon + label color.

**Tablet behavior:** Sidebar collapses to 72px icons-only with tooltips on hover.

### Header

| Property | Token / Value |
|----------|---------------|
| Height | 64px |
| Background | `surface-page` (#f4f8f5) |
| Border-bottom | 1px solid `neutral-200` |
| Shadow | `shadow-none` |
| Z-index | `z-sticky` (100) |
| Padding | `px-8` (desktop), `px-4` (mobile) |

**Header content (left to right):**
1. **Breadcrumb** (optional, on sub-pages) — `text-sm`, `neutral-500`
2. **Page title** — `text-lg`, `font-display`, `neutral-900`
3. **Spacer**
4. **Notification bell** (Bell icon, 20px, `neutral-500`) with optional dot indicator (8px, `error`)
5. **Avatar** (md=40px, `rounded-full`) — tap opens dropdown menu

**Header dropdown menu:**
- Background: `surface-elevated` (#ffffff)
- Border: `none`
- Shadow: `shadow-md`
- Radius: `radius-md` (8px)
- Width: 200px
- Items: Perfil, Configurações, Sair
- Divider: 1px solid `neutral-200`

---

## PW-01: Dashboard (`/dashboard`)

### Overview
The professional's home screen. Summarizes business health with KPIs, upcoming bookings, and quick actions. Designed for glanceability and rapid task completion.

### Dimensions

| Breakpoint | Width | Height | Notes |
|------------|-------|--------|-------|
| Desktop | 1440px | 900px (min) | Sidebar 240px + main content |
| Tablet | 768px | 1024px | Sidebar collapsed to 72px |
| Mobile | 375px | 812px | Bottom nav, stacked layout |

### Layout Structure

**Desktop grid:**
- Sidebar: 240px fixed left
- Main content: fills remaining width, max 1200px
- Content padding: 32px (space-8) from left edge of main area
- Content starts 80px below top (after header + 16px gap)

**Mobile grid:**
- Full width minus 16px margins
- Single column, 16px gutters
- Bottom nav: 64px fixed

### Layers (desktop, z-index top to bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens |
|---|------------|-----------|-----------------|-------------|--------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | bg: surface-page, border-right: neutral-200 |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | bg: surface-page, border-bottom: neutral-200 |
| 3 | Greeting | Text/H1 | (272, 80) | (600, 36) | font: text-2xl, font-display, color: neutral-900 |
| 4 | Sub-greeting | Text/Body | (272, 120) | (600, 24) | font: text-base, color: neutral-500 |
| 5 | KPI Card — Revenue | Card/Metric | (272, 168) | (368, 120) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 6 | KPI Value — Revenue | Text/H2 | (288, 184) | (336, 32) | font: text-xl, font-display, color: primary-500 |
| 7 | KPI Label — Revenue | Text/Body | (288, 224) | (336, 20) | font: text-sm, color: neutral-500 |
| 8 | KPI Card — Bookings | Card/Metric | (656, 168) | (368, 120) | same as above |
| 9 | KPI Card — Rating | Card/Metric | (1040, 168) | (368, 120) | same as above |
| 10 | Priority Banner | Banner/Action | (272, 312) | (1136, 80) | bg: primary-50, border-left: 4px primary-500, radius: radius-md |
| 11 | Banner Icon | Icon | (296, 336) | (24, 24) | color: primary-600 |
| 12 | Banner Text | Text/Body | (336, 328) | (900, 24) | font: text-base, color: neutral-900 |
| 13 | Banner CTA | Button/Primary Small | (1200, 336) | (140, 32) | bg: primary-500, text: white, radius: radius-md |
| 14 | Section Title "Próximos atendimentos" | Text/H3 | (272, 424) | (400, 28) | font: text-lg, font-display, color: neutral-900 |
| 15 | View All Link | Text/Link | (1200, 424) | (140, 24) | font: text-sm, color: primary-600 |
| 16 | Bookings Table Card | Card/Table | (272, 468) | (1136, 320) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 17 | Table Header Row | Row/Header | (288, 484) | (1104, 40) | border-bottom: neutral-200 |
| 18 | Table Header Cells | Text/Label | varies | varies | font: text-xs, color: neutral-500, uppercase |
| 19 | Booking Row 1 | Row/List | (288, 532) | (1104, 64) | bg: surface-card, border-bottom: neutral-200 |
| 20 | Client Avatar | Avatar/Small | (304, 548) | (32, 32) | radius: radius-full |
| 21 | Client Name | Text/Body | (352, 548) | (240, 20) | font: text-base, color: neutral-900 |
| 22 | Service Name | Text/Body | (608, 548) | (200, 20) | font: text-sm, color: neutral-500 |
| 23 | Time | Text/Body | (832, 548) | (120, 20) | font: text-sm, color: neutral-900 |
| 24 | Status Badge | Badge | (976, 548) | (80, 24) | variant per status |
| 25 | Action Menu | Button/Icon | (1360, 556) | (32, 32) | icon: MoreVertical, color: neutral-500 |
| 26 | Quick Actions Bar | Box/Actions | (272, 812) | (1136, 64) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 27 | Quick Action Buttons | Button/Secondary | (288, 820) | varies | border: neutral-200, radius: radius-md |

### Components Used

| Component | Variants | Count |
|-----------|----------|-------|
| Sidebar | professional nav | 1 |
| Header | with avatar dropdown | 1 |
| Card | metric (3x), table (1x), actions (1x) | 5 |
| Button | primary small, secondary, icon | 4+ |
| Badge | success, warning, info | 1 per row |
| Avatar | sm (32px) | 1 per row |
| Icon | Lucide — LayoutDashboard, Briefcase, Calendar, Wallet, Settings, Bell, MoreVertical, Star, TrendingUp, CalendarCheck | — |

### Token Values

**KPI Cards:**
- Background: `surface-card` (#ffffff)
- Border: 1px solid `neutral-200`
- Radius: `radius-lg` (12px)
- Shadow: `shadow-none`
- Padding: `p-6` (24px)
- Gap between cards: 16px (space-4)

**Priority Banner:**
- Background: `primary-50` (#f0fdf4)
- Left border: 4px solid `primary-500`
- Radius: `radius-md` (8px)
- Padding: `px-6 py-5` (24px horizontal, 20px vertical)
- Dismiss button: X icon, top-right, 16px, `neutral-400`

**Bookings Table:**
- Card padding: 0 (table bleeds to edges)
- Row height: 64px
- Row padding: `px-4` (16px)
- Row hover: `bg-neutral-50` transition 150ms
- Header text: `text-xs`, `neutral-500`, uppercase, letter-spacing 0.05em
- Cell gap: 16px

**Status Badges:**
| Status | Badge Variant | Text |
|--------|---------------|------|
| Confirmado | success | `primary-700` bg |
| Pendente | warning | `warning` bg |
| Concluído | default | `neutral-700` bg |
| Cancelado | error | `error` bg |

**Quick Actions Bar:**
- Button height: 40px
- Button padding: `px-4`
- Gap between buttons: 12px (space-3)
- Icon + label layout, gap 8px

### States

**Empty State (no bookings):**
- Table card replaced with EmptyState pattern
- Icon: CalendarX, 64px, `neutral-300`
- Title: "Nenhum agendamento" — `text-xl`, `font-semibold`
- Description: "Seus próximos atendimentos aparecerão aqui." — `text-base`, `neutral-500`
- CTA: "Configurar disponibilidade" — secondary button

**Loading State:**
- KPI values show Skeleton (text width 120px, height 32px)
- Table rows show 3 skeleton rows
- Skeleton: `bg-neutral-100`, `radius-md`, pulse animation

**Error State:**
- Banner turns to error variant: `error-bg` bg, `error` left border
- Icon: AlertTriangle
- Text: error message
- CTA: "Tentar novamente"

**Hover States:**
- Table rows: `bg-neutral-50`, transition 150ms
- KPI cards: border transitions to `neutral-300`, 150ms
- Action menu button: `bg-neutral-100`, radius-md

### Accessibility Notes

- **Landmarks:** `<main>` for content, `<nav>` for sidebar, `<header>` for topbar
- **Table:** Use semantic `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`
- **Status badges:** Include `aria-label` with full status text (e.g., "Status: Confirmado")
- **Action menu:** Dropdown triggers with `aria-haspopup="true"`, `aria-expanded`
- **KPI cards:** Wrap values in `<strong>` or `aria-label="Receita total: R$ 1.250,00"`
- **Banner:** `role="alert"` if dismissible, include close button with `aria-label="Fechar aviso"`
- **Focus order:** Sidebar nav → Header avatar → Greeting → KPI cards → Banner → Table → Quick actions
- **Color contrast:** KPI value uses `primary-500` (3.2:1) — acceptable for large text (text-xl). For smaller sizes, use `primary-600`.

---

## PW-02: Services Management (`/dashboard/servicos`)

### Overview
Professional manages their service offerings. Displays service cards with inline actions. Add/edit flows happen in a modal. Essencial tier users see upsell messaging when approaching service limits.

### Dimensions

| Breakpoint | Width | Height | Notes |
|------------|-------|--------|-------|
| Desktop | 1440px | 900px (min) | Sidebar 240px |
| Tablet | 768px | 1024px | Sidebar 72px |
| Mobile | 375px | 812px | Bottom nav, stacked cards |

### Layout Structure

**Desktop:**
- Sidebar: 240px fixed
- Header: full width, 64px
- Content area padding: 32px from main left edge
- Page header row: title left, "Novo Serviço" button right
- Service cards: single column, full width of content area
- Card gap: 16px (space-4)

**Mobile:**
- FAB (Floating Action Button) for "Novo Serviço" instead of header button
- Cards stack full-width with 16px margins
- FAB: 56px circle, `primary-500` bg, white Plus icon, bottom-right with 24px margin

### Layers (desktop)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens |
|---|------------|-----------|-----------------|-------------|--------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | active item: Serviços |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | standard header |
| 3 | Page Title | Text/H1 | (272, 80) | (400, 36) | font: text-2xl, font-display, color: neutral-900 |
| 4 | Service Count | Text/Body | (272, 120) | (400, 20) | font: text-sm, color: neutral-500 |
| 5 | "Novo Serviço" Button | Button/Primary | (1200, 80) | (160, 40) | bg: primary-500, text: white, radius: radius-md |
| 6 | Service Card 1 | Card/List | (272, 168) | (1136, 96) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 7 | Service Icon Box | Box/Icon | (288, 184) | (48, 48) | bg: primary-50, radius: radius-md |
| 8 | Service Icon | Icon | (300, 196) | (24, 24) | color: primary-500 |
| 9 | Service Name | Text/H3 | (352, 184) | (400, 28) | font: text-lg, font-display, color: neutral-900 |
| 10 | Service Duration | Text/Body | (352, 216) | (200, 20) | font: text-sm, color: neutral-500 |
| 11 | Service Price | Text/H3 | (1000, 192) | (120, 28) | font: text-xl, font-display, color: primary-500 |
| 12 | Edit Button | Button/Ghost | (1200, 192) | (80, 32) | text: neutral-700, radius: radius-md |
| 13 | Delete Button | Button/Ghost | (1288, 192) | (80, 32) | text: error, radius: radius-md |
| 14 | Menu Button | Button/Icon | (1360, 200) | (32, 32) | icon: MoreVertical, color: neutral-500 |
| 15 | Service Card 2 | Card/List | (272, 280) | (1136, 96) | same structure |
| 16 | Upsell Banner | Banner/Upsell | (272, 688) | (1136, 72) | bg: surface-card, border: primary-200, radius: radius-lg |
| 17 | Upsell Icon | Icon | (296, 712) | (24, 24) | color: primary-500 |
| 18 | Upsell Text | Text/Body | (336, 704) | (800, 20) | font: text-base, color: neutral-900 |
| 19 | Upsell CTA | Button/Secondary | (1200, 712) | (120, 32) | border: primary-500, text: primary-600, radius: radius-md |

### Add/Edit Service Modal

| Property | Token / Value |
|----------|---------------|
| Width | 560px (max) |
| Background | `surface-elevated` (#ffffff) |
| Radius | `radius-lg` (12px) |
| Shadow | `shadow-lg` |
| Padding | `p-6` (24px) |
| Backdrop | `surface-overlay` — rgba(28,25,23,0.5) |
| Backdrop blur | 4px |

**Modal Header:**
- Title: "Novo serviço" or "Editar serviço" — `text-xl`, `font-display`, `neutral-900`
- Close button: X icon, top-right, 32px touch target
- Border-bottom: 1px solid `neutral-200`

**Modal Form Fields:**

| Field | Type | Width | Notes |
|-------|------|-------|-------|
| Nome do serviço | Input/Text | 100% | required |
| Descrição | Textarea | 100% | 3 rows, max 500 chars |
| Duração | Select | 50% | options: 30min, 45min, 60min, 90min, 120min |
| Preço | Input/Number | 50% | prefix "R$", step 0.01 |
| Categoria | Select | 100% | predefined categories |

- Form gap between fields: 20px (space-5)
- Label: `text-sm`, `font-medium`, `neutral-900`, bottom margin 4px
- Input height: 44px
- Input border: 1px solid `neutral-200`, radius `radius-md`
- Input focus: border `primary-500`, ring 2px `primary-500` offset 2px

**Modal Footer:**
- Border-top: 1px solid `neutral-200`
- Padding-top: 16px
- Actions aligned right
- "Cancelar" — Button/Ghost
- "Salvar serviço" — Button/Primary
- Gap: 12px

### Components Used

| Component | Variants | Count |
|-----------|----------|-------|
| Sidebar | professional nav | 1 |
| Header | standard | 1 |
| Card | list item | N (variable) |
| Button | primary, ghost, icon | 5+ |
| Input | text, number, textarea | 3 |
| Select | dropdown | 2 |
| Modal | centered | 1 |
| Badge | pro (if applicable) | 1 |
| Icon | Lucide — Briefcase, Clock, DollarSign, Pencil, Trash2, MoreVertical, Plus, X, Sparkles | — |

### Token Values

**Service Card:**
- Background: `surface-card` (#ffffff)
- Border: 1px solid `neutral-200`
- Radius: `radius-lg` (12px)
- Shadow: `shadow-none`
- Padding: `px-5 py-4` (20px horizontal, 16px vertical)
- Hover border: `neutral-300` → 150ms transition
- Active/pressed: border `primary-500`

**Icon Box:**
- Size: 48px × 48px
- Background: `primary-50` (#f0fdf4)
- Radius: `radius-md` (8px)
- Icon: 24px, `primary-500`

**Upsell Banner:**
- Background: `surface-card` (#ffffff)
- Border: 1px solid `primary-200` (#bbf7d0)
- Radius: `radius-lg` (12px)
- Padding: `px-5 py-4`

### States

**Empty State:**
- Icon: Briefcase, 64px, `neutral-300`
- Title: "Nenhum serviço cadastrado"
- Description: "Adicione seus serviços para começar a receber agendamentos."
- CTA: "Adicionar primeiro serviço" — primary button, centered

**Loading State:**
- 3 skeleton cards (96px height each)
- Skeleton: `bg-neutral-100`, `radius-lg`, pulse

**Modal — Form Validation:**
- Error border: `error` (#ef4444)
- Error text below field: `text-sm`, `error`
- Error icon: AlertCircle, 16px, inline

**Modal — Submitting:**
- Save button shows spinner, disabled
- Form fields disabled
- Backdrop blocks interaction

**Service Limit Reached (Essencial tier):**
- "Novo Serviço" button disabled with tooltip: "Limite de 3 serviços atingido. Faça upgrade para Pro."
- Upsell banner prominent at bottom

**Delete Confirmation:**
- ConfirmationDialog pattern
- Title: "Excluir serviço?"
- Description: "Esta ação não pode ser desfeita."
- Actions: "Cancelar" (ghost) + "Excluir" (danger)

### Accessibility Notes

- **Modal:** `role="dialog"`, `aria-modal="true"`, focus trap inside
- **Close button:** `aria-label="Fechar modal"`
- **Form labels:** Explicit `<label for="id">` association
- **Required fields:** Marked with `*` and `aria-required="true"`
- **Error messages:** `aria-describedby` linking input to error text
- **Service cards:** `role="listitem"` inside `role="list"`
- **Action buttons:** Edit/Delete have visible text labels (not icon-only)
- **Menu button:** `aria-label="Ações para [service name]"`
- **Price input:** `aria-describedby="price-hint"` with format hint

---

## PW-03: Agenda (`/agenda`)

### Overview
Professional views and manages their calendar. Week view is default on desktop; day view on mobile. Booking detail panel slides in from the right. Status badges provide at-a-glance booking state.

### Dimensions

| Breakpoint | Width | Height | Notes |
|------------|-------|--------|-------|
| Desktop | 1440px | 900px | Sidebar 240px + calendar + detail panel |
| Tablet | 768px | 1024px | Calendar only, detail as modal |
| Mobile | 375px | 812px | Day view, detail as bottom sheet |

### Layout Structure

**Desktop:**
- Sidebar: 240px fixed
- Header: full width
- Content padding: 32px
- Page header: title left, date navigation center-right, "Hoje" button far right
- View toggle: segmented control below header (Semana / Dia / Lista)
- Calendar grid: occupies ~70% of main width
- Detail panel: 360px fixed right, slides in when booking selected

**Mobile:**
- Day view only (no toggle)
- Time slots stack vertically
- Detail opens as bottom sheet (70% height)

### Layers (desktop)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens |
|---|------------|-----------|-----------------|-------------|--------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | active item: Agenda |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | standard |
| 3 | Page Title | Text/H1 | (272, 80) | (200, 36) | font: text-2xl, font-display, color: neutral-900 |
| 4 | View Toggle | SegmentedControl | (272, 128) | (280, 40) | bg: neutral-100, radius: radius-md |
| 5 | Active Segment "Semana" | Button/Selected | (272, 128) | (93, 40) | bg: surface-card, text: neutral-900, shadow: shadow-sm |
| 6 | Inactive Segment "Dia" | Button/Unselected | (365, 128) | (93, 40) | bg: transparent, text: neutral-500 |
| 7 | Inactive Segment "Lista" | Button/Unselected | (458, 128) | (94, 40) | bg: transparent, text: neutral-500 |
| 8 | Calendar Nav Left | Button/Icon | (900, 80) | (40, 40) | icon: ChevronLeft, color: neutral-500 |
| 9 | Month/Year Label | Text/H2 | (948, 84) | (200, 28) | font: text-xl, font-display, color: neutral-900 |
| 10 | Calendar Nav Right | Button/Icon | (1156, 80) | (40, 40) | icon: ChevronRight, color: neutral-500 |
| 11 | "Hoje" Button | Button/Secondary Small | (1200, 80) | (80, 32) | bg: surface-card, border: neutral-200, radius: radius-md |
| 12 | Week Grid | Calendar/Week | (272, 184) | (820, 640) | 7 columns |
| 13 | Day Header Row | Row/Headers | (272, 184) | (820, 40) | border-bottom: neutral-200 |
| 14 | Day Header Cell | Text/Label | varies | (117, 40) | font: text-sm, color: neutral-500, uppercase |
| 15 | Selected Day Header | Text/Label | (506, 184) | (117, 40) | font: text-sm, font-semibold, color: primary-600 |
| 16 | Day Column | Column/Day | varies | (117, 600) | bg: surface-card |
| 17 | Selected Day Column | Column/Active | (506, 224) | (117, 600) | bg: primary-50 |
| 18 | Time Slot Row | Row/Slot | (272, 224) | (820, 48) | border-bottom: neutral-200, height: 48px |
| 19 | Booking Block | Block/Event | (514, 232) | (101, 80) | bg: primary-500/15%, border-left: 3px primary-500, radius: radius-sm |
| 20 | Booking Time | Text/Label | (522, 236) | (85, 16) | font: text-xs, color: primary-700 |
| 21 | Booking Client | Text/Label | (522, 256) | (85, 16) | font: text-xs, color: primary-900, truncate |
| 22 | Status Dot | Dot | (522, 280) | (8, 8) | radius: radius-full, color per status |
| 23 | Detail Panel | Panel/Slide | (1108, 184) | (332, 640) | bg: surface-card, border-left: neutral-200, shadow: shadow-md |
| 24 | Detail Header | Box | (1108, 184) | (332, 80) | border-bottom: neutral-200, padding: space-5 |
| 25 | Detail Client Name | Text/H3 | (1132, 200) | (284, 24) | font: text-lg, font-display, color: neutral-900 |
| 26 | Detail Service | Text/Body | (1132, 228) | (284, 20) | font: text-sm, color: neutral-500 |
| 27 | Detail Meta Row | Row | (1132, 268) | (284, 72) | gap: space-3 |
| 28 | Meta Item | Box | varies | varies | icon + text, gap: space-2 |
| 29 | Detail Actions | Row | (1132, 600) | (284, 40) | gap: space-3 |
| 30 | "Confirmar" Button | Button/Primary | (1132, 600) | (136, 40) | bg: primary-500, radius: radius-md |
| 31 | "Cancelar" Button | Button/Secondary | (1280, 600) | (136, 40) | border: neutral-200, radius: radius-md |
| 32 | Booking List (List view) | List/Booking | (272, 184) | (820, 640) | visible when "Lista" selected |

### Components Used

| Component | Variants | Count |
|-----------|----------|-------|
| Sidebar | professional nav | 1 |
| Header | standard | 1 |
| SegmentedControl | 3 options | 1 |
| Button | icon, secondary, primary | 5+ |
| Calendar | week / day / list | 1 |
| Badge | status variants | per booking |
| Panel | slide-in detail | 1 |
| Avatar | sm | per booking |
| Icon | Lucide — ChevronLeft, ChevronRight, Clock, User, Video, MapPin, CheckCircle, XCircle, AlertCircle, Calendar | — |

### Token Values

**Calendar Grid:**
- Day column width: 117px (desktop, 7-day week)
- Day column min-width: 80px
- Time slot height: 48px
- Hour labels: 60px wide, `text-xs`, `neutral-500`, right-aligned
- Grid lines: 1px solid `neutral-200`
- Current time indicator: 1px dashed `error`, with 8px dot

**Booking Block:**
- Background: `primary-500` at 15% opacity (`rgba(34,197,94,0.15)`)
- Left border: 3px solid `primary-500`
- Radius: `radius-sm` (6px)
- Padding: 4px 6px
- Min-height: 32px (covers one slot)

**Status Dot Colors:**
| Status | Dot Color |
|--------|-----------|
| Confirmado | `primary-500` |
| Pendente | `warning` (#e8950f) |
| Concluído | `neutral-500` |
| Cancelado | `error` |
| Em andamento | `info` (#3b82f6) |

**Detail Panel:**
- Width: 360px (desktop)
- Background: `surface-card` (#ffffff)
- Border-left: 1px solid `neutral-200`
- Shadow: `shadow-md` (floating element)
- Padding: `p-5` (20px)
- Animation: slide from right, 250ms ease-out

**Segmented Control:**
- Background: `neutral-100` (#f5f5f4)
- Radius: `radius-md` (8px)
- Active segment: `surface-card` bg, `shadow-sm`, `neutral-900` text
- Inactive segment: transparent, `neutral-500` text
- Padding per segment: `px-4 py-2`

### States

**Empty Day:**
- Time slots show dashed border placeholder
- Dashed: 1px dashed `neutral-200`
- Hover: solid border `primary-200`, cursor pointer
- Tooltip: "Clique para adicionar disponibilidade"

**Selected Booking:**
- Booking block: border becomes 3px solid `primary-500`, bg darker (`primary-500` at 25%)
- Detail panel slides in
- URL updates: `/agenda?booking=[id]`

**Pending Booking:**
- Booking block: `warning` left border instead of `primary-500`
- Detail panel shows "Confirmar" primary action

**Video Session Booking:**
- Booking block shows Video icon (16px)
- Detail panel shows "Entrar na sala" button (primary)

**Loading State:**
- Skeleton calendar grid
- Skeleton detail panel (3 lines)

**Mobile Bottom Sheet:**
- Height: 70% viewport
- Handle bar: 40px wide, 4px tall, `neutral-300`, centered top
- Drag to dismiss
- Backdrop: `surface-overlay`

### Accessibility Notes

- **Calendar:** Use `role="grid"`, day cells as `role="gridcell"`
- **Booking blocks:** `role="button"`, `tabindex="0"`, `aria-label="Agendamento: [cliente], [hora], [serviço]"`
- **Detail panel:** `aria-live="polite"` announces booking details on selection
- **Status dots:** Not color-only — combined with text label in booking block
- **Navigation buttons:** `aria-label="Semana anterior"`, `aria-label="Próxima semana"`
- **Current time indicator:** `aria-hidden="true"` (visual only)
- **Keyboard:** Arrow keys navigate calendar cells, Enter opens detail, Escape closes detail panel
- **Focus trap:** Detail panel traps focus when open
- **Reduced motion:** Disable slide animation, instant show/hide

---

## PW-04: Financial Overview (`/financeiro`)

### Overview
Professional reviews earnings, views transaction history, and initiates payouts. Revenue chart shows trends. Essencial/Pro tier differences affect payout timing visibility.

### Dimensions

| Breakpoint | Width | Height | Notes |
|------------|-------|--------|-------|
| Desktop | 1440px | 900px (min) | Sidebar 240px |
| Tablet | 768px | 1024px | Sidebar 72px |
| Mobile | 375px | 812px | Bottom nav, stacked |

### Layout Structure

**Desktop:**
- Sidebar: 240px fixed
- Content padding: 32px
- Top row: 3 KPI cards
- Middle: Revenue chart (full width)
- Bottom: Transaction list (full width)
- Right of chart: Balance card (360px) stacked above payout button

**Mobile:**
- KPI cards: horizontal scroll (snaps to card)
- Chart: full width, height 240px
- Transaction list: full width

### Layers (desktop)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens |
|---|------------|-----------|-----------------|-------------|--------|
| 1 | Sidebar | Nav/Sidebar | (0, 0) | (240, 900) | active item: Financeiro |
| 2 | Header | Shell/Header | (240, 0) | (1200, 64) | standard |
| 3 | Page Title | Text/H1 | (272, 80) | (400, 36) | font: text-2xl, font-display, color: neutral-900 |
| 4 | "Exportar" Button | Button/Secondary | (1200, 80) | (120, 32) | bg: surface-card, border: neutral-200, radius: radius-md |
| 5 | KPI Card — Saldo | Card/Metric | (272, 144) | (352, 120) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 6 | KPI Value — Saldo | Text/H2 | (288, 160) | (320, 32) | font: text-xl, font-display, color: primary-500 |
| 7 | KPI Label — Saldo | Text/Body | (288, 200) | (320, 20) | font: text-sm, color: neutral-500 |
| 8 | KPI Card — Receita (mês) | Card/Metric | (640, 144) | (352, 120) | same structure |
| 9 | KPI Card — Saques (mês) | Card/Metric | (1008, 144) | (352, 120) | same structure |
| 10 | Chart Card | Card/Large | (272, 288) | (736, 360) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 11 | Chart Title | Text/H3 | (288, 304) | (300, 24) | font: text-lg, font-display, color: neutral-900 |
| 12 | Chart Period Select | Select | (840, 304) | (140, 32) | bg: surface-card, border: neutral-200 |
| 13 | Chart Canvas | Chart/Bar | (288, 344) | (704, 280) | bars: primary-500, grid: neutral-200 dashed |
| 14 | Balance Card | Card/Compact | (1024, 288) | (352, 160) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 15 | Balance Label | Text/Label | (1040, 304) | (320, 20) | font: text-sm, color: neutral-500 |
| 16 | Balance Value | Text/H2 | (1040, 328) | (320, 32) | font: text-2xl, font-display, color: neutral-900 |
| 17 | Balance Subtext | Text/Body | (1040, 368) | (320, 20) | font: text-sm, color: neutral-500 |
| 18 | "Sacar agora" Button | Button/Primary | (1040, 400) | (320, 40) | bg: primary-500, text: white, radius: radius-md |
| 19 | Payout Info | Text/Caption | (1040, 448) | (320, 16) | font: text-xs, color: neutral-500 |
| 20 | Transaction Section Title | Text/H3 | (272, 672) | (400, 28) | font: text-lg, font-display, color: neutral-900 |
| 21 | Transaction Table Card | Card/Table | (272, 712) | (1104, 280) | bg: surface-card, border: neutral-200, radius: radius-lg |
| 22 | Table Header Row | Row/Header | (288, 728) | (1072, 40) | border-bottom: neutral-200 |
| 23 | Transaction Row 1 | Row/List | (288, 776) | (1072, 56) | bg: surface-card, border-bottom: neutral-200 |
| 24 | Tx Date | Text/Body | (304, 784) | (100, 20) | font: text-sm, color: neutral-500 |
| 25 | Tx Client | Text/Body | (420, 784) | (240, 20) | font: text-base, color: neutral-900 |
| 26 | Tx Service | Text/Body | (680, 784) | (200, 20) | font: text-sm, color: neutral-500 |
| 27 | Tx Amount | Text/Body | (1000, 784) | (120, 20) | font: text-base, font-semibold, color: neutral-900 |
| 28 | Tx Status | Badge | (1140, 784) | (100, 24) | variant per status |
| 29 | Tx Type Icon | Icon | (1256, 788) | (20, 20) | ArrowUpRight (entrada) or ArrowDownLeft (saída) |

### Components Used

| Component | Variants | Count |
|-----------|----------|-------|
| Sidebar | professional nav | 1 |
| Header | standard | 1 |
| Card | metric (3x), chart (1x), balance (1x), table (1x) | 6 |
| Button | secondary, primary | 3 |
| Select | period selector | 1 |
| Chart | bar chart | 1 |
| Badge | success, default, warning | per row |
| Icon | Lucide — Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Download, ChevronDown, AlertCircle | — |

### Token Values

**Revenue Chart:**
- Chart padding: 16px
- Bar color: `primary-500` (#22c55e)
- Bar hover: `primary-400` (#4ade80)
- Bar radius: 4px top corners
- Bar width: responsive, gap between bars: 8px
- Grid lines: 1px dashed `neutral-200`
- Y-axis labels: `text-xs`, `neutral-500`
- X-axis labels: `text-xs`, `neutral-500`
- Tooltip (hover): `shadow-md`, `radius-md`, `surface-elevated` bg, shows exact value
- Max bars: 12 (monthly view), 30 (daily view)

**Balance Card:**
- Background: `surface-card` (#ffffff)
- Border: 1px solid `neutral-200`
- Radius: `radius-lg` (12px)
- Padding: `p-4` (16px)
- Shadow: `shadow-none`

**Transaction Table:**
- Row height: 56px
- Row padding: `px-4`
- Header: `text-xs`, `neutral-500`, uppercase
- Hover: `bg-neutral-50`
- Date format: "DD MMM YYYY" (e.g., "15 abr 2026")
- Amount: positive green (`primary-600`), negative red (`error`)

**Payout Button:**
- Full width of balance card
- Height: 40px
- Disabled state: `opacity-50`, `cursor-not-allowed`, tooltip shows minimum payout threshold

### Transaction Status Badges

| Status | Badge Variant | Notes |
|--------|---------------|-------|
| Concluído | success | Funds available |
| Pendente | warning | Processing |
| Em análise | info | Under review |
| Reembolsado | error | Refunded to client |
| Sacado | default | Payout completed |

### States

**Empty Transactions:**
- Icon: Receipt, 64px, `neutral-300`
- Title: "Nenhuma transação"
- Description: "Suas transações aparecerão aqui após o primeiro agendamento."

**Loading:**
- KPI skeletons: 3 cards
- Chart skeleton: 280px tall bar outline
- Table skeleton: 4 rows

**Payout Processing:**
- "Sacar agora" button shows spinner, disabled
- Toast on success: "Saque solicitado com sucesso"
- Toast on error: "Não foi possível processar o saque. Tente novamente."

**Insufficient Balance:**
- Payout button disabled
- Subtext shows: "Saldo mínimo para saque: R$ 50,00"
- Balance value in `neutral-500` instead of `neutral-900`

**Pro Tier Badge:**
- If professional is Pro: Badge "Pro" in balance card corner
- Background: `brand-bright` (#9FE870)
- Text: `neutral-900`
- Radius: `radius-full`

### Accessibility Notes

- **Chart:** Provide data table alternative (`<table class="sr-only">`)
- **Chart bars:** `role="img"`, `aria-label="Receita de [month]: R$ [value]"`
- **KPI cards:** `aria-label="Saldo disponível: R$ [amount]"`
- **Export button:** `aria-label="Exportar relatório financeiro"`
- **Transaction table:** Semantic `<table>` with `<th scope="col">`
- **Amount colors:** Not color-only — positive shows "+" prefix, negative shows "-"
- **Status badges:** Include `aria-label` with descriptive text
- **Payout button:** `aria-describedby` linking to minimum balance info
- **Select period:** `aria-label="Período do gráfico"`
- **Focus:** All interactive elements have visible 2px `primary-500` focus ring

---

*Professional Workspace frames complete. For shared components, see `components.md`. For tokens, see `tokens.md`.*
