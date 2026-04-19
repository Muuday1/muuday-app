# Admin Operations Journey — Frame Specs

> **Journey:** Admin dashboard, review queue, and decision-making interfaces  
> **Priority:** P2  
> **Route Prefix:** `/admin`  
> **Total Frames:** 3  
> **Date:** 2026-04-19

---

## Frame AO-01: Admin Dashboard (`/admin`)

### Overview
Central command center for platform administrators. Dense data-rich layout with stat cards, charts, and an activity feed. Designed for quick scanning and drill-down actions.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | Sidebar 240px |
| Mobile | 375px | 812px | No sidebar; hamburger nav |

### Layout Structure
```
Page (surface-page, 100vh, flex row)
├── Sidebar (240px, sticky, admin variant)
│   ├── Logo
│   ├── Nav Items (Dashboard, Revisão, Usuários, Profissionais, Financeiro, Config)
│   └── Admin Badge (bottom, "Admin")
├── Main (flex-1, flex column)
│   ├── Header (64px)
│   │   ├── H1: "Dashboard Administrativo"
│   │   └── User Menu (avatar + name, dropdown)
│   └── Content (p-8, gap-8, scrollable)
│       ├── Stat Cards Row (4-col desktop, 2-col mobile)
│       │   ├── Card 1: "Usuários" (value, delta, icon)
│       │   ├── Card 2: "Profissionais" (value, delta, icon)
│       │   ├── Card 3: "Receita" (value, delta, icon)
│       │   └── Card 4: "Disputas" (value, delta, icon)
│       ├── Charts Section (2-col desktop, 1-col mobile, mt-8)
│       │   ├── Card: Revenue Chart (large, 2/3 width)
│       │   └── Card: User Growth (1/3 width)
│       └── Activity Feed (mt-8, full-width)
│           ├── Section Header
│           │   ├── H3: "Atividade Recente"
│           │   └── Link: "Ver tudo"
│           └── Activity List (max 10 items)
│               ├── Item: [Avatar] [Action] [Target] [Time]
│               └── Divider between items
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Sidebar | admin | 1 | 240px, admin nav items |
| Header | default | 1 | With user menu dropdown |
| Card | default | 7 | 4 stats + 2 charts + activity |
| StatCard | default | 4 | Custom pattern with icon + delta |
| Icon | Users, Briefcase, DollarSign, ShieldAlert | 4 | 24px, `primary-500` |
| Avatar | sm | 10+ | Activity feed |
| Button | ghost, sm | 1 | "Ver tudo" link |
| Dropdown | user menu | 1 | Header user actions |
| Badge | admin | 1 | "Admin" badge in sidebar |
| Text | H1, H3, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Sidebar width | — | `240px` |
| Sidebar admin accent | `primary-50` | `#f0fdf4` (active nav bg) |
| Content padding | `space-8` | `32px` |
| Stat cards gap | `space-6` | `24px` |
| Stat card padding | `space-6` | `24px` |
| Stat value font | `text-3xl` / `font-display` / `font-bold` | `39px` Space Grotesk |
| Stat value color | `text-primary` | `#1c1917` |
| Stat delta positive | `primary-500` | `#22c55e` |
| Stat delta negative | `error` | `#ef4444` |
| Stat delta font | `text-sm` / `font-medium` | `13px` |
| Stat icon bg | `primary-50` | `#f0fdf4` |
| Stat icon color | `primary-500` | `#22c55e` |
| Stat icon size | — | `40px` container, `24px` icon |
| Chart card min-height | — | `320px` |
| Activity item gap | `space-4` | `16px` |
| Activity divider | `border-default` | `1px solid #e7e5e4` |
| Timestamp font | `text-xs` / `text-muted` | `10px` `#78716c` |
| Section gap | `space-8` | `32px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | Stats show current values, charts load with animation |
| Loading | Initial data fetch | Skeleton cards for stats, spinner in charts |
| Real-time | New activity | Activity feed updates with `aria-live`, new item highlights briefly |
| Hover | Hover on stat card | Border transitions to `neutral-300`, cursor default |
| Hover | Hover on activity item | Background `neutral-50`, cursor pointer |
| Dropdown open | User menu clicked | `shadow-md` dropdown, `z-dropdown` |
| Error | Data fetch fails | Error boundary card with retry button |
| Mobile | < 1024px | Sidebar hidden, hamburger menu, cards stack 2-col then 1-col |

### Accessibility Notes
- **Sidebar**: `role="navigation"`, `aria-label="Navegação administrativa"`
- **Stat cards**: `role="region"`, `aria-label="[Label] — [Value]"`
- **Charts**: Wrapped in `role="img"` with `aria-label` describing the data trend
- **Activity feed**: `role="feed"`, `aria-busy="true"` during updates
- **Activity items**: Each item is `role="article"` with `aria-label="[User] [Action] [Target]"`
- **Delta indicators**: Positive prefaced with "+" and "aumento de"; negative with "diminuição de"
- **Color independence**: Delta direction conveyed by text prefix (+/-), not color alone
- **Focus order**: Sidebar nav → Header user menu → Stat cards → Charts → Activity feed

---

## Frame AO-02: Review Queue (`/admin/revisao`)

### Overview
Tabular interface for reviewing pending professional verifications. High-density data table with inline actions, status badges, and filtering. The core operational screen for admin trust & safety work.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | Sidebar 240px |
| Mobile | 375px | 812px | No sidebar; card list instead of table |

### Layout Structure
```
Page (surface-page, 100vh, flex row)
├── Sidebar (240px, admin variant)
│   └── Nav: "Revisão" active
├── Main (flex-1, flex column)
│   ├── Header (64px)
│   │   ├── H1: "Fila de Revisão"
│   │   └── Notification Bell (with badge count)
│   └── Content (p-8)
│       ├── Tabs (full-width, border-bottom)
│       │   ├── Tab: "Pendentes" (active, count badge)
│       │   ├── Tab: "Em Análise"
│       │   ├── Tab: "Aprovados"
│       │   └── Tab: "Rejeitados"
│       ├── Toolbar (mt-6, flex between)
│       │   ├── Search Input (320px)
│       │   └── Filter Button (secondary)
│       └── Table Card (mt-6, p-0, overflow-hidden)
│           ├── Table Header (bg-neutral-50)
│           │   ├── Col: Profissional (sortable)
│           │   ├── Col: Especialidade
│           │   ├── Col: Data de Envio (sortable)
│           │   ├── Col: Status
│           │   └── Col: Ações
│           ├── Table Body
│           │   └── Row (hover bg-neutral-50)
│           │       ├── Cell: Avatar + Name + Email
│           │       ├── Cell: Specialty badge
│           │       ├── Cell: Date
│           │       ├── Cell: Status badge
│           │       └── Cell: Approve + Reject buttons
│           └── Table Footer (border-top, p-4)
│               ├── Showing text
│               └── Pagination
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Sidebar | admin | 1 | "Revisão" active |
| Header | default | 1 | With notification bell |
| Tabs | underline | 1 | 4 tabs with count badges |
| SearchBar | default | 1 | 320px width |
| Button | secondary, sm | 1 | Filter button |
| Card | default | 1 | Table container, `p-0` |
| Table | data | 1 | Full-featured data table |
| Avatar | sm | N | One per row |
| Badge | status variants | N | Pending, reviewing, approved, rejected |
| Button | ghost, sm | 2N | Approve (primary color) + Reject (error color) per row |
| Pagination | default | 1 | Bottom of table |
| Text | H1, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Table header bg | `neutral-50` | `#fafaf9` |
| Table header font | `text-xs` / `font-semibold` / `text-secondary` | `10px` uppercase |
| Table row height | — | `64px` |
| Table row hover | `neutral-50` | `#fafaf9` |
| Table cell padding | `px-4 py-3` | `16px 12px` |
| Table border | `border-default` | `1px solid #e7e5e4` |
| Status pending | `warning-bg` / `warning` | `#fef3c7` / `#e8950f` |
| Status reviewing | `info-bg` / `info` | `#eff6ff` / `#3b82f6` |
| Status approved | `success-bg` / `primary-700` | `#f0fdf4` / `#15803d` |
| Status rejected | `error-bg` / `error` | `#fef2f2` / `#ef4444` |
| Action button gap | `space-2` | `8px` |
| Approve button color | `primary-500` | `#22c55e` |
| Reject button color | `error` | `#ef4444` |
| Toolbar margin | `space-6` | `24px` |
| Tab active indicator | `primary-500` | `2px solid #22c55e` |
| Tab count badge | `neutral-100` / `neutral-700` | `#f5f5f4` / `#44403c` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | "Pendentes" tab active, table sorted by date desc |
| Loading | Data fetch | Skeleton rows (5), header visible |
| Empty | No pending items | EmptyState card with "Nenhum item na fila" |
| Tab switch | User clicks tab | Active indicator slides, table content swaps |
| Sort | Column header clicked | Arrow icon rotates, rows reorder |
| Search | Text entered | Table filters in real-time (debounced 300ms) |
| Row hover | Mouse over row | Background `neutral-50`, action buttons visible |
| Approve click | Admin approves | Row fades out, success toast, count updates |
| Reject click | Admin rejects | Confirmation modal appears |
| Batch select | Checkbox checked | Bulk action bar appears at bottom |

### Accessibility Notes
- **Table**: `role="table"`, header cells `role="columnheader"`, sortable headers have `aria-sort`
- **Sortable columns**: Arrow icon has `aria-label="Ordenar por [coluna]"`
- **Status badges**: `aria-label="Status: [estado]"`
- **Action buttons**: Each row's actions have `aria-label="Aprovar [nome]"` and `aria-label="Rejeitar [nome]"`
- **Tab badges**: `aria-label="[Tab] — [count] itens"`
- **Search**: `aria-label="Buscar profissional"`, `role="search"`
- **Pagination**: `aria-label="Paginação"`, current page `aria-current="page"`
- **Row announcements**: `aria-live="polite"` announces "[Nome] aprovado" after action
- **Mobile alternative**: Card list with same information, each card expandable for actions

---

## Frame AO-03: Decision Panel (`/admin/fila/[id]`)

### Overview
Detailed review interface for a single professional verification. Side-by-side document viewer and decision form. The most critical trust & safety screen — designed for thorough, informed decisions.

### Dimensions
| Viewport | Width | Height | Margins |
|----------|-------|--------|---------|
| Desktop | 1440px | 900px | Sidebar 240px |
| Mobile | 375px | 812px | No sidebar; stacked layout |

### Layout Structure
```
Page (surface-page, 100vh, flex row)
├── Sidebar (240px, admin variant)
│   └── Nav: "Revisão" active
├── Main (flex-1, flex column)
│   ├── Header (64px)
│   │   ├── Back Button + "Voltar à fila"
│   │   ├── H1: "Revisão: [Nome do Profissional]"
│   │   └── Urgency Badge (if applicable)
│   └── Content (p-8, gap-6)
│       ├── Two-Column Layout (desktop, gap-6)
│       │   ├── Left Column (60%)
│       │   │   ├── Professional Details Card (p-6)
│       │   │   │   ├── Header Row
│       │   │   │   │   ├── Avatar (lg, 56px)
│       │   │   │   │   ├── Name + Email
│       │   │   │   │   └── Status Badge
│       │   │   │   ├── Info Grid (2-col)
│       │   │   │   │   ├── CPF: ***-**1234**
│       │   │   │   │   ├── Especialidade: Psicologia
│       │   │   │   │   ├── Registro: CRP 06/12345
│       │   │   │   │   └── Data: 15/04/2026
│       │   │   │   └── Bio Textarea (read-only, mt-4)
│       │   │   └── Document Viewer Card (p-6, mt-6)
│       │   │       ├── Tabs: "RG Frente" | "RG Verso" | "Selfie"
│       │   │       └── Image Viewer (aspect-ratio 3/2, bg-neutral-100)
│       │   │           ├── Image (object-contain, max-height 400px)
│       │   │           └── Zoom controls (bottom-right)
│       │   └── Right Column (40%)
│       │       ├── Verification Checklist Card (p-6)
│       │       │   ├── H3: "Checklist de Verificação"
│       │       │   └── Items (checkboxes, admin-filled)
│       │       │       ├── "Documento legível"
│       │       │       ├── "Foto corresponde ao documento"
│       │       │       ├── "Registro profissional válido"
│       │       │       └── "Sem sinais de fraude"
│       │       ├── Notes Form Card (p-6, mt-6)
│       │       │   ├── H3: "Notas da Análise"
│       │       │   ├── Textarea: "Observações internas"
│       │       │   └── Select: "Motivo" (for rejections)
│       │       └── Decision Actions Card (p-6, mt-6)
│       │           ├── Button: "Aprovar Profissional" (primary, full-width)
│       │           ├── Button: "Solicitar Mais Informações" (secondary, full-width)
│       │           └── Button: "Rejeitar Cadastro" (danger, full-width)
```

### Components Used
| Component | Variant | Count | Notes |
|-----------|---------|-------|-------|
| Sidebar | admin | 1 | "Revisão" active |
| Header | default | 1 | With back button |
| Card | default | 5 | Details, document, checklist, notes, actions |
| Avatar | lg | 1 | 56px |
| Badge | status | 1 | Current review status |
| Tabs | underline | 1 | Document tabs |
| Image viewer | default | 1 | With zoom controls |
| Checkbox | read-only | 4 | Admin checklist |
| Textarea | default | 1 | Internal notes |
| Select | default | 1 | Rejection reason |
| Button | primary, lg | 1 | Approve |
| Button | secondary, lg | 1 | Request info |
| Button | danger, lg | 1 | Reject |
| Button | ghost, sm | 1 | Back |
| Icon | ArrowLeft, ZoomIn, ZoomOut | 3 | Navigation and zoom |
| Text | H1, H3, body, caption | — | Hierarchy |

### Token Values
| Element | Token | Value |
|---------|-------|-------|
| Two-col gap | `space-6` | `24px` |
| Left column | — | `60%` width |
| Right column | — | `40%` width |
| Details card padding | `space-6` | `24px` |
| Document viewer bg | `neutral-100` | `#f5f5f4` |
| Document viewer radius | `radius-md` | `8px` |
| Document image max-height | — | `400px` |
| Checklist gap | `space-3` | `12px` |
| Checklist item height | — | `40px` |
| Decision card gap | `space-3` | `12px` |
| Approve button bg | `primary-500` | `#22c55e` |
| Danger button bg | `error` | `#ef4444` |
| Danger button hover | darker error | `#dc2626` |
| Info grid gap | `space-4` | `16px` |
| Mobile stack gap | `space-6` | `24px` |

### States
| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page load | All documents load, checklist unchecked |
| Loading | Data fetch | Skeleton for details, spinner in document viewer |
| Document loading | Image loading | Spinner in viewer, gray background |
| Document loaded | Image ready | Image appears with fade-in |
| Zoom in | User clicks + | Image scales up (max 200%) |
| Zoom out | User clicks - | Image scales down (min 50%) |
| Checklist filled | Admin checks items | Progress indicator updates |
| Approve hover | Hover on approve | Background shifts to `primary-600` |
| Reject hover | Hover on reject | Background shifts to darker red |
| Approve click | Admin approves | Confirmation modal, then success + redirect |
| Reject click | Admin rejects | If no notes, show validation error; else confirmation modal |
| Request info click | Admin requests docs | Modal with email preview, then success toast |
| Mobile | < 1024px | Single column stack: details → documents → checklist → notes → actions |

### Accessibility Notes
- **Back button**: `aria-label="Voltar à fila de revisão"`
- **Document tabs**: `role="tablist"`, images `role="tabpanel"`, `aria-label="Documentos enviados"`
- **Image viewer**: `aria-label="Documento ampliado"`, zoom controls have `aria-label="Aumentar zoom"` / `Diminuir zoom`
- **Checklist**: `role="group"`, `aria-label="Checklist de verificação"`, each item `role="checkbox"`
- **Notes textarea**: `aria-required="true"` for rejections, `aria-describedby` linked to helper
- **Decision buttons**: 
  - Approve: `aria-describedby` linked to checklist summary
  - Reject: `aria-describedby` linked to notes validation
- **Confirmation modals**: Both approve and reject trigger `ConfirmationDialog` with summary
- **Focus order**: Back → Document tabs → Image → Zoom → Checklist → Notes → Reason → Approve → Request info → Reject
- **Screen reader**: Document alt text should describe the document type, e.g., "Frente do RG de [Nome]"

---

*Frame specs for Admin Operations complete. Reference `tokens.md` and `components.md` for component-level details.*
