# Search & Booking Journey — Frame Specifications

> **Journey:** Client search-to-booking flow (canonical multi-service path)  
> **Frames:** 8  
> **Source of Truth:** `docs/product/design-system/tokens.md`, `docs/product/design-system/components.md`  
> **Last Updated:** 2026-04-19

---

## Journey Map

```
SB-01 Search Results → SB-02 Profile Bio → SB-03 Services → SB-04 Slot Selection → SB-05 Personal Info → SB-06 Checkout → SB-07 Payment Processing → SB-08 Confirmation
```

---

## Frame SB-01: Search Results

| Attribute | Value |
|-----------|-------|
| **Frame ID** | `SB-01` |
| **Route** | `/buscar` |
| **Desktop Dimensions** | 1440 × 900 (frame), content max-width 1280px centered |
| **Mobile Dimensions** | 375 × 812 (iPhone frame), content full-bleed with 16px margins |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Grid** | 8px baseline grid; 12-column grid (desktop), 24px gutters, 32px page margins |

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (64px)                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ [32px margin]                                                       │
│ SearchBar (800×48)  LocationChip  FilterButton                      │
│ [24px gap]                                                          │
│ FilterChips row (horizontal scroll)                                 │
│ [24px gap]                                                          │
│ ┌────────────┐ ┌─────────────────────────────────────────────────┐  │
│ │ Sidebar    │ │ Professional Card 1                              │  │
│ │ (280px)    │ │ Avatar | Name, Specialty, Rating, Price, CTA   │  │
│ │            │ ├─────────────────────────────────────────────────┤  │
│ │            │ │ Professional Card 2                              │  │
│ │            │ │ ...                                              │  │
│ └────────────┘ └─────────────────────────────────────────────────┘  │
│ [32px margin]                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Layers (Top to Bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens & Values | Constraints |
|---|------------|-----------|-----------------|-------------|-----------------|-------------|
| 1 | **Header** | Shell/Header | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `1px solid neutral-200`, z: `z-sticky` | Top, Left+Right |
| 2 | **SearchBar** | Pattern/SearchBar | (32, 80) | (800, 48) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-md`, font: `text-base` `font-body` | Top, Left |
| 3 | **Search Icon** | Icon/Search | (48, 96) | (20, 20) | color: `neutral-500`, Lucide `Search`, stroke 1.5px | Top, Left |
| 4 | **Location Chip** | Pattern/FilterChip | (848, 88) | (auto, 32) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-md`, font: `text-sm` `font-body`, padding: `px-3 py-1.5` | Top, Left |
| 5 | **Filter Button** | Button/Icon | (984, 88) | (80, 32) | icon: `SlidersHorizontal` 20px `neutral-500`, bg: transparent, radius: `radius-md` | Top, Left |
| 6 | **FilterChips Row** | Chip/Filter (×n) | (32, 144) | (1376, 32) | gap: `space-2` (8px), horizontal scroll on overflow | Top, Left+Right |
| 7 | **Active Chip** | Chip/Filter Active | (32, 144) | (auto, 32) | bg: `primary-50`, border: `1px solid primary-200`, text: `primary-700`, radius: `radius-md` | Top, Left |
| 8 | **Filter Sidebar** | Sheet/Sidebar | (32, 192) | (280, 700) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-lg`, padding: `p-6`, shadow: `shadow-none` | Top, Bottom, Left |
| 9 | **Pro Card 1** | Card/Pro | (328, 192) | (1080, 200) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-lg`, padding: `p-6`, shadow: `shadow-none` | Top, Left+Right |
| 10 | **Card Avatar** | Avatar/Large | (348, 212) | (56, 56) | radius: `radius-md` (8px — **NOT full**), object-fit: cover | Top, Left |
| 11 | **Card Name** | Text/H3 | (420, 212) | (400, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Left |
| 12 | **Specialty Tag** | Badge/Default | (420, 244) | (auto, 24) | bg: `neutral-100`, text: `neutral-700`, radius: `radius-full`, font: `text-xs` `font-medium` | Top, Left |
| 13 | **Rating Row** | Text/Inline | (420, 276) | (200, 20) | icon: `Star` 16px filled `warning`, font: `text-sm` `font-body`, color: `neutral-500` | Top, Left |
| 14 | **Price** | Text/H3 | (1140, 276) | (200, 24) | font: `text-lg` `font-display` `font-semibold`, color: `primary-500` | Top, Right |
| 15 | **"Agendar" Button** | Button/Primary | (1260, 268) | (120, 40) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-sm` `font-semibold` | Top, Right |
| 16 | **Pro Card 2** | Card/Pro | (328, 408) | (1080, 200) | Same as Card 1 | Top, Left+Right |
| 17 | **Load More** | Button/Secondary | (328, 624) | (1080, 48) | bg: `neutral-100`, text: `neutral-900`, border: `1px solid neutral-200`, radius: `radius-md` | Bottom, Left+Right |

### Component Specifications

**SearchBar**
- Height: 48px (min touch target 44px ✅)
- Left padding: 48px (for icon), right padding: 40px (for clear button)
- Placeholder text: "Buscar por nome, especialidade ou serviço..."
- Focus state: border changes to `primary-500`, `duration-fast` (150ms)

**Professional Card**
- Internal layout: CSS Grid — `grid-cols-[56px_1fr_auto]` with 16px gap
- Hover state: border transitions to `neutral-300`, `duration-fast`
- Press state: bg shifts to `neutral-50`
- Price format: `R$ 150,00` — always 2 decimal places, comma separator

**FilterChips**
- Examples: "Psicologia", "Nutrição", "Yoga", "Presencial", "Online", "Hoje", "Esta semana"
- Chip height: 32px
- Active chip has a close (×) icon, 14px, `primary-700`

### States

| State | Description |
|-------|-------------|
| **Default** | Cards render with `border-default`. SearchBar unfocused. |
| **Loading (initial)** | Skeleton cards (6×) replace content. Avatar: 56×56 circle. Text: 2 lines per card. `duration-slow` pulse. |
| **Loading (more)** | Spinner at bottom of card list, secondary button shows "Carregando..." |
| **Empty** | EmptyState pattern: icon `SearchX` 64px `neutral-300`, title "Nenhum profissional encontrado", description "Tente ajustar seus filtros ou buscar por outro termo." |
| **Error** | Inline banner: bg `error-bg`, border `error`, icon `AlertTriangle`, text `error`. Retry button. |
| **Filter active** | Sidebar shows selected values. Chips appear below SearchBar. Clear all link appears. |

### Accessibility

- **Header**: `role="banner"`, logo links home with `aria-label="Muuday — Início"`
- **SearchBar**: `role="search"`, `aria-label="Buscar profissionais"`, clear button has `aria-label="Limpar busca"`
- **Cards**: Entire card is clickable (`<a>` or `role="link"`). `aria-label` includes name, specialty, and price.
- **Rating**: `aria-label="4.8 de 5 estrelas, 124 avaliações"`
- **Filter sidebar**: `aria-label="Filtros de busca"`, mobile becomes a dialog with `role="dialog"`
- **Focus order**: SearchBar → Location Chip → Filter Button → Filter Chips → Sidebar controls → Card 1 → Card 2 → Load More
- **Color contrast**: Price `primary-500` on `surface-card` = 3.2:1 (large text, UI component ✅). All body text `neutral-900` on `surface-page` = 15:1 ✅.

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (≥1024px)** | Sidebar visible, 2-column layout (sidebar + cards), 32px margins |
| **Tablet (768–1023px)** | Sidebar hidden, filter button opens drawer, cards full width within margins |
| **Mobile (<768px)** | Full-bleed cards with 16px horizontal padding, chips horizontally scrollable, sticky header |

---

## Frame SB-02: Profile Bio Tab

| Attribute | Value |
|-----------|-------|
| **Frame ID** | `SB-02` |
| **Route** | `/profissional/[id]` |
| **Desktop Dimensions** | 1440 × 900, content max-width 720px centered |
| **Mobile Dimensions** | 375 × 812, full-bleed with 16px margins |
| **Background** | `surface-page` (`#f4f8f5`) |
| **Grid** | 8px baseline, content max-width 720px centered (desktop) |

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (64px)                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Cover Photo (200px)                                                 │
│    ┌──────────┐                                                     │
│    │ Avatar   │  Dr. Ana Paula                                       │
│    │ (lg)     │  ⭐ 4.9 · 87 avaliações · Psicóloga                │
│    └──────────┘  [Badge Pro]                                         │
├─────────────────────────────────────────────────────────────────────┤
│ Bio | Serviços | Avaliações  ← Tab Bar (48px, sticky)               │
├─────────────────────────────────────────────────────────────────────┤
│ [Centered content, max-width 720px]                                 │
│                                                                     │
│ Sobre mim                                                           │
│ Texto da biografia com múltiplas linhas...                          │
│                                                                     │
│ Formação                                                            │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ • CRP 06/123456 · USP · Mestre em Psicologia Clínica          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Especialidades                                                      │
│ [Ansiedade] [Depressão] [TCC] [Mindfulness]                        │
│                                                                     │
│             [ sticky CTA: Agendar Consulta ]                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Layers (Top to Bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens & Values | Constraints |
|---|------------|-----------|-----------------|-------------|-----------------|-------------|
| 1 | **Header** | Shell/Header | (0, 0) | (1440, 64) | Same as SB-01 | Top, Left+Right |
| 2 | **Cover Photo** | Image/Cover | (0, 64) | (1440, 200) | object-fit: cover, radius: `radius-lg` (bottom corners only) | Top, Left+Right |
| 3 | **Avatar** | Avatar/Large | (360, 232) | (80, 80) | **Wait: components.md says lg=56, but principles says lg=64. Using components.md canonical: 56×56**. Actually user said "Avatar (lg)" — let's use components.md lg=56. | Top, Left |
| 4 | **Avatar Border Ring** | Shape | (356, 228) | (64, 64) | 4px solid `surface-page` stroke to create overlap effect | Top, Left |
| 5 | **Name** | Text/H1 | (480, 248) | (600, 32) | font: `text-2xl` `font-display` `font-bold`, color: `neutral-900` | Top, Left |
| 6 | **Rating Row** | Text/Body | (480, 284) | (400, 20) | icon: `Star` 16px `warning`, font: `text-base` `font-body`, color: `neutral-500` | Top, Left |
| 7 | **Badge Pro** | Badge/Pro | (480, 312) | (auto, 24) | bg: `brand-bright`, text: `neutral-900`, radius: `radius-full`, font: `text-xs` `font-semibold` | Top, Left |
| 8 | **Tab Bar** | Nav/Tabs | (0, 352) | (1440, 48) | bg: `surface-page`, border-bottom: `1px solid neutral-200`, sticky below header | Top, Left+Right |
| 9 | **Tab — Bio (Active)** | Nav/Tab Active | (360, 352) | (auto, 48) | text: `neutral-900`, border-bottom: `2px solid primary-500`, font: `text-sm` `font-semibold`, padding: `px-4 py-3` | Top, Left |
| 10 | **Tab — Serviços** | Nav/Tab | (480, 352) | (auto, 48) | text: `neutral-500`, font: `text-sm` `font-medium`, padding: `px-4 py-3` | Top, Left |
| 11 | **Tab — Avaliações** | Nav/Tab | (600, 352) | (auto, 48) | text: `neutral-500`, font: `text-sm` `font-medium`, padding: `px-4 py-3` | Top, Left |
| 12 | **Section Title (Sobre mim)** | Text/H3 | (360, 424) | (720, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Left+Right |
| 13 | **Bio Text** | Text/Body | (360, 460) | (720, auto) | font: `text-base` `font-body`, color: `neutral-600`, line-height: 1.5 | Top, Left+Right |
| 14 | **Section Title (Formação)** | Text/H3 | (360, 556) | (720, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Left+Right |
| 15 | **Info Box** | Box/Muted | (360, 596) | (720, auto) | bg: `neutral-50`, radius: `radius-md`, padding: `p-4`, border: `1px solid neutral-200` | Top, Left+Right |
| 16 | **Credential Item** | Text/Body | (376, 612) | (688, 20) | icon: `CheckCircle` 16px `primary-500`, font: `text-base` `font-body`, color: `neutral-700` | Top, Left+Right |
| 17 | **Section Title (Especialidades)** | Text/H3 | (360, 692) | (720, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Left+Right |
| 18 | **Specialty Tags** | Badge/Default (×n) | (360, 728) | (auto, 24) | gap: `space-2`, bg: `neutral-100`, text: `neutral-700` | Top, Left |
| 19 | **Sticky CTA** | Button/Primary | (980, 800) | (280, 48) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-base` `font-semibold` | Bottom, Right |

### Component Specifications

**Cover Photo**
- Aspect ratio: 1440:200 (7.2:1)
- Mobile: 375:140
- Gradient overlay (optional): `linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3))` for text readability if name overlaid
- Fallback: solid `neutral-200` with pattern or placeholder icon

**Avatar**
- Size: 56×56px (components.md `lg`)
- Overlaps cover photo by 28px vertically
- 4px white border (`surface-page`) to separate from cover
- Radius: `radius-md` (8px) — **NOT full**. Wait, avatars should be circle per Do/Don't. Let me check... principles.md says "Use rounded-full" for avatars. Yes, avatars are exception. radius: `radius-full`.
- Fallback: initials on `neutral-200` bg, `neutral-500` text, `font-display`

**Tab Bar**
- Sticky below header (top: 64px)
- z-index: `z-sticky` (100)
- Active indicator: `2px solid primary-500`, no animation on switch
- Tab labels: "Bio", "Serviços", "Avaliações"

**Badge Pro**
- Only shown if professional is on Pro tier
- Text: "Pro"
- Icon (optional): `Crown` 12px

### States

| State | Description |
|-------|-------------|
| **Default** | Bio tab active. Cover photo loaded. CTA visible. |
| **Loading** | Skeleton: cover `neutral-100`, avatar `neutral-100` circle, 3 text lines pulsing. Tabs hidden until data loads. |
| **Error** | ErrorBoundary: icon `AlertTriangle`, title "Não foi possível carregar o perfil", CTA "Tentar novamente" |
| **No bio** | Section hidden or shows placeholder: "Este profissional ainda não adicionou uma biografia." |
| **Scrolled** | Tab bar gains `border-bottom: neutral-200` (already present). CTA remains sticky. |
| **Mobile CTA** | On mobile <768px, CTA becomes full-width sticky bottom bar (64px height, 16px horizontal padding) |

### Accessibility

- **Cover photo**: `alt="Foto de capa de [Nome do profissional]"`, `aria-hidden="true"` if decorative
- **Avatar**: `alt="Foto de [Nome]"`
- **Tabs**: `role="tablist"`, each tab `role="tab"`, `aria-selected="true/false"`, `aria-controls="[panel-id]"`. Arrow key navigation supported.
- **Bio text**: `id="bio-panel"`, `role="tabpanel"`, `aria-labelledby="tab-bio"`
- **CTA**: `aria-label="Agendar consulta com [Nome]"`
- **Credential items**: Structured as `<ul>` with `<li>` elements for screen readers
- **Focus order**: Header nav → Tabs → Bio content → Specialty tags → CTA
- **Skip link**: "Pular para serviços" link available above tabs

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | Cover full width. Content 720px centered. Avatar at x=360 (aligned with content left edge). CTA sticky bottom-right. |
| **Tablet** | Content 100% with 24px margins. Avatar overlaps cover by 24px. |
| **Mobile** | Cover 140px. Avatar 64×64 centered or left-aligned with 16px margin. Name and meta below avatar. Tabs full width, horizontal scroll if needed. CTA sticky bottom full-width. |

---

## Frame SB-03: Services Tab

| Attribute | Value |
|-----------|-------|
| **Frame ID** | `SB-03` |
| **Route** | `/profissional/[id]?tab=servicos` |
| **Desktop Dimensions** | 1440 × 900, content max-width 720px centered |
| **Mobile Dimensions** | 375 × 812, full-bleed with 16px margins |
| **Background** | `surface-page` |
| **Grid** | 8px baseline, content max-width 720px centered |

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header + Cover + Avatar + Name + Meta (same as SB-02)               │
├─────────────────────────────────────────────────────────────────────┤
│ Bio | Serviços (active) | Avaliações                                │
├─────────────────────────────────────────────────────────────────────┤
│ [Centered content, max-width 720px]                                 │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ▼ Sessão de Psicoterapia Individual              R$ 180,00    │ │
│ │   50 minutos                                                     │ │
│ │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ │
│ │   Sessão terapêutica individual para adultos...                  │ │
│ │   [Presencial] [Online]                        [Agendar]        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ▶ Avaliação Psicológica                          R$ 220,00    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Layers (Top to Bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens & Values | Constraints |
|---|------------|-----------|-----------------|-------------|-----------------|-------------|
| 1–7 | **Profile Header** | Group | (0, 0) | (1440, 352) | Same layers as SB-02 header section | Top, Left+Right |
| 8 | **Tab Bar** | Nav/Tabs | (0, 352) | (1440, 48) | Same as SB-02, "Serviços" tab active | Top, Left+Right |
| 9 | **Tab — Serviços (Active)** | Nav/Tab Active | (480, 352) | (auto, 48) | border-bottom: `2px solid primary-500`, text: `neutral-900` | Top, Left |
| 10 | **Section Title** | Text/H3 | (360, 424) | (720, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Left+Right |
| 11 | **Service Card 1** | Card/Accordion | (360, 460) | (720, auto) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-lg`, padding: `p-0` (internal padding on header/body) | Top, Left+Right |
| 12 | **Card Header (clickable)** | Row/Clickable | (360, 460) | (720, 56) | padding: `px-6 py-4`, cursor: pointer, full width | Top, Left+Right |
| 13 | **Service Name** | Text/H3 | (376, 468) | (400, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Left |
| 14 | **Duration** | Text/Body | (376, 500) | (200, 20) | icon: `Clock` 14px `neutral-500`, font: `text-sm` `font-body`, color: `neutral-500` | Top, Left |
| 15 | **Price** | Text/H3 | (1000, 476) | (120, 28) | font: `text-lg` `font-display` `font-semibold`, color: `primary-500` | Top, Right |
| 16 | **Chevron** | Icon | (1144, 476) | (24, 24) | `ChevronDown`, color: `neutral-500`, rotates 180° when expanded | Top, Right |
| 17 | **Expanded Body** | Box | (360, 516) | (720, auto) | padding: `px-6 pb-4`, border-top: `1px solid neutral-200` | Top, Left+Right |
| 18 | **Description** | Text/Body | (376, 532) | (688, auto) | font: `text-base` `font-body`, color: `neutral-600`, line-height: 1.5 | Top, Left+Right |
| 19 | **Includes Tags** | Badge/Outline (×n) | (376, 580) | (auto, 24) | gap: `space-2`, bg: `primary-50`, border: `1px solid primary-200`, text: `primary-700`, radius: `radius-sm` | Top, Left |
| 20 | **"Agendar" Button** | Button/Secondary | (1000, 580) | (120, 36) | bg: `surface-card`, border: `1px solid primary-500`, text: `primary-500`, radius: `radius-md`, font: `text-sm` `font-semibold` | Top, Right |
| 21 | **Service Card 2** | Card/Accordion | (360, 596) | (720, 56) | Collapsed state — only header visible | Top, Left+Right |
| 22 | **Service Card 3** | Card/Accordion | (360, 660) | (720, 56) | Collapsed state | Top, Left+Right |
| 23 | **Sticky CTA** | Button/Primary | (0, 836) | (1440, 64) | bg: `primary-500`, text: `white`, radius: `radius-md` (top corners only on mobile), font: `text-base` `font-semibold` | Bottom, Left+Right |

### Component Specifications

**Accordion Card**
- Header height: 56px (min touch target)
- Expanded body: auto-height based on content
- Gap between cards: 12px (`space-3`)
- Only one card expanded at a time (accordion behavior)
- Hover on header: bg shifts to `neutral-50`, `duration-fast`
- Expanded card border: transitions to `primary-500`, `duration-fast`

**"Agendar" Button (per service)**
- Variant: Secondary outline
- On click: navigates to `/agendar/[serviceId]`
- Disabled state if service is not bookable (shows "Indisponível" in `neutral-400`)

**Price Display**
- Format: `R$ 180,00`
- Alignment: right-aligned within card
- Currency symbol: `R$` with normal weight, value with `font-semibold`

### States

| State | Description |
|-------|-------------|
| **Default (collapsed)** | All cards collapsed. Chevron points down. |
| **Expanded** | One card open. Chevron rotated 180° (points up). Body visible with description, tags, and CTA. Border: `primary-500`. |
| **Hover (header)** | bg: `neutral-50`, `duration-fast` (150ms) |
| **Loading** | Skeleton: 3 cards, each 56px height, `neutral-100` pulse. No chevrons. |
| **Empty** | EmptyState: icon `ClipboardList` 64px `neutral-300`, title "Nenhum serviço cadastrado", description "Este profissional ainda não adicionou serviços." |
| **Mobile CTA** | Full-width sticky bottom bar, 64px height |

### Accessibility

- **Accordion**: Each card `role="region"`, header button `role="button"`, `aria-expanded="true/false"`, `aria-controls="[body-id]"`
- **Body**: `role="region"`, `id` matches `aria-controls`
- **Price**: `aria-label="Preço: 180 reais"` for screen reader clarity
- **Book button**: `aria-label="Agendar Sessão de Psicoterapia Individual por 180 reais"`
- **Keyboard**: Enter/Space toggles accordion. ArrowUp/Down moves between accordion headers.
- **Focus ring**: `2px solid primary-500`, offset 2px on header and button

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | Cards 720px centered. Price and CTA on same row. |
| **Tablet** | Cards full width minus 24px margins. |
| **Mobile** | Cards full width minus 16px margins. Price stacks above CTA inside expanded body. CTA full width. |

---

## Frame SB-04: Slot Selection

| Attribute | Value |
|-----------|-------|
| **Frame ID** | `SB-04` |
| **Route** | `/agendar/[id]` |
| **Desktop Dimensions** | 1440 × 900, content max-width 960px centered |
| **Mobile Dimensions** | 375 × 812, full-bleed with 16px margins |
| **Background** | `surface-page` |
| **Grid** | 8px baseline, max-width 960px centered |

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (64px)                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ← Sessão de Psicoterapia Individual          Presencial · 50 min   │
├─────────────────────────────────────────────────────────────────────┤
│ [Centered content, max-width 960px]                                 │
│                                                                     │
│ ┌────────────────────────────┐  ┌─────────────────────────────────┐ │
│ │  Seg  Qui                  │  │ Horários disponíveis             │ │
│ │  [Calendar]                │  │                                  │ │
│ │                            │  │ 09:00  09:30  10:00  10:30      │ │
│ │                            │  │ 11:00  11:30  14:00  14:30      │ │
│ │                            │  │                                  │ │
│ └────────────────────────────┘  └─────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ☐ Aceito a política de cancelamento com 24h de antecedência    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│         [ Continuar ]                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Layers (Top to Bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens & Values | Constraints |
|---|------------|-----------|-----------------|-------------|-----------------|-------------|
| 1 | **Header** | Shell/Header | (0, 0) | (1440, 64) | Same as previous frames | Top, Left+Right |
| 2 | **Service Header** | Box/Sticky | (0, 64) | (1440, 72) | bg: `surface-page`, border-bottom: `1px solid neutral-200`, padding: `px-8 py-4`, z: `z-sticky` | Top, Left+Right |
| 3 | **Back Button** | Button/Icon | (32, 80) | (40, 40) | icon: `ArrowLeft` 20px `neutral-500`, bg: transparent, radius: `radius-md` | Top, Left |
| 4 | **Service Title** | Text/H2 | (80, 76) | (600, 28) | font: `text-xl` `font-display` `font-semibold`, color: `neutral-900` | Top, Left |
| 5 | **Service Meta** | Text/Body | (80, 104) | (400, 20) | icon: `MapPin` 14px `neutral-500`, font: `text-sm` `font-body`, color: `neutral-500` | Top, Left |
| 6 | **Booking Type Toggle** | SegmentedControl | (240, 160) | (960, 48) | bg: `neutral-100`, border: `1px solid neutral-200`, radius: `radius-md`, padding: `p-1` | Top, Left+Right |
| 7 | **Active Segment** | Button/Selected | (244, 164) | (476, 40) | bg: `surface-card`, text: `neutral-900`, radius: `radius-md`, font: `text-sm` `font-semibold` | Top, Left |
| 8 | **Inactive Segment** | Button/Ghost | (720, 164) | (476, 40) | bg: transparent, text: `neutral-500`, font: `text-sm` `font-medium` | Top, Right |
| 9 | **Calendar** | Calendar/Picker | (240, 224) | (480, 360) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-lg`, padding: `p-4` | Top, Left |
| 10 | **Calendar Header** | Row | (256, 240) | (448, 32) | Month/year: `text-base` `font-display` `font-semibold`, nav arrows: `ChevronLeft/Right` 20px | Top, Left |
| 11 | **Weekday Labels** | Text/Label (×7) | (256, 280) | (448, 24) | font: `text-xs` `font-body` `font-medium`, color: `neutral-500`, text-align: center | Top, Left |
| 12 | **Day Cell** | Button/Day | (256, 312) | (40, 40) | radius: `radius-md`, font: `text-sm` `font-body`, color: `neutral-900`, margin: 4px | Top, Left |
| 13 | **Day Cell (today)** | Button/Day Today | — | (40, 40) | border: `1px solid primary-500`, color: `primary-500` | Top, Left |
| 14 | **Day Cell (selected)** | Button/Day Selected | — | (40, 40) | bg: `primary-500`, text: `white`, radius: `radius-md` | Top, Left |
| 15 | **Day Cell (disabled)** | Button/Day Disabled | — | (40, 40) | color: `neutral-300`, cursor: not-allowed | Top, Left |
| 16 | **Time Slots Panel** | Box | (752, 224) | (448, 360) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-lg`, padding: `p-4` | Top, Right |
| 17 | **Panel Title** | Text/H3 | (768, 240) | (416, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Right |
| 18 | **Time Slot** | Button/Chip | (768, 280) | (72, 40) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-md`, font: `text-sm` `font-body`, color: `neutral-900` | Top, Right |
| 19 | **Time Slot (selected)** | Button/Chip Selected | — | (72, 40) | bg: `primary-500`, text: `white`, border: `none` | Top, Right |
| 20 | **Time Slot (disabled)** | Button/Chip Disabled | — | (72, 40) | bg: `neutral-50`, text: `neutral-300`, border: `none`, cursor: not-allowed | Top, Right |
| 21 | **Empty Slots State** | EmptyState | (768, 280) | (416, 200) | icon: `CalendarX` 48px `neutral-300`, title "Nenhum horário", description "Selecione outra data." | Top, Right |
| 22 | **Policy Box** | Box/Muted | (240, 600) | (960, 64) | bg: `neutral-50`, radius: `radius-md`, padding: `p-4`, border: `1px solid neutral-200` | Top, Left+Right |
| 23 | **Policy Checkbox** | Control/Checkbox | (256, 616) | (20, 20) | size: md, radius: `radius-sm`, checked: `primary-500` | Top, Left |
| 24 | **Policy Text** | Text/Body | (288, 616) | (896, 20) | font: `text-base` `font-body`, color: `neutral-700` | Top, Left+Right |
| 25 | **Policy Link** | Text/Link | (480, 616) | (auto, 20) | font: `text-base` `font-body`, color: `primary-600`, underline on hover | inline |
| 26 | **Sticky CTA** | Button/Primary | (0, 836) | (1440, 64) | bg: `primary-500`, text: `white`, radius: `radius-md` (top only on mobile), font: `text-base` `font-semibold` | Bottom, Left+Right |

### Component Specifications

**Calendar**
- 7-column grid (weekdays)
- Day cell size: 40×40px (minimum touch target ✅)
- Gap between cells: 4px
- Month navigation: arrow buttons, 32×32px
- Today's date: outlined with `primary-500`
- Selected date: filled `primary-500`, white text
- Disabled dates (past or blocked): `neutral-300` text, no hover

**Time Slots**
- Grid: 4 columns on desktop, 2 columns on mobile
- Slot size: 72×40px (min touch target ✅)
- Gap: 8px
- Morning/afternoon separator (optional): label text `text-xs` `neutral-500`

**Booking Type Toggle**
- Segments: "Presencial" | "Online" (or single option if only one available)
- If only one type available, toggle is hidden entirely
- Active segment: white bg with subtle shadow (shadow-sm allowed for elevation within control)

**Policy Checkbox**
- Unchecked by default
- CTA disabled until checked
- Link "política de cancelamento" opens modal or navigates to `/politica-de-cancelamento`

### States

| State | Description |
|-------|-------------|
| **Default** | Calendar shows current month. No date selected. Time slots panel empty or shows "Selecione uma data". CTA disabled. Checkbox unchecked. |
| **Date selected** | Available time slots load for selected date. Slots panel populated. |
| **Slot selected** | Slot cell filled `primary-500`. CTA enabled (if checkbox checked). |
| **Checkbox checked** | If slot selected, CTA fully enabled. |
| **Loading slots** | Time slots panel shows 6 skeleton chips (72×40px). |
| **No slots** | EmptyState in time panel: `CalendarX`, "Nenhum horário disponível", "Tente outra data ou tipo de atendimento." |
| **Error** | Inline error banner below calendar: `error` text, `AlertTriangle` icon, "Não foi possível carregar os horários." |

### Accessibility

- **Calendar**: `role="grid"`, month header `aria-live="polite"`, day cells `role="gridcell"`, `aria-selected="true/false"`, `aria-disabled="true/false"`
- **Day navigation**: Arrow keys move between days. Enter selects.
- **Time slots**: `role="radiogroup"`, each slot `role="radio"`, `aria-checked="true/false"`. Arrow keys navigate, Space/Enter selects.
- **Checkbox**: Native `<input type="checkbox">`, label properly associated. `aria-required="true"`.
- **CTA**: `aria-disabled="true"` when disabled (not just `disabled` attribute, to keep focusable for screen reader context). `aria-describedby` points to helper text explaining why disabled.
- **Back button**: `aria-label="Voltar para serviços"`
- **Focus order**: Back → Calendar nav → Day cells → Time slots → Checkbox → CTA

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | Calendar (480px) + Time slots (448px) side by side. 32px gap. |
| **Tablet** | Calendar and time slots stack vertically. Both full width. |
| **Mobile** | Calendar full width. Time slots below. Toggle full width. CTA sticky bottom full width. |

---

## Frame SB-05: Personal Info

| Attribute | Value |
|-----------|-------|
| **Frame ID** | `SB-05` |
| **Route** | `/agendar/[id]/info` |
| **Desktop Dimensions** | 1440 × 900, form max-width 560px centered |
| **Mobile Dimensions** | 375 × 812, full-bleed with 16px margins |
| **Background** | `surface-page` |
| **Grid** | 8px baseline, form max-width 560px centered |

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (64px)                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ←                                         Passo 2 de 4              │
│                                                                     │
│          Informações Pessoais                                       │
│          Preencha seus dados para confirmar o agendamento.          │
│                                                                     │
│          Nome completo *                                            │
│          ┌─────────────────────────────────────────────────────┐    │
│          │ João Silva                                          │    │
│          └─────────────────────────────────────────────────────┘    │
│                                                                     │
│          Telefone *                                                 │
│          ┌─────────────────────────────────────────────────────┐    │
│          │ (11) 98765-4321     ✓                               │    │
│          └─────────────────────────────────────────────────────┘    │
│                                                                     │
│          Observações (opcional)                                     │
│          ┌─────────────────────────────────────────────────────┐    │
│          │                                                     │    │
│          │                                                     │    │
│          └─────────────────────────────────────────────────────┘    │
│                                                                     │
│          ☐ Li e aceito os termos de uso e política de privacidade  │
│                                                                     │
│          [ Continuar ]                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Layers (Top to Bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens & Values | Constraints |
|---|------------|-----------|-----------------|-------------|-----------------|-------------|
| 1 | **Header** | Shell/Header | (0, 0) | (1440, 64) | Same as previous | Top, Left+Right |
| 2 | **Back Button** | Button/Icon | (32, 80) | (40, 40) | icon: `ArrowLeft` 20px `neutral-500` | Top, Left |
| 3 | **Stepper** | Pattern/Stepper | (440, 80) | (560, 32) | horizontal, 4 steps: "Serviço" ✓ → "Dados" (active) → "Pagamento" → "Confirmação" | Top, Left+Right |
| 4 | **Step Indicator (text)** | Text/Label | (1200, 80) | (200, 20) | font: `text-sm` `font-body`, color: `neutral-500`, text: "Passo 2 de 4" | Top, Right |
| 5 | **Title** | Text/H1 | (440, 128) | (560, 36) | font: `text-2xl` `font-display` `font-bold`, color: `neutral-900` | Top, Left+Right |
| 6 | **Subtitle** | Text/Body | (440, 172) | (560, 24) | font: `text-base` `font-body`, color: `neutral-500` | Top, Left+Right |
| 7 | **Form Label (Nome)** | Text/Label | (440, 220) | (560, 20) | font: `text-sm` `font-body` `font-semibold`, color: `neutral-900`, required asterisk: `error` | Top, Left+Right |
| 8 | **Input (Nome)** | Input/Text | (440, 248) | (560, 48) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-md`, padding: `px-4`, font: `text-base` | Top, Left+Right |
| 9 | **Input Icon (check)** | Icon | (960, 264) | (20, 20) | `Check` 20px `primary-500`, appears when valid | Top, Right |
| 10 | **Form Label (Telefone)** | Text/Label | (440, 316) | (560, 20) | Same as label above | Top, Left+Right |
| 11 | **Input (Telefone)** | Input/Text | (440, 344) | (560, 48) | Same input styling, placeholder: "(00) 00000-0000" | Top, Left+Right |
| 12 | **Form Label (Observações)** | Text/Label | (440, 412) | (560, 20) | font: `text-sm` `font-body` `font-semibold`, color: `neutral-900`, "(opcional)" in `neutral-500` | Top, Left+Right |
| 13 | **Textarea** | Input/Textarea | (440, 440) | (560, 120) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-md`, padding: `px-4 py-3`, min-height: 100px, resize: vertical | Top, Left+Right |
| 14 | **Terms Checkbox** | Control/Checkbox | (440, 580) | (20, 20) | size: md, radius: `radius-sm` | Top, Left |
| 15 | **Terms Label** | Text/Body | (472, 580) | (528, auto) | font: `text-base` `font-body`, color: `neutral-700` | Top, Left+Right |
| 16 | **Terms Link** | Text/Link | (580, 580) | (auto, auto) | font: `text-base` `font-body`, color: `primary-600`, underline on hover | inline |
| 17 | **CTA** | Button/Primary | (440, 640) | (560, 48) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-base` `font-semibold` | Bottom, Left+Right |

### Component Specifications

**Stepper**
- 4 steps total: 1-Serviço (completed), 2-Dados (active), 3-Pagamento, 4-Confirmação
- Completed step: `bg-primary-500`, white checkmark, connector `bg-primary-500`
- Active step: `border-2 border-primary-500`, `text-primary-500`
- Pending step: `bg-neutral-200`, `text-neutral-500`
- Step size: 32px diameter
- Connector: 2px height, 4px gap from step circles

**Inputs**
- Height: 48px (md size)
- Focus: border `primary-500`, `duration-fast`
- Error: border `error`, error message below in `text-sm` `error`
- Valid: check icon appears inside input, right side (padding-right: 44px)
- Pre-filled inputs (from auth): bg `neutral-50`, non-editable or editable with check

**Textarea**
- Min-height: 100px
- Max-height: 240px
- Resize: vertical only
- Placeholder: "Descreva o motivo da consulta ou qualquer informação relevante..."

**Terms Checkbox**
- Required for form submission
- Links: "termos de uso" → `/termos-de-uso`, "política de privacidade" → `/politica-de-privacidade`
- Links open in new tab with `rel="noopener noreferrer"`

### States

| State | Description |
|-------|-------------|
| **Default** | Empty form (except pre-filled from auth). CTA disabled. No validation messages. |
| **Typing** | Real-time validation on blur. Immediate feedback for phone mask. |
| **Valid** | All required fields filled, terms checked. CTA enabled. Check icons visible. |
| **Invalid submit** | Empty required fields show error border and message. First invalid field gets focus. |
| **Phone mask** | Auto-format: `(11) 98765-4321` — only numbers allowed, max 11 digits |
| **Loading** | CTA shows spinner, text "Processando...", disabled |

### Accessibility

- **Stepper**: `role="list"`, each step `role="listitem"`, `aria-label="Passo 2 de 4: Informações Pessoais"`
- **Form**: `aria-label="Informações pessoais para agendamento"`
- **Labels**: All inputs have visible `<label>` with `htmlFor` matching input `id`
- **Required**: `aria-required="true"` on required inputs. Visual asterisk `error` color.
- **Error messages**: `aria-describedby` links input to error text. `aria-invalid="true"`.
- **Checkbox**: Native input, label clickable. `aria-required="true"`.
- **Links in terms**: `target="_blank"`, `rel="noopener noreferrer"`
- **Focus order**: Back → Stepper → Name → Phone → Notes → Terms → CTA
- **Focus ring**: `2px solid primary-500`, offset 2px on all interactive elements

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | Form 560px centered. Stepper visible above title. |
| **Tablet** | Form full width minus 24px margins. |
| **Mobile** | Form full width minus 16px margins. Stepper may collapse to dots only with labels below. CTA full width, sticky optional. |

---

## Frame SB-06: Checkout

| Attribute | Value |
|-----------|-------|
| **Frame ID** | `SB-06` |
| **Route** | `/agendar/[id]/checkout` |
| **Desktop Dimensions** | 1440 × 900, 2-column layout max-width 960px centered |
| **Mobile Dimensions** | 375 × 812, stacked single column |
| **Background** | `surface-page` |
| **Grid** | 8px baseline, 2-column layout max-width 960px centered |

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (64px)                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ←                                         Passo 3 de 4              │
│                                                                     │
│          Finalizar Pagamento                                        │
│                                                                     │
│ ┌────────────────────────────┐  ┌─────────────────────────────────┐ │
│ │ Resumo do agendamento      │  │ Método de pagamento              │ │
│ │                            │  │                                  │ │
│ │ [Avatar] Dra. Ana Paula    │  │ ○ Cartão de crédito             │ │
│ │ Psicoterapia Individual    │  │ ○ Pix                           │ │
│ │ 24 de abril, 09:00         │  │                                  │ │
│ │                            │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│ │ Consulta         R$ 180,00 │  │ Total a pagar                    │ │
│ │ Taxa de serviço   R$ 18,00 │  │ R$ 198,00                        │ │
│ │ ─────────────────────────  │  │                                  │ │
│ │ Total            R$ 198,00 │  │ [ Aplicar cupom ]                │ │
│ │                            │  │                                  │ │
│ └────────────────────────────┘  │ [ Confirmar Pagamento ]          │ │
│                                 └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Layers (Top to Bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens & Values | Constraints |
|---|------------|-----------|-----------------|-------------|-----------------|-------------|
| 1 | **Header** | Shell/Header | (0, 0) | (1440, 64) | Same | Top, Left+Right |
| 2 | **Back Button** | Button/Icon | (32, 80) | (40, 40) | `ArrowLeft` 20px `neutral-500` | Top, Left |
| 3 | **Stepper** | Pattern/Stepper | (440, 80) | (560, 32) | Steps 1-2 completed, step 3 active | Top, Left+Right |
| 4 | **Step Text** | Text/Label | (1200, 80) | (200, 20) | "Passo 3 de 4", `text-sm` `neutral-500` | Top, Right |
| 5 | **Title** | Text/H1 | (240, 128) | (960, 36) | font: `text-2xl` `font-display` `font-bold`, color: `neutral-900` | Top, Left+Right |
| 6 | **Left Column** | Column | (240, 176) | (480, auto) | gap: `space-6` | Top, Left |
| 7 | **Summary Card** | Card/Compact | (240, 176) | (480, auto) | bg: `neutral-50`, radius: `radius-lg`, padding: `p-6`, border: `1px solid neutral-200` | Top, Left |
| 8 | **Pro Avatar** | Avatar/Small | (256, 192) | (40, 40) | radius: `radius-md` (wait, avatars are full). `radius-full` per Do/Don't. | Top, Left |
| 9 | **Pro Name** | Text/H3 | (308, 196) | (400, 24) | font: `text-base` `font-display` `font-semibold`, color: `neutral-900` | Top, Left |
| 10 | **Service Name** | Text/Body | (308, 224) | (400, 20) | font: `text-sm` `font-body`, color: `neutral-500` | Top, Left |
| 11 | **DateTime** | Text/Body | (308, 248) | (400, 20) | icon: `Calendar` 14px `neutral-500`, font: `text-sm` `font-body`, color: `neutral-500` | Top, Left |
| 12 | **Divider 1** | Line | (256, 280) | (448, 1) | color: `neutral-200` | Top, Left |
| 13 | **Row Label (Serviço)** | Text/Body | (256, 296) | (300, 24) | font: `text-base` `font-body`, color: `neutral-700` | Top, Left |
| 14 | **Row Value** | Text/Body | (604, 296) | (100, 24) | font: `text-base` `font-body` `font-semibold`, color: `neutral-900`, align: right | Top, Right |
| 15 | **Row Label (Taxa)** | Text/Body | (256, 328) | (300, 20) | font: `text-sm` `font-body`, color: `neutral-500` | Top, Left |
| 16 | **Row Value (Taxa)** | Text/Body | (604, 328) | (100, 20) | font: `text-sm` `font-body`, color: `neutral-500`, align: right | Top, Right |
| 17 | **Divider 2** | Line | (256, 360) | (448, 1) | color: `neutral-200` | Top, Left |
| 18 | **Total Label** | Text/H2 | (256, 376) | (300, 28) | font: `text-xl` `font-display` `font-bold`, color: `neutral-900` | Top, Left |
| 19 | **Total Value** | Text/H2 | (604, 376) | (100, 28) | font: `text-xl` `font-display` `font-bold`, color: `neutral-900`, align: right | Top, Right |
| 20 | **Right Column** | Column | (752, 176) | (448, auto) | gap: `space-6` | Top, Right |
| 21 | **Payment Title** | Text/H3 | (752, 176) | (448, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Right |
| 22 | **Payment Methods** | Radio/List | (752, 220) | (448, auto) | gap: `space-3` | Top, Right |
| 23 | **Method Card (Credit)** | Radio/List Item | (752, 220) | (448, 64) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-lg`, padding: `p-4` | Top, Right |
| 24 | **Radio Button** | Control/Radio | (768, 244) | (20, 20) | `rounded-full`, checked: dot 8px `primary-500` | Top, Right |
| 25 | **Method Icon** | Icon | (800, 244) | (24, 24) | `CreditCard` 24px `neutral-700` | Top, Right |
| 26 | **Method Label** | Text/Body | (836, 244) | (200, 24) | font: `text-base` `font-body` `font-semibold`, color: `neutral-900` | Top, Right |
| 27 | **Method Card (Pix)** | Radio/List Item | (752, 296) | (448, 64) | Same structure | Top, Right |
| 28 | **Method Icon (Pix)** | Icon/Custom | (800, 320) | (24, 24) | Custom Pix icon or `QrCode` 24px `neutral-700` | Top, Right |
| 29 | **Selected Method** | Radio/List Active | — | (448, 64) | border: `2px solid primary-500`, bg: `primary-50` | Top, Right |
| 30 | **Coupon Box** | Input/Inline | (752, 400) | (448, 48) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-md`, padding: `px-4` | Top, Right |
| 31 | **Apply Button** | Button/Text | (1144, 408) | (80, 32) | font: `text-sm` `font-body` `font-semibold`, color: `primary-600` | Top, Right |
| 32 | **CTA** | Button/Primary | (752, 480) | (448, 48) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-base` `font-semibold` | Bottom, Right |

### Component Specifications

**Summary Card**
- Background: `neutral-50` (muted, to differentiate from interactive cards)
- Total row: extra spacing above (`pt-4`) and bold typography
- Service fee: always shown transparently. Label: "Taxa de serviço" with info tooltip (`Info` 14px icon)
- Price format: `R$ 180,00` — right aligned

**Payment Method Cards**
- Height: 64px (min touch target ✅)
- Selected: border `2px solid primary-500`, bg `primary-50`
- Unselected: border `1px solid neutral-200`
- Hover: border `neutral-300`, `duration-fast`
- Radio: 20px, `rounded-full`, dot 8px `primary-500` when checked

**Coupon Input**
- Placeholder: "Código do cupom"
- Apply button: text-only, `primary-600`, disabled until text entered
- Success state: border `primary-500`, green check icon, "Cupom aplicado" text
- Error state: border `error`, "Cupom inválido" text below

**CTA Button**
- Label: "Confirmar Pagamento — R$ 198,00" (dynamic price)
- Disabled until payment method selected
- Loading state: spinner + "Processando..."

### States

| State | Description |
|-------|-------------|
| **Default** | No payment method selected. CTA disabled. Coupon empty. |
| **Method selected** | Card border `primary-500`, bg `primary-50`. CTA enabled with dynamic total. |
| **Coupon typing** | Apply button enabled. |
| **Coupon valid** | Input border `primary-500`, discount shown as new row in summary ("Desconto -R$ 20,00" in `primary-600`). Total updated. |
| **Coupon invalid** | Input border `error`, error text below: "Cupom inválido ou expirado." |
| **Processing** | CTA loading. All inputs disabled. |
| **Error** | Inline error banner: `error-bg`, `AlertTriangle`, "Não foi possível processar o pagamento. Tente novamente." |

### Accessibility

- **Stepper**: Same as SB-05. `aria-label="Passo 3 de 4: Pagamento"`
- **Payment methods**: `role="radiogroup"`, each card `role="radio"`, `aria-checked="true/false"`. Arrow keys navigate. Enter/Space selects.
- **Method cards**: Clickable entire row. Focus ring on card.
- **Summary**: `aria-label="Resumo do agendamento"`. Prices `aria-label="Total: 198 reais"`.
- **Coupon**: Input `aria-label="Código do cupom"`, button `aria-label="Aplicar cupom"`
- **CTA**: `aria-label` includes total: "Confirmar pagamento de 198 reais"
- **Focus order**: Back → Stepper → Payment method 1 → Payment method 2 → Coupon → Apply → CTA

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | 2-column: Summary (480px) left, Payment (448px) right. 32px gap. |
| **Tablet** | Columns stack. Summary first, then payment. Full width minus margins. |
| **Mobile** | Single column, stacked. Summary card full width. Payment methods full width. CTA full width sticky bottom. |

---

## Frame SB-07: Payment Processing

| Attribute | Value |
|-----------|-------|
| **Frame ID** | `SB-07` |
| **Route** | `/agendar/[id]/pagamento` |
| **Desktop Dimensions** | 1440 × 900, centered content max-width 480px |
| **Mobile Dimensions** | 375 × 812, centered content with 16px margins |
| **Background** | `surface-page` |
| **Grid** | 8px baseline, centered content max-width 480px |

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header (64px)                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│                           ⟳  (spinner, 48px)                        │
│                                                                     │
│                    Processando seu pagamento...                     │
│              Não feche esta página até a confirmação.               │
│                                                                     │
│              ┌─────────────────────────────────────┐                │
│              │ ⏱ Reservando horário...             │                │
│              │ ████████░░░░░░░░░░░░  (progress)    │                │
│              └─────────────────────────────────────┘                │
│                                                                     │
│              Dra. Ana Paula                                         │
│              Psicoterapia Individual — 24/04 às 09:00               │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Layers (Top to Bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens & Values | Constraints |
|---|------------|-----------|-----------------|-------------|-----------------|-------------|
| 1 | **Header** | Shell/Minimal | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `1px solid neutral-200`, centered logo only, no nav | Top, Left+Right |
| 2 | **Spinner Container** | Box | (0, 0) | (1440, 900) | flex center | Center |
| 3 | **Spinner** | Loading/Spinner | (696, 280) | (48, 48) | color: `primary-500`, stroke-width: 3px, `duration-normal` infinite rotation (1s linear) | Center |
| 4 | **Title** | Text/H2 | (480, 344) | (480, 32) | font: `text-xl` `font-display` `font-bold`, color: `neutral-900`, text-align: center | Center |
| 5 | **Subtitle** | Text/Body | (480, 384) | (480, 24) | font: `text-base` `font-body`, color: `neutral-500`, text-align: center | Center |
| 6 | **Status Card** | Card/Compact | (480, 424) | (480, 96) | bg: `neutral-50`, radius: `radius-lg`, padding: `p-4`, border: `1px solid neutral-200` | Center |
| 7 | **Status Icon** | Icon | (496, 440) | (20, 20) | `Timer` 20px `primary-500` | Top, Left |
| 8 | **Status Text** | Text/Body | (528, 440) | (416, 20) | font: `text-sm` `font-body` `font-semibold`, color: `neutral-900` | Top, Left+Right |
| 9 | **Progress Bar** | Progress/Bar | (496, 472) | (448, 8) | track: `neutral-200`, fill: `primary-500`, radius: `radius-full`, height: 8px | Top, Left+Right |
| 10 | **Appointment Card** | Card/Compact | (480, 536) | (480, 80) | bg: `neutral-50`, radius: `radius-lg`, padding: `p-4`, border: `1px solid neutral-200` | Center |
| 11 | **Pro Name** | Text/Body | (496, 552) | (448, 24) | font: `text-base` `font-body` `font-semibold`, color: `neutral-900` | Top, Left+Right |
| 12 | **Details** | Text/Body | (496, 580) | (448, 20) | font: `text-sm` `font-body`, color: `neutral-500` | Top, Left+Right |

### Component Specifications

**Spinner**
- Size: 48×48px
- Color: `primary-500`
- Animation: infinite rotation, 1s linear, `duration-normal`
- SVG-based, not CSS transform for better performance

**Progress Bar**
- Track: `neutral-200`, `radius-full`, 8px height
- Fill: `primary-500`, animates width based on processing stage
- Indeterminate mode: if stage unknown, use shimmering animation (`neutral-200` to `neutral-300`)
- Stages (approximate):
  1. "Iniciando pagamento..." — 0-30%
  2. "Processando transação..." — 30-70%
  3. "Reservando horário..." — 70-100%

**Status Card**
- Updates text dynamically based on backend webhook stage
- Icon changes: `Timer` → `Loader` → `CheckCircle` (on success, before redirect)

**Appointment Card**
- Read-only summary to reassure user of what they're paying for
- Same content as summary card from SB-06 but compact

### States

| State | Description |
|-------|-------------|
| **Processing (default)** | Spinner active. Progress bar advancing. Status text updating. |
| **Hold warning** | If Stripe requires 3DS or additional auth, show modal/drawer with instructions. |
| **Success** | Spinner replaced by `CheckCircle` 48px `primary-500`. Title: "Pagamento confirmado!" Subtitle: "Redirecionando...". Progress bar full. Auto-redirect after 2s. |
| **Error** | Spinner replaced by `XCircle` 48px `error`. Title: "Pagamento não aprovado". Subtitle: error message from gateway. Card shows "Tente novamente" button (returns to SB-06) or "Escolher outro horário" (returns to SB-04). |
| **Timeout** | Same as Error but subtitle: "A conexão demorou demais. Verifique seu agendamento na agenda antes de tentar novamente." |

### Accessibility

- **Live region**: Status text wrapped in `aria-live="polite"` so screen readers announce stage changes.
- **Progress bar**: `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="[current]"`, `aria-label="Progresso do pagamento"`
- **Spinner**: `aria-label="Processando pagamento, por favor aguarde"`, `aria-busy="true"`
- **No interactive elements** during processing (except error state)
- **Error state**: Focus moved to error title automatically. CTA receives focus ring.
- **Reduced motion**: If `prefers-reduced-motion`, spinner static (checkmark), progress bar instant fill, no rotation.

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **All** | Content always centered vertically and horizontally. Max-width 480px. Cards edge-to-edge on mobile with 16px margin. |

---

## Frame SB-08: Confirmation

| Attribute | Value |
|-----------|-------|
| **Frame ID** | `SB-08` |
| **Route** | `/agendar/[id]/confirmacao` |
| **Desktop Dimensions** | 1440 × 900, centered content max-width 560px |
| **Mobile Dimensions** | 375 × 812, centered content with 16px margins |
| **Background** | `surface-page` |
| **Grid** | 8px baseline, centered content max-width 560px |

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Minimal Header (logo only, 64px)                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ✓ (64px circle, green)                      │
│                                                                     │
│                   Agendamento confirmado!                           │
│                                                                     │
│              ┌─────────────────────────────────────┐                │
│              │ [Avatar] Dra. Ana Paula             │                │
│              │ Psicoterapia Individual             │                │
│              │ 24 de abril de 2026, 09:00          │                │
│              │ Presencial                          │                │
│              │                                     │                │
│              │ [Adicionar ao Google Calendar]      │                │
│              │ [Adicionar ao iCal]                 │                │
│              └─────────────────────────────────────┘                │
│                                                                     │
│              Próximos passos:                                       │
│              1. Prepare-se 10 minutos antes                         │
│              2. Leve documentos necessários                         │
│              3. Em caso de cancelamento, avise com 24h              │
│                                                                     │
│              [ Ir para Agenda ]                                     │
│              [ Compartilhar ]                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Layers (Top to Bottom)

| # | Layer Name | Component | Position (x, y) | Size (w, h) | Tokens & Values | Constraints |
|---|------------|-----------|-----------------|-------------|-----------------|-------------|
| 1 | **Minimal Header** | Shell/Minimal | (0, 0) | (1440, 64) | bg: `surface-page`, border-bottom: `1px solid neutral-200`, centered logo only, no navigation | Top, Left+Right |
| 2 | **Success Icon** | Icon/Circle | (688, 120) | (64, 64) | bg: `primary-500`, icon: `Check` 32px white, radius: `radius-full` (circle allowed for status) | Center |
| 3 | **Success Ring** | Shape | (680, 112) | (80, 80) | 4px solid `primary-200`, radius: `radius-full`, optional decorative | Center |
| 4 | **Title** | Text/H1 | (440, 200) | (560, 36) | font: `text-2xl` `font-display` `font-bold`, color: `neutral-900`, text-align: center | Top, Left+Right |
| 5 | **Confirmation Card** | Card/Featured | (440, 252) | (560, auto) | bg: `surface-card`, border: `1px solid neutral-200`, radius: `radius-xl`, padding: `p-6`, shadow: `shadow-none` | Top, Left+Right |
| 6 | **Card Avatar** | Avatar/Medium | (456, 268) | (40, 40) | radius: `radius-full`, object-fit: cover | Top, Left |
| 7 | **Pro Name** | Text/H3 | (508, 272) | (476, 24) | font: `text-base` `font-display` `font-semibold`, color: `neutral-900` | Top, Left+Right |
| 8 | **Service Name** | Text/Body | (508, 300) | (476, 20) | font: `text-sm` `font-body`, color: `neutral-500` | Top, Left+Right |
| 9 | **DateTime Row** | Text/Body | (456, 332) | (528, 20) | icon: `Calendar` 16px `neutral-500`, font: `text-sm` `font-body`, color: `neutral-500` | Top, Left+Right |
| 10 | **Location Row** | Text/Body | (456, 356) | (528, 20) | icon: `MapPin` 16px `neutral-500`, font: `text-sm` `font-body`, color: `neutral-500` | Top, Left+Right |
| 11 | **Card Divider** | Line | (456, 388) | (528, 1) | color: `neutral-200` | Top, Left+Right |
| 12 | **Calendar Button 1** | Button/Secondary | (456, 404) | (528, 40) | icon: `CalendarPlus` 20px left, bg: `surface-card`, border: `1px solid neutral-200`, text: `neutral-700`, radius: `radius-md`, font: `text-sm` `font-semibold` | Top, Left+Right |
| 13 | **Calendar Button 2** | Button/Secondary | (456, 452) | (528, 40) | icon: `Download` 20px left, same styling | Top, Left+Right |
| 14 | **Next Steps Title** | Text/H3 | (440, 520) | (560, 28) | font: `text-lg` `font-display` `font-semibold`, color: `neutral-900` | Top, Left+Right |
| 15 | **Next Steps List** | List/Ordered | (440, 556) | (560, auto) | gap: `space-2`, font: `text-base` `font-body`, color: `neutral-700` | Top, Left+Right |
| 16 | **Step Item** | Text/Body (×3) | (440, 556) | (560, 24) | number: `primary-500` `font-semibold`, text: `neutral-700` | Top, Left+Right |
| 17 | **Primary CTA** | Button/Primary | (440, 640) | (560, 48) | bg: `primary-500`, text: `white`, radius: `radius-md`, font: `text-base` `font-semibold` | Bottom, Left+Right |
| 18 | **Share Button** | Button/Secondary | (440, 696) | (560, 48) | icon: `Share2` 20px left, bg: `neutral-100`, border: `1px solid neutral-200`, text: `neutral-700`, radius: `radius-md` | Bottom, Left+Right |

### Component Specifications

**Success Icon**
- Container: 64×64px circle, bg `primary-500`
- Icon: `Check` 32px, white, stroke-width 2.5px
- Animation: scale-in from 0.8 to 1.0 + fade-in, `duration-slow` (400ms), `ease-enter`
- Optional decorative ring: 80×80px, 4px `primary-200`, scales in slightly delayed (100ms)

**Confirmation Card**
- Padding: `p-6` (24px)
- Internal spacing: 16px between elements
- Calendar buttons: full-width inside card, 40px height
- Button icons: 20px, gap 8px from text

**Calendar Export Buttons**
- "Adicionar ao Google Calendar": generates `.ics` or Google Calendar URL
- "Baixar arquivo iCal (.ics)": direct download
- Both open in new tab or trigger download

**Next Steps List**
- Numbered 1–3
- Number styling: `primary-500`, `font-semibold`, followed by period
- Content:
  1. "Chegue 10 minutos antes do horário agendado."
  2. "Leve documentos de identidade e cartão do convênio (se aplicável)."
  3. "Caso precise cancelar, faça isso com pelo menos 24h de antecedência."

**Share Button**
- Uses Web Share API if available: `navigator.share()`
- Fallback: copy link to clipboard + Toast "Link copiado!"
- Share text: "Agendei uma consulta com [Nome] no Muuday!"

### States

| State | Description |
|-------|-------------|
| **Default (success)** | Success icon scaled in. All content visible. Confetti animation optional (subtle, `brand-bright` particles). |
| **Loading (redirect)** | If accessed directly without valid booking, show skeleton and redirect to `/agenda` after check. |
| **Not found** | EmptyState: `CalendarX` 64px, "Agendamento não encontrado", CTA "Ir para busca". |
| **Calendar added** | Toast: `CheckCircle` "Adicionado ao calendário!" `success-bg`, `success` text. |
| **Link copied** | Toast: `Link` icon, "Link copiado para a área de transferência." |

### Accessibility

- **Success icon**: `role="img"`, `aria-label="Agendamento confirmado com sucesso"`
- **Title**: `aria-live="polite"` on container so screen reader announces confirmation
- **Confirmation card**: `aria-label="Detalhes do agendamento confirmado"`
- **Calendar buttons**: `aria-label="Adicionar ao Google Calendar"`, `aria-label="Baixar arquivo iCal"`
- **Next steps**: `<ol>` with `<li>` for semantic structure
- **Share button**: `aria-label="Compartilhar agendamento"`
- **CTA**: `aria-label="Ir para minha agenda de consultas"`
- **Focus order**: Success icon (decorative, skip) → Title → Confirmation card → Calendar buttons → Next steps → Primary CTA → Share
- **Reduced motion**: No confetti, no scale-in. Static checkmark.

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | Content 560px centered. Confirmation card `radius-xl`. Buttons side by side if needed. |
| **Tablet** | Same as desktop with 24px margins. |
| **Mobile** | Content full width minus 16px margins. Card `radius-lg`. Calendar buttons stack. CTAs full width, sticky optional. |

---

## Cross-Frame Patterns

### Sticky CTA Behavior

| Frame | Desktop CTA | Mobile CTA |
|-------|-------------|------------|
| SB-01 | Inline (card grid) | Inline |
| SB-02 | Floating bottom-right (280×48) | Full-width sticky bottom bar (64px) |
| SB-03 | Full-width bottom bar | Full-width sticky bottom bar (64px) |
| SB-04 | Full-width bottom bar (disabled until valid) | Full-width sticky bottom |
| SB-05 | Inline form button | Full-width sticky bottom |
| SB-06 | Inline column button | Full-width sticky bottom |
| SB-07 | None (processing) | None |
| SB-08 | Inline stacked buttons | Full-width stacked buttons |

### Navigation & Routing

```
SB-01 /buscar
  └─click card─→ SB-02 /profissional/[id]

SB-02 /profissional/[id]
  └─click "Serviços" tab─→ SB-03 /profissional/[id]?tab=servicos
  └─click "Agendar" (sticky)─→ SB-03 or directly to SB-04 if single service

SB-03 /profissional/[id]?tab=servicos
  └─click "Agendar" (service)─→ SB-04 /agendar/[serviceId]

SB-04 /agendar/[id]
  └─select date + slot + check policy + click "Continuar"─→ SB-05 /agendar/[id]/info

SB-05 /agendar/[id]/info
  └─fill form + click "Continuar"─→ SB-06 /agendar/[id]/checkout

SB-06 /agendar/[id]/checkout
  └─select payment + click "Confirmar Pagamento"─→ SB-07 /agendar/[id]/pagamento

SB-07 /agendar/[id]/pagamento
  └─success─→ SB-08 /agendar/[id]/confirmacao
  └─error─→ back to SB-06 with error banner

SB-08 /agendar/[id]/confirmacao
  └─click "Ir para Agenda"─→ /agenda
```

### Empty State Patterns ( reused )

All empty states follow this structure:
- Icon: 64px, `neutral-300`, centered
- Title: `text-xl` `font-display` `font-semibold`, `neutral-900`, centered
- Description: `text-base` `font-body`, `neutral-500`, centered, max-width 400px
- CTA: Secondary button, centered, 48px height

### Error State Patterns

All errors follow this structure:
- Banner: full width, bg `error-bg`, border `1px solid error`, radius `radius-md`, padding `p-4`
- Icon: `AlertTriangle` 20px `error`, left
- Title: `text-sm` `font-semibold`, `error`
- Description: `text-sm` `font-body`, `neutral-700`
- CTA (optional): ghost button, `error` text, "Tentar novamente"

### Skeleton Patterns

- Background: `neutral-100`
- Radius: matches final element (`radius-md` for inputs, `radius-lg` for cards)
- Animation: pulse, `duration-slow`, opacity 0.5 → 1.0
- Respect `prefers-reduced-motion`: static `neutral-100`, no pulse

---

## Frame Checklist for Designers

Before handing off to development, verify each frame has:

- [ ] All layers named and organized in Figma
- [ ] Auto-layout applied correctly (responsive behavior)
- [ ] All colors reference design tokens (not hardcoded hex)
- [ ] All typography uses text styles (not manual overrides)
- [ ] 8px grid alignment verified
- [ ] Touch targets ≥ 44×44px for all interactive elements
- [ ] Focus states designed (2px `primary-500`, offset 2px)
- [ ] Hover states designed for all interactive elements
- [ ] Loading and error states included
- [ ] Empty states included where data may be absent
- [ ] Mobile frame (375px) created and verified
- [ ] Desktop frame (1440px) created and verified
- [ ] All images have placeholder fallbacks specified
- [ ] Accessibility annotations added (landmarks, ARIA roles, focus order)

---

*Muuday Design System — Search & Booking Journey Frames v1.0*


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
